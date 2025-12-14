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
  Statistic,
  Steps,
  Empty,
  message,
  Modal,
  Divider,
  Alert,
} from 'antd';
import {
  EditOutlined,
  UserOutlined,
  CalendarOutlined,
  HomeOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader, StatusTag } from '@/components/shared';
import { reservationService, roomService } from '@/api';
import type { Reservation, Room } from '@/types';
import ReservationFormDrawer from './ReservationFormDrawer';
import CheckInModal from './CheckInModal';
import CheckOutModal from './CheckOutModal';

const { Text, Title } = Typography;

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadReservation();
    }
  }, [id]);

  const loadReservation = async () => {
    setLoading(true);
    try {
      const data = await reservationService.getById(id!);
      setReservation(data);
      // Load available rooms for check-in
      if (data?.status === 'confirmed' && data.roomTypeId) {
        const rooms = await roomService.getAvailableRooms(data.roomTypeId);
        setAvailableRooms(rooms);
      }
    } catch (error) {
      message.error('Failed to load reservation');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = () => {
    setEditDrawerOpen(false);
    loadReservation();
  };

  const handleCheckInSuccess = () => {
    setCheckInModalOpen(false);
    loadReservation();
    message.success('Guest checked in successfully');
  };

  const handleCheckOutSuccess = () => {
    setCheckOutModalOpen(false);
    loadReservation();
    message.success('Guest checked out successfully');
  };

  const handleCancelReservation = () => {
    Modal.confirm({
      title: 'Cancel Reservation',
      content: 'Are you sure you want to cancel this reservation? This action cannot be undone.',
      okText: 'Yes, Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await reservationService.cancel(id!);
          message.success('Reservation cancelled');
          loadReservation();
        } catch (error) {
          message.error('Failed to cancel reservation');
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!reservation) {
    return <Empty description="Reservation not found" />;
  }

  const getStepStatus = () => {
    switch (reservation.status) {
      case 'inquiry':
        return 0;
      case 'confirmed':
        return 1;
      case 'checked_in':
        return 2;
      case 'checked_out':
        return 3;
      case 'cancelled':
      case 'no_show':
        return -1;
      default:
        return 0;
    }
  };

  const sourceLabels: Record<string, string> = {
    direct_website: 'Direct Website',
    phone: 'Phone',
    walk_in: 'Walk-in',
    ota_booking: 'Booking.com',
    ota_expedia: 'Expedia',
    ota_agoda: 'Agoda',
    corporate: 'Corporate',
    travel_agent: 'Travel Agent',
    group: 'Group',
  };

  const canCheckIn = reservation.status === 'confirmed';
  const canCheckOut = reservation.status === 'checked_in';
  const canCancel = ['inquiry', 'confirmed'].includes(reservation.status);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title={`Reservation ${reservation.confirmationNumber}`}
        subtitle={`${reservation.guest?.firstName} ${reservation.guest?.lastName}`}
        showBack
        backPath="/suite/crs/reservations"
        breadcrumbs={[
          { label: 'CRS', path: '/suite/crs' },
          { label: 'Reservations', path: '/suite/crs/reservations' },
          { label: reservation.confirmationNumber },
        ]}
        actions={
          <Space>
            {canCheckIn && (
              <Button type="primary" icon={<LoginOutlined />} onClick={() => setCheckInModalOpen(true)}>
                Check In
              </Button>
            )}
            {canCheckOut && (
              <Button type="primary" icon={<LogoutOutlined />} onClick={() => setCheckOutModalOpen(true)}>
                Check Out
              </Button>
            )}
            <Button icon={<EditOutlined />} onClick={() => setEditDrawerOpen(true)}>
              Edit
            </Button>
            {canCancel && (
              <Button danger icon={<CloseCircleOutlined />} onClick={handleCancelReservation}>
                Cancel
              </Button>
            )}
          </Space>
        }
      />

      {/* Status Banner */}
      {reservation.status === 'cancelled' && (
        <Alert
          message="This reservation has been cancelled"
          description={reservation.cancellationReason || 'No reason provided'}
          type="error"
          showIcon
        />
      )}

      {/* Journey Steps */}
      <Card>
        <Steps
          current={getStepStatus()}
          status={reservation.status === 'cancelled' ? 'error' : undefined}
          items={[
            { title: 'Inquiry', icon: <CalendarOutlined /> },
            { title: 'Confirmed', icon: <CheckCircleOutlined /> },
            { title: 'Checked In', icon: <LoginOutlined /> },
            { title: 'Checked Out', icon: <LogoutOutlined /> },
          ]}
        />
      </Card>

      <Row gutter={[16, 16]}>
        {/* Left Column - Main Details */}
        <Col xs={24} lg={16}>
          {/* Guest Info */}
          <Card
            title={
              <Space>
                <UserOutlined />
                Guest Information
              </Space>
            }
            extra={
              <Button
                type="link"
                onClick={() => navigate(`/suite/crs/guests/${reservation.guestId}`)}
              >
                View Profile
              </Button>
            }
          >
            <Descriptions column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Guest Name">
                {reservation.guest?.firstName} {reservation.guest?.lastName}
              </Descriptions.Item>
              <Descriptions.Item label="Email">{reservation.guest?.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{reservation.guest?.phone}</Descriptions.Item>
              <Descriptions.Item label="VIP Status">
                <StatusTag status={reservation.guest?.vipStatus || 'none'} type="vip" />
              </Descriptions.Item>
              <Descriptions.Item label="Guests">
                {reservation.adults} Adults
                {reservation.childrenCount > 0 && `, ${reservation.childrenCount} Children`}
                {reservation.infants > 0 && `, ${reservation.infants} Infants`}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Stay Details */}
          <Card
            title={
              <Space>
                <HomeOutlined />
                Stay Details
              </Space>
            }
            style={{ marginTop: 16 }}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Check-in"
                  value={dayjs(reservation.checkInDate).format('ddd, DD MMM YYYY')}
                  valueStyle={{ fontSize: 18 }}
                />
                {reservation.actualCheckIn && (
                  <Text type="secondary">
                    Actual: {dayjs(reservation.actualCheckIn).format('DD MMM YYYY HH:mm')}
                  </Text>
                )}
              </Col>
              <Col span={12}>
                <Statistic
                  title="Check-out"
                  value={dayjs(reservation.checkOutDate).format('ddd, DD MMM YYYY')}
                  valueStyle={{ fontSize: 18 }}
                />
                {reservation.actualCheckOut && (
                  <Text type="secondary">
                    Actual: {dayjs(reservation.actualCheckOut).format('DD MMM YYYY HH:mm')}
                  </Text>
                )}
              </Col>
            </Row>
            <Divider />
            <Descriptions column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Room Type">
                {reservation.roomType?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Room Number">
                {reservation.room?.roomNumber || 'Not Assigned'}
              </Descriptions.Item>
              <Descriptions.Item label="Nights">{reservation.nights}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <StatusTag status={reservation.status} type="reservation" />
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Special Requests */}
          {(reservation.specialRequests || reservation.internalNotes) && (
            <Card title="Notes" style={{ marginTop: 16 }}>
              {reservation.specialRequests && (
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                    Special Requests
                  </Text>
                  <Text>{reservation.specialRequests}</Text>
                </div>
              )}
              {reservation.internalNotes && (
                <div>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                    Internal Notes
                  </Text>
                  <Text>{reservation.internalNotes}</Text>
                </div>
              )}
            </Card>
          )}
        </Col>

        {/* Right Column - Financial & Timeline */}
        <Col xs={24} lg={8}>
          {/* Financial Summary */}
          <Card
            title={
              <Space>
                <DollarOutlined />
                Financial Summary
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Room Rate</Text>
                <Text>₹{reservation.roomRate.toLocaleString('en-IN')} × {reservation.nights} nights</Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>Total Amount</Text>
                <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                  ₹{reservation.totalAmount.toLocaleString('en-IN')}
                </Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Deposit</Text>
                <Space>
                  <Text>₹{reservation.depositAmount.toLocaleString('en-IN')}</Text>
                  <Tag color={reservation.depositPaid ? 'green' : 'orange'}>
                    {reservation.depositPaid ? 'Paid' : 'Pending'}
                  </Tag>
                </Space>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Payment Mode</Text>
                <Text>{reservation.paymentMode.replace('_', ' ')}</Text>
              </div>
            </Space>
            <Divider />
            {reservation.folioId && (
              <Button
                block
                onClick={() => navigate(`/suite/bms/folios/${reservation.folioId}`)}
              >
                View Folio
              </Button>
            )}
          </Card>

          {/* Booking Details */}
          <Card title="Booking Details" style={{ marginTop: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Confirmation #">
                {reservation.confirmationNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Source">
                <Tag>{sourceLabels[reservation.source] || reservation.source}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Rate Code">
                {reservation.rateCode || 'Standard'}
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {dayjs(reservation.createdAt).format('DD MMM YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {dayjs(reservation.updatedAt).format('DD MMM YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Activity Timeline */}
          <Card title="Activity" style={{ marginTop: 16 }}>
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <>
                      <Text strong>Reservation Created</Text>
                      <br />
                      <Text type="secondary">
                        {dayjs(reservation.createdAt).format('DD MMM YYYY HH:mm')}
                      </Text>
                    </>
                  ),
                },
                ...(reservation.actualCheckIn
                  ? [
                      {
                        color: 'blue' as const,
                        children: (
                          <>
                            <Text strong>Guest Checked In</Text>
                            <br />
                            <Text type="secondary">
                              {dayjs(reservation.actualCheckIn).format('DD MMM YYYY HH:mm')}
                            </Text>
                          </>
                        ),
                      },
                    ]
                  : []),
                ...(reservation.actualCheckOut
                  ? [
                      {
                        color: 'purple' as const,
                        children: (
                          <>
                            <Text strong>Guest Checked Out</Text>
                            <br />
                            <Text type="secondary">
                              {dayjs(reservation.actualCheckOut).format('DD MMM YYYY HH:mm')}
                            </Text>
                          </>
                        ),
                      },
                    ]
                  : []),
                ...(reservation.cancelledAt
                  ? [
                      {
                        color: 'red' as const,
                        children: (
                          <>
                            <Text strong>Reservation Cancelled</Text>
                            <br />
                            <Text type="secondary">
                              {dayjs(reservation.cancelledAt).format('DD MMM YYYY HH:mm')}
                            </Text>
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

      {/* Modals & Drawers */}
      <ReservationFormDrawer
        open={editDrawerOpen}
        reservation={reservation}
        onClose={() => setEditDrawerOpen(false)}
        onSuccess={handleEditSuccess}
      />

      <CheckInModal
        open={checkInModalOpen}
        reservation={reservation}
        availableRooms={availableRooms}
        onClose={() => setCheckInModalOpen(false)}
        onSuccess={handleCheckInSuccess}
      />

      <CheckOutModal
        open={checkOutModalOpen}
        reservation={reservation}
        onClose={() => setCheckOutModalOpen(false)}
        onSuccess={handleCheckOutSuccess}
      />
    </Space>
  );
}
