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
- ✅ **v7.0 Intelligence Engine** — Phases 68-74 (shipped 2026-06-24) — [archive](milestones/v7.0-ROADMAP.md)
- 🔄 **v8.0 Linear Design System Migration** — Phases 75-80 (in progress)

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

<details>
<summary>✅ v7.0 Intelligence Engine (Phases 68-74) — SHIPPED 2026-06-24</summary>

**Goal:** Turn dossiers from passive records into a fully on-prem, Arabic-first intelligence layer — conventional analyst surfaces (signals triage, digests/alerts, analytic graph) AND an agentic copilot incapable by construction of reading above the caller's clearance.

- [x] Phase 68: AI Foundations Remediation (8/8 plans) — completed 2026-06-14
- [x] Phase 69: Signals (4/4 plans) — completed 2026-06-14
- [x] Phase 70: Digests + Alerts (7/7 plans) — completed 2026-06-16
- [x] Phase 71: Analytic Graph (5/5 plans) — completed 2026-06-17
- [x] Phase 72: Agent Platform — Runtime, Retrieval, Reads (9/9 plans) — completed 2026-06-19
- [x] Phase 73: Agent Platform — Writes + Generative UI (5/5 plans) — completed 2026-06-21
- [x] Phase 74: Eval Gate + AnythingLLM Retirement (11/11 plans) — completed 2026-06-21

Full detail: [milestones/v7.0-ROADMAP.md](milestones/v7.0-ROADMAP.md). Audit: [milestones/v7.0-MILESTONE-AUDIT.md](milestones/v7.0-MILESTONE-AUDIT.md) — `gaps_found`, 0 code blockers; EVAL-01/02/03 + AGENT/INFRA live verification deploy-gated on the on-prem GPU/TEI stack.

</details>

### 🔄 v8.0 Linear Design System Migration (Phases 75-80) — IN PROGRESS

**Goal:** Replace the IntelDossier prototype design language with a Linear-derived one — on properly-bridged shadcn/ui RTL infrastructure and HeroUI v3 (already at 3.0.5, bumped to 3.2.1), with Aceternity fully removed — while preserving Arabic RTL correctness on all four axes (dark/light × LTR/RTL) throughout.

**Hard sequencing (from research):** audit → RTL infrastructure bridge + shadcn logical properties → Linear tokens → HeroUI v3 API audit/bump → Aceternity removal → full-route visual/a11y verification. Visual baselines (VERIFY-01) are captured **before** the token phase runs (gating step of Phase 77) and re-compared in the final phase (Phase 80). The `bootstrap.js`/`directions.ts` byte-match CI guard (FOUC-01) is added at the **start** of Phase 77, before any token literal moves.

- [ ] **Phase 75: UI Component & Migration Audit** — classify every hand-rolled surface; inventory pre-3.x HeroUI patterns, v3-removed components, and the 8 Aceternity components with their behavioral contracts
- [ ] **Phase 76: RTL Infrastructure Bridge & shadcn Logical Properties** — single `dir` owner bridged into `<html>` + Radix; portal edge-correct animations; one-shot `migrate rtl`; manual Calendar/Pagination/Sidebar patch; duplicate-`rtl:` CI guard
- [ ] **Phase 77: Linear Token System** — dark+light Linear tokens wired through `directions.ts`/`buildTokens.ts`/`applyTokens.ts`; gap-filled error/status palette; 4-direction switcher retired; Inter + JetBrains Mono; re-skinned primitives; `bootstrap.js` byte-match CI guard (gated by pre-swap full-route baseline capture)
- [ ] **Phase 78: HeroUI v3 API Audit & Bump** — `@heroui/react`/`@heroui/styles` 3.0.5 → 3.2.1; flat-prop → compound-component conversion; no v2/v3 coexistence
- [ ] **Phase 79: Aceternity Removal** — 8 form components rebuilt on HeroUI v3/Radix preserving RHF/Zod validation, ARIA, and keyboard-focus; `@aceternity-pro` registry entry removed from `components.json`
- [ ] **Phase 80: Full-Route Visual + A11y Verification & Smoke Suite** — re-compare all routes (EN+AR × dark+light) against the pre-token baseline; axe-core clean across all 4 axes; portal-animation + Calendar/Pagination/Sidebar RTL smoke tests in CI

