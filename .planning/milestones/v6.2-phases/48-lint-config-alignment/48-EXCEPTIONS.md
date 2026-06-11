# Phase 48 — EXCEPTIONS Ledger

This file is the phase-wide ledger for lint suppressions and D-17 reconciliation across Phase 48 (`lint-config-alignment`).

- **D-17:** Zero net-new `eslint-disable` / `eslint-disable-next-line` / `eslint-disable-line` directives introduced by Phase 48.
- **TYPE-04 carry-forward:** Zero net-new `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck` suppressions introduced by Phase 48.
- **Phase-base anchor:** `phase-48-base` -> `baaf644a15fdcf97aa11c70f27a1187d558adaee`.

---

## Phase-wide D-17 reconciliation

| Metric                                                                       | Target                                           | Observed                                         | Status |
| ---------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------ | ------ |
| Net-new `eslint-disable` (frontend/src + backend/src, `phase-48-base..HEAD`) | 0                                                | 0                                                | PASS   |
| Net-new `@ts-(ignore\|expect-error\|nocheck)` (carry-forward Phase 47 D-01)  | 0                                                | 0                                                | PASS   |
| Stale `eslint-disable` deletions (48-02 Task 3)                              | 9 directive deletions + 1 unused import deletion | 9 directive deletions + 1 unused import deletion | PASS   |

Audit commands:

```bash
git diff phase-48-base..HEAD -- 'frontend/src' 'backend/src' \
  | grep -E '^\+.*eslint-disable' \
  | grep -vE '^\+\+\+' \
  > /tmp/48-03-eslint-disable-additions.txt
wc -l < /tmp/48-03-eslint-disable-additions.txt
# 0

git diff phase-48-base..HEAD -- 'frontend/src' 'backend/src' \
  | grep -E '^\+.*@ts-(ignore|expect-error|nocheck)' \
  | grep -vE '^\+\+\+' \
  > /tmp/48-03-ts-suppression-additions.txt
wc -l < /tmp/48-03-ts-suppression-additions.txt
# 0

git diff phase-48-base..HEAD -- 'frontend/src' 'backend/src' \
  | grep -E '^\-.*eslint-disable' \
  | grep -vE '^\-\-\-' \
  > /tmp/48-03-eslint-disable-deletions.txt
wc -l < /tmp/48-03-eslint-disable-deletions.txt
# 9
```

Note: the 48-03 plan template described the stale-deletion row as `>= 10 (9 directives + 1 from FirstRunModal scope)`. The implemented 48-02 summary corrected that inventory: the tenth fix was an unused import deletion in `DrawerMetaStrip.test.tsx`, not an `eslint-disable` directive. The directive-deletion target is therefore 9 and passes.

## Retained suppressions

No retained suppression was introduced by Phase 48. The following suppressions are inherited from before `phase-48-base` and are listed for visibility:

| File                                                                             | Rule                                        | Reason                                                           | Phase 48 disposition                  |
| -------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------- |
| `backend/src/integrations/PKIClient.ts`                                          | `@typescript-eslint/no-require-imports`     | Loads Node `fs` lazily inside `loadFile`; inherited suppression. | Unchanged; not part of Phase 48 diff. |
| `backend/src/middleware/rate-limit.middleware.ts`                                | `@typescript-eslint/triple-slash-reference` | References local Express type augmentation.                      | Unchanged; not part of Phase 48 diff. |
| `frontend/src/components/signature-visuals/__tests__/GlobeLoader.rings.test.tsx` | `@typescript-eslint/no-require-imports`     | Vitest mock returns real `d3-geo` module.                        | Unchanged; not part of Phase 48 diff. |

## Carve-outs ledger (D-09 + D-10)

Per D-10, every carve-out in `eslint.config.mjs` carries an inline rationale comment with the glob, the rule it exempts, and the approximate suppressed-violation count. The carve-out inventory has two cohorts:

### 48-01 baseline carve-outs (5 globs, inline rationale per glob)

Added in commit `e9284ee1` (`chore(48-01): consolidate ESLint config`). Each of the 4 frontend check-file blocks (`components`, `hooks`, `types`, `lib`) gained these `ignores:` patterns; each of the 4 backend check-file blocks (`services`, `models`, `api`, `middleware`) gained `**/__tests__/**` only.

