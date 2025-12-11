import type { ModuleId } from './modules'

export type Role =
  | 'Corporate Admin'
  | 'General Manager'
  | 'Front Office Manager'
  | 'Reservations Lead'
  | 'Reception Supervisor'
  | 'Housekeeping Chief'
  | 'Engineering Manager'
  | 'Inventory & Procurement Manager'
  | 'Food & Beverage Manager'
  | 'Finance Controller'
  | 'HR Manager'
  | 'IT Systems Admin'

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
const ALL_MODULES: ModuleId[] = ['crs', 'rms', 'ims', 'oms', 'sms', 'bms', 'ams', 'tms', 'as']

export const USERS: UserProfile[] = [
  {
    id: 'claire-admin',
    name: 'Claire Bennett',
    username: 'claire.admin',
    password: 'owner@123',
    role: 'Corporate Admin',
    tenantId: DEFAULT_TENANT_ID,
    modules: ALL_MODULES,
  },
  {
    id: 'mason-manager',
    name: 'Mason Clark',
    username: 'mason.manager',
    password: 'manager@123',
    role: 'General Manager',
    tenantId: DEFAULT_TENANT_ID,
    modules: ALL_MODULES,
  },
  {
    id: 'sophia-fo',
    name: 'Sophia Lee',
    username: 'sophia.fo',
    password: 'frontdesk@123',
    role: 'Front Office Manager',
    tenantId: DEFAULT_TENANT_ID,
    modules: ['crs', 'rms', 'oms', 'bms', 'tms', 'ams'],
  },
  {
    id: 'rhea-res',
    name: 'Rhea Kapoor',
    username: 'rhea.res',
    password: 'reserve@123',
    role: 'Reservations Lead',
    tenantId: DEFAULT_TENANT_ID,
    modules: ['crs', 'rms', 'oms'],
  },
  {
    id: 'dan-reception',
    name: 'Dan Murphy',
    username: 'dan.reception',
    password: 'welcome@123',
    role: 'Reception Supervisor',
    tenantId: DEFAULT_TENANT_ID,
    modules: ['crs', 'rms', 'oms', 'bms', 'tms', 'ams'],
  },
  {
    id: 'noah-housekeeping',
    name: 'Noah Patel',
    username: 'noah.housekeeping',
    password: 'rooms@123',
    role: 'Housekeeping Chief',
    tenantId: DEFAULT_TENANT_ID,
    modules: ['rms', 'tms', 'ams'],
  },
  {
    id: 'elena-engineering',
    name: 'Elena Rossi',
    username: 'elena.engineering',
    password: 'engg@123',
    role: 'Engineering Manager',
    tenantId: DEFAULT_TENANT_ID,
    modules: ['rms', 'tms', 'sms'],
  },
  {
    id: 'liam-inventory',
    name: 'Liam Tan',
    username: 'liam.inventory',
    password: 'supply@123',
    role: 'Inventory & Procurement Manager',
    tenantId: DEFAULT_TENANT_ID,
    modules: ['ims', 'sms', 'oms', 'tms'],
  },
  {
    id: 'maya-fnb',
    name: 'Maya Fernandez',
    username: 'maya.fnb',
    password: 'dining@123',
    role: 'Food & Beverage Manager',
    tenantId: DEFAULT_TENANT_ID,
    modules: ['oms', 'ims', 'bms', 'tms'],
  },
  {
    id: 'eva-finance',
    name: 'Eva Singh',
    username: 'eva.finance',
    password: 'finance@123',
    role: 'Finance Controller',
    tenantId: DEFAULT_TENANT_ID,
    modules: ['bms', 'as'],
  },
  {
    id: 'hannah-hr',
    name: 'Hannah Nguyen',
    username: 'hannah.hr',
    password: 'people@123',
    role: 'HR Manager',
    tenantId: DEFAULT_TENANT_ID,
    modules: ['ams', 'tms'],
  },
  {
    id: 'isaac-it',
    name: 'Isaac Romero',
    username: 'isaac.it',
    password: 'systems@123',
    role: 'IT Systems Admin',
    tenantId: DEFAULT_TENANT_ID,
    modules: ['crs', 'rms', 'bms', 'as', 'tms'],
  },
]
