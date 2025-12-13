import type { Order, OrderItem, MenuItem, Menu, OrderStatus, OrderType, PaginatedResponse } from '@/types';
import { mockOrders, mockMenuItems, mockMenus, getTodaysOrders, getPendingOrders } from '../mockData';
import { delay, generateId, now, paginate } from '../helpers';

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
  async getAll(filters: OrderFilters = {}): Promise<PaginatedResponse<Order>> {
    await delay(300);
    
    let result = [...orders];
    
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
   */
  async getById(id: string): Promise<Order | null> {
    await delay(200);
    return orders.find(o => o.id === id) || null;
  },

  /**
   * Create a new order
   */
  async create(data: CreateOrderDto): Promise<Order> {
    await delay(500);
    
    const orderItems: OrderItem[] = data.items.map((item, index) => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
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
    
    const newOrder: Order = {
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
      createdAt: now(),
      updatedAt: now(),
    };
    
    orders.unshift(newOrder);
    return newOrder;
  },

  /**
   * Update order status
   */
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    await delay(300);
    
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Order not found');
    
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
  async cancel(id: string): Promise<Order> {
    return this.updateStatus(id, 'cancelled');
  },

  /**
   * Get pending orders (kitchen display)
   */
  async getPending(): Promise<Order[]> {
    await delay(200);
    return getPendingOrders();
  },

  /**
   * Get today's orders
   */
  async getTodays(): Promise<Order[]> {
    await delay(200);
    return getTodaysOrders();
  },

  /**
   * Get order statistics
   */
  async getStats(): Promise<{
    todaysOrders: number;
    pendingOrders: number;
    todaysRevenue: number;
    averageOrderValue: number;
  }> {
    await delay(200);
    
    const todaysOrders = getTodaysOrders();
    const completedToday = todaysOrders.filter(o => o.status === 'completed');
    
    return {
      todaysOrders: todaysOrders.length,
      pendingOrders: getPendingOrders().length,
      todaysRevenue: completedToday.reduce((sum, o) => sum + o.totalAmount, 0),
      averageOrderValue: completedToday.length > 0 
        ? Math.round(completedToday.reduce((sum, o) => sum + o.totalAmount, 0) / completedToday.length)
        : 0,
    };
  },
};

// Menu Service
export const menuService = {
  /**
   * Get all menu items
   */
  async getAllItems(filters: { category?: MenuItem['category']; isAvailable?: boolean } = {}): Promise<MenuItem[]> {
    await delay(200);
    
    let result = [...menuItems];
    
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
   */
  async getItemById(id: string): Promise<MenuItem | null> {
    await delay(200);
    return menuItems.find(mi => mi.id === id) || null;
  },

  /**
   * Get all menus
   */
  async getAllMenus(): Promise<Menu[]> {
    await delay(200);
    return mockMenus;
  },

  /**
   * Toggle item availability
   */
  async toggleAvailability(id: string): Promise<MenuItem> {
    await delay(300);
    
    const index = menuItems.findIndex(mi => mi.id === id);
    if (index === -1) throw new Error('Menu item not found');
    
    menuItems[index] = {
      ...menuItems[index],
      isAvailable: !menuItems[index].isAvailable,
      updatedAt: now(),
    };
    
    return menuItems[index];
  },
};
