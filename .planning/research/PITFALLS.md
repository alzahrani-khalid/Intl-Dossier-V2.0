# Domain Pitfalls

**Domain:** Notification system, production deployment, and E2E testing for existing Supabase/Express/React diplomatic app
**Researched:** 2026-04-06
**Milestone:** v4.0 Live Operations

---

## Critical Pitfalls

Mistakes that cause rewrites, outages, or major user trust issues.

### Pitfall 1: Database Trigger Coupling for Notification Delivery

**What goes wrong:** Using PostgreSQL triggers directly to send push notifications or emails. If the external service (FCM, Resend, etc.) times out or fails, the trigger fails and **rolls back the entire transaction** -- the original data write (e.g., task assignment) is lost.
**Why it happens:** Seems elegant to fire notifications from a trigger on the `notifications` table insert. Developers underestimate external service latency and failure rates.
**Consequences:** Lost data writes, inconsistent state, silent failures where users think they assigned a task but nothing was saved.
**Prevention:**
1. Decouple notification delivery from the transaction. Insert a row into `notifications` table (status: `pending`) -- this is the only thing the trigger does.
2. Use a Supabase Database Webhook to trigger an Edge Function for actual delivery (email, push, in-app via Realtime).
3. The Edge Function handles retries independently of the original transaction.
4. Add `status` (`pending`, `sent`, `failed`), `retry_count`, and `last_attempt_at` columns to the notifications table.
5. Use `pg_cron` to sweep `failed` notifications every 5 minutes for retry.
6. For in-app notifications, use Supabase Realtime subscriptions on the `notifications` table -- the client listens, no trigger-based delivery needed.
**Detection:** Monitor notifications stuck in `pending` or `failed` status. Alert if delivery rate drops below 95%.

### Pitfall 2: HTTPS Bootstrap Chicken-and-Egg with Docker + Nginx

**What goes wrong:** Nginx container fails to start because SSL certificate files don't exist yet, but Certbot can't obtain certificates because Nginx isn't serving the ACME challenge on port 80.
**Why it happens:** Production `nginx.conf` references certificate paths that don't exist on first deploy. Certbot needs a running web server to verify domain ownership.
**Consequences:** Deploy is completely blocked on first run. Manual SSH intervention required, defeating the purpose of CI/CD.
**Prevention:**
1. Use a two-phase Nginx config: (a) Start with HTTP-only config that serves `.well-known/acme-challenge/`. (b) Run Certbot to obtain certs. (c) Switch to HTTPS config and reload Nginx.
2. Automate this in an `entrypoint.sh` script or use `docker-nginx-certbot` image that handles the bootstrap.
3. Store certs in a named Docker volume (not bind mount) so they survive container recreation.
4. Add a Certbot renewal cron that runs every 12 hours and reloads Nginx via `nginx -s reload` after renewal.
5. Let's Encrypt requires a domain name -- bare IP addresses are not supported. Ensure DNS is configured before attempting cert issuance.
**Detection:** CI/CD pipeline should verify HTTPS responds with valid cert post-deploy (`curl --fail https://domain.com/health`).

### Pitfall 3: Notification Fatigue Destroys User Trust

**What goes wrong:** Users get bombarded with notifications for every minor event -- every status change, comment, assignment. They disable notifications entirely or stop checking the app.
**Why it happens:** Developers implement notifications for all event types by default without frequency analysis. Diplomatic staff managing dozens of engagements could receive 50+ notifications per day.
**Consequences:** Users disable push permissions permanently (Chrome cannot re-ask after "Block"), email notifications go to spam due to volume, the notification center becomes useless noise.
**Prevention:**
1. Default to conservative notification settings: only assignments to you, approaching deadlines (24h and 1h), and stage transitions on engagements you own.
2. Implement email digest mode: batch non-urgent notifications into a daily summary email rather than individual emails per event.
3. Never notify a user about their own actions.
4. Add per-type, per-channel granular preferences from day one (in-app/email/push toggles per notification type).
5. Cap notification rate: max 1 notification per entity per hour for non-urgent types (coalesce "5 tasks updated on Engagement X" into one notification).
6. Separate notification types into urgency tiers: `immediate` (deadline in 1h, direct assignment), `standard` (stage transitions, new comments), `batch` (activity summaries, weekly digests).
**Detection:** Track notification dismiss-without-action rate. If >80%, the signal-to-noise ratio is wrong. Track push permission grant/revoke rates.

