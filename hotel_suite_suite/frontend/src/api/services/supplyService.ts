import type { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem, Delivery, DeliveryStatus, PaginatedResponse } from '@/types';
import { mockPurchaseOrders } from '../mockData';
import { delay, generateId, now, paginate } from '../helpers';

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
  async getAll(filters: PurchaseOrderFilters = {}): Promise<PaginatedResponse<PurchaseOrder>> {
    await delay(300);
    
    let result = [...purchaseOrders];
    
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
  async getById(id: string): Promise<PurchaseOrder | null> {
    await delay(200);
    return purchaseOrders.find(po => po.id === id) || null;
  },

  /**
   * Create a new purchase order
   */
  async create(data: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    await delay(400);
    
    // Generate PO number
    const year = new Date().getFullYear();
    const existingPOs = purchaseOrders.filter(po => po.poNumber.startsWith(`PO-${year}`));
    const nextNumber = existingPOs.length + 1;
    const poNumber = `PO-${year}-${String(nextNumber).padStart(4, '0')}`;
    
    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = Math.round(subtotal * 0.18); // 18% GST
    const shippingCost = 0; // Can be added later
    const totalAmount = subtotal + taxAmount + shippingCost;
    
    const newPO: PurchaseOrder = {
      id: generateId(),
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
  async update(id: string, data: Partial<CreatePurchaseOrderDto>): Promise<PurchaseOrder> {
    await delay(400);
    
    const index = purchaseOrders.findIndex(po => po.id === id);
    if (index === -1) throw new Error('Purchase order not found');
    
    const po = purchaseOrders[index];
    
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
  async updateStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
    await delay(300);
    
    const index = purchaseOrders.findIndex(po => po.id === id);
    if (index === -1) throw new Error('Purchase order not found');
    
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
  async getStats(): Promise<{
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
    
    return {
      total: purchaseOrders.length,
      draft: purchaseOrders.filter(po => po.status === 'draft').length,
      pendingApproval: purchaseOrders.filter(po => po.status === 'pending_approval').length,
      approved: purchaseOrders.filter(po => po.status === 'approved').length,
      sent: purchaseOrders.filter(po => po.status === 'sent').length,
      received: purchaseOrders.filter(po => po.status === 'received').length,
      totalValue: purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0),
      pendingValue: purchaseOrders
        .filter(po => ['draft', 'pending_approval', 'approved', 'sent'].includes(po.status))
        .reduce((sum, po) => sum + po.totalAmount, 0),
    };
  },

  /**
   * Delete purchase order
   */
  async delete(id: string): Promise<void> {
    await delay(300);
    const index = purchaseOrders.findIndex(po => po.id === id);
    if (index === -1) throw new Error('Purchase order not found');
    
    // Only allow deletion of draft POs
    if (purchaseOrders[index].status !== 'draft') {
      throw new Error('Only draft purchase orders can be deleted');
    }
    
    purchaseOrders.splice(index, 1);
  },
};

// Delivery Service
export const deliveryService = {
  /**
   * Get all deliveries
   */
  async getAll(filters: { purchaseOrderId?: string; status?: DeliveryStatus } = {}): Promise<Delivery[]> {
    await delay(200);
    
    let result = [...deliveries];
    
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
   */
  async getById(id: string): Promise<Delivery | null> {
    await delay(200);
    return deliveries.find(d => d.id === id) || null;
  },
};

