import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../constants';
import type { ThreadSummary } from '../../types/assistant';
import {
  useCancelRun,
  useDeleteThread,
  useRenameThread,
  useSendMessage,
  useThread,
  useThreads,
} from '../../hooks/useAssistant';
import { useRunStream } from './useRunStream';
import ThreadList from './ThreadList';
import Conversation from './Conversation';

// Mirrors `derive_title` / thread-title rules in the backend
// (services/_common.py, services/message.py) so the optimistic sidebar row
// matches what the server will persist. The invalidate in useSendMessage then
// reconciles anything we got slightly wrong (e.g. exact timestamps).
const DEFAULT_THREAD_TITLE = 'New chat';
const MAX_TITLE_LENGTH = 120;

function deriveTitle(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return DEFAULT_THREAD_TITLE;
  if (cleaned.length <= MAX_TITLE_LENGTH) return cleaned;
  return cleaned.slice(0, MAX_TITLE_LENGTH - 1).replace(/\s+$/, '') + '\u2026';
}

/**
 * Two-pane assistant surface. This component owns the cross-cutting state the
 * two panes share: which thread is active and which run is streaming. The panes
 * themselves are presentational.
 *
 * The one subtle flow is sending a message:
 *   1. POST /messages -> { thread_id, run_id, message }.
 *   2. Adopt thread_id (it may be freshly created) and optimistically drop the
 *      user's message into the thread cache so it shows instantly.
 *   3. Open the stream on run_id; the reducer builds the assistant reply live.
 *   4. On terminal, refetch the thread to pick up the persisted reply, then
 *      reset the live buffer so nothing is shown twice.
 */
export default function AssistantPage() {
  const queryClient = useQueryClient();

  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [runId, setRunId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  // The user's message, shown instantly on send and held until the persisted
  // copy lands. The DB is remote (GCP over the tunnel), so the POST round-trip
  // is slow; this is what makes your own message appear immediately.
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const threadsQuery = useThreads();
  const threadQuery = useThread(activeThreadId ?? undefined);
  const sendMessage = useSendMessage();
  const renameThread = useRenameThread();
  const deleteThread = useDeleteThread();
  const cancelRun = useCancelRun();

  // Latest-value closure for the stream's terminal callback.
  const onCompleteRef = useRef<() => void>(() => {});
  const { state: runState, reset } = useRunStream({
    runId,
    onComplete: () => onCompleteRef.current(),
  });

  useEffect(() => {
    onCompleteRef.current = async () => {
      if (activeThreadId != null) {
        await queryClient.refetchQueries({
          queryKey: QUERY_KEYS.ASSISTANT_THREAD(activeThreadId),
        });
      }
      // The refetched thread now holds the persisted user + assistant turn, so
      // drop the live buffer and the pending echo together — no double render.
      reset();
      setPendingMessage(null);
      setRunId(null);
    };
  });

  const isRunning = runId != null;

  const handleNewChat = () => {
    if (isRunning) return;
    setActiveThreadId(null);
    reset();
    setPendingMessage(null);
    setInput('');
  };

  const handleSelectThread = (id: number) => {
    if (id === activeThreadId || isRunning) return;
    setActiveThreadId(id);
    reset();
    setPendingMessage(null);
    setInput('');
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isRunning) return;

    // Echo instantly — before the (remote, slow) POST — so the bubble appears
    // the moment you hit send. Held until onComplete swaps in the real copy.
    setInput('');
    setPendingMessage(content);

    try {
      const res = await sendMessage.mutateAsync({
        thread_id: activeThreadId ?? undefined,
        content,
      });

      if (activeThreadId == null) setActiveThreadId(res.thread_id);

      // Optimistically update the thread list to reflect the new message: bump
      // the touched thread to the top (the list is ordered by updated_at desc),
      // set its title from the first message, or prepend a brand-new row.
      const now = new Date().toISOString();
      queryClient.setQueryData<ThreadSummary[]>(
        QUERY_KEYS.ASSISTANT_THREADS,
        (old) => {
          const list = old ?? [];
          const existing = list.find((t) => t.id === res.thread_id);
          if (existing) {
            const bumped: ThreadSummary = {
              ...existing,
              updated_at: now,
              title:
                existing.title === DEFAULT_THREAD_TITLE
                  ? deriveTitle(content)
                  : existing.title,
            };
            return [bumped, ...list.filter((t) => t.id !== res.thread_id)];
          }
          const created: ThreadSummary = {
            id: res.thread_id,
            title: deriveTitle(content),
            created_at: now,
            updated_at: now,
          };
          return [created, ...list];
        },
      );

      setRunId(res.run_id);
    } catch {
      // useSendMessage surfaces the toast; nothing was persisted, so pull the
      // echo back and restore the draft.
      setPendingMessage(null);
      setInput(content);
    }
  };

  const handleCancel = () => {
    if (runId != null) cancelRun.mutate(runId);
  };

  return (
    <div className="flex h-[calc(100vh-112px)] gap-4">
      <div className="w-70 shrink-0 overflow-hidden rounded-lg border bg-card">
        <ThreadList
          threads={threadsQuery.data ?? []}
          activeThreadId={activeThreadId}
          loading={threadsQuery.isLoading}
          onSelect={handleSelectThread}
          onNew={handleNewChat}
          onRename={(id, title) => renameThread.mutate({ id, title })}
          onDelete={(id) => {
            deleteThread.mutate(id);
            if (id === activeThreadId) handleNewChat();
          }}
        />
      </div>

      <div className="flex-1 overflow-hidden rounded-lg border bg-card">
        <Conversation
          messages={threadQuery.data?.messages ?? []}
          pendingMessage={pendingMessage}
          liveMessages={runState.messages}
          statusLabel={runState.statusLabel}
          toolCalls={runState.toolCalls}
          liveWidget={runState.widget}
          errorMessage={runState.errorMessage}
          isRunning={isRunning}
          threadLoading={activeThreadId != null && threadQuery.isLoading}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
