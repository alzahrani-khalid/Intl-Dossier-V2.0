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
 *   own cwd + differing sid    -> ESCAPED. A session-containment defect in the dev stack.
 *                                 Same run, same task, reproducible. NOT cross-task.
 *   foreign cwd                -> genuinely someone else's. ONLY here is cross-task or external
 *                                 blame admissible — it requires a foreign CWD, never a foreign SID.
 *   cwd unavailable            -> UNDECIDABLE. Record it as such; never infer ownership from ppid,
 *                                 which collapses to 1 the moment the parent exits.
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
  if (leasedSid !== null && rec.sid === leasedSid)
    return { verdict: 'CONTAINED', why: `own cwd and sid ${rec.sid} matches the lease — the reaper's session census can see this` }
  return {
    verdict: 'ESCAPED',
    why:
      `own cwd (${rec.cwd}) but sid ${rec.sid}` +
      (leasedSid === null ? ' with no lease to compare' : ` != leased sid ${leasedSid}`) +
      ' — SESSION-containment defect: ours, and invisible to a session census. NOT cross-task.',
  }
}
