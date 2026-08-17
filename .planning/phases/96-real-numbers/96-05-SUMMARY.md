---
phase: 96-real-numbers
plan: 05
subsystem: ui
tags: [react, playwright, cdp, i18n, supabase-functions, design-tokens]

# Dependency graph
requires:
  - phase: 96-real-numbers
    plan: 04
    provides: the /calendar grid, the /calendar/new mount, and the /events offset + nav this spec asserts
  - phase: 95-routes-that-don-t-render
    provides: tests/e2e/95-sandbox-error.spec.ts — the four load-bearing spec pieces cloned here
provides:
  - /word-assistant's connection pill is three-state and settles ONLY from a live probe
  - wordAssistant.checking exists in both locale common.json files
  - tests/e2e/96-calendar-family.spec.ts — the 4-test behavioural oracle for all four DEAD-07 surfaces
affects: [96-09, 97-navigation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Three-state status pill: a union state initialised to the unknown value, settled only by a request result; chrome selected from a module-scope Record keyed by that state'
    - 'A "never shows X" claim is sampled over time from the DOM, not read once — the structural half lives in the component, the behavioural half in the spec'

key-files:
  created:
    - tests/e2e/96-calendar-family.spec.ts
  modified:
    - frontend/src/pages/word-assistant/WordAssistantPage.tsx
    - frontend/src/i18n/en/common.json
    - frontend/src/i18n/ar/common.json

key-decisions:
  - 'The probe runs on mount REGARDLESS of assistantMode — the mode still picks the composer backend, it no longer fabricates connection status'
  - 'The send mutation no longer touches the badge: in fallback mode onSuccess fires from a locally generated string, so leaving it wired would let a non-network event render connected'
  - 'A data-testid was added to the pill so the oracle reads state without pixel diffing; chrome is otherwise unchanged per UI-SPEC'
  - 'The mis-scoped commit bb9559bfa was NOT repaired by rewriting shared history — the repair attempt itself briefly unwound a concurrent lane commit; recorded instead'

patterns-established:
  - 'On a shared branch under concurrent lanes, `git commit` takes a pathspec too — `git add <paths>` alone commits the whole index'

requirements-completed: [DEAD-07]

# Metrics
duration: 55min
completed: 2026-08-17
---

# Phase 96 Plan 05: DEAD-07 part 2 (word-assistant live badge + calendar-family spec) Summary

**The `/word-assistant` pill stops asserting a connection nothing measured — it initialises to
checking and settles only from a live probe — and one 4-test spec makes all four DEAD-07
surfaces behaviourally observable.**

## Performance

- **Duration:** ~55 min
- **Tasks:** 2 of 2
- **Files modified:** 4 (1 created)

## Accomplishments

- The badge's two lies are gone. It initialised `useState(true)` — connected before any
  response existed — and in the **default** `fallback` composer mode (`VITE_WORD_ASSISTANT_MODE`
  is set in no env file) the mount probe was skipped outright and connected forced. Neither
  state had ever seen a byte from the network.
- The pill is now `'checking' | 'connected' | 'disconnected'`, initialised to `checking`, and
  moves **only** when the probe settles.
- `wordAssistant.checking` landed in both locale files in the same commit.
- The DEAD-07 family has one deterministic oracle: 4 tests, all green, covering the grid, the
  create-form mount, the weekday offset + nav, and the badge.

## Task Commits

1. **Task 1: three-state pill settled from the live probe; key in both locales** — `bb9559bfa` (fix)
2. **Task 2: the DEAD-07 family oracle** — `70ad8cf5` (test)

## Probe-settle behaviour AS IMPLEMENTED (plan `<output>` duty 1)

The mount effect (`WordAssistantPage.tsx`) is the **only** writer of the pill state:

```ts
const [connectionState, setConnectionState] = useState<ConnectionState>('checking')
// …
useEffect(() => {
  let isMounted = true
  const checkConnection = async (): Promise<void> => {
    try {
      const { error } = await supabase.functions.invoke<WordAssistantResponse>('word-assistant', {
        body: { action: 'check_grammar', text: 'health check' },
      })
      if (isMounted) setConnectionState(error ? 'disconnected' : 'connected')
    } catch (err) {
      console.warn('Word assistant connectivity check failed:', err)
      if (isMounted) setConnectionState('disconnected')
    }
  }
  void checkConnection()
  return () => {
    isMounted = false
  }
}, [])
```

Four properties, each deliberate:

1. **The probe is unconditional.** The `assistantMode !== 'supabase'` early-return that forced
   connected is deleted. `assistantMode` still governs the composer's backend (`mutationFn`,
   unchanged) — it no longer speaks for the connection.
