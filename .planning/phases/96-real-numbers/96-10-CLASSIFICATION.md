# COUNT-02 — type-list read-path classification

Phase 96 · plan 96-10 · requirement `COUNT-02` · success criterion 5 (first half)
Derived 2026-08-17 against staging `zkrcjzdemdmwhearhfgg` (read-only) + repo HEAD.

POPULATION: the 7 type-list surfaces — one per live `dossiers.type` value
(`dossiers_type_check` was re-derived from `pg_constraint` this session and carries exactly
SEVEN values: `country`, `organization`, `forum`, `engagement`, `topic`, `working_group`,
`person`; `elected_official` is a person **subtype**, not a dossier type). A surface is in
population if it is the route that renders the list of dossiers OF ONE TYPE.

## What falls OUTSIDE this population

- **Extension-by-design readers.** Relationship tabs and dossier detail views whose population
  is _extension rows_, not dossiers — e.g. `DossierEngagementsTab`, the `$id` detail routes,
  `get_person_full`. A missing extension row correctly yields nothing there: the thing being
  listed does not exist. Stated, not measured here.
- **The dossiers hub cards** (`/dossiers`) — they count the `dossiers` table directly and are
  the _reference_ side of the comparison, never a candidate for dropping.
- **Elected-officials surfaces** — `person_subtype`, not a dossier type; no type list of its own
  in population.
- **The mv refresh cadence beyond the forced-refresh oracle** — identified below and controlled
  by the SC5 oracle, but its steady-state cadence is owned by no criterion in this phase.
- **The count-merge fields themselves** (`engagement_count`, `iso_code`, `active_member_count`).
  A merge that yields `0`/absent for a dossier with no extension row is ABSENT-AS-ABSENT — the
  correct rendering of an absent fact, and explicitly NOT a drop.

## Classification rule (applied mechanically)

`drop-capable` **only** if a missing extension row excludes the DOSSIER ROW from the rendered
list: an extension-first `SELECT`, an inner-join semantic, or a merge that filters unmatched
rows. `absent-as-absent` = dossier-first read, extension data merged in where present.
`canonical-mv` = served by `dossier_list_mv`, whose `FROM` clause was read live this session and
is `FROM dossiers d LEFT JOIN countries … LEFT JOIN organizations … LEFT JOIN forums … LEFT JOIN
engagements … LEFT JOIN topics … LEFT JOIN working_groups … LEFT JOIN persons` — sound by
construction.

<!-- prettier-ignore -->
| type | list surface (route) | data mechanism | classification |
| --- | --- | --- | --- |
| country | `frontend/src/routes/_protected/dossiers/countries/index.tsx` | `useCountries` → `fetchCountriesPage` (`frontend/src/hooks/useCountries.ts:70`) — `from('dossiers').eq('type','country')`, then `.in('id', ids)` merges of `countries.iso_code_2` (`:110`) and an `engagement_dossiers` tally (`:131`) | absent-as-absent |
| organization | `frontend/src/routes/_protected/dossiers/organizations/index.tsx` | `useOrganizations` → `fetchOrganizationsPage` (`frontend/src/hooks/useOrganizations.ts:63`) — `from('dossiers').eq('type','organization')`, then an `engagement_dossiers` `.in()` tally (`:105`) defaulting to `0` | absent-as-absent |
| forum | `frontend/src/routes/_protected/dossiers/forums/index.tsx` | `useForums` → `fetchForumsPage` (`frontend/src/hooks/useForums.ts:45`) — `from('dossiers').eq('type','forum')`, then `.in('id', forumIds)` on `forums` (`:90`) merged as `extension: extensions[d.id] \|\| {}` | absent-as-absent |
| engagement | `frontend/src/routes/_protected/dossiers/engagements/index.tsx` → `@/pages/engagements/EngagementsListPage:185` | `useEngagementsInfinite` → RPC `search_engagements_advanced` for BOTH rows (`frontend/src/hooks/useEngagementsInfinite.ts:152`) and the exact count (`:98`) — RPC body is `FROM engagement_dossiers ed JOIN dossiers d ON d.id = ed.id` | **drop-capable** |
| topic | `frontend/src/routes/_protected/dossiers/topics/index.tsx` → `-TopicsListPage.tsx:88` | `useTopics` → `useDossiersByType('topic')` → `getDossiersByType` → edge fn `dossiers-list` → RPC `list_dossiers_optimized` → `dossier_list_mv` | canonical-mv |
| working_group | `frontend/src/routes/_protected/dossiers/working_groups/index.tsx:134` | `useWorkingGroups` → `fetchWorkingGroupsPage` (`frontend/src/hooks/useWorkingGroups.ts:73`) — RPC `search_working_groups` for the rows, a SEPARATE `from('dossiers')` head count for the total (`:87`); RPC body is `FROM working_groups wg JOIN dossiers d ON d.id = wg.id` | **drop-capable** |
| person | `frontend/src/routes/_protected/dossiers/persons/index.tsx` → `-PersonsListPage.tsx:127` | `usePersons` → `getPersons` → `apiGet('/persons')` → edge fn `supabase/functions/persons/index.ts:231` RPC `search_persons_advanced` for the rows, a SEPARATE `from('dossiers')` head count for the total (`:246`); RPC body is `FROM persons p JOIN dossiers d ON d.id = p.id` | **drop-capable** |

