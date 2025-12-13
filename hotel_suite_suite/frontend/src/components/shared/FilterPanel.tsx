import { Card, Form, Row, Col, Button, Space, Select, DatePicker, Input } from 'antd';
import { FilterOutlined, ClearOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { useState } from 'react';

interface FilterPanelProps {
  children: ReactNode;
  onFilter: (values: Record<string, unknown>) => void;
  onReset: () => void;
  loading?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export default function FilterPanel({
  children,
  onFilter,
  onReset,
  loading,
  collapsible = true,
  defaultCollapsed = true,
}: FilterPanelProps) {
  const [form] = Form.useForm();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  const handleFinish = (values: Record<string, unknown>) => {
    // Remove undefined/null values
    const cleanValues = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    onFilter(cleanValues);
  };

  if (collapsible && collapsed) {
    return (
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<FilterOutlined />}
          onClick={() => setCollapsed(false)}
        >
          Show Filters
        </Button>
      </div>
    );
  }

  return (
    <Card 
      size="small" 
      style={{ marginBottom: 16 }}
      title={collapsible ? "Filters" : undefined}
      extra={collapsible && (
        <Button type="link" size="small" onClick={() => setCollapsed(true)}>
          Hide
        </Button>
      )}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Row gutter={16}>
          {children}
        </Row>
        <Row>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<ClearOutlined />} onClick={handleReset}>
                Reset
              </Button>
              <Button type="primary" htmlType="submit" loading={loading} icon={<FilterOutlined />}>
                Apply Filters
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}

// Filter field components for common patterns
interface FilterFieldProps {
  name: string;
  label: string;
  span?: number;
}

export function TextFilter({ name, label, span = 6 }: FilterFieldProps) {
  return (
    <Col span={span}>
      <Form.Item name={name} label={label}>
        <Input allowClear />
      </Form.Item>
    </Col>
  );
}

interface SelectFilterProps extends FilterFieldProps {
  options: { label: string; value: string | number }[];
  mode?: 'multiple' | 'tags';
}

export function SelectFilter({ name, label, options, mode, span = 6 }: SelectFilterProps) {
  return (
    <Col span={span}>
      <Form.Item name={name} label={label}>
        <Select
          allowClear
          mode={mode}
          options={options}
          placeholder={`Select ${label.toLowerCase()}`}
        />
      </Form.Item>
    </Col>
  );
}

interface DateFilterProps extends FilterFieldProps {
  showTime?: boolean;
}

export function DateFilter({ name, label, showTime, span = 6 }: DateFilterProps) {
  return (
    <Col span={span}>
      <Form.Item name={name} label={label}>
        <DatePicker style={{ width: '100%' }} showTime={showTime} />
      </Form.Item>
    </Col>
  );
}

export function DateRangeFilter({ name, label, span = 8 }: FilterFieldProps) {
  return (
    <Col span={span}>
      <Form.Item name={name} label={label}>
        <DatePicker.RangePicker style={{ width: '100%' }} />
      </Form.Item>
    </Col>
  );
}
