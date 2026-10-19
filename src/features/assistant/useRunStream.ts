import { useEffect, useReducer, useRef } from 'react';
import { openRunStream } from './streamRun';
import type { AgentEvent, Widget } from '../../types/assistant';

/**
 * Turns the raw `AgentEvent` stream into the flat state a view can render.
 *
 * The split mirrors `EVENT_CLASSES`:
 *  - ephemeral (`statusLabel`, `toolCalls`) is the agent's visible thinking;
 *    it is wiped the moment the run reaches a terminal state, because the
 *    server never persists it. A reloaded thread must read identically to one
 *    watched live.
 *  - transcript (`messages`, `widget`) is the actual reply. It stays until the
 *    caller swaps in the server-persisted copy (by refetching the thread).
 *
 * Unknown event types are ignored by the `default` branch on purpose: a newer
 * server emitting a new event is not an error here.
 */

export type RunPhase = 'idle' | 'streaming' | 'done' | 'error';

export interface LiveToolCall {
  id: string;
  label: string;
  toolName: string;
  /** undefined while running, then true/false. */
  ok?: boolean;
}

export interface LiveMessage {
  messageId: string;
  text: string;
  done: boolean;
}

export interface RunState {
  phase: RunPhase;
  /** Ephemeral one-liner: "Thinking…", "Writing…", a throttle notice. */
  statusLabel: string | null;
  /** Ephemeral tool-call chips. */
  toolCalls: LiveToolCall[];
  /** Streaming assistant text, in arrival order (usually one). */
  messages: LiveMessage[];
  /** A confirm-action (or future) widget the agent raised. */
  widget: Widget | null;
  errorMessage: string | null;
}

const INITIAL: RunState = {
  phase: 'idle',
  statusLabel: null,
  toolCalls: [],
  messages: [],
  widget: null,
  errorMessage: null,
};

const STATUS_LABELS: Record<string, string> = {
  thinking: 'Thinking…',
  generating: 'Writing…',
  throttled: 'Rate limited, retrying…',
};

type Action =
  | { kind: 'reset' }
  | { kind: 'event'; event: AgentEvent }
  | { kind: 'transport_error'; message: string };

function reduceEvent(state: RunState, event: AgentEvent): RunState {
  switch (event.type) {
    case 'run_started':
      return { ...state, phase: 'streaming' };

    case 'run_status': {
      const label =
        event.message ?? STATUS_LABELS[event.status] ?? event.status;
      return { ...state, phase: 'streaming', statusLabel: label };
    }

    case 'tool_call_start':
      return {
        ...state,
        toolCalls: [
          ...state.toolCalls,
          { id: event.tool_call_id, label: event.label, toolName: event.tool_name },
        ],
      };

    case 'tool_call_end':
      return {
        ...state,
        toolCalls: state.toolCalls.map((tc) =>
          tc.id === event.tool_call_id ? { ...tc, ok: event.ok } : tc,
        ),
      };

    case 'text_message_start':
      return {
        ...state,
        // Clear the status line once real text starts flowing.
        statusLabel: null,
        messages: [
          ...state.messages,
          { messageId: event.message_id, text: '', done: false },
        ],
      };

    case 'text_message_content':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.messageId === event.message_id
            ? { ...m, text: m.text + event.delta }
            : m,
        ),
      };

    case 'text_message_end':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.messageId === event.message_id ? { ...m, done: true } : m,
        ),
      };

    case 'widget':
      return { ...state, widget: event.widget };

    case 'run_finished':
      // Drop ephemerals; keep the transcript we just built.
      return { ...state, phase: 'done', statusLabel: null, toolCalls: [] };

    case 'run_error':
      return {
        ...state,
        phase: 'error',
        statusLabel: null,
        toolCalls: [],
        errorMessage: event.message,
      };

    default:
      // Unknown event type from a newer server: ignore, never throw.
      return state;
  }
}

function reducer(state: RunState, action: Action): RunState {
  switch (action.kind) {
    case 'reset':
      return INITIAL;
    case 'event':
      return reduceEvent(state, action.event);
    case 'transport_error':
      return {
        ...state,
        phase: 'error',
        statusLabel: null,
        toolCalls: [],
        errorMessage: action.message,
      };
    default:
      return state;
  }
}

export interface UseRunStreamOptions {
  /** The run to watch; `null` means nothing is streaming. */
  runId: number | null;
  /** Resume point when reattaching to an in-flight run. */
  startAfterSeq?: number;
  /** Fires once the run reaches any terminal state (finished, errored, fatal). */
  onComplete?: () => void;
}

export function useRunStream({
  runId,
  startAfterSeq = 0,
  onComplete,
}: UseRunStreamOptions): { state: RunState; reset: () => void } {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  // Keep the latest callback without retriggering the effect.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    if (runId == null) return;

    dispatch({ kind: 'reset' });

    const controller = openRunStream(
      runId,
      {
        onEvent: (event) => dispatch({ kind: 'event', event }),
        onComplete: () => onCompleteRef.current?.(),
        onError: (err) => {
          dispatch({ kind: 'transport_error', message: err.message });
          onCompleteRef.current?.();
        },
      },
      startAfterSeq,
    );

    return () => controller.close();
  }, [runId, startAfterSeq]);

  return { state, reset: () => dispatch({ kind: 'reset' }) };
}
