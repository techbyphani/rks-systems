import { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Steps,
  Button,
  Space,
  Row,
  Col,
  Card,
  Checkbox,
  Tag,
  Typography,
  Divider,
  Alert,
  message,
} from 'antd';
import {
  ShopOutlined,
  UserOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { tenantService } from '@/api';
import { 
  SUBSCRIPTION_PLANS, 
  formatPrice, 
  MODULE_INFO, 
  REGION_OPTIONS, 
  TIMEZONE_OPTIONS, 
  CURRENCY_OPTIONS,
  ALL_MODULES,
} from '@/config/plans';
import {
  MODULE_DETAILS,
  MODULE_BUNDLES,
  getModulesWithDependencies,
  canDisableModule,
  validateModuleConfiguration,
} from '@/config/moduleDependencies';
import type { ModuleId, CreateTenantDto, SubscriptionPlanId } from '@/types';

const { Title, Text, Paragraph } = Typography;

interface CreateTenantModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTenantModal({ open, onClose, onSuccess }: CreateTenantModalProps) {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId | null>(null);
  const [selectedModules, setSelectedModules] = useState<ModuleId[]>([]);

  const steps = [
    { title: 'Hotel Info', icon: <ShopOutlined /> },
    { title: 'Plan & Modules', icon: <AppstoreOutlined /> },
    { title: 'Admin User', icon: <UserOutlined /> },
  ];

  const handlePlanSelect = (planId: SubscriptionPlanId) => {
    setSelectedPlan(planId);
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (plan) {
      // Start with included modules (already expanded with dependencies in plan definition)
      setSelectedModules([...plan.includedModules]);
      form.setFieldValue('planId', planId);
    }
  };

  const handleModuleToggle = (moduleId: ModuleId, checked: boolean) => {
    if (checked) {
      // Auto-enable dependencies
      const modulesWithDeps = getModulesWithDependencies(moduleId);
      const newModules = Array.from(new Set([...selectedModules, ...modulesWithDeps]));
      
      // Notify if dependencies were added
      const autoEnabled = modulesWithDeps.filter(m => m !== moduleId && !selectedModules.includes(m));
      if (autoEnabled.length > 0) {
        const names = autoEnabled.map(m => MODULE_DETAILS[m].shortName).join(', ');
        message.info(`Also enabled: ${names} (required by ${MODULE_DETAILS[moduleId].shortName})`);
      }
      
      setSelectedModules(newModules);
    } else {
      // Check if can disable
      const { canDisable, blockedBy } = canDisableModule(moduleId, selectedModules);
      
      if (!canDisable) {
        const names = blockedBy.map(m => MODULE_DETAILS[m].shortName).join(', ');
        message.warning(`Cannot disable: ${names} depends on ${MODULE_DETAILS[moduleId].shortName}`);
        return;
      }
      
      setSelectedModules(selectedModules.filter(m => m !== moduleId));
    }
  };

  const handleApplyBundle = (bundleId: string) => {
    const bundle = MODULE_BUNDLES.find(b => b.id === bundleId);
    if (bundle) {
      setSelectedModules([...bundle.modules]);
      message.success(`Applied "${bundle.name}" bundle`);
    }
  };

  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['name', 'region', 'contactEmail']);
      } else if (currentStep === 1) {
        if (!selectedPlan) {
          message.error('Please select a plan');
          return;
        }
        if (selectedModules.length === 0) {
          message.error('Please select at least one module');
          return;
        }
        // Validate dependencies
        const validation = validateModuleConfiguration(selectedModules);
        if (!validation.valid) {
          message.error(validation.errors[0]);
          return;
        }
      }
      setCurrentStep(currentStep + 1);
    } catch (error) {
      // Validation failed
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const data: CreateTenantDto = {
        name: values.name,
        region: values.region,
        timezone: values.timezone,
        currency: values.currency,
        planId: selectedPlan!,
        enabledModules: selectedModules,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        maxRooms: values.maxRooms,
        adminFirstName: values.adminFirstName,
        adminLastName: values.adminLastName,
        adminEmail: values.adminEmail,
      };

      await tenantService.create(data);
      
      // Reset form
      form.resetFields();
      setCurrentStep(0);
      setSelectedPlan(null);
      setSelectedModules([]);
      
      onSuccess();
    } catch (error: any) {
      message.error(error.message || 'Failed to create hotel');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setCurrentStep(0);
    setSelectedPlan(null);
    setSelectedModules([]);
    onClose();
  };

  const plan = selectedPlan ? SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan) : null;

  return (
    <Modal
      title="Add New Hotel"
      open={open}
      onCancel={handleCancel}
      width={800}
      footer={null}
      destroyOnClose
    >
      <Steps
        current={currentStep}
        items={steps}
        style={{ marginBottom: 32 }}
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          timezone: 'Asia/Kolkata',
          currency: 'INR',
        }}
      >
        {/* Step 1: Hotel Info */}
        {currentStep === 0 && (
          <div>
            <Title level={5}>Basic Information</Title>
            <Paragraph type="secondary">
              Enter the hotel details and contact information
            </Paragraph>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="name"
                  label="Hotel Name"
                  rules={[{ required: true, message: 'Hotel name is required' }]}
                >
                  <Input 
                    placeholder="e.g., Grand Palace Hotel" 
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="region"
                  label="Region"
                  rules={[{ required: true, message: 'Region is required' }]}
                >
                  <Select 
                    placeholder="Select region" 
                    options={REGION_OPTIONS}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="timezone" label="Timezone">
                  <Select 
                    options={TIMEZONE_OPTIONS}
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="currency" label="Currency">
                  <Select 
                    options={CURRENCY_OPTIONS}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="maxRooms" label="Number of Rooms">
                  <Input 
                    type="number" 
                    placeholder="e.g., 50" 
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />
            <Title level={5}>Contact Information</Title>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="contactEmail"
                  label="Contact Email"
                  rules={[
                    { required: true, message: 'Email is required' },
                    { type: 'email', message: 'Invalid email' },
                  ]}
                >
                  <Input 
                    placeholder="admin@hotel.com" 
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="contactPhone" label="Contact Phone">
                  <Input 
                    placeholder="+91-80-1234-5678" 
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}

        {/* Step 2: Plan & Modules */}
        {currentStep === 1 && (
          <div>
            <Title level={5}>Select Subscription Plan</Title>
            <Paragraph type="secondary">
              Choose a plan that fits the hotel's needs
            </Paragraph>

            <Row gutter={16} style={{ marginBottom: 24 }}>
              {SUBSCRIPTION_PLANS.filter(p => p.id !== 'custom').map((p) => (
                <Col span={8} key={p.id}>
                  <Card
                    hoverable
                    onClick={() => handlePlanSelect(p.id)}
                    style={{
                      borderColor: selectedPlan === p.id ? '#1890ff' : undefined,
                      borderWidth: selectedPlan === p.id ? 2 : 1,
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      {p.isPopular && (
                        <Tag color="blue" style={{ marginBottom: 8 }}>POPULAR</Tag>
                      )}
                      <Title level={4} style={{ margin: 0 }}>{p.name}</Title>
                      <div style={{ margin: '12px 0' }}>
                        <Text style={{ fontSize: 24, fontWeight: 600 }}>
                          {formatPrice(p.monthlyPrice)}
                        </Text>
                        <Text type="secondary">/month</Text>
                      </div>
                      <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
                        {p.description}
                      </Paragraph>
                      <div style={{ textAlign: 'left', fontSize: 12 }}>
                        <div>• {p.maxUsers === -1 ? 'Unlimited' : p.maxUsers} users</div>
                        <div>• {p.maxRooms === -1 ? 'Unlimited' : p.maxRooms} rooms</div>
                        <div>• {p.includedModules.length} modules included</div>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            {selectedPlan && plan && (
              <>
                <Divider />
                <Title level={5}>Configure Modules</Title>
                <Alert
                  message={`${plan.name} plan includes ${plan.includedModules.length} modules`}
                  description="Dependencies are auto-enabled. Locked modules are required by other enabled modules."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                {/* Quick Bundles */}
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ marginRight: 8 }}>Quick setup:</Text>
                  <Space wrap size={4}>
                    {MODULE_BUNDLES.slice(0, 4).map(bundle => (
                      <Button 
                        key={bundle.id}
                        size="small"
                        type={bundle.recommended ? 'primary' : 'default'}
                        ghost={bundle.recommended}
                        onClick={() => handleApplyBundle(bundle.id)}
                      >
                        {bundle.name}
                      </Button>
                    ))}
                  </Space>
                </div>

                <Row gutter={[12, 12]}>
                  {ALL_MODULES.map((moduleId) => {
                    const info = MODULE_INFO[moduleId];
                    const details = MODULE_DETAILS[moduleId];
                    const isIncluded = plan.includedModules.includes(moduleId);
                    const isOptional = plan.optionalModules.includes(moduleId);
                    const isEnabled = selectedModules.includes(moduleId);
                    const { canDisable, blockedBy } = canDisableModule(moduleId, selectedModules);
                    const isLocked = isEnabled && !canDisable;

                    return (
                      <Col span={8} key={moduleId}>
                        <Card 
                          size="small"
                          style={{ 
                            opacity: isEnabled ? 1 : 0.6,
                            borderColor: isEnabled ? info.color : undefined,
                          }}
                        >
                          <Space align="start">
                            <Checkbox
                              checked={isEnabled}
                              disabled={isLocked}
                              onChange={(e) => handleModuleToggle(moduleId, e.target.checked)}
                            />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                                <Text strong style={{ color: info.color }}>
                                  {moduleId.toUpperCase()}
                                </Text>
                                {isLocked && (
                                  <Tag color="orange" style={{ fontSize: 9 }}>LOCKED</Tag>
                                )}
                                {isIncluded && !isOptional && !isLocked && (
                                  <Tag color="green" style={{ fontSize: 9 }}>INCLUDED</Tag>
                                )}
                                {isOptional && !isLocked && (
                                  <Tag color="blue" style={{ fontSize: 9 }}>OPTIONAL</Tag>
                                )}
                              </div>
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {info.shortName}
                              </Text>
                              {details.requires.length > 0 && (
                                <div style={{ fontSize: 10, marginTop: 2 }}>
                                  <Text type="secondary">
                                    Needs: {details.requires.map(d => d.toUpperCase()).join(', ')}
                                  </Text>
                                </div>
                              )}
                              {isLocked && blockedBy.length > 0 && (
                                <div style={{ fontSize: 10, marginTop: 2 }}>
                                  <Text type="warning">
                                    Used by: {blockedBy.map(d => d.toUpperCase()).join(', ')}
                                  </Text>
                                </div>
                              )}
                            </div>
                          </Space>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </>
            )}
          </div>
        )}

        {/* Step 3: Admin User */}
        {currentStep === 2 && (
          <div>
            <Title level={5}>Hotel Admin Account</Title>
            <Paragraph type="secondary">
              Create the primary administrator account for this hotel
            </Paragraph>

            <Alert
              message="Admin Credentials"
              description="The admin will receive an email with login instructions and a temporary password."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="adminFirstName"
                  label="First Name"
                  rules={[{ required: true, message: 'First name is required' }]}
                >
                  <Input placeholder="John" size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="adminLastName"
                  label="Last Name"
                  rules={[{ required: true, message: 'Last name is required' }]}
                >
                  <Input placeholder="Doe" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="adminEmail"
                  label="Admin Email"
                  rules={[
                    { required: true, message: 'Email is required' },
                    { type: 'email', message: 'Invalid email' },
                  ]}
                >
                  <Input placeholder="admin@hotel.com" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* Summary */}
            <Card style={{ background: '#fafafa' }}>
              <Title level={5}>Summary</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">Hotel:</Text>
                    <Text strong style={{ marginLeft: 8 }}>{form.getFieldValue('name')}</Text>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">Region:</Text>
                    <Text style={{ marginLeft: 8 }}>{form.getFieldValue('region')}</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">Plan:</Text>
                    <Tag color="blue" style={{ marginLeft: 8 }}>{plan?.name}</Tag>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">Modules:</Text>
                    <Text style={{ marginLeft: 8 }}>{selectedModules.length} enabled</Text>
                  </div>
                </Col>
              </Row>
              <div>
                <Text type="secondary">Modules: </Text>
                <Space wrap style={{ marginTop: 4 }}>
                  {selectedModules.map(m => (
                    <Tag key={m} color={MODULE_INFO[m].color}>{m.toUpperCase()}</Tag>
                  ))}
                </Space>
              </div>
            </Card>
          </div>
        )}

        {/* Footer Buttons */}
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleCancel}>Cancel</Button>
          <Space>
            {currentStep > 0 && (
              <Button onClick={handleBack}>Back</Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button type="primary" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button 
                type="primary" 
                onClick={handleSubmit}
                loading={loading}
                icon={<CheckCircleOutlined />}
              >
                Create Hotel
              </Button>
            )}
          </Space>
        </div>
      </Form>
    </Modal>
  );
}
