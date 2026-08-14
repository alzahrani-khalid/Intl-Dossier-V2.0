---
phase: 87-linear-affordances
plan: 04
subsystem: ui
tags: [empty-states, i18n, linear-tokens, rtl, react, lucide]

# Dependency graph
requires:
  - phase: 87-linear-affordances
    provides: F26 UI-SPEC copy matrix + Pattern A/B interaction contract; 87-PATTERNS assignment 7 token-swap table
provides:
  - Linear-reskinned EmptyState (surface-raised icon wash, ink-mute/ink-faint text, .btn-primary/.btn-ghost recipes — no ui/button chrome)
  - ListEmptyState extended to all 9 core-surface entities (+topic/working_group/elected_official/work_item) with a filtered-empty branch (filtered/onClearFilters props) that wins over create and never renders a disabled-accent button
  - empty-states.json copy matrix (EN+AR) — list.<entity>.{title,description,cta} for the 9 surfaces + list.filtered.{title,description,clear}, voice-purged
  - 6 dossier-overview section empties conformed to Pattern B (single glyph + one line, zero legacy bg-muted/text-muted-foreground)
  - ListEmptyState.test.tsx — per-entity render + CTA-gating + filtered-branch regression lock
affects: [87-06-wiring, 87-07-wiring, 87-08-wiring, 87-09-kanban, 87-10-consolidated-signoff]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Empty-state CTA gating is mechanical: no onCreate → no CTA rendered (never a disabled accent button); RLS remains the write gate (A3 resolution)'
    - 'Filtered-empty branch keyed off a `filtered` prop takes precedence over the create state and offers a ghost recovery action, not the create CTA'
    - 'Pattern B tab empties: one non-directional lucide glyph (h-5 text-ink-faint) + one line (text-ink-mute), no wash/heading-tier/card-chrome'

key-files:
  created:
    - frontend/src/components/empty-states/__tests__/ListEmptyState.test.tsx
  modified:
    - frontend/src/components/empty-states/EmptyState.tsx
    - frontend/src/components/empty-states/ListEmptyState.tsx
    - frontend/src/i18n/en/empty-states.json
    - frontend/src/i18n/ar/empty-states.json
    - frontend/src/components/dossier/dossier-overview/sections/ActivityTimelineSection.tsx
    - frontend/src/components/dossier/dossier-overview/sections/KeyContactsSection.tsx
    - frontend/src/components/dossier/dossier-overview/sections/CalendarEventsSection.tsx
    - frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx
    - frontend/src/components/dossier/dossier-overview/sections/RelatedDossiersSection.tsx
    - frontend/src/components/dossier/dossier-overview/sections/WorkItemsSection.tsx
    - frontend/src/i18n/en/dossier-overview.json
    - frontend/src/i18n/ar/dossier-overview.json

key-decisions:
  - 'ListEmptyState primary label reads `list.<entity>.cta` (matrix key) with a legacy `.create`/`.createFirst` fallback — TourableEmptyState (separate live component) keeps reading `.create`, so its test stays green'
  - 'New entities (topic/working_group/elected_official/work_item) carry only the matrix triple (title/description/cta); `.create`/`.firstTitle` are intentionally absent so the AFF-04 count-grep is exact and there is no CTA-string duplication'
  - 'ActivityTimeline/KeyContacts collapse to one line (the `.title`, rewritten to a full one-liner); their `.description` keys are kept in JSON for EN/AR parity but no longer rendered — only RelatedDossiers deletes `.description` per the named fix'
  - "Kept the pre-existing outline 'Add key contact' action in KeyContactsSection's empty (a ghost-style action the plan permits, and outside the audited empty-branch source)"

patterns-established:
  - 'F26 empty-state contract: Pattern A rich (icon wash + heading + one-sentence body + ONE .btn-primary CTA, or no CTA) vs Pattern B minimal (glyph + one line), both on Linear tokens'

requirements-completed: [AFF-04]

# Metrics
duration: 21 min
completed: 2026-07-07
---

# Phase 87 Plan 04: F26 Empty-State Infrastructure Summary

**Reskinned EmptyState to Linear tokens, extended ListEmptyState to all 9 core surfaces with a filtered-empty branch and mechanical CTA gating, transcribed the UI-SPEC §F26 copy matrix into empty-states.json (EN+AR), and conformed the 6 dossier-overview tab empties to Pattern B — so Wave-2 plans only pass props.**

## Performance

- **Duration:** ~21 min
- **Started:** 2026-07-07T11:01:40Z
- **Completed:** 2026-07-07T11:22:26Z
- **Tasks:** 3
- **Files modified:** 13 (12 modified + 1 created)

## Accomplishments

