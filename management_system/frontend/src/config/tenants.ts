import type { ModuleId } from './modules'

export interface TenantPlan {
  id: string
  name: string
  region: string
  modules: ModuleId[]
}

export const TENANTS: TenantPlan[] = [
  {
    id: 'aurora-grand',
    name: 'Aurora Grand Hotel',
    region: 'Singapore',
    modules: ['crs', 'rms', 'ims', 'oms', 'sms', 'bms', 'ams', 'tms', 'as'],
  },
]
