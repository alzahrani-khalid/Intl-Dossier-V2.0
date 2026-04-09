---
plan: 20-01
phase: 20-live-operations-bring-up
title: Staging Identity & Seed
status: complete
started: 2026-04-09
completed: 2026-04-09
---

## What Was Built

Provisioned the staging environment with real actors and seed data:

1. **Admin user** created in Supabase Auth + mirrored to `public.users` + `user_roles` (7 admins total)
2. **3 E2E accounts** (`admin@e2e.test`, `analyst@e2e.test`, `intake@e2e.test`) with passwords stored as GitHub Actions secrets
3. **`populate_diplomatic_seed()`** invoked successfully — seed countries, orgs, forums, engagements inserted with `is_seed_data = true`
4. **FirstRunModal UAT** passed in both English and Arabic RTL, dismiss + localStorage persistence confirmed

## Key Files

- `evidence/20-01/01-admin-user.txt`
- `evidence/20-01/02-e2e-accounts.txt`
- `evidence/20-01/03-gh-secrets.txt`
- `evidence/20-01/05-seed-counts-before.txt`
- `evidence/20-01/05-seed-counts-after.txt`
- `evidence/20-01/06-firstrun-modal-en.png`
- `evidence/20-01/07-firstrun-dismiss-reload.png`
- `evidence/20-01/08-firstrun-modal-ar.png`
- `evidence/20-01/09-firstrun-uat-summary.md`

## Schema Drift Notes

- `intake_officer` role → actual enum is `staff` (plan typo)
- localStorage key is `intl-dossier:first-run-dismissed` (with project prefix)
- `E2E_BASE_URL` and `E2E_SUPABASE_URL` already provisioned ahead of Plan 20-05
- Arabic close button `aria-label` not localized (non-blocking follow-up)

## Requirements Closed

- SEED-01, SEED-02, SEED-03
- 17-UAT Tests 4–8 (SEED-04 through SEED-08)

## Self-Check: PASSED
