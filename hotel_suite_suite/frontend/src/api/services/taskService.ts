import type { Task, TaskStatus, TaskPriority, TaskCategory, Department, PaginatedResponse } from '@/types';
import { mockTasks } from '../mockData';
import { mockEmployees } from '../mockData/employees';
import { delay, generateId, now, paginate } from '../helpers';

// In-memory store
let tasks = [...mockTasks];

const today = new Date().toISOString().split('T')[0];

export interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority;
  category?: TaskCategory;
  assignedTo?: string;
  assignedDepartment?: Department;
  dueDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  assignedTo?: string;
  assignedDepartment?: Department;
  dueDate: string;
  dueTime?: string;
  estimatedMinutes?: number;
  roomId?: string;
  guestId?: string;
  reservationId?: string;
}

export const taskService = {
  /**
   * Get all tasks with filtering
   */
  async getAll(filters: TaskFilters = {}): Promise<PaginatedResponse<Task>> {
    await delay(300);
    
    let result = [...tasks];
    
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      result = result.filter(t => statuses.includes(t.status));
    }
    
    if (filters.priority) {
      result = result.filter(t => t.priority === filters.priority);
    }
    
    if (filters.category) {
      result = result.filter(t => t.category === filters.category);
    }
    
    if (filters.assignedTo) {
      result = result.filter(t => t.assignedTo === filters.assignedTo);
    }
    
    if (filters.assignedDepartment) {
      result = result.filter(t => t.assignedDepartment === filters.assignedDepartment);
    }
    
    if (filters.dueDate) {
      result = result.filter(t => t.dueDate === filters.dueDate);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(searchLower) ||
        t.taskNumber.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by due date and priority
    result.sort((a, b) => {
      if (a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    return paginate(result, filters.page || 1, filters.pageSize || 10);
  },

  /**
   * Get task by ID
   */
  async getById(id: string): Promise<Task | null> {
    await delay(200);
    return tasks.find(t => t.id === id) || null;
  },

  /**
   * Create a new task
   */
  async create(data: CreateTaskDto): Promise<Task> {
    await delay(400);
    
    const employee = data.assignedTo ? mockEmployees.find(e => e.id === data.assignedTo) : undefined;
    
    const newTask: Task = {
      id: generateId(),
      taskNumber: `TK-${new Date().getFullYear()}-${String(tasks.length + 1).padStart(4, '0')}`,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: data.assignedTo ? 'assigned' : 'pending',
      assignedTo: data.assignedTo,
      assignedEmployee: employee,
      assignedDepartment: data.assignedDepartment,
      dueDate: data.dueDate,
      dueTime: data.dueTime,
      estimatedMinutes: data.estimatedMinutes,
      roomId: data.roomId,
      guestId: data.guestId,
      reservationId: data.reservationId,
      createdAt: now(),
      updatedAt: now(),
    };
    
    tasks.unshift(newTask);
    return newTask;
  },

  /**
   * Update task
   */
  async update(id: string, data: Partial<CreateTaskDto>): Promise<Task> {
    await delay(400);
    
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Task not found');
    
    tasks[index] = {
      ...tasks[index],
      ...data,
      updatedAt: now(),
    };
    
    return tasks[index];
  },

  /**
   * Update task status
   */
  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    await delay(300);
    
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Task not found');
    
    const updates: Partial<Task> = {
      status,
      updatedAt: now(),
    };
    
    if (status === 'in_progress') updates.startedAt = now();
    if (status === 'completed') {
      updates.completedAt = now();
      updates.completedBy = 'EMP003';
    }
    
    tasks[index] = { ...tasks[index], ...updates };
    return tasks[index];
  },

  /**
   * Assign task to employee
   */
  async assign(id: string, employeeId: string): Promise<Task> {
    await delay(300);
    
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Task not found');
    
    const employee = mockEmployees.find(e => e.id === employeeId);
    
    tasks[index] = {
      ...tasks[index],
      assignedTo: employeeId,
      assignedEmployee: employee,
      status: 'assigned',
      updatedAt: now(),
    };
    
    return tasks[index];
  },

  /**
   * Get today's tasks
   */
  async getTodays(): Promise<Task[]> {
    await delay(200);
    return tasks.filter(t => t.dueDate === today && t.status !== 'completed');
  },

  /**
   * Get overdue tasks
   */
  async getOverdue(): Promise<Task[]> {
    await delay(200);
    return tasks.filter(t => 
      t.dueDate < today && 
      !['completed', 'cancelled'].includes(t.status)
    );
  },

  /**
   * Get tasks by status
   */
  async getByStatus(status: TaskStatus): Promise<Task[]> {
    await delay(200);
    return tasks.filter(t => t.status === status);
  },

  /**
   * Get task statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    todaysDue: number;
    urgent: number;
    completedToday: number;
    onTrack: number;
  }> {
    await delay(200);
    
    const overdueTasks = tasks.filter(t => 
      t.dueDate < today && 
      !['completed', 'cancelled'].includes(t.status)
    );
    const todaysTasks = tasks.filter(t => t.dueDate === today && t.status !== 'completed');
    const completedToday = tasks.filter(t => 
      t.status === 'completed' && 
      t.completedAt?.startsWith(today)
    ).length;
    
    // Calculate on-track percentage (tasks not overdue / total active tasks)
    const activeTasks = tasks.filter(t => !['completed', 'cancelled'].includes(t.status));
    const onTrack = activeTasks.length > 0 
      ? Math.round(((activeTasks.length - overdueTasks.length) / activeTasks.length) * 100)
      : 100;
    
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: overdueTasks.length,
      todaysDue: todaysTasks.length,
      urgent: tasks.filter(t => t.priority === 'urgent' && !['completed', 'cancelled'].includes(t.status)).length,
      completedToday,
      onTrack,
    };
  },

  /**
   * Get current user's tasks (mock)
   */
  async getMyTasks(): Promise<Task[]> {
    await delay(200);
    // Return tasks assigned to current user (mock: EMP001)
    return tasks.filter(t => t.assignedTo === 'EMP001');
  },

  /**
   * Delete task
   */
  async delete(id: string): Promise<void> {
    await delay(300);
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Task not found');
    tasks.splice(index, 1);
  },
};
