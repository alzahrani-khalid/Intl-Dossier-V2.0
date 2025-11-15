# Feature Specification: Relationship Health & Commitment Intelligence

**Feature Branch**: `030-health-commitment`
**Created**: 2025-11-15
**Status**: Draft
**Input**: User description: "Feature Name: Relationship Health & Commitment Intelligence (RHCI)

Feature Description:
Purpose: Fix broken dossier stats (commitments, health scores) by implementing the relationship health calculation from spec 009 and aggregating commitment metrics.

## Problem
- Dossier stats API returns zeros for active_commitments, overdue_commitments, total_documents, and null for relationship_health_score
- UI displays placeholder data instead of real commitment tracking
- Relationship health formula from spec 009 exists but isn't implemented in the data pipeline
- Backend RelationshipHealthService is disconnected from Supabase functions
- Users can't track international commitments (core mission requirement FR-009)

## Goals
1. Produce authoritative per-dossier metrics (engagement frequency, commitment fulfillment, document totals) within ≤500ms
2. Implement spec 009 health formula once: (engagement_frequency * 0.30) + (commitment_fulfillment_rate * 0.40) + (recency_score * 0.30)
3. Power dossier detail views and dashboard with live data (no hardcoded fallbacks)
4. Enable commitment tracking with SLA alerts for overdue items

## Solution Overview
- Maintain pre-computed engagement and commitment metrics per dossier, refreshed automatically on a schedule
- Implement the spec 009 relationship health formula as the single authoritative calculation method
- Store calculated health scores with timestamps to ensure data freshness
- Trigger immediate recalculation when commitments change status to keep metrics current
- Provide dossier stats through data access layer returning real aggregated metrics
- Support bulk queries for dashboard views requiring multiple dossier stats simultaneously
- Wire existing stats display components to retrieve live data instead of placeholder values
- Enable operational monitoring and alerting when data becomes stale or calculations fail

## Acceptance Criteria
- Dossier stats display real non-zero counts for commitments, engagements, and documents
- Dashboard health visualizations show actual aggregated relationship metrics without hardcoded values
- Commitment status changes reflect in dossier stats within 2 minutes
- Health score calculations match spec 009 formula within ±1 point for all test cases
- Operations team receives alerts for data staleness or system issues"

## User Scenarios & Testing

### User Story 1 - View Accurate Dossier Stats (Priority: P1)

A policy analyst views a country dossier to assess the health of the bilateral relationship before preparing for an upcoming high-level engagement. They need to see accurate metrics about active commitments, overdue obligations, and overall relationship health score to inform their briefing materials and identify areas requiring attention.

**Why this priority**: This is the core broken functionality that users encounter daily. Without accurate stats, analysts cannot trust the system for decision-making, undermining the entire dossier management value proposition.

**Independent Test**: Can be fully tested by querying a dossier with existing engagements and commitments, then verifying that the displayed stats (active commitments, overdue commitments, documents, health score) match the actual database records.

**Acceptance Scenarios**:

1. **Given** a dossier has 5 active commitments, 2 overdue commitments, and 12 recent engagements, **When** the analyst views the dossier detail page, **Then** the stats panel displays "5 Active Commitments", "2 Overdue Commitments", "12 Total Engagements", and a health score calculated using the spec 009 formula.

2. **Given** a dossier has insufficient data (fewer than 3 engagements or 0 commitments), **When** the analyst views the dossier, **Then** the system displays an "Insufficient Data" message for the health score with an explanation of minimum data requirements.

3. **Given** an analyst is viewing a dossier, **When** they click on the "Active Commitments" stat, **Then** the system navigates to the existing commitments list filtered to show only active commitments for that dossier with owner names, due dates, and descriptions.

4. **Given** a dossier has overdue commitments, **When** the analyst views the stats, **Then** the overdue count is highlighted in red/warning color and the health score reflects the negative impact of unfulfilled obligations.

---

### User Story 2 - Monitor Relationship Health Across Partners (Priority: P1)

A senior manager views the dashboard to monitor the health of relationships across all international partners. They need to identify at-risk relationships (low health scores) and high-performing partnerships to allocate resources effectively and prioritize diplomatic efforts.

**Why this priority**: This addresses the dashboard's currently hardcoded placeholder data and enables strategic oversight - a key value proposition for leadership users.

