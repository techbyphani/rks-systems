import type { InventoryItem, InventoryCategory, Vendor, StockMovement, PaginatedResponse } from '@/types';
import { mockInventoryItems, mockInventoryCategories, mockVendors } from '../mockData';
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
   * Create a new inventory item
   */
  async create(data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> {
    await delay(400);
    
    // Check if SKU already exists
    if (items.some(i => i.sku === data.sku)) {
      throw new Error('SKU already exists');
    }
    
    const newItem: InventoryItem = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    
    items.unshift(newItem);
    return newItem;
  },

  /**
   * Update an inventory item
   */
  async update(id: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
    await delay(400);
    
    const index = items.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Item not found');
    
    // Check SKU uniqueness if changing
    if (data.sku && items.some((i, idx) => i.sku === data.sku && idx !== index)) {
      throw new Error('SKU already exists');
    }
    
    items[index] = {
      ...items[index],
      ...data,
      updatedAt: now(),
    };
    
    return items[index];
  },

  /**
   * Delete an inventory item
   */
  async delete(id: string): Promise<void> {
    await delay(300);
    
    const index = items.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Item not found');
    
    // Soft delete by marking as inactive
    items[index] = {
      ...items[index],
      isActive: false,
      updatedAt: now(),
    };
  },

  /**
   * Get low stock items
   */
  async getLowStock(): Promise<InventoryItem[]> {
    await delay(200);
    return items.filter(i => i.isActive && i.currentStock <= i.reorderPoint);
  },

  /**
   * Get all stock movements
   */
  async getAllStockMovements(filters: { itemId?: string; type?: StockMovement['type']; page?: number; pageSize?: number } = {}): Promise<PaginatedResponse<StockMovement>> {
    await delay(300);
    
    let result = [...stockMovements];
    
    if (filters.itemId) {
      result = result.filter(m => m.itemId === filters.itemId);
    }
    
    if (filters.type) {
      result = result.filter(m => m.type === filters.type);
    }
    
    // Sort by date descending
    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    
    return paginate(result, filters.page || 1, filters.pageSize || 10);
  },

  /**
   * Get stock movements for an item
   */
  async getStockMovements(itemId: string): Promise<StockMovement[]> {
    await delay(200);
    return stockMovements.filter(m => m.itemId === itemId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
    return categories.filter(c => c.isActive).sort((a, b) => a.name.localeCompare(b.name));
  },

  async getById(id: string): Promise<InventoryCategory | null> {
    await delay(200);
    return categories.find(c => c.id === id) || null;
  },

  async create(data: Omit<InventoryCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryCategory> {
    await delay(400);
    
    // Check if name already exists
    if (categories.some(c => c.name.toLowerCase() === data.name.toLowerCase())) {
      throw new Error('Category name already exists');
    }
    
    const newCategory: InventoryCategory = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    
    categories.unshift(newCategory);
    return newCategory;
  },

  async update(id: string, data: Partial<InventoryCategory>): Promise<InventoryCategory> {
    await delay(400);
    
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Category not found');
    
    // Check name uniqueness if changing
    if (data.name && categories.some((c, idx) => c.name.toLowerCase() === data.name!.toLowerCase() && idx !== index)) {
      throw new Error('Category name already exists');
    }
    
    categories[index] = {
      ...categories[index],
      ...data,
      updatedAt: now(),
    };
    
    return categories[index];
  },

  async delete(id: string): Promise<void> {
    await delay(300);
    
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Category not found');
    
    // Check if category is in use
    if (items.some(i => i.categoryId === id)) {
      throw new Error('Cannot delete category that has items');
    }
    
    // Soft delete
    categories[index] = {
      ...categories[index],
      isActive: false,
      updatedAt: now(),
    };
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

  async delete(id: string): Promise<void> {
    await delay(300);
    
    const index = vendors.findIndex(v => v.id === id);
    if (index === -1) throw new Error('Vendor not found');
    
    // Soft delete
    vendors[index] = {
      ...vendors[index],
      status: 'inactive',
      updatedAt: now(),
    };
  },
};
