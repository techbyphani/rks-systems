import type { Account, AccountType, Transaction, TransactionType, PaginatedResponse } from '@/types';
import { delay, generateId, now, paginate } from '../helpers';
import { requireTenantId, filterByTenant, findByIdAndTenant } from '../helpers/tenantFilter';

// In-memory stores
let accounts: Account[] = [
  { id: 'acc-001', tenantId: 'tenant-001', code: '1000', name: 'Cash', type: 'asset', balance: 1250000, currency: 'INR', isActive: true, isSystemAccount: true, createdAt: now(), updatedAt: now() },
  { id: 'acc-002', tenantId: 'tenant-001', code: '1100', name: 'Accounts Receivable', type: 'asset', balance: 450000, currency: 'INR', isActive: true, isSystemAccount: true, createdAt: now(), updatedAt: now() },
  { id: 'acc-003', tenantId: 'tenant-001', code: '2000', name: 'Accounts Payable', type: 'liability', balance: 320000, currency: 'INR', isActive: true, isSystemAccount: true, createdAt: now(), updatedAt: now() },
  { id: 'acc-004', tenantId: 'tenant-001', code: '3000', name: 'Equity', type: 'equity', balance: 5000000, currency: 'INR', isActive: true, isSystemAccount: true, createdAt: now(), updatedAt: now() },
  { id: 'acc-005', tenantId: 'tenant-001', code: '4000', name: 'Room Revenue', type: 'revenue', balance: 2850000, currency: 'INR', isActive: true, isSystemAccount: true, createdAt: now(), updatedAt: now() },
  { id: 'acc-006', tenantId: 'tenant-001', code: '4100', name: 'F&B Revenue', type: 'revenue', balance: 890000, currency: 'INR', isActive: true, isSystemAccount: true, createdAt: now(), updatedAt: now() },
  { id: 'acc-007', tenantId: 'tenant-001', code: '5000', name: 'Salaries & Wages', type: 'expense', balance: 980000, currency: 'INR', isActive: true, isSystemAccount: false, createdAt: now(), updatedAt: now() },
  { id: 'acc-008', tenantId: 'tenant-001', code: '5100', name: 'Utilities', type: 'expense', balance: 245000, currency: 'INR', isActive: true, isSystemAccount: false, createdAt: now(), updatedAt: now() },
];

let transactions: Transaction[] = [];

const today = new Date().toISOString().split('T')[0];

export interface AccountFilters {
  type?: AccountType;
  search?: string;
  isActive?: boolean;
}

export interface TransactionFilters {
  type?: TransactionType;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateAccountDto {
  code: string;
  name: string;
  type: AccountType;
  currency?: string;
  isSystemAccount?: boolean;
}

export interface CreateTransactionDto {
  accountId: string;
  type: TransactionType;
  amount: number;
  description: string;
  date?: string;
  referenceId?: string;
}

// Account Service
export const accountService = {
  /**
   * Get all accounts
   * CRITICAL FIX: Added tenant isolation
   */
  async getAll(tenantId: string, filters: AccountFilters = {}): Promise<Account[]> {
    await delay(200);
    
    requireTenantId(tenantId);
    let result = filterByTenant(accounts, tenantId) as Account[];
    
    if (filters.type) {
      result = result.filter(a => a.type === filters.type);
    }
    
    if (filters.isActive !== undefined) {
      result = result.filter(a => a.isActive === filters.isActive);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(searchLower) ||
        a.code.includes(searchLower)
      );
    }
    
    // Sort by code
    result.sort((a, b) => a.code.localeCompare(b.code));
    
    return result;
  },

  /**
   * Get account by ID
   * CRITICAL FIX: Added tenant isolation
   */
  async getById(tenantId: string, id: string): Promise<Account | null> {
    await delay(200);
    requireTenantId(tenantId);
    return findByIdAndTenant(accounts, id, tenantId);
  },

  /**
   * Create a new account
   * CRITICAL FIX: Added tenant isolation
   */
  async create(tenantId: string, data: CreateAccountDto): Promise<Account> {
    await delay(400);
    
    requireTenantId(tenantId);
    
    // Check if code already exists (within tenant)
    const tenantAccounts = filterByTenant(accounts, tenantId) as Account[];
    if (tenantAccounts.some(a => a.code === data.code)) {
      throw new Error('Account code already exists');
    }
    
    const newAccount: Account & { tenantId: string } = {
      id: generateId(),
      tenantId, // CRITICAL: Tenant isolation
      code: data.code,
      name: data.name,
      type: data.type,
      balance: 0,
      currency: data.currency || 'INR',
      isActive: true,
      isSystemAccount: data.isSystemAccount || false,
      createdAt: now(),
      updatedAt: now(),
    };
    
    accounts.push(newAccount);
    return newAccount;
  },

