# KC Assistant — Inference Cost Model

**Status:** working document
**Date:** 17 October 2026
**Scope:** token cost of running the KC Assistant on Gemini via Google AI Studio keys
**Covers:** the expenses/payments agent (first vertical) and the billing agent (later)

---

## 0. TL;DR

| | Flash-Lite | Flash (today) | Flash (Jan-2027) | Pro (today) |
|---|---|---|---|---|
| **Per month** | ₹47 | **₹88** | ₹175 | ₹234 |
| **Per year** | ₹560 | **₹1,051** | ₹2,103 | ₹2,804 |
| With prefix caching | ₹37/mo | **₹64/mo** | ₹128/mo | ₹168/mo |

At measured KC volumes the whole assistant — expenses, queries, stock and billing —
costs about **₹88 a month**. One sale transaction averages ₹12,298, so a month of
inference is roughly **0.7% of one average bill**.

Two things in this document actually matter. Everything else is rounding:

1. **Tool granularity.** Resolving order lines one-at-a-time instead of in a batch
   costs ₹11.65 per bill instead of ₹2.07 — a **5.6×** difference, and the single
   largest cost decision in the system. (§8)
2. **Development burn is larger than production.** Building the thing will cost more
   tokens than the first several years of running it. (§10)

---

## 1. How LLM billing actually works

Four facts. Everything downstream is arithmetic on these.

**1. You are billed per model call, not per task.**
A "task" like *record this expense* may be one call or twenty-three. The call count is
decided by your tool design, not by the user's request.

**2. Every call is billed on the entire context you send.**
There is no server-side memory between calls. To let the model see turn 3, you resend
turns 1 and 2. A 5-call loop does not bill 5 messages; it bills message 1 five times,
message 2 four times, and so on. This is the single most counter-intuitive part of the
cost model and the reason long loops get expensive non-linearly.

**3. Input and output are priced differently — output is ~5× input.**

| Model | Input /1M | Output /1M | Cached input /1M |
|---|---|---|---|
| Flash-Lite | $0.30 | $2.50 | $0.03 |
| Gemini 3 Flash | $0.75 | $3.75 | $0.075 |
| Gemini 3 Flash *(from 1-Jan-2027)* | $1.50 | $7.50 | $0.15 |
| Gemini 3 Pro | $2.00 | $10.00 | $0.10 |
| Gemini 3 Pro *(from 1-Dec-2026)* | $4.00 | $20.00 | $0.20 |

**4. Thinking tokens are billed as output.**
Gemini 3 emits internal reasoning before its answer. You never see those tokens, they
are not retained in history, and you pay the full output rate for them. A reply that
*looks* like 40 tokens of text may have cost 400. In this model thinking is an explicit
parameter: 180 tokens for routine steps, 400 for moderate, 900 for tax/pricing
reasoning.

> **Free tier is excluded from this document.** Gemini's free tier grants Google the
> right to train on submitted data. KC data is customer GSTINs, addresses and financial
> records. PRD §7 already requires approving provider data-retention terms. Paid tier only.

---

## 2. What one "turn" actually costs

A turn is: one user message → one final answer. Inside it, the loop runs.

For a turn with calls 1..n, where `P` is the system prompt + tool schemas, `U` is the
user message, `Oᵢ` is what the model emitted at step i, and `Rᵢ` is the tool result:

```
billed_input(call i)  = P + U + Σ(j<i) (Oⱼ + Rⱼ)
billed_output(call i) = thinkingᵢ + Oᵢ

turn_input  = Σᵢ billed_input(i)      ← P and U are billed n times
turn_output = Σᵢ billed_output(i)
```

Note `P` is multiplied by `n`. With a 2,153-token billing preamble and a 23-call loop
you have paid for the system prompt **23 times** before anything else is counted. This
is why §8 matters so much, and why caching (§9) is worth wiring.

---

## 3. Measured inputs

Nothing below is estimated. Prompts were written out in full and tokenised; payloads
were serialised from the live Turso database.

### 3.1 Preamble (resent on every single call)

