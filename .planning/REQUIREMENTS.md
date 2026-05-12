# Requirements — Milestone v6.2 Type-Check, Lint & Bundle Reset

**Goal:** Restore code-quality gates and bundle budget on `main` before v7.0 Intelligence Engine work begins.

**Source measurements (2026-05-08):**

- Frontend `pnpm type-check`: 1580 TS errors (TS6133 unused declarations + TS6196 unused exported types)
- Backend `pnpm type-check`: 498 TS errors (same shape)
- Frontend `pnpm lint`: 723 problems (52 errors + 671 warnings)
- Backend `pnpm lint`: 4 problems (3 errors + 1 warning)
- Frontend `pnpm size-limit` Total JS: 2.42 MB gzipped vs 2.43 MB ceiling (raised to mask drift; v2.0 target was 200 KB)
- `frontend/eslint.config.js` references Aceternity (`3d-card`, `bento-grid`, `floating-navbar`, `link-preview`) in `no-restricted-imports` — contradicts CLAUDE.md primitive cascade

Detail: `.planning/notes/v6.2-rationale.md`.

## Active Requirements

### Type-check (TYPE)

- [ ] **TYPE-01** — Frontend `pnpm type-check` exits 0 on a clean clone (1580 errors → 0). Suppression escape hatches (`@ts-ignore`, `@ts-expect-error`) must not be used to mask errors; deletions or real fixes only.
- [ ] **TYPE-02** — Backend `pnpm type-check` exits 0 on a clean clone (498 errors → 0). Same suppression rule as TYPE-01.
- [ ] **TYPE-03** — Type-check job runs as a PR-blocking CI gate on both frontend and backend; a PR introducing a single TS error cannot merge to `main`.
- [ ] **TYPE-04** — Any retained `@ts-ignore` / `@ts-expect-error` suppression is documented inline with a reason and an issue or follow-up reference; net new suppressions added during v6.2 are zero outside documented exceptions.

### Lint (LINT, continued from v6.1)

- [x] **LINT-06** — Frontend `pnpm lint` exits 0 on a clean clone (52 errors + 671 warnings → 0). Warnings either fixed at the call site or the rule is downgraded with a written rationale recorded in `eslint.config.js`.
- [x] **LINT-07** — Backend `pnpm lint` exits 0 on a clean clone (3 errors + 1 warning → 0).
- [x] **LINT-08** — `frontend/eslint.config.js` removes all Aceternity references (`3d-card`, `bento-grid`, `floating-navbar`, `link-preview`); `no-restricted-imports` is aligned with the CLAUDE.md primitive cascade (HeroUI v3 → Radix → custom). Rule messages no longer recommend a banned library.
- [x] **LINT-09** — Lint job runs as a PR-blocking CI gate on both frontend and backend; a PR introducing a single lint error cannot merge to `main`.

### Bundle (BUNDLE)

- [ ] **BUNDLE-01** — `frontend/.size-limit.json` Total JS ceiling is lowered from 2.43 MB to ≤500 KB initial-route gzip; the value is documented as the real budget, not aspirational.
- [ ] **BUNDLE-02** — The initial route loads under the new BUNDLE-01 budget; heavy chunks are route-split via `React.lazy()` based on the Phase 49 audit.
- [ ] **BUNDLE-03** — `size-limit` runs as a PR-blocking CI gate; a PR that adds ≥1 KB to any measured chunk is rejected.
- [ ] **BUNDLE-04** — Vendor super-chunk audited; every chunk > 100 KB has documented rationale recorded in `.size-limit.json` comments or a sibling note (e.g. `frontend/docs/bundle-budget.md`).

## Out of Scope

- Intelligence Engine (signals model, structured digest, briefings beyond one-shot, alerting, multi-dossier AI correlation) — captured as seed `v7.0-intelligence-engine.md`. Trigger: v6.2 ships.
- Visual deviation closeouts for Phase 38/39/41 PASS-WITH-DEVIATION items — separate concern, not blocking v7.0; revisit when needed.
- Storybook adoption — ADR-006 stands; existing Vitest + Playwright coverage is acceptable until primitive count > 15.
- New features of any kind — v6.2 is a quality-gate reset milestone only.

## Future (deferred)

- Strict TypeScript options beyond default `strict` (e.g. `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) — revisit after TYPE-01..04 land and developer ergonomics are observed for at least one milestone.
- Stylelint and a11y CI gates — revisit when the design system is touched again.

## Traceability

| REQ-ID    | Phase    | Status      |
| --------- | -------- | ----------- |
| TYPE-01   | Phase 47 | Not started |
| TYPE-02   | Phase 47 | Not started |
| TYPE-03   | Phase 47 | Not started |
| TYPE-04   | Phase 47 | Not started |
| LINT-06   | Phase 48 | Satisfied   |
| LINT-07   | Phase 48 | Satisfied   |
| LINT-08   | Phase 48 | Satisfied   |
| LINT-09   | Phase 48 | Satisfied   |
| BUNDLE-01 | Phase 49 | Not started |
| BUNDLE-02 | Phase 49 | Not started |
| BUNDLE-03 | Phase 49 | Not started |
| BUNDLE-04 | Phase 49 | Not started |

_Phase column filled by the roadmapper after roadmap approval (2026-05-08)._

---

_Last updated: 2026-05-12 — Phase 48 LINT-06..09 satisfied_
