---
phase: 66-overview-error-contract-timeline-cross-links
plan: 01
subsystem: dossier-overview-service
tags: [error-contract, fail-the-query, i18n, ovrerr-01, tdd]
requires: []
provides:
  - 'DossierOverviewAPIError thrown by all 7 overview section fetchers (fail-the-query)'
  - 'dossier:overview.sectionError key (en + ar) for the wave-2 card error branches'
affects:
  - 'wave-2 card plans (66-04/66-05/66-06) — build on a service that rejects on section failure and a tree where overview.sectionError exists'
tech-stack:
  added: []
  patterns: ['fail-the-query (throw DossierOverviewAPIError instead of console.error-and-continue)']
key-files:
  created:
    - frontend/src/services/__tests__/dossier-overview.service.test.ts
  modified:
    - frontend/src/services/dossier-overview.service.ts
    - frontend/src/i18n/en/dossier.json
    - frontend/src/i18n/ar/dossier.json
decisions:
  - 'OVRERR-01 contract = Contract A (fail-the-query). Every section fetcher throws DossierOverviewAPIError on a PostgREST/edge error; fetchDossierOverview keeps Promise.all so the first rejection rejects the section-variant query. Contracts B (section-level error metadata) and C (explicit unknown state) rejected: per-card query variants already give per-card granularity.'
  - 'Status 500 by default — transient errors keep the global 3x retry (lib/query-client.ts). The optional schema-error→400 fast-fail mapping was NOT implemented; documented in the service header comment instead (keep simple).'
  - 'briefs (L549) and attachments (L553) permanent-empty groups in fetchDocuments are verified-schema honest empties — left as [] (NOT converted to throws).'
  - 'routeTree.gen.ts reflowed as a build side-effect during vitest/type-check; left unstaged (not reverted, not committed) — it is outside this plan files_modified and committing it would collide with sibling worktrees.'
metrics:
  duration: ~12m
  tasks: 2
  files_changed: 4
  completed: 2026-06-13
---

# Phase 66 Plan 01: Overview Section Error Contract (OVRERR-01) Summary

Made all 7 section fetchers in `dossier-overview.service.ts` fail-the-query — they now throw `DossierOverviewAPIError` on a PostgREST/edge error instead of `console.error`-and-continue, so a section failure can never impersonate a trustworthy empty state — and landed the phase's single new bilingual i18n key (`dossier:overview.sectionError`) that the wave-2 card sweep renders.

## What Was Built

### Task 1 (RED) — forced-error service test suite

`frontend/src/services/__tests__/dossier-overview.service.test.ts` (committed `a67a85e4`):

- A `vi.hoisted` self-returning, awaitable supabase mock proxy keyed by table name — one builder satisfies every chain shape (`.eq().single()`, awaited `.eq()`, `.in().limit()`, `.gte().lte().order()`, `.eq().order()`).
- 8 forced-error rejection tests (related_dossiers, documents×2, work_items links + tasks, calendar_events, key_contacts, activity_timeline-via-unified-service) — each asserts `fetchDossierOverview` REJECTS with `DossierOverviewAPIError` (or truthy for the activity edge mock).
- 1 regression pin (GREEN from the start): a `dossiers` core error rejects with code `DOSSIER_FETCH_FAILED`.
- 1 EN↔AR parity test: both `dossier.json` files contain `overview.sectionError`, AR starts with `تعذر`.
- RED confirmed: 9 failed / 1 passed before Task 2.

### Task 2 (GREEN) — fail-the-query + decision comment + bilingual key

`frontend/src/services/dossier-overview.service.ts` (committed `422f19ea`):

- **fetchRelatedDossiers**: `console.error` → throw `RELATED_DOSSIERS_FETCH_FAILED`.
- **fetchDocuments**: both swallow sites → throw `DOCUMENTS_FETCH_FAILED` (position links; MoU ×2).
- **fetchWorkItems**: all 6 inner queries now destructure `error` and throw `WORK_ITEMS_FETCH_FAILED` (links, tasks, assignee users, direct commitments, linked commitments, intakes).
- **fetchCalendarEvents**: destructure + throw `CALENDAR_EVENTS_FETCH_FAILED`.
- **fetchKeyContacts**: destructure + throw `KEY_CONTACTS_FETCH_FAILED`.
- **fetchActivityTimeline**: try/catch deleted — `UnifiedActivityAPIError` propagates.
- OVRERR-01 decision header comment added above `DossierOverviewAPIError`.
- `overview.sectionError` added to both `en/dossier.json` and `ar/dossier.json` in the same commit (UI-SPEC strings verbatim).

GREEN confirmed: 10/10 tests pass; `tsc --noEmit` exit 0; eslint clean on both touched code files.

## Contract Decision (verbatim, for phase roll-up)

> **OVRERR-01 contract: fail-the-query.** Every section fetcher throws `DossierOverviewAPIError` on a PostgREST/edge error; `Promise.all` rejects the section-variant query; cards render `role="alert"` error lines from `isError`. Status 500 by default — transient errors keep the global 3x retry (`lib/query-client.ts`). The optional schema-error→400 fast-fail mapping is intentionally NOT implemented (keep simple); `details` carry PostgREST messages for console/debug only and are never rendered in the UI.

## Verification

| Gate                                            | Result             |
| ----------------------------------------------- | ------------------ |
| `vitest run dossier-overview.service.test.ts`   | 10 passed (10)     |
| `tsc --noEmit`                                  | exit 0             |
| `eslint` (service + test)                       | exit 0             |
| `grep OVRERR-01`                                | present in service |
| EN↔AR `overview.sectionError` parity            | I18N_OK            |
| 66-VALIDATION row 1 (every fetcher rejects)     | realized           |
| 66-VALIDATION row 4 (sectionError EN↔AR parity) | realized           |

## Deviations from Plan

None — plan executed exactly as written. All 7 fetchers honest, decision comment present, bilingual key landed in one commit.

### Side-effect note (not a deviation)

`frontend/src/routeTree.gen.ts` was whitespace-reflowed by the TanStack Router Vite plugin during `vitest`/`type-check` (it loads the Vite config). It is **outside** this plan's `files_modified`, was **not** touched by any edit, and was deliberately left **unstaged** — neither reverted (per the phase-65 routeTree.gen.ts instruction) nor committed (committing a 1144-line reflow would collide with the sibling worktrees on 66-02/66-03). The orchestrator's merge/regeneration step owns it.

## Known Stubs

None. `briefs` and `attachments` empty groups in `fetchDocuments` are pre-existing verified-schema honest empties (documented in-file), explicitly out of scope for fail-the-query conversion per the plan.

## Self-Check: PASSED

- FOUND: `frontend/src/services/__tests__/dossier-overview.service.test.ts`
- FOUND: `.planning/phases/66-overview-error-contract-timeline-cross-links/66-01-SUMMARY.md`
- FOUND commit `a67a85e4` (Task 1 — RED test suite)
- FOUND commit `422f19ea` (Task 2 — GREEN fail-the-query + i18n)
