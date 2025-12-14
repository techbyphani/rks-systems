import { Result, Button } from 'antd'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { MODULE_MAP } from '@/config/modules'
import { useModuleEnabled } from '@/context/AppContext'
import type { ModuleId } from '@/types'

interface ProtectedRouteProps {
  moduleId: ModuleId
  children: ReactNode
}

export default function ProtectedRoute({ moduleId, children }: ProtectedRouteProps) {
  const hasAccess = useModuleEnabled(moduleId)
  const moduleMeta = MODULE_MAP[moduleId]
  const navigate = useNavigate()

  if (!hasAccess) {
    return (
      <Result
        status="403"
        title="Restricted Module"
        subTitle={`You do not have access to ${moduleMeta?.name || moduleId.toUpperCase()} for this hotel.`}
        extra={
          <Button type="primary" onClick={() => navigate('/suite/overview')}>
            Go to Overview
          </Button>
        }
      />
    )
  }

  return <>{children}</>
}
