# Complete API List - Hotel Suite System

This document contains a comprehensive list of all APIs/services available in the Hotel Suite System, organized by service module.

---

## 1. Reservation Service (`reservationService`)

### Core Operations
- `getAll(filters: ReservationFilters)` - Get all reservations with filtering and pagination
- `getById(tenantId: string, id: string)` - Get a single reservation by ID
- `getByConfirmation(tenantId: string, confirmationNumber: string)` - Get reservation by confirmation number
- `create(tenantId: string, data: CreateReservationDto)` - Create a new reservation
- `update(tenantId: string, id: string, data: UpdateReservationDto, expectedVersion?: number)` - Update a reservation
- `checkIn(tenantId: string, id: string, data: { roomId: string; notes?: string })` - Check in a guest
- `checkOut(tenantId: string, id: string)` - Check out a guest
- `cancel(tenantId: string, id: string, reason?: string)` - Cancel a reservation

### Queries & Reports
- `getTodaysArrivals(tenantId: string)` - Get today's arrivals
- `getTodaysDepartures(tenantId: string)` - Get today's departures
- `getInHouse(tenantId: string)` - Get in-house guests
- `getByGuestId(tenantId: string, guestId: string)` - Get reservations by guest ID
- `getByDateRange(tenantId: string, startDate: string, endDate: string, roomTypeId?: string)` - Get reservations by date range
- `getStats(tenantId: string)` - Get reservation statistics
- `getChannelStats(tenantId: string)` - Get channel statistics

---

## 2. Room Service (`roomService`)

### Core Operations
- `getAll(filters: RoomFilters)` - Get all rooms with filtering and pagination
- `getById(tenantId: string, id: string)` - Get a single room by ID
- `getByNumber(tenantId: string, roomNumber: string)` - Get room by room number
- `create(tenantId: string, data: CreateRoomDto)` - Create a new room
- `update(tenantId: string, id: string, data: UpdateRoomDto, expectedVersion?: number)` - Update a room
- `delete(tenantId: string, id: string)` - Delete a room

### Status & Assignment
- `updateStatus(tenantId: string, id: string, status: RoomStatus)` - Update room status
- `assignToGuest(tenantId: string, id: string, guestId: string, reservationId: string)` - Assign room to guest
- `release(tenantId: string, id: string)` - Release room (after checkout)
- `bulkUpdateStatus(tenantId: string, roomIds: string[], status: RoomStatus)` - Bulk update room status
- `updateNotes(tenantId: string, id: string, notes: string)` - Update room notes

### Queries & Reports
- `getAvailableRooms(tenantId: string, roomTypeId: string)` - Get available rooms for a room type
- `getAvailableByType(tenantId: string, roomTypeId: string)` - Get available rooms by type (alias)
- `getStatusCounts(tenantId: string)` - Get room status counts
- `getFloors(tenantId: string)` - Get all floors
- `getRoomTypes(tenantId: string)` - Get all room types
- `checkAvailability(tenantId: string, roomTypeId: string, checkInDate: string, checkOutDate: string, excludeReservationId?: string)` - Check room availability for date range
- `getStats(tenantId: string)` - Get room statistics

---

## 3. Room Type Service (`roomTypeService`)

### Core Operations
- `getAll(tenantId: string)` - Get all room types
- `getById(tenantId: string, id: string)` - Get room type by ID
- `create(tenantId: string, data: CreateRoomTypeDto)` - Create a new room type
- `update(tenantId: string, id: string, data: UpdateRoomTypeDto)` - Update a room type
- `delete(tenantId: string, id: string)` - Delete a room type (soft delete)

### Queries
- `getRoomCountByType(tenantId: string)` - Get room count by type

---

## 4. Billing Service (`billingService`)

### Folio Operations
- `getAllFolios(filters: FolioFilters)` - Get all folios with filtering and pagination
- `getFolioById(tenantId: string, id: string)` - Get folio by ID
- `getFolioByReservation(tenantId: string, reservationId: string)` - Get folio by reservation ID
- `createFolio(tenantId: string, reservationId: string, guestId: string, roomId?: string)` - Create a new folio
- `closeFolio(tenantId: string, id: string)` - Close a folio

### Charge Operations
- `postCharge(tenantId: string, folioId: string, charge: {...})` - Post a charge to a folio
- `voidCharge(tenantId: string, folioId: string, chargeId: string, reason: string)` - Void a charge

### Payment Operations
- `processPayment(tenantId: string, folioId: string, payment: {...})` - Process a payment
- `getAllPayments(filters: {...})` - Get all payments with filtering and pagination

