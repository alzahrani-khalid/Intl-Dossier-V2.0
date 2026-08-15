---
phase: 92-session-integrity-edge-function-auth
kind: deploy-ledger
started_by: 92-04
project_ref: zkrcjzdemdmwhearhfgg
---

# Phase 92 — staging deploy ledger

One line per named-function deploy against staging (`zkrcjzdemdmwhearhfgg`). Started by plan `92-04`;
later plans (`92-09` in particular, which owns the four `intelligence-*` importers) append to it.

**Deploy command** (never bare `supabase functions deploy` — that would push all 303 functions and
re-resolve carets on functions this phase does not own):

```
supabase functions deploy <name> --project-ref zkrcjzdemdmwhearhfgg
```

CLI `supabase` v2.106.0. Timestamps are UTC, captured immediately **before** each deploy invocation.
`OK` means the command printed `Deployed Functions on project zkrcjzdemdmwhearhfgg: <name>` and
exited 0; every line below was observed, none typed from expectation.

## 92-04 deploys

| #   | Function                      | Deployed (UTC)       | Bundle   | Result | Why deployed                           |
| --- | ----------------------------- | -------------------- | -------- | ------ | -------------------------------------- |
| 1   | audit-logs-viewer             | 2026-08-15T10:29:21Z | 741.9 kB | OK     | Class-1 core (D-19), observed 401      |
| 2   | data-retention                | 2026-08-15T10:29:31Z | 740.3 kB | OK     | Class-1 core (D-19), observed 401      |
| 3   | field-permissions             | 2026-08-15T10:29:37Z | 736.3 kB | OK     | Class-1 core (D-19), observed 401      |
| 4   | my-delegations                | 2026-08-15T10:29:44Z | 732.5 kB | OK     | AUTH-04 auth half, observed 401        |
| 5   | auth-biometric-setup          | 2026-08-15T10:29:53Z | 737.2 kB | OK     | `_shared/auth.ts` importer — re-bundle |
| 6   | auth-refresh-token            | 2026-08-15T10:29:59Z | 762.2 kB | OK     | `_shared/auth.ts` importer — re-bundle |
| 7   | embeddings-generate           | 2026-08-15T10:30:06Z | 719.3 kB | OK     | `_shared/auth.ts` importer — re-bundle |
| 8   | notifications-register-device | 2026-08-15T10:30:11Z | 738.0 kB | OK     | `_shared/auth.ts` importer — re-bundle |
| 9   | push-notification             | 2026-08-15T10:30:16Z | 739.5 kB | OK     | `_shared/auth.ts` importer — re-bundle |
| 10  | sync-push                     | 2026-08-15T10:30:22Z | 738.0 kB | OK     | `_shared/auth.ts` importer — re-bundle |

**10 / 10 OK. No retries were needed — no deploy failed.**

### Helper-importer note (D-06)

Editing `_shared/auth.ts` redeploys nothing by itself; each importer must be deployed to re-bundle
the helper. Rows 5–10 are the six importers **outside** the 2.3x sweep population. The other four
importers — `intelligence-batch-update`, `intelligence-get`, `intelligence-refresh`,
`intelligence-refresh-v2` — are in the sweep population and are deployed by plan **92-09** after
their own sweep edits. Until 92-09 lands, those four still run a bundle carrying the old
`_shared/auth.ts` pin. That is by design, not an omission.

## Probe: baseline vs post-deploy (D-16 / D-21)

Command, run from the repo root after the deploys above:

```
bash scripts/probe-edge-auth.sh audit-logs-viewer data-retention field-permissions my-delegations
```

Verbatim stdout:

```
audit-logs-viewer -> 500
data-retention -> 500
field-permissions -> 200
my-delegations -> 200
```

| Function          | Baseline (pre-migration) | Post-deploy | Auth gate             |
| ----------------- | ------------------------ | ----------- | --------------------- |
| audit-logs-viewer | 401                      | **500**     | PASSED (was REJECTED) |
| data-retention    | 401                      | **500**     | PASSED (was REJECTED) |
| field-permissions | 401                      | **200**     | PASSED (was REJECTED) |
| my-delegations    | 401                      | **200**     | PASSED (was REJECTED) |

