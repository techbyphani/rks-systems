import type { Folio, FolioCharge, Payment, Invoice, PaymentMethod, ChargeCategory, PaginatedResponse } from '@/types';
import { mockFolios, mockPayments, mockInvoices, getBillingMetrics, getPaymentMethodBreakdown } from '../mockData';
import { delay, generateId, now, paginate } from '../helpers';

// In-memory stores
let folios = [...mockFolios];
let payments = [...mockPayments];
let invoices = [...mockInvoices];

const today = new Date().toISOString().split('T')[0];

export interface FolioFilters {
  status?: Folio['status'];
  guestId?: string;
  hasBalance?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const billingService = {
  // ==================== FOLIOS ====================
  
  /**
   * Get all folios with filtering
   */
  async getAllFolios(filters: FolioFilters = {}): Promise<PaginatedResponse<Folio>> {
    await delay(300);
    
    let result = [...folios];
    
    if (filters.status) {
      result = result.filter(f => f.status === filters.status);
    }
    
    if (filters.guestId) {
      result = result.filter(f => f.guestId === filters.guestId);
    }
    
    if (filters.hasBalance) {
      result = result.filter(f => f.balance > 0);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(f =>
        f.folioNumber.toLowerCase().includes(searchLower) ||
        f.guest?.firstName.toLowerCase().includes(searchLower) ||
        f.guest?.lastName.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by created date descending
    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    
    return paginate(result, filters.page || 1, filters.pageSize || 10);
  },

  /**
   * Get folio by ID
   */
  async getFolioById(id: string): Promise<Folio | null> {
    await delay(200);
    return folios.find(f => f.id === id) || null;
  },

  /**
   * Get folio by reservation ID
   */
  async getFolioByReservation(reservationId: string): Promise<Folio | null> {
    await delay(200);
    return folios.find(f => f.reservationId === reservationId) || null;
  },

  /**
   * Create a new folio
   */
  async createFolio(reservationId: string, guestId: string, roomId?: string): Promise<Folio> {
    await delay(400);
    
    const folioNumber = `FOL-${Date.now().toString(36).toUpperCase()}`;
    
    const newFolio: Folio = {
      id: generateId(),
      folioNumber,
      reservationId,
      guestId,
      roomId,
      status: 'open',
      charges: [],
      payments: [],
      totalCharges: 0,
      totalPayments: 0,
      balance: 0,
      currency: 'INR',
      createdAt: now(),
      updatedAt: now(),
    };
    
    folios.unshift(newFolio);
    return newFolio;
  },

  /**
   * Post a charge to a folio
   */
  async postCharge(folioId: string, charge: {
    category: ChargeCategory;
    description: string;
    quantity: number;
    unitPrice: number;
    referenceType?: string;
    referenceId?: string;
  }): Promise<FolioCharge> {
    await delay(400);
    
    const folioIndex = folios.findIndex(f => f.id === folioId);
    if (folioIndex === -1) throw new Error('Folio not found');
    
    const amount = charge.quantity * charge.unitPrice;
    const taxAmount = Math.round(amount * 0.18);
    
    const newCharge: FolioCharge = {
      id: generateId(),
      folioId,
      category: charge.category,
      description: charge.description,
      quantity: charge.quantity,
      unitPrice: charge.unitPrice,
      amount,
      taxAmount,
      totalAmount: amount + taxAmount,
      chargeDate: today,
      postedBy: 'EMP003',
      isVoided: false,
      referenceType: charge.referenceType,
      referenceId: charge.referenceId,
      createdAt: now(),
      updatedAt: now(),
    };
    
    folios[folioIndex].charges.push(newCharge);
    folios[folioIndex].totalCharges += newCharge.totalAmount;
    folios[folioIndex].balance = folios[folioIndex].totalCharges - folios[folioIndex].totalPayments;
    folios[folioIndex].updatedAt = now();
    
    return newCharge;
  },

  /**
   * Void a charge
   */
  async voidCharge(folioId: string, chargeId: string, reason: string): Promise<void> {
    await delay(300);
    
    const folioIndex = folios.findIndex(f => f.id === folioId);
    if (folioIndex === -1) throw new Error('Folio not found');
    
    const chargeIndex = folios[folioIndex].charges.findIndex(c => c.id === chargeId);
    if (chargeIndex === -1) throw new Error('Charge not found');
    
    const charge = folios[folioIndex].charges[chargeIndex];
    folios[folioIndex].charges[chargeIndex] = {
      ...charge,
      isVoided: true,
      voidedBy: 'EMP003',
      voidedAt: now(),
      voidReason: reason,
    };
    
    folios[folioIndex].totalCharges -= charge.totalAmount;
    folios[folioIndex].balance = folios[folioIndex].totalCharges - folios[folioIndex].totalPayments;
    folios[folioIndex].updatedAt = now();
  },

  // ==================== PAYMENTS ====================

  /**
   * Process a payment
   */
  async processPayment(folioId: string, payment: {
    amount: number;
    method: PaymentMethod;
    referenceNumber?: string;
    cardLastFour?: string;
    cardType?: string;
    notes?: string;
  }): Promise<Payment> {
    await delay(500);
    
    const folioIndex = folios.findIndex(f => f.id === folioId);
    if (folioIndex === -1) throw new Error('Folio not found');
    
    const newPayment: Payment = {
      id: generateId(),
      receiptNumber: `RCP-${Date.now().toString(36).toUpperCase()}`,
      folioId,
      amount: payment.amount,
      currency: 'INR',
      method: payment.method,
      status: 'completed',
      referenceNumber: payment.referenceNumber,
      cardLastFour: payment.cardLastFour,
      cardType: payment.cardType,
      notes: payment.notes,
      processedBy: 'EMP003',
      processedAt: now(),
      createdAt: now(),
      updatedAt: now(),
    };
    
    folios[folioIndex].payments.push(newPayment);
    folios[folioIndex].totalPayments += payment.amount;
    folios[folioIndex].balance = folios[folioIndex].totalCharges - folios[folioIndex].totalPayments;
    folios[folioIndex].updatedAt = now();
    
    payments.unshift(newPayment);
    
    return newPayment;
  },

  /**
   * Get all payments
   */
  async getAllPayments(filters: { date?: string; method?: PaymentMethod; page?: number; pageSize?: number } = {}): Promise<PaginatedResponse<Payment>> {
    await delay(300);
    
    let result = [...payments];
    
    if (filters.date) {
      result = result.filter(p => p.processedAt.startsWith(filters.date!));
    }
    
    if (filters.method) {
      result = result.filter(p => p.method === filters.method);
    }
    
    result.sort((a, b) => b.processedAt.localeCompare(a.processedAt));
    
    return paginate(result, filters.page || 1, filters.pageSize || 10);
  },

  /**
   * Close a folio
   */
  async closeFolio(id: string): Promise<Folio> {
    await delay(400);
    
    const index = folios.findIndex(f => f.id === id);
    if (index === -1) throw new Error('Folio not found');
    
    if (folios[index].balance !== 0) {
      throw new Error('Cannot close folio with outstanding balance');
    }
    
    folios[index] = {
      ...folios[index],
      status: 'settled',
      closedAt: now(),
      updatedAt: now(),
    };
    
    return folios[index];
  },

  // ==================== METRICS ====================

  /**
   * Get billing dashboard metrics
   */
  async getMetrics(): Promise<{
    openFolios: number;
    totalOutstanding: number;
    todaysRevenue: number;
    pendingPayments: number;
  }> {
    await delay(200);
    return getBillingMetrics();
  },

  /**
   * Get payment method breakdown
   */
  async getPaymentBreakdown(): Promise<Record<PaymentMethod, number>> {
    await delay(200);
    return getPaymentMethodBreakdown();
  },

  /**
   * Get revenue by date range
   */
  async getRevenueByDateRange(startDate: string, endDate: string): Promise<{ date: string; amount: number }[]> {
    await delay(300);
    
    const revenueByDate: Record<string, number> = {};
    
    payments.forEach(p => {
      const date = p.processedAt.split('T')[0];
      if (date >= startDate && date <= endDate) {
        revenueByDate[date] = (revenueByDate[date] || 0) + p.amount;
      }
    });
    
    return Object.entries(revenueByDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
};
