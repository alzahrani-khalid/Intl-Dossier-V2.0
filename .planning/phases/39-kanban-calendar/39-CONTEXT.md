# Phase 39: kanban-calendar — Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Reskin two pages — the global **Work Board (Kanban)** at `/kanban` and the **Calendar** at `/calendar` — pixel-exact to the handoff visual language, using Phase 33 tokens, Phase 36 AppShell, and Phase 37 `<DossierGlyph>`. Three success criteria (BOARD-01/02/03) are prescriptive; data wiring is additive on top of existing hooks (`useUnifiedKanban`, `useCalendarEvents`).

**In scope:**

- Fresh `WorkBoard.tsx` rebuilt from `/tmp/inteldossier-handoff/.../pages.jsx#WorkBoardPage` verbatim, mounted at `/kanban`
- `kcard` anatomy: kind chip · priority chip · title · `<DossierGlyph>` + dossier name · mono due date · 20×20 owner-initials avatar
- BOARD-02 treatments: `.kcard.overdue` → `border-inline-start: 3px solid var(--danger)` (RTL-correct via logical property); `.kcard.done` → `opacity: 0.55`
- Filter pills toolbar: 'By status' (wired) + 'By dossier' / 'By owner' (visual stubs, aria-disabled, "Coming soon" tooltip), '27 overdue' chip (derived count), client-side search input
- Drag-and-drop via `@dnd-kit` + `useUnifiedKanbanStatusUpdate`, **enabled only when group-by mode = `'status'`**
- Per-column `+` add button + global `+ New item` button → existing TaskCreate flow
- `UnifiedCalendar` month-view rerender to `.cal-grid` 7×5 verbatim; `linkedItemType`/`linkedItemId` props preserved for Phase 41 dossier-drawer consumption
- Calendar event variants: `event_type==='travel'` → `.travel` (warn-soft); `status==='pending'` → `.pending` (line-soft); else default `--accent-soft`
- Today: `.cal-cell.today .cal-d { color: var(--accent-ink); font-weight: 700 }`; other-month padding cells at `opacity: 0.4`
- `+ New event` button → existing `/calendar/new` route; cal-ev click → existing `onEventClick` (UnifiedCalendar prop)
- Bilingual day-of-week header (`['Sun','Mon','Tue','Wed','Thu','Fri','Sat']` / `['أحد','إثن','ثلا','أرب','خمي','جمع','سبت']`) — Arabic-Indic digit rendering for day numbers and overdue counters carried forward from existing `toArDigits` utility (researcher confirms current location)
- Responsive 320 / 640 / 768 / 1024 / 1280 px with ≥44×44 touch targets on every kcard control and calendar pill
- Mobile (<640px) calendar = **pageable single-week list** (one week at a time, prev/next buttons, "Today" jumps to active week, reuse Phase 38 `.week-list` aesthetic)
- Mobile (<640px) kanban inherits horizontal-scroll (touch-momentum, RTL-correct scroll direction)
- Per-page Skeleton placeholders (`<Skeleton>` shape-matching kcard rows + cal cells)
- Legacy cut: delete `EnhancedKanbanBoard.tsx`, `UnifiedKanbanBoard.tsx`, `UnifiedKanbanCard.tsx`, `UnifiedKanbanColumn.tsx`, `UnifiedKanbanHeader.tsx`, `components/unified-kanban/utils/swimlane-utils.ts`, `components/unified-kanban/utils/wip-limits.ts`, `components/ui/kanban.tsx` (only if no remaining importers — researcher confirms via grep)
- Playwright E2E + visual-regression baseline + axe-core a11y gates per Phase 38 D-09 pattern

**Out of scope (deferred to other phases or backlog):**

- Swimlanes / WIP limits / bulk multi-select / realtime presence on Kanban (deferred — see `<deferred>`)
- Power-user advanced kanban view (deferred)
- Week-view + Day-view calendar reskin (deferred to Phase 42 remaining-pages)
- Real wiring for 'By dossier' / 'By owner' filter pills (visual stubs only this phase)
- Dossier drawer overlay on kcard click (Phase 41 owns)
- New backend endpoints, schema migrations, or `calendar_event.variant` column
- `EngagementKanbanDialog.tsx` and `components/kibo-ui/kanban` primitives — these serve the Phase 11 engagement workspace and are NOT part of the global Work Board reskin
- Cmd+K command palette behavior (Phase 13 ships, not touched here)

