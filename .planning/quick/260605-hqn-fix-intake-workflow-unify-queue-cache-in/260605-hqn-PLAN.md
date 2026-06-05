---
phase: quick-260605-hqn
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/pages/IntakeQueue.tsx
  - frontend/src/domains/intake/hooks/useIntakeApi.ts
  - frontend/src/domains/intake/repositories/intake.repository.ts
autonomous: true
requirements: [FIX-1-queue-cache-unify, FIX-2-dead-assignTicket-removal]

must_haves:
  truths:
    - "Triaging a ticket from the queue's classify dialog refreshes the queue list automatically"
    - 'Create / convert / merge / close mutations also refresh the queue list (prefix-matched under intakeKeys.tickets())'
    - 'The intake queue query key is nested under the intakeKeys.tickets() prefix'
    - 'The unused assignTicket() frontend wrapper no longer exists'
    - 'frontend type-check passes with no new errors from the three touched files'
  artifacts:
    - path: 'frontend/src/pages/IntakeQueue.tsx'
      provides: 'Queue useQuery keyed via intakeKeys.ticketList(filters)'
      contains: 'intakeKeys.ticketList(filters)'
    - path: 'frontend/src/domains/intake/hooks/useIntakeApi.ts'
      provides: 'useApplyTriage onSuccess invalidating intakeKeys.tickets()'
      contains: 'intakeKeys.tickets()'
    - path: 'frontend/src/domains/intake/repositories/intake.repository.ts'
      provides: "Repository with assignTicket removed; section comment is 'Conversion'"
  key_links:
    - from: 'frontend/src/pages/IntakeQueue.tsx'
      to: 'intakeKeys.tickets() invalidations'
      via: 'queryKey prefix nesting (intakeKeys.ticketList)'
      pattern: "intakeKeys\\.ticketList"
    - from: 'frontend/src/domains/intake/hooks/useIntakeApi.ts useApplyTriage'
      to: 'intake queue refetch'
      via: 'invalidateQueries intakeKeys.tickets()'
      pattern: "invalidateQueries.*intakeKeys\\.tickets\\(\\)"
---

<objective>
Fix the intake workflow so the queue list stays in sync, and delete dead frontend code.

Two verified fixes (already validated against the live codebase — do NOT re-litigate):

- FIX 1 (real bug): The queue's `useQuery` uses key `['intake-queue', filters]`, which no
  mutation invalidates. Triage/create/convert/merge/close all leave the queue list stale.
  Re-key the queue under the `intakeKeys.tickets()` prefix and add a tickets() invalidation
  to `useApplyTriage` so every mutation reaches the queue by prefix match.
- FIX 2 (dead code): Remove the unused `assignTicket()` wrapper (zero importers in
  frontend/src) and tidy its now-stale section comment.

Purpose: Triaging/creating/converting/merging/closing a ticket should auto-refresh the queue,
and the repository should not carry dead surface area.
Output: Three edited frontend files; no new dependencies; no behavior change beyond cache invalidation.

Out of scope (explicitly): the "no error feedback on create" finding (INVALID — IntakeForm already
renders an inline error banner via `createTicketMutation.isError`). The backend
`intake-tickets-assign` edge function and `backend/tests/contract/assign.test.ts` are LIVE and
tested — do NOT touch them. Do NOT touch `useLastSyncInfo('intake-queue')` or
`testId="intake-queue-empty-state"` — those are not query keys.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

<interfaces>
<!-- intakeKeys factory (source of truth: frontend/src/domains/intake/hooks/useIntakeApi.ts) -->
<!-- Re-exported (shim) from '@/hooks/useIntakeApi'. Use these directly — no exploration needed. -->

intakeKeys = {
all: ['intake'],
tickets: () => ['intake', 'tickets'],
ticketList: (filters?: Record<string, unknown>) => ['intake', 'tickets', 'list', filters],
ticket: (id) => ['intake', 'tickets', 'detail', id],
triage: (id) => ['intake', 'tickets', 'triage', id],
...
}

NOTE: ticketList(filters?) takes `Record<string, unknown>`. The queue's local
`QueueFilters` is declared as an `interface` (IntakeQueue.tsx ~line 106), and a TS
interface is NOT assignable to `Record<string, unknown>` (interfaces lack an implicit
index signature). Converting it to a `type` alias makes the prescribed call typecheck.
`QueueFilters` is file-local and non-exported, so this is safe and side-effect-free.

CURRENT useApplyTriage onSuccess (frontend/src/domains/intake/hooks/useIntakeApi.ts ~113-116):
onSuccess invalidates intakeKeys.ticket(ticketId) and intakeKeys.triage(ticketId) only.
File-wide, intakeKeys.tickets() is currently invalidated in exactly 4 hooks
(useCreateTicket, useConvertTicket, useMergeTickets, useCloseTicket); this plan adds a 5th
(useApplyTriage).
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Unify intake queue cache invalidation (FIX 1)</name>
  <files>frontend/src/pages/IntakeQueue.tsx, frontend/src/domains/intake/hooks/useIntakeApi.ts</files>
  <action>
Implements FIX-1-queue-cache-unify. Two files, no behavior change beyond cache keying/invalidation.

In frontend/src/pages/IntakeQueue.tsx:

1. Add an import for `intakeKeys` from '@/hooks/useIntakeApi' (the deprecated shim that
   re-exports from '@/domains/intake' — per the source-artifact instruction). Place it with
   the other `@/` imports near the top (e.g. alongside the `@/hooks/useDirection` import).
