---
phase: 101-ci-gates-green
plan: 01
status: complete
requirements: [CARRY-10]
implementation_commit: 38d2e6f8b
drill_run_at: 38d2e6f8b
---

# 101-01 SUMMARY — the frontend Playwright config leases its dev stack; planted-session drill, both configs, at the final implementation commit

## Result

- **Criterion 6, frontend slice (CARRY-10).** `frontend/playwright.config.ts` starts its dev stack through the
  lease writer (`node ../scripts/pw-run-reaped.mjs --lease-exec -- env NODE_ENV=development pnpm dev`) with
  `reuseExistingServer: process.env.PW_REUSE === '1'` (opt-in only). All four `frontend/package.json` scripts that
  invoked `playwright test` now go through run mode.
- **Run mode accepts an EMPTY Playwright argument list** (run 0081 review). `runMode` no longer calls `usage()` on
  `--` with nothing after it, and `test:e2e` is `node ../scripts/pw-run-reaped.mjs --`. The wrapper spawns
  `pnpm exec playwright test --reporter=json`, which is bare `playwright test` over every project the config
  declares. It is not narrowed to `--project=chromium` (§2.2).
- **The F3 teardown race.** `attribute()` re-censuses a member whose cwd reads UNREADABLE (5 × 200 ms bound) before
  it takes the whole-session refusal:
  - a member that has exited by then is excluded, but only when a global probe of its pid reads it positively
    `dead`;
  - a still-live member with an unreadable cwd still refuses (fail-closed preserved);
  - a pid that is live outside its bound tuple refuses;
  - an unavailable re-census or probe refuses.

  This is run 0081's reviewed repair (`ab7e9f36f`), carried unchanged. §1.4 shows that the final wrapper differs
  from it only by the empty-argument hunks.
- **The drill** is the three `oracle: command` blocks of this PLAN, byte-identical, run one after another at
  **`38d2e6f8b`**, the final implementation commit. The commit that adds this SUMMARY touches only this file.

  | oracle | selector | exit | last line | wall time |
  | ------ | -------- | ---- | --------- | --------- |
  | o1 | `CFGS="frontend"; PH="A INT TERM HUP KILL F"` | **0** | `PASS frontend phases [A INT TERM HUP KILL F]` | 06:43:10 → 06:47:35 (265 s) |
  | o2 | `CFGS="root"; PH="A INT TERM HUP"` | **0** | `PASS root phases [A INT TERM HUP]` | 06:47:54 → 06:48:32 (38 s) |
  | o3 | `CFGS="root"; PH="KILL F"` | **0** | `PASS root phases [KILL F]` | 06:48:32 → 06:51:58 (206 s) |

  The SIGKILL+sweep phase was repeated frontend ×3 and root ×2 (the cap-bounded floor):
  - **5 of 5** sweeps returned `reaped`;
  - wrapper exit **137** was recorded for each;
  - **0** `--sweep` refusals across all **7** `--sweep` invocations of the drill.

  Phase F exited **90** in both configs, with no report published and the bystander left alive.

## 1. What changed

`git show --stat --format='%h %s' 38d2e6f8b`:

```
38d2e6f8b fix(101-01): lease the frontend dev stack through the wrapper; run mode accepts an empty argument list

 frontend/package.json         |  8 +++----
 frontend/playwright.config.ts | 16 +++++++++++--
 scripts/pw-run-reaped.mjs     | 54 +++++++++++++++++++++++++++++++++++--------
 3 files changed, 62 insertions(+), 16 deletions(-)
```

### 1.1 `frontend/playwright.config.ts` — the `webServer` block only

`git show --format= 38d2e6f8b -- frontend/playwright.config.ts`:

```diff
diff --git a/frontend/playwright.config.ts b/frontend/playwright.config.ts
index 3a4381c73..7e583c9f3 100644
--- a/frontend/playwright.config.ts
+++ b/frontend/playwright.config.ts
@@ -150,9 +150,21 @@ export default defineConfig({
   webServer: process.env.E2E_BASE_URL
     ? undefined
     : {
-        command: 'NODE_ENV=development pnpm dev',
+        // The lease writer (RULING-P99-50, F2): `pw-run-reaped.mjs --lease-exec` writes this
+        // web-server session's identity to `.pw-leases/<nonce>.lease` INSIDE the session, then
+        // supervises the same `env NODE_ENV=development pnpm dev` stack it leased. Only a session
+        // carrying OUR nonce is ever reaped at finish; a new port holder without one is a refusal,
+        // never a target. With no PW_LEASE_* env (ad-hoc `pnpm exec playwright test`) the writer
+        // warns and runs the stack unleased — never sabotaging the run it observes.
+        command:
+          'node ../scripts/pw-run-reaped.mjs --lease-exec -- env NODE_ENV=development pnpm dev',
         url: baseURL,
-        reuseExistingServer: !process.env.CI,
+        // Reuse is OPT-IN (`PW_REUSE=1`), never implicit. A reused server serves whatever tree it
+        // was started in; a server Playwright starts serves THIS config's directory. When a run
+        // verifies per-worktree changes, an implicitly reused stray dev server renders the wrong
+        // tree and reports a pass — measured 2026-08-18: a 42-hour-old main-checkout server
+        // answered this exact baseURL in 2.7 ms while `CI` was unset (`RULING-P99-17`).
+        reuseExistingServer: process.env.PW_REUSE === '1',
         timeout: 120_000,
       },
 })
```

- The two comments are the root config's, copied verbatim.
- `url`, `timeout`, the `E2E_BASE_URL ? undefined :` guard and everything outside `webServer` are untouched: the
  diff has one hunk.
- No `globalTeardown` was added.
- Prettier split `command:` over two lines. The literal string is unchanged, and the oracle's two routing
  prechecks match the committed blob:

```
$ git show 38d2e6f8b:frontend/playwright.config.ts | grep -c 'pw-run-reaped.mjs --lease-exec'
2
$ git show 38d2e6f8b:frontend/playwright.config.ts | grep -c "reuseExistingServer: process.env.PW_REUSE === '1'"
1
```

(2 = the comment line and the command line.)

### 1.2 `frontend/package.json` — every script that invoked `playwright test`

`git show --format= 38d2e6f8b -- frontend/package.json`:

```diff
diff --git a/frontend/package.json b/frontend/package.json
index 29d179c46..9b7c9c101 100644
--- a/frontend/package.json
+++ b/frontend/package.json
@@ -10,10 +10,10 @@
     "build:strict": "tsc && vite build",
     "preview": "vite preview",
     "test": "vitest",
-    "test:e2e": "playwright test",
-    "test:qa-sweep": "playwright test qa-sweep-axe.spec.ts qa-sweep-responsive.spec.ts qa-sweep-keyboard.spec.ts qa-sweep-focus-outline.spec.ts --reporter=list",
-    "docs:rtl-icons": "playwright test qa-sweep-icon-screenshots.spec.ts --update-snapshots --reporter=list",
-    "test:a11y": "playwright test --project=a11y",
+    "test:e2e": "node ../scripts/pw-run-reaped.mjs --",
+    "test:qa-sweep": "node ../scripts/pw-run-reaped.mjs -- qa-sweep-axe.spec.ts qa-sweep-responsive.spec.ts qa-sweep-keyboard.spec.ts qa-sweep-focus-outline.spec.ts",
+    "docs:rtl-icons": "node ../scripts/pw-run-reaped.mjs -- qa-sweep-icon-screenshots.spec.ts --update-snapshots",
+    "test:a11y": "node ../scripts/pw-run-reaped.mjs -- --project=a11y",
     "lint": "cd .. && eslint -c eslint.config.mjs --max-warnings 0 'frontend/src/**/*.{ts,tsx}' && node scripts/check-i18n-namespaces.mjs && node scripts/check-duplicate-rtl.mjs frontend/src && node scripts/check-bootstrap-parity.mjs && node scripts/check-date-formatting.mjs",
     "format": "prettier --write src/**/*.{ts,tsx}",
     "type-check": "tsc --noEmit",
```

