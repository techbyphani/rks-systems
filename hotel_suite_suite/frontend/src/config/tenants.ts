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
    modules: ['crs', 'rms', 'ims', 'oms', 'sms', 'bms', 'tms', 'as'],
  },
  {
    id: 'pacific-breeze',
    name: 'Pacific Breeze Resort',
    region: 'California, USA',
    modules: ['crs', 'rms', 'oms', 'bms', 'ams', 'tms'],
  },
  {
    id: 'serene-suites',
    name: 'Serene Suites',
    region: 'Bengaluru, India',
    modules: ['crs', 'rms', 'ims', 'sms', 'bms', 'ams', 'tms', 'as'],
  },
]
