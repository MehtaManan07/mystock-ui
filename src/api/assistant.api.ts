import api from './axios';
import { API_ENDPOINTS } from '../constants';
import type {
  RunResponse,
  SendMessagePayload,
  SendMessageResponse,
  ThreadDetail,
  ThreadSummary,
} from '../types/assistant';

/**
 * REST surface for the assistant. The live token stream is deliberately NOT
 * here -- axios cannot read an SSE body incrementally, so streaming lives in
 * `features/assistant/streamRun.ts`, which uses `fetch`.
 */
export const assistantApi = {
  // -- threads --
  listThreads: async (): Promise<ThreadSummary[]> => {
    const response = await api.get<ThreadSummary[]>(API_ENDPOINTS.ASSISTANT.THREADS);
    return response.data;
  },
  createThread: async (title?: string): Promise<ThreadSummary> => {
    const response = await api.post<ThreadSummary>(API_ENDPOINTS.ASSISTANT.THREADS, {
      title: title ?? null,
    });
    return response.data;
  },
  getThread: async (id: number): Promise<ThreadDetail> => {
    const response = await api.get<ThreadDetail>(API_ENDPOINTS.ASSISTANT.THREAD(id));
    return response.data;
  },
  renameThread: async (id: number, title: string): Promise<ThreadSummary> => {
    const response = await api.patch<ThreadSummary>(
      API_ENDPOINTS.ASSISTANT.THREAD(id),
      { title },
    );
    return response.data;
  },
  deleteThread: async (id: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.ASSISTANT.THREAD(id));
  },

  // -- messages --
  sendMessage: async (payload: SendMessagePayload): Promise<SendMessageResponse> => {
    const response = await api.post<SendMessageResponse>(
      API_ENDPOINTS.ASSISTANT.MESSAGES,
      payload,
    );
    return response.data;
  },

  // -- runs --
  getRun: async (id: number): Promise<RunResponse> => {
    const response = await api.get<RunResponse>(API_ENDPOINTS.ASSISTANT.RUN(id));
    return response.data;
  },
  cancelRun: async (id: number): Promise<{ cancelled: boolean }> => {
    const response = await api.post<{ cancelled: boolean }>(
      API_ENDPOINTS.ASSISTANT.RUN_CANCEL(id),
    );
    return response.data;
  },
};
