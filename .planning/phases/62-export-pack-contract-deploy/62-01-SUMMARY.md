---
phase: 62-export-pack-contract-deploy
plan: 01
subsystem: edge-functions
tags: [export, briefing-pack, schema-reconciliation, deno, cors, rls, print-css, i18n]
requires:
  - position_dossier_links (junction)
  - aa_commitments (direct dossier_id)
  - mous (signatory_1/2_dossier_id, deleted_at)
  - calendar_entries (event_date)
  - key_contacts (name/role/organization)
  - dossier_relationships (status=active)
  - audit_logs (entity_id)
  - supabase/functions/_shared/cors.ts (getCorsHeaders)
provides:
  - Schema-correct HTML briefing-pack generator returning text/html directly
  - X-Failed-Sections response header (per-section failure transport for the dialog)
  - Print-optimized (@media print) A4 briefing-pack CSS
affects:
  - frontend export hook/service/dialog (plan 62-02) consume the new direct-HTML + X-Failed-Sections contract
  - staging deploy (plan 62-03) ships this function
tech-stack:
  added: []
  patterns:
    - Deno.serve + getCorsHeaders/handleCorsPreflightRequest (modern edge transport)
    - per-section try/catch -> sectionErrors map (D-08 partial-failure honesty)
    - documents derived from positions+mous (no documents-table dossier linkage)
key-files:
  created: []
  modified:
    - supabase/functions/dossier-export-pack/index.ts
decisions:
  - 'mous soft-delete is deleted_at (not is_deleted); aa_commitments soft-delete is is_deleted — the two tables differ; both filters applied per the live-verified interfaces, not normalized'
  - 'documents section derives from already-fetched positions+mous (mirrors the app Documents tab); the generic documents table has no direct dossier linkage so a direct query was removed entirely'
  - "ExportConfig.format (pdf|docx) and language 'both' types left as-is — the dialog/type contract changes belong to plan 62-02; the edge function tolerates them without dead 500 paths"
metrics:
  duration: ~40m
  completed: 2026-06-11
---

# Phase 62 Plan 01: Export Pack Contract & Schema Reconciliation Summary

Reconciled the `dossier-export-pack` edge function to the live staging schema (D-05), added per-section partial-failure honesty (D-08) with an `X-Failed-Sections` header and in-document amber error blocks, added print-optimized A4 CSS (D-02), and modernized transport to `Deno.serve` + origin-validated CORS with a **direct `text/html` response** that runs entirely on the user-scoped RLS client (D-06) — no storage upload, no service-role key. `deno check` passes; the file is deploy-ready for plan 62-03.

## What Changed

### Task 1 — Data layer reconciliation + per-section error tracking (`c263f0fe`)

Rewrote `fetchDossierData` from a fragile single `Promise.all` (where any one stale read 500s the whole export) to seven independently `try/catch`-wrapped section fetches that each record into a `sectionErrors: Record<string,string>` map and degrade to `[]` on failure:

- **Positions** — was `positions.contains('dossier_ids', [id])` + `classification` (neither column exists → guaranteed 500). Now joins via `position_dossier_links` with the `position:positions(...)` embed and flattens the array-or-object embed shape.
- **MoUs** — was `mous.title_en` / `mous.status` / `dossier_ids` (none exist). Now two parallel signatory queries (`signatory_1_dossier_id` / `signatory_2_dossier_id`) selecting `title` / `lifecycle_state`, filtered `.is('deleted_at', null)`, deduplicated by id.
- **Commitments** — was the legacy **empty** `commitments` table via a `work_item_dossiers` two-step join on `responsible_user_id` (always 0 rows). Now a single direct `aa_commitments` query on `dossier_id` filtered `.is('is_deleted', false)`; `stats.commitments_count` reads from it (fixes Pitfall 5 — the old count path reported 0).
- **Calendar** — was `.gte('start_datetime', …)` (column is `event_date`). Now `event_date` (+ `event_time`, `entry_type`, `location`, `is_virtual`).
- **Documents** — was `documents.entity_type`/`entity_id` (neither exists) + `d.file_name` transform. Removed the direct query entirely; documents are now **derived** from the already-fetched positions and mous (matching the app's own Documents tab contract — the generic documents table has no direct dossier linkage).
- **Relationships** — soft-delete filter `.is('deleted_at', null)` → `.eq('status', 'active')` on both directions.
- **Timeline** (`audit_logs`) — already valid, unchanged; wrapped for error tracking.

### Task 2 — Renderers + D-08 error block + D-02 print CSS (`0113d19d`)

- Renderer column reads updated to the new data shape (`m.title`/`m.lifecycle_state`, `c.title`/`c.due_date`, `e.entry_type`/`e.event_date`/`e.location`, `c.name`/`c.role`/`c.organization`); dropped the `pos.classification` block and the commitments assignee column (no longer fetched).
- New `renderSectionError(title, isRTL)` helper; every section renderer takes an optional `error?: string` and, when set, emits its normal `<h2 class="section-title">` plus a `.section-error` block with the localized static copy (`This section could not be generated.` / `تعذّر إنشاء هذا القسم.`). Failed sections keep their heading and TOC slot — never silently omitted.
- `.section-error` CSS (amber `border-inline-start: 4px solid #b45309`, `#fffbeb` tint, `print-color-adjust: exact`) — visually distinct from the italic-centered-gray `.no-data`.
- `@media print` block: section-per-page (`break-before: page`), unsplit table rows, repeated table headers (`table-header-group`), unsplit cards + error blocks.
- XSS hardening preserved: `escapeHtml` count 26 (≥ pre-edit); no DB-derived value enters the `<style>` block.

### Task 3 — Transport modernization (`e705c53e`)

- `Deno.serve(async (req: Request) => …)`; dropped `deno.land/std@0.168.0` `serve` import and bumped `@supabase/supabase-js` `2.39.0` → `2.39.3`.
- Static wildcard `corsHeaders` → `getCorsHeaders(req)` on every response; OPTIONS → `handleCorsPreflightRequest(req)`.
- **D-06 direct response:** returns the generated HTML as `text/html; charset=utf-8` with `Content-Disposition: inline; filename="briefing-pack-{slug}-{ts}.html"`, `Access-Control-Expose-Headers: X-Failed-Sections`, and `X-Failed-Sections` (only when non-empty). Removed the base64 encode, storage upload, signed URL, and the `SUPABASE_SERVICE_ROLE_KEY` service client — the function runs entirely on the user-scoped anon-key client under RLS (attack-surface reduction, T-62-03).
- ASVS V5: `dossier_id` validated against the UUID regex before any query, 400 JSON on mismatch.
- Auth preserved verbatim: `@2` + explicit `supabase.auth.getUser(token)` (bare `getUser()` 401s on valid tokens — project memory).
- JSON error envelopes (401/400/404/500) retained for the frontend, switched to `getCorsHeaders(req)`.

## Verification

- All three task grep-gates print their PASS sentinel (`TASK1/2/3-GATES-PASS`).
- `<verification>` combined forbidden sweep `dossier_ids|start_datetime|entity_type|from('commitments')|SUPABASE_SERVICE_ROLE_KEY|createSignedUrl` (comment-filtered) → **0**.
- `key_links`: `from('position_dossier_links')` and `from('aa_commitments')` both present; artifact contains `Deno.serve`.
- `deno check supabase/functions/dossier-export-pack/index.ts` → **exit 0** (no type errors).
- Stub scan: none. Documents section is data-backed (derived from positions+mous), not an empty placeholder.

## Threat Model Coverage

| Threat ID                  | Disposition | How addressed                                                                                                                                          |
| -------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T-62-01 (XSS)              | mitigate    | `escapeHtml` preserved on all user-data insertions (count 26); only static copy + config-derived interpolations in renderers; no DB value in `<style>` |
| T-62-02 (Spoofing)         | mitigate    | `@2` + explicit `getUser(token)` retained verbatim; 401 on missing/invalid token                                                                       |
| T-62-03 (Info Disclosure)  | mitigate    | service-role client deleted; all queries run on the user-scoped client under RLS                                                                       |
| T-62-04 (Injection)        | mitigate    | `dossier_id` UUID-validated before any query, 400 on mismatch                                                                                          |
| T-62-05 (CORS)             | mitigate    | static wildcard replaced by `getCorsHeaders(req)` (ALLOWED_ORIGINS allowlist) on every response                                                        |
| T-62-SC (package installs) | accept      | zero new packages — Package Legitimacy Gate not triggered                                                                                              |

## Deviations from Plan

**1. [Rule 3 — Blocking] Events renderer `start_datetime`→`event_date` fixed in the Task 1 commit, not Task 2**

- **Found during:** Task 1 verification.
- **Issue:** Task 1's automated gate runs `grep -v '^\s*//' … | grep -c "start_datetime" == 0` against the **whole file**, but `start_datetime` lived in `generateEventsSection` — a renderer the plan assigned to Task 2. Task 1's gate could not pass until that single renderer line was reconciled to the data shape Task 1 just changed.
- **Fix:** Applied the three events-renderer column swaps (`start_datetime`→`event_date`, `event_type`→`entry_type`, `location_en/ar`→`location`) inside the Task 1 commit so its gate passes; the remaining renderer column fixes (positions/mous/commitments/contacts/documents) stayed in Task 2 as planned.
- **Files modified:** `supabase/functions/dossier-export-pack/index.ts`
- **Commit:** `c263f0fe`

**2. [Rule 3 — Blocking] Worktree base reset to plan-bearing commit**

- **Found during:** Execution start.
- **Issue:** The worktree was spawned with HEAD at the v6.6 milestone-start merge commit `cb2d25f7`, which had already archived `.planning/phases/` — the 62-01 plan file did not exist at HEAD. The expected base `e116e16e` (which contains the full phase-62 planning set) had diverged from HEAD.
- **Fix:** The `<worktree_branch_check>` base-correction (`git reset --hard e116e16e8d82…`) ran as prescribed (HEAD assertion passed first: branch is in the `worktree-agent-*` namespace, never on a protected ref — no `git update-ref` self-recovery). This put the worktree at the state where the plan and its context exist. No code impact.
- **Commit:** n/a (pre-task state correction)

**3. [Rule 3 — Cleanup] Refreshed stale top-of-file docblock**

- **Found during:** Task 3.
- **Issue:** The file header still claimed "Generates … in PDF or DOCX format," directly contradicting the new direct-HTML behavior.
- **Fix:** Rewrote the docblock to describe the HTML briefing-pack contract, the direct text/html response, and the X-Failed-Sections degrade path. Comment-only.
- **Commit:** `e705c53e`

## Notes / Follow-ups (out of scope for this plan)

- **Deploy** (`supabase functions deploy dossier-export-pack --project-ref zkrcjzdemdmwhearhfgg`) and 7-type staging verification are **plan 62-03**.
- **Frontend** dialog rework (D-03/D-04 format-picker removal, language trim), the new-tab open flow (D-07), and reading `X-Failed-Sections` are **plan 62-02**.
- `ExportConfig.format`/`language: 'both'` type and the `config.language === 'both' ? 'en'` `<html lang>` fallback were intentionally left untouched — the type/contract change is owned by plan 62-02; the edge function tolerates the legacy shape without a dead 500 path.

## Self-Check: PASSED

- `supabase/functions/dossier-export-pack/index.ts` — FOUND
- `.planning/phases/62-export-pack-contract-deploy/62-01-SUMMARY.md` — FOUND
- Commits `c263f0fe`, `0113d19d`, `e705c53e`, `0a730672` — all FOUND in git log
- `deno check` exit 0; all three task grep-gates PASS; forbidden-token sweep 0
