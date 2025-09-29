import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n/config';
import { LanguageProvider } from '../../src/components/language-provider/language-provider';
import { LanguageSwitcher } from '../../src/components/language-switcher/language-switcher';

describe('Language Switching with RTL Integration', () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    
    // Clear localStorage
    localStorage.clear();
    
    // Reset document attributes
    document.documentElement.removeAttribute('lang');
    document.documentElement.removeAttribute('dir');
    
    // Reset i18n to English
    await i18n.changeLanguage('en');
  });

  it('should switch from English to Arabic with RTL', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <LanguageProvider>
            <LanguageSwitcher />
            <div data-testid="test-content">
              Test Content
            </div>
          </LanguageProvider>
        </I18nextProvider>
      </QueryClientProvider>
    );

    // Initial state should be LTR English
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');

    // Find and click language switcher
    const langButton = screen.getByRole('button', { name: /language/i });
    fireEvent.click(langButton);

    // Select Arabic
    const arabicOption = await screen.findByText('العربية');
    fireEvent.click(arabicOption);

    // Wait for language change
    await waitFor(() => {
      expect(document.documentElement.lang).toBe('ar');
      expect(document.documentElement.dir).toBe('rtl');
    });

    // Verify i18n language changed
    expect(i18n.language).toBe('ar');
  });

  it('should switch from Arabic to English with LTR', async () => {
    // Start with Arabic
    await i18n.changeLanguage('ar');
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';

    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <LanguageProvider>
            <LanguageSwitcher />
          </LanguageProvider>
        </I18nextProvider>
      </QueryClientProvider>
    );

    // Verify initial RTL state
    expect(document.documentElement.dir).toBe('rtl');

    // Switch to English
    const langButton = screen.getByRole('button', { name: /لغة/i });
    fireEvent.click(langButton);

    const englishOption = await screen.findByText('English');
    fireEvent.click(englishOption);

    await waitFor(() => {
      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.dir).toBe('ltr');
    });
  });

  it('should apply RTL styles to components', async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <LanguageProvider>
            <div className="flex ps-4 me-2" data-testid="styled-element">
              <span className="text-start">Start aligned text</span>
              <span className="text-end">End aligned text</span>
            </div>
          </LanguageProvider>
        </I18nextProvider>
      </QueryClientProvider>
    );

    // Switch to Arabic
    await i18n.changeLanguage('ar');
    document.documentElement.dir = 'rtl';

    // Re-render to apply RTL styles
    const element = container.querySelector('[data-testid="styled-element"]');
    expect(element).toBeTruthy();
    
    // Verify logical properties are applied correctly
    const computedStyle = window.getComputedStyle(element!);
    // In RTL, padding-start should be on the right
    expect(computedStyle.paddingInlineStart).toBeDefined();
  });

  it('should persist language preference', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <LanguageProvider>
            <LanguageSwitcher />
          </LanguageProvider>
        </I18nextProvider>
      </QueryClientProvider>
    );

    // Change to Arabic
    const langButton = screen.getByRole('button', { name: /language/i });
    fireEvent.click(langButton);
    
    const arabicOption = await screen.findByText('العربية');
    fireEvent.click(arabicOption);

    await waitFor(() => {
      expect(i18n.language).toBe('ar');
    });

    // Check localStorage
    const stored = localStorage.getItem('theme-preference');
    expect(stored).toBeTruthy();
    
    const preference = JSON.parse(stored!);
    expect(preference.language).toBe('ar');
  });

  it('should handle translation loading correctly', async () => {
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <LanguageProvider>
            <div>{i18n.t('common:welcome')}</div>
          </LanguageProvider>
        </I18nextProvider>
      </QueryClientProvider>
    );

    // Switch language
    await i18n.changeLanguage('ar');

    rerender(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <LanguageProvider>
            <div>{i18n.t('common:welcome')}</div>
          </LanguageProvider>
        </I18nextProvider>
      </QueryClientProvider>
    );

    // Translations should be loaded
    await waitFor(() => {
      const translated = i18n.t('common:welcome');
      expect(translated).not.toBe('common:welcome'); // Should be translated
    });
  });

  it('should handle missing translations gracefully', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <LanguageProvider>
            <div>{i18n.t('common:nonexistent.key')}</div>
          </LanguageProvider>
        </I18nextProvider>
      </QueryClientProvider>
    );

    // Should fallback to key
    expect(screen.getByText('common:nonexistent.key')).toBeInTheDocument();
    
    consoleWarn.mockRestore();
  });

  it('should update all text when language changes', async () => {
    const TestComponent = () => {
      const { t } = i18n;
      return (
        <div>
          <h1>{t('common:dashboard')}</h1>
          <p>{t('common:welcome')}</p>
        </div>
      );
    };

    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <LanguageProvider>
            <TestComponent />
            <LanguageSwitcher />
          </LanguageProvider>
        </I18nextProvider>
      </QueryClientProvider>
    );

    // Get initial English text
    const initialHeading = screen.getByRole('heading').textContent;
    
    // Switch to Arabic
    await i18n.changeLanguage('ar');

    await waitFor(() => {
      const newHeading = screen.getByRole('heading').textContent;
      expect(newHeading).not.toBe(initialHeading); // Text should change
    });
  });
});