- **`test:e2e` is `node ../scripts/pw-run-reaped.mjs --`, with no arguments.** This keeps bare `playwright test`
  semantics, the full project set (§2.2). The earlier `--project=chromium` prescription is withdrawn (run 0081
  review).
- **`--reporter=list` was dropped** from `test:qa-sweep` and `docs:rtl-icons`. Run mode spawns
  `pnpm exec playwright test ...pwArgs --reporter=json`, and the LAST `--reporter` wins, so under the wrapper the
  list reporter would have been silently discarded anyway.
- No other script and no dependency changed.
- **CI reach** is recorded here, not edited: `.github/workflows/*` belongs to P101-04.

```
$ grep -nE 'test:(e2e|qa-sweep|a11y)|docs:rtl-icons' .github/workflows/*.yml
.github/workflows/e2e.yml:83:        run: pnpm -C frontend test:qa-sweep
.github/workflows/ci.yml:282:        run: pnpm run test:e2e
```

- `e2e.yml:83` is in the `qa-sweep` job, which sets `E2E_BASE_URL` (`e2e.yml:66`), so no webServer starts and
  no lease is expected under the wrapper there (§5).
- `ci.yml:282` (`pnpm run test:e2e`) is in the `test-e2e` job ("E2E Tests"), which D-07 deletes in P101-04. Until
  then it runs the bare, wrapped `test:e2e` (§2.2).

### 1.3 `scripts/pw-run-reaped.mjs`

`git show --format= 38d2e6f8b -- scripts/pw-run-reaped.mjs`:

```diff
diff --git a/scripts/pw-run-reaped.mjs b/scripts/pw-run-reaped.mjs
index ed89559b0..29b944a29 100644
--- a/scripts/pw-run-reaped.mjs
+++ b/scripts/pw-run-reaped.mjs
@@ -28,8 +28,9 @@
  * preceded by a fresh census that must revalidate every member's immutable identity tuple
  * {pid, pgid, lstart, cwd} (F4). There is NO bare-PID SIGKILL anywhere in this file. Any
  * unavailable census is `unavailable` and stops signalling (F1); any unreadable, unresolvable, or
- * out-of-root cwd refuses the WHOLE session (F3); any identity change refuses — we never follow
- * the number.
+ * out-of-root cwd refuses the WHOLE session (F3 — an unreadable one only after a bounded re-census;
+ * a member is excluded only when its pid then probes positively dead, P101-01); any identity
+ * change refuses — we never follow the number.
  *
  * THE VERDICT. Cleanup produces ONE verdict, a conjunction of positive observations:
  *   clean ⟺ every expected lease was found (or provably never started: no lease AND no new port
@@ -68,7 +69,7 @@
  * pre-spawn sweep plus `--sweep <root>` consume the orphan (Amendment 2: recovery is
  * product-owned, not an operator overlay).
  *
- * usage: node scripts/pw-run-reaped.mjs -- <playwright args...>      RUN (pass-through)
+ * usage: node scripts/pw-run-reaped.mjs -- [playwright args...]      RUN (pass-through; none = bare)
  *        node scripts/pw-run-reaped.mjs <spec> <project> <jsonOut>   RUN (legacy positional)
  *        node scripts/pw-run-reaped.mjs --lease-exec -- <cmd...>     LEASE WRITER (config-invoked)
  *        node scripts/pw-run-reaped.mjs --sweep <root>               ORPHAN RECOVERY
@@ -690,9 +691,37 @@ export const reapLeakedSession = (
     out.zero = false
     return out
   }
-  // cwd attribution for one member: a STRING reason on any failure, the enriched member otherwise.
+  const EXITED = Symbol('member exited before its cwd could be read')
+  // cwd attribution for one member: a STRING reason on any failure, EXITED when the member left the
+  // session before its cwd could be read, the enriched member otherwise.
+  //
+  // P101-01: an UNREADABLE cwd is RE-CENSUSED before it refuses the whole session. `lsof` reads no
+  // cwd for a process that is exiting, and the SIGKILL+sweep drill raced Playwright's own webServer
+  // teardown into exactly that: members leaving the session read UNREADABLE and the sweep refused
+  // WHOLE (run 0080). After a short bounded delay the session is censused again. A member still
+  // present under the SAME identity {pid, pgid, lstart} is re-read, and if its cwd still reads
+  // unreadable it REFUSES exactly as before (F3 fail-closed preserved). A member ABSENT from the
+  // re-census is EXCLUDED only when a global probe of its pid reads it positively `dead` (gone, or
+  // a zombie — no descriptors). Absence alone is not exit: a pid still LIVE after leaving the tuple
+  // (new pgid, new session, or a reused number) is an identity change and refuses. An unavailable
+  // re-census or probe refuses.
+  // ponytail: 5 × 200 ms bounds the wait per unreadable member; an exiting process leaves in ms.
   const attribute = (m) => {
-    const raw = cwdOf(m.pid, { runner })
+    let raw = cwdOf(m.pid, { runner })
+    for (let i = 0; (raw === null || raw === '') && i < 5; i++) {
+      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200)
+      const again = census()
+      if (again === null)
+        return `member pid ${m.pid}: cwd UNREADABLE and the re-census is UNAVAILABLE — not ours to end`
+      if (!again.some((x) => x.pid === m.pid && x.pgid === m.pgid && x.lstart === m.lstart)) {
+        const p = probeProcess(m.pid, { runner })
+        if (p.state === 'dead') return EXITED
+        if (p.state === 'alive')
+          return `member pid ${m.pid}: cwd UNREADABLE and the pid is LIVE outside its bound {pgid ${m.pgid}, session ${sid}, lstart} — an identity change, never follow the number`
+        return `member pid ${m.pid}: cwd UNREADABLE and its exit is unprovable (${p.why}) — not ours to end`
+      }
+      raw = cwdOf(m.pid, { runner })
+    }
     if (raw === null || raw === '')
       return `member pid ${m.pid}: cwd UNREADABLE — a session we cannot fully attribute is not ours to end`
     let cwd
@@ -721,6 +750,7 @@ export const reapLeakedSession = (
   for (const m of first) {
     const v = attribute(m)
     if (typeof v === 'string') return refuse(`session ${sid} refused WHOLE: ${v}`)
+    if (v === EXITED) continue // left the session during the bounded re-census — excluded, never bound
     known.set(m.pid, { pid: m.pid, pgid: m.pgid, lstart: m.lstart, cwd: v.cwd })
   }
 
@@ -793,6 +823,7 @@ export const reapLeakedSession = (
     const ourPgid = pgidOf(process.pid, { runner })
     if (ourPgid === null)
       return unavailable('own pgid unresolvable at signal time — failing closed, no signals sent')
+    const live = [] // attributed members only — an exited member's pgid is never a signal target
     for (const m of cur) {
       const prev = known.get(m.pid)
       if (prev && (prev.pgid !== m.pgid || prev.lstart !== m.lstart))
@@ -802,6 +833,7 @@ export const reapLeakedSession = (
         )
       const v = attribute(m) // F3: containment re-checked on the at-use census
       if (typeof v === 'string') return refuse(`session ${sid} refused WHOLE at-use: ${v}`)
+      if (v === EXITED) continue // left the session during the bounded re-census — never signalled
       // Repair 3 (RULING-P99-54): the FULL bound tuple is recompared every round, canonical cwd
       // included — the old code re-checked pgid/lstart but only re-checked that cwd was still
       // CONTAINED, never that it was still the SAME cwd. A member that moved to a different (but
@@ -812,8 +844,9 @@ export const reapLeakedSession = (
           `session ${sid} refused WHOLE: pid ${m.pid} cwd changed (${prev.cwd} -> ${v.cwd}) — never follow the number`,
         )
       if (!prev) known.set(m.pid, { pid: m.pid, pgid: m.pgid, lstart: m.lstart, cwd: v.cwd })
+      live.push(m)
     }
-    const groups = [...new Set(cur.map((m) => m.pgid))].filter((g) => g > 1 && g !== ourPgid)
+    const groups = [...new Set(live.map((m) => m.pgid))].filter((g) => g > 1 && g !== ourPgid)
     out.pgids = [...new Set([...out.pgids, ...groups])]
     for (const g of groups) {
       // Repair 2 (RULING-P99-58 item 2): re-read and revalidate the lease authority AFTER the fresh
@@ -1684,7 +1717,7 @@ export const installExitHandlers = (finish, { log = console.error } = {}) => {
 
 const usage = () => {
   console.error(
-    'usage: pw-run-reaped.mjs (-- <playwright args...> | <spec> <project> <jsonOut> | ' +
+    'usage: pw-run-reaped.mjs (-- [playwright args...] | <spec> <project> <jsonOut> | ' +
       '--lease-exec -- <cmd...> | --sweep <root>)',
   )
   process.exit(2)
@@ -1699,7 +1732,8 @@ const usage = () => {
  * python3 missing: the lease is written with sid:null and a reason, and the command STILL runs —
  * an instrument must never sabotage the run it observes. RUN then reports `unavailable` and the
  * gate goes red. PW_LEASE_* env absent (ad-hoc `pnpm exec playwright test`, unroutable by
- * construction): warn and run UNLEASED — recovery for that path is `--sweep`, stated not papered.
+ * construction): warn and run UNLEASED. That session writes no lease, so it is NOT recoverable
+ * here — `--sweep` and RUN's pre-spawn sweep walk lease files only (P101-01); stated, not papered.
  */
 const leaseExecMode = (argv) => {
   const [dash, ...cmd] = argv
@@ -1791,7 +1825,8 @@ const sweepMode = (root) => {
 }
 
 /**
- * RUN. Pass-through (`-- <args>`) appends args to `pnpm exec playwright test`; the legacy
+ * RUN. Pass-through (`-- [args]`) appends args to `pnpm exec playwright test`; an EMPTY list is the
+ * bare invocation, every project the config declares (frontend `test:e2e`, P101-01). The legacy
  * positional form (<spec> <project> <jsonOut>) keeps working — the three closed plans still
  * contain it, and a landmine in a preserved-but-dead command is still a landmine.
  *
@@ -1810,7 +1845,6 @@ export const runMode = (
   let jsonOut = null
   if (argv[0] === '--') {
     pwArgs = argv.slice(1)
-    if (pwArgs.length === 0) usage()
   } else {
     const [spec, project, out] = argv
     if (spec === undefined || project === undefined || out === undefined) usage()
```

