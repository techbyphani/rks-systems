# ADMIN USER JOURNEY - DETAILED IMPLEMENTATION PLAN

## DOCUMENT PURPOSE
This is a step-by-step implementation guide for AI assistants to implement complete user journeys with proper navigation flows, state management, and interconnected pages.

---

## PHASE 1: DASHBOARD MODAL ENHANCEMENTS

### TASK 1.1: Add "View Details" Button to Total Bookings Modal
**File**: `frontend/pages/admin/index.tsx`

**Current State**: Modal shows booking table but no navigation to individual bookings

**Implementation Steps**:
1. Add "View Details" button to each booking row in the modal table
2. Add onClick handler that navigates to `/admin/bookings?id={bookingId}`
3. Add "Create New Booking" button at top of modal
4. Add onClick handler that navigates to `/admin/bookings?action=create`

**Code Changes**:
```typescript
// In the bookings modal table, modify each row:
<tr key={booking.id} className="hover:bg-gray-50">
  <td className="px-4 py-3 text-sm">{booking.bookingId}</td>
  {/* ... other columns ... */}
  <td className="px-4 py-3 text-sm">
    <button 
      onClick={() => router.push(`/admin/bookings?id=${booking.id}`)}
      className="text-blue-600 hover:text-blue-800"
    >
      View Details →
    </button>
  </td>
</tr>

// Add button at top of modal:
<button 
  onClick={() => router.push('/admin/bookings?action=create')}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
>
  + Create New Booking
</button>
```

**Required Imports**:
```typescript
import { useRouter } from 'next/router'
const router = useRouter()
```

---

### TASK 1.2: Add Navigation to Checked In Guests Modal
**File**: `frontend/pages/admin/index.tsx`

**Implementation Steps**:
1. Make each guest card clickable
2. Add onClick handler that navigates to `/admin/guests?id={guestId}`
3. Add "View All Guests" button at bottom of modal

**Code Changes**:
```typescript
// Modify guest cards in modal:
<div 
  key={guest.id} 
  onClick={() => router.push(`/admin/guests?id=${guest.id}`)}
  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
>
  {/* existing guest content */}
</div>

// Add at bottom of modal:
<button 
  onClick={() => router.push('/admin/guests')}
  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg"
>
  View All Guests
</button>
```

---

### TASK 1.3: Add Navigation to Available Rooms Modal
**File**: `frontend/pages/admin/index.tsx`

**Implementation Steps**:
1. Make each room card clickable
2. Add onClick handler that navigates to `/admin/rooms?id={roomId}`
3. Add "View All Rooms" button at bottom

**Code Changes**:
```typescript
// Modify room cards:
<div 
  key={room.id}
  onClick={() => router.push(`/admin/rooms?id=${room.id}`)}
  className="border-2 border-green-200 rounded-lg p-4 bg-green-50 cursor-pointer hover:bg-green-100"
>
  {/* existing room content */}
</div>
```

---

### TASK 1.4: Add Navigation to Revenue Modal
**File**: `frontend/pages/admin/index.tsx`

**Implementation Steps**:
1. Make "Pending" amount clickable
2. Navigate to `/admin/bills?status=pending`
3. Add "View All Bills" button

**Code Changes**:
```typescript
// Make pending card clickable:
<div 
  onClick={() => router.push('/admin/bills?status=pending')}
  className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 cursor-pointer hover:bg-yellow-100"
>
  <div className="text-sm text-gray-600">Pending</div>
  <div className="text-2xl font-bold text-yellow-600">₹{revenueData.pending.toLocaleString()}</div>
</div>
```

---

## PHASE 2: ALERT CARDS INTERACTIVITY

### TASK 2.1: Make Today's Arrivals Alert Clickable
**File**: `frontend/pages/admin/index.tsx`

**Implementation Steps**:
1. Convert alert card to button
2. Add onClick that navigates to `/admin/bookings?filter=arrivals_today`

**Code Changes**:
```typescript
<button
  onClick={() => router.push('/admin/bookings?filter=arrivals_today')}
  className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg text-left hover:bg-blue-100 transition w-full"
>
  {/* existing alert content */}
</button>
```

---

