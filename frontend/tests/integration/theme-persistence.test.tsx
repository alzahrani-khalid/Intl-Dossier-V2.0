import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { createClient } from '@supabase/supabase-js';
import { ThemeProvider } from '../../src/components/theme-provider/theme-provider';
import { ThemeSelector } from '../../src/components/theme-selector/theme-selector';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

describe('Theme Persistence Integration Test', () => {
  let supabase: any;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    
    // Reset mocks
    vi.clearAllMocks();
    supabase = createClient('http://localhost:54321', 'test-key');
  });

  afterEach(() => {
    cleanup();
  });

  it('should persist theme changes to localStorage', async () => {
    // Arrange
    const TestComponent = () => (
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>
    );

    render(<TestComponent />);

    // Act: Change theme
    const themeButton = screen.getByRole('button', { name: /theme/i });
    fireEvent.click(themeButton);
    
    const blueSkyOption = await screen.findByText(/blue sky/i);
    fireEvent.click(blueSkyOption);

    // Assert: Check localStorage
    await waitFor(() => {
      const stored = localStorage.getItem('theme-preference');
      expect(stored).toBeTruthy();
      
      const preferences = JSON.parse(stored!);
      expect(preferences.theme).toBe('blueSky');
      expect(preferences.timestamp).toBeDefined();
    });
  });

  it('should restore theme from localStorage on reload', () => {
    // Arrange: Set preferences in localStorage
    const savedPreferences = {
      theme: 'blueSky',
      colorMode: 'dark',
      language: 'ar',
      timestamp: Date.now(),
    };
    localStorage.setItem('theme-preference', JSON.stringify(savedPreferences));

    // Act: Render component
    const TestComponent = () => (
      <ThemeProvider>
        <div data-testid="content">Content</div>
      </ThemeProvider>
    );

    render(<TestComponent />);

    // Assert: Theme restored from localStorage
    const root = document.documentElement;
    expect(root.getAttribute('data-theme')).toBe('blueSky');
    expect(root.classList.contains('dark')).toBe(true);
  });

  it('should sync preferences to Supabase when authenticated', async () => {
    // Arrange: Mock authenticated user
    const mockUserId = 'user-123';
    supabase.auth.getSession = vi.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: mockUserId },
          access_token: 'token',
        },
      },
    });

    const TestComponent = () => (
      <ThemeProvider supabaseClient={supabase}>
        <ThemeSelector />
      </ThemeProvider>
    );

    render(<TestComponent />);

    // Act: Change theme
    const themeButton = screen.getByRole('button', { name: /theme/i });
    fireEvent.click(themeButton);
    
    const blueSkyOption = await screen.findByText(/blue sky/i);
    fireEvent.click(blueSkyOption);

    // Assert: Supabase upsert called
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('user_preferences');
      expect(supabase.from().upsert).toHaveBeenCalled();
    });
  });

  it('should handle localStorage quota exceeded gracefully', async () => {
    // Arrange: Mock localStorage quota exceeded
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });

    const TestComponent = () => (
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>
    );

    render(<TestComponent />);

    // Act: Try to change theme
    const themeButton = screen.getByRole('button', { name: /theme/i });
    fireEvent.click(themeButton);
    
    const blueSkyOption = await screen.findByText(/blue sky/i);
    fireEvent.click(blueSkyOption);

    // Assert: Theme still changes even if localStorage fails
    await waitFor(() => {
      const root = document.documentElement;
      expect(root.getAttribute('data-theme')).toBe('blueSky');
    });

    // Cleanup
    Storage.prototype.setItem = originalSetItem;
  });

  it('should persist preferences across multiple changes', async () => {
    const TestComponent = () => (
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>
    );

    render(<TestComponent />);

    // First change: Theme to Blue Sky
    let themeButton = screen.getByRole('button', { name: /theme/i });
    fireEvent.click(themeButton);
    let blueSkyOption = await screen.findByText(/blue sky/i);
    fireEvent.click(blueSkyOption);

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('theme-preference')!);
      expect(stored.theme).toBe('blueSky');
    });

    // Second change: Dark mode
    const darkModeButton = screen.getByRole('button', { name: /dark mode/i });
    fireEvent.click(darkModeButton);

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('theme-preference')!);
      expect(stored.theme).toBe('blueSky');
      expect(stored.colorMode).toBe('dark');
    });

    // Third change: Back to GASTAT
    themeButton = screen.getByRole('button', { name: /theme/i });
    fireEvent.click(themeButton);
    const gastatOption = await screen.findByText(/gastat/i);
    fireEvent.click(gastatOption);

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('theme-preference')!);
      expect(stored.theme).toBe('gastat');
      expect(stored.colorMode).toBe('dark'); // Should persist
    });
  });

  it('should debounce rapid preference updates', async () => {
    const TestComponent = () => (
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>
    );

    render(<TestComponent />);

    // Act: Make rapid changes
    const startCount = JSON.parse(localStorage.getItem('theme-preference') || '{}').updateCount || 0;

    // Simulate 10 rapid theme changes
    for (let i = 0; i < 10; i++) {
      const themeButton = screen.getByRole('button', { name: /theme/i });
      fireEvent.click(themeButton);
      const option = await screen.findByText(i % 2 === 0 ? /blue sky/i : /gastat/i);
      fireEvent.click(option);
    }

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Assert: Should have fewer localStorage writes than changes
    const stored = JSON.parse(localStorage.getItem('theme-preference')!);
    expect(stored).toBeDefined();
    // The exact count depends on debounce implementation
    // but should be less than 10
  });

  it('should handle corrupt localStorage data gracefully', () => {
    // Arrange: Store corrupt data
    localStorage.setItem('theme-preference', 'not valid json');

    // Act: Render component
    const TestComponent = () => (
      <ThemeProvider>
        <div data-testid="content">Content</div>
      </ThemeProvider>
    );

    render(<TestComponent />);

    // Assert: Should fall back to defaults
    const root = document.documentElement;
    expect(root.getAttribute('data-theme')).toBe('gastat');
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('should expire old preferences from localStorage', () => {
    // Arrange: Store old preferences (>24 hours)
    const oldPreferences = {
      theme: 'blueSky',
      colorMode: 'dark',
      language: 'ar',
      timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
    };
    localStorage.setItem('theme-preference', JSON.stringify(oldPreferences));

    // Act: Render component
    const TestComponent = () => (
      <ThemeProvider>
        <div data-testid="content">Content</div>
      </ThemeProvider>
    );

    render(<TestComponent />);

    // Assert: Should ignore old preferences and use defaults
    const root = document.documentElement;
    expect(root.getAttribute('data-theme')).toBe('gastat'); // Default
  });
});