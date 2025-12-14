import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Col,
  Row,
  Space,
  Spin,
  Typography,
  Descriptions,
  Tag,
  Button,
  Timeline,
  Empty,
  message,
  Select,
  Modal,
  Divider,
  List,
  Badge,
} from 'antd';
import {
  HomeOutlined,
  EditOutlined,
  ToolOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { PageHeader, StatusTag } from '@/components/shared';
import { roomService, reservationService } from '@/api';
import type { Room, RoomStatus, Reservation } from '@/types';

const { Text, Title } = Typography;

const STATUS_OPTIONS: { label: string; value: RoomStatus; color: string }[] = [
  { label: 'Available', value: 'available', color: '#52c41a' },
  { label: 'Occupied', value: 'occupied', color: '#1890ff' },
  { label: 'Reserved', value: 'reserved', color: '#13c2c2' },
  { label: 'Dirty', value: 'dirty', color: '#fa8c16' },
  { label: 'Cleaning', value: 'cleaning', color: '#faad14' },
  { label: 'Inspecting', value: 'inspecting', color: '#722ed1' },
  { label: 'Out of Order', value: 'out_of_order', color: '#ff4d4f' },
  { label: 'Out of Service', value: 'out_of_service', color: '#eb2f96' },
];

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<RoomStatus | null>(null);

  useEffect(() => {
    if (id) {
      loadRoom();
    }
  }, [id]);

  const loadRoom = async () => {
    setLoading(true);
    try {
      const data = await roomService.getById(id!);
      setRoom(data);
      
      if (data?.currentReservationId) {
        const reservation = await reservationService.getById(data.currentReservationId);
        setCurrentReservation(reservation);
      }
    } catch (error) {
      message.error('Failed to load room');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || !room) return;
    
    try {
      await roomService.updateStatus(room.id, newStatus);
      message.success('Room status updated');
      setStatusModalOpen(false);
      loadRoom();
    } catch (error) {
      message.error('Failed to update room status');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!room) {
    return <Empty description="Room not found" />;
  }

  const statusOption = STATUS_OPTIONS.find((s) => s.value === room.status);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title={`Room ${room.roomNumber}`}
        subtitle={room.roomType?.name || 'Unknown Type'}
        showBack
        backPath="/suite/rms/rooms"
        breadcrumbs={[
          { label: 'RMS', path: '/suite/rms' },
          { label: 'Rooms', path: '/suite/rms/rooms' },
          { label: room.roomNumber },
        ]}
        actions={
          <Space>
            <Button onClick={() => setStatusModalOpen(true)}>
              Change Status
            </Button>
            <Button icon={<ToolOutlined />} onClick={() => navigate('/suite/rms/maintenance')}>
              Report Issue
            </Button>
          </Space>
        }
      />

      {/* Room Header Card */}
      <Card>
        <Row gutter={24} align="middle">
          <Col>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 12,
                background: statusOption?.color || '#1890ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HomeOutlined style={{ fontSize: 36, color: '#fff' }} />
            </div>
          </Col>
          <Col flex={1}>
            <Space direction="vertical" size={4}>
              <Space>
                <Title level={3} style={{ margin: 0 }}>
                  Room {room.roomNumber}
                </Title>
                <StatusTag status={room.status} type="room" />
              </Space>
              <Text type="secondary">
                {room.roomType?.name} · Floor {room.floor}
                {room.building && ` · ${room.building}`}
                {room.wing && ` · ${room.wing} Wing`}
              </Text>
              <Space wrap>
                {room.hasBalcony && <Tag color="green">Balcony</Tag>}
                {room.viewType && <Tag color="blue">{room.viewType} View</Tag>}
                {room.isSmokingAllowed && <Tag color="orange">Smoking Allowed</Tag>}
              </Space>
            </Space>
          </Col>
          <Col>
            <div style={{ textAlign: 'right' }}>
              <Text type="secondary">Room Rate</Text>
              <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                ₹{room.roomType?.baseRate?.toLocaleString('en-IN') || 0}/night
              </Title>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Left Column */}
        <Col xs={24} lg={16}>
          {/* Current Guest */}
          {currentReservation && (
            <Card
              title={
                <Space>
                  <UserOutlined />
                  Current Guest
                </Space>
              }
              extra={
                <Button
                  type="link"
                  onClick={() => navigate(`/suite/crs/reservations/${currentReservation.id}`)}
                >
                  View Reservation
                </Button>
              }
            >
              <Descriptions column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="Guest">
                  {currentReservation.guest?.firstName} {currentReservation.guest?.lastName}
                </Descriptions.Item>
                <Descriptions.Item label="Confirmation">
                  {currentReservation.confirmationNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Check-in">
                  {new Date(currentReservation.checkInDate).toLocaleDateString()}
                </Descriptions.Item>
                <Descriptions.Item label="Check-out">
                  {new Date(currentReservation.checkOutDate).toLocaleDateString()}
                </Descriptions.Item>
                <Descriptions.Item label="VIP Status">
                  <StatusTag status={currentReservation.guest?.vipStatus || 'none'} type="vip" />
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {!currentReservation && room.status === 'available' && (
            <Card>
              <div style={{ textAlign: 'center', padding: 24 }}>
                <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                <Title level={4} style={{ marginTop: 16 }}>Room Available</Title>
                <Text type="secondary">This room is ready for the next guest</Text>
              </div>
            </Card>
          )}

          {/* Room Details */}
          <Card title="Room Details" style={{ marginTop: 16 }}>
            <Descriptions column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Room Number">{room.roomNumber}</Descriptions.Item>
              <Descriptions.Item label="Room Type">{room.roomType?.name}</Descriptions.Item>
              <Descriptions.Item label="Floor">{room.floor}</Descriptions.Item>
              <Descriptions.Item label="Building">{room.building || '-'}</Descriptions.Item>
              <Descriptions.Item label="Max Occupancy">
                {room.roomType?.maxOccupancy || '-'} guests
              </Descriptions.Item>
              <Descriptions.Item label="Bed Type">
                {room.roomType?.bedType || '-'} ({room.roomType?.bedCount || 0} beds)
              </Descriptions.Item>
              <Descriptions.Item label="Room Size">
                {room.roomType?.size || '-'} sq ft
              </Descriptions.Item>
              <Descriptions.Item label="View Type">{room.viewType || '-'}</Descriptions.Item>
              <Descriptions.Item label="Balcony">{room.hasBalcony ? 'Yes' : 'No'}</Descriptions.Item>
              <Descriptions.Item label="Smoking">{room.isSmokingAllowed ? 'Allowed' : 'Not Allowed'}</Descriptions.Item>
            </Descriptions>

            {room.roomType?.amenities && room.roomType.amenities.length > 0 && (
              <>
                <Divider />
                <div>
                  <Text strong>Amenities</Text>
                  <div style={{ marginTop: 8 }}>
                    <Space wrap>
                      {room.roomType.amenities.map((amenity) => (
                        <Tag key={amenity}>{amenity}</Tag>
                      ))}
                    </Space>
                  </div>
                </div>
              </>
            )}

            {room.notes && (
              <>
                <Divider />
                <div>
                  <Text strong>Notes</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">{room.notes}</Text>
                  </div>
                </div>
              </>
            )}
          </Card>
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={8}>
          {/* Status Card */}
          <Card title="Room Status">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Current Status</Text>
                <StatusTag status={room.status} type="room" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Condition</Text>
                <Tag color={room.condition === 'clean' ? 'green' : room.condition === 'inspected' ? 'purple' : 'orange'}>
                  {room.condition.toUpperCase()}
                </Tag>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div>
                <Text type="secondary">Last Cleaned</Text>
                <div>{room.lastCleanedAt ? new Date(room.lastCleanedAt).toLocaleString() : 'Never'}</div>
              </div>
              <div>
                <Text type="secondary">Last Inspected</Text>
                <div>{room.lastInspectedAt ? new Date(room.lastInspectedAt).toLocaleString() : 'Never'}</div>
              </div>
            </Space>
          </Card>

          {/* Activity Timeline */}
          <Card title="Activity" style={{ marginTop: 16 }}>
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <>
                      <Text strong>Room Created</Text>
                      <br />
                      <Text type="secondary">{new Date(room.createdAt).toLocaleString()}</Text>
                    </>
                  ),
                },
                {
                  color: 'blue',
                  children: (
                    <>
                      <Text strong>Last Updated</Text>
                      <br />
                      <Text type="secondary">{new Date(room.updatedAt).toLocaleString()}</Text>
                    </>
                  ),
                },
                ...(room.lastCleanedAt
                  ? [
                      {
                        color: 'cyan' as const,
                        children: (
                          <>
                            <Text strong>Last Cleaned</Text>
                            <br />
                            <Text type="secondary">{new Date(room.lastCleanedAt).toLocaleString()}</Text>
                          </>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* Status Change Modal */}
      <Modal
        title="Change Room Status"
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        onOk={handleStatusChange}
        okText="Update Status"
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text type="secondary">Current Status</Text>
            <div style={{ marginTop: 4 }}>
              <StatusTag status={room.status} type="room" />
            </div>
          </div>

          <div>
            <Text type="secondary">New Status</Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              placeholder="Select new status"
              value={newStatus}
              onChange={setNewStatus}
              options={STATUS_OPTIONS.map((opt) => ({
                label: (
                  <Space>
                    <Badge color={opt.color} />
                    {opt.label}
                  </Space>
                ),
                value: opt.value,
              }))}
            />
          </div>
        </Space>
      </Modal>
    </Space>
  );
}
