import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'

import SuiteLayout from '@/components/layout/SuiteLayout'
import ProtectedRoute from '@/components/navigation/ProtectedRoute'
import RequireAuth from '@/components/navigation/RequireAuth'
import LoginPage from '@/pages/login'
import { OperatorLayout, OperatorOverview, TenantsPage, UserTemplatesPage } from '@/pages/operator'
import { AppProvider } from '@/context/AppContext'

// Module Dashboards (existing)
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

// Overview
import OverviewPage from '@/pages/Overview'

function App() {
  return (
    <HelmetProvider>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
          },
        }}
      >
        <AppProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />

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
                          <Route path="guests" element={<CRSDashboard />} />
                          <Route path="guests/:id" element={<CRSDashboard />} />
                          <Route path="reservations" element={<CRSDashboard />} />
                          <Route path="reservations/:id" element={<CRSDashboard />} />
                          <Route path="calendar" element={<CRSDashboard />} />
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
                          <Route path="rooms" element={<RMSDashboard />} />
                          <Route path="rooms/:id" element={<RMSDashboard />} />
                          <Route path="room-types" element={<RMSDashboard />} />
                          <Route path="housekeeping" element={<RMSDashboard />} />
                          <Route path="maintenance" element={<RMSDashboard />} />
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
                          <Route path="items" element={<IMSDashboard />} />
                          <Route path="items/:id" element={<IMSDashboard />} />
                          <Route path="categories" element={<IMSDashboard />} />
                          <Route path="stock-alerts" element={<IMSDashboard />} />
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
                          <Route path="orders" element={<OMSDashboard />} />
                          <Route path="orders/:id" element={<OMSDashboard />} />
                          <Route path="menu" element={<OMSDashboard />} />
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
                          <Route path="vendors" element={<SMSDashboard />} />
                          <Route path="vendors/:id" element={<SMSDashboard />} />
                          <Route path="purchase-orders" element={<SMSDashboard />} />
                          <Route path="purchase-orders/:id" element={<SMSDashboard />} />
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
                          <Route path="folios" element={<BMSDashboard />} />
                          <Route path="folios/:id" element={<BMSDashboard />} />
                          <Route path="payments" element={<BMSDashboard />} />
                          <Route path="invoices" element={<BMSDashboard />} />
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
                          <Route path="employees" element={<AMSDashboard />} />
                          <Route path="employees/:id" element={<AMSDashboard />} />
                          <Route path="shifts" element={<AMSDashboard />} />
                          <Route path="attendance" element={<AMSDashboard />} />
                          <Route path="leave" element={<AMSDashboard />} />
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
                          <Route path="tasks" element={<TMSDashboard />} />
                          <Route path="tasks/:id" element={<TMSDashboard />} />
                          <Route path="my-tasks" element={<TMSDashboard />} />
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
                          <Route path="accounts" element={<ASDashboard />} />
                          <Route path="transactions" element={<ASDashboard />} />
                          <Route path="reports" element={<ASDashboard />} />
                        </Routes>
                      </ProtectedRoute>
                    }
                  />
                </Route>
              </Route>

              {/* Operator Routes (SaaS Admin) */}
              <Route element={<OperatorLayout />}>
                <Route path="/operator" element={<Navigate to="/operator/overview" replace />} />
                <Route path="/operator/overview" element={<OperatorOverview />} />
                <Route path="/operator/tenants" element={<TenantsPage />} />
                <Route path="/operator/users" element={<UserTemplatesPage />} />
              </Route>

              {/* Default Redirects */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
        </AppProvider>
      </ConfigProvider>
    </HelmetProvider>
  )
}

export default App
