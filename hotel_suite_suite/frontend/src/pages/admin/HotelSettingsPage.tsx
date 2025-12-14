import { useState } from 'react';
import {
  Card,
  Typography,
  Space,
  Descriptions,
  Tag,
  Row,
  Col,
  Statistic,
  Alert,
  Divider,
  Button,
} from 'antd';
import {
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TeamOutlined,
  HomeOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAppContext } from '@/context/AppContext';
import { SUBSCRIPTION_PLANS, MODULE_INFO, formatPrice } from '@/config/plans';
import { PageHeader } from '@/components/shared';

const { Text, Title, Paragraph } = Typography;

export default function HotelSettingsPage() {
  const { tenant, user } = useAppContext();

  if (!tenant) return null;

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === tenant.planId);
  const isTrialExpiring = tenant.status === 'trial' && tenant.trialEndsAt;
  const trialDaysLeft = isTrialExpiring 
    ? Math.ceil((new Date(tenant.trialEndsAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Hotel Settings"
        subtitle="View your hotel information and subscription details"
        breadcrumbs={[
          { label: 'Administration' },
          { label: 'Settings' },
        ]}
      />

      {/* Trial Warning */}
      {isTrialExpiring && trialDaysLeft <= 7 && (
        <Alert
          message="Trial Ending Soon"
          description={`Your trial ends in ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''}. Contact support to upgrade your subscription.`}
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          action={
            <Button type="primary" size="small">
              Upgrade Now
            </Button>
          }
        />
      )}

      {/* Status Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Status"
              value={tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
              valueStyle={{ 
                color: tenant.status === 'active' ? '#52c41a' : 
                       tenant.status === 'trial' ? '#1890ff' : '#ff4d4f' 
              }}
              prefix={
                tenant.status === 'active' ? <CheckCircleOutlined /> : 
                tenant.status === 'trial' ? <ClockCircleOutlined /> : 
                <ExclamationCircleOutlined />
              }
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Plan"
              value={plan?.name || tenant.planId}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Modules"
              value={tenant.enabledModules.length}
              suffix="/ 9"
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="User Limit"
              value={tenant.maxUsers === -1 ? 'Unlimited' : tenant.maxUsers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Hotel Information */}
        <Col xs={24} lg={12}>
          <Card title="Hotel Information">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Hotel Name">
                <Text strong>{tenant.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Region">
                <Space>
                  <GlobalOutlined />
                  {tenant.region}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Timezone">
                <Space>
                  <ClockCircleOutlined />
                  {tenant.timezone}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Currency">
                <Space>
                  <DollarOutlined />
                  {tenant.currency}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Contact Email">
                <Space>
                  <MailOutlined />
                  <Text copyable>{tenant.contactEmail}</Text>
                </Space>
              </Descriptions.Item>
              {tenant.contactPhone && (
                <Descriptions.Item label="Contact Phone">
                  <Space>
                    <PhoneOutlined />
                    {tenant.contactPhone}
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            <Descriptions column={1} size="small">
              <Descriptions.Item label="Created">
                <Space>
                  <CalendarOutlined />
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </Space>
              </Descriptions.Item>
              {tenant.subscribedAt && (
                <Descriptions.Item label="Subscribed">
                  {new Date(tenant.subscribedAt).toLocaleDateString()}
                </Descriptions.Item>
              )}
              {tenant.trialEndsAt && (
                <Descriptions.Item label="Trial Ends">
                  <Text type={trialDaysLeft <= 7 ? 'danger' : 'warning'}>
                    {new Date(tenant.trialEndsAt).toLocaleDateString()}
                    {trialDaysLeft > 0 && ` (${trialDaysLeft} days left)`}
                  </Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        {/* Subscription Details */}
        <Col xs={24} lg={12}>
          <Card title="Subscription Details">
            {plan && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Tag 
                    color={
                      plan.id === 'enterprise' ? 'purple' :
                      plan.id === 'professional' ? 'blue' : 'green'
                    }
                    style={{ fontSize: 14, padding: '4px 12px' }}
                  >
                    {plan.name} Plan
                  </Tag>
                  {plan.isPopular && <Tag color="gold">Popular</Tag>}
                </div>

                <Paragraph type="secondary">{plan.description}</Paragraph>

                <Descriptions column={1} size="small" style={{ marginTop: 16 }}>
                  <Descriptions.Item label="Monthly Price">
                    <Text strong>{formatPrice(plan.monthlyPrice)}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Max Users">
                    {plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers}
                  </Descriptions.Item>
                  <Descriptions.Item label="Max Rooms">
                    {plan.maxRooms === -1 ? 'Unlimited' : plan.maxRooms}
                  </Descriptions.Item>
                </Descriptions>

                <Divider />

                <Title level={5}>Included Features</Title>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {plan.features.slice(0, 5).map((feature, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>
                      <Text type="secondary">{feature}</Text>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* Enabled Modules */}
      <Card title="Enabled Modules">
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          These modules are enabled for your hotel. Contact your administrator to add or remove modules.
        </Paragraph>
        
        <Row gutter={[12, 12]}>
          {tenant.enabledModules.map(moduleId => {
            const info = MODULE_INFO[moduleId];
            return (
              <Col xs={24} sm={12} md={8} key={moduleId}>
                <Card 
                  size="small"
                  style={{ 
                    borderLeft: `3px solid ${info?.color || '#1890ff'}`,
                  }}
                >
                  <Space>
                    <Tag 
                      color={info?.color} 
                      style={{ fontWeight: 600, fontSize: 12 }}
                    >
                      {moduleId.toUpperCase()}
                    </Tag>
                    <div>
                      <Text strong style={{ display: 'block' }}>{info?.shortName}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{info?.description}</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>

        {tenant.enabledModules.length < 9 && (
          <Alert
            message={`${9 - tenant.enabledModules.length} additional modules available`}
            description="Contact your operator to enable more modules for your hotel."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      {/* Support */}
      <Card title="Need Help?">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Card size="small" hoverable>
              <Space>
                <MailOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <div>
                  <Text strong>Email Support</Text>
                  <br />
                  <Text type="secondary">support@hotelsuite.com</Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card size="small" hoverable>
              <Space>
                <PhoneOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                <div>
                  <Text strong>Phone Support</Text>
                  <br />
                  <Text type="secondary">+91-80-1234-5678</Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </Space>
  );
}
