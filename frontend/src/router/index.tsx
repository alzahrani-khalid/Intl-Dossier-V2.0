import { createRouter, Link } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import type { AuthContextValue } from '../contexts/auth.context'
import { useTranslation } from 'react-i18next'
import { Home, ArrowLeft } from 'lucide-react'
import { useDirection } from '@/hooks/useDirection'
import i18n from '@/i18n'

function NotFoundComponent() {
  const { t } = useTranslation()
  const { isRTL } = useDirection()
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
        <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-warning/10 dark:bg-warning/30 sm:mb-6 sm:size-20">
          <span className="text-3xl font-bold text-warning sm:text-4xl">404</span>
        </div>

        <h1 className="text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">
          {t('common:notFound.title', 'Page Not Found')}
        </h1>

        <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base">
          {t(
            'common:notFound.message',
            'The page you are looking for does not exist or has been moved.',
          )}
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:mt-8 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 sm:px-6 sm:py-3"
          >
            <Home className={`size-4 ${isRTL ? 'rotate-0' : ''}`} />
            {t('common:notFound.goHome', 'Go to Home')}
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:px-6 sm:py-3"
          >
            <ArrowLeft className={`size-4 ${isRTL ? 'rotate-180' : ''}`} />
            {t('common:notFound.goBack', 'Go Back')}
          </button>
        </div>
      </div>
    </div>
  )
}

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }

  interface RouterContext {
    auth: AuthContextValue
  }
}

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  context: {
    auth: undefined!,
  },
  // This is the surface ANY loader-thrown non-404 error hits. It renders generic i18n copy
  // only — the caught error is internal and goes to the console, never to the DOM (D-08/D-22).
  // t() comes from the i18n singleton because this factory runs outside React context.
  defaultErrorComponent: ({ error, reset }: { error: Error; reset: () => void }) => {
    console.error('Route error:', error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
          <h2 className="text-xl font-semibold text-destructive sm:text-2xl">
            {i18n.t('common:errors.queryFailed.title')}
          </h2>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">
            {i18n.t('common:errors.queryFailed.description')}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            {i18n.t('common:errors.retry')}
          </button>
        </div>
      </div>
    )
  },
  defaultNotFoundComponent: NotFoundComponent,
} as Parameters<typeof createRouter>[0])
