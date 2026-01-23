import { createRouter, Link } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import type { AuthContextValue } from '../contexts/auth.context'
import { useTranslation } from 'react-i18next'
import { Home, ArrowLeft } from 'lucide-react'

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
 defaultErrorComponent: ({ error, reset }) => (
 <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-base-50 to-base-100 p-4 sm:p-8">
 <div className="w-full max-w-lg rounded-2xl border border-base-200 bg-white p-6 text-center shadow-xl sm:p-8">
 <h2 className="font-display text-xl font-semibold text-red-600 sm:text-2xl">
 {error?.name ?? 'Application error'}
 </h2>
 <p className="mt-4 text-sm text-base-600 sm:text-base">
 {error?.message ?? 'Something went wrong while loading this page.'}
 </p>
 <button
 type="button"
 onClick={reset}
 className="mt-6 rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-primary-50 shadow hover:bg-primary-700"
 >
 Retry
 </button>
 </div>
 </div>
 ),
 defaultNotFoundComponent: () => {
 const { t, i18n } = useTranslation()
 const isRTL = i18n.language === 'ar'

 return (
 <div
 className="flex min-h-screen items-center justify-center bg-gradient-to-br from-base-50 to-base-100 p-4 sm:p-8"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <div className="w-full max-w-lg rounded-2xl border border-base-200 bg-white p-6 text-center shadow-xl sm:p-8">
 <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-amber-100 sm:mb-6 sm:size-20">
 <span className="text-3xl font-bold text-amber-600 sm:text-4xl">404</span>
 </div>

 <h1 className="font-display text-xl font-semibold text-base-900 sm:text-2xl md:text-3xl">
 {t('common.notFound.title', 'Page Not Found')}
 </h1>

 <p className="mt-3 text-sm text-base-600 sm:mt-4 sm:text-base">
 {t('common.notFound.message', 'The page you are looking for does not exist or has been moved.')}
 </p>

 <div className="mt-6 flex flex-col justify-center gap-3 sm:mt-8 sm:flex-row">
 <Link
 to="/"
 className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow transition-colors hover:bg-primary-700 sm:px-6 sm:py-3"
 >
 <Home className={`size-4 ${isRTL ? 'rotate-0' : ''}`} />
 {t('common.notFound.goHome', 'Go to Home')}
 </Link>

 <button
 type="button"
 onClick={() => window.history.back()}
 className="inline-flex items-center justify-center gap-2 rounded-lg border border-base-300 bg-white px-4 py-2.5 text-sm font-medium text-base-700 shadow-sm transition-colors hover:bg-base-50 sm:px-6 sm:py-3"
 >
 <ArrowLeft className={`size-4 ${isRTL ? 'rotate-180' : ''}`} />
 {t('common.notFound.goBack', 'Go Back')}
 </button>
 </div>
 </div>
 </div>
 )
 },
})