  /**
   * Update account
   * CRITICAL FIX: Added tenant isolation
   */
  async update(tenantId: string, id: string, data: Partial<CreateAccountDto>): Promise<Account> {
    await delay(400);
    
    requireTenantId(tenantId);
    const account = findByIdAndTenant(accounts, id, tenantId);
    if (!account) throw new Error('Account not found');
    
    const index = accounts.findIndex(a => a.id === id);
    
    // Prevent updating system accounts
    if (accounts[index].isSystemAccount && (data.code || data.type)) {
      throw new Error('Cannot modify system account code or type');
    }
    
    // Check code uniqueness if updating (within tenant)
    const tenantAccounts = filterByTenant(accounts, tenantId) as Account[];
    if (data.code && tenantAccounts.some(a => a.code === data.code && a.id !== id)) {
      throw new Error('Account code already exists');
    }
    
    accounts[index] = {
      ...accounts[index],
      ...data,
      updatedAt: now(),
    };
    
    return accounts[index];
  },

  /**
   * Get account statistics
   * CRITICAL FIX: Added tenant isolation
   */
  async getStats(tenantId: string): Promise<{
    totalAssets: number;
    totalLiabilities: number;
    totalRevenue: number;
    totalExpenses: number;
    totalEquity: number;
  }> {
    await delay(200);
    
    requireTenantId(tenantId);
    const tenantAccounts = filterByTenant(accounts, tenantId) as Account[];
    
    return {
      totalAssets: tenantAccounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + a.balance, 0),
      totalLiabilities: tenantAccounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + a.balance, 0),
      totalRevenue: tenantAccounts.filter(a => a.type === 'revenue').reduce((sum, a) => sum + a.balance, 0),
      totalExpenses: tenantAccounts.filter(a => a.type === 'expense').reduce((sum, a) => sum + a.balance, 0),
      totalEquity: tenantAccounts.filter(a => a.type === 'equity').reduce((sum, a) => sum + a.balance, 0),
    };
  },
};

