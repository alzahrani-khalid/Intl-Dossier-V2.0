# Phase 97 — Reachability: INDEPENDENT VERIFICATION

**Verifier:** independent seat, attempt 2
**Verified:** 2026-08-17
**Tree:** `HEAD = b358114fa39dad177f2dcbd566eea881338353e8`, base tag `phase-97-base` (`d561738fa`)
**Verdict:** **3 of 4 criteria met; criterion 4 MET-AS-ENUMERATED but NOT MET AS WRITTEN. Criterion 3 half-behavioural.**

---

## 0 — Reservation assertion

This path — `.planning/phases/97-reachability/97-VERIFICATION-INDEPENDENT.md` — was **reserved and
unclaimed** when I began. I confirmed it by command before writing a byte:

```
$ ls .planning/phases/97-reachability/*VERIFICATION*
(eval):1: no matches found: .planning/phases/97-reachability/*VERIFICATION*
exit=1
```

Attempt 1 (a different model family, chosen deliberately so the independent seat would not share
ancestry with the producing seats) died on a quota limit having written nothing. **I am the first
writer of this file.** Nothing in it is carried over from a prior draft.

**Method.** Every number below came from a command I ran in this session and pasted. Where I could
not run the command, I say so in §7 rather than inheriting the claim. The twelve SUMMARYs, the
closing derivation and the orchestrator's report were read as **claims to test**, never as evidence.

---

## 1 — Criterion 1: all 8 dossier types, EO included, on four surfaces

> _All 8 declared dossier types — Elected Officials included — appear in the sidebar, the dossier
> hub type cards, `/dossiers/create` and `/compare`._

**Verdict: MET — BEHAVIOURALLY PROVEN at role ADMIN, viewport 1400 only.**

### Structural

One literal list, one derived card set, exactly as promised
(`frontend/src/lib/dossier-type-guards.ts`): `DOSSIER_TYPES` is the DB-7,
`DOSSIER_CARD_TYPES = [...DOSSIER_TYPES, 'elected_official']` is the CARD-8. Consumers derive from
it at `CreateDossierHub.tsx:82`, `DossierListPage.tsx:583/599/623`, `compare.tsx:12`,
`EntityComparisonSelector.tsx:82`, `_protected.tsx:10` and `dossier-routes.ts:20`.

**I proved the anti-merge guard in BOTH directions myself** — the phase's central compile-time
claim, and the one most likely to be a comment pretending to be enforcement:

```
$ cd frontend && pnpm exec tsc --noEmit -p tsconfig.json
TSC_EXIT=0        # 0 lines of output

# then I injected 'elected_official' into DOSSIER_TYPES and re-ran:
TSC_EXIT=2
src/lib/dossier-type-guards.ts(95,43): error TS2344: Type '"elected_official"' does not satisfy the constraint 'never'.
```

The guard is real. I restored the file (`git status` clean).

The sidebar carries all 8 kinds, though not all in one group — 7 sit in the Dossiers group
(`navigation-config.ts:133–169`, EO added at `:151`) and `engagement` is linked as `/engagements`
in the Work group at `:84`. Every target route exists in `routeTree.gen.ts`. Labels
`navigation.electedOfficials` are present in **both** locales (`en/common.json:147`,
`ar/common.json:147`).

### Behavioural — my own run

```
$ pnpm exec playwright test tests/e2e/97-elected-officials-reachable.spec.ts \
    --project=chromium-en --no-deps --workers=1 --reporter=list
  ✓ 1 sidebar row (3.1s)
  ✓ 2 hub type card (4.2s)
  ✓ 3 hub type card click destination (3.7s)
  ✓ 4 compare selector (2.9s)
  ✓ 5 create hub + create submit (10.1s)
  5 passed (24.5s)
```

All four surfaces observed, plus a create submit. **Scope of that green:** role **admin**
(see §6.2 — the test titles say "ordinary authenticated user" and are wrong), viewport **1400 only**.
No non-admin and no narrow-viewport observation exists for this criterion.

---

## 2 — Criterion 2: every `/settings/*` page renders navigation

> _Every `/settings/_` page renders navigation (the prefix check and the exact-match check agree).\*

**Verdict: MET — BEHAVIOURALLY PROVEN at role ADMIN, at BOTH viewports 1400 and 390.**