### Invoice Operations
- `getAllInvoices(tenantId: string, filters: {...})` - Get all invoices with filtering and pagination
- `getInvoiceById(tenantId: string, id: string)` - Get invoice by ID
- `createInvoiceFromFolio(tenantId: string, folioId: string, data: {...})` - Create invoice from folio
- `updateInvoiceStatus(tenantId: string, id: string, status: Invoice['status'])` - Update invoice status
- `recordInvoicePayment(tenantId: string, invoiceId: string, amount: number)` - Record payment against invoice
- `getInvoiceStats(tenantId: string)` - Get invoice statistics

### Metrics & Reports
- `getMetrics(tenantId: string)` - Get billing dashboard metrics
- `getPaymentBreakdown(tenantId: string)` - Get payment method breakdown
- `getRevenueByDateRange(tenantId: string, startDate: string, endDate: string)` - Get revenue by date range

---

## 5. Guest Service (`guestService`)

### Core Operations
- `getAll(tenantId: string, filters: GuestFilters)` - Get all guests with filtering and pagination
- `getById(tenantId: string, id: string)` - Get a single guest by ID
- `create(tenantId: string, data: CreateGuestDto)` - Create a new guest
- `update(tenantId: string, id: string, data: UpdateGuestDto)` - Update an existing guest
- `delete(tenantId: string, id: string)` - Delete a guest

### Queries & Reports
- `search(tenantId: string, query: string)` - Search guests by name, email, or phone
- `getVipGuests(tenantId: string)` - Get VIP guests
- `getStats(tenantId: string)` - Get guest statistics

---

## 6. Order Service (`orderService`)

### Core Operations
- `getAll(tenantId: string, filters: OrderFilters)` - Get all orders with filtering and pagination
- `getById(tenantId: string, id: string)` - Get order by ID
- `create(tenantId: string, data: CreateOrderDto)` - Create a new order
- `updateStatus(tenantId: string, id: string, status: OrderStatus)` - Update order status
- `cancel(tenantId: string, id: string)` - Cancel an order

### Queries & Reports
- `getPending(tenantId: string)` - Get pending orders (kitchen display)
- `getTodays(tenantId: string)` - Get today's orders
- `getStats(tenantId: string)` - Get order statistics

---

## 7. Menu Service (`menuService`)

### Core Operations
- `getAll(tenantId: string, filters: {...})` - Get all menu items
- `getById(tenantId: string, id: string)` - Get menu item by ID
- `create(tenantId: string, data: Partial<MenuItem>)` - Create menu item
- `update(tenantId: string, id: string, data: Partial<MenuItem>)` - Update menu item
- `toggleAvailability(tenantId: string, id: string)` - Toggle item availability

### Queries
- `getAllMenus(tenantId: string)` - Get all menus

---

## 8. Task Service (`taskService`)

### Core Operations
- `getAll(tenantId: string, filters: TaskFilters)` - Get all tasks with filtering and pagination
- `getById(tenantId: string, id: string)` - Get task by ID
- `create(tenantId: string, data: CreateTaskDto)` - Create a new task
- `update(tenantId: string, id: string, data: Partial<CreateTaskDto>)` - Update task
- `updateStatus(tenantId: string, id: string, status: TaskStatus)` - Update task status
- `assign(tenantId: string, id: string, employeeId: string)` - Assign task to employee
- `delete(tenantId: string, id: string)` - Delete task

### Queries & Reports
- `getTodays(tenantId: string)` - Get today's tasks
- `getOverdue(tenantId: string)` - Get overdue tasks
- `getByStatus(tenantId: string, status: TaskStatus)` - Get tasks by status
- `getMyTasks(tenantId: string)` - Get current user's tasks
- `getStats(tenantId: string)` - Get task statistics

---

## 9. Housekeeping Service (`housekeepingService`)

### Core Operations
- `getAll(tenantId: string, filters: HousekeepingTaskFilters)` - Get all housekeeping tasks
- `getById(tenantId: string, id: string)` - Get task by ID
- `create(tenantId: string, data: CreateHousekeepingTaskDto)` - Create a new housekeeping task
- `update(tenantId: string, id: string, data: UpdateHousekeepingTaskDto)` - Update a housekeeping task
- `delete(tenantId: string, id: string)` - Delete a task
- `assign(tenantId: string, id: string, employeeId: string)` - Assign task to employee
- `start(tenantId: string, id: string)` - Start a task
- `complete(tenantId: string, id: string, notes?: string)` - Complete a task
- `verify(tenantId: string, id: string, verifiedBy: string)` - Verify a completed task

