# Phase 20: Live Operations Bring-Up — Context

**Milestone:** v4.0
**Status:** Planning
**Depends on:** Phase 14, Phase 17, Phase 18

## Goal (verbatim from ROADMAP.md)

Complete every human verification checkpoint for v4.0 and provision the staging actors required to run them, so v4.0 can be audited `passed` and archived.

## Scope

Verification + bring-up only. **No new product code.** This phase closes the 24 `human_needed` checkpoints recorded across `14-VERIFICATION.md`, `15-VERIFICATION.md`, `16-VERIFICATION.md`, `18-VERIFICATION.md` and the `17-UAT.md` blockers.

## Success Criteria (verbatim from ROADMAP.md, all 24)

1. Staging has a real, active admin user (`auth.users` + `public.users` + `user_roles` all populated) usable for manual UAT sessions
2. Three E2E seed accounts exist on staging — `admin@e2e.test`, `analyst@e2e.test`, `intake@e2e.test` — with known passwords stored as GitHub Actions secrets
3. `populate_diplomatic_seed()` has been invoked once against an empty staging DB under a real admin JWT; resulting scenario matches SEED-01/02/03 (bilingual names, enum coverage, `is_seed_data = true` on every seeded row)
4. FirstRunModal has been manually UAT'd in a live browser: renders, dismisses (localStorage persists), RTL correct in Arabic
5. Production domain DNS points at droplet, certbot has obtained a valid TLS certificate, `verify-deployment.sh` passes with the real domain
6. `DROPLET_HOST` + `DROPLET_SSH_KEY` GitHub Actions secrets are configured; at least one successful live deploy has run through `.github/workflows/deploy.yml`
7. External uptime monitor (UptimeRobot or Betterstack) is watching `/health` and has fired at least one test alert
8. Redis backup cron is installed on the droplet and has produced at least one verified non-empty `.rdb` file under `/opt/intl-dossier/backups/redis/`
9. Supabase restore procedure from `deploy/BACKUP_RESTORE.md` has been rehearsed against staging and verified to produce a data-consistent restore
10. `deploy/rollback.sh` has been exercised live on the droplet (rollback tags exist, health checks pass before + after)
11. Bell icon + unread badge + notification center panel + category tabs render correctly in both EN and AR
12. Task assignment produces a Sonner toast within ~5s of dispatch; notification appears in the Assignments tab
13. Mark-as-read (individual + bulk) updates badge and persists across reloads
14. Backend logs confirm async dispatch via BullMQ worker (`Notification worker ready`, `Notification queue initialized` on startup)
15. NOTIF-06 preference toggle is respected end-to-end (toggle OFF → no toast; toggle ON → toast appears)
16. RTL rendering of notification panel + toast is correct in Arabic
17. Triggering an overdue-deadline notification for `email_enabled=true` user produces a bilingual HTML `email_queue` row
18. A daily-digest-processor job produces a digest `email_queue` row matching the user's locale (`dir=rtl` for Arabic users)
19. PushOptInBanner renders inside NotificationPanel (soft-ask) on first visit; Enable + Dismiss buttons are tappable (44px targets)
20. VAPID push delivery works end-to-end: enabling push + triggering an urgent notification produces a real browser push event with correct bilingual title/body
21. GitHub Actions E2E secrets exist: `E2E_BASE_URL`, `E2E_ADMIN_EMAIL/PASSWORD`, `E2E_ANALYST_EMAIL/PASSWORD`, `E2E_INTAKE_EMAIL/PASSWORD`, `E2E_SUPABASE_URL`, `E2E_SUPABASE_SERVICE_ROLE_KEY`
22. Full Playwright suite has run against staging: `pnpm exec playwright test --project=chromium-en --project=chromium-ar-smoke` produced a clean green run (or env-gated specs skipped cleanly)
23. A deliberately-failing E2E run has been triggered in CI; screenshot PNG + Playwright trace zip appear under `playwright-failure-N` artifacts; merged HTML report appears under `playwright-report`
24. GitHub branch protection on `main` requires `E2E (shard 1/2)`, `E2E (shard 2/2)`, and `Merge Playwright reports` status checks before merging

## Inventory: human_needed Checkpoints

### From `14-VERIFICATION.md` (Phase 14 — Production Deployment)

- DEPLOY-01: DNS purchase + certbot HTTPS activation (Human Verification item 1)
- DEPLOY-02: GitHub Actions secrets + live deploy run (item 2)
- DEPLOY-03: External uptime monitor configuration + test alert (item 3)
- DEPLOY-04a: Redis backup cron install + first run (item 4)
- DEPLOY-04b: Supabase restore test against staging (item 5)
- DEPLOY-05: Rollback end-to-end test on droplet (item 6)

### From `15-VERIFICATION.md` (Phase 15 — Notification Backend / In-App)

- NOTIF-01: Bell icon + notification panel live render (item 1)
- NOTIF-02: Task assignment toast + panel entry (item 2)
- NOTIF-07: Mark-as-read live UI (item 3)
- NOTIF-08: Async dispatch confirmation via backend logs (item 4)
- NOTIF-06: Notification preferences respected end-to-end (item 5)
- NOTIF-01/07 AR: Arabic RTL layout of panel + toast (item 6)

