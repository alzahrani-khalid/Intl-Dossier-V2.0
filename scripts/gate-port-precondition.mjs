#!/usr/bin/env node
/**
 * gate-port-precondition.mjs — fail FAST and LOUD when a gate port is already held, and CAPTURE
 * the squatter's provenance at the moment of detection (RULING-P99-180 / RULING-P99-181).
 *
 *   usage: node scripts/gate-port-precondition.mjs [--strict] [--capture <path>]
 *   exit 0 = ports clear (or census unavailable without --strict)
 *   exit 1 = a gate port is held, or --strict and the census could not be taken
 *
 * WHY THIS EXISTS. A dev server outside the leased session held 5173/5001 during P99-21's gates.
 * The reaper refused it correctly ("not ours to touch") and the run presented the squatter as
 * TWO 300-SECOND TIMEOUTS three specs into an eight-spec suite — the least diagnosable shape
 * available. Both the Arabic leg AND its English control timed out, which is the tell that the
 * page never became ready rather than that a translation was missing. Ten minutes of wall clock
 * and an attempt were spent on a condition detectable in milliseconds at dispatch.
 *
 * WHY IT CAPTURES BEFORE IT FAILS. That incident is PERMANENTLY UNDECIDABLE: by the time anyone
 * looked, both holder pids were gone and their birth identity with them, so whether they escaped
 * from the previous task or from this one's own descendants can no longer be established. Neither
 * the reaper nor any refusal recorded who was holding the port. "Capture provenance BEFORE
 * killing" was already a filed lesson in this project and had never been wired into an instrument,
 * so it was paid for a second time. It is wired in here: the JSONL record is flushed before this
 * process exits non-zero, and nothing in this file signals, kills, or reaps — a detector that
 * destroys its own evidence is how the first occurrence became unanswerable.
 *
 * THE VERDICT RULE lives in `process-provenance.mjs` — pre-written, and CORRECTED there by the
 * first data it met (RULING-P99-182): CWD answers OWNERSHIP, SID answers CONTAINMENT, and a
 * differing SID means ESCAPED, never FOREIGN. Cross-task blame requires a foreign CWD.
 *
 * WORKTREE-CWD IS THE CENSUS BACKSTOP, and it is why this file reports ownership rather than just
 * "a port is busy". The escape that motivated this file is invisible to a SESSION census by
 * construction — the dev stack lands in a different session than the lease — so the one test that
 * cannot be evaded is: is this process's cwd inside our worktree? A `setsid` changes the session;
 * it does not change the cwd. Both signals are recorded, and both are reported; neither alone.
 *
 * ON THE UNAVAILABLE CENSUS. `lsof` failing is NOT "ports are clear", and it is not proof of a
 * squatter either. Default is to WARN and PROCEED, deliberately: a precondition that parks a task
 * on an instrument hiccup manufactures exactly the class of spurious red this phase spent days
 * removing (7 of 8 rendered reds were instrument-manufactured), whereas the downstream failure it
 * would prevent is now recognisable on sight. `--strict` inverts that for anyone who wants the
 * other trade. The choice is stated rather than buried.
 */
import { execFileSync } from 'node:child_process'
import { appendFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { GATE_PORTS } from './pw-run-reaped.mjs' // ONE definition of the ports, never a copy
// Identity capture lives in an INERT module (RULING-P99-182): importing an instrument must never
// run it. This file is an entry point and does work; that one exposes it and does nothing.
import { provenance, ownership } from './process-provenance.mjs'

const C = { encoding: 'utf8', env: { ...process.env, LC_ALL: 'C', LANG: 'C', LC_TIME: 'C' } }
const argv = process.argv.slice(2)
const strict = argv.includes('--strict')
const capIdx = argv.indexOf('--capture')
const capturePath =
  capIdx >= 0 && argv[capIdx + 1] ? argv[capIdx + 1] : join(process.cwd(), '.pw-port-squatters.jsonl')
// `--ports` exists so this can be DRILLED on a scratch port. Drilling the real 5173/5001 would mean
// binding the very ports a live gate uses, i.e. manufacturing the incident this file prevents.
const portIdx = argv.indexOf('--ports')
const PORTS =
  portIdx >= 0 && argv[portIdx + 1]
    ? argv[portIdx + 1].split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0)
    : GATE_PORTS

/** Holders of one port: array of pids, or NULL when the census itself failed. */
const holders = (port) => {
  try {
    // `-sTCP:LISTEN` is load-bearing (RULING-P99-184): without it this counts Playwright's own
    // browser connections as squatters, which is a false positive on every rendered run.
    return execFileSync('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'], C)
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0)
  } catch (e) {
    if (e && e.status === 1 && String(e.stdout ?? '').trim() === '') return [] // valid empty
    return null
  }
}

// The leased sid, when this worktree has a lease on disk — the CONTAINMENT comparison needs it.
// Absent is fine and is reported as such; it is never guessed.
let leasedSid = null
try {
  const dir = join(process.cwd(), '.pw-leases')
  const f = readdirSync(dir).find((x) => x.endsWith('.lease'))
  if (f) leasedSid = JSON.parse(readFileSync(join(dir, f), 'utf8'))?.sid ?? null
} catch {
  leasedSid = null
}

const held = []
let unavailable = []
for (const port of PORTS) {
  const h = holders(port)
  if (h === null) {
    unavailable.push(port)
    continue
  }
  for (const pid of h) held.push({ port, ...provenance(pid) })
}

if (held.length > 0) {
  // CAPTURE FIRST. The record must outlive the process, and this exits non-zero immediately after.
  const record = {
    ts: new Date().toISOString(),
    cwd: process.cwd(),
    leasedSid,
    holders: held.map((h) => ({ ...h, ownership: ownership(h, { root: process.cwd(), leasedSid }) })),
  }
  try {
    mkdirSync(dirname(capturePath), { recursive: true })
    appendFileSync(capturePath, JSON.stringify(record) + '\n')
  } catch (e) {
    console.error(`gate-port-precondition: CAPTURE FAILED (${e.message}) — provenance follows inline`)
  }
  console.error('gate-port-precondition: GATE PORT ALREADY HELD — refusing to start a rendered gate.')
  console.error('  A squatter presents downstream as a 300s test timeout, not as a port error.')
  for (const h of held) {
    const o = ownership(h, { root: process.cwd(), leasedSid })
    console.error(
      `  port ${h.port}: pid ${h.pid} ppid=${h.ppid} pgid=${h.pgid} sid=${h.sid} lstart="${h.lstart}"\n` +
        `      cwd=${h.cwd}\n      argv=${h.argv}\n` +
        `      OWNERSHIP: ${o.verdict} — ${o.why}`,
    )
  }
  console.error(`  provenance captured to ${capturePath}`)
  console.error('  NOTHING WAS SIGNALLED. Decide ownership from the record above before reaping anything.')
  process.exit(1)
}

if (unavailable.length > 0) {
  console.error(
    `gate-port-precondition: port census UNAVAILABLE for ${unavailable.join(', ')} — ` +
      (strict
        ? 'failing closed (--strict).'
        : 'proceeding. This is NOT "ports are clear"; it is an unmeasured start, chosen over parking a task on an instrument hiccup.'),
  )
  process.exit(strict ? 1 : 0)
}
process.exit(0)