</domain>

<decisions>
## Implementation Decisions

### Area 1: Existing surface fate

- **D-01:** **Replace `/kanban` route outright.** Build fresh `frontend/src/pages/WorkBoard/WorkBoard.tsx` (or equivalent — researcher proposes barrel layout matching Phase 37 `signature-visuals/` and Phase 38 `Dashboard/widgets/`) from handoff `WorkBoardPage` verbatim. Rewrite `frontend/src/routes/_protected/kanban.tsx` to mount the new component. Mirrors Phase 38 D-03/D-04 (OperationsHub deletion). Git history is the archive — no `legacy/` folder.
- **D-02:** **Reskin month view inside existing `UnifiedCalendar.tsx`.** Do not replace the component — keep its `linkedItemType` / `linkedItemId` props intact so Phase 41 dossier drawer can mount it. Rewrite only the month-grid render block (the `eachDayOfInterval` + day-cell map) to handoff `.cal-grid`. Week and Day view modes remain visually-untouched and are deferred to Phase 42 remaining-pages.
- **D-03:** **DnD enabled only when group-by mode = `'status'`.** Wire `@dnd-kit/core` + `@dnd-kit/sortable` + `useUnifiedKanbanStatusUpdate` mutation for drag-between-columns. In any other group-by mode (`'dossier'`, `'owner'` once wired in a future phase), drag is disabled at the sensor level and `cursor: grab` falls back to `cursor: pointer`. Matches handoff CSS `cursor: grab` on `.kcard` and preserves the existing user capability that today's `EnhancedKanbanBoard` provides.
- **D-04:** **Drop swimlanes, WIP limits, bulk multi-select, and realtime presence entirely.** Delete the source files (researcher confirms importers via grep before deletion). Add a CI gate (like Phase 34's `check-deleted-components.sh`) blocking reintroduction. Capture each as a deferred idea (see `<deferred>`).

### Area 2: Toolbar wiring

- **D-05:** **WorkBoard data source = `useUnifiedKanban` with `context: 'personal'`, `mode: 'status'`, `sources: ['commitment', 'task']`.** Matches handoff '48 items across commitments and tasks · 27 overdue'. No new adapter hook (Phase 38 D-07 introduced `useWeekAhead` / `usePersonalCommitments` only because no equivalent existed — `useUnifiedKanban` already exists and is the right shape).
- **D-06:** **Filter pills 'By status / By dossier / By owner':** ship 'By status' fully wired (toggles `mode='status'`). 'By dossier' and 'By owner' render visually-correct (handoff `.filter-pill` chrome) but `aria-disabled="true"` with `title="Coming soon"`. Phase 39 handoff visual is preserved without false interactivity. Real wiring deferred to a future phase that extends `KanbanColumnMode` union.
- **D-07:** **Search input filters client-side over already-loaded items.** Match against `title`, `title_ar`, `dossier.name`, `dossier.name_ar`, `assignee.name`. No new API parameter, no new endpoint. Cmd+K (Phase 13) remains the global search; this is a board-local filter only.
- **D-08:** **Column counts + '27 overdue' chip computed client-side from `useUnifiedKanban` response.** `column.count = items.filter(it => it.column_key === col.key).length`. `overdueCount = items.filter(it => it.is_overdue).length`. `WorkItem.is_overdue` is already present on the response shape. No new aggregate endpoint.

### Area 3: Click + create targets

- **D-09:** **kcard click opens existing work-item detail surface.** Researcher confirms which detail dialog matches each `WorkItem.source`: `'task'` → existing `TaskDetailDialog` (or equivalent), `'commitment'` → existing commitment detail flow. Phase 41 dossier drawer will overlay this without changing the Phase 39 wiring. No new drawer in Phase 39.
- **D-10:** **`cal-ev` click reuses `UnifiedCalendar`'s existing `onEventClick` prop.** No new event-detail component. Whatever the current `/calendar` route does on event click stays the same — this phase only changes the visual chrome.
- **D-11:** **`+ New event` button (calendar toolbar) → existing `/calendar/new` route.** Already wired by today's calendar route. No new modal.
- **D-12:** **`+ New item` button (board toolbar) + per-column `+` button → existing TaskCreate flow.** Researcher identifies exact entry point (`/tasks/new` route or `TaskCreateDialog` component). Source defaults to `'task'`. Per-column `+` may pre-fill the target `workflow_stage` (todo/in_progress/review/done) — researcher confirms whether the existing form accepts that prefill.

### Area 4: Variants + mobile collapse

- **D-13:** **Calendar event variant mapping:** `event_type === 'travel'` → `.travel` class (warn-soft); `status === 'pending'` → `.pending` class (line-soft); else default (accent-soft). Researcher inspects the live `CalendarEvent` interface (`frontend/src/hooks/useCalendarEvents.ts` or `types/calendar-sync.types.ts`) to confirm exact field names. **If neither field exists with these values:** mark as Claude's Discretion — render all events as default accent-soft and emit a single `console.warn` so backend integration can be done later without UI changes.
- **D-14:** **7×5 grid padding = handoff verbatim.** Pad the grid start with prev-month tail days and end with next-month head days, all rendered with `.cal-cell.other` class (`opacity: 0.4`). Other-month cells are clickable and navigate to that month (small UX win without diverging from handoff visual).
- **D-15:** **Mobile (<640px) calendar = pageable single-week list.** Show one week at a time. Render as Phase 38 `.week-list` aesthetic (one row per day, stacked event pills inline). Toolbar gains prev/next week buttons; "Today" jumps to the active week. Preserves vertical reading order and avoids a 35-row scroll page.
- **D-16:** **Mobile (<640px) kanban = same horizontal-scroll.** Touch-swipe through 300px columns. Verify `scroll-behavior: smooth` + touch-momentum on iOS + RTL-correct scroll direction (in RTL the first column lands on the right edge). No layout pivot.

### Claude's Discretion

- Folder layout for the new WorkBoard (e.g., `frontend/src/pages/WorkBoard/{WorkBoard.tsx, KCard.tsx, BoardColumn.tsx, BoardToolbar.tsx, index.ts}`) — researcher proposes, planner finalizes; mirror Phase 37 `signature-visuals/` and Phase 38 `Dashboard/widgets/` patterns
- Exact `priority` → chip-color mapping (`urgent`/`high` → `chip-danger`, `medium` → `chip-warn`, `low` → no extra class) — verify against handoff `app.css` `.chip-*` classes
- Exact `kind` → chip-color mapping (`source==='commitment'` → `chip-accent`, `source==='task'` → `chip-info`) — verify against handoff
- Skeleton fidelity — shape-match column outline + 3 kcard skeletons per column, plus 5×7 cal-cell skeletons; Phase 38 `<Skeleton>` already shipped
- Exact owner-avatar initials algorithm — first letter of `assignee.name` + first letter of last word, fallback to "?" when null; verbatim from handoff `kcard-owner` (`KA` / `NQ` / `AB`)
- Researcher decides whether `components/ui/kanban.tsx` (shadcn-ui-kit primitives) has importers outside the deleted `EnhancedKanbanBoard` — if not, delete; if yes, keep as-is and exclude from cut

### Folded Todos

None — no pending todos matched Phase 39 scope.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Handoff source of truth (verbatim port targets)

- `/tmp/inteldossier-handoff/inteldossier/project/src/pages.jsx#L113-178` — `WorkBoardPage` JSX (toolbar, BOARD_COLS map, kcard anatomy, kcard.overdue / kcard.done logic, click handler shape)
- `/tmp/inteldossier-handoff/inteldossier/project/src/pages.jsx#L179-235` — `CalendarPage` JSX (toolbar with month/week/day toggle, `cal-grid`, day-of-week header, `cal-cell.other` padding, `cal-cell.today`, `cal-ev` variants)
- `/tmp/inteldossier-handoff/inteldossier/project/src/data.jsx#L302+` — `BOARD_COLS` shape (`key`, `title`, `count`, `color`, `items[]` with `id`, `kind`, `priority`, `title`, `due`, `dossier`, `flag`, `owner`, `overdue?`, `done?`)
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css#L390-411` — kanban CSS (`.col`, `.col-head`, `.col-count`, `.kcard`, `.kcard.overdue`, `.kcard.done`, `.kcard-top`, `.kcard-title`, `.kcard-foot`, `.kcard-dossier`, `.kcard-owner`)
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css#L413-423` — calendar CSS (`.cal-grid`, `.cal-dow`, `.cal-cell`, `.cal-cell.other`, `.cal-cell.today .cal-d`, `.cal-d`, `.dir-chancery .cal-d`, `.cal-ev`, `.cal-ev.travel`, `.cal-ev.pending`)
- `/tmp/inteldossier-handoff/inteldossier/project/reference/kanban.png` — LTR reference image (visual regression baseline)
- `/tmp/inteldossier-handoff/inteldossier/project/reference/kanban-arabic.png` — RTL reference image (visual regression baseline + RTL-correct kcard.overdue edge verification)
- `/tmp/inteldossier-handoff/inteldossier/project/reference/calendar.png` — Calendar reference image
- `/tmp/inteldossier-handoff/inteldossier/project/reference/work-items.png` — Work-item detail reference (informational; click-target rendering verified against this)

### Project requirements + roadmap

- `.planning/REQUIREMENTS.md#L71-73` — BOARD-01, BOARD-02, BOARD-03 (success criteria)
- `.planning/ROADMAP.md#L243-264` — Phase 39 phase block (Goal, Depends on, Plans hint — note: ROADMAP's plan list under Phase 39 is a typo carrying Phase 37 plan names; planner should derive new Phase 39 plan names from this CONTEXT.md and BOARD-01..03)

### Prior phase context (locked decisions feeding Phase 39)

- `.planning/phases/33-token-engine/33-CONTEXT.md` — D-12 / D-16 token utilities (`bg-line-soft`, `bg-warn-soft`, `text-warn`, `text-ink-mute`, `bg-accent-soft`, `text-accent-ink`, `border-line`, `border-line-soft` — all consumed by `.kcard*`, `.col*`, `.cal-*`)
- `.planning/phases/36-shell-chrome/36-CONTEXT.md` — AppShell wrapper (Phase 39 routes mount inside; classification chrome stays untouched)
- `.planning/phases/37-signature-visuals/37-CONTEXT.md` — `<DossierGlyph flag={iso} size={14}/>` consumed in kcard footer (D-09..D-12 flag/symbol/initials fallback already shipped)
- `.planning/phases/38-dashboard-verbatim/38-CONTEXT.md` — D-01/D-02 verbatim handoff port pattern; D-09 wave structure (Wave 0 infra → Wave 1 widgets → Wave 2 E2E + legacy cut); D-11 per-widget Skeleton; D-04 legacy cut without archive

### Existing codebase entry points (reuse — do NOT rebuild)

- `frontend/src/types/work-item.types.ts` — `WorkItem`, `WorkSource`, `WorkStatus`, `Priority`, `WorkflowStage`, `KanbanColumnMode`, `KanbanContextType`, `WorkItemAssignee` (single source of truth)
- `frontend/src/hooks/useUnifiedKanban.ts` (or wherever `useUnifiedKanban` / `useUnifiedKanbanStatusUpdate` / `useUnifiedKanbanRealtime` live) — primary data hook for the new WorkBoard
- `frontend/src/components/calendar/UnifiedCalendar.tsx` — calendar component to be reskinned in place
- `frontend/src/hooks/useCalendarEvents.ts` — `CalendarEvent` shape + filter params
- `frontend/src/routes/_protected/kanban.tsx` — route to be rewritten
- `frontend/src/routes/_protected/calendar.tsx` — route stays; only mounted component output changes
- `frontend/public/locales/{en,ar}/unified-kanban.json` — i18n namespace (extend with new keys: filter pills, overdue chip, "New item" copy)
- `frontend/public/locales/{en,ar}/calendar.json` — i18n namespace (extend with new keys: day-of-week short labels, "New event" copy, week-list nav)

### Existing dependencies (already installed — do NOT add new)

- `@dnd-kit/core` ^6.3.1, `@dnd-kit/sortable` ^10.0.0, `@dnd-kit/utilities` ^3.2.2
- `date-fns` ^4.1.0
- `@tanstack/react-virtual` ^3.13.23 (available if column virtualization becomes needed at high item counts; researcher decides — likely not required at handoff scale)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable assets

- **`useUnifiedKanban` family** — primary data hook. Already supports `context`, `mode`, `sources`, status mutations, realtime. Phase 39 consumes as-is; the realtime layer can stay running silently (just don't render presence avatars or live-typing indicators in the new chrome).
- **`<DossierGlyph flag size>`** (Phase 37) — drop-in for kcard footer + cal-ev row. Maps `flag` (ISO 2-letter or non-country symbol) to one of 24 hand-drawn flags / symbol / initials fallback.
- **`UnifiedCalendar.tsx`** — month grid driven by `useCalendarEvents` + `eachDayOfInterval` + day-grouped events Map. Phase 39 rewrites the cell render block; the data layer is unchanged.
- **`@/components/empty-states/DashboardEmptyState.tsx`** (Phase 38 D-12 precedent) — empty-state pattern; reuse if handoff doesn't specify a board/calendar empty-state.
- **i18n namespaces `unified-kanban` and `calendar`** — already exist in EN + AR; just extend with the handoff-specific copy.
- **Phase 38 `.week-list`** (`/tmp/.../app.css#L309-313`) — visual aesthetic carried into mobile calendar week-list view.

### Established patterns

- **Verbatim port from `/tmp/inteldossier-handoff/inteldossier/`** — Phase 37 (signature-visuals) and Phase 38 (dashboard) both ported handoff JSX 1:1. Phase 39 follows the same discipline: every CSS rule, spacing value, border-radius, chip shape comes from handoff files; data wiring and RTL/a11y are additive.
- **Token-driven styling** — Phase 33 D-12/D-16 mandate that all colors/borders/surfaces/inks come from CSS vars (`--surface`, `--line`, `--line-soft`, `--accent`, `--accent-soft`, `--accent-ink`, `--warn`, `--warn-soft`, `--danger`, `--ink`, `--ink-mute`, `--ink-faint`). No hex codes, no Tailwind color literals. The handoff CSS already uses these vars.
- **Logical properties for RTL** — `border-inline-start`, `padding-inline-end`, `margin-inline-start` everywhere. BOARD-02 explicitly mandates this for `.kcard.overdue` so the danger edge sits on the reading-start side in both LTR and RTL. Forbidden: `border-left`, `padding-right`, `ml-*`, `pr-*`.
- **Plan structure (Phase 38 D-09)** — Wave 0 infra (folder scaffold, route stub, i18n keys, visual-regression baseline capture) → Wave 1 parallelizable widgets (kcard, board column, board toolbar, calendar grid, calendar pill, week-list mobile, etc.) → Wave 2 E2E (Playwright + axe + visual-regression + legacy cut sweep + check-deleted-components.sh CI gate).
- **Per-page Skeleton placeholders (Phase 38 D-11)** — shape-matching outlines, no fullscreen spinner on refetch.

### Integration points

- **Routes:** `/kanban` (rewritten), `/calendar` (component swap inside route — route file stays the same shape as today's, just mounts the reskinned `UnifiedCalendar`)
- **AppShell (Phase 36):** both routes already mount inside AppShell; classification chrome + sidebar + topbar untouched
- **i18n:** extend `unified-kanban` and `calendar` namespaces; do NOT create new namespaces (per CLAUDE.md "single source of truth" terminology)
- **Phase 41 dossier drawer (future):** `UnifiedCalendar` keeps `linkedItemType`/`linkedItemId` props so the future drawer can mount a dossier-scoped calendar without modification
- **CI gates:** add `check-deleted-components.sh` entries for the swimlane/WIP/bulk file paths (Phase 34 precedent)

</code_context>

<specifics>
## Specific Ideas

- Handoff `kcard.overdue` example shows due text rendered as "Overdue 62d" / "Overdue 147d" (mono, var(--danger)). Format: `Overdue {Math.abs(days_until_due)}d`. Today/non-overdue: `'25 Apr'` / `'Today'`. Researcher derives the formatter from `WorkItem.deadline` + `is_overdue` + `days_until_due`.
- Handoff `kcard-owner` is a 20×20 circle with `var(--accent-soft)` background, `var(--accent-ink)` text, font-size 10px, font-weight 600 — owner initials only. The avatar is NOT a photo. Existing `WorkItemAssignee.avatar_url` is ignored on the kcard footer (avatars surface elsewhere).
- Handoff column-mode CSS uses `--font-mono` for column count (`'12'`, `'7'`, `'5'`) and overdue chip (`'27 overdue'`). Bilingual: in `ar` locale, switch to Arabic-Indic digits via existing `toArDigits` (handoff `data.jsx` exports this — verify the same exists in repo).
- Handoff calendar `.cal-d` font sizes: 14px default, 17px in Chancery direction (`.dir-chancery .cal-d`). Token-driven via existing direction class.
- Handoff `dowEn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']` and `dowAr = ['أحد','إثن','ثلا','أرب','خمي','جمع','سبت']`. Use these exact short labels — do not import a date-fns locale-formatted version (verbatim).
- `BOARD_COLS` keys = `'todo' | 'doing' | 'review' | 'done'`. Map to `WorkflowStage = ['todo', 'in_progress', 'review', 'done', 'cancelled']`. Mapping: handoff `doing` → app `in_progress`. The fifth stage `cancelled` is NOT shown in the WorkBoard (cancelled work items hidden from the board entirely — researcher verifies handoff omits it intentionally and confirms with user if uncertain).

</specifics>

<deferred>
## Deferred Ideas

These came up during discussion but belong outside Phase 39 scope. Capture so future phases can pick them up.

- **Swimlanes (by assignee or priority)** — existing `EnhancedKanbanBoard` capability. Drop in Phase 39, surface again only if user demand emerges in production. Backlog.
- **WIP limits with column warnings** — existing capability, deferred. Could return as a Phase 42+ enhancement once handoff visual stabilizes.
- **Bulk multi-select operations on Kanban** (multi-select, bulk-move, bulk-assign) — existing capability, deferred. Backlog.
- **Realtime presence on Kanban** — existing `useUnifiedKanbanRealtime` capability surfaced presence avatars. Drop in Phase 39 (handoff has no presence chrome). Realtime _data_ refresh stays — only the _presence UI_ is dropped.
- **Power-user advanced kanban view** (toggle to legacy capabilities) — considered as Area-1 option; not chosen. Backlog if production users push back on the simpler reskin.
- **Real wiring for 'By dossier' and 'By owner' filter pills** — visual stubs only this phase. Future phase extends `KanbanColumnMode` union to add `'dossier' | 'owner'` and implements client-side grouping (or server-side aggregation if item counts grow large).
- **Week-view + Day-view calendar reskin** — out of scope this phase; deferred to Phase 42 remaining-pages.
- **Week swipe gestures on mobile calendar** — basic prev/next buttons ship in Phase 39; touch-swipe gesture refinement is a Phase 43 polish concern.
- **Calendar event variant column on backend** (`calendar_event.variant` enum) — not needed if `event_type` + `status` cover travel + pending. Variant column would be a follow-up if richer styling categories emerge.

### Reviewed Todos (not folded)

None — no pending todos surfaced from `gsd-sdk query todo.match-phase 39`.

</deferred>

---

_Phase: 39-kanban-calendar_
_Context gathered: 2026-04-25_
