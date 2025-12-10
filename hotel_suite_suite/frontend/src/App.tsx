import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'

import SuiteLayout from '@/components/layout/SuiteLayout'
import ProtectedRoute from '@/components/navigation/ProtectedRoute'
import OverviewPage from '@/pages/Overview'
import { AppProvider } from '@/context/AppContext'
import { MODULE_MAP } from '@/config/modules'
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
              <Route element={<SuiteLayout />}>
                <Route path="/suite" element={<Navigate to="/suite/overview" replace />} />
                <Route path="/suite/overview" element={<OverviewPage />} />
                <Route
                  path={MODULE_MAP.crs.path}
                  element={
                    <ProtectedRoute moduleId="crs">
                      <CRSDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={MODULE_MAP.rms.path}
                  element={
                    <ProtectedRoute moduleId="rms">
                      <RMSDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={MODULE_MAP.ims.path}
                  element={
                    <ProtectedRoute moduleId="ims">
                      <IMSDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={MODULE_MAP.oms.path}
                  element={
                    <ProtectedRoute moduleId="oms">
                      <OMSDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={MODULE_MAP.sms.path}
                  element={
                    <ProtectedRoute moduleId="sms">
                      <SMSDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={MODULE_MAP.bms.path}
                  element={
                    <ProtectedRoute moduleId="bms">
                      <BMSDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={MODULE_MAP.ams.path}
                  element={
                    <ProtectedRoute moduleId="ams">
                      <AMSDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={MODULE_MAP.tms.path}
                  element={
                    <ProtectedRoute moduleId="tms">
                      <TMSDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={MODULE_MAP.as.path}
                  element={
                    <ProtectedRoute moduleId="as">
                      <ASDashboard />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route path="/" element={<Navigate to="/suite/overview" replace />} />
              <Route path="*" element={<Navigate to="/suite/overview" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
        </AppProvider>
      </ConfigProvider>
    </HelmetProvider>
  )
}

export default App
