import React from 'react'
import { Card, Avatar, Typography, Space } from 'antd'
import { ReactNode } from 'react'
import './QuickActionCard.css'

const { Title, Text } = Typography

interface QuickActionCardProps {
  icon: ReactNode
  title: string
  description?: string
  onClick?: () => void
  color?: string
  badge?: number | string
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
}

export default function QuickActionCard({
  icon,
  title,
  description,
  onClick,
  color = '#1890ff',
  badge,
  disabled = false,
  size = 'medium'
}: QuickActionCardProps) {
  const avatarSize = size === 'small' ? 48 : size === 'large' ? 80 : 64

  return (
    <Card
      className={`quick-action-card size-${size} ${disabled ? 'disabled' : ''}`}
      hoverable={!disabled}
      onClick={disabled ? undefined : onClick}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div className="quick-action-content">
        <div className="quick-action-icon-wrapper" style={{ backgroundColor: `${color}15` }}>
          <Avatar
            size={avatarSize}
            icon={icon}
            style={{ backgroundColor: color }}
          />
          {badge && (
            <span className="quick-action-badge">{badge}</span>
          )}
        </div>
        <div className="quick-action-text">
          <Title level={size === 'small' ? 5 : 4} style={{ margin: 0, textAlign: 'center' }}>
            {title}
          </Title>
          {description && (
            <Text type="secondary" style={{ fontSize: size === 'small' ? '12px' : '14px', textAlign: 'center', display: 'block', marginTop: '4px' }}>
              {description}
            </Text>
          )}
        </div>
      </div>
    </Card>
  )
}

