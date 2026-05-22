// .claude/hooks/__tests__/session-start-context.test.mjs
import { strict as assert } from 'node:assert'
import { buildOrientation } from '../session-start-context.mjs'

const out = buildOrientation()
assert(out.includes('Intl-Dossier — session orientation'), 'missing header')
assert(out.includes('CODEBASE_MAP.md'), 'missing CODEBASE_MAP pointer')
assert(
  out.includes('Active area(s)') || out.includes('Working tree is clean'),
  'missing active-area or clean-tree line',
)
console.log('session-start-context.test.mjs: OK')
