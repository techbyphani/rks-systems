# Phase 1 Missing Features - All Management Systems
## Basic Operational Features Needed for 16 Use Cases

---

## 📋 **OVERVIEW**

This document identifies **basic operational features** missing in each management system to support all 16 module bundles/use cases. Focus is on **essential operations**, not analytics or predictive features.

---

## 🏨 **1. ROOM MANAGEMENT SYSTEM (RMS)**

### ✅ **Currently Implemented:**
- Room CRUD operations
- Status management with state machine
- Room assignment & transfer
- Room blocking/scheduling
- Room history/audit trail
- Inspections with checklists
- Photos management
- Cleaning schedules
- Accessibility features
- Rate & amenity overrides
- Condition tracking
- Availability checking

### ❌ **Missing Basic Features:**

#### **1.1 Room Inventory Tracking** (Critical for all bundles)
**Why Needed:** Hotels need to track room assets (TV, minibar, furniture, amenities)
**Service Methods:**
```typescript
async getRoomInventory(tenantId: string, roomId: string): Promise<RoomInventory[]>
async updateRoomInventory(tenantId: string, roomId: string, items: RoomInventory[]): Promise<void>
async getMissingItems(tenantId: string, roomId: string): Promise<RoomInventory[]>
async markItemMissing(tenantId: string, roomId: string, itemId: string): Promise<void>
```
**UI:** Room inventory checklist, missing items alert
**Bundles Affected:** All (Essential Hotel, Complete Operations, Enterprise)

---

#### **1.2 Guest Preferences Storage** (Important for 5-star)
**Why Needed:** Store guest preferences for personalized service
**Service Methods:**
```typescript
async getGuestPreferences(tenantId: string, guestId: string): Promise<GuestPreferences>
async saveGuestPreferences(tenantId: string, guestId: string, preferences: GuestPreferences): Promise<void>
async getPreferredRooms(tenantId: string, guestId: string): Promise<Room[]>
```
**UI:** Guest preference panel, preference tags
**Bundles Affected:** Essential Hotel, Hotel + Restaurant, Complete Operations, Enterprise

---

#### **1.3 Room Setup Templates** (Important for customization)
**Why Needed:** Quick room setup for VIP, honeymoon, business guests
**Service Methods:**
```typescript
async getRoomSetupTemplates(tenantId: string): Promise<RoomSetupTemplate[]>
async createRoomSetupTemplate(tenantId: string, template: RoomSetupTemplate): Promise<RoomSetupTemplate>
async applyRoomSetupTemplate(tenantId: string, roomId: string, templateId: string): Promise<void>
```
**UI:** Setup templates library, quick application
**Bundles Affected:** Essential Hotel, Hotel + Restaurant, Complete Operations, Enterprise

---

#### **1.4 Housekeeping Workload Management** (Operational efficiency)
**Why Needed:** Balance housekeeping workload across staff
**Service Methods:**
```typescript
async getHousekeepingWorkload(tenantId: string, date: string): Promise<WorkloadReport>
async assignHousekeepingZone(tenantId: string, employeeId: string, zone: string[]): Promise<void>
async optimizeHousekeepingRoute(tenantId: string, floor: number): Promise<Room[]>
```
**UI:** Workload dashboard, zone assignment, route optimization
**Bundles Affected:** Essential Hotel, Complete Operations, Enterprise

---

**Priority:** High (Room Inventory), Medium (Others)

---

## 📅 **2. CUSTOMER RESERVATION SYSTEM (CRS)**

### ✅ **Currently Implemented:**
- Guest CRUD operations
- Reservation CRUD operations
- Check-in/check-out workflows
- Reservation status management
- Date range queries
- Channel statistics
- Guest search

### ❌ **Missing Basic Features:**

#### **2.1 Reservation Modifications** (Critical for operations)
**Why Needed:** Hotels need to modify reservations (dates, room type, guest count)
**Service Methods:**
```typescript
async modifyReservation(tenantId: string, id: string, changes: {
  checkInDate?: string;
  checkOutDate?: string;
  roomTypeId?: string;
  adults?: number;
  children?: number;
}): Promise<Reservation>
async splitReservation(tenantId: string, id: string, splitDate: string): Promise<{ original: Reservation; new: Reservation }>
async mergeReservations(tenantId: string, reservationIds: string[]): Promise<Reservation>
```
**UI:** Reservation modification form, split/merge actions
**Bundles Affected:** Essential Hotel, Basic Property, Hotel + Restaurant, Complete Operations, Enterprise