### Pitfall 4: Flaky E2E Tests That Block CI/CD

**What goes wrong:** Playwright tests pass locally but fail intermittently in CI, blocking every deploy. Team starts ignoring test failures or skipping tests.
**Why it happens:** Tests depend on timing (`waitForTimeout`), use brittle CSS selectors, share state between tests, or hit real Supabase where network latency varies. The app has Supabase Realtime subscriptions that race with test assertions.
**Consequences:** CI pipeline becomes unreliable. Developers merge with failing tests. E2E suite is abandoned within weeks.
**Prevention:**
1. Use Playwright's auto-waiting (`.click()`, `.fill()`, `.toBeVisible()`) -- never `waitForTimeout()`.
2. Use role-based and text-based locators (`getByRole`, `getByText`, `getByTestId`), not CSS class selectors.
3. Each test must be fully isolated: reset database state via API call in `beforeEach`, not shared global setup.
4. Mock external services (email provider, AI briefing) in E2E -- use Playwright's `route.fulfill()` for API mocking.
5. For Supabase Realtime, wait for specific DOM changes (`expect(locator).toBeVisible()`) rather than arbitrary timeouts.
6. Run tests with `--retries=2` in CI but investigate any test that needs retries frequently.
7. Set explicit viewport, locale, and `dir` in `playwright.config.ts` for RTL consistency.
8. Start with 5-10 critical flow tests, not 50. Cover: login, create dossier, assign task, view notifications, engagement lifecycle transition.
**Detection:** Track flaky test rate weekly. Any test failing >5% of runs gets flagged for rewrite.

### Pitfall 5: Backup Restore Never Actually Tested

**What goes wrong:** Supabase daily backups run automatically, but nobody has ever tested restoring one. When disaster strikes, restore fails due to missing role passwords, Storage object gaps, or extension conflicts.
**Why it happens:** "We have backups" feels safe. Testing restore requires a separate Supabase project and deliberate effort.
**Consequences:** Supabase daily backups do NOT include Storage API objects (uploaded files), only database metadata. Custom role passwords are not preserved. Extensions like `pg_net` and `pg_cron` may fire unintended actions during restore (e.g., cron jobs sending notifications from restored data). The project is inaccessible during restoration -- downtime scales with database size.
**Prevention:**
1. Test restore to a staging Supabase project at least once before going live, then quarterly thereafter.
2. Document the restore procedure: (a) disable `pg_net`/`pg_cron` post-restore, (b) reset custom role passwords, (c) verify Storage objects separately, (d) drop and recreate Realtime subscriptions if needed.
3. Back up Storage objects independently (Supabase Storage API export or sync to external S3).
4. Keep a restore runbook in the repo at `deploy/RESTORE_RUNBOOK.md`.
5. Supabase Realtime replication slot is handled automatically on restore, but custom subscriptions/slots must be recreated.
**Detection:** Calendar reminder for quarterly restore drill. Log the result. If restore hasn't been tested in 90 days, flag it.

---

## Moderate Pitfalls

### Pitfall 6: Email Deliverability Killed by Missing DNS Records

**What goes wrong:** Transactional emails (assignment notifications, deadline reminders, digests) land in spam or never arrive.
**Why it happens:** Missing or misconfigured SPF, DKIM, and DMARC DNS records. Using the email provider's shared sending domain instead of a verified custom domain.
**Consequences:** Users miss critical deadline notifications. Password reset emails fail. Users lose trust in the system entirely.
**Prevention:**
1. Set up SPF, DKIM, and DMARC on your sending domain before sending a single production email.
2. Use a dedicated subdomain for transactional email (e.g., `notify.yourdomain.com`) to isolate sender reputation from any future marketing email.
3. Never mix marketing and transactional email on the same domain or subdomain.
4. Disable link tracking and open tracking on transactional emails -- they make messages look suspicious to spam filters and are unnecessary for notifications.
5. Test deliverability with mail-tester.com before launch.
6. Validate recipient email addresses on signup to reduce bounces from typos and fake addresses.
**Detection:** Monitor bounce rate and delivery rate in your email provider dashboard. Alert if delivery rate drops below 98%.

### Pitfall 7: Push Notification Permission Prompt on First Visit

