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
 * react-i18next is mocked to return defaultValue/key (the repo's standard
 * component-test idiom — see work-creation/__tests__/DossierPicker.test.tsx) so
 * assertions key off the EN copy in the UI-SPEC copywriting contract.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultOrOpts?: unknown, maybeOpts?: unknown) => {
      if (
        typeof defaultOrOpts === 'object' &&
        defaultOrOpts !== null &&
        'defaultValue' in (defaultOrOpts as Record<string, unknown>)
      ) {
        return (defaultOrOpts as { defaultValue: string }).defaultValue
      }
      if (typeof defaultOrOpts === 'string') return defaultOrOpts
      if (
        typeof maybeOpts === 'object' &&
        maybeOpts !== null &&
        'defaultValue' in (maybeOpts as Record<string, unknown>)
      ) {
        return (maybeOpts as { defaultValue: string }).defaultValue
      }
      return key
    },
    i18n: { language: 'en' },
  }),
}))

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
})
