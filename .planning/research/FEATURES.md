# Feature Landscape

**Domain:** Diplomatic dossier management -- hub-and-spoke architecture, engagement lifecycle workspaces, enriched entity detail pages
**Researched:** 2026-03-28
**Downstream consumer:** Roadmap for v3.0 "Connected Workflow" milestone

---

## Table Stakes

Features users expect from any modern CRM/project management tool with entity workspaces and operational dashboards. Missing any of these will make the product feel incomplete or broken.

| #   | Feature                                                            | Why Expected                                                                                                                                                                                                                                 | Complexity | Dependencies on Existing                                                                               | Notes                                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Operations Hub -- Attention Needed zone**                        | Every CRM (HubSpot, Salesforce, Monday) surfaces overdue/due-soon items front and center. Users open a tool to see "what needs me right now." Without this, the dashboard is a vanity metrics page.                                          | Medium     | Existing work items (tasks, commitments, intake) with deadlines and statuses; existing calendar events | Query: overdue + due-within-48h, grouped by severity. Needs composite query across work_items + calendar.                                                                                                          |
| 2   | **Operations Hub -- Upcoming Timeline**                            | Chronological "what's next" view (today, tomorrow, this week) is standard in Outlook, Google Calendar sidebar, HubSpot. Users need temporal orientation alongside priority orientation.                                                      | Low        | Existing calendar with 4 event types                                                                   | Filtered calendar query, rendered as a compact list. Low risk.                                                                                                                                                     |
| 3   | **Operations Hub -- Active Engagements by lifecycle stage**        | Pipeline views grouped by stage are the defining pattern of any deal/project CRM (HubSpot deal pipeline, Salesforce opportunity stages, Jira board). Without this, there is no engagement visibility.                                        | Medium     | Existing engagements table; NEW lifecycle_stage column                                                 | Requires DB migration to add lifecycle_stage enum. Display is a grouped card list or mini-kanban.                                                                                                                  |
| 4   | **Engagement Workspace -- Lifecycle Bar**                          | Stage progress indicators are universal in pipeline-based tools (HubSpot deal stages, Salesforce Path, Linear project progress). A 6-stage horizontal stepper is the standard pattern. Users expect to see where they are and what is next.  | Medium     | NEW lifecycle_stage on engagements table                                                               | Best practice: 3-6 stages max (spec has 6 -- at the upper limit but acceptable). Clickable stages showing summary. Non-linear navigation (skip/revert) is critical for diplomatic work where stages are not rigid. |
| 5   | **Engagement Workspace -- Tabbed workspace shell**                 | Tabbed entity workspaces are table stakes in Salesforce Lightning, HubSpot record pages, Notion databases, and Linear projects. Users expect Overview + contextual tabs (tasks, docs, calendar, audit).                                      | Medium     | Existing UI shell, TanStack Router nested routes                                                       | Standard tab component with URL-driven tab state via nested routes (already in spec). Must preserve back-button behavior.                                                                                          |
| 6   | **Engagement Workspace -- Scoped Kanban (Tasks tab)**              | Project-scoped task boards exist in every serious project tool (Asana project view, Monday board, Jira project board, ClickUp space). The global kanban already exists; filtering it to one engagement is mandatory.                         | Medium     | Existing unified kanban/work-items system                                                              | Kanban columns should group by lifecycle stage (not just status). Needs work_items.lifecycle_stage reference column.                                                                                               |
| 7   | **Engagement Workspace -- Scoped Calendar**                        | Engagement-scoped event views are standard in any project workspace (Monday timeline, Asana calendar, Salesforce activity timeline).                                                                                                         | Low        | Existing calendar system                                                                               | Filter existing calendar by engagement_id. Conflict detection with other engagements is a differentiator (see below).                                                                                              |
| 8   | **Engagement Workspace -- Scoped Documents**                       | Per-entity document tabs exist in Salesforce (Files related list), HubSpot (Documents), SharePoint (document libraries). Users expect to see and upload docs in context.                                                                     | Low        | Existing document management with dossier linking                                                      | Filter existing documents by engagement. Organize by lifecycle stage is a minor enhancement.                                                                                                                       |
| 9   | **Enriched Dossier Detail Pages -- Shared header + tab structure** | Every CRM record page has: header (name, type, status, actions), tab bar (details, related, activity), and consistent layout across entity types. Salesforce Lightning Pages, HubSpot record view, and Dynamics 365 all follow this pattern. | Medium     | Existing dossier CRUD for all 8 types                                                                  | Refactor existing detail pages to use shared DossierDetailShell component. The tier-based visual differentiation (anchors vs activities vs threads vs contacts) is the key design decision.                        |
| 10  | **Enriched Dossier Detail Pages -- Engagements tab on Anchors**    | On a Country or Organization page, seeing all related engagements grouped by stage is expected in any relationship-centric CRM. HubSpot shows associated deals on company records; Salesforce shows opportunities on accounts.               | Low-Medium | Existing dossier-to-dossier relationships, engagement data                                             | Query engagements linked to this dossier via work_item_dossiers or dossier_relationships. Group by lifecycle_stage.                                                                                                |
| 11  | **Relationship Sidebar -- Linked dossiers panel**                  | Related records panels are universal in CRM. Salesforce has "Related Lists," HubSpot has "Associations," Dynamics has "Connections." Users expect to see what is connected without leaving the page.                                         | Medium     | Existing dossier relationships system                                                                  | Collapsible right panel, grouped by tier. Quick-add to create new links. Salesforce best practice: use "Quick Links" style (hover preview) rather than full related lists to reduce page load.                     |
| 12  | **Quick Switcher (Cmd+K)**                                         | Command palettes are now standard in productivity tools (Notion, Linear, Figma, VS Code, Slack). Users expect Cmd+K to search and navigate anywhere. Missing this in 2026 feels outdated.                                                    | Medium     | Existing search/filtering infrastructure                                                               | Use cmdk or kbar React library. Must index: dossiers (all 8 types), engagements, work items, recent pages. Keyboard-first with mouse fallback.                                                                     |
| 13  | **Sidebar Navigation -- Hub-based grouping**                       | Grouping navigation by function (Operations, Dossiers, Admin) rather than flat list is standard in mature enterprise tools (Salesforce App Launcher, HubSpot mega-menu, Jira sidebar).                                                       | Low        | Existing NavigationShell component                                                                     | Reorder and group existing nav items. Low risk refactor.                                                                                                                                                           |
| 14  | **Engagement Workspace -- Audit tab**                              | Activity timelines on entity records are standard in every CRM and compliance tool. "Who changed what, when" is a regulatory expectation in diplomatic/government contexts.                                                                  | Low        | Existing audit/compliance tracking system                                                              | Filter existing audit logs by engagement_id. Display as chronological timeline.                                                                                                                                    |

