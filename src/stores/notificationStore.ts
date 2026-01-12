import { create } from 'zustand';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (type: NotificationType, message: string) => void;
  removeNotification: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (type: NotificationType, message: string) => {
    const id = Date.now().toString();
    const notification: Notification = { id, type, message };

    set((state) => ({
      notifications: [...state.notifications, notification],
    }));

    // Auto-remove after 5 seconds
    setTimeout(() => {
      get().removeNotification(id);
    }, 5000);
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  success: (message: string) => {
    get().addNotification('success', message);
  },

  error: (message: string) => {
    get().addNotification('error', message);
  },

  warning: (message: string) => {
    get().addNotification('warning', message);
  },

  info: (message: string) => {
    get().addNotification('info', message);
  },
}));
