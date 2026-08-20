#!/usr/bin/env node
/**
 * Run one Playwright invocation and REAP whatever it started — on the failure path as much as the
 * success path (RULING-P99-28 §4.1), now with CAUSAL ownership (RULING-P99-50, repairing F1–F7 of
 * CONSULT-REAPER-SAFETY-R1-REPORT.md).
 *
 * WHY. Playwright starts `webServer` with `detached: true`, which calls setsid() and creates a NEW
 * POSIX SESSION. Killing the process group we spawned cannot reach it; killing the port holder
 * frees the port and leaves its PORTLESS SESSION SIBLINGS alive forever. Measured live on this
 * machine 2026-08-19: one rendered execution left a 3-process session (sid 13546, all cwd inside
 * the task worktree, ports already free). Across 41 tasks and their retries that accumulated to
 * tens of thousands of held descriptors.
 *
 * HOW. Ownership is a SPAWN-TIME LEASE, never port timing, cwd timing, PID order, or ancestry
 * (F2). Before spawning, RUN mints a nonce and exports PW_LEASE_NONCE/PW_LEASE_DIR/PW_LEASE_ROOT
 * into the Playwright child env. `playwright.config.ts`'s webServer.command invokes this file's
 * `--lease-exec` mode, which writes `.pw-leases/<nonce>.lease` — its own pid/pgid/sid/lstart/cwd,
 * resolved INSIDE the web-server session — and then becomes the dev stack's session-leader parent
 * (Node has no exec(3); the writer stays alive exactly as long as the stack it supervises, which
 * keeps the recorded identities valid — the same shape launch-daemon.sh gets from shell `exec`).
 * Only the leased session is ever reaped. Port and cwd evidence is CORROBORATION: a new gate-port
 * holder with no matching lease is a REFUSAL, never a target.
 *
 * THE REAP. A session is never signalled as `kill(-sid)` — that signals only the process GROUP
 * numbered sid, and measured here a session held pgid 13751 under sid 13546, so kill(-13546)
 * would have hit NOTHING and, before F1, reported success. Every DISTINCT pgid in the session is
 * enumerated and signalled individually, over bounded rounds (TERM, TERM, KILL), each round
 * preceded by a fresh census that must revalidate every member's immutable identity tuple
 * {pid, pgid, lstart, cwd} (F4). There is NO bare-PID SIGKILL anywhere in this file. Any
 * unavailable census is `unavailable` and stops signalling (F1); any unreadable, unresolvable, or
 * out-of-root cwd refuses the WHOLE session (F3); any identity change refuses — we never follow
 * the number.
 *
 * THE VERDICT. Cleanup produces ONE verdict, a conjunction of positive observations:
 *   clean ⟺ every expected lease was found (or provably never started: no lease AND no new port
 *             holder)
 *          ∧ every leased session ended INDEPENDENTLY VERIFIED empty (reaped | already-empty)
 *          ∧ the directly-spawned Playwright group's identity still matched and its zero-members
 *            proof succeeded (repair 4, RULING-P99-60)
 *          ∧ no gate-port survivors and no foreign port holders, attributed by BIRTH IDENTITY
 *            (pid+canonical lstart, not pid alone — repair 5, RULING-P99-60)
 *          ∧ the pending report EXISTS and was published ATOMICALLY WITHOUT OVERWRITE to the final
 *            path (repair 1, RULING-P99-60 — CORRECTED: a missing pending report, or a final path
 *            that already exists, is UNCLEAN; there is no longer a "clean, no report" shape)
 *          ∧ no instrument returned unavailable at any point (including the pre-spawn orphan sweep)
 *   verdict === 'clean'  → exit = playwright's own exit code (0 stays 0; a real red stays red)
 *   verdict !== 'clean'  → exit = 90, and the pending report (if any) is MOVED to a NONCE-BOUND
 *                          <jsonOut>.unclean-<nonce>.json (repair 1, RULING-P99-64 — CORRECTED: the
 *                          prior shared <jsonOut>.unclean.json let one caller's failure overwrite a
 *                          DIFFERENT caller's retained evidence at the same final path). The SHARED
 *                          final `<jsonOut>` itself is NEVER deleted or moved by this wrapper, on ANY
 *                          code path, clean or not — not by startup, not by finish() (repair 1,
 *                          RULING-P99-66, REMOVING the "foreign-final quarantine" repairs 3/5/6/R8
 *                          built and repeatedly defended: this wrapper CANNOT distinguish a genuinely
 *                          foreign writer's file from a DIFFERENT SUPPORTED caller's own legitimate
 *                          final that happened to publish during this run's lifetime, and per the
 *                          ruling it does not need to — an occupied final simply makes atomic
 *                          no-overwrite publication (`publishReport`) refuse and this run exit
 *                          non-zero, which was always the correct, sufficient outcome).
 *   CORRECTED (RULING-P99-60 item 6): the supported consumer boundary is this repository's actual
 *   `&&` composition plus atomic no-overwrite publication — NOT a legacy `;`-separated caller. A
 *   semicolon-tail probe in this suite is diagnostic only; nothing here promises it "fails closed".
 *
 * EXIT PATHS (F6). Child exit/error, SIGINT, SIGTERM, SIGHUP (catchable on macOS; a disappearing
 * supervising terminal is exactly how a worker pane dies), uncaughtException and
 * unhandledRejection all route through one idempotent finisher. SIGKILL is UNcatchable — named
 * here because no in-process handler can ever cover it: the lease survives it, and RUN's
 * pre-spawn sweep plus `--sweep <root>` consume the orphan (Amendment 2: recovery is
 * product-owned, not an operator overlay).
 *
 * usage: node scripts/pw-run-reaped.mjs -- <playwright args...>      RUN (pass-through)
 *        node scripts/pw-run-reaped.mjs <spec> <project> <jsonOut>   RUN (legacy positional)
 *        node scripts/pw-run-reaped.mjs --lease-exec -- <cmd...>     LEASE WRITER (config-invoked)
 *        node scripts/pw-run-reaped.mjs --sweep <root>               ORPHAN RECOVERY
 */
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import {
  existsSync,
  linkSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, isAbsolute, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * LOCALE BINDING (repair A, RULING-P99-52). Every process-census subprocess this runtime owns
 * (ps, lsof, and the python3 that wraps os.getsid over a ps table) runs under LC_ALL=C/LANG=C.
 * The instrument is correct because it BINDS its own locale, not because the host is English:
 * under fr_FR/de_DE/ar_SA, `ps -o lstart=` prints non-ASCII weekday/month names that an English
 * regex cannot parse — measured live 2026-08-19, a French/Arabic census parsed to ZERO members
 * and was delivered as `already-empty` while two planted processes were still alive. Any census
 * row this file cannot parse invalidates the WHOLE census (unavailable), never a partial table.
 */
const CENSUS_ENV = Object.freeze({ ...process.env, LC_ALL: 'C', LANG: 'C', LC_TIME: 'C' })
const cOpts = (opts = {}) => ({ ...opts, env: CENSUS_ENV })

/**
 * TERM the group, then KILL any survivor. Returns what it observed, never throws.
 *
 * Repair 4 (RULING-P99-60), MADE MANDATORY by repair 2 (RULING-P99-62): the directly-spawned
 * Playwright group is signalled from the captured numeric pgid ALONE — that pgid equals the child's
 * own pid (Node's `detached: true` makes it its own session/group leader), so a PID reused by an
 * unrelated process after the original child died could inherit the SAME numeric pgid, and this code
 * would then signal an impostor group (Codex, CONSULT-REAPER-SAFETY-R6-REPORT.md item 4).
 * `expectedStart` is this run's OWN recorded birth identity for `pgid` (captured at spawn time, the
 * same way a lease writer captures its own).
 *
 * RULING-P99-60 still let `expectedStart === null` skip identity verification entirely ("DI
 * back-compat") — production group cleanup MAY NOT SIGNAL under that condition (Codex,
 * CONSULT-REAPER-SAFETY-R7-REPORT.md item 2: "line 144 treats expectedStart === null as safe").
 * Missing direct-child birth identity is now `unavailable`, enters the cleanup verdict via `seen`,
 * and sends ZERO group signals — there is no test-only bypass inside this function; every caller,
 * production or test, must supply a real captured/expected start.
 *
 * `signalFn(-pgid, 0)` (repair 4): a `kill(2)`-style probe collapsing every failure to "not alive"
 * conflated ESRCH (truly gone) with any OTHER error (EPERM, an unavailable signal path) — treating
 * an UNVERIFIABLE state as verified emptiness. Only `ESRCH` is `gone` unconditionally.
 *
 * RULING-P99-62 NARROWS (not widens) the one non-ESRCH exception RULING-P99-60 added: a bare
 * `probeProcess(pgid).state === 'dead'` is LEADER-LIVENESS evidence, not proof the process GROUP has
 * zero members — a group can outlive its leader (Codex, CONSULT-REAPER-SAFETY-R7-REPORT.md: "That is
 * leader-liveness evidence, not proof the process group has zero members"). The fallback to `gone` on
 * a non-ESRCH error now requires POSITIVE proof of BOTH: the group leader's CURRENT canonical start
 * still equals `expectedStart` exactly (so this is genuinely OUR OWN spawned leader, not an impostor
 * that happens to be a zombie), AND its state is zombie/dead. Any identity mismatch, unreadable
 * start, missing `expectedStart`, live state, or process-table failure is `unavailable`, never
 * `gone`. A FINAL positive `gone` proof is captured after the round completes — `seen.finalZero` — so
 * the caller has independent proof the group reached zero members, not merely that signals were sent.
 */
export const reapGroup = (pgid, { signalFn = process.kill, runner = execFileSync, waitMs = 1500, expectedStart = null } = {}) => {
  const seen = {
    termed: false,
    killed: false,
    alreadyGone: false,
    unavailable: false,
    identityMismatch: false,
    finalZero: false,
  }
  // Repair 2 (RULING-P99-62): checked FIRST, before even the initial signal-0 probe — with no
  // captured birth identity there is no basis to trust ANY observation about this pgid as "ours",
  // not even an unambiguous ESRCH. Zero signalFn calls of any kind occur past this point.
  if (expectedStart === null) {
    seen.unavailable = true
    return seen
  }
  const probeSignal = () => {
    try {
      signalFn(-pgid, 0)
      return 'alive'
    } catch (e) {
      if (e && e.code === 'ESRCH') return 'gone'
      // Repair 2 (RULING-P99-62): the ONLY permitted non-ESRCH `gone` fallback is identity-bound
      // zombie proof — missing `expectedStart` can never resolve to `gone` (it is exactly the
      // "missing direct-child birth identity" case the ruling requires stays `unavailable`), and a
      // dead/zombie leader whose current start does not match `expectedStart` is an impostor, not
      // proof of anything about OUR group.
      if (expectedStart === null) return 'unavailable'
      const p = probeProcess(pgid, { runner })
      if (p.state !== 'dead') return 'unavailable'
      return psLstart(pgid, { runner }) === expectedStart ? 'gone' : 'unavailable'
    }
  }
  // true = safe to signal; false = a LIVE impostor holds this pgid now; null = instrument failure OR
  // missing expectedStart (repair 2, RULING-P99-62 — direct-group identity is now mandatory: a
  // caller that never captured its own spawn-time birth identity gets `unavailable`, never a
  // permissive skip, and reapGroup sends zero signals as a result).
  const identityOk = () => {
    if (expectedStart === null) return null
    const p = probeProcess(pgid, { runner })
    if (p.state === 'unavailable') return null
    if (p.state === 'dead') return true // no live process to be an impostor
    return psLstart(pgid, { runner }) === expectedStart
  }
  // The INITIAL probe is the aliveness proof for the FIRST signal (TERM) — re-probing again with
  // zero elapsed time would only ask the same question twice. A fresh probe DOES happen before
  // KILL, since a meaningful wait (`waitMs`) separates it from TERM and the group may have already
  // died from that alone.
  let state = probeSignal()
  if (state === 'unavailable') {
    seen.unavailable = true
    return seen
  }
  if (state === 'gone') {
    seen.alreadyGone = true
    seen.finalZero = true
    return seen
  }
  for (const sig of ['SIGTERM', 'SIGKILL']) {
    const id = identityOk()
    if (id === null) {
      seen.unavailable = true
      return seen
    }
    if (id === false) {
      seen.identityMismatch = true
      return seen
    }
    try {
      signalFn(-pgid, sig)
      if (sig === 'SIGTERM') seen.termed = true
      else seen.killed = true
    } catch {
      /* raced to exit */
    }
    if (sig === 'SIGTERM') {
      const deadline = Date.now() + waitMs
      while (Date.now() < deadline) {
        // busy-wait is fine: this is a teardown path measured in a second, not a hot loop
      }
      state = probeSignal()
      if (state === 'unavailable') {
        seen.unavailable = true
        return seen
      }
      if (state === 'gone') {
        seen.finalZero = true
        return seen
      }
    }
  }
  const final = probeSignal()
  seen.finalZero = final === 'gone'
  if (final === 'unavailable') seen.unavailable = true
  return seen
}

/**
 * The ports a rendered gate's webServer occupies. A PARAMETER, not a constant, so the drill can
 * exercise this code with real processes on a throwaway port instead of fighting a live run for
 * 5173 — the property under test is the process TOPOLOGY and the ATTRIBUTION rule, never the
 * port number.
 */
export const GATE_PORTS = [5173, 5001]

/**
 * pids listening on a port — TRI-STATE (repair C, RULING-P99-52). Returns an array of pids,
 * or NULL when the instrument is unavailable. ONLY `lsof` exit 1 with empty stdout is a valid
 * empty population (the documented no-match case); every other failure — execution error,
 * permission denial, exit >1, non-numeric output — is NULL: "I could not look" must never be
 * delivered as "nobody is there" (a thrown lsof became `newHolders=[]`, suppressing the F2
 * refusal and preserving a green report — constructed by both reviewers).
 */
export const portHolders = (port, { runner = execFileSync } = {}) => {
  let out
  try {
    out = runner('lsof', ['-ti', `tcp:${port}`], cOpts({ encoding: 'utf8' }))
  } catch (e) {
    if (e && e.status === 1 && String(e.stdout ?? '').trim() === '') return [] // valid empty
    return null // unavailable: exec failure, permission, exit>1, or anything unclassifiable
  }
  const pids = []
  for (const line of out.split('\n')) {
    const t = line.trim()
    if (t === '') continue
    if (!/^\d+$/.test(t)) return null // malformed output invalidates the whole census
    pids.push(Number(t))
  }
  return pids
}

/** pgid of a pid, or NULL when the lookup fails. NULL fails closed; 0 never silently did (F1). */
export const pgidOf = (pid, { runner = execFileSync } = {}) => {
  try {
    const n = Number(runner('ps', ['-o', 'pgid=', '-p', String(pid)], cOpts({ encoding: 'utf8' })).trim())
    return Number.isInteger(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

/** Birth identity of a pid, whitespace-normalised, or NULL when unresolvable. Defeats PID reuse. */
export const psLstart = (pid, { runner = execFileSync } = {}) => {
  try {
    const s = runner('ps', ['-o', 'lstart=', '-p', String(pid)], cOpts({ encoding: 'utf8' }))
      .trim()
      .replace(/\s+/g, ' ')
    return s.length > 0 ? s : null
  } catch {
    return null
  }
}

/**
 * TRI-STATE process probe (repair B, RULING-P99-52): 'alive' | 'dead' | 'unavailable'.
 * `kill(pid,0)` succeeds on a ZOMBIE, so state is the truthful test — but a ps FAILURE is not
 * death. ONLY an empty result (exit 1 with empty stdout = no such process, or exit 0 with empty
 * output) is `dead`; a zombie holds no descriptors and is dead. EVERY other error — exec failure,
 * permission, exit >1 — is `unavailable`: the old boolean mapped any ps error to false, and the
 * sweep read that as wrapper-dead and reaped a LIVE run's session (constructed by both reviewers).
 */
export const probeProcess = (pid, { runner = execFileSync } = {}) => {
  if (!Number.isInteger(pid) || pid <= 1)
    return { state: 'unavailable', why: `unusable pid ${JSON.stringify(pid)} — cannot prove anything about it` }
  let st
  try {
    st = runner('ps', ['-o', 'stat=', '-p', String(pid)], cOpts({ encoding: 'utf8' })).trim()
  } catch (e) {
    if (e && e.status === 1 && String(e.stdout ?? '').trim() === '') return { state: 'dead' }
    return { state: 'unavailable', why: `ps stat lookup failed: ${e?.message ?? e}` }
  }
  if (st === '' || st.startsWith('Z')) return { state: 'dead' }
  return { state: 'alive' }
}

/** Boolean convenience over probeProcess for the drills: true only when positively alive. */
export const alive = (pid, { runner = execFileSync } = {}) =>
  probeProcess(pid, { runner }).state === 'alive'

/**
 * Wrapper liveness WITH birth identity (repair B). Returns exactly one of:
 *   { state: 'alive', identity: 'match' }   — live wrapper, start matches the lease: a live run owns it
 *   { state: 'stale-identity', start }      — pid REUSED with a different start: the writer is provably dead
 *   { state: 'dead' }                       — no such process (or zombie): death positively established
 *   { state: 'unavailable', why }           — instrument error, missing lease wrapperStart, or an
 *                                             unverifiable start: touch NOTHING, return non-zero
 * A live pid whose start cannot be compared is NEVER treated as dead and NEVER as the owner.
 */
export const probeWrapper = (pid, expectedStart, { runner = execFileSync } = {}) => {
  const p = probeProcess(pid, { runner })
  if (p.state !== 'alive') return p
  if (!expectedStart)
    return { state: 'unavailable', why: `wrapper ${pid} is alive but the lease stored no wrapperStart — identity unprovable` }
  const start = psLstart(pid, { runner })
  if (start === null)
    return { state: 'unavailable', why: `wrapper ${pid} is alive but its start is unverifiable — not racing it` }
  if (start === expectedStart) return { state: 'alive', identity: 'match', start }
  return { state: 'stale-identity', start, why: `pid ${pid} reused: start '${start}' != lease '${expectedStart}'` }
}

/**
 * Reap a webServer that ESCAPED our process group (RULING-P99-35), keyed on port ownership.
 *
 * NOTE (F2): the RUN path no longer uses this for attribution — ownership there is the lease, and
 * a new port holder without one is a refusal, never a target. This remains the proven group-reap
 * utility the escape drill exercises, exported for that drill and for operators.
 *
 * `before` MUST be captured before the spawn; passing a stale or empty set turns this into an
 * indiscriminate port killer, so it is a required argument with no default.
 */
export const reapLeakedPorts = (ports, before, { reap = reapGroup, runner = execFileSync } = {}) => {
  if (!(before instanceof Set)) throw new TypeError('reapLeakedPorts: `before` must be a Set')
  const ourPgid = pgidOf(process.pid, { runner })
  const out = { leaked: [], reaped: [], spared: [], survived: [], unavailable: [] }
  // Repair 2 (RULING-P99-64): "never our own group" is a safety PREREQUISITE, not an optional
  // comparison — the per-target check below (`pgid === ourPgid`) can only refuse an unsafe target
  // when `ourPgid` is itself a trustworthy value. A valid numeric target `pgid` is NEVER `=== null`,
  // so when `ourPgid` was `null` the comparison silently evaporated and execution proceeded straight
  // through to `reap` (Codex, CONSULT-REAPER-SAFETY-R8-REPORT.md item 5/R8-N2: "a valid target pgid
  // is unequal to null, so execution continues through target-start capture and calls reap... one
  // injected reap call. No real signal was sent" — but the call WAS reached). If our own identity is
  // unavailable or unsafe (the same `<= 1` class the target check already rejects), fail closed for
  // the ENTIRE operation: no port is even censused, no target is evaluated, nothing is signalled —
  // every target is implicitly spared by never being considered, and the unavailable self-exclusion
  // input is recorded explicitly rather than silently downgrading to "no problem found".
  if (ourPgid === null || ourPgid <= 1) {
    out.unavailable.push({
      why: `own process-group identity unavailable/unsafe (ourPgid=${JSON.stringify(ourPgid)}) — refusing the entire operation, nothing signalled`,
    })
    return out
  }
  // Repair 2 (RULING-P99-66): the pre-loop `ourPgid` observation is a ONE-TIME snapshot — this
  // operation can iterate many ports and many targets, and "never signal our own group" must hold at
  // EVERY destructive decision, not just the first. `ownPgidFailed` makes a failure here fail closed
  // for the REMAINDER of the whole operation (breaks BOTH loops), matching the ruling's "otherwise
  // fail closed for the remainder" — not merely spare the one target under evaluation.
  let ownPgidFailed = false
  for (const port of ports) {
    if (ownPgidFailed) break
    const holders = portHolders(port, { runner })
    if (holders === null) {
      out.unavailable.push({ port, why: 'port census unavailable — spared everything on it' })
      continue // an unlooked port is never a target list (repair C)
    }
    for (const pid of holders) {
      if (before.has(pid)) {
        out.spared.push({ port, pid, why: 'pre-existing — not ours' })
        continue
      }
      // Repair 2 (RULING-P99-66): re-read OUR OWN pgid immediately before evaluating THIS target —
      // never trust the pre-loop snapshot for a destructive decision that may happen much later,
      // across possibly many ports and targets (Codex, CONSULT-REAPER-SAFETY-R9-REPORT.md R9-N2: "the
      // own PGID is observed exactly once, before the loop... changed the modeled own group during the
      // first port census, then presented that new group as the target. The frozen function made one
      // own-PGID query and reached one reap call for the now-own target"). A fresh unavailable/unsafe
      // result, or ANY change from the FIRST observation, fails closed for the remainder — not just
      // this target.
      const currentOwnPgid = pgidOf(process.pid, { runner })
      if (currentOwnPgid === null || currentOwnPgid <= 1 || currentOwnPgid !== ourPgid) {
        out.unavailable.push({
          why:
            `own process-group identity changed or became unavailable/unsafe before target pid ${pid} ` +
            `(initial=${ourPgid}, now=${JSON.stringify(currentOwnPgid)}) — refusing the remainder of the operation, nothing further signalled`,
        })
        ownPgidFailed = true
        break
      }
      const pgid = pgidOf(pid, { runner })
      // Never signal group 0/1, and never our own group (the JUST-REVALIDATED current value, not the
      // stale pre-loop one): a reaper that kills its own caller is the widening failure this design
      // exists to avoid — including the shape where OUR OWN group becomes the target's group.
      if (pgid === null || pgid <= 1 || pgid === currentOwnPgid) {
        out.spared.push({ port, pid, pgid, why: 'unsafe target group' })
        continue
      }
      // Repair 2 (RULING-P99-62): `reapGroup` now REQUIRES a captured birth identity before it will
      // signal anything — this caller never spawned the holder, so it has no "at spawn" capture the
      // way `runMode`'s direct child does; it captures the identity HERE, at the moment of
      // discovery, immediately before the destructive call, giving `reapGroup` the same basis to
      // refuse an impostor that reused this exact pgid between discovery and signal. A birth lookup
      // that fails is refused the same as any other unproven holder, never signalled.
      const pgidStart = psLstart(pgid, { runner })
      if (pgidStart === null) {
        out.spared.push({ port, pid, pgid, why: 'birth identity unverifiable — refusing to reap an unproven group' })
        continue
      }
      out.leaked.push({ port, pid, pgid })
      out.reaped.push({ port, pid, pgid, seen: reap(pgid, { runner, expectedStart: pgidStart }) })
    }
  }
  // VERIFY WHAT SURVIVED — a reap that is not verified is a claim.
  for (const port of ports) {
    const holders = portHolders(port, { runner })
    if (holders === null) {
      out.unavailable.push({ port, why: 'post-reap verification census unavailable' })
      continue
    }
    for (const pid of holders) if (!before.has(pid)) out.survived.push({ port, pid })
  }
  return out
}

/** cwd of a pid, or NULL when unreadable. NULL is UNREADABLE, never "no cwd" — it refuses (F3). */
export const cwdOf = (pid, { runner = execFileSync } = {}) => {
  let out
  try {
    out = runner('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'], cOpts({
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }))
  } catch {
    return null
  }
  for (const line of out.split('\n')) if (line.startsWith('n')) return line.slice(1)
  return null
}

/**
 * Component-aware containment (F3). `startsWith` accepted `/repo-other` as a child of `/repo`;
 * `relative` does not. Both sides MUST already be canonical — /var -> /private/var on macOS has
 * already produced a false RED in this repo (GATE-FIX-4 defect 1).
 */
export const isContained = (canonRoot, canonCwd) => {
  const rel = relative(canonRoot, canonCwd)
  return canonCwd === canonRoot || (rel !== '' && !rel.startsWith('..') && !isAbsolute(rel))
}

/**
 * pid -> sid for every process, or NULL if the instrument is unavailable or the table is
 * malformed in ANY cell (F1).
 *
 * macOS `ps` has no `sid` keyword and its `sess` column is a kernel POINTER that prints 0 for
 * everything — measured, including for our own shell. `os.getsid` is the only truthful source
 * here, so this shells to python3 ONCE for the whole table. The inner `ps` runs with check=True:
 * a failed ps must raise, not exit zero with an empty table. Every parsed pid/sid must be a
 * positive integer, and a table that does not contain OUR OWN pid is malformed. NULL (not an
 * empty map) in every one of those cases: "I could not look" must never be delivered as "there is
 * nothing there". This makes python3 a HARD dependency of rendered gates — stated, not implied.
 */
export const sessionMap = ({ runner = execFileSync } = {}) => {
  const prog = [
    'import os,subprocess',
    "r=subprocess.run(['ps','-eo','pid='],capture_output=True,text=True,check=True)",
    'for p in [int(x) for x in r.stdout.split()]:',
    '    try: print(p, os.getsid(p))',
    '    except OSError: pass',
  ].join('\n')
  let txt
  try {
    txt = runner('python3', ['-c', prog], cOpts({ encoding: 'utf8' }))
  } catch {
    return null
  }
  const m = new Map()
  for (const line of txt.split('\n')) {
    const t = line.trim()
    if (t === '') continue
    const pair = t.match(/^(\d+)\s+(\d+)$/)
    if (!pair) return null
    const pid = Number(pair[1])
    const sid = Number(pair[2])
    if (pid <= 0 || sid <= 0) return null
    m.set(pid, sid)
  }
  return m.has(process.pid) ? m : null
}

/**
 * Every live process in `sid`, with the identity fields at-use revalidation needs, or NULL when
 * either instrument is unavailable. Zombies are excluded: a zombie holds NO descriptors — it is
 * dead, not a survivor.
 */
export const sessionMembers = (sid, { runner = execFileSync, sids = undefined } = {}) => {
  const map = sids ?? sessionMap({ runner })
  if (map === null) return null
  let raw
  try {
    raw = runner('ps', ['-eo', 'pid=,pgid=,lstart=,stat=,command='], cOpts({ encoding: 'utf8' }))
  } catch {
    return null
  }
  if (raw.trim() === '') return null // an empty process table is malformed, not "no members"
  const out = []
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (t === '') continue
    const m = t.match(/^(\d+)\s+(\d+)\s+(\w{3}\s+\w{3}\s+\d+\s+[\d:]+\s+\d{4})\s+(\S+)\s+(.*)$/)
    // Repair A: ONE malformed/unparseable row invalidates the WHOLE census. The old `continue`
    // silently dropped rows — under a non-English locale EVERY row dropped, producing a
    // successful-looking EMPTY census that was delivered as `already-empty` (clean, exit 0,
    // lease unlinked) while the planted session was still alive. Never again: null, not partial.
    if (!m) return null
    const pid = Number(m[1])
    const pgid = Number(m[2])
    if (pid <= 0 || pgid < 0) return null
    if (map.get(pid) !== sid) continue // a valid row for another session is not our member
    if (m[4].startsWith('Z')) continue
    out.push({ pid, pgid, lstart: m[3].replace(/\s+/g, ' '), argv: m[5] })
  }
  return out
}

/**
 * TERM/TERM/KILL every distinct pgid in `sid` over bounded rounds, each round preceded by a FRESH
 * census that revalidates every member's immutable identity tuple, and REQUIRE an independently
 * verified empty session at the end.
 *
 * `root` scopes the action (F3): realpathSync(root) must SUCCEED or this throws; every live member
 * must have a readable, resolvable, component-wise contained cwd; any unknown, unreadable, or
 * out-of-root member refuses the WHOLE session, and containment is re-checked on the at-use
 * census, not only the first.
 *
 * Outcomes are tri-state and fail closed (F1): `reaped` only on a verified-zero final census,
 * `already-empty` when the first census found nothing (NOT success — nothing was reaped, and
 * saying so is the point), `refused` when attribution is unsafe, `unavailable` when any census
 * fails, `survivors` when the bounded rounds did not empty the session. `zero` is true ONLY on an
 * independently verified empty final census.
 *
 * ⚠ NOT kill(-sid). Every DISTINCT pgid, individually. MEASURED ON THIS MACHINE, 2026-08-19:
 *   session 13546 held three processes whose one live group was 13751. Group 13546 DID NOT EXIST.
 *   `kill(-13546)` would have returned ESRCH, killed NOTHING AT ALL, and — before F1 — REPORTED
 *   SUCCESS. That is a total no-op with a success indicator attached.
 *
 * There is NO bare-PID SIGKILL loop (F4): the only signal targets are freshly revalidated
 * negative pgids, recomputed EVERY round, excluding 0, 1, and our own pgid resolved at that
 * moment. On any identity change the session is refused — we never follow the number.
 */
export const reapLeakedSession = (
  sid,
  root,
  {
    signalFn = process.kill,
    runner = execFileSync,
    waitMs = 1500,
    expectedWriter = null,
    leaseAuthority = null,
  } = {},
) => {
  if (typeof root !== 'string' || root.length < 2)
    throw new TypeError('reapLeakedSession: `root` must be a real path — an empty root scopes to everything')
  const canonRoot = realpathSync(root) // F3: must succeed — a swallowed failure scoped by a guess
  const out = {
    sid,
    outcome: null,
    startedWith: 0,
    members: [],
    pgids: [],
    reason: null,
    survived: [],
    zero: false,
    unavailable: false,
  }
  const census = () => {
    const map = sessionMap({ runner })
    if (map === null) return null
    return sessionMembers(sid, { runner, sids: map })
  }
  const unavailable = (why) => {
    out.unavailable = true
    out.outcome = 'unavailable'
    out.reason = why
    out.zero = false
    return out
  }
  const refuse = (why) => {
    out.outcome = 'refused'
    out.reason = why
    out.zero = false
    return out
  }
  // cwd attribution for one member: a STRING reason on any failure, the enriched member otherwise.
  const attribute = (m) => {
    const raw = cwdOf(m.pid, { runner })
    if (raw === null || raw === '')
      return `member pid ${m.pid}: cwd UNREADABLE — a session we cannot fully attribute is not ours to end`
    let cwd
    try {
      cwd = realpathSync(raw)
    } catch {
      return `member pid ${m.pid}: cwd ${raw} does not resolve`
    }
    if (!isContained(canonRoot, cwd))
      return `member pid ${m.pid}: cwd ${cwd} is outside root ${canonRoot}`
    return { ...m, cwd }
  }

  const first = census()
  if (first === null)
    return unavailable('session table unavailable (no python3?) — an unlooked session is not an empty session')
  out.members = first
  out.startedWith = first.length
  if (first.length === 0) {
    out.outcome = 'already-empty'
    return out
  }

  // Immutable identity tuples (F4): bound once, RE-REQUIRED at every round.
  const known = new Map()
  for (const m of first) {
    const v = attribute(m)
    if (typeof v === 'string') return refuse(`session ${sid} refused WHOLE: ${v}`)
    known.set(m.pid, { pid: m.pid, pgid: m.pgid, lstart: m.lstart, cwd: v.cwd })
  }

  // Repair E (RULING-P99-52): the lease's STORED writer identity must match what the FIRST census
  // actually found, checked here before any signal — the `known` tuple above is never built from
  // the first observed census alone. A numeric sid can be REUSED for an unrelated replacement
  // session; without this check that replacement silently inherits the old lease's authority
  // (constructed: PROBE_F2_F4_STALE_LEASE_TUPLE, CONSULT-REAPER-SAFETY-R2-REPORT.md).
  if (expectedWriter && Number.isInteger(expectedWriter.pid)) {
    const writer = known.get(expectedWriter.pid)
    if (!writer) {
      // Repair (RULING-P99-84): the writer can be a dead session LEADER whose children legitimately
      // remain in the session — that is the ordinary orphan shape, not proof the sid was reused.
      // Only a positively `dead` probe of the numeric pid distinguishes the two; anything less
      // provable refuses, per state, rather than guessing.
      const probe = probeWrapper(expectedWriter.pid, expectedWriter.lstart, { runner })
      if (probe.state === 'alive')
        return refuse(
          `session ${sid} refused WHOLE: lease writer pid ${expectedWriter.pid} absent from the ` +
            'first census but still alive elsewhere — never adopt an untracked writer',
        )
      if (probe.state === 'stale-identity')
        return refuse(
          `session ${sid} refused WHOLE: lease writer pid ${expectedWriter.pid} absent from the ` +
            `first census and reused (${probe.why}) — sid likely reused for a replacement session`,
        )
      if (probe.state === 'unavailable')
        return refuse(
          `session ${sid} refused WHOLE: lease writer pid ${expectedWriter.pid} absent from the ` +
            `first census and its death is unprovable (${probe.why}) — never adopt an unprovable writer`,
        )
      // probe.state === 'dead': the original leader is positively dead, children retain its session — continue.
    } else {
      let expectedCwd = expectedWriter.cwd ?? null
      if (expectedCwd !== null) {
        try {
          expectedCwd = realpathSync(expectedCwd)
        } catch {
          /* leave uncanonicalised — the comparison below then legitimately fails closed */
        }
      }
      const pgidOk = expectedWriter.pgid == null || writer.pgid === expectedWriter.pgid
      const lstartOk = expectedWriter.lstart == null || writer.lstart === expectedWriter.lstart
      const cwdOk = expectedCwd === null || writer.cwd === expectedCwd
      if (!pgidOk || !lstartOk || !cwdOk)
        return refuse(
          `session ${sid} refused WHOLE: lease writer pid ${expectedWriter.pid} identity mismatch ` +
            `(lease pgid=${expectedWriter.pgid} lstart=${expectedWriter.lstart} cwd=${expectedCwd} ` +
            `vs census pgid=${writer.pgid} lstart=${writer.lstart} cwd=${writer.cwd}) — never adopt a replaced writer`,
        )
    }
  }

  // Bounded: at most 2 TERM rounds then 1 KILL round, each preceded by a fresh revalidating
  // census and followed by the next round's independent one.
  for (const sig of ['SIGTERM', 'SIGTERM', 'SIGKILL']) {
    // Repair 1 (RULING-P99-56): re-read the lease from disk and rebind IMMEDIATELY BEFORE every
    // round — not only once at first use. A lease replaced or mutated between rounds must refuse
    // the whole session and signal nothing further, never keep acting on already-captured session
    // data whose authorizing lease no longer exists in that form.
    if (leaseAuthority !== null && !leaseAuthorityStillValid(leaseAuthority.path, leaseAuthority))
      return refuse(
        `session ${sid} refused WHOLE: lease authority changed or became unavailable before the ` +
          `${sig} round — never follow a replaced/mutated lease`,
      )
    const cur = census()
    if (cur === null)
      return unavailable(`detector dropped out before the ${sig} round — no further signals sent`)
    if (cur.length === 0) break
    const ourPgid = pgidOf(process.pid, { runner })
    if (ourPgid === null)
      return unavailable('own pgid unresolvable at signal time — failing closed, no signals sent')
    for (const m of cur) {
      const prev = known.get(m.pid)
      if (prev && (prev.pgid !== m.pgid || prev.lstart !== m.lstart))
        return refuse(
          `session ${sid} refused WHOLE: pid ${m.pid} changed identity ` +
            `(${prev.pgid}/${prev.lstart} -> ${m.pgid}/${m.lstart}) — never follow the number`,
        )
      const v = attribute(m) // F3: containment re-checked on the at-use census
      if (typeof v === 'string') return refuse(`session ${sid} refused WHOLE at-use: ${v}`)
      // Repair 3 (RULING-P99-54): the FULL bound tuple is recompared every round, canonical cwd
      // included — the old code re-checked pgid/lstart but only re-checked that cwd was still
      // CONTAINED, never that it was still the SAME cwd. A member that moved to a different (but
      // still in-root) directory between rounds is exactly the shape "recompare the full tuple"
      // exists to catch, and containment alone does not catch it.
      if (prev && prev.cwd !== v.cwd)
        return refuse(
          `session ${sid} refused WHOLE: pid ${m.pid} cwd changed (${prev.cwd} -> ${v.cwd}) — never follow the number`,
        )
      if (!prev) known.set(m.pid, { pid: m.pid, pgid: m.pgid, lstart: m.lstart, cwd: v.cwd })
    }
    const groups = [...new Set(cur.map((m) => m.pgid))].filter((g) => g > 1 && g !== ourPgid)
    out.pgids = [...new Set([...out.pgids, ...groups])]
    for (const g of groups) {
      // Repair 2 (RULING-P99-58 item 2): re-read and revalidate the lease authority AFTER the fresh
      // census above, immediately before signalling THIS group — not once, hoisted, before the
      // round's census. Codex showed the hoisted-only check left a census-sized window: a lease
      // replaced during `census()` still authorized one SIGTERM, because the check that would have
      // caught it had already run and passed BEFORE the replacement happened
      // (CONSULT-REAPER-SAFETY-R5-REPORT.md, Consolidated 3, PROBE_POST_CHECK_PRE_SIGNAL:
      // `signals=[[-88,"SIGTERM"]]`). This check is independent per group and per round.
      if (leaseAuthority !== null && !leaseAuthorityStillValid(leaseAuthority.path, leaseAuthority))
        return refuse(
          `session ${sid} refused WHOLE: lease authority changed or became unavailable immediately ` +
            `before signalling group ${g} in the ${sig} round — never follow a replaced/mutated lease`,
        )
      try {
        signalFn(-g, sig)
      } catch {
        /* raced to exit */
      }
    }
    const deadline = Date.now() + waitMs
    while (Date.now() < deadline) {
      // teardown-path busy wait, measured in milliseconds
    }
  }
  const final = census()
  if (final === null)
    return unavailable('final verification census failed — an unverified reap is not a reap')
  out.survived = final
  out.zero = final.length === 0
  out.outcome = out.zero ? 'reaped' : 'survivors'
  if (!out.zero) out.reason = `${final.length} member(s) survived the bounded TERM/TERM/KILL rounds`
  return out
}

/* ─────────────────────────── THE LEASE (F2) ─────────────────────────── */

export const mintNonce = () => randomBytes(16).toString('hex')

export const leaseDirOf = (root) => join(root, '.pw-leases')

/** Atomic: write `<nonce>.tmp`, then rename. A reader never sees a partial lease. */
export const writeLeaseAtomic = (dir, nonce, fields) => {
  mkdirSync(dir, { recursive: true })
  const tmp = join(dir, `${nonce}.tmp`)
  writeFileSync(tmp, JSON.stringify(fields))
  renameSync(tmp, join(dir, `${nonce}.lease`))
}

/**
 * TRI-STATE lease read (repair D, RULING-P99-52): { state: 'absent' } | { state: 'valid', lease }
 * | { state: 'unavailable', why }. ONLY ENOENT is absent — a present-but-unreadable (permission
 * denied) or malformed (bad JSON, non-object) lease must never be treated as "no lease": a lease
 * that could not be read is a reason to fail closed, not a reason to finish clean (N2,
 * CONSULT-REAPER-SAFETY-R2-REPORT.md).
 */
export const readLeaseFile = (path) => {
  let text
  try {
    text = readFileSync(path, 'utf8')
  } catch (e) {
    if (e && e.code === 'ENOENT') return { state: 'absent' }
    return { state: 'unavailable', why: `lease ${path} unreadable: ${e.message}` }
  }
  try {
    const lease = JSON.parse(text)
    if (lease && typeof lease === 'object') return { state: 'valid', lease }
    return { state: 'unavailable', why: `lease ${path} parsed to a non-object value` }
  } catch (e) {
    return { state: 'unavailable', why: `lease ${path} malformed JSON: ${e.message}` }
  }
}

/**
 * Repair 2 (RULING-P99-54): validate the COMPLETE lease schema before it carries ANY authority —
 * before liveness probing AND before signalling. No field is an optional wildcard: nonce format
 * (and, when an expected nonce is supplied, equality to it), canonical root equal to the current
 * canonical root, canonical writer cwd contained within root, positive-integer sid/pid/pgid/
 * wrapperPid, a SEMANTICALLY VALID AND ATTAINABLE lstart/wrapperStart (CORRECTED — RULING-P99-60
 * item 6: this comment previously said "non-empty parseable", which stopped being true once
 * RULING-P99-58/60 hardened the check to full calendar+canonical-spelling+attainability validation
 * — see `isValidLstart`), and a valid writtenAt. Missing or non-numeric wrapper identity means
 * wrapper death can NEVER be positively proven — this returns invalid, and the caller must retain
 * the lease, signal nothing, and report unavailable/non-zero, never treat an incomplete schema as a
 * wildcard pass (the N1 residual: `PROBE_WRAPPER_MISSING`/`PROBE_WRAPPER_INVALID` both swept a
 * lease whose `wrapperPid` was absent/non-numeric — CONSULT-REAPER-SAFETY-R3-REPORT.md).
 */
const NONCE_FORMAT = /^[0-9a-f]{32}$/
// Repair 1 (RULING-P99-56, hardened RULING-P99-58 item 1, CORRECTED RULING-P99-60 item 2): the
// exact shape `psLstart` produces after its own whitespace normalisation
// (`.trim().replace(/\s+/g, ' ')`) under the forced CENSUS_ENV locale — `Www Mmm D HH:MM:SS YYYY`,
// single-space separated. The day group requires the CANONICAL spelling — BSD/macOS `ps lstart`
// never zero-pads a one-digit day, so `08` is not a value this instrument can ever produce, even
// though it is calendar-valid (Codex, CONSULT-REAPER-SAFETY-R6-REPORT.md item 2: "does not enforce
// the canonical non-zero-padded spelling of a whitespace-normalized one-digit ps lstart day").
const LSTART_FORMAT = /^(\w{3}) (\w{3}) ([1-9]|[12]\d|3[01]) (\d{2}):(\d{2}):(\d{2}) (\d{4})$/
const LSTART_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const LSTART_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LSTART_DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const isLeapYear = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
/**
 * Repair 1 (RULING-P99-58 item 1): SEMANTIC validation of a forced-C `ps lstart` value, not merely
 * its regex shape. Codex demonstrated that `Foo Bar 99 99:99:99 0000` matches `LSTART_FORMAT`'s
 * width-only shape while being a value no real `ps lstart` output can ever produce — a lease
 * carrying it was treated as authoritative and was swept (CONSULT-REAPER-SAFETY-R5-REPORT.md,
 * Consolidated 2). This is the ONE shared parser used for both `lstart` and `wrapperStart` (the
 * schema loop below runs it for both fields identically): weekday and month must be members of the
 * C-locale token sets; day must be valid for the parsed month/year, leap years included, spelled
 * canonically (no leading zero); hour/minute/second must be in range; and the reconstructed
 * calendar date's ACTUAL day-of-week (computed independently, UTC so the check is timezone-
 * invariant — this asks "what weekday does this calendar date fall on", not "what instant is
 * this") must round-trip to exactly the claimed weekday token.
 *
 * Repair 2 (RULING-P99-60): calendar validity is not ATTAINABILITY. A real process cannot have
 * started in the future — Codex: "it explicitly accepts years through 2999 and performs no
 * upper-bound comparison to the current instant". `now`/`toleranceMs` are INJECTABLE (never a bare
 * `Date.now()` baked into the comparison) so tests can pin a fixed clock: the year may not exceed
 * `now`'s year, and the full local instant (built the same way `ps lstart` reports it — LOCAL wall
 * clock, since the validating process and the probed process share this machine) may not exceed
 * `now + toleranceMs`. A malformed, impossible, or unattainable value is invalid lease state and
 * carries no authority.
 */
export const isValidLstart = (s, { now = Date.now(), toleranceMs = 5 * 60 * 1000 } = {}) => {
  if (typeof s !== 'string') return false
  const m = LSTART_FORMAT.exec(s)
  if (!m) return false
  const [, wd, mon, dayStr, hhStr, mmStr, ssStr, yearStr] = m
  const weekdayIdx = LSTART_WEEKDAYS.indexOf(wd)
  const monthIdx = LSTART_MONTHS.indexOf(mon)
  if (weekdayIdx === -1 || monthIdx === -1) return false
  const day = Number(dayStr)
  const hh = Number(hhStr)
  const mm = Number(mmStr)
  const ss = Number(ssStr)
  const year = Number(yearStr)
  if (year < 1970) return false // no process predates the Unix epoch
  if (hh > 23 || mm > 59 || ss > 59) return false // \d{2} already excludes negatives
  const maxDay = monthIdx === 1 && isLeapYear(year) ? 29 : LSTART_DAYS_IN_MONTH[monthIdx]
  if (day > maxDay) return false // day >= 1 already guaranteed by the canonical-spelling regex
  const reconstructed = new Date(Date.UTC(year, monthIdx, day))
  if (
    reconstructed.getUTCFullYear() !== year ||
    reconstructed.getUTCMonth() !== monthIdx ||
    reconstructed.getUTCDate() !== day
  )
    return false // JS Date auto-normalises out-of-range fields instead of rejecting them — catch that here
  if (reconstructed.getUTCDay() !== weekdayIdx) return false // the claimed weekday must round-trip exactly
  const nowDate = new Date(now)
  if (year > nowDate.getFullYear()) return false // no process starts in a year that has not happened yet
  const localInstant = new Date(year, monthIdx, day, hh, mm, ss).getTime()
  return localInstant <= now + toleranceMs // no process starts in the future, beyond clock/timezone slack
}
export const validateLeaseSchema = (
  lease,
  { expectedNonce = null, expectedRoot, now = Date.now(), toleranceMs = 5 * 60 * 1000 } = {},
) => {
  const fail = (why) => ({ ok: false, why })
  if (!lease || typeof lease !== 'object') return fail('lease is not an object')
  if (typeof lease.nonce !== 'string' || !NONCE_FORMAT.test(lease.nonce))
    return fail(`nonce is not a well-formed 32-char hex string: ${JSON.stringify(lease.nonce)}`)
  if (expectedNonce !== null && lease.nonce !== expectedNonce)
    return fail('lease nonce does not match the wrapper-requested nonce')
  if (typeof lease.root !== 'string' || lease.root.length === 0) return fail('root is missing/empty')
  let canonLeaseRoot
  try {
    canonLeaseRoot = realpathSync(lease.root)
  } catch (e) {
    return fail(`lease root does not resolve: ${e.message}`)
  }
  if (canonLeaseRoot !== expectedRoot)
    return fail(`lease root ${canonLeaseRoot} does not match the current canonical root ${expectedRoot}`)
  if (typeof lease.cwd !== 'string' || lease.cwd.length === 0) return fail('writer cwd is missing/empty')
  let canonCwd
  try {
    canonCwd = realpathSync(lease.cwd)
  } catch (e) {
    return fail(`lease writer cwd does not resolve: ${e.message}`)
  }
  if (!isContained(expectedRoot, canonCwd))
    return fail(`writer cwd ${canonCwd} is outside root ${expectedRoot}`)
  if (!Number.isInteger(lease.sid) || lease.sid <= 1)
    return fail(`sid is not a usable positive integer (>1): ${JSON.stringify(lease.sid)}`)
  for (const field of ['pid', 'pgid', 'wrapperPid']) {
    if (!Number.isInteger(lease[field]) || lease[field] <= 0)
      return fail(`${field} is not a positive integer: ${JSON.stringify(lease[field])}`)
  }
  for (const field of ['lstart', 'wrapperStart']) {
    if (!isValidLstart(lease[field], { now, toleranceMs }))
      return fail(`${field} is not a semantically valid forced-C ps lstart value: ${JSON.stringify(lease[field])}`)
  }
  if (typeof lease.writtenAt !== 'string' || Number.isNaN(Date.parse(lease.writtenAt)))
    return fail(`writtenAt is not a valid timestamp: ${JSON.stringify(lease.writtenAt)}`)
  return { ok: true, canonRoot: canonLeaseRoot, canonCwd }
}

/**
 * Repair 1 (RULING-P99-56): re-read the lease from disk and confirm it is STILL the exact
 * authority bound at first use — the body nonce still matches BOTH the lease filename and the
 * originally-bound nonce, the schema is still complete, and the writer tuple (pid/pgid/lstart/
 * canonical cwd) is unchanged. Used immediately before every TERM/KILL signal round and
 * immediately before consume/unlink. A lease that was replaced, mutated, deleted, or made
 * unreadable between the first bind and now must never continue to authorize destructive action
 * (Codex, CONSULT-REAPER-SAFETY-R4-REPORT.md residual 3: a lease atomically replaced after first
 * bind but before the first TERM still authorized a SIGTERM to the target group).
 *
 * Repair 3 (RULING-P99-60): the bound tuple was missing TWO decision inputs the original bind
 * actually depended on — the target `sid` (which session this authority signals) and the
 * `wrapperPid`/`wrapperStart` PAIR whose PROVEN DEATH is what authorized orphan reaping in the
 * first place (Codex, CONSULT-REAPER-SAFETY-R6-REPORT.md item 3: "those inputs may be schema-valid
 * on reread without being equal to the values on which the decision was made"). A lease rewritten
 * with a different sid, or a different wrapper identity, is schema-valid but is NOT the same
 * authority — every decision field the first bind observed is now rechecked, not a subset of them.
 */
export const leaseAuthorityStillValid = (leasePath, bound) => {
  const result = readLeaseFile(leasePath)
  if (result.state !== 'valid') return false
  const lease = result.lease
  const filenameNonce = basename(leasePath).replace(/\.lease$/, '')
  if (lease.nonce !== filenameNonce || lease.nonce !== bound.nonce) return false
  const schema = validateLeaseSchema(lease, { expectedNonce: bound.nonce, expectedRoot: bound.root })
  if (!schema.ok) return false
  return (
    lease.sid === bound.sid &&
    lease.pid === bound.pid &&
    lease.pgid === bound.pgid &&
    lease.lstart === bound.lstart &&
    schema.canonCwd === bound.cwd &&
    lease.wrapperPid === bound.wrapperPid &&
    lease.wrapperStart === bound.wrapperStart
  )
}

/**
 * Orphan-lease recovery for `root` (Amendment 2 — PRODUCT-owned, not an operator overlay).
 * Every `.pw-leases/*.lease` whose wrapper is DEAD (or whose pid was reused: lstart mismatch) is
 * consumed through the identical reapLeakedSession path with identical refusal rules, and its
 * lease file is removed only when the session ended verified empty. A lease whose wrapperPid is
 * ALIVE with a MATCHING wrapperStart belongs to a live run and is SKIPPED — the sweep must never
 * race a running gate. A live wrapper whose start cannot be verified is skipped too: ambiguous
 * ownership never gets signalled.
 *
 * Repair B / N1 (RULING-P99-52): liveness is TRI-STATE via probeWrapper — an instrument error
 * (permission denial, a `ps` failure, an unverifiable start) is `unavailable` and goes to FAILED,
 * never treated as "wrapper dead". The old boolean `alive()` mapped every probe error to false,
 * and this sweep read that as "dead" and reaped a LIVE run's session (constructed by both
 * reviewers, independently: CONSULT-REAPER-SAFETY-R2-REPORT.md N1, P99R-VERIFY-REPORT.md Finding 3).
 *
 * Repair D (RULING-P99-52): the lease-directory read and every per-file unlink are ENOENT-checked.
 * Only ENOENT is "never leased here" / "already gone" — any other error is a failure that retains
 * the path for retry, never a silent absence or a false "swept".
 *
 * Repair 2 (RULING-P99-54): every lease is validated against the COMPLETE schema
 * (validateLeaseSchema) before liveness is even probed — a missing or non-numeric `wrapperPid` no
 * longer bypasses the liveness gate and falls through to reaping; it fails the schema outright, and
 * wrapper death stays unproven.
 */
export const sweepLeases = (
  root,
  { runner = execFileSync, signalFn = process.kill, waitMs = 1500, reapSession = reapLeakedSession } = {},
) => {
  const out = { root, swept: [], skipped: [], failed: [] }
  let canonRoot
  try {
    canonRoot = realpathSync(root)
  } catch (e) {
    out.failed.push({ lease: null, why: `root ${root} unresolvable: ${e.message}` })
    return out
  }
  const dir = leaseDirOf(canonRoot)
  let files
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.lease'))
  } catch (e) {
    if (e && e.code === 'ENOENT') {
      files = [] // no lease directory: nothing was ever leased here — legitimately absent, not a failure
    } else {
      out.failed.push({ lease: null, why: `lease directory ${dir} unavailable: ${e.message}` })
      return out
    }
  }
  for (const f of files) {
    const p = join(dir, f)
    let lease
    try {
      lease = JSON.parse(readFileSync(p, 'utf8'))
    } catch (e) {
      out.failed.push({ lease: f, why: `malformed lease: ${e.message}` })
      continue
    }
    // Repair 2 (RULING-P99-54): the COMPLETE schema is validated BEFORE liveness or signalling —
    // no field is an optional wildcard. A missing/non-numeric wrapperPid no longer skips the
    // liveness gate and falls through to reaping (the N1 residual); it fails the schema outright.
    // Repair 1 (RULING-P99-56): the body nonce is bound to the LEASE FILENAME here too — a lease
    // named `<X>.lease` whose body claims a DIFFERENT nonce is exactly the shape Codex constructed
    // (filename `cccc…`, body `dddd…`, both otherwise valid) and must never pass schema.
    const filenameNonce = f.slice(0, -'.lease'.length)
    const schema = validateLeaseSchema(lease, { expectedNonce: filenameNonce, expectedRoot: canonRoot })
    if (!schema.ok) {
      out.failed.push({
        lease: f,
        why:
          `lease schema incomplete — wrapper death unproven: ${schema.why}` +
          (lease?.reason ? ` (recorded reason: ${lease.reason})` : ''),
      })
      continue
    }
    const w = probeWrapper(lease.wrapperPid, lease.wrapperStart, { runner })
    if (w.state === 'alive') {
      out.skipped.push({ lease: f, why: `wrapper ${lease.wrapperPid} alive with matching start — a live run owns this lease` })
      continue
    }
    if (w.state === 'unavailable') {
      out.failed.push({ lease: f, why: `wrapper liveness unavailable — touching nothing: ${w.why}` })
      continue
    }
    // 'dead' or 'stale-identity': the wrapper that wrote this lease is provably dead.
    const expectedWriter = { pid: lease.pid, pgid: lease.pgid, lstart: lease.lstart, cwd: schema.canonCwd }
    // Repair 3 (RULING-P99-60): sid and the wrapper pid/start PAIR (the decision inputs whose proven
    // death authorized this reap) are now part of the bound authority — see leaseAuthorityStillValid.
    const leaseAuthority = {
      path: p,
      nonce: lease.nonce,
      root: canonRoot,
      sid: lease.sid,
      pid: lease.pid,
      pgid: lease.pgid,
      lstart: lease.lstart,
      cwd: schema.canonCwd,
      wrapperPid: lease.wrapperPid,
      wrapperStart: lease.wrapperStart,
    }
    const res = reapSession(lease.sid, canonRoot, { runner, signalFn, waitMs, expectedWriter, leaseAuthority })
    if (res.outcome === 'reaped' || res.outcome === 'already-empty') {
      // Repair 1 (RULING-P99-56): re-read and revalidate the SAME authority immediately before
      // consume/unlink, not just before each signal round — a replacement landing between the
      // final census and the unlink must retain, not consume, the lease.
      if (!leaseAuthorityStillValid(p, leaseAuthority)) {
        out.failed.push({
          lease: f,
          sid: lease.sid,
          why: `session ${res.outcome} but the lease authority changed before consume — refusing to unlink a replaced/mutated lease`,
          retry: p,
        })
        continue
      }
      try {
        unlinkSync(p)
        out.swept.push({ lease: f, sid: lease.sid, outcome: res.outcome, startedWith: res.startedWith })
      } catch (e) {
        if (e && e.code === 'ENOENT') {
          out.swept.push({ lease: f, sid: lease.sid, outcome: res.outcome, startedWith: res.startedWith })
        } else {
          out.failed.push({
            lease: f,
            sid: lease.sid,
            why: `session ${res.outcome} but lease unlink failed: ${e.message} — retained for retry`,
            retry: p,
          })
        }
      }
    } else {
      out.failed.push({ lease: f, sid: lease.sid, outcome: res.outcome, why: res.reason ?? null })
    }
  }
  return out
}

/**
 * Port corroboration at finish (F2 — corroboration, NEVER authority). Returns a human cause
 * string, or NULL when the holder population is exactly explained. A new gate-port holder with no
 * matching lease is a REFUSAL, never a target.
 */
export const holderVerdict = ({ leaseFound, newHolders, sids, leasedSid }) => {
  if (newHolders.length === 0) return null
  if (!leaseFound)
    return (
      `refused: ${newHolders.length} new gate-port holder(s) ${JSON.stringify(newHolders)} carry NO lease ` +
      `(started between the pre-spawn snapshot and finish — a developer's pnpm dev is indistinguishable ` +
      `from our child without one). Never killed. Always red.`
    )
  if (sids === null)
    return `unavailable: cannot attribute ${newHolders.length} new gate-port holder(s) — the session table failed`
  const foreign = newHolders.filter((h) => sids.get(h) !== leasedSid)
  if (foreign.length > 0)
    return `refused: gate-port holder(s) ${JSON.stringify(foreign)} are NOT in the leased session ${leasedSid} — not ours to touch`
  return `survivors: the leased session ended but ${newHolders.length} gate-port holder(s) still listen ${JSON.stringify(newHolders)}`
}

/* ─────────────────────── EXIT COMPOSITION (F5/F6) ───────────────────── */

/**
 * The private path Playwright's JSON reporter actually writes to (repair 4), NONCE-BOUND (repair 1,
 * RULING-P99-62 item 1): `mintNonce()` already produces a fresh identity for every wrapper run, and
 * that nonce already binds leases and foreign-report quarantine paths — it was simply never applied
 * to report staging. `pendingReportPath(jsonOut)` alone was `${jsonOut}.pending` for EVERY run
 * sharing that final path — reachable in this repository, not hypothetical: `J="$R/.p99-red-dates.json"`
 * is the SAME final path in both 99-01-PLAN.md and 99-02-PLAN.md's routed oracle commands, and
 * `J="$R/.p99-red-leak.json"` in 99-03-PLAN.md is a second instance of the same pattern (Codex,
 * CONSULT-REAPER-SAFETY-R7-REPORT.md: "Two supported callers already share one final path in this
 * repository"). A second run's pending bytes could overwrite the first's before either published,
 * and neither `publishReport` nor its caller had any way to tell whose pending bytes were whose.
 * `nonce` is REQUIRED, never optional — an un-nonce-bound pending path is exactly the defect this
 * closes.
 */
export const pendingReportPath = (jsonOut, nonce) => {
  if (typeof nonce !== 'string' || nonce.length === 0)
    throw new TypeError('pendingReportPath: `nonce` is required — an un-nonce-bound pending path can collide across runs')
  return `${jsonOut}.pending-${nonce}`
}

/**
 * The retained-unclean evidence path, NONCE-BOUND (repair 1, RULING-P99-64 item 1): the shared
 * `${jsonOut}.unclean.json` let one caller's failed run overwrite a DIFFERENT concurrent caller's
 * retained failure evidence at the same final path — the exact class of cross-caller clobbering this
 * repair closes for the pending path too. `nonce` is REQUIRED for the same reason as
 * `pendingReportPath`.
 */
export const uncleanReportPath = (jsonOut, nonce) => {
  if (typeof nonce !== 'string' || nonce.length === 0)
    throw new TypeError('uncleanReportPath: `nonce` is required — an un-nonce-bound unclean path can collide across runs')
  return `${jsonOut}.unclean-${nonce}.json`
}

/**
 * A stale report from an earlier run must never be read as THIS run's evidence (T14) — now
 * covering the pending path too, and FAIL-CLOSED: only ENOENT ("already absent") is swallowed.
 * Repair 4 (RULING-P99-54) requires the stale FINAL path be removed or refused before spawn, not
 * best-effort; a removal failure for any other reason throws so the caller can refuse to proceed.
 *
 * Repair 1 (RULING-P99-62): once pending paths are nonce-bound, this function can no longer derive
 * ITS OWN pending path from `jsonOut` alone — it needs the nonce THIS run is about to write under.
 *
 * Repair 1 (RULING-P99-64), CORRECTED — this function no longer touches `jsonOut` AT ALL. The final
 * path is SHARED by every supported caller routed to it and has no nonce ownership at startup —
 * deleting it unconditionally let a second caller (B) destroy a first caller's (A) ALREADY-PUBLISHED
 * final before A's supported `&&` consumer ever read it (Codex, CONSULT-REAPER-SAFETY-R8-REPORT.md,
 * R8-N1: a real `runMode`-shaped lifecycle row published A's final, then called
 * `clearStaleReport(shared.json, nonceB)` the way B's own preflight would, and observed A's final
 * gone). `publishReport`'s existing no-overwrite `linkSync` already makes an occupied final refuse
 * cleanly — startup deletion was PRE-EMPTING that guarantee, not complementing it. This function now
 * clears only THIS run's own nonce-bound pending path and nonce-bound unclean path (both, by
 * construction, essentially always absent — `mintNonce()` is a fresh 128-bit value every run). It
 * deliberately does NOT glob or clear every `<jsonOut>.pending-*`/`<jsonOut>.unclean-*`: that would
 * delete a DIFFERENT, concurrently-running supported caller's in-flight evidence — fixing one
 * concurrency bug by writing another, exactly what RULING-P99-62/64's "no cross-consumption, both
 * evidence sets preserved" forbids. A stale FINAL is occupied/foreign evidence, never silently
 * deleted here; cleanup of old finals is an operator action outside `runMode`.
 */
export const clearStaleReport = (jsonOut, nonce) => {
  for (const p of [pendingReportPath(jsonOut, nonce), uncleanReportPath(jsonOut, nonce)]) {
    try {
      rmSync(p)
    } catch (e) {
      if (!e || e.code !== 'ENOENT') throw new Error(`cannot clear stale report path ${p}: ${e.message}`)
    }
  }
}

/**
 * Repair 4 (RULING-P99-54), CORRECTED by RULING-P99-60 item 1 (found independently by both
 * reviewers): the consumer-visible FINAL path is populated ONLY by this atomic, NO-OVERWRITE
 * publish, and ONLY after `verdict === 'clean'` — Playwright is run against the PRIVATE PENDING
 * path (`pendingReportPath`), never the path a supported `&&` caller reads directly.
 *
 * TWO defects in the retired version, both named by Codex and Grok independently:
 *   - a MISSING pending report returned `{ok: true, published: false}` — a missing pending report
 *     is UNPROVEN, not clean. With a foreign file already sitting at the final path, the verdict
 *     stayed clean, exit could be 0, and a supported `&&` consumer read foreign bytes as this run's.
 *   - `renameSync(pendingOut, jsonOut)` — POSIX rename REPLACES an existing destination silently,
 *     destroying a foreign final rather than preserving it, and doing so even on a run that was
 *     otherwise clean (the late-quarantine check added in R5 is gated on an UNCLEAN verdict and
 *     never ran on this path — Grok, P99R-VERIFY-R5-REPORT.md, "clean-path `jsonOut` occupancy is
 *     unbound at `publishReport`").
 *
 * FIX: `linkSync` (a hard link — atomic, and POSIX `link(2)` FAILS with EEXIST rather than
 * replacing an existing destination) followed by unlinking the now-redundant pending path, never
 * `renameSync`, for the final publish. A pre-check makes the common failure legible; the actual
 * no-overwrite guarantee comes from `linkSync` itself, which is safe even if a foreign writer's
 * file appears in the instant between the check and the link call.
 *
 * Repair 1 (RULING-P99-62): `nonce` is REQUIRED and validated — `pendingOut` must equal
 * `pendingReportPath(jsonOut, nonce)` exactly, or publication refuses outright. This is the
 * "publication validates that pending path belongs to the current nonce" the ruling requires: with
 * two supported callers sharing one final `jsonOut` (the measured 99-01/02 and 99-03 pattern), this
 * is what proves a run only ever publishes ITS OWN pending bytes, never a differently-nonced path
 * some other bug might have handed it.
 */
export const publishReport = (pendingOut, jsonOut, nonce) => {
  if (pendingOut !== pendingReportPath(jsonOut, nonce))
    return {
      ok: false,
      published: false,
      why: `pending path ${pendingOut} does not belong to the current run's nonce — refusing to publish`,
    }
  if (!pendingOut || !existsSync(pendingOut))
    return {
      ok: false,
      published: false,
      why: `pending report ${pendingOut ?? '(none)'} is missing — a missing pending report is unproven, never clean`,
    }
  if (existsSync(jsonOut))
    return {
      ok: false,
      published: false,
      why: `final report path ${jsonOut} already exists — refusing to overwrite it; the pending report is retained as this run's evidence`,
    }
  try {
    linkSync(pendingOut, jsonOut) // atomic, no-overwrite: EEXIST if a foreign writer won the race
    try {
      unlinkSync(pendingOut) // consume the private staging copy now that the public link exists
    } catch {
      /* the public link exists either way — a stale pending copy left behind is not a safety defect */
    }
    return { ok: true, published: true }
  } catch (e) {
    return {
      ok: false,
      published: false,
      why: `report publish failed: link ${pendingOut} -> ${jsonOut}: ${e.message} — pending report retained`,
    }
  }
}

/**
 * On any non-clean verdict the FINAL path must never come into existence at all — retain whatever
 * the pending path holds under the explicit unclean name instead. Missing pending is fine
 * (Playwright may have crashed before its reporter finalised).
 *
 * Repair 1 (RULING-P99-64): the retained-unclean path is now NONCE-BOUND (`uncleanReportPath`) —
 * the prior shared `${jsonOut}.unclean.json` let one caller's failed run overwrite a DIFFERENT
 * concurrent caller's retained failure evidence at the same final path.
 */
export const retainUncleanReport = (pendingOut, jsonOut, nonce) => {
  if (!pendingOut || !existsSync(pendingOut)) return { ok: true, retained: false }
  const uncleanPath = uncleanReportPath(jsonOut, nonce)
  try {
    renameSync(pendingOut, uncleanPath)
    return { ok: true, retained: true }
  } catch (e) {
    return {
      ok: false,
      why: `retaining pending report failed: rename ${pendingOut} -> ${uncleanPath}: ${e.message}`,
    }
  }
}

/** A gate that reds with only a log path is diagnosable but not diagnosed. Last `lines` to stderr. */
export const tailLog = (logPath, lines = 80, err = console.error) => {
  let text
  try {
    text = readFileSync(logPath, 'utf8')
  } catch {
    return
  }
  const tail = text.split('\n').slice(-lines).join('\n')
  err(`pw-run-reaped: last ${lines} line(s) of the playwright log (${logPath}):\n${tail}`)
}

/**
 * The idempotent finisher (F6): one synchronous state machine behind EVERY exit path. `state` is
 * everything RUN bound at spawn (including `pendingOut`, repair 4 — the private path Playwright
 * actually wrote to); `deps` is the DI seam the drills drive. Computes the one verdict (a
 * conjunction of positive observations — never the default, never reachable by absence of
 * evidence), composes the exit code, publishes the pending report to the consumer-visible path
 * ONLY on clean (or retains it under an explicit unclean name otherwise), and exits.
 */
export const createFinisher = (state, deps = {}) => {
  const {
    signalFn = process.kill,
    runner = execFileSync,
    waitMs = 1500,
    exitFn = process.exit,
    reapSession = reapLeakedSession,
    sidsNow = sessionMap,
    log = console.log,
    err = console.error,
  } = deps
  let finished = false
  return (why) => {
    if (finished) return
    finished = true
    const causes = [...(state.sweepFailures ?? [])]
    // Repair 1 (RULING-P99-66) — THE QUARANTINE IS REMOVED, DELIBERATELY, NOT A REGRESSION. Repairs
    // 3/5/6 (RULING-P99-56/58/62) built and repeatedly defended a foreign-final "quarantine" here —
    // renaming whatever sat at `state.jsonOut` to a `.foreign-<nonce>.json` evidence path the instant
    // it was found. R8 (RULING-P99-64) closed the "preflight predates this run" half of the trap by
    // gating the rename on `state.finalOccupiedAtPreflight`, but the OTHER half remained open (Codex,
    // CONSULT-REAPER-SAFETY-R9-REPORT.md, R9-N1): the wrapper CANNOT distinguish a genuinely foreign
    // writer's file from a DIFFERENT SUPPORTED caller's own legitimate final that happened to publish
    // during this run's lifetime — both look identical (a file appeared at the shared path after this
    // run's own preflight observation) — so gating on "before vs. during this run" was never the right
    // axis. The ruling's decision: it does not need to distinguish. The consumer-visible final is
    // NEVER moved or deleted by this wrapper, full stop, on any code path, clean or not — an occupied
    // final simply makes atomic no-overwrite publication (`publishReport`, unchanged, still refuses on
    // `existsSync(jsonOut)`) fail closed, which was ALREADY sufficient by itself: this repair only
    // REMOVES the destructive action that used to run instead of relying on that existing refusal.
    // The group WE spawned (playwright itself) — ours by construction, reaped unconditionally.
    // Repair 4 (RULING-P99-60): `state.childPgidStart` (captured at spawn, runMode) reverifies THIS
    // group's identity immediately before every signal, and `seen` now ENTERS the verdict
    // conjunction below — previously it was logged and discarded, so an unavailable signal-0 probe,
    // an impostor pgid, or a group that never proved zero members could still report clean.
    const seen = reapGroup(state.pgid, { signalFn, runner, waitMs, expectedStart: state.childPgidStart ?? null })
    if (seen.unavailable)
      causes.push(`unavailable: direct group ${state.pgid} liveness/identity unverifiable — a group we cannot prove is not a group we can call clean`)
    else if (seen.identityMismatch)
      causes.push(`refused: direct group ${state.pgid} identity changed (birth start no longer matches) — refusing to signal a possible impostor`)
    else if (!seen.finalZero)
      causes.push(`survivors: direct group ${state.pgid} did not reach an independently verified zero members after the bounded TERM/KILL rounds`)
    // The lease is the ownership authority (F2). Repair D (RULING-P99-52): readLeaseFile is
    // tri-state — a present-but-unreadable/malformed lease is `unavailable` (a cause), never
    // silently treated as "no lease".
    const leasePath = join(state.leaseDir, `${state.nonce}.lease`)
    const leaseResult = readLeaseFile(leasePath)
    let lease = null
    let leasedSid = null
    let session = null
    let leaseAuthority = null
    if (leaseResult.state === 'unavailable') {
      causes.push(`unavailable: ${leaseResult.why}`)
    } else if (leaseResult.state === 'valid') {
      lease = leaseResult.lease
      if (lease.nonce !== state.nonce) {
        session = { outcome: 'refused' }
        causes.push(`refused: lease ${leasePath} carries a FOREIGN nonce — not ours to act on`)
      } else {
        // Repair 2 (RULING-P99-54): the COMPLETE schema is validated before this lease carries any
        // authority — no field is an optional wildcard. This closes the `expectedWriter` gap left
        // partial last pass (Codex, F2/F4: "missing pgid/lstart/cwd is a wildcard"). `state.root`
        // is canonicalised HERE (not trusted as already-canonical) so a caller-supplied cwd like
        // macOS's `/var` alias never produces a false schema mismatch against an equally-valid
        // `/private/var` form of the same directory.
        let canonStateRoot = null
        let rootError = null
        try {
          canonStateRoot = realpathSync(state.root)
        } catch (e) {
          rootError = e
        }
        if (rootError !== null) {
          session = { outcome: 'unavailable' }
          causes.push(`unavailable: cannot canonicalise state.root ${state.root}: ${rootError.message}`)
        } else {
          const schema = validateLeaseSchema(lease, { expectedNonce: state.nonce, expectedRoot: canonStateRoot })
          if (!schema.ok) {
            session = { outcome: 'unavailable' }
            causes.push(`unavailable: lease schema incomplete — wrapper identity/authority unproven: ${schema.why}`)
          } else {
            leasedSid = lease.sid
            const expectedWriter = { pid: lease.pid, pgid: lease.pgid, lstart: lease.lstart, cwd: schema.canonCwd }
            // Repair 3 (RULING-P99-60): sid and the wrapper pid/start PAIR are now part of the
            // bound authority — see leaseAuthorityStillValid.
            leaseAuthority = {
              path: leasePath,
              nonce: lease.nonce,
              root: canonStateRoot,
              sid: lease.sid,
              pid: lease.pid,
              pgid: lease.pgid,
              lstart: lease.lstart,
              cwd: schema.canonCwd,
              wrapperPid: lease.wrapperPid,
              wrapperStart: lease.wrapperStart,
            }
            session = reapSession(lease.sid, state.root, { signalFn, runner, waitMs, expectedWriter, leaseAuthority })
            if (session.outcome !== 'reaped' && session.outcome !== 'already-empty')
              causes.push(
                `leased session ${lease.sid}: ${session.outcome}${session.reason ? ` — ${session.reason}` : ''}`,
              )
          }
        }
      }
    }
    // Port corroboration (repair C, RULING-P99-52). ONE call per gate port; a NULL result is
    // recorded as an explicit unavailable cause, never smuggled through a numeric pid array — the
    // old `.flatMap(portHolders).filter(!portsBefore.has(h))` let a `null` returned by BOTH the
    // pre-spawn snapshot and the finish-time census cancel itself out of the diff, silently
    // absorbing a consistently-failing lsof into a clean verdict.
    //
    // Repair 5 (RULING-P99-60): equality requires BOTH pid AND canonical birth lstart against the
    // pre-spawn `(pid, lstart)` tuple — a pid that matches but whose start does not is a pid REUSE,
    // a genuinely NEW holder, not the same pre-existing process. A finish-time birth-lookup failure
    // is exactly as fatal as a portHolders failure.
    let portsUnavailable = false
    const newHolders = []
    for (const p of state.ports) {
      const h = portHolders(p, { runner })
      if (h === null) {
        portsUnavailable = true
        continue
      }
      for (const pid of h) {
        const start = psLstart(pid, { runner })
        if (start === null) {
          portsUnavailable = true
          continue
        }
        if (state.portsBefore.get(pid) !== start) newHolders.push(pid)
      }
    }
    if (portsUnavailable)
      causes.push('unavailable: port census failed for at least one gate port — cannot corroborate a clean finish')
    const sids = newHolders.length > 0 ? sidsNow({ runner }) : null
    const holderCause = holderVerdict({ leaseFound: leasedSid !== null, newHolders, sids, leasedSid })
    if (holderCause !== null) causes.push(holderCause)
    // The verdict: a CONJUNCTION. `clean` is never the default.
    let verdict = causes.length === 0 ? 'clean' : 'unclean'
    if (lease !== null && verdict === 'clean') {
      // Repair 1 (RULING-P99-56): re-read and revalidate the SAME lease authority immediately
      // before consume/unlink — a replacement or mutation landing between the final census and
      // this point must retain, not consume, the lease.
      if (leaseAuthority !== null && !leaseAuthorityStillValid(leasePath, leaseAuthority)) {
        causes.push(
          `unavailable: lease authority changed before consume — refusing to unlink a replaced/mutated lease`,
        )
        verdict = 'unclean'
      } else {
        try {
          unlinkSync(leasePath) // consumed — a retained lease is a sweeper retry, so keep it otherwise
        } catch (e) {
          // Repair D (RULING-P99-52): only ENOENT is "already gone". Any other unlink failure means
          // the lease was NOT actually consumed — the run must not report clean over a retained
          // authority file, and the path is named for retry rather than silently logged as swept.
          if (!e || e.code !== 'ENOENT') {
            causes.push(`unavailable: lease ${leasePath} consumed session but unlink failed: ${e.message} — retained for retry`)
            verdict = 'unclean'
          }
        }
      }
    }
    // Repair 4 (RULING-P99-54): the FINAL path is populated ONLY by an atomic publish, and ONLY
    // after a clean verdict — never written to directly, and never "withheld after the fact". A
    // failed publish is itself a cause (a clean session/port verdict is not enough if the hand-off
    // to the consumer-visible path fails); a failed retain-as-unclean is likewise a cause.
    if (verdict === 'clean') {
      const published = publishReport(state.pendingOut, state.jsonOut, state.nonce)
      if (!published.ok) {
        causes.push(`unavailable: ${published.why}`)
        verdict = 'unclean'
      }
    } else {
      const retained = retainUncleanReport(state.pendingOut, state.jsonOut, state.nonce)
      if (!retained.ok) causes.push(`unavailable: ${retained.why}`)
      // Repair 1 (RULING-P99-66): NO quarantine, NO rename, NO deletion — the consumer-visible final
      // is NEVER touched on the unclean path (see the top-of-finish() comment for the full reasoning
      // on why this repair removes the destructive action rather than trying to narrow it further).
      // What remains is purely observational: if a final happens to be sitting at `state.jsonOut`
      // while this run is ALREADY unclean for other reasons, that occupancy is recorded as an
      // explicit cause — for diagnosability, since the exit code was already going to be non-zero
      // regardless — and the file is left exactly as found, byte-identical, no filesystem mutation
      // attempted. `state.finalOccupiedAtPreflight` (recorded by `runMode` before this run did
      // anything else) is no longer consulted to gate an action — there is no action left to gate —
      // but it still earns its place: it lets this cause distinguish "already there when this run
      // started" from "appeared sometime during this run's own lifetime", which is genuinely useful
      // diagnostic context an operator reading the log benefits from, even though neither case changes
      // what this run does about it (nothing).
      if (existsSync(state.jsonOut)) {
        causes.push(
          state.finalOccupiedAtPreflight
            ? `refused: a final report was already present at ${state.jsonOut} before this run started — never moved or deleted, left byte-identical`
            : `refused: a final report is present at ${state.jsonOut} (not present at this run's own preflight observation) — never moved or deleted, left byte-identical`,
        )
      }
    }
    const pwExit = state.playwrightExit ?? 1 // interrupted before playwright returned: still red
    if (pwExit !== 0) tailLog(state.logPath, 80, err)
    // Repair 1 (RULING-P99-66): `existsSync(state.jsonOut)` alone no longer disambiguates "we
    // published it" from "an occupying final was left untouched" the way `finalOccupiedAtPreflight`
    // used to (that boolean only ever knew about occupancy AT PREFLIGHT, not a final that appeared
    // during this run and made a would-be-clean publish refuse) — `verdict` is the correct signal:
    // `publishReport` is the ONLY code path that ever creates `state.jsonOut`, and it only succeeds
    // when `verdict === 'clean'`; on any other verdict this run never wrote to that path, so a file
    // existing there is necessarily someone else's, occupying-at-preflight or not.
    const reportState = existsSync(state.jsonOut)
      ? verdict === 'clean'
        ? 'published'
        : 'OCCUPIED (left untouched, not ours — never moved or deleted)'
      : existsSync(uncleanReportPath(state.jsonOut, state.nonce))
        ? 'WITHHELD (.unclean.json)'
        : state.pendingOut && existsSync(state.pendingOut)
          ? 'PENDING (never published)'
          : 'ABSENT'
    log(
      `pw-run-reaped: ${why}; group ${state.pgid} -> ${JSON.stringify(seen)}; ` +
        `session ${session ? session.outcome : 'none'}; verdict ${verdict}` +
        `${causes.length ? `; causes ${JSON.stringify(causes)}` : ''}; ` +
        `report ${reportState}; child output ${state.logPath}`,
    )
    exitFn(verdict === 'clean' ? pwExit : 90)
  }
}

/**
 * Every catchable exit path routes to the one finisher (F6). SIGHUP is catchable on macOS and its
 * default is terminate — a disappearing supervising terminal is exactly how a worker pane dies.
 * SIGKILL is absent BY NAME: it is uncatchable (POSIX, not implementation), and the lease plus
 * `--sweep` own that path.
 */
export const installExitHandlers = (finish, { log = console.error } = {}) => {
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => finish(`caught ${sig}`))
  process.on('uncaughtException', (e) => {
    log(`pw-run-reaped: uncaughtException: ${e?.stack ?? e}`)
    finish(`uncaughtException: ${e?.message ?? e}`) // cleanup, then non-zero exit — no resume
  })
  process.on('unhandledRejection', (r) => {
    log(`pw-run-reaped: unhandledRejection: ${r}`)
    finish(`unhandledRejection: ${r}`)
  })
}