### Queries & Reports
- `getTodayTasks(tenantId: string)` - Get today's tasks
- `getStats(tenantId: string, date?: string)` - Get task statistics

---

## 10. Maintenance Service (`maintenanceService`)

### Core Operations
- `getAll(tenantId: string, filters: MaintenanceRequestFilters)` - Get all maintenance requests
- `getById(tenantId: string, id: string)` - Get request by ID
- `getByTicketNumber(tenantId: string, ticketNumber: string)` - Get request by ticket number
- `create(tenantId: string, data: CreateMaintenanceRequestDto)` - Create a new maintenance request
- `update(tenantId: string, id: string, data: UpdateMaintenanceRequestDto)` - Update a maintenance request
- `delete(tenantId: string, id: string)` - Delete a request
- `acknowledge(tenantId: string, id: string)` - Acknowledge a request
- `assign(tenantId: string, id: string, employeeId: string)` - Assign request to employee
- `start(tenantId: string, id: string)` - Start work on a request
- `complete(tenantId: string, id: string, resolution: string, actualCost?: number)` - Complete a request
- `putOnHold(tenantId: string, id: string)` - Put request on hold
- `cancel(tenantId: string, id: string)` - Cancel a request

### Queries & Reports
- `getStats(tenantId: string)` - Get request statistics

---

## 11. Inventory Service (`inventoryService`)

### Core Operations
- `getAll(tenantId: string, filters: InventoryFilters)` - Get all inventory items
- `getById(tenantId: string, id: string)` - Get item by ID
- `create(tenantId: string, data: {...})` - Create a new inventory item
- `update(tenantId: string, id: string, data: Partial<InventoryItem>)` - Update an inventory item
- `delete(tenantId: string, id: string)` - Delete an inventory item (soft delete)
- `updateStock(tenantId: string, id: string, quantity: number, type: StockMovement['type'], notes?: string)` - Update stock (add or remove)

### Queries & Reports
- `getLowStock(tenantId: string)` - Get low stock items
- `getAllStockMovements(tenantId: string, filters: {...})` - Get all stock movements
- `getStockMovements(tenantId: string, itemId: string)` - Get stock movements for an item
- `getStats(tenantId: string)` - Get inventory statistics

---

## 12. Category Service (`categoryService`)

### Core Operations
- `getAll(tenantId: string)` - Get all inventory categories
- `getById(tenantId: string, id: string)` - Get category by ID
- `create(tenantId: string, data: {...})` - Create a new category
- `update(tenantId: string, id: string, data: Partial<InventoryCategory>)` - Update a category
- `delete(tenantId: string, id: string)` - Delete a category (soft delete)

---

## 13. Vendor Service (`vendorService`)

### Core Operations
- `getAll(tenantId: string, filters: {...})` - Get all vendors
- `getById(tenantId: string, id: string)` - Get vendor by ID
- `create(tenantId: string, data: {...})` - Create a new vendor
- `update(tenantId: string, id: string, data: Partial<Vendor>)` - Update a vendor
- `delete(tenantId: string, id: string)` - Delete a vendor (soft delete)

---

## 14. Purchase Order Service (`purchaseOrderService`)

### Core Operations
- `getAll(tenantId: string, filters: PurchaseOrderFilters)` - Get all purchase orders
- `getById(tenantId: string, id: string)` - Get purchase order by ID
- `create(tenantId: string, data: CreatePurchaseOrderDto)` - Create a new purchase order
- `update(tenantId: string, id: string, data: Partial<CreatePurchaseOrderDto>)` - Update purchase order
- `updateStatus(tenantId: string, id: string, status: PurchaseOrderStatus)` - Update purchase order status
- `delete(tenantId: string, id: string)` - Delete purchase order

### Queries & Reports
- `getStats(tenantId: string)` - Get purchase order statistics

---

## 15. Delivery Service (`deliveryService`)

### Core Operations
- `getAll(tenantId: string, filters: {...})` - Get all deliveries
- `getById(tenantId: string, id: string)` - Get delivery by ID

---

## 16. Account Service (`accountService`)

### Core Operations
- `getAll(tenantId: string, filters: AccountFilters)` - Get all accounts
- `getById(tenantId: string, id: string)` - Get account by ID
- `create(tenantId: string, data: CreateAccountDto)` - Create a new account
- `update(tenantId: string, id: string, data: Partial<CreateAccountDto>)` - Update account

### Queries & Reports
- `getStats(tenantId: string)` - Get account statistics

---

## 17. Transaction Service (`transactionService`)

