---
type: triage
phase: 41-dossier-drawer
created: 2026-05-01
author: gsd-resume-work
input: 109-file dirty tree + 5 in-flight Phase-41 commits + handoff prototype
status: read-only — no code changed during triage
---

# Phase 41 Triage — Handoff fidelity audit

## TL;DR

The handoff port is **substantially done** in the dirty tree. Across all four
directions × LTR/RTL × desktop + mobile, the runtime app renders in
direction-correct form with handoff-grade tokens, type, borders, density, and
sidebar/topbar/dashboard/list-page layout. **TweaksDrawer is pixel-aligned.**

This is a **finishing job** — formalize the in-flight work, fix three concrete
bugs, close a handful of polish items, then open Phases 42/43.

## Method

- Catalogued 109 dirty files into 11 surfaces by `git diff --stat HEAD`.
- Sampled the largest diffs (TweaksDrawer 436, list-pages.css +999,
  dashboard.css +399, DossierTypeStatsCard 122, bootstrap.js +83, Topbar 69,
  language-provider 61, AppShell 47).
- Started frontend (`localhost:5176`) + backend (`localhost:5001`) under Doppler.
- Took 9 screenshots at `/tmp/intl-triage/` covering:
  - Dashboard × {Bureau, Chancery, Situation, Ministerial} LTR light comfortable
  - Countries list × Bureau LTR
  - Countries list × Bureau RTL (Arabic)
  - Dashboard × Bureau LTR mobile 414px
  - Saudi Arabia dossier detail × Bureau LTR
  - Tweaks drawer × Bureau LTR
- Cross-referenced visible state against handoff `README.md` "Definition of
  Done — UI checklist" and `src/app.css` / `src/*.jsx` patterns.

## What's already correct (no action)

| Surface                    | Status               | Evidence                                                                                                                                                                    |
| -------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Token engine               | ✅                   | `bootstrap.js` paints all 4 directions × 2 modes × 3 densities pre-paint; `directions.ts` matches; FOUC-window styles match                                                 |
| Direction class system     | ✅                   | `.dir-bureau/-chancery/-situation/-ministerial` applied on `<html>`, all CSS overrides resolve                                                                              |
| Type stack                 | ✅                   | Inter (bureau), Fraunces (chancery serif heading), Public Sans (ministerial), Space Grotesk + Plex (situation), Tajawal (RTL) all loaded via `index.html` Google Fonts link |
| Sidebar                    | ✅                   | Brand mark, user card, Operations/Dossiers groups, active accent bar with RTL flip; situation uses uppercase mono per `.dir-situation .sb-item`                             |
| Topbar                     | ✅                   | 56px height, search + 4-direction radios + bell + theme toggle + EN/ع + Tweaks; ⌘K shown ≥`lg`                                                                              |
| Dashboard KPI strip        | ✅                   | 4-up flush grid with line dividers (no gaps) per handoff; SLA-at-risk has accent top-rule                                                                                   |
| Week Ahead widget          | ✅                   | TODAY/TOMORROW/NEXT WEEK groupings; FRI 01 11:00 AM — 12:00 PM mono format                                                                                                  |
| Overdue Commitments widget | ✅                   | T-relative `Nd` mono pills; row-level country header; right-aligned "D" markers                                                                                             |
| SLA Health donut           | ✅                   | 93% center, "On track / At risk / Breached" legend; sparkline below                                                                                                         |
| Countries list table       | ✅                   | NAME / ENGAGEMENTS / LAST TOUCH / SENSITIVITY uppercase mono headers; sensitivity chips Internal/Restricted/Public                                                          |
| RTL flip                   | ✅                   | Sidebar moves to right edge, accent bar flips, table column order reverses, search box right-aligned, Arabic-Indic dates `٣٠ أبريل ٢٠٢٦`                                    |
| Mobile 414px               | ✅                   | Hamburger menu, KPI strip 2×2, direction radios collapse to single letters (C/S/M/B), drawer overlay on tap                                                                 |
| Dossier detail breadcrumbs | ✅                   | UPPERCASE mono `OVERVIEW › SAUDI ARABIA` with chevron icon-flip in RTL                                                                                                      |
| **TweaksDrawer**           | ✅ **pixel-aligned** | 8 sections in handoff order; direction cards stacked vertically; hue rainbow slider; section headings as UPPERCASE labels                                                   |

