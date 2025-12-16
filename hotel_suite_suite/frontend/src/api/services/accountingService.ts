import type { Account, AccountType, Transaction, TransactionType, PaginatedResponse } from '@/types';
import { delay, generateId, now, paginate } from '../helpers';

// In-memory stores
let accounts: Account[] = [
  { id: 'acc-001', code: '1000', name: 'Cash', type: 'asset', balance: 1250000, currency: 'INR', isActive: true, isSystemAccount: true, createdAt: now(), updatedAt: now() },
  { id: 'acc-002', code: '1100', name: 'Accounts Receivable', type: 'asset', balance: 450000, currency: 'INR', isActive: true, isSystemAccount: true, createdAt: now(), updatedAt: now() },
  { id: 'acc-003', code: '2000', name: 'Accounts Payable', type: 'liability', balance: 320000, currency: 'INR', isActive: true, isSystemAccount: true, createdAt: now(), updatedAt: now() },
  { id: 'acc-004', code: '3000', name: 'Equity', type: 'equity', balance: 5000000, currency: 'INR', isActive: true, isSystemAccount: true, createdAt: now(), updatedAt: now() },
  { id: 'acc-005', code: '4000', name: 'Room Revenue', type: 'revenue', balance: 2850000, currency: 'INR', isActive: true, isSystemAccount: true, createdAt: now(), updatedAt: now() },
  { id: 'acc-006', code: '4100', name: 'F&B Revenue', type: 'revenue', balance: 890000, currency: 'INR', isActive: true, isSystemAccount: true, createdAt: now(), updatedAt: now() },
  { id: 'acc-007', code: '5000', name: 'Salaries & Wages', type: 'expense', balance: 980000, currency: 'INR', isActive: true, isSystemAccount: false, createdAt: now(), updatedAt: now() },
  { id: 'acc-008', code: '5100', name: 'Utilities', type: 'expense', balance: 245000, currency: 'INR', isActive: true, isSystemAccount: false, createdAt: now(), updatedAt: now() },
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
   */
  async getAll(filters: AccountFilters = {}): Promise<Account[]> {
    await delay(200);
    
    let result = [...accounts];
    
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
   */
  async getById(id: string): Promise<Account | null> {
    await delay(200);
    return accounts.find(a => a.id === id) || null;
  },

  /**
   * Create a new account
   */
  async create(data: CreateAccountDto): Promise<Account> {
    await delay(400);
    
    // Check if code already exists
    if (accounts.some(a => a.code === data.code)) {
      throw new Error('Account code already exists');
    }
    
    const newAccount: Account = {
      id: generateId(),
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
   */
  async update(id: string, data: Partial<CreateAccountDto>): Promise<Account> {
    await delay(400);
    
    const index = accounts.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Account not found');
    
    // Prevent updating system accounts
    if (accounts[index].isSystemAccount && (data.code || data.type)) {
      throw new Error('Cannot modify system account code or type');
    }
    
    // Check code uniqueness if updating
    if (data.code && accounts.some(a => a.code === data.code && a.id !== id)) {
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
   */
  async getStats(): Promise<{
    totalAssets: number;
    totalLiabilities: number;
    totalRevenue: number;
    totalExpenses: number;
    totalEquity: number;
  }> {
    await delay(200);
    
    return {
      totalAssets: accounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + a.balance, 0),
      totalLiabilities: accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + a.balance, 0),
      totalRevenue: accounts.filter(a => a.type === 'revenue').reduce((sum, a) => sum + a.balance, 0),
      totalExpenses: accounts.filter(a => a.type === 'expense').reduce((sum, a) => sum + a.balance, 0),
      totalEquity: accounts.filter(a => a.type === 'equity').reduce((sum, a) => sum + a.balance, 0),
    };
  },
};

// Transaction Service
export const transactionService = {
  /**
   * Get all transactions
   */
  async getAll(filters: TransactionFilters = {}): Promise<PaginatedResponse<Transaction>> {
    await delay(300);
    
    let result = [...transactions];
    
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
   */
  async getById(id: string): Promise<Transaction | null> {
    await delay(200);
    return transactions.find(t => t.id === id) || null;
  },

  /**
   * Create a new transaction
   */
  async create(data: CreateTransactionDto): Promise<Transaction> {
    await delay(400);
    
    const account = accounts.find(a => a.id === data.accountId);
    if (!account) throw new Error('Account not found');
    
    // Generate transaction number
    const year = new Date().getFullYear();
    const existingTxn = transactions.filter(t => t.transactionNumber.startsWith(`TXN-${year}`));
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
    
    const newTransaction: Transaction = {
      id: generateId(),
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
  async getStats(filters: { startDate?: string; endDate?: string } = {}): Promise<{
    totalDebits: number;
    totalCredits: number;
    netAmount: number;
  }> {
    await delay(200);
    
    let result = [...transactions];
    
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
  async getFinancialSummary(): Promise<{
    revenueMTD: number;
    expensesMTD: number;
    grossOperatingProfit: number;
    revenueTrend: 'up' | 'down';
    expensesTrend: 'up' | 'down';
  }> {
    await delay(300);
    
    const stats = await accountService.getStats();
    
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
  async getProfitLossReport(startDate: string, endDate: string): Promise<{
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
    
    const stats = await accountService.getStats();
    
    // Calculate revenue breakdown
    const roomRevenue = accounts.find(a => a.code === '4000')?.balance || 0;
    const fnbRevenue = accounts.find(a => a.code === '4100')?.balance || 0;
    const otherRevenue = stats.totalRevenue - roomRevenue - fnbRevenue;
    
    // Calculate expense breakdown
    const salaries = accounts.find(a => a.code === '5000')?.balance || 0;
    const utilities = accounts.find(a => a.code === '5100')?.balance || 0;
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
   */
  async getOccupancyReport(): Promise<Array<{ month: string; rate: number }>> {
    await delay(300);
    
    // Mock occupancy data - in real app, this would come from reservation/room data
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