---

## Differentiators

Features that set the product apart from generic CRM/project tools. Not expected, but create significant value for diplomatic workflow.

| #   | Feature                                             | Value Proposition                                                                                                                                                                                                                                                                   | Complexity | Dependencies on Existing                                   | Notes                                                                                                                                                                                     |
| --- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Lifecycle-stage-grouped Kanban columns**          | Generic CRMs group tasks by status (todo/doing/done). Grouping by lifecycle stage (preparation tasks, briefing tasks, execution tasks, follow-up tasks) reflects how diplomatic work actually flows. No off-the-shelf tool does this.                                               | Medium     | Existing kanban + NEW lifecycle_stage on work_items        | Columns = lifecycle stages, cards show status within each stage. This is a genuine workflow innovation for the domain.                                                                    |
| 2   | **Role-adaptive dashboard defaults**                | Most CRMs offer one dashboard or require manual widget configuration. Automatically adjusting the Attention Needed zone and engagement filters based on user role (Leadership/Officer/Analyst) reduces setup friction and surfaces role-relevant info immediately.                  | Medium     | Existing profiles.role column, existing dashboard          | Not hard-gated -- any user can switch view via dropdown. Default filters only. Implementation: role-to-filter-preset mapping, stored in user preferences.                                 |
| 3   | **"What's Next" action card on workspace Overview** | Proactive guidance ("the most important pending item") is emerging in AI-assisted tools but rare in traditional CRM. This reduces decision fatigue -- the user opens an engagement and immediately knows what to do.                                                                | Medium     | Engagement tasks with priorities and deadlines             | Algorithm: highest-priority incomplete task in current lifecycle stage. Simple heuristic, not AI. Falls back to "no pending items" state gracefully.                                      |
| 4   | **Tier-specific dossier enrichments**               | Generic CRMs show the same layout for all record types. Tier-specific views (Countries get bilateral summaries; Organizations get MoU trackers; Topics get position trackers; Persons get engagement history timelines) reflect domain expertise that generic tools cannot provide. | High       | Existing dossier data, existing relationship health scores | Each tier needs custom Overview tab content. High effort but high differentiation. Implement incrementally: Anchors first (Countries, Organizations), then Activities, Threads, Contacts. |
| 5   | **Cross-cutting thread view on Topics**             | Showing which anchors AND activities connect to a topic thread -- effectively a "topic impact map" -- is unique to diplomatic/policy work. Generic CRMs don't model cross-cutting themes this way.                                                                                  | Medium     | Existing dossier relationships, topic dossier type         | Query: all dossiers linked to this topic, grouped by tier. Display as a compact grid or mini network graph.                                                                               |
| 6   | **Calendar conflict detection across engagements**  | Flagging scheduling conflicts between engagements (not just events) is valuable when staff juggle multiple diplomatic activities. Generic calendars flag event conflicts but not engagement-level conflicts.                                                                        | Medium     | Existing calendar, engagement dates                        | Compare engagement date ranges and participant overlaps. Display warnings in Calendar tab and on the Operations Hub timeline.                                                             |
| 7   | **Forum recurring sessions as mini-workspaces**     | Modeling forums as recurring events with per-session lifecycle tracking and cross-session trend views is specific to diplomatic/international affairs (annual assemblies, quarterly meetings). No off-the-shelf tool handles this pattern natively.                                 | High       | Existing forums dossier type, NEW session model            | Requires: forum_sessions table, per-session lifecycle_stage, parent-child workspace navigation. High complexity but high domain value.                                                    |
| 8   | **AI briefing generation as contextual action**     | Absorbing AI briefings into the Docs tab as a "Generate Briefing" button (rather than a standalone page) follows the 2025-2026 enterprise UX trend of contextual actions over standalone features. This reduces navigation and keeps the user in workflow context.                  | Low-Medium | Existing AI briefing generation system                     | Move existing briefing UI into a modal/drawer triggered from workspace Docs tab. Most of the work is already done -- this is relocation, not new functionality.                           |
| 9   | **Network graph as expandable sidebar view**        | Embedding the relationship graph into the RelationshipSidebar as an expandable visualization (rather than a full-page network view) keeps relationship context always accessible. Follows the "progressive disclosure" pattern.                                                     | Medium     | Existing React Flow network graph                          | Compact mini-graph in sidebar, expandable to full-screen overlay. Needs React Flow viewport constraints for small container.                                                              |
| 10  | **Intake-to-Engagement promotion flow**             | Seamless conversion from intake request to engagement workspace (with pre-populated fields and lifecycle starting at "Intake" stage) bridges the directive-driven entry point. This is domain-specific -- generic CRMs have lead-to-deal conversion but not intake-to-engagement.   | Medium     | Existing intake queue system                               | Create engagement from intake with pre-linked dossiers, pre-set lifecycle_stage='intake', and source tracking.                                                                            |

