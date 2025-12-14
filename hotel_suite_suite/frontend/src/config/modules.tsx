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
  UserOutlined,
  ScheduleOutlined,
  TeamOutlined,
  FileTextOutlined,
  ShopOutlined,
  ToolOutlined,
  AlertOutlined,
  BankOutlined,
  CreditCardOutlined,
  ContainerOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import type { ModuleId } from '@/types'

export type { ModuleId }

export interface SubMenuItem {
  key: string
  label: string
  path: string
  icon?: ReactNode
}

export interface ModuleDefinition {
  id: ModuleId
  name: string
  shortName: string
  description: string
  icon: ReactNode
  path: string
  accent: string
  subMenu?: SubMenuItem[]
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
    subMenu: [
      { key: 'crs-dashboard', label: 'Dashboard', path: '/suite/crs', icon: <BookOutlined /> },
      { key: 'crs-guests', label: 'Guests', path: '/suite/crs/guests', icon: <UserOutlined /> },
      { key: 'crs-reservations', label: 'Reservations', path: '/suite/crs/reservations', icon: <ScheduleOutlined /> },
      { key: 'crs-calendar', label: 'Calendar', path: '/suite/crs/calendar', icon: <CalendarOutlined /> },
    ],
  },
  {
    id: 'rms',
    name: 'Rooms Management System',
    shortName: 'Rooms',
    description: 'Track room inventory, housekeeping, and occupancy readiness.',
    icon: <HomeOutlined />,
    path: '/suite/rms',
    accent: '#13c2c2',
    subMenu: [
      { key: 'rms-dashboard', label: 'Dashboard', path: '/suite/rms', icon: <HomeOutlined /> },
      { key: 'rms-rooms', label: 'Rooms', path: '/suite/rms/rooms', icon: <HomeOutlined /> },
      { key: 'rms-room-types', label: 'Room Types', path: '/suite/rms/room-types', icon: <ContainerOutlined /> },
      { key: 'rms-housekeeping', label: 'Housekeeping', path: '/suite/rms/housekeeping', icon: <TeamOutlined /> },
      { key: 'rms-maintenance', label: 'Maintenance', path: '/suite/rms/maintenance', icon: <ToolOutlined /> },
    ],
  },
  {
    id: 'ims',
    name: 'Inventory Management System',
    shortName: 'Inventory',
    description: 'Control stock levels, consumption, and reorder points.',
    icon: <InboxOutlined />,
    path: '/suite/ims',
    accent: '#a0d911',
    subMenu: [
      { key: 'ims-dashboard', label: 'Dashboard', path: '/suite/ims', icon: <InboxOutlined /> },
      { key: 'ims-items', label: 'Items', path: '/suite/ims/items', icon: <ContainerOutlined /> },
      { key: 'ims-categories', label: 'Categories', path: '/suite/ims/categories', icon: <InboxOutlined /> },
      { key: 'ims-alerts', label: 'Stock Alerts', path: '/suite/ims/stock-alerts', icon: <AlertOutlined /> },
    ],
  },
  {
    id: 'oms',
    name: 'Order Management System',
    shortName: 'Orders',
    description: 'Handle guest orders, room service workflows, and internal requests.',
    icon: <ShoppingCartOutlined />,
    path: '/suite/oms',
    accent: '#fa8c16',
    subMenu: [
      { key: 'oms-dashboard', label: 'Dashboard', path: '/suite/oms', icon: <ShoppingCartOutlined /> },
      { key: 'oms-orders', label: 'Orders', path: '/suite/oms/orders', icon: <FileTextOutlined /> },
      { key: 'oms-menu', label: 'Menu', path: '/suite/oms/menu', icon: <ShopOutlined /> },
      { key: 'oms-pos', label: 'POS', path: '/suite/oms/pos', icon: <ShoppingCartOutlined /> },
    ],
  },
  {
    id: 'sms',
    name: 'Supply Management System',
    shortName: 'Supplies',
    description: 'Coordinate vendors, deliveries, and procurement schedules.',
    icon: <TruckOutlined />,
    path: '/suite/sms',
    accent: '#722ed1',
    subMenu: [
      { key: 'sms-dashboard', label: 'Dashboard', path: '/suite/sms', icon: <TruckOutlined /> },
      { key: 'sms-vendors', label: 'Vendors', path: '/suite/sms/vendors', icon: <ShopOutlined /> },
      { key: 'sms-pos', label: 'Purchase Orders', path: '/suite/sms/purchase-orders', icon: <FileTextOutlined /> },
      { key: 'sms-deliveries', label: 'Deliveries', path: '/suite/sms/deliveries', icon: <TruckOutlined /> },
    ],
  },
  {
    id: 'bms',
    name: 'Billing Management System',
    shortName: 'Billing',
    description: 'Unify folios, invoices, settlements, and payment tracking.',
    icon: <DollarCircleOutlined />,
    path: '/suite/bms',
    accent: '#eb2f96',
    subMenu: [
      { key: 'bms-dashboard', label: 'Dashboard', path: '/suite/bms', icon: <DollarCircleOutlined /> },
      { key: 'bms-folios', label: 'Folios', path: '/suite/bms/folios', icon: <FileTextOutlined /> },
      { key: 'bms-payments', label: 'Payments', path: '/suite/bms/payments', icon: <CreditCardOutlined /> },
      { key: 'bms-invoices', label: 'Invoices', path: '/suite/bms/invoices', icon: <FileTextOutlined /> },
    ],
  },
  {
    id: 'ams',
    name: 'Attendance Management System',
    shortName: 'Attendance',
    description: 'Capture staff check-ins, leave, and roster compliance.',
    icon: <CalendarOutlined />,
    path: '/suite/ams',
    accent: '#fa541c',
    subMenu: [
      { key: 'ams-dashboard', label: 'Dashboard', path: '/suite/ams', icon: <CalendarOutlined /> },
      { key: 'ams-employees', label: 'Employees', path: '/suite/ams/employees', icon: <TeamOutlined /> },
      { key: 'ams-shifts', label: 'Shifts', path: '/suite/ams/shifts', icon: <ScheduleOutlined /> },
      { key: 'ams-attendance', label: 'Attendance', path: '/suite/ams/attendance', icon: <CalendarOutlined /> },
      { key: 'ams-leave', label: 'Leave Requests', path: '/suite/ams/leave', icon: <FileTextOutlined /> },
    ],
  },
  {
    id: 'tms',
    name: 'Task Management System',
    shortName: 'Tasks',
    description: 'Assign, track, and escalate operational tasks across teams.',
    icon: <CheckSquareOutlined />,
    path: '/suite/tms',
    accent: '#52c41a',
    subMenu: [
      { key: 'tms-dashboard', label: 'Dashboard', path: '/suite/tms', icon: <CheckSquareOutlined /> },
      { key: 'tms-tasks', label: 'All Tasks', path: '/suite/tms/tasks', icon: <FileTextOutlined /> },
      { key: 'tms-my-tasks', label: 'My Tasks', path: '/suite/tms/my-tasks', icon: <UserOutlined /> },
    ],
  },
  {
    id: 'as',
    name: 'Accounting System',
    shortName: 'Accounting',
    description: 'Summaries for revenue, expenses, ledgers, and audits.',
    icon: <AccountBookOutlined />,
    path: '/suite/as',
    accent: '#08979c',
    subMenu: [
      { key: 'as-dashboard', label: 'Dashboard', path: '/suite/as', icon: <AccountBookOutlined /> },
      { key: 'as-accounts', label: 'Chart of Accounts', path: '/suite/as/accounts', icon: <BankOutlined /> },
      { key: 'as-transactions', label: 'Transactions', path: '/suite/as/transactions', icon: <FileTextOutlined /> },
      { key: 'as-reports', label: 'Reports', path: '/suite/as/reports', icon: <FileTextOutlined /> },
    ],
  },
]

export const MODULE_MAP = MODULES.reduce<Record<ModuleId, ModuleDefinition>>(
  (acc, module) => {
    acc[module.id] = module
    return acc
  },
  {} as Record<ModuleId, ModuleDefinition>
)

// Get all sub-menu items for a module
export const getModuleSubMenu = (moduleId: ModuleId) => {
  return MODULE_MAP[moduleId]?.subMenu || []
}
