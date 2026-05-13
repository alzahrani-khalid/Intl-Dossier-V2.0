# Requirements — Milestone v6.3 Carryover Sweep & v7.0 Prep

**Goal:** Close v6.2 carryover debt, harden test/design gates, and lay v7.0 Intelligence Engine schema groundwork — clean runway before feature work.

**Phase numbering:** continues from Phase 50 (v6.2 ended at Phase 49).

## v1 Requirements (this milestone)

### Kanban migration (KANBAN)

- [ ] **KANBAN-01**: `TasksTab.tsx` Kanban migrated to HeroUI v3 Kanban + `@dnd-kit/core` with drag/drop/column transitions/keyboard support preserved
- [ ] **KANBAN-02**: `EngagementKanbanDialog.tsx` Kanban migrated with same behavior parity as KANBAN-01
- [ ] **KANBAN-03**: `@/components/kibo-ui/kanban` directory + npm dep removed; ESLint `no-restricted-imports` bans re-introduction
- [ ] **KANBAN-04**: Visual baselines for both Kanban surfaces regenerated (EN + AR) and committed; Playwright Kanban specs pass green

### Design-token compliance (DESIGN)

- [ ] **DESIGN-01**: ESLint rule bans raw hex colors (`#[0-9a-fA-F]{3,8}`) in `frontend/src/**/*.{ts,tsx,css}` outside token definition files
- [ ] **DESIGN-02**: ESLint rule bans Tailwind color literals (`text-blue-*`, `bg-red-*`, `border-green-*`, etc.) in `frontend/src/**/*.{ts,tsx}`; allows token-mapped utilities (`text-bg`, `text-ink`, `text-accent`)
- [ ] **DESIGN-03**: All existing violations fixed (`WorldMapVisualization.tsx:193` raw hex `#3B82F6`, `PositionEditor.tsx` color literals, plus any others surfaced by sweep)
- [ ] **DESIGN-04**: Workspace `pnpm lint` exits 0 with new rules active; PR-blocking CI context registered on `main`

### Test infrastructure (TEST)

- [ ] **TEST-01**: `frontend/tests/setup.ts:6` `vi.mock("react-i18next")` factory exports `initReactI18next` so module-eval succeeds for all consumers
- [ ] **TEST-02**: 4 previously-failing wizard tests pass green
- [ ] **TEST-03**: Audit complete for other module-eval test failures across frontend + backend test suites; findings logged or fixed
- [ ] **TEST-04**: Vitest setup files reviewed for similar mock-factory gaps; documented in `frontend/docs/test-setup.md`

### Bundle + provenance (BUNDLE — continues from v6.2 BUNDLE-04)

- [ ] **BUNDLE-05**: React vendor ceiling in `frontend/.size-limit.json` lowered 349 → ~285 KB gz per D-03 min rule (measured + slack documented in `frontend/docs/bundle-budget.md`)
- [ ] **BUNDLE-06**: `phase-47-base` / `phase-48-base` / `phase-49-base` lightweight tags re-issued as annotated + signed (`-a -s`); `git tag -v` succeeds
- [ ] **BUNDLE-07**: CLAUDE.md Node engine note updated `Node.js 20.19.0+` → `Node.js 22.13.0+` to match `package.json` engines

### Intelligence Engine schema groundwork (INTEL)

- [ ] **INTEL-01**: `intelligence_signal` table migration applied with columns (id, source_type, source_ref, content, occurred_at, ingested_at, severity, tenant_id, created_by) with indexes + RLS policies
- [ ] **INTEL-02**: `intelligence_digest` table migration applied with columns (id, dossier_type, dossier_id, period_start, period_end, summary, generated_by, tenant_id, generated_at) with indexes + RLS policies
- [ ] **INTEL-03**: `intelligence_signal_dossiers` polymorphic junction table for many-to-many signal ↔ dossier linking with `dossier_type` enum constraint matching 8 existing dossier types
- [ ] **INTEL-04**: `signal_source_type` enum (`publication`, `feed`, `human_entered`, `ai_generated`) created and applied to `intelligence_signal.source_type`
- [ ] **INTEL-05**: Supabase TypeScript types regenerated (`database.types.ts` includes new tables); `pnpm type-check` exits 0

## Future Requirements (deferred to later milestones)

- v7.0 Intelligence Engine: API endpoints + UI for signal triage, digest pipeline, alerting, multi-dossier AI correlation, analytic graph queries (depends on INTEL-01..05 schema)
- External feed ingestion (RSS, public APIs, manual paste) — deferred to v7.0 or v7.1
- Alerting channels beyond Resend (SMS, Teams, Slack) — research first; defer to v7.x
- Re-tightening React vendor ceiling further if bundle drift recurs — micro-task

## Out of Scope (this milestone)

- New features beyond carryover and v7.0 schema groundwork — milestone is hardening + foundations
- Replacing the retained `useStakeholderInteractionMutations` shim — underlying implementation must land first; carry forward unchanged
- Aceternity / Kibo UI re-introduction — banned by `no-restricted-imports` since v6.2 (LINT-08)
- Migrating to a different Kanban primitive than HeroUI v3 + `@dnd-kit/core` — primitive cascade locked per CLAUDE.md

## Traceability

(Filled in by roadmapper — maps each REQ-ID to its phase.)
