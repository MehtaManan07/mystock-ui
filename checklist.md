# Assistant frontend — build checklist

Chat surface in `mystock-ui` that consumes `/api/assistant`. Backend is built,
migrated and verified. The LLM is stubbed, so today a run streams canned text;
widgets/tool-calls are in the typed contract but not yet produced by the agent.
Build them anyway so the UI is ready when the real agent lands.

Conventions to follow (observed in repo):
- `src/types/<x>.ts` types · `src/api/<x>.api.ts` axios module · `src/hooks/useX.ts`
  react-query · `src/features/<x>/` pages/components · constants hold endpoints +
  query keys · nav in `MainLayout.tsx` · routes in `routes/index.tsx`.
- Auth is Bearer from `useAuthStore`. Errors via `useNotificationStore`.

Key decisions (confirm before/at Phase 2):
- [x] **Layout**: two-pane (thread sidebar + conversation), ChatGPT-style. *(default)*
- [x] **Markdown**: assistant content is Markdown → add `react-markdown` (+`remark-gfm`).
      This is a dependency add. Alternative: render preformatted text. *(default: add it)*
- Confirm-action widget: component built, but the decision POST endpoint does
  **not** exist server-side yet — render read-only / disabled until it does.

---

## Phase 0 — Foundations (no UI)
- [x] Extend `src/types/assistant.ts`: REST types `MessageResponse`, `ThreadSummary`,
      `ThreadDetail`, `RunResponse`, `SendMessageResponse` (mirror `schemas.py`).
- [x] `constants`: add `API_ENDPOINTS.ASSISTANT` + `QUERY_KEY_BASE.ASSISTANT*` + `QUERY_KEYS`.
- [x] `src/api/assistant.api.ts`: threads list/create/get/rename/delete, send message, run get/cancel.
- [x] `src/features/assistant/streamRun.ts`: fetch-based SSE reader — Bearer auth,
      `Last-Event-ID` resume, heartbeat (`:` comment) skip, abort, auto-reconnect
      until terminal, `default`-ignore unknown events.

## Phase 1 — Live run state
- [x] `src/features/assistant/useRunStream.ts`: reducer AgentEvent[] → render state
      (status line, streaming text buffer keyed by message_id, tool chips, pending
      widget, terminal/error). Unknown event = ignore.
- [x] `src/hooks/useAssistant.ts`: `useThreads`, `useThread`, `useSendMessage`,
      `useRenameThread`, `useDeleteThread`, `useCancelRun` + cache invalidation.

## Phase 2 — UI components (`src/features/assistant/`)
- [x] `AssistantPage.tsx` — two-pane shell.
- [x] `ThreadList.tsx` — list, New chat, select, rename, delete.
- [x] `Conversation.tsx` — history + live bubble + status line + composer; autoscroll.
- [x] `MessageBubble.tsx` — user/assistant; markdown per decision.
- [x] `Composer.tsx` — input, send (Enter), disabled while running, Cancel button.
- [x] `RunStatusLine.tsx` / `ToolCallChips.tsx` — ephemeral indicators.
- [x] `ConfirmActionWidget.tsx` — render fields + confirm/cancel (disabled; no endpoint).

## Phase 3 — Wiring
- [x] Add lazy `/assistant` route in `routes/index.tsx`.
- [x] Add nav item in `MainLayout.tsx` (e.g. AutoAwesome icon, "Assistant").
- [x] Markdown dependency per decision.

## Phase 4 — Validation
- [x] `npx tsc -b` clean.
- [x] `vite build` clean + eslint.
- [ ] Manual end-to-end over the tunnel (ASK before running dev server/tests).
- [ ] Review gate: stop, do not commit until approved.
