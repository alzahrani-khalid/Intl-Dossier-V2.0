import { u as k, r as x, j as e, o as L, z as A } from './react-vendor-Buoak6m3.js'
import {
  bx as u,
  by as w,
  aK as I,
  bz as $,
  bc as q,
  bA as E,
  b5 as P,
  aS as T,
  aQ as R,
} from './vendor-misc-BiJvMP0A.js'
import { i as B } from './tanstack-vendor-BZC-rs5U.js'
import { c as l, C as G, u as H, L as D } from './index-qYY0KoZ1.js'
import { o as K, b as O, s as C } from './form-vendor-BX1BhTCI.js'
import './date-vendor-s0MkYge4.js'
import './visualization-vendor-f5uYUx4I.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
function S({
  label: t,
  name: a,
  register: y,
  error: s,
  required: g = !1,
  helpText: n,
  icon: c,
  type: b = 'text',
  variant: d = 'default',
  placeholders: r = [],
  placeholder: f,
  ...j
}) {
  const { t: o, i18n: _ } = k(),
    m = _.language === 'ar',
    [p, v] = x.useState(0),
    [i, h] = x.useState(!1)
  x.useEffect(() => {
    if (d === 'aceternity' && r.length > 0) {
      const z = setInterval(() => {
        v((F) => (F + 1) % r.length)
      }, 3e3)
      return () => clearInterval(z)
    }
  }, [d, r.length])
  const N = l(
      'w-full px-4 py-2',
      'min-h-11 sm:min-h-10 md:min-h-12',
      'text-sm sm:text-base',
      c ? (m ? 'pe-12' : 'ps-12') : '',
      s ? 'border-red-500 dark:border-red-400' : 'border-input dark:border-gray-600',
      'border rounded-lg',
      'focus:ring-2 focus:border-transparent',
      s ? 'focus:ring-red-500' : 'focus:ring-primary-500',
      'dark:bg-gray-700 dark:text-white',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'transition-all duration-200',
    ),
    M = l(
      N,
      'bg-white dark:bg-zinc-800',
      'shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),_0px_1px_0px_0px_rgba(25,28,33,0.02),_0px_0px_0px_1px_rgba(25,28,33,0.08)]',
      'focus:shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.2),_0px_1px_0px_0px_rgba(25,28,33,0.04),_0px_0px_0px_2px_rgba(var(--primary),0.3)]',
      i && 'bg-gray-50 dark:bg-zinc-700',
    )
  return e.jsxs('div', {
    className: 'space-y-2',
    dir: m ? 'rtl' : 'ltr',
    children: [
      e.jsxs(u.label, {
        htmlFor: a,
        className: l(
          'block font-medium text-start',
          'text-sm sm:text-base',
          'text-gray-700 dark:text-gray-300',
        ),
        initial: { opacity: 0, y: -5 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.2 },
        children: [
          t,
          g &&
            e.jsx('span', {
              className: 'text-red-500 ms-1',
              'aria-label': o('validation.required'),
              children: '*',
            }),
        ],
      }),
      e.jsxs('div', {
        className: 'relative',
        children: [
          c &&
            e.jsx(u.div, {
              className: l(
                'absolute top-1/2 -translate-y-1/2',
                'text-gray-400',
                m ? 'end-3' : 'start-3',
              ),
              initial: { opacity: 0, scale: 0.8 },
              animate: { opacity: 1, scale: 1 },
              transition: { duration: 0.2, delay: 0.1 },
              children: c,
            }),
          e.jsx('input', {
            id: a,
            type: b,
            ...(y ? y(a) : {}),
            className: d === 'aceternity' ? M : N,
            'aria-invalid': !!s,
            'aria-describedby': s ? `${a}-error` : n ? `${a}-help` : void 0,
            onFocus: () => h(!0),
            onBlur: () => h(!1),
            placeholder: d === 'aceternity' && r.length > 0 ? '' : f,
            ...j,
          }),
          d === 'aceternity' &&
            r.length > 0 &&
            !j.value &&
            e.jsx('div', {
              className: 'absolute inset-0 flex items-center pointer-events-none px-4 sm:px-10',
              children: e.jsx(w, {
                mode: 'wait',
                children: e.jsx(
                  u.p,
                  {
                    initial: { y: 5, opacity: 0 },
                    animate: { y: 0, opacity: 1 },
                    exit: { y: -15, opacity: 0 },
                    transition: { duration: 0.3, ease: 'linear' },
                    className: l(
                      'text-gray-400 dark:text-zinc-500',
                      'text-sm sm:text-base',
                      'truncate w-full',
                      'text-start',
                    ),
                    children: r[p],
                  },
                  `placeholder-${p}`,
                ),
              }),
            }),
        ],
      }),
      n &&
        !s &&
        e.jsx(u.p, {
          id: `${a}-help`,
          className: 'text-sm text-gray-600 dark:text-gray-400 text-start',
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.2, delay: 0.15 },
          children: n,
        }),
      e.jsx(w, {
        children:
          s &&
          e.jsx(u.p, {
            id: `${a}-error`,
            className: 'text-sm text-red-600 dark:text-red-400 text-start',
            initial: { opacity: 0, y: -5 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -5 },
            transition: { duration: 0.2 },
            children: o(s.message || 'validation.required'),
          }),
      }),
    ],
  })
}
function Q({
  label: t,
  name: a,
  register: y,
  error: s,
  required: g = !1,
  helpText: n,
  variant: c = 'default',
  checked: b,
  onCheckedChange: d,
  disabled: r = !1,
}) {
  const { t: f, i18n: j } = k(),
    o = j.language === 'ar',
    [_, m] = x.useState(!1),
    [p, v] = x.useState(!1),
    i = l(
      'flex items-start gap-3',
      'py-2',
      o && 'flex-row-reverse',
      r && 'opacity-50 cursor-not-allowed',
    ),
    h = l(
      'text-start cursor-pointer select-none',
      'text-sm sm:text-base',
      'text-gray-700 dark:text-gray-300',
      r && 'cursor-not-allowed',
    ),
    N = l(
      'h-5 w-5 sm:h-4 sm:w-4',
      'shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1)]',
      'transition-all duration-200',
      _ && 'scale-110',
      p && 'ring-2 ring-primary-500/30',
    )
  return e.jsxs('div', {
    className: 'space-y-2',
    dir: o ? 'rtl' : 'ltr',
    children: [
      e.jsxs(u.div, {
        className: i,
        initial: c === 'aceternity' ? { opacity: 0, x: o ? 10 : -10 } : void 0,
        animate: c === 'aceternity' ? { opacity: 1, x: 0 } : void 0,
        transition: { duration: 0.2 },
        onMouseEnter: () => m(!0),
        onMouseLeave: () => m(!1),
        children: [
          e.jsx(G, {
            id: a,
            checked: b,
            onCheckedChange: d,
            disabled: r,
            className: c === 'aceternity' ? N : 'h-4 w-4',
            onFocus: () => v(!0),
            onBlur: () => v(!1),
            'aria-invalid': !!s,
            'aria-describedby': s ? `${a}-error` : n ? `${a}-help` : void 0,
            ...(y ? y(a) : {}),
          }),
          e.jsxs('label', {
            htmlFor: a,
            className: h,
            children: [
              t,
              g &&
                e.jsx('span', {
                  className: 'text-red-500 ms-1',
                  'aria-label': f('validation.required'),
                  children: '*',
                }),
            ],
          }),
        ],
      }),
      n &&
        !s &&
        e.jsx(u.p, {
          id: `${a}-help`,
          className: l('text-sm text-gray-600 dark:text-gray-400 text-start', o ? 'me-8' : 'ms-8'),
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.2, delay: 0.15 },
          children: n,
        }),
      e.jsx(w, {
        children:
          s &&
          e.jsx(u.p, {
            id: `${a}-error`,
            className: l('text-sm text-red-600 dark:text-red-400 text-start', o ? 'me-8' : 'ms-8'),
            initial: { opacity: 0, y: -5 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -5 },
            transition: { duration: 0.2 },
            children: f(s.message || 'validation.required'),
          }),
      }),
    ],
  })
}
const U = K({
  email: C().min(1, 'validation.required').email('validation.email'),
  password: C().min(1, 'validation.required').min(6, 'validation.minLength'),
  rememberMe: O().optional(),
})
function J() {
  const { t } = k(),
    a = B(),
    { login: y, isLoading: s, error: g } = H(),
    [n, c] = x.useState(!1),
    [b, d] = x.useState(!1),
    [r, f] = x.useState(''),
    [j, o] = x.useState(!1),
    {
      register: _,
      handleSubmit: m,
      formState: { errors: p },
    } = L({ resolver: R(U) }),
    v = async (i) => {
      try {
        ;(await y(i.email, i.password, b ? r : void 0), a({ to: '/' }))
      } catch (h) {
        h instanceof Error && h.message.includes('MFA')
          ? d(!0)
          : A.error(t('auth.invalidCredentials'))
      }
    }
  return e.jsx('div', {
    className:
      'flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4',
    children: e.jsxs('div', {
      className: 'w-full max-w-md',
      children: [
        e.jsx('div', { className: 'mb-4 flex justify-end', children: e.jsx(D, {}) }),
        e.jsxs('div', {
          className: 'rounded-2xl bg-card p-8 shadow-xl',
          children: [
            e.jsxs('div', {
              className: 'mb-8 text-center',
              children: [
                e.jsx('div', {
                  className:
                    'mb-4 inline-flex size-16 items-center justify-center rounded-full bg-primary/10',
                  children: e.jsx(I, { className: 'size-8 text-primary' }),
                }),
                e.jsx('h1', {
                  className: 'text-2xl font-bold text-foreground',
                  children: t('common.appTitle'),
                }),
                e.jsx('p', { className: 'mt-2 text-muted-foreground', children: t('auth.signIn') }),
              ],
            }),
            e.jsxs('form', {
              onSubmit: m(v),
              className: 'space-y-6',
              children: [
                e.jsx(S, {
                  label: t('auth.email'),
                  name: 'email',
                  type: 'email',
                  icon: e.jsx($, { className: 'h-4 w-4' }),
                  register: _,
                  error: p.email,
                  required: !0,
                  variant: 'aceternity',
                  placeholder: 'user@gastat.sa',
                  autoComplete: 'username',
                }),
                e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    e.jsxs('label', {
                      className:
                        'block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 text-start',
                      children: [
                        t('auth.password'),
                        e.jsx('span', {
                          className: 'text-red-500 ms-1',
                          'aria-label': t('validation.required'),
                          children: '*',
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'relative',
                      children: [
                        e.jsx(q, {
                          className:
                            'absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400',
                        }),
                        e.jsx('input', {
                          ..._('password'),
                          type: n ? 'text' : 'password',
                          id: 'password',
                          autoComplete: 'current-password',
                          className:
                            'w-full min-h-11 sm:min-h-10 md:min-h-12 text-sm sm:text-base px-4 ps-12 pe-12 py-2 border border-input dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent focus:ring-primary-500 dark:bg-zinc-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),_0px_1px_0px_0px_rgba(25,28,33,0.02),_0px_0px_0px_1px_rgba(25,28,33,0.08)] focus:shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.2),_0px_1px_0px_0px_rgba(25,28,33,0.04),_0px_0px_0px_2px_rgba(var(--primary),0.3)]',
                        }),
                        e.jsx('button', {
                          type: 'button',
                          onClick: () => c(!n),
                          className:
                            'absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors',
                          children: n
                            ? e.jsx(E, { className: 'size-5' })
                            : e.jsx(P, { className: 'size-5' }),
                        }),
                      ],
                    }),
                    p.password &&
                      e.jsx('p', {
                        className: 'text-sm text-red-600 dark:text-red-400 text-start',
                        children: t(p.password.message || '', { min: 6 }),
                      }),
                  ],
                }),
                b &&
                  e.jsx(S, {
                    label: t('auth.mfaCode'),
                    name: 'mfaCode',
                    type: 'text',
                    value: r,
                    onChange: (i) => f(i.target.value),
                    variant: 'aceternity',
                    placeholder: '123456',
                    maxLength: 6,
                    helpText: t('auth.enterMfaCode'),
                  }),
                e.jsxs('div', {
                  className: 'flex items-center justify-between',
                  children: [
                    e.jsx(Q, {
                      label: t('auth.rememberMe'),
                      name: 'rememberMe',
                      checked: j,
                      onCheckedChange: (i) => o(i === !0),
                      variant: 'aceternity',
                    }),
                    e.jsx('a', {
                      href: '#',
                      className: 'text-sm text-primary hover:text-primary/80',
                      children: t('auth.forgotPassword'),
                    }),
                  ],
                }),
                g &&
                  e.jsx('div', {
                    className: 'rounded-lg border border-destructive/20 bg-destructive/10 p-3',
                    children: e.jsx('p', { className: 'text-sm text-destructive', children: g }),
                  }),
                e.jsx('button', {
                  type: 'submit',
                  disabled: s,
                  className:
                    'w-full min-h-11 sm:min-h-10 md:min-h-12 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                  children: s
                    ? e.jsxs('span', {
                        className: 'flex items-center justify-center',
                        children: [
                          e.jsx(T, { className: 'me-2 size-5 animate-spin' }),
                          t('common.loading'),
                        ],
                      })
                    : t('auth.signIn'),
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'mt-4 text-center text-sm text-muted-foreground',
              children: [
                t('auth.dontHaveAccount'),
                ' ',
                e.jsx('a', {
                  href: '/register',
                  className: 'text-primary hover:text-primary/80 hover:underline',
                  onClick: (i) => {
                    ;(i.preventDefault(), a({ to: '/register' }))
                  },
                  children: t('auth.signUp'),
                }),
              ],
            }),
          ],
        }),
        e.jsx('p', {
          className: 'mt-6 text-center text-sm text-muted-foreground',
          children: '© 2025 GASTAT - General Authority for Statistics',
        }),
      ],
    }),
  })
}
function V() {
  return e.jsx(J, {})
}
const ne = V
export { ne as component }
//# sourceMappingURL=login-DOSgMoLK.js.map
