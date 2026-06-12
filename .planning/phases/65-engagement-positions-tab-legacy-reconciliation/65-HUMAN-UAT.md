---
status: complete
phase: 65-engagement-positions-tab-legacy-reconciliation
source: [65-VERIFICATION.md]
started: 2026-06-13T00:30:00Z
updated: 2026-06-13T00:45:00Z
---

## Current Test

[complete — all items resolved during the 65-06 live UAT session (orchestrator-run, agent-browser + Supabase MCP)]

## Tests

### 1. Positions tab routed and rendering canonical rows live

expected: /engagements/<id>/positions renders DossierPositionsTab between Context and Tasks
result: passed — observed live on staging (after fixing the live-caught routeTree gap, commit 36199591). Evidence: /tmp/uat65-3-tab-live.png; attach + create cards rendered (uat65-5, uat65-6).

### 2. Attach persists + renders without reload (ENGPOS-02 live criterion)

expected: attach-existing persists a position_dossier_links row for the engagement dossier and the card renders without reload
result: passed — link row 1f1e2657 (dossier_id = b0000002-…-0001, link_type related_to), count 0→1 in the same SPA session; create-new produced position 0ea48c56 + applies_to link, count 1→2.

### 3. Re-enabled CTAs functional (write AND render paths)

expected: Create task ×3 and Add event ×2 open dialogs and persist+render
result: passed — task c1a2b10f created with engagement_id NULL + work_item_dossiers row; calendar entry 9870d2ba created and rendered in the Scheduled events section WITHOUT reload; kanban caveat observed honestly (board on legacy plane stays empty, copy points to main tasks list).

### 4. Removed CTAs absent + AR/RTL contract

expected: Advance Stage ×2, Link Dossier ×2, Upload absent; AR labels (المواقف، الأحداث المجدولة، إضافة حدث), dir=rtl + Tajawal, Arabic-Indic digit dates, no overflow at 1280/1024
result: passed — grep count 0 for removed buttons (uat65-7/14/15); AR evidence uat65-16/17/18; EN widths uat65-19/20; hOverflow false everywhere.

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

(none)