Two changes, in the one file:
- **The empty argument list:** the `if (pwArgs.length === 0) usage()` line is gone. The usage string, the header
  usage line and the `runMode` doc comment now read `-- [playwright args...]`. An empty list reaches the existing
  `spawnFn('pnpm', ['exec', 'playwright', 'test', ...pwArgs, '--reporter=json'], …)` call as
  `playwright test --reporter=json`. The legacy positional form still calls `usage()` when any of its three
  arguments is missing.
- **The F3 re-census in `attribute()`,** used by both call sites (the first census and the per-round at-use census):
  - cwd unreadable → wait 200 ms → re-census the session;
  - the member is absent under the same `{pid, pgid, lstart}` → `probeProcess(pid)`:
    - `dead` (gone, or a zombie) → `EXITED`: skipped, never bound, and its pgid is never signalled (the round
      builds its signal groups from attributed members only);
    - `alive` → refuse (identity change);
    - `unavailable` → refuse;
  - the member is still present → re-read the cwd, up to 5 tries, then the original refusal text, unchanged;
  - the re-census is unavailable → refuse.

  The `leaseExecMode` doc comment now states the ad-hoc bound truthfully (§4.1).

### 1.4 What changed relative to run 0081's reviewed repair (`ab7e9f36f`)

```
$ git diff ab7e9f36f 38d2e6f8b -- scripts/pw-run-reaped.mjs frontend/playwright.config.ts frontend/package.json | grep -E '^(@@|[-+])' | grep -vE '^(\+\+\+|---) '
@@ -10,7 +10,7 @@
-    "test:e2e": "node ../scripts/pw-run-reaped.mjs -- --project=chromium",
+    "test:e2e": "node ../scripts/pw-run-reaped.mjs --",
@@ -69,7 +69,7 @@
- * usage: node scripts/pw-run-reaped.mjs -- <playwright args...>      RUN (pass-through)
+ * usage: node scripts/pw-run-reaped.mjs -- [playwright args...]      RUN (pass-through; none = bare)
@@ -1717,7 +1717,7 @@ export const installExitHandlers = (finish, { log = console.error } = {}) => {
-    'usage: pw-run-reaped.mjs (-- <playwright args...> | <spec> <project> <jsonOut> | ' +
+    'usage: pw-run-reaped.mjs (-- [playwright args...] | <spec> <project> <jsonOut> | ' +
@@ -1825,7 +1825,8 @@ const sweepMode = (root) => {
- * RUN. Pass-through (`-- <args>`) appends args to `pnpm exec playwright test`; the legacy
+ * RUN. Pass-through (`-- [args]`) appends args to `pnpm exec playwright test`; an EMPTY list is the
+ * bare invocation, every project the config declares (frontend `test:e2e`, P101-01). The legacy
@@ -1844,7 +1845,6 @@ export const runMode = (
-    if (pwArgs.length === 0) usage()
$ for f in scripts/pw-run-reaped.mjs frontend/playwright.config.ts frontend/package.json; do git rev-parse --short 38d2e6f8b:$f ab7e9f36f:$f; done
scripts/pw-run-reaped.mjs 38d2e6f8b=29b944a29 ab7e9f36f=ddcff3f62
frontend/playwright.config.ts 38d2e6f8b=7e583c9f3 ab7e9f36f=7e583c9f3
frontend/package.json 38d2e6f8b=9b7c9c101 ab7e9f36f=64cb694bb
```

The wrapper differs from `ab7e9f36f` in only the four hunks above: one line of code and three comment/string
edits. None of them touches `reapLeakedSession`. The config blob is identical (`7e583c9f3` at both commits), and
`package.json` differs by the one `test:e2e` line. The drill in §3 ran at `38d2e6f8b`, after all of these
changes.

## 2. Verification commands (verbatim)

### 2.1 Discovery under the new config (`--list` starts no server)

Run from `frontend/` under `bash -c`, printing the `Error`/`Total` lines and Playwright's exit code:

```
$ pnpm exec playwright test e2e/direction-portals.spec.ts --project=chromium --list
Total: 5 tests in 1 file
exit=0
$ pnpm exec playwright test --project=a11y --list
Total: 182 tests in 13 files
exit=0
$ pnpm exec playwright test --list
Error: Cannot find package '@faker-js/faker' imported from /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/frontend/tests/e2e/sla-tracking.spec.ts
Error: test file "e2e/dashboard-a11y.spec.ts" should not import test file "e2e/dashboard.spec.ts"
Error: test file "e2e/dashboard-responsive.spec.ts" should not import test file "e2e/dashboard.spec.ts"
Error: test file "e2e/dashboard-rtl.spec.ts" should not import test file "e2e/dashboard.spec.ts"
Error: test file "e2e/dashboard-visual.spec.ts" should not import test file "e2e/dashboard.spec.ts"
Total: 0 tests in 0 files
exit=1
$ pnpm exec playwright test e2e/direction-portals.spec.ts a11y/dossiers-a11y.spec.ts --list
Total: 21 tests in 2 files
exit=0
$ pnpm exec playwright test e2e/direction-portals.spec.ts a11y/dossiers-a11y.spec.ts --project=chromium --list
Total: 5 tests in 1 file
exit=0
```

- The PLAN's two counts reproduce: **5** (direction-portals) and **182 in 13 files** (a11y).
- The bare `--list`, which is what `test:e2e` passes through, lists **0**, with five load errors. It prints the same
  lines on every run, so it is a deterministic zero, not the intermittent one in RESEARCH §10.4. The control beside
  it: with file filters, which never load the offending specs, the same config lists 5, 182 and 21.
- The last two commands are the discriminating pair for "full project set":
  - bare selection over two filters spanning two projects lists **21** (5 from `chromium` + 16 from `a11y`);
  - the same filters with `--project=chromium` list **5**.

  The bare form is what `test:e2e` now passes through.

### 2.2 The empty Playwright argument list, before and after

Before, the wrapper at `63ef60dad` (the plan commit, pre-change blob extracted with `git show`), run from
`frontend/`:

```
$ node <scratch>/wrapper-63ef60dad.mjs --
usage: pw-run-reaped.mjs (-- <playwright args...> | <spec> <project> <jsonOut> | --lease-exec -- <cmd...> | --sweep <root>)
exit=2
```

After, at the working tree that became `38d2e6f8b`: `pnpm test:e2e` from `frontend/`. The wrapper's and
Playwright's command lines were sampled every 100 ms while it ran:

```
$ pnpm test:e2e

> intake-frontend@1.0.0 test:e2e /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/frontend
> node ../scripts/pw-run-reaped.mjs --

pw-run-reaped: report archived outside the worktree -> /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-11T03-42-01-553Z-pw-reaped-0805a2e45a0f5d8c8b55ccc52bda2ead.json
pw-run-reaped: playwright exited code=1 signal=null; group 83527 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session already-empty; verdict clean; report published; child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/frontend/test-results/pw-reaped-0805a2e45a0f5d8c8b55ccc52bda2ead.json.log
 ELIFECYCLE  Command failed with exit code 1.
pnpm test:e2e exit=1
== distinct wrapper/playwright command lines sampled every 100 ms (count = samples)
  52 node ../scripts/pw-run-reaped.mjs --
  44 node ../scripts/pw-run-reaped.mjs --lease-exec -- env NODE_ENV=development pnpm dev
  49 node /opt/homebrew/bin/pnpm exec playwright test --reporter=json
== pre-run: 5173=0 leases_frontend=0   post-run: 5173=0 leases_frontend=0
```

- The run spawned **`pnpm exec playwright test --reporter=json`**: no project filter and no file filter, which is
  bare `playwright test`. The lease writer was invoked through the new `webServer.command`.
- The wrapper's exit is Playwright's own **1**, with `verdict clean; report published`. Playwright failed on the
  same load errors that §2.1's bare `--list` shows.
- `5173` and `frontend/.pw-leases` read 0 both before and after.

The published report (`frontend/test-results/pw-reaped-0805a2e45a0f5d8c8b55ccc52bda2ead.json`):

```
$ node -e '…r.config.projects.map(p=>p.name) / r.errors / r.stats / r.suites.length…'
projects: ["chromium","chromium-dashboard-widgets","chromium-no-auth","a11y"]
errors: 10 [
 "ReferenceError: __dirname is not defined in ES module scope",
 "ReferenceError: __dirname is not defined in ES module scope",
 "ReferenceError: __dirname is not defined in ES module scope",
 "ReferenceError: __dirname is not defined in ES module scope",
 "Error: Cannot find package '@faker-js/faker' imported from /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees",
 "ReferenceError: __dirname is not defined in ES module scope",
 "Error: test file \"e2e/dashboard-a11y.spec.ts\" should not import test file \"e2e/dashboard.spec.ts\"",
 "Error: test file \"e2e/dashboard-responsive.spec.ts\" should not import test file \"e2e/dashboard.spec.ts\"",
 "Error: test file \"e2e/dashboard-rtl.spec.ts\" should not import test file \"e2e/dashboard.spec.ts\"",
 "Error: test file \"e2e/dashboard-visual.spec.ts\" should not import test file \"e2e/dashboard.spec.ts\""
]
stats: {"startTime":"2026-09-11T03:41:54.284Z","duration":7029.246999999999,"expected":0,"skipped":0,"unexpected":0,"flaky":0}
suites: 0
```

The report was also archived to `<main checkout>/.pw-reports/2026-09-11T03-42-01-553Z-pw-reaped-0805a2e45a0f5d8c8b55ccc52bda2ead.json`
(§3.4). The child-output `.json.log` the finish line names was not on disk afterwards. The wrapper opens it before
spawning, and Playwright's output-dir cleanup at start then removes it. This is the known shape noted in §3.4.

### 2.3 `node --check`, and the re-census logic check

```
$ node --check scripts/pw-run-reaped.mjs
node --check: ok
```

The logic of the F3 re-census, both the exclusion and the preserved fail-closed refusal, was measured by run 0081's
fake-runner check (S0–S9) against blob `ddcff3f62` (`ab7e9f36f`). That check was 10/10, and its negative control
against the pre-probe blob failed S1/S6/S7/S9. §1.4 shows that `reapLeakedSession` is unchanged since `ab7e9f36f`,
so that measurement carries to `38d2e6f8b`.

The only copy of the check that survives on disk is 0081's scratchpad `attr-check.mjs`. It is the ATTEMPT-1 version
(6 scenarios, written before the probe existed), and its fake runner does not answer `ps -o stat= -p <pid>`. Re-run
against the committed blob, it fails S1 by construction: `probeProcess` reads the unanswered call as `unavailable`,
and the arm correctly refuses.

```
$ node <scratch>/attr-check.mjs $WT/scripts/pw-run-reaped.mjs
ok S0 control, both readable: outcome=reaped zero=true signals=[[-1001,"SIGTERM"],[-1002,"SIGTERM"]] censuses=4 10ms
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
+ 'refused'
- 'reaped'
attr-check exit=1
```

That is a mismatch between that instrument and the repair, not a finding against the wrapper. The extended S0–S9
check is not on disk, so it was not re-run. No test file is in this plan's scope (RULING-P99-84 §5, no selftest
resurrection). The drill's SIGKILL+sweep repeats in §3 are the real measurement of the arm at `38d2e6f8b`.

## 3. The planted-session drill

**How it was run.** The three `oracle: command` blocks were extracted from this PLAN's front-matter with js-yaml,
byte-identical:

| file | selector line | bytes | md5 |
| ---- | ------------- | ----- | --- |
| o1.sh | `CFGS="frontend"; PH="A INT TERM HUP KILL F"` | 10589 | `bcce72aebeb496b8be55c4e0e6299ae1` |
| o2.sh | `CFGS="root"; PH="A INT TERM HUP"` | 10578 | `4a4117949ee8ffeb3ae0d013a53cdd4f` |
| o3.sh | `CFGS="root"; PH="KILL F"` | 10570 | `a782f156d55b362cd10602e03cf36e58` |