---

#### **2.2 Waitlist Management** (Important for overbooking)
**Why Needed:** Handle waitlist when rooms are full
**Service Methods:**
```typescript
async addToWaitlist(tenantId: string, data: WaitlistEntry): Promise<WaitlistEntry>
async getWaitlist(tenantId: string, date: string): Promise<WaitlistEntry[]>
async processWaitlist(tenantId: string, date: string): Promise<void>
```
**UI:** Waitlist view, auto-process on availability
**Bundles Affected:** Essential Hotel, Hotel + Restaurant, Complete Operations, Enterprise

---

#### **2.3 Group Reservations** (Important for events)
**Why Needed:** Handle group bookings (multiple rooms, one organizer)
**Service Methods:**
```typescript
async createGroupReservation(tenantId: string, data: GroupReservationDto): Promise<GroupReservation>
async getGroupReservations(tenantId: string, groupId: string): Promise<Reservation[]>
async addRoomToGroup(tenantId: string, groupId: string, reservationId: string): Promise<void>
```
**UI:** Group reservation form, group view
**Bundles Affected:** Essential Hotel, Hotel + Restaurant, Complete Operations, Enterprise

---

#### **2.4 Early Check-in / Late Check-out** (Operational flexibility)
**Why Needed:** Handle early arrivals and late departures
**Service Methods:**
```typescript
async requestEarlyCheckIn(tenantId: string, reservationId: string, requestedTime: string): Promise<EarlyCheckInRequest>
async requestLateCheckOut(tenantId: string, reservationId: string, requestedTime: string): Promise<LateCheckOutRequest>
async approveEarlyCheckIn(tenantId: string, requestId: string): Promise<void>
async approveLateCheckOut(tenantId: string, requestId: string): Promise<void>
```
**UI:** Early/late request forms, approval workflow
**Bundles Affected:** Essential Hotel, Hotel + Restaurant, Complete Operations, Enterprise

---

#### **2.5 Guest Communication History** (Customer service)
**Why Needed:** Track all communications with guests
**Service Methods:**
```typescript
async addGuestCommunication(tenantId: string, guestId: string, communication: GuestCommunication): Promise<void>
async getGuestCommunications(tenantId: string, guestId: string): Promise<GuestCommunication[]>
```
**UI:** Communication timeline, add communication form
**Bundles Affected:** Essential Hotel, Hotel + Restaurant, Complete Operations, Enterprise

---

**Priority:** High (Reservation Modifications), Medium (Others)

---

## 💰 **3. BILLING MANAGEMENT SYSTEM (BMS)**

### ✅ **Currently Implemented:**
- Folio CRUD operations
- Charge posting
- Payment processing
- Invoice generation
- Payment methods
- Revenue by date range
- Metrics & statistics

### ❌ **Missing Basic Features:**

#### **3.1 Payment Plans / Installments** (Important for long stays)
**Why Needed:** Allow guests to pay in installments
**Service Methods:**
```typescript
async createPaymentPlan(tenantId: string, folioId: string, plan: PaymentPlan): Promise<PaymentPlan>
async getPaymentPlans(tenantId: string, folioId: string): Promise<PaymentPlan[]>
async processInstallment(tenantId: string, planId: string, amount: number): Promise<void>
```
**UI:** Payment plan creation, installment schedule
**Bundles Affected:** Essential Hotel, Hotel + Restaurant, Complete Operations, Enterprise

---

#### **3.2 Refunds & Adjustments** (Critical for operations)
**Why Needed:** Handle refunds, discounts, adjustments
**Service Methods:**
```typescript
async processRefund(tenantId: string, paymentId: string, amount: number, reason: string): Promise<Refund>
async applyDiscount(tenantId: string, folioId: string, discount: Discount): Promise<void>
async applyAdjustment(tenantId: string, folioId: string, adjustment: Adjustment): Promise<void>
```
**UI:** Refund form, discount/adjustment forms
**Bundles Affected:** Essential Hotel, Hotel + Restaurant, Complete Operations, Enterprise, Standalone Restaurant

