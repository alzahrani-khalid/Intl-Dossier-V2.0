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
import { spawn } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
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
  console.log(process.exitCode ? 'SELFTEST FAILED' : 'SELFTEST OK (4/4)')
}

// Only act when RUN as a program. Imported (for reapGroup, or by a test), this file must do
// nothing — a live drill caught the earlier version exiting 2 on import and leaving the group alive.
const isEntry = import.meta.url === pathToFileURL(process.argv[1] ?? '').href
if (!isEntry) {
  // imported: expose reapGroup and stop
} else if (process.argv[2] === '--selftest') {
  selftest()
} else {
  const [spec, project, jsonOut] = process.argv.slice(2)
  if (spec === undefined || project === undefined || jsonOut === undefined) {
    console.error('usage: <specPath> <project> <jsonOutPath>')
    process.exit(2)
  }
  if (existsSync(jsonOut)) rmSync(jsonOut)
  const child = spawn(
    'pnpm',
    ['exec', 'playwright', 'test', spec, `--project=${project}`, '--no-deps', '--reporter=json'],
    {
      detached: true, // own process group — this is what makes group-reaping possible
      stdio: 'ignore',
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: jsonOut },
    },
  )
  const pgid = child.pid
  const finish = (why) => {
    const seen = reapGroup(pgid)
    console.log(
      `pw-run-reaped: ${why}; group ${pgid} -> ${JSON.stringify(seen)}; report ${existsSync(jsonOut) ? 'written' : 'ABSENT'}`,
    )
    process.exit(0) // the verdict is pw-red-assert's, never this script's
  }
  child.on('exit', (code, signal) => finish(`playwright exited code=${code} signal=${signal}`))
  child.on('error', (e) => finish(`playwright failed to start: ${e.message}`))
  for (const sig of ['SIGINT', 'SIGTERM'])
    process.on(sig, () => finish(`orchestrator sent ${sig}`)) // failure path reaps too
}
