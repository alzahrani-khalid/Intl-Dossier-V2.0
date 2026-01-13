import { u as R, j as e, r as u } from './react-vendor-Buoak6m3.js'
import {
  j as w,
  k as z,
  o as D,
  l as F,
  a0 as B,
  B as T,
  m as pe,
  s as I,
  Y as ge,
  I as ue,
  q as A,
  r as U,
  t as V,
  v as H,
  w as b,
  a5 as be,
  a6 as ye,
} from './index-qYY0KoZ1.js'
import {
  c5 as G,
  aT as fe,
  c0 as je,
  b6 as Ne,
  aJ as K,
  bz as ve,
  dj as we,
  aR as se,
  bm as ke,
  d_ as k,
  d$ as g,
  bL as _e,
  aH as W,
  aI as Ce,
  aM as Te,
  ci as $e,
  cc as Ee,
  e0 as te,
  e1 as ae,
  e2 as ee,
  e3 as Le,
  dH as Re,
  dI as Se,
  aS as Me,
  dJ as Fe,
  dL as Pe,
  dM as ze,
  dN as De,
  bd as Be,
  bw as Ge,
} from './vendor-misc-BiJvMP0A.js'
import { a as O, i as qe } from './tanstack-vendor-BZC-rs5U.js'
import { H as q } from './date-vendor-s0MkYge4.js'
import { u as Ae, T as Ue, g as Ve, a as He, E as Ke } from './useUnifiedTimeline-2-SmgReu.js'
function ns({
  contacts: t = [],
  isLoading: s,
  onAddContact: i,
  onEditContact: o,
  onDeleteContact: n,
}) {
  const { t: a, i18n: h } = R('dossiers')
  return s
    ? e.jsxs(w, {
        children: [
          e.jsx(z, {
            children: e.jsx(D, { className: 'text-base', children: a('keyContacts.title') }),
          }),
          e.jsx(F, {
            className: 'space-y-4',
            children: [...Array(3)].map((r, p) =>
              e.jsxs(
                'div',
                {
                  className: 'space-y-2',
                  children: [
                    e.jsx(B, { className: 'h-5 w-3/4' }),
                    e.jsx(B, { className: 'h-4 w-1/2' }),
                    e.jsx(B, { className: 'h-4 w-2/3' }),
                  ],
                },
                p,
              ),
            ),
          }),
        ],
      })
    : !t || t.length === 0
      ? e.jsxs(w, {
          children: [
            e.jsx(z, {
              children: e.jsxs('div', {
                className: 'flex items-center justify-between',
                children: [
                  e.jsx(D, { className: 'text-base', children: a('keyContacts.title') }),
                  i &&
                    e.jsxs(T, {
                      variant: 'ghost',
                      size: 'sm',
                      onClick: i,
                      className: 'h-8 gap-1',
                      'aria-label': a('actions.addContact'),
                      children: [
                        e.jsx(G, { className: 'size-4' }),
                        e.jsx('span', {
                          className: 'hidden sm:inline',
                          children: a('actions.addContact'),
                        }),
                      ],
                    }),
                ],
              }),
            }),
            e.jsx(F, {
              children: e.jsxs('div', {
                className: 'flex flex-col items-center justify-center py-8 text-center',
                children: [
                  e.jsx(fe, { className: 'mb-4 size-12 text-muted-foreground' }),
                  e.jsx('p', {
                    className: 'text-sm text-muted-foreground',
                    children: a('keyContacts.empty'),
                  }),
                  i &&
                    e.jsxs(T, {
                      variant: 'outline',
                      size: 'sm',
                      onClick: i,
                      className: 'mt-4 gap-2',
                      children: [e.jsx(G, { className: 'size-4' }), a('actions.addContact')],
                    }),
                ],
              }),
            }),
          ],
        })
      : e.jsxs(w, {
          children: [
            e.jsx(z, {
              children: e.jsxs('div', {
                className: 'flex items-center justify-between',
                children: [
                  e.jsxs(D, {
                    className: 'flex items-center gap-2 text-base',
                    children: [
                      a('keyContacts.title'),
                      e.jsx(pe, { variant: 'secondary', children: t.length }),
                    ],
                  }),
                  i &&
                    e.jsxs(T, {
                      variant: 'ghost',
                      size: 'sm',
                      onClick: i,
                      className: 'h-8 gap-1',
                      'aria-label': a('actions.addContact'),
                      children: [
                        e.jsx(G, { className: 'size-4' }),
                        e.jsx('span', {
                          className: 'hidden sm:inline',
                          children: a('actions.addContact'),
                        }),
                      ],
                    }),
                ],
              }),
            }),
            e.jsx(F, {
              children: e.jsx('ul', {
                className: 'space-y-4',
                role: 'list',
                children: t.map((r) =>
                  e.jsx(
                    'li',
                    {
                      className: 'rounded-lg border p-4 transition-colors hover:bg-muted/50',
                      role: 'listitem',
                      children: e.jsxs('div', {
                        className: 'space-y-3',
                        children: [
                          e.jsxs('div', {
                            className: 'flex items-start justify-between gap-2',
                            children: [
                              e.jsxs('div', {
                                className: 'min-w-0 flex-1',
                                children: [
                                  e.jsx('h3', {
                                    className: 'truncate text-base font-semibold leading-tight',
                                    children: r.name,
                                  }),
                                  r.role &&
                                    e.jsx('p', {
                                      className: 'truncate text-sm text-muted-foreground',
                                      children: r.role,
                                    }),
                                ],
                              }),
                              e.jsxs('div', {
                                className: 'flex shrink-0 gap-1',
                                children: [
                                  o &&
                                    e.jsx(T, {
                                      variant: 'ghost',
                                      size: 'sm',
                                      onClick: () => o(r.id),
                                      className: 'size-8 p-0',
                                      'aria-label': `${a('edit')} ${r.name}`,
                                      children: e.jsx(je, { className: 'size-4' }),
                                    }),
                                  n &&
                                    e.jsx(T, {
                                      variant: 'ghost',
                                      size: 'sm',
                                      onClick: () => n(r.id),
                                      className:
                                        'size-8 p-0 text-destructive hover:text-destructive',
                                      'aria-label': `${a('delete', { ns: 'translation' })} ${r.name}`,
                                      children: e.jsx(Ne, { className: 'size-4' }),
                                    }),
                                ],
                              }),
                            ],
                          }),
                          r.organization &&
                            e.jsxs('div', {
                              className: 'flex items-center gap-2 text-sm text-muted-foreground',
                              children: [
                                e.jsx(K, { className: 'size-4 shrink-0' }),
                                e.jsx('span', { className: 'truncate', children: r.organization }),
                              ],
                            }),
                          e.jsxs('div', {
                            className: 'space-y-2',
                            children: [
                              r.email &&
                                e.jsxs('div', {
                                  className: 'flex items-center gap-2 text-sm',
                                  children: [
                                    e.jsx(ve, {
                                      className: 'size-4 shrink-0 text-muted-foreground',
                                    }),
                                    e.jsx('a', {
                                      href: `mailto:${r.email}`,
                                      className: 'truncate text-primary hover:underline',
                                      'aria-label': `${a('keyContacts.email')}: ${r.email}`,
                                      children: r.email,
                                    }),
                                  ],
                                }),
                              r.phone &&
                                e.jsxs('div', {
                                  className: 'flex items-center gap-2 text-sm',
                                  children: [
                                    e.jsx(we, {
                                      className: 'size-4 shrink-0 text-muted-foreground',
                                    }),
                                    e.jsx('a', {
                                      href: `tel:${r.phone}`,
                                      className: 'text-primary hover:underline',
                                      'aria-label': `${a('keyContacts.phone')}: ${r.phone}`,
                                      dir: 'ltr',
                                      children: r.phone,
                                    }),
                                  ],
                                }),
                            ],
                          }),
                          r.last_interaction_date &&
                            e.jsxs('div', {
                              className:
                                'flex items-center gap-2 border-t pt-2 text-xs text-muted-foreground',
                              children: [
                                e.jsx(se, { className: 'size-3 shrink-0' }),
                                e.jsxs('span', {
                                  children: [
                                    a('keyContacts.lastInteraction'),
                                    ':',
                                    ' ',
                                    new Date(r.last_interaction_date).toLocaleDateString(
                                      h.language,
                                      { year: 'numeric', month: 'short', day: 'numeric' },
                                    ),
                                  ],
                                }),
                              ],
                            }),
                          r.notes &&
                            e.jsx('p', {
                              className:
                                'line-clamp-2 border-t pt-2 text-xs italic text-muted-foreground',
                              children: r.notes,
                            }),
                        ],
                      }),
                    },
                    r.id,
                  ),
                ),
              }),
            }),
          ],
        })
}
function We(t, s) {
  const {
    data: i,
    isLoading: o,
    error: n,
    refetch: a,
  } = O({
    queryKey: ['dossier-position-links', t, s],
    queryFn: async () => {
      let h = I.from('position_dossier_links')
        .select(
          `
          position_id,
          dossier_id,
          link_type,
          notes,
          created_at,
          created_by,
          position:positions (
            id,
            title_en,
            title_ar,
            content_en,
            content_ar,
            rationale_en,
            rationale_ar,
            alignment_notes_en,
            alignment_notes_ar,
            thematic_category,
            status,
            position_type_id,
            current_stage,
            approval_chain_config,
            consistency_score,
            author_id,
            created_at,
            updated_at,
            version
          )
        `,
        )
        .eq('dossier_id', t)
        .order('created_at', { ascending: !1 })
      s?.link_type && (h = h.eq('link_type', s.link_type))
      const { data: r, error: p, count: l } = await h
      if (p) throw new Error(p.message)
      let d = r || []
      if ((s?.status && (d = d.filter((x) => x.position?.status === s.status)), s?.search)) {
        const x = s.search.toLowerCase()
        d = d.filter((f) => {
          const y = f.position
          return y
            ? y.title_en?.toLowerCase().includes(x) ||
                y.title_ar?.toLowerCase().includes(x) ||
                y.content_en?.toLowerCase().includes(x) ||
                y.content_ar?.toLowerCase().includes(x)
            : !1
        })
      }
      const c = d.filter((x) => x.position).map((x) => ({ ...x.position, link_type: x.link_type }))
      return { links: d, positions: c, total_count: l || d.length }
    },
    staleTime: 12e4,
    enabled: !!t,
  })
  return {
    links: i?.links || [],
    positions: i?.positions || [],
    totalCount: i?.total_count || 0,
    isLoading: o,
    error: n,
    refetch: a,
  }
}
function ds({ dossierId: t }) {
  const { t: s } = R(['positions', 'common']),
    [i, o] = u.useState(''),
    [n, a] = u.useState('all'),
    [h, r] = u.useState('all'),
    [p, l] = u.useState('all'),
    [d, c] = u.useState(!1),
    x = ge(i, 300),
    {
      positions: f,
      totalCount: y,
      isLoading: j,
      error: _,
    } = We(t, { link_type: p === 'all' ? void 0 : p, status: n === 'all' ? void 0 : n, search: x }),
    $ = () => {
      c(!0)
    },
    P = () => {
      ;(o(''), a('all'), r('all'), l('all'))
    },
    S = i || n !== 'all' || h !== 'all' || p !== 'all'
  return e.jsxs('div', {
    className: 'space-y-6',
    children: [
      e.jsxs('div', {
        className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
        children: [
          e.jsxs('div', {
            className: 'space-y-1',
            children: [
              e.jsx('h2', {
                className: 'text-lg font-semibold text-gray-900 dark:text-gray-100',
                children: s('positions:dossier_tab.title'),
              }),
              e.jsx('p', {
                className: 'text-sm text-gray-500 dark:text-gray-400',
                children: s('positions:dossier_tab.subtitle', { count: y }),
              }),
            ],
          }),
          e.jsx(T, {
            onClick: $,
            className: 'w-full sm:w-auto',
            'aria-label': s('positions:dossier_tab.create_position'),
            children: s('positions:dossier_tab.create_position'),
          }),
        ],
      }),
      e.jsxs('div', {
        className:
          'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4',
        children: [
          e.jsxs('div', {
            className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
            children: [
              e.jsx('div', {
                className: 'lg:col-span-2',
                children: e.jsx(ue, {
                  type: 'search',
                  placeholder: s('positions:dossier_tab.search_placeholder'),
                  value: i,
                  onChange: (v) => o(v.target.value),
                  className: 'w-full',
                  'aria-label': s('positions:dossier_tab.search_label'),
                }),
              }),
              e.jsx('div', {
                children: e.jsxs(A, {
                  value: p,
                  onValueChange: (v) => l(v),
                  children: [
                    e.jsx(U, {
                      'aria-label': 'Filter by link type',
                      children: e.jsx(V, { placeholder: 'All Link Types' }),
                    }),
                    e.jsxs(H, {
                      children: [
                        e.jsx(b, { value: 'all', children: 'All Link Types' }),
                        e.jsx(b, { value: 'primary', children: 'Primary' }),
                        e.jsx(b, { value: 'related', children: 'Related' }),
                        e.jsx(b, { value: 'reference', children: 'Reference' }),
                      ],
                    }),
                  ],
                }),
              }),
              e.jsx('div', {
                children: e.jsxs(A, {
                  value: n,
                  onValueChange: (v) => a(v),
                  children: [
                    e.jsx(U, {
                      'aria-label': s('positions:dossier_tab.status_filter'),
                      children: e.jsx(V, { placeholder: s('positions:dossier_tab.all_statuses') }),
                    }),
                    e.jsxs(H, {
                      children: [
                        e.jsx(b, {
                          value: 'all',
                          children: s('positions:dossier_tab.all_statuses'),
                        }),
                        e.jsx(b, { value: 'draft', children: s('positions:status.draft') }),
                        e.jsx(b, { value: 'review', children: s('positions:status.review') }),
                        e.jsx(b, { value: 'approved', children: s('positions:status.approved') }),
                        e.jsx(b, { value: 'published', children: s('positions:status.published') }),
                        e.jsx(b, { value: 'archived', children: s('positions:status.archived') }),
                      ],
                    }),
                  ],
                }),
              }),
            ],
          }),
          S &&
            e.jsx('div', {
              className: 'mt-4 flex justify-end',
              children: e.jsx(T, {
                variant: 'ghost',
                size: 'sm',
                onClick: P,
                'aria-label': s('positions:dossier_tab.clear_filters'),
                children: s('common:clear_filters'),
              }),
            }),
        ],
      }),
      _
        ? e.jsx('div', {
            className:
              'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center',
            role: 'alert',
            children: e.jsx('p', {
              className: 'text-sm text-red-700 dark:text-red-300',
              children: _ instanceof Error ? _.message : s('positions:dossier_tab.error_loading'),
            }),
          })
        : e.jsx(be, {
            positions: f,
            isLoading: j,
            context: 'dossier',
            dossierId: t,
            hideFilters: !0,
            emptyMessage: s(
              S ? 'positions:dossier_tab.no_results' : 'positions:dossier_tab.no_positions',
            ),
          }),
      d && e.jsx(ye, { open: d, onClose: () => c(!1), context: 'dossier', contextId: t }),
    ],
  })
}
const Ie = 'https://zkrcjzdemdmwhearhfgg.supabase.co'
class re extends Error {
  code
  status
  details
  constructor(s, i, o, n) {
    ;(super(s),
      (this.name = 'RelationshipAPIError'),
      (this.code = o),
      (this.status = i),
      (this.details = n))
  }
}
async function Oe() {
  const {
    data: { session: t },
  } = await I.auth.getSession()
  if (!t) throw new re('Not authenticated', 401, 'AUTH_REQUIRED')
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${t.access_token}` }
}
async function Qe(t) {
  if (!t.ok) {
    let s
    try {
      s = await t.json()
    } catch {
      s = { message: t.statusText }
    }
    throw new re(s.message || 'API request failed', t.status, s.code || 'API_ERROR', s.details)
  }
  return t.json()
}
async function Je(t, s, i) {
  const o = await Oe(),
    n = new URLSearchParams(),
    a = `${Ie}/functions/v1/dossier-relationships/dossier/${t}${n.toString() ? `?${n.toString()}` : ''}`,
    h = await fetch(a, { method: 'GET', headers: o })
  return Qe(h)
}
const C = {
  all: ['relationships'],
  lists: () => [...C.all, 'list'],
  list: (t) => [...C.lists(), { filters: t }],
  details: () => [...C.all, 'detail'],
  detail: (t) => [...C.details(), t],
  forDossier: (t, s, i) => [...C.all, 'dossier', t, { page: s, page_size: i }],
  byType: (t, s, i, o) => [...C.all, 'dossier', t, 'type', s, { page: i, page_size: o }],
}
function Ye(t, s, i, o) {
  return O({ queryKey: C.forDossier(t, s, i), queryFn: () => Je(t), ...o })
}
const ie = u.memo(({ data: t }) =>
  e.jsxs('div', {
    className: 'relative group',
    children: [
      e.jsx('div', {
        className:
          'absolute -inset-3 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-3xl opacity-60 blur-xl group-hover:opacity-80 transition-opacity duration-500 animate-pulse',
      }),
      e.jsxs('div', {
        className:
          'relative w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-blue-400/50 backdrop-blur-sm overflow-hidden',
        children: [
          e.jsxs('div', {
            className:
              'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 px-6 py-4 relative',
            children: [
              e.jsx('div', {
                className: 'absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2 shadow-lg',
                children: e.jsx(_e, {
                  className: 'w-5 h-5 text-yellow-900 animate-spin',
                  style: { animationDuration: '3s' },
                }),
              }),
              e.jsxs('div', {
                className: 'flex items-center gap-3',
                children: [
                  e.jsx('div', { className: 'w-3 h-3 bg-white rounded-full animate-pulse' }),
                  e.jsxs('div', {
                    children: [
                      e.jsx('h3', {
                        className: 'text-white font-bold text-lg tracking-wide drop-shadow-lg',
                        children: t.label,
                      }),
                      e.jsx('p', {
                        className: 'text-blue-100 text-xs mt-0.5',
                        children: 'Current Dossier',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'p-5 space-y-4',
            children: [
              t.description &&
                e.jsx('p', {
                  className: 'text-gray-600 dark:text-gray-300 text-sm leading-relaxed',
                  children: t.description,
                }),
              t.stats &&
                e.jsxs('div', {
                  className: 'grid grid-cols-2 gap-3',
                  children: [
                    e.jsxs('div', {
                      className: 'bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3',
                      children: [
                        e.jsxs('div', {
                          className: 'flex items-center gap-2 mb-1',
                          children: [
                            e.jsx(W, { className: 'w-4 h-4 text-blue-600 dark:text-blue-400' }),
                            e.jsx('span', {
                              className: 'text-xs text-gray-500 dark:text-gray-400',
                              children: 'MoUs',
                            }),
                          ],
                        }),
                        e.jsx('p', {
                          className: 'text-2xl font-bold text-blue-600 dark:text-blue-400',
                          children: t.stats.mous || 0,
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3',
                      children: [
                        e.jsxs('div', {
                          className: 'flex items-center gap-2 mb-1',
                          children: [
                            e.jsx(Ce, {
                              className: 'w-4 h-4 text-purple-600 dark:text-purple-400',
                            }),
                            e.jsx('span', {
                              className: 'text-xs text-gray-500 dark:text-gray-400',
                              children: 'Positions',
                            }),
                          ],
                        }),
                        e.jsx('p', {
                          className: 'text-2xl font-bold text-purple-600 dark:text-purple-400',
                          children: t.stats.positions || 0,
                        }),
                      ],
                    }),
                  ],
                }),
              e.jsxs('div', {
                className:
                  'flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700',
                children: [
                  e.jsxs('div', {
                    className: 'flex items-center gap-2',
                    children: [
                      e.jsx('div', {
                        className:
                          'w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center',
                        children: e.jsx('span', {
                          className: 'text-white text-xs font-bold',
                          children: 'K',
                        }),
                      }),
                      e.jsx('span', {
                        className: 'text-xs text-gray-500 dark:text-gray-400',
                        children: 'View Details',
                      }),
                    ],
                  }),
                  e.jsx(Te, { className: 'w-4 h-4 text-gray-400' }),
                ],
              }),
            ],
          }),
          e.jsx(k, {
            type: 'target',
            position: g.Left,
            className: 'w-3 h-3 bg-blue-400 border-2 border-white',
          }),
          e.jsx(k, {
            type: 'source',
            position: g.Right,
            className: 'w-3 h-3 bg-blue-400 border-2 border-white',
          }),
          e.jsx(k, {
            type: 'target',
            position: g.Top,
            className: 'w-3 h-3 bg-blue-400 border-2 border-white',
          }),
          e.jsx(k, {
            type: 'source',
            position: g.Bottom,
            className: 'w-3 h-3 bg-blue-400 border-2 border-white',
          }),
        ],
      }),
    ],
  }),
)
ie.displayName = 'CenterNode'
const le = u.memo(({ data: t, isConnectable: s }) => {
  const { referenceType: i, label: o, description: n, stats: a } = t,
    r = (() => {
      switch (i) {
        case 'country':
          return {
            bgGradient: 'from-emerald-50 to-teal-50',
            darkBgGradient: 'dark:from-emerald-900/10 dark:to-teal-900/10',
            headerGradient: 'from-emerald-500 to-teal-600',
            border: 'border-emerald-200 dark:border-emerald-700',
            icon: Ee,
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            accentColor: 'text-emerald-600 dark:text-emerald-400',
            badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30',
            badgeText: 'text-emerald-700 dark:text-emerald-300',
            label: 'Country',
          }
        case 'organization':
          return {
            bgGradient: 'from-purple-50 to-violet-50',
            darkBgGradient: 'dark:from-purple-900/10 dark:to-violet-900/10',
            headerGradient: 'from-purple-500 to-violet-600',
            border: 'border-purple-200 dark:border-purple-700',
            icon: K,
            iconColor: 'text-purple-600 dark:text-purple-400',
            accentColor: 'text-purple-600 dark:text-purple-400',
            badgeBg: 'bg-purple-100 dark:bg-purple-900/30',
            badgeText: 'text-purple-700 dark:text-purple-300',
            label: 'Organization',
          }
        case 'forum':
          return {
            bgGradient: 'from-amber-50 to-orange-50',
            darkBgGradient: 'dark:from-amber-900/10 dark:to-orange-900/10',
            headerGradient: 'from-amber-500 to-orange-600',
            border: 'border-amber-200 dark:border-amber-700',
            icon: $e,
            iconColor: 'text-amber-600 dark:text-amber-400',
            accentColor: 'text-amber-600 dark:text-amber-400',
            badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
            badgeText: 'text-amber-700 dark:text-amber-300',
            label: 'Forum',
          }
        default:
          return {
            bgGradient: 'from-gray-50 to-slate-50',
            darkBgGradient: 'dark:from-gray-900/10 dark:to-slate-900/10',
            headerGradient: 'from-gray-500 to-slate-600',
            border: 'border-gray-200 dark:border-gray-700',
            icon: K,
            iconColor: 'text-gray-600 dark:text-gray-400',
            accentColor: 'text-gray-600 dark:text-gray-400',
            badgeBg: 'bg-gray-100 dark:bg-gray-900/30',
            badgeText: 'text-gray-700 dark:text-gray-300',
            label: 'Entity',
          }
      }
    })(),
    p = r.icon
  return e.jsxs('div', {
    className: 'relative group',
    children: [
      e.jsx('div', {
        className: `absolute -inset-2 bg-gradient-${r.headerGradient} rounded-2xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300`,
      }),
      e.jsxs('div', {
        className: `relative w-72 bg-gradient-to-br ${r.bgGradient} ${r.darkBgGradient} rounded-xl shadow-lg border-2 ${r.border} transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl cursor-pointer overflow-hidden`,
        children: [
          e.jsxs('div', {
            className:
              'flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700',
            children: [
              e.jsx('div', {
                className: 'p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm',
                children: e.jsx(p, { className: `w-5 h-5 ${r.iconColor}` }),
              }),
              e.jsxs('div', {
                className: 'flex-1 min-w-0',
                children: [
                  e.jsx('h4', {
                    className: 'font-semibold text-gray-900 dark:text-white text-sm truncate',
                    children: o,
                  }),
                  e.jsx('span', {
                    className: `text-xs ${r.badgeBg} ${r.badgeText} px-2 py-0.5 rounded-full`,
                    children: r.label,
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'p-4 space-y-3',
            children: [
              n &&
                e.jsx('p', {
                  className:
                    'text-gray-600 dark:text-gray-300 text-xs leading-relaxed line-clamp-2',
                  children: n,
                }),
              a &&
                e.jsxs('div', {
                  className: 'flex gap-2',
                  children: [
                    a.mous !== void 0 &&
                      e.jsxs('div', {
                        className: 'flex-1 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm',
                        children: [
                          e.jsx('p', {
                            className: 'text-xs text-gray-500 dark:text-gray-400',
                            children: 'MoUs',
                          }),
                          e.jsx('p', {
                            className: `text-lg font-bold ${r.accentColor}`,
                            children: a.mous,
                          }),
                        ],
                      }),
                    a.engagements !== void 0 &&
                      e.jsxs('div', {
                        className: 'flex-1 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm',
                        children: [
                          e.jsx('p', {
                            className: 'text-xs text-gray-500 dark:text-gray-400',
                            children: 'Engage',
                          }),
                          e.jsx('p', {
                            className: `text-lg font-bold ${r.accentColor}`,
                            children: a.engagements,
                          }),
                        ],
                      }),
                  ],
                }),
              a?.health_score !== void 0 &&
                e.jsxs('div', {
                  className: 'flex items-center gap-2',
                  children: [
                    e.jsx(ke, { className: `w-4 h-4 ${r.iconColor}` }),
                    e.jsx('div', {
                      className:
                        'flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
                      children: e.jsx('div', {
                        className: `h-full bg-gradient-to-r ${r.headerGradient} rounded-full transition-all duration-500`,
                        style: { width: `${a.health_score}%` },
                      }),
                    }),
                    e.jsxs('span', {
                      className: 'text-xs text-gray-500 dark:text-gray-400',
                      children: [a.health_score, '%'],
                    }),
                  ],
                }),
            ],
          }),
          e.jsxs('div', {
            className:
              'px-4 py-2 bg-white/50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-1',
                children: [
                  e.jsx('div', {
                    className:
                      'w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center',
                    children: e.jsx('span', {
                      className: 'text-white text-[10px] font-bold',
                      children: 'A',
                    }),
                  }),
                  e.jsx('div', {
                    className:
                      'w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center -ml-1',
                    children: e.jsx('span', {
                      className: 'text-white text-[10px] font-bold',
                      children: 'B',
                    }),
                  }),
                ],
              }),
              e.jsx('button', {
                className:
                  'px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-md transition-colors duration-200',
                children: 'View',
              }),
            ],
          }),
          e.jsx('div', {
            className:
              'absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none',
          }),
          e.jsx(k, {
            type: 'target',
            position: g.Left,
            isConnectable: s,
            className:
              'w-2.5 h-2.5 bg-white border-2 border-current opacity-0 group-hover:opacity-100 transition-opacity',
          }),
          e.jsx(k, {
            type: 'source',
            position: g.Right,
            isConnectable: s,
            className:
              'w-2.5 h-2.5 bg-white border-2 border-current opacity-0 group-hover:opacity-100 transition-opacity',
          }),
          e.jsx(k, {
            type: 'target',
            position: g.Top,
            isConnectable: s,
            className:
              'w-2.5 h-2.5 bg-white border-2 border-current opacity-0 group-hover:opacity-100 transition-opacity',
          }),
          e.jsx(k, {
            type: 'source',
            position: g.Bottom,
            isConnectable: s,
            className:
              'w-2.5 h-2.5 bg-white border-2 border-current opacity-0 group-hover:opacity-100 transition-opacity',
          }),
        ],
      }),
    ],
  })
})
le.displayName = 'RelatedNode'
const oe = u.memo(
  ({
    id: t,
    sourceX: s,
    sourceY: i,
    targetX: o,
    targetY: n,
    sourcePosition: a,
    targetPosition: h,
    data: r,
    markerEnd: p,
  }) => {
    const [l, d, c] = te({
        sourceX: s,
        sourceY: i,
        sourcePosition: a,
        targetX: o,
        targetY: n,
        targetPosition: h,
      }),
      { label: x, strength: f = 'secondary' } = r || {},
      j = (() => {
        switch (f) {
          case 'primary':
            return {
              stroke: 'hsl(var(--success))',
              strokeWidth: 3,
              impactLabel: 'High Impact',
              impactBg: 'bg-success',
              impactText: 'text-success-foreground',
              dotColor: 'hsl(var(--success))',
            }
          case 'secondary':
            return {
              stroke: 'hsl(var(--warning))',
              strokeWidth: 2.5,
              impactLabel: 'Medium Impact',
              impactBg: 'bg-warning',
              impactText: 'text-warning-foreground',
              dotColor: 'hsl(var(--warning))',
            }
          case 'observer':
            return {
              stroke: 'hsl(var(--muted-foreground))',
              strokeWidth: 2,
              impactLabel: 'Low Impact',
              impactBg: 'bg-muted',
              impactText: 'text-muted-foreground',
              dotColor: 'hsl(var(--muted-foreground))',
            }
          default:
            return {
              stroke: 'hsl(var(--muted-foreground))',
              strokeWidth: 2,
              impactLabel: 'Impact',
              impactBg: 'bg-muted',
              impactText: 'text-muted-foreground',
              dotColor: 'hsl(var(--muted-foreground))',
            }
        }
      })()
    return e.jsxs(e.Fragment, {
      children: [
        e.jsx(ae, {
          id: t,
          path: l,
          markerEnd: p,
          style: {
            stroke: j.stroke,
            strokeWidth: j.strokeWidth,
            strokeDasharray: '8 6',
            opacity: 0.7,
          },
        }),
        e.jsx(ee, {
          children: e.jsx('div', {
            style: {
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${d}px,${c}px)`,
              pointerEvents: 'all',
            },
            className: 'nodrag nopan',
            children: e.jsx('div', {
              className: `${j.impactBg} ${j.impactText} px-3 py-1.5 rounded-full shadow-lg text-xs font-semibold whitespace-nowrap`,
              children: j.impactLabel,
            }),
          }),
        }),
        x &&
          e.jsx(ee, {
            children: e.jsx('div', {
              style: {
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${d}px,${c - 35}px)`,
                pointerEvents: 'all',
              },
              className: 'nodrag nopan',
              children: e.jsx('div', {
                className: 'bg-card border-2 border-border px-2.5 py-1 rounded-md shadow-md',
                children: e.jsx('span', {
                  className: 'text-xs font-medium text-card-foreground whitespace-nowrap',
                  children: x,
                }),
              }),
            }),
          }),
      ],
    })
  },
)
oe.displayName = 'CustomEdge'
const Ze = u.memo(
  ({
    id: t,
    sourceX: s,
    sourceY: i,
    targetX: o,
    targetY: n,
    sourcePosition: a,
    targetPosition: h,
    data: r,
    markerEnd: p,
  }) => {
    const [l] = te({
        sourceX: s,
        sourceY: i,
        sourcePosition: a,
        targetX: o,
        targetY: n,
        targetPosition: h,
      }),
      { strength: d = 'secondary' } = r || {},
      c =
        d === 'primary'
          ? 'hsl(var(--success))'
          : d === 'secondary'
            ? 'hsl(var(--warning))'
            : 'hsl(var(--muted-foreground))',
      x = d === 'primary' ? 3 : d === 'secondary' ? 2.5 : 2
    return e.jsx(ae, {
      id: t,
      path: l,
      markerEnd: p,
      style: { stroke: c, strokeWidth: x, strokeDasharray: '8 6', opacity: 0.7 },
    })
  },
)
Ze.displayName = 'SimpleCustomEdge'
const Xe = { centerNode: ie, relatedNode: le },
  es = { customEdge: oe }
function cs({ dossierId: t, dossierName: s = 'Current Dossier' }) {
  const { t: i, i18n: o } = R('dossiers'),
    n = qe(),
    a = o.language === 'ar',
    [h, r] = u.useState(void 0),
    { data: p, isLoading: l, error: d } = Ye(t),
    c = p?.relationships || [],
    { nodes: x, edges: f } = u.useMemo(() => {
      if (!c || c.length === 0) return { nodes: [], edges: [] }
      const N = [],
        E = [],
        L = new Map()
      ;(N.push({
        id: t,
        type: 'centerNode',
        data: {
          label: s,
          isCenter: !0,
          description: 'Central hub for bilateral and multilateral relationships',
          stats: { mous: 12, positions: 8, engagements: 24, health_score: 85 },
        },
        position: { x: 600, y: 400 },
        sourcePosition: a ? g.Left : g.Right,
        targetPosition: a ? g.Right : g.Left,
      }),
        L.set(t, !0))
      const J = 500,
        me = (2 * Math.PI) / c.length
      return (
        c.forEach((m, he) => {
          const Y = he * me,
            M = 600 + J * Math.cos(Y),
            Z = 400 + J * Math.sin(Y),
            X = {
              mous: Math.floor(Math.random() * 10) + 1,
              engagements: Math.floor(Math.random() * 15) + 5,
              health_score: Math.floor(Math.random() * 30) + 60,
            }
          ;(m.target_dossier &&
            m.target_dossier.id !== t &&
            !L.has(m.target_dossier.id) &&
            (N.push({
              id: m.target_dossier.id,
              type: 'relatedNode',
              data: {
                label: a ? m.target_dossier.name_ar : m.target_dossier.name_en,
                referenceType: m.target_dossier.type,
                description: `Key ${m.target_dossier.type} partner with active collaboration`,
                stats: X,
              },
              position: { x: a ? 1200 - M : M, y: Z },
              sourcePosition: a ? g.Left : g.Right,
              targetPosition: a ? g.Right : g.Left,
            }),
            L.set(m.target_dossier.id, !0)),
            m.source_dossier &&
              m.source_dossier.id !== t &&
              !L.has(m.source_dossier.id) &&
              (N.push({
                id: m.source_dossier.id,
                type: 'relatedNode',
                data: {
                  label: a ? m.source_dossier.name_ar : m.source_dossier.name_en,
                  referenceType: m.source_dossier.type,
                  description: `Key ${m.source_dossier.type} partner with active collaboration`,
                  stats: X,
                },
                position: { x: a ? 1200 - M : M, y: Z },
                sourcePosition: a ? g.Left : g.Right,
                targetPosition: a ? g.Right : g.Left,
              }),
              L.set(m.source_dossier.id, !0)),
            E.push({
              id: `${m.source_dossier_id}-${m.target_dossier_id}-${m.relationship_type}`,
              source: m.source_dossier_id,
              target: m.target_dossier_id,
              type: 'customEdge',
              data: {
                label: i(`relationships.types.${m.relationship_type}`) || m.relationship_type,
                strength: 'primary',
              },
              markerEnd: { type: Le.ArrowClosed, color: '#3b82f6', width: 20, height: 20 },
            }))
        }),
        { nodes: N, edges: E }
      )
    }, [c, t, s, a]),
    [y, j, _] = Re(x),
    [$, P, S] = Se(f),
    [v, ne] = u.useState(null),
    Q = u.useRef(-1)
  ;(u.useEffect(() => {
    Q.current !== c.length && (j(x), P(f), (Q.current = c.length))
  }, [c.length, x, f]),
    u.useEffect(() => {
      v &&
        x.length > 0 &&
        setTimeout(() => {
          v.fitView({ padding: 0.2, includeHiddenNodes: !1, duration: 400 })
        }, 100)
    }, [v, x.length]))
  const de = u.useMemo(() => `${t}-${c.length}-${h || 'all'}-${a}`, [t, c.length, h, a]),
    ce = u.useCallback(
      (N, E) => {
        E.id !== t && n({ to: `/dossiers/${E.id}` })
      },
      [t, n],
    ),
    xe = u.useCallback((N) => {
      ne(N)
    }, [])
  return l
    ? e.jsx(w, {
        className: 'p-12 text-center',
        children: e.jsxs('div', {
          className: 'flex flex-col items-center gap-4',
          children: [
            e.jsx(Me, { className: 'h-10 w-10 animate-spin text-primary' }),
            e.jsx('p', {
              className: 'text-muted-foreground animate-pulse',
              children: i('loading'),
            }),
          ],
        }),
      })
    : d
      ? e.jsx(w, {
          className: 'p-12 text-center bg-destructive/10 border-destructive/20',
          children: e.jsxs('div', {
            className: 'flex flex-col items-center gap-3',
            children: [
              e.jsx('div', {
                className:
                  'h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center',
                children: e.jsx('span', { className: 'text-2xl', children: '⚠️' }),
              }),
              e.jsx('p', {
                className: 'text-destructive font-medium',
                children: i('relationships.errors.loadFailed'),
              }),
            ],
          }),
        })
      : c.length
        ? e.jsxs('div', {
            className: 'flex flex-col gap-4 sm:gap-6',
            dir: a ? 'rtl' : 'ltr',
            children: [
              e.jsx(w, {
                className: 'p-4 sm:p-6 bg-accent/10 border-accent/20',
                children: e.jsxs('div', {
                  className: 'flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center',
                  children: [
                    e.jsx('label', {
                      className: 'text-sm font-semibold text-foreground min-w-fit',
                      children: i('relationships.filter_by_type'),
                    }),
                    e.jsxs(A, {
                      value: h,
                      onValueChange: (N) => r(N === 'all' ? void 0 : N),
                      children: [
                        e.jsx(U, {
                          className:
                            'w-full sm:w-72 bg-card border-border focus:ring-2 focus:ring-ring',
                          children: e.jsx(V, { placeholder: i('relationships.all_types') }),
                        }),
                        e.jsxs(H, {
                          children: [
                            e.jsx(b, { value: 'all', children: i('relationships.all_types') }),
                            e.jsx(b, {
                              value: 'member_of',
                              children: i('relationships.types.member_of'),
                            }),
                            e.jsx(b, {
                              value: 'participates_in',
                              children: i('relationships.types.participates_in'),
                            }),
                            e.jsx(b, {
                              value: 'collaborates_with',
                              children: i('relationships.types.collaborates_with'),
                            }),
                            e.jsx(b, {
                              value: 'monitors',
                              children: i('relationships.types.monitors'),
                            }),
                            e.jsx(b, {
                              value: 'is_member',
                              children: i('relationships.types.is_member'),
                            }),
                            e.jsx(b, { value: 'hosts', children: i('relationships.types.hosts') }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              }),
              e.jsx(w, {
                className:
                  'h-[700px] sm:h-[800px] md:h-[900px] overflow-hidden shadow-xl border-2 border-border',
                children: e.jsxs(
                  Fe,
                  {
                    nodes: y,
                    edges: $,
                    onNodesChange: _,
                    onEdgesChange: S,
                    onNodeClick: ce,
                    onInit: xe,
                    nodeTypes: Xe,
                    edgeTypes: es,
                    fitView: !0,
                    fitViewOptions: { padding: 0.2, includeHiddenNodes: !1 },
                    attributionPosition: a ? 'bottom-left' : 'bottom-right',
                    minZoom: 0.1,
                    maxZoom: 1,
                    defaultEdgeOptions: { animated: !1 },
                    proOptions: { hideAttribution: !0 },
                    children: [
                      e.jsx(Pe, {
                        variant: ze.Dots,
                        gap: 20,
                        size: 1.5,
                        color: 'hsl(var(--border))',
                        className: 'bg-background',
                      }),
                      e.jsx(De, {
                        className:
                          'bg-card/90 backdrop-blur-sm shadow-xl border-2 border-border rounded-xl',
                        showInteractive: !1,
                      }),
                    ],
                  },
                  de,
                ),
              }),
            ],
          })
        : e.jsx(w, {
            className: 'p-12 text-center bg-muted/30',
            children: e.jsxs('div', {
              className: 'flex flex-col items-center gap-3',
              children: [
                e.jsx('div', {
                  className: 'h-16 w-16 rounded-full bg-muted flex items-center justify-center',
                  children: e.jsx('span', { className: 'text-3xl', children: '🔗' }),
                }),
                e.jsx('p', {
                  className: 'text-muted-foreground text-lg',
                  children: i('relationships.no_relationships'),
                }),
              ],
            }),
          })
}
function xs({ dossierId: t }) {
  const { t: s, i18n: i } = R('dossiers'),
    o = i.language === 'ar',
    {
      data: n,
      isLoading: a,
      error: h,
    } = O({
      queryKey: ['dossier-mous', t],
      queryFn: async () => {
        const { data: l, error: d } = await I.from('mous')
          .select('*')
          .or(`signatory_1_dossier_id.eq.${t},signatory_2_dossier_id.eq.${t}`)
          .order('created_at', { ascending: !1 })
        if (d) throw d
        return l
      },
    }),
    r = (l) => {
      switch (l) {
        case 'active':
          return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
        case 'draft':
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
        case 'expired':
          return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        case 'cancelled':
          return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
        case 'renewed':
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
      }
    },
    p = (l) => {
      const d = l.dates?.renewal_required
      if (!d || l.lifecycle_state !== 'active') return !1
      const c = Math.floor((new Date(d).getTime() - new Date().getTime()) / (1e3 * 60 * 60 * 24))
      return c <= 90 && c > 0
    }
  return a
    ? e.jsx('div', {
        className: 'space-y-4',
        children: [1, 2, 3].map((l) =>
          e.jsx(
            'div',
            { className: 'h-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse' },
            l,
          ),
        ),
      })
    : h
      ? e.jsxs('div', {
          className:
            'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center',
          role: 'alert',
          children: [
            e.jsx('p', {
              className: 'text-red-800 dark:text-red-200',
              children: s('mous.error_loading'),
            }),
            e.jsx('p', {
              className: 'mt-2 text-sm text-red-700 dark:text-red-300',
              children: h instanceof Error ? h.message : s('mous.error_generic'),
            }),
          ],
        })
      : !n || n.length === 0
        ? e.jsxs('div', {
            className: 'text-center py-12',
            children: [
              e.jsx(W, { className: 'mx-auto h-12 w-12 text-gray-400 dark:text-gray-600' }),
              e.jsx('h3', {
                className: 'mt-2 text-sm font-medium text-gray-900 dark:text-white',
                children: s('mous.no_mous'),
              }),
              e.jsx('p', {
                className: 'mt-1 text-sm text-gray-500 dark:text-gray-400',
                children: s('mous.no_mous_description'),
              }),
            ],
          })
        : e.jsx('div', {
            className: 'space-y-4',
            children: n.map((l) =>
              e.jsx(
                w,
                {
                  className: 'cursor-pointer hover:shadow-lg transition-shadow duration-200',
                  onClick: () => {},
                  children: e.jsx(F, {
                    className: 'p-4 sm:p-6',
                    children: e.jsxs('div', {
                      className:
                        'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4',
                      children: [
                        e.jsxs('div', {
                          className: 'flex-1 min-w-0',
                          children: [
                            e.jsx('h4', {
                              className: `text-base sm:text-lg font-medium text-gray-900 dark:text-white truncate ${o ? 'text-end' : 'text-start'}`,
                              children: o ? l.title_ar : l.title,
                            }),
                            l.description &&
                              e.jsx('p', {
                                className: `mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 ${o ? 'text-end' : 'text-start'}`,
                                children: l.description,
                              }),
                            e.jsxs('div', {
                              className:
                                'mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400',
                              children: [
                                l.dates?.signed &&
                                  e.jsxs('div', {
                                    className: 'flex items-center gap-1',
                                    children: [
                                      e.jsx(W, { className: 'h-4 w-4' }),
                                      e.jsxs('span', {
                                        children: [
                                          s('mous.signed'),
                                          ': ',
                                          q(new Date(l.dates.signed), 'dd MMM yyyy'),
                                        ],
                                      }),
                                    ],
                                  }),
                                (l.expiry_date || l.dates?.expiry) &&
                                  e.jsxs('div', {
                                    className: 'flex items-center gap-1',
                                    children: [
                                      e.jsx(Be, { className: 'h-4 w-4' }),
                                      e.jsxs('span', {
                                        children: [
                                          s('mous.expires'),
                                          ': ',
                                          q(
                                            new Date(l.expiry_date || l.dates?.expiry),
                                            'dd MMM yyyy',
                                          ),
                                        ],
                                      }),
                                    ],
                                  }),
                                (l.effective_date || l.dates?.effective) &&
                                  e.jsxs('div', {
                                    className: 'flex items-center gap-1',
                                    children: [
                                      e.jsx(se, { className: 'h-4 w-4' }),
                                      e.jsxs('span', {
                                        children: [
                                          s('mous.effective'),
                                          ': ',
                                          q(
                                            new Date(l.effective_date || l.dates?.effective),
                                            'dd MMM yyyy',
                                          ),
                                        ],
                                      }),
                                    ],
                                  }),
                              ],
                            }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'flex flex-col gap-2 items-start sm:items-end',
                          children: [
                            e.jsx('span', {
                              className: `inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${r(l.lifecycle_state)}`,
                              children: s(`mous.status.${l.lifecycle_state}`),
                            }),
                            p(l) &&
                              e.jsxs('div', {
                                className:
                                  'flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-sm',
                                children: [
                                  e.jsx(Ge, { className: 'h-4 w-4' }),
                                  e.jsx('span', { children: s('mous.renewal_required') }),
                                ],
                              }),
                          ],
                        }),
                      ],
                    }),
                  }),
                },
                l.id,
              ),
            ),
          })
}
function ms({ dossierId: t, className: s }) {
  const { t: i } = R('dossier'),
    [o, n] = u.useState(!1),
    a = Ve('Country'),
    h = He('Country'),
    {
      events: r,
      isLoading: p,
      isFetchingNextPage: l,
      hasNextPage: d,
      error: c,
      fetchNextPage: x,
      refetch: f,
      filters: y,
      setFilters: j,
    } = Ae({
      dossierId: t,
      dossierType: 'Country',
      initialFilters: { event_types: a },
      itemsPerPage: 20,
      enableRealtime: !1,
    }),
    _ = ($) => {
      j($)
    }
  return e.jsxs('div', {
    className: s,
    children: [
      e.jsx(Ue, {
        filters: y,
        onFiltersChange: _,
        availableEventTypes: h,
        defaultEventTypes: a,
        showFilters: o,
        onToggleFilters: () => n(!o),
        onRefresh: f,
      }),
      e.jsx(Ke, {
        events: r,
        isLoading: p,
        isFetchingNextPage: l,
        hasNextPage: d,
        onLoadMore: x,
        error: c,
        emptyMessage: i('timeline.empty.country'),
      }),
    ],
  })
}
export { ms as C, ds as D, ns as K, cs as R, xs as a }
//# sourceMappingURL=CountryTimeline-ChW1wm5i.js.map
