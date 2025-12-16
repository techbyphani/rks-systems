import type { Guest, PaginatedResponse } from '@/types';
import { mockGuests } from '../mockData';
import { delay, generateId, now, paginate, filterByText, sortBy } from '../helpers';
import { requireTenantId, filterByTenant, findByIdAndTenant } from '../helpers/tenantFilter';

// In-memory store
let guests = [...mockGuests];

export interface GuestFilters {
  search?: string;
  vipStatus?: Guest['vipStatus'];
  sortBy?: keyof Guest;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface CreateGuestDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: Guest['address'];
  idType?: Guest['idType'];
  idNumber?: string;
  idExpiryDate?: string;
  vipStatus?: Guest['vipStatus'];
  notes?: string;
  preferences?: Guest['preferences'];
  tags?: string[];
}

export interface UpdateGuestDto extends Partial<CreateGuestDto> {}

export const guestService = {
  /**
   * Get all guests with optional filtering and pagination
   */
  async getAll(filters: GuestFilters = {}): Promise<PaginatedResponse<Guest>> {
    await delay(300);
    
    let result = [...guests];
    
    // Text search
    if (filters.search) {
      result = filterByText(result, filters.search, ['firstName', 'lastName', 'email', 'phone']);
    }
    
    // VIP status filter
    if (filters.vipStatus) {
      result = result.filter(g => g.vipStatus === filters.vipStatus);
    }
    
    // Sorting
    if (filters.sortBy) {
      result = sortBy(result, filters.sortBy, filters.sortOrder || 'asc');
    } else {
      result = sortBy(result, 'updatedAt', 'desc');
    }
    
    // Pagination
    return paginate(result, filters.page || 1, filters.pageSize || 10);
  },

  /**
   * Get a single guest by ID
   * CRITICAL FIX: Added tenant isolation
   */
  async getById(tenantId: string, id: string): Promise<Guest | null> {
    await delay(200);
    requireTenantId(tenantId);
    return findByIdAndTenant(guests, id, tenantId);
  },

  /**
   * Search guests by name, email, or phone
   * CRITICAL FIX: Added tenant isolation
   */
  async search(tenantId: string, query: string): Promise<Guest[]> {
    await delay(200);
    if (!query || query.length < 2) return [];
    
    requireTenantId(tenantId);
    const tenantGuests = filterByTenant(guests, tenantId) as Guest[];
    return filterByText(tenantGuests, query, ['firstName', 'lastName', 'email', 'phone']).slice(0, 10);
  },

  /**
   * Create a new guest
   */
  async create(data: CreateGuestDto): Promise<Guest> {
    await delay(400);
    
    const newGuest: Guest = {
      id: generateId(),
      ...data,
      vipStatus: data.vipStatus || 'none',
      totalStays: 0,
      totalSpend: 0,
      tags: data.tags || [],
      createdAt: now(),
      updatedAt: now(),
    };
    
    guests.unshift(newGuest);
    return newGuest;
  },

  /**
   * Update an existing guest
   */
  async update(id: string, data: UpdateGuestDto): Promise<Guest> {
    await delay(400);
    
    const index = guests.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error('Guest not found');
    }
    
    guests[index] = {
      ...guests[index],
      ...data,
      updatedAt: now(),
    };
    
    return guests[index];
  },

  /**
   * Delete a guest
   */
  async delete(id: string): Promise<void> {
    await delay(300);
    const index = guests.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error('Guest not found');
    }
    guests.splice(index, 1);
  },

  /**
   * Get VIP guests
   */
  async getVipGuests(): Promise<Guest[]> {
    await delay(200);
    return guests.filter(g => g.vipStatus !== 'none');
  },

  /**
   * Get guest statistics
   */
  async getStats(): Promise<{
    total: number;
    vipCounts: Record<Guest['vipStatus'], number>;
    newThisMonth: number;
  }> {
    await delay(200);
    
    const thisMonth = new Date().toISOString().slice(0, 7);
    
    return {
      total: guests.length,
      vipCounts: {
        none: guests.filter(g => g.vipStatus === 'none').length,
        silver: guests.filter(g => g.vipStatus === 'silver').length,
        gold: guests.filter(g => g.vipStatus === 'gold').length,
        platinum: guests.filter(g => g.vipStatus === 'platinum').length,
      },
      newThisMonth: guests.filter(g => g.createdAt.startsWith(thisMonth)).length,
    };
  },
};
