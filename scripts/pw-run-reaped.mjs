#!/usr/bin/env node
/**
 * Run one Playwright spec and REAP whatever it started — on the failure path as much as the
 * success path (RULING-P99-28 §4.1).
 *
 * WHY. `RULING-P99-17` moved rendered verification into the acceptance gate. The gate runs
 * Playwright, and Playwright's `webServer` is `pnpm dev`, which starts the whole stack inside the
 * worktree. Nothing reaped it when a run ended parked or halted, so every run left a dev stack
 * behind. They accumulated across five runs until ~28,000 descriptors were held and the next
 * process to ask for one — a kimi consult — died with EMFILE and returned a stack trace where a
 * verdict belonged. A gate that starts a server owns stopping it.
 *
 * HOW. The child is spawned `detached`, which makes it a process-group leader. We then signal the
 * whole GROUP by its negative pgid. That is stricter than the "kill by PID from a parse, never by
 * name" rule asks for: we never search for anything, we only ever signal the group WE created, so
 * there is no matcher that can widen onto an innocent process. (The overseer's own safety grep
 * matched `tickmarkr|codex|…` inside worktree PATHS rather than executables — this design has no
 * matcher to get wrong.)
 *
 * The exit code of playwright is intentionally NOT propagated: the verdict belongs to
 * pw-red-assert.mjs reading the JSON report. This script's job is to run and to reap.
 *
 * usage: node scripts/pw-run-reaped.mjs <specPath> <project> <jsonOutPath>
 *   self-check: node scripts/pw-run-reaped.mjs --selftest
 */
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, openSync, rmSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

/** TERM the group, then KILL any survivor. Returns what it observed, never throws. */
export const reapGroup = (pgid, { signalFn = process.kill, waitMs = 1500 } = {}) => {
  const seen = { termed: false, killed: false, alreadyGone: false }
  const alive = () => {
    try {
      signalFn(-pgid, 0)
      return true
    } catch {
      return false
    }
  }
  if (!alive()) {
    seen.alreadyGone = true
    return seen
  }
  try {
    signalFn(-pgid, 'SIGTERM')
    seen.termed = true
  } catch {
    /* raced to exit */
  }
  const deadline = Date.now() + waitMs
  while (Date.now() < deadline && alive()) {
    // busy-wait is fine: this is a teardown path measured in a second, not a hot loop
  }
  if (alive()) {
    try {
      signalFn(-pgid, 'SIGKILL')
      seen.killed = true
    } catch {
      /* raced to exit */
    }
  }
  return seen
}

/**
 * The ports a rendered gate's webServer occupies. A PARAMETER, not a constant, so the drill can
 * exercise this code with real processes on a throwaway port instead of fighting a live run for
 * 5173 — the property under test is the process TOPOLOGY and the ATTRIBUTION rule, never the
 * port number.
 */
export const GATE_PORTS = [5173, 5001]

