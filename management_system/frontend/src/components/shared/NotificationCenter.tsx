import { useNavigate } from 'react-router-dom';
import { Badge, Button, Dropdown, Empty, List, Space, Tag, Typography } from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNotifications, type Notification } from '@/context/NotificationContext';

dayjs.extend(relativeTime);

const { Text, Title } = Typography;

const ICON_MAP = {
  info: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
  success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  warning: <WarningOutlined style={{ color: '#faad14' }} />,
  error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
};

const MODULE_COLORS: Record<string, string> = {
  crs: 'blue',
  rms: 'cyan',
  bms: 'green',
  oms: 'orange',
  ims: 'purple',
  sms: 'magenta',
  ams: 'geekblue',
  tms: 'gold',
  as: 'lime',
};

function NotificationItem({
  notification,
  onRead,
  onRemove,
  onClick,
}: {
  notification: Notification;
  onRead: () => void;
  onRemove: () => void;
  onClick: () => void;
}) {
  return (
    <List.Item
      style={{
        padding: '12px 16px',
        cursor: 'pointer',
        background: notification.read ? 'transparent' : 'rgba(24, 144, 255, 0.04)',
        borderBottom: '1px solid #f0f0f0',
      }}
      onClick={onClick}
      actions={[
        !notification.read && (
          <Button
            key="read"
            type="text"
            size="small"
            icon={<CheckOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onRead();
            }}
          />
        ),
        <Button
          key="delete"
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />,
      ].filter(Boolean)}
    >
      <List.Item.Meta
        avatar={ICON_MAP[notification.type]}
        title={
          <Space size={4}>
            <Text strong={!notification.read}>{notification.title}</Text>
            {notification.module && (
              <Tag color={MODULE_COLORS[notification.module]} style={{ fontSize: 10 }}>
                {notification.module.toUpperCase()}
              </Tag>
            )}
          </Space>
        }
        description={
          <Space direction="vertical" size={2}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {notification.message}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {dayjs(notification.timestamp).fromNow()}
            </Text>
          </Space>
        }
      />
    </List.Item>
  );
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } =
    useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const dropdownContent = (
    <div
      style={{
        width: 380,
        maxHeight: 480,
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          Notifications
        </Title>
        <Space>
          {unreadCount > 0 && (
            <Button type="link" size="small" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button type="link" size="small" danger onClick={clearAll}>
              Clear all
            </Button>
          )}
        </Space>
      </div>

      {/* Notification List */}
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No notifications"
            style={{ padding: 40 }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <NotificationItem
                key={item.id}
                notification={item}
                onRead={() => markAsRead(item.id)}
                onRemove={() => removeNotification(item.id)}
                onClick={() => handleNotificationClick(item)}
              />
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 18 }} />}
          style={{ width: 40, height: 40 }}
        />
      </Badge>
    </Dropdown>
  );
}
