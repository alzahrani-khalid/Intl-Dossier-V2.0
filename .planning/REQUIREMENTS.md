# Requirements — Milestone v6.4 Stabilization & Carryover Sweep

**Goal:** Close v6.3 carryover debt and merge DesignV2 → main so v7.0 Intelligence Engine starts on stable ground with all quality gates enforced on `main`.

**Source:** `.planning/notes/v6.4-milestone-shape.md` (from `/gsd:explore` 2026-05-17) · `.planning/milestones/v6.3-MILESTONE-AUDIT.md` §7 · `.planning/PROJECT.md` "Next Milestone Goals"

---

## Active (v6.4)

### Merge — DesignV2 → main gate enforcement

- [ ] **MERGE-01**: DesignV2 branch merged to `main` with all v6.3 quality gates green (type-check, Lint, Bundle Size Check (size-limit), design-token D-05 selectors, `react-i18next` factory)
- [ ] **MERGE-02**: v6.3 enforcement verified live on `main` PR contexts post-merge (smoke PR captures `mergeStateStatus=BLOCKED` on intentional violation against a required context fold-in)

### Security / RLS

- [ ] **RLS-01**: D-54-04 closed — `countries` removed from `sensitiveTables` projection in `rls-audit.test.ts`; test passes for `countries` without acknowledged-fail entry (pre-existing Phase 03/04 vintage row resolved)

### Type correctness (continues TYPE-04 from v6.2)

- [ ] **TYPE-05**: `useStakeholderInteractionMutations` shim removed; consumers typed at source against underlying domain hook return shape — last v6.2 typed-shim holdover retired per "typed-at-source over consumer cast" decision

### Phase 52 deviation closure (D-19..D-23)

- [ ] **DEVIATE-01**: D-19 mobile touch DnD — scope decision documented and implementation landed (touch sensor on shared `@dnd-kit/core` primitive, OR explicit scope-out ADR with mobile read-only fallback)
- [ ] **DEVIATE-02**: D-21 Phase 39 `kanban-*.spec.ts` regression follow-up — specs green against shared `@dnd-kit/core` primitive
- [ ] **DEVIATE-03**: D-22 LTR/RTL visual baseline byte-distinction — EN vs AR baselines verified distinct (not byte-identical); per-direction snapshot integrity restored for kanban surfaces
- [ ] **DEVIATE-04**: D-23 live tasks-tab Playwright run executed with host operator on seeded data; results committed to phase artifact

### Design token cleanup (Tier-C full clear)

- [ ] **TOKEN-01**: Zero `// gsd-design-token-tier-c-allow` suppressions remaining — full clear of 271 suppressions / 2336 AST nodes via token swaps, wave-staged by surface (forms, tables, charts, drawers, dossier rail)
- [ ] **TOKEN-02**: `pnpm lint` exits 0 without the Tier-C waiver token present in `eslint.config.mjs` (waiver removed from config; lint clean without it)

### Cosmetic + CI gap closure

- [ ] **POLISH-01**: Phase 53 SUMMARY/VERIFICATION wording refreshed — `53-03-SUMMARY.md` `PASS-WITH-DEFERRAL` → `PASS`; `53-VERIFICATION.md` BUNDLE-06 `verified-local-only` → `verified` (origin SHAs already match local)
- [ ] **POLISH-02**: `TweaksDrawer.test.tsx:6-8` stale TEST-01 mock-factory comment removed (documentation drift)
- [ ] **POLISH-03**: `51-VALIDATION.md` frontmatter `status: draft` → `passed` (`nyquist_compliant: true` already correct)
- [ ] **POLISH-04**: `bad-design-token.tsx` + `bad-vi-mock.ts` positive-failure CI assertions wired — CI breaks if either fixture stops producing its expected lint/test failure

---

## Future Requirements (deferred to later milestones)

- 271 Tier-C suppressions originally staged as `TBD-design-token-tier-c-cleanup-wave-N` across multiple milestones — **folded entirely into v6.4 TOKEN-01** per full-clear scope decision

---

## Out of Scope (v6.4)

- **v7.0 Intelligence Engine API + UI + ingestion + alerting** — gated by v6.4 ship; v7.0 seed (`.planning/seeds/v7.0-intelligence-engine.md`) unblocked once v6.4 ships. v6.3 INTEL-01..05 already shipped the schema groundwork.
- **Net-new design tokens or direction variants** — Tier-C cleanup is mechanical swaps to existing tokens, not token-system extension
- **New E2E specs beyond what D-22 / D-23 explicitly require** — keep e2e surface stable while closing deviations
- **D-20 (KANBAN-02 satisfied-by-deletion)** — already closed in v6.3 (Phase 52); not re-tracked

---

## Traceability

| Requirement | Phase    | Status  |
| ----------- | -------- | ------- |
| MERGE-01    | Phase 55 | Pending |
| MERGE-02    | Phase 55 | Pending |
| RLS-01      | Phase 56 | Pending |
| TYPE-05     | Phase 56 | Pending |
| DEVIATE-01  | Phase 57 | Pending |
| DEVIATE-02  | Phase 57 | Pending |
| DEVIATE-03  | Phase 57 | Pending |
| DEVIATE-04  | Phase 57 | Pending |
| TOKEN-01    | Phase 58 | Pending |
| TOKEN-02    | Phase 58 | Pending |
| POLISH-01   | Phase 59 | Pending |
| POLISH-02   | Phase 59 | Pending |
| POLISH-03   | Phase 59 | Pending |
| POLISH-04   | Phase 59 | Pending |

**Coverage:** 14/14 v6.4 requirements mapped to exactly one phase. No orphans.

---

_Created: 2026-05-17 — v6.4 milestone definition via `/gsd:new-milestone` (research skipped; scope sourced from `/gsd:explore` shape note)._
_Updated: 2026-05-17 — Traceability table populated by `gsd-roadmapper` (Phases 55-59)._
