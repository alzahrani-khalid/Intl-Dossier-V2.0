---
phase: 43-rtl-a11y-responsive-sweep
plan: 18
status: partial
gap_closure: true
requirements: [QA-02]
completed: 2026-05-04
tasks_done: [Task 2]
tasks_deferred: [Task 1, Task 3, Task 4]
---

# 43-18 — Keyboard sweep Tab-order alignment (partial — Task 2 only)

## Goal

Close survivor Gap-6 from 43-HUMAN-UAT post-execution: qa-sweep-keyboard
reports 26 routes with `reached.size < visibleCount`. Two failure
classes (spec over-counts; production focus traps). Plan author chose
spec-first refinement before runtime diagnostic to shrink the failure
surface without papering over real bugs.

## What changed (Task 2)

Single file edit: `frontend/tests/e2e/qa-sweep-keyboard.spec.ts`.
Replaced the in-browser `offsetParent + rect` heuristic in
`evaluateAll` with `isTabbable(el)`:

```ts
const isTabbable = (el: HTMLElement): boolean => {
  let cur: HTMLElement | null = el
  while (cur && cur !== document.body) {
    if (cur.hasAttribute('inert')) return false
    if (cur.getAttribute('aria-hidden') === 'true') return false
    const cs = getComputedStyle(cur)
    if (cs.display === 'none' || cs.visibility === 'hidden') return false
    cur = cur.parentElement
  }
  if (el.tabIndex < 0) return false
  if (el.offsetParent === null) return false
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return false
  return true
}
```

Now `visibleCount` excludes elements that the browser would skip on Tab:

| Cluster                          | Predicate disqualifier                 | Outcome                                  |
| -------------------------------- | -------------------------------------- | ---------------------------------------- |
| A: `tabindex="-1"`               | `el.tabIndex < 0`                      | excluded                                 |
| B: `inert` ancestor              | ancestor walk hit `inert`              | excluded                                 |
| C: `aria-hidden` ancestor        | ancestor walk hit `aria-hidden="true"` | excluded                                 |
| D: `display:none` ancestor       | ancestor walk hit display:none         | excluded                                 |
| D': `visibility:hidden` ancestor | ancestor walk hit visibility:hidden    | excluded                                 |
| E: zero-size rect                | self rect width/height = 0             | excluded                                 |
| F (Radix/HeroUI dynamic focus)   | element re-counted at moment of count  | mostly excluded if currently tabIndex=-1 |
| G (real production bug)          | not excluded — surfaces at assertion   | **still fails**                          |

Selector unchanged (still `button, a, input, [role="button"],
[tabindex]:not([tabindex="-1"])`); only the candidate-classification
augmented. No production code modified.

## What this leaves open (Task 1, 3, 4 deferred)

- **Task 1 — Research**: still requires runtime env (VITE_SUPABASE_URL +
  test creds) to capture per-route unreached payloads. Without this,
  cluster-G (real production bugs where an element SHOULD be tabbable
  but is excluded) cannot be diagnosed.
- **Task 3 — Production fixes**: depends on Task 1 cluster-G data. No
  per-call-site fix made in this run.
- **Task 4 — Re-run + final SUMMARY**: blocked on Task 1 + 3.

## Expected effect (blind)

If most of the 26 unreached cases are cluster-A/B/C/D/E (spec
over-count), 43-18 Task 2 alone closes a large fraction.

If many are cluster-G (real production bugs), 43-18 Task 2 reduces the
26 only to whatever cluster-G count remains — those need Task 1
research + Task 3 fix.

Real fail count after this commit unknown until CI re-runs the sweep.

## Verification

- Static gate: file edited, commits clean. Pre-existing 1580 strict-tsc
  errors in repo are out-of-scope per CLAUDE.md "Phase 2 deferred"
  guidance. Edit is TS-clean by inspection (`isTabbable` types resolve
  via `HTMLElement`, `tabIndex` is a numeric property).
- Runtime gate: deferred to Task 4 (requires env).

## Files modified

| Path                                           | Change                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `frontend/tests/e2e/qa-sweep-keyboard.spec.ts` | +25 / -8: `isTabbable` predicate replaces the prior `offsetParent + rect` candidate filter |

## Self-Check

- [x] Single file edit — only `qa-sweep-keyboard.spec.ts` modified.
- [x] No production code touched.
- [x] Selector unchanged.
- [x] `<main>` self-skip preserved (43-11 invariant).
- [x] Pre-focus + Tab-walk loop bodies untouched — only the candidate set was refined.
- [ ] **Task 1 (research)** — DEFERRED, requires runtime env.
- [ ] **Task 3 (production cluster-G fixes)** — DEFERRED, requires Task 1.
- [ ] **Task 4 (final pass count)** — DEFERRED, requires Task 1 + 3.

## Next steps

```
# 1. set runtime env
cp frontend/.env.test.example frontend/.env.test
# fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD

# 2. run diagnostic (Task 1 of 43-18)
pnpm -C frontend exec playwright test qa-sweep-keyboard.spec.ts --reporter=list 2>&1 | tee /tmp/43-18-keyboard.log

# 3. parse [unreached] entries → 43-18-RESEARCH.md → cluster-G fixes (Task 3)
```
