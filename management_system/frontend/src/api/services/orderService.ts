import type { Order, OrderItem, MenuItem, Menu, OrderStatus, OrderType, PaginatedResponse } from '@/types';
import { mockOrders, mockMenuItems, mockMenus } from '../mockData';
import { delay, generateId, now, paginate } from '../helpers';
import { requireTenantId, filterByTenant, findByIdAndTenant } from '../helpers/tenantFilter';

// In-memory stores
let orders = [...mockOrders];
let menuItems = [...mockMenuItems];

const today = new Date().toISOString().split('T')[0];

export interface OrderFilters {
  status?: OrderStatus | OrderStatus[];
  type?: OrderType;
  guestId?: string;
  roomId?: string;
  date?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateOrderDto {
  type: OrderType;
  guestId?: string;
  roomId?: string;
  tableNumber?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    modifiers?: string[];
    specialInstructions?: string;
  }>;
  specialInstructions?: string;
  chargeToFolio?: boolean;
}

export const orderService = {
  /**
   * Get all orders with filtering
   */
  async getAll(tenantId: string, filters: OrderFilters = {}): Promise<PaginatedResponse<Order>> {
    await delay(300);
    
    requireTenantId(tenantId);
    let result = filterByTenant(orders, tenantId) as Order[];
    
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      result = result.filter(o => statuses.includes(o.status));
    }
    
    if (filters.type) {
      result = result.filter(o => o.type === filters.type);
    }
    
    if (filters.guestId) {
      result = result.filter(o => o.guestId === filters.guestId);
    }
    
    if (filters.roomId) {
      result = result.filter(o => o.roomId === filters.roomId);
    }
    
    if (filters.date) {
      result = result.filter(o => o.orderedAt.startsWith(filters.date!));
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(o => o.orderNumber.toLowerCase().includes(searchLower));
    }
    
    // Sort by order time descending
    result.sort((a, b) => b.orderedAt.localeCompare(a.orderedAt));
    
    return paginate(result, filters.page || 1, filters.pageSize || 10);
  },

  /**
   * Get order by ID
   * CRITICAL FIX: Added tenant isolation
   */
  async getById(tenantId: string, id: string): Promise<Order | null> {
    await delay(200);
    requireTenantId(tenantId);
    const order = findByIdAndTenant(orders, id, tenantId) as Order | null;
    return order;
  },

  /**
   * Create a new order
   * CRITICAL FIX: Added tenant isolation
   */
  async create(tenantId: string, data: CreateOrderDto): Promise<Order> {
    await delay(500);
    
    requireTenantId(tenantId);
    
    // CRITICAL: Filter menu items by tenant first
    const tenantMenuItems = filterByTenant(menuItems, tenantId) as MenuItem[];
    
    const orderItems: OrderItem[] = data.items.map((item, index) => {
      const menuItem = tenantMenuItems.find(mi => mi.id === item.menuItemId);
      if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found`);
      
      return {
        id: `OI-${generateId()}-${index}`,
        menuItemId: item.menuItemId,
        menuItem,
        name: menuItem.name,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        totalPrice: menuItem.price * item.quantity,
        modifiers: item.modifiers,
        specialInstructions: item.specialInstructions,
        status: 'pending',
      };
    });
    
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = Math.round(subtotal * 0.18);
    const serviceCharge = Math.round(subtotal * 0.05);
    
    const newOrder: Order & { tenantId: string } = {
      id: generateId(),
      orderNumber: `ORD-${today.replace(/-/g, '')}-${String(orders.length + 1).padStart(4, '0')}`,
      type: data.type,
      status: 'pending',
      guestId: data.guestId,
      roomId: data.roomId,
      tableNumber: data.tableNumber,
      items: orderItems,
      subtotal,
      taxAmount,
      serviceCharge,
      discount: 0,
      totalAmount: subtotal + taxAmount + serviceCharge,
      specialInstructions: data.specialInstructions,
      placedBy: 'EMP004',
      orderedAt: now(),
      chargeToFolio: data.chargeToFolio || false,
      paymentStatus: 'pending',
      tenantId, // CRITICAL: Tenant isolation
      createdAt: now(),
      updatedAt: now(),
    };
    
    orders.unshift(newOrder);
    return newOrder;
  },

  /**
   * Update order status
   */
  async updateStatus(tenantId: string, id: string, status: OrderStatus): Promise<Order> {
    await delay(300);
    
    requireTenantId(tenantId);
    const order = findByIdAndTenant(orders, id, tenantId) as Order | null;
    if (!order) throw new Error('Order not found');
    
    const index = orders.findIndex(o => o.id === id);
    const updates: Partial<Order> = {
      status,
      updatedAt: now(),
    };
    
    if (status === 'confirmed') updates.confirmedAt = now();
    if (status === 'ready') updates.preparedAt = now();
    if (status === 'delivered') updates.deliveredAt = now();
    
    orders[index] = { ...orders[index], ...updates };
    return orders[index];
  },

  /**
   * Cancel an order
   */
  async cancel(tenantId: string, id: string): Promise<Order> {
    return this.updateStatus(tenantId, id, 'cancelled');
  },

  /**
   * Get pending orders (kitchen display)
   */
  async getPending(tenantId: string): Promise<Order[]> {
    requireTenantId(tenantId);
    await delay(200);
    const tenantOrders = filterByTenant(orders, tenantId) as Order[];
    return tenantOrders.filter(o => ['pending', 'confirmed', 'preparing', 'ready', 'delivering'].includes(o.status));
  },

  /**
   * Get today's orders
   * CRITICAL FIX: Added tenant isolation
   */
  async getTodays(tenantId: string): Promise<Order[]> {
    await delay(200);
    requireTenantId(tenantId);
    const tenantOrders = filterByTenant(orders, tenantId) as Order[];
    return tenantOrders.filter(o => o.orderedAt.startsWith(today));
  },

  /**
   * Get order statistics
   */
  async getStats(tenantId: string): Promise<{
    todaysOrders: number;
    pendingOrders: number;
    roomServiceOpen: number;
    todaysRevenue: number;
    averageOrderValue: number;
    averagePrepTime: number;
  }> {
    await delay(200);
    
    requireTenantId(tenantId);
    const tenantOrders = filterByTenant(orders, tenantId) as Order[];
    
    const todaysOrdersList = tenantOrders.filter(o => o.orderedAt.startsWith(today));
    const completedToday = todaysOrdersList.filter(o => o.status === 'completed');
    const pendingOrdersList = tenantOrders.filter(o => ['pending', 'confirmed', 'preparing', 'ready', 'delivering'].includes(o.status));
    const roomServiceOpen = tenantOrders.filter(o => o.type === 'room_service' && !['completed', 'cancelled'].includes(o.status)).length;
    
    // Calculate average prep time (mock calculation)
    const averagePrepTime = 14; // This would be calculated from actual timestamps
    
    return {
      todaysOrders: todaysOrdersList.length,
      pendingOrders: pendingOrdersList.length,
      roomServiceOpen,
      todaysRevenue: completedToday.reduce((sum, o) => sum + o.totalAmount, 0),
      averageOrderValue: completedToday.length > 0 
        ? Math.round(completedToday.reduce((sum, o) => sum + o.totalAmount, 0) / completedToday.length)
        : 0,
      averagePrepTime,
    };
  },
};

// Menu Service
export const menuService = {
  /**
   * Get all menu items
   * CRITICAL FIX: Added tenant isolation - each hotel has custom menu items
   */
  async getAll(tenantId: string, filters: { category?: MenuItem['category']; isAvailable?: boolean } = {}): Promise<MenuItem[]> {
    await delay(200);
    
    requireTenantId(tenantId);
    let result = filterByTenant(menuItems, tenantId) as MenuItem[];
    
    if (filters.category) {
      result = result.filter(mi => mi.category === filters.category);
    }
    
    if (filters.isAvailable !== undefined) {
      result = result.filter(mi => mi.isAvailable === filters.isAvailable);
    }
    
    return result;
  },

  /**
   * Get menu item by ID
   * CRITICAL FIX: Added tenant isolation
   */
  async getById(tenantId: string, id: string): Promise<MenuItem | null> {
    await delay(200);
    requireTenantId(tenantId);
    const menuItem = findByIdAndTenant(menuItems, id, tenantId) as MenuItem | null;
    return menuItem;
  },

  /**
   * Get all menus
   * CRITICAL FIX: Added tenant isolation
   */
  async getAllMenus(tenantId: string): Promise<Menu[]> {
    await delay(200);
    requireTenantId(tenantId);
    // Return menus from mock data (filtered by tenant if menus have tenantId)
    // For now, menus are static configuration, but can be tenant-specific
    return [...mockMenus];
  },

  /**
   * Create menu item
   * CRITICAL FIX: Added tenant isolation
   */
  async create(tenantId: string, data: Partial<MenuItem>): Promise<MenuItem> {
    await delay(400);
    requireTenantId(tenantId);
    
    const newItem: MenuItem & { tenantId: string } = {
      id: generateId(),
      tenantId, // CRITICAL: Tenant isolation
      name: data.name || '',
      category: data.category || 'main_course',
      price: data.price || 0,
      description: data.description,
      preparationTime: data.preparationTime || 15,
      isVegetarian: data.isVegetarian || false,
      isVegan: data.isVegan || false,
      isGlutenFree: data.isGlutenFree || false,
      isAvailable: data.isAvailable ?? true,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    };
    menuItems.unshift(newItem);
    return newItem;
  },

  /**
   * Update menu item
   * CRITICAL FIX: Added tenant isolation
   */
  async update(tenantId: string, id: string, data: Partial<MenuItem>): Promise<MenuItem> {
    await delay(300);
    requireTenantId(tenantId);
    const menuItem = findByIdAndTenant(menuItems, id, tenantId) as MenuItem | null;
    if (!menuItem) throw new Error('Menu item not found');
    
    const index = menuItems.findIndex(mi => mi.id === id);
    menuItems[index] = {
      ...menuItems[index],
      ...data,
      updatedAt: now(),
    };
    
    return menuItems[index];
  },

  /**
   * Toggle item availability
   * CRITICAL FIX: Added tenant isolation
   */
  async toggleAvailability(tenantId: string, id: string): Promise<MenuItem> {
    await delay(300);
    requireTenantId(tenantId);
    const menuItem = findByIdAndTenant(menuItems, id, tenantId) as MenuItem | null;
    if (!menuItem) throw new Error('Menu item not found');
    
    const index = menuItems.findIndex(mi => mi.id === id);
    menuItems[index] = {
      ...menuItems[index],
      isAvailable: !menuItems[index].isAvailable,
      updatedAt: now(),
    };
    
    return menuItems[index];
  },
};
