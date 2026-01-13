import { u as L, r as g, j as e } from './react-vendor-Buoak6m3.js'
import { a as P, i as G } from './tanstack-vendor-BZC-rs5U.js'
import {
  I as J,
  B as D,
  S as Q,
  d as X,
  e as Y,
  f as W,
  g as Z,
  h as ee,
  m as _,
  q as T,
  r as z,
  t as E,
  v as $,
  w as N,
  j as se,
  k as te,
  l as ae,
  s as I,
  D as re,
  x as ce,
  y as ne,
  z as R,
  ab as le,
} from './index-qYY0KoZ1.js'
import {
  aE as oe,
  cV as ie,
  b8 as de,
  aD as O,
  bC as xe,
  aJ as me,
  ca as he,
  bz as pe,
  dj as ue,
  cR as je,
  b7 as ye,
  aS as fe,
  aI as ge,
  bP as Ne,
  aH as ve,
  dk as be,
  aG as M,
  b9 as we,
} from './vendor-misc-BiJvMP0A.js'
import { u as De } from './useContactRelationships-VllNTxgh.js'
import { d as _e, g as Ce } from './useDossier-CiPcwRKl.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function Se({
  onSearch: s,
  organizations: n = [],
  tags: t = [],
  defaultParams: r,
  isLoading: h = !1,
}) {
  const { t: l, i18n: j } = L('contacts'),
    a = j.language === 'ar',
    [f, p] = g.useState(r?.search || ''),
    [x, d] = g.useState(r?.organization_id || ''),
    [u, m] = g.useState(r?.tags || []),
    [v, i] = g.useState(r?.source_type || ''),
    [c, b] = g.useState(r?.sort_by || 'full_name'),
    [o, w] = g.useState(r?.sort_order || 'asc'),
    [k, B] = g.useState(r?.include_archived || !1),
    F = () => {
      const y = {
        search: f || void 0,
        organization_id: x || void 0,
        tags: u.length > 0 ? u : void 0,
        source_type: v || void 0,
        sort_by: c,
        sort_order: o,
        include_archived: k,
      }
      s(y)
    },
    U = () => {
      ;(p(''), d(''), m([]), i(''), b('full_name'), w('asc'), B(!1), s({}))
    },
    V = (y) => {
      m((C) => (C.includes(y) ? C.filter((A) => A !== y) : [...C, y]))
    },
    K = f || x || u.length > 0 || v || c !== 'full_name' || o !== 'asc' || k
  return e.jsxs('div', {
    className: 'space-y-4',
    dir: a ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'flex gap-2',
        children: [
          e.jsxs('div', {
            className: 'relative flex-1',
            children: [
              e.jsx(oe, {
                className: `absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${a ? 'right-3' : 'left-3'}`,
              }),
              e.jsx(J, {
                type: 'search',
                placeholder: l('contactDirectory.placeholders.searchContacts'),
                value: f,
                onChange: (y) => p(y.target.value),
                onKeyDown: (y) => y.key === 'Enter' && F(),
                className: `h-11 ${a ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-base sm:h-10`,
                dir: a ? 'rtl' : 'ltr',
              }),
            ],
          }),
          e.jsx(D, {
            onClick: F,
            disabled: h,
            className: 'h-11 px-6 sm:h-10',
            children: l('contactDirectory.search.search'),
          }),
          e.jsxs(Q, {
            children: [
              e.jsx(X, {
                asChild: !0,
                children: e.jsx(D, {
                  variant: 'outline',
                  size: 'icon',
                  className: 'h-11 w-11 sm:h-10 sm:w-10 md:hidden',
                  children: e.jsx(ie, { className: 'h-4 w-4' }),
                }),
              }),
              e.jsxs(Y, {
                side: a ? 'left' : 'right',
                className: 'w-full sm:max-w-md',
                children: [
                  e.jsxs(W, {
                    children: [
                      e.jsx(Z, { children: l('contactDirectory.search.filters') }),
                      e.jsx(ee, { children: l('contactDirectory.search.refine_search') }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'mt-6 space-y-4',
                    children: [
                      e.jsx(q, {
                        organizations: n,
                        tags: t,
                        organizationId: x,
                        setOrganizationId: d,
                        selectedTags: u,
                        toggleTag: V,
                        sourceType: v,
                        setSourceType: i,
                        sortBy: c,
                        setSortBy: b,
                        sortOrder: o,
                        setSortOrder: w,
                        includeArchived: k,
                        setIncludeArchived: B,
                        isRTL: a,
                        t: l,
                      }),
                      e.jsxs('div', {
                        className: 'flex gap-2 pt-4',
                        children: [
                          e.jsx(D, {
                            onClick: F,
                            className: 'flex-1',
                            children: l('contactDirectory.search.apply_filters'),
                          }),
                          e.jsx(D, {
                            onClick: U,
                            variant: 'outline',
                            className: 'flex-1',
                            children: l('contactDirectory.search.reset'),
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
      e.jsx('div', {
        className: 'hidden md:block space-y-4',
        children: e.jsx(q, {
          organizations: n,
          tags: t,
          organizationId: x,
          setOrganizationId: d,
          selectedTags: u,
          toggleTag: V,
          sourceType: v,
          setSourceType: i,
          sortBy: c,
          setSortBy: b,
          sortOrder: o,
          setSortOrder: w,
          includeArchived: k,
          setIncludeArchived: B,
          isRTL: a,
          t: l,
        }),
      }),
      K &&
        e.jsxs('div', {
          className: 'flex flex-wrap items-center gap-2 text-sm',
          children: [
            e.jsx(de, { className: 'h-4 w-4 text-muted-foreground' }),
            u.map((y) => {
              const C = t.find((A) => A.id === y)
              return C
                ? e.jsxs(
                    _,
                    {
                      variant: 'secondary',
                      className: 'gap-1',
                      children: [
                        C.name,
                        e.jsx(O, { className: 'h-3 w-3 cursor-pointer', onClick: () => V(y) }),
                      ],
                    },
                    y,
                  )
                : null
            }),
            x &&
              e.jsxs(_, {
                variant: 'secondary',
                className: 'gap-1',
                children: [
                  n.find((y) => y.id === x)?.name,
                  e.jsx(O, { className: 'h-3 w-3 cursor-pointer', onClick: () => d('') }),
                ],
              }),
            v &&
              e.jsxs(_, {
                variant: 'secondary',
                className: 'gap-1',
                children: [
                  l(`contactDirectory.sourceTypes.${v}`),
                  e.jsx(O, { className: 'h-3 w-3 cursor-pointer', onClick: () => i('') }),
                ],
              }),
            e.jsx(D, {
              variant: 'ghost',
              size: 'sm',
              onClick: U,
              className: 'h-7 text-xs',
              children: l('contactDirectory.search.clear_all'),
            }),
          ],
        }),
    ],
  })
}
function q({
  organizations: s,
  tags: n,
  organizationId: t,
  setOrganizationId: r,
  selectedTags: h,
  toggleTag: l,
  sourceType: j,
  setSourceType: a,
  sortBy: f,
  setSortBy: p,
  sortOrder: x,
  setSortOrder: d,
  includeArchived: u,
  setIncludeArchived: m,
  isRTL: v,
  t: i,
}) {
  return e.jsxs(e.Fragment, {
    children: [
      s.length > 0 &&
        e.jsxs('div', {
          className: 'space-y-2',
          children: [
            e.jsx('label', {
              className: 'text-sm font-medium',
              children: i('contactDirectory.search.filter_by_organization'),
            }),
            e.jsxs(T, {
              value: t || 'all',
              onValueChange: (c) => r(c === 'all' ? '' : c),
              children: [
                e.jsx(z, {
                  className: 'h-10',
                  children: e.jsx(E, {
                    placeholder: i('contactDirectory.search.all_organizations'),
                  }),
                }),
                e.jsxs($, {
                  children: [
                    e.jsx(N, {
                      value: 'all',
                      children: i('contactDirectory.search.all_organizations'),
                    }),
                    s.map((c) => e.jsx(N, { value: c.id, children: c.name }, c.id)),
                  ],
                }),
              ],
            }),
          ],
        }),
      n.length > 0 &&
        e.jsxs('div', {
          className: 'space-y-2',
          children: [
            e.jsx('label', {
              className: 'text-sm font-medium',
              children: i('contactDirectory.search.filter_by_tags'),
            }),
            e.jsx('div', {
              className: 'flex flex-wrap gap-2',
              children: n.map((c) => {
                const b = h.includes(c.id)
                return e.jsx(
                  _,
                  {
                    variant: b ? 'default' : 'outline',
                    className: 'cursor-pointer px-3 py-1.5 text-sm',
                    onClick: () => l(c.id),
                    style:
                      b && c.color ? { backgroundColor: c.color, borderColor: c.color } : void 0,
                    children: c.name,
                  },
                  c.id,
                )
              }),
            }),
          ],
        }),
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx('label', {
            className: 'text-sm font-medium',
            children: i('contactDirectory.search.filter_by_source'),
          }),
          e.jsxs(T, {
            value: j || 'all',
            onValueChange: (c) => a(c === 'all' ? '' : c),
            children: [
              e.jsx(z, {
                className: 'h-10',
                children: e.jsx(E, { placeholder: i('contactDirectory.search.all_sources') }),
              }),
              e.jsxs($, {
                children: [
                  e.jsx(N, { value: 'all', children: i('contactDirectory.search.all_sources') }),
                  e.jsx(N, { value: 'manual', children: i('contactDirectory.sourceTypes.manual') }),
                  e.jsx(N, {
                    value: 'business_card',
                    children: i('contactDirectory.sourceTypes.businessCard'),
                  }),
                  e.jsx(N, {
                    value: 'document',
                    children: i('contactDirectory.sourceTypes.document'),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'grid grid-cols-2 gap-3',
        children: [
          e.jsxs('div', {
            className: 'space-y-2',
            children: [
              e.jsx('label', {
                className: 'text-sm font-medium',
                children: i('contactDirectory.search.sort_by'),
              }),
              e.jsxs(T, {
                value: f,
                onValueChange: p,
                children: [
                  e.jsx(z, { className: 'h-10', children: e.jsx(E, {}) }),
                  e.jsxs($, {
                    children: [
                      e.jsx(N, {
                        value: 'full_name',
                        children: i('contactDirectory.search.sort_name'),
                      }),
                      e.jsx(N, {
                        value: 'created_at',
                        children: i('contactDirectory.search.sort_created'),
                      }),
                      e.jsx(N, {
                        value: 'updated_at',
                        children: i('contactDirectory.search.sort_updated'),
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
              e.jsx('label', {
                className: 'text-sm font-medium',
                children: i('contactDirectory.search.order'),
              }),
              e.jsxs(T, {
                value: x,
                onValueChange: d,
                children: [
                  e.jsx(z, { className: 'h-10', children: e.jsx(E, {}) }),
                  e.jsxs($, {
                    children: [
                      e.jsx(N, { value: 'asc', children: i('contactDirectory.search.ascending') }),
                      e.jsx(N, {
                        value: 'desc',
                        children: i('contactDirectory.search.descending'),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'flex items-center gap-2',
        children: [
          e.jsx('input', {
            type: 'checkbox',
            id: 'include-archived',
            checked: u,
            onChange: (c) => m(c.target.checked),
            className: 'h-4 w-4 rounded border-gray-300',
          }),
          e.jsx('label', {
            htmlFor: 'include-archived',
            className: 'text-sm',
            children: i('contactDirectory.search.include_archived'),
          }),
        ],
      }),
    ],
  })
}
function ke({ contact: s, tags: n = [], onClick: t, className: r = '' }) {
  const { t: h, i18n: l } = L('contacts'),
    j = l.language === 'ar',
    { data: a } = De(s.id),
    f = s.email_addresses?.[0],
    p = s.phone_numbers?.[0],
    x = n.filter((d) => s.tags?.includes(d.id))
  return e.jsxs(se, {
    className: `cursor-pointer transition-shadow hover:shadow-md ${r}`,
    onClick: t,
    dir: j ? 'rtl' : 'ltr',
    children: [
      e.jsx(te, {
        className: 'pb-3',
        children: e.jsxs('div', {
          className: 'flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between',
          children: [
            e.jsxs('div', {
              className: 'flex-1 min-w-0',
              children: [
                e.jsx('h3', {
                  className: 'text-lg font-semibold truncate text-start',
                  children: s.full_name,
                }),
                s.position &&
                  e.jsxs('div', {
                    className: 'flex items-center gap-2 mt-1 text-sm text-muted-foreground',
                    children: [
                      e.jsx(xe, { className: 'h-3.5 w-3.5 flex-shrink-0' }),
                      e.jsx('span', { className: 'truncate text-start', children: s.position }),
                    ],
                  }),
              ],
            }),
            e.jsxs('div', {
              className: 'flex items-center gap-2',
              children: [
                s.organization &&
                  e.jsxs(_, {
                    variant: 'secondary',
                    className: 'flex items-center gap-1.5 px-3 py-1 text-xs whitespace-nowrap',
                    children: [
                      e.jsx(me, { className: 'h-3 w-3' }),
                      e.jsx('span', {
                        className: 'truncate max-w-[120px] sm:max-w-none',
                        children: s.organization.name,
                      }),
                    ],
                  }),
                a &&
                  a.total > 0 &&
                  e.jsxs(_, {
                    variant: 'outline',
                    className: 'flex items-center gap-1.5 px-2 py-1 text-xs',
                    children: [
                      e.jsx(he, { className: 'h-3 w-3' }),
                      e.jsx('span', { children: a.total }),
                    ],
                  }),
              ],
            }),
          ],
        }),
      }),
      e.jsxs(ae, {
        className: 'space-y-3',
        children: [
          e.jsxs('div', {
            className: 'space-y-2',
            children: [
              f &&
                e.jsxs('div', {
                  className: 'flex items-center gap-2 text-sm',
                  children: [
                    e.jsx(pe, { className: 'h-4 w-4 text-muted-foreground flex-shrink-0' }),
                    e.jsx('span', { className: 'truncate text-start', children: f }),
                  ],
                }),
              p &&
                e.jsxs('div', {
                  className: 'flex items-center gap-2 text-sm',
                  children: [
                    e.jsx(ue, { className: 'h-4 w-4 text-muted-foreground flex-shrink-0' }),
                    e.jsx('span', {
                      className: `${j ? 'text-end' : 'text-start'}`,
                      dir: 'ltr',
                      children: p,
                    }),
                  ],
                }),
            ],
          }),
          x.length > 0 &&
            e.jsxs('div', {
              className: 'flex items-start gap-2 pt-2 border-t',
              children: [
                e.jsx(je, { className: 'h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5' }),
                e.jsx('div', {
                  className: 'flex flex-wrap gap-1.5 flex-1',
                  children: x.map((d) =>
                    e.jsx(
                      _,
                      {
                        variant: 'outline',
                        className: 'text-xs px-2 py-0.5',
                        style: d.color ? { borderColor: d.color, color: d.color } : void 0,
                        children: d.name,
                      },
                      d.id,
                    ),
                  ),
                }),
              ],
            }),
          ((s.email_addresses?.length || 0) > 1 || (s.phone_numbers?.length || 0) > 1) &&
            e.jsxs('div', {
              className: 'flex gap-3 text-xs text-muted-foreground pt-2',
              children: [
                (s.email_addresses?.length || 0) > 1 &&
                  e.jsxs('span', {
                    children: [
                      '+',
                      s.email_addresses.length - 1,
                      ' email',
                      s.email_addresses.length - 1 > 1 ? 's' : '',
                    ],
                  }),
                (s.phone_numbers?.length || 0) > 1 &&
                  e.jsxs('span', {
                    children: [
                      '+',
                      s.phone_numbers.length - 1,
                      ' phone',
                      s.phone_numbers.length - 1 > 1 ? 's' : '',
                    ],
                  }),
              ],
            }),
        ],
      }),
    ],
  })
}
function Te({
  contacts: s,
  tags: n = [],
  onContactClick: t,
  isLoading: r = !1,
  isEmpty: h = !1,
  emptyMessage: l,
  className: j = '',
}) {
  const { t: a, i18n: f } = L('contacts'),
    p = f.language === 'ar',
    x = g.useRef(null),
    d = ye({
      count: s.length,
      getScrollElement: () => x.current,
      estimateSize: () => 180,
      overscan: 5,
    })
  return r
    ? e.jsxs('div', {
        className: 'flex flex-col items-center justify-center py-12 gap-4',
        children: [
          e.jsx(fe, { className: 'h-8 w-8 animate-spin text-muted-foreground' }),
          e.jsx('p', {
            className: 'text-sm text-muted-foreground',
            children: a('contactDirectory.list.loading_contacts'),
          }),
        ],
      })
    : h || s.length === 0
      ? e.jsxs('div', {
          className: 'flex flex-col items-center justify-center py-12 gap-4',
          children: [
            e.jsx('div', {
              className: 'rounded-full bg-muted p-4',
              children: e.jsx(ge, { className: 'h-8 w-8 text-muted-foreground' }),
            }),
            e.jsxs('div', {
              className: 'text-center space-y-1',
              children: [
                e.jsx('p', {
                  className: 'font-medium',
                  children: l || a('contactDirectory.list.no_contacts_found'),
                }),
                e.jsx('p', {
                  className: 'text-sm text-muted-foreground',
                  children: a('contactDirectory.list.try_different_filters'),
                }),
              ],
            }),
          ],
        })
      : e.jsx('div', {
          ref: x,
          className: `overflow-auto ${j}`,
          style: { height: '100%' },
          dir: p ? 'rtl' : 'ltr',
          children: e.jsx('div', {
            style: { height: `${d.getTotalSize()}px`, width: '100%', position: 'relative' },
            children: d.getVirtualItems().map((u) => {
              const m = s[u.index]
              return e.jsx(
                'div',
                {
                  style: {
                    position: 'absolute',
                    top: 0,
                    [p ? 'right' : 'left']: 0,
                    width: '100%',
                    height: `${u.size}px`,
                    transform: `translateY(${u.start}px)`,
                  },
                  className: 'px-4 sm:px-6 lg:px-8 pb-4',
                  children: e.jsx(ke, { contact: m, tags: n, onClick: () => t?.(m) }),
                },
                u.key,
              )
            }),
          }),
        })
}
function ze(s, n) {
  return P({
    queryKey: [..._e.byType('person'), { params: s }],
    queryFn: () => Ce('person', 1, s?.limit || 50),
    ...n,
  })
}
class S extends Error {
  constructor(n, t) {
    ;(super(t), (this.status = n), (this.name = 'ExportApiError'))
  }
}
async function Ee(s, n) {
  try {
    const {
      data: { session: t },
    } = await I.auth.getSession()
    if (!t) throw new S(401, 'Authentication required')
    const r = { format: s, ...n, limit: n?.limit || 1e3 },
      { data: h, error: l } = await I.functions.invoke('contacts-export', {
        body: r,
        headers: { 'Content-Type': 'application/json' },
      })
    if (l) throw new S(500, l.message || 'Export failed')
    const j = s === 'csv' ? 'text/csv;charset=utf-8' : 'text/vcard;charset=utf-8'
    return new Blob([h], { type: j })
  } catch (t) {
    throw t instanceof S
      ? t
      : (console.error('Export error:', t),
        new S(500, t instanceof Error ? t.message : 'Export failed'))
  }
}
async function H(s, n, t) {
  try {
    const r = await Ee(s, n),
      h = `contacts_${new Date().toISOString().split('T')[0]}.${s === 'csv' ? 'csv' : 'vcf'}`,
      l = t || h,
      j = URL.createObjectURL(r),
      a = document.createElement('a')
    ;((a.href = j),
      (a.download = l),
      document.body.appendChild(a),
      a.click(),
      document.body.removeChild(a),
      URL.revokeObjectURL(j))
  } catch (r) {
    throw (console.error('Download error:', r), r)
  }
}
async function $e(s, n) {
  if (s.length === 0) throw new S(400, 'No contacts selected')
  return H(n, { contact_ids: s })
}
async function Re(s, n, t) {
  const r = {}
  return (n && (r.organization_id = n), t?.length && (r.tags = t), H(s, r))
}
function Le() {
  const { t: s, i18n: n } = L('contacts'),
    t = n.language === 'ar',
    r = G(),
    { toast: h } = le(),
    [l, j] = g.useState({}),
    [a, f] = g.useState([]),
    [p, x] = g.useState(!1),
    { data: d, isLoading: u } = ze(l),
    m = g.useMemo(
      () =>
        d?.data
          ? {
              contacts: d.data.map((o) => ({
                id: o.id,
                full_name: o.name_en,
                organization_id: o.metadata?.organization_id,
                organization_name: o.metadata?.organization_name_en,
                position: o.metadata?.title_en,
                email_addresses: o.metadata?.email || [],
                phone_numbers: o.metadata?.phone || [],
                tags: o.tags,
                source_type: o.metadata?.source_type || 'manual',
                created_at: o.created_at,
                updated_at: o.updated_at,
              })),
              total: d.total || 0,
              organizations: [],
              tags: [],
            }
          : null,
      [d],
    ),
    v = () => {
      r({ to: '/contacts/create' })
    },
    i = (o) => {
      r({ to: '/contacts/$contactId', params: { contactId: o } })
    },
    c = async (o) => {
      try {
        ;(x(!0),
          await Re(o, l.organization_id, l.tags),
          h({
            title: s('contactDirectory.export.success'),
            description: s('contactDirectory.export.successDescription', {
              count: m?.total || 0,
              format: o.toUpperCase(),
            }),
          }))
      } catch (w) {
        ;(console.error('Export error:', w),
          h({
            title: s('contactDirectory.export.error'),
            description: s('contactDirectory.export.errorDescription'),
            variant: 'destructive',
          }))
      } finally {
        x(!1)
      }
    },
    b = async (o) => {
      if (a.length === 0) {
        h({
          title: s('contactDirectory.export.noSelection'),
          description: s('contactDirectory.export.noSelectionDescription'),
          variant: 'destructive',
        })
        return
      }
      try {
        ;(x(!0),
          await $e(a, o),
          h({
            title: s('contactDirectory.export.success'),
            description: s('contactDirectory.export.successDescription', {
              count: a.length,
              format: o.toUpperCase(),
            }),
          }),
          f([]))
      } catch (w) {
        ;(console.error('Export error:', w),
          h({
            title: s('contactDirectory.export.error'),
            description: s('contactDirectory.export.errorDescription'),
            variant: 'destructive',
          }))
      } finally {
        x(!1)
      }
    }
  return e.jsxs('div', {
    className: 'min-h-screen flex flex-col',
    dir: t ? 'rtl' : 'ltr',
    children: [
      e.jsx('div', {
        className: 'border-b bg-background',
        children: e.jsxs('div', {
          className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6',
          children: [
            e.jsxs('div', {
              className: 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
              children: [
                e.jsxs('div', {
                  children: [
                    e.jsx('h1', {
                      className: 'text-2xl sm:text-3xl font-bold text-start',
                      children: s('contactDirectory.title'),
                    }),
                    e.jsx('p', {
                      className: 'text-sm sm:text-base text-muted-foreground mt-1 text-start',
                      children: s('contactDirectory.subtitle'),
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'flex gap-2 sm:gap-3',
                  children: [
                    e.jsxs(re, {
                      children: [
                        e.jsx(ce, {
                          asChild: !0,
                          children: e.jsxs(D, {
                            variant: 'outline',
                            disabled: p || (m?.total || 0) === 0,
                            className: 'px-4',
                            children: [
                              e.jsx(Ne, { className: `h-4 w-4 ${t ? 'ms-2' : 'me-2'}` }),
                              s('contactDirectory.buttons.export'),
                            ],
                          }),
                        }),
                        e.jsxs(ne, {
                          align: t ? 'start' : 'end',
                          className: 'min-w-[200px]',
                          children: [
                            e.jsx('div', {
                              className: 'px-2 py-1.5 text-sm font-medium',
                              children: s('contactDirectory.export.exportAll'),
                            }),
                            e.jsxs(R, {
                              onClick: () => c('csv'),
                              disabled: p,
                              className: '',
                              children: [
                                e.jsx(ve, { className: `h-4 w-4 ${t ? 'ms-2' : 'me-2'}` }),
                                s('contactDirectory.export.csv'),
                                e.jsxs('span', {
                                  className: 'ms-auto text-xs text-muted-foreground',
                                  children: ['Excel ', s('contactDirectory.export.compatible')],
                                }),
                              ],
                            }),
                            e.jsxs(R, {
                              onClick: () => c('vcard'),
                              disabled: p,
                              className: '',
                              children: [
                                e.jsx(be, { className: `h-4 w-4 ${t ? 'ms-2' : 'me-2'}` }),
                                s('contactDirectory.export.vcard'),
                                e.jsxs('span', {
                                  className: 'ms-auto text-xs text-muted-foreground',
                                  children: ['Outlook ', s('contactDirectory.export.compatible')],
                                }),
                              ],
                            }),
                            a.length > 0 &&
                              e.jsxs(e.Fragment, {
                                children: [
                                  e.jsx('div', { className: 'my-2 border-t' }),
                                  e.jsx('div', {
                                    className: 'px-2 py-1.5 text-sm font-medium',
                                    children: s('contactDirectory.export.exportSelected', {
                                      count: a.length,
                                    }),
                                  }),
                                  e.jsxs(R, {
                                    onClick: () => b('csv'),
                                    disabled: p,
                                    className: '',
                                    children: [
                                      e.jsx(M, { className: `h-4 w-4 ${t ? 'ms-2' : 'me-2'}` }),
                                      s('contactDirectory.export.selectedCsv'),
                                    ],
                                  }),
                                  e.jsxs(R, {
                                    onClick: () => b('vcard'),
                                    disabled: p,
                                    className: '',
                                    children: [
                                      e.jsx(M, { className: `h-4 w-4 ${t ? 'ms-2' : 'me-2'}` }),
                                      s('contactDirectory.export.selectedVCard'),
                                    ],
                                  }),
                                ],
                              }),
                          ],
                        }),
                      ],
                    }),
                    e.jsxs(D, {
                      onClick: v,
                      className: 'px-4 sm:px-6',
                      children: [
                        e.jsx(we, { className: `h-4 w-4 ${t ? 'ms-2' : 'me-2'}` }),
                        s('contactDirectory.buttons.createContact'),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            e.jsx('div', {
              className: 'mt-6',
              children: e.jsx(Se, {
                onSearch: j,
                organizations: m?.organizations || [],
                tags: m?.tags || [],
                defaultParams: l,
                isLoading: u,
              }),
            }),
          ],
        }),
      }),
      e.jsxs('div', {
        className: 'flex-1 container mx-auto py-6',
        children: [
          e.jsx(Te, {
            contacts: m?.contacts || [],
            tags: m?.tags || [],
            onContactClick: (o) => i(o.id),
            isLoading: u,
            isEmpty: m?.total === 0,
            className: 'h-[calc(100vh-400px)] min-h-[400px]',
          }),
          m &&
            m.total > 0 &&
            e.jsx('div', {
              className: 'mt-4 text-center text-sm text-muted-foreground',
              children: s('contactDirectory.messages.showingResults', {
                showing: m.contacts.length,
                total: m.total,
              }),
            }),
        ],
      }),
    ],
  })
}
const Ge = Le
export { Ge as component }
//# sourceMappingURL=contacts-B8fxq_Ce.js.map
