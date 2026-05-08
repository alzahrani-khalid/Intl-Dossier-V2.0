# Requirements: Intl-Dossier v6.1 — Hardening & Reconciliation

**Defined:** 2026-05-07
**Core Value:** Unified intelligence management for diplomatic operations — every relationship, commitment, and signal tracked in one secure, bilingual platform.

**Milestone goal:** Close the v6.0 tech debt that the milestone audit deferred — backfill missing per-phase VERIFICATION.md, restore the broken bundle-budget gate, fix the Phase 43 anti-patterns, sync the cross-cutting documentation drift, land the schema and seed work for the dashboard's intelligence digest and VIP enrichment, and regenerate the deferred visual-regression baselines — so v7.0 feature work starts on a green-CI, green-audit codebase.

**Audit basis:** `.planning/milestones/v6.0-MILESTONE-AUDIT.md` §6 Tech Debt Inventory + §8 Recommendation
**Exploration note:** `.planning/notes/v6.1-rationale.md`

---

## v1 Requirements

Requirements for this milestone. Every requirement maps to exactly one roadmap phase.

### Documentation Reconciliation (DOC)

- [x] **DOC-01**: A reviewer can read `.planning/milestones/v6.0-phases/33-*/VERIFICATION.md` and find every TOKEN-01..06 requirement listed with a PASS/FAIL verdict and a verification artifact reference (test file, validation log, or audit pointer)
- [x] **DOC-02**: A reviewer can read `.planning/milestones/v6.0-phases/34-*/VERIFICATION.md` and find every THEME-02..04 requirement listed with a PASS/FAIL verdict (THEME-01 already verified - included for completeness)
- [x] **DOC-03**: A reviewer can read `.planning/milestones/v6.0-phases/36-*/VERIFICATION.md` and find every SHELL-01..05 requirement listed with a PASS/FAIL verdict
- [x] **DOC-04**: A reviewer can read `.planning/milestones/v6.0-phases/37-*/VERIFICATION.md` and find every VIZ-01..05 requirement listed with a PASS/FAIL verdict
- [x] **DOC-05**: A reviewer can read `.planning/milestones/v6.0-phases/39-*/VERIFICATION.md` and find every BOARD-01..03 requirement listed with a PASS/FAIL verdict
- [x] **DOC-06**: A reviewer can read `.planning/milestones/v6.0-phases/40-*/VERIFICATION.md` and find every LIST-01..04 requirement listed with a PASS/FAIL verdict
- [x] **DOC-07**: Every `[x]` checkbox in the v6.0 archive at `.planning/milestones/v6.0-REQUIREMENTS.md` matches the SUMMARY frontmatter for the same REQ-ID (THEME-01 truncated checkbox repaired; remaining 26 partial-verified IDs flipped from `[ ]` to `[x]` once their VERIFICATION.md backfill lands)
- [x] **DOC-08**: The v6.0 ROADMAP archive (`.planning/milestones/v6.0-ROADMAP.md`) progress table reports 121/121 plans complete and matches MILESTONES.md, and the active `.planning/ROADMAP.md` shows a clean v6.0 close + v6.1 open

### Toolchain & Bundle Budget (TOOL)

- [x] **TOOL-01**: A developer can run `pnpm -C frontend size-limit` and the command exits 0 with all configured chunks measured against the current output budgets in `frontend/.size-limit.json`; the historical 815 KB total remains an aspirational optimization target, not the enforced Phase 44 gate
- [x] **TOOL-02**: The `size-limit` configuration matches Vite's actual output filenames (vendor-super-chunk + per-route splits as of Phase 42), so a real budget regression fails the gate; an intentional >=1 KB increase from `main.tsx` produces a non-zero exit
- [x] **TOOL-03**: The CI workflow that runs `size-limit` is wired so a failing budget blocks merge; a verification PR that bumps a chunk past the ceiling is rejected by CI

### Anti-Pattern Closure (LINT)

