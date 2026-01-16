# Development Order - Simple Numbered List

## Recommended Order for Making Changes

### Phase 1: Foundation Modules (Start Here)

1. **RMS - Room Management System**
   - Room inventory, room types, housekeeping, maintenance
   - No dependencies - completely independent

2. **IMS - Inventory Management System**
   - Stock tracking, categories, vendors, stock movements
   - No dependencies - completely independent

3. **AMS - Attendance Management System**
   - Employees, attendance, leave, shifts
   - No dependencies - completely independent

4. **TMS - Task Management System**
   - Task creation, assignment, tracking
   - No dependencies - completely independent

---

### Phase 2: First-Level Dependencies

5. **CRS - Customer Reservation System**
   - Guests, reservations, check-in/out, calendar
   - Requires: RMS (already done in #1)

6. **SMS - Supply Management System**
   - Purchase orders, vendors, deliveries
   - Requires: IMS (already done in #2)

---

### Phase 3: Second-Level Dependencies

7. **BMS - Billing Management System**
   - Folios, payments, invoices, revenue
   - Requires: CRS (#5) + RMS (#1)

8. **OMS - Order Management System**
   - Menu, orders, room service, F&B
   - Requires: IMS (#2) + BMS (#7)

---

### Phase 4: Top-Level Module

9. **AS - Accounting System**
   - Accounts, transactions, reports, analytics
   - Requires: BMS (#7) + CRS (#5) + RMS (#1)

---

## Quick Reference

**Start with**: #1 RMS

**Then do**: #2 IMS, #3 AMS, #4 TMS (can be done in parallel)

**Then do**: #5 CRS, #6 SMS (can be done in parallel)

**Then do**: #7 BMS

**Then do**: #8 OMS

**Finally**: #9 AS

---

*Follow this order to avoid breaking dependencies and ensure stable development.*