/* ─────────────────────────────── MODES ──────────────────────────────── */

const usage = () => {
  console.error(
    'usage: pw-run-reaped.mjs (-- <playwright args...> | <spec> <project> <jsonOut> | ' +
      '--lease-exec -- <cmd...> | --sweep <root>)',
  )
  process.exit(2)
}

/**
 * LEASE WRITER, invoked by playwright.config.ts as webServer.command. Writes its identity INSIDE
 * the web-server session, then becomes the dev stack's session-leader parent. Node exposes no
 * exec(3); the writer supervises the stack for its whole lifetime instead, which keeps the
 * recorded pid/pgid/sid/lstart valid anchors — the shape launch-daemon.sh gets from shell `exec`.
 *
 * python3 missing: the lease is written with sid:null and a reason, and the command STILL runs —
 * an instrument must never sabotage the run it observes. RUN then reports `unavailable` and the
 * gate goes red. PW_LEASE_* env absent (ad-hoc `pnpm exec playwright test`, unroutable by
 * construction): warn and run UNLEASED — recovery for that path is `--sweep`, stated not papered.
 */
const leaseExecMode = (argv) => {
  const [dash, ...cmd] = argv
  if (dash !== '--' || cmd.length === 0) usage()
  const nonce = process.env.PW_LEASE_NONCE
  const dir = process.env.PW_LEASE_DIR
  const root = process.env.PW_LEASE_ROOT
  if (!nonce || !dir || !root) {
    console.error('pw-run-reaped --lease-exec: PW_LEASE_* env absent — running UNLEASED (ad-hoc invocation)')
  } else {
    let sid = null
    let reason = null
    try {
      const out = execFileSync('python3', ['-c', 'import os;print(os.getsid(0))'], { encoding: 'utf8' }).trim()
      const n = Number(out)
      if (Number.isInteger(n) && n > 1) sid = n
      else reason = `python3 returned an unusable sid: ${JSON.stringify(out)}`
    } catch (e) {
      reason = `python3 unavailable: ${e.message}`
    }
    writeLeaseAtomic(dir, nonce, {
      nonce,
      sid,
      reason,
      pid: process.pid,
      pgid: pgidOf(process.pid),
      lstart: psLstart(process.pid),
      cwd: realpathSync(process.cwd()),
      root,
      wrapperPid: Number(process.env.PW_LEASE_WRAPPER_PID) || null,
      wrapperStart: process.env.PW_LEASE_WRAPPER_START || null,
      writtenAt: new Date().toISOString(),
    })
  }
  const child = spawn(cmd[0], cmd.slice(1), { stdio: 'inherit' })
  child.on('error', (e) => {
    console.error(`pw-run-reaped --lease-exec: cannot start ${cmd[0]}: ${e.message}`)
    process.exit(1)
  })
  child.on('exit', (code) => process.exit(code ?? 1))
}

