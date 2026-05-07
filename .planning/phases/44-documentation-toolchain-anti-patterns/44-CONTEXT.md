# Phase 44: Documentation, Toolchain & Anti-patterns - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 44 is a reconciliation phase for v6.0 audit debt. It backfills explicit
verification records for six completed v6.0 phases, synchronizes archived
requirements and roadmap status, repairs the frontend size-limit gate so CI
measures real output again, closes the audit-listed WR-02..WR-06 anti-patterns,
and resolves the old Storybook deferral through ADR-006. It must not introduce
new product features, new schemas, or new visual baselines.

</domain>

<decisions>
## Implementation Decisions

### VERIFICATION.md Path & Shape

- **D-01:** The six backfilled verification files live under
  `.planning/milestones/v6.0-phases/{33,34,36,37,39,40}-*/VERIFICATION.md`,
  mirroring the v5.0 archive pattern. Treat the large working-tree deletions
  from `.planning/phases/33-*` through `.planning/phases/43-*` as an in-progress
  archive move. Phase 44 planning must commit that move intentionally.
- **D-02:** Patch `.planning/REQUIREMENTS.md` DOC-01..DOC-06 path strings away
  from `.planning/phases/{n}-*/VERIFICATION.md` and toward the v6.0 archive
  path. The current active ROADMAP/REQUIREMENTS text is stale relative to this
  decision.
- **D-03:** Each VERIFICATION.md should be lightweight: REQ-ID, verdict, and a
  one-line artifact reference. Target roughly 30-50 lines per file, similar to
  `.planning/milestones/v3.0-phases/12-enriched-dossier-pages/VERIFICATION.md`
  and `.planning/milestones/v3.0-phases/13-feature-absorption/VERIFICATION.md`.
- **D-04:** Use `.planning/STATE.md` phase summaries and per-plan SUMMARY.md
  verdicts as the authority for retroactive PASS/FAIL. Cross-check
  `.planning/milestones/v6.0-MILESTONE-AUDIT.md`; do not re-run historical tests
  just to backfill docs.
- **D-05:** Flip DOC-07 checkbox state per backfilled VERIFICATION.md, one phase
  at a time, pairing each verification file with its owned REQ-ID checkbox
  updates in `.planning/milestones/v6.0-REQUIREMENTS.md` and v6.0 ROADMAP
  archive progress.

### STORY-01 Path

- **D-06:** Formalize the Storybook deferral with
  `.planning/decisions/ADR-006-storybook-deferral.md`; do not ship Storybook in
  Phase 44.
- **D-07:** ADR-006 must name replacement coverage as vitest snapshot/component
  tests plus Playwright visual specs, with a 1:1 primitive-to-test table.
- **D-08:** ADR-006 revisit trigger: visual primitive count exceeds 15. Start
  from STORY-01's eight coverage targets, but make the ADR define the count
  source explicitly: if the threshold is enforced against
  `frontend/src/components/signature-visuals/index.ts`, count only visual
  primitive exports and exclude signal helpers/test utilities; document whether
  shared Skeleton/Spinner are counted outside that barrel.
- **D-09:** Keep the old `33-08-storybook-PLAN.md` in the v6.0 archive as
  historical record, but add a `SUPERSEDED-BY-ADR-006` banner to its header.
  The v6.0 ROADMAP archive should still report 121/121 complete once the
  supersession is documented.

### Anti-pattern Sweep Scope

- **D-10:** Scope is exactly WR-02..WR-06 from
  `.planning/milestones/v6.0-MILESTONE-AUDIT.md`: `OverdueCommitments.tsx`,
  `DrawerCtaRow.tsx`, `VipVisits.tsx`, `MyTasks.tsx`, `sidebar.tsx`, and
  `CalendarEntryForm.tsx`. Do not broaden this phase into a repo-wide
  accessibility, i18n, or lint cleanup.
- **D-11:** Treat audit line numbers as anchors, not truth. Several files have
  drifted since the audit, so planners must inspect current code first. If an
  item is already fixed, record it as verified instead of reworking it.
- **D-12:** Verification should combine targeted source checks, `pnpm -C frontend
lint`, and the phase-scoped axe/browser coverage named in ROADMAP success
  criteria: dashboard, drawer, and my-work routes in EN and AR. Do not add a
  custom lint rule unless the existing lint/a11y stack cannot verify closure.
