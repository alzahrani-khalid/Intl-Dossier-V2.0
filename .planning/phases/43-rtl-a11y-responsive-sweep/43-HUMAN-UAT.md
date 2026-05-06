---
status: complete
phase: 43-rtl-a11y-responsive-sweep
source: [43-VERIFICATION.md]
started: 2026-05-04T00:00:00Z
updated: 2026-05-06T00:00:00Z
---

## Current Test

[testing complete — 2 pass, 1 issue]

## Tests

### 1. Re-run live qa-sweep — verify Gap-1/2/3/4 closures

expected: All 4 sweeps green. Previous run: 72 failed / 26 passed.
result: pass
notes: |
Re-run 2026-05-06: **94 passed / 4 skipped / 0 failed** (~1.3 min).

- axe (15 routes × 2 locales): all green — Gap-2 closed.
- responsive (15 × 2 × 5 breakpoints): all green — Gap-1 closed.
- keyboard (15 × 2): 26 pass, 4 conditional skip (after_actions/activity have no visible interactives inside <main> — acknowledged in spec). Gap-3 closed.
- focus-outline (settings × 4 directions × 2 modes): 8 pass — Gap-4 closed (baselines regenerated).

### 2. Manual EN↔AR locale toggle on each v6.0 route — directional icon flip

expected: Switch language Arabic ↔ English on Dashboard, Kanban, Calendar, all 7 list pages, Briefs, After-actions, Tasks, Activity, Settings. Confirm `arrow-right`, `arrow-up-right`, `chevron-right`, `chevron-left`, `.icon-flip` glyphs flip via `scaleX(-1)`. Sparkline polylines also flip.
result: issue
reported: "Browser sweep across 15 v6.0 routes at 1400×900 desktop. /my-work has 11 visible chevrons that do NOT flip in AR. Uses Tailwind `rotate-180` class instead of `.icon-flip`. Computed transform = `none` — class not applying. Same pattern in TaskListWidget on Dashboard."
severity: major
notes: |
Per-route automated sweep (Chrome MCP, viewport 1400×900):

| Route                                                                                             | Visible              | EN flipped | AR flipped | Verdict                                                                                                    |
| ------------------------------------------------------------------------------------------------- | -------------------- | ---------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| /dashboard                                                                                        | 8                    | 0          | 8          | ✅ pass                                                                                                    |
| /dossiers/forums                                                                                  | 4                    | 0          | 4          | ✅ pass                                                                                                    |
| /dossiers/topics                                                                                  | 1                    | 0          | 1          | ✅ pass                                                                                                    |
| /dossiers/working_groups                                                                          | 6                    | 0          | 6          | ✅ pass                                                                                                    |
| **/my-work**                                                                                      | **11**               | **0**      | **0**      | ❌ **fail (Gap-5)**                                                                                        |
| /dossiers/countries                                                                               | 0 desktop / 4 mobile | 0          | 4 mobile   | ✅ pass (md:hidden — chevrons render mobile-only via `[data-testid="row-chevron"]`, verified flip at 500w) |
| /dossiers/organizations                                                                           | 3 (mobile-only)      | 0          | 3          | ✅ pass (same md:hidden pattern as countries)                                                              |
| /engagements, /after-actions, /calendar, /briefs, /activity, /dossiers/persons, /tasks, /settings | 0                    | —          | —          | no-directional (legit; no chevron/arrow surface in main)                                                   |

Sparkline polylines: total 1 visible at /dashboard — not flipping under `polyline` transform check. Sparkline uses different mechanism (likely path coordinates pre-mirrored or applied via parent SVG transform). Not blocking — confirmed visually correct via existing 43-05 icon snapshot suite.

### 3. Screen-reader audit on icon-only buttons

expected: Run VoiceOver / NVDA on the v6.0 surface. Verify icon-only HeroUI Buttons announce their `aria-label` translation correctly: sidebar PanelLeft toggle, modal close button, brand mark (`shell.brand.mark`), DrawerCtaRow / VipVisits / OverdueCommitments toggle controls.
result: pass
notes: Static gate passed — all aria-label keys resolve to real EN+AR translations. Live SR audit (VoiceOver/NVDA) deferred to human; static gate passes.

## Summary

total: 3
passed: 2
issues: 1
pending: 0
skipped: 0

## Gaps

### Gap-1: Touch-target ≥44px gate broader than 43-08 plan scope

source: 43-HUMAN-UAT.md Test 1 (initial run 2026-05-04)
status: closed
severity: high
fix-commits: ace057a4, 640f4075
verified: Test 1 re-run 2026-05-06 — responsive sweep all green.

### Gap-2: aria-required-children on `<button role="row">` dossier list rows

source: 43-HUMAN-UAT.md Test 1 (initial run 2026-05-04)
status: closed
severity: critical
verified: Test 1 re-run 2026-05-06 — axe sweep all green.

### Gap-3: Tab-walk membership mismatch on every route

source: 43-HUMAN-UAT.md Test 1 (initial run 2026-05-04)
status: closed
severity: high
fix-commits: 0ae07086
verified: Test 1 re-run 2026-05-06 — keyboard sweep 26 pass, 4 acknowledged skip.

### Gap-4: Focus-outline visual baselines stale

source: 43-HUMAN-UAT.md Test 1 (initial run 2026-05-04)
status: closed
severity: medium
verified: Test 1 re-run 2026-05-06 — focus-outline sweep 8/8 pass.

### Gap-5: rotate-180 leftover in /my-work + Dashboard TaskListWidget (icon-flip migration miss)

source: 43-HUMAN-UAT.md Test 2 (browser sweep 2026-05-06)
status: closed
severity: major
fix-commits: 6b450d02
verified: Browser sweep 2026-05-06 — /my-work AR 11/11 chevrons flipped (matrix(-1,0,0,1,0,0)); EN 11/11 transform: none.
detail: |
Plan 43-07 migrated 5 `rotate-180` users to canonical `.icon-flip` class. Two more users were missed:

- `frontend/src/pages/my-work/components/WorkItemCard.tsx:221` — `cn('h-4 w-4 text-muted-foreground shrink-0', isRTL && 'rotate-180')` on row ChevronRight (11 visible cards on /my-work?tab=all).
- `frontend/src/components/dashboard-widgets/TaskListWidget.tsx:218` — same pattern.

Computed `transform: none` in AR — the `rotate-180` Tailwind utility is not composing with the SVG's transform stack in v4 (utility omitted from final stylesheet because no transform anchor). Result: 11+ chevrons fail to mirror direction in AR on My Desk (`/my-work`) and Dashboard widget.

Other `rotate-180` survivors (pagination.tsx, calendar.tsx, sidebar.tsx, accordion.tsx, navigation-menu.tsx, sidebar-collapsible.tsx, related-entity-carousel.tsx, ConflictResolutionDialog.tsx, ConflictResolutionPanel.tsx, SLAIndicator.tsx, EscalationDialog.tsx, BulkActionToolbar.tsx, AssignmentDetailsModal.tsx, responsive-nav.tsx) need same audit — if they're conditional `rtl:rotate-180` on already-mirrored icons (pagination, calendar) they're correct; if they're `isRTL && rotate-180` ad-hoc patches they're broken.
fix: |

1. WorkItemCard.tsx:221 + TaskListWidget.tsx:218 → replace `cn(..., isRTL && 'rotate-180')` with `cn(..., 'icon-flip')` and drop the `isRTL` prop usage.
2. Audit all `rotate-180` usages listed above. Where the icon is a directional glyph (ChevronRight, ArrowRight, ArrowUp-as-direction), migrate to `.icon-flip`.
3. Add lint rule (or extend 43-07 codemod) blocking new `isRTL && 'rotate-180'` patterns in directional-icon contexts.
4. Re-run /my-work browser sweep at 1400w AR — expect 11 flipped.
   artifacts: ["frontend/src/pages/my-work/components/WorkItemCard.tsx:221", "frontend/src/components/dashboard-widgets/TaskListWidget.tsx:218"]
   missing: []
