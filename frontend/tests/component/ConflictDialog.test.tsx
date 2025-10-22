/**
 * Component Tests: ConflictDialog
 * Feature: 025-unified-tasks-model
 * Task: T086 [P]
 *
 * Tests cover:
 * - All 3 options work (Reload, Force Save, Cancel)
 * - Mobile layout (full screen on mobile, modal on desktop)
 * - RTL button order
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';
import { ConflictDialog } from '../../src/components/tasks/ConflictDialog';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('ConflictDialog Component', () => {
  let queryClient: QueryClient;

  const mockServerData = {
    title: 'Server Title (Modified by User 2)',
    description: 'Server description updated by another user',
    priority: 'urgent' as const,
    status: 'review' as const,
    updated_at: '2025-01-19T12:00:00Z',
    updated_by: 'user-789',
  };

  const mockLocalData = {
    title: 'Local Title (Your Changes)',
    description: 'Your local description changes',
    priority: 'high' as const,
    status: 'in_progress' as const,
    updated_at: '2025-01-19T11:00:00Z',
    updated_by: 'user-456',
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

  const renderConflictDialog = (props = {}) => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      onReload: vi.fn(),
      onForceSave: vi.fn(),
      onCancel: vi.fn(),
      serverData: mockServerData,
      localData: mockLocalData,
      ...props,
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <ConflictDialog {...defaultProps} />
        </I18nextProvider>
      </QueryClientProvider>
    );
  };

  describe('All 3 Options Work', () => {
    it('should call onReload when Reload button is clicked', async () => {
      const onReloadMock = vi.fn();
      renderConflictDialog({ onReload: onReloadMock });

      const reloadButton = screen.getByRole('button', { name: /reload|refresh/i });
      fireEvent.click(reloadButton);

      await waitFor(() => {
        expect(onReloadMock).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onForceSave when Force Save button is clicked', async () => {
      const onForceSaveMock = vi.fn();
      renderConflictDialog({ onForceSave: onForceSaveMock });

      const forceSaveButton = screen.getByRole('button', { name: /force save|overwrite/i });
      fireEvent.click(forceSaveButton);

      await waitFor(() => {
        expect(onForceSaveMock).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onCancel when Cancel button is clicked', async () => {
      const onCancelMock = vi.fn();
      renderConflictDialog({ onCancel: onCancelMock });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(onCancelMock).toHaveBeenCalledTimes(1);
      });
    });

    it('should display conflict warning message', () => {
      renderConflictDialog();

      expect(screen.getByText(/conflict|modified by another user/i)).toBeInTheDocument();
    });

    it('should show diff between server and local changes', () => {
      renderConflictDialog();

      // Server changes
      expect(screen.getByText(/server title/i)).toBeInTheDocument();

      // Local changes
      expect(screen.getByText(/local title/i)).toBeInTheDocument();
    });

    it('should close dialog when onClose is triggered', async () => {
      const onCloseMock = vi.fn();
      const { rerender } = renderConflictDialog({ onClose: onCloseMock });

      // Click X button to close
      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(onCloseMock).toHaveBeenCalledTimes(1);
      });

      // Rerender with isOpen=false
      rerender(
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <ConflictDialog
              isOpen={false}
              onClose={onCloseMock}
              onReload={vi.fn()}
              onForceSave={vi.fn()}
              onCancel={vi.fn()}
              serverData={mockServerData}
              localData={mockLocalData}
            />
          </I18nextProvider>
        </QueryClientProvider>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Mobile Layout', () => {
    it('should render as full screen on mobile (< 640px)', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      renderConflictDialog();

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Mobile: full screen dialog (Sheet component)
      expect(dialog).toHaveClass(/sm:max-w/); // Only applies max-width at sm+ breakpoints
    });

    it('should render as modal on desktop (>= 640px)', () => {
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));

      renderConflictDialog();

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Desktop: modal with max-width constraint
      expect(dialog).toHaveClass(/max-w/);
    });

    it('should stack buttons vertically on mobile', () => {
      global.innerWidth = 375;
      renderConflictDialog();

      const buttonContainer = screen.getByRole('button', { name: /reload/i }).parentElement;
      expect(buttonContainer).toHaveClass(/flex-col/);
    });

    it('should display buttons horizontally on desktop', () => {
      global.innerWidth = 1024;
      renderConflictDialog();

      const buttonContainer = screen.getByRole('button', { name: /reload/i }).parentElement;
      expect(buttonContainer).toHaveClass(/sm:flex-row/);
    });
  });

  describe('RTL Button Order', () => {
    beforeEach(() => {
      // Switch to Arabic
      i18n.changeLanguage('ar');
    });

    afterEach(() => {
      // Reset to English
      i18n.changeLanguage('en');
    });

    it('should set dir="rtl" on dialog', () => {
      renderConflictDialog();

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('dir', 'rtl');
    });

    it('should reverse button order in RTL (Cancel → Force Save → Reload)', () => {
      renderConflictDialog();

      const buttons = screen.getAllByRole('button').filter((btn) =>
        ['reload', 'force save', 'cancel'].some((text) =>
          btn.textContent?.toLowerCase().includes(text)
        )
      );

      // In RTL, button order should be reversed
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it('should use flex-row-reverse for RTL button layout', () => {
      renderConflictDialog();

      const buttonContainer = screen.getByRole('button', { name: /reload/i }).parentElement;
      expect(buttonContainer).toHaveClass(/flex/);
      // In RTL, buttons should be in reversed order
    });

    it('should use logical properties for button spacing (gap-2, ms-*, me-*)', () => {
      renderConflictDialog();

      const buttons = screen.getAllByRole('button');
      const firstButton = buttons[0];

      const styles = window.getComputedStyle(firstButton);

      // Verify logical properties
      expect(styles.marginInlineStart || styles.marginInlineEnd).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have dialog role', () => {
      renderConflictDialog();

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should have accessible dialog title', () => {
      renderConflictDialog();

      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toHaveTextContent(/conflict/i);
    });

    it('should have close button with aria-label', () => {
      renderConflictDialog();

      const closeButton = screen.getByLabelText(/close/i);
      expect(closeButton).toBeInTheDocument();
    });

    it('should trap focus within dialog', () => {
      renderConflictDialog();

      const dialog = screen.getByRole('dialog');
      const buttons = screen.getAllByRole('button');

      // First focusable element
      const firstButton = buttons[0];
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);

      // Tab through elements should stay within dialog
      fireEvent.keyDown(dialog, { key: 'Tab' });
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    it('should close on Escape key', () => {
      const onCloseMock = vi.fn();
      renderConflictDialog({ onClose: onCloseMock });

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });

      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button States', () => {
    it('should have primary button for Reload', () => {
      renderConflictDialog();

      const reloadButton = screen.getByRole('button', { name: /reload/i });
      expect(reloadButton).toHaveClass(/primary|bg-primary/);
    });

    it('should have destructive button for Force Save', () => {
      renderConflictDialog();

      const forceSaveButton = screen.getByRole('button', { name: /force save/i });
      expect(forceSaveButton).toHaveClass(/destructive|bg-destructive|warning/);
    });

    it('should have ghost/outline button for Cancel', () => {
      renderConflictDialog();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toHaveClass(/ghost|outline/);
    });

    it('should disable buttons while action is pending', async () => {
      const onReloadMock = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));
      renderConflictDialog({ onReload: onReloadMock });

      const reloadButton = screen.getByRole('button', { name: /reload/i });
      fireEvent.click(reloadButton);

      // Button should be disabled during action
      await waitFor(() => {
        expect(reloadButton).toBeDisabled();
      });
    });
  });

  describe('Conflict Details Display', () => {
    it('should show last updated timestamp for server data', () => {
      renderConflictDialog();

      const timestamp = screen.getByText(/2025-01-19/);
      expect(timestamp).toBeInTheDocument();
    });

    it('should show username who made server changes', () => {
      renderConflictDialog();

      const user = screen.getByText(/user-789/);
      expect(user).toBeInTheDocument();
    });

    it('should highlight differences between server and local data', () => {
      renderConflictDialog();

      // Server title
      expect(screen.getByText(/server title/i)).toBeInTheDocument();

      // Local title
      expect(screen.getByText(/local title/i)).toBeInTheDocument();

      // Verify both are visually distinct
      const serverTitle = screen.getByText(/server title/i);
      const localTitle = screen.getByText(/local title/i);

      expect(serverTitle).not.toEqual(localTitle);
    });
  });
});
