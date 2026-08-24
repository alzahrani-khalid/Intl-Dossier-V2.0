/**
 * process-provenance.mjs — process identity capture. PURE MODULE: no top-level side effects.
 *
 * WHY THIS FILE EXISTS AS ITS OWN MODULE (RULING-P99-182). These functions previously lived in
 * `gate-port-precondition.mjs`, which is a CLI that censuses ports and calls `process.exit(1)` at
 * top level. Importing it to reuse one function RAN IT. That is not a crash worth fixing quietly —
 * **an observe-only instrument that executes on import is not observe-only.** That time the
 * accident happened to hand us a finding; the same accident in a file that REAPS would have killed
 * processes nobody asked it to touch. A good outcome from a bug validates nothing.
 *
 * Rule this encodes: anything importable must be inert on import. Entry points do work; modules
 * expose it.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * THE VERDICT RULE for a process found holding a gate port — pre-written so no reading can be
 * fitted afterwards, and CORRECTED (RULING-P99-182) by the first data it ever met.
 *
 * The original rule said "sid differs => foreign session => cross-task blame is on the table."
 * The first real capture had a differing sid AND a cwd inside the task's own worktree: P99-21's
 * own vite and backend, in session 30276, while its lease recorded session 7457. The rule as
 * written would have called its own task's servers foreign and re-admitted the cross-task blame
 * that had just been retired. **WHICH SESSION and WHOSE TASK are different questions.**
 *
 *   CWD  answers OWNERSHIP  — whose task is this? A process whose cwd is inside a task's worktree
 *                             is that task's, by construction. cwd cannot be escaped by setsid.
 *   SID  answers CONTAINMENT — can the reaper's session census see it? A differing sid means
 *                             ESCAPED, never FOREIGN.
 *
 *   own cwd + leased sid       -> contained; the reaper can see and reap it normally.
 *   own cwd + differing sid    -> ESCAPED: ours, but outside the session a reaper censuses.
 *                                 ⚠ NO CONFIRMED INSTANCE (RULING-P99-185). This branch is
 *                                 logically sound and has NEVER been observed. The one case that
 *                                 appeared to show it was two blind instruments: an unfiltered
 *                                 port census counting Playwright's own browser CLIENTS as
 *                                 holders, and this function emitting ESCAPED when given no lease
 *                                 to compare. Measured afterwards on a live gate, both real
 *                                 listeners sat INSIDE the leased session. Do not cite this
 *                                 branch as evidence that escapes happen; it describes what the
 *                                 verdict WOULD be, not a phenomenon on record.
 *   foreign cwd                -> genuinely someone else's. ONLY here is cross-task or external
 *                                 blame admissible — it requires a foreign CWD, never a foreign SID.
 *   cwd unavailable            -> UNDECIDABLE. Record it as such; never infer ownership from ppid,
 *                                 which collapses to 1 the moment the parent exits.
 *
 * LISTENERS ARE NOT CLIENTS (RULING-P99-184). `lsof -ti tcp:<port>` returns every process with a
 * socket on that port — including ESTABLISHED CLIENT connections. Playwright's own
 * chrome-headless-shell processes connect TO the dev server, so a census without
 * `-sTCP:LISTEN` reports the test runner's own browser as a port holder in a foreign session.
 * Anything asking "is someone squatting our port" must filter to LISTEN; anything asking "who is
 * touching this port" must not. Measured: on a live gate the two real listeners were the leased
 * vite and backend, and six chrome processes were counted as holders by the unfiltered census.
 *
 * CENSUS SCOPE WARNING: never key a process census on the directory NAME `worktrees.noindex` —
 * more than one repository on this machine uses that name, and such a filter silently matches
 * another fleet's processes. Anchor ownership tests on an ABSOLUTE repo path.
 */
import { execFileSync } from 'node:child_process'

const C = { encoding: 'utf8', env: { ...process.env, LC_ALL: 'C', LANG: 'C', LC_TIME: 'C' } }

