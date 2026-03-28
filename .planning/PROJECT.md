# Intl-Dossier

## What This Is

A diplomatic dossier management system for tracking countries, organizations, forums, engagements, topics, working groups, persons, and elected officials. Built with React 19 + TanStack Router/Query, Express backend, Supabase (PostgreSQL + Auth + Realtime), AI briefing generation, and bilingual Arabic/English support. Used by international affairs professionals to manage diplomatic relationships, work items, and intelligence signals.

## Core Value

Unified intelligence management for diplomatic operations — every relationship, commitment, and signal tracked in one secure, bilingual platform.

## Current State

**Shipped:** v2.0 Production Quality (2026-03-28)

The codebase is production-ready after a 7-phase hardening milestone:

- Unified toolchain (ESLint 9, Prettier, Knip, pre-commit hooks)
- Consistent naming conventions enforced via ESLint
- Security hardened (Supabase-first auth, RBAC, CSP, Zod validation, RLS on all tables)
- RTL/LTR perfected (useDirection hook, LtrIsolate, logical properties, eslint-plugin-rtl-friendly)
- Fully responsive (mobile-first, 44px touch targets, card view fallbacks)
- Domain repository architecture (13 domains, zero raw fetch in hooks)
- Performance optimized (200KB bundle budget, query tiers, deferred Sentry)

**Tech debt (12 items):** See `.planning/milestones/v2.0-MILESTONE-AUDIT.md`

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

### Active

## Current Milestone: v3.0 Connected Workflow

**Goal:** Transform disconnected pages into a connected hub-and-spoke architecture reflecting how diplomatic staff actually work — multiple entry points, engagement lifecycle, and operational overview.

**Target features:**

- Navigation & Route Consolidation (hub-based sidebar, eliminate duplicates, remove demos)
- Operations Hub (dashboard redesign with attention zones, role-adaptive filters)
- Engagement Workspace (lifecycle bar, tabbed workspace, scoped kanban/calendar)
- Dossier Hub enriched detail pages (tier-specific views, RelationshipSidebar)
- Feature Absorption (analytics, AI, network graph absorbed into contextual locations)
- Lifecycle Engine (DB lifecycle_stage, stage transitions, forum sessions)

### Out of Scope

- Mobile native app — cancelled (code preserved in git history)
- OAuth/social login — email/password sufficient; revisit if user base grows
- Real-time chat — high complexity, not core to dossier management
- Video content support — storage/bandwidth costs disproportionate to value

## Context

- **Codebase:** 294 commits, 8732 files, ~60+ backend API endpoints, ~100+ frontend route files, 8 Supabase migrations
- **Tech stack:** React 19, TypeScript 5.9, TanStack Router/Query v5, Express, Supabase (PostgreSQL 17), HeroUI v3, Tailwind v4, Vite
- **Architecture:** Domain repository pattern across 13 domains, shared apiClient, backward-compat re-exports
- **Quality gates:** ESLint 9 flat config, Prettier, Knip, pre-commit hooks (lint + format + build + dead-code), size-limit (200KB budget)
- **Security:** Supabase-first auth with RBAC hierarchy, Zod validation on all routes, RLS on all tables, CSP hardened
- **RTL:** useDirection() hook, LtrIsolate wrapper, eslint-plugin-rtl-friendly, zero physical CSS properties
- **Responsive:** Mobile-first across all pages, 44px touch targets, card view fallbacks on tables
- **Known tech debt:** 12 items documented in milestone audit (ESLint strict rules deferred, rtl-friendly at warn level, no automated breakpoint tests, 36 legacy hooks with literal staleTime)

## Constraints

- **Tech stack**: React 19, Express, Supabase, TanStack, HeroUI v3, Tailwind v4 — no framework migrations
- **Bilingual**: Arabic (RTL) and English (LTR) must both work correctly after every change
- **Database**: Supabase managed PostgreSQL — migrations via Supabase MCP
- **Deployment**: DigitalOcean droplet with Docker Compose
- **Quality**: All v2.0 quality gates must remain green (ESLint, Prettier, Knip, size-limit, pre-commit hooks)

## Key Decisions

| Decision                          | Rationale                                     | Outcome    |
| --------------------------------- | --------------------------------------------- | ---------- |
| Full stack scope                  | Backend and frontend both need quality pass   | ✓ Good     |
| Quality before features           | Fragile foundation makes new features risky   | ✓ Good     |
| No new features in this milestone | Keeps scope focused on hardening              | ✓ Good     |
| Supabase-first auth               | Unified auth strategy, JWT as fallback        | ✓ Good     |
| Domain repository pattern         | Consistent data flow, zero raw fetch          | ✓ Good     |
| useDirection() over prop drilling | Centralized RTL, no per-component dir=        | ✓ Good     |
| size-limit as hard CI gate        | Bundle budget enforced, Lighthouse advisory   | ✓ Good     |
| ESLint strict rules deferred      | 4500+ violations too large for this milestone | ⚠️ Revisit |
| rtl-friendly at warn level        | Error-level no-restricted-syntax covers it    | ⚠️ Revisit |

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

_Last updated: 2026-03-28 after v3.0 milestone started_
