# Research Summary: Intl-Dossier v4.0 Live Operations

**Domain:** Notification system, production deployment, E2E testing, seed data
**Researched:** 2026-04-06
**Overall confidence:** HIGH

## Executive Summary

The v4.0 "Live Operations" milestone makes the diplomatic dossier system operational for daily use. Research reveals a critical finding: much of the notification infrastructure already exists in the codebase. A `notifications` table with categories and priorities, `push_device_tokens` with web push support, `notification_category_preferences` with per-channel toggles, frontend components (`NotificationBell`, `NotificationList`, `NotificationPanel`, `NotificationPreferences`), hooks (`useNotificationCenter`, `useNotificationRealtime`), a basic `notification.service.ts`, and Edge Function stubs for push and digest are all already built. CI/CD workflows (`.github/workflows/ci.yml` and `deploy.yml`), nginx+certbot Docker config, and Playwright configs also exist. The primary work is wiring, hardening, and extending -- not greenfield building.

Four new backend dependencies are needed: `web-push` (v3.6) for browser push via VAPID, `resend` (v6.10) for transactional email, `@react-email/components` (v0.0.31) for bilingual email templates, and `bullmq` (v5.73) for async job processing via the existing Redis instance. All are backend-only with zero frontend bundle impact. The existing nginx+certbot setup should be kept rather than switching to Caddy, since the config is already written with HTTPS, WebSocket proxy, rate limiting, and security headers -- switching adds migration risk for minimal gain.

The notification architecture follows an event-driven pattern: domain events (assignment, deadline, stage transition) trigger the existing `notification.service.ts` to insert into the `notifications` table (Supabase Realtime handles in-app delivery automatically via existing hooks). A new `NotificationDispatcher` routes to email and push channels based on existing `notification_category_preferences`. BullMQ workers process email (via Resend) and push (via web-push) asynchronously, keeping API responses fast. This design maximizes reuse of existing infrastructure while adding the two missing delivery channels.

The most dangerous pitfalls are: (1) database trigger coupling for notification delivery that rolls back the original transaction on external service failure, (2) HTTPS bootstrap chicken-and-egg with nginx+certbot on first deploy, (3) notification fatigue destroying user trust if defaults are too aggressive, and (4) flaky E2E tests blocking the CI/CD pipeline. All have documented mitigations in PITFALLS.md.

## Key Findings

**Stack:** 4 new backend deps (`web-push`, `resend`, `@react-email/components`, `bullmq`), keep existing nginx+certbot, extend existing Playwright setup. Zero frontend bundle impact.

**Architecture:** Event-driven notification dispatch extending existing `notification.service.ts`. In-app via existing Supabase Realtime. Email/push via new BullMQ workers. Existing notification UI components need wiring, not rebuilding.