**What goes wrong:** Browser shows the native "Allow notifications?" prompt immediately when the user logs in. User clicks "Block" reflexively with no context.
**Why it happens:** Developers call `Notification.requestPermission()` in app initialization without context.
**Consequences:** Once blocked in Chrome, the user must manually navigate to `chrome://settings/content/notifications` to re-enable. Most users never will. That notification channel is permanently lost for that user.
**Prevention:**
1. Use a "soft ask" pattern: show a custom in-app dialog first explaining what notifications they'll receive ("Get notified about task assignments and approaching deadlines").
2. Only trigger the native browser prompt after the user clicks "Enable" on your custom dialog.
3. Best timing: after the user performs a relevant action (assigns a task, sets a deadline) -- "Want to be notified about updates to this engagement?"
4. Provide a notification preferences page where users can enable/disable push later.
5. Never auto-prompt on page load, login, or first visit.
6. Contextual prompts achieve 70-85% opt-in rates vs 40-60% for cold first-load prompts.
**Detection:** Track permission grant rate. If below 50%, the prompt timing is wrong.

### Pitfall 8: Docker Compose Production Anti-Patterns

**What goes wrong:** Development Docker Compose config used in production without hardening. Secrets exposed, no health checks, no resource limits, no log rotation.
**Why it happens:** `docker-compose.yml` works in dev, so it ships. The project already has `docker-compose.prod.yml` but it may lack production hardening.
**Consequences:** Security vulnerabilities, disk fills from unbounded logs, OOM kills from unconstrained containers, data loss from anonymous volumes.
**Prevention:**
1. Verify `docker-compose.prod.yml` has: health checks on all services, resource limits (CPU + memory), restart policies (`unless-stopped`), named volumes (not anonymous), and log rotation (`json-file` driver with `max-size: 10m`, `max-file: 3`).
2. Never hardcode secrets in Compose files -- use `.env` files excluded from git or Docker secrets.
3. Create dedicated Docker networks -- database container should not be on the same network as the reverse proxy.
4. Set `NODE_ENV=production` explicitly in the container environment.
5. Pin Docker image versions (not `latest` tag) for reproducible builds.
6. Review the existing `deploy/docker-compose.prod.yml` against this checklist before adding new services (Nginx, Certbot).
**Detection:** Run `docker compose -f docker-compose.prod.yml config` to verify no secrets exposed. Periodic `docker stats` monitoring.

### Pitfall 9: CI/CD Pipeline That Blocks All Deploys

**What goes wrong:** A strict CI pipeline with lint + typecheck + test + build + deploy stages blocks every deploy when any check fails. With 4500+ ESLint violations deferred from v2.0 and ESLint strict rules at warn level, enabling strict enforcement breaks everything.
**Why it happens:** Desire for quality gates conflicts with existing tech debt. Pipeline is all-or-nothing.
**Consequences:** Team bypasses CI entirely, removes checks, or deploys manually via SSH -- negating the entire CI/CD investment.
**Prevention:**
1. Phase CI checks: start with `build` + critical E2E only as required gates. Add lint/typecheck as informational (non-blocking) initially.
2. Use GitHub Actions with separate jobs: `build` (required), `e2e-critical` (required), `lint` (optional/informational), `deploy` (manual trigger initially, auto on main later).
3. Gate on new violations only: use ESLint baseline comparison so existing 4500+ violations don't block CI.
4. Keep deploy fast: build Docker image in CI, push to registry, SSH to droplet to pull and restart. Target: under 5 minutes total.
5. Add manual deploy override for emergencies (with audit log of who triggered it).
6. Store SSH deploy key as GitHub Actions secret, not in the workflow file.
**Detection:** Track mean deploy time and deploy frequency. If deploys slow to less than 1 per week, pipeline is too strict.

### Pitfall 10: Seed Data Violates Foreign Key Constraints or Feels Fake

