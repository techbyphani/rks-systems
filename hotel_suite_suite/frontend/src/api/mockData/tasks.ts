import type { Task, TaskStatus, TaskPriority, TaskCategory } from '@/types';
import { mockEmployees } from './employees';
import { mockRooms } from './rooms';
import { subtractDays, addDays } from '../helpers';

const today = new Date().toISOString().split('T')[0];
const now = new Date().toISOString();

const statusDistribution: TaskStatus[] = [
  'pending', 'pending',
  'assigned', 'assigned',
  'in_progress', 'in_progress', 'in_progress',
  'completed', 'completed', 'completed', 'completed',
];

const priorityDistribution: TaskPriority[] = [
  'low',
  'normal', 'normal', 'normal', 'normal',
  'high', 'high',
  'urgent',
];

export const mockTasks: Task[] = [
  // Today's housekeeping tasks
  {
    id: 'TK0001',
    taskNumber: 'TK-2024-0001',
    title: 'Turn down service - Room 301',
    description: 'Evening turndown service for VIP guest',
    category: 'housekeeping',
    priority: 'high',
    status: 'pending',
    assignedTo: 'EMP008',
    assignedEmployee: mockEmployees.find(e => e.id === 'EMP008'),
    assignedDepartment: 'housekeeping',
    dueDate: today,
    dueTime: '18:00',
    estimatedMinutes: 15,
    roomId: 'RM301',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'TK0002',
    taskNumber: 'TK-2024-0002',
    title: 'Deep clean - Room 205',
    description: 'Deep cleaning after long-stay guest checkout',
    category: 'housekeeping',
    priority: 'normal',
    status: 'in_progress',
    assignedTo: 'EMP016',
    assignedDepartment: 'housekeeping',
    dueDate: today,
    dueTime: '14:00',
    estimatedMinutes: 90,
    roomId: 'RM205',
    startedAt: `${today}T10:30:00Z`,
    createdAt: `${today}T08:00:00Z`,
    updatedAt: now,
  },
  {
    id: 'TK0003',
    taskNumber: 'TK-2024-0003',
    title: 'Stayover cleaning - Room 412',
    category: 'housekeeping',
    priority: 'normal',
    status: 'completed',
    assignedTo: 'EMP017',
    assignedDepartment: 'housekeeping',
    dueDate: today,
    estimatedMinutes: 30,
    actualMinutes: 28,
    roomId: 'RM412',
    startedAt: `${today}T09:00:00Z`,
    completedAt: `${today}T09:28:00Z`,
    completedBy: 'EMP017',
    createdAt: `${today}T07:00:00Z`,
    updatedAt: `${today}T09:28:00Z`,
  },
  
  // Maintenance tasks
  {
    id: 'TK0004',
    taskNumber: 'TK-2024-0004',
    title: 'Fix AC in Room 502',
    description: 'Guest reported AC not cooling properly',
    category: 'maintenance',
    priority: 'urgent',
    status: 'in_progress',
    assignedTo: 'EMP012',
    assignedEmployee: mockEmployees.find(e => e.id === 'EMP012'),
    assignedDepartment: 'engineering',
    dueDate: today,
    dueTime: '12:00',
    estimatedMinutes: 60,
    roomId: 'RM502',
    startedAt: `${today}T10:00:00Z`,
    createdAt: `${today}T09:30:00Z`,
    updatedAt: now,
  },
  {
    id: 'TK0005',
    taskNumber: 'TK-2024-0005',
    title: 'Replace bathroom faucet - Room 108',
    description: 'Faucet is leaking',
    category: 'maintenance',
    priority: 'high',
    status: 'assigned',
    assignedTo: 'EMP012',
    assignedDepartment: 'engineering',
    dueDate: today,
    estimatedMinutes: 45,
    roomId: 'RM108',
    createdAt: subtractDays(today, 1) + 'T14:00:00Z',
    updatedAt: now,
  },
  
  // Guest requests
  {
    id: 'TK0006',
    taskNumber: 'TK-2024-0006',
    title: 'Extra pillows - Room 605',
    description: 'Guest requested 2 extra pillows',
    category: 'guest_request',
    priority: 'normal',
    status: 'pending',
    assignedDepartment: 'housekeeping',
    dueDate: today,
    dueTime: '15:00',
    estimatedMinutes: 10,
    roomId: 'RM605',
    guestId: 'G003',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'TK0007',
    taskNumber: 'TK-2024-0007',
    title: 'Iron and ironing board - Room 310',
    category: 'guest_request',
    priority: 'normal',
    status: 'completed',
    assignedTo: 'EMP008',
    assignedDepartment: 'housekeeping',
    dueDate: today,
    estimatedMinutes: 5,
    actualMinutes: 4,
    roomId: 'RM310',
    completedAt: `${today}T11:15:00Z`,
    completedBy: 'EMP008',
    createdAt: `${today}T11:00:00Z`,
    updatedAt: `${today}T11:15:00Z`,
  },
  
  // Event tasks
  {
    id: 'TK0008',
    taskNumber: 'TK-2024-0008',
    title: 'Setup conference room - Sapphire Hall',
    description: 'Corporate meeting for 50 people, theater style seating',
    category: 'event',
    priority: 'high',
    status: 'assigned',
    assignedDepartment: 'food_beverage',
    dueDate: addDays(today, 1),
    dueTime: '08:00',
    estimatedMinutes: 120,
    createdAt: subtractDays(today, 2) + 'T10:00:00Z',
    updatedAt: now,
  },
  {
    id: 'TK0009',
    taskNumber: 'TK-2024-0009',
    title: 'Wedding banquet setup - Grand Ballroom',
    description: 'Wedding reception for 200 guests',
    category: 'event',
    priority: 'urgent',
    status: 'in_progress',
    assignedDepartment: 'food_beverage',
    dueDate: today,
    dueTime: '16:00',
    estimatedMinutes: 240,
    startedAt: `${today}T08:00:00Z`,
    createdAt: subtractDays(today, 7) + 'T10:00:00Z',
    updatedAt: now,
  },
  
  // Internal tasks
  {
    id: 'TK0010',
    taskNumber: 'TK-2024-0010',
    title: 'Inventory count - Housekeeping supplies',
    description: 'Monthly inventory verification',
    category: 'internal',
    priority: 'low',
    status: 'pending',
    assignedTo: 'EMP007',
    assignedDepartment: 'housekeeping',
    dueDate: addDays(today, 3),
    estimatedMinutes: 180,
    createdAt: now,
    updatedAt: now,
  },
  
  // Inspection tasks
  {
    id: 'TK0011',
    taskNumber: 'TK-2024-0011',
    title: 'Room inspection - 8th floor',
    description: 'Quality check for all rooms on 8th floor',
    category: 'inspection',
    priority: 'normal',
    status: 'pending',
    assignedTo: 'EMP006',
    assignedEmployee: mockEmployees.find(e => e.id === 'EMP006'),
    assignedDepartment: 'housekeeping',
    dueDate: today,
    dueTime: '16:00',
    estimatedMinutes: 60,
    createdAt: `${today}T07:00:00Z`,
    updatedAt: now,
  },
];

