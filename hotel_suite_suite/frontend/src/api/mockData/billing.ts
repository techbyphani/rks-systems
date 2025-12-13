import type { Folio, FolioCharge, Payment, Invoice, ChargeCategory, PaymentMethod, FolioStatus } from '@/types';
import { mockReservations } from './reservations';
import { mockGuests } from './guests';
import { subtractDays } from '../helpers';

const today = new Date().toISOString().split('T')[0];
const now = new Date().toISOString();

export const mockFolios: Folio[] = [];
export const mockPayments: Payment[] = [];
export const mockInvoices: Invoice[] = [];

// Generate folios for checked-in and checked-out reservations
const relevantReservations = mockReservations.filter(r => 
  r.status === 'checked_in' || r.status === 'checked_out'
);

relevantReservations.forEach((reservation, index) => {
  const folioId = `FOL${String(index + 1).padStart(5, '0')}`;
  const guest = mockGuests.find(g => g.id === reservation.guestId) || mockGuests[0];
  
  const charges: FolioCharge[] = [];
  let totalCharges = 0;
  
  // Room charges - one per night
  const nights = reservation.nights || 1;
  for (let n = 0; n < nights; n++) {
    const chargeAmount = reservation.roomRate;
    const taxAmount = Math.round(chargeAmount * 0.18);
    
    charges.push({
      id: `CHG${folioId}-${n + 1}`,
      folioId,
      category: 'room',
      description: `Room Charge - Night ${n + 1}`,
      quantity: 1,
      unitPrice: chargeAmount,
      amount: chargeAmount,
      taxAmount,
      totalAmount: chargeAmount + taxAmount,
      chargeDate: subtractDays(reservation.checkOutDate || today, nights - n - 1),
      postedBy: 'EMP003',
      isVoided: false,
      createdAt: now,
      updatedAt: now,
    });
    totalCharges += chargeAmount + taxAmount;
  }
  
  // Random additional charges
  const additionalChargeTypes: { category: ChargeCategory; description: string; minPrice: number; maxPrice: number }[] = [
    { category: 'food_beverage', description: 'Room Service', minPrice: 500, maxPrice: 2000 },
    { category: 'food_beverage', description: 'Restaurant - Dinner', minPrice: 1500, maxPrice: 5000 },
    { category: 'minibar', description: 'Minibar Consumption', minPrice: 300, maxPrice: 1500 },
    { category: 'laundry', description: 'Laundry Service', minPrice: 400, maxPrice: 1200 },
    { category: 'spa', description: 'Spa Treatment', minPrice: 2000, maxPrice: 5000 },
    { category: 'telephone', description: 'Telephone Charges', minPrice: 50, maxPrice: 200 },
  ];
  
  const numAdditionalCharges = Math.floor(Math.random() * 4);
  for (let c = 0; c < numAdditionalCharges; c++) {
    const chargeType = additionalChargeTypes[Math.floor(Math.random() * additionalChargeTypes.length)];
    const chargeAmount = Math.floor(Math.random() * (chargeType.maxPrice - chargeType.minPrice)) + chargeType.minPrice;
    const taxAmount = Math.round(chargeAmount * 0.18);
    
    charges.push({
      id: `CHG${folioId}-A${c + 1}`,
      folioId,
      category: chargeType.category,
      description: chargeType.description,
      quantity: 1,
      unitPrice: chargeAmount,
      amount: chargeAmount,
      taxAmount,
      totalAmount: chargeAmount + taxAmount,
      chargeDate: subtractDays(reservation.checkOutDate || today, Math.floor(Math.random() * nights)),
      postedBy: 'EMP003',
      isVoided: false,
      createdAt: now,
      updatedAt: now,
    });
    totalCharges += chargeAmount + taxAmount;
  }
  
  // Payments
  const payments: Payment[] = [];
  let totalPayments = 0;
  
  if (reservation.status === 'checked_out') {
    // Fully paid
    const paymentMethods: PaymentMethod[] = ['credit_card', 'credit_card', 'debit_card', 'upi', 'cash', 'bank_transfer'];
    const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    
    payments.push({
      id: `PAY${folioId}-1`,
      receiptNumber: `RCP-${today.replace(/-/g, '')}-${String(index + 1).padStart(4, '0')}`,
      folioId,
      amount: totalCharges,
      currency: 'INR',
      method,
      status: 'completed',
      referenceNumber: method === 'credit_card' || method === 'debit_card' ? `TXN${Math.random().toString(36).substr(2, 12).toUpperCase()}` : undefined,
      cardLastFour: method === 'credit_card' || method === 'debit_card' ? String(Math.floor(Math.random() * 9000) + 1000) : undefined,
      cardType: method === 'credit_card' ? ['Visa', 'Mastercard', 'Amex'][Math.floor(Math.random() * 3)] : undefined,
      processedBy: 'EMP003',
      processedAt: reservation.actualCheckOut || `${reservation.checkOutDate}T11:00:00Z`,
      createdAt: now,
      updatedAt: now,
    });
    totalPayments = totalCharges;
    
    mockPayments.push(payments[0]);
  } else if (reservation.status === 'checked_in') {
    // Deposit paid
    if (reservation.depositPaid) {
      const depositAmount = reservation.depositAmount || reservation.roomRate;
      payments.push({
        id: `PAY${folioId}-1`,
        receiptNumber: `RCP-${today.replace(/-/g, '')}-${String(index + 100).padStart(4, '0')}`,
        folioId,
        amount: depositAmount,
        currency: 'INR',
        method: 'credit_card',
        status: 'completed',
        processedBy: 'EMP003',
        processedAt: reservation.actualCheckIn || `${reservation.checkInDate}T14:00:00Z`,
        createdAt: now,
        updatedAt: now,
      });
      totalPayments = depositAmount;
      
      mockPayments.push(payments[0]);
    }
  }
  
  const status: FolioStatus = reservation.status === 'checked_out' ? 'settled' : 'open';
  
  mockFolios.push({
    id: folioId,
    folioNumber: `FOL-${reservation.confirmationNumber}`,
    reservationId: reservation.id,
    reservation,
    guestId: reservation.guestId,
    guest,
    roomId: reservation.roomId,
    status,
    charges,
    payments,
    totalCharges,
    totalPayments,
    balance: totalCharges - totalPayments,
    currency: 'INR',
    closedAt: status === 'settled' ? reservation.actualCheckOut : undefined,
    createdAt: reservation.actualCheckIn || `${reservation.checkInDate}T14:00:00Z`,
    updatedAt: now,
  });
  
  // Create invoice for checked out guests
  if (reservation.status === 'checked_out' && Math.random() > 0.5) {
    mockInvoices.push({
      id: `INV${String(mockInvoices.length + 1).padStart(5, '0')}`,
      invoiceNumber: `INV-${today.replace(/-/g, '').slice(0, 6)}-${String(mockInvoices.length + 1).padStart(4, '0')}`,
      folioId,
      guestId: reservation.guestId,
      guest,
      status: 'paid',
      issueDate: reservation.checkOutDate || today,
      dueDate: reservation.checkOutDate || today,
      items: charges.map(c => ({
        id: c.id,
        description: c.description,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        amount: c.amount,
        taxRate: 18,
        taxAmount: c.taxAmount,
      })),
      subtotal: charges.reduce((sum, c) => sum + c.amount, 0),
      taxAmount: charges.reduce((sum, c) => sum + c.taxAmount, 0),
      totalAmount: totalCharges,
      paidAmount: totalCharges,
      balance: 0,
      currency: 'INR',
      createdAt: now,
      updatedAt: now,
    });
  }
});

// Dashboard metrics
export const getBillingMetrics = () => {
  const todaysFolios = mockFolios.filter(f => f.status === 'open');
  const todaysPayments = mockPayments.filter(p => p.processedAt.startsWith(today));
  
  return {
    openFolios: todaysFolios.length,
    totalOutstanding: todaysFolios.reduce((sum, f) => sum + f.balance, 0),
    todaysRevenue: todaysPayments.reduce((sum, p) => sum + p.amount, 0),
    pendingPayments: todaysFolios.filter(f => f.balance > 0).length,
  };
};

export const getPaymentMethodBreakdown = () => {
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
  
  mockPayments.forEach(p => {
    breakdown[p.method] += p.amount;
  });
  
  return breakdown;
};
