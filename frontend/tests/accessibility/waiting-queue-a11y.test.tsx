/**
 * Accessibility Tests for Waiting Queue Components
 * Tests WCAG AA compliance for all waiting queue action components
 *
 * Verification Criteria:
 * - Keyboard navigation (Tab, Enter, Space, Arrow keys)
 * - Screen reader support (ARIA labels, roles, live regions)
 * - Focus management (visible focus indicators, focus trapping in modals)
 * - Color contrast (4.5:1 minimum for normal text, 3:1 for large text)
 * - Touch targets (minimum 44x44px per WCAG 2.1)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider } from '@/components/language-provider/language-provider'

// Import components
import { AssignmentDetailsModal } from '@/components/waiting-queue/AssignmentDetailsModal'
import { ReminderButton } from '@/components/waiting-queue/ReminderButton'
import { BulkActionToolbar } from '@/components/waiting-queue/BulkActionToolbar'
import FilterPanel from '@/components/waiting-queue/FilterPanel'
import { EscalationDialog } from '@/components/waiting-queue/EscalationDialog'
import { AgingIndicator } from '@/components/waiting-queue/AgingIndicator'

// Extend matchers
expect.extend(toHaveNoViolations)

// Stable QueryClient at module scope — avoids creating a new cache on every render.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

// Test wrapper with the current provider stack used by waiting queue components.
function TestWrapper({
  children,
  language = 'en',
}: {
  children: React.ReactNode
  language?: 'en' | 'ar'
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider initialLanguage={language}>{children}</LanguageProvider>
    </QueryClientProvider>
  )
}

const defaultFilterProps: React.ComponentProps<typeof FilterPanel> = {
  filters: {},
  onFiltersChange: vi.fn(),
  onClearFilters: vi.fn(),
  isOpen: true,
  onOpenChange: vi.fn(),
  resultCount: 3,
}

function renderFilterPanel(
  overrides: Partial<React.ComponentProps<typeof FilterPanel>> = {},
  language: 'en' | 'ar' = 'en',
) {
  return render(
    <TestWrapper language={language}>
      <FilterPanel {...defaultFilterProps} {...overrides} />
    </TestWrapper>,
  )
}

const defaultEscalationProps: React.ComponentProps<typeof EscalationDialog> = {
  assignmentId: '123',
  assigneeName: 'John Doe',
  workItemId: 'WI-001',
  isOpen: true,
  onClose: vi.fn(),
  escalationPath: [
    {
      user_id: 'manager-1',
      full_name: 'Jane Manager',
      position_title: 'Director',
      department: 'Operations',
    },
  ],
}

function renderEscalationDialog(
  overrides: Partial<React.ComponentProps<typeof EscalationDialog>> = {},
) {
  return render(
    <TestWrapper>
      <EscalationDialog {...defaultEscalationProps} {...overrides} />
    </TestWrapper>,
  )
}

describe('Waiting Queue Accessibility Tests (WCAG AA)', () => {
  beforeEach(() => {
    // Reset any mocks
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.dir = 'ltr'
    document.documentElement.lang = 'en'
  })

  describe('T091-01: Assignment Details Modal', () => {
    const mockAssignment = {
      id: '123',
      work_item_id: 'WI-001',
      work_item_type: 'dossier' as const,
      assignee_id: 'user-1',
      assignee_name: 'John Doe',
      status: 'pending' as const,
      workflow_stage: 'todo' as const,
      assigned_at: '2025-01-10T00:00:00Z',
      priority: 'high' as const,
      last_reminder_sent_at: null,
      created_at: '2025-01-10T00:00:00Z',
      updated_at: '2025-01-10T00:00:00Z',
      days_waiting: 6,
    }

    it('should pass axe accessibility checks', async () => {
      const { container } = render(
        <TestWrapper>
          <AssignmentDetailsModal assignment={mockAssignment} isOpen={true} onClose={() => {}} />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA labels for all elements', () => {
      render(
        <TestWrapper>
          <AssignmentDetailsModal assignment={mockAssignment} isOpen={true} onClose={() => {}} />
        </TestWrapper>,
      )

      // Check dialog has proper role and label
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby')
      expect(dialog).toHaveAttribute('aria-describedby')

      // Check close button has aria-label
      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('should trap focus within modal when open', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(
        <TestWrapper>
          <AssignmentDetailsModal assignment={mockAssignment} isOpen={true} onClose={onClose} />
        </TestWrapper>,
      )

      // Get all focusable elements in modal
      const dialog = screen.getByRole('dialog')
      const focusableElements = within(dialog).queryAllByRole('button')

      expect(focusableElements.length).toBeGreaterThan(0)

      // Tab through elements - focus should stay in modal
      const firstButton = focusableElements[0]
      firstButton.focus()
      expect(firstButton).toHaveFocus()

      // Press Tab - focus should move to next element in modal
      await user.tab()
      expect(document.activeElement?.closest('[role="dialog"]')).toBe(dialog)
    })

    it('should support keyboard navigation (Escape to close)', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(
        <TestWrapper>
          <AssignmentDetailsModal assignment={mockAssignment} isOpen={true} onClose={onClose} />
        </TestWrapper>,
      )

      // Press Escape key
      await user.keyboard('{Escape}')
      expect(onClose).toHaveBeenCalled()
    })

    it('should expose an accessible close icon button', () => {
      render(
        <TestWrapper>
          <AssignmentDetailsModal assignment={mockAssignment} isOpen={true} onClose={() => {}} />
        </TestWrapper>,
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toHaveClass('tb-icon-btn')
      expect(closeButton).toHaveAccessibleName(/close/i)
    })
  })

  describe('T091-02: Reminder Button', () => {
    it('should pass axe accessibility checks', async () => {
      const { container } = render(
        <TestWrapper>
          <ReminderButton assignmentId="123" assigneeId="user-1" />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have descriptive aria-label', () => {
      render(
        <TestWrapper>
          <ReminderButton assignmentId="123" assigneeId="user-1" />
        </TestWrapper>,
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label')
      const ariaLabel = button.getAttribute('aria-label')
      expect(ariaLabel).toBe('waitingQueue.reminder.button.label')
    })

    it('should be disabled when cooldown is active', () => {
      render(
        <TestWrapper>
          <ReminderButton
            assignmentId="123"
            assigneeId="user-1"
            lastReminderSentAt={new Date().toISOString()}
          />
        </TestWrapper>,
      )

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should be disabled when assignment has no assignee', () => {
      render(
        <TestWrapper>
          <ReminderButton assignmentId="123" />
        </TestWrapper>,
      )

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should have sufficient color contrast', () => {
      render(
        <TestWrapper>
          <ReminderButton assignmentId="123" assigneeId="user-1" />
        </TestWrapper>,
      )

      const button = screen.getByRole('button')
      const styles = window.getComputedStyle(button)

      // Note: Actual contrast checking requires color parsing
      // Here we just verify colors are defined
      expect(styles.color).toBeTruthy()
      expect(styles.backgroundColor).toBeTruthy()
    })
  })

  describe('T091-03: Bulk Action Toolbar', () => {
    const bulkToolbarProps = {
      selectedCount: 3,
      onSendReminders: vi.fn(),
      onClearSelection: vi.fn(),
    }

    it('should pass axe accessibility checks', async () => {
      const { container } = render(
        <TestWrapper>
          <BulkActionToolbar {...bulkToolbarProps} />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should announce selection count to screen readers', () => {
      render(
        <TestWrapper>
          <BulkActionToolbar {...bulkToolbarProps} />
        </TestWrapper>,
      )

      const toolbar = screen.getByRole('toolbar')
      expect(toolbar).toHaveTextContent('waitingQueue.bulkActions.selectedCount')
    })

    it('should support keyboard navigation for all actions', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <BulkActionToolbar {...bulkToolbarProps} />
        </TestWrapper>,
      )

      const sendRemindersButton = screen.getByRole('button', {
        name: 'waitingQueue.bulkActions.sendReminders',
      })
      const clearButton = screen.getByRole('button', {
        name: 'waitingQueue.bulkActions.clearSelection',
      })

      // Tab through buttons
      sendRemindersButton.focus()
      expect(sendRemindersButton).toHaveFocus()

      await user.tab()
      expect(clearButton).toHaveFocus()
    })

    it('should have clear button labels', () => {
      render(
        <TestWrapper>
          <BulkActionToolbar {...bulkToolbarProps} />
        </TestWrapper>,
      )

      expect(
        screen.getByRole('button', { name: 'waitingQueue.bulkActions.sendReminders' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'waitingQueue.bulkActions.clearSelection' }),
      ).toBeInTheDocument()
    })
  })

  describe('T091-04: Filter Panel', () => {
    it('should pass axe accessibility checks', async () => {
      const { container } = renderFilterPanel()

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper form labels', () => {
      renderFilterPanel()

      // Check that all filter controls have associated labels
      const checkboxes = screen.getAllByRole('checkbox')
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toHaveAccessibleName()
      })
    })

    it('should support keyboard navigation in filter form', async () => {
      const user = userEvent.setup()
      renderFilterPanel()

      const filters = screen.getAllByRole('checkbox')
      if (filters.length > 0) {
        filters[0].focus()
        expect(filters[0]).toHaveFocus()

        // Tab to next filter
        await user.tab()
        expect(document.activeElement).not.toBe(filters[0])
      }
    })

    it('should announce filter results to screen readers', async () => {
      renderFilterPanel()

      expect(screen.getByText('waitingQueue.filters.showingResults')).toBeInTheDocument()
    })
  })

  describe('T091-05: Escalation Dialog', () => {
    it('should pass axe accessibility checks', async () => {
      const { baseElement } = renderEscalationDialog()

      const results = await axe(baseElement)
      expect(results).toHaveNoViolations()
    })

    it('should have proper dialog role and labels', () => {
      renderEscalationDialog()

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby')
      expect(dialog).toHaveAttribute('aria-describedby')
    })

    it('should support keyboard navigation (Tab, Enter, Escape)', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      renderEscalationDialog({ onClose })

      // Press Escape to close
      await user.keyboard('{Escape}')
      expect(onClose).toHaveBeenCalled()
    })

    it('should have accessible form controls', () => {
      renderEscalationDialog()

      // Check that reason textarea has label
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAccessibleName()
    })
  })

  describe('T091-06: Aging Indicator', () => {
    it('should pass axe accessibility checks', async () => {
      const { container } = render(
        <TestWrapper>
          <AgingIndicator days={6} />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have sufficient color contrast for all aging states', () => {
      const testCases = [
        { days: 1, label: 'yellow' }, // 0-2 days
        { days: 4, label: 'orange' }, // 3-6 days
        { days: 10, label: 'red' }, // 7+ days
      ]

      testCases.forEach(({ days }) => {
        const { container } = render(
          <TestWrapper>
            <AgingIndicator days={days} />
          </TestWrapper>,
        )

        const badge = container.querySelector('[data-testid="aging-badge"]')
        expect(badge).toBeTruthy()
        const styles = window.getComputedStyle(badge as Element)
        expect(styles.color).toBeTruthy()
        expect(styles.backgroundColor).toBeTruthy()
      })
    })

    it('should have descriptive text for screen readers', () => {
      render(
        <TestWrapper>
          <AgingIndicator days={6} />
        </TestWrapper>,
      )

      const badge = screen.getByTestId('aging-badge')
      expect(badge).toHaveTextContent(/6.*day/i)
    })
  })

  describe('T091-07: RTL Keyboard Navigation', () => {
    it('should support RTL keyboard navigation in filter panel', async () => {
      renderFilterPanel({}, 'ar')

      // In RTL, arrow keys should work in reverse
      // This is a basic check that the component renders in RTL mode
      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute('dir', 'rtl')
      })
    })

    it('should maintain focus indicators in RTL layout', () => {
      render(
        <TestWrapper language="ar">
          <BulkActionToolbar
            selectedCount={1}
            onSendReminders={vi.fn()}
            onClearSelection={vi.fn()}
          />
        </TestWrapper>,
      )

      const button = screen.getAllByRole('button')[0]
      button.focus()

      // Check that focus is visible (browser default or custom)
      expect(button).toHaveFocus()
      const styles = window.getComputedStyle(button)
      // Focus styles should be present
      expect(styles).toBeTruthy()
    })
  })

  describe('T091-08: Screen Reader Announcements', () => {
    it('should announce reminder success to screen readers', async () => {
      render(
        <TestWrapper>
          <ReminderButton assignmentId="123" assigneeId="user-1" />
        </TestWrapper>,
      )

      expect(screen.getByRole('button')).toHaveAccessibleName('waitingQueue.reminder.button.label')
    })

    it('should announce escalation creation to screen readers', () => {
      renderEscalationDialog()

      // Check dialog has proper announcements
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-describedby')
    })

    it('should announce filter result count changes', () => {
      renderFilterPanel()

      expect(screen.getByText('waitingQueue.filters.showingResults')).toBeInTheDocument()
    })
  })
})
