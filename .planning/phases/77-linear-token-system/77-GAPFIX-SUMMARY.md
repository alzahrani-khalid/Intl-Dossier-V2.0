---
type: gapfix-summary
phase: 77-linear-token-system
review: 77-REVIEW.md
scope: code-review H1 + M1 + M2 (dark-accent WCAG AA)
date: 2026-07-03
commits:
  - 925c0b3a # H1 + M1
  - c123a6c1 # M2
gates:
  contrast_test: green (68 assertions)
  design_system_bootstrap: green (162 tests)
  bootstrap_parity: exit 0 (fixture exit 1)
  lint: green
  type_check: green
  size_limit: green (exit 0, no budget exceeded)
  accent_brand_literal: unchanged (#5e6ad2)
---

# Phase 77 — Code-Review Gap Fix (H1 + M1 + M2)

Advisory review `77-REVIEW.md` found three dark-mode WCAG AA regressions in the
now-default Linear dark palette. All three are closed. All derived values were
computed with `culori` (`wcagContrast` / `oklch`), not guessed.

---

## H1 — dark `accent.ink` on `accent.soft` = 2.03:1 → 6.05:1 (FIXED)

**Root cause.** Dark `--accent-soft` was the **verbatim Linear primary-focus
mid-tone** `#5e69d1` — a saturated color meant as a focus/ring value — but the app
uses `accent.soft` as a **text background** (active sidebar nav, `.btn-secondary`,
`.chip-accent`, and every `bg-secondary text-secondary-foreground` call site via the
`@theme` remap). With light `--accent-ink` `#98a6ea` on it, contrast was **2.03:1**
— below AA-normal (4.5) and even AA-large (3.0). Light mode was already correct
(pale wash `#e8edff` + dark ink `#4d57b7` = 5.35:1); the defect was dark-only.

**Fix.** Re-derived dark `accent.soft` to mirror light's role but dark-canonical: a
**low-luminance accent-tinted wash in the indigo band** (same hue family as
`--accent` and `--sla-ok`), carrying the light `accent.ink` as text — the same
dark-soft pattern the semantic/SLA/status washes already use.

| token (dark)    | before                             | after                 | note                                            |
| --------------- | ---------------------------------- | --------------------- | ----------------------------------------------- |
| `--accent-soft` | `#5e69d1` (primary-focus mid-tone) | **`#242947`**         | DERIVED wash, oklch **L 0.29 · C 0.06 · h 275** |
| `--accent-ink`  | `#98a6ea`                          | `#98a6ea` (unchanged) | kept verbatim — still its surface role          |

**Measured contrast (culori `wcagContrast`):**

| pairing                                      | before       | after      | AA                  |
| -------------------------------------------- | ------------ | ---------- | ------------------- |
| dark `accent.ink` on `accent.soft`           | **2.03:1** ✗ | **6.05:1** | ✓ ≥ 4.5             |
| dark `accent.ink` on `--surface` (`#0f1011`) | 8.14:1       | 8.14:1     | ✓ (unchanged)       |
| light `accent.ink` on `accent.soft`          | 5.35:1       | 5.35:1     | ✓ (light untouched) |

`accent.ink` was left verbatim because it already clears AA in its other role
(8.14:1 on surface) and only `accent.soft` needed to move. The new `#242947` reads
as a subtle accent-tinted selected surface (distinct from the neutral surfaces:
1.35:1 vs `--surface`), matching the visual weight of the other dark soft washes.

**Three-copy invariant honored.** The value was changed in all three byte-matched
copies in the same commit — `tokens/directions.ts` (`PALETTES.linear.dark.accent.soft`),
`public/bootstrap.js` (`P.linear.dark.accent.soft`), and `index.css` `:root`
(`--accent-soft`). `scripts/check-bootstrap-parity.mjs` stays green (6 combos + 5
coercion probes + 51 `:root` checks); the bad fixture still exits 1.

---

## M1 — contrast.test.ts extended to gate derived text roles (FIXED)

`contrast.test.ts` previously gated `accent.fg`-on-`accent.base`, the ink ladder,
the semantic family, and the 6-value status palette — but **not** the derived
text-role tokens whose `directions.ts` comments assert AA. Added, for **both dark
and light**:

- `accent.ink` on `--surface` (was ungated) — the M2 reroute target.
- `accent.ink` on `accent.soft` — **the exact gap that let H1 through.**
- `sidebarInk` on `sidebar` (comment claims 13.0:1).
- `sla.{ok,risk,bad}` fg on `--surface` **and** on their own soft washes.

Suite is green at **68 assertions**. Measured margins (all ≥ 4.5):

| pairing                       | dark        | light       |
| ----------------------------- | ----------- | ----------- |
| accent.ink / accent.soft      | 6.05        | 5.35        |
| accent.ink / surface          | 8.14        | 5.77        |
| sidebarInk / sidebar          | 13.04       | 16.73       |
| sla.ok / surface · own-soft   | 7.01 · 5.76 | 5.77 · 5.44 |
| sla.risk / surface · own-soft | 9.46 · 7.76 | 5.68 · 5.37 |
| sla.bad / surface · own-soft  | 5.69 · 4.73 | 5.60 · 5.25 |

Every pre-existing assertion stayed green.

---

## M2 — `--accent` body text on surface routed to `--accent-ink` (FIXED)

`--accent` (`#5e6ad2`) is only **4.05:1 (dark) / 4.34:1 (light)** on `--surface` —
below AA-normal (both clear AA-large 3:1). It is correct and unchanged as
**fill / ring / underline / icon**; the defect is only where `text-accent` /
`text-primary` (both remap to `--accent`) render **readable normal-size text or
links on a plain surface**. Those were rerouted to **`text-accent-ink`**
(`--accent-ink`), which is culori-proven AA on surface (8.14 dark / 5.77 light) and
on the accent/`/10` washes (6.05 dark / 5.35 light) — so every rerouted usage now
clears AA regardless of the surface it sits on.

### Audit method

Full population: **401** `text-accent`/`text-primary` usages (168 + 233). Filtered
out fill washes (`bg-*/10`), icons (`size-*`, `<Icon>`, `h-4 w-4`), rings/borders/
decoration/hover, and large headings → residual candidates classified by consumer
(config-map slot vs JSX role). Consumer checks confirmed `entityColors`,
`ENTITY_TYPE_COLORS`, and `activityActionColors` all decorate **icons**, so
`lib/semantic-colors.ts` was left entirely untouched.

### Rerouted → `text-accent-ink` (69 usages, 49 files)

- **Inline text links** (`text-accent hover:underline` / link buttons): auth pages
  (Login/Register), TaskDetail, CommentItem, AssignmentDetailsModal, ContextualHelp,
  ConvertedTicketBanner, the four intelligence dashboards, CalendarEventsSection,
  ActionItemsList, StakeholderTimelineCard, DuplicateComparison, DossierContextIndicator,
  TimelineEventCard, EnhancedVerticalTimelineCard, KeyRepresentativesCard,
  EngagementHistoryCard, WebhooksPage, TicketDetail, Dashboard ActivityFeedItem,
  ProgressiveHint, DossierPicker.
- **Readable body-text labels/values on a surface**: WaitingQueue (9), ConsistencyPanel
  messages, BulkActionToolbar counts, CalendarEmptyWizard tip, WhatIfScenarioPanel,
  AddDeliverableDialog weight, DeliverablesTimeline progress, MeetingMinutesCard,
  ComplianceViolationAlert, ImportValidationResults, OnboardingChecklist (2),
  ApprovalChain, AnalyticsPreviewOverlay text, SearchableSelect "+", ContextualHelp code.
- **Selected/active-state label text**: VisualizationSelector (2), EntitySelector (2),
  AIFieldAssist, WorkflowBuilder completed-step, ScenarioComparison (2),
  GeographicVisualization table cell.
- **Editor link marks**: PositionEditor `class: 'text-accent underline'` (2).
- **Bare text-color functions in `*.types.ts`** (return a text class for a label/value,
  no sibling `bg`): `getUrgencyColor` (engagement-recommendation), `getReasonColor` +
  `getSimilarityColor` (dossier-recommendation), `getImpactLevelColor` (scenario-sandbox),
  plus `ConsistencyPanel` score→color.

### Left on `--accent` (per the review's fill/icon/large carve-out)

- **Badge/chip config maps** — `{bg, text, border}` / `{bg, text}` where the text
  rides on a sibling `bg-accent/10` wash: all of `lib/semantic-colors.ts`
  (dossierType/status/priority/activity/interaction colors), and the chip entries in
  `availability-polling`, `compliance`, `field-history`, `meeting-minutes`,
  `commitment`, `commitment-deliverable`, `legislation`, `calendar-conflict`,
  `sla`, `DossierTypeGuide`, `NotificationsWidget`/`EventsWidget`/`TaskListWidget`.
- **Icon-tint color maps** — `color`/`text` applied to an `h-4 w-4` icon or an
  `icon:` slot: `entityColors` (QuickNavigationMenu), `ENTITY_TYPE_COLORS`
  (EnhancedActivityFeed), `activityActionColors` (icon badge), `DossierLinksWidget`,
  `DossierFirstSearchResults`, `ConvertMilestoneDialog`, `ActivityFeedFilters`,
  `ActivityStatistics`, `FilterPresetsSection`, `CalendarEmptyWizard` template icon,
  `AnalyticsPreviewOverlay` chart icon, `templateIconColors` (sample-data),
  Sparkles/prompt.icon/template.icon, pull-to-refresh spinner.
- **Large / bold headings** (AA-large 3:1, and `--accent` passes 4.05/4.34 > 3):
  EnhancedVerticalTimelineCard prominent date (`text-base/lg font-bold`), and the
  bold stat values.
- **Fill step indicators** — `bg-primary-foreground text-primary` (accent on a white
  chip): form-wizard, WorkflowBuilder active step, BriefingBookBuilder.

`--accent` (`#5e6ad2`) itself was **not** touched — no token literal changed in M2,
so the three-copy parity guard is unaffected by this commit.

---

## Verification (Definition of Done)

- `vitest run tests/unit/design-system/contrast.test.ts` — green, 68 assertions incl.
  `accent.ink`-on-`accent.soft` ≥ 4.5 in both modes.
- `node scripts/check-bootstrap-parity.mjs` — exit 0; bad fixture exit 1.
- `vitest run tests/unit/design-system tests/bootstrap` — 162 passed.
- `pnpm run lint` (eslint --max-warnings 0 + i18n + rtl + parity) — green.
- `pnpm type-check` — green.
- `pnpm exec size-limit` — exit 0, no budget exceeded.
- `--accent` still `#5e6ad2`.
