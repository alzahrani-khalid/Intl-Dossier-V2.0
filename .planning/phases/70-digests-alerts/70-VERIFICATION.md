---
phase: 70-digests-alerts
verified: 2026-06-16T13:26:20Z
status: passed
score: 5/5 success criteria verified (2 with acknowledged customer-config carry-forwards)
verified_by: human-accepted (conversational verify-work) over agent-run UAT (10/10 pass, live staging + browser)
---

# Phase 70: Digests + Alerts Verification Report

**Phase Goal:** Recurring digests and threshold alerts reach subscribers across in-app, email, and external channels, with all content clearance-gated.
**Verified:** 2026-06-16T13:26:20Z
**Status:** passed

This report records the human-accepted verification of Phase 70. The substance was
established by the complete agent-run UAT (`70-UAT.md`, 10/10 passed against live
staging `zkrcjzdemdmwhearhfgg` + local backend `:5001` + browser). The user reviewed
that record and accepted the pass; this report maps the 5 ROADMAP success criteria to
that evidence and records the acknowledged carry-forward gaps.

## Goal Achievement — Success Criteria

| #   | Success criterion                                                                       | Status                                                     | Evidence                                                                                                                                                                                                                                                                                                                             |
| --- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Subscribe to a dossier/topic digest, view it in-app, unsubscribe — live EN+AR           | ✓ VERIFIED                                                 | UAT 3 (Digests tab renders published digests), UAT 4 (subscribe/unsubscribe persists, owner-scoped RLS), UAT 10 (RTL/Tajawal/Arabic-Indic in both EN and AR)                                                                                                                                                                         |
| 2   | Threshold alert delivered to in-app, on-prem SMTP email, and external webhook           | ◑ VERIFIED (code + queue); live external delivery deferred | UAT 8: in-app notification (type=intelligence_alert) + `intelligence_email_queue` row both confirmed live; D-08 isolation (no v4.0 `email_queue` row) confirmed; ChannelAdapter layer (3 adapters incl. webhook) built + tested (70-04). On-prem SMTP **drain worker** + webhook URL are customer-config — see Acknowledged Gap RF-1 |
| 3   | External payloads carry only deep-links, zero classified content (MEDIUM signal)        | ? UNCERTAIN (code complete; not exercised live)            | Webhook adapter constructs deep-link-only payloads (70-04); cannot be exercised end-to-end without a configured webhook URL — see Acknowledged Gap RF-1                                                                                                                                                                              |
| 4   | Service-role digest pipeline with per-subscriber clearance gating                       | ✓ VERIFIED                                                 | UAT 6: live `generate_digest_content` on a dossier with seeded sensitivity 1/2/3 signals → clr1=1, clr2=2, clr3=3 signals (strictly monotonic; clr2 view excludes the sensitivity-3 signal). UAT 9: clr1 alert rule + sensitivity-2 signal → silent skip, 0 deliveries                                                               |
| 5   | `generate_digest` HITL tool shows bilingual confirm card, publishes only after approval | ✓ VERIFIED                                                 | UAT 5: preview ("PREVIEW — NOT PUBLISHED") → publish (published_at set) → readback to subscriber verified live; discard publishes nothing. GenerateDigestButton.tsx wires preview→publish/discard                                                                                                                                    |

**Score:** 5/5 criteria met at the implementation + live-data level; criteria 2 and 3 carry an acknowledged customer-config dependency (RF-1) for live external (SMTP/webhook) delivery.

## Requirements Coverage

| Requirement                                                    | Status               | Note                                                                                             |
| -------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------ |
| DIGEST-01..04 (subscribe / generate / clearance-gate / render) | ✓ SATISFIED          | UAT 3,4,5,6,10                                                                                   |
| ALERT-01 (rule CRUD, owner-only)                               | ✓ SATISFIED          | UAT 7                                                                                            |
| ALERT-02 (in-app delivery on trigger)                          | ✓ SATISFIED          | UAT 8 (live)                                                                                     |
| ALERT-03 (on-prem SMTP email)                                  | ◑ SATISFIED (queued) | UAT 8 — mail lands in `intelligence_email_queue`; actual SMTP send needs the drain worker (RF-1) |
| ALERT-04 (external webhook, deep-link-only)                    | ◑ SATISFIED (code)   | adapter built/tested; live send needs a configured webhook URL (RF-1)                            |

## Acknowledged Gaps

Recorded per the verify-work artifact-scan gate. The user reviewed these and chose to
proceed; none is a Phase 70 acceptance defect.

- **RF-1 — On-prem SMTP transport + external webhook delivery (carry-forward).**
  Alerts are enqueued to `intelligence_email_queue` and the webhook adapter is built and
  tested, but the **on-prem SMTP drain worker** (drains the queue when `SMTP_HOST` is set)
  and the **external webhook URL** are customer-provided/TBD (per STATE.md). Live
  end-to-end delivery on the SMTP and webhook channels (success criteria 2 & 3) is
  therefore not exercisable on staging. Tracked as a follow-up, not a P70 blocker.
- **RF-2 — `intelligence_digest` schema fit.** Resolved during execution; digest
  generate/publish/render verified live (UAT 3, 5).
- **RF-3 — Per-subscriber clearance in the cron path.** Resolved; clearance gating
  verified live on both the digest path (UAT 6) and the alert path (UAT 9).

## Verification Metadata

**Verification approach:** Human-accepted over agent-run UAT (goal-backward against ROADMAP success criteria)
**UAT source:** `70-UAT.md` (status: complete, 10/10 passed)
**Security gate:** `70-SECURITY.md` status=verified, threats_open=0
**Human checks required:** Live SMTP/webhook delivery (RF-1) — deferred to customer config

---

_Verified: 2026-06-16T13:26:20Z_
_Verifier: Claude (conversational verify-work, human-accepted)_
