# Tasks — Assignment & SLA

## Backend

- [ ] Migrations for skills/capacity/oof, assignment_decisions, sla_policies, sla_events.
- [ ] `AssignmentService` + `SLAService`; routers `/api/assignments` and `/api/sla`.
- [ ] Integrate with Intake and Task creation/update.

## Frontend

- [ ] Supervision dashboard (capacity & WIP), inline overrides with justification.
- [ ] SLA widgets on intake/task pages; escalation banners.

## AI

- [ ] Recommender using historical assignee × request type success/time.
- [ ] SLA breach predictor with simple heuristic (then ML later).

## Tests

- [ ] Contract + E2E for suggestions, WIP enforcement, SLA breach escalation.
