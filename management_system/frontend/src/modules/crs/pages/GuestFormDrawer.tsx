import { useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Space, Row, Col, Divider, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { guestService, type CreateGuestDto } from '@/api';
import type { Guest } from '@/types';
import { useAppContext } from '@/context/AppContext';

interface GuestFormDrawerProps {
  open: boolean;
  guest: Guest | null;
  onClose: () => void;
  onSuccess: () => void;
}

const VIP_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Silver', value: 'silver' },
  { label: 'Gold', value: 'gold' },
  { label: 'Platinum', value: 'platinum' },
];

const ID_TYPE_OPTIONS = [
  { label: 'Passport', value: 'passport' },
  { label: 'National ID', value: 'national_id' },
  { label: 'Driving License', value: 'driving_license' },
  { label: 'Other', value: 'other' },
];

const NATIONALITY_OPTIONS = [
  'India', 'United States', 'United Kingdom', 'Singapore', 'Australia', 
  'Germany', 'France', 'Japan', 'China', 'UAE', 'Canada', 'Other'
].map(n => ({ label: n, value: n }));

export default function GuestFormDrawer({ open, guest, onClose, onSuccess }: GuestFormDrawerProps) {
  const { tenant } = useAppContext();
  const [form] = Form.useForm();
  const isEditing = !!guest;

  useEffect(() => {
    if (open) {
      if (guest) {
        form.setFieldsValue({
          ...guest,
          street: guest.address?.street,
          city: guest.address?.city,
          state: guest.address?.state,
          postalCode: guest.address?.postalCode,
          country: guest.address?.country,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, guest, form]);

  const handleSubmit = async (values: any) => {
    if (!tenant?.id) {
      message.error('Tenant context not available');
      return;
    }
    try {
      const data: CreateGuestDto = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        alternatePhone: values.alternatePhone,
        dateOfBirth: values.dateOfBirth,
        nationality: values.nationality,
        idType: values.idType,
        idNumber: values.idNumber,
        idExpiryDate: values.idExpiryDate,
        vipStatus: values.vipStatus || 'none',
        notes: values.notes,
        tags: values.tags,
        address: values.street ? {
          street: values.street,
          city: values.city,
          state: values.state,
          postalCode: values.postalCode,
          country: values.country,
        } : undefined,
        preferences: {
          roomType: values.roomPreference,
          floorPreference: values.floorPreference,
          bedType: values.bedType,
          smokingRoom: values.smokingRoom,
          dietaryRestrictions: values.dietaryRestrictions,
          specialRequests: values.specialRequests,
        },
      };

      if (isEditing) {
        await guestService.update(tenant.id, guest.id, data);
        message.success('Guest updated successfully');
      } else {
        await guestService.create(tenant.id, data);
        message.success('Guest created successfully');
      }
      onSuccess();
    } catch (error) {
      message.error(isEditing ? 'Failed to update guest' : 'Failed to create guest');
    }
  };

  return (
    <Drawer
      title={isEditing ? 'Edit Guest' : 'Add New Guest'}
      width={720}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()}>
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Divider>Basic Information</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true, message: 'First name is required' }]}
            >
              <Input placeholder="Enter first name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true, message: 'Last name is required' }]}
            >
              <Input placeholder="Enter last name" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input placeholder="email@example.com" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Phone"
              rules={[{ required: true, message: 'Phone is required' }]}
            >
              <Input placeholder="+91-9876543210" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="alternatePhone" label="Alternate Phone">
              <Input placeholder="+91-9876543210" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="dateOfBirth" label="Date of Birth">
              <Input type="date" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="nationality" label="Nationality">
              <Select options={NATIONALITY_OPTIONS} placeholder="Select nationality" allowClear />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="vipStatus" label="VIP Status">
              <Select options={VIP_OPTIONS} placeholder="Select status" />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Identity Document</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="idType" label="ID Type">
              <Select options={ID_TYPE_OPTIONS} placeholder="Select type" allowClear />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="idNumber" label="ID Number">
              <Input placeholder="Enter ID number" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="idExpiryDate" label="ID Expiry Date">
              <Input type="date" />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Address</Divider>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="street" label="Street Address">
              <Input placeholder="Enter street address" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="city" label="City">
              <Input placeholder="City" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="state" label="State">
              <Input placeholder="State" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="postalCode" label="Postal Code">
              <Input placeholder="Postal code" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="country" label="Country">
              <Select options={NATIONALITY_OPTIONS} placeholder="Select country" allowClear />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Preferences</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="floorPreference" label="Floor Preference">
              <Select
                options={[
                  { label: 'Any', value: 'any' },
                  { label: 'High Floor', value: 'high' },
                  { label: 'Low Floor', value: 'low' },
                ]}
                placeholder="Select preference"
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="bedType" label="Bed Type">
              <Select
                options={[
                  { label: 'King', value: 'king' },
                  { label: 'Queen', value: 'queen' },
                  { label: 'Twin', value: 'twin' },
                ]}
                placeholder="Select type"
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="smokingRoom" label="Smoking Room">
              <Select
                options={[
                  { label: 'No', value: false },
                  { label: 'Yes', value: true },
                ]}
                placeholder="Select"
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="dietaryRestrictions" label="Dietary Restrictions">
              <Select
                mode="tags"
                placeholder="Enter dietary restrictions"
                options={[
                  { label: 'Vegetarian', value: 'vegetarian' },
                  { label: 'Vegan', value: 'vegan' },
                  { label: 'Gluten-Free', value: 'gluten-free' },
                  { label: 'Halal', value: 'halal' },
                  { label: 'Kosher', value: 'kosher' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Additional</Divider>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="tags" label="Tags">
              <Select
                mode="tags"
                placeholder="Add tags"
                options={[
                  { label: 'Frequent Guest', value: 'frequent' },
                  { label: 'Corporate', value: 'corporate' },
                  { label: 'Anniversary', value: 'anniversary' },
                  { label: 'Honeymoon', value: 'honeymoon' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={3} placeholder="Internal notes about this guest..." />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="specialRequests" label="Special Requests">
              <Input.TextArea rows={2} placeholder="Guest's special requests..." />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
}
