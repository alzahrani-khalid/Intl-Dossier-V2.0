# Intl-Dossier v2.0 — Production Quality Milestone

## What This Is

A diplomatic dossier management system for tracking countries, organizations, forums, engagements, topics, working groups, persons, and elected officials. Built with React 19 + TanStack Router/Query, Express backend, Supabase (PostgreSQL + Auth + Realtime), AI briefing generation, and bilingual Arabic/English support. Used by international affairs professionals to manage diplomatic relationships, work items, and intelligence signals.

## Core Value

The codebase must be production-ready — clean, consistent, secure, performant, and fully responsive with proper RTL/LTR theming — before new features are built on top of it.

## Requirements

### Validated

- ✓ 8 dossier types with CRUD (country, organization, forum, engagement, topic, working_group, person, elected_official) — existing
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

### Active

- [ ] Dead code removal — unused imports, unreachable code, leftover experiments across full stack
- [ ] Code architecture consolidation — deduplicate logic, enforce consistent patterns, proper abstractions
- [ ] Performance optimization — slow queries, unnecessary re-renders, bundle size, lazy loading gaps
- [ ] Security hardening — RLS policy audit, input validation gaps, auth edge cases, OWASP compliance
- [ ] RTL/LTR theming consistency — all components use logical properties, theme switching works without visual bugs
- [ ] Mobile/tablet responsiveness — full responsive audit across all pages, touch targets, breakpoint coverage

### Out of Scope

- New features or dossier types — quality first, features later
- Mobile native app — cancelled (code preserved in git history)
- OAuth/social login — email/password sufficient for current phase
- Real-time chat — high complexity, not core to dossier management
- Video content support — storage/bandwidth costs disproportionate to value

## Context

- **Existing codebase:** ~60+ backend API endpoints, ~100+ frontend route files, 7 Supabase migrations, multiple Edge Functions
- **Codebase map:** `.planning/codebase/` contains detailed analysis (STACK, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS)
- **Known issues from CONCERNS.md:** Tech debt around inconsistent patterns, mixed RTL approaches, untested responsive breakpoints, potential RLS gaps
- **Theming:** HeroUI v3 with oklch color system, dark/light/system modes, but theme switching has visual bugs
- **RTL:** `forceRTL` rules in CLAUDE.md for React Native (now cancelled), web uses Tailwind logical properties but inconsistently
- **Responsive:** Mobile-first mandated in CLAUDE.md but not consistently implemented across all pages
- **Dependencies:** Large dependency tree (AI/ML libs, PDF processing, multiple ORMs) — may have unused packages

## Constraints

- **Tech stack**: Must stay within current stack (React 19, Express, Supabase, TanStack, HeroUI v3, Tailwind v4) — no framework migrations
- **Backwards compatibility**: All existing features must continue working after cleanup — no regressions
- **Bilingual**: Arabic (RTL) and English (LTR) must both work correctly after every change
- **Database**: Supabase managed PostgreSQL — migrations via Supabase MCP, no direct DB access changes
- **Deployment**: DigitalOcean droplet with Docker Compose — changes must be deployable via existing pipeline

## Key Decisions

| Decision                          | Rationale                                   | Outcome   |
| --------------------------------- | ------------------------------------------- | --------- |
| Full stack scope                  | Backend and frontend both need quality pass | — Pending |
| Quality before features           | Fragile foundation makes new features risky | — Pending |
| No new features in this milestone | Keeps scope focused on hardening            | — Pending |

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

_Last updated: 2026-03-23 after initialization_
