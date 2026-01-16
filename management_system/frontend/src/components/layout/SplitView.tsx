import React, { ReactNode } from 'react'
import { Row, Col } from 'antd'
import './SplitView.css'

interface SplitViewProps {
  left: ReactNode
  right: ReactNode
  leftSpan?: number
  rightSpan?: number
  leftTitle?: string
  rightTitle?: string
  leftActions?: ReactNode
  rightActions?: ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
  gap?: number
}

export default function SplitView({
  left,
  right,
  leftSpan = 12,
  rightSpan = 12,
  leftTitle,
  rightTitle,
  leftActions,
  rightActions,
  gap = 16
}: SplitViewProps) {
  return (
    <div className="split-view" style={{ gap: `${gap}px` }}>
      <Row gutter={gap}>
        <Col xs={24} lg={leftSpan}>
          <div className="split-view-panel left-panel">
            {leftTitle && (
              <div className="split-view-header">
                <h3 className="split-view-title">{leftTitle}</h3>
                {leftActions && (
                  <div className="split-view-actions">
                    {leftActions}
                  </div>
                )}
              </div>
            )}
            <div className="split-view-content">
              {left}
            </div>
          </div>
        </Col>
        <Col xs={24} lg={rightSpan}>
          <div className="split-view-panel right-panel">
            {rightTitle && (
              <div className="split-view-header">
                <h3 className="split-view-title">{rightTitle}</h3>
                {rightActions && (
                  <div className="split-view-actions">
                    {rightActions}
                  </div>
                )}
              </div>
            )}
            <div className="split-view-content">
              {right}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}

