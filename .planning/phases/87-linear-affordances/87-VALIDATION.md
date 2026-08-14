---
phase: 87
slug: linear-affordances
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-07
signed_off: 2026-07-13
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

| Req ID | Behavior                                                                       | Test Type    | Automated Command                                          | Status                        |
| ------ | ------------------------------------------------------------------------------ | ------------ | ---------------------------------------------------------- | ----------------------------- |
| AFF-01 | Peek registry position/total math + boundary disable                           | unit         | `vitest run src/store/__tests__/peekStore.test.ts`         | ✅                            |
| AFF-01 | Drawer head renders counter + chevrons; paging swaps `?dossier=` with replace  | unit (RTL)   | `vitest run src/components/dossier/DossierDrawer`          | ✅                            |
| AFF-01 | `useDossierDrawer` open/close semantics unchanged                              | unit         | `vitest run src/hooks/__tests__/useDossierDrawer.test.tsx` | ✅                            |
| AFF-02 | URL param round-trip per surface (validateSearch extension)                    | unit         | `vitest run src/components/list-controls`                  | ✅                            |
| AFF-02 | Chips derive/remove/clear from filter object                                   | unit         | `vitest run src/components/active-filters`                 | ✅                            |
| AFF-03 | Every registered command's target resolves (route exists / store action fires) | unit (table) | `vitest run src/components/keyboard-shortcuts`             | ✅                            |
| AFF-03 | EN/AR label parity for changed keys                                            | lint script  | `pnpm --dir frontend lint` (check-i18n-namespaces.mjs)     | ✅                            |
| AFF-04 | Per-entity empty state renders heading/body/CTA; filtered-empty branch         | unit         | `vitest run src/components/empty-states`                   | ✅                            |
| all    | RTL render + a11y on touched surfaces                                          | e2e          | `pnpm --dir frontend test:a11y` (targeted spec)            | ✅ manual render walk (12/12) |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky — executor stamps per task. All rows green on the integrated tree (merge `26f3780a`); full suite 1539 pass at sign-off, targeted re-gate on the merge green (tsc 0 / lint 0 / vitest 27)._

---

## Wave 0 Requirements

- [x] `src/store/__tests__/peekStore.test.ts` — covers AFF-01 position/total math + boundary disable
- [x] `src/components/list-controls/__tests__/` — covers AFF-02 param round-trip + facet-count gating
- [x] `src/components/keyboard-shortcuts/__tests__/CommandPalette.audit.test.tsx` — regression-locks the F25 audit verdicts (dead targets stay dead-listed or are proven fixed)

_Existing suites cover DossierDrawer, active-filters, empty-states, useDossierDrawer — extend in place._

---

## Manual-Only Verifications

| Behavior                                                      | Requirement | Why Manual                                          | Test Instructions                                                                                                                             |
| ------------------------------------------------------------- | ----------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Peek prev/next visual continuity across a real 8-list surface | AFF-01      | Cross-tree store→drawer wiring + visual paging feel | ✅ operator-signed 2026-07-13 — render walk rows 1–5 (countries 1/5→2/5, persons 2/16, EO 1/1, engagements 1/3 after `e5dea1f1`), AR-RTL      |
| Filter + Display popover live counts read correctly under RLS | AFF-02      | Count values depend on live Supabase/RLS data       | ✅ operator-signed 2026-07-13 — render walk rows 6–8 (countries facet counts, engagements type bucket via `p_engagement_types`, kanban EN+AR) |
| ⌘K menu correct in AR-RTL (mono glyph LTR isolation)          | AFF-03      | Bidi rendering of `⌘K`/`G D` glyphs                 | ✅ operator-signed 2026-07-13 — render walk row 9 (context-aware suggestions + keyboard hints, AR)                                            |

---

## Validation Sign-Off

- [x] All tasks have automated verify or a Wave 0 dependency
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (peekStore, list-controls, CommandPalette.audit)
- [x] No watch-mode flags in any command
- [x] Feedback latency < 15s (targeted dir run)
- [x] `nyquist_compliant: true` set in frontmatter (planner/executor stamps when map is complete)

**Approval:** approved — operator signed the 87-10 consolidated EN/AR render gate 2026-07-13 (12/12 walk rows pass; evidence in `.overseer/CHECKPOINT-87-10-render.md` + `.overseer/render-walk-87/`). The three manual-only rows above were human-verified; T-87-26 (repudiation) mitigated by reproducible stamped commands + this recorded sign-off.
