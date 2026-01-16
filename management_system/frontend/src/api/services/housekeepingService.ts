import type { HousekeepingTask, HousekeepingTaskStatus, HousekeepingTaskType, HousekeepingPriority, PaginatedResponse, Room } from '@/types';
import { mockRooms } from '../mockData/rooms';
import { delay, now, paginate, generateSequentialId, today } from '../helpers';
import { requireTenantId, filterByTenant, findByIdAndTenant } from '../helpers/tenantFilter';

// In-memory store
let tasks: HousekeepingTask[] = [];

// Initialize with some mock tasks
const initializeTasks = () => {
  if (tasks.length === 0) {
    const todayDate = today();
    // CRITICAL: Only initialize tasks for tenant-001 rooms (mock data initialization)
    const tenantRooms = filterByTenant(mockRooms, 'tenant-001') as Room[];
    const availableRooms = tenantRooms.filter(r => r.status === 'dirty' || r.status === 'available');
    
    availableRooms.slice(0, 10).forEach((room, index) => {
      const taskTypes: HousekeepingTaskType[] = ['checkout_clean', 'stayover_clean', 'deep_clean'];
      const statuses: HousekeepingTaskStatus[] = ['pending', 'assigned', 'in_progress', 'completed'];
      
      tasks.push({
        id: `HK${String(index + 1).padStart(3, '0')}`,
        tenantId: 'tenant-001', // CRITICAL: Tenant isolation for mock data
        roomId: room.id,
        room,
        type: taskTypes[index % taskTypes.length],
        status: statuses[index % statuses.length],
        priority: index % 3 === 0 ? 'high' : index % 3 === 1 ? 'normal' : 'low',
        scheduledDate: todayDate,
        createdAt: now(),
        updatedAt: now(),
      });
    });
  }
};

initializeTasks();

