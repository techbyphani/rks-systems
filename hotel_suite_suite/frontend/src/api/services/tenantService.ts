/**
 * Tenant Service - Manages multi-tenant operations
 * CRUD for tenants (hotels) and tenant users
 */

import type { 
  Tenant, 
  TenantUser, 
  PaginatedResponse,
  CreateTenantDto,
  UpdateTenantDto,
  CreateTenantUserDto,
  UpdateTenantUserDto,
  TenantStatus,
  ModuleId,
} from '@/types';
import { mockTenants, mockTenantUsers, getTenantStats } from '../mockData/tenants';
import { delay, generateId, now, paginate, filterByText, sortBy } from '../helpers';
import { getPlanById } from '@/config/plans';

// In-memory stores
let tenants = [...mockTenants];
let tenantUsers = [...mockTenantUsers];

// ============================================================
// TENANT FILTERS
// ============================================================

export interface TenantFilters {
  search?: string;
  status?: TenantStatus;
  planId?: string;
  region?: string;
  sortBy?: keyof Tenant;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface TenantUserFilters {
  tenantId?: string;
  search?: string;
  role?: string;
  isActive?: boolean;
  sortBy?: keyof TenantUser;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// ============================================================
// TENANT SERVICE
// ============================================================

export const tenantService = {
  /**
   * Get all tenants with filtering and pagination
   */
  async getAll(filters: TenantFilters = {}): Promise<PaginatedResponse<Tenant>> {
    await delay(300);
    
    let result = [...tenants];
    
    // Text search
    if (filters.search) {
      result = filterByText(result, filters.search, ['name', 'slug', 'contactEmail', 'region']);
    }
    
    // Status filter
    if (filters.status) {
      result = result.filter(t => t.status === filters.status);
    }
    
    // Plan filter
    if (filters.planId) {
      result = result.filter(t => t.planId === filters.planId);
    }
    
    // Region filter
    if (filters.region) {
      result = result.filter(t => t.region === filters.region);
    }
    
    // Sorting
    if (filters.sortBy) {
      result = sortBy(result, filters.sortBy, filters.sortOrder || 'asc');
    } else {
      result = sortBy(result, 'createdAt', 'desc');
    }
    
    // Enrich with user count
    result = result.map(t => ({
      ...t,
      userCount: tenantUsers.filter(u => u.tenantId === t.id).length,
    }));
    
    return paginate(result, filters.page || 1, filters.pageSize || 10);
  },

  /**
   * Get tenant by ID
   */
  async getById(id: string): Promise<Tenant | null> {
    await delay(200);
    const tenant = tenants.find(t => t.id === id);
    if (tenant) {
      return {
        ...tenant,
        userCount: tenantUsers.filter(u => u.tenantId === id).length,
      };
    }
    return null;
  },

  /**
   * Get tenant by slug
   */
  async getBySlug(slug: string): Promise<Tenant | null> {
    await delay(200);
    const tenant = tenants.find(t => t.slug === slug);
    if (tenant) {
      return {
        ...tenant,
        userCount: tenantUsers.filter(u => u.tenantId === tenant.id).length,
      };
    }
    return null;
  },

  /**
   * Create a new tenant with admin user
   */
  async create(data: CreateTenantDto): Promise<{ tenant: Tenant; adminUser: TenantUser }> {
    await delay(500);
    
    // Generate slug if not provided
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Check for duplicate slug
    if (tenants.some(t => t.slug === slug)) {
      throw new Error('A hotel with this identifier already exists');
    }
    
    // Get plan details
    const plan = getPlanById(data.planId);
    if (!plan) {
      throw new Error('Invalid subscription plan');
    }
    
    // Create tenant
    const tenantId = generateId();
    const newTenant: Tenant = {
      id: tenantId,
      name: data.name,
      slug,
      region: data.region,
      timezone: data.timezone || 'Asia/Kolkata',
      currency: data.currency || 'INR',
      planId: data.planId,
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
      enabledModules: data.enabledModules || plan.includedModules,
      maxUsers: plan.maxUsers,
      maxRooms: data.maxRooms || plan.maxRooms,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      userCount: 1,
      roomCount: 0,
      createdAt: now(),
      updatedAt: now(),
    };
    
    // Create admin user
    const adminUser: TenantUser = {
      id: generateId(),
      tenantId: tenantId,
      firstName: data.adminFirstName,
      lastName: data.adminLastName,
      email: data.adminEmail,
      role: 'hotel_admin',
      moduleAccess: newTenant.enabledModules,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    };
    
    tenants.unshift(newTenant);
    tenantUsers.push(adminUser);
    
    return { tenant: newTenant, adminUser };
  },

  /**
   * Update tenant
   */
  async update(id: string, data: UpdateTenantDto): Promise<Tenant> {
    await delay(400);
    
    const index = tenants.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Tenant not found');
    }
    
    tenants[index] = {
      ...tenants[index],
      ...data,
      updatedAt: now(),
    };
    
    return tenants[index];
  },

  /**
   * Update tenant modules
   */
  async updateModules(id: string, modules: ModuleId[]): Promise<Tenant> {
    await delay(300);
    
    const index = tenants.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Tenant not found');
    }
    
    tenants[index] = {
      ...tenants[index],
      enabledModules: modules,
      updatedAt: now(),
    };
    
    // Update all users' module access to only include enabled modules
    tenantUsers = tenantUsers.map(user => {
      if (user.tenantId === id) {
        return {
          ...user,
          moduleAccess: user.moduleAccess.filter(m => modules.includes(m)),
          updatedAt: now(),
        };
      }
      return user;
    });
    
    return tenants[index];
  },