- **D-13:** No new visual baselines are part of this phase. If browser checks
  reveal visual-regression snapshot drift, document it for Phase 46 rather than
  updating snapshots here.

### Size-limit Fix Strategy

- **D-14:** Use the hybrid strategy. Phase 44 must repair size-limit measurement
  and make CI enforce real regressions now, but it should not attempt a major
  bundle refactor just to force the historical `815 KB` total target to pass.
- **D-15:** Keep `815 KB` as an aspirational optimization target in docs, not as
  the Phase 44 merge gate. Set enforced limits from current measured output with
  a small explicit headroom, then require future increases to fail CI.
- **D-16:** Repair stale globs by aligning Vite output and `.size-limit.json`
  around stable chunk names. Prefer adding stable `manualChunks` names for
  signature-visuals/world-map assets over chasing hashed route filenames.
- **D-17:** The command spelling in active docs must be corrected or clarified:
  `pnpm --filter frontend build` currently reports "No projects matched" in
  this workspace. Use `pnpm -C frontend build` / `pnpm -C frontend size-limit`,
  or update the workspace/package selector to match the actual package name
  `intake-frontend`.
- **D-18:** Verification must prove two things: all configured size-limit entries
  match at least one real built file, and an intentional >= 1 KB increase to a
  measured chunk fails locally and in CI. Do not bypass the gate by deleting
  measured chunks or setting unbounded totals.

### Folded Todos

- **D-19:** Folded from `.planning/todos/pending/v6.1-kickoff.md`: Phase 44
  source is v6.0 audit section 6 items 1 and 4, covering REQUIREMENTS sync,
  ROADMAP sync, size-limit, WR-02..06, and 33-08 Storybook resolution.
- **D-20:** Folded from the same todo: done means six missing VERIFICATION.md
  files are backfilled, size-limit is green on the repaired config, WR-02..06
  are closed, Storybook is shipped or formally dropped via ADR, and requirement
  checkboxes match SUMMARY frontmatter.

### Agent Discretion

- The user delegated the remaining decisions to the agent. The locked defaults
  are: audit-listed anti-pattern closure only, and hybrid size-limit enforcement
  with a truthful current baseline plus aspirational `815 KB` tracking.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope

- `.planning/ROADMAP.md` - Active Phase 44 goal and success criteria. Note that
  the verification-file path in success criterion 1 is stale after D-01.
- `.planning/REQUIREMENTS.md` - Active DOC, TOOL, LINT, and STORY requirements.
  DOC-01..DOC-06 path strings must be patched per D-02.
- `.planning/STATE.md` - Authority for completed v6.0 phase summaries and
  retroactive verification verdicts.
- `.planning/notes/v6.1-rationale.md` - Rationale for v6.1 hardening scope.
- `.planning/todos/pending/v6.1-kickoff.md` - Folded kickoff context for Phase
  44 only; Phase 45/46 bullets are out of this phase.

### v6.0 Audit And Archives

- `.planning/milestones/v6.0-MILESTONE-AUDIT.md` - Source of missing
  verification files, size-limit drift, WR-02..WR-06, and cross-cutting archive
  sync gaps.
- `.planning/milestones/v6.0-REQUIREMENTS.md` - Archive checkbox sync target.
- `.planning/milestones/v6.0-ROADMAP.md` - Archive progress sync target.
- `.planning/milestones/v3.0-phases/12-enriched-dossier-pages/VERIFICATION.md`
  - Lightweight VERIFICATION.md reference shape.
- `.planning/milestones/v3.0-phases/13-feature-absorption/VERIFICATION.md` -
  Lightweight VERIFICATION.md reference shape.

### Frontend Toolchain

- `frontend/.size-limit.json` - Current size-limit config with stale
  signature-visuals globs and historical budgets.
- `frontend/vite.config.ts` - Rollup manual chunk naming and asset filename
  patterns.
- `frontend/package.json` - Actual package name `intake-frontend` and scripts:
  `build`, `size`, `size-limit`, `lint`.
- `.github/workflows/ci.yml` - Existing `bundle-size-check` job builds and runs
  size-limit from `./frontend`.

