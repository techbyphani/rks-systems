# BMS – Billing Management System: Technical Documentation (As-Implemented)

**Document Type:** Technical Audit & Risk Review  
**Date:** 2024  
**Reviewer:** Senior Backend Architect  
**Status:** Current Implementation Analysis

---

## 1. Executive Summary

### What BMS Actually Does

BMS manages:
- **Folio creation** (hotel folios with reservations, customer folios without)
- **Charge posting** (room, F&B, spa, laundry, etc. with automatic 18% tax)
- **Payment processing** (cash, cards, UPI, bank transfer, etc.)
- **Charge voiding** (marks charges as voided, adjusts balance)
- **Folio closing** (requires zero balance, transitions to `settled`)
- **Invoice generation** (from closed folios)
- **Payment tracking** (against invoices)

### What BMS Does NOT Do

- ❌ **Refund processing** - Payment has `refundedAmount` fields but no refund method exists
- ❌ **Payment gateway integration** - All payments are mocked as `completed`
- ❌ **Idempotency protection** - No duplicate payment prevention
- ❌ **Authorization checks** - No role-based access control
- ❌ **Version/optimistic locking** - No concurrency protection
- ❌ **Audit logging** - No structured audit trail
- ❌ **Tax configuration** - Hardcoded 18% tax rate
- ❌ **Discount/adjustment processing** - Categories exist but no methods
- ❌ **Split billing** - No folio splitting or merging
- ❌ **Deposit management** - No deposit tracking or application
- ❌ **State machine enforcement** - Folio and invoice status changes not validated

### High-Level Financial Risks

1. **🚨 CRITICAL: No Concurrency Protection**
   - No version field on Folio, Payment, or Invoice
   - Race conditions can cause double charges, lost payments, balance corruption
   - Concurrent checkout attempts can process duplicate payments

2. **🚨 CRITICAL: No Authorization**
   - Any user can post charges, process payments, void charges, close folios
   - No role-based access control
   - Financial fraud risk

3. **🚨 CRITICAL: Hardcoded Employee IDs**
   - All operations use `'EMP003'` as `postedBy`, `processedBy`, `voidedBy`
   - No audit trail of actual user performing actions
   - Compliance violation

4. **🚨 CRITICAL: No Refund Processing**
   - Payment entity has refund fields but no refund method
   - Cannot process refunds through system
   - Manual intervention required

5. **HIGH RISK: Overpayment Not Handled**
   - Can process payment exceeding balance
   - Negative balance allowed (no validation)
   - No credit balance tracking

6. **HIGH RISK: No Idempotency**
   - Duplicate payment attempts can create multiple payments
   - No idempotency keys
   - Double-charge risk

7. **HIGH RISK: Balance Calculation Not Validated**
   - Balance calculated as `totalCharges - totalPayments`
   - No reconciliation check
   - Can become inconsistent if charges/voids/payments happen concurrently

8. **MEDIUM RISK: Tax Hardcoded**
   - 18% tax rate hardcoded in `postCharge()`
   - No tax configuration
   - Cannot handle different tax rates by category or jurisdiction

9. **MEDIUM RISK: No State Machine**
   - Folio status can be set to any value
   - Invoice status can be set to any value
   - Invalid transitions allowed

10. **MEDIUM RISK: Charge Voiding Not Validated**
    - Can void already voided charges (no check)
    - Can void charges on closed/settled folios (no check)
    - No validation of void reason

### Critical Findings

1. **🚨 CRITICAL: No version management**
   - Folio, Payment, Invoice have no `version` field
   - Concurrent modifications can corrupt balances
   - **Location**: `billingService.ts` - all write operations
   - **Impact**: Money loss, double charges, lost payments

2. **🚨 CRITICAL: Hardcoded employee IDs**
   - All operations use `'EMP003'` instead of actual user
   - Lines 205, 240, 311: `postedBy: 'EMP003'`, `voidedBy: 'EMP003'`, `processedBy: 'EMP003'`
   - **Impact**: No audit trail, compliance violation

3. **🚨 CRITICAL: No refund processing**
   - Payment entity has `refundedAmount`, `refundedAt`, `refundReason` fields
   - No `processRefund()` method exists
   - **Impact**: Cannot process refunds, manual workaround required

4. **🚨 CRITICAL: No authorization checks**
   - All methods accept `tenantId` but no `performedBy` or role checks
   - Any authenticated user can perform any financial operation
   - **Impact**: Financial fraud risk, compliance violation

5. **🚨 CRITICAL: Overpayment allowed**
   - `processPayment()` accepts any amount > 0
   - No validation that payment <= balance
   - Negative balance allowed
   - **Impact**: Credit balance not tracked, accounting issues

6. **🚨 CRITICAL: No idempotency**
   - Payment processing has no idempotency keys
   - Duplicate payment attempts create multiple payments
   - **Impact**: Double-charge risk, customer complaints

7. **HIGH RISK: Balance calculation race condition**
   - Balance calculated inline: `totalCharges - totalPayments`
   - No atomic update
   - Concurrent charge + payment can corrupt balance
   - **Impact**: Incorrect balances, revenue loss

8. **HIGH RISK: Charge voiding not validated**
   - `voidCharge()` doesn't check if charge already voided
   - Doesn't check folio status
   - Can void charges on closed/settled folios
   - **Impact**: Balance corruption, audit trail issues

---

## 2. System Overview

### Core Responsibilities

**BMS Owns:**
1. ✅ Folio lifecycle (create, update, close)
2. ✅ Charge posting and voiding
3. ✅ Payment processing and recording
4. ✅ Invoice generation from folios
5. ✅ Balance calculation (`totalCharges - totalPayments`)
6. ✅ Tax calculation (hardcoded 18%)

**Delegated Responsibilities:**
- Guest validation → CRS (BMS trusts CRS has validated guest)
- Reservation validation → CRS (BMS trusts reservationId if provided)
- Room validation → RMS (BMS trusts roomId if provided)

### In-Memory vs Persistent State

**Current State:**
- **In-memory arrays**: `folios`, `payments`, `invoices` (from mock data)
- **No persistence layer** - all data lost on page refresh
- **No database** - all operations are synchronous in-memory mutations