---

## Phase Details

### Phase 75: UI Component & Migration Audit

**Goal**: Every UI surface and every library migration target is classified and inventoried, so later phases know exactly what to replace, rebuild, or keep-custom — with domain behavior explicitly protected.
**Depends on**: Phase 74 (v7.0 complete — the current design system and component tree)
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04
**Success Criteria** (what must be TRUE):

1. Every hand-rolled surface in `frontend/src/components/**` is labeled replace-with-shadcn-primitive, keep-custom (domain-specific), or replace-with-shadcn-block — and every "replace-with-primitive" row lists the behaviors the primitive must preserve (empty behavior lists are downgraded to keep-custom).
2. A reader can see, for each HeroUI component still on the pre-3.x flat-prop pattern, which file it lives in and what the compound-API target is.
3. Every usage of a HeroUI v3-removed component (Navbar, Snippet, User, Spacer, Image, Code, Autocomplete, DateInput) is listed with a concrete replacement plan per hit (not a rename).
4. Each of the 8 Aceternity-based components has its RHF/Zod validation wiring, ARIA attributes, and keyboard-focus contract captured in writing before any rebuild starts.
5. Every component touching clearance, RTL directionality, flags/glyphs, or dossier-type logic defaults to keep-custom (or shadcn-block-with-domain-wrapper), never primitive-replace.
   **Plans**: TBD
   **UI hint**: yes

### Phase 76: RTL Infrastructure Bridge & shadcn Logical Properties

**Goal**: One direction authority drives both the document and Radix, every portal opens from the correct edge in both languages, and the shadcn logical-property migration is applied exactly once with a guard against re-introduction.
**Depends on**: Phase 75 (audit sets the surface that migrate rtl touches)
**Requirements**: RTLB-01, RTLB-02, SRTL-01, SRTL-02, SRTL-03
**Success Criteria** (what must be TRUE):

1. Toggling the topbar language control flips `document.dir` AND every mounted Radix portal (Popover/Tooltip/Dropdown/Sheet/drawer) in the same frame — verified in both directions, with no hard-coded `direction="rtl"` anywhere.
2. A user in Arabic sees Popover/Tooltip/Dropdown/Sheet and the dossier drawer animate in from the correct (inline-start) edge, matching English behavior mirrored.
3. `pnpm dlx shadcn@latest migrate rtl` has been run once against `components/ui/**` and committed as a single diff; the repo has no second application.
4. Calendar, Pagination, and Sidebar (the CLI-exempt components) are manually verified RTL-correct in Arabic.
5. A CI check fails the build if any `className` string contains a duplicated `rtl:*` utility.
   **Plans**: TBD
   **UI hint**: yes

### Phase 77: Linear Token System

**Goal**: Linear is the sole visual direction — dark and light token sets derived from the Linear spec, wired end-to-end (bootstrap → tokens → primitives), with the FOUC byte-match invariant and the pre-swap visual baseline both enforced as gates.
**Depends on**: Phase 76 (stable RTL infrastructure so token changes are the only moving variable)
**Requirements**: TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04, TOKEN-05, TOKEN-06, FOUC-01
**Gating step (VERIFY-01 baseline capture)**: Before any literal in `directions.ts` changes, capture full-route visual baselines (EN+AR × dark+light) using the existing Playwright harness. The token PR is gated on this baseline existing first (no baseline laundering). The re-comparison against this baseline is owned by Phase 80.
**Success Criteria** (what must be TRUE):

