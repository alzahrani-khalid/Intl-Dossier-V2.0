import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MonitoringDashboard from '@/pages/monitoring/Dashboard'

describe('MonitoringDashboard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (url: any) => {
      if (String(url).includes('/monitoring/health')) {
        return new Response(JSON.stringify({
          status: 'healthy',
          services: {
            api: { status: 'healthy', latency_ms: 10, last_check: new Date().toISOString() },
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (String(url).includes('/monitoring/alerts')) {
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      return new Response('{}', { status: 200 })
    }))
  })

  it('renders headings', async () => {
    render(<MonitoringDashboard />)
    expect(await screen.findByText(/Monitoring Dashboard/i)).toBeInTheDocument()
    expect(await screen.findByText(/Health/i)).toBeInTheDocument()
  })
})