### TASK 2.2: Make Today's Departures Alert Clickable
**File**: `frontend/pages/admin/index.tsx`

**Implementation Steps**:
1. Convert to button
2. Navigate to `/admin/bookings?filter=departures_today`

**Code Changes**: Same pattern as 2.1

---

### TASK 2.3: Make Pending Actions Alert Clickable with Modal
**File**: `frontend/pages/admin/index.tsx`

**Implementation Steps**:
1. Add state: `const [showPendingModal, setShowPendingModal] = useState(false)`
2. Make alert clickable to open modal
3. Create modal showing breakdown:
   - Unpaid bills (count + link)
   - Maintenance rooms (count + link)
   - Unresolved feedback (count + link)

**Code Changes**:
```typescript
// Alert card:
<button
  onClick={() => setShowPendingModal(true)}
  className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-left hover:bg-red-100 transition w-full"
>
  {/* existing content */}
</button>

// Modal:
{showPendingModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md">
      <h3 className="text-xl font-semibold mb-4">Pending Actions</h3>
      <div className="space-y-3">
        <button 
          onClick={() => router.push('/admin/bills?status=pending')}
          className="w-full flex justify-between p-3 bg-gray-50 rounded hover:bg-gray-100"
        >
          <span>Unpaid Bills</span>
          <span className="font-semibold">2</span>
        </button>
        <button 
          onClick={() => router.push('/admin/rooms?status=maintenance')}
          className="w-full flex justify-between p-3 bg-gray-50 rounded hover:bg-gray-100"
        >
          <span>Maintenance Requests</span>
          <span className="font-semibold">2</span>
        </button>
        <button 
          onClick={() => router.push('/admin/feedback?status=unresolved')}
          className="w-full flex justify-between p-3 bg-gray-50 rounded hover:bg-gray-100"
        >
          <span>Unresolved Feedback</span>
          <span className="font-semibold">1</span>
        </button>
      </div>
      <button 
        onClick={() => setShowPendingModal(false)}
        className="mt-4 w-full px-4 py-2 bg-gray-600 text-white rounded-lg"
      >
        Close
      </button>
    </div>
  </div>
)}
```

---

## PHASE 3: QUICK STATS INTERACTIVITY

### TASK 3.1: Make Occupancy Rate Card Clickable
**File**: `frontend/pages/admin/index.tsx`

**Implementation Steps**:
1. Convert to button
2. Navigate to `/admin/analytics?focus=occupancy`

**Code Changes**:
```typescript
<button
  onClick={() => router.push('/admin/analytics?focus=occupancy')}
  className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left w-full"
>
  {/* existing content */}
</button>
```

---

### TASK 3.2: Make ADR Card Clickable
**File**: `frontend/pages/admin/index.tsx`

**Implementation Steps**:
1. Convert to button
2. Navigate to `/admin/pricing`

---

### TASK 3.3: Make Guest Satisfaction Card Clickable
**File**: `frontend/pages/admin/index.tsx`

**Implementation Steps**:
1. Convert to button
2. Navigate to `/admin/feedback`

---

## PHASE 4: QUICK ACTIONS FUNCTIONALITY

### TASK 4.1: Implement New Booking Quick Action
**File**: `frontend/pages/admin/index.tsx`

**Implementation Steps**:
1. Add onClick to "New Booking" button
2. Navigate to `/admin/bookings?action=create`

**Code Changes**:
```typescript
<button 
  onClick={() => router.push('/admin/bookings?action=create')}
  className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
>
  <span className="text-3xl mb-2">📝</span>
  <span className="text-sm font-medium text-gray-900">New Booking</span>
</button>
```

---

### TASK 4.2: Implement Quick Check-In Action
**File**: `frontend/pages/admin/index.tsx`

**Implementation Steps**:
1. Add state for check-in modal
2. Open modal with search functionality
3. Navigate to booking page for check-in

---

### TASK 4.3: Implement Quick Check-Out Action
Similar to 4.2

---

### TASK 4.4: Implement Generate Report Action
**Implementation Steps**:
1. Navigate to `/admin/analytics?action=generate`

---

## PHASE 5: CHART INTERACTIVITY

### TASK 5.1: Make Revenue Trend Bars Clickable
**File**: `frontend/pages/admin/index.tsx`

