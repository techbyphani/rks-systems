import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Space, Select, Tag, Tooltip, Typography, Spin, message, Badge, Button, Segmented, Drawer, Form, Input, InputNumber, Switch } from 'antd';
import { HomeOutlined, AppstoreOutlined, UnorderedListOutlined, ReloadOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { PageHeader, StatusTag } from '@/components/shared';
import { roomService } from '@/api';
import { useAppContext } from '@/context/AppContext';
import type { Room, RoomType, RoomStatus } from '@/types';

const { Text } = Typography;

const STATUS_COLORS: Record<RoomStatus, string> = {
  available: '#52c41a',
  occupied: '#1890ff',
  reserved: '#13c2c2',
  dirty: '#fa8c16',
  cleaning: '#faad14',
  inspecting: '#722ed1',
  out_of_order: '#ff4d4f',
  out_of_service: '#eb2f96',
};

export default function RoomsPage() {
  const navigate = useNavigate();
  const { tenant } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [floors, setFloors] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'floor'>('grid');
  const [filters, setFilters] = useState<{
    status?: RoomStatus;
    roomTypeId?: string;
    floor?: number;
  }>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
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
      const [roomsData, typesData, floorsData] = await Promise.all([
        roomService.getAll({ tenantId: tenant.id, pageSize: 500 }),
        roomService.getRoomTypes(tenant.id),
        roomService.getFloors(tenant.id),
      ]);
      setRooms(roomsData.data);
      setRoomTypes(typesData);
      setFloors(floorsData);
    } catch (error) {
      message.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter((room) => {
    if (filters.status && room.status !== filters.status) return false;
    if (filters.roomTypeId && room.roomTypeId !== filters.roomTypeId) return false;
    if (filters.floor !== undefined && room.floor !== filters.floor) return false;
    return true;
  });

  const statusCounts = rooms.reduce((acc, room) => {
    acc[room.status] = (acc[room.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleRoomClick = (room: Room) => {
    navigate(`/suite/rms/rooms/${room.id}`);
  };

  const handleStatusChange = async (roomId: string, newStatus: RoomStatus) => {
    if (!tenant?.id) {
      message.error('Tenant context not available');
      return;
    }
    try {
      await roomService.updateStatus(tenant.id, roomId, newStatus);
      message.success('Room status updated');
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Failed to update room status');
    }
  };

  const handleCreate = () => {
    setEditingRoom(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const handleEdit = (room: Room, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRoom(room);
    form.setFieldsValue({
      roomNumber: room.roomNumber,
      roomTypeId: room.roomTypeId,
      floor: room.floor,
      building: room.building,
      wing: room.wing,
      isSmokingAllowed: room.isSmokingAllowed,
      hasBalcony: room.hasBalcony,
      viewType: room.viewType,
      notes: room.notes,
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async (values: any) => {
    if (!tenant?.id) {
      message.error('Tenant context not available');
      return;
    }
    try {
      if (editingRoom) {
        await roomService.update(tenant.id, editingRoom.id, values);
        message.success('Room updated');
      } else {
        if (!tenant?.id) {
          message.error('Tenant context not available');
          return;
        }
        await roomService.create(tenant.id, values);
        message.success('Room created');
      }
      setDrawerOpen(false);
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Failed to save room');
    }
  };

  const renderRoomCard = (room: Room) => (
    <Col key={room.id} xs={12} sm={8} md={6} lg={4} xl={3}>
      <Card
        hoverable
        size="small"
        onClick={() => handleRoomClick(room)}
        style={{
          borderLeft: `4px solid ${STATUS_COLORS[room.status]}`,
          minHeight: 100,
        }}
        bodyStyle={{ padding: 12 }}
        actions={[
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={(e) => handleEdit(room, e)}
          />,
        ]}
      >
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong style={{ fontSize: 16 }}>{room.roomNumber}</Text>
            <Badge color={STATUS_COLORS[room.status]} />
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {room.roomType?.name || 'Unknown Type'}
          </Text>
          <Tag
            color={STATUS_COLORS[room.status]}
            style={{ fontSize: 10, margin: 0 }}
          >
            {room.status.replace(/_/g, ' ').toUpperCase()}
          </Tag>
          {room.currentReservationId && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              Guest in room
            </Text>
          )}
        </Space>
      </Card>
    </Col>
  );

  const renderFloorView = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {floors.map((floor) => {
        const floorRooms = filteredRooms.filter((r) => r.floor === floor);
        if (floorRooms.length === 0) return null;

        return (
          <Card
            key={floor}
            title={`Floor ${floor}`}
            size="small"
            extra={<Text type="secondary">{floorRooms.length} rooms</Text>}
          >
            <Row gutter={[8, 8]}>
              {floorRooms.map(renderRoomCard)}
            </Row>
          </Card>
        );
      })}
    </Space>
  );

  const renderGridView = () => (
    <Row gutter={[12, 12]}>
      {filteredRooms.map(renderRoomCard)}
    </Row>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Room Management"
        subtitle="Real-time room status and availability"
        breadcrumbs={[
          { label: 'RMS', path: '/suite/rms' },
          { label: 'Rooms' },
        ]}
        actions={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Add Room
            </Button>
          </Space>
        }
      />

      {/* Status Summary */}
      <Card size="small">
        <Row gutter={[16, 8]} align="middle">
          <Col>
            <Text strong>Status:</Text>
          </Col>
          {Object.entries(statusCounts).map(([status, count]) => (
            <Col key={status}>
              <Tooltip title={`${count} rooms ${status.replace(/_/g, ' ')}`}>
                <Tag
                  color={STATUS_COLORS[status as RoomStatus]}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setFilters({ ...filters, status: status as RoomStatus })}
                >
                  {status.replace(/_/g, ' ')}: {count}
                </Tag>
              </Tooltip>
            </Col>
          ))}
          {filters.status && (
            <Col>
              <Button size="small" onClick={() => setFilters({ ...filters, status: undefined })}>
                Clear
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      {/* Filters & View Toggle */}
      <Card size="small">
        <Row gutter={16} align="middle" justify="space-between">
          <Col>
            <Space wrap>
              <Select
                placeholder="Room Type"
                allowClear
                style={{ width: 180 }}
                value={filters.roomTypeId}
                onChange={(value) => setFilters({ ...filters, roomTypeId: value })}
                options={roomTypes.map((rt) => ({ label: rt.name, value: rt.id }))}
              />
              <Select
                placeholder="Floor"
                allowClear
                style={{ width: 120 }}
                value={filters.floor}
                onChange={(value) => setFilters({ ...filters, floor: value })}
                options={floors.map((f) => ({ label: `Floor ${f}`, value: f }))}
              />
            </Space>
          </Col>
          <Col>
            <Segmented
              value={viewMode}
              onChange={(value) => setViewMode(value as 'grid' | 'floor')}
              options={[
                { value: 'grid', icon: <AppstoreOutlined />, label: 'Grid' },
                { value: 'floor', icon: <UnorderedListOutlined />, label: 'By Floor' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* Room Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : filteredRooms.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <HomeOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <Text style={{ display: 'block', marginTop: 16 }}>No rooms match the selected filters</Text>
          </div>
        </Card>
      ) : viewMode === 'floor' ? (
        renderFloorView()
      ) : (
        <Card>{renderGridView()}</Card>
      )}

      {/* Room Form Drawer */}
      <Drawer
        title={editingRoom ? 'Edit Room' : 'Add Room'}
        width={600}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>
              {editingRoom ? 'Update' : 'Create'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="roomNumber"
                label="Room Number"
                rules={[{ required: true, message: 'Room number is required' }]}
              >
                <Input placeholder="e.g., 101" disabled={!!editingRoom} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="roomTypeId"
                label="Room Type"
                rules={[{ required: true, message: 'Room type is required' }]}
              >
                <Select placeholder="Select room type" options={roomTypes.map(rt => ({ label: rt.name, value: rt.id }))} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="floor"
                label="Floor"
                rules={[{ required: true, message: 'Floor is required' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} max={50} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="building" label="Building">
                <Input placeholder="e.g., Main Tower" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="wing" label="Wing">
                <Input placeholder="e.g., East, West" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="viewType" label="View Type">
                <Select placeholder="Select view type" options={[
                  { label: 'City View', value: 'City View' },
                  { label: 'Sea View', value: 'Sea View' },
                  { label: 'Garden View', value: 'Garden View' },
                  { label: 'Pool View', value: 'Pool View' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="hasBalcony" label="Has Balcony" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="isSmokingAllowed" label="Smoking Allowed" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="rateOverride" label="Rate Override (₹)">
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              prefix="₹" 
              placeholder="Leave empty to use room type base rate"
            />
          </Form.Item>

          <Form.Item name="amenityOverrides" label="Additional Amenities">
            <Select 
              mode="tags" 
              placeholder="Add room-specific amenities"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Additional notes about the room..." />
          </Form.Item>
        </Form>
      </Drawer>
    </Space>
  );
}
