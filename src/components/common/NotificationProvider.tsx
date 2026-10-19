import React from 'react';
import { Toaster } from '@/components/ui/sonner';

/**
 * Mounts the sonner toast surface. Messages are pushed through
 * `useNotificationStore` (success/error/warning/info).
 */
export const NotificationProvider: React.FC = () => {
  return <Toaster position="bottom-right" richColors closeButton />;
};

export default NotificationProvider;
