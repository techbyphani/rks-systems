# Management Systems - Core Logic Documentation

**Version:** 1.0  
**Date:** 2024  
**System:** Hotel Management Suite

---

## Overview

This document describes the core logic, functionality, and key operations for all 9 management systems in the Hotel Management Suite. Each system is designed to be modular, tenant-isolated, and can work independently or in combination with other modules.

---

## Table of Contents

1. [CRS - Customer Reservation System](#1-crs---customer-reservation-system)
2. [RMS - Rooms Management System](#2-rms---rooms-management-system)
3. [BMS - Billing Management System](#3-bms---billing-management-system)
4. [IMS - Inventory Management System](#4-ims---inventory-management-system)
5. [OMS - Order Management System](#5-oms---order-management-system)
6. [SMS - Supply Management System](#6-sms---supply-management-system)
7. [AMS - Attendance Management System](#7-ams---attendance-management-system)
8. [TMS - Task Management System](#8-tms---task-management-system)
9. [AS - Accounting System](#9-as---accounting-system)

---

## 1. CRS - Customer Reservation System

### Core Purpose
Manages guest profiles, reservations, bookings, and the complete guest lifecycle from inquiry to checkout.

### Key Entities
- **Guest**: Customer profile with VIP status, preferences, stay history
- **Reservation**: Booking record with check-in/out dates, room assignment, status
- **ReservationStatus**: `inquiry` → `confirmed` → `checked_in` → `checked_out` → `cancelled` / `no_show`

### Core Logic

#### Guest Management
- **Create Guest**: New customer profile with contact info, ID verification, preferences
- **VIP Tiers**: `none` → `silver` → `gold` → `platinum` (based on stays/spend)
- **Guest Search**: Search by name, email, phone with fuzzy matching
- **Guest History**: Track total stays, spend, last visit date

#### Reservation Lifecycle
1. **Create Reservation**:
   - Select guest (or create new)
   - Choose room type and dates
   - Calculate nights and total amount
   - Set payment mode (prepaid/pay_at_hotel/corporate)
   - Generate confirmation number

2. **Check-In**:
   - Assign specific room from available inventory
   - Update reservation status to `checked_in`
   - Record actual check-in time
   - Create/update folio (if BMS enabled)

3. **Check-Out**:
   - Update reservation status to `checked_out`
   - Record actual check-out time
   - Release room for housekeeping
   - Finalize folio (if BMS enabled)

4. **Cancellation**:
   - Update status to `cancelled`
   - Record cancellation reason
   - Handle refunds (if applicable)
   - Release room if already assigned

#### Availability Logic
- **Room Availability Check**: Query RMS for available rooms by type and date range
- **Conflict Prevention**: Ensure no double-booking for same room/date
- **Channel Management**: Track booking source (direct, OTA, phone, walk-in)

#### Key Operations
- `create()` - New reservation with validation
- `checkIn()` - Assign room and mark as checked in
- `checkOut()` - Release room and finalize stay
- `cancel()` - Cancel with reason tracking
- `getTodaysArrivals()` - Today's check-ins
- `getTodaysDepartures()` - Today's check-outs
- `getInHouse()` - Current guests
- `getByDateRange()` - Reservations for date range

### Dependencies
- **Requires**: RMS (for room types and availability)
- **Optional**: BMS (for folio creation during check-in)

---

## 2. RMS - Rooms Management System

### Core Purpose
Manages physical room inventory, room status, housekeeping tasks, and maintenance requests.

### Key Entities
- **Room**: Physical room with number, type, status, condition
- **RoomType**: Room category (Standard, Deluxe, Suite) with rates and capacity
- **RoomStatus**: `available` → `occupied` → `reserved` → `dirty` → `cleaning` → `inspecting` → `out_of_order`
- **HousekeepingTask**: Cleaning/inspection tasks with status tracking
- **MaintenanceRequest**: Repair/maintenance tickets

### Core Logic

#### Room Status Workflow
1. **Available**: Ready for assignment
2. **Reserved**: Assigned to upcoming reservation
3. **Occupied**: Currently has guest
4. **Dirty**: Needs cleaning after checkout
5. **Cleaning**: Housekeeping in progress
6. **Inspecting**: Supervisor verification
7. **Out of Order**: Maintenance required
8. **Out of Service**: Long-term unavailable

#### Room Assignment Logic
- **Auto-Assign**: Find best available room by type, floor, preferences
- **Manual Assign**: Staff selects specific room
- **Conflict Check**: Verify no existing reservation conflicts
- **Room Release**: Automatically on checkout or manual release

#### Housekeeping Workflow
1. **Task Creation**: Auto-created on checkout or manual creation
2. **Task Types**: `checkout_clean`, `stayover_clean`, `deep_clean`, `turndown`, `inspection`
3. **Assignment**: Assign to housekeeper with priority
4. **Status Flow**: `pending` → `assigned` → `in_progress` → `completed` → `verified`
5. **Verification**: Supervisor inspects and approves

#### Maintenance Workflow
1. **Report**: Guest or staff reports issue
2. **Ticket Creation**: Auto-generate ticket number
3. **Categorization**: Electrical, plumbing, HVAC, furniture, etc.
4. **Priority**: `low` → `normal` → `high` → `emergency`
5. **Assignment**: Assign to engineer
6. **Resolution**: Track cost, time, resolution notes

#### Key Operations
- `getAvailableRooms()` - Find available rooms by type/date
- `assignToGuest()` - Assign room to reservation
- `updateStatus()` - Change room status
- `release()` - Release room after checkout
- `checkAvailability()` - Verify availability for date range
- `getStatusCounts()` - Dashboard statistics

### Dependencies
- **Standalone**: Can work independently
- **Optional**: CRS (for conflict checking during assignment)

---

## 3. BMS - Billing Management System

### Core Purpose
Manages guest folios, charges, payments, and invoice generation. **Fully independent** - can work standalone for customer billing.

### Key Entities
- **Folio**: Guest billing account (can be linked to reservation or standalone)
- **FolioCharge**: Individual charge item (room, F&B, spa, etc.)
- **Payment**: Payment record with method and status
- **Invoice**: Formal invoice document generated from folio

### Core Logic

#### Folio Management
- **Folio Types**:
  - **Hotel Folio**: Linked to reservation (auto-created on check-in)
  - **Customer Folio**: Standalone billing (no reservation needed)
- **Folio Status**: `open` → `closed` → `settled` → `disputed`
- **Balance Calculation**: `totalCharges - totalPayments = balance`

#### Charge Posting Logic
1. **Charge Categories**: Room, Food & Beverage, Spa, Laundry, Minibar, Telephone, Parking, Tax, Service Charge, Discount, Adjustment
2. **Post Charge**: Add charge to folio with description, quantity, unit price
3. **Tax Calculation**: Automatic tax calculation based on category
4. **Void Charge**: Reverse charge with reason (audit trail)

#### Payment Processing
1. **Payment Methods**: Cash, Credit Card, Debit Card, UPI, Bank Transfer, Corporate Account, Travel Agent, Voucher
2. **Payment Status**: `pending` → `completed` → `failed` → `refunded`
3. **Partial Payments**: Multiple payments allowed until balance = 0
4. **Refund Processing**: Track refund amount and reason

#### Invoice Generation
1. **Create from Folio**: Generate invoice from closed folio
2. **Invoice Items**: Line items from folio charges
3. **Invoice Status**: `draft` → `issued` → `sent` → `paid` → `overdue` → `cancelled`
4. **Payment Tracking**: Record payments against invoice

#### Key Operations
- `createFolio()` - New folio (with or without reservation)
- `postCharge()` - Add charge to folio
- `voidCharge()` - Reverse charge
- `processPayment()` - Record payment
- `closeFolio()` - Finalize folio
- `createInvoiceFromFolio()` - Generate invoice
- `getMetrics()` - Revenue and payment statistics

### Dependencies
- **Standalone**: Fully independent (can bill customers without hotel operations)
- **Optional**: CRS/RMS (for automatic folio creation on check-in)

---

## 4. IMS - Inventory Management System

### Core Purpose
Tracks inventory stock levels, consumption, reorder points, and stock movements.

### Key Entities
- **InventoryItem**: Stock item with SKU, current stock, par level
- **InventoryCategory**: Item categorization (hierarchical)
- **StockMovement**: Record of stock changes (purchase, consumption, adjustment)
- **StockStatus**: `In Stock` / `Low Stock` / `Out of Stock` (calculated)

### Core Logic

#### Stock Level Management
- **Current Stock**: Real-time quantity tracking
- **Par Level**: Target stock level for normal operations
- **Reorder Point**: Minimum stock before reordering
- **Reorder Quantity**: Amount to order when below reorder point

#### Stock Movement Types
1. **Purchase**: Stock increase from vendor (via SMS)
2. **Consumption**: Stock decrease from usage (via OMS)
3. **Adjustment**: Manual correction (add/remove)
4. **Transfer**: Move between locations
5. **Waste**: Record spoilage/expiry
6. **Return**: Return to vendor

#### Stock Status Calculation
```typescript
if (currentStock === 0) → "Out of Stock"
else if (currentStock <= reorderPoint) → "Low Stock"
else → "In Stock"
```

#### Alert System
- **Low Stock Alert**: Triggered when stock ≤ reorder point
- **Out of Stock Alert**: Triggered when stock = 0
- **Expiry Alert**: For perishable items (if expiry date tracking enabled)

#### Consumption Tracking
- **Automatic**: When orders are fulfilled (OMS integration)
- **Manual**: Staff records consumption
- **Category Analysis**: Track consumption by category for cost analysis

#### Key Operations
- `getAll()` - List items with filters (status, category, search)
- `updateStock()` - Adjust stock level
- `recordMovement()` - Log stock movement
- `getLowStockItems()` - Items below reorder point
- `getStockAlerts()` - Active alerts
- `calculateStockStatus()` - Determine status for item

### Dependencies
- **Standalone**: Base module (can work independently)
- **Required By**: OMS (for menu item stock), SMS (for purchase order items)

---

## 5. OMS - Order Management System

### Core Purpose
Manages guest orders (room service, restaurant, bar), menu items, and POS operations.

### Key Entities
- **Order**: Order record with items, status, guest/room
- **OrderItem**: Individual menu item in order
- **MenuItem**: Menu item definition with price, availability, dietary info
- **OrderStatus**: `pending` → `confirmed` → `preparing` → `ready` → `delivering` → `delivered` → `completed`

### Core Logic

#### Order Types
- **Room Service**: Delivery to guest room
- **Restaurant**: Dine-in orders
- **Bar**: Beverage orders
- **Spa**: Service bookings
- **Laundry**: Laundry service
- **Minibar**: In-room minibar consumption
- **Internal Requisition**: Staff/internal orders

#### Order Workflow
1. **Create Order**: Guest/staff places order
2. **Confirm**: Kitchen/bar acknowledges
3. **Prepare**: Item preparation in progress
4. **Ready**: Item ready for pickup/delivery
5. **Deliver**: Delivery to guest (if applicable)
6. **Complete**: Order fulfilled and charged

#### Menu Management
- **Menu Categories**: Appetizer, Main Course, Dessert, Beverage, Alcohol, Snack, Breakfast, Lunch, Dinner
- **Availability**: Toggle item availability (out of stock, seasonal)
- **Dietary Info**: Vegetarian, Vegan, Gluten-Free flags
- **Allergens**: Track allergen information

#### Pricing & Charges
- **Subtotal**: Sum of all order items
- **Tax**: Calculated tax amount
- **Service Charge**: Percentage-based service charge
- **Discount**: Applied discounts
- **Total**: Final amount

#### Folio Integration
- **Charge to Folio**: Automatically post to guest folio (if BMS enabled)
- **Standalone Payment**: Direct payment if no folio

#### Stock Integration
- **Consumption Tracking**: Automatically reduce inventory when order fulfilled
- **Stock Check**: Verify item availability before accepting order

#### Key Operations
- `create()` - New order with items
- `updateStatus()` - Change order status
- `cancel()` - Cancel order
- `getPending()` - Orders awaiting preparation
- `getTodays()` - Today's orders
- `getStats()` - Order statistics

### Dependencies
- **Requires**: IMS (for menu item stock tracking)
- **Optional**: BMS (for folio charging), CRS/RMS (for room service orders)

---

## 6. SMS - Supply Management System

### Core Purpose
Manages vendor relationships, purchase orders, and delivery tracking.

### Key Entities
- **Vendor**: Supplier company with contact info, payment terms
- **PurchaseOrder**: PO document with items, status, delivery date
- **Delivery**: Delivery record linked to PO
- **PurchaseOrderStatus**: `draft` → `pending_approval` → `approved` → `sent` → `acknowledged` → `partial_received` → `received` → `cancelled`

### Core Logic

#### Vendor Management
- **Vendor Status**: `active` / `inactive` / `blacklisted`
- **Payment Terms**: Credit terms (e.g., "Net 30")
- **Lead Time**: Days required for delivery
- **Rating**: Vendor performance rating
- **Categories**: Product categories vendor supplies

#### Purchase Order Workflow
1. **Create PO**: Select vendor, add items from inventory
2. **Calculate Totals**: Subtotal + Tax + Shipping = Total
3. **Approval**: Require approval for large orders (if configured)
4. **Send to Vendor**: Transmit PO to vendor
5. **Acknowledge**: Vendor confirms receipt
6. **Receive**: Track partial/full delivery
7. **Update Inventory**: Auto-update stock when received

#### Delivery Tracking
- **Scheduled Date**: Expected delivery date
- **Status**: `scheduled` → `in_transit` → `arrived` → `receiving` → `completed` → `rejected`
- **Receive Items**: Record received quantities (may differ from ordered)
- **Quality Check**: Accept/reject items with reason
- **Batch/Expiry**: Track batch numbers and expiry dates (for perishables)

#### Inventory Integration
- **Auto Stock Update**: When delivery completed, update inventory stock
- **Reorder Integration**: Can create PO from low stock alerts (IMS)

#### Key Operations
- `createPurchaseOrder()` - New PO with items
- `approvePO()` - Approve purchase order
- `sendPO()` - Send to vendor
- `receiveDelivery()` - Record delivery receipt
- `getPendingPOs()` - POs awaiting action
- `getVendorStats()` - Vendor performance metrics

### Dependencies
- **Requires**: IMS (for inventory items and stock updates)

---

## 7. AMS - Attendance Management System

### Core Purpose
Manages employee attendance, shifts, schedules, and leave requests.

### Key Entities
- **Employee**: Staff member with department, designation, employment type
- **Shift**: Shift definition (morning, afternoon, night) with times
- **ShiftSchedule**: Employee shift assignment for specific date
- **AttendanceRecord**: Daily attendance with clock in/out times
- **LeaveRequest**: Leave application with type and status

### Core Logic

#### Employee Management
- **Departments**: Front Office, Housekeeping, F&B, Kitchen, Engineering, Security, Spa, Sales, Finance, HR, IT, Management
- **Employment Types**: Full-time, Part-time, Contract, Intern
- **Status**: `active` / `on_leave` / `suspended` / `terminated`
- **Reporting Structure**: Manager assignment

#### Shift Management
- **Shift Types**: Morning, Afternoon, Night, Split, Flexible
- **Shift Definition**: Start time, end time, break duration
- **Schedule Assignment**: Assign shifts to employees for specific dates
- **Overtime Tracking**: Flag overtime shifts

#### Attendance Tracking
1. **Clock In**: Employee checks in (with timestamp)
2. **Break**: Track break start/end
3. **Clock Out**: Employee checks out
4. **Status Calculation**:
   - `present` - On time and complete
   - `late` - Clocked in after shift start
   - `absent` - No clock in
   - `half_day` - Partial attendance
   - `on_leave` - Approved leave
   - `holiday` / `weekend` - Non-working days

#### Leave Management
- **Leave Types**: Annual, Sick, Personal, Maternity, Paternity, Bereavement, Unpaid
- **Leave Status**: `pending` → `approved` / `rejected` / `cancelled`
- **Leave Balance**: Track entitled vs. taken vs. pending vs. balance
- **Approval Workflow**: Manager approves/rejects with reason

#### Key Operations
- `clockIn()` - Record clock in
- `clockOut()` - Record clock out
- `createLeaveRequest()` - Submit leave application
- `approveLeave()` - Approve/reject leave
- `getAttendance()` - Attendance records for date range
- `getLeaveBalance()` - Employee leave balances
- `getStats()` - Attendance statistics

### Dependencies
- **Standalone**: Fully independent

---

## 8. TMS - Task Management System

### Core Purpose
Assigns, tracks, and manages operational tasks across departments.

### Key Entities
- **Task**: Task record with title, description, assignee, due date
- **TaskStatus**: `pending` → `assigned` → `in_progress` → `on_hold` → `completed` → `cancelled` → `overdue`
- **TaskCategory**: Housekeeping, Maintenance, Guest Request, Internal, Event, Inspection, Delivery, Other
- **TaskPriority**: `low` → `normal` → `high` → `urgent`

### Core Logic

#### Task Creation
- **Manual**: Staff creates task
- **Automatic**: System-generated from other modules (e.g., maintenance request, housekeeping)
- **Templates**: Pre-defined task templates for common operations
- **Parent/Subtasks**: Hierarchical task structure

#### Task Assignment
- **Assign to Employee**: Specific staff member
- **Assign to Department**: Department-level assignment
- **Auto-Assignment**: Based on task category and department workload

#### Task Workflow
1. **Pending**: Created but not assigned
2. **Assigned**: Assigned to employee/department
3. **In Progress**: Work started
4. **On Hold**: Temporarily paused (with reason)
5. **Completed**: Task finished
6. **Verified**: Supervisor confirms completion
7. **Overdue**: Past due date and not completed

#### Task Tracking
- **Time Tracking**: Estimated vs. actual minutes
- **Comments**: Task updates and notes
- **Attachments**: Files/images related to task
- **Related Entities**: Link to room, guest, reservation, maintenance request, etc.

#### Cross-Module Integration
- **From RMS**: Housekeeping tasks, maintenance requests
- **From CRS**: Guest request tasks
- **From OMS**: Delivery tasks
- **From SMS**: Receiving tasks

#### Key Operations
- `create()` - New task
- `assign()` - Assign to employee/department
- `start()` - Mark as in progress
- `complete()` - Mark as completed
- `verify()` - Supervisor verification
- `getMyTasks()` - Current user's tasks
- `getByCategory()` - Tasks by category
- `getOverdue()` - Overdue tasks

### Dependencies
- **Standalone**: Fully independent
- **Integrates With**: All modules (for task creation from other operations)

---

## 9. AS - Accounting System

### Core Purpose
Manages financial accounts, transactions, journal entries, and financial reports.

### Key Entities
- **Account**: Chart of accounts entry (asset, liability, equity, revenue, expense)
- **Transaction**: Debit/credit transaction
- **JournalEntry**: Double-entry accounting record
- **FinancialReport**: Generated financial reports (P&L, Balance Sheet, etc.)

### Core Logic

#### Chart of Accounts
- **Account Types**: Asset, Liability, Equity, Revenue, Expense
- **Hierarchical Structure**: Parent-child account relationships
- **Account Codes**: Numeric codes for organization
- **System Accounts**: Auto-created accounts (e.g., Cash, Accounts Receivable)

#### Double-Entry Accounting
- **Journal Entry**: Every transaction has equal debits and credits
- **Entry Status**: `draft` → `posted` → `voided`
- **Entry Lines**: Multiple debit/credit lines per entry
- **Balance Validation**: Total debits must equal total credits

#### Transaction Recording
- **Automatic**: From other modules (BMS payments, OMS orders, SMS purchases)
- **Manual**: Accountant creates transactions
- **Reference Tracking**: Link transactions to source (reservation, order, invoice, etc.)

#### Account Balances
- **Balance Calculation**: Sum of all transactions for account
- **Real-time Updates**: Balances updated when transactions posted
- **Currency Support**: Multi-currency accounts

#### Financial Reports
1. **Profit & Loss (P&L)**: Revenue - Expenses = Profit
2. **Balance Sheet**: Assets = Liabilities + Equity
3. **Cash Flow**: Cash inflows and outflows
4. **Trial Balance**: All account balances
5. **Revenue by Source**: Breakdown by revenue category
6. **Expense by Category**: Expense analysis
7. **Occupancy Reports**: Hotel-specific metrics (ADR, RevPAR)

#### Integration with Other Modules
- **BMS**: Revenue from folios, payments
- **OMS**: F&B revenue
- **SMS**: Purchase expenses
- **CRS/RMS**: Room revenue

#### Key Operations
- `createAccount()` - New account in chart
- `createTransaction()` - Record transaction
- `createJournalEntry()` - Double-entry journal entry
- `postJournalEntry()` - Post entry (update balances)
- `voidTransaction()` - Reverse transaction
- `generateReport()` - Generate financial report
- `getAccountBalance()` - Current account balance
- `getTrialBalance()` - All account balances

### Dependencies
- **Requires**: BMS (for revenue/expense data), CRS (for room revenue), RMS (for room data)

---

## Cross-Module Workflows

### Check-In Workflow (CRS + RMS + BMS)
1. CRS: Update reservation status to `checked_in`
2. RMS: Assign room and update status to `occupied`
3. BMS: Create folio (if enabled)
4. TMS: Create housekeeping task for next day (if enabled)

### Check-Out Workflow (CRS + RMS + BMS + AS)
1. CRS: Update reservation status to `checked_out`
2. RMS: Release room and update status to `dirty`
3. BMS: Close folio and generate invoice (if needed)
4. AS: Record revenue transaction (if enabled)
5. TMS: Create checkout cleaning task (if enabled)

### Order Fulfillment (OMS + IMS + BMS)
1. OMS: Create order and update status
2. IMS: Reduce inventory stock (consumption)
3. BMS: Post charge to folio (if charge to folio)
4. TMS: Create delivery task (if room service)

### Purchase Order Receipt (SMS + IMS)
1. SMS: Receive delivery and update PO status
2. IMS: Increase inventory stock (purchase)
3. TMS: Create receiving task (if enabled)

---

## Common Patterns

### Tenant Isolation
- All operations require `tenantId` parameter
- Data filtered by tenant at service layer
- Cross-tenant access prevented

### Status Workflows
- Most entities have status fields with defined state transitions
- Status changes are logged with timestamps
- Invalid transitions are prevented

### Audit Trail
- All entities have `createdAt`, `updatedAt` timestamps
- `createdBy`, `updatedBy` track user actions
- Version fields for optimistic locking

### Error Handling
- Custom error classes: `NotFoundError`, `ValidationError`, `BusinessRuleError`, `ConflictError`
- Consistent error responses across all services
- Transaction rollback for failed operations

---

## Module Independence Summary

| Module | Independent? | Can Work Alone? | Dependencies |
|--------|-------------|------------------|--------------|
| **RMS** | ✅ Yes | ✅ Yes | None (base module) |
| **BMS** | ✅ Yes | ✅ Yes | None (fully independent) |
| **IMS** | ✅ Yes | ✅ Yes | None (base module) |
| **AMS** | ✅ Yes | ✅ Yes | None |
| **TMS** | ✅ Yes | ✅ Yes | None |
| **CRS** | ❌ No | ❌ No | Requires RMS |
| **OMS** | ❌ No | ❌ No | Requires IMS |
| **SMS** | ❌ No | ❌ No | Requires IMS |
| **AS** | ❌ No | ❌ No | Requires BMS, CRS, RMS |

---

**End of Documentation**

