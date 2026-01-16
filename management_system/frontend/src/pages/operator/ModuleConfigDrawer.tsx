import { useEffect, useState, useMemo } from 'react';
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
  Tooltip,
  Modal,
} from 'antd';
import {
  SaveOutlined,
  AppstoreOutlined,
  TeamOutlined,
  WarningOutlined,
  LockOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { tenantService, tenantUserService } from '@/api';
import { MODULE_INFO, SUBSCRIPTION_PLANS, ALL_MODULES } from '@/config/plans';
import { 
  MODULE_DETAILS,
  MODULE_BUNDLES,
  getModulesWithDependencies,
  canDisableModule,
  getCascadeDisable,
  validateModuleConfiguration,
} from '@/config/moduleDependencies';
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

  // Validation
  const validation = useMemo(() => {
    return validateModuleConfiguration(enabledModules);
  }, [enabledModules]);

  const handleEnable = (moduleId: ModuleId) => {
    // Get all modules that need to be enabled (including dependencies)
    const modulesWithDeps = getModulesWithDependencies(moduleId);
    const newModules = Array.from(new Set([...enabledModules, ...modulesWithDeps]));
    
    // Show what was auto-enabled
    const autoEnabled = modulesWithDeps.filter(m => m !== moduleId && !enabledModules.includes(m));
    if (autoEnabled.length > 0) {
      const names = autoEnabled.map(m => MODULE_DETAILS[m].shortName).join(', ');
      message.info(`Also enabled: ${names} (required by ${MODULE_DETAILS[moduleId].shortName})`);
    }
    
    setEnabledModules(newModules);
  };

  const handleDisable = (moduleId: ModuleId) => {
    // Check if this module can be disabled
    const { canDisable, blockedBy } = canDisableModule(moduleId, enabledModules);
    
    if (!canDisable) {
      // Show what's blocking
      const blockingNames = blockedBy.map(m => MODULE_DETAILS[m].shortName).join(', ');
      
      Modal.confirm({
        title: `Cannot disable ${MODULE_DETAILS[moduleId].shortName}`,
        icon: <LockOutlined style={{ color: '#ff4d4f' }} />,
        content: (
          <div>
            <Paragraph>
              <strong>{blockingNames}</strong> {blockedBy.length > 1 ? 'depend' : 'depends'} on this module.
            </Paragraph>
            <Paragraph type="secondary">
              To disable {MODULE_DETAILS[moduleId].shortName}, you must first disable: {blockingNames}
            </Paragraph>
            <Divider style={{ margin: '12px 0' }} />
            <Paragraph>
              <Text type="secondary">Or disable all at once:</Text>
            </Paragraph>
          </div>
        ),
        okText: `Disable All (${getCascadeDisable(moduleId, enabledModules).length} modules)`,
        okButtonProps: { danger: true },
        cancelText: 'Cancel',
        onOk: () => {
          // Cascade disable
          const toDisable = getCascadeDisable(moduleId, enabledModules);
          const newModules = enabledModules.filter(m => !toDisable.includes(m));
          setEnabledModules(newModules);
          
          const names = toDisable.map(m => MODULE_DETAILS[m].shortName).join(', ');
          message.warning(`Disabled: ${names}`);
        },
      });
    } else {
      // Can disable directly
      setEnabledModules(enabledModules.filter(m => m !== moduleId));
    }
  };

  const handleToggle = (moduleId: ModuleId, enabled: boolean) => {
    if (enabled) {
      handleEnable(moduleId);
    } else {
      handleDisable(moduleId);
    }
  };

  const handleSave = async () => {
    if (!tenant) return;
    
    if (!validation.valid) {
      message.error(validation.errors[0]);
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
    }
  };

  const handleApplyBundle = (bundleId: string) => {
    const bundle = MODULE_BUNDLES.find(b => b.id === bundleId);
    if (bundle) {
      setEnabledModules([...bundle.modules]);
      message.success(`Applied "${bundle.name}" configuration`);
    }
  };

  if (!tenant) return null;

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === tenant.planId);
  const hasChanges = JSON.stringify([...enabledModules].sort()) !== 
                     JSON.stringify([...tenant.enabledModules].sort());

  const addedModules = enabledModules.filter(m => !tenant.enabledModules.includes(m));
  const removedModules = tenant.enabledModules.filter(m => !enabledModules.includes(m));

  return (
    <Drawer
      title={
        <Space>
          <AppstoreOutlined />
          <span>Configure Modules for {tenant.name}</span>
        </Space>
      }
      width={680}
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
            disabled={!hasChanges || !validation.valid}
          >
            Save Changes
          </Button>
        </Space>
      }
    >
      {/* Hotel Info */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={10}>
            <div>
              <Text type="secondary">Hotel</Text>
              <Title level={5} style={{ margin: 0 }}>{tenant.name}</Title>
            </div>
          </Col>
          <Col span={7}>
            <Statistic 
              title="Plan" 
              value={plan?.name || tenant.planId}
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
          <Col span={7}>
            <Statistic 
              title="Users" 
              value={userCounts?.total || tenant.userCount || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
        </Row>
      </Card>

      {/* Change Summary */}
      {hasChanges && (
        <Alert
          message="Pending Changes"
          description={
            <Space direction="vertical" size={4}>
              {addedModules.length > 0 && (
                <div>
                  <Text type="success">Adding: </Text>
                  {addedModules.map(m => (
                    <Tag key={m} color="green">{MODULE_DETAILS[m].shortName}</Tag>
                  ))}
                </div>
              )}
              {removedModules.length > 0 && (
                <div>
                  <Text type="danger">Removing: </Text>
                  {removedModules.map(m => (
                    <Tag key={m} color="red">{MODULE_DETAILS[m].shortName}</Tag>
                  ))}
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Users with access to removed modules will lose access.
                    </Text>
                  </div>
                </div>
              )}
            </Space>
          }
          type={removedModules.length > 0 ? 'warning' : 'info'}
          showIcon
          icon={removedModules.length > 0 ? <WarningOutlined /> : <InfoCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Quick Bundles */}
      <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
        <Text strong style={{ marginBottom: 8, display: 'block' }}>Quick Setup</Text>
        <Space wrap size={8}>
          {MODULE_BUNDLES.map(bundle => (
            <Tooltip 
              key={bundle.id} 
              title={
                <div>
                  <div>{bundle.useCase}</div>
                  <div style={{ marginTop: 4, opacity: 0.8 }}>
                    {bundle.modules.map(m => MODULE_DETAILS[m].shortName).join(' + ')}
                  </div>
                </div>
              }
            >
              <Button 
                size="small"
                type={bundle.recommended ? 'primary' : 'default'}
                ghost={bundle.recommended}
                onClick={() => handleApplyBundle(bundle.id)}
              >
                {bundle.name}
                {bundle.recommended && ' ★'}
              </Button>
            </Tooltip>
          ))}
        </Space>
      </Card>

      {/* Module List */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>Modules</Text>
          <Tag color="blue">{enabledModules.length} of {ALL_MODULES.length} enabled</Tag>
        </div>
      </div>

      <List
        dataSource={ALL_MODULES}
        renderItem={(moduleId) => {
          const details = MODULE_DETAILS[moduleId];
          const info = MODULE_INFO[moduleId];
          const isEnabled = enabledModules.includes(moduleId);
          const isIncludedInPlan = plan?.includedModules.includes(moduleId);
          
          // Check if can be disabled
          const { canDisable, blockedBy } = canDisableModule(moduleId, enabledModules);
          const isLocked = isEnabled && !canDisable;
          
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
                <Tooltip 
                  key="switch"
                  title={isLocked ? `Required by: ${blockedBy.map(m => MODULE_DETAILS[m].shortName).join(', ')}` : ''}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isLocked && <LockOutlined style={{ color: '#faad14' }} />}
                    <Switch
                      checked={isEnabled}
                      onChange={(checked) => handleToggle(moduleId, checked)}
                    />
                  </div>
                </Tooltip>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      background: isEnabled ? `${info.color}20` : '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 13,
                      color: isEnabled ? info.color : '#999',
                    }}
                  >
                    {moduleId.toUpperCase()}
                  </div>
                }
                title={
                  <Space wrap size={4}>
                    <Text strong style={{ color: isEnabled ? 'inherit' : '#999' }}>
                      {details.shortName}
                    </Text>
                    {isIncludedInPlan && (
                      <Tag color="green" style={{ fontSize: 10 }}>IN PLAN</Tag>
                    )}
                    {details.isBase && (
                      <Tag style={{ fontSize: 10 }}>STANDALONE</Tag>
                    )}
                    {isLocked && (
                      <Tag color="orange" style={{ fontSize: 10 }}>LOCKED</Tag>
                    )}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{details.description}</Text>
                    {details.requires.length > 0 && (
                      <div style={{ fontSize: 11 }}>
                        <Text type="secondary">Requires: </Text>
                        {details.requires.map((dep, i) => (
                          <span key={dep}>
                            {i > 0 && <ArrowRightOutlined style={{ margin: '0 4px', fontSize: 10 }} />}
                            <Tag 
                              color={enabledModules.includes(dep) ? 'green' : 'default'}
                              style={{ fontSize: 10, margin: 0 }}
                            >
                              {MODULE_DETAILS[dep].shortName}
                            </Tag>
                          </span>
                        ))}
                      </div>
                    )}
                  </Space>
                }
              />
            </List.Item>
          );
        }}
      />

      {/* Dependency Legend */}
      <Divider style={{ margin: '16px 0' }} />
      <Card size="small" style={{ background: '#fafafa' }}>
        <Text strong style={{ marginBottom: 8, display: 'block' }}>How Dependencies Work</Text>
        <Space direction="vertical" size={4}>
          <Text style={{ fontSize: 12 }}>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
            <strong>Auto-Enable:</strong> When you enable a module, its dependencies are automatically enabled.
          </Text>
          <Text style={{ fontSize: 12 }}>
            <LockOutlined style={{ color: '#faad14', marginRight: 4 }} />
            <strong>Locked:</strong> Can't disable until dependent modules are disabled first.
          </Text>
        </Space>
      </Card>
    </Drawer>
  );
}
