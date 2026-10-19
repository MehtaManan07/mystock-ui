import { create } from 'zustand';
import { toast } from 'sonner';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationState {
  addNotification: (type: NotificationType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

/**
 * Notifications are rendered by sonner (see `components/ui/sonner.tsx`, mounted
 * in `NotificationProvider`). This store stays in place purely so the ~32
 * existing `const { success, error } = useNotificationStore()` call sites keep
 * working unchanged; it no longer holds queue state of its own, because sonner
 * owns stacking, timing and dismissal.
 */
export const useNotificationStore = create<NotificationState>((_set, get) => ({
  addNotification: (type: NotificationType, message: string) => {
    toast[type](message);
  },

  success: (message: string) => get().addNotification('success', message),
  error: (message: string) => get().addNotification('error', message),
  warning: (message: string) => get().addNotification('warning', message),
  info: (message: string) => get().addNotification('info', message),
}));
