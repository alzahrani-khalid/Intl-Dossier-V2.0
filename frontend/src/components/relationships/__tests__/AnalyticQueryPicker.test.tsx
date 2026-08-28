/**
 * AnalyticQueryPicker unit tests (RED until plan 71-04).
 *
 * Pins the picker contract from 71-UI-SPEC ("Idle / picker" state) + D-02:
 *   - the 4 query templates render with their `graph` i18n labels
 *   - selecting `engagement_chain` reveals an "over the last N days" window input
 *   - the primary "Run analysis" CTA fires `onRun` with the typed params
 *   - a `defaultEntityId` prop pre-fills the primary entity
 *
 * EXPECTED RED NOW: `../AnalyticQueryPicker` does not exist, so the import below
 * fails to resolve and the suite errors. GREEN when 71-04 builds the component.
 *
 * react-i18next resolves the production graph resource so assertions exercise
 * the same labels as the shipped component after fallback deletion.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', async () => {
  const { default: graph } =
    await vi.importActual<typeof import('@/i18n/en/graph.json')>('@/i18n/en/graph.json')
  const resolve = (path: string): unknown =>
    path.split('.').reduce((value, segment) => (value as Record<string, unknown>)?.[segment], graph)

  return {
    useTranslation: () => ({
      t: (key: string, opts: Record<string, unknown> = {}): string => {
        const value = resolve(key)
        return typeof value === 'string'
          ? value.replace(/\{\{(\w+)\}\}/g, (match, name: string) => String(opts[name] ?? match))
          : key
      },
      i18n: { language: 'en' },
    }),
  }
})

vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({ direction: 'ltr', isRTL: false }),
}))

// RED import: the component does not exist yet (built in 71-04).
import { AnalyticQueryPicker } from '../AnalyticQueryPicker'

const ANCHOR_ID = '00000000-0000-4000-8000-000000000001'
const SECOND_ID = '00000000-0000-4000-8000-000000000002'

describe('AnalyticQueryPicker (GRAPH-01 picker contract)', () => {
  it('renders the four query templates with their labels', () => {
    render(<AnalyticQueryPicker onRun={vi.fn()} />)

    expect(screen.getByText('Who sits on which forum')).toBeInTheDocument()
    expect(screen.getByText('Shared committees')).toBeInTheDocument()
    expect(screen.getByText('Engagement chains')).toBeInTheDocument()
    expect(screen.getByText('How are these connected')).toBeInTheDocument()
  })

  it('reveals an "over the last N days" window input when engagement_chain is selected', async () => {
    const user = userEvent.setup()
    render(<AnalyticQueryPicker onRun={vi.fn()} />)

    await user.click(screen.getByText('Engagement chains'))

    // The window control is only present for the chain template (D-02).
    expect(screen.getByLabelText(/over the last/i)).toBeInTheDocument()
  })

  it('fires onRun with the typed params when "Run analysis" is pressed', async () => {
    const user = userEvent.setup()
    const onRun = vi.fn()
    render(<AnalyticQueryPicker defaultEntityId={ANCHOR_ID} onRun={onRun} />)

    await user.click(screen.getByText('Who sits on which forum'))
    await user.click(screen.getByRole('button', { name: /run analysis/i }))

    expect(onRun).toHaveBeenCalledTimes(1)
    expect(onRun).toHaveBeenCalledWith(
      expect.objectContaining({
        queryType: 'forum_membership',
        entityId: ANCHOR_ID,
      }),
    )
  })

  it('pre-fills the primary entity from defaultEntityId (D-02)', () => {
    render(<AnalyticQueryPicker defaultEntityId={ANCHOR_ID} onRun={vi.fn()} />)

    // The primary entity input must carry the anchor id without further user input.
    expect(screen.getByDisplayValue(ANCHOR_ID)).toBeInTheDocument()
    // A non-default id must NOT be pre-filled.
    expect(screen.queryByDisplayValue(SECOND_ID)).not.toBeInTheDocument()
  })

  it("Decisions covered — D-06, D-20, D-23, D-24, D-28, D-39: deletion-only, behind the gatekeeper, no conversion, one population, every zero controlled, file-disjoint from its siblings. || Both mask shapes are deleted across this lane's files: `t('key', 'Literal')` -> `t('key')`, `t('key', 'Literal', opts)` -> `t('key', opts)`, and the object-form fallback-text option is removed while every remaining option is kept — because interpolation options are not masks. The object-form fallback class is a SEPARATE population from the literal class: 314 sites across 103 files repo-wide, 88 of which carry no literal-class site at all, and the first draft's single 161-file scope covered only the literal class while demanding both reach zero.", () => {
    render(<AnalyticQueryPicker onRun={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Choose an analysis' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Run analysis' })).toBeInTheDocument()
    expect(screen.getByText('Who sits on which forum')).toBeInTheDocument()
  })
})
