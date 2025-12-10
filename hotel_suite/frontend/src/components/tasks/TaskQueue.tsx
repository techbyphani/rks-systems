import React from 'react'
import { List, Tag, Button, Space, Typography, Empty } from 'antd'
import { ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import './TaskQueue.css'

const { Text } = Typography

export interface Task {
  id: string
  title: string
  description?: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  type: 'checkin' | 'checkout' | 'booking' | 'room' | 'payment' | 'other'
  dueTime?: string
  status?: 'pending' | 'in-progress' | 'completed'
  onClick?: () => void
  metadata?: Record<string, any>
}

interface TaskQueueProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onTaskComplete?: (taskId: string) => void
  maxHeight?: number
  showEmpty?: boolean
}

export default function TaskQueue({
  tasks,
  onTaskClick,
  onTaskComplete,
  maxHeight = 400,
  showEmpty = true
}: TaskQueueProps) {
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'red'
      case 'high': return 'orange'
      case 'medium': return 'blue'
      case 'low': return 'default'
      default: return 'default'
    }
  }

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return <ExclamationCircleOutlined />
      case 'high': return <ClockCircleOutlined />
      default: return null
    }
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })

  if (sortedTasks.length === 0 && showEmpty) {
    return (
      <Empty
        description="No tasks at the moment"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    )
  }

  return (
    <div className="task-queue" style={{ maxHeight, overflowY: 'auto' }}>
      <List
        dataSource={sortedTasks}
        renderItem={(task) => (
          <List.Item
            className={`task-item priority-${task.priority}`}
            onClick={() => {
              if (onTaskClick) {
                onTaskClick(task)
              } else if (task.onClick) {
                task.onClick()
              }
            }}
            actions={[
              task.status === 'pending' && onTaskComplete ? (
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    onTaskComplete(task.id)
                  }}
                >
                  Complete
                </Button>
              ) : null
            ].filter(Boolean)}
          >
            <List.Item.Meta
              avatar={
                <div className="task-priority-indicator">
                  {getPriorityIcon(task.priority)}
                </div>
              }
              title={
                <Space>
                  <Text strong>{task.title}</Text>
                  <Tag color={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Tag>
                </Space>
              }
              description={
                <Space direction="vertical" size={4}>
                  {task.description && <Text type="secondary" style={{ fontSize: '12px' }}>{task.description}</Text>}
                  {task.dueTime && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      <ClockCircleOutlined /> {task.dueTime}
                    </Text>
                  )}
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </div>
  )
}