**Source of Truth:**
- Folio balance: Calculated from `charges` and `payments` arrays
- No reconciliation with external systems
- No backup or recovery mechanism

### Dependency Direction

**BMS Dependencies:**
- **CRS** (optional): For guest validation in `createFolio()`
- **No other dependencies**: BMS is standalone

**Who Depends on BMS:**
- **CRS** (via `workflowService`): Creates folios on check-in, posts room charges
- **OMS** (via `workflowService.postCrossModuleCharge()`): Posts F&B charges to folios
- **AS** (Accounting System): Reads folios and payments for financial reporting

**Integration Points:**
- `workflowService.performCheckIn()` → `billingService.createFolio()` + `postCharge()`
- `workflowService.performCheckOut()` → `billingService.closeFolio()`
- `workflowService.postCrossModuleCharge()` → `billingService.postCharge()`

---

## 3. Core Entities (As Implemented)

### 3.1. Folio

**Fields (from `types/index.ts`):**
```typescript
interface Folio {
  id: ID;
  tenantId?: string;  // Optional (risky - should be required)
  folioNumber: string;
  reservationId?: ID;  // Optional (for customer folios)
  guestId: ID;  // Required
  roomId?: ID;  // Optional
  status: FolioStatus;  // 'open' | 'closed' | 'settled' | 'disputed'
  charges: FolioCharge[];
  payments: Payment[];
  totalCharges: number;  // Derived (sum of charges)
  totalPayments: number;  // Derived (sum of payments)
  balance: number;  // Derived (totalCharges - totalPayments)
  currency: string;
  closedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Required vs Optional:**
- ✅ Required: `id`, `folioNumber`, `guestId`, `status`, `charges`, `payments`, `totalCharges`, `totalPayments`, `balance`, `currency`
- ⚠️ Optional: `tenantId` (risky - should be required), `reservationId`, `roomId`, `closedAt`, `notes`

**Derived Fields:**
- `totalCharges`: Sum of `charges[].totalAmount` (not validated)
- `totalPayments`: Sum of `payments[].amount` (not validated)
- `balance`: `totalCharges - totalPayments` (calculated inline, not validated)

**Invariants (NOT ENFORCED):**
- ❌ `balance === totalCharges - totalPayments` (not validated)
- ❌ `totalCharges === sum(charges.filter(c => !c.isVoided).map(c => c.totalAmount))` (not validated)
- ❌ `totalPayments === sum(payments.filter(p => p.status === 'completed').map(p => p.amount))` (not validated)
- ❌ `status === 'settled'` ⇒ `balance === 0` (enforced in `closeFolio()` but can be bypassed)

**Inconsistencies:**
- `tenantId` is optional but used for filtering (risky)
- Balance can become negative (overpayment allowed)
- Balance not recalculated on charge void (manual calculation)

**Risky Fields:**
- `balance`: Not validated against charges/payments
- `totalCharges`: Not validated against charges array
- `totalPayments`: Not validated against payments array
- `status`: No state machine enforcement

---

### 3.2. FolioCharge

**Fields:**
```typescript
interface FolioCharge {
  id: ID;
  folioId: ID;
  category: ChargeCategory;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;  // quantity * unitPrice
  taxAmount: number;  // amount * 0.18 (hardcoded)
  totalAmount: number;  // amount + taxAmount
  referenceType?: string;
  referenceId?: ID;
  chargeDate: string;
  postedBy: ID;  // Hardcoded to 'EMP003'
  isVoided: boolean;
  voidedBy?: ID;  // Hardcoded to 'EMP003'
  voidedAt?: string;
  voidReason?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Required vs Optional:**
- ✅ Required: `id`, `folioId`, `category`, `description`, `quantity`, `unitPrice`, `amount`, `taxAmount`, `totalAmount`, `chargeDate`, `postedBy`, `isVoided`
- ⚠️ Optional: `referenceType`, `referenceId`, `voidedBy`, `voidedAt`, `voidReason`

**Derived Fields:**
- `amount`: `quantity * unitPrice` (calculated in `postCharge()`)
- `taxAmount`: `Math.round(amount * 0.18)` (hardcoded 18% tax)
- `totalAmount`: `amount + taxAmount`

**Invariants (NOT ENFORCED):**
- ❌ `amount === quantity * unitPrice` (not validated after creation)
- ❌ `taxAmount === Math.round(amount * 0.18)` (not validated)
- ❌ `totalAmount === amount + taxAmount` (not validated)
- ❌ `isVoided === false` ⇒ `voidedBy === undefined` (not enforced)
- ❌ `isVoided === true` ⇒ `voidedBy !== undefined` (not enforced)

**Inconsistencies:**
- Tax rate hardcoded (18%) - no configuration
- `postedBy` always `'EMP003'` - not actual user
- `voidedBy` always `'EMP003'` - not actual user

**Risky Fields:**
- `taxAmount`: Hardcoded calculation, no validation
- `totalAmount`: Not validated against amount + taxAmount
- `postedBy`: Hardcoded, no audit trail
- `voidedBy`: Hardcoded, no audit trail

---

### 3.3. Payment

**Fields:**
```typescript
interface Payment {
  id: ID;
  tenantId?: string;  // Optional (risky)
  receiptNumber: string;
  folioId: ID;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;  // 'pending' | 'completed' | 'failed' | 'refunded' | 'partial_refund'
  referenceNumber?: string;
  cardLastFour?: string;
  cardType?: string;
  notes?: string;
  processedBy: ID;  // Hardcoded to 'EMP003'
  processedAt: string;
  refundedAmount?: number;
  refundedAt?: string;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Required vs Optional:**
- ✅ Required: `id`, `receiptNumber`, `folioId`, `amount`, `currency`, `method`, `status`, `processedBy`, `processedAt`
- ⚠️ Optional: `tenantId` (risky), `referenceNumber`, `cardLastFour`, `cardType`, `notes`, `refundedAmount`, `refundedAt`, `refundReason`

**Derived Fields:**
- None (all fields are set directly)

**Invariants (NOT ENFORCED):**
- ❌ `status === 'refunded'` ⇒ `refundedAmount !== undefined` (not enforced)
- ❌ `status === 'partial_refund'` ⇒ `refundedAmount !== undefined && refundedAmount < amount` (not enforced)
- ❌ `refundedAmount !== undefined` ⇒ `refundedAmount <= amount` (not validated)
- ❌ `status === 'completed'` ⇒ payment added to folio `totalPayments` (enforced but not atomic)

**Inconsistencies:**
- `status` always set to `'completed'` in `processPayment()` - no pending/failed states
- `refundedAmount` fields exist but no refund method
- `tenantId` optional but used for filtering

**Risky Fields:**
- `status`: Always `'completed'` - no gateway integration
- `refundedAmount`: Fields exist but no refund processing
- `processedBy`: Hardcoded to `'EMP003'` - no audit trail
- `amount`: No validation against folio balance (overpayment allowed)

---

### 3.4. Invoice

**Fields:**
```typescript
interface Invoice {
  id: ID;
  tenantId?: string;  // Optional (risky)
  invoiceNumber: string;
  folioId: ID;
  guestId: ID;
  status: InvoiceStatus;  // 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;  // totalAmount - paidAmount
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Required vs Optional:**
- ✅ Required: `id`, `invoiceNumber`, `folioId`, `guestId`, `status`, `issueDate`, `dueDate`, `items`, `subtotal`, `taxAmount`, `totalAmount`, `paidAmount`, `balance`, `currency`
- ⚠️ Optional: `tenantId` (risky), `notes`

**Derived Fields:**
- `subtotal`: Sum of `items[].amount` (calculated in `createInvoiceFromFolio()`)
- `taxAmount`: Sum of `items[].taxAmount` (calculated)
- `totalAmount`: `subtotal + taxAmount` (calculated)
- `balance`: `totalAmount - paidAmount` (calculated in `recordInvoicePayment()`)

**Invariants (NOT ENFORCED):**
- ❌ `subtotal === sum(items.map(i => i.amount))` (not validated after creation)
- ❌ `taxAmount === sum(items.map(i => i.taxAmount))` (not validated)
- ❌ `totalAmount === subtotal + taxAmount` (not validated)
- ❌ `balance === totalAmount - paidAmount` (not validated)
- ❌ Status transitions not validated (no state machine)

**Inconsistencies:**
- `tenantId` optional but used for filtering
- Status can be set to any value (no state machine)
- Balance not validated against items

**Risky Fields:**
- `status`: No state machine enforcement
- `balance`: Not validated against items and payments
- `paidAmount`: Can exceed `totalAmount` (no validation)

---

### 3.5. Missing Entities

**Refund Entity:**
- ❌ **MISSING** - No refund entity exists
- Payment has refund fields but no refund processing
- Cannot track refunds separately from payments

**Tax Configuration:**
- ❌ **MISSING** - No tax rate configuration
- Tax hardcoded to 18% in `postCharge()`
- Cannot handle different tax rates

**Discount Entity:**
- ❌ **MISSING** - `ChargeCategory` includes `'discount'` but no discount processing
- Cannot apply discounts to folios

**Adjustment Entity:**
- ❌ **MISSING** - `ChargeCategory` includes `'adjustment'` but no adjustment processing
- Cannot make manual adjustments

---

## 4. Money Lifecycle

### 4.1. Folio Creation

**Flow:**
1. `createFolio(tenantId, guestId, reservationId?, roomId?)` called
2. Validates `guestId` belongs to tenant
3. Generates folio number: `FOL-{timestamp}`
4. Creates folio with:
   - `status: 'open'`
   - `charges: []`
   - `payments: []`
   - `totalCharges: 0`
   - `totalPayments: 0`
   - `balance: 0`

**Issues:**
- ❌ No validation that `reservationId` exists (if provided)
- ❌ No validation that `roomId` exists (if provided)
- ❌ No duplicate folio check for same reservation
- ❌ Folio number generation can collide (timestamp-based)

---

### 4.2. Charge Posting

**Flow:**
1. `postCharge(tenantId, folioId, charge)` called
2. Validates quantity > 0, unitPrice > 0
3. Validates folio exists and status is `'open'` (not `'closed'` or `'settled'`)
4. Calculates: `amount = quantity * unitPrice`
5. Calculates: `taxAmount = Math.round(amount * 0.18)`
6. Calculates: `totalAmount = amount + taxAmount`
7. Creates charge with `postedBy: 'EMP003'` (hardcoded)
8. Pushes charge to `folio.charges[]`
9. Updates: `folio.totalCharges += totalAmount`
10. Recalculates: `folio.balance = totalCharges - totalPayments`

**Issues:**
- ❌ Tax rate hardcoded (18%)
- ❌ `postedBy` hardcoded (not actual user)
- ❌ No version check (concurrent charge posting can corrupt balance)
- ❌ Balance calculation not atomic (race condition)
- ❌ No validation that charge amount matches calculation
- ❌ No idempotency (duplicate charges possible)

---

### 4.3. Charge Voiding

**Flow:**
1. `voidCharge(tenantId, folioId, chargeId, reason)` called
2. Validates folio exists
3. Finds charge in `folio.charges[]`
4. Sets charge `isVoided: true`, `voidedBy: 'EMP003'`, `voidedAt: now()`, `voidReason: reason`
5. Updates: `folio.totalCharges -= charge.totalAmount`
6. Recalculates: `folio.balance = totalCharges - totalPayments`

**Issues:**
- ❌ No check if charge already voided (can void twice)
- ❌ No check if folio is closed/settled (can void on closed folio)
- ❌ `voidedBy` hardcoded (not actual user)
- ❌ No version check (concurrent voiding can corrupt balance)
- ❌ Balance calculation not atomic (race condition)
- ❌ Voiding voided charge subtracts amount again (double subtraction)

---

### 4.4. Payment Processing

**Flow:**
1. `processPayment(tenantId, folioId, payment)` called
2. Validates amount > 0
3. Validates folio exists and status is `'open'` (not `'closed'` or `'settled'`)
4. Creates payment with:
   - `status: 'completed'` (always, no gateway integration)
   - `processedBy: 'EMP003'` (hardcoded)
   - `receiptNumber: RCP-{timestamp}`
5. Pushes payment to `folio.payments[]`
6. Updates: `folio.totalPayments += amount`
7. Recalculates: `folio.balance = totalCharges - totalPayments`
8. Adds payment to global `payments[]` array

**Issues:**
- ❌ No validation that payment <= balance (overpayment allowed)
- ❌ No idempotency (duplicate payments possible)
- ❌ `status` always `'completed'` (no pending/failed states)
- ❌ `processedBy` hardcoded (not actual user)
- ❌ No version check (concurrent payments can corrupt balance)
- ❌ Balance calculation not atomic (race condition)
- ❌ Receipt number generation can collide (timestamp-based)
- ❌ No gateway integration (all payments succeed)

---

### 4.5. Refund Processing

**Status: MISSING**

- Payment entity has `refundedAmount`, `refundedAt`, `refundReason` fields
- No `processRefund()` method exists
- Cannot process refunds through system
- Manual workaround required

---

### 4.6. Balance Calculation

**Current Implementation:**
```typescript
balance = totalCharges - totalPayments
```

**Calculated:**
- After every charge: `balance = totalCharges - totalPayments`
- After every void: `balance = totalCharges - totalPayments`
- After every payment: `balance = totalCharges - totalPayments`

**Issues:**
- ❌ Not validated against actual charges/payments arrays
- ❌ Not atomic (race condition if concurrent operations)
- ❌ Can become negative (overpayment allowed)
- ❌ No reconciliation check
- ❌ If `totalCharges` or `totalPayments` corrupted, balance is wrong

---

### 4.7. Folio Closing

**Flow:**
1. `closeFolio(tenantId, id)` called
2. Validates folio exists
3. If already `'closed'`, returns idempotently
4. If `'settled'`, throws error
5. Validates `balance === 0` (throws if not zero)
6. Sets `status: 'settled'`, `closedAt: now()`

**Issues:**
- ❌ No version check (concurrent close attempts can both succeed)
- ❌ Balance check uses calculated value (not validated)
- ❌ No `performedBy` parameter (no audit trail)
- ❌ Can close folio with negative balance if balance calculation is wrong
- ❌ No validation that all charges are valid (voided charges still counted in balance check)

---

## 5. Billing State Machine

### 5.1. Folio Status

**Defined States:**
- `'open'` - Folio is active, can accept charges and payments
- `'closed'` - Folio is closed (NOT USED - transitions directly to `'settled'`)
- `'settled'` - Folio is closed and settled (terminal state)
- `'disputed'` - Folio is disputed (NOT IMPLEMENTED)

**Actual Transitions (from code):**
- `'open'` → `'settled'` (via `closeFolio()`)
- No other transitions implemented

**Issues:**
- ❌ `'closed'` status defined but never used (always transitions to `'settled'`)
- ❌ `'disputed'` status defined but no method to set it
- ❌ No state machine enforcement (can set status directly via update if method existed)
- ❌ No validation of allowed transitions
- ❌ Cannot reopen settled folio (no method)

**Missing Transitions:**
- ❌ `'settled'` → `'disputed'` (no method)
- ❌ `'disputed'` → `'settled'` (no method)
- ❌ `'settled'` → `'open'` (no reopen method)

---

### 5.2. Invoice Status

**Defined States:**
- `'draft'` - Invoice is draft
- `'issued'` - Invoice is issued
- `'sent'` - Invoice is sent to customer
- `'paid'` - Invoice is paid
- `'overdue'` - Invoice is overdue
- `'cancelled'` - Invoice is cancelled

**Actual Transitions (from code):**
- `'issued'` (on creation via `createInvoiceFromFolio()`)
- Any status → any status (via `updateInvoiceStatus()` - no validation)

**Issues:**
- ❌ No state machine enforcement
- ❌ `updateInvoiceStatus()` accepts any status transition
- ❌ Can transition from `'paid'` to `'draft'` (invalid)
- ❌ Can transition from `'cancelled'` to `'paid'` (invalid)
- ❌ No validation of allowed transitions

**Missing State Machine:**
- No centralized state machine validation
- No terminal state protection
- No transition rules enforced

---

### 5.3. Payment Status

**Defined States:**
- `'pending'` - Payment is pending
- `'completed'` - Payment is completed
- `'failed'` - Payment failed
- `'refunded'` - Payment is refunded
- `'partial_refund'` - Payment is partially refunded

**Actual Transitions (from code):**
- Always `'completed'` (set in `processPayment()`)
- No other status transitions implemented

**Issues:**
- ❌ Status always `'completed'` (no pending/failed states)
- ❌ No gateway integration (all payments succeed)
- ❌ `'refunded'` and `'partial_refund'` states exist but no refund processing
- ❌ No state machine enforcement

---

## 6. CRS ↔ BMS Interaction

### 6.1. When CRS Calls BMS

**Check-In Workflow:**
1. `workflowService.performCheckIn()` calls:
   - `billingService.createFolio(tenantId, guestId, reservationId, roomId)`
   - `billingService.postCharge(tenantId, folioId, { category: 'room', ... })`
2. Folio created with reservation link
3. Room charge posted immediately

**Check-Out Workflow:**
1. `workflowService.performCheckOut()` calls:
   - `billingService.getFolioById(tenantId, folioId)` (to check balance)
   - `billingService.closeFolio(tenantId, folioId)` (if balance is zero)
2. Folio closed before room release

**Cross-Module Charges:**
1. `workflowService.postCrossModuleCharge()` calls:
   - `billingService.getAllFolios({ tenantId, guestId, status: 'open' })`
   - `billingService.createFolio(tenantId, guestId)` (if no folio exists)
   - `billingService.postCharge(tenantId, folioId, charge)`

---

### 6.2. What BMS Assumes CRS Has Validated

**BMS Trusts CRS For:**
- ✅ Guest exists and belongs to tenant (BMS validates this)
- ⚠️ Reservation exists (BMS does NOT validate `reservationId` if provided)
- ⚠️ Room exists (BMS does NOT validate `roomId` if provided)
- ⚠️ Guest belongs to reservation (BMS does NOT validate)

**Trust Leaks:**
- BMS accepts `reservationId` without validation
- BMS accepts `roomId` without validation
- BMS trusts CRS has validated guest-reservation relationship

---

### 6.3. What BMS Does NOT Revalidate

**BMS Does NOT Validate:**
- ❌ `reservationId` exists (if provided)
- ❌ `roomId` exists (if provided)
- ❌ Guest belongs to reservation
- ❌ Reservation belongs to tenant (if `reservationId` provided)
- ❌ Room belongs to tenant (if `roomId` provided)

**Risks:**
- Can create folio with invalid `reservationId`
- Can create folio with invalid `roomId`
- No referential integrity

---

### 6.4. Contract Violations or Trust Leaks

**No Contract Violations:**
- BMS is standalone, no strict contracts with CRS
- CRS calls BMS methods correctly
- No version passing (BMS has no version)

**Trust Leaks:**
- BMS trusts CRS has validated reservation/room
- BMS does not revalidate external references
- No referential integrity checks

---

### 6.5. Failure Handling Between CRS and BMS

**Current Behavior:**
- If BMS fails, CRS workflow fails
- CRS rollback does NOT rollback BMS operations
- Folio creation has no rollback (considered idempotent)
- Charge posting has no rollback (placeholder only)

**Issues:**
- ❌ If check-in fails after folio creation, folio remains orphaned
- ❌ If check-in fails after charge posting, charge remains on folio
- ❌ No BMS rollback in CRS workflows
- ❌ Orphaned folios possible

---

## 7. Payment Handling

### 7.1. Payment Modes Supported

**Supported Methods:**
- `'cash'`
- `'credit_card'`
- `'debit_card'`
- `'upi'`
- `'bank_transfer'`
- `'corporate_account'`
- `'travel_agent'`
- `'voucher'`
- `'other'`

**Implementation:**
- All methods accepted
- No method-specific validation
- No method-specific processing

---

### 7.2. Partial Payments Support

**Status: SUPPORTED**

- Multiple payments allowed on same folio
- Payments accumulate until balance = 0
- No limit on number of payments

**Issues:**
- ❌ No validation that payment amount <= remaining balance
- ❌ Overpayment allowed (negative balance)
- ❌ No credit balance tracking

---

### 7.3. Overpayment Handling

**Status: NOT HANDLED**

- Overpayment allowed (no validation)
- Negative balance allowed
- No credit balance tracking
- No refund processing

**Example:**
- Folio balance: ₹1000
- Payment: ₹1500
- Result: Balance = -₹500 (allowed, not handled)

---

### 7.4. Duplicate Payment Risks

**Status: HIGH RISK**

- No idempotency keys
- No duplicate payment detection
- Same payment can be processed multiple times
- Receipt number generation can collide (timestamp-based)

**Risk Scenario:**
- User clicks "Process Payment" twice
- Two payments created with same amount
- Double charge to customer

---

### 7.5. Idempotency (or Lack of It)

**Status: NOT IMPLEMENTED**

- No idempotency keys
- No idempotency checking
- No idempotency storage
- Duplicate operations create duplicate records

---

### 7.6. Gateway Assumptions (if Mocked)

**Status: FULLY MOCKED**

- All payments succeed (`status: 'completed'`)
- No gateway integration
- No pending/failed states
- No retry logic
- No webhook handling

**Assumptions:**
- Payment always succeeds
- No gateway timeouts
- No gateway errors
- No 3D Secure flows
- No payment confirmation

---

## 8. Concurrency & Consistency

### 8.1. Version Usage

**Status: NOT IMPLEMENTED**

- Folio has no `version` field
- Payment has no `version` field
- Invoice has no `version` field
- No optimistic locking
- No version checking

**Impact:**
- Concurrent modifications can corrupt balances
- Lost updates possible
- Race conditions not prevented

---

### 8.2. Race Condition Scenarios

**Scenario 1: Concurrent Charge + Payment**
- Thread A: Post charge (reads balance, calculates new balance)
- Thread B: Process payment (reads balance, calculates new balance)
- Both write: Last write wins, one update lost
- **Result**: Balance corruption

**Scenario 2: Concurrent Charge Posting**
- Thread A: Post charge (updates `totalCharges`)
- Thread B: Post charge (updates `totalCharges`)
- Both read same `totalCharges`, both add their charge
- **Result**: One charge lost from `totalCharges`

**Scenario 3: Concurrent Payment Processing**
- Thread A: Process payment (updates `totalPayments`)
- Thread B: Process payment (updates `totalPayments`)
- Both read same `totalPayments`, both add their payment
- **Result**: One payment lost from `totalPayments`

**Scenario 4: Concurrent Charge Void + Payment**
- Thread A: Void charge (subtracts from `totalCharges`)
- Thread B: Process payment (adds to `totalPayments`)
- Both recalculate balance
- **Result**: Balance may be incorrect

---

### 8.3. Double Charge Risks

**High Risk Scenarios:**
1. **Duplicate Payment Processing:**
   - No idempotency
   - Same payment processed twice
   - Customer charged twice

2. **Concurrent Charge Posting:**
   - Same charge posted twice
   - `totalCharges` incremented twice
   - Customer charged twice

3. **Charge Voiding Race:**
   - Charge voided while payment processing
   - Balance calculation incorrect
   - Customer may be overcharged

---

### 8.4. Lost Update Risks

**High Risk:**
- No version checking
- Last write wins
- Updates can be lost silently
- Balance corruption possible

**Example:**
- Folio balance: ₹1000
- Thread A: Post charge ₹500 (calculates balance = ₹1500)
- Thread B: Process payment ₹200 (calculates balance = ₹800)
- Thread A writes: balance = ₹1500
- Thread B writes: balance = ₹800 (overwrites A's update)
- **Result**: Charge posted but balance shows ₹800 (should be ₹1300)

---

### 8.5. Concurrent Checkout Risks

**High Risk:**
- Multiple checkout attempts can process multiple payments
- No locking on folio
- No idempotency on checkout
- Can close folio multiple times (idempotent but payment processed)

**Scenario:**
- User clicks "Checkout" twice
- Both attempts process payment
- Both attempts close folio
- **Result**: Double payment, folio closed twice (idempotent but payment duplicated)

---

## 9. Failure Scenarios

### 9.1. Charge Posted But Payment Fails

**Scenario:**
1. Charge posted to folio
2. Payment processing fails (gateway error, network error)
3. Folio has charge but no payment

**Current Behavior:**
- Charge remains on folio
- Balance = charge amount
- Folio cannot be closed
- Manual intervention required

**Corrupted State:**
- Folio with charge but no payment
- Guest owes money but payment failed
- No automatic retry

---

### 9.2. Payment Recorded But Charge Missing

**Scenario:**
1. Payment processed successfully
2. Charge posting fails (network error, validation error)
3. Folio has payment but no charge

**Current Behavior:**
- Payment remains on folio
- Balance = -payment amount (negative)
- Folio can be closed (balance check allows negative if calculation wrong)
- Manual intervention required

**Corrupted State:**
- Folio with payment but no charge
- Negative balance (credit)
- No charge to justify payment

---

### 9.3. Folio Closed But Balance ≠ 0

**Scenario:**
1. Balance calculation corrupted (race condition)
2. Balance shows 0 but actual balance ≠ 0
3. Folio closed successfully

**Current Behavior:**
- Folio status = `'settled'`
- Cannot post charges (blocked)
- Cannot process payments (blocked)
- Balance discrepancy remains

**Corrupted State:**
- Settled folio with non-zero balance
- Cannot correct (folio is terminal)
- Revenue loss or customer credit

---

### 9.4. CRS Rollback But BMS Already Mutated State

**Scenario:**
1. CRS check-in workflow:
   - Step 1: Check-in reservation ✅
   - Step 2: Assign room ✅
   - Step 3: Create folio ✅
   - Step 4: Post charge ✅
   - Step 5: Room assignment fails (RMS error)
2. CRS rollback:
   - Reverts reservation status
   - Releases room
   - **Does NOT rollback folio/charge** (no rollback implemented)

**Current Behavior:**
- Folio remains created
- Charge remains posted
- Reservation reverted
- Room released
- **Orphaned folio with charge**

**Corrupted State:**
- Folio linked to non-existent reservation
- Charge posted but guest not checked in
- Manual cleanup required

---

### 9.5. Duplicate Checkout Attempts

**Scenario:**
1. User clicks "Checkout" (processes payment, closes folio)
2. Network timeout, user retries
3. Second checkout attempt processes payment again

**Current Behavior:**
- First payment processed ✅
- Folio closed ✅
- Second attempt: Payment fails (folio is `'settled'`)
- **BUT**: If timing allows, both payments can succeed

**Corrupted State:**
- Duplicate payments on same folio
- Customer charged twice
- Folio balance incorrect

---

## 10. Audit & Compliance

### 10.1. What Is Logged

**Current Logging:**
- ❌ **Nothing** - No structured audit logging
- ❌ No operation history
- ❌ No change tracking
- ❌ No failure logging
- ❌ No money movement tracking

**What Should Be Logged:**
- Folio creation (who, when, why)
- Charge posting (who, when, amount, reason)
- Charge voiding (who, when, reason)
- Payment processing (who, when, amount, method)
- Folio closing (who, when)
- Invoice generation (who, when)

---

### 10.2. What Is NOT Logged

**Missing Audit Trail:**
- ❌ Who created folio
- ❌ Who posted charge
- ❌ Who voided charge
- ❌ Who processed payment
- ❌ Who closed folio
- ❌ Who generated invoice
- ❌ Why operations were performed
- ❌ Failed operations
- ❌ Balance changes

---

### 10.3. Who Performed Actions

**Current State:**
- All operations use hardcoded `'EMP003'`
- No actual user tracking
- No `performedBy` parameter
- No user context

**Impact:**
- Cannot audit who performed financial operations
- Compliance violation
- Fraud detection impossible

---

### 10.4. Whether Money Actions Are Traceable

**Status: NOT TRACEABLE**

- No audit log
- No operation history
- No change tracking
- Cannot trace money movement
- Cannot audit financial operations

**Compliance Gaps:**
- SOX compliance impossible
- Financial audit impossible
- Fraud investigation impossible

---

### 10.5. Compliance Gaps (SOX-like Concerns)

**Critical Gaps:**
1. ❌ No audit trail of financial operations
2. ❌ No user tracking (all operations by `'EMP003'`)
3. ❌ No authorization checks (anyone can perform financial operations)
4. ❌ No segregation of duties
5. ❌ No approval workflows
6. ❌ No reconciliation checks
7. ❌ No balance validation
8. ❌ No duplicate prevention
9. ❌ No version control
10. ❌ No transaction logging

---

## 11. Security & Access Control

### 11.1. Who Can Add Charges

**Current State: ANYONE**

- No authorization checks
- Any authenticated user can call `postCharge()`
- No role-based restrictions
- No approval required

**Risk:**
- Unauthorized charge posting
- Financial fraud
- Revenue manipulation

---

### 11.2. Who Can Record Payments

**Current State: ANYONE**

- No authorization checks
- Any authenticated user can call `processPayment()`
- No role-based restrictions
- No approval required

**Risk:**
- Unauthorized payment recording
- Payment fraud
- Revenue loss

---

### 11.3. Who Can Close Folios

**Current State: ANYONE**

- No authorization checks
- Any authenticated user can call `closeFolio()`
- No role-based restrictions
- No approval required

**Risk:**
- Premature folio closing
- Revenue loss
- Accounting issues

---

### 11.4. Missing Authorization Checks

**All Methods Missing Authorization:**
- ❌ `createFolio()` - No authorization
- ❌ `postCharge()` - No authorization
- ❌ `voidCharge()` - No authorization
- ❌ `processPayment()` - No authorization
- ❌ `closeFolio()` - No authorization
- ❌ `createInvoiceFromFolio()` - No authorization
- ❌ `updateInvoiceStatus()` - No authorization
- ❌ `recordInvoicePayment()` - No authorization

---

### 11.5. High-Risk Endpoints

**All Write Operations Are High-Risk:**
1. **`postCharge()`** - Can post unauthorized charges
2. **`processPayment()`** - Can record fake payments
3. **`voidCharge()`** - Can void charges fraudulently
4. **`closeFolio()`** - Can close folios prematurely
5. **`recordInvoicePayment()`** - Can record fake invoice payments

**No Protection:**
- No authorization
- No audit trail
- No approval workflows
- No segregation of duties

---

## 12. Known Limitations & Risks

### 12.1. Technical Debt

1. **No Version Management**
   - No optimistic locking
   - Race conditions possible
   - Balance corruption risk

2. **Hardcoded Values**
   - Employee IDs hardcoded to `'EMP003'`
   - Tax rate hardcoded to 18%
   - No configuration

3. **No Idempotency**
   - Duplicate operations possible
   - Double-charge risk

4. **No State Machine**
   - Status transitions not validated
   - Invalid states possible

5. **No Audit Logging**
   - No operation history
   - No compliance

---

### 12.2. Logical Loopholes

1. **Overpayment Allowed**
   - Can process payment exceeding balance
   - Negative balance not handled
   - Credit balance not tracked

2. **Charge Voiding Not Validated**
   - Can void already voided charges
   - Can void charges on closed folios
   - Double voiding possible

3. **Balance Not Validated**
   - Balance calculated but not validated
   - Can become inconsistent
   - No reconciliation

4. **Duplicate Payments**
   - No duplicate detection
   - Same payment can be processed multiple times

5. **Orphaned Folios**
   - Folios can be created without reservations
   - No cleanup mechanism
   - No validation

---

### 12.3. Financial Risk Exposure

1. **Money Loss Risks:**
   - Balance corruption (race conditions)
   - Lost payments (concurrent updates)
   - Double charges (no idempotency)
   - Unauthorized operations (no authorization)

2. **Revenue Loss Risks:**
   - Premature folio closing
   - Charge voiding without approval
   - Payment recording without validation
   - Negative balances not handled

3. **Compliance Risks:**
   - No audit trail
   - No user tracking
   - No authorization
   - No reconciliation

---

### 12.4. Scalability Limits

1. **In-Memory Storage**
   - All data in memory
   - Lost on restart
   - No persistence
   - Cannot scale beyond single process

2. **No Database**
   - No ACID guarantees
   - No transactions
   - No backup
   - No recovery

3. **Synchronous Operations**
   - All operations synchronous
   - No async processing
   - No queue
   - No batch processing

---

## 13. Improvement Candidates (DO NOT IMPLEMENT)

### CRITICAL (Money Loss / Corruption)

1. **Add Version Management**
   - Add `version` field to Folio, Payment, Invoice
   - Require `expectedVersion` for all writes
   - Implement optimistic locking
   - **Risk**: Balance corruption, lost updates

2. **Add Authorization Checks**
   - Require `performedBy` parameter
   - Implement role-based access control
   - Restrict financial operations to authorized roles
   - **Risk**: Financial fraud, unauthorized operations

3. **Fix Hardcoded Employee IDs**
   - Replace `'EMP003'` with actual user ID
   - Require `performedBy` parameter
   - Track actual user performing operations
   - **Risk**: No audit trail, compliance violation

4. **Add Idempotency Protection**
   - Add idempotency keys to payment processing
   - Prevent duplicate payments
   - Prevent duplicate charges
   - **Risk**: Double charges, duplicate payments

5. **Add Balance Validation**
   - Validate balance against charges/payments
   - Reconcile on read
   - Detect inconsistencies
   - **Risk**: Balance corruption, revenue loss

6. **Add Refund Processing**
   - Implement `processRefund()` method
   - Track refunds separately
   - Update payment status
   - **Risk**: Cannot process refunds, manual workaround

7. **Add Overpayment Handling**
   - Validate payment <= balance
   - Track credit balances
   - Handle negative balances
   - **Risk**: Accounting issues, credit not tracked

---

### HIGH RISK

1. **Add State Machine Enforcement**
   - Enforce folio status transitions
   - Enforce invoice status transitions
   - Block invalid transitions
   - **Risk**: Invalid states, status corruption

2. **Add Charge Voiding Validation**
   - Check if charge already voided
   - Check folio status before voiding
   - Validate void reason
   - **Risk**: Double voiding, balance corruption

3. **Add Payment Gateway Integration**
   - Integrate with payment gateway
   - Handle pending/failed states
   - Implement retry logic
   - **Risk**: All payments succeed (mocked)

4. **Add Tax Configuration**
   - Make tax rate configurable
   - Support different rates by category
   - Support jurisdiction-based rates
   - **Risk**: Hardcoded 18% tax

5. **Add Audit Logging**
   - Log all financial operations
   - Track who performed actions
   - Track when and why
   - **Risk**: No compliance, no audit trail

---

### MEDIUM RISK

1. **Add Reconciliation Checks**
   - Validate balance against charges/payments
   - Detect inconsistencies
   - Auto-correct if possible
   - **Risk**: Balance inconsistencies

2. **Add Duplicate Payment Detection**
   - Check for duplicate payments
   - Prevent duplicate processing
   - **Risk**: Duplicate payments

3. **Add Folio Reopen Capability**
   - Allow reopening settled folios
   - With proper authorization
   - **Risk**: Cannot correct settled folios

4. **Add Discount/Adjustment Processing**
   - Implement discount methods
   - Implement adjustment methods
   - **Risk**: Categories exist but no processing

5. **Add Referential Integrity Checks**
   - Validate `reservationId` exists
   - Validate `roomId` exists
   - Validate guest-reservation relationship
   - **Risk**: Orphaned folios, invalid references

---

### LOW RISK

1. **Add Split Billing**
   - Split folio across multiple guests
   - Merge folios
   - **Risk**: Cannot split bills

2. **Add Deposit Management**
   - Track deposits
   - Apply deposits to folios
   - Refund deposits
   - **Risk**: No deposit tracking

3. **Add Payment Plans**
   - Installment payments
   - Payment schedules
   - **Risk**: No payment plan support

4. **Improve Folio Number Generation**
   - Use UUID or sequential numbers
   - Prevent collisions
   - **Risk**: Timestamp-based can collide

5. **Add Receipt Number Validation**
   - Ensure uniqueness
   - Prevent collisions
   - **Risk**: Timestamp-based can collide

---

## 14. Open Questions & Ambiguities

### 14.1. Things Code Does Not Clarify

1. **Refund Processing Intent**
   - Payment has refund fields but no refund method
   - **Question**: Should refunds be processed through BMS or externally?
   - **Question**: How should refunds affect folio balance?

2. **Disputed Folio Handling**
   - `'disputed'` status exists but no method to set it
   - **Question**: How should disputed folios be handled?
   - **Question**: Can disputed folios be reopened?

3. **Closed vs Settled Status**
   - `'closed'` status defined but never used
   - Always transitions to `'settled'`
   - **Question**: What is the difference between `'closed'` and `'settled'`?
   - **Question**: Should `'closed'` be removed?

4. **Overpayment Policy**
   - Overpayment allowed but not handled
   - **Question**: Should overpayments be refunded automatically?
   - **Question**: Should credit balances be tracked?

5. **Tax Configuration Intent**
   - Tax hardcoded to 18%
   - **Question**: Should tax be configurable?
   - **Question**: Should different categories have different tax rates?

6. **Discount/Adjustment Intent**
   - Categories exist but no methods
   - **Question**: Should discounts be charges with negative amount?
   - **Question**: How should adjustments be processed?

7. **Invoice-Folio Relationship**
   - Invoice created from folio
   - **Question**: Can multiple invoices be created from same folio?
   - **Question**: What happens if folio changes after invoice creation?

8. **Concurrent Operation Policy**
   - No version management
   - **Question**: Should concurrent operations be allowed?
   - **Question**: How should conflicts be resolved?

9. **Authorization Model**
   - No authorization implemented
   - **Question**: What roles should have access to financial operations?
   - **Question**: Should approval workflows be required?

10. **Audit Trail Requirements**
    - No audit logging
    - **Question**: What level of audit trail is required?
    - **Question**: Should all operations be logged?

---

### 14.2. Missing Documentation

1. **API Documentation**
   - No API documentation exists
   - **Missing**: Method signatures, parameters, return types, errors

2. **Business Rules Documentation**
   - No business rules documented
   - **Missing**: When can folios be closed, when can charges be voided, etc.

3. **Integration Documentation**
   - No integration guide exists
   - **Missing**: How CRS/OMS should integrate with BMS

4. **Error Handling Documentation**
   - No error handling guide exists
   - **Missing**: Error types, retry strategies, failure recovery

---

### 14.3. Hidden Assumptions

1. **Payment Always Succeeds**
   - All payments are `'completed'`
   - **Reality**: No gateway integration
   - **Impact**: Cannot handle payment failures

2. **Single Process Assumption**
   - In-memory storage assumes single process
   - **Reality**: Production needs distributed system
   - **Impact**: Cannot scale beyond single process

3. **No Concurrent Access**
   - No version management assumes no concurrency
   - **Reality**: Multiple users can access simultaneously
   - **Impact**: Race conditions, balance corruption

4. **Trust CRS Validation**
   - BMS trusts CRS has validated reservations/rooms
   - **Reality**: BMS does not revalidate
   - **Impact**: Invalid references possible

---

## 15. BMS Post-Hardening Plan (PLACEHOLDER ONLY)

**⚠️ DO NOT IMPLEMENT - This is a placeholder for future hardening**

### 15.1. Critical Hardening Requirements

1. **Version Management (CRITICAL)**
   - Add `version` field to Folio, Payment, Invoice
   - Require `expectedVersion` for all writes
   - Implement optimistic locking
   - Increment version on successful writes

2. **Authorization (CRITICAL)**
   - Require `performedBy` parameter for all writes
   - Implement role-based access control
   - Restrict financial operations to authorized roles
   - Add authorization checks to all methods

3. **Audit Logging (CRITICAL)**
   - Log all financial operations
   - Track who, when, why, what
   - Immutable audit trail
   - Queryable audit log

4. **Idempotency (CRITICAL)**
   - Add idempotency keys to payment processing
   - Add idempotency keys to charge posting
   - Prevent duplicate operations

5. **Balance Validation (CRITICAL)**
   - Validate balance against charges/payments
   - Reconcile on read
   - Detect and correct inconsistencies

6. **State Machine Enforcement (HIGH)**
   - Enforce folio status transitions
   - Enforce invoice status transitions
   - Block invalid transitions

7. **Refund Processing (HIGH)**
   - Implement `processRefund()` method
   - Track refunds separately
   - Update payment status

8. **Overpayment Handling (HIGH)**
   - Validate payment <= balance
   - Track credit balances
   - Handle negative balances

---

## 16. Freeze Readiness Checklist

### 16.1. What Must Be True Before BMS Can Be Frozen

**CRITICAL Requirements:**
- ❌ Version management implemented
- ❌ Authorization checks implemented
- ❌ Audit logging implemented
- ❌ Idempotency protection implemented
- ❌ Balance validation implemented
- ❌ Refund processing implemented
- ❌ Overpayment handling implemented
- ❌ State machine enforcement implemented
- ❌ Hardcoded employee IDs fixed
- ❌ Tax configuration implemented

**HIGH Priority:**
- ❌ Charge voiding validation
- ❌ Referential integrity checks
- ❌ Duplicate payment detection
- ❌ Reconciliation checks

**MEDIUM Priority:**
- ❌ Discount/adjustment processing
- ❌ Split billing
- ❌ Deposit management

---

### 16.2. What Invariants Must Be Enforced

**Financial Invariants:**
1. **Balance Consistency**
   - `balance === totalCharges - totalPayments`
   - `totalCharges === sum(non-voided charges)`
   - `totalPayments === sum(completed payments)`

2. **Folio Status Invariants**
   - `status === 'settled'` ⇒ `balance === 0`
   - `status === 'settled'` ⇒ cannot post charges
   - `status === 'settled'` ⇒ cannot process payments

3. **Charge Invariants**
   - `amount === quantity * unitPrice`
   - `taxAmount === Math.round(amount * taxRate)`
   - `totalAmount === amount + taxAmount`
   - `isVoided === true` ⇒ charge not counted in `totalCharges`

4. **Payment Invariants**
   - `status === 'completed'` ⇒ payment counted in `totalPayments`
   - `refundedAmount <= amount`
   - `status === 'refunded'` ⇒ `refundedAmount === amount`

5. **Version Invariants**
   - All writes require `expectedVersion`
   - Version incremented on successful writes
   - Version mismatch throws `ConflictError`

---

**End of Technical Documentation**