**Independent Test**: Can be tested by loading the dashboard, verifying the relationship health chart displays real aggregated data grouped by region/bloc, and confirming the data updates when commitment statuses change.

**Acceptance Scenarios**:

1. **Given** the system has calculated health scores for 25 country dossiers, **When** the manager views the dashboard relationship health chart, **Then** the chart displays health scores grouped by region (e.g., Middle East: 78, Europe: 85, Asia: 62) without any hardcoded values.

2. **Given** a commitment becomes overdue for a country in the Middle East region, **When** the health score is recalculated within 2 minutes, **Then** the dashboard chart reflects the updated regional average for Middle East.

3. **Given** the manager hovers over a region's health score bar, **When** the tooltip appears, **Then** it shows the component breakdown: engagement frequency score, commitment fulfillment rate, and recency score.

4. **Given** the manager clicks on a region with low health score, **When** navigating to the detail view, **Then** the system displays a list of dossiers in that region sorted by health score (lowest first) with visible commitment and engagement metrics.

---

### User Story 3 - Track Commitment Fulfillment (Priority: P2)

An engagement coordinator monitors commitments resulting from after-action records to ensure follow-up actions are completed on time. They need visibility into which commitments are approaching their due dates, which are overdue, and which have been fulfilled to maintain accountability and diplomatic credibility.

**Why this priority**: While not the initial broken feature, commitment tracking is essential for operational effectiveness and was promised in FR-009. This enables proactive management of international obligations.

**Independent Test**: Can be tested independently by creating commitments with various due dates and statuses, then verifying the system correctly identifies active, overdue, and upcoming commitments with appropriate alerts.

**Acceptance Scenarios**:

1. **Given** a commitment is due within 30 days, **When** the coordinator views the commitment list, **Then** the commitment is flagged as "Upcoming" with a visual indicator showing days remaining.

2. **Given** a commitment's due date has passed and status is still "pending" or "in_progress", **When** the daily automated check runs, **Then** the system automatically updates the commitment status to "overdue" and triggers a notification to the commitment owner.

3. **Given** an internal staff member is assigned 8 commitments across 4 different dossiers, **When** they view their personal commitments dashboard, **Then** all 8 commitments are displayed sorted by due date with dossier context and quick status update actions.

4. **Given** a commitment is marked as "completed", **When** the health score is recalculated for that dossier, **Then** the commitment fulfillment rate increases and the overall health score reflects the positive change.

---

### User Story 4 - Receive Real-Time Health Updates (Priority: P3)

A dossier owner receives timely updates when their dossier's health score changes significantly due to new engagements, completed commitments, or overdue obligations. This allows them to intervene quickly when relationships deteriorate or celebrate successes when health improves.

**Why this priority**: This is an enhancement that adds proactive value but is not critical for the core broken functionality. It can be delivered after the foundational data pipeline is working.

**Independent Test**: Can be tested by changing commitment statuses or adding engagements, then verifying notifications are sent and the health score cache is updated within the 2-minute SLA.

**Acceptance Scenarios**:

1. **Given** a dossier's health score drops below 60 (from "good" to "fair" threshold), **When** the automated refresh runs, **Then** the dossier owner receives an in-app notification with the new score and contributing factors (e.g., "2 commitments became overdue").

2. **Given** a major engagement is logged that significantly improves engagement frequency, **When** the health score is recalculated, **Then** the cache is refreshed within 2 minutes and the updated score is visible on the dossier page without manual page refresh.

3. **Given** a dossier has had no activity for 180 days, **When** the recency score calculation runs, **Then** the health score reflects the low recency component (10 points) and the owner receives a "relationship at risk" alert.

---

### Edge Cases

- **Dossier with no commitments**: System displays "No commitments tracked" and calculates health score using only engagement frequency and recency (commitment fulfillment defaults to 100% if no commitments exist).

- **Dossier with all commitments cancelled**: Cancelled commitments are excluded from fulfillment rate calculation to avoid penalizing strategic decisions to cancel obligations.

- **Engagement spike followed by silence**: Health score initially improves due to high engagement frequency but gradually declines as recency score decreases over time (30-day, 90-day, 180-day thresholds).

- **Commitment marked complete after due date**: Late completion counts as "completed" for fulfillment rate but the delay may have already triggered "overdue" status and lowered the health score temporarily.

