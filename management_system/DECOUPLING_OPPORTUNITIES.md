# Decoupling Opportunities Analysis

## Current Dependencies

```
RMS: [] (standalone)
CRS: [RMS] (needs rooms)
BMS: [CRS, RMS] (needs reservations)
IMS: [] (standalone)
OMS: [IMS, BMS] (needs inventory + billing)
SMS: [IMS] (needs inventory)
AMS: [] (standalone)
TMS: [] (standalone)
AS: [BMS, CRS, RMS] (needs billing + reservations)
```

---

## Decoupling Opportunities

### ✅ **1. BMS Independence** (RECOMMENDED - Implementing Now)
**Current:** `bms: ['crs', 'rms']`
**Proposed:** `bms: []`

**Why:**
- Folios can work with just guests (no reservations needed)
- Billing is a general concept, not hotel-specific
- Enables: Restaurant + Billing bundle

**Changes:**
- Make `reservationId` optional in Folio
- Make `reservationId` optional in `createFolio()`
- Update all folio-related code

**Impact:** HIGH VALUE, MEDIUM EFFORT

---

### ✅ **2. OMS → BMS Optional** (RECOMMENDED - Part of BMS Independence)
**Current:** `oms: ['ims', 'bms']`
**Proposed:** `oms: ['ims']` (BMS optional)

**Why:**
- OMS can work without billing (just POS)
- Charge-to-folio is an optional feature
- UI already handles missing BMS gracefully

**Changes:**
- Remove BMS from OMS requirements
- Keep UI guards for charge-to-folio feature

**Impact:** HIGH VALUE, LOW EFFORT (already handled in UI)

---

### ⚠️ **3. AS → CRS/RMS Optional** (NOT RECOMMENDED - Keep As Is)
**Current:** `as: ['bms', 'crs', 'rms']`
**Proposed:** `as: ['bms']` (CRS/RMS optional)

**Why NOT:**
- Occupancy reports need reservation data
- Revenue by room type needs reservation data
- Most accounting features work with billing, but hotel-specific reports need reservations
- Limited value: Most hotels with accounting also have reservations

**Impact:** LOW VALUE, HIGH EFFORT

**Recommendation:** Keep AS requiring CRS + RMS. Hotel accounting without reservations doesn't make business sense.

---

### ❌ **4. CRS → RMS** (NOT POSSIBLE)
**Current:** `crs: ['rms']`

**Why NOT:**
- Reservations fundamentally need rooms
- Room types are required for booking
- This is a core business dependency

**Impact:** NOT FEASIBLE

---

### ❌ **5. SMS → IMS** (NOT POSSIBLE)
**Current:** `sms: ['ims']`

**Why NOT:**
- Supply management needs inventory to update stock
- Purchase orders update inventory items
- This is a core business dependency

**Impact:** NOT FEASIBLE

---

## Summary

### ✅ **Implement Now:**
1. **BMS Independence** - Make BMS standalone
2. **OMS → BMS Optional** - Make BMS optional for OMS

### ❌ **Don't Implement:**
1. **AS → CRS/RMS Optional** - Low value, high effort
2. **CRS → RMS** - Not feasible
3. **SMS → IMS** - Not feasible

---

## New Dependency Structure (After Changes)

```
RMS: [] (standalone)
CRS: [RMS] (needs rooms)
BMS: [] (standalone) ⭐ NEW
IMS: [] (standalone)
OMS: [IMS] (BMS optional) ⭐ UPDATED
SMS: [IMS] (needs inventory)
AMS: [] (standalone)
TMS: [] (standalone)
AS: [BMS] (CRS/RMS still needed for hotel reports) ⭐ UPDATED
```

**Note:** AS could technically work with just BMS, but hotel accounting reports need reservation data. Keeping CRS + RMS requirement for AS makes business sense.

---

## New Combinations Enabled

### Before: 12 combinations
### After: 16+ combinations

**New Bundles:**
- Restaurant + Billing: IMS + OMS + BMS
- Billing Only: BMS
- Restaurant + Billing + Supply: IMS + OMS + BMS + SMS
- Restaurant + Billing + Staff: IMS + OMS + BMS + AMS + TMS

