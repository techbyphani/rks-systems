import { Result, Button } from 'antd'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ModuleId } from '@/config/modules'
import { useModuleEnabled, useModuleMeta } from '@/context/AppContext'

interface ProtectedRouteProps {
  moduleId: ModuleId
  children: ReactNode
}

export default function ProtectedRoute({ moduleId, children }: ProtectedRouteProps) {
  const hasAccess = useModuleEnabled(moduleId)
  const moduleMeta = useModuleMeta(moduleId)
  const navigate = useNavigate()

  if (!hasAccess) {
    return (
      <Result
        status="403"
        title="Restricted Module"
        subTitle={`You do not have access to ${moduleMeta.name} for this tenant.`}
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
