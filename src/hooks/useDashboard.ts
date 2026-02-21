import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';
import { QUERY_KEYS } from '../constants';

/**
 * Hook to fetch all dashboard data in a single API call
 */
export const useDashboard = () => {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD,
    queryFn: () => dashboardApi.getData(),
    staleTime: 1000 * 60 * 5, // 5 minutes - dashboard data doesn't need to be real-time
  });
};
