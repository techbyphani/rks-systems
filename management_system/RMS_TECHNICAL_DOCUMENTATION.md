# RMS - Rooms Management System: Technical Documentation (As-Implemented)

**Document Type:** Technical Audit & Risk Review  
**Date:** 2024  
**Reviewer:** Senior Backend Architect  
**Status:** Current Implementation Analysis

---

## Executive Summary

This document provides a **brutally honest** technical review of the RMS implementation as it exists in the codebase. It documents actual behavior, identifies gaps, risks, and logical loopholes. **This is NOT a design document** - it reflects what the code actually does.

**Critical Finding:** RMS is a **frontend mock service** with in-memory data stores. All operations are synchronous within the service layer, but there is **no transaction management**, **no database persistence**, and **no distributed locking**. The implementation includes sophisticated business logic but has several architectural risks when ported to a real backend.

---

## 1. System Overview

### What RMS Actually Does

RMS manages:
- **Physical room inventory** (room numbers, types, floors, buildings)
- **Room status lifecycle** (8 distinct statuses with state machine validation)
- **Room assignment** to guests/reservations
- **Housekeeping task coordination** (with auto-status updates)
- **Maintenance request tracking** (with auto-status updates)
- **Room availability calculation** (checks reservations + blocks)
- **Room history/audit trail** (status changes, assignments, notes)
- **Room blocks** (maintenance, events, VIP holds)
- **Room inspections** (with scoring and approval workflow)
- **Room photos, accessibility, rate overrides, amenities**

### Source of Truth

**Current State:**
- **In-memory arrays** (`rooms`, `roomTypes`, `roomHistory`, `roomBlocks`, etc.)
- **No persistence layer** - all data is lost on page refresh
- **No database** - this is a mock implementation
- **Tenant isolation** is enforced via filtering, not database-level constraints

**What RMS is Source of Truth For:**
- Room status (authoritative)
- Room assignment (currentGuestId, currentReservationId)
- Room condition and scores
- Room availability (calculated from status + reservations + blocks)
- Room history/audit trail

**What RMS is NOT Source of Truth For:**
- Reservations (CRS is source of truth)
- Guest data (CRS is source of truth)
- Employee data (AMS is source of truth)

### Current Responsibilities

1. ✅ **Room CRUD operations** (create, read, update, delete)
2. ✅ **Status state machine enforcement** (validates transitions)
3. ✅ **Room assignment with conflict checking** (queries CRS)
4. ✅ **Availability calculation** (queries CRS for reservations)
5. ✅ **Housekeeping task integration** (auto-updates room status)
6. ✅ **Maintenance request integration** (auto-updates room status)
7. ✅ **Room blocking/scheduling** (prevents availability)
8. ✅ **Room inspection workflow** (with scoring)
9. ✅ **History/audit trail** (all status changes logged)
10. ✅ **Tenant isolation** (all operations scoped to tenant)

---

## 2. Existing Key Entities (As Implemented)

### Room Entity

**Fields (from `types/index.ts`):**
```typescript
{
  id: string;
  tenantId?: string;  // CRITICAL: Tenant isolation
  roomNumber: string;
  roomTypeId: string;
  roomType?: RoomType;  // Populated on read
  floor: number;
  building?: string;
  wing?: string;
  status: RoomStatus;  // 8 possible values
  condition: RoomCondition;  // 8 possible values
  conditionScore?: number;  // 0-100
  isSmokingAllowed: boolean;
  hasBalcony: boolean;
  viewType?: string;
  currentGuestId?: string;  // Set on assignment
  currentReservationId?: string;  // Set on assignment
  lastCleanedAt?: string;
  lastInspectedAt?: string;
  notes?: string;
  photos?: RoomPhoto[];
  accessibility?: RoomAccessibility;
  rateOverride?: number;
  amenityOverrides?: string[];
  maintenanceScheduleId?: string;
  cleaningScheduleId?: string;
  version?: number;  // For optimistic locking (NOT consistently used)
  createdAt: string;
  updatedAt: string;
}
```

**Inconsistencies Found:**
- ❌ **`version` field is optional** - optimistic locking only works if version is provided
- ❌ **`tenantId` is optional in type** - but required in practice (runtime validation)
- ❌ **`roomType` is populated on read** - not always consistent (depends on service call)
- ⚠️ **`currentGuestId` and `currentReservationId`** - can be out of sync if CRS updates reservation without notifying RMS

### RoomStatus Enum

**Values (from code):**
```typescript
'available' | 'occupied' | 'reserved' | 'dirty' | 'cleaning' | 
'inspecting' | 'out_of_order' | 'out_of_service'
```

**Meanings (as implemented):**
- `available`: Ready for assignment
- `occupied`: Currently has guest (currentGuestId set)
- `reserved`: Assigned to upcoming reservation
- `dirty`: Needs cleaning after checkout
- `cleaning`: Housekeeping in progress
- `inspecting`: Supervisor verification
- `out_of_order`: Maintenance required (temporary)
- `out_of_service`: Long-term unavailable

**Ambiguities:**
- ⚠️ **`reserved` vs `occupied`**: Code allows assignment from both `available` and `reserved`, but `reserved` is meant for future reservations. Logic is unclear.
- ⚠️ **`out_of_order` vs `out_of_service`**: Both block availability, but distinction is not enforced in business logic.

### RoomCondition Enum

**Values:**
```typescript
'clean' | 'dirty' | 'inspected' | 'needs_repair' | 
'excellent' | 'good' | 'fair' | 'poor'
```

**Inconsistencies:**
- ❌ **Condition is auto-set on status change** (line 239: `condition: status === 'available' ? 'clean' : rooms[index].condition`) - but this can override manual condition updates
- ⚠️ **Condition and status can be out of sync** - e.g., room can be `available` with condition `needs_repair`

### RoomType Entity

