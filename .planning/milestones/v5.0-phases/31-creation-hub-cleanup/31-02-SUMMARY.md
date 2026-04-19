---
phase: 31-creation-hub-cleanup
plan: 02
subsystem: frontend/dossier/wizard
tags: [frontend, wizard, guidance, i18n, heroui, rtl, localstorage]
requires:
  - 31-01 (CreateDossierHub landed; per-type wizards routable)
  - form-wizard (FormWizard step rendering)
  - i18n/index.ts (namespace registration)
provides:
  - StepGuidanceBanner (dismissible Alert with localStorage persistence)
  - WizardStepConfig.guidanceKey (optional per-step i18n key)
  - CreateWizardReturn.type (DossierType exposed by hook for shell wiring)
  - 8 per-type wizard i18n namespaces (EN + AR)
affects:
  - all 8 per-type wizard routes (banner now renders at top of every step)
key-files:
  created:
    - frontend/src/components/dossier/wizard/StepGuidanceBanner.tsx
    - frontend/src/components/dossier/wizard/__tests__/StepGuidanceBanner.test.tsx
    - frontend/src/i18n/en/country-wizard.json
    - frontend/src/i18n/ar/country-wizard.json
    - frontend/src/i18n/en/organization-wizard.json
    - frontend/src/i18n/ar/organization-wizard.json
    - frontend/src/i18n/en/forum-wizard.json
    - frontend/src/i18n/ar/forum-wizard.json
    - frontend/src/i18n/en/engagement-wizard.json
    - frontend/src/i18n/ar/engagement-wizard.json
    - frontend/src/i18n/en/topic-wizard.json
    - frontend/src/i18n/ar/topic-wizard.json
    - frontend/src/i18n/en/working-group-wizard.json
    - frontend/src/i18n/ar/working-group-wizard.json
    - frontend/src/i18n/en/person-wizard.json
    - frontend/src/i18n/ar/person-wizard.json
    - frontend/src/i18n/en/elected-official-wizard.json
    - frontend/src/i18n/ar/elected-official-wizard.json
  modified:
    - frontend/src/components/dossier/wizard/config/types.ts
    - frontend/src/components/dossier/wizard/config/country.config.ts
    - frontend/src/components/dossier/wizard/config/organization.config.ts
    - frontend/src/components/dossier/wizard/config/forum.config.ts
    - frontend/src/components/dossier/wizard/config/engagement.config.ts
    - frontend/src/components/dossier/wizard/config/topic.config.ts
    - frontend/src/components/dossier/wizard/config/working-group.config.ts
    - frontend/src/components/dossier/wizard/config/person.config.ts
    - frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts
    - frontend/src/components/dossier/wizard/CreateWizardShell.tsx
    - frontend/src/i18n/index.ts
decisions:
  - Chose shadcn Alert fallback over HeroUI v3 Alert (HeroUI not installed; 31-PATTERNS "No Analog Found" explicitly permits fallback)
  - Integrated banner at CreateWizardShell level (wraps each step child) rather than inside every step component — avoids 8+ duplicated wirings
  - Single person.config.ts hosts both person + elected-official wizards; guidance keys namespaced separately per config
  - Engagement 3rd step id is `engagement-participants` (actual) not `participants` (plan text) — used actual ID
metrics:
  duration_minutes: ~25
  tasks: 2/2
  commits: 1
  tests_added: 4
  tests_passing: 4
completed: 2026-04-18
---

# Phase 31 Plan 02: Step Guidance Banner + i18n Summary

Added a dismissible, per-step guidance banner (HeroUI-style using shadcn Alert fallback) to every step of all 8 per-type dossier creation wizards, with EN/AR copy, localStorage-persisted dismissal, and full RTL safety.

## What Was Built

### 1. `StepGuidanceBanner` component

- Reads dismissal state from `localStorage['dossier-wizard:guidance:{type}:{stepId}']` (D-12)
- try/catch-wrapped on both read and write — gracefully handles Safari private mode + quota errors
- Visual state hides immediately on dismiss even if persistence throws
- RTL-safe (`text-start`, `end-2`, `pe-12`, `ps-*` / `pe-*`)
- `data-testid="guidance-banner-{type}-{stepId}"` for test targeting
- Close button is a standard `<button>` with `aria-label={t('common:dismiss', 'Dismiss')}` and a 44x44 touch target on mobile

### 2. Type extensions

- `WizardStepConfig.guidanceKey?: string` — optional per-step i18n key
- `CreateWizardReturn.type: DossierType` — exposed so `CreateWizardShell` can build storage keys without a new prop
- `useCreateDossierWizard` now returns `type: config.type`

### 3. Shell integration

`CreateWizardShell` wraps each step child in a `<>StepGuidanceBanner + child</>` fragment when the step has a `guidanceKey`. This preserves FormWizard's "one child per step" contract (`React.Children.toArray(children)[currentStep]`) while injecting the banner at the top of every step body.

### 4. 8 wizard config updates — guidanceKey added to every step (D-14)

