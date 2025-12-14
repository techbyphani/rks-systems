import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Tag, Avatar, Dropdown, message } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, MoreOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, DataTable, StatusTag } from '@/components/shared';
import { guestService, type GuestFilters } from '@/api';
import type { Guest, PaginatedResponse } from '@/types';
import GuestFormDrawer from './GuestFormDrawer';

export default function GuestsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedResponse<Guest> | null>(null);
  const [filters, setFilters] = useState<GuestFilters>({ page: 1, pageSize: 10 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  useEffect(() => {
    loadGuests();
  }, [filters]);

  const loadGuests = async () => {
    setLoading(true);
    try {
      const result = await guestService.getAll(filters);
      setData(result);
    } catch (error) {
      message.error('Failed to load guests');
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

  const handleCreate = () => {
    setEditingGuest(null);
    setDrawerOpen(true);
  };

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setDrawerOpen(true);
  };

  const handleDelete = async (guest: Guest) => {
    try {
      await guestService.delete(guest.id);
      message.success('Guest deleted successfully');
      loadGuests();
    } catch (error) {
      message.error('Failed to delete guest');
    }
  };

  const handleFormSuccess = () => {
    setDrawerOpen(false);
    setEditingGuest(null);
    loadGuests();
  };

  const columns: ColumnsType<Guest> = [
    {
      title: 'Guest',
      key: 'guest',
      fixed: 'left',
      width: 250,
      render: (_, record) => (
        <Space>
          <Avatar 
            style={{ backgroundColor: record.vipStatus !== 'none' ? '#faad14' : '#1890ff' }}
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.firstName} {record.lastName}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
    },
    {
      title: 'VIP Status',
      dataIndex: 'vipStatus',
      key: 'vipStatus',
      width: 120,
      render: (status: Guest['vipStatus']) => <StatusTag status={status} type="vip" />,
      filters: [
        { text: 'None', value: 'none' },
        { text: 'Silver', value: 'silver' },
        { text: 'Gold', value: 'gold' },
        { text: 'Platinum', value: 'platinum' },
      ],
      onFilter: (value, record) => record.vipStatus === value,
    },
    {
      title: 'Nationality',
      dataIndex: 'nationality',
      key: 'nationality',
      width: 120,
    },
    {
      title: 'Total Stays',
      dataIndex: 'totalStays',
      key: 'totalStays',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.totalStays - b.totalStays,
    },
    {
      title: 'Total Spend',
      dataIndex: 'totalSpend',
      key: 'totalSpend',
      width: 130,
      align: 'right',
      render: (value: number) => `₹${value.toLocaleString('en-IN')}`,
      sorter: (a, b) => a.totalSpend - b.totalSpend,
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <Space size={4} wrap>
          {tags?.slice(0, 2).map((tag) => (
            <Tag key={tag} color="blue">{tag}</Tag>
          ))}
          {tags?.length > 2 && <Tag>+{tags.length - 2}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                icon: <EyeOutlined />,
                label: 'View Details',
                onClick: () => navigate(`/suite/crs/guests/${record.id}`),
              },
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit',
                onClick: () => handleEdit(record),
              },
              { type: 'divider' },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: 'Delete',
                danger: true,
                onClick: () => handleDelete(record),
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
        title="Guest Management"
        subtitle="Manage guest profiles, preferences, and history"
        breadcrumbs={[
          { label: 'CRS', path: '/suite/crs' },
          { label: 'Guests' },
        ]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Guest
          </Button>
        }
      />

      <DataTable<Guest>
        title="All Guests"
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={loading}
        onSearch={handleSearch}
        onRefresh={loadGuests}
        searchPlaceholder="Search by name, email, or phone..."
        pagination={{
          current: data?.page || 1,
          pageSize: data?.pageSize || 10,
          total: data?.total || 0,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} guests`,
        }}
        extra={
          <Space>
            <Button onClick={() => setFilters((prev) => ({ ...prev, vipStatus: undefined }))}>
              All
            </Button>
            <Button onClick={() => setFilters((prev) => ({ ...prev, vipStatus: 'gold' }))}>
              VIP Only
            </Button>
          </Space>
        }
      />

      <GuestFormDrawer
        open={drawerOpen}
        guest={editingGuest}
        onClose={() => {
          setDrawerOpen(false);
          setEditingGuest(null);
        }}
        onSuccess={handleFormSuccess}
      />
    </Space>
  );
}
