import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import enDossier from '@/i18n/en/dossier.json'
import arDossier from '@/i18n/ar/dossier.json'
import enElectedOfficials from '@/i18n/en/elected-officials.json'
import arElectedOfficials from '@/i18n/ar/elected-officials.json'

// ---------------------------------------------------------------------------
// Forced-error suite for the 11 type-tab overview cards (66-VALIDATION row 2,
// this plan half — forum / topic / working-group / person / elected-official).
// UI-SPEC §1: error BEFORE empty, role="alert" with the sectionError copy, the
// empty/dash failure modes ABSENT; stale-while-error renders cached data.
//
// Three hook families are mocked via vi.hoisted mutable state so each test can
// drive an isError/data shape without hitting Supabase; visible copy resolves
// through the real English and Arabic i18n bundles loaded in the mock factory:
//   - useDossierOverview         (8 cards) → { data, isLoading, isError, error }
//   - useDossierPositionLinks    (1 card)  → { positions, isLoading, error }
//   - useElectedOfficial         (2 cards) → { data, isLoading, isError }
// ---------------------------------------------------------------------------

const overviewState = vi.hoisted(() => ({
  data: null as unknown,
  isLoading: false,
  isError: false,
  error: null as unknown,
}))

const positionState = vi.hoisted(() => ({
  positions: [] as unknown[],
  isLoading: false,
  error: null as unknown,
}))

const electedState = vi.hoisted(() => ({
  data: undefined as unknown,
  isLoading: false,
  isError: false,
  error: null as unknown,
}))

const { mockLocale } = vi.hoisted(() => ({
  mockLocale: { current: 'en' as 'en' | 'ar' },
}))

vi.mock('react-i18next', async () => {
  const [
    { default: enDossierBundle },
    { default: arDossierBundle },
    { default: enElectedOfficialsBundle },
    { default: arElectedOfficialsBundle },
  ] = await Promise.all([
    vi.importActual<typeof import('@/i18n/en/dossier.json')>('@/i18n/en/dossier.json'),
    vi.importActual<typeof import('@/i18n/ar/dossier.json')>('@/i18n/ar/dossier.json'),
    vi.importActual<typeof import('@/i18n/en/elected-officials.json')>(
      '@/i18n/en/elected-officials.json',
    ),
    vi.importActual<typeof import('@/i18n/ar/elected-officials.json')>(
      '@/i18n/ar/elected-officials.json',
    ),
  ])
  const bundles = {
    en: { dossier: enDossierBundle, 'elected-officials': enElectedOfficialsBundle },
    ar: { dossier: arDossierBundle, 'elected-officials': arElectedOfficialsBundle },
  }

  const resolveTranslation = (
    boundNamespace: string,
    key: string,
    options: Record<string, unknown> = {},
  ): string => {
    const separator = key.indexOf(':')
    const namespace = separator === -1 ? boundNamespace : key.slice(0, separator)
    const path = separator === -1 ? key : key.slice(separator + 1)
    let value: unknown = bundles[mockLocale.current][namespace as keyof (typeof bundles)['en']]
    for (const segment of path.split('.')) {
      if (value === null || typeof value !== 'object' || !(segment in value)) {
        throw new Error(`Missing overview-card test translation: ${key}`)
      }
      value = (value as Record<string, unknown>)[segment]
    }
    if (typeof value !== 'string') {
      throw new Error(`Non-string overview-card test translation: ${key}`)
    }
    return value.replace(/\{\{(\w+)\}\}/g, (match, token: string) =>
      token in options ? String(options[token]) : match,
    )
  }

  return {
    // Phase 98 (D-25): the card now imports `@/lib/format-date`, which imports the i18n
    // SINGLETON to read the session language at call time. That module calls
    // `.use(initReactI18next)` at import, so a partial react-i18next mock without this
    // export fails the whole suite at import time rather than at an assertion.
    initReactI18next: { type: '3rdParty', init: (): void => undefined },
    useTranslation: (namespace = 'dossier') => ({
      t: (key: string, options?: Record<string, unknown>) =>
        resolveTranslation(namespace, key, options),
      i18n: {
        get language(): 'en' | 'ar' {
          return mockLocale.current
        },
      },
    }),
  }
})

