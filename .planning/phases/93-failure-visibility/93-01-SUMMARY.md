---
phase: 93-failure-visibility
plan: 01
subsystem: ui
tags: [react, i18n, error-states, tanstack-query, tailwind, vitest]

requires:
  - phase: 92-delegations-trust
    provides: the inline variant-A error markup at DelegationManagementPage.tsx:215-237 that this plan EXTRACTS, and the shipped spec that makes that page a named non-consumer
  - phase: 77-linear-activation
    provides: the Linear token engine (--danger, --t-body, --t-card-title, .btn-primary/.btn-ghost recipes) the component composes from
provides:
  - 'frontend/src/components/error-states/QueryErrorState.tsx — the ONE shared query-error component (D-03), variants page/inline'
  - 'the cross-plan testid contract: data-testid="query-error-state" (page) and "query-error-inline" (inline), positive-controlled by the component''s own unit test (C9a)'
  - 'seven bilingual common:errors.* keys in BOTH locales (D-04): retry, queryFailed.{title,description}, queryFailedInline, countUnavailable, incompleteRecord.{title,description}'
  - 'a verified signed phase-93-base C7 anchor for every later scope diff in this phase'
affects:
  [
    93-06,
    93-08,
    93-09,
    93-10,
    93-11,
    93-12,
    93-13,
    93-14,
    criterion-2-surfaces,
    criterion-3-surfaces,
    criterion-5-copy-rule,
  ]

tech-stack:
  added: []
  patterns:
    - 'error-states/ as a sibling vocabulary to the 13 empty-states/ components'
    - 'render-state components take onRetry + isRetrying props rather than owning refetch state — TanStack Query already reports in-flight'
    - 'bilingual server envelope (message_en/message_ar) is the ONE structured error shape allowed to reach JSX'

key-files:
  created:
    - frontend/src/components/error-states/QueryErrorState.tsx
    - frontend/src/components/error-states/__tests__/QueryErrorState.test.tsx
  modified:
    - frontend/src/i18n/en/common.json
    - frontend/src/i18n/ar/common.json

key-decisions:
  - 'Arabic deviates from the UI-SPEC suggested rendering in two places, per the plan''s own glossary-alignment instruction: "مسؤول النظام" not "المسؤول" (which means assignee across this codebase), and "الدوسيه المرتبط" not "الملف المرتبط" ("الملف" means FILE here; the dossier term is "الدوسيه")'
  - "in-flight retry state is a prop (isRetrying), not internal component state — consumers pass TanStack Query's isRefetching"
  - 'the bilingual envelope REPLACES the generic copy rather than rendering alongside it'
  - 'typography uses [font-size:var(--t-card-title)] / [font-size:var(--t-body)] (the Linear-era idiom in AlertRuleForm.tsx) rather than the .t-body recipe class, whose unlayered color: var(--ink) would override the required text-ink-mute'

patterns-established:
  - 'Every Phase-93 surface whose query rejects renders QueryErrorState — never bespoke per-page error markup'
  - 'Doc comments in gated files must avoid the literal token their gate greps for: the gates filter // line comments only, never /** */ blocks (C8)'

requirements-completed: [TRUST-02, TRUST-04]

duration: 12 min
completed: 2026-08-15
---

# Phase 93 Plan 01: Error-State Vocabulary Summary

