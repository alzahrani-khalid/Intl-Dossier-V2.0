# Escalated Backlog — Rounds 3–5 Supplement + Phase Proposals (2026-06-10)

Branch: `quick/260608-c9b-country-dossier-workflow-fixes`
Staging Supabase project_id: `zkrcjzdemdmwhearhfgg`

Companion to `reports/escalated-backlog-master-2026-06-09.md` (rounds 1–2: dossier
types + feature workflows — still authoritative for those items). This file
consolidates the **B-bucket escalations from rounds 3–5** (15 surfaces inspected
2026-06-09/10; all bucket-A findings already fixed in 17 build-verified commits
`68552968..33671c41`) and clusters everything — including rounds 1–2 carryovers —
into **proposed GSD phases**.

Per-surface detail lives in `reports/*-workflow-inspection-2026-06-{09,10}.md`;
per-surface fixed/escalated ledgers in `reports/fanout-loop-state.json`.

Inspector note: rounds 3 (through intelligence) by cursor-agent; briefing-books
onward by codex CLI (cursor-agent quota until 6/27). All DB/RPC claims tagged
**VERIFY vs live** in the source reports were NOT live-probed — verify against
staging SQL before acting (lesson: WG round-1 false positive).

---

## Rounds 3–5 B-bucket, by surface

### Round 3 — new surfaces