- **Materialized view refresh failure**: If automated refresh fails twice consecutively, system logs critical alert to monitoring stack and falls back to on-demand calculation (with 400ms timeout) to serve user requests without blocking.

- **Concurrent commitment status updates**: Database triggers ensure health cache refresh is triggered for affected dossiers, but multiple rapid updates within the 2-minute window are coalesced to avoid redundant calculations.

- **External commitment owner cannot update status**: Manual tracking commitments assigned to external contacts require staff intervention to update status, potentially causing delay in health score accuracy.

- **Deleted dossier with cached health data**: Cascade delete ensures health cache records are removed when parent dossier is deleted to prevent orphaned data.

## Requirements

### Functional Requirements

#### Data Aggregation & Calculation

- **FR-001**: System MUST aggregate engagement metrics per dossier including total engagement count (last 365 days), recent engagement count (last 90 days), engagement frequency score (normalized 0-100), and latest engagement date.

- **FR-002**: System MUST aggregate commitment metrics per dossier including total commitments, active commitments (status: pending or in_progress), overdue commitments (due_date < today AND status not completed/cancelled), fulfilled commitments (status: completed), upcoming commitments (due within 30 days), and commitment fulfillment rate ((fulfilled / total) × 100).

- **FR-003**: System MUST calculate relationship health score using the spec 009 formula: `(engagement_frequency × 0.30) + (commitment_fulfillment_rate × 0.40) + (recency_score × 0.30)` where engagement_frequency is normalized count of engagements in last 365 days (0-100 scale), commitment_fulfillment_rate is percentage of completed commitments (0-100), and recency_score is 100 if last engagement within 30 days, 70 if 30-90 days, 40 if 90-180 days, 10 if >180 days.

- **FR-004**: System MUST store calculated health scores in a cache with components (engagement_frequency, commitment_fulfillment_rate, recency_score), overall score (0-100), and calculation timestamp for observability.

- **FR-005**: System MUST handle edge cases: dossiers with zero commitments default commitment_fulfillment_rate to 100%, dossiers with <3 engagements return null health score with "Insufficient Data" flag, and cancelled commitments are excluded from fulfillment rate calculations.

#### Data Refresh & Consistency

- **FR-006**: System MUST refresh engagement and commitment aggregations automatically on a regular schedule to keep dossier stats current without manual intervention.

- **FR-007**: System MUST trigger immediate health score recalculation when commitment status changes (pending → in_progress → completed/cancelled/overdue) to ensure stats reflect latest obligation fulfillment within 2 minutes.

- **FR-008**: System MUST detect and auto-mark commitments as "overdue" when due_date < current_date AND status is pending or in_progress, then notify the commitment owner and dossier owner via in-app notification with commitment details (description, original due date, dossier name) and recommended actions.

- **FR-009**: System MUST provide immediate fallback calculation when stored health scores are outdated or unavailable, ensuring users receive current metrics without waiting, then update stored scores in the background for future requests.

- **FR-010**: System MUST track when dossier health data becomes outdated and alert operations team with sufficient detail to identify affected dossiers and investigate root causes.

#### API & Data Access

- **FR-011**: Dossier stats queries MUST return complete real data including active commitments count, overdue commitments count, total documents count, recent activity count (last 90 days), relationship health score (0-100 or null for insufficient data), and health score component breakdown (engagement frequency, commitment fulfillment rate, recency score).

- **FR-012**: System MUST support efficient bulk stats queries accepting multiple dossier identifiers and returning stats for all requested dossiers together, enabling dashboard views to load multiple dossier summaries without delays.

- **FR-013**: Dashboard health aggregations MUST provide grouped health scores organized by filter criteria (region, bloc, classification) with average scores, dossier counts, and health distribution (excellent/good/fair/poor counts) for strategic overview.

- **FR-014**: Dossier stats MUST include data freshness indicators (when last calculated, whether data is current) and trigger operational alerts when data becomes outdated, ensuring transparency about data reliability.

- **FR-015**: System MUST allow users to request only specific stat categories they need (optional stats inclusion), reducing unnecessary data transfer and improving page load performance for views that don't require full stat details.

#### Frontend Integration

