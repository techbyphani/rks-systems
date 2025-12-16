import type { MaintenanceRequest, MaintenanceRequestStatus, MaintenanceCategory, MaintenanceRequestPriority, PaginatedResponse } from '@/types';
import { mockRooms } from '../mockData/rooms';
import { delay, now, paginate, generateSequentialId } from '../helpers';

// In-memory store
let requests: MaintenanceRequest[] = [];

// Initialize with some mock requests
const initializeRequests = () => {
  if (requests.length === 0) {
    const statuses: MaintenanceRequestStatus[] = ['reported', 'acknowledged', 'in_progress', 'completed'];
    const categories: MaintenanceCategory[] = ['plumbing', 'electrical', 'hvac', 'furniture', 'appliance'];
    
    mockRooms.slice(0, 5).forEach((room, index) => {
      requests.push({
        id: `MR${String(index + 1).padStart(3, '0')}`,
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
  async getAll(filters: MaintenanceRequestFilters = {}): Promise<PaginatedResponse<MaintenanceRequest>> {
    await delay(300);
    
    let result = [...requests];
    
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
  async getById(id: string): Promise<MaintenanceRequest | null> {
    await delay(200);
    return requests.find(r => r.id === id) || null;
  },

  /**
   * Get request by ticket number
   */
  async getByTicketNumber(ticketNumber: string): Promise<MaintenanceRequest | null> {
    await delay(200);
    return requests.find(r => r.ticketNumber === ticketNumber) || null;
  },

  /**
   * Create a new maintenance request
   */
  async create(data: CreateMaintenanceRequestDto): Promise<MaintenanceRequest> {
    await delay(300);
    
    // Validate room if provided
    if (data.roomId) {
      const room = mockRooms.find(r => r.id === data.roomId);
      if (!room) {
        throw new Error('Room not found');
      }
    }
    
    // Generate ticket number
    const year = new Date().getFullYear();
    const existingTickets = requests
      .filter(r => r.ticketNumber.startsWith(`MNT-${year}-`))
      .map(r => {
        const num = parseInt(r.ticketNumber.split('-')[2], 10);
        return isNaN(num) ? 0 : num;
      });
    const nextNumber = existingTickets.length > 0 ? Math.max(...existingTickets) + 1 : 1;
    const ticketNumber = `MNT-${year}-${String(nextNumber).padStart(3, '0')}`;
    
    const newRequest: MaintenanceRequest = {
      id: generateSequentialId('MR', requests.map(r => r.id)),
      ticketNumber,
      roomId: data.roomId,
      room: data.roomId ? mockRooms.find(r => r.id === data.roomId) : undefined,
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
    return newRequest;
  },

  /**
   * Update a maintenance request
   */
  async update(id: string, data: UpdateMaintenanceRequestDto): Promise<MaintenanceRequest> {
    await delay(300);
    
    const index = requests.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Request not found');
    
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
  async delete(id: string): Promise<void> {
    await delay(300);
    
    const index = requests.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Request not found');
    
    if (requests[index].status === 'in_progress' || requests[index].status === 'completed') {
      throw new Error('Cannot delete request that is in progress or completed');
    }
    
    requests.splice(index, 1);
  },

  /**
   * Acknowledge a request
   */
  async acknowledge(id: string): Promise<MaintenanceRequest> {
    await delay(300);
    
    const index = requests.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Request not found');
    
    if (requests[index].status !== 'reported') {
      throw new Error('Only reported requests can be acknowledged');
    }
    
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
  async assign(id: string, employeeId: string): Promise<MaintenanceRequest> {
    await delay(300);
    
    const index = requests.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Request not found');
    
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
  async start(id: string): Promise<MaintenanceRequest> {
    await delay(300);
    
    const index = requests.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Request not found');
    
    if (requests[index].status === 'completed' || requests[index].status === 'cancelled') {
      throw new Error('Cannot start a completed or cancelled request');
    }
    
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
   */
  async complete(id: string, resolution: string, actualCost?: number): Promise<MaintenanceRequest> {
    await delay(300);
    
    const index = requests.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Request not found');
    
    if (requests[index].status === 'completed' || requests[index].status === 'cancelled') {
      throw new Error('Request is already completed or cancelled');
    }
    
    requests[index] = {
      ...requests[index],
      status: 'completed',
      completedAt: now(),
      resolution,
      actualCost: actualCost || requests[index].actualCost,
      updatedAt: now(),
    };
    
    return requests[index];
  },

  /**
   * Put request on hold
   */
  async putOnHold(id: string): Promise<MaintenanceRequest> {
    await delay(300);
    
    const index = requests.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Request not found');
    
    if (requests[index].status !== 'in_progress') {
      throw new Error('Only in-progress requests can be put on hold');
    }
    
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
  async cancel(id: string): Promise<MaintenanceRequest> {
    await delay(300);
    
    const index = requests.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Request not found');
    
    if (requests[index].status === 'completed') {
      throw new Error('Cannot cancel a completed request');
    }
    
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
  async getStats(): Promise<{
    total: number;
    reported: number;
    acknowledged: number;
    inProgress: number;
    onHold: number;
    completed: number;
    cancelled: number;
  }> {
    await delay(200);
    
    return {
      total: requests.length,
      reported: requests.filter(r => r.status === 'reported').length,
      acknowledged: requests.filter(r => r.status === 'acknowledged').length,
      inProgress: requests.filter(r => r.status === 'in_progress').length,
      onHold: requests.filter(r => r.status === 'on_hold').length,
      completed: requests.filter(r => r.status === 'completed').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length,
    };
  },
};

