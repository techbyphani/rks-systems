import { Drawer, Button, Space, Form } from 'antd';
import type { DrawerProps, FormInstance } from 'antd';
import type { ReactNode } from 'react';

interface FormDrawerProps extends Omit<DrawerProps, 'onClose'> {
  title: string;
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
  children: ReactNode;
  width?: number;
  form?: FormInstance;
}

export default function FormDrawer({
  title,
  open,
  onClose,
  onSubmit,
  loading,
  submitText = 'Save',
  cancelText = 'Cancel',
  children,
  width = 520,
  form,
  ...rest
}: FormDrawerProps) {
  const handleSubmit = () => {
    if (form) {
      form.submit();
    } else {
      onSubmit();
    }
  };

  return (
    <Drawer
      title={title}
      open={open}
      onClose={onClose}
      width={width}
      destroyOnClose
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            {submitText}
          </Button>
        </Space>
      }
      {...rest}
    >
      {children}
    </Drawer>
  );
}

// Form Modal variant
import { Modal } from 'antd';

interface FormModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
  children: ReactNode;
  width?: number;
  form?: FormInstance;
}

export function FormModal({
  title,
  open,
  onClose,
  onSubmit,
  loading,
  submitText = 'Save',
  cancelText = 'Cancel',
  children,
  width = 520,
  form,
}: FormModalProps) {
  const handleSubmit = () => {
    if (form) {
      form.submit();
    } else {
      onSubmit();
    }
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      width={width}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            {submitText}
          </Button>
        </Space>
      }
    >
      {children}
    </Modal>
  );
}
