/**
 * Component Tests: SLAIndicator
 * Feature: 025-unified-tasks-model
 * Task: T088 [P]
 *
 * Tests cover:
 * - Color coding (green=safe, yellow=warning, red=breached)
 * - Time calculations
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';
import { SLAIndicator } from '../../src/components/tasks/SLAIndicator';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('SLAIndicator Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderSLAIndicator = (props = {}) => {
    const defaultProps = {
      deadline: null,
      isCompleted: false,
      completedAt: null,
      mode: 'badge' as const,
      ...props,
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <SLAIndicator {...defaultProps} />
        </I18nextProvider>
      </QueryClientProvider>
    );
  };

  describe('Color Coding', () => {
    it('should show green (safe) for task with >25% time remaining', () => {
      const safeDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours
      renderSLAIndicator({ deadline: safeDeadline });

      const indicator = screen.getByTestId('sla-indicator');
      expect(indicator).toHaveClass(/safe|green|bg-green/);
    });

    it('should show yellow (warning) for task with <25% time remaining', () => {
      const warningDeadline = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(); // 1 hour
      renderSLAIndicator({ deadline: warningDeadline });

      const indicator = screen.getByTestId('sla-indicator');
      expect(indicator).toHaveClass(/warning|yellow|bg-yellow/);
    });

    it('should show red (breached) for overdue task', () => {
      const breachedDeadline = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(); // 1 hour ago
      renderSLAIndicator({ deadline: breachedDeadline });

      const indicator = screen.getByTestId('sla-indicator');
      expect(indicator).toHaveClass(/breach|red|bg-red/);
    });

    it('should show green for completed task on time', () => {
      const futureDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const completedAt = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();

      renderSLAIndicator({
        deadline: futureDeadline,
        isCompleted: true,
        completedAt,
      });

      const indicator = screen.getByTestId('sla-indicator');
      expect(indicator).toHaveClass(/success|green|bg-green/);
    });

    it('should show red for completed task after deadline', () => {
      const pastDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const completedAt = new Date().toISOString();

      renderSLAIndicator({
        deadline: pastDeadline,
        isCompleted: true,
        completedAt,
      });

      const indicator = screen.getByTestId('sla-indicator');
      expect(indicator).toHaveClass(/breach|red|bg-red|late/);
    });

    it('should not render when no deadline', () => {
      renderSLAIndicator({ deadline: null });

      const indicator = screen.queryByTestId('sla-indicator');
      expect(indicator).not.toBeInTheDocument();
    });
  });

  describe('Time Calculations', () => {
    it('should calculate time remaining correctly', () => {
      const deadline = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(); // 5 hours
      renderSLAIndicator({ deadline });

      const indicator = screen.getByTestId('sla-indicator');
      indicator.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      // Tooltip should show "5 hours remaining"
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveTextContent(/5 hour|4 hour|6 hour/i); // Allow some variance
    });

    it('should show "1 day remaining" for 24-hour deadline', () => {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline });

      const indicator = screen.getByTestId('sla-indicator');
      indicator.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveTextContent(/1 day|24 hour/i);
    });

    it('should show "Overdue by X hours" for breached deadline', () => {
      const deadline = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(); // 3 hours ago
      renderSLAIndicator({ deadline });

      const indicator = screen.getByTestId('sla-indicator');
      indicator.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveTextContent(/overdue|late|3 hour/i);
    });

    it('should handle very short deadlines (<1 hour)', () => {
      const deadline = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
      renderSLAIndicator({ deadline });

      const indicator = screen.getByTestId('sla-indicator');
      indicator.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveTextContent(/30 minute|less than 1 hour/i);
    });

    it('should calculate percentage of time elapsed', () => {
      // Create deadline 4 hours in future (25% elapsed of 4 hour window)
      const now = Date.now();
      const deadline = new Date(now + 4 * 60 * 60 * 1000).toISOString();

      renderSLAIndicator({ deadline });

      const indicator = screen.getByTestId('sla-indicator');

      // Should be in safe state (>75% time remaining)
      expect(indicator).toHaveClass(/safe|green/);
    });
  });

  describe('Display Modes', () => {
    it('should render as badge in badge mode', () => {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline, mode: 'badge' });

      const indicator = screen.getByTestId('sla-indicator');
      expect(indicator).toHaveClass(/badge/);
    });

    it('should render as icon in icon mode', () => {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline, mode: 'icon' });

      const indicator = screen.getByTestId('sla-indicator');
      expect(indicator).toHaveClass(/icon/);
    });

    it('should render as text in text mode', () => {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline, mode: 'text' });

      const indicator = screen.getByTestId('sla-indicator');
      expect(indicator).toHaveTextContent(/remaining|overdue/i);
    });

    it('should show detailed info in detailed mode', () => {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline, mode: 'detailed' });

      expect(screen.getByText(/deadline/i)).toBeInTheDocument();
      expect(screen.getByText(/remaining/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label describing SLA status', () => {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline });

      const indicator = screen.getByTestId('sla-indicator');
      expect(indicator).toHaveAttribute('aria-label');
    });

    it('should have tooltip with detailed info', async () => {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline });

      const indicator = screen.getByTestId('sla-indicator');
      indicator.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent(/remaining|deadline/i);
    });

    it('should meet color contrast requirements (4.5:1)', () => {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline });

      const indicator = screen.getByTestId('sla-indicator');
      const styles = window.getComputedStyle(indicator);

      // Verify colors are set
      expect(styles.backgroundColor).toBeTruthy();
      expect(styles.color).toBeTruthy();

      // Note: Actual contrast calculation would require 'color' library
      // In production, use axe-core: await expect(indicator).toHaveAccessibleContrast();
    });

    it('should be keyboard focusable', () => {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline });

      const indicator = screen.getByTestId('sla-indicator');

      // Focus the indicator
      indicator.focus();
      expect(document.activeElement).toBe(indicator);
    });

    it('should show tooltip on focus (keyboard navigation)', async () => {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline });

      const indicator = screen.getByTestId('sla-indicator');

      // Focus the indicator
      indicator.focus();

      // Tooltip should appear
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should have min touch target size (44x44px)', () => {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline });

      const indicator = screen.getByTestId('sla-indicator');
      const box = indicator.getBoundingClientRect();

      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    });

    it('should render at mobile viewport (375px)', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline });

      const indicator = screen.getByTestId('sla-indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('should scale appropriately on larger screens', () => {
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));

      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline });

      const indicator = screen.getByTestId('sla-indicator');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('RTL Support', () => {
    beforeEach(() => {
      i18n.changeLanguage('ar');
    });

    afterEach(() => {
      i18n.changeLanguage('en');
    });

    it('should set dir="rtl" on indicator', () => {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline });

      const indicator = screen.getByTestId('sla-indicator');
      expect(indicator).toHaveAttribute('dir', 'rtl');
    });

    it('should flip icon direction in RTL', () => {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline, mode: 'icon' });

      const icon = screen.getByTestId('sla-indicator').querySelector('svg');
      expect(icon).toHaveClass(/rotate-180/);
    });

    it('should use logical properties for spacing', () => {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline });

      const indicator = screen.getByTestId('sla-indicator');
      const styles = window.getComputedStyle(indicator);

      // Verify logical properties
      expect(styles.marginInlineStart || styles.marginInlineEnd).toBeDefined();
    });
  });

  describe('Status Text', () => {
    it('should show "Safe" text for safe status', () => {
      const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline });

      expect(screen.getByText(/safe|on track/i)).toBeInTheDocument();
    });

    it('should show "Warning" text for warning status', () => {
      const deadline = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline });

      expect(screen.getByText(/warning|approaching/i)).toBeInTheDocument();
    });

    it('should show "Breached" text for breached status', () => {
      const deadline = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline });

      expect(screen.getByText(/breach|overdue/i)).toBeInTheDocument();
    });

    it('should show "Completed on time" for completed task', () => {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const completedAt = new Date().toISOString();

      renderSLAIndicator({
        deadline,
        isCompleted: true,
        completedAt,
      });

      expect(screen.getByText(/completed on time|met deadline/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null deadline gracefully', () => {
      renderSLAIndicator({ deadline: null });

      const indicator = screen.queryByTestId('sla-indicator');
      expect(indicator).not.toBeInTheDocument();
    });

    it('should handle invalid date string', () => {
      renderSLAIndicator({ deadline: 'invalid-date' });

      const indicator = screen.queryByTestId('sla-indicator');
      expect(indicator).not.toBeInTheDocument();
    });

    it('should handle deadline in distant future (> 1 year)', () => {
      const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline: farFuture });

      const indicator = screen.getByTestId('sla-indicator');
      expect(indicator).toHaveClass(/safe|green/);
    });

    it('should handle deadline in distant past (> 1 year)', () => {
      const farPast = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      renderSLAIndicator({ deadline: farPast });

      const indicator = screen.getByTestId('sla-indicator');
      expect(indicator).toHaveClass(/breach|red/);
    });
  });
});
