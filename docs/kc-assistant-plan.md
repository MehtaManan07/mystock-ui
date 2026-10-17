# KC Assistant — Phased Delivery Plan

**Status:** plan, not yet started
**Date:** 17 October 2026
**Sequencing:** expenses → inventory → billing
**Companion docs:** `kc-assistant-prd.md` (scope), `kc-assistant-cost-model.md` (economics)

---

## 1. The sequencing decision, and why

| Vertical | When | Why there |
|---|---|---|
| **Expenses / payments** | Now | Lowest blast radius. A wrong row is deleted in one click. Rich natural-language value (dates, amounts, categories). 5.95% of Groq's free ceiling. |
| **Inventory** | After expenses | Same write-confirmation machinery, one step more consequential (stock counts feed billing). Proves the Phase-2 spine generalises. |
| **Billing** | Deferred | Highest blast radius — GST, HSN, tax type, legal documents. ~770h. Throttles on free tier. Should not be attempted until model reliability is a known quantity. |

Cost is **not** a factor in this ordering. All three are effectively free
(see cost model). The ordering is purely about **blast radius** and **learning cheaply**.

---

## 2. Architecture — the spine built once, reused three times

```
User types  ──►  POST /api/assistant/chat
                      │
                      ▼
            ┌─────────────────────┐
            │     agent loop      │  max N iterations, token-capped
            │  (assistant/loop.py)│
            └─────────┬───────────┘
                      │  model wants a tool
                      ▼
            ┌─────────────────────┐
            │   tool registry     │  read tools → execute, loop continues
            │ (assistant/tools/)  │  propose_* → TERMINATE
            └─────────┬───────────┘
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
   existing services        pending_actions row
   (PaymentsService …)      + confirm_action widget
                                   │
                            owner clicks Confirm
                                   │
                                   ▼
                   POST /assistant/actions/{id}/confirm
                   server re-reads ITS OWN payload,
                   validates, calls the existing service
```

**The single most important property:** the model never reaches a write. It emits a
*proposal*; the loop ends; the server owns everything after that. The text channel and
the execution channel are physically separate code paths.

### 2.1 Backend layout

```
app/modules/assistant/
  models.py       Conversation, Message, AgentRun, PendingAction
  schemas.py      ChatRequest/Response, Widget discriminated union
  router.py       /assistant/chat, /assistant/actions/{id}/confirm|reject
  service.py      orchestration entry point
  loop.py         the ~60-line while loop
  prompts.py      versioned system prompts
  registry.py     @tool decorator, JSON-schema generation from pydantic
  llm/
    base.py       LLMClient protocol + Message/ToolCall/Usage dataclasses
    openai_compat.py   one client; works for Groq today, Gemini later
  tools/
    payments.py   list_payments, summarise_payments, propose_payment
    inventory.py  (phase 6+)
    common.py     needs_input
```

Follows the existing module convention exactly: `models / schemas / router / service`,
static-method service classes, pydantic DTOs, `require_admin_or_staff` dependencies.

**Zero new backend dependencies.** `httpx` is already in `requirements.txt` and Groq
speaks the OpenAI-compatible REST protocol. No vendor SDK, no agent framework. If and
when a framework earns its place, the tools are already framework-agnostic.

### 2.2 Frontend layout

```
src/features/assistant/
  AssistantDrawer.tsx
  widgets/
    index.ts              Record<Widget['type'], FC>  — the registry
    TextWidget.tsx  PaymentListWidget.tsx  PaymentSummaryWidget.tsx
    NeedsInputWidget.tsx  ConfirmActionWidget.tsx  ActionResultWidget.tsx
  schemas.ts              zod discriminated union, mirrors backend
src/api/assistant.api.ts
src/hooks/useAssistant.ts
src/types/assistant.ts
```

The agent emits **data only** — never layout, never MUI props. An unknown widget type
degrades to plain text rather than crashing, so a backend deploy can never white-screen
the UI.

---

## 3. Hard rules

Non-negotiable, derived from the cost model and PRD §7.

