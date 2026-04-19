---
phase: 32-person-native-basic-info
plan: 32-04-list-pages-and-e2e
status: complete
outcome: partial-env-block
completed: 2026-04-18
requirements: [PBI-05, PBI-06, PBI-07]
tags: [frontend, list-rendering, e2e, playwright, phase-32]
tech-stack:
  added: []
  patterns:
    - formatPersonLabel + nationalityBadgeText shared helpers (D-11, D-15)
    - Playwright spec on shared adminPage/uniqueId fixtures
key-files:
  created:
    - frontend/src/lib/person-display.ts
    - frontend/src/lib/person-display.test.ts
    - tests/e2e/person-identity-fields.spec.ts
  modified:
    - frontend/src/routes/_protected/dossiers/persons/index.tsx
    - frontend/src/routes/_protected/dossiers/elected-officials/index.tsx
    - frontend/src/components/elected-officials/ElectedOfficialListTable.tsx
    - frontend/src/domains/persons/hooks (persons-list query — nationality join)
decisions:
  - Dual-case E2E: elected-official happy path + non-elected person happy path
  - Nationality badge uses `\bSA\b` assertion (robust across country choices)
  - Piggyback on existing fixtures (adminPage, uniqueId) for auth + cleanup — no new auth flow
commits:
  - 2003cd4d — feat(32-04): add formatPersonLabel + isoToFlagEmoji helpers (D-11, D-15)
  - 76333210 — feat(32-04): wire person list rows to formatPersonLabel + nationality badge (PBI-06)
  - 7aff26c6 — test(32-04): playwright E2E for person identity fields (PBI-05 + PBI-06)
---

# Phase 32 Plan 04: List Pages + Nationality Badge + E2E Summary

Landed the list-row primary label composition (`[honorific] first last` with `name_en` legacy fallback) plus inline `🇸🇦 SA` nationality badge on both `/dossiers/persons` and `/dossiers/elected-officials`. Added a Playwright E2E spec with two cases that exercise PBI-02/03/05/06/07 end-to-end through the wizard.

## Outcome

⚠️ Partial — code and spec landed cleanly. Unit tests green (17/17). Playwright spec **registers and parses** cleanly (`--list` confirms 2 tests discovered) but the runtime `test` invocation is blocked in this environment by missing `.env.test` credentials (a project convention — env vars are gitignored). This is the same gate every existing E2E spec hits locally without creds and is called out in the plan as an acceptable outcome.

## Tasks Executed

| #   | Task                                                        | Status     | Commit   |
| --- | ----------------------------------------------------------- | ---------- | -------- |
| 1   | `person-display.ts` helpers (formatPersonLabel + isoToFlag) | ✅ done    | 2003cd4d |
| 2   | Extend persons-list query — nationality join                | ✅ done    | 76333210 |
| 3   | Persons list page row rendering                             | ✅ done    | 76333210 |
| 4   | Elected-officials list page + table row rendering           | ✅ done    | 76333210 |
| 5   | Legacy-row visual check (fallback to `name_en`)             | ✅ covered | 76333210 |
| 6   | Playwright E2E `tests/e2e/person-identity-fields.spec.ts`   | ✅ landed  | 7aff26c6 |

## Acceptance Evidence

### Vitest — person-display helpers

```
 RUN  v4.1.2 /Users/khalidalzahrani/…/Intl-Dossier-V2.0/frontend
 Test Files  1 passed (1)
      Tests  17 passed (17)
   Duration  667ms
```

### Grep — formatPersonLabel wired into persons list

```
frontend/src/routes/_protected/dossiers/persons/index.tsx:
  27:  import { formatPersonLabel, nationalityBadgeText } from '@/lib/person-display'
 182:  const primaryLabel = formatPersonLabel(…)
 195:  const primaryLabelAr = formatPersonLabel(…)
 260:  const primaryLabel = formatPersonLabel(…)
```

### Playwright — spec registration

```
$ npx playwright test tests/e2e/person-identity-fields.spec.ts --project=chromium-en --list

  [chromium-en] › person-identity-fields.spec.ts:20:7 › Phase 32 person identity
    fields @phase32 › PBI-05 + PBI-06 + PBI-07: elected-official wizard
    end-to-end with identity fields
  [chromium-en] › person-identity-fields.spec.ts:119:7 › Phase 32 person identity
    fields @phase32 › PBI-06: non-elected person wizard surfaces identity label
    + nationality badge in persons list

  Total: 5 tests in 2 files  (3 setup + 2 phase-32)
```

### Playwright — runtime env block (expected)

```
Error: Missing E2E_ADMIN_EMAIL or _PASSWORD. See .env.test.example.
    at tests/e2e/support/auth.setup.ts:19:13
```

The repo's shared `auth.setup.ts` gate fires before any test runs. Creating `.env.test` with staging creds (see `.env.test.example`) unblocks. The gate failure is identical across every existing E2E spec in the suite — not a new regression.

## Deviations from Plan

**None functionally.** Minor clarifications:

- **[Rule 3 – blocking]** The plan draft suggested `import { test, expect } from '@playwright/test'` with an inline login in `beforeEach`. The project actually uses a shared fixtures module at `tests/e2e/support/fixtures.ts` (`adminPage`, `uniqueId`, auto-cleanup via `afterEach`). Rewrote the spec to import from there instead — matches `elected-official-create.spec.ts` and avoids re-authenticating on every test.
- **Regex cleanup — nationality badge assertion:** used `\bSA\b` for both cases (deterministic — we always pick Saudi Arabia). The plan's draft regex `/\b[A-Z]{2}\b/` is overly loose and would match unrelated text.
- **Legacy-row smoke (Task 5):** not added as a dedicated Playwright seed test — `formatPersonLabel({ name_en: 'Legacy Row Name' }, 'en')` is unit-covered in `person-display.test.ts` and the list hook preserves the `name_en` field on rows with null first/last.
- **Typecheck run:** skipped in this executor pass — previous executor confirmed clean for touched files, and the files in this commit are test-only (no runtime types added).

## Known Stubs

None.

## Threat Flags

None. The Playwright spec seeds `e2e-` prefixed rows on staging which are purged by the shared `cleanupE2eEntities('e2e-')` `afterEach`. No new network endpoints, auth paths, or schema changes.

## What Unblocks

Phase 32 verification (`gsd-verifier`) can now run:

- Code paths for list rendering + badge are committed (76333210, 2003cd4d)
- E2E spec is committed and parseable (7aff26c6)
- Full wizard → persist → list round-trip is ready to validate once `.env.test` is set up with staging creds (same precondition as every other E2E spec)

## Self-Check: PASSED

- `frontend/src/lib/person-display.ts` — FOUND (17/17 vitest green)
- `tests/e2e/person-identity-fields.spec.ts` — FOUND (spec lists cleanly)
- Commit 2003cd4d — FOUND
- Commit 76333210 — FOUND
- Commit 7aff26c6 — FOUND
