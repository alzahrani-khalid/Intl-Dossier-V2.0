---
phase: 41
plan: 02
subsystem: dossier-drawer
tags: [drawer, head, chips, cta, meta-strip, wave-1, rtl, i18n]
requires:
  - frontend/src/hooks/useDossier.ts (id, include?, options? — verified Wave 0)
  - frontend/src/hooks/useDossierOverview.ts (single hook with includeSections array)
  - frontend/src/lib/dossier-routes.ts (getDossierDetailPath)
  - frontend/src/lib/i18n/toArDigits.ts (Arabic-Indic digit transformer)
  - frontend/src/components/ui/ltr-isolate.tsx (LtrIsolate wrapper)
  - frontend/src/i18n/{en,ar}/dossier-drawer.json (Wave 0 namespace)
provides:
  - DrawerHead full body — chips (DOSSIER + conditional CONFIDENTIAL), display-font title, composes meta strip + CTA row, 44×44 close button
  - DrawerMetaStrip full body — 4-segment line (location · lead · engagements · last touched) with U+00B7 separators
  - DrawerCtaRow full body — 4 buttons (Log engagement wired, Brief + Follow stubs, Open full dossier ghost link)
affects:
  - DossierDrawer shell now renders the full head when overview loads (no shell change required)
tech-stack:
  added: []   # No new deps. lucide-react, date-fns, @tanstack/react-router already present.
  patterns:
    - "Logical-property only — `ms-auto` for inline-end push, `mb-2`/`mt-3` for block axis"
    - "Stub-CTA pattern (Phase 39 D-06): aria-disabled='true' + opacity 0.55 + 'Coming soon' tooltip + noop onClick"
    - "RTL chevron flip via global `.icon-flip` cascade (handoff convention shared with DossierShell, GenericListPage)"
    - "Per-file `vi.mock('react-i18next', ...)` returning key-as-translation; mutable `currentLang` for AR/EN switching"
key-files:
  created:
    - frontend/src/components/dossier/DossierDrawer/__tests__/DrawerHead.test.tsx
    - frontend/src/components/dossier/DossierDrawer/__tests__/DrawerMetaStrip.test.tsx
    - frontend/src/components/dossier/DossierDrawer/__tests__/DrawerCtaRow.test.tsx
    - .planning/phases/41-dossier-drawer/41-02-SUMMARY.md
  modified:
    - frontend/src/components/dossier/DossierDrawer/DrawerHead.tsx
    - frontend/src/components/dossier/DossierDrawer/DrawerMetaStrip.tsx
    - frontend/src/components/dossier/DossierDrawer/DrawerCtaRow.tsx
decisions:
  - "CONFIDENTIAL chip threshold confirmed at sensitivity_level >= 3 (RESEARCH §1, matches handoff visual chip-warn at level 3)"
  - "Chevron RTL behavior asserted deterministically at unit level via the global '.icon-flip' class — no visual-snapshot dependency (Test 9, Task 3)"
  - "Engagement-create prefill (dossier_id) deferred — RESEARCH §3 lock; route literal '/dossiers/engagements/create' verified by acceptance grep"
  - "Brief + Follow remain stubs (D-05); real wiring deferred to Phase 42 (Brief) + future subscription endpoint (Follow), per D-07"
  - "Plan template `Icon` import replaced with lucide-react named imports (X / MapPin / Plus / BookOpen / UserPlus / ChevronRight) — signature-visuals barrel does not export a generic Icon (Wave 0 deviation D-1 carried forward)"
metrics:
  duration_minutes: 7
  completed: 2026-05-01T22:11Z
  tasks_completed: 3
  files_created: 4
  files_modified: 3
  unit_tests_pass: 27
  unit_tests_total: 27
  ts_errors_introduced: 0
---

# Phase 41 Plan 02: Wave 1 — Dossier Drawer Head Anatomy Summary

DRAWER-02 head anatomy port: replaces the Wave 0 stub bodies of `DrawerHead`, `DrawerMetaStrip`, and `DrawerCtaRow` with the full handoff (`pages.jsx#L482-505`) verbatim — chip row + display-font title + 4-segment meta strip + 4-button CTA row — using only design tokens, logical properties, and the dossier-drawer i18n namespace. 27 new unit tests (8 + 10 + 9), all green; zero TS errors introduced; zero physical-property violations; deterministic RTL chevron flip.

