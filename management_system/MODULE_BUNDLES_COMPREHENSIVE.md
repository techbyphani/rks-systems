# Management System Bundles - Comprehensive Guide

## Overview
This document defines **logical, well-integrated bundles** of management systems for different hotel types and use cases. Each bundle ensures proper dependencies, integrations, and business logic.

---

## Bundle Categories

### 🏨 **CORE HOTEL BUNDLES** (Reservation-Focused)

#### 1. **Essential Hotel** ⭐ RECOMMENDED
**Modules:** `RMS + CRS + BMS`
- **Auto-includes:** RMS → CRS → BMS (full chain)
- **Use Case:** Standard hotels with reservations and billing
- **Features:**
  - Room management & housekeeping
  - Guest reservations & check-in/out
  - Billing, folios, payments, invoices
- **Perfect For:** 80% of hotels (small to mid-size)
- **Integration:** Full reservation-to-billing flow

#### 2. **Basic Property**
**Modules:** `RMS + CRS`
- **Auto-includes:** RMS → CRS
- **Use Case:** Guesthouses, B&Bs without billing system
- **Features:**
  - Room management
  - Guest reservations
  - Manual billing (external)
- **Perfect For:** Small properties, hostels
- **Integration:** Reservation-to-room assignment

#### 3. **Rooms Only**
**Modules:** `RMS`
- **Auto-includes:** RMS only
- **Use Case:** Property management without reservations
- **Features:**
  - Room inventory & status
  - Housekeeping & maintenance
- **Perfect For:** Property managers, maintenance-only
- **Integration:** Standalone

---

### 🍽️ **F&B BUNDLES** (Food & Beverage)

#### 4. **Hotel + Restaurant** ⭐ RECOMMENDED
**Modules:** `RMS + CRS + BMS + IMS + OMS`
- **Auto-includes:** RMS → CRS → BMS, IMS → OMS
- **Use Case:** Hotels with restaurant/room service
- **Features:**
  - Full hotel operations (Essential Hotel)
  - Menu management
  - Order management (restaurant, room service)
  - **Auto-charge to folio** (OMS → BMS integration)
- **Perfect For:** Hotels with F&B operations
- **Integration:** 
  - Orders automatically charge to guest folios
  - Inventory tracks F&B stock
  - Phone orders supported

#### 5. **Standalone Restaurant**
**Modules:** `IMS + OMS`
- **Auto-includes:** IMS → OMS (BMS optional for charge-to-folio)
- **Use Case:** Independent restaurants
- **Features:**
  - Menu management
  - Order management (POS)
  - Inventory tracking
- **Perfect For:** Restaurants, cafes, bars
- **Integration:** 
  - Menu items from inventory
  - Stock updates on orders
  - **Note:** If BMS enabled, can charge to hotel folios

---

### 📦 **INVENTORY & SUPPLY BUNDLES**

#### 6. **Hotel + Supply Chain**
**Modules:** `RMS + CRS + BMS + IMS + SMS`
- **Auto-includes:** RMS → CRS → BMS, IMS → SMS
- **Use Case:** Hotels managing their own inventory & purchases
- **Features:**
  - Full hotel operations
  - Inventory management
  - Vendor management
  - Purchase orders
- **Perfect For:** Hotels with in-house inventory control
- **Integration:**
  - Purchase orders update inventory
  - Inventory alerts for low stock

#### 7. **Inventory Only**
**Modules:** `IMS`
- **Auto-includes:** IMS only
- **Use Case:** Standalone inventory management
- **Features:**
  - Stock tracking
  - Category management
- **Perfect For:** Warehouses, stores
- **Integration:** Standalone

---

### 👥 **STAFF MANAGEMENT BUNDLES**

#### 8. **Hotel + Staff Management**
**Modules:** `RMS + CRS + BMS + AMS + TMS`
- **Auto-includes:** RMS → CRS → BMS, AMS, TMS
- **Use Case:** Hotels with employee management needs
- **Features:**
  - Full hotel operations
  - Employee attendance & shifts
  - Task assignment & tracking
- **Perfect For:** Hotels with structured staff operations
- **Integration:**
  - Tasks can be assigned to employees
  - Attendance linked to shifts

#### 9. **Staff Management Only**
**Modules:** `AMS + TMS`
- **Auto-includes:** AMS, TMS
- **Use Case:** Standalone HR operations
- **Features:**
  - Employee attendance
  - Task management
- **Perfect For:** Service companies, facilities
- **Integration:** Tasks linked to employees

---

### 💰 **ACCOUNTING BUNDLES**

