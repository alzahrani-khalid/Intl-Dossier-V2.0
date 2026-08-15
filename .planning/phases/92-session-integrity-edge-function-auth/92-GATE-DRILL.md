# 92-GATE-DRILL — the falsification drill applied to all 21 gates, one author, one pass

**HEAD observed:** `386d7880` — matches the required tree. `git status --porcelain` **empty at
start**; at end it holds **only the nine intended plan edits** (verified verbatim in §H).
**Branch:** `milestone/v10.0-trust` · **Author:** single, all ten plans held simultaneously
**Standard:** `.planning/GATE-STANDARD.md` clauses C1–C10 · **Date:** 2026-08-15

Every file claim below is pinned by reading the blob at `386d7880` or by a command whose output is
pasted. No credential value was read or printed at any point; key names only.

## 0. Verdict up front

**ACCEPT-WITH-NITS.**

- **21/21** gates parse (`bash -n`) and are **red on the undone tree** (repaired bodies, re-measured).
- **17/21** additionally observed **green on a constructed work-done state** → 11 `SOUND`, 6 `REPAIRED`.
- **4/21** are `UNPROVEN — done-state not constructed`: `92-03_g2`, `92-04_g2`, `92-09_g2`,
  `92-10_g1`. Each needs something this session cannot build (a real staging deploy, a live app
  session, six operator-held credentials). For each I built the largest constructible subset and
  say below exactly what remains unobserved. **None of these four is being reported as a pass.**
- **Five NEW instances of the class** were found — three of them by _observing a gate go red with
  the work done_, which is the only way this class is findable. All five repaired.
- Round 5's **B1 and B2 are closed** and re-measured in both directions. Round 5's **N1 and N2 are
  also closed** (the pass touched that gate). **N3 and N4 are carried forward**, unrepaired, with
  their reasons.
- Decision coverage **30/30, `uncovered: []`, node's own exit 0**, after all edits.

The two drill runs that bracket this pass:

```
DIRECTION 1 — repaired gates, UNDONE tree (main repo, cwd = repo root)
  21 gates · 21 parsed · 0 parse-fail · 0 exited 0

DIRECTION 2 — the SAME repaired gate bodies, CONSTRUCTED done state (cwd = /tmp/p92-scratch)
  21 gates · 21 parsed · 0 parse-fail · 19 exited 0
  (the 2 reds are 92-03_g2 and 92-10_g1; 92-04_g2 and 92-09_g2 are green only against a
   probe stand-in, so they are counted UNPROVEN below, not among the proven 17)
```

---

## A. Per-gate table — all 21, none omitted

Scratch tree throughout: `git worktree add --detach /tmp/p92-scratch HEAD`, with the repo's
`node_modules` and `frontend/node_modules` symlinked in so `tsc`/`vitest`/`playwright` resolve.
"HOW" states what was actually created so a reader can rebuild it.