**What goes wrong:** Seed script fails because tables are inserted in wrong order, violating foreign key constraints. Or seed data is obviously fake ("Test Country 1", "Lorem ipsum") and doesn't help users understand the system.
**Why it happens:** Complex schema with 8 dossier types, work items, relationships, junction tables (`work_item_dossiers`), and polymorphic documents. Insertion order matters and is non-obvious. Creating realistic diplomatic data requires domain knowledge.
**Consequences:** Seed script fails on fresh setup, new developers can't run the app locally, demo environments are empty or unconvincing.
**Prevention:**
1. Map the dependency graph of all tables before writing seed scripts. Insert in topological order: profiles -> dossiers (countries first, then orgs/forums) -> engagements -> work items -> junction tables -> documents.
2. Use Supabase's `supabase db seed` with a single `seed.sql` file that inserts in correct order.
3. Generate deterministic UUIDs (e.g., `uuid_generate_v5` with a namespace) so seeds are idempotent and can be referenced across tables.
4. Temporarily disable RLS during seeding (`SET session_replication_role = 'replica'`), re-enable after.
5. Include realistic Arabic and English content -- actual country names, plausible engagement titles, realistic diplomatic scenarios. This seed data doubles as a demo environment.
6. Make seed script idempotent: use `INSERT ... ON CONFLICT DO NOTHING` or truncate first.
7. Run seed script in CI on a fresh database to catch ordering issues immediately.
**Detection:** CI job that runs `supabase db reset` + seed on every PR touching migration or seed files.

---

## Minor Pitfalls

### Pitfall 11: Let's Encrypt Rate Limiting During Testing

**What goes wrong:** Repeatedly requesting certificates during setup/testing hits Let's Encrypt's rate limit (50 certificates per registered domain per week). Locked out for up to 7 days.
**Why it happens:** Running Certbot without `--dry-run` during development/debugging.
**Consequences:** Cannot obtain production certificates for up to a week. Production launch blocked.
**Prevention:** Always use `--dry-run` flag during testing. Use Let's Encrypt staging environment (`--staging`) for development. Only run production Certbot once, after dry-run succeeds. Document this in the deploy runbook.
**Detection:** Check Certbot logs for rate limit errors before reporting "HTTPS doesn't work."

### Pitfall 12: Realtime Subscription Leak in Notification Center

**What goes wrong:** Notification center component subscribes to Supabase Realtime on mount but doesn't unsubscribe on unmount. Multiple subscriptions accumulate as user navigates.
**Why it happens:** Missing cleanup in `useEffect`. React 19 Strict Mode double-mounts in development, exposing the issue early if developers are paying attention.
**Consequences:** Memory leaks, duplicate notifications displayed, hitting Supabase's concurrent connection limit (200 on free tier, higher on Pro).
**Prevention:**
1. Always return cleanup function from `useEffect` that calls `supabase.removeChannel()`.
2. Use a single shared subscription for notifications at the app level (in `_protected.tsx` layout), not per-component.
3. The project already uses Supabase Realtime with 1s debounce for the Operations Hub dashboard -- follow the exact same pattern for notifications.
4. The notification subscription should be established once on login and torn down on logout.
**Detection:** Monitor active Realtime connections in Supabase dashboard. Log subscription count in development. If count grows on navigation, there's a leak.

### Pitfall 13: E2E Tests Coupled to Arabic Translation Strings

**What goes wrong:** Tests use hardcoded Arabic strings for assertions. When translations change, tests break. Text-based locators fail due to Unicode normalization differences between environments.
**Why it happens:** Using `getByText('المهام')` seems correct for an Arabic-first app, and the project rules emphasize Arabic-first development.
**Consequences:** Translation updates break E2E tests. False negatives from Unicode normalization issues across OS/CI environments.
**Prevention:**
1. Use `data-testid` attributes for critical interaction points (buttons, navigation items, form fields).
2. For text assertions, use translation keys via a shared helper that loads the same i18n JSON files the app uses.
3. Prefer partial text matching (`{ exact: false }`) where text locators are used.
4. Test both Arabic and English locales explicitly -- create a test matrix in Playwright config.
5. Keep `data-testid` attributes even in production (they have negligible performance impact and are invisible to users).
**Detection:** If >3 tests break on a translation-only PR, locators are too tightly coupled to specific text.

### Pitfall 14: Monitoring Gaps -- No Alerting Until Users Report Outage

