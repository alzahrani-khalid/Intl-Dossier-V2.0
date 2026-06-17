# Roadmap: Intl-Dossier

## Milestones

- ✅ **v2.0 Production Quality** — Phases 1-7 (shipped 2026-03-28) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 Connected Workflow** — Phases 8-13 (shipped 2026-04-06) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Live Operations** — Phases 14-23 (shipped 2026-04-09) — [archive](milestones/v4.0-ROADMAP.md)
- ✅ **v4.1 Post-Launch Fixes** — Phases 24-25 (shipped 2026-04-12) — [archive](milestones/v4.1-ROADMAP.md)
- ✅ **v5.0 Dossier Creation UX** — Phases 26-32 (shipped 2026-04-18) — [archive](milestones/v5.0-ROADMAP.md)
- ✅ **v6.0 Design System Adoption** — Phases 33-43 (shipped 2026-05-06) — [archive](milestones/v6.0-ROADMAP.md)
- ✅ **v6.1 Hardening & Reconciliation** — Phases 44-46 (shipped 2026-05-08) — [archive](milestones/v6.1-ROADMAP.md)
- ✅ **v6.2 Type-Check, Lint & Bundle Reset** — Phases 47-49 (shipped 2026-05-12) — [archive](milestones/v6.2-ROADMAP.md)
- ✅ **v6.3 Carryover Sweep & v7.0 Prep** — Phases 50-54 (shipped 2026-05-17) — [archive](milestones/v6.3-ROADMAP.md)
- ✅ **v6.4 Stabilization & Carryover Sweep** — Phases 55-59 (shipped 2026-05-27) — [archive](milestones/v6.4-ROADMAP.md)
- ✅ **v6.5 Escalated Backlog Hardening** — Phases 60-61 (shipped 2026-06-11) — [archive](milestones/v6.5-ROADMAP.md)
- ✅ **v6.6 Dossier Workflow Completion** — Phases 62-67 (shipped 2026-06-13) — [archive](milestones/v6.6-ROADMAP.md)
- 🔄 **v7.0 Intelligence Engine** — Phases 68-74 (in progress)

## Phases

<details>
<summary>✅ v2.0 Production Quality (Phases 1-7) — SHIPPED 2026-03-28</summary>

- [x] Phase 1: Dead Code & Toolchain (3/3 plans) — ESLint 9, Prettier, Knip, pre-commit hooks
- [x] Phase 2: Naming & File Structure (3/3 plans) — consistent naming enforced via ESLint
- [x] Phase 3: Security Hardening (3/3 plans) — auth, RBAC, CSP, Zod, RLS
- [x] Phase 4: RTL/LTR Consistency (6/6 plans) — useDirection, LtrIsolate, logical properties
- [x] Phase 5: Responsive Design (5/5 plans) — mobile-first, touch targets, card views
- [x] Phase 6: Architecture Consolidation (5/5 plans) — domain repos, apiClient, service dedup
- [x] Phase 7: Performance Optimization (4/4 plans) — bundle budget, query tiers, memoization

Full details: [v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md)

</details>

<details>
<summary>✅ v3.0 Connected Workflow (Phases 8-13) — SHIPPED 2026-04-06</summary>

- [x] Phase 8: Navigation & Route Consolidation (4/4 plans) — hub sidebar, route dedup, mobile tabs, Cmd+K
- [x] Phase 9: Lifecycle Engine (5/5 plans) — 6-stage lifecycle, transitions, forum sessions
- [x] Phase 10: Operations Hub (4/4 plans) — role-adaptive dashboard, 5 zones, Realtime
- [x] Phase 11: Engagement Workspace (5/5 plans) — tabbed workspace, lifecycle stepper, kanban, calendar
- [x] Phase 12: Enriched Dossier Pages (5/5 plans) — DossierShell, RelationshipSidebar, Elected Officials
- [x] Phase 13: Feature Absorption (5/5 plans) — analytics, AI, graph, polling, export absorbed; Cmd+K search

Full details: [v3.0-ROADMAP.md](milestones/v3.0-ROADMAP.md)

</details>

<details>
<summary>✅ v4.0 Live Operations (Phases 14-23) — SHIPPED 2026-04-09</summary>