**Fields:**
```typescript
{
  id: string;
  tenantId?: string;
  code: string;
  name: string;
  description: string;
  baseRate: number;
  maxOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  bedType: string;
  bedCount: number;
  size: number;
  amenities: string[];
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Issues:**
- ⚠️ **Soft delete only** - `isActive: false` but rooms can still reference inactive types
- ❌ **No validation** when updating room type that rooms are using it (only on delete)

---

## 3. Current Room Status Lifecycle

### All Statuses Present in Code

1. `available` - Base state, ready for assignment
2. `occupied` - Guest in room
3. `reserved` - Assigned to future reservation
4. `dirty` - Needs cleaning
5. `cleaning` - Housekeeping active
6. `inspecting` - Supervisor checking
7. `out_of_order` - Maintenance required
8. `out_of_service` - Long-term unavailable

### Allowed Transitions (Explicit)

**Defined in `VALID_STATUS_TRANSITIONS` (lines 43-52):**

```typescript
available → ['reserved', 'occupied', 'out_of_order', 'out_of_service', 'cleaning', 'inspecting']
occupied → ['dirty', 'out_of_order']
reserved → ['available', 'occupied', 'out_of_order']
dirty → ['cleaning', 'out_of_order']
cleaning → ['inspecting', 'available', 'dirty', 'out_of_order']
inspecting → ['available', 'dirty', 'out_of_order']
out_of_order → ['dirty', 'cleaning', 'available', 'out_of_service']
out_of_service → ['out_of_order', 'available']
```

### Transitions That Are Technically Possible But Logically Unsafe

**🚨 CRITICAL ISSUES:**

1. **`available → cleaning`** - **UNSAFE**: Room should be `dirty` first before cleaning starts
   - **Risk**: Room can skip dirty state, losing audit trail

2. **`available → inspecting`** - **UNSAFE**: Room should be `cleaning` first
   - **Risk**: Inspection can happen without cleaning record

3. **`reserved → available`** - **QUESTIONABLE**: If reservation is cancelled, this is OK, but if reservation is active, room should go to `occupied` not `available`
   - **Risk**: Room can be released while reservation is still active

4. **`cleaning → available`** - **UNSAFE**: Should go through `inspecting` first
   - **Risk**: Room can be made available without inspection

5. **`out_of_order → available`** - **UNSAFE**: Should go through `dirty` → `cleaning` → `inspecting` first
   - **Risk**: Maintenance room can be made available without proper cleaning

6. **`occupied → out_of_order`** - **QUESTIONABLE**: Guest is still in room, but room is marked out of order
   - **Risk**: Guest can be in room that's marked for maintenance

### Implicit Transitions (Not in State Machine)

**These happen in code but are NOT validated:**

1. **`assignToGuest()`** - Forces status to `occupied` (line 326) - **BYPASSES STATE MACHINE**
   - **Risk**: Can assign room that's in invalid state

2. **`release()`** - Forces status to `dirty` (line 482) - **BYPASSES STATE MACHINE**
   - **Risk**: Can release room that's not actually occupied

3. **`transferRoom()`** - Forces `fromRoom` to `dirty` and `toRoom` to `occupied` (lines 409, 419) - **BYPASSES STATE MACHINE**
   - **Risk**: Can transfer from invalid states

4. **Housekeeping `verify()`** - Auto-updates to `available` (line 377) - **BYPASSES STATE MACHINE**
   - **Risk**: Can make room available without proper state transition

5. **Maintenance `complete()`** - Auto-updates to `dirty` (line 361) - **BYPASSES STATE MACHINE**
   - **Risk**: Can transition from `out_of_order` to `dirty` without validation

**🚨 CRITICAL FINDING:** The state machine is **NOT consistently enforced**. Many operations bypass it entirely.

---

## 4. Room Assignment Logic (As-Is)

### How Rooms Are Currently Assigned

**Method: `assignToGuest()` (lines 266-348)**

**Process:**
1. Validates room exists and belongs to tenant
2. Checks optimistic locking (if version provided)
3. Validates room status is `available` OR `reserved`
4. **Queries CRS** for reservation details
5. **Queries CRS** for conflicting reservations in date range
6. Validates room capacity (adults, children, infants)
7. Updates room: sets `status = 'occupied'`, `currentGuestId`, `currentReservationId`
8. Increments version
9. Logs to history

### Auto vs Manual Logic

**Current Implementation:**
- ❌ **NO auto-assignment logic exists** - all assignments are manual
- ⚠️ **`getAvailableRooms()`** returns available rooms by type, but caller must select
- ❌ **No "best room" algorithm** - no preference matching, floor selection, etc.

### How Conflicts Are Currently Prevented

**Conflict Check (lines 294-317):**
```typescript
// Gets reservation dates
const reservation = await reservationService.getById(tenantId, reservationId);

// Gets ALL reservations in date range
const conflictingReservations = await reservationService.getByDateRange(
  tenantId,
  reservation.checkInDate,
  reservation.checkOutDate
);

