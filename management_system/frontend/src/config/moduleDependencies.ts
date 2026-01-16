/**
 * Module Dependencies Configuration
 * 
 * STRICT RULES:
 * - When enabling a module, all its dependencies are auto-enabled
 * - Cannot disable a module if others depend on it
 * - This prevents broken configurations at the operator level
 */

import type { ModuleId } from '@/types';

// ============================================================
// DEPENDENCY DEFINITIONS
// ============================================================

/**
 * STRICT Dependency Map
 * Key: Module ID
 * Value: Array of modules that MUST be enabled for this module to work
 */
export const MODULE_REQUIRES: Record<ModuleId, ModuleId[]> = {
  // RMS is the base - rooms are fundamental
  rms: [],
  
  // CRS needs rooms to make reservations
  crs: ['rms'],
  
  // BMS is standalone - can work with just guests (no reservations needed)
  // reservationId is optional in folios, enabling customer billing without hotel operations
  bms: [],
  
  // IMS is standalone - inventory base
  ims: [],
  
  // OMS needs inventory for menu items
  // BMS is optional - charge-to-folio feature works if BMS is enabled
  oms: ['ims'],
  
  // SMS needs inventory to update stock
  sms: ['ims'],
  
  // AMS is standalone
  ams: [],
  
  // TMS is standalone
  tms: [],
  
  // AS needs billing (which needs reservations, which needs rooms)
  as: ['bms', 'crs', 'rms'],
};

/**
 * Reverse dependency map - who depends on me?
 * Used to check if we can disable a module
 */
export const MODULE_REQUIRED_BY: Record<ModuleId, ModuleId[]> = {
  rms: ['crs', 'as'],         // Can't disable RMS if CRS or AS is enabled (BMS no longer requires RMS)
  crs: ['as'],                // Can't disable CRS if AS is enabled (BMS no longer requires CRS)
  bms: ['as'],                // Can't disable BMS if AS is enabled
  ims: ['oms', 'sms'],        // Can't disable IMS if OMS or SMS is enabled
  oms: [],                    // Nothing depends on OMS (BMS is now optional for OMS)
  sms: [],                    // Nothing depends on SMS
  ams: [],                    // Nothing depends on AMS
  tms: [],                    // Nothing depends on TMS
  as: [],                     // Nothing depends on AS
};

// ============================================================
// MODULE METADATA
// ============================================================

export interface ModuleInfo {
  id: ModuleId;
  name: string;
  shortName: string;
  description: string;
  requires: ModuleId[];
  requiredBy: ModuleId[];
  isBase: boolean;  // Can be enabled alone
}

export const MODULE_DETAILS: Record<ModuleId, ModuleInfo> = {
  rms: {
    id: 'rms',
    name: 'Room Management System',
    shortName: 'Rooms',
    description: 'Room inventory, housekeeping, and maintenance',
    requires: [],
    requiredBy: ['crs', 'as'],  // BMS no longer requires RMS
    isBase: true,
  },
  crs: {
    id: 'crs',
    name: 'Customer Reservation System',
    shortName: 'Reservations',
    description: 'Guest profiles, bookings, check-in/out',
    requires: ['rms'],
    requiredBy: ['as'],  // BMS no longer requires CRS
    isBase: false,
  },
  bms: {
    id: 'bms',
    name: 'Billing Management System',
    shortName: 'Billing',
    description: 'Folios, payments, invoices (works standalone or with hotel operations)',
    requires: [],
    requiredBy: ['as'],
    isBase: true,
  },
  ims: {
    id: 'ims',
    name: 'Inventory Management System',
    shortName: 'Inventory',
    description: 'Stock tracking and management',
    requires: [],
    requiredBy: ['oms', 'sms'],
    isBase: true,
  },
  oms: {
    id: 'oms',
    name: 'Order Management System',
    shortName: 'Orders',
    description: 'Restaurant, room service, POS',
    requires: ['ims'],  // BMS is optional - charge-to-folio feature works if BMS is enabled
    requiredBy: [],
    isBase: false,
  },
  sms: {
    id: 'sms',
    name: 'Supply Management System',
    shortName: 'Supply',
    description: 'Vendors and purchase orders',
    requires: ['ims'],
    requiredBy: [],
    isBase: false,
  },
  ams: {
    id: 'ams',
    name: 'Attendance Management System',
    shortName: 'Attendance',
    description: 'Employee attendance and shifts',
    requires: [],
    requiredBy: [],
    isBase: true,
  },
  tms: {
    id: 'tms',
    name: 'Task Management System',
    shortName: 'Tasks',
    description: 'Task assignment and tracking',
    requires: [],
    requiredBy: [],
    isBase: true,
  },
  as: {
    id: 'as',
    name: 'Accounting System',
    shortName: 'Accounting',
    description: 'Financial accounts and reports',
    requires: ['bms', 'crs', 'rms'],
    requiredBy: [],
    isBase: false,
  },
};

