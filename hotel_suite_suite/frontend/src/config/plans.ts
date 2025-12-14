import type { SubscriptionPlan, ModuleId } from '@/types';

// ============================================================
// SUBSCRIPTION PLANS CONFIGURATION
// ============================================================

export const ALL_MODULES: ModuleId[] = [
  'crs', 'rms', 'ims', 'oms', 'sms', 'bms', 'ams', 'tms', 'as'
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small hotels and guesthouses',
    includedModules: ['crs', 'rms'],
    optionalModules: ['bms', 'tms'],
    maxUsers: 5,
    maxRooms: 30,
    monthlyPrice: 499900,      // ₹4,999
    yearlyPrice: 4999900,      // ₹49,999 (2 months free)
    perUserPrice: 49900,       // ₹499 per additional user
    perModulePrice: 99900,     // ₹999 per optional module
    features: [
      'Reservation management',
      'Room inventory & status',
      'Basic reporting',
      'Email support',
      '5 staff accounts',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing hotels with full-service operations',
    includedModules: ['crs', 'rms', 'bms', 'oms', 'tms', 'ams'],
    optionalModules: ['ims', 'sms', 'as'],
    maxUsers: 25,
    maxRooms: 150,
    monthlyPrice: 1499900,     // ₹14,999
    yearlyPrice: 14999900,     // ₹1,49,999 (2 months free)
    perUserPrice: 29900,       // ₹299 per additional user
    perModulePrice: 199900,    // ₹1,999 per optional module
    features: [
      'All Starter features',
      'Billing & payments',
      'Order management',
      'Task management',
      'Staff attendance',
      'Priority support',
      '25 staff accounts',
    ],
    isPopular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Complete solution for large hotels and chains',
    includedModules: ALL_MODULES,
    optionalModules: [],
    maxUsers: -1,              // Unlimited
    maxRooms: -1,              // Unlimited
    monthlyPrice: 4999900,     // ₹49,999
    yearlyPrice: 49999900,     // ₹4,99,999 (2 months free)
    perUserPrice: 0,           // Included
    perModulePrice: 0,         // All included
    features: [
      'All Professional features',
      'Inventory management',
      'Supply chain',
      'Full accounting',
      'Custom integrations',
      'API access',
      'Dedicated account manager',
      'Unlimited staff accounts',
      '24/7 phone support',
    ],
    isEnterprise: true,
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Tailored solution for unique requirements',
    includedModules: [],
    optionalModules: ALL_MODULES,
    maxUsers: -1,
    maxRooms: -1,
    monthlyPrice: 0,           // Contact sales
    yearlyPrice: 0,
    perUserPrice: 0,
    perModulePrice: 0,
    features: [
      'Custom module selection',
      'Custom integrations',
      'White-label options',
      'On-premise deployment',
      'Custom SLA',
      'Dedicated support team',
    ],
    isEnterprise: true,
  },
];

// Helper to get plan by ID
export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(p => p.id === planId);
};

// Helper to format price
export const formatPrice = (priceInPaise: number, currency: string = 'INR'): string => {
  if (priceInPaise === 0) return 'Contact Sales';
  
  const amount = priceInPaise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Module display info
export const MODULE_INFO: Record<ModuleId, { name: string; shortName: string; description: string; color: string }> = {
  crs: {
    name: 'Customer Reservation System',
    shortName: 'Reservations',
    description: 'Guest bookings, check-in/out, calendar',
    color: '#1677ff',
  },
  rms: {
    name: 'Rooms Management System',
    shortName: 'Rooms',
    description: 'Room inventory, housekeeping, maintenance',
    color: '#13c2c2',
  },
  ims: {
    name: 'Inventory Management System',
    shortName: 'Inventory',
    description: 'Stock tracking, par levels, alerts',
    color: '#a0d911',
  },
  oms: {
    name: 'Order Management System',
    shortName: 'Orders',
    description: 'Room service, restaurant, POS',
    color: '#fa8c16',
  },
  sms: {
    name: 'Supply Management System',
    shortName: 'Supplies',
    description: 'Vendors, purchase orders, deliveries',
    color: '#722ed1',
  },
  bms: {
    name: 'Billing Management System',
    shortName: 'Billing',
    description: 'Folios, payments, invoices',
    color: '#eb2f96',
  },
  ams: {
    name: 'Attendance Management System',
    shortName: 'Attendance',
    description: 'Staff shifts, attendance, leave',
    color: '#fa541c',
  },
  tms: {
    name: 'Task Management System',
    shortName: 'Tasks',
    description: 'Task assignment and tracking',
    color: '#52c41a',
  },
  as: {
    name: 'Accounting System',
    shortName: 'Accounting',
    description: 'Ledgers, transactions, reports',
    color: '#08979c',
  },
};

// Timezone options for hotels
export const TIMEZONE_OPTIONS = [
  { label: 'Asia/Kolkata (IST)', value: 'Asia/Kolkata' },
  { label: 'Asia/Singapore (SGT)', value: 'Asia/Singapore' },
  { label: 'Asia/Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'Europe/London (GMT/BST)', value: 'Europe/London' },
  { label: 'America/New_York (EST/EDT)', value: 'America/New_York' },
  { label: 'America/Los_Angeles (PST/PDT)', value: 'America/Los_Angeles' },
  { label: 'Australia/Sydney (AEST)', value: 'Australia/Sydney' },
];

// Currency options
export const CURRENCY_OPTIONS = [
  { label: 'INR (₹)', value: 'INR' },
  { label: 'USD ($)', value: 'USD' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'SGD (S$)', value: 'SGD' },
  { label: 'AED (د.إ)', value: 'AED' },
  { label: 'AUD (A$)', value: 'AUD' },
];

// Region options
export const REGION_OPTIONS = [
  { label: 'India - North', value: 'India - North' },
  { label: 'India - South', value: 'India - South' },
  { label: 'India - East', value: 'India - East' },
  { label: 'India - West', value: 'India - West' },
  { label: 'Singapore', value: 'Singapore' },
  { label: 'UAE', value: 'UAE' },
  { label: 'United Kingdom', value: 'United Kingdom' },
  { label: 'United States - East', value: 'United States - East' },
  { label: 'United States - West', value: 'United States - West' },
  { label: 'Australia', value: 'Australia' },
  { label: 'Other', value: 'Other' },
];