| Config                                                           | Step count | Step IDs                                                   |
| ---------------------------------------------------------------- | ---------- | ---------------------------------------------------------- |
| country                                                          | 3          | basic, country-details, review                             |
| organization                                                     | 3          | basic, org-details, review                                 |
| forum                                                            | 3          | basic, forum-details, review                               |
| engagement                                                       | 4          | basic, engagement-details, engagement-participants, review |
| topic                                                            | 2          | basic, review                                              |
| working-group                                                    | 3          | basic, wg-details, review                                  |
| person (person.config.ts, personWizardConfig)                    | 3          | basic, person-details, review                              |
| elected-official (person.config.ts, electedOfficialWizardConfig) | 4          | basic, person-details, office-term, review                 |

Total: **8 wizards, 25 guidance keys per locale = 50 keys across EN+AR.**

### 5. 16 new i18n files + index.ts registration

Per D-13, each per-type wizard has its own namespace: `{type}-wizard`. All 16 files (`en/*.json` + `ar/*.json`) created and registered in `frontend/src/i18n/index.ts`.

## HeroUI v3 Alert vs shadcn Fallback

**Chose shadcn.** HeroUI v3 `Alert` is NOT installed (`node_modules/@heroui` absent; grep of existing imports confirms only Modal/Button/Dropdown in use). 31-PATTERNS explicitly lists this as "No Analog Found" and permits the shadcn `Alert` at `@/components/ui/alert` (already consumed by `DossierListPage`) as the fallback. The banner uses `Alert` + `AlertDescription` + a custom dismiss button (shadcn's Alert doesn't include a close button).

## Tests

All 4 passing (`pnpm vitest run src/components/dossier/wizard/__tests__/StepGuidanceBanner.test.tsx`):

1. Renders translated guidance when no dismissal flag
2. Renders null when localStorage flag is `'1'`
3. Persists dismissal to localStorage on click + hides banner
4. Still dismisses visually when `localStorage.setItem` throws

## Verification

- `pnpm vitest run StepGuidanceBanner.test.tsx` → 4 passed, 0 failed
- `pnpm type-check` → 0 new errors in plan-touched files (1597 pre-existing errors in unrelated modules — `audit-logs`, `availability-polling`, `attachment-uploader`, various `src/types/*.types.ts` TS6133/TS6196 — reported but not introduced by this plan)
- JSON parse sweep: all 16 `*-wizard.json` files parse and contain `wizard.steps`
- RTL sweep on banner: zero `ml-*`/`mr-*`/`text-left`/`text-right` matches (the only hit is the docstring explicitly naming the forbidden classes)

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Blocking] Per-type `*-wizard.json` namespaces did not exist**

- **Issue:** Plan references 16 `{type}-wizard.json` files as if they existed; `ls frontend/src/i18n/{en,ar}/` shows only `persons.json`, `forums.json`, `engagements.json`, etc. — no `*-wizard.json` namespaces registered.
- **Fix:** Created all 16 files from scratch and registered each in `frontend/src/i18n/index.ts` (both `en`-resources and `ar`-resources blocks).
- **Files:** 16 new JSONs + `frontend/src/i18n/index.ts`.

**2. [Rule 3 - Blocking] HeroUI v3 `Alert` not installed**

- **Issue:** `@heroui/react` is not a dependency; plan's primary choice unavailable.
- **Fix:** Used 31-PATTERNS's documented fallback: shadcn `Alert` at `@/components/ui/alert`. Banner is subtle (flat, muted) and matches HeroUI v3 intent.
- **Documented above** in "HeroUI v3 Alert vs shadcn Fallback".

**3. [Rule 2 - Missing critical functionality] `CreateWizardReturn` didn't expose `type`**

- **Issue:** Shell needs `type` to build banner storage key; hook's return didn't include it.
- **Fix:** Added `type: DossierType` to `CreateWizardReturn` + returned `config.type` from `useCreateDossierWizard`. Non-breaking — all existing callers ignore extras on the return.

**4. [Rule 1 - Naming] Engagement's 3rd step id is `engagement-participants`, not `participants`**

- **Issue:** Plan copy used `participants`; actual config uses `engagement-participants`.
- **Fix:** Used the actual id in both `guidanceKey` and the `engagement-wizard.json` key path.

**5. [Rule 1 - Shared constants] person.config.ts hosts both person + elected-official wizards with shared step constants**

- **Issue:** If I added `guidanceKey` to the shared constants, both wizards would point at the same namespace.
- **Fix:** Renamed shared constants to `*Base` and spread them into per-wizard step arrays with distinct `guidanceKey` values (`person-wizard:` vs `elected-official-wizard:`).

### No architectural changes. No new dependencies.

## Commit

`2b5aa9c9 plan(31-02): step guidance banner + i18n across 8 wizards`

## Self-Check: PASSED

- Files exist: StepGuidanceBanner.tsx, test file, 16 i18n files, 7 config files (+ index.ts), shell + types + hook
- All guidance keys resolve in both locales (JSON parse sweep passed)
- All 4 unit tests pass
- Zero new TypeScript errors in plan-touched files
