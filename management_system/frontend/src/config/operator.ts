export interface TenantSummary {
  id: string
  name: string
  region: string
  plan: string
  status: 'active' | 'trial' | 'suspended'
  modules: number
  goLiveDate?: string
}

export interface UserTemplate {
  role: string
  description: string
  modules: string[]
}

export const TENANT_SUMMARIES: TenantSummary[] = [
  {
    id: 'aurora-grand',
    name: 'Aurora Grand Hotel',
    region: 'Singapore',
    plan: 'Enterprise',
    status: 'active',
    modules: 9,
    goLiveDate: '2025-11-12',
  },
  {
    id: 'pacific-breeze',
    name: 'Pacific Breeze Resort',
    region: 'California, USA',
    plan: 'Premium',
    status: 'trial',
    modules: 7,
    goLiveDate: '2026-01-05',
  },
  {
    id: 'serene-suites',
    name: 'Serene Suites',
    region: 'Bengaluru, India',
    plan: 'Enterprise',
    status: 'suspended',
    modules: 8,
  },
]

export const USER_TEMPLATES: UserTemplate[] = [
  {
    role: 'Reception Supervisor',
    description: 'Front desk lead handling arrivals and folios',
    modules: ['CRS', 'RMS', 'OMS', 'BMS', 'TMS', 'AMS'],
  },
  {
    role: 'Housekeeping Chief',
    description: 'Coordinates cleaning operations and tasks',
    modules: ['RMS', 'TMS', 'AMS'],
  },
  {
    role: 'Finance Controller',
    description: 'Manages billing, accounting, and audits',
    modules: ['BMS', 'AS'],
  },
  {
    role: 'Inventory Manager',
    description: 'Owns supplies, purchase orders, and stock',
    modules: ['IMS', 'SMS', 'OMS', 'TMS'],
  },
]
