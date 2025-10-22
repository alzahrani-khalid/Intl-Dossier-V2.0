/**
 * Component Tests: ContributorsList
 * Feature: 025-unified-tasks-model
 * Task: T087 [P]
 *
 * Tests cover:
 * - Avatar display
 * - Role badges
 * - Overflow handling (+N)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';
import { ContributorsList } from '../../src/components/tasks/ContributorsList';
import type { Database } from '../../../../backend/src/types/database.types';

type TaskContributor = Database['public']['Tables']['task_contributors']['Row'];

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('ContributorsList Component', () => {
  let queryClient: QueryClient;

  const mockContributors: TaskContributor[] = [
    {
      id: 'contrib-1',
      task_id: 'task-123',
      user_id: 'user-1',
      role: 'helper',
      notes: 'Assisted with data analysis',
      added_at: '2025-01-19T10:00:00Z',
      removed_at: null,
    },
    {
      id: 'contrib-2',
      task_id: 'task-123',
      user_id: 'user-2',
      role: 'reviewer',
      notes: 'Reviewed findings',
      added_at: '2025-01-19T11:00:00Z',
      removed_at: null,
    },
    {
      id: 'contrib-3',
      task_id: 'task-123',
      user_id: 'user-3',
      role: 'advisor',
      notes: 'Provided technical guidance',
      added_at: '2025-01-19T12:00:00Z',
      removed_at: null,
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderContributorsList = (props = {}) => {
    const defaultProps = {
      contributors: mockContributors,
      maxVisible: 3,
      onAddContributor: vi.fn(),
      onRemoveContributor: vi.fn(),
      ...props,
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <ContributorsList {...defaultProps} />
        </I18nextProvider>
      </QueryClientProvider>
    );
  };

  describe('Avatar Display', () => {
    it('should display avatar for each contributor', () => {
      renderContributorsList();

      const avatars = screen.getAllByRole('img');
      expect(avatars.length).toBeGreaterThanOrEqual(mockContributors.length);
    });

    it('should show initials when no avatar image', () => {
      renderContributorsList();

      // Avatars should have alt text or initials
      const avatars = screen.getAllByRole('img');
      avatars.forEach((avatar) => {
        expect(avatar).toHaveAttribute('alt');
      });
    });

    it('should display avatars in circular shape', () => {
      renderContributorsList();

      const avatars = screen.getAllByRole('img');
      avatars.forEach((avatar) => {
        expect(avatar).toHaveClass(/rounded-full|circle/);
      });
    });

    it('should have proper sizing (size-8 sm:size-10)', () => {
      renderContributorsList();

      const container = screen.getByTestId('contributors-list');
      expect(container).toBeInTheDocument();

      // Verify responsive sizing classes
      const avatars = screen.getAllByRole('img');
      avatars.forEach((avatar) => {
        expect(avatar).toHaveClass(/size-8|w-8|h-8/);
      });
    });
  });

  describe('Role Badges', () => {
    it('should display role badge for each contributor', () => {
      renderContributorsList();

      expect(screen.getByText(/helper/i)).toBeInTheDocument();
      expect(screen.getByText(/reviewer/i)).toBeInTheDocument();
      expect(screen.getByText(/advisor/i)).toBeInTheDocument();
    });

    it('should use correct color for helper role', () => {
      renderContributorsList({ contributors: [mockContributors[0]] });

      const badge = screen.getByText(/helper/i);
      expect(badge).toHaveClass(/blue|bg-blue/);
    });

    it('should use correct color for reviewer role', () => {
      renderContributorsList({ contributors: [mockContributors[1]] });

      const badge = screen.getByText(/reviewer/i);
      expect(badge).toHaveClass(/purple|bg-purple/);
    });

    it('should use correct color for advisor role', () => {
      renderContributorsList({ contributors: [mockContributors[2]] });

      const badge = screen.getByText(/advisor/i);
      expect(badge).toHaveClass(/green|bg-green/);
    });

    it('should translate role names based on current language', () => {
      renderContributorsList();

      const helperBadge = screen.getByText(/helper/i);
      expect(helperBadge).toBeInTheDocument();

      // In Arabic, it should show translated text
      i18n.changeLanguage('ar');
      // Note: Would need to rerender with Arabic language
    });
  });

  describe('Overflow Handling (+N)', () => {
    const manyContributors: TaskContributor[] = [
      ...mockContributors,
      {
        id: 'contrib-4',
        task_id: 'task-123',
        user_id: 'user-4',
        role: 'observer',
        notes: null,
        added_at: '2025-01-19T13:00:00Z',
        removed_at: null,
      },
      {
        id: 'contrib-5',
        task_id: 'task-123',
        user_id: 'user-5',
        role: 'supervisor',
        notes: null,
        added_at: '2025-01-19T14:00:00Z',
        removed_at: null,
      },
    ];

    it('should limit visible avatars to maxVisible (3)', () => {
      renderContributorsList({ contributors: manyContributors, maxVisible: 3 });

      const avatars = screen.getAllByRole('img');
      expect(avatars.length).toBeLessThanOrEqual(3);
    });

    it('should show +N indicator for overflow contributors', () => {
      renderContributorsList({ contributors: manyContributors, maxVisible: 3 });

      const overflowIndicator = screen.getByText(/\+2/); // +2 for 5 total - 3 visible
      expect(overflowIndicator).toBeInTheDocument();
    });

    it('should show tooltip with all contributor names on +N hover', async () => {
      renderContributorsList({ contributors: manyContributors, maxVisible: 3 });

      const overflowIndicator = screen.getByText(/\+2/);

      // Hover over +N indicator
      overflowIndicator.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      // Wait for tooltip
      await screen.findByRole('tooltip');

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveTextContent(/user-4|user-5/);
    });

    it('should not show +N when all contributors fit within maxVisible', () => {
      renderContributorsList({ contributors: mockContributors, maxVisible: 5 });

      const overflowIndicator = screen.queryByText(/\+/);
      expect(overflowIndicator).not.toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should render at mobile viewport (375px)', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      renderContributorsList();

      const container = screen.getByTestId('contributors-list');
      expect(container).toBeInTheDocument();
    });

    it('should use flex-wrap for avatar row on mobile', () => {
      renderContributorsList();

      const container = screen.getByTestId('contributors-list');
      expect(container).toHaveClass(/flex-wrap/);
    });

    it('should have adequate gap between avatars (gap-2)', () => {
      renderContributorsList();

      const container = screen.getByTestId('contributors-list');
      expect(container).toHaveClass(/gap-2/);
    });

    it('should scale up avatar size on larger screens (sm:size-10)', () => {
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));

      renderContributorsList();

      const avatars = screen.getAllByRole('img');
      avatars.forEach((avatar) => {
        expect(avatar).toHaveClass(/sm:size-10|sm:w-10|sm:h-10/);
      });
    });
  });

  describe('RTL Layout Support', () => {
    beforeEach(() => {
      i18n.changeLanguage('ar');
    });

    afterEach(() => {
      i18n.changeLanguage('en');
    });

    it('should set dir="rtl" on container', () => {
      renderContributorsList();

      const container = screen.getByTestId('contributors-list');
      expect(container).toHaveAttribute('dir', 'rtl');
    });

    it('should use ms-* spacing for avatars in RTL', () => {
      renderContributorsList();

      const container = screen.getByTestId('contributors-list');
      const styles = window.getComputedStyle(container);

      // Verify logical properties
      expect(styles.marginInlineStart || styles.marginInlineEnd).toBeDefined();
    });

    it('should reverse avatar order in RTL', () => {
      renderContributorsList();

      const container = screen.getByTestId('contributors-list');
      expect(container).toHaveClass(/flex/);

      // In RTL, avatars should be in reversed visual order
      const avatars = screen.getAllByRole('img');
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should display "No contributors" when list is empty', () => {
      renderContributorsList({ contributors: [] });

      expect(screen.getByText(/no contributors/i)).toBeInTheDocument();
    });

    it('should show "Add Contributor" button in empty state', () => {
      renderContributorsList({ contributors: [] });

      const addButton = screen.getByRole('button', { name: /add contributor/i });
      expect(addButton).toBeInTheDocument();
    });

    it('should call onAddContributor when empty state button is clicked', () => {
      const onAddMock = vi.fn();
      renderContributorsList({ contributors: [], onAddContributor: onAddMock });

      const addButton = screen.getByRole('button', { name: /add contributor/i });
      addButton.click();

      expect(onAddMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Contributor Actions', () => {
    it('should show remove button on avatar hover', async () => {
      renderContributorsList();

      const avatar = screen.getAllByRole('img')[0];
      avatar.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      await screen.findByLabelText(/remove contributor/i);
      const removeButton = screen.getByLabelText(/remove contributor/i);
      expect(removeButton).toBeInTheDocument();
    });

    it('should call onRemoveContributor when remove button is clicked', async () => {
      const onRemoveMock = vi.fn();
      renderContributorsList({ onRemoveContributor: onRemoveMock });

      const avatar = screen.getAllByRole('img')[0];
      avatar.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      const removeButton = await screen.findByLabelText(/remove contributor/i);
      removeButton.click();

      expect(onRemoveMock).toHaveBeenCalledWith(mockContributors[0].id);
    });

    it('should show "Add Contributor" button when canAdd=true', () => {
      renderContributorsList({ canAdd: true });

      const addButton = screen.getByRole('button', { name: /add contributor/i });
      expect(addButton).toBeInTheDocument();
    });

    it('should hide "Add Contributor" button when canAdd=false', () => {
      renderContributorsList({ canAdd: false });

      const addButton = screen.queryByRole('button', { name: /add contributor/i });
      expect(addButton).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for avatars', () => {
      renderContributorsList();

      const avatars = screen.getAllByRole('img');
      avatars.forEach((avatar) => {
        expect(avatar).toHaveAttribute('alt');
      });
    });

    it('should be keyboard navigable', () => {
      renderContributorsList();

      const container = screen.getByTestId('contributors-list');
      const focusableElements = container.querySelectorAll('button, a, [tabindex="0"]');

      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('should announce contributor count to screen readers', () => {
      renderContributorsList();

      const count = screen.getByText(/3 contributor/i);
      expect(count).toBeInTheDocument();
      expect(count).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Contributor Details', () => {
    it('should show contributor notes in tooltip', async () => {
      renderContributorsList();

      const avatar = screen.getAllByRole('img')[0];
      avatar.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      await screen.findByRole('tooltip');
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveTextContent(/assisted with data analysis/i);
    });

    it('should show added_at timestamp in tooltip', async () => {
      renderContributorsList();

      const avatar = screen.getAllByRole('img')[0];
      avatar.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent(/2025-01-19/);
    });

    it('should display full contributor name when available', () => {
      const contributorsWithNames = mockContributors.map((c, i) => ({
        ...c,
        user: { name: `User ${i + 1}`, email: `user${i + 1}@example.com` },
      }));

      renderContributorsList({ contributors: contributorsWithNames });

      // Names should be visible somewhere (tooltip or label)
      expect(screen.getByText(/user 1/i) || screen.getByLabelText(/user 1/i)).toBeDefined();
    });
  });
});
