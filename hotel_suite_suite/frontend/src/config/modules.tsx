import {
  BookOutlined,
  HomeOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
  DollarCircleOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  AccountBookOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

export type ModuleId =
  | 'crs'
  | 'rms'
  | 'ims'
  | 'oms'
  | 'sms'
  | 'bms'
  | 'ams'
  | 'tms'
  | 'as'

export interface ModuleDefinition {
  id: ModuleId
  name: string
  shortName: string
  description: string
  icon: ReactNode
  path: string
  accent: string
}

export const MODULES: ModuleDefinition[] = [
  {
    id: 'crs',
    name: 'Customer Reservation System',
    shortName: 'Reservations',
    description: 'Manage guest reservations, inquiries, and channel performance.',
    icon: <BookOutlined />,
    path: '/suite/crs',
    accent: '#1677ff',
  },
  {
    id: 'rms',
    name: 'Rooms Management System',
    shortName: 'Rooms',
    description: 'Track room inventory, housekeeping, and occupancy readiness.',
    icon: <HomeOutlined />,
    path: '/suite/rms',
    accent: '#13c2c2',
  },
  {
    id: 'ims',
    name: 'Inventory Management System',
    shortName: 'Inventory',
    description: 'Control stock levels, consumption, and reorder points.',
    icon: <InboxOutlined />,
    path: '/suite/ims',
    accent: '#a0d911',
  },
  {
    id: 'oms',
    name: 'Order Management System',
    shortName: 'Orders',
    description: 'Handle guest orders, room service workflows, and internal requests.',
    icon: <ShoppingCartOutlined />,
    path: '/suite/oms',
    accent: '#fa8c16',
  },
  {
    id: 'sms',
    name: 'Supply Management System',
    shortName: 'Supplies',
    description: 'Coordinate vendors, deliveries, and procurement schedules.',
    icon: <TruckOutlined />,
    path: '/suite/sms',
    accent: '#722ed1',
  },
  {
    id: 'bms',
    name: 'Billing Management System',
    shortName: 'Billing',
    description: 'Unify folios, invoices, settlements, and payment tracking.',
    icon: <DollarCircleOutlined />,
    path: '/suite/bms',
    accent: '#eb2f96',
  },
  {
    id: 'ams',
    name: 'Attendance Management System',
    shortName: 'Attendance',
    description: 'Capture staff check-ins, leave, and roster compliance.',
    icon: <CalendarOutlined />,
    path: '/suite/ams',
    accent: '#fa541c',
  },
  {
    id: 'tms',
    name: 'Task Management System',
    shortName: 'Tasks',
    description: 'Assign, track, and escalate operational tasks across teams.',
    icon: <CheckSquareOutlined />,
    path: '/suite/tms',
    accent: '#52c41a',
  },
  {
    id: 'as',
    name: 'Accounting System',
    shortName: 'Accounting',
    description: 'Summaries for revenue, expenses, ledgers, and audits.',
    icon: <AccountBookOutlined />,
    path: '/suite/as',
    accent: '#08979c',
  },
]

export const MODULE_MAP = MODULES.reduce<Record<ModuleId, ModuleDefinition>>(
  (acc, module) => {
    acc[module.id] = module
    return acc
  },
  {} as Record<ModuleId, ModuleDefinition>
)
