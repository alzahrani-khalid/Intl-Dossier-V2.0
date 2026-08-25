#!/usr/bin/env node
// Static navigation-label/page-title agreement checker for all 28 modern-nav entries.
// Agreement is sense-aware: both anchors must carry the same object term. It is not byte
// equality (for example, "Positions" and "Positions Library" agree on the Positions object).

import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptRepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LOCALES = ['en', 'ar']

const parseArgs = (argv) => {
  let root = scriptRepoRoot
  let rootSeen = false
  let control = false
  let json = false
  for (const argument of argv) {
    if (argument === '--control') control = true
    else if (argument === '--json') json = true
    else if (argument.startsWith('--')) throw new Error(`unknown option: ${argument}`)
    else if (rootSeen) throw new Error(`unexpected positional argument: ${argument}`)
    else {
      root = resolve(argument)
      rootSeen = true
    }
  }
  return { root, control, json }
}

// The first 13 rows are the anchors derived in 99-RESEARCH §4.2. The remaining 15 carry the
// route walk performed by P99-22. titleSourcePath/titleSourceContains keep each deeper heading
// anchored to the component that actually renders it; two hardcoded headings are read directly.
const rows = [
  {
    labelKey: 'navigation.countries',
    titleNamespace: 'countries',
    titleKey: 'title',
    ruledTerm: 'دولة / الدول',
    termPattern: 'دول',
  },
  {
    labelKey: 'navigation.engagements',
    titleNamespace: 'engagements',
    titleKey: 'title',
    ruledTerm: 'مشاركة / المشاركات',
    termPattern: 'مشارك',
  },
  {
    labelKey: 'navigation.persons',
    titleNamespace: 'persons',
    titleKey: 'title',
    ruledTerm: 'الأشخاص',
    termPattern: 'أشخاص',
  },
  {
    labelKey: 'navigation.positions',
    titleNamespace: 'positions',
    titleKey: 'library.title',
    ruledTerm: 'موقف / المواقف',
    termPattern: 'موا?قف',
  },
  {
    labelKey: 'navigation.mous',
    titleNamespace: 'common',
    titleKey: 'mous.pageTitle',
    ruledTerm: 'مذكرات التفاهم',
    termPattern: 'مذكرات التفاهم',
    titleSourcePath: 'frontend/src/pages/MoUs/MousPage.tsx',
    titleSourceContains: "t('common:mous.pageTitle')",
  },
  {
    labelKey: 'navigation.intake',
    titleNamespace: 'intake',
    titleKey: 'queue.title',
    ruledTerm: 'قائمة الاستقبال',
    termPattern: 'استقبال',
  },
  {
    labelKey: 'navigation.dashboardOverview',
    titleNamespace: 'dashboard',
    titleKey: 'title',
    ruledTerm: 'دوسيه / الدوسيهات',
    termPattern: 'دوسيه',
  },
  {
    labelKey: 'navigation.organizations',
    titleNamespace: 'organizations',
    titleKey: 'title',
    ruledTerm: 'المنظمات',
    termPattern: 'منظمات',
  },
  {
    labelKey: 'navigation.forums',
    titleNamespace: 'forums',
    titleKey: 'pageTitle',
    ruledTerm: 'منتدى / المنتديات',
    termPattern: 'منتد',
  },
  {
    labelKey: 'navigation.workingGroups',
    titleNamespace: 'working-groups',
    titleKey: 'title',
    ruledTerm: 'مجموعات العمل',
    termPattern: 'مجموعات العمل',
  },
  {
    labelKey: 'navigation.tasks',
    titleNamespace: 'tasks-page',
    titleKey: 'title',
    ruledTerm: 'مكتبي',
    termPattern: 'مكتبي',
  },
  {
    labelKey: 'navigation.calendar',
    titleNamespace: 'calendar',
    titleKey: 'page.title',
    ruledTerm: 'التقويم',
    termPattern: 'تقويم',
  },
  {
    labelKey: 'navigation.briefs',
    titleNamespace: 'briefs-page',
    titleKey: 'title',
    ruledTerm: 'ملخص / الملخصات',
    termPattern: 'ملخص',
  },
  {
    labelKey: 'navigation.events',
    titleNamespace: 'common',
    titleKey: 'navigation.events',
    ruledTerm: 'فعالية / الفعاليات',
    termPattern: 'فعالي',
    titleSourcePath: 'frontend/src/pages/events/EventsPage.tsx',
    titleSourceContains: "t('navigation.events')",
  },
  {
    labelKey: 'navigation.reports',
    titleNamespace: 'common',
    titleKey: 'navigation.reports',
    ruledTerm: 'تقرير / التقارير',
    termPattern: 'تقارير',
    titleSourcePath: 'frontend/src/pages/reports/ReportsPage.tsx',
    titleSourceContains: "t('navigation.reports')",
  },
  {
    labelKey: 'navigation.scheduledReports',
    titleNamespace: 'scheduled-reports',
    titleKey: 'title',
    ruledTerm: 'التقارير المجدولة',
    termPattern: 'التقارير المجدولة',
    titleSourcePath: 'frontend/src/components/scheduled-reports/ScheduledReportsManager.tsx',
    titleSourceContains: "t('title')",
  },
  {
    labelKey: 'navigation.analytics',
    titleNamespace: 'analytics',
    titleKey: 'title',
    ruledTerm: 'التحليلات',
    termPattern: 'تحليل',
    titleSourcePath: 'frontend/src/pages/analytics/AnalyticsDashboardPage.tsx',
    titleSourceContains: "title={t('title')}",
  },
  {
    labelKey: 'navigation.intelligence',
    titleNamespace: 'common',
    titleKey: 'navigation.intelligence',
    ruledTerm: 'الاستخبارات',
    termPattern: 'استخبارات',
    titleSourcePath: 'frontend/src/pages/intelligence/IntelligencePage.tsx',
    titleSourceContains: "t('navigation.intelligence')",
  },
  {
    labelKey: 'navigation.monitoring',
    titleSourcePath: 'frontend/src/pages/monitoring/Dashboard.tsx',
    titleSourcePattern: '<h1>(Monitoring Dashboard)</h1>',
    ruledTerm: 'المراقبة / Monitoring',
    labelTermPattern: 'مراقب',
    titleTermPattern: 'Monitoring',
  },
  {
    labelKey: 'navigation.dataLibrary',
    titleNamespace: 'common',
    titleKey: 'navigation.dataLibrary',
    ruledTerm: 'مكتبة البيانات',
    termPattern: 'مكتبة البيانات',
    titleSourcePath: 'frontend/src/pages/data-library/DataLibraryPage.tsx',
    titleSourceContains: "t('navigation.dataLibrary')",
  },
  {
    labelKey: 'navigation.wordAssistant',
    titleNamespace: 'common',
    titleKey: 'navigation.wordAssistant',
    ruledTerm: 'مساعد الوثائق',
    termPattern: 'مساعد الوثائق',
    titleSourcePath: 'frontend/src/pages/word-assistant/WordAssistantPage.tsx',
    titleSourceContains: "t('navigation.wordAssistant')",
  },
  {
    labelKey: 'navigation.users',
    titleNamespace: 'user-management',
    titleKey: 'usersList.title',
    ruledTerm: 'المستخدمون',
    termPattern: 'مستخدم',
    titleSourcePath: 'frontend/src/pages/users/UsersListPage.tsx',
    titleSourceContains: "title={t('usersList.title')}",
  },
  {
    labelKey: 'navigation.settings',
    titleNamespace: 'settings',
    titleKey: 'pageTitle',
    ruledTerm: 'الإعدادات',
    termPattern: 'إعداد',
    titleSourcePath: 'frontend/src/components/settings/SettingsLayout.tsx',
    titleSourceContains: "t('pageTitle')",
  },
  {
    labelKey: 'navigation.help',
    titleSourcePath: 'frontend/src/pages/help/HelpPage.tsx',
    titleSourcePattern: "title=\\{isRTL \\? '([^']+)'",
    ruledTerm: 'المساعدة',
    termPattern: 'مساعد',
  },
  {
    labelKey: 'navigation.admin',
    titleNamespace: 'ai-admin',
    titleKey: 'settings.title',
    ruledTerm: 'الإدارة',
    termPattern: 'إدار',
    titleSourcePath: 'frontend/src/routes/_protected/admin/ai-settings.tsx',
    titleSourceContains: "t('settings.title', 'AI Settings')",
  },
  {
    labelKey: 'navigation.taskQueue',
    titleNamespace: 'assignments',
    titleKey: 'queue.title',
    ruledTerm: 'قائمة المهام',
    termPattern: 'مهام',
    titleSourcePath: 'frontend/src/pages/AssignmentQueue.tsx',
    titleSourceContains: "t('queue.title')",
  },
  {
    labelKey: 'navigation.taskEscalations',
    titleNamespace: 'assignments',
    titleKey: 'escalations.title',
    ruledTerm: 'تصعيدات المهام',
    termPattern: 'تصعيد',
    titleSourcePath: 'frontend/src/pages/Escalations.tsx',
    titleSourceContains: "t('escalations.title')",
  },
  {
    labelKey: 'navigation.newEvent',
    titleNamespace: 'calendar',
    titleKey: 'new_event.title',
    ruledTerm: 'فعالية جديدة',
    termPattern: 'فعالي',
    titleSourcePath: 'frontend/src/routes/_protected/calendar/new.tsx',
    titleSourceContains: "t('new_event.title')",
  },
]

