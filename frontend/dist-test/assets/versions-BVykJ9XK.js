import { u as U, r as c, j as e } from './react-vendor-Buoak6m3.js'
import { L as re } from './tanstack-vendor-BZC-rs5U.js'
import { b as ne } from './useAfterAction-DL23SY7H.js'
import {
  A as L,
  E as P,
  F as R,
  G as B,
  H as O,
  af as y,
  ag as w,
  j as C,
  c as g,
  k as V,
  m as $,
  l as W,
  B as f,
  aW as te,
  N as ae,
  O as ie,
  P as F,
  Q as x,
  R as oe,
  U as m,
  bd as ce,
  a0 as I,
  o as G,
  V as J,
} from './index-qYY0KoZ1.js'
import { bw as D, bh as Q, aS as le, b5 as de, e9 as xe, aX as me } from './vendor-misc-BiJvMP0A.js'
import { H as fe } from './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function he({ afterActionId: l, currentVersion: t, disabled: N = !1, className: h }) {
  const { t: r, i18n: b } = U(),
    o = b.language === 'ar',
    [X, q] = c.useState(!1),
    [A, S] = c.useState(!1),
    [j, T] = c.useState(null),
    [i, K] = c.useState([]),
    [u, k] = c.useState(null),
    [E, v] = c.useState(!1),
    M = async () => {
      ;(S(!0), T(null))
      try {
        const s = await fetch(`/api/after-actions/${l}/versions`)
        if (!s.ok) throw new Error(r('afterActions.versions.loadFailed'))
        const a = await s.json()
        K(a.versions || [])
      } catch (s) {
        T(s instanceof Error ? s.message : r('afterActions.versions.loadFailed'))
      } finally {
        S(!1)
      }
    },
    Y = (s, a) => {
      ;(k([s, a]), v(!0))
    },
    Z = () => {
      if (!u) return []
      const [s, a] = u,
        p = i.find((d) => d.version_number === s),
        n = i.find((d) => d.version_number === a)
      return !p || !n ? [] : xe.diff(p.content, n.content) || []
    },
    _ = (s) => (s == null ? 'null' : typeof s == 'object' ? JSON.stringify(s, null, 2) : String(s)),
    z = (s) => {
      switch (s) {
        case 'N':
          return 'text-green-600 bg-green-50'
        case 'D':
          return 'text-red-600 bg-red-50'
        case 'E':
          return 'text-yellow-600 bg-yellow-50'
        case 'A':
          return 'text-blue-600 bg-blue-50'
        default:
          return ''
      }
    },
    ee = (s) => {
      switch (s) {
        case 'N':
          return r('afterActions.versions.added')
        case 'D':
          return r('afterActions.versions.deleted')
        case 'E':
          return r('afterActions.versions.modified')
        case 'A':
          return r('afterActions.versions.arrayChange')
        default:
          return ''
      }
    },
    se = (s) => s.join(' � '),
    H = (s) => {
      ;(q(s), s && i.length === 0 && M(), s || (v(!1), k(null)))
    }
  if (E && u) {
    const s = Z(),
      [a, p] = u
    return e.jsx(L, {
      open: E,
      onOpenChange: v,
      children: e.jsxs(P, {
        className: 'max-h-[80vh] max-w-4xl overflow-y-auto',
        dir: o ? 'rtl' : 'ltr',
        children: [
          e.jsxs(R, {
            children: [
              e.jsx(B, { children: r('afterActions.versions.diffTitle', { from: a, to: p }) }),
              e.jsx(O, { children: r('afterActions.versions.diffDescription') }),
            ],
          }),
          e.jsx('div', {
            className: 'space-y-3',
            children:
              s.length === 0
                ? e.jsxs(y, {
                    children: [
                      e.jsx(D, { className: 'size-4' }),
                      e.jsx(w, { children: r('afterActions.versions.noChanges') }),
                    ],
                  })
                : s.map((n, d) =>
                    e.jsxs(
                      C,
                      {
                        className: g('border-l-4', z(n.kind)),
                        children: [
                          e.jsx(V, {
                            className: 'pb-3',
                            children: e.jsxs('div', {
                              className: 'flex items-center justify-between',
                              children: [
                                e.jsx($, { className: z(n.kind), children: ee(n.kind) }),
                                e.jsx('code', {
                                  className: 'text-xs text-muted-foreground',
                                  children: se(n.path),
                                }),
                              ],
                            }),
                          }),
                          e.jsx(W, {
                            className: 'text-sm',
                            children: e.jsxs('div', {
                              className: 'grid grid-cols-1 gap-4 md:grid-cols-2',
                              children: [
                                n.kind !== 'N' &&
                                  e.jsxs('div', {
                                    children: [
                                      e.jsxs('p', {
                                        className: 'mb-1 font-semibold text-red-600',
                                        children: [r('afterActions.versions.before'), ':'],
                                      }),
                                      e.jsx('pre', {
                                        className: 'overflow-x-auto rounded bg-red-50 p-2 text-xs',
                                        children: _(n.lhs),
                                      }),
                                    ],
                                  }),
                                n.kind !== 'D' &&
                                  e.jsxs('div', {
                                    children: [
                                      e.jsxs('p', {
                                        className: 'mb-1 font-semibold text-green-600',
                                        children: [r('afterActions.versions.after'), ':'],
                                      }),
                                      e.jsx('pre', {
                                        className:
                                          'overflow-x-auto rounded bg-green-50 p-2 text-xs',
                                        children: _(n.rhs),
                                      }),
                                    ],
                                  }),
                              ],
                            }),
                          }),
                        ],
                      },
                      d,
                    ),
                  ),
          }),
          e.jsx('div', {
            className: g('flex gap-2', o && 'flex-row-reverse'),
            children: e.jsx(f, {
              variant: 'outline',
              onClick: () => v(!1),
              className: 'flex-1',
              children: r('common.close'),
            }),
          }),
        ],
      }),
    })
  }
  return e.jsxs(L, {
    open: X,
    onOpenChange: H,
    children: [
      e.jsx(te, {
        asChild: !0,
        children: e.jsxs(f, {
          type: 'button',
          variant: 'outline',
          disabled: N,
          className: g('gap-2', h),
          children: [e.jsx(Q, { className: 'size-4' }), r('afterActions.versions.button')],
        }),
      }),
      e.jsxs(P, {
        className: 'max-h-[80vh] max-w-3xl overflow-y-auto',
        dir: o ? 'rtl' : 'ltr',
        children: [
          e.jsxs(R, {
            children: [
              e.jsxs(B, {
                className: 'flex items-center gap-2',
                children: [e.jsx(Q, { className: 'size-5' }), r('afterActions.versions.title')],
              }),
              e.jsx(O, { children: r('afterActions.versions.description') }),
            ],
          }),
          e.jsxs('div', {
            className: 'space-y-4',
            children: [
              A &&
                e.jsx('div', {
                  className: 'flex items-center justify-center py-8',
                  children: e.jsx(le, { className: 'size-6 animate-spin' }),
                }),
              j &&
                e.jsxs(y, {
                  variant: 'destructive',
                  children: [e.jsx(D, { className: 'size-4' }), e.jsx(w, { children: j })],
                }),
              !A &&
                !j &&
                i.length === 0 &&
                e.jsxs(y, {
                  children: [
                    e.jsx(D, { className: 'size-4' }),
                    e.jsx(w, { children: r('afterActions.versions.noVersions') }),
                  ],
                }),
              !A &&
                !j &&
                i.length > 0 &&
                e.jsx('div', {
                  className: 'rounded-md border',
                  children: e.jsxs(ae, {
                    children: [
                      e.jsx(ie, {
                        children: e.jsxs(F, {
                          children: [
                            e.jsx(x, { children: r('afterActions.versions.version') }),
                            e.jsx(x, { children: r('afterActions.versions.changedBy') }),
                            e.jsx(x, { children: r('afterActions.versions.changedAt') }),
                            e.jsx(x, { children: r('afterActions.versions.summary') }),
                            e.jsx(x, { className: 'text-end', children: r('common.actions') }),
                          ],
                        }),
                      }),
                      e.jsx(oe, {
                        children: i.map((s, a) =>
                          e.jsxs(
                            F,
                            {
                              children: [
                                e.jsxs(m, {
                                  className: 'font-medium',
                                  children: [
                                    'v',
                                    s.version_number,
                                    s.version_number === t &&
                                      e.jsx($, {
                                        variant: 'secondary',
                                        className: 'ms-2',
                                        children: r('afterActions.versions.current'),
                                      }),
                                  ],
                                }),
                                e.jsx(m, {
                                  children: e.jsxs('div', {
                                    children: [
                                      e.jsx('p', {
                                        className: 'font-medium',
                                        children: s.changed_by.name,
                                      }),
                                      e.jsx('p', {
                                        className: 'text-xs text-muted-foreground',
                                        children: s.changed_by.email,
                                      }),
                                    ],
                                  }),
                                }),
                                e.jsx(m, { children: fe(new Date(s.changed_at), 'PPp') }),
                                e.jsx(m, {
                                  className: 'max-w-xs truncate',
                                  children:
                                    s.change_summary || r('afterActions.versions.noSummary'),
                                }),
                                e.jsx(m, {
                                  className: 'text-end',
                                  children:
                                    a < i.length - 1 &&
                                    e.jsxs(f, {
                                      variant: 'ghost',
                                      size: 'sm',
                                      onClick: () => Y(i[a + 1].version_number, s.version_number),
                                      children: [
                                        e.jsx(de, { className: 'me-1 size-4' }),
                                        r('afterActions.versions.viewDiff'),
                                      ],
                                    }),
                                }),
                              ],
                            },
                            s.id,
                          ),
                        ),
                      }),
                    ],
                  }),
                }),
            ],
          }),
          e.jsx('div', {
            className: g('flex gap-2', o && 'flex-row-reverse'),
            children: e.jsx(f, {
              variant: 'outline',
              onClick: () => H(!1),
              className: 'flex-1',
              children: r('common.close'),
            }),
          }),
        ],
      }),
    ],
  })
}
function Ce() {
  const { afterActionId: l } = ce.useParams(),
    { t, i18n: N } = U(),
    h = N.language === 'ar',
    { data: r, isLoading: b, error: o } = ne(l)
  return b
    ? e.jsxs('div', {
        className: 'container mx-auto p-6 space-y-6',
        children: [e.jsx(I, { className: 'h-8 w-64' }), e.jsx(I, { className: 'h-96 w-full' })],
      })
    : o
      ? e.jsx('div', {
          className: 'container mx-auto p-6',
          children: e.jsx(C, {
            className: 'border-destructive',
            children: e.jsxs(V, {
              children: [
                e.jsx(G, { className: 'text-destructive', children: t('common.error') }),
                e.jsx(J, { children: t('afterActions.versions.loadError') }),
              ],
            }),
          }),
        })
      : e.jsxs('div', {
          className: `container mx-auto p-6 space-y-6 ${h ? 'rtl' : 'ltr'}`,
          children: [
            e.jsxs('div', {
              className: 'flex items-center gap-4',
              children: [
                e.jsx(f, {
                  variant: 'ghost',
                  size: 'icon',
                  asChild: !0,
                  children: e.jsx(re, {
                    to: '/after-actions/$afterActionId',
                    params: { afterActionId: l },
                    children: e.jsx(me, { className: `h-4 w-4 ${h ? 'rotate-180' : ''}` }),
                  }),
                }),
                e.jsxs('div', {
                  children: [
                    e.jsx('h1', {
                      className: 'text-3xl font-bold',
                      children: t('afterActions.versions.title'),
                    }),
                    e.jsx('p', {
                      className: 'text-muted-foreground',
                      children: t('afterActions.versions.description'),
                    }),
                  ],
                }),
              ],
            }),
            e.jsxs(C, {
              children: [
                e.jsxs(V, {
                  children: [
                    e.jsx(G, { children: t('afterActions.versions.history') }),
                    e.jsx(J, {
                      children:
                        r && r.length > 0
                          ? t('afterActions.versions.count', { count: r.length })
                          : t('afterActions.versions.noVersions'),
                    }),
                  ],
                }),
                e.jsx(W, {
                  children:
                    r && r.length > 0
                      ? e.jsx(he, { afterActionId: l, versions: r })
                      : e.jsx('p', {
                          className: 'text-center text-muted-foreground py-8',
                          children: t('afterActions.versions.noVersionsDescription'),
                        }),
                }),
              ],
            }),
          ],
        })
}
export { Ce as component }
//# sourceMappingURL=versions-BVykJ9XK.js.map
