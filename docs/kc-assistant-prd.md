# KC Assistant: Order to Bill

**Status:** Draft for owner review; not an implementation or deployment approval  
**Owner:** Manan  
**Date:** 14 October 2026  
**Product:** A new authenticated page on the existing Kraft Culture website  
**Proposed navigation:** Assistant, at `/assistant`

## 1. Product decision

Build one order-to-bill workspace for KC, not a general-purpose business agent.

The owner can enter an order in plain language or upload a supported Excel,
review one structured draft, and choose one of three outcomes:

1. Check whether the order can be fulfilled from current stock.
2. Generate and archive a standalone PDF bill without affecting accounting.
3. Create an unpaid sales transaction, deduct stock, update the customer balance,
   and receive its PDF.

These are three outcomes of the same order workflow, not three separate chatbots.
Stock checking is also a prerequisite for creating a sale. All three outcomes
belong in the initial release, as requested by the owner, but can be implemented
in small sequential slices.

**The first release is successful when the owner can complete this workflow on
the KC website without opening a terminal or recovering context from an old chat.**

This is for KC alone. There is no multi-business onboarding, subscription system,
agent marketplace, or general-purpose automation platform.

## 2. Problem and users

KC already stores customers, products, SKU mappings, inventory, transactions,
company details, and PDFs. Preparing a bill still involves interpreting an order,
finding the right records, resolving tax or quantity discrepancies, checking
stock, and making sure the document is actually saved.

The current conversational workflow demonstrates that these jobs can be
completed, but it depends on a coding assistant, local files, repeated context,
and operational supervision. A downloaded PDF alone also does not tell the
owner whether it was archived or whether stock and balances changed.

The primary user is the KC owner. Existing ADMIN and STAFF users are the
subsequent audience; this is not a customer-facing portal.

### Jobs to be done

| Situation | Desired outcome |
|---|---|
| A customer sends an order sheet | Understand it without retyping every line. |
| An order arrives before billing | See available stock and shortages without creating a sale. |
| A standalone bill is needed | Produce the correct PDF and find it later in PDF Bills. |
| An order should affect accounting | Create the sale once, with the right stock and balance effects. |
| Work is interrupted | Resume the same draft or recover the result without duplicates. |

## 3. Initial scope

### Included

| Area | Initial-release boundary |
|---|---|
| Entry point | One page inside the existing KC layout and login session. |
| Inputs | Typed/pasted order text and one `.xlsx` file per draft. |
| Excel support | The Dabster weekly order layout already used by KC, including relevant summary, detail, and cancellation sheets. |
| Buyers | Existing customer records. Standalone drafts may contain explicitly entered buyer details without creating a contact. |
| Editing | Plain-language corrections and direct editing of the same structured draft. |
| Stock | Exact product matching, container selection, current availability, and shortages. |
| Standalone billing | Standard KC PDF, archived in PDF Bills; no accounting changes. |
| Sales | Existing products and containers, unpaid sale, standard transaction PDF. |
| Continuity | Server-saved drafts, visible operation status, and links to completed records. |

The typed-text path supports other KC customers; it does not imply support for
every customer's spreadsheet format.

### Explicitly excluded

- Photos, scanned PDFs, OCR, voice input, WhatsApp, email ingestion, and CSV/XLS.
- Arbitrary spreadsheet layouts, multi-file batches, multiple buyers per draft,
  or issuing several invoices in one action.
- Product/contact creation, permanent SKU mapping changes, opening stock,
  stock adjustments, and automatic replenishment.
- Payment recording, purchases, returns, credit notes, invoice cancellation,
  or correction of already-issued documents.
- GST return preparation or filing, reconciliation with Tally, general business
  analytics, collections, reorder recommendations, and scheduled actions.
- Autonomous issuance, unrestricted tools, shell access, or a general chat
  assistant that answers unrelated questions.

For an out-of-scope request, explain the boundary and link to the relevant
existing KC page where possible. Do not pretend the action was performed.

## 4. The page experience

The page is called **Assistant**, with the subtitle **Prepare an order, check
stock, or create a bill**. It should feel like a guided workspace, not a blank
chat window that requires the owner to learn prompts.

