import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BulkActionToolbar } from '@/components/waiting-queue/BulkActionToolbar';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'bulk_actions.selected': `${options?.count || 0} items selected`,
        'bulk_actions.send_reminders': 'Send Reminders',
        'bulk_actions.clear_selection': 'Clear Selection',
        'bulk_actions.select_all': 'Select All',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
    },
  }),
}));

describe('BulkActionToolbar Component Tests (T041)', () => {
  const mockOnSendReminders = vi.fn();
  const mockOnClearSelection = vi.fn();
  const mockOnSelectAll = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render toolbar with selection count', () => {
      render(
        <BulkActionToolbar
          selectedCount={5}
          totalCount={20}
          onSendReminders={mockOnSendReminders}
          onClearSelection={mockOnClearSelection}
          onSelectAll={mockOnSelectAll}
        />
      );

      expect(screen.getByText('5 items selected')).toBeInTheDocument();
    });

    it('should render Send Reminders button', () => {
      render(
        <BulkActionToolbar
          selectedCount={3}
          totalCount={20}
          onSendReminders={mockOnSendReminders}
          onClearSelection={mockOnClearSelection}
          onSelectAll={mockOnSelectAll}
        />
      );

      const sendButton = screen.getByText('Send Reminders');
      expect(sendButton).toBeInTheDocument();
      expect(sendButton).toHaveClass('h-11'); // Touch-friendly height (44px min)
    });

    it('should render Clear Selection button', () => {
      render(
        <BulkActionToolbar
          selectedCount={2}
          totalCount={20}
          onSendReminders={mockOnSendReminders}
          onClearSelection={mockOnClearSelection}
          onSelectAll={mockOnSelectAll}
        />
      );

      expect(screen.getByText('Clear Selection')).toBeInTheDocument();
    });

    it('should render Select All button', () => {
      render(
        <BulkActionToolbar
          selectedCount={2}
          totalCount={20}
          onSendReminders={mockOnSendReminders}
          onClearSelection={mockOnClearSelection}
          onSelectAll={mockOnSelectAll}
        />
      );

      expect(screen.getByText('Select All')).toBeInTheDocument();
    });

    it('should not render toolbar when selectedCount is 0', () => {
      const { container } = render(
        <BulkActionToolbar
          selectedCount={0}
          totalCount={20}
          onSendReminders={mockOnSendReminders}
          onClearSelection={mockOnClearSelection}
          onSelectAll={mockOnSelectAll}
        />
      );

      // Toolbar should be hidden when no items selected
      expect(container.querySelector('[data-state="visible"]')).toBeNull();
    });
  });

  describe('Interactions', () => {
    it('should call onSendReminders when Send Reminders button clicked', () => {
      render(
        <BulkActionToolbar
          selectedCount={5}
          totalCount={20}
          onSendReminders={mockOnSendReminders}
          onClearSelection={mockOnClearSelection}
          onSelectAll={mockOnSelectAll}
        />
      );

      const sendButton = screen.getByText('Send Reminders');
      fireEvent.click(sendButton);

      expect(mockOnSendReminders).toHaveBeenCalledTimes(1);
    });

    it('should call onClearSelection when Clear Selection button clicked', () => {
      render(
        <BulkActionToolbar
          selectedCount={3}
          totalCount={20}
          onSendReminders={mockOnSendReminders}
          onClearSelection={mockOnClearSelection}
          onSelectAll={mockOnSelectAll}
        />
      );

      const clearButton = screen.getByText('Clear Selection');
      fireEvent.click(clearButton);

      expect(mockOnClearSelection).toHaveBeenCalledTimes(1);
    });

    it('should call onSelectAll when Select All button clicked', () => {
      render(
        <BulkActionToolbar
          selectedCount={5}
          totalCount={20}
          onSendReminders={mockOnSendReminders}
          onClearSelection={mockOnClearSelection}
          onSelectAll={mockOnSelectAll}
        />
      );

      const selectAllButton = screen.getByText('Select All');
      fireEvent.click(selectAllButton);

      expect(mockOnSelectAll).toHaveBeenCalledTimes(1);
    });

    it('should disable Send Reminders button when loading', () => {
      render(
        <BulkActionToolbar
          selectedCount={3}
          totalCount={20}
          onSendReminders={mockOnSendReminders}
          onClearSelection={mockOnClearSelection}
          onSelectAll={mockOnSelectAll}
          isLoading={true}
        />
      );

      const sendButton = screen.getByText('Send Reminders');
      expect(sendButton).toBeDisabled();
    });

    it('should disable Send Reminders when selectedCount exceeds max (100)', () => {
      render(
        <BulkActionToolbar
          selectedCount={101}
          totalCount={150}
          onSendReminders={mockOnSendReminders}
          onClearSelection={mockOnClearSelection}
          onSelectAll={mockOnSelectAll}
        />
      );

      const sendButton = screen.getByText('Send Reminders');
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Mobile-First Responsive Design', () => {
    it('should have mobile-first base styles (no sm: prefix)', () => {
      render(
        <BulkActionToolbar
          selectedCount={2}
          totalCount={20}
          onSendReminders={mockOnSendReminders}
          onClearSelection={mockOnClearSelection}
          onSelectAll={mockOnSelectAll}
        />
      );

      const toolbar = screen.getByRole('toolbar', { hidden: true });
      // Base classes (mobile-first) should include flex-col, gap-2, px-4
      expect(toolbar).toHaveClass('flex-col');
      expect(toolbar).toHaveClass('gap-2');
      expect(toolbar).toHaveClass('px-4');
    });

    it('should have touch-friendly button sizes (44x44px min)', () => {
      render(
        <BulkActionToolbar
          selectedCount={3}
          totalCount={20}
          onSendReminders={mockOnSendReminders}
          onClearSelection={mockOnClearSelection}
          onSelectAll={mockOnSelectAll}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        // h-11 = 44px height (WCAG 2.1 minimum touch target)
        expect(button).toHaveClass('h-11');
      });
    });
  });

  describe('RTL Support', () => {
    it('should apply RTL-safe logical properties (ps-*, pe-*, ms-*, me-*)', () => {
      render(
        <BulkActionToolbar
          selectedCount={2}
          totalCount={20}
          onSendReminders={mockOnSendReminders}
          onClearSelection={mockOnClearSelection}
          onSelectAll={mockOnSelectAll}
        />
      );

      const toolbar = screen.getByRole('toolbar', { hidden: true });
      const toolbarClasses = toolbar.className;

      // Should NOT contain ml-*, mr-*, pl-*, pr-*
      expect(toolbarClasses).not.toMatch(/\bml-/);
      expect(toolbarClasses).not.toMatch(/\bmr-/);
      expect(toolbarClasses).not.toMatch(/\bpl-/);
      expect(toolbarClasses).not.toMatch(/\bpr-/);

      // Should contain logical properties
      expect(toolbarClasses).toMatch(/\b(ps-|pe-|ms-|me-)/);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <BulkActionToolbar
          selectedCount={3}
          totalCount={20}
          onSendReminders={mockOnSendReminders}
          onClearSelection={mockOnClearSelection}
          onSelectAll={mockOnSelectAll}
        />
      );

      const toolbar = screen.getByRole('toolbar', { hidden: true });
      expect(toolbar).toHaveAttribute('aria-label', 'Bulk actions');
    });

    it('should announce selection count to screen readers', () => {
      render(
        <BulkActionToolbar
          selectedCount={5}
          totalCount={20}
          onSendReminders={mockOnSendReminders}
          onClearSelection={mockOnClearSelection}
          onSelectAll={mockOnSelectAll}
        />
      );

      const selectionText = screen.getByText('5 items selected');
      expect(selectionText).toHaveAttribute('aria-live', 'polite');
    });

    it('should have descriptive button labels for screen readers', () => {
      render(
        <BulkActionToolbar
          selectedCount={3}
          totalCount={20}
          onSendReminders={mockOnSendReminders}
          onClearSelection={mockOnClearSelection}
          onSelectAll={mockOnSelectAll}
        />
      );

      const sendButton = screen.getByText('Send Reminders');
      expect(sendButton).toHaveAttribute('aria-label', 'Send reminders to 3 selected assignments');
    });
  });

  describe('Edge Cases', () => {
    it('should handle selectedCount === totalCount (all selected)', () => {
      render(
        <BulkActionToolbar
          selectedCount={20}
          totalCount={20}
          onSendReminders={mockOnSendReminders}
          onClearSelection={mockOnClearSelection}
          onSelectAll={mockOnSelectAll}
        />
      );

      expect(screen.getByText('20 items selected')).toBeInTheDocument();
      // Select All button should be disabled when all items already selected
      const selectAllButton = screen.getByText('Select All');
      expect(selectAllButton).toBeDisabled();
    });

    it('should handle selectedCount === 1 (singular item)', () => {
      render(
        <BulkActionToolbar
          selectedCount={1}
          totalCount={20}
          onSendReminders={mockOnSendReminders}
          onClearSelection={mockOnClearSelection}
          onSelectAll={mockOnSelectAll}
        />
      );

      // Should still show "1 items selected" (translation handles singular/plural)
      expect(screen.getByText('1 items selected')).toBeInTheDocument();
    });

    it('should handle totalCount === 0 (empty list)', () => {
      render(
        <BulkActionToolbar
          selectedCount={0}
          totalCount={0}
          onSendReminders={mockOnSendReminders}
          onClearSelection={mockOnClearSelection}
          onSelectAll={mockOnSelectAll}
        />
      );

      // Toolbar should not render when no items in list
      const toolbar = screen.queryByRole('toolbar', { hidden: true });
      expect(toolbar).toBeNull();
    });
  });
});
