---
quick_id: 260605-ehg
slug: work-item-dossiers-commitment-rls
date: 2026-06-05
status: in-progress
---

# Quick Task: Fix work_item_dossiers commitment RLS (Overdue-commitment-triage report P0/P1)

## Problem (verified against staging zkrcjzdemdmwhearhfgg)

The "Overdue commitment triage" workflow inspection reported two defects:

- **P0** — Linking a dossier to a commitment returns HTTP 500:
  `new row violates row-level security policy for table "work_item_dossiers"`.
- **P1** — Commitment detail shows "No dossiers linked" even though the
  dossier drawer lists the commitment.

### Root cause

`public.work_item_dossiers` has two policies whose `work_item_type='commitment'`
branch validates `work_item_id` against the **legacy `public.commitments`
table** — which is **empty (0 rows)** and carries a different schema
(`responsible jsonb`, `created_by`). The real work-item commitments live in
**`public.aa_commitments`** (per the CLAUDE.md source-specific carve-outs).

Because the subquery targets an empty table:

- `work_item_dossiers_insert` (WITH CHECK) → commitment branch never matches →
  **every commitment link insert is denied → 500** (P0). Ownership is irrelevant;
  it fails for everyone.
- `work_item_dossiers_select` (USING) → commitment branch never matches → even a
  successfully-inserted link would be invisible (compounds P1).

Separately, the 8 seeded `aa_commitments` carry a direct `dossier_id` but have
**zero** rows in the junction, so detail (which reads the junction via
`DossierLinksWidget` → `work-item-dossiers` GET) shows "No dossiers linked".

## Fix

Single idempotent migration:

1. **Recreate** `work_item_dossiers_insert` and `work_item_dossiers_select`,
   rewriting **only** the `commitment` CASE branch to reference `aa_commitments`
   with that table's own access semantics:

   ```
   work_item_id IN (
     SELECT ac.id FROM aa_commitments ac
     WHERE ac.is_deleted = false
       AND (ac.owner_user_id = auth.uid() OR is_assigned_to_dossier(ac.dossier_id))
   )
   ```

   Task/intake branches, the dossier-clearance `EXISTS` clause, and the
   `created_by = auth.uid()` insert guard are preserved byte-for-byte.
   This is parity with `aa_commitments`' own SELECT policy — no privilege change.

2. **Backfill** direct/primary junction rows for every `aa_commitments` row that
   has `dossier_id` set, `is_deleted = false`, a resolvable owner, and no live
   junction row. `NOT EXISTS` guard → idempotent / safe on prod.

## Out of scope (noted, not fixed)

- P2 — keep dashboard context when opening commitments from quick-look (UX).
- P3 — update E2E `03-dossier-navigation`.
- Latent: `work_item_dossiers` has **no UNIQUE constraint** on
  `(work_item_type, work_item_id, dossier_id)`, yet the edge function's `23505`
  handler assumes one. Duplicate links are currently possible. Flagged only.

## Verification

- Re-query both policies; confirm commitment branch references `aa_commitments`.
- Simulate INSERT WITH CHECK predicate as owner user `de2734cf…` for the reported
  commitment `b0000003-…-0008` → expect `true`.
- Confirm backfill count goes 0 → 8 commitment junction rows; re-run inserts 0.
