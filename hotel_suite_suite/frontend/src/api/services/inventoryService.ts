import type { InventoryItem, InventoryCategory, Vendor, StockMovement, PaginatedResponse } from '@/types';
import { mockInventoryItems, mockInventoryCategories, mockVendors, getLowStockItems } from '../mockData';
import { delay, generateId, now, paginate } from '../helpers';

// In-memory stores
let items = [...mockInventoryItems];
let categories = [...mockInventoryCategories];
let vendors = [...mockVendors];
let stockMovements: StockMovement[] = [];

export interface InventoryFilters {
  search?: string;
  categoryId?: string;
  isLowStock?: boolean;
  isPerishable?: boolean;
  page?: number;
  pageSize?: number;
}

export const inventoryService = {
  /**
   * Get all inventory items
   */
  async getAll(filters: InventoryFilters = {}): Promise<PaginatedResponse<InventoryItem>> {
    await delay(300);
    
    let result = [...items];
    
    if (filters.categoryId) {
      result = result.filter(i => i.categoryId === filters.categoryId);
    }
    
    if (filters.isLowStock) {
      result = result.filter(i => i.currentStock <= i.reorderPoint);
    }
    
    if (filters.isPerishable !== undefined) {
      result = result.filter(i => i.isPerishable === filters.isPerishable);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(i =>
        i.name.toLowerCase().includes(searchLower) ||
        i.sku.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by name
    result.sort((a, b) => a.name.localeCompare(b.name));
    
    return paginate(result, filters.page || 1, filters.pageSize || 10);
  },

  /**
   * Get item by ID
   */
  async getById(id: string): Promise<InventoryItem | null> {
    await delay(200);
    return items.find(i => i.id === id) || null;
  },

  /**
   * Update stock (add or remove)
   */
  async updateStock(id: string, quantity: number, type: StockMovement['type'], notes?: string): Promise<InventoryItem> {
    await delay(400);
    
    const index = items.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Item not found');
    
    const item = items[index];
    const previousStock = item.currentStock;
    const newStock = type.includes('add') || type === 'purchase' || type === 'transfer_in'
      ? previousStock + quantity
      : previousStock - quantity;
    
    if (newStock < 0) throw new Error('Insufficient stock');
    
    // Create stock movement record
    const movement: StockMovement = {
      id: generateId(),
      itemId: id,
      item,
      type,
      quantity,
      previousStock,
      newStock,
      notes,
      performedBy: 'EMP007',
      createdAt: now(),
      updatedAt: now(),
    };
    stockMovements.unshift(movement);
    
    // Update item
    items[index] = {
      ...item,
      currentStock: newStock,
      updatedAt: now(),
    };
    
    return items[index];
  },

  /**
   * Get low stock items
   */
  async getLowStock(): Promise<InventoryItem[]> {
    await delay(200);
    return getLowStockItems();
  },

  /**
   * Get stock movements for an item
   */
  async getStockMovements(itemId: string): Promise<StockMovement[]> {
    await delay(200);
    return stockMovements.filter(m => m.itemId === itemId);
  },

  /**
   * Get inventory statistics
   */
  async getStats(): Promise<{
    totalItems: number;
    lowStockItems: number;
    outOfStock: number;
    totalValue: number;
  }> {
    await delay(200);
    
    const lowStock = items.filter(i => i.currentStock <= i.reorderPoint);
    const outOfStock = items.filter(i => i.currentStock === 0);
    const totalValue = items.reduce((sum, i) => sum + (i.currentStock * i.unitCost), 0);
    
    return {
      totalItems: items.length,
      lowStockItems: lowStock.length,
      outOfStock: outOfStock.length,
      totalValue,
    };
  },
};

// Category Service
export const categoryService = {
  async getAll(): Promise<InventoryCategory[]> {
    await delay(200);
    return categories.filter(c => c.isActive);
  },

  async getById(id: string): Promise<InventoryCategory | null> {
    await delay(200);
    return categories.find(c => c.id === id) || null;
  },
};

// Vendor Service
export const vendorService = {
  async getAll(filters: { status?: Vendor['status']; search?: string } = {}): Promise<Vendor[]> {
    await delay(200);
    
    let result = [...vendors];
    
    if (filters.status) {
      result = result.filter(v => v.status === filters.status);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(v =>
        v.name.toLowerCase().includes(searchLower) ||
        v.contactPerson.toLowerCase().includes(searchLower)
      );
    }
    
    return result;
  },

  async getById(id: string): Promise<Vendor | null> {
    await delay(200);
    return vendors.find(v => v.id === id) || null;
  },

  async create(data: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vendor> {
    await delay(400);
    
    const newVendor: Vendor = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    
    vendors.unshift(newVendor);
    return newVendor;
  },

  async update(id: string, data: Partial<Vendor>): Promise<Vendor> {
    await delay(400);
    
    const index = vendors.findIndex(v => v.id === id);
    if (index === -1) throw new Error('Vendor not found');
    
    vendors[index] = {
      ...vendors[index],
      ...data,
      updatedAt: now(),
    };
    
    return vendors[index];
  },
};
