/**
 * Component Tests: SLAIndicator
 * Feature: 025-unified-tasks-model
 * Task: T088 [P]
 *
 * Tests cover:
 * - Current status color coding
 * - Badge and detailed display modes
 * - Accessibility labels and responsive classes
 * - Direction-provider integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders as render, screen, waitFor } from '@tests/utils/render'
import { SLAIndicator } from '../../src/components/tasks/SLAIndicator'

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

describe('SLAIndicator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.dir = 'ltr'
    document.documentElement.lang = 'en'
  })

  const renderSLAIndicator = (props = {}) => {
    const defaultProps = {
      deadline: null,
      isCompleted: false,
      completedAt: null,
      mode: 'badge' as const,
      ...props,
    }

    return render(<SLAIndicator {...defaultProps} />)
  }

  const getBadge = () => screen.getByRole('status')

  describe('Color Coding', () => {
    it('shows green safe status for a task with more than 24 hours remaining and low elapsed time', () => {
      const safeDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      renderSLAIndicator({ deadline: safeDeadline })

      const indicator = getBadge()
      expect(indicator).toHaveClass('bg-green-100')
      expect(indicator).toHaveTextContent('Safe')
    })

    it('shows amber approaching status for a task due within 24 hours', () => {
      const approachingDeadline = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString()
      renderSLAIndicator({ deadline: approachingDeadline })

      const indicator = getBadge()
      expect(indicator).toHaveClass('bg-amber-100')
      expect(indicator).toHaveTextContent('Approaching')
    })

    it('shows yellow warning status when the seven-day SLA window is at least 75 percent elapsed', () => {
      const warningDeadline = new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString()
      renderSLAIndicator({ deadline: warningDeadline })

      const indicator = getBadge()
      expect(indicator).toHaveClass('bg-yellow-100')
      expect(indicator).toHaveTextContent('Warning')
    })

    it('shows red breached status for overdue tasks', () => {
      const breachedDeadline = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      renderSLAIndicator({ deadline: breachedDeadline })

      const indicator = getBadge()
      expect(indicator).toHaveClass('bg-red-100')
      expect(indicator).toHaveTextContent('Breached')
    })

    it('shows blue completed-on-time status for tasks completed before the deadline', () => {
      const futureDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const completedAt = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()

      renderSLAIndicator({
        deadline: futureDeadline,
        isCompleted: true,
        completedAt,
      })

      const indicator = getBadge()
      expect(indicator).toHaveClass('bg-blue-100')
      expect(indicator).toHaveTextContent('Completed on time')
    })

    it('shows gray completed-late status for tasks completed after the deadline', () => {
      const pastDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const completedAt = new Date().toISOString()

      renderSLAIndicator({
        deadline: pastDeadline,
        isCompleted: true,
        completedAt,
      })

      const indicator = getBadge()
      expect(indicator).toHaveClass('bg-gray-100')
      expect(indicator).toHaveTextContent('Completed late')
    })

    it('does not render when no deadline is provided', () => {
      renderSLAIndicator({ deadline: null })

      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  describe('Display Modes', () => {
    it('renders as a compact status badge in badge mode', () => {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      renderSLAIndicator({ deadline, mode: 'badge' })

      const indicator = getBadge()
      expect(indicator).toHaveClass('inline-flex', 'rounded-full')
    })

    it('renders detailed SLA information in detailed mode', () => {
      const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      renderSLAIndicator({ deadline, mode: 'detailed' })

      const region = screen.getByRole('region')
      expect(region).toHaveAttribute('aria-labelledby', 'sla-info-title')
      expect(screen.getByRole('heading', { name: 'Safe' })).toBeInTheDocument()
      expect(screen.getByText('Deadline')).toBeInTheDocument()
      expect(screen.getByText(/remaining/i)).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has a status role and translated aria-label describing SLA state', () => {
      const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      renderSLAIndicator({ deadline })

      const indicator = getBadge()
      expect(indicator).toHaveAttribute('aria-label', 'Safe')
    })

    it('hides the decorative status icon from assistive technology', () => {
      const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      renderSLAIndicator({ deadline })

      const icon = getBadge().querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Mobile Responsiveness', () => {
    it('uses mobile-first touch target classes in badge mode', () => {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      renderSLAIndicator({ deadline })

      const indicator = getBadge()
      expect(indicator).toHaveClass('min-h-11', 'min-w-11')
    })

    it('uses responsive spacing classes in detailed mode', () => {
      const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      renderSLAIndicator({ deadline, mode: 'detailed' })

      const region = screen.getByRole('region')
      expect(region).toHaveClass('sm:gap-3', 'md:flex-row')
    })
  })

  describe('RTL Support', () => {
    it('uses direction-provider state to flip badge row and icon direction', async () => {
      localStorage.setItem('id.locale', 'ar')
      const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      renderSLAIndicator({ deadline })

      await waitFor(() => {
        expect(getBadge()).toHaveClass('flex-row-reverse')
      })

      const icon = getBadge().querySelector('svg')
      expect(icon).toHaveClass('rotate-180')
      expect(getBadge()).not.toHaveAttribute('dir')
    })
  })
})
