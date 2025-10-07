/**
 * PositionModuleErrorBoundary Component (T049)
 * Error boundary for position module with bilingual support
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class PositionModuleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Position Module Error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI (bilingual)
      return (
        <Card className="m-4">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-lg font-semibold">
                خطأ في وحدة المواقف / Position Module Error
              </AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p className="text-sm">
                  <strong>عربي:</strong> حدث خطأ غير متوقع في وحدة المواقف. يرجى المحاولة مرة أخرى.
                </p>
                <p className="text-sm">
                  <strong>English:</strong> An unexpected error occurred in the position module. Please
                  try again.
                </p>

                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4 rounded-md bg-destructive/10 p-3 text-xs">
                    <summary className="cursor-pointer font-medium">
                      تفاصيل الخطأ / Error Details
                    </summary>
                    <pre className="mt-2 overflow-auto whitespace-pre-wrap">
                      {this.state.error.toString()}
                      {'\n\n'}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>

            {/* Retry Button */}
            <div className="mt-4 flex justify-center">
              <Button onClick={this.handleReset} variant="outline">
                <RefreshCw className="me-2 h-4 w-4" />
                <span className="me-2">إعادة المحاولة</span>
                <span>/</span>
                <span className="ms-2">Retry</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
