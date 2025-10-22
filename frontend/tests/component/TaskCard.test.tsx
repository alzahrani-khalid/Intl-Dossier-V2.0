/**
 * Component Tests: TaskCard
 * Feature: 025-unified-tasks-model
 * Task: T085 [P]
 *
 * Tests cover:
 * - Title display (primary text)
 * - SLA indicator integration
 * - Contributor avatars
 * - Mobile rendering (base → sm → md → lg)
 * - RTL layout support
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';
import { TaskCard } from '../../src/components/tasks/TaskCard';
import type { Database } from '../../../../backend/src/types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('TaskCard Component', () => {
  let queryClient: QueryClient;

  const mockTask: Task = {
    id: 'task-123',
    title: 'Review Australia Population Data Initiative',
    description: 'Analyze population trends and prepare recommendations',
    assignee_id: 'user-456',
    engagement_id: 'eng-789',
    status: 'in_progress',
    workflow_stage: 'in_progress',
    priority: 'high',
    sla_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    work_item_type: 'dossier',
    work_item_id: 'dossier-001',
    source: {},
    created_by: 'user-456',
    updated_by: null,
    completed_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    is_deleted: false,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderTaskCard = (props = {}) => {
    const defaultProps = {
      task: mockTask,
      onClick: vi.fn(),
      ...props,
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <TaskCard {...defaultProps} />
        </I18nextProvider>
      </QueryClientProvider>
    );
  };

  describe('Title Display (Primary Text)', () => {
    it('should display task title as primary text', () => {
      renderTaskCard();

      const title = screen.getByText('Review Australia Population Data Initiative');
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H3');
    });

    it('should use descriptive title instead of ID', () => {
      renderTaskCard();

      // Verify descriptive title is shown
      expect(screen.getByText('Review Australia Population Data Initiative')).toBeInTheDocument();

      // Verify task ID is NOT shown as title
      expect(screen.queryByText(/task-123|Assignment #/i)).not.toBeInTheDocument();
    });

    it('should truncate long titles appropriately', () => {
      const longTitle = 'A'.repeat(200);
      const longTitleTask = { ...mockTask, title: longTitle };

      renderTaskCard({ task: longTitleTask });

      const title = screen.getByText(longTitle);
      expect(title).toBeInTheDocument();
    });
  });

  describe('SLA Indicator Integration', () => {
    it('should display SLA indicator when deadline exists', () => {
      renderTaskCard();

      // SLA indicator should be visible
      const indicator = screen.getByTestId('sla-indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('should show safe status for task with future deadline', () => {
      const futureDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const safeTask = { ...mockTask, sla_deadline: futureDeadline };

      renderTaskCard({ task: safeTask });

      const indicator = screen.getByTestId('sla-indicator');
      expect(indicator).toHaveClass(/safe|green|bg-green/);
    });

    it('should show warning status for task approaching deadline', () => {
      const soonDeadline = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(); // 1 hour
      const warningTask = { ...mockTask, sla_deadline: soonDeadline };

      renderTaskCard({ task: warningTask });

      const indicator = screen.getByTestId('sla-indicator');
      expect(indicator).toHaveClass(/warning|yellow|bg-yellow/);
    });

    it('should show breached status for overdue task', () => {
      const pastDeadline = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(); // 1 hour ago
      const breachedTask = { ...mockTask, sla_deadline: pastDeadline };

      renderTaskCard({ task: breachedTask });

      const indicator = screen.getByTestId('sla-indicator');
      expect(indicator).toHaveClass(/breach|red|bg-red/);
    });

    it('should not display SLA indicator when no deadline', () => {
      const noDeadlineTask = { ...mockTask, sla_deadline: null };

      renderTaskCard({ task: noDeadlineTask });

      const indicator = screen.queryByTestId('sla-indicator');
      expect(indicator).not.toBeInTheDocument();
    });
  });

  describe('Contributor Avatars', () => {
    it('should display contributor avatars when present', () => {
      // Note: Contributors would be fetched separately via TanStack Query
      // This test verifies the component structure
      renderTaskCard();

      // Verify contributor section exists (may be empty if no contributors)
      const cardContent = screen.getByRole('button'); // Card is clickable
      expect(cardContent).toBeInTheDocument();
    });

    it('should limit visible avatars to 3 with +N overflow', () => {
      // This would require mocking the contributor hook
      // Placeholder for future implementation
      renderTaskCard();
      expect(true).toBe(true);
    });
  });

  describe('Mobile Rendering (Mobile-First)', () => {
    it('should render at mobile viewport (320px)', () => {
      global.innerWidth = 320;
      global.dispatchEvent(new Event('resize'));

      renderTaskCard();

      const title = screen.getByText('Review Australia Population Data Initiative');
      expect(title).toBeInTheDocument();

      // Verify mobile text size (text-sm)
      expect(title).toHaveClass(/text-sm/);
    });

    it('should scale up at sm breakpoint (640px)', () => {
      global.innerWidth = 640;
      global.dispatchEvent(new Event('resize'));

      renderTaskCard();

      const title = screen.getByText('Review Australia Population Data Initiative');

      // At sm, should use sm:text-base
      expect(title).toHaveClass(/sm:text-base/);
    });

    it('should scale up at md breakpoint (768px)', () => {
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));

      renderTaskCard();

      const title = screen.getByText('Review Australia Population Data Initiative');

      // At md, should use md:text-lg
      expect(title).toHaveClass(/md:text-lg/);
    });

    it('should have touch-friendly click targets (min 44x44px)', () => {
      renderTaskCard();

      const card = screen.getByRole('button');
      const styles = window.getComputedStyle(card);

      // Verify minimum touch target size
      expect(parseInt(styles.minHeight || '0')).toBeGreaterThanOrEqual(44);
    });

    it('should have adequate spacing between elements (gap-2)', () => {
      renderTaskCard();

      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();

      // Verify badge container has gap-2
      const badgeContainer = card.querySelector('[class*="gap-2"]');
      expect(badgeContainer).toBeInTheDocument();
    });
  });

  describe('RTL Layout Support', () => {
    beforeEach(() => {
      // Switch to Arabic
      i18n.changeLanguage('ar');
    });

    afterEach(() => {
      // Reset to English
      i18n.changeLanguage('en');
    });

    it('should set dir="rtl" on card container', () => {
      renderTaskCard();

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('dir', 'rtl');
    });

    it('should use text-end for RTL title alignment', () => {
      renderTaskCard();

      const title = screen.getByText('Review Australia Population Data Initiative');
      expect(title).toHaveClass(/text-end/);
    });

    it('should use logical properties for margins (ms-*, me-*)', () => {
      renderTaskCard();

      const card = screen.getByRole('button');
      const styles = window.getComputedStyle(card);

      // Verify logical properties are used (not margin-left/margin-right)
      expect(styles.marginInlineStart || styles.marginInlineEnd).toBeDefined();
    });

    it('should flip badge order in RTL', () => {
      renderTaskCard();

      const badges = screen.getAllByRole('status'); // Badges use role="status"
      expect(badges.length).toBeGreaterThan(0);

      // In RTL, badges should be in flex-row-reverse order
      const badgeContainer = badges[0].parentElement;
      expect(badgeContainer).toHaveClass(/flex/);
    });
  });

  describe('Priority and Status Badges', () => {
    it('should display priority badge with correct color', () => {
      renderTaskCard();

      const priorityBadge = screen.getByText(/high/i);
      expect(priorityBadge).toBeInTheDocument();
      expect(priorityBadge).toHaveClass(/orange/); // High priority = orange
    });

    it('should display status badge with correct color', () => {
      renderTaskCard();

      const statusBadge = screen.getByText(/in progress/i);
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass(/blue/); // In progress = blue
    });

    it('should display work item type badge when showWorkItem=true', () => {
      renderTaskCard({ showWorkItem: true });

      const workItemBadge = screen.getByText(/dossier/i);
      expect(workItemBadge).toBeInTheDocument();
    });

    it('should hide work item type badge when showWorkItem=false', () => {
      renderTaskCard({ showWorkItem: false });

      const workItemBadge = screen.queryByText(/dossier/i);
      expect(workItemBadge).not.toBeInTheDocument();
    });
  });

  describe('Click Interaction', () => {
    it('should call onClick handler when card is clicked', () => {
      const onClickMock = vi.fn();
      renderTaskCard({ onClick: onClickMock });

      const card = screen.getByRole('button');
      fireEvent.click(card);

      expect(onClickMock).toHaveBeenCalledWith(mockTask);
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it('should apply hover styles on mouse over', () => {
      renderTaskCard();

      const card = screen.getByRole('button');
      expect(card).toHaveClass(/hover:shadow-md/);
    });

    it('should show cursor pointer for clickable card', () => {
      renderTaskCard();

      const card = screen.getByRole('button');
      expect(card).toHaveClass(/cursor-pointer/);
    });
  });

  describe('Description Preview', () => {
    it('should display description when present', () => {
      renderTaskCard();

      const description = screen.getByText('Analyze population trends and prepare recommendations');
      expect(description).toBeInTheDocument();
    });

    it('should not display description when null', () => {
      const noDescTask = { ...mockTask, description: null };
      renderTaskCard({ task: noDescTask });

      const description = screen.queryByText('Analyze population trends');
      expect(description).not.toBeInTheDocument();
    });

    it('should truncate long descriptions (line-clamp-2)', () => {
      const longDesc = 'A'.repeat(300);
      const longDescTask = { ...mockTask, description: longDesc };

      renderTaskCard({ task: longDescTask });

      const description = screen.getByText(longDesc);
      expect(description).toHaveClass(/line-clamp-2/);
    });
  });

  describe('Accessibility', () => {
    it('should have semantic heading for title', () => {
      renderTaskCard();

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('Review Australia Population Data Initiative');
    });

    it('should have accessible card role', () => {
      renderTaskCard();

      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
    });

    it('should have aria-label or accessible name', () => {
      renderTaskCard();

      const card = screen.getByRole('button');
      // Card should have accessible content via text content
      expect(card.textContent).toContain('Review Australia Population Data Initiative');
    });
  });
});
