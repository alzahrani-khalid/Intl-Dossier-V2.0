---
phase: 41
plan: 01
subsystem: dossier-drawer
tags: [drawer, infra, wave-0, url-search-params, i18n, skeleton]
requires:
  - frontend/src/components/ui/sheet.tsx (Radix Sheet primitive, end-0 logical anchored)
  - frontend/src/hooks/useDossier.ts (id, include?, options? signature — see deviation D-1)
  - frontend/src/hooks/useDossierOverview.ts (single hook with includeSections array)
  - frontend/src/lib/i18n/toArDigits.ts (Arabic-Indic digit transformer)
  - frontend/src/components/ui/skeleton.tsx (HeroUI Skeleton re-export)
provides:
  - useDossierDrawer hook (open / dossierId / dossierType / openDossier / closeDossier)
  - formatRelativeTimeShort utility (handoff-style bilingual relative time)
  - DossierDrawer shell mounted on _protected.tsx (URL-search-param driven)
  - 8 section file STUBS for Wave 1 plans 41-02..41-05 to replace per-file
  - DrawerSkeleton with per-section testid hooks (kpi/summary/upcoming/activity/commitments)
  - dossier-drawer i18n namespace (EN+AR, 30 leaf keys covering UI-SPEC's 28 contract keys)
  - Playwright openDrawerForFixtureDossier + closeDrawerViaEsc fixtures for Wave 2
affects:
  - frontend/src/routes/_protected.tsx (validateSearch + drawer mount)
  - frontend/src/i18n/index.ts (dossier-drawer namespace registered in en + ar resources)
tech-stack:
  added: []  # No new deps. date-fns + lucide-react already present.
  patterns:
    - URL-search-param drawer mount (TanStack Router useSearch + useNavigate functional reducer)
    - validateSearch on layout route (silent dropping of malformed params)
    - Conditional React Query (enabled: open && Boolean(dossierId))
key-files:
  created:
    - frontend/src/hooks/useDossierDrawer.ts
    - frontend/src/hooks/__tests__/useDossierDrawer.test.tsx
    - frontend/src/lib/i18n/relativeTime.ts
    - frontend/src/lib/i18n/__tests__/relativeTime.test.ts
    - frontend/src/i18n/en/dossier-drawer.json
    - frontend/src/i18n/ar/dossier-drawer.json
    - frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx
    - frontend/src/components/dossier/DossierDrawer/DrawerSkeleton.tsx
    - frontend/src/components/dossier/DossierDrawer/DrawerHead.tsx
    - frontend/src/components/dossier/DossierDrawer/DrawerMetaStrip.tsx
    - frontend/src/components/dossier/DossierDrawer/DrawerCtaRow.tsx
    - frontend/src/components/dossier/DossierDrawer/MiniKpiStrip.tsx
    - frontend/src/components/dossier/DossierDrawer/SummarySection.tsx
    - frontend/src/components/dossier/DossierDrawer/UpcomingSection.tsx
    - frontend/src/components/dossier/DossierDrawer/RecentActivitySection.tsx
    - frontend/src/components/dossier/DossierDrawer/OpenCommitmentsSection.tsx
    - frontend/src/components/dossier/DossierDrawer/index.ts
    - frontend/src/components/dossier/DossierDrawer/__tests__/DossierDrawer.test.tsx
    - frontend/tests/e2e/support/dossier-drawer-fixture.ts
  modified:
    - frontend/src/routes/_protected.tsx
    - frontend/src/i18n/index.ts
decisions:
  - D-02 confirmed: URL search-param mount on _protected.tsx
  - validateSearch path A confirmed (no child route regression observed)
  - Skeleton primitive existed at src/components/ui/skeleton.tsx (no fallback needed)
  - 8-type drawer enum inlined on _protected.tsx (rather than reusing isValidDossierType)
    because dossier-type-guards excludes elected_official from DossierType (Rule 2)
metrics:
  duration_minutes: 9
  completed: 2026-05-02T00:55Z
  tasks_completed: 2
  files_created: 19
  files_modified: 2
  unit_tests_pass: 15
  unit_tests_total: 15
  ts_errors_introduced: 0
---

# Phase 41 Plan 01: Wave 0 — Dossier Drawer Infrastructure Summary

URL-driven dossier quick-look drawer scaffolding: `useDossierDrawer` hook, validateSearch on `_protected.tsx`, Radix Sheet shell with 8 section stubs, bilingual `dossier-drawer` i18n namespace (30 keys covering UI-SPEC's 28 contract keys), `formatRelativeTimeShort` utility, and Playwright fixture — all wired so each Wave 1 plan replaces exactly one section file body without cross-plan collisions.

## What Got Built

### Task 1 — Hook + i18n + validateSearch + relativeTime

**Commit:** `ee7a9079`

- `useDossierDrawer` hook (TanStack Router `useNavigate` + `useSearch({ strict: false })`):
  - `openDossier({ id, type })` → adds `?dossier=<id>&dossierType=<type>` to current route, `replace: false` (browser-back closes)
  - `closeDossier()` → strips both keys, `replace: true` (no history pollution)
  - Returns `{ open, dossierId, dossierType }` for component consumers
- `_protected.tsx validateSearch` whitelists drawer params against the 8-type enum (country, organization, forum, engagement, topic, working_group, person, elected_official). Malformed values silently become `undefined` — the drawer stays closed, no throw, no log noise.
- `formatRelativeTimeShort(timestamp, lang, now?)`:
  - same calendar day → `'HH:mm'`
  - 1 day ago → `'yday'` (en) / `'أمس'` (ar)
  - 2..7 days ago → `'Nd'` (en) / `'Nي'` (ar) using `toArDigits`
  - >7 days → date-fns `'d MMM'` localized (ar / enUS) with Indic-digit transform
  - invalid input → `'—'`
- `dossier-drawer` namespace: 30 leaf keys, byte-for-byte from UI-SPEC Copywriting Contract, registered in both en + ar blocks of `i18n/index.ts` adjacent to `dossier-shell`.
- 10 vitest unit tests pass (4 hook + 6 relativeTime).

### Task 2 — DossierDrawer shell + 8 stubs + AppShell mount + Playwright fixture

**Commit:** `cc6083b8`

- `DossierDrawer.tsx` shell:
  - Returns `null` when search params absent or invalid
  - Mounts a Radix `Sheet` with `side="right"` (sheet variant emits `end-0` → automatic RTL flip via logical property)
  - Width `min(720px,92vw)` desktop, `max-md:w-screen max-md:border-0 max-md:shadow-none` mobile per D-10
  - Conditional fetch via `useDossier` + `useDossierOverview` gated on `enabled: open && Boolean(dossierId)` (T-41-01-06 DoS mitigation)
  - Loading branch renders `DrawerSkeleton`; data-loading toggles between `'true'` / `'false'` on `.drawer-body` (Playwright fixture waits on this attribute)
- 8 section stubs — each a typed default-exporting component, body is the section's loading placeholder. Wave 1 plans (41-02..41-05) replace bodies one file at a time:
  - `DrawerHead` (chip + 44×44 close button + skeleton title) — Wave 1 41-02 fills body
  - `DrawerMetaStrip` — Wave 1 41-02
  - `DrawerCtaRow` — Wave 1 41-02
  - `MiniKpiStrip` — Wave 1 41-03
  - `SummarySection` — Wave 1 41-03
  - `UpcomingSection` — Wave 1 41-04
  - `RecentActivitySection` — Wave 1 41-04
  - `OpenCommitmentsSection` — Wave 1 41-05
- `DrawerSkeleton.tsx` mirrors per-section shapes with stable `data-testid` hooks (`skeleton-kpi-cell`, `skeleton-summary-row`, `skeleton-upcoming-item`, `skeleton-activity-item`, `skeleton-commitments-item`) for unit-test count assertions.
- `_protected.tsx`: imported `DossierDrawer`, rendered as a sibling of `<ChatDock>` inside its own `<ErrorBoundary>` so a drawer crash never sinks the chat dock.
- `tests/e2e/support/dossier-drawer-fixture.ts`: `openDrawerForFixtureDossier` + `closeDrawerViaEsc` for Wave 2 specs.
- 5 vitest unit tests pass (closed-state, open-state, classnames, close-button wiring, skeleton placeholder counts).

## Verification

| Check                                                                                                  | Result               |
| ------------------------------------------------------------------------------------------------------ | -------------------- |
| `pnpm test useDossierDrawer relativeTime DossierDrawer --run`                                          | 15/15 PASS (3 files) |
| `pnpm type-check` errors on Phase 41 surface                                                           | 0 (delta 0)          |
| Logical-property violations: `grep -rE '\b(ml-[0-9]\|mr-[0-9]\|pl-[0-9]\|pr-[0-9]\|left-[0-9]\|right-[0-9]\|text-left\|text-right)\b' frontend/src/components/dossier/DossierDrawer/ frontend/src/hooks/useDossierDrawer.ts` | 0 hits      |
| `dangerouslySetInnerHTML` introductions                                                                | 0 hits               |
| EN dossier-drawer.json `JSON.parse`                                                                     | exit 0               |
| AR dossier-drawer.json `JSON.parse`                                                                     | exit 0               |
| Skeleton primitive at `frontend/src/components/ui/skeleton.tsx`                                         | EXISTS (no fallback) |
| validateSearch path A on `_protected.tsx`                                                               | confirmed (no child route regression) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] `Icon` does not exist in `@/components/signature-visuals`**

- **Found during:** Task 2 (DrawerHead stub)
- **Issue:** Plan template imported `import { Icon } from '@/components/signature-visuals'` for the close button glyph, but that barrel only exports `GlobeLoader`, `GlobeSpinner`, `Sparkline`, `Donut`, `FullscreenLoader`, `DossierGlyph`. There is no generic `Icon` component anywhere in `frontend/src/components/signature-visuals/`.
- **Fix:** Used `lucide-react`'s `X` icon — the convention already followed by every other dossier component (`DossierTypeIcon`, `DossierContextBadge`, etc.) and by `frontend/src/components/ui/sheet.tsx` itself.
- **Files modified:** `frontend/src/components/dossier/DossierDrawer/DrawerHead.tsx`
- **Commit:** `cc6083b8`

**2. [Rule 3 — Blocking] `useDossier` signature differs from plan template**

- **Found during:** Task 2 (`DossierDrawer.tsx`)
- **Issue:** Plan code wrote `useDossier(dossierId ?? undefined, { enabled: ... })`, but the real hook (`frontend/src/domains/dossiers/hooks/useDossier.ts`) signature is `useDossier(id: string, include?: string[], options?: UseQueryOptions<...>)`. Passing the options object as the second positional argument would have shipped the wrong query key and broken caching.
- **Fix:** Called as `useDossier(dossierId ?? '', undefined, { enabled: open && Boolean(dossierId) })`. The empty-string `id` is harmless because `enabled: false` short-circuits before any fetch (T-41-01-06 mitigation).
- **Files modified:** `frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx`
- **Commit:** `cc6083b8`

**3. [Rule 2 — Critical correctness] `isValidDossierType` from `dossier-type-guards` excludes `elected_official`**

- **Found during:** Task 1 (`_protected.tsx validateSearch`)
- **Issue:** Plan said to import and apply `isValidDossierType` from `@/lib/dossier-type-guards`. That helper's `DossierType` union and `getAllDossierTypes()` enumerate only 7 values (no `elected_official` — it's modeled as a `person.person_subtype` in that schema). But the plan's `must_haves` and `useDossierDrawer.ts` both name 8 types including `elected_official`. Reusing the guard would silently drop `?dossierType=elected_official` and the drawer would never open for elected officials — a regression the contract explicitly rules out.
- **Fix:** Inlined an 8-type whitelist (`VALID_DOSSIER_TYPES`) on `_protected.tsx` matching the drawer hook's enum exactly. Also defines a local `isValidDrawerDossierType` type guard so validateSearch returns the narrow union.
- **Files modified:** `frontend/src/routes/_protected.tsx`
- **Commit:** `ee7a9079`