### From `16-VERIFICATION.md` (Phase 16 — Email & Push Channels)

- NOTIF-03: Email alert delivery end-to-end (item 1)
- NOTIF-04: Digest email generation (item 2)
- NOTIF-09a: PushOptInBanner visual render (item 3)
- NOTIF-05 / NOTIF-09b: Browser push delivery end-to-end (item 4)

### From `18-VERIFICATION.md` (Phase 18 — E2E Test Suite)

- TEST-11a: Full Playwright suite run against staging (item 1)
- TEST-11b: CI failure artifact upload confirmation (item 2)
- TEST-11c: GitHub branch protection configuration (item 3)
- TEST-11d: GitHub Actions E2E secrets provisioning (item 4)

### From `17-UAT.md` (Phase 17 — Seed Data & First Run, deferred blockers)

- SEED-04: `populate_diplomatic_seed()` end-to-end invocation as real admin (Test 4)
- SEED-05: FirstRunModal renders on `/dashboard` when empty + admin (Test 5)
- SEED-06: localStorage dismissal persists (Test 6)
- SEED-07: Arabic RTL FirstRunModal (Test 7)
- SEED-08: Three E2E seed accounts provisioned — deferred blocker (Test 8)

**Total: 25 human checkpoints** (14-VERIFICATION bundles item 4 and item 5 as DEPLOY-04; in this phase we track them separately).

## Plan Split Rationale

Five plans, grouped by the human actor and physical system being exercised:

- **20-01 — Staging Identity & Seed:** Supabase dashboard work (admin user, 3 E2E accounts, `populate_diplomatic_seed`, FirstRunModal browser UAT). Closes SEED-04..08 and success criteria 1–4.
- **20-02 — Production Domain, TLS & First Live Deploy:** Registrar + droplet + certbot + GitHub secrets + first deploy pipeline run. Closes DEPLOY-01, DEPLOY-02 and criteria 5–6.
- **20-03 — Backup, Restore & Rollback Rehearsal:** Redis cron, Supabase restore rehearsal, `rollback.sh` live exercise. Closes DEPLOY-04a/b, DEPLOY-05 and criteria 8–10.
- **20-04 — Monitoring & Alerting:** UptimeRobot/Betterstack `/health` probe + test alert. Closes DEPLOY-03 and criterion 7.
- **20-05 — Notifications Live UAT (In-App + Email + Push + E2E Pipeline):** Ten live browser checkpoints for notifications (NOTIF-01..09) plus the four TEST-11 CI checkpoints. Closes criteria 11–24.

Splitting 20-05 from 20-04 keeps the monitoring bring-up independent (it can be done before notifications are verified). The E2E pipeline items ride along in 20-05 because they need the same set of running staging accounts already provisioned in 20-01.

## Risks

- **DNS propagation delay** may block 20-02 for several hours; certbot HTTP-01 challenges fail until A record propagates.
- **Let's Encrypt rate limits** (5 duplicate certs per week, 50 certs per registered domain per week) — do NOT re-run certbot in a loop during debugging.
- **Supabase restore rehearsal data exposure** — restore MUST target a staging project, NEVER production. See `deploy/BACKUP_RESTORE.md` Known Risks (role passwords, pg_net, pg_cron).
- **VAPID push** requires HTTPS origin — cannot be verified until 20-02 succeeds.
- **Rollback rehearsal requires a prior successful deploy** — sequence 20-02 before 20-03.
- **Sending plaintext E2E passwords through chat is forbidden** — store directly into GitHub Secrets via the GitHub UI.

## Execution Order

1. 20-01 (identity + seed) — no droplet dependency, can start immediately
2. 20-02 (domain + TLS + first deploy) — parallel with 20-01
3. 20-03 (backup/restore/rollback) — after 20-02 completes
4. 20-04 (monitoring) — after 20-02 completes (needs the public domain)
5. 20-05 (notifications + E2E pipeline) — after 20-01, 20-02 complete

## Evidence Capture

All evidence (screenshots, command output, log excerpts, GitHub Actions run URLs) goes under:

```
.planning/phases/20-live-operations-bring-up/evidence/
  20-01/   # Supabase admin user screenshot, seed row counts, FirstRunModal EN + AR screenshots
  20-02/   # dig output, certbot success log, verify-deployment.sh output, GH Actions run URL
  20-03/   # ls -lh backups/redis, restore rehearsal notes, rollback.sh stdout
  20-04/   # Monitor config screenshot, test alert email/SMS screenshot
  20-05/   # Bell/panel screenshots EN+AR, backend log excerpt, email_queue row dump, push DevTools
           # GH Actions green run URL, failing run artifacts URL, branch protection screenshot
```

Each plan's `## Verification` section lists the exact artefact filenames expected.

## Non-Goals

- No new migrations (Supabase MCP is not used in this phase — identity provisioning is dashboard-driven).
- No new tests or product code.
- No change to deploy workflow source — only secret provisioning and first live invocation.