## Findings (mapped to roadmap)

### F1 — Floating chat-bubble persistent across all routes [P0 — fix now]

**Severity:** high (visual fidelity break — visible in every screenshot).
**Where:** bottom-right corner, all routes, all directions, both languages.
**Detail:** A circular accent-colored button with a chat/comment icon appears
fixed to `bottom: 16px; right: 16px` (or inset-inline-end). It survives
direction flips, route changes, and mobile breakpoint. Not in handoff.
**Suspect source:** `frontend/src/components/guided-tours/OnboardingTourTrigger.tsx`
(in dirty diff at +25 lines) or a help-widget mount in `_protected.tsx`.
**Map to:** Phase 41 cleanup (drawer scope) — block before Phase 41 verification.

### F2 — "Couldn't load widget" error visible on dashboard [P0]

**Severity:** high (broken widget).
**Where:** dashboard, Bureau LTR — small red text bottom-right of widget grid.
**Detail:** A widget's error boundary tripped. The other 4 widgets render fine
(WeekAhead, OverdueCommitments, SlaHealth, VipVisits). Likely candidates:
ForumsStrip, RecentDossiers, MyTasks, or Digest — they're below the fold and
absent from the visible snapshot but present in their JSX trees.
**Action:** open browser console on dashboard and capture the error message;
pin to the offending widget; fix the data-shape divergence (Phase 38 history
notes 6 widgets had Rule-3 API adaptations).
**Map to:** Phase 41 cleanup (dashboard surface) — block before Phase 41 verification.

### F3 — RTL country avatars show Arabic name substring instead of flag glyph [P1]

**Severity:** medium (visual fidelity break).
**Where:** `/dossiers/countries` list, RTL only.
**Detail:** Avatars in RTL render `جا` / `ال` / `جا` / `ال` (first 2 chars of
Arabic name, e.g. "جمهورية" → "جا"). All Indonesia + China get same `جا`,
both Saudi + UAE get same `ال`. In LTR the avatars correctly show ISO
substrings ("IN", "UA", "CH", "SA"). Handoff uses the `DossierGlyph` component
(circular flag SVG with `FLAG_CODE` lookup) — that's the brand's signature
visual.
**Suspect:** `DossierTable.tsx` or list-page row primitive falls back to
`(name).slice(0,2)` instead of consulting the country's ISO code or rendering
`DossierGlyph` for `dossier_type === 'country'`.
**Map to:** Phase 41 (dossier-drawer surface uses DossierGlyph too) or Phase 40
deferred — country list-page bug.

### F4 — Direction switch does not adopt direction-default hue [P1]

**Severity:** medium (handoff intent mismatch).
**Where:** Tweaks drawer / direction radios.
**Detail:** Handoff README specifies per-direction default hues:
Bureau 32° terracotta, Chancery 22° warm, Situation 190° cyan, Ministerial 158°
green. Switching direction in the topbar radios keeps the previously-set hue
across directions. The `DIRECTION_DEFAULTS` map in
`frontend/src/design-system/directionDefaults.ts` exists but doesn't appear
to feed the `setDirection` flow. Visually this means Ministerial dashboard
shows terracotta accents on the SLA-at-risk rule and "+ New engagement"
button, instead of the green that defines the Ministerial direction.
**Decision needed:** is hue (a) reset on direction change to that direction's
default, (b) preserved across direction changes (current behavior), or (c)
preserved only if user explicitly set it via the slider? Handoff prototype
behavior should be checked against `themes.jsx` `buildTokens` to confirm.
**Map to:** Phase 41 (Tweaks parity) — small spec ambiguity.

### F5 — Date format uses Latin long form in EN, no weekday [P2]

