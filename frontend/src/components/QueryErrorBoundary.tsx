/**
 * QueryErrorBoundary Component
 *
 * Task: T095 [Polish]
 * Specialized error boundary for TanStack Query errors
 * Provides contextual error messages and retry functionality
 */

import { ReactNode } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ErrorBoundary from './ErrorBoundary';

interface QueryErrorBoundaryProps {
 children: ReactNode;
 fallbackMessage?: string;
}

/**
 * QueryErrorBoundary
 * Wraps components that use TanStack Query and provides specialized error handling
 */
export default function QueryErrorBoundary({ children, fallbackMessage }: QueryErrorBoundaryProps) {
 return (
 <QueryErrorResetBoundary>
 {({ reset }) => (
 <ErrorBoundary
 onError={(error) => {
 // Log query errors
 console.error('[QueryErrorBoundary] Query error:', error);
 }}
 fallback={<QueryErrorFallback onReset={reset} message={fallbackMessage} />}
 >
 {children}
 </ErrorBoundary>
 )}
 </QueryErrorResetBoundary>
 );
}

/**
 * QueryErrorFallback
 * Specialized fallback UI for query errors
 */
interface QueryErrorFallbackProps {
 onReset: () => void;
 message?: string;
 error?: Error;
}

function QueryErrorFallback({ onReset, message, error }: QueryErrorFallbackProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 // Determine error type
 const isNetworkError = error?.message.includes('fetch') || error?.message.includes('network');
 const isAuthError = error?.message.includes('401') || error?.message.includes('unauthorized');
 const isServerError = error?.message.includes('500') || error?.message.includes('server');

 // Select appropriate icon
 const ErrorIcon = isNetworkError ? WifiOff : AlertTriangle;

 // Select appropriate title
 let title = t('error.query.generic', 'Failed to load data');
 if (isNetworkError) {
 title = t('error.query.network', 'Connection Error');
 } else if (isAuthError) {
 title = t('error.query.auth', 'Authentication Error');
 } else if (isServerError) {
 title = t('error.query.server', 'Server Error');
 }

 // Select appropriate description
 let description = message || t('error.query.genericDescription', 'Unable to load the requested data. Please try again.');
 if (isNetworkError) {
 description = t('error.query.networkDescription', 'Unable to connect to the server. Please check your internet connection.');
 } else if (isAuthError) {
 description = t('error.query.authDescription', 'Your session may have expired. Please sign in again.');
 } else if (isServerError) {
 description = t('error.query.serverDescription', 'The server encountered an error. Please try again later.');
 }

 return (
 <div
 className="flex min-h-[400px] items-center justify-center p-4 sm:p-6"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <div className="w-full max-w-lg">
 <Alert variant="destructive" className="mb-4">
 <ErrorIcon className="size-5" />
 <AlertTitle className="mb-2 text-start text-base sm:text-lg">
 {title}
 </AlertTitle>
 <AlertDescription className="text-start text-sm sm:text-base">
 {description}
 </AlertDescription>
 </Alert>

 {/* Actions */}
 <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
 <Button
 onClick={onReset}
 className=" w-full sm: sm:w-auto"
 variant="default"
 >
 <RefreshCw className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
 {t('error.query.retry', 'Retry')}
 </Button>

 {isNetworkError && (
 <Button
 onClick={() => window.location.reload()}
 className=" w-full sm: sm:w-auto"
 variant="outline"
 >
 <Wifi className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
 {t('error.query.reload', 'Reload Page')}
 </Button>
 )}

 {isAuthError && (
 <Button
 onClick={() => window.location.href = '/login'}
 className=" w-full sm: sm:w-auto"
 variant="outline"
 >
 {t('error.query.signIn', 'Sign In')}
 </Button>
 )}
 </div>
 </div>
 </div>
 );
}
