# Phase 98 — Pre-Execution Plan Check

**Checked:** 2026-08-18 · **Repo HEAD at check:** `87b2d040e` · **Seat:** gsd-plan-checker (respawn)

**Coverage of this check:** all nine plans opened and read in full
(`98-01`…`98-09-PLAN.md`), plus `98-CONTEXT.md` (D-01…D-30), `98-VALIDATION.md`,
`ROADMAP.md` §Phase 98 at HEAD, and `REQUIREMENTS.md:149-183`. `98-RESEARCH.md` and
`98-UI-SPEC.md` were consulted only where a plan cited them. Four populations were
re-derived on disk rather than read from the plans.

## ISSUES FOUND

### Criterion → oracle walk (all seven have a named oracle; three carry defects)

| C   | repairs                                                 | closer                                                                        | verdict                                        |
| --- | ------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | 98-05 (Part A/B + week header)                          | `98-copy01` rendered snake + ISO detector, in-page regex self-test, both legs | closes — except the `email` class (ADVISORY 6) |
| 2   | 98-04 (entityLinks, recurrence routing, regions casing) | `98-copy02` legs (a) console / (b) DOM / (c) census                           | **leg (a) vacuous — BLOCKING 3**; (b)+(c) hold |
| 3   | 98-06 T1                                                | `98-copy03` CDP-forced empty + error states, both legs                        | closes                                         |
| 4   | 98-06 T2/T3 + 98-08                                     | `98-copy04` `@values` / `@case`, both legs                                    | closes                                         |
| 5   | 98-02 (guard + helper) + 98-07 (routing)                | `98-copy05` + strict guard + built-bundle grep                                | **bundle oracle blind — BLOCKING 2**           |
| 6   | 98-04 T3                                                | `98-copy06` real mutation, both legs                                          | closes                                         |
| 7   | 98-03 T1 (atomic)                                       | `98-copy08` `lucide-crown` + `text-primary` + 4 sections                      | closes; D-27 honored                           |

---

### BLOCKING

**1. `98-04-PLAN.md:230` (gate) and `:232` (acceptance) — the hardcoded `16` makes the
recurrence gate unsatisfiable.**
Re-derived at HEAD in `frontend/src/components/calendar/RecurrencePatternEditor.tsx`:
**43** dot-form occurrences (41 `t('calendar.recurrence.` + 2 template-literal forms at
`:458` and `:525`), across **37** distinct key paths. Never 16.
The gate demands dot-form `== 0` **and** colon-form `== 16`; once every site flips, the
colon-form count is 43. The two clauses are jointly impossible — the gate can never go green.
Breaks **pre-commitment 1 / D-04** (populations RE-DERIVED, never re-quoted): the plan quotes
D-22's unverified `16` as fact and hardcodes it into an instrument.
_D-22's substance verifies_ — all 37 paths resolve in both `en` and `ar` `calendar.json`, so the
repair really is routing with no key authoring owed. Only the count is wrong.
**Fix:** derive the count at execution, hardcode the derived number, state the delta vs 16.

