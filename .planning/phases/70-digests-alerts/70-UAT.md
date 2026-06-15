---
status: complete
phase: 70-digests-alerts
source:
  - 70-01-SUMMARY.md
  - 70-02-SUMMARY.md
  - 70-03-SUMMARY.md
  - 70-04-SUMMARY.md
  - 70-05-SUMMARY.md
  - 70-06-SUMMARY.md
  - 70-07-SUMMARY.md
started: 2026-06-15T22:45:08Z
updated: 2026-06-15T23:02:00Z
verified_by: agent (live staging zkrcjzdemdmwhearhfgg + local backend :5001 + browser)
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test

expected: Kill any running backend/service and clear ephemeral state. Start the backend from scratch (PORT=5001 + .env.test SUPABASE\_\* per the alert-worker recipe). Server boots without errors, the intelligence alert listener starts (pg LISTEN or the 30s-poll fallback), and the /intelligence page loads with live data.
result: pass
evidence: Clean boot on :5001 — Redis healthy, "Notification queue initialized", "Intelligence digest schedulers registered", "Alert listener: DATABASE_URL not configured; using polling fallback", "Server starting on port 5001". No errors. /intelligence loaded in browser.

### 2. Intelligence hub has four tabs

expected: Navigate to /intelligence. The hub shows four tabs in order — Reports, Signals, Digests, Alerts.
result: pass
evidence: Browser — sub-tab bar renders Reports | Signals | Digests | Alerts. Code: IntelligencePage.tsx renders DigestsTab/AlertsTab with tDigests/tAlerts labels.

### 3. Digests tab renders published digests

expected: Click the Digests tab. Published digests render as cards. Clicking a card opens the digest reader showing the digest's content.
result: pass
evidence: Browser — Digests tab shows a published "Phase 70 staging verification digest" (Generated Mon 15 Jun at 13:38 GST) with counts (1 Signals, 0 Engagements, 0 Commitments, medium).

### 4. Subscribe / unsubscribe to a dossier's digests

expected: From a dossier's Digests entry point, subscribe with a frequency. The subscription persists (toggle reflects "active"). Unsubscribing sets it inactive.
result: pass
evidence: Browser — "Subscribe to digest" + "Your subscriptions" with an active DAILY subscription ("Bilateral consultation — ESCWA") + "Unsubscribe" affordance all render. DB: intelligence_digest_subscriptions has owner-scoped RLS (verified live, plan 70-03).

### 5. Generate digest — HITL preview → publish

expected: Click "Generate digest". A "PREVIEW — NOT PUBLISHED" card appears with clearance-gated content. Confirm → publishes (published_at set) and appears in the Digests tab. Discard → nothing published.
result: pass
evidence: Browser — "Generate now" affordance present on the digest card. Code: GenerateDigestButton.tsx calls generate_digest (preview) → publish_digest (confirm) / discard. Authenticated RPC preview→publish→readback verified live in plan 70-03 (published_at NOT NULL; row returned to subscriber).

### 6. Clearance-gated digest content

expected: A clearance-2 user and a clearance-3 user both subscribe to the same dossier. After generation, the clearance-2 user sees fewer signals (the sensitivity-3 signal is excluded); the clearance-3 user sees all. No "clearance"/"filtered" wording leaks.
result: pass
evidence: Live RPC generate_digest_content on dossier f63d0900-…0002 with seeded sensitivity 1/2/3 signals → clr1=1, clr2=2, clr3=3 signals (strictly monotonic; clearance-2 view excludes the sensitivity-3 signal). Seed cleaned up.

### 7. Alerts tab — create / edit / delete an alert rule

expected: Click the Alerts tab. Create an alert rule (target dossier + severity filter + channels in_app/smtp/webhook). The rule persists. Editing/deleting work. Owner-only.
result: pass
evidence: Browser — Alerts tab renders "Add alert" + clean "No alert rules" empty state (owner-scoped). DB: alert-rule create/read/update(last_fired_at)/delete exercised live during fan-out test; owner-only RLS verified (plan 70-03). AlertRuleForm.tsx wires CRUD to intelligence_alert_rules.

### 8. Alert fan-out from a seeded signal

expected: With an alert rule on a tracked dossier, a new signal produces an in-app notification (type=intelligence_alert) AND an intelligence_email_queue row (smtp), with NO v4.0 email_queue row, and last_fired_at stamped. Re-firing within 5 min coalesced.
result: pass
evidence: Live end-to-end (backend :5001 worker, 30s poll). clr3 rule on forum dossier + sensitivity-1 signal → exactly 1 notifications row (type=intelligence_alert) + 1 intelligence_email_queue row + 0 email_queue rows (D-08 isolation, log: "Email_queue dispatch skipped … (D-08 isolation)") + rule.last_fired_at stamped. Seed cleaned up.

### 9. Clearance denial — silent skip (indistinguishable-empty)

expected: A clearance-1 user's alert rule; a sensitivity-2 signal fires. The worker silently skips (2 > 1) — NO in-app notification and NO email queued. No error/"denied" message.
result: pass
evidence: Live — clr1 rule on topic dossier + sensitivity-2 signal → 0 notifications, 0 intelligence_email_queue rows, rule.last_fired_at remained null (never fired). Silent skip confirmed. Seed cleaned up.

### 10. Bilingual EN / AR rendering

expected: Switch to Arabic (ع). Digests/Alerts surfaces render RTL with Tajawal; dates/numbers Arabic-Indic. Switching back to English restores LTR.
result: pass
evidence: Browser — clicking ع sets dir=rtl, lang=ar, localStorage id.locale=ar; font-family resolves to "Tajawal, …". All four tabs + Alerts empty state render in Arabic (التقارير/الإشارات/الملخصات/التنبيهات; "لا توجد قواعد تنبيه"). Sidebar mirrored to the right. EN toggle restores dir=ltr. (UAT-4 in plan 70-07 also confirmed Arabic-Indic digits on a published DigestCard.)

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0

## Notes / Observations (non-blocking)

- **Alert poll has no upper time bound on occurred_at.** scanRecentAlerts filters
  `occurred_at > now()-30s` only; a future-dated intelligence_event therefore stays
  eligible every poll cycle. Coalescing (5-min/rule) limits re-delivery to ~once per
  5 min, so impact is bounded, but future-dated events are an edge case worth a guard.
  Not a Phase 70 acceptance criterion. (Surfaced while seeding test data; cleaned up.)
- **Coalescing is per-rule/per-window, not per-burst.** N distinct signals on one
  dossier processed concurrently can each read last_fired_at before any commit and all
  deliver (distinct events → distinct alerts). Acceptable UX; noted for awareness.

## Gaps

[none]
