# Detailed Line-by-Line Migration Plan
## Next.js to React - Complete File-by-File Guide

---

## CRITICAL ISSUES TO FIX

### Issue 1: `router.query` Usage (10 files)
All instances of `router.query` must be replaced with `useSearchParams()` from React Router.

**Files Affected:**
1. `src/pages/admin/guests.tsx` - Line 79
2. `src/pages/admin/feedback.tsx` - Line 49
3. `src/pages/admin/bookings.tsx` - Line 49
4. `src/pages/admin/rooms.tsx` - Line 39
5. `src/pages/admin/gallery.tsx` - Line 40
6. `src/pages/admin/pricing.tsx` - Line 45
7. `src/pages/admin/analytics.tsx` - Line 47
8. `src/pages/admin/bills.tsx` - Line 62
9. `src/pages/admin/users.tsx` - Line 56
10. `src/pages/admin/offers.tsx` - Line 53

---

## FILE-BY-FILE MIGRATION DETAILS

### 1. `src/pages/_app.tsx`
**Status:** ❌ DELETE THIS FILE
**Reason:** Functionality moved to `src/App.tsx`

**Action:** Delete entire file

---

### 2. `src/pages/_document.tsx`
**Status:** ❌ DELETE THIS FILE
**Reason:** Next.js specific, not needed in React

**Action:** Delete entire file

---

### 3. `src/pages/admin/guests.tsx`
**Status:** ⚠️ PARTIALLY MIGRATED

**Line-by-Line Changes:**

**Line 79:**
```typescript
// BEFORE:
const { id: urlId } = router.query

// AFTER:
import { useSearchParams } from 'react-router-dom'
// ... in component:
const [searchParams] = useSearchParams()
const urlId = searchParams.get('id')
```

**Line 134-142:**
```typescript
// BEFORE:
useEffect(() => {
  if (urlId) {
    const guest = guests.find(g => g.id === Number(urlId))
    if (guest) {
      setSelectedGuest(guest)
      setShowProfileDrawer(true)
    }
  }
}, [urlId])

// AFTER:
useEffect(() => {
  const id = searchParams.get('id')
  if (id) {
    const guest = guests.find(g => g.id === Number(id))
    if (guest) {
      setSelectedGuest(guest)
      setShowProfileDrawer(true)
    }
  }
}, [searchParams])
```

**Line 328:**
```typescript
// BEFORE:
router.push('/admin/guests')

// AFTER:
router.push('/admin/guests') // Already works with shim
```

**Verification:**
- ✅ Line 1: Uses `Helmet` (already migrated)
- ✅ Line 5: Uses `@/shims/router` (already migrated)
- ❌ Line 79: Needs `useSearchParams()` migration
- ✅ All `router.push()` calls work

---

### 4. `src/pages/admin/feedback.tsx`
**Status:** ⚠️ PARTIALLY MIGRATED

**Line-by-Line Changes:**

**Line 49:**
```typescript
// BEFORE:
const { status: urlStatus, id: urlId, guestId: urlGuestId } = router.query

// AFTER:
import { useSearchParams } from 'react-router-dom'
// ... in component:
const [searchParams] = useSearchParams()
const urlStatus = searchParams.get('status')
const urlId = searchParams.get('id')
const urlGuestId = searchParams.get('guestId')
```

**Line 84-98:**
```typescript
// BEFORE:
useEffect(() => {
  if (urlStatus === 'unresolved') {
    setFilter('unresolved')
  }
  if (urlId) {
    const feedback = feedbacks.find(f => f.id === Number(urlId))
    if (feedback) {
      setSelectedFeedback(feedback)
      setShowDetailModal(true)
    }
  }
  if (urlGuestId) {
    // Filter by guest ID if needed
  }
}, [urlStatus, urlId, urlGuestId])

// AFTER:
useEffect(() => {
  const status = searchParams.get('status')
  const id = searchParams.get('id')
  const guestId = searchParams.get('guestId')
  
  if (status === 'unresolved') {
    setFilter('unresolved')
  }
  if (id) {
    const feedback = feedbacks.find(f => f.id === Number(id))
    if (feedback) {
      setSelectedFeedback(feedback)
      setShowDetailModal(true)
    }
  }
  if (guestId) {
    // Filter by guest ID if needed
  }
}, [searchParams])
```

**Verification:**
- ✅ Line 1: Uses `Helmet`
- ✅ Line 5: Uses `@/shims/router`
- ❌ Line 49: Needs `useSearchParams()` migration

---

### 5. `src/pages/admin/bookings.tsx`
**Status:** ⚠️ PARTIALLY MIGRATED