1. The app renders with Linear dark (canonical) and light token sets sourced from the Linear DESIGN.md spec and wired through `directions.ts`/`buildTokens.ts`/`applyTokens.ts` — with zero raw hex or Tailwind color literals (Design Token Check stays green).
2. A CI guard fails the build if `bootstrap.js` palette/font literals diverge from `directions.ts` (byte-match, not just type-check), and the two files are changed in the same commit.
3. Form-error/warning colors and a 6-value status-tag palette exist in Linear's dark-surface luminance band and pass WCAG AA contrast.
4. The 4-direction switcher (Bureau/Chancery/Situation/Ministerial) is gone from the UI and code; Linear is the only selectable visual direction.
5. Inter (500/600/700) and JetBrains Mono render across the app (self-hosted, mirrored in `bootstrap.js`) and `components/ui/*` primitives follow Linear's button/card/input recipes (no drop shadows, hairline borders, `surface-1..4` ladder).
   **Plans**: TBD
   **UI hint**: yes

### Phase 78: HeroUI v3 API Audit & Bump

**Goal**: HeroUI is uniformly on 3.2.1 with all component code on the compound-component API — a single-version tree with no half-migrated coexistence.
**Depends on**: Phase 77 (Linear tokens stable on the current HeroUI baseline, so a visual break is attributable to v3, not tokens)
**Requirements**: HEROUI-01, HEROUI-02
**Success Criteria** (what must be TRUE):

1. `@heroui/react` and `@heroui/styles` resolve to 3.2.1 with no v2 package resolving anywhere in the shipped tree.
2. Every HeroUI component previously on the old flat-prop API renders via the compound-component pattern, verified against the Phase 75 inventory (zero remaining flat-prop hits).
3. All routes that use HeroUI components render without regression in both EN and AR after the bump.
   **Plans**: TBD
   **UI hint**: yes

### Phase 79: Aceternity Removal

**Goal**: Aceternity is fully gone — its 8 form components rebuilt on HeroUI v3/Radix with their accessibility and validation contracts provably preserved, and its registry entry removed.
**Depends on**: Phase 78 (rebuilds target the final HeroUI v3 primitives)
**Requirements**: ACET-01, ACET-02
**Success Criteria** (what must be TRUE):

1. Each of the 8 rebuilt form components announces validation errors (`role="alert"`/`aria-live`) on invalid submit in both EN and AR, matching the Phase 75 captured contract.
2. Keyboard focus order and `aria-invalid`/`aria-describedby` are preserved on every rebuilt component (verified by keyboard traversal + axe, not visual diff).
3. The `@aceternity-pro` registry entry is removed from `components.json` and no Aceternity import remains (the inverted `no-restricted-imports` ban stays green).
   **Plans**: TBD
   **UI hint**: yes

### Phase 80: Full-Route Visual + A11y Verification & Smoke Suite

**Goal**: The whole migration is proven correct across every route and all four axes, with the RTL/portal/FOUC guarantees locked into CI so they cannot silently regress.
**Depends on**: Phase 79 (all visual and component work complete)
**Requirements**: VERIFY-01, VERIFY-02, FOUC-02
**Success Criteria** (what must be TRUE):

1. All routes are re-compared (EN+AR × dark+light) against the pre-token baseline captured in Phase 77, and every diff is either an intended Linear change (human-reviewed) or fixed — no unexplained regressions.
2. An axe-core sweep passes across all four axes (dark/light × LTR/RTL) with no new violations versus the pre-migration state.
3. CI runs portal-animation RTL smoke tests (Popover/Tooltip/Dropdown/Sheet/drawer open from the correct edge in AR) plus Calendar/Pagination/Sidebar RTL smoke tests, and they gate the build.
   **Plans**: TBD
   **UI hint**: yes

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
| 68-74 | v7.0 | 49/49 | Shipped | 2026-06-24 |
| 75 | v8.0 | 0/? | Not started | - |
| 76 | v8.0 | 0/? | Not started | - |
| 77 | v8.0 | 0/? | Not started | - |
| 78 | v8.0 | 0/? | Not started | - |
| 79 | v8.0 | 0/? | Not started | - |
| 80 | v8.0 | 0/? | Not started | - |

<!-- gsd:progress:end -->

---

_Roadmap last updated: 2026-07-01 — v8.0 Linear Design System Migration scoped (Phases 75-80, 23 requirements). Sequencing hard-locked: audit → RTL bridge → tokens → HeroUI v3 → Aceternity removal → verification. VERIFY-01 baseline captured as a gating step of Phase 77; re-compared in Phase 80._