2. **`connected` is reachable only through a 2xx.** `supabase-js` populates `error` for any
   non-2xx or transport failure, so the sole path to `connected` is an invoke that returned
   without error. A thrown error settles `disconnected`.
3. **The send mutation no longer touches the badge.** `onSuccess`'s `setIsConnected(true)` and
   `onError`'s `setIsConnected(false)` are removed, per the plan's "the badge state changes ONLY
   from the probe settle". This is not cosmetic: in the default fallback mode `onSuccess` fires
   from `generateLocalAssistantResponse` — a string built in the browser — so leaving it wired
   would have let a **local function call** paint the pill connected.
4. **The dep array is `[]`**, not `[assistantMode]`: the probe no longer reads that value.

Chrome comes from a module-scope `CONNECTION_PILL` record, verbatim from 96-UI-SPEC §3 —
`bg-surface-raised text-ink-mute` / `bg-ink-faint` for checking, the shipped `bg-success/10` and
`bg-danger/10` pairs untouched. All four utilities are `@theme`-mapped in `src/index.css`
(`--color-surface-raised:47`, `--color-ink-mute:51`, `--color-ink-faint:52`, `--color-success:71`,
`--color-danger:69`) — no raw hex, no palette literal. `data-testid="word-assistant-connection"`
was added so the oracle can read the state from the DOM; it changes no pixel.

### Behavioural proof of the settle, both directions (throwaway probe, deleted after use)

Run against the shared `:5173` dev server with inline auth, sampling the pill's label every 25 ms
from `waitUntil: 'commit'`:

<!-- prettier-ignore -->
| Arm | Observed label sequence | `functions/v1/word-assistant` responses | `requestfailed` |
| --- | --- | --- | --- |
| probe CDP-blocked | `Checking connection → Disconnected` | `[]` | `["inspector","inspector"]` |
| probe unblocked | `Checking connection → Connected` | `[200, 200]` | `[]` |

Both arms render **checking first**. `Connected` appears in exactly one arm — the one with two
live 200s behind it. That is the must-have truth measured, not argued. (Two requests per arm is
React StrictMode double-mounting the effect in dev; both settle identically.)

## AR glossary alignment for the new key (plan `<output>` duty 2)

`wordAssistant.checking` = **`جارٍ التحقق من الاتصال`** — the 96-UI-SPEC §i18n suggested rendering
(line 411), adopted verbatim after checking it against the neighbours it now sits beside:

- **Register matches the sibling keys.** `connected` is `متصل` and `disconnected` is `غير متصل` —
  bare state adjectives. The new key is an in-progress state, so it takes the standard Arabic
  progressive construction `جارٍ + verbal noun` (`جارٍ التحقق` = "verification is under way"),
  which is what the rest of the app uses for transient states rather than a bare adjective.
- **`الاتصال` is the same noun** the sibling pair is built from (`متصل` / `غير متصل`), so the three
  labels read as one family rather than three vocabularies.
- **House voice holds:** no marketing voice, no exclamation, no emoji, sentence-equivalent
  casing (not applicable in Arabic script), and the hamza-on-ya `جارٍ` is the correct fully
  vowelled form rather than the common bare `جاري`.
- EN is `Checking connection` — sentence case, no ellipsis (the shipped `inputPlaceholder` uses
  `…` for an input hint; a status label is not a hint).

Both keys landed inside the existing `wordAssistant` object in `src/i18n/{en,ar}/common.json`, in
**one commit** (`bb9559bfa`), so no locale skew ever existed in history. The namespace is already
registered, and addressing is bare `t('wordAssistant.checking')` — a nested lookup in the default
bundle, not cross-namespace dot-form, so the colon-form rule does not apply here.

## All four test colours (plan `<output>` duty 3)

`tests/e2e/96-calendar-family.spec.ts`, `--project=chromium-en --no-deps`, against the shared
`:5173` dev server. Spec existence asserted first; the count is hardcoded at 4, never list-derived.

