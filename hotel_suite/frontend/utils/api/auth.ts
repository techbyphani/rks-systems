import apiClient from './client'
import { LoginRequest, LoginResponse, User } from '@/types'
import Cookies from 'js-cookie'

export const authApi = {
  // Login user
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', credentials)
    const { token, role } = response.data
    
    // Store token and role in cookies
    Cookies.set('token', token, { expires: 1 }) // 1 day
    Cookies.set('role', role, { expires: 1 })
    
    return response.data
  },

  // Register new user (admin only)
  register: async (userData: { username: string; password: string; role: string }): Promise<User> => {
    const response = await apiClient.post('/auth/register', userData)
    return response.data
  },

  // Logout user
  logout: () => {
    Cookies.remove('token')
    Cookies.remove('role')
    window.location.href = '/login'
  },

  // Get current user role
  getCurrentRole: (): string | null => {
    return Cookies.get('role') || null
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!Cookies.get('token')
  },

  // Check if user has specific role
  hasRole: (role: string): boolean => {
    const userRole = Cookies.get('role')
    return userRole === role
  },
}