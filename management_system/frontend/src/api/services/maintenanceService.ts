import type { MaintenanceRequest, MaintenanceRequestStatus, MaintenanceCategory, MaintenanceRequestPriority, PaginatedResponse } from '@/types';
import { mockRooms } from '../mockData/rooms';
import { delay, now, paginate, generateSequentialId } from '../helpers';
import { requireTenantId, filterByTenant, findByIdAndTenant } from '../helpers/tenantFilter';

// In-memory store
let requests: MaintenanceRequest[] = [];

// Initialize with some mock requests
const initializeRequests = () => {
  if (requests.length === 0) {
    const statuses: MaintenanceRequestStatus[] = ['reported', 'acknowledged', 'in_progress', 'completed'];
    const categories: MaintenanceCategory[] = ['plumbing', 'electrical', 'hvac', 'furniture', 'appliance'];
    
    // CRITICAL: Only initialize requests for tenant-001 rooms (mock data initialization)
    const tenantRooms = filterByTenant(mockRooms, 'tenant-001') as typeof mockRooms;
    tenantRooms.slice(0, 5).forEach((room, index) => {
      requests.push({
        id: `MR${String(index + 1).padStart(3, '0')}`,
        tenantId: 'tenant-001',
        ticketNumber: `MNT-2024-${String(index + 1).padStart(3, '0')}`,
        roomId: room.id,
        room,
        category: categories[index % categories.length],
        description: `Sample maintenance issue in room ${room.roomNumber}`,
        priority: index % 2 === 0 ? 'high' : 'normal',
        status: statuses[index % statuses.length],
        reportedBy: 'emp-001',
        createdAt: now(),
        updatedAt: now(),
      });
    });
  }
};

initializeRequests();

