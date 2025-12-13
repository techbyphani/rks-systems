import { Tag, Badge } from 'antd';
import type { 
  ReservationStatus, 
  RoomStatus, 
  OrderStatus, 
  TaskStatus, 
  PaymentStatus,
  FolioStatus,
  LeaveStatus,
  GuestVipStatus,
} from '@/types';

// Color mappings for different status types
const reservationStatusColors: Record<ReservationStatus, string> = {
  inquiry: 'default',
  confirmed: 'blue',
  checked_in: 'green',
  checked_out: 'purple',
  cancelled: 'red',
  no_show: 'orange',
};

const roomStatusColors: Record<RoomStatus, string> = {
  available: 'green',
  occupied: 'blue',
  reserved: 'cyan',
  dirty: 'orange',
  cleaning: 'gold',
  inspecting: 'purple',
  out_of_order: 'red',
  out_of_service: 'magenta',
};

const orderStatusColors: Record<OrderStatus, string> = {
  pending: 'default',
  confirmed: 'blue',
  preparing: 'gold',
  ready: 'cyan',
  delivering: 'purple',
  delivered: 'green',
  completed: 'green',
  cancelled: 'red',
};

const taskStatusColors: Record<TaskStatus, string> = {
  pending: 'default',
  assigned: 'blue',
  in_progress: 'gold',
  on_hold: 'orange',
  completed: 'green',
  cancelled: 'red',
  overdue: 'red',
};

const paymentStatusColors: Record<PaymentStatus, string> = {
  pending: 'orange',
  completed: 'green',
  failed: 'red',
  refunded: 'purple',
  partial_refund: 'cyan',
};

const folioStatusColors: Record<FolioStatus, string> = {
  open: 'blue',
  closed: 'default',
  settled: 'green',
  disputed: 'red',
};

const leaveStatusColors: Record<LeaveStatus, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  cancelled: 'default',
};

const vipStatusColors: Record<GuestVipStatus, string> = {
  none: 'default',
  silver: 'default',
  gold: 'gold',
  platinum: 'purple',
};

// Generic Status Tag
interface StatusTagProps {
  status: string;
  type?: 'reservation' | 'room' | 'order' | 'task' | 'payment' | 'folio' | 'leave' | 'vip';
  showDot?: boolean;
}

export default function StatusTag({ status, type, showDot }: StatusTagProps) {
  let color = 'default';
  let label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  switch (type) {
    case 'reservation':
      color = reservationStatusColors[status as ReservationStatus] || 'default';
      break;
    case 'room':
      color = roomStatusColors[status as RoomStatus] || 'default';
      break;
    case 'order':
      color = orderStatusColors[status as OrderStatus] || 'default';
      break;
    case 'task':
      color = taskStatusColors[status as TaskStatus] || 'default';
      break;
    case 'payment':
      color = paymentStatusColors[status as PaymentStatus] || 'default';
      break;
    case 'folio':
      color = folioStatusColors[status as FolioStatus] || 'default';
      break;
    case 'leave':
      color = leaveStatusColors[status as LeaveStatus] || 'default';
      break;
    case 'vip':
      color = vipStatusColors[status as GuestVipStatus] || 'default';
      if (status === 'none') return null;
      label = status.toUpperCase();
      break;
  }
  
  if (showDot) {
    return <Badge color={color} text={label} />;
  }
  
  return <Tag color={color}>{label}</Tag>;
}

// Priority Tag
interface PriorityTagProps {
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export function PriorityTag({ priority }: PriorityTagProps) {
  const colors: Record<string, string> = {
    low: 'default',
    normal: 'blue',
    high: 'orange',
    urgent: 'red',
  };
  
  return (
    <Tag color={colors[priority]}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Tag>
  );
}

// VIP Badge
interface VipBadgeProps {
  status: GuestVipStatus;
  showLabel?: boolean;
}

export function VipBadge({ status, showLabel = true }: VipBadgeProps) {
  if (status === 'none') return null;
  
  const colors: Record<string, string> = {
    silver: '#a0a0a0',
    gold: '#faad14',
    platinum: '#722ed1',
  };
  
  return (
    <Tag 
      color={colors[status]} 
      style={{ 
        fontWeight: 600,
        borderRadius: 12,
      }}
    >
      {showLabel ? status.toUpperCase() : '★'}
    </Tag>
  );
}
