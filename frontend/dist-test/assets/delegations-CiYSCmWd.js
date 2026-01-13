import { u as S, j as e, r as v } from './react-vendor-Buoak6m3.js'
import { a as z, c as ae, d as te, L as Ne } from './tanstack-vendor-BZC-rs5U.js'
import {
  j as A,
  k as P,
  m as _,
  l as $,
  B as y,
  s as R,
  A as re,
  E as ne,
  F as ie,
  G as le,
  H as ce,
  J as k,
  n as oe,
  K as de,
  ab as me,
  a0 as N,
  q as B,
  r as X,
  t as J,
  v as Y,
  w as M,
  af as xe,
  ag as ue,
  ah as we,
  ai as ye,
  c as be,
  aj as De,
  ak as ke,
  I as _e,
  al as Se,
  V as O,
  o as Ce,
  X as Te,
  Z as Ae,
  _ as Pe,
  $ as Z,
  aa as W,
} from './index-qYY0KoZ1.js'
import { A as $e, a as Re } from './avatar-lQOCSoMx.js'
import {
  P as Ee,
  Q as Fe,
  R as Ie,
  H as E,
  I as he,
  J as ge,
  S as Le,
} from './date-vendor-s0MkYge4.js'
import {
  cq as qe,
  aA as L,
  aR as K,
  bd as H,
  aH as Ue,
  aT as Me,
  cL as F,
  aS as I,
  cO as V,
  aI as Oe,
  cP as Ke,
  c5 as Ve,
  bi as ze,
  bw as He,
  aM as Qe,
  aD as Ge,
  be as Be,
  b9 as Xe,
  cQ as ee,
} from './vendor-misc-BiJvMP0A.js'
import {
  A as Je,
  a as Ye,
  b as Ze,
  c as We,
  d as es,
  e as ss,
  f as as,
  g as ts,
} from './alert-dialog-DaWYDPc1.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function rs({ delegation: s, type: t, onRevoke: r, isRevoking: u = !1 }) {
  const { t: a, i18n: i } = S('delegation'),
    m = i.language === 'ar',
    h = m ? he : ge,
    g = new Date(),
    n = new Date(s.valid_until),
    j = new Date(s.valid_from),
    p = Ee(n, g),
    c = Fe(n)
  Ie(j)
  const f = !!s.revoked_at,
    l = !c && !f && p <= 7,
    x = f
      ? { label: a('badge.revoked'), variant: 'destructive' }
      : c
        ? { label: a('badge.expired'), variant: 'secondary' }
        : l
          ? { label: a('badge.expiringSoon'), variant: 'outline' }
          : { label: a('badge.active'), variant: 'default' },
    D = () => {
      if (c) {
        const b = Math.abs(p)
        return a('card.expired', { days: b })
      }
      return p === 0
        ? a('card.expiresToday')
        : p === 1
          ? a('card.expiresTomorrow')
          : a('card.expiresIn', { days: p })
    },
    C = (b) => {
      const w = b.split('@')[0].split(/[._-]/)
      return w.length >= 2 ? `${w[0][0]}${w[1][0]}`.toUpperCase() : b.slice(0, 2).toUpperCase()
    },
    T = t === 'granted' ? s.grantee_email : s.grantor_email
  return e.jsxs(A, {
    className: `transition-all ${f || c ? 'opacity-60' : ''} ${l ? 'border-yellow-500/50' : ''}`,
    children: [
      e.jsx(P, {
        className: 'pb-3',
        children: e.jsxs('div', {
          className: 'flex flex-col sm:flex-row sm:items-center justify-between gap-3',
          children: [
            e.jsxs('div', {
              className: 'flex items-center gap-3',
              children: [
                e.jsx($e, { className: 'h-10 w-10', children: e.jsx(Re, { children: C(T) }) }),
                e.jsxs('div', {
                  className: 'flex-1 min-w-0',
                  children: [
                    e.jsxs('div', {
                      className: 'flex items-center gap-2',
                      children: [
                        e.jsx('span', {
                          className: 'text-sm text-muted-foreground',
                          children: a(t === 'granted' ? 'card.to' : 'card.from'),
                        }),
                        e.jsx(qe, {
                          className: `h-3 w-3 text-muted-foreground ${m ? 'rotate-180' : ''}`,
                        }),
                      ],
                    }),
                    e.jsx('p', { className: 'font-medium truncate', children: T }),
                  ],
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'flex items-center gap-2',
              children: [
                e.jsx(_, { variant: x.variant, className: 'min-h-6', children: x.label }),
                l && !f && e.jsx(L, { className: 'h-4 w-4 text-yellow-500' }),
              ],
            }),
          ],
        }),
      }),
      e.jsxs($, {
        className: 'space-y-4',
        children: [
          e.jsxs('div', {
            className: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-2 text-sm',
                children: [
                  e.jsx(K, { className: 'h-4 w-4 text-muted-foreground flex-shrink-0' }),
                  e.jsxs('span', {
                    className: 'text-muted-foreground',
                    children: [a('card.validFrom'), ':'],
                  }),
                  e.jsx('span', { className: 'font-medium', children: E(j, 'PP', { locale: h }) }),
                ],
              }),
              e.jsxs('div', {
                className: 'flex items-center gap-2 text-sm',
                children: [
                  e.jsx(K, { className: 'h-4 w-4 text-muted-foreground flex-shrink-0' }),
                  e.jsxs('span', {
                    className: 'text-muted-foreground',
                    children: [a('card.validUntil'), ':'],
                  }),
                  e.jsx('span', { className: 'font-medium', children: E(n, 'PP', { locale: h }) }),
                ],
              }),
            ],
          }),
          !f &&
            e.jsxs('div', {
              className: `flex items-center gap-2 text-sm ${c ? 'text-destructive' : l ? 'text-yellow-600 dark:text-yellow-500' : 'text-muted-foreground'}`,
              children: [
                e.jsx(H, { className: 'h-4 w-4 flex-shrink-0' }),
                e.jsx('span', { children: D() }),
              ],
            }),
          s.reason &&
            e.jsxs('div', {
              className: 'flex items-start gap-2 text-sm',
              children: [
                e.jsx(Ue, { className: 'h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5' }),
                e.jsxs('div', {
                  children: [
                    e.jsxs('span', {
                      className: 'text-muted-foreground',
                      children: [a('card.reason'), ': '],
                    }),
                    e.jsx('span', { children: s.reason }),
                  ],
                }),
              ],
            }),
          (s.resource_type || s.resource_id) &&
            e.jsxs('div', {
              className: 'flex items-center gap-2 text-sm',
              children: [
                e.jsx(Me, { className: 'h-4 w-4 text-muted-foreground flex-shrink-0' }),
                e.jsxs('span', {
                  className: 'text-muted-foreground',
                  children: [a('card.resourceType'), ': '],
                }),
                e.jsx(_, {
                  variant: 'outline',
                  className: 'text-xs',
                  children: s.resource_type
                    ? a(`resourceTypes.${s.resource_type}`)
                    : a('card.allResources'),
                }),
              ],
            }),
          f &&
            s.revoked_at &&
            e.jsx('div', {
              className: 'pt-3 border-t space-y-2',
              children: e.jsxs('div', {
                className: 'flex items-center gap-2 text-sm text-destructive',
                children: [
                  e.jsx(F, { className: 'h-4 w-4 flex-shrink-0' }),
                  e.jsxs('span', { children: [a('card.revokedAt'), ': '] }),
                  e.jsx('span', {
                    className: 'font-medium',
                    children: E(new Date(s.revoked_at), 'PP', { locale: h }),
                  }),
                ],
              }),
            }),
          t === 'granted' &&
            !f &&
            !c &&
            r &&
            e.jsx('div', {
              className: 'pt-3 border-t',
              children: e.jsxs(y, {
                variant: 'outline',
                size: 'sm',
                onClick: () => r(s.id),
                disabled: u,
                className: `w-full sm:w-auto min-h-9 text-destructive hover:text-destructive ${m ? 'flex-row-reverse' : ''}`,
                children: [
                  e.jsx(F, { className: `h-4 w-4 ${m ? 'ms-2' : 'me-2'}` }),
                  a(u ? 'common:common.loading' : 'actions.revoke'),
                ],
              }),
            }),
        ],
      }),
    ],
  })
}
async function ns(s) {
  const { data: t, error: r } = await R.functions.invoke('delegate-permissions', { body: s })
  if (r) throw r
  if (!t) throw new Error('No response from delegate-permissions function')
  return t
}
async function is(s) {
  const { data: t, error: r } = await R.functions.invoke('revoke-delegation', { body: s })
  if (r) throw r
  if (!t) throw new Error('No response from revoke-delegation function')
  return t
}
async function ls(s) {
  const { data: t, error: r } = await R.functions.invoke('validate-delegation', { body: s })
  if (r) throw r
  if (!t) throw new Error('No response from validate-delegation function')
  return t
}
async function cs(s) {
  const t = new URLSearchParams()
  ;(s?.type && t.set('type', s.type),
    s?.active_only !== void 0 && t.set('active_only', s.active_only.toString()),
    s?.expiring_within_days && t.set('expiring_within_days', s.expiring_within_days.toString()))
  const r = `my-delegations${t.toString() ? `?${t.toString()}` : ''}`,
    { data: u, error: a } = await R.functions.invoke(r, { method: 'GET' })
  if (a) throw a
  if (!u) throw new Error('No response from my-delegations function')
  return u
}
const q = {
  all: ['delegations'],
  myDelegations: (s) => ['delegations', 'my', s],
  validate: (s, t, r) => ['delegations', 'validate', s, t, r],
}
function os() {
  const s = ae()
  return te({
    mutationFn: ns,
    onSuccess: () => {
      s.invalidateQueries({ queryKey: q.all })
    },
  })
}
function ds() {
  const s = ae()
  return te({
    mutationFn: is,
    onSuccess: () => {
      s.invalidateQueries({ queryKey: q.all })
    },
  })
}
function ms(s, t) {
  return z({
    queryKey: q.validate(s.grantee_id, s.resource_type, s.resource_id),
    queryFn: () => ls(s),
    enabled: t?.enabled ?? !!s.grantee_id,
    staleTime: 3e4,
  })
}
function fe(s, t) {
  return z({
    queryKey: q.myDelegations(s),
    queryFn: () => cs(s),
    enabled: t?.enabled ?? !0,
    refetchInterval: t?.refetchInterval,
    staleTime: 6e4,
  })
}
function je() {
  return fe({ active_only: !0, expiring_within_days: 7 }, { refetchInterval: 3e5 })
}
function xs({ open: s, onOpenChange: t, delegationId: r, granteeEmail: u, onSuccess: a }) {
  const { t: i, i18n: m } = S('delegation'),
    { toast: h } = me(),
    g = m.language === 'ar',
    [n, j] = v.useState(''),
    [p, c] = v.useState(!1),
    f = ds(),
    l = async () => {
      try {
        ;(await f.mutateAsync({ delegation_id: r, reason: n || void 0 }),
          h({ title: i('revoke.success'), variant: 'default' }),
          t(!1),
          c(!1),
          j(''),
          a?.())
      } catch (x) {
        h({
          title: i('revoke.error'),
          description: x instanceof Error ? x.message : void 0,
          variant: 'destructive',
        })
      }
    },
    d = (x) => {
      ;(x.preventDefault(), c(!0))
    }
  return e.jsxs(e.Fragment, {
    children: [
      e.jsx(re, {
        open: s,
        onOpenChange: t,
        children: e.jsxs(ne, {
          className: 'sm:max-w-[425px]',
          dir: g ? 'rtl' : 'ltr',
          children: [
            e.jsxs(ie, {
              children: [
                e.jsxs(le, {
                  className: 'flex items-center gap-2 text-destructive',
                  children: [e.jsx(F, { className: 'h-5 w-5' }), i('revoke.title')],
                }),
                e.jsx(ce, { children: i('revoke.description') }),
              ],
            }),
            e.jsxs('form', {
              onSubmit: d,
              className: 'space-y-4 py-4',
              children: [
                e.jsx('div', {
                  className: 'bg-muted/50 rounded-lg p-4',
                  children: e.jsxs('p', {
                    className: 'text-sm',
                    children: [
                      e.jsxs('span', {
                        className: 'text-muted-foreground',
                        children: [i('card.to'), ': '],
                      }),
                      e.jsx('span', { className: 'font-medium', children: u }),
                    ],
                  }),
                }),
                e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    e.jsx(k, { htmlFor: 'revoke-reason', children: i('revoke.form.reason') }),
                    e.jsx(oe, {
                      id: 'revoke-reason',
                      value: n,
                      onChange: (x) => j(x.target.value),
                      placeholder: i('revoke.form.reasonPlaceholder'),
                      className: 'min-h-[80px] resize-none',
                    }),
                  ],
                }),
              ],
            }),
            e.jsxs(de, {
              className: 'gap-2 sm:gap-0',
              children: [
                e.jsx(y, {
                  type: 'button',
                  variant: 'outline',
                  onClick: () => t(!1),
                  className: 'min-h-11',
                  children: i('common:common.cancel'),
                }),
                e.jsx(y, {
                  type: 'submit',
                  variant: 'destructive',
                  onClick: d,
                  disabled: f.isPending,
                  className: 'min-h-11',
                  children: f.isPending
                    ? e.jsxs(e.Fragment, {
                        children: [
                          e.jsx(I, { className: `h-4 w-4 animate-spin ${g ? 'ms-2' : 'me-2'}` }),
                          i('common:common.loading'),
                        ],
                      })
                    : e.jsxs(e.Fragment, {
                        children: [
                          e.jsx(F, { className: `h-4 w-4 ${g ? 'ms-2' : 'me-2'}` }),
                          i('revoke.buttonText'),
                        ],
                      }),
                }),
              ],
            }),
          ],
        }),
      }),
      e.jsx(Je, {
        open: p,
        onOpenChange: c,
        children: e.jsxs(Ye, {
          dir: g ? 'rtl' : 'ltr',
          children: [
            e.jsxs(Ze, {
              children: [
                e.jsxs(We, {
                  className: 'flex items-center gap-2',
                  children: [
                    e.jsx(L, { className: 'h-5 w-5 text-destructive' }),
                    i('revoke.title'),
                  ],
                }),
                e.jsx(es, { children: i('revoke.description') }),
              ],
            }),
            e.jsxs(ss, {
              className: 'gap-2 sm:gap-0',
              children: [
                e.jsx(as, { className: 'min-h-11', children: i('common:common.cancel') }),
                e.jsx(ts, {
                  onClick: l,
                  className:
                    'min-h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90',
                  children: f.isPending
                    ? e.jsxs(e.Fragment, {
                        children: [
                          e.jsx(I, { className: `h-4 w-4 animate-spin ${g ? 'ms-2' : 'me-2'}` }),
                          i('common:common.loading'),
                        ],
                      })
                    : i('revoke.confirm'),
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  })
}
function se({ delegations: s, type: t, isLoading: r = !1, onRefresh: u }) {
  const { t: a, i18n: i } = S('delegation'),
    m = i.language === 'ar',
    [h, g] = v.useState(!1),
    [n, j] = v.useState(null),
    p = (l) => {
      const d = s.find((x) => x.id === l)
      d && (j(d), g(!0))
    },
    c = () => {
      ;(j(null), u?.())
    }
  if (r)
    return e.jsx('div', {
      className: 'space-y-4',
      children: [...Array(3)].map((l, d) =>
        e.jsxs(
          'div',
          {
            className: 'border rounded-lg p-4 space-y-3',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-3',
                children: [
                  e.jsx(N, { className: 'h-10 w-10 rounded-full' }),
                  e.jsxs('div', {
                    className: 'flex-1 space-y-2',
                    children: [
                      e.jsx(N, { className: 'h-4 w-24' }),
                      e.jsx(N, { className: 'h-4 w-40' }),
                    ],
                  }),
                  e.jsx(N, { className: 'h-6 w-16' }),
                ],
              }),
              e.jsxs('div', {
                className: 'grid grid-cols-2 gap-3',
                children: [
                  e.jsx(N, { className: 'h-4 w-32' }),
                  e.jsx(N, { className: 'h-4 w-32' }),
                ],
              }),
              e.jsx(N, { className: 'h-4 w-full' }),
            ],
          },
          d,
        ),
      ),
    })
  if (s.length === 0) {
    const l = t === 'granted' ? V : t === 'received' ? Oe : Ke
    return e.jsxs('div', {
      className: 'flex flex-col items-center justify-center py-12 px-4 text-center',
      dir: m ? 'rtl' : 'ltr',
      children: [
        e.jsx('div', {
          className: 'rounded-full bg-muted p-4 mb-4',
          children: e.jsx(l, { className: 'h-8 w-8 text-muted-foreground' }),
        }),
        e.jsx('h3', { className: 'text-lg font-semibold mb-2', children: a(`list.empty.${t}`) }),
        e.jsx('p', {
          className: 'text-sm text-muted-foreground max-w-md',
          children: a(`list.emptyDescription.${t}`),
        }),
      ],
    })
  }
  const f = (l) => (t === 'all' ? 'granted' : t)
  return e.jsxs(e.Fragment, {
    children: [
      e.jsx('div', {
        className: 'space-y-4',
        children: s.map((l) =>
          e.jsx(
            rs,
            {
              delegation: l,
              type: t === 'all' ? f() : t,
              onRevoke: t === 'granted' || t === 'all' ? p : void 0,
            },
            l.id,
          ),
        ),
      }),
      n &&
        e.jsx(xs, {
          open: h,
          onOpenChange: g,
          delegationId: n.id,
          granteeEmail: n.grantee_email,
          onSuccess: c,
        }),
    ],
  })
}
const us = [
  'dossier',
  'country',
  'organization',
  'mou',
  'forum',
  'brief',
  'intelligence_report',
  'data_library_item',
]
function hs({ open: s, onOpenChange: t, onSuccess: r, users: u = [] }) {
  const { t: a, i18n: i } = S('delegation'),
    { toast: m } = me(),
    h = i.language === 'ar',
    g = h ? he : ge,
    [n, j] = v.useState(''),
    [p] = v.useState(new Date()),
    [c, f] = v.useState(void 0),
    [l, d] = v.useState(''),
    [x, D] = v.useState(''),
    [C, T] = v.useState(''),
    b = os(),
    { data: w, isLoading: ve } = ms(
      { grantee_id: n, resource_type: x || void 0, resource_id: C || void 0 },
      { enabled: !!n },
    )
  v.useEffect(() => {
    s || (j(''), f(void 0), d(''), D(''), T(''))
  }, [s])
  const pe = Le(new Date(), 3),
    Q = async (o) => {
      if ((o.preventDefault(), !n)) {
        m({ title: a('create.validation.selectGrant'), variant: 'destructive' })
        return
      }
      if (!c) {
        m({ title: a('create.validation.selectEndDate'), variant: 'destructive' })
        return
      }
      if (l.length < 10) {
        m({ title: a('create.validation.reasonMinLength'), variant: 'destructive' })
        return
      }
      const U = {
        grantee_id: n,
        valid_from: p.toISOString(),
        valid_until: c.toISOString(),
        reason: l,
        resource_type: x || null,
        resource_id: C || null,
      }
      try {
        ;(await b.mutateAsync(U),
          m({ title: a('create.success'), variant: 'default' }),
          t(!1),
          r?.())
      } catch (G) {
        m({
          title: a('create.error'),
          description: G instanceof Error ? G.message : void 0,
          variant: 'destructive',
        })
      }
    }
  return e.jsx(re, {
    open: s,
    onOpenChange: t,
    children: e.jsxs(ne, {
      className: 'sm:max-w-[500px] max-h-[90vh] overflow-y-auto',
      dir: h ? 'rtl' : 'ltr',
      children: [
        e.jsxs(ie, {
          children: [
            e.jsxs(le, {
              className: 'flex items-center gap-2',
              children: [
                e.jsx(Ve, { className: `h-5 w-5 ${h ? 'ms-0 me-2' : 'me-0 ms-0'}` }),
                a('create.title'),
              ],
            }),
            e.jsx(ce, { children: a('create.description') }),
          ],
        }),
        e.jsxs('form', {
          onSubmit: Q,
          className: 'space-y-4 py-4',
          children: [
            e.jsxs('div', {
              className: 'space-y-2',
              children: [
                e.jsx(k, { htmlFor: 'grantee', children: a('create.form.grantee') }),
                e.jsxs(B, {
                  value: n,
                  onValueChange: j,
                  children: [
                    e.jsx(X, {
                      className: 'min-h-11',
                      children: e.jsx(J, { placeholder: a('create.form.granteePlaceholder') }),
                    }),
                    e.jsx(Y, {
                      children: u.map((o) =>
                        e.jsx(
                          M,
                          {
                            value: o.id,
                            children: e.jsxs('div', {
                              className: 'flex flex-col',
                              children: [
                                e.jsx('span', { children: o.full_name }),
                                e.jsx('span', {
                                  className: 'text-xs text-muted-foreground',
                                  children: o.email,
                                }),
                              ],
                            }),
                          },
                          o.id,
                        ),
                      ),
                    }),
                  ],
                }),
                e.jsx('p', {
                  className: 'text-xs text-muted-foreground',
                  children: a('create.form.granteeDescription'),
                }),
              ],
            }),
            n &&
              e.jsx('div', {
                className: 'py-2',
                children: ve
                  ? e.jsxs('div', {
                      className: 'flex items-center gap-2 text-sm text-muted-foreground',
                      children: [
                        e.jsx(I, { className: 'h-4 w-4 animate-spin' }),
                        a('validation.checking'),
                      ],
                    })
                  : w
                    ? w.valid
                      ? e.jsxs('div', {
                          className: 'flex items-center gap-2 text-sm text-green-600',
                          children: [e.jsx(ze, { className: 'h-4 w-4' }), a('validation.valid')],
                        })
                      : e.jsxs(xe, {
                          variant: 'destructive',
                          className: 'py-2',
                          children: [
                            e.jsx(He, { className: 'h-4 w-4' }),
                            e.jsxs(ue, {
                              children: [
                                a('validation.invalid'),
                                w.issues?.map((o, U) =>
                                  e.jsx(
                                    'div',
                                    {
                                      className: 'mt-1 text-xs',
                                      children: a(`validation.issues.${o.code}`, o.message),
                                    },
                                    U,
                                  ),
                                ),
                              ],
                            }),
                          ],
                        })
                    : null,
              }),
            e.jsxs('div', {
              className: 'space-y-2',
              children: [
                e.jsx(k, { children: a('create.form.validUntil') }),
                e.jsxs(we, {
                  children: [
                    e.jsx(ye, {
                      asChild: !0,
                      children: e.jsxs(y, {
                        variant: 'outline',
                        className: be(
                          'w-full min-h-11 justify-start text-start font-normal',
                          !c && 'text-muted-foreground',
                        ),
                        children: [
                          e.jsx(K, { className: `h-4 w-4 ${h ? 'ms-2' : 'me-2'}` }),
                          c ? E(c, 'PPP', { locale: g }) : a('create.form.validUntilPlaceholder'),
                        ],
                      }),
                    }),
                    e.jsx(De, {
                      className: 'w-auto p-0',
                      align: h ? 'end' : 'start',
                      children: e.jsx(ke, {
                        mode: 'single',
                        selected: c,
                        onSelect: f,
                        disabled: (o) => o < new Date() || o > pe,
                        initialFocus: !0,
                      }),
                    }),
                  ],
                }),
                e.jsx('p', {
                  className: 'text-xs text-muted-foreground',
                  children: a('create.form.validUntilDescription'),
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'space-y-2',
              children: [
                e.jsx(k, { htmlFor: 'reason', children: a('create.form.reason') }),
                e.jsx(oe, {
                  id: 'reason',
                  value: l,
                  onChange: (o) => d(o.target.value),
                  placeholder: a('create.form.reasonPlaceholder'),
                  className: 'min-h-[80px] resize-none',
                }),
                e.jsxs('div', {
                  className: 'flex justify-between items-center',
                  children: [
                    e.jsx('p', {
                      className: 'text-xs text-muted-foreground',
                      children: a('create.form.reasonDescription'),
                    }),
                    e.jsxs(_, {
                      variant: l.length >= 10 ? 'default' : 'outline',
                      className: 'text-xs',
                      children: [l.length, '/10'],
                    }),
                  ],
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'space-y-2',
              children: [
                e.jsx(k, { children: a('create.form.resourceType') }),
                e.jsxs(B, {
                  value: x || '__all__',
                  onValueChange: (o) => D(o === '__all__' ? '' : o),
                  children: [
                    e.jsx(X, {
                      className: 'min-h-11',
                      children: e.jsx(J, { placeholder: a('create.form.resourceTypePlaceholder') }),
                    }),
                    e.jsxs(Y, {
                      children: [
                        e.jsx(M, { value: '__all__', children: a('resourceTypes.all') }),
                        us.map((o) => e.jsx(M, { value: o, children: a(`resourceTypes.${o}`) }, o)),
                      ],
                    }),
                  ],
                }),
                e.jsx('p', {
                  className: 'text-xs text-muted-foreground',
                  children: a('create.form.resourceTypeDescription'),
                }),
              ],
            }),
            x &&
              e.jsxs('div', {
                className: 'space-y-2',
                children: [
                  e.jsx(k, { htmlFor: 'resourceId', children: a('create.form.resourceId') }),
                  e.jsx(_e, {
                    id: 'resourceId',
                    value: C,
                    onChange: (o) => T(o.target.value),
                    placeholder: a('create.form.resourceIdPlaceholder'),
                    className: 'min-h-11',
                  }),
                  e.jsx('p', {
                    className: 'text-xs text-muted-foreground',
                    children: a('create.form.resourceIdDescription'),
                  }),
                ],
              }),
          ],
        }),
        e.jsxs(de, {
          className: 'gap-2 sm:gap-0',
          children: [
            e.jsx(y, {
              type: 'button',
              variant: 'outline',
              onClick: () => t(!1),
              className: 'min-h-11',
              children: a('common:common.cancel'),
            }),
            e.jsx(y, {
              type: 'submit',
              onClick: Q,
              disabled: b.isPending || !n || !c || l.length < 10 || (w && !w.valid),
              className: 'min-h-11',
              children: b.isPending
                ? e.jsxs(e.Fragment, {
                    children: [
                      e.jsx(I, { className: `h-4 w-4 animate-spin ${h ? 'ms-2' : 'me-2'}` }),
                      a('common:common.loading'),
                    ],
                  })
                : a('create.buttonText'),
            }),
          ],
        }),
      ],
    }),
  })
}
function gs({ className: s }) {
  const { t, i18n: r } = S('delegation'),
    u = r.language === 'ar',
    [a, i] = v.useState(!1),
    { data: m, isLoading: h } = je()
  if (h || a || !m || m.total === 0) return null
  const g = m.total
  return e.jsxs(xe, {
    variant: 'default',
    className: `border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20 ${s}`,
    dir: u ? 'rtl' : 'ltr',
    children: [
      e.jsx(L, { className: 'h-4 w-4 text-yellow-600' }),
      e.jsxs(Se, {
        className: 'flex items-center gap-2 text-yellow-800 dark:text-yellow-400',
        children: [
          e.jsx(H, { className: 'h-4 w-4' }),
          t('notification.expiringTitle'),
          e.jsx(_, {
            variant: 'outline',
            className: 'ms-2 text-yellow-700 border-yellow-600',
            children: g,
          }),
        ],
      }),
      e.jsxs(ue, {
        className: 'mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
        children: [
          e.jsx('span', {
            className: 'text-yellow-700 dark:text-yellow-300',
            children:
              g === 1
                ? t('notification.expiringDescriptionSingle')
                : t('notification.expiringDescription', { count: g }),
          }),
          e.jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              e.jsx(y, {
                variant: 'outline',
                size: 'sm',
                asChild: !0,
                className: `min-h-9 border-yellow-600/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 ${u ? 'flex-row-reverse' : ''}`,
                children: e.jsxs(Ne, {
                  to: '/delegations',
                  children: [
                    t('notification.viewAll'),
                    e.jsx(Qe, { className: `h-4 w-4 ${u ? 'me-1 rotate-180' : 'ms-1'}` }),
                  ],
                }),
              }),
              e.jsx(y, {
                variant: 'ghost',
                size: 'icon',
                onClick: () => i(!0),
                className:
                  'h-8 w-8 text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
                'aria-label': t('notification.dismiss'),
                children: e.jsx(Ge, { className: 'h-4 w-4' }),
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
function fs() {
  const { t: s, i18n: t } = S('delegation'),
    r = t.language === 'ar',
    [u, a] = v.useState('granted'),
    [i, m] = v.useState(!0),
    [h, g] = v.useState(!1),
    { data: n, isLoading: j, refetch: p } = fe({ type: 'all', active_only: i }),
    { data: c } = je(),
    { data: f } = z({
      queryKey: ['users-for-delegation'],
      queryFn: async () => {
        const { data: x, error: D } = await R.from('users')
          .select('id, email, full_name')
          .eq('is_active', !0)
          .order('full_name')
          .limit(100)
        if (D) throw D
        return x || []
      },
      staleTime: 6e4,
    }),
    l = v.useMemo(() => (n ? (u === 'granted' ? n.granted || [] : n.received || []) : []), [n, u]),
    d = v.useMemo(
      () =>
        n
          ? {
              granted: n.granted?.length || 0,
              received: n.received?.length || 0,
              expiring: c?.total || 0,
            }
          : { granted: 0, received: 0, expiring: 0 },
      [n, c],
    )
  return e.jsxs('div', {
    className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6',
    dir: r ? 'rtl' : 'ltr',
    children: [
      e.jsx(gs, {}),
      e.jsxs('div', {
        className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
        children: [
          e.jsxs('div', {
            children: [
              e.jsxs('h1', {
                className: 'text-2xl sm:text-3xl font-bold text-start flex items-center gap-3',
                children: [
                  e.jsx(Be, { className: `h-7 w-7 sm:h-8 sm:w-8 ${r ? 'ms-0' : 'me-0'}` }),
                  s('title'),
                ],
              }),
              e.jsx('p', {
                className: 'text-sm sm:text-base text-muted-foreground text-start mt-1',
                children: s('description'),
              }),
            ],
          }),
          e.jsxs(y, {
            onClick: () => g(!0),
            className: `w-full sm:w-auto min-h-11 ${r ? 'flex-row-reverse' : ''}`,
            children: [
              e.jsx(Xe, { className: `h-4 w-4 ${r ? 'ms-2' : 'me-2'}` }),
              s('actions.create'),
            ],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'grid grid-cols-1 sm:grid-cols-3 gap-4',
        children: [
          e.jsxs(A, {
            children: [
              e.jsx(P, {
                className: 'pb-2',
                children: e.jsxs(O, {
                  className: 'flex items-center gap-2',
                  children: [e.jsx(ee, { className: 'h-4 w-4' }), s('list.granted')],
                }),
              }),
              e.jsx($, {
                children: j
                  ? e.jsx(N, { className: 'h-8 w-12' })
                  : e.jsx('p', { className: 'text-2xl font-bold', children: d.granted }),
              }),
            ],
          }),
          e.jsxs(A, {
            children: [
              e.jsx(P, {
                className: 'pb-2',
                children: e.jsxs(O, {
                  className: 'flex items-center gap-2',
                  children: [e.jsx(V, { className: 'h-4 w-4' }), s('list.received')],
                }),
              }),
              e.jsx($, {
                children: j
                  ? e.jsx(N, { className: 'h-8 w-12' })
                  : e.jsx('p', { className: 'text-2xl font-bold', children: d.received }),
              }),
            ],
          }),
          e.jsxs(A, {
            className: d.expiring > 0 ? 'border-yellow-500/50' : '',
            children: [
              e.jsx(P, {
                className: 'pb-2',
                children: e.jsxs(O, {
                  className: 'flex items-center gap-2',
                  children: [
                    d.expiring > 0
                      ? e.jsx(L, { className: 'h-4 w-4 text-yellow-600' })
                      : e.jsx(H, { className: 'h-4 w-4' }),
                    s('list.showExpiring'),
                  ],
                }),
              }),
              e.jsx($, {
                children: j
                  ? e.jsx(N, { className: 'h-8 w-12' })
                  : e.jsx('p', {
                      className: `text-2xl font-bold ${d.expiring > 0 ? 'text-yellow-600' : ''}`,
                      children: d.expiring,
                    }),
              }),
            ],
          }),
        ],
      }),
      e.jsxs(A, {
        children: [
          e.jsx(P, {
            children: e.jsxs('div', {
              className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
              children: [
                e.jsx(Ce, { className: 'text-lg', children: s('list.title') }),
                e.jsxs('div', {
                  className: 'flex items-center gap-2',
                  children: [
                    e.jsx(Te, { id: 'active-only', checked: i, onCheckedChange: m }),
                    e.jsx(k, {
                      htmlFor: 'active-only',
                      className: 'text-sm cursor-pointer',
                      children: s('list.showActiveOnly'),
                    }),
                  ],
                }),
              ],
            }),
          }),
          e.jsx($, {
            children: e.jsxs(Ae, {
              value: u,
              onValueChange: (x) => a(x),
              className: 'w-full',
              children: [
                e.jsxs(Pe, {
                  className: 'grid w-full grid-cols-2 mb-6',
                  children: [
                    e.jsxs(Z, {
                      value: 'granted',
                      className: `flex items-center gap-2 min-h-10 ${r ? 'flex-row-reverse' : ''}`,
                      children: [
                        e.jsx(ee, { className: 'h-4 w-4' }),
                        e.jsx('span', {
                          className: 'hidden sm:inline',
                          children: s('tabs.granted'),
                        }),
                        e.jsx('span', { className: 'sm:hidden', children: s('tabs.granted') }),
                        d.granted > 0 &&
                          e.jsx(_, {
                            variant: 'secondary',
                            className: 'ms-1',
                            children: d.granted,
                          }),
                      ],
                    }),
                    e.jsxs(Z, {
                      value: 'received',
                      className: `flex items-center gap-2 min-h-10 ${r ? 'flex-row-reverse' : ''}`,
                      children: [
                        e.jsx(V, { className: 'h-4 w-4' }),
                        e.jsx('span', {
                          className: 'hidden sm:inline',
                          children: s('tabs.received'),
                        }),
                        e.jsx('span', { className: 'sm:hidden', children: s('tabs.received') }),
                        d.received > 0 &&
                          e.jsx(_, {
                            variant: 'secondary',
                            className: 'ms-1',
                            children: d.received,
                          }),
                      ],
                    }),
                  ],
                }),
                e.jsx(W, {
                  value: 'granted',
                  className: 'mt-0',
                  children: e.jsx(se, {
                    delegations: l,
                    type: 'granted',
                    isLoading: j,
                    onRefresh: p,
                  }),
                }),
                e.jsx(W, {
                  value: 'received',
                  className: 'mt-0',
                  children: e.jsx(se, {
                    delegations: l,
                    type: 'received',
                    isLoading: j,
                    onRefresh: p,
                  }),
                }),
              ],
            }),
          }),
        ],
      }),
      e.jsx(hs, { open: h, onOpenChange: g, onSuccess: p, users: f || [] }),
    ],
  })
}
const Ts = fs
export { Ts as component }
//# sourceMappingURL=delegations-CiYSCmWd.js.map
