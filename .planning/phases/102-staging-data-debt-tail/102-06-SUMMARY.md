---
phase: 102-staging-data-debt-tail
plan: 06
status: complete
completed: 2026-09-12
requirement: DATA-02
---

# P102-06 — staging residue removal

The destructive population was exported before the first successful mutation, the id-pinned population was renamed in English and Arabic, and the generated all-text-column oracle is green with its ONS positive control still visible.

## Export record

The plan-preferred directory under the main repository was attempted first and rejected by the worker filesystem sandbox:

```text
mkdir: /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/overseer/p102-data02-20260912T013721Z: Operation not permitted
```

No export file and no database mutation resulted from that attempt. The successful export is:

```text
EXPORT_DIR=/private/tmp/p102-data02-20260912T013747Z
```

| CSV | Data rows |
| --- | ---: |
| `dossiers.csv` | 72 |
| `persons.csv` | 70 |
| `intelligence_digest.csv` | 1 |
| `rag_chunks.csv` | 1 |
| `aa_commitments.csv` | 1 |
| `tasks.csv` | 2 |
| `positions.csv` | 1 |
| `organizational_units.csv` | 1 |
| `mou_notification_queue.csv` | 3 |
| `mous.csv` | 3 |
| `staff_profiles.csv` | 4 |
| `capacity_snapshots.csv` | 31 |
| `rag_chunks_class_residue.csv` | 13 |
| **Total** | **203** |

The first ten exports completed together before any mutation:

```text
COPY 72
COPY 70
COPY 1
COPY 1
COPY 1
COPY 2
COPY 1
COPY 1
COPY 3
COPY 3
EXPORT_DIR=/private/tmp/p102-data02-20260912T013747Z
```

The live foreign keys discovered while the transaction was still rolling back required two more child exports before deleting `Test WIP Unit`:

```text
COPY 4
       5 /private/tmp/p102-data02-20260912T013747Z/staff_profiles.csv
COPY 31
      32 /private/tmp/p102-data02-20260912T013747Z/capacity_snapshots.csv
```

The post-first-pass oracle then identified 13 stale derived chunks. They were exported before their later delete:

```text
COPY 13
      14 /private/tmp/p102-data02-20260912T013747Z/rag_chunks_class_residue.csv
```

CSV line counts above include one header line; the table reports data rows.

## Census before deletion

Database connectivity precondition:

```text
/opt/homebrew/bin/psql
ENV_PRESENT
DB_URL_PRESENT
postgres|postgres
```

The generated sweep (written to a temp file because the expanded SQL is too large for argv) returned:

```text
1922 6 208 2
```

That is `text_columns=1922`, `named_string_cells=6`, `class_regex_cells=208`, and `control_cells=2`. The live schema has 1,922 eligible base-table columns rather than the planning snapshot's 1,929; the oracle derives the population from `information_schema` and retains its `columns>=1000` fail-closed bound.

The exported delete population was re-derived before mutation:

```text
dossiers_delete|72
persons_delete|70
digest_delete|1
rag_chunks_delete|1
commitments_delete|1
tasks_delete|2
positions_delete|1
units_delete|1
mous_delete|3
```

The initial name-coupling grep found only the calendar comment/spec coupling and the dashboard seed among the allowlisted changes. `rendered-oracle fixture` occurred only in `tests/e2e/fixtures/99-positions-seed.mjs`; no assertion consumed the text, so no out-of-scope test edit was needed.

## Transaction execution

Two attempts failed closed and rolled back completely. The first exposed four `staff_profiles` references to the WIP unit:

```text
BEGIN
DELETE 1
DELETE 3
DELETE 70
DELETE 70
DELETE 2
DELETE 1
DELETE 1
DELETE 2
DELETE 1
psql:scripts/p102-staging-residue.sql:48: ERROR:  update or delete on table "organizational_units" violates foreign key constraint "staff_profiles_unit_id_fkey" on table "staff_profiles"
DETAIL:  Key (id)=(e8cd0546-51d5-428c-87c5-1b855b599239) is still referenced from table "staff_profiles".
```

The second exposed 31 `capacity_snapshots` references after the staff rows had been added to the transaction; it also rolled back:

```text
BEGIN
DELETE 1
DELETE 3
DELETE 70
DELETE 70
DELETE 2
DELETE 1
DELETE 1
DELETE 2
DELETE 1
DELETE 4
psql:scripts/p102-staging-residue.sql:56: ERROR:  update or delete on table "organizational_units" violates foreign key constraint "capacity_snapshots_unit_id_fkey" on table "capacity_snapshots"
DETAIL:  Key (id)=(e8cd0546-51d5-428c-87c5-1b855b599239) is still referenced from table "capacity_snapshots".
```

