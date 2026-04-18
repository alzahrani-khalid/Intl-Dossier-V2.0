/**
 * StepGuidanceBanner Unit Tests (Plan 31-02, Task 1)
 *
 * Covers:
 *  - renders when no dismissal flag
 *  - hides when localStorage flag is '1'
 *  - persists dismissal on click
 *  - still dismisses visually when localStorage throws
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// i18n test mock — return the key itself so we can assert what was requested
vi.mock('react-i18next', () => ({
  useTranslation: (): {
    t: (key: string) => string
    i18n: { language: string }
  } => ({
    t: (key: string): string => key,
    i18n: { language: 'en' },
  }),
}))

import { StepGuidanceBanner } from '../StepGuidanceBanner'

describe('StepGuidanceBanner', (): void => {
  beforeEach((): void => {
    localStorage.clear()
  })

  afterEach((): void => {
    vi.restoreAllMocks()
  })

  it('renders translated guidance when no dismissal flag exists', (): void => {
    render(
      <StepGuidanceBanner
        type="country"
        stepId="basic"
        guidanceKey="country-wizard:wizard.steps.basic.guidance"
      />,
    )
    const el = screen.getByTestId('guidance-banner-country-basic')
    expect(el).not.toBeNull()
    // The mocked t() returns the key — the key is rendered as body text
    expect(el.textContent).toContain('country-wizard:wizard.steps.basic.guidance')
  })

  it('renders null when localStorage flag is "1"', (): void => {
    localStorage.setItem('dossier-wizard:guidance:country:basic', '1')
    const { container } = render(
      <StepGuidanceBanner
        type="country"
        stepId="basic"
        guidanceKey="country-wizard:wizard.steps.basic.guidance"
      />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('persists dismissal to localStorage when dismiss button clicked', async (): Promise<void> => {
    const user = userEvent.setup()
    render(
      <StepGuidanceBanner
        type="person"
        stepId="review"
        guidanceKey="person-wizard:wizard.steps.review.guidance"
      />,
    )
    await user.click(screen.getByRole('button', { name: /dismiss|close/i }))
    expect(localStorage.getItem('dossier-wizard:guidance:person:review')).toBe('1')
    expect(screen.queryByTestId('guidance-banner-person-review')).toBeNull()
  })

  it('still dismisses visually when localStorage.setItem throws', async (): Promise<void> => {
    const user = userEvent.setup()
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation((): never => {
        throw new Error('quota')
      })
    render(
      <StepGuidanceBanner
        type="topic"
        stepId="basic"
        guidanceKey="topic-wizard:wizard.steps.basic.guidance"
      />,
    )
    await user.click(screen.getByRole('button', { name: /dismiss|close/i }))
    expect(screen.queryByTestId('guidance-banner-topic-basic')).toBeNull()
    setItemSpy.mockRestore()
  })
})
