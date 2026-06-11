# Dossier-Workflow B-Backlog → Proposed GSD Phases

**Created:** 2026-06-11 · **Source:** fanout dossier-workflow inspection loop, rounds 1–17
(branch `quick/260608-c9b`). **Status:** loop STOPPED after round 17 — the safe
unattended (bucket-A) surface is exhausted. Every item below is bucket-B: it needs
a product/data-contract decision, an edge/RPC deploy, a migration, or a multi-file
feature slice — i.e. planned phase work, not an unattended auto-fix.

Each proposed phase is independently shippable. Suggested sequencing is by
user-facing severity (advertised-but-broken first). Feed these into
`/gsd:phase` (add to current milestone) or `/gsd:new-milestone` (e.g. v6.5
"Dossier Workflow Completion"). Phase numbers below are placeholders (next free
is 61+; Phase 61 = Security Pass is already planned).

Reports backing each item live in `reports/dossier-workflows-round*-inspection-*.md`
and the per-round escalation entries in `reports/fanout-loop-state.json`.

---

## Phase P1 — Export / Briefing-Pack Contract & Deploy (R7-01) — **HIGH**

**Why first:** the dossier Export dialog advertises PDF/Word, but the
`dossier-export-pack` edge **is not deployed on staging** (POST → 404) and its
source always emits `text/html`. Users get a dead or wrong-format export. This is
the most visible advertised-but-broken path.

- **Goal:** Export produces the advertised format (or the dialog honestly states
  HTML-only), against a deployed, schema-correct edge.
- **Scope:** Decide PDF/DOCX rendering vs. relabel to HTML; reconcile
  `dossier-export-pack` stale column reads (positions.classification/dossier_ids,
  mous.title_en/status, documents.entity_type, legacy `commitments` vs
  `aa_commitments`); deploy the edge; verify each of the 7 types.
- **Acceptance:** Export from each dossier type returns the format the dialog
  promises, no 404, no stale-column 500. Live-verify on staging.
- **Evidence:** round-17 §No-New-Finding (export pipeline); round-7 R7-01.
- **Touches:** `supabase/functions/dossier-export-pack/`, `ExportDossierDialog.tsx`,
  `dossier-export.service.ts`. Needs edge deploy.

## Phase P2 — Relationship Graph: Route + Bidirectional Traversal (R6/R7) — **MEDIUM**

**Why:** the full `/relationships/graph` page is a dormant route that redirects to
`/dossiers` (round-2 B-item), and the traversal RPC is outgoing-only so reverse
relationships are invisible. (The R17-02 node-click bug — generic `/dossiers/$id`
target — was fixed this round; the reachable `MiniRelationshipGraph` was already
correct.)

- **Goal:** A reachable relationship graph page whose traversal shows both
  directions.
- **Scope:** Mount/route `RelationshipGraphPage` (or formally retire it in favor of
  the mini-graph + a list view); fix the graph traversal RPC to return incoming +
  outgoing edges; verify node→dossier navigation per type (helper already correct).
- **Acceptance:** From a dossier with a relationship, the graph renders both
  endpoints and clicking either navigates to the correct per-type route.
- **Evidence:** round-2 relationships escalation #1/#4; round-17 R17-02 note.
- **Touches:** `routes/_protected/relationships/graph.tsx`, the traversal RPC,
  `RelationshipGraphPage.tsx`. Needs RPC change.

## Phase P3 — Add-to-Dossier "New Position" Contract (R6-03) — **MEDIUM**

**Why:** the New Position dialog posts `position_type_id = dossier_id`, blank
`title_ar`, and empty `audience_groups`, none of which satisfy `positions-create`,
and never creates the `position_dossier_links` row — so creating a position from a
dossier silently fails or mis-links.

- **Goal:** Creating a position from any dossier persists a valid position **and**
  its dossier link.
- **Scope:** Add a real position-type picker + bilingual title + audience-group
  selection (product decision on defaults); after create, write
  `position_dossier_links` (the attach edge is now fixed/deployed — round 12/13).
- **Acceptance:** New Position from a dossier → position exists with valid
  type/titles/audience + a `position_dossier_links` row → appears on the Positions
  tab. Live-verify.
- **Evidence:** round-6 R6-03; round-17 deferred list.
- **Touches:** `AddToDossierDialogs.tsx` (PositionDialog), `positions-create` edge.