| #   | Glob                            | Rule exempted                           | Reason                                                                              | Approx. suppressed violations  |
| --- | ------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------ |
| 1   | `**/__tests__/**`               | `check-file/filename-naming-convention` | Test file naming follows Vitest convention (`*.test.tsx`, `*.spec.ts`), not KEBAB.  | ~50 (frontend) + ~30 (backend) |
| 2   | `**/signature-visuals/flags/**` | `check-file/filename-naming-convention` | ISO-3166 alpha-2 flag SVGs use uppercase country codes (e.g., `SA.svg`), not KEBAB. | ~250                           |
| 3   | `**/hooks/**`                   | `check-file/filename-naming-convention` | React hook convention (`useFoo.ts`) is camelCase, not KEBAB.                        | ~80                            |
| 4   | `**/utils/**`                   | `check-file/filename-naming-convention` | Utility helpers ship as camelCase (`api-helpers.ts`, `dateFormat.ts`).              | ~40                            |
| 5   | `**/config/**`                  | `check-file/filename-naming-convention` | Config files follow the framework's expected names (no KEBAB enforcement).          | ~20                            |

### 48-02 scope-expansion carve-outs (Wave-1-handoff authorized, commit `ea5db535`)

Per D-09 (renames deferred at this stage) + D-10 (inline rationale required), the carve-out inventory was extended after 48-01 baseline revealed the real-world residual exceeded the 5-glob plan estimate. All new carve-outs use the exact same shape as the 48-01 cohort.

| #   | Glob / config                                                                                                                                     | Rule exempted                           | Reason                                                                                                                                                        | Approx. suppressed violations |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| 6   | `**/components/{FirstRun,ConflictResolution,DossierDrawer,Dashboard,ExpandedPanel,IconRail,NavigationShell}/**` (via folder-naming `ignoreWords`) | `check-file/folder-naming-convention`   | PascalCase folder names referenced by `routeTree.gen.ts` + lazy imports — rename would cascade across the FE.                                                 | 28 folder errors              |
| 7   | Additional kebab-case + camelCase paths (co-located component files)                                                                              | `check-file/filename-naming-convention` | Repo convention is heterogeneous: PascalCase React components live alongside camelCase hooks and lowercase enum-likes co-located with their owning component. | 32 filename errors            |
| 8   | `no-restricted-imports` split — `paths` array (exact-name match)                                                                                  | `no-restricted-imports`                 | Narrows `kibo-ui` and `aceternity-ui` bans to npm-package exact match; local `@/components/kibo-ui/*` alias no longer false-positives.                        | 2 false-positives             |

Total carve-outs across both cohorts: **8 globs / config knobs**, all with inline rationale comments in `eslint.config.mjs`.

## Deferred items (carry-forward into post-Phase-48 work)

Tracked here so they are not lost between phases.

1. **`tests/setup.ts` `react-i18next` mock** — the global `vi.mock('react-i18next', () => ({ useTranslation: ... }))` omits `initReactI18next`, causing any test that transitively imports `frontend/src/components/language-provider/language-provider.tsx` to fail at module-evaluation time. 48-02 preserved the status quo (lint clean, tests fail in the same way as before). Fix is to extend the mock with `initReactI18next: { type: '3rdParty', init: () => {} }`. Test-infra cleanup; out of scope for a lint-zero plan.
2. **kibo-ui local-alias refactor (TasksTab + EngagementKanbanDialog)** — both files import `@/components/kibo-ui/kanban` (a local repo primitive, not the upstream npm package). The CLAUDE.md primitive cascade bans the local `kibo-ui` dir long-term. 48-02 chose option (b) — narrow the `no-restricted-imports` patterns — over option (a) — refactor the call sites — because HeroUI v3 is BETA with no published Kanban primitive; the replacement requires substantial React Aria + `@dnd-kit` refactor that exceeds lint-zero scope. Logged as a follow-up UI-refactor plan.
3. **Smoke-PR lint-failure attribution nuance (Phase 48-03, Task 3)** — `origin/main` is currently lint-red because the 48-02 fixes are on `DesignV2` and not yet merged. The smoke PRs targeting `main` produced `Lint=fail`, but the failure was not isolable to the injected violation alone — the pre-existing baseline rot also contributes. The gate-enforcement claim (byte-exact context name match → `mergeStateStatus=BLOCKED`) is still proven; the "this single violation caused the fail" claim is provable only after `DesignV2 → main` merges. Tracked for the v6.2 milestone merge to optionally re-run a clean smoke PR against the post-merge `main` if extra confidence is desired.