### Structural

One authored predicate, `frontend/src/lib/settings-route.ts`, exporting `isSettingsPath` (prefix)
and `isSettingsPathExact` (exact) side by side. I swept for survivors of the old inline forms:

```
$ grep -rn "startsWith('/settings')\|=== '/settings'" frontend/src --include='*.ts' --include='*.tsx'
frontend/src/lib/settings-route.ts:23   (prose)
frontend/src/lib/settings-route.ts:31   (the definition)
frontend/src/lib/settings-route.ts:46   (the definition)
frontend/src/lib/__tests__/settings-route.test.ts:6  (prose)
```

**Zero residual raw predicates.** Not a second synced copy — one definition, three importers
(`AppShell.tsx:91`, `settings.tsx:18`, `SettingsNavigation.tsx:7`).

`routes/_protected/settings.tsx` now mounts `<SettingsNavigation/>` unconditionally for the whole
subtree; only the _content_ branches on `isIndex`. That is the actual gap-closer.

**A suspicion I raised and then refuted.** The layout sets `gridTemplateColumns: '240px 1fr'` as an
**inline style**, which a media query cannot normally override — at 390px the nav column would eat
240 of 390. It is handled: `index.css:926` uses `grid-template-columns: 1fr !important`.

### Population — my own derivation

```
$ grep -oE "'/settings/[a-z/-]*'" frontend/src/routeTree.gen.ts | sort -u
'/settings/calendar-sync'  '/settings/calendar/callback'  '/settings/email-digest'
'/settings/integrations'   '/settings/notifications'      '/settings/webhooks'
count: 6
```

Exactly **6**, matching the spec's `SETTINGS_CHILDREN` and its module-load guard. Population correct.

### Behavioural — three of my own runs, and a discriminating command

Run 1, full spec, default parallelism: **9 passed / 7 failed** — every failure in the mobile-390
block, every one dying at `signInInline` (`:99`, received `http://localhost:5173/login`) _before
reaching its subject_.

That shape invites the conclusion "login is broken at 390px". **It is not.** I ran the
discriminating commands:

```
run 2  --grep "@mobile"              →  1 passed,  7 failed   (the passer: calendar-sync)
run 3  --grep "@mobile" --workers=1  →  7 passed,  1 failed   (the failer: calendar-sync)
```

**The identity of the surviving test moves between runs, and inverts under serialization.** That is
a concurrency signature, not a viewport defect. Union across my three runs: **8/8 desktop and 8/8
mobile observed green** — though never all sixteen in a single run.

This both confirms and sharpens `ORACLECAP-01`. The phase's evidence was "a single fresh run passed
in 3.1s"; mine is "serializing drops the failure rate from 7/8 to 1/8 and moves which test fails".

---

## 3 — Criterion 3: Digests tab + a create affordance on every list page

> _The engagement Digests tab appears in the tab bar, and every list page exposes a create affordance._

**Verdict: SPLIT. Create affordance MET (7 of 8 behavioural + control). Digests tab STRUCTURAL ONLY —
I could not observe it, and my run reproduces the blocker.**

### Create affordances — structural then behavioural

All 8 list pages pass an `actions=` slot into `ListPageShell` (which gained the slot at
`ListPageShell.tsx:31/58`), each linking to a create route. I verified **every target route exists**:

```
countries ROUTE EXISTS · organizations ROUTE EXISTS · forums ROUTE EXISTS · working_groups ROUTE EXISTS
topics ROUTE EXISTS · persons ROUTE EXISTS · engagements ROUTE EXISTS · elected-officials ROUTE EXISTS
```

No dead links. My run:

```
$ pnpm exec playwright test tests/e2e/97-list-create-affordances.spec.ts --project=chromium-en --no-deps --workers=1
  ✓ countries  ✓ organizations  ✓ persons  ✓ forums  ✓ topics  ✓ working_groups
  ✓ elected-officials  ✘ engagements  ✓ elected-officials is the shipped control
  1 failed, 8 passed (52.2s)
```

**7 of 8 proven, stated as 7 of 8** — the register says exactly this, and it reproduces.

### Digests tab — I could not observe it

The tab is correctly added (`WorkspaceTabNav.tsx:31`, between Signals and Tasks, both locales) and
`/engagements/$engagementId/digests` is a real route. But:

```
$ pnpm exec playwright test tests/e2e/97-digests-tab.spec.ts --project=chromium-en --no-deps --workers=1
  ✘ 1 Digests tab follows Signals and mounts DigestsTab (18.0s)
  ✘ 2 exactly one tab is selected on the digests route (16.9s)
  Error: DATA-PRECONDITION UNMET for engagements: /engagements settled with zero rows — the list
  rendered its shared query-error state ("Unable to load data"), so the READ PATH failed — NOT an
  empty fixture. No engagement workspace can be opened, so the Digests tab claim is UNABLE TO
  MEASURE. This is never a pass.
  2 failed
```

`ENGREAD-01` reproduces exactly. **Credit where due:** the oracle refuses to green on an unmet
precondition rather than reporting a hollow pass — that is the correct construction.

**ENGREAD-01 is not a Phase 97 regression.** The phase's only edit to `EngagementsListPage.tsx` is
purely additive (the `actions=` block, +12 lines); it cannot have broken a read path.

**Net:** the Digests half of criterion 3 rests on source inspection and a supplementary probe. No
click-through was observed by me at any role or viewport.

---

## 4 — Criterion 4: every route with no inbound link is resolved

> _Every route with no inbound link is resolved — the admin routes and `/monitoring` each get a nav
> entry or are deleted, decision recorded per route._

**Verdict: MET FOR THE ENUMERATED SUBSET (and proven well). NOT MET AS WRITTEN — this is my
principal finding.**

### The enumerated subset — verified, and good work

My own population derivation agrees with theirs:

```
$ grep -oE "path: '/admin/[a-z0-9$_/-]*'" frontend/src/routeTree.gen.ts | sort -u | wc -l
8
```

Eight admin paths + `/monitoring` = the nine rows in `97-NAV04-DECISIONS.md`. The register's "9
admin routes" is off by one and the document **states the delta rather than absorbing it** — the
correct handling.

All nine rows verified against HEAD: 4 `ALREADY-REACHABLE` (rows confirmed live in
`navigation-config.ts`), 3 `NAV ENTRY` (added — `/admin/ai-usage`, `/admin/approvals`,
`/monitoring`), 1 `OWNED-ELSEWHERE-UNTOUCHED` (`/admin/preview-layouts` → Phase 102, and I confirmed
`PREVIEW-HOLLOW-01` **is** filed at `REQUIREMENTS.md:543` and owned at `:727`, so the NAV-04 row's
"UNFILED at close" note is now stale-but-safe), 1 redirect-only index.

Behavioural, my own run:

```
$ pnpm exec playwright test tests/e2e/97-nav04-rows.spec.ts --project=chromium-en --no-deps --workers=1
  ✓ /admin/ai-usage row — adminOnly user, desktop 1400 (3.8s)
  ✓ /admin/approvals row — adminOnly user, desktop 1400 (4.3s)
  ✓ /monitoring row — adminOnly user, desktop 1400 (3.0s)
  3 passed (11.7s)
```

**Zero routes deleted — verified, not relayed:**

```
$ git diff --stat phase-97-base..HEAD -- frontend/src/routeTree.gen.ts
(empty)
base: 593 route entries   HEAD: 593 route entries
```

**Two dead modules deleted, zero-importer proof re-run by me with a control:**

```
services/auth.ts        → file absent, 0 residual references
QuickNavigationMenu.tsx → file absent, 0 residual references
CONTROL store/authStore → 24 references   (instrument is not blind)
$ grep -rn "'auth-storage'" frontend/src --include='*.ts' --include='*.tsx'
frontend/src/store/authStore.ts:272:      name: 'auth-storage',
```

Exactly one persist key. The dual-store hazard `RULING-P92-06` filed is genuinely closed.

### Where it fails: the criterion's first clause was never tested

The criterion is universally quantified — _"every route with no inbound link"_ — and then gives an
enumeration. **The phase resolved the enumeration and treated it as the population.**
`97-POPULATIONS.md` §2 runs the instrument with
`--paths /admin/,...,/monitoring` — **nine paths**. The unrestricted sweep was never run.

I ran it:

```
$ node scripts/inbound-link-classify.mjs          # exit 0
reported: 186 path(s)
... zero-inbound rows: 95
... of those, non-parameterised (static) paths: 27
```

