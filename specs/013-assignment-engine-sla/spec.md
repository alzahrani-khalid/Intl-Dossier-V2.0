# Feature Specification: Assignment Engine & SLA

**Feature Branch**: `013-assignment-engine-sla`
**Created**: 2025-10-02
**Status**: Draft
**Input**: User description: "Assignment Engine & SLA — Spec

Purpose: auto‑route work based on unit/skills/capacity, enforce WIP limits and SLAs, and handle escalations.
ultrathink"

## Execution Flow (main)
```
1. Parse user description from Input
   → Extracted: auto-routing, unit/skills/capacity, WIP limits, SLAs, escalations
2. Extract key concepts from description
   → Actors: system, staff members, managers/supervisors
   → Actions: assign work, check capacity, enforce limits, track SLAs, escalate
   → Data: assignments, skills, capacity, SLA timers, escalation rules
   → Constraints: WIP limits, SLA deadlines
3. For each unclear aspect:
   → Multiple clarifications needed (marked below)
4. Fill User Scenarios & Testing section
   → Primary scenarios identified for auto-assignment and escalation
5. Generate Functional Requirements
   → 18 testable requirements generated
6. Identify Key Entities
   → 7 entities identified
7. Run Review Checklist
   → WARN "Spec has uncertainties" - multiple [NEEDS CLARIFICATION] markers
8. Return: SUCCESS (spec ready for clarification and planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## Clarifications

### Session 2025-10-02
- Q: When all eligible staff members are at their WIP limit, what should the system do with the new work item? → A: Queue the item and assign it when capacity becomes available
- Q: What are the specific SLA timeframes for different work item types and priorities? → A: Dossiers (Urgent: 8h, High: 24h, Normal: 48h, Low: 5d), Tickets (Urgent: 2h, High: 24h, Normal: 48h, Low: 5d), Positions & Tasks (Urgent: 4h, High: 24h, Normal: 48h, Low: 5d)
- Q: At what point should the system automatically escalate a work item based on its SLA? → A: Multiple thresholds: warning notification at 75% of SLA elapsed, automatic escalation at 100% (deadline breach)
- Q: How should WIP (Work-In-Progress) limits be configured in the system? → A: Both individual staff member limits and organizational unit limits; system enforces whichever limit is reached first
- Q: When a staff member goes on leave, what should happen to their existing assigned work items? → A: Hybrid approach - automatically reassign urgent and high priority items to available staff with matching skills; flag normal and low priority items for manual review by supervisor

---

## User Scenarios & Testing

### Primary User Story
When a new dossier, ticket, position, or task is created, the system automatically assigns it to the most appropriate staff member based on their organizational unit, required skills, current workload, and capacity. The system enforces Work-In-Progress (WIP) limits to prevent overload, tracks Service Level Agreements (SLAs) to ensure timely completion, and automatically escalates items that risk missing their deadlines.

### Acceptance Scenarios

1. **Given** a new intake ticket is created requiring Arabic translation skills, **When** the auto-assignment engine runs, **Then** the ticket is assigned to an available staff member in the appropriate unit who has Arabic translation skills and has not reached their WIP limit

2. **Given** a staff member has 5 active assignments and their individual WIP limit is 5, **When** the system attempts to assign a new item to them, **Then** the assignment is rejected and the item is assigned to the next best-matched staff member with available capacity

2a. **Given** an organizational unit has 20 active assignments and their unit WIP limit is 20, **When** the system attempts to assign a new item to any staff member in that unit, **Then** the assignment is rejected even if individual staff members have available capacity, and the item is queued

3. **Given** an assigned dossier has an SLA deadline of 48 hours, **When** 36 hours have elapsed without status change, **Then** the system automatically escalates the dossier to the staff member's supervisor and sends notifications

4. **Given** a high-priority position requires approval, **When** the auto-assignment engine evaluates candidates, **Then** priority items are assigned before normal-priority items, even if normal items were created earlier

5. **Given** no staff members in the required unit have available capacity, **When** a new urgent item needs assignment, **Then** the system queues the item and automatically assigns it when a staff member completes work and gains available capacity

6. **Given** a staff member goes on leave with 3 urgent items and 2 normal items assigned, **When** the system detects their unavailability, **Then** the 3 urgent items are automatically reassigned to available staff with matching skills, and the 2 normal items are flagged for manual review by the supervisor

### Edge Cases

- What happens when multiple items arrive simultaneously and compete for the same assignee?
- How does the system handle items requiring multiple skill sets that no single staff member possesses?
- What happens when an SLA deadline passes without escalation being actioned?
- How does the system prioritize between an item nearing its SLA deadline versus a higher-priority new item?
- What happens when a queued item's SLA deadline approaches while still waiting for capacity?
- How does the system handle partial skill matches (e.g., staff member has 3 of 5 required skills)?
- What happens when an escalated item is not actioned by the escalation recipient within [NEEDS CLARIFICATION: timeframe?]

---

## Requirements

### Functional Requirements

**Auto-Assignment**
- **FR-001**: System MUST automatically assign incoming work items (dossiers, tickets, positions, tasks) based on configurable assignment rules
- **FR-002**: System MUST match work items to staff members based on organizational unit membership
- **FR-003**: System MUST match work items to staff members based on required skills and staff member skill profiles
- **FR-004**: System MUST consider staff member current workload (number of active assignments) when assigning new work
- **FR-005**: System MUST respect configurable Work-In-Progress (WIP) limits at both individual staff member level and organizational unit level, enforcing whichever limit is reached first
- **FR-006**: System MUST prioritize assignments based on work item priority levels (urgent, high, normal, low)
- **FR-007**: System MUST support manual override of auto-assignments by users with appropriate permissions
- **FR-007a**: Supervisors can manually override assignments only for work items within their organizational unit
- **FR-007b**: Administrators can manually override assignments for any work item across all organizational units
- **FR-007c**: Manual overrides MUST bypass WIP limits with documented override reason; system logs warning in audit trail but does NOT block assignment

**Capacity Management**
- **FR-008**: System MUST prevent assignment to staff members who have reached their WIP limit
- **FR-009**: System MUST track staff member availability status (available, on leave, unavailable)
- **FR-010**: System MUST queue work items in priority order when no eligible staff members have available capacity, and automatically assign them when capacity becomes available
- **FR-011a**: When a staff member's status changes to "on leave", system MUST automatically reassign all their urgent and high priority work items to available staff with matching skills
- **FR-011b**: When a staff member's status changes to "on leave", system MUST flag all their normal and low priority work items for manual review and reassignment by their supervisor

**SLA Tracking**
- **FR-012**: System MUST track Service Level Agreement (SLA) deadlines for assigned work items
- **FR-013**: System MUST calculate SLA deadlines based on work item type, priority, and creation timestamp using the following matrix:
  - Dossiers: Urgent=8 hours, High=24 hours, Normal=48 hours, Low=5 days
  - Tickets: Urgent=2 hours, High=24 hours, Normal=48 hours, Low=5 days
  - Positions: Urgent=4 hours, High=24 hours, Normal=48 hours, Low=5 days
  - Tasks: Urgent=4 hours, High=24 hours, Normal=48 hours, Low=5 days
- **FR-014**: System MUST display remaining SLA time for each assignment in user interfaces
- **FR-015**: System MUST send warning notifications when SLA reaches 75% elapsed time

**Escalation Management**
- **FR-016**: System MUST automatically escalate work items when SLA reaches 100% (deadline breach)
- **FR-017**: System MUST escalate to the assignee's supervisor or designated escalation contact
- **FR-017a**: System MUST resolve escalation recipient via fallback chain: 1) explicit escalation_chain_id, 2) unit supervisor, 3) fallback to system administrator
- **FR-018**: System MUST notify both the original assignee and escalation recipient when escalation occurs
- **FR-019**: System MUST track escalation history and allow reporting on escalation patterns with 90-day retention for resolved events (SLA breach events retained indefinitely for audit compliance)

### Key Entities

- **Assignment Rule**: Defines criteria for auto-assigning work items, including unit matching, skill requirements, capacity checks, and priority handling
- **Staff Profile**: Contains organizational unit, individual WIP limit, skill set, availability status, escalation chain, and current assignment count for each staff member
- **Organizational Unit**: Represents a department or team; has unit-level WIP limit and contains multiple staff members
- **Skill**: Represents a competency or capability (e.g., Arabic translation, legal review, technical writing) that can be required by work items and possessed by staff members
- **Work Item**: Generic term for dossiers, tickets, positions, or tasks that can be assigned; includes type, priority, required skills, SLA deadline, and assignment status
- **Assignment Queue**: Priority-ordered queue of work items waiting for staff capacity; items automatically assigned when matching staff becomes available
- **SLA Configuration**: Defines deadline calculation rules with specific timeframes: Dossiers (8h/24h/48h/5d), Tickets (2h/24h/48h/5d), Positions & Tasks (4h/24h/48h/5d) for Urgent/High/Normal/Low priorities respectively
- **Escalation Event**: Records when an item was escalated, to whom, reason, and outcome; used for reporting and audit trails
- **Capacity Snapshot**: [NEEDS CLARIFICATION: Does the system need to track historical capacity metrics for reporting/analytics?]

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain - **All 5 clarifications resolved** (see Outstanding Clarifications section)
- [x] Requirements are testable and unambiguous - **core requirements resolved**
- [x] Success criteria are measurable - **SLA thresholds and WIP limits defined**
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified - **Phase 1 scope defined, Phase 2 deferrals documented**

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Clarification session completed (5 critical questions resolved)
- [ ] Review checklist passed - **BLOCKED: 5 low-priority clarifications remain**

---

## Outstanding Clarifications Required

**All clarifications resolved as of 2025-10-02. See research.md for detailed decisions:**

1. ✅ **Override Permissions**: Supervisors can override within their unit (FR-007a), Admins can override any assignment (FR-007b), overrides bypass WIP limits (FR-007c)
2. ✅ **Availability Integration**: Manual status updates via UI in Phase 1; HR system integration deferred to Phase 2
3. ✅ **Escalation Chain Definition**: Falls back in order: explicit escalation_chain_id → unit supervisor → system admin (see FR-017a, migration T016)
4. ✅ **Escalation History Retention**: 90 days for resolved events; indefinite retention for SLA breach events (see FR-019, T019a)
5. ✅ **Capacity Analytics**: Historical capacity snapshots stored daily (T018); analytics dashboard deferred to Phase 2

**Resolved during clarification session (2025-10-02)**:
- ✅ WIP Limits configuration
- ✅ Capacity exhaustion behavior
- ✅ Leave handling workflow
- ✅ SLA timeframe matrix
- ✅ SLA notification and escalation thresholds