**Line-by-Line Changes:**

**Line 49:**
```typescript
// BEFORE:
const { id, action, filter: urlFilter } = router.query

// AFTER:
import { useSearchParams } from 'react-router-dom'
// ... in component:
const [searchParams] = useSearchParams()
const id = searchParams.get('id')
const action = searchParams.get('action')
const urlFilter = searchParams.get('filter')
```

**Line 82-99:**
```typescript
// BEFORE:
useEffect(() => {
  if (id) {
    const booking = bookings.find(b => b.id === Number(id))
    if (booking) {
      setSelectedBooking(booking)
      setShowDetailModal(true)
    }
  }
  if (action === 'create') {
    setShowAddForm(true)
  }
  if (urlFilter === 'arrivals_today') {
    setFilter('arrivals_today')
  }
  if (urlFilter === 'departures_today') {
    setFilter('departures_today')
  }
}, [id, action, urlFilter])

// AFTER:
useEffect(() => {
  const bookingId = searchParams.get('id')
  const actionParam = searchParams.get('action')
  const filterParam = searchParams.get('filter')
  
  if (bookingId) {
    const booking = bookings.find(b => b.id === Number(bookingId))
    if (booking) {
      setSelectedBooking(booking)
      setShowDetailModal(true)
    }
  }
  if (actionParam === 'create') {
    setShowAddForm(true)
  }
  if (filterParam === 'arrivals_today') {
    setFilter('arrivals_today')
  }
  if (filterParam === 'departures_today') {
    setFilter('departures_today')
  }
}, [searchParams])
```

**Verification:**
- ✅ Line 1: Uses `Helmet`
- ✅ Line 5: Uses `@/shims/router`
- ❌ Line 49: Needs `useSearchParams()` migration

---

### 6. `src/pages/admin/rooms.tsx`
**Status:** ⚠️ PARTIALLY MIGRATED

**Line-by-Line Changes:**

**Line 39:**
```typescript
// BEFORE:
const { id, status: urlStatus } = router.query

// AFTER:
import { useSearchParams } from 'react-router-dom'
// ... in component:
const [searchParams] = useSearchParams()
const id = searchParams.get('id')
const urlStatus = searchParams.get('status')
```

**Update useEffect dependencies accordingly**

---

### 7. `src/pages/admin/gallery.tsx`
**Status:** ⚠️ PARTIALLY MIGRATED

**Line-by-Line Changes:**

**Line 40:**
```typescript
// BEFORE:
const { id: urlId } = router.query

// AFTER:
import { useSearchParams } from 'react-router-dom'
// ... in component:
const [searchParams] = useSearchParams()
const urlId = searchParams.get('id')
```

**Line 89-99:**
```typescript
// BEFORE:
useEffect(() => {
  if (urlId) {
    const image = images.find(img => img.id === Number(urlId))
    if (image) {
      setSelectedImage(image)
      setShowDetailModal(true)
    }
  }
}, [urlId])

// AFTER:
useEffect(() => {
  const id = searchParams.get('id')
  if (id) {
    const image = images.find(img => img.id === Number(id))
    if (image) {
      setSelectedImage(image)
      setShowDetailModal(true)
    }
  }
}, [searchParams])
```

---

### 8. `src/pages/admin/pricing.tsx`
**Status:** ⚠️ PARTIALLY MIGRATED

**Line-by-Line Changes:**

**Line 45:**
```typescript
// BEFORE:
const { id: urlId } = router.query

// AFTER:
import { useSearchParams } from 'react-router-dom'
// ... in component:
const [searchParams] = useSearchParams()
const urlId = searchParams.get('id')
```

**Update useEffect dependencies accordingly**

---

### 9. `src/pages/admin/analytics.tsx`
**Status:** ⚠️ PARTIALLY MIGRATED

**Line-by-Line Changes:**

**Line 47:**
```typescript
// BEFORE:
const { focus: urlFocus, date: urlDate, action: urlAction } = router.query

// AFTER:
import { useSearchParams } from 'react-router-dom'
// ... in component:
const [searchParams] = useSearchParams()
const urlFocus = searchParams.get('focus')
const urlDate = searchParams.get('date')
const urlAction = searchParams.get('action')
```

**Update all useEffect dependencies that use these variables**

---

### 10. `src/pages/admin/bills.tsx`
**Status:** ⚠️ PARTIALLY MIGRATED

**Line-by-Line Changes:**

**Line 62:**
```typescript
// BEFORE:
const { status: urlStatus, bookingId: urlBookingId } = router.query

// AFTER:
import { useSearchParams } from 'react-router-dom'
// ... in component:
const [searchParams] = useSearchParams()
const urlStatus = searchParams.get('status')
const urlBookingId = searchParams.get('bookingId')
```