  /**
   * Update tenant status
   */
  async updateStatus(id: string, status: TenantStatus): Promise<Tenant> {
    await delay(300);
    
    const index = tenants.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Tenant not found');
    }
    
    tenants[index] = {
      ...tenants[index],
      status,
      updatedAt: now(),
      ...(status === 'active' && !tenants[index].subscribedAt 
        ? { subscribedAt: now(), trialEndsAt: undefined } 
        : {}),
    };
    
    return tenants[index];
  },

  /**
   * Delete tenant
   */
  async delete(id: string): Promise<void> {
    await delay(300);
    
    const index = tenants.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Tenant not found');
    }
    
    // Remove tenant
    tenants.splice(index, 1);
    
    // Remove all users of this tenant
    tenantUsers = tenantUsers.filter(u => u.tenantId !== id);
  },

  /**
   * Get tenant statistics
   */
  async getStats() {
    await delay(200);
    return getTenantStats();
  },

  /**
   * Search tenants by name
   */
  async search(query: string): Promise<Tenant[]> {
    await delay(200);
    if (!query || query.length < 2) return [];
    return filterByText(tenants, query, ['name', 'slug']).slice(0, 10);
  },
};

// ============================================================
// TENANT USER SERVICE
// ============================================================

export const tenantUserService = {
  /**
   * Get all users for a tenant
   */
  async getAll(filters: TenantUserFilters = {}): Promise<PaginatedResponse<TenantUser>> {
    await delay(300);
    
    let result = [...tenantUsers];
    
    // Filter by tenant
    if (filters.tenantId) {
      result = result.filter(u => u.tenantId === filters.tenantId);
    }
    
    // Text search
    if (filters.search) {
      result = filterByText(result, filters.search, ['firstName', 'lastName', 'email']);
    }
    
    // Role filter
    if (filters.role) {
      result = result.filter(u => u.role === filters.role);
    }
    
    // Active filter
    if (filters.isActive !== undefined) {
      result = result.filter(u => u.isActive === filters.isActive);
    }
    
    // Sorting
    if (filters.sortBy) {
      result = sortBy(result, filters.sortBy, filters.sortOrder || 'asc');
    } else {
      result = sortBy(result, 'createdAt', 'desc');
    }
    
    return paginate(result, filters.page || 1, filters.pageSize || 20);
  },

  /**
   * Get user by ID
   */
  async getById(id: string): Promise<TenantUser | null> {
    await delay(200);
    return tenantUsers.find(u => u.id === id) || null;
  },

  /**
   * Get user by email within a tenant
   */
  async getByEmail(tenantId: string, email: string): Promise<TenantUser | null> {
    await delay(200);
    return tenantUsers.find(u => u.tenantId === tenantId && u.email === email) || null;
  },

  /**
   * Create user
   */
  async create(data: CreateTenantUserDto): Promise<TenantUser> {
    await delay(400);
    
    // Check tenant exists
    const tenant = tenants.find(t => t.id === data.tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    
    // Check user limit
    const currentUserCount = tenantUsers.filter(u => u.tenantId === data.tenantId).length;
    if (tenant.maxUsers !== -1 && currentUserCount >= tenant.maxUsers) {
      throw new Error(`User limit reached (${tenant.maxUsers} users)`);
    }
    
    // Check for duplicate email
    if (tenantUsers.some(u => u.tenantId === data.tenantId && u.email === data.email)) {
      throw new Error('A user with this email already exists');
    }
    
    // Validate module access
    const invalidModules = data.moduleAccess.filter(m => !tenant.enabledModules.includes(m));
    if (invalidModules.length > 0) {
      throw new Error(`Modules not available for this hotel: ${invalidModules.join(', ')}`);
    }
    
    const newUser: TenantUser = {
      id: generateId(),
      tenantId: data.tenantId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      role: data.role,
      moduleAccess: data.moduleAccess,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    };
    
    tenantUsers.push(newUser);
    return newUser;
  },

  /**
   * Update user
   */
  async update(id: string, data: UpdateTenantUserDto): Promise<TenantUser> {
    await delay(400);
    
    const index = tenantUsers.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }
    
    // If updating module access, validate against tenant's enabled modules
    if (data.moduleAccess) {
      const tenant = tenants.find(t => t.id === tenantUsers[index].tenantId);
      if (tenant) {
        const invalidModules = data.moduleAccess.filter(m => !tenant.enabledModules.includes(m));
        if (invalidModules.length > 0) {
          throw new Error(`Modules not available: ${invalidModules.join(', ')}`);
        }
      }
    }
    
    tenantUsers[index] = {
      ...tenantUsers[index],
      ...data,
      updatedAt: now(),
    };
    
    return tenantUsers[index];
  },

  /**
   * Toggle user active status
   */
  async toggleActive(id: string): Promise<TenantUser> {
    await delay(300);
    
    const index = tenantUsers.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }
    
    tenantUsers[index] = {
      ...tenantUsers[index],
      isActive: !tenantUsers[index].isActive,
      updatedAt: now(),
    };
    
    return tenantUsers[index];
  },

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    await delay(300);
    
    const index = tenantUsers.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }
    
    // Don't allow deleting the last admin
    const user = tenantUsers[index];
    if (user.role === 'hotel_admin') {
      const otherAdmins = tenantUsers.filter(
        u => u.tenantId === user.tenantId && u.role === 'hotel_admin' && u.id !== id
      );
      if (otherAdmins.length === 0) {
        throw new Error('Cannot delete the last admin user');
      }
    }
    
    tenantUsers.splice(index, 1);
  },

  /**
   * Reset user password (mock - just returns success)
   */
  async resetPassword(id: string): Promise<{ temporaryPassword: string }> {
    await delay(300);
    
    const user = tenantUsers.find(u => u.id === id);
    if (!user) {
      throw new Error('User not found');
    }
    
    // In real implementation, would send email with reset link
    return { temporaryPassword: 'TempPass123!' };
  },

  /**
   * Get user count by tenant
   */
  async getCountByTenant(tenantId: string): Promise<{ total: number; active: number }> {
    await delay(100);
    
    const users = tenantUsers.filter(u => u.tenantId === tenantId);
    return {
      total: users.length,
      active: users.filter(u => u.isActive).length,
    };
  },
};
