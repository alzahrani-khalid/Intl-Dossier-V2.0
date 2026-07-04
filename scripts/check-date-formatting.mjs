/* global console, process */
// Ad-hoc date/number-formatting regression guard (FMT-03 / D-82-03, D-82-05).
//
// Phase 82 made date/time rendering flow through ONE formatter
// (frontend/src/lib/format-date.ts → day-first no-comma `Tue 28 Apr`, `14:30 GST`,
// Latin digits in BOTH en and ar) and retired the Arabic-Indic display path. This
// guard KEEPS the tree clean by failing CI the moment ad-hoc formatting reappears:
//
//   Check 1 — raw `.toLocaleDateString(`  → must route through lib/format-date.ts.
//   Check 2 — month-first date-fns literal (`format(x, 'MMM d …')`) → must be
//             day-first (`'d MMM'` / `'dd MMM yyyy'`).
//   Check 3 — bare Indic-producing locale literal `'ar-SA'` / `'ar-SA-u-nu-arab'`
//             → must use lib/format-locale.ts `toFormatLocale()` (Latin-safe).
//   Check 4 — raw `.toLocaleTimeString(` NOT routed through `toFormatLocale()`.
//
// WHY A SCRIPT, NOT AN ESLINT RULE (RESEARCH §5, [VERIFIED: eslint.config.mjs read]):
// the flat config sets `no-restricted-syntax: 'off'` for frontend/**/components/ui/**
// and a 16-file Tier-B chart/graph carve-out. Flat-config rules REPLACE per-file
// (they don't merge), so a date selector on the main array would silently never fire
// in ~18 files that hold REAL offenders. A standalone script scans every file with
// its own allowlist. Reworking those overrides is Phase-83 config surgery.
//
// ALLOWLIST (exact relative paths — the ONLY two sanctioned call sites):
//   frontend/src/lib/format-date.ts        — THE single date/time formatter.
//   frontend/src/components/ui/calendar.tsx — react-day-picker `data-day` attribute
//                                             (non-user-visible, §1 Group D).
// No seeded offender allowlist: the guard ships green on the migrated tree.
//
// Dependency-free — only node: builtins (T-82-02: no network, no eval, read-only).
//
// Usage:
//   node scripts/check-date-formatting.mjs           (scans frontend/src)
//   node scripts/check-date-formatting.mjs <dir>      (scans <dir> — proves a positive
//                                                       failure against the fixture)
//
// Exits 0 when clean; exits 1 (naming each offender file:line — code) otherwise.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(scriptPath), '..')

const DEFAULT_SRC_ROOT = path.join(repoRoot, 'frontend', 'src')

// Retarget the scanned tree via a CLI arg (used for the positive-failure fixture).
const cliArg = process.argv[2]
const srcRoot = cliArg ? path.resolve(repoRoot, cliArg) : DEFAULT_SRC_ROOT

// Exact absolute paths exempt from the toLocale*/'ar-SA' checks.
const ALLOWLIST = new Set([
  path.join(repoRoot, 'frontend', 'src', 'lib', 'format-date.ts'),
  path.join(repoRoot, 'frontend', 'src', 'components', 'ui', 'calendar.tsx'),
])

/** Recursively collect every non-test *.ts / *.tsx file under root (absolute paths). */
function walkSourceFiles(root, dir = root) {
  if (!fs.existsSync(root)) {
    return []
  }
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === 'build' ||
        entry.name === '__tests__'
      ) {
        return []
      }
      return walkSourceFiles(root, absolute)
    }
    if (!entry.isFile()) {
      return []
    }
    // Mirror the FMT-02 grep-gate scope: skip test files.
    if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) {
      return []
    }
    if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      return [absolute]
    }
    return []
  })
}

// Check 1 — any `.toLocaleDateString(` call.
const DATE_STRING = /\.toLocaleDateString\s*\(/
// Check 4 — any `.toLocaleTimeString(` call, plus a tail probe for the sanctioned arg.
const TIME_STRING = /\.toLocaleTimeString\s*\(\s*(toFormatLocale\b)?/
// Check 3 — bare Indic-producing locale literals.
const INDIC_LOCALE = /(['"`])(ar-SA(?:-u-nu-arab)?)\1/
// Check 2 — capture a date-fns format() call's format-string literal (RESEARCH §5, verbatim).
const FMT_CALL = /\bformat\s*\([^,()]*(?:\([^()]*\))?[^,()]*,\s*(['"`])([^'"`]+)\1/g

/** RESEARCH §5 verbatim: a textual month token (MMM+) precedes a standalone day token. */
const monthFirst = (fmt) => {
  const m = fmt.search(/M{3,}/) // MMM / MMMM (textual month)
  const d = fmt.search(/(?<![A-Za-z])d{1,2}(?![A-Za-z])/) // standalone d / dd
  return m !== -1 && d !== -1 && m < d
}

function main() {
  const files = walkSourceFiles(srcRoot)
  const failures = []

  for (const file of files) {
    const allowed = ALLOWLIST.has(file)
    const relFile = path.relative(repoRoot, file)
    const lines = fs.readFileSync(file, 'utf8').split('\n')

    lines.forEach((rawLine, i) => {
      const lineNo = i + 1
      const code = rawLine.trim()

      if (!allowed && DATE_STRING.test(rawLine)) {
        failures.push({ file: relFile, line: lineNo, code, why: 'raw toLocaleDateString' })
      }

      if (!allowed) {
        const timeMatch = TIME_STRING.exec(rawLine)
        // Flag a toLocaleTimeString call ONLY when its locale arg is not toFormatLocale().
        if (timeMatch && timeMatch[1] === undefined) {
          failures.push({
            file: relFile,
            line: lineNo,
            code,
            why: 'raw toLocaleTimeString (use toFormatLocale())',
          })
        }
      }

      if (!allowed && INDIC_LOCALE.test(rawLine)) {
        const indic = rawLine.match(INDIC_LOCALE)[2]
        failures.push({
          file: relFile,
          line: lineNo,
          code,
          why: `Indic-producing locale literal '${indic}' (use toFormatLocale())`,
        })
      }

      FMT_CALL.lastIndex = 0
      let m
      while ((m = FMT_CALL.exec(rawLine)) !== null) {
        if (monthFirst(m[2])) {
          failures.push({
            file: relFile,
            line: lineNo,
            code,
            why: `month-first date-fns literal '${m[2]}' (use day-first, e.g. 'd MMM')`,
          })
        }
      }
    })
  }

  if (failures.length > 0) {
    console.error(
      `date-formatting check FAILED: ${failures.length} ad-hoc date/number formatting site(s) found (D-82-03 / D-82-05):`,
    )
    for (const f of failures) {
      console.error(`  ${f.file}:${f.line} — ${f.why}\n      ${f.code}`)
    }
    console.error('')
    console.error(
      'Fix: route dates/times through frontend/src/lib/format-date.ts (formatDayFirst/formatTime) ' +
        'and number/locale formatting through frontend/src/lib/format-locale.ts toFormatLocale() ' +
        "(Latin-safe). Never a bare 'ar-SA' / raw toLocaleDateString outside the formatter.",
    )
    process.exit(1)
  }

  console.log(
    `date-formatting check OK: ${files.length} non-test file(s) scanned, 0 ad-hoc date/number formatting sites ` +
      '(raw toLocaleDateString/toLocaleTimeString, month-first date-fns literals, Indic locale literals) ' +
      'outside the 2-file allowlist (lib/format-date.ts, components/ui/calendar.tsx).',
  )
  process.exit(0)
}

main()