| plan.gate    | C1 red — for its subject?                                                                                                                                                                                                                                            | C1 green — HOW the done state was constructed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | C2–C10 notes                                                                                                                                                                                                                                                                                                                                                                                                                             | verdict                                                                                                                                                                |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **92-01_g1** | YES — dies at `test -x scripts/probe-edge-auth.sh`; the tag clause before it passes (`phase-92-base` → `580588af`, at `e7660401`)                                                                                                                                    | Wrote executable `scripts/probe-edge-auth.sh` (`chmod +x`) + `92-PROBE-BASELINE.md` containing six `fn -> code` lines. Gate run verbatim → **exit 0**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | C4 nit: `-ge 6` is a frozen literal, not derived. Max achievable = 6 (the six named D-16 representatives), so the threshold is reachable — verified by construction. C5 ok: `test -x` precedes the `grep -c`                                                                                                                                                                                                                             | **SOUND**                                                                                                                                                              |
| **92-01_g2** | YES — the spec is absent, `--list` errors, count 0 ≠ 3                                                                                                                                                                                                               | Wrote the **real** `tests/e2e/92-signout.spec.ts` with exactly 3 tests + `TEST_USER_EMAIL`, `expires_at`, `refresh_token`, `settings-signout`, no `page.reload`, no fixture import; widened `LoginPage.signOut()` with `.or(getByRole('menuitem', …))`; appended the `AUTH-01 RED baseline` heading. **As written the gate exited 1** (listing = 3 `[setup]` + 3 spec lines, `grep -c '›'` = **6**). **With `--no-deps` → exit 0** (count 3)                                                                                                                                                                                                                                                                                                                                                                                                                                                        | C6 — B1, reproduced against the real spec, not a substitute. Also fixed round 5's **N1** (comment trip) and **N2** (`analystPage`/`intakePage` slipped through) — both reproduced then re-measured                                                                                                                                                                                                                                       | **REPAIRED** (`--no-deps` on `--list`; storage-state pin widened to `(admin\|analyst\|intake)Page` and scoped past `//` lines; the false rationale at :186-187 struck) |
| **92-01_g3** | YES — `--list` on an absent spec exits 1                                                                                                                                                                                                                             | Wrote `tests/e2e/92-delegations-error.spec.ts` carrying `setBlockedURLs`, `15_000`, and the exact title `unblocked load renders without the error alert`. Gate verbatim → **exit 0**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | C6 — the gate named a project with `dependencies:` and made no explicit decision. Weak oracle otherwise (a bare `--list` would accept one empty test); the greps chained after it carry the weight                                                                                                                                                                                                                                       | **REPAIRED** (`--no-deps` added, per C6's "including `--list`")                                                                                                        |
| **92-02_g1** | YES — `pnpm type-check` exits 0, chain proceeds, dies at `! grep -q "useSidebar"`                                                                                                                                                                                    | Swapped `useSidebar`→`useResponsive` in `nav-user.tsx`; added `data-testid="user-menu"` to the trigger; `t('navigation.logout','Logout')`→`t('common.logout')`; deleted `header/UserMenu.tsx` (0 importers, re-verified); mounted `<NavUser/>` in `Sidebar.tsx` and removed the 4 locals it orphaned (`getInitials`, `initials`, `displayName`, `roleLabel`, `localizedJobTitle`, `isRTL`) so `noUnusedLocals` typecheck stays clean; en `common.logout` → `"Sign out"`. **exit 0**                                                                                                                                                                                                                                                                                                                                                                                                                 | C3 ok (`type-check` exists in `frontend/package.json`; `typecheck` does not — 0 survivors repo-wide). **C10 gap, recorded not repaired:** the criterion names `t('common.logout')` with no 2nd arg, en `"Sign out"`, ar untouched, and _both_ label values matching the D-27 regex — **the gate checks none of it**. See §F                                                                                                              | **SOUND**                                                                                                                                                              |
| **92-02_g2** | YES — `vitest` reports `No test files found`                                                                                                                                                                                                                         | Added `queryClient.clear()` + `void import('@/router').then(({router})=>router.navigate({to:'/login'}))` to the SIGNED_OUT branch; wrote `authStore.signout.test.ts` (mocks `@/router`, seeds the cache, asserts `getQueryCache().getAll().length === 0` and the navigate spy). `vitest run` → **1 passed**. Gate verbatim → **exit 0**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | C7 ok — the `git diff` anchors to `phase-92-base`, and the pathspecs are CWD-relative after `cd frontend`, resolving to `frontend/src/…` as intended (0 today). **NEW-3 measured**: see §B                                                                                                                                                                                                                                               | **REPAIRED** (`grep -c … \| grep -qx 1` → a count over non-`//` lines)                                                                                                 |
| **92-02_g3** | YES — dies at the `settings-signout` grep after a clean typecheck                                                                                                                                                                                                    | Added `security.session/signOut/signOutDesc` to `en+ar/settings.json`; relabelled `dataPrivacy.signOutAll` in both locales; added both testids; removed the `setTimeout`/`window.location.href` block and its orphaned `logout`/`useAuthStore` import. **exit 0**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | **C10 gaps, recorded not repaired:** the gate tests `.includes('Other')` (capital O only) and `الأخرى`; the criterion additionally demands sentence case, `scope:'global'` unchanged, the why-comment present, and `AppShell.tsx`/`_protected/settings.tsx` untouched — none checked                                                                                                                                                     | **SOUND**                                                                                                                                                              |
| **92-03_g1** | YES — dies at `grep -q 'role="alert"'` after a clean typecheck                                                                                                                                                                                                       | Destructured `isError`, added the `role="alert"` error block (token classes, `t('list.error.*')`, `.btn-primary` retry wired to `refetch`) and an em-dash `statLabel`. **exit 0**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | **NEW-4 measured**: see §B. **C10 gap:** the criterion names em-dash stats and "both tabs covered"; the gate checks only `role="alert"` + the absent raw message                                                                                                                                                                                                                                                                         | **REPAIRED** (negative grep scoped past `//` comment lines)                                                                                                            |
| **92-03_g2** | YES — Playwright dies on the absent spec                                                                                                                                                                                                                             | **NOT FULLY CONSTRUCTIBLE** — the real spec needs a running app + an authenticated session + a CDP-blocked invoke. Largest subset built and observed: (a) the **whole chain verbatim** against a substitute 2-test spec → **exit 0** (`2 passed (241ms)`); (b) **negative control** — the same chain with a 3-test spec → **exit 1**, so the `\b2 passed` clause discriminates; (c) the `node -e` i18n clause run **verbatim from repo root** against constructed `list.error.*` keys in both locales → **exit 0**. `\b` works in both `/usr/bin/grep` (BSD) and the ugrep shim — checked                                                                                                                                                                                                                                                                                                           | **CANNOT CONSTRUCT:** that the _real_ spec's DOM assertions pass against a live app. N3 (a throw and a key-miss are both exit 1) and N4 (the i18n half sits behind the phase's most fragile clause) **carried forward** — my own inability to construct this green is N4 made concrete                                                                                                                                                   | **UNPROVEN — done-state not constructed**                                                                                                                              |
| **92-04_g1** | YES — the 4 dir roots exist, so the `MISSING ROOT` guard passes and it dies on the pin derivation (133 pinned files at HEAD)                                                                                                                                         | Mechanically migrated all 133 population `index.ts` files + `_shared/auth.ts` in the scratch: every `esm.sh/@supabase/supabase-js@2.3x` → `jsr:@supabase/supabase-js@2`, every `auth.getUser()` → `auth.getUser(token)`. **exit 0**; the 4 cores show `getUser(token)`=4 and `Authorization: authHeader`=4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | C5 ok — the `for d … MISSING ROOT … exit 1` loop is a real root-existence precondition and no `2>/dev/null` anywhere. **Fragility recorded, deliberately NOT changed:** its pin grep is dir-scoped without `--include='index.ts'` (the NEW-1 shape) — but it must _also_ scan the file `_shared/auth.ts`, which the flag would exclude, and its four dirs contain only `index.ts` today (measured). Adding the flag here would break C10 | **SOUND**                                                                                                                                                              |
| **92-04_g2** | Partly — the probe script (a 92-01 artifact) is absent, so `OUT` is empty and the count is 0 ≠ 4. It never reaches staging                                                                                                                                           | **NOT FULLY CONSTRUCTIBLE** — requires a real `supabase functions deploy` to `zkrcjzdemdmwhearhfgg` and a live JWT. Subset built: a probe stand-in with the identical stdout contract (`fn -> status`) emitting 4 non-401 lines → gate verbatim **exit 0**, so the arithmetic (`grep -c ' -> '` = 4, `! grep -q ' -> 401'`) is satisfiable                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | **CANNOT CONSTRUCT:** the deploy and the staging response. What is proven is the gate's counting, not that the functions flip                                                                                                                                                                                                                                                                                                            | **UNPROVEN — done-state not constructed**                                                                                                                              |
| **92-05_g1** | YES — 17 slice dirs exist; dies on the pin derivation                                                                                                                                                                                                                | Same mechanical migration. **exit 0** (green both before and after the C9 edit below)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | C4/C8 ok. Clause scoped to `--include='index.ts'` in the same C9 edit as the 92-06_g1 repair — preventive coherence here, not a defect repair. **C10 gap** shared by all 8 sweep gates: "every file that had an injected client still has it" is a criterion **no gate counts** — see §F                                                                                                                                                 | **SOUND**                                                                                                                                                              |
| **92-05_g2** | YES — dies on the pin derivation                                                                                                                                                                                                                                     | Same. **exit 0**. The C7 clause (`git diff --name-only phase-92-base -- supabase/functions/_shared ':(exclude)…/auth.ts' supabase/config.toml`) returns 0 in the constructed state, i.e. it correctly tolerates 92-04's legitimate `auth.ts` edit and nothing else                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | C7 ok — anchored to the tag, not HEAD; `phase-92-base` verified as an ancestor of HEAD, and the only non-`.planning` file changed between them is `scripts/gate-drill.mjs`                                                                                                                                                                                                                                                               | **SOUND**                                                                                                                                                              |
| **92-06_g1** | YES — dies on the pin derivation                                                                                                                                                                                                                                     | Same mechanical migration → **the gate STAYED RED (exit 1) with all 33 slice files migrated.** Cause: `supabase/functions/dossier-stats/dashboard-aggregations.ts:1` pins `esm.sh/@supabase/supabase-js@2.39.0`; the clause greps the whole `dossier-stats` **directory**, but 92-06's `files_modified` lists only `dossier-stats/index.ts`. Count with the work done = **1**, gate demands 0. With `--include='index.ts'` → **exit 0**, and on the undone tree the same repaired clause is still red (count **17** — corrected 2026-08-15 per `RULING-P92-44` D-2; the original "3" was taken from a 3-directory probe rather than from the clause as the gate executes it, over all 17 of its directories. The conclusion is unchanged in either case, but a number in an evidence column must be what the command prints, and a reader rebuilding from the old figure would not have matched it) | **NEW-1 — the class, found by construction.** This is invisible to any review that runs gates on the undone tree: today the clause is red because 133 files are pinned, which looks exactly like a healthy red                                                                                                                                                                                                                           | **REPAIRED** (`--include='index.ts'` on both derivation greps)                                                                                                         |
| **92-06_g2** | YES — dies on the pin derivation                                                                                                                                                                                                                                     | Same. **exit 0**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Its 16 dirs hold only `index.ts`; the flag is preventive here                                                                                                                                                                                                                                                                                                                                                                            | **SOUND**                                                                                                                                                              |
| **92-07_g1** | YES                                                                                                                                                                                                                                                                  | Same. **exit 0**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | As 92-05_g1                                                                                                                                                                                                                                                                                                                                                                                                                              | **SOUND**                                                                                                                                                              |
| **92-07_g2** | YES                                                                                                                                                                                                                                                                  | Same. **exit 0**, C7 clause 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | As 92-05_g2                                                                                                                                                                                                                                                                                                                                                                                                                              | **SOUND**                                                                                                                                                              |
| **92-08_g1** | YES                                                                                                                                                                                                                                                                  | Same. **exit 0**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | As 92-05_g1                                                                                                                                                                                                                                                                                                                                                                                                                              | **SOUND**                                                                                                                                                              |
| **92-08_g2** | YES                                                                                                                                                                                                                                                                  | Same. **exit 0**, C7 clause 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | As 92-05_g2                                                                                                                                                                                                                                                                                                                                                                                                                              | **SOUND**                                                                                                                                                              |
| **92-09_g1** | YES — no ledger exists, `U`=0 < 139                                                                                                                                                                                                                                  | Wrote `92-DEPLOY-LEDGER.md` with 139 unique `name \| timestamp \| OK` lines (the 133 derived population + the 6 named non-population helper importers). Gate verbatim → **exit 0** with **D=133, U=139, F=0, threshold D+6=139**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | **C4 satisfied and checked**: `D` is derived (`^ *- supabase/functions/[a-z0-9-]+/index\.ts` over 92-04..08 frontmatter list items → 4+33+33+33+30 = 133, prose-immune), and **max achievable = 139 = the threshold exactly** — reachable, verified. **NEW-5 measured**: see §B                                                                                                                                                          | **REPAIRED** (ledger name extraction made tolerant of a leading `\|` and immune to the `OK/FAIL` header row)                                                           |
| **92-09_g2** | YES — the repo-wide derivation returns 133 ≠ 0; it dies at its own subject before the probe                                                                                                                                                                          | **PARTIALLY CONSTRUCTIBLE.** Source half fully built and observed: after the migration the repo-wide `grep -rlE … --include='index.ts'` returns **0**. Live half: probe stand-in with 6 non-401 lines → full gate **exit 0**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | **CANNOT CONSTRUCT:** the deploy and the staging response for six representatives. The `;` after `OUT=$(…)` breaks the `&&` chain, but a failed probe leaves `OUT` empty → count 0 ≠ 6 → red, so it is not vacuous (checked)                                                                                                                                                                                                             | **UNPROVEN — done-state not constructed**                                                                                                                              |
| **92-10_g1** | **NO — C2 VIOLATION, and it survives the repair.** Run verbatim: all three `[setup]` tests fail with `Error: Missing E2E_ADMIN_EMAIL or _PASSWORD` at `tests/e2e/support/auth.setup.ts:19`, then `3 did not run`. The gate never reaches a single 01-login assertion | **NOT CONSTRUCTIBLE** — needs six live rotated credentials, which must not be fabricated or printed. **Mechanism observed instead:** `auth.setup.ts:10-13` reads `E2E_{ADMIN,ANALYST,INTAKE}_{EMAIL,PASSWORD}`; `.env.test` carries **0** `E2E_` keys; `playwright.config.ts:36` gives `chromium-en` `dependencies:['setup']` and the gate passes no `--no-deps`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | **NEW-2:** CARRY-01's checklist, _fully performed as written_, could not make this gate green — step 3 wrote only `TEST_USER_*` into `.env.test`, and step 4 ("re-run the setup project") was its own circular precondition. Step 2 also named only 4 of the 6 required secrets. Repaired in the checklist; the green remains unobserved                                                                                                 | **UNPROVEN — done-state not constructed**                                                                                                                              |

