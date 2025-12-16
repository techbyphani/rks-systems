import type { Employee, Shift, AttendanceRecord, LeaveRequest, Department, PaginatedResponse } from '@/types';
import { mockEmployees, mockShifts } from '../mockData/employees';
import { delay, generateId, now, paginate, subtractDays } from '../helpers';

// In-memory stores
let employees = [...mockEmployees];
let shifts = [...mockShifts];
let attendanceRecords: AttendanceRecord[] = [];
let leaveRequests: LeaveRequest[] = [];

const today = new Date().toISOString().split('T')[0];

// Generate some attendance records for demo
employees.slice(0, 15).forEach(emp => {
  for (let i = 0; i < 7; i++) {
    const date = subtractDays(today, i);
    const isWeekend = [0, 6].includes(new Date(date).getDay());
    
    attendanceRecords.push({
      id: generateId(),
      employeeId: emp.id,
      employee: emp,
      date,
      shiftId: 'SH004',
      shift: shifts.find(s => s.id === 'SH004'),
      status: isWeekend ? 'weekend' : (Math.random() > 0.1 ? 'present' : 'absent'),
      clockIn: isWeekend ? undefined : `${date}T09:0${Math.floor(Math.random() * 10)}:00Z`,
      clockOut: isWeekend ? undefined : `${date}T18:0${Math.floor(Math.random() * 10)}:00Z`,
      totalHours: isWeekend ? undefined : 8 + Math.random(),
      createdAt: now(),
      updatedAt: now(),
    });
  }
});

// Generate some leave requests
leaveRequests = [
  {
    id: 'LR001',
    employeeId: 'EMP004',
    employee: employees.find(e => e.id === 'EMP004'),
    type: 'annual',
    startDate: subtractDays(today, -5),
    endDate: subtractDays(today, -7),
    days: 3,
    reason: 'Family vacation',
    status: 'pending',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'LR002',
    employeeId: 'EMP008',
    employee: employees.find(e => e.id === 'EMP008'),
    type: 'sick',
    startDate: today,
    endDate: today,
    days: 1,
    reason: 'Not feeling well',
    status: 'approved',
    approvedBy: 'EMP006',
    approvedAt: now(),
    createdAt: subtractDays(today, 1) + 'T10:00:00Z',
    updatedAt: now(),
  },
];

export interface EmployeeFilters {
  search?: string;
  department?: Department;
  status?: Employee['status'];
  page?: number;
  pageSize?: number;
}

