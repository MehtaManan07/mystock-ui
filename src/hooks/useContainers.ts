import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { containersApi } from '../api/containers.api';
import { QUERY_KEYS, type ContainerType } from '../constants';
import type { CreateContainerDto, UpdateContainerDto, Container } from '../types';
import { useNotificationStore } from '../stores/notificationStore';

/**
 * Hook to fetch all containers (kept for backward compatibility)
 */
export const useContainers = (search?: string) => {
  const normalizedSearch = search?.trim() || undefined;

  return useQuery({
    queryKey: normalizedSearch
      ? [...QUERY_KEYS.CONTAINERS, normalizedSearch]
      : QUERY_KEYS.CONTAINERS,
    queryFn: () => containersApi.getAll(normalizedSearch),
  });
};

/**
 * Hook for infinite scroll containers list
 */
export const useContainersInfinite = (search?: string) => {
  const normalizedSearch = search?.trim() || undefined;

  return useInfiniteQuery({
    queryKey: normalizedSearch
      ? [...QUERY_KEYS.CONTAINERS, 'infinite', normalizedSearch]
      : [...QUERY_KEYS.CONTAINERS, 'infinite'],

    queryFn: ({ pageParam = 1 }) =>
      containersApi.getPaginated(pageParam, 25, normalizedSearch),

    getNextPageParam: (lastPage) => {
      // Return next page number if there are more pages, undefined otherwise
      return lastPage.has_more ? lastPage.page + 1 : undefined;
    },

    initialPageParam: 1,
  });
};

/**
 * Hook to fetch a single container by ID
 */
export const useContainer = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.CONTAINER(id),
    queryFn: () => containersApi.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a new container
 * Invalidates infinite scroll cache
 */
export const useCreateContainer = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: (data: CreateContainerDto) => containersApi.create(data),

    onSuccess: (serverContainer) => {
      success(`Container "${serverContainer.name}" created successfully`);

      // Invalidate infinite scroll queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.CONTAINERS, 'infinite'],
      });
    },

    onError: (err) => {
      error(`Failed to create container: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};

/**
 * Hook to update a container
 * Invalidates infinite scroll cache
 */
export const useUpdateContainer = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateContainerDto }) =>
      containersApi.update(id, data),

    onSuccess: (serverContainer, { id }) => {
      success('Container updated successfully');

      // Invalidate infinite scroll queries
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.CONTAINERS, 'infinite'],
      });

      // Invalidate detail view
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CONTAINER(id),
      });
    },

    onError: (err) => {
      error(`Failed to update container: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};

/**
 * Hook to delete a container
 * Invalidates infinite scroll cache
 */
export const useDeleteContainer = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: (id: number) => containersApi.delete(id),

    onSuccess: () => {
      success('Container deleted successfully');

      // Invalidate infinite scroll queries
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.CONTAINERS, 'infinite'],
      });
    },

    onError: (err) => {
      error(`Failed to delete container: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};

/**
 * Hook to create multiple containers in bulk
 * Invalidates infinite scroll cache
 */
export const useCreateContainersBulk = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: (data: CreateContainerDto[]) => containersApi.createBulk(data),

    onSuccess: (serverContainers) => {
      success(`Successfully created ${serverContainers.length} container${serverContainers.length !== 1 ? 's' : ''}`);

      // Invalidate infinite scroll queries
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.CONTAINERS, 'infinite'],
      });
    },

    onError: (err) => {
      error(`Failed to create containers: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};