- [x] **LINT-01**: `OverdueCommitments.tsx:154` no longer has the dead `?? c.ownerInitials` branch on a `t()` return; the branch is either deleted or replaced with a typed fallback that the linter accepts as reachable (WR-02)
- [x] **LINT-02**: `DrawerCtaRow.tsx:93`, `VipVisits.tsx:110`, and `OverdueCommitments.tsx:168` use `aria-labelledby` referencing the visible label element instead of `aria-label` shadowing visible text; axe-core "label not redundant with text" rule passes (WR-03)
- [x] **LINT-03**: `sidebar.tsx:209` no longer wraps a literal hex inside `hsl(var(--sidebar))`; the value either resolves to a valid OKLCH/HSL color via the design tokens or is replaced with a direct token reference, and CSS validation passes (WR-04)
- [x] **LINT-04**: `MyTasks.tsx:130-135` uses `aria-labelledby` on the Checkbox referencing the sibling task title span instead of duplicating the title in `aria-label` (WR-05)
- [x] **LINT-05**: `CalendarEntryForm.tsx` `t('calendar.form.*')` calls resolve in the `calendar` namespace (or are explicitly namespaced as `t('form.field', { ns: 'calendar' })`); both EN and AR translations render the form labels correctly with no fallback to the default namespace (WR-06)

### Storybook Coverage (STORY)

- [x] **STORY-01**: Either Plan 33-08 ships — Storybook stories exist for the 8 v6.0 visual primitives (`GlobeLoader`, `GlobeSpinner`, `FullscreenLoader`, `DossierGlyph`, `Sparkline`, `Donut`, plus Skeleton/Spinner) covering each direction × mode × density permutation in `frontend/src/stories/` — OR the deferral is formalized via an ADR at `.planning/decisions/ADR-006-storybook-deferral.md` that names the replacement coverage strategy (vitest snapshot tests, Playwright visual specs) and the trigger condition for revisiting

### Schema & Seed Closure (DATA)

- [x] **DATA-01**: An `intelligence_digest` table exists in Supabase with `id`, `headline_en`, `headline_ar`, `summary_en`, `summary_ar`, `source_publication`, `occurred_at`, `dossier_id` (nullable FK), `created_at` columns; RLS policies match the existing `dossiers` table pattern (org-scoped read, role-gated write); migration applied to staging via the Supabase MCP per CLAUDE.md
- [x] **DATA-02**: The dashboard `Digest` widget reads from `intelligence_digest` via a typed hook (`useIntelligenceDigest`), not from `actor_name` on internal user records; the displayed `source` field shows the publication name, not an internal username (closes DIGEST-SOURCE-COMPROMISE)
- [x] **DATA-03**: The dashboard RPC that powers `VipVisits` includes a join to `country_iso_codes` so each VIP row carries the country's ISO-3166 alpha-2 code; the `<DossierGlyph>` flag fallback chain consumes the ISO code instead of inferring from the dossier name (foreign-relations enrichment closes the Phase 41 deferred item)
- [x] **DATA-04**: `frontend/seeds/060-dashboard-demo.sql` is applied to the staging database via Supabase MCP migration; the 4 previously BLOCKED-BY-SEED Playwright specs (Phase 41 dashboard widget specs) execute and pass against the seeded data

### Visual Baseline Regeneration (VIS)

