---
phase: 87
slug: linear-affordances
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-07
---

# Phase 87 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `87-RESEARCH.md` §Validation Architecture.

---

## Test Infrastructure

| Property               | Value                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest 4.1.7 (unit, jsdom) + Playwright 1.60 (E2E/a11y, `--project=a11y`)                                         |
| **Config file**        | `frontend/vitest.config.ts`, `frontend/playwright.config.ts`                                                      |
| **Quick run command**  | `pnpm --dir frontend exec vitest run <path>`                                                                      |
| **Full suite command** | `pnpm --dir frontend exec vitest run` then `pnpm --dir frontend lint` and `pnpm --dir frontend exec tsc --noEmit` |
| **Estimated runtime**  | ~90s full unit (1488-test green baseline per STATE.md); targeted dir runs ~5–15s                                  |

---

## Sampling Rate

- **After every task commit:** Run targeted `pnpm --dir frontend exec vitest run <touched dir>` + `pnpm --dir frontend exec tsc --noEmit`
- **After every plan wave:** Run `pnpm --dir frontend exec vitest run` (full unit) + `pnpm --dir frontend lint`
- **Before `/gsd:verify-work`:** Full suite + build + Playwright a11y project must be green
- **Max feedback latency:** ~15 seconds (targeted dir run)

---

## Per-Task Verification Map

| Req ID | Behavior                                                                       | Test Type    | Automated Command                                          | File Exists                            |
| ------ | ------------------------------------------------------------------------------ | ------------ | ---------------------------------------------------------- | -------------------------------------- |
| AFF-01 | Peek registry position/total math + boundary disable                           | unit         | `vitest run src/store/__tests__/peekStore.test.ts`         | ❌ W0                                  |
| AFF-01 | Drawer head renders counter + chevrons; paging swaps `?dossier=` with replace  | unit (RTL)   | `vitest run src/components/dossier/DossierDrawer`          | ✅ extend `DrawerHead.test.tsx`        |
| AFF-01 | `useDossierDrawer` open/close semantics unchanged                              | unit         | `vitest run src/hooks/__tests__/useDossierDrawer.test.tsx` | ✅                                     |
| AFF-02 | URL param round-trip per surface (validateSearch extension)                    | unit         | `vitest run src/components/list-controls`                  | ❌ W0                                  |
| AFF-02 | Chips derive/remove/clear from filter object                                   | unit         | `vitest run src/components/active-filters`                 | ✅ add field-config cases              |
| AFF-03 | Every registered command's target resolves (route exists / store action fires) | unit (table) | `vitest run src/components/keyboard-shortcuts`             | ✅ add `CommandPalette.audit.test.tsx` |
| AFF-03 | EN/AR label parity for changed keys                                            | lint script  | `pnpm --dir frontend lint` (check-i18n-namespaces.mjs)     | ✅                                     |
| AFF-04 | Per-entity empty state renders heading/body/CTA; filtered-empty branch         | unit         | `vitest run src/components/empty-states`                   | ✅ extend                              |
| all    | RTL render + a11y on touched surfaces                                          | e2e          | `pnpm --dir frontend test:a11y` (targeted spec)            | ✅ qa-sweep infra                      |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky — executor stamps per task._

---

## Wave 0 Requirements

- [ ] `src/store/__tests__/peekStore.test.ts` — covers AFF-01 position/total math + boundary disable
- [ ] `src/components/list-controls/__tests__/` — covers AFF-02 param round-trip + facet-count gating
- [ ] `src/components/keyboard-shortcuts/__tests__/CommandPalette.audit.test.tsx` — regression-locks the F25 audit verdicts (dead targets stay dead-listed or are proven fixed)

_Existing suites cover DossierDrawer, active-filters, empty-states, useDossierDrawer — extend in place._

---

## Manual-Only Verifications

| Behavior                                                      | Requirement | Why Manual                                          | Test Instructions                                                                                                               |
| ------------------------------------------------------------- | ----------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Peek prev/next visual continuity across a real 8-list surface | AFF-01      | Cross-tree store→drawer wiring + visual paging feel | Open a countries-list row peek at 1400px dark AR-RTL; chevron through ≥3 rows; counter tracks; "Open full dossier" still routes |
| Filter + Display popover live counts read correctly under RLS | AFF-02      | Count values depend on live Supabase/RLS data       | Apply a filter chip on organizations list; confirm popover count matches rendered row count for the logged-in role              |
| ⌘K menu correct in AR-RTL (mono glyph LTR isolation)          | AFF-03      | Bidi rendering of `⌘K`/`G D` glyphs                 | Open palette in AR; verify key glyphs render LTR-isolated, labels are sentence case, every advertised command fires             |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or a Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (peekStore, list-controls, CommandPalette.audit)
- [ ] No watch-mode flags in any command
- [ ] Feedback latency < 15s (targeted dir run)
- [ ] `nyquist_compliant: true` set in frontmatter (planner/executor stamps when map is complete)

**Approval:** pending