**Implementation Steps**:
1. Add onClick to each bar
2. Navigate to `/admin/analytics?date={selectedDate}`

**Code Changes**:
```typescript
{[45000, 52000, 48000, 55000, 50000, 58000, 50000].map((value, idx) => (
  <button
    key={idx}
    onClick={() => {
      const dates = ['2024-01-20', '2024-01-21', '2024-01-22', '2024-01-23', '2024-01-24', '2024-01-25', '2024-01-26']
      router.push(`/admin/analytics?date=${dates[idx]}`)
    }}
    className="flex-1 flex flex-col items-center"
  >
    <div className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition cursor-pointer" 
         style={{height: `${(value/60000)*100}%`}}>
    </div>
    <span className="text-xs text-gray-600 mt-2">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
    </span>
  </button>
))}
```

---

### TASK 5.2: Make Room Status Counts Clickable
**File**: `frontend/pages/admin/index.tsx`

**Implementation Steps**:
1. Make each status row clickable
2. Navigate to `/admin/rooms?status={statusType}`

**Code Changes**:
```typescript
<button
  onClick={() => router.push('/admin/rooms?status=maintenance')}
  className="flex justify-between items-center w-full hover:bg-gray-50 p-2 rounded"
>
  <span className="text-gray-600">Maintenance</span>
  <span className="font-semibold text-yellow-600">5 rooms</span>
</button>
```

---

## PHASE 6: BOOKINGS PAGE ENHANCEMENTS

### TASK 6.1: Handle URL Parameters in Bookings Page
**File**: `frontend/pages/admin/bookings.tsx`

**Implementation Steps**:
1. Read URL parameters on page load
2. If `?id={bookingId}` exists, open booking detail modal/panel
3. If `?action=create` exists, open add booking form
4. If `?filter=arrivals_today` exists, apply filter
5. If `?filter=departures_today` exists, apply filter

**Code Changes**:
```typescript
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function BookingsPage() {
  const router = useRouter()
  const { id, action, filter } = router.query

  useEffect(() => {
    if (id) {
      // Open booking detail for this ID
      setSelectedBooking(id)
      setShowDetailModal(true)
    }
    if (action === 'create') {
      // Open add booking form
      setShowAddForm(true)
    }
    if (filter === 'arrivals_today') {
      // Apply arrivals filter
      setFilterType('arrivals_today')
    }
    if (filter === 'departures_today') {
      // Apply departures filter
      setFilterType('departures_today')
    }
  }, [id, action, filter])

  // Rest of component...
}
```

---

### TASK 6.2: Create Booking Detail Modal/Panel
**File**: `frontend/pages/admin/bookings.tsx`

**Implementation Steps**:
1. Add state: `const [selectedBooking, setSelectedBooking] = useState(null)`
2. Add state: `const [showDetailModal, setShowDetailModal] = useState(false)`
3. Create modal component showing full booking details
4. Add action buttons:
   - Edit Booking
   - Cancel Booking
   - View Guest (navigate to `/admin/guests?id={guestId}`)
   - View Room (navigate to `/admin/rooms?id={roomId}`)
   - View Bill (navigate to `/admin/bills?bookingId={bookingId}`)
   - Back to Dashboard
   - Back to Bookings List

**Code Structure**:
```typescript
{showDetailModal && selectedBooking && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Booking Details - {selectedBooking.bookingId}</h2>
      
      {/* Booking Information */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-sm text-gray-600">Guest Name</label>
          <p className="font-semibold">{selectedBooking.guestName}</p>
        </div>
        {/* More fields... */}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Edit Booking
        </button>
        <button 
          onClick={() => router.push(`/admin/guests?id=${selectedBooking.guestId}`)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          View Guest Profile
        </button>
        <button 
          onClick={() => router.push(`/admin/rooms?id=${selectedBooking.roomId}`)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          View Room Details
        </button>
        <button 
          onClick={() => router.push(`/admin/bills?bookingId=${selectedBooking.id}`)}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg"
        >
          View Bill
        </button>
        <button 
          onClick={() => router.push('/admin')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg"
        >
          Back to Dashboard
        </button>
        <button 
          onClick={() => setShowDetailModal(false)}
          className="px-4 py-2 bg-gray-400 text-white rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
```

