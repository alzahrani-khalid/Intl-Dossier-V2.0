---
phase: 40-list-pages
plan: 02c
type: execute
wave: 0
depends_on: [40-02a]
files_modified:
  - frontend/src/styles/list-pages.css
  - frontend/src/index.css
  - frontend/.size-limit.json
  - frontend/src/hooks/useDebouncedValue.ts
autonomous: true
requirements: [LIST-01, LIST-02, LIST-03, LIST-04]
must_haves:
  truths:
    - 'Handoff CSS rules .spinner-row, .pill.active, .dossier-row, .icon-flip, .week-list, .forum-row, .tbl, .chip* available globally'
    - 'list-pages.css imported by index.css'
    - 'RESEARCH §"Open Questions (RESOLVED)" branching contracts executed: engagement_count column verified via Supabase MCP; useDebouncedValue path verified; useTopics/usePersons signatures verified; .spinner-row CSS source confirmed'
  implementation_notes:
    - 'size-limit Total JS budget bumped 800 KB → 815 KB'
    - 'Supabase view dossier_engagement_counts created ONLY IF engagement_count column absent (branch (b) of Open Question 1)'
    - 'useDebouncedValue.ts created ONLY IF the file does not already exist (branch (b) of Open Question 4)'
  artifacts:
    - path: 'frontend/src/styles/list-pages.css'
      provides: 'Handoff CSS port: .spinner-row, .pill, .pill.active, .dossier-row, .icon-flip, .tbl, .chip*, .week-list, .forum-row'
      contains: '.icon-flip'
    - path: 'frontend/.size-limit.json'
      provides: 'Budget gate updated to 815 KB'
      contains: '815 KB'
  key_links:
    - from: 'frontend/src/index.css'
      to: 'frontend/src/styles/list-pages.css'
      via: '@import url(./styles/list-pages.css)'
      pattern: "@import.*list-pages\\.css"
---

<objective>
Port handoff CSS rules required by all Wave 1 page bodies, bump the size-limit budget, and execute the 4 branching verifications resolved in RESEARCH.md §"Open Questions (RESOLVED)" (engagement_count column, useDebouncedValue path, useTopics/usePersons signatures, .spinner-row source). Ship verified findings to subsequent plans via this plan's SUMMARY.

Purpose: Close the verification loop opened in RESEARCH; ensure CSS, budget, and contracts are all locked before Wave 1 starts.
Output: list-pages.css, index.css edit, size-limit.json bump, optional Supabase view, optional useDebouncedValue.ts.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/phases/40-list-pages/40-RESEARCH.md
@.planning/phases/40-list-pages/40-PATTERNS.md
@frontend/src/index.css
@frontend/.size-limit.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Resolve 4 RESEARCH Open-Questions branches (verification + conditional artifacts)</name>
  <files>frontend/src/hooks/useDebouncedValue.ts</files>
  <read_first>
    - .planning/phases/40-list-pages/40-RESEARCH.md §"Open Questions (RESOLVED)" — execute the 4 branching contracts in order
    - frontend/src/hooks/useTopics.ts (Open Question 2 verification target)
    - frontend/src/hooks/usePersons.ts (Open Question 2 verification target)
    - frontend/src/hooks/useForums.ts (return-shape baseline)
  </read_first>
  <action>
**Execute the 4 RESOLVED branches from RESEARCH.md §"Open Questions (RESOLVED)" verbatim. Record outcome of each branch in this plan's SUMMARY.**

1. **Open Question 1 — `engagement_count` column:**
   - Use Supabase MCP `list_columns` (project `zkrcjzdemdmwhearhfgg`, table `dossiers`).
   - **Branch (a):** column exists → record name + type in SUMMARY; useCountries/useOrganizations (Plan 02b) read it directly. NO action here.
   - **Branch (b):** column absent → use Supabase MCP `apply_migration` to create:
     ```sql
     CREATE OR REPLACE VIEW dossier_engagement_counts AS
       SELECT dossier_id, COUNT(*)::int AS engagement_count
       FROM engagements GROUP BY dossier_id;
     GRANT SELECT ON dossier_engagement_counts TO authenticated;
     ```
   - Record branch outcome in SUMMARY.

2. **Open Question 2 — `useTopics`/`usePersons` shape:**
   - `cat frontend/src/hooks/useTopics.ts frontend/src/hooks/usePersons.ts`
   - Verify shape matches `{ data, isLoading, error }`.
   - Record verified shape (or divergence) in SUMMARY for Wave 1 Plans 05/07.