- **EmptyState Linear reskin** (all 4 variants): `bg-muted`→`bg-surface-raised` icon wash, `text-muted-foreground`→`text-ink-mute`/`text-ink-faint`, `text-foreground`→`text-ink`; the accent CTA renders the `.btn-primary` recipe and secondary/recovery actions `.btn-ghost` (drops the `ui/button` variant chrome, keeps the `QuickAction` prop API so out-of-scope consumers compile). No shadow, no gradient.
- **ListEmptyState extension**: `EntityType` union + `entityConfig` gain `topic`/`working_group`/`elected_official`/`work_item` (Tag/Users/Landmark/ListTodo glyphs); new `filtered`/`onClearFilters` props add a filtered-empty branch that renders `list.filtered.*` + a ghost "Clear filters" and — per the spec — never the create CTA (filtered wins over create). No `onCreate` → zero accent buttons in the DOM (never a disabled-accent button).
- **Copy matrix (EN+AR)**: `list.<entity>.{title,description,cta}` for the 9 core surfaces transcribed verbatim from the UI-SPEC matrix + `list.filtered.{title,description,clear}`; the Title-Case/`we` debt purged on every touched key; EN/AR key parity proven.
- **Pattern-B tab audit**: all 6 dossier-overview section empties (Activity, KeyContacts, Calendar, Documents, RelatedDossiers, WorkItems) retokenized to a single non-directional glyph + one line; RelatedDossiers collapsed its two-tier empty to `No relationships mapped for this dossier.` (dropping `.description`); WorkItems copy aligned to the dossier-tab register (`… linked to this dossier.`).
- **Regression lock**: `ListEmptyState.test.tsx` (9 cases) covers per-entity render, CTA gating both ways, the filtered branch, and the surface-raised wash.

## Task Commits

Each task committed atomically:

1. **Task 1 (TDD): EmptyState reskin + ListEmptyState extension + tests** — `82c82dce` (feat; test written first → RED 8/9, then GREEN 13/13)
2. **Task 2: empty-states.json copy matrix (EN+AR)** — `4d382441` (feat)
3. **Task 3: Pattern-B audit of 6 dossier-overview section empties** — `7c7ee633` (feat)

**Plan metadata:** this SUMMARY commit (docs).

## Files Created/Modified

- `frontend/src/components/empty-states/EmptyState.tsx` — Linear token reskin across all 4 variants; `.btn-primary`/`.btn-ghost` action recipes replace `ui/button`
- `frontend/src/components/empty-states/ListEmptyState.tsx` — union+config extension, `filtered`/`onClearFilters` props + filtered branch, `.cta` primary label
- `frontend/src/components/empty-states/__tests__/ListEmptyState.test.tsx` — new regression lock
- `frontend/src/i18n/{en,ar}/empty-states.json` — F26 copy matrix + filtered keys; de-`we` search copy
- `frontend/src/components/dossier/dossier-overview/sections/{ActivityTimeline,KeyContacts,CalendarEvents,Documents,RelatedDossiers,WorkItems}Section.tsx` — Pattern-B empty branches
- `frontend/src/i18n/{en,ar}/dossier-overview.json` — one-liner empty copy; RelatedDossiers `.description` deleted; workItems empties re-registered

## Decisions Made

- **Primary label reads `.cta`** with legacy `.create` fallback (see frontmatter). TourableEmptyState is a separate live component that still reads `.create`; its test asserts `list.<entity>.create` and stays green because those keys are preserved.
- **New entities carry only the matrix triple** — avoids duplicating the AFF-04 count-grep strings and keeps the copy tight.
- **Unused `.description` keys retained** for ActivityTimeline/KeyContacts to hold EN/AR parity; only RelatedDossiers deletes it (its named fix).

## Deviations from Plan

None — plan executed exactly as written. (The `.cta` label source and the retained-but-unrendered `.description` keys are the plan's own instructions/behaviour lines, not deviations.)

## Issues Encountered

None. The lint pre-commit auto-formatted (prettier) the reskinned EmptyState indentation on commit — expected, no content change.

## Verification

- `pnpm --dir frontend exec vitest run src/components/empty-states` → **13 passed** (ListEmptyState 9 + TourableEmptyState 4)
- `pnpm --dir frontend exec vitest run src/components/dossier` → **228 passed** (36 files; 3 skipped / 19 todo pre-existing)
- `pnpm --dir frontend exec tsc --noEmit` → **exit 0**
- `pnpm --dir frontend lint --max-warnings 0` → **exit 0** (eslint + i18n-namespace + duplicate-rtl + bootstrap-parity + date-format)
- Task 1 greps: no `bg-muted`/`text-muted-foreground`/`text-foreground` in EmptyState.tsx; new-entity token count 9 (≥8)
- Task 2 greps: no `We couldn`/`We encountered` (EN); matrix-string count 4; EN/AR parity exit 0
- Task 3 greps: all 6 EmptyState bodies print 0 legacy tokens; no `.btn-primary`/accent inside any empty branch; `No relationships mapped for this dossier.` count 1; RelatedDossiersSection `empty.*description` count 0; no `we couldn`/`we encountered`/`get started` (EN); EN/AR parity exit 0

**Deferred (self-verification boundary):** visual/RTL render sign-off of the reskinned empties (both locales × dark/light) rolls into the **87-10 consolidated human render sign-off** — no consumer wires ListEmptyState until Wave 2 (87-06..87-09), so there is no live surface to screenshot yet.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- AFF-04 component + copy delivered and machine-checked. Wave-2 wiring plans (87-06..87-09) can drop `<ListEmptyState entityType=… onCreate=… filtered=… onClearFilters=… />` into each surface and get spec-conformant Pattern A + filtered behaviour.
- No blockers. Requires 87-05 (URL-state normalization) to supply the `filtered`/`hasActiveFilters` signal the wiring plans pass in.

## Self-Check: PASSED

- Key file exists: `[ -f frontend/src/components/empty-states/__tests__/ListEmptyState.test.tsx ]` ✓
- Commits present: `git log --grep="87-04"` returns 82c82dce + 4d382441 + 7c7ee633 ✓
- All task `<acceptance_criteria>` re-run and pass (greps above) ✓
- Plan `<verification>` commands re-run: empty-states vitest 13/13, lint 0, tsc 0 ✓

---

_Phase: 87-linear-affordances_
_Completed: 2026-07-07_
