import React from 'react'
import { Badge, Tag, Tooltip } from 'antd'
import './StatusIndicator.css'

export type StatusType = 'success' | 'warning' | 'error' | 'processing' | 'default' | 'info'

interface StatusIndicatorProps {
  status: StatusType
  text?: string
  showDot?: boolean
  showBadge?: boolean
  badgeCount?: number
  tooltip?: string
  size?: 'small' | 'default' | 'large'
}

export default function StatusIndicator({
  status,
  text,
  showDot = true,
  showBadge = false,
  badgeCount,
  tooltip,
  size = 'default'
}: StatusIndicatorProps) {
  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case 'success': return '#52c41a'
      case 'warning': return '#faad14'
      case 'error': return '#ff4d4f'
      case 'processing': return '#1890ff'
      case 'info': return '#1890ff'
      default: return '#d9d9d9'
    }
  }

  const badgeStatus = status === 'info' ? 'processing' : status

  const content = (
    <div className={`status-indicator size-${size}`}>
      {showDot && (
        <Badge
          status={badgeStatus as 'success' | 'warning' | 'error' | 'processing' | 'default'}
          style={{ marginRight: text ? '8px' : 0 }}
        />
      )}
      {showBadge && badgeCount !== undefined && (
        <Badge
          count={badgeCount}
          style={{ marginRight: text ? '8px' : 0 }}
        />
      )}
      {text && (
        <span className="status-text" style={{ color: getStatusColor(status) }}>
          {text}
        </span>
      )}
    </div>
  )

  if (tooltip) {
    return (
      <Tooltip title={tooltip}>
        {content}
      </Tooltip>
    )
  }

  return content
}