export interface HousekeepingTaskFilters {
  roomId?: string;
  status?: HousekeepingTaskStatus | HousekeepingTaskStatus[];
  type?: HousekeepingTaskType;
  priority?: HousekeepingPriority;
  scheduledDate?: string;
  assignedTo?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateHousekeepingTaskDto {
  roomId: string;
  type: HousekeepingTaskType;
  priority: HousekeepingPriority;
  scheduledDate: string;
  scheduledTime?: string;
  assignedTo?: string;
  notes?: string;
}

export interface UpdateHousekeepingTaskDto {
  status?: HousekeepingTaskStatus;
  assignedTo?: string;
  priority?: HousekeepingPriority;
  scheduledDate?: string;
  scheduledTime?: string;
  notes?: string;
  issues?: string[];
  verifiedBy?: string;
}

export const housekeepingService = {
  /**
   * Get all housekeeping tasks
   */
  async getAll(tenantId: string, filters: HousekeepingTaskFilters = {}): Promise<PaginatedResponse<HousekeepingTask>> {
    await delay(300);
    
    requireTenantId(tenantId);
    // Filter by tenant through rooms
    const tenantRooms = filterByTenant(mockRooms, tenantId) as Room[];
    const tenantRoomIds = tenantRooms.map(r => r.id);
    let result = tasks.filter(t => tenantRoomIds.includes(t.roomId));
    
    // Status filter
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      result = result.filter(t => statuses.includes(t.status));
    }
    
    // Room filter
    if (filters.roomId) {
      result = result.filter(t => t.roomId === filters.roomId);
    }
    
    // Type filter
    if (filters.type) {
      result = result.filter(t => t.type === filters.type);
    }
    
    // Priority filter
    if (filters.priority) {
      result = result.filter(t => t.priority === filters.priority);
    }
    
    // Date filter
    if (filters.scheduledDate) {
      result = result.filter(t => t.scheduledDate === filters.scheduledDate);
    }
    
    // Assigned to filter
    if (filters.assignedTo) {
      result = result.filter(t => t.assignedTo === filters.assignedTo);
    }
    
    // Sort by priority and scheduled date
    result.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.scheduledDate.localeCompare(b.scheduledDate);
    });
    
    return paginate(result, filters.page || 1, filters.pageSize || 20);
  },

  /**
   * Get task by ID
   * CRITICAL FIX: Added tenant isolation
   */
  async getById(tenantId: string, id: string): Promise<HousekeepingTask | null> {
    await delay(200);
    requireTenantId(tenantId);
    // Verify task belongs to tenant through room
    const tenantRooms = filterByTenant(mockRooms, tenantId) as Room[];
    const tenantRoomIds = tenantRooms.map(r => r.id);
    const task = tasks.find(t => t.id === id && tenantRoomIds.includes(t.roomId));
    return task || null;
  },

  /**
   * Create a new housekeeping task
   * CRITICAL FIX: Added tenant isolation
   */
  async create(tenantId: string, data: CreateHousekeepingTaskDto): Promise<HousekeepingTask> {
    await delay(300);
    
    requireTenantId(tenantId);
    // Verify room belongs to tenant
    const room = findByIdAndTenant(mockRooms, data.roomId, tenantId) as Room | null;
    if (!room) {
      throw new Error('Room not found');
    }
    
    const newTask: HousekeepingTask & { tenantId: string } = {
      id: generateSequentialId('HK', tasks.map(t => t.id)),
      tenantId, // CRITICAL: Tenant isolation
      roomId: data.roomId,
      room,
      type: data.type,
      status: data.assignedTo ? 'assigned' : 'pending',
      priority: data.priority,
      assignedTo: data.assignedTo,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      notes: data.notes,
      createdAt: now(),
      updatedAt: now(),
    };
    
    tasks.push(newTask);
    return newTask;
  },

  /**
   * Update a housekeeping task
   */
  async update(tenantId: string, id: string, data: UpdateHousekeepingTaskDto): Promise<HousekeepingTask> {
    await delay(300);
    
    requireTenantId(tenantId);
    // Verify task belongs to tenant through room
    const tenantRooms = filterByTenant(mockRooms, tenantId) as Room[];
    const tenantRoomIds = tenantRooms.map(r => r.id);
    const task = tasks.find(t => t.id === id && tenantRoomIds.includes(t.roomId));
    if (!task) throw new Error('Task not found');
    
    const index = tasks.findIndex(t => t.id === id);
    
    const updates: Partial<HousekeepingTask> = {
      ...data,
      updatedAt: now(),
    };
    
    // Handle status transitions
    if (data.status === 'in_progress' && !tasks[index].startedAt) {
      updates.startedAt = now();
    }
    
    if (data.status === 'completed' && !tasks[index].completedAt) {
      updates.completedAt = now();
    }
    
    if (data.status === 'verified' && !tasks[index].verifiedAt) {
      updates.verifiedAt = now();
      updates.verifiedBy = data.verifiedBy;
    }
    
    // Update assigned employee if assignedTo changes
    if (data.assignedTo && data.assignedTo !== tasks[index].assignedTo) {
      updates.assignedTo = data.assignedTo;
      // In a real app, we'd fetch the employee here
      // For now, we'll just update the ID
    }
    
    tasks[index] = {
      ...tasks[index],
      ...updates,
    };
    
    return tasks[index];
  },

  /**
   * Delete a task
   * CRITICAL FIX: Added tenant isolation
   */
  async delete(tenantId: string, id: string): Promise<void> {
    await delay(300);
    
    requireTenantId(tenantId);
    // Verify task belongs to tenant through room
    const tenantRooms = filterByTenant(mockRooms, tenantId) as Room[];
    const tenantRoomIds = tenantRooms.map(r => r.id);
    const task = tasks.find(t => t.id === id && tenantRoomIds.includes(t.roomId));
    if (!task) throw new Error('Task not found');
    
    if (task.status === 'in_progress' || task.status === 'completed') {
      throw new Error('Cannot delete task that is in progress or completed');
    }
    
    const index = tasks.findIndex(t => t.id === id);
    tasks.splice(index, 1);
  },

  /**
   * Assign task to employee
   * CRITICAL FIX: Added tenant isolation
   */
  async assign(tenantId: string, id: string, employeeId: string): Promise<HousekeepingTask> {
    await delay(300);
    
    requireTenantId(tenantId);
    // Verify task belongs to tenant through room
    const tenantRooms = filterByTenant(mockRooms, tenantId) as Room[];
    const tenantRoomIds = tenantRooms.map(r => r.id);
    const task = tasks.find(t => t.id === id && tenantRoomIds.includes(t.roomId));
    if (!task) throw new Error('Task not found');
    
    const index = tasks.findIndex(t => t.id === id);
    tasks[index] = {
      ...tasks[index],
      assignedTo: employeeId,
      status: tasks[index].status === 'pending' ? 'assigned' : tasks[index].status,
      updatedAt: now(),
    };
    
    return tasks[index];
  },

  /**
   * Start a task
   * CRITICAL FIX: Added tenant isolation
   */
  async start(tenantId: string, id: string): Promise<HousekeepingTask> {
    await delay(300);
    
    requireTenantId(tenantId);
    // Verify task belongs to tenant through room
    const tenantRooms = filterByTenant(mockRooms, tenantId) as Room[];
    const tenantRoomIds = tenantRooms.map(r => r.id);
    const task = tasks.find(t => t.id === id && tenantRoomIds.includes(t.roomId));
    if (!task) throw new Error('Task not found');
    
    if (task.status === 'completed' || task.status === 'verified') {
      throw new Error('Cannot start a completed task');
    }
    
    const index = tasks.findIndex(t => t.id === id);
    tasks[index] = {
      ...tasks[index],
      status: 'in_progress',
      startedAt: now(),
      updatedAt: now(),
    };
    
    return tasks[index];
  },

  /**
   * Complete a task
   */
  async complete(tenantId: string, id: string, notes?: string): Promise<HousekeepingTask> {
    await delay(300);
    
    requireTenantId(tenantId);
    // Verify task belongs to tenant through room
    const tenantRooms = filterByTenant(mockRooms, tenantId) as Room[];
    const tenantRoomIds = tenantRooms.map(r => r.id);
    const task = tasks.find(t => t.id === id && tenantRoomIds.includes(t.roomId));
    if (!task) throw new Error('Task not found');
    
    const index = tasks.findIndex(t => t.id === id);
    
    if (tasks[index].status === 'verified') {
      throw new Error('Task is already verified');
    }
    
    tasks[index] = {
      ...tasks[index],
      status: 'completed',
      completedAt: now(),
      notes: notes || tasks[index].notes,
      updatedAt: now(),
    };
    
    return tasks[index];
  },

  /**
   * Verify a completed task
   * CRITICAL FIX: Added tenant isolation
   * FEATURE #11: Auto-update room status when housekeeping is verified
   */
  async verify(tenantId: string, id: string, verifiedBy: string): Promise<HousekeepingTask> {
    await delay(300);
    
    requireTenantId(tenantId);
    // Verify task belongs to tenant through room
    const tenantRooms = filterByTenant(mockRooms, tenantId) as Room[];
    const tenantRoomIds = tenantRooms.map(r => r.id);
    const task = tasks.find(t => t.id === id && tenantRoomIds.includes(t.roomId));
    if (!task) throw new Error('Task not found');
    
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Task not found');
    
    if (tasks[index].status !== 'completed') {
      throw new Error('Only completed tasks can be verified');
    }
    
    tasks[index] = {
      ...tasks[index],
      status: 'verified',
      verifiedBy,
      verifiedAt: now(),
      updatedAt: now(),
    };
    
    // HARDENING FIX #5: Auto-update room status when housekeeping is verified
    // HARDENING FIX #1: Uses central changeRoomStatus (via updateStatus)
    // HARDENING FIX: Removed error swallowing - now fails loudly
    // HARDENING FIX: Prevents skipping inspection - room must go through inspecting state
    if (task.roomId) {
      const { roomService } = await import('./roomService');
      const room = await roomService.getById(tenantId, task.roomId);
      if (room) {
        // HARDENING: Room must be in 'inspecting' state to become available
        // If room is dirty or cleaning, it must go through inspection first
        if (room.status === 'inspecting') {
          // Check if there are other pending housekeeping tasks for this room
          const otherPendingTasks = tasks.filter(
            t => t.roomId === task.roomId && 
                 t.id !== id && 
                 (t.status === 'pending' || t.status === 'assigned' || t.status === 'in_progress') &&
                 tenantRoomIds.includes(t.roomId)
          );
          
          // If no other pending tasks, room can be made available
          if (otherPendingTasks.length === 0) {
            // HARDENING: Version is required - use room's current version
            const version = room.version ?? 0;
            // HARDENING: Use updateStatus which enforces state machine
            await roomService.updateStatus(
              tenantId, 
              task.roomId, 
              'available', 
              verifiedBy,
              version,
              `Housekeeping verified: Task ${id}`
            );
          }
        } else if (room.status === 'dirty' || room.status === 'cleaning') {
          // HARDENING: Room cannot skip inspection - must go through inspecting state first
          // Log warning but don't fail verification
          const { logFailedOperation } = await import('../helpers/roomAudit');
          logFailedOperation(tenantId, task.roomId, 'housekeeping_verify', 
            `Room status is ${room.status}, must be 'inspecting' to become available. Room needs inspection first.`, verifiedBy);
          // Don't throw - verification can succeed, but room status won't change
        }
      }
    }
    
    return tasks[index];
  },

  /**
   * Get tasks for today
   */
  /**
   * Get today's tasks
   * CRITICAL FIX: Added tenant isolation
   */
  async getTodayTasks(tenantId: string): Promise<HousekeepingTask[]> {
    await delay(200);
    requireTenantId(tenantId);
    const tenantRooms = filterByTenant(mockRooms, tenantId) as Room[];
    const tenantRoomIds = tenantRooms.map(r => r.id);
    const todayDate = today();
    return tasks.filter(t => t.scheduledDate === todayDate && tenantRoomIds.includes(t.roomId));
  },

  /**
   * Get task statistics
   */
  async getStats(tenantId: string, date?: string): Promise<{
    total: number;
    pending: number;
    assigned: number;
    inProgress: number;
    completed: number;
    verified: number;
  }> {
    await delay(200);
    
    requireTenantId(tenantId);
    let filteredTasks = filterByTenant(tasks, tenantId) as HousekeepingTask[];
    if (date) {
      filteredTasks = filteredTasks.filter(t => t.scheduledDate === date);
    }
    
    return {
      total: filteredTasks.length,
      pending: filteredTasks.filter(t => t.status === 'pending').length,
      assigned: filteredTasks.filter(t => t.status === 'assigned').length,
      inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
      completed: filteredTasks.filter(t => t.status === 'completed').length,
      verified: filteredTasks.filter(t => t.status === 'verified').length,
    };
  },
};

