import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'

import SuiteLayout from '@/components/layout/SuiteLayout'
import ProtectedRoute from '@/components/navigation/ProtectedRoute'
import RequireAuth from '@/components/navigation/RequireAuth'
import LoginPage from '@/pages/login'
import { OperatorLayout, OperatorLogin, OperatorOverview, TenantsPage, TenantDetailPage, UserTemplatesPage } from '@/pages/operator'
import { AppProvider } from '@/context/AppContext'
import { NotificationProvider } from '@/context/NotificationContext'

// Module Dashboards
import {
  CRSDashboard,
  RMSDashboard,
  IMSDashboard,
  OMSDashboard,
  SMSDashboard,
  BMSDashboard,
  AMSDashboard,
  TMSDashboard,
  ASDashboard,
} from '@/modules'

// CRS Module Pages
import { GuestsPage, GuestDetailPage, ReservationsPage, ReservationDetailPage, CalendarPage } from '@/modules/crs/pages'

// RMS Module Pages
import { RoomsPage, RoomDetailPage, RoomTypesPage, HousekeepingPage, MaintenancePage } from '@/modules/rms/pages'

// BMS Module Pages
import { FoliosPage, FolioDetailPage, PaymentsPage, InvoicesPage, InvoiceDetailPage } from '@/modules/bms/pages'

// OMS Module Pages
import { OrdersPage, MenuPage } from '@/modules/oms/pages'

// IMS Module Pages
import { ItemsPage, CategoriesPage, VendorsPage as IMSVendorsPage, StockMovementsPage } from '@/modules/ims/pages'

// SMS Module Pages
import { VendorsPage, PurchaseOrdersPage } from '@/modules/sms/pages'

// AMS Module Pages
import { EmployeesPage, AttendancePage, LeavePage } from '@/modules/ams/pages'

// TMS Module Pages
import { TasksPage, MyTasksPage } from '@/modules/tms/pages'

// AS Module Pages
import { AccountsPage, TransactionsPage, ReportsPage } from '@/modules/as/pages'

// Overview
import OverviewPage from '@/pages/Overview'

// Hotel Admin Pages
import { UserManagementPage, HotelSettingsPage } from '@/pages/admin'

