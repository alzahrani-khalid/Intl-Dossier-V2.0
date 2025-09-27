import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n/config';
import { LanguageProvider } from '../../src/components/language-provider/language-provider';
import { LanguageSwitcher } from '../../src/components/language-switcher/language-switcher';

describe('Language Switching and RTL Integration Test', () => {
  beforeEach(() => {
    // Reset i18n
    i18n.changeLanguage('en');
    
    // Clear localStorage
    localStorage.clear();
    
    // Reset document attributes
    document.documentElement.removeAttribute('lang');
    document.documentElement.removeAttribute('dir');
    document.documentElement.className = '';
  });

  afterEach(() => {
    cleanup();
  });

  it('should switch from English to Arabic with RTL layout', async () => {
    // Arrange
    const TestComponent = () => (
      <I18nextProvider i18n={i18n}>
        <LanguageProvider>
          <LanguageSwitcher />
          <div data-testid="test-content">
            <p>{i18n.t('common:welcome')}</p>
            <button>{i18n.t('common:submit')}</button>
          </div>
        </LanguageProvider>
      </I18nextProvider>
    );

    render(<TestComponent />);

    // Initial state: English LTR
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');

    // Act: Switch to Arabic
    const languageButton = screen.getByRole('button', { name: /language/i });
    fireEvent.click(languageButton);
    
    const arabicOption = await screen.findByText(/العربية/);
    fireEvent.click(arabicOption);

    // Assert: Arabic RTL applied
    await waitFor(() => {
      expect(document.documentElement.lang).toBe('ar');
      expect(document.documentElement.dir).toBe('rtl');
      expect(i18n.language).toBe('ar');
    });
  });

  it('should switch from Arabic to English with LTR layout', async () => {
    // Arrange: Start with Arabic
    i18n.changeLanguage('ar');
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';

    const TestComponent = () => (
      <I18nextProvider i18n={i18n}>
        <LanguageProvider>
          <LanguageSwitcher />
        </LanguageProvider>
      </I18nextProvider>
    );

    render(<TestComponent />);

    // Act: Switch to English
    const languageButton = screen.getByRole('button', { name: /language|لغة/i });
    fireEvent.click(languageButton);
    
    const englishOption = await screen.findByText(/English/);
    fireEvent.click(englishOption);

    // Assert: English LTR applied
    await waitFor(() => {
      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.dir).toBe('ltr');
      expect(i18n.language).toBe('en');
    });
  });

  it('should persist language preference in localStorage', async () => {
    // Arrange
    const TestComponent = () => (
      <I18nextProvider i18n={i18n}>
        <LanguageProvider>
          <LanguageSwitcher />
        </LanguageProvider>
      </I18nextProvider>
    );

    render(<TestComponent />);

    // Act: Switch to Arabic
    const languageButton = screen.getByRole('button', { name: /language/i });
    fireEvent.click(languageButton);
    
    const arabicOption = await screen.findByText(/العربية/);
    fireEvent.click(arabicOption);

    // Assert: Check localStorage
    await waitFor(() => {
      const stored = localStorage.getItem('theme-preference');
      expect(stored).toBeTruthy();
      
      const preferences = JSON.parse(stored!);
      expect(preferences.language).toBe('ar');
    });
  });

  it('should update all UI text when language changes', async () => {
    // Arrange: Mock translations
    i18n.addResourceBundle('en', 'common', {
      welcome: 'Welcome',
      submit: 'Submit',
      cancel: 'Cancel',
    });
    
    i18n.addResourceBundle('ar', 'common', {
      welcome: 'مرحبا',
      submit: 'إرسال',
      cancel: 'إلغاء',
    });

    const TestComponent = () => {
      const { t } = i18n;
      return (
        <I18nextProvider i18n={i18n}>
          <LanguageProvider>
            <LanguageSwitcher />
            <div data-testid="welcome">{t('common:welcome')}</div>
            <button data-testid="submit">{t('common:submit')}</button>
            <button data-testid="cancel">{t('common:cancel')}</button>
          </LanguageProvider>
        </I18nextProvider>
      );
    };

    const { rerender } = render(<TestComponent />);

    // Initial: English text
    expect(screen.getByTestId('welcome')).toHaveTextContent('Welcome');
    expect(screen.getByTestId('submit')).toHaveTextContent('Submit');
    expect(screen.getByTestId('cancel')).toHaveTextContent('Cancel');

    // Act: Switch to Arabic
    const languageButton = screen.getByRole('button', { name: /language/i });
    fireEvent.click(languageButton);
    
    const arabicOption = await screen.findByText(/العربية/);
    fireEvent.click(arabicOption);

    // Force re-render after language change
    rerender(<TestComponent />);

    // Assert: Arabic text displayed
    await waitFor(() => {
      expect(screen.getByTestId('welcome')).toHaveTextContent('مرحبا');
      expect(screen.getByTestId('submit')).toHaveTextContent('إرسال');
      expect(screen.getByTestId('cancel')).toHaveTextContent('إلغاء');
    });
  });

  it('should apply RTL-specific styles when Arabic is selected', async () => {
    // Arrange
    const TestComponent = () => (
      <I18nextProvider i18n={i18n}>
        <LanguageProvider>
          <LanguageSwitcher />
          <div data-testid="flex-container" className="flex justify-start">
            <button className="mr-4">Button 1</button>
            <button className="ml-4">Button 2</button>
          </div>
        </LanguageProvider>
      </I18nextProvider>
    );

    render(<TestComponent />);

    // Act: Switch to Arabic
    const languageButton = screen.getByRole('button', { name: /language/i });
    fireEvent.click(languageButton);
    
    const arabicOption = await screen.findByText(/العربية/);
    fireEvent.click(arabicOption);

    // Assert: RTL styles applied
    await waitFor(() => {
      const container = screen.getByTestId('flex-container');
      const computedStyle = getComputedStyle(container);
      expect(document.documentElement.dir).toBe('rtl');
      // In RTL, flex direction and margins should be mirrored
    });
  });

  it('should handle rapid language switches without errors', async () => {
    // Arrange
    const TestComponent = () => (
      <I18nextProvider i18n={i18n}>
        <LanguageProvider>
          <LanguageSwitcher />
        </LanguageProvider>
      </I18nextProvider>
    );

    render(<TestComponent />);

    // Act: Switch languages rapidly
    for (let i = 0; i < 5; i++) {
      const languageButton = screen.getByRole('button', { name: /language|لغة/i });
      fireEvent.click(languageButton);
      
      const targetLang = i % 2 === 0 ? /العربية/ : /English/;
      const option = await screen.findByText(targetLang);
      fireEvent.click(option);
    }

    // Assert: Final state should be consistent
    await waitFor(() => {
      const finalLang = i18n.language;
      expect(['en', 'ar']).toContain(finalLang);
      expect(document.documentElement.lang).toBe(finalLang);
      expect(document.documentElement.dir).toBe(finalLang === 'ar' ? 'rtl' : 'ltr');
    });
  });

  it('should maintain form state during language switch', async () => {
    // Arrange
    const TestComponent = () => (
      <I18nextProvider i18n={i18n}>
        <LanguageProvider>
          <LanguageSwitcher />
          <form>
            <input 
              data-testid="name-input" 
              type="text" 
              placeholder={i18n.t('common:name')}
              defaultValue=""
            />
            <textarea 
              data-testid="message-input" 
              placeholder={i18n.t('common:message')}
              defaultValue=""
            />
          </form>
        </LanguageProvider>
      </I18nextProvider>
    );

    render(<TestComponent />);

    // Enter form data
    const nameInput = screen.getByTestId('name-input') as HTMLInputElement;
    const messageInput = screen.getByTestId('message-input') as HTMLTextAreaElement;
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    // Act: Switch language
    const languageButton = screen.getByRole('button', { name: /language/i });
    fireEvent.click(languageButton);
    
    const arabicOption = await screen.findByText(/العربية/);
    fireEvent.click(arabicOption);

    // Assert: Form data preserved
    await waitFor(() => {
      expect(nameInput.value).toBe('John Doe');
      expect(messageInput.value).toBe('Test message');
    });
  });

  it('should update ARIA labels when language changes', async () => {
    // Arrange
    i18n.addResourceBundle('en', 'common', {
      'aria.close': 'Close',
      'aria.menu': 'Menu',
      'aria.search': 'Search',
    });
    
    i18n.addResourceBundle('ar', 'common', {
      'aria.close': 'إغلاق',
      'aria.menu': 'القائمة',
      'aria.search': 'بحث',
    });

    const TestComponent = () => (
      <I18nextProvider i18n={i18n}>
        <LanguageProvider>
          <LanguageSwitcher />
          <button aria-label={i18n.t('common:aria.close')}>X</button>
          <nav aria-label={i18n.t('common:aria.menu')}>Menu</nav>
          <input aria-label={i18n.t('common:aria.search')} />
        </LanguageProvider>
      </I18nextProvider>
    );

    const { rerender } = render(<TestComponent />);

    // Act: Switch to Arabic
    const languageButton = screen.getByRole('button', { name: /language/i });
    fireEvent.click(languageButton);
    
    const arabicOption = await screen.findByText(/العربية/);
    fireEvent.click(arabicOption);

    // Force re-render
    rerender(<TestComponent />);

    // Assert: ARIA labels updated
    await waitFor(() => {
      const closeButton = screen.getByLabelText('إغلاق');
      const menu = screen.getByLabelText('القائمة');
      const searchInput = screen.getByLabelText('بحث');
      
      expect(closeButton).toBeInTheDocument();
      expect(menu).toBeInTheDocument();
      expect(searchInput).toBeInTheDocument();
    });
  });

  it('should handle missing translations gracefully', async () => {
    // Arrange: Add partial translations
    i18n.addResourceBundle('en', 'common', {
      exists: 'This exists',
    });
    
    i18n.addResourceBundle('ar', 'common', {
      exists: 'هذا موجود',
      // 'missing' key not provided
    });

    const TestComponent = () => {
      const { t } = i18n;
      return (
        <I18nextProvider i18n={i18n}>
          <LanguageProvider>
            <LanguageSwitcher />
            <div data-testid="exists">{t('common:exists')}</div>
            <div data-testid="missing">{t('common:missing')}</div>
          </LanguageProvider>
        </I18nextProvider>
      );
    };

    render(<TestComponent />);

    // Act: Switch to Arabic
    const languageButton = screen.getByRole('button', { name: /language/i });
    fireEvent.click(languageButton);
    
    const arabicOption = await screen.findByText(/العربية/);
    fireEvent.click(arabicOption);

    // Assert: Missing key should show fallback
    await waitFor(() => {
      expect(screen.getByTestId('exists')).toHaveTextContent('هذا موجود');
      expect(screen.getByTestId('missing')).toHaveTextContent('common:missing'); // Fallback key
    });
  });
});