**Tally: 11 SOUND · 6 REPAIRED · 4 UNPROVEN · 0 NOT-CHECKED.**

---

## B. Repairs made

Nine plan files edited; **92-04-PLAN.md deliberately untouched**. All 21 gates re-parsed after
every edit (`21 gates, 0 parse failures`).

### R-A — B1 (round 5's blocker): `92-01` `--list` counted the dependency project · C6

- **Before** `92-01:242`: `test "$(… --project=chromium-en --list | grep -c '›')" -eq 3`
- **After**: `… --list --no-deps | grep -c '›'`, and `92-01:277` (`92-01_g3`) also given `--no-deps`,
  since C6 requires _every_ command naming a project with `dependencies:` to decide explicitly.
- The prose at `92-01:186-187` that licensed the omission ("`--list` does not need it, because
  listing executes nothing") is **struck and replaced with the measurement**.
- **Measured, against the real 3-test spec** (round 5 used a substitute): as written the listing is
  `3 setup + 3 spec = 6`, gate **exit 1 with the work done correctly**; with `--no-deps`, `3` and
  **exit 0**. Clause required: **C6**.

### R-B — B2 (round 5's blocker): 92-02 demanded a GREEN from an oracle whose RED was never taken · C9

Five sites repointed in one edit, from `01-login.spec.ts --grep "signs out"` to the command
`92-01` actually measures its RED with (`92-signout.spec.ts … --no-deps`): the D-26 truth (`:30`),
`<objective>` (`:79`), `<verification>` (`:320`), `<success_criteria>` (`:330`), `<output>` (`:336`).
RULING-37's validity rule was carried across in the same edit.

```
--grep "signs out"   0 occurrences across all ten plans   (was 1, in 92-02)
UNABLE TO MEASURE    8 occurrences   92-01:3  92-02:3  92-10:1   (was 3, 92-01 only)
RULING-37            8 occurrences   92-01:2  92-02:5  92-10:1   (was 2, 92-01 only)
```

The 8 surviving `01-login` mentions in 92-02 were each re-read: all are D-24/D-27 label-coupling
and `user-menu` testid-coupling context. **None is the D-26 oracle.** Clause required: **C9**.

### R-C — NEW-1: a slice derivation grep that cannot reach 0 when its slice is fully migrated · C9 + the class

- **Before** (`92-05..92-08`, 16 sites): `grep -rlE '…' supabase/functions/<dir> …`
- **After**: `grep -rlE '…' --include='index.ts' supabase/functions/<dir> …`
- **Evidence**: with all 33 slice-B files migrated, `92-06_g1` **exited 1**; the sole cause is
  `dossier-stats/dashboard-aggregations.ts:1`, a second `.ts` file in a slice directory pinning
  `2.39.0` and outside `files_modified`. `--include='index.ts'` makes it exit 0 while staying red
  on the undone tree. 16/16 sites rewritten, **0 dir-scoped greps without the flag survive** in
  92-05..92-08. This aligns the slice gates with `92-09`'s repo-wide derivation, which already
  carried the flag — the drift _was_ the defect (**C9**).
- **Complement, so the residue is not silently dropped**: `dashboard-aggregations.ts` is now named
  in `92-09` T2(e)'s carry-forward list beside `_shared/ai-interaction-logger.ts`, including the
  fact that unlike the logger it _is_ imported by a migrated function (`dossier-stats/index.ts:4`),
  so the deployed artifact re-bundles a 2.3x specifier after the sweep.

### R-D — NEW-2: CARRY-01's checklist could not satisfy CARRY-01's own gate · the class, in prose

Measured: `auth.setup.ts:10-13` requires **six** keys; `.env.test` carries **zero** `E2E_` keys;
step 2 named **four** (`E2E_INTAKE` appears **0** times in `ci.yml`, **2** in `e2e.yml`); step 3
updated only `TEST_USER_*`; step 4 told the operator to re-run the `setup` project, which needs the
very keys step 3 never provisions. Repairs: step 2 now names all six and flags `ci.yml`'s gap as an
E2ECRED-01/Phase-101 defect _not_ fixed here; step 3 now provisions the six keys in `.env.test` and
says why it is load-bearing; step 4 names step 3 as its precondition; and the acceptance criterion
now carries RULING-37 — a `setup`-project throw is `UNABLE TO MEASURE`, **never** a failed rotation.

### R-E — NEW-3: an exact-count grep over a term the plan orders into a comment · C8

- **Before** `92-02:239`: `grep -c "import('@/router')" src/store/authStore.ts | grep -qx 1`
- **After**: `test "$(grep -v '^[[:space:]]*//' src/store/authStore.ts | grep -c "import('@/router')")" -eq 1`
- **Measured**: the task _mandates_ a why-comment ("Add a one-line comment stating exactly that,
  because the next reader's instinct is to simplify it back"). With that comment naming the lazy
  form — the most natural wording — the count becomes **2** and the old clause **exits 1 with the
  work done correctly**. Restored to one occurrence, exit 0. This is round 4's F6 in a third file.

### R-F — NEW-4: the same shape in 92-03's negative grep · C8

- **Before** `92-03:92`: `! grep -q 'error?.message\|error\.message' …DelegationManagementPage.tsx`
- **After**: `test "$(grep -v '^[[:space:]]*//' … | grep -c 'error?.message\|error\.message')" -eq 0`
- **Measured**: adding `// Never render the raw error.message (supabase-js internal).` — exactly the
  rationale the plan's action text invites — turned the clause **red on the correct done state**.
  Removing it returned exit 0.

### R-G — NEW-5: the ledger gate coupled to a formatting choice the artifact invites · the class

- **Before** `92-09:85`: `U=$(grep '| OK' "$L" | cut -d'|' -f1 …)` (and the same twice inside `comm`)
- **After**: one helper, `N() { grep -E "\| *$1 *\|?[[:space:]]*$" "$L" | sed 's/^[[:space:]]*|//' | cut -d'|' -f1 | tr -d ' ' | sort -u; }`
- **Measured**: the ledger is a **`.md` file**, so writing it as a markdown table is the natural
  thing to do. With 139 successful deploys recorded as `| name | ts | OK |` plus a
  `| function | timestamp | OK/FAIL |` header, `cut -d'|' -f1` yields the empty string for every
  row and `U` collapses to **1** — the gate goes red with the entire deploy done. The new form
  reads both shapes and cannot count the header (it ends in `OK/FAIL`, not `OK`).

### R-H — round 5's N1 + N2, closed because the pass touched that gate

- **Before** `92-01:242`: `! grep -q 'adminPage' tests/e2e/92-signout.spec.ts`
- **After**: `test "$(grep -v '^[[:space:]]*//' … | grep -cE '(admin|analyst|intake)Page')" -eq 0`
- **N1 reproduced**: appending the plan's own `// do NOT use the adminPage fixture…` rationale made
  the old clause red on a correct spec; the new one stays green.
- **N2 reproduced cleanly**: a spec importing `analystPage` and never naming `adminPage` **passed**
  the old clause (a genuine stored-state + `setup`-project dependency slipping through) and is
  **correctly rejected** by the new one. The criterion text was updated to match (C10).

---

## C. B1 and B2 — closed inside this pass, not before it

**B1** is R-A. Round 5 proved it with a substitute 3-test spec; this pass proved it with **the real
`92-signout.spec.ts`** written to the plan's own specification, so the substitution is retired:
`grep -c '›'` = 6 as written, 3 with `--no-deps`, gate exit 1 → 0.

**B2** is R-B. The stale oracle is gone (`--grep "signs out"` → **0 occurrences**), the GREEN half
now names the same command as the RED half, and RULING-37's `UNABLE TO MEASURE` rule reaches
92-02 (3 occurrences) and 92-10 (1) instead of living only in 92-01.

---

## D. Cross-plan coherence (C9) — repo-wide greps over all ten plans, post-repair

```
$ cd .planning/phases/92-session-integrity-edge-function-auth

pnpm typecheck            occurrences=0
pnpm type-check           occurrences=5     92-02:4  92-03:1
--grep "signs out"        occurrences=0
UNABLE TO MEASURE         occurrences=8     92-01:3  92-02:3  92-10:1
RULING-37                 occurrences=8     92-01:2  92-02:5  92-10:1
include='index.ts'        occurrences=20    92-05:4 92-06:4 92-07:4 92-08:4 92-09:4
E2E_INTAKE                occurrences=4     92-10:3   (+ ci.yml:0, e2e.yml:2)
probe-edge-auth.sh        occurrences=11    92-01:7  92-04:2  92-09:2
92-PROBE-BASELINE.md      occurrences=13    92-01:10 92-04:1  92-09:2
92-DEPLOY-LEDGER.md       occurrences=9     92-04:2  92-09:7
92-signout.spec.ts        occurrences=15    92-01:7  92-02:2   (+3 new in 92-02 from R-B)
settings-signout          occurrences=6     92-01:3  92-02:3
signout-all-sessions      occurrences=4     92-01:1  92-02:3

$ grep -o "grep -rlE '[^']*' supabase/functions/" 92-0[5678]-PLAN.md | wc -l
0        # zero dir-scoped derivation greps without --include survive in the sweep plans

$ grep -n 'playwright test' 92-*-PLAN.md | grep -v -- '--no-deps'
92-10-PLAN.md:86   playwright test tests/e2e/01-login.spec.ts
92-10-PLAN.md:92   playwright test tests/e2e/01-login.spec.ts
        # the only two, and deliberately so: CARRY-01's smoke is the one place that MUST run the
        # setup project (step 4 regenerates the storage state). Its validity rule is now carried.
```

**Population coherence, derived not assumed** — the slice `files_modified` lists versus the actual
2.3x-pinned population, both directions:

```
$ grep -hE '^ *- supabase/functions/[a-z0-9-]+/index\.ts' 92-0[45678]-PLAN.md | sed 's/^ *- //' | sort -u > listed
$ grep -rlE '@supabase/supabase-js@2\.3[0-9]' supabase/functions --include='index.ts' | sort -u  > actual
listed=133   actual=133
comm -23 listed actual   → (empty)     # nothing listed that is not pinned
comm -13 listed actual   → (empty)     # nothing pinned that is not listed
```

Per-plan derivation counts: 92-04 = 4, 92-05 = 33, 92-06 = 33, 92-07 = 33, 92-08 = 30 → **D = 133**,
so 92-09_g1's `-ge $((D+6))` = 139 and the maximum achievable is 139 exactly.

**Environment fact worth recording**: in an interactive shell here, `grep` is a Claude Code shim
onto **ugrep 7.5.0** which honours `.gitignore`; gates spawned by `gate-drill.mjs` get
`/usr/bin/grep` (BSD). Every measurement above was taken with `/usr/bin/grep` so it matches what a
gate sees. Both accept `\b` and BRE `\|`, so `92-03_g2`'s `\b2 passed` and `92-03_g1`'s alternation
are portable across the two — checked explicitly, since a mismatch there would have been an
unfixable-green.

---

## E. Regression check — decision coverage, node's own exit

```
$ node scripts/decision-coverage.mjs .planning/phases/92-…-auth .planning/phases/92-…-auth/92-CONTEXT.md
{"passed": true, "skipped": false, "total": 30, "covered": 30, "uncovered": []}
$ echo $?   # node's OWN exit, not a pipe's
0
plans_scanned: 92-01 … 92-10  (all ten)
```

Run **after** all nine plan edits. 30/30, `uncovered: []`.

---

## F. What this pass does NOT establish

- **Nothing in Phase 92 has been executed.** No task ran, no function was migrated in the real tree,
  no spec was written into it, no deploy happened. Every green above is a green against a state
  **I built in `/tmp/p92-scratch`** to make the gate reachable — it is evidence about the _gate_,
  never about the work.
- **The four `UNPROVEN` gates, named:**
  - `92-03_g2` — the real forced-error spec passing against a live app and session. I substituted a
    2-test spec to exercise the oracle and added a 3-test negative control; the DOM assertions,
    the CDP block, and the ~7s retry-backoff timing are **unobserved**.
  - `92-04_g2` — the staging deploy and the 401→non-401 flip. Proven only that the gate's counting
    is satisfiable against a stand-in with the same stdout contract.
  - `92-09_g2` — same for six representatives. Its _source_ half (derivation → 0 repo-wide) **is**
    fully constructed and green; its live half is not.
  - `92-10_g1` — needs six rotated credentials. I did not fabricate them and printed no value. The
    repair makes the checklist _able_ to satisfy the gate; **that it then does is unobserved.**
- **The mechanical migration I built is grep-observable, not semantic.** I replaced specifiers and
  `getUser()` → `getUser(token)` across 133 files; I did **not** add the `const token = …`
  declaration, and **no gate in the phase typechecks or bundles an edge function**, so nothing here
  says the migrated functions compile under Deno. That is 92-09's deploy's job, and it is unproven.
- **Things I reasoned about rather than observed:** that `_shared/ai-interaction-logger.ts` is
  outside every gate's reach (derived from the greps, not from running each gate against a state
  where it is the only residue); that a `/* … */` block comment would still defeat the three
  comment-scoped clauses I introduced (R-E/R-F/R-H all skip `//` lines only — the plans ask for
  one-line comments, so this is a stated bound, not a measurement); and 92-04_g1's continued safety,
  which rests on its four directories containing only `index.ts` **today**.
- **Carried forward, unrepaired:** round 5's **N3** (`92-03_g2`'s `node -e` cannot distinguish a
  throw from a real key failure — both exit 1) and **N4** (the i18n assertion sits behind the
  Playwright clause, so it is unreachable while E2ECRED-01 stands). N4 is no longer only a
  structural remark: it is precisely why `92-03_g2` is the gate I could not prove.
