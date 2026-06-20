---
status: resolved
resolved: 2026-06-16T02:00:00Z
trigger: 'Phase 70 intelligence ALERT fan-out is broken — live UAT-2 FAIL. BullMQ rejects colon job IDs in intelligence-alert.worker.ts; plus orphaned intelligence_email_queue, in_app/email_queue isolation gap, notifications.type enum mismatch, smtp/webhook unconfigured.'
created: 2026-06-16T00:00:00Z
updated: 2026-06-16T01:30:00Z
---

## Reasoning Checkpoint (pre-fix)

reasoning_checkpoint:
hypothesis: "Two confirmed defects. (P0) intelligence-alert.worker.ts builds BullMQ custom job IDs containing ':' which BullMQ 5.77.1 rejects → zero alerts enqueue. (D-08) notification.processor.ts unconditionally inserts email_queue for every notification, so the intelligence in_app channel (type intelligence_alert/intelligence_digest via in-app-adapter) leaks a v4.0 email_queue row."
confirming_evidence: - "Live log 2026-06-16 00:27:22: 'Custom Id cannot contain :' at Job.validateOptions (bullmq 5.77.1); 0 notifications/0 email_queue/last_fired_at NULL on staging." - "in-app-adapter.ts line 10 emits type 'intelligence_digest'|'intelligence_alert'; notification.processor.ts L98 inserts email_queue unconditionally for that type."
falsification_test: "After hyphen jobIds: a matching signal enqueues and dispatches in_app → a notifications row, NO email_queue row. If colon still present or email_queue row appears for an intelligence in_app notification, hypothesis is wrong."
fix_rationale: "jobId: replace ':' with '-'; event_id and rule.id are UUIDs (no colons) so per-(event) and per-(event,rule) uniqueness preserved (D-07 dedup key intact). D-08: gate the email_queue dispatch block to skip when type is an intelligence type, producing notifications row only. Skip ONLY the email block — push block left reachable and byte-identical for all types."
blind_spots: "Push block must stay untouched and reachable for intelligence types (cannot early-return inside the function). Non-intelligence email behavior must remain byte-identical. Existing tests assert OLD colon jobIds and must be updated (same code path)."

## Current Focus

hypothesis: CONFIRMED (live) — backend/src/queues/intelligence-alert.worker.ts builds BullMQ custom job IDs containing ":" (`alert:${event_id}:${rule.id}:check` and `alert:${event_id}:check`). BullMQ 5.77.1 throws `Custom Id cannot contain :` on every .add() → zero alerts ever enqueued → no dispatch on any channel.
test: Replace ":" with "-"/"\_" in both jobId templates (keep uniqueness — it is the D-07 coalescing-dedup key), then re-run the live repro and confirm a notifications row is created with no email_queue leak.
expecting: After the fix, a new matching signal produces an enqueued job → processIntelligenceAlertJob dispatches in_app → a notifications row for the rule owner; rule.last_fired_at is stamped; NO v4.0 email_queue row.
next_action: APPLIED tasks 1-4 (jobId hyphen fix + D-08 email_queue isolation + colon-guard regression test; backend build PASS, tsc 0 errors, 64 intelligence/notification tests PASS). Commits 46066f55 / aec2e3e1 / 999f9e32 on main (unpushed). DEFERRED to user checkpoint: (a) notification_type enum lacks 'intelligence_alert'/'intelligence_digest' (secondary #4) and (b) intelligence_email_queue orphan vs smtp-adapter direct-send (secondary #2). Live UAT-2 re-run waits on those two decisions. Note from BullMQ source: the per-event jobId (3 colon-segments) actually validated; only the per-rule jobId (4 segments) threw — both now hyphenated.

## Symptoms

expected: A new intelligence_event on a dossier with an active intelligence_alert_rules row (severity in filter, sensitivity_level <= owner clearance) is delivered to the rule's channels — in_app writes a notifications row, isolated from the v4.0 email_queue path (D-08). UAT-2 pass condition: notifications row + (per plan) intelligence_email_queue row exist for the owner; NO email_queue row.
actual: Every alert enqueue throws; zero alerts dispatched on any channel; no notifications row created; intelligence_alert_rules.last_fired_at stays null.
errors: 'Error: Custom Id cannot contain :' at Job.validateOptions (node_modules/.pnpm/bullmq@5.77.1/.../classes/job.js:1049), surfaced as winston log "Alert listener: failed to enqueue rule check" (backend/logs/all4.log, 2026-06-16 00:27:22).
reproduction: Start backend (cwd backend, PORT=5001, export SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY from .env.test; DATABASE_URL unset → alert listener uses 30s polling fallback). Insert an active intelligence_alert_rules row (owner with clearance, channels incl in_app, condition_config.severity_filter=['high','urgent']). Insert an intelligence_event (severity 'high', sensitivity_level <= owner clearance) + intelligence_event_dossiers link on the rule's dossier. Within ~30s: "failed to enqueue rule check" in logs, no notifications row, last_fired_at null. Staging project = zkrcjzdemdmwhearhfgg (Supabase MCP).
started: Present since the 70-07 implementation (commit 5a320ad1 "wire intelligence digest alerts end to end"); the colon jobId was in the worker as originally written. Surfaced at live UAT-2 on 2026-06-16. The digest side (UAT-1/3/4/5) all passed live.

## Eliminated

- hypothesis: BullMQ/Redis connection misconfiguration (maxRetriesPerRequest)
  evidence: backend/src/queues/queue-connection.ts correctly sets maxRetriesPerRequest:null + enableReadyCheck:false; Redis connected/ready in the boot log; other queue jobs (deadline checker) run fine. The failure is jobId validation, not connection.
  timestamp: 2026-06-16T00:30:00Z

- hypothesis: Environmental / local-only (would work in prod)
  evidence: bullmq is pinned at 5.77.1; the "Custom Id cannot contain :" validation is version-intrinsic and deterministic — it fails identically anywhere.
  timestamp: 2026-06-16T00:30:10Z

## Evidence

- timestamp: 2026-06-16T00:27:22Z
  checked: backend/logs/all4.log after live repro on staging
  found: '{"error":{"message":"Custom Id cannot contain :","name":"Error","stack":"Error: Custom Id cannot contain :\n at Job.validateOptions (bullmq@5.77.1/dist/cjs/classes/job.js:1049) ..."},"message":"Alert listener: failed to enqueue rule check","ruleId":"aa876330-..."}'
  implication: The enqueue in enqueueMatchingAlertJobs (and enqueueAlertCheck) fails on the colon jobId; processIntelligenceAlertJob never runs; no channel dispatched.

- timestamp: 2026-06-16T00:27:30Z
  checked: staging DB after repro (Supabase MCP) — notifications, intelligence_email_queue, email_queue, intelligence_alert_rules.last_fired_at
  found: 0 notifications for owner, 0 intelligence_email_queue, 0 email_queue, last_fired_at NULL.
  implication: Confirms total non-delivery — consistent with the enqueue throwing before dispatch.

- timestamp: 2026-06-16T00:20:00Z
  checked: grep "intelligence_email_queue" across backend/src + supabase/functions
  found: NO writer anywhere. backend/src/adapters/intelligence/smtp-adapter.ts direct-sends via nodemailer and returns early if SMTP_HOST unset.
  implication: The intelligence_email_queue table (migration-created) is orphaned; UAT-2's "intelligence_email_queue row exists" assertion is unimplementable as built.

- timestamp: 2026-06-16T00:21:00Z
  checked: backend/src/adapters/intelligence/in-app-adapter.ts → notification.service enqueueNotification → backend/src/queues/notification.processor.ts
  found: processNotificationJob inserts into email_queue (~L98) in addition to the notification, and uses an RPC p_type with type='intelligence_alert' (notifications.type enum lacks intelligence values).
  implication: in_app channel is not isolated from the v4.0 email_queue path (D-08 violation, latent); and a possible enum/type mapping issue downstream of the enqueue fix.

- timestamp: 2026-06-16T01:10:00Z
  checked: live staging (zkrcjzdemdmwhearhfgg) via Supabase MCP — notifications.type column kind + enum labels, intelligence_email_queue columns, current row/rule counts
  found: 'notifications.type is a POSTGRES ENUM named notification_type (USER-DEFINED), NOT a text+CHECK. Live enum labels (5): commitment_assigned, commitment_due_soon, after_action_published, edit_approved, edit_rejected — NEITHER intelligence_alert NOR intelligence_digest is present. The create_categorized_notification RPC inserts p_type directly into the column, so an intelligence type will THROW invalid_input_value at INSERT even after the jobId fix. intelligence_email_queue exists with 10 cols (recipient_id, recipient_email, subject, body_html, body_text, deep_link, queued_at, sent_at, retry_count, id) — exact smtp-payload shape. Current state: iemq_rows=0, active_rules=0, fired_rules=0 (the original repro seed rule was cleaned up).'
  implication: Secondary #4 is a HARD blocker for in_app dispatch (enum INSERT throws), not merely a latent mapping issue — requires ALTER TYPE ADD VALUE (×2, one-way) or a remap of the adapter type label; a DB migration decision. Secondary #2 table is purpose-built for the smtp payload but has no writer. Both are genuine design choices → escalated to user checkpoint (AskUserQuestion unavailable in session-manager subagent). Live UAT-2 re-run needs active rules re-seeded.

## Secondary Issues (reconcile during fix)

1. [P0 — primary] Colon jobId in intelligence-alert.worker.ts (enqueueMatchingAlertJobs + enqueueAlertCheck). Replace ":" with a BullMQ-legal separator; keep uniqueness (dedup/coalescing key). — DONE (commit 46066f55, hyphen separator).
2. [High] intelligence_email_queue orphaned vs smtp-adapter direct-send. Decide: wire smtp adapter → intelligence_email_queue (matches research RF-1 + the table + UAT-2 assertion), OR keep direct-send and amend the UAT-2/VALIDATION assertion to match. Reconcile so the live UAT-2 assertion is satisfiable. — PENDING USER DECISION (see Pending Decisions).
3. [High] in_app not isolated from email_queue: in-app-adapter → processNotificationJob writes email_queue (notification.processor.ts ~L98). Per D-08, the intelligence in_app channel must not write the v4.0 email_queue. Provide an in-app-only write path (notifications row only) or gate the email_queue insert. — DONE (commit aec2e3e1, gated the email_queue block to skip for intelligence types; push block + non-intelligence behavior unchanged).
4. [Med→High] notifications.type is a POSTGRES ENUM notification_type with no 'intelligence_alert'/'intelligence_digest' (live labels: commitment_assigned, commitment_due_soon, after_action_published, edit_approved, edit_rejected). The RPC inserts p_type directly → in_app INSERT THROWS until reconciled. Add the enum values (one-way migration) OR remap the adapter type to an existing label. — PENDING USER DECISION (see Pending Decisions).
5. [Config] smtp + webhook unverifiable on staging (SMTP_HOST / INTELLIGENCE_WEBHOOK_URL unset — customer-TBD). webhook body is D-10-correct ({text: genericLabel, potentialAction:[deep-link]}, no content). Live verify in_app now; smtp/webhook verify when infra exists (or via the queue, per #2).

## Fix Applied (2026-06-16T01:20:00Z)

- jobId fix — backend/src/queues/intelligence-alert.worker.ts:
  - enqueueAlertCheck L67: `alert:${event_id}:check` → `alert-${event_id}-check`
  - enqueueMatchingAlertJobs L105: `alert:${event_id}:${rule.id}:check` → `alert-${event_id}-${rule.id}-check`
  - UUIDs contain no colons, so per-(event) and per-(event,rule) uniqueness (D-07 dedup key) is intact. BullMQ 5.77.1 validation (`includes(':') && split(':').length !== 3`): the 3-segment per-event ID actually passed before; only the 4-segment per-rule ID threw (matches the live log carrying ruleId). Both now colon-free.
  - Commit 46066f55.
- D-08 isolation — backend/src/queues/notification.processor.ts:
  - Added `isIntelligenceNotification = type === 'intelligence_alert' || type === 'intelligence_digest'`; wrapped the email_queue dispatch block so intelligence types skip it (logInfo on skip) and all other types keep the byte-identical email_queue insert in the else branch. notifications RPC + push block untouched/reachable for all types.
  - Commit aec2e3e1.
- Regression guard — backend/tests/intelligence/alert-fanout.integration.test.ts:
  - describe "ALERT-02 regression: BullMQ-legal job IDs (no colon)" (3 tests): asserts the real worker-generated jobIds (`alert-event-1-check`, `alert-event-1-rule-1-check`) contain no ":" and match /^alert-[^:]+(-[^:]+)?-check$/ and satisfy the exact BullMQ 5.77.1 predicate; plus a sanity test proving the OLD 4-segment colon ID would be rejected. Two pre-existing assertions updated to the hyphen IDs (same code path).
  - Commit 999f9e32.
- Verification: `pnpm run build` (backend) PASS; `tsc --noEmit` 0 errors backend-wide; 64/64 intelligence + notification-processor tests PASS. Pre-commit hook (build + lint-staged) passed on all 3 commits. Unpushed on main. (Unrelated pre-existing working-tree changes .planning/config.json + frontend/src/routeTree.gen.ts deliberately left uncommitted.)

## Specialist Review (typescript)

ecc:typescript-reviewer — LOOKS_GOOD on all three fixes.

- jobId templates idiomatic; UUIDs can never reintroduce ":"; two dedup key-spaces don't collide (per-rule form always carries the extra -<rule> segment).
- D-08 gate is a clean boolean on type, short-circuits ONLY the email_queue insert; notifications RPC + push block reachable; non-intelligence behavior unchanged.
- Regression test meaningfully guards the failure mode (reimplements the BullMQ predicate, asserts real generated IDs, sanity-checks the old colon ID is rejected).
- LOW notes (non-blocking): test hard-copies the BullMQ predicate (pinned to 5.77.1 with a comment — acceptable); two beforeEach blocks duplicate mock setup (pre-existing); D-08 gate keys on string literals — if a 3rd intelligence type is added it would silently leak to email_queue (consider a typed set if more types are expected).

## Pending Decisions (require user checkpoint — escalated to orchestrator)

AskUserQuestion is unavailable in the session-manager subagent context, so these two genuine design/migration choices are returned to the /gsd:debug orchestrator for the user to resolve before the final two changes + live UAT-2:

- DECISION 1 (Secondary #4 — notification enum): notifications.type is a live postgres enum (notification_type) missing intelligence_alert/intelligence_digest; the RPC inserts the type directly so in_app INSERT THROWS. Options: (A) ALTER TYPE notification_type ADD VALUE 'intelligence_alert' + 'intelligence_digest' via Supabase MCP migration on staging (semantically correct, one-way enum migration); (B) remap intelligence types → an existing label in in-app-adapter.ts (no migration, but conflates semantics / mislabels UI filtering); (C) decide later (leave in_app enum-failing).
- DECISION 2 (Secondary #2 — intelligence_email_queue): the purpose-built table exists with the exact smtp payload shape but has no writer; smtp-adapter direct-sends via nodemailer (no-ops when SMTP_HOST unset, which it is on staging). Options: (A) wire smtp-adapter to INSERT into intelligence_email_queue (matches research RF-1 + the table + the UAT-2 assertion; works on staging without SMTP infra; a drainer can send later); (B) keep direct-send and amend the UAT-2/VALIDATION assertion (leaves the migrated table orphaned); (C) decide later (verify only in_app for UAT-2).

After DECISION 1 (likely A) and DECISION 2: re-seed an active intelligence_alert_rules row + intelligence_event + intelligence_event_dossiers link on staging, re-run live UAT-2 (notifications row for owner + last_fired_at stamped + NO email_queue leak + intelligence_email_queue assertion per DECISION 2), then write 70-07-SUMMARY.md and close Phase 70. Any DB change via Supabase MCP migration on zkrcjzdemdmwhearhfgg; new RPCs INVOKER; clearance via profiles.user_id=auth.uid().

## Why mocked tests missed it

channel-adapter.test.ts + alert-fanout.integration.test.ts pass but never exercise the real BullMQ .add() (colon validation) or the DB enum/RLS. Add a test that exercises the real enqueue path (or asserts jobId has no ":") to prevent regression. — DONE for the jobId path (regression guard above). The DB enum mismatch (Secondary #4) is still uncaught by tests because NotificationJobData.type is typed as plain `string` and the mocked queue never hits the enum INSERT; a true integration test against staging would catch it post-DECISION 1.
