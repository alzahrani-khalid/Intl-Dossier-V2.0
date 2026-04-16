---
phase: 29
slug: complex-type-wizards
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 29 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `29-RESEARCH.md` §8 "Validation Architecture".

---

## Test Infrastructure

| Property               | Value                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest 1.x (unit/integration) + Playwright (E2E) + axe-core (a11y)                                                           |
| **Config file**        | `frontend/vitest.config.ts`, `frontend/playwright.config.ts`                                                                 |
| **Quick run command**  | `cd frontend && pnpm vitest run src/components/dossier/wizard src/components/work-creation/DossierPicker --reporter=default` |
| **Full suite command** | `pnpm test && pnpm typecheck && pnpm lint`                                                                                   |
| **Estimated runtime**  | ~45 seconds (quick) / ~6 minutes (full + E2E)                                                                                |

---

## Sampling Rate

- **After every task commit:** Run quick command scoped to the changed directory
- **After every plan wave:** Run full suite command
- **Before `/gsd-verify-work`:** Full suite must be green + E2E wizard walkthrough passes
- **Max feedback latency:** 60 seconds for quick; 360 seconds for full

---

## Per-Task Verification Map

_Populated by `gsd-planner` when PLAN.md files land. Each plan task inherits the rows below grouped by its plan number._

| Task ID  | Plan                            | Wave | Requirement                        | Threat Ref | Secure Behavior                                                                                                                                  | Test Type   | Automated Command                                                                                                                                                              | File Exists | Status     |
| -------- | ------------------------------- | ---- | ---------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ---------- |
| 29-00-00 | (schema push)                   | 0    | —                                  | —          | schema migration applied before any wizard build                                                                                                 | manual      | `supabase db push` or Supabase MCP `apply_migration`                                                                                                                           | ⬜ W0       | ⬜ pending |
| 29-01-XX | 01 (DossierPicker multi-select) | 1    | ENGM-04                            | —          | multi-select props ship without breaking single-select callers                                                                                   | unit        | `pnpm vitest run src/components/work-creation/__tests__/DossierPicker.test.tsx`                                                                                                | ⬜ W0       | ⬜ pending |
| 29-02-XX | 02 (WG migration)               | 1    | WG-02                              | —          | `working_groups.parent_body_id` column + FK + index present                                                                                      | migration   | Supabase MCP `list_tables` + check column                                                                                                                                      | ⬜ W0       | ⬜ pending |
| 29-03-XX | 03 (Forum wizard)               | 2    | FORUM-01, FORUM-02, FORUM-03       | —          | forum creation round-trips to detail page; organizing_body FK persists                                                                           | integration | `pnpm vitest run src/components/dossier/wizard/steps/__tests__/ForumDetailsStep.test.tsx` + E2E `forum-create.spec.ts`                                                         | ⬜ W0       | ⬜ pending |
| 29-04-XX | 04 (WG wizard)                  | 2    | WG-01, WG-02, WG-03                | —          | WG creation round-trips to detail page; parent_body_id persists; mandate bilingual                                                               | integration | `pnpm vitest run src/components/dossier/wizard/steps/__tests__/WorkingGroupDetailsStep.test.tsx` + E2E `working-group-create.spec.ts`                                          | ⬜ W0       | ⬜ pending |
| 29-05-XX | 05 (Engagement wizard)          | 2    | ENGM-01, ENGM-02, ENGM-03, ENGM-05 | —          | engagement creation persists 4 steps incl. participants; start_date/end_date required; category aligns with live CHECK; dates validate end≥start | integration | `pnpm vitest run src/components/dossier/wizard/steps/__tests__/EngagementDetailsStep.test.tsx __tests__/EngagementParticipantsStep.test.tsx` + E2E `engagement-create.spec.ts` | ⬜ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Observable Surfaces

| Surface                                                                                   | Harness                                                                        |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------- | ---------------------------------- |
| Wizard step navigation + validation                                                       | Vitest + @testing-library/react (`render`, `screen.getByRole`, `fireEvent`)    |
| DossierPicker multi-select chip UX (RTL + mobile)                                         | Vitest + @testing-library/react + viewport override; axe-core a11y audit       |
| TanStack Query cache invalidation on submit                                               | Vitest + `QueryClientProvider` wrapper; assert `['dossiers', 'forum'           | 'working_group' | 'engagement']` queries invalidated |
| DB persistence (forum organizing_body / WG parent_body_id / engagement_participants rows) | Playwright E2E reading via Supabase client after wizard completion             |
| i18n bilingual render (EN + AR)                                                           | Vitest snapshot per wizard step in both `i18n.changeLanguage('en')` and `'ar'` |
| a11y (axe-core)                                                                           | @axe-core/react in each wizard step test                                       |

---

## Coverage Dimensions

