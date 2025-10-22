import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReminderButton } from '@/components/waiting-queue/ReminderButton';

// Mock toast notifications
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the reminder action hook
vi.mock('@/hooks/use-waiting-queue-actions', () => ({
  useReminderAction: () => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('ReminderButton Component Tests (T028)', () => {
  const mockAssignmentId = '123e4567-e89b-12d3-a456-426614174000';
  const mockAssignmentWithNoAssignee = '223e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render reminder button with correct text', () => {
      render(<ReminderButton assignmentId={mockAssignmentId} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText(/follow up/i)).toBeInTheDocument();
    });

    it('should render with mobile-first sizing (min 44x44px)', () => {
      render(<ReminderButton assignmentId={mockAssignmentId} />, {
        wrapper: createWrapper(),
      });

      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);

      // Verify touch-friendly minimum size
      expect(button.className).toContain('min-h-11'); // 44px minimum height
      expect(button.className).toContain('min-w-11'); // 44px minimum width
    });

    it('should support RTL layout with logical properties', () => {
      render(<ReminderButton assignmentId={mockAssignmentId} />, {
        wrapper: createWrapper(),
      });

      const button = screen.getByRole('button');

      // Verify no directional properties used
      expect(button.className).not.toMatch(/ml-|mr-|pl-|pr-/);
      // Should use logical properties if any spacing
      expect(button.className).toMatch(/ms-|me-|ps-|pe-|px-|py-|p-/);
    });
  });

  describe('User Interactions', () => {
    it('should call mutation when clicked', async () => {
      const mockMutate = vi.fn();
      vi.mocked(useReminderAction).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      });

      const user = userEvent.setup();
      render(<ReminderButton assignmentId={mockAssignmentId} />, {
        wrapper: createWrapper(),
      });

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockMutate).toHaveBeenCalledWith(mockAssignmentId);
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    it('should show loading state during mutation', () => {
      vi.mocked(useReminderAction).mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
        isSuccess: false,
        isError: false,
        error: null,
      });

      render(<ReminderButton assignmentId={mockAssignmentId} />, {
        wrapper: createWrapper(),
      });

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText(/sending/i)).toBeInTheDocument();
    });

    it('should disable button during pending state', () => {
      vi.mocked(useReminderAction).mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
        isSuccess: false,
        isError: false,
        error: null,
      });

      render(<ReminderButton assignmentId={mockAssignmentId} />, {
        wrapper: createWrapper(),
      });

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Success Handling', () => {
    it('should display success toast on successful reminder send', async () => {
      const mockToast = vi.fn();
      vi.mocked(useToast).mockReturnValue({ toast: mockToast });

      vi.mocked(useReminderAction).mockReturnValue({
        mutate: vi.fn((_, { onSuccess }) => {
          onSuccess?.();
        }),
        isPending: false,
        isSuccess: true,
        isError: false,
        error: null,
      });

      const user = userEvent.setup();
      render(<ReminderButton assignmentId={mockAssignmentId} />, {
        wrapper: createWrapper(),
      });

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringMatching(/success/i),
            variant: 'default',
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error toast on cooldown active error', async () => {
      const mockToast = vi.fn();
      vi.mocked(useToast).mockReturnValue({ toast: mockToast });

      const cooldownError = {
        code: 'COOLDOWN_ACTIVE',
        message: 'Reminder cooldown is active',
        details: { hours_remaining: 12 },
      };

      vi.mocked(useReminderAction).mockReturnValue({
        mutate: vi.fn((_, { onError }) => {
          onError?.(cooldownError);
        }),
        isPending: false,
        isSuccess: false,
        isError: true,
        error: cooldownError,
      });

      const user = userEvent.setup();
      render(<ReminderButton assignmentId={mockAssignmentId} />, {
        wrapper: createWrapper(),
      });

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringMatching(/cooldown/i),
            description: expect.stringMatching(/12/),
            variant: 'destructive',
          })
        );
      });
    });

    it('should display error toast on rate limit exceeded', async () => {
      const mockToast = vi.fn();
      vi.mocked(useToast).mockReturnValue({ toast: mockToast });

      const rateLimitError = {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded',
        details: { retry_after: 120 },
      };

      vi.mocked(useReminderAction).mockReturnValue({
        mutate: vi.fn((_, { onError }) => {
          onError?.(rateLimitError);
        }),
        isPending: false,
        isSuccess: false,
        isError: true,
        error: rateLimitError,
      });

      const user = userEvent.setup();
      render(<ReminderButton assignmentId={mockAssignmentId} />, {
        wrapper: createWrapper(),
      });

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringMatching(/rate limit/i),
            variant: 'destructive',
          })
        );
      });
    });

    it('should display error toast on no assignee error', async () => {
      const mockToast = vi.fn();
      vi.mocked(useToast).mockReturnValue({ toast: mockToast });

      const noAssigneeError = {
        code: 'NO_ASSIGNEE',
        message: 'Assignment has no assignee',
      };

      vi.mocked(useReminderAction).mockReturnValue({
        mutate: vi.fn((_, { onError }) => {
          onError?.(noAssigneeError);
        }),
        isPending: false,
        isSuccess: false,
        isError: true,
        error: noAssigneeError,
      });

      const user = userEvent.setup();
      render(<ReminderButton assignmentId={mockAssignmentWithNoAssignee} />, {
        wrapper: createWrapper(),
      });

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringMatching(/no assignee/i),
            variant: 'destructive',
          })
        );
      });
    });

    it('should display generic error toast on unknown error', async () => {
      const mockToast = vi.fn();
      vi.mocked(useToast).mockReturnValue({ toast: mockToast });

      const genericError = {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      };

      vi.mocked(useReminderAction).mockReturnValue({
        mutate: vi.fn((_, { onError }) => {
          onError?.(genericError);
        }),
        isPending: false,
        isSuccess: false,
        isError: true,
        error: genericError,
      });

      const user = userEvent.setup();
      render(<ReminderButton assignmentId={mockAssignmentId} />, {
        wrapper: createWrapper(),
      });

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringMatching(/error|failed/i),
            variant: 'destructive',
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button role', () => {
      render(<ReminderButton assignmentId={mockAssignmentId} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have descriptive aria-label', () => {
      render(<ReminderButton assignmentId={mockAssignmentId} />, {
        wrapper: createWrapper(),
      });

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', expect.stringMatching(/follow up/i));
    });

    it('should indicate loading state to screen readers', () => {
      vi.mocked(useReminderAction).mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
        isSuccess: false,
        isError: false,
        error: null,
      });

      render(<ReminderButton assignmentId={mockAssignmentId} />, {
        wrapper: createWrapper(),
      });

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });
});
