import type { Task, TaskStatus, TaskPriority, TaskCategory, Department, PaginatedResponse, Employee } from '@/types';
import { mockTasks } from '../mockData';
import { mockEmployees } from '../mockData/employees';
import { delay, generateId, now, paginate } from '../helpers';
import { requireTenantId, filterByTenant, findByIdAndTenant } from '../helpers/tenantFilter';

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
   * CRITICAL FIX: Added tenant isolation
   */
  async getAll(tenantId: string, filters: TaskFilters = {}): Promise<PaginatedResponse<Task>> {
    await delay(300);
    
    requireTenantId(tenantId);
    let result = filterByTenant(tasks, tenantId) as Task[];
    
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
  async getById(tenantId: string, id: string): Promise<Task | null> {
    await delay(200);
    requireTenantId(tenantId);
    return findByIdAndTenant(tasks, id, tenantId);
  },

  /**
   * Create a new task
   * CRITICAL FIX: Added tenant isolation
   */
  async create(tenantId: string, data: CreateTaskDto): Promise<Task> {
    await delay(400);
    
    requireTenantId(tenantId);
    // Verify employee belongs to tenant if assigned
    const employee = data.assignedTo ? (findByIdAndTenant(mockEmployees, data.assignedTo, tenantId) as Employee | null) || undefined : undefined;
    
    const newTask: Task & { tenantId: string } = {
      id: generateId(),
      tenantId, // CRITICAL: Tenant isolation
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
  async update(tenantId: string, id: string, data: Partial<CreateTaskDto>): Promise<Task> {
    await delay(400);
    requireTenantId(tenantId);
    
    const task = findByIdAndTenant(tasks, id, tenantId);
    if (!task) throw new Error('Task not found');
    
    const index = tasks.findIndex(t => t.id === id && t.tenantId === tenantId);
    
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
  async updateStatus(tenantId: string, id: string, status: TaskStatus): Promise<Task> {
    await delay(300);
    requireTenantId(tenantId);
    
    const task = findByIdAndTenant(tasks, id, tenantId);
    if (!task) throw new Error('Task not found');
    
    const index = tasks.findIndex(t => t.id === id && t.tenantId === tenantId);
    
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
  async assign(tenantId: string, id: string, employeeId: string): Promise<Task> {
    await delay(300);
    requireTenantId(tenantId);
    
    const task = findByIdAndTenant(tasks, id, tenantId);
    if (!task) throw new Error('Task not found');
    
    const index = tasks.findIndex(t => t.id === id && t.tenantId === tenantId);
    const employee = mockEmployees.find(e => e.id === employeeId && e.tenantId === tenantId);
    
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
   * CRITICAL FIX: Added tenant isolation
   */
  async getTodays(tenantId: string): Promise<Task[]> {
    await delay(200);
    requireTenantId(tenantId);
    const tenantTasks = filterByTenant(tasks, tenantId) as Task[];
    return tenantTasks.filter(t => t.dueDate === today && t.status !== 'completed');
  },

  /**
   * Get overdue tasks
   * CRITICAL FIX: Added tenant isolation
   */
  async getOverdue(tenantId: string): Promise<Task[]> {
    await delay(200);
    requireTenantId(tenantId);
    const tenantTasks = filterByTenant(tasks, tenantId) as Task[];
    return tenantTasks.filter(t => 
      t.dueDate < today && 
      !['completed', 'cancelled'].includes(t.status)
    );
  },

  /**
   * Get tasks by status
   * CRITICAL FIX: Added tenant isolation
   */
  async getByStatus(tenantId: string, status: TaskStatus): Promise<Task[]> {
    await delay(200);
    requireTenantId(tenantId);
    const tenantTasks = filterByTenant(tasks, tenantId) as Task[];
    return tenantTasks.filter(t => t.status === status);
  },

  /**
   * Get task statistics
   * CRITICAL FIX: Added tenant isolation
   */
  async getStats(tenantId: string): Promise<{
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
    
    requireTenantId(tenantId);
    const tenantTasks = filterByTenant(tasks, tenantId) as Task[];
    
    const overdueTasks = tenantTasks.filter(t => 
      t.dueDate < today && 
      !['completed', 'cancelled'].includes(t.status)
    );
    const todaysTasks = tenantTasks.filter(t => t.dueDate === today && t.status !== 'completed');
    const completedToday = tenantTasks.filter(t => 
      t.status === 'completed' && 
      t.completedAt?.startsWith(today)
    ).length;
    
    // Calculate on-track percentage (tasks not overdue / total active tasks)
    const activeTasks = tenantTasks.filter(t => !['completed', 'cancelled'].includes(t.status));
    const onTrack = activeTasks.length > 0 
      ? Math.round(((activeTasks.length - overdueTasks.length) / activeTasks.length) * 100)
      : 100;
    
    return {
      total: tenantTasks.length,
      pending: tenantTasks.filter(t => t.status === 'pending').length,
      inProgress: tenantTasks.filter(t => t.status === 'in_progress').length,
      completed: tenantTasks.filter(t => t.status === 'completed').length,
      overdue: overdueTasks.length,
      todaysDue: todaysTasks.length,
      urgent: tenantTasks.filter(t => t.priority === 'urgent' && !['completed', 'cancelled'].includes(t.status)).length,
      completedToday,
      onTrack,
    };
  },

  /**
   * Get current user's tasks (mock)
   */
  async getMyTasks(tenantId: string): Promise<Task[]> {
    await delay(200);
    requireTenantId(tenantId);
    // Return tasks assigned to current user (mock: EMP001) for this tenant
    const tenantTasks = filterByTenant(tasks, tenantId) as Task[];
    return tenantTasks.filter(t => t.assignedTo === 'EMP001');
  },

  /**
   * Delete task
   * CRITICAL FIX: Added tenant isolation
   */
  async delete(tenantId: string, id: string): Promise<void> {
    await delay(300);
    requireTenantId(tenantId);
    const task = findByIdAndTenant(tasks, id, tenantId) as Task | null;
    if (!task) throw new Error('Task not found');
    // CRITICAL: Include tenantId check in findIndex for extra safety
    const index = tasks.findIndex(t => t.id === id && t.tenantId === tenantId);
    if (index === -1) throw new Error('Task not found');
    tasks.splice(index, 1);
  },
};
