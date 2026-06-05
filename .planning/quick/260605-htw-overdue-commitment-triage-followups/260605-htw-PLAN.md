---
quick_id: 260605-htw
slug: overdue-commitment-triage-followups
date: 2026-06-05
status: in-progress
---

# Quick Task: Overdue-commitment-triage follow-ups (P2/P3 + 2 latent)

Follow-ups to quick 260605-ehg (PR #43). User selected all four.

## Item 1 — UNIQUE constraint on work_item_dossiers (latent)

The edge function's `23505` (DUPLICATE_LINK) handler assumes a unique constraint
that did not exist → duplicate links were silently possible. Verified **0 existing
duplicates**, so no dedupe needed.

**Fix:** partial unique index `work_item_dossiers_unique_active` on
`(work_item_type, work_item_id, dossier_id) WHERE deleted_at IS NULL`. Partial so
soft-deleted links don't block re-linking.

## Item 2 — Auto-create junction for new commitments (latent / stop drift)

The UI create path (`CommitmentQuickForm`) already writes the junction with
inheritance metadata. The real **non-UI** drift source is
`backend/src/api/after-action.ts`, which inserts `aa_commitments` (with
`dossier_id`) but no junction rows. No existing sync trigger.

**Fix:** DB trigger `sync_commitment_dossier_link` on `aa_commitments`
(AFTER INSERT OR UPDATE OF dossier_id), SECURITY DEFINER, that inserts a
`'direct'` home-dossier link `ON CONFLICT (...) WHERE deleted_at IS NULL DO
NOTHING` (relies on Item 1's index). Guards: `dossier_id IS NOT NULL`, not
deleted, resolvable creator (`COALESCE(owner_user_id, created_by)` — junction
`created_by` is NOT NULL). `is_primary` only when no active primary exists.

Plus make the create endpoint **idempotent**: on `23505`, return `200` with the
existing active links instead of `409`, so the UI's now-redundant call (the
trigger already created the link) isn't logged as a failure.

**Documented tradeoff:** home-dossier links are canonically `'direct'`. For a
commitment created from an engagement/after-action via the UI, the trigger's
`'direct'` link wins the race over the UI's richer label; the link is always
correct (right dossier) and provenance remains on the commitment
(`after_action_id` / `created_from_entity`). Richer per-source labeling on the
home link is a deliberate non-goal here. Inherited links to _other_ dossiers are
unaffected (the UI only ever links the single home dossier today).

## Item 3 — P2: keep dashboard context when opening a commitment

Clicking a commitment in the dossier quick-look drawer
(`DossierDrawer/OpenCommitmentsSection`) navigates away to `/commitments?id=`.

**Fix:** open `CommitmentDetailDrawer` in place via a global URL-search-param
drawer, mirroring the existing `useDossierDrawer` pattern (new
`useCommitmentDrawer` hook + a `CommitmentDrawer` mounted in `_protected.tsx`
beside `DossierDrawer`). `OpenCommitmentsSection` calls `openCommitment(id)`
instead of navigating.

## Item 4 — P3: fix E2E 03-dossier-navigation

`tests/e2e/03-dossier-navigation.spec.ts` + `support/pages/DossierListPage.ts`
use `getByRole('link', { name })` and expect `/dossiers/<id>`. The app uses
type-segmented routes (`/dossiers/countries/...`) and row clicks. Update the page
object + spec to match. (Dispatched to a subagent.)

## Commits (atomic, per item)

- A: Item 1 + Item 2 migration (index + trigger) applied to staging + edge fn idempotency redeploy
- B: Item 3 dashboard commitment drawer
- C: Item 4 E2E fix
