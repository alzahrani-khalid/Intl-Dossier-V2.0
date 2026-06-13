# Requirements: Intl-Dossier v6.6 Dossier Workflow Completion

**Defined:** 2026-06-11
**Core Value:** Unified intelligence management for diplomatic operations — every relationship, commitment, and signal tracked in one secure, bilingual platform.
**Source:** `.planning/dossier-workflow-backlog-phases-2026-06-11.md` (bucket-B escalations from the 17-round dossier-workflow inspection loop). Evidence per item lives in `reports/dossier-workflows-round*-inspection-*.md` and `reports/fanout-loop-state.json`.

## v6.6 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Export / Briefing Pack (backlog P1 — HIGH)

- [x] **EXPORT-01**: The dossier Export dialog advertises only formats the system actually produces (decision: implement PDF/DOCX rendering, or relabel to HTML honestly)
- [x] **EXPORT-02**: User can export a dossier of each of the 7 types and receives the advertised file — no 404 (edge deployed on staging) and no stale-column 500 (`positions.classification`/`dossier_ids`, `mous.title_en`/`status`, `documents.entity_type`, legacy `commitments` → `aa_commitments` all reconciled)

### Relationship Graph (backlog P2)

- [x] **GRAPH-01**: User can reach a relationship graph page from a dossier (route mounted, no redirect to `/dossiers`) — or the page is formally retired with the mini-graph + a list view as the documented contract
- [x] **GRAPH-02**: The graph traversal returns both incoming and outgoing relationships, so a dossier referenced by another shows that edge from both sides
- [x] **GRAPH-03**: Clicking either endpoint node navigates to the correct per-type dossier route (helper already correct in MiniRelationshipGraph; full page must match)

### New Position from Dossier (backlog P3)

- [x] **POSNEW-01**: User creating a position from a dossier gets a real position-type picker, bilingual title fields, and audience-group selection that satisfy `positions-create` (no more `position_type_id = dossier_id`, blank `title_ar`, empty `audience_groups`)
- [x] **POSNEW-02**: After create, the `position_dossier_links` row is written and the new position appears on the dossier's Positions tab (live-verified)

### Engagement Positions (backlog P4)

- [x] **ENGPOS-01**: The engagement workspace has a routed Positions tab reading canonical tables (decision: canonical `position_dossier_links` vs legacy `engagement_positions`)
- [x] **ENGPOS-02**: User can attach a position to an engagement; it persists, renders, and invalidates queries
- [x] **ENGPOS-03**: The round-15-disabled workspace CTAs are re-enabled as they are wired — no inert buttons remain in the engagement workspace

### Overview Honesty (backlog P5)

- [x] **OVRERR-01**: Overview section fetchers no longer swallow Supabase errors — a forced section error renders an explicit error state, never a trustworthy-looking zero/empty state (decide the contract: fail-the-query, section-level error metadata, or explicit unknown state — then apply across overview cards)
- [x] **OVRERR-02**: No timeline "View details" navigates to an unmounted route (`/calendar/$id`, `/mous/$id`): suppress the affordance, route to filtered list pages, or add detail routes with enriched relationship metadata

### Per-Type Engagement Contracts (backlog P6)

- [ ] **PERENG-01**: Organization dossiers' Engagements tab honors `engagement_dossiers.host_organization_id` (or the tab is documented as generic history-only — decision implemented either way)
- [ ] **PERENG-02**: Person/EO dossiers' Engagements tab shows `person_engagements` rows per the chosen contract (incl. `get_person_full.recent_engagements` wiring)
- [ ] **PERENG-03**: Legacy unrouted `*DossierDetail` components are routed or deleted, and their raw-key i18n debt is cleared on whatever survives

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Intelligence Engine (v7.0)

- **INTEL-API/UI**: API + UI + ingestion + alerting + multi-dossier AI correlation on the v6.3 schema groundwork. Seed: `.planning/seeds/v7.0-intelligence-engine.md`

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                                             | Reason                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Net-new design tokens or direction variants         | Design system stable since v6.0; v6.6 is workflow completion only                           |
| Mobile native app                                   | Cancelled (code preserved in git history)                                                   |
| OAuth/social login                                  | Email/password sufficient; revisit if user base grows                                       |
| Real-time chat                                      | High complexity, not core to dossier management                                             |
| Video content support                               | Storage/bandwidth costs disproportionate to value                                           |
| Rich overview cards reading dedicated entity tables | Bucket-B "BIG" backlog item; needs its own design pass — not part of the 6 escalated phases |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase    | Status   |
| ----------- | -------- | -------- |
| EXPORT-01   | Phase 62 | Complete |
| EXPORT-02   | Phase 62 | Complete |
| GRAPH-01    | Phase 63 | Complete |
| GRAPH-02    | Phase 63 | Complete |
| GRAPH-03    | Phase 63 | Complete |
| POSNEW-01   | Phase 64 | Complete |
| POSNEW-02   | Phase 64 | Complete |
| ENGPOS-01   | Phase 65 | Complete |
| ENGPOS-02   | Phase 65 | Complete |
| ENGPOS-03   | Phase 65 | Complete |
| OVRERR-01   | Phase 66 | Complete |
| OVRERR-02   | Phase 66 | Complete |
| PERENG-01   | Phase 67 | Pending  |
| PERENG-02   | Phase 67 | Pending  |
| PERENG-03   | Phase 67 | Pending  |

**Coverage:**

- v6.6 requirements: 15 total
- Mapped to phases: 15 ✓
- Unmapped: 0

---
