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

## Multi-tenant & Permission Model

- **Tenants (hotels)** select a plan (module list). Demo tenants live in `src/config/tenants.ts`.
- **Users** belong to a tenant. Each user inherits tenant modules or overrides them for granular access (`src/config/users.ts`).
- The UI reads the intersection of tenant + user permissions to build the sidebar, routes, and module availability.

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
├── pages/               # Top-level suite overview
└── utils/               # Shared helpers (existing from legacy UI)
```

## Getting Started

```bash
cd frontend
npm install
npm run dev
# open http://localhost:3000/suite/overview
```

No backend configuration is required—the app boots with curated mock data.

## Customising the Demo

- Add or edit tenants in `src/config/tenants.ts` to simulate different subscription plans.
- Manage demo users and their module entitlements in `src/config/users.ts`.
- Each module’s view lives in `src/modules/<module-id>`; swap static arrays with API hooks when the backend is ready.

## Roadmap

1. Replace static datasets with typed API clients.
2. Add scenario picker to highlight specific operational stories.
3. Layer in testing (unit + visual) once flows stabilise.
4. Wire authentication + deployment automation per hotel tenant.

---

The legacy marketing pages remain in the repo for reference but are no longer wired into the router. All new work should happen inside the suite architecture described above.