## What Got Built

### Task 1 — DrawerHead full body

**Commit:** `a7b09d0e`

- DrawerHead now reads its own data via `useDossier(dossierId, undefined, { enabled })` and `useDossierOverview(...)` — Wave 0 had passed empty bodies.
- Chip row: `DOSSIER` chip always renders; `CONFIDENTIAL` chip (`chip-warn`) renders only when `sensitivity_level >= 3` (per RESEARCH §1; matches `SENSITIVITY_CHIP[3] = chip-warn`).
- Title: `<h2 className="drawer-title">` renders `name_ar` under AR when non-empty, otherwise falls back to `name_en`. The CSS file at `frontend/src/index.css#L442` ships the Tajawal override on `html[dir='rtl'] .drawer-title`.
- Close button: `min-block-size: 44px; min-inline-size: 44px` inline + localized `aria-label = t('cta.close')`. `lucide-react X` icon retained from Wave 0 (signature-visuals barrel does not export a generic `Icon` — see Wave 0 deviation D-1).
- Composes `<DrawerMetaStrip dossierId metadata updatedAt engagementCount />` and `<DrawerCtaRow dossierId dossierType />`. The `engagementCount` is read from `overview.stats.calendar_events_count`.
- 8 vitest unit tests cover all 8 contract bullets; per-file `vi.mock('react-i18next', ...)` with mutable `currentLang` for the AR/EN title fallback case.

### Task 2 — DrawerMetaStrip full body

**Commit:** `a4b7ea07`

