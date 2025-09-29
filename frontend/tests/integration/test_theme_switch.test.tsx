import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../../src/components/theme-provider/theme-provider';
import { ThemeSelector } from '../../src/components/theme-selector/theme-selector';
import { useTheme } from '../../src/hooks/use-theme';

// Mock the theme hook for testing
vi.mock('../../src/hooks/use-theme');

describe('Theme Switching Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    
    // Clear localStorage
    localStorage.clear();
    
    // Reset document attributes
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-color-mode');
  });

  it('should switch between themes without page reload', async () => {
    const mockSetTheme = vi.fn();
    (useTheme as any).mockReturnValue({
      theme: 'gastat',
      colorMode: 'light',
      setTheme: mockSetTheme,
      setColorMode: vi.fn()
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ThemeSelector />
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Find theme selector button
    const themeButton = screen.getByRole('button', { name: /theme/i });
    fireEvent.click(themeButton);

    // Select Blue Sky theme
    const blueSkyOption = await screen.findByText('Blue Sky');
    fireEvent.click(blueSkyOption);

    // Verify theme was changed
    expect(mockSetTheme).toHaveBeenCalledWith('blue-sky');
  });

  it('should apply theme CSS variables immediately', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider initialTheme="gastat" initialColorMode="light">
          <div data-testid="themed-element">Content</div>
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Check initial theme
    expect(document.documentElement.getAttribute('data-theme')).toBe('gastat');
    expect(document.documentElement.getAttribute('data-color-mode')).toBe('light');

    // Simulate theme change
    const themeProvider = screen.getByTestId('theme-provider');
    fireEvent(themeProvider, new CustomEvent('themeChange', { 
      detail: { theme: 'blue-sky', colorMode: 'dark' } 
    }));

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('blue-sky');
      expect(document.documentElement.getAttribute('data-color-mode')).toBe('dark');
    });
  });

  it('should transition smoothly between light and dark modes', async () => {
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider initialTheme="gastat" initialColorMode="light">
          <div data-testid="content">Test Content</div>
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Check light mode
    expect(document.documentElement.getAttribute('data-color-mode')).toBe('light');

    // Switch to dark mode
    rerender(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider initialTheme="gastat" initialColorMode="dark">
          <div data-testid="content">Test Content</div>
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Check dark mode applied
    expect(document.documentElement.getAttribute('data-color-mode')).toBe('dark');
  });

  it('should maintain theme during navigation', async () => {
    // Set initial theme
    localStorage.setItem('theme-preference', JSON.stringify({
      theme: 'blue-sky',
      colorMode: 'dark',
      language: 'en'
    }));

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <div>Page Content</div>
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Verify theme is loaded from localStorage
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('blue-sky');
      expect(document.documentElement.getAttribute('data-color-mode')).toBe('dark');
    });
  });

  it('should handle theme switching errors gracefully', async () => {
    const mockSetTheme = vi.fn().mockRejectedValue(new Error('Failed to save theme'));
    (useTheme as any).mockReturnValue({
      theme: 'gastat',
      colorMode: 'light',
      setTheme: mockSetTheme,
      setColorMode: vi.fn(),
      error: null
    });

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ThemeSelector />
        </ThemeProvider>
      </QueryClientProvider>
    );

    const themeButton = screen.getByRole('button', { name: /theme/i });
    fireEvent.click(themeButton);

    const blueSkyOption = await screen.findByText('Blue Sky');
    fireEvent.click(blueSkyOption);

    await waitFor(() => {
      expect(mockSetTheme).toHaveBeenCalled();
    });

    // Theme should remain unchanged on error
    expect(document.documentElement.getAttribute('data-theme')).toBe('gastat');

    consoleError.mockRestore();
  });

  it('should respect system preference when no user preference exists', async () => {
    // Mock matchMedia for system preference
    const mockMatchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));
    
    window.matchMedia = mockMatchMedia;

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-color-mode')).toBe('dark');
    });
  });
});