---

## Anti-Features

Features to explicitly NOT build. These are common mistakes in CRM/dashboard redesigns that add complexity without proportional value.

| #   | Anti-Feature                                         | Why Avoid                                                                                                                                                                                                                                                       | What to Do Instead                                                                                                                                                                |
| --- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Drag-and-drop dashboard widget customization**     | "Canvas" dashboards (drag widgets, resize, reposition) create massive frontend complexity, inconsistent layouts across users, and support burden. Research shows most users never customize beyond the first week. The 3-zone layout in the spec is sufficient. | Use the fixed 3-zone layout with role-adaptive _filter_ defaults. Let users switch role-view via dropdown, not rearrange widgets.                                                 |
| 2   | **Real-time notification system with badges/toasts** | Notification fatigue is the #1 UX complaint in enterprise tools. Building a notification center with read/unread, badges, push notifications, and preferences is a multi-sprint effort that often reduces rather than increases engagement.                     | Use the Attention Needed zone on the dashboard as the notification surface. Items appear there when overdue or due-soon. No push notifications, no badge counts, no toast popups. |
| 3   | **Rigid stage-gating on lifecycle transitions**      | Hard-gating (must complete all preparation tasks before advancing to briefing) creates frustration in diplomatic work where stages overlap and situations change rapidly. The spec correctly identifies this risk.                                              | Guide, don't gate. Show suggestions ("All preparation tasks complete -- ready to advance?") but allow manual stage advancement at any time. Log the override for audit purposes.  |
| 4   | **Per-user workspace layout customization**          | Allowing users to reorder tabs, hide tabs, or customize workspace layout per engagement creates state management complexity and makes it impossible to provide consistent support/training.                                                                     | Fixed tab order for all workspaces. The content within tabs is contextually filtered, but the structure is consistent.                                                            |
| 5   | **Separate analytics/reporting page**                | The spec already absorbs analytics into dashboard widgets and dossier overview cards. Rebuilding a standalone analytics page would undo the consolidation.                                                                                                      | Keep analytics dissolved into context: KPI cards on Operations Hub, trend sparklines on dossier Overview tabs, and export actions on list views.                                  |
| 6   | **Complex relationship type taxonomy**               | Over-engineering relationship types (primary, secondary, advisory, counterpart, observer, sponsor, beneficiary...) creates data entry burden without proportional query value.                                                                                  | Start with 3-4 relationship types max (primary, advisory, counterpart, other). Add more only when users explicitly request them. The link itself matters more than the label.     |
| 7   | **AI-powered "smart suggestions" throughout the UI** | Sprinkling AI suggestions everywhere (suggested tasks, suggested contacts, suggested documents) creates unpredictability and erodes trust when suggestions are wrong. The existing AI briefing system is scoped and useful.                                     | Keep AI focused on one high-value action: briefing generation. The "What's Next" card uses simple heuristics (priority + deadline), not AI.                                       |
| 8   | **Full audit trail on every component**              | Showing "last edited by X at Y" on every card, field, and widget adds visual noise. The dedicated Audit tab on each workspace is sufficient.                                                                                                                    | Audit trail lives in the Audit tab. Header shows "last updated" timestamp. No inline edit attribution on individual fields.                                                       |

