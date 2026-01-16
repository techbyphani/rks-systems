import type { Folio, FolioCharge, Payment, Invoice, PaymentMethod, ChargeCategory, PaginatedResponse } from '@/types';
import { mockFolios, mockPayments, mockInvoices, mockGuests } from '../mockData';
import { delay, generateId, now, paginate } from '../helpers';
import { NotFoundError, BusinessRuleError, ValidationError } from '../errors';
import { requireTenantId, filterByTenant, findByIdAndTenant } from '../helpers/tenantFilter';

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
  tenantId?: string; // CRITICAL: Tenant isolation
}

export const billingService = {
  // ==================== FOLIOS ====================
  
  /**
   * Get all folios with filtering
   * CRITICAL FIX: Added tenant isolation
   */
  async getAllFolios(filters: FolioFilters = {}): Promise<PaginatedResponse<Folio>> {
    await delay(300);
    
    // CRITICAL: Require tenantId for tenant isolation
    const tenantId = requireTenantId(filters.tenantId);
    
    // CRITICAL: Filter by tenant first
    let result = filterByTenant([...folios], tenantId) as Folio[];
    
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
   * CRITICAL FIX: Added tenant isolation
   */
  async getFolioById(tenantId: string, id: string): Promise<Folio | null> {
    await delay(200);
    requireTenantId(tenantId);
    return findByIdAndTenant(folios, id, tenantId);
  },

  /**
   * Get folio by reservation ID
   * CRITICAL FIX: Added tenant isolation
   */
  async getFolioByReservation(tenantId: string, reservationId: string): Promise<Folio | null> {
    await delay(200);
    requireTenantId(tenantId);
    const filtered = filterByTenant(folios, tenantId) as Folio[];
    return filtered.find(f => f.reservationId === reservationId) || null;
  },

  /**
   * Create a new folio
   * reservationId is optional - allows creating folios for customers without reservations (e.g., restaurant billing)
   * CRITICAL: Tenant isolation - validates guest belongs to tenant
   */
  async createFolio(tenantId: string, guestId: string, reservationId?: string, roomId?: string): Promise<Folio> {
    await delay(400);
    
    requireTenantId(tenantId);
    
    // Input Validation: Guest ID is required
    if (!guestId) {
      throw new ValidationError('Guest ID is required to create a folio');
    }
    
    // CRITICAL: Verify guest belongs to tenant (tenant isolation)
    const tenantGuests = filterByTenant(mockGuests, tenantId) as typeof mockGuests;
    const guest = tenantGuests.find(g => g.id === guestId);
    if (!guest) {
      throw new NotFoundError('Guest', guestId);
    }
    
    // Note: If reservationId is provided, it should be validated by the caller (workflowService)
    // since reservationService.getById already validates tenant isolation
    
    const folioNumber = `FOL-${Date.now().toString(36).toUpperCase()}`;
    
    const newFolio: Folio & { tenantId: string } = {
      id: generateId(),
      tenantId,
      folioNumber,
      reservationId, // Optional - can be undefined for customer folios
      guestId,
      roomId, // Optional - can be undefined for non-hotel folios
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
  async postCharge(tenantId: string, folioId: string, charge: {
    category: ChargeCategory;
    description: string;
    quantity: number;
    unitPrice: number;
    referenceType?: string;
    referenceId?: string;
  }): Promise<FolioCharge> {
    await delay(400);
    
    requireTenantId(tenantId);
    
    // Input Validation: Quantity must be positive
    if (!charge.quantity || charge.quantity <= 0) {
      throw new ValidationError(
        'Charge quantity must be greater than zero',
        { quantity: charge.quantity }
      );
    }
    
    // Input Validation: Unit price must be positive
    if (!charge.unitPrice || charge.unitPrice <= 0) {
      throw new ValidationError(
        'Charge unit price must be greater than zero',
        { unitPrice: charge.unitPrice }
      );
    }
    
    const folio = findByIdAndTenant(folios, folioId, tenantId);
    if (!folio) {
      throw new NotFoundError('Folio', folioId);
    }
    
    const folioIndex = folios.findIndex(f => f.id === folioId);
    
    // Business Rule Validation: Cannot post charge to closed folio
    if (folio.status === 'closed') {
      throw new BusinessRuleError(
        `Cannot post charge to closed folio ${folio.folioNumber}`,
        'CANNOT_CHARGE_CLOSED_FOLIO'
      );
    }
    
    // Business Rule Validation: Cannot post charge to settled folio
    if (folio.status === 'settled') {
      throw new BusinessRuleError(
        `Cannot post charge to settled folio ${folio.folioNumber}`,
        'CANNOT_CHARGE_SETTLED_FOLIO'
      );
    }
    
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
  async voidCharge(tenantId: string, folioId: string, chargeId: string, reason: string): Promise<void> {
    await delay(300);
    
    requireTenantId(tenantId);
    const folio = findByIdAndTenant(folios, folioId, tenantId);
    if (!folio) throw new NotFoundError('Folio', folioId);
    
    const folioIndex = folios.findIndex(f => f.id === folioId);
    
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
   * CRITICAL FIX: Added business rule validation
   */
  async processPayment(tenantId: string, folioId: string, payment: {
    amount: number;
    method: PaymentMethod;
    referenceNumber?: string;
    cardLastFour?: string;
    cardType?: string;
    notes?: string;
  }): Promise<Payment> {
    await delay(500);
    
    requireTenantId(tenantId);
    
    // Input Validation: Payment amount must be positive
    if (!payment.amount || payment.amount <= 0) {
      throw new ValidationError(
        'Payment amount must be greater than zero',
        { amount: payment.amount }
      );
    }
    
    const folio = findByIdAndTenant(folios, folioId, tenantId);
    if (!folio) {
      throw new NotFoundError('Folio', folioId);
    }
    
    const folioIndex = folios.findIndex(f => f.id === folioId);
    
    // Business Rule Validation: Cannot process payment for closed folio
    if (folio.status === 'closed') {
      throw new BusinessRuleError(
        `Cannot process payment for closed folio ${folio.folioNumber}`,
        'CANNOT_PAY_CLOSED_FOLIO'
      );
    }
    
    // Business Rule Validation: Cannot process payment for settled folio
    if (folio.status === 'settled') {
      throw new BusinessRuleError(
        `Cannot process payment for settled folio ${folio.folioNumber}`,
        'CANNOT_PAY_SETTLED_FOLIO'
      );
    }
    
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
  async getAllPayments(filters: { date?: string; method?: PaymentMethod; page?: number; pageSize?: number; tenantId?: string } = {}): Promise<PaginatedResponse<Payment>> {
    await delay(300);
    
    const tenantId = requireTenantId(filters.tenantId);
    let result = filterByTenant([...payments], tenantId) as Payment[];
    
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
  async closeFolio(tenantId: string, id: string): Promise<Folio> {
    await delay(400);
    
    requireTenantId(tenantId);
    
    const folio = findByIdAndTenant(folios, id, tenantId);
    if (!folio) {
      throw new NotFoundError('Folio', id);
    }
    
    const index = folios.findIndex(f => f.id === id);
    
    // Business Rule Validation: Cannot close already closed folio
    if (folio.status === 'closed') {
      return folio; // Idempotent: return existing state
    }
    
    // Business Rule Validation: Cannot close already settled folio
    if (folio.status === 'settled') {
      throw new BusinessRuleError(
        `Folio ${folio.folioNumber} is already settled and cannot be closed`,
        'CANNOT_CLOSE_SETTLED_FOLIO'
      );
    }
    
    // Business Rule Validation: Must have zero balance to close
    if (folio.balance !== 0) {
      throw new BusinessRuleError(
        `Cannot close folio ${folio.folioNumber} with outstanding balance of ₹${folio.balance.toLocaleString('en-IN')}. Please settle the balance first.`,
        'FOLIO_BALANCE_MUST_BE_ZERO'
      );
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
  async getMetrics(tenantId: string): Promise<{
    openFolios: number;
    totalOutstanding: number;
    todaysRevenue: number;
    pendingPayments: number;
  }> {
    await delay(200);
    
    requireTenantId(tenantId);
    const tenantFolios = filterByTenant(folios, tenantId) as Folio[];
    const tenantPayments = filterByTenant(payments, tenantId) as Payment[];
    
    const openFoliosList = tenantFolios.filter(f => f.status === 'open');
    const todaysPaymentsList = tenantPayments.filter(p => p.processedAt.startsWith(today));
    
    return {
      openFolios: openFoliosList.length,
      totalOutstanding: openFoliosList.reduce((sum, f) => sum + f.balance, 0),
      todaysRevenue: todaysPaymentsList.reduce((sum, p) => sum + p.amount, 0),
      pendingPayments: openFoliosList.filter(f => f.balance > 0).length,
    };
  },

  /**
   * Get payment method breakdown
   * CRITICAL FIX: Added tenant isolation
   */
  async getPaymentBreakdown(tenantId: string): Promise<Record<PaymentMethod, number>> {
    await delay(200);
    
    requireTenantId(tenantId);
    const filtered = filterByTenant(payments, tenantId) as Payment[];
    
    const breakdown: Record<PaymentMethod, number> = {
      cash: 0,
      credit_card: 0,
      debit_card: 0,
      upi: 0,
      bank_transfer: 0,
      corporate_account: 0,
      travel_agent: 0,
      voucher: 0,
      other: 0,
    };
    
    filtered.forEach((p: Payment) => {
      const method = p.method as PaymentMethod;
      breakdown[method] = (breakdown[method] || 0) + p.amount;
    });
    
    return breakdown;
  },

  /**
   * Get revenue by date range
   * CRITICAL FIX: Added tenant isolation
   */
  async getRevenueByDateRange(tenantId: string, startDate: string, endDate: string): Promise<{ date: string; amount: number }[]> {
    await delay(300);
    
    requireTenantId(tenantId);
    const filtered = filterByTenant(payments, tenantId) as Payment[];
    
    const revenueByDate: Record<string, number> = {};
    
    filtered.forEach(p => {
      const date = p.processedAt.split('T')[0];
      if (date >= startDate && date <= endDate) {
        revenueByDate[date] = (revenueByDate[date] || 0) + p.amount;
      }
    });
    
    return Object.entries(revenueByDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  // ==================== INVOICES ====================

  /**
   * Get all invoices
   * CRITICAL FIX: Added tenant isolation
   */
  async getAllInvoices(tenantId: string, filters: { status?: Invoice['status']; page?: number; pageSize?: number } = {}): Promise<PaginatedResponse<Invoice>> {
    await delay(300);
    
    requireTenantId(tenantId);
    // CRITICAL: Filter by tenant first
    let result = filterByTenant([...invoices], tenantId) as Invoice[];
    
    if (filters.status) {
      result = result.filter(inv => inv.status === filters.status);
    }
    
    // Sort by issue date descending
    result.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
    
    return paginate(result, filters.page || 1, filters.pageSize || 10);
  },

  /**
   * Get invoice by ID
   * CRITICAL FIX: Added tenant isolation
   */
  async getInvoiceById(tenantId: string, id: string): Promise<Invoice | null> {
    await delay(200);
    requireTenantId(tenantId);
    return findByIdAndTenant(invoices, id, tenantId);
  },

  /**
   * Create invoice from folio
   */
  async createInvoiceFromFolio(tenantId: string, folioId: string, data: {
    companyName?: string;
    companyAddress?: Invoice['companyAddress'];
    taxId?: string;
    dueDate: string;
    notes?: string;
  }): Promise<Invoice> {
    await delay(400);
    
    requireTenantId(tenantId);
    const folio = findByIdAndTenant(folios, folioId, tenantId);
    if (!folio) {
      throw new NotFoundError('Folio', folioId);
    }
    
    const year = new Date().getFullYear();
    // CRITICAL: Filter invoices by tenant first before checking invoice numbers
    const tenantInvoices = filterByTenant(invoices, tenantId) as Invoice[];
    const existingInvoices = tenantInvoices
      .filter(inv => inv.invoiceNumber.startsWith(`INV-${year}-`))
      .map(inv => {
        const num = parseInt(inv.invoiceNumber.split('-')[2], 10);
        return isNaN(num) ? 0 : num;
      });
    const nextNumber = existingInvoices.length > 0 ? Math.max(...existingInvoices) + 1 : 1;
    const invoiceNumber = `INV-${year}-${String(nextNumber).padStart(3, '0')}`;
    
    // Convert folio charges to invoice items
    const items: Invoice['items'] = folio.charges
      .filter(c => !c.isVoided)
      .map(charge => ({
        id: generateId(),
        description: charge.description,
        quantity: charge.quantity,
        unitPrice: charge.unitPrice,
        amount: charge.amount,
        taxRate: 18,
        taxAmount: charge.taxAmount,
      }));
    
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    const totalAmount = subtotal + taxAmount;
    
    const newInvoice: Invoice & { tenantId: string } = {
      id: generateId(),
      tenantId, // CRITICAL: Associate with tenant
      invoiceNumber,
      folioId,
      folio,
      guestId: folio.guestId,
      guest: folio.guest,
      companyName: data.companyName,
      companyAddress: data.companyAddress,
      taxId: data.taxId,
      status: 'issued',
      issueDate: today,
      dueDate: data.dueDate,
      items,
      subtotal,
      taxAmount,
      totalAmount,
      paidAmount: 0,
      balance: totalAmount,
      currency: 'INR',
      notes: data.notes,
      createdAt: now(),
      updatedAt: now(),
    };
    
    invoices.unshift(newInvoice);
    return newInvoice;
  },

  /**
   * Update invoice status
   * CRITICAL FIX: Added tenant isolation
   */
  async updateInvoiceStatus(tenantId: string, id: string, status: Invoice['status']): Promise<Invoice> {
    await delay(300);
    
    requireTenantId(tenantId);
    const invoice = findByIdAndTenant(invoices, id, tenantId);
    if (!invoice) {
      throw new NotFoundError('Invoice', id);
    }
    
    const index = invoices.findIndex(inv => inv.id === id);
    
    invoices[index] = {
      ...invoices[index],
      status,
      updatedAt: now(),
    };
    
    return invoices[index];
  },

  /**
   * Record payment against invoice
   * CRITICAL FIX: Added tenant isolation
   */
  async recordInvoicePayment(tenantId: string, invoiceId: string, amount: number): Promise<Invoice> {
    await delay(300);
    
    requireTenantId(tenantId);
    const invoice = findByIdAndTenant(invoices, invoiceId, tenantId);
    if (!invoice) {
      throw new NotFoundError('Invoice', invoiceId);
    }
    
    const index = invoices.findIndex(inv => inv.id === invoiceId);
    
    const newPaidAmount = invoice.paidAmount + amount;
    const newBalance = invoice.totalAmount - newPaidAmount;
    
    invoices[index] = {
      ...invoice,
      paidAmount: newPaidAmount,
      balance: newBalance,
      status: newBalance === 0 ? 'paid' : invoice.status === 'overdue' && newBalance > 0 ? 'overdue' : invoice.status,
      updatedAt: now(),
    };
    
    return invoices[index];
  },

  /**
   * Get invoice statistics
   * CRITICAL FIX: Added tenant isolation
   */
  async getInvoiceStats(tenantId: string): Promise<{
    total: number;
    outstanding: number;
    overdue: number;
    paidThisMonth: number;
  }> {
    await delay(200);
    
    requireTenantId(tenantId);
    const filtered = filterByTenant(invoices, tenantId) as Invoice[];
    const thisMonth = new Date().toISOString().slice(0, 7);
    
    return {
      total: filtered.length,
      outstanding: filtered.reduce((sum, inv) => sum + inv.balance, 0),
      overdue: filtered.filter(inv => inv.status === 'overdue').length,
      paidThisMonth: filtered.filter(inv => 
        inv.status === 'paid' && inv.updatedAt.startsWith(thisMonth)
      ).length,
    };
  },
};
