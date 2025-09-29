import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ThemeProvider } from '../../src/components/theme-provider/theme-provider';
import { LanguageProvider } from '../../src/components/language-provider/language-provider';

describe('Default Theme Application Integration Test', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset document styles
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('lang');
    document.documentElement.removeAttribute('dir');
    
    // Clear CSS variables
    const root = document.documentElement;
    root.style.cssText = '';
  });

  afterEach(() => {
    cleanup();
  });

  it('should apply GASTAT theme in light mode with English by default', () => {
    // Arrange & Act
    const TestComponent = () => (
      <ThemeProvider>
        <LanguageProvider>
          <div data-testid="test-content">Test Content</div>
        </LanguageProvider>
      </ThemeProvider>
    );

    render(<TestComponent />);

    // Assert: Check default theme applied
    const root = document.documentElement;
    
    // Theme should be GASTAT
    expect(root.getAttribute('data-theme')).toBe('gastat');
    
    // Should not have dark class (light mode by default)
    expect(root.classList.contains('dark')).toBe(false);
    
    // Language should be English
    expect(root.getAttribute('lang')).toBe('en');
    expect(root.getAttribute('dir')).toBe('ltr');
    
    // Check CSS variables for GASTAT theme
    const styles = getComputedStyle(root);
    expect(styles.getPropertyValue('--primary')).toBe('139.6552 52.7273% 43.1373%');
    expect(styles.getPropertyValue('--font-sans')).toContain('Plus Jakarta Sans');
    expect(styles.getPropertyValue('--radius')).toBe('0.5rem');
  });

  it('should apply default theme when localStorage is empty', () => {
    // Arrange
    expect(localStorage.getItem('theme-preference')).toBeNull();
    
    // Act
    const TestComponent = () => (
      <ThemeProvider>
        <div data-testid="test-content">Test Content</div>
      </ThemeProvider>
    );

    render(<TestComponent />);

    // Assert
    const root = document.documentElement;
    expect(root.getAttribute('data-theme')).toBe('gastat');
    expect(root.classList.contains('dark')).toBe(false);
  });

  it('should respect system dark mode preference when colorMode is system', () => {
    // Arrange: Mock system dark mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Act
    const TestComponent = () => (
      <ThemeProvider defaultColorMode="system">
        <div data-testid="test-content">Test Content</div>
      </ThemeProvider>
    );

    render(<TestComponent />);

    // Assert: Should apply dark mode
    const root = document.documentElement;
    expect(root.classList.contains('dark')).toBe(true);
  });

  it('should apply correct CSS variables for default GASTAT light theme', () => {
    // Act
    const TestComponent = () => (
      <ThemeProvider>
        <div data-testid="test-content">Test Content</div>
      </ThemeProvider>
    );

    render(<TestComponent />);

    // Assert: Check all critical CSS variables
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    
    // Core colors
    expect(styles.getPropertyValue('--background')).toBe('240 9.0909% 97.8431%');
    expect(styles.getPropertyValue('--foreground')).toBe('0 0% 20%');
    expect(styles.getPropertyValue('--primary')).toBe('139.6552 52.7273% 43.1373%');
    expect(styles.getPropertyValue('--secondary')).toBe('218.5401 79.1908% 66.0784%');
    
    // Typography
    expect(styles.getPropertyValue('--font-sans')).toContain('Plus Jakarta Sans');
    
    // Border radius
    expect(styles.getPropertyValue('--radius')).toBe('0.5rem');
  });

  it('should handle missing provider gracefully', () => {
    // Act: Render without providers
    const TestComponent = () => (
      <div data-testid="test-content">Test Content</div>
    );

    render(<TestComponent />);

    // Assert: Should render content without crashing
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('should merge default preferences with partial stored preferences', () => {
    // Arrange: Store partial preferences
    localStorage.setItem('theme-preference', JSON.stringify({
      theme: 'blueSky',
      // Missing colorMode and language
    }));

    // Act
    const TestComponent = () => (
      <ThemeProvider>
        <LanguageProvider>
          <div data-testid="test-content">Test Content</div>
        </LanguageProvider>
      </ThemeProvider>
    );

    render(<TestComponent />);

    // Assert: Theme from localStorage, other values from defaults
    const root = document.documentElement;
    expect(root.getAttribute('data-theme')).toBe('blueSky');
    expect(root.classList.contains('dark')).toBe(false); // Default light mode
    expect(root.getAttribute('lang')).toBe('en'); // Default English
  });

  it('should apply theme immediately without animation on initial load', () => {
    // Act
    const TestComponent = () => (
      <ThemeProvider>
        <div data-testid="test-content">Test Content</div>
      </ThemeProvider>
    );

    const startTime = performance.now();
    render(<TestComponent />);
    const endTime = performance.now();

    // Assert: Theme applied in less than 10ms (no animation)
    expect(endTime - startTime).toBeLessThan(10);
    
    const root = document.documentElement;
    expect(root.getAttribute('data-theme')).toBe('gastat');
  });
});
