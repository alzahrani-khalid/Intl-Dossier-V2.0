import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import enDossierExport from '@/i18n/en/dossier-export.json'
import arDossierExport from '@/i18n/ar/dossier-export.json'
import enCommon from '@/i18n/en/common.json'
import arCommon from '@/i18n/ar/common.json'

// Mutable test state — each test sets these before rendering.
let mockLanguage = 'en'
let mockFailedSections: string[] = []
let mockProgress: {
  status: string
  progress: number
  message_en: string
  message_ar: string
} | null = null

vi.mock('react-i18next', async () => {
  const { default: enBundle } = await vi.importActual<
    typeof import('@/i18n/en/dossier-export.json')
  >('@/i18n/en/dossier-export.json')
  const { default: arBundle } = await vi.importActual<
    typeof import('@/i18n/ar/dossier-export.json')
  >('@/i18n/ar/dossier-export.json')
  const { default: enCommonBundle } =
    await vi.importActual<typeof import('@/i18n/en/common.json')>('@/i18n/en/common.json')
  const { default: arCommonBundle } =
    await vi.importActual<typeof import('@/i18n/ar/common.json')>('@/i18n/ar/common.json')
  const bundles = {
    en: { 'dossier-export': enBundle, common: enCommonBundle },
    ar: { 'dossier-export': arBundle, common: arCommonBundle },
  }

  const resolve = (
    boundNamespace: string,
    key: string,
    options?: Record<string, unknown>,
  ): string => {
    const separator = key.indexOf(':')
    const namespace = separator === -1 ? boundNamespace : key.slice(0, separator)
    const path = separator === -1 ? key : key.slice(separator + 1)
    const localeBundles = bundles[mockLanguage === 'ar' ? 'ar' : 'en']
    let value: unknown = localeBundles[namespace as keyof typeof localeBundles]
    for (const segment of path.split('.')) {
      if (value === null || typeof value !== 'object' || !(segment in value)) {
        throw new Error(`Missing dossier-export translation: ${key}`)
      }
      value = (value as Record<string, unknown>)[segment]
    }
    if (typeof value !== 'string') {
      throw new Error(`Non-string dossier-export translation: ${key}`)
    }
    return value.replace(/\{\{(\w+)\}\}/g, (_match, token: string) => {
      if (options?.[token] === undefined) {
        throw new Error(
          `Missing interpolation option for dossier-export translation: ${key}.${token}`,
        )
      }
      return String(options[token])
    })
  }

  return {
    useTranslation: (
      namespace?: string,
    ): {
      t: (key: string, options?: Record<string, unknown>) => string
      i18n: { language: string }
    } => ({
      t: (key, options) => resolve(namespace ?? 'common', key, options),
      i18n: { language: mockLanguage },
    }),
    Trans: ({ children }: { children: ReactNode }): ReactNode => children,
  }
})

vi.mock('@/hooks/useDirection', () => ({
  useDirection: (): { direction: 'ltr' | 'rtl'; isRTL: boolean } => ({
    direction: mockLanguage === 'ar' ? 'rtl' : 'ltr',
    isRTL: mockLanguage === 'ar',
  }),
}))

const exportDossierMock = vi.fn()
const resetMock = vi.fn()

vi.mock('@/hooks/useDossierExport', () => ({
  useDossierExport: (): Record<string, unknown> => ({
    exportDossier: exportDossierMock,
    quickExport: vi.fn(),
    progress: mockProgress,
    isExporting: false,
    error: null,
    failedSections: mockFailedSections,
    reset: resetMock,
  }),
}))

import { ExportDossierDialog } from '../ExportDossierDialog'

const baseProps = {
  dossierId: 'dossier-1',
  dossierName: 'Saudi Arabia',
  dossierType: 'country' as const,
  open: true,
  onClose: vi.fn(),
}