## CI gate state (final)

Captured at Phase 48-03 close-out via `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection`:

```json
{
  "required_status_checks": {
    "contexts": ["Lint", "Security Scan", "type-check"],
    "strict": true
  },
  "enforce_admins": { "enabled": true },
  "required_pull_request_reviews": { "required_approving_review_count": 1 }
}
```

- `Lint` was added to the required-context set by 48-03 Task 2 (PUT diff vs. snapshot in `/tmp/48-03-protection-before.json` shows ONLY `Lint` added, no other field touched).
- `type-check` was added earlier by 47-03; `Security Scan` was pre-existing.
- `enforce_admins=true` was preserved across the PUT (D-15 requirement).
- Smoke PRs #7 (frontend) and #8 (backend) verified the byte-exact casing match: both produced `mergeStateStatus=BLOCKED` with `Lint=fail`.

## Phase scope summary

Files touched (`phase-48-base..HEAD`):

```text
.planning/STATE.md
.planning/phases/48-lint-config-alignment/48-01-config-consolidation-SUMMARY.md
.planning/phases/48-lint-config-alignment/48-02-violation-fixes-SUMMARY.md
.planning/phases/48-lint-config-alignment/48-PATTERNS.md
.planning/phases/48-lint-config-alignment/48-RESEARCH.md
backend/package.json
backend/src/services/event.service.ts
backend/src/services/signature.service.ts
eslint.config.mjs
frontend/eslint.config.js
frontend/package.json
frontend/src/components/activity-feed/__tests__/ActivityList.test.tsx
frontend/src/components/ai/ChatMessage.tsx
frontend/src/components/dossier/DossierDrawer/__tests__/DrawerMetaStrip.test.tsx
frontend/src/components/dossier/__tests__/DossierShell.test.tsx
frontend/src/components/dossier/wizard/__tests__/CreateWizardShell.test.tsx
frontend/src/components/dossier/wizard/__tests__/SharedBasicInfoStep.test.tsx
frontend/src/components/dossier/wizard/hooks/__tests__/useCreateDossierWizard.test.ts
frontend/src/components/dossier/wizard/hooks/__tests__/useDraftMigration.test.ts
frontend/src/components/signature-visuals/GlobeLoader.tsx
frontend/src/components/signature-visuals/__tests__/GlobeLoader.reducedMotion.test.tsx
frontend/src/components/signature-visuals/__tests__/GlobeLoader.rotation.test.tsx
frontend/src/components/signature-visuals/__tests__/GlobeLoader.test.tsx
frontend/src/components/ui/3d-card.tsx
frontend/src/components/ui/COMPONENT_REGISTRY.md
frontend/src/components/ui/bento-grid.tsx
frontend/src/components/ui/floating-navbar.tsx
frontend/src/domains/work-items/hooks/useWorkItemDossierLinks.ts
frontend/src/pages/dossiers/__tests__/CreateDossierHub.test.tsx
turbo.json
```

- Aceternity wrappers deleted: `3d-card.tsx`, `bento-grid.tsx`, `floating-navbar.tsx` (D-07).
- Configs consolidated: `frontend/eslint.config.js` deleted (D-01); root `eslint.config.mjs` holds inverted `no-restricted-imports` (D-05/D-06).
- Branch protection updated: `Lint` added to `required_status_checks.contexts`; `enforce_admins=true` preserved (D-15).
- Smoke PRs verified: https://github.com/alzahrani-khalid/Intl-Dossier-V2.0/pull/7 (closed), https://github.com/alzahrani-khalid/Intl-Dossier-V2.0/pull/8 (closed) — both `mergeStateStatus=BLOCKED` with `Lint=fail`.
