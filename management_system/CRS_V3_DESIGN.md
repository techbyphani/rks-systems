# CRS v3 Design Decisions

## 1. Saga-Based Workflow Model

**Problem:** v2 rollback is best-effort, no state tracking, no retry on rollback failures.

**Solution:** Explicit saga state machine with persistent state.

**Design:**
- Saga state: `PENDING` → `IN_PROGRESS` → `COMPLETED` / `COMPENSATING` → `FAILED`
- Each step records: `stepName`, `status`, `result`, `error`, `compensatedAt`
- Saga persisted in-memory (production: DB table)
- Compensating actions are idempotent and retryable

**Trade-offs:**
- Adds complexity but provides visibility
- Saga state survives process restarts (if persisted)
- Compensating actions may fail (requires reconciliation)

---

## 2. Reconciliation & Self-Healing

**Problem:** Orphaned states require manual intervention.

**Solution:** Background reconciliation job with safe auto-fix rules.

**Design:**
- Reconciliation runs every 5 minutes
- Detects: cancelled/no_show with assigned rooms, checked_out with occupied rooms, rooms assigned to missing reservations
- Safe fixes: Release room if reservation is terminal, mark reservation no_show if room released elsewhere
- Unsafe cases: Escalate to manual queue (e.g., checked_in reservation with no room assignment)

**Trade-offs:**
- May auto-fix legitimate edge cases (false positives)
- Requires careful rule design
- Manual escalation queue needed

---

## 3. Structured Audit Log

**Problem:** Audit trail is text-based notes, not queryable.

**Solution:** Separate append-only audit log table.

**Design:**
- Schema: `id`, `tenantId`, `reservationId`, `roomId`, `action`, `actor`, `timestamp`, `metadata` (JSON)
- Immutable (no updates/deletes)
- Indexed by `reservationId`, `roomId`, `actor`, `timestamp`
- Separate from `internalNotes` (which remains for human-readable context)

**Trade-offs:**
- Adds storage overhead
- Requires query infrastructure
- Simpler than event sourcing

---

## 4. Authorization & Role Model

**Problem:** No role enforcement, any user can perform any operation.

**Solution:** Service-layer authorization with role-based permissions.

**Design:**
- Roles: `FRONT_DESK`, `MANAGER`, `ADMIN`, `SYSTEM`
- Permission matrix: `{ operation: [allowedRoles] }`
- Enforce at service layer (not UI)
- Fail fast with `ForbiddenError`

**Trade-offs:**
- Adds authorization checks to every operation
- Role assignment must be managed separately
- Simple model (no fine-grained permissions yet)

---

## 5. Availability & Contention Handling

**Problem:** Availability is advisory, causing contention failures.

**Solution:** Soft-hold mechanism with TTL.

**Design:**
- `intentToAssign(roomId, reservationId, ttlSeconds)` - Creates soft-hold
- Soft-hold blocks assignment for other reservations (not hard lock)
- TTL expires after 30 seconds (configurable)
- Availability queries exclude soft-held rooms
- Assignment must still validate (soft-hold doesn't guarantee)

**Trade-offs:**
- Reduces but doesn't eliminate contention
- TTL must be tuned (too short = still fails, too long = blocks inventory)
- Adds complexity to availability queries

---

## 6. Retry & Contention Handling

**Problem:** Fixed retry with exponential backoff doesn't adapt to contention.

**Solution:** Adaptive backoff with jitter and retry exhaustion signaling.

**Design:**
- Adaptive backoff: Base delay * (2^attempt) * random(0.8, 1.2)
- Max retries: 3 (increased from 2)
- Retry exhaustion: Return `RetryExhaustedError` with context
- User-facing retries: Show "Please try again" for transient errors
- Silent retries: Background reconciliation handles persistent failures

**Trade-offs:**
- More retries = higher latency on contention
- Jitter prevents thundering herd
- Exhaustion signaling helps UX

---

## 7. Circular Dependency Mitigation

**Problem:** CRS queries RMS for conflicts, RMS queries CRS for reservations.

**Solution:** Projection pattern with cached conflict windows.

**Design:**
- CRS maintains local projection: `reservationConflicts` cache
- Updated on: reservation create/update/cancel
- RMS queries use cached projection (not live CRS query)
- Cache TTL: 5 minutes (configurable)
- Invalidation: On reservation changes

**Trade-offs:**
- Eventual consistency (5-minute window)
- Reduces but doesn't eliminate circular dependency
- Cache invalidation complexity

---

## 8. Operational Metrics & Alerts

**Problem:** No visibility into failures, contention, or inconsistencies.

**Solution:** Metrics collection and alerting.

**Design:**
- Metrics: Saga failures, reconciliation fixes, retry exhaustion, authorization failures
- Alerts: High saga failure rate, reconciliation unable to auto-fix, retry exhaustion spike
- Dashboards: Saga state distribution, reconciliation queue size, contention rate

**Trade-offs:**
- Requires metrics infrastructure
- Alert fatigue if thresholds too sensitive
- Dashboards need maintenance

---

## Implementation Priority

1. **High Priority:** Saga model, Reconciliation, Authorization
2. **Medium Priority:** Structured audit, Availability soft-holds
3. **Low Priority:** Metrics/alerts, Circular dependency mitigation

---