Baseline codes are quoted from `92-PROBE-BASELINE.md` §1 ("Actual output (verbatim)"), captured at
`phase-92-base` before any Phase 92 production edit.

Per the D-16 verdict rule, **401 means auth rejected; any other status means the request passed the
`getUser` gate.** All four flipped off 401, so all four now accept a valid session JWT.

The two `500`s are **past the auth gate** and are pre-existing data-layer defects that the 401 was
previously masking. They are diagnosed, with their verbatim error bodies, in `92-04-SUMMARY.md`
under `PRE-EXISTING DEFECTS NEWLY EXPOSED` — including the correction they force on this plan's
D-20 handoff claim. Do not read `500` here as "auth still broken"; do not read it as "closed",
either.

## 92-09 deploys — the full derived population (D-09)

Deploy set derived, never hard-coded:

```
grep -hE '^ *- supabase/functions/[a-z0-9-]+/index\.ts' 92-0[45678]-PLAN.md | sort -u | wc -l   # -> 133
```

133 unique `supabase/functions/*/index.ts` list items across the `files_modified` frontmatter of
`92-04`..`92-08`, plus the 6 `_shared/auth.ts` importers that sit outside that population
(`auth-biometric-setup`, `auth-refresh-token`, `embeddings-generate`,
`notifications-register-device`, `push-notification`, `sync-push`) = **139**.

### Why the 92-04 functions appear again below

The 10 rows in the `92-04` table above are a real record of real deploys. They are **re-deployed
here rather than carried forward**, for two independent reasons:

1. `92-08` landed edits after `92-04` ran, so a redeploy is correct on the merits.
2. The `92-04` table shape (row-number in column 1, a trailing "Why deployed" column) is not
   readable by this plan's verification, which reads column 1 as the function name and requires
   the result as the final column. Rather than reformat another plan's record or touch the gate,
   every one of the 139 names below was deployed again by this plan. **Every `OK` in this table
   is a `supabase functions deploy` this plan executed and whose stdout it captured.**

Raw, unedited stdout for all 139 deploys: `.tickmarkr/overseer/92-09-deploy-raw.log`
(139 `=====` blocks, 139 `Deployed Functions on project zkrcjzdemdmwhearhfgg: <name>` lines,
every block `attempt-exit=0`). Timestamps are UTC, captured immediately **before** each
invocation. Run window: 2026-08-15T10:58:51Z -> 2026-08-15T11:02:16Z, 4 concurrent named
deploys. No bare `supabase functions deploy` was run at any point.

