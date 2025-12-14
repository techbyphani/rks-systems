import { useState } from 'react';
import { Modal, Form, Select, Input, Descriptions, Space, Tag, message, Alert, Typography } from 'antd';
import { LoginOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { reservationService } from '@/api';
import type { Reservation, Room } from '@/types';
import { StatusTag } from '@/components/shared';

const { Text } = Typography;

interface CheckInModalProps {
  open: boolean;
  reservation: Reservation;
  availableRooms: Room[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function CheckInModal({
  open,
  reservation,
  availableRooms,
  onClose,
  onSuccess,
}: CheckInModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      await reservationService.checkIn(reservation.id, {
        roomId: values.roomId,
        notes: values.notes,
      });
      
      onSuccess();
    } catch (error) {
      message.error('Failed to check in guest');
    } finally {
      setLoading(false);
    }
  };

  const isEarlyCheckIn = dayjs().isBefore(dayjs(reservation.checkInDate), 'day');
  const isLateCheckIn = dayjs().isAfter(dayjs(reservation.checkInDate), 'day');

  return (
    <Modal
      title={
        <Space>
          <LoginOutlined />
          Check In Guest
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleCheckIn}
      okText="Complete Check-In"
      confirmLoading={loading}
      width={600}
    >
      {isEarlyCheckIn && (
        <Alert
          message="Early Check-In"
          description="This is an early check-in. Please confirm with the guest about any additional charges."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      {isLateCheckIn && (
        <Alert
          message="Late Check-In"
          description="The scheduled check-in date has passed."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Confirmation #">
          {reservation.confirmationNumber}
        </Descriptions.Item>
        <Descriptions.Item label="Guest">
          {reservation.guest?.firstName} {reservation.guest?.lastName}
          {reservation.guest?.vipStatus !== 'none' && (
            <Tag color="gold" style={{ marginLeft: 8 }}>
              {reservation.guest?.vipStatus?.toUpperCase()}
            </Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Room Type">
          {reservation.roomType?.name}
        </Descriptions.Item>
        <Descriptions.Item label="Scheduled Check-In">
          {dayjs(reservation.checkInDate).format('ddd, DD MMM YYYY')}
        </Descriptions.Item>
        <Descriptions.Item label="Scheduled Check-Out">
          {dayjs(reservation.checkOutDate).format('ddd, DD MMM YYYY')}
        </Descriptions.Item>
        <Descriptions.Item label="Nights">
          {reservation.nights}
        </Descriptions.Item>
        <Descriptions.Item label="Guests">
          {reservation.adults} Adults
          {reservation.children > 0 && `, ${reservation.children} Children`}
        </Descriptions.Item>
        <Descriptions.Item label="Total Amount">
          <Text strong>₹{reservation.totalAmount.toLocaleString('en-IN')}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Deposit">
          ₹{reservation.depositAmount.toLocaleString('en-IN')}
          <Tag color={reservation.depositPaid ? 'green' : 'orange'} style={{ marginLeft: 8 }}>
            {reservation.depositPaid ? 'Paid' : 'Pending'}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      <Form form={form} layout="vertical">
        <Form.Item
          name="roomId"
          label="Assign Room"
          rules={[{ required: true, message: 'Please select a room' }]}
        >
          <Select
            placeholder="Select an available room"
            options={availableRooms.map((room) => ({
              label: (
                <Space>
                  <span>Room {room.roomNumber}</span>
                  <Tag color="blue">Floor {room.floor}</Tag>
                  {room.hasBalcony && <Tag color="green">Balcony</Tag>}
                  {room.viewType && <Tag>{room.viewType}</Tag>}
                </Space>
              ),
              value: room.id,
            }))}
            notFoundContent="No rooms available for this room type"
          />
        </Form.Item>

        <Form.Item name="notes" label="Check-In Notes">
          <Input.TextArea
            rows={2}
            placeholder="Any notes for this check-in (e.g., special arrangements, guest requests)..."
          />
        </Form.Item>
      </Form>

      {reservation.specialRequests && (
        <Alert
          message="Guest Special Requests"
          description={reservation.specialRequests}
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Modal>
  );
}
