import { useEffect, useState } from 'react';
import {
  Drawer,
  Switch,
  Button,
  Space,
  List,
  Card,
  Typography,
  Alert,
  Tag,
  Divider,
  message,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  SaveOutlined,
  AppstoreOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { tenantService, tenantUserService } from '@/api';
import { MODULE_INFO, SUBSCRIPTION_PLANS, ALL_MODULES } from '@/config/plans';
import type { Tenant, ModuleId } from '@/types';

const { Title, Text, Paragraph } = Typography;

interface ModuleConfigDrawerProps {
  tenant: Tenant | null;
  onClose: () => void;
  onSave: () => void;
}

export default function ModuleConfigDrawer({ tenant, onClose, onSave }: ModuleConfigDrawerProps) {
  const [enabledModules, setEnabledModules] = useState<ModuleId[]>([]);
  const [loading, setLoading] = useState(false);
  const [userCounts, setUserCounts] = useState<{ total: number; active: number } | null>(null);
  const [affectedUsers, setAffectedUsers] = useState<number>(0);

  useEffect(() => {
    if (tenant) {
      setEnabledModules([...tenant.enabledModules]);
      loadUserCounts();
    }
  }, [tenant]);

  const loadUserCounts = async () => {
    if (!tenant) return;
    try {
      const counts = await tenantUserService.getCountByTenant(tenant.id);
      setUserCounts(counts);
    } catch (error) {
      console.error('Failed to load user counts');
    }
  };

  const handleToggle = (moduleId: ModuleId, enabled: boolean) => {
    let newModules: ModuleId[];
    
    if (enabled) {
      newModules = [...enabledModules, moduleId];
    } else {
      newModules = enabledModules.filter(m => m !== moduleId);
    }
    
    setEnabledModules(newModules);
    
    // Calculate affected users (those who had access to disabled modules)
    // In real implementation, this would check actual user module assignments
    if (!enabled) {
      setAffectedUsers(prev => prev + 1);
    } else {
      setAffectedUsers(prev => Math.max(0, prev - 1));
    }
  };

  const handleSave = async () => {
    if (!tenant) return;
    
    if (enabledModules.length === 0) {
      message.error('At least one module must be enabled');
      return;
    }
    
    setLoading(true);
    try {
      await tenantService.updateModules(tenant.id, enabledModules);
      message.success('Module configuration updated');
      onSave();
    } catch (error) {
      message.error('Failed to update modules');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (tenant) {
      setEnabledModules([...tenant.enabledModules]);
      setAffectedUsers(0);
    }
  };

  if (!tenant) return null;

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === tenant.planId);
  const hasChanges = JSON.stringify([...enabledModules].sort()) !== 
                     JSON.stringify([...tenant.enabledModules].sort());

  const removedModules = tenant.enabledModules.filter(m => !enabledModules.includes(m));

  return (
    <Drawer
      title={
        <Space>
          <AppstoreOutlined />
          <span>Configure Modules</span>
        </Space>
      }
      width={600}
      open={!!tenant}
      onClose={onClose}
      extra={
        <Space>
          <Button onClick={handleReset} disabled={!hasChanges}>
            Reset
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </Space>
      }
    >
      {/* Hotel Info */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <div>
              <Text type="secondary">Hotel</Text>
              <Title level={5} style={{ margin: 0 }}>{tenant.name}</Title>
            </div>
          </Col>
          <Col span={6}>
            <Statistic 
              title="Plan" 
              value={plan?.name || tenant.planId}
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Users" 
              value={userCounts?.total || tenant.userCount || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
        </Row>
      </Card>

      {/* Warning if disabling modules */}
      {removedModules.length > 0 && (
        <Alert
          message="Warning: Modules will be disabled"
          description={
            <div>
              <Paragraph style={{ marginBottom: 8 }}>
                Disabling modules will remove access for users who currently have these modules assigned:
              </Paragraph>
              <Space wrap>
                {removedModules.map(m => (
                  <Tag key={m} color="red">{m.toUpperCase()}</Tag>
                ))}
              </Space>
            </div>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Module Toggles */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text strong>Enabled Modules</Text>
          <Tag color="blue">{enabledModules.length} of {ALL_MODULES.length}</Tag>
        </div>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Toggle modules on/off. Users can only access enabled modules.
        </Paragraph>
      </div>

      <List
        dataSource={ALL_MODULES}
        renderItem={(moduleId) => {
          const info = MODULE_INFO[moduleId];
          const isEnabled = enabledModules.includes(moduleId);
          const isIncludedInPlan = plan?.includedModules.includes(moduleId);
          const isOptionalInPlan = plan?.optionalModules.includes(moduleId);
          
          return (
            <List.Item
              style={{
                padding: '12px 16px',
                marginBottom: 8,
                background: isEnabled ? '#f6ffed' : '#fafafa',
                borderRadius: 8,
                border: `1px solid ${isEnabled ? '#b7eb8f' : '#f0f0f0'}`,
              }}
              actions={[
                <Switch
                  key="switch"
                  checked={isEnabled}
                  onChange={(checked) => handleToggle(moduleId, checked)}
                  style={{ marginLeft: 8 }}
                />
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: `${info.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: 12,
                      color: info.color,
                    }}
                  >
                    {moduleId.toUpperCase()}
                  </div>
                }
                title={
                  <Space>
                    <Text strong>{info.name}</Text>
                    {isIncludedInPlan && (
                      <Tag color="green" style={{ fontSize: 10 }}>INCLUDED</Tag>
                    )}
                    {isOptionalInPlan && (
                      <Tag color="orange" style={{ fontSize: 10 }}>OPTIONAL</Tag>
                    )}
                  </Space>
                }
                description={info.description}
              />
            </List.Item>
          );
        }}
      />

      {/* Quick Actions */}
      <Divider />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          size="small"
          onClick={() => setEnabledModules([...ALL_MODULES])}
        >
          Enable All
        </Button>
        <Button 
          size="small"
          onClick={() => setEnabledModules(plan?.includedModules || ['crs', 'rms'])}
        >
          Reset to Plan Default
        </Button>
        <Button 
          size="small"
          danger
          onClick={() => setEnabledModules(['crs', 'rms'])}
        >
          Minimum (CRS + RMS)
        </Button>
      </div>
    </Drawer>
  );
}
