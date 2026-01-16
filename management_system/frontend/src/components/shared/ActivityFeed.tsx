import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, List, Avatar, Tag, Space, Typography, Spin, Empty, Button } from 'antd';
import {
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  DollarOutlined,
  CalendarOutlined,
  HomeOutlined,
  FileTextOutlined,
  SettingOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

export interface ActivityItem {
  id: string;
  type: 'check_in' | 'check_out' | 'booking' | 'payment' | 'room_status' | 'task' | 'guest' | 'system';
  title: string;
  description: string;
  user?: string;
  module?: string;
  entityId?: string;
  entityUrl?: string;
  timestamp: string;
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  check_in: <LoginOutlined style={{ color: '#52c41a' }} />,
  check_out: <LogoutOutlined style={{ color: '#1890ff' }} />,
  booking: <CalendarOutlined style={{ color: '#722ed1' }} />,
  payment: <DollarOutlined style={{ color: '#13c2c2' }} />,
  room_status: <HomeOutlined style={{ color: '#fa8c16' }} />,
  task: <FileTextOutlined style={{ color: '#eb2f96' }} />,
  guest: <UserOutlined style={{ color: '#2f54eb' }} />,
  system: <SettingOutlined style={{ color: '#8c8c8c' }} />,
};

const MODULE_COLORS: Record<string, string> = {
  crs: 'blue',
  rms: 'cyan',
  bms: 'green',
  oms: 'orange',
  ims: 'purple',
  tms: 'gold',
};

// Mock activity data generator
const generateMockActivities = (): ActivityItem[] => {
  const now = dayjs();
  return [
    {
      id: '1',
      type: 'check_in',
      title: 'Guest Checked In',
      description: 'John Smith checked into Room 405 (Suite)',
      user: 'Front Desk Staff',
      module: 'crs',
      entityUrl: '/suite/crs/reservations/res-001',
      timestamp: now.subtract(5, 'minute').toISOString(),
    },
    {
      id: '2',
      type: 'payment',
      title: 'Payment Received',
      description: '₹45,000 collected for Folio #F-8931',
      user: 'Cashier',
      module: 'bms',
      entityUrl: '/suite/bms/folios/folio-001',
      timestamp: now.subtract(15, 'minute').toISOString(),
    },
    {
      id: '3',
      type: 'room_status',
      title: 'Room Cleaned',
      description: 'Room 302 marked as clean and ready',
      user: 'Housekeeping',
      module: 'rms',
      entityUrl: '/suite/rms/rooms/room-302',
      timestamp: now.subtract(25, 'minute').toISOString(),
    },
    {
      id: '4',
      type: 'booking',
      title: 'New Reservation',
      description: 'Booking confirmed for Sarah Johnson (Dec 20-23)',
      user: 'Reservation Agent',
      module: 'crs',
      entityUrl: '/suite/crs/reservations/res-002',
      timestamp: now.subtract(45, 'minute').toISOString(),
    },
    {
      id: '5',
      type: 'check_out',
      title: 'Guest Checked Out',
      description: 'Ms. Williams checked out of Room 210',
      user: 'Front Desk Staff',
      module: 'crs',
      entityUrl: '/suite/crs/reservations/res-003',
      timestamp: now.subtract(1, 'hour').toISOString(),
    },
    {
      id: '6',
      type: 'task',
      title: 'Task Completed',
      description: 'Maintenance request #MNT-045 resolved',
      user: 'Engineering',
      module: 'tms',
      entityUrl: '/suite/tms/tasks',
      timestamp: now.subtract(2, 'hour').toISOString(),
    },
    {
      id: '7',
      type: 'guest',
      title: 'VIP Guest Arriving',
      description: 'Mr. Patel (Platinum member) arriving at 3 PM',
      user: 'System',
      module: 'crs',
      entityUrl: '/suite/crs/guests',
      timestamp: now.subtract(3, 'hour').toISOString(),
    },
  ];
};

interface ActivityFeedProps {
  limit?: number;
  showHeader?: boolean;
  showViewAll?: boolean;
}

export default function ActivityFeed({ limit = 10, showHeader = true, showViewAll = true }: ActivityFeedProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setActivities(generateMockActivities().slice(0, limit));
    } finally {
      setLoading(false);
    }
  };

  const handleActivityClick = (activity: ActivityItem) => {
    if (activity.entityUrl) {
      navigate(activity.entityUrl);
    }
  };

  if (loading) {
    return (
      <Card title={showHeader ? 'Recent Activity' : undefined}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={showHeader ? 'Recent Activity' : undefined}
      extra={
        showHeader && (
          <Button type="text" icon={<ReloadOutlined />} onClick={loadActivities} size="small">
            Refresh
          </Button>
        )
      }
      bodyStyle={{ padding: 0 }}
    >
      {activities.length === 0 ? (
        <Empty description="No recent activity" style={{ padding: 40 }} />
      ) : (
        <List
          dataSource={activities}
          renderItem={(item) => (
            <List.Item
              style={{ padding: '12px 16px', cursor: item.entityUrl ? 'pointer' : 'default' }}
              onClick={() => handleActivityClick(item)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    style={{ backgroundColor: '#f0f0f0' }}
                    icon={ACTIVITY_ICONS[item.type]}
                  />
                }
                title={
                  <Space>
                    <Text strong>{item.title}</Text>
                    {item.module && (
                      <Tag color={MODULE_COLORS[item.module] || 'default'} style={{ fontSize: 10 }}>
                        {item.module.toUpperCase()}
                      </Tag>
                    )}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.description}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {item.user && `${item.user} · `}
                      {dayjs(item.timestamp).fromNow()}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
      {showViewAll && activities.length > 0 && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
          <Button type="link" size="small">
            View All Activity
          </Button>
        </div>
      )}
    </Card>
  );
}
