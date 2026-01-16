import { Breadcrumb, Button, Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

const { Title, Text } = Typography;

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  showBack?: boolean;
  backPath?: string;
  actions?: ReactNode;
  extra?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  showBack,
  backPath,
  actions,
  extra,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          style={{ marginBottom: 8 }}
          items={breadcrumbs.map((item, index) => ({
            title: item.path ? (
              <a onClick={() => navigate(item.path!)}>{item.label}</a>
            ) : (
              item.label
            ),
            key: index,
          }))}
        />
      )}
      
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <Space align="start">
          {showBack && (
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              style={{ marginTop: 4 }}
            />
          )}
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {title}
            </Title>
            {subtitle && (
              <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
                {subtitle}
              </Text>
            )}
          </div>
        </Space>
        
        {actions && (
          <Space>
            {actions}
          </Space>
        )}
      </div>
      
      {extra && (
        <div style={{ marginTop: 16 }}>
          {extra}
        </div>
      )}
    </div>
  );
}
