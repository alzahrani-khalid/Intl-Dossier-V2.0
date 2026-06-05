---
quick_id: 260605-ehg
slug: work-item-dossiers-commitment-rls
date: 2026-06-05
status: complete
---

# Summary: Fix work_item_dossiers commitment RLS (Overdue-commitment-triage P0/P1)

## What was broken

The "Overdue commitment triage" workflow inspection reported:

- **P0** — linking a dossier to a commitment → HTTP 500
  `new row violates row-level security policy for table "work_item_dossiers"`.
- **P1** — commitment detail showed "No dossiers linked" while the dossier
  drawer listed the same commitment.

## Root cause (verified, not assumed)

`public.work_item_dossiers` had **two** policies whose `work_item_type='commitment'`
branch validated `work_item_id` against the legacy **`public.commitments`** table —
which is **empty (0 rows)** with a different schema. The actual work-item
commitments live in **`public.aa_commitments`** (CLAUDE.md source carve-out).

- `work_item_dossiers_insert` (WITH CHECK): commitment branch never matched →
  **every** commitment link insert denied → 500 (P0). Failed for all users
  regardless of ownership.
- `work_item_dossiers_select` (USING): same broken branch → links invisible (P1).
- The 8 seeded `aa_commitments` carried a direct `dossier_id` but had **0** rows
  in the junction → "No dossiers linked" in detail.

## Fix

Migration `supabase/migrations/20260605073000_fix_work_item_dossiers_commitment_rls.sql`
(applied to staging `zkrcjzdemdmwhearhfgg` via Supabase MCP):

1. Recreated both policies, rewriting **only** the commitment CASE branch to
   target `aa_commitments` with that table's own access semantics —
   `owner_user_id = auth.uid() OR is_assigned_to_dossier(ac.dossier_id)`,
   `is_deleted = false`. This is exact parity with `aa_commitments`' own SELECT
   policy → **no privilege change**, just the correct table. task/intake
   branches, the dossier-clearance `EXISTS` clause, and the
   `created_by = auth.uid()` insert guard were preserved unchanged.
2. Idempotent backfill: inserted direct/primary junction rows for every
   `aa_commitments` with a `dossier_id`, no live junction link, and a resolvable
   owner. `NOT EXISTS` guard → safe to re-run / on prod.

## Verification (all pass)

| Check                                                                                                               | Result                |
| ------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Both policies reference `aa_commitments`, not legacy `commitments`                                                  | ✓                     |
| Backfill: commitment junction rows 0 → **8** (incl. reported `b0000003…0008`)                                       | ✓                     |
| INSERT WITH CHECK predicate for owner `de2734cf` / commitment `…0008`: owner match + clearance 3≥2 + dossier active | ✓                     |
| **Real RLS INSERT** as owner (role `authenticated`, jwt sub set) → row created (rolled back)                        | ✓ — was the 500       |
| **Real RLS INSERT** as unrelated user `df98edb9` → denied (`42501` RLS violation)                                   | ✓ not over-permissive |
| **Real RLS SELECT** as owner → 1 visible primary link to UAE dossier                                                | ✓ — P1 resolved       |

## Out of scope (noted, not fixed)

- **P2** — keep dashboard context when opening commitments from quick-look (UX,
  navigates to `/commitments`).
- **P3** — update E2E `03-dossier-navigation` for `/dossiers/countries` + row clicks.
- **Latent** — `work_item_dossiers` has **no UNIQUE constraint** on
  `(work_item_type, work_item_id, dossier_id)`, yet the edge function's `23505`
  handler assumes one → duplicate links are silently possible. Flagged for a
  follow-up (adding it now would require a dedupe pass first).
- **Durability** — new `aa_commitments` created with a `dossier_id` still won't
  auto-populate the junction (no trigger). The create path / a sync trigger is a
  larger follow-up; this task fixes linking + existing-data consistency.

## Files

- `supabase/migrations/20260605073000_fix_work_item_dossiers_commitment_rls.sql` (new)
- `.planning/quick/260605-ehg-work-item-dossiers-commitment-rls/260605-ehg-PLAN.md`
- `.planning/quick/260605-ehg-work-item-dossiers-commitment-rls/260605-ehg-SUMMARY.md`
- `.planning/STATE.md`

No frontend/backend code change — the edge function `work-item-dossiers` and the
`DossierLinksWidget`/`useCreateWorkItemDossierLinks` hooks were already correct;
the defect was entirely in the DB RLS policy targeting the wrong table.