**4. [Rule 3 — Blocking] TanStack Router strict typing rejects loose search reducers**

- **Found during:** Task 1 (`useDossierDrawer.ts` typecheck)
- **Issue:** `navigate({ search: (prev: Record<string, unknown>) => ({...}), replace: false })` failed type-check because TanStack Router's `NavigateOptions.search` is typed as `true | ParamsReducerFn<...>` — the loose `Record<string,unknown>` reducer doesn't structurally match.
- **Fix:** Cast the navigate argument as `as unknown as Parameters<typeof navigate>[0]` — the same workaround used across the codebase (`frontend/src/hooks/useContextAwareFAB.ts` lines 116/126/136/146/264/275). This preserves the runtime contract (TanStack Router still receives a working reducer) and matches existing precedent.
- **Files modified:** `frontend/src/hooks/useDossierDrawer.ts`
- **Commit:** `ee7a9079`

**5. [Rule 3 — Blocking] React 19 + tsconfig require `React.JSX.Element`, not bare `JSX.Element`**

- **Found during:** Task 2 (typecheck after stub creation)
- **Issue:** Plan template used `: JSX.Element` return types. With React 19 + this project's tsconfig, the global `JSX` namespace is no longer ambient — only `React.JSX` is. All 10 stub + shell files emitted `TS2503: Cannot find namespace 'JSX'`.
- **Fix:** Replaced `: JSX.Element` with `: React.JSX.Element` and added `import type * as React from 'react'` to each affected file. This matches the existing convention in `_protected.tsx` (which uses `: React.ReactElement`).
- **Files modified:** all 10 files in `frontend/src/components/dossier/DossierDrawer/`
- **Commit:** `cc6083b8`

