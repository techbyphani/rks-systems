import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'

// Public pages
import Home from '@/pages/index'
import Login from '@/pages/login'
import Rooms from '@/pages/rooms'
import Contact from '@/pages/contact'
import Events from '@/pages/events'
import Gallery from '@/pages/gallery'
import Restaurant from '@/pages/restaurant'

// Admin pages
import AdminDashboard from '@/pages/admin/index'
import AdminBookings from '@/pages/admin/bookings'
import AdminGuests from '@/pages/admin/guests'
import AdminRooms from '@/pages/admin/rooms'
import AdminUsers from '@/pages/admin/users'
import AdminBills from '@/pages/admin/bills'
import AdminFeedback from '@/pages/admin/feedback'
import AdminOffers from '@/pages/admin/offers'
import AdminPricing from '@/pages/admin/pricing'
import AdminAnalytics from '@/pages/admin/analytics'
import AdminGallery from '@/pages/admin/gallery'

// Reception pages
import ReceptionDashboard from '@/pages/reception/index'
import ReceptionBookings from '@/pages/reception/bookings'
import ReceptionCheckin from '@/pages/reception/checkin'
import ReceptionCheckout from '@/pages/reception/checkout'
import ReceptionGuests from '@/pages/reception/guests'
import ReceptionRooms from '@/pages/reception/rooms'
import ReceptionBills from '@/pages/reception/bills'
import ReceptionFeedback from '@/pages/reception/feedback'

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
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/events" element={<Events />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/restaurant" element={<Restaurant />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/guests" element={<AdminGuests />} />
            <Route path="/admin/rooms" element={<AdminRooms />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/bills" element={<AdminBills />} />
            <Route path="/admin/feedback" element={<AdminFeedback />} />
            <Route path="/admin/offers" element={<AdminOffers />} />
            <Route path="/admin/pricing" element={<AdminPricing />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/gallery" element={<AdminGallery />} />

            {/* Reception routes */}
            <Route path="/reception" element={<ReceptionDashboard />} />
            <Route path="/reception/bookings" element={<ReceptionBookings />} />
            <Route path="/reception/checkin" element={<ReceptionCheckin />} />
            <Route path="/reception/checkout" element={<ReceptionCheckout />} />
            <Route path="/reception/guests" element={<ReceptionGuests />} />
            <Route path="/reception/rooms" element={<ReceptionRooms />} />
            <Route path="/reception/bills" element={<ReceptionBills />} />
            <Route path="/reception/feedback" element={<ReceptionFeedback />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </ConfigProvider>
    </HelmetProvider>
  )
}

export default App