export interface MaintenanceRequestFilters {
  roomId?: string;
  status?: MaintenanceRequestStatus | MaintenanceRequestStatus[];
  category?: MaintenanceCategory;
  priority?: MaintenanceRequestPriority;
  assignedTo?: string;
  reportedBy?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateMaintenanceRequestDto {
  roomId?: string;
  location?: string;
  category: MaintenanceCategory;
  description: string;
  priority: MaintenanceRequestPriority;
  reportedBy: string;
  images?: string[];
}

export interface UpdateMaintenanceRequestDto {
  status?: MaintenanceRequestStatus;
  assignedTo?: string;
  priority?: MaintenanceRequestPriority;
  description?: string;
  estimatedCost?: number;
  actualCost?: number;
  resolution?: string;
  images?: string[];
}

export const maintenanceService = {
  /**
   * Get all maintenance requests
   */
  async getAll(tenantId: string, filters: MaintenanceRequestFilters = {}): Promise<PaginatedResponse<MaintenanceRequest>> {
    await delay(300);
    requireTenantId(tenantId);
    
    let result = filterByTenant(requests, tenantId) as MaintenanceRequest[];
    
    // Status filter
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      result = result.filter(r => statuses.includes(r.status));
    }
    
    // Room filter
    if (filters.roomId) {
      result = result.filter(r => r.roomId === filters.roomId);
    }
    
    // Category filter
    if (filters.category) {
      result = result.filter(r => r.category === filters.category);
    }
    
    // Priority filter
    if (filters.priority) {
      result = result.filter(r => r.priority === filters.priority);
    }
    
    // Assigned to filter
    if (filters.assignedTo) {
      result = result.filter(r => r.assignedTo === filters.assignedTo);
    }
    
    // Reported by filter
    if (filters.reportedBy) {
      result = result.filter(r => r.reportedBy === filters.reportedBy);
    }
    
    // Sort by priority and creation date
    result.sort((a, b) => {
      const priorityOrder = { emergency: 0, high: 1, normal: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return paginate(result, filters.page || 1, filters.pageSize || 20);
  },

  /**
   * Get request by ID
   */
  async getById(tenantId: string, id: string): Promise<MaintenanceRequest | null> {
    await delay(200);
    requireTenantId(tenantId);
    return findByIdAndTenant(requests, id, tenantId);
  },

  /**
   * Get request by ticket number
   */
  async getByTicketNumber(tenantId: string, ticketNumber: string): Promise<MaintenanceRequest | null> {
    await delay(200);
    requireTenantId(tenantId);
    const tenantRequests = filterByTenant(requests, tenantId) as MaintenanceRequest[];
    return tenantRequests.find(r => r.ticketNumber === ticketNumber) || null;
  },

  /**
   * Create a new maintenance request
   * 
   * HARDENING FIX #4: Auto-update room status to out_of_order when maintenance is created
   */
  async create(
    tenantId: string, 
    data: CreateMaintenanceRequestDto,
    roomExpectedVersion?: number // Optional - only needed if room status will be updated
  ): Promise<MaintenanceRequest> {
    await delay(300);
    requireTenantId(tenantId);
    
    // Validate room if provided (should also check tenant)
    let room = null;
    if (data.roomId) {
      room = mockRooms.find(r => r.id === data.roomId && r.tenantId === tenantId);
      if (!room) {
        throw new Error('Room not found');
      }
    }
    
    // Generate ticket number (scoped to tenant)
    const year = new Date().getFullYear();
    const tenantRequests = filterByTenant(requests, tenantId) as MaintenanceRequest[];
    const existingTickets = tenantRequests
      .filter(r => r.ticketNumber.startsWith(`MNT-${year}-`))
      .map(r => {
        const num = parseInt(r.ticketNumber.split('-')[2], 10);
        return isNaN(num) ? 0 : num;
      });
    const nextNumber = existingTickets.length > 0 ? Math.max(...existingTickets) + 1 : 1;
    const ticketNumber = `MNT-${year}-${String(nextNumber).padStart(3, '0')}`;
    
    const newRequest: MaintenanceRequest = {
      id: generateSequentialId('MR', requests.map(r => r.id)),
      tenantId,
      ticketNumber,
      roomId: data.roomId,
      room: room || undefined,
      location: data.location,
      category: data.category,
      description: data.description,
      priority: data.priority,
      status: 'reported',
      reportedBy: data.reportedBy,
      images: data.images,
      createdAt: now(),
      updatedAt: now(),
    };
    
    requests.push(newRequest);
    
    // HARDENING FIX #4: Auto-update room status to out_of_order when maintenance is created
    // NOTE: Maintenance can be created for occupied rooms (guest safety - status reflects occupancy).
    // Status is only auto-updated if room is NOT occupied (prevents disrupting guest stay).
    if (data.roomId && room) {
      try {
        const { roomService } = await import('./roomService');
        const currentRoom = await roomService.getById(tenantId, data.roomId);
        
        // Only update if room is not already out_of_order or out_of_service
        // INTENTIONAL: Do NOT update status if room is 'occupied' (maintenance can happen during stay)
        if (currentRoom && 
            currentRoom.status !== 'out_of_order' && 
            currentRoom.status !== 'out_of_service' &&
            currentRoom.status !== 'occupied') {
          
          // Use room's current version if available
          const version = currentRoom.version ?? 0;
          
          // HARDENING: Use central status change function
          // Note: This requires the roomService to export changeRoomStatus or we use updateStatus
          // For now, we'll use updateStatus which internally uses changeRoomStatus
          await roomService.updateStatus(
            tenantId, 
            data.roomId, 
            'out_of_order', 
            data.reportedBy,
            version,
            `Maintenance request created: ${ticketNumber} - ${data.description}`
          );
        }
      } catch (error) {
        // Log error but don't fail request creation
        console.error('Failed to auto-update room status after maintenance creation:', error);
        // HARDENING: Log to audit trail
        const { logFailedOperation } = await import('../helpers/roomAudit');
        if (data.roomId) {
          logFailedOperation(tenantId, data.roomId, 'auto_update_room_status', 
            `Failed to update room status: ${error}`, data.reportedBy);
        }
      }
    }
    
    return newRequest;
  },

  /**
   * Update a maintenance request
   */
  async update(tenantId: string, id: string, data: UpdateMaintenanceRequestDto): Promise<MaintenanceRequest> {
    await delay(300);
    requireTenantId(tenantId);
    
    const request = findByIdAndTenant(requests, id, tenantId);
    if (!request) throw new Error('Request not found');
    
    const index = requests.findIndex(r => r.id === id && r.tenantId === tenantId);
    
    const updates: Partial<MaintenanceRequest> = {
      ...data,
      updatedAt: now(),
    };
    
    // Handle status transitions
    if (data.status === 'in_progress' && !requests[index].startedAt) {
      updates.startedAt = now();
    }
    
    if (data.status === 'completed' && !requests[index].completedAt) {
      updates.completedAt = now();
    }
    
    // Update assigned employee if assignedTo changes
    if (data.assignedTo && data.assignedTo !== requests[index].assignedTo) {
      updates.assignedTo = data.assignedTo;
      // In a real app, we'd fetch the employee here
    }
    
    requests[index] = {
      ...requests[index],
      ...updates,
    };
    
    return requests[index];
  },

  /**
   * Delete a request
   */
  async delete(tenantId: string, id: string): Promise<void> {
    await delay(300);
    requireTenantId(tenantId);
    
    const request = findByIdAndTenant(requests, id, tenantId);
    if (!request) throw new Error('Request not found');
    
    if (request.status === 'in_progress' || request.status === 'completed') {
      throw new Error('Cannot delete request that is in progress or completed');
    }
    
    const index = requests.findIndex(r => r.id === id && r.tenantId === tenantId);
    requests.splice(index, 1);
  },

  /**
   * Acknowledge a request
   */
  async acknowledge(tenantId: string, id: string): Promise<MaintenanceRequest> {
    await delay(300);
    requireTenantId(tenantId);
    
    const request = findByIdAndTenant(requests, id, tenantId);
    if (!request) throw new Error('Request not found');
    
    if (request.status !== 'reported') {
      throw new Error('Only reported requests can be acknowledged');
    }
    
    const index = requests.findIndex(r => r.id === id && r.tenantId === tenantId);
    requests[index] = {
      ...requests[index],
      status: 'acknowledged',
      updatedAt: now(),
    };
    
    return requests[index];
  },

  /**
   * Assign request to employee
   */
  async assign(tenantId: string, id: string, employeeId: string): Promise<MaintenanceRequest> {
    await delay(300);
    requireTenantId(tenantId);
    
    const request = findByIdAndTenant(requests, id, tenantId);
    if (!request) throw new Error('Request not found');
    
    const index = requests.findIndex(r => r.id === id && r.tenantId === tenantId);
    requests[index] = {
      ...requests[index],
      assignedTo: employeeId,
      status: requests[index].status === 'reported' || requests[index].status === 'acknowledged' 
        ? 'acknowledged' 
        : requests[index].status,
      updatedAt: now(),
    };
    
    return requests[index];
  },

  /**
   * Start work on a request
   */
  async start(tenantId: string, id: string): Promise<MaintenanceRequest> {
    await delay(300);
    requireTenantId(tenantId);
    
    const request = findByIdAndTenant(requests, id, tenantId);
    if (!request) throw new Error('Request not found');
    
    if (request.status === 'completed' || request.status === 'cancelled') {
      throw new Error('Cannot start a completed or cancelled request');
    }
    
    const index = requests.findIndex(r => r.id === id && r.tenantId === tenantId);
    requests[index] = {
      ...requests[index],
      status: 'in_progress',
      startedAt: now(),
      updatedAt: now(),
    };
    
    return requests[index];
  },

  /**
   * Complete a request
   * FEATURE #10: Auto-update room status when maintenance completes
   */
  async complete(tenantId: string, id: string, resolution: string, actualCost?: number): Promise<MaintenanceRequest> {
    await delay(300);
    requireTenantId(tenantId);
    
    const request = findByIdAndTenant(requests, id, tenantId);
    if (!request) throw new Error('Request not found');
    
    if (request.status === 'completed' || request.status === 'cancelled') {
      throw new Error('Request is already completed or cancelled');
    }
    
    const index = requests.findIndex(r => r.id === id && r.tenantId === tenantId);
    requests[index] = {
      ...requests[index],
      status: 'completed',
      completedAt: now(),
      resolution,
      actualCost: actualCost || requests[index].actualCost,
      updatedAt: now(),
    };
    
    // HARDENING FIX #4 & #5: Auto-update room status when maintenance completes
    // HARDENING FIX #1: Uses central changeRoomStatus (via updateStatus)
    // HARDENING FIX: Removed error swallowing - now fails loudly
    if (request.roomId) {
      const { roomService } = await import('./roomService');
      const room = await roomService.getById(tenantId, request.roomId);
      if (room && room.status === 'out_of_order') {
        // Check if there are other active maintenance requests for this room
        const otherActiveRequests = requests.filter(
          r => r.roomId === request.roomId && 
               r.id !== id && 
               r.status !== 'completed' && 
               r.status !== 'cancelled' &&
               r.tenantId === tenantId
        );
        
        // If no other active requests, room can be made dirty for cleaning
        if (otherActiveRequests.length === 0) {
          // HARDENING: Version is required - use room's current version
          const version = room.version ?? 0;
          // HARDENING: Use updateStatus which enforces state machine
          await roomService.updateStatus(
            tenantId, 
            request.roomId, 
            'dirty', 
            'system',
            version,
            `Maintenance completed: ${ticketNumber}`
          );
        }
      }
    }
    
    return requests[index];
  },

  /**
   * Put request on hold
   */
  async putOnHold(tenantId: string, id: string): Promise<MaintenanceRequest> {
    await delay(300);
    requireTenantId(tenantId);
    
    const request = findByIdAndTenant(requests, id, tenantId);
    if (!request) throw new Error('Request not found');
    
    if (request.status !== 'in_progress') {
      throw new Error('Only in-progress requests can be put on hold');
    }
    
    const index = requests.findIndex(r => r.id === id && r.tenantId === tenantId);
    requests[index] = {
      ...requests[index],
      status: 'on_hold',
      updatedAt: now(),
    };
    
    return requests[index];
  },

  /**
   * Cancel a request
   */
  async cancel(tenantId: string, id: string): Promise<MaintenanceRequest> {
    await delay(300);
    requireTenantId(tenantId);
    
    const request = findByIdAndTenant(requests, id, tenantId);
    if (!request) throw new Error('Request not found');
    
    if (request.status === 'completed') {
      throw new Error('Cannot cancel a completed request');
    }
    
    const index = requests.findIndex(r => r.id === id && r.tenantId === tenantId);
    requests[index] = {
      ...requests[index],
      status: 'cancelled',
      updatedAt: now(),
    };
    
    return requests[index];
  },

  /**
   * Get request statistics
   */
  async getStats(tenantId: string): Promise<{
    total: number;
    reported: number;
    acknowledged: number;
    inProgress: number;
    onHold: number;
    completed: number;
    cancelled: number;
  }> {
    await delay(200);
    requireTenantId(tenantId);
    
    const tenantRequests = filterByTenant(requests, tenantId) as MaintenanceRequest[];
    
    return {
      total: tenantRequests.length,
      reported: tenantRequests.filter(r => r.status === 'reported').length,
      acknowledged: tenantRequests.filter(r => r.status === 'acknowledged').length,
      inProgress: tenantRequests.filter(r => r.status === 'in_progress').length,
      onHold: tenantRequests.filter(r => r.status === 'on_hold').length,
      completed: tenantRequests.filter(r => r.status === 'completed').length,
      cancelled: tenantRequests.filter(r => r.status === 'cancelled').length,
    };
  },
};

