---
phase: 70
slug: digests-alerts
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-16
---

# Phase 70 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register authored at plan time across all 7 PLAN.md `<threat_model>` blocks
> (`register_authored_at_plan_time: true`). This audit verifies each declared
> mitigation is present in the shipped implementation; implementation files were
> read-only and no new-threat scan was performed.

---

## Trust Boundaries

| Boundary                                              | Description                                                                     | Data Crossing                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------- |
| npm registry → local install                          | External packages enter the backend dependency tree                             | Package code (nodemailer, pg, @types/\*)       |
| Backend cron (service-role) → intelligence_digest     | Service-role writes digest rows; per-subscriber clearance is app-layer enforced | Clearance-filtered digest content              |
| intelligence_event INSERT → pg_notify → backend       | Trigger payload must carry no classified content                                | Event IDs + sensitivity/severity metadata only |
| Caller JWT → INVOKER RPCs                             | RLS enforces clearance; no service-role bypass in interactive path              | Subscriber-scoped digest/alert data            |
| Supabase MCP → live staging DB                        | DDL applied to production-equivalent staging                                    | Schema, RPCs, triggers, policies               |
| Backend alert worker → external webhook URL           | Outbound HTTP; D-10 payload contract is the only content boundary               | Generic label + deep link                      |
| Backend SMTP / drain → on-prem relay                  | Outbound email egress isolated to `intelligence_email_queue`                    | Notification email body                        |
| HTTP request → Express API routes                     | User-supplied dossier_id/period/channels validated before DB write              | Subscription + alert-rule input                |
| Frontend → generate_digest / read_digests INVOKER RPC | Caller JWT clearance limits returned content                                    | Clearance-bounded preview/published digests    |
| AlertRuleForm → intelligence_alert_rules INSERT       | Owner RLS; organization_id from authenticated profile, not body                 | Alert-rule definitions                         |
| Backend startServer → startAlertListener              | pg LISTEN connected only after queue worker is initialized                      | Startup ordering invariant                     |

---

## Threat Register

All 27 threats verified CLOSED with code evidence by gsd-security-auditor (opus) on 2026-06-16.

| Threat ID | Category               | Component                                           | Disposition | Mitigation                                                                                                       | Status |
| --------- | ---------------------- | --------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- | ------ |
| T-70-01   | Tampering              | npm install (nodemailer, pg, @types/\*)             | mitigate    | Human checkpoint verified npmjs.com legitimacy + clean `npm audit` before install; 4 packages pinned             | closed |
| T-70-SC   | Tampering              | npm/pip/cargo installs                              | mitigate    | Plan 01 checkpoint covered all packages; Plan 07 added no new installs                                           | closed |
| T-70-02   | Information Disclosure | generate_digest_content RPC clearance arg           | mitigate    | `p_clearance_level INTEGER` filters `sensitivity_level <= p_clearance_level`; empty = `[]` (no "filtered" label) | closed |
| T-70-03   | Information Disclosure | notify_intelligence_alert trigger payload           | mitigate    | pg_notify payload = event_id/org/sensitivity/severity/occurred_at only; no title/content                         | closed |
| T-70-04   | Elevation of Privilege | profiles.user_id vs profiles.id in RLS              | mitigate    | All DDL uses `WHERE user_id = auth.uid()`; `profiles.id` grep = 0                                                | closed |
| T-70-05   | Denial of Service      | Duplicate cron rows (concurrent workers)            | mitigate    | `UNIQUE (subscriber_id, dossier_id, frequency, period)`; worker catches 23505                                    | closed |
| T-70-06   | Information Disclosure | intelligence_email_queue cross-contamination        | mitigate    | Separate table, service_role-only RLS; no shared policies with v4.0 email_queue                                  | closed |
| T-70-07   | Elevation of Privilege | generate_digest_content callable by authenticated   | mitigate    | `REVOKE ... FROM authenticated` + `GRANT ... TO service_role` only                                               | closed |
| T-70-08   | Tampering              | Migration apply on live staging                     | mitigate    | Applied via MCP after 70-02 committed; fixup migration shipped and applied                                       | closed |
| T-70-09   | Elevation of Privilege | profiles.user_id RLS landmine in live policies      | mitigate    | Static grep = 0 + live staging policy verification confirms user_id                                              | closed |
| T-70-10   | Information Disclosure | generate_digest_content accessible by authenticated | mitigate    | All 4 RPCs SECURITY INVOKER; content RPC service_role-only GRANT                                                 | closed |
| T-70-11   | Information Disclosure | smtpAdapter routing through email_queue             | mitigate    | Enqueues isolated `intelligence_email_queue`; never references v4.0 email_queue (intent met — see note)          | closed |
| T-70-12   | Information Disclosure | webhookAdapter leaking title/severity               | mitigate    | Reads only `genericLabel` + `deepLink` (D-10 contract)                                                           | closed |
| T-70-13   | Information Disclosure | pg_notify forwarded without clearance check         | mitigate    | Worker reads owner clearance via user_id; silent skip if sensitivity > clearance (no denial log)                 | closed |
| T-70-14   | Information Disclosure | SMTP egress via existing email_queue                | mitigate    | Isolated `intelligence_email_queue`; email-send edge fn never invoked (intent met — see note)                    | closed |
| T-70-15   | Elevation of Privilege | alert worker using profiles.id                      | mitigate    | Clearance lookup uses `.eq('user_id', rule.owner_id)`                                                            | closed |
| T-70-16   | Elevation of Privilege | /subscribe sets organization_id to other tenant     | mitigate    | org derived from `req.user.organization_id`, never from request body                                             | closed |
| T-70-17   | Information Disclosure | cron logs clearance_level                           | mitigate    | clearance_level used only as RPC arg; never logged                                                               | closed |
| T-70-18   | Elevation of Privilege | /generate /publish using supabaseAdmin              | mitigate    | Routes use `callerSupabase(req)` JWT client; INVOKER RLS enforces clearance                                      | closed |
| T-70-19   | Tampering              | stale alerts.service.ts stub importers              | mitigate    | DB-backed CRUD (1 importer); old stub moved to monitoring-alerts.service.ts (1 importer); no crossover           | closed |
| T-70-20   | Information Disclosure | DigestCard/Reader clearance-filter status           | mitigate    | Empty sections show generic copy + 0 count only; no "filtered by clearance" text                                 | closed |
| T-70-21   | Elevation of Privilege | AlertRuleForm webhook channel to leak content       | mitigate    | webhook adapter enforces D-10 contract server-side regardless of form input                                      | closed |
| T-70-22   | Information Disclosure | i18n namespace not registered (AR fallback)         | mitigate    | Both intelligence-digests + intelligence-alerts namespaces registered (en+ar)                                    | closed |
| T-70-23   | Information Disclosure | GenerateDigestButton previews above-clearance       | mitigate    | `generate_digest` SECURITY INVOKER — caller JWT clearance bounds preview JSONB                                   | closed |
| T-70-24   | Tampering              | digest sub-router mounted before auth               | mitigate    | Sub-routers under authenticated `/api` tree; per-handler `getAuth(req)`                                          | closed |
| T-70-25   | Elevation of Privilege | startAlertListener before queue worker init         | mitigate    | Listener starts after scheduler registration + worker init; ordering enforced                                    | closed |
| T-70-26   | Information Disclosure | webhook/SMTP POST body logged                       | mitigate    | Adapters log no request body/payload; only config-skip / send-success metadata                                   | closed |

_Status: open · closed_
_Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)_

### Verification Evidence (file:line)

| Threat ID | Evidence                                                                                                                                                                                  |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-70-01   | `backend/package.json:52,55,66,68` (nodemailer 9.0.0 / pg 8.21.0 / @types/nodemailer 8.0.1 / @types/pg 8.20.0); `pnpm-lock.yaml:7401,7640,4571,4589`; checkpoint `70-01-SUMMARY.md:74,84` |
| T-70-SC   | `70-01-SUMMARY.md:74`; `backend/package.json` deps unchanged in Plan 07                                                                                                                   |
| T-70-02   | `20260615_phase70_digests_alerts.sql:627` param; `:674,706,733,755` `sensitivity_level <= p_clearance_level`; empty = `'[]'::jsonb`                                                       |
| T-70-03   | `20260615_phase70_digests_alerts.sql:309-318` payload keys = event_id/org/sensitivity/severity/occurred_at                                                                                |
| T-70-04   | `profiles.id` grep = 0; `user_id = auth.uid()` at `digests_alerts.sql:221,277,295,353,532` + `publish_digest_tenant_fix.sql:29`                                                           |
| T-70-05   | UNIQUE `digests_alerts.sql:36-37`; 23505 catch `intelligence-digest.service.ts:284`                                                                                                       |
| T-70-06   | `digests_alerts.sql:232,251,253` separate service_role-only `intelligence_email_queue`; no email_queue refs in intelligence code                                                          |
| T-70-07   | `digests_alerts.sql:762-765` REVOKE from authenticated, GRANT service_role                                                                                                                |
| T-70-08   | `publish_digest_tenant_fix.sql` shipped; live-apply `70-03-SUMMARY.md:51,83,103`                                                                                                          |
| T-70-09   | Static grep 0; live `70-03-SUMMARY.md:67,108`                                                                                                                                             |
| T-70-10   | INVOKER `:339,517,631,786`; content RPC service_role-only `:762-765`; live `70-03-SUMMARY.md:65,68`                                                                                       |
| T-70-11   | `smtp-adapter.ts:16` isolated `intelligence_email_queue`; zero `email_queue` imports (intent — see note)                                                                                  |
| T-70-12   | `webhook-adapter.ts:16,22` reads only genericLabel + deepLink; label fixed at worker `:244` / service `:314`                                                                              |
| T-70-13   | `intelligence-alert.worker.ts:199` user_id lookup; `:256-259` silent `continue` on sensitivity > clearance                                                                                |
| T-70-14   | `smtp-adapter.ts:16` isolated queue; email-send edge fn never invoked (intent — see note)                                                                                                 |
| T-70-15   | `intelligence-alert.worker.ts:199` `.eq('user_id', rule.owner_id)`                                                                                                                        |
| T-70-16   | `intelligence-digest.ts:77,78,88` org from `getAuth(req)`, not body; service `:209`                                                                                                       |
| T-70-17   | `intelligence-digest.scheduler.ts:97,100` clearance used only as arg; logs `:91,106,155` carry none                                                                                       |
| T-70-18   | `intelligence-digest.ts:44-54,132,156` `callerSupabase(req)` JWT client, not supabaseAdmin                                                                                                |
| T-70-19   | `alerts.service.ts:59,81,104,117` (1 importer `intelligence-alerts.ts:9`); stub `monitoring-alerts.service.ts:75` (1 importer `contract/monitoring.ts:2`)                                 |
| T-70-20   | `DigestCard.tsx:64` / `DigestReader.tsx:88-91` counts only, no filter label                                                                                                               |
| T-70-21   | `webhook-adapter.ts:14-25` server-side contract independent of `AlertRuleForm.tsx:304-320`                                                                                                |
| T-70-22   | `i18n/index.ts:394-395` (en) + `:526-527` (ar); imports `:256-259`                                                                                                                        |
| T-70-23   | `GenerateDigestButton.tsx:77` caller-JWT rpc; `generate_digest` INVOKER `:339` + filters `:416,448,475,497`                                                                               |
| T-70-24   | `intelligence.ts:97-98` sub-routers under `/api` (`index.ts:93`); per-handler `getAuth`                                                                                                   |
| T-70-25   | `index.ts:154` scheduler before `:157` listener; both after worker init `:139-145`                                                                                                        |
| T-70-26   | `smtp-adapter.ts` no success log; `webhook-adapter.ts:9` config-skip only, no payload log                                                                                                 |

### Note on superseded register wording (T-70-11 / T-70-14)

The plan-time register described the SMTP mitigation as "smtpAdapter uses nodemailer
directly." The shipped implementation instead **enqueues into the isolated
`intelligence_email_queue` table** and defers the actual nodemailer send to a
separate on-prem drain worker (research finding RF-1, decision D-08). The
security-relevant intent of both threats — keep intelligence email egress isolated
from the v4.0 `email_queue` / email-send edge function so cross-channel content
cannot leak — is fully satisfied: no intelligence code path references `email_queue`,
and the queue table is service_role-only. Marked CLOSED on intent; the "nodemailer
directly" phrasing is stale documentation, not a security gap.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
| ------- | ---------- | --------- | ----------- | ---- |

No accepted risks. All 27 threats carry a `mitigate` disposition and are CLOSED with code evidence.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By                      |
| ---------- | ------------- | ------ | ---- | --------------------------- |
| 2026-06-16 | 27            | 27     | 0    | gsd-security-auditor (opus) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log (none)
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-16
