import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AnchorHTMLAttributes, ReactElement, ReactNode } from 'react'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { DossierOverviewResponse } from '@/types/dossier-overview.types'
import enDossierShell from '@/i18n/en/dossier-shell.json'
import arDossierShell from '@/i18n/ar/dossier-shell.json'
import enDossier from '@/i18n/en/dossier.json'
import arDossier from '@/i18n/ar/dossier.json'
import enDossierOverview from '@/i18n/en/dossier-overview.json'
import arDossierOverview from '@/i18n/ar/dossier-overview.json'
import enEngagements from '@/i18n/en/engagements.json'
import arEngagements from '@/i18n/ar/engagements.json'

let mockLanguage = 'en'

vi.mock('react-i18next', async () => {
  const { default: enDossierShellBundle } = await vi.importActual<
    typeof import('@/i18n/en/dossier-shell.json')
  >('@/i18n/en/dossier-shell.json')
  const { default: arDossierShellBundle } = await vi.importActual<
    typeof import('@/i18n/ar/dossier-shell.json')
  >('@/i18n/ar/dossier-shell.json')
  const { default: enDossierBundle } =
    await vi.importActual<typeof import('@/i18n/en/dossier.json')>('@/i18n/en/dossier.json')
  const { default: arDossierBundle } =
    await vi.importActual<typeof import('@/i18n/ar/dossier.json')>('@/i18n/ar/dossier.json')
  const { default: enDossierOverviewBundle } = await vi.importActual<
    typeof import('@/i18n/en/dossier-overview.json')
  >('@/i18n/en/dossier-overview.json')
  const { default: arDossierOverviewBundle } = await vi.importActual<
    typeof import('@/i18n/ar/dossier-overview.json')
  >('@/i18n/ar/dossier-overview.json')
  const { default: enEngagementsBundle } = await vi.importActual<
    typeof import('@/i18n/en/engagements.json')
  >('@/i18n/en/engagements.json')
  const { default: arEngagementsBundle } = await vi.importActual<
    typeof import('@/i18n/ar/engagements.json')
  >('@/i18n/ar/engagements.json')
  const bundles = {
    en: {
      'dossier-shell': enDossierShellBundle,
      dossier: enDossierBundle,
      'dossier-overview': enDossierOverviewBundle,
      engagements: enEngagementsBundle,
    },
    ar: {
      'dossier-shell': arDossierShellBundle,
      dossier: arDossierBundle,
      'dossier-overview': arDossierOverviewBundle,
      engagements: arEngagementsBundle,
    },
  }

  const resolveTranslation = (boundNamespace: string, key: string): string => {
    const separator = key.indexOf(':')
    const namespace = separator === -1 ? boundNamespace : key.slice(0, separator)
    const path = separator === -1 ? key : key.slice(separator + 1)
    const localeBundles = bundles[mockLanguage === 'ar' ? 'ar' : 'en']
    let value: unknown = localeBundles[namespace as keyof typeof localeBundles]
    for (const segment of path.split('.')) {
      if (value === null || typeof value !== 'object' || !(segment in value)) {
        throw new Error(`Missing DossierEngagementsTab translation: ${key}`)
      }
      value = (value as Record<string, unknown>)[segment]
    }
    if (typeof value !== 'string') {
      throw new Error(`Non-string DossierEngagementsTab translation: ${key}`)
    }
    return value
  }

  return {
    useTranslation: (namespace?: string) => ({
      t: (key: string) => resolveTranslation(namespace ?? 'dossier-shell', key),
      i18n: { language: mockLanguage },
    }),
  }
})

// Map TanStack Router Link to a plain anchor so the tab renders without a
// RouterProvider (mirrors CreateDossierHub.test.tsx).
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...rest
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('@/services/dossier-overview.service', async () => {
  const actual = await vi.importActual<typeof import('@/services/dossier-overview.service')>(
    '@/services/dossier-overview.service',
  )
  return {
    ...actual,
    fetchDossierOverview: vi.fn(),
  }
})

