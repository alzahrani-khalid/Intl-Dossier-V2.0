#!/usr/bin/env node
/**
 * gate-drill.mjs — the mechanical half of the per-gate falsification drill.
 *
 * Extracts every <automated> gate from a phase's PLAN files, `bash -n` parses each, runs each
 * against the current tree, and reports per-gate exit codes.
 *
 * WHAT THIS ESTABLISHES: a gate parses, and it is red (or green) against the tree as it stands.
 *
 * WHAT THIS DOES **NOT** ESTABLISH — read before citing a run of this script as evidence:
 * a gate that is red because its SUBJECT IS ABSENT is indistinguishable, to this script, from a
 * gate that is red FOR THE RIGHT REASON. Phase 92 accumulated eight instances of "a gate that
 * cannot pass even when the work is done", and a round that executed all 21 gates still missed
 * one, because finding that class requires CONSTRUCTING the work-done state and observing green.
 * That half is authored per gate and cannot be mechanized. See .planning/GATE-STANDARD.md, clause C1.
 *
 * Usage:
 *   node scripts/gate-drill.mjs <phase_dir> [--json] [--timeout <seconds>]
 *
 * Exit: 0 if every gate PARSED (regardless of run result); 1 if any gate fails `bash -n`, or on
 * usage/IO error. Run results are DATA, not pass/fail — on a pre-execution tree every gate SHOULD
 * be red, so a non-zero run exit is the expected case and is not an error here.
 */

import { readdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const asJson = args.includes('--json')
const tIdx = args.indexOf('--timeout')
const timeoutSec = tIdx !== -1 && args[tIdx + 1] ? Number(args[tIdx + 1]) : 600
// `tIdx + 1` is 0 when --timeout is ABSENT, so the old form compared against args[0] — the phase
// dir itself — and filtered it out. The documented `gate-drill.mjs <dir>` invocation therefore
// always printed usage; only the accidental `<dir> --json --timeout N` form worked. (Found 2026-08-15
// during Phase 93 plan grading.)
const timeoutValueArg = tIdx !== -1 ? args[tIdx + 1] : undefined
const phaseDir = args.find((a) => !a.startsWith('--') && a !== timeoutValueArg)

if (!phaseDir) {
  console.error('usage: gate-drill.mjs <phase_dir> [--json] [--timeout <seconds>]')
  process.exit(1)
}

let planFiles
try {
  planFiles = readdirSync(phaseDir)
    .filter((f) => /-PLAN\.md$/.test(f))
    .sort()
} catch (err) {
  console.error(`cannot read phase dir ${phaseDir}: ${err.message}`)
  process.exit(1)
}

if (planFiles.length === 0) {
  console.error(`no *-PLAN.md files in ${phaseDir}`)
  process.exit(1)
}

// Extract gates. Deliberately literal: <automated>…</automated>, in file order.
const gates = []
for (const file of planFiles) {
  const text = readFileSync(join(phaseDir, file), 'utf8')
  const re = /<automated>([\s\S]*?)<\/automated>/g
  let m
  let n = 0
  while ((m = re.exec(text)) !== null) {
    n += 1
    // Line number of the gate, for a clickable reference.
    const line = text.slice(0, m.index).split('\n').length
    gates.push({ id: `${file.replace('-PLAN.md', '')}_g${n}`, file, line, body: m[1].trim() })
  }
}

const scratch = mkdtempSync(join(tmpdir(), 'gate-drill-'))
const results = []

try {
  for (const g of gates) {
    const path = join(scratch, `${g.id}.sh`)
    writeFileSync(path, g.body)

    const parse = spawnSync('bash', ['-n', path], { encoding: 'utf8' })
    const parsed = parse.status === 0

    let run = null
    if (parsed) {
      const r = spawnSync('bash', [path], {
        encoding: 'utf8',
        timeout: timeoutSec * 1000,
        cwd: process.cwd(),
        maxBuffer: 16 * 1024 * 1024,
      })
      run = {
        exit: r.status,
        timedOut: r.error?.code === 'ETIMEDOUT',
        // Tail only: gate output can be a full test run.
        stderrTail: (r.stderr || '').trim().split('\n').slice(-3).join('\n'),
      }
    }

    results.push({
      id: g.id,
      file: g.file,
      line: g.line,
      parse: parsed ? 'PARSE-OK' : 'PARSE-FAIL',
      parseError: parsed ? undefined : (parse.stderr || '').trim().slice(0, 200),
      run,
    })
  }
} finally {
  rmSync(scratch, { recursive: true, force: true })
}

const parseFails = results.filter((r) => r.parse === 'PARSE-FAIL')
const greens = results.filter((r) => r.run && r.run.exit === 0)

if (asJson) {
  console.log(JSON.stringify({ phaseDir, gateCount: results.length, results }, null, 2))
} else {
  for (const r of results) {
    const loc = `${r.file}:${r.line}`
    if (r.parse === 'PARSE-FAIL') {
      console.log(`${r.id.padEnd(12)} ${r.parse}  ${loc}  ${r.parseError}`)
    } else {
      const verdict = r.run.timedOut ? `TIMEOUT(${timeoutSec}s)` : `exit=${r.run.exit}`
      console.log(`${r.id.padEnd(12)} ${r.parse}  ${verdict.padEnd(16)} ${loc}`)
    }
  }
  console.log(
    `\n${results.length} gates · ${results.length - parseFails.length} parsed · ${parseFails.length} parse-fail · ${greens.length} exited 0`,
  )
  if (greens.length > 0) {
    console.log(
      `\nNOTE: ${greens.length} gate(s) exited 0. On a pre-execution tree that is a VACUOUS-ORACLE\n` +
        `candidate — a gate passing before the work exists. Investigate each before proceeding.`,
    )
  }
  console.log(
    `\nThis run establishes parse validity and today's exit codes ONLY. It does NOT establish that\n` +
      `any gate can PASS when the work is done — that requires constructing the work-done state per\n` +
      `gate (.planning/GATE-STANDARD.md clause C1). Do not cite this output as gate soundness.`,
  )
}

process.exit(parseFails.length > 0 ? 1 : 0)
