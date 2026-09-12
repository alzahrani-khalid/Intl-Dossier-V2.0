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
// PHASE 98 EXTENSION (COPY-05, criterion 5 — D-25/D-26). Checks 1–4 above cannot
// see four more classes that render a competing date shape on screen:
//
//   Check 5 — date-fns `formatDistanceToNow` / `formatDistance(` ANYWHERE except
//             frontend/src/lib/format-date.ts. D-25 sanctions relative time on
//             feed/timeline recency surfaces ONLY and only through that module's
//             `formatRelativeTime`; a direct call elsewhere renders an unlocalized
//             English phrase (`9 months ago`) under `ar`.
//   Check 6 — a date-fns LOCALIZED SKELETON literal (`'PP'`, `'PPp'`, `'PPP'`,
//             `'PPpp'`, `'PPP p'` — P/p tokens only). These render month-first
//             (`Jan 10, 2024`) with no literal `MMM` token, so check 2 is blind to
//             them by construction.
//   Check 7 — a 12-hour clock token (`h:mm a`) in a format literal → `14:30 GST`.
//   Check 8 — `.toLocaleString(` on a DATE-ISH receiver (heuristic name match).
//
// PHASE 98 WAVE 4 EXTENSION (RULING-P98A2-06 §3, RULING-P98A2-17 §3,
// RULING-P98A2-19). Check 5 keys on a date-fns IMPORT TOKEN — the same
// population-by-implementation defect the phase filed six times. Five components
// hand-rolled their own `formatRelativeTime`, a sixth module exported a parallel
// `formatRelativeTimeShort`, and four more used `Intl.RelativeTimeFormat`; check 5
// was structurally blind to every one of them. Check 9 keys on what it CATCHES —
// relative-time PRODUCTION, however implemented:
//
//   Check 9a — `Intl.RelativeTimeFormat` outside the formatter module. The native
//              relative formatter is a second formatter by definition.
//   Check 9b — a local FUNCTION DECLARATION whose name claims relative time
//              (`formatRelativeTime`, `formatRelativeDate`, `getRelativeTime`, …).
//              Declaration shapes only: `const relativeTime = formatRelativeTime(x)`
//              is a CONSUMER of the sanctioned helper, not a competing producer.
//   Check 9c — the SHORT-FORMAT shape: an interpolated count glued to a bare
//              time-unit suffix (`${diffD}d`, `${diffMin}د`). This is the second
//              witnessed escape shape and it carries no import at all.
//
// RULING-P98A2-19 states the invariant these three serve: **no hand-rolled
// relative-string ASSEMBLY.** Two compliant forms exist — (1) the shared localized
// helper, (2) a verb-bearing interpolated i18n key PAIR, localized in both locales,
// with no defaultValue mask and only the COUNT computed locally. Form (2) is
// therefore NOT an offence and check 9 must not fire on it: it does not, because a
// `t('card.expiresIn', { days })` call assembles nothing in code.
//
// The 9-family SKIPS COMMENT LINES. Checks 1-8 do not, and that difference is
// deliberate: this phase's repairs document the very tokens 9a keys on, and a guard
// that reds on its own rationale teaches people to delete the rationale.
//
// POPULATION, and what falls OUTSIDE it (D-05 — a correct command about the wrong
// set is still wrong). IN: every non-test `.ts`/`.tsx` under `frontend/src`, i.e.
// exactly what `walkSourceFiles` returns. OUT, deliberately:
//   · `*.test.ts(x)` and `__tests__/` — the walker skips them (FMT-02 scope).
//   · `yyyy-MM-dd` / `HH:mm` plumbing literals — machine input values (form state,
//     query params, `<input type="date">`), never user-facing prose. Not a check.
//   · `MMMM yyyy` calendar-grid month headers — navigation chrome, explicitly OUT
//     of criterion 5's population (D-25); their Arabic rides AR-02 / Phase 99.
//   · `.toLocaleString()` on COUNTS (`total.toLocaleString()`) — number formatting,
//     not a date shape. Check 8's receiver heuristic is what excludes them, so it
//     is a heuristic in both directions: a false positive is allowlisted with its
//     reason rather than silently narrowing the regex.
//   · Non-`frontend/src` trees (backend, tests/, supabase/) — never scanned.
//
// BURN-DOWN DEBT. Checks 5–8 find pre-existing sites that plan 98-07 migrates.
// They are enumerated one row per (file, check) in the list below so lint stays
// green in the intervening waves. A row is a NAMED DEBT, NOT A PASS: 98-07's gate
// requires the list EMPTY. The list is self-cleaning — a row whose file no longer
// carries its pattern fails the run, so it cannot outlive the site it excuses.
// It applies ONLY to the default `frontend/src` scan; a fixture-dir run ignores it
// so the positive-failure drill reports the checks, never stale rows.
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
// NEGATIVE SCOPE (RULING-P98A2-13 Law 1) — what this oracle CANNOT see, and what
// covers each blind spot. Four instruments in this phase were blind to their own
// class by construction; this one states its blindness up front.
//
//   1. ANY TREE OUTSIDE `frontend/src`. `walkSourceFiles` starts at
//      `frontend/src` and nothing re-points it. `supabase/functions/`, `backend/`,
//      `tests/`, `e2e/` are never read. TWO EDGE FUNCTIONS produce bilingual
//      now-relative user copy today —
//      `contextual-suggestions/index.ts:605-606,616-617` and
//      `relationship-health/index.ts:226-227`. COVERED BY: nothing automated.
//      Filed as `EDGECOPY-01` (owner Phase 102, RULING-P98A2-16/-17).
//   2. i18n JSON. The walker admits only `.ts`/`.tsx`, so a relative phrase
//      AUTHORED in `frontend/src/i18n/**/*.json` and rendered through `t()` is
//      invisible here BY CONSTRUCTION. That is RULING-P98A2-19's compliant form
//      (2) when the pair is verb-bearing and unmasked — but a MASKED or MISSING
//      key is a real defect this guard cannot see. COVERED BY: the criterion-2
//      resolution instruments (`.tickmarkr/overseer/INSTRUMENTS-P98/`), and only
//      on the surfaces they drive.
//   3. HARDCODED relative phrases in code (`${diffDays} days ago`, `منذ …`,
//      `'Yesterday'`). Three were repaired in wave 4
//      (`KeyContactsSection`, `ActivityTimelineSection`, `useOptimisticLocking`).
//      9c catches only the SHORT-SUFFIX shape; a full-word phrase escapes it, and
//      a broad literal check cannot separate a relative render from a date-RANGE
//      FILTER LABEL (`AuditLogFilters`, `ActivityFeedFilters`, `DateRangeFilter`
//      all legitimately carry `'Yesterday'`/`'أمس'`). COVERED BY: NOTHING. Said
//      plainly. Known live residue of this exact shape:
//      `components/notifications/NotificationList.tsx:125-126` (bilingual
//      today/yesterday group headers) and
//      `components/empty-states/NotificationPreviewTimeline.tsx:306`
//      (`{notification.timeAgo} {t('preview.ago')}` — assembly across a boundary).
//   4. RUNTIME RESOLUTION. This is a source-text scanner. A syntactically perfect
//      `t('deadline.today')` proves nothing about whether the bound namespace
//      resolves it — the mask class RULING-P98A2-12 c3 bounded. COVERED BY:
//      `INSTRUMENTS-P98/resolve-check.mjs` + its `neg-taskcard.mjs` control.
//   5. REACHABILITY. Dead code is scanned exactly like live code, so a green here
//      can be a green over a component nobody renders — which is precisely why
//      `EnhancedActivityFeed.tsx` needed the exemption below rather than a repair.
//      COVERED BY: the importer census and the rendered `98-copy05` oracle.
//   6. date-fns relative APIs check 5 does not name — `formatDistanceToNowStrict`,
//      `formatDistanceStrict`, `intlFormatDistance`, `formatRelative`. Zero live
//      today (control: the same instrument returns 46 hits for `formatDistanceToNow`
//      in the same tree at derivation time), so the gap is LATENT, not live. 9b
//      narrows it — such a call almost always sits in a relative-named local — but
//      does not close it.
//
// BOTH POLARITIES, runnable on demand:
//   RED   node scripts/check-date-formatting.mjs scripts/date-format-fixtures
//         → exit 1, one planted offender per check 5–9, including BOTH witnessed
//           relative-time escape shapes: the no-import local and the
//           importing-but-escaping parallel helper.
//   GREEN node scripts/check-date-formatting.mjs frontend/src/design-system
//         → exit 0 over a clean subtree with the named debt INACTIVE, so the green
//           cannot be coming from the debt list.
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