---

#### **3.3 Split Billing** (Important for groups)
**Why Needed:** Split folio charges across multiple guests
**Service Methods:**
```typescript
async splitFolio(tenantId: string, folioId: string, splits: FolioSplit[]): Promise<Folio[]>
async mergeFolios(tenantId: string, folioIds: string[]): Promise<Folio>
```
**UI:** Split folio form, merge folios action
**Bundles Affected:** Essential Hotel, Hotel + Restaurant, Complete Operations, Enterprise

---

#### **3.4 Deposit Management** (Important for bookings)
**Why Needed:** Track and manage deposits
**Service Methods:**
```typescript
async recordDeposit(tenantId: string, reservationId: string, amount: number, method: PaymentMethod): Promise<Deposit>
async getDeposits(tenantId: string, reservationId: string): Promise<Deposit[]>
async applyDepositToFolio(tenantId: string, folioId: string, depositId: string): Promise<void>
async refundDeposit(tenantId: string, depositId: string, amount: number): Promise<void>
```
**UI:** Deposit recording, deposit management
**Bundles Affected:** Essential Hotel, Hotel + Restaurant, Complete Operations, Enterprise

---

#### **3.5 Tax Management** (Critical for compliance)
**Why Needed:** Calculate and apply taxes correctly
**Service Methods:**
```typescript
async calculateTax(tenantId: string, amount: number, category: string): Promise<TaxBreakdown>
async getTaxRates(tenantId: string): Promise<TaxRate[]>
async updateTaxRates(tenantId: string, rates: TaxRate[]): Promise<void>
```
**UI:** Tax configuration, tax breakdown display
**Bundles Affected:** Essential Hotel, Hotel + Restaurant, Complete Operations, Enterprise, Standalone Restaurant

---

#### **3.6 Receipt Generation** (Basic requirement)
**Why Needed:** Generate receipts for payments
**Service Methods:**
```typescript
async generateReceipt(tenantId: string, paymentId: string): Promise<Receipt>
async getReceipt(tenantId: string, receiptId: string): Promise<Receipt>
```
**UI:** Receipt view, print receipt
**Bundles Affected:** All bundles with BMS

---

**Priority:** High (Refunds, Tax Management, Receipts), Medium (Others)

---

## 🍽️ **4. ORDER MANAGEMENT SYSTEM (OMS)**

### ✅ **Currently Implemented:**
- Order CRUD operations
- Order status management
- Menu management
- Menu item availability
- Order statistics
- Integration with BMS (charge to folio)

### ❌ **Missing Basic Features:**

#### **4.1 Table Management** (Critical for restaurants)
**Why Needed:** Restaurants need table assignment and management
**Service Methods:**
```typescript
async getTables(tenantId: string): Promise<Table[]>
async assignTable(tenantId: string, orderId: string, tableId: string): Promise<void>
async getTableStatus(tenantId: string, tableId: string): Promise<TableStatus>
async updateTableStatus(tenantId: string, tableId: string, status: TableStatus): Promise<void>
```
**UI:** Table layout view, table assignment
**Bundles Affected:** Hotel + Restaurant, Standalone Restaurant, Complete Operations, Enterprise

---

#### **4.2 Order Modifications** (Critical for operations)
**Why Needed:** Allow modifications to orders (add items, remove items, change quantity)
**Service Methods:**
```typescript
async modifyOrder(tenantId: string, orderId: string, modifications: OrderModification[]): Promise<Order>
async addOrderItem(tenantId: string, orderId: string, item: OrderItem): Promise<Order>
async removeOrderItem(tenantId: string, orderId: string, itemId: string): Promise<Order>
async updateOrderItemQuantity(tenantId: string, orderId: string, itemId: string, quantity: number): Promise<Order>
```
**UI:** Order modification form, item management
**Bundles Affected:** Hotel + Restaurant, Standalone Restaurant, Complete Operations, Enterprise

