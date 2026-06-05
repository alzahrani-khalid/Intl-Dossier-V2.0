---
quick_id: 260605-htw
slug: overdue-commitment-triage-followups
date: 2026-06-05
status: complete
---

# Summary: Overdue-commitment-triage follow-ups (all 4 selected)

Follow-ups to quick 260605-ehg / PR #43. User selected all four.

## Item 1 — UNIQUE constraint (latent) → already existed

`work_item_dossiers` **already** has a partial unique index
`idx_work_item_dossiers_unique_active (work_item_type, work_item_id, dossier_id)
WHERE deleted_at IS NULL`. The prior "missing UNIQUE constraint" note was wrong —
it checked `pg_constraint` but not `pg_indexes` (a unique _index_ is not a
constraint). The edge function's `23505` (DUPLICATE_LINK) handler was correctly
backed all along. **Verified** duplicate inserts raise `23505`. The migration
only drops a redundant duplicate index a draft had created.

## Item 2 — Auto-create junction for new commitments (stop drift)

The UI create path already writes the junction; the real non-UI drift source is
`backend/src/api/after-action.ts` (inserts `aa_commitments` with no junction
rows). Added trigger **`sync_commitment_dossier_link`** on `aa_commitments`
(AFTER INSERT OR UPDATE OF dossier_id, SECURITY DEFINER) that creates the
`'direct'` home-dossier link `ON CONFLICT DO NOTHING` (uses the existing unique
index), covering all write paths. Made the `work-item-dossiers` POST
**idempotent**: on `23505` it inserts whichever links are missing and returns
`200` with the active set instead of `409` — removing the noise now that the
trigger pre-creates the home link. Deployed edge fn **v4**.

**Tradeoff (documented):** commitment home-dossier links are canonically
`'direct'` — the trigger wins the race over the UI's richer inheritance label.
The link is always correct (right dossier); provenance stays on the commitment
(`after_action_id` / `created_from_entity`).

## Item 3 — P2: keep dashboard context when opening a commitment

The dossier quick-look drawer navigated away to `/commitments?id=`. Now it opens
`CommitmentDetailDrawer` **in place** via a global URL-search-param drawer,
mirroring the proven `useDossierDrawer` pattern:

- `useCommitmentDrawer` hook (toggles a `commitment` search param)
- `CommitmentDrawer` mounted on `_protected.tsx` beside `DossierDrawer`
- `OpenCommitmentsSection.handleRowClick` → `openCommitment(id)` (was `navigate`)

Closing returns to the dossier quick-look (drawer stays mounted). Frontend
`tsc --noEmit` passes.

## Item 4 — P3: fix E2E 03-dossier-navigation (subagent)

The spec assumed link rows + `/dossiers/<id>` + an openable relationship drawer.
Reality: the `/dossiers` hub lists `ExpandableDossierCard`s (clickable div +
heading → "View dossier"), the detail route is type-segmented
(`/dossiers/countries/<id>` → `/overview`), tabs are
overview/engagements/docs(=Documents)/tasks/timeline, and the RelationshipSidebar
is a persistent desktop `complementary` aside toggled via `aria-expanded` (not a
drawer). Updated the two page objects, the spec, and the Arabic mirror (shares
the narrowed `DossierTabName`). Verified: `playwright --list` parses, eslint
exit 0, `tsc --noEmit` exit 0. `exportCsv`/`importCsv` (spec 08) left untouched.

## Verification (staging zkrcjzdemdmwhearhfgg)

| Check                                                                                       | Result |
| ------------------------------------------------------------------------------------------- | ------ |
| Item 1: duplicate active link raises `23505` (pre-existing index)                           | ✓      |
| Item 1: exactly one unique active-link index after redundant DROP                           | ✓      |
| Item 2: insert commitment with dossier → trigger auto-creates `direct` primary link         | ✓      |
| Item 2: insert + redundant `UPDATE OF dossier_id` → exactly 1 link (ON CONFLICT DO NOTHING) | ✓      |
| Item 2: edge fn deployed v4 (idempotent create)                                             | ✓      |
| Item 3: frontend `tsc --noEmit` exit 0                                                      | ✓      |
| Item 4: `playwright --list` + eslint + tsc on the 4 test files exit 0                       | ✓      |

## Commits

- `31fa344e` — Item 1+2: migration (drop redundant index + sync trigger) + edge fn idempotency
- `210e23b2` — Item 3: open commitments in place (P2)
- `b92c6232` — Item 4: E2E 03-dossier-navigation (P3)

## Follow-ups not done (noted)

- Item 3 (P2) deserves a quick **visual QA** pass (drawer-over-drawer stacking,
  RTL) — logic mirrors the proven dossier-drawer pattern and typechecks, but was
  not exercised in a live browser this session.
- Pre-existing E2E issues observed by the subagent but out of scope: spec 08's
  `exportCsvButton` (`/export.*csv/i`) won't match the hub's "Export Dossiers"
  button; spec 04 relies on `openDossier` finding seed dossiers on page 1.
- Inheritance labeling for the home dossier is intentionally flattened to
  `'direct'` (Item 2 tradeoff). If richer per-source labeling on the home link is
  later required, make the create endpoint update inheritance on conflict.