### Anti-pattern Files

- `frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx` - WR-02/WR-03
  audit target, current line numbers have drifted.
- `frontend/src/components/dossier/DossierDrawer/DrawerCtaRow.tsx` - WR-03
  audit target.
- `frontend/src/pages/Dashboard/widgets/VipVisits.tsx` - WR-03 audit target.
- `frontend/src/pages/MyTasks.tsx` - WR-05 audit target.
- `frontend/src/components/ui/sidebar.tsx` - WR-04 audit target.
- `frontend/src/components/calendar/CalendarEntryForm.tsx` - WR-06 audit target.

### Storybook Deferral

- `.planning/decisions/ADR-006-storybook-deferral.md` - New target path for the
  Storybook deferral ADR.
- `frontend/src/components/signature-visuals/index.ts` - Source of current
  visual primitive exports for ADR-006 threshold.
- `frontend/src/components/signature-visuals/__tests__/` - Replacement vitest
  coverage source for ADR-006 mapping.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `frontend/src/components/signature-visuals/__tests__/` contains existing
  component coverage for `Donut`, `DossierGlyph`, `FullscreenLoader`,
  `GlobeLoader`, `GlobeSpinner`, `Icon`, and `Sparkline`; ADR-006 should map
  primitives to these tests before claiming Storybook replacement coverage.
- `.github/workflows/ci.yml` already has a dedicated `bundle-size-check` job
  after lint. Phase 44 should repair its budget signal, not invent a separate
  CI lane.
- `.planning/codebase/CONVENTIONS.md` and `.planning/codebase/TESTING.md`
  document the existing lint, vitest, Playwright, and TypeScript patterns that
  should be used for this phase.

### Established Patterns

- Planning docs for archived milestones live under `.planning/milestones/*`;
  phase 44 should normalize v6.0 to that pattern and avoid restoring old active
  `.planning/phases/33-*` through `.planning/phases/43-*` directories.
- Frontend scripts are commonly run from `frontend/` via `pnpm -C frontend ...`
  or GitHub Actions `working-directory: ./frontend`. Active Phase 44 text that
  uses `--filter frontend` conflicts with the package name and should be fixed.
- Vite output uses stable chunk base names plus hashes. Size-limit should target
  stable base names, not hashes or source filenames that no longer appear in
  `dist/assets`.

### Integration Points

- `frontend/.size-limit.json` must remain the single budget config consumed by
  local scripts and CI.
- `frontend/vite.config.ts` is the place to add stable chunk names if existing
  chunks do not expose reliable size-limit globs.
- `v6.0-MILESTONE-AUDIT.md`, `v6.0-REQUIREMENTS.md`, and `v6.0-ROADMAP.md` are
  the archive sync targets. Active ROADMAP/REQUIREMENTS should be updated only
  where they describe Phase 44's paths and verification commands.

</code_context>

<specifics>
## Specific Ideas

- Current build verification on 2026-05-07: `pnpm -C frontend build` succeeds,
  but emits a CSS import-order warning from `shared-week-list.css` import
  placement. Do not fold that warning into Phase 44 unless it blocks size-limit.
- Current size-limit verification on 2026-05-07: `pnpm -C frontend size-limit`
  fails because budgets are exceeded and `dist/assets/*d3-geo*.js` plus
  `dist/assets/*signature-visuals*.js` match no files. The total measured JS is
  about 2.42 MB gzip against an 815 KB historical limit.
- Current workspace verification on 2026-05-07: `pnpm --filter frontend build`
  matches no project. Use `pnpm -C frontend ...` unless the package selector is
  corrected.

</specifics>

<deferred>
## Deferred Ideas

- Major bundle-size optimization to return total JS to 815 KB belongs in a
  separate performance phase if desired. Phase 44 only restores truthful CI
  enforcement.
- Visual-regression baseline regeneration belongs to Phase 46.

### Reviewed Todos (not folded)

- `.planning/todos/pending/v6.1-kickoff.md` also mentions Phase 45 schema/seed
  closure and Phase 46 visual baseline regeneration. Those are reviewed but not
  folded because they belong to their own phases.

</deferred>

---

_Phase: 44-documentation-toolchain-anti-patterns_
_Context gathered: 2026-05-07_