### Core Operations
- `getAll(tenantId: string, filters: TransactionFilters)` - Get all transactions
- `getById(tenantId: string, id: string)` - Get transaction by ID
- `create(tenantId: string, data: CreateTransactionDto)` - Create a new transaction

### Queries & Reports
- `getStats(tenantId: string, filters: {...})` - Get transaction statistics

---

## 18. Analytics Service (`analyticsService`)

### Reports
- `getFinancialSummary(tenantId: string)` - Get financial summary for dashboard
- `getProfitLossReport(tenantId: string, startDate: string, endDate: string)` - Get profit & loss report
- `getOccupancyReport(tenantId: string)` - Get occupancy report

---

## 19. Employee Service (`employeeService`)

### Core Operations
- `getAll(tenantId: string, filters: EmployeeFilters)` - Get all employees
- `getById(tenantId: string, id: string)` - Get employee by ID
- `getByDepartment(tenantId: string, department: Department)` - Get employees by department
- `create(tenantId: string, data: {...})` - Create a new employee
- `update(tenantId: string, id: string, data: Partial<Employee>)` - Update an employee
- `delete(tenantId: string, id: string)` - Delete an employee (soft delete)

### Queries & Reports
- `getStats(tenantId: string)` - Get employee statistics

---

## 20. Shift Service (`shiftService`)

### Core Operations
- `getAll(tenantId: string)` - Get all shifts
- `getById(tenantId: string, id: string)` - Get shift by ID

---

## 21. Attendance Service (`attendanceService`)

### Core Operations
- `getRecords(tenantId: string, filters: {...})` - Get attendance records
- `clockIn(tenantId: string, employeeId: string)` - Clock in
- `clockOut(tenantId: string, employeeId: string)` - Clock out

### Queries & Reports
- `getTodaySummary(tenantId: string)` - Get today's attendance summary

---

## 22. Leave Service (`leaveService`)

### Core Operations
- `getAll(tenantId: string, filters: {...})` - Get leave requests
- `create(tenantId: string, data: {...})` - Create leave request
- `approve(tenantId: string, id: string)` - Approve leave request
- `reject(tenantId: string, id: string, reason: string)` - Reject leave request

### Queries
- `getPendingCount(tenantId: string)` - Get pending requests count

---

## 23. Workflow Service (`workflowService`)

### Workflow Operations
- `performCheckIn(tenantId: string, reservationId: string, roomId: string, notes?: string, idempotencyKey?: string)` - Complete check-in workflow
- `performCheckOut(tenantId: string, reservationId: string, idempotencyKey?: string)` - Complete check-out workflow
- `quickBooking(tenantId: string, data: QuickBookingData)` - Quick booking workflow
- `walkInCheckIn(tenantId: string, data: {...})` - Walk-in check-in workflow
- `postCrossModuleCharge(tenantId: string, guestId: string, charge: {...}, idempotencyKey?: string)` - Post charge from another module

### Queries & Reports
- `getOperationalSummary(tenantId: string)` - Get today's operational summary

---

## 24. Tenant Service (`tenantService`)

### Core Operations
- `getAll(filters: TenantFilters)` - Get all tenants with filtering and pagination
- `getById(id: string)` - Get tenant by ID
- `getBySlug(slug: string)` - Get tenant by slug
- `create(data: CreateTenantDto)` - Create a new tenant with admin user
- `update(id: string, data: UpdateTenantDto)` - Update tenant
- `updateModules(id: string, modules: ModuleId[])` - Update tenant modules
- `updateStatus(id: string, status: TenantStatus)` - Update tenant status
- `delete(id: string)` - Delete tenant

### Queries & Reports
- `search(query: string)` - Search tenants by name
- `getStats()` - Get tenant statistics

---

## Summary Statistics

- **Total Services**: 24
- **Total API Methods**: ~200+
- **All methods require `tenantId`** (except `tenantService` which operates at tenant level)

---

## Notes

1. **Tenant Isolation**: All service methods (except `tenantService`) require `tenantId` as the first parameter to ensure proper data isolation.

2. **Pagination**: Methods that return lists typically support pagination through `page` and `pageSize` parameters.

3. **Filtering**: Most `getAll` methods support various filters for searching and filtering results.

4. **Error Handling**: All methods use custom error classes (`ValidationError`, `NotFoundError`, `BusinessRuleError`, etc.) for consistent error handling.

5. **Optimistic Locking**: Some update methods support version-based optimistic locking to prevent concurrent modification issues.

6. **Idempotency**: Workflow methods support idempotency keys to prevent duplicate operations.

---

*Last Updated: Generated from service files*