| Surface                | Report                                                | Escalated (headline → detail in report)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| dashboard              | dashboard-workflow-inspection-2026-06-09              | get_dashboard_stats deltas/meta RPC; SlaHealth domain model (intake vs work-items); openCommitments vs open_tasks label; dossierType→drawer propagation; overdue pagination; get_work_item_trends RPC; /vip-visits route decision; dead Operations-Hub zone components; WeekAhead glyph typing; MyTasks uncheck restore                                                                                                                                                                                                                                                |
| reports/analytics      | reports-analytics-workflow-inspection-2026-06-09      | **/analytics is disconnected from live data**: Express /analytics-dashboard 404 + repository swallows it + param/response contract mismatch + needs multi-endpoint fetch (#1/#2/#20); export stub (#4); reports edge wrong invoke contract + mock job/download (#5/#6); **report builder 100% stubbed** + dual scheduling hooks (#7/#8); scheduled report-name fetch + recipients join VERIFY (#10/#19); persistent history (#18); sample-data policy (#14); MOU filter values (#22)                                                                                   |
| data-library/documents | data-library-documents-workflow-inspection-2026-06-09 | **data_library_items schema-incompatible** (dual `009_*` migrations; page targets superseded columns; inserts omit RLS-required uploaded_by + NOT NULL file_hash) (#1–3); `data-library` storage bucket not provisioned (#2); documents-get/create edge broken vs live schema + FormData-vs-JSON (#4/#5); inert download/delete + getPublicUrl on private bucket (#6/#7); docs tab shows entities not files + attachments always empty + **3 parallel document stacks** (#8–10); MSW mock drift (#16)                                                                  |
| intelligence           | intelligence-workflow-inspection-2026-06-09           | **3 disconnected stacks**: Feature-029 dossier AI tab orphaned (CountryDossierDetail unrouted) (#1); /intelligence page assumes legacy report schema vs generated types (#2); vector search RPC param mismatch + results never rendered (#3); intelligence_signals has no UI vs nav label (#4); Phase-54 event/digest tables schema-only (#5); refresh vs refresh-v2 edge drift (#6); Express /api/intelligence unconsumed + detectSignals arity bug (#7); stale /api/intelligence-reports tests (#8); inert create/download/row actions (#9); placeholder E2E (#15)   |
| briefing-books         | briefing-books-workflow-inspection-2026-06-09         | **route force-redirects to /dashboard** (page unmounted) (#1); not in nav (#2); list crashes on raw-rows-vs-DTO (#3); edge fetchEntityData selects nonexistent columns across 5 tables (#4); sensitivity numeric-vs-enum (#5); template fetch schema-invalid (#6); PDF/DOCX advertised, HTML always generated (#7); **generated HTML unsanitized → XSS** (#9); GET params unwired (#12)                                                                                                                                                                                |
| settings/admin         | settings-admin-workflow-inspection-2026-06-09         | **/settings saves to nonexistent users columns** (preferences schema + migration decision) (#1); appearance prefs localStorage-only vs account (#2); /users has no create/edit/role routes (edge fns exist unwired) (#3); /users not admin-gated (route+RLS decision) (#4); **admin role-source split** (profile-table vs auth metadata) (#5); calendar-sync settings import stub hooks (real repository exists) (#7); data-privacy export/delete reference absent tables (#8); MFA is a flag with no enrollment flow (#9); bot pending-link user_id nullability (#10) |

### Round 4 — dormant/secondary surfaces

| Surface                 | Report                                                | Escalated                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| word-assistant + export | word-assistant-export-workflow-inspection-2026-06-09  | [EXP] **/export nav target is a dead redirect with 4 parallel unwired export implementations** (#1); orphan Express ExportDialog hard-codes `Bearer test-auth-token` (#6); data-export edge queries stale vs generated types across 5 entities (#7). [WA] default fallback mode shows "connected" with no backend (#2); edge returns fallback text / **random embeddings as success** (#4)                                                                                                                |
| tags                    | tags-workflow-inspection-2026-06-09                   | merge/history/analytics are local stubs that fake success (#3); **canonical tag-model split**: taxonomy entity_tag_assignments vs legacy dossiers.tags string[] (TagSelector no-ops) (#4); data-library tags consumption stale (#5, overlaps data-library)                                                                                                                                                                                                                                                |
| events                  | events-workflow-inspection-2026-06-09                 | **/events (event_details/public.events) and "New Event" (/calendar/new → calendar_entries) are unrelated models presented as siblings** (#2); single-entry participant selection silently dropped on save (#3); event_details view absent from generated types + event_type enum drift (#4); active-Sidebar placement (#5)                                                                                                                                                                                |
| task-queue/escalations  | task-queue-escalations-workflow-inspection-2026-06-09 | queue edge response shape mismatch (#1); filters never transported (invoke body vs URL params) + 'all' literal + priority_level drift (#2); manual-override edge writes absent assignments columns (#3); **queue-processor imports a nonexistent backend service** + fallback cron is a placeholder (#4); **escalations-report selects absent columns** (#5); page says manage, is analytics-only (#6); waiting-queue-escalation writes absent escalation_records columns (#7); nav after semantics (#10) |

### Round 5 — operations/admin surfaces

| Surface        | Report                                        | Escalated                                                                                                                                                                                                                                                                                                                                                      |
| -------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sla-monitoring | sla-monitoring-workflow-inspection-2026-06-10 | **sla_escalations has NO writer in source** — UI reads/acks/resolves rows nothing creates (#1); four dashboard RPCs migration-only, absent from generated types (#2); metrics SQL ticket-only vs ticket/commitment/task UI (#3); assignee/at-risk RPCs join absent staff_profiles.full_name (#4); policy enum drift (#5); nav after origin fixed (#8)          |
| my-work        | my-work-workflow-inspection-2026-06-10        | **manager assignee drill-down dropped before the RPC** (edge never reads assigneeId; list always auth user) (#1); due-today/week quick filters write URL state the query ignores (#2); **core unified view/RPC SQL not in repo migrations** (#3)                                                                                                               |
| activity       | activity-workflow-inspection-2026-06-10       | **activity_stream RLS allows authenticated inserts with arbitrary actor identity** + visibility_scope unenforced (spoofable feed) (#1); Following tab has no follow affordance anywhere active (#3); realtime claimed, polling-only (#4)                                                                                                                       |
| audit-logs     | audit-logs-workflow-inspection-2026-06-10     | **viewer reads `audit_log` while compliance producers write `audit_logs`** (two tables; generated type lacks the viewer's selected columns; mixed writer schemas) (#1); role gating split across route(none)/nav(users.role)/edge(admin+editor+supervisor)/admin-routes(auth metadata) (#4)                                                                    |
| approvals      | approvals-workflow-inspection-2026-06-10      | **"My Approvals" is not a my-queue**: generic under-review list; RLS checks approvals.approver_id but positions-submit never creates assignment rows (#1); approve/request-revisions/delegate + StepUpMFA exist unmounted (#2); counts.approvals hardcoded 0 (#3); approvals vs pending_role_approvals vs position_delegations schema split (ungenerated) (#6) |

---

## Proposed GSD phases (clustered across all rounds)

Ordering rationale: P1 unblocks every later phase (truth restoration); P2 is the
security pass (small, urgent); P3–P6 are the functional verticals; P7 the product
decisions; P8 the carryover architecture work from rounds 1–2.

### P1 — Schema & type truth restoration (foundation, do first)

Regenerate `database.types.ts` from staging; commit the missing canonical SQL
(unified work view/RPCs [my-work #3], 4 SLA dashboard RPCs [sla #2],
event*details view [events #4]); reconcile dual `009*\*` data-library migrations
[data-library #1]; generate-or-migrate ungenerated tables
(pending_role_approvals, position_delegations, word_assistant_logs [approvals
#6, wa #4]); fix RPC SQL referencing absent columns (staff_profiles.full_name
[sla #4], escalations-report columns [tq #5]). Add a CI smoke test: every
RPC/table an edge fn references must exist in generated types.

### P2 — Security pass (small, high urgency)

activity_stream RLS: bind actor_id to auth.uid(), enforce visibility_scope
[activity #1]; sanitize briefing-books generated HTML [bb #9]; delete or rewire
the test-token ExportDialog [exp #6]; decide+enforce /users and /audit-logs
gating, unify the role source (users.role vs auth metadata) once for
admin/audit/approvals [settings #4/#5, audit #4].

### P3 — Analytics & reports vertical

Analytics: Express proxy or direct edge client + param/response contract +
multi-endpoint fetch + real export [r/a #1/#2/#20/#4]. Reports: fix invoke
contract, replace mock job/download [r/a #5/#6]. Report builder: wire to
custom-reports or feature-flag the page off [r/a #7/#8]. Scheduled reports:
report-name fetch + recipients join [r/a #10/#19]. Dashboard widget follow-ups
[dashboard row above].

### P4 — Documents & data-library vertical

Rebuild DataLibraryPage against the canonical schema + provision bucket +
signed URLs + real download/delete [dl #1–#7]; pick ONE document stack and
retire the other two (overview aggregation vs documents-get/create vs Express)
[dl #8–10, #4/#5]; dossier docs tab: entity links vs real files decision;
attachments strategy. Tag-model decision feeds in here too [tags #4/#5].

### P5 — Work-pipeline producers (things the UI reads but nothing writes)

sla_escalations writer (breach detection → escalation rows) [sla #1];
approvals assignment rows on positions-submit + my-queue contract + actions +
StepUpMFA + real badge count [appr #1/#2/#3]; assignment-queue drain
(queue-processor service or edge/RPC) + queue contract + manual-assign
[tq #1–#4]; my-work assignee drill-down + due-window filters end-to-end
[mw #1/#2]; activity follow affordance + realtime decision [act #3/#4].

### P6 — Settings & profile vertical

Preferences schema decision (users columns vs preferences table) + migration +
typed mappers [set #1]; appearance account-vs-device [set #2]; /users write
flows wiring the existing edge fns [set #3]; calendar-sync real hooks [set #7];
data-privacy export/delete on real tables [set #8]; MFA enrollment flow
[set #9]; bot pending-link model [set #10].

### P7 — Product decisions on dead/split surfaces (cheap to decide, then small builds)

/export: pick canonical experience or remove nav item [exp #1]; /briefing-books:
re-enable route + DTO mapper + entity-query rebuild + export-format honesty
[bb #1–#7]; /events vs /calendar/new model meaning [ev #2/#3/#5]; intelligence:
reconnect Feature-029 tab or retire, /intelligence page schema choice, vector
search fix-or-remove, signals UI or rename [int #1–#9]; word-assistant backend
mode honesty [wa #2/#4]; tags merge/history/analytics wire-or-hide [tags #3];
/tasks/escalations analytics-vs-operations naming [tq #6].

### P8 — Rounds 1–2 architecture carryover (see 06-09 master, Bucket B)

Forum split-session model; engagement legacy→unified migration; route or delete
the dead \*DossierDetail rich sections (person/EO/forum); overview cards →
dedicated entity tables; MoU detail/create surfaces; after-action edge
transport batch; search dossier-first rewrite; relationships graph route +
traversal RPC; notifications Topbar panel wiring.

---

## Recurring meta-patterns (worth a standing lint/review rule)

1. **Stub hooks presented as live** — found on 7+ surfaces (report builder,
   tags merge/history/analytics, calendar-sync, audit export/stats [now fixed],
   word-assistant fallback, my-work team capacity [now fixed]). Rule: a hook
   that resolves constants must be named `useStub*` or gated `enabled:false`.
2. **Frontend↔edge contract drift** — param names/response envelopes diverged
   on 6+ surfaces (audit [fixed], assignments-queue, analytics, tag-hierarchy
   [fixed], reports, data-export). Rule: shared typed param/response interfaces
   per edge fn, contract tests.
3. **Tables read by UI with no writer** (sla_escalations, approvals-as-queue)
   and **writers with no reader** (audit_logs vs viewer) — pipeline-level
   review, not per-page.
4. **Generated-types blind spots**: untyped `supabase` client + `as` casts let
   every drift compile. The P1 smoke test addresses the edge side; consider
   typing the client.
