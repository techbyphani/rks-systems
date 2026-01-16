import { useEffect, useState } from 'react';
import { Card, Row, Col, Space, Typography, Spin, message, Tag, Statistic, Image, Descriptions, Button, Drawer, Form, Input, InputNumber, Select, Switch } from 'antd';
import { PlusOutlined, EditOutlined, HomeOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/shared';
import { roomService, roomTypeService } from '@/api';
import type { RoomType } from '@/types';
import { useAppContext } from '@/context/AppContext';

const { Text, Title, Paragraph } = Typography;

const BED_TYPES = ['King', 'Queen', 'Twin', 'Double', 'Single', 'Sofa Bed'];
const AMENITIES_OPTIONS = [
  'Air Conditioning', 'Mini Bar', 'Safe', 'TV', 'WiFi', 'Room Service',
  'Bathtub', 'Shower', 'Hair Dryer', 'Coffee Maker', 'Iron', 'Work Desk',
  'Balcony', 'Sea View', 'City View', 'Garden View', 'Pool Access',
];

export default function RoomTypesPage() {
  const { tenant } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [roomCounts, setRoomCounts] = useState<Record<string, number>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingType, setEditingType] = useState<RoomType | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (tenant?.id) {
      loadData();
    }
  }, [tenant?.id]);

  const loadData = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const [types, counts] = await Promise.all([
        roomService.getRoomTypes(tenant.id),
        roomTypeService.getRoomCountByType(tenant.id),
      ]);
      setRoomTypes(types);
      setRoomCounts(counts);
    } catch (error) {
      message.error('Failed to load room types');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (roomType: RoomType) => {
    setEditingType(roomType);
    form.setFieldsValue(roomType);
    setDrawerOpen(true);
  };

  const handleCreate = () => {
    setEditingType(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const handleSubmit = async (values: any) => {
    if (!tenant?.id) {
      message.error('Tenant context not available');
      return;
    }
    try {
      if (editingType) {
        await roomTypeService.update(tenant.id, editingType.id, values);
        message.success('Room type updated');
      } else {
        await roomTypeService.create(tenant.id, values);
        message.success('Room type created');
      }
      setDrawerOpen(false);
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Failed to save room type');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Room Types"
        subtitle="Manage room categories and configurations"
        breadcrumbs={[
          { label: 'RMS', path: '/suite/rms' },
          { label: 'Room Types' },
        ]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Room Type
          </Button>
        }
      />

      <Row gutter={[16, 16]}>
        {roomTypes.map((roomType) => (
          <Col key={roomType.id} xs={24} lg={12} xl={8}>
            <Card
              hoverable
              cover={
                roomType.images?.[0] ? (
                  <Image
                    height={180}
                    src={roomType.images[0]}
                    style={{ objectFit: 'cover' }}
                    preview={false}
                  />
                ) : (
                  <div
                    style={{
                      height: 180,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <HomeOutlined style={{ fontSize: 48, color: '#fff' }} />
                  </div>
                )
              }
              actions={[
                <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(roomType)}>
                  Edit
                </Button>,
              ]}
            >
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <Title level={5} style={{ margin: 0 }}>{roomType.name}</Title>
                    <Text type="secondary">{roomType.code}</Text>
                  </div>
                  <Tag color={roomType.isActive ? 'green' : 'default'}>
                    {roomType.isActive ? 'Active' : 'Inactive'}
                  </Tag>
                </div>

                <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                  {roomType.description}
                </Paragraph>

                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="Base Rate"
                      value={roomType.baseRate}
                      prefix="₹"
                      valueStyle={{ fontSize: 16 }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Rooms"
                      value={roomCounts[roomType.id] || 0}
                      valueStyle={{ fontSize: 16 }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Max Guests"
                      value={roomType.maxOccupancy}
                      valueStyle={{ fontSize: 16 }}
                    />
                  </Col>
                </Row>

                <div>
                  <Space size={4} wrap>
                    <Tag>{roomType.bedType} × {roomType.bedCount}</Tag>
                    <Tag>{roomType.size} sq ft</Tag>
                    {roomType.amenities?.slice(0, 3).map((amenity) => (
                      <Tag key={amenity} color="blue">{amenity}</Tag>
                    ))}
                    {roomType.amenities && roomType.amenities.length > 3 && (
                      <Tag>+{roomType.amenities.length - 3} more</Tag>
                    )}
                  </Space>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Room Type Form Drawer */}
      <Drawer
        title={editingType ? 'Edit Room Type' : 'Add Room Type'}
        width={600}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>
              {editingType ? 'Update' : 'Create'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="Code" rules={[{ required: true }]}>
                <Input placeholder="e.g., DLX" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input placeholder="e.g., Deluxe Room" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Room type description..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="baseRate" label="Base Rate" rules={[{ required: true }]}>
                <InputNumber prefix="₹" style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxOccupancy" label="Max Occupancy" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} max={10} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="size" label="Size (sq ft)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="maxAdults" label="Max Adults">
                <InputNumber style={{ width: '100%' }} min={1} max={10} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxChildren" label="Max Children">
                <InputNumber style={{ width: '100%' }} min={0} max={10} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="bedCount" label="Bed Count">
                <InputNumber style={{ width: '100%' }} min={1} max={5} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="bedType" label="Bed Type">
            <Select placeholder="Select bed type" options={BED_TYPES.map((b) => ({ label: b, value: b }))} />
          </Form.Item>

          <Form.Item name="amenities" label="Amenities">
            <Select
              mode="multiple"
              placeholder="Select amenities"
              options={AMENITIES_OPTIONS.map((a) => ({ label: a, value: a }))}
            />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </Space>
  );
}