Instrument-tested in the same run — `/dossiers` 25 inbound, `/dashboard` 9, `/admin/ai-settings` 2 —
so these zeros come from an instrument demonstrably able to see links.

The 27 static zero-inbound routes:

```
/admin                      ← has decision row 9
/admin/preview-layouts      ← has decision row 7
/responsive-demo            ← §7 exclusion, "kept deliberately"
/reset-password             ← plausibly legitimate (external entry)
/settings/calendar/callback ← plausibly legitimate (OAuth callback)
--- the remaining 22 appear in NO Phase 97 document: ---
/contacts   /countries   /custom-dashboard   /dashboard/project-management   /data-library
/events     /geographic-visualization        /help/commitments   /intake/queue
/modern-nav-standalone      /my-work/waiting  /organizations     /persons
/reports/scheduled          /settings/email-digest  /settings/webhooks
/stakeholder-influence      /tasks/escalations      /tasks/queue
/word-assistant             /workflow-automation    /working-groups
```

I confirmed these are real route files, e.g. `frontend/src/routes/_protected/word-assistant.tsx`,
`.../data-library.tsx`, `.../stakeholder-influence.tsx`, `.../contacts.tsx`. And I confirmed the
absence of any treatment:

```
$ grep -rn "word-assistant\|data-library\|stakeholder-influence\|workflow-automation\|geographic-visualization" .planning/phases/97-reachability/
(no output)
```

**Twenty-two routes with no inbound link, no decision row, no owner, and no mention anywhere in the
phase** — surfaced by the phase's own instrument, which was simply never pointed at them.

The irony is precise and worth naming: `97-NAV04-DECISIONS.md` §0 correctly catches the
population-definition error in one direction (_"candidate ≠ measured-zero"_, which would have
produced four duplicate sidebar rows) and congratulates itself for it — inside the one requirement
whose subject is population correctness. It missed the same error in the other direction:
**enumerated candidates ≠ all measured zeros.**

### A criterion-2/criterion-4 interaction nobody surfaced

`SettingsNavigation` links every row to `/settings?section=<id>` — a search param, never a child
route. So two settings pages Phase 97 taught to _render_ navigation are themselves unreachable:

```
/settings/webhooks       0 inbound
/settings/email-digest   0 inbound
/settings/integrations   3  (history.replaceState — URL rewriting, not an affordance)
```

Criterion 2 is satisfied for them. Criterion 4 covers them and did not.

---

## 5 — Claims tested one by one

| Claim                                                        | My result                                                                                                                                                                                                                           |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 12/12 plans executed, 12 SUMMARYs                            | **CONFIRMED** — 12 files, each with exactly one `## BLOCKED` heading                                                                                                                                                                |
| BLOCKED split "4 empty, 8 substantive"                       | **DOES NOT REPRODUCE** — I count **5 empty** (01, 03, 06, 10, 12) / **7 substantive**. 97-06's is an empty marker carrying a substantive parenthetical, which likely explains the difference. Immaterial: none was silently omitted |
| 29 gates, 29 PARSE-OK                                        | **CONFIRMED** — `grep -h "<automated>" 97-*-PLAN.md \| wc -l` → **29**; my drill returned `PARSE-OK` for all 26 it ran                                                                                                              |
| 25 green / 2 red / 1 flaky / 1 timed-out                     | **CONFIRMED in substance, one correction** — see §6.1. My measurement: **25 green, 3 non-zero, 1 unmeasurable**                                                                                                                     |
| 2 genuine reds = `97-08` g1/g3, bounded to ENGREAD-01        | **CONFIRMED** — my drill: `97-08_g1 exit=1` (2 failed, digests), `97-08_g3 exit=1` (1 failed, engagements). Both cite the read-path error state                                                                                     |
| `97-07` g3 UNABLE TO MEASURE, dies at `signInInline` (`:99`) | **CONFIRMED and sharpened** — my drill: `97-07_g3 exit=1`, 1 failed at `:288`. My three manual runs show the failing test _moves_ and serialization fixes 7 of 8                                                                    |
| ZERO routes deleted, both triggers refuted                   | **CONFIRMED** — `routeTree.gen.ts` byte-identical, 593 = 593                                                                                                                                                                        |
| TWO dead modules deleted with re-run zero-importer proofs    | **CONFIRMED with my own control** (24-hit control proves the instrument sees imports)                                                                                                                                               |
| Gate text byte-identical to `d561738fa` except ruled edits   | **CONFIRMED** — 6 plan files changed, 13 lines each side, across exactly 5 commits, **every one ruling-authorized**: `RULING-P97-16` ×2, `-15`, `-12`, `-09/-10`. No unruled edit exists                                            |

