# Unified Hotel Suite - Frontend Prototype

A comprehensive, modular React + Ant Design frontend for a full-scale hotel management system. Features 9 integrated management modules with mock API layer for realistic prototyping.

## 🏨 Management Modules

| Module | Code | Description |
|--------|------|-------------|
| Customer Reservation System | CRS | Guests, reservations, check-in/out, calendar |
| Rooms Management System | RMS | Room inventory, housekeeping, maintenance |
| Inventory Management System | IMS | Stock tracking, par levels, reorder alerts |
| Order Management System | OMS | Room service, restaurant POS, menu management |
| Supply Management System | SMS | Vendors, purchase orders, deliveries |
| Billing Management System | BMS | Folios, payments, invoices |
| Attendance Management System | AMS | Employees, shifts, attendance, leave |
| Task Management System | TMS | Cross-department task assignment & tracking |
| Accounting System | AS | Chart of accounts, transactions, reports |

## 🛠 Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development & builds
- **Ant Design 6** for UI components
- **react-router-dom 6** for routing
- **Mock API Layer** with realistic data

## 📁 Project Structure

```
src/
├── api/                    # Mock API layer
│   ├── helpers.ts          # Utility functions
│   ├── mockData/           # Static mock data for each module
│   │   ├── guests.ts
│   │   ├── rooms.ts
│   │   ├── reservations.ts
│   │   ├── employees.ts
│   │   ├── inventory.ts
│   │   ├── orders.ts
│   │   ├── billing.ts
│   │   ├── tasks.ts
│   │   └── index.ts
│   └── services/           # CRUD service layer
│       ├── guestService.ts
│       ├── reservationService.ts
│       ├── roomService.ts
│       ├── billingService.ts
│       ├── orderService.ts
│       ├── inventoryService.ts
│       ├── taskService.ts
│       ├── employeeService.ts
│       └── index.ts
├── components/
│   ├── layout/             # App layouts
│   │   └── SuiteLayout.tsx
│   ├── navigation/         # Auth guards
│   │   ├── ProtectedRoute.tsx
│   │   └── RequireAuth.tsx
│   └── shared/             # Reusable UI components
│       ├── PageHeader.tsx
│       ├── DataTable.tsx
│       ├── StatCard.tsx
│       ├── StatusTag.tsx
│       ├── FormDrawer.tsx
│       ├── FilterPanel.tsx
│       ├── DetailCard.tsx
│       ├── EmptyState.tsx
│       └── index.ts
├── config/
│   ├── modules.tsx         # Module definitions & navigation
│   ├── tenants.ts          # Hotel/tenant configuration
│   └── users.ts            # Demo user profiles
├── context/
│   └── AppContext.tsx      # Global state (auth, tenant, modules)
├── modules/                # Module dashboards
│   ├── crs/CRSDashboard.tsx
│   ├── rms/RMSDashboard.tsx
│   ├── ims/IMSDashboard.tsx
│   ├── oms/OMSDashboard.tsx
│   ├── sms/SMSDashboard.tsx
│   ├── bms/BMSDashboard.tsx
│   ├── ams/AMSDashboard.tsx
│   ├── tms/TMSDashboard.tsx
│   ├── as/ASDashboard.tsx
│   └── index.ts
├── pages/
│   ├── Overview.tsx        # Main dashboard
│   ├── login.tsx           # User selection
│   └── operator/           # SaaS admin panel
├── types/
│   └── index.ts            # Comprehensive TypeScript types
├── styles/
│   ├── globals.css
│   └── design-tokens.css
├── App.tsx                 # Main router
└── main.tsx                # Entry point
```

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Open http://localhost:3000/login

## 👤 Demo Users

Select any persona on the login page - no password required:

| User | Role | Modules |
|------|------|---------|
| Claire Bennett | Corporate Admin | All modules |
| Mason Clark | General Manager | All modules |
| Sophia Lee | Front Office Manager | CRS, RMS, OMS, BMS, TMS, AMS |
| Rhea Kapoor | Reservations Lead | CRS, RMS, OMS |
| Dan Murphy | Reception Supervisor | CRS, RMS, OMS, BMS, TMS, AMS |
| Noah Patel | Housekeeping Chief | RMS, TMS, AMS |
| Elena Rossi | Engineering Manager | RMS, TMS, SMS |
| Liam Tan | Inventory & Procurement | IMS, SMS, OMS, TMS |
| Maya Fernandez | F&B Manager | OMS, IMS, BMS, TMS |
| Eva Singh | Finance Controller | BMS, AS |
| Hannah Nguyen | HR Manager | AMS, TMS |
| Isaac Romero | IT Systems Admin | CRS, RMS, BMS, AS, TMS |

## 🔌 API Layer

The mock API layer (`src/api/`) mimics real API behavior:

