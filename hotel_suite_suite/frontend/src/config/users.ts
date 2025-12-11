import type { ModuleId } from './modules'

export type Role = 'admin' | 'manager' | 'receptionist' | 'housekeeping' | 'accounting'

export interface UserProfile {
  id: string
  name: string
  username: string
  password: string
  role: Role
  tenantId: string
  modules?: ModuleId[]
}

const DEFAULT_TENANT_ID = 'aurora-grand'

export const USERS: UserProfile[] = [
  {
    id: 'ana-admin',
    name: 'Ana Rodrigues',
    username: 'ana.admin',
    password: 'admin@123',
    role: 'admin',
    tenantId: DEFAULT_TENANT_ID,
  },
  {
    id: 'mason-manager',
    name: 'Mason Clark',
    username: 'mason.manager',
    password: 'manager@123',
    role: 'manager',
    tenantId: DEFAULT_TENANT_ID,
  },
  {
    id: 'rhea-reception',
    name: 'Rhea Kapoor',
    username: 'rhea.reception',
    password: 'welcome@123',
    role: 'receptionist',
    tenantId: DEFAULT_TENANT_ID,
    modules: ['crs', 'rms', 'oms', 'bms', 'tms', 'ams'],
  },
  {
    id: 'liam-logistics',
    name: 'Liam Tan',
    username: 'liam.logistics',
    password: 'supply@123',
    role: 'manager',
    tenantId: DEFAULT_TENANT_ID,
    modules: ['ims', 'sms', 'oms', 'tms'],
  },
  {
    id: 'eva-accounting',
    name: 'Eva Singh',
    username: 'eva.accounting',
    password: 'finance@123',
    role: 'accounting',
    tenantId: DEFAULT_TENANT_ID,
    modules: ['bms', 'as'],
  },
  {
    id: 'noah-housekeeping',
    name: 'Noah Patel',
    username: 'noah.housekeeping',
    password: 'rooms@123',
    role: 'housekeeping',
    tenantId: DEFAULT_TENANT_ID,
    modules: ['rms', 'tms', 'ams'],
  },
]
