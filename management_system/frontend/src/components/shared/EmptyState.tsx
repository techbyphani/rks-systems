import { Empty, Button, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, InboxOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

const { Text } = Typography;

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  type?: 'no-data' | 'no-results' | 'error';
}

export default function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  type = 'no-data',
}: EmptyStateProps) {
  const getDefaultContent = () => {
    switch (type) {
      case 'no-results':
        return {
          title: title || 'No results found',
          description: description || 'Try adjusting your search or filter criteria.',
          icon: icon || <SearchOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />,
        };
      case 'error':
        return {
          title: title || 'Something went wrong',
          description: description || 'Please try again later.',
          icon: icon || <InboxOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />,
        };
      default:
        return {
          title: title || 'No data yet',
          description: description || 'Get started by creating your first record.',
          icon: icon || <InboxOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />,
        };
    }
  };

  const content = getDefaultContent();

  return (
    <Empty
      image={content.icon}
      imageStyle={{ height: 80 }}
      description={
        <div style={{ textAlign: 'center' }}>
          <Text strong style={{ display: 'block', marginBottom: 4 }}>
            {content.title}
          </Text>
          <Text type="secondary">{content.description}</Text>
        </div>
      }
    >
      {actionLabel && onAction && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Empty>
  );
}

// Loading State
import { Spin, Card } from 'antd';

interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
}

export function LoadingState({ message = 'Loading...', fullPage }: LoadingStateProps) {
  const content = (
    <div style={{ textAlign: 'center', padding: 48 }}>
      <Spin size="large" />
      <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
        {message}
      </Text>
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        {content}
      </div>
    );
  }

  return <Card>{content}</Card>;
}

// Error State
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Error',
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <EmptyState
      type="error"
      title={title}
      description={message}
      actionLabel={onRetry ? 'Try Again' : undefined}
      onAction={onRetry}
    />
  );
}
