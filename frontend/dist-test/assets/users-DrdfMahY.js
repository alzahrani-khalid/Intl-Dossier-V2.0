import { j as e, r as x, u as W } from './react-vendor-Buoak6m3.js'
import { i as X, a as Y } from './tanstack-vendor-BZC-rs5U.js'
import {
  c as u,
  M as Z,
  B as S,
  j as C,
  l as R,
  I as ee,
  q as N,
  r as y,
  t as w,
  v as P,
  w as t,
  N as se,
  O as ae,
  P as V,
  Q as d,
  R as te,
  U as m,
  m as j,
  k as le,
  o as re,
  V as ne,
} from './index-qYY0KoZ1.js'
import { af as ie, ag as ce, ah as oe } from './ui-vendor-DTR9u_Vg.js'
import { c5 as de, aE as me, bS as I, b5 as E } from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
const U = ({ className: s, ...l }) =>
  e.jsx('nav', {
    role: 'navigation',
    'aria-label': 'pagination',
    className: u('mx-auto flex w-full justify-center', s),
    ...l,
  })
U.displayName = 'Pagination'
const A = x.forwardRef(({ className: s, ...l }, i) =>
  e.jsx('ul', { ref: i, className: u('flex flex-row items-center gap-1', s), ...l }),
)
A.displayName = 'PaginationContent'
const g = x.forwardRef(({ className: s, ...l }, i) =>
  e.jsx('li', { ref: i, className: u('', s), ...l }),
)
g.displayName = 'PaginationItem'
const b = ({ className: s, isActive: l, size: i = 'icon', ...r }) =>
  e.jsx('a', {
    'aria-current': l ? 'page' : void 0,
    className: u(Z({ variant: l ? 'outline' : 'ghost', size: i }), s),
    ...r,
  })
b.displayName = 'PaginationLink'
const F = ({ className: s, ...l }) =>
  e.jsxs(b, {
    'aria-label': 'Go to previous page',
    className: u('gap-1 pl-2.5', s),
    ...l,
    children: [e.jsx(ie, { className: 'h-4 w-4' }), e.jsx('span', { children: 'Previous' })],
  })
F.displayName = 'PaginationPrevious'
const M = ({ className: s, ...l }) =>
  e.jsxs(b, {
    'aria-label': 'Go to next page',
    className: u('gap-1 pr-2.5', s),
    ...l,
    children: [e.jsx('span', { children: 'Next' }), e.jsx(oe, { className: 'h-4 w-4' })],
  })
M.displayName = 'PaginationNext'
const z = ({ className: s, ...l }) =>
  e.jsxs('span', {
    'aria-hidden': !0,
    className: u('flex h-9 w-9 items-center justify-center', s),
    ...l,
    children: [
      e.jsx(ce, { className: 'h-4 w-4' }),
      e.jsx('span', { className: 'sr-only', children: 'More pages' }),
    ],
  })