| Component | Tokens |
|---|---|
| Expenses system prompt | 553 |
| Expenses tool schemas (4 tools) | 709 |
| **Expenses preamble `P`** | **1,262** |
| + billing rules (GST, SKU matching, rounding) | 364 |
| + billing tool schemas (5 more tools) | 527 |
| **Billing preamble `P`** | **2,153** |

### 3.2 Real data payloads

| Tool result | Rows | Tokens |
|---|---|---|
| One payment record | 1 | 37 |
| Contacts list (entire) | 6 | 298 |
| `list_payments` default page | 10 | 359 |
| 20 line items of a real sale | 20 | 783 |
| `list_payments` max page | 50 | 1,759 |
| Containers (entire) | 137 | 2,058 |
| Customer SKU aliases (entire) | 80 | 5,595 |
| Product catalogue, lean (`id,name,size`) | 343 | 7,590 |
| Product catalogue, billing fields | 343 | 14,902 |

**The product catalogue must never enter context.** At 7,590–14,902 tokens it would
dominate every billing call and be re-billed once per loop step. Product matching has
to happen **server-side inside the tool** and return only ranked candidates. This is a
hard architectural constraint, not an optimisation.

---

## 4. Cost per action

`calls` is loop iterations. Input/output are totals across the whole turn.

| Action | Calls | Input tok | Output tok | Flash | Flash-Lite |
|---|---|---|---|---|---|
| Record a payment (clean) | 1 | 1,344 | 275 | **₹0.18** | ₹0.10 |
| Record a payment (one clarification) | 2 | 2,794 | 565 | ₹0.37 | ₹0.20 |
| Question — aggregate ("spend on transport?") | 2 | 2,802 | 605 | ₹0.38 | ₹0.21 |
| Question — list ("show last month") | 2 | 4,481 | 560 | ₹0.48 | ₹0.24 |
| Follow-up question (history carried) | 2 | 7,143 | 550 | ₹0.65 | ₹0.31 |
| Manual stock adjustment | 2 | 4,846 | 540 | ₹0.50 | ₹0.25 |
| **Bill, 20 lines — batched tools** | 3 | 13,619 | 3,540 | **₹2.07** | ₹1.14 |
| Bill, 20 lines — 3 lines unresolved | 4 | 19,972 | 4,120 | ₹2.68 | ₹1.43 |
| **Bill, 20 lines — naive per-line tools** | 23 | 136,169 | 8,060 | **₹11.65** | ₹5.37 |

Three things worth reading off this table:

- **Recording an expense is one call, not two.** The loop *terminates* at
  `propose_payment`. The server renders the confirmation card and, after the owner
  confirms, writes the row — no model involved. The write is outside the loop. That
  design choice is there for safety, and it halves the cost as a side effect.
- **A follow-up costs 60% more than the original question** (₹0.65 vs ₹0.38) purely
  because the earlier turn is resent. Conversation history is not free.
- **One naive bill costs more than 60 expense records.**

---

## 5. Real KC volumes

Measured from Turso on 17-Oct-2026, not assumed.

| Activity | Evidence | Per month |
|---|---|---|
| Payments recorded | 250 rows, Jan–Sep 2026 | **27.8** |
| Sale transactions | 47 rows, Feb–Sep (May = 0) | **5.9** |
| Standalone PDF invoices | 17 in Sep; 9 in first 17 days of Oct | **~17** |
| Manual stock adjustments | 123 `added` rows Feb–Oct, excl. Jan bulk import | **~14** |
| Questions asked of the assistant | *no evidence — new behaviour* | **50 (assumed)** |

Notes on the data:

- Jan-2026 had 636 `added` inventory rows — the initial catalogue import. Excluded as a
  one-off, since including it would triple the stock-action estimate.
- Of 1,689 `inventory_log` rows, 927 are `sale` rows auto-generated by transactions.
  Those are *not* separate agent actions and are excluded. Only 3 rows are `removed`.
- **Bills/month = 5.9 sales + 17 PDF invoices ≈ 23.** My earlier guess of 20 orders was
  coincidentally close, but for the wrong reason: I assumed 20 sales. Actual sales are
  ~6; the volume is in standalone PDF invoices, which began in September.