---

## PHASE 7: ROOMS PAGE ENHANCEMENTS

### TASK 7.1: Handle URL Parameters in Rooms Page
**File**: `frontend/pages/admin/rooms.tsx`

**Implementation Steps**:
1. Read `?id={roomId}` parameter
2. Read `?status={statusType}` parameter
3. If id exists, open room detail panel
4. If status exists, apply filter

**Code Changes**: Similar pattern to TASK 6.1

---

### TASK 7.2: Create Room Detail Panel
**File**: `frontend/pages/admin/rooms.tsx`

**Implementation Steps**:
1. Create side panel or modal for room details
2. Show room specifications, status, pricing, amenities
3. Show booking history for this room
4. Add action buttons:
   - Edit Room
   - Change Status
   - View Current Booking (if occupied)
   - Update Pricing
   - Back to Dashboard
   - Close Panel

---

## PHASE 8: GUESTS PAGE ENHANCEMENTS

### TASK 8.1: Handle URL Parameters in Guests Page
**File**: `frontend/pages/admin/guests.tsx`

**Implementation Steps**:
1. Read `?id={guestId}` parameter
2. If exists, open guest profile panel

---

### TASK 8.2: Create Guest Profile Panel
**File**: `frontend/pages/admin/guests.tsx`

**Implementation Steps**:
1. Create detailed guest profile view
2. Show sections:
   - Personal Information
   - Current Booking (if checked in)
   - Booking History (clickable list)
   - Payment History
   - Feedback Given (clickable list)
3. Add action buttons:
   - Edit Guest Info
   - View Current Booking (navigate to bookings)
   - View All Bookings (filtered list)
   - View Bills (navigate to bills)
   - View Feedback (navigate to feedback)
   - Send Email
   - Back to Dashboard

**Code Structure**:
```typescript
{selectedGuest && (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex justify-between items-start mb-6">
      <h2 className="text-2xl font-bold">{selectedGuest.name}</h2>
      <button onClick={() => router.push('/admin')} className="text-blue-600">
        ← Back to Dashboard
      </button>
    </div>

    {/* Personal Info */}
    <div className="mb-6">
      <h3 className="font-semibold mb-3">Personal Information</h3>
      {/* Details... */}
    </div>

    {/* Current Booking */}
    {selectedGuest.currentBooking && (
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Current Booking</h3>
        <button 
          onClick={() => router.push(`/admin/bookings?id=${selectedGuest.currentBooking.id}`)}
          className="text-blue-600 hover:underline"
        >
          View Booking Details →
        </button>
      </div>
    )}

    {/* Booking History */}
    <div className="mb-6">
      <h3 className="font-semibold mb-3">Booking History</h3>
      {selectedGuest.bookingHistory.map(booking => (
        <button
          key={booking.id}
          onClick={() => router.push(`/admin/bookings?id=${booking.id}`)}
          className="block w-full text-left p-3 bg-gray-50 rounded mb-2 hover:bg-gray-100"
        >
          {booking.bookingId} - {booking.checkIn} to {booking.checkOut}
        </button>
      ))}
    </div>

    {/* Feedback Given */}
    <div className="mb-6">
      <h3 className="font-semibold mb-3">Feedback</h3>
      {selectedGuest.feedback.map(fb => (
        <button
          key={fb.id}
          onClick={() => router.push(`/admin/feedback?id=${fb.id}`)}
          className="block w-full text-left p-3 bg-gray-50 rounded mb-2 hover:bg-gray-100"
        >
          {fb.rating}⭐ - {fb.date}
        </button>
      ))}
    </div>
  </div>
)}
```

---

## PHASE 9: BILLS PAGE ENHANCEMENTS

### TASK 9.1: Handle URL Parameters in Bills Page
**File**: `frontend/pages/admin/bills.tsx`

**Implementation Steps**:
1. Read `?status=pending` parameter
2. Read `?bookingId={id}` parameter
3. Apply filters accordingly

---

### TASK 9.2: Create Bill Detail View
**File**: `frontend/pages/admin/bills.tsx`