z.displayName = 'PaginationEllipsis'
function xe() {
  const { t: s, i18n: l } = W('user-management'),
    i = X(),
    r = l.language === 'ar',
    [_, H] = x.useState(''),
    [L, Q] = x.useState('all'),
    [T, q] = x.useState('all'),
    [$, O] = x.useState('all'),
    [n, f] = x.useState(1),
    [h, G] = x.useState(25),
    { data: p, isLoading: K } = Y({
      queryKey: ['users', _, L, T, $, n, h],
      queryFn: async () => {
        const a = [
          {
            id: '1',
            username: 'admin_user',
            full_name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin',
            user_type: 'employee',
            status: 'active',
            last_login_at: new Date().toISOString(),
            mfa_enabled: !0,
          },
        ]
        return { users: a, total: a.length, page: n, pageSize: h }
      },
    }),
    c = Math.ceil((p?.total || 0) / h),
    k = (a) => {
      switch (a) {
        case 'active':
          return 'default'
        case 'inactive':
          return 'secondary'
        case 'deactivated':
        case 'suspended':
          return 'destructive'
        case 'pending':
          return 'outline'
        default:
          return 'secondary'
      }
    },
    B = (a) => {
      switch (a) {
        case 'admin':
          return 'default'
        case 'manager':
          return 'secondary'
        default:
          return 'outline'
      }
    },
    D = (a) => {
      i({ to: `/users/${a}` })
    },
    J = () => {
      i({ to: '/users/create' })
    }
  return K
    ? e.jsx('div', {
        className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6',
        dir: r ? 'rtl' : 'ltr',
        children: e.jsx('div', {
          className: 'text-center py-12 text-muted-foreground',
          children: s('common:common.loading'),
        }),
      })
    : e.jsxs('div', {
        className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6',
        dir: r ? 'rtl' : 'ltr',
        children: [
          e.jsxs('div', {
            className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6',
            children: [
              e.jsxs('div', {
                children: [
                  e.jsx('h1', {
                    className: 'text-2xl sm:text-3xl font-bold text-start',
                    children: s('usersList.title'),
                  }),
                  e.jsx('p', {
                    className: 'text-sm sm:text-base text-muted-foreground text-start mt-1',
                    children: s('usersList.showing', {
                      from: (n - 1) * h + 1,
                      to: Math.min(n * h, p?.total || 0),
                      total: p?.total || 0,
                    }),
                  }),
                ],
              }),
              e.jsxs(S, {
                onClick: J,
                className: `w-full sm:w-auto min-h-11 ${r ? 'flex-row-reverse' : ''}`,
                children: [
                  e.jsx(de, { className: `h-4 w-4 ${r ? 'ms-2' : 'me-2'}` }),
                  s('userOnboarding.createUser'),
                ],
              }),
            ],
          }),
          e.jsx(C, {
            className: 'mb-6',
            children: e.jsx(R, {
              className: 'pt-6',
              children: e.jsxs('div', {
                className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4',
                children: [
                  e.jsx('div', {
                    className: 'sm:col-span-2 lg:col-span-1',
                    children: e.jsxs('div', {
                      className: 'relative',
                      children: [
                        e.jsx(me, {
                          className: `absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${r ? 'right-3' : 'left-3'}`,
                        }),
                        e.jsx(ee, {
                          type: 'search',
                          placeholder: s('usersList.searchPlaceholder'),
                          value: _,
                          onChange: (a) => H(a.target.value),
                          className: `min-h-11 ${r ? 'pr-10' : 'pl-10'}`,
                        }),
                      ],
                    }),
                  }),
                  e.jsx('div', {
                    children: e.jsxs(N, {
                      value: L,
                      onValueChange: Q,
                      children: [
                        e.jsx(y, {
                          className: '',
                          children: e.jsx(w, { placeholder: s('usersList.filterByRole') }),
                        }),
                        e.jsxs(P, {
                          children: [
                            e.jsx(t, { value: 'all', children: s('usersList.showAll') }),
                            e.jsx(t, { value: 'admin', children: s('roles.admin') }),
                            e.jsx(t, { value: 'manager', children: s('roles.manager') }),
                            e.jsx(t, { value: 'staff', children: s('roles.staff') }),
                            e.jsx(t, { value: 'viewer', children: s('roles.viewer') }),
                          ],
                        }),
                      ],
                    }),
                  }),
                  e.jsx('div', {
                    children: e.jsxs(N, {
                      value: T,
                      onValueChange: q,
                      children: [
                        e.jsx(y, {
                          className: '',
                          children: e.jsx(w, { placeholder: s('usersList.filterByStatus') }),
                        }),
                        e.jsxs(P, {
                          children: [
                            e.jsx(t, { value: 'all', children: s('usersList.showAll') }),
                            e.jsx(t, { value: 'active', children: s('userStatus.active') }),
                            e.jsx(t, { value: 'inactive', children: s('userStatus.inactive') }),
                            e.jsx(t, { value: 'pending', children: s('userStatus.pending') }),
                            e.jsx(t, {
                              value: 'deactivated',
                              children: s('userStatus.deactivated'),
                            }),
                          ],
                        }),
                      ],
                    }),
                  }),
                  e.jsx('div', {
                    children: e.jsxs(N, {
                      value: $,
                      onValueChange: O,
                      children: [
                        e.jsx(y, {
                          className: '',
                          children: e.jsx(w, { placeholder: s('usersList.filterByType') }),
                        }),
                        e.jsxs(P, {
                          children: [
                            e.jsx(t, { value: 'all', children: s('usersList.showAll') }),
                            e.jsx(t, { value: 'employee', children: s('userTypes.employee') }),
                            e.jsx(t, { value: 'contractor', children: s('userTypes.contractor') }),
                            e.jsx(t, { value: 'guest', children: s('userTypes.guest') }),
                          ],
                        }),
                      ],
                    }),
                  }),
                ],
              }),
            }),
          }),
          e.jsx('div', {
            className: 'hidden md:block',
            children: e.jsx(C, {
              children: e.jsxs(se, {
                children: [
                  e.jsx(ae, {
                    children: e.jsxs(V, {
                      children: [
                        e.jsx(d, { className: 'text-start', children: s('userProfile.username') }),
                        e.jsx(d, { className: 'text-start', children: s('userProfile.fullName') }),
                        e.jsx(d, { className: 'text-start', children: s('userProfile.email') }),
                        e.jsx(d, { className: 'text-start', children: s('userProfile.role') }),
                        e.jsx(d, { className: 'text-start', children: s('userProfile.userType') }),
                        e.jsx(d, { className: 'text-start', children: s('userProfile.status') }),
                        e.jsx(d, {
                          className: 'text-start',
                          children: s('userProfile.lastLoginAt'),
                        }),
                        e.jsx(d, { className: 'text-end', children: s('actions.actions') }),
                      ],
                    }),
                  }),
                  e.jsx(te, {
                    children: p?.users?.map((a) =>
                      e.jsxs(
                        V,
                        {
                          children: [
                            e.jsx(m, {
                              className: 'font-medium',
                              children: e.jsxs('div', {
                                className: 'flex flex-row items-center gap-2',
                                children: [
                                  a.mfa_enabled &&
                                    e.jsx(I, {
                                      className: 'h-3 w-3 text-green-600',
                                      title: s('userProfile.mfaEnabled'),
                                    }),
                                  a.username,
                                ],
                              }),
                            }),
                            e.jsx(m, { children: a.full_name }),
                            e.jsx(m, { className: 'text-muted-foreground', children: a.email }),
                            e.jsx(m, {
                              children: e.jsx(j, {
                                variant: B(a.role),
                                children: s(`roles.${a.role}`),
                              }),
                            }),
                            e.jsx(m, {
                              children: e.jsx(j, {
                                variant: 'outline',
                                children: s(`userTypes.${a.user_type}`),
                              }),
                            }),
                            e.jsx(m, {
                              children: e.jsx(j, {
                                variant: k(a.status),
                                children: s(`userStatus.${a.status}`),
                              }),
                            }),
                            e.jsx(m, {
                              className: 'text-muted-foreground',
                              children: a.last_login_at
                                ? new Date(a.last_login_at).toLocaleDateString(r ? 'ar' : 'en')
                                : '-',
                            }),
                            e.jsx(m, {
                              className: 'text-end',
                              children: e.jsxs(S, {
                                variant: 'ghost',
                                size: 'sm',
                                onClick: () => D(a.id),
                                className: r ? 'flex-row-reverse' : '',
                                children: [
                                  e.jsx(E, { className: `h-4 w-4 ${r ? 'ms-2' : 'me-2'}` }),
                                  s('actions.viewDetails'),
                                ],
                              }),
                            }),
                          ],
                        },
                        a.id,
                      ),
                    ),
                  }),
                ],
              }),
            }),
          }),
          e.jsx('div', {
            className: 'md:hidden space-y-4',
            children: p?.users?.map((a) =>
              e.jsxs(
                C,
                {
                  children: [
                    e.jsx(le, {
                      className: 'pb-3',
                      children: e.jsxs('div', {
                        className: 'flex flex-row items-start justify-between',
                        children: [
                          e.jsxs('div', {
                            className: 'flex-1',
                            children: [
                              e.jsxs(re, {
                                className: 'text-base flex flex-row items-center gap-2',
                                children: [
                                  a.mfa_enabled &&
                                    e.jsx(I, {
                                      className: 'h-3 w-3 text-green-600',
                                      title: s('userProfile.mfaEnabled'),
                                    }),
                                  a.full_name,
                                ],
                              }),
                              e.jsxs(ne, { className: 'text-sm', children: ['@', a.username] }),
                            ],
                          }),
                          e.jsx(j, {
                            variant: k(a.status),
                            className: 'ms-2',
                            children: s(`userStatus.${a.status}`),
                          }),
                        ],
                      }),
                    }),
                    e.jsxs(R, {
                      className: 'space-y-3',
                      children: [
                        e.jsx('div', {
                          className: 'text-sm text-muted-foreground',
                          children: a.email,
                        }),
                        e.jsxs('div', {
                          className: 'flex flex-row gap-2',
                          children: [
                            e.jsx(j, { variant: B(a.role), children: s(`roles.${a.role}`) }),
                            e.jsx(j, {
                              variant: 'outline',
                              children: s(`userTypes.${a.user_type}`),
                            }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'text-sm text-muted-foreground',
                          children: [
                            s('userProfile.lastLoginAt'),
                            ':',
                            ' ',
                            a.last_login_at
                              ? new Date(a.last_login_at).toLocaleDateString(r ? 'ar' : 'en')
                              : '-',
                          ],
                        }),
                        e.jsx('div', {
                          className: 'pt-2 border-t',
                          children: e.jsxs(S, {
                            variant: 'outline',
                            size: 'sm',
                            onClick: () => D(a.id),
                            className: `w-full min-h-9 ${r ? 'flex-row-reverse' : ''}`,
                            children: [
                              e.jsx(E, { className: `h-4 w-4 ${r ? 'ms-2' : 'me-2'}` }),
                              s('actions.viewDetails'),
                            ],
                          }),
                        }),
                      ],
                    }),
                  ],
                },
                a.id,
              ),
            ),
          }),
          e.jsxs('div', {
            className: 'mt-6 flex flex-col sm:flex-row items-center justify-between gap-4',
            children: [
              e.jsxs('div', {
                className: 'flex flex-row items-center gap-2',
                children: [
                  e.jsxs('span', {
                    className: 'text-sm text-muted-foreground',
                    children: [s('usersList.resultsPerPage'), ':'],
                  }),
                  e.jsxs(N, {
                    value: h.toString(),
                    onValueChange: (a) => {
                      ;(G(Number(a)), f(1))
                    },
                    children: [
                      e.jsx(y, { className: 'w-20 h-9', children: e.jsx(w, {}) }),
                      e.jsxs(P, {
                        children: [
                          e.jsx(t, { value: '10', children: '10' }),
                          e.jsx(t, { value: '25', children: '25' }),
                          e.jsx(t, { value: '50', children: '50' }),
                          e.jsx(t, { value: '100', children: '100' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              e.jsx(U, {
                children: e.jsxs(A, {
                  children: [
                    e.jsx(g, {
                      children: e.jsx(F, {
                        onClick: () => f((a) => Math.max(1, a - 1)),
                        className: n === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer',
                      }),
                    }),
                    Array.from({ length: Math.min(5, c) }, (a, v) => {
                      let o
                      return (
                        c <= 5 || n <= 3
                          ? (o = v + 1)
                          : n >= c - 2
                            ? (o = c - 4 + v)
                            : (o = n - 2 + v),
                        e.jsx(
                          g,
                          {
                            children: e.jsx(b, {
                              onClick: () => f(o),
                              isActive: n === o,
                              className: 'cursor-pointer',
                              children: o,
                            }),
                          },
                          o,
                        )
                      )
                    }),
                    c > 5 && n < c - 2 && e.jsx(g, { children: e.jsx(z, {}) }),
                    e.jsx(g, {
                      children: e.jsx(M, {
                        onClick: () => f((a) => Math.min(c, a + 1)),
                        className: n === c ? 'pointer-events-none opacity-50' : 'cursor-pointer',
                      }),
                    }),
                  ],
                }),
              }),
            ],
          }),
        ],
      })
}
const Pe = xe
export { Pe as component }
//# sourceMappingURL=users-DrdfMahY.js.map
