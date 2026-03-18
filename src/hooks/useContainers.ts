import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { containersApi } from '../api/containers.api';
import { QUERY_KEYS } from '../constants';
import type { Container, CreateContainerDto, UpdateContainerDto, PaginatedResponse } from '../types';
import { useNotificationStore } from '../stores/notificationStore';

const INFINITE_FILTER = { queryKey: QUERY_KEYS.CONTAINERS_INFINITE() };

/**
 * Hook to fetch all containers (kept for backward compatibility)
 */
export const useContainers = (search?: string) => {
  const normalizedSearch = search?.trim() || undefined;

  return useQuery({
    queryKey: QUERY_KEYS.CONTAINERS_LIST(normalizedSearch),
    queryFn: () => containersApi.getAll(normalizedSearch),
  });
};

/**
 * Hook for infinite scroll containers list
 */
export const useContainersInfinite = (search?: string) => {
  const normalizedSearch = search?.trim() || undefined;

  return useInfiniteQuery({
    queryKey: QUERY_KEYS.CONTAINERS_INFINITE(normalizedSearch),

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
 */
export const useCreateContainer = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: (data: CreateContainerDto) => containersApi.create(data),

    onMutate: async (newData) => {
      await queryClient.cancelQueries(INFINITE_FILTER);

      const previousQueriesData = queryClient.getQueriesData<InfiniteData<PaginatedResponse<Container>>>(INFINITE_FILTER);

      const tempId = Date.now();
      const optimisticContainer: Container = {
        id: tempId,
        name: newData.name,
        type: newData.type,
        productCount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };

      queryClient.setQueriesData<InfiniteData<PaginatedResponse<Container>>>(
        INFINITE_FILTER,
        (old) => {
          if (!old) return old;
          const firstPage = old.pages[0];
          return {
            ...old,
            pages: [
              {
                ...firstPage,
                items: [optimisticContainer, ...firstPage.items],
                total: firstPage.total + 1,
              },
              ...old.pages.slice(1),
            ],
          };
        }
      );

      return { previousQueriesData, tempId };
    },

    onSuccess: (serverContainer, _, context) => {
      success(`Container "${serverContainer.name}" created successfully`);

      // Replace optimistic entry with real server data
      queryClient.setQueriesData<InfiniteData<PaginatedResponse<Container>>>(
        INFINITE_FILTER,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((c) =>
                c.id === context?.tempId ? serverContainer : c
              ),
            })),
          };
        }
      );
    },

    onError: (err, _, context) => {
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      error(`Failed to create container: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};

/**
 * Hook to update a container
 */
export const useUpdateContainer = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateContainerDto }) =>
      containersApi.update(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries(INFINITE_FILTER);

      const previousQueriesData = queryClient.getQueriesData<InfiniteData<PaginatedResponse<Container>>>(INFINITE_FILTER);

      queryClient.setQueriesData<InfiniteData<PaginatedResponse<Container>>>(
        INFINITE_FILTER,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((c) =>
                c.id === id ? { ...c, ...data } : c
              ),
            })),
          };
        }
      );

      return { previousQueriesData };
    },

    onSuccess: (serverContainer, { id }) => {
      success(`Container "${serverContainer.name}" updated successfully`);

      // Update with confirmed server data
      queryClient.setQueriesData<InfiniteData<PaginatedResponse<Container>>>(
        INFINITE_FILTER,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((c) =>
                c.id === id ? { ...c, ...serverContainer } : c
              ),
            })),
          };
        }
      );

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTAINER(id) });
    },

    onError: (err, _, context) => {
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      error(`Failed to update container: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};

/**
 * Hook to delete a container
 */
export const useDeleteContainer = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: (id: number) => containersApi.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries(INFINITE_FILTER);

      const previousQueriesData = queryClient.getQueriesData<InfiniteData<PaginatedResponse<Container>>>(INFINITE_FILTER);

      queryClient.setQueriesData<InfiniteData<PaginatedResponse<Container>>>(
        INFINITE_FILTER,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.filter((c) => c.id !== id),
              total: Math.max(0, page.total - 1),
            })),
          };
        }
      );

      return { previousQueriesData };
    },

    onSuccess: () => {
      success('Container deleted successfully');
      queryClient.invalidateQueries(INFINITE_FILTER);
    },

    onError: (err, _, context) => {
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      error(`Failed to delete container: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};

/**
 * Hook to create multiple containers in bulk
 */
export const useCreateContainersBulk = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: (data: CreateContainerDto[]) => containersApi.createBulk(data),

    onSuccess: (serverContainers) => {
      success(`Successfully created ${serverContainers.length} container${serverContainers.length !== 1 ? 's' : ''}`);

      // Invalidate infinite scroll queries
      queryClient.invalidateQueries(INFINITE_FILTER);
    },

    onError: (err) => {
      error(`Failed to create containers: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};