const valueAt = (bundle, keyPath) => {
  let current = bundle
  for (const segment of keyPath.split('.')) {
    if (current == null || typeof current !== 'object' || !(segment in current)) return undefined
    current = current[segment]
  }
  return typeof current === 'string' ? current : undefined
}

const titleAnchor = (row) =>
  row.titleNamespace ? `${row.titleNamespace}:${row.titleKey}` : `source:${row.titleSourcePath}`

const readLiveData = (root) => {
  const i18nDirectory = join(root, 'frontend/src/i18n')
  const namespaces = [
    ...new Set([
      'common',
      ...rows.flatMap((row) => (row.titleNamespace ? [row.titleNamespace] : [])),
    ]),
  ]
  const arabicBundles = Object.fromEntries(
    namespaces.map((namespace) => [
      namespace,
      JSON.parse(readFileSync(join(i18nDirectory, 'ar', `${namespace}.json`), 'utf8')),
    ]),
  )
  const commonByLocale = Object.fromEntries(
    LOCALES.map((locale) => [
      locale,
      JSON.parse(readFileSync(join(i18nDirectory, locale, 'common.json'), 'utf8')),
    ]),
  )
  const englishPersonsTitle = valueAt(
    JSON.parse(readFileSync(join(i18nDirectory, 'en', 'persons.json'), 'utf8')),
    'title',
  )
  const navigationSource = readFileSync(
    join(root, 'frontend/src/components/modern-nav/navigationData.ts'),
    'utf8',
  )
  const navigationReferences = [
    ...navigationSource.matchAll(/\b(labelKey|tooltipKey):\s*['"]([^'"]+)['"]/g),
  ].map((match) => ({ kind: match[1], key: match[2] }))
  if (navigationReferences.length === 0) {
    throw new Error('navigationData.ts yielded zero labelKey/tooltipKey declarations')
  }
  const sourcePaths = [
    ...new Set(rows.flatMap((row) => (row.titleSourcePath ? [row.titleSourcePath] : []))),
  ]
  const titleSources = Object.fromEntries(
    sourcePaths.map((sourcePath) => [sourcePath, readFileSync(join(root, sourcePath), 'utf8')]),
  )
  return { arabicBundles, commonByLocale, englishPersonsTitle, navigationReferences, titleSources }
}

