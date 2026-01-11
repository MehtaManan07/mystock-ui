import React from 'react';
import { Snackbar, Alert, Stack } from '@mui/material';
import { useNotificationStore } from '../../stores/notificationStore';

export const NotificationProvider: React.FC = () => {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <Stack
      spacing={1}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 2000,
        maxWidth: 400,
      }}
    >
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ position: 'relative', mb: 0 }}
        >
          <Alert
            severity={notification.type}
            variant="filled"
            onClose={() => removeNotification(notification.id)}
            sx={{
              width: '100%',
              boxShadow: 3,
              '& .MuiAlert-message': {
                maxWidth: 300,
                wordBreak: 'break-word',
              },
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
};
