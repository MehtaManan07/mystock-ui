import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (message: string, type: NotificationType, duration?: number) => void;
  removeNotification: (id: string) => void;
  
  // Convenience methods
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  
  addNotification: (message, type, duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const notification: Notification = { id, message, type, duration };
    
    set((state) => ({
      notifications: [...state.notifications, notification],
    }));
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  
  // Convenience methods
  success: (message) => get().addNotification(message, 'success'),
  error: (message) => get().addNotification(message, 'error', 6000),
  warning: (message) => get().addNotification(message, 'warning'),
  info: (message) => get().addNotification(message, 'info'),
}));

// Export a hook for easy access
export const useNotification = () => {
  const { success, error, warning, info } = useNotificationStore();
  return { success, error, warning, info };
};