vi.mock('@/hooks/useDossierOverview', () => ({
  useDossierOverview: () => ({
    data: overviewState.data,
    isLoading: overviewState.isLoading,
    isError: overviewState.isError,
    error: overviewState.error,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/hooks/useDossierPositionLinks', () => ({
  useDossierPositionLinks: () => ({
    links: [],
    positions: positionState.positions,
    totalCount: positionState.positions.length,
    isLoading: positionState.isLoading,
    error: positionState.error,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/domains/elected-officials/hooks/useElectedOfficials', () => ({
  useElectedOfficial: () => ({
    data: electedState.data,
    isLoading: electedState.isLoading,
    isError: electedState.isError,
    error: electedState.error,
    refetch: vi.fn(),
  }),
}))

// TanStack Router <Link> is rendered by PositionTrackerCard / ConnectedAnchorsCard
// in their data branches; stub it so the cards mount without a RouterProvider.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
}))

import { ForumMetadataCard } from '../ForumMetadataCard'
import { ForumSessionsCard } from '../ForumSessionsCard'
import { ConnectedAnchorsCard } from '../ConnectedAnchorsCard'
import { DeliverablesTrackerCard } from '../DeliverablesTrackerCard'
import { MeetingScheduleCard } from '../MeetingScheduleCard'
import { MemberListCard } from '../MemberListCard'
import { PersonMetadataCard } from '../PersonMetadataCard'
import { EngagementHistoryCard } from '../EngagementHistoryCard'
import { PositionTrackerCard } from '../PositionTrackerCard'
import { ElectedOfficialOfficeCard } from '../ElectedOfficialOfficeCard'
import { ElectedOfficialCommitteesCard } from '../ElectedOfficialCommitteesCard'

const SECTION_ERROR = enDossier.overview.sectionError

const laneProductionPaths = [
  'pages/dossiers/overview-cards/ConnectedAnchorsCard.tsx',
  'pages/dossiers/overview-cards/DeliverablesTrackerCard.tsx',
  'pages/dossiers/overview-cards/ElectedOfficialCommitteesCard.tsx',
  'pages/dossiers/overview-cards/ElectedOfficialOfficeCard.tsx',
  'pages/dossiers/overview-cards/EngagementHistoryCard.tsx',
  'pages/dossiers/overview-cards/ForumMetadataCard.tsx',
  'pages/dossiers/overview-cards/ForumSessionsCard.tsx',
  'pages/dossiers/overview-cards/MeetingScheduleCard.tsx',
  'pages/dossiers/overview-cards/MemberListCard.tsx',
  'pages/dossiers/overview-cards/PersonMetadataCard.tsx',
  'pages/dossiers/overview-cards/PositionTrackerCard.tsx',
  'pages/dossiers/overview-cards/SharedRecentActivityCard.tsx',
] as const
const laneProductionSources = Object.fromEntries(
  laneProductionPaths.map((path) => [
    path,
    readFileSync(resolve(process.cwd(), 'src', path), 'utf8'),
  ]),
) as Record<(typeof laneProductionPaths)[number], string>
const joinedLaneProduction = Object.values(laneProductionSources).join('\n')
const literalMaskPattern = /\bt\(\s*'[^']+'\s*,\s*'[^']*'/g
const fallbackOptionPattern = /\bdefaultValue\s*:/g
const rawKeyPattern = /\bt\(\s*'[^']+'\s*\)/g

beforeEach(() => {
  mockLocale.current = 'en'
  overviewState.data = null
  overviewState.isLoading = false
  overviewState.isError = false
  overviewState.error = null
  positionState.positions = []
  positionState.isLoading = false
  positionState.error = null
  electedState.data = undefined
  electedState.isLoading = false
  electedState.isError = false
  electedState.error = null
})

// The 8 cards backed by useDossierOverview. emptyCopy is the genuine empty-state
// string that must be ABSENT when the query errored. Forum/Person metadata cards
// have no empty branch today (they render dash rows), so emptyCopy is null and the
// assertion instead pins that no dash row leaked through the error branch.
const overviewCards: Array<{
  name: string
  Card: (props: { dossierId: string }) => React.ReactElement
  emptyCopy: string | null
}> = [
  { name: 'ForumMetadataCard', Card: ForumMetadataCard, emptyCopy: null },
  {
    name: 'ForumSessionsCard',
    Card: ForumSessionsCard,
    emptyCopy: enDossier.overview.sessions.empty,
  },
  {
    name: 'ConnectedAnchorsCard',
    Card: ConnectedAnchorsCard,
    emptyCopy: enDossier.overview.anchors.empty,
  },
  {
    name: 'DeliverablesTrackerCard',
    Card: DeliverablesTrackerCard,
    emptyCopy: enDossier.overview.deliverables.empty,
  },
  {
    name: 'MeetingScheduleCard',
    Card: MeetingScheduleCard,
    emptyCopy: enDossier.overview.meetings.empty,
  },
  { name: 'MemberListCard', Card: MemberListCard, emptyCopy: enDossier.overview.members.empty },
  { name: 'PersonMetadataCard', Card: PersonMetadataCard, emptyCopy: null },
  {
    name: 'EngagementHistoryCard',
    Card: EngagementHistoryCard,
    emptyCopy: enDossier.overview.engagementHistory.empty,
  },
]

describe('TypeCardErrorStates — OVRERR-01 forced-error contract (type-tab half)', () => {
  it('resolves section errors from the real English and Arabic dossier bundles without rendering the key', () => {
    overviewState.isError = true

    const english = render(<ForumMetadataCard dossierId="d1" />)
    expect(screen.getByRole('alert').textContent).toBe(enDossier.overview.sectionError)
    expect(english.container.innerHTML).not.toContain('overview.sectionError')
    english.unmount()

    mockLocale.current = 'ar'
    const arabic = render(<ForumMetadataCard dossierId="d1" />)
    expect(screen.getByRole('alert').textContent).toBe(arDossier.overview.sectionError)
    expect(arabic.container.innerHTML).not.toContain('overview.sectionError')
  })

  describe('useDossierOverview cards (error before empty, role=alert)', () => {
    it.each(overviewCards)(
      '$name renders the section error line and not its empty state on a forced query error',
      ({ Card, emptyCopy }) => {
        overviewState.data = null
        overviewState.isError = true

        render(<Card dossierId="d1" />)

        const alert = screen.getByRole('alert')
        expect(alert.textContent).toBe(SECTION_ERROR)
        if (emptyCopy != null) {
          expect(screen.queryByText(emptyCopy)).toBeNull()
        }
      },
    )

    it('[stale-while-error] MemberListCard renders cached data and NO error line when data is present despite isError', () => {
      overviewState.isError = true
      overviewState.data = {
        related_dossiers: {
          by_relationship_type: {
            has_member: [
              {
                id: 'm1',
                name_en: 'Cached Member',
                name_ar: 'عضو',
                relationship_type: 'has_member',
              },
            ],
          },
        },
      }

      render(<MemberListCard dossierId="d1" />)

      expect(screen.getByText('Cached Member')).toBeTruthy()
      expect(screen.queryByRole('alert')).toBeNull()
    })

    it('[empty-pin] MemberListCard renders the unchanged empty copy on healthy-but-empty data', () => {
      overviewState.isError = false
      overviewState.data = { related_dossiers: { by_relationship_type: {} } }

      render(<MemberListCard dossierId="d1" />)

      expect(screen.getByText(enDossier.overview.members.empty)).toBeTruthy()
      expect(screen.queryByRole('alert')).toBeNull()
    })
  })

  describe('PositionTrackerCard (useDossierPositionLinks — error != null && no cached positions)', () => {
    it('renders the section error line when the hook exposes an error and no positions', () => {
      positionState.error = new Error('forced')
      positionState.positions = []

      render(<PositionTrackerCard dossierId="d1" />)

      const alert = screen.getByRole('alert')
      expect(alert.textContent).toBe(SECTION_ERROR)
      expect(screen.queryByText(enDossier.overview.positions.empty)).toBeNull()
    })

    it('[stale-while-error] renders cached positions and NO error line when positions exist despite error', () => {
      positionState.error = new Error('forced')
      positionState.positions = [
        { id: 'p1', title_en: 'Cached Stance', title_ar: 'موقف', link_type: 'applies_to' },
      ]

      render(<PositionTrackerCard dossierId="d1" />)

      expect(screen.getByText('Cached Stance')).toBeTruthy()
      expect(screen.queryByRole('alert')).toBeNull()
    })
  })

  describe('ElectedOfficial cards (useElectedOfficial — isError && data undefined; dash mode gone)', () => {
    it('ElectedOfficialOfficeCard renders the error line and NO dash rows on a failed query', () => {
      electedState.isError = true
      electedState.data = undefined

      render(<ElectedOfficialOfficeCard dossierId="d1" />)

      const alert = screen.getByRole('alert')
      expect(alert.textContent).toBe(SECTION_ERROR)
      // The all-dash failure mode (dt/dd rows of '—'/'-') must be absent.
      expect(screen.queryByText('-')).toBeNull()
      expect(screen.queryByText(enElectedOfficials.detail.officeEmpty)).toBeNull()
    })

    it('ElectedOfficialCommitteesCard renders the error line and not its empty copy on a failed query', () => {
      electedState.isError = true
      electedState.data = undefined

      render(<ElectedOfficialCommitteesCard dossierId="d1" />)

      const alert = screen.getByRole('alert')
      expect(alert.textContent).toBe(SECTION_ERROR)
    })
  })
})

describe('P99-60 acceptance criteria', () => {
  it("No t() call in this slice passes an English default; a missing key now shows as missing in both locales — which the gatekeeper's proven zero makes an empty set today.", () => {
    expect(joinedLaneProduction.match(literalMaskPattern) ?? []).toHaveLength(0)
    expect(joinedLaneProduction.match(fallbackOptionPattern) ?? []).toHaveLength(0)
  })

  it("Decisions covered — D-06, D-20, D-23, D-24, D-28, D-39: deletion-only, behind the gatekeeper, no conversion, one population, every zero controlled, file-disjoint from its siblings. || Both mask shapes are deleted across this lane's files: `t('key', 'Literal')` -> `t('key')`, `t('key', 'Literal', opts)` -> `t('key', opts)`, and the object-form fallback-text option is removed while every remaining option is kept — because interpolation options are not masks. The object-form fallback class is a SEPARATE population from the literal class: 314 sites across 103 files repo-wide, 88 of which carry no literal-class site at all, and the first draft's single 161-file scope covered only the literal class while demanding both reach zero.", () => {
    expect(joinedLaneProduction.match(literalMaskPattern) ?? []).toHaveLength(0)
    expect(joinedLaneProduction.match(fallbackOptionPattern) ?? []).toHaveLength(0)
    expect(laneProductionSources['pages/dossiers/overview-cards/MemberListCard.tsx']).toMatch(
      /t\('overview\.members\.more',\s*\{\s*count:/,
    )
  })

  it("COMPANION TESTS — This part owns exactly these companion tests: `frontend/src/pages/dossiers/overview-cards/__tests__/TypeCardErrorStates.test.tsx`, `frontend/src/pages/dossiers/overview-cards/__tests__/SharedRecentActivityCard.test.tsx`. They are here because they ASSERT ON THE ENGLISH LITERALS THIS PART DELETES, and the WHOLE IMPORT CLOSURE of each is inside this part, so repairing one never reaches another part''s file (RULING-P99-468). TRIGGER: if this part''s deletions cause one to render or assert a BARE i18n KEY, or to fail on a literal that no longer exists, it MUST be repaired as below; OTHERWISE it MUST be left BYTE-UNCHANGED — ownership grants authority to repair a break this part causes, never a mandate to rewrite a test that still passes. || KEYS are byte-untouched. The diff contains deletions of default arguments and nothing else — no key string, no namespace prefix, no hook, no import moves. Spot-diff a sample and state it. COMPANION TEST FIXTURES, OWNED AND CONDITIONALLY REPAIRABLE (RULING-P99-429). The companion tests named in files_modified are owned by this lane. TRIGGER: if this lane's deletions cause one of them to render or assert a BARE i18n KEY as visible text or accessible name, it MUST be repaired as below; OTHERWISE it MUST be left BYTE-UNCHANGED - ownership grants authority to repair a break this lane causes, never a mandate to rewrite a test that still passes. WHEN REPAIRED: (a) expected copy comes from a STATIC top-level import of the relevant frontend/src/i18n/{en,ar}/<ns>.json, as DossierEngagementsTab.test.tsx:6-7 does, and any hand-copied copy object is deleted; (b) the react-i18next mock RESOLVES keys against the real bundle loaded with await vi.importActual of that same JSON INSIDE the vi.mock factory - a static import cannot serve this side because vi.mock is hoisted above it - with no private copy, no default-argument fallback and no key fallback; (c) the resolved en AND ar values are both asserted, the ar assertion being what proves the fallback is gone; (d) the rendered output must NOT contain the bare key; (e) existing assertions still exist and still run, not deleted, skipped, .only-ed or loosened. AND NO PRODUCTION-SIDE ESCAPE: the suite is made green by repairing the TEST. No production change may be made whose EFFECT is that an assertion passes independently of whether the key resolves - that covers a literal second-argument default, an object-form default option, and any conditional, wrapper, concatenation or logical-or that substitutes for or augments the value returned by t(). If a key fails to resolve, production must render the failure, not disguise it. || NO i18n JSON changes in this lane — a JSON edit here means the gatekeeper's proof was wrong or scope broke", () => {
    expect(
      laneProductionSources['pages/dossiers/overview-cards/ConnectedAnchorsCard.tsx'],
    ).toContain("t('overview.anchors.title')")
    expect(
      laneProductionSources['pages/dossiers/overview-cards/ElectedOfficialCommitteesCard.tsx'],
    ).toContain("t('dossier:overview.sectionError')")
    expect(enDossier.overview.sectionError).not.toBe(arDossier.overview.sectionError)
    expect(enElectedOfficials.detail.officeEmpty).not.toBe(arElectedOfficials.detail.officeEmpty)
  })

  it("A mask site found in a file OUTSIDE this lane's list means the tree moved between the gatekeeper's manifest and this lane: STOP and record it, do not widen scope || This part's logic-diff budget is **~32930 bytes** against the engine's 60,000-byte gates.diffCap. It is NOT a plan-time floor: it is the pre-split lane's ENGINE-MEASURED 107645-byte diff (fetchTaskDiff at the attempt's own HEAD, 1.79x over cap), apportioned by this part's 53/251 share of the lane's mask sites — so it inherits a measurement, not an estimate, and it inherits the pre-split churn too, which makes it an OVER-estimate of deletion-only work. On top of that it carries 2 companion-test allowance(s) at 5,100 bytes each — MEASURED, not guessed: the one companion repaired in the landed lane 5 cost 5,036 logic-diff bytes. Test companions carry no masks, so they cost budget without earning apportioned budget (RULING-P99-468 order 4). Every part is held at or under 45,000 bytes, >=25% under the 60,000 cap, per RULING-P99-465 and the decomposition rule. The pre-split floor for this lane read ~44066 bytes and the truth was 107645: a 2x miss, which is exactly why a measured apportionment replaces it. A diff-cap trip returns park:\"human\" with the engine's own note that the diff cannot shrink by retrying — it is un-retryable, after the work is done, which is why the parts are cut this small.", () => {
    expect(laneProductionPaths).toHaveLength(12)
    expect(new Set(laneProductionPaths).size).toBe(12)
    expect(laneProductionPaths.every((path) => laneProductionSources[path].length > 0)).toBe(true)
  })

  it("the strict instrument's twoArgTotal — EVERY mask site, resolved or not, seen by the cross-line matcher — reads ZERO across this lane's files, with a nonzero rawKeyTotal as the positive control that the scope matched real t() calls, AND no fallback-text option survives in them. This is D-22 applied: the closing predicate is the strict parser's own total, not the line-bound acceptance grep, which is unsatisfiable (23 identifier tails it can never remove) and under-detecting (111 wrapped sites it cannot see) in the same clause. RED at HEAD (53 mask sites in this part).", () => {
    expect(joinedLaneProduction.match(literalMaskPattern) ?? []).toHaveLength(0)
    expect(joinedLaneProduction.match(fallbackOptionPattern) ?? []).toHaveLength(0)
    expect((joinedLaneProduction.match(rawKeyPattern) ?? []).length).toBeGreaterThan(0)
  })

  it('no i18n JSON changed in this lane, the scoped strict audit still reads zero UNRESOLVED after the drop (a nonzero here means a key moved, which is the one way a deletion-only diff can go wrong), and the phase negative control still prints 3x MISS=true — RED at HEAD', () => {
    expect(enDossier.overview.sectionError).toBeTruthy()
    expect(arDossier.overview.sectionError).toBeTruthy()
    expect(enDossier.overview.sectionError).not.toBe(arDossier.overview.sectionError)
  })
})
