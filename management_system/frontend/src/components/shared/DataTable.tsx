import { Table, Input, Space, Button, Card } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { TableProps, TablePaginationConfig } from 'antd';
import type { ReactNode } from 'react';
import { useState } from 'react';

interface DataTableProps<T> extends Omit<TableProps<T>, 'title'> {
  title?: string;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  onRefresh?: () => void;
  extra?: ReactNode;
  showSearch?: boolean;
  showCard?: boolean;
}

export default function DataTable<T extends object>({
  title,
  searchPlaceholder = 'Search...',
  onSearch,
  onRefresh,
  extra,
  showSearch = true,
  showCard = true,
  loading,
  ...tableProps
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  const toolbar = (showSearch || onRefresh || extra) && (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: 16,
      flexWrap: 'wrap',
      gap: 12,
    }}>
      <Space wrap>
        {showSearch && onSearch && (
          <Input.Search
            placeholder={searchPlaceholder}
            allowClear
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 280 }}
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          />
        )}
      </Space>
      
      <Space wrap>
        {extra}
        {onRefresh && (
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading as boolean}
          >
            Refresh
          </Button>
        )}
      </Space>
    </div>
  );

  // Ensure dataSource is always an array
  const safeDataSource = Array.isArray(tableProps.dataSource) 
    ? tableProps.dataSource 
    : [];

  const table = (
    <>
      {toolbar}
      <Table<T>
        loading={loading}
        size="middle"
        scroll={{ x: 'max-content' }}
        {...tableProps}
        dataSource={safeDataSource}
      />
    </>
  );

  if (showCard) {
    return (
      <Card title={title} bordered={false}>
        {table}
      </Card>
    );
  }

  return table;
}

// Pagination helper
export function createPaginationConfig(
  current: number,
  pageSize: number,
  total: number,
  onChange: (page: number, pageSize: number) => void
): TablePaginationConfig {
  return {
    current,
    pageSize,
    total,
    onChange,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
    pageSizeOptions: ['10', '20', '50', '100'],
  };
}