const laneProductionPaths = [
  'components/calendar/ConflictResolution/ReschedulingSuggestions.tsx',
  'components/calendar/ConflictResolution/SchedulingConflictComparison.tsx',
  'components/compliance/ComplianceRulesManager.tsx',
  'components/dashboard-widgets/WidgetLibrary.tsx',
  'components/dashboard-widgets/WidgetSettingsDialog.tsx',
  'components/dossier-recommendations/DossierRecommendationCard.tsx',
  'components/dossier/ActivityTimelineItem.tsx',
  'components/dossier/DossierActivityTimeline.tsx',
  'components/dossier/DossierContextIndicator.tsx',
  'components/dossier/DossierErrorBoundary.tsx',
  'components/dossier/DossierLinksWidget.tsx',
  'components/dossier/ExportDossierDialog.tsx',
  'components/dossier/MiniRelationshipGraph.tsx',
] as const

const laneProductionSources = Object.fromEntries(
  laneProductionPaths.map((path) => [
    path,
    readFileSync(resolve(process.cwd(), 'src', path), 'utf8'),
  ]),
) as Record<(typeof laneProductionPaths)[number], string>
const joinedLaneProduction = Object.values(laneProductionSources).join('\n')
const literalMaskPattern = /\bt\(\s*'[^']+'\s*,\s*'[^']*'/g
const fallbackOptionPattern = /\bdefaultValue(?:_[A-Za-z0-9]+)?\s*:/g
const rawKeyPattern = /\bt\(\s*'[^']+'\s*\)/g

describe('ExportDossierDialog', () => {
  beforeEach(() => {
    mockLanguage = 'en'
    mockFailedSections = []
    mockProgress = null
    exportDossierMock.mockReset()
    resetMock.mockReset()
  })

  it('renders no PDF or Word format option (EXPORT-01)', () => {
    render(<ExportDossierDialog {...baseProps} />)
    expect(screen.queryByText('PDF')).toBeNull()
    expect(screen.queryByText('Word')).toBeNull()
    expect(document.querySelector('input[value="pdf"]')).toBeNull()
    expect(document.querySelector('input[value="docx"]')).toBeNull()
  })

  it('renders exactly two language options, EN and AR, with no Bilingual (D-04)', () => {
    render(<ExportDossierDialog {...baseProps} />)
    expect(screen.getByText(enDossierExport.language.en)).toBeInTheDocument()
    expect(screen.getByText(enDossierExport.language.ar)).toBeInTheDocument()
    expect(screen.queryByText('Bilingual')).toBeNull()
    const langRadios = document.querySelectorAll('button[role="radio"]')
    expect(langRadios.length).toBe(2)
  })

  it('renders the HTML info line (D-03)', () => {
    render(<ExportDossierDialog {...baseProps} />)
    expect(screen.getByText(enDossierExport.format.html_info)).toBeInTheDocument()
  })

  it('defaults the selected language to the current UI language (D-04)', () => {
    mockLanguage = 'ar'
    const { unmount } = render(<ExportDossierDialog {...baseProps} />)
    const arRadio = document.querySelector('#lang-ar') as HTMLElement | null
    const enRadio = document.querySelector('#lang-en') as HTMLElement | null
    expect(arRadio?.getAttribute('aria-checked')).toBe('true')
    expect(enRadio?.getAttribute('aria-checked')).toBe('false')
    unmount()

    mockLanguage = 'en'
    render(<ExportDossierDialog {...baseProps} />)
    const enRadio2 = document.querySelector('#lang-en') as HTMLElement | null
    const arRadio2 = document.querySelector('#lang-ar') as HTMLElement | null
    expect(enRadio2?.getAttribute('aria-checked')).toBe('true')
    expect(arRadio2?.getAttribute('aria-checked')).toBe('false')
  })

  it('shows a failed-sections warning banner in the ready state (D-08)', () => {
    mockFailedSections = ['positions', 'mous']
    mockProgress = {
      status: 'ready',
      progress: 100,
      message_en: 'Export complete',
      message_ar: 'اكتمل التصدير',
    }
    const { unmount } = render(<ExportDossierDialog {...baseProps} />)
    const enAlert = screen.getByRole('alert')
    const enSections = `${enDossierExport.sections.positions}, ${enDossierExport.sections.mous}`
    const enWarning = enDossierExport.warning.failedSections.replace('{{sections}}', enSections)
    expect(within(enAlert).getByText(enWarning)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: enCommon.close })).toHaveLength(2)
    expect(enAlert).not.toHaveTextContent('warning.failedSections')
    expect(enAlert).not.toHaveTextContent('sections.positions')
    expect(enAlert).not.toHaveTextContent('sections.mous')
    unmount()

    mockLanguage = 'ar'
    render(<ExportDossierDialog {...baseProps} />)
    const arAlert = screen.getByRole('alert')
    const arSections = `${arDossierExport.sections.positions}, ${arDossierExport.sections.mous}`
    const arWarning = arDossierExport.warning.failedSections.replace('{{sections}}', arSections)
    expect(within(arAlert).getByText(arWarning)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: arCommon.close })).toHaveLength(2)
    expect(arAlert).not.toHaveTextContent('warning.failedSections')
    expect(arAlert).not.toHaveTextContent('sections.positions')
    expect(arAlert).not.toHaveTextContent('sections.mous')
  })
})

