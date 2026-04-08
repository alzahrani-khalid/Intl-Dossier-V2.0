/**
 * EngagementStageGroup tests — DEBT-01 / Phase 19-01
 *
 * Verifies typed TanStack Router navigation (no string URLs) for both
 * click and keyboard activation paths.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EngagementStageGroup } from '../EngagementStageGroup'
import type { StageEngagement } from '@/domains/operations-hub/types/operations-hub.types'

const navigateSpy = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: (): typeof navigateSpy => navigateSpy,
}))

vi.mock('react-i18next', () => ({
  useTranslation: (): {
    t: (key: string, opts?: { defaultValue?: string }) => string
    i18n: { language: string }
  } => ({
    t: (key: string, opts?: { defaultValue?: string }): string => opts?.defaultValue ?? key,
    i18n: { language: 'en' },
  }),
}))

const fixture: StageEngagement[] = [
  {
    id: 'eng-123',
    name_en: 'Test Engagement',
    name_ar: null,
    engagement_type: 'meeting',
  } as unknown as StageEngagement,
]

describe('EngagementStageGroup typed navigation (DEBT-01)', () => {
  beforeEach(() => {
    navigateSpy.mockClear()
  })

  const renderOpen = (): void => {
    render(<EngagementStageGroup stage={'intake' as never} engagements={fixture} count={1} />)
    fireEvent.click(screen.getByRole('button', { expanded: false }))
  }

  it('navigates with typed params on click', () => {
    renderOpen()
    fireEvent.click(screen.getByRole('button', { name: 'Test Engagement' }))
    expect(navigateSpy).toHaveBeenCalledWith({
      to: '/engagements/$engagementId',
      params: { engagementId: 'eng-123' },
    })
  })

  it('navigates with typed params on Enter key', () => {
    renderOpen()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Test Engagement' }), { key: 'Enter' })
    expect(navigateSpy).toHaveBeenCalledWith({
      to: '/engagements/$engagementId',
      params: { engagementId: 'eng-123' },
    })
  })

  it('navigates with typed params on Space key', () => {
    renderOpen()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Test Engagement' }), { key: ' ' })
    expect(navigateSpy).toHaveBeenCalledWith({
      to: '/engagements/$engagementId',
      params: { engagementId: 'eng-123' },
    })
  })

  it('does not navigate on unrelated keys', () => {
    renderOpen()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Test Engagement' }), { key: 'a' })
    expect(navigateSpy).not.toHaveBeenCalled()
  })
})