**Critical insight:** Most notification infrastructure already exists from earlier development. v4.0 is a wiring + hardening milestone, not a building-from-scratch milestone.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Production Deployment Hardening** - Ship HTTPS and CI/CD first
   - Addresses: HTTPS (table stakes #9), health endpoint (#11), CI/CD (differentiator #5), monitoring
   - Avoids: Pitfall #2 (HTTPS bootstrap), Pitfall #8 (Docker anti-patterns), Pitfall #9 (blocking CI)
   - Rationale: HTTPS is a prerequisite for browser push notifications (service workers require HTTPS). CI/CD unblocks automated testing. Must be first.

2. **Notification Backend + In-App Wiring** - Connect existing pieces
   - Addresses: In-app bell (#1), notification center (#2), assignment triggers (#3), deadline alerts (#4), stage transition alerts (#5), attention zone (#6), preferences (#8)
   - Avoids: Pitfall #1 (trigger coupling), Pitfall #3 (notification fatigue), Pitfall #12 (subscription leaks)
   - Rationale: Most components exist. Primary work is NotificationDispatcher service, trigger integration at service call sites, and wiring existing UI into the app header/layout.

3. **Email + Push Channels** - Add external delivery
   - Addresses: Email alerts (#7), browser push (differentiator #1), email digest (differentiator #2), smart routing (differentiator #3)
   - Avoids: Pitfall #6 (email deliverability), Pitfall #7 (push permission UX)
   - Rationale: Depends on notification backend (phase 2) and HTTPS (phase 1). Install `web-push`, `resend`, `bullmq`. Build workers and service worker.

4. **E2E Tests + Seed Data** - Quality and first-run experience
   - Addresses: Auth E2E (#12), dossier CRUD E2E (#13), seed data (#14, #15), engagement lifecycle E2E, kanban E2E
   - Avoids: Pitfall #4 (flaky tests), Pitfall #10 (seed FK ordering), Pitfall #13 (Arabic text coupling)
   - Rationale: Tests validate everything built in phases 1-3. Seed data needs final schema stabilized. E2E in CI validates the full CI/CD pipeline.

5. **v3.0 Tech Debt Cleanup** - Final polish
   - Addresses: OPS-03/07 from v3.0 audit, stale metadata
   - Rationale: Clean slate before daily operational use. Small scope, low risk.

**Phase ordering rationale:**
- Phase 1 before 2: HTTPS required for push notifications, CI/CD required for automated test validation
- Phase 2 before 3: Notification backend and trigger system must exist before email/push channels can route to them
- Phase 3 before 4: E2E tests should cover notification flows, which need email/push channels working
- Phase 5 is independent but logically last (polish before launch)

**Research flags for phases:**
- Phase 1: Needs careful audit of existing `docker-compose.prod.yml`, `nginx.prod.conf`, `ci.yml`, and `deploy.yml` before modifications -- much exists but may be incomplete or broken
- Phase 2: Must audit existing notification components and hooks for completeness -- they exist but may have gaps or be from an earlier architecture iteration
- Phase 3: Push notification permission UX decision (soft-ask pattern) needs product sign-off before implementation
- Phase 4: Existing Playwright configs and test stubs need to be unified and validated before writing new specs

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All npm versions verified. Existing codebase infrastructure confirmed via parallel analysis. |
| Features | HIGH | Table stakes derived from operational tool patterns. Existing components confirmed in codebase reduce scope uncertainty. |
| Architecture | HIGH | Based on direct codebase analysis of existing notification hooks, services, migrations, CI configs, and Docker setup. Integration points are concrete, not speculative. |
| Pitfalls | HIGH | All 14 pitfalls grounded in specific codebase artifacts and verified external documentation (Supabase backup limitations, Let's Encrypt rate limits, push permission UX research). |

## Gaps to Address

- **Existing component completeness audit:** The notification UI components and hooks exist but their completeness and compatibility with v4.0 requirements needs verification during phase 2 planning. They may be from an earlier architecture iteration.
- **Edge Function vs BullMQ decision:** Existing Edge Function stubs (`push-notification`, `notifications-digest`) suggest an alternative architecture using Supabase infrastructure instead of BullMQ. This decision should be finalized during phase 2 planning.
- **DNS and domain configuration:** HTTPS requires a domain name (Let's Encrypt does not support bare IPs). The current droplet is at `138.197.195.242`. A domain must be configured and DNS pointed before HTTPS can be enabled.
- **Resend sending domain:** SPF/DKIM/DMARC DNS records must be configured on the sending domain before production email. This requires domain access and is a dependency for phase 3.
- **Push notification browser support scope:** web-push works on Chrome, Firefox, Edge. Safari has limited Web Push support (requires different implementation). Decision needed: support Safari push or Chrome/Firefox only for v4.0?

## Files Created

| File | Purpose |
|------|---------|
| `.planning/research/SUMMARY.md` | This file -- executive summary with roadmap implications |
| `.planning/research/STACK.md` | Technology recommendations with existing infrastructure audit |
| `.planning/research/FEATURES.md` | Feature landscape (table stakes, differentiators, anti-features) |
| `.planning/research/ARCHITECTURE.md` | System architecture, notification flow, deployment topology, E2E structure |
| `.planning/research/PITFALLS.md` | 14 domain pitfalls with prevention strategies |

---

_Research completed: 2026-04-06_
_Ready for roadmap: yes_