/** pids listening on a port. `lsof` exits 1 when nothing matches — that is empty, not an error. */
export const portHolders = (port, { runner = execFileSync } = {}) => {
  try {
    const out = runner('lsof', ['-ti', `tcp:${port}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return out.split('\n').map((s) => s.trim()).filter(Boolean).map(Number)
  } catch {
    return []
  }
}

const pgidOf = (pid, { runner = execFileSync } = {}) => {
  try {
    return Number(runner('ps', ['-o', 'pgid=', '-p', String(pid)], { encoding: 'utf8' }).trim())
  } catch {
    return 0
  }
}

/**
 * Reap a webServer that ESCAPED our process group (RULING-P99-35).
 *
 * WHY THIS EXISTS AND reapGroup CANNOT DO IT. Playwright starts `webServer` in its OWN process
 * group with `ppid=1`. Signalling `-pgid` of the group we created therefore cannot reach it BY
 * CONSTRUCTION — which is why the group reap drilled 4/4 against a real 3-member group and still
 * leaked a dev server every single run. The leaked server then holds 5173 against the NEXT
 * rendered gate, which dies at webServer start with no report; with the rendered lane serialized
 * that is one manual reap per task, for twelve tasks.
 *
 * ATTRIBUTION IS THE WHOLE SAFETY ARGUMENT. We reap only holders that were NOT there before we
 * spawned. A server the operator (or another run) already had is untouched — the same provenance
 * line RULING-P99-33 drew, enforced mechanically instead of by intention. `before` MUST be
 * captured before the spawn; passing a stale or empty set turns this into an indiscriminate
 * port killer, so it is a required argument with no default.
 */
export const reapLeakedPorts = (ports, before, { reap = reapGroup, runner = execFileSync } = {}) => {
  if (!(before instanceof Set)) throw new TypeError('reapLeakedPorts: `before` must be a Set')
  const ourPgid = pgidOf(process.pid, { runner })
  const out = { leaked: [], reaped: [], spared: [], survived: [] }
  for (const port of ports) {
    for (const pid of portHolders(port, { runner })) {
      if (before.has(pid)) {
        out.spared.push({ port, pid, why: 'pre-existing — not ours' })
        continue
      }
      const pgid = pgidOf(pid, { runner })
      // Never signal group 0/1, and never our own group: a reaper that kills its own caller is
      // the widening failure this design exists to avoid.
      if (!pgid || pgid <= 1 || pgid === ourPgid) {
        out.spared.push({ port, pid, pgid, why: 'unsafe target group' })
        continue
      }
      out.leaked.push({ port, pid, pgid })
      out.reaped.push({ port, pid, pgid, seen: reap(pgid) })
    }
  }
  // VERIFY WHAT SURVIVED — a reap that is not verified is a claim.
  for (const port of ports)
    for (const pid of portHolders(port, { runner }))
      if (!before.has(pid)) out.survived.push({ port, pid })
  return out
}

const selftest = () => {
  const calls = []
  const fake = (target, sig) => {
    calls.push([target, sig])
    // pretend it is alive for the first liveness probe, dead afterwards
    if (sig === 0 && calls.filter(([, s]) => s === 0).length > 1) throw new Error('ESRCH')
  }
  const r = reapGroup(4242, { signalFn: fake, waitMs: 10 })
  const negative = calls.every(([t]) => t === -4242)
  const termed = calls.some(([, s]) => s === 'SIGTERM')
  console.log(`${negative ? 'PASS' : 'FAIL'} every signal targets the GROUP (-pgid), never a bare pid`)
  console.log(`${termed ? 'PASS' : 'FAIL'} a live group receives SIGTERM`)
  console.log(`${r.termed ? 'PASS' : 'FAIL'} result reports what it did`)
  const gone = reapGroup(4242, {
    signalFn: () => {
      throw new Error('ESRCH')
    },
    waitMs: 10,
  })
  console.log(`${gone.alreadyGone ? 'PASS' : 'FAIL'} an already-dead group is a no-op, not an error`)
  if (!(negative && termed && r.termed && gone.alreadyGone)) process.exitCode = 1
  return negative && termed && r.termed && gone.alreadyGone
}

/**
 * TWO-SIDED ESCAPE DRILL, on real processes.
 *
 * Runs on a THROWAWAY port: the properties under test are (a) can we reap a holder that escaped
 * our process group, and (b) do we spare one that predates us. Neither is a property of 5173, and
 * binding 5173 would fight a live run for it.
 *
 * INCONCLUSIVE IS NOT A PASS. If a plant never actually reaches LISTEN, this reports INCONCLUSIVE
 * and fails — measured 2026-08-19, a plant that never bound made a broken guard look green.
 */
const PORT = 45173

const plant = () => {
  const c = spawn(
    process.execPath,
    ['-e', `require('net').createServer().listen(${PORT},'127.0.0.1');setTimeout(()=>{},60000)`],
    { detached: true, stdio: 'ignore' }, // own process group == the ESCAPE topology under test
  )
  c.unref()
  return c.pid
}

const waitHeld = (pid, ms = 4000) => {
  const deadline = Date.now() + ms
  while (Date.now() < deadline) {
    if (portHolders(PORT).includes(pid)) return true
    try {
      execFileSync('sleep', ['0.1'])
    } catch {
      /* ignore */
    }
  }
  return false
}

const escapeDrill = () => {
  let ok = true
  const tally = { pass: 0, total: 0 }
  const check = (cond, label) => {
    tally.total += 1
    if (cond) tally.pass += 1
    else ok = false
    console.log(`${cond ? 'PASS' : 'FAIL'} ${label}`)
    return cond
  }
  const ourPgid = pgidOf(process.pid)

  // ── POSITIVE: a holder that ESCAPED our group must be reaped ──────────────────────────────
  const before = new Set(portHolders(PORT)) // captured BEFORE the plant -> plant is "ours"
  const victim = plant()
  if (!waitHeld(victim)) {
    console.log('INCONCLUSIVE positive: plant never reached LISTEN — NOT scored as a pass')
    try { process.kill(victim, 'SIGKILL') } catch { /* gone */ }
    process.exitCode = 1
    return false
  }
  const victimPgid = pgidOf(victim)
  // Assert WHICH topology we are testing (SO-15): if the plant shared our group, the group reap
  // would have covered it and this drill would prove nothing.
  const escaped = check(
    victimPgid !== ourPgid && victimPgid > 1,
    `plant escaped our group (plant pgid ${victimPgid} vs ours ${ourPgid}) — the topology reapGroup cannot reach`,
  )
  const res = reapLeakedPorts([PORT], before)
  const gone = !portHolders(PORT).includes(victim)
  check(res.reaped.some((r) => r.pid === victim), 'the escaped holder was targeted')
  check(gone, 'the escaped holder is GONE after the reap (verified, not claimed)')
  if (!(escaped && gone)) ok = false
  if (!gone) try { process.kill(victim, 'SIGKILL') } catch { /* gone */ }

  // ── NEGATIVE: a PRE-EXISTING holder must SURVIVE ──────────────────────────────────────────
  const bystander = plant()
  if (!waitHeld(bystander)) {
    console.log('INCONCLUSIVE negative: bystander never reached LISTEN — NOT scored as a pass')
    try { process.kill(bystander, 'SIGKILL') } catch { /* gone */ }
    process.exitCode = 1
    return false
  }
  const before2 = new Set(portHolders(PORT)) // captured AFTER -> bystander is pre-existing
  const res2 = reapLeakedPorts([PORT], before2)
  const survived = portHolders(PORT).includes(bystander)
  check(survived, 'a pre-existing holder SURVIVES the reap (attribution holds)')
  check(res2.reaped.length === 0, 'nothing was reaped in the negative case')
  try { process.kill(bystander, 'SIGKILL') } catch { /* gone */ }

  if (!ok) process.exitCode = 1
  escapeDrill.tally = tally
  return ok
}

// Only act when RUN as a program. Imported (for reapGroup, or by a test), this file must do
// nothing — a live drill caught the earlier version exiting 2 on import and leaving the group alive.
const isEntry = import.meta.url === pathToFileURL(process.argv[1] ?? '').href
if (!isEntry) {
  // imported: expose reapGroup and stop
} else if (process.argv[2] === '--selftest') {
  const a = selftest()
  const b = escapeDrill()
  const t = escapeDrill.tally ?? { pass: 0, total: 0 }
  console.log(a && b ? `SELFTEST OK (4/4 group + ${t.pass}/${t.total} escape)` : 'SELFTEST FAILED')
} else {
  const [spec, project, jsonOut] = process.argv.slice(2)
  if (spec === undefined || project === undefined || jsonOut === undefined) {
    console.error('usage: <specPath> <project> <jsonOutPath>')
    process.exit(2)
  }
  if (existsSync(jsonOut)) rmSync(jsonOut)
  // Captured BEFORE the spawn: everything already on these ports belongs to someone else and is
  // permanently out of scope for the reap below. This line IS the attribution guarantee.
  const portsBefore = new Set(GATE_PORTS.flatMap((port) => portHolders(port)))
  // Capture the child's output to `<jsonOut>.log`. `stdio: 'ignore'` discarded the ONLY evidence
  // that explains an ABSENT report: when Playwright aborts before its reporter finalises — a
  // webServer that never comes up is the common way — no JSON is written at all, and with the
  // output thrown away the failure says "report ABSENT" and nothing about why. Measured
  // 2026-08-19 on P99-02 attempt 0 (RULING-P99-32): the refusal was correct and undiagnosable.
  const logPath = `${jsonOut}.log`
  const logFd = openSync(logPath, 'w')
  const child = spawn(
    'pnpm',
    ['exec', 'playwright', 'test', spec, `--project=${project}`, '--no-deps', '--reporter=json'],
    {
      detached: true, // own process group — this is what makes group-reaping possible
      stdio: ['ignore', logFd, logFd],
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: jsonOut },
    },
  )
  const pgid = child.pid
  const finish = (why) => {
    const seen = reapGroup(pgid)
    // The group reap CANNOT reach Playwright's webServer — it lives in its own group (P99-35).
    // This second pass catches exactly what escaped, and only what we ourselves started.
    const ports = reapLeakedPorts(GATE_PORTS, portsBefore)
    const portMsg =
      ports.reaped.length === 0 && ports.spared.length === 0
        ? 'none'
        : `reaped ${JSON.stringify(ports.reaped.map((r) => `${r.pid}@${r.port}`))}` +
          (ports.spared.length ? ` spared ${JSON.stringify(ports.spared.map((r) => `${r.pid}@${r.port}`))}` : '') +
          (ports.survived.length ? ` SURVIVED ${JSON.stringify(ports.survived.map((r) => `${r.pid}@${r.port}`))}` : '')
    console.log(
      `pw-run-reaped: ${why}; group ${pgid} -> ${JSON.stringify(seen)}; ports ${portMsg}; report ${existsSync(jsonOut) ? 'written' : 'ABSENT'}; child output ${logPath}`,
    )
    process.exit(0) // the verdict is pw-red-assert's, never this script's
  }
  child.on('exit', (code, signal) => finish(`playwright exited code=${code} signal=${signal}`))
  child.on('error', (e) => finish(`playwright failed to start: ${e.message}`))
  for (const sig of ['SIGINT', 'SIGTERM'])
    process.on(sig, () => finish(`orchestrator sent ${sig}`)) // failure path reaps too
}