**Update useEffect dependencies accordingly**

---

### 11. `src/pages/admin/users.tsx`
**Status:** ⚠️ PARTIALLY MIGRATED

**Line-by-Line Changes:**

**Line 56:**
```typescript
// BEFORE:
const { id: urlId } = router.query

// AFTER:
import { useSearchParams } from 'react-router-dom'
// ... in component:
const [searchParams] = useSearchParams()
const urlId = searchParams.get('id')
```

**Line 99-107:**
```typescript
// BEFORE:
useEffect(() => {
  if (urlId) {
    const user = users.find(u => u.id === Number(urlId))
    if (user) {
      setSelectedUser(user)
      setShowDetailDrawer(true)
    }
  }
}, [urlId])

// AFTER:
useEffect(() => {
  const id = searchParams.get('id')
  if (id) {
    const user = users.find(u => u.id === Number(id))
    if (user) {
      setSelectedUser(user)
      setShowDetailDrawer(true)
    }
  }
}, [searchParams])
```

---

### 12. `src/pages/admin/offers.tsx`
**Status:** ⚠️ PARTIALLY MIGRATED

**Line-by-Line Changes:**

**Line 53:**
```typescript
// BEFORE:
const { id: urlId } = router.query

// AFTER:
import { useSearchParams } from 'react-router-dom'
// ... in component:
const [searchParams] = useSearchParams()
const urlId = searchParams.get('id')
```

**Update useEffect dependencies accordingly**

---

## MIGRATION PATTERN TEMPLATE

### Pattern: Replace `router.query` with `useSearchParams()`

**Step 1: Add Import**
```typescript
// Add at top of file with other imports
import { useSearchParams } from 'react-router-dom'
```

**Step 2: Replace router.query declaration**
```typescript
// BEFORE:
const router = useRouter()
const { id: urlId, status: urlStatus } = router.query

// AFTER:
const router = useRouter()
const [searchParams] = useSearchParams()
const urlId = searchParams.get('id')
const urlStatus = searchParams.get('status')
```

**Step 3: Update useEffect dependencies**
```typescript
// BEFORE:
useEffect(() => {
  if (urlId) {
    // do something
  }
}, [urlId])

// AFTER:
useEffect(() => {
  const id = searchParams.get('id')
  if (id) {
    // do something
  }
}, [searchParams])
```

**Step 4: Update router.push calls with query params**
```typescript
// BEFORE:
router.push(`/admin/bookings?id=${id}&status=pending`)

// AFTER:
router.push(`/admin/bookings?id=${id}&status=pending`) // Works with shim
// OR use navigate from react-router-dom:
import { useNavigate } from 'react-router-dom'
const navigate = useNavigate()
navigate(`/admin/bookings?id=${id}&status=pending`)
```

---

## VERIFICATION CHECKLIST

For each file, check:

### Import Section
- [ ] No `import Head from 'next/head'`
- [ ] Has `import { Helmet } from 'react-helmet-async'`
- [ ] No `import { useRouter } from 'next/router'`
- [ ] Has `import { useRouter } from '@/shims/router'`
- [ ] Has `import { useSearchParams } from 'react-router-dom'` (if using query params)

### Component Body
- [ ] No `const { ... } = router.query`
- [ ] Uses `const [searchParams] = useSearchParams()` instead
- [ ] All query param access uses `searchParams.get('key')`
- [ ] All `<Head>` replaced with `<Helmet>`
- [ ] All `useEffect` dependencies updated to use `[searchParams]` instead of individual query params

### JSX Section
- [ ] No `<Head>` tags
- [ ] Uses `<Helmet>` tags
- [ ] All `<Link href="...">` replaced with `<Link to="...">` (if any)

---

## EXECUTION ORDER

1. **Delete Next.js specific files:**
   - `src/pages/_app.tsx`
   - `src/pages/_document.tsx`

2. **Fix router.query usage (10 files):**
   - Start with admin pages (alphabetical order)
   - Fix one file completely before moving to next
   - Test each file after migration

3. **Final verification:**
   - Run `npm run build`
   - Check for TypeScript errors
   - Test routing functionality
   - Test query parameter handling

---

## TESTING CHECKLIST

After migration, test:
- [ ] Page loads without errors
- [ ] Query parameters work (e.g., `/admin/guests?id=1`)
- [ ] Navigation works (`router.push()`)
- [ ] useEffect hooks trigger correctly with query param changes
- [ ] No console errors
- [ ] Build passes (`npm run build`)

