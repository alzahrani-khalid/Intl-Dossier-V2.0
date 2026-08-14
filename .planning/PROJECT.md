# Intl-Dossier

## What This Is

A diplomatic dossier management system for tracking countries, organizations, forums, engagements, topics, working groups, persons, and elected officials. Built with React 19 + TanStack Router/Query, Express backend, Supabase (PostgreSQL + Auth + Realtime), AI briefing generation, and bilingual Arabic/English support. Used by international affairs professionals to manage diplomatic relationships, work items, and intelligence signals.

## Core Value

Unified intelligence management for diplomatic operations — every relationship, commitment, and signal tracked in one secure, bilingual platform.

## Current State

**Closed PARTIAL: v9.0 Platform Completion & Live Verification — 3 of 6 phases (2026-08-15).** Merged to `main` via PR #98 (`e990ed84`) with all 8 required checks green. Delivered: the three honest-disabled data-entry features resolved (MoU create, user-management routes, ConsistencyPanel retired via ADR-008); the four Linear affordances F23–F26 (peek panel + cross-page paging, split Filter/Display popovers with live counts, ⌘K audit, rich empty states) with operator render sign-off; and every edge function migrated off the deprecated wildcard CORS onto the origin-validated helper (36/36, SC-4 repo-wide grep = 0, verdict signed). SEC-01 closed; 6 tickmarkr tasks burned down a11y and mixed-import debt. **Not delivered, carried to v10.0:** P88-02 credential rotation (operator-only; gates CI-01 + CI-05), CI-01/02/04/05, the owed ORCH-2 a11y green proof, LIVE-01/02/03 (hardware-gated), the entry-bundle diet, VISUAL-DEBT-01. A six-lane live-app audit at close (190 routes, EN + AR) found **144 findings including 19 ship-blockers** — no logout anywhere in the app, 133 of 303 edge functions not validating JWTs, `/settings` never having saved — recorded at `.planning/audits/live-audit-2026-08-15/INDEX.md` and forming the scope of v10.0. See `milestones/v9.0-ROADMAP.md`.

**Shipped: v8.1 Linear Design Refinement — all 5 phases (2026-07-05).** The corrective + taste pass over the v8.0 Linear migration, merged to main via PR #96 (`46e259fb`): visible audit bugs fixed (kanban four-column fit @1400/1024 LTR+RTL, dup settings header, redundant calendar button, raw enum pills, KPI wrap); date/number formatting centralized on `lib/format-date` (day-first no-comma + GST, ~66 sites migrated, AR locked to Latin digits via `toFormatLocale('ar') → 'ar-u-nu-latn'`, `toArDigits` deleted, CI date-format guard); token debt consolidated (shared `--chart-1..8` palette, Tailwind literals → `@theme`, banned shadows/radii/gradients stripped, `var(--row-h)`, emoji → lucide, 20 dead files deleted, carve-outs byte-identical); marketing voice removed from four `en` i18n namespaces (`ar` mirrored); and six user-signed-off Linear taste calls landed (F16–F21: kanban overdue chip + stage glyphs, neutral active-nav fill, settings single-nav + back-to-app, true sentence-case form labels, grouped sub-nav) with a human render-parity sign-off across dark/light × EN/AR. All 24 v1 requirements complete; Phase-85 verification passed 6/6. See `milestones/v8.1-ROADMAP.md`.

**Shipped: v8.0 Linear Design System Migration — all 6 phases (2026-07-04).** Retired the four-direction Bureau/Chancery/Situation/Ministerial design language (and the accent-hue axis) for a single **Linear** visual direction — a re-skin of the existing OKLCH token engine, not a rebuild. Dark-canonical + derived-light Linear tokens wired bootstrap→tokens→primitives with the three-copy byte-match CI guard (`directions.ts` ↔ `bootstrap.js` ↔ `index.css :root`) and dual-layer `id.dir`→linear coercion so no legacy profile loses first paint (P77); the RTL direction source consolidated into one owner bridged into Radix, shadcn `migrate rtl` applied once, duplicate-`rtl:` CI guard (P76); HeroUI bumped 3.0.5 → 3.2.1 (P78); Aceternity fully removed — 1 live component (SearchableSelect) rebuilt on HeroUI v3/Radix preserving its RHF/ARIA/keyboard contract + 7 dead deleted (P79). Proven correct by a human-approved full-route visual re-compare (43 baselines, EN+AR × dark+light, 0 regressions), an honest recorded axe baseline across all 4 axes, and RTL portal/component smoke tests wired into CI (P80). Design source-of-truth (DESIGN.md + 3× CLAUDE.md) repointed off Bureau to Linear (DOC-01). Audit passed 24/24 requirements, 6/6 phases; `threats_open: 0`. See `milestones/v8.0-ROADMAP.md` + `milestones/v8.0-MILESTONE-AUDIT.md`.

**Shipped: v7.0 Intelligence Engine — all 7 phases (2026-06-24).** Turned dossiers into a sovereign, Arabic-first intelligence layer: signals triage, clearance-filtered digests + multi-channel alerts (in-app / on-prem SMTP / webhook), a clearance-aware analytic graph (Cmd+K + Network panel), and an on-prem agentic copilot (Mastra + CopilotKit/AG-UI over vLLM/Gemma-4-12B + TEI) that reads and HITL-writes under the caller's JWT — RLS enforcing `sensitivity_level <= clearance` so the agent is incapable by construction of reading above the caller's clearance. AnythingLLM fully retired from the critical path. Audit `gaps_found` with **zero code blockers** (keystone uniform across 11 agent tools, 18/18 cross-phase wirings intact); GAP-1 (digest clearance watermark) fixed at close; EVAL-01/02/03 + AGENT/INFRA live verification carried as deploy-gated deferred items pending the on-prem GPU/TEI stack. 213 commits / 11 days. See `milestones/v7.0-ROADMAP.md` + `milestones/v7.0-MILESTONE-AUDIT.md`.

**Shipped: v6.6 Dossier Workflow Completion — all 6 phases (2026-06-13).** Phase 67 (final) wired per-type Engagements tabs to canonical tables: an org Hosted-engagements section on engagement_dossiers.host_organization_id, a person/EO Participation section on engagement_participants (with the get_person_full recent_engagements RPC repointed off the dead person_engagements plane and the wizard created_by RLS write-drop fixed), and deleted ~42 dead legacy \*DossierDetail files (~9,200 lines). Live-verified on staging (seed→observe→restore, EN+AR), exhaustively code-reviewed (0 critical; 2 warnings + grant least-privilege hardening fixed). Shipped via PRs #56-#60; milestone archived.

