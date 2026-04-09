# Intl-Dossier

## What This Is

A diplomatic dossier management system for tracking countries, organizations, forums, engagements, topics, working groups, persons, and elected officials. Built with React 19 + TanStack Router/Query, Express backend, Supabase (PostgreSQL + Auth + Realtime), AI briefing generation, and bilingual Arabic/English support. Used by international affairs professionals to manage diplomatic relationships, work items, and intelligence signals.

## Core Value

Unified intelligence management for diplomatic operations — every relationship, commitment, and signal tracked in one secure, bilingual platform.

## Current State

**Shipped:** v4.0 Live Operations (2026-04-09)

The system is now operational for daily use with full notification stack, production deployment, and automated testing:

- Production deployment: Docker Compose + nginx HTTPS + CI/CD pipeline + Redis backups + rollback
- In-app notifications: bell icon, unread badge, notification center, category tabs, BullMQ async dispatch
- Email notifications: Resend integration, bilingual alert templates, daily/weekly digest scheduling
- Browser push: VAPID push delivery, soft-ask opt-in pattern, service worker
- Seed data: 40+ bilingual diplomatic entities, first-run detection modal, admin-gated population
- E2E testing: Playwright suite with POM pattern, CI sharding, auth hardening, failure artifacts
- Tech debt resolved: typed TanStack Router params, roadmap auto-sync

**Previous:** v3.0 Connected Workflow (2026-04-06) — hub-and-spoke architecture, engagement lifecycle, Operations Hub, DossierShell
**Previous:** v2.0 Production Quality (2026-03-28) — 7-phase hardening (toolchain, security, RTL, responsive, architecture, performance)

**Tech debt:** See `.planning/milestones/v4.0-MILESTONE-AUDIT.md` for known gaps (NOTIF-04 digest scheduler, TEST-05/10/11 E2E coverage, corporate infra items)

## Requirements

### Validated

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

### Active

(No active requirements — next milestone not yet defined)

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
- **Known tech debt:** See milestone audit files in `.planning/milestones/` (v2.0, v3.0, v4.0)

## Constraints

- **Tech stack**: React 19, Express, Supabase, TanStack, HeroUI v3, Tailwind v4 — no framework migrations
- **Bilingual**: Arabic (RTL) and English (LTR) must both work correctly after every change
- **Database**: Supabase managed PostgreSQL — migrations via Supabase MCP
- **Deployment**: DigitalOcean droplet with Docker Compose
- **Quality**: All v2.0 quality gates must remain green (ESLint, Prettier, Knip, size-limit, pre-commit hooks)

## Key Decisions

| Decision                          | Rationale                                       | Outcome    |
| --------------------------------- | ----------------------------------------------- | ---------- |
| Full stack scope                  | Backend and frontend both need quality pass     | ✓ Good     |
| Quality before features           | Fragile foundation makes new features risky     | ✓ Good     |
| No new features in this milestone | Keeps scope focused on hardening                | ✓ Good     |
| Supabase-first auth               | Unified auth strategy, JWT as fallback          | ✓ Good     |
| Domain repository pattern         | Consistent data flow, zero raw fetch            | ✓ Good     |
| useDirection() over prop drilling | Centralized RTL, no per-component dir=          | ✓ Good     |
| size-limit as hard CI gate        | Bundle budget enforced, Lighthouse advisory     | ✓ Good     |
| ESLint strict rules deferred      | 4500+ violations too large for this milestone   | ⚠️ Revisit |
| rtl-friendly at warn level        | Error-level no-restricted-syntax covers it      | ⚠️ Revisit |
| Lifecycle guides, not gates       | Diplomatic work is non-linear; skip/revert OK   | ✓ Good     |
| Hub-and-spoke architecture        | Matches how diplomatic staff actually work      | ✓ Good     |
| DossierShell shared layout        | Consistent UX across all 8 dossier types        | ✓ Good     |
| Feature absorption over deletion  | Redirect old routes, absorb into context        | ✓ Good     |
| Elected Officials via persons     | Query persons with subtype filter, no new table | ✓ Good     |
| Kibo-UI KanbanProvider            | Better DX than raw @dnd-kit/core for kanban     | ✓ Good     |
| Supabase Realtime for dashboard   | 1s debounce on tasks+transitions tables         | ✓ Good     |
| BullMQ for async notification     | Decouple dispatch from triggering action        | ✓ Good     |
| Resend for transactional email    | Simple API, bilingual HTML templates            | ✓ Good     |
| nginx + certbot over Caddy        | Existing config, lower migration risk           | ✓ Good     |
| VAPID push with soft-ask pattern  | Better UX than cold browser permission dialog   | ✓ Good     |
| Playwright POM + CI sharding      | Maintainable E2E with parallelized CI runs      | ✓ Good     |
| Plans 20-02–05 deferred to corp   | Corporate infra migration pending               | — Pending  |

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

_Last updated: 2026-04-06 after v4.0 milestone start_
