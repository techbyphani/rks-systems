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

export const USERS: UserProfile[] = [
  {
    id: 'ana-admin',
    name: 'Ana Rodrigues',
    username: 'ana.admin',
    password: 'admin@123',
    role: 'admin',
    tenantId: 'aurora-grand',
  },
  {
    id: 'mason-manager',
    name: 'Mason Clark',
    username: 'mason.manager',
    password: 'manager@123',
    role: 'manager',
    tenantId: 'aurora-grand',
  },
  {
    id: 'rhea-reception',
    name: 'Rhea Kapoor',
    username: 'rhea.reception',
    password: 'welcome@123',
    role: 'receptionist',
    tenantId: 'aurora-grand',
    modules: ['crs', 'rms', 'oms', 'bms', 'tms', 'ams'],
  },
  {
    id: 'liam-logistics',
    name: 'Liam Tan',
    username: 'liam.logistics',
    password: 'supply@123',
    role: 'manager',
    tenantId: 'pacific-breeze',
    modules: ['ims', 'sms', 'oms', 'tms'],
  },
  {
    id: 'eva-accounting',
    name: 'Eva Singh',
    username: 'eva.accounting',
    password: 'finance@123',
    role: 'accounting',
    tenantId: 'serene-suites',
    modules: ['bms', 'as'],
  },
  {
    id: 'noah-housekeeping',
    name: 'Noah Patel',
    username: 'noah.housekeeping',
    password: 'rooms@123',
    role: 'housekeeping',
    tenantId: 'serene-suites',
    modules: ['rms', 'tms', 'ams'],
  },
]
