import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { message } from 'antd';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  module?: string;
  actionUrl?: string;
  actionLabel?: string;
  read: boolean;
  timestamp: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// Mock initial notifications
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'info',
    title: 'New Reservation',
    message: 'Booking confirmed for John Smith - Suite 405',
    module: 'crs',
    actionUrl: '/suite/crs/reservations',
    read: false,
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'n2',
    type: 'warning',
    title: 'Low Stock Alert',
    message: 'Toiletries inventory below reorder point',
    module: 'ims',
    actionUrl: '/suite/ims/items',
    read: false,
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 'n3',
    type: 'success',
    title: 'Payment Received',
    message: '₹45,000 payment collected for Folio #F-8931',
    module: 'bms',
    actionUrl: '/suite/bms/folios',
    read: true,
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
  },
  {
    id: 'n4',
    type: 'error',
    title: 'Maintenance Required',
    message: 'AC unit malfunction reported in Room 302',
    module: 'rms',
    actionUrl: '/suite/rms/maintenance',
    read: false,
    timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback(
    (notif: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
      const newNotification: Notification = {
        ...notif,
        id: `n-${Date.now()}`,
        read: false,
        timestamp: new Date().toISOString(),
      };

      setNotifications((prev) => [newNotification, ...prev]);

      // Show toast message
      message[notif.type](`${notif.title}: ${notif.message}`);
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Simulate real-time notifications (for demo)
  useEffect(() => {
    const interval = setInterval(() => {
      const randomEvents = [
        { type: 'info' as const, title: 'Guest Checked In', message: 'Room 201 - Ms. Sarah Johnson', module: 'crs' },
        { type: 'success' as const, title: 'Room Ready', message: 'Room 405 cleaned and inspected', module: 'rms' },
        { type: 'warning' as const, title: 'Late Checkout', message: 'Room 302 requested late checkout', module: 'crs' },
      ];

      // 10% chance of new notification every 30 seconds
      if (Math.random() < 0.1) {
        const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
        addNotification(event);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