3. **Open Question 3 — `.spinner-row` source:**
   - Run `grep -n "\\.spinner-row" /tmp/inteldossier-handoff/inteldossier/project/src/app.css`.
   - **Branch (a):** match found → record line range; Task 2 below copies verbatim.
   - **Branch (b):** no match → Task 2 below uses fallback canonical from RESEARCH §"Open Questions (RESOLVED)" item 3.
   - Record branch outcome in SUMMARY.

4. **Open Question 4 — `useDebouncedValue` path:**
   - Run `grep -rn "useDebouncedValue" frontend/src/hooks/`.
   - **Branch (a):** `frontend/src/hooks/useDebouncedValue.ts` exists → no action; primitives in Plan 02a already import correctly.
   - **Branch (b):** absent → CREATE `frontend/src/hooks/useDebouncedValue.ts` using the 8-line pattern from RESEARCH §"Open Questions (RESOLVED)" item 4 verbatim.
   - Record branch outcome in SUMMARY.
     </action>
     <verify>
     <automated>cd /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0 && (grep -rn "useDebouncedValue" frontend/src/hooks/ >/dev/null && echo "useDebouncedValue OK") && cat .planning/phases/40-list-pages/40-02c-SUMMARY.md 2>/dev/null | grep -q "engagement_count branch:" && echo OK</automated>
     </verify>
     <acceptance_criteria>
   - SUMMARY records: engagement_count branch (a or b), useTopics/usePersons verified shape, .spinner-row source branch (a or b), useDebouncedValue branch (a or b)
   - If branch (b) of OQ1: `dossier_engagement_counts` view exists in Supabase
   - If branch (b) of OQ4: `frontend/src/hooks/useDebouncedValue.ts` exists with the locked 8-line pattern
     </acceptance_criteria>
     <done>All 4 Open-Question branches resolved with outcomes recorded; conditional artifacts (Supabase view, useDebouncedValue.ts) shipped only when their branch (b) is hit.</done>
     </task>

<task type="auto">
  <name>Task 2: Port handoff CSS rules + wire @import + bump size-limit budget</name>
  <files>frontend/src/styles/list-pages.css, frontend/src/index.css, frontend/.size-limit.json</files>
  <read_first>
    - /tmp/inteldossier-handoff/inteldossier/project/src/app.css (port targets)
    - frontend/src/index.css (locate `@import` insertion point)
    - frontend/.size-limit.json (current `Total JS` = 800 KB, bump → 815 KB)
    - .planning/phases/40-list-pages/40-RESEARCH.md §"Architecture-specific Resolutions" §1 (handoff CSS rule line ranges)
    - This plan's Task 1 SUMMARY entry for OQ3 (`.spinner-row` branch)
  </read_first>
  <action>
**Step A — Create `frontend/src/styles/list-pages.css`:**

Port verbatim from `/tmp/inteldossier-handoff/inteldossier/project/src/app.css`. Substitute Phase 33 token names (`--ink`/`--surface`/`--line`/`--line-soft`/`--accent`/`--accent-soft`/`--accent-ink`/`--ink-mute`/`--ink-faint`/`--radius`/`--radius-sm`/`--pad`/`--gap`/`--font-display`/`--font-body`).

Required rules (port verbatim from listed handoff line ranges):

1. `.tb-search`, `.tb-search input`, `.tb-search input::placeholder` — handoff lines 115-117
2. `.btn`, `.btn.btn-primary` (use `--ink` for primary background per RESEARCH §6 LOCK; ignore `dir-situation`/`dir-chancery` overrides) — lines 222-225
3. `.card` — line 233
4. `.chip`, `.chip-accent`, `.chip-danger`, `.chip-warn`, `.chip-ok`, `.chip-info`, `.chip-default` — lines 245-250 (add `.chip-default` if missing: `background: var(--surface-raised); color: var(--ink-mute); border: 1px solid var(--line)`)
5. `table.tbl`, `.tbl th`, `.tbl td`, `.tbl tr:last-child td`, `.tbl tr:hover td` — lines 260-265
6. `.week-list`, `.week-row`, `.week-date`, `.week-day`, `.week-dd`, `.week-time`, `.week-body`, `.week-title`, `.week-meta`, `.week-meta .sep`, `.week-right` — lines 309-322
7. `.forums-list` (alias `.forum-list`), `.forum-row`, `.forum-row:last-child`, `.forum-name` — lines 435-440
8. `.empty-hint`, `.empty-hint .sub` — lines 457-458
9. `html[dir="rtl"] .icon-flip { transform: scaleX(-1); }` — line 667 (CRITICAL — drives chevron mirroring)
10. `.page`, `.page-head`, `.page-title`, `.page-sub` — lines 201-208
11. **`.spinner-row`** — branch per Task 1 OQ3 SUMMARY: (a) verbatim from handoff app.css matched line range, OR (b) fallback canonical: `.spinner-row { display: flex; align-items: center; gap: 12px; padding: 16px; min-height: 44px; border-top: 1px solid var(--line-soft); }`
12. `.dossier-row { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid var(--line-soft); min-height: 44px; }` — canonicalize from handoff inline styles.