- [x] Phase 14: Production Deployment (3/3 plans) — HTTPS, CI/CD, monitoring, backups, rollback
- [x] Phase 15: Notification Backend & In-App (3/3 plans) — BullMQ, triggers, bell icon, preferences
- [x] Phase 16: Email & Push Channels (4/4 plans) — Resend email, digest, browser push, soft-ask
- [x] Phase 17: Seed Data & First Run (5/5 plans) — 40+ entities, first-run modal, bilingual
- [x] Phase 18: E2E Test Suite (4/4 plans) — Playwright POM, CI sharding, auth hardening, failure artifacts
- [x] Phase 19: Tech Debt Cleanup (2/2 plans) — typed router params, roadmap auto-sync
- [x] Phase 20: Live Operations Bring-Up (1/1 plan) — seed accounts provisioned
- [x] Phase 21: Digest Scheduler Wiring Fix (1/1 plan) — registerDigestScheduler() wired
- [x] Phase 22: E2E Test Fixes (1/1 plan) — notification spec + ops-hub testids fixed
- [x] Phase 23: Missing Verifications (2/2 plans) — SEED/DEBT requirements formally verified

Full details: [v4.0-ROADMAP.md](milestones/v4.0-ROADMAP.md)

</details>

<details>
<summary>✅ v4.1 Post-Launch Fixes (Phases 24-25) — SHIPPED 2026-04-12</summary>

- [x] Phase 24: Browser Inspection Fixes (2/2 plans) — calendar i18n, settings 406, analytics DNS
- [x] Phase 25: Deferred Audit Fixes (5 plans + 6 quick tasks) — 87/87 audit findings resolved

Full details: [v4.1-ROADMAP.md](milestones/v4.1-ROADMAP.md)

</details>

<details>
<summary>✅ v5.0 Dossier Creation UX (Phases 26-32) — SHIPPED 2026-04-18</summary>

- [x] Phase 26: Shared Wizard Infrastructure (4/4 plans) — `useCreateDossierWizard` hook, `CreateWizardShell`, per-type Zod schemas, defaults factory
- [x] Phase 27: Country Wizard (2/2 plans) — 3-step wizard, ISO/region/capital, list-page CTA
- [x] Phase 28: Simple Type Wizards (4/4 plans) — Organization, Topic, Person wizards
- [x] Phase 29: Complex Type Wizards (6/6 plans) — Forum, Working Group, Engagement wizards with relationship linking
- [x] Phase 30: Elected Official Wizard (4/4 plans) — Person variant with office/term/constituency
- [x] Phase 31: Creation Hub and Cleanup (4/4 plans) — `CreateDossierHub`, context-aware FAB, legacy wizard removal
- [x] Phase 32: Person-Native Basic Info (4/4 plans) — `PersonBasicInfoStep` with honorific, split names, nationality, DOB, gender

Full details: [v5.0-ROADMAP.md](milestones/v5.0-ROADMAP.md)

</details>

<details>
<summary>✅ v6.0 Design System Adoption (Phases 33-43) — SHIPPED 2026-05-06</summary>

- [x] Phase 33: Token Engine (8/9 plans, 33-08 storybook deferred) — OKLCH-driven token engine across 4 directions × mode × hue × density via Tailwind v4 `@theme` + HeroUI v3 semantic bridge
- [x] Phase 34: Tweaks Drawer (8/8 plans) — Topbar Tweaks drawer (Direction/Mode/Hue/Density/Classification/Locale) with `localStorage` persistence; `/themes` route removed
- [x] Phase 35: Typography Stack (5/5 plans) — Self-hosted font stacks per direction + Tajawal RTL cascade; zero Google Fonts CDN calls
- [x] Phase 36: Shell Chrome (5/5 plans) — 256px sidebar + 56px topbar + direction-specific classification element + GASTAT brand mark + responsive overlay-drawer
- [x] Phase 37: Signature Visuals (9/9 plans) — GlobeLoader / GlobeSpinner / FullscreenLoader / DossierGlyph (24 flags + symbol fallbacks) / Sparkline / Donut
- [x] Phase 38: Dashboard Verbatim (10/10 plans) — 8 widgets rebuilt pixel-exact to reference, wired to real domain hooks (75/75 vitest, PASS-WITH-DEVIATION)
- [x] Phase 39: Kanban + Calendar (10/10 plans) — Horizontal-scroll Kanban (kcards, overdue border, done opacity) + 7×5 calendar grid with event pills (PASS-WITH-DEVIATION)
- [x] Phase 40: List Pages (23/23 plans) — Countries / Organizations / Persons / Forums / Topics / Working Groups / Engagements lists with shared `GenericListPage` (PASS-WITH-DEFERRAL)
- [x] Phase 41: Dossier Drawer (11/11 plans) — 720px drawer with mini-KPI strip + serif summary + Upcoming/Activity/Commitments + RTL flip + mobile full-screen (PASS-WITH-DEVIATION)
- [x] Phase 42: Remaining Pages (12/12 plans) — Briefs / After-actions / Tasks / Activity / Settings reskinned to handoff anatomy (PASS-WITH-DEFERRAL)
- [x] Phase 43: RTL / A11y / Responsive Sweep (19/19 plans) — UAT 94/4/0 across 15 v6.0 routes × 2 locales (axe + responsive + keyboard + focus-outline) + `docs/rtl-icons.md`

