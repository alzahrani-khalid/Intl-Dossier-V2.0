import { u as $, r as w, j as e, o as je } from './react-vendor-Buoak6m3.js'
import { i as Ce, m as Se } from './tanstack-vendor-BZC-rs5U.js'
import {
  j as I,
  m as z,
  J as R,
  q as ie,
  r as oe,
  t as le,
  v as de,
  w as C,
  I as W,
  n as ge,
  B as g,
  c as T,
  a2 as ke,
  D as Pe,
  x as Te,
  y as Ae,
  z as xe,
  A as H,
  E as J,
  F as G,
  G as K,
  H as Q,
  aA as Fe,
  aB as ee,
  aC as te,
  aD as L,
  ah as Ee,
  ai as $e,
  aE as se,
  aj as Me,
  ak as ze,
  aG as O,
  aF as ae,
  K as ye,
  k as ne,
  o as re,
  l as ce,
} from './index-qYY0KoZ1.js'
import { a as Re, b as Le } from './useContactRelationships-VllNTxgh.js'
import { C as Ie } from './ContactForm-Csabxwy7.js'
import {
  J as Be,
  K as Ve,
  P as q,
  M as Oe,
  N as qe,
  O as Ue,
  Q as He,
  R as Je,
} from './visualization-vendor-f5uYUx4I.js'
import {
  aS as B,
  aT as Ge,
  aJ as Ne,
  aH as ve,
  aI as me,
  dn as Ke,
  c0 as we,
  b6 as Qe,
  e6 as We,
  bP as Xe,
  aO as Ye,
  aN as Ze,
  dj as be,
  bz as De,
  aR as X,
  aQ as et,
  aD as he,
  cM as tt,
  aX as ue,
  ca as st,
  c1 as at,
  bC as nt,
  cR as rt,
  b9 as pe,
} from './vendor-misc-BiJvMP0A.js'
import { a as ct, b as it, c as ot, d as lt, e as dt } from './useInteractions-BJmtWgB5.js'
import { I as mt, J as xt, H as V } from './date-vendor-s0MkYge4.js'
import { o as ht, a as ut, s as fe, e as pt, d as ft } from './form-vendor-BX1BhTCI.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './tooltip-CE0dVuox.js'
const U = {
  reports_to: '#ef4444',
  collaborates_with: '#3b82f6',
  partner: '#10b981',
  colleague: '#f59e0b',
  other: '#6b7280',
}
function jt({ data: t }) {
  const { t: l } = $('contacts'),
    d = t.isCenter
  return e.jsx(I, {
    className: `p-3 min-w-[180px] sm:min-w-[200px] cursor-pointer transition-shadow hover:shadow-md ${d ? 'ring-2 ring-primary' : ''}`,
    children: e.jsxs('div', {
      className: 'flex flex-col gap-2',
      children: [
        e.jsxs('div', {
          className: 'flex items-center gap-2',
          children: [
            e.jsx(Ge, { className: 'h-4 w-4 text-muted-foreground flex-shrink-0' }),
            e.jsx('span', { className: 'font-semibold text-sm truncate', children: t.label }),
          ],
        }),
        t.position &&
          e.jsx('p', { className: 'text-xs text-muted-foreground truncate', children: t.position }),
        t.organization &&
          e.jsxs(z, {
            variant: 'secondary',
            className: 'text-xs px-2 py-0.5 w-fit',
            children: [e.jsx(Ne, { className: 'h-3 w-3 mr-1' }), t.organization],
          }),
      ],
    }),
  })
}
const gt = { contact: jt }
function yt({
  contactId: t,
  relationships: l,
  contacts: d,
  onContactClick: x,
  onRelationshipClick: s,
  isLoading: r = !1,
  height: c = 500,
  className: j = '',
}) {
  const { t: p, i18n: b } = $('contacts'),
    u = b.language === 'ar',
    [_, y, v] = Be([]),
    [f, m, i] = Ve([])
  w.useEffect(() => {
    if (!d.length || !t) return
    const k = new Map(d.map((o) => [o.id, o]))
    if (!k.get(t)) return
    const A = new Set([t])
    l.forEach((o) => {
      ;(A.add(o.from_contact_id), A.add(o.to_contact_id))
    })
    const M = [],
      h = Array.from(A)
        .map((o) => k.get(o))
        .filter(Boolean),
      F = 250,
      a = (2 * Math.PI) / (h.length - 1 || 1)
    h.forEach((o, P) => {
      const Y = o.id === t
      let Z = Y ? 0 : F * Math.cos(P * a),
        _e = Y ? 0 : F * Math.sin(P * a)
      ;(u && (Z = -Z),
        M.push({
          id: o.id,
          type: 'contact',
          position: { x: Z, y: _e },
          data: {
            label: o.full_name,
            position: o.position,
            organization: o.organization?.name,
            isCenter: Y,
          },
          sourcePosition: u ? q.Left : q.Right,
          targetPosition: u ? q.Right : q.Left,
        }))
    })
    const N = l.map((o) => ({
      id: o.id,
      source: o.from_contact_id,
      target: o.to_contact_id,
      type: 'smoothstep',
      animated: !0,
      label: p(`contactDirectory.relationshipTypes.${o.relationship_type}`),
      labelStyle: { fontSize: 11, fontWeight: 500 },
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: '#ffffff', opacity: 0.9 },
      style: { stroke: U[o.relationship_type] || U.other, strokeWidth: 2 },
      markerEnd: {
        type: Oe.ArrowClosed,
        width: 15,
        height: 15,
        color: U[o.relationship_type] || U.other,
      },
    }))
    ;(y(M), m(N))
  }, [t, l, d, u, p, y, m])
  const n = w.useCallback(
      (k, D) => {
        x && x(D.id)
      },
      [x],
    ),
    S = w.useCallback(
      (k, D) => {
        s && s(D.id)
      },
      [s],
    ),
    E = w.useCallback((k) => m((D) => qe(k, D)), [m])
  return r
    ? e.jsx('div', {
        className: 'flex items-center justify-center bg-muted/10',
        style: { height: typeof c == 'number' ? `${c}px` : c },
        children: e.jsxs('div', {
          className: 'flex flex-col items-center gap-3',
          children: [
            e.jsx(B, { className: 'h-8 w-8 animate-spin text-muted-foreground' }),
            e.jsx('p', {
              className: 'text-sm text-muted-foreground',
              children: p('contactDirectory.relationships.loading_network'),
            }),
          ],
        }),
      })
    : l.length
      ? e.jsx('div', {
          className: `rounded-lg border overflow-hidden ${j}`,
          style: { height: typeof c == 'number' ? `${c}px` : c },
          dir: u ? 'rtl' : 'ltr',
          children: e.jsxs(Ue, {
            nodes: _,
            edges: f,
            onNodesChange: v,
            onEdgesChange: i,
            onNodeClick: n,
            onEdgeClick: S,
            onConnect: E,
            nodeTypes: gt,
            fitView: !0,
            attributionPosition: u ? 'bottom-left' : 'bottom-right',
            proOptions: { hideAttribution: !0 },
            children: [e.jsx(He, {}), e.jsx(Je, { position: u ? 'top-left' : 'top-right' })],
          }),
        })
      : e.jsx('div', {
          className: 'flex items-center justify-center bg-muted/10 rounded-lg border border-dashed',
          style: { height: typeof c == 'number' ? `${c}px` : c },
          children: e.jsxs('div', {
            className: 'text-center px-4',
            children: [
              e.jsx('p', {
                className: 'font-medium mb-1',
                children: p('contactDirectory.relationships.no_relationships'),
              }),
              e.jsx('p', {
                className: 'text-sm text-muted-foreground',
                children: p('contactDirectory.relationships.add_relationships_hint'),
              }),
            ],
          }),
        })
}
function Nt({
  fromContactId: t,
  toContactId: l,
  availableContacts: d = [],
  onSuccess: x,
  onCancel: s,
}) {
  const { t: r, i18n: c } = $('contacts'),
    j = c.language === 'ar',
    {
      register: p,
      handleSubmit: b,
      setValue: u,
      watch: _,
      formState: { errors: y },
    } = je({ defaultValues: { to_contact_id: l || '', relationship_type: 'colleague' } }),
    v = Re(),
    f = _('relationship_type'),
    m = (i) => {
      const n = {
        from_contact_id: t,
        to_contact_id: i.to_contact_id,
        relationship_type: i.relationship_type,
        notes: i.notes || void 0,
        start_date: i.start_date || void 0,
        end_date: i.end_date || void 0,
      }
      v.mutate(n, {
        onSuccess: () => {
          x?.()
        },
      })
    }
  return e.jsxs('form', {
    onSubmit: b(m),
    className: 'space-y-4',
    dir: j ? 'rtl' : 'ltr',
    children: [
      !l &&
        e.jsxs('div', {
          className: 'space-y-2',
          children: [
            e.jsxs(R, {
              htmlFor: 'to_contact_id',
              children: [
                r('contactDirectory.relationships.form.select_contact'),
                e.jsx('span', { className: 'text-destructive ms-1', children: '*' }),
              ],
            }),
            e.jsxs(ie, {
              value: _('to_contact_id'),
              onValueChange: (i) => u('to_contact_id', i),
              children: [
                e.jsx(oe, {
                  id: 'to_contact_id',
                  className: 'h-11 sm:h-10',
                  children: e.jsx(le, {
                    placeholder: r(
                      'contactDirectory.relationships.form.select_contact_placeholder',
                    ),
                  }),
                }),
                e.jsx(de, {
                  children: d.map((i) => e.jsx(C, { value: i.id, children: i.full_name }, i.id)),
                }),
              ],
            }),
            y.to_contact_id &&
              e.jsx('p', {
                className: 'text-sm text-destructive text-start',
                children: r('contactDirectory.relationships.form.contact_required'),
              }),
          ],
        }),
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsxs(R, {
            htmlFor: 'relationship_type',
            children: [
              r('contactDirectory.relationships.form.relationship_type'),
              e.jsx('span', { className: 'text-destructive ms-1', children: '*' }),
            ],
          }),
          e.jsxs(ie, {
            value: f,
            onValueChange: (i) => u('relationship_type', i),
            children: [
              e.jsx(oe, {
                id: 'relationship_type',
                className: 'h-11 sm:h-10',
                children: e.jsx(le, {}),
              }),
              e.jsxs(de, {
                children: [
                  e.jsx(C, {
                    value: 'reports_to',
                    children: r('contactDirectory.relationshipTypes.reports_to'),
                  }),
                  e.jsx(C, {
                    value: 'collaborates_with',
                    children: r('contactDirectory.relationshipTypes.collaborates_with'),
                  }),
                  e.jsx(C, {
                    value: 'partner',
                    children: r('contactDirectory.relationshipTypes.partner'),
                  }),
                  e.jsx(C, {
                    value: 'colleague',
                    children: r('contactDirectory.relationshipTypes.colleague'),
                  }),
                  e.jsx(C, {
                    value: 'other',
                    children: r('contactDirectory.relationshipTypes.other'),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx(R, {
            htmlFor: 'start_date',
            children: r('contactDirectory.relationships.form.start_date'),
          }),
          e.jsx(W, {
            id: 'start_date',
            type: 'date',
            ...p('start_date'),
            className: 'h-11 sm:h-10',
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx(R, {
            htmlFor: 'end_date',
            children: r('contactDirectory.relationships.form.end_date'),
          }),
          e.jsx(W, { id: 'end_date', type: 'date', ...p('end_date'), className: 'h-11 sm:h-10' }),
        ],
      }),
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx(R, { htmlFor: 'notes', children: r('contactDirectory.relationships.form.notes') }),
          e.jsx(ge, {
            id: 'notes',
            ...p('notes'),
            placeholder: r('contactDirectory.relationships.form.notes_placeholder'),
            rows: 3,
            className: 'resize-none',
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'flex flex-col-reverse sm:flex-row gap-2 pt-4',
        children: [
          s &&
            e.jsx(g, {
              type: 'button',
              variant: 'outline',
              onClick: s,
              disabled: v.isPending,
              className: 'flex-1 sm:flex-initial h-11 sm:h-10',
              children: r('contactDirectory.form.cancel'),
            }),
          e.jsxs(g, {
            type: 'submit',
            disabled: v.isPending,
            className: 'flex-1 sm:flex-initial h-11 sm:h-10',
            children: [
              v.isPending && e.jsx(B, { className: `h-4 w-4 animate-spin ${j ? 'ml-2' : 'mr-2'}` }),
              r('contactDirectory.relationships.form.create_relationship'),
            ],
          }),
        ],
      }),
    ],
  })
}
function vt(t) {
  switch (t) {
    case 'meeting':
      return X
    case 'email':
      return De
    case 'call':
      return be
    case 'conference':
      return me
    default:
      return ve
  }
}
function wt(t) {
  switch (t) {
    case 'meeting':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'email':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'call':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'conference':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}
function bt({ note: t, isRTL: l, locale: d, onEdit: x, onDelete: s, onDownload: r }) {
  const { t: c } = $('contacts'),
    [j, p] = w.useState(!1),
    b = vt(t.type),
    u = V(new Date(t.date), 'PPP', { locale: d }),
    _ = (m) => {
      const i = m.split('/')
      return i[i.length - 1].replace(/^\d+_/, '')
    },
    y = t.attachments && t.attachments.length > 0,
    v = t.attendees && t.attendees.length > 0,
    f = t.details.length > 150 ? `${t.details.substring(0, 150)}...` : t.details
  return e.jsx(I, {
    className: T('p-4 hover:shadow-md transition-shadow', 'border border-border', l && 'text-end'),
    children: e.jsxs('div', {
      className: 'flex flex-col gap-3 sm:gap-4',
      children: [
        e.jsxs('div', {
          className: 'flex items-start justify-between gap-3',
          children: [
            e.jsxs('div', {
              className: 'flex items-start gap-3 flex-1 min-w-0',
              children: [
                e.jsx('div', {
                  className: T(
                    'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                    'bg-primary/10 text-primary',
                  ),
                  children: e.jsx(b, { className: 'w-5 h-5' }),
                }),
                e.jsxs('div', {
                  className: 'flex-1 min-w-0',
                  children: [
                    e.jsxs('div', {
                      className: 'flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2',
                      children: [
                        e.jsx(z, {
                          variant: 'secondary',
                          className: T('w-fit text-xs', wt(t.type)),
                          children: c(`contactDirectory.interactions.types.${t.type}`),
                        }),
                        e.jsx('span', {
                          className: 'text-xs sm:text-sm text-muted-foreground',
                          children: u,
                        }),
                      ],
                    }),
                    v &&
                      e.jsxs('div', {
                        className: 'flex items-center gap-1 mt-1',
                        children: [
                          e.jsx(me, { className: 'w-3 h-3 text-muted-foreground' }),
                          e.jsx('span', {
                            className: 'text-xs text-muted-foreground',
                            children: c('contactDirectory.interactions.attendees_count', {
                              count: t.attendees.length,
                            }),
                          }),
                        ],
                      }),
                  ],
                }),
              ],
            }),
            e.jsxs(Pe, {
              children: [
                e.jsx(Te, {
                  asChild: !0,
                  children: e.jsxs(g, {
                    variant: 'ghost',
                    size: 'sm',
                    className: 'h-8 w-8 p-0',
                    children: [
                      e.jsx(Ke, { className: 'h-4 w-4' }),
                      e.jsx('span', {
                        className: 'sr-only',
                        children: c('contactDirectory.interactions.actions'),
                      }),
                    ],
                  }),
                }),
                e.jsxs(Ae, {
                  align: l ? 'start' : 'end',
                  children: [
                    x &&
                      e.jsxs(xe, {
                        onClick: () => x(t),
                        children: [
                          e.jsx(we, { className: 'w-4 h-4 me-2' }),
                          c('contactDirectory.interactions.edit'),
                        ],
                      }),
                    e.jsxs(xe, {
                      onClick: () => s(t.id, t.contact_id),
                      className: 'text-destructive',
                      children: [
                        e.jsx(Qe, { className: 'w-4 h-4 me-2' }),
                        c('contactDirectory.interactions.delete'),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        e.jsx('div', { className: 'text-sm text-foreground', children: j ? t.details : f }),
        y &&
          e.jsxs('div', {
            className: 'flex flex-col gap-2',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-1 text-xs text-muted-foreground',
                children: [
                  e.jsx(We, { className: 'w-3 h-3' }),
                  e.jsx('span', {
                    children: c('contactDirectory.interactions.attachments_count', {
                      count: t.attachments.length,
                    }),
                  }),
                ],
              }),
              e.jsx('div', {
                className: 'flex flex-wrap gap-2',
                children: t.attachments.map((m, i) => {
                  const n = _(m)
                  return e.jsxs(
                    g,
                    {
                      variant: 'outline',
                      size: 'sm',
                      className: 'h-8 text-xs gap-2',
                      onClick: () => r(m, n),
                      children: [
                        e.jsx(Xe, { className: 'w-3 h-3' }),
                        e.jsx('span', {
                          className: 'truncate max-w-[150px] sm:max-w-[200px]',
                          children: n,
                        }),
                      ],
                    },
                    i,
                  )
                }),
              }),
            ],
          }),
        t.details.length > 150 &&
          e.jsx(g, {
            variant: 'ghost',
            size: 'sm',
            className: 'h-8 w-full sm:w-auto text-xs gap-1',
            onClick: () => p(!j),
            children: j
              ? e.jsxs(e.Fragment, {
                  children: [
                    e.jsx(Ye, { className: 'w-4 h-4' }),
                    c('contactDirectory.interactions.show_less'),
                  ],
                })
              : e.jsxs(e.Fragment, {
                  children: [
                    e.jsx(Ze, { className: 'w-4 h-4' }),
                    c('contactDirectory.interactions.show_more'),
                  ],
                }),
          }),
      ],
    }),
  })
}
function Dt({ contactId: t, onEditNote: l, className: d }) {
  const { t: x, i18n: s } = $('contacts'),
    r = s.language === 'ar',
    c = r ? mt : xt,
    { data: j, isLoading: p, error: b } = ct(t),
    u = it(),
    _ = ot(),
    y = (f, m) => {
      window.confirm(x('contactDirectory.interactions.delete_confirm')) &&
        u.mutate({ id: f, contactId: m })
    },
    v = (f, m) => {
      _.mutate({ path: f, filename: m })
    }
  return p
    ? e.jsx('div', {
        className: T('flex items-center justify-center py-8', d),
        dir: r ? 'rtl' : 'ltr',
        children: e.jsxs('div', {
          className: 'flex flex-col items-center gap-2',
          children: [
            e.jsx('div', {
              className:
                'h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent',
            }),
            e.jsx('p', {
              className: 'text-sm text-muted-foreground',
              children: x('contactDirectory.interactions.loading'),
            }),
          ],
        }),
      })
    : b
      ? e.jsx('div', {
          className: T('p-4 text-center', d),
          dir: r ? 'rtl' : 'ltr',
          children: e.jsxs('p', {
            className: 'text-sm text-destructive',
            children: [x('contactDirectory.interactions.error'), ': ', b.message],
          }),
        })
      : !j || j.length === 0
        ? e.jsxs('div', {
            className: T('flex flex-col items-center justify-center py-12 text-center', d),
            dir: r ? 'rtl' : 'ltr',
            children: [
              e.jsx(ve, { className: 'w-12 h-12 text-muted-foreground/50 mb-4' }),
              e.jsx('h3', {
                className: 'text-base font-medium mb-2',
                children: x('contactDirectory.interactions.no_notes_title'),
              }),
              e.jsx('p', {
                className: 'text-sm text-muted-foreground max-w-sm',
                children: x('contactDirectory.interactions.no_notes_description'),
              }),
            ],
          })
        : e.jsxs('div', {
            className: T('space-y-4', d),
            dir: r ? 'rtl' : 'ltr',
            children: [
              e.jsxs('div', {
                className: 'flex items-center justify-between',
                children: [
                  e.jsx('h3', {
                    className: 'text-base sm:text-lg font-semibold',
                    children: x('contactDirectory.interactions.timeline_title'),
                  }),
                  e.jsx(z, {
                    variant: 'secondary',
                    className: 'text-xs',
                    children: x('contactDirectory.interactions.notes_count', { count: j.length }),
                  }),
                ],
              }),
              e.jsx(ke, {}),
              e.jsx('div', {
                className: 'space-y-3 sm:space-y-4',
                children: j.map((f) =>
                  e.jsx(
                    bt,
                    { note: f, isRTL: r, locale: c, onEdit: l, onDelete: y, onDownload: v },
                    f.id,
                  ),
                ),
              }),
            ],
          })
}
const _t = ht({
  date: ft({ required_error: 'Date is required' }),
  type: pt(['meeting', 'email', 'call', 'conference', 'other'], {
    required_error: 'Type is required',
  }),
  details: fe()
    .min(10, 'Details must be at least 10 characters')
    .max(5e3, 'Details cannot exceed 5000 characters'),
  attendees: ut(fe()).optional(),
})
function Ct({ contactId: t, note: l, open: d, onOpenChange: x }) {
  const { t: s, i18n: r } = $('contacts'),
    c = r.language === 'ar',
    j = lt(),
    p = dt(),
    [b, u] = w.useState([]),
    [_, y] = w.useState(!1),
    [v, f] = w.useState(''),
    [m, i] = w.useState([]),
    { data: n } = useSearchContacts({ search: v, limit: 10 }),
    S = je({
      resolver: et(_t),
      defaultValues: {
        date: l ? new Date(l.date) : new Date(),
        type: l?.type || 'meeting',
        details: l?.details || '',
        attendees: l?.attendees || [],
      },
    })
  w.useEffect(() => {
    l?.attendees && i(l.attendees)
  }, [l])
  const E = (a) => {
      const o = Array.from(a.target.files || []).filter((P) => !(P.size > 10 * 1024 * 1024))
      u((P) => [...P, ...o])
    },
    k = (a) => {
      u((N) => N.filter((o, P) => P !== a))
    },
    D = (a) => {
      ;(m.includes(a) || i([...m, a]), f(''))
    },
    A = (a) => {
      i(m.filter((N) => N !== a))
    },
    M = async (a) => {
      try {
        const N = await j.mutateAsync({
          contact_id: t,
          date: V(a.date, 'yyyy-MM-dd'),
          type: a.type,
          details: a.details,
          attendees: m.length > 0 ? m : void 0,
        })
        if (b.length > 0) {
          y(!0)
          const o = b.map((P) => p.mutateAsync({ contactId: t, noteId: N.id, file: P }))
          ;(await Promise.all(o), y(!1))
        }
        ;(S.reset(), u([]), i([]), x(!1))
      } catch (N) {
        ;(console.error('Failed to create note:', N), y(!1))
      }
    },
    h = j.isPending || _,
    F = new Date()
  return e.jsx(H, {
    open: d,
    onOpenChange: x,
    children: e.jsxs(J, {
      className: 'max-w-2xl max-h-[90vh] overflow-y-auto px-4 sm:px-6',
      dir: c ? 'rtl' : 'ltr',
      children: [
        e.jsxs(G, {
          children: [
            e.jsx(K, {
              className: 'text-lg sm:text-xl',
              children: s(
                l
                  ? 'contactDirectory.interactions.form.edit_title'
                  : 'contactDirectory.interactions.form.create_title',
              ),
            }),
            e.jsx(Q, {
              className: 'text-sm',
              children: s('contactDirectory.interactions.form.description'),
            }),
          ],
        }),
        e.jsx(Fe, {
          ...S,
          children: e.jsxs('form', {
            onSubmit: S.handleSubmit(M),
            className: 'space-y-4 sm:space-y-6',
            children: [
              e.jsx(ee, {
                control: S.control,
                name: 'date',
                render: ({ field: a }) =>
                  e.jsxs(te, {
                    className: 'flex flex-col',
                    children: [
                      e.jsx(L, { children: s('contactDirectory.interactions.form.date') }),
                      e.jsxs(Ee, {
                        children: [
                          e.jsx($e, {
                            asChild: !0,
                            children: e.jsx(se, {
                              children: e.jsxs(g, {
                                variant: 'outline',
                                className: T(
                                  'w-full justify-start text-start font-normal',
                                  !a.value && 'text-muted-foreground',
                                ),
                                children: [
                                  e.jsx(X, { className: T('h-4 w-4', c ? 'ms-2' : 'me-2') }),
                                  a.value
                                    ? V(a.value, 'PPP')
                                    : e.jsx('span', {
                                        children: s(
                                          'contactDirectory.interactions.form.select_date',
                                        ),
                                      }),
                                ],
                              }),
                            }),
                          }),
                          e.jsx(Me, {
                            className: 'w-auto p-0',
                            align: c ? 'end' : 'start',
                            children: e.jsx(ze, {
                              mode: 'single',
                              selected: a.value,
                              onSelect: a.onChange,
                              disabled: (N) => N > F,
                              initialFocus: !0,
                            }),
                          }),
                        ],
                      }),
                      e.jsx(O, {
                        className: 'text-xs',
                        children: s('contactDirectory.interactions.form.date_description'),
                      }),
                      e.jsx(ae, {}),
                    ],
                  }),
              }),
              e.jsx(ee, {
                control: S.control,
                name: 'type',
                render: ({ field: a }) =>
                  e.jsxs(te, {
                    children: [
                      e.jsx(L, { children: s('contactDirectory.interactions.form.type') }),
                      e.jsxs(ie, {
                        onValueChange: a.onChange,
                        defaultValue: a.value,
                        children: [
                          e.jsx(se, {
                            children: e.jsx(oe, {
                              children: e.jsx(le, {
                                placeholder: s('contactDirectory.interactions.form.select_type'),
                              }),
                            }),
                          }),
                          e.jsxs(de, {
                            children: [
                              e.jsx(C, {
                                value: 'meeting',
                                children: s('contactDirectory.interactions.types.meeting'),
                              }),
                              e.jsx(C, {
                                value: 'email',
                                children: s('contactDirectory.interactions.types.email'),
                              }),
                              e.jsx(C, {
                                value: 'call',
                                children: s('contactDirectory.interactions.types.call'),
                              }),
                              e.jsx(C, {
                                value: 'conference',
                                children: s('contactDirectory.interactions.types.conference'),
                              }),
                              e.jsx(C, {
                                value: 'other',
                                children: s('contactDirectory.interactions.types.other'),
                              }),
                            ],
                          }),
                        ],
                      }),
                      e.jsx(ae, {}),
                    ],
                  }),
              }),
              e.jsx(ee, {
                control: S.control,
                name: 'details',
                render: ({ field: a }) =>
                  e.jsxs(te, {
                    children: [
                      e.jsx(L, { children: s('contactDirectory.interactions.form.details') }),
                      e.jsx(se, {
                        children: e.jsx(ge, {
                          placeholder: s('contactDirectory.interactions.form.details_placeholder'),
                          className: 'min-h-[120px] resize-none',
                          ...a,
                        }),
                      }),
                      e.jsxs(O, {
                        className: 'text-xs',
                        children: [
                          a.value.length,
                          '/5000',
                          ' ',
                          s('contactDirectory.interactions.form.characters'),
                        ],
                      }),
                      e.jsx(ae, {}),
                    ],
                  }),
              }),
              e.jsxs('div', {
                className: 'space-y-2',
                children: [
                  e.jsxs(L, {
                    className: 'flex items-center gap-2',
                    children: [
                      e.jsx(me, { className: 'w-4 h-4' }),
                      s('contactDirectory.interactions.form.attendees'),
                    ],
                  }),
                  e.jsx(W, {
                    type: 'text',
                    placeholder: s('contactDirectory.interactions.form.search_attendees'),
                    value: v,
                    onChange: (a) => f(a.target.value),
                    className: 'text-sm',
                  }),
                  v &&
                    n &&
                    n.contacts.length > 0 &&
                    e.jsx('div', {
                      className: 'border rounded-md max-h-40 overflow-y-auto',
                      children: n.contacts.map((a) =>
                        e.jsxs(
                          'button',
                          {
                            type: 'button',
                            onClick: () => D(a.id),
                            className:
                              'w-full px-3 py-2 text-sm text-start hover:bg-accent transition-colors',
                            children: [
                              a.full_name,
                              a.organization &&
                                e.jsxs('span', {
                                  className: 'text-xs text-muted-foreground ms-2',
                                  children: ['(', a.organization.name, ')'],
                                }),
                            ],
                          },
                          a.id,
                        ),
                      ),
                    }),
                  m.length > 0 &&
                    e.jsx('div', {
                      className: 'flex flex-wrap gap-2',
                      children: m.map((a) => {
                        const N = n?.contacts.find((o) => o.id === a)
                        return e.jsxs(
                          z,
                          {
                            variant: 'secondary',
                            className: 'gap-1',
                            children: [
                              N?.full_name || a,
                              e.jsx('button', {
                                type: 'button',
                                onClick: () => A(a),
                                className: 'ms-1 hover:text-destructive',
                                children: e.jsx(he, { className: 'w-3 h-3' }),
                              }),
                            ],
                          },
                          a,
                        )
                      }),
                    }),
                  e.jsx(O, {
                    className: 'text-xs',
                    children: s('contactDirectory.interactions.form.attendees_description'),
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'space-y-2',
                children: [
                  e.jsx(L, { children: s('contactDirectory.interactions.form.attachments') }),
                  e.jsxs('div', {
                    className: 'flex flex-col sm:flex-row gap-2',
                    children: [
                      e.jsx(W, {
                        type: 'file',
                        id: 'file-upload',
                        multiple: !0,
                        onChange: E,
                        className: 'hidden',
                      }),
                      e.jsxs(g, {
                        type: 'button',
                        variant: 'outline',
                        size: 'sm',
                        onClick: () => document.getElementById('file-upload')?.click(),
                        className: 'w-full sm:w-auto',
                        children: [
                          e.jsx(tt, { className: T('w-4 h-4', c ? 'ms-2' : 'me-2') }),
                          s('contactDirectory.interactions.form.upload_files'),
                        ],
                      }),
                    ],
                  }),
                  b.length > 0 &&
                    e.jsx('div', {
                      className: 'space-y-2',
                      children: b.map((a, N) =>
                        e.jsxs(
                          'div',
                          {
                            className:
                              'flex items-center justify-between p-2 border rounded-md text-sm',
                            children: [
                              e.jsx('span', { className: 'truncate flex-1', children: a.name }),
                              e.jsx('button', {
                                type: 'button',
                                onClick: () => k(N),
                                className: 'ms-2 text-muted-foreground hover:text-destructive',
                                children: e.jsx(he, { className: 'w-4 h-4' }),
                              }),
                            ],
                          },
                          N,
                        ),
                      ),
                    }),
                  e.jsx(O, {
                    className: 'text-xs',
                    children: s('contactDirectory.interactions.form.attachments_description'),
                  }),
                ],
              }),
              e.jsxs(ye, {
                className: 'flex-col sm:flex-row gap-2',
                children: [
                  e.jsx(g, {
                    type: 'button',
                    variant: 'outline',
                    onClick: () => x(!1),
                    disabled: h,
                    className: 'w-full sm:w-auto',
                    children: s('contactDirectory.interactions.form.cancel'),
                  }),
                  e.jsxs(g, {
                    type: 'submit',
                    disabled: h,
                    className: 'w-full sm:w-auto gap-2',
                    children: [
                      h && e.jsx(B, { className: 'w-4 h-4 animate-spin' }),
                      s(
                        l
                          ? 'contactDirectory.interactions.form.save_changes'
                          : 'contactDirectory.interactions.form.create_note',
                      ),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      ],
    }),
  })
}
function St() {
  const { t, i18n: l } = $('contacts'),
    d = l.language === 'ar',
    x = Ce(),
    { contactId: s } = Se({ from: '/contacts/$contactId' }),
    [r, c] = w.useState(!1),
    [j, p] = w.useState(!1),
    [b, u] = w.useState(!1),
    [_, y] = w.useState(!1),
    [v, f] = w.useState(!1),
    [m, i] = w.useState(void 0),
    { data: n, isLoading: S } = useContact(s),
    { data: E = [], isLoading: k } = Le(s),
    D = useArchiveContact(),
    A = () => {
      x({ to: '/contacts' })
    },
    M = () => {
      D.mutate(s, {
        onSuccess: () => {
          ;(p(!1), x({ to: '/contacts' }))
        },
      })
    }
  return S
    ? e.jsx('div', {
        className: 'min-h-screen flex items-center justify-center',
        children: e.jsxs('div', {
          className: 'flex flex-col items-center gap-4',
          children: [
            e.jsx(B, { className: 'h-8 w-8 animate-spin text-muted-foreground' }),
            e.jsx('p', {
              className: 'text-sm text-muted-foreground',
              children: t('contactDirectory.list.loading_contacts'),
            }),
          ],
        }),
      })
    : n
      ? e.jsx('div', {
          className: 'min-h-screen',
          dir: d ? 'rtl' : 'ltr',
          children: e.jsxs('div', {
            className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6',
            children: [
              e.jsxs('div', {
                className:
                  'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6',
                children: [
                  e.jsxs(g, {
                    variant: 'ghost',
                    onClick: A,
                    className: 'self-start',
                    children: [
                      e.jsx(ue, { className: `h-4 w-4 ${d ? 'ml-2' : 'mr-2'}` }),
                      t('contactDirectory.buttons.back'),
                    ],
                  }),
                  !r &&
                    e.jsxs('div', {
                      className: 'flex flex-wrap gap-2',
                      children: [
                        e.jsxs(g, {
                          variant: 'outline',
                          onClick: () => u(!0),
                          className: 'h-11 sm:h-10',
                          children: [
                            e.jsx(st, { className: `h-4 w-4 ${d ? 'ml-2' : 'mr-2'}` }),
                            t('contactDirectory.relationships.view_network'),
                          ],
                        }),
                        e.jsxs(g, {
                          variant: 'outline',
                          onClick: () => c(!0),
                          className: 'h-11 sm:h-10',
                          children: [
                            e.jsx(we, { className: `h-4 w-4 ${d ? 'ml-2' : 'mr-2'}` }),
                            t('contactDirectory.buttons.edit'),
                          ],
                        }),
                        e.jsxs(g, {
                          variant: 'outline',
                          onClick: () => p(!0),
                          className: 'h-11 sm:h-10',
                          children: [
                            e.jsx(at, { className: `h-4 w-4 ${d ? 'ml-2' : 'mr-2'}` }),
                            t('contactDirectory.buttons.archive'),
                          ],
                        }),
                      ],
                    }),
                ],
              }),
              r
                ? e.jsxs(I, {
                    children: [
                      e.jsx(ne, {
                        children: e.jsx(re, { children: t('contactDirectory.buttons.edit') }),
                      }),
                      e.jsx(ce, {
                        children: e.jsx(Ie, {
                          defaultValues: n,
                          onSubmit: () => c(!1),
                          onCancel: () => c(!1),
                          mode: 'edit',
                        }),
                      }),
                    ],
                  })
                : e.jsxs('div', {
                    className: 'space-y-6',
                    children: [
                      e.jsxs(I, {
                        children: [
                          e.jsx(ne, {
                            children: e.jsxs('div', {
                              className:
                                'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
                              children: [
                                e.jsxs('div', {
                                  children: [
                                    e.jsx(re, {
                                      className: 'text-2xl text-start',
                                      children: n.full_name,
                                    }),
                                    n.position &&
                                      e.jsxs('div', {
                                        className:
                                          'flex items-center gap-2 mt-2 text-muted-foreground',
                                        children: [
                                          e.jsx(nt, { className: 'h-4 w-4' }),
                                          e.jsx('span', {
                                            className: 'text-start',
                                            children: n.position,
                                          }),
                                        ],
                                      }),
                                  ],
                                }),
                                n.organization &&
                                  e.jsxs(z, {
                                    variant: 'secondary',
                                    className: 'flex items-center gap-2 px-3 py-1.5',
                                    children: [
                                      e.jsx(Ne, { className: 'h-4 w-4' }),
                                      n.organization.name,
                                    ],
                                  }),
                              ],
                            }),
                          }),
                          e.jsxs(ce, {
                            className: 'space-y-4',
                            children: [
                              n.email_addresses &&
                                n.email_addresses.length > 0 &&
                                e.jsxs('div', {
                                  children: [
                                    e.jsx('h3', {
                                      className: 'text-sm font-medium mb-2 text-start',
                                      children: t('contactDirectory.labels.email'),
                                    }),
                                    e.jsx('div', {
                                      className: 'space-y-2',
                                      children: n.email_addresses.map((h, F) =>
                                        e.jsxs(
                                          'div',
                                          {
                                            className: 'flex items-center gap-2 text-sm',
                                            children: [
                                              e.jsx(De, {
                                                className: 'h-4 w-4 text-muted-foreground',
                                              }),
                                              e.jsx('a', {
                                                href: `mailto:${h}`,
                                                className:
                                                  'text-primary hover:underline text-start',
                                                children: h,
                                              }),
                                            ],
                                          },
                                          F,
                                        ),
                                      ),
                                    }),
                                  ],
                                }),
                              n.phone_numbers &&
                                n.phone_numbers.length > 0 &&
                                e.jsxs('div', {
                                  children: [
                                    e.jsx('h3', {
                                      className: 'text-sm font-medium mb-2 text-start',
                                      children: t('contactDirectory.labels.phone'),
                                    }),
                                    e.jsx('div', {
                                      className: 'space-y-2',
                                      children: n.phone_numbers.map((h, F) =>
                                        e.jsxs(
                                          'div',
                                          {
                                            className: 'flex items-center gap-2 text-sm',
                                            children: [
                                              e.jsx(be, {
                                                className: 'h-4 w-4 text-muted-foreground',
                                              }),
                                              e.jsx('a', {
                                                href: `tel:${h}`,
                                                className: 'text-primary hover:underline',
                                                dir: 'ltr',
                                                children: h,
                                              }),
                                            ],
                                          },
                                          F,
                                        ),
                                      ),
                                    }),
                                  ],
                                }),
                              n.tags &&
                                n.tags.length > 0 &&
                                e.jsxs('div', {
                                  children: [
                                    e.jsx('h3', {
                                      className: 'text-sm font-medium mb-2 text-start',
                                      children: t('contactDirectory.labels.tags'),
                                    }),
                                    e.jsx('div', {
                                      className: 'flex flex-wrap gap-2',
                                      children: n.tags.map((h) =>
                                        e.jsxs(
                                          z,
                                          {
                                            variant: 'outline',
                                            children: [
                                              e.jsx(rt, { className: 'h-3 w-3 mr-1' }),
                                              h.name,
                                            ],
                                          },
                                          h.id,
                                        ),
                                      ),
                                    }),
                                  ],
                                }),
                              n.notes &&
                                e.jsxs('div', {
                                  children: [
                                    e.jsx('h3', {
                                      className: 'text-sm font-medium mb-2 text-start',
                                      children: t('contactDirectory.labels.notes'),
                                    }),
                                    e.jsx('p', {
                                      className:
                                        'text-sm text-muted-foreground whitespace-pre-wrap text-start',
                                      children: n.notes,
                                    }),
                                  ],
                                }),
                              e.jsxs('div', {
                                className: 'pt-4 border-t space-y-2 text-xs text-muted-foreground',
                                children: [
                                  e.jsxs('div', {
                                    className: 'flex items-center gap-2',
                                    children: [
                                      e.jsx(X, { className: 'h-3 w-3' }),
                                      e.jsxs('span', {
                                        children: [
                                          t('contactDirectory.labels.createdAt'),
                                          ':',
                                          ' ',
                                          V(new Date(n.created_at), 'PPP'),
                                        ],
                                      }),
                                    ],
                                  }),
                                  n.updated_at !== n.created_at &&
                                    e.jsxs('div', {
                                      className: 'flex items-center gap-2',
                                      children: [
                                        e.jsx(X, { className: 'h-3 w-3' }),
                                        e.jsxs('span', {
                                          children: [
                                            t('contactDirectory.labels.updatedAt'),
                                            ':',
                                            ' ',
                                            V(new Date(n.updated_at), 'PPP'),
                                          ],
                                        }),
                                      ],
                                    }),
                                  e.jsx('div', {
                                    className: 'flex items-center gap-2',
                                    children: e.jsxs('span', {
                                      children: [
                                        t('contactDirectory.labels.sourceType'),
                                        ':',
                                        ' ',
                                        t(`contactDirectory.sourceTypes.${n.source_type}`),
                                      ],
                                    }),
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      e.jsxs(I, {
                        children: [
                          e.jsx(ne, {
                            children: e.jsxs('div', {
                              className:
                                'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
                              children: [
                                e.jsx(re, {
                                  className: 'text-start',
                                  children: t('contactDirectory.interactions.title'),
                                }),
                                e.jsxs(g, {
                                  variant: 'default',
                                  size: 'sm',
                                  onClick: () => f(!0),
                                  className: 'h-11 sm:h-10 w-full sm:w-auto',
                                  children: [
                                    e.jsx(pe, { className: `h-4 w-4 ${d ? 'ml-2' : 'mr-2'}` }),
                                    t('contactDirectory.interactions.add_note'),
                                  ],
                                }),
                              ],
                            }),
                          }),
                          e.jsx(ce, {
                            children: e.jsx(Dt, {
                              contactId: s,
                              onEditNote: (h) => {
                                ;(i(h), f(!0))
                              },
                            }),
                          }),
                        ],
                      }),
                    ],
                  }),
              e.jsx(H, {
                open: b,
                onOpenChange: u,
                children: e.jsxs(J, {
                  className: 'max-w-5xl max-h-[90vh]',
                  children: [
                    e.jsxs(G, {
                      children: [
                        e.jsxs('div', {
                          className: 'flex items-center justify-between',
                          children: [
                            e.jsx(K, { children: t('contactDirectory.relationships.title') }),
                            e.jsxs(g, {
                              variant: 'outline',
                              size: 'sm',
                              onClick: () => {
                                ;(u(!1), y(!0))
                              },
                              className: 'h-9',
                              children: [
                                e.jsx(pe, { className: `h-4 w-4 ${d ? 'ml-2' : 'mr-2'}` }),
                                t('contactDirectory.relationships.add_relationship'),
                              ],
                            }),
                          ],
                        }),
                        e.jsx(Q, {
                          children: t('contactDirectory.relationships.relationship_count', {
                            count: E.length,
                          }),
                        }),
                      ],
                    }),
                    e.jsx('div', {
                      className: 'mt-4',
                      children: e.jsx(yt, {
                        contactId: s,
                        relationships: E,
                        contacts: [
                          n,
                          ...E.map((h) => h.from_contact || h.to_contact).filter(Boolean),
                        ],
                        isLoading: k,
                        height: 500,
                      }),
                    }),
                  ],
                }),
              }),
              e.jsx(H, {
                open: _,
                onOpenChange: y,
                children: e.jsxs(J, {
                  children: [
                    e.jsxs(G, {
                      children: [
                        e.jsx(K, {
                          children: t('contactDirectory.relationships.add_relationship'),
                        }),
                        e.jsxs(Q, { children: ['Create a new relationship for ', n.full_name] }),
                      ],
                    }),
                    e.jsx(Nt, { fromContactId: s, onSuccess: () => y(!1), onCancel: () => y(!1) }),
                  ],
                }),
              }),
              e.jsx(Ct, {
                contactId: s,
                note: m,
                open: v,
                onOpenChange: (h) => {
                  ;(f(h), h || i(void 0))
                },
              }),
              e.jsx(H, {
                open: j,
                onOpenChange: p,
                children: e.jsxs(J, {
                  children: [
                    e.jsxs(G, {
                      children: [
                        e.jsx(K, { children: t('contactDirectory.buttons.archive') }),
                        e.jsx(Q, {
                          children: t('contactDirectory.messages.archiveConfirm', {
                            name: n.full_name,
                          }),
                        }),
                      ],
                    }),
                    e.jsxs(ye, {
                      children: [
                        e.jsx(g, {
                          variant: 'outline',
                          onClick: () => p(!1),
                          disabled: D.isPending,
                          children: t('contactDirectory.form.cancel'),
                        }),
                        e.jsxs(g, {
                          variant: 'destructive',
                          onClick: M,
                          disabled: D.isPending,
                          children: [
                            D.isPending &&
                              e.jsx(B, {
                                className: `h-4 w-4 animate-spin ${d ? 'ml-2' : 'mr-2'}`,
                              }),
                            t('contactDirectory.buttons.archive'),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              }),
            ],
          }),
        })
      : e.jsx('div', {
          className: 'min-h-screen flex items-center justify-center',
          children: e.jsxs('div', {
            className: 'text-center',
            children: [
              e.jsx('h2', {
                className: 'text-xl font-semibold mb-2',
                children: t('contactDirectory.messages.noContacts'),
              }),
              e.jsxs(g, {
                onClick: A,
                variant: 'outline',
                children: [
                  e.jsx(ue, { className: `h-4 w-4 ${d ? 'ml-2' : 'mr-2'}` }),
                  t('contactDirectory.buttons.back'),
                ],
              }),
            ],
          }),
        })
}
const Ot = St
export { Ot as component }
//# sourceMappingURL=_contactId-xSFVaBA4.js.map