## Phase P4 — Engagement Positions Tab + Legacy-Table Reconciliation (R14-02) — **MEDIUM**

**Why:** the engagement workspace has no routed Positions tab; the only
implementation is unrouted, reads legacy `engagement_positions`, and its attach is
a no-op (the inert buttons were disabled in round 15 as a stopgap). Broader: the
engagement after-action/kanban paths still straddle legacy vs unified
`engagement_dossiers`.

- **Goal:** A working engagement Positions surface on canonical tables, plus a
  decision on legacy `engagement_positions` vs `position_dossier_links`.
- **Scope:** Add the workspace Positions tab/route; choose canonical vs legacy;
  wire attach + invalidation; re-enable the round-15-disabled workspace CTAs as
  they're wired.
- **Acceptance:** Attach a position to an engagement → persists → renders; no
  inert buttons remain.
- **Evidence:** round-14 R14-02; round-15 R15-02; round-1 engagement escalation.
- **Touches:** `WorkspaceTabNav.tsx`, engagement workspace tabs,
  `useEngagementPositions.ts`, edge fns. Likely migration/edge work.

## Phase P5 — Overview Error-Contract + Timeline Cross-Links (R9-02, R17-03) — **MEDIUM**

**Why:** overview section fetchers swallow Supabase errors and return empty
shapes, so cards render failures as trustworthy zero/empty states — this is the
enabler of the F1-class silent breakage found live in round 11 (the briefs 400).
Separately, timeline rows link to unmounted routes (`/calendar/$id`, `/mous/$id`)
or dead-end with no affordance.

- **Goal:** Sections distinguish "empty" from "failed"; timeline cross-links go to
  real destinations (or honestly have none).
- **Scope:** Decide the section error contract (fail-the-query vs section-level
  error metadata vs explicit unknown state) and apply it across overview cards;
  for timeline, either suppress detail buttons without a mounted route, route to
  filtered list pages, or add detail routes + enrich relationship metadata with
  source/target types.
- **Acceptance:** A forced section error shows an error state (not a fake empty);
  no timeline "View details" navigates to a 404.
- **Evidence:** round-9 R9-02; round-17 R17-03.
- **Touches:** `dossier-overview.service.ts`, overview section components,
  `ActivityTimelineSection.tsx`, `TimelineEventCard.tsx`, unified-activity/timeline
  edges.

## Phase P6 — Person/EO Engagement Contracts + Legacy Detail Route-or-Delete — **LOW/MEDIUM**

**Why:** the generic Engagements tab ignores `engagement_dossiers.host_organization_id`
(org) and `person_engagements` (person/EO) — both latent today (0 rows) but
architecturally missing. Plus a backlog of raw-key i18n debt living inside
legacy/unrouted `*DossierDetail` person/EO sections that should be routed or
deleted.

- **Goal:** Decide the per-type Engagements contract (generic relationship/calendar
  history vs merge host-org / `person_engagements`); resolve the dead
  `*DossierDetail` components (route or delete) and clear their raw-key debt.
- **Scope:** Product decision on the engagement contract; implement the chosen
  branch; route-or-delete the legacy detail wrappers; localize whatever survives.
- **Acceptance:** An org with a host-org engagement and a person/EO with
  `person_engagements` both show those rows on their Engagements tab (or the tab is
  documented history-only); no dead `*DossierDetail` raw-key surfaces remain.
- **Evidence:** round-13 R13-02; round-14 R14-03; round-1 forum/person escalations.
- **Touches:** `DossierEngagementsTab.tsx`, `dossier-overview.service.ts`
  (related/host branch), the `*DossierDetail` wrappers, edge/RPC for
  `get_person_full.recent_engagements`.

---

## Not carried forward (already resolved by the loop)

The positions-attach chain (frontend no-op + edge `reference_type` + RLS clearance
typo + `link_type` CHECK), the link_type vocabulary realign, the type-aware
DocumentsSection, the backend auth dead-column 401, the `ar`→`ar-SA` digit helper,
the command-palette/EO/breadcrumb navigation fixes, and ~30 i18n/affordance polish
items were all fixed and committed during rounds 11–17. See
`reports/fanout-loop-state.json` round\*\_done for the complete record.

## Deploy note still outstanding

The droplet **backend** needs the round-11 auth fix (`backend/src/middleware/auth.ts`)
deployed, or elected-official detail and other Express-backed routes stay 401 in
production. (Staging is correct via the locally-restarted backend.)