### Layout

On desktop, show the conversation/input area beside a persistent order summary.
On mobile, stack them and keep the current mode and primary action easy to find.
Reuse the website's existing components, notifications, theme, and navigation.

The empty state offers three starting actions:

- **Check order stock**
- **Make a PDF bill**
- **Create a sales transaction**

The owner can type an instruction, upload a file, or select a starting action.
An explicitly requested mode is preselected and remains visible. If the request
only says "make a bill", ask PDF-only versus sales transaction before issuance;
never default silently to a stock-affecting action.

### Happy path

1. **Add the order.** Select the buyer if known and paste text or upload Excel.
2. **Prepare the draft.** Extract rows, retrieve relevant KC records, and show
   the interpreted order. No invoice or accounting record is created.
3. **Resolve gaps together.** Present missing or conflicting fields in one
   editable panel, not a long sequence of individual questions.
4. **Review the outcome.** Show the stock result or a complete bill confirmation.
5. **Confirm once.** A deliberate button click approves the displayed revision
   and its effects. Conversational replies may edit a draft but do not issue it.
6. **Show the real result.** Return the existing-register link and a working PDF
   download, or an explicit partial/failure state.

The owner may switch mode before issuance. Changing mode must recalculate
required fields, show the changed effects, and invalidate any prior approval.
A completed stock check can continue to billing in the same draft. Once an
invoice or sale is issued, that draft cannot issue another document or switch
to the other billing mode.

### The draft, not the transcript, is authoritative

The persistent summary contains:

- Buyer, invoice date, selected mode, and original input reference.
- Item descriptions/SKUs, quantities, unit prices, HSNs, and line-level GST.
- Product and container mappings where required.
- Included/excluded source rows and explanations for unresolved differences.
- Taxable amount, CGST/SGST or IGST, round-off, and final amount.
- Stock effects and customer balance effects when applicable.

Each extracted or suggested field exposes its origin: input text, workbook
sheet/row, current KC record, or explicit user edit. Suggestions from previous
bills must be labelled; a past bill does not automatically establish a new
price, quantity, tax classification, or delivery location.

Edits update the table and totals immediately after server validation. On
reload, resume the saved structured draft; do not depend on model memory or
reconstruct financial state from the conversation.

## 5. Functional requirements

### 5.1 Interpret and reconcile the order

**INPUT-1:** Preserve the original input, its fingerprint, and traceable source
rows. Never silently drop malformed, unmatched, cancelled, or zero-value rows.
Show a count of included, excluded, and unresolved rows.

**INPUT-2:** For the supported Excel layout, compare summary and detail quantities,
prices, taxes, and totals. Do not assume that the first sheet is authoritative
or add summary and detail rows together. A conflict identifies the specific
rows and competing values and requires the owner to choose the authority.

**INPUT-3:** Distinguish a same-batch unissued cancellation from a return against
an earlier bill. Exclude a cancellation only when its status and matching order
reference are established and the exclusion is visible in the review. Never
deduct a cancelled row twice. Prior-period returns and unclear cases block
billing until handled outside this workflow.

**INPUT-4:** Treat dimensions and pack descriptions separately from quantities.
For example, `Pagla Folder 1 x 10, 329 at Rs10` means 329 billed units, not 3,290.
Unclear pack-to-unit conversions require confirmation.

**INPUT-5:** Never invent goods, quantities, discounts, or prices to reach a target
such as "make a bill for Rs11,000". Ask for the missing items or an explicit
approved composition before a bill can be prepared.

**INPUT-6:** Initial proposed limits are one file of at most 10 MiB, 5,000 nonempty
source rows across sheets, and 200 final invoice lines. Check these limits before
model processing and enforce a decompressed-workbook resource limit. Reject
unsupported layouts, encrypted workbooks, and macro-enabled files explicitly.
Do not execute formulas, macros, or external links. Formula-derived values must
be independently reconciled from underlying data; missing or inconsistent
values are unresolved, not zero.

### 5.2 Match customer, products, and stock

**MATCH-1:** Use exact buyer-specific SKU mappings first, then unambiguous existing
product identifiers. Preserve raw SKUs; supplier-specific transformations must
not become universal matching rules. Fuzzy matches may be suggestions, never
silent selections.