2. Change the queue `useQuery` key (currently `queryKey: ['intake-queue', filters]`, ~line 132)
   to `queryKey: intakeKeys.ticketList(filters)`. This nests the queue under the
   `intakeKeys.tickets()` prefix (`['intake','tickets','list',filters]`) so existing
   `invalidateQueries({ queryKey: intakeKeys.tickets() })` calls in the mutations reach it by
   prefix match. Leave the `queryFn`, `staleTime`, and everything else in that useQuery untouched.
3. Convert the local `QueueFilters` declaration (~line 106) from `interface QueueFilters {` to
   `type QueueFilters = {` (keep the same body and braces; a type alias gets an implicit index
   signature so it is assignable to `ticketList`'s `Record<string, unknown>` param — required for
   type-check to pass). This is a required supporting change for the prescribed key edit, NOT
   scope creep. Do not change any usage of `QueueFilters` elsewhere in the file.
4. DO NOT touch `useLastSyncInfo('intake-queue')` (~line 175) or
   `testId="intake-queue-empty-state"` (~line 430) — those strings are not query keys.

In frontend/src/domains/intake/hooks/useIntakeApi.ts: 5. In `useApplyTriage`'s `onSuccess` (~lines 113-116), ADD a third invalidation:
`void queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() })`, alongside the
existing `intakeKeys.ticket(ticketId)` and `intakeKeys.triage(ticketId)` invalidations.
The queue query is active (mounted under the classify dialog), so this prefix invalidation
auto-refetches it after triage.

Honor CLAUDE.md TypeScript conventions: no semicolons, single quotes, keep explicit return types
already present, leading `void` on fire-and-forget invalidations (matches the file's existing style).
</action>
<verify>
<automated>cd frontend && pnpm type-check</automated>
<automated>grep -nF "intakeKeys.ticketList(filters)" frontend/src/pages/IntakeQueue.tsx && ! grep -nF "['intake-queue', filters]" frontend/src/pages/IntakeQueue.tsx</automated>
<automated>grep -A12 "const useApplyTriage =" frontend/src/domains/intake/hooks/useIntakeApi.ts | grep -F "intakeKeys.tickets()"</automated>
</verify>
<done>
Queue useQuery is keyed via `intakeKeys.ticketList(filters)`; the old `['intake-queue', filters]`
key is gone; `QueueFilters` is a type alias; `useApplyTriage`'s onSuccess now invalidates THREE keys —
`intakeKeys.ticket(ticketId)`, `intakeKeys.triage(ticketId)`, and the newly-added
`intakeKeys.tickets()` (the scoped grep confirms tickets() appears inside the useApplyTriage block;
file-wide tickets()-invalidation count rises from 4 — create/convert/merge/close — to 5);
`useLastSyncInfo` and the empty-state testId are unchanged; `pnpm type-check` passes with no new errors.
</done>
</task>

<task type="auto">
  <name>Task 2: Remove dead assignTicket frontend wrapper (FIX 2)</name>
  <files>frontend/src/domains/intake/repositories/intake.repository.ts</files>
  <action>
Implements FIX-2-dead-assignTicket-removal. Frontend repository only — the backend
`intake-tickets-assign` edge function and `backend/tests/contract/assign.test.ts` stay untouched.

In frontend/src/domains/intake/repositories/intake.repository.ts:

1. Delete the `assignTicket` function (~lines 49-51):
   `export async function assignTicket(data: Record<string, unknown>): Promise<unknown> { return apiPost('/intake-tickets-assign', data) }`
   — it has zero importers anywhere in frontend/src (verified by grep: only its own definition
   matched). `useIntakeApi.ts` does not import it, so no consumer change is needed.
2. Update the section banner comment above it from `// Assignment & Conversion` to
   `// Conversion` (only `convertTicket` remains in that section). Keep the `=====` rule lines.
   Leave `convertTicket` and every other function in the file exactly as-is.

No new imports, no other edits.
</action>
<verify>
<automated>! grep -rn "assignTicket" frontend/src</automated>
<automated>grep -nF "export async function convertTicket" frontend/src/domains/intake/repositories/intake.repository.ts</automated>
<automated>cd frontend && pnpm type-check</automated>
</verify>
<done>
`assignTicket` no longer appears anywhere in frontend/src; `convertTicket` and all other repository
functions are intact; the section comment reads "Conversion"; `pnpm type-check` passes with no new
errors. Backend assign function and its contract test are untouched.
</done>
</task>

</tasks>

<verification>
- `cd frontend && pnpm type-check` passes (no new errors introduced by these three edits).
- `grep -rn "assignTicket" frontend/src` returns nothing.
- `grep -nF "intakeKeys.ticketList(filters)" frontend/src/pages/IntakeQueue.tsx` matches; the old
  `['intake-queue', filters]` literal is gone.
- `useApplyTriage` onSuccess in useIntakeApi.ts contains an `intakeKeys.tickets()` invalidation.
- Manual sanity (optional): from the intake queue, open the classify dialog, apply triage, and
  confirm the list reflects the new status without a manual refresh.
</verification>

<success_criteria>

- Triage from the queue dialog refreshes the queue automatically (queue now lives under the
  `intakeKeys.tickets()` prefix and `useApplyTriage` invalidates that prefix).
- Create / convert / merge / close continue to refresh the queue via their existing
  `intakeKeys.tickets()` invalidations (now reaching the queue by prefix match).
- Dead `assignTicket()` frontend wrapper removed; repository section comment corrected.
- No new dependencies, no regressions to create/triage/convert/merge/close flows, type-check green.
  </success_criteria>

<output>
Create `.planning/quick/260605-hqn-fix-intake-workflow-unify-queue-cache-in/260605-hqn-SUMMARY.md` when done.
</output>
