import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { MODULE_MAP, type ModuleId } from '@/config/modules'
import { TENANTS, type TenantPlan } from '@/config/tenants'
import { USERS, type UserProfile } from '@/config/users'

interface AppContextValue {
  tenant: TenantPlan
  user: UserProfile
  allowedModules: ModuleId[]
  switchTenant: (tenantId: string) => void
  switchUser: (userId: string) => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantId] = useState(TENANTS[0].id)
  const [userId, setUserId] = useState(
    USERS.find((user) => user.tenantId === tenantId)?.id ?? USERS[0].id
  )

  const tenant = useMemo(() => TENANTS.find((t) => t.id === tenantId) ?? TENANTS[0], [tenantId])

  const user = useMemo(() => {
    const fallbackUser = USERS.find((u) => u.tenantId === tenant.id) ?? USERS[0]
    if (userId && fallbackUser.tenantId === tenant.id) {
      return USERS.find((u) => u.id === userId) ?? fallbackUser
    }
    return fallbackUser
  }, [tenant.id, userId])

  const allowedModules = useMemo<ModuleId[]>(() => {
    const tenantModules = tenant.modules
    const userModules = user.modules ?? tenantModules
    return tenantModules.filter((moduleId) => userModules.includes(moduleId))
  }, [tenant.modules, user.modules])

  const switchTenant = (nextTenantId: string) => {
    if (tenantId === nextTenantId) return
    setTenantId(nextTenantId)
    const tenantUsers = USERS.filter((u) => u.tenantId === nextTenantId)
    setUserId(tenantUsers[0]?.id ?? '')
  }

  const switchUser = (nextUserId: string) => {
    const candidate = USERS.find((u) => u.id === nextUserId)
    if (!candidate) return
    if (candidate.tenantId !== tenantId) {
      setTenantId(candidate.tenantId)
    }
    setUserId(candidate.id)
  }

  const value = useMemo<AppContextValue>(
    () => ({ tenant, user, allowedModules, switchTenant, switchUser }),
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