---

## Feature Dependencies

```
Lifecycle Engine (DB: lifecycle_stage columns)
  |-> Operations Hub: Active Engagements by stage
  |-> Engagement Workspace: Lifecycle Bar
  |-> Engagement Workspace: Stage-grouped Kanban
  |-> Intake-to-Engagement promotion flow
  |-> Forum recurring sessions

Shared DossierDetailShell component
  |-> All 8 enriched dossier detail pages
  |-> RelationshipSidebar (attached to shell)
  |-> Tier-specific enrichments (content within shell)

NavigationShell refactor (hub-based sidebar)
  |-> Route consolidation (prerequisite for clean nav)
  |-> Quick Switcher (Cmd+K) (independent but nav-adjacent)

Engagement Workspace (WorkspaceShell + tabs)
  |-> Scoped Kanban (reuses existing kanban, adds filter)
  |-> Scoped Calendar (reuses existing calendar, adds filter)
  |-> Scoped Documents (reuses existing docs, adds filter)
  |-> Scoped Audit (reuses existing audit, adds filter)
  |-> AI Briefing action (moves existing feature into Docs tab)

Quick Switcher (Cmd+K)
  |-> Search index covering all 8 dossier types + work items
  |-> Recent pages tracking (new: store last N visited routes)
```

---

## MVP Recommendation

### Prioritize (Table Stakes -- build first):

1. **Navigation and sidebar restructuring** -- lowest risk, immediate UX improvement, prerequisite for everything else
2. **Lifecycle Engine (DB migration)** -- schema change that unblocks Operations Hub, Workspace, and stage-grouped features
3. **Operations Hub (Attention + Timeline + Engagements by stage)** -- the new "home screen" that justifies the redesign
4. **Engagement Workspace with Lifecycle Bar** -- the heart of the redesign; tabbed shell + scoped views of existing features
5. **Shared DossierDetailShell + RelationshipSidebar** -- consistent structure for all 8 types before adding enrichments
6. **Quick Switcher (Cmd+K)** -- high user value, independent of other features, can ship in parallel