/** One `ps -o <field>=` value for a pid, whitespace-normalised, or NULL. Never throws. */
export const psField = (pid, args) => {
  try {
    return execFileSync('ps', [...args, '-p', String(pid)], C).trim().replace(/\s+/g, ' ') || null
  } catch {
    return null
  }
}

/** Session id via python3's os.getsid — macOS `ps -o sess=` prints an ADDRESS (often 0), not a sid. */
export const sidOf = (pid) => {
  try {
    const n = Number(execFileSync('python3', ['-c', `import os;print(os.getsid(${pid}))`], C).trim())
    return Number.isInteger(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

/** Working directory of a pid, or NULL. This is the OWNERSHIP field — see the verdict rule above. */
export const cwdOf = (pid) => {
  try {
    return (
      execFileSync('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'], C)
        .split('\n')
        .find((l) => l.startsWith('n'))
        ?.slice(1) ?? null
    )
  } catch {
    return null
  }
}

/**
 * Ancestors, walked upward WHILE THE LINEAGE STILL EXISTS. Once a process is orphaned its ppid
 * collapses to 1 and the chain is gone for good — which is the state both P99-21 holders were in
 * before anyone read them, and why that incident is permanently undecidable. Bounded; stops at
 * init or the first unresolvable link.
 */
export const ancestors = (pid, { max = 12 } = {}) => {
  const chain = []
  let cur = pid
  for (let i = 0; i < max; i++) {
    const pp = Number(psField(cur, ['-o', 'ppid=']))
    if (!Number.isInteger(pp) || pp <= 1) {
      if (pp === 1) chain.push({ pid: 1, argv: 'init/launchd — REPARENTED: original parent already gone' })
      break
    }
    chain.push({ pid: pp, lstart: psField(pp, ['-o', 'lstart=']), argv: psField(pp, ['-o', 'command=']) })
    cur = pp
  }
  return chain
}

/** Everything needed to decide, LATER, where a process came from. Never throws. */
export const provenance = (pid) => ({
  pid,
  ppid: psField(pid, ['-o', 'ppid=']),
  pgid: psField(pid, ['-o', 'pgid=']),
  sid: sidOf(pid),
  lstart: psField(pid, ['-o', 'lstart=']),
  stat: psField(pid, ['-o', 'stat=']),
  cwd: cwdOf(pid),
  argv: psField(pid, ['-o', 'command=']),
  ancestors: ancestors(pid),
})

/**
 * OWNERSHIP verdict for one captured record, applying the rule in this file's header.
 * `root` is an ABSOLUTE repo or worktree path. `leasedSid` may be null when no lease is known.
 */
export const ownership = (rec, { root, leasedSid = null } = {}) => {
  if (!rec.cwd) return { verdict: 'UNDECIDABLE', why: 'cwd unavailable — ownership cannot be established, and ppid must not be used for it' }
  const owned = typeof root === 'string' && root.length > 1 && (rec.cwd === root || rec.cwd.startsWith(root.endsWith('/') ? root : root + '/'))
  if (!owned) return { verdict: 'FOREIGN', why: `cwd ${rec.cwd} is outside ${root} — cross-task or external blame is admissible here` }
  if (leasedSid === null)
    // CANNOT-COMPARE IS NOT A VERDICT (RULING-P99-184). This returned ESCAPED when no lease was
    // supplied, which converted "I have nothing to compare against" into a positive finding — and
    // it did exactly that on its first live run, labelling a CONTAINED dev stack as escaped.
    return { verdict: 'OWNED-CONTAINMENT-UNKNOWN', why: `own cwd (${rec.cwd}) but no leased sid was supplied — containment is UNMEASURED, not escaped` }
  if (rec.sid === leasedSid)
    return { verdict: 'CONTAINED', why: `own cwd and sid ${rec.sid} matches the lease — the reaper's session census can see this` }
  return {
    verdict: 'ESCAPED',
    why: `own cwd (${rec.cwd}) but sid ${rec.sid} != leased sid ${leasedSid} — invisible to a session census. Ours, NOT cross-task.`,
  }
}
