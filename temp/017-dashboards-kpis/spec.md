# 017 — Dashboards & KPIs — Spec

Purpose: provide pipeline, SLA health, renewals, relationship heat, and performance views for teams and individuals.

## Goals

- Individual dashboard: SLA compliance, time‑to‑first‑action, time‑to‑resolution, quality flags.
- Team dashboard: backlog health, WIP vs capacity, renewals at risk, commitments on track.

## UI

- Routes: `/_protected/dashboards/team`, `/_protected/dashboards/me`.
- Components: KPI tiles, trend charts, heat maps (relationship health by dossier).

## API

- `/api/dashboards/team` and `/api/dashboards/me` aggregating from SLA events, Assignment, MoUService, TaskService.

## Acceptance

- KPIs align with PRD; export CSV/PDF; filters persist.
