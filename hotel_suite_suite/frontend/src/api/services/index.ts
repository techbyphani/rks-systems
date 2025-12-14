// ============================================================
// SERVICES INDEX - Central export for all API services
// ============================================================

// Guest Service (CRS)
export { guestService } from './guestService';
export type { GuestFilters, CreateGuestDto, UpdateGuestDto } from './guestService';

// Reservation Service (CRS)
export { reservationService } from './reservationService';
export type { ReservationFilters, CreateReservationDto, UpdateReservationDto } from './reservationService';

// Room Service (RMS)
export { roomService, roomTypeService } from './roomService';
export type { RoomFilters } from './roomService';

// Billing Service (BMS)
export { billingService } from './billingService';
export type { FolioFilters } from './billingService';

// Order & Menu Service (OMS)
export { orderService, menuService } from './orderService';
export type { OrderFilters, CreateOrderDto } from './orderService';

// Inventory Service (IMS)
export { inventoryService, categoryService, vendorService } from './inventoryService';
export type { InventoryFilters } from './inventoryService';

// Task Service (TMS)
export { taskService } from './taskService';
export type { TaskFilters, CreateTaskDto } from './taskService';

// Employee & Attendance Service (AMS)
export { employeeService, shiftService, attendanceService, leaveService } from './employeeService';
export type { EmployeeFilters } from './employeeService';

// Workflow Service (Cross-module operations)
export { workflowService } from './workflowService';

// Tenant Service (Multi-tenant - Operator Panel)
export { tenantService, tenantUserService } from './tenantService';
export type { TenantFilters, TenantUserFilters } from './tenantService';
