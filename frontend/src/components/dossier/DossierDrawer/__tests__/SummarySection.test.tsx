/**
 * SummarySection — Wave 1 (Phase 41-03) tests.
 *
 * Asserts:
 *   - Bilingual fallback chain (AR -> AR text, EN -> EN text, both empty -> empty.summary)
 *   - Italic-serif paragraph styling per handoff app.css#L516
 *   - Section heading uses t-label class with section.summary key
 */
import { render, cleanup, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const i18nLanguageHolder: { value: string } = { value: 'en' }

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (k: string) => string; i18n: { language: string } } => ({
    t: (k: string): string => k,
    i18n: { language: i18nLanguageHolder.value },
  }),
}))

import { SummarySection } from '../SummarySection'

describe('SummarySection (Phase 41-03)', () => {
  beforeEach(() => {
    i18nLanguageHolder.value = 'en'
    cleanup()
  })

  it('renders dossier.description_en under EN locale when present', () => {
    render(
      <SummarySection
        dossier={{ description_en: 'Bilateral relations summary.', description_ar: null }}
      />,
    )
    expect(screen.getByText('Bilateral relations summary.')).toBeTruthy()
  })

  it('renders dossier.description_ar under AR locale when present', () => {
    i18nLanguageHolder.value = 'ar'
    render(
      <SummarySection
        dossier={{ description_en: 'EN text', description_ar: 'ملخص العلاقات الثنائية.' }}
      />,
    )
    expect(screen.getByText('ملخص العلاقات الثنائية.')).toBeTruthy()
  })

  it('under AR with description_ar empty but description_en present, falls back to EN', () => {
    i18nLanguageHolder.value = 'ar'
    render(<SummarySection dossier={{ description_en: 'EN fallback.', description_ar: null }} />)
    expect(screen.getByText('EN fallback.')).toBeTruthy()
  })

  it('with both descriptions empty/null, renders t(empty.summary)', () => {
    render(<SummarySection dossier={{ description_en: null, description_ar: null }} />)
    expect(screen.getByText('empty.summary')).toBeTruthy()
  })

  it('section heading text renders t(section.summary)', () => {
    render(<SummarySection dossier={{ description_en: 'x', description_ar: null }} />)
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading.textContent).toBe('section.summary')
  })

  it('paragraph element has italic display-font ink-mute 14px line-height 1.6 inline style', () => {
    const { container } = render(
      <SummarySection dossier={{ description_en: 'styled', description_ar: null }} />,
    )
    const p = container.querySelector('p') as HTMLParagraphElement
    expect(p).not.toBeNull()
    expect(p.style.fontStyle).toBe('italic')
    expect(p.style.fontFamily).toContain('var(--font-display)')
    expect(p.style.color).toContain('var(--ink-mute)')
    expect(p.style.fontSize).toBe('14px')
    expect(p.style.lineHeight).toBe('1.6')
  })

  it('section heading uses label-style class (t-label)', () => {
    render(<SummarySection dossier={{ description_en: 'x', description_ar: null }} />)
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading.className).toContain('t-label')
  })
})