**Shipped:** v6.5 Escalated Backlog Hardening (2026-06-11) — Phases 60-61 complete. Phase 60 restored schema/type truth: `database.types.ts` regenerated byte-identical (frontend+backend) from staging, all live-only SQL committed as forward migrations (unified work stack, 4 SLA dashboard RPCs, event_details view, pending_role_approvals/position_delegations/word_assistant_logs), and a CI smoke test now requires every edge-fn `.from`/`.rpc` reference to exist in generated types. Phase 61 (delivered by adversarial security quick task 260610-fkn, merged via PR #54) closed the four known security holes: activity_stream actor binding, briefing-books HTML escaping, token ExportDialog deletion, and admin role gating unified on `public.users.role` (fail-closed `requireAdmin` on all 9 admin routes, UAT-verified live). In parallel, a 17-round dossier-workflow inspection loop (quick 260608-c9b) fixed the positions-attach 4-bug stack, shared documents embed, backend auth 401, persons RLS, and ~30 navigation/i18n items; its bucket-B residue seeds v6.6 (`.planning/dossier-workflow-backlog-phases-2026-06-11.md`).

<details>
<summary>Shipped milestones</summary>

- v8.1 Linear Design Refinement (2026-07-05): corrective + taste pass over the v8.0 Linear migration — visible audit bugs fixed, date/number formatting centralized on `lib/format-date` with the AR Latin-digit policy + CI guard, token debt consolidated (chart palette, `@theme` utils, shadows/radii/gradients, `var(--row-h)`, emoji → lucide), marketing voice removed from `en` i18n (ar mirrored), and six user-signed-off Linear taste calls (F16–F21) landed with human render-parity sign-off — 5 phases / 22 plans, all 24 v1 requirements complete, merged via PR #96; see `.planning/milestones/v8.1-ROADMAP.md`
- v8.0 Linear Design System Migration (2026-07-04): single Linear visual direction replacing the 4 Bureau/Chancery/Situation/Ministerial variants + hue axis (re-skin of the existing OKLCH token engine, dual-layer `id.dir`→linear coercion, three-copy byte-match guard), consolidated shadcn RTL infra bridged into Radix, HeroUI 3.0.5 → 3.2.1, Aceternity fully removed (SearchableSelect rebuilt + 7 dead deleted), full-route visual re-compare (human-approved, 0 regressions) + honest axe baseline + RTL smoke CI — 6 phases / 32 plans. Audit passed 24/24; see `.planning/milestones/v8.0-ROADMAP.md` and `.planning/milestones/v8.0-MILESTONE-AUDIT.md`
- v7.0 Intelligence Engine (2026-06-24): signals triage + clearance-filtered digests/alerts + analytic graph + on-prem agentic copilot (Mastra + CopilotKit/AG-UI over vLLM/Gemma-4-12B + TEI; JWT-keystone reads + HITL writes + generative token-bound cards), AnythingLLM retired from the critical path — 7 phases / 49 plans. Audit `gaps_found`, 0 code blockers; EVAL-01/02/03 + live AGENT/INFRA verification deploy-gated — see `.planning/milestones/v7.0-ROADMAP.md` and `.planning/milestones/v7.0-MILESTONE-AUDIT.md`
- v6.5 Escalated Backlog Hardening (2026-06-11): schema/type truth restored (byte-identical regenerated types + forward migrations + edge-fn CI smoke test), four security holes closed (activity_stream RLS, briefing-books XSS, token ExportDialog, unified admin role gating), 17-round dossier-workflow inspection loop merged — see `.planning/milestones/v6.5-ROADMAP.md`
- v6.4 Stabilization & Carryover Sweep (2026-05-27): DesignV2 merged to `main` + 8-context branch protection (smoke-proven `BLOCKED`), `countries` RLS fail closed, last typed shim retired, all 5 Phase 52 deviations closed, Tier-C design-token backlog fully cleared (271 → 0), cosmetic + CI paperwork reconciled — see `.planning/milestones/v6.4-ROADMAP.md` and `.planning/milestones/v6.4-MILESTONE-AUDIT.md`
- v6.3 Carryover Sweep & v7.0 Prep (2026-05-17): Test infra repaired, design-token compliance gate live (D-05 selectors at `error`, 50 Tier-A swaps + 271 Tier-C suppressed), HeroUI v3 Kanban migration (shared `@dnd-kit/core` primitive, kibo-ui + tunnel-rat purged), React vendor 349 → 285 KB, phase-base tags annotated + SSH-signed, Intelligence Engine schema groundwork (`intelligence_event` + `intelligence_digest` + polymorphic junction + `signal_source_type` enum) — see `.planning/milestones/v6.3-ROADMAP.md` and `.planning/milestones/v6.3-MILESTONE-AUDIT.md`
- v6.2 Type-Check, Lint & Bundle Reset (2026-05-12): TS errors 2078 → 0, lint problems 727 → 0, Aceternity purge + primitive cascade inversion, Initial-route ceiling 517 → 450 KB with 3 `React.lazy()` conversions, three PR-blocking gates restored on `main` — see `.planning/milestones/v6.2-ROADMAP.md` and `.planning/milestones/v6.2-MILESTONE-AUDIT.md`
- v6.1 Hardening & Reconciliation (2026-05-08): v6.0 verification backfill, archive sync, size-limit CI gate repair, WR-02..WR-06 closure, Storybook deferral ADR, intelligence digest schema/seed closure, VIP ISO projection, and visual baseline regeneration for Phases 38/40/41
- v6.0 Design System Adoption (2026-05-06): OKLCH token engine (4 directions × mode × hue × density), Tweaks drawer, self-hosted typography stack, new shell chrome, signature visual primitives, verbatim dashboard, kanban + calendar reskin, 7 list pages, 720px dossier drawer, 5 remaining pages reskinned, hard cross-phase QA gate (axe + responsive + keyboard + focus-outline) — see `.planning/milestones/v6.0-ROADMAP.md` and `.planning/milestones/v6.0-MILESTONE-AUDIT.md`
- v5.0 Dossier Creation UX (2026-04-18): 8 per-type creation wizards, unified `CreateDossierHub`, legacy wizard removed, person-native identity refactor
- v4.1 Post-Launch Fixes (2026-04-12): 87-finding audit, semantic colors, PageHeader unification, 100% Arabic parity
- v4.0 Live Operations (2026-04-09): Production deployment, notifications (in-app + email + push), seed data, E2E testing
- v3.0 Connected Workflow (2026-04-06): Hub-and-spoke architecture, engagement lifecycle, Operations Hub, DossierShell
- v2.0 Production Quality (2026-03-28): 7-phase hardening (toolchain, security, RTL, responsive, architecture, performance)

</details>

## Current Milestone: v10.0 Trust & Correctness

**Goal:** Close the gap between what the app appears to do and what it actually does — every failure admits it failed, every advertised write path works, and every surface tells the truth about its data.

**Scope input:** `.planning/audits/live-audit-2026-08-15/INDEX.md` — a six-lane live-app audit (190 route/tab URLs, EN + AR, 370 screenshots) producing **144 findings, 19 ship-blockers**. Findings marked **[V]** were independently re-verified against source or the live database.

**Governing pattern:** _failure is rendered as emptiness._ A request fails (401/404/500/malformed) and the UI shows a calm empty state, so the user cannot tell "nothing here" from "this broke". The sharpest instance: `/admin/field-permissions` reports "0 Permissions · No permission rules configured" while the database holds 19 active rules. This is one fix repeated, not N bugs.

**Target outcomes:**

- **AUTH** — a user can log out (no logout exists anywhere today); edge functions validate JWTs (133 of 303 do not); session invalidation redirects instead of decaying into a half-authenticated ghost page.
- **TRUST** — repositories stop swallowing failures, so the `isError` branches that already exist stop being dead code; bad IDs render not-found, not "check your connection".
- **WRITE** — after-action records can be created, intake can be submitted, kanban accepts commitment drags, `/settings` saves (it never has), reports generate and can be scheduled.
- **DEAD** — no surface lies: `/search` stops throwing, `/analytics` stops drawing fabricated charts over a backend that does not exist, dead routes are fixed or deleted.
- **COUNT / NAV** — one source of truth for work counts; nothing built stays unreachable (Elected Officials, the Digests tab, the whole `/settings/*` subtree).
- **COPY / AR** — no DB enum, i18n key, or seed instruction ships as user copy; one Arabic glossary and localized dates. RTL layout infrastructure is already sound and is explicitly not re-done.
- **DATA / DBSEC** — staging stops showing test residue as diplomatic records; the 33 RLS-bypassing views are resolved against 207 frontend files that rely on RLS alone.
- **CARRY** — v9.0's unfinished items, including the owed ORCH-2 a11y green proof and the entry-bundle diet.

**Requirements:** 54 across 12 groups — see `.planning/REQUIREMENTS.md`.

**Explicitly out of scope** (verified correct, will not be re-opened): dossier overview tabs, `devModeGuard`-gated demo routes, design-token discipline, RTL layout infrastructure.

## Last Milestone: v9.0 Platform Completion & Live Verification

**Status: CLOSED PARTIAL 2026-08-15** — 6 phases (86–91), 3 complete; 54/57 plans + 6 tickmarkr tasks; 251 commits, 946 files. Merged to `main` via PR #98 (`e990ed84`), all 8 required checks green. Closed deliberately at 3/6 rather than held open; every unfinished item was carried into v10.0.

**Delivered:** P86 resolved the three honest-disabled data-entry features (MoU create, user-management routes, ConsistencyPanel retired via ADR-008). P87 landed the four Linear affordances F23–F26 (peek panel + cross-page paging, split Filter/Display popovers with live counts, ⌘K audit, rich empty states) with operator render sign-off. P90 migrated every edge function off wildcard CORS onto the origin-validated helper (36/36, SC-4 grep = 0, verdict signed). P88 closed SEC-01; P89 burned down a11y and import debt across 6 tickmarkr tasks.

**Not delivered — carried to v10.0:** P88-02 credential rotation (operator-only; gates CI-01 + CI-05), CI-01/02/04/05, the owed ORCH-2 a11y green proof, LIVE-01/02/03 (hardware-gated on an undecided GPU host), the entry-bundle diet, and VISUAL-DEBT-01.

**Audit at close:** a six-lane live-app sweep (190 routes, EN + AR, 370 screenshots) found **144 findings, 19 ship-blockers** — no logout anywhere in the app, 133 of 303 edge functions not validating JWTs, `/settings` never having saved, after-action records uncreatable. Full record: `.planning/audits/live-audit-2026-08-15/INDEX.md`. This is the substance of v10.0.

<details>
<summary>Previously: v8.1 Linear Design Refinement (shipped 2026-07-05)</summary>

**Status: SHIPPED 2026-07-05** — 5 phases (81–85), 22 plans, 39 tasks; merged to main via PR #96 (merge `46e259fb`). Phase-85 verification passed (6/6) + human render-parity sign-off across dark/light × EN/AR; all 24 v1 requirements complete. No milestone-level audit (corrective/refinement milestone — phase verification + human sign-off are the ship proof).

**Goal:** Correct and refine the freshly-migrated Linear design system — visible bugs, systematized date/number formatting, token-debt consolidation, de-marketed copy, and six user-signed-off Linear taste calls (F16–F21) — with zero regressions across dark-canonical + light and EN/LTR + AR/RTL.

**Delivered:** P81 fixed the visible audit bugs (kanban four-column fit @1400/1024 in LTR+RTL, duplicate settings header, redundant calendar button, raw enum pills, KPI wrap); P82 centralized date/time on `lib/format-date` (day-first no-comma + GST), migrated ~66 ad-hoc sites, locked the AR Latin-digit policy (`toFormatLocale('ar') → 'ar-u-nu-latn'`), deleted `toArDigits`, added a CI-blocking date-format guard; P83 consolidated token debt (shared `--chart-1..8` palette, Tailwind literals → `@theme`, banned shadows/radii/gradients stripped, `var(--row-h)`, emoji → lucide, 20 dead files deleted, carve-outs byte-identical); P84 removed marketing voice from four `en` i18n namespaces (`ar` mirrored); P85 landed the six taste calls (kanban overdue chip + stage glyphs, neutral active-nav fill, settings single-nav + back-to-app, true sentence-case labels, grouped sub-nav).

**Known deferred at close (non-blocking, pre-existing):** 57 open artifacts acknowledged — 48 historical "missing" quick-tasks, 6 gaps from the already-archived v7.0 phases (68–74), 1 stale Phase-81 UAT flag; plus the carried v8.0 items (`test-rtl-smokes` branch-protection promotion, IN-04 UserPicker interpolation, `TEST_USER_PASSWORD` credential-hygiene sweep).

<details>
<summary>Prior milestone: v8.0 Linear Design System Migration (shipped 2026-07-04)</summary>

**Status: SHIPPED 2026-07-04** — 6 phases (75–80), 32 plans. Audit **passed** 24/24 requirements, 6/6 phases, `threats_open: 0`. Retired the 4-direction Bureau/Chancery/Situation/Ministerial design language + accent-hue axis for a single Linear visual direction (a re-skin of the OKLCH token engine, not a rebuild), consolidated shadcn RTL infrastructure bridged into Radix, HeroUI 3.0.5 → 3.2.1, Aceternity fully removed (SearchableSelect rebuilt on HeroUI v3/Radix + 7 dead deleted). Proven by a human-approved 43-baseline full-route visual re-compare (0 regressions) + an honest 4-axis axe baseline + RTL smoke CI; design source-of-truth repointed off Bureau. See `milestones/v8.0-ROADMAP.md` + `milestones/v8.0-MILESTONE-AUDIT.md`.

</details>

</details>

## Requirements

### Validated

- ✓ **v8.1 Linear Design Refinement (2026-07-05)** — all 24 v1 requirements validated across 5 phases: BUG-01..05 (visible audit bugs — kanban 4-column fit, dup settings header, dup calendar button, raw enum pills, KPI wrap), FMT-01..04 (centralized `lib/format-date` day-first + GST, ~66 sites migrated, CI date-format guard, AR Latin-digit policy), DEBT-01..08 (chart-palette tokens, `@theme` utils, banned shadows/radii/gradients stripped, `var(--row-h)`, emoji → lucide, dead-code deletion, carve-outs intact), COPY-01 (marketing voice removed from four `en` namespaces, `ar` mirrored), TASTE-01..06 (the six F16–F21 taste calls — kanban overdue chip + stage glyphs, neutral active-nav, settings single-nav + back-to-app, sentence-case labels, grouped sub-nav; human render-parity approved). Phase-85 verification passed 6/6; merged via PR #96. See `milestones/v8.1-REQUIREMENTS.md`.
- ✓ **v8.0 Linear Design System Migration (2026-07-04)** — all 24 requirements validated across 6 phases: AUDIT-01..04 (component classification + HeroUI v3 compound-API confirmation + v3-removed zero-imports + Aceternity behavioral contracts), RTLB-01/02 + SRTL-01/02/03 (single-owner RTL direction bridged into Radix, one-shot `migrate rtl`, duplicate-`rtl:` guard, Calendar/Pagination/Sidebar AR-verified), TOKEN-01..06 + FOUC-01 (dark+light Linear tokens, byte-match guard, AA status palette, 4-direction+hue switcher retired with `id.dir`→linear coercion, Inter/JetBrains + Tajawal preserved, re-skinned primitives), DOC-01 (source-of-truth off Bureau), HEROUI-01/02 (3.0.5 → 3.2.1), ACET-01/02 (Aceternity removed — SearchableSelect rebuilt + 7 dead deleted, registry entry gone), VERIFY-01/02 + FOUC-02 (43-baseline visual re-compare human-approved with 0 regressions, 4-axis axe baseline, RTL smoke CI). Audit passed 24/24, 6/6 phases; `threats_open: 0`. See `milestones/v8.0-REQUIREMENTS.md`.
- ✓ **v7.0 Intelligence Engine (2026-06-24)** — 38/41 requirements validated: REMED-01..06, SIGNAL-01..06, DIGEST-01..04, ALERT-01..04, GRAPH-01..04, AGENT-01..06, INFRA-01..03, GENUI-01..04, EVAL-04 (AnythingLLM retired). EVAL-01/02/03 (live CI eval thresholds) + AGENT/INFRA live verification remain deploy-gated on the on-prem GPU/TEI stack — see `milestones/v7.0-REQUIREMENTS.md`.
- ✓ 8 dossier types with CRUD — existing
- ✓ Dossier-to-dossier relationships and polymorphic documents — existing
- ✓ Unified work items (tasks, commitments, intake) with Kanban workflow — existing
- ✓ Dashboard with charts, widgets, and export — existing
- ✓ AI briefing generation (Anthropic + OpenAI + local embeddings) — existing
- ✓ Bilingual i18n (Arabic/English) with i18next — existing
- ✓ Authentication via Supabase Auth with JWT middleware — existing
- ✓ Realtime subscriptions via Supabase Realtime — existing
- ✓ Network graph visualization (React Flow) — existing
- ✓ Unified calendar with 4 event types — existing
- ✓ Document management (upload, OCR, PDF generation) — existing
- ✓ HeroUI v3 drop-in replacement with shadcn re-export pattern — existing
- ✓ Code splitting with React.lazy() on all heavy routes — existing
- ✓ Rate limiting consolidated to single middleware — existing
- ✓ Error tracking via Sentry (frontend + backend) — existing
- ✓ Dead code removal and unified toolchain — v2.0 Phase 1
- ✓ Consistent naming conventions with ESLint enforcement — v2.0 Phase 2
- ✓ Security hardening (auth, RBAC, CSP, Zod, RLS) — v2.0 Phase 3
- ✓ RTL/LTR theming consistency — v2.0 Phase 4
- ✓ Mobile/tablet responsiveness — v2.0 Phase 5
- ✓ Domain repository architecture consolidation — v2.0 Phase 6
- ✓ Performance optimization (bundle, query, render) — v2.0 Phase 7

- ✓ Navigation & route consolidation (3-group sidebar, mobile tab bar, Cmd+K, route dedup) — v3.0 Phase 8
- ✓ Engagement lifecycle engine (6 stages, flexible transitions, audit logging, forum sessions) — v3.0 Phase 9
- ✓ Operations Hub dashboard (5 attention zones, role-adaptive, Supabase Realtime) — v3.0 Phase 10
- ✓ Engagement workspace (lifecycle stepper, kanban, calendar, docs, audit tabs) — v3.0 Phase 11
- ✓ Enriched dossier pages (DossierShell, RelationshipSidebar, 8 types with tabs, Elected Officials domain) — v3.0 Phase 12
- ✓ Feature absorption (analytics, AI, graph, polling, export absorbed; Cmd+K replaces search) — v3.0 Phase 13

- ✓ Production deployment (HTTPS, CI/CD, monitoring, backups, rollback) — v4.0 Phase 14
- ✓ In-app notification system (bell, center, triggers, preferences, BullMQ) — v4.0 Phases 15-16
- ✓ Email notifications (Resend alerts, digest scheduling) — v4.0 Phase 16
- ✓ Browser push notifications (VAPID, soft-ask opt-in) — v4.0 Phase 16
- ✓ Realistic seed data and first-run experience — v4.0 Phase 17
- ✓ Playwright E2E test suite with CI integration — v4.0 Phase 18
- ✓ Tech debt cleanup (typed router params, roadmap auto-sync) — v4.0 Phase 19

- ✓ Shared compositional wizard infrastructure (`useCreateDossierWizard`, `CreateWizardShell`, per-type Zod schemas) — v5.0 Phase 26
- ✓ Type-specific creation wizards for all 8 dossier types — v5.0 Phases 27–30
- ✓ Direct creation entry from each type's list page (context-aware FAB) — v5.0 Phase 31
- ✓ Relationship linking during creation (participants, organizing bodies, parent bodies) — v5.0 Phase 29
- ✓ Type-specific guidance and contextual hints (bilingual) — v5.0 Phase 31
- ✓ Smart defaults per type (status, sensitivity, optional fields) — v5.0 Phase 26
- ✓ Elected official creation path (Person variant with office/term/constituency) — v5.0 Phase 30
- ✓ Unified `CreateDossierHub` at `/dossiers/create` + legacy wizard removal — v5.0 Phase 31
- ✓ Person-native identity fields (honorific, split names, nationality, DOB, gender) — v5.0 Phase 32

- ✓ OKLCH token engine: 4 directions × light/dark × accent hue × density, Tailwind v4 `@theme` + HeroUI v3 semantic bridge — v6.0 Phase 33 (TOKEN-01..06)
- ✓ Tweaks drawer with `localStorage` persistence + `/themes` route removal — v6.0 Phase 34 (THEME-01..04)
- ✓ Per-direction self-hosted typography stack with Tajawal RTL cascade, zero Google Fonts CDN — v6.0 Phase 35 (TYPO-01..04)
- ✓ 256px sidebar + 56px topbar + direction-specific classification element + responsive overlay-drawer + GASTAT brand mark — v6.0 Phase 36 (SHELL-01..05)
- ✓ Signature visual primitives: GlobeLoader / GlobeSpinner / FullscreenLoader / DossierGlyph (24 flags) / Sparkline / Donut — v6.0 Phase 37 (VIZ-01..05)
- ✓ Dashboard rebuilt pixel-exact to reference, 8 widgets wired to real domain hooks, zero mock data — v6.0 Phase 38 (DASH-01..09)
- ✓ Kanban kcards (overdue inline-start border, done opacity) + 7×5 calendar grid with token-driven event pills — v6.0 Phase 39 (BOARD-01..03)
- ✓ Seven list pages on shared `ListPageShell` + `GenericListPage` with RTL chevron, filter pills, GlobeSpinner load-more — v6.0 Phase 40 (LIST-01..04)
- ✓ 720px dossier drawer with focus trap + ESC + RTL slide flip + ≤640px full-screen — v6.0 Phase 41 (DRAWER-01..03)
- ✓ Briefs / After-actions / Tasks / Activity / Settings pages reskinned to handoff anatomy with WCAG AA bidirectional — v6.0 Phase 42 (PAGE-01..05)
- ✓ Hard cross-phase QA gate: zero `eslint-plugin-rtl-friendly` violations, axe-core 30/30, responsive 60/60, keyboard 26 + 4 acknowledged-skip, focus-outline 8/8, `docs/rtl-icons.md` — v6.0 Phase 43 (QA-01..04)
- ✓ v6.1 documentation/toolchain reconciliation: v6.0 verification backfill, archive sync, size-limit CI gate repair, WR-02..WR-06 closure, Storybook deferral ADR — v6.1 Phase 44 (DOC-01..08, TOOL-01..03, LINT-01..05, STORY-01)
- ✓ v6.1 schema and seed closure: intelligence_digest, dashboard digest hook, VIP ISO join, staging MCP apply, and seed-dependent drawer specs — v6.1 Phase 45 (DATA-01..04)
- ✓ v6.1 visual baseline regeneration: Phase 38 widget baselines, Phase 40 EN/AR list-page baselines, Phase 41 drawer baselines, human review, and focused CI replay — v6.1 Phase 46 (VIS-01..04)

- ✓ Frontend `pnpm type-check` exits 0 (1580 errors → 0) with zero `@ts-ignore` / `@ts-expect-error` added — v6.2 Phase 47 (TYPE-01, TYPE-04 frontend half)
- ✓ Backend `pnpm type-check` exits 0 (498 errors → 0) with zero suppression escape hatches added — v6.2 Phase 47 (TYPE-02, TYPE-04 backend half)
- ✓ `type-check` restored as PR-blocking branch-protection context on `main` — v6.2 Phase 47 (TYPE-03)
- ✓ Frontend `pnpm lint` exits 0 (52 errors + 671 warnings → 0); 0 net-new `eslint-disable` directives phase-wide — v6.2 Phase 48 (LINT-06)
- ✓ Backend `pnpm lint` exits 0 (3 errors + 1 warning → 0) — v6.2 Phase 48 (LINT-07)
- ✓ `frontend/eslint.config.js` shadow deleted; Aceternity references purged; `no-restricted-imports` inverted to ban Aceternity + Kibo UI per CLAUDE.md primitive cascade (HeroUI v3 → Radix → custom) — v6.2 Phase 48 (LINT-08)
- ✓ `Lint` restored as PR-blocking branch-protection context on `main` — v6.2 Phase 48 (LINT-09)
- ✓ `frontend/.size-limit.json` Initial-route ceiling 517 → 450 KB; static-prim 64 → 12 KB; documented `frontend/docs/bundle-budget.md` — v6.2 Phase 49 (BUNDLE-01)
- ✓ 3 audit-driven `React.lazy()` / dynamic-import conversions (`PositionEditor`, `WorldMapVisualization`, `useExportData/exceljs`) with D-13 Suspense fallbacks — v6.2 Phase 49 (BUNDLE-02)
- ✓ `Bundle Size Check (size-limit)` restored as PR-blocking branch-protection context (verbatim casing); 2 smoke PRs verified `BLOCKED` — v6.2 Phase 49 (BUNDLE-03)
- ✓ Vendor super-chunk audited; heroui/sentry/dnd sub-vendor decomposition with documented ceilings — v6.2 Phase 49 (BUNDLE-04)

- ✓ `vi.mock("react-i18next")` factory uses `vi.importActual` + spread so module-eval succeeds for all consumers; 4 wizard tests green; setup contracts documented in frontend + backend test-setup docs — v6.3 Phase 50 (TEST-01..04)
- ✓ ESLint D-05 selectors at `error` severity workspace-wide ban raw hex + Tailwind palette literals in `frontend/src/`; 50 Tier-A files swapped to tokens; 271 Tier-C suppressed per-Literal; PR-blocking via D-09 fold into Phase 48 `Lint` context — v6.3 Phase 51 (DESIGN-01..04)
- ✓ HeroUI v3 Kanban migration: shared `frontend/src/components/kanban/*` primitive on `@dnd-kit/core`; TasksTab migrated; `EngagementKanbanDialog` + `EngagementDossierPage` deleted (KANBAN-02 satisfied-by-deletion); `kibo-ui` + `tunnel-rat` purged; EN+AR baselines committed — v6.3 Phase 52 (KANBAN-01..04)
- ✓ React vendor ceiling 349 → 285 KB gz (measured 279.42 kB) per D-03 min rule — v6.3 Phase 53 (BUNDLE-05)
- ✓ `phase-47/48/49-base` re-issued annotated + SSH-signed; `git tag -v` exits 0 with `Good "git" signature`; origin SHAs match local — v6.3 Phase 53 (BUNDLE-06)
- ✓ CLAUDE.md Node engine note aligned to `Node.js 22.13.0+` at L84 + L483 to match `package.json` engines — v6.3 Phase 53 (BUNDLE-07)
- ✓ `intelligence_event` table + indexes + tenant-scoped RLS on staging via Supabase MCP — v6.3 Phase 54 (INTEL-01)
- ✓ New `intelligence_digest` table on staging (prior Phase-45 dashboard table renamed to `dashboard_digest` to free the canonical name) + indexes + RLS — v6.3 Phase 54 (INTEL-02)
- ✓ `intelligence_event_dossiers` polymorphic junction with 7-value `dossier_type` CHECK + EXISTS-via-parent RLS + CASCADE — v6.3 Phase 54 (INTEL-03)
- ✓ `signal_source_type` enum (`publication`, `feed`, `human_entered`, `ai_generated`) applied to `intelligence_event.source_type` — v6.3 Phase 54 (INTEL-04)
- ✓ `database.types.ts` regenerated; byte-identical across backend + frontend workspaces; dual `pnpm type-check` exit 0; `rls-audit.test.ts` sensitiveTables extended — v6.3 Phase 54 (INTEL-05)

- ✓ DesignV2 merged to `main` with all v6.3 quality gates intact; `main` branch protection at 8 required CI contexts (smoke PR #18 `BLOCKED` proof) — v6.4 Phase 55 (MERGE-01, MERGE-02)
- ✓ `countries` RLS pre-existing fail closed (`globalReferenceTables` tier); last v6.2-era typed shim (`useStakeholderInteractionMutations`) retired at source — v6.4 Phase 56 (RLS-01, TYPE-05)
- ✓ All 5 Phase 52 deviations closed: mobile-DnD scope-out ADR + `<select>` fallback, `@dnd-kit/core` ESLint ban + regression test, LTR/RTL baselines md5-distinct, live tasks-tab Playwright run — v6.4 Phase 57 (DEVIATE-01..04)
- ✓ Tier-C design-token suppression full clear: 271 suppressions / 2336 AST nodes → 0, waiver removed from `eslint.config.mjs`, lint stays 0 at `error` severity — v6.4 Phase 58 (TOKEN-01, TOKEN-02)
- ✓ Cosmetic + CI gap closure: Phase 53 wording refreshed, doc drift corrected, bad-design-token + bad-vi-mock wired as positive-failure CI jobs — v6.4 Phase 59 (POLISH-01..04)

- ✓ Generated types/migrations/edge-fn SQL agree with live staging DB; types byte-identical across workspaces — v6.5 Phase 60 (Backlog P1)
- ✓ CI smoke test: edge-fn `.from`/`.rpc` references must exist in generated types — v6.5 Phase 60
- ✓ Four security holes closed: activity_stream actor-bound RLS, briefing-books HTML escaping, token ExportDialog deleted, admin role gating unified on `public.users.role` — v6.5 Phase 61 (Backlog P2, delivered by quick 260610-fkn)

- ✓ Export/briefing pack reconciled to live schema with honest export contract, deployed — v6.6 Phase 62
- ✓ Relationship graph route with bidirectional (incoming + outgoing) traversal + per-type node navigation — v6.6 Phase 63
- ✓ "New Position" from a dossier: two-step create→`applies_to` link + positions INSERT RLS drift closed — v6.6 Phase 64
- ✓ Engagement Positions tab on canonical `position_dossier_links`; all 9 round-15 inert CTAs resolved (5 wired, 4 removed) — v6.6 Phase 65
- ✓ Overview error contract (empty ≠ failed, `role="alert"` across 19 cards + drawer) + timeline cross-link integrity (CDP forced-error verified) — v6.6 Phase 66
- ✓ Per-type Engagements tabs on canonical tables (`host_organization_id`, `engagement_participants`) + ~42 dead legacy `*DossierDetail` files deleted (~9,200 lines) — v6.6 Phase 67

### Active

v9.0 requirements are archived at `.planning/milestones/v9.0-REQUIREMENTS.md` (12 of 21 met at close). A fresh `.planning/REQUIREMENTS.md` is created by `/gsd:new-milestone` for v10.0.

### Out of Scope

- Mobile native app — cancelled (code preserved in git history)
- OAuth/social login — email/password sufficient; revisit if user base grows
- Real-time chat — high complexity, not core to dossier management
- Video content support — storage/bandwidth costs disproportionate to value

## Context

- **Codebase:** ~580 commits, ~60+ backend API endpoints, ~150+ frontend route files, Supabase migrations, TypeScript monorepo
- **Tech stack:** React 19, TypeScript 5.9, TanStack Router/Query v5, Express, Supabase (PostgreSQL 17), HeroUI v3, Tailwind v4, Vite
- **Architecture:** Hub-and-spoke with DossierShell/WorkspaceShell patterns, domain repository across 13 domains, shared apiClient
- **Quality gates:** ESLint 9 flat config, Prettier, Knip, pre-commit hooks, size-limit (200KB budget)
- **Security:** Supabase-first auth with RBAC hierarchy, Zod validation on all routes, RLS on all tables, CSP hardened
- **RTL:** useDirection() hook, LtrIsolate wrapper, eslint-plugin-rtl-friendly, zero physical CSS properties
- **Responsive:** Mobile-first across all pages, 44px touch targets, card view fallbacks, RelationshipSidebar → BottomSheet on mobile
- **Known tech debt:** See milestone audit files in `.planning/milestones/` and acknowledged open artifacts in `.planning/STATE.md` Deferred Items

## Constraints

- **Tech stack**: React 19, Express, Supabase, TanStack, HeroUI v3, Tailwind v4 — no framework migrations
- **Bilingual**: Arabic (RTL) and English (LTR) must both work correctly after every change
- **Database**: Supabase managed PostgreSQL — migrations via Supabase MCP
- **Deployment**: DigitalOcean droplet with Docker Compose
- **Quality**: All v2.0 quality gates must remain green (ESLint, Prettier, Knip, size-limit, pre-commit hooks)

## Key Decisions

| Decision                                                   | Rationale                                                                                                                                                                   | Outcome           |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| v7.0: Option A — Mastra TS-native agent runtime            | Only stack holding all hard constraints (TS-native, sovereign license, existing deps)                                                                                       | ✓ Good            |
| v7.0: JWT keystone — RLS enforces clearance                | Service-role retired from interactive paths; agent cannot read above caller clearance                                                                                       | ✓ Good            |
| v7.0: Agent over real data, not stubs                      | A copilot on real signals/digests/graph is the product, not a demo                                                                                                          | ✓ Good            |
| v7.0: vLLM/Gemma-4-12B + TEI, eval-gated & swappable       | On-prem, zero egress; the eval harness picks the brain                                                                                                                      | ✓ Good            |
| v7.0: live eval + AGENT/INFRA verification deploy-gated    | EVAL-01/02/03 + live agent need the on-prem GPU/TEI stack (not yet stood up)                                                                                                | — Pending         |
| Full stack scope                                           | Backend and frontend both need quality pass                                                                                                                                 | ✓ Good            |
| Quality before features                                    | Fragile foundation makes new features risky                                                                                                                                 | ✓ Good            |
| No new features in this milestone                          | Keeps scope focused on hardening                                                                                                                                            | ✓ Good            |
| Supabase-first auth                                        | Unified auth strategy, JWT as fallback                                                                                                                                      | ✓ Good            |
| Domain repository pattern                                  | Consistent data flow, zero raw fetch                                                                                                                                        | ✓ Good            |
| useDirection() over prop drilling                          | Centralized RTL, no per-component dir=                                                                                                                                      | ✓ Good            |
| size-limit as hard CI gate                                 | Bundle budget enforced, Lighthouse advisory                                                                                                                                 | ✓ Good            |
| ESLint strict rules deferred                               | 4500+ violations too large for this milestone                                                                                                                               | ⚠️ Revisit        |
| rtl-friendly at warn level                                 | Error-level no-restricted-syntax covers it                                                                                                                                  | ⚠️ Revisit        |
| Lifecycle guides, not gates                                | Diplomatic work is non-linear; skip/revert OK                                                                                                                               | ✓ Good            |
| Hub-and-spoke architecture                                 | Matches how diplomatic staff actually work                                                                                                                                  | ✓ Good            |
| DossierShell shared layout                                 | Consistent UX across all 8 dossier types                                                                                                                                    | ✓ Good            |
| Feature absorption over deletion                           | Redirect old routes, absorb into context                                                                                                                                    | ✓ Good            |
| Elected Officials via persons                              | Query persons with subtype filter, no new table                                                                                                                             | ✓ Good            |
| Kibo-UI KanbanProvider                                     | Better DX than raw @dnd-kit/core for kanban                                                                                                                                 | ✓ Good            |
| Supabase Realtime for dashboard                            | 1s debounce on tasks+transitions tables                                                                                                                                     | ✓ Good            |
| BullMQ for async notification                              | Decouple dispatch from triggering action                                                                                                                                    | ✓ Good            |
| Resend for transactional email                             | Simple API, bilingual HTML templates                                                                                                                                        | ✓ Good            |
| nginx + certbot over Caddy                                 | Existing config, lower migration risk                                                                                                                                       | ✓ Good            |
| VAPID push with soft-ask pattern                           | Better UX than cold browser permission dialog                                                                                                                               | ✓ Good            |
| Playwright POM + CI sharding                               | Maintainable E2E with parallelized CI runs                                                                                                                                  | ✓ Good            |
| Plans 20-02–05 deferred to corp                            | Corporate infra migration pending                                                                                                                                           | — Pending         |
| OKLCH token engine over HSL                                | Better perceptual uniformity for accent math; clean dark/light flips per direction                                                                                          | ✓ Good (v6.0)     |
| HeroUI v3 + Tailwind v4 `@theme`                           | Single token bridge instead of per-component overrides; semantic mapping accent→primary                                                                                     | ✓ Good (v6.0)     |
| Self-hosted fonts via @fontsource                          | Zero CDN traffic + offline-friendly + bundled by Vite                                                                                                                       | ✓ Good (v6.0)     |
| Replace v5 themes (no coexistence)                         | Strategy (i) — clean cut over coexistence; eliminates token cascade conflicts                                                                                               | ✓ Good (v6.0)     |
| FOUC bootstrap byte-mirror invariant                       | Inline synchronous bootstrap.js paints first-frame tokens; literal palette must byte-match `tokens/directions.ts`                                                           | ✓ Good (v6.0)     |
| Phase 43 as cross-phase QA gate                            | Final phase enforces lint + axe + responsive + keyboard + focus-outline across all v6.0 routes — not per-phase                                                              | ✓ Good (v6.0)     |
| Playwright globalSetup + storageState                      | Replaces brittle per-test login helper; eliminates Class D login-form bleed-through across qa-sweep specs                                                                   | ✓ Good (v6.0)     |
| `.touch-44` utility + 7 call-sites                         | Single CSS class with logical `min-inline-size`/`min-block-size`; applied to existing components without refactoring                                                        | ✓ Good (v6.0)     |
| 6 phases ship without VERIFICATION.md                      | Phase 43 cross-phase sweep covered them indirectly; Phase 44 backfilled explicit verification                                                                               | ✓ Closed          |
| Visual baselines deferred to operator                      | Phase 46 regenerated and committed baselines on a seeded dev machine with human review and CI replay                                                                        | ✓ Closed          |
| Phase-base git tags as diff anchors                        | `phase-47/48/49-base` lightweight tags replace unreliable `git merge-base main HEAD` for net-new-suppression audits                                                         | ✓ Good (v6.2)     |
| Deletion-first TS6133/TS6196 fix                           | TS6133 unused declarations resolved by deletion or real fix; never silenced with `@ts-ignore` / `@ts-expect-error`                                                          | ✓ Good (v6.2)     |
| `@ts-nocheck` on Supabase codegen                          | Auto-generated `database.types.ts` + `contact-directory.types.ts` allowlisted via top-of-file `@ts-nocheck` in EXCEPTIONS ledger — D-11 alternative to `tsconfig` exclude   | ✓ Good (v6.2)     |
| Typed-at-source over consumer cast                         | Tighten underlying domain hook return types to retire 19 of 20 typed shims; cast at destructure boundary deprecated                                                         | ✓ Good (v6.2)     |
| Root `eslint.config.mjs` only                              | Deleted `frontend/eslint.config.js` shadow; workspace lint scripts pinned to root with `--max-warnings 0`                                                                   | ✓ Good (v6.2)     |
| Invert `no-restricted-imports`                             | Bans Aceternity + Kibo UI per CLAUDE.md primitive cascade (HeroUI v3 → Radix → custom); rule messages no longer recommend a banned library                                  | ✓ Good (v6.2)     |
| Honest Total-JS ceiling 2.45 MB                            | D-02 escalation: 1.8 MB unattainable inside Phase 49 scope; lock at measured + slack with documented paper trail rather than aspirational ceiling                           | ✓ Good (v6.2)     |
| manualChunks ordering                                      | Scoped-package rules placed BEFORE `id.includes("react")` substring rule to prevent @heroui/@dnd-kit/@radix-ui mis-classification into react-vendor                         | ✓ Good (v6.2)     |
| Sub-vendor decomposition                                   | heroui-vendor / sentry-vendor / dnd-vendor split with `===1` strict assertions in `assert-size-limit-matches.mjs`                                                           | ✓ Good (v6.2)     |
| size-limit native exit IS the gate                         | BUNDLE-03 enforcement uses `size-limit` fail-on-exceed; no custom delta calculator                                                                                          | ✓ Good (v6.2)     |
| `vi.importActual` + spread for react-i18next               | TEST-01: factory preserves `initReactI18next` + all real exports so module-eval succeeds for every consumer; eliminates the `vi.mock` factory-omits-real-export trap        | ✓ Good (v6.3)     |
| Tier-A swap + Tier-C suppress for DESIGN-03                | 50 named-anchor files swapped to tokens; 271 Tier-C suppressed per-Literal with traceable `eslint-disable-next-line` annotations — cleanup waves staged for v6.4            | ✓ Good (v6.3)     |
| D-09 fold into existing `Lint` context                     | DESIGN-04: no new branch-protection PUT; smoke PR #12 captured `Lint=FAILURE` + `mergeStateStatus=BLOCKED` against `main`                                                   | ✓ Good (v6.3)     |
| KANBAN-02 satisfied-by-deletion                            | D-20: `EngagementKanbanDialog` + `EngagementDossierPage` deleted as dead code; route now redirect-only to workspace TasksTab; shared `@dnd-kit/core` primitive covers both  | ✓ Good (v6.3)     |
| Rename Phase-45 `intelligence_digest` → `dashboard_digest` | Frees the canonical name for the v7.0 Intelligence Engine surface; lockstep frontend hook/test/widget rename in 54-01                                                       | ✓ Good (v6.3)     |
| `intelligence_event` (not `intelligence_signal`)           | Avoids collision with existing curated `intelligence_signals` plural table; renamed from spec                                                                               | ✓ Good (v6.3)     |
| Polymorphic junction over per-type FKs                     | `intelligence_event_dossiers` with 7-value `dossier_type` CHECK + EXISTS-via-parent RLS scales without N table-pair joins for AI correlation                                | ✓ Good (v6.3)     |
| Annotated + SSH-signed phase-base tags                     | BUNDLE-06: `git tag -v` provenance via `~/.ssh/allowed_signers`; origin SHAs match local objects post-audit verification                                                    | ✓ Good (v6.3)     |
| Migrations via Supabase MCP, not local CLI                 | D-15: applied to staging (`zkrcjzdemdmwhearhfgg`) via `apply_migration` — keeps environments authoritative and reproducible                                                 | ✓ Good (v6.3)     |
| Reverse the v6.3 D-09 fold (8 explicit `main` contexts)    | Per-gate failure attribution beats a composite `Lint` context; `Design Token Check` + `react-i18next Factory Check` split out as their own required contexts                | ✓ Good (v6.4)     |
| `countries` → `globalReferenceTables` RLS tier             | Authenticated-read + role-gated writes resolves the Phase 03/04 pre-existing fail without weakening the sensitive-table audit                                               | ✓ Good (v6.4)     |
| Mobile DnD scope-out (ADR + `<select>` fallback)           | Keeps the shared kanban primitive simple; desktop DnD is the supported path, mobile gets a read-only "Move to" picker (D-19)                                                | ✓ Good (v6.4)     |
| Tier-C cleared as mechanical token swaps                   | Wave-staged by surface for independent review/revert; not a token-system extension                                                                                          | ✓ Good (v6.4)     |
| Positive-failure CI fixtures outside lint globs            | `bad-design-token`/`bad-vi-mock` jobs fail if the guards stop firing, yet can't break the main `Lint` context                                                               | ✓ Good (v6.4)     |
| Phase 61 satisfied by out-of-band security quick task      | Adversarial quick 260610-fkn closed all four scope items faster than phase planning; retro-verified against live pg_policies + repo before milestone close                  | ✓ Good (v6.5)     |
| Fanout inspection loop for workflow QA                     | 17 unattended rounds (codex/cursor inspectors + build-green gate) burned down bucket-A fixes; bucket-B escalated to phase proposals instead of risky auto-fixes             | ✓ Good (v6.5)     |
| Bundle budgets raised for legitimate growth                | Entry 450→460 KB, Total JS 2.5→2.55 MB after 76 commits of fixes (static-bundled i18n grows entry); per-chunk vendor budgets unchanged                                      | ✓ Good (v6.5)     |
| Linear as the sole visual direction                        | Retire the 4 Bureau/Chancery/Situation/Ministerial directions + accent-hue axis; no coexistence — eliminates token-cascade conflicts and the Tweaks direction/hue switchers | ✓ Good (v8.0)     |
| Re-skin the existing OKLCH engine, not rebuild             | Linear dark+light tokens transcribed into `directions.ts`/`buildTokens.ts`/`applyTokens.ts`; the v6.0 engine + FOUC byte-match invariant carried forward                    | ✓ Good (v8.0)     |
| Dual-layer `id.dir`→linear coercion                        | Both `bootstrap.js` and `DesignProvider` coerce every legacy `id.dir` to `linear` so first paint never loses tokens when the old palette map vanishes                       | ✓ Good (v8.0)     |
| Phase 78 = HeroUI bump + regression sweep                  | Phase 75 audit confirmed the tree was already on the v3 compound API with no v3-removed components and Inter/JetBrains already in place — not a v2→v3 migration             | ✓ Good (v8.0)     |
| Human blocking diff-triage before baseline recapture       | VERIFY-01 anti-laundering: 43 baselines human-adjudicated (39 intended-Linear + 4 within-tolerance, 0 regressions) BEFORE any PNG recapture (a separate plan)               | ✓ Good (v8.0)     |
| RTL smokes ship advisory (green-from-birth)                | `test-rtl-smokes` CI job uses DOM/computed-style assertions; branch-protection promotion deferred to repo-admin (confirmed not silently claimed among main's 8 checks)      | ⚠️ Revisit (v8.0) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-08-15 — v9.0 closed PARTIAL (3/6 phases) and archived; open items carried into v10.0 Trust & Correctness, scoped from the 2026-08-15 live-app audit (144 findings, 19 ship-blockers)._