**Implementation Steps**:
1. Make each bill row clickable
2. Open detail panel showing:
   - Guest info (clickable link)
   - Booking info (clickable link)
   - Itemized charges
   - Payment history
   - Outstanding amount
3. Add action buttons:
   - Record Payment
   - Add Charge
   - Remove Charge
   - View Booking
   - View Guest
   - Print Bill
   - Send Reminder
   - Back to Dashboard

---

## PHASE 10: FEEDBACK PAGE ENHANCEMENTS

### TASK 10.1: Handle URL Parameters
**File**: `frontend/pages/admin/feedback.tsx`

**Implementation Steps**:
1. Read `?status=unresolved` parameter
2. Read `?id={feedbackId}` parameter
3. Apply filters or open detail view

---

### TASK 10.2: Create Feedback Detail View
**File**: `frontend/pages/admin/feedback.tsx`

**Implementation Steps**:
1. Make each feedback row clickable
2. Open detail panel showing:
   - Guest info (clickable)
   - Booking info (clickable)
   - Rating breakdown
   - Comments
   - Response status
3. Add action buttons:
   - View Guest Profile
   - View Related Booking
   - Add Internal Notes
   - Back to Dashboard

---

## PHASE 11: ANALYTICS PAGE ENHANCEMENTS

### TASK 11.1: Handle URL Parameters
**File**: `frontend/pages/admin/analytics.tsx`

**Implementation Steps**:
1. Read `?focus=occupancy` parameter
2. Read `?date={specificDate}` parameter
3. Read `?action=generate` parameter
4. Show relevant section based on parameters

---

### TASK 11.2: Add Report Generation Section
**File**: `frontend/pages/admin/analytics.tsx`

**Implementation Steps**:
1. If `?action=generate`, scroll to report section
2. Create report generation form:
   - Report type dropdown
   - Date range picker
   - Filters (room type, payment method)
   - Format selection (PDF/Excel/CSV)
3. Add "Generate" button
4. Show preview after generation
5. Add download/email options

---

## PHASE 12: BREADCRUMB NAVIGATION

### TASK 12.1: Create Breadcrumb Component
**File**: `frontend/components/Breadcrumb.tsx`

**Implementation Steps**:
1. Create new component
2. Accept path array as prop
3. Render clickable breadcrumb trail

**Code**:
```typescript
interface BreadcrumbProps {
  items: { label: string; href: string }[]
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const router = useRouter()
  
  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center">
          {idx > 0 && <span className="mx-2">/</span>}
          <button
            onClick={() => router.push(item.href)}
            className="hover:text-blue-600"
          >
            {item.label}
          </button>
        </div>
      ))}
    </div>
  )
}
```

---

### TASK 12.2: Add Breadcrumbs to All Pages
**Files**: All admin pages

**Implementation Steps**:
1. Import Breadcrumb component
2. Add at top of page content
3. Define breadcrumb path based on current page and context

**Example for Bookings Page**:
```typescript
<Breadcrumb items={[
  { label: 'Dashboard', href: '/admin' },
  { label: 'Bookings', href: '/admin/bookings' },
  ...(selectedBooking ? [{ label: selectedBooking.bookingId, href: '#' }] : [])
]} />
```

---

## PHASE 13: BACK TO DASHBOARD BUTTONS

### TASK 13.1: Add "Back to Dashboard" Button to All Pages
**Files**: All admin pages

**Implementation Steps**:
1. Add button in top-right corner of each page
2. Use consistent styling
3. Navigate to `/admin`

**Code**:
```typescript
<button
  onClick={() => router.push('/admin')}
  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
>
  ← Back to Dashboard
</button>
```

---

## PHASE 14: SUCCESS/ERROR HANDLING

### TASK 14.1: Add Toast Notification System
**File**: `frontend/components/Toast.tsx`

**Implementation Steps**:
1. Create toast component
2. Add context provider for global toast management
3. Show success/error messages after actions

---

### TASK 14.2: Add Success Flows After Actions
**All Pages**

**Implementation Steps**:
1. After creating booking: Show success toast + options (view booking, create another, dashboard)
2. After payment: Show success + options (print receipt, view bill, dashboard)
3. After check-in: Show success + options (next guest, dashboard)
4. After any update: Show success + refresh data