**MATCH-2:** Show all unresolved variants together. A chosen mapping applies to
this draft only; saving a permanent mapping is outside v1.

**STOCK-1:** Stock check requires a resolved product and quantity, not billing
prices, HSNs, or taxes. Unknown products are labelled **Unresolved**, not
**Out of stock**. Return per-item requested, available, short, and available
containers, with the time checked.

**STOCK-2:** Label an order **Fully available** only if every requested line is
resolved and covered. Aggregate repeated demands for the same product and
container so shared stock is not counted twice.

**STOCK-3:** A check does not reserve or modify stock. For a sale, require an
explicit allocation that covers every unit; allow allocation across existing
containers while retaining the original customer-facing line identity.
Insufficient stock blocks the sale. Do not automatically reduce quantities,
drop lines, create products, or add stock.

**STOCK-4:** Revalidate availability at commit time, under server-side concurrency
controls that prevent overselling. A changed allocation or quantity requires
a revised review. Selecting PDF-only is not an automatic workaround for a
blocked sale; the owner must explicitly change mode.

### 5.3 Prepare a standalone PDF

**PDF-1:** Product-master and stock matches are not prerequisites. Require
confirmed descriptions, quantities, prices, applicable HSNs/taxes, buyer
details, invoice date, and invoice number.

**PDF-2:** Suggest an available invoice number using current records, but do not
reserve it merely by creating a draft. Show it for approval and recheck both
registers, including reserved/retired entries, at issuance. A collision requires
a new reviewed number, not an invisible substitution.

**PDF-3:** Use the standard KC renderer and the tracked registration contract.
The final document appears in `/pdf-invoices`. Do not create a transaction,
payment, inventory log, contact, or balance change.

**PDF-4:** Show **Completed** only when the immutable original PDF and metadata
are persisted and its archived bytes can be downloaded and checksum-verified.

### 5.4 Create a sale with a PDF

**SALE-1:** Require an existing customer, resolved products, complete stock
allocation, confirmed prices/taxes, and transaction date.

**SALE-2:** V1 creates unpaid sales only. The review explicitly shows **Payment
recorded: Rs0**, the amount added to the customer's outstanding balance, and the
planned stock deductions. If the input requests a payment, explain that payment
recording must use the existing Payments workflow; do not imply it was recorded.

**SALE-3:** Create through the canonical transaction service. Let the server
allocate the SALE number using its existing cross-register rules. Show
**Assigned on creation** in the draft rather than a guessed future number.

**SALE-4:** The PDF belongs to the transaction at `/transactions/:id`; it must
not also appear as a new standalone entry in `/pdf-invoices`.

**SALE-5:** If the sale commits but PDF generation fails, show **Sale created;
PDF pending**, the transaction number, and its already-applied stock/balance
effects. Recover the PDF for that transaction only; never create another sale.

### 5.5 Money, tax, and document quality

- Compute totals with canonical server-side decimal logic, not model arithmetic
  or browser floating-point approximations. Preview and commit use the same
  calculation path and rounding rules.
- Preserve per-line GST, mixed rates, the actual CGST/SGST split, and round-off.
  Do not combine IGST with CGST/SGST. Totals must match the approved source to
  the paise after the displayed, mode-specific rounding. Standalone round-off
  must remain strictly within one rupee; sales use the existing transaction
  rounding rule. Any other mismatch blocks issuance until an explicit
  authoritative correction is visible and approved.
- Use confirmed supply location. A missing GSTIN is not a tax exemption, and a
  GSTIN prefix alone is insufficient when the stated delivery location differs.
- Never invent HSNs or overwrite product tax/HSN masters from this page.
  Transaction HSN conflicts that cannot be represented by the existing service
  must be resolved through the normal product workflow before proceeding.
- Read seller and bank information from company settings. Print the standard
  bank section, correct buyer/date/number, all approved lines, and no due date.
  Do not add assistant commentary or the conversation to customer PDFs.

## 6. Confirmation, persistence, and recovery

### Confirmation contract

The final review must state exactly what will happen:

