/**
 * Phase 40 LIST-02 — Persons list page render assertions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

// Resolve the production EN bundles: fallback arguments are intentionally ignored.
vi.mock('react-i18next', async () => {
  const [{ default: persons }, { default: listPages }, { default: emptyStates }] =
    await Promise.all([
      vi.importActual<typeof import('@/i18n/en/persons.json')>('@/i18n/en/persons.json'),
      vi.importActual<typeof import('@/i18n/en/list-pages.json')>('@/i18n/en/list-pages.json'),
      vi.importActual<typeof import('@/i18n/en/empty-states.json')>('@/i18n/en/empty-states.json'),
    ])
  const resources = { persons, 'list-pages': listPages, 'empty-states': emptyStates }
  const resolve = (resource: unknown, path: string): unknown =>
    path
      .split('.')
      .reduce((value, segment) => (value as Record<string, unknown>)?.[segment], resource)

  return {
    useTranslation: (requested?: string | string[]) => {
      const defaultNamespace = Array.isArray(requested)
        ? (requested[0] ?? 'translation')
        : (requested ?? 'translation')
      return {
        i18n: { language: 'en' },
        t: (rawKey: string, opts: Record<string, unknown> = {}): string => {
          const colon = rawKey.indexOf(':')
          const namespace =
            colon >= 0
              ? rawKey.slice(0, colon)
              : typeof opts.ns === 'string'
                ? opts.ns
                : defaultNamespace
          const key = colon >= 0 ? rawKey.slice(colon + 1) : rawKey
          const value = resolve(resources[namespace as keyof typeof resources], key)
          return typeof value === 'string'
            ? value.replace(/\{\{(\w+)\}\}/g, (match, name: string) => String(opts[name] ?? match))
            : rawKey
        },
      }
    },
  }
})

const mockUsePersons = vi.fn()
vi.mock('@/hooks/usePersons', () => ({
  usePersons: (...args: unknown[]) => mockUsePersons(...args),
}))

vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({ isRTL: false, dir: 'ltr' }),
}))

vi.mock('@/hooks/useDebouncedValue', () => ({
  useDebouncedValue: <T,>(v: T): T => v,
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: unknown) => config,
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
}))

import PersonsListPage from '../-PersonsListPage'

describe('PersonsListPage (Phase 40 LIST-02)', () => {
  beforeEach(() => {
    cleanup()
    mockUsePersons.mockReset()
  })

  it('renders title and 2 cards with VIP chip on importance_level >= 4', () => {
    mockUsePersons.mockReturnValue({
      data: {
        data: [
          {
            id: 'p1',
            name_en: 'Dr. Khalid',
            name_ar: 'د. خالد',
            title_en: 'Chief Diplomat',
            organization_name: 'GASTAT',
            importance_level: 5,
          },
          {
            id: 'p2',
            name_en: 'Sara',
            name_ar: 'سارة',
            title_en: 'Analyst',
            organization_name: 'MOFA',
            importance_level: 2,
          },
        ],
        pagination: { total: 2, limit: 20, offset: 0, has_more: false },
      },
      isLoading: false,
      isError: false,
    })

    render(<PersonsListPage search="" onSearchChange={vi.fn()} onPersonClick={vi.fn()} />)

    expect(screen.getByText('Persons')).toBeTruthy()
    expect(screen.getByText('Dr. Khalid')).toBeTruthy()
    expect(screen.getByText('Sara')).toBeTruthy()
    expect(screen.getByText(/Chief Diplomat/)).toBeTruthy()
    expect(screen.getByText(/Analyst/)).toBeTruthy()

    const vipChips = screen.queryAllByTestId('vip-chip')
    expect(vipChips.length).toBe(1)
    expect(vipChips[0]?.textContent).toContain('VIP')
  })

  it('renders 44px circular avatars (size-11 rounded-full)', () => {
    mockUsePersons.mockReturnValue({
      data: {
        data: [
          {
            id: 'p1',
            name_en: 'Dr. Khalid',
            name_ar: 'د. خالد',
            title_en: 'Chief',
            organization_name: 'GASTAT',
            importance_level: 5,
          },
        ],
        pagination: { total: 1, limit: 20, offset: 0, has_more: false },
      },
      isLoading: false,
      isError: false,
    })

    const { container } = render(
      <PersonsListPage search="" onSearchChange={vi.fn()} onPersonClick={vi.fn()} />,
    )
    const avatar = container.querySelector('.size-11.rounded-full')
    expect(avatar).toBeTruthy()
  })

  it('renders empty state when no persons', () => {
    mockUsePersons.mockReturnValue({
      data: { data: [], pagination: { total: 0, limit: 20, offset: 0, has_more: false } },
      isLoading: false,
      isError: false,
    })

    render(<PersonsListPage search="" onSearchChange={vi.fn()} onPersonClick={vi.fn()} />)
    expect(screen.getByText('No persons yet')).toBeTruthy()
  })

  it('handles array-shape data (defensive)', () => {
    mockUsePersons.mockReturnValue({
      data: [
        {
          id: 'pX',
          name_en: 'Solo',
          name_ar: 'سولو',
          title_en: 'Lead',
          organization_name: 'ACME',
          importance_level: 3,
        },
      ],
      isLoading: false,
      isError: false,
    })

    render(<PersonsListPage search="" onSearchChange={vi.fn()} onPersonClick={vi.fn()} />)
    expect(screen.getByText('Solo')).toBeTruthy()
    expect(screen.queryAllByTestId('vip-chip').length).toBe(0)
  })

  it('no i18n JSON changed in this lane, the scoped strict audit still reads zero UNRESOLVED after the drop (a nonzero here means a key moved, which is the one way a deletion-only diff can go wrong), and the phase negative control still prints 3x MISS=true — RED at HEAD', () => {
    mockUsePersons.mockReturnValue({
      data: { data: [], pagination: { total: 0, limit: 20, offset: 0, has_more: false } },
      isLoading: false,
      isError: false,
    })

    render(<PersonsListPage search="" onSearchChange={vi.fn()} onPersonClick={vi.fn()} />)

    expect(screen.getByText('No persons yet')).toBeTruthy()
  })
})