### The gate ledger I measured

I excluded the recursive `97-12` and drilled the other eleven plans:

```
$ node scripts/gate-drill.mjs <staged 97-01..97-11> --json --timeout 300   # exit 0
gateCount: 26   PARSE-OK: 26   exit 0: 23   non-zero: 3
    97-07_g3 exit=1   (settings mobile, 1 failed at :288)
    97-08_g1 exit=1   (digests, 2 failed — ENGREAD-01)
    97-08_g3 exit=1   (list affordances, 1 failed at :264 — ENGREAD-01)

$ bash <97-12 g2>  → EXIT=0
$ bash <97-12 g3>  → EXIT=0
```

**29 gates: 25 measured green, 3 measured non-zero, 1 unmeasurable.**

---

## 6 — Findings the phase did not report

### 6.1 BLOCKER — the consolidating gate `97-12 g1` is non-terminating, not slow

The brief told me the harness default timeout is under two minutes, that `97-12` g1 exceeds it, that
a timeout is UNABLE TO MEASURE, and to raise the bound if I re-ran. **I raised it to 900s and ran it.
It does not terminate at any bound.**

```
$ node scripts/gate-drill.mjs .planning/phases/97-reachability --json --timeout 900
# after ~17 minutes: still running, output file 0 bytes
$ pgrep -f "gate-drill.mjs" | wc -l
16
# process ages: 16:41 14:33 12:30 12:23 10:19 10:12 08:09 07:32 05:58 05:21 03:49 03:11 01:37 00:59
```

The cause, from the plan text itself:

```
97-12 g1:  node "$R/scripts/gate-drill.mjs" "$R/.planning/phases/97-reachability" --json --timeout 900
```

The gate runs the drill **on its own phase directory**, which contains `97-12-PLAN.md`, whose g1
runs the drill on the same directory. `scripts/gate-drill.mjs` has no re-entrancy guard — I grepped
for one (`GATE_DRILL`, `reentr`, `RECURS`, `depth`, `process.env.GATE`) and found nothing. A new
nesting level appears roughly every 60–90 seconds, unbounded. I killed 16 processes.

**Why this matters more than a timeout.** Under `GATE-STANDARD-P92` **C1 — BOTH DIRECTIONS,
OBSERVED**, a gate that cannot terminate can never have been observed green. `97-12 g1` is not
"unmeasured pending a bigger bound"; it is **unmeasurable as written**. And its job is to certify
that all 29 gates pass — so the phase's single consolidating check has never run to completion and
cannot. The other 28 stand individually (I measured 25 green, 3 red); nothing consolidates them.

Recording it as "timed-out-unmeasured" understates it, and the invitation to "raise the bound" would
lead every future re-runner into the same 17-minute fork bomb.

### 6.2 BLOCKER — 32 test titles name a role the run does not prove

The brief's rule: _"name the ROLE and VIEWPORT any observation proves; 'reachable' with no role and
no viewport named is a scoped result reported as a general one."_ These specs name a role. It is
the **wrong** role.

```
$ for f in tests/e2e/97-*.spec.ts; do printf "%-42s ordinary=%s admin=%s\n" ...
97-digests-tab.spec.ts                     ordinary=2  admin=0
97-elected-officials-reachable.spec.ts     ordinary=5  admin=0
97-list-create-affordances.spec.ts         ordinary=9  admin=0
97-nav04-rows.spec.ts                      ordinary=0  admin=3
97-settings-nav.spec.ts                    ordinary=16 admin=0

$ grep -l "TEST_USER_EMAIL" tests/e2e/97-*.spec.ts | wc -l
5                       # all five read the SAME credential
$ grep TEST_USER_EMAIL .env.test
TEST_USER_EMAIL="kazahrani@stats.gov.sa"
```

All five specs sign in with one account, yet 32 titles call it "ordinary authenticated user" and 3
call it "adminOnly user". One account cannot be both.

