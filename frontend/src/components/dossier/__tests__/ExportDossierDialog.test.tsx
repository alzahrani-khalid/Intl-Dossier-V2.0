import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'

// Mutable test state — each test sets these before rendering.
let mockLanguage = 'en'
let mockFailedSections: string[] = []
let mockProgress: {
  status: string
  progress: number
  message_en: string
  message_ar: string
} | null = null

// EN copy the dialog renders (mirrors src/i18n/en/dossier-export.json values the
// tests assert against). The `t` mock returns the real string for keys it knows,
// otherwise the defaultValue, otherwise the key itself.
const enCopy: Record<string, string> = {
  title: 'Export Briefing Pack',
  description: 'Export all dossier information as a formatted briefing packet.',
  'format.html_info':
    "Exports as a print-ready HTML briefing pack. To save as PDF, use your browser's print dialog.",
  'language.label': 'Language',
  'language.en': 'English',
  'language.ar': 'Arabic',
  'advanced.label': 'Advanced Options',
  export: 'Export',
  cancel: 'Close',
}

vi.mock('react-i18next', () => ({
  useTranslation: (): {
    t: (k: string, opts?: { defaultValue?: string; sections?: string }) => string
    i18n: { language: string }
  } => ({
    t: (k: string, opts?: { defaultValue?: string; sections?: string }): string => {
      if (k === 'warning.failedSections') {
        return `Some sections could not be generated: ${opts?.sections ?? ''}`
      }
      if (k in enCopy) return enCopy[k]
      if (opts?.defaultValue !== undefined) return opts.defaultValue
      return k
    },
    i18n: { language: mockLanguage },
  }),
  Trans: ({ children }: { children: ReactNode }): ReactNode => children,
}))

vi.mock('@/hooks/useDirection', () => ({
  useDirection: (): { direction: 'ltr' | 'rtl'; isRTL: boolean } => ({
    direction: mockLanguage === 'ar' ? 'rtl' : 'ltr',
    isRTL: mockLanguage === 'ar',
  }),
}))

const exportDossierMock = vi.fn()
const resetMock = vi.fn()

vi.mock('@/hooks/useDossierExport', () => ({
  useDossierExport: (): Record<string, unknown> => ({
    exportDossier: exportDossierMock,
    quickExport: vi.fn(),
    progress: mockProgress,
    isExporting: false,
    error: null,
    failedSections: mockFailedSections,
    reset: resetMock,
  }),
}))

import { ExportDossierDialog } from '../ExportDossierDialog'

const baseProps = {
  dossierId: 'dossier-1',
  dossierName: 'Saudi Arabia',
  dossierType: 'country' as const,
  open: true,
  onClose: vi.fn(),
}

describe('ExportDossierDialog', () => {
  beforeEach(() => {
    mockLanguage = 'en'
    mockFailedSections = []
    mockProgress = null
    exportDossierMock.mockReset()
    resetMock.mockReset()
  })

  it('renders no PDF or Word format option (EXPORT-01)', () => {
    render(<ExportDossierDialog {...baseProps} />)
    expect(screen.queryByText('PDF')).toBeNull()
    expect(screen.queryByText('Word')).toBeNull()
    expect(document.querySelector('input[value="pdf"]')).toBeNull()
    expect(document.querySelector('input[value="docx"]')).toBeNull()
  })

  it('renders exactly two language options, EN and AR, with no Bilingual (D-04)', () => {
    render(<ExportDossierDialog {...baseProps} />)
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('Arabic')).toBeInTheDocument()
    expect(screen.queryByText('Bilingual')).toBeNull()
    const langRadios = document.querySelectorAll('button[role="radio"]')
    expect(langRadios.length).toBe(2)
  })

  it('renders the HTML info line (D-03)', () => {
    render(<ExportDossierDialog {...baseProps} />)
    expect(screen.getByText(enCopy['format.html_info'])).toBeInTheDocument()
  })

  it('defaults the selected language to the current UI language (D-04)', () => {
    mockLanguage = 'ar'
    const { unmount } = render(<ExportDossierDialog {...baseProps} />)
    const arRadio = document.querySelector('#lang-ar') as HTMLElement | null
    const enRadio = document.querySelector('#lang-en') as HTMLElement | null
    expect(arRadio?.getAttribute('aria-checked')).toBe('true')
    expect(enRadio?.getAttribute('aria-checked')).toBe('false')
    unmount()

    mockLanguage = 'en'
    render(<ExportDossierDialog {...baseProps} />)
    const enRadio2 = document.querySelector('#lang-en') as HTMLElement | null
    const arRadio2 = document.querySelector('#lang-ar') as HTMLElement | null
    expect(enRadio2?.getAttribute('aria-checked')).toBe('true')
    expect(arRadio2?.getAttribute('aria-checked')).toBe('false')
  })

  it('shows a failed-sections warning banner in the ready state (D-08)', () => {
    mockFailedSections = ['positions', 'mous']
    mockProgress = {
      status: 'ready',
      progress: 100,
      message_en: 'Export complete',
      message_ar: 'اكتمل التصدير',
    }
    render(<ExportDossierDialog {...baseProps} />)
    const alert = screen.getByRole('alert')
    expect(within(alert).getByText(/positions, mous/)).toBeInTheDocument()
  })
})
