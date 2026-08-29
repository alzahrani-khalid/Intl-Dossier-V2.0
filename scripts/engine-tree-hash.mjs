#!/usr/bin/env node
/**
 * Deterministic, path-independent digest of an engine dist tree — RULING-P99-480.
 *
 * WHY THIS IS A SCRIPT AND NOT A DESCRIPTION. A shell pipeline described in prose was reproduced by
 * a second seat and yielded a third number: `shasum -a 256` embeds the file PATH in its output, and
 * a prose description leaves the file set, the sort, the separator and the trailing newline
 * unstated. Two careful implementers got two answers. **A method a second implementer cannot
 * reproduce is DESCRIBED, not PINNED** — so the method is this file, and its output is quoted with
 * this file's own sha256 beside it.
 *
 * ALGORITHM, fully specified:
 *   1. Walk <distRoot> recursively. Do NOT follow symlinked directories (the root itself may be
 *      reached through a symlink; that is a path fact and must not change the answer).
 *   2. Select regular files whose name ends `.js`. No other filter.
 *   3. sha256 each file's raw BYTES. Content only — the path never enters a digest.
 *   4. Sort the 64-char lowercase hex digests lexicographically (byte order, not locale).
 *   5. Join with a single "\n", NO trailing newline.
 *   6. sha256 that UTF-8 string. That is the tree hash.
 *
 *   usage: engine-tree-hash.mjs <distRoot> [--json]
 *          engine-tree-hash.mjs --self-check
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, lstatSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

const collect = (dir, out = []) => {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name)
    const st = lstatSync(full)
    if (st.isSymbolicLink()) continue // step 1: never follow links found inside the tree
    if (st.isDirectory()) collect(full, out)
    else if (st.isFile() && name.endsWith('.js')) out.push(full)
  }
  return out
}

const treeHash = (root) => {
  const files = collect(root)
  const digests = files.map((f) => sha256(readFileSync(f))).sort()
  return { hash: sha256(digests.join('\n')), count: digests.length, first: digests[0], last: digests[digests.length - 1] }
}

if (process.argv[2] === '--self-check') {
  // The property that matters: identical CONTENT at two different PATHS must give one hash.
  const a = mkdtempSync(join(tmpdir(), 'eth-a-')), b = mkdtempSync(join(tmpdir(), 'eth-b-'))
  for (const root of [a, b]) {
    mkdirSync(join(root, 'sub'), { recursive: true })
    writeFileSync(join(root, 'one.js'), 'console.log(1)\n')
    writeFileSync(join(root, 'sub', 'two.js'), 'console.log(2)\n')
    writeFileSync(join(root, 'skip.txt'), 'not javascript\n')
  }
  const ha = treeHash(a), hb = treeHash(b)
  writeFileSync(join(b, 'sub', 'three.js'), 'console.log(3)\n')
  const hc = treeHash(b)
  const checks = [
    ['path-independent: same content, different roots', ha.hash === hb.hash, true],
    ['counts .js only, ignores .txt', ha.count === 2, true],
    ['sensitive: adding a file changes the hash', hc.hash !== hb.hash, true],
  ]
  let bad = 0
  for (const [name, got, want] of checks) { if (got !== want) bad++; console.log(`  ${got === want ? 'PASS' : 'FAIL'}  ${name}`) }
  rmSync(a, { recursive: true, force: true }); rmSync(b, { recursive: true, force: true })
  console.log(bad === 0 ? 'SELF-CHECK PASS' : `SELF-CHECK FAIL (${bad})`)
  process.exit(bad === 0 ? 0 : 1)
}

const root = process.argv[2]
if (!root) { console.error('INSTRUMENT-CANNOT-RUN: usage: engine-tree-hash.mjs <distRoot> [--json]'); process.exit(3) }
try { if (!statSync(root).isDirectory()) throw new Error('not a directory') } catch (e) {
  console.error(`INSTRUMENT-CANNOT-RUN: ${root}: ${e.message}`); process.exit(3)
}
const r = treeHash(root)
if (r.count === 0) { console.error(`INSTRUMENT-CANNOT-RUN: no .js files under ${root}; an empty tree hashes to a constant`); process.exit(3) }
const self = sha256(readFileSync(new URL(import.meta.url)))
if (process.argv.includes('--json')) console.log(JSON.stringify({ root, ...r, method_sha256: self }))
else {
  console.log(`tree_sha256   ${r.hash}`)
  console.log(`js_files      ${r.count}`)
  console.log(`method_sha256 ${self}   (engine-tree-hash.mjs — quote this beside the tree hash)`)
}
