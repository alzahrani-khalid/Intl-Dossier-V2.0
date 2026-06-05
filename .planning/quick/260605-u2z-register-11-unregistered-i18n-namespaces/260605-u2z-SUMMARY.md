---
phase: quick-260605-u2z
plan: 01
subsystem: frontend-i18n
tags: [i18n, arabic, rtl, namespaces, runtime-resolution]
requires: []
provides:
  - All 11 referenced-but-unregistered i18n namespaces now resolve from the static `resources` object in both `en` and `ar`
affects:
  - frontend/src/i18n/index.ts
  - Any component using useTranslation() with admin / ai-admin / ai-brief / ai-chat / dossier-context / entity-linking / graph / preview-layouts / geographic-visualization / push-notifications / retention-policies
tech-stack:
  added: []
  patterns:
    - Static JSON import + `resources.{en,ar}` registration (no i18next-http-backend; public/locales/** is dead at runtime)
key-files:
  created:
    - frontend/src/i18n/en/admin.json
    - frontend/src/i18n/ar/admin.json
    - frontend/src/i18n/en/ai-admin.json
    - frontend/src/i18n/ar/ai-admin.json
    - frontend/src/i18n/en/ai-brief.json
    - frontend/src/i18n/ar/ai-brief.json
    - frontend/src/i18n/en/ai-chat.json
    - frontend/src/i18n/ar/ai-chat.json
    - frontend/src/i18n/en/dossier-context.json
    - frontend/src/i18n/ar/dossier-context.json
    - frontend/src/i18n/en/entity-linking.json
    - frontend/src/i18n/ar/entity-linking.json
    - frontend/src/i18n/en/graph.json
    - frontend/src/i18n/ar/graph.json
    - frontend/src/i18n/en/preview-layouts.json
    - frontend/src/i18n/ar/preview-layouts.json
  modified:
    - frontend/src/i18n/index.ts
decisions:
  - Group B namespaces (geographic-visualization, push-notifications, retention-policies) already had src/i18n JSON on disk — registered (import + resource entry) without copying.
  - Single-word namespaces (admin, graph) registered with unquoted keys to match existing style (dashboard:, compliance:); all hyphenated keys quoted.
  - public/locales/** originals left in place (out of scope) — they are dead at runtime but not removed.
metrics:
  duration: ~3 min
  completed: 2026-06-05
  tasks: 2
  files: 17
---

# Phase quick-260605-u2z Plan 01: Register 11 unregistered i18n namespaces Summary

Registered 11 referenced-but-unregistered i18n namespaces in the frontend's static `resources` object so their Arabic strings resolve at runtime instead of silently falling back to inline English defaults — `frontend/src/i18n/index.ts` bundles every namespace statically (no `i18next-http-backend`), so any namespace absent from `resources` returned the English default even in Arabic mode.

## What was done

**Task 1 — Copy 8 Group A namespace JSON pairs (16 files):**
Byte-for-byte copied `admin`, `ai-admin`, `ai-brief`, `ai-chat`, `dossier-context`, `entity-linking`, `graph`, `preview-layouts` from `frontend/public/locales/{en,ar}/` into `frontend/src/i18n/{en,ar}/`. Verified each destination is byte-identical to its source via `cmp -s`. Originals in `public/locales/` left untouched.

**Task 2 — Register all 11 namespaces in `index.ts`:**

- Added 11 static import pairs (`en<Id>` / `ar<Id>`, camelCase identifiers) after the existing `tasks-page` import block.
- Added 11 entries to `resources.en` and the identical 11 to `resources.ar`, keyed by the exact hyphenated namespace strings (`'ai-brief'`, `'dossier-context'`, etc.); single-word `admin` and `graph` use unquoted keys to match existing convention.
- Covered both Group A (8, newly copied) and Group B (3 — `geographic-visualization`, `push-notifications`, `retention-policies` — already on disk, registration-only).

## Verification

- `pnpm exec tsc --noEmit -p tsconfig.json` (frontend) → exit 0, zero errors (`resolveJsonModule` already enabled — proven by the existing 100+ JSON imports).
- All 11 namespace keys appear in BOTH `resources.en` and `resources.ar` (grep count ≥2 each, confirmed against the committed `HEAD` blob).
- Commit `46bad7d8` contains exactly 17 files (16 JSON + `index.ts`), 1641 insertions, 0 deletions.
- Pre-commit hook (`pnpm build`) passed.

## Deviations from Plan

None — plan executed exactly as written.

## Out of scope (untouched, as instructed)

- `frontend/src/routeTree.gen.ts` — pre-existing unrelated dirty file; not staged, committed, or reverted.
- `frontend/public/locales/**` originals — left in place (still dead at runtime).

## Commits

- `46bad7d8`: fix(quick-260605-u2z): register 11 unregistered i18n namespaces so Arabic resolves at runtime

## Self-Check: PASSED

- 16 Group A JSON files present and tracked at `HEAD`.
- All 11 namespace keys present (≥2 occurrences each) in committed `index.ts`.
- Commit `46bad7d8` exists in git log.

## Follow-up (orchestrator, verification-driven)

The initial audit only matched single-string `useTranslation('X')`. Post-execution verification also
swept array-form `useTranslation(['X', ...])` and `{ ns: 'X' }` references and found **3 more orphans of
the same class** whose JSON lived in the dead `public/locales/{en,ar}`: **countries, organizations, topics**.
These are the PRIMARY namespace of the dossier list pages (`countries/index.tsx`, `organizations/index.tsx`,
`topics/-TopicsListPage.tsx`) — the report's own Countries list among them — so bare `t()` calls never
resolved (English defaults / raw keys in both languages). Copied the 6 JSON files into `src/i18n/{en,ar}`
and registered all 3. `tsc --noEmit` exit 0; pre-commit build passed.

`lists` was also referenced (via `{ ns: 'lists' }`) but has NO JSON anywhere — a phantom reference, left
as-is (nothing to register).

**Total namespaces registered: 14** (11 + 3).
Commit: `05175c87` — fix(quick-260605-u2z): register 3 array-form orphan i18n namespaces (countries/organizations/topics)
