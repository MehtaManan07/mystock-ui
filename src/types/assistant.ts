/**
 * Assistant streaming contract.
 *
 * Hand-mirrored from `mystock/app/modules/assistant/{events,widgets,schemas}.py`.
 * The server validates with pydantic; these are plain interfaces, matching how
 * the rest of the app treats API responses. We deliberately do not validate
 * these with zod — zod is used here only for form validation, and re-validating
 * a payload our own server already validated buys nothing.
 *
 * The real risk is version skew: Surge serves cached bundles, so an old client
 * can meet a newer server. That is handled by the `default:` branch rule below,
 * not by a schema.
 *
 * RULE: every `switch` over `AgentEvent['type']` must have a `default:` that
 * ignores the event silently. An unknown event is a newer server, not a bug.
 */

// ============================================
// Widgets
// ============================================

/**
 * Markdown handles all display. A widget exists only where the user has to act.
 * Today that is exactly one case: approving a write before it happens.
 */
export interface ConfirmActionField {
  label: string;
  value: string;
}

export interface ConfirmActionWidget {
  type: 'confirm_action';
  /** Opaque id of the staged action; echoed back with the decision. */
  action_id: string;
  title: string;
  fields: ConfirmActionField[];
  confirm_label: string;
  cancel_label: string;
  destructive: boolean;
}

export type Widget = ConfirmActionWidget;

// ============================================
// Event envelope
// ============================================

export interface BaseEvent {
  /** Monotonic within the run, starting at 1. */
  seq: number;
  /** Server emit time, ISO 8601 UTC. */
  ts: string;
}

// Lifecycle

export interface RunStartedEvent extends BaseEvent {
  type: 'run_started';
  run_id: number;
  thread_id: number;
}

export interface RunStatusEvent extends BaseEvent {
  type: 'run_status';
  status: 'thinking' | 'generating' | 'throttled';
  /** Shown verbatim to the user. */
  message?: string;
  /** Set when status is 'throttled'. */
  retry_in_seconds?: number;
}

/** Terminal. */
export interface RunFinishedEvent extends BaseEvent {
  type: 'run_finished';
}

/** Terminal. */
export interface RunErrorEvent extends BaseEvent {
  type: 'run_error';
  code: 'rate_limited' | 'upstream_error' | 'cancelled' | 'internal';
  message: string;
}

// Tool calls

export interface ToolCallStartEvent extends BaseEvent {
  type: 'tool_call_start';
  tool_call_id: string;
  tool_name: string;
  /** What the user sees, e.g. 'Looking up October expenses'. */
  label: string;
}

export interface ToolCallEndEvent extends BaseEvent {
  type: 'tool_call_end';
  tool_call_id: string;
  ok: boolean;
}

// Assistant message

export interface TextMessageStartEvent extends BaseEvent {
  type: 'text_message_start';
  /** Per-stream correlation handle for grouping deltas; not a database id. */
  message_id: string;
}

export interface TextMessageContentEvent extends BaseEvent {
  type: 'text_message_content';
  message_id: string;
  /** Append to the buffer for `message_id`. Markdown. */
  delta: string;
}

export interface TextMessageEndEvent extends BaseEvent {
  type: 'text_message_end';
  message_id: string;
}

// Widgets

export interface WidgetEvent extends BaseEvent {
  type: 'widget';
  widget: Widget;
}

export type AgentEvent =
  | RunStartedEvent
  | RunStatusEvent
  | ToolCallStartEvent
  | ToolCallEndEvent
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent
  | WidgetEvent
  | RunFinishedEvent
  | RunErrorEvent;

export type AgentEventType = AgentEvent['type'];

// ============================================
// What survives the run
// ============================================

export type EventClass =
  /** The agent's visible thinking. Discard when the run ends. */
  | 'ephemeral'
  /** The assistant's actual reply. The server persists these to the thread. */
  | 'transcript'
  /** Stream bookkeeping. Meaningful while connected, meaningless afterwards. */
  | 'control';

/**
 * Every event type classified exactly once.
 *
 * Keyed by `AgentEventType`, so adding an event to the union without
 * classifying it here is a compile error rather than an event that silently
 * renders as nothing. Mirrors `EVENT_CLASSES` in `events.py`.
 *
 * Why ephemeral events get dropped: the server never persists them, so a
 * reloaded conversation will not have them. Clearing them on `run_finished` is
 * what makes a thread read the same whether you watched it live or opened it an
 * hour later — otherwise a refresh silently changes the transcript.
 */
export const EVENT_CLASSES: Record<AgentEventType, EventClass> = {
  run_status: 'ephemeral',
  tool_call_start: 'ephemeral',
  tool_call_end: 'ephemeral',
  text_message_start: 'transcript',
  text_message_content: 'transcript',
  text_message_end: 'transcript',
  widget: 'transcript',
  run_started: 'control',
  run_finished: 'control',
  run_error: 'control',
};

export const TERMINAL_EVENT_TYPES = ['run_finished', 'run_error'] as const;

export function isTerminalEvent(event: AgentEvent): boolean {
  return event.type === 'run_finished' || event.type === 'run_error';
}

export function isEphemeralEvent(event: AgentEvent): boolean {
  return EVENT_CLASSES[event.type] === 'ephemeral';
}

// ============================================
// Requests
// ============================================

export interface SendMessagePayload {
  /** Existing thread to continue; omit to start a new one. */
  thread_id?: number;
  content: string;
}

export interface ActionDecisionPayload {
  decision: 'confirm' | 'cancel';
}

// ============================================
// REST responses
// ============================================

/**
 * Mirrors `schemas.py`. These are the durable shapes the REST endpoints
 * return; the streaming `AgentEvent`s above are the live shapes. A finished
 * run's reply shows up here as an assistant `MessageResponse`.
 */

export interface MessageResponse {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  /** Present only on turns that produced a widget. */
  widget?: Widget | null;
  created_at: string;
}

export interface ThreadSummary {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ThreadDetail extends ThreadSummary {
  messages: MessageResponse[];
}

export type RunStatus =
  | 'running'
  | 'completed'
  | 'cancelled'
  | 'failed'
  | 'interrupted';

export interface RunResponse {
  id: number;
  thread_id: number;
  status: RunStatus;
  /** Safe to show the user; raw exceptions never cross the wire. */
  error_code?: string | null;
  error_message?: string | null;
  created_at: string;
  finished_at?: string | null;
}

/**
 * The reply to POST /messages. `run_id` arrives before a single token exists;
 * open the stream with it. `thread_id` is echoed because the request may have
 * created the thread.
 */
export interface SendMessageResponse {
  thread_id: number;
  run_id: number;
  message: MessageResponse;
}