After exporting both child sets, the transaction committed. Statement counts, in SQL order, were:

```text
BEGIN
DELETE 1
DELETE 3
DELETE 70
DELETE 70
DELETE 2
DELETE 1
DELETE 1
DELETE 2
DELETE 1
DELETE 4
DELETE 31
DELETE 1
DELETE 3
UPDATE 6
UPDATE 10
UPDATE 10
UPDATE 1
UPDATE 5
UPDATE 3
UPDATE 1
UPDATE 1
UPDATE 3
UPDATE 3
UPDATE 1
COMMIT
```

The seven Phase 63 relationship notes comprised five surviving relationships, which were rewritten, and two relationships whose obsolete `f63d0900` endpoint dossiers cascaded. The checked-in script orders the note rewrite before the endpoint deletion, so a fresh execution rewrites all seven before the two cascades.

The first post-run sweep found the 13 derived RAG copies and no other survivor:

```text
P102-06-SWEEP text_columns=1922 named_string_cells=0 class_regex_cells=13 control_cells=2 expected columns>=1000 named=0 class=0 control>=1
FAIL: 13 text cells still match the internal-artifact class regex (Phase N / E2E / UAT / fixture / staging verification / lowercase e2e- prefix)
```

After export, their narrowly scoped delete committed:

```text
BEGIN
DELETE 13
DELETE 0
DELETE 0
DELETE 0
UPDATE 0
DELETE 0
DELETE 0
DELETE 0
DELETE 0
DELETE 0
DELETE 0
DELETE 0
DELETE 0
DELETE 0
UPDATE 0
UPDATE 0
UPDATE 0
UPDATE 0
UPDATE 0
UPDATE 0
UPDATE 0
UPDATE 0
UPDATE 0
UPDATE 0
COMMIT
```

The transaction's fixed-value updates use `IS DISTINCT FROM`; a final rerun was a zero-row no-op:

```text
BEGIN
DELETE 0
DELETE 0
DELETE 0
DELETE 0
UPDATE 0
DELETE 0
DELETE 0
DELETE 0
DELETE 0
DELETE 0
DELETE 0
DELETE 0
DELETE 0
DELETE 0
UPDATE 0
UPDATE 0
UPDATE 0
UPDATE 0
UPDATE 0
UPDATE 0
UPDATE 0
UPDATE 0
UPDATE 0
UPDATE 0
COMMIT
```

## Final acceptance oracles

All-text-column class sweep, run after all work:

```text
P102-06-SWEEP text_columns=1922 named_string_cells=0 class_regex_cells=0 control_cells=2 expected columns>=1000 named=0 class=0 control>=1
PASS sweep
```

The rename query returned `10 6 3 1 16`. Its literal plan wrapper assumes POSIX/bash word splitting and initially failed to label those fields when invoked by the worker's zsh. Rerunning the unchanged oracle under `/bin/bash` produced:

```text
P102-06-RENAME persons_renamed=10 working_groups_renamed=6 srtl_rows_renamed=3 b0000003_renamed=1 seed_family_present=16 expected 10 6 3 1 16
PASS rename
```

Survivors judged deliberate: **none**. The bounded class query produced no hit rows after the final delete. The two ONS control cells remain visible, proving the generated sweep was not blind. JSON/JSONB and non-text columns remain outside the population exactly as bounded by the plan.

## Source validation

Playwright collected the updated name-asserting scenario:

```text
Listing tests:
  [chromium] › e2e/calendar-rtl.spec.ts:38:3 › Phase 39: Calendar RTL — Arabic dow + Indic digits › renders Arabic short labels and Arabic-Indic day digits in ar
Total: 1 test in 1 file
```

`git diff --check` produced no output. The combined Prettier check could not infer a parser for the two SQL files; Playwright collection and live `psql -v ON_ERROR_STOP=1` execution validated the TypeScript collection and SQL syntax respectively.

The TypeScript-only formatting check then passed:

```text
Checking formatting...
All matched files use Prettier code style!
```

The implementation commit's repository hooks also completed successfully: lint-staged ran ESLint and Prettier on the calendar spec, the Turbo build completed for all three packages, and the repository's remaining static checks completed with their existing advisory output.

## Changed contract

- `scripts/p102-staging-residue.sql` contains one transaction, prefix/id-scoped deletes, derived-copy cleanup, and bilingual fixed-ID renames.
- `frontend/tests/e2e/calendar-rtl.spec.ts` now asserts the three new Arabic diplomatic event names.
- `supabase/seed/060-dashboard-demo.sql` preserves the new bilingual `b0000003-...-01` commitment name on reseed.
- No tracked path outside the four-file allowlist changed.