---

#### **4.3 Kitchen Display System (KDS)** (Important for efficiency)
**Why Needed:** Display orders in kitchen for preparation
**Service Methods:**
```typescript
async getKitchenOrders(tenantId: string, status?: OrderStatus): Promise<Order[]>
async markItemPrepared(tenantId: string, orderId: string, itemId: string): Promise<void>
async getKitchenStats(tenantId: string): Promise<KitchenStats>
```
**UI:** Kitchen display board, order preparation tracking
**Bundles Affected:** Hotel + Restaurant, Standalone Restaurant, Complete Operations, Enterprise

---

#### **4.4 Order Timing & SLA** (Operational efficiency)
**Why Needed:** Track order preparation time, delivery time
**Service Methods:**
```typescript
async getOrderTiming(tenantId: string, orderId: string): Promise<OrderTiming>
async getAveragePreparationTime(tenantId: string, dateRange: { start: string; end: string }): Promise<number>
async getSLAViolations(tenantId: string, date: string): Promise<Order[]>
```
**UI:** Order timing display, SLA alerts
**Bundles Affected:** Hotel + Restaurant, Standalone Restaurant, Complete Operations, Enterprise

---

#### **4.5 Menu Categories & Sections** (Basic organization)
**Why Needed:** Better menu organization (breakfast, lunch, dinner, beverages)
**Service Methods:**
```typescript
async getMenuCategories(tenantId: string): Promise<MenuCategory[]>
async createMenuCategory(tenantId: string, category: MenuCategory): Promise<MenuCategory>
async updateMenuCategory(tenantId: string, id: string, category: Partial<MenuCategory>): Promise<MenuCategory>
```
**UI:** Menu category management, category-based menu display
**Bundles Affected:** Hotel + Restaurant, Standalone Restaurant, Complete Operations, Enterprise

---

#### **4.6 Order Notes & Special Instructions** (Customer service)
**Why Needed:** Allow special instructions on orders
**Service Methods:**
```typescript
async addOrderNote(tenantId: string, orderId: string, note: string): Promise<void>
async getOrderNotes(tenantId: string, orderId: string): Promise<OrderNote[]>
```
**UI:** Order notes field, notes display
**Bundles Affected:** Hotel + Restaurant, Standalone Restaurant, Complete Operations, Enterprise

---

**Priority:** High (Table Management, Order Modifications), Medium (Others)

---

## 📦 **5. INVENTORY MANAGEMENT SYSTEM (IMS)**

### ✅ **Currently Implemented:**
- Inventory item CRUD operations
- Stock movement tracking
- Low stock alerts
- Category management
- Vendor management
- Stock statistics

### ❌ **Missing Basic Features:**

#### **5.1 Stock Transfer Between Locations** (Important for multi-location)
**Why Needed:** Transfer stock between storage locations
**Service Methods:**
```typescript
async transferStock(tenantId: string, fromLocation: string, toLocation: string, itemId: string, quantity: number): Promise<StockTransfer>
async getStockTransfers(tenantId: string, filters: { fromLocation?: string; toLocation?: string }): Promise<StockTransfer[]>
```
**UI:** Stock transfer form, transfer history
**Bundles Affected:** Hotel + Supply Chain, Complete Operations, Enterprise

---

#### **5.2 Stock Adjustment** (Critical for accuracy)
**Why Needed:** Adjust stock for discrepancies, damage, spoilage
**Service Methods:**
```typescript
async adjustStock(tenantId: string, itemId: string, quantity: number, reason: string, notes?: string): Promise<StockAdjustment>
async getStockAdjustments(tenantId: string, itemId?: string): Promise<StockAdjustment[]>
```
**UI:** Stock adjustment form, adjustment history
**Bundles Affected:** All bundles with IMS

---

#### **5.3 Expiry Date Tracking** (Important for F&B)
**Why Needed:** Track expiry dates for perishable items
**Service Methods:**
```typescript
async getExpiringItems(tenantId: string, days: number): Promise<InventoryItem[]>
async updateExpiryDate(tenantId: string, itemId: string, expiryDate: string): Promise<void>
```
**UI:** Expiry alerts, expiry date management
**Bundles Affected:** Hotel + Restaurant, Standalone Restaurant, Complete Operations, Enterprise

