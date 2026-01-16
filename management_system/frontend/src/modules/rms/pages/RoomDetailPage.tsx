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
  Tabs,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Switch,
  Upload,
  Image,
  Progress,
  Table,
  Drawer,
  Checkbox,
} from 'antd';
import {
  HomeOutlined,
  EditOutlined,
  ToolOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  SwapOutlined,
  BlockOutlined,
  CameraOutlined,
  FileTextOutlined,
  SafetyOutlined,
  DollarOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  ScheduleOutlined,
  EyeOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { PageHeader, StatusTag } from '@/components/shared';
import { roomService, reservationService } from '@/api';
import { useAppContext } from '@/context/AppContext';
import type { 
  Room, 
  RoomStatus, 
  Reservation,
  RoomHistory,
  RoomNoteHistory,
  RoomBlock,
  RoomPhoto,
  RoomInspection,
  RoomCleaningSchedule,
  RoomAccessibility
} from '@/types';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

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

const BLOCK_REASONS = [
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Event', value: 'event' },
  { label: 'VIP', value: 'vip' },
  { label: 'Renovation', value: 'renovation' },
  { label: 'Other', value: 'other' },
];

const INSPECTION_CATEGORIES = [
  { label: 'Cleanliness', value: 'cleanliness' },
  { label: 'Functionality', value: 'functionality' },
  { label: 'Safety', value: 'safety' },
  { label: 'Amenities', value: 'amenities' },
  { label: 'Other', value: 'other' },
];

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenant } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<RoomStatus | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  
  // New feature states
  const [roomHistory, setRoomHistory] = useState<RoomHistory[]>([]);
  const [noteHistory, setNoteHistory] = useState<RoomNoteHistory[]>([]);
  const [roomBlocks, setRoomBlocks] = useState<RoomBlock[]>([]);
  const [roomPhotos, setRoomPhotos] = useState<RoomPhoto[]>([]);
  const [roomInspections, setRoomInspections] = useState<RoomInspection[]>([]);
  const [cleaningSchedules, setCleaningSchedules] = useState<RoomCleaningSchedule[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  
  // Modal/Drawer states
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [blockDrawerOpen, setBlockDrawerOpen] = useState(false);
  const [inspectionDrawerOpen, setInspectionDrawerOpen] = useState(false);
  const [photoDrawerOpen, setPhotoDrawerOpen] = useState(false);
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
  const [accessibilityDrawerOpen, setAccessibilityDrawerOpen] = useState(false);
  const [rateDrawerOpen, setRateDrawerOpen] = useState(false);
  const [amenitiesDrawerOpen, setAmenitiesDrawerOpen] = useState(false);
  const [conditionDrawerOpen, setConditionDrawerOpen] = useState(false);
  const [scheduleDrawerOpen, setScheduleDrawerOpen] = useState(false);
  
  const [transferForm] = Form.useForm();
  const [blockForm] = Form.useForm();
  const [inspectionForm] = Form.useForm();
  const [photoForm] = Form.useForm();
  const [notesForm] = Form.useForm();
  const [accessibilityForm] = Form.useForm();
  const [rateForm] = Form.useForm();
  const [amenitiesForm] = Form.useForm();
  const [conditionForm] = Form.useForm();
  const [scheduleForm] = Form.useForm();

  useEffect(() => {
    if (id && tenant?.id) {
      loadRoom();
    }
  }, [id, tenant?.id, activeTab]);

  const loadRoom = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const data = await roomService.getById(tenant.id, id!);
      setRoom(data);
      
      if (data?.currentReservationId) {
        const reservation = await reservationService.getById(tenant.id, data.currentReservationId);
        setCurrentReservation(reservation);
      }
      
      // Load additional data based on active tab
      if (activeTab === 'history') {
        const [history, notes] = await Promise.all([
          roomService.getRoomHistory(tenant.id, id!),
          roomService.getRoomNoteHistory(tenant.id, id!),
        ]);
        setRoomHistory(history);
        setNoteHistory(notes);
      } else if (activeTab === 'blocks') {
        const blocks = await roomService.getRoomBlocks(tenant.id, id!);
        setRoomBlocks(blocks);
      } else if (activeTab === 'photos') {
        const photos = await roomService.getRoomPhotos(tenant.id, id!);
        setRoomPhotos(photos);
      } else if (activeTab === 'inspections') {
        const inspections = await roomService.getRoomInspections(tenant.id, id!);
        setRoomInspections(inspections);
      } else if (activeTab === 'schedules') {
        const schedules = await roomService.getCleaningSchedules(tenant.id, id!);
        setCleaningSchedules(schedules);
      }
    } catch (error) {
      message.error('Failed to load room');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || !room || !tenant?.id) return;
    
    try {
      await roomService.updateStatus(tenant.id, room.id, newStatus, 'current-user');
      message.success('Room status updated');
      setStatusModalOpen(false);
      loadRoom();
    } catch (error: any) {
      message.error(error.message || 'Failed to update room status');
    }
  };

  // FEATURE #3: Room Transfer
  const handleTransfer = async (values: any) => {
    if (!tenant?.id || !room || !room.currentReservationId) {
      message.error('Room must be occupied to transfer');
      return;
    }
    try {
      await roomService.transferRoom(tenant.id, {
        fromRoomId: room.id,
        toRoomId: values.toRoomId,
        reservationId: room.currentReservationId,
        reason: values.reason,
      }, 'current-user');
      message.success('Room transferred successfully');
      setTransferModalOpen(false);
      transferForm.resetFields();
      loadRoom();
    } catch (error: any) {
      message.error(error.message || 'Failed to transfer room');
    }
  };

  const loadAvailableRooms = async () => {
    if (!tenant?.id) return;
    try {
      const rooms = await roomService.getAll({ tenantId: tenant.id, status: 'available', pageSize: 100 });
      setAvailableRooms(rooms.data.filter(r => r.id !== room?.id));
    } catch (error) {
      console.error('Failed to load available rooms');
    }
  };

  // FEATURE #4: Room Blocking
  const handleCreateBlock = async (values: any) => {
    if (!tenant?.id || !room) return;
    try {
      const [startDate, endDate] = values.dateRange;
      await roomService.createRoomBlock(tenant.id, {
        roomId: room.id,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        reason: values.reason,
        description: values.description,
      }, 'current-user');
      message.success('Room blocked successfully');
      setBlockDrawerOpen(false);
      blockForm.resetFields();
      loadRoom();
    } catch (error: any) {
      message.error(error.message || 'Failed to block room');
    }
  };

  // FEATURE #6: Room Inspection
  const handleCreateInspection = async (values: any) => {
    if (!tenant?.id || !room) return;
    try {
      const checklist = values.checklist || [];
      await roomService.createInspection(tenant.id, {
        roomId: room.id,
        checklist,
        notes: values.notes,
      }, 'current-user');
      message.success('Inspection created successfully');
      setInspectionDrawerOpen(false);
      inspectionForm.resetFields();
      loadRoom();
    } catch (error: any) {
      message.error(error.message || 'Failed to create inspection');
    }
  };

  // FEATURE #12: Room Photos
  const handleAddPhoto = async (values: any) => {
    if (!tenant?.id || !room) return;
    try {
      // In real app, upload file first, then get URL
      const photoUrl = values.url || 'https://via.placeholder.com/400';
      await roomService.addRoomPhoto(tenant.id, room.id, photoUrl, 'current-user', values.caption, values.category);
      message.success('Photo added successfully');
      setPhotoDrawerOpen(false);
      photoForm.resetFields();
      loadRoom();
    } catch (error: any) {
      message.error(error.message || 'Failed to add photo');
    }
  };

  // FEATURE #13: Room Notes
  const handleUpdateNotes = async (values: any) => {
    if (!tenant?.id || !room) return;
    try {
      await roomService.updateNotes(tenant.id, room.id, values.notes, 'current-user');
      message.success('Notes updated successfully');
      setNotesDrawerOpen(false);
      notesForm.resetFields();
      loadRoom();
    } catch (error: any) {
      message.error(error.message || 'Failed to update notes');
    }
  };

  // FEATURE #15: Accessibility
  const handleUpdateAccessibility = async (values: any) => {
    if (!tenant?.id || !room) return;
    try {
      await roomService.updateRoomAccessibility(tenant.id, room.id, {
        wheelchairAccessible: values.wheelchairAccessible || false,
        hearingImpaired: values.hearingImpaired || false,
        visualImpaired: values.visualImpaired || false,
        mobilityAids: values.mobilityAids || [],
        otherAccessibilityFeatures: values.otherAccessibilityFeatures || [],
      });
      message.success('Accessibility features updated');
      setAccessibilityDrawerOpen(false);
      accessibilityForm.resetFields();
      loadRoom();
    } catch (error: any) {
      message.error(error.message || 'Failed to update accessibility');
    }
  };

  // FEATURE #16: Rate Override
  const handleSetRateOverride = async (values: any) => {
    if (!tenant?.id || !room) return;
    try {
      await roomService.setRateOverride(tenant.id, room.id, values.rateOverride || undefined);
      message.success('Rate override updated');
      setRateDrawerOpen(false);
      rateForm.resetFields();
      loadRoom();
    } catch (error: any) {
      message.error(error.message || 'Failed to update rate');
    }
  };

  // FEATURE #17: Amenities Override
  const handleSetAmenityOverrides = async (values: any) => {
    if (!tenant?.id || !room) return;
    try {
      await roomService.setAmenityOverrides(tenant.id, room.id, values.amenityOverrides || []);
      message.success('Amenity overrides updated');
      setAmenitiesDrawerOpen(false);
      amenitiesForm.resetFields();
      loadRoom();
    } catch (error: any) {
      message.error(error.message || 'Failed to update amenities');
    }
  };

  // FEATURE #18: Condition
  const handleUpdateCondition = async (values: any) => {
    if (!tenant?.id || !room) return;
    try {
      await roomService.updateRoomCondition(tenant.id, room.id, values.condition, values.conditionScore);
      message.success('Room condition updated');
      setConditionDrawerOpen(false);
      conditionForm.resetFields();
      loadRoom();
    } catch (error: any) {
      message.error(error.message || 'Failed to update condition');
    }
  };

  // FEATURE #20: Cleaning Schedule
  const handleCreateSchedule = async (values: any) => {
    if (!tenant?.id || !room) return;
    try {
      await roomService.createCleaningSchedule(tenant.id, {
        roomId: room.id,
        type: values.type,
        frequency: values.frequency,
        nextScheduledDate: values.nextScheduledDate.format('YYYY-MM-DD'),
      });
      message.success('Cleaning schedule created');
      setScheduleDrawerOpen(false);
      scheduleForm.resetFields();
      loadRoom();
    } catch (error: any) {
      message.error(error.message || 'Failed to create schedule');
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

  // History columns
  const historyColumns: ColumnsType<RoomHistory> = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD MMM YYYY HH:mm'),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => action.replace(/_/g, ' ').toUpperCase(),
    },
    {
      title: 'Performed By',
      dataIndex: 'performedBy',
      key: 'performedBy',
    },
    {
      title: 'Details',
      key: 'details',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.previousValue && <Text type="secondary">From: {record.previousValue}</Text>}
          {record.newValue && <Text>To: {record.newValue}</Text>}
          {record.notes && <Text type="secondary">{record.notes}</Text>}
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Details',
      icon: <HomeOutlined />,
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
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
                {room.rateOverride && (
                  <Descriptions.Item label="Rate Override">
                    <Text strong style={{ color: '#52c41a' }}>₹{room.rateOverride.toLocaleString('en-IN')}/night</Text>
                  </Descriptions.Item>
                )}
                {room.conditionScore !== undefined && (
                  <Descriptions.Item label="Condition Score">
                    <Progress percent={room.conditionScore} status={room.conditionScore >= 80 ? 'success' : room.conditionScore >= 60 ? 'normal' : 'exception'} />
                  </Descriptions.Item>
                )}
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
                        {room.amenityOverrides?.map((amenity) => (
                          <Tag key={amenity} color="blue">+ {amenity}</Tag>
                        ))}
                      </Space>
                    </div>
                  </div>
                </>
              )}

              {room.accessibility && (
                <>
                  <Divider />
                  <div>
                    <Text strong>Accessibility Features</Text>
                    <div style={{ marginTop: 8 }}>
                      <Space wrap>
                        {room.accessibility.wheelchairAccessible && <Tag color="green">Wheelchair Accessible</Tag>}
                        {room.accessibility.hearingImpaired && <Tag color="blue">Hearing Impaired</Tag>}
                        {room.accessibility.visualImpaired && <Tag color="purple">Visual Impaired</Tag>}
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

          <Col xs={24} lg={8}>
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

            <Card title="Quick Actions" style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button block onClick={() => setStatusModalOpen(true)}>
                  Change Status
                </Button>
                {room.status === 'occupied' && room.currentReservationId && (
                  <Button block icon={<SwapOutlined />} onClick={() => setTransferModalOpen(true)}>
                    Transfer Room
                  </Button>
                )}
                <Button block icon={<BlockOutlined />} onClick={() => setBlockDrawerOpen(true)}>
                  Block Room
                </Button>
                <Button block icon={<EyeOutlined />} onClick={() => setInspectionDrawerOpen(true)}>
                  Create Inspection
                </Button>
                <Button block icon={<CameraOutlined />} onClick={() => setPhotoDrawerOpen(true)}>
                  Add Photo
                </Button>
                <Button block icon={<FileTextOutlined />} onClick={() => {
                  notesForm.setFieldsValue({ notes: room.notes || '' });
                  setNotesDrawerOpen(true);
                }}>
                  Update Notes
                </Button>
                <Button block icon={<SafetyOutlined />} onClick={() => {
                  accessibilityForm.setFieldsValue(room.accessibility || {});
                  setAccessibilityDrawerOpen(true);
                }}>
                  Accessibility
                </Button>
                <Button block icon={<DollarOutlined />} onClick={() => {
                  rateForm.setFieldsValue({ rateOverride: room.rateOverride });
                  setRateDrawerOpen(true);
                }}>
                  Rate Override
                </Button>
                <Button block icon={<AppstoreOutlined />} onClick={() => {
                  amenitiesForm.setFieldsValue({ amenityOverrides: room.amenityOverrides || [] });
                  setAmenitiesDrawerOpen(true);
                }}>
                  Amenities Override
                </Button>
                <Button block icon={<BarChartOutlined />} onClick={() => {
                  conditionForm.setFieldsValue({ 
                    condition: room.condition,
                    conditionScore: room.conditionScore || 100
                  });
                  setConditionDrawerOpen(true);
                }}>
                  Update Condition
                </Button>
                <Button block icon={<ScheduleOutlined />} onClick={() => setScheduleDrawerOpen(true)}>
                  Cleaning Schedule
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'history',
      label: 'History',
      icon: <HistoryOutlined />,
      children: (
        <Card>
          <Table
            columns={historyColumns}
            dataSource={roomHistory}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            title={() => <Title level={5}>Room History</Title>}
          />
          <Divider />
          <Title level={5}>Note History</Title>
          <List
            dataSource={noteHistory}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={<Text>{item.note}</Text>}
                  description={
                    <Space>
                      <Text type="secondary">By: {item.addedBy}</Text>
                      <Text type="secondary">•</Text>
                      <Text type="secondary">{dayjs(item.createdAt).format('DD MMM YYYY HH:mm')}</Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
    {
      key: 'blocks',
      label: 'Blocks',
      icon: <BlockOutlined />,
      children: (
        <Card
          title="Room Blocks"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setBlockDrawerOpen(true)}>
              New Block
            </Button>
          }
        >
          <Table
            columns={[
              { title: 'Start Date', dataIndex: 'startDate', key: 'startDate', render: (d) => dayjs(d).format('DD MMM YYYY') },
              { title: 'End Date', dataIndex: 'endDate', key: 'endDate', render: (d) => dayjs(d).format('DD MMM YYYY') },
              { title: 'Reason', dataIndex: 'reason', key: 'reason' },
              { title: 'Status', dataIndex: 'isActive', key: 'status', render: (active) => <Tag color={active ? 'red' : 'default'}>{active ? 'Active' : 'Cancelled'}</Tag> },
            ]}
            dataSource={roomBlocks}
            rowKey="id"
          />
        </Card>
      ),
    },
    {
      key: 'photos',
      label: 'Photos',
      icon: <CameraOutlined />,
      children: (
        <Card
          title="Room Photos"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setPhotoDrawerOpen(true)}>
              Add Photo
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            {roomPhotos.map((photo) => (
              <Col key={photo.id} xs={12} sm={8} md={6}>
                <Card
                  cover={<Image src={photo.url} alt={photo.caption} style={{ height: 150, objectFit: 'cover' }} />}
                  actions={[
                    <Button type="link" danger icon={<DeleteOutlined />} onClick={async () => {
                      if (!tenant?.id) return;
                      try {
                        await roomService.deleteRoomPhoto(tenant.id, photo.id);
                        message.success('Photo deleted');
                        loadRoom();
                      } catch (error: any) {
                        message.error(error.message || 'Failed to delete photo');
                      }
                    }}>Delete</Button>,
                  ]}
                >
                  <Card.Meta title={photo.caption || 'Untitled'} description={photo.category} />
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      ),
    },
    {
      key: 'inspections',
      label: 'Inspections',
      icon: <EyeOutlined />,
      children: (
        <Card
          title="Room Inspections"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setInspectionDrawerOpen(true)}>
              New Inspection
            </Button>
          }
        >
          <List
            dataSource={roomInspections}
            renderItem={(inspection) => (
              <List.Item
                actions={[
                  inspection.status === 'passed' && !inspection.approvedBy ? (
                    <Button size="small" onClick={async () => {
                      if (!tenant?.id) return;
                      try {
                        await roomService.approveInspection(tenant.id, inspection.id, 'current-user');
                        message.success('Inspection approved');
                        loadRoom();
                      } catch (error: any) {
                        message.error(error.message || 'Failed to approve inspection');
                      }
                    }}>Approve</Button>
                  ) : null,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>Inspection #{inspection.id}</Text>
                      <Tag color={inspection.status === 'passed' ? 'green' : inspection.status === 'failed' ? 'red' : 'orange'}>
                        {inspection.status.toUpperCase()}
                      </Tag>
                      {inspection.score !== undefined && <Text type="secondary">Score: {inspection.score}/100</Text>}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">By: {inspection.inspectedBy} • {dayjs(inspection.inspectionDate).format('DD MMM YYYY')}</Text>
                      {inspection.notes && <Text type="secondary">{inspection.notes}</Text>}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
    {
      key: 'schedules',
      label: 'Schedules',
      icon: <ScheduleOutlined />,
      children: (
        <Card
          title="Cleaning Schedules"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setScheduleDrawerOpen(true)}>
              New Schedule
            </Button>
          }
        >
          <List
            dataSource={cleaningSchedules}
            renderItem={(schedule) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{schedule.type.toUpperCase()}</Text>
                      <Tag color={schedule.isActive ? 'green' : 'default'}>{schedule.isActive ? 'Active' : 'Inactive'}</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text>Frequency: Every {schedule.frequency} days</Text>
                      <Text>Next: {dayjs(schedule.nextScheduledDate).format('DD MMM YYYY')}</Text>
                      {schedule.lastPerformedDate && <Text type="secondary">Last: {dayjs(schedule.lastPerformedDate).format('DD MMM YYYY')}</Text>}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
  ];

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
                {room.rateOverride && <Tag color="gold">Custom Rate</Tag>}
              </Space>
            </Space>
          </Col>
          <Col>
            <div style={{ textAlign: 'right' }}>
              <Text type="secondary">Room Rate</Text>
              <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                ₹{(room.rateOverride || room.roomType?.baseRate || 0).toLocaleString('en-IN')}/night
              </Title>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Tabs with all features */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

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

      {/* Transfer Modal */}
      <Modal
        title="Transfer Room"
        open={transferModalOpen}
        onCancel={() => setTransferModalOpen(false)}
        onOk={() => transferForm.submit()}
        okText="Transfer"
        afterOpenChange={(open) => {
          if (open) {
            loadAvailableRooms();
          }
        }}
      >
        <Form form={transferForm} onFinish={handleTransfer} layout="vertical">
          <Form.Item name="toRoomId" label="Destination Room" rules={[{ required: true }]}>
            <Select 
              placeholder="Select room" 
              options={availableRooms.map(r => ({ label: `${r.roomNumber} - ${r.roomType?.name}`, value: r.id }))}
            />
          </Form.Item>
          <Form.Item name="reason" label="Reason">
            <TextArea rows={3} placeholder="Reason for transfer..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Block Drawer */}
      <Drawer title="Block Room" open={blockDrawerOpen} onClose={() => setBlockDrawerOpen(false)} width={500}>
        <Form form={blockForm} onFinish={handleCreateBlock} layout="vertical">
          <Form.Item name="dateRange" label="Date Range" rules={[{ required: true }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <Select options={BLOCK_REASONS} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Block
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Inspection Drawer */}
      <Drawer title="Create Inspection" open={inspectionDrawerOpen} onClose={() => setInspectionDrawerOpen(false)} width={600}>
        <Form form={inspectionForm} onFinish={handleCreateInspection} layout="vertical">
          <Form.List name="checklist">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...restField} name={[name, 'checked']} valuePropName="checked">
                      <Checkbox />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'item']} rules={[{ required: true }]}>
                      <Input placeholder="Checklist item" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'category']}>
                      <Select placeholder="Category" options={INSPECTION_CATEGORIES} style={{ width: 150 }} />
                    </Form.Item>
                    <Button onClick={() => remove(name)}>Remove</Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Inspection
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Photo Drawer */}
      <Drawer title="Add Photo" open={photoDrawerOpen} onClose={() => setPhotoDrawerOpen(false)} width={500}>
        <Form form={photoForm} onFinish={handleAddPhoto} layout="vertical">
          <Form.Item name="url" label="Photo URL" rules={[{ required: true }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="caption" label="Caption">
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Select options={[
              { label: 'Interior', value: 'interior' },
              { label: 'Exterior', value: 'exterior' },
              { label: 'Amenity', value: 'amenity' },
              { label: 'Damage', value: 'damage' },
              { label: 'Other', value: 'other' },
            ]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Add Photo
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Notes Drawer */}
      <Drawer title="Update Notes" open={notesDrawerOpen} onClose={() => setNotesDrawerOpen(false)} width={500}>
        <Form form={notesForm} onFinish={handleUpdateNotes} layout="vertical">
          <Form.Item name="notes" label="Notes">
            <TextArea rows={6} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Update Notes
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Accessibility Drawer */}
      <Drawer title="Accessibility Features" open={accessibilityDrawerOpen} onClose={() => setAccessibilityDrawerOpen(false)} width={500}>
        <Form form={accessibilityForm} onFinish={handleUpdateAccessibility} layout="vertical">
          <Form.Item name="wheelchairAccessible" valuePropName="checked">
            <Checkbox>Wheelchair Accessible</Checkbox>
          </Form.Item>
          <Form.Item name="hearingImpaired" valuePropName="checked">
            <Checkbox>Hearing Impaired Support</Checkbox>
          </Form.Item>
          <Form.Item name="visualImpaired" valuePropName="checked">
            <Checkbox>Visual Impaired Support</Checkbox>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Update Accessibility
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Rate Override Drawer */}
      <Drawer title="Rate Override" open={rateDrawerOpen} onClose={() => setRateDrawerOpen(false)} width={400}>
        <Form form={rateForm} onFinish={handleSetRateOverride} layout="vertical">
          <Form.Item name="rateOverride" label="Override Rate (₹)">
            <InputNumber style={{ width: '100%' }} min={0} prefix="₹" />
          </Form.Item>
          <Form.Item>
            <Text type="secondary">Leave empty to use room type base rate</Text>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Update Rate
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Amenities Override Drawer */}
      <Drawer title="Amenities Override" open={amenitiesDrawerOpen} onClose={() => setAmenitiesDrawerOpen(false)} width={500}>
        <Form form={amenitiesForm} onFinish={handleSetAmenityOverrides} layout="vertical">
          <Form.Item name="amenityOverrides" label="Additional Amenities">
            <Select mode="tags" placeholder="Add amenities" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Update Amenities
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Condition Drawer */}
      <Drawer title="Update Condition" open={conditionDrawerOpen} onClose={() => setConditionDrawerOpen(false)} width={500}>
        <Form form={conditionForm} onFinish={handleUpdateCondition} layout="vertical">
          <Form.Item name="condition" label="Condition" rules={[{ required: true }]}>
            <Select options={[
              { label: 'Clean', value: 'clean' },
              { label: 'Dirty', value: 'dirty' },
              { label: 'Inspected', value: 'inspected' },
              { label: 'Needs Repair', value: 'needs_repair' },
              { label: 'Excellent', value: 'excellent' },
              { label: 'Good', value: 'good' },
              { label: 'Fair', value: 'fair' },
              { label: 'Poor', value: 'poor' },
            ]} />
          </Form.Item>
          <Form.Item name="conditionScore" label="Condition Score (0-100)">
            <InputNumber style={{ width: '100%' }} min={0} max={100} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Update Condition
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Cleaning Schedule Drawer */}
      <Drawer title="Create Cleaning Schedule" open={scheduleDrawerOpen} onClose={() => setScheduleDrawerOpen(false)} width={500}>
        <Form form={scheduleForm} onFinish={handleCreateSchedule} layout="vertical">
          <Form.Item name="type" label="Schedule Type" rules={[{ required: true }]}>
            <Select options={[
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Deep Clean', value: 'deep_clean' },
              { label: 'Custom', value: 'custom' },
            ]} />
          </Form.Item>
          <Form.Item name="frequency" label="Frequency (days)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="nextScheduledDate" label="Next Scheduled Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Schedule
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </Space>
  );
}
