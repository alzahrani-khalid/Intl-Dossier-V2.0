import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../../src/components/theme-provider/theme-provider';
import { usePreferenceSync } from '../../src/services/preference-sync';
import { preferenceStorage } from '../../src/utils/storage/preference-storage';

// Mock the preference sync service
vi.mock('../../src/services/preference-sync');
vi.mock('../../src/utils/storage/preference-storage');

describe('Preference Persistence Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('should save preferences to localStorage immediately', async () => {
    const mockSave = vi.fn();
    (preferenceStorage as any).save = mockSave;

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider 
          initialTheme="gastat" 
          initialColorMode="light"
          initialLanguage="en"
        >
          <div>Content</div>
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Change theme programmatically
    const event = new CustomEvent('themeChange', {
      detail: { theme: 'blue-sky', colorMode: 'dark', language: 'ar' }
    });
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith({
        theme: 'blue-sky',
        colorMode: 'dark',
        language: 'ar',
        updatedAt: expect.any(String)
      });
    });
  });

  it('should sync preferences to Supabase', async () => {
    const mockSync = vi.fn().mockResolvedValue({ success: true });
    (usePreferenceSync as any).mockReturnValue({
      syncPreferences: mockSync,
      isSyncing: false,
      lastSyncedAt: null
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Trigger preference change
    const preferences = {
      userId: 'test-user',
      theme: 'blue-sky',
      colorMode: 'dark',
      language: 'ar'
    };

    // Simulate preference change
    window.dispatchEvent(new CustomEvent('preferenceChange', {
      detail: preferences
    }));

    await waitFor(() => {
      expect(mockSync).toHaveBeenCalledWith(preferences);
    });
  });

  it('should load preferences from localStorage on mount', async () => {
    // Set preferences in localStorage
    const savedPreferences = {
      theme: 'blue-sky',
      colorMode: 'dark',
      language: 'ar',
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('theme-preference', JSON.stringify(savedPreferences));

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <div data-testid="content">Content</div>
        </ThemeProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('blue-sky');
      expect(document.documentElement.getAttribute('data-color-mode')).toBe('dark');
      expect(document.documentElement.lang).toBe('ar');
    });
  });

  it('should handle localStorage unavailability', async () => {
    // Mock localStorage to throw error
    const originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      get: () => {
        throw new Error('localStorage not available');
      },
      configurable: true
    });

    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider 
          initialTheme="gastat"
          initialColorMode="light"
        >
          <div>Content</div>
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Should still render with defaults
    expect(document.documentElement.getAttribute('data-theme')).toBe('gastat');
    expect(document.documentElement.getAttribute('data-color-mode')).toBe('light');

    // Restore localStorage
    Object.defineProperty(window, 'localStorage', {
      get: () => originalLocalStorage,
      configurable: true
    });
    
    consoleWarn.mockRestore();
  });

  it('should handle sync failures gracefully', async () => {
    const mockSync = vi.fn().mockRejectedValue(new Error('Network error'));
    const mockSaveLocal = vi.fn();
    
    (usePreferenceSync as any).mockReturnValue({
      syncPreferences: mockSync,
      isSyncing: false,
      lastSyncedAt: null
    });
    
    (preferenceStorage as any).save = mockSaveLocal;

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Trigger preference change
    window.dispatchEvent(new CustomEvent('preferenceChange', {
      detail: { theme: 'blue-sky' }
    }));

    await waitFor(() => {
      // Should still save to localStorage even if sync fails
      expect(mockSaveLocal).toHaveBeenCalled();
      expect(mockSync).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  it('should merge remote preferences with local ones', async () => {
    // Local preferences
    localStorage.setItem('theme-preference', JSON.stringify({
      theme: 'gastat',
      colorMode: 'light',
      language: 'en',
      updatedAt: '2025-01-01T00:00:00Z'
    }));

    // Mock remote preferences (newer)
    const mockFetch = vi.fn().mockResolvedValue({
      theme: 'blue-sky',
      colorMode: 'dark',
      language: 'ar',
      updatedAt: '2025-01-02T00:00:00Z'
    });

    (usePreferenceSync as any).mockReturnValue({
      fetchRemotePreferences: mockFetch,
      syncPreferences: vi.fn(),
      isSyncing: false
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Should use newer remote preferences
      expect(document.documentElement.getAttribute('data-theme')).toBe('blue-sky');
      expect(document.documentElement.getAttribute('data-color-mode')).toBe('dark');
    });
  });

  it('should debounce rapid preference changes', async () => {
    const mockSync = vi.fn();
    (usePreferenceSync as any).mockReturnValue({
      syncPreferences: mockSync,
      isSyncing: false
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Rapid preference changes
    for (let i = 0; i < 5; i++) {
      window.dispatchEvent(new CustomEvent('preferenceChange', {
        detail: { theme: i % 2 === 0 ? 'gastat' : 'blue-sky' }
      }));
    }

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 500));

    // Should only sync once after debounce
    expect(mockSync).toHaveBeenCalledTimes(1);
  });
});