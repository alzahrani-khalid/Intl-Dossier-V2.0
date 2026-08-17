#!/usr/bin/env node
/**
 * verify-tokens.mjs — a SELF-DIAGNOSING integrity check for filings.
 *
 * WHY THIS EXISTS. Verifying a filing by counting identifiers inside it is the right check —
 * a presence count (`body=1 table=1`) verifies PRESENCE, never INTEGRITY, and reported success
 * over an entry whose every identifier had been emptied by shell command-substitution.
 *
 * But a literal matcher returns 0 for two very different reasons:
 *   - the content is CORRUPT or ABSENT  ← the thing the check exists to catch
 *   - the token was TRANSFORMED between writing and storage  ← a false alarm
 * and a bare zero cannot tell them apart. In Phase 97 that produced THREE consecutive false
 * alarms (line wrap, then heading case, then a wrapped phrase) with no real defect among them.
 *
 * **A check whose false alarms outnumber its catches gets ignored — and the first time
 * "probably the grep again" is wrong is the corruption the check existed to catch.**
 *
 * So on a zero this does not report a failure. It re-runs the match under each KNOWN
 * transformation and reports WHICH variant matched. A false alarm resolves itself in the same
 * command; a TRUE alarm is the case where EVERY variant still returns zero, which is a far
 * stronger signal than a bare zero ever was.
 *
 * Usage:
 *   node scripts/verify-tokens.mjs <file> <token> [<token> ...]
 *
 * Exit: 0 if every token matched under some variant; 1 if any token matched under NONE.
 */

import { readFileSync } from 'node:fs'

const [file, ...tokens] = process.argv.slice(2)
if (!file || tokens.length === 0) {
  console.error('usage: verify-tokens.mjs <file> <token> [<token> ...]')
  process.exit(2)
}

let raw
try {
  raw = readFileSync(file, 'utf8')
} catch (e) {
  console.error(`UNABLE TO MEASURE — cannot read ${file}: ${e.message}`)
  process.exit(2)
}

// The known write-to-store transformations, in the order a reader should consider them.
const variants = [
  { name: 'literal', f: (s) => s },
  { name: 'case-insensitive', f: (s) => s.toLowerCase() },
  { name: 'whitespace-joined', f: (s) => s.replace(/\s+/g, ' ') },
  { name: 'joined+case', f: (s) => s.replace(/\s+/g, ' ').toLowerCase() },
  // formatters normalise quotes and dashes; a token carrying them is not literal-stable
  { name: 'punctuation-normalised', f: (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/\s+/g, ' ').toLowerCase() },
  // ADDED after this very script reported a REAL absence that was not one: a phrase wrapped
  // inside a markdown BLOCKQUOTE gains a `>` continuation marker mid-phrase, so whitespace-joining
  // yields "... with > evidence" and the match fails. Same for list bullets and emphasis markers.
  // This is the "next transformation nobody enumerated" — the reason the tool exists rather than
  // a better token-choice rule. Strip markdown line-furniture, then join and lower.
  {
    name: 'markdown-stripped',
    f: (s) =>
      s
        .split('\n')
        .map((l) => l.replace(/^\s*(?:>+\s?|[-*+]\s+|\d+\.\s+)/, ''))
        .join(' ')
        .replace(/[*_`]/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase(),
  },
]

let failed = 0
for (const token of tokens) {
  let matchedUnder = null
  for (const v of variants) {
    if (v.f(raw).includes(v.f(token))) {
      matchedUnder = v.name
      break
    }
  }
  if (matchedUnder === null) {
    failed++
    console.log(`MISSING   ${token}   ← every variant returned 0: this is a REAL absence`)
  } else if (matchedUnder === 'literal') {
    console.log(`ok        ${token}`)
  } else {
    console.log(`ok(${matchedUnder})  ${token}   ← present; the literal match failed only because of this transformation`)
  }
}

console.log(
  failed === 0
    ? `\nALL ${tokens.length} TOKEN(S) PRESENT in ${file}`
    : `\n${failed} of ${tokens.length} token(s) MISSING under every known transformation — investigate ${file}`,
)
process.exit(failed === 0 ? 0 : 1)
