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
export type { 
  RoomFilters, 
  CreateRoomDto, 
  UpdateRoomDto, 
  CreateRoomTypeDto, 
  UpdateRoomTypeDto,
  TransferRoomDto,
  CreateRoomBlockDto,
  CreateRoomInspectionDto,
  CreateRoomCleaningScheduleDto
} from './roomService';

// Housekeeping Service (RMS)
export { housekeepingService } from './housekeepingService';
export type { HousekeepingTaskFilters, CreateHousekeepingTaskDto, UpdateHousekeepingTaskDto } from './housekeepingService';

// Maintenance Service (RMS)
export { maintenanceService } from './maintenanceService';
export type { MaintenanceRequestFilters, CreateMaintenanceRequestDto, UpdateMaintenanceRequestDto } from './maintenanceService';

// Billing Service (BMS)
export { billingService } from './billingService';
export type { FolioFilters } from './billingService';

// Order & Menu Service (OMS)
export { orderService, menuService } from './orderService';
export type { OrderFilters, CreateOrderDto } from './orderService';

// Inventory Service (IMS)
export { inventoryService, categoryService, vendorService, calculateStockStatus } from './inventoryService';
export type { InventoryFilters } from './inventoryService';

// Task Service (TMS)
export { taskService } from './taskService';
export type { TaskFilters, CreateTaskDto } from './taskService';

// Employee & Attendance Service (AMS)
export { employeeService, shiftService, attendanceService, leaveService } from './employeeService';
export type { EmployeeFilters } from './employeeService';

// Supply Service (SMS)
export { purchaseOrderService, deliveryService } from './supplyService';
export type { PurchaseOrderFilters, CreatePurchaseOrderDto } from './supplyService';

// Accounting Service (AS)
export { accountService, transactionService, analyticsService } from './accountingService';
export type { AccountFilters, TransactionFilters, CreateAccountDto, CreateTransactionDto } from './accountingService';

// Workflow Service (Cross-module operations)
export { workflowService } from './workflowService';

// Tenant Service (Multi-tenant - Operator Panel)
export { tenantService, tenantUserService } from './tenantService';
export type { TenantFilters, TenantUserFilters } from './tenantService';

// Error Classes
export {
  AppError,
  NotFoundError,
  ValidationError,
  BusinessRuleError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  WorkflowError,
  isAppError,
  toAppError,
} from '../errors';
