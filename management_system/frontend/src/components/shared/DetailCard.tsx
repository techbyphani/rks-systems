import { Card, Descriptions, Skeleton, Space, Typography, Divider } from 'antd';
import type { DescriptionsProps } from 'antd';
import type { ReactNode } from 'react';

const { Title, Text } = Typography;

interface DetailItem {
  label: string;
  value: ReactNode;
  span?: number;
}

interface DetailCardProps {
  title?: string;
  items: DetailItem[];
  extra?: ReactNode;
  loading?: boolean;
  column?: number;
  size?: 'default' | 'middle' | 'small';
  bordered?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export default function DetailCard({
  title,
  items,
  extra,
  loading,
  column = 2,
  size = 'default',
  bordered = true,
  layout = 'horizontal',
}: DetailCardProps) {
  if (loading) {
    return (
      <Card title={title}>
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  return (
    <Card title={title} extra={extra}>
      <Descriptions
        column={column}
        size={size}
        bordered={bordered}
        layout={layout}
      >
        {items.map((item, index) => (
          <Descriptions.Item key={index} label={item.label} span={item.span}>
            {item.value ?? <Text type="secondary">—</Text>}
          </Descriptions.Item>
        ))}
      </Descriptions>
    </Card>
  );
}

// Info Section - for grouped information display
interface InfoSectionProps {
  title: string;
  children: ReactNode;
  extra?: ReactNode;
}

export function InfoSection({ title, children, extra }: InfoSectionProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Title level={5} style={{ margin: 0 }}>{title}</Title>
        {extra}
      </div>
      {children}
    </div>
  );
}

// Info Row - for key-value pairs
interface InfoRowProps {
  label: string;
  value: ReactNode;
  copyable?: boolean;
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div style={{ display: 'flex', marginBottom: 8 }}>
      <Text type="secondary" style={{ width: 140, flexShrink: 0 }}>{label}:</Text>
      <Text>{value ?? '—'}</Text>
    </div>
  );
}

// Two Column Layout
interface TwoColumnLayoutProps {
  left: ReactNode;
  right: ReactNode;
  leftSpan?: number;
  gap?: number;
}

export function TwoColumnLayout({ left, right, leftSpan = 60, gap = 24 }: TwoColumnLayoutProps) {
  return (
    <div style={{ display: 'flex', gap }}>
      <div style={{ flex: `0 0 ${leftSpan}%`, maxWidth: `${leftSpan}%` }}>
        {left}
      </div>
      <div style={{ flex: 1 }}>
        {right}
      </div>
    </div>
  );
}
