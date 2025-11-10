/**
 * SearchErrorBoundary Component
 * Feature: 015-search-retrieval-spec
 * Task: T050
 *
 * Error boundary wrapping search UI:
 * - Catches rendering errors
 * - Displays bilingual error message
 * - Provides "Try again" button
 * - Logs errors to console
 * - Prevents full app crash on search failures
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
 children: ReactNode;
 fallback?: ReactNode;
 onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
 hasError: boolean;
 error: Error | null;
}

export class SearchErrorBoundary extends Component<Props, State> {
 constructor(props: Props) {
 super(props);
 this.state = { hasError: false, error: null };
 }

 static getDerivedStateFromError(error: Error): State {
 return { hasError: true, error };
 }

 componentDidCatch(error: Error, errorInfo: ErrorInfo) {
 // Log error to console
 console.error('Search Error Boundary caught an error:', error, errorInfo);

 // Call custom error handler if provided
 if (this.props.onError) {
 this.props.onError(error, errorInfo);
 }

 // In production, you might want to log to an error tracking service
 if (process.env.NODE_ENV === 'production') {
 // Example: logErrorToService(error, errorInfo);
 }
 }

 handleReset = () => {
 this.setState({ hasError: false, error: null });
 };

 render() {
 if (this.state.hasError) {
 // Use custom fallback if provided
 if (this.props.fallback) {
 return this.props.fallback;
 }

 // Default error UI (bilingual)
 return (
 <div className="flex min-h-[400px] items-center justify-center p-8">
 <div className="max-w-md text-center">
 {/* Error icon */}
 <div className="mb-4 text-6xl">⚠️</div>

 {/* Error title (English) */}
 <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
 Search Error
 </h2>

 {/* Error title (Arabic) */}
 <h2
 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100"
 dir="rtl"
 >
 خطأ في البحث
 </h2>

 {/* Error description (English) */}
 <p className="mb-2 text-gray-600 dark:text-gray-400">
 Something went wrong while loading the search results.
 </p>

 {/* Error description (Arabic) */}
 <p className="mb-6 text-gray-600 dark:text-gray-400" dir="rtl">
 حدث خطأ أثناء تحميل نتائج البحث.
 </p>

 {/* Error details (dev mode only) */}
 {process.env.NODE_ENV === 'development' && this.state.error && (
 <details className="mb-6 rounded-lg bg-gray-100 p-4 text-start dark:bg-gray-800">
 <summary className="mb-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
 Error Details (Dev Only)
 </summary>
 <pre className="overflow-x-auto text-xs text-red-600 dark:text-red-400">
 {this.state.error.toString()}
 {'\n\n'}
 {this.state.error.stack}
 </pre>
 </details>
 )}

 {/* Action buttons */}
 <div className="flex flex-col justify-center gap-3 sm:flex-row">
 {/* Try again button */}
 <button
 onClick={this.handleReset}
 className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
 >
 Try Again / حاول مرة أخرى
 </button>

 {/* Reload page button */}
 <button
 onClick={() => window.location.reload()}
 className="rounded-md bg-gray-200 px-4 py-2 text-gray-900 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
 >
 Reload Page / إعادة تحميل الصفحة
 </button>
 </div>

 {/* Help text */}
 <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
 If the problem persists, please contact support.
 <br />
 إذا استمرت المشكلة، يرجى الاتصال بالدعم الفني.
 </p>
 </div>
 </div>
 );
 }

 return this.props.children;
 }
}