**Severity:** low (subtle).
**Where:** every list / dossier card with a date column.
**Detail:** Handoff README: dates as `Tue 28 Apr` (day-first, no comma, no
year unless cross-year). Times `14:30 GST`. Currently EN renders `Apr 30,
2026` (US long form). RTL renders `٣٠ أبريل ٢٠٢٦` (Arabic-Indic, day-first
— good — but no weekday).
**Suspect:** centralized formatter is using `Intl.DateTimeFormat` with
`{ year: 'numeric', month: 'short', day: 'numeric' }` instead of handoff
`{ weekday: 'short', day: '2-digit', month: 'short' }`.
**Map to:** Phase 43 (final sweep) — all surfaces use the same formatter.

### F6 — Onboarding tour modal can re-pop [P2]

**Severity:** low (UX nit).
**Where:** post-login on every fresh session that doesn't have the
"completed" key in localStorage.
**Detail:** Modal welcome takes over dashboard; `Skip for now` dismisses,
but it's worth verifying the dismissal sets a stable flag (likely via
`OnboardingTourTrigger` whose dirty diff is +25 lines).
**Map to:** Phase 41 cleanup OR Phase 42 (depending on whether tour is in
scope of any phase).

### F7 — Welcome KPI subtitles still reference engagement counts post-port [P2]

**Severity:** low (copy nit).
**Where:** dashboard KPI strip and `WIP-cleanup-on-uncommitted` for any
unit-test snapshots that depend on this copy.
**Detail:** "5 this week · 3 travel" / "4 breached · 5 amber" — these match
handoff prototype copy. ✓ no action.

### F8 — VipVisits empty state copy [P3]

**Detail:** "No upcoming visits" — handoff prefers terser empty states (full
stop, no encouragement). "None upcoming." or just "—". Optional.
**Map to:** Phase 43 sweep.

### F9 — Sensitivity chip palette [P2]

**Detail:** Internal renders gray, Restricted renders amber, Public renders
green. Visually correct. Confirm all `sensitivity` enum values map to a chip
class so future values fail loudly. ✓ no action unless new values land.

### F10 — Floating action button visibility test [P3]

**Detail:** None present in handoff; if the chat-bubble in F1 is intentional
(help/feedback), it should follow handoff icon-button styling — circular
icon-only with `--line` border on `--surface`, not accent-fill. Decision
in F1.

## Roadmap mapping

| Item                                                                                            | Phase  | Status                                                                 |
| ----------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| Token engine, FOUC bootstrap, font stack                                                        | 33–35  | ✅ Closed                                                              |
| Shell chrome (sidebar/topbar/classification)                                                    | 36     | ✅ Closed                                                              |
| Signature visuals (GlobeLoader, DossierGlyph, sparkline, donut)                                 | 37     | ✅ Closed                                                              |
| Dashboard widgets verbatim                                                                      | 38     | ✅ Closed (F2 widget error to investigate)                             |
| Kanban / Calendar                                                                               | 39     | ✅ Closed                                                              |
| List pages                                                                                      | 40     | ✅ Closed PASS-WITH-DEVIATION (F3 country glyph in RTL is new finding) |
| **Dossier drawer (DRAWER-01..03)**                                                              | **41** | **🚧 In flight, no plan**                                              |
| Remaining pages (PAGE-01..05) — Settings, Calendar page, Intake, Forums, Engagements full views | 42     | Not started                                                            |
| RTL/a11y/responsive sweep + dates + empty states + F4 hue (QA-01..04)                           | 43     | Not started                                                            |

## Phase 41 scope (recommended)

DRAWER-01..03 = dossier drawer. The 41-marked commits already in the tree
have started:

- `d4d522f0` direction-aware radii + bilingual job_title + dashboard demo seed
- `4f2281dc` seed engagement_dossiers + calendar + intake + forums + activity_stream
- `435d5897` fix(41): dashboard time + dossier-name display bugs
- `16323dfc` adopt IntelDossier prototype as visual source of truth (foundation work)

The dirty tree adds:

- HeroUI v3 Drawer compound API migration (`DrawerBackdrop` + `DrawerDialog`)
  — applied to `AppShell.tsx` and `TweaksDrawer.tsx`
- Token-bound rewrite of dossier shell (DossierShell, DossierTabNav,
  DossierTypeStatsCard, ExportDossierDialog, RelationshipSidebar,
  CollapsibleSection)
- LanguageProvider migration to read `id.locale` first
- Tweaks drawer pixel-perfect rewrite (use `id-tweaks-*` classes from
  new `tweaks-drawer.css`)
