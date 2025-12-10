import React, { useState, useEffect } from 'react'
import { Badge, Popover, List, Typography, Space, Button, Empty } from 'antd'
import { BellOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import './NotificationCenter.css'

const { Text } = Typography

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationCenterProps {
  notifications: Notification[]
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onClear?: (id: string) => void
  onClearAll?: () => void
  maxVisible?: number
}

export default function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClear,
  onClearAll,
  maxVisible = 5
}: NotificationCenterProps) {
  const [visible, setVisible] = useState(false)
  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return '✓'
      case 'warning': return '⚠'
      case 'error': return '✕'
      default: return 'ℹ'
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return '#52c41a'
      case 'warning': return '#faad14'
      case 'error': return '#ff4d4f'
      default: return '#1890ff'
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const visibleNotifications = notifications.slice(0, maxVisible)
  const hasMore = notifications.length > maxVisible

  const content = (
    <div className="notification-center">
      <div className="notification-header">
        <Text strong>Notifications</Text>
        <Space>
          {unreadCount > 0 && onMarkAllAsRead && (
            <Button type="link" size="small" onClick={onMarkAllAsRead}>
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && onClearAll && (
            <Button type="link" size="small" danger onClick={onClearAll}>
              Clear all
            </Button>
          )}
        </Space>
      </div>
      
      {notifications.length === 0 ? (
        <Empty
          description="No notifications"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '20px 0' }}
        />
      ) : (
        <>
          <List
            dataSource={visibleNotifications}
            renderItem={(notification) => (
              <List.Item
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                onClick={() => {
                  if (!notification.read && onMarkAsRead) {
                    onMarkAsRead(notification.id)
                  }
                  if (notification.action) {
                    notification.action.onClick()
                    setVisible(false)
                  }
                }}
              >
                <div className="notification-content">
                  <div className="notification-icon" style={{ color: getNotificationColor(notification.type) }}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-text">
                    <Text strong={!notification.read}>{notification.title}</Text>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                      {notification.message}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {formatTimestamp(notification.timestamp)}
                    </Text>
                  </div>
                  {onClear && (
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        onClear(notification.id)
                      }}
                      className="notification-close"
                    />
                  )}
                </div>
              </List.Item>
            )}
          />
          {hasMore && (
            <div className="notification-footer">
              <Button type="link" block>
                View all notifications ({notifications.length})
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )

  return (
    <Popover
      content={content}
      trigger="click"
      open={visible}
      onOpenChange={setVisible}
      placement="bottomRight"
      overlayClassName="notification-popover"
    >
      <Badge count={unreadCount} offset={[-5, 5]}>
        <Button
          type="text"
          icon={<BellOutlined />}
          style={{ fontSize: '18px' }}
        />
      </Badge>
    </Popover>
  )
}

