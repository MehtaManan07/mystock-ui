import { API_BASE_URL } from '../../constants';
import { useAuthStore } from '../../stores/authStore';
import { isTerminalEvent, type AgentEvent } from '../../types/assistant';

/**
 * Live run stream over SSE.
 *
 * `EventSource` is not usable here: it cannot send an `Authorization` header,
 * and this app authenticates with a Bearer token, not a cookie. So we read the
 * `text/event-stream` body ourselves with `fetch` + a `ReadableStream` reader.
 *
 * What this guarantees:
 *  - Auth: the same Bearer token axios uses.
 *  - Resume: every reconnect sends `Last-Event-ID` (and `after_seq`) so the
 *    server replays only what was missed. Event `seq` is monotonic from 1.
 *  - Heartbeats: SSE comment frames (`: keepalive`) are skipped silently.
 *  - Reconnect: a dropped connection before a terminal event reconnects with
 *    backoff; a terminal event (`run_finished` / `run_error`) ends cleanly with
 *    no reconnect. 401/403/404 are fatal.
 *  - Forward-compat: a frame that will not parse is ignored, never thrown.
 */

export interface RunStreamHandlers {
  onEvent: (event: AgentEvent) => void;
  /** A terminal event was received; the run is over. */
  onComplete: () => void;
  /** Unrecoverable transport failure (auth, missing run, aborted retries). */
  onError: (error: Error) => void;
}

export interface RunStreamController {
  close: () => void;
}

class FatalStreamError extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseFrame(frame: string): AgentEvent | null {
  // One SSE frame -> the JSON on its `data:` line(s). Comment lines (starting
  // with ':', e.g. the heartbeat) and the `id:` line are ignored; we trust the
  // `seq` inside the payload, which carries the same value as `id:`.
  let data = '';
  for (const rawLine of frame.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    if (!line || line.startsWith(':')) continue;
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    if (field !== 'data') continue;
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    data += data ? `\n${value}` : value;
  }
  if (!data) return null;
  try {
    return JSON.parse(data) as AgentEvent;
  } catch {
    return null;
  }
}

export function openRunStream(
  runId: number,
  handlers: RunStreamHandlers,
  startAfterSeq = 0,
): RunStreamController {
  const ac = new AbortController();
  let closed = false;
  let lastSeq = startAfterSeq;

  async function connectOnce(): Promise<'terminal' | 'disconnected'> {
    const token = useAuthStore.getState().token;
    const url = `${API_BASE_URL}/assistant/runs/${runId}/stream?after_seq=${lastSeq}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(lastSeq > 0 ? { 'Last-Event-ID': String(lastSeq) } : {}),
      },
      signal: ac.signal,
    });

    if (res.status === 401 || res.status === 403) {
      throw new FatalStreamError('Your session expired. Please sign in again.');
    }
    if (res.status === 404) {
      throw new FatalStreamError('This run no longer exists.');
    }
    if (!res.ok || !res.body) {
      // Retryable: a transient 5xx or a proxy hiccup.
      throw new Error(`Stream failed (${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    for (;;) {
      const { value, done } = await reader.read();
      if (done) return 'disconnected';
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const event = parseFrame(frame);
        if (!event) continue;
        lastSeq = Math.max(lastSeq, event.seq);
        handlers.onEvent(event);
        if (isTerminalEvent(event)) return 'terminal';
      }
    }
  }

  (async () => {
    let backoff = 500;
    while (!closed) {
      try {
        const outcome = await connectOnce();
        if (closed) return;
        if (outcome === 'terminal') {
          handlers.onComplete();
          return;
        }
        // Clean disconnect without a terminal event: the run is still going,
        // reconnect promptly and replay from lastSeq.
        backoff = 500;
        await sleep(300);
      } catch (err) {
        if (closed || ac.signal.aborted) return;
        if (err instanceof FatalStreamError) {
          handlers.onError(err);
          return;
        }
        // Network blip: back off and retry; the server holds a finished run's
        // backlog, so even a long outage still resolves to the real ending.
        await sleep(backoff);
        backoff = Math.min(backoff * 2, 5000);
      }
    }
  })();

  return {
    close: () => {
      closed = true;
      ac.abort();
    },
  };
}
