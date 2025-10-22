/**
 * Component Test: EscalationDialog
 * Feature: User Story 4 - Assignment Escalation (023-specs-waiting-queue)
 * Purpose: Test EscalationDialog component behavior
 *
 * Tests:
 * - Dialog opens and closes
 * - Displays escalation recipient information
 * - Reason text area input
 * - Confirm escalation action
 * - Mobile-first responsive layout
 * - RTL support for Arabic
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';
import { EscalationDialog } from '../../src/components/waiting-queue/EscalationDialog';

// Mock useEscalationAction hook
vi.mock('../../src/hooks/use-waiting-queue-actions', () => ({
  useEscalationAction: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>{component}</I18nextProvider>
    </QueryClientProvider>
  );
};

describe('EscalationDialog Component', () => {
  const mockAssignment = {
    id: 'test-assignment-id',
    work_item_id: 'test-work-item',
    work_item_type: 'dossier' as const,
    assignee_id: 'test-assignee',
    assignee_name: 'Test Assignee',
    status: 'pending' as const,
    workflow_stage: 'review' as const,
    assigned_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'high' as const,
    days_waiting: 8,
  };

  const mockEscalationPath = [
    {
      user_id: 'manager-id-1',
      full_name: 'Team Lead',
      position_title: 'Team Lead',
      department: 'Analytics',
    },
    {
      user_id: 'manager-id-2',
      full_name: 'Division Manager',
      position_title: 'Division Manager',
      department: 'Analytics',
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    assignment: mockAssignment,
    escalationPath: mockEscalationPath,
    onEscalate: vi.fn(),
    isLoading: false,
  };

  it('should render dialog when open', () => {
    renderWithProviders(<EscalationDialog {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/escalate assignment/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    renderWithProviders(<EscalationDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should display assignment details', () => {
    renderWithProviders(<EscalationDialog {...defaultProps} />);

    expect(screen.getByText(mockAssignment.work_item_id)).toBeInTheDocument();
    expect(screen.getByText(mockAssignment.assignee_name!)).toBeInTheDocument();
    expect(screen.getByText(/8 days/i)).toBeInTheDocument();
  });

  it('should display escalation recipient picker with default selection (immediate manager)', () => {
    renderWithProviders(<EscalationDialog {...defaultProps} />);

    // Should show first in path (Team Lead) as default selection
    expect(screen.getByText(/team lead/i)).toBeInTheDocument();
    expect(screen.getByText(/analytics/i)).toBeInTheDocument();
  });

  it('should allow selecting different escalation recipient', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EscalationDialog {...defaultProps} />);

    // Find and click recipient selector
    const recipientButton = screen.getByRole('button', { name: /team lead/i });
    await user.click(recipientButton);

    // Should show dropdown with all escalation path options
    await waitFor(() => {
      expect(screen.getByText('Division Manager')).toBeInTheDocument();
    });

    // Select Division Manager
    await user.click(screen.getByText('Division Manager'));

    // Verify selection changed
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /division manager/i })).toBeInTheDocument();
    });
  });

  it('should require reason input', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EscalationDialog {...defaultProps} />);

    // Find reason textarea
    const reasonTextarea = screen.getByPlaceholderText(/explain why/i);
    expect(reasonTextarea).toBeInTheDocument();

    // Type reason
    await user.type(reasonTextarea, 'Assignment overdue for 8 days, requires manager attention');

    expect(reasonTextarea).toHaveValue('Assignment overdue for 8 days, requires manager attention');
  });

  it('should call onEscalate with correct data when confirmed', async () => {
    const user = userEvent.setup();
    const onEscalate = vi.fn();

    renderWithProviders(<EscalationDialog {...defaultProps} onEscalate={onEscalate} />);

    // Fill reason
    const reasonTextarea = screen.getByPlaceholderText(/explain why/i);
    await user.type(reasonTextarea, 'Test escalation reason');

    // Click Escalate button
    const escalateButton = screen.getByRole('button', { name: /^escalate$/i });
    await user.click(escalateButton);

    // Verify onEscalate called with assignment ID, recipient ID, and reason
    expect(onEscalate).toHaveBeenCalledWith({
      assignmentId: mockAssignment.id,
      recipientId: mockEscalationPath[0].user_id, // Default to first in path
      reason: 'Test escalation reason',
    });
  });

  it('should disable Escalate button when reason is empty', () => {
    renderWithProviders(<EscalationDialog {...defaultProps} />);

    const escalateButton = screen.getByRole('button', { name: /^escalate$/i });
    expect(escalateButton).toBeDisabled();
  });

  it('should show loading state when isLoading is true', () => {
    renderWithProviders(<EscalationDialog {...defaultProps} isLoading={true} />);

    const escalateButton = screen.getByRole('button', { name: /escalating/i });
    expect(escalateButton).toBeDisabled();
  });

  it('should call onClose when Cancel button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<EscalationDialog {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when dialog dismissed (X button)', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<EscalationDialog {...defaultProps} onClose={onClose} />);

    // Find close button (X in dialog header)
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('Mobile-First Responsive Layout', () => {
    it('should apply mobile-first padding classes', () => {
      const { container } = renderWithProviders(<EscalationDialog {...defaultProps} />);

      const dialogContent = container.querySelector('[role="dialog"]');
      expect(dialogContent).toHaveClass('px-4', 'sm:px-6');
    });

    it('should use responsive text sizing', () => {
      renderWithProviders(<EscalationDialog {...defaultProps} />);

      const title = screen.getByText(/escalate assignment/i);
      expect(title).toHaveClass('text-lg', 'sm:text-xl');
    });

    it('should use responsive button sizing with min touch target', () => {
      renderWithProviders(<EscalationDialog {...defaultProps} />);

      const escalateButton = screen.getByRole('button', { name: /^escalate$/i });
      expect(escalateButton).toHaveClass('h-11', 'min-w-11');
    });
  });

  describe('RTL Support', () => {
    beforeEach(() => {
      i18n.changeLanguage('ar');
    });

    afterEach(() => {
      i18n.changeLanguage('en');
    });

    it('should apply RTL direction when language is Arabic', () => {
      const { container } = renderWithProviders(<EscalationDialog {...defaultProps} />);

      const dialogContent = container.querySelector('[role="dialog"]');
      expect(dialogContent).toHaveAttribute('dir', 'rtl');
    });

    it('should use logical properties for padding (ps-/pe- instead of pl-/pr-)', () => {
      const { container } = renderWithProviders(<EscalationDialog {...defaultProps} />);

      // Check for logical properties in container
      const dialogContent = container.querySelector('[role="dialog"]');
      const classes = dialogContent?.className || '';

      // Should not have pl- or pr- classes
      expect(classes).not.toMatch(/\bpl-/);
      expect(classes).not.toMatch(/\bpr-/);

      // Should have ps- or pe- classes instead
      expect(classes.match(/\b(ps-|pe-)/)).toBeTruthy();
    });

    it('should use text-start instead of text-left', () => {
      renderWithProviders(<EscalationDialog {...defaultProps} />);

      const reasonTextarea = screen.getByPlaceholderText(/explain why/i);
      expect(reasonTextarea).toHaveClass('text-start');
      expect(reasonTextarea).not.toHaveClass('text-left');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when escalation path is empty', () => {
      renderWithProviders(
        <EscalationDialog {...defaultProps} escalationPath={[]} />
      );

      expect(screen.getByText(/no escalation path/i)).toBeInTheDocument();
      const escalateButton = screen.getByRole('button', { name: /^escalate$/i });
      expect(escalateButton).toBeDisabled();
    });

    it('should show NO_ESCALATION_PATH error message to user', () => {
      renderWithProviders(
        <EscalationDialog
          {...defaultProps}
          escalationPath={[]}
        />
      );

      expect(
        screen.getByText(/no manager configured|escalation path not found/i)
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(<EscalationDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EscalationDialog {...defaultProps} />);

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByRole('button', { name: /team lead/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByPlaceholderText(/explain why/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
    });

    it('should trap focus within dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EscalationDialog {...defaultProps} />);

      // Tab to last element
      await user.tab();
      await user.tab();
      await user.tab();

      // One more tab should cycle back to first focusable element
      await user.tab();
      expect(screen.getByRole('button', { name: /close/i })).toHaveFocus();
    });
  });
});