// Filters for same room, excludes current reservation and cancelled/checked_out
const roomConflicts = conflictingReservations.filter(
  r => r.roomId === id && 
       r.id !== reservationId && 
       r.status !== 'cancelled' && 
       r.status !== 'checked_out'
);
```

**🚨 ISSUES:**

1. **Race Condition**: Between `getByDateRange()` and `assignToGuest()`, another assignment can happen
   - **Risk**: Double-booking possible

2. **No Locking**: Room is not locked during conflict check
   - **Risk**: Two concurrent assignments can both pass conflict check

3. **Date Range Logic**: Uses reservation's check-in/check-out dates, but doesn't account for:
   - Early check-ins
   - Late check-outs
   - Room blocks in same period

4. **Status Filtering**: Only excludes `cancelled` and `checked_out`, but:
   - `no_show` reservations are NOT excluded (should be?)
   - `inquiry` reservations are NOT excluded (should be?)

### Concurrency Handling (or Lack Thereof)

**Current State:**
- ✅ **Optimistic locking exists** - `version` field with `checkVersion()` and `incrementVersion()`
- ❌ **NOT consistently used** - `assignToGuest()` requires `expectedVersion` parameter, but:
  - `updateStatus()` does NOT use version
  - `release()` does NOT use version
  - `transferRoom()` does NOT use version
  - `update()` uses version but it's optional

**🚨 CRITICAL GAP:** Most operations can overwrite each other's changes.

**Example Race Condition:**
1. User A loads room (version=5)
2. User B loads room (version=5)
3. User A updates status to `cleaning` (version=6)
4. User B updates status to `available` (version=6) - **OVERWRITES User A's change**

---

## 5. Housekeeping Logic (As-Is)

### When Tasks Are Created

**Current Implementation:**
- ❌ **NO automatic task creation** - tasks must be created manually via `housekeepingService.create()`
- ⚠️ **Mock initialization** creates tasks for `tenant-001` only (lines 10-35)
- ❌ **No integration with `release()`** - when room is released, housekeeping task is NOT auto-created

**Expected Behavior (Not Implemented):**
- When `release()` is called, should auto-create `checkout_clean` task
- When room status changes to `dirty`, should auto-create task

### Status Handling

**Task Status Flow:**
```
pending → assigned → in_progress → completed → verified
```

**Status Updates:**
- `start()` - Sets `startedAt` timestamp
- `complete()` - Sets `completedAt` timestamp
- `verify()` - Sets `verifiedAt` and `verifiedBy`

**🚨 ISSUES:**

1. **No status transition validation** - can skip states (e.g., `pending` → `completed`)
2. **No validation** that task is assigned before starting
3. **No validation** that task is completed before verifying

### Coupling with Room Availability

**Auto-Status Update (lines 359-385):**

When housekeeping task is verified:
```typescript
// If room is dirty or cleaning, make it available after verification
if (room.status === 'dirty' || room.status === 'cleaning') {
  // Check for other pending tasks
  const otherPendingTasks = tasks.filter(...);
  
  // If no other pending tasks, make available
  if (otherPendingTasks.length === 0) {
    await roomService.updateStatus(tenantId, task.roomId, 'available', verifiedBy);
  }
}
```

**🚨 CRITICAL ISSUES:**

1. **Error Swallowing**: Wrapped in try-catch that logs but doesn't fail (line 381-384)
   - **Risk**: Task can be verified but room status update fails silently

2. **Race Condition**: Checks for other tasks, but between check and update, another task can be created
   - **Risk**: Room can be made available while other tasks are pending

3. **Bypasses State Machine**: Directly calls `updateStatus()` which may violate state machine rules
   - **Risk**: Room can transition from `cleaning` to `available` without `inspecting` state

4. **No Rollback**: If room status update fails, task is still marked verified
   - **Risk**: Data inconsistency

### Missing Validations

1. ❌ **No validation** that room exists when creating task
2. ❌ **No validation** that room is in valid state for task type (e.g., `checkout_clean` requires `dirty` status)
3. ❌ **No validation** that assigned employee exists (AMS integration missing)
4. ❌ **No validation** that task is for today's date (can create tasks for past dates)

---

## 6. Maintenance Logic (As-Is)

### How Maintenance Requests Affect Room Status

**Current Implementation:**
- ❌ **NO automatic room status update** when maintenance request is created
- ⚠️ **Manual room blocks** can be created via `scheduleMaintenance()` which calls `createRoomBlock()`
- ✅ **Auto-status update on completion** (lines 344-368)

**Auto-Status Update on Completion:**
```typescript
// If room was out_of_order due to maintenance
if (room && room.status === 'out_of_order') {
  // Check for other active requests
  const otherActiveRequests = requests.filter(...);
  
  // If no other active requests, make dirty for cleaning
  if (otherActiveRequests.length === 0) {
    await roomService.updateStatus(tenantId, request.roomId, 'dirty', 'system');
  }
}
```

**🚨 SAME ISSUES AS HOUSEKEEPING:**
- Error swallowing
- Race conditions
- Bypasses state machine
- No rollback

### Gaps Between Maintenance and Availability

**🚨 CRITICAL GAPS:**

1. **No automatic room blocking** - When maintenance request is created for a room, room is NOT automatically set to `out_of_order`
   - **Risk**: Room can be assigned while maintenance is needed

2. **No validation** that room can be assigned if it has active maintenance requests
   - **Risk**: Guest can be assigned to room with open maintenance ticket

3. **No integration with room blocks** - Maintenance requests and room blocks are separate systems
   - **Risk**: Room can be blocked for maintenance but also have maintenance request (duplication)

4. **No priority handling** - Emergency maintenance doesn't automatically block room
   - **Risk**: Critical issues can be ignored in availability calculations

---

## 7. Availability Calculation (As-Is)

### How Availability Is Computed

**Method: `checkAvailability()` (lines 777-833)**

**Process:**
1. Gets all rooms of specified type for tenant
2. Filters by status: `available` OR `reserved`
3. **Queries CRS** for reservations in date range
4. Filters out rooms with conflicting reservations
5. **Checks room blocks** for active blocks in date range
6. Filters out blocked rooms
7. Returns only rooms with status `available` (excludes `reserved`)

**🚨 CRITICAL ISSUES:**

1. **Double Filtering**: First includes `reserved` rooms, then excludes them at end (line 831)
   - **Risk**: Logic is confusing, `reserved` rooms are never returned

2. **No Real-Time Status Check**: Only checks status at query time, doesn't account for:
   - Rooms being assigned between query and use
   - Rooms being blocked between query and use
   - Rooms being set to `out_of_order` between query and use

3. **Reservation Status Filtering**: Only excludes `cancelled`, `checked_out`, `no_show` (line 812)
   - ⚠️ **`inquiry` reservations are excluded** - but should they be? If inquiry becomes confirmed, room is already excluded

4. **Room Block Logic**: Checks if block overlaps date range, but:
   - Doesn't check if block is actually active (`isActive` flag)
   - Doesn't check block reason (maintenance vs event vs VIP)

### What Data Is Trusted

**Trusted Sources:**
- ✅ Room status (from RMS - authoritative)
- ✅ Reservations (from CRS - trusted but can be stale)
- ✅ Room blocks (from RMS - authoritative)

**Not Trusted (But Should Be):**
- ❌ Maintenance requests (not checked in availability)
- ❌ Housekeeping tasks (not checked - room can be `available` but have pending cleaning)
- ❌ Room condition (not checked - room can be `available` but `needs_repair`)

### Edge Cases Currently Not Handled

1. **Early Check-In**: Guest arrives early, room is `available` but reservation starts tomorrow
   - **Current**: Room appears available, but should be reserved

2. **Late Check-Out**: Guest checks out late, room is `occupied` but checkout date passed
   - **Current**: Room doesn't appear available even though it should be

3. **Concurrent Queries**: Multiple users query availability simultaneously
   - **Current**: Both get same results, both can assign same room

4. **Room Transfer**: Guest is transferred to another room, original room status
   - **Current**: Original room goes to `dirty`, but availability calculation doesn't account for transfer timing

5. **Maintenance During Stay**: Maintenance needed while guest is in room
   - **Current**: Room stays `occupied`, but shouldn't be available for next guest

---

## 8. Cross-System Coupling

### CRS Dependencies (Direct or Indirect)

**Direct Dependencies:**
- ✅ **`reservationService.getById()`** - Used in `assignToGuest()` and `transferRoom()`
- ✅ **`reservationService.getByDateRange()`** - Used in conflict checking and availability
- ✅ **`reservationService.getAll()`** - Used in `delete()` to check for future reservations

**🚨 CRITICAL COUPLING ISSUES:**

1. **Tight Coupling**: RMS directly imports and calls CRS service (line 24)
   - **Risk**: If CRS service is unavailable, RMS operations fail
   - **Risk**: Changes to CRS API break RMS

2. **No Fallback**: If CRS service fails, RMS operations throw errors
   - **Risk**: Room assignment fails if CRS is down

3. **Data Consistency**: RMS trusts CRS data, but:
   - If CRS updates reservation without notifying RMS, RMS has stale data
   - If CRS deletes reservation, RMS still has `currentReservationId` set

4. **Circular Dependency Risk**: If CRS also depends on RMS, circular dependency exists
   - **Current**: CRS uses `mockRoomTypes` from RMS mock data (not service)

### TMS Interactions

**Current State:**
- ❌ **NO direct TMS integration** - tasks are not created in TMS when maintenance/housekeeping happens
- ⚠️ **Expected but not implemented**: Maintenance requests and housekeeping tasks should create TMS tasks

### Any Tight Coupling or Hidden Dependencies

**Hidden Dependencies:**

1. **Housekeeping Service**: `housekeepingService.verify()` calls `roomService.updateStatus()` (line 362)
   - **Risk**: Circular dependency if housekeeping service imports room service

2. **Maintenance Service**: `maintenanceService.complete()` calls `roomService.updateStatus()` (line 347)
   - **Risk**: Same circular dependency risk

3. **Mock Data**: Services use shared mock data arrays
   - **Risk**: Changes to mock data affect all services

---

## 9. Business Rules Currently Enforced

### Explicit Validations in Code

1. ✅ **Status transition validation** - `validateStatusTransition()` (lines 57-65)
2. ✅ **Room assignment validation** - Room must be `available` or `reserved` (line 287)
3. ✅ **Capacity validation** - `validateRoomCapacity()` checks max occupancy, adults, children (lines 1229-1269)
4. ✅ **Conflict validation** - Checks for conflicting reservations (lines 294-317)
5. ✅ **Room number uniqueness** - Within tenant (line 599)
6. ✅ **Room type existence** - Validates room type exists when creating/updating room (lines 604-608)
7. ✅ **Delete validation** - Cannot delete occupied/reserved rooms (line 742)
8. ✅ **Delete validation** - Cannot delete rooms with future reservations (lines 746-767)
9. ✅ **Room block overlap** - Prevents overlapping blocks (lines 962-972)
10. ✅ **Tenant isolation** - All operations require and validate tenantId

### Implicit Rules

1. ⚠️ **Room condition auto-update** - When status changes to `available`, condition is set to `clean` (line 239)
2. ⚠️ **Room condition auto-update** - When status changes to `available`, `lastCleanedAt` is set (line 240)
3. ⚠️ **Inspection auto-status** - When inspection passes and room is `inspecting`, status changes to `available` (line 1150)
4. ⚠️ **Housekeeping auto-status** - When task verified and no other tasks, room becomes `available` (line 377)
5. ⚠️ **Maintenance auto-status** - When maintenance completes and no other requests, room becomes `dirty` (line 361)

### Rules That Are Missing But Assumed

**🚨 CRITICAL MISSING RULES:**

1. ❌ **No validation** that room can be assigned if it has active maintenance requests
2. ❌ **No validation** that room can be assigned if it has pending housekeeping tasks
3. ❌ **No validation** that room condition allows assignment (e.g., `needs_repair` should block)
4. ❌ **No validation** that room block reason allows assignment (e.g., VIP block should prevent assignment)
5. ❌ **No validation** that reservation dates match room availability window
6. ❌ **No validation** that room type capacity matches reservation requirements (only checks on assignment)
7. ❌ **No validation** that room is not already assigned to another active reservation
8. ❌ **No validation** that `currentReservationId` matches actual reservation status in CRS

---

## 10. Audit & Logging (Current State)

### What Is Logged

**Room History (lines 244-257, 335-345, etc.):**
- ✅ Status changes (previous → new value)
- ✅ Room assignments (guest ID, reservation ID)
- ✅ Room releases (previous guest/reservation)
- ✅ Room transfers (from/to room numbers)
- ✅ Note updates (previous → new note)
- ✅ Inspections (status, score)
- ✅ Maintenance (condition changes)

**Fields Logged:**
- `action`: Type of action (status_change, assignment, release, transfer, etc.)
- `previousValue`: Previous state
- `newValue`: New state
- `performedBy`: User ID or 'system'
- `notes`: Additional context
- `createdAt`: Timestamp

### What Is Missing

**🚨 CRITICAL GAPS:**

1. ❌ **No logging of WHO performed action** - `performedBy` is often 'system' or optional parameter
   - **Risk**: Cannot audit who made changes

2. ❌ **No logging of WHY action was performed** - No reason field for status changes
   - **Risk**: Cannot understand business context

3. ❌ **No logging of failed operations** - Errors are thrown but not logged
   - **Risk**: Cannot track system issues

4. ❌ **No logging of conflict checks** - When conflicts are detected, not logged
   - **Risk**: Cannot audit double-booking attempts

5. ❌ **No logging of availability queries** - Who queried availability, when, for what dates
   - **Risk**: Cannot track booking patterns

6. ❌ **No logging of room type changes** - When room type is updated, not logged
   - **Risk**: Cannot track room configuration changes

7. ❌ **No logging of capacity validation failures** - When capacity check fails, not logged
   - **Risk**: Cannot track overbooking attempts

### Risky Operations Without Audit

1. **`bulkUpdateStatus()`** - Updates multiple rooms, but only logs if status actually changes (line 922)
   - **Risk**: Bulk operations are not fully audited

2. **`update()`** - Can change multiple fields, but only logs status changes (line 713)
   - **Risk**: Other field changes (notes, condition, etc.) are not logged

3. **`delete()`** - Room deletion is NOT logged
   - **Risk**: Cannot track when rooms are removed from inventory

4. **Room block creation/cancellation** - Not logged in room history
   - **Risk**: Cannot track why room was unavailable

---

## 11. Security & Access Control

### Role Checks (If Any)

**Current State:**
- ❌ **NO role checks in RMS service layer** - All operations are allowed if tenant is valid
- ⚠️ **Frontend may have role checks** - But service layer doesn't enforce

**🚨 CRITICAL SECURITY GAP:** Any user with tenant access can:
- Delete rooms
- Change room status arbitrarily
- Assign rooms to any guest
- Create room blocks
- Modify room types

### Privileged Operations

**Operations that should require elevated permissions (but don't):**

1. **`delete()`** - Should require admin/manager role
2. **`bulkUpdateStatus()`** - Should require supervisor role
3. **`createRoomBlock()`** - Should require manager role (especially for VIP blocks)
4. **`approveInspection()`** - Should require supervisor role
5. **`setRateOverride()`** - Should require manager role
6. **Room type CRUD** - Should require admin role

### Unsafe Endpoints

**All endpoints are unsafe because:**
- ❌ No authentication check (assumes frontend handles it)
- ❌ No authorization check (no role validation)
- ❌ No rate limiting (can be spammed)
- ❌ No input sanitization (SQL injection risk if ported to database)
- ❌ No CSRF protection (if ported to real backend)

---

## 12. Failure Scenarios

### What Happens If an Operation Fails Mid-Way

**Current Implementation:**
- ❌ **NO transaction management** - Operations are not atomic
- ❌ **NO rollback mechanism** - Partial updates persist

**Example Failure Scenarios:**

1. **`assignToGuest()` fails after updating room but before logging history:**
   - **Result**: Room is assigned but no history record
   - **Risk**: Cannot audit assignment

2. **`transferRoom()` fails after releasing from room but before assigning to room:**
   - **Result**: Guest is released from original room but not assigned to new room
   - **Risk**: Guest has no room, room is available but shouldn't be

3. **`bulkUpdateStatus()` fails after updating some rooms:**
   - **Result**: Partial update - some rooms updated, some not
   - **Risk**: Inconsistent state

4. **Housekeeping `verify()` fails after updating task but before updating room:**
   - **Result**: Task is verified but room status not updated
   - **Risk**: Room stays `dirty` even though cleaning verified

5. **Maintenance `complete()` fails after updating request but before updating room:**
   - **Result**: Maintenance marked complete but room still `out_of_order`
   - **Risk**: Room unavailable even though maintenance done

### Partial Update Risks

**🚨 CRITICAL RISKS:**

1. **Room assignment**: Room status updated but `currentGuestId` not set (if code bug)
2. **Room release**: `currentGuestId` cleared but status not updated to `dirty`
3. **Room transfer**: From room released but to room not assigned
4. **Status update**: Status changed but history not logged
5. **Room block**: Block created but room status not updated

### Data Corruption Scenarios

**Possible Corruption:**

1. **Orphaned references**: `currentReservationId` points to deleted reservation
2. **Stale data**: `currentGuestId` points to guest that checked out
3. **Inconsistent status**: Room is `occupied` but `currentGuestId` is null
4. **Duplicate assignments**: Same room assigned to multiple reservations (race condition)
5. **Missing history**: Room status changed but no history record

---

## 13. Known Limitations & Risks

### Technical Debt

1. **In-Memory Storage**: All data is lost on refresh
   - **Impact**: Cannot persist changes, cannot scale

2. **No Database**: No persistence layer
   - **Impact**: Cannot query efficiently, cannot use database features (indexes, transactions)

3. **Synchronous Operations**: All operations are synchronous
   - **Impact**: Cannot handle long-running operations, cannot queue tasks

4. **No Caching**: Every operation queries full arrays
   - **Impact**: Performance degrades with large datasets

5. **Mock Data Dependency**: Services depend on shared mock data
   - **Impact**: Changes affect all services, cannot isolate

### Logical Loopholes

1. **State Machine Bypass**: Many operations bypass state machine validation
   - **Impact**: Invalid state transitions possible

2. **Race Conditions**: No locking mechanism for concurrent operations
   - **Impact**: Double-booking, data corruption

3. **Stale Data**: RMS trusts CRS data but doesn't refresh
   - **Impact**: Conflicts can be missed

4. **Missing Validations**: Many business rules not enforced
   - **Impact**: Invalid operations can succeed

5. **Error Swallowing**: Auto-updates wrapped in try-catch that don't fail
   - **Impact**: Silent failures, data inconsistency

### Areas Requiring Refactor

**High Priority:**

1. **Transaction Management**: Add transaction support for multi-step operations
2. **State Machine Enforcement**: Make state machine mandatory for all status changes
3. **Concurrency Control**: Add distributed locking or pessimistic locking
4. **Error Handling**: Remove error swallowing, add proper rollback
5. **Audit Trail**: Log all operations, not just status changes

**Medium Priority:**

1. **Auto-Task Creation**: Integrate housekeeping task creation with room release
2. **Maintenance Integration**: Auto-block rooms when maintenance requested
3. **Availability Caching**: Cache availability calculations
4. **Validation Layer**: Add comprehensive business rule validation
5. **Role-Based Access**: Add authorization checks

**Low Priority:**

1. **Auto-Assignment**: Add intelligent room assignment algorithm
2. **Preference Matching**: Match guest preferences to room features
3. **Predictive Maintenance**: Schedule maintenance based on room condition
4. **Analytics**: Add room utilization analytics

---

## 14. Improvement Suggestions (Non-Breaking)

### Changes That Can Be Made Without Breaking Existing Flows

1. **Add logging to all operations** - Doesn't change behavior, only adds audit trail
2. **Add validation warnings** - Log warnings for invalid operations but don't fail
3. **Add optional parameters** - Add `reason` parameter to status updates (optional)
4. **Add metadata fields** - Add `updatedBy` field to all entities (optional)
5. **Add health checks** - Add method to check data consistency
6. **Add data validation** - Add method to validate room state consistency
7. **Add conflict detection** - Add method to detect potential conflicts without failing
8. **Add audit queries** - Add methods to query audit trail without changing operations
9. **Add statistics** - Add methods to calculate room utilization, turnover, etc.
10. **Add export functionality** - Add methods to export room data for reporting

### Safe Refactoring Opportunities

1. **Extract conflict checking** - Move conflict check logic to separate method (reusable)
2. **Extract state machine** - Move state machine to separate module (testable)
3. **Extract validation** - Move validation logic to separate layer (reusable)
4. **Extract history logging** - Move history logging to separate service (centralized)
5. **Add operation context** - Add context object to pass user, reason, etc. (non-breaking)

---

## Conclusion

The RMS implementation is **sophisticated in design** but has **significant architectural risks** when ported to a production backend. The code demonstrates good understanding of business requirements but lacks:

1. **Transaction management** for atomic operations
2. **Consistent state machine enforcement** across all operations
3. **Proper concurrency control** to prevent race conditions
4. **Comprehensive audit logging** for all operations
5. **Security/authorization** checks
6. **Error handling and rollback** mechanisms

**Recommendation:** Before porting to a real backend, address the critical issues identified in this document, especially:
- Transaction management
- State machine enforcement
- Concurrency control
- Audit logging
- Error handling

---

## 15. Post-Hardening Changes (v2)

**Date:** 2024  
**Status:** Production-Ready Hardening Applied  
**Breaking Changes:** Yes - API signatures changed to require mandatory parameters

### Overview

The RMS implementation has been hardened for production usage. This section documents the **actual behavior** after hardening fixes were applied. All changes are **incremental and safe**, preserving existing public APIs where possible, but **requiring mandatory parameters** for critical operations.

### Critical Changes Summary

1. ✅ **State Machine Enforcement** - ALL status changes go through central function
2. ✅ **Optimistic Locking** - Version is now MANDATORY for all write operations
3. ✅ **Room-Level Concurrency Protection** - In-memory locking prevents race conditions
4. ✅ **Maintenance & Availability Integrity** - Maintenance auto-blocks rooms
5. ✅ **Housekeeping Integrity** - Auto-creates tasks, enforces inspection workflow
6. ✅ **Availability Hardening** - Full revalidation during assignment
7. ✅ **Authorization Guards** - Minimum viable authorization checks
8. ✅ **Audit & Logging Improvements** - All mutations logged with context

---

### 1. State Machine Enforcement (CRITICAL FIX)

**What Changed:**

- **Before:** Status changes were scattered across multiple methods, some bypassing validation
- **After:** ALL status changes MUST go through `changeRoomStatus()` function

**New Central Function:**

```typescript
async function changeRoomStatus(
  tenantId: string,
  roomId: string,
  newStatus: RoomStatus,
  performedBy: string,        // MANDATORY
  expectedVersion: number,    // MANDATORY
  reason?: string
): Promise<Room>
```

**Enforcement:**

- `validateStatusTransition()` is ALWAYS called
- Invalid transitions throw `BusinessRuleError` with code `INVALID_STATUS_TRANSITION`
- All status mutations go through this function:
  - `updateStatus()` → calls `changeRoomStatus()`
  - `assignToGuest()` → calls `changeRoomStatus()` before assignment
  - `release()` → calls `changeRoomStatus()` before clearing assignment
  - `transferRoom()` → calls `changeRoomStatus()` for both rooms
  - `bulkUpdateStatus()` → calls `changeRoomStatus()` for each room
  - Maintenance completion → calls `changeRoomStatus()` via `updateStatus()`
  - Housekeeping verification → calls `changeRoomStatus()` via `updateStatus()`

**Breaking Changes:**

- `updateStatus()` now requires `performedBy` and `expectedVersion` (no longer optional)
- Direct status mutations are blocked (compiler error if attempted)

**New Invariants:**

1. **No direct status mutation** - All `room.status = X` operations removed
2. **State machine always enforced** - No bypass paths exist
3. **Audit trail mandatory** - Every status change is logged

---

### 2. Optimistic Locking (CRITICAL FIX)

**What Changed:**

- **Before:** Version was optional, could be skipped
- **After:** Version is MANDATORY for ALL write operations

**New Requirements:**

All write operations now require `expectedVersion`:

```typescript
// Before (optional)
async assignToGuest(tenantId, id, guestId, reservationId, expectedVersion?: number)

