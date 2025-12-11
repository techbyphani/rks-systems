import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { MODULE_MAP, type ModuleId } from '@/config/modules'
import { TENANTS, type TenantPlan } from '@/config/tenants'
import { USERS, type UserProfile } from '@/config/users'

interface AppContextValue {
  tenant: TenantPlan | null
  user: UserProfile | null
  allowedModules: ModuleId[]
  isAuthenticated: boolean
  login: (userId: string, password: string) => { success: boolean; message?: string }
  logout: () => void
}

const SESSION_KEY = 'hotel-suite:user-id'

const AppContext = createContext<AppContextValue | undefined>(undefined)

const safeStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(SESSION_KEY)
  },
  set: (value: string) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SESSION_KEY, value)
  },
  clear: () => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(SESSION_KEY)
  },
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeUserId, setActiveUserId] = useState<string | null>(null)

  useEffect(() => {
    const stored = safeStorage.get()
    if (stored) {
      const exists = USERS.some((u) => u.id === stored)
      if (exists) {
        setActiveUserId(stored)
      } else {
        safeStorage.clear()
      }
    }
  }, [])

  const user = useMemo(
    () => (activeUserId ? USERS.find((candidate) => candidate.id === activeUserId) ?? null : null),
    [activeUserId]
  )

  const tenant = useMemo(
    () => (user ? TENANTS.find((t) => t.id === user.tenantId) ?? null : null),
    [user]
  )

  const allowedModules = useMemo<ModuleId[]>(() => {
    if (!tenant || !user) return []
    const tenantModules = tenant.modules
    const userModules = user.modules ?? tenantModules
    return tenantModules.filter((moduleId) => userModules.includes(moduleId))
  }, [tenant, user])

  const login = (userId: string, password: string) => {
    const candidate = USERS.find((u) => u.id === userId)
    if (!candidate) {
      return { success: false, message: 'Unknown user' }
    }
    if (candidate.password !== password) {
      return { success: false, message: 'Incorrect password' }
    }
    setActiveUserId(candidate.id)
    safeStorage.set(candidate.id)
    return { success: true }
  }

  const logout = () => {
    setActiveUserId(null)
    safeStorage.clear()
  }

  const value = useMemo<AppContextValue>(
    () => ({ tenant, user, allowedModules, isAuthenticated: !!user, login, logout }),
    [tenant, user, allowedModules]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

export function useModuleEnabled(moduleId: ModuleId) {
  const { allowedModules } = useAppContext()
  return allowedModules.includes(moduleId)
}

export function useModuleMeta(moduleId: ModuleId) {
  return MODULE_MAP[moduleId]
}
