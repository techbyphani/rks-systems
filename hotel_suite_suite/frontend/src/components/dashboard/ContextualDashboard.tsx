import React, { ReactNode } from 'react'
import { Card, Row, Col, Space, Typography } from 'antd'
import './ContextualDashboard.css'

const { Title } = Typography

interface DashboardWidget {
  id: string
  title: string
  content: ReactNode
  span?: number
  priority?: 'high' | 'medium' | 'low'
}

interface ContextualDashboardProps {
  widgets: DashboardWidget[]
  title?: string
  subtitle?: string
  actions?: ReactNode
  layout?: 'grid' | 'priority'
}

export default function ContextualDashboard({
  widgets,
  title,
  subtitle,
  actions,
  layout = 'grid'
}: ContextualDashboardProps) {
  // Sort widgets by priority if layout is priority-based
  const sortedWidgets = layout === 'priority'
    ? [...widgets].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return (priorityOrder[b.priority || 'low']) - (priorityOrder[a.priority || 'low'])
      })
    : widgets

  return (
    <div className="contextual-dashboard">
      {(title || subtitle || actions) && (
        <div className="dashboard-header">
          <div>
            {title && <Title level={2} style={{ margin: 0 }}>{title}</Title>}
            {subtitle && <p className="dashboard-subtitle">{subtitle}</p>}
          </div>
          {actions && (
            <div className="dashboard-actions">
              {actions}
            </div>
          )}
        </div>
      )}
      
      <Row gutter={[16, 16]}>
        {sortedWidgets.map((widget) => (
          <Col 
            xs={24} 
            sm={widget.span ? (widget.span * 2) : 24} 
            md={widget.span ? (widget.span * 2) : 12} 
            lg={widget.span || 8} 
            xl={widget.span || 6}
            key={widget.id}
          >
            <Card
              className={`dashboard-widget ${widget.priority ? `priority-${widget.priority}` : ''}`}
              title={widget.title}
              hoverable
            >
              {widget.content}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}