Skip any rule already present in `frontend/src/index.css` from Phase 33/36/37 (run `grep -n "spinner-row\\|\\.pill\\|dossier-row\\|icon-flip\\|\\.tbl\\|\\.chip\\|\\.week-list\\|\\.forum-row" frontend/src/index.css`); note skipped duplicates in the file's leading comment.

**Step B — Wire import:**

Add `@import url('./styles/list-pages.css');` near the top of `frontend/src/index.css`, AFTER Phase 33 token import + HeroUI `@import`s, BEFORE app-level layered rules. Use Edit/Write — DO NOT recreate index.css.

**Step C — Bump size-limit:**

Edit `frontend/.size-limit.json`: change `Total JS` entry's `"limit": "800 KB"` → `"limit": "815 KB"`. All other entries unchanged.
</action>
<verify>
<automated>test -f frontend/src/styles/list-pages.css && grep -q 'icon-flip' frontend/src/styles/list-pages.css && grep -q 'spinner-row' frontend/src/styles/list-pages.css && grep -q "list-pages.css" frontend/src/index.css && grep -q '"815 KB"' frontend/.size-limit.json && echo "OK"</automated>
</verify>
<acceptance_criteria> - `frontend/src/styles/list-pages.css` exists with `.tb-search`, `.btn.btn-primary`, `.chip`, `.tbl`, `.week-list`, `.forum-row`, `.icon-flip`, `.spinner-row`, `.page`, `.page-head` - `grep -n "@import.*list-pages" frontend/src/index.css` returns 1 match - `frontend/.size-limit.json` `Total JS` = `815 KB` - `grep -c '"800 KB"' frontend/.size-limit.json` returns 0 - `grep -n "scaleX(-1)" frontend/src/styles/list-pages.css` returns at least 1 match
</acceptance_criteria>
<done>Handoff CSS port lives in list-pages.css, imported by index.css, size-limit bumped to 815 KB.</done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                | Description                                                    |
| ----------------------- | -------------------------------------------------------------- |
| CSS asset bundle        | Static asset delivered same-origin; no runtime trust transfer. |
| Supabase MCP migrations | Database admin tool; only used to create read-only view.       |

## STRIDE Threat Register

| Threat ID   | Category               | Component                                      | Disposition | Mitigation Plan                                                                                                                               |
| ----------- | ---------------------- | ---------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| T-40-02c-01 | Information disclosure | `dossier_engagement_counts` view (if branch b) | mitigate    | View aggregates non-sensitive counts only; granted to `authenticated` role; RLS on underlying `engagements` table still enforced when JOINed. |
| T-40-02c-02 | Tampering              | size-limit budget bump                         | accept      | Budget gate is build-time only; bump documented in plan rationale.                                                                            |

</threat_model>

<verification>
- list-pages.css present and imported
- size-limit Total JS = 815 KB
- 4 Open-Question branches resolved and recorded in SUMMARY
- Conditional artifacts shipped only when their branch (b) is hit
</verification>

<success_criteria>

- All Wave 1 plans can read this plan's SUMMARY to know: which engagement_count branch, useTopics/usePersons shape, useDebouncedValue path
- Handoff CSS classes available globally
- size-limit gate green at 815 KB
  </success_criteria>

<output>
After completion, create `.planning/phases/40-list-pages/40-02c-SUMMARY.md`. MUST contain a "Branch outcomes" section with 4 lines:
- `engagement_count branch: (a) column exists | (b) view created`
- `useTopics/usePersons shape: { data, isLoading, error } | divergent: <verbatim>`
- `.spinner-row source branch: (a) handoff lines X-Y | (b) fallback canonical`
- `useDebouncedValue branch: (a) existed at <path> | (b) created at frontend/src/hooks/useDebouncedValue.ts`
</output>
