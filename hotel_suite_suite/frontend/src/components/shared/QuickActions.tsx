import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Dropdown,
  Modal,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Input,
  Space,
  message,
  Divider,
  Row,
  Col,
  Card,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  UserAddOutlined,
  CalendarOutlined,
  LoginOutlined,
  LogoutOutlined,
  DollarOutlined,
  HomeOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { guestService, roomService, workflowService } from '@/api';
import { useNotifications } from '@/context/NotificationContext';
import type { Guest, RoomType, Room } from '@/types';

interface QuickActionsProps {
  variant?: 'button' | 'dropdown';
}

export default function QuickActions({ variant = 'dropdown' }: QuickActionsProps) {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  // Modal states
  const [quickBookingOpen, setQuickBookingOpen] = useState(false);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [quickPaymentOpen, setQuickPaymentOpen] = useState(false);

  // Data states
  const [guests, setGuests] = useState<Guest[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Forms
  const [bookingForm] = Form.useForm();
  const [walkInForm] = Form.useForm();

  const loadInitialData = async () => {
    try {
      const types = await roomService.getRoomTypes();
      setRoomTypes(types);
    } catch (error) {
      console.error('Failed to load data');
    }
  };

  const handleGuestSearch = async (value: string) => {
    if (value.length < 2) return;
    setSearchLoading(true);
    try {
      const results = await guestService.search(value);
      setGuests(results);
    } catch (error) {
      console.error('Failed to search guests');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRoomTypeChange = async (roomTypeId: string) => {
    try {
      const rooms = await roomService.getAvailableRooms(roomTypeId);
      setAvailableRooms(rooms);
    } catch (error) {
      console.error('Failed to load rooms');
    }
  };

  const handleQuickBooking = async (values: any) => {
    setLoading(true);
    try {
      const result = await workflowService.quickBooking({
        guestId: values.guestId,
        roomTypeId: values.roomTypeId,
        checkInDate: values.dates[0].format('YYYY-MM-DD'),
        checkOutDate: values.dates[1].format('YYYY-MM-DD'),
        adults: values.adults,
        children: values.children,
        source: values.source || 'phone',
        paymentMode: 'pay_at_hotel',
        autoAssignRoom: values.autoAssign,
        createFolio: values.createFolio,
      });

      message.success('Booking created successfully!');
      addNotification({
        type: 'success',
        title: 'New Booking',
        message: `Reservation ${result.reservation.confirmationNumber} created`,
        module: 'crs',
        actionUrl: `/suite/crs/reservations/${result.reservation.id}`,
      });

      setQuickBookingOpen(false);
      bookingForm.resetFields();
      navigate(`/suite/crs/reservations/${result.reservation.id}`);
    } catch (error) {
      message.error('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const handleWalkIn = async (values: any) => {
    setLoading(true);
    try {
      const result = await workflowService.walkInCheckIn({
        guestId: values.guestId,
        roomId: values.roomId,
        nights: values.nights,
        adults: values.adults,
        children: values.children || 0,
        roomRate: values.roomRate,
        paymentMode: values.paymentMode,
        depositAmount: values.deposit,
      });

      message.success('Walk-in check-in completed!');
      addNotification({
        type: 'success',
        title: 'Walk-in Check-in',
        message: `Guest checked into Room ${result.room.roomNumber}`,
        module: 'crs',
        actionUrl: `/suite/crs/reservations/${result.reservation.id}`,
      });

      setWalkInOpen(false);
      walkInForm.resetFields();
      navigate(`/suite/crs/reservations/${result.reservation.id}`);
    } catch (error) {
      message.error('Failed to complete walk-in');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      key: 'booking',
      icon: <CalendarOutlined />,
      label: 'Quick Booking',
      onClick: () => {
        loadInitialData();
        setQuickBookingOpen(true);
      },
    },
    {
      key: 'walkin',
      icon: <LoginOutlined />,
      label: 'Walk-in Check-in',
      onClick: () => {
        loadInitialData();
        setWalkInOpen(true);
      },
    },
    { type: 'divider' as const },
    {
      key: 'guest',
      icon: <UserAddOutlined />,
      label: 'Add Guest',
      onClick: () => navigate('/suite/crs/guests'),
    },
    {
      key: 'payment',
      icon: <DollarOutlined />,
      label: 'Collect Payment',
      onClick: () => navigate('/suite/bms/folios'),
    },
    {
      key: 'room-status',
      icon: <HomeOutlined />,
      label: 'Room Status',
      onClick: () => navigate('/suite/rms/rooms'),
    },
  ];

  const menuItems = quickActions.map((action) =>
    action.type === 'divider'
      ? { type: 'divider' as const }
      : {
          key: action.key,
          icon: action.icon,
          label: action.label,
          onClick: action.onClick,
        }
  );

  return (
    <>
      {variant === 'dropdown' ? (
        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
          <Button type="primary" icon={<PlusOutlined />}>
            Quick Actions
          </Button>
        </Dropdown>
      ) : (
        <Space wrap>
          {quickActions
            .filter((a) => a.type !== 'divider')
            .slice(0, 3)
            .map((action) => (
              <Button key={action.key} icon={action.icon} onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
        </Space>
      )}

      {/* Quick Booking Modal */}
      <Modal
        title="Quick Booking"
        open={quickBookingOpen}
        onCancel={() => setQuickBookingOpen(false)}
        onOk={() => bookingForm.submit()}
        confirmLoading={loading}
        width={600}
      >
        <Form form={bookingForm} layout="vertical" onFinish={handleQuickBooking}>
          <Form.Item
            name="guestId"
            label="Guest"
            rules={[{ required: true, message: 'Please select a guest' }]}
          >
            <Select
              showSearch
              placeholder="Search guest by name, email, or phone..."
              filterOption={false}
              onSearch={handleGuestSearch}
              loading={searchLoading}
              options={guests.map((g) => ({
                label: `${g.firstName} ${g.lastName} - ${g.email}`,
                value: g.id,
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="roomTypeId"
                label="Room Type"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="Select room type"
                  options={roomTypes.map((rt) => ({
                    label: `${rt.name} - ₹${rt.baseRate}/night`,
                    value: rt.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="source"
                label="Source"
                initialValue="phone"
              >
                <Select
                  options={[
                    { label: 'Phone', value: 'phone' },
                    { label: 'Website', value: 'direct_website' },
                    { label: 'Walk-in', value: 'walk_in' },
                    { label: 'Corporate', value: 'corporate' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="dates"
            label="Check-in / Check-out"
            rules={[{ required: true }]}
          >
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="adults" label="Adults" initialValue={1} rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} max={10} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="children" label="Children" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} max={10} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="autoAssign" label="Auto-assign Room" valuePropName="checked">
                <Select
                  options={[
                    { label: 'Yes', value: true },
                    { label: 'No', value: false },
                  ]}
                  defaultValue={false}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Walk-in Check-in Modal */}
      <Modal
        title="Walk-in Check-in"
        open={walkInOpen}
        onCancel={() => setWalkInOpen(false)}
        onOk={() => walkInForm.submit()}
        confirmLoading={loading}
        width={600}
      >
        <Form form={walkInForm} layout="vertical" onFinish={handleWalkIn}>
          <Form.Item
            name="guestId"
            label="Guest"
            rules={[{ required: true, message: 'Please select a guest' }]}
          >
            <Select
              showSearch
              placeholder="Search guest by name, email, or phone..."
              filterOption={false}
              onSearch={handleGuestSearch}
              loading={searchLoading}
              options={guests.map((g) => ({
                label: `${g.firstName} ${g.lastName} - ${g.email}`,
                value: g.id,
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="roomTypeId"
                label="Room Type"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="Select room type"
                  onChange={handleRoomTypeChange}
                  options={roomTypes.map((rt) => ({
                    label: `${rt.name} - ₹${rt.baseRate}/night`,
                    value: rt.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="roomId"
                label="Room"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="Select room"
                  options={availableRooms.map((r) => ({
                    label: `Room ${r.roomNumber} - Floor ${r.floor}`,
                    value: r.id,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="nights" label="Nights" initialValue={1} rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} max={30} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="adults" label="Adults" initialValue={1} rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} max={10} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="children" label="Children" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} max={10} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="roomRate"
                label="Room Rate"
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: '100%' }} prefix="₹" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentMode"
                label="Payment Mode"
                initialValue="pay_at_hotel"
              >
                <Select
                  options={[
                    { label: 'Pay at Hotel', value: 'pay_at_hotel' },
                    { label: 'Prepaid', value: 'prepaid' },
                    { label: 'Corporate', value: 'corporate_billing' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="deposit" label="Deposit Amount">
            <InputNumber style={{ width: '100%' }} prefix="₹" min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
