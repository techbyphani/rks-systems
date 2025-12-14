/**
 * Module Dependencies Configuration
 * 
 * This file defines how modules relate to each other:
 * - Required: Must be enabled together (core functionality breaks without)
 * - Enhances: Works better with, but can work without
 * - Independent: No dependencies
 */

import type { ModuleId } from '@/types';

// ============================================================
// DEPENDENCY DEFINITIONS
// ============================================================

export interface ModuleDependency {
  moduleId: ModuleId;
  type: 'required' | 'enhances';
  reason: string;
}

export interface ModuleConfig {
  id: ModuleId;
  name: string;
  // Modules this one depends on
  dependencies: ModuleDependency[];
  // What this module can do standalone vs with dependencies
  standalone: {
    capable: boolean;
    limitations?: string[];
  };
}

export const MODULE_DEPENDENCIES: Record<ModuleId, ModuleConfig> = {
  // CRS - Customer Reservation System
  crs: {
    id: 'crs',
    name: 'Reservations (CRS)',
    dependencies: [
      {
        moduleId: 'rms',
        type: 'required',
        reason: 'Room assignment requires Room Management',
      },
    ],
    standalone: {
      capable: false,
      limitations: ['Cannot assign rooms without RMS'],
    },
  },

  // RMS - Room Management System
  rms: {
    id: 'rms',
    name: 'Rooms (RMS)',
    dependencies: [],
    standalone: {
      capable: true,
      limitations: [],
    },
  },

  // BMS - Billing Management System
  bms: {
    id: 'bms',
    name: 'Billing (BMS)',
    dependencies: [],
    standalone: {
      capable: true,
      limitations: ['Advanced reporting requires AS module'],
    },
  },

  // IMS - Inventory Management System
  ims: {
    id: 'ims',
    name: 'Inventory (IMS)',
    dependencies: [],
    standalone: {
      capable: true,
    },
  },

  // OMS - Order Management System
  oms: {
    id: 'oms',
    name: 'Orders (OMS)',
    dependencies: [
      {
        moduleId: 'ims',
        type: 'enhances',
        reason: 'Stock tracking requires Inventory module',
      },
      {
        moduleId: 'bms',
        type: 'enhances',
        reason: 'Guest charging requires Billing module',
      },
    ],
    standalone: {
      capable: true,
      limitations: [
        'Without IMS: No stock level tracking',
        'Without BMS: Cannot post charges to guest folios (cash only)',
      ],
    },
  },

  // SMS - Supply Management System
  sms: {
    id: 'sms',
    name: 'Supply (SMS)',
    dependencies: [
      {
        moduleId: 'ims',
        type: 'enhances',
        reason: 'Auto-update stock on delivery',
      },
    ],
    standalone: {
      capable: true,
      limitations: ['Without IMS: Manual stock updates required'],
    },
  },

  // AMS - Attendance Management System
  ams: {
    id: 'ams',
    name: 'Attendance (AMS)',
    dependencies: [],
    standalone: {
      capable: true,
    },
  },

  // TMS - Task Management System
  tms: {
    id: 'tms',
    name: 'Tasks (TMS)',
    dependencies: [],
    standalone: {
      capable: true,
      limitations: ['Task linking to other modules requires those modules'],
    },
  },

  // AS - Accounting System
  as: {
    id: 'as',
    name: 'Accounting (AS)',
    dependencies: [
      {
        moduleId: 'bms',
        type: 'enhances',
        reason: 'Auto-sync billing data',
      },
    ],
    standalone: {
      capable: true,
      limitations: ['Without BMS: Manual entry of billing transactions'],
    },
  },
};

// ============================================================
// MODULE BUNDLES (Recommended combinations)
// ============================================================

export interface ModuleBundle {
  id: string;
  name: string;
  description: string;
  modules: ModuleId[];
  useCase: string;
}

