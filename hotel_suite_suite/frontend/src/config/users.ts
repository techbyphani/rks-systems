import type { ModuleId } from './modules'

export type Role = 'admin' | 'manager' | 'receptionist' | 'housekeeping' | 'accounting'

export interface UserProfile {
  id: string
  name: string
  role: Role
  tenantId: string
  modules?: ModuleId[]
}

export const USERS: UserProfile[] = [
  {
    id: 'ana-admin',
    name: 'Ana Rodrigues',
    role: 'admin',
    tenantId: 'aurora-grand',
  },
  {
    id: 'mason-manager',
    name: 'Mason Clark',
    role: 'manager',
    tenantId: 'aurora-grand',
  },
  {
    id: 'rhea-reception',
    name: 'Rhea Kapoor',
    role: 'receptionist',
    tenantId: 'aurora-grand',
    modules: ['crs', 'rms', 'oms', 'bms', 'tms', 'ams'],
  },
  {
    id: 'liam-logistics',
    name: 'Liam Tan',
    role: 'manager',
    tenantId: 'pacific-breeze',
    modules: ['ims', 'sms', 'oms', 'tms'],
  },
  {
    id: 'eva-accounting',
    name: 'Eva Singh',
    role: 'accounting',
    tenantId: 'serene-suites',
    modules: ['bms', 'as'],
  },
  {
    id: 'noah-housekeeping',
    name: 'Noah Patel',
    role: 'housekeeping',
    tenantId: 'serene-suites',
    modules: ['rms', 'tms', 'ams'],
  },
]