## Instrument test of the enumeration — PREMISE FALSIFIED, INSTRUMENT SOUND

The plan's instrument test reads: _"the persons list MUST classify canonical-mv (the
behaviourally-confirmed sound path) — if it does not, the instrument is wrong, stop."_

**Persons does NOT classify canonical-mv, and the instrument is NOT wrong.** The plan's premise
— that the persons _list page_ renders through `dossiers-list` → `dossier_list_mv` — is false.
Research measured `GET /functions/v1/dossiers-list?type=person` (16 rows / total 16) and
concluded the persons list was sound; it never measured what the persons list page actually
calls. The page calls `/functions/v1/persons`.

Discriminating measurement, both endpoints, same authenticated user, same clock (2026-08-17):

```
GET /functions/v1/persons?limit=100          → rows: 15  | pagination.total: 16   ← the list page's path
GET /functions/v1/dossiers-list?type=person  → rows: 16  | total_count: 16        ← the canonical mv path
```

The persons surface renders **15 rows above a total of 16**: the drop is live, visible, and is
exactly the `persons 16 vs 15 [V]` defect COUNT-02 was filed for.

The enumeration instrument is proven sound by positive control, not by assertion: run over the
same 7 routes it _does_ return `canonical-mv` — for `topic`, whose chain terminates in
`dossier_list_mv`, whose LEFT-JOIN `FROM` clause was read live. An instrument that can produce
the expected classification, and produces a different one here, is reporting a fact about the
tree, not about itself.

## Live per-type gaps (re-derived 2026-08-17 — FLOORS, never restated from the register)

<!-- prettier-ignore -->
| type | dossiers | extension table | ext rows | gap | vs register |
| --- | --- | --- | --- | --- | --- |
| `person` | 16 | `persons` | 15 | 1 | matches register `16/15 [V]` |
| `engagement` | 5 | `engagement_dossiers` | 3 | 2 | matches register `5/3` |
| `organization` | 5 | `organizations` | 2 | 3 | beyond register (research-new, confirmed) |
| `topic` | 2 | `topics` | 1 | 1 | beyond register (research-new, confirmed) |
| `country` | 5 | `countries` | 5 | 0 | — |
| `forum` | 5 | `forums` | 5 | 0 | — |
| `working_group` | 6 | `working_groups` | 6 | 0 | — |

Cross-reading the two tables: `organization` and `topic` carry real gaps (3 and 1) but their
surfaces are `absent-as-absent` / `canonical-mv` — **those dossiers already render**. `person`
and `engagement` carry gaps AND drop-capable surfaces — those are the live defects.
`working_group` is drop-capable with a zero gap today: latent, not yet visible.

## The mv freshness mechanism (must-have truth 4 — identified)

`dossier_list_mv` is **not** cron-refreshed (research: no `pg_cron` job references it — confirmed).
It is refreshed by **eight statement-level triggers**, all calling
`queue_dossier_list_mv_refresh()`, which executes `REFRESH MATERIALIZED VIEW CONCURRENTLY
dossier_list_mv` synchronously:

`trg_dossiers_refresh_mv` on `dossiers`, plus `trg_{countries,organizations,forums,engagements,
topics,working_groups,persons}_refresh_mv` on the seven extension tables (all `tgenabled='O'`).

This resolves research assumption A3 ("maintained by some non-cron trigger/queue path") — it is
maintained, on every write, synchronously. The SC5 oracle still calls `refresh_dossier_list_mv_force()`
after its insert per Pitfall 6: the mechanism is now _known_ rather than _trusted_, and a forced
refresh costs one statement.

## Fix disposition

- **country / organization / forum** — dossier-first with merge-where-present. Correct as
  written. **No change made** (the plan named `useCountries.ts` and `useOrganizations.ts` in its
  frontmatter for exactly this ownership record: both are recorded **no-ops**, not silence).
- **topic** — canonical-mv. Correct by construction. No change.
- **engagement / working_group / person** — drop-capable. The drop mechanism is identical in all
  three and lives in **SQL, not TypeScript**: each RPC starts `FROM <extension> JOIN dossiers`.
  The fix is one migration replacing that with `FROM dossiers LEFT JOIN <extension>` in
  `search_persons_advanced`, `search_engagements_advanced`, `search_working_groups`.
  **NOT APPLIED — see `96-10-SUMMARY.md` § BLOCKED.** Plan 96-10 names no migration file, and the
  executor brief forbids any migration outside a plan-named filename. Fixing it in the three
  TypeScript call sites instead would be the fix-where-you-are-standing anti-pattern: it would
  re-implement RPC-side aggregates (`participant_count`, `active_member_count`,
  `total_deliverables`) in the client, triple the diff, and leave every other consumer of those
  three RPCs still dropping rows.

Zero `!inner` embeds exist in `frontend/src` `*.ts`/`*.tsx` source (gate-verified, with a
`useQuery` positive control proving the scoped grep sees the tree). None were introduced.