**What goes wrong:** Production runs fine for weeks, then Docker logs fill the disk, a memory leak causes OOM kill, or the SSL cert expires silently. Users discover the outage before the team.
**Why it happens:** Monitoring is deferred as "nice to have." DigitalOcean droplets have no alerting by default.
**Consequences:** Reputation damage, data loss during unmonitored outages, cert expiry causing HTTPS errors for all users.
**Prevention:**
1. Enable DigitalOcean Monitoring (free) for CPU, memory, and disk alerts with thresholds (CPU >80% for 5min, disk >85%, memory >90%).
2. Configure Docker log rotation in `docker-compose.prod.yml`: `logging: { driver: "json-file", options: { max-size: "10m", max-file: "3" } }` on every service.
3. Add uptime monitoring (UptimeRobot free tier or DigitalOcean uptime checks) for the HTTPS health endpoint.
4. Set cert expiry alert at 14 days before expiration (Certbot renewal failures are often silent).
5. Sentry is already configured -- verify it captures backend unhandled promise rejections and uncaught exceptions.
6. Add a `/health` endpoint that checks database connectivity, not just HTTP 200.
**Detection:** Monthly review of monitoring coverage. If any outage happens without an alert firing first, add the missing monitor immediately.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Notification schema design | Trigger coupling (#1), subscription leaks (#12) | Decouple delivery via webhooks + Edge Functions, shared Realtime channel |
| Notification preferences | Notification fatigue (#3) | Conservative defaults, per-type/per-channel controls, urgency tiers, digest mode |
| Email notifications | Deliverability (#6) | SPF/DKIM/DMARC on dedicated subdomain before first send |
| Browser push notifications | Permission UX (#7) | Soft-ask pattern, contextual timing after relevant user action |
| HTTPS setup | Bootstrap chicken-and-egg (#2), rate limiting (#11) | Two-phase Nginx config, always --dry-run first |
| CI/CD pipeline | Blocking deploys (#9) | Phase checks progressively, baseline ESLint comparison, manual override |
| Docker production hardening | Anti-patterns (#8), monitoring gaps (#14) | Audit docker-compose.prod.yml, health checks, log rotation, DO alerts |
| E2E test suite | Flaky tests (#4), Arabic text coupling (#13) | Auto-waiting, isolated state, data-testid, mock externals, both locales |
| Backup strategy | Untested restores (#5) | Test restore before launch, quarterly drills, separate Storage backup |
| Seed data | Foreign key ordering (#10) | Dependency graph, topological insert order, idempotent, realistic content |
| Realtime notifications | Subscription leaks (#12) | Single app-level channel, cleanup on unmount, connection count monitoring |

## Sources

- [Supabase Push Notifications Docs](https://supabase.com/docs/guides/functions/examples/push-notifications) - HIGH confidence
- [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups) - HIGH confidence
- [Supabase Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod) - HIGH confidence
- [Supabase Realtime Database Changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes) - HIGH confidence
- [Supabase Notification Strategy Discussion](https://github.com/orgs/supabase/discussions/13930) - MEDIUM confidence
- [Playwright Best Practices 2026 - BrowserStack](https://www.browserstack.com/guide/playwright-best-practices) - MEDIUM confidence
- [Playwright Flaky Tests Guide - BrowserStack](https://www.browserstack.com/guide/playwright-flaky-tests) - MEDIUM confidence
- [Push Notification Permission UX - web.dev](https://web.dev/articles/push-notifications-permissions-ux) - HIGH confidence
- [Push Notification Permission UX - Web Push Book](https://web-push-book.gauntface.com/permission-ux/) - MEDIUM confidence
- [Email Deliverability Tips - Resend](https://resend.com/blog/top-10-email-deliverability-tips) - MEDIUM confidence
- [Transactional Email Best Practices 2026 - Postmark](https://postmarkapp.com/guides/transactional-email-best-practices) - HIGH confidence
- [Docker Nginx Certbot Auto-Renewal](https://github.com/JonasAlfredsson/docker-nginx-certbot) - MEDIUM confidence
- [SSL in Docker Containers - DEV Community](https://dev.to/marrouchi/the-challenge-about-ssl-in-docker-containers-no-one-talks-about-32gh) - MEDIUM confidence
- [Supabase Realtime I/O Management](https://dev.to/vitorbrangioni/effective-real-time-database-monitoring-with-supabase-and-postgresql-a-guide-to-minimizing-overhead-and-managing-io-f0b) - MEDIUM confidence
- [Deploying to DigitalOcean with GitHub Actions](https://www.digitalocean.com/community/tech-talks/deploying-to-digitalocean-with-github-actions) - MEDIUM confidence
- [Supabase Restore Documentation](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) - HIGH confidence

---

_Researched: 2026-04-06 for v4.0 "Live Operations" milestone_
