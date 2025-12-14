import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppContext } from '@/context/AppContext'

export default function RequireAuth() {
  const { isAuthenticated, isOperator } = useAppContext()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // Operators shouldn't access suite routes
  if (isOperator && location.pathname.startsWith('/suite')) {
    return <Navigate to="/operator/overview" replace />
  }

  return <Outlet />
}
