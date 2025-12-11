# Unified Hotel Suite Frontend

A modular React + Ant Design frontend that showcases every operational system a modern hotel needs. The app ships with curated demo data (no backend required) and mirrors how the eventual production UI will behave once APIs are available.

## Scope

| Management System | Description |
| --- | --- |
| Customer Reservation System (CRS) | Booking pace, arrivals, channel mix |
| Rooms Management System (RMS) | Inventory readiness, housekeeping, engineering |
| Inventory Management System (IMS) | Stock visibility, par levels, inbound shipments |
| Order Management System (OMS) | Room service, POS orders, internal requisitions |
| Supply Management System (SMS) | Vendors, contracts, delivery orchestration |
| Billing Management System (BMS) | Folios, payments, receipts, mix analysis |
| Attendance Management System (AMS) | Rosters, leave, compliance |
| Task Management System (TMS) | Cross-team assignments and SLAs |
| Accounting System (AS) | Financial health, cash flow, audit notes |

## Permission Model

This build targets **a single hotel property** (Aurora Grand Hotel). Each staff persona has its own login and only sees the management systems relevant to that role. Future multi-property hosting will simply replicate this bundle per hotel.

- Demo users are declared in `src/config/users.ts`.
- Each user can opt into a subset of modules (beyond the hotel-wide defaults) by populating the `modules` array.

## Tech Stack

- Vite + React 18 + TypeScript
- Ant Design 5
- react-router-dom 6
- react-helmet-async, react-hot-toast

## Project Structure (key folders)

```
src/
├── components/
│   └── layout/           # Shared shells (SuiteLayout, PageTransition)
├── config/              # Module, tenant, and user definitions
├── context/             # App-wide providers (tenant/user state)
├── modules/             # One folder per management system
├── pages/               # Top-level suite overview + login
└── utils/               # Shared helpers (existing from legacy UI)
```

## Getting Started

```bash
cd frontend
npm install
npm run dev
# open http://localhost:3000/login
```

### Demo credentials (Aurora Grand Hotel)

| User | Role | Password |
| --- | --- | --- |
| Claire Bennett | Corporate Admin | `owner@123` |
| Mason Clark | General Manager | `manager@123` |
| Sophia Lee | Front Office Manager | `frontdesk@123` |
| Rhea Kapoor | Reservations Lead | `reserve@123` |
| Dan Murphy | Reception Supervisor | `welcome@123` |
| Noah Patel | Housekeeping Chief | `rooms@123` |
| Elena Rossi | Engineering Manager | `engg@123` |
| Liam Tan | Inventory & Procurement Manager | `supply@123` |
| Maya Fernandez | Food & Beverage Manager | `dining@123` |
| Eva Singh | Finance Controller | `finance@123` |
| Hannah Nguyen | HR Manager | `people@123` |
| Isaac Romero | IT Systems Admin | `systems@123` |

## Customising the Demo

- Update hotel details and enabled modules in `src/config/tenants.ts` (single entry by default).
- Manage staff accounts and their entitlements in `src/config/users.ts`.
- Each module’s view lives in `src/modules/<module-id>`; swap static arrays with API hooks when the backend is ready.

## Roadmap

1. Replace static datasets with typed API clients.
2. Add scenario picker to highlight specific operational stories.
3. Layer in testing (unit + visual) once flows stabilise.
4. Wire authentication + deployment automation per hotel tenant.

---

The legacy marketing pages remain in the repo for reference but are no longer wired into the router. All new work should happen inside the suite architecture described above.
