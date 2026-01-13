import { u as P, j as e, r as N, o as ks } from './react-vendor-Buoak6m3.js'
import { i as is, a as Ge, L as Ss } from './tanstack-vendor-BZC-rs5U.js'
import {
  am as zs,
  an as ae,
  m as $,
  ao as Fs,
  D as ls,
  x as os,
  B as v,
  y as cs,
  z as G,
  ap as $s,
  aq as Ps,
  ar as Je,
  as as Is,
  af as ds,
  ag as ms,
  ae as Es,
  at as Rs,
  au as xs,
  av as us,
  aw as Ee,
  j as xe,
  k as ue,
  a9 as Ls,
  l as As,
  J as B,
  n as hs,
  A as ge,
  E as je,
  F as fe,
  G as Ne,
  ax as ps,
  ay as Os,
  az as qs,
  aA as Ms,
  aB as q,
  aC as M,
  aD as U,
  aE as V,
  I as Ke,
  aF as Y,
  ah as Re,
  ai as Le,
  c as Ae,
  aj as Oe,
  ak as qe,
  q as Ce,
  r as _e,
  t as De,
  v as Te,
  w as H,
  aG as Qe,
  X as gs,
  S as Ue,
  e as Ve,
  f as re,
  g as ve,
  C as We,
  aH as Us,
  aI as Vs,
  a0 as X,
  aJ as Hs,
  aK as Bs,
  a2 as te,
  V as ke,
  o as Se,
  Z as Xs,
  _ as Ys,
  $ as ze,
  aa as Fe,
  s as de,
  aL as Ze,
} from './index-qYY0KoZ1.js'
import {
  A as Gs,
  a as Js,
  b as Ks,
  c as Qs,
  d as Ws,
  e as Zs,
  f as et,
  g as st,
} from './alert-dialog-DaWYDPc1.js'
import {
  bd as ye,
  aS as W,
  aN as tt,
  aA as Q,
  cL as js,
  bS as Z,
  cq as fs,
  bw as Ns,
  cM as ne,
  dl as at,
  dm as vs,
  aD as L,
  cS as es,
  aH as ie,
  dn as rt,
  bP as ys,
  c0 as ws,
  b6 as nt,
  aR as le,
  aQ as it,
  b8 as ss,
  b9 as $e,
  dp as lt,
  aT as He,
  bV as ot,
  aX as ct,
  aC as dt,
} from './vendor-misc-BiJvMP0A.js'
import { o as mt, b as xt, e as Pe, s as me, d as ut } from './form-vendor-BX1BhTCI.js'
import { H as Me, I as J, J as K } from './date-vendor-s0MkYge4.js'
import { a as bs } from './useDossier-CiPcwRKl.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './visualization-vendor-f5uYUx4I.js'
const Ie = {
  pending: e.jsx(ye, { className: 'size-3.5' }),
  in_progress: e.jsx(fs, { className: 'size-3.5' }),
  completed: e.jsx(Z, { className: 'size-3.5' }),
  cancelled: e.jsx(js, { className: 'size-3.5' }),
  overdue: e.jsx(Q, { className: 'size-3.5' }),
}
function Cs({ commitmentId: s, currentStatus: h, disabled: o = !1, compact: r = !1 }) {
  const { t: m, i18n: a } = P('commitments'),
    c = a.language === 'ar',
    f = zs()
  if (!h || !ae[h])
    return e.jsxs($, {
      variant: 'secondary',
      className: 'bg-gray-100 text-gray-500 border flex items-center gap-1 text-xs',
      children: [
        e.jsx(ye, { className: 'size-3.5' }),
        e.jsx('span', { children: m('status.loading', 'Loading...') }),
      ],
    })
  const i = ae[h],
    d = (Fs[h] || []).filter((t) => t !== 'overdue'),
    u = o || f.isPending || d.length === 0,
    g = (t) => {
      $s(h, t) && f.mutate({ id: s, status: t })
    }
  return d.length === 0
    ? e.jsxs($, {
        variant: 'secondary',
        className: `${i.bg} ${i.text} ${i.border} border flex items-center gap-1 text-xs`,
        children: [Ie[h], e.jsx('span', { children: m(`status.${h}`) })],
      })
    : e.jsxs(ls, {
        children: [
          e.jsx(os, {
            asChild: !0,
            children: e.jsxs(v, {
              variant: 'ghost',
              size: 'sm',
              disabled: u,
              className: `
            ${r ? 'h-8 px-2' : 'min-h-11 px-3'}
            ${i.bg} ${i.text} ${i.border}
            border hover:opacity-90 focus:ring-2 focus:ring-offset-2
            flex items-center gap-1.5
          `,
              onClick: (t) => t.stopPropagation(),
              children: [
                f.isPending ? e.jsx(W, { className: 'size-3.5 animate-spin' }) : Ie[h],
                e.jsx('span', { className: 'text-xs font-medium', children: m(`status.${h}`) }),
                e.jsx(tt, { className: `size-3 opacity-70 ${c ? 'rotate-180' : ''}` }),
              ],
            }),
          }),
          e.jsx(cs, {
            align: c ? 'start' : 'end',
            className: 'w-44',
            onClick: (t) => t.stopPropagation(),
            children: d.map((t) => {
              const y = ae[t]
              return e.jsxs(
                G,
                {
                  onClick: () => g(t),
                  className: `flex items-center gap-2 cursor-pointer min-h-11 ${y.text}`,
                  children: [Ie[t], e.jsx('span', { children: m(`status.${t}`) })],
                },
                t,
              )
            }),
          }),
        ],
      })
}
const ht = {
    'application/pdf': e.jsx(ie, { className: 'size-6 text-red-500' }),
    'image/jpeg': e.jsx(es, { className: 'size-6 text-blue-500' }),
    'image/png': e.jsx(es, { className: 'size-6 text-blue-500' }),
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': e.jsx(vs, {
      className: 'size-6 text-blue-700',
    }),
  },
  pt = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  }
