import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../../src/components/theme-provider/theme-provider';
import { PreferenceBroadcast } from '../../src/utils/broadcast/preference-broadcast';

describe('Cross-Tab Synchronization Integration', () => {
  let queryClient: QueryClient;
  let broadcastChannel: BroadcastChannel | null = null;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    
    // Clear localStorage
    localStorage.clear();
    
    // Mock BroadcastChannel if not available
    if (!window.BroadcastChannel) {
      window.BroadcastChannel = vi.fn().mockImplementation((name: string) => {
        const channel = {
          name,
          postMessage: vi.fn(),
          close: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          onmessage: null as any,
          onmessageerror: null as any
        };
        broadcastChannel = channel as any;
        return channel;
      }) as any;
    }
  });

  afterEach(() => {
    if (broadcastChannel) {
      broadcastChannel.close();
      broadcastChannel = null;
    }
  });

  it('should broadcast preference changes to other tabs', async () => {
    const mockBroadcast = vi.fn();
    vi.spyOn(PreferenceBroadcast.prototype, 'broadcast').mockImplementation(mockBroadcast);

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <div>Tab 1</div>
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Change preferences
    const preferences = {
      theme: 'blue-sky',
      colorMode: 'dark',
      language: 'ar'
    };

    window.dispatchEvent(new CustomEvent('preferenceChange', {
      detail: preferences
    }));

    await waitFor(() => {
      expect(mockBroadcast).toHaveBeenCalledWith({
        type: 'preference-update',
        data: preferences
      });
    });
  });

  it('should receive and apply preferences from other tabs', async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <div data-testid="content">Tab 2</div>
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Simulate message from another tab
    const messageEvent = new MessageEvent('message', {
      data: {
        type: 'preference-update',
        data: {
          theme: 'blue-sky',
          colorMode: 'dark',
          language: 'ar'
        }
      }
    });

    // Trigger the broadcast channel message
    if (broadcastChannel && broadcastChannel.onmessage) {
      broadcastChannel.onmessage(messageEvent);
    } else {
      // Fallback for real BroadcastChannel
      window.dispatchEvent(new CustomEvent('storage', {
        detail: {
          key: 'theme-preference',
          newValue: JSON.stringify({
            theme: 'blue-sky',
            colorMode: 'dark',
            language: 'ar'
          })
        }
      }));
    }

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('blue-sky');
      expect(document.documentElement.getAttribute('data-color-mode')).toBe('dark');
      expect(document.documentElement.lang).toBe('ar');
    });
  });

  it('should handle storage events for browsers without BroadcastChannel', async () => {
    // Remove BroadcastChannel support
    const originalBroadcastChannel = window.BroadcastChannel;
    delete (window as any).BroadcastChannel;

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Simulate storage event
    const storageEvent = new StorageEvent('storage', {
      key: 'theme-preference',
      newValue: JSON.stringify({
        theme: 'blue-sky',
        colorMode: 'dark',
        language: 'ar',
        updatedAt: new Date().toISOString()
      }),
      oldValue: null,
      url: window.location.href,
      storageArea: localStorage
    });

    window.dispatchEvent(storageEvent);

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('blue-sky');
      expect(document.documentElement.getAttribute('data-color-mode')).toBe('dark');
    });

    // Restore BroadcastChannel
    window.BroadcastChannel = originalBroadcastChannel;
  });

  it('should ignore invalid messages from other tabs', async () => {
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

    // Send invalid message
    const invalidMessage = new MessageEvent('message', {
      data: {
        type: 'preference-update',
        data: {
          theme: 'invalid-theme',
          colorMode: 'invalid-mode'
        }
      }
    });

    if (broadcastChannel && broadcastChannel.onmessage) {
      broadcastChannel.onmessage(invalidMessage);
    }

    // Should not change from defaults
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(document.documentElement.getAttribute('data-theme')).toBe('gastat');
    expect(document.documentElement.getAttribute('data-color-mode')).toBe('light');

    consoleWarn.mockRestore();
  });

  it('should handle rapid cross-tab updates', async () => {
    const updatePromises: Promise<void>[] = [];

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Simulate rapid updates from multiple tabs
    for (let i = 0; i < 10; i++) {
      const promise = new Promise<void>((resolve) => {
        setTimeout(() => {
          const message = new MessageEvent('message', {
            data: {
              type: 'preference-update',
              data: {
                theme: i % 2 === 0 ? 'gastat' : 'blue-sky',
                colorMode: i % 2 === 0 ? 'light' : 'dark',
                language: 'en'
              }
            }
          });

          if (broadcastChannel && broadcastChannel.onmessage) {
            broadcastChannel.onmessage(message);
          }
          resolve();
        }, i * 10);
      });
      updatePromises.push(promise);
    }

    await Promise.all(updatePromises);

    // Final state should be consistent
    const finalTheme = document.documentElement.getAttribute('data-theme');
    expect(['gastat', 'blue-sky']).toContain(finalTheme);
  });

  it('should clean up broadcast channel on unmount', async () => {
    const mockClose = vi.fn();
    
    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      </QueryClientProvider>
    );

    if (broadcastChannel) {
      broadcastChannel.close = mockClose;
    }

    unmount();

    await waitFor(() => {
      if (broadcastChannel) {
        expect(mockClose).toHaveBeenCalled();
      }
    });
  });

  it('should handle same-tab preference changes without broadcast loop', async () => {
    const mockBroadcast = vi.fn();
    vi.spyOn(PreferenceBroadcast.prototype, 'broadcast').mockImplementation(mockBroadcast);

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Change preference locally
    localStorage.setItem('theme-preference', JSON.stringify({
      theme: 'blue-sky',
      colorMode: 'dark',
      language: 'ar',
      tabId: 'current-tab' // Same tab ID
    }));

    // Trigger storage event (same tab)
    const storageEvent = new StorageEvent('storage', {
      key: 'theme-preference',
      newValue: localStorage.getItem('theme-preference'),
      oldValue: null,
      url: window.location.href,
      storageArea: localStorage
    });

    window.dispatchEvent(storageEvent);

    // Should not re-broadcast (avoid loop)
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(mockBroadcast).not.toHaveBeenCalledWith({
      type: 'preference-update',
      data: expect.objectContaining({ tabId: 'current-tab' })
    });
  });
});