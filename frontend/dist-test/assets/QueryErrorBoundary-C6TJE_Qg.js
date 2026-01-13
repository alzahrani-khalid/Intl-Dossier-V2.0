import { j as e, u as x } from './react-vendor-Buoak6m3.js'
import { n as y } from './tanstack-vendor-BZC-rs5U.js'
import { a_ as g, af as h, al as j, ag as p, B as u } from './index-qYY0KoZ1.js'
import { bv as w, aA as v, aB as E, bu as N } from './vendor-misc-BiJvMP0A.js'
function R({ children: o, fallbackMessage: i }) {
  return e.jsx(y, {
    children: ({ reset: s }) =>
      e.jsx(g, {
        onError: (r) => {
          console.error('[QueryErrorBoundary] Query error:', r)
        },
        fallback: e.jsx(q, { onReset: s, message: i }),
        children: o,
      }),
  })
}
function q({ onReset: o, message: i, error: s }) {
  const { t: r, i18n: d } = x(),
    l = d.language === 'ar',
    a = s?.message.includes('fetch') || s?.message.includes('network'),
    c = s?.message.includes('401') || s?.message.includes('unauthorized'),
    m = s?.message.includes('500') || s?.message.includes('server'),
    f = a ? w : v
  let t = r('error.query.generic', 'Failed to load data')
  a
    ? (t = r('error.query.network', 'Connection Error'))
    : c
      ? (t = r('error.query.auth', 'Authentication Error'))
      : m && (t = r('error.query.server', 'Server Error'))
  let n =
    i || r('error.query.genericDescription', 'Unable to load the requested data. Please try again.')
  return (
    a
      ? (n = r(
          'error.query.networkDescription',
          'Unable to connect to the server. Please check your internet connection.',
        ))
      : c
        ? (n = r(
            'error.query.authDescription',
            'Your session may have expired. Please sign in again.',
          ))
        : m &&
          (n = r(
            'error.query.serverDescription',
            'The server encountered an error. Please try again later.',
          )),
    e.jsx('div', {
      className: 'flex min-h-[400px] items-center justify-center p-4 sm:p-6',
      dir: l ? 'rtl' : 'ltr',
      children: e.jsxs('div', {
        className: 'w-full max-w-lg',
        children: [
          e.jsxs(h, {
            variant: 'destructive',
            className: 'mb-4',
            children: [
              e.jsx(f, { className: 'size-5' }),
              e.jsx(j, { className: 'mb-2 text-start text-base sm:text-lg', children: t }),
              e.jsx(p, { className: 'text-start text-sm sm:text-base', children: n }),
            ],
          }),
          e.jsxs('div', {
            className: 'flex flex-col gap-3 sm:flex-row sm:gap-4',
            children: [
              e.jsxs(u, {
                onClick: o,
                className: ' w-full sm: sm:w-auto',
                variant: 'default',
                children: [
                  e.jsx(E, { className: `size-4 ${l ? 'ms-2' : 'me-2'}` }),
                  r('error.query.retry', 'Retry'),
                ],
              }),
              a &&
                e.jsxs(u, {
                  onClick: () => window.location.reload(),
                  className: ' w-full sm: sm:w-auto',
                  variant: 'outline',
                  children: [
                    e.jsx(N, { className: `size-4 ${l ? 'ms-2' : 'me-2'}` }),
                    r('error.query.reload', 'Reload Page'),
                  ],
                }),
              c &&
                e.jsx(u, {
                  onClick: () => (window.location.href = '/login'),
                  className: ' w-full sm: sm:w-auto',
                  variant: 'outline',
                  children: r('error.query.signIn', 'Sign In'),
                }),
            ],
          }),
        ],
      }),
    })
  )
}
export { R as Q }
//# sourceMappingURL=QueryErrorBoundary-C6TJE_Qg.js.map
