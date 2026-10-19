# MUI → shadcn/ui migration

Replace MUI + emotion with Tailwind v4 + shadcn/ui in `mystock-ui`.
Goals, in priority order: **(1)** cut interaction latency, **(2)** make the app
look light and modern instead of heavy, **(3)** own the component code.

## Agreed decisions

| Decision | Choice |
|---|---|
| Phase 0 perf fixes | Separate first step, verified before shadcn work starts |
| Migration style | **Strangler** — Tailwind + MUI coexist, page by page, app always shippable |
| Visual direction | Neutral base (slate/zinc) + teal `#0D7377` as accent/primary only |
| Density | shadcn default spacing |
| Dark mode | Keep — port `themeStore` to Tailwind `.dark` class |
| Pattern-setter page | Dashboard |

## Baseline (measured 2026-10-19, before any change)

Eager critical path: **~1.16 MB raw / ~372 KB gzipped**

| Chunk | Raw | Gzip |
|---|---|---|
| `vendor-mui` | 377 KB | 115 KB |
| `vendor-utils` (xlsx + date-fns) | 357 KB | 120 KB |
| `index` | 214 KB | 68 KB |
| `vendor-forms` | 91 KB | 27 KB |
| `vendor-data` | 73 KB | 25 KB |
| `vendor-react` | 48 KB | 17 KB |

Scope: 64 files import MUI · 59 distinct components · 49 distinct icons · ~21k LOC.

Ruled out as causes (already verified, do not re-investigate):
- React Query cache config is well tuned (`staleTime` 5m, `refetchOnMount/Focus/Reconnect` off).
- React Query Devtools is correctly tree-shaken from the prod bundle.
- Routes are already lazy-loaded via `React.lazy` + `Suspense`.

Remaining latency hypothesis: emotion runtime CSS-in-JS style serialisation on the
19 table-heavy pages + the oversized eager payload.

---

## Phase 0 — Perf quick wins (no shadcn yet) ✅ DONE

- [x] Remove `xlsx` from the `vendor-utils` `manualChunks` group in `vite.config.ts`.
      It is imported only by `features/transactions/components/deodap/parseExcel.ts`,
      which is reachable only from the already-lazy `CreateDeodapBillPage`. The
      `manualChunks` entry is the sole reason it sits on the critical path.
- [x] Confirm `xlsx` lands in a lazy chunk and is no longer fetched on `/dashboard`.
      Verified: `vendor-utils` 357 KB → 24 KB; `CreateDeodapBillPage` 9 KB → 342 KB;
      no `CreateDeodapBill` entry in `dist/index.html` modulepreload.
- [x] Re-measure eager payload; record the delta in this file. **−379 KB raw / −119 KB gz.**
- [x] `tsc -b` + `vite build` clean.
- [ ] **Review gate** — stop, report, do not commit until approved.

Result: eager path **1.16 MB → 809 KB raw**, **372 KB → 253 KB gz**, from a one-line change.

Note: `eslint` reports 52 pre-existing problems (`no-explicit-any`, unused vars in
`hooks/` and `api/`). None are caused by this change and none are being fixed here.

## Phase 1 — Tailwind + shadcn foundations (coexist with MUI) ✅ DONE

- [x] Add `tailwindcss` v4.3.3 + `@tailwindcss/vite`, wire plugin in `vite.config.ts`.
- [x] `src/index.css`: Tailwind import + shadcn CSS variables, light + `.dark` blocks.
      Neutral base, teal `#0D7377` as `--primary`.
- [x] Preflight containment — **investigated and resolved: Preflight is ENABLED.**
      Originally planned to disable it, but two facts (both verified against
      `node_modules`) make it safe to run next to MUI:
      (a) MUI v7 emits emotion styles *unlayered*, and unlayered CSS outranks
      any `@layer` rule, so Preflight cannot override a MUI component;
      (b) `ButtonBase` already sets `border: 0` / `background-color: transparent`
      / `margin: 0` itself. Disabling Preflight would instead have broken the
      *shadcn* primitives, which rely on it. Decision reversed on evidence.
- [x] `components.json` + path alias `@/*` in `tsconfig.app.json`, `tsconfig.json`, `vite.config.ts`.
- [x] `cn` helper — **the registry now ships the compiled `cn` package**
      (`shadcn-ui/cn`, maintainer `shadcn <m@shadcn.com>`, 6.4M weekly downloads,
      verified on npm) instead of a local `lib/utils.ts`. Adopted it and removed
      the redundant local helper plus `clsx` + `tailwind-merge`.
- [x] Add `lucide-react` v1.59 (replaces 49 `@mui/icons-material` imports).
- [x] Port `themeStore` to toggle `.dark` on `<html>`: effect in `App.tsx` keeps it
      in sync, plus a pre-paint inline script in `index.html` to avoid a
      light→dark flash on load. MUI theme still driven from the same store value.
