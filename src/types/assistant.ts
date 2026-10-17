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
  run_id: string;
  thread_id: string;
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

export const TERMINAL_EVENT_TYPES = ['run_finished', 'run_error'] as const;

export function isTerminalEvent(event: AgentEvent): boolean {
  return event.type === 'run_finished' || event.type === 'run_error';
}

// ============================================
// Requests
// ============================================

export interface SendMessagePayload {
  /** Existing thread to continue; omit to start a new one. */
  thread_id?: string;
  content: string;
}

export interface ActionDecisionPayload {
  decision: 'confirm' | 'cancel';
}
