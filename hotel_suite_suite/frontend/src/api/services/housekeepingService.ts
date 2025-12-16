import type { HousekeepingTask, HousekeepingTaskStatus, HousekeepingTaskType, HousekeepingPriority, PaginatedResponse } from '@/types';
import { mockRooms } from '../mockData/rooms';
import { delay, now, paginate, generateSequentialId, today } from '../helpers';

// In-memory store
let tasks: HousekeepingTask[] = [];

// Initialize with some mock tasks
const initializeTasks = () => {
  if (tasks.length === 0) {
    const todayDate = today();
    const availableRooms = mockRooms.filter(r => r.status === 'dirty' || r.status === 'available');
    
    availableRooms.slice(0, 10).forEach((room, index) => {
      const taskTypes: HousekeepingTaskType[] = ['checkout_clean', 'stayover_clean', 'deep_clean'];
      const statuses: HousekeepingTaskStatus[] = ['pending', 'assigned', 'in_progress', 'completed'];
      
      tasks.push({
        id: `HK${String(index + 1).padStart(3, '0')}`,
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
  async getAll(filters: HousekeepingTaskFilters = {}): Promise<PaginatedResponse<HousekeepingTask>> {
    await delay(300);
    
    let result = [...tasks];
    
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
   */
  async getById(id: string): Promise<HousekeepingTask | null> {
    await delay(200);
    return tasks.find(t => t.id === id) || null;
  },

  /**
   * Create a new housekeeping task
   */
  async create(data: CreateHousekeepingTaskDto): Promise<HousekeepingTask> {
    await delay(300);
    
    const room = mockRooms.find(r => r.id === data.roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    const newTask: HousekeepingTask = {
      id: generateSequentialId('HK', tasks.map(t => t.id)),
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
  async update(id: string, data: UpdateHousekeepingTaskDto): Promise<HousekeepingTask> {
    await delay(300);
    
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Task not found');
    
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
   */
  async delete(id: string): Promise<void> {
    await delay(300);
    
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Task not found');
    
    if (tasks[index].status === 'in_progress' || tasks[index].status === 'completed') {
      throw new Error('Cannot delete task that is in progress or completed');
    }
    
    tasks.splice(index, 1);
  },

  /**
   * Assign task to employee
   */
  async assign(id: string, employeeId: string): Promise<HousekeepingTask> {
    await delay(300);
    
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Task not found');
    
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
   */
  async start(id: string): Promise<HousekeepingTask> {
    await delay(300);
    
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Task not found');
    
    if (tasks[index].status === 'completed' || tasks[index].status === 'verified') {
      throw new Error('Cannot start a completed task');
    }
    
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
  async complete(id: string, notes?: string): Promise<HousekeepingTask> {
    await delay(300);
    
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Task not found');
    
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
   */
  async verify(id: string, verifiedBy: string): Promise<HousekeepingTask> {
    await delay(300);
    
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
    
    return tasks[index];
  },

  /**
   * Get tasks for today
   */
  async getTodayTasks(): Promise<HousekeepingTask[]> {
    await delay(200);
    const todayDate = today();
    return tasks.filter(t => t.scheduledDate === todayDate);
  },

  /**
   * Get task statistics
   */
  async getStats(date?: string): Promise<{
    total: number;
    pending: number;
    assigned: number;
    inProgress: number;
    completed: number;
    verified: number;
  }> {
    await delay(200);
    
    let filteredTasks = tasks;
    if (date) {
      filteredTasks = tasks.filter(t => t.scheduledDate === date);
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