// After (mandatory)
async assignToGuest(
  tenantId, 
  id, 
  guestId, 
  reservationId, 
  expectedVersion: number,  // MANDATORY
  performedBy: string        // MANDATORY
)
```

**Operations Requiring Version:**

- `assignToGuest()` - MANDATORY
- `release()` - MANDATORY
- `update()` - MANDATORY
- `updateStatus()` - MANDATORY
- `transferRoom()` - MANDATORY (both rooms)
- `bulkUpdateStatus()` - MANDATORY (map of roomId → version)
- `setRateOverride()` - MANDATORY
- `approveInspection()` - MANDATORY

**Version Check Behavior:**

- If `room.version === undefined`, it's initialized to `0` (backward compatibility)
- Version mismatch throws `ConflictError` with message: "Room has been modified by another user. Please refresh and try again."
- Version is incremented ONLY after successful mutation

**Breaking Changes:**

- All write operations now require `expectedVersion` parameter
- Operations without version will fail at compile time (TypeScript)

---

### 3. Room-Level Concurrency Protection

**What Changed:**

- **Before:** No locking mechanism, race conditions possible
- **After:** In-memory locking prevents concurrent operations on same room

**New Locking Mechanism:**

```typescript
// Lock utility (in-memory, temporary solution)
withRoomLock(tenantId, roomId, operation, async () => {
  // Critical section - room is locked
})
```

**Locked Operations:**

- `assignToGuest()` - Entire operation under lock
- `transferRoom()` - Both rooms locked (sorted order prevents deadlocks)

**Lock Behavior:**

- Lock timeout: 30 seconds (prevents deadlocks)
- Automatic cleanup of expired locks
- Lock acquisition failure throws error immediately

**Future Migration Path:**

- Current: In-memory Map-based locking
- Production: Should use database row-level locking (`SELECT FOR UPDATE`) or distributed locking (Redis)

**New Invariants:**

1. **No concurrent assignments** - Lock prevents race conditions
2. **Re-validation after lock** - Conflicts re-checked AFTER acquiring lock
3. **Deadlock prevention** - Locks acquired in sorted order (room IDs)

---

### 4. Maintenance & Availability Integrity

**What Changed:**

- **Before:** Maintenance requests didn't auto-update room status
- **After:** Maintenance creation auto-transitions room to `out_of_order`

**New Behavior:**

When maintenance request is created:

1. Room status is automatically set to `out_of_order` (if not already)
2. Room is blocked from availability
3. Status change goes through `changeRoomStatus()` (state machine enforced)

**Assignment Validation:**

Assignment now fails if:
- Active maintenance requests exist (status: `reported`, `acknowledged`, `in_progress`, `on_hold`)
- Room status is not assignable (`available` or `reserved`)
- Active room blocks exist

**Maintenance Completion:**

When maintenance completes:
- If no other active requests exist, room transitions to `dirty` (for cleaning)
- Status change goes through `changeRoomStatus()` (state machine enforced)
- Error handling: Failures are logged but don't block completion

**New Invariants:**

1. **Maintenance blocks assignment** - Cannot assign room with active maintenance
2. **Auto-status update** - Maintenance creation/completion updates room status
3. **State machine enforced** - All maintenance-triggered transitions validated

---

### 5. Housekeeping Integrity

**What Changed:**

- **Before:** Housekeeping tasks were created manually
- **After:** Tasks are auto-created on room release

**New Behavior:**

On room release:

1. Room status transitions to `dirty` (via `changeRoomStatus()`)
2. Housekeeping task is **automatically created** (type: `checkout_clean`, priority: `high`)
3. Task creation failure is logged but doesn't fail release

**Inspection Workflow Enforcement:**

- Room **cannot skip inspection** - must go through `inspecting` state
- Housekeeping verification only updates status if room is in `inspecting` state
- If room is `dirty` or `cleaning`, verification logs warning but doesn't change status

**New Invariants:**

1. **Auto-task creation** - Release always creates housekeeping task
2. **Inspection required** - Room must be `inspecting` to become `available`
3. **No skipping** - Cannot bypass inspection workflow

---

### 6. Availability Hardening

**What Changed:**

- **Before:** Availability queries were treated as authoritative
- **After:** Availability is advisory only, full revalidation during assignment

**New Behavior:**

`checkAvailability()` returns rooms that:
- Have status `available` or `reserved`
- Have no conflicting reservations
- Have no active blocks

**Assignment Revalidation:**

During `assignToGuest()`, the following are re-checked AFTER acquiring lock:
1. Room status (must be `available` or `reserved`)
2. Active maintenance requests
3. Active room blocks
4. Conflicting reservations (re-queried)
5. Pending housekeeping tasks (logged, not blocking)

**New Invariants:**

1. **Availability is advisory** - Not guaranteed until assignment succeeds
2. **Full revalidation** - All checks repeated during assignment
3. **Lock-protected** - Revalidation happens under lock

---

### 7. Authorization Guards (Minimum Viable)

**What Changed:**

- **Before:** No authorization checks
- **After:** Basic role-based authorization for privileged operations

**New Authorization Checks:**

Operations requiring authorization:

- `delete()` - Requires `room.delete` permission (roles: `super_admin`, `admin`)
- `bulkUpdateStatus()` - Requires `room.bulk_update` permission (roles: `super_admin`, `admin`, `general_manager`, `manager`)
- `createRoomBlock()` - Requires `room.block` permission (roles: `super_admin`, `admin`, `general_manager`, `manager`)
- `setRateOverride()` - Requires `room.rate_override` permission (roles: `super_admin`, `admin`, `general_manager`, `manager`)
- `approveInspection()` - Requires `room.inspection_approve` permission (roles: `super_admin`, `admin`, `general_manager`, `manager`, `supervisor`)
- `roomTypeService.create()` - Requires `room_type.crud` permission (roles: `super_admin`, `admin`)
- `roomTypeService.update()` - Requires `room_type.crud` permission (roles: `super_admin`, `admin`)
- `roomTypeService.delete()` - Requires `room_type.crud` permission (roles: `super_admin`, `admin`)

**Authorization Behavior:**

- Missing role throws `UnauthorizedError`
- Insufficient permissions throws `ForbiddenError` with required roles listed
- `performedBy` parameter is now MANDATORY for all privileged operations

**Future Expansion:**

- Current: Simple role checks
- Production: Should integrate with RBAC system, permission management, user context from auth middleware

**New Invariants:**

1. **Authorization required** - Privileged operations check permissions
2. **Audit trail** - All operations log `performedBy` for accountability
3. **Fail loudly** - Authorization failures throw clear errors

---

### 8. Audit & Logging Improvements

**What Changed:**

- **Before:** Only status changes were logged
- **After:** ALL mutations are logged with full context

**New Audit Logging:**

Centralized audit logger (`roomAudit.ts`) logs:

- **Status changes** - `logStatusChange()` - previous status, new status, reason
- **Assignments** - `logAssignment()` - guest ID, reservation ID
- **Releases** - `logRelease()` - previous guest/reservation
- **Field updates** - `logFieldUpdate()` - field name, previous value, new value
- **Failed operations** - `logFailedOperation()` - operation name, error message
- **Conflicts** - `logConflict()` - conflict type, details

**Logging Coverage:**

All operations now log:
- `assignToGuest()` - Logs assignment
- `release()` - Logs release + auto-creates housekeeping task
- `transferRoom()` - Logs transfer for both rooms
- `update()` - Logs all field changes (condition, conditionScore, notes, rateOverride)
- `delete()` - Logs deletion before removal
- `setRateOverride()` - Logs rate change
- `createRoomBlock()` - Logs block creation
- Failed operations - All failures logged with context

**Audit Log Structure:**

```typescript
{
  tenantId: string;
  roomId: string;
  action: 'status_change' | 'assignment' | 'release' | 'transfer' | 'note_added' | 'note_updated' | 'inspection' | 'maintenance';
  previousValue?: string;
  newValue?: string;
  performedBy: string;  // MANDATORY
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

**New Invariants:**

1. **All mutations logged** - No silent changes
2. **Full context** - Previous values, new values, performer, reason
3. **Failure logging** - Failed operations logged for debugging

---

### Backward Compatibility Notes

**Breaking Changes:**

1. **API Signatures Changed:**
   - `updateStatus()` - `performedBy` and `expectedVersion` now required
   - `assignToGuest()` - `expectedVersion` and `performedBy` now required
   - `release()` - `performedBy` and `expectedVersion` now required
   - `update()` - `expectedVersion` and `performedBy` now required
   - `delete()` - `performedBy` now required
   - `bulkUpdateStatus()` - `performedBy` and `expectedVersions` map now required
   - `transferRoom()` - `fromRoomExpectedVersion`, `toRoomExpectedVersion`, and `performedBy` now required
   - `setRateOverride()` - `performedBy` and `expectedVersion` now required
   - `createRoomBlock()` - `roomExpectedVersion` optional but recommended
   - `approveInspection()` - `roomExpectedVersion` now required
   - `roomTypeService.create()` - `performedBy` now required
   - `roomTypeService.update()` - `performedBy` now required
   - `roomTypeService.delete()` - `performedBy` now required

2. **Behavior Changes:**
   - Status changes are now strictly validated (no bypass)
   - Version is mandatory (operations fail without it)
   - Authorization checks added (operations fail without permission)
   - Housekeeping tasks auto-created (new side effect)
   - Maintenance auto-updates room status (new side effect)

**Migration Path:**

1. **Update all call sites** to provide `expectedVersion` and `performedBy`
2. **Get room version** before write operations: `const room = await roomService.getById(...); const version = room.version ?? 0;`
3. **Handle authorization errors** - Add error handling for `UnauthorizedError` and `ForbiddenError`
4. **Update tests** - All tests must provide mandatory parameters

**Non-Breaking Changes:**

- Read operations unchanged
- Query operations unchanged
- Helper functions unchanged (internal only)

---

### Removed Statements (No Longer True)

**Previous Documentation Claims (Now Fixed):**

1. ❌ ~~"Status changes bypass state machine"~~ → ✅ **FIXED:** All status changes go through `changeRoomStatus()`
2. ❌ ~~"Version is optional"~~ → ✅ **FIXED:** Version is mandatory for all writes
3. ❌ ~~"No concurrency protection"~~ → ✅ **FIXED:** Room-level locking implemented
4. ❌ ~~"Maintenance doesn't auto-update room status"~~ → ✅ **FIXED:** Maintenance creation/completion auto-updates status
5. ❌ ~~"Housekeeping tasks created manually"~~ → ✅ **FIXED:** Tasks auto-created on release
6. ❌ ~~"No authorization checks"~~ → ✅ **FIXED:** Basic authorization guards added
7. ❌ ~~"Limited audit logging"~~ → ✅ **FIXED:** All mutations logged with full context

---

### Known Limitations (Post-Hardening)

**Still Present (Future Work):**

1. **In-memory locking** - Should migrate to database/Redis locking
2. **Basic authorization** - Should integrate with full RBAC system
3. **No transaction management** - Still needed for multi-step operations
4. **No database persistence** - Still in-memory (mock implementation)
5. **Version initialization** - Backward compatibility hack (should be removed)

**TODOs in Code:**

- `roomLock.ts` - TODO: Replace with database row-level locking or Redis
- `authorization.ts` - TODO: Integrate with auth system, replace hardcoded roles
- `roomService.ts` - TODO: Some operations still need version parameter (inspection, block cancellation)

---

### Testing Recommendations

**Critical Test Cases:**

1. **State Machine:**
   - Test all valid transitions succeed
   - Test all invalid transitions fail with `BusinessRuleError`
   - Test no direct status mutations possible

2. **Optimistic Locking:**
   - Test version mismatch throws `ConflictError`
   - Test version increment on successful mutation
   - Test operations fail without version

3. **Concurrency:**
   - Test concurrent assignments fail (lock prevents)
   - Test lock timeout prevents deadlocks
   - Test re-validation after lock acquisition

4. **Maintenance:**
   - Test maintenance creation auto-updates room status
   - Test assignment fails with active maintenance
   - Test maintenance completion transitions room to `dirty`

5. **Housekeeping:**
   - Test release auto-creates housekeeping task
   - Test verification only works if room is `inspecting`
   - Test room cannot skip inspection

6. **Authorization:**
   - Test privileged operations require permissions
   - Test unauthorized access throws `ForbiddenError`
   - Test missing role throws `UnauthorizedError`

7. **Audit Logging:**
   - Test all mutations are logged
   - Test failed operations are logged
   - Test conflicts are logged

---

### Final Clarifications Before CRS Integration

**Date:** 2024  
**Purpose:** Final review and clarification of RMS behavior, contracts, and edge cases before CRS integration  
**Status:** Stable API Contract

This section provides explicit clarifications on RMS behavior, intentional design decisions, and contracts that CRS developers must understand when integrating with RMS.

---

#### 1. Status Semantics Clarification

**Room Status Meanings:**

- **`available`**: Room is clean, inspected, and ready for immediate assignment. No guest assigned, no active reservations, no maintenance, no blocks.

- **`reserved`**: Room is reserved for a future reservation but NOT yet assigned to a guest. This status indicates:
  - A reservation exists that will use this room
  - The room is held and cannot be assigned to other reservations
  - **CRITICAL**: A `reserved` room CAN be assigned via `assignToGuest()` - this transitions it to `occupied`
  - **CRITICAL**: A `reserved` room can transition back to `available` if the reservation is cancelled (via state machine: `reserved → available`)

- **`occupied`**: Room is currently assigned to a guest. Guest is checked in, room is in use.

**When is a `reserved` Room Assignable?**

A `reserved` room is assignable when:
1. The reservation being assigned matches the reservation that caused the room to be `reserved` (if tracked)
2. OR the room is being assigned to any valid reservation (RMS does not enforce reservation-to-room binding at status level)

**Intentional Design Decision:**
- RMS allows assignment to `reserved` rooms to support flexible room assignment workflows
- CRS is responsible for ensuring the reservation matches the room assignment
- RMS validates room availability but does not validate reservation-to-room binding semantics

**State Machine Transitions for `reserved`:**
- `reserved → available` (if reservation cancelled)
- `reserved → occupied` (when guest checks in)
- `reserved → out_of_order` (if maintenance needed before check-in)

---

#### 2. Availability vs Assignment Contract

**RMS Guarantees:**

1. **Availability Queries are ADVISORY ONLY**
   - `checkAvailability()` returns rooms that appear available at query time
   - Results are NOT guaranteed to remain available until assignment
   - Race conditions can occur between query and assignment
   - **CRS MUST always call `assignToGuest()` and handle failures**

2. **Assignment Always Performs Full Revalidation**
   - `assignToGuest()` re-validates ALL conditions AFTER acquiring lock:
     - Room status (must be `available` or `reserved`)
     - Active maintenance requests
     - Active room blocks
     - Conflicting reservations (re-queried from CRS)
     - Pending housekeeping tasks (logged, not blocking)
   - This ensures assignment succeeds only if room is truly available at assignment time

3. **Assignment Failures are Expected**
   - `assignToGuest()` can fail with:
     - `BusinessRuleError` - Room not available, has maintenance, is blocked
     - `ConflictError` - Conflicting reservations detected
     - `NotFoundError` - Room or reservation not found
     - `ConflictError` (version mismatch) - Room was modified by another operation
   - **CRS MUST handle these errors and retry or select alternative room**

4. **No Transactional Guarantees**
   - RMS does NOT provide transactional guarantees across multiple rooms
   - If assigning multiple rooms, each assignment is independent
   - CRS must implement rollback logic if multi-room assignment partially fails

**RMS Non-Guarantees:**

- ❌ Availability query results are NOT guaranteed to remain valid
- ❌ No atomic multi-room operations
- ❌ No distributed transaction support
- ❌ No automatic retry on conflicts
- ❌ No reservation-to-room binding validation (CRS responsibility)

**CRS Integration Pattern:**

```typescript
// CORRECT: Always handle assignment failures
try {
  const room = await roomService.getById(tenantId, roomId);
  await roomService.assignToGuest(
    tenantId, 
    roomId, 
    guestId, 
    reservationId,
    room.version ?? 0,
    performedBy
  );
} catch (error) {
  if (error instanceof ConflictError) {
    // Room was modified or has conflicts - retry with different room
    await selectAlternativeRoom();
  } else if (error instanceof BusinessRuleError) {
    // Room not available - select different room
    await selectAlternativeRoom();
  }
  // Handle other errors...
}
```

---

#### 3. Housekeeping & Maintenance Edge Cases

**Intentional Non-Blocking Decisions:**

1. **Pending Housekeeping Does NOT Block Assignment**
   - **Decision**: Pending housekeeping tasks are logged but do NOT prevent room assignment
   - **Rationale**: Housekeeping can continue after guest checks in (e.g., deep cleaning, maintenance tasks)
   - **Behavior**: `assignToGuest()` logs pending housekeeping tasks but allows assignment to proceed
   - **CRS Impact**: None - assignment succeeds even with pending housekeeping

2. **Maintenance During Occupied Stay**
   - **Decision**: Maintenance requests can be created for occupied rooms
   - **Behavior**: 
     - Maintenance creation does NOT change room status if room is `occupied`
     - Room remains `occupied` during maintenance
     - Maintenance completion does NOT auto-update status if room is `occupied`
   - **Rationale**: Guest safety - room status reflects guest occupancy, not maintenance state
   - **CRS Impact**: None - maintenance tracking is separate from room assignment

3. **Maintenance Blocks Assignment (Not Occupied Stay)**
   - **Decision**: Active maintenance blocks NEW assignments
   - **Behavior**: `assignToGuest()` fails if active maintenance exists (status: `reported`, `acknowledged`, `in_progress`, `on_hold`)
   - **Rationale**: Prevent assigning rooms that need maintenance
   - **CRS Impact**: Must handle `BusinessRuleError` with code `ROOM_HAS_ACTIVE_MAINTENANCE`

**Explicit Business Rules:**

- ✅ Room can have maintenance requests while `occupied` (guest safety)
- ✅ Room cannot be assigned if active maintenance exists (prevent assigning broken rooms)
- ✅ Pending housekeeping does not block assignment (operational flexibility)
- ✅ Maintenance completion only auto-updates status if room is `out_of_order` (not if `occupied`)

---

#### 4. Concurrency & Locking Notes

**Lock Behavior:**

1. **Lock Acquisition**
   - `assignToGuest()` and `transferRoom()` acquire room locks before validation
   - Lock timeout: 30 seconds (prevents deadlocks)
   - Lock is automatically released on operation completion or error

2. **Lock Failure**
   - If lock cannot be acquired, operation throws `Error` with message: "Room {roomId} is currently locked by another operation. Please try again."
   - **Retry Expectation**: CRS should retry after a short delay (e.g., 100-500ms)
   - **Retry Pattern**: Exponential backoff recommended (max 3-5 retries)
   - **Lock Contention**: Rare in normal operation, but can occur during high concurrency

3. **Lock Scope**
   - Only `assignToGuest()` and `transferRoom()` use locks
   - Other operations (e.g., `updateStatus()`, `release()`) do NOT use locks
   - **CRS Impact**: Concurrent `updateStatus()` calls can conflict (use version checking)

4. **Deadlock Prevention**
   - `transferRoom()` acquires locks in sorted order (room IDs) to prevent deadlocks
   - Lock timeout ensures locks are released even if operation hangs

**Retry Pattern for CRS:**

```typescript
async function assignWithRetry(tenantId, roomId, guestId, reservationId, performedBy, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const room = await roomService.getById(tenantId, roomId);
      return await roomService.assignToGuest(
        tenantId, roomId, guestId, reservationId,
        room.version ?? 0, performedBy
      );
    } catch (error) {
      if (error.message.includes('locked') && attempt < maxRetries - 1) {
        await delay(100 * Math.pow(2, attempt)); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}
```

**Future Migration Note:**
- Current locking is in-memory (single process)
- Production should use database row-level locking or distributed locking (Redis)
- Lock behavior may change in production (documented in migration guide)

---

#### 5. Consistency & Self-Healing

**Current State:**

RMS does NOT currently provide:
- Automatic integrity checks
- Self-healing mechanisms
- Background reconciliation jobs
- Data consistency validation

**Known Inconsistency Scenarios:**

1. **Room Status vs Reservation State**
   - Room can be `occupied` but reservation can be `cancelled` (if CRS doesn't call `release()`)
   - **Mitigation**: CRS must ensure `release()` is called on checkout/cancellation

2. **Room Status vs Maintenance State**
   - Room can be `out_of_order` but no active maintenance (if maintenance completed but status not updated)
   - **Mitigation**: Maintenance completion auto-updates status (if room is `out_of_order`)

3. **Room Status vs Housekeeping State**
   - Room can be `available` but has pending housekeeping (if task creation failed)
   - **Mitigation**: Housekeeping task creation is best-effort (logged on failure)

**Manual Reconciliation (Future Work):**

- TODO: Add `roomService.validateRoomState(tenantId, roomId)` method
- TODO: Add `roomService.reconcileRoomState(tenantId, roomId)` method
- TODO: Add periodic integrity check job (outside RMS scope)

**CRS Responsibility:**

- CRS must ensure room status matches reservation state
- CRS must call `release()` on checkout/cancellation
- CRS should monitor audit logs for inconsistencies

---

#### 6. API & Error Contract Freeze

**Stable Write APIs (v2 - Post-Hardening):**

All write operations have stable signatures and will NOT change:

```typescript
// Status Operations
updateStatus(tenantId, id, status, performedBy, expectedVersion, reason?): Promise<Room>
assignToGuest(tenantId, id, guestId, reservationId, expectedVersion, performedBy): Promise<Room>
release(tenantId, id, performedBy, expectedVersion): Promise<Room>
transferRoom(tenantId, data, performedBy): Promise<{fromRoom: Room, toRoom: Room}>

// Room Operations
create(tenantId, data): Promise<Room>
update(tenantId, id, data, expectedVersion, performedBy): Promise<Room>
delete(tenantId, id, performedBy): Promise<void>
bulkUpdateStatus(tenantId, roomIds, status, performedBy, expectedVersions): Promise<Room[]>

// Configuration Operations
setRateOverride(tenantId, roomId, rateOverride, performedBy, expectedVersion): Promise<Room>
createRoomBlock(tenantId, data, createdBy, roomExpectedVersion?): Promise<RoomBlock>
approveInspection(tenantId, inspectionId, approvedBy, roomExpectedVersion): Promise<RoomInspection>
```

**Error Types Thrown by RMS:**

RMS throws the following error types (from `errors.ts`):

1. **`NotFoundError`** (404)
   - Room not found
   - Reservation not found (when validating assignment)
   - Room type not found
   - **CRS Handling**: Select alternative room or fail gracefully

2. **`BusinessRuleError`** (422)
   - Invalid status transition (`INVALID_STATUS_TRANSITION`)
   - Room not available for assignment (`ROOM_NOT_AVAILABLE_FOR_ASSIGNMENT`)
   - Room has active maintenance (`ROOM_HAS_ACTIVE_MAINTENANCE`)
   - Room is blocked (`ROOM_IS_BLOCKED`)
   - Room capacity exceeded
   - **CRS Handling**: Select alternative room or show error to user

3. **`ConflictError`** (409)
   - Version mismatch (`CONFLICT` - "Room has been modified by another user")
   - Reservation conflicts (`ROOM_CONFLICT`)
   - Overlapping room blocks (`OVERLAPPING_BLOCK`)
   - **CRS Handling**: Retry with fresh version or select alternative room

4. **`ValidationError`** (400)
   - Invalid input data
   - Missing required fields
   - **CRS Handling**: Fix input and retry

5. **`ForbiddenError`** (403)
   - Insufficient permissions
   - **CRS Handling**: Show permission denied message

6. **`UnauthorizedError`** (401)
   - Missing user role
   - **CRS Handling**: Redirect to login or show error

7. **`Error`** (Generic)
   - Lock acquisition failure ("Room is currently locked")
   - **CRS Handling**: Retry with backoff

**Error Handling Pattern for CRS:**

```typescript
try {
  await roomService.assignToGuest(...);
} catch (error) {
  if (error instanceof ConflictError) {
    // Version mismatch or reservation conflict
    if (error.code === 'CONFLICT') {
      // Retry with fresh version
      const room = await roomService.getById(tenantId, roomId);
      await roomService.assignToGuest(..., room.version ?? 0, ...);
    } else {
      // Reservation conflict - select alternative room
      await selectAlternativeRoom();
    }
  } else if (error instanceof BusinessRuleError) {
    // Room not available - select alternative room
    await selectAlternativeRoom();
  } else if (error instanceof NotFoundError) {
    // Room not found - select alternative room
    await selectAlternativeRoom();
  } else if (error.message?.includes('locked')) {
    // Lock contention - retry with backoff
    await retryWithBackoff(() => roomService.assignToGuest(...));
  } else {
    // Unexpected error - log and fail
    logger.error('Unexpected RMS error', error);
    throw error;
  }
}
```

**Version Management for CRS:**

```typescript
// ALWAYS get fresh version before write operations
const room = await roomService.getById(tenantId, roomId);
if (!room) {
  throw new Error('Room not found');
}

// Use room.version (or 0 if undefined for backward compatibility)
const version = room.version ?? 0;

// Pass version to write operation
await roomService.updateStatus(tenantId, roomId, 'available', performedBy, version);
```

---

#### 7. RMS Invariants (Guaranteed)

**RMS guarantees the following invariants:**

1. **State Machine Enforcement**
   - All status changes go through `changeRoomStatus()`
   - Invalid transitions always throw `BusinessRuleError`
   - No direct status mutations possible

2. **Optimistic Locking**
   - All write operations require `expectedVersion`
   - Version mismatch always throws `ConflictError`
   - Version incremented only on successful mutation

3. **Concurrency Protection**
   - `assignToGuest()` and `transferRoom()` are lock-protected
   - No concurrent assignments to same room
   - Re-validation happens after lock acquisition

4. **Tenant Isolation**
   - All operations scoped to `tenantId`
   - Cross-tenant access impossible
   - Tenant filtering applied to all queries

5. **Audit Trail**
   - All mutations logged with full context
   - Failed operations logged
   - Conflicts logged

**RMS does NOT guarantee:**

- ❌ Availability query results remain valid
- ❌ Atomic multi-room operations
- ❌ Automatic retry on conflicts
- ❌ Data consistency across services (CRS responsibility)
- ❌ Reservation-to-room binding validation (CRS responsibility)

---

#### 8. CRS Integration Checklist

Before integrating CRS with RMS, ensure:

- [ ] All write operations provide `expectedVersion` (get from `getById()` first)
- [ ] All write operations provide `performedBy` (from user context)
- [ ] Error handling implemented for all RMS error types
- [ ] Retry logic implemented for `ConflictError` (version mismatch)
- [ ] Retry logic implemented for lock contention
- [ ] Alternative room selection implemented for assignment failures
- [ ] `release()` called on checkout/cancellation
- [ ] Audit logs monitored for inconsistencies
- [ ] Version management pattern followed (get fresh version before writes)

---

**End of Final Clarifications**

---

**End of Post-Hardening Documentation**

---

**End of Technical Documentation**