const resolveTitle = (row, bundles, titleSources) => {
  if (row.titleNamespace) return valueAt(bundles[row.titleNamespace], row.titleKey)
  const source = titleSources[row.titleSourcePath]
  return source?.match(new RegExp(row.titleSourcePattern, 'u'))?.[1]
}

const inspectRows = (candidateRows, bundles, titleSources = {}) =>
  candidateRows.map((row) => {
    const label = valueAt(bundles.common, row.labelKey)
    const title = resolveTitle(row, bundles, titleSources)
    const source = row.titleSourcePath ? titleSources[row.titleSourcePath] : undefined
    const sourceReferenceMissing = Boolean(
      row.titleSourceContains && !source?.includes(row.titleSourceContains),
    )
    const labelTerm = new RegExp(row.labelTermPattern ?? row.termPattern, 'u')
    const titleTerm = new RegExp(row.titleTermPattern ?? row.termPattern, 'u')
    const missing = [
      ...(!label ? [`common:${row.labelKey}`] : []),
      ...(!title ? [titleAnchor(row)] : []),
      ...(sourceReferenceMissing
        ? [`source:${row.titleSourcePath}#${row.titleSourceContains}`]
        : []),
    ]
    const labelCarriesTerm = Boolean(label && labelTerm.test(label))
    const titleCarriesTerm = Boolean(title && titleTerm.test(title))
    return {
      ...row,
      titleAnchor: titleAnchor(row),
      label,
      title,
      labelCarriesTerm,
      titleCarriesTerm,
      missing,
      agrees: missing.length === 0 && labelCarriesTerm && titleCarriesTerm,
    }
  })

