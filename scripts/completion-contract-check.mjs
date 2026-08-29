#!/usr/bin/env node
/**
 * Completion-contract check — PRODUCT ENTRY 36, local guard (RULING-P99-478 §5.3).
 *
 * A task can pass all seven gates and still be INVISIBLE to the next compile, because completion
 * derives from HEAD-reachable SUMMARY front-matter (`status: complete`) and nothing validates that
 * the worker actually wrote it. Measured on P99-32 (R428) and again on P99-61 (R478), where it
 * became load-bearing on a landing decision: landing would have recovered two of three tasks.
 *
 * This is the LOCAL guard. The engine fix is still owed and is queued separately — a task the engine
 * calls done should not be able to leave a SUMMARY that the next compile reads as pending.
 *
 *   usage: completion-contract-check.mjs <journal.jsonl> <git-ref> [phaseDir]
 *          completion-contract-check.mjs --self-check
 *
 * Exit 0 every done task carries the marker · 1 at least one does not · 3 cannot run.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---/
const hasCompleteStatus = (text) => {
  const m = FRONT_MATTER.exec(text)
  if (m === null) return false // no front matter at all — the P99-61 shape
  return /^status:\s*complete\s*$/m.test(m[1])
}

if (process.argv[2] === '--self-check') {
  const cases = [
    ['front matter with status: complete', '---\nphase: 99\nstatus: complete\n---\n# S', true],
    ['front matter, different status', '---\nstatus: partial\n---\n# S', false],
    ['front matter, no status key', '---\nphase: 99\n---\n# S', false],
    ['NO front matter (the P99-61 shape)', '# Phase 99 Plan 61 Summary\n\nstuff\n', false],
    ['status: complete only in the BODY, not front matter', '# S\n\nstatus: complete\n', false],
  ]
  let bad = 0
  for (const [name, src, want] of cases) {
    const got = hasCompleteStatus(src)
    if (got !== want) bad++
    console.log(`  ${got === want ? 'PASS' : 'FAIL'}  ${name}: got ${got}, want ${want}`)
  }
  console.log(bad === 0 ? 'SELF-CHECK PASS' : `SELF-CHECK FAIL (${bad})`)
  process.exit(bad === 0 ? 0 : 1)
}

// --summaries <phaseDir>: worktree-safe form. An acceptance oracle runs INSIDE a task worktree,
// where .tickmarkr/runs/ does not exist, so the journal form above cannot be an engine-run gate.
// This form needs only the tracked phase directory: every SUMMARY that EXISTS must carry the marker.
// It asserts presence-implies-marker, never existence, so a phase mid-flight is not failed for the
// summaries it has not written yet.
if (process.argv[2] === '--summaries') {
  const dir = process.argv[3]
  if (!dir) { console.error('INSTRUMENT-CANNOT-RUN: --summaries needs a phase directory'); process.exit(3) }
  let names
  try { names = readdirSync(dir).filter((f) => /-SUMMARY\.md$/.test(f)).sort() } catch (e) {
    console.error(`INSTRUMENT-CANNOT-RUN: cannot read ${dir}: ${e.message}`); process.exit(3)
  }
  if (names.length === 0) { console.error(`INSTRUMENT-CANNOT-RUN: no SUMMARY files under ${dir}; an empty population proves nothing`); process.exit(3) }
  let bad = 0
  for (const n of names) {
    const ok = hasCompleteStatus(readFileSync(`${dir}/${n}`, 'utf8'))
    if (!ok) { console.log(`  ${n}  BREACH — no 'status: complete' front-matter; the next compile reads this task PENDING`); bad++ }
  }
  console.log(`completion-contract: ${names.length - bad}/${names.length} SUMMARY files carry the marker`)
  process.exit(bad === 0 ? 0 : 1)
}

const [journal, ref, phaseDir = '.planning/phases/99-arabic-coverage'] = process.argv.slice(2)
if (!journal || !ref) { console.error('INSTRUMENT-CANNOT-RUN: usage: <journal.jsonl> <git-ref> [phaseDir]'); process.exit(3) }
if (!existsSync(journal)) { console.error(`INSTRUMENT-CANNOT-RUN: no journal at ${journal}`); process.exit(3) }

const done = []
for (const line of readFileSync(journal, 'utf8').split('\n')) {
  if (!line.includes('"event":"task-done"')) continue
  try { const e = JSON.parse(line); if (e.taskId && !done.includes(e.taskId)) done.push(e.taskId) } catch {}
}
// A run with zero done tasks makes every assertion below vacuously true.
if (done.length === 0) { console.error('INSTRUMENT-CANNOT-RUN: journal records no task-done; an empty population proves nothing'); process.exit(3) }

let bad = 0
for (const taskId of done) {
  const n = taskId.replace(/^P99-/, '')
  const path = `${phaseDir}/99-${n}-SUMMARY.md`
  let text
  try { text = execFileSync('git', ['show', `${ref}:${path}`], { encoding: 'utf8' }) } catch {
    console.log(`  ${taskId}  MISSING SUMMARY at ${ref}`)
    bad++
    continue
  }
  const ok = hasCompleteStatus(text)
  if (!ok) bad++
  console.log(`  ${taskId}  ${ok ? 'ok' : 'BREACH — 7/7 green but the next compile reads it PENDING'}  (${path})`)
}
console.log(`completion-contract: ${done.length - bad}/${done.length} done tasks carry the marker`)
process.exit(bad === 0 ? 0 : 1)