<!-- prettier-ignore -->
| # | Test | Colour | What it actually observed |
| --- | --- | --- | --- |
| 1 | `/calendar` renders the month grid whether or not the month holds events | **GREEN** | `cal-grid` visible, 7 `cal-dow`, cell count ≥28 and `% 7 == 0`, zero `.cal-cell-skeleton` / `.cal-row-skeleton` past the budget, no internal string. August 2026 holds zero `calendar_entries` rows — the exact condition that used to render the wizard. |
| 2 | `/calendar/new` mounts the create form, not its parent page | **GREEN** | Exactly 1 visible `<form>`, **zero** `cal-grid` (the parent page's signature — a parent-only render would show the inverse), and ≥1 `textbox` carrying a non-empty accessible name. |
| 3 | `/events` pads by the real weekday offset and its month navigation works | **GREEN** | Heading read from the DOM, offset computed in-test via `getDay(startOfMonth(parse(heading,'MMMM yyyy',…)))`; first date cell's child-index `% 7` equals it and its text starts `1`. `Next` changed the heading, `Previous` returned it. |
| 4 | `/word-assistant` badge never claims connected without a live 2xx probe | **GREEN** | Label sequence sampled over the budget: settled `Disconnected`, `Connected` never observed, every observed label ∈ {checking, disconnected}; ≥1 `requestfailed` on `/functions/v1/word-assistant` matching `/inspector\|blocked/i`. |

**4 passed (5.0s)**, re-confirmed **4 passed (5.2s)** on the final verbatim run at HEAD.

Three design choices in the spec worth naming, because each is a place a weaker oracle would
have passed vacuously:

- **The block pattern is `*/functions/v1/word-assistant*`, never `*word-assistant*`.** The page's
  own dev-server module URL is `/src/pages/word-assistant/WordAssistantPage.tsx`; the broad
  pattern blanks the surface, and a spec that "passed" against a blank page would be measuring
  its own block. The `requestfailed` collector is the instrument test that the narrow pattern
  still fires.
- **No test asserts how much data exists.** Zero events in a month is a truthful outcome; test 1
  asserts grid _shape_ invariants (`≥28`, `% 7 == 0`) and never an event count, so a data change
  cannot red a correct implementation. Emptiness is never read as an error.
- **Test 3 computes its own expectation.** The offset is derived in-test from the rendered
  heading rather than hardcoded to August 2026's answer (6), so the oracle stays correct in every
  future month.

## C9b — consumers of the badge

Not the authoritative sweep: `scripts/c9b-sweep.sh` under 96-09 owns the re-derivation, exactly as
this plan's `<interfaces>` directs. What a scoped grep found, recorded so the handoff is not
silence — four pre-existing files mention `word-assistant`, and **none asserts the badge DOM**:

- `tests/contract/word-assistant.test.ts` — asserts the Express `/api/v1/word-assistant/generate`
  contract. Different surface entirely.
- `tests/unit/services/WordAssistantService.test.ts` — zero hits for `connected` / `isConnected` /
  `WordAssistantPage`.
- `tests/performance/api.test.ts` — POSTs `/api/word-assistant/generate`. Same non-overlap.
- `tests/a11y/accessibility.test.ts:153-157` — navigates to `/word-assistant` and runs an axe
  scan, so it is the one file that _would_ see the pill. It imports `@playwright/test` but carries
  a `.test.ts` extension under `tests/a11y/`, which the root Playwright config
  (`testDir: './tests/e2e'`) does not scan and Vitest cannot supply a `page` fixture for. Recorded
  as observed; the verdict is 96-09's.

Instrument test for that sweep: the same grep invocation finds `scenario-sandbox` in
`tests/e2e/95-sandbox-error.spec.ts` and `frontend/tests/scenario-sandbox-verification.spec.ts`, so
its zeros are not blindness.

## Gate records (red → green, both observed)

Both gate texts run **verbatim**, byte-identical to plan-accept HEAD `b4072302a`, from the repo root.

### Gate 1 — Task 1

`node -e "…wordAssistant.checking in both locales…" && command grep -q "checking" …/WordAssistantPage.tsx && test "$(command grep -c 'useState(true)' …/WordAssistantPage.tsx)" -eq 0 && cd frontend && pnpm type-check`

- **RED observed:** exit **1** on the undone tree — the `node -e` key check failed first
  (`wordAssistant.checking` absent; the key is this task's product), short-circuiting before
  `cd frontend`, so cwd was unchanged (verified in the same shell).
- **GREEN observed:** exit **0**.
- **Instrument tests:** on the undone tree `command grep -c 'checkConnection' …` = **2** (the grep
  can read the file, so the `checking` = 0 was real absence, not a blind instrument) and
  `command grep -c 'useState(true)' …` = **1** (the `-eq 0` half is not vacuous — it had something
  to count down from).
- **The `pnpm type-check` half was labelled UNPROVEN pre-execution; it was drilled at execution**
  and is recorded below, including its one red.

### Gate 2 — Task 2

`test -f tests/e2e/96-calendar-family.spec.ts && test "$(pnpm exec playwright test … --no-deps --list 2>/dev/null | command grep -c '›')" -eq 4 && pnpm exec playwright test … --no-deps`

- **RED observed:** exit **1** with the spec moved aside to `/tmp` (`test -f` fails — the spec is
  this task's product), then restored and existence re-verified.
- **GREEN observed:** exit **0**, `4 passed`. Both halves were labelled UNPROVEN pre-execution;
  both were drilled at execution.
- **Instrument test:** the `'›'` counter returns **2** against the 2-test
  `95-sandbox-error.spec.ts`, so the `-eq 4` is counting real listed tests, not matching nothing.

### The shared-tree `pnpm type-check` half redded once, and it was not this plan

96-04 recorded this hazard; it recurred. Gate 1's first green attempt returned **exit 2** on two
errors, both in `src/pages/my-work/MyWorkDashboard.tsx` (`'counts' is declared but its value is
never read`; `Type 'UnifiedWorkItem[]' is missing … all, commitments, tasks, intake`) — the COUNT-01
lane's in-flight uncommitted reshape of `hooks/useUnifiedWork.ts`, confirmed by `git status`.

Attribution was measured, not assumed: filtering that log for this plan's files
(`word-assistant|WordAssistantPage|i18n/(en|ar)/common`) returned **zero matches**, and the filter
was instrument-tested against the same log (`MyWorkDashboard` = **2** hits), so the zero is
absence, not a broken grep. `pnpm eslint` on `WordAssistantPage.tsx` was **exit 0** in the same
window, with the linter control-tested to exit **2** on a nonexistent path. The gate was re-run
verbatim once that lane settled: **exit 0**, twice.

## Must-have truths — where each is proven

<!-- prettier-ignore -->
| Truth | Proof |
| --- | --- |
| The badge renders a checking state before the probe settles and NEVER shows connected without a 2xx probe | Both probe arms above observed `Checking connection` first; `Connected` appeared only behind `[200,200]`. Structurally: `useState<ConnectionState>('checking')` and a single writer that reads the invoke result. |
| With the probe URL CDP-blocked, the badge settles to disconnected | Test 4 (GREEN) + the blocked probe arm: `Checking connection → Disconnected`, zero responses, two `inspector` request failures. |
| `wordAssistant.checking` exists in BOTH locale common.json files in the same commit | Gate 1's `node -e` parses both files and requires the key in both — exit 0. Both edits are in `bb9559bfa`; `git show bb9559bfa --stat` lists `i18n/ar/common.json` and `i18n/en/common.json`. |
| The four DEAD-07 surfaces have one behavioural spec | `tests/e2e/96-calendar-family.spec.ts`, 4 hardcoded tests, all green — table above. |

## Decisions Made

- **`assistantMode` keeps its composer job and loses its badge job.** Deleting the mode branch
  from the probe (rather than, say, probing only in supabase mode) is what makes the badge true
  in the mode the app actually ships in — `VITE_WORD_ASSISTANT_MODE` is set in no env file, so
  `fallback` is the live path and was precisely the one that never probed.
- **The send mutation is disconnected from the pill**, per the plan's "ONLY from the probe
  settle". The cost is real and accepted: a send that fails in supabase mode no longer flips the
  badge until the next mount. The benefit is that a fallback-mode send — a pure local string —
  can no longer paint it connected, which is the same confident-lie class the plan exists to kill.
- **The pill got a `data-testid`, not a `data-state`.** One attribute is enough for the oracle to
  read the state via its label; a second would be a parallel truth to keep in sync.
- **The mis-scoped commit was recorded, not rewritten.** See Deviations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 10 — trivial, records] `data-testid` added to the pill, not named in the plan**

- **Found during:** Task 2, writing the badge oracle.
- **Issue:** the plan requires DOM-only assertions on the badge, and the shipped pill carried no
  stable hook — only Tailwind class strings, which are chrome and would couple the oracle to
  styling.
- **Fix:** `data-testid="word-assistant-connection"` on the existing pill `<div>`. UI-SPEC
  prescribes the same device for the COUNT-04 badge ("carries a stable `data-testid` … so the
  count is DOM-derivable without pixel diffing"). Invisible; no chrome changed.
- **Verification:** gate 1 (type-check) and gate 2 (4 passed) both green.
- **Committed in:** `bb9559bfa`

### Recorded, NOT auto-fixed

**2. [Process] Commit `bb9559bfa` swept in two files belonging to the concurrent analytics lane**

- **Found during:** post-commit `git show HEAD --stat` verification (the common brief's "never
  assume" step — this is exactly what caught it).
- **Issue:** I used an explicit pathspec on `git add` but then ran a bare `git commit`, which
  commits the **whole index**. The analytics lane already had two staged deletions
  (`frontend/src/components/analytics/AnalyticsPreviewOverlay.tsx`, `…/sample-data.ts`) sitting in
  the shared index, so they rode into my commit under my message: `5 files changed, 42 insertions,
740 deletions`.
- **Repair attempted, and abandoned:** `git reset --soft HEAD~1` to re-scope. Between my commit
  and that reset **another lane had committed** (`6bc619c7c`), so `HEAD~1` was _their_ commit, not
  mine — the reset unwound **their** work, not the sweep. Detected immediately from the printed
  log line and reversed with `git reset --soft 6bc619c7c` in the next command. `git reflog`
  records the complete round trip (`6bc619c7c → HEAD~1 → 6bc619c7c`); their commit and every
  lane's uncommitted work verified intact afterwards, and the two analytics files remain deleted
  in the worktree, which is the lane's own intent.
- **Why the sweep is NOT being repaired:** rewriting a shared branch under live concurrent lanes
  is what just cost a lane its commit for one command. The files' end state is correct (the lane
  wanted them deleted), nothing is lost, and the only defect is **attribution** — two deletions
  are recorded in a word-assistant commit. Fixing attribution is not worth a second history
  rewrite on a branch three lanes are writing to. Flagged for the record rather than decided
  silently.
- **Corrected practice, applied immediately:** Task 2 was committed with
  `git commit … -- tests/e2e/96-calendar-family.spec.ts`. Result: `1 file changed, 244
insertions` — nothing else rode.

---

**Total deviations:** 1 auto-fixed (a test hook the oracle needs), 1 recorded process defect with
its repair explicitly declined and reasoned.
**Impact on plan:** no gate text touched, no plan semantics changed, no migration applied (this
plan names none), no file outside `files_modified` edited.

## Issues Encountered

- **`git add <pathspec>` does not scope `git commit`.** On a branch with concurrent lanes the
  index is shared state; a bare `git commit` publishes whatever anyone else has staged. Both the
  defect and the near-miss during its repair trace to this one fact. `git commit -- <pathspec>` is
  the primitive that actually scopes.
- **The shared whole-workspace `tsc --noEmit` reds every gate in every plan** whenever any lane has
  an in-flight type error. A red must be attributed by file before it is charged to a plan, and
  the attribution filter must itself be instrument-tested against the same log.
- A throwaway probe script had to be run from inside the repo, not `/tmp`, or Node resolves
  `@playwright/test` against `/tmp` and fails. Written to `./.wa-probe.mjs`, run, deleted, absence
  verified — nothing was committed.

## User Setup Required

None.

## Next Phase Readiness

- **Criterion 3 is behaviourally observable end to end.** All four DEAD-07 surfaces have one
  deterministic green oracle; 96-04 produced the first three, this plan produced the fourth and
  the spec.
- **96-09** inherits the authoritative `c9b-sweep.sh` re-derivation for `/word-assistant`
  consumers; the scoped findings above are a handoff, not a verdict.
- **96-04's three parked items were untouched here by instruction** — adjacent-month contrast,
  the calendar-rtl digit assertions, and the calendar visual baselines. This plan ran none of
  `calendar-a11y`, `calendar-rtl`, or `calendar-visual` as its own oracle, and
  `96-calendar-family.spec.ts` asserts no digit script, no colour contrast, and captures no
  snapshot — so it does not overlap any of the three subjects under ruling.
- **P97** owns nav/reachability of these routes — untouched here, by D-02.

## BLOCKED

None.

---

_Phase: 96-real-numbers_
_Completed: 2026-08-17_

SUMMARY-END
