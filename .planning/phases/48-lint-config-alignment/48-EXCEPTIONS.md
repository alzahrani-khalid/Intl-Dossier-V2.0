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