| Mode | Primary action | Business effects |
|---|---|---|
| Stock check | Check stock | None; no stock reservation or invoice. |
| PDF-only | Create PDF bill | One archived standalone invoice; stock and balance unchanged. |
| Sale | Create sale and PDF | One unpaid sale; approved stock deductions and balance increase. |

Bind approval to the draft ID, revision, selected mode, normalized payload, and
relevant current-record versions. Any material edit or changed prerequisite
invalidates approval. Repeated questions about already-confirmed, unchanged
details are not acceptable.

### Durable states

Use explicit persisted states, not only spinner text:

`Draft -> Needs input / Ready -> Processing -> Completed`

Additional outcomes:

- **Stock checked:** read-only result; the draft can still be edited or billed.
- **Needs refresh:** underlying records or stock no longer match the review.
- **Failed before commit:** no invoice/accounting mutation; explain the failure.
- **Outcome unknown:** a request may have committed; reconcile before any retry.
- **PDF pending:** the sale or standalone register identity already exists;
  retry only its remaining document/archive work.

Drafts autosave after edits and survive navigation, refresh, and session expiry.
If saving fails, show **Not saved**; never imply durability. Reauthentication
returns to the same draft or operation. Show recent drafts and completed
operations on the page, with links to their canonical records.

### Exactly-once business effects

Issue one stable operation ID per approved draft revision. Server-enforced
idempotency must survive double clicks, two tabs, timeouts, and a process crash
after accounting commit but before the browser receives a response.

The operation-to-transaction association must be durable with the accounting
commit; a frontend disabled button or a separate best-effort receipt is not
sufficient. The same key and payload return the original result; the same key
with different content is rejected. A revision cannot issue through both modes.

Use input fingerprints and source order references to identify previous
processing across drafts and both registers. An identical completed request
returns its existing result. A possible duplicate requires explicit resolution;
equal totals alone are not proof of duplication. Changing mode or renaming a
file must not bypass the check. A genuinely separate repeat order can proceed
only after that distinction is explicitly recorded; matching text or a file
hash alone must not permanently prevent legitimate repeat business.

For standalone recovery, preserve original PDF bytes and metadata before upload
and reuse them after an interrupted upload. Do not regenerate, overwrite an
issued PDF, allocate another number, or force-regenerate a transaction PDF as
a retry shortcut.

## 7. System boundaries and implementation implications

The existing KC application remains the sole business system of record.
Assistant drafts and operation receipts are workflow records, not a second
inventory or accounting ledger.

### Reuse versus new work

| Capability | Current repository evidence | Required for this release |
|---|---|---|
| Website shell and auth | React/TypeScript, MUI, protected routes, existing session | Add one lazy-loaded route and navigation item. |
| Excel-assisted sale entry | `CreateDeodapBillPage` and its parser/table components | Reuse suitable UI/lookup pieces; add supported-layout reconciliation and explicit unresolved rows. |
| Inventory lookup | Batch product/container API and SKU lookup | Build aggregated order availability and commit-time protection. |
| Sales and PDFs | Existing sale, invoice metadata, generation, and download APIs | Approved-draft execution, durable idempotency, and clear partial-success recovery. |
| Standalone PDFs | Renderer, tracked CLI, upload/list/download API | Add an authenticated server generation operation using the same validated render/register contract. |
| Drafts | Existing sale/purchase draft API | Add versioned assistant draft data without breaking existing drafts. |

The existing Excel parser reads the first sheet, extracts SKU/quantity, and
applies a supplier-specific SKU transformation. It is not a general tax-aware
order importer. The new page must not inherit silent column guessing, row
dropping, or unmatched-line omission.

The existing standalone API uploads a finished PDF; it is not already a
browser-callable text-to-invoice service. Extract/reuse the tracked CLI's
canonical service logic for the web operation rather than invoking a developer
shell or maintaining a second renderer.

Existing draft schemas are not sufficient unchanged: they do not capture
standalone lines, source provenance, per-line tax decisions, approval revisions,
or operation recovery. A small versioned extension or dedicated workflow model
is required; choose the least disruptive design during implementation.

### AI boundary