---

#### **5.4 Unit Conversion** (Important for operations)
**Why Needed:** Convert between units (kg to grams, liters to ml)
**Service Methods:**
```typescript
async convertUnit(tenantId: string, itemId: string, fromUnit: string, toUnit: string, quantity: number): Promise<number>
async getUnitConversions(tenantId: string, itemId: string): Promise<UnitConversion[]>
```
**UI:** Unit conversion calculator, conversion settings
**Bundles Affected:** All bundles with IMS

---

#### **5.5 Inventory Valuation** (Important for accounting)
**Why Needed:** Calculate inventory value (FIFO, LIFO, Average)
**Service Methods:**
```typescript
async getInventoryValue(tenantId: string, method: 'FIFO' | 'LIFO' | 'AVERAGE'): Promise<number>
async getInventoryValuationReport(tenantId: string, date: string): Promise<ValuationReport>
```
**UI:** Inventory valuation dashboard, valuation method selection
**Bundles Affected:** Hotel + Supply Chain, Complete Operations, Enterprise

---

**Priority:** High (Stock Adjustment, Expiry Tracking), Medium (Others)

---

## 🚚 **6. SUPPLY MANAGEMENT SYSTEM (SMS)**

### ✅ **Currently Implemented:**
- Purchase order CRUD operations
- Purchase order status management
- Delivery tracking
- Vendor management
- Purchase statistics

### ❌ **Missing Basic Features:**

#### **6.1 Purchase Order Approval Workflow** (Important for control)
**Why Needed:** Multi-level approval for purchase orders
**Service Methods:**
```typescript
async submitForApproval(tenantId: string, purchaseOrderId: string): Promise<void>
async approvePurchaseOrder(tenantId: string, purchaseOrderId: string, approvedBy: string): Promise<void>
async rejectPurchaseOrder(tenantId: string, purchaseOrderId: string, reason: string): Promise<void>
async getPendingApprovals(tenantId: string): Promise<PurchaseOrder[]>
```
**UI:** Approval workflow, pending approvals list
**Bundles Affected:** Hotel + Supply Chain, Complete Operations, Enterprise

---

#### **6.2 Receiving & Quality Check** (Critical for operations)
**Why Needed:** Receive goods and perform quality checks
**Service Methods:**
```typescript
async receiveGoods(tenantId: string, deliveryId: string, items: ReceivedItem[]): Promise<void>
async performQualityCheck(tenantId: string, deliveryId: string, check: QualityCheck): Promise<void>
async rejectGoods(tenantId: string, deliveryId: string, itemId: string, reason: string): Promise<void>
```
**UI:** Receiving form, quality check checklist
**Bundles Affected:** Hotel + Supply Chain, Complete Operations, Enterprise

---

#### **6.3 Purchase Order Templates** (Operational efficiency)
**Why Needed:** Create templates for recurring purchases
**Service Methods:**
```typescript
async createPOTemplate(tenantId: string, template: POTemplate): Promise<POTemplate>
async getPOTemplates(tenantId: string): Promise<POTemplate[]>
async createPOFromTemplate(tenantId: string, templateId: string): Promise<PurchaseOrder>
```
**UI:** PO template management, quick PO creation
**Bundles Affected:** Hotel + Supply Chain, Complete Operations, Enterprise

---

#### **6.4 Vendor Performance Tracking** (Important for selection)
**Why Needed:** Track vendor performance (delivery time, quality)
**Service Methods:**
```typescript
async getVendorPerformance(tenantId: string, vendorId: string, dateRange: { start: string; end: string }): Promise<VendorPerformance>
async getVendorRatings(tenantId: string): Promise<VendorRating[]>
```
**UI:** Vendor performance dashboard, ratings display
**Bundles Affected:** Hotel + Supply Chain, Complete Operations, Enterprise

---

