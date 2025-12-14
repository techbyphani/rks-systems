import { useState, useEffect } from 'react';
import { Modal, Descriptions, Space, Tag, message, Alert, Typography, Divider, Button, Statistic, Row, Col } from 'antd';
import { LogoutOutlined, PrinterOutlined, DollarOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { billingService, workflowService } from '@/api';
import { useNotifications } from '@/context/NotificationContext';
import type { Reservation, Folio } from '@/types';

const { Text, Title } = Typography;

interface CheckOutModalProps {
  open: boolean;
  reservation: Reservation;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CheckOutModal({
  open,
  reservation,
  onClose,
  onSuccess,
}: CheckOutModalProps) {
  const [loading, setLoading] = useState(false);
  const [folio, setFolio] = useState<Folio | null>(null);
  const [folioLoading, setFolioLoading] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (open && reservation.folioId) {
      loadFolio();
    }
  }, [open, reservation.folioId]);

  const loadFolio = async () => {
    if (!reservation.folioId) return;
    setFolioLoading(true);
    try {
      const data = await billingService.getFolioById(reservation.folioId);
      setFolio(data);
    } catch (error) {
      console.error('Failed to load folio');
    } finally {
      setFolioLoading(false);
    }
  };

  const handleCheckOut = async () => {
    // Check if there's an outstanding balance
    if (folio && folio.balance > 0) {
      message.error(`Please settle outstanding balance of ₹${folio.balance.toLocaleString('en-IN')} before checkout.`);
      return;
    }
    performCheckOut();
  };

  const performCheckOut = async () => {
    setLoading(true);
    try {
      // Use workflow service for integrated check-out
      // This will: 1) Check-out reservation, 2) Release room, 3) Close folio
      const result = await workflowService.performCheckOut(reservation.id);
      
      message.success(`Guest checked out from Room ${result.room?.roomNumber}`);
      
      addNotification({
        type: 'success',
        title: 'Check-Out Complete',
        message: `${reservation.guest?.firstName} ${reservation.guest?.lastName} checked out`,
        module: 'crs',
        actionUrl: `/suite/crs/reservations/${reservation.id}`,
      });
      
      onSuccess();
    } catch (error: any) {
      message.error(error.message || 'Failed to check out guest');
    } finally {
      setLoading(false);
    }
  };

  const isEarlyCheckOut = dayjs().isBefore(dayjs(reservation.checkOutDate), 'day');
  const isLateCheckOut = dayjs().isAfter(dayjs(reservation.checkOutDate), 'day');
  const stayDuration = reservation.actualCheckIn 
    ? dayjs().diff(dayjs(reservation.actualCheckIn), 'day') 
    : reservation.nights;

  return (
    <Modal
      title={
        <Space>
          <LogoutOutlined />
          Check Out Guest
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="print"
          icon={<PrinterOutlined />}
          onClick={() => message.info('Print functionality coming soon')}
        >
          Print Folio
        </Button>,
        <Button
          key="checkout"
          type="primary"
          icon={<LogoutOutlined />}
          loading={loading}
          onClick={handleCheckOut}
        >
          Complete Check-Out
        </Button>,
      ]}
      width={700}
    >
      {isEarlyCheckOut && (
        <Alert
          message="Early Check-Out"
          description={`Guest is checking out ${dayjs(reservation.checkOutDate).diff(dayjs(), 'day')} day(s) early.`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      {isLateCheckOut && (
        <Alert
          message="Late Check-Out"
          description="Please check if late check-out charges apply."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Confirmation #">
          {reservation.confirmationNumber}
        </Descriptions.Item>
        <Descriptions.Item label="Room">
          {reservation.room?.roomNumber || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Guest" span={2}>
          {reservation.guest?.firstName} {reservation.guest?.lastName}
          {reservation.guest?.vipStatus !== 'none' && (
            <Tag color="gold" style={{ marginLeft: 8 }}>
              {reservation.guest?.vipStatus?.toUpperCase()}
            </Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Check-In">
          {reservation.actualCheckIn 
            ? dayjs(reservation.actualCheckIn).format('DD MMM YYYY HH:mm')
            : dayjs(reservation.checkInDate).format('DD MMM YYYY')
          }
        </Descriptions.Item>
        <Descriptions.Item label="Check-Out (Scheduled)">
          {dayjs(reservation.checkOutDate).format('DD MMM YYYY')}
        </Descriptions.Item>
        <Descriptions.Item label="Nights Stayed">
          {stayDuration}
        </Descriptions.Item>
        <Descriptions.Item label="Room Type">
          {reservation.roomType?.name}
        </Descriptions.Item>
      </Descriptions>

      <Divider>Billing Summary</Divider>

      {folioLoading ? (
        <div style={{ textAlign: 'center', padding: 20 }}>Loading folio...</div>
      ) : folio ? (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Statistic
                title="Total Charges"
                value={folio.totalCharges}
                prefix="₹"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Total Payments"
                value={folio.totalPayments}
                prefix="₹"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Balance Due"
                value={folio.balance}
                prefix="₹"
                valueStyle={{ color: folio.balance > 0 ? '#ff4d4f' : '#52c41a' }}
              />
            </Col>
          </Row>

          {folio.balance > 0 && (
            <Alert
              message="Outstanding Balance"
              description={
                <Space direction="vertical">
                  <Text>
                    There is an outstanding balance of{' '}
                    <Text strong style={{ color: '#ff4d4f' }}>
                      ₹{folio.balance.toLocaleString('en-IN')}
                    </Text>
                  </Text>
                  <Button
                    type="primary"
                    size="small"
                    icon={<DollarOutlined />}
                    onClick={() => message.info('Redirecting to payment collection...')}
                  >
                    Collect Payment
                  </Button>
                </Space>
              }
              type="warning"
              showIcon
            />
          )}

          {folio.balance === 0 && (
            <Alert
              message="Fully Settled"
              description="All charges have been paid. Ready for check-out."
              type="success"
              showIcon
            />
          )}
          
          <Divider />
          
          <Alert
            message="Check-Out Workflow"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Reservation status will be updated to "Checked Out"</li>
                <li>Room will be released and marked for housekeeping</li>
                <li>Guest folio will be closed</li>
              </ul>
            }
            type="info"
            icon={<FileTextOutlined />}
            showIcon
            style={{ marginTop: 16 }}
          />
        </>
      ) : (
        <Alert
          message="No Folio Found"
          description="No billing folio is associated with this reservation."
          type="info"
          showIcon
        />
      )}
    </Modal>
  );
}
