# Milestones

## v4.1 Post-Launch Fixes (Shipped: 2026-04-12)

**Phases completed:** 2 phases (24-25), 7 plans, 6 quick tasks
**Commits:** 89 | **Files changed:** 206 | **Lines:** +13,953 / -3,910
**Timeline:** 4 days (2026-04-09 to 2026-04-12)

**Key accomplishments:**

- Fixed runtime issues from v4.0 deployment (calendar i18n, settings 406, analytics DNS routing)
- Completed full 87-finding audit across 8 user journeys with 6 specialized auditor agents
- Resolved all theme token hardcoding with centralized semantic-colors system
- Moved auth listener to React lifecycle (memory leak + lock contention fix)
- Achieved 100% Arabic translation parity (1464 EN / 1473 AR keys)
- Hardened notification endpoints with type-safe count coercion

**Tech debt:** None — all 87 findings resolved
**Archive:** `.planning/milestones/v4.1-ROADMAP.md`

---

## v4.0 Live Operations (Shipped: 2026-04-09)

**Phases completed:** 10 phases, 30 plans, 30 tasks

**Key accomplishments:**

- Fixed nginx proxy_pass trailing-slash bug and certbot cert path mounting for production HTTPS with auto-renewing TLS
- deploy/backup-redis.sh
- 1. [Rule 3 - Blocking] Copied Plan 01 prerequisite files into worktree
- Category-aware Sonner toast on Realtime arrivals with full bilingual i18n strings for notification center
- 1. [Rule 3 - Blocking] Test directory mismatch
- 1. [Rule 3 - Blocking] Test directory mismatch
- Added is_seed_data tagging infrastructure across all seeded tables, unblocking idempotent populate RPC and tag-based cleanup.
- Installed the GASTAT diplomatic seed RPC on staging — deterministic, idempotent, admin-gated, bilingual across all native columns, covering every task enum value and five inheritance_source variants. Function is available but intentionally uninvoked on staging to avoid colliding with existing real data.
- Lightweight first-run detection RPC and regenerated database types — frontend can now type-safely query whether the database is empty and whether the caller is allowed to seed it.
- Built the bilingual, RTL-safe, mobile-first first-run modal with admin/non-admin variants. All four populate_diplomatic_seed response paths covered by passing Vitest tests.
- Closed the SEED-03 loop end-to-end. The dashboard now mounts FirstRunModal automatically when check_first_run reports an empty DB and the user has not previously dismissed it. All automated tests green; manual UAT (Task 3) is still pending and must run against a fresh empty database.
- One-liner:
- Commit:
- 1. [Rule 1 - Bug] Fixed POM NotificationCategory mismatch
- 1. [Rule 3 - Blocking] No unit tests exist for FirstRunModal/useFirstRunCheck
- 1. [Rule 1 - Bug] Fixed traceability phase mapping for SEED-01/02/03

---

## v3.0 Connected Workflow (Shipped: 2026-04-06)

**Phases completed:** 6 phases, 28 plans, 45 requirements
**Timeline:** 9 days (2026-03-28 → 2026-04-06)
**Commits:** 160 | **Files changed:** 525 | **Lines:** +43,480 / -7,323

**Key accomplishments:**

1. Hub-based 3-group sidebar (Operations, Dossiers, Administration) with mobile bottom tab bar and Cmd+K quick switcher
2. Engagement lifecycle engine with 6-stage progression, flexible transitions, audit logging, intake promotion, and forum sessions
3. Role-adaptive Operations Hub dashboard with 5 attention zones, Supabase Realtime subscriptions, and 3,743 lines dead code removed
4. Persistent engagement workspace with lifecycle stepper, inline kanban, calendar, document management, and AI briefing generation
5. DossierShell architecture with RelationshipSidebar (tier grouping, mobile sheet), 52 nested tab routes across all 8 dossier types
6. Elected Officials as full domain with Express API, list page, detail page with committees tab
7. Feature absorption: analytics, AI briefings, network graph, polling, export absorbed into contextual locations; all standalone routes redirect

**Tech debt:** See `.planning/milestones/v3.0-MILESTONE-AUDIT.md`
**Archive:** `.planning/milestones/v3.0-ROADMAP.md`, `.planning/milestones/v3.0-REQUIREMENTS.md`

---

## v2.0 Production Quality (Shipped: 2026-03-28)

**Phases completed:** 7 phases, 29 plans, 53 tasks
**Timeline:** 185 days (2025-09-25 → 2026-03-28)
**Commits:** 294 | **Files changed:** 8,732

**Key accomplishments:**

1. Unified ESLint 9 flat config, Prettier, and Knip dead-code scanner with pre-commit quality gates
2. Consistent naming conventions enforced via eslint-plugin-check-file across all monorepo layers
3. Supabase-first auth with RBAC hierarchy, Zod validation on all routes, dynamic RLS with org isolation
4. useDirection() hook, LtrIsolate wrapper, and 536 files bulk-migrated to logical CSS properties
5. Mobile-first responsive layouts with card-view fallbacks, 44px touch targets, and AdaptiveDialog
6. Domain repository pattern for 13 domains eliminating all raw fetch() calls in hooks
7. 200KB bundle budget via size-limit, deferred Sentry, query staleTime tiers, targeted memoization

**Tech debt:** 12 items across 5 phases (see `.planning/milestones/v2.0-MILESTONE-AUDIT.md`)
**Archive:** `.planning/milestones/v2.0-ROADMAP.md`, `.planning/milestones/v2.0-REQUIREMENTS.md`

---
