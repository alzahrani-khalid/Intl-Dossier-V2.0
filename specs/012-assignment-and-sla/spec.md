# 012 — Assignment Engine & SLA — Spec

Purpose: auto‑route work based on unit/skills/capacity, enforce WIP limits and SLAs, and handle escalations.

## Goals

- Assignment engine with skills matrix, capacity and OOO awareness.
- WIP limits per user/queue with override + justification.
- SLA policy evaluation with first‑action/resolution tracking and escalations.

## UX

- Supervisor dashboard: WIP per user, capacity heatmap, override action with reason.
- Ticket/task detail: SLA clocks, escalation history, reassignment suggestions.

## UI

- Routes: `/_protected/supervision` (WIP/capacity), SLA widgets on intake/task detail.

## API

- Assignment: `POST /api/assignments/suggest`, `POST /api/assignments/accept`, `POST /api/assignments/override`.
- SLA: `GET /api/sla/policies`, `POST /api/sla/evaluate`, `GET /api/sla/health`.

## AI

- Next assignee recommendation (skills, history, load), with explanation.
- SLA risk prediction (breach probability) for prioritization.

## Acceptance

- Assignment suggestions match constraints (skills/OOO/WIP) and are logged.
- SLA clocks update and drive alerts; escalations visible.
