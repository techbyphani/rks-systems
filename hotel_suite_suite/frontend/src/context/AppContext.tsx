import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { tenantService, tenantUserService } from '@/api';
import type { Tenant, TenantUser, ModuleId } from '@/types';

// ============================================================
// TYPES
// ============================================================

export type UserType = 'operator' | 'hotel_user';

interface AuthState {
  userType: UserType | null;
  tenant: Tenant | null;
  user: TenantUser | null;
}

interface LoginResult {
  success: boolean;
  message?: string;
}

interface AppContextValue {
  // Auth state
  isAuthenticated: boolean;
  isOperator: boolean;
  userType: UserType | null;
  
  // Tenant & User
  tenant: Tenant | null;
  user: TenantUser | null;
  
  // Module access (effective - intersection of tenant and user access)
  allowedModules: ModuleId[];
  
  // Auth methods
  loginAsOperator: () => Promise<LoginResult>;
  loginAsHotelUser: (tenantId: string, userId: string) => Promise<LoginResult>;
  logout: () => void;
  
  // Data loading
  loadTenants: () => Promise<Tenant[]>;
  loadTenantUsers: (tenantId: string) => Promise<TenantUser[]>;
}

// ============================================================
// STORAGE
// ============================================================

const STORAGE_KEY = 'hotel-suite:auth';

interface StoredAuth {
  userType: UserType;
  tenantId?: string;
  userId?: string;
}

const safeStorage = {
  get: (): StoredAuth | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },
  set: (value: StoredAuth) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STORAGE_KEY);
  },
};

// ============================================================
// CONTEXT
// ============================================================

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    userType: null,
    tenant: null,
    user: null,
  });
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const stored = safeStorage.get();
      if (!stored) {
        setLoading(false);
        return;
      }

      try {
        if (stored.userType === 'operator') {
          setAuthState({ userType: 'operator', tenant: null, user: null });
        } else if (stored.userType === 'hotel_user' && stored.tenantId && stored.userId) {
          const [tenant, user] = await Promise.all([
            tenantService.getById(stored.tenantId),
            tenantUserService.getById(stored.userId),
          ]);

          if (tenant && user && user.isActive && tenant.status !== 'suspended') {
            setAuthState({ userType: 'hotel_user', tenant, user });
          } else {
            safeStorage.clear();
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        safeStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Computed values
  const isAuthenticated = authState.userType !== null;
  const isOperator = authState.userType === 'operator';

  const allowedModules = useMemo<ModuleId[]>(() => {
    if (!authState.tenant || !authState.user) return [];
    
    // User can only access modules that are:
    // 1. Enabled for the tenant (by operator)
    // 2. Assigned to the user (by hotel admin)
    return authState.user.moduleAccess.filter(m => 
      authState.tenant!.enabledModules.includes(m)
    );
  }, [authState.tenant, authState.user]);

  // Auth methods
  const loginAsOperator = useCallback(async (): Promise<LoginResult> => {
    // In a real app, this would validate operator credentials
    setAuthState({ userType: 'operator', tenant: null, user: null });
    safeStorage.set({ userType: 'operator' });
    return { success: true };
  }, []);

  const loginAsHotelUser = useCallback(async (
    tenantId: string, 
    userId: string
  ): Promise<LoginResult> => {
    try {
      const [tenant, user] = await Promise.all([
        tenantService.getById(tenantId),
        tenantUserService.getById(userId),
      ]);

      if (!tenant) {
        return { success: false, message: 'Hotel not found' };
      }

      if (tenant.status === 'suspended') {
        return { success: false, message: 'This hotel account is suspended' };
      }

      if (tenant.status === 'cancelled') {
        return { success: false, message: 'This hotel account has been cancelled' };
      }

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (!user.isActive) {
        return { success: false, message: 'Your account is inactive. Please contact your administrator.' };
      }

      setAuthState({ userType: 'hotel_user', tenant, user });
      safeStorage.set({ userType: 'hotel_user', tenantId, userId });
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    setAuthState({ userType: null, tenant: null, user: null });
    safeStorage.clear();
  }, []);

  // Data loading helpers
  const loadTenants = useCallback(async (): Promise<Tenant[]> => {
    const result = await tenantService.getAll({ 
      status: 'active', 
      pageSize: 100 
    });
    // Also include trial tenants
    const trialResult = await tenantService.getAll({ 
      status: 'trial', 
      pageSize: 100 
    });
    return [...result.data, ...trialResult.data];
  }, []);

  const loadTenantUsers = useCallback(async (tenantId: string): Promise<TenantUser[]> => {
    const result = await tenantUserService.getAll({ 
      tenantId, 
      isActive: true,
      pageSize: 100 
    });
    return result.data;
  }, []);

  // Context value
  const value = useMemo<AppContextValue>(() => ({
    isAuthenticated,
    isOperator,
    userType: authState.userType,
    tenant: authState.tenant,
    user: authState.user,
    allowedModules,
    loginAsOperator,
    loginAsHotelUser,
    logout,
    loadTenants,
    loadTenantUsers,
  }), [
    isAuthenticated,
    isOperator,
    authState,
    allowedModules,
    loginAsOperator,
    loginAsHotelUser,
    logout,
    loadTenants,
    loadTenantUsers,
  ]);

  // Show nothing while restoring session
  if (loading) {
    return null;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ============================================================
// HOOKS
// ============================================================

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export function useModuleEnabled(moduleId: ModuleId) {
  const { allowedModules } = useAppContext();
  return allowedModules.includes(moduleId);
}

export function useIsHotelAdmin() {
  const { user } = useAppContext();
  return user?.role === 'hotel_admin';
}

export function useCanManageUsers() {
  const { user } = useAppContext();
  return user?.role === 'hotel_admin' || user?.role === 'manager';
}
