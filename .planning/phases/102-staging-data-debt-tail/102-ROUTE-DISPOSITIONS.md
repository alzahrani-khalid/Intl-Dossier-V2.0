---
status: complete
phase: 102-staging-data-debt-tail
requirement: ROUTE-ORPHAN-01
measured: 2026-09-12
---

# Route dispositions for the 14 named zero-inbound routes

At HEAD, `scripts/inbound-link-classify.mjs` derives 202 full route-tree paths, 185 distinct paths
after trailing-slash normalization, and 94 zero-inbound rows. Each route below has `LIVE=0`; the
classifier’s known-linked, boundary, and demo-only pins all pass. Counts in `reads` were re-derived
from staging project `zkrcjzdemdmwhearhfgg` in one read-only `psql` run.

The classifier documents a floor, not a proof that aliases have no external callers. That alias
contract is unknowable from this repository, so deletion would be a product act; every ruling is KEEP.

| route | class | ruling | file | renders | reads (table = staging rows) | reason |
| --- | --- | --- | --- | --- | --- | --- |
| `/contacts` | redirect-shell | KEEP | `frontend/src/routes/_protected/contacts.tsx` | Redirect to `/dossiers/persons` | none | Preserve the legacy person-list alias because external use is unknowable and deletion is a product act. |
| `/countries` | redirect-shell | KEEP | `frontend/src/routes/_protected/countries.tsx` | Redirect to `/dossiers/countries` | none | Preserve the legacy country-list alias because external use is unknowable and deletion is a product act. |
| `/organizations` | redirect-shell | KEEP | `frontend/src/routes/_protected/organizations.tsx` | Redirect to `/dossiers/organizations` | none | Preserve the legacy organization-list alias because external use is unknowable and deletion is a product act. |
| `/persons` | redirect-shell | KEEP | `frontend/src/routes/_protected/persons.tsx` | Redirect to `/dossiers/persons` | none | Its source explicitly promises a legacy alias, whose external contract cannot be disproved by inbound-link grep. |
| `/working-groups` | redirect-shell | KEEP | `frontend/src/routes/_protected/working-groups.tsx` | Redirect to `/dossiers/working_groups` | none | Preserve the legacy working-group alias because external use is unknowable and deletion is a product act. |
| `/data-library` | renders-data-empty | KEEP | `frontend/src/routes/_protected/data-library.tsx` → `frontend/src/pages/DataLibrary.tsx` → `frontend/src/pages/data-library/DataLibraryPage.tsx` | Data-library list and create flow | `data_library_items = 0` | The route has a real data-backed surface and a valid empty state, so zero staging rows do not justify deletion. |
| `/geographic-visualization` | renders-data | KEEP | `frontend/src/routes/_protected/geographic-visualization.tsx` → `frontend/src/pages/geographic-visualization/GeographicVisualizationPage.tsx` | Map, regional metrics, and relationship flows | `v_country_engagement_metrics = 5`; `v_country_relationship_flows = 0`; `v_regional_engagement_summary = 3`; RPC `get_geographic_visualization_data` | The feature renders staging geography data and therefore remains a live product surface. |
| `/stakeholder-influence` | renders-data-empty | KEEP | `frontend/src/routes/_protected/stakeholder-influence.tsx` | Influence tiers, network, comparison, and reports tabs | `influence_reports = 0`; `stakeholder_influence_history = 0`; `network_clusters = 0`; `dossier_relationships = 9`; `dossiers = 114` | Feature-owned result tables are empty while source/reference data exists, which is evidence for an empty state rather than deletion. |
| `/workflow-automation` | renders-data-empty | KEEP | `frontend/src/routes/_protected/workflow-automation.tsx` → `frontend/src/pages/workflow-automation/WorkflowAutomationPage.tsx` | Workflow rule list, no-code builder, executions, and templates | `workflow_rules = 0`; `workflow_executions = 0`; `workflow_notification_templates = 4` | No rules or executions exist yet, but templates and a complete builder make this an intentional empty data surface. |
| `/tasks/escalations` | renders-data-empty | KEEP | `frontend/src/routes/_protected/tasks/escalations.tsx` → `frontend/src/pages/Escalations.tsx` → `frontend/src/components/assignments/EscalationDashboard.tsx` | Escalation totals, trends, units, assignees, and work types | `escalation_events = 0`; joined `assignments = 14`; `staff_profiles = 4`; `organizational_units = 1`; `users = 415` | The escalation fact table is empty while joined and lookup tables are populated, so the dashboard’s empty result is not an orphan proof. |
| `/my-work/waiting` | renders-data | KEEP | `frontend/src/routes/_protected/my-work/waiting.tsx` → `frontend/src/pages/WaitingQueue.tsx` | Filtered assignment queue, aging, bulk reminders, and escalation actions | `assignments = 14` (`assigned = 6`, `in_progress = 5`, `completed = 2`, `cancelled = 1`); `dossiers = 114`; `intake_tickets = 3`; `positions = 7`; `tasks = 9`; `user_preferences = 0`; `users = 415` | The function derives waiting semantics over populated assignments rather than relying on a nonexistent `waiting` status, so the surface must stay. |
| `/reports/scheduled` | renders-data-empty | KEEP | `frontend/src/routes/_protected/reports/scheduled.tsx` → `frontend/src/components/scheduled-reports/ScheduledReportsManager.tsx` → `frontend/src/hooks/useScheduledReports.ts` | Schedule manager, recipients, conditions, runs, and custom-report selector | `report_schedules = 0`; `report_schedule_recipients = 0`; `report_delivery_conditions = 0`; `report_executions = 0`; `custom_reports = 0` | All feature tables are empty, but the implemented manager and processor contract require an explicit product decision before deletion. |
| `/help/commitments` | static | KEEP | `frontend/src/routes/_protected/help/commitments.tsx` → `frontend/src/pages/help/CommitmentsHelpPage.tsx` | Static commitment-help tabs and accordions | none | Static help needs no database rows, and unknown direct bookmarks make deletion a product act. |
| `/intake/queue` | redirect-shell | KEEP | `frontend/src/routes/_protected/intake/queue.tsx` | Redirect to `/my-work/intake`; null component is unreachable after redirect | none | The file explicitly retains backward compatibility, so the deprecated alias remains until product owners retire that contract. |

## Re-derived population

```text
ROUTE population: 202 full paths in FileRoutesByFullPath (185 distinct after trailing-slash normalisation) — derived at run time, never frozen: this phase deletes routes by design (D-08).
ZERO_INBOUND=94 of 185 table rows
```