#### 10. **Full Accounting Suite**
**Modules:** `RMS + CRS + BMS + AS`
- **Auto-includes:** RMS → CRS → BMS → AS
- **Use Case:** Hotels needing financial reporting
- **Features:**
  - Full hotel operations
  - Financial accounts
  - Profit & loss reports
  - Revenue analytics
- **Perfect For:** Hotels with accounting requirements
- **Integration:**
  - Billing data flows to accounting
  - Financial summaries from folios

---

### 🏢 **ENTERPRISE BUNDLES**

#### 11. **Complete Operations** ⭐ RECOMMENDED
**Modules:** `RMS + CRS + BMS + IMS + OMS + SMS + AMS + TMS`
- **Auto-includes:** All except AS
- **Use Case:** Mid-size hotels with full control
- **Features:**
  - Complete hotel operations
  - F&B management
  - Inventory & supply chain
  - Staff management
  - Task management
- **Perfect For:** 50-200 room hotels
- **Integration:** All modules integrated

#### 12. **Enterprise Suite** ⭐ RECOMMENDED
**Modules:** `ALL MODULES` (RMS + CRS + BMS + IMS + OMS + SMS + AMS + TMS + AS)
- **Auto-includes:** Everything
- **Use Case:** Large properties or hotel chains
- **Features:**
  - Complete operations
  - Full accounting & financial reporting
  - Multi-property support (future)
- **Perfect For:** 200+ room hotels, chains
- **Integration:** Full ecosystem integration

---

## Bundle Selection Matrix

| Hotel Type | Recommended Bundle | Alternative |
|------------|-------------------|-------------|
| **Small B&B (5-10 rooms)** | Essential Hotel | Basic Property |
| **Standard Hotel (10-50 rooms)** | Essential Hotel | - |
| **Hotel with Restaurant** | Hotel + Restaurant | Complete Operations |
| **Boutique Hotel** | Hotel + Restaurant + Staff Management | Complete Operations |
| **Mid-size Hotel (50-150 rooms)** | Complete Operations | Enterprise Suite |
| **Large Hotel (150+ rooms)** | Enterprise Suite | - |
| **Hotel Chain** | Enterprise Suite | - |
| **Standalone Restaurant** | Standalone Restaurant | - |
| **Property Manager** | Rooms Only | - |

---

## Integration Logic by Bundle

### **Essential Hotel** (RMS + CRS + BMS)
```
Guest Books → CRS creates reservation
    ↓
Check-in → CRS updates status
    ↓
Room Assignment → RMS assigns room
    ↓
Billing → BMS creates folio
    ↓
Check-out → BMS closes folio, generates invoice
```

### **Hotel + Restaurant** (RMS + CRS + BMS + IMS + OMS)
```
Guest Orders Food → OMS creates order
    ↓
Order Prepared → OMS updates status
    ↓
Order Delivered → OMS marks complete
    ↓
Auto-Charge → OMS posts to BMS folio (if chargeToFolio: true)
    ↓
Inventory Update → IMS reduces stock
```

### **Complete Operations** (All except AS)
```
Reservation Flow → CRS → RMS → BMS
    ↓
F&B Orders → OMS → BMS (charge to folio)
    ↓
Inventory → IMS → SMS (purchase orders)
    ↓
Staff Tasks → TMS → AMS (employee assignment)
    ↓
All integrated seamlessly
```

---

## Bundle Validation Rules

### ✅ **Valid Combinations**
- Any bundle that includes all dependencies
- Standalone modules (RMS, IMS, AMS, TMS)
- Logical business flows (e.g., OMS requires IMS)

### ❌ **Invalid Combinations**
- OMS without IMS (needs menu items)
- BMS without CRS (needs reservations)
- AS without BMS (needs billing data)
- OMS without BMS (if charge-to-folio needed)

---

## Implementation Notes

1. **Auto-Enable Dependencies:** When selecting a bundle, all dependencies are automatically enabled
2. **Cannot Disable Dependencies:** If a module depends on another, you cannot disable the dependency
3. **Graceful Degradation:** If optional features are missing (e.g., BMS for OMS), those features are hidden
4. **Integration Points:** All integrations are handled via `workflowService` for consistency

---

## Recommended Default Bundles

For new hotel onboarding, recommend in this order:

1. **Essential Hotel** - 80% of hotels
2. **Hotel + Restaurant** - If they have F&B
3. **Complete Operations** - If they want full control
4. **Enterprise Suite** - For large properties

---

## Migration Path

Hotels can upgrade bundles:
- **Basic Property** → **Essential Hotel** (add BMS)
- **Essential Hotel** → **Hotel + Restaurant** (add IMS + OMS)
- **Hotel + Restaurant** → **Complete Operations** (add SMS + AMS + TMS)
- **Complete Operations** → **Enterprise Suite** (add AS)

