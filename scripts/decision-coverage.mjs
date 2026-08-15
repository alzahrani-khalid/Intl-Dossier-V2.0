#!/usr/bin/env node
// Hand-run stand-in for `gsd-sdk query check.decision-coverage-plan`, which is absent from
// the CJS bridge shipped by GSD 1.42.3 (only the real SDK implements the `check.*` family).
//
// Pinned to the real gate's documented scope:
//   - fenced code blocks and HTML comments are STRIPPED FIRST
//   - frontmatter keys scanned: must_haves, truths, objective
//   - body sections scanned: those under a heading matching /must_haves|truths|tasks|objective/i
//   - match is mechanical \bD-NN\b
// Divergence from the real gate, declared: the real gate also accepts a 6-word soft-phrase match.
// This implements the D-NN token match only, so it is STRICTER — it can report uncovered where the
// real gate would pass, never the reverse.
//
// Usage: node decision-coverage.mjs <phase_dir> <context_path>

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const [phaseDir, contextPath] = process.argv.slice(2)
if (!phaseDir || !contextPath) {
  console.error('usage: decision-coverage.mjs <phase_dir> <context_path>')
  process.exit(2)
}

const strip = (s) =>
  s
    .replace(/^```[\s\S]*?^```/gm, '') // fenced code blocks
    .replace(/<!--[\s\S]*?-->/g, '') // HTML comments

// ---- decisions from CONTEXT.md -------------------------------------------------
const ctx = strip(readFileSync(contextPath, 'utf8'))
const decisionsBlock = ctx.match(/<decisions>([\s\S]*?)<\/decisions>/)
if (!decisionsBlock) {
  console.log(JSON.stringify({ passed: true, skipped: true, reason: 'no <decisions> block' }, null, 2))
  process.exit(0)
}

// Everything from "### Claude's Discretion" onward is untracked by the gate.
const tracked = decisionsBlock[1].split(/^###\s+Claude's Discretion/m)[0]

const decisions = []
for (const line of tracked.split('\n')) {
  const m = line.match(/\*\*(D-\d{2})[:*]/)
  if (!m) continue
  if (/\[informational\]/i.test(line)) continue
  decisions.push({ id: m[1], text: line.replace(/^\s*-\s*/, '').slice(0, 110) })
}

// ---- scannable surface of each plan --------------------------------------------
const planFiles = readdirSync(phaseDir)
  .filter((f) => /-\d{2}-PLAN\.md$/.test(f) || /^PLAN\.md$/.test(f))
  .sort()

const SECTION_RE = /must_haves|truths|tasks|objective/i

function scannable(raw) {
  const src = strip(raw)
  let out = ''

  // frontmatter: must_haves / truths / objective
  const fm = src.match(/^---\n([\s\S]*?)\n---/)
  if (fm) {
    const lines = fm[1].split('\n')
    let capturing = false
    for (const line of lines) {
      const key = line.match(/^([a-z_]+):/)
      if (key) capturing = /^(must_haves|truths|objective)$/.test(key[1])
      if (capturing) out += line + '\n'
    }
  }

  // body sections under a matching heading, up to the next heading of equal-or-higher level
  const body = fm ? src.slice(fm[0].length) : src
  const lines = body.split('\n')
  let capturing = false
  let capturedLevel = 0
  for (const line of lines) {
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      const level = h[1].length
      if (SECTION_RE.test(h[2])) {
        capturing = true
        capturedLevel = level
        continue
      }
      if (capturing && level <= capturedLevel) capturing = false
    }
    // XML-ish section tags used by GSD plans, e.g. <must_haves> ... </must_haves>.
    // `tasks` is DELIBERATELY EXCLUDED here: the real gate does not scan task bodies, and
    // including it let a D-NN mentioned in a task *name* satisfy coverage — caught by the
    // R1 falsification drill, which reported D-01 covered after its only frontmatter
    // citation truth was deleted.
    const open = line.match(/^\s*<(must_haves|truths|objective)>/)
    if (open) { capturing = true; capturedLevel = 0; continue }
    if (/^\s*<\/(must_haves|truths|objective)>/.test(line)) { capturing = false; continue }
    if (/^\s*<\/?(task|tasks)[\s>]/.test(line)) { capturing = false; continue }
    if (capturing) out += line + '\n'
  }
  return out
}

const surfaces = planFiles.map((f) => ({ file: f, text: scannable(readFileSync(join(phaseDir, f), 'utf8')) }))

const uncovered = []
const coverage = {}
for (const d of decisions) {
  const re = new RegExp(`\\b${d.id}\\b`)
  const hits = surfaces.filter((s) => re.test(s.text)).map((s) => s.file)
  coverage[d.id] = hits
  if (hits.length === 0) uncovered.push(d)
}

const passed = uncovered.length === 0
console.log(
  JSON.stringify(
    {
      passed,
      skipped: false,
      plans_scanned: planFiles,
      total: decisions.length,
      covered: decisions.length - uncovered.length,
      coverage,
      uncovered,
    },
    null,
    2,
  ),
)
process.exit(passed ? 0 : 1)