/** ORPHAN RECOVERY. Nonzero if any orphan ended refused/unavailable/survivors. */
const sweepMode = (root) => {
  if (root === undefined) usage()
  const res = sweepLeases(root)
  console.log(`pw-run-reaped --sweep ${root}: ${JSON.stringify(res)}`)
  process.exit(res.failed.length === 0 ? 0 : 1)
}

/**
 * RUN. Pass-through (`-- <args>`) appends args to `pnpm exec playwright test`; the legacy
 * positional form (<spec> <project> <jsonOut>) keeps working — the three closed plans still
 * contain it, and a landmine in a preserved-but-dead command is still a landmine.
 *
 * Exported with a DI seam (repair G, RULING-P99-52, T14): `root`/`spawnFn`/`finisherDeps` allow a
 * caller to drive the REAL stale-report-clearing path through this exact entry — never the helper
 * alone — without starting a real Playwright process or a real cwd mutation. The seam was added for
 * the drill harness removed in RULING-P99-82; it is retained because the overrides default to
 * production values. The real CLI call at the bottom of this file passes no overrides, so
 * production behaviour is unchanged.
 */
export const runMode = (
  argv,
  { root: rootOverride = null, spawnFn = spawn, runner = execFileSync, finisherDeps = {} } = {},
) => {
  let pwArgs
  let jsonOut = null
  if (argv[0] === '--') {
    pwArgs = argv.slice(1)
    if (pwArgs.length === 0) usage()
  } else {
    const [spec, project, out] = argv
    if (spec === undefined || project === undefined || out === undefined) usage()
    pwArgs = [spec, `--project=${project}`, '--no-deps']
    jsonOut = out
  }
  let root
  try {
    root = rootOverride ?? realpathSync(process.cwd())
  } catch (e) {
    console.error(`pw-run-reaped: cannot canonicalise cwd as containment root: ${e.message}`)
    process.exit(90) // no trustworthy root -> no containment guarantee -> red, never a guess
  }
  const nonce = mintNonce()
  const leaseDir = leaseDirOf(root)
  mkdirSync(leaseDir, { recursive: true })
  if (jsonOut === null) jsonOut = join(root, 'test-results', `pw-reaped-${nonce}.json`)
  mkdirSync(dirname(jsonOut), { recursive: true })
  const pendingOut = pendingReportPath(jsonOut, nonce)
  // Repair 1 (RULING-P99-64), ROLE CHANGED by RULING-P99-66 — DELIBERATE, stated explicitly: the
  // PREFLIGHT OCCUPANCY OBSERVATION, recorded HERE at the earliest possible moment this run examines
  // the shared final path, before it does anything else to it. Originally (R8) this GATED whether
  // createFinisher's foreign-final quarantine was allowed to rename `jsonOut` away. R9 REMOVES that
  // quarantine entirely (see createFinisher's doc comment) — there is no destructive action left for
  // this boolean to gate, and it does NOT gate anything anymore. It is kept only because it still
  // earns its place as DIAGNOSTIC CONTEXT: `state.finalOccupiedAtPreflight` lets createFinisher's
  // occupancy cause distinguish "a final was already there when this run started" from "one appeared
  // sometime during this run's own lifetime" in the log text an operator reads — genuinely useful
  // information, even though neither case changes what this run actually does (nothing, on any path).
  const finalOccupiedAtPreflight = existsSync(jsonOut)
  // Repair 4 (RULING-P99-54): T14's stale-clear now also fails CLOSED — a stale FINAL/pending/
  // unclean path that cannot be removed refuses to proceed rather than risking a stale report
  // surviving under a run that never actually produced one.
  //
  // Repair 1 (RULING-P99-62, CORRECTED RULING-P99-64): clears THIS run's own (about-to-be-used)
  // nonce-bound pending AND unclean paths — never every `<jsonOut>.pending-*`/`<jsonOut>.unclean-*`,
  // which would delete a concurrently-running supported caller's in-flight evidence at the same final
  // path, and NEVER `jsonOut` itself — the shared final has no nonce ownership at startup and is
  // never this function's to delete (see clearStaleReport's doc comment).
  try {
    clearStaleReport(jsonOut, nonce)
  } catch (e) {
    console.error(`pw-run-reaped: ${e.message}`)
    process.exit(90)
  }
  // Amendment 2: orphan recovery runs on the PRODUCT path, BEFORE spawning, skipping any lease a
  // live wrapper still owns. A failed sweep is a loud red, not a skipped chore.
  const sweep = sweepLeases(root)
  const sweepFailures = sweep.failed.map(
    (f) => `orphan sweep: ${f.lease}: ${f.outcome ?? ''} ${f.why ?? ''}`.trim(),
  )
  // Captured BEFORE the spawn: everything already on these ports belongs to someone else. With the
  // lease as authority this set is CORROBORATION — it bounds "new holder" detection, and a new
  // holder with no lease is a refusal, never a target (F2).
  //
  // Repair 1 (RULING-P99-54): explicit TRI-STATE loop, never `GATE_PORTS.flatMap(portHolders)`. The
  // old flatMap inserted a literal `null` into the pid Set on an unavailable lookup; if the SAME
  // port then failed identically at finish, `Set.has(null)` cancelled the `null` out of the diff
  // and a clean verdict survived (R3-N3, reproduced independently by both reviewers). An unavailable
  // PRE-SPAWN census is not merely a cause to log later — it PREVENTS the Playwright child from
  // spawning at all, exiting non-zero with the port named.
  //
  // Repair 5 (RULING-P99-60): a `(pid, canonical birth lstart)` TUPLE, not a bare pid number — a
  // pid alone is reused constantly, and a finish-time census that only compares pid numbers treats
  // a brand-new, unrelated process as "pre-existing" the instant it happens to land on a pid this
  // port held before spawn (Codex, CONSULT-REAPER-SAFETY-R6-REPORT.md item 5: "a finish-time PID
  // equal to a pre-spawn PID is treated as pre-existing without an lstart comparison"). A birth
  // lookup that fails is exactly as fatal as a portHolders failure — an unproven holder identity is
  // not a known holder, so it refuses to spawn rather than silently trusting a bare number.
  const portsBefore = new Map()
  for (const port of GATE_PORTS) {
    const holders = portHolders(port, { runner })
    if (holders === null) {
      console.error(
        `pw-run-reaped: pre-spawn port census unavailable for port ${port} — refusing to spawn ` +
          '(an unlooked port is not an empty port)',
      )
      process.exit(90)
    }
    for (const pid of holders) {
      const start = psLstart(pid, { runner })
      if (start === null) {
        console.error(
          `pw-run-reaped: pre-spawn birth-identity lookup unavailable for pid ${pid} on port ${port} ` +
            '— refusing to spawn (an unproven holder identity is not a known holder)',
        )
        process.exit(90)
      }
      portsBefore.set(pid, start)
    }
  }
  // The child's output goes to `<jsonOut>.log`: when Playwright aborts before its reporter
  // finalises — a webServer that never comes up is the common way — no JSON is written at all,
  // and a discarded log made that refusal correct and UNDIAGNOSABLE (measured on P99-02 attempt 0,
  // RULING-P99-32).
  const logPath = `${jsonOut}.log`
  const logFd = openSync(logPath, 'w')
  // Repair 4 (RULING-P99-54): Playwright writes its JSON reporter output to the PRIVATE PENDING
  // path — never the FINAL path a legacy consumer reads. Only createFinisher's atomic publish
  // (on a clean verdict) ever creates the final path.
  //
  // Repair 6 (RULING-P99-56): PLAYWRIGHT_JSON_OUTPUT_FILE, not ...OUTPUT_NAME. Playwright's own
  // `resolveOutputFile("JSON", ...)` (playwright/lib/runner) checks OUTPUT_FILE FIRST and returns
  // it verbatim as the resolved path; only when OUTPUT_FILE is absent does it fall through to
  // OUTPUT_DIR + OUTPUT_NAME, resolving NAME as a *filename relative to that directory* via
  // `path.resolve(outputDir, reportName)`. `path.resolve` happens to return an absolute second
  // argument unchanged, which is the ONLY reason ...NAME worked before — `pendingOut` is always
  // absolute. A relative NAME would silently resolve under `outputDir` instead, and a clean run
  // would `publishReport` a report that was never written, exiting 0 with no consumer JSON at all
  // (Grok, P99R-VERIFY-R3-REPORT.md residual 1). OUTPUT_FILE has no such fallback ambiguity.
  const child = spawnFn('pnpm', ['exec', 'playwright', 'test', ...pwArgs, '--reporter=json'], {
    detached: true, // own process group — this is what makes group-reaping possible
    stdio: ['ignore', logFd, logFd],
    env: {
      ...process.env,
      PLAYWRIGHT_JSON_OUTPUT_FILE: pendingOut,
      PW_LEASE_NONCE: nonce,
      PW_LEASE_DIR: leaseDir,
      PW_LEASE_ROOT: root,
      PW_LEASE_WRAPPER_PID: String(process.pid),
      PW_LEASE_WRAPPER_START: psLstart(process.pid) ?? '',
    },
  })
  // Repair 4 (RULING-P99-60): record the direct child's own canonical birth identity — PID, PGID
  // (equal to PID under `detached: true`), and start — the same way the lease writer records its
  // own. `reapGroup` reverifies this immediately before every signal, refusing to signal a group
  // whose leader was replaced by an unrelated process that happened to reuse this exact pid/pgid.
  const state = {
    pgid: child.pid,
    childPgidStart: psLstart(child.pid, { runner }),
    nonce,
    leaseDir,
    root,
    jsonOut,
    pendingOut,
    finalOccupiedAtPreflight,
    logPath,
    ports: GATE_PORTS,
    portsBefore,
    sweepFailures,
    playwrightExit: null,
  }
  const finish = createFinisher(state, finisherDeps)
  installExitHandlers(finish)
  child.on('exit', (code, signal) => {
    state.playwrightExit = code ?? 1 // killed by a signal is still a red run
    finish(`playwright exited code=${code} signal=${signal}`)
  })
  child.on('error', (e) => {
    state.playwrightExit = 1
    finish(`playwright failed to start: ${e.message}`)
  })
}