**2. `98-07-PLAN.md:185` (gate) and `:187` (acceptance) — the built-bundle oracle cannot see the
string it must ban.**
The plan inlines the dev label as `Fill with mock data` (`:176`, lowercase) but greps
`frontend/dist/assets` for `Fill with Mock Data` (`:185`) — the capitalised value being deleted
from `frontend/src/i18n/en/intake.json:86`. Post-deletion that string is trivially absent.
The plan's own stated fallback — "if Vite DCE fails to strip the inline literal (A2), the DEVHIT
clause catches it" (`:187`) — is false: the grep is looking for a different string.
Breaks **D-26** ("dev affordance absent from the BUILT bundle, oracle greps the BUILT bundle with
a positive control"): the oracle can pass green while a dev affordance ships in production.
**Fix:** grep the inlined literal (or add `-i`), keeping the `Changes saved` positive control.

**3. `98-01-PLAN.md:72-73` (interfaces), `:128` (leg a), `:32` (must_haves artifact
`contains: 'Missing translation key'`) — copy02's console-capture leg can never fire.**
`frontend/src/i18n/index.ts` sets `saveMissing: false`. i18next 25.10.10 invokes
`missingKeyHandler` only inside `if (this.options.saveMissing)` —
`frontend/node_modules/i18next/dist/cjs/i18next.js:691`, with `send()` defined at `:681`.
So the `Missing translation key: …` warn never fires, in either locale, no matter how many keys
are missing. The plan states the logger as verified interface fact; it is not.
No plan has `frontend/src/i18n/index.ts` in its file scope, so the leg cannot be made real as
currently scoped. The defect propagates from `98-VALIDATION.md:83`
("no missing-key console warn, both locales").
Breaks **D-06** (instrument-test every zero) and **D-07** (a leg that cannot fire is not a closer).
Criterion 2 still closes on legs (b) + (c), so this is narrow — but the vacuous leg must not be
counted as evidence.
**Fix:** drop leg (a), or bring `saveMissing: true` into scope with its own stated control.

---

### ADVISORY

**4. `98-01-PLAN.md:133` — "floor: 82 keys" for the static `entityLinks` census.**
The plan's own extraction instrument (`98-04-PLAN.md:169-178`) returns **80** static paths at
HEAD (83 refs total, 3 dynamic). A hardcoded 82 floor either false-reds or pressures the executor
to invent keys. `98-04` handles this correctly ("the DERIVED set governs and the delta is
stated"); `98-01` should adopt the same rule instead of re-quoting D-24's figure.

**5. `98-01-PLAN.md:254` — Task 3's gate does not machine-enforce RED.**
It asserts the file count is 8 and that no spec names `chromium-ar-smoke`. The actual RED-at-HEAD
evidence lands as SUMMARY prose. The dev-stack dependence is stated honestly and the action does
run all eight specs with `--reporter=json`, but "each proven RED at HEAD" rests on narrative
rather than on the gate.

**6. Criterion 1's named instance `email` has repair coverage but no rendered oracle.**
`98-copy01`'s detectors are `/\b[a-z]+(?:_[a-z]+)+\b/` and `/\b\d{4}-W\d{2}\b/`
(`98-01-PLAN.md:114-116`). An underscore-free single-token enum value such as `email` — or
`high`, `todo`, `done` — is invisible to both. `98-05` Part A repairs the class, but nothing
renders-closes it.
**Fix:** add one positive assertion to `98-copy01` (e.g. the routed source-type chip reads
`Human entered`; a work-item priority chip reads `Urgent`, never `urgent`).

**7. `98-04-PLAN.md:253` (T-98-09) — the stated mitigation basis is factually wrong.**
It claims "default escapeValue stays on". HEAD has `interpolation: { escapeValue: false }` in
`frontend/src/i18n/index.ts`. The action (touch no interpolation options) is correct and the new
keys are static labels with no user interpolation, so the risk is unchanged — but the threat row
asserts a protection that is not in place.

**8. `98-09-PLAN.md:154` — stale decision-coverage figure.**
Says the extractor tracks "19 at plan time". The orchestrator's on-disk run reports
`total: 30, covered: 30, uncovered: []`. The gate asserts `"uncovered": []` so it passes either
way; only the prose is stale.

**9. `98-06-PLAN.md:168` — Task 3's `<files>` understates its real scope.**
It names only `onboarding.json` (en/ar) while the action edits the whole derived
exclamation / first-person set (~17 files per the plan's own interfaces block at `:94-105`).
The frontmatter comment at `:20` covers it; the task-level file list does not.

**10. `98-07-PLAN.md:185` — burn-down emptiness check risks a false red.**
`grep -c "P98-BURNDOWN\|burn-down —" … -eq 0` collides with `98-02-PLAN.md:152`, which requires
the script to contain the token `burn-down`. If 98-02's script header prose uses "burn-down —"
anywhere outside an allowlist row, 98-07 goes red for the wrong reason.
**Fix:** pin the row marker to a distinct token (`P98-BURNDOWN`) and check only that.

---

### Verified clean — do not re-litigate

- **`entityLinks` → `common.json` is sound.** `frontend/src/i18n/index.ts:274-275` and `:410-411`
  register `translation: enCommon` **and** `common: enCommon`. Bare `useTranslation()` in all
  eight consumer files resolves the subtree with zero component edits — no unregistered-namespace
  no-op (the D-10 trap is avoided, not walked into).
- **98-06's 1/1 exclamation floor is correct, not a zero-trap.** The `password.addSpecial` charset
  carve-out carries `!` in **both** `en/validation.json` and `ar/validation.json`.
- **No landmine tokens in any plan.** Zero occurrences of `pnpm --filter frontend`,
  `pnpm typecheck`, a `timeout N` shell wrapper, or a `chromium-ar` project — every match found
  was a negative mention warning against it. All four referenced scripts exist
  (`check-date-formatting.mjs`, `i18n-mask-audit.mjs`, `gate-drill.mjs`, `decision-coverage.mjs`)
  and the date guard's fixture CLI arg is real (`scripts/check-date-formatting.mjs:47-48`).
- **`command grep` here is "BSD grep, GNU compatible" 2.6.0** — every `\|` BRE alternation in the
  gates works.
- **Playwright multi-path invocations are safe** — existence asserted first, counts hardcoded
  (`98-01-PLAN.md:171`, `:225`, `:237`).
- **No exogenous path** (`CLAUDE.md`, `AGENTS.md`, `tickmarkr.spec.md`, `.agents/skills/*`,
  `.claude/skills/*`, `_archive-98-attempt1-260818/`) appears in any plan's file scope.
- **Wave ordering is correct.** 98-08 at wave 5 has a real dependency — the `@case` capture must
  see the phase-final surfaces (98-04's authored labels, 98-06's re-cased CTA, 98-03's opened
  popover), so an earlier-authored Title Case label is caught rather than grandfathered. No
  wave-N oracle asserts something a later wave creates.
- **No same-wave file collision.** `DossierTypeStatsCard.tsx` / `dossier.json` are sole-owned by
  98-03 (both COPY-07 and COPY-08 in one plan, tasks sequenced); `common.json` is sole-owned by
  98-04; 98-06 is explicitly banned from `common.json`, `dossier.json`, `signals.json`,
  `engagements.json` (`98-06-PLAN.md:56-58`); 98-05's possible cross-cutting edits into
  common/dossier land in wave 3, after their wave-2 owners.
- **D-25's feed enumeration matches the graded list exactly** — EnhancedActivityFeed, Dashboard
  ActivityFeedItem, SharedRecentActivityCard, CommentItem, NotificationItem, RecentDossiers
  (`98-07-PLAN.md:8-13`, `:66-68`); `MMMM yyyy` month headers named OUT.
- **D-27 / D-28 / D-29 honored** — `98-03-PLAN.md:121-128` adds exactly two
  `case 'elected_official'` arms (Crown + country/primary with a WR-07 citation), the copy08 spec
  asserts `lucide-crown` and `text-primary` and bans `lucide-globe`; no new color family; no
  invented register row for the glyph.
- **D-20 respected in both directions** — 98-08 neither absorbs the ~4.5k tail (bounded to the
  oracle's captured set, COPY-09 → P102 pinned in the gate) nor narrows below the bound (the
  captured set is defined by running the oracle over phase-final surfaces, with per-label
  REPAIR/KEEP verdicts).

---

### Recommendation

**3 blockers require revision before execution.** All three fixes are small and local — one
derived count replacing a re-quoted one, one grep pattern, and one leg either deleted or
re-scoped. None requires re-planning the wave structure, task decomposition, or file ownership,
all of which check out.

PLAN-CHECK-END