- They ran one after another, never concurrently, each as `bash -c "$(cat oN.sh)"` from the worktree root.
- A segment runner wrapped each oracle and copied every lease file the wrapped runs wrote. Leases are deleted at
  finish, so the copy ran as a 100 ms side loop that died with the runner.
- The oracle text itself was not modified.
- The `SEGMENT-START … md5=… HEAD=…` and `SEGMENT-END … ORACLE-EXIT=` lines, and the `== at rest` lines, are the
  runner's. Every line between START and END is the oracle's own output. The md5 and HEAD on each START line tie
  that segment to the byte-identical oracle and to `38d2e6f8b`.

**At rest before the drill.** The first line of §3.1 below is this reading.
- `5173` and `5001` listeners were 0, and neither root had a `.pw-leases` entry.
- `strays=1` came from a `pgrep -f 'pw-run-reaped|playwright test|vite'` that matches its own invoking shell,
  because the pattern text is in that shell's argv.
- A later self-excluding census, with every match resolved to its command and cwd, found only the census shell and
  this worker's own `claude` process (§3.5).
- No wrapper, Playwright or vite process was up, and the oracle's own precheck (`5173` free) passed.

### 3.1 frontend — oracle 1 (A, SIGINT, SIGTERM, SIGHUP, SIGKILL+sweep ×3, F), verbatim

```
== at rest before: 5173=0 5001=0 leases_root=0 leases_frontend=0 strays=1
SEGMENT-START 2026-09-11T06:43:10+0300 o1.sh md5=bcce72aebeb496b8be55c4e0e6299ae1 HEAD=38d2e6f8b
P101-01-DRILL logs: /var/folders/xz/s67kmj4x68n4qlkkbrvfhvfr0000gn/T//p101-01-drill.tbjyUD
P101-01-DRILL frontend A normal: lease=988da0735cfe5754942519569333262e.lease sid=87249 members_live=3 port_live=1 | rc=0 members_after=0 leases_after=0 port_after=0 reports_published=1 (want rc in 0/1 members_live>=1 port_live>=1 members_after=0 leases_after=0 port_after=0 reports=1)
P101-01-DRILL frontend SIGINT: sid=88615 members_live=4 port_live=1 | rc=1 members_after=0 leases_after=0 port_after=0 (want live>=1 and all after=0)
P101-01-DRILL frontend SIGTERM: sid=89254 members_live=4 port_live=1 | rc=1 members_after=0 leases_after=0 port_after=0 (want live>=1 and all after=0)
P101-01-DRILL frontend SIGHUP: sid=89880 members_live=4 port_live=1 | rc=1 members_after=0 leases_after=0 port_after=0 (want live>=1 and all after=0)
P101-01-DRILL frontend SIGKILL 1/3: sid=90540 wrapper_rc=137 orphan_members=4 orphan_leases=1 | sweep_rc=0 members_after=0 leases_after=0 port_after=0 (want wrapper_rc=137 orphan_members>=1 orphan_leases=1 sweep_rc=0 all after=0; a sweep refusal here is the teardown race this task fixes in the wrapper)
  SWEEP pw-run-reaped --sweep /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/frontend: {"root":"/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/frontend","swept":[{"lease":"9f8163d245bf5af632068eae6c4cec97.lease","sid":90540,"outcome":"reaped","startedWith":4}],"skipped":[],"failed":[]}

P101-01-DRILL frontend SIGKILL 2/3: sid=91743 wrapper_rc=137 orphan_members=4 orphan_leases=1 | sweep_rc=0 members_after=0 leases_after=0 port_after=0 (want wrapper_rc=137 orphan_members>=1 orphan_leases=1 sweep_rc=0 all after=0; a sweep refusal here is the teardown race this task fixes in the wrapper)
  SWEEP pw-run-reaped --sweep /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/frontend: {"root":"/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/frontend","swept":[{"lease":"0db1e1a4ec1938171fde1aca7426a427.lease","sid":91743,"outcome":"reaped","startedWith":4}],"skipped":[],"failed":[]}

P101-01-DRILL frontend SIGKILL 3/3: sid=92949 wrapper_rc=137 orphan_members=4 orphan_leases=1 | sweep_rc=0 members_after=0 leases_after=0 port_after=0 (want wrapper_rc=137 orphan_members>=1 orphan_leases=1 sweep_rc=0 all after=0; a sweep refusal here is the teardown race this task fixes in the wrapper)
  SWEEP pw-run-reaped --sweep /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/frontend: {"root":"/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/frontend","swept":[{"lease":"b58545780cd23e1f359f0f315d4ff4ae.lease","sid":92949,"outcome":"reaped","startedWith":4}],"skipped":[],"failed":[]}

P101-01-DRILL frontend F try 1 foreign-holder: sid=94127 members_live=2 | rc=90 reports_published=0 unclean_retained=1 bystander=alive arm=[not ours to touch,unclean,verdict,] (want members_live>=1 rc=90 reports=0 bystander=alive; vite winning the port = inconclusive, retried)
P101-01-DRILL frontend F recovery: sweep_rc=0 leases_after=0 port_after=0 (want 0 0 0)
PASS frontend phases [A INT TERM HUP KILL F]
SEGMENT-END 2026-09-11T06:47:35+0300 ORACLE-EXIT=0
== at rest after: 5173=0 5001=0 leases_root=0 leases_frontend=0
```

The wrapper's own finish line per phase, taken from the drill log dir the oracle printed
(`/var/folders/xz/s67kmj4x68n4qlkkbrvfhvfr0000gn/T/p101-01-drill.tbjyUD`, `grep -E '^pw-run-reaped'`):

```
-- frontend-A.log (672 bytes)
pw-run-reaped: report archived outside the worktree -> /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-11T03-43-26-361Z-pw-reaped-988da0735cfe5754942519569333262e.json
pw-run-reaped: playwright exited code=0 signal=null; group 87196 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session already-empty; verdict clean; report published; child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/frontend/test-results/pw-reaped-988da0735cfe5754942519569333262e.json.log
-- frontend-INT.log (649 bytes)
pw-run-reaped: report archived outside the worktree -> /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-11T03-43-30-846Z-pw-reaped-f0473bf00b6e7682e2313683674050c2.json
pw-run-reaped: caught SIGINT; group 88570 -> {"termed":true,"killed":false,"alreadyGone":false,"unavailable":false,"identityMismatch":false,"finalZero":true}; session already-empty; verdict clean; report published; child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/frontend/test-results/pw-reaped-f0473bf00b6e7682e2313683674050c2.json.log
-- frontend-TERM.log (650 bytes)
pw-run-reaped: report archived outside the worktree -> /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-11T03-43-35-302Z-pw-reaped-55380ecfbcc6a1990a12ac82e5e73905.json
pw-run-reaped: caught SIGTERM; group 89214 -> {"termed":true,"killed":false,"alreadyGone":false,"unavailable":false,"identityMismatch":false,"finalZero":true}; session already-empty; verdict clean; report published; child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/frontend/test-results/pw-reaped-55380ecfbcc6a1990a12ac82e5e73905.json.log
-- frontend-HUP.log (649 bytes)
pw-run-reaped: report archived outside the worktree -> /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-11T03-43-39-763Z-pw-reaped-5a7840baec722c25024b10f09b9a2f41.json
pw-run-reaped: caught SIGHUP; group 89836 -> {"termed":true,"killed":false,"alreadyGone":false,"unavailable":false,"identityMismatch":false,"finalZero":true}; session already-empty; verdict clean; report published; child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/frontend/test-results/pw-reaped-5a7840baec722c25024b10f09b9a2f41.json.log
-- frontend-KILL.log (0 bytes)
-- frontend-F.log (595 bytes)
pw-run-reaped: playwright exited code=1 signal=null; group 94047 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session already-empty; verdict unclean; causes ["refused: gate-port holder(s) [94213] are NOT in the leased session 94127 — not ours to touch"]; report WITHHELD (.unclean.json); child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/frontend/test-results/pw-reaped-b4d06b27a72faec397c9364ab6bcc7fd.json.log
```