### Plan-vs-spec key count

The plan text says "28 keys" in the dossier-drawer namespace; the verbatim UI-SPEC Copywriting Contract block embedded in the plan actually contains **30 leaf keys** (`accessible_title` + 6 cta + 2 chip + 6 meta + 4 kpi + 4 section + 4 empty + 3 error). I shipped exactly the verbatim 30 keys — no deletions, no inventions — which fully satisfies the "all 28 keys resolve" must-have plus 2 incidental.

## Threat Model — Status

| Threat ID  | Mitigation                                                                                                                                                  | Status        |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| T-41-01-01 | `validateSearch` reduces malformed dossier/dossierType to `undefined` (silent, no throw). Verified by hook test 1 (`open=false` when search empty).         | MITIGATED     |
| T-41-01-02 | All search params pass through `validateSearch` first; `useSearch({ strict:false })` swallows shape drift; `dossierId` forwarded to RLS-enforced backend.   | MITIGATED     |
| T-41-01-03 | All 30 i18n values render via React JSX text nodes (auto-escaped). No `<script>`, no `dangerouslySetInnerHTML`, no Trojan-Source bidi marks.                | MITIGATED     |
| T-41-01-04 | Wave 1 41-02 will land Open-full-dossier CTA — current stub returns empty `<div>`. No URL construction yet → no open-redirect surface introduced this wave. | DEFERRED→41-02 |
| T-41-01-05 | URL `?dossier=<uuid>` is intentional D-02 feature; backend RLS gates data access for unauthorized share-link recipients.                                    | ACCEPTED      |
| T-41-01-06 | `useDossier` + `useDossierOverview` both gated `enabled: open && Boolean(dossierId)` — zero requests when params absent or malformed.                       | MITIGATED     |
| T-41-01-07 | Radix `Dialog` provides `aria-modal="true"` + return-focus-on-close out of the box. Wave 2 a11y spec asserts Tab cycle.                                     | DEFERRED→41-07 |