#### **6.5 Purchase Requisitions** (Important for control)
**Why Needed:** Allow departments to request purchases
**Service Methods:**
```typescript
async createRequisition(tenantId: string, requisition: PurchaseRequisition): Promise<PurchaseRequisition>
async getRequisitions(tenantId: string, status?: RequisitionStatus): Promise<PurchaseRequisition[]>
async convertRequisitionToPO(tenantId: string, requisitionId: string): Promise<PurchaseOrder>
```
**UI:** Requisition form, requisition management
**Bundles Affected:** Hotel + Supply Chain, Complete Operations, Enterprise

---

**Priority:** High (Receiving & Quality Check, PO Approval), Medium (Others)

---

## 👥 **7. ATTENDANCE MANAGEMENT SYSTEM (AMS)**

### ✅ **Currently Implemented:**
- Employee CRUD operations
- Clock in/out
- Attendance records
- Shift management
- Leave management
- Attendance statistics

### ❌ **Missing Basic Features:**

#### **7.1 Shift Swapping** (Important for flexibility)
**Why Needed:** Allow employees to swap shifts
**Service Methods:**
```typescript
async requestShiftSwap(tenantId: string, fromEmployeeId: string, toEmployeeId: string, shiftId: string): Promise<ShiftSwapRequest>
async approveShiftSwap(tenantId: string, requestId: string): Promise<void>
async getShiftSwapRequests(tenantId: string, status?: 'pending' | 'approved' | 'rejected'): Promise<ShiftSwapRequest[]>
```
**UI:** Shift swap request form, approval workflow
**Bundles Affected:** Hotel + Staff Management, Complete Operations, Enterprise

---

#### **7.2 Overtime Management** (Critical for compliance)
**Why Needed:** Track and manage overtime
**Service Methods:**
```typescript
async recordOvertime(tenantId: string, employeeId: string, date: string, hours: number, reason: string): Promise<OvertimeRecord>
async getOvertimeRecords(tenantId: string, employeeId?: string, dateRange?: { start: string; end: string }): Promise<OvertimeRecord[]>
async approveOvertime(tenantId: string, recordId: string): Promise<void>
```
**UI:** Overtime recording, overtime approval
**Bundles Affected:** Hotel + Staff Management, Complete Operations, Enterprise

---

#### **7.3 Break Time Tracking** (Important for compliance)
**Why Needed:** Track break times for compliance
**Service Methods:**
```typescript
async startBreak(tenantId: string, employeeId: string): Promise<BreakRecord>
async endBreak(tenantId: string, employeeId: string): Promise<BreakRecord>
async getBreakRecords(tenantId: string, employeeId: string, date: string): Promise<BreakRecord[]>
```
**UI:** Break tracking buttons, break history
**Bundles Affected:** Hotel + Staff Management, Complete Operations, Enterprise

---

#### **7.4 Attendance Regularization** (Important for accuracy)
**Why Needed:** Allow employees to request attendance corrections
**Service Methods:**
```typescript
async requestAttendanceRegularization(tenantId: string, employeeId: string, request: AttendanceRegularizationRequest): Promise<void>
async getRegularizationRequests(tenantId: string, status?: 'pending' | 'approved' | 'rejected'): Promise<AttendanceRegularizationRequest[]>
async approveRegularization(tenantId: string, requestId: string): Promise<void>
```
**UI:** Regularization request form, approval workflow
**Bundles Affected:** Hotel + Staff Management, Complete Operations, Enterprise

---

#### **7.5 Attendance Reports** (Basic requirement)
**Why Needed:** Generate attendance reports
**Service Methods:**
```typescript
async getAttendanceReport(tenantId: string, employeeId: string, dateRange: { start: string; end: string }): Promise<AttendanceReport>
async getDepartmentAttendanceReport(tenantId: string, department: string, date: string): Promise<DepartmentAttendanceReport>
```
**UI:** Attendance report view, export functionality
**Bundles Affected:** Hotel + Staff Management, Complete Operations, Enterprise

---

**Priority:** High (Overtime Management, Attendance Reports), Medium (Others)

---

## ✅ **8. TASK MANAGEMENT SYSTEM (TMS)**

### ✅ **Currently Implemented:**
- Task CRUD operations
- Task assignment
- Task status management
- Task filtering
- Task statistics
- My tasks view

### ❌ **Missing Basic Features:**