// Check 5 — a date-fns relative-time call (only the formatter module may make one).
const RELATIVE_TIME = /\bformatDistanceToNow\b|\bformatDistance\s*\(/
// Check 7 — a 12-hour clock token inside a format literal.
const TWELVE_HOUR = /(?<![A-Za-z])h{1,2}:mm(?::ss)?\s*a(?![A-Za-z])/
// Check 8 — `.toLocaleString(` whose receiver NAME reads as a date (heuristic).
// Case-INSENSITIVE deliberately: the case-sensitive form of this token list cannot
// see `clientDate.toLocaleString(` / `serverDate.toLocaleString(`
// (components/collaboration/ConflictResolutionDialog.tsx), one of the two offender
// shapes this check exists to catch. Widening it also admits number receivers whose
// name happens to contain a date token — those are false positives and ride the
// named-debt list below WITH their reason, per the heuristic's own contract.
const LOCALESTRING_DATE =
  /(date|time|_at|created|updated|timestamp|deadline)\w*\s*\)?\.toLocaleString\(/i

/** Check 6 — a date-fns LOCALIZED SKELETON literal: P/p tokens only, at least one P. */
const isSkeleton = (fmt) => /^[Pp\s]+$/.test(fmt) && fmt.includes('P')

// Check 9a — the native relative formatter. Any instance outside the formatter
// module is a second formatter, whatever the enclosing function is called
// (`TaskListWidget`'s was called `formatDeadline`, and no name-keyed finder saw it).
const INTL_RELATIVE = /\bIntl\.RelativeTimeFormat\b/
// Check 9b — a local FUNCTION DECLARATION claiming relative time. Declaration
// shapes only: `function fooRelativeBar(` and `const fooRelativeBar = (…) =>` /
// `= function`. A plain `const relativeTime = formatRelativeTime(x)` is a CONSUMER
// of the sanctioned helper and must not fire.
const LOCAL_RELATIVE_DECL =
  /\bfunction\s+[A-Za-z_$]*[Rr]elative[A-Za-z_$]*\s*[(<]|\b(?:const|let|var)\s+[A-Za-z_$]*[Rr]elative[A-Za-z_$]*\s*(?::[^=]+)?=\s*(?:async\s+)?(?:function\b|\(|<)/
// Check 9c — the SHORT-FORMAT shape: an interpolated count glued to a bare
// time-unit suffix, English or Arabic. Both witnessed escapes had it
// (`ActivityList`'s `${diffD}d` / `${diffD}ي`, `relativeTime.ts`'s `${days}${suffix}`).
const SHORT_RELATIVE = /`\$\{[^`{}]{1,40}\}(?:s|m|h|d|w|y|ث|د|س|ي|ش)`/
// A comment line — the 9-family skips these (see header).
const COMMENT_LINE = /^\s*(?:\/\/|\*|\/\*)/

// The ONE sanctioned home of relative time (D-25) — a path exemption, permanent,
// deliberately not a burn-down row.
const RELATIVE_TIME_HOME = path.join(repoRoot, 'frontend', 'src', 'lib', 'format-date.ts')

// Named debt for checks 5–9, one row per (file, check). EMPTIED by plan 98-07:
// every row left by REPAIR. The array stays so the mechanism (and its stale-row
// rule) survives for the next migration — an empty list is the guard running
// STRICT, which is what 98-07's gate requires.
const BURNDOWN = [
]

// NAMED PERMANENT EXEMPTIONS — the gate's second permitted exit. A row leaves the
// burn-down by REPAIR or by a NAMED exemption; never by silent deletion. Each entry
// states WHY it is not a defect, and a dead-code exemption states its VOID CONDITION
// so it cannot launder unrendered code into a correctness claim.
const EXEMPT = [
  {
    file: 'frontend/src/components/activity-feed/EnhancedActivityFeed.tsx',
    checks: ['relative-time', 'skeleton'],
    why:
      'EXEMPT per RULING-P98A2-18. The component is DEAD — 0 importers at ' +
      '19f0ecde6dba624b4b8d320db48101c4798dd2ce, derived by ' +
      "`command grep -rn 'EnhancedActivityFeed' frontend/src --include='*.ts' --include='*.tsx' " +
      "| grep -v 'activity-feed/EnhancedActivityFeed.tsx:'` = 0, with the live control " +
      "`SharedRecentActivityCard` run through the identical command = 25. Its lines 200 and 205 " +
      'are GENUINE offenders left unrepaired BECAUSE NOTHING RENDERS THEM ' +
      '(RULING-P98A2-17 §2: dead-code repair is not this phase\'s diff). ' +
      'VOID CONDITION: if this file gains an importer, this exemption is void and both rows ' +
      'RETURN to the burn-down. Re-run the derivation command above to check. ' +
      'This is a DEAD-CODE exemption, NOT a correctness claim.',
  },
  {
    file: 'frontend/src/types/sla.types.ts',
    checks: ['short-relative'],
    why: 'SLA / duration display, OUT of criterion 5 per RULING-P98A2-17 §1(b)+(c).',
  },
  {
    file: 'frontend/src/components/engagements/LifecycleStepperBar.tsx',
    checks: ['short-relative'],
    why: 'SLA / duration display, OUT of criterion 5 per RULING-P98A2-17 §1(b)+(c).',
  },
  {
    file: 'frontend/src/components/engagements/LifecycleTimeline.tsx',
    checks: ['short-relative'],
    why: 'SLA / duration display, OUT of criterion 5 per RULING-P98A2-17 §1(b)+(c).',
  },
  {
    file: 'frontend/src/components/sla-countdown/SLACountdown.tsx',
    checks: ['short-relative'],
    why: 'SLA countdown, the T−N/T+N shape CLAUDE.md mandates — OUT per RULING-P98A2-17 §1(b).',
  },
  {
    file: 'frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx',
    checks: ['short-relative'],
    why: 'Labelled overdue COUNTER, OUT of criterion 5 per RULING-P98A2-17 §1(c).',
  },
]