- **FR-016**: Dossier detail page MUST display real stats replacing placeholder zeros: active commitments count, overdue commitments count (with warning color if >0), total documents count, recent activity count, and health score with color-coded visual indicator (green: 80-100, yellow: 60-79, orange: 40-59, red: 0-39).

- **FR-017**: Health score display MUST show component breakdown on hover/click revealing engagement frequency contribution, commitment fulfillment rate contribution, and recency score contribution with tooltips explaining each metric.

- **FR-018**: Dashboard relationship health chart MUST display real aggregated data replacing hardcoded regional averages and automatically update when underlying dossier data changes.

- **FR-019**: Clicking on a stat (e.g., "5 Active Commitments") MUST navigate to filtered view showing relevant records for that dossier with sort/filter capabilities.

- **FR-020**: System MUST display "Insufficient Data" message when health score is null due to <3 engagements or 0 commitments, explaining minimum data requirements to users.

#### Observability & Monitoring

- **FR-021**: System MUST record detailed activity logs for all health score calculations including which dossier was calculated, what the resulting score was, which components contributed to the score, and how long the calculation took to support troubleshooting and performance analysis.

- **FR-022**: System MUST track operational metrics about relationship health trends, data staleness issues, outstanding commitment counts, and calculation performance to enable operations team to monitor system health and identify problems.

- **FR-023**: System MUST alert operations team when automated data refresh processes fail repeatedly or when significant portions of dossier data become outdated, enabling proactive intervention before users experience stale information.

- **FR-024**: System MUST identify and flag performance issues when health calculations take unusually long, allowing operations team to investigate bottlenecks and maintain responsive user experience.

### Key Entities

- **Relationship Health Score**: A composite metric (0-100 scale) representing the overall strength and vitality of a diplomatic relationship. Calculated from three components: how frequently the parties engage, how well they fulfill mutual commitments, and how recently they've interacted. Provides at-a-glance assessment of relationship status with color-coded visual indicators (excellent/good/fair/poor).

- **Commitment Portfolio**: The collection of agreed-upon obligations and action items associated with a dossier, tracking what has been promised and whether promises are being kept. Includes active obligations currently in progress, overdue items requiring attention, fulfilled commitments demonstrating reliability, and upcoming deadlines within the next 30 days.

- **Engagement History**: The record of all diplomatic interactions (meetings, consultations, workshops, conferences) between parties over time. Provides the foundation for measuring relationship activity patterns, engagement frequency trends, and interaction recency to assess relationship momentum.

- **Dossier Statistics Summary**: A comprehensive dashboard view of key dossier metrics including total engagement counts, commitment fulfillment status, document repository size, and recent activity indicators. Enables quick assessment of dossier completeness and relationship status without drilling into detailed records.

- **Commitment**: An action item or deliverable that one party has promised to the other during an engagement. Includes the specific obligation description, who is responsible (internal staff or external contact), priority level (low to critical), current status (pending, in progress, completed, cancelled, or overdue), and when it must be fulfilled. Tracks accountability for international obligations.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users viewing a dossier with existing engagements and commitments see accurate non-zero stats (active commitments, overdue commitments, documents, health score) that match database records within 1% accuracy.

- **SC-002**: Dossier stats load instantly without noticeable delay when analysts view dossier pages, ensuring smooth user experience and uninterrupted workflow.

- **SC-003**: Commitment status changes trigger health score recalculation and cache refresh within 2 minutes, visible to users without manual page refresh, maintaining data freshness.

- **SC-004**: Dashboard relationship health chart displays real aggregated data for all regions/blocs without hardcoded values, updating automatically when underlying dossier data changes.

- **SC-005**: Health score calculation matches spec 009 formula within ±1 point margin for all test scenarios, ensuring consistency with original specification.

- **SC-006**: System successfully handles edge cases (zero commitments, insufficient engagements, cancelled commitments) without errors or incorrect calculations, displaying appropriate user-friendly messages.

- **SC-007**: Automated refresh jobs achieve 99.9% success rate over 30-day period, with failures triggering alerts and fallback to on-demand calculation to maintain availability.

- **SC-008**: Operations team can monitor relationship health trends and identify data quality issues through dashboards with near-real-time updates, enabling proactive response to system problems.

- **SC-009**: Analysts can identify at-risk relationships (health score <60) from dashboard within 10 seconds, improving resource allocation and diplomatic prioritization.

