import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AccessibilitySettings from '@/components/settings/AccessibilitySettings'

describe('AccessibilitySettings', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (url: any, init?: any) => {
      if (String(url).includes('/accessibility/preferences') && (!init || init.method !== 'POST')) {
        return new Response(JSON.stringify({
          high_contrast: false,
          large_text: false,
          reduce_motion: false,
          screen_reader: false,
          keyboard_only: false,
          focus_indicators: 'default'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (init?.method === 'POST') {
        return new Response(JSON.stringify({ ...JSON.parse(init.body as any) }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      return new Response('{}', { status: 200 })
    }))
  })

  it('renders title', async () => {
    render(<AccessibilitySettings />)
    expect(await screen.findByText(/Accessibility Preferences/i)).toBeInTheDocument()
  })
})