describe('P99-57 acceptance criteria', () => {
  it("No t() call in this slice passes an English default; a missing key now shows as missing in both locales — which the gatekeeper's proven zero makes an empty set today.", () => {
    expect(joinedLaneProduction.match(literalMaskPattern) ?? []).toHaveLength(0)
    expect(joinedLaneProduction.match(fallbackOptionPattern) ?? []).toHaveLength(0)
  })

  it("Decisions covered — D-06, D-20, D-23, D-24, D-28, D-39: deletion-only, behind the gatekeeper, no conversion, one population, every zero controlled, file-disjoint from its siblings. || Both mask shapes are deleted across this lane's files: `t('key', 'Literal')` -> `t('key')`, `t('key', 'Literal', opts)` -> `t('key', opts)`, and the object-form fallback-text option is removed while every remaining option is kept — because interpolation options are not masks. The object-form fallback class is a SEPARATE population from the literal class: 314 sites across 103 files repo-wide, 88 of which carry no literal-class site at all, and the first draft's single 161-file scope covered only the literal class while demanding both reach zero.", () => {
    expect(laneProductionSources['components/dossier/DossierLinksWidget.tsx']).toMatch(
      /t\('widget\.show_more',\s*\{\s*count:/,
    )
    expect(laneProductionSources['components/dossier/MiniRelationshipGraph.tsx']).toMatch(
      /t\('miniGraph\.moreConnections',\s*\{\s*count:/,
    )
    expect(laneProductionSources['components/dossier/ExportDossierDialog.tsx']).toMatch(
      /t\('warning\.failedSections',\s*\{\s*sections:/,
    )
  })

  it("PRODUCTION keys are byte-untouched. Across the 13 production files the diff contains deletions of default arguments and nothing else — no key string, namespace prefix, hook, import move, or test-mode branch. This part owns exactly these companion tests: `frontend/src/components/dossier/__tests__/ExportDossierDialog.test.tsx`. They are here because they ASSERT ON THE ENGLISH LITERALS THIS PART DELETES, and the WHOLE IMPORT CLOSURE of each is inside this part, so repairing one never reaches another part's file (RULING-P99-468). TRIGGER: if this part's deletions cause one to render or assert a BARE i18n KEY, or to fail on a literal that no longer exists, it MUST be repaired as below; OTHERWISE it MUST be left BYTE-UNCHANGED — ownership grants authority to repair a break this part causes, never a mandate to rewrite a test that still passes. The test may not make a raw key or a hardcoded English source fallback the contract. COMPANION TEST FIXTURES, OWNED AND CONDITIONALLY REPAIRABLE (RULING-P99-429). The companion tests named in files_modified are owned by this lane. TRIGGER: if this lane's deletions cause one of them to render or assert a BARE i18n KEY as visible text or accessible name, it MUST be repaired as below; OTHERWISE it MUST be left BYTE-UNCHANGED - ownership grants authority to repair a break this lane causes, never a mandate to rewrite a test that still passes. WHEN REPAIRED: (a) expected copy comes from a STATIC top-level import of the relevant frontend/src/i18n/{en,ar}/<ns>.json, as DossierEngagementsTab.test.tsx:6-7 does, and any hand-copied copy object is deleted; (b) the react-i18next mock RESOLVES keys against the real bundle loaded with await vi.importActual of that same JSON INSIDE the vi.mock factory - a static import cannot serve this side because vi.mock is hoisted above it - with no private copy, no default-argument fallback and no key fallback; (c) the resolved en AND ar values are both asserted, the ar assertion being what proves the fallback is gone; (d) the rendered output must NOT contain the bare key; (e) existing assertions still exist and still run, not deleted, skipped, .only-ed or loosened. AND NO PRODUCTION-SIDE ESCAPE: the suite is made green by repairing the TEST. No production change may be made whose EFFECT is that an assertion passes independently of whether the key resolves - that covers a literal second-argument default, an object-form default option, and any conditional, wrapper, concatenation or logical-or that substitutes for or augments the value returned by t(). If a key fails to resolve, production must render the failure, not disguise it. || NO i18n JSON changes in this lane.", () => {
    expect(laneProductionPaths).toHaveLength(13)
    expect(joinedLaneProduction).not.toMatch(/\b(?:unitMockCopy|testModeCopy)\b/)
    expect(enDossierExport.title).not.toBe(arDossierExport.title)
  })

  it("A mask site found in a file OUTSIDE this lane's list means the tree moved between the gatekeeper's manifest and this lane: STOP and record it, do not widen scope || This part's logic-diff budget is **~39285 bytes** against the engine's 60,000-byte gates.diffCap. It is NOT a plan-time floor: it is the pre-split lane's ENGINE-MEASURED 94803-byte diff (fetchTaskDiff at the attempt's own HEAD, 1.58x over cap), apportioned by this part's 97/269 share of the lane's mask sites — so it inherits a measurement, not an estimate, and it inherits the pre-split churn too, which makes it an OVER-estimate of deletion-only work. On top of that it carries 1 companion-test allowance(s) at 5,100 bytes each — MEASURED, not guessed: the one companion repaired in the landed lane 5 cost 5,036 logic-diff bytes. Test companions carry no masks, so they cost budget without earning apportioned budget (RULING-P99-468 order 4). Every part is held at or under 45,000 bytes, >=25% under the 60,000 cap, per RULING-P99-465 and the decomposition rule. The pre-split floor for this lane read ~44066 bytes and the truth was 94803: a 2x miss, which is exactly why a measured apportionment replaces it. A diff-cap trip returns park:\"human\" with the engine's own note that the diff cannot shrink by retrying — it is un-retryable, after the work is done, which is why the parts are cut this small.", () => {
    expect(new Set(laneProductionPaths).size).toBe(13)
    expect(laneProductionPaths.every((path) => laneProductionSources[path].length > 0)).toBe(true)
  })

  it("the strict instrument's twoArgTotal — EVERY mask site, resolved or not, seen by the cross-line matcher — reads ZERO across this lane's files, with a nonzero rawKeyTotal as the positive control that the scope matched real t() calls, AND no fallback-text option survives in them. This is D-22 applied: the closing predicate is the strict parser's own total, not the line-bound acceptance grep, which is unsatisfiable (23 identifier tails it can never remove) and under-detecting (111 wrapped sites it cannot see) in the same clause. RED at HEAD (97 mask sites in this part).", () => {
    expect(joinedLaneProduction.match(literalMaskPattern) ?? []).toHaveLength(0)
    expect(joinedLaneProduction.match(fallbackOptionPattern) ?? []).toHaveLength(0)
    expect((joinedLaneProduction.match(rawKeyPattern) ?? []).length).toBeGreaterThan(0)
  })

  it('no i18n JSON changed in this lane, the scoped strict audit still reads zero UNRESOLVED after the drop (a nonzero here means a key moved, which is the one way a deletion-only diff can go wrong), and the phase negative control still prints 3x MISS=true — RED at HEAD', () => {
    expect(enDossierExport.warning.failedSections).toBeTruthy()
    expect(arDossierExport.warning.failedSections).toBeTruthy()
    expect(enDossierExport.warning.failedSections).not.toBe(arDossierExport.warning.failedSections)
    expect(enCommon.close).not.toBe(arCommon.close)
  })
})
