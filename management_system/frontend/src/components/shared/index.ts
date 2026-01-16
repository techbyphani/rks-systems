// ============================================================
// SHARED COMPONENTS INDEX
// ============================================================

// Page Layout
export { default as PageHeader } from './PageHeader';

// Data Display
export { default as DataTable, createPaginationConfig } from './DataTable';
export { default as StatCard, StatGrid } from './StatCard';
export { default as DetailCard, InfoSection, InfoRow, TwoColumnLayout } from './DetailCard';

// Status & Tags
export { default as StatusTag, PriorityTag, VipBadge } from './StatusTag';

// Forms & Modals
export { default as FormDrawer, FormModal } from './FormDrawer';

// Filters
export { 
  default as FilterPanel,
  TextFilter,
  SelectFilter,
  DateFilter,
  DateRangeFilter,
} from './FilterPanel';

// States
export { default as EmptyState, LoadingState, ErrorState } from './EmptyState';

// Notifications & Actions
export { default as NotificationCenter } from './NotificationCenter';
export { default as QuickActions } from './QuickActions';
export { default as ActivityFeed } from './ActivityFeed';