- **The strongest nit I found and chose NOT to repair** — stated explicitly rather than buried:
  all four sweep plans carry the criterion _"every Class-1 edit retains its header-injected client
  (RLS scoping survives)"_, and **no sweep gate counts it.** Only `92-04_g1` checks
  `Authorization: authHeader`, and only for its own four files. The failure mode is exactly the
  `200-with-[]` failure-as-emptiness this milestone exists to kill. A C4-clean clause exists —
  compare `git grep -lE 'Authorization: authHeader' phase-92-base -- <dirs> | wc -l` against the
  working tree per slice. I did not add it, for a reason I want on the record: the lesson of this
  phase is that **unproven new gate claims are the defect generator**, and bolting a ninth
  derivation onto eight gates I had just repaired, then proving it in both directions under time
  pressure, is how the previous five rounds each created the next round's finding. It is a real
  C10 gap, it is named here with its fix, and it is a decision, not an oversight.
- I did not run `pnpm lint`, `pnpm build`, or the full e2e suite; I rendered no browser; I did not
  exercise the tickmarkr harness shell (its `bash -lc` → Node 20.11.1 hazard is untested here — my
  gates ran under this session's bash with node v24.19.0 and pnpm-resolved binaries); I did not
  assess the plans' _substance_ — whether each gate guards the right thing — beyond C10.

---

## G. Verdict

**ACCEPT-WITH-NITS.**

Justified from what was measured, not from the absence of findings:

1. **The pass did what the standard says only a constructed done state can do.** Three of the five
   new defects (NEW-1, NEW-3, NEW-4) and both round-5 nits (N1, N2) were found by watching a gate go
   **red with the work done** — none is visible from the undone tree, and NEW-1 in particular sat
   under a red that looked perfectly healthy for five rounds.
2. **17 of 21 gates now satisfy C1 in both directions**, re-measured after every edit, with the
   before/after pasted. The 21-red / 19-green bracket is reproducible from this document.
3. **The 4 remaining gates are unproven for environmental reasons, not authoring reasons**, each
   with its largest constructible subset observed and its residue named. They are reported as
   `UNPROVEN`, not folded into a pass.
4. **The class was not eliminated — it was found again, five times, and repaired.** That is the
   expected result of the first pass under this standard, and it is why the verdict is not a clean
   ACCEPT. What has changed is the method: the set was held by one author, the coherence greps were
   run repo-wide with counts pasted, and every repair was proven against a state where the work
   exists.

Not REJECT: no gate remains that is known to be unable to pass when its work is done. Not a clean
ACCEPT: four gates are unproven, three C10 criteria go unchecked by their gates (§A, §F), N3 and N4
are carried, and the injected-client criterion is guarded by nothing.

## H. Tree state

```
$ git log --oneline -1
386d7880 docs(92): land the correction ae9c0626's message described but did not contain

$ git status --porcelain
 M .planning/phases/92-session-integrity-edge-function-auth/92-01-PLAN.md
 M .planning/phases/92-session-integrity-edge-function-auth/92-02-PLAN.md
 M .planning/phases/92-session-integrity-edge-function-auth/92-03-PLAN.md
 M .planning/phases/92-session-integrity-edge-function-auth/92-05-PLAN.md
 M .planning/phases/92-session-integrity-edge-function-auth/92-06-PLAN.md
 M .planning/phases/92-session-integrity-edge-function-auth/92-07-PLAN.md
 M .planning/phases/92-session-integrity-edge-function-auth/92-08-PLAN.md
 M .planning/phases/92-session-integrity-edge-function-auth/92-09-PLAN.md
 M .planning/phases/92-session-integrity-edge-function-auth/92-10-PLAN.md

 9 files changed, 60 insertions(+), 34 deletions(-)   (this report not yet added)
```

**Intended plan edits only.** `92-04-PLAN.md` is byte-identical. Every construction happened in the
throwaway worktree `/tmp/p92-scratch`, which is removed; no source file, spec, script, or artifact
was created in the real tree. HEAD unmoved.

GATE-DRILL-END