Use the model to interpret text, propose structured fields, and explain
validation errors. Deterministic code reads supported spreadsheets, resolves
identities, validates data, computes money, checks stock, and performs writes.

There is no need for a multi-agent system, vector database, or unrestricted
tool loop. The model can propose an action; it cannot approve one. Document
contents are untrusted data, never instructions to bypass confirmation or call
tools.

If extraction is unavailable or invalid, preserve the draft and show an explicit
error. Direct structured editing remains usable; do not invent an answer or
silently substitute a different model/provider.

### Identity, privacy, and access

- Use the current logged-in KC user's authority. Enforce ADMIN/STAFF permissions
  on the server for preparation and issuance; pilot initially with the owner.
  Other existing roles keep their current pages but do not gain this workflow.
- Drafts and operation status are accessible only to their owner in v1.
  Completed business records retain the existing register permissions.
- Keep model/provider credentials on the backend. Do not mint owner tokens,
  impersonate an administrator, or require a local coding-assistant session.
- Approve the model hosting/provider and its data-retention terms before
  integration. Send only the minimum necessary order context, never database
  dumps, credentials, or unrelated customer records. No provider is selected
  by this PRD.
- Keep source evidence private in controlled KC storage. Do not introduce
  public upload links or expose other users' drafts through guessable IDs.
- Proposed retention: purge abandoned drafts and their uploads after 30 days,
  visibly warning the owner beforehand. Completed approval/source receipts
  follow the business-record retention policy. That policy and deletion
  behavior require owner approval before launch; draft cleanup must never
  delete issued invoices or in-progress recovery evidence.

### Deployment constraints

Local source is not proof that the same features are deployed. Existing invoice
documentation distinguishes live register functionality from pending renderer,
bank-field, ordering, and reporting changes.

Before pilot, verify deployed renderer and API compatibility, including bank
details and no due date. Any schema changes or deployment require a reviewed
plan and owner approval. Do not bundle unrelated GST reporting work into this
release. The normal Transactions and PDF Bills pages must continue working.

## 8. Acceptance criteria

Use approved copies of historical orders in an isolated environment. Replay
fixtures must not create duplicate production invoices.

| ID | Scenario | Required result |
|---|---|---|
| AC-01 | Known buyer and complete typed order | One editable draft; no repeated request for known unchanged details; one final approval. |
| AC-02 | Supported Dabster workbook | Every relevant source row accounted for; one reconciled draft, not duplicate summary/detail totals. |
| AC-03 | Summary/detail GST disagree | Show both values and affected lines; billing blocked until an explicit choice reconciles the draft. |
| AC-04 | Cancelled order is already absent from billed totals | Do not deduct it again; show the source exclusion. |
| AC-05 | Unknown SKU, ambiguous variant, or malformed quantity | Visible unresolved rows; no silent omissions or full-availability claim. |
| AC-06 | Stock check with repeated products and multiple containers | Correct aggregate demand and shortages; timestamp shown; no accounting or inventory mutations. |
| AC-07 | Approved standalone bill | Correct standard PDF appears in PDF Bills with matching archived bytes; transaction, payment, stock, and balance unchanged. |
| AC-08 | Approved unpaid sale | Exactly one transaction, expected inventory logs/deductions and balance increase, payment Rs0; PDF linked only to its transaction. |
| AC-09 | Stock or approved financial data changes before commit | No execution against stale approval; refreshed review identifies the change. |
| AC-10 | Two simultaneous sales compete for insufficient stock | At most the fulfillable sale commits; no negative stock or double allocation. |
| AC-11 | Double click, two tabs, timeout, or crash around commit | One business result, recoverable by operation ID; no duplicate stock or balance effects. |
| AC-12 | Sale succeeds but PDF upload fails | Transaction remains visible as committed; retry completes only its PDF. |
| AC-13 | Standalone upload response is lost | Recover the same register identity using the original bytes/metadata. |
| AC-14 | Refresh, navigation, expired login, or failed autosave | Saved work resumes correctly; unsaved work is labelled; no blind reissuance. |
| AC-15 | Same order reuploaded or billed through another mode | Existing result or explicit duplicate-resolution block, not a second silent issuance. |
| AC-16 | Mode switch or financial edit after review | Previous approval invalidated; updated effects require confirmation. |
| AC-17 | Unsupported file, malicious embedded instructions, or unavailable model | Explicit safe failure; no invented data, command execution, or unauthorized action. |
| AC-18 | PDF download/layout review | Approved lines, HSNs, quantity, rates, tax split, date, number, bank section, and total are legible and correct; no due date or AI commentary. |
| AC-19 | Nonpermitted role or another user's draft/operation | Server denies access; frontend hiding alone is insufficient. |