function _s({ commitmentId: s, onSuccess: h, onCancel: o, disabled: r = !1 }) {
  const { t: m, i18n: a } = P('commitments'),
    c = a.language === 'ar',
    f = N.useRef(null),
    i = N.useRef(null),
    [l, d] = N.useState(null),
    [u, g] = N.useState(0),
    [t, y] = N.useState(null),
    [S, n] = N.useState(!1),
    w = Ps(),
    D = N.useCallback(
      (j) => (
        y(null),
        Je.includes(j.type)
          ? j.size > Is
            ? (y(m('evidence.fileTooLarge')), !1)
            : !0
          : (y(m('evidence.invalidType')), !1)
      ),
      [m],
    ),
    x = N.useCallback(
      (j) => {
        D(j) && d(j)
      },
      [D],
    ),
    T = (j) => {
      const F = j.target.files?.[0]
      ;(F && x(F), (j.target.value = ''))
    },
    p = (j) => {
      ;(j.preventDefault(), j.stopPropagation(), n(!0))
    },
    k = (j) => {
      ;(j.preventDefault(), j.stopPropagation(), n(!1))
    },
    z = (j) => {
      ;(j.preventDefault(), j.stopPropagation())
    },
    A = (j) => {
      ;(j.preventDefault(), j.stopPropagation(), n(!1))
      const F = j.dataTransfer.files?.[0]
      F && x(F)
    },
    C = async () => {
      if (l) {
        g(10)
        try {
          const j = setInterval(() => {
            g((F) => Math.min(F + 10, 90))
          }, 200)
          ;(await w.mutateAsync({ commitmentId: s, file: l }),
            clearInterval(j),
            g(100),
            setTimeout(() => {
              h?.()
            }, 500))
        } catch {
          g(0)
        }
      }
    },
    R = () => {
      ;(d(null), g(0), y(null))
    },
    _ = (j) =>
      j < 1024
        ? `${j} B`
        : j < 1024 * 1024
          ? `${(j / 1024).toFixed(1)} KB`
          : `${(j / (1024 * 1024)).toFixed(1)} MB`,
    O = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    oe = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  return e.jsxs('div', {
    className: 'space-y-4',
    dir: c ? 'rtl' : 'ltr',
    children: [
      e.jsx('input', {
        ref: f,
        type: 'file',
        accept: Je.join(','),
        onChange: T,
        className: 'hidden',
        'aria-hidden': 'true',
      }),
      e.jsx('input', {
        ref: i,
        type: 'file',
        accept: 'image/jpeg,image/png',
        capture: 'environment',
        onChange: T,
        className: 'hidden',
        'aria-hidden': 'true',
      }),
      t &&
        e.jsxs(ds, {
          variant: 'destructive',
          children: [e.jsx(Ns, { className: 'size-4' }), e.jsx(ms, { children: t })],
        }),
      !l &&
        e.jsxs(e.Fragment, {
          children: [
            e.jsxs('div', {
              onDragEnter: p,
              onDragLeave: k,
              onDragOver: z,
              onDrop: A,
              onClick: () => f.current?.click(),
              className: `
              border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer
              transition-colors duration-200
              ${S ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
              ${r ? 'opacity-50 cursor-not-allowed' : ''}
            `,
              children: [
                e.jsx(ne, { className: 'size-10 sm:size-12 mx-auto mb-3 text-muted-foreground' }),
                e.jsx('p', {
                  className: 'text-sm sm:text-base font-medium mb-1',
                  children: m('evidence.dropzone'),
                }),
                e.jsx('p', {
                  className: 'text-xs sm:text-sm text-muted-foreground',
                  children: m('evidence.allowedTypes'),
                }),
                e.jsx('p', {
                  className: 'text-xs text-muted-foreground mt-1',
                  children: m('evidence.maxSize'),
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'flex flex-col sm:flex-row gap-2',
              children: [
                e.jsxs(v, {
                  type: 'button',
                  variant: 'outline',
                  onClick: () => f.current?.click(),
                  disabled: r,
                  className: 'min-h-11 flex-1',
                  children: [
                    e.jsx(ne, { className: `size-4 ${c ? 'ms-2' : 'me-2'}` }),
                    m('actions.uploadEvidence'),
                  ],
                }),
                (O || oe) &&
                  e.jsxs(v, {
                    type: 'button',
                    variant: 'outline',
                    onClick: () => i.current?.click(),
                    disabled: r,
                    className: 'min-h-11 flex-1',
                    children: [
                      e.jsx(at, { className: `size-4 ${c ? 'ms-2' : 'me-2'}` }),
                      m('evidence.camera'),
                    ],
                  }),
              ],
            }),
          ],
        }),
      l &&
        e.jsxs('div', {
          className: 'border rounded-lg p-4',
          children: [
            e.jsxs('div', {
              className: 'flex items-start gap-3',
              children: [
                e.jsx('div', {
                  className: 'shrink-0',
                  children: ht[l.type] || e.jsx(vs, { className: 'size-6 text-gray-500' }),
                }),
                e.jsxs('div', {
                  className: 'flex-1 min-w-0',
                  children: [
                    e.jsx('p', {
                      className: 'font-medium text-sm truncate text-start',
                      children: l.name,
                    }),
                    e.jsxs('p', {
                      className: 'text-xs text-muted-foreground text-start',
                      children: [pt[l.type] || l.type, ' •', ' ', _(l.size)],
                    }),
                  ],
                }),
                !w.isPending &&
                  e.jsx(v, {
                    type: 'button',
                    variant: 'ghost',
                    size: 'sm',
                    onClick: R,
                    className: 'min-h-9 min-w-9 p-0',
                    children: e.jsx(L, { className: 'size-4' }),
                  }),
              ],
            }),
            w.isPending &&
              e.jsxs('div', {
                className: 'mt-4 space-y-2',
                children: [
                  e.jsx(Es, { value: u, className: 'h-2' }),
                  e.jsxs('p', {
                    className: 'text-xs text-muted-foreground text-center',
                    children: [m('evidence.uploading'), ' ', u, '%'],
                  }),
                ],
              }),
            u === 100 &&
              !w.isPending &&
              e.jsxs('div', {
                className: 'mt-4 flex items-center justify-center gap-2 text-green-600',
                children: [
                  e.jsx(Z, { className: 'size-5' }),
                  e.jsx('span', {
                    className: 'text-sm font-medium',
                    children: m('evidence.uploadSuccess'),
                  }),
                ],
              }),
            u !== 100 &&
              e.jsxs('div', {
                className: 'mt-4 flex flex-col sm:flex-row gap-2',
                children: [
                  e.jsx(v, {
                    type: 'button',
                    variant: 'outline',
                    onClick: () => {
                      ;(R(), o?.())
                    },
                    disabled: w.isPending,
                    className: 'min-h-11 flex-1',
                    children: m('actions.cancel'),
                  }),
                  e.jsx(v, {
                    type: 'button',
                    onClick: C,
                    disabled: r || w.isPending,
                    className: 'min-h-11 flex-1',
                    children: w.isPending
                      ? e.jsxs(e.Fragment, {
                          children: [
                            e.jsx(W, { className: `size-4 animate-spin ${c ? 'ms-2' : 'me-2'}` }),
                            m('evidence.uploading'),
                          ],
                        })
                      : e.jsxs(e.Fragment, {
                          children: [
                            e.jsx(ne, { className: `size-4 ${c ? 'ms-2' : 'me-2'}` }),
                            m('actions.uploadEvidence'),
                          ],
                        }),
                  }),
                ],
              }),
          ],
        }),
    ],
  })
}
function gt({
  commitment: s,
  onEdit: h,
  onStatusChange: o,
  showDossierContext: r = !1,
  compact: m = !1,
}) {
  const { t: a, i18n: c } = P('commitments'),
    f = is(),
    i = c.language === 'ar',
    [l, d] = N.useState(!1),
    [u, g] = N.useState(''),
    [t, y] = N.useState(!1),
    [S, n] = N.useState(!1),
    w = Rs(),
    D = async (_) => {
      if ((_.stopPropagation(), !!s.proof_url)) {
        n(!0)
        try {
          const { signedUrl: O } = await ps(s.proof_url)
          window.open(O, '_blank')
        } catch (O) {
          console.error('Failed to get evidence URL:', O)
        } finally {
          n(!1)
        }
      }
    },
    x = xs(s.due_date, s.status),
    T = us(s.due_date),
    k = new Date(s.due_date).toLocaleDateString(c.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    z = Ee[s.priority],
    A = () =>
      x
        ? a('card.overdueDays', { days: Math.abs(T) })
        : T === 0
          ? a('card.dueToday')
          : a('card.dueIn', { days: T }),
    C = () => {
      u.trim() &&
        w.mutate(
          { id: s.id, reason: u },
          {
            onSuccess: () => {
              ;(d(!1), g(''))
            },
          },
        )
    },
    R = () => {
      f({ to: '/commitments', search: { id: s.id } })
    }
  return e.jsxs(e.Fragment, {
    children: [
      e.jsxs(xe, {
        className: `
          hover:shadow-md transition-shadow duration-200 cursor-pointer
          ${x ? 'border-red-300 dark:border-red-800' : ''}
          ${s.status === 'completed' ? 'opacity-75' : ''}
        `,
        onClick: R,
        dir: i ? 'rtl' : 'ltr',
        children: [
          e.jsx(ue, {
            className: m ? 'pb-2 pt-3 px-3' : 'pb-3',
            children: e.jsxs('div', {
              className: 'flex items-start justify-between gap-2',
              children: [
                e.jsx('div', {
                  className: 'flex-1 min-w-0',
                  children: e.jsxs('div', {
                    className: 'flex flex-col sm:flex-row sm:items-center gap-2 mb-1',
                    children: [
                      e.jsx('h3', {
                        className: 'text-sm sm:text-base font-medium text-start truncate',
                        children: s.title || a('card.noTitle'),
                      }),
                      e.jsx('div', {
                        onClick: (_) => _.stopPropagation(),
                        children: e.jsx(Cs, {
                          commitmentId: s.id,
                          currentStatus: s.status,
                          compact: m,
                        }),
                      }),
                    ],
                  }),
                }),
                e.jsxs(ls, {
                  children: [
                    e.jsx(os, {
                      asChild: !0,
                      onClick: (_) => _.stopPropagation(),
                      children: e.jsx(v, {
                        variant: 'ghost',
                        size: 'sm',
                        className: 'h-9 w-9 p-0 shrink-0 min-h-11 min-w-11',
                        'aria-label': a('actions.viewDetails'),
                        children: e.jsx(rt, { className: 'size-4' }),
                      }),
                    }),
                    e.jsxs(cs, {
                      align: i ? 'start' : 'end',
                      className: 'w-48',
                      children: [
                        e.jsxs(G, {
                          onClick: (_) => {
                            ;(_.stopPropagation(), R())
                          },
                          children: [
                            e.jsx(ie, { className: `size-4 ${i ? 'ms-2' : 'me-2'}` }),
                            a('actions.viewDetails'),
                          ],
                        }),
                        s.proof_url &&
                          e.jsxs(G, {
                            onClick: D,
                            disabled: S,
                            children: [
                              e.jsx(ys, { className: `size-4 ${i ? 'ms-2' : 'me-2'}` }),
                              a('actions.downloadEvidence'),
                            ],
                          }),
                        s.status !== 'cancelled' &&
                          s.status !== 'completed' &&
                          e.jsxs(e.Fragment, {
                            children: [
                              s.proof_required &&
                                !s.proof_url &&
                                e.jsxs(G, {
                                  onClick: (_) => {
                                    ;(_.stopPropagation(), y(!0))
                                  },
                                  children: [
                                    e.jsx(ne, { className: `size-4 ${i ? 'ms-2' : 'me-2'}` }),
                                    a('actions.uploadEvidence'),
                                  ],
                                }),
                              e.jsxs(G, {
                                onClick: (_) => {
                                  ;(_.stopPropagation(), h?.(s))
                                },
                                children: [
                                  e.jsx(ws, { className: `size-4 ${i ? 'ms-2' : 'me-2'}` }),
                                  a('actions.edit'),
                                ],
                              }),
                              e.jsx(Ls, {}),
                              e.jsxs(G, {
                                className: 'text-red-600 focus:text-red-600',
                                onClick: (_) => {
                                  ;(_.stopPropagation(), d(!0))
                                },
                                children: [
                                  e.jsx(nt, { className: `size-4 ${i ? 'ms-2' : 'me-2'}` }),
                                  a('actions.cancel'),
                                ],
                              }),
                            ],
                          }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),
          e.jsxs(As, {
            className: m ? 'pb-3 px-3' : 'pb-4',
            children: [
              !m &&
                s.description &&
                e.jsx('p', {
                  className: 'text-sm text-muted-foreground text-start line-clamp-2 mb-3',
                  children: s.description,
                }),
              e.jsxs('div', {
                className: 'flex flex-wrap items-center gap-2 sm:gap-4',
                children: [
                  e.jsxs('div', {
                    className: `flex items-center gap-1.5 text-sm ${x ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`,
                    children: [
                      x
                        ? e.jsx(Q, { className: 'size-4 shrink-0' })
                        : e.jsx(le, { className: 'size-4 shrink-0' }),
                      e.jsx('span', { className: 'truncate', children: x ? A() : k }),
                    ],
                  }),
                  e.jsx($, {
                    variant: 'outline',
                    className: `${z.bg} ${z.text} text-xs`,
                    children: a(`priority.${s.priority}`),
                  }),
                  s.proof_required &&
                    !s.proof_url &&
                    e.jsxs($, {
                      variant: 'outline',
                      className: 'text-xs',
                      children: [e.jsx(ie, { className: 'size-3 me-1' }), a('form.proofRequired')],
                    }),
                  s.proof_url &&
                    e.jsxs($, {
                      variant: 'secondary',
                      className:
                        'text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20',
                      children: [e.jsx(Z, { className: 'size-3 me-1' }), a('detail.evidence')],
                    }),
                ],
              }),
              r &&
                s.dossier_id &&
                e.jsx('div', {
                  className: 'mt-3 pt-3 border-t text-xs text-muted-foreground',
                  children: e.jsx('span', { className: 'truncate', children: s.dossier_id }),
                }),
            ],
          }),
        ],
      }),
      e.jsx(Gs, {
        open: l,
        onOpenChange: d,
        children: e.jsxs(Js, {
          dir: i ? 'rtl' : 'ltr',
          children: [
            e.jsxs(Ks, {
              children: [
                e.jsx(Qs, { className: 'text-start', children: a('confirm.cancel') }),
                e.jsx(Ws, { className: 'text-start', children: a('confirm.delete') }),
              ],
            }),
            e.jsxs('div', {
              className: 'py-4',
              children: [
                e.jsx(B, {
                  htmlFor: 'cancel-reason',
                  className: 'text-start block mb-2',
                  children: a('confirm.cancelReason'),
                }),
                e.jsx(hs, {
                  id: 'cancel-reason',
                  value: u,
                  onChange: (_) => g(_.target.value),
                  placeholder: a('confirm.cancelReasonPlaceholder'),
                  className: 'min-h-20',
                }),
              ],
            }),
            e.jsxs(Zs, {
              className: 'flex-col sm:flex-row gap-2',
              children: [
                e.jsx(et, { className: 'min-h-11', children: a('actions.cancel') }),
                e.jsx(st, {
                  onClick: C,
                  disabled: !u.trim() || w.isPending,
                  className: 'min-h-11 bg-red-600 hover:bg-red-700 text-white',
                  children: w.isPending ? a('list.loading') : a('actions.delete'),
                }),
              ],
            }),
          ],
        }),
      }),
      e.jsx(ge, {
        open: t,
        onOpenChange: y,
        children: e.jsxs(je, {
          className: 'max-w-md max-h-[90vh] overflow-y-auto',
          dir: i ? 'rtl' : 'ltr',
          onClick: (_) => _.stopPropagation(),
          children: [
            e.jsx(fe, {
              children: e.jsx(Ne, { className: 'text-start', children: a('evidence.title') }),
            }),
            e.jsx('p', {
              className: 'text-sm text-muted-foreground text-start mb-4',
              children: a('evidence.description'),
            }),
            e.jsx(_s, { commitmentId: s.id, onSuccess: () => y(!1), onCancel: () => y(!1) }),
          ],
        }),
      }),
    ],
  })
}
const jt = mt({
  title: me().min(1, 'validation.titleRequired').max(200, 'validation.titleMaxLength'),
  description: me().min(1, 'validation.descriptionRequired'),
  due_date: ut({ required_error: 'validation.dueDateRequired' }),
  priority: Pe(['low', 'medium', 'high', 'critical']),
  owner_type: Pe(['internal', 'external']),
  owner_user_id: me().optional().nullable(),
  owner_contact_id: me().optional().nullable(),
  tracking_mode: Pe(['manual', 'automatic']),
  proof_required: xt(),
})
function he({ dossierId: s, afterActionId: h, commitment: o, onSuccess: r, onCancel: m }) {
  const { t: a, i18n: c } = P('commitments'),
    f = c.language === 'ar',
    i = !!o,
    l = Os(),
    d = qs(),
    u = l.isPending || d.isPending,
    g = {
      title: o?.title ?? '',
      description: o?.description ?? '',
      due_date: o?.due_date ? new Date(o.due_date) : new Date(),
      priority: o?.priority ?? 'medium',
      owner_type: o?.owner_type ?? 'internal',
      owner_user_id: o?.owner_user_id ?? null,
      owner_contact_id: o?.owner_contact_id ?? null,
      tracking_mode: o?.tracking_mode ?? 'manual',
      proof_required: o?.proof_required ?? !1,
    },
    t = ks({ resolver: it(jt), defaultValues: g }),
    y = t.watch('owner_type'),
    S = (n) => {
      if (i && o) {
        const w = {
          title: n.title,
          description: n.description,
          due_date: n.due_date.toISOString().split('T')[0],
          priority: n.priority,
          owner_type: n.owner_type,
          owner_user_id: n.owner_type === 'internal' ? n.owner_user_id : null,
          owner_contact_id: n.owner_type === 'external' ? n.owner_contact_id : null,
          tracking_mode: n.tracking_mode,
          proof_required: n.proof_required,
        }
        d.mutate(
          { commitmentId: o.id, input: w },
          {
            onSuccess: (D) => {
              r?.(D)
            },
          },
        )
      } else {
        const w = {
          dossier_id: s,
          after_action_id: h ?? null,
          title: n.title,
          description: n.description,
          due_date: n.due_date.toISOString().split('T')[0],
          priority: n.priority,
          owner_type: n.owner_type,
          owner_user_id: n.owner_type === 'internal' ? n.owner_user_id : null,
          owner_contact_id: n.owner_type === 'external' ? n.owner_contact_id : null,
          tracking_mode: n.tracking_mode,
          proof_required: n.proof_required,
        }
        l.mutate(w, {
          onSuccess: (D) => {
            ;(t.reset(), r?.(D))
          },
        })
      }
    }
  return e.jsx(Ms, {
    ...t,
    children: e.jsxs('form', {
      onSubmit: t.handleSubmit(S),
      className: 'space-y-6',
      dir: f ? 'rtl' : 'ltr',
      children: [
        e.jsx(q, {
          control: t.control,
          name: 'title',
          render: ({ field: n }) =>
            e.jsxs(M, {
              children: [
                e.jsxs(U, { className: 'text-start block', children: [a('form.title'), ' *'] }),
                e.jsx(V, {
                  children: e.jsx(Ke, {
                    ...n,
                    placeholder: a('form.titlePlaceholder'),
                    className: 'min-h-11',
                  }),
                }),
                e.jsx(Y, {
                  children:
                    t.formState.errors.title?.message && a(t.formState.errors.title.message),
                }),
              ],
            }),
        }),
        e.jsx(q, {
          control: t.control,
          name: 'description',
          render: ({ field: n }) =>
            e.jsxs(M, {
              children: [
                e.jsxs(U, {
                  className: 'text-start block',
                  children: [a('form.description'), ' *'],
                }),
                e.jsx(V, {
                  children: e.jsx(hs, {
                    ...n,
                    placeholder: a('form.descriptionPlaceholder'),
                    className: 'min-h-24',
                  }),
                }),
                e.jsx(Y, {
                  children:
                    t.formState.errors.description?.message &&
                    a(t.formState.errors.description.message),
                }),
              ],
            }),
        }),
        e.jsx(q, {
          control: t.control,
          name: 'due_date',
          render: ({ field: n }) =>
            e.jsxs(M, {
              className: 'flex flex-col',
              children: [
                e.jsxs(U, { className: 'text-start', children: [a('form.dueDate'), ' *'] }),
                e.jsxs(Re, {
                  children: [
                    e.jsx(Le, {
                      asChild: !0,
                      children: e.jsx(V, {
                        children: e.jsxs(v, {
                          variant: 'outline',
                          className: Ae(
                            'min-h-11 w-full justify-start text-start font-normal',
                            !n.value && 'text-muted-foreground',
                          ),
                          children: [
                            e.jsx(le, { className: `size-4 ${f ? 'ms-2' : 'me-2'}` }),
                            n.value
                              ? Me(n.value, 'PPP', { locale: f ? J : K })
                              : e.jsx('span', { children: a('form.dueDate') }),
                          ],
                        }),
                      }),
                    }),
                    e.jsx(Oe, {
                      className: 'w-auto p-0',
                      align: 'start',
                      children: e.jsx(qe, {
                        mode: 'single',
                        selected: n.value,
                        onSelect: n.onChange,
                        disabled: (w) => w < new Date(new Date().setHours(0, 0, 0, 0)),
                        initialFocus: !0,
                        locale: f ? J : K,
                      }),
                    }),
                  ],
                }),
                e.jsx(Y, {
                  children:
                    t.formState.errors.due_date?.message && a(t.formState.errors.due_date.message),
                }),
              ],
            }),
        }),
        e.jsxs('div', {
          className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
          children: [
            e.jsx(q, {
              control: t.control,
              name: 'priority',
              render: ({ field: n }) =>
                e.jsxs(M, {
                  children: [
                    e.jsx(U, { className: 'text-start block', children: a('form.priority') }),
                    e.jsxs(Ce, {
                      onValueChange: n.onChange,
                      defaultValue: n.value,
                      children: [
                        e.jsx(V, {
                          children: e.jsx(_e, {
                            className: 'min-h-11',
                            children: e.jsx(De, { placeholder: a('priority.label') }),
                          }),
                        }),
                        e.jsxs(Te, {
                          children: [
                            e.jsx(H, { value: 'low', children: a('priority.low') }),
                            e.jsx(H, { value: 'medium', children: a('priority.medium') }),
                            e.jsx(H, { value: 'high', children: a('priority.high') }),
                            e.jsx(H, { value: 'critical', children: a('priority.critical') }),
                          ],
                        }),
                      ],
                    }),
                    e.jsx(Y, {}),
                  ],
                }),
            }),
            e.jsx(q, {
              control: t.control,
              name: 'owner_type',
              render: ({ field: n }) =>
                e.jsxs(M, {
                  children: [
                    e.jsx(U, { className: 'text-start block', children: a('form.ownerType') }),
                    e.jsxs(Ce, {
                      onValueChange: n.onChange,
                      defaultValue: n.value,
                      children: [
                        e.jsx(V, {
                          children: e.jsx(_e, {
                            className: 'min-h-11',
                            children: e.jsx(De, { placeholder: a('ownerType.label') }),
                          }),
                        }),
                        e.jsxs(Te, {
                          children: [
                            e.jsx(H, { value: 'internal', children: a('ownerType.internal') }),
                            e.jsx(H, { value: 'external', children: a('ownerType.external') }),
                          ],
                        }),
                      ],
                    }),
                    e.jsx(Y, {}),
                  ],
                }),
            }),
          ],
        }),
        e.jsx(q, {
          control: t.control,
          name: y === 'internal' ? 'owner_user_id' : 'owner_contact_id',
          render: ({ field: n }) =>
            e.jsxs(M, {
              children: [
                e.jsx(U, { className: 'text-start block', children: a('form.owner') }),
                e.jsx(V, {
                  children: e.jsx(Ke, {
                    ...n,
                    value: n.value ?? '',
                    placeholder: a('form.selectOwner'),
                    className: 'min-h-11',
                  }),
                }),
                e.jsx(Qe, {
                  className: 'text-start',
                  children:
                    y === 'internal' ? 'Enter internal user ID' : 'Enter external contact ID',
                }),
                e.jsx(Y, {}),
              ],
            }),
        }),
        e.jsx(q, {
          control: t.control,
          name: 'tracking_mode',
          render: ({ field: n }) =>
            e.jsxs(M, {
              children: [
                e.jsx(U, { className: 'text-start block', children: a('form.trackingMode') }),
                e.jsxs(Ce, {
                  onValueChange: n.onChange,
                  defaultValue: n.value,
                  children: [
                    e.jsx(V, {
                      children: e.jsx(_e, {
                        className: 'min-h-11',
                        children: e.jsx(De, { placeholder: a('form.trackingMode') }),
                      }),
                    }),
                    e.jsxs(Te, {
                      children: [
                        e.jsx(H, { value: 'manual', children: a('form.manual') }),
                        e.jsx(H, { value: 'automatic', children: a('form.automatic') }),
                      ],
                    }),
                  ],
                }),
                e.jsx(Y, {}),
              ],
            }),
        }),
        e.jsx(q, {
          control: t.control,
          name: 'proof_required',
          render: ({ field: n }) =>
            e.jsxs(M, {
              className: 'flex flex-row items-center justify-between rounded-lg border p-4',
              children: [
                e.jsxs('div', {
                  className: 'space-y-0.5 flex-1',
                  children: [
                    e.jsx(U, {
                      className: 'text-base text-start block',
                      children: a('form.proofRequired'),
                    }),
                    e.jsx(Qe, {
                      className: 'text-start',
                      children: a('form.proofRequiredDescription'),
                    }),
                  ],
                }),
                e.jsx(V, {
                  children: e.jsx(gs, {
                    checked: n.value,
                    onCheckedChange: n.onChange,
                    className: 'ms-4',
                  }),
                }),
              ],
            }),
        }),
        e.jsxs('div', {
          className: 'flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t',
          children: [
            e.jsx(v, {
              type: 'button',
              variant: 'outline',
              onClick: m,
              disabled: u,
              className: 'min-h-11 w-full sm:w-auto',
              children: a('actions.cancel'),
            }),
            e.jsx(v, {
              type: 'submit',
              disabled: u,
              className: 'min-h-11 w-full sm:flex-1',
              children: u
                ? e.jsxs(e.Fragment, {
                    children: [
                      e.jsx(W, { className: `size-4 animate-spin ${f ? 'ms-2' : 'me-2'}` }),
                      a('list.loading'),
                    ],
                  })
                : a(i ? 'actions.save' : 'actions.create'),
            }),
          ],
        }),
      ],
    }),
  })
}
const ft = ['pending', 'in_progress', 'completed', 'cancelled'],
  Nt = ['low', 'medium', 'high', 'critical'],
  vt = ['internal', 'external']
function ts({ open: s, onOpenChange: h, filters: o, onFiltersChange: r, onApply: m, onClear: a }) {
  const { t: c, i18n: f } = P('commitments'),
    i = f.language === 'ar',
    [l, d] = N.useState(o)
  N.useEffect(() => {
    s && d(o)
  }, [s, o])
  const u = (x) => {
      const T = l.status || [],
        p = T.includes(x) ? T.filter((k) => k !== x) : [...T, x]
      d({ ...l, status: p.length > 0 ? p : void 0 })
    },
    g = (x) => {
      const T = l.priority || [],
        p = T.includes(x) ? T.filter((k) => k !== x) : [...T, x]
      d({ ...l, priority: p.length > 0 ? p : void 0 })
    },
    t = (x) => {
      d({ ...l, ownerType: x })
    },
    y = (x) => {
      d({ ...l, overdue: x || void 0 })
    },
    S = (x) => {
      d({ ...l, dueDateFrom: x ? x.toISOString().split('T')[0] : void 0 })
    },
    n = (x) => {
      d({ ...l, dueDateTo: x ? x.toISOString().split('T')[0] : void 0 })
    },
    w = () => {
      ;(r(l), m(), h(!1))
    },
    D = () => {
      ;(d({}), r({}), a())
    }
  return e.jsx(Ue, {
    open: s,
    onOpenChange: h,
    children: e.jsxs(Ve, {
      side: i ? 'left' : 'right',
      className: 'w-full sm:max-w-md overflow-y-auto',
      dir: i ? 'rtl' : 'ltr',
      children: [
        e.jsx(re, {
          children: e.jsx(ve, { className: 'text-start', children: c('filters.title') }),
        }),
        e.jsxs('div', {
          className: 'py-6 space-y-6',
          children: [
            e.jsxs('div', {
              className: 'space-y-3',
              children: [
                e.jsx(B, {
                  className: 'text-sm font-medium text-start block',
                  children: c('filters.status'),
                }),
                e.jsx('div', {
                  className: 'grid grid-cols-2 gap-2',
                  children: ft.map((x) =>
                    e.jsxs(
                      'label',
                      {
                        className:
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent min-h-11',
                        children: [
                          e.jsx(We, {
                            checked: l.status?.includes(x) || !1,
                            onCheckedChange: () => u(x),
                          }),
                          e.jsx('span', { className: 'text-sm', children: c(`status.${x}`) }),
                        ],
                      },
                      x,
                    ),
                  ),
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'space-y-3',
              children: [
                e.jsx(B, {
                  className: 'text-sm font-medium text-start block',
                  children: c('filters.priority'),
                }),
                e.jsx('div', {
                  className: 'grid grid-cols-2 gap-2',
                  children: Nt.map((x) =>
                    e.jsxs(
                      'label',
                      {
                        className:
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent min-h-11',
                        children: [
                          e.jsx(We, {
                            checked: l.priority?.includes(x) || !1,
                            onCheckedChange: () => g(x),
                          }),
                          e.jsx('span', { className: 'text-sm', children: c(`priority.${x}`) }),
                        ],
                      },
                      x,
                    ),
                  ),
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'space-y-3',
              children: [
                e.jsx(B, {
                  className: 'text-sm font-medium text-start block',
                  children: c('filters.ownerType'),
                }),
                e.jsxs('div', {
                  className: 'flex flex-wrap gap-2',
                  children: [
                    e.jsxs(v, {
                      type: 'button',
                      variant: l.ownerType ? 'outline' : 'default',
                      size: 'sm',
                      className: 'min-h-11',
                      onClick: () => t(void 0),
                      children: [c('actions.clearFilters').split(' ')[0], ' '],
                    }),
                    vt.map((x) =>
                      e.jsx(
                        v,
                        {
                          type: 'button',
                          variant: l.ownerType === x ? 'default' : 'outline',
                          size: 'sm',
                          className: 'min-h-11',
                          onClick: () => t(x),
                          children: c(`ownerType.${x}`),
                        },
                        x,
                      ),
                    ),
                  ],
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'flex items-center justify-between p-4 rounded-lg border',
              children: [
                e.jsxs('div', {
                  className: 'space-y-0.5',
                  children: [
                    e.jsx(B, {
                      className: 'text-sm font-medium text-start block',
                      children: c('filters.overdue'),
                    }),
                    e.jsx('p', {
                      className: 'text-xs text-muted-foreground text-start',
                      children: c('filters.overdueDescription'),
                    }),
                  ],
                }),
                e.jsx(gs, { checked: l.overdue || !1, onCheckedChange: y }),
              ],
            }),
            e.jsxs('div', {
              className: 'space-y-3',
              children: [
                e.jsx(B, {
                  className: 'text-sm font-medium text-start block',
                  children: c('filters.dueDate'),
                }),
                e.jsxs('div', {
                  className: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
                  children: [
                    e.jsxs('div', {
                      className: 'space-y-1.5',
                      children: [
                        e.jsx(B, {
                          className: 'text-xs text-muted-foreground',
                          children: c('filters.dueDateFrom'),
                        }),
                        e.jsxs(Re, {
                          children: [
                            e.jsx(Le, {
                              asChild: !0,
                              children: e.jsxs(v, {
                                variant: 'outline',
                                className: Ae(
                                  'w-full min-h-11 justify-start text-start font-normal',
                                  !l.dueDateFrom && 'text-muted-foreground',
                                ),
                                children: [
                                  e.jsx(le, { className: `size-4 ${i ? 'ms-2' : 'me-2'}` }),
                                  l.dueDateFrom
                                    ? Me(new Date(l.dueDateFrom), 'PPP', { locale: i ? J : K })
                                    : e.jsx('span', { children: c('filters.dueDateFrom') }),
                                  l.dueDateFrom &&
                                    e.jsx(L, {
                                      className: `size-4 ${i ? 'me-auto ms-2' : 'ms-auto me-2'} opacity-50 hover:opacity-100`,
                                      onClick: (x) => {
                                        ;(x.stopPropagation(), S(void 0))
                                      },
                                    }),
                                ],
                              }),
                            }),
                            e.jsx(Oe, {
                              className: 'w-auto p-0',
                              align: 'start',
                              children: e.jsx(qe, {
                                mode: 'single',
                                selected: l.dueDateFrom ? new Date(l.dueDateFrom) : void 0,
                                onSelect: S,
                                initialFocus: !0,
                                locale: i ? J : K,
                              }),
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'space-y-1.5',
                      children: [
                        e.jsx(B, {
                          className: 'text-xs text-muted-foreground',
                          children: c('filters.dueDateTo'),
                        }),
                        e.jsxs(Re, {
                          children: [
                            e.jsx(Le, {
                              asChild: !0,
                              children: e.jsxs(v, {
                                variant: 'outline',
                                className: Ae(
                                  'w-full min-h-11 justify-start text-start font-normal',
                                  !l.dueDateTo && 'text-muted-foreground',
                                ),
                                children: [
                                  e.jsx(le, { className: `size-4 ${i ? 'ms-2' : 'me-2'}` }),
                                  l.dueDateTo
                                    ? Me(new Date(l.dueDateTo), 'PPP', { locale: i ? J : K })
                                    : e.jsx('span', { children: c('filters.dueDateTo') }),
                                  l.dueDateTo &&
                                    e.jsx(L, {
                                      className: `size-4 ${i ? 'me-auto ms-2' : 'ms-auto me-2'} opacity-50 hover:opacity-100`,
                                      onClick: (x) => {
                                        ;(x.stopPropagation(), n(void 0))
                                      },
                                    }),
                                ],
                              }),
                            }),
                            e.jsx(Oe, {
                              className: 'w-auto p-0',
                              align: 'start',
                              children: e.jsx(qe, {
                                mode: 'single',
                                selected: l.dueDateTo ? new Date(l.dueDateTo) : void 0,
                                onSelect: n,
                                disabled: (x) => (l.dueDateFrom ? x < new Date(l.dueDateFrom) : !1),
                                initialFocus: !0,
                                locale: i ? J : K,
                              }),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        e.jsxs(Us, {
          className: 'flex-col sm:flex-row gap-3 pt-4 border-t',
          children: [
            e.jsx(v, {
              type: 'button',
              variant: 'outline',
              onClick: D,
              className: 'min-h-11 w-full sm:w-auto',
              children: c('filters.clear'),
            }),
            e.jsx(v, {
              type: 'button',
              onClick: w,
              className: 'min-h-11 w-full sm:flex-1',
              children: c('filters.apply'),
            }),
          ],
        }),
      ],
    }),
  })
}
function as({ filters: s, onRemoveFilter: h, onClearAll: o }) {
  const { t: r, i18n: m } = P('commitments'),
    a = m.language === 'ar',
    c =
      (s.status?.length || 0) +
      (s.priority?.length || 0) +
      (s.ownerType ? 1 : 0) +
      (s.overdue ? 1 : 0) +
      (s.dueDateFrom ? 1 : 0) +
      (s.dueDateTo ? 1 : 0)
  if (c === 0) return null
  const f = (i) =>
    new Date(i).toLocaleDateString(m.language, { month: 'short', day: 'numeric', year: 'numeric' })
  return e.jsxs('div', {
    className: 'flex flex-wrap items-center gap-2 py-2',
    dir: a ? 'rtl' : 'ltr',
    children: [
      s.status?.map((i) =>
        e.jsxs(
          $,
          {
            variant: 'secondary',
            className: 'flex items-center gap-1 pe-1 text-xs',
            children: [
              e.jsx('span', { children: r(`status.${i}`) }),
              e.jsx('button', {
                type: 'button',
                onClick: () => h('status', i),
                className:
                  'ms-1 rounded-full hover:bg-muted p-0.5 min-w-6 min-h-6 flex items-center justify-center',
                'aria-label': `Remove ${r(`status.${i}`)} filter`,
                children: e.jsx(L, { className: 'size-3' }),
              }),
            ],
          },
          `status-${i}`,
        ),
      ),
      s.priority?.map((i) =>
        e.jsxs(
          $,
          {
            variant: 'secondary',
            className: 'flex items-center gap-1 pe-1 text-xs',
            children: [
              e.jsx('span', { children: r(`priority.${i}`) }),
              e.jsx('button', {
                type: 'button',
                onClick: () => h('priority', i),
                className:
                  'ms-1 rounded-full hover:bg-muted p-0.5 min-w-6 min-h-6 flex items-center justify-center',
                'aria-label': `Remove ${r(`priority.${i}`)} filter`,
                children: e.jsx(L, { className: 'size-3' }),
              }),
            ],
          },
          `priority-${i}`,
        ),
      ),
      s.ownerType &&
        e.jsxs($, {
          variant: 'secondary',
          className: 'flex items-center gap-1 pe-1 text-xs',
          children: [
            e.jsx('span', { children: r(`ownerType.${s.ownerType}`) }),
            e.jsx('button', {
              type: 'button',
              onClick: () => h('ownerType'),
              className:
                'ms-1 rounded-full hover:bg-muted p-0.5 min-w-6 min-h-6 flex items-center justify-center',
              'aria-label': `Remove ${r(`ownerType.${s.ownerType}`)} filter`,
              children: e.jsx(L, { className: 'size-3' }),
            }),
          ],
        }),
      s.overdue &&
        e.jsxs($, {
          variant: 'secondary',
          className:
            'flex items-center gap-1 pe-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
          children: [
            e.jsx('span', { children: r('filters.overdue') }),
            e.jsx('button', {
              type: 'button',
              onClick: () => h('overdue'),
              className:
                'ms-1 rounded-full hover:bg-red-200 dark:hover:bg-red-800 p-0.5 min-w-6 min-h-6 flex items-center justify-center',
              'aria-label': `Remove ${r('filters.overdue')} filter`,
              children: e.jsx(L, { className: 'size-3' }),
            }),
          ],
        }),
      s.dueDateFrom &&
        e.jsxs($, {
          variant: 'secondary',
          className: 'flex items-center gap-1 pe-1 text-xs',
          children: [
            e.jsxs('span', { children: [r('filters.dueDateFrom'), ': ', f(s.dueDateFrom)] }),
            e.jsx('button', {
              type: 'button',
              onClick: () => h('dueDateFrom'),
              className:
                'ms-1 rounded-full hover:bg-muted p-0.5 min-w-6 min-h-6 flex items-center justify-center',
              'aria-label': 'Remove from date filter',
              children: e.jsx(L, { className: 'size-3' }),
            }),
          ],
        }),
      s.dueDateTo &&
        e.jsxs($, {
          variant: 'secondary',
          className: 'flex items-center gap-1 pe-1 text-xs',
          children: [
            e.jsxs('span', { children: [r('filters.dueDateTo'), ': ', f(s.dueDateTo)] }),
            e.jsx('button', {
              type: 'button',
              onClick: () => h('dueDateTo'),
              className:
                'ms-1 rounded-full hover:bg-muted p-0.5 min-w-6 min-h-6 flex items-center justify-center',
              'aria-label': 'Remove to date filter',
              children: e.jsx(L, { className: 'size-3' }),
            }),
          ],
        }),
      c > 1 &&
        e.jsx(v, {
          type: 'button',
          variant: 'ghost',
          size: 'sm',
          onClick: o,
          className: 'min-h-8 text-xs text-muted-foreground hover:text-foreground',
          children: r('filters.clear'),
        }),
    ],
  })
}
function pe({
  dossierId: s,
  status: h,
  priority: o,
  ownerId: r,
  overdue: m,
  dueDateFrom: a,
  dueDateTo: c,
  showFilters: f = !1,
  showCreateButton: i = !0,
  onFiltersChange: l,
}) {
  const { t: d, i18n: u } = P('commitments'),
    g = u.language === 'ar',
    [t, y] = N.useState(!1),
    [S, n] = N.useState(null),
    [w, D] = N.useState(!1),
    [x, T] = N.useState(null),
    p = {
      dossierId: s,
      status: h,
      priority: o,
      ownerId: r,
      overdue: m,
      dueDateFrom: a,
      dueDateTo: c,
    },
    [k, z] = N.useState(p),
    A = N.useRef(null),
    {
      data: C,
      isLoading: R,
      isError: _,
      error: O,
      fetchNextPage: oe,
      hasNextPage: j,
      isFetchingNextPage: F,
    } = Vs({
      dossierId: s,
      status: h,
      priority: o,
      ownerId: r,
      overdue: m,
      dueDateFrom: a,
      dueDateTo: c,
    })
  N.useEffect(() => {
    const b = new IntersectionObserver(
        (E) => {
          const [se] = E
          se.isIntersecting && j && !F && oe()
        },
        { threshold: 0.1, rootMargin: '100px' },
      ),
      I = A.current
    return (
      I && b.observe(I),
      () => {
        I && b.unobserve(I)
      }
    )
  }, [oe, j, F])
  const we = C?.pages.flatMap((b) => b.commitments) ?? [],
    Ds = C?.pages[0]?.totalCount ?? 0,
    Ts = (b) => {
      n(b)
    },
    be = () => {
      ;(y(!1), n(null))
    },
    Be = N.useCallback((b) => {
      z(b)
    }, []),
    Xe = N.useCallback(() => {
      l?.(k)
    }, [k, l]),
    ee = N.useCallback(() => {
      const b = { dossierId: s }
      ;(z(b), l?.(b))
    }, [s, l]),
    Ye = N.useCallback(
      (b, I) => {
        const E = { ...p }
        ;(b === 'status' && I
          ? ((E.status = p.status?.filter((se) => se !== I)),
            E.status?.length === 0 && (E.status = void 0))
          : b === 'priority' && I
            ? ((E.priority = p.priority?.filter((se) => se !== I)),
              E.priority?.length === 0 && (E.priority = void 0))
            : (E[b] = void 0),
          z(E),
          l?.(E))
      },
      [p, l],
    ),
    ce =
      (p.status?.length || 0) > 0 ||
      (p.priority?.length || 0) > 0 ||
      !!p.ownerId ||
      !!p.ownerType ||
      !!p.overdue ||
      !!p.dueDateFrom ||
      !!p.dueDateTo
  if (R)
    return e.jsx('div', {
      className: 'space-y-4',
      dir: g ? 'rtl' : 'ltr',
      children: [...Array(3)].map((b, I) => e.jsx(X, { className: 'h-32 w-full rounded-lg' }, I)),
    })
  if (_)
    return e.jsx('div', {
      dir: g ? 'rtl' : 'ltr',
      children: e.jsxs(ds, {
        variant: 'destructive',
        children: [
          e.jsx(Ns, { className: 'size-4' }),
          e.jsxs(ms, { children: [d('errors.loadFailed'), O?.message && `: ${O.message}`] }),
        ],
      }),
    })
  if (!C || we.length === 0) {
    const b = ce
    return e.jsxs('div', {
      dir: g ? 'rtl' : 'ltr',
      children: [
        f &&
          e.jsxs('div', {
            className:
              'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 mb-4',
            children: [
              e.jsx('h2', {
                className: 'text-xl sm:text-2xl font-bold text-foreground text-start',
                children: d('title'),
              }),
              e.jsxs('div', {
                className: 'flex items-center gap-2',
                children: [
                  e.jsxs(v, {
                    variant: 'outline',
                    size: 'sm',
                    className: 'min-h-11',
                    onClick: () => D(!0),
                    children: [
                      e.jsx(ss, { className: `size-4 ${g ? 'ms-2' : 'me-2'}` }),
                      d('filters.title'),
                      ce &&
                        e.jsx('span', {
                          className:
                            'ms-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs',
                          children:
                            (p.status?.length || 0) +
                            (p.priority?.length || 0) +
                            (p.ownerId ? 1 : 0) +
                            (p.ownerType ? 1 : 0) +
                            (p.overdue ? 1 : 0) +
                            (p.dueDateFrom ? 1 : 0) +
                            (p.dueDateTo ? 1 : 0),
                        }),
                    ],
                  }),
                  i &&
                    s &&
                    e.jsxs(v, {
                      onClick: () => y(!0),
                      size: 'sm',
                      className: 'min-h-11',
                      children: [
                        e.jsx($e, { className: `size-4 ${g ? 'ms-2' : 'me-2'}` }),
                        d('actions.create'),
                      ],
                    }),
                ],
              }),
            ],
          }),
        b && e.jsx(as, { filters: p, onRemoveFilter: Ye, onClearAll: ee }),
        e.jsx('div', {
          className: 'flex flex-col items-center justify-center py-12 px-4 text-center',
          children: b
            ? e.jsxs(e.Fragment, {
                children: [
                  e.jsx(lt, { className: 'size-12 text-muted-foreground mb-4' }),
                  e.jsx('h3', {
                    className: 'text-lg font-medium text-foreground mb-2',
                    children: d('list.emptyFiltered'),
                  }),
                  e.jsx('p', {
                    className: 'text-sm text-muted-foreground max-w-md mb-6',
                    children: d('list.emptyFiltered'),
                  }),
                  e.jsx(v, {
                    variant: 'outline',
                    onClick: ee,
                    className: 'min-h-11',
                    children: d('filters.clear'),
                  }),
                ],
              })
            : e.jsxs(e.Fragment, {
                children: [
                  e.jsx(Z, { className: 'size-12 text-muted-foreground mb-4' }),
                  e.jsx('h3', {
                    className: 'text-lg font-medium text-foreground mb-2',
                    children: d('list.empty'),
                  }),
                  e.jsx('p', {
                    className: 'text-sm text-muted-foreground max-w-md mb-6',
                    children: d('list.empty'),
                  }),
                  i &&
                    s &&
                    e.jsxs(v, {
                      onClick: () => y(!0),
                      className: 'min-h-11',
                      children: [
                        e.jsx($e, { className: `size-4 ${g ? 'ms-2' : 'me-2'}` }),
                        d('actions.create'),
                      ],
                    }),
                ],
              }),
        }),
        e.jsx(ts, {
          open: w,
          onOpenChange: D,
          filters: k,
          onFiltersChange: Be,
          onApply: Xe,
          onClear: ee,
        }),
        s &&
          e.jsx(ge, {
            open: t,
            onOpenChange: y,
            children: e.jsxs(je, {
              className: 'max-w-lg max-h-[90vh] overflow-y-auto',
              dir: g ? 'rtl' : 'ltr',
              children: [
                e.jsx(fe, {
                  children: e.jsx(Ne, { className: 'text-start', children: d('actions.create') }),
                }),
                e.jsx(he, { dossierId: s, onSuccess: be, onCancel: () => y(!1) }),
              ],
            }),
          }),
      ],
    })
  }
  return e.jsxs('div', {
    className: 'space-y-4',
    dir: g ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1',
        children: [
          e.jsxs('h2', {
            className: 'text-xl sm:text-2xl font-bold text-foreground text-start',
            children: [
              d('title'),
              e.jsxs('span', {
                className: 'ms-2 text-sm font-normal text-muted-foreground',
                children: ['(', Ds, ')'],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              f &&
                e.jsxs(v, {
                  variant: 'outline',
                  size: 'sm',
                  className: 'min-h-11',
                  onClick: () => D(!0),
                  children: [
                    e.jsx(ss, { className: `size-4 ${g ? 'ms-2' : 'me-2'}` }),
                    d('filters.title'),
                    ce &&
                      e.jsx('span', {
                        className:
                          'ms-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs',
                        children:
                          (p.status?.length || 0) +
                          (p.priority?.length || 0) +
                          (p.ownerType ? 1 : 0) +
                          (p.overdue ? 1 : 0) +
                          (p.dueDateFrom ? 1 : 0) +
                          (p.dueDateTo ? 1 : 0),
                      }),
                  ],
                }),
              i &&
                s &&
                e.jsxs(v, {
                  onClick: () => y(!0),
                  size: 'sm',
                  className: 'min-h-11',
                  children: [
                    e.jsx($e, { className: `size-4 ${g ? 'ms-2' : 'me-2'}` }),
                    d('actions.create'),
                  ],
                }),
            ],
          }),
        ],
      }),
      ce && e.jsx(as, { filters: p, onRemoveFilter: Ye, onClearAll: ee }),
      e.jsx('div', {
        className: 'grid grid-cols-1 gap-4',
        children: we.map((b) => e.jsx(gt, { commitment: b, onEdit: Ts }, b.id)),
      }),
      e.jsxs('div', {
        ref: A,
        className: 'py-4',
        children: [
          F &&
            e.jsxs('div', {
              className: 'flex items-center justify-center gap-2 text-muted-foreground',
              children: [
                e.jsx(W, { className: 'size-5 animate-spin' }),
                e.jsx('span', { className: 'text-sm', children: d('list.loading') }),
              ],
            }),
          j &&
            !F &&
            e.jsx('p', {
              className: 'text-sm text-muted-foreground text-center',
              children: d('list.loadMore'),
            }),
        ],
      }),
      !j &&
        we.length > 0 &&
        e.jsx('p', {
          className: 'text-sm text-muted-foreground text-center py-2',
          children: d('list.endOfList'),
        }),
      e.jsx(ts, {
        open: w,
        onOpenChange: D,
        filters: k,
        onFiltersChange: Be,
        onApply: Xe,
        onClear: ee,
      }),
      s &&
        e.jsx(ge, {
          open: t,
          onOpenChange: y,
          children: e.jsxs(je, {
            className: 'max-w-lg max-h-[90vh] overflow-y-auto',
            dir: g ? 'rtl' : 'ltr',
            children: [
              e.jsx(fe, {
                children: e.jsx(Ne, { className: 'text-start', children: d('actions.create') }),
              }),
              e.jsx(he, { dossierId: s, onSuccess: be, onCancel: () => y(!1) }),
            ],
          }),
        }),
      e.jsx(Ue, {
        open: !!S,
        onOpenChange: (b) => !b && n(null),
        children: e.jsxs(Ve, {
          side: g ? 'left' : 'right',
          className: 'w-full sm:max-w-lg overflow-y-auto',
          dir: g ? 'rtl' : 'ltr',
          children: [
            e.jsx(re, {
              children: e.jsx(ve, { className: 'text-start', children: d('actions.edit') }),
            }),
            S &&
              s &&
              e.jsx('div', {
                className: 'mt-6',
                children: e.jsx(he, {
                  dossierId: s,
                  commitment: S,
                  onSuccess: be,
                  onCancel: () => n(null),
                }),
              }),
          ],
        }),
      }),
    ],
  })
}
const rs = {
  pending: e.jsx(ye, { className: 'size-4' }),
  in_progress: e.jsx(fs, { className: 'size-4' }),
  completed: e.jsx(Z, { className: 'size-4' }),
  cancelled: e.jsx(js, { className: 'size-4' }),
  overdue: e.jsx(Q, { className: 'size-4' }),
}
function yt({ commitmentId: s, createdAt: h, createdBy: o }) {
  const { t: r, i18n: m } = P('commitments'),
    a = m.language === 'ar',
    { data: c, isLoading: f, isError: i } = Hs(s),
    l = (d) =>
      new Date(d).toLocaleString(m.language, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
  return f
    ? e.jsx('div', {
        className: 'space-y-4',
        children: [...Array(3)].map((d, u) =>
          e.jsxs(
            'div',
            {
              className: 'flex gap-3',
              children: [
                e.jsx(X, { className: 'size-8 rounded-full shrink-0' }),
                e.jsxs('div', {
                  className: 'flex-1 space-y-2',
                  children: [
                    e.jsx(X, { className: 'h-4 w-3/4' }),
                    e.jsx(X, { className: 'h-3 w-1/2' }),
                  ],
                }),
              ],
            },
            u,
          ),
        ),
      })
    : i
      ? e.jsx('p', {
          className: 'text-sm text-muted-foreground text-center py-4',
          children: r('detail.noHistory'),
        })
      : !c?.length && !h
        ? e.jsx('p', {
            className: 'text-sm text-muted-foreground text-center py-4',
            children: r('detail.noHistory'),
          })
        : e.jsxs('div', {
            className: 'space-y-0',
            dir: a ? 'rtl' : 'ltr',
            children: [
              c?.map((d, u) =>
                e.jsx(
                  wt,
                  {
                    entry: d,
                    isFirst: u === 0,
                    isLast: u === c.length - 1 && !h,
                    formatDateTime: l,
                  },
                  d.id,
                ),
              ),
              h &&
                e.jsxs('div', {
                  className: 'flex gap-3',
                  children: [
                    e.jsx('div', {
                      className: 'flex flex-col items-center',
                      children: e.jsx('div', {
                        className:
                          'size-8 rounded-full bg-muted flex items-center justify-center shrink-0',
                        children: e.jsx(ie, { className: 'size-4 text-muted-foreground' }),
                      }),
                    }),
                    e.jsxs('div', {
                      className: 'flex-1 pb-4',
                      children: [
                        e.jsx('p', {
                          className: 'text-sm font-medium text-start',
                          children: r('timeline.created'),
                        }),
                        e.jsx('p', {
                          className: 'text-xs text-muted-foreground text-start mt-0.5',
                          children: l(h),
                        }),
                        o &&
                          e.jsxs('p', {
                            className:
                              'text-xs text-muted-foreground text-start mt-0.5 flex items-center gap-1',
                            children: [
                              e.jsx(He, { className: 'size-3' }),
                              r('timeline.by', { user: o }),
                            ],
                          }),
                      ],
                    }),
                  ],
                }),
            ],
          })
}
function wt({ entry: s, isFirst: h, isLast: o, formatDateTime: r }) {
  const { t: m, i18n: a } = P('commitments')
  a.language
  const c =
    s.new_status && ae[s.new_status]
      ? ae[s.new_status]
      : { bg: 'bg-gray-100', text: 'text-gray-500' }
  return e.jsxs('div', {
    className: 'flex gap-3',
    children: [
      e.jsxs('div', {
        className: 'flex flex-col items-center',
        children: [
          e.jsx('div', {
            className: `size-8 rounded-full flex items-center justify-center shrink-0 ${c.bg} ${c.text}`,
            children:
              s.new_status && rs[s.new_status]
                ? rs[s.new_status]
                : e.jsx(ye, { className: 'size-4' }),
          }),
          !o && e.jsx('div', { className: 'w-0.5 flex-1 bg-muted min-h-4' }),
        ],
      }),
      e.jsxs('div', {
        className: `flex-1 ${o ? '' : 'pb-4'}`,
        children: [
          e.jsx('p', {
            className: 'text-sm font-medium text-start',
            children: s.old_status
              ? m('timeline.statusChanged', {
                  from: m(`status.${s.old_status}`),
                  to: m(`status.${s.new_status}`),
                })
              : m(`status.${s.new_status}`),
          }),
          e.jsx('p', {
            className: 'text-xs text-muted-foreground text-start mt-0.5',
            children: r(s.changed_at),
          }),
          s.changed_by_name &&
            e.jsxs('p', {
              className: 'text-xs text-muted-foreground text-start mt-0.5 flex items-center gap-1',
              children: [
                e.jsx(He, { className: 'size-3' }),
                m('timeline.by', { user: s.changed_by_name }),
              ],
            }),
          s.notes &&
            e.jsx('p', {
              className:
                'text-xs text-muted-foreground text-start mt-2 italic border-s-2 border-muted ps-2',
              children: s.notes,
            }),
        ],
      }),
    ],
  })
}
function ns({ commitmentId: s, open: h, onOpenChange: o }) {
  const { t: r, i18n: m } = P('commitments'),
    a = is(),
    c = m.language === 'ar',
    [f, i] = N.useState(!1),
    [l, d] = N.useState(!1),
    [u, g] = N.useState(!1),
    { data: t, isLoading: y, isError: S } = Bs(s ?? '', { enabled: !!s && h }),
    { data: n } = bs(t?.dossier_id ?? '', void 0, { enabled: !!t?.dossier_id }),
    w = n ? (c && n.name_ar) || n.name_en : t?.dossier_id,
    D = (C) => {
      ;(C || i(!1), o(C))
    },
    x = () => {
      if (t?.dossier_id && n?.type) {
        o(!1)
        const R =
          {
            country: 'countries',
            organization: 'organizations',
            person: 'persons',
            engagement: 'engagements',
            forum: 'forums',
            working_group: 'working_groups',
          }[n.type] || 'countries'
        a({ to: `/dossiers/${R}/$id`, params: { id: t.dossier_id } })
      }
    },
    T = async () => {
      if (t?.proof_url) {
        g(!0)
        try {
          const { signedUrl: C } = await ps(t.proof_url)
          window.open(C, '_blank')
        } catch (C) {
          console.error('Failed to get evidence URL:', C)
        } finally {
          g(!1)
        }
      }
    },
    p = (C) =>
      C
        ? new Date(C).toLocaleDateString(m.language, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : '-',
    k = (C) =>
      C
        ? new Date(C).toLocaleString(m.language, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '-',
    z = t ? xs(t.due_date, t.status) : !1,
    A = t ? us(t.due_date) : 0
  return e.jsxs(e.Fragment, {
    children: [
      e.jsx(Ue, {
        open: h,
        onOpenChange: D,
        children: e.jsxs(Ve, {
          side: c ? 'left' : 'right',
          className: 'w-full sm:max-w-lg overflow-y-auto',
          dir: c ? 'rtl' : 'ltr',
          accessibleTitle: r('detail.title', 'Commitment Details'),
          children: [
            y &&
              e.jsxs('div', {
                className: 'space-y-6',
                children: [
                  e.jsx(re, { children: e.jsx(X, { className: 'h-8 w-3/4' }) }),
                  e.jsxs('div', {
                    className: 'space-y-4',
                    children: [
                      e.jsx(X, { className: 'h-20 w-full' }),
                      e.jsx(X, { className: 'h-20 w-full' }),
                      e.jsx(X, { className: 'h-40 w-full' }),
                    ],
                  }),
                ],
              }),
            S &&
              e.jsxs('div', {
                className: 'flex flex-col items-center justify-center py-12',
                children: [
                  e.jsx(Q, { className: 'size-12 text-muted-foreground mb-4' }),
                  e.jsx('p', {
                    className: 'text-muted-foreground',
                    children: r('errors.loadFailed'),
                  }),
                ],
              }),
            t &&
              !y &&
              e.jsx(e.Fragment, {
                children: f
                  ? e.jsxs(e.Fragment, {
                      children: [
                        e.jsx(re, {
                          children: e.jsx(ve, {
                            className: 'text-start',
                            children: r('actions.edit'),
                          }),
                        }),
                        e.jsx('div', {
                          className: 'mt-6',
                          children: e.jsx(he, {
                            dossierId: t.dossier_id,
                            commitment: t,
                            onSuccess: () => i(!1),
                            onCancel: () => i(!1),
                          }),
                        }),
                      ],
                    })
                  : e.jsxs(e.Fragment, {
                      children: [
                        e.jsxs(re, {
                          className: 'space-y-4',
                          children: [
                            e.jsxs('div', {
                              className: 'flex items-start justify-between gap-2',
                              children: [
                                e.jsx(ve, {
                                  className: 'text-start text-lg flex-1',
                                  children: t.title || r('card.noTitle'),
                                }),
                                t.status !== 'cancelled' &&
                                  t.status !== 'completed' &&
                                  e.jsxs(v, {
                                    variant: 'outline',
                                    size: 'sm',
                                    onClick: () => i(!0),
                                    className: 'min-h-11 shrink-0',
                                    children: [
                                      e.jsx(ws, { className: `size-4 ${c ? 'ms-2' : 'me-2'}` }),
                                      r('actions.edit'),
                                    ],
                                  }),
                              ],
                            }),
                            e.jsx('div', {
                              className: 'flex items-center gap-2',
                              children: e.jsx(Cs, { commitmentId: t.id, currentStatus: t.status }),
                            }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'mt-6 space-y-6',
                          children: [
                            t.description &&
                              e.jsx('div', {
                                children: e.jsx('p', {
                                  className: 'text-sm text-muted-foreground text-start',
                                  children: t.description,
                                }),
                              }),
                            e.jsx(te, {}),
                            e.jsxs('div', {
                              className: 'grid grid-cols-2 gap-4',
                              children: [
                                e.jsxs('div', {
                                  className: 'space-y-1',
                                  children: [
                                    e.jsx('p', {
                                      className: 'text-xs text-muted-foreground text-start',
                                      children: r('form.dueDate'),
                                    }),
                                    e.jsxs('div', {
                                      className: `flex items-center gap-1.5 text-sm ${z ? 'text-red-600 dark:text-red-400 font-medium' : ''}`,
                                      children: [
                                        z
                                          ? e.jsx(Q, { className: 'size-4' })
                                          : e.jsx(le, { className: 'size-4' }),
                                        e.jsxs('span', {
                                          children: [
                                            p(t.due_date),
                                            z &&
                                              ` (${Math.abs(A)} ${r('card.overdueDays', { days: '' }).trim()})`,
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                e.jsxs('div', {
                                  className: 'space-y-1',
                                  children: [
                                    e.jsx('p', {
                                      className: 'text-xs text-muted-foreground text-start',
                                      children: r('form.priority'),
                                    }),
                                    e.jsx($, {
                                      variant: 'outline',
                                      className: `${Ee[t.priority].bg} ${Ee[t.priority].text}`,
                                      children: r(`priority.${t.priority}`),
                                    }),
                                  ],
                                }),
                                e.jsxs('div', {
                                  className: 'space-y-1',
                                  children: [
                                    e.jsx('p', {
                                      className: 'text-xs text-muted-foreground text-start',
                                      children: r('form.ownerType'),
                                    }),
                                    e.jsxs('div', {
                                      className: 'flex items-center gap-1.5 text-sm',
                                      children: [
                                        e.jsx(He, { className: 'size-4' }),
                                        e.jsx('span', { children: r(`ownerType.${t.owner_type}`) }),
                                      ],
                                    }),
                                  ],
                                }),
                                e.jsxs('div', {
                                  className: 'space-y-1',
                                  children: [
                                    e.jsx('p', {
                                      className: 'text-xs text-muted-foreground text-start',
                                      children: r('form.trackingMode'),
                                    }),
                                    e.jsx('span', {
                                      className: 'text-sm',
                                      children: r(`form.${t.tracking_mode}`),
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            e.jsx(te, {}),
                            t.dossier_id &&
                              e.jsxs(e.Fragment, {
                                children: [
                                  e.jsxs('div', {
                                    className: 'space-y-2',
                                    children: [
                                      e.jsx('p', {
                                        className: 'text-xs text-muted-foreground text-start',
                                        children: r('detail.dossier'),
                                      }),
                                      e.jsxs(v, {
                                        variant: 'outline',
                                        onClick: x,
                                        className: 'min-h-11 w-full justify-start',
                                        children: [
                                          e.jsx(ie, { className: `size-4 ${c ? 'ms-2' : 'me-2'}` }),
                                          e.jsx('span', {
                                            className: 'truncate flex-1 text-start',
                                            children: w,
                                          }),
                                          e.jsx(ot, { className: 'size-4 shrink-0' }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  e.jsx(te, {}),
                                ],
                              }),
                            e.jsxs('div', {
                              className: 'space-y-3',
                              children: [
                                e.jsx('p', {
                                  className: 'text-xs text-muted-foreground text-start font-medium',
                                  children: r('detail.evidence'),
                                }),
                                t.proof_url
                                  ? e.jsxs('div', {
                                      className: 'flex flex-col gap-2',
                                      children: [
                                        e.jsxs('div', {
                                          className:
                                            'flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg',
                                          children: [
                                            e.jsx(Z, {
                                              className:
                                                'size-5 text-green-600 dark:text-green-400',
                                            }),
                                            e.jsxs('div', {
                                              className: 'flex-1',
                                              children: [
                                                e.jsx('p', {
                                                  className: 'text-sm font-medium text-start',
                                                  children: r('evidence.uploadSuccess'),
                                                }),
                                                t.evidence_submitted_at &&
                                                  e.jsxs('p', {
                                                    className:
                                                      'text-xs text-muted-foreground text-start',
                                                    children: [
                                                      r('detail.evidenceSubmittedAt'),
                                                      ':',
                                                      ' ',
                                                      k(t.evidence_submitted_at),
                                                    ],
                                                  }),
                                              ],
                                            }),
                                          ],
                                        }),
                                        e.jsxs(v, {
                                          variant: 'outline',
                                          onClick: T,
                                          disabled: u,
                                          className: 'min-h-11',
                                          children: [
                                            u
                                              ? e.jsx(W, {
                                                  className: `size-4 animate-spin ${c ? 'ms-2' : 'me-2'}`,
                                                })
                                              : e.jsx(ys, {
                                                  className: `size-4 ${c ? 'ms-2' : 'me-2'}`,
                                                }),
                                            r('actions.downloadEvidence'),
                                          ],
                                        }),
                                      ],
                                    })
                                  : t.proof_required
                                    ? e.jsxs('div', {
                                        className: 'flex flex-col gap-2',
                                        children: [
                                          e.jsxs('div', {
                                            className:
                                              'flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg',
                                            children: [
                                              e.jsx(Q, {
                                                className:
                                                  'size-5 text-yellow-600 dark:text-yellow-400',
                                              }),
                                              e.jsx('p', {
                                                className: 'text-sm text-start',
                                                children: r('form.proofRequiredDescription'),
                                              }),
                                            ],
                                          }),
                                          t.status !== 'cancelled' &&
                                            t.status !== 'completed' &&
                                            e.jsxs(v, {
                                              variant: 'outline',
                                              onClick: () => d(!0),
                                              className: 'min-h-11',
                                              children: [
                                                e.jsx(ne, {
                                                  className: `size-4 ${c ? 'ms-2' : 'me-2'}`,
                                                }),
                                                r('actions.uploadEvidence'),
                                              ],
                                            }),
                                        ],
                                      })
                                    : e.jsx('p', {
                                        className: 'text-sm text-muted-foreground text-start',
                                        children: r('detail.noEvidence'),
                                      }),
                              ],
                            }),
                            e.jsx(te, {}),
                            e.jsxs('div', {
                              className: 'space-y-3',
                              children: [
                                e.jsx('p', {
                                  className: 'text-xs text-muted-foreground text-start font-medium',
                                  children: r('detail.statusHistory'),
                                }),
                                e.jsx(yt, {
                                  commitmentId: t.id,
                                  createdAt: t.created_at,
                                  createdBy: t.created_by,
                                }),
                              ],
                            }),
                            e.jsx(te, {}),
                            e.jsxs('div', {
                              className: 'grid grid-cols-2 gap-4 text-xs text-muted-foreground',
                              children: [
                                e.jsxs('div', {
                                  className: 'space-y-1',
                                  children: [
                                    e.jsx('p', {
                                      className: 'text-start',
                                      children: r('detail.createdAt'),
                                    }),
                                    e.jsx('p', {
                                      className: 'text-start font-medium text-foreground',
                                      children: k(t.created_at),
                                    }),
                                  ],
                                }),
                                e.jsxs('div', {
                                  className: 'space-y-1',
                                  children: [
                                    e.jsx('p', {
                                      className: 'text-start',
                                      children: r('detail.updatedAt'),
                                    }),
                                    e.jsx('p', {
                                      className: 'text-start font-medium text-foreground',
                                      children: k(t.updated_at),
                                    }),
                                  ],
                                }),
                                t.completed_at &&
                                  e.jsxs('div', {
                                    className: 'space-y-1 col-span-2',
                                    children: [
                                      e.jsx('p', {
                                        className: 'text-start',
                                        children: r('detail.completedAt'),
                                      }),
                                      e.jsx('p', {
                                        className: 'text-start font-medium text-foreground',
                                        children: k(t.completed_at),
                                      }),
                                    ],
                                  }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
              }),
          ],
        }),
      }),
      t &&
        e.jsx(ge, {
          open: l,
          onOpenChange: d,
          children: e.jsxs(je, {
            className: 'max-w-md max-h-[90vh] overflow-y-auto',
            dir: c ? 'rtl' : 'ltr',
            children: [
              e.jsx(fe, {
                children: e.jsx(Ne, { className: 'text-start', children: r('evidence.title') }),
              }),
              e.jsx('p', {
                className: 'text-sm text-muted-foreground text-start mb-4',
                children: r('evidence.description'),
              }),
              e.jsx(_s, { commitmentId: t.id, onSuccess: () => d(!1), onCancel: () => d(!1) }),
            ],
          }),
        }),
    ],
  })
}
function bt() {
  const { t: s, i18n: h } = P('commitments'),
    o = h.language === 'ar',
    { data: r, isLoading: m } = Ge({
      queryKey: ['currentUser'],
      queryFn: async () => {
        const {
          data: { user: i },
        } = await de.auth.getUser()
        return i
      },
      staleTime: 5 * 60 * 1e3,
    }),
    { data: a } = Ge({
      queryKey: ['commitmentStats', r?.id],
      queryFn: async () => {
        if (!r?.id) return { active: 0, overdue: 0, completed: 0 }
        const { count: i } = await de
            .from('aa_commitments')
            .select('*', { count: 'exact', head: !0 })
            .or(`owner_user_id.eq.${r.id}`)
            .in('status', ['pending', 'in_progress']),
          l = new Date().toISOString().split('T')[0],
          { count: d } = await de
            .from('aa_commitments')
            .select('*', { count: 'exact', head: !0 })
            .or(`owner_user_id.eq.${r.id}`)
            .lt('due_date', l)
            .not('status', 'in', '(completed,cancelled)'),
          { count: u } = await de
            .from('aa_commitments')
            .select('*', { count: 'exact', head: !0 })
            .or(`owner_user_id.eq.${r.id}`)
            .eq('status', 'completed')
        return { active: i ?? 0, overdue: d ?? 0, completed: u ?? 0 }
      },
      enabled: !!r?.id,
      staleTime: 2 * 60 * 1e3,
    })
  if (m)
    return e.jsxs('div', {
      className: 'flex items-center justify-center py-12',
      dir: o ? 'rtl' : 'ltr',
      children: [
        e.jsx(W, { className: 'h-8 w-8 animate-spin text-gray-400' }),
        e.jsx('span', { className: 'ms-3 text-gray-600', children: s('list.loading') }),
      ],
    })
  const c = ['pending', 'in_progress'],
    f = ['completed']
  return e.jsxs('div', {
    className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
    dir: o ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'mb-6 sm:mb-8',
        children: [
          e.jsx('h1', {
            className: 'text-2xl sm:text-3xl md:text-4xl font-bold text-start mb-2',
            children: s('pageTitle'),
          }),
          e.jsx('p', {
            className: 'text-sm sm:text-base text-gray-600 text-start',
            children: s('subtitle'),
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8',
        children: [
          e.jsx(xe, {
            children: e.jsxs(ue, {
              className: 'pb-3',
              children: [
                e.jsxs(ke, {
                  className: 'text-start',
                  children: [s('status.pending'), ' / ', s('status.in_progress')],
                }),
                e.jsx(Se, {
                  className: 'text-2xl sm:text-3xl text-start',
                  children: a?.active ?? 0,
                }),
              ],
            }),
          }),
          e.jsx(xe, {
            children: e.jsxs(ue, {
              className: 'pb-3',
              children: [
                e.jsx(ke, { className: 'text-start', children: s('status.overdue') }),
                e.jsx(Se, {
                  className: 'text-2xl sm:text-3xl text-red-600 text-start',
                  children: a?.overdue ?? 0,
                }),
              ],
            }),
          }),
          e.jsx(xe, {
            children: e.jsxs(ue, {
              className: 'pb-3',
              children: [
                e.jsx(ke, { className: 'text-start', children: s('status.completed') }),
                e.jsx(Se, {
                  className: 'text-2xl sm:text-3xl text-green-600 text-start',
                  children: a?.completed ?? 0,
                }),
              ],
            }),
          }),
        ],
      }),
      e.jsxs(Xs, {
        defaultValue: 'active',
        className: 'w-full',
        children: [
          e.jsxs(Ys, {
            className: 'grid w-full grid-cols-3 mb-4',
            children: [
              e.jsx(ze, {
                value: 'active',
                children: e.jsxs('bdi', {
                  children: [s('status.pending'), ' (', a?.active ?? 0, ')'],
                }),
              }),
              e.jsx(ze, {
                value: 'overdue',
                children: e.jsxs('bdi', {
                  children: [s('status.overdue'), ' (', a?.overdue ?? 0, ')'],
                }),
              }),
              e.jsx(ze, {
                value: 'completed',
                children: e.jsxs('bdi', {
                  children: [s('status.completed'), ' (', a?.completed ?? 0, ')'],
                }),
              }),
            ],
          }),
          e.jsx(Fe, {
            value: 'active',
            children: e.jsx(pe, { ownerId: r?.id, status: c, showFilters: !1 }),
          }),
          e.jsx(Fe, {
            value: 'overdue',
            children: e.jsx(pe, { ownerId: r?.id, overdue: !0, showFilters: !1 }),
          }),
          e.jsx(Fe, {
            value: 'completed',
            children: e.jsx(pe, { ownerId: r?.id, status: f, showFilters: !1 }),
          }),
        ],
      }),
    ],
  })
}
const Ct = {
  country: 'countries',
  organization: 'organizations',
  person: 'persons',
  engagement: 'engagements',
  forum: 'forums',
  working_group: 'working_groups',
  topic: 'topics',
}
function Lt() {
  const { t: s, i18n: h } = P('commitments'),
    o = Ze.useSearch(),
    r = Ze.useNavigate(),
    m = h.language === 'ar',
    { data: a } = bs(o.dossierId ?? '', void 0, { enabled: !!o.dossierId }),
    c = o.status ? o.status.split(',').filter(Boolean) : void 0,
    f = o.priority ? o.priority.split(',').filter(Boolean) : void 0,
    i = N.useCallback(
      (u) => {
        r({
          search: (g) => ({
            ...g,
            status: u.status?.length ? u.status.join(',') : void 0,
            priority: u.priority?.length ? u.priority.join(',') : void 0,
            ownerId: u.ownerId || void 0,
            overdue: u.overdue || void 0,
            dueDateFrom: u.dueDateFrom || void 0,
            dueDateTo: u.dueDateTo || void 0,
            dossierId: u.dossierId || g.dossierId,
          }),
          replace: !0,
        })
      },
      [r],
    ),
    l = N.useCallback(
      (u) => {
        u || r({ search: (g) => ({ ...g, id: void 0 }), replace: !0 })
      },
      [r],
    )
  return o.view === 'dashboard' && !o.dossierId
    ? e.jsxs(e.Fragment, {
        children: [
          e.jsx(bt, {}),
          e.jsx(ns, { commitmentId: o.id ?? null, open: !!o.id, onOpenChange: l }),
        ],
      })
    : e.jsxs('div', {
        className: 'min-h-screen bg-gray-50 dark:bg-gray-900',
        dir: m ? 'rtl' : 'ltr',
        children: [
          e.jsx('div', {
            className: 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
            children: e.jsx('div', {
              className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6',
              children: e.jsxs('div', {
                className: 'flex flex-col sm:flex-row sm:items-center gap-4',
                children: [
                  e.jsx('div', {
                    className: 'flex items-center gap-2',
                    children: o.dossierId
                      ? e.jsxs(v, {
                          variant: 'ghost',
                          size: 'sm',
                          className: 'min-h-11',
                          onClick: () => {
                            const u = (a?.type && Ct[a.type]) || 'countries'
                            r({ to: `/dossiers/${u}/$id`, params: { id: o.dossierId } })
                          },
                          children: [
                            e.jsx(ct, { className: `size-4 ${m ? 'ms-2 rotate-180' : 'me-2'}` }),
                            s('detail.dossier'),
                          ],
                        })
                      : e.jsx(Ss, {
                          to: '/commitments',
                          search: { view: 'dashboard' },
                          children: e.jsxs(v, {
                            variant: 'ghost',
                            size: 'sm',
                            className: 'min-h-11',
                            children: [
                              e.jsx(dt, { className: `size-4 ${m ? 'ms-2' : 'me-2'}` }),
                              s('pageTitle'),
                            ],
                          }),
                        }),
                  }),
                  e.jsxs('div', {
                    className: 'flex-1',
                    children: [
                      e.jsx('h1', {
                        className: 'text-2xl sm:text-3xl font-bold text-foreground text-start',
                        children: s('title'),
                      }),
                      o.dossierId &&
                        e.jsx('p', {
                          className: 'mt-1 text-sm text-muted-foreground text-start',
                          children: s('subtitle'),
                        }),
                    ],
                  }),
                ],
              }),
            }),
          }),
          e.jsx('main', {
            className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
            children: e.jsx(pe, {
              dossierId: o.dossierId,
              status: c,
              priority: f,
              ownerId: o.ownerId,
              overdue: o.overdue,
              dueDateFrom: o.dueDateFrom,
              dueDateTo: o.dueDateTo,
              showFilters: !0,
              showCreateButton: !!o.dossierId,
              onFiltersChange: i,
            }),
          }),
          e.jsx(ns, { commitmentId: o.id ?? null, open: !!o.id, onOpenChange: l }),
        ],
      })
}
export { Lt as component }
//# sourceMappingURL=commitments-7R8IvS7Y.js.map
