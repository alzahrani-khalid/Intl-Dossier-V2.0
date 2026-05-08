---
phase: 46
slug: visual-baseline-regeneration
status: approved
created: 2026-05-08
---

# Phase 46 - UI Design Contract

Phase 46 is a visual-regression baseline phase. It must not redesign the UI.
The contract is to preserve the current IntelDossier implementation, capture
approved baselines, and document human comparison against the handoff reference.

## Locked Visual Sources

| Surface           | Handoff reference                                                                                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard widgets | `frontend/design-system/inteldossier_handoff_design/reference/dashboard.png`                                                                                                                                     |
| List pages        | `reference/countries.png`, `reference/organizations.png`, `reference/forums.png`, `reference/engagements.png`; topics and working-groups inherit forum row parity; persons inherits the dashboard card aesthetic |
| Dossier drawer    | `frontend/design-system/inteldossier_handoff_design/src/pages.jsx`, `src/app.css`, and the current drawer implementation after token darkening                                                                   |

## Allowed UI Changes

- Add test-only stable selectors such as `data-testid` to existing dashboard
  widget roots.
- Add or update Playwright visual specs and Playwright config.
- Add or regenerate `.png` Playwright baseline files.
- Add validation/evidence documentation.

## Disallowed UI Changes

- No layout redesign, hero work, card restyling, copy rewrite, token changes, or
  component-library changes.
- No new decorative assets.
- No new user-visible controls.
- No new mock data in application code.
- No snapshot updates outside the Phase 46 visual scope.

## Baseline Quality Rules

| Rule          | Requirement                                                                               |
| ------------- | ----------------------------------------------------------------------------------------- |
| Stable data   | Use the Phase 45 seeded staging database and Doppler auth env.                            |
| Stable motion | Keep reduced motion, animation suppression, caret hiding, and font-readiness waits.       |
| Stable locale | Capture EN and AR where the spec requires both; verify `html[dir="rtl"]` for AR captures. |
| Stable review | Human review must name each baseline file path and mark it PASS, DEVIATION, or REJECTED.  |
| Stable CI     | A no-update visual replay must pass before Phase 46 is verified.                          |

## Human Review Rubric

For each baseline, the reviewer checks:

- The surface is non-empty and uses seeded data where expected.
- Typography, spacing, card borders, chips, directionality, and glyphs match the
  IntelDossier handoff reference for that surface.
- Arabic captures use Tajawal, RTL flow, mirrored icons where expected, and no
  clipped or overlapping text.
- Dashboard Digest source text shows publication names, and VipVisits shows
  country flags after Phase 45 seed closure.
- Drawer baselines reflect the post-token-darkening contrast state.

## Sign-Off Gate

Phase 46 cannot be marked complete until `46-VALIDATION.md` contains:

- 24 baseline rows total.
- A reviewer result for every row.
- The exact command used to generate baselines.
- The exact no-update command used to verify baselines.
- CI or equivalent `CI=true` no-update replay result.
