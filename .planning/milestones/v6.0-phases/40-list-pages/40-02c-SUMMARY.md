---
phase: 40-list-pages
plan: 02c
subsystem: frontend-styling
tags: [css, size-limit, handoff-port, rtl, verification]
requires:
  - .planning/phases/40-list-pages/40-02a-SUMMARY.md (primitives that consume these CSS classes)
provides:
  - frontend/src/styles/list-pages.css (.btn, .chip, .tbl, .week-list, .forum-row, .icon-flip, .spinner-row, .pill, .dossier-row, .page*)
  - 'size-limit Total JS gate at 815 KB'
  - 'Verified hook signatures + engagement_count branch for Wave 1 consumers'
affects:
  - 40-03 → 40-13 (all Wave 1 list-page bodies inherit these classes)
  - 40-02b (engagement_count column absent on dossiers — adapter must source from junction/relation)
tech-stack:
  added:
    - frontend/src/styles/list-pages.css
  patterns:
    - 'Handoff CSS port via separate stylesheet @import (not @layer) — definitions sit at the cascade tail to override @apply shorthand from index.css @layer components'
key-files:
  created:
    - path: frontend/src/styles/list-pages.css
      purpose: 'Global CSS classes referenced by Plan 02a primitives + all Wave 1 list-page bodies'
  modified:
    - path: frontend/src/index.css
      change: "Added @import url('./styles/list-pages.css') after HeroUI imports, before @theme block"
    - path: frontend/.size-limit.json
      change: 'Total JS budget bumped 800 KB → 815 KB'
decisions:
  - 'Skipped .card from handoff port — already defined in index.css @layer components via @apply rounded-lg border bg-card text-card-foreground shadow-sm. Re-defining would conflict.'
  - 'Substituted color-mix(in srgb, var(--{tone}) 15%, transparent) for handoff --warn-soft / --ok-soft / --info-soft tokens that are absent from the D-16 token set. --accent-soft and --line-soft already exist and are used as-is.'
  - 'Did NOT create dossier_engagement_counts Supabase view despite OQ1 = branch (b). Orchestrator note: that decision is owned by 02b adapter logic and 02b is running in parallel. Recorded the absence as a finding for 02b to consume.'
  - 'Direction-class overrides (.dir-chancery, .dir-situation, .dir-bureau) intentionally omitted from the port. They were palette/theme experiments that do not apply to the production design system.'
metrics:
  duration: '~12 minutes'
  completed: '2026-04-25'
  tasks: 2
  files_created: 1
  files_modified: 2
---

# Phase 40 Plan 02c: CSS Port + Size-Limit + Open-Questions Verification Summary

Ported handoff CSS rules into `frontend/src/styles/list-pages.css`, wired via `@import` in `index.css`, bumped size-limit Total JS budget 800 → 815 KB, and resolved all four RESEARCH Open Questions with their outcomes recorded for downstream Wave 1 plans.

## Branch outcomes

- **engagement_count branch:** **(b) view NOT created** — column is absent from `dossiers` table (verified via `backend/src/types/database.types.ts`: `engagement_count` only appears on `engagement_analytics`, `tags`, `working_group_members`, NOT on `dossiers`). However, per orchestrator instruction, the `dossier_engagement_counts` Supabase view creation is owned by Plan 02b's adapter logic (running in parallel). 02b should either compute the count via JOIN/COUNT(\*) on `engagements.dossier_id` directly in its hook, OR ship the view itself. **02b consumers MUST NOT assume `dossiers.engagement_count` exists.**
- **useTopics/usePersons shape:** `{ data, isLoading, error, ... }` — verified standard TanStack `useQuery` return. Both `frontend/src/hooks/useTopics.ts` and `frontend/src/hooks/usePersons.ts` are deprecation shims that re-export from `@/domains/topics` and `@/domains/persons` respectively. The real hooks (`frontend/src/domains/persons/hooks/usePersons.ts:49`, `frontend/src/domains/topics/hooks/useTopics.ts:28`) call `useQuery({ ... })` and return its result directly — full TanStack Query result shape. Wave 1 Plans 05/07 can rely on `data`, `isLoading`, `isError`, `error`.
- **.spinner-row source branch:** **(a) handoff lines 997-1009** — exact match found in `/tmp/inteldossier-handoff/inteldossier/project/src/app.css`. Ported verbatim into `list-pages.css`.
- **useDebouncedValue branch:** **(a) existed at frontend/src/hooks/useDebouncedValue.ts** — file pre-existed (verified by orchestrator + my own check). NO action taken. Plan 02a primitives that import from this path already work.

## What was built

### 1. `frontend/src/styles/list-pages.css` (NEW, ~310 lines)

Global stylesheet ported from handoff `app.css`. Contains:

- **Page shell:** `.page`, `.page-head`, `.page-title`, `.page-sub` (handoff lines 201-208)
- **Toolbar search:** `.tb-search`, `.tb-search input`, placeholder (handoff lines 115-117)
- **Buttons:** `.btn`, `.btn:hover`, `.btn-primary`, `.btn-primary:hover` (handoff lines 222-225) — `--ink` background per RESEARCH §6 LOCK
- **Chips:** `.chip`, `.chip-accent`, `.chip-danger`, `.chip-warn`, `.chip-ok`, `.chip-info`, `.chip-default` (handoff lines 245-250 + canonicalized `.chip-default`)
- **Table:** `table.tbl`, `.tbl th/td/tr:last-child td/tr:hover td` (handoff lines 260-265)
- **Week list:** `.week-list`, `.week-row`, `.week-date`, `.week-day`, `.week-dd`, `.week-time`, `.week-body`, `.week-title`, `.week-meta`, `.week-meta .sep`, `.week-right` (handoff lines 309-322)
- **Forum row:** `.forums-list`/`.forum-list` alias, `.forum-row`, `.forum-row:last-child`, `.forum-name` (handoff lines 435-440)
- **Empty hint:** `.empty-hint`, `.empty-hint .sub` (handoff lines 457-458)
- **Spinner row:** `.spinner-row` (handoff lines 997-1009 verbatim)
- **RTL chevron flip:** `html[dir="rtl"] .icon-flip { transform: scaleX(-1); }` (handoff line 667 — CRITICAL)
- **FilterPill state:** `.pill`, `.pill:hover`, `.pill.active` (canonicalized — handoff did not contain it; primitive in 02a needs it)
- **DossierTable row:** `.dossier-row` (canonicalized from inline styles in handoff — primitive in 02a needs it)

**Skipped duplicates:** `.card` (already defined in `index.css` `@layer components`).

### 2. `frontend/src/index.css` (modified, +5 lines)

Added between HeroUI variants import and `@theme` block:

```css
/* Phase 40 list-pages handoff CSS (Plan 02c) — port of app.css rules
   required by list-page primitives (.btn, .chip, .tbl, .week-list,
   .forum-row, .icon-flip, .spinner-row, .pill, .dossier-row, .page*). */
@import url('./styles/list-pages.css');
```

Placed at cascade tail relative to `@layer components` so handoff rules win over the `@apply` shorthand for `.btn-primary`.

### 3. `frontend/.size-limit.json` (modified, 1 line)

`Total JS` `"limit": "800 KB"` → `"limit": "815 KB"`. Other entries unchanged. Orchestrator-coordinated bump for incoming Wave 1 list-page chunks.

## Deviations from Plan

### Auto-fixed Issues

None. The plan was followed precisely.

### Notable interpretations

**1. `.card` skip rationale**
The plan instructed to "skip any rule already present in `frontend/src/index.css` from Phase 33/36/37". `.card` already exists at `index.css:380` inside `@layer components` as `@apply rounded-lg border bg-card text-card-foreground shadow-sm`. Re-defining it from the handoff would either conflict or override the working semantic mapping. Skipped.

**2. Soft-tone color tokens (`--warn-soft`, `--ok-soft`, `--info-soft`, `--danger-soft`)**
Handoff references these for chip backgrounds. The D-16 token set (verified in `index.css:117-141`) defines `--accent-soft` and `--line-soft` only — no per-tone soft variants. Substituted `color-mix(in srgb, var(--{tone}) 15%, transparent)` at the rule site (5 chip variants). This produces the same visual effect (~15% tinted background) and inherits palette switching automatically since the base tokens (`--warn`, `--ok`, etc.) are written by `DesignProvider`.

**3. `engagement_count` view deferred to 02b**
Per the strict orchestrator instruction in the executor prompt: "02b is running in parallel — DO NOT create the Supabase view here; that decision is owned by 02b's adapter logic." Recorded the absence finding so 02b can act.

## Open Questions verification matrix

| OQ  | Question                                   | Branch       | Outcome                                                                                                        | Wave 1 impact                           |
| --- | ------------------------------------------ | ------------ | -------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 1   | `dossiers.engagement_count` column exists? | (b) absent   | Column NOT on dossiers; verified via database.types.ts                                                         | 02b adapter must compute or create view |
| 2   | useTopics/usePersons return shape?         | (a) standard | `{ data, isLoading, error, … }` (TanStack useQuery) — both are re-export shims to `@/domains/{topics,persons}` | 05/07 can use shape directly            |
| 3   | `.spinner-row` source available?           | (a) match    | Handoff lines 997-1009 — ported verbatim                                                                       | 02a primitive `LoadMoreRow` works       |
| 4   | `useDebouncedValue.ts` exists?             | (a) existed  | `frontend/src/hooks/useDebouncedValue.ts` pre-existed; no creation needed                                      | 02a primitive `SearchInput` works       |

## Self-Check: PASSED

- File `frontend/src/styles/list-pages.css` — FOUND
- `@import url('./styles/list-pages.css')` in `frontend/src/index.css` — FOUND
- `"limit": "815 KB"` in `frontend/.size-limit.json` — FOUND
- `"limit": "800 KB"` in `frontend/.size-limit.json` — 0 occurrences (correctly removed)
- `scaleX(-1)` in `list-pages.css` — 1 occurrence
- `.icon-flip` definition — FOUND
- `.spinner-row` definition — FOUND
- Commit `eb4a7285` — FOUND in `git log`

## Files

- `frontend/src/styles/list-pages.css` (created, 313 lines)
- `frontend/src/index.css` (modified, +5 lines)
- `frontend/.size-limit.json` (modified, 1 line changed)
- `.planning/phases/40-list-pages/40-02c-SUMMARY.md` (this file)

## Commits

- `eb4a7285` — feat(40-02c): port handoff CSS + bump size-limit budget
