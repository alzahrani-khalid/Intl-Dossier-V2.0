---
phase: 86
slug: feature-completion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-06
---

# Phase 86 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `86-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property               | Value                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Framework**          | Vitest (unit/component) + Playwright (E2E / a11y / visual)                                                                                 |
| **Config file**        | `frontend/vitest.config.ts`, `frontend/playwright.config.ts` (testDir `frontend/tests`, baseURL `E2E_BASE_URL` ?? `http://localhost:5173`) |
| **Quick run command**  | `pnpm --dir frontend test -- run <file>`                                                                                                   |
| **Full suite command** | `pnpm --dir frontend test -- run && pnpm --dir frontend lint --max-warnings 0 && pnpm --dir frontend type-check`                           |
| **Estimated runtime**  | ~60–120s (targeted files ~seconds; full vitest ~1–2 min)                                                                                   |

---

## Sampling Rate

- **After every task commit:** targeted `pnpm --dir frontend test -- run <file>` + `pnpm --dir frontend type-check` (pre-commit hook also builds)
- **After every plan wave:** `pnpm --dir frontend test -- run` + `pnpm --dir frontend lint --max-warnings 0`
- **Before `/gsd:verify-work`:** full vitest + lint + type-check + the two E2E specs + the FEAT-04 grep gate must be green
- **Max feedback latency:** ~120 seconds

---

## Per-Task Verification Map

> Task IDs are assigned by the planner. This map is seeded from the requirement→test map in
> `86-RESEARCH.md`; the executor fills `Task ID` / `Status` as plans are written and run.

| Task ID | Plan               | Wave | Requirement         | Threat Ref             | Secure Behavior                                                                                                                               | Test Type                       | Automated Command                                                                                         | File Exists | Status     |
| ------- | ------------------ | ---- | ------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| TBD     | mous               | 1    | FEAT-01             | —                      | Create dialog validates bilingual titles + enum/date/signatory refines; submits payload incl. `parties` jsonb                                 | unit/component                  | `pnpm --dir frontend test -- run src/components/mous/__tests__/CreateMouDialog.test.tsx`                  | ❌ W0       | ⬜ pending |
| TBD     | mous               | 1    | FEAT-01             | —                      | Click Add MoU → fill → submit → new row visible in list                                                                                       | e2e                             | `pnpm --dir frontend exec playwright test tests/e2e/mou-create.spec.ts`                                   | ❌ W0       | ⬜ pending |
| TBD     | users              | 1    | FEAT-02             | T-86-idor / self-grant | Create form mirrors edge validators (username regex, role set `admin/editor/viewer`, clearance 1–4); invokes `create-user`, navigates to list | unit/component                  | `pnpm --dir frontend test -- run src/pages/users/__tests__/UserCreatePage.test.tsx`                       | ❌ W0       | ⬜ pending |
| TBD     | users              | 1    | FEAT-02             | idor                   | Admin creates user → 201 → row appears (inactive) in list                                                                                     | e2e/smoke                       | `pnpm --dir frontend exec playwright test tests/e2e/user-management.spec.ts`                              | ❌ W0       | ⬜ pending |
| TBD     | users              | 1    | FEAT-03             | self-grant             | Detail renders fields; role change handles immediate + `requires_approval`; deactivate/reactivate flips status badge                          | unit/component                  | `pnpm --dir frontend test -- run src/pages/users/__tests__/UserDetailPage.test.tsx`                       | ❌ W0       | ⬜ pending |
| TBD     | consistency-delete | 1    | FEAT-04             | —                      | Repo grep for `ConsistencyPanel` + `consistency.` i18n keys returns 0 in live code; full vitest green post-deletion                           | integration (grep gate + suite) | `rg -l "ConsistencyPanel" frontend/src --glob '!**/.understand-anything/**'` (expect empty) + full vitest | gate cmd    | ⬜ pending |
| TBD     | (all UI)           | —    | EN/AR (criterion 5) | —                      | New dialog/pages render in `dir="rtl"` with AR strings + logical properties                                                                   | e2e (`?lng=ar`) + manual render | Playwright `?lng=ar` + screenshot; human render sign-off                                                  | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `frontend/src/components/mous/__tests__/CreateMouDialog.test.tsx` — FEAT-01 unit
- [ ] `frontend/tests/e2e/mou-create.spec.ts` — FEAT-01 e2e (auth via `.env.test` credentials; profile-org pitfall)
- [ ] `frontend/src/pages/users/__tests__/UserCreatePage.test.tsx` — FEAT-02 unit (mock `invoke`)
- [ ] `frontend/src/pages/users/__tests__/UserDetailPage.test.tsx` — FEAT-03 unit
- [ ] `frontend/tests/e2e/user-management.spec.ts` — FEAT-02/03 e2e (create → list → detail → role/status)
- Framework install: none (Vitest + Playwright already configured)

---

## Manual-Only Verifications

| Behavior                                        | Requirement                 | Why Manual                                                                         | Test Instructions                                                                    |
| ----------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Final visual sign-off of the three new surfaces | FEAT-01/02/03 + criterion 5 | New pages have no pixel baselines (out of scope); house practice from Phases 81–85 | Render at 1400 + 1024, dark, EN + AR; human confirms Linear tokens/radii/RTL Tajawal |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (5 test files above)
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