- **SC-010**: 95% of dossiers with sufficient data have current health scores (<60 minutes stale) at any given time, ensuring users can trust displayed metrics.

## Assumptions

1. **Engagement frequency normalization**: Assumes 50 engagements in 365 days represents "excellent" engagement (100 points), with linear scaling down to 0 engagements = 0 points. This threshold may need tuning based on actual engagement patterns observed in production.

2. **Recency thresholds**: Assumes the 30/90/180 day boundaries from spec 009 are appropriate for all dossier types (countries, organizations, forums). Different dossier types may have different natural engagement cadences.

3. **Materialized view performance**: Assumes aggregating engagement and commitment data for ~500 dossiers can complete within the 15-minute refresh window without performance degradation. May need partitioning strategy for larger datasets.

4. **Cache staleness tolerance**: Assumes 60-minute staleness threshold balances data freshness with system load. Users can tolerate slightly outdated metrics for non-critical views.

5. **Commitment ownership**: Assumes internal commitments (assigned to staff) can be automatically tracked, while external commitments (assigned to partner country contacts) require manual status updates by staff.

6. **Document counting**: Assumes total_documents count includes all documents linked to the dossier regardless of type or status. May need filtering by document status (draft/published) based on user feedback.

7. **Health score minimum data**: Assumes requiring 3+ engagements and 1+ commitment is reasonable for meaningful health calculation. Dossiers below this threshold may be newly created or inactive.

8. **Formula weights**: Uses spec 009 weights (engagement 30%, commitment fulfillment 40%, recency 30%) as source of truth, superseding any other formula implementations. This prioritizes promise-keeping over engagement frequency.

## Dependencies

- **Spec 009 (Dossiers Hub)**: Inherits relationship health formula definition and calculation methodology. Changes to spec 009 formula would require corresponding updates here.

- **Spec 010 (After-Action Notes)**: Relies on existing commitment data structure and linkage to after-action records. Changes to how commitments are modeled would impact metric aggregation.

- **Existing Dossier Data Model**: Depends on current engagement records, commitment records, dossier entities, and document storage with established data relationships. Additional data storage for aggregated metrics and calculated scores required.

- **Scheduled Job Infrastructure**: Requires capability to run automated data refresh processes on a regular schedule. Alternative scheduling mechanism needed if current infrastructure changes.

- **Frontend Data Fetching Layer**: Assumes existing data retrieval patterns can be extended to request and consume new stat metrics. Breaking changes to data fetching architecture would impact implementation.

- **Monitoring Platform**: Assumes operational monitoring infrastructure is available for collecting metrics and triggering alerts. Monitoring integration blocked if platform not deployed or accessible.

## Out of Scope

- **Changing commitment authoring workflow**: This feature fixes the broken stats display but does not modify how commitments are created via after-action forms or AI extraction.

- **Modifying engagement creation UX**: Engagement logging workflows remain unchanged; only aggregation and display of engagement data is affected.

- **Redesigning dossier detail layout**: UI updates limited to wiring existing stats components to real data; no visual redesign or new component creation. Clicking stats navigates to existing list views with filter parameters applied.

- **AI-generated health recommendations**: While health scores are calculated, AI-powered suggestions for improving relationship health are deferred to future enhancements.

- **Historical health score trends**: Initial implementation focuses on current health snapshot; time-series charting of health score evolution over months/years is out of scope.

- **Commitment workflow automation**: Automatic assignment, escalation, or reminders for commitments beyond status auto-updates (overdue detection) are future enhancements.

- **Multi-language health score explanations**: Health component tooltips and explanations will be in English initially; Arabic translations added in subsequent i18n pass.

- **Custom health formulas per dossier type**: All dossiers use the same spec 009 formula; allowing different weights for countries vs organizations vs forums is future work.

- **Integration with external task management tools**: Commitment tracking remains internal to the dossier system; exporting commitments to Jira, Asana, etc. is not included.

## Review & Acceptance Checklist

### Content Quality
- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [ ] Success criteria are technology-agnostic (no implementation details)
- [ ] All acceptance scenarios are defined
- [ ] Edge cases are identified
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

### Feature Readiness
- [ ] All functional requirements have clear acceptance criteria
- [ ] User scenarios cover primary flows
- [ ] Feature meets measurable outcomes defined in Success Criteria
- [ ] No implementation details leak into specification
