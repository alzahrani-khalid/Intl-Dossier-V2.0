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
// BOTH POLARITIES, runnable on demand:
//   RED   node scripts/check-date-formatting.mjs scripts/date-format-fixtures
//         → exit 1, one planted offender per check 5–8.
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

// The ONE sanctioned home of relative time (D-25) — a path exemption, permanent,
// deliberately not a burn-down row.
const RELATIVE_TIME_HOME = path.join(repoRoot, 'frontend', 'src', 'lib', 'format-date.ts')

// Named debt for checks 5–8, one row per (file, check), derived by running this
// script against frontend/src with the list empty. Emptied by plan 98-07 — the
// row marker below is that plan's emptiness anchor and appears on rows ONLY.
const BURNDOWN = [
  { file: 'frontend/src/components/collaboration/ConflictResolutionDialog.tsx', check: 'localestring-date', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/commitments/StatusTimeline.tsx', check: 'localestring-date', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/pages/MyAssignments.tsx', check: 'localestring-date', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/pages/webhooks/WebhooksPage.tsx', check: 'localestring-date', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/routes/_protected/positions/$id/approvals.tsx', check: 'localestring-date', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/routes/_protected/positions/$id/versions.tsx', check: 'localestring-date', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/activity-feed/EnhancedActivityFeed.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/audit-logs/AuditLogTable.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/briefing-books/BriefingBooksList.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/comments/CommentItem.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/duplicate-detection/DuplicateCandidateCard.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/form-auto-save/AutoSaveIndicator.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/form-auto-save/FormDraftBanner.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/intelligence/BilateralOpportunities.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/intelligence/EconomicDashboard.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/intelligence/PoliticalAnalysis.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/intelligence/SecurityAssessment.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/notifications/NotificationItem.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/scenario-sandbox/ScenarioCard.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/scheduled-reports/ScheduledReportsManager.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/workflow-automation/WorkflowExecutionsList.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/workflow-automation/WorkflowRuleCard.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/pages/Dashboard/components/ActivityFeedItem.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/pages/Dashboard/widgets/RecentDossiers.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/pages/dossiers/overview-cards/SharedRecentActivityCard.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/pages/my-work/components/WorkItemCard.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/routes/_protected/tags.tsx', check: 'relative-time', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/activity-feed/EnhancedActivityFeed.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/audit-logs/AuditLogTable.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/availability-polling/AvailabilityPollVoter.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/calendar/UnifiedCalendar.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/commitments/CommitmentFilterDrawer.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/commitments/CommitmentForm.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/contacts/InteractionNoteForm.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/contacts/InteractionTimeline.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/delegation/CreateDelegationDialog.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/delegation/DelegationCard.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/edit-approval-flow/EditApprovalFlow.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/positions/AttachPositionDialog.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/positions/PositionAnalyticsCard.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/positions/PositionCard.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/report-builder/FilterBuilder.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/report-builder/SavedReportsList.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/scheduled-reports/ExecutionHistoryDialog.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/scheduled-reports/ScheduledReportsManager.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/tasks/TaskEditDialog.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/version-history-viewer/VersionHistoryViewer.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/waiting-queue/AssignmentDetailsModal.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/work-creation/forms/CommitmentQuickForm.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/work-creation/forms/TaskQuickForm.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/pages/availability-polling/AvailabilityPollingPage.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/pages/dossiers/overview-cards/BilateralSummaryCard.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/pages/dossiers/overview-cards/ElectedOfficialOfficeCard.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/pages/dossiers/overview-cards/EngagementHistoryCard.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/pages/dossiers/overview-cards/ForumSessionsCard.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/pages/dossiers/overview-cards/MeetingScheduleCard.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/pages/dossiers/overview-cards/PersonMetadataCard.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/routes/_protected/after-actions/$afterActionId.tsx', check: 'skeleton', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/availability-polling/AvailabilityPollResults.tsx', check: 'twelve-hour', marker: 'P98-BURNDOWN', removedBy: '98-07' },
  { file: 'frontend/src/components/availability-polling/AvailabilityPollVoter.tsx', check: 'twelve-hour', marker: 'P98-BURNDOWN', removedBy: '98-07' },
]

/** Rows still excusing a live site are `used`; a row nothing matched is stale. */
const burndownKey = (f) => `${f.file} ${f.check}`

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
    })
  }

  // The named debt applies ONLY to the default frontend/src scan — a fixture-dir
  // run must report the checks themselves, never stale rows (see header).
  const burndownActive = cliArg === undefined
  const excused = new Set()
  let debtSites = 0

  const real = burndownActive
    ? failures.filter((f) => {
        const row = BURNDOWN.find((r) => r.file === f.file && r.check === f.check)
        if (row === undefined) {
          return true
        }
        excused.add(burndownKey(row))
        debtSites += 1
        return false
      })
    : failures

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
      'locale literals, relative time, localized skeletons, 12-hour literals, date-receiver toLocaleString) ' +
      'outside the 2-file allowlist (lib/format-date.ts, components/ui/calendar.tsx). ' +
      (burndownActive
        ? `Named debt: ${BURNDOWN.length} row(s) excusing ${debtSites} site(s), all owned by plan 98-07.`
        : 'Named debt NOT applied (explicit-directory run) — this green is unexcused.'),
  )
  process.exit(0)
}

main()
