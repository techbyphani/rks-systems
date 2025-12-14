import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Tag, Dropdown, message, DatePicker, Select } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, MoreOutlined, CalendarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader, DataTable, StatusTag } from '@/components/shared';
import { reservationService, type ReservationFilters } from '@/api';
import type { Reservation, PaginatedResponse } from '@/types';
import ReservationFormDrawer from './ReservationFormDrawer';

const { RangePicker } = DatePicker;

export default function ReservationsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedResponse<Reservation> | null>(null);
  const [filters, setFilters] = useState<ReservationFilters>({ page: 1, pageSize: 10 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    loadReservations();
  }, [filters]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const result = await reservationService.getAll(filters);
      // Ensure result.data is always an array
      if (result && !Array.isArray(result.data)) {
        console.error('reservationService.getAll returned non-array data:', result);
        setData({ ...result, data: [] });
      } else {
        setData(result);
      }
    } catch (error) {
      console.error('Failed to load reservations:', error);
      message.error('Failed to load reservations');
      setData({ data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setFilters((prev) => ({ ...prev, page, pageSize }));
  };

  const handleStatusFilter = (status: string | undefined) => {
    setFilters((prev) => ({ ...prev, status: status as any, page: 1 }));
  };

  const handleCreate = () => {
    setEditingReservation(null);
    setDrawerOpen(true);
  };

  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setDrawerOpen(true);
  };

  const handleFormSuccess = () => {
    setDrawerOpen(false);
    setEditingReservation(null);
    loadReservations();
  };

  const columns: ColumnsType<Reservation> = [
    {
      title: 'Confirmation #',
      dataIndex: 'confirmationNumber',
      key: 'confirmationNumber',
      fixed: 'left',
      width: 140,
      render: (value, record) => (
        <a onClick={() => navigate(`/suite/crs/reservations/${record.id}`)}>{value}</a>
      ),
    },
    {
      title: 'Guest',
      key: 'guest',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>
            {record.guest?.firstName} {record.guest?.lastName}
          </span>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>{record.guest?.phone}</span>
        </Space>
      ),
    },
    {
      title: 'Room Type',
      key: 'roomType',
      width: 140,
      render: (_, record) => record.roomType?.name || '-',
    },
    {
      title: 'Room',
      key: 'room',
      width: 80,
      render: (_, record) => record.room?.roomNumber || '-',
    },
    {
      title: 'Check-in',
      dataIndex: 'checkInDate',
      key: 'checkInDate',
      width: 110,
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
      sorter: (a, b) => dayjs(a.checkInDate).unix() - dayjs(b.checkInDate).unix(),
    },
    {
      title: 'Check-out',
      dataIndex: 'checkOutDate',
      key: 'checkOutDate',
      width: 110,
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Nights',
      dataIndex: 'nights',
      key: 'nights',
      width: 70,
      align: 'center',
    },
    {
      title: 'Guests',
      key: 'guests',
      width: 100,
      render: (_, record) => (
        <span>
          {record.adults}A {record.children > 0 && `${record.children}C`}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => <StatusTag status={status} type="reservation" />,
      filters: [
        { text: 'Inquiry', value: 'inquiry' },
        { text: 'Confirmed', value: 'confirmed' },
        { text: 'Checked In', value: 'checked_in' },
        { text: 'Checked Out', value: 'checked_out' },
        { text: 'Cancelled', value: 'cancelled' },
        { text: 'No Show', value: 'no_show' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (source: string) => {
        const sourceLabels: Record<string, string> = {
          direct_website: 'Website',
          phone: 'Phone',
          walk_in: 'Walk-in',
          ota_booking: 'Booking.com',
          ota_expedia: 'Expedia',
          ota_agoda: 'Agoda',
          corporate: 'Corporate',
          travel_agent: 'Travel Agent',
          group: 'Group',
        };
        return <Tag>{sourceLabels[source] || source}</Tag>;
      },
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right',
      render: (value: number) => `₹${value.toLocaleString('en-IN')}`,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                icon: <EyeOutlined />,
                label: 'View Details',
                onClick: () => navigate(`/suite/crs/reservations/${record.id}`),
              },
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit',
                onClick: () => handleEdit(record),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Reservations"
        subtitle="Manage all hotel reservations and bookings"
        breadcrumbs={[
          { label: 'CRS', path: '/suite/crs' },
          { label: 'Reservations' },
        ]}
        actions={
          <Space>
            <Button icon={<CalendarOutlined />} onClick={() => navigate('/suite/crs/calendar')}>
              Calendar View
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              New Reservation
            </Button>
          </Space>
        }
      />

      <DataTable<Reservation>
        title="All Reservations"
        columns={columns}
        dataSource={Array.isArray(data?.data) ? data.data : []}
        rowKey="id"
        loading={loading}
        onSearch={handleSearch}
        onRefresh={loadReservations}
        searchPlaceholder="Search by confirmation #, guest name..."
        pagination={{
          current: data?.page || 1,
          pageSize: data?.pageSize || 10,
          total: data?.total || 0,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} reservations`,
        }}
        extra={
          <Space wrap>
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 140 }}
              onChange={handleStatusFilter}
              options={[
                { label: 'All', value: undefined },
                { label: 'Confirmed', value: 'confirmed' },
                { label: 'Checked In', value: 'checked_in' },
                { label: 'Checked Out', value: 'checked_out' },
                { label: 'Cancelled', value: 'cancelled' },
              ]}
            />
            <RangePicker
              placeholder={['Check-in From', 'Check-in To']}
              onChange={(dates) => {
                if (dates) {
                  setFilters((prev) => ({
                    ...prev,
                    checkInFrom: dates[0]?.format('YYYY-MM-DD'),
                    checkInTo: dates[1]?.format('YYYY-MM-DD'),
                    page: 1,
                  }));
                } else {
                  setFilters((prev) => ({
                    ...prev,
                    checkInFrom: undefined,
                    checkInTo: undefined,
                    page: 1,
                  }));
                }
              }}
            />
          </Space>
        }
      />

      <ReservationFormDrawer
        open={drawerOpen}
        reservation={editingReservation}
        onClose={() => {
          setDrawerOpen(false);
          setEditingReservation(null);
        }}
        onSuccess={handleFormSuccess}
      />
    </Space>
  );
}