// Transaction Service
export const transactionService = {
  /**
   * Get all transactions
   * CRITICAL FIX: Added tenant isolation
   */
  async getAll(tenantId: string, filters: TransactionFilters = {}): Promise<PaginatedResponse<Transaction>> {
    await delay(300);
    
    requireTenantId(tenantId);
    let result = filterByTenant(transactions, tenantId) as Transaction[];
    
    if (filters.type) {
      result = result.filter(t => t.type === filters.type);
    }
    
    if (filters.accountId) {
      result = result.filter(t => t.accountId === filters.accountId);
    }
    
    if (filters.startDate) {
      result = result.filter(t => t.date >= filters.startDate!);
    }
    
    if (filters.endDate) {
      result = result.filter(t => t.date <= filters.endDate!);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(t =>
        t.transactionNumber.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by date (newest first)
    result.sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
    
    return paginate(result, filters.page || 1, filters.pageSize || 10);
  },

  /**
   * Get transaction by ID
   * CRITICAL FIX: Added tenant isolation
   */
  async getById(tenantId: string, id: string): Promise<Transaction | null> {
    await delay(200);
    requireTenantId(tenantId);
    const transaction = findByIdAndTenant(transactions, id, tenantId) as Transaction | null;
    return transaction;
  },

  /**
   * Create a new transaction
   * CRITICAL FIX: Added tenant isolation
   */
  async create(tenantId: string, data: CreateTransactionDto): Promise<Transaction> {
    await delay(400);
    
    requireTenantId(tenantId);
    
    // Verify account belongs to tenant
    const account = findByIdAndTenant(accounts, data.accountId, tenantId);
    if (!account) throw new Error('Account not found');
    
    // Generate transaction number (within tenant)
    const tenantTransactions = filterByTenant(transactions, tenantId) as Transaction[];
    const year = new Date().getFullYear();
    const existingTxn = tenantTransactions.filter(t => t.transactionNumber.startsWith(`TXN-${year}`));
    const nextNumber = existingTxn.length + 1;
    const transactionNumber = `TXN-${year}-${String(nextNumber).padStart(4, '0')}`;
    
    // Update account balance
    const accountIndex = accounts.findIndex(a => a.id === data.accountId);
    if (accountIndex === -1) throw new Error('Account not found');
    
    const newBalance = data.type === 'credit'
      ? accounts[accountIndex].balance + data.amount
      : accounts[accountIndex].balance - data.amount;
    
    accounts[accountIndex].balance = newBalance;
    accounts[accountIndex].updatedAt = now();
    
    const newTransaction: Transaction & { tenantId: string } = {
      id: generateId(),
      tenantId, // CRITICAL: Tenant isolation
      transactionNumber,
      date: data.date || today,
      accountId: data.accountId,
      account,
      type: data.type,
      amount: data.amount,
      balance: newBalance,
      description: data.description,
      referenceId: data.referenceId,
      createdAt: now(),
      updatedAt: now(),
    };
    
    transactions.unshift(newTransaction);
    return newTransaction;
  },

  /**
   * Get transaction statistics
   */
  async getStats(tenantId: string, filters: { startDate?: string; endDate?: string } = {}): Promise<{
    totalDebits: number;
    totalCredits: number;
    netAmount: number;
  }> {
    await delay(200);
    
    requireTenantId(tenantId);
    // CRITICAL: Filter transactions by tenant first
    let result = filterByTenant(transactions, tenantId) as Transaction[];
    
    if (filters.startDate) {
      result = result.filter(t => t.date >= filters.startDate!);
    }
    
    if (filters.endDate) {
      result = result.filter(t => t.date <= filters.endDate!);
    }
    
    const totalDebits = result.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
    const totalCredits = result.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalDebits,
      totalCredits,
      netAmount: totalCredits - totalDebits,
    };
  },
};

// Analytics Service (for reports and dashboard)
export const analyticsService = {
  /**
   * Get financial summary for dashboard
   */
  async getFinancialSummary(tenantId: string): Promise<{
    revenueMTD: number;
    expensesMTD: number;
    grossOperatingProfit: number;
    revenueTrend: 'up' | 'down';
    expensesTrend: 'up' | 'down';
  }> {
    await delay(300);
    
    requireTenantId(tenantId);
    const stats = await accountService.getStats(tenantId);
    
    // Calculate MTD (Month to Date) - simplified calculation
    const revenueMTD = stats.totalRevenue * 0.15; // 15% of total for demo
    const expensesMTD = stats.totalExpenses * 0.12; // 12% of total for demo
    const grossOperatingProfit = revenueMTD - expensesMTD;
    
    return {
      revenueMTD,
      expensesMTD,
      grossOperatingProfit,
      revenueTrend: 'up',
      expensesTrend: 'down',
    };
  },

  /**
   * Get profit & loss report
   */
  async getProfitLossReport(tenantId: string, startDate: string, endDate: string): Promise<{
    revenue: {
      rooms: number;
      fnb: number;
      other: number;
      total: number;
    };
    expenses: {
      salaries: number;
      utilities: number;
      supplies: number;
      marketing: number;
      other: number;
      total: number;
    };
    netIncome: number;
  }> {
    await delay(400);
    
    requireTenantId(tenantId);
    const stats = await accountService.getStats(tenantId);
    
    // Calculate revenue breakdown (within tenant)
    const tenantAccounts = filterByTenant(accounts, tenantId) as Account[];
    const roomRevenue = tenantAccounts.find(a => a.code === '4000')?.balance || 0;
    const fnbRevenue = tenantAccounts.find(a => a.code === '4100')?.balance || 0;
    const otherRevenue = stats.totalRevenue - roomRevenue - fnbRevenue;
    
    // Calculate expense breakdown (within tenant)
    const salaries = tenantAccounts.find(a => a.code === '5000')?.balance || 0;
    const utilities = tenantAccounts.find(a => a.code === '5100')?.balance || 0;
    const supplies = stats.totalExpenses * 0.11;
    const marketing = stats.totalExpenses * 0.07;
    const otherExpenses = stats.totalExpenses - salaries - utilities - supplies - marketing;
    
    return {
      revenue: {
        rooms: roomRevenue,
        fnb: fnbRevenue,
        other: otherRevenue,
        total: stats.totalRevenue,
      },
      expenses: {
        salaries,
        utilities,
        supplies,
        marketing,
        other: otherExpenses,
        total: stats.totalExpenses,
      },
      netIncome: stats.totalRevenue - stats.totalExpenses,
    };
  },

  /**
   * Get occupancy report
   * CRITICAL FIX: Added tenant isolation
   */
  async getOccupancyReport(tenantId: string): Promise<Array<{ month: string; rate: number }>> {
    await delay(300);
    
    requireTenantId(tenantId);
    // Mock occupancy data - in real app, this would come from reservation/room data filtered by tenant
    // For now, return mock data (tenant-specific calculation would require reservationService integration)
    return [
      { month: 'Jan', rate: 72 },
      { month: 'Feb', rate: 78 },
      { month: 'Mar', rate: 82 },
      { month: 'Apr', rate: 75 },
      { month: 'May', rate: 68 },
      { month: 'Jun', rate: 85 },
    ];
  },
};

