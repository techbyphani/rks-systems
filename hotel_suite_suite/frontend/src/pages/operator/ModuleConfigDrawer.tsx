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
  ExclamationCircleOutlined,
  LinkOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { tenantService, tenantUserService } from '@/api';
import { MODULE_INFO, SUBSCRIPTION_PLANS, ALL_MODULES } from '@/config/plans';
import { 
  validateModuleConfiguration, 
  getAffectedModules, 
  suggestModules,
  autoEnableDependencies,
  MODULE_BUNDLES,
  MODULE_DEPENDENCIES,
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

  // Suggestions
  const suggestions = useMemo(() => {
    return suggestModules(enabledModules);
  }, [enabledModules]);

  const handleToggle = (moduleId: ModuleId, enabled: boolean) => {
    if (enabled) {
      // Auto-enable required dependencies
      const withDeps = autoEnableDependencies([...enabledModules, moduleId]);
      
      if (withDeps.length > enabledModules.length + 1) {
        // Some dependencies were auto-added
        const autoAdded = withDeps.filter(m => !enabledModules.includes(m) && m !== moduleId);
        message.info(
          `Auto-enabled ${autoAdded.map(m => m.toUpperCase()).join(', ')} (required by ${moduleId.toUpperCase()})`
        );
      }
      
      setEnabledModules(withDeps);
    } else {
      // Check what would break
      const affected = getAffectedModules(moduleId, enabledModules);
      
      if (affected.breaking.length > 0) {
        Modal.confirm({
          title: 'Disable Module?',
          icon: <ExclamationCircleOutlined />,
          content: (
            <div>
              <Paragraph>
                Disabling <strong>{moduleId.toUpperCase()}</strong> will also affect:
              </Paragraph>
              <div style={{ marginBottom: 12 }}>
                <Text type="danger">Breaking changes:</Text>
                <div>
                  {affected.breaking.map(m => (
                    <Tag key={m} color="red">{m.toUpperCase()} - will not work properly</Tag>
                  ))}
                </div>
              </div>
              <Paragraph type="secondary">
                Consider disabling these modules as well, or keep {moduleId.toUpperCase()} enabled.
              </Paragraph>
            </div>
          ),
          okText: 'Disable Anyway',
          okButtonProps: { danger: true },
          onOk: () => {
            setEnabledModules(enabledModules.filter(m => m !== moduleId));
          },
        });
      } else {
        setEnabledModules(enabledModules.filter(m => m !== moduleId));
        
        if (affected.degraded.length > 0) {
          message.warning(
            `${affected.degraded.map(m => m.toUpperCase()).join(', ')} will have reduced functionality`
          );
        }
      }
    }
  };

  const handleSave = async () => {
    if (!tenant) return;
    
    if (enabledModules.length === 0) {
      message.error('At least one module must be enabled');
      return;
    }
    
    if (!validation.valid) {
      message.error('Please fix dependency errors before saving');
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
      message.success(`Applied "${bundle.name}" bundle`);
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
      width={640}
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

      {/* Dependency Errors */}
      {!validation.valid && (
        <Alert
          message="Configuration Error"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validation.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          }
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Dependency Warnings */}
      {validation.warnings.length > 0 && validation.valid && (
        <Alert
          message="Recommendations"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validation.warnings.slice(0, 3).map((warn, i) => (
                <li key={i} style={{ color: '#666' }}>{warn}</li>
              ))}
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Warning if disabling modules */}
      {removedModules.length > 0 && validation.valid && (
        <Alert
          message="Modules will be disabled"
          description={
            <Space wrap>
              {removedModules.map(m => (
                <Tag key={m} color="red">{m.toUpperCase()}</Tag>
              ))}
              <Text type="secondary" style={{ fontSize: 12 }}>
                Users with access to these modules will lose access.
              </Text>
            </Space>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Module Bundles */}
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ marginBottom: 8, display: 'block' }}>Quick Setup (Bundles)</Text>
        <Space wrap>
          {MODULE_BUNDLES.map(bundle => (
            <Tooltip key={bundle.id} title={bundle.useCase}>
              <Button 
                size="small"
                onClick={() => handleApplyBundle(bundle.id)}
              >
                {bundle.name}
              </Button>
            </Tooltip>
          ))}
        </Space>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Module Toggles */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text strong>Enabled Modules</Text>
          <Tag color="blue">{enabledModules.length} of {ALL_MODULES.length}</Tag>
        </div>
      </div>

      <List
        dataSource={ALL_MODULES}
        renderItem={(moduleId) => {
          const info = MODULE_INFO[moduleId];
          const config = MODULE_DEPENDENCIES[moduleId];
          const isEnabled = enabledModules.includes(moduleId);
          const isIncludedInPlan = plan?.includedModules.includes(moduleId);
          const isOptionalInPlan = plan?.optionalModules.includes(moduleId);
          
          // Check dependencies
          const requiredDeps = config.dependencies.filter(d => d.type === 'required');
          const enhancingDeps = config.dependencies.filter(d => d.type === 'enhances');
          const missingRequired = requiredDeps.filter(d => !enabledModules.includes(d.moduleId));
          const missingEnhancing = enhancingDeps.filter(d => !enabledModules.includes(d.moduleId));
          
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
                  <Space wrap size={4}>
                    <Text strong>{info.name}</Text>
                    {isIncludedInPlan && (
                      <Tag color="green" style={{ fontSize: 10 }}>INCLUDED</Tag>
                    )}
                    {isOptionalInPlan && (
                      <Tag color="orange" style={{ fontSize: 10 }}>OPTIONAL</Tag>
                    )}
                    {requiredDeps.length > 0 && (
                      <Tooltip title={`Requires: ${requiredDeps.map(d => d.moduleId.toUpperCase()).join(', ')}`}>
                        <Tag icon={<LinkOutlined />} style={{ fontSize: 10 }}>
                          Needs {requiredDeps.map(d => d.moduleId.toUpperCase()).join(', ')}
                        </Tag>
                      </Tooltip>
                    )}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{info.description}</Text>
                    {isEnabled && missingEnhancing.length > 0 && (
                      <Text type="warning" style={{ fontSize: 11 }}>
                        ⚡ Works better with: {missingEnhancing.map(d => d.moduleId.toUpperCase()).join(', ')}
                      </Text>
                    )}
                    {isEnabled && missingRequired.length > 0 && (
                      <Text type="danger" style={{ fontSize: 11 }}>
                        ⚠️ Requires: {missingRequired.map(d => d.moduleId.toUpperCase()).join(', ')}
                      </Text>
                    )}
                  </Space>
                }
              />
            </List.Item>
          );
        }}
      />

      {/* Suggestions */}
      {suggestions.recommended.length > 0 && (
        <>
          <Divider />
          <Alert
            message="Suggested Modules"
            description={
              <Space direction="vertical" size={4}>
                {suggestions.recommended.map(moduleId => (
                  <div key={moduleId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      <Tag color={MODULE_INFO[moduleId].color}>{moduleId.toUpperCase()}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>{suggestions.reasons[moduleId]}</Text>
                    </span>
                    <Button 
                      size="small" 
                      type="link"
                      onClick={() => handleToggle(moduleId, true)}
                    >
                      Enable
                    </Button>
                  </div>
                ))}
              </Space>
            }
            type="info"
            showIcon
            icon={<CheckCircleOutlined />}
          />
        </>
      )}
    </Drawer>
  );
}