**The one shared `QueryErrorState` (page + inline variants, extracted from Phase 92's inline delegations markup) with its testid contract positive-controlled by its own unit test, plus seven `common:errors.*` keys landed in both locales in a single commit.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-08-15T17:28:00Z
- **Completed:** 2026-08-15T17:40:14Z
- **Tasks:** 3
- **Files modified:** 4 (2 created, 2 modified)

## THE GATE DRILL — every gate observed RED before and GREEN after

`ACCEPTANCE-P93-EXEC.md` condition 1. Commands are the plan's `<automated>` text run **verbatim**;
output is pasted, not paraphrased. No gate text was edited.

| gate                            | RED before (command + output)                                                                                                                                                                                                                                                                           | GREEN after (command + output)                                                                                                                                                        | notes                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **93-01_g1** (tag)              | **Not red — green on arrival.** `git rev-parse -q --verify refs/tags/phase-93-base >/dev/null && git tag -v phase-93-base` → `EXIT=0`, `Good "git" signature for alzahrani.khalid@gmail.com with ED25519 key SHA256:YlslD6Lya…`, `object e185f1757b3026a485fdf3fae05d5b64ae4b5785`, `tag phase-93-base` | same command, `EXIT=0`, identical output; tag object unchanged at `e185f175`                                                                                                          | **Subject completed by the orchestrator before execution.** Green-on-arrival is correct here and is NOT a vacuous oracle: the gate's subject (a signed tag) exists, and the gate reaches and verifies the signature. Tag NOT recreated, NOT moved. Criterion read as corrected by `RULING-P93-02` Ruling A (post-planning, pre-execution HEAD).                            |
| **93-01_g2** (component + test) | `cd frontend && pnpm exec vitest run src/components/error-states/__tests__/QueryErrorState.test.tsx && …` → first conjunct `EXIT=1`, `No test files found, exiting with code 1`; `ls src/components/error-states` → `No such file or directory`                                                         | full chain `EXIT=0`; `Test Files 1 passed (1)`, `Tests 9 passed (9)`; both `grep -q` conjuncts pass; two-arg-`t()` count `0`; `pnpm type-check` → `tsc --noEmit`, no output, `EXIT=0` | RED was subject-absent (the C1-clause-2 case the standard says can only be resolved by constructing the done state — done). **C3 pre-checked:** `type-check` DOES exist in `frontend/package.json` and its **baseline was exit 0 on the untouched tree**, so the last conjunct is reachable and was not pre-red (this is defect-class instance 4, checked for explicitly). |
| **93-01_g3** (bilingual keys)   | `node -e "…"` (plan text verbatim) → `EXIT=1`, **no output**. Attribution diagnostic (separate command, gate untouched): `en errors key count: 6 ar errors key count: 6`, `symdiff: []`, all 7 named paths `en=undefined ar=undefined`                                                                  | same command → `EXIT=0`                                                                                                                                                               | **RED for the right reason (C2):** key-set parity was ALREADY equal (6/6, empty symdiff), so the red came solely from the 7 named keys being absent — the gate's actual subject — not from a pre-broken parity or a tooling failure.                                                                                                                                       |

### g3 falsification drill — the negative control, run on MY committed values

The orchestrator drilled g3 in a throwaway worktree with placeholder data. I re-ran it against the
**actual strings I shipped**, because the gate's whole value is catching _untranslated_, not merely
_absent_. Run in a `/tmp` scratch copy so the gate command executes **byte-verbatim** (it resolves
`./frontend/src/i18n/...` relative to cwd); **no git worktree was created**, per instruction.

| drill | mutation to the scratch `ar` file                  | result                                                                  | proves                                                                           |
| ----- | -------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| A     | none (pristine copy of shipped values)             | `EXIT=0`                                                                | the scratch harness itself is sound (positive control)                           |
| B     | `ar.errors.queryFailedInline` := the **EN** string | `EXIT=1`                                                                | catches **UNTRANSLATED** — an English string copied into `ar` does not pass      |
| C     | `ar.errors.countUnavailable` deleted               | `EXIT=1`, `errors key-set mismatch: [ 'countUnavailable' ]`             | catches a **flat** missing key, and names it                                     |
| D     | `ar.errors.incompleteRecord.description` deleted   | `EXIT=1`, `errors key-set mismatch: [ 'incompleteRecord.description' ]` | catches a **nested** missing key — the recursive flatten is real, not decorative |

Tree integrity: `git status --porcelain` before the drill listed only my two intended i18n
modifications; after the drill and `rm -rf /tmp/g3-drill`, identical. The drill left zero residue in
the plans' tree.

**Consequence for the Arabic user:** the shipped `ar` values are real Arabic, verified by drill B —
had I pasted English, g3 would have gone red.

## C9b — cross-phase consumer sweep for THIS plan's four files

Ran the GATE-STANDARD C9b derivation anchored to `phase-93-base`:

- `QueryErrorState.tsx` → **NO CONSUMERS** (new file, nothing in `tests/` references it yet).
- `QueryErrorState.test.tsx` → **NO CONSUMERS**.
- `en/common.json`, `ar/common.json` → id resolves to `common`, the **AMBIGUOUS** bucket. Hand-triaged
  by the real coupling identity (key strings and testids, not the filename), as the standard directs:
  - shipped tests asserting the new testids: **none** (`grep -rn 'query-error-state\|query-error-inline' tests frontend/src` outside my own folder → empty), so **no collision** with an existing selector.
  - shipped tests consuming the seven new keys: **none**. (`ai-errors.ts` matches `errors.retry*` but those are `ai.errors.retryAfter` / `ai.errors.retryNow` in a different namespace — not consumers.)

**One real consumer the standard's own script structurally cannot find**, worth recording because it
is the same "search scoped narrower than the truth" class C9b exists to end:
`frontend/src/i18n/label-parity.test.ts` imports **both** files I modified and asserts key parity.
The C9b script greps only the `tests/` root, and this test lives under `frontend/src`, so it is
invisible to the derivation. I ran it explicitly:
`pnpm exec vitest run src/i18n/label-parity.test.ts` → `Test Files 1 passed (1) / Tests 2 passed (2)`.
It asserts `tweaks.*` parity, my edit touches `errors.*` only, and it stays green.

**Named non-consumer, verified:** `git diff --name-only phase-93-base -- frontend/src/pages/delegations/DelegationManagementPage.tsx`
→ empty. The page keeps its Phase 92 inline error block; `tests/e2e/92-delegations-error.spec.ts`
keeps asserting that block's current DOM. Not retrofitted, not "cleaned up in passing".

## Task Commits

1. **Task 1: Verify the signed phase-93-base tag** — no commit (verification only; the tag existed, signed, at `e185f175`; deliberately not recreated or moved)
2. **Task 2: QueryErrorState component + unit test** — `8080945d` (feat)
3. **Task 3: Seven bilingual keys in the existing common namespace** — `416491aa` (feat)

Both commits used explicit pathspecs (`git commit -- <paths>`) — other lanes had uncommitted work in
this shared tree throughout. Each was verified with `git show --stat <sha>` and a pinned-sha content
read (`git show 416491aa:frontend/src/i18n/en/common.json`), **not** against `HEAD` — HEAD moved
between my commit and my verification (a sibling lane landed `docs(93-02): append self-check`).

## Files Created/Modified

- `frontend/src/components/error-states/QueryErrorState.tsx` — the shared error state. Variant `page`: centered `max-w-md`, `py-12 px-4`, `AlertCircle size-8 text-danger` in a `size-16 rounded-full bg-danger/10` wash, 16px/600 title, 13px/1.5 `text-ink-mute` body, one `.btn-primary` "Try again" with **no icon**, wrapper `role="alert"` + `data-testid="query-error-state"`. Variant `inline`: composes the shipped `Alert` destructive variant unmodified (`role="alert"` inherited), `AlertCircle size-4`, one-line 13px message, `.btn-ghost` retry at the inline end, `data-testid="query-error-inline"`.
- `frontend/src/components/error-states/__tests__/QueryErrorState.test.tsx` — 9 tests, the C9a positive control.
- `frontend/src/i18n/en/common.json` / `frontend/src/i18n/ar/common.json` — seven keys appended to the **existing** top-level `errors` object (no new namespace).

## Decisions Made

1. **Arabic diverges from the UI-SPEC suggested rendering in two places** — the plan explicitly
   authorises this ("UI-SPEC's ar column is the suggested rendering, not a byte-contract"; "align
   Arabic terminology with the existing dossiers/engagements namespace glossary"). Both divergences
   are terminology collisions, verified against the shipped `ar` bundles:
   - UI-SPEC's `تواصل مع المسؤول` → shipped as `تواصل مع مسؤول النظام`. Across `frontend/src/i18n/ar`,
     bare `المسؤول` overwhelmingly means the **assignee** (`نوع المسؤول`, `اختر المسؤول`, `حسب المسؤول`),
     so "contact the administrator" would have read as "contact the assignee". `مسؤول النظام` is the
     existing shipped rendering for a system administrator.
   - UI-SPEC's `بيانات الملف المرتبط به` → shipped as `بيانات الدوسيه المرتبط به`. In this codebase
     `الملف` means **file** (`حجم الملف`, `اسم الملف`); the dossier term is `الدوسيه`
     (`dossiers.json`: `مركز الدوسيهات`, `الدوسيه المرتبط`).
     Everything else matches the Copywriting Contract, including `إعادة المحاولة` (the dominant shipped
     retry label, 25 occurrences) and the `تعذر تحميل …` idiom.
2. **`isRetrying` is a prop, not internal state.** TanStack Query already reports `isRefetching`;
   re-deriving in-flight state inside the component would be a second source of truth.
3. **The bilingual envelope replaces the generic copy** rather than rendering beside it — one message,
   no duplicated explanation.
4. **Typography uses `[font-size:var(--t-*)]`, not the `.t-body` recipe class.** `.t-body` is defined
   outside `@layer` and sets `color: var(--ink)`, which would beat the layered `text-ink-mute`
   utility the UI-SPEC requires for the body. The `[font-size:var(--t-body)] … text-ink-mute` form is
   the Linear-era idiom already shipped in `components/intelligence/AlertRuleForm.tsx`.
5. **Colon-free keys under `useTranslation('common')`.** UI-SPEC's Copywriting Contract shows the
   colon form; 93-PATTERNS §1 Analog C sanctions both and the plan's action text specifies
   `useTranslation('common')` + `t('errors.queryFailed.title')`. Since the hook declares the
   namespace, the two resolve identically — this is the shipped `ListEmptyState` idiom. The dot-form
   hazard in `frontend/CLAUDE.md` applies to callers that do _not_ declare a namespace.

## Deviations from Plan

None — plan executed as written. (The two Arabic renderings above are not deviations: the plan's
Task 3 action text instructs glossary alignment over the UI-SPEC column by name.)

## GATE CONCERN

**Not my gate, not edited, not fixed — reported as the standard requires.** Two sibling plans carry a
C8 exposure of the shape the standard already names, and it is cheap to catch now rather than as a
false red during their execution.

`93-06_g?` and `93-14_g?` both assert a _negative_ count with this filter:

```
test "$(grep -v '^[[:space:]]*//' "$F" | grep -vE 'console\.|throw |new Error' | grep -cE 'error\?\.message|error\.message')" -eq 0
```

`grep -v '^[[:space:]]*//'` filters `//` line comments **only** — it does not filter `/** … */` block
comments, whose lines begin with `*`. Both plans' action text discusses `error.message` explicitly
(93-14 names `pages/AssignmentQueue.tsx:48`'s `{error.message || t('queue.error')}` as the exemplar
defect), so an executor documenting the fix in a JSDoc header will red the gate for correct work.

Demonstrated, not reasoned (scratch files in `/tmp`, since removed):

```
/**
 * The exemplar defect was rendering error.message directly; the fallback key is right.
 */
```

→ filtered count = **1** (gate asserts `-eq 0` → RED)

```
// renders error.message directly
```

→ filtered count = **0** (correctly filtered)

This is GATE-STANDARD **C8** verbatim ("`! grep -q 'X' <file>` fails if `X` appears in a comment — and
it often will, because the plan's own action text usually instructs the author to mention `X`"). My
own g2 carries the identical filter shape for two-argument `t()` calls; I navigated it by deliberately
writing the rule into the component's JSDoc **without** a literal two-argument `t()` example. That
workaround is invisible to the next executor unless it is written down, which is why it is here.

**Ruling needed from the orchestrator, not from me:** either the two gates' filters get widened to
drop block-comment lines, or 93-06/93-14 executors are told to keep those literals out of comments.

## Findings for the orchestrator (not acted on — outside this plan's scope)

**`93-UI-SPEC.md` §2 states a factual claim that is false, and a later plan depends on it.**
It says the not-found page's copy keys `common:errors.pageNotFound` /
`common:errors.pageNotFoundDescription` "already exist in both `en` and `ar`". They exist in
**neither**:

```
grep -rn "pageNotFound" frontend/src/i18n/en/ frontend/src/i18n/ar/   →  (no matches)
```

`frontend/src/routes/__root.tsx:21,25` renders them with **English-default second arguments**
(`t('errors.pageNotFound', 'Page not found')`), so today the shipped not-found page renders English
in Arabic and the absence is invisible at runtime — precisely the D-04 failure mode, and it grows the
AR-04a mask population. This is the same shape as D-06's corrected premise (a UI-SPEC claim that a
precedent exists when it does not).

I did **not** add these two keys: my plan names exactly seven keys, its gate counts exactly those
seven, and the not-found surface belongs to another plan. Whichever plan adopts `notFound()` must add
the pair to both locales **and** drop the English-default second arguments in `__root.tsx`, or its
criterion-3 work will ship an Arabic page in English.

## Issues Encountered

None. One near-miss worth recording: my first draft of the test failed Prettier (`pnpm exec prettier
--check`), which the pre-commit hook would have blocked; formatted and re-ran the full g2 chain
before committing rather than discovering it inside the hook.

## Verification (plan `<verification>` block, re-run)

- Unit test green (9/9); `pnpm type-check` clean; g3 key-set equality + the 7 keys green. ✅
- C9b resolution recorded: option (b) — `DelegationManagementPage` is the extraction source **and** a
  named non-consumer; the shipped Phase 92 spec keeps asserting its unchanged inline DOM; the file is
  byte-identical to `phase-93-base`. ✅
- `git tag -v phase-93-base` exits 0. ✅
- Additional (not required by the plan, run because they gate the same commits): ESLint
  `--max-warnings 0` over `frontend/src/components/error-states/**` → exit 0; `node
scripts/check-i18n-namespaces.mjs` → `OK: 1711 file(s) scanned, 801 static namespace literal(s)
checked against 128 registered namespaces`; Prettier `--check` on all four files → clean.
- Visual conformance to the UI-SPEC spacing/type/color tables is deferred to the phase-end human
  render pass, as the plan states. This plan proved structure and contract, **not pixels** — nobody
  has looked at this component rendered.

## Known Stubs

None. The component has no hardcoded empty values and no placeholder copy. It has **zero consumers**
by design — wiring it into surfaces is wave 2/3's work (93-06, 93-08..93-14), which is why the unit
test exists as the positive control instead.

## Threat Flags

None beyond the plan's register. T-93-01 (information disclosure at the query-rejection → DOM
boundary) is mitigated as planned: the component renders i18n keys only, the bilingual envelope is
the sole structured exception, and `message` / `details` / `code` never reach JSX. Enforced by the
gate's zero-two-argument-`t()` assertion and by the test
`renders the bilingual envelope when given one, and never a raw error field`. T-93-SC holds: **zero
package installs** this plan — `package.json` is untouched.

## User Setup Required

None — no external service configuration.

## Next Phase Readiness

Wave 2/3 plans can consume `QueryErrorState` and `common:errors.*` without codebase exploration:

- import: `import { QueryErrorState } from '@/components/error-states/QueryErrorState'`
- page: `<QueryErrorState onRetry={() => void refetch()} isRetrying={isRefetching} />`
- inline: `<QueryErrorState variant="inline" onRetry={() => void refetch()} isRetrying={isRefetching} />`
- testids: `query-error-state` / `query-error-inline` (override via `testId` if a surface needs a
  distinct selector — but every 93-\* gate greps the defaults, so don't).

Two things a consumer must NOT do: pass a raw `error` object (only the `{ message_en, message_ar }`
envelope is renderable), and retrofit `DelegationManagementPage` (C9b named non-consumer until the
phase that also updates `tests/e2e/92-delegations-error.spec.ts` in the same task).

## BLOCKED

None.

## Self-Check: PASSED

- `frontend/src/components/error-states/QueryErrorState.tsx` — FOUND
- `frontend/src/components/error-states/__tests__/QueryErrorState.test.tsx` — FOUND
- commit `8080945d` — FOUND (`git show --stat 8080945d`, 2 files, 240 insertions)
- commit `416491aa` — FOUND (`git show --stat 416491aa`, 2 files, 24 insertions / 2 deletions)
- all three gates re-run at close: g1 `EXIT=0`, g2 `EXIT=0`, g3 `EXIT=0`

---

_Phase: 93-failure-visibility_
_Completed: 2026-08-15_