| # | Rule | Why |
|---|---|---|
| R1 | **Tools take lists, not single items.** `get_stock(product_ids[])`, never `get_stock(product_id)` | Cost model §8: 5.6× on Gemini; on Groq free the naive shape makes a single call exceed the per-minute cap and it can *never* succeed |
| R2 | **Never put the product catalogue, SKU table or container list in context** | 7,590 / 5,595 / 2,058 tokens, re-billed every iteration. Matching happens inside the tool; model sees ranked candidates only |
| R3 | **Cap retained history** | A follow-up question already measures 96% of Groq's 8K TPM. Unbounded history produces mystery 429s |
| R4 | **The loop terminates at `propose_*`** | The write is outside the loop. Safety first; it also halves the cost of a write |
| R5 | **Tools call existing services, never raw SQL** | `AGENTS.md`: tax/inventory/balance logic must not be reimplemented |
| R6 | **Log input/output/total tokens + model per call from commit one** | Cost model §11: query volume is the weakest assumption in the whole analysis and only telemetry fixes it |
| R7 | **Hard `max_iterations` cap and a per-run token ceiling** | An agent that cannot stop is the only realistic path to a surprising bill or a wedged request |
| R8 | **Confirm endpoint re-reads the server's own stored payload** | The client sends only an ID. Nothing the model produced is trusted at write time |

---

## 4. Phase 0 — decide before writing code

Small, but each unblocks a later phase.

- **Verify Groq's free-tier data-retention terms.** Payloads carry customer GSTINs and
  addresses. Free ≠ private. Blocks any real data going through.
- **Confirm the limits on your own account** (`console.groq.com/settings/limits`) match
  the published Free plan: 30 RPM / 1K RPD / 8K TPM / 200K TPD.
- **Pick the model.** `openai/gpt-oss-120b`, `openai/gpt-oss-20b` and `qwen/qwen3.8-27b`
  have *identical* limits, so start with the strongest (120b) and only move down if
  latency disappoints.
- **Decide reasoning effort.** gpt-oss exposes a reasoning setting and those tokens
  count against TPM. Start low/medium for expenses.
- **Decide where the key lives.** Backend env only. It must never reach the browser —
  all model calls are server-side.

---

## 5. The phases

### Phase 1 — Spike: does it actually work? *(no DB, no UI, no writes)*

**Goal:** answer the only question that matters before investing — *can gpt-oss-120b
reliably call our tools with correct arguments on our real data?*

Build the Groq client, the tool registry, the loop, two read-only tools
(`list_payments`, `summarise_payments`) and a CLI harness. No migration. No frontend.
Token usage printed per call.

**Exit criteria**
- `python -m scripts.assistant_repl` answers "how much did I spend on transport last
  quarter?" against live Turso data
- 20-case eval fixture passes ≥ 85% on *tool choice*, 100% on *never inventing a number*
- Measured tokens per turn are within 25% of the cost model's prediction

**If this fails, stop.** Everything downstream assumes the model can do this. Failing
here costs days, not months — which is the entire point of ordering it first.

---

### Phase 2 — Persistence and the chat endpoint *(backend)*

Migration `0017_assistant_core`: `assistant_conversations`, `assistant_messages`,
`assistant_runs`. `POST /api/assistant/chat` behind `require_admin_or_staff`, history
capping (R3), per-run token ceiling (R7), full telemetry (R6).

**Exit:** a multi-turn conversation survives a server restart; every call's token usage
is queryable in `assistant_runs`.

---

### Phase 3 — Agentic UI, read-only *(frontend)*

Widget contract as a zod discriminated union mirrored from pydantic. Registry-based
renderer. Drawer accessible from anywhere in the app. Four widgets: `text`,
`payment_list`, `payment_summary`, `needs_input`.

**Exit:** the owner can ask expense questions from the UI and get rendered tables, not
markdown. An unknown widget type renders as text rather than crashing.

---

### Phase 4 — The write boundary *(the keystone phase)*

Migration `0018_assistant_pending_actions`. `propose_payment` as a **terminal** tool.
`POST /assistant/actions/{id}/confirm` and `/reject`. `confirm_action` and
`action_result` widgets. Idempotency key, expiry, full audit of who confirmed what.

This phase is the reusable spine. Inventory and, eventually, billing re-use it unchanged
— which is the real return on building it carefully.

**Exit:** "paid 4,500 for electricity yesterday by UPI" produces a confirmation card;
confirming creates exactly one payment row; double-clicking Confirm creates exactly one
row; an expired action cannot be confirmed; the audit trail shows the full chain.