#### **8.1 Task Dependencies** (Important for complex workflows)
**Why Needed:** Define task dependencies (Task B can't start until Task A is complete)
**Service Methods:**
```typescript
async addTaskDependency(tenantId: string, taskId: string, dependsOnTaskId: string): Promise<void>
async getTaskDependencies(tenantId: string, taskId: string): Promise<Task[]>
async canStartTask(tenantId: string, taskId: string): Promise<boolean>
```
**UI:** Dependency management, dependency visualization
**Bundles Affected:** Hotel + Staff Management, Complete Operations, Enterprise

---

#### **8.2 Task Templates** (Operational efficiency)
**Why Needed:** Create templates for recurring tasks
**Service Methods:**
```typescript
async createTaskTemplate(tenantId: string, template: TaskTemplate): Promise<TaskTemplate>
async getTaskTemplates(tenantId: string): Promise<TaskTemplate[]>
async createTaskFromTemplate(tenantId: string, templateId: string, data: Partial<Task>): Promise<Task>
```
**UI:** Task template management, quick task creation
**Bundles Affected:** Hotel + Staff Management, Complete Operations, Enterprise

---

#### **8.3 Task Comments & Attachments** (Collaboration)
**Why Needed:** Allow comments and file attachments on tasks
**Service Methods:**
```typescript
async addTaskComment(tenantId: string, taskId: string, comment: string, userId: string): Promise<TaskComment>
async getTaskComments(tenantId: string, taskId: string): Promise<TaskComment[]>
async addTaskAttachment(tenantId: string, taskId: string, file: File): Promise<TaskAttachment>
```
**UI:** Comments section, file upload
**Bundles Affected:** Hotel + Staff Management, Complete Operations, Enterprise

---

#### **8.4 Task Recurrence** (Important for recurring tasks)
**Why Needed:** Create recurring tasks (daily, weekly, monthly)
**Service Methods:**
```typescript
async createRecurringTask(tenantId: string, task: RecurringTask): Promise<RecurringTask>
async getRecurringTasks(tenantId: string): Promise<RecurringTask[]>
async generateRecurringInstances(tenantId: string, recurringTaskId: string): Promise<Task[]>
```
**UI:** Recurrence settings, recurring task management
**Bundles Affected:** Hotel + Staff Management, Complete Operations, Enterprise

---

#### **8.5 Task Time Tracking** (Important for productivity)
**Why Needed:** Track time spent on tasks
**Service Methods:**
```typescript
async startTimeTracking(tenantId: string, taskId: string, employeeId: string): Promise<TimeEntry>
async stopTimeTracking(tenantId: string, taskId: string): Promise<TimeEntry>
async getTaskTimeEntries(tenantId: string, taskId: string): Promise<TimeEntry[]>
```
**UI:** Time tracking buttons, time entries display
**Bundles Affected:** Hotel + Staff Management, Complete Operations, Enterprise

---

**Priority:** Medium (All features)

---

## 📊 **9. ACCOUNTING SYSTEM (AS)**

### ✅ **Currently Implemented:**
- Account CRUD operations
- Transaction CRUD operations
- Financial summary
- Profit & Loss report
- Occupancy report

### ❌ **Missing Basic Features:**

#### **9.1 Journal Entries** (Critical for accounting)
**Why Needed:** Manual journal entries for adjustments
**Service Methods:**
```typescript
async createJournalEntry(tenantId: string, entry: JournalEntry): Promise<JournalEntry>
async getJournalEntries(tenantId: string, dateRange: { start: string; end: string }): Promise<JournalEntry[]>
async reverseJournalEntry(tenantId: string, entryId: string): Promise<JournalEntry>
```
**UI:** Journal entry form, journal entries list
**Bundles Affected:** Hotel + Accounting, Enterprise

---

#### **9.2 Chart of Accounts Management** (Basic requirement)
**Why Needed:** Better organization of accounts
**Service Methods:**
```typescript
async getChartOfAccounts(tenantId: string): Promise<Account[]>
async createAccountCategory(tenantId: string, category: AccountCategory): Promise<AccountCategory>
async getAccountHierarchy(tenantId: string): Promise<AccountHierarchy>
```
**UI:** Chart of accounts tree view, category management
**Bundles Affected:** Hotel + Accounting, Enterprise

---

#### **9.3 Trial Balance** (Critical for accounting)
**Why Needed:** Generate trial balance report
**Service Methods:**
```typescript
async getTrialBalance(tenantId: string, date: string): Promise<TrialBalance>
async getTrialBalanceReport(tenantId: string, dateRange: { start: string; end: string }): Promise<TrialBalanceReport>
```
**UI:** Trial balance view, export functionality
**Bundles Affected:** Hotel + Accounting, Enterprise

---

#### **9.4 Bank Reconciliation** (Important for accuracy)
**Why Needed:** Reconcile bank statements with transactions
**Service Methods:**
```typescript
async createBankReconciliation(tenantId: string, accountId: string, statement: BankStatement): Promise<BankReconciliation>
async getBankReconciliations(tenantId: string, accountId: string): Promise<BankReconciliation[]>
async markTransactionReconciled(tenantId: string, transactionId: string, reconciliationId: string): Promise<void>
```
**UI:** Bank reconciliation form, reconciliation view
**Bundles Affected:** Hotel + Accounting, Enterprise

---

#### **9.5 Financial Periods** (Important for reporting)
**Why Needed:** Define financial periods (months, quarters, years)
**Service Methods:**
```typescript
async createFinancialPeriod(tenantId: string, period: FinancialPeriod): Promise<FinancialPeriod>
async getFinancialPeriods(tenantId: string): Promise<FinancialPeriod[]>
async closeFinancialPeriod(tenantId: string, periodId: string): Promise<void>
```
**UI:** Financial period management, period closing
**Bundles Affected:** Hotel + Accounting, Enterprise

---

**Priority:** High (Journal Entries, Trial Balance), Medium (Others)

---

## 📋 **SUMMARY BY PRIORITY**

### 🔴 **CRITICAL (Must Have for Phase 1):**

1. **RMS:** Room Inventory Tracking
2. **CRS:** Reservation Modifications
3. **BMS:** Refunds & Adjustments, Tax Management, Receipt Generation
4. **OMS:** Table Management, Order Modifications
5. **IMS:** Stock Adjustment, Expiry Date Tracking
6. **SMS:** Receiving & Quality Check, PO Approval
7. **AMS:** Overtime Management, Attendance Reports
8. **AS:** Journal Entries, Trial Balance

### 🟡 **IMPORTANT (High Value):**

1. **RMS:** Guest Preferences, Room Setup Templates, Housekeeping Workload
2. **CRS:** Waitlist Management, Group Reservations, Early/Late Check-in/out
3. **BMS:** Payment Plans, Split Billing, Deposit Management
4. **OMS:** Kitchen Display System, Order Timing & SLA, Menu Categories
5. **IMS:** Stock Transfer, Unit Conversion, Inventory Valuation
6. **SMS:** PO Templates, Vendor Performance, Purchase Requisitions
7. **AMS:** Shift Swapping, Break Time Tracking, Attendance Regularization
8. **TMS:** Task Dependencies, Task Templates, Task Comments, Task Recurrence
9. **AS:** Chart of Accounts, Bank Reconciliation, Financial Periods

---

## 🎯 **IMPLEMENTATION RECOMMENDATION**

### **Phase 1 Focus:**
1. ✅ **Stabilization** (6 weeks) - Testing & bug fixes
2. ✅ **Critical Features** (4 weeks) - Must-have features above
3. ✅ **Important Features** (4 weeks) - High-value features above

### **Total: 14 weeks**

### **Result:**
- ✅ All 16 bundles fully functional
- ✅ Production-ready system
- ✅ All basic operational features
- ✅ Ready for Phase 2 (analytics, predictive features)

---

## 📊 **BUNDLE COVERAGE**

After Phase 1, all bundles will have:
- ✅ Essential operations working
- ✅ Basic integrations complete
- ✅ Core workflows functional
- ✅ Ready for real-world use

**Missing (Phase 2):**
- Predictive analytics
- Advanced reporting
- AI-driven features
- Forecasting