1. **Arabic RTL layout** — every new wizard step + the multi-select DossierPicker must pass an axe+visual check with `dir="rtl"` and Arabic text. Chips flow right-to-left; logical properties (ms-_, me-_, ps-_, pe-_) only.
2. **Mobile-first responsive** — all new steps tested at `320px`, `640px`, `1024px` viewports.
3. **Required-field validation** — engagement `start_date`, `end_date`, `engagement_type`, `engagement_category` missing blocks `Next`. WG `name_en`, `name_ar` required (via SharedBasicInfo). Forum organizing_body, WG parent_body_id, engagement participants are OPTIONAL (D-10, D-11, D-26).
4. **Optional-field behavior** — empty FK fields persist as `NULL` (not empty string).
5. **Cross-field validation** — engagement `end_date >= start_date` enforced via Zod refinement.
6. **Post-create navigation** — `getDossierDetailPath()` navigates to correct detail route per type.
7. **Draft persistence** — localStorage keys (`dossier-create-forum`, `dossier-create-working_group`, `dossier-create-engagement`) round-trip and clear on successful submit.
8. **API contract stability** — single-select DossierPicker callers (work-item-creation flow etc.) continue working after multi-select extension.

---

## Per-Requirement Signal Contracts

| REQ-ID   | Observable                                                                           | Assertion                                                                                                             |
| -------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| FORUM-01 | 3-step wizard renders                                                                | `screen.getByText('Basic Info')`, `screen.getByText('Forum Details')`, `screen.getByText('Review')` all present       |
| FORUM-02 | Forum Details has DossierPicker filtered to organization                             | Picker mounted with `filterByDossierType='organization'`; only org dossiers appear in search results                  |
| FORUM-03 | Create button on Forums list page                                                    | `frontend/src/routes/_protected/dossiers/forums/index.tsx` contains `to="/dossiers/forums/create"`                    |
| WG-01    | 3-step WG wizard renders                                                             | Steps `Basic Info` → `WG Details` → `Review` all present                                                              |
| WG-02    | WG Details captures status, established_date, mandate, parent_body                   | All four fields visible; Zod schema requires name_en/name_ar/status; others optional                                  |
| WG-03    | Create button on Working Groups list page                                            | `frontend/src/routes/_protected/dossiers/working_groups/index.tsx` contains `to="/dossiers/working_groups/create"`    |
| ENGM-01  | 4-step engagement wizard renders                                                     | Steps `Basic Info` → `Engagement Details` → `Participants` → `Review` all present                                     |
| ENGM-02  | Engagement Details captures type, category, location bilingual, start_date, end_date | All six fields visible; type/category populate from DB CHECK values; dates required                                   |
| ENGM-03  | Participants step has three sections                                                 | `screen.getByText('Countries')`, `'Organizations'`, `'Persons'` present; each with its own multi-select DossierPicker |
| ENGM-04  | Multi-select DossierPicker filters + displays chips                                  | `DossierPicker` rendered with `multiple` prop; chips render beneath input; `filterByDossierType` applied              |
| ENGM-05  | Create button on Engagements list page                                               | `frontend/src/routes/_protected/dossiers/engagements/index.tsx` contains `to="/dossiers/engagements/create"`          |

---

## Wave 0 Requirements

- [ ] `frontend/src/components/work-creation/__tests__/DossierPicker.test.tsx` — extend with multi-select suite (or create if absent)
- [ ] `frontend/src/components/dossier/wizard/steps/__tests__/ForumDetailsStep.test.tsx` — scaffolded test file
- [ ] `frontend/src/components/dossier/wizard/steps/__tests__/WorkingGroupDetailsStep.test.tsx` — scaffolded test file
- [ ] `frontend/src/components/dossier/wizard/steps/__tests__/EngagementDetailsStep.test.tsx` — scaffolded test file
- [ ] `frontend/src/components/dossier/wizard/steps/__tests__/EngagementParticipantsStep.test.tsx` — scaffolded test file
- [ ] `frontend/src/components/dossier/wizard/review/__tests__/ForumReviewStep.test.tsx`
- [ ] `frontend/src/components/dossier/wizard/review/__tests__/WorkingGroupReviewStep.test.tsx`
- [ ] `frontend/src/components/dossier/wizard/review/__tests__/EngagementReviewStep.test.tsx`
- [ ] `tests/e2e/forum-create.spec.ts`, `tests/e2e/working-group-create.spec.ts`, `tests/e2e/engagement-create.spec.ts`
- [ ] No framework install required — Vitest, Playwright, axe-core already configured (Phase 18 E2E Test Suite precedent)

---

## Manual-Only Verifications

| Behavior                                                | Requirement | Why Manual                                       | Test Instructions                                                                                                                                                                  |
| ------------------------------------------------------- | ----------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Arabic RTL visual polish of chip rows                   | D-02, D-08  | Visual layout is hard to assert programmatically | Load each wizard with `i18n.changeLanguage('ar')`, select ≥5 dossiers in each Participants section, verify chips scroll right-to-left and first selection is on the rightmost edge |
| Screen-reader announcement of multi-select chip removal | ENGM-04     | Requires live assistive-tech interaction         | macOS VoiceOver + Chrome: remove a chip with keyboard, confirm "removed: {name}" announcement                                                                                      |
| Draft recovery on browser refresh                       | D-24        | localStorage persistence needs actual browser    | Fill 2 wizard steps, refresh, confirm saved values reappear; submit; refresh; confirm draft cleared                                                                                |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING test scaffolds
- [ ] No watch-mode flags in automated commands
- [ ] Feedback latency < 60s for quick, < 360s for full
- [ ] `nyquist_compliant: true` set in frontmatter once planner populates per-task rows

**Approval:** pending
