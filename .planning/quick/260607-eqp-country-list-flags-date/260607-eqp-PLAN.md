---
quick_id: 260607-eqp
slug: country-list-flags-date
status: in-progress
date: 2026-06-07
---

# Quick Task 260607-eqp — Country list: render flags + day-first dates

Fix two valid findings from the Country Dossier QA report (verified against code +
live staging DB `zkrcjzdemdmwhearhfgg`).

## Root causes (verified)

- **Glyphs never render flags.** `useCountries` reads only the `dossiers` table,
  but the list mapper (`routes/_protected/dossiers/countries/index.tsx:92`) reads
  `d.iso_code` — a column that does **not** exist on `dossiers`. The ISO lives in
  the `countries` extension table (`countries.id` FK → `dossiers.id`, col
  `iso_code_2`). China (`CN`) and Indonesia (`ID`) already have `countries` rows;
  Saudi Arabia and UAE do not. `cn/id/sa/ae` are all in `DossierGlyph.FLAG_KEYS`.
- **Date format.** `DossierTable.formatLastTouch` renders US-style `Jun 3, 2026`;
  the IntelDossier spec wants `Tue 28 Apr` (day-first, no comma/year). The repo
  already has `formatDayFirst` in `@/lib/format-date` (used by the detail tabs).

## Tasks

### Task 1 — Code: flags + date format

- `frontend/src/hooks/useCountries.ts`: mirror `useForums.ts` extension-merge —
  after the dossiers query, fetch `countries(id, iso_code_2)` for the page ids and
  attach `iso_code = iso_code_2` to each row. Add
  `export interface CountryDossier extends Dossier { iso_code?: string }`; type the
  response `data` as `CountryDossier[]`. Mapper in `index.tsx` is unchanged.
- `frontend/src/hooks/__tests__/useCountries.test.ts`: extend the supabase mock so
  the second `from('countries').select().in()` chain resolves; add a test asserting
  `iso_code` merge.
- `frontend/src/components/list-page/DossierTable.tsx`: replace local
  `formatLastTouch` with shared `formatDayFirst`.
- **verify:** `pnpm --filter frontend exec tsc -p tsconfig.json --noEmit` (or build)
  green; the two touched test files green.
- **done:** flags resolve for CN/ID immediately; date renders `Tue 28 Apr`.

### Task 2 — Data: seed missing ISO rows (Supabase MCP)

- Idempotently upsert `countries` rows for Saudi Arabia
  (`9b9a04af-50b0-408c-878d-9d07f77a74ab` → SA/SAU) and United Arab Emirates
  (`b0000001-0000-0000-0000-000000000008` → AE/ARE) so all four render flags.
- **verify:** `select` confirms all 4 country dossiers join to a `countries` row
  with a non-null `iso_code_2`.

## Out of scope (verified not-a-bug)

- `engagement_count = 0` is accurate (0 engagement relationships exist for all 4).
- Sparse SA detail = genuinely empty seed data (correct empty states).
- A11y snapshot gap = agent-browser compact-snapshot tooling artifact.
