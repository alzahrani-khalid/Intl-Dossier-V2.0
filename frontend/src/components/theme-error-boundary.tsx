import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallbackTheme?: 'gastat' | 'blueSky';
  fallbackColorMode?: 'light' | 'dark';
  fallbackLanguage?: 'en' | 'ar';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ThemeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Theme Provider Error:', error, errorInfo);
    
    // Apply fallback theme directly to DOM
    this.applyFallbackTheme();
  }

  applyFallbackTheme(): void {
    const { 
      fallbackTheme = 'gastat', 
      fallbackColorMode = 'light',
      fallbackLanguage = 'en' 
    } = this.props;
    
    const root = document.documentElement;
    
    // Apply theme classes
    root.classList.remove('theme-gastat', 'theme-blueSky');
    root.classList.add(`theme-${fallbackTheme}`);
    
    // Apply color mode
    root.classList.remove('light', 'dark');
    root.classList.add(fallbackColorMode);
    
    // Apply language and direction
    root.setAttribute('lang', fallbackLanguage);
    root.setAttribute('dir', fallbackLanguage === 'ar' ? 'rtl' : 'ltr');
    
    // Clear corrupted localStorage
    try {
      localStorage.removeItem('theme-preference');
    } catch {}
  }

  handleReset = (): void => {
    // Clear corrupted state
    try {
      localStorage.removeItem('theme-preference');
    } catch {}
    
    // Reset error state
    this.setState({ hasError: false, error: null });
    
    // Reload the page to reinitialize
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
      
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
            <h1 className="mb-4 text-2xl font-bold text-destructive">
              {isRTL ? 'خطأ في نظام السمات' : 'Theme System Error'}
            </h1>
            <p className="mb-4 text-muted-foreground">
              {isRTL 
                ? 'حدث خطأ في تحميل إعدادات السمة. تم تطبيق السمة الافتراضية.'
                : 'An error occurred loading theme settings. Default theme has been applied.'}
            </p>
            {this.state.error && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  {isRTL ? 'تفاصيل الخطأ' : 'Error details'}
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="w-full rounded bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {isRTL ? 'إعادة تحميل الصفحة' : 'Reload Page'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}