---
phase: 87-linear-affordances
plan: 10
subsystem: ui
tags: [gate, validation, render-signoff, rtl, vitest, human-checkpoint]

# Dependency graph
requires:
  - phase: 87-linear-affordances
    provides: 87-01..87-09 — all four Linear affordances (F23 peek / F24 Filter+Display / F25 ⌘K / F26 empty states) wired across the nine core surfaces
provides:
  - Phase gate closed — integrated tree green end-to-end, 87-VALIDATION.md stamped nyquist_compliant, operator render sign-off recorded

status: complete
signed_off: 2026-07-13
---

# 87-10 — Phase gate + consolidated EN/AR render sign-off

> Authored from git evidence + the operator-signed checkpoint. NOT re-executed —
> the render walk and gates were run on the integration branch
> `drover/run-20260709-104447`; this plan records their outcome and closes the phase.

## What this gate proved

The four Linear affordances hold together on the integrated tree (all nine core
surfaces, dark mode, EN/LTR + AR/RTL):

- **F23** right-peek panel + cross-page counter paging — countries, organizations,
  forums, working-groups, topics, persons, engagements, elected-officials, kanban
- **F24** split Filter/Display popovers — live RLS-scoped counts, chips, URL persistence
- **F25** audited + extended ⌘K command menu (global)
- **F26** rich empty states + filtered-empty branch

## Automated battery (integration branch, per CHECKPOINT-87-10-render.md)

| Check                                                                                      | Result                                                              |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `tsc --noEmit`                                                                             | exit 0                                                              |
| `lint --max-warnings 0` (i18n parity, logical-property/RTL, bootstrap-parity, date-format) | exit 0                                                              |
| `vitest run` full suite                                                                    | exit 0 — 203 files, **1539 passed**, 1 skipped, 25 todo, 0 failures |
| `build`                                                                                    | exit 0 (pre-existing >500 kB chunk advisory only)                   |
| Sweep (a) `empty-hint` in dossiers + engagements                                           | 0 matches                                                           |
| Sweep (b) CommandPalette `action=create\|export`                                           | only `/mous?action=create`                                          |
| Sweep (c) `framer-motion` in `list-controls`                                               | 0                                                                   |
| Sweep (d) Wave-0 files exist + green                                                       | peekStore / list-controls / CommandPalette.audit ✅                 |

**In-scope fallout fix** (87-10 Task 1 permits): `handoff-css-contract.test.ts` had
asserted a literal `grid-template-columns`, but 87-06 (`6f7791dd`) intentionally moved
it to `var(--dossier-cols, …)` for F24 column visibility — failing silently since 87-06.
Pinned to the `var()` form **with** fallback in `34cd297e`; assertion still fails if the
fallback is dropped (real check, not a rubber stamp).

## Render defect found and fixed (row 5)

The overseer-driven render walk (18 screenshots, `.overseer/render-walk-87/`) surfaced
one real Phase-87 defect: the **engagements peek counter total rendered 0** ("1 / 0").
Root cause was transport-level and pre-dated the bucket work — supabase-js head-count GET
serialized null RPC args to the literal string `"null"` → 400 → total fell back to 0.
Fixed in `e5dea1f1` by omitting absent args (RPC `DEFAULT NULL` applies); the replacing
test emulates the real transport (null arg fails as the server does) — fails pre-fix,
passes post-fix. Live re-verified in AR/RTL: unfiltered **1 / 3**, meeting bucket **1 / 2**,
both matching staging content-range totals. All 12 walk rows then pass.

## Human checkpoint (Task 2, `autonomous: false`, `gate=blocking`)

Consolidated EN/AR render sign-off — **operator signed 2026-07-13** (relayed by the
overseer, logged in `.overseer/DECISIONS.md`). Not self-approved. Three manual-only
rows verified: peek paging feel in AR-RTL, live counts under RLS, ⌘K glyph LTR isolation
in AR. Evidence: `.overseer/CHECKPOINT-87-10-render.md`.

## Provenance notes carried into the phase close

- **87-08 is operator-released, not a drover `task-done`** — two runs parked it on harness
  defects (D6 pane-scrape consult, trailer-less codex commits); recovered from dangling git
  objects and finished by hand. A staging DB migration shipped as part of it
  (`20260709180000_add_p_engagement_types_to_search_engagements_advanced.sql`, additive
  `TEXT[]` superset — NULL reproduces prior behavior; `fn_count=1`, ACL preserved).
  Full provenance: `.overseer/DECISIONS.md`, `87-08-SUMMARY.md`.
- **87-09 is a genuine drover `task-done`** (1 attempt, all gates incl. approving review).

## Merge + re-gate on milestone

Merged `drover/run-20260709-104447` → `milestone/v9.0-drover` at `26f3780a` (--no-ff,
no conflicts). Re-gated the merged tree: **tsc 0, lint 0** (all four sub-gates), targeted
**vitest 27 pass** (incl. the `useEngagementsInfinite` head-count test). `87-VALIDATION.md`
stamped `nyquist_compliant: true` / `wave_0_complete: true` / approval recorded.

## Deferred / out-of-scope (filed for Phase 88/89)

Pre-existing backend bug, NOT Phase 87: `backend/src/utils/validation.ts:45` assigns the
getter-only `req.query` → **EO list API 500s** (identical on main; backend untouched by 87).
The render walk verified the EO UI under a dev-only reverted patch. Routed into Phase 88/89
scope per ORCH-BRIEF §0e.

## Requirements

AFF-01, AFF-02, AFF-03, AFF-04 — **all complete** and demonstrated live in EN + AR.
Phase 87 closed.