// Per-table supabase mock: from(table) returns a self-returning chainable
// (select/eq/in) whose awaited terminal resolves the per-test configured
// { data, error } for that table. tableResults is reset in beforeEach.
const { tableResults, eqCalls } = vi.hoisted(() => ({
  tableResults: new Map<string, { data: unknown; error: unknown }>(),
  // Records every .eq(column, value) per table so tests can assert the
  // load-bearing filter column (a wrong-column regression, e.g. swapping
  // host_organization_id → host_country_id, would otherwise pass silently).
  eqCalls: new Map<string, Array<{ column: string; value: unknown }>>(),
}))

vi.mock('@/lib/supabase', () => {
  const makeChain = (table: string): Record<string, unknown> => {
    const result = tableResults.get(table) ?? { data: [], error: null }
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: (column: string, value: unknown) => {
        const calls = eqCalls.get(table) ?? []
        calls.push({ column, value })
        eqCalls.set(table, calls)
        return chain
      },
      in: () => chain,
      // Thenable terminal: awaiting the chain resolves the configured result.
      then: (resolve: (value: { data: unknown; error: unknown }) => unknown) => resolve(result),
    }
    return chain
  }
  return {
    supabase: {
      from: (table: string): Record<string, unknown> => makeChain(table),
    },
  }
})

import { fetchDossierOverview } from '@/services/dossier-overview.service'
import { DossierEngagementsTab } from '../DossierEngagementsTab'

const mockedFetch = vi.mocked(fetchDossierOverview)

// Cast a controlled partial through unknown so we only supply the sections the
// component reads, not every field of DossierOverviewResponse.
function makeResponse(partial: Record<string, unknown>): DossierOverviewResponse {
  return partial as unknown as DossierOverviewResponse
}

function setTable(table: string, data: unknown, error: unknown = null): void {
  tableResults.set(table, { data, error })
}

function renderWithClient(ui: ReactElement): ReturnType<typeof render> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const laneProductionPaths = [
  'components/analytics/DossierAnalyticsCard.tsx',
  'components/app-error-boundary/ErrorBoundary.tsx',
  'components/attachment-uploader/AttachmentUploader.tsx',
  'components/briefing-books/BriefingBookBuilder.tsx',
  'components/briefing-books/BriefingBooksList.tsx',
  'components/bulk-actions/BulkActionPreviewDialog.tsx',
  'components/bulk-actions/EnhancedUndoToast.tsx',
  'components/bulk-actions/SelectableDataTable.tsx',
  'components/commitments/CommitmentDetailDrawer.tsx',
  'components/commitments/StatusDropdown.tsx',
  'components/contacts/ContactForm.tsx',
  'components/copilot/CopilotMessageList.tsx',
  'components/copilot/ThreadList.tsx',
  'components/dossier/DossierContextBadge.tsx',
  'components/dossier/DossierSelector.tsx',
  'components/dossier/DossierShell.tsx',
  'components/dossier/DossierTypeGuide.tsx',
  'components/dossier/DossierTypeStatsCard.tsx',
  'components/dossier/tabs/DossierEngagementsTab.tsx',
  'components/dossier/wizard/StepGuidanceBanner.tsx',
  'components/dossier/wizard/edit/useEditDossierWizard.ts',
  'components/dossier/wizard/hooks/useCreateDossierWizard.ts',
] as const
const laneFrontendRoot = process.cwd().endsWith('/frontend')
  ? process.cwd()
  : resolve(process.cwd(), 'frontend')