const missingNavigationKeys = (references, commonByLocale) =>
  references.flatMap((reference) =>
    LOCALES.flatMap((locale) =>
      valueAt(commonByLocale[locale], reference.key) === undefined
        ? [{ ...reference, locale }]
        : [],
    ),
  )

const rowCoverageIssues = (references, candidateRows) => {
  const navLabelKeys = references
    .filter((reference) => reference.kind === 'labelKey')
    .map((reference) => reference.key)
  const rowKeys = candidateRows.map((row) => row.labelKey)
  const duplicates = [...new Set(rowKeys.filter((key, index) => rowKeys.indexOf(key) !== index))]
  return [
    ...navLabelKeys.filter((key) => !rowKeys.includes(key)).map((key) => `missing row ${key}`),
    ...rowKeys.filter((key) => !navLabelKeys.includes(key)).map((key) => `non-nav row ${key}`),
    ...duplicates.map((key) => `duplicate row ${key}`),
    ...(navLabelKeys.length === 28
      ? []
      : [`navigationData.ts has ${navLabelKeys.length} items, not 28`]),
  ]
}

const commonRepairIssues = (commonByLocale) =>
  LOCALES.flatMap((locale) => {
    const common = commonByLocale[locale]
    const expectedMousCopy =
      locale === 'ar'
        ? { title: 'العنوان', pageTitle: 'مذكرات التفاهم' }
        : { title: 'Title', pageTitle: 'MoUs' }
    const checks = [
      ['tasks.sla.approaching', (value) => typeof value === 'string' && value.length > 0],
      ['afterActions.decisions.item', (value) => value?.includes('{{number}}')],
      ['afterActions.confidence', (value) => value?.includes('{{value}}')],
      ['mous.title', (value) => value === expectedMousCopy.title],
      ['mous.pageTitle', (value) => value === expectedMousCopy.pageTitle],
    ]
    return checks.flatMap(([key, valid]) =>
      valid(valueAt(common, key)) ? [] : [`${locale}/common:${key}`],
    )
  })

