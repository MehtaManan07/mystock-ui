# Redesign — warm & branded

Agreed direction: **warm & branded** (Kraft Culture identity, warm neutrals, more
personality) · **refined teal** accent · **comfortable** density · **follow system**
theme · **collapsible icon rail** nav · no command palette · **go all in**.

Extras in scope: table polish, proper empty states, Dashboard rethink.

## Palette (validated, all WCAG AA+ / AAA for body text)

| token | light | dark |
|---|---|---|
| background | `#fbf9f5` warm paper | `#15100c` warm espresso |
| card | `#fffefb` | `#1f1813` |
| muted | `#f4f0e8` | `#2b231e` |
| border | `#e4ded5` | `#39312b` |
| foreground | `#271e18` | `#f3f0ea` |
| muted-foreground | `#74685e` (5.15:1) | `#aba39a` (7.61:1) |
| primary (teal) | `#037879` (5.22:1 w/ white) | `#2ebdb9` (8.15:1) |
| destructive | `#c52c28` | `#f86e6a` |
| success | `#1c7d43` | `#52c17b` |
| warning | `#d28a0e` | `#f1b047` |

Charts: teal · tan `#d7a85b` · clay `#ca653c` · sage `#6ca177` · plum `#9a5885`.

## Phase A — design tokens
- [x] Rewrite `src/index.css` with warm light/dark token sets
- [x] Warm-tinted shadows, selection, scrollbars
- [x] Comfortable density scale + radius bump

## Phase B — theme system (`system` mode is NEW)
- [x] `themeStore`: `'light' | 'dark' | 'system'` + resolved mode
- [x] Live `matchMedia` listener so OS changes apply without reload
- [x] Pre-paint script in `index.html` handles `system`
- [x] Theme switcher in the shell (3-way)
- [x] `sonner` follows resolved mode

## Phase C — app shell
- [x] `MainLayout`: collapsible sidebar <-> icon rail, persisted
- [x] Tooltips on collapsed icons
- [x] Grouped nav sections
- [x] Mobile sheet nav retained

## Phase D — shared components
- [x] `EmptyState` with illustrated icon treatment
- [x] `ui/table` + `ResponsiveTable` polish: sticky header, hover, numeric alignment
- [x] `PageHeader` restyle
- [x] `card` warm treatment

## Phase E — Dashboard rethink
- [x] Replace stat-card grid with a genuinely useful at-a-glance view

## Phase F — roll out to every page
- [x] products · containers · inventory · contacts · payments · users
- [x] transactions · dashboard · settings · pdf-invoices · auth · assistant

## Phase G — verify
- [x] `tsc -b --force` clean
- [x] `vite build` clean + bundle re-measured (eager path 652.9 KB raw / 200.1 KB gz;
      vs 1187.9 KB / 371.9 KB on MUI = **-46% gzipped**)
- [x] eslint: no new errors beyond the 52 pre-existing
- [x] Runtime smoke: 20/20 routes, zero console errors (light + dark, desktop + 390px),
      API stubbed from the backend OpenAPI schema so no real data was touched

## Working rules
- No commits without explicit approval.
- No dev server / test runs without asking first.