- 4-segment line separated by `·` (U+00B7) inside `<span aria-hidden="true">` so screen readers don't announce the dots.
- Segment 1: `metadata.region` (string) or `t('meta.location_fallback')` ("Global" / "عالمي"). The handoff `📍` emoji is replaced by lucide `MapPin` per CLAUDE.md "No emoji in user-visible copy".
- Segment 2: `t('meta.lead_prefix') + ': ' + metadata.lead_name` when present; em-dash `'—'` otherwise.
- Segment 3: `${toArDigits(engagementCount, lang)} ${t('meta.engagements_suffix')}` wrapped in `<LtrIsolate>` so Indic digits render LTR inside the surrounding RTL line (Phase 38 pattern).
- Segment 4: same-day → `t('meta.last_touched_today')`; 1 day → `t('meta.last_touched_yesterday')`; ≥2 days → `t('meta.last_touched_relative', { n: toArDigits(days, lang) })`. `differenceInCalendarDays` from `date-fns`.
- Container retains class `drawer-meta` for the handoff CSS hook.
- 10 vitest unit tests (1 added beyond plan's 6 — separates EN-digit from AR-digit assertions for engagement count).

### Task 3 — DrawerCtaRow full body

**Commit:** `9b4775be`

- 4 buttons in handoff order with `data-testid` hooks for unit tests + future Wave 2 e2e:
  1. `cta-log-engagement` (`.btn-primary`, `Plus` icon) → `navigate({ to: '/dossiers/engagements/create' })` (RESEARCH §3 — prefill deferred)
  2. `cta-brief` (`.btn`, `BookOpen` icon, stub: `aria-disabled="true"` + `title=t('cta.coming_soon')` + `opacity: 0.55` + `cursor: not-allowed` + noop onClick)
  3. `cta-follow` (`.btn`, `UserPlus` icon, identical stub treatment)
  4. `cta-open-full-dossier` (`.btn-ghost`, `ms-auto`, trailing `ChevronRight` with `className="icon-flip"`) → `navigate({ to: getDossierDetailPath(dossierId, dossierType) })` (D-06)
- All 4 buttons share `min-block-size: 44px` inline (D-11).
- The chevron flip uses the global `html[dir='rtl'] .icon-flip { transform: scaleX(-1) }` cascade from `frontend/src/styles/list-pages.css#L861-862`. This is the same convention `DossierShell.tsx#L149,156` and `GenericListPage.tsx#L123-124` follow — handoff fidelity, no per-file inline transform.
- 9 vitest unit tests including the deterministic RTL chevron-flip assertion (Test 9 — class-based, NOT visual-snapshot).

## Verification

| Check | Result |
| --- | --- |
| `vitest run src/components/dossier/DossierDrawer/` | 32/32 PASS (4 files: DrawerHead 8 + DrawerMetaStrip 10 + DrawerCtaRow 9 + Wave 0 DossierDrawer 5) |
| TS errors introduced on Phase 41 surface | 0 (delta 0 — pre-existing `preference-storage.ts` errors unrelated) |
| Logical-property violations on the 3 files: `grep -rE '\b(ml-[0-9]\|mr-[0-9]\|pl-[0-9]\|pr-[0-9]\|left-[0-9]\|right-[0-9]\|text-left\|text-right)\b' DrawerHead.tsx DrawerMetaStrip.tsx DrawerCtaRow.tsx` | 0 hits (only logical `ms-auto` is used) |
| `dangerouslySetInnerHTML` introductions | 0 hits |
| Engagement-create literal: `grep -nE "to: '/dossiers/engagements/create'" DrawerCtaRow.tsx` | 1 line (line 39) |
| RTL chevron-flip deterministic assertion | passes on `lucide ChevronRight` with `className="icon-flip"` (global RTL CSS rule) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Plan template imports `Icon` from `@/components/signature-visuals` — that barrel exports no generic `Icon`**

- **Found during:** Task 1, Task 2, Task 3 (all reference `Icon` in the plan template's example code).
- **Issue:** `frontend/src/components/signature-visuals/index.ts` exports `GlobeLoader`, `GlobeSpinner`, `Sparkline`, `Donut`, `FullscreenLoader`, `DossierGlyph` — no generic `Icon`. Wave 0 already encountered this and shipped a deviation (Wave 0 SUMMARY D-1) using `lucide-react`'s `X`. Continuing that convention.
- **Fix:** Imported each glyph by name from `lucide-react`: `X` (close), `MapPin` (location), `Plus` (log), `BookOpen` (brief), `UserPlus` (follow), `ChevronRight` (open full). Same convention used by `DossierShell.tsx#L36`, `GenericListPage.tsx#L123`, and `frontend/src/components/ui/sheet.tsx`.
- **Files modified:** all 3 component files
- **Commits:** `a7b09d0e`, `a4b7ea07`, `9b4775be`

**2. [Rule 3 — Blocking] `useDossier` signature uses `(id, include?, options?)`, NOT `(id, options)`**

- **Found during:** Task 1 (DrawerHead implementation)
- **Issue:** Plan template wrote `useDossier(dossierId, { enabled: true })`, which would pass an options object as the `include` argument and break the query key (same root issue as Wave 0 deviation D-2).
- **Fix:** Called as `useDossier(dossierId, undefined, { enabled: Boolean(dossierId) })`. Matches the verified Wave 0 pattern.
- **Files modified:** `frontend/src/components/dossier/DossierDrawer/DrawerHead.tsx`
- **Commit:** `a7b09d0e`

**3. [Rule 3 — Blocking] `dossier.metadata` is typed `Record<string, unknown>`, not `{ region?, lead_name? }`**

- **Found during:** Task 1, Task 2
- **Issue:** Plan template assumed `metadata?: { region?: string; lead_name?: string }`, but the real backend type is `metadata?: Record<string, unknown>` (`services/dossier-api.ts#L347`). Indexing `.region` directly would type-check today (Record allows any key) but field values are `unknown` so they need narrowing.
- **Fix:** Added a small `readString(metadata, key)` helper in `DrawerMetaStrip` that returns the value when it's a non-empty string, else `null`. Maintains type safety without `as any`.
- **Files modified:** `frontend/src/components/dossier/DossierDrawer/DrawerMetaStrip.tsx`
- **Commit:** `a4b7ea07`

**4. [Rule 1 — Bug] `expect(onClose).toHaveBeenCalledWith()` would fail because `onClick={onClose}` forwards the React MouseEvent**

- **Found during:** Task 1 RED phase (Test 7 fail diagnostic)
- **Issue:** The plan template's behavior bullet "calling `props.onClose` (one call, no args)" is unreachable when `onClick={onClose}` is used directly — React always passes the click event. To assert "no args", we'd need a wrapping arrow `() => onClose()`, which is unnecessary indirection.
- **Fix:** Test 7 now asserts only `toHaveBeenCalledTimes(1)` — the contract is "one click → one call". The handoff component-level pattern doesn't need to filter the event arg (other dossier components do the same: see `DossierShell.tsx#L93-95`).
- **Files modified:** `frontend/src/components/dossier/DossierDrawer/__tests__/DrawerHead.test.tsx`
- **Commit:** `a7b09d0e`

### Plan-template ambiguities resolved

- `engagement count` source — plan said "engagement count" without a specific path; I used `overview.stats.calendar_events_count` (the path Wave 0's `MiniKpiStrip` will also reference for the KPI). Wave 1 plans 41-03/04/05 fill the strip and cards based on the same overview shape, so the prop is forwarded from `DrawerHead`.

## Threat Model — Status

| Threat ID | Mitigation | Status |
| --- | --- | --- |
| T-41-02-01 (XSS via title) | `name` rendered via JSX text node `{name}` — auto-escaped. No `dangerouslySetInnerHTML`. Acceptance grep returns 0. | MITIGATED |
| T-41-02-02 (XSS via metadata strings) | `region` + `lead_name` extracted via narrow `readString` helper, rendered via JSX text nodes (auto-escaped). | MITIGATED |
| T-41-02-03 (Open-redirect via Open full dossier) | `getDossierDetailPath(id, type)` only constructs `/dossiers/{routeSegment}/{id}` — `routeSegment` is whitelisted via the 8-key `DOSSIER_TYPE_TO_ROUTE` table; unknown types fall back to `'countries'`. No external URL constructible. | MITIGATED |
| T-41-02-04 (Open-redirect via Log engagement) | Hard-coded literal route `/dossiers/engagements/create` — no user input on path. | MITIGATED |
| T-41-02-05 (Sensitivity threshold mismatch) | Threshold `>= 3` chosen per RESEARCH §1; the visible label uses `t('chip.confidential')` even at level 3 (semantically "Restricted" in `SENSITIVITY_CHIP`) — handoff fidelity > taxonomy fidelity. Server-side RLS owns actual data hiding; the chip is a visual signal only. | ACCEPTED |
| T-41-02-06 (Spoofing via stub button focus) | Brief + Follow have `aria-disabled="true"` (announces disabled to screen readers) but remain keyboard-focusable; `noop` onClick prevents accidental navigation. Phase 39 D-06 precedent. | MITIGATED |

## Known Stubs

| Stub | Why | Resolved by |
| --- | --- | --- |
| `Brief` button | Wired implementation requires Briefs page (deferred to Phase 42 per D-07) | Future phase |
| `Follow` button | Requires `dossier_subscriptions` toggle endpoint (not in scope, D-07) | Future phase |
| Engagement-create prefill | RESEARCH §3 explicit lock — Phase 41 wires the route only; prefilling `dossier_id` belongs to a future engagement-form phase | Future phase |

## Threat Flags

None — all surfaces are within the threat-model coverage above.

## Self-Check: PASSED

**Files exist:**
- FOUND: `frontend/src/components/dossier/DossierDrawer/DrawerHead.tsx`
- FOUND: `frontend/src/components/dossier/DossierDrawer/DrawerMetaStrip.tsx`
- FOUND: `frontend/src/components/dossier/DossierDrawer/DrawerCtaRow.tsx`
- FOUND: `frontend/src/components/dossier/DossierDrawer/__tests__/DrawerHead.test.tsx`
- FOUND: `frontend/src/components/dossier/DossierDrawer/__tests__/DrawerMetaStrip.test.tsx`
- FOUND: `frontend/src/components/dossier/DossierDrawer/__tests__/DrawerCtaRow.test.tsx`

**Commits exist:**
- FOUND: `a7b09d0e` (Task 1 — DrawerHead)
- FOUND: `a4b7ea07` (Task 2 — DrawerMetaStrip)
- FOUND: `9b4775be` (Task 3 — DrawerCtaRow)