// Generate more historical tasks
for (let i = 12; i <= 50; i++) {
  const daysAgo = Math.floor(Math.random() * 14);
  const taskDate = subtractDays(today, daysAgo);
  const category: TaskCategory = ['housekeeping', 'maintenance', 'guest_request', 'internal'][Math.floor(Math.random() * 4)] as TaskCategory;
  const priority = priorityDistribution[Math.floor(Math.random() * priorityDistribution.length)];
  const status: TaskStatus = daysAgo > 0 ? 'completed' : statusDistribution[Math.floor(Math.random() * statusDistribution.length)];
  const room = mockRooms[Math.floor(Math.random() * mockRooms.length)];
  
  mockTasks.push({
    id: `TK${String(i).padStart(4, '0')}`,
    taskNumber: `TK-2024-${String(i).padStart(4, '0')}`,
    title: category === 'housekeeping' ? `Room cleaning - ${room.roomNumber}` :
           category === 'maintenance' ? `Maintenance check - ${room.roomNumber}` :
           category === 'guest_request' ? `Guest request - ${room.roomNumber}` :
           'Internal task',
    category,
    priority,
    status,
    assignedDepartment: category === 'housekeeping' ? 'housekeeping' : category === 'maintenance' ? 'engineering' : 'front_office',
    dueDate: taskDate,
    estimatedMinutes: Math.floor(Math.random() * 60) + 15,
    actualMinutes: status === 'completed' ? Math.floor(Math.random() * 60) + 15 : undefined,
    roomId: room.id,
    completedAt: status === 'completed' ? `${taskDate}T${10 + Math.floor(Math.random() * 8)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z` : undefined,
    createdAt: `${taskDate}T08:00:00Z`,
    updatedAt: status === 'completed' ? `${taskDate}T18:00:00Z` : now,
  });
}

// Helper functions
export const getTasksByStatus = (status: TaskStatus) => mockTasks.filter(t => t.status === status);
export const getTodaysTasks = () => mockTasks.filter(t => t.dueDate === today);
export const getOverdueTasks = () => mockTasks.filter(t => t.dueDate < today && !['completed', 'cancelled'].includes(t.status));