---

## PHASE 15: MOBILE RESPONSIVENESS FOR NAVIGATION

### TASK 15.1: Ensure All Modals Are Mobile-Friendly
**All Pages**

**Implementation Steps**:
1. Make modals full-screen on mobile
2. Ensure buttons are touch-friendly (min 44px height)
3. Add proper spacing for mobile

---

## IMPLEMENTATION CHECKLIST

### Dashboard (index.tsx)
- [ ] Add router import and initialization
- [ ] Make all KPI cards clickable with navigation
- [ ] Add "View Details" buttons in all modals
- [ ] Make alert cards clickable
- [ ] Add pending actions modal
- [ ] Make quick stats cards clickable
- [ ] Add onClick to quick action buttons
- [ ] Make chart bars clickable
- [ ] Make room status counts clickable

### Bookings Page
- [ ] Handle URL parameters (id, action, filter)
- [ ] Create booking detail modal
- [ ] Add navigation buttons in detail modal
- [ ] Add breadcrumb navigation
- [ ] Add back to dashboard button
- [ ] Handle auto-open for create action

### Rooms Page
- [ ] Handle URL parameters (id, status)
- [ ] Create room detail panel
- [ ] Add navigation buttons
- [ ] Add breadcrumb navigation
- [ ] Add back to dashboard button

### Guests Page
- [ ] Handle URL parameters (id)
- [ ] Create guest profile panel
- [ ] Add clickable booking history
- [ ] Add clickable feedback list
- [ ] Add navigation buttons
- [ ] Add breadcrumb navigation

### Bills Page
- [ ] Handle URL parameters (status, bookingId)
- [ ] Create bill detail view
- [ ] Add navigation to guest/booking
- [ ] Add breadcrumb navigation

### Feedback Page
- [ ] Handle URL parameters (status, id)
- [ ] Create feedback detail view
- [ ] Add navigation to guest/booking
- [ ] Add breadcrumb navigation

### Analytics Page
- [ ] Handle URL parameters (focus, date, action)
- [ ] Add report generation section
- [ ] Add breadcrumb navigation

### Global Components
- [ ] Create Breadcrumb component
- [ ] Create Toast notification system
- [ ] Add success/error handling

---

## TESTING CHECKLIST

### Navigation Flow Tests
- [ ] Dashboard → Bookings → Individual Booking → Guest → Back to Dashboard
- [ ] Dashboard → Revenue → Bills → Booking → Room → Back to Dashboard
- [ ] Dashboard → Arrivals → Check-In → Bill → Dashboard
- [ ] Dashboard → Pending Actions → Each Action → Resolution → Dashboard
- [ ] Dashboard → Quick Actions → Complete Action → Dashboard
- [ ] Dashboard → Charts → Analytics → Dashboard

### URL Parameter Tests
- [ ] `/admin/bookings?id=1` opens booking detail
- [ ] `/admin/bookings?action=create` opens add form
- [ ] `/admin/bookings?filter=arrivals_today` applies filter
- [ ] `/admin/rooms?status=maintenance` applies filter
- [ ] `/admin/bills?status=pending` applies filter
- [ ] `/admin/analytics?focus=occupancy` shows occupancy section

### Mobile Tests
- [ ] All modals work on mobile
- [ ] All buttons are touch-friendly
- [ ] Navigation works on mobile
- [ ] Breadcrumbs work on mobile

---

## PRIORITY ORDER

1. **HIGH PRIORITY** (Complete cycles):
   - Phase 1: Dashboard modal navigation
   - Phase 2: Alert card interactivity
   - Phase 6: Bookings page enhancements
   - Phase 13: Back to dashboard buttons

2. **MEDIUM PRIORITY** (Enhanced navigation):
   - Phase 3: Quick stats interactivity
   - Phase 4: Quick actions functionality
   - Phase 7-10: Other page enhancements
   - Phase 12: Breadcrumb navigation

3. **LOW PRIORITY** (Polish):
   - Phase 5: Chart interactivity
   - Phase 11: Analytics enhancements
   - Phase 14: Success/error handling
   - Phase 15: Mobile responsiveness

---

**END OF IMPLEMENTATION PLAN**