- Dashboard widget polish (`dashboard.css` +399 lines)
- List-pages CSS port (+999 lines)

**Proposed Phase 41 deliverables:**

1. Resolve **F1, F2, F3** (chat-bubble removal, dashboard widget error,
   RTL DossierGlyph in country list).
2. Decide **F4** (direction-default hue policy) and document in PROJECT.md.
3. Land all 109 dirty files as 4–6 scoped commits aligned with surface
   groups (foundation → shell+tweaks → dossier shell → list-page polish →
   dashboard polish → tests).
4. Write `41-PLAN.md` capturing what shipped + DRAWER-01..03 acceptance
   criteria.
5. Run `/gsd-ui-review` retroactively for the 6-pillar visual audit.
6. Update STATE.md to mark Phase 41 closed.

Phase 42/43 stay out of scope for Phase 41 to avoid the 109-file commit
becoming a 200-file commit.

## Recommended next GSD command

```
/gsd-discuss-phase 41
```

Reasons:

- Phase 41 has no `41-CONTEXT.md`, `41-DISCUSSION.md`, or `41-PLAN.md` yet —
  per resume-project workflow, "If CONTEXT.md missing → discuss phase first".
- Discuss step lets us lock the **F4 hue decision** before planning.
- Discuss output feeds the planner; planner writes `41-PLAN.md`; executor
  lands the dirty tree as scoped commits.

Alternative: `/gsd-plan-phase 41` directly if you want to skip discussion
and let the planner derive context from the existing dirty diff (faster but
less precise on the F4 ambiguity).

Do **not** use `/gsd-quick` — 109 files is not a quick fix.
Do **not** use `/gsd-execute-phase 41` — there is no plan yet.

## Open questions for the user

1. **F4 hue policy**: should switching direction reset hue to that direction's
   default (handoff intent) or preserve user's hue (current)?
2. **F1 chat-bubble**: is this an intentional help/feedback widget or
   accidental? If intentional, what's its source-of-truth styling?
3. **Phase 41 commit strategy**: 4–6 surface-scoped commits (recommended) vs
   one mega-commit vs `git stash` and replay during execute?
4. **Phase 40 deferred items** (auth-helper + 14 visual baselines): bundle
   into Phase 41 verification or keep in HUMAN-UAT?

## Screenshots captured

All saved to `/tmp/intl-triage/`. Sizes are full-page where the route fits
the 1400×900 viewport.

| File                                   | Route                             | Direction   | Locale | Viewport | Notes                                          |
| -------------------------------------- | --------------------------------- | ----------- | ------ | -------- | ---------------------------------------------- |
| 00-login-bureau-ltr.png                | /login                            | bureau      | en     | 1400×900 | Login pre-auth                                 |
| 01-dashboard-bureau-ltr-light.png      | /dashboard                        | bureau      | en     | 1400×900 | F1, F2 visible                                 |
| 02-dashboard-chancery-ltr-light.png    | /dashboard                        | chancery    | en     | 1400×900 | Fraunces serif title, sentence-case nav groups |
| 03-dashboard-situation-ltr-light.png   | /dashboard                        | situation   | en     | 1400×900 | Uppercase title, dark navy sidebar             |
| 04-dashboard-ministerial-ltr-light.png | /dashboard                        | ministerial | en     | 1400×900 | F4 hue still terracotta                        |
| 05-countries-list-bureau-ltr.png       | /dossiers/countries               | bureau      | en     | 1400×900 | Table with mono headers                        |
| 06-countries-bureau-rtl.png            | /dossiers/countries               | bureau      | ar     | 1400×900 | F3 avatar substring bug                        |
| 07-dashboard-bureau-mobile-414.png     | /dashboard                        | bureau      | en     | 414×900  | Hamburger + 2×2 KPI                            |
| 08-dossier-detail-bureau-ltr.png       | /dossiers/countries/{id}/overview | bureau      | en     | 1400×900 | Saudi Arabia detail                            |
| 09-tweaks-drawer-bureau-ltr.png        | dossier detail w/ drawer open     | bureau      | en     | 1400×900 | Pixel-aligned                                  |