- The 50 queries/month is the **only** unmeasured figure, and it is a guess about
  behaviour that does not exist yet. See §11.

---

## 6. Monthly totals

Mix used: 28 payments (75% clean, 25% needing a clarification), 50 questions
(30 aggregate / 12 list / 8 follow-up), 14 stock actions, 23 bills (70% clean,
30% with unresolved lines), all billing on batched tools.

**238 model calls/month · 667,674 input tokens · 131,982 output tokens**

| Model | Per month | Per year |
|---|---|---|
| Flash-Lite | ₹47 | ₹560 |
| **Gemini 3 Flash** | **₹88** | **₹1,051** |
| Gemini 3 Flash, from Jan-2027 | ₹175 | ₹2,103 |
| Gemini 3 Pro | ₹234 | ₹2,804 |
| Gemini 3 Pro, from Dec-2026 | ₹467 | ₹5,608 |

### Anchors

| | |
|---|---|
| Cost per bill produced | ₹2.07 |
| As a share of the average ₹12,298 sale | **0.017%** |
| Cost per expense recorded | ₹0.18 |
| Monthly cost vs. monthly sale value (₹55,339 via transactions) | **0.16%** |
| A full year of Flash | less than **one tenth** of one average bill |

Since Turso, Surge and DuckDNS are all on free tiers, this would be KC's first real
recurring bill. It is still small — but it is not "noise against existing spend",
because there is no existing spend.

---

## 7. Where the money actually goes

| Action family | ₹/month | Share |
|---|---|---|
| Bills (clean) | 33.3 | 38.0% |
| Bills (unresolved lines) | 18.5 | 21.1% |
| Questions — aggregate | 11.5 | 13.2% |
| Stock actions | 7.0 | 8.0% |
| Questions — list | 5.8 | 6.6% |
| Questions — follow-up | 5.2 | 6.0% |
| Payments (clean) | 3.8 | 4.3% |
| Payments (clarification) | 2.6 | 3.0% |
| **Total** | **87.6** | |

**Billing is 59% of spend on 10% of the volume.** Expenses — the proposed first
vertical — are 7% of spend. Which confirms the plan from the cost side as well as the
risk side: the expenses agent is cheap enough to be irrelevant, so it can be built for
learning, and nothing about it will be cost-constrained.

---

## 8. The one decision that actually matters

| Design | Calls/bill | ₹/bill | ₹/month (23 bills) | ₹/year |
|---|---|---|---|---|
| `search_products` once per order line | 23 | 11.65 | 268 | **3,215** |
| One batched `resolve_lines` call | 3 | 2.07 | 48 | **571** |

**5.6× on the same work, same model, same output.** The difference is entirely
structural: 23 calls each resend the 2,153-token preamble plus a transcript that grows
by ~255 tokens per line resolved. By the final line the model is being billed ~10,000
input tokens to resolve one product name.

The rule this implies:

> A tool should do as much work per call as it can be given. If the model would
> obviously call a tool N times in a row with the same shape of argument, that tool has
> the wrong signature — it should accept a list.

This generalises beyond billing: `get_stock` takes `product_ids[]`, not `product_id`.
It is also a correctness argument, not only a cost one — a batched call gives the model
one consistent view instead of 20 snapshots it has to reconcile itself.

---

## 9. Prefix caching

The preamble is byte-identical on every call, so it qualifies for implicit caching at
10% of the input rate.

**394,066 of 667,674 monthly input tokens (59%) are cacheable preamble.**

| Model | Without caching | With caching | Saving |
|---|---|---|---|
| Flash-Lite | ₹47 | ₹37 | −20% |
| Flash | ₹88 | ₹64 | −27% |
| Pro | ₹234 | ₹168 | −28% |

Worth knowing, not worth doing yet — it saves ₹24/month. Revisit when billing ships,
and only then because 59% of input being boilerplate is a smell worth watching, not
because ₹288/year is worth engineering effort.

Caching requires a **stable prefix**. Putting today's date at the *top* of the system
prompt would break the cache every day. Volatile context goes last.

---

## 10. Development burn

Every prompt iteration, eval run and debugging session is a billed loop. The average
turn across the modelled mix is **5,806 input / 1,148 output tokens**.

