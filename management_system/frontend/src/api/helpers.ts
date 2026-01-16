// ============================================================
// API HELPERS - Utilities for Mock API Layer
// ============================================================

import type { PaginatedResponse } from '@/types';

// Simulate network delay
export const delay = (ms: number = 300): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Generate unique IDs
export const generateId = (): string => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
};

// Generate sequential IDs with prefix
export const generateSequentialId = (prefix: string, existingIds: string[]): string => {
  const numbers = existingIds
    .filter(id => id.startsWith(prefix))
    .map(id => parseInt(id.replace(prefix, ''), 10))
    .filter(n => !isNaN(n));
  
  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
  return `${prefix}${String(maxNumber + 1).padStart(4, '0')}`;
};

// Get current timestamp
export const now = (): string => new Date().toISOString();

// Get current date (YYYY-MM-DD)
export const today = (): string => new Date().toISOString().split('T')[0];

// Paginate array
export function paginate<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 10
): PaginatedResponse<T> {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    data: items.slice(startIndex, endIndex),
    total,
    page,
    pageSize,
    totalPages,
  };
}

// Filter helper
export function filterByText<T>(
  items: T[],
  searchText: string,
  fields: (keyof T)[]
): T[] {
  if (!searchText) return items;
  
  const lowerSearch = searchText.toLowerCase();
  return items.filter(item =>
    fields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowerSearch);
      }
      return false;
    })
  );
}

// Sort helper
export function sortBy<T>(
  items: T[],
  field: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    const comparison = aVal < bVal ? -1 : 1;
    return order === 'asc' ? comparison : -comparison;
  });
}

// Date range filter
export function filterByDateRange<T>(
  items: T[],
  field: keyof T,
  startDate?: string,
  endDate?: string
): T[] {
  return items.filter(item => {
    const value = item[field] as string;
    if (!value) return false;
    
    if (startDate && value < startDate) return false;
    if (endDate && value > endDate) return false;
    
    return true;
  });
}

// Random selection from array
export function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate random number in range
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random date within range
export function randomDate(start: Date, end: Date): string {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime).toISOString().split('T')[0];
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Calculate nights between dates
export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Add days to date
export function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Subtract days from date
export function subtractDays(date: string, days: number): string {
  return addDays(date, -days);
}