## 9. Success measures

These are proposed pilot targets, not claims about current performance.

Evaluate the first 10 eligible real orders, covering all three outcomes, after
isolated acceptance checks and explicit approval to use production.

| Measure | Pilot target |
|---|---|
| Time saved | Median owner active time at least 50% lower than a recorded baseline of comparable KC tasks. Track waiting time separately. |
| Independence | At least 8 of 10 eligible orders completed without terminal access or developer intervention. |
| Accuracy and safety | Zero incorrect issued amounts, duplicate issuances, unintended stock/balance changes, or lost committed results. |
| Interaction | Complete, unambiguous orders need no clarification round and exactly one issuance confirmation. |
| Responsiveness | Within 2 seconds, acknowledge input and show the current processing stage; no unlabelled indefinite spinner. |
| Initial performance budget | Under normal operation, p95 draft preparation within 60 seconds and confirmation-to-PDF within 120 seconds for supported inputs; report exceptions and partial states honestly. |
| Cost visibility | Record model usage and cost per completed order without logging raw customer data in analytics; review actual pilot cost before expansion. |

Record eligibility exclusions and their reasons; do not hide unsupported orders
to improve the success rate. Capture required corrections and failures, not just
completion counts. There is no invented current baseline or guaranteed savings.

Any financial-integrity failure stops new issuance through Assistant until
resolved. Preserve recovery access to existing operations. If safety is sound
but time savings are weak, simplify the interaction before adding capabilities.

## 10. Delivery sequence and release gate

This is one release with three small implementation slices, not a promise to
build the entire operations assistant immediately.

| Slice | Deliverable | Exit condition |
|---|---|---|
| 1. Order workspace and stock | New page, text/supported-Excel input, saved editable draft, source reconciliation, and stock result | Owner can complete a read-only stock check on the website; no billing writes enabled. |
| 2. Standalone PDF | Financial review, numbering checks, confirmation, generation, archive, and recovery | End-to-end PDF-only workflow with no accounting effects. |
| 3. Sales transaction | Allocation, unpaid-sale review, concurrency/idempotency safeguards, transaction PDF and recovery | All three requested outcomes work safely through the same page. |

Pilot with the owner before enabling STAFF. Keep existing manual workflows
available throughout. Provide a server-side switch to disable new Assistant
issuance without disabling existing invoice downloads or in-flight recovery.

**Ready for implementation:** Owner approves this scope and the proposed input
limits; model hosting/privacy and completed-record retention decisions are
resolved; canonical calculation and idempotency integration are designed.

**Ready for release:** Acceptance criteria are met, deployment/schema changes
are separately approved, and the owner has reviewed the resulting behavior.

**Not a release requirement:** additional agent capabilities, a new dashboard,
multi-business support, payment automation, or GST filing.

### Reference implementation surfaces

- Website navigation: `src/components/layout/MainLayout.tsx`
- Protected routes: `src/routes/index.tsx`
- Existing Excel entry: `src/features/transactions/CreateDeodapBillPage.tsx`
- Existing parser: `src/features/transactions/components/deodap/parseExcel.ts`
- Frontend APIs: `src/api/{transactions,pdfInvoices,containerProducts,drafts,vendorSkus}.api.ts`
- Backend contracts: `../mystock/app/modules/{transactions,pdf_invoices,drafts}/schemas.py`
- Standalone workflow: `../mystock/docs/pdf-bills.md` and `../mystock/scripts/pdf_invoice.py`

The next product decision comes after the pilot: does this workflow materially
reduce KC's daily effort? New capabilities should follow observed need, not the
fact that the page is called an assistant.