**Which label is true is settled by a test result, not by argument.** `97-nav04-rows.spec.ts` passed
3/3 in my run, and those three assert sidebar rows inside the `administration` group — which
`createNavigationGroups` emits only `if (isAdmin)`. The session is therefore **admin**, and the
**32 "ordinary authenticated user" titles are false**.

The register does say "observed ADMIN-only" for NAV-01 and NAV-02 — so the phase knew. But the
correction lives in a planning document while the false claim lives in the specs, which are what CI
re-runs and what the next reader will believe. A green
`97-elected-officials-reachable.spec.ts` today reads as "ordinary users can reach Elected Officials".
That has not been shown. **No non-admin observation exists for any of the four criteria.**

### 6.3 BLOCKER — a Phase-97-caused RED left explicitly UNOWNED

`REQUIREMENTS.md:679` discloses it: _"`tests/e2e/93-dossier-list-counts-error.spec.ts` left RED at
`Expected: 7 / Received: 8` by the authorized CARD-8 widening, UNOWNED at close."_

I confirmed the cause and reproduced the failure:

```
tests/e2e/93-dossier-list-counts-error.spec.ts:48   const DOSSIER_TYPE_COUNT = 7
tests/e2e/93-dossier-list-counts-error.spec.ts:83   await expect(unknownCounts).toHaveCount(DOSSIER_TYPE_COUNT)

$ pnpm exec playwright test tests/e2e/93-dossier-list-counts-error.spec.ts --project=chromium-en --no-deps --workers=1
  ✘ 1 TRUST-01 dossier counts failure renders unknown, not zero (15.7s)
    Expected: 7    Received: 8
  1 failed
```

And I confirmed the "UNOWNED" is literal — there is **no requirement row** for it:

```
$ grep -nE "^\- \[ \] \*\*[A-Z0-9-]+\*\*.*(counts-error|CARD-8|Expected: 7)" .planning/REQUIREMENTS.md
(no output)
```

Disclosure is not ownership. Phase 97 knowingly broke a Phase 93 trust oracle and closed with
nobody scheduled to fix it; it will surface uninvited in Phase 101 ("CI Gates Green"). The fix is
one line (derive the count from `DOSSIER_CARD_TYPES` instead of freezing 7) — this is a moving-number
gate of exactly the class `D-08` was written to prevent, one phase-tag away.

### 6.4 Verified-good work worth recording

Adversarial reading is the job, so the things that survived it should be named:

- The **anti-merge guard** is genuine enforcement, proven both directions by me — not a comment. The
  code comment even says so about itself, citing `AppShell.tsx:121-124` as the in-repo precedent for
  a comment that was false for its whole life.
- **`CommandPalette.tsx` hardcoded `isAdmin = true`** — every administration entry was a palette
  command for every user. Found and fixed, with the derivation byte-identical to `Sidebar.tsx:54`,
  and correctly labelled a visibility fix rather than an authorization one.
- The **oracles refuse to green on unmet preconditions** (`DATA-PRECONDITION UNMET … This is never a
pass`). Rare and correct.
- `DossierListPage.tsx` renders **em dashes, not zeros**, for the EO active/inactive split that has
  no source — "inventing them would trade one confident lie for two."
- The register rows are unusually honest; several of my findings started from bounds the phase
  itself wrote down.

---

## 7 — What I did NOT establish

**The shared-ancestry limitation, stated plainly.** I am on the **same model family** as the
planner, the executors and the checker. This is a real limitation, not a formality, and this phase
carries direct evidence for it: earlier in this leg a cross-model reviewer rated a defect
`green-on-WRONG` while a same-ancestry reviewer rated the same defect a mere warning — **the
cross-model seat was right.** The findings a same-ancestry reviewer systematically under-produces
are exactly those requiring one to notice an **ABSENCE**: the check nobody wrote, the population
nobody swept, the role nobody varied. My §4 finding is of that class and I found it only because the
criterion's wording forced an unrestricted re-derivation. **I cannot bound how many others I
missed**, and the number is not zero. A cross-family seat should re-run §4 and §6 independently
before this phase is treated as closed.

Specific things I could not establish:

1. **Any non-admin observation, for any criterion.** All behavioural evidence — theirs and mine —
   is one admin account. The negative half of NAV-04 (admin rows hidden from non-admins) is
   unmeasured; it depends on `E2ECRED-01`, which is still open on the operator. The `setup` project
   fails outright: `Missing E2E_ADMIN_EMAIL / E2E_ANALYST_EMAIL / E2E_INTAKE_EMAIL`.
2. **Any Arabic/RTL observation.** I ran `chromium-en` only. Labels exist in both locales; no
   `dir="rtl"` render was observed.
3. **Any viewport besides 1400 and 390**, and 390 only for criterion 2. Criteria 1, 3 and 4 have no
   narrow-viewport evidence.
4. **The Digests tab click-through** — blocked by `ENGREAD-01`, which I reproduced but did not
   diagnose. I did not query staging to confirm the "5 engagement dossiers exist" half of the claim.
5. **`97-12 g1` in either direction** — non-terminating (§6.1). I measured g2/g3 (both exit 0) but
   the consolidating gate itself is unmeasurable.
6. **Whether the 22 unowned zero-inbound routes should be kept or deleted.** I measured that they
   have no inbound link and no decision row. Their disposal is a judgement, not a measurement, and
   it is not mine to make — that is precisely what a decision table is for.
7. **The instrument's own blind spots**, which it prints honestly and which bound my §4 numbers too:
   computed paths via `getDossierRouteSegment` (33 files), runtime-assembled template literals,
   redirects held in server data, unquoted route-shaped text. **Every zero I report is a FLOOR.**
   Some of the 22 may be reachable by a form the instrument cannot see — which is an argument for
   hand-classifying them, not for leaving them unrecorded.
8. **Whether `pnpm lint` / `pnpm build` pass.** I ran `tsc --noEmit` (exit 0) and the gate drill; I
   did not run the full lint or production build.

---

## 8 — Verdict

| #   | Criterion                        | Verdict                | Proven how                                                                                                    | Role / viewport proven |
| --- | -------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1   | 8 dossier types on four surfaces | **MET**                | **BEHAVIOURAL** — my run 5/5, plus both-direction compile guard                                               | admin · 1400           |
| 2   | Every `/settings/*` renders nav  | **MET**                | **BEHAVIOURAL** — my runs 8/8 desktop, 8/8 mobile (across runs)                                               | admin · 1400 + 390     |
| 3   | Digests tab + create affordances | **SPLIT**              | Affordances **BEHAVIOURAL** 7/8 + control; Digests **STRUCTURAL ONLY** (ENGREAD-01 reproduced)                | admin · 1400           |
| 4   | Every unlinked route resolved    | **NOT MET AS WRITTEN** | Enumerated 9: **BEHAVIOURAL** 3/3 + full table. General clause: **22 static zero-inbound routes unaddressed** | admin · 1400           |

**Score: 2.5 of 4 criteria fully met.**

Criterion 4 is the failure, and it is a scope failure rather than a quality failure: the nine rows
that were written are among the best decision records in this milestone, and the twenty-two that
were not written were never looked for. Criterion 3's Digests half is honestly blocked by a
pre-existing defect the phase did not cause and correctly refused to fake.

**Three blockers should be resolved before this phase is treated as closed:**

1. `97-12 g1` recursion — either add a re-entrancy guard to `scripts/gate-drill.mjs` or change the
   gate to drill a directory that excludes itself. Until then the phase has no consolidating gate,
   and the record should say _unmeasurable_, not _timed out_.
2. The 32 false "ordinary authenticated user" titles — retitle to the role actually exercised, or
   add a genuine non-admin fixture. As they stand the specs will keep asserting a claim no run
   supports.
3. The unowned `93-dossier-list-counts-error.spec.ts` RED — give it an owner, or derive the count
   from `DOSSIER_CARD_TYPES` so it stops being a frozen number.

And one scope decision for the operator: **the 22 zero-inbound routes.** Either criterion 4's first
clause is narrowed in the ROADMAP to match what was actually done, or those routes get the same
per-route decision treatment the nine received. Leaving the wording universal while the work was
enumerated means the checkbox will claim more than the evidence supports.

---

_Independent verification, first writer of this path. Every command above was executed in this
session against `HEAD = b358114fa`; every number pasted is output I received._

VERIFICATION-INDEPENDENT-END