```typescript
import { guestService, reservationService } from '@/api';

// Example usage in components
const loadGuests = async () => {
  const result = await guestService.getAll({
    search: 'john',
    vipStatus: 'gold',
    page: 1,
    pageSize: 10,
  });
  console.log(result.data); // Guest[]
};

// Create new guest
const newGuest = await guestService.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+91-9876543210',
});
```

### Switching to Real API

When Spring Boot backend is ready:

```typescript
// Change from mock to real in service files:
// BEFORE
const response = await delay(300);
return [...mockData];

// AFTER
const response = await axios.get('/api/guests');
return response.data;
```

## 📦 Shared Components

Reusable components in `src/components/shared/`:

```typescript
import { 
  PageHeader,
  DataTable,
  StatCard,
  StatusTag,
  FormDrawer,
  FilterPanel,
  EmptyState,
} from '@/components/shared';

// PageHeader with breadcrumbs
<PageHeader 
  title="Guest Management"
  subtitle="Manage guest profiles and preferences"
  breadcrumbs={[{ label: 'CRS' }, { label: 'Guests' }]}
  actions={<Button type="primary">Add Guest</Button>}
/>

// StatusTag for consistent status display
<StatusTag status="checked_in" type="reservation" />
<StatusTag status="available" type="room" />
<StatusTag status="gold" type="vip" />
```

## 🗺 Routes

```
/login                    # User selection
/suite/overview           # Main dashboard

# CRS - Customer Reservations
/suite/crs                # CRS Dashboard
/suite/crs/guests         # Guest list
/suite/crs/guests/:id     # Guest detail
/suite/crs/reservations   # Reservation list
/suite/crs/reservations/:id
/suite/crs/calendar       # Availability calendar

# RMS - Rooms
/suite/rms                # RMS Dashboard
/suite/rms/rooms          # Room list
/suite/rms/room-types     # Room type config
/suite/rms/housekeeping   # Housekeeping tasks
/suite/rms/maintenance    # Maintenance requests

# IMS - Inventory
/suite/ims                # IMS Dashboard
/suite/ims/items          # Inventory items
/suite/ims/categories     # Categories
/suite/ims/stock-alerts   # Low stock alerts

# OMS - Orders
/suite/oms                # OMS Dashboard
/suite/oms/orders         # Order queue
/suite/oms/menu           # Menu management
/suite/oms/pos            # Point of sale

# SMS - Supply
/suite/sms                # SMS Dashboard
/suite/sms/vendors        # Vendor list
/suite/sms/purchase-orders
/suite/sms/deliveries

# BMS - Billing
/suite/bms                # BMS Dashboard
/suite/bms/folios         # Guest folios
/suite/bms/payments       # Payment log
/suite/bms/invoices       # Invoices

# AMS - Attendance
/suite/ams                # AMS Dashboard
/suite/ams/employees      # Employee list
/suite/ams/shifts         # Shift schedules
/suite/ams/attendance     # Daily attendance
/suite/ams/leave          # Leave requests

# TMS - Tasks
/suite/tms                # TMS Dashboard
/suite/tms/tasks          # All tasks
/suite/tms/my-tasks       # User's tasks

# AS - Accounting
/suite/as                 # AS Dashboard
/suite/as/accounts        # Chart of accounts
/suite/as/transactions    # Transaction log
/suite/as/reports         # Financial reports

# Operator (SaaS Admin)
/operator/overview        # SaaS dashboard
/operator/tenants         # Hotel management
/operator/users           # User templates
```

## 🔜 Next Steps

### Phase 2: Module Implementation

For each module, implement full CRUD pages:

1. **CRS Module**
   - [ ] Guest list page with search, filters, pagination
   - [ ] Guest detail page with reservation history
   - [ ] Guest create/edit form
   - [ ] Reservation list with calendar view
   - [ ] Reservation detail with timeline
   - [ ] Booking wizard (new reservation)
   - [ ] Check-in / Check-out workflows

2. **RMS Module**
   - [ ] Room grid with status visualization
   - [ ] Floor plan view
   - [ ] Room detail with history
   - [ ] Housekeeping task board
   - [ ] Maintenance request management

3. **BMS Module**
   - [ ] Folio management with charge posting
   - [ ] Payment collection modal
   - [ ] Invoice generation
   - [ ] Revenue reports

4. Continue for OMS, IMS, SMS, TMS, AMS, AS...

### Phase 3: Integration

- [ ] Cross-module workflows (book → assign room → create folio)
- [ ] Real-time notifications
- [ ] Dashboard with live data

### Phase 4: Polish

- [ ] Responsive design improvements
- [ ] Print/export functionality
- [ ] Error boundaries
- [ ] Loading skeletons

---

Built with ❤️ for the hospitality industry
