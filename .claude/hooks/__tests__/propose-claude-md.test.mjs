// .claude/hooks/__tests__/propose-claude-md.test.mjs
import { strict as assert } from 'node:assert'
import { claudeMdAreas, diffFingerprint } from '../propose-claude-md.mjs'
import { spawnSync } from 'node:child_process'

const root = process.cwd()

// Test 1: claudeMdAreas discovers governed areas
const areas = claudeMdAreas(root)
assert(areas.size > 0, 'should find at least one CLAUDE.md area after Phase A')
console.log(`✓ claudeMdAreas: found ${areas.size} area(s): ${[...areas].slice(0, 5).join(', ')}`)

// Test 2: diffFingerprint is stable
const fp1 = diffFingerprint(root, new Set(['backend']))
const fp2 = diffFingerprint(root, new Set(['backend']))
assert.equal(fp1, fp2, 'fingerprint must be stable')
assert.equal(fp1.length, 64, 'SHA-256 hex is 64 chars')
console.log(`✓ diffFingerprint: stable, 64-char SHA-256`)

// Test 3: hook exits 0
const result = spawnSync(process.execPath, ['.claude/hooks/propose-claude-md.mjs'], {
  cwd: root,
  encoding: 'utf-8',
  input: '',
})
assert.equal(result.status, 0, `hook should exit 0, got ${result.status}; stderr: ${result.stderr}`)
console.log(`✓ propose-claude-md hook exits 0`)

// Test 4: recursion guard
const guarded = spawnSync(process.execPath, ['.claude/hooks/propose-claude-md.mjs'], {
  cwd: root,
  encoding: 'utf-8',
  input: '',
  env: { ...process.env, INTL_DOSSIER_REFLECT_LOCK: '1' },
})
assert.equal(guarded.status, 0, 'guarded run must exit 0')
assert.equal(guarded.stderr, '', 'guarded run must produce no output')
console.log(`✓ recursion guard no-ops when INTL_DOSSIER_REFLECT_LOCK=1`)

console.log('propose-claude-md.test.mjs: OK')
