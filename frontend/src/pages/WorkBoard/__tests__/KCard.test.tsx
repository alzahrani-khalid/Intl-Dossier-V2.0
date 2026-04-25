/**
 * Phase 39 Plan 01 — KCard widget unit tests.
 *
 * Verifies:
 *  - Title localization (en uses item.title; ar prefers item.title_ar)
 *  - Overdue + done state classes on root <article>
 *  - DossierGlyph rendering when dossier.flag truthy
 *  - Owner-initials computation (first + last word initials, fallback "?")
 *  - Due-text formatter (overdue / today / future + Arabic-Indic digit conversion)
 *  - onItemClick fires on click; cursor reflects dndEnabled
 *  - Accessible name on the article element
 *  - Priority chip class mapping (urgent/high → chip-danger, medium → chip-warn, low → bare)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import type { ReactElement } from 'react'

import { KCard } from '../KCard'
import type { WorkItem } from '@/types/work-item.types'

// Mutable language to simulate locale switching
let currentLang = 'en'

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (k: string) => string; i18n: { language: string } } => ({
    t: (key: string): string => key,
    i18n: { language: currentLang },
  }),
}))

vi.mock('@/components/signature-visuals', () => ({
  DossierGlyph: (props: { iso?: string; type?: string; size?: number }): ReactElement => (
    <span
      data-testid="glyph"
      data-iso={props.iso ?? ''}
      data-type={props.type ?? ''}
      data-size={props.size ?? ''}
    />
  ),
}))

// Stable "today" reference for due-text formatting
const TODAY_ISO = new Date(2026, 3, 25).toISOString() // April 25, 2026
const FUTURE_ISO = new Date(2026, 4, 10).toISOString() // May 10, 2026

const baseItem: WorkItem = {
  id: 'wi-1',
  source: 'task',
  title: 'Hello World',
  title_ar: 'مرحبا',
  description: null,
  priority: 'medium',
  status: 'pending',
  workflow_stage: 'todo',
  column_key: 'todo',
  tracking_type: 'delivery',
  deadline: FUTURE_ISO,
  is_overdue: false,
  days_until_due: 15,
  assignee: {
    id: 'u-1',
    name: 'Khalid Alzahrani',
    avatar_url: null,
  },
  dossier_id: 'd-1',
  engagement_id: null,
  created_at: TODAY_ISO,
  updated_at: TODAY_ISO,
  metadata: {},
}

function makeItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return { ...baseItem, ...overrides } as WorkItem
}

beforeEach(() => {
  currentLang = 'en'
  cleanup()
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 3, 25, 12, 0, 0))
})

describe('KCard', () => {
  it('renders title from item.title in en', () => {
    render(<KCard item={makeItem()} onItemClick={vi.fn()} />)
    expect(screen.getByText('Hello World')).toBeTruthy()
  })

  it('renders title_ar in ar locale when present', () => {
    currentLang = 'ar'
    render(<KCard item={makeItem()} onItemClick={vi.fn()} />)
    expect(screen.getByText('مرحبا')).toBeTruthy()
    expect(screen.queryByText('Hello World')).toBeNull()
  })

  it('applies overdue class when item.is_overdue is true', () => {
    const { container } = render(
      <KCard item={makeItem({ is_overdue: true })} onItemClick={vi.fn()} />,
    )
    const article = container.querySelector('article')
    expect(article).not.toBeNull()
    expect(article?.className).toMatch(/\bkcard\b/)
    expect(article?.className).toMatch(/\boverdue\b/)
  })

  it('applies done class when status=completed or workflow_stage=done', () => {
    const { container, rerender } = render(
      <KCard item={makeItem({ status: 'completed' })} onItemClick={vi.fn()} />,
    )
    expect(container.querySelector('article')?.className).toMatch(/\bdone\b/)
    rerender(
      <KCard
        item={makeItem({ workflow_stage: 'done', status: 'pending' })}
        onItemClick={vi.fn()}
      />,
    )
    expect(container.querySelector('article')?.className).toMatch(/\bdone\b/)
  })

  it('renders DossierGlyph when item.dossier?.flag is truthy', () => {
    const item = makeItem()
    // Attach dossier with flag (not on base WorkItem type — KCard reads via extended shape)
    ;(item as unknown as { dossier: { id: string; name: string; flag: string } }).dossier = {
      id: 'd-1',
      name: 'Saudi Arabia',
      flag: 'sa',
    }
    render(<KCard item={item} onItemClick={vi.fn()} />)
    const glyph = screen.getByTestId('glyph')
    expect(glyph.dataset.iso).toBe('sa')
  })

  it('computes initials from first + last word of assignee name', () => {
    render(<KCard item={makeItem()} onItemClick={vi.fn()} />)
    expect(screen.getByText('KA')).toBeTruthy()
  })

  it('falls back to "?" when assignee is null', () => {
    render(<KCard item={makeItem({ assignee: null })} onItemClick={vi.fn()} />)
    expect(screen.getByText('?')).toBeTruthy()
  })

  it('renders "Overdue 3d" text when overdue with days_until_due', () => {
    render(
      <KCard item={makeItem({ is_overdue: true, days_until_due: -3 })} onItemClick={vi.fn()} />,
    )
    expect(screen.getByText(/Overdue 3d/)).toBeTruthy()
  })

  it('renders "Today" when deadline is today', () => {
    render(<KCard item={makeItem({ deadline: TODAY_ISO })} onItemClick={vi.fn()} />)
    expect(screen.getByText('Today')).toBeTruthy()
  })

  it('renders formatted future date "10 May" when deadline is in the future', () => {
    render(<KCard item={makeItem({ deadline: FUTURE_ISO })} onItemClick={vi.fn()} />)
    expect(screen.getByText('10 May')).toBeTruthy()
  })

  it('converts due-text digits to Arabic-Indic in ar locale', () => {
    currentLang = 'ar'
    render(
      <KCard item={makeItem({ is_overdue: true, days_until_due: -62 })} onItemClick={vi.fn()} />,
    )
    expect(screen.getByText(/Overdue ٦٢d/)).toBeTruthy()
  })

  it('fires onItemClick when card is clicked', () => {
    const onItemClick = vi.fn()
    const item = makeItem()
    const { container } = render(<KCard item={item} onItemClick={onItemClick} />)
    fireEvent.click(container.querySelector('article')!)
    expect(onItemClick).toHaveBeenCalledTimes(1)
    expect(onItemClick).toHaveBeenCalledWith(item)
  })

  it('uses cursor "grab" when dndEnabled=true and "pointer" otherwise', () => {
    const { container, rerender } = render(
      <KCard item={makeItem()} onItemClick={vi.fn()} dndEnabled />,
    )
    expect(container.querySelector('article')?.style.cursor).toBe('grab')
    rerender(<KCard item={makeItem()} onItemClick={vi.fn()} dndEnabled={false} />)
    expect(container.querySelector('article')?.style.cursor).toBe('pointer')
  })

  it('exposes article via accessible name (aria-label of title)', () => {
    render(<KCard item={makeItem()} onItemClick={vi.fn()} />)
    const article = screen.getByRole('button', { name: 'Hello World' })
    expect(article.tagName).toBe('ARTICLE')
  })

  it('maps priority urgent/high to chip-danger, medium to chip-warn, low to bare chip', () => {
    const { container, rerender } = render(
      <KCard item={makeItem({ priority: 'urgent' })} onItemClick={vi.fn()} />,
    )
    let chips = container.querySelectorAll('.kcard-top span')
    // priority is the second chip (kind first, priority second)
    expect(chips[1].className).toMatch(/\bchip-danger\b/)

    rerender(<KCard item={makeItem({ priority: 'high' })} onItemClick={vi.fn()} />)
    chips = container.querySelectorAll('.kcard-top span')
    expect(chips[1].className).toMatch(/\bchip-danger\b/)

    rerender(<KCard item={makeItem({ priority: 'medium' })} onItemClick={vi.fn()} />)
    chips = container.querySelectorAll('.kcard-top span')
    expect(chips[1].className).toMatch(/\bchip-warn\b/)

    rerender(<KCard item={makeItem({ priority: 'low' })} onItemClick={vi.fn()} />)
    chips = container.querySelectorAll('.kcard-top span')
    expect(chips[1].className).toMatch(/\bchip\b/)
    expect(chips[1].className).not.toMatch(/chip-danger|chip-warn/)
  })
})
