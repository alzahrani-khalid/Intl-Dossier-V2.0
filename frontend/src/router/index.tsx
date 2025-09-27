import { createRouter } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import type { AuthContextValue } from '../contexts/auth.context'

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-base-50 to-base-100 p-8">
      <div className="max-w-lg rounded-2xl border border-base-200 bg-white p-8 text-center shadow-xl">
        <h2 className="text-2xl font-display font-semibold text-red-600">
          {error?.name ?? 'Application error'}
        </h2>
        <p className="mt-4 text-base text-base-600">
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
})