export const MODULE_BUNDLES: ModuleBundle[] = [
  {
    id: 'essential',
    name: 'Essential Hotel Operations',
    description: 'Core modules for any hotel',
    modules: ['crs', 'rms', 'bms'],
    useCase: 'Basic room booking, check-in/out, and billing',
  },
  {
    id: 'full-service',
    name: 'Full-Service Hotel',
    description: 'Complete hotel with F&B',
    modules: ['crs', 'rms', 'bms', 'oms', 'ims'],
    useCase: 'Hotels with restaurant/room service',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Suite',
    description: 'All modules for large properties',
    modules: ['crs', 'rms', 'bms', 'oms', 'ims', 'sms', 'ams', 'tms', 'as'],
    useCase: 'Full control over all operations',
  },
  {
    id: 'guesthouse',
    name: 'Small Guesthouse',
    description: 'Minimal setup for small properties',
    modules: ['crs', 'rms'],
    useCase: 'Simple room management without billing',
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get all required dependencies for a module
 */
export function getRequiredDependencies(moduleId: ModuleId): ModuleId[] {
  const config = MODULE_DEPENDENCIES[moduleId];
  return config.dependencies
    .filter(d => d.type === 'required')
    .map(d => d.moduleId);
}

/**
 * Get all enhancing dependencies for a module
 */
export function getEnhancingDependencies(moduleId: ModuleId): ModuleId[] {
  const config = MODULE_DEPENDENCIES[moduleId];
  return config.dependencies
    .filter(d => d.type === 'enhances')
    .map(d => d.moduleId);
}

/**
 * Check if a module configuration is valid (all required deps are enabled)
 */
export function validateModuleConfiguration(enabledModules: ModuleId[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const moduleId of enabledModules) {
    const config = MODULE_DEPENDENCIES[moduleId];
    
    for (const dep of config.dependencies) {
      if (dep.type === 'required' && !enabledModules.includes(dep.moduleId)) {
        errors.push(
          `${config.name} requires ${MODULE_DEPENDENCIES[dep.moduleId].name}: ${dep.reason}`
        );
      }
      
      if (dep.type === 'enhances' && !enabledModules.includes(dep.moduleId)) {
        warnings.push(
          `${config.name} works better with ${MODULE_DEPENDENCIES[dep.moduleId].name}: ${dep.reason}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get modules that would be affected if a module is disabled
 */
export function getAffectedModules(
  moduleToDisable: ModuleId, 
  enabledModules: ModuleId[]
): { breaking: ModuleId[]; degraded: ModuleId[] } {
  const breaking: ModuleId[] = [];
  const degraded: ModuleId[] = [];

  for (const moduleId of enabledModules) {
    if (moduleId === moduleToDisable) continue;
    
    const config = MODULE_DEPENDENCIES[moduleId];
    
    for (const dep of config.dependencies) {
      if (dep.moduleId === moduleToDisable) {
        if (dep.type === 'required') {
          breaking.push(moduleId);
        } else {
          degraded.push(moduleId);
        }
      }
    }
  }

  return { breaking, degraded };
}

/**
 * Suggest additional modules based on current selection
 */
export function suggestModules(enabledModules: ModuleId[]): {
  recommended: ModuleId[];
  reasons: Record<ModuleId, string>;
} {
  const recommended: ModuleId[] = [];
  const reasons: Record<string, string> = {};

  for (const moduleId of enabledModules) {
    const enhancing = getEnhancingDependencies(moduleId);
    
    for (const depId of enhancing) {
      if (!enabledModules.includes(depId) && !recommended.includes(depId)) {
        recommended.push(depId);
        const dep = MODULE_DEPENDENCIES[moduleId].dependencies.find(d => d.moduleId === depId);
        reasons[depId] = dep?.reason || 'Enhances functionality';
      }
    }
  }

  return { recommended, reasons: reasons as Record<ModuleId, string> };
}

/**
 * Auto-enable required dependencies
 */
export function autoEnableDependencies(selectedModules: ModuleId[]): ModuleId[] {
  const result = new Set(selectedModules);
  
  for (const moduleId of selectedModules) {
    const required = getRequiredDependencies(moduleId);
    required.forEach(dep => result.add(dep));
  }
  
  return Array.from(result);
}
