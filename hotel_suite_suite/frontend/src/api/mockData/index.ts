// ============================================================
// MOCK DATA INDEX - Central export for all mock data
// ============================================================

// Room Types & Rooms
export { mockRoomTypes } from './roomTypes';
export { mockRooms, getRoomStatusCounts } from './rooms';

// Guests
export { mockGuests } from './guests';

// Reservations
export { mockReservations } from './reservations';

// Employees & Shifts
export { mockEmployees, mockShifts } from './employees';

// Inventory, Vendors, Categories
export { 
  mockInventoryItems, 
  mockInventoryCategories, 
  mockVendors,
  getLowStockItems,
} from './inventory';

// Tasks
export { 
  mockTasks, 
  getTasksByStatus, 
  getTodaysTasks, 
  getOverdueTasks,
} from './tasks';

// Orders, Menu Items, Menus
export { 
  mockOrders, 
  mockMenuItems, 
  mockMenus,
  getTodaysOrders,
  getPendingOrders,
} from './orders';

// Billing - Folios, Payments, Invoices
export { 
  mockFolios, 
  mockPayments, 
  mockInvoices,
  getBillingMetrics,
  getPaymentMethodBreakdown,
} from './billing';