const laneRepoRoot = resolve(laneFrontendRoot, '..')
const laneProductionSources = Object.fromEntries(
  laneProductionPaths.map((path) => [
    path,
    readFileSync(resolve(laneFrontendRoot, 'src', path), 'utf8'),
  ]),
) as Record<(typeof laneProductionPaths)[number], string>
const joinedLaneProduction = Object.values(laneProductionSources).join('\n')
const literalMaskPattern = /\bt\(\s*'[^']+'\s*,\s*'[^']+'/g
const fallbackOptionPattern = /\bdefaultValue(?:_[A-Za-z0-9]+)?\s*:/g
const rawKeyPattern = /\bt\(\s*'[^']+'\s*\)/g
const emptySentinelPattern = /\bt\(\s*`typeGuide\.\$\{type\}\.(?:whenToUse|notFor)`\s*,\s*''\s*\)/g
const localizedDynamicFallbackPattern =
  /\bt\(\s*`confirmation\.\$\{action\.id\.replace\(\/-\/g, ''\)\}\.title`\s*,\s*\{\s*defaultValue:\s*t\('confirmation\.title',\s*\{\s*action:\s*actionLabel\s*\}\),?\s*\}\s*\)/g
const productionWithoutLocalizedDynamicFallback = joinedLaneProduction.replace(
  localizedDynamicFallbackPattern,
  '',
)

describe('DossierEngagementsTab', () => {
  beforeEach(() => {
    mockLanguage = 'en'
    mockedFetch.mockReset()
    tableResults.clear()
    eqCalls.clear()
    // Generic branch resolves empty unless a test overrides it.
    mockedFetch.mockResolvedValue(
      makeResponse({
        related_dossiers: { by_dossier_type: { engagement: [] } },
        calendar_events: { past: [] },
      }),
    )
  })

  it('lists related engagement dossiers and past calendar events', async () => {
    mockedFetch.mockResolvedValue(
      makeResponse({
        related_dossiers: {
          by_dossier_type: {
            engagement: [
              {
                id: 'e1',
                name_en: 'Bilateral Summit',
                name_ar: 'قمة ثنائية',
                type: 'engagement',
                relationship_type: 'related_to',
                created_at: '2026-03-01T00:00:00Z',
              },
            ],
          },
        },
        calendar_events: {
          past: [
            {
              id: 'c1',
              title_en: 'Past Consultation',
              title_ar: 'مشاورة سابقة',
              event_type: 'meeting',
              start_datetime: '2026-02-01T00:00:00Z',
            },
          ],
        },
      }),
    )

    renderWithClient(<DossierEngagementsTab dossierId="d1" />)

    expect(await screen.findByText('Bilateral Summit')).toBeTruthy()
    expect(await screen.findByText('Past Consultation')).toBeTruthy()
  })

  it('renders the empty state when both lists are absent', async () => {
    mockedFetch.mockResolvedValue(
      makeResponse({
        related_dossiers: { by_dossier_type: { engagement: [] } },
        calendar_events: { past: [] },
      }),
    )

    renderWithClient(<DossierEngagementsTab dossierId="d1" />)

    expect(await screen.findByText(enDossierShell.empty.engagements.title)).toBeTruthy()
  })

  it('renders the hosted engagements section for an organization dossier', async () => {
    setTable('engagement_dossiers', [
      { id: 'e1', engagement_type: 'bilateral_meeting', start_date: '2026-05-01' },
    ])
    setTable('dossiers', [
      { id: 'e1', name_en: 'OECD Summit', name_ar: 'قمة', created_at: '2026-04-01T00:00:00Z' },
    ])

    renderWithClient(<DossierEngagementsTab dossierId="org1" dossierType="organization" />)

    expect(await screen.findByText(enDossierShell.sections.hostedEngagements)).toBeTruthy()
    expect(await screen.findByText('OECD Summit')).toBeTruthy()
    expect(await screen.findByText(enEngagements.types.bilateral_meeting)).toBeTruthy()
    // The hosted branch MUST filter engagement_dossiers on host_organization_id
    // (not host_country_id or any other real column) keyed on the org dossier id.
    expect(eqCalls.get('engagement_dossiers')).toContainEqual({
      column: 'host_organization_id',
      value: 'org1',
    })
  })

  it('renders the participation section for a person dossier', async () => {
    setTable('engagement_participants', [{ engagement_id: 'e1', role: 'delegate' }])
    setTable('engagement_dossiers', [
      { id: 'e1', engagement_type: 'summit', start_date: '2026-05-01' },
    ])
    setTable('dossiers', [
      { id: 'e1', name_en: 'G20 Meeting', name_ar: 'اجتماع', created_at: '2026-04-01T00:00:00Z' },
    ])

    renderWithClient(<DossierEngagementsTab dossierId="p1" dossierType="person" />)

    expect(await screen.findByText(enDossierShell.sections.participation)).toBeTruthy()
    expect(await screen.findByText('G20 Meeting')).toBeTruthy()
    expect(await screen.findByText(enEngagements.participantRoles.delegate)).toBeTruthy()
    // The participation branch MUST filter engagement_participants on
    // participant_dossier_id (the canonical plane), keyed on the person dossier id.
    expect(eqCalls.get('engagement_participants')).toContainEqual({
      column: 'participant_dossier_id',
      value: 'p1',
    })
  })

  it('omits the participation section entirely when there are zero rows', async () => {
    setTable('engagement_participants', [])

    renderWithClient(<DossierEngagementsTab dossierId="p1" dossierType="person" />)

    // Generic empty state still renders; participation must be fully absent.
    expect(await screen.findByText(enDossierShell.empty.engagements.title)).toBeTruthy()
    expect(screen.queryByText(enDossierShell.sections.participation)).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('renders an error line (not an empty state) when a per-type branch fails', async () => {
    setTable('engagement_participants', null, { message: 'forced' })

    renderWithClient(<DossierEngagementsTab dossierId="p1" dossierType="person" />)

    // Heading present, error alert present, empty-state copy ABSENT.
    expect(await screen.findByText(enDossierShell.sections.participation)).toBeTruthy()
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain(enDossier.overview.sectionError)
    expect(alert.textContent).not.toContain('overview.sectionError')
    expect(screen.queryByText(enDossierShell.empty.engagements.title)).toBeNull()
  })

  it('renders the error line instead of the empty copy when the generic branch fails', async () => {
    mockedFetch.mockRejectedValue(new Error('generic forced'))

    const { unmount } = renderWithClient(<DossierEngagementsTab dossierId="d1" />)

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain(enDossier.overview.sectionError)
    expect(alert.textContent).not.toContain('overview.sectionError')
    expect(screen.queryByText(enDossierShell.empty.engagements.title)).toBeNull()
    unmount()

    mockLanguage = 'ar'
    renderWithClient(<DossierEngagementsTab dossierId="d1" />)
    const arAlert = await screen.findByRole('alert')
    expect(arAlert.textContent).toContain(arDossier.overview.sectionError)
    expect(arAlert.textContent).not.toContain('overview.sectionError')
  })

  it('shows the History sub-heading when a per-type section AND generic entries both render', async () => {
    setTable('engagement_participants', [{ engagement_id: 'e1', role: 'speaker' }])
    setTable('engagement_dossiers', [
      { id: 'e1', engagement_type: 'summit', start_date: '2026-05-01' },
    ])
    setTable('dossiers', [
      { id: 'e1', name_en: 'G20 Meeting', name_ar: 'اجتماع', created_at: '2026-04-01T00:00:00Z' },
    ])
    mockedFetch.mockResolvedValue(
      makeResponse({
        related_dossiers: {
          by_dossier_type: {
            engagement: [
              {
                id: 'g1',
                name_en: 'Generic Engagement',
                name_ar: 'عام',
                type: 'engagement',
                relationship_type: 'related_to',
                created_at: '2026-03-01T00:00:00Z',
              },
            ],
          },
        },
        calendar_events: { past: [] },
      }),
    )

    renderWithClient(<DossierEngagementsTab dossierId="p1" dossierType="person" />)

    expect(await screen.findByText(enDossierShell.sections.participation)).toBeTruthy()
    expect(await screen.findByText(enDossierShell.sections.history)).toBeTruthy()
  })

  it('omits the History sub-heading when only the generic timeline renders', async () => {
    mockedFetch.mockResolvedValue(
      makeResponse({
        related_dossiers: {
          by_dossier_type: {
            engagement: [
              {
                id: 'g1',
                name_en: 'Generic Engagement',
                name_ar: 'عام',
                type: 'engagement',
                relationship_type: 'related_to',
                created_at: '2026-03-01T00:00:00Z',
              },
            ],
          },
        },
        calendar_events: { past: [] },
      }),
    )

    renderWithClient(<DossierEngagementsTab dossierId="d1" />)

    expect(await screen.findByText('Generic Engagement')).toBeTruthy()
    expect(screen.queryByText(enDossierShell.sections.history)).toBeNull()
  })

  it('ships the three section keys in both en and ar dossier-shell.json', () => {
    const en = enDossierShell as { sections?: Record<string, string> }
    const ar = arDossierShell as { sections?: Record<string, string> }

    for (const key of ['hostedEngagements', 'participation', 'history'] as const) {
      expect(en.sections?.[key]).toBeTruthy()
      expect(ar.sections?.[key]).toBeTruthy()
    }
    expect(ar.sections?.hostedEngagements).toBe('المشاركات المستضافة')
  })
})

describe('P99-58 acceptance criteria', () => {
  it("No t() call in this slice passes an English default; a missing key now shows as missing in both locales — which the gatekeeper's proven zero makes an empty set today.", () => {
    expect(joinedLaneProduction.match(literalMaskPattern) ?? []).toHaveLength(0)
    expect(
      productionWithoutLocalizedDynamicFallback.match(fallbackOptionPattern) ?? [],
    ).toHaveLength(0)
    expect(joinedLaneProduction.match(emptySentinelPattern) ?? []).toHaveLength(3)
  })

  it("Decisions covered — D-06, D-20, D-23, D-24, D-28, D-39: deletion-only, behind the gatekeeper, no conversion, one population, every zero controlled, file-disjoint from its siblings. || AN EMPTY-STRING SECOND ARGUMENT IS A SENTINEL, NOT A MASK — LEAVE IT (RULING-P99-484). `t('key', '')` and ``t(`key.${x}`, '')`` are the OPPOSITE of an English default: an English default FAKES a translation, while an empty default HIDES an untranslated key so a `{value && ...}` guard renders nothing. Deleting it makes `t()` return the raw KEY, which is truthy, so the guarded section renders an i18n key as visible UI. Measured on the dossier type-guide component: `typeGuide.<type>.whenToUse` and `.notFor` are absent from BOTH locales for 7 of the 8 dossier types (only `elected_official` has them), so deleting those three sentinels is a user-visible regression in both languages. Repo-wide there are exactly THREE such sites, all in that one file. Both mask shapes are deleted across this lane's files: `t('key', 'Literal')` -> `t('key')`, `t('key', 'Literal', opts)` -> `t('key', opts)`, and the object-form fallback-text option is removed while every remaining option is kept — because interpolation options are not masks. The object-form fallback class is a SEPARATE population from the literal class: 314 sites across 103 files repo-wide, 88 of which carry no literal-class site at all, and the first draft's single 161-file scope covered only the literal class while demanding both reach zero.", () => {
    expect(joinedLaneProduction.match(emptySentinelPattern) ?? []).toHaveLength(3)
    expect(laneProductionSources['components/attachment-uploader/AttachmentUploader.tsx']).toMatch(
      /t\('form\.attachments\.maxFilesAllowed',\s*\{\s*count:/,
    )
    expect(laneProductionSources['components/bulk-actions/BulkActionPreviewDialog.tsx']).toMatch(
      /t\('preview\.description',\s*\{\s*action:/,
    )
    expect(laneProductionSources['components/dossier/DossierShell.tsx']).toContain(
      "t('dossier:action.edit', { ns: 'dossier' })",
    )
  })

  it("PRODUCTION keys are byte-untouched. Across the 22 production files the diff contains deletions of default arguments and nothing else — no key string, namespace prefix, hook, import move, or test-mode branch. This part owns exactly these companion tests: `frontend/src/components/dossier/tabs/__tests__/DossierEngagementsTab.test.tsx`. They are here because they ASSERT ON THE ENGLISH LITERALS THIS PART DELETES, and the WHOLE IMPORT CLOSURE of each is inside this part, so repairing one never reaches another part's file (RULING-P99-468). TRIGGER: if this part's deletions cause one to render or assert a BARE i18n KEY, or to fail on a literal that no longer exists, it MUST be repaired as below; OTHERWISE it MUST be left BYTE-UNCHANGED — ownership grants authority to repair a break this part causes, never a mandate to rewrite a test that still passes. The test may not make a raw key or a hardcoded English source fallback the contract. COMPANION TEST FIXTURES, OWNED AND CONDITIONALLY REPAIRABLE (RULING-P99-429). The companion tests named in files_modified are owned by this lane. TRIGGER: if this lane's deletions cause one of them to render or assert a BARE i18n KEY as visible text or accessible name, it MUST be repaired as below; OTHERWISE it MUST be left BYTE-UNCHANGED - ownership grants authority to repair a break this lane causes, never a mandate to rewrite a test that still passes. WHEN REPAIRED: (a) expected copy comes from a STATIC top-level import of the relevant frontend/src/i18n/{en,ar}/<ns>.json, as DossierEngagementsTab.test.tsx:6-7 does, and any hand-copied copy object is deleted; (b) the react-i18next mock RESOLVES keys against the real bundle loaded with await vi.importActual of that same JSON INSIDE the vi.mock factory - a static import cannot serve this side because vi.mock is hoisted above it - with no private copy, no default-argument fallback and no key fallback; (c) the resolved en AND ar values are both asserted, the ar assertion being what proves the fallback is gone; (d) the rendered output must NOT contain the bare key; (e) existing assertions still exist and still run, not deleted, skipped, .only-ed or loosened. AND NO PRODUCTION-SIDE ESCAPE: the suite is made green by repairing the TEST. No production change may be made whose EFFECT is that an assertion passes independently of whether the key resolves - that covers a literal second-argument default, an object-form default option, and any conditional, wrapper, concatenation or logical-or that substitutes for or augments the value returned by t(). If a key fails to resolve, production must render the failure, not disguise it. || NO i18n JSON changes in this lane.", () => {
    expect(laneProductionPaths).toHaveLength(22)
    expect(joinedLaneProduction).not.toMatch(/\b(?:unitMockCopy|testModeCopy)\b/)
    expect(enDossier.overview.sectionError).not.toBe(arDossier.overview.sectionError)
    expect(enDossierOverview.relationshipType.related_to).not.toBe(
      arDossierOverview.relationshipType.related_to,
    )
    expect(enEngagements.participantRoles.delegate).not.toBe(
      arEngagements.participantRoles.delegate,
    )
  })

  it("A mask site found in a file OUTSIDE this lane's list means the tree moved between the gatekeeper's manifest and this lane: STOP and record it, do not widen scope || This part's logic-diff budget is **~32589 bytes** against the engine's 60,000-byte gates.diffCap. It is NOT a plan-time floor: it is the pre-split lane's ENGINE-MEASURED 94803-byte diff (fetchTaskDiff at the attempt's own HEAD, 1.58x over cap), apportioned by this part's 78/269 share of the lane's mask sites — so it inherits a measurement, not an estimate, and it inherits the pre-split churn too, which makes it an OVER-estimate of deletion-only work. On top of that it carries 1 companion-test allowance(s) at 5,100 bytes each — MEASURED, not guessed: the one companion repaired in the landed lane 5 cost 5,036 logic-diff bytes. Test companions carry no masks, so they cost budget without earning apportioned budget (RULING-P99-468 order 4). Every part is held at or under 45,000 bytes, >=25% under the 60,000 cap, per RULING-P99-465 and the decomposition rule. The pre-split floor for this lane read ~44066 bytes and the truth was 94803: a 2x miss, which is exactly why a measured apportionment replaces it. A diff-cap trip returns park:\"human\" with the engine's own note that the diff cannot shrink by retrying — it is un-retryable, after the work is done, which is why the parts are cut this small.", () => {
    expect(new Set(laneProductionPaths).size).toBe(22)
    expect(laneProductionPaths.every((path) => laneProductionSources[path].length > 0)).toBe(true)
  })

  it("no DYNAMIC-KEY site drops its fallback while a reachable key is absent from a locale (RULING-P99-498) — the strict audit matches a SINGLE-QUOTED first argument and cannot see template-literal keys, which is why it REWARDED deleting the sentinels while review rejected it, and reachability is derived from the TYPE UNION rather than the locale file. AND the strict instrument's twoArgTotal — EVERY mask site, resolved or not, seen by the cross-line matcher — reads ZERO across this lane's files, with a nonzero rawKeyTotal as the positive control that the scope matched real t() calls, AND no fallback-text option survives in them. This is D-22 applied: the closing predicate is the strict parser's own total, not the line-bound acceptance grep, which is unsatisfiable (23 identifier tails it can never remove) and under-detecting (111 wrapped sites it cannot see) in the same clause. RED at HEAD (78 mask sites in this part).", () => {
    const scope = laneProductionPaths.map((path) => `frontend/src/${path}`).join(',')
    const audit = JSON.parse(
      execFileSync(
        process.execPath,
        [
          resolve(laneRepoRoot, 'scripts/i18n-audit-strict.mjs'),
          laneRepoRoot,
          '--scope',
          scope,
          '--json',
        ],
        { encoding: 'utf8' },
      ),
    ) as Record<string, number>
    const dynamicCoverage = execFileSync(
      process.execPath,
      [resolve(laneRepoRoot, 'scripts/i18n-dynamic-key-coverage.mjs'), laneRepoRoot],
      { encoding: 'utf8' },
    )

    expect(audit.twoArgTotal).toBe(0)
    expect(audit.rawKeyTotal).toBeGreaterThan(0)
    expect(joinedLaneProduction.match(localizedDynamicFallbackPattern) ?? []).toHaveLength(1)
    expect(
      productionWithoutLocalizedDynamicFallback.match(fallbackOptionPattern) ?? [],
    ).toHaveLength(0)
    expect(dynamicCoverage.match(/missing=7\/8/g)).toHaveLength(2)
    expect(dynamicCoverage).toContain('dynamic-key coverage: OK (2 site(s))')
  })

  it('no i18n JSON changed in this lane, the scoped strict audit still reads zero UNRESOLVED after the drop (a nonzero here means a key moved, which is the one way a deletion-only diff can go wrong), and the phase negative control still prints 3x MISS=true — RED at HEAD', () => {
    const scope = laneProductionPaths.map((path) => `frontend/src/${path}`).join(',')
    const audit = JSON.parse(
      execFileSync(
        process.execPath,
        [
          resolve(laneRepoRoot, 'scripts/i18n-audit-strict.mjs'),
          laneRepoRoot,
          '--scope',
          scope,
          '--json',
        ],
        { encoding: 'utf8' },
      ),
    ) as Record<string, number>
    const negativeControl = execFileSync(
      process.execPath,
      [resolve(laneRepoRoot, 'scripts/neg-taskcard.mjs'), laneRepoRoot],
      { encoding: 'utf8' },
    )

    expect(audit.twoArgUnresolved).toBe(0)
    expect(audit.rawKeyUnresolved).toBe(0)
    expect(audit.twoArgUnresolvedEn).toBe(0)
    expect(audit.rawKeyUnresolvedEn).toBe(0)
    expect(audit.twoArgUnresolvedAr).toBe(0)
    expect(audit.rawKeyUnresolvedAr).toBe(0)
    expect(negativeControl.match(/MISS=true/g)).toHaveLength(3)
    expect(enDossierShell.tabs.engagements).not.toBe(arDossierShell.tabs.engagements)
  })
})
