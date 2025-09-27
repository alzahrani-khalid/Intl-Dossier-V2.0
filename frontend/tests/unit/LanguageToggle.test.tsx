import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageToggle } from '../../src/components/LanguageToggle';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';

// Mock the i18n module
vi.mock('../../src/i18n', () => ({
  default: {
    language: 'en',
    dir: vi.fn(() => 'ltr'),
    changeLanguage: vi.fn()
  },
  switchLanguage: vi.fn()
}));

// Mock the UI components
vi.mock('../../src/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  )
}));

vi.mock('../../src/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: any) => 
    asChild ? children : <button data-testid="dropdown-trigger">{children}</button>,
  DropdownMenuContent: ({ children, align }: any) => (
    <div data-testid="dropdown-content" data-align={align}>{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick, className }: any) => (
    <button 
      data-testid="dropdown-item" 
      onClick={onClick} 
      className={className}
    >
      {children}
    </button>
  )
}));

vi.mock('lucide-react', () => ({
  Globe: () => <div data-testid="globe-icon">🌐</div>
}));

describe('LanguageToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render language toggle button', () => {
    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    );

    // Assert
    expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    expect(screen.getByTestId('globe-icon')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('should show current language in button', () => {
    // Arrange
    i18n.language = 'en';

    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    );

    // Assert
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('should show Arabic language in button when current language is Arabic', () => {
    // Arrange
    i18n.language = 'ar';

    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    );

    // Assert
    expect(screen.getByText('العربية')).toBeInTheDocument();
  });

  it('should render dropdown menu items', () => {
    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    );

    // Assert
    const items = screen.getAllByTestId('dropdown-item');
    expect(items).toHaveLength(2);
    expect(screen.getByText('🇺🇸 English')).toBeInTheDocument();
    expect(screen.getByText('🇸🇦 العربية')).toBeInTheDocument();
  });

  it('should highlight current language in dropdown', () => {
    // Arrange
    i18n.language = 'en';

    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    );

    // Assert
    const englishItem = screen.getByText('🇺🇸 English').closest('button');
    expect(englishItem).toHaveClass('bg-accent');
  });

  it('should call switchLanguage when English is clicked', async () => {
    // Arrange
    const { switchLanguage } = require('../../src/i18n');
    i18n.language = 'ar';

    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    );

    // Act
    fireEvent.click(screen.getByText('🇺🇸 English'));

    // Assert
    await waitFor(() => {
      expect(switchLanguage).toHaveBeenCalledWith('en');
    });
  });

  it('should call switchLanguage when Arabic is clicked', async () => {
    // Arrange
    const { switchLanguage } = require('../../src/i18n');
    i18n.language = 'en';

    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    );

    // Act
    fireEvent.click(screen.getByText('🇸🇦 العربية'));

    // Assert
    await waitFor(() => {
      expect(switchLanguage).toHaveBeenCalledWith('ar');
    });
  });

  it('should handle language change correctly', async () => {
    // Arrange
    const { switchLanguage } = require('../../src/i18n');
    switchLanguage.mockResolvedValue(undefined);
    i18n.language = 'en';

    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    );

    // Act
    fireEvent.click(screen.getByText('🇸🇦 العربية'));

    // Assert
    await waitFor(() => {
      expect(switchLanguage).toHaveBeenCalledWith('ar');
    });
  });

  it('should handle switchLanguage errors gracefully', async () => {
    // Arrange
    const { switchLanguage } = require('../../src/i18n');
    switchLanguage.mockRejectedValue(new Error('Language switch failed'));
    i18n.language = 'en';

    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    );

    // Act
    fireEvent.click(screen.getByText('🇸🇦 العربية'));

    // Assert
    await waitFor(() => {
      expect(switchLanguage).toHaveBeenCalledWith('ar');
    });
    // Component should still render without crashing
    expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
  });

  it('should render with correct accessibility attributes', () => {
    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    );

    // Assert
    const trigger = screen.getByRole('button');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('type', 'button');
  });

  it('should show language names correctly for both languages', () => {
    // Arrange
    const languageNames = {
      en: 'English',
      ar: 'العربية'
    };

    // Test English
    i18n.language = 'en';
    const { rerender } = render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    );
    expect(screen.getByText(languageNames.en)).toBeInTheDocument();

    // Test Arabic
    i18n.language = 'ar';
    rerender(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    );
    expect(screen.getByText(languageNames.ar)).toBeInTheDocument();
  });

  it('should maintain dropdown state correctly', () => {
    // Act
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    );

    // Assert
    expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-content')).toHaveAttribute('data-align', 'end');
  });
});