| Function                              | Deployed (UTC)       | Bundle  | Result |
| ------------------------------------- | -------------------- | ------- | ------ |
| access-review-detail                  | 2026-08-15T10:58:51Z | 732.7kB | OK     |
| ai-interaction-logs                   | 2026-08-15T10:58:51Z | 853.4kB | OK     |
| ai-summary-generate                   | 2026-08-15T10:58:51Z | 857.8kB | OK     |
| approve-role-change                   | 2026-08-15T10:58:51Z | 734.6kB | OK     |
| assign-role                           | 2026-08-15T10:58:57Z | 734.4kB | OK     |
| assignments-checklist-create-item     | 2026-08-15T10:58:58Z | 730.9kB | OK     |
| assignments-checklist-import-template | 2026-08-15T10:58:58Z | 731.6kB | OK     |
| assignments-checklist-toggle-item     | 2026-08-15T10:58:59Z | 731.2kB | OK     |
| assignments-comments-create           | 2026-08-15T10:59:04Z | 732.9kB | OK     |
| assignments-comments-reactions-toggle | 2026-08-15T10:59:04Z | 731.2kB | OK     |
| assignments-complete                  | 2026-08-15T10:59:04Z | 731.2kB | OK     |
| assignments-escalate                  | 2026-08-15T10:59:09Z | 732.1kB | OK     |
| assignments-observer-action           | 2026-08-15T10:59:10Z | 731.5kB | OK     |
| assignments-related-get               | 2026-08-15T10:59:11Z | 732.2kB | OK     |
| audit-logs-viewer                     | 2026-08-15T10:59:13Z | -       | OK     |
| auth-biometric-setup                  | 2026-08-15T10:59:15Z | -       | OK     |
| auth-refresh-token                    | 2026-08-15T10:59:15Z | -       | OK     |
| auth-step-up-complete                 | 2026-08-15T10:59:16Z | 735.4kB | OK     |
| auth-step-up-initiate                 | 2026-08-15T10:59:16Z | 733.6kB | OK     |
| auth-verify-step-up                   | 2026-08-15T10:59:17Z | 731.5kB | OK     |
| bot-notification-dispatcher           | 2026-08-15T10:59:18Z | 719.3kB | OK     |
| briefing-packs-list                   | 2026-08-15T10:59:21Z | 730.3kB | OK     |
| calculate-health-score                | 2026-08-15T10:59:22Z | 735.6kB | OK     |
| calendar-conflicts                    | 2026-08-15T10:59:25Z | 733.5kB | OK     |
| certify-user-access                   | 2026-08-15T10:59:27Z | 733.8kB | OK     |
| complete-access-review                | 2026-08-15T10:59:28Z | 733.7kB | OK     |
| content-expiration                    | 2026-08-15T10:59:30Z | 725.9kB | OK     |
| content-expiration-processor          | 2026-08-15T10:59:31Z | 725.1kB | OK     |
| countries                             | 2026-08-15T10:59:33Z | 732.2kB | OK     |
| create-user                           | 2026-08-15T10:59:33Z | 755.1kB | OK     |
| data-export                           | 2026-08-15T10:59:35Z | 744.3kB | OK     |
| data-import                           | 2026-08-15T10:59:36Z | 749.3kB | OK     |
| data-library                          | 2026-08-15T10:59:39Z | 735kB   | OK     |
| data-retention                        | 2026-08-15T10:59:40Z | -       | OK     |
| delegate-permissions                  | 2026-08-15T10:59:41Z | 734.3kB | OK     |
| detect-overdue-commitments            | 2026-08-15T10:59:42Z | 734.1kB | OK     |
| document-versions                     | 2026-08-15T10:59:43Z | 735.1kB | OK     |
| dossier-activity-timeline             | 2026-08-15T10:59:46Z | 715.8kB | OK     |
| dossier-export-pack                   | 2026-08-15T10:59:46Z | 728.4kB | OK     |
| dossier-field-assist                  | 2026-08-15T10:59:48Z | 852.6kB | OK     |
| dossier-recommendations               | 2026-08-15T10:59:51Z | 736.4kB | OK     |
| dossier-relationships                 | 2026-08-15T10:59:52Z | 736.7kB | OK     |
| dossier-stats                         | 2026-08-15T10:59:52Z | 847.9kB | OK     |
| dossiers                              | 2026-08-15T10:59:55Z | 737.1kB | OK     |
| dossiers-archive                      | 2026-08-15T10:59:56Z | 731.4kB | OK     |
| dossiers-briefs-generate              | 2026-08-15T10:59:58Z | 735.2kB | OK     |
| dossiers-create                       | 2026-08-15T10:59:59Z | 737.5kB | OK     |
| dossiers-get                          | 2026-08-15T11:00:01Z | 735.1kB | OK     |
| dossiers-list                         | 2026-08-15T11:00:02Z | 734.4kB | OK     |
| dossiers-timeline                     | 2026-08-15T11:00:03Z | 734.5kB | OK     |
| dossiers-timeline-test                | 2026-08-15T11:00:04Z | 730.5kB | OK     |
| dossiers-update                       | 2026-08-15T11:00:09Z | 735.1kB | OK     |
| email-inbound                         | 2026-08-15T11:00:09Z | 738.5kB | OK     |
| email-send                            | 2026-08-15T11:00:10Z | 737.1kB | OK     |
| embeddings-generate                   | 2026-08-15T11:00:12Z | -       | OK     |
| engagement-dossiers                   | 2026-08-15T11:00:14Z | 749.8kB | OK     |
| engagement-recommendations            | 2026-08-15T11:00:14Z | 738kB   | OK     |
| engagements-positions-attach          | 2026-08-15T11:00:15Z | 732.3kB | OK     |
| engagements-positions-detach          | 2026-08-15T11:00:15Z | 731.7kB | OK     |
| engagements-positions-list            | 2026-08-15T11:00:19Z | 731.7kB | OK     |
| entity-comments                       | 2026-08-15T11:00:20Z | 742.7kB | OK     |
| entity-duplicates                     | 2026-08-15T11:00:21Z | 736.4kB | OK     |
| entity-templates                      | 2026-08-15T11:00:23Z | 736.1kB | OK     |
| escalations-report                    | 2026-08-15T11:00:24Z | 735.5kB | OK     |
| event-store                           | 2026-08-15T11:00:26Z | 735.8kB | OK     |
| events                                | 2026-08-15T11:00:27Z | 734.6kB | OK     |
| field-history                         | 2026-08-15T11:00:28Z | 734.8kB | OK     |
| field-permissions                     | 2026-08-15T11:00:30Z | -       | OK     |
| forums                                | 2026-08-15T11:00:32Z | 735.6kB | OK     |
| generate-access-review                | 2026-08-15T11:00:33Z | 735.3kB | OK     |
| graph-export                          | 2026-08-15T11:00:34Z | 749.8kB | OK     |
| inactive-users                        | 2026-08-15T11:00:34Z | 733.2kB | OK     |
| intake-audit-logs                     | 2026-08-15T11:00:38Z | 732.5kB | OK     |
| intake-classification                 | 2026-08-15T11:00:39Z | 745.1kB | OK     |
| intake-health                         | 2026-08-15T11:00:40Z | 730.2kB | OK     |
| intake-tickets-assign                 | 2026-08-15T11:00:42Z | 734.1kB | OK     |
| intake-tickets-create                 | 2026-08-15T11:00:43Z | 734.4kB | OK     |
| intake-tickets-get                    | 2026-08-15T11:00:45Z | 733.9kB | OK     |
| intake-tickets-list                   | 2026-08-15T11:00:46Z | 735.1kB | OK     |
| intake-tickets-triage                 | 2026-08-15T11:00:48Z | 745.7kB | OK     |
| intake-tickets-update                 | 2026-08-15T11:00:51Z | 735.3kB | OK     |
| intelligence                          | 2026-08-15T11:00:51Z | 735.1kB | OK     |
| intelligence-batch-update             | 2026-08-15T11:00:51Z | 807.3kB | OK     |
| intelligence-get                      | 2026-08-15T11:00:54Z | -       | OK     |
| intelligence-refresh                  | 2026-08-15T11:00:56Z | 810.6kB | OK     |
| intelligence-refresh-v2               | 2026-08-15T11:00:56Z | 811.1kB | OK     |
| interaction-notes-create              | 2026-08-15T11:00:57Z | 731.6kB | OK     |
| interaction-notes-list                | 2026-08-15T11:00:57Z | 731.7kB | OK     |
| interaction-notes-search              | 2026-08-15T11:01:02Z | 733kB   | OK     |
| mou-renewals                          | 2026-08-15T11:01:02Z | 740.8kB | OK     |
| mous                                  | 2026-08-15T11:01:03Z | 735.2kB | OK     |
| my-delegations                        | 2026-08-15T11:01:03Z | -       | OK     |
| notifications-register-device         | 2026-08-15T11:01:06Z | -       | OK     |
| ocr-extract                           | 2026-08-15T11:01:08Z | 742.8kB | OK     |
| operation-progress                    | 2026-08-15T11:01:08Z | 730.2kB | OK     |
| organizations                         | 2026-08-15T11:01:09Z | 733.6kB | OK     |
| organizations-create                  | 2026-08-15T11:01:11Z | 731.1kB | OK     |
| organizations-list                    | 2026-08-15T11:01:14Z | 730.4kB | OK     |
| persons                               | 2026-08-15T11:01:14Z | 742.9kB | OK     |
| populate-countries                    | 2026-08-15T11:01:15Z | 733.7kB | OK     |
| populate-countries-v2                 | 2026-08-15T11:01:17Z | 734.2kB | OK     |
| position-analytics-get                | 2026-08-15T11:01:20Z | 731.3kB | OK     |
| position-analytics-top                | 2026-08-15T11:01:20Z | 731.5kB | OK     |
| position-suggestions-get              | 2026-08-15T11:01:22Z | 733.9kB | OK     |
| position-suggestions-update           | 2026-08-15T11:01:23Z | 730.1kB | OK     |
| positions-consistency-check           | 2026-08-15T11:01:26Z | 862.4kB | OK     |
| push-device-register                  | 2026-08-15T11:01:26Z | 733.5kB | OK     |
| push-notification                     | 2026-08-15T11:01:28Z | -       | OK     |
| push-notification-send                | 2026-08-15T11:01:30Z | 747.1kB | OK     |
| refresh-commitment-stats              | 2026-08-15T11:01:30Z | 730kB   | OK     |
| relationship-health                   | 2026-08-15T11:01:32Z | 745kB   | OK     |
| relationships-manage                  | 2026-08-15T11:01:33Z | 732.5kB | OK     |
| reports                               | 2026-08-15T11:01:35Z | 733.7kB | OK     |
| resolve-dossier-context               | 2026-08-15T11:01:38Z | 714.9kB | OK     |
| retention-processor                   | 2026-08-15T11:01:38Z | 737.4kB | OK     |
| revoke-delegation                     | 2026-08-15T11:01:41Z | 732.8kB | OK     |
| sample-data                           | 2026-08-15T11:01:42Z | 737.9kB | OK     |
| schedule-access-review                | 2026-08-15T11:01:43Z | 735.2kB | OK     |
| slack-bot                             | 2026-08-15T11:01:44Z | 722.6kB | OK     |
| smart-import-suggestions              | 2026-08-15T11:01:47Z | 737.3kB | OK     |
| stakeholder-influence                 | 2026-08-15T11:01:48Z | 750.5kB | OK     |
| sync-incremental                      | 2026-08-15T11:01:50Z | 731.5kB | OK     |
| sync-pull                             | 2026-08-15T11:01:50Z | 733.3kB | OK     |
| sync-push                             | 2026-08-15T11:01:52Z | -       | OK     |
| tags-manage                           | 2026-08-15T11:01:54Z | 733.7kB | OK     |
| team-collaboration                    | 2026-08-15T11:01:54Z | 712.7kB | OK     |
| teams-bot                             | 2026-08-15T11:01:57Z | 721.5kB | OK     |
| themes                                | 2026-08-15T11:01:59Z | 737.6kB | OK     |
| topics                                | 2026-08-15T11:02:01Z | 735.4kB | OK     |
| translate-content                     | 2026-08-15T11:02:01Z | 853.6kB | OK     |
| trigger-health-recalculation          | 2026-08-15T11:02:02Z | 731.8kB | OK     |
| user-permissions                      | 2026-08-15T11:02:06Z | 733.9kB | OK     |
| validate-delegation                   | 2026-08-15T11:02:08Z | 732.8kB | OK     |
| waiting-queue-escalation              | 2026-08-15T11:02:09Z | 744.1kB | OK     |
| waiting-queue-filters                 | 2026-08-15T11:02:09Z | 745.3kB | OK     |
| webhook-delivery                      | 2026-08-15T11:02:11Z | 737.7kB | OK     |
| webhooks                              | 2026-08-15T11:02:14Z | 743.1kB | OK     |
| word-assistant                        | 2026-08-15T11:02:14Z | 736kB   | OK     |
| working-groups                        | 2026-08-15T11:02:16Z | 742.3kB | OK     |

**139 / 139 OK on the first pass. The retry pass found nothing to retry; no deploy failed, so no
name required a FAIL line.**
