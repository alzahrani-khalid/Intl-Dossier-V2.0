import { r as b, o as f, j as e, z as m } from './react-vendor-Buoak6m3.js'
import { aQ as u, aK as p, aS as g } from './vendor-misc-BiJvMP0A.js'
import { i as h } from './tanstack-vendor-BZC-rs5U.js'
import { s as y } from './index-qYY0KoZ1.js'
import { o as j, s as d } from './form-vendor-BX1BhTCI.js'
import './date-vendor-s0MkYge4.js'
import './visualization-vendor-f5uYUx4I.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
const k = j({
  email: d().email('Invalid email address'),
  password: d().min(6, 'Password must be at least 6 characters'),
  confirmPassword: d(),
  name: d().min(2, 'Name must be at least 2 characters'),
}).refine((a) => a.password === a.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
function w() {
  const a = h(),
    [t, l] = b.useState(!1),
    {
      register: o,
      handleSubmit: c,
      formState: { errors: s },
    } = f({ resolver: u(k) }),
    x = async (r) => {
      l(!0)
      try {
        const { data: i, error: n } = await y.auth.signUp({
          email: r.email,
          password: r.password,
          options: { data: { name: r.name, role: 'user' } },
        })
        if (n) throw n
        i.user &&
          (m.success(
            'Account created successfully! Please check your email to verify your account.',
          ),
          a({ to: '/login' }))
      } catch (i) {
        const n = i instanceof Error ? i.message : 'Registration failed'
        m.error(n)
      } finally {
        l(!1)
      }
    }
  return e.jsx('div', {
    className:
      'from-base-50 to-base-100 flex min-h-screen items-center justify-center bg-gradient-to-br p-4',
    children: e.jsxs('div', {
      className: 'w-full max-w-md',
      children: [
        e.jsxs('div', {
          className: 'dark:bg-base-800 rounded-2xl bg-white p-8 shadow-xl',
          children: [
            e.jsx('div', {
              className: 'mb-6 flex justify-center',
              children: e.jsx('div', {
                className:
                  'flex size-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900',
                children: e.jsx(p, { className: 'size-8 text-primary-600 dark:text-primary-400' }),
              }),
            }),
            e.jsx('h1', {
              className: 'font-display text-base-900 dark:text-base-50 mb-2 text-center text-2xl',
              children: 'Create Your Account',
            }),
            e.jsx('p', {
              className: 'text-base-600 dark:text-base-400 font-text mb-6 text-center',
              children: 'Join GASTAT International Dossier System',
            }),
            e.jsxs('form', {
              onSubmit: c(x),
              className: 'space-y-4',
              children: [
                e.jsxs('div', {
                  children: [
                    e.jsx('label', {
                      className:
                        'text-base-700 dark:text-base-300 font-text mb-2 block text-sm font-medium',
                      children: 'Full Name',
                    }),
                    e.jsx('input', {
                      ...o('name'),
                      type: 'text',
                      placeholder: 'John Doe',
                      className:
                        'border-base-300 dark:border-base-600 dark:bg-base-800 dark:text-base-50 font-text w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500',
                      disabled: t,
                    }),
                    s.name &&
                      e.jsx('p', {
                        className: 'font-text mt-1 text-sm text-red-600 dark:text-red-400',
                        children: s.name.message,
                      }),
                  ],
                }),
                e.jsxs('div', {
                  children: [
                    e.jsx('label', {
                      className:
                        'text-base-700 dark:text-base-300 font-text mb-2 block text-sm font-medium',
                      children: 'Email',
                    }),
                    e.jsx('input', {
                      ...o('email'),
                      type: 'email',
                      placeholder: 'user@gastat.sa',
                      className:
                        'border-base-300 dark:border-base-600 dark:bg-base-800 dark:text-base-50 font-text w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500',
                      disabled: t,
                    }),
                    s.email &&
                      e.jsx('p', {
                        className: 'font-text mt-1 text-sm text-red-600 dark:text-red-400',
                        children: s.email.message,
                      }),
                  ],
                }),
                e.jsxs('div', {
                  children: [
                    e.jsx('label', {
                      className:
                        'text-base-700 dark:text-base-300 font-text mb-2 block text-sm font-medium',
                      children: 'Password',
                    }),
                    e.jsx('input', {
                      ...o('password'),
                      type: 'password',
                      className:
                        'border-base-300 dark:border-base-600 dark:bg-base-800 dark:text-base-50 font-text w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500',
                      disabled: t,
                    }),
                    s.password &&
                      e.jsx('p', {
                        className: 'font-text mt-1 text-sm text-red-600 dark:text-red-400',
                        children: s.password.message,
                      }),
                  ],
                }),
                e.jsxs('div', {
                  children: [
                    e.jsx('label', {
                      className:
                        'text-base-700 dark:text-base-300 font-text mb-2 block text-sm font-medium',
                      children: 'Confirm Password',
                    }),
                    e.jsx('input', {
                      ...o('confirmPassword'),
                      type: 'password',
                      className:
                        'border-base-300 dark:border-base-600 dark:bg-base-800 dark:text-base-50 font-text w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500',
                      disabled: t,
                    }),
                    s.confirmPassword &&
                      e.jsx('p', {
                        className: 'font-text mt-1 text-sm text-red-600 dark:text-red-400',
                        children: s.confirmPassword.message,
                      }),
                  ],
                }),
                e.jsx('button', {
                  type: 'submit',
                  disabled: t,
                  className:
                    'font-text flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-3 font-medium text-primary-50 transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50',
                  children: t
                    ? e.jsxs(e.Fragment, {
                        children: [
                          e.jsx(g, { className: 'me-2 size-4 animate-spin' }),
                          'Creating Account...',
                        ],
                      })
                    : 'Sign Up',
                }),
                e.jsxs('div', {
                  className: 'text-base-600 dark:text-base-400 font-text text-center text-sm',
                  children: [
                    'Already have an account?',
                    ' ',
                    e.jsx('a', {
                      href: '/login',
                      className:
                        'font-text text-primary-600 hover:text-primary-700 hover:underline',
                      onClick: (r) => {
                        ;(r.preventDefault(), a({ to: '/login' }))
                      },
                      children: 'Sign In',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        e.jsx('div', {
          className: 'text-base-600 dark:text-base-400 font-text mt-6 text-center text-sm',
          children: '© 2025 GASTAT - General Authority for Statistics',
        }),
      ],
    }),
  })
}
const G = w
export { G as component }
//# sourceMappingURL=register-DySy_0q6.js.map