| Agent runs during development | Flash | Pro |
|---|---|---|
| 500 | ₹381 | ₹1,016 |
| 2,000 | ₹1,524 | ₹4,064 |
| 5,000 (realistic for expenses + billing) | **₹3,810** | ₹10,159 |
| 15,000 (with repeated eval suites) | ₹11,429 | ₹30,477 |

**Expect development to cost 3–10× the first year of production.** A 19-criterion eval
suite re-run 50 times is 950 runs by itself, and evals get re-run after every prompt
change.

This inverts the usual intuition: the risk is not the steady-state bill, it is an
unattended loop during development. Set a hard spend cap on the AI Studio key before
the first run, and cap `max_iterations` in the loop itself — an agent that cannot stop
is the only realistic path to a surprising invoice.

---

## 11. What would actually change these numbers

Ordered by how much they move the answer.

| Factor | Effect | Confidence |
|---|---|---|
| Per-line vs batched tools (§8) | **5.6×** on billing | High — measured |
| Query volume (50/mo assumed) | ±30% of total | **Low — pure guess** |
| Thinking-token budget | Output is 5× input; doubling thinking adds ~40% | Medium |
| Price rises Dec-2026 / Jan-2027 | **2×** | Certain — announced |
| Product catalogue leaking into context | +7,590 tok × every call | High — avoidable by design |
| Prefix caching | −27% | High — measured |
| KC's business growing 3× | ~3× (near-linear) | — |

The 50 queries/month is the weakest number here and the second-largest cost driver. It
should be replaced with a measurement as soon as Phase 0 is live — which is a good
reason to log token usage per conversation from the very first commit.

**Tokeniser caveat:** counts use `cl100k_base` as a proxy; Gemini's tokeniser differs
by roughly ±10–15% on JSON-heavy text. Immaterial at these magnitudes.

---

## 12. Recommendations

1. **Flash-Lite for expenses, Flash for billing.** Expenses is structured extraction
   against a closed category list — Flash-Lite handles it, and Flash-Lite has no
   announced price rise. Billing needs GST and SKU-matching reasoning; use Flash and
   reserve Pro for offline eval grading only.
2. **Design tools to take lists from day one.** This is the only decision here with a
   5× cost consequence, and it is far cheaper to get right now than to retrofit.
3. **Never put the product catalogue, SKU table or container list in context.**
   Matching happens inside the tool; the model sees ranked candidates only.
4. **Cap iterations and set a billing cap on the key before the first dev run.**
5. **Log `input_tokens`, `output_tokens`, `thinking_tokens` and `model` per call** from
   the first commit — on `agent_runs`, in the schema already proposed for Phase 1.
   Without it, §11's weakest assumption stays a guess forever.
6. **Do not optimise for token cost beyond the above.** At ₹88/month, any decision that
   trades clarity, safety or correctness for tokens is a bad trade. The binding
   constraint on this project is engineering time, not inference.

---

## 13. Reproducing this

The volumes come from read-only queries against Turso:

```sql
-- payments per month
SELECT substr(created_at,1,7), COUNT(*) FROM payments GROUP BY 1;
-- sales per month
SELECT substr(created_at,1,7), COUNT(*) FROM transactions WHERE type='sale' GROUP BY 1;
-- standalone PDF invoices per month
SELECT substr(created_at,1,7), COUNT(*) FROM pdf_invoices GROUP BY 1;
-- manual stock actions ('sale' rows are transaction-generated; exclude them)
SELECT substr(timestamp,1,7), action, COUNT(*) FROM inventory_log GROUP BY 1,2;
-- items per transaction, for billing context size
SELECT COUNT(*) FROM transaction_items GROUP BY transaction_id;
```

Token counts come from tokenising the full system prompts and tool schemas, plus real
serialised rows. Prices from <https://ai.google.dev/gemini-api/docs/pricing>, retrieved
17-Oct-2026. USD→INR at ₹88.

**Refresh this document when:** prices change (Dec-2026 and Jan-2027 are already
scheduled), the tool signatures are finalised, or Phase 0 produces real token telemetry
to replace the 50-queries/month assumption.