const isExempt = (file, check) =>
  EXEMPT.some((e) => e.file === file && e.checks.includes(check))

/**
 * Rows still excusing a live site are `used`; a row nothing matched is stale.
 *
 * The separator is U+0000 and it is written as the ESCAPE `\u0000`, never as a raw NUL byte.
 * NUL is the right separator (it cannot occur in a path or a check name, so the composite key
 * cannot collide) but a raw one makes this whole file BINARY: `file(1)` reports `data` and a
 * plain `grep` prints "Binary file ... matches" with no lines. That is how this file -- which
 * carries this phase's negative-scope doctrine and its six named exemptions -- became invisible
 * to the instrument Phase 98 used most. The escape is byte-identical at runtime (proven by
 * SHA-256 of the composed key, 98-09). Keep it an escape.
 */
const burndownKey = (f) => `${f.file}\u0000${f.check}`

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
        // Check 6 — localized skeleton literal (month-first with no MMM token).
        if (isSkeleton(m[2])) {
          failures.push({
            file: relFile,
            line: lineNo,
            code,
            check: 'skeleton',
            why: `date-fns localized skeleton literal '${m[2]}' (use formatDayFirst/formatDateTime)`,
          })
        }
        // Check 7 — 12-hour clock inside a format literal.
        if (TWELVE_HOUR.test(m[2])) {
          failures.push({
            file: relFile,
            line: lineNo,
            code,
            check: 'twelve-hour',
            why: `12-hour clock literal '${m[2]}' (use formatTime — 24-hour '14:30 GST')`,
          })
        }
      }

      // Check 5 — relative time outside its one sanctioned home.
      if (file !== RELATIVE_TIME_HOME && RELATIVE_TIME.test(rawLine)) {
        failures.push({
          file: relFile,
          line: lineNo,
          code,
          check: 'relative-time',
          why: 'date-fns relative time outside lib/format-date.ts (use formatRelativeTime — D-25: feed/timeline surfaces only)',
        })
      }

      // Check 8 — .toLocaleString( on a date-ish receiver.
      if (!allowed && LOCALESTRING_DATE.test(rawLine)) {
        failures.push({
          file: relFile,
          line: lineNo,
          code,
          check: 'localestring-date',
          why: 'date-receiver .toLocaleString( (use formatDayFirst/formatDateTime)',
        })
      }

      // Checks 9a–9c — relative-time PRODUCTION, keyed on what they catch rather
      // than on an import token. Comment lines are skipped (see header).
      if (file !== RELATIVE_TIME_HOME && !COMMENT_LINE.test(code)) {
        if (INTL_RELATIVE.test(rawLine)) {
          failures.push({
            file: relFile,
            line: lineNo,
            code,
            check: 'intl-relative',
            why: 'Intl.RelativeTimeFormat outside lib/format-date.ts — a second relative formatter (use formatRelativeTime)',
          })
        }
        if (LOCAL_RELATIVE_DECL.test(rawLine)) {
          failures.push({
            file: relFile,
            line: lineNo,
            code,
            check: 'local-relative-decl',
            why: 'local relative-time function declaration — one helper only (RULING-P98A2-06 §2: a surviving parallel helper fails criterion 5 by construction)',
          })
        }
        if (SHORT_RELATIVE.test(rawLine)) {
          failures.push({
            file: relFile,
            line: lineNo,
            code,
            check: 'short-relative',
            why: 'hand-assembled short relative form (interpolated count + bare unit suffix) — RULING-P98A2-19: no hand-rolled relative-string assembly',
          })
        }
      }
    })
  }

  // The named debt applies ONLY to the default frontend/src scan — a fixture-dir
  // run must report the checks themselves, never stale rows (see header).
  const burndownActive = cliArg === undefined
  const excused = new Set()
  let debtSites = 0

  // Named permanent exemptions apply on EVERY run, fixture runs included — an
  // exemption states a scope fact, not a debt, so a directory run must honour it.
  const notExempt = failures.filter((f) => !isExempt(f.file, f.check))

  const real = burndownActive
    ? notExempt.filter((f) => {
        const row = BURNDOWN.find((r) => r.file === f.file && r.check === f.check)
        if (row === undefined) {
          return true
        }
        excused.add(burndownKey(row))
        debtSites += 1
        return false
      })
    : notExempt

  // A row nothing matched has outlived its site: the debt is paid, delete the row.
  const stale = burndownActive ? BURNDOWN.filter((r) => !excused.has(burndownKey(r))) : []

  if (stale.length > 0) {
    console.error(
      `date-formatting check FAILED: ${stale.length} stale burn-down row(s) — the pattern each ` +
        'excuses is gone from its file. A row is a named debt, not a pass: delete it.',
    )
    for (const r of stale) {
      console.error(`  ${r.file} — ${r.check}`)
    }
    console.error('')
  }

  if (real.length > 0) {
    console.error(
      `date-formatting check FAILED: ${real.length} ad-hoc date/number formatting site(s) found (D-82-03 / D-82-05):`,
    )
    for (const f of real) {
      console.error(`  ${f.file}:${f.line} — ${f.why}\n      ${f.code}`)
    }
    console.error('')
  }

  if (real.length > 0 || stale.length > 0) {
    console.error(
      'Fix: route dates/times through frontend/src/lib/format-date.ts (formatDayFirst/formatTime/' +
        'formatRelativeTime) and number/locale formatting through frontend/src/lib/format-locale.ts ' +
        "toFormatLocale() (Latin-safe). Never a bare 'ar-SA' / raw toLocaleDateString / a date-fns " +
        'relative-time or skeleton literal outside the formatter.',
    )
    process.exit(1)
  }

  console.log(
    `date-formatting check OK: ${files.length} non-test file(s) scanned, 0 unexcused ad-hoc date/number ` +
      'formatting sites (raw toLocaleDateString/toLocaleTimeString, month-first date-fns literals, Indic ' +
      'locale literals, relative time, localized skeletons, 12-hour literals, date-receiver toLocaleString, ' +
      'Intl.RelativeTimeFormat, local relative-time declarations, hand-assembled short relative forms) ' +
      'outside the 2-file allowlist (lib/format-date.ts, components/ui/calendar.tsx) and the ' +
      `${EXEMPT.length} named permanent exemption(s) (see EXEMPT — each states its reason, and the ` +
      'dead-code one states its VOID CONDITION). ' +
      (burndownActive
        ? `Named debt: ${BURNDOWN.length} row(s) excusing ${debtSites} site(s), all owned by plan 98-07.`
        : 'Named debt NOT applied (explicit-directory run) — this green is unexcused.'),
  )
  process.exit(0)
}

main()
