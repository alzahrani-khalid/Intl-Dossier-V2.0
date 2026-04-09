# Phase 20-01 — FirstRunModal Live UAT Summary

**Date:** 2026-04-09
**Operator:** Khalid Alzahrani (`kazahrani@stats.gov.sa`)
**Tooling:** Playwright MCP (browser automation) + Supabase MCP (DB state)
**Target:** http://138.197.195.242 (staging droplet, pre-domain)
**Browser session:** logged-in admin session of `kazahrani@stats.gov.sa` (existing localStorage token)

## Sequence

1. Captured pre-wipe DB snapshot → `01..03,05a` evidence files
2. Wiped all `is_seed_data = true` rows across 11 tables → `04` evidence
3. Cleared `intl-dossier:first-run-dismissed` localStorage key + reloaded `/dashboard`
4. Captured **EN modal** → `06-firstrun-modal-en.png`
5. Clicked "Close" (X) button → modal dismissed → `localStorage['intl-dossier:first-run-dismissed'] = "true"`
6. Reloaded `/dashboard` → modal did NOT reappear → `07-firstrun-dismiss-reload.png`
7. Cleared dismissed key, set `i18nextLng=ar`, reloaded
8. Captured **AR modal** → `08-firstrun-modal-ar.png`; verified `<html dir="rtl" lang="ar">` and `dialog[dir="rtl"]`, font = Readex Pro (Arabic)
9. Clicked "تعبئة البيانات النموذجية" → live RPC re-seed → counts restored to baseline → `05b`
10. Restored locale to EN and re-set `first-run-dismissed=true` so other operators are not interrupted

## Checkpoint Closure

| UAT ID  | Description                                                   | Status                   | Evidence                                                            |
| ------- | ------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| SEED-04 | `populate_diplomatic_seed()` invoked end-to-end as real admin | ✅ passed                | `05a`, `05b` (live UI invocation, even stronger than plan SQL path) |
| SEED-05 | FirstRunModal renders on `/dashboard` when empty + admin (EN) | ✅ passed                | `06-firstrun-modal-en.png`                                          |
| SEED-06 | localStorage dismissal persists across reload                 | ✅ passed                | `07-firstrun-dismiss-reload.png` + key dump in this file            |
| SEED-07 | Arabic RTL FirstRunModal renders correctly                    | ✅ passed                | `08-firstrun-modal-ar.png` + DOM dir attributes                     |
| SEED-08 | Three E2E seed accounts provisioned                           | ✅ passed (pre-existing) | `02-e2e-accounts.txt`, `03-gh-secrets.txt`                          |

## Phase 20 Success Criteria 1–4

- ✅ **Criterion 1** — real admin user (auth.users + public.users + user_roles): 7 admins exist, evidence `01`
- ✅ **Criterion 2** — three E2E seed accounts + GH secrets: all present, evidence `02` + `03`
- ✅ **Criterion 3** — `populate_diplomatic_seed()` against empty DB under real admin: re-verified end-to-end via live UI, evidence `05a` + `05b`
- ✅ **Criterion 4** — FirstRunModal UAT'd live in EN and AR, dismissal persists: evidence `06`, `07`, `08`

## Notes / Minor Findings

1. **Schema drift** — Plan 20-01 Step 3 specifies `user_roles.role = 'intake_officer'` for `intake@e2e.test`, but the actual `user_roles` enum on staging has values `{admin, analyst, staff}`. The intake account is correctly configured as `staff`. Plan should be updated to match.

2. **Localization gap (non-blocking)** — In the Arabic modal, the close-button `aria-label` is still `"Close"` (English). All visible UI strings are Arabic, but the screen-reader label was missed by the i18n pass. Worth a follow-up issue, not a blocker for Phase 20.

3. **localStorage key** — actual key is `intl-dossier:first-run-dismissed` (with project prefix), not the `first-run-dismissed` shown in the original plan. Plan should be updated.

4. **`check_first_run()` admin gate** — when called from MCP (no JWT), `can_seed` returns false even on empty DB. This is correct behavior; the in-app code path with a real admin JWT correctly resolves `can_seed = true` (proven by the modal rendering).

5. **Pre-existing baseline** — All 24 success criteria items 1–3 were already satisfied on staging before this UAT session. Khalid had previously provisioned the admins, the E2E accounts, the GH secrets, and the seed data. This UAT session was the first time the FirstRunModal had actually been exercised live in a browser; the wipe-test-reseed cycle was needed only to drive criterion 4.
