import type { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem, Delivery, DeliveryStatus, PaginatedResponse } from '@/types';
import { mockPurchaseOrders } from '../mockData';
import { delay, generateId, now, paginate } from '../helpers';
import { requireTenantId, filterByTenant, findByIdAndTenant } from '../helpers/tenantFilter';

// In-memory stores
let purchaseOrders = [...mockPurchaseOrders];
let deliveries: Delivery[] = [];

const today = new Date().toISOString().split('T')[0];

export interface PurchaseOrderFilters {
  status?: PurchaseOrderStatus;
  vendorId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  tenantId?: string;
  page?: number;
  pageSize?: number;
}

export interface CreatePurchaseOrderDto {
  vendorId: string;
  items: Omit<PurchaseOrderItem, 'id'>[];
  expectedDeliveryDate?: string;
  deliveryAddress?: string;
  notes?: string;
}

export const purchaseOrderService = {
  /**
   * Get all purchase orders
   */
  async getAll(tenantId: string, filters: PurchaseOrderFilters = {}): Promise<PaginatedResponse<PurchaseOrder>> {
    await delay(300);
    requireTenantId(tenantId);
    
    let result = filterByTenant(purchaseOrders, tenantId) as PurchaseOrder[];
    
    if (filters.status) {
      result = result.filter(po => po.status === filters.status);
    }
    
    if (filters.vendorId) {
      result = result.filter(po => po.vendorId === filters.vendorId);
    }
    
    if (filters.startDate) {
      result = result.filter(po => po.createdAt >= filters.startDate!);
    }
    
    if (filters.endDate) {
      result = result.filter(po => po.createdAt <= filters.endDate!);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(po =>
        po.poNumber.toLowerCase().includes(searchLower) ||
        po.vendor?.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by creation date (newest first)
    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    
    return paginate(result, filters.page || 1, filters.pageSize || 10);
  },

  /**
   * Get purchase order by ID
   */
  async getById(tenantId: string, id: string): Promise<PurchaseOrder | null> {
    await delay(200);
    requireTenantId(tenantId);
    return findByIdAndTenant(purchaseOrders, id, tenantId);
  },

  /**
   * Create a new purchase order
   */
  async create(tenantId: string, data: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    await delay(400);
    requireTenantId(tenantId);
    
    // Generate PO number (scoped to tenant)
    const year = new Date().getFullYear();
    const tenantPOs = filterByTenant(purchaseOrders, tenantId) as PurchaseOrder[];
    const existingPOs = tenantPOs.filter(po => po.poNumber.startsWith(`PO-${year}`));
    const nextNumber = existingPOs.length + 1;
    const poNumber = `PO-${year}-${String(nextNumber).padStart(4, '0')}`;
    
    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = Math.round(subtotal * 0.18); // 18% GST
    const shippingCost = 0; // Can be added later
    const totalAmount = subtotal + taxAmount + shippingCost;
    
    const newPO: PurchaseOrder = {
      id: generateId(),
      tenantId,
      poNumber,
      vendorId: data.vendorId,
      status: 'draft',
      items: data.items.map(item => ({
        ...item,
        id: generateId(),
        receivedQuantity: 0,
      })),
      subtotal,
      taxAmount,
      shippingCost,
      totalAmount,
      currency: 'INR',
      expectedDeliveryDate: data.expectedDeliveryDate,
      deliveryAddress: data.deliveryAddress,
      notes: data.notes,
      createdBy: 'user1',
      createdAt: now(),
      updatedAt: now(),
    };
    
    purchaseOrders.unshift(newPO);
    return newPO;
  },

  /**
   * Update purchase order
   */
  async update(tenantId: string, id: string, data: Partial<CreatePurchaseOrderDto>): Promise<PurchaseOrder> {
    await delay(400);
    requireTenantId(tenantId);
    
    const po = findByIdAndTenant(purchaseOrders, id, tenantId);
    if (!po) throw new Error('Purchase order not found');
    
    const index = purchaseOrders.findIndex(p => p.id === id && p.tenantId === tenantId);
    
    // If items are updated, recalculate totals
    if (data.items) {
      const subtotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const taxAmount = Math.round(subtotal * 0.18);
      const totalAmount = subtotal + taxAmount + (po.shippingCost || 0);
      
      const updatedData = {
        ...data,
        items: data.items.map(item => ({
          id: generateId(),
          ...item,
          receivedQuantity: po.items.find(pi => pi.itemId === item.itemId)?.receivedQuantity || 0,
        })),
        subtotal,
        taxAmount,
        totalAmount,
        updatedAt: now(),
      };
      delete (updatedData as any).items; // Remove temporarily
      
      purchaseOrders[index] = {
        ...po,
        ...updatedData,
        items: data.items.map(item => ({
          id: generateId(),
          ...item,
          receivedQuantity: po.items.find(pi => pi.itemId === item.itemId)?.receivedQuantity || 0,
        })),
      };
    } else {
      const { items, ...restData } = data as any;
      purchaseOrders[index] = {
        ...po,
        ...restData,
        updatedAt: now(),
      };
    }
    
    return purchaseOrders[index];
  },

  /**
   * Update purchase order status
   */
  async updateStatus(tenantId: string, id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
    await delay(300);
    requireTenantId(tenantId);
    
    const po = findByIdAndTenant(purchaseOrders, id, tenantId);
    if (!po) throw new Error('Purchase order not found');
    
    const index = purchaseOrders.findIndex(p => p.id === id && p.tenantId === tenantId);
    
    const updates: Partial<PurchaseOrder> = {
      status,
      updatedAt: now(),
    };
    
    if (status === 'approved') {
      updates.approvedBy = 'user1';
      updates.approvedAt = now();
    }
    
    if (status === 'sent') {
      updates.sentAt = now();
    }
    
    purchaseOrders[index] = { ...purchaseOrders[index], ...updates };
    return purchaseOrders[index];
  },

  /**
   * Get purchase order statistics
   */
  async getStats(tenantId: string): Promise<{
    total: number;
    draft: number;
    pendingApproval: number;
    approved: number;
    sent: number;
    received: number;
    totalValue: number;
    pendingValue: number;
  }> {
    await delay(200);
    requireTenantId(tenantId);
    
    const tenantPOs = filterByTenant(purchaseOrders, tenantId) as PurchaseOrder[];
    
    return {
      total: tenantPOs.length,
      draft: tenantPOs.filter(po => po.status === 'draft').length,
      pendingApproval: tenantPOs.filter(po => po.status === 'pending_approval').length,
      approved: tenantPOs.filter(po => po.status === 'approved').length,
      sent: tenantPOs.filter(po => po.status === 'sent').length,
      received: tenantPOs.filter(po => po.status === 'received').length,
      totalValue: tenantPOs.reduce((sum, po) => sum + po.totalAmount, 0),
      pendingValue: tenantPOs
        .filter(po => ['draft', 'pending_approval', 'approved', 'sent'].includes(po.status))
        .reduce((sum, po) => sum + po.totalAmount, 0),
    };
  },

  /**
   * Delete purchase order
   */
  async delete(tenantId: string, id: string): Promise<void> {
    await delay(300);
    requireTenantId(tenantId);
    
    const po = findByIdAndTenant(purchaseOrders, id, tenantId);
    if (!po) throw new Error('Purchase order not found');
    
    // Only allow deletion of draft POs
    if (po.status !== 'draft') {
      throw new Error('Only draft purchase orders can be deleted');
    }
    
    const index = purchaseOrders.findIndex(p => p.id === id && p.tenantId === tenantId);
    purchaseOrders.splice(index, 1);
  },
};

// Delivery Service
export const deliveryService = {
  /**
   * Get all deliveries
   * CRITICAL FIX: Added tenant isolation through purchase orders
   */
  async getAll(tenantId: string, filters: { purchaseOrderId?: string; status?: DeliveryStatus } = {}): Promise<Delivery[]> {
    await delay(200);
    
    requireTenantId(tenantId);
    // Filter by tenant through purchase orders
    const tenantPurchaseOrders = filterByTenant(purchaseOrders, tenantId) as PurchaseOrder[];
    const tenantPurchaseOrderIds = tenantPurchaseOrders.map(po => po.id);
    let result = deliveries.filter(d => tenantPurchaseOrderIds.includes(d.purchaseOrderId));
    
    if (filters.purchaseOrderId) {
      result = result.filter(d => d.purchaseOrderId === filters.purchaseOrderId);
    }
    
    if (filters.status) {
      result = result.filter(d => d.status === filters.status);
    }
    
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  /**
   * Get delivery by ID
   * CRITICAL FIX: Added tenant isolation through purchase orders
   */
  async getById(tenantId: string, id: string): Promise<Delivery | null> {
    await delay(200);
    requireTenantId(tenantId);
    // Verify delivery belongs to tenant through purchase order
    const tenantPurchaseOrders = filterByTenant(purchaseOrders, tenantId) as PurchaseOrder[];
    const tenantPurchaseOrderIds = tenantPurchaseOrders.map(po => po.id);
    const delivery = deliveries.find(d => d.id === id && tenantPurchaseOrderIds.includes(d.purchaseOrderId));
    return delivery || null;
  },
};

