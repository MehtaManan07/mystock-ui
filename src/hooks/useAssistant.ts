import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assistantApi } from '../api/assistant.api';
import { QUERY_KEYS } from '../constants';
import { useNotificationStore } from '../stores/notificationStore';
import type { SendMessagePayload } from '../types/assistant';

/** All threads for the sidebar, most-recently-updated first (server order). */
export const useThreads = () => {
  return useQuery({
    queryKey: QUERY_KEYS.ASSISTANT_THREADS,
    queryFn: () => assistantApi.listThreads(),
  });
};

/** One thread with its full message history. */
export const useThread = (id: number | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.ASSISTANT_THREAD(id ?? 0),
    queryFn: () => assistantApi.getThread(id as number),
    enabled: !!id,
  });
};

/**
 * Post a message. Returns `{ thread_id, run_id, message }`; the caller opens
 * the stream with `run_id`. We invalidate the thread list (ordering/title may
 * change) but deliberately do NOT refetch the thread detail here -- the live
 * stream owns the assistant's reply until it finishes.
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { error } = useNotificationStore();

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => assistantApi.sendMessage(payload),
    onMutate: () => {
      // Optimistically update the thread list to reflect the new message.
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASSISTANT_THREADS });
    },
    onError: (err) => {
      error(`Failed to send message: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};

export const useCreateThread = () => {
  const queryClient = useQueryClient();
  const { error } = useNotificationStore();

  return useMutation({
    mutationFn: (title?: string) => assistantApi.createThread(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASSISTANT_THREADS });
    },
    onError: (err) => {
      error(`Failed to create chat: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};

export const useRenameThread = () => {
  const queryClient = useQueryClient();
  const { error } = useNotificationStore();

  return useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      assistantApi.renameThread(id, title),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASSISTANT_THREADS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASSISTANT_THREAD(id) });
    },
    onError: (err) => {
      error(`Failed to rename chat: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};

export const useDeleteThread = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: (id: number) => assistantApi.deleteThread(id),
    onSuccess: () => {
      success('Chat deleted');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASSISTANT_THREADS });
    },
    onError: (err) => {
      error(`Failed to delete chat: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};

export const useCancelRun = () => {
  const { error } = useNotificationStore();

  return useMutation({
    mutationFn: (id: number) => assistantApi.cancelRun(id),
    onError: (err) => {
      error(`Failed to stop the assistant: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};