- [x] **VIS-01**: Eight Phase 38 widget visual baselines (KpiStrip, WeekAhead, OverdueCommitments, Digest, SlaHealth, VipVisits, MyTasks, RecentDossiers) are regenerated via `doppler run -- pnpm --filter frontend exec playwright test dashboard-widgets --update-snapshots` and committed; the corresponding CI visual-regression job exits 0 (DASH-VISUAL-BLOCKED + DASH-VISUAL-REVIEW closed)
- [x] **VIS-02**: Fourteen Phase 40 list-page visual baselines (7 pages × EN + AR) are regenerated via `doppler run -- pnpm --filter frontend exec playwright test list-pages-* --update-snapshots` and committed; CI visual-regression for list pages exits 0
- [x] **VIS-03**: Two Phase 41 dossier-drawer visual baselines are regenerated post-token-darkening (`--accent-fg` 4.38 → 5.28; `inkFaint` 3.14 → 5.07) and committed; the dossier-drawer visual spec exits 0
- [x] **VIS-04**: A reviewer documents the human-eyeball pass for the regenerated baselines in `.planning/phases/46-*/VALIDATION.md` (or equivalent), naming each new baseline file and confirming the rendering matches the handoff reference

---

## Future Requirements

Deferred to v7.0 (Intelligence Engine) — see `.planning/seeds/v7.0-intelligence-engine.md`:

- Structured `intelligence_signal` model and signal-to-dossier polymorphic linking (DATA-01 above is the bare minimum to unblock the dashboard widget; full signal model belongs in v7.0)
- Recurring scheduled briefings, cross-dossier digest aggregation, subscriber model
- Threshold-based alerting (in-app + email + push)
- Analytic graph queries surfaced in Network panel and Cmd+K
- Multi-dossier AI correlation briefings + prompt registry
- External feed ingestion (RSS, public APIs)

---

## Out of Scope

Explicit exclusions for v6.1 (with reasoning):

- **New feature work** — v6.1 is a debt closure milestone. New capabilities belong in v7.0
- **Re-running v6.0 audit** — audit is the input to this milestone, not the output. v6.1 closes the items the audit logged; it does not re-derive the inventory
- **MyTasks trigger, dossierType propagation, engagement-create prefill** — Phase 41 deferred items unrelated to the dashboard schema gap; bundle into v7.0 workflow-depth scoping rather than retrofitting here
- **G8/G9 Phase 41 follow-ups** — already mitigated per audit; no live regression
- **Visual-regression for routes outside Phases 38/40/41** — those baselines were captured during their owning phases; this milestone only regenerates the deferred trio
- **Refactoring the FOUC bootstrap byte-mirror invariant** — preserved as-is; revisit only if a token rename forces it

---

## Traceability

| REQ-ID   | Phase    | VERIFICATION       |
| -------- | -------- | ------------------ |
| DOC-01   | Phase 44 | TBD                |
| DOC-02   | Phase 44 | TBD                |
| DOC-03   | Phase 44 | TBD                |
| DOC-04   | Phase 44 | TBD                |
| DOC-05   | Phase 44 | TBD                |
| DOC-06   | Phase 44 | TBD                |
| DOC-07   | Phase 44 | TBD                |
| DOC-08   | Phase 44 | TBD                |
| TOOL-01  | Phase 44 | TBD                |
| TOOL-02  | Phase 44 | TBD                |
| TOOL-03  | Phase 44 | TBD                |
| LINT-01  | Phase 44 | TBD                |
| LINT-02  | Phase 44 | TBD                |
| LINT-03  | Phase 44 | TBD                |
| LINT-04  | Phase 44 | TBD                |
| LINT-05  | Phase 44 | TBD                |
| STORY-01 | Phase 44 | TBD                |
| DATA-01  | Phase 45 | 45-VERIFICATION.md |
| DATA-02  | Phase 45 | 45-VERIFICATION.md |
| DATA-03  | Phase 45 | 45-VERIFICATION.md |
| DATA-04  | Phase 45 | 45-VERIFICATION.md |
| VIS-01   | Phase 46 | 46-VALIDATION.md   |
| VIS-02   | Phase 46 | 46-VALIDATION.md   |
| VIS-03   | Phase 46 | 46-VALIDATION.md   |
| VIS-04   | Phase 46 | 46-VALIDATION.md   |

_Phase column populated by `gsd-roadmapper` 2026-05-07. VERIFICATION column populated per-phase by `gsd-verify-phase` after each phase completes._
