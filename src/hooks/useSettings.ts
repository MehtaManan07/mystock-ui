import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings.api';
import type { UpdateCompanySettingsDto } from '../types';
import { useNotificationStore } from '../stores/notificationStore';
import { QUERY_KEYS } from '../constants';

/**
 * Hook to fetch company settings
 */
export const useSettings = () => {
  return useQuery({
    queryKey: QUERY_KEYS.SETTINGS,
    queryFn: () => settingsApi.get(),
  });
};

/**
 * Hook to update company settings
 */
export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: (data: UpdateCompanySettingsDto) => settingsApi.update(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.SETTINGS });

      const previousSettings = queryClient.getQueryData(QUERY_KEYS.SETTINGS);

      queryClient.setQueryData(QUERY_KEYS.SETTINGS, (old: any) =>
        old ? { ...old, ...newData } : old
      );

      return { previousSettings };
    },
    onSuccess: (serverSettings) => {
      queryClient.setQueryData(QUERY_KEYS.SETTINGS, serverSettings);
      success('Settings saved successfully');
    },
    onError: (err, _, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(QUERY_KEYS.SETTINGS, context.previousSettings);
      }
      error(`Failed to save settings: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};