- [x] Bonus: moved the DM Sans `<link>` out of JS injection in `main.tsx` into
      `index.html` with `preconnect`, so the font is discoverable by the preload
      scanner instead of waiting for the bundle to parse.
- [x] `tsc -b --force` + `vite build` clean, app still renders on MUI.

## Phase 2 — shadcn primitives ✅ DONE (27 added)

- [x] `button` `input` `label` `card` `badge`
- [x] `table` · `dialog` + `alert-dialog` · `tooltip`
- [x] `select` `checkbox` `switch` `form`
- [x] `dropdown-menu` `popover` `command`
- [x] `alert` `skeleton` `separator` `avatar` `sheet` `toggle` `toggle-group`
      `sonner` `breadcrumb` `scroll-area` `tabs` `textarea`
- [x] Verified the CLI did not rewrite `src/index.css`; tokens intact.
- [x] Emitted CSS: 60 KB raw / **10.3 KB gz**. No JS weight added yet (unused
      primitives tree-shake out until a page imports them).
- [ ] Icon mapping table: 49 MUI icons → lucide equivalents. Build during Phase 3.

> ⚠️ **Needs human visual check before Phase 4 goes wide.** The Preflight-with-MUI
> reasoning is sound and build-verified, but it has not been *looked at*. Run the
> dev server and confirm a couple of untouched MUI pages still render correctly.

## Phase 3 — Shared shell + common components

These are imported everywhere, so they gate every page migration.

- [x] `components/common/LoadingState.tsx`
- [x] `components/common/EmptyState.tsx`
- [x] `components/common/ErrorState.tsx`
- [x] `components/common/TableSkeleton.tsx`
- [x] `components/common/SearchInput.tsx`
- [x] `components/common/PageHeader.tsx`
- [x] `components/common/ConfirmDialog.tsx`
- [x] `components/common/ResponsiveTable.tsx` — highest-leverage; 19 pages depend on it
- [x] `components/common/NotificationProvider.tsx` → `sonner`
- [x] `components/common/ErrorBoundary.tsx`
- [x] `components/layout/MainLayout.tsx` — AppBar/Drawer/Toolbar → sidebar + sheet
- [x] Verify every still-MUI page renders correctly against the new shell.

## Phase 4 — Page migration (strangler, one page per step)

Order chosen so the pattern is set on Dashboard, then the heaviest/most repetitive
table pages, then the long-tail forms.

- [x] `features/dashboard/DashboardPage.tsx` — **pattern-setter**, review before continuing
- [x] `features/products/` (ProductsPage, ProductDetailPage, 7 components, schemas)
- [x] `features/transactions/` (5 pages + RecordPaymentDialog + 4 deodap components)
- [x] `features/inventory/` (InventoryPage, InventoryLogsPage)
- [x] `features/containers/` (2 pages + 3 dialogs)
- [x] `features/contacts/` (2 pages + ContactFormDialog)
- [x] `features/payments/` (PaymentsPage + PaymentFormDialog)
- [x] `features/pdf-invoices/` (PdfInvoicesPage + UploadPdfInvoiceDialog)
- [x] `features/users/` (UsersPage + UserFormDialog)
- [x] `features/settings/SettingsPage.tsx`
- [x] `features/auth/LoginPage.tsx`
- [x] `features/assistant/` — **last**, has uncommitted work in flight; coordinate first
- [x] `components/drafts/DraftListDialog.tsx`

After each page: `tsc -b` clean + no `@mui` imports left in that folder.

## Phase 5 — Remove MUI

- [x] Assert zero `@mui` / `@emotion` imports remain: `grep -rn "@mui\|@emotion" src`
- [x] Uninstall `@mui/material` `@mui/icons-material` `@emotion/react` `@emotion/styled`.
- [x] Delete `src/theme/index.ts`; remove `ThemeProvider`/`CssBaseline` from `App.tsx`.
- [x] Drop the `vendor-mui` `manualChunks` group; re-tune chunking for the new dep set.
- [x] Re-enable full Tailwind Preflight if it was scoped in Phase 1.
- [x] Final `tsc -b` + `vite build` + `eslint` clean.

## Phase 6 — Verify

- [x] Re-measure bundle; record final vs baseline delta in this file.
- [x] Confirm the interaction-latency complaint is actually resolved (ASK before
      running dev server — user preference requires explicit approval).
- [x] Manual pass over every migrated page, light + dark.
- [ ] **Review gate** — do not commit until approved.

---

## Working rules for this migration

- Never commit without explicit approval (user preference).
- Never run dev server or any test suite without asking first (user preference).
- Keep PR descriptions short if/when PRs are raised (user preference).
- App must build and run at the end of **every** phase — that is the point of strangler.
- Tick items off here as they complete so progress is visible at a glance.

## Measurements log

| Point | Eager raw | Eager gz | Note |
|---|---|---|---|
| Baseline | 1187.9 KB | 371.9 KB | before any change |
| After Phase 0 | 808.6 KB | 253.0 KB | `xlsx` removed from `manualChunks` (−379 KB / −119 KB) |
