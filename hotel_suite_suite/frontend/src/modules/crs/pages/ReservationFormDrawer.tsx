import { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  Divider,
  message,
  DatePicker,
  InputNumber,
  Switch,
  Card,
  Statistic,
} from 'antd';
import { SaveOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { reservationService, guestService, roomService, type CreateReservationDto } from '@/api';
import type { Reservation, Guest, RoomType } from '@/types';

interface ReservationFormDrawerProps {
  open: boolean;
  reservation: Reservation | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SOURCE_OPTIONS = [
  { label: 'Direct Website', value: 'direct_website' },
  { label: 'Phone', value: 'phone' },
  { label: 'Walk-in', value: 'walk_in' },
  { label: 'Booking.com', value: 'ota_booking' },
  { label: 'Expedia', value: 'ota_expedia' },
  { label: 'Agoda', value: 'ota_agoda' },
  { label: 'Corporate', value: 'corporate' },
  { label: 'Travel Agent', value: 'travel_agent' },
  { label: 'Group', value: 'group' },
];

const PAYMENT_MODE_OPTIONS = [
  { label: 'Prepaid', value: 'prepaid' },
  { label: 'Pay at Hotel', value: 'pay_at_hotel' },
  { label: 'Corporate Billing', value: 'corporate_billing' },
];

export default function ReservationFormDrawer({
  open,
  reservation,
  onClose,
  onSuccess,
}: ReservationFormDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [guestSearchLoading, setGuestSearchLoading] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);

  const isEditing = !!reservation;

  useEffect(() => {
    if (open) {
      loadRoomTypes();
      if (reservation) {
        form.setFieldsValue({
          ...reservation,
          checkInDate: dayjs(reservation.checkInDate),
          checkOutDate: dayjs(reservation.checkOutDate),
        });
        if (reservation.guest) {
          setGuests([reservation.guest]);
        }
        if (reservation.roomType) {
          setSelectedRoomType(reservation.roomType);
        }
      } else {
        form.resetFields();
        form.setFieldsValue({
          adults: 1,
          children: 0,
          infants: 0,
          source: 'direct_website',
          paymentMode: 'pay_at_hotel',
          depositPaid: false,
        });
      }
    }
  }, [open, reservation, form]);

  const loadRoomTypes = async () => {
    try {
      const types = await roomService.getRoomTypes();
      setRoomTypes(types);
    } catch (error) {
      console.error('Failed to load room types');
    }
  };

  const handleGuestSearch = async (value: string) => {
    if (value.length < 2) return;
    setGuestSearchLoading(true);
    try {
      const results = await guestService.search(value);
      setGuests(results);
    } catch (error) {
      console.error('Failed to search guests');
    } finally {
      setGuestSearchLoading(false);
    }
  };

  const calculateNights = () => {
    const checkIn = form.getFieldValue('checkInDate');
    const checkOut = form.getFieldValue('checkOutDate');
    if (checkIn && checkOut) {
      return dayjs(checkOut).diff(dayjs(checkIn), 'day');
    }
    return 0;
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    const rate = selectedRoomType?.baseRate || form.getFieldValue('roomRate') || 0;
    return nights * rate;
  };

  const handleRoomTypeChange = (roomTypeId: string) => {
    const roomType = roomTypes.find((rt) => rt.id === roomTypeId);
    setSelectedRoomType(roomType || null);
    if (roomType) {
      form.setFieldValue('roomRate', roomType.baseRate);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const nights = calculateNights();
      const data: CreateReservationDto = {
        guestId: values.guestId,
        roomTypeId: values.roomTypeId,
        checkInDate: values.checkInDate.format('YYYY-MM-DD'),
        checkOutDate: values.checkOutDate.format('YYYY-MM-DD'),
        adults: values.adults,
        children: values.children || 0,
        infants: values.infants || 0,
        source: values.source,
        roomRate: values.roomRate,
        paymentMode: values.paymentMode,
        specialRequests: values.specialRequests,
        internalNotes: values.internalNotes,
      };

      if (isEditing) {
        await reservationService.update(reservation.id, data);
        message.success('Reservation updated successfully');
      } else {
        await reservationService.create(data);
        message.success('Reservation created successfully');
      }
      onSuccess();
    } catch (error) {
      message.error(isEditing ? 'Failed to update reservation' : 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={isEditing ? 'Edit Reservation' : 'New Reservation'}
      width={800}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={loading}
          >
            {isEditing ? 'Update' : 'Create Reservation'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={() => form.validateFields()}>
        <Divider>Guest Information</Divider>
        <Row gutter={16}>
          <Col span={24}>
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
                loading={guestSearchLoading}
                suffixIcon={<SearchOutlined />}
                notFoundContent={guestSearchLoading ? 'Searching...' : 'No guests found'}
                options={guests.map((guest) => ({
                  label: `${guest.firstName} ${guest.lastName} - ${guest.email}`,
                  value: guest.id,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Stay Details</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="checkInDate"
              label="Check-in Date"
              rules={[{ required: true, message: 'Check-in date is required' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD MMM YYYY"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="checkOutDate"
              label="Check-out Date"
              rules={[{ required: true, message: 'Check-out date is required' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD MMM YYYY"
                disabledDate={(current) => {
                  const checkIn = form.getFieldValue('checkInDate');
                  return current && checkIn && current <= checkIn;
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="roomTypeId"
              label="Room Type"
              rules={[{ required: true, message: 'Room type is required' }]}
            >
              <Select
                placeholder="Select room type"
                onChange={handleRoomTypeChange}
                options={roomTypes.map((rt) => ({
                  label: `${rt.name} - ₹${rt.baseRate.toLocaleString()}/night`,
                  value: rt.id,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="roomRate" label="Room Rate (per night)">
              <InputNumber
                style={{ width: '100%' }}
                prefix="₹"
                min={0}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="adults"
              label="Adults"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber style={{ width: '100%' }} min={1} max={10} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="children" label="Children">
              <InputNumber style={{ width: '100%' }} min={0} max={10} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="infants" label="Infants">
              <InputNumber style={{ width: '100%' }} min={0} max={5} />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Booking Details</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="source"
              label="Booking Source"
              rules={[{ required: true, message: 'Source is required' }]}
            >
              <Select options={SOURCE_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="paymentMode"
              label="Payment Mode"
              rules={[{ required: true, message: 'Payment mode is required' }]}
            >
              <Select options={PAYMENT_MODE_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="depositAmount" label="Deposit Amount">
              <InputNumber
                style={{ width: '100%' }}
                prefix="₹"
                min={0}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="depositPaid" label="Deposit Paid" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Additional Information</Divider>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="specialRequests" label="Special Requests">
              <Input.TextArea rows={2} placeholder="Guest's special requests..." />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="internalNotes" label="Internal Notes">
              <Input.TextArea rows={2} placeholder="Internal notes (not visible to guest)..." />
            </Form.Item>
          </Col>
        </Row>

        {/* Summary Card */}
        <Card size="small" style={{ background: '#fafafa' }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="Nights" value={calculateNights()} />
            </Col>
            <Col span={8}>
              <Statistic
                title="Rate/Night"
                value={selectedRoomType?.baseRate || form.getFieldValue('roomRate') || 0}
                prefix="₹"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Total Amount"
                value={calculateTotal()}
                prefix="₹"
                valueStyle={{ color: '#52c41a', fontWeight: 600 }}
              />
            </Col>
          </Row>
        </Card>
      </Form>
    </Drawer>
  );
}