export const employeeService = {
  /**
   * Get all employees
   */
  async getAll(filters: EmployeeFilters = {}): Promise<PaginatedResponse<Employee>> {
    await delay(300);
    
    let result = [...employees];
    
    if (filters.department) {
      result = result.filter(e => e.department === filters.department);
    }
    
    if (filters.status) {
      result = result.filter(e => e.status === filters.status);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(e =>
        e.firstName.toLowerCase().includes(searchLower) ||
        e.lastName.toLowerCase().includes(searchLower) ||
        e.employeeCode.toLowerCase().includes(searchLower) ||
        e.email.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by name
    result.sort((a, b) => a.firstName.localeCompare(b.firstName));
    
    return paginate(result, filters.page || 1, filters.pageSize || 10);
  },

  /**
   * Get employee by ID
   */
  async getById(id: string): Promise<Employee | null> {
    await delay(200);
    return employees.find(e => e.id === id) || null;
  },

  /**
   * Get employees by department
   */
  async getByDepartment(department: Department): Promise<Employee[]> {
    await delay(200);
    return employees.filter(e => e.department === department);
  },

  /**
   * Create a new employee
   */
  async create(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    await delay(400);
    
    // Generate employee code
    const deptPrefix = data.department.substring(0, 3).toUpperCase();
    const existingCodes = employees
      .filter(e => e.employeeCode.startsWith(deptPrefix))
      .map(e => {
        const num = parseInt(e.employeeCode.replace(deptPrefix, ''), 10);
        return isNaN(num) ? 0 : num;
      });
    const nextNumber = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1;
    const employeeCode = `${deptPrefix}${String(nextNumber).padStart(4, '0')}`;
    
    const newEmployee: Employee = {
      ...data,
      id: generateId(),
      employeeCode,
      createdAt: now(),
      updatedAt: now(),
    };
    
    employees.unshift(newEmployee);
    return newEmployee;
  },

  /**
   * Update an employee
   */
  async update(id: string, data: Partial<Employee>): Promise<Employee> {
    await delay(400);
    
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Employee not found');
    
    employees[index] = {
      ...employees[index],
      ...data,
      updatedAt: now(),
    };
    
    return employees[index];
  },

  /**
   * Delete an employee (soft delete by changing status)
   */
  async delete(id: string): Promise<void> {
    await delay(300);
    
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Employee not found');
    
    employees[index] = {
      ...employees[index],
      status: 'terminated',
      updatedAt: now(),
    };
  },

  /**
   * Get employee statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    onLeave: number;
    byDepartment: Record<Department, number>;
  }> {
    await delay(200);
    
    const byDepartment: Record<string, number> = {};
    employees.forEach(e => {
      byDepartment[e.department] = (byDepartment[e.department] || 0) + 1;
    });
    
    return {
      total: employees.length,
      active: employees.filter(e => e.status === 'active').length,
      onLeave: employees.filter(e => e.status === 'on_leave').length,
      byDepartment: byDepartment as Record<Department, number>,
    };
  },
};

// Shift Service
export const shiftService = {
  async getAll(): Promise<Shift[]> {
    await delay(200);
    return shifts.filter(s => s.isActive);
  },

  async getById(id: string): Promise<Shift | null> {
    await delay(200);
    return shifts.find(s => s.id === id) || null;
  },
};

// Attendance Service
export const attendanceService = {
  /**
   * Get attendance records
   */
  async getRecords(filters: { employeeId?: string; date?: string; startDate?: string; endDate?: string } = {}): Promise<AttendanceRecord[]> {
    await delay(300);
    
    let result = [...attendanceRecords];
    
    if (filters.employeeId) {
      result = result.filter(r => r.employeeId === filters.employeeId);
    }
    
    if (filters.date) {
      result = result.filter(r => r.date === filters.date);
    }
    
    if (filters.startDate) {
      result = result.filter(r => r.date >= filters.startDate!);
    }
    
    if (filters.endDate) {
      result = result.filter(r => r.date <= filters.endDate!);
    }
    
    result.sort((a, b) => b.date.localeCompare(a.date));
    
    return result;
  },

  /**
   * Clock in
   */
  async clockIn(employeeId: string): Promise<AttendanceRecord> {
    await delay(400);
    
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) throw new Error('Employee not found');
    
    const existingRecord = attendanceRecords.find(r => r.employeeId === employeeId && r.date === today);
    
    if (existingRecord) {
      const index = attendanceRecords.indexOf(existingRecord);
      attendanceRecords[index] = {
        ...existingRecord,
        clockIn: now(),
        status: 'present',
        updatedAt: now(),
      };
      return attendanceRecords[index];
    }
    
    const newRecord: AttendanceRecord = {
      id: generateId(),
      employeeId,
      employee,
      date: today,
      status: 'present',
      clockIn: now(),
      createdAt: now(),
      updatedAt: now(),
    };
    
    attendanceRecords.unshift(newRecord);
    return newRecord;
  },

  /**
   * Clock out
   */
  async clockOut(employeeId: string): Promise<AttendanceRecord> {
    await delay(400);
    
    const record = attendanceRecords.find(r => r.employeeId === employeeId && r.date === today);
    if (!record) throw new Error('No clock-in record found');
    
    const index = attendanceRecords.indexOf(record);
    const clockOutTime = now();
    const clockInTime = new Date(record.clockIn!).getTime();
    const totalHours = (new Date(clockOutTime).getTime() - clockInTime) / (1000 * 60 * 60);
    
    attendanceRecords[index] = {
      ...record,
      clockOut: clockOutTime,
      totalHours,
      updatedAt: now(),
    };
    
    return attendanceRecords[index];
  },

  /**
   * Get today's attendance summary
   */
  async getTodaySummary(): Promise<{
    present: number;
    absent: number;
    late: number;
    onLeave: number;
  }> {
    await delay(200);
    
    const todayRecords = attendanceRecords.filter(r => r.date === today);
    
    return {
      present: todayRecords.filter(r => r.status === 'present').length,
      absent: todayRecords.filter(r => r.status === 'absent').length,
      late: todayRecords.filter(r => r.status === 'late').length,
      onLeave: todayRecords.filter(r => r.status === 'on_leave').length,
    };
  },
};

// Leave Service
export const leaveService = {
  /**
   * Get leave requests
   */
  async getAll(filters: { employeeId?: string; status?: LeaveRequest['status'] } = {}): Promise<LeaveRequest[]> {
    await delay(200);
    
    let result = [...leaveRequests];
    
    if (filters.employeeId) {
      result = result.filter(lr => lr.employeeId === filters.employeeId);
    }
    
    if (filters.status) {
      result = result.filter(lr => lr.status === filters.status);
    }
    
    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    
    return result;
  },

  /**
   * Create leave request
   */
  async create(data: {
    employeeId: string;
    type: LeaveRequest['type'];
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<LeaveRequest> {
    await delay(400);
    
    const employee = employees.find(e => e.id === data.employeeId);
    if (!employee) throw new Error('Employee not found');
    
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const newRequest: LeaveRequest = {
      id: generateId(),
      employeeId: data.employeeId,
      employee,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      days,
      reason: data.reason,
      status: 'pending',
      createdAt: now(),
      updatedAt: now(),
    };
    
    leaveRequests.unshift(newRequest);
    return newRequest;
  },

  /**
   * Approve leave request
   */
  async approve(id: string): Promise<LeaveRequest> {
    await delay(400);
    
    const index = leaveRequests.findIndex(lr => lr.id === id);
    if (index === -1) throw new Error('Leave request not found');
    
    leaveRequests[index] = {
      ...leaveRequests[index],
      status: 'approved',
      approvedBy: 'EMP001',
      approvedAt: now(),
      updatedAt: now(),
    };
    
    return leaveRequests[index];
  },

  /**
   * Reject leave request
   */
  async reject(id: string, reason: string): Promise<LeaveRequest> {
    await delay(400);
    
    const index = leaveRequests.findIndex(lr => lr.id === id);
    if (index === -1) throw new Error('Leave request not found');
    
    leaveRequests[index] = {
      ...leaveRequests[index],
      status: 'rejected',
      rejectionReason: reason,
      updatedAt: now(),
    };
    
    return leaveRequests[index];
  },

  /**
   * Get pending requests count
   */
  async getPendingCount(): Promise<number> {
    await delay(100);
    return leaveRequests.filter(lr => lr.status === 'pending').length;
  },
};
