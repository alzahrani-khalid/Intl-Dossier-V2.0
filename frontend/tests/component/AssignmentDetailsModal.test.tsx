import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssignmentDetailsModal } from '@/components/waiting-queue/AssignmentDetailsModal';

// Mock assignment data
const mockAssignment = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  work_item_id: 'DOS-2024-001',
  work_item_type: 'dossier' as const,
  assignee_id: 'user-001',
  assignee_name: 'John Doe',
  assignee_email: 'john.doe@gastat.gov.sa',
  status: 'pending' as const,
  workflow_stage: 'todo' as const,
  assigned_at: '2024-01-01T10:00:00Z',
  priority: 'high' as const,
  last_reminder_sent_at: '2024-01-10T14:00:00Z',
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-15T12:00:00Z',
  days_waiting: 14,
};

// Create a fresh query client for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

// Wrapper component with QueryClientProvider
const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('AssignmentDetailsModal', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Rendering', () => {
    it('should render modal with all assignment fields when open', () => {
      render(
        <Wrapper>
          <AssignmentDetailsModal
            assignment={mockAssignment}
            isOpen={true}
            onClose={vi.fn()}
          />
        </Wrapper>
      );

      // Check that modal is visible
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();

      // Verify all key fields are displayed
      expect(screen.getByText(/DOS-2024-001/i)).toBeInTheDocument(); // work_item_id
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument(); // assignee_name
      expect(screen.getByText(/john.doe@gastat.gov.sa/i)).toBeInTheDocument(); // assignee_email
      expect(screen.getByText(/pending/i)).toBeInTheDocument(); // status
      expect(screen.getByText(/high/i)).toBeInTheDocument(); // priority
      expect(screen.getByText(/14/)).toBeInTheDocument(); // days_waiting
    });

    it('should not render modal when isOpen is false', () => {
      render(
        <Wrapper>
          <AssignmentDetailsModal
            assignment={mockAssignment}
            isOpen={false}
            onClose={vi.fn()}
          />
        </Wrapper>
      );

      // Modal should not be in the document
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display aging indicator with correct color (14 days = orange)', () => {
      render(
        <Wrapper>
          <AssignmentDetailsModal
            assignment={mockAssignment}
            isOpen={true}
            onClose={vi.fn()}
          />
        </Wrapper>
      );

      // Aging badge should be visible
      const agingBadge = screen.getByText(/14/);
      expect(agingBadge).toBeInTheDocument();

      // 7+ days should have warning/orange color (check class or data attribute)
      expect(agingBadge.closest('[data-aging-level]')).toHaveAttribute('data-aging-level', 'warning');
    });

    it('should display last reminder sent timestamp if available', () => {
      render(
        <Wrapper>
          <AssignmentDetailsModal
            assignment={mockAssignment}
            isOpen={true}
            onClose={vi.fn()}
          />
        </Wrapper>
      );

      // Last reminder timestamp should be formatted and displayed
      expect(screen.getByText(/Last Reminder/i)).toBeInTheDocument();
      expect(screen.getByText(/Jan.*10.*2024/i)).toBeInTheDocument(); // Formatted date
    });

    it('should display "No reminder sent" when last_reminder_sent_at is null', () => {
      const assignmentWithoutReminder = {
        ...mockAssignment,
        last_reminder_sent_at: null,
      };

      render(
        <Wrapper>
          <AssignmentDetailsModal
            assignment={assignmentWithoutReminder}
            isOpen={true}
            onClose={vi.fn()}
          />
        </Wrapper>
      );

      expect(screen.getByText(/No reminder sent/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const handleClose = vi.fn();

      render(
        <Wrapper>
          <AssignmentDetailsModal
            assignment={mockAssignment}
            isOpen={true}
            onClose={handleClose}
          />
        </Wrapper>
      );

      // Find and click the close button (X icon)
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      // Verify onClose was called
      expect(handleClose).toHaveBeenCalledOnce();
    });

    it('should call onClose when clicking outside modal (overlay)', async () => {
      const handleClose = vi.fn();

      render(
        <Wrapper>
          <AssignmentDetailsModal
            assignment={mockAssignment}
            isOpen={true}
            onClose={handleClose}
          />
        </Wrapper>
      );

      // Click the overlay (outside the modal content)
      const overlay = screen.getByRole('dialog').parentElement;
      if (overlay) {
        await user.click(overlay);
      }

      // Verify onClose was called
      await waitFor(() => {
        expect(handleClose).toHaveBeenCalled();
      });
    });

    it('should close modal when pressing Escape key', async () => {
      const handleClose = vi.fn();

      render(
        <Wrapper>
          <AssignmentDetailsModal
            assignment={mockAssignment}
            isOpen={true}
            onClose={handleClose}
          />
        </Wrapper>
      );

      // Press Escape key
      await user.keyboard('{Escape}');

      // Verify onClose was called
      await waitFor(() => {
        expect(handleClose).toHaveBeenCalled();
      });
    });
  });

  describe('RTL Layout Support', () => {
    it('should apply RTL direction when Arabic locale is active', () => {
      // Mock i18n to return Arabic locale
      vi.mock('react-i18next', async () => {
        const actual = await vi.importActual('react-i18next');
        return {
          ...actual,
          useTranslation: () => ({
            t: (key: string) => key,
            i18n: { language: 'ar' },
          }),
        };
      });

      render(
        <Wrapper>
          <AssignmentDetailsModal
            assignment={mockAssignment}
            isOpen={true}
            onClose={vi.fn()}
          />
        </Wrapper>
      );

      // Modal content should have dir="rtl"
      const modalContent = screen.getByRole('dialog');
      expect(modalContent).toHaveAttribute('dir', 'rtl');
    });

    it('should apply LTR direction when English locale is active', () => {
      render(
        <Wrapper>
          <AssignmentDetailsModal
            assignment={mockAssignment}
            isOpen={true}
            onClose={vi.fn()}
          />
        </Wrapper>
      );

      // Modal content should have dir="ltr" (default)
      const modalContent = screen.getByRole('dialog');
      expect(modalContent).toHaveAttribute('dir', 'ltr');
    });

    it('should use logical properties (ps-*, pe-*) for spacing in RTL', () => {
      render(
        <Wrapper>
          <AssignmentDetailsModal
            assignment={mockAssignment}
            isOpen={true}
            onClose={vi.fn()}
          />
        </Wrapper>
      );

      // Check that modal uses logical properties (not ml-*, mr-*)
      const modalContent = screen.getByRole('dialog');
      const classNames = modalContent.className;

      // Should not contain directional properties
      expect(classNames).not.toMatch(/\bml-/);
      expect(classNames).not.toMatch(/\bmr-/);
      expect(classNames).not.toMatch(/\bpl-/);
      expect(classNames).not.toMatch(/\bpr-/);

      // Should use logical properties
      expect(classNames).toMatch(/\b(ps|pe|ms|me)-/);
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should be touch-friendly (minimum 44x44px touch targets)', () => {
      render(
        <Wrapper>
          <AssignmentDetailsModal
            assignment={mockAssignment}
            isOpen={true}
            onClose={vi.fn()}
          />
        </Wrapper>
      );

      // Close button should meet minimum touch target size
      const closeButton = screen.getByRole('button', { name: /close/i });
      const styles = window.getComputedStyle(closeButton);
      const minSize = 44; // WCAG 2.1 minimum

      expect(parseInt(styles.minHeight) || parseInt(styles.height)).toBeGreaterThanOrEqual(minSize);
      expect(parseInt(styles.minWidth) || parseInt(styles.width)).toBeGreaterThanOrEqual(minSize);
    });

    it('should apply mobile-first responsive classes', () => {
      render(
        <Wrapper>
          <AssignmentDetailsModal
            assignment={mockAssignment}
            isOpen={true}
            onClose={vi.fn()}
          />
        </Wrapper>
      );

      const modalContent = screen.getByRole('dialog');
      const classNames = modalContent.className;

      // Should use base styles with progressive enhancement (sm:, md:, lg:)
      expect(classNames).toMatch(/\b(sm|md|lg):/);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible modal label', () => {
      render(
        <Wrapper>
          <AssignmentDetailsModal
            assignment={mockAssignment}
            isOpen={true}
            onClose={vi.fn()}
          />
        </Wrapper>
      );

      // Modal should have aria-label or aria-labelledby
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-labelledby');
    });

    it('should trap focus within modal when open', async () => {
      render(
        <Wrapper>
          <AssignmentDetailsModal
            assignment={mockAssignment}
            isOpen={true}
            onClose={vi.fn()}
          />
        </Wrapper>
      );

      // Tab through interactive elements
      await user.keyboard('{Tab}');

      // Focus should be within modal
      const modal = screen.getByRole('dialog');
      expect(modal).toContainElement(document.activeElement);
    });
  });
});