// ============================================================
// MODULE BUNDLES (Pre-configured sets)
// ============================================================

export interface ModuleBundle {
  id: string;
  name: string;
  description: string;
  modules: ModuleId[];
  useCase: string;
  recommended?: boolean;
}

export const MODULE_BUNDLES: ModuleBundle[] = [
  // ============================================================
  // CORE HOTEL BUNDLES
  // ============================================================
  {
    id: 'rooms-only',
    name: 'Rooms Only',
    description: 'Room inventory, housekeeping, and maintenance only',
    modules: ['rms'],
    useCase: 'Property management without reservations (maintenance-only operations)',
  },
  {
    id: 'basic-hotel',
    name: 'Basic Property',
    description: 'Reservations + Rooms (no billing system)',
    modules: ['crs', 'rms'],
    useCase: 'Simple guesthouse, B&B, or hostel with manual billing',
  },
  {
    id: 'essential-hotel',
    name: 'Essential Hotel',
    description: 'Full booking flow with billing (RMS + CRS + BMS)',
    modules: ['crs', 'rms', 'bms'],
    useCase: 'Standard hotels - reservations, rooms, billing (covers 80% of hotels)',
    recommended: true,
  },
  
  // ============================================================
  // F&B BUNDLES
  // ============================================================
  {
    id: 'hotel-with-restaurant',
    name: 'Hotel + Restaurant',
    description: 'Essential hotel with F&B operations',
    modules: ['crs', 'rms', 'bms', 'oms', 'ims'],
    useCase: 'Hotels with restaurant, room service, or bar (auto-charge to folio)',
    recommended: true,
  },
  {
    id: 'standalone-restaurant',
    name: 'Standalone Restaurant',
    description: 'Restaurant/POS system (no hotel operations)',
    modules: ['ims', 'oms'],
    useCase: 'Independent restaurants, cafes, bars (Note: If BMS needed, use "Hotel + Restaurant" bundle instead)',
  },
  
  // ============================================================
  // INVENTORY & SUPPLY BUNDLES
  // ============================================================
  {
    id: 'hotel-with-supply',
    name: 'Hotel + Supply Chain',
    description: 'Essential hotel with inventory & purchase management',
    modules: ['crs', 'rms', 'bms', 'ims', 'sms'],
    useCase: 'Hotels managing their own inventory and vendor relationships',
  },
  {
    id: 'inventory-only',
    name: 'Inventory Only',
    description: 'Standalone inventory management',
    modules: ['ims'],
    useCase: 'Warehouses, stores, or inventory-only operations',
  },
  
  // ============================================================
  // STAFF MANAGEMENT BUNDLES
  // ============================================================
  {
    id: 'hotel-with-staff',
    name: 'Hotel + Staff Management',
    description: 'Essential hotel with employee & task management',
    modules: ['crs', 'rms', 'bms', 'ams', 'tms'],
    useCase: 'Hotels with structured employee attendance and task tracking',
  },
  {
    id: 'staff-management-only',
    name: 'Staff Management Only',
    description: 'Employee attendance and task management',
    modules: ['ams', 'tms'],
    useCase: 'Service companies or facilities with HR needs',
  },
  
  // ============================================================
  // ACCOUNTING BUNDLES
  // ============================================================
  {
    id: 'hotel-with-accounting',
    name: 'Hotel + Accounting',
    description: 'Essential hotel with financial reporting',
    modules: ['crs', 'rms', 'bms', 'as'],
    useCase: 'Hotels requiring financial accounts, P&L reports, and revenue analytics',
  },
  
  // ============================================================
  // ENTERPRISE BUNDLES
  // ============================================================
  {
    id: 'complete-operations',
    name: 'Complete Operations',
    description: 'Full hotel operations (all except accounting)',
    modules: ['crs', 'rms', 'bms', 'oms', 'ims', 'sms', 'ams', 'tms'],
    useCase: 'Mid-size hotels (50-200 rooms) with full operational control',
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise Suite',
    description: 'All modules - complete ecosystem',
    modules: ['crs', 'rms', 'bms', 'oms', 'ims', 'sms', 'ams', 'tms', 'as'],
    useCase: 'Large properties (200+ rooms) or hotel chains with full financial control',
    recommended: true,
  },
  {
    id: 'restaurant-billing-supply',
    name: 'Restaurant + Billing + Supply',
    description: 'Full restaurant operations with supply chain',
    modules: ['ims', 'oms', 'bms', 'sms'],
    useCase: 'Restaurants managing inventory, orders, billing, and vendor relationships',
  },
  {
    id: 'restaurant-billing-staff',
    name: 'Restaurant + Billing + Staff',
    description: 'Restaurant operations with staff management',
    modules: ['ims', 'oms', 'bms', 'ams', 'tms'],
    useCase: 'Restaurants with employee attendance and task tracking',
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get all modules that will be auto-enabled when enabling a module
 * Returns the module + all its dependencies (recursively)
 */
export function getModulesWithDependencies(moduleId: ModuleId): ModuleId[] {
  const result = new Set<ModuleId>([moduleId]);
  
  const addDependencies = (id: ModuleId) => {
    const deps = MODULE_REQUIRES[id];
    for (const dep of deps) {
      if (!result.has(dep)) {
        result.add(dep);
        addDependencies(dep); // Recursive for transitive deps
      }
    }
  };
  
  addDependencies(moduleId);
  return Array.from(result);
}

/**
 * Get all modules that will be auto-enabled when enabling multiple modules
 */
export function expandModuleSelection(modules: ModuleId[]): ModuleId[] {
  const result = new Set<ModuleId>();
  
  for (const moduleId of modules) {
    const withDeps = getModulesWithDependencies(moduleId);
    withDeps.forEach(m => result.add(m));
  }
  
  return Array.from(result);
}

/**
 * Check if a module can be disabled given current selection
 * Returns { canDisable, blockedBy } 
 */
export function canDisableModule(
  moduleId: ModuleId, 
  currentModules: ModuleId[]
): { canDisable: boolean; blockedBy: ModuleId[] } {
  const blockedBy: ModuleId[] = [];
  
  // Check which enabled modules depend on this one
  for (const otherId of currentModules) {
    if (otherId === moduleId) continue;
    
    const deps = MODULE_REQUIRES[otherId];
    if (deps.includes(moduleId)) {
      blockedBy.push(otherId);
    }
  }
  
  return {
    canDisable: blockedBy.length === 0,
    blockedBy,
  };
}

/**
 * Get modules that would also be disabled (cascade)
 * When disabling a base module, dependent modules must also be disabled
 */
export function getCascadeDisable(
  moduleId: ModuleId, 
  currentModules: ModuleId[]
): ModuleId[] {
  const toDisable = new Set<ModuleId>([moduleId]);
  
  const findDependents = (id: ModuleId) => {
    for (const otherId of currentModules) {
      if (toDisable.has(otherId)) continue;
      
      const deps = MODULE_REQUIRES[otherId];
      if (deps.includes(id)) {
        toDisable.add(otherId);
        findDependents(otherId); // Recursive
      }
    }
  };
  
  findDependents(moduleId);
  return Array.from(toDisable);
}

/**
 * Validate a module configuration
 */
export function validateModuleConfiguration(modules: ModuleId[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (modules.length === 0) {
    errors.push('At least one module must be enabled');
    return { valid: false, errors };
  }
  
  for (const moduleId of modules) {
    const required = MODULE_REQUIRES[moduleId];
    for (const dep of required) {
      if (!modules.includes(dep)) {
        const info = MODULE_DETAILS[moduleId];
        const depInfo = MODULE_DETAILS[dep];
        errors.push(`${info.shortName} requires ${depInfo.shortName}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get a display-friendly dependency chain
 */
export function getDependencyChain(moduleId: ModuleId): string {
  const deps = MODULE_REQUIRES[moduleId];
  if (deps.length === 0) return '';
  
  const names = deps.map(d => MODULE_DETAILS[d].shortName);
  return names.join(' → ');
}