const readDecisionArtifact = (root) =>
  JSON.parse(readFileSync(join(root, 'scripts/glossary-senses.d/tiebreaks.json'), 'utf8'))

const applyDecisionDispositions = (results, artifact) => {
  const byLabel = new Map(artifact.rows.map((row) => [row.labelKey, row]))
  return results.map((result) => {
    const decision = byLabel.get(result.labelKey)
    const candidateValuesMatch =
      decision?.candidates?.label === result.label && decision?.candidates?.title === result.title
    // RULING-P99-05 §3 makes a newly discovered pair an escalation, not an invented repair.
    // It remains `agrees: false`; only an exact, value-locked escalation record adjudicates it.
    // Any later value drift or unrecorded mismatch therefore returns to the failing population.
    return {
      ...result,
      disposition: decision?.disposition,
      escalated:
        !result.agrees &&
        result.missing.length === 0 &&
        decision?.disposition === 'escalate-unruled' &&
        candidateValuesMatch,
    }
  })
}

const artifactIssues = (artifact, candidateRows, results, englishPersonsTitle) => {
  if (!Array.isArray(artifact.rows)) return ['tiebreaks.json rows is not an array']
  const byLabel = new Map(artifact.rows.map((row) => [row.labelKey, row]))
  const resultsByLabel = new Map(results.map((result) => [result.labelKey, result]))
  const ruledPersonsTitleEn = byLabel.get('navigation.persons')?.after?.titleEn
  return [
    ...(artifact.rows.length === 28
      ? []
      : [`tiebreaks.json has ${artifact.rows.length} rows, not 28`]),
    ...(ruledPersonsTitleEn === 'Persons' && englishPersonsTitle === ruledPersonsTitleEn
      ? []
      : ['en/persons:title does not carry the ruled Persons-family title']),
    ...candidateRows.flatMap((row) => {
      const artifactRow = byLabel.get(row.labelKey)
      if (!artifactRow) return [`tiebreaks.json missing ${row.labelKey}`]
      const result = resultsByLabel.get(row.labelKey)
      return [
        ...(artifactRow.titleAnchor === titleAnchor(row)
          ? []
          : [`tiebreaks.json anchor drift for ${row.labelKey}`]),
        ...(artifactRow.disposition === 'escalate-unruled' && !result?.escalated
          ? [`tiebreaks.json escalation candidate drift for ${row.labelKey}`]
          : []),
      ]
    }),
  ]
}

const summarize = ({
  results,
  navigationMissing = [],
  coverageIssues = [],
  repairIssues = [],
  decisionArtifactIssues = [],
}) => ({
  population: results.length,
  agreements: results.filter((result) => result.agrees).length,
  escalations: results.filter((result) => result.escalated).length,
  adjudicated: results.filter((result) => result.agrees || result.escalated).length,
  mismatches: results.filter(
    (result) => !result.agrees && !result.escalated && result.missing.length === 0,
  ).length,
  missingAnchorKeys: results.reduce((total, result) => total + result.missing.length, 0),
  missingNavigationKeys: navigationMissing.length,
  rowCoverageIssues: coverageIssues,
  commonRepairIssues: repairIssues,
  decisionArtifactIssues,
  navigationMissing,
  rows: results,
  results,
})

let options
try {
  options = parseArgs(process.argv.slice(2))
} catch (error) {
  console.error(error.message)
  process.exit(2)
}