// Only act when RUN as a program. Imported by ANY consumer, this file must do nothing — a live
// drill caught an earlier version exiting 2 on import and leaving a group alive.
//
// Repair 6 (RULING-P99-54): entry status is CANONICAL FILESYSTEM IDENTITY, never byte-equality
// between `import.meta.url` and `process.argv[1]`. Invoking this exact file through macOS's
// `/var` <-> `/private/var` alias (or any symlink) previously made the two URLs differ even though
// they name the identical file — the script decided it was imported, did nothing, and exited 0 on
// all seven bootstrap failure shapes (R3-N4, CONSULT-REAPER-SAFETY-R3-REPORT.md: "the program
// treated itself as imported, did nothing, and exited 0 in all seven failure cases"). Resolving
// BOTH sides through `realpathSync` closes that: an alias or a symlink to the same file resolves
// to the same canonical path, and only a genuinely DIFFERENT file (the real "imported by another
// module" case) still compares unequal.
// Repair 5 (RULING-P99-56): `isCliEntry` returns true ONLY on POSITIVE canonical identity
// equality — never on ambiguity. R3's fix correctly closed the alias/symlink false-negative
// (R3-N4: a REAL CLI invocation through a resolvable alias/symlink path wrongly compared unequal),
// but its `catch => true` / `!argv1 => true` fallbacks over-corrected: an IMPORTED runtime whose
// importer's own `argv[1]` happens to be missing or unresolvable (e.g. a dynamic import from a
// script with a synthetic/nonexistent argv[1]) was then wrongly PROMOTED to CLI and ran `usage()` +
// `process.exit(2)` as a side effect of merely being imported — violating this file's own
// documented invariant that importing must do nothing (Codex, R4-N5: "an imported runtime whose
// argv[1] is unresolvable is classified as CLI and exits 2... that violates the runtime's own
// invariant that importing must do nothing"). Missing or unresolvable argv[1] is now imported/false
// in BOTH directions: it can never prove CLI, so it never triggers CLI-only side effects. A
// genuinely-CLI invocation through `/var`/symlink still resolves fine (realpathSync succeeds on a
// valid alias/symlink) and still compares equal, so R3-N4 remains closed.
const isCliEntry = () => {
  const argv1 = process.argv[1]
  if (!argv1) return false // cannot prove CLI invocation — never promote an import to CLI
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(argv1)
  } catch {
    return false // canonicalization failed — same: no positive proof, no CLI action
  }
}
const isEntry = isCliEntry()
if (!isEntry) {
  // imported: expose the exports and stop
} else if (process.argv[2] === '--lease-exec') {
  leaseExecMode(process.argv.slice(3))
} else if (process.argv[2] === '--sweep') {
  sweepMode(process.argv[3])
} else {
  runMode(process.argv.slice(2))
}
