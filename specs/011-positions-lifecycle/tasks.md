# Tasks — Positions Lifecycle

## Backend

- [ ] Extend positions API: CRUD, submit, approve (step‑up), publish, list versions.
- [ ] Migrations for versions/approvals/publications tables + RLS.
- [ ] Hook PositionConsistencyService in create/update and nightly job.

## Frontend

- [ ] List + filters; editor with EN/AR; diff/versions view.
- [ ] Approval screen and publish flow (with step‑up prompt).
- [ ] Consistency panel and reconcile actions.

## AI

- [ ] Draft/translate helpers with prompt templates + terminology store.

## Tests

- [ ] Contract tests for state transitions; E2E for draft→publish.