if (options.control) {
  const controlRows = [
    {
      labelKey: 'navigation.good',
      titleNamespace: 'control',
      titleKey: 'good',
      ruledTerm: 'دوسيه',
      termPattern: 'دوسيه',
    },
    {
      labelKey: 'navigation.plantedMismatch',
      titleNamespace: 'control',
      titleKey: 'plantedMismatch',
      ruledTerm: 'دوسيه',
      termPattern: 'دوسيه',
    },
  ]
  const result = summarize({
    results: inspectRows(controlRows, {
      common: { navigation: { good: 'الدوسيهات', plantedMismatch: 'الدوسيهات' } },
      control: { good: 'مكتبة الدوسيهات', plantedMismatch: 'مكتبة الملفات' },
    }),
  })
  const planted = result.results.find((row) => row.labelKey === 'navigation.plantedMismatch')
  const good = result.results.find((row) => row.labelKey === 'navigation.good')
  const passed = result.mismatches === 1 && !planted.agrees && good.agrees
  console.log(
    JSON.stringify(
      {
        control: passed ? 'PASS' : 'FAIL',
        plantedMismatchCaught: !planted.agrees,
        positiveAgreementPreserved: good.agrees,
      },
      null,
      2,
    ),
  )
  process.exit(passed ? 0 : 1)
}

let liveData
let result
try {
  liveData = readLiveData(options.root)
  const decisionArtifact = readDecisionArtifact(options.root)
  const inspectedRows = inspectRows(rows, liveData.arabicBundles, liveData.titleSources)
  const decidedRows = applyDecisionDispositions(inspectedRows, decisionArtifact)
  result = summarize({
    results: decidedRows,
    navigationMissing: missingNavigationKeys(
      liveData.navigationReferences,
      liveData.commonByLocale,
    ),
    coverageIssues: rowCoverageIssues(liveData.navigationReferences, rows),
    repairIssues: commonRepairIssues(liveData.commonByLocale),
    decisionArtifactIssues: artifactIssues(
      decisionArtifact,
      rows,
      decidedRows,
      liveData.englishPersonsTitle,
    ),
  })
} catch (error) {
  console.error(error.message)
  process.exit(2)
}

if (options.json) {
  console.log(JSON.stringify(result, null, 2))
} else {
  console.log(
    `nav/title walk: ${result.adjudicated}/${result.population} adjudicated; ` +
      `${result.agreements} agree; ${result.escalations} escalated; ` +
      `${result.mismatches} unruled mismatch; ${result.missingAnchorKeys} missing anchor; ` +
      `${result.missingNavigationKeys} missing navigation locale key; ` +
      `${result.rowCoverageIssues.length} row coverage issue; ` +
      `${result.commonRepairIssues.length} common repair issue; ` +
      `${result.decisionArtifactIssues.length} decision artifact issue`,
  )
  for (const row of result.results.filter((candidate) => !candidate.agrees)) {
    const reason =
      row.missing.length > 0
        ? `MISSING ${row.missing.join(', ')}`
        : row.escalated
          ? 'ESCALATED-UNRULED OBJECT-TERM MISMATCH'
          : 'OBJECT-TERM MISMATCH'
    console.log(
      `${reason}\tcommon:${row.labelKey}=${JSON.stringify(row.label)}\t` +
        `${row.titleAnchor}=${JSON.stringify(row.title)}\truled=${row.ruledTerm}`,
    )
  }
  for (const missing of result.navigationMissing) {
    console.log(`MISSING-NAV\tlocale=${missing.locale}\t${missing.kind}\tcommon:${missing.key}`)
  }
  for (const issue of result.rowCoverageIssues) console.log(`ROW-COVERAGE\t${issue}`)
  for (const issue of result.commonRepairIssues) console.log(`COMMON-REPAIR\t${issue}`)
  for (const issue of result.decisionArtifactIssues) console.log(`DECISION-ARTIFACT\t${issue}`)
}

// Let piped JSON/human output flush before returning the live status.
process.exitCode =
  result.mismatches === 0 &&
  result.missingAnchorKeys === 0 &&
  result.missingNavigationKeys === 0 &&
  result.rowCoverageIssues.length === 0 &&
  result.commonRepairIssues.length === 0 &&
  result.decisionArtifactIssues.length === 0
    ? 0
    : 1
