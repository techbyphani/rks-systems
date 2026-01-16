import type { 
  InventoryItem, 
  InventoryCategory, 
  Vendor, 
  StockMovement, 
  PaginatedResponse,
  StockStatus,
  WastageRecord,
  ConsumptionRecord,
  CategoryExpense,
  StockValueTrend
} from '@/types';
import { mockInventoryItems, mockInventoryCategories, mockVendors } from '../mockData';
import { delay, generateId, now, paginate } from '../helpers';
import { requireTenantId, filterByTenant, findByIdAndTenant } from '../helpers/tenantFilter';
import { NotFoundError, ValidationError, BusinessRuleError } from '../errors';

// In-memory stores
let items = [...mockInventoryItems];
let categories = [...mockInventoryCategories];
let vendors = [...mockVendors];
let stockMovements: StockMovement[] = [];
let wastageRecords: WastageRecord[] = [];
let consumptionRecords: ConsumptionRecord[] = [];

export interface InventoryFilters {
  search?: string;
  categoryId?: string;
  isLowStock?: boolean;
  isPerishable?: boolean;
  tenantId?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Calculate stock status based on current stock vs reorder point
 * CONCEPT: Auto-calculated status system (from HotelInventoryManager)
 */
export function calculateStockStatus(item: InventoryItem): StockStatus {
  if (item.currentStock === 0) return 'Out of Stock';
  if (item.currentStock <= item.reorderPoint) return 'Low Stock';
  return 'In Stock';
}

export const inventoryService = {
  /**
   * Get all inventory items
   */
  async getAll(tenantId: string, filters: InventoryFilters = {}): Promise<PaginatedResponse<InventoryItem>> {
    await delay(300);
    requireTenantId(tenantId);
    
    let result = filterByTenant(items, tenantId) as InventoryItem[];
    
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
  async getById(tenantId: string, id: string): Promise<InventoryItem | null> {
    await delay(200);
    requireTenantId(tenantId);
    return findByIdAndTenant(items, id, tenantId);
  },

  /**
   * Update stock (add or remove)
   * UPDATED: Automatically tracks consumption for consumption-type movements
   */
  async updateStock(tenantId: string, id: string, quantity: number, type: StockMovement['type'], notes?: string): Promise<InventoryItem> {
    await delay(400);
    requireTenantId(tenantId);
    
    const item = findByIdAndTenant(items, id, tenantId);
    if (!item) {
      throw new NotFoundError('Inventory Item', id);
    }
    
    const index = items.findIndex(i => i.id === id && i.tenantId === tenantId);
    const previousStock = item.currentStock;
    const newStock = type.includes('add') || type === 'purchase' || type === 'transfer_in'
      ? previousStock + quantity
      : previousStock - quantity;
    
    if (newStock < 0) {
      throw new BusinessRuleError('Insufficient stock');
    }
    
    // Create stock movement record
    const movement: StockMovement = {
      id: generateId(),
      itemId: id,
      item,
      type,
      quantity,
      previousStock,
      newStock,
      unitCost: item.unitCost,
      totalCost: quantity * item.unitCost,
      notes,
      performedBy: 'EMP007',
      createdAt: now(),
      updatedAt: now(),
    };
    stockMovements.unshift(movement);
    
    // Track consumption for consumption-type movements
    if (type === 'consumption' || type === 'waste') {
      await this.trackConsumption(tenantId, id, quantity, movement.id);
    }
    
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
  async create(tenantId: string, data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>): Promise<InventoryItem> {
    await delay(400);
    requireTenantId(tenantId);
    
    // Check if SKU already exists for this tenant
    const tenantItems = filterByTenant(items, tenantId) as InventoryItem[];
    if (tenantItems.some(i => i.sku === data.sku)) {
      throw new Error('SKU already exists');
    }
    
    const newItem: InventoryItem = {
      ...data,
      tenantId,
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
  async update(tenantId: string, id: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
    await delay(400);
    requireTenantId(tenantId);
    
    const item = findByIdAndTenant(items, id, tenantId);
    if (!item) throw new Error('Item not found');
    
    const index = items.findIndex(i => i.id === id && i.tenantId === tenantId);
    
    // Check SKU uniqueness if changing (only within tenant)
    if (data.sku) {
      const tenantItems = filterByTenant(items, tenantId) as InventoryItem[];
      if (tenantItems.some((i, idx) => i.sku === data.sku && i.id !== id)) {
        throw new Error('SKU already exists');
      }
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
  async delete(tenantId: string, id: string): Promise<void> {
    await delay(300);
    requireTenantId(tenantId);
    
    const item = findByIdAndTenant(items, id, tenantId);
    if (!item) throw new Error('Item not found');
    
    const index = items.findIndex(i => i.id === id && i.tenantId === tenantId);
    
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
  async getLowStock(tenantId: string): Promise<InventoryItem[]> {
    await delay(200);
    requireTenantId(tenantId);
    const tenantItems = filterByTenant(items, tenantId) as InventoryItem[];
    return tenantItems.filter(i => i.isActive && i.currentStock <= i.reorderPoint);
  },

  /**
   * Get all stock movements
   */
  async getAllStockMovements(tenantId: string, filters: { itemId?: string; type?: StockMovement['type']; page?: number; pageSize?: number } = {}): Promise<PaginatedResponse<StockMovement>> {
    await delay(300);
    requireTenantId(tenantId);
    
    // Filter movements by items that belong to tenant
    const tenantItems = filterByTenant(items, tenantId) as InventoryItem[];
    const tenantItemIds = new Set(tenantItems.map(i => i.id));
    
    let result = stockMovements.filter(m => tenantItemIds.has(m.itemId));
    
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
  async getStockMovements(tenantId: string, itemId: string): Promise<StockMovement[]> {
    await delay(200);
    requireTenantId(tenantId);
    
    // Verify item belongs to tenant
    const item = findByIdAndTenant(items, itemId, tenantId);
    if (!item) throw new Error('Item not found');
    
    return stockMovements.filter(m => m.itemId === itemId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  /**
   * Get inventory statistics
   * UPDATED: Uses calculateStockStatus for consistent status calculation
   */
  async getStats(tenantId: string): Promise<{
    totalItems: number;
    lowStockItems: number;
    outOfStock: number;
    totalValue: number;
  }> {
    await delay(200);
    requireTenantId(tenantId);
    
    const tenantItems = filterByTenant(items, tenantId) as InventoryItem[];
    const activeItems = tenantItems.filter(i => i.isActive);
    const lowStock = activeItems.filter(i => calculateStockStatus(i) === 'Low Stock');
    const outOfStock = activeItems.filter(i => calculateStockStatus(i) === 'Out of Stock');
    const totalValue = activeItems.reduce((sum, i) => sum + (i.currentStock * i.unitCost), 0);
    
    return {
      totalItems: activeItems.length,
      lowStockItems: lowStock.length,
      outOfStock: outOfStock.length,
      totalValue,
    };
  },

  /**
   * Get stock status for an item
   * CONCEPT: Auto-calculated status system
   */
  async getStockStatus(tenantId: string, itemId: string): Promise<StockStatus> {
    await delay(100);
    requireTenantId(tenantId);
    const item = findByIdAndTenant(items, itemId, tenantId);
    if (!item) {
      throw new NotFoundError('Inventory Item', itemId);
    }
    return calculateStockStatus(item);
  },

  /**
   * Report wastage for an inventory item
   * CONCEPT: Wastage tracking (from HotelInventoryManager)
   */
  async reportWastage(
    tenantId: string,
    itemId: string,
    quantity: number,
    reason: WastageRecord['reason'],
    notes?: string,
    reportedBy: string = 'system'
  ): Promise<WastageRecord> {
    await delay(400);
    requireTenantId(tenantId);
    
    const item = findByIdAndTenant(items, itemId, tenantId);
    if (!item) {
      throw new NotFoundError('Inventory Item', itemId);
    }
    
    if (quantity <= 0) {
      throw new ValidationError('Quantity must be greater than 0');
    }
    
    if (quantity > item.currentStock) {
      throw new BusinessRuleError(`Cannot report wastage of ${quantity} when current stock is ${item.currentStock}`);
    }
    
    const wastageCost = quantity * item.unitCost;
    
    // Create wastage record
    const wastage: WastageRecord = {
      id: generateId(),
      tenantId,
      itemId,
      item,
      quantity,
      reason,
      cost: wastageCost,
      notes,
      reportedBy,
      createdAt: now(),
      updatedAt: now(),
    };
    
    wastageRecords.unshift(wastage);
    
    // Update stock (reduce quantity) - use waste movement type
    await this.updateStock(tenantId, itemId, quantity, 'waste', notes || `Wastage: ${reason}`);
    
    return wastage;
  },

  /**
   * Get wastage records
   * CONCEPT: Wastage tracking
   */
  async getWastageRecords(
    tenantId: string,
    filters: {
      itemId?: string;
      reason?: WastageRecord['reason'];
      startDate?: string;
      endDate?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<PaginatedResponse<WastageRecord>> {
    await delay(300);
    requireTenantId(tenantId);
    
    let result = filterByTenant(wastageRecords, tenantId) as WastageRecord[];
    
    if (filters.itemId) {
      result = result.filter(w => w.itemId === filters.itemId);
    }
    
    if (filters.reason) {
      result = result.filter(w => w.reason === filters.reason);
    }
    
    if (filters.startDate) {
      result = result.filter(w => w.createdAt >= filters.startDate!);
    }
    
    if (filters.endDate) {
      result = result.filter(w => w.createdAt <= filters.endDate!);
    }
    
    // Sort by date descending
    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    
    return paginate(result, filters.page || 1, filters.pageSize || 10);
  },

  /**
   * Get wastage report summary
   * CONCEPT: Wastage tracking & reporting
   */
  async getWastageReport(
    tenantId: string,
    dateRange: { start: string; end: string }
  ): Promise<{
    totalWastage: number;
    totalCost: number;
    byReason: Record<WastageRecord['reason'], { quantity: number; cost: number }>;
    byCategory: Array<{ categoryId: ID; categoryName: string; quantity: number; cost: number }>;
  }> {
    await delay(300);
    requireTenantId(tenantId);
    
    const tenantWastage = filterByTenant(wastageRecords, tenantId) as WastageRecord[];
    const filteredWastage = tenantWastage.filter(w => 
      w.createdAt >= dateRange.start && w.createdAt <= dateRange.end
    );
    
    const totalWastage = filteredWastage.reduce((sum, w) => sum + w.quantity, 0);
    const totalCost = filteredWastage.reduce((sum, w) => sum + w.cost, 0);
    
    // Group by reason
    const byReason: Record<WastageRecord['reason'], { quantity: number; cost: number }> = {
      expired: { quantity: 0, cost: 0 },
      damaged: { quantity: 0, cost: 0 },
      spoiled: { quantity: 0, cost: 0 },
      other: { quantity: 0, cost: 0 },
    };
    
    filteredWastage.forEach(w => {
      byReason[w.reason].quantity += w.quantity;
      byReason[w.reason].cost += w.cost;
    });
    
    // Group by category
    const categoryMap = new Map<ID, { categoryId: ID; categoryName: string; quantity: number; cost: number }>();
    const tenantItems = filterByTenant(items, tenantId) as InventoryItem[];
    const tenantCategories = filterByTenant(categories, tenantId) as InventoryCategory[];
    
    filteredWastage.forEach(w => {
      const item = tenantItems.find(i => i.id === w.itemId);
      if (item) {
        const category = tenantCategories.find(c => c.id === item.categoryId);
        const categoryName = category?.name || 'Unknown';
        
        const existing = categoryMap.get(item.categoryId) || {
          categoryId: item.categoryId,
          categoryName,
          quantity: 0,
          cost: 0,
        };
        
        existing.quantity += w.quantity;
        existing.cost += w.cost;
        categoryMap.set(item.categoryId, existing);
      }
    });
    
    return {
      totalWastage,
      totalCost,
      byReason,
      byCategory: Array.from(categoryMap.values()),
    };
  },

  /**
   * Track consumption from stock movements
   * CONCEPT: Consumption trends tracking (from HotelInventoryManager)
   */
  async trackConsumption(
    tenantId: string,
    itemId: string,
    quantity: number,
    movementId?: ID
  ): Promise<ConsumptionRecord> {
    await delay(200);
    requireTenantId(tenantId);
    
    const item = findByIdAndTenant(items, itemId, tenantId);
    if (!item) {
      throw new NotFoundError('Inventory Item', itemId);
    }
    
    const consumption: ConsumptionRecord = {
      id: generateId(),
      tenantId,
      itemId,
      item,
      categoryId: item.categoryId,
      quantity,
      value: quantity * item.unitCost,
      date: now().split('T')[0], // ISO date only
      movementId,
      createdAt: now(),
      updatedAt: now(),
    };
    
    consumptionRecords.unshift(consumption);
    return consumption;
  },

  /**
   * Get consumption trends
   * CONCEPT: Consumption trends tracking
   */
  async getConsumptionTrends(
    tenantId: string,
    dateRange: { start: string; end: string },
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ period: string; quantity: number; value: number; itemCount: number }>> {
    await delay(300);
    requireTenantId(tenantId);
    
    const tenantConsumption = filterByTenant(consumptionRecords, tenantId) as ConsumptionRecord[];
    const filtered = tenantConsumption.filter(c => 
      c.date >= dateRange.start && c.date <= dateRange.end
    );
    
    // Group by period
    const periodMap = new Map<string, { quantity: number; value: number; items: Set<ID> }>();
    
    filtered.forEach(record => {
      let period: string;
      const date = new Date(record.date);
      
      if (groupBy === 'day') {
        period = record.date;
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        period = weekStart.toISOString().split('T')[0];
      } else {
        period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      const existing = periodMap.get(period) || { quantity: 0, value: 0, items: new Set<ID>() };
      existing.quantity += record.quantity;
      existing.value += record.value;
      existing.items.add(record.itemId);
      periodMap.set(period, existing);
    });
    
    return Array.from(periodMap.entries())
      .map(([period, data]) => ({
        period,
        quantity: data.quantity,
        value: data.value,
        itemCount: data.items.size,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  },

  /**
   * Get category expense analysis
   * CONCEPT: Category-based expense analysis (from HotelInventoryManager)
   */
  async getCategoryExpenseAnalysis(
    tenantId: string,
    dateRange: { start: string; end: string }
  ): Promise<CategoryExpense[]> {
    await delay(300);
    requireTenantId(tenantId);
    
    // Get all purchase orders in date range (from supplyService would be better, but using stock movements for now)
    const tenantItems = filterByTenant(items, tenantId) as InventoryItem[];
    const tenantCategories = filterByTenant(categories, tenantId) as InventoryCategory[];
    const tenantItemIds = new Set(tenantItems.map(i => i.id));
    
    // Get purchase movements in date range
    const purchaseMovements = stockMovements.filter(m => 
      tenantItemIds.has(m.itemId) &&
      m.type === 'purchase' &&
      m.createdAt >= dateRange.start &&
      m.createdAt <= dateRange.end
    );
    
    // Group by category
    const categoryMap = new Map<ID, { 
      categoryId: ID; 
      categoryName: string; 
      totalSpent: number; 
      itemCount: Set<ID>;
    }>();
    
    purchaseMovements.forEach(movement => {
      const item = tenantItems.find(i => i.id === movement.itemId);
      if (item) {
        const category = tenantCategories.find(c => c.id === item.categoryId);
        const categoryName = category?.name || 'Unknown';
        const cost = (movement.unitCost || item.unitCost) * movement.quantity;
        
        const existing = categoryMap.get(item.categoryId) || {
          categoryId: item.categoryId,
          categoryName,
          totalSpent: 0,
          itemCount: new Set<ID>(),
        };
        
        existing.totalSpent += cost;
        existing.itemCount.add(item.id);
        categoryMap.set(item.categoryId, existing);
      }
    });
    
    const totalSpent = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.totalSpent, 0);
    
    return Array.from(categoryMap.values())
      .map(cat => ({
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        totalSpent: cat.totalSpent,
        percentage: totalSpent > 0 ? (cat.totalSpent / totalSpent) * 100 : 0,
        itemCount: cat.itemCount.size,
        averageCost: cat.itemCount.size > 0 ? cat.totalSpent / cat.itemCount.size : 0,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);
  },

  /**
   * Get stock value trends
   * CONCEPT: Stock value trends tracking (from HotelInventoryManager)
   */
  async getStockValueTrends(
    tenantId: string,
    periods: number = 12
  ): Promise<StockValueTrend[]> {
    await delay(300);
    requireTenantId(tenantId);
    
    const tenantItems = filterByTenant(items, tenantId) as InventoryItem[];
    const activeItems = tenantItems.filter(i => i.isActive);
    
    // For now, calculate current value and simulate historical trends
    // In real implementation, would track historical stock values
    const currentValue = activeItems.reduce((sum, i) => sum + (i.currentStock * i.unitCost), 0);
    const currentDate = new Date();
    
    const trends: StockValueTrend[] = [];
    
    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Simulate trend (in real implementation, would use historical data)
      const changePercent = i === 0 ? 0 : (Math.random() * 10 - 5); // -5% to +5%
      const value = i === 0 
        ? currentValue 
        : currentValue / (1 + changePercent / 100);
      const change = i === 0 ? 0 : value - (trends[trends.length - 1]?.value || currentValue);
      
      trends.push({
        period,
        value: Math.round(value),
        change: Math.round(change),
        changePercent: i === 0 ? 0 : changePercent,
        itemCount: activeItems.length,
      });
    }
    
    return trends;
  },
};

// Category Service
export const categoryService = {
  async getAll(tenantId: string): Promise<InventoryCategory[]> {
    await delay(200);
    requireTenantId(tenantId);
    const tenantCategories = filterByTenant(categories, tenantId) as InventoryCategory[];
    return tenantCategories.filter(c => c.isActive).sort((a, b) => a.name.localeCompare(b.name));
  },

  async getById(tenantId: string, id: string): Promise<InventoryCategory | null> {
    await delay(200);
    requireTenantId(tenantId);
    return findByIdAndTenant(categories, id, tenantId);
  },

  async create(tenantId: string, data: Omit<InventoryCategory, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>): Promise<InventoryCategory> {
    await delay(400);
    requireTenantId(tenantId);
    
    // Check if name already exists for this tenant
    const tenantCategories = filterByTenant(categories, tenantId) as InventoryCategory[];
    if (tenantCategories.some(c => c.name.toLowerCase() === data.name.toLowerCase())) {
      throw new Error('Category name already exists');
    }
    
    const newCategory: InventoryCategory = {
      ...data,
      tenantId,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    
    categories.unshift(newCategory);
    return newCategory;
  },

  async update(tenantId: string, id: string, data: Partial<InventoryCategory>): Promise<InventoryCategory> {
    await delay(400);
    requireTenantId(tenantId);
    
    const category = findByIdAndTenant(categories, id, tenantId);
    if (!category) throw new Error('Category not found');
    
    const index = categories.findIndex(c => c.id === id && c.tenantId === tenantId);
    
    // Check name uniqueness if changing (only within tenant)
    if (data.name) {
      const tenantCategories = filterByTenant(categories, tenantId) as InventoryCategory[];
      if (tenantCategories.some((c, idx) => c.name.toLowerCase() === data.name!.toLowerCase() && c.id !== id)) {
        throw new Error('Category name already exists');
      }
    }
    
    // Check if category is in use (only within tenant)
    if (data.isActive === false) {
      const tenantItems = filterByTenant(items, tenantId) as InventoryItem[];
      if (tenantItems.some(i => i.categoryId === id)) {
        throw new Error('Cannot delete category that has items');
      }
    }
    
    categories[index] = {
      ...categories[index],
      ...data,
      updatedAt: now(),
    };
    
    return categories[index];
  },

  async delete(tenantId: string, id: string): Promise<void> {
    await delay(300);
    requireTenantId(tenantId);
    
    const category = findByIdAndTenant(categories, id, tenantId);
    if (!category) throw new Error('Category not found');
    
    const index = categories.findIndex(c => c.id === id && c.tenantId === tenantId);
    
    // Check if category is in use (only within tenant)
    const tenantItems = filterByTenant(items, tenantId) as InventoryItem[];
    if (tenantItems.some(i => i.categoryId === id)) {
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
  async getAll(tenantId: string, filters: { status?: Vendor['status']; search?: string } = {}): Promise<Vendor[]> {
    await delay(200);
    requireTenantId(tenantId);
    
    let result = filterByTenant(vendors, tenantId) as Vendor[];
    
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

  async getById(tenantId: string, id: string): Promise<Vendor | null> {
    await delay(200);
    requireTenantId(tenantId);
    return findByIdAndTenant(vendors, id, tenantId);
  },

  async create(tenantId: string, data: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>): Promise<Vendor> {
    await delay(400);
    requireTenantId(tenantId);
    
    const newVendor: Vendor = {
      ...data,
      tenantId,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    
    vendors.unshift(newVendor);
    return newVendor;
  },

  async update(tenantId: string, id: string, data: Partial<Vendor>): Promise<Vendor> {
    await delay(400);
    requireTenantId(tenantId);
    
    const vendor = findByIdAndTenant(vendors, id, tenantId);
    if (!vendor) throw new Error('Vendor not found');
    
    const index = vendors.findIndex(v => v.id === id && v.tenantId === tenantId);
    
    vendors[index] = {
      ...vendors[index],
      ...data,
      updatedAt: now(),
    };
    
    return vendors[index];
  },

  async delete(tenantId: string, id: string): Promise<void> {
    await delay(300);
    requireTenantId(tenantId);
    
    const vendor = findByIdAndTenant(vendors, id, tenantId);
    if (!vendor) {
      throw new NotFoundError('Vendor', id);
    }
    
    const index = vendors.findIndex(v => v.id === id && v.tenantId === tenantId);
    
    // Soft delete
    vendors[index] = {
      ...vendors[index],
      status: 'inactive',
      updatedAt: now(),
    };
  },

  /**
   * Calculate vendor rating based on performance
   * CONCEPT: Vendor rating calculation (from HotelInventoryManager)
   */
  async calculateVendorRating(tenantId: string, vendorId: string): Promise<number> {
    await delay(300);
    requireTenantId(tenantId);
    
    const vendor = findByIdAndTenant(vendors, vendorId, tenantId);
    if (!vendor) {
      throw new NotFoundError('Vendor', vendorId);
    }
    
    // In a real implementation, would calculate based on:
    // - On-time delivery rate (from purchase orders)
    // - Quality (rejections/returns)
    // - Price competitiveness
    // - Communication responsiveness
    
    // For now, return existing rating or calculate a default
    // This would be enhanced with actual purchase order data from supplyService
    if (vendor.rating !== undefined) {
      return vendor.rating;
    }
    
    // Default rating calculation (would use actual data in production)
    return 4.0;
  },

  /**
   * Update vendor rating
   * CONCEPT: Vendor rating calculation
   */
  async updateVendorRating(tenantId: string, vendorId: string): Promise<Vendor> {
    await delay(400);
    requireTenantId(tenantId);
    
    const vendor = findByIdAndTenant(vendors, vendorId, tenantId);
    if (!vendor) {
      throw new NotFoundError('Vendor', vendorId);
    }
    
    const newRating = await this.calculateVendorRating(tenantId, vendorId);
    
    const index = vendors.findIndex(v => v.id === vendorId && v.tenantId === tenantId);
    vendors[index] = {
      ...vendors[index],
      rating: newRating,
      updatedAt: now(),
    };
    
    return vendors[index];
  },
};
