import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Lightweight mocks to avoid full provider trees and cross-package React mismatch.
vi.mock('@/components/theme-provider/theme-provider', () => ({
  useTheme: () => ({ theme: 'gastat', colorMode: 'light' }),
  ThemeProvider: ({ children }: any) => <>{children}</>,
}))

vi.mock('@/components/language-provider/language-provider', () => ({
  useLanguage: () => ({ language: 'ar', direction: 'rtl', setLanguage: () => {} }),
  LanguageProvider: ({ children }: any) => <>{children}</>,
}))
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { DesignComplianceProvider } from '@/providers/design-compliance-provider'
import { ThemeProvider } from '@/components/theme-provider/theme-provider'
import { LanguageProvider } from '@/components/language-provider/language-provider'
import { useCompliance } from '@/hooks/use-compliance'

function Runner({ html, name }: { html: string; name: string }) {
  const { validateHtml, lastResult } = useCompliance()
  beforeEach(() => {
    document.documentElement.dir = 'rtl'
  })
  React.useEffect(() => {
    void validateHtml(name, html)
  }, [html, name, validateHtml])
  return (
    <div>
      <div data-testid="passed">{String(lastResult?.passed)}</div>
      <div data-testid="count">{lastResult?.results.length ?? 0}</div>
    </div>
  )
}

describe('Component registry validation (fallback)', () => {
  it('detects RTL direction conflict in HTML', async () => {
    render(
      <LanguageProvider>
        <ThemeProvider>
          <DesignComplianceProvider>
            <Runner name="TestCard" html={'<div dir="ltr">Hello</div>'} />
          </DesignComplianceProvider>
        </ThemeProvider>
      </LanguageProvider>
    )

    await waitFor(() => expect(screen.getByTestId('passed').textContent).toBe('false'))
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('passes when no issues found', async () => {
    render(
      <LanguageProvider>
        <ThemeProvider>
          <DesignComplianceProvider>
            <Runner name="TestCard" html={'<div>مرحبا</div>'} />
          </DesignComplianceProvider>
        </ThemeProvider>
      </LanguageProvider>
    )

    await waitFor(() => expect(screen.getByTestId('passed').textContent).toBe('true'))
    expect(screen.getByTestId('count').textContent).toBe('0')
  })
})