Full details: [v6.0-ROADMAP.md](milestones/v6.0-ROADMAP.md)

</details>

<details>
<summary>✅ v6.1 Hardening & Reconciliation (Phases 44-46) — SHIPPED 2026-05-08</summary>

- [x] Phase 44: Documentation, Toolchain & Anti-patterns (6/6 plans) — verification backfill, archive sync, size-limit gate repair, WR-02..WR-06 closure, ADR-006
- [x] Phase 45: Schema & Seed Closure (4/4 plans) — `intelligence_digest`, dashboard digest hook, VIP ISO projection, staging seed closure
- [x] Phase 46: Visual Baseline Regeneration (4/4 plans) — 24 regenerated baselines for dashboard widgets, list pages, and dossier drawer with human review

Full details: [v6.1-ROADMAP.md](milestones/v6.1-ROADMAP.md)

</details>

<details>
<summary>✅ v6.2 Type-Check, Lint & Bundle Reset (Phases 47-49) — SHIPPED 2026-05-12</summary>

- [x] Phase 47: Type-Check Zero (11/11 plans) — frontend 1580 + backend 498 TS errors → 0 via deletion-first + typed-at-source; `type-check` restored as PR-blocking CI gate; 19 of 20 shims retired
- [x] Phase 48: Lint & Config Alignment (3/3 plans) — frontend 723 + backend 4 lint problems → 0; root `eslint.config.mjs` single source of truth; Aceternity references purged; `no-restricted-imports` inverted per CLAUDE.md primitive cascade; `Lint` restored as PR-blocking CI gate
- [x] Phase 49: Bundle Budget Reset (3/3 plans) — Initial-route ceiling 517 → 450 KB; static-prim 64 → 12 KB; manualChunks ordering fix; heroui/sentry/dnd sub-vendor decomposition; 3 audit-driven `React.lazy()` conversions; `Bundle Size Check (size-limit)` restored as PR-blocking CI gate

Full details: [v6.2-ROADMAP.md](milestones/v6.2-ROADMAP.md)

</details>

<details>
<summary>✅ v6.3 Carryover Sweep & v7.0 Prep (Phases 50-54) — SHIPPED 2026-05-17</summary>

- [x] Phase 50: Test Infrastructure Repair (10/10 plans) — `vi.mock("react-i18next")` factory uses `vi.importActual` + spread; 4 wizard tests green; `50-TEST-AUDIT.md` + test-setup docs published
- [x] Phase 51: Design-Token Compliance Gate (4/4 plans) — ESLint D-05 bans raw hex + Tailwind palette literals at `error` workspace-wide; 50 Tier-A files swapped to tokens; 271 Tier-C suppressed per-Literal; smoke PR #12 BLOCKED via D-09 fold into Phase 48 `Lint` context
- [x] Phase 52: HeroUI v3 Kanban Migration (5/5 plans) — shared `@dnd-kit/core` primitive; TasksTab migrated; `EngagementKanbanDialog` + `EngagementDossierPage` deleted (KANBAN-02 satisfied-by-deletion D-20); kibo-ui + tunnel-rat purged; 4 EN+AR baselines committed (PASS-WITH-DEVIATION — D-19..D-23 documented)
- [x] Phase 53: Bundle Tightening + Tag Provenance (3/3 plans) — React vendor ceiling 349 → 285 KB gz (measured 279.42 kB); `phase-47/48/49-base` annotated + SSH-signed (`git tag -v` Good); CLAUDE.md Node note `22.13.0+`
- [x] Phase 54: Intelligence Engine Schema Groundwork (4/4 plans) — `intelligence_event` + new `intelligence_digest` (prior renamed `dashboard_digest`) + polymorphic junction + `signal_source_type` enum + regenerated TS types byte-identical across workspaces; schema-only — no API, no UI

