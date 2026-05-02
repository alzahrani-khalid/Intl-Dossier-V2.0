/**
 * Phase 42 Plan 05 — BriefsPage vitest unit suite.
 *
 * Coverage (5 tests, 1:1 with the plan <behavior> block):
 *   1. renders <section role="region"> with data-loading attribute
 *   2. card count matches the merged briefs length
 *   3. status chip mapping: is_published=true -> chip-ok; false -> bare chip
 *   4. empty state heading renders when merged result is empty
 *   5. AR locale renders Arabic-Indic digits via toArDigits in the page-count mono span
 *
 * Mocks Supabase and react-i18next. The dual-table fetch is replaced by a
 * single useQuery mock that returns the merged-briefs fixture; we only need
 * to assert the render layer, not the merge logic itself.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ---------------------------------------------------------------------------
// Hoisted fixture buckets — vi.mock factories read these at call time.
// ---------------------------------------------------------------------------
const briefsFixture: { current: Array<Record<string, unknown>> } = { current: [] }
const langFixture: { current: 'en' | 'ar' } = { current: 'en' }

// ---------------------------------------------------------------------------
// react-i18next mock (Pattern I from 42-PATTERNS.md) — language switchable.
// ---------------------------------------------------------------------------
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: langFixture.current },
    t: (key: string) => {
      const map: Record<string, string> = {
        title: 'Briefs',
        subtitle: 'Captured intelligence summaries and AI-generated briefs.',
        'cta.newBrief': 'New brief',
        'empty.heading': 'No briefs yet',
        'status.ready': 'Ready',
        'status.draft': 'Draft',
        'error.list': 'Could not load briefs. Try refreshing the page.',
      }
      return map[key] ?? key
    },
  }),
  Trans: ({ children }: { children: ReactNode }) => children,
}))

// ---------------------------------------------------------------------------
// language-provider mock — useDirection() reads from this.
// ---------------------------------------------------------------------------
vi.mock('@/components/language-provider/language-provider', () => ({
  useLanguage: () => ({
    direction: langFixture.current === 'ar' ? 'rtl' : 'ltr',
    language: langFixture.current,
    setLanguage: vi.fn(),
  }),
}))

// ---------------------------------------------------------------------------
// supabase mock — only need .from / .auth references; the data path is
// intercepted by the useQuery mock below.
// ---------------------------------------------------------------------------
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}))

// ---------------------------------------------------------------------------
// Stub heavy children so we don't transitively render their dependencies.
// ---------------------------------------------------------------------------
vi.mock('@/components/ai/BriefGenerationPanel', () => ({
  BriefGenerationPanel: () => <div data-testid="generator" />,
  default: () => <div data-testid="generator" />,
}))
vi.mock('@/components/ai/BriefViewer', () => ({
  BriefViewer: () => <div data-testid="viewer" />,
  default: () => <div data-testid="viewer" />,
}))
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

// ---------------------------------------------------------------------------
// useQuery mock — return the briefs fixture directly so we don't have to
// stub the dual-table fetch.
// ---------------------------------------------------------------------------
vi.mock('@tanstack/react-query', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')
  return {
    ...actual,
    useQuery: () => ({
      data: briefsFixture.current,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    }),
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  }
})

// Import the page AFTER mocks are registered.
import { BriefsPage } from '../BriefsPage'

function renderWithQuery(ui: ReactNode): ReturnType<typeof render> {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

const FIX_PUBLISHED = {
  id: 'b1',
  reference_number: 'BRF-1',
  title_en: 'Published Brief',
  title_ar: 'ملخص منشور',
  summary_en: '',
  summary_ar: '',
  category: 'other',
  tags: [],
  is_published: true,
  published_date: '2026-04-28',
  created_at: '2026-04-28',
  author: { full_name: 'A. Author' },
  related_country: null,
  related_organization: null,
  related_event: null,
  full_content_en: 'x'.repeat(2200),
  isAiBrief: false,
}
const FIX_DRAFT = {
  id: 'b2',
  reference_number: 'BRF-2',
  title_en: 'Draft Brief',
  title_ar: 'مسودة',
  summary_en: '',
  summary_ar: '',
  category: 'other',
  tags: [],
  is_published: false,
  published_date: null,
  created_at: '2026-04-28',
  author: { full_name: 'B. Author' },
  related_country: null,
  related_organization: null,
  related_event: null,
  full_content_en: 'y'.repeat(4400),
  isAiBrief: false,
}

describe('BriefsPage', () => {
  beforeEach(() => {
    cleanup()
    langFixture.current = 'en'
  })

  it('Test 1: renders <section role="region"> with data-loading attribute', () => {
    briefsFixture.current = [FIX_PUBLISHED, FIX_DRAFT]
    renderWithQuery(<BriefsPage />)
    const section = screen.getByRole('region', { name: /briefs/i })
    expect(section.getAttribute('data-loading')).toMatch(/^(true|false)$/)
  })

  it('Test 2: card count matches mocked briefs length', () => {
    briefsFixture.current = [FIX_PUBLISHED, FIX_DRAFT]
    renderWithQuery(<BriefsPage />)
    const cards = screen.getAllByTestId('brief-card')
    expect(cards).toHaveLength(briefsFixture.current.length)
  })

  it('Test 3: status chip mapping renders chip-ok for is_published=true and base chip for is_published=false', () => {
    briefsFixture.current = [FIX_PUBLISHED, FIX_DRAFT]
    const { container } = renderWithQuery(<BriefsPage />)
    const cards = container.querySelectorAll('[data-testid="brief-card"]')
    const chips = Array.from(cards).map((c) => c.querySelector('.chip')) as HTMLElement[]
    expect(chips).toHaveLength(2)
    expect(chips[0].className).toContain('chip-ok')
    expect(chips[1].className).toBe('chip')
    expect(chips[1].className).not.toContain('chip-ok')
  })

  it('Test 4: empty state renders heading when briefs.length === 0', () => {
    briefsFixture.current = []
    renderWithQuery(<BriefsPage />)
    expect(screen.getByRole('heading', { name: /no briefs yet/i })).toBeTruthy()
    expect(screen.queryByTestId('briefs-card-grid')).toBeNull()
  })

  it('Test 5: AR locale renders Arabic-Indic digits via toArDigits in the page-count mono span', () => {
    langFixture.current = 'ar'
    briefsFixture.current = [FIX_PUBLISHED]
    const { container } = renderWithQuery(<BriefsPage />)
    const monoSpans = Array.from(container.querySelectorAll('span[dir="ltr"]')) as HTMLElement[]
    const joined = monoSpans.map((s) => s.textContent ?? '').join(' ')
    // Expect at least one Arabic-Indic digit (٠–٩, U+0660–U+0669) in the mono content.
    expect(joined).toMatch(/[٠-٩]/)
  })
})
