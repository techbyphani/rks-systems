import { Card, Statistic, Progress, Space, Typography } from 'antd';
import type { ReactNode } from 'react';

const { Text } = Typography;

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: ReactNode;
  suffix?: string;
  description?: string;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  progress?: {
    percent: number;
    strokeColor?: string;
  };
  color?: string;
  loading?: boolean;
  onClick?: () => void;
}

export default function StatCard({
  title,
  value,
  prefix,
  suffix,
  description,
  trend,
  progress,
  color,
  loading,
  onClick,
}: StatCardProps) {
  return (
    <Card
      loading={loading}
      hoverable={!!onClick}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ color }}
      />
      
      {description && (
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          {description}
        </Text>
      )}
      
      {trend && (
        <Space style={{ marginTop: 8 }}>
          <Text
            style={{
              color: trend.isPositive ? '#52c41a' : '#ff4d4f',
              fontSize: 12,
            }}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            vs last period
          </Text>
        </Space>
      )}
      
      {progress && (
        <Progress
          percent={progress.percent}
          showInfo={false}
          strokeColor={progress.strokeColor || color}
          style={{ marginTop: 12 }}
        />
      )}
    </Card>
  );
}

// Grid of stat cards
interface StatGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 6;
}

export function StatGrid({ children, columns = 4 }: StatGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 16,
      }}
    >
      {children}
    </div>
  );
}
