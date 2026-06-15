---
phase: 70
slug: digests-alerts
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-15
---

# Phase 70 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `70-RESEARCH.md` § Validation Architecture. Per-task rows below are
> `TBD` until `/gsd:plan-phase` assigns task IDs/plans/waves; the Nyquist auditor
> fills and flips `nyquist_compliant` after planning.

---

## Test Infrastructure

| Property               | Value                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------- |
| **Framework**          | Vitest 4.1.7 (backend unit/integration) + Playwright (E2E, frontend)               |
| **Config file**        | `backend/vitest.config.ts` + `backend/vitest.integration.config.ts`                |
| **Quick run command**  | `pnpm --filter intake-backend test -- --run tests/intelligence/`                   |
| **Full suite command** | `pnpm --filter intake-backend test -- --run && pnpm --filter intake-frontend test` |
| **Estimated runtime**  | TBD — Wave 0 establishes the `tests/intelligence/` baseline (target < 60s quick)   |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter intake-backend test -- --run tests/intelligence/`
- **After every plan wave:** Run `pnpm test && pnpm --filter intake-frontend typecheck`
- **Before `/gsd:verify-work`:** Full suite + Playwright E2E (`e2e/intelligence-digests.spec.ts`) green
- **Max feedback latency:** target < 60 seconds (quick); confirm against Wave 0 baseline

---

## Per-Task Verification Map

> Task ID / Plan / Wave columns are `TBD` until planning. Requirement → test mapping
> is locked from research; threat refs wire to each PLAN's `<threat_model>` (see § Security below).

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior                                                                                                                                                                   | Test Type   | Automated Command                                               | File Exists | Status     |
| ------- | ---- | ---- | ----------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------- | ----------- | ---------- |
| TBD     | TBD  | TBD  | DIGEST-01   | — (PLAN)   | Subscribe/unsubscribe persists to `intelligence_digest_subscriptions` (`is_active` toggle); owner-only RLS                                                                        | unit        | `vitest tests/intelligence/subscriptions.test.ts`               | ❌ W0       | ⬜ pending |
| TBD     | TBD  | TBD  | DIGEST-02   | — (PLAN)   | Service-role cron emits per-subscriber clearance-gated content (`sensitivity_level <= clearance`); two accounts → strictly different digests; indistinguishable-empty             | integration | `vitest tests/intelligence/digest-cron.integration.test.ts`     | ❌ W0       | ⬜ pending |
| TBD     | TBD  | TBD  | DIGEST-03   | — (PLAN)   | Published digest renders in `/intelligence` Digests tab (EN + AR)                                                                                                                 | E2E         | `playwright test e2e/intelligence-digests.spec.ts`              | ❌ W0       | ⬜ pending |
| TBD     | TBD  | TBD  | DIGEST-04   | — (PLAN)   | `generate_digest` (INVOKER) returns clearance-gated preview; `publish_digest` (INVOKER) commits only on approval                                                                  | integration | `vitest tests/intelligence/generate-digest.integration.test.ts` | ❌ W0       | ⬜ pending |
| TBD     | TBD  | TBD  | ALERT-01    | — (PLAN)   | Alert rule (target dossier + structured condition + severity filter) persists to `intelligence_alert_rules`; owner-only RLS                                                       | unit        | `vitest tests/intelligence/alert-rules.test.ts`                 | ❌ W0       | ⬜ pending |
| TBD     | TBD  | TBD  | ALERT-02    | — (PLAN)   | Seeded signal on tracked dossier → delivered to in_app + on-prem SMTP + webhook; coalescing guard prevents N× fan-out; no cloud egress (forced-error: block SendGrid/Resend URLs) | integration | `vitest tests/intelligence/alert-fanout.integration.test.ts`    | ❌ W0       | ⬜ pending |
| TBD     | TBD  | TBD  | ALERT-03    | — (PLAN)   | `ChannelAdapter` dispatches all 3 channels; isolated from v4.0 personal-notification dispatch (no regression)                                                                     | unit        | `vitest tests/intelligence/channel-adapter.test.ts`             | ❌ W0       | ⬜ pending |
| TBD     | TBD  | TBD  | ALERT-04    | — (PLAN)   | Webhook/Teams payload carries ONLY deep-link + generic label — zero dossier name / signal title / severity / counts (hard contract, no verbosity knob)                            | unit        | `vitest tests/intelligence/webhook-payload-contract.test.ts`    | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `backend/tests/intelligence/subscriptions.test.ts` — stubs for DIGEST-01
- [ ] `backend/tests/intelligence/digest-cron.integration.test.ts` — stubs for DIGEST-02
- [ ] `backend/tests/intelligence/generate-digest.integration.test.ts` — stubs for DIGEST-04
- [ ] `backend/tests/intelligence/alert-rules.test.ts` — stubs for ALERT-01
- [ ] `backend/tests/intelligence/alert-fanout.integration.test.ts` — stubs for ALERT-02
- [ ] `backend/tests/intelligence/channel-adapter.test.ts` — stubs for ALERT-03
- [ ] `backend/tests/intelligence/webhook-payload-contract.test.ts` — stubs for ALERT-04
- [ ] `e2e/intelligence-digests.spec.ts` — stubs for DIGEST-03 (Playwright)
- [ ] `pnpm --filter intake-backend add nodemailer @types/nodemailer` — on-prem SMTP transport dep (RF-1; not currently installed)
- [ ] Confirm/add `pg` (node-postgres) for LISTEN/NOTIFY alert trigger, with a 30s-poll fallback (RF-5)

---

## Manual-Only Verifications

> Live staging (`zkrcjzdemdmwhearhfgg`), seed → observe → restore, EN + AR. RLS denial
> verified via CDP `Network.setBlockedURLs` forced-error protocol (assert empty-state /
> `role="alert"`, NOT HTTP status).

| Behavior                                                     | Requirement                     | Why Manual                                                                             | Test Instructions                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Subscribe → digest → render → unsubscribe (EN + AR)          | DIGEST-01, DIGEST-02, DIGEST-03 | Cross-clearance live render in both languages; needs real accounts + RTL/Tajawal check | User A (clearance 2) + User B (clearance 3) both subscribe to one dossier (weekly). Seed 2 signals (sensitivity 2 + 3). Generate per user: A sees only the level-2 signal, B sees both. Verify `intelligence_digest` rows + `clearance_level_at_generation`. A unsubscribes → `is_active=false`. Repeat UI in Arabic. |
| Alert fan-out across 3 channels from one seeded signal       | ALERT-02, ALERT-03              | Real SMTP queue + webhook POST inspection; multi-channel side effects                  | User C (clearance 2) creates alert rule on a dossier (channels `in_app`,`smtp`,`webhook`). Insert `intelligence_event` (sensitivity 1, severity `high`). DB trigger → `pg_notify` → worker → all 3 channels. Verify `notifications` row, `intelligence_email_queue` SMTP recipient, webhook POST body.                |
| External payload zero-leak contract (MEDIUM-sensitivity)     | ALERT-04                        | Must inspect raw outbound body; the diplomatic need-to-know floor                      | Insert signal sensitivity 2, title "Sensitive diplomatic development". Seed webhook alert rule (clearance-2 user). Intercept outbound POST: assert `body.text` does NOT contain the title; equals the generic label only; no `subject`/`signalCount`/severity.                                                        |
| RLS / clearance denial (indistinguishable-empty)             | DIGEST-02, ALERT-02             | Negative path; absence-of-delivery is the assertion                                    | User D (clearance 1) alert rule; insert signal sensitivity 2. Worker clearance check 2>1 → silently skip. Verify NO `notifications` row and NO email queued for D. CDP-block SMTP/webhook URLs and assert no blocked requests for this flow.                                                                          |
| `generate_digest` preview → confirm → publish HITL (EN + AR) | DIGEST-04                       | Direct RPC invocation + manual approval affordance (agent surface is P72/P73)          | Call `generate_digest(dossier_id,'weekly')` — verify clearance-gated JSONB preview. Call `publish_digest(...)` — verify `intelligence_digest.published_at NOT NULL` and the row appears in the `/intelligence` Digests tab.                                                                                           |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (8 test files + nodemailer/pg installs)
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