function App() {
  return (
    <HelmetProvider>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1e88e5',
            colorInfo: '#1e88e5',
            borderRadius: 8,
            colorSuccess: '#52c41a',
            colorWarning: '#faad14',
            colorError: '#ff4d4f',
          },
          components: {
            Menu: {
              itemSelectedBg: 'rgba(30, 136, 229, 0.3)',
              itemSelectedColor: '#fff',
              itemHoverBg: 'rgba(255, 255, 255, 0.1)',
              itemHoverColor: '#fff',
              subMenuItemBg: 'transparent',
              darkItemSelectedBg: 'rgba(30, 136, 229, 0.4)',
              darkItemSelectedColor: '#fff',
              darkItemHoverBg: 'rgba(255, 255, 255, 0.12)',
              darkSubMenuItemBg: 'transparent',
            },
          },
        }}
      >
        <AppProvider>
          <NotificationProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes - Login */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/login/:slug" element={<LoginPage />} />

              {/* Protected Suite Routes */}
              <Route element={<RequireAuth />}>
                <Route element={<SuiteLayout />}>
                  {/* Default redirect */}
                  <Route path="/suite" element={<Navigate to="/suite/overview" replace />} />
                  
                  {/* Overview */}
                  <Route path="/suite/overview" element={<OverviewPage />} />

                  {/* CRS - Customer Reservation System */}
                  <Route
                    path="/suite/crs/*"
                    element={
                      <ProtectedRoute moduleId="crs">
                        <Routes>
                          <Route index element={<CRSDashboard />} />
                          <Route path="guests" element={<GuestsPage />} />
                          <Route path="guests/:id" element={<GuestDetailPage />} />
                          <Route path="reservations" element={<ReservationsPage />} />
                          <Route path="reservations/:id" element={<ReservationDetailPage />} />
                          <Route path="calendar" element={<CalendarPage />} />
                        </Routes>
                      </ProtectedRoute>
                    }
                  />

                  {/* RMS - Rooms Management System */}
                  <Route
                    path="/suite/rms/*"
                    element={
                      <ProtectedRoute moduleId="rms">
                        <Routes>
                          <Route index element={<RMSDashboard />} />
                          <Route path="rooms" element={<RoomsPage />} />
                          <Route path="rooms/:id" element={<RoomDetailPage />} />
                          <Route path="room-types" element={<RoomTypesPage />} />
                          <Route path="housekeeping" element={<HousekeepingPage />} />
                          <Route path="maintenance" element={<MaintenancePage />} />
                        </Routes>
                      </ProtectedRoute>
                    }
                  />

                  {/* IMS - Inventory Management System */}
                  <Route
                    path="/suite/ims/*"
                    element={
                      <ProtectedRoute moduleId="ims">
                        <Routes>
                          <Route index element={<IMSDashboard />} />
                          <Route path="items" element={<ItemsPage />} />
                          <Route path="categories" element={<CategoriesPage />} />
                          <Route path="vendors" element={<IMSVendorsPage />} />
                          <Route path="movements" element={<StockMovementsPage />} />
                        </Routes>
                      </ProtectedRoute>
                    }
                  />

                  {/* OMS - Order Management System */}
                  <Route
                    path="/suite/oms/*"
                    element={
                      <ProtectedRoute moduleId="oms">
                        <Routes>
                          <Route index element={<OMSDashboard />} />
                          <Route path="orders" element={<OrdersPage />} />
                          <Route path="orders/:id" element={<OrdersPage />} />
                          <Route path="menu" element={<MenuPage />} />
                          <Route path="pos" element={<OMSDashboard />} />
                        </Routes>
                      </ProtectedRoute>
                    }
                  />

                  {/* SMS - Supply Management System */}
                  <Route
                    path="/suite/sms/*"
                    element={
                      <ProtectedRoute moduleId="sms">
                        <Routes>
                          <Route index element={<SMSDashboard />} />
                          <Route path="vendors" element={<VendorsPage />} />
                          <Route path="vendors/:id" element={<VendorsPage />} />
                          <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
                          <Route path="purchase-orders/:id" element={<PurchaseOrdersPage />} />
                          <Route path="deliveries" element={<SMSDashboard />} />
                        </Routes>
                      </ProtectedRoute>
                    }
                  />

                  {/* BMS - Billing Management System */}
                  <Route
                    path="/suite/bms/*"
                    element={
                      <ProtectedRoute moduleId="bms">
                        <Routes>
                          <Route index element={<BMSDashboard />} />
                          <Route path="folios" element={<FoliosPage />} />
                          <Route path="folios/:id" element={<FolioDetailPage />} />
                          <Route path="payments" element={<PaymentsPage />} />
                          <Route path="invoices" element={<InvoicesPage />} />
                          <Route path="invoices/:id" element={<InvoiceDetailPage />} />
                        </Routes>
                      </ProtectedRoute>
                    }
                  />

                  {/* AMS - Attendance Management System */}
                  <Route
                    path="/suite/ams/*"
                    element={
                      <ProtectedRoute moduleId="ams">
                        <Routes>
                          <Route index element={<AMSDashboard />} />
                          <Route path="employees" element={<EmployeesPage />} />
                          <Route path="employees/:id" element={<EmployeesPage />} />
                          <Route path="shifts" element={<AMSDashboard />} />
                          <Route path="attendance" element={<AttendancePage />} />
                          <Route path="leave" element={<LeavePage />} />
                        </Routes>
                      </ProtectedRoute>
                    }
                  />

                  {/* TMS - Task Management System */}
                  <Route
                    path="/suite/tms/*"
                    element={
                      <ProtectedRoute moduleId="tms">
                        <Routes>
                          <Route index element={<TMSDashboard />} />
                          <Route path="tasks" element={<TasksPage />} />
                          <Route path="tasks/:id" element={<TasksPage />} />
                          <Route path="my-tasks" element={<MyTasksPage />} />
                        </Routes>
                      </ProtectedRoute>
                    }
                  />

                  {/* AS - Accounting System */}
                  <Route
                    path="/suite/as/*"
                    element={
                      <ProtectedRoute moduleId="as">
                        <Routes>
                          <Route index element={<ASDashboard />} />
                          <Route path="accounts" element={<AccountsPage />} />
                          <Route path="transactions" element={<TransactionsPage />} />
                          <Route path="reports" element={<ReportsPage />} />
                        </Routes>
                      </ProtectedRoute>
                    }
                  />

                  {/* Hotel Admin Routes */}
                  <Route path="/suite/admin/users" element={<UserManagementPage />} />
                  <Route path="/suite/admin/settings" element={<HotelSettingsPage />} />
                </Route>
              </Route>

              {/* Operator Routes (SaaS Admin) */}
              <Route path="/operator/login" element={<OperatorLogin />} />
              <Route path="/operator" element={<Navigate to="/operator/login" replace />} />
              <Route element={<OperatorLayout />}>
                <Route path="/operator/overview" element={<OperatorOverview />} />
                <Route path="/operator/tenants" element={<TenantsPage />} />
                <Route path="/operator/tenants/:id" element={<TenantDetailPage />} />
                <Route path="/operator/users" element={<UserTemplatesPage />} />
              </Route>

              {/* Default Redirects */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
          </NotificationProvider>
        </AppProvider>
      </ConfigProvider>
    </HelmetProvider>
  )
}

export default App