Full details: [v6.3-ROADMAP.md](milestones/v6.3-ROADMAP.md)

</details>

<details>
<summary>✅ v6.4 Stabilization & Carryover Sweep (Phases 55-59) — SHIPPED 2026-05-27</summary>

- [x] Phase 55: DesignV2 → Main Merge & Gate Enforcement (4/4 plans) — DesignV2 landed on `main` (`3f763ddc`); branch protection 6 → 8 required CI contexts; smoke PR #18 `BLOCKED` proof
- [x] Phase 56: RLS Closure & Last Typed-Shim Retirement (2/2 plans) — `countries` → `globalReferenceTables` tier; `useStakeholderInteractionMutations` typed at source
- [x] Phase 57: Phase 52 Deviation Closure D-19..D-23 (4/4 plans) — mobile-DnD scope-out ADR + `<select>` fallback; `@dnd-kit/core` ban + regression test; LTR/RTL baselines md5-distinct; live tasks-tab run
- [x] Phase 58: Tier-C Design-Token Suppression Full Clear (7/7 plans) — 271 suppressions / 2336 AST nodes → 0; waiver removed from `eslint.config.mjs` (merge `aed43b97`)
- [x] Phase 59: Cosmetic + CI Gap Closure (3/3 plans) — Phase 53 wording, doc drift, bad-fixture positive-failure CI jobs (PR #27 `d3e7f8e`)

Full details: [v6.4-ROADMAP.md](milestones/v6.4-ROADMAP.md)

</details>

<details>
<summary>✅ v6.5 Escalated Backlog Hardening (Phases 60-61) — SHIPPED 2026-06-11</summary>

- [x] Phase 60: Schema & Type Truth Restoration (6/6 plans) — completed 2026-06-10
- [x] Phase 61: Security Pass (delivered by quick task 260610-fkn; verified 2026-06-11)

Full details: [v6.5-ROADMAP.md](milestones/v6.5-ROADMAP.md)

</details>

<details>
<summary>✅ v6.6 Dossier Workflow Completion (Phases 62-67) — SHIPPED 2026-06-13</summary>

- [x] Phase 62: Export Pack Contract & Deploy (3/3 plans) — completed 2026-06-12
- [x] Phase 63: Relationship Graph Route & Bidirectional Traversal (5/5 plans) — completed 2026-06-12
- [x] Phase 64: New Position from Dossier (6/6 plans) — completed 2026-06-12
- [x] Phase 65: Engagement Positions Tab & Legacy Reconciliation (6/6 plans) — completed 2026-06-13
- [x] Phase 66: Overview Error Contract & Timeline Cross-Links (8/8 plans) — completed 2026-06-13
- [x] Phase 67: Per-Type Engagement Contracts & Legacy Detail Cleanup (6/6 plans) — completed 2026-06-13

Full details: [v6.6-ROADMAP.md](milestones/v6.6-ROADMAP.md)

</details>

### 🔄 v7.0 Intelligence Engine (Phases 68-74) — IN PROGRESS

**Goal:** Turn dossiers from passive records into a fully on-prem, Arabic-first intelligence layer — delivered as conventional analyst surfaces (signals triage, digests/alerts, analytic graph) AND an agentic copilot that is incapable by construction of reading above the caller's clearance.

**Cross-cutting guarantees (apply to every phase):**

- Security keystone: every interactive agent DB op runs under the caller's JWT; every write is HITL; service-role only on cron/no-user paths
- Bilingual/RTL: every new surface renders in `i18n.language`; new i18n namespaces registered in `src/i18n/index.ts`; `dir="rtl"` + Tajawal + logical properties; design tokens only
- On-prem fidelity: no data egress; all models/embedders/rerankers/observability self-hosted
- GSD discipline: research → plan → execute → live UAT staging (seed/observe/restore, EN+AR) → code review → verify → PR → merge

**Parallel infra track (begins Phase 68, lands by Phase 72):** vLLM + Gemma 4 12B + TEI (bge-m3 + bge-reranker) + Langfuse + Arize Phoenix — zero telemetry egress.

- [x] **Phase 68: AI Foundations Remediation** - One canonical clearance scale; no corrupted embeddings; the interactive AI path honors RLS (completed 2026-06-14)
- [x] **Phase 69: Signals** - Analysts capture and triage signals tied to dossiers; the agent can read them (completed 2026-06-14)
- [x] **Phase 70: Digests + Alerts** - Recurring digests and threshold alerts reach subscribers across channels (completed 2026-06-16)
- [ ] **Phase 71: Analytic Graph** - First-class analytic queries over the relationship graph, clearance-gated
- [ ] **Phase 72: Agent Platform — Runtime, Retrieval, Reads** - The on-prem agent goes live reading P69–71 data under the JWT keystone
- [ ] **Phase 73: Agent Platform — Writes + Generative UI** - The copilot safely drives dossiers with human-in-the-loop
- [ ] **Phase 74: Eval Gate + AnythingLLM Retirement** - Quality is regression-gated; the legacy AI path is gone

Full details: [v7.0-ROADMAP.md](milestones/v7.0-ROADMAP.md)

---

### Phase 68: AI Foundations Remediation

**Goal**: One canonical clearance scale exists; no corrupted embeddings reach the vector store; the interactive AI path honors RLS at the DB level.
**Depends on**: Nothing — this is the hard gate. All later phases depend on Phase 68.
**Requirements**: REMED-01, REMED-02, REMED-03, REMED-04, REMED-05, REMED-06
**Success Criteria** (what must be TRUE):

1. A non-cleared user cannot retrieve above-clearance content via the existing semantic/vector search — verified live on staging by blocking a low-clearance account and confirming zero above-clearance results are returned.
2. A non-cleared user cannot retrieve above-clearance content via the existing interactive assistant — verified live by confirming `supabaseAdmin` is retired from `chat-assistant.ts` and the assistant runs all DB reads under the caller's JWT.
3. All clearance checks key off `profiles.clearance_level` (1–4) as the single canonical scale — verified by confirming the prior 1–3 function and `low/medium/high` sensitivity string variants are reconciled without breaking existing RLS policies on staging.
4. A new embedding write stores vectors at native 1024-dim with no pad/truncate applied — verified by inserting a test document and asserting `array_length(embedding, 1) = 1024` in the DB.
5. An operator can trace a complete AI request (prompt → model → response) end-to-end in self-hosted Langfuse or Arize Phoenix, with zero network egress to external telemetry endpoints.
   **Plans**: 8 plans
   Plans:

**Wave 1**

- [x] 68-01-PLAN.md — Wave-0 test stubs + live A1-A6 DB introspection

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 68-02-PLAN.md — REMED-01: clearance compat shim migration + staging apply

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 68-03-PLAN.md — REMED-02: search_semantic_clearance_gated INVOKER RPC + edge-fn repoint
- [x] 68-04-PLAN.md — REMED-03: chat-assistant supabaseAdmin retirement + D-10 repoints

**Wave 4** _(blocked on Wave 3 completion)_

- [x] 68-05-PLAN.md — REMED-04: native-1024 embedding write path (storeEmbedding)
- [x] 68-06-PLAN.md — REMED-05: Langfuse + Phoenix docker-compose + OTel wiring
- [x] 68-07-PLAN.md — REMED-06: i18n namespace guard (check-i18n-namespaces.mjs + lint integration)

**Wave 5** _(blocked on Wave 4 completion)_

- [x] 68-08-PLAN.md — [BLOCKING] Full test suite + live UAT clearance-block verification
      **UI hint**: no

---

### Phase 69: Signals

**Goal**: Analysts can capture and triage intelligence signals tied to one or more dossiers; the agent can read signals under clearance gating.
**Depends on**: Phase 68 (clearance scale and JWT keystone must be canonical before signal RLS is authored)
**Requirements**: SIGNAL-01, SIGNAL-02, SIGNAL-03, SIGNAL-04, SIGNAL-05, SIGNAL-06
**Success Criteria** (what must be TRUE):

1. A user can manually create an intelligence signal (title, body, sensitivity level, linked dossier(s)) and immediately see it appear on the linked dossier's Signals tab — verified live EN+AR.
2. An AI-surfaced signal (created programmatically via the `ai_generated` source type) appears in the same triage surface as manual signals, clearance-gated — verified by seeding one above-clearance signal and confirming it is hidden from a lower-clearance account.
3. A user can triage a signal (acknowledge / dismiss / escalate) using only the keyboard from the RTL-safe triage surface — verified live in Arabic mode.
4. A user can escalate a signal into a tracked work item and see the work item in the Kanban board — verified live on staging (seed → escalate → observe in Tasks).
5. The agent's `read_signals` tool returns only signals at or below the caller's clearance, and returns the correct result when a cleared user queries signals on a specific dossier — verified via live tool invocation against staging.
   **Plans**: 4 plans

**Wave 1** (baseline)

- [x] 69-01-PLAN.md — Migration + Supabase MCP apply + i18n namespace + base types

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 69-02-PLAN.md — Data hooks: useSignals (read_signals RPC), useSignalMutations, useSignalEscalate

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 69-03-PLAN.md — Triage queue UI: keyboard hook, SignalRow, SignalsQueue, CaptureSignalForm, IntelligencePage tab extension

**Wave 4** _(blocked on Wave 3 completion)_

- [x] 69-04-PLAN.md — EscalateSignalDialog + DossierSignalsTab wiring + Phase Gate UAT (all 6 SIGNAL scenarios)
      **UI hint**: yes

---

### Phase 70: Digests + Alerts

**Goal**: Recurring digests and threshold alerts reach subscribers across in-app, email, and external channels, with all content clearance-gated.
**Depends on**: Phase 69 (signals are the primary trigger source for alerts; digest content includes signal data)
**Requirements**: DIGEST-01, DIGEST-02, DIGEST-03, DIGEST-04, ALERT-01, ALERT-02, ALERT-03, ALERT-04
**Success Criteria** (what must be TRUE):

1. A user can subscribe to a recurring digest scoped to a dossier or topic, view it rendered in-app, and unsubscribe — verified live EN+AR.
2. A triggered threshold alert (new signal on a tracked dossier) is delivered to in-app, on-prem SMTP email, and an external webhook endpoint — verified live by seeding a signal on a tracked dossier and confirming delivery on all three channels.
3. External-channel payloads (webhook/Teams) carry only deep-links and zero classified content — verified by inspecting the outbound payload body on a MEDIUM-sensitivity signal and confirming no signal body text is present.
4. The digest pipeline runs under service-role with explicit app-layer authz; each subscriber receives only clearance-appropriate content — verified by subscribing two accounts at different clearance levels to the same dossier and confirming each digest contains only within-clearance signals.
5. The agent's `generate_digest` HITL tool presents a bilingual confirmation card before committing and publishes only after approval — verified live via the agent surface on staging.
   **Plans**: 7 plans
   Plans:
   **Wave 1**
   - [x] 70-01-PLAN.md — Wave 1: test scaffold (8 stubs) + nodemailer/pg install (blocking package legitimacy checkpoint)

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 70-02-PLAN.md — Wave 2: full database migration SQL (4 tables, 4 INVOKER RPCs, pg_notify trigger)

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 70-03-PLAN.md — Wave 3: [BLOCKING] Supabase MCP migration apply to staging + 6-query verification

**Wave 4** _(blocked on Wave 3 completion)_

- [x] 70-04-PLAN.md — Wave 4: ChannelAdapter layer + alert worker (3 adapters, pg LISTEN, BullMQ)
- [x] 70-05-PLAN.md — Wave 4: digest pipeline + alerts.service.ts replacement + Express API routes

**Wave 5** _(blocked on Wave 4 completion)_

- [x] 70-06-PLAN.md — Wave 5: frontend surfaces (i18n, hooks, 7 components, IntelligencePage 4-tab extension)

**Wave 6** _(blocked on Wave 5 completion)_

- [x] 70-07-PLAN.md — Wave 6: GenerateDigestButton + 8 dossier digests routes + backend wiring + live UAT
      **UI hint**: yes

---

### Phase 71: Analytic Graph

**Goal**: Analysts and the agent can run clearance-aware analytic graph queries (who-sits-on-which-forum, shared committees, engagement chains) from the Network panel and Cmd+K.
**Depends on**: Phase 70 (completes the data layer before agent reads are wired; graph queries reference engagements and signals from prior phases)
**Requirements**: GRAPH-01, GRAPH-02, GRAPH-03, GRAPH-04
**Success Criteria** (what must be TRUE):

1. A user can run the "who connects to whom across forums" analytic query from the Network panel and receive a result — verified live on seeded staging data.
2. A user can launch an analytic graph query from Cmd+K ("Analyze: shared committees") and see clearance-gated results inline — verified live EN+AR.
3. A lower-clearance user running the same query as a higher-clearance user sees a strictly reduced result set — verified live by running identical queries from two different clearance-level accounts and comparing node/edge counts.
4. The agent's `query_graph` tool returns clearance-correct results under the caller's JWT, enforced by `SECURITY INVOKER` on all analytic RPCs — verified via live tool invocation with a low-clearance account and confirming no above-clearance nodes appear.
   **Plans**: 5 plans
   - [x] 71-01-PLAN.md — Wave 0 test scaffolding (3 backend integration + 3 FE tests) + RF-7 high-sensitivity seed fixture
   - [x] 71-02-PLAN.md — query_graph multiplexed SECURITY INVOKER RPC (forum/committees/chain/path) + analytic-graph edge fn
   - [ ] 71-03-PLAN.md — [BLOCKING] apply migration via Supabase MCP + deploy edge fn + backend integration tests green on staging
   - [ ] 71-04-PLAN.md — Network-panel Analyze mode: useAnalyticGraph hook, route schema, AnalyticQueryPicker + AnalyticResultView
   - [ ] 71-05-PLAN.md — Cmd+K Analyze entries + per-dossier affordance + i18n (en/ar) + live UAT (4 criteria, EN+AR)
         **UI hint**: yes

---

### Phase 72: Agent Platform — Runtime, Retrieval, Reads

**Goal**: The on-prem copilot is live, reading Phases 69–71 data under the JWT keystone, with hybrid-RAG retrieval and a bilingual token-bound conversational surface.
**Depends on**: Phases 69, 70, 71 (the agent needs real signal/digest/graph data to read); Parallel infra track must land (vLLM + TEI stood up before this phase executes)
**Requirements**: AGENT-01, AGENT-02, AGENT-03, AGENT-04, AGENT-05, AGENT-06, INFRA-01, INFRA-02, INFRA-03
**Success Criteria** (what must be TRUE):

1. A cleared user can converse with the on-prem copilot from the primary conversational surface and from Cmd+K, and the copilot answers from gated intelligence data (signals, digests, graph, dossiers) under the caller's JWT — verified live on staging.
2. A non-cleared user receives clearance-correct (reduced) copilot results and provably cannot receive above-clearance content — verified live by querying the copilot as a low-clearance account and confirming no above-clearance content appears in the response.
3. Copilot replies render as token-bound bilingual cards in the user's language with correct RTL rendering in Arabic mode — verified live in both EN and AR.
4. All retrievable content is embedded at bge-m3 1024-dim (one-time re-embed completed; `array_length(embedding, 1) = 1024` for all rows in `rag_chunks`) and the `rag_chunks` table uses `SECURITY INVOKER` + RLS — verified by inspecting the DB schema on staging.
5. The `agent-runtime` Turborepo workspace runs on its own port in `docker-compose.prod`, is reachable by the frontend, and processes a chat turn end-to-end — verified by a smoke-test request from staging.
   **Plans**: TBD
   **UI hint**: yes

---

### Phase 73: Agent Platform — Writes + Generative UI

**Goal**: The copilot safely drives dossier actions with human-in-the-loop confirmation, committing writes under the user's JWT, with immediate query-cache sync to the conventional UI.
**Depends on**: Phase 72 (reads must be proven before writes are enabled; the `agent-runtime` workspace must exist)
**Requirements**: GENUI-01, GENUI-02, GENUI-03, GENUI-04
**Success Criteria** (what must be TRUE):

1. Every state-changing copilot action (create/link work item, generate brief, publish digest, dismiss signal) shows a bilingual token-bound confirmation card and commits only after user approval — verified live on staging for at least two distinct write operations (EN+AR).
2. Approved copilot writes commit under the user's JWT (RLS-enforced), never service-role — verified by confirming the DB row's `created_by` / `actor_id` matches the caller's `auth.uid()` after an approved write.
3. After an approved copilot write, the conventional UI (TanStack Query cache) reflects the change immediately without a manual page reload — verified live in the same browser session.
4. Generative UI renders the app's own token-bound components (UniversalDossierCard, signal cards, etc.) inline in the copilot surface with working deep-links into the app — verified live EN+AR.
   **Plans**: TBD
   **UI hint**: yes

---

### Phase 74: Eval Gate + AnythingLLM Retirement

**Goal**: AI quality is regression-gated via bilingual CI rubrics; the legacy AnythingLLM path is decommissioned from the critical path.
**Depends on**: Phases 69, 70, 71, 72, 73 (all surfaces must exist before their eval rubrics can be wired and before AnythingLLM can be safely retired)
**Requirements**: EVAL-01, EVAL-02, EVAL-03, EVAL-04
**Success Criteria** (what must be TRUE):

1. CI fails on a briefing-quality regression below threshold (EN+AR rubric ≥ 0.80) — verified by deliberately degrading a prompt and confirming the CI job fails on the evaluation step.
2. CI fails on a correlation-accuracy regression below threshold (precision ≥ 0.75 / recall ≥ 0.70) — verified by same mechanism.
3. CI fails on an Arabic-quality regression below threshold (≥ 0.75) — verified by same mechanism.
4. The critical AI path (search suggestions, dashboard digest, assistant) makes zero AnythingLLM calls — verified by blocking the AnythingLLM endpoint at the network level on staging and confirming all three surfaces continue to function correctly.
   **Plans**: TBD
   **UI hint**: no

---

## Progress

<!-- gsd:progress:start -->

<!-- prettier-ignore -->
| Phase | Milestone | Plans Complete | Status | Completed |
| ----- | --------- | -------------- | ------ | --------- |
| 1-7 | v2.0 | — | Shipped | 2026-03-28 |
| 8-13 | v3.0 | — | Shipped | 2026-04-06 |
| 14-23 | v4.0 | — | Shipped | 2026-04-09 |
| 24-25 | v4.1 | — | Shipped | 2026-04-12 |
| 26-32 | v5.0 | — | Shipped | 2026-04-18 |
| 33-43 | v6.0 | — | Shipped | 2026-05-06 |
| 44-46 | v6.1 | 14/14 | Shipped | 2026-05-08 |
| 47-49 | v6.2 | 17/17 | Shipped | 2026-05-12 |
| 50-54 | v6.3 | 28/28 | Shipped | 2026-05-17 |
| 55-59 | v6.4 | 20/20 | Shipped | 2026-05-27 |
| 60-61 | v6.5 | 7/7 | Shipped | 2026-06-11 |
| 62-67 | v6.6 | 34/34 | Shipped | 2026-06-13 |
| 68. AI Foundations Remediation | v7.0 | 8/8 | Complete    | 2026-06-14 |
| 69. Signals | v7.0 | 4/4 | Complete   | 2026-06-14 |
| 70. Digests + Alerts | v7.0 | 7/7 | Complete    | 2026-06-16 |
| 71. Analytic Graph | v7.0 | 2/5 | In Progress|  |
| 72. Agent Platform — Runtime, Retrieval, Reads | v7.0 | 0/? | Not started | - |
| 73. Agent Platform — Writes + Generative UI | v7.0 | 0/? | Not started | - |
| 74. Eval Gate + AnythingLLM Retirement | v7.0 | 0/? | Not started | - |

<!-- gsd:progress:end -->

---

_Roadmap last updated: 2026-06-13 — v7.0 Intelligence Engine roadmap created (Phases 68-74, 41/41 requirements mapped). Source: `docs/superpowers/specs/2026-06-13-v7.0-intelligence-engine-design.md`._