- **Phase A, normal.** The lease appeared, sid 87249 censused **3** members while 5173 held **1** listener, and the
  run exited **0** (Playwright's own). One report was published, and afterwards members, leases and port all read 0.
- **SIGINT / SIGTERM / SIGHUP.** Each censused **4** live members with 5173 held, then read 0 / 0 / 0 after the
  signal. The wrapper exited **1** (Playwright's own exit after the interrupt, verdict clean, report published).
  Playwright's own webServer teardown had emptied the session, so the finish census found it `already-empty` and
  verified that zero independently.
- **SIGKILL ×3.** Each was a real orphan: **4** members, **1** lease on disk, wrapper exit **137**. Each `--sweep`
  exited **0** with `reaped` (`startedWith 4`) and `"failed":[]`, then read 0 / 0 / 0. The KILL log is 0 bytes
  because the wrapper was SIGKILLed before its finisher could write.
- **F, foreign holder.** The conclusive sample came on try 1: the leased sid 94127 censused **2** members alive, the
  run exited **90**, **0** reports were published, **1** unclean report was retained, and the bystander stayed
  **alive**. The refusal arm is `arm=[not ours to touch,unclean,verdict,]`. The wrapper log names it:
  `refused: gate-port holder(s) [94213] are NOT in the leased session 94127 — not ours to touch`. That is the
  holderVerdict arm (a NEW gate-port holder outside the leased session at finish), and the report was WITHHELD.
  The recovery `--sweep` exited 0 and left 0 / 0.

**One frontend lease** (phase A, copied while the phase was live):

```json
{"nonce":"988da0735cfe5754942519569333262e","sid":87249,"reason":null,"pid":87249,"pgid":87249,"lstart":"Fri Sep 11 06:43:11 2026","cwd":"/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/frontend","root":"/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/frontend","wrapperPid":87063,"wrapperStart":"Fri Sep 11 06:43:10 2026","writtenAt":"2026-09-11T03:43:11.216Z"}
```

`pid` = `pgid` = `sid` = 87249 is the lease writer as session leader. `cwd` and `root` are the worktree's
`frontend/`, the root run mode used when launched from `frontend/`. The wrapper that minted it is `wrapperPid`
87063. Eight frontend leases were copied in all, one per wrapped run: A, INT, TERM, HUP, KILL ×3 and F. All of them
share this shape.

### 3.2 root — oracles 2 (A, SIGINT, SIGTERM, SIGHUP) and 3 (SIGKILL+sweep ×2, F), verbatim

```
SEGMENT-START 2026-09-11T06:47:54+0300 o2.sh md5=4a4117949ee8ffeb3ae0d013a53cdd4f HEAD=38d2e6f8b
P101-01-DRILL logs: /var/folders/xz/s67kmj4x68n4qlkkbrvfhvfr0000gn/T//p101-01-drill.Xi0hvL
P101-01-DRILL root A normal: lease=e103908c42d8d07eed944bfe23cfddcd.lease sid=9369 members_live=5 port_live=1 | rc=0 members_after=0 leases_after=0 port_after=0 reports_published=1 (want rc in 0/1 members_live>=1 port_live>=1 members_after=0 leases_after=0 port_after=0 reports=1)
P101-01-DRILL root SIGINT: sid=11944 members_live=15 port_live=1 | rc=90 members_after=0 leases_after=0 port_after=0 (want live>=1 and all after=0)
P101-01-DRILL root SIGTERM: sid=14551 members_live=15 port_live=1 | rc=90 members_after=0 leases_after=0 port_after=0 (want live>=1 and all after=0)
P101-01-DRILL root SIGHUP: sid=17057 members_live=15 port_live=1 | rc=90 members_after=0 leases_after=0 port_after=0 (want live>=1 and all after=0)
PASS root phases [A INT TERM HUP]
SEGMENT-END 2026-09-11T06:48:32+0300 ORACLE-EXIT=0
== at rest after: 5173=0 5001=0 leases_root=0 leases_frontend=0
```

```
SEGMENT-START 2026-09-11T06:48:32+0300 o3.sh md5=a782f156d55b362cd10602e03cf36e58 HEAD=38d2e6f8b
P101-01-DRILL logs: /var/folders/xz/s67kmj4x68n4qlkkbrvfhvfr0000gn/T//p101-01-drill.ZlvJc6
P101-01-DRILL root SIGKILL 1/2: sid=19626 wrapper_rc=137 orphan_members=15 orphan_leases=1 | sweep_rc=0 members_after=0 leases_after=0 port_after=0 (want wrapper_rc=137 orphan_members>=1 orphan_leases=1 sweep_rc=0 all after=0; a sweep refusal here is the teardown race this task fixes in the wrapper)
  SWEEP pw-run-reaped --sweep /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01: {"root":"/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01","swept":[{"lease":"ea0a6ff874bd84c66bafae32afbe0212.lease","sid":19626,"outcome":"reaped","startedWith":15}],"skipped":[],"failed":[]}

P101-01-DRILL root SIGKILL 2/2: sid=21988 wrapper_rc=137 orphan_members=15 orphan_leases=1 | sweep_rc=0 members_after=0 leases_after=0 port_after=0 (want wrapper_rc=137 orphan_members>=1 orphan_leases=1 sweep_rc=0 all after=0; a sweep refusal here is the teardown race this task fixes in the wrapper)
  SWEEP pw-run-reaped --sweep /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01: {"root":"/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01","swept":[{"lease":"d4cedd545ea1aa654813d91dc24d2700.lease","sid":21988,"outcome":"reaped","startedWith":15}],"skipped":[],"failed":[]}

P101-01-DRILL root F try 1 foreign-holder: sid=24212 members_live=2 | rc=90 reports_published=0 unclean_retained=1 bystander=alive arm=[not ours to touch,unclean,verdict,] (want members_live>=1 rc=90 reports=0 bystander=alive; vite winning the port = inconclusive, retried)
P101-01-DRILL root F recovery: sweep_rc=0 leases_after=0 port_after=0 (want 0 0 0)
PASS root phases [KILL F]
SEGMENT-END 2026-09-11T06:51:58+0300 ORACLE-EXIT=0
== at rest after: 5173=0 5001=0 leases_root=0 leases_frontend=0
```

Wrapper finish lines, from the two drill log dirs (`p101-01-drill.Xi0hvL` for o2, `p101-01-drill.ZlvJc6` for o3):

```
-- root-A.log (655 bytes)
pw-run-reaped: report archived outside the worktree -> /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-11T03-48-06-035Z-pw-reaped-e103908c42d8d07eed944bfe23cfddcd.json
pw-run-reaped: playwright exited code=0 signal=null; group 9137 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session reaped; verdict clean; report published; child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/test-results/pw-reaped-e103908c42d8d07eed944bfe23cfddcd.json.log
-- root-INT.log (784 bytes)
pw-run-reaped: caught SIGINT; group 11892 -> {"termed":true,"killed":false,"alreadyGone":false,"unavailable":false,"identityMismatch":false,"finalZero":true}; session reaped; verdict unclean; causes ["unavailable: pending report /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/test-results/pw-reaped-d63147348b3fcf9f04a5b27e2161e0ef.json.pending-d63147348b3fcf9f04a5b27e2161e0ef is missing — a missing pending report is unproven, never clean"]; report ABSENT; child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/test-results/pw-reaped-d63147348b3fcf9f04a5b27e2161e0ef.json.log
-- root-TERM.log (785 bytes)
pw-run-reaped: caught SIGTERM; group 14515 -> {"termed":true,"killed":false,"alreadyGone":false,"unavailable":false,"identityMismatch":false,"finalZero":true}; session reaped; verdict unclean; causes ["unavailable: pending report /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/test-results/pw-reaped-22d195c7ab033db0eed5a7747b10c557.json.pending-22d195c7ab033db0eed5a7747b10c557 is missing — a missing pending report is unproven, never clean"]; report ABSENT; child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/test-results/pw-reaped-22d195c7ab033db0eed5a7747b10c557.json.log
-- root-HUP.log (784 bytes)
pw-run-reaped: caught SIGHUP; group 17010 -> {"termed":true,"killed":false,"alreadyGone":false,"unavailable":false,"identityMismatch":false,"finalZero":true}; session reaped; verdict unclean; causes ["unavailable: pending report /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/test-results/pw-reaped-da2562aba4562df018dffe2814a32557.json.pending-da2562aba4562df018dffe2814a32557 is missing — a missing pending report is unproven, never clean"]; report ABSENT; child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/test-results/pw-reaped-da2562aba4562df018dffe2814a32557.json.log
-- root-KILL.log (0 bytes)
-- root-F.log (579 bytes)
pw-run-reaped: playwright exited code=1 signal=null; group 23971 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session reaped; verdict unclean; causes ["refused: gate-port holder(s) [24300] are NOT in the leased session 24212 — not ours to touch"]; report WITHHELD (.unclean.json); child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01/test-results/pw-reaped-59d594e30a62bd4885d24faa3dd83e7c.json.log
```

- **Phase A, normal.** sid 9369 censused **5** members with 5173 held. The run exited **0**, the session was
  `reaped` at finish, and one report was published. Afterwards everything read 0.
- **SIGINT / SIGTERM / SIGHUP.** Each censused **15** live members with 5173 held, and each read 0 / 0 / 0 after the
  signal: the session was `reaped` at finish. The wrapper exited **90** each time. The interrupted root Playwright
  wrote no pending JSON report, and the wrapper holds that "a missing pending report is unproven, never clean", so
  the report is ABSENT. The oracle's want for these phases is the live reading plus zero survivors, and both hold.
  The frontend config, interrupted the same way, did write its report (§3.1). The difference is recorded, not
  changed (§5).
- **SIGKILL ×2.** Each was a real orphan: **15** members, **1** lease, wrapper exit **137**. Each `--sweep` exited
  **0** with `reaped` (`startedWith 15`) and `"failed":[]`, then read 0 / 0 / 0.
- **F, foreign holder.** Try 1 was conclusive: sid 24212 censused **2** members alive, exit **90**, **0** reports
  published, **1** unclean report retained, and the bystander **alive**. The arm was the same holderVerdict
  refusal: `gate-port holder(s) [24300] are NOT in the leased session 24212`. The recovery `--sweep` exited 0.

**One root lease** (phase A, copied while the phase was live):

```json
{"nonce":"e103908c42d8d07eed944bfe23cfddcd","sid":9369,"reason":null,"pid":9369,"pgid":9369,"lstart":"Fri Sep 11 06:47:55 2026","cwd":"/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01","root":"/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-01","wrapperPid":9055,"wrapperStart":"Fri Sep 11 06:47:54 2026","writtenAt":"2026-09-11T03:47:55.907Z"}
```

Seven root leases were copied in all: A, INT, TERM, HUP, KILL ×2 and F.

### 3.3 The exit code of every wrapper invocation

| config | invocation | wrapper exit | report | sweep |
| ------ | ---------- | ------------ | ------ | ----- |
| frontend | A normal | **0** | 1 published | — |
| frontend | SIGINT | **1** | published | — |
| frontend | SIGTERM | **1** | published | — |
| frontend | SIGHUP | **1** | published | — |
| frontend | SIGKILL 1/3 | **137** | — (finisher never ran) | `--sweep` **0**, `reaped` 4 |
| frontend | SIGKILL 2/3 | **137** | — | `--sweep` **0**, `reaped` 4 |
| frontend | SIGKILL 3/3 | **137** | — | `--sweep` **0**, `reaped` 4 |
| frontend | F try 1 | **90** | 0 published, 1 unclean retained | recovery `--sweep` **0** |
| root | A normal | **0** | 1 published | — |
| root | SIGINT | **90** | absent (no pending report) | — |
| root | SIGTERM | **90** | absent | — |
| root | SIGHUP | **90** | absent | — |
| root | SIGKILL 1/2 | **137** | — | `--sweep` **0**, `reaped` 15 |
| root | SIGKILL 2/2 | **137** | — | `--sweep` **0**, `reaped` 15 |
| root | F try 1 | **90** | 0 published, 1 unclean retained | recovery `--sweep` **0** |

Outside the drill:
- `node <pre-change wrapper> --` exited **2** (usage);
- `pnpm test:e2e` (`… --`, empty list) exited **1** (Playwright's own, clean verdict);
- the ad-hoc `--lease-exec` exited **0** (§4.1).

### 3.4 After the drill: reports, retained unclean files, and the planted sids

The archived reports for the clean runs sit under the main checkout's `.pw-reports/`. Each wrapped run's Playwright
cleans `test-results/` at start, so the in-worktree copies do not survive:

```
$ ls <main>/.pw-reports/ | grep -E '<the nonces of this session>'
2026-09-11T03-42-01-553Z-pw-reaped-0805a2e45a0f5d8c8b55ccc52bda2ead.json
2026-09-11T03-43-26-361Z-pw-reaped-988da0735cfe5754942519569333262e.json
2026-09-11T03-43-30-846Z-pw-reaped-f0473bf00b6e7682e2313683674050c2.json
2026-09-11T03-43-35-302Z-pw-reaped-55380ecfbcc6a1990a12ac82e5e73905.json
2026-09-11T03-43-39-763Z-pw-reaped-5a7840baec722c25024b10f09b9a2f41.json
2026-09-11T03-48-06-035Z-pw-reaped-e103908c42d8d07eed944bfe23cfddcd.json
```

The root A report (`e103908c…`) and the frontend A/INT/TERM/HUP reports are there, as is the §2.2 empty-argument
run (`0805a2e4…`). The two F runs (`b4d06b27…`, `59d594e3…`) have no archived report, because theirs was withheld.
The root INT/TERM/HUP runs have none either, because theirs was absent. What is left in `test-results/`:

```
$ ls frontend/test-results test-results
frontend/test-results:
pw-reaped-b4d06b27a72faec397c9364ab6bcc7fd.json.unclean-b4d06b27a72faec397c9364ab6bcc7fd.json

test-results:
pw-reaped-59d594e30a62bd4885d24faa3dd83e7c.json.unclean-59d594e30a62bd4885d24faa3dd83e7c.json
signature-visuals-a11y-37--2f73b-main-shell-with-splash-open-chromium-en
```

That is exactly one retained unclean report per F run. The `signature-visuals-…` directory is the root spec's own
Playwright output.

### 3.5 At rest after, with the census that could have seen a non-zero

```
== at-rest census (self-excluding patterns) 06:52:47
5173=0 5001=0 leases_root=0 leases_frontend=0
control: own shell sid 53798 members=2 (want >=1)
planted sids: 87249:0 88615:0 89254:0 89880:0 90540:0 91743:0 92949:0 94127:0 9369:0 11944:0 14551:0 17057:0 19626:0 21988:0 24212:0
```

- The census is `os.getsid` over the full `ps -A` table: the oracle's own `M()` instrument, run once for every sid
  the drill planted.
- Its positive control, the census shell's own session, read **2**, so the instrument can see members.
- Every one of the 15 planted sessions read **0**.
- The same census line counted 3 processes matching the wrapper/playwright/vite pattern. Resolved to their command
  lines and cwds, they were:
  - the census's own `zsh -c` shell;
  - two transient children of that shell, gone before lookup;
  - this worker's own `claude` process, whose argv carries the task text.

  None was a dev stack, consistent with 5173 and 5001 both reading 0.

The drill's own grep over all three log dirs for the F3 arm and for pre-spawn sweep failures:

```
$ grep -c -e UNREADABLE -e "orphan sweep" <each drill log>   (o1 tbjyUD, o2 Xi0hvL, o3 ZlvJc6)
p101-01-drill.tbjyUD/frontend-A.log: 0
p101-01-drill.tbjyUD/frontend-F.log: 0
p101-01-drill.tbjyUD/frontend-HUP.log: 0
p101-01-drill.tbjyUD/frontend-INT.log: 0
p101-01-drill.tbjyUD/frontend-KILL.log: 0
p101-01-drill.tbjyUD/frontend-TERM.log: 0
p101-01-drill.Xi0hvL/root-A.log: 0
p101-01-drill.Xi0hvL/root-HUP.log: 0
p101-01-drill.Xi0hvL/root-INT.log: 0
p101-01-drill.Xi0hvL/root-TERM.log: 0
p101-01-drill.ZlvJc6/root-F.log: 0
p101-01-drill.ZlvJc6/root-KILL.log: 0
```

## 4. Bounds

### 4.1 Ad-hoc invocations run UNLEASED and are NOT recoverable by the reaper

The drill proves the reaper for the sessions **it** planted on this machine.

A session started outside run mode, such as an ad-hoc `pnpm exec playwright test` under either config, reaches the
lease writer with no `PW_LEASE_*` env. The writer then warns, runs the stack UNLEASED, and writes no lease. That
session is therefore NOT recoverable by the reaper. Neither `--sweep <root>` nor the next run's pre-spawn sweep can
attribute it, because `sweepLeases` walks lease files only. The wrapper warns, and the bound is exactly that. It is
not a recovery claim.

Measured without starting a dev stack:

```
$ env -u PW_LEASE_NONCE -u PW_LEASE_DIR -u PW_LEASE_ROOT node scripts/pw-run-reaped.mjs --lease-exec -- true   (cwd: scratch dir)
pw-run-reaped --lease-exec: PW_LEASE_* env absent — running UNLEASED (ad-hoc invocation)
exit=0
lease files written under the scratch dir: 0  (.pw-leases dir present: no)
$ grep -n "readdirSync(dir).filter((f) => f.endsWith('.lease'))" scripts/pw-run-reaped.mjs
1121:    files = readdirSync(dir).filter((f) => f.endsWith('.lease'))
```

The `leaseExecMode` doc comment used to say "recovery for that path is `--sweep`". It now states this bound (§1.3).
That edit is in `38d2e6f8b`, before the drill.

### 4.2 Descriptor growth (CARRY-10) is bounded by this drill's census, not by an fd count

Descriptors are held by live processes. A session with zero live members holds none: zombies hold none, and the
census excludes them. A port with zero listeners holds no listening socket.

For every session the drill planted, it first took a live reading: the sid censused ≥ 1 member through `os.getsid`
over the full `ps -A` table, and, outside phase F, 5173 held ≥ 1 listener. After the normal, interrupted and
SIGKILL+sweep paths it then read members 0, leases 0 and `5173` listeners 0 (§3.1, §3.2). All 15 planted sids still
read 0 at rest, beside a control that read 2 (§3.5).

Descriptor growth from drill-planted sessions is therefore bounded at zero surviving holders **by that census**. No
fd count (`lsof -p … | wc -l`) was taken, and none is claimed. The bound does not extend to unleased ad-hoc sessions
(§4.1), which the census cannot attribute.

### 4.3 `--sweep` refusals under the wrapper's fail-closed F3 arm during this drill

- **Frequency: 0 of 7.** All 7 `--sweep` invocations exited 0:
  - frontend SIGKILL ×3 (`reaped`, startedWith 4, `"failed":[]`);
  - frontend F recovery;
  - root SIGKILL ×2 (`reaped`, startedWith 15, `"failed":[]`);
  - root F recovery.

  No run-mode finish line cites the F3 arm, and none cites an orphan-sweep failure (§3.5 grep). The unclean causes
  that did appear were the two phase-F foreign holders and the three root interrupted runs' missing pending reports.
- **Recovery that followed:** none was needed. If the arm fires, recovery is unchanged: the lease is retained, and
  the next `--sweep`, or the next wrapped run's pre-spawn sweep, consumes it.
- **What these samples show.** Run 0080 met the arm in 1 of 2 root SIGKILL samples. At `38d2e6f8b` the count is 0 of
  2 for root and 0 of 3 for frontend. Five samples do not establish a rate, and none is claimed.
- **What the drill cannot show.** The re-census leaves no trace when it excludes a member, so the drill cannot show
  whether the arm executed in a given sample. It measures the outcome: zero refusals and zero survivors. The arm's
  logic, the exclusion and the preserved refusal alike, is measured by the fake-runner check (§2.3).
- The F3 arm stays fail-closed by construction. The whole session is refused when:
  - a member is still live after 5 × 200 ms with an unreadable cwd;
  - the re-census is unavailable;
  - a member absent from the re-census is still live outside its bound tuple;
  - the pid probe is unavailable.

  Only a pid that probes positively `dead` is excluded.

## 5. Left for named later tasks

- **Bare `test:e2e` (and any unfiltered `--project=chromium` run) collects 0 tests** in the frontend config. The
  cause is load errors (§2.1, §2.2):
  - `@faker-js/faker` is not resolvable from `tests/e2e/sla-tracking.spec.ts`;
  - four `e2e/dashboard-*.spec.ts` files import `e2e/dashboard.spec.ts`;
  - in a full run, five `__dirname is not defined in ES module scope`.

  This holds before and after this plan, and it does not come from the `webServer` change: `--list` never reads
  `webServer`. It goes to the spec plans (P101-05 family); these are not this plan's files.
- **Root interrupted runs exit 90** (the pending report is missing), while frontend interrupted runs publish (§3.2).
  This is the wrapper's documented composition ("a missing pending report is unproven, never clean"), and the drill
  requires zero survivors there, not an exit value. Recorded, not changed.
- **`e2e.yml`'s `qa-sweep` step runs `pnpm -C frontend test:qa-sweep`, so it now goes through the wrapper on Linux**
  (§1.2). The job sets `E2E_BASE_URL`, so no webServer starts and no lease is expected. P101-04 owns the workflows,
  and P101-07's `main` run is the first Linux observation (RESEARCH §10.5).
- **The re-census is silent when it excludes a member** (§4.3). If an operator needs to see it fire, the upgrade is
  a one-line stderr note in `attribute()`'s `EXITED` branch. It was not added, because nobody asked for it.
- **An unclean run retains its lease by design** (the unlink is gated on a clean verdict). In phase F the oracle's
  `wait_pw_gone` therefore waits out its 180 s bound before the recovery sweep. That is why o1 takes 265 s and o3
  206 s. Both are inside the 600 s cap.
- `graphify update .` was not run: it writes `graphify-out/`, which is outside this plan's `files_modified`.

## Deviations

None. Every changed path is in `files_modified`:
- `frontend/playwright.config.ts`
- `frontend/package.json`
- `scripts/pw-run-reaped.mjs`
- this SUMMARY

The oracle extracts, the segment runner, the copied leases and the pre-change wrapper blob live in the session
scratchpad, not the repo.
