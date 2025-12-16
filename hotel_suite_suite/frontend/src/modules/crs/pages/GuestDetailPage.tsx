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
  Avatar,
  Button,
  Timeline,
  Statistic,
  Table,
  Empty,
  message,
  Tabs,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  IdcardOutlined,
  HomeOutlined,
  CalendarOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, StatusTag } from '@/components/shared';
import { guestService, reservationService } from '@/api';
import { useAppContext } from '@/context/AppContext';
import type { Guest, Reservation } from '@/types';
import GuestFormDrawer from './GuestFormDrawer';

const { Text, Title } = Typography;

export default function GuestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenant } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  useEffect(() => {
    if (id && tenant?.id) {
      loadGuest();
      loadGuestReservations();
    }
  }, [id, tenant?.id]);

  const loadGuest = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const data = await guestService.getById(tenant.id, id!);
      setGuest(data);
    } catch (error) {
      message.error('Failed to load guest');
    } finally {
      setLoading(false);
    }
  };

  const loadGuestReservations = async () => {
    if (!tenant?.id || !guest?.id) return;
    try {
      const result = await reservationService.getByGuestId(tenant.id, guest.id);
      setReservations(result);
    } catch (error) {
      // Error handling
    }
  };

  const handleEditSuccess = () => {
    setEditDrawerOpen(false);
    loadGuest();
  };

  const reservationColumns: ColumnsType<Reservation> = [
    {
      title: 'Confirmation',
      dataIndex: 'confirmationNumber',
      key: 'confirmationNumber',
      render: (value, record) => (
        <a onClick={() => navigate(`/suite/crs/reservations/${record.id}`)}>{value}</a>
      ),
    },
    {
      title: 'Room Type',
      key: 'roomType',
      render: (_, record) => record.roomType?.name || '-',
    },
    {
      title: 'Check-in',
      dataIndex: 'checkInDate',
      key: 'checkInDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Check-out',
      dataIndex: 'checkOutDate',
      key: 'checkOutDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Nights',
      dataIndex: 'nights',
      key: 'nights',
      align: 'center',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} type="reservation" />,
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (value: number) => `₹${value.toLocaleString('en-IN')}`,
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!guest) {
    return <Empty description="Guest not found" />;
  }

  const vipColors: Record<string, string> = {
    none: '#8c8c8c',
    silver: '#8c8c8c',
    gold: '#faad14',
    platinum: '#722ed1',
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title={`${guest.firstName} ${guest.lastName}`}
        subtitle="Guest Profile"
        showBack
        backPath="/suite/crs/guests"
        breadcrumbs={[
          { label: 'CRS', path: '/suite/crs' },
          { label: 'Guests', path: '/suite/crs/guests' },
          { label: `${guest.firstName} ${guest.lastName}` },
        ]}
        actions={
          <Button type="primary" icon={<EditOutlined />} onClick={() => setEditDrawerOpen(true)}>
            Edit Guest
          </Button>
        }
      />

      {/* Guest Header Card */}
      <Card>
        <Row gutter={24} align="middle">
          <Col>
            <Avatar
              size={80}
              style={{ backgroundColor: vipColors[guest.vipStatus] }}
              icon={<UserOutlined />}
            />
          </Col>
          <Col flex={1}>
            <Space direction="vertical" size={4}>
              <Space>
                <Title level={4} style={{ margin: 0 }}>
                  {guest.firstName} {guest.lastName}
                </Title>
                <StatusTag status={guest.vipStatus} type="vip" />
              </Space>
              <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
                <Text type="secondary">
                  <MailOutlined /> {guest.email}
                </Text>
                <Text type="secondary">
                  <PhoneOutlined /> {guest.phone}
                </Text>
                {guest.nationality && (
                  <Text type="secondary">
                    <GlobalOutlined /> {guest.nationality}
                  </Text>
                )}
              </Space>
            </Space>
          </Col>
          <Col>
            <Row gutter={32}>
              <Col>
                <Statistic title="Total Stays" value={guest.totalStays} prefix={<CalendarOutlined />} />
              </Col>
              <Col>
                <Statistic
                  title="Total Spend"
                  value={guest.totalSpend}
                  prefix="₹"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Tabs
        defaultActiveKey="details"
        items={[
          {
            key: 'details',
            label: 'Details',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="Personal Information" size="small">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Full Name">
                        {guest.firstName} {guest.lastName}
                      </Descriptions.Item>
                      <Descriptions.Item label="Email">{guest.email}</Descriptions.Item>
                      <Descriptions.Item label="Phone">{guest.phone}</Descriptions.Item>
                      {guest.alternatePhone && (
                        <Descriptions.Item label="Alternate Phone">
                          {guest.alternatePhone}
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="Date of Birth">
                        {guest.dateOfBirth || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Nationality">
                        {guest.nationality || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="VIP Status">
                        <StatusTag status={guest.vipStatus} type="vip" />
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>

                <Col xs={24} lg={12}>
                  <Card title="Identity Document" size="small">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="ID Type">
                        {guest.idType?.replace('_', ' ').toUpperCase() || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="ID Number">{guest.idNumber || '-'}</Descriptions.Item>
                      <Descriptions.Item label="ID Expiry">
                        {guest.idExpiryDate || '-'}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  <Card title="Address" size="small" style={{ marginTop: 16 }}>
                    {guest.address ? (
                      <Space direction="vertical" size={0}>
                        <Text>{guest.address.street}</Text>
                        <Text>
                          {guest.address.city}
                          {guest.address.state && `, ${guest.address.state}`}
                        </Text>
                        <Text>
                          {guest.address.postalCode} {guest.address.country}
                        </Text>
                      </Space>
                    ) : (
                      <Text type="secondary">No address on file</Text>
                    )}
                  </Card>
                </Col>

                <Col xs={24} lg={12}>
                  <Card title="Preferences" size="small">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Floor Preference">
                        {guest.preferences?.floorPreference || 'Any'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Bed Type">
                        {guest.preferences?.bedType || 'Any'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Smoking Room">
                        {guest.preferences?.smokingRoom ? 'Yes' : 'No'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Dietary Restrictions">
                        {guest.preferences?.dietaryRestrictions?.length
                          ? guest.preferences.dietaryRestrictions.join(', ')
                          : 'None'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Special Requests">
                        {guest.preferences?.specialRequests || '-'}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>

                <Col xs={24} lg={12}>
                  <Card title="Tags & Notes" size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                          Tags
                        </Text>
                        {guest.tags?.length ? (
                          <Space wrap>
                            {guest.tags.map((tag) => (
                              <Tag key={tag} color="blue">
                                {tag}
                              </Tag>
                            ))}
                          </Space>
                        ) : (
                          <Text type="secondary">No tags</Text>
                        )}
                      </div>
                      <div>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                          Notes
                        </Text>
                        <Text>{guest.notes || 'No notes'}</Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'reservations',
            label: `Reservations (${reservations.length})`,
            children: (
              <Card title="Reservation History">
                <Table
                  columns={reservationColumns}
                  dataSource={reservations}
                  rowKey="id"
                  pagination={false}
                  locale={{ emptyText: 'No reservations found' }}
                />
              </Card>
            ),
          },
          {
            key: 'activity',
            label: 'Activity',
            children: (
              <Card title="Activity Timeline">
                <Timeline
                  items={[
                    {
                      color: 'green',
                      children: (
                        <>
                          <Text strong>Profile Created</Text>
                          <br />
                          <Text type="secondary">
                            {new Date(guest.createdAt).toLocaleString()}
                          </Text>
                        </>
                      ),
                    },
                    {
                      color: 'blue',
                      children: (
                        <>
                          <Text strong>Last Updated</Text>
                          <br />
                          <Text type="secondary">
                            {new Date(guest.updatedAt).toLocaleString()}
                          </Text>
                        </>
                      ),
                    },
                    ...(guest.lastStayDate
                      ? [
                          {
                            color: 'purple' as const,
                            children: (
                              <>
                                <Text strong>Last Stay</Text>
                                <br />
                                <Text type="secondary">
                                  {new Date(guest.lastStayDate).toLocaleDateString()}
                                </Text>
                              </>
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      <GuestFormDrawer
        open={editDrawerOpen}
        guest={guest}
        onClose={() => setEditDrawerOpen(false)}
        onSuccess={handleEditSuccess}
      />
    </Space>
  );
}