---

### Phase 5 — Expense fluency

`propose_payment_update`, `propose_payment_delete`, period comparisons, category
suggestions learned from the owner's own history. This is where it stops being a demo
and starts saving time.

**Exit:** the owner records a week of expenses conversationally without touching the form.

---

### Phase 6 — Inventory, read-only

`find_products` (server-side matching, R2), `get_stock(product_ids[])` (R1),
`list_low_stock`, `get_stock_movements`. Widgets: `stock_list`, `stock_movement_list`.

**Exit:** "how many Meena Mor 1x2 are left and where?" answers correctly, with the
catalogue never entering context.

---

### Phase 7 — Inventory writes

`propose_stock_adjustment` through the Phase-4 machinery, calling the existing inventory
service. Nothing new architecturally — and if that turns out to be true in practice,
Phase 4 was built correctly.

**Exit:** a stock addition flows proposal → confirm → `inventory_log` row, with the
existing service as the only writer.

---

### Phase 8 — Hardening

Eval suite grown to ~60 cases across both domains, run on every prompt change. Prompt
versioning tied to `assistant_runs` so a regression is traceable to a specific prompt.
Per-user rate limiting. Graceful 429 handling with backoff. A kill switch
(`ASSISTANT_ENABLED=false`).

**Exit:** a prompt change that breaks date parsing is caught by evals, not by the owner.

---

### Phase 9+ — Billing *(explicitly out of scope)*

Revisit only when: the eval suite has been stable for a sustained period, inventory
writes have run in production without incident, and the model has demonstrated it can
match SKUs and derive tax type reliably. At that point re-read the cost model — billing
on free tier throttles to ~2 min/bill, and paid Gemini is ₹2.07/bill, so the decision
will be about reliability, not money.

---

## 6. Schema additions

Four tables, two migrations. Everything additive; no existing table is modified.

**`0017_assistant_core`**

| Table | Purpose | Key columns |
|---|---|---|
| `assistant_conversations` | A chat thread | `user_id`, `title` |
| `assistant_messages` | Turns | `conversation_id`, `role`, `content`, `widgets_json`, `tool_call_id` |
| `assistant_runs` | One loop execution — **telemetry** | `model`, `prompt_version`, `iterations`, `input_tokens`, `output_tokens`, `latency_ms`, `finish_reason`, `error` |

**`0018_assistant_pending_actions`**

| Table | Purpose | Key columns |
|---|---|---|
| `assistant_pending_actions` | The write boundary | `action_type`, `payload_json`, `status`, `idempotency_key` (unique), `expires_at`, `decided_at`, `decided_by`, `result_type`, `result_id` |

Total: **16 existing tables → 20**.

---

## 7. Explicitly not in scope

Saying these out loud now prevents scope drift later.

- Multi-agent systems, planner/executor splits, agent-to-agent delegation
- Vector database or semantic search over products — SQL matching is correct here
- LangGraph or any agent framework (revisit only when a concrete pain is *felt*)
- Streaming widgets — stream text if desired; widgets render on validated complete results
- Voice input
- Letting the agent write anything without owner confirmation
- Billing, invoices, GST, drafts, PDF generation

---

## 8. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| gpt-oss-120b unreliable at tool calling on our data | Medium | Phase 1 is designed to find this out in days |
| Groq free tier trains on our data | **Unknown — verify first** | Phase 0 blocker; fall back to paid Gemini at ₹88/mo |
| Groq changes free limits or deprecates models | Medium | `LLMClient` protocol + OpenAI-compatible wire format makes the swap a config change |
| History growth causes mystery 429s | High if unmanaged | R3, enforced in Phase 2, measured by R6 |
| Date parsing errors ("3rd", "last Tuesday") | High | Eval fixtures from real phrasings; `needs_input` instead of guessing |
| Scope drift into billing | **High** | §7, and the phase gates |

---

## 9. What success looks like

**After Phase 5:** the owner records expenses by typing a sentence, and asks questions
that previously meant building a filter in the UI.

**After Phase 7:** the same for stock.

**Underneath both:** a tool layer, a confirmation spine and an eval suite that make
billing a *scoping* question rather than a *research* question — which is the actual
deliverable of this whole exercise.
