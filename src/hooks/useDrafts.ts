import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { draftsApi, type CreateDraftDto, type UpdateDraftDto } from '../api/drafts.api';
import { QUERY_KEYS } from '../constants';
import { useNotificationStore } from '../stores/notificationStore';

/**
 * Hook to fetch all drafts for current user
 */
export const useDrafts = (type?: 'sale' | 'purchase') => {
  return useQuery({
    queryKey: type ? [...QUERY_KEYS.DRAFTS, type] : QUERY_KEYS.DRAFTS,
    queryFn: () => draftsApi.getAll(type),
  });
};

/**
 * Hook to fetch a single draft by ID
 */
export const useDraft = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.DRAFT(id),
    queryFn: () => draftsApi.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a new draft
 */
export const useCreateDraft = () => {
  const queryClient = useQueryClient();
  const { error } = useNotificationStore();

  return useMutation({
    mutationFn: (data: CreateDraftDto) => draftsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DRAFTS });
    },
    onError: (err) => {
      error(`Failed to save draft: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};

/**
 * Hook to update a draft
 */
export const useUpdateDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDraftDto }) =>
      draftsApi.update(id, data),
    onSuccess: (updatedDraft, { id }) => {
      // Only invalidate the specific draft, not the entire list
      // This prevents unnecessary refetches of the drafts list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DRAFT(id) });

      // Optionally update the draft in the cache without refetching
      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.DRAFTS },
        (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((draft: any) =>
            draft.id === id ? updatedDraft : draft
          );
        }
      );
    },
  });
};

/**
 * Hook to delete a draft
 */
export const useDeleteDraft = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: (id: number) => draftsApi.delete(id),
    onSuccess: () => {
      success('Draft deleted successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DRAFTS });
    },
    onError: (err) => {
      error(`Failed to delete draft: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};