### Defer:

- **Tier-specific dossier enrichments:** High effort, implement incrementally after the shell is stable. Start with Countries (highest usage), then Organizations, then others.
- **Forum recurring sessions:** High complexity, most niche use case. Build after engagement workspace is proven.
- **Network graph in sidebar:** Nice-to-have; the existing full-page graph works. Relocate only after RelationshipSidebar ships.
- **Calendar conflict detection:** Medium complexity for a convenience feature. Add after scoped calendar is working.
- **Availability polling absorption:** Lowest priority of all absorbed features. Move last.

---

## Complexity Budget Summary

| Category                   | Count        | Estimated Effort            |
| -------------------------- | ------------ | --------------------------- |
| Table Stakes               | 14 features  | ~60-70% of milestone effort |
| Differentiators (MVP)      | 4-5 features | ~20-25% of milestone effort |
| Differentiators (Deferred) | 5-6 features | Future phases               |
| Anti-Features              | 8 items      | $0 -- avoided by design     |

---

## Sources

- [CRM UX Design Best Practices -- Aufait UX](https://www.aufaitux.com/blog/crm-ux-design-best-practices/) -- MEDIUM confidence
- [Enterprise UX Design Guide 2026 -- FuseLab](https://fuselabcreative.com/enterprise-ux-design-guide-2026-best-practices/) -- MEDIUM confidence
- [CRM Dashboards in 2026 -- Monday.com](https://monday.com/blog/crm-and-sales/crm-dashboards/) -- MEDIUM confidence
- [Fixing Dashboard Fatigue -- MageMetrics](https://www.magemetrics.com/blog/fixing-dashboard-fatigue-design-patterns-that-actually-get-used) -- MEDIUM confidence
- [Role-Based Dashboards -- ZealousWeb](https://www.zealousweb.com/blog/role-based-dashboards-for-business-analytics/) -- MEDIUM confidence
- [7 Smart Tools for Role-Based Dashboards -- PLGOS](https://www.plgos.com/blogs/7-smart-tools-to-automate-role-based-dashboards-in-saas) -- MEDIUM confidence
- [Beyond the Progress Bar: Stepper UI Design -- Medium](https://medium.com/@david.pham_1649/beyond-the-progress-bar-the-art-of-stepper-ui-design-cfa270a8e862) -- MEDIUM confidence
- [Stepper UI Examples -- Eleken](https://www.eleken.co/blog-posts/stepper-ui-examples) -- MEDIUM confidence
- [Command Palette UX Patterns -- Medium/Bootcamp](https://medium.com/design-bootcamp/command-palette-ux-patterns-1-d6b6e68f30c1) -- MEDIUM confidence
- [CMD+K Search Pattern -- Chameleon](https://www.chameleon.io/patterns/cmd-k-search) -- MEDIUM confidence
- [Salesforce Lightning Page Customization -- Trailhead](https://trailhead.salesforce.com/content/learn/modules/lex_customization/lex_customization_page_layouts) -- HIGH confidence
- [Salesforce Related Lists -- StarrData](https://starrdata.com/salesforce-related-lists/) -- MEDIUM confidence
- [Stakeholder Engagement Software -- Jambo](https://www.jambo.cloud/) -- MEDIUM confidence
- [Top Stakeholder Management Software -- ProofHub](https://www.proofhub.com/articles/stakeholder-management-software) -- MEDIUM confidence
- [B2B SaaS UX Design in 2026 -- Onething](https://www.onething.design/post/b2b-saas-ux-design) -- MEDIUM confidence
- [6 Top UX Trends for B2B SaaS 2025 -- SuperUser Studio](https://www.superuserstudio.com/insights/6-top-ux-trends-transforming-b2b-saas-in-2025) -- MEDIUM confidence
- [Notification UX Guidelines -- Smashing Magazine](https://www.smashingmagazine.com/2025/07/design-guidelines-better-notifications-ux/) -- HIGH confidence
- [HubSpot Lifecycle Stages -- Knowledge Base](https://knowledge.hubspot.com/object-settings/create-and-customize-lifecycle-stages) -- HIGH confidence

---

_Feature landscape analysis for v3.0 "Connected Workflow" milestone: 2026-03-28_
