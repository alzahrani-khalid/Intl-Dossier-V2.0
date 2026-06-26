/**
 * BriefGenerationPanel — manual-brief fallback flow (feature fde9aa72).
 *
 * Drives the panel into its `manual` phase (reachable only via the "Enter
 * Manually" affordance in the error state), fills the executive summary, and
 * submits. Asserts: resolve -> success Alert + onBriefGenerated(id); reject ->
 * the inline error notice; submit disabled while the summary is empty.
 *
 * The repository is never hit — `useCreateManualBrief` is mocked at the
 * `@/domains/ai` barrel, and `useGenerateBrief` is stubbed to report a failed
 * generation so the error UI (which exposes the manual entry button) renders.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders as render, screen, waitFor } from '@tests/utils/render'
import userEvent from '@testing-library/user-event'
import { BriefGenerationPanel } from '@/components/ai/BriefGenerationPanel'
import type { BriefContent, UseGenerateBriefReturn } from '@/domains/ai'

const manualMutate = vi.fn<
  (
    params: unknown,
    callbacks?: {
      onSuccess?: (data: BriefContent) => void
      onError?: (err: unknown) => void
    },
  ) => void
>()
const manualReset = vi.fn()

// useGenerateBrief is stubbed to surface a generation error so the error state
// (and its "Enter Manually" button) renders on first paint.
const generateReset = vi.fn()
function makeGenerateReturn(): UseGenerateBriefReturn {
  return {
    generate: vi.fn(),
    brief: null,
    streamingContent: '',
    isGenerating: false,
    progress: 0,
    error: 'Generation failed',
    cancel: vi.fn(),
    retry: vi.fn(),
    reset: generateReset,
  }
}

vi.mock('@/domains/ai', async () => {
  const actual = await vi.importActual<typeof import('@/domains/ai')>('@/domains/ai')
  return {
    ...actual,
    useGenerateBrief: () => makeGenerateReturn(),
    useCreateManualBrief: () => ({
      mutate: manualMutate,
      reset: manualReset,
      isPending: false,
    }),
  }
})

function makeBrief(overrides: Partial<BriefContent> = {}): BriefContent {
  return {
    id: 'manual-brief-7',
    title: 'Manually entered brief',
    executiveSummary: 'Summary text',
    background: '',
    keyParticipants: [],
    relevantPositions: [],
    activeCommitments: [],
    historicalContext: '',
    talkingPoints: [],
    recommendations: '',
    citations: [],
    status: 'completed',
    ...overrides,
  }
}

async function enterManualPhase(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup()
  // The error state renders on mount (useGenerateBrief stubbed with an error).
  const enterManually = await screen.findByRole('button', { name: 'Enter Manually' })
  await user.click(enterManually)
  // Manual phase fields are now present.
  await screen.findByLabelText('Executive Summary')
  return user
}

describe('BriefGenerationPanel — manual fallback', () => {
  beforeEach(() => {
    manualMutate.mockReset()
    manualReset.mockReset()
    generateReset.mockReset()
  })

  it('disables Submit Brief while the summary is empty', async () => {
    render(<BriefGenerationPanel dossierId="dos-1" />)
    await enterManualPhase()

    expect(screen.getByRole('button', { name: 'Submit Brief' })).toBeDisabled()
  })

  it('submits the typed summary and shows success + calls onBriefGenerated on resolve', async () => {
    const onBriefGenerated = vi.fn()
    const created = makeBrief({ id: 'manual-brief-99', title: 'Saved manual brief' })
    manualMutate.mockImplementation((_params, callbacks) => {
      callbacks?.onSuccess?.(created)
    })

    render(
      <BriefGenerationPanel
        engagementId="eng-1"
        dossierId="dos-1"
        onBriefGenerated={onBriefGenerated}
      />,
    )
    const user = await enterManualPhase()

    await user.type(screen.getByLabelText('Executive Summary'), 'A concise executive summary')

    const submit = screen.getByRole('button', { name: 'Submit Brief' })
    await waitFor(() => expect(submit).not.toBeDisabled())
    await user.click(submit)

    // Mutation invoked with the entered summary and the panel's targets.
    expect(manualMutate).toHaveBeenCalledTimes(1)
    expect(manualMutate.mock.calls[0]?.[0]).toMatchObject({
      engagementId: 'eng-1',
      dossierId: 'dos-1',
      summary: 'A concise executive summary',
    })

    // Success Alert + Open Brief affordance wired to onBriefGenerated.
    expect(await screen.findByText('Brief saved successfully!')).toBeInTheDocument()
    expect(screen.getByText('Saved manual brief')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open Brief' }))
    expect(onBriefGenerated).toHaveBeenCalledWith('manual-brief-99')
  })

  it('shows the error notice when the mutation rejects', async () => {
    manualMutate.mockImplementation((_params, callbacks) => {
      callbacks?.onError?.(new Error('Failed to save manual brief'))
    })

    render(<BriefGenerationPanel dossierId="dos-1" />)
    const user = await enterManualPhase()

    await user.type(screen.getByLabelText('Executive Summary'), 'Summary that will fail to save')

    const submit = screen.getByRole('button', { name: 'Submit Brief' })
    await waitFor(() => expect(submit).not.toBeDisabled())
    await user.click(submit)

    expect(await screen.findByText('Failed to save manual brief')).toBeInTheDocument()
    // Stayed on the manual phase — no success Alert.
    expect(screen.queryByText('Brief saved successfully!')).not.toBeInTheDocument()
  })
})
