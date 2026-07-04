---
status: partial
phase: 81-visible-bugs
source: [81-VERIFICATION.md]
started: 2026-07-04T10:04:40Z
updated: 2026-07-04T10:04:40Z
---

## Current Test

[awaiting human visual confirmation]

## Tests

### 1. BUG-01 — Kanban 4 columns unclipped (visual glance)

expected: At 1400px and 1024px, in EN/LTR and AR/RTL, all four kanban columns (To do / In progress / Review / Done — مكتمل) are reachable and unclipped; empty columns still show their header + `0`. Executor evidence: browser-measured `overflowsX:false` at 1400 (4×265px), scroll reaches Done at 1024; screenshots captured for all four combinations.
result: [pending]

### 2. BUG-05 — KPI labels single-line @1024 (visual glance)

expected: At 1024px, in EN and AR, all KPI strip labels (incl. the long AR "SLA at risk") render on a single line with no wrap. Executor evidence: DOM-measured `truncated:false` for all four labels at 1024; no AR copy shortened.
after_shot: `/tmp/design-review-260704/shots/dashboard__dark__en__1024__after.png`
after_shot_evidence: Captured on a dedicated headless Chrome with the CSS viewport pinned to exactly 1024px (CDP `Emulation.setDeviceMetricsOverride width=1024`), EN, dark canonical (root class `dark dir-linear`, bodyBG `rgb(1,1,2)`). All four KPI labels measured `white-space: nowrap` with `offsetHeight == line-height == 15px` (single line): ACTIVE ENGAGEMENTS / OPEN COMMITMENTS / SLA AT RISK / WEEK AHEAD — none wrap.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