## Known Stubs

All 8 section files are intentional Wave 0 STUBS — that is the entire point of this plan. Each renders a labeled empty section with `data-loading="true"`. Wave 1 plans 41-02..41-05 replace bodies one file at a time. Tracked here for the verifier:

| File                       | Why stubbed         | Resolved by    |
| -------------------------- | ------------------- | -------------- |
| DrawerHead.tsx             | Wave 0 contract     | 41-02 (Wave 1) |
| DrawerMetaStrip.tsx        | Wave 0 contract     | 41-02 (Wave 1) |
| DrawerCtaRow.tsx           | Wave 0 contract     | 41-02 (Wave 1) |
| MiniKpiStrip.tsx           | Wave 0 contract     | 41-03 (Wave 1) |
| SummarySection.tsx         | Wave 0 contract     | 41-03 (Wave 1) |
| UpcomingSection.tsx        | Wave 0 contract     | 41-04 (Wave 1) |
| RecentActivitySection.tsx  | Wave 0 contract     | 41-04 (Wave 1) |
| OpenCommitmentsSection.tsx | Wave 0 contract     | 41-05 (Wave 1) |

## Self-Check: PASSED

**Files exist:**

- FOUND: `frontend/src/hooks/useDossierDrawer.ts`
- FOUND: `frontend/src/hooks/__tests__/useDossierDrawer.test.tsx`
- FOUND: `frontend/src/lib/i18n/relativeTime.ts`
- FOUND: `frontend/src/lib/i18n/__tests__/relativeTime.test.ts`
- FOUND: `frontend/src/i18n/en/dossier-drawer.json`
- FOUND: `frontend/src/i18n/ar/dossier-drawer.json`
- FOUND: `frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx`
- FOUND: `frontend/src/components/dossier/DossierDrawer/DrawerSkeleton.tsx`
- FOUND: `frontend/src/components/dossier/DossierDrawer/DrawerHead.tsx`
- FOUND: `frontend/src/components/dossier/DossierDrawer/DrawerMetaStrip.tsx`
- FOUND: `frontend/src/components/dossier/DossierDrawer/DrawerCtaRow.tsx`
- FOUND: `frontend/src/components/dossier/DossierDrawer/MiniKpiStrip.tsx`
- FOUND: `frontend/src/components/dossier/DossierDrawer/SummarySection.tsx`
- FOUND: `frontend/src/components/dossier/DossierDrawer/UpcomingSection.tsx`
- FOUND: `frontend/src/components/dossier/DossierDrawer/RecentActivitySection.tsx`
- FOUND: `frontend/src/components/dossier/DossierDrawer/OpenCommitmentsSection.tsx`
- FOUND: `frontend/src/components/dossier/DossierDrawer/index.ts`
- FOUND: `frontend/src/components/dossier/DossierDrawer/__tests__/DossierDrawer.test.tsx`
- FOUND: `frontend/tests/e2e/support/dossier-drawer-fixture.ts`

**Commits exist:**

- FOUND: `ee7a9079` (Task 1)
- FOUND: `cc6083b8` (Task 2)
