import { r as f, u as q, j as e } from './react-vendor-Buoak6m3.js'
import { a as Z, c as I, d as O, i as Le } from './tanstack-vendor-BZC-rs5U.js'
import {
  ab as ae,
  A as _e,
  E as Se,
  c as l,
  F as Ce,
  G as Te,
  H as Ee,
  I as $e,
  B as S,
  p as me,
  C as De,
  m as G,
  j as B,
  k as K,
  l as R,
  n as Ae,
  o as V,
  V as W,
  a0 as H,
  af as fe,
  ag as ke,
  s as J,
  ae as Pe,
  Z as Fe,
  _ as Me,
  $ as ue,
  aa as xe,
} from './index-qYY0KoZ1.js'
import { c as qe } from './supabase-vendor-CTsC8ILD.js'
import {
  aE as Y,
  aD as oe,
  aS as X,
  bi as je,
  d9 as ze,
  eg as Qe,
  b6 as be,
  bp as Oe,
  aG as ne,
  bL as ee,
  aB as te,
  bw as Be,
  b4 as he,
  aR as Ke,
  aT as Re,
  b_ as Ge,
  aH as de,
  bV as Ie,
  dE as Je,
  b9 as Ue,
  eh as Ve,
} from './vendor-misc-BiJvMP0A.js'
import {
  A as He,
  a as Ye,
  b as We,
  c as Ze,
  d as Xe,
  e as es,
  f as ss,
  g as ts,
} from './alert-dialog-DaWYDPc1.js'
import { T as as, a as ns, b as is, c as rs } from './tooltip-CE0dVuox.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
const Ne = 'https://zkrcjzdemdmwhearhfgg.supabase.co',
  ls =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcmNqemRlbWRtd2hlYXJoZmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MjY0OTAsImV4cCI6MjA3NDQwMjQ5MH0.JnSwNH0rsz8yg9zx73_3qc5CpJ6oo-udpo3G4ZIwkYQ',
  cs = qe(Ne, ls),
  os = `${Ne}/functions/v1`
class ds extends Error {
  code
  details
  constructor(t) {
    ;(super(t.message),
      (this.name = 'EntityLinksAPIError'),
      (this.code = t.code),
      (this.details = t.details))
  }
}
async function z(s, t = {}) {
  const {
    data: { session: i },
  } = await cs.auth.getSession()
  if (!i) throw new Error('Not authenticated')
  const n = await (
    await fetch(`${os}${s}`, {
      ...t,
      headers: {
        Authorization: `Bearer ${i.access_token}`,
        'Content-Type': 'application/json',
        ...t.headers,
      },
    })
  ).json()
  if (!n.success) throw new ds(n.error)
  return n.data
}
const Q = {
  async createLink(s, t) {
    return z(`/intake-links-create?intake_id=${s}`, { method: 'POST', body: JSON.stringify(t) })
  },
  async getLinks(s, t = !1) {
    const i = new URLSearchParams()
    return (
      i.append('intake_id', s),
      i.append('include_deleted', t.toString()),
      z(`/intake-links-get?${i.toString()}`, { method: 'GET' })
    )
  },
  async updateLink(s, t, i) {
    return z(`/intake-links-update?intake_id=${s}&link_id=${t}`, {
      method: 'PUT',
      body: JSON.stringify(i),
    })
  },
  async deleteLink(s, t) {
    await z(`/intake/${s}/links/${t}`, { method: 'DELETE' })
  },
  async restoreLink(s, t) {
    return z(`/intake/${s}/links/${t}/restore`, { method: 'POST' })
  },
  async createBatchLinks(s, t) {
    return z(`/intake-links-batch?intake_id=${s}`, { method: 'POST', body: JSON.stringify(t) })
  },
  async reorderLinks(s, t) {
    await z(`/intake/${s}/links/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ link_orders: t }),
    })
  },
  async searchEntities(s) {
    const t = new URLSearchParams()
    return (
      s.query && t.append('q', s.query),
      s.entity_types &&
        s.entity_types.length > 0 &&
        t.append('entity_types', s.entity_types.join(',')),
      s.organization_id && t.append('organization_id', s.organization_id),
      s.classification_level !== void 0 &&
        t.append('classification_level', s.classification_level.toString()),
      s.include_archived !== void 0 && t.append('include_archived', s.include_archived.toString()),
      s.limit && t.append('limit', s.limit.toString()),
      z(`/entities-search?${t.toString()}`, { method: 'GET' })
    )
  },
  async getEntityIntakes(s, t, i) {
    const a = new URLSearchParams()
    return (
      i?.status && i.status.length > 0 && a.append('status', i.status.join(',')),
      i?.from_date && a.append('from_date', i.from_date),
      i?.to_date && a.append('to_date', i.to_date),
      i?.page && a.append('page', i.page.toString()),
      i?.limit && a.append('limit', i.limit.toString()),
      z(`/entities/${s}/${t}/intakes?${a.toString()}`, { method: 'GET' })
    )
  },
  async getAuditLog(s, t) {
    return z(`/intake/${s}/links/${t}/audit-log`, { method: 'GET' })
  },
  ai: {
    async generateSuggestions(s, t) {
      return z(`/intake-links-suggestions?intake_id=${s}`, {
        method: 'POST',
        body: JSON.stringify(t || {}),
      })
    },
    async acceptSuggestion(s, t) {
      return z(`/intake/${s}/links/suggestions/accept`, { method: 'POST', body: JSON.stringify(t) })
    },
    async rejectSuggestion(s, t) {
      await z(`/intake/${s}/links/suggestions/${t}/reject`, { method: 'POST' })
    },
  },
}
function ms(s, t) {
  const [i, a] = f.useState(s)
  return (
    f.useEffect(() => {
      const n = setTimeout(() => {
        a(s)
      }, t)
      return () => {
        clearTimeout(n)
      }
    }, [s, t]),
    i
  )
}
const ce = {
  all: ['entity-search'],
  searches: () => [...ce.all, 'search'],
  search: (s) => [...ce.searches(), s],
}
function us(s, t = {}) {
  const { debounceMs: i = 300, minQueryLength: a = 2, enabled: n = !0, limit: c = 20 } = t,
    d = ms(s.query || '', i),
    r = n && d.length >= a
  return Z({
    queryKey: ce.search({ ...s, query: d, limit: c }),
    queryFn: () => Q.searchEntities({ ...s, query: d, limit: c }),
    enabled: r,
    staleTime: 1e3 * 60 * 5,
    gcTime: 1e3 * 60 * 10,
  })
}
function xs(s = {}, t = {}) {
  const [i, a] = f.useState(''),
    [n, c] = f.useState(s.entity_types),
    d = {
      query: i,
      entity_types: n,
      organization_id: s.organization_id,
      classification_level: s.classification_level,
      include_archived: s.include_archived ?? !1,
    },
    r = us(d, t),
    x = f.useCallback(() => {
      a('')
    }, []),
    g = f.useCallback((j) => {
      c((w) => (w ? (w.includes(j) ? w.filter((k) => k !== j) : [...w, j]) : [j]))
    }, []),
    m = f.useCallback(() => {
      ;(a(''), c(void 0))
    }, [])
  return {
    query: i,
    setQuery: a,
    selectedTypes: n,
    setSelectedTypes: c,
    toggleEntityType: g,
    clearSearch: x,
    clearFilters: m,
    ...r,
  }
}
function ge(s) {
  return (
    {
      dossier: 'Dossier',
      position: 'Position',
      mou: 'MOU',
      engagement: 'Engagement',
      assignment: 'Assignment',
      commitment: 'Commitment',
      intelligence_signal: 'Intelligence Signal',
      organization: 'Organization',
      country: 'Country',
      forum: 'Forum',
      working_group: 'Working Group',
      topic: 'Topic',
    }[s] || s
  )
}
const v = {
  all: ['entity-links'],
  lists: () => [...v.all, 'list'],
  list: (s, t = !1) => [...v.lists(), s, t],
  detail: (s, t) => [...v.all, 'detail', s, t],
  auditLog: (s, t) => [...v.all, 'audit', s, t],
}
function ve(s, t = !1) {
  const { t: i } = q()
  return Z({
    queryKey: v.list(s, t),
    queryFn: () => Q.getLinks(s, t),
    enabled: !!s,
    staleTime: 1e3 * 60 * 2,
    gcTime: 1e3 * 60 * 10,
  })
}
function hs(s) {
  const { t } = q(),
    { toast: i } = ae(),
    a = I()
  return O({
    mutationFn: (n) => Q.createLink(s, n),
    onMutate: async (n) => {
      await a.cancelQueries({ queryKey: v.list(s, !1) })
      const c = a.getQueryData(v.list(s, !1))
      if (c) {
        const d = {
          id: `temp-${Date.now()}`,
          intake_id: s,
          entity_type: n.entity_type,
          entity_id: n.entity_id,
          link_type: n.link_type,
          notes: n.notes,
          link_order: c.length + 1,
          created_by: 'current-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          deleted_by: null,
          _version: 1,
        }
        a.setQueryData(v.list(s, !1), [...c, d])
      }
      return { previousLinks: c }
    },
    onError: (n, c, d) => {
      ;(d?.previousLinks && a.setQueryData(v.list(s, !1), d.previousLinks),
        i({
          variant: 'destructive',
          title: t('entityLinks.createError'),
          description: n.message || t('entityLinks.createErrorDescription'),
        }))
    },
    onSettled: () => {
      a.invalidateQueries({ queryKey: v.list(s, !1) })
    },
    onSuccess: (n) => {
      i({
        title: t('entityLinks.createSuccess'),
        description: t('entityLinks.createSuccessDescription'),
      })
    },
  })
}
function gs(s) {
  const { t } = q(),
    { toast: i } = ae(),
    a = I()
  return O({
    mutationFn: (n) => Q.deleteLink(s, n),
    onMutate: async (n) => {
      await a.cancelQueries({ queryKey: v.list(s, !1) })
      const c = a.getQueryData(v.list(s, !1))
      return (
        c &&
          a.setQueryData(
            v.list(s, !1),
            c.filter((d) => d.id !== n),
          ),
        { previousLinks: c }
      )
    },
    onError: (n, c, d) => {
      ;(d?.previousLinks && a.setQueryData(v.list(s, !1), d.previousLinks),
        i({
          variant: 'destructive',
          title: t('entityLinks.deleteError'),
          description: n.message || t('entityLinks.deleteErrorDescription'),
        }))
    },
    onSettled: () => {
      a.invalidateQueries({ queryKey: v.list(s, !1) })
    },
    onSuccess: () => {
      i({
        title: t('entityLinks.deleteSuccess'),
        description: t('entityLinks.deleteSuccessDescription'),
      })
    },
  })
}
function ps(s) {
  const { t } = q(),
    { toast: i } = ae(),
    a = I()
  return O({
    mutationFn: (n) => Q.restoreLink(s, n),
    onSettled: () => {
      ;(a.invalidateQueries({ queryKey: v.list(s, !0) }),
        a.invalidateQueries({ queryKey: v.list(s, !1) }))
    },
    onError: (n) => {
      i({
        variant: 'destructive',
        title: t('entityLinks.restoreError'),
        description: n.message || t('entityLinks.restoreErrorDescription'),
      })
    },
    onSuccess: () => {
      i({
        title: t('entityLinks.restoreSuccess'),
        description: t('entityLinks.restoreSuccessDescription'),
      })
    },
  })
}
function ys(s) {
  const t = I()
  return O({
    mutationFn: (i) => Q.reorderLinks(s, i),
    onMutate: async (i) => {
      await t.cancelQueries({ queryKey: v.list(s, !1) })
      const a = t.getQueryData(v.list(s, !1))
      if (a) {
        const n = [...a]
        ;(i.forEach(({ link_id: c, link_order: d }) => {
          const r = n.findIndex((x) => x.id === c)
          r !== -1 && (n[r] = { ...n[r], link_order: d })
        }),
          n.sort((c, d) => c.link_order - d.link_order),
          t.setQueryData(v.list(s, !1), n))
      }
      return { previousLinks: a }
    },
    onError: (i, a, n) => {
      n?.previousLinks && t.setQueryData(v.list(s, !1), n.previousLinks)
    },
    onSettled: () => {
      t.invalidateQueries({ queryKey: v.list(s, !1) })
    },
  })
}
function fs(s) {
  const { t } = q(),
    { toast: i } = ae(),
    a = I()
  return O({
    mutationFn: (n) =>
      Q.createBatchLinks(s, {
        links: n.map((c) => ({ ...c, link_type: c.link_type, entity_type: c.entity_type })),
      }),
    onMutate: async (n) => {
      await a.cancelQueries({ queryKey: v.list(s, !1) })
      const c = a.getQueryData(v.list(s, !1))
      if (c) {
        const d = n.map((r, x) => ({
          id: `temp-${Date.now()}-${x}`,
          intake_id: s,
          entity_type: r.entity_type,
          entity_id: r.entity_id,
          link_type: r.link_type,
          notes: r.notes || '',
          link_order: c.length + x + 1,
          created_by: 'current-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          deleted_by: null,
          _version: 1,
        }))
        a.setQueryData(v.list(s, !1), [...c, ...d])
      }
      return { previousLinks: c }
    },
    onError: (n, c, d) => {
      ;(d?.previousLinks && a.setQueryData(v.list(s, !1), d.previousLinks),
        i({
          variant: 'destructive',
          title: t('entityLinks.createBatchError'),
          description: n.message || t('entityLinks.createBatchErrorDescription'),
        }))
    },
    onSettled: () => {
      a.invalidateQueries({ queryKey: v.list(s, !1) })
    },
    onSuccess: (n) => {
      const c = n.created_links.length,
        d = n.failed_links.length
      d > 0
        ? i({
            variant: 'default',
            title: t('entityLinks.createBatchPartialSuccess'),
            description: t('entityLinks.createBatchPartialSuccessDescription', {
              success: c,
              failed: d,
            }),
          })
        : i({
            title: t('entityLinks.createBatchSuccess'),
            description: t('entityLinks.createBatchSuccessDescription', { count: c }),
          })
    },
  })
}
const ks = [
  'dossier',
  'position',
  'mou',
  'engagement',
  'assignment',
  'commitment',
  'intelligence_signal',
  'organization',
  'country',
  'forum',
  'working_group',
  'topic',
]
function js({
  open: s,
  onOpenChange: t,
  onSelect: i,
  intakeId: a,
  organizationId: n,
  classificationLevel: c,
  includeArchived: d = !1,
}) {
  const { t: r, i18n: x } = q(),
    g = x.language === 'ar',
    [m, j] = f.useState([]),
    [w, k] = f.useState(null),
    {
      query: D,
      setQuery: _,
      selectedTypes: L,
      toggleEntityType: p,
      clearFilters: N,
      data: A,
      isLoading: P,
      error: E,
    } = xs(
      { organization_id: n, classification_level: c, include_archived: d },
      { debounceMs: 300, minQueryLength: 2, enabled: s, limit: 20 },
    ),
    { data: u } = ve(a, !1),
    M = f.useMemo(
      () => (u ? new Set(u.map((o) => `${o.entity_type}-${o.entity_id}`)) : new Set()),
      [u],
    ),
    h = f.useMemo(() => (u ? u.find((o) => o.link_type === 'primary') : null), [u]),
    b = f.useMemo(() => !!h && !!w, [h, w]),
    $ = f.useCallback(
      (o) => {
        const y = `${o.entity_type}-${o.entity_id}`,
          C = m.some((F) => `${F.entity_type}-${F.entity_id}` === y)
        j(C ? m.filter((F) => `${F.entity_type}-${F.entity_id}` !== y) : [...m, o])
      },
      [m],
    ),
    ie = f.useCallback(() => {
      if (m.length > 0) {
        const o = m.map((y) => ({
          ...y,
          _shouldBePrimary: `${y.entity_type}-${y.entity_id}` === w,
        }))
        ;(i(o, b), t(!1), _(''), N(), j([]), k(null))
      }
    }, [m, w, b, i, t, _, N]),
    re = f.useCallback(() => {
      ;(t(!1), _(''), N(), j([]), k(null))
    }, [t, _, N])
  return e.jsx(_e, {
    open: s,
    onOpenChange: re,
    children: e.jsxs(Se, {
      className: l(
        'max-w-full sm:max-w-2xl',
        'h-[90vh] sm:h-[80vh]',
        'mx-0 sm:mx-auto',
        'p-0',
        g && 'text-end',
      ),
      children: [
        e.jsxs(Ce, {
          className: 'px-4 pt-4 sm:px-6 sm:pt-6',
          children: [
            e.jsx(Te, {
              className: l('text-lg sm:text-xl', 'text-start'),
              children: r('entityLinks.searchDialogTitle'),
            }),
            e.jsx(Ee, {
              className: 'text-start',
              children: r('entityLinks.searchDialogDescription'),
            }),
          ],
        }),
        e.jsxs('div', {
          className: 'flex flex-col h-full overflow-hidden',
          children: [
            e.jsx('div', {
              className: l('px-4 pb-3 sm:px-6 sm:pb-4', 'border-b'),
              children: e.jsxs('div', {
                className: 'relative',
                children: [
                  e.jsx(Y, {
                    className: l(
                      'absolute top-1/2 -translate-y-1/2',
                      'h-4 w-4 sm:h-5 sm:w-5',
                      'text-slate-400',
                      g ? 'end-3' : 'start-3',
                    ),
                  }),
                  e.jsx($e, {
                    type: 'text',
                    placeholder: r('entityLinks.searchPlaceholder'),
                    value: D,
                    onChange: (o) => _(o.target.value),
                    className: l(
                      'w-full',
                      'text-sm sm:text-base',
                      'min-h-11',
                      g ? 'pe-10 ps-3' : 'ps-10 pe-3',
                    ),
                    dir: g ? 'rtl' : 'ltr',
                    autoFocus: !0,
                    'aria-label': r('entityLinks.searchInput'),
                  }),
                  D &&
                    e.jsx(S, {
                      variant: 'ghost',
                      size: 'icon',
                      className: l(
                        'absolute top-1/2 -translate-y-1/2',
                        'h-8 w-8 sm:h-9 sm:w-9',
                        g ? 'start-1' : 'end-1',
                      ),
                      onClick: () => _(''),
                      'aria-label': r('common.clear'),
                      children: e.jsx(oe, { className: 'h-4 w-4' }),
                    }),
                ],
              }),
            }),
            e.jsxs('div', {
              className: l('px-4 py-3 sm:px-6', 'border-b bg-slate-50/50 dark:bg-slate-900/20'),
              children: [
                e.jsxs('div', {
                  className: l('flex items-center justify-between mb-3', g && 'flex-row-reverse'),
                  children: [
                    e.jsx('span', {
                      className: 'text-xs font-medium text-slate-600 dark:text-slate-400',
                      children:
                        L && L.length > 0
                          ? `${L.length} ${r('entityLinks.filtersSelected', { count: L.length })}`
                          : r('entityLinks.filterByType'),
                    }),
                    L &&
                      L.length > 0 &&
                      e.jsx(S, {
                        variant: 'ghost',
                        size: 'sm',
                        className: 'h-7 px-2 text-xs',
                        onClick: N,
                        children: r('common.clearFilters'),
                      }),
                  ],
                }),
                e.jsx(me, {
                  className: 'w-full',
                  children: e.jsx('div', {
                    className: l('flex gap-2 pb-2', g && 'flex-row-reverse'),
                    children: ks.map((o) => {
                      const y = L?.includes(o)
                      return e.jsx(
                        S,
                        {
                          variant: y ? 'default' : 'outline',
                          size: 'sm',
                          className: l(
                            'min-h-9 px-3 flex-shrink-0',
                            'text-xs',
                            'touch-manipulation',
                            'whitespace-nowrap',
                            'transition-all duration-200',
                            y && 'shadow-sm',
                          ),
                          onClick: () => p(o),
                          'aria-label': r(`entityLinks.entityTypes.${o}`),
                          'aria-pressed': y,
                          children: ge(o),
                        },
                        o,
                      )
                    }),
                  }),
                }),
              ],
            }),
            e.jsx(me, {
              className: 'flex-1 overflow-auto',
              children: e.jsxs('div', {
                className: 'px-4 py-3 sm:px-6 sm:py-4',
                children: [
                  P &&
                    e.jsxs('div', {
                      className: 'flex items-center justify-center py-8',
                      children: [
                        e.jsx(X, { className: 'h-8 w-8 animate-spin text-slate-400' }),
                        e.jsx('span', {
                          className: l('text-sm text-slate-500', g ? 'me-3' : 'ms-3'),
                          children: r('common.loading'),
                        }),
                      ],
                    }),
                  E &&
                    e.jsx('div', {
                      className: 'text-center py-8',
                      children: e.jsx('p', {
                        className: 'text-sm text-red-600',
                        children: r('entityLinks.searchError'),
                      }),
                    }),
                  !P &&
                    !E &&
                    D.length < 2 &&
                    e.jsxs('div', {
                      className: 'text-center py-12',
                      children: [
                        e.jsx('div', {
                          className:
                            'inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4',
                          children: e.jsx(Y, {
                            className: 'h-8 w-8 text-blue-600 dark:text-blue-400',
                          }),
                        }),
                        e.jsx('h3', {
                          className:
                            'text-base font-semibold text-slate-900 dark:text-slate-100 mb-2',
                          children: r('entityLinks.searchTitle', 'Find and link entities'),
                        }),
                        e.jsx('p', {
                          className: 'text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto',
                          children: r(
                            'entityLinks.searchEmptyState',
                            'Enter at least 2 characters to search for dossiers, positions, countries, and more',
                          ),
                        }),
                      ],
                    }),
                  !P &&
                    !E &&
                    D.length >= 2 &&
                    A?.length === 0 &&
                    e.jsxs('div', {
                      className: 'text-center py-12',
                      children: [
                        e.jsx('div', {
                          className:
                            'inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4',
                          children: e.jsx(Y, { className: 'h-8 w-8 text-slate-400' }),
                        }),
                        e.jsx('h3', {
                          className:
                            'text-base font-semibold text-slate-900 dark:text-slate-100 mb-2',
                          children: r('entityLinks.noResultsTitle', 'No entities found'),
                        }),
                        e.jsx('p', {
                          className:
                            'text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto mb-4',
                          children: r('entityLinks.noResults', `No entities match "${D}"`),
                        }),
                        e.jsxs('div', {
                          className: 'text-xs text-slate-500 dark:text-slate-400 space-y-1',
                          children: [
                            e.jsx('p', { children: r('entityLinks.searchTips', 'Try:') }),
                            e.jsxs('ul', {
                              className: 'list-disc list-inside space-y-0.5',
                              children: [
                                e.jsx('li', {
                                  children: r(
                                    'entityLinks.tip1',
                                    'Using fewer or different keywords',
                                  ),
                                }),
                                e.jsx('li', {
                                  children: r('entityLinks.tip2', 'Checking your spelling'),
                                }),
                                e.jsx('li', {
                                  children: r(
                                    'entityLinks.tip3',
                                    'Clearing filters to search all entity types',
                                  ),
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  !P &&
                    !E &&
                    A &&
                    A.length > 0 &&
                    e.jsx('div', {
                      className: 'space-y-2',
                      children: A.map((o) => {
                        const y = `${o.entity_type}-${o.entity_id}`,
                          C = M.has(y),
                          F = m.some((T) => `${T.entity_type}-${T.entity_id}` === y)
                        return e.jsx(
                          'div',
                          {
                            className: l(
                              'w-full',
                              'min-h-16 sm:min-h-14',
                              'px-3 py-2 sm:px-4 sm:py-3',
                              'border rounded-lg',
                              'transition-all duration-200',
                              !C && 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer',
                              F &&
                                'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
                              C && 'bg-slate-50 dark:bg-slate-800 opacity-60 cursor-not-allowed',
                              'text-start',
                              g && 'text-end',
                            ),
                            onClick: () => !C && $(o),
                            role: 'checkbox',
                            'aria-checked': F,
                            'aria-disabled': C,
                            'aria-label': r('entityLinks.selectEntity', { name: o.name }),
                            tabIndex: C ? -1 : 0,
                            onKeyDown: (T) => {
                              !C &&
                                (T.key === 'Enter' || T.key === ' ') &&
                                (T.preventDefault(), $(o))
                            },
                            children: e.jsxs('div', {
                              className: l('flex items-start gap-3', g && 'flex-row-reverse'),
                              children: [
                                !C &&
                                  e.jsx(De, {
                                    checked: F,
                                    onCheckedChange: () => $(o),
                                    className: 'mt-1',
                                    'aria-hidden': 'true',
                                  }),
                                C &&
                                  e.jsx(je, {
                                    className:
                                      'h-5 w-5 text-green-600 dark:text-green-400 mt-1 flex-shrink-0',
                                  }),
                                !C &&
                                  F &&
                                  (o.entity_type === 'dossier' || o.entity_type === 'position') &&
                                  e.jsxs('button', {
                                    onClick: (T) => {
                                      ;(T.stopPropagation(), k(y))
                                    },
                                    className: l(
                                      'flex items-center gap-1.5',
                                      'px-2 py-1 rounded text-xs',
                                      'transition-colors duration-200',
                                      'touch-manipulation',
                                      w === y
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700',
                                    ),
                                    'aria-label': r('entityLinks.setPrimary'),
                                    children: [
                                      e.jsx('div', {
                                        className: l(
                                          'w-3 h-3 rounded-full border-2 flex items-center justify-center',
                                          w === y
                                            ? 'border-green-600 dark:border-green-400'
                                            : 'border-slate-400',
                                        ),
                                        children:
                                          w === y &&
                                          e.jsx('div', {
                                            className:
                                              'w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400',
                                          }),
                                      }),
                                      e.jsx('span', {
                                        className: 'font-medium',
                                        children: r(
                                          w === y
                                            ? 'entityLinks.primary'
                                            : 'entityLinks.setPrimary',
                                        ),
                                      }),
                                    ],
                                  }),
                                e.jsxs('div', {
                                  className: 'flex-1 min-w-0 space-y-1',
                                  children: [
                                    e.jsxs('div', {
                                      className: l(
                                        'flex items-center gap-2 flex-wrap',
                                        g && 'flex-row-reverse',
                                      ),
                                      children: [
                                        e.jsx('h4', {
                                          className: l(
                                            'text-sm sm:text-base font-semibold',
                                            'truncate flex-1 min-w-0',
                                            'text-start',
                                          ),
                                          children: o.name,
                                        }),
                                        e.jsx(G, {
                                          variant: 'outline',
                                          className: l(
                                            'flex-shrink-0 text-xs',
                                            'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                                          ),
                                          children: ge(o.entity_type),
                                        }),
                                        C &&
                                          e.jsx(G, {
                                            variant: 'outline',
                                            className: l(
                                              'flex-shrink-0 text-xs',
                                              'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
                                            ),
                                            children: r(
                                              'entityLinks.alreadyLinked',
                                              'Already linked',
                                            ),
                                          }),
                                      ],
                                    }),
                                    o.description &&
                                      e.jsx('p', {
                                        className: l(
                                          'text-xs text-slate-600 dark:text-slate-400',
                                          'line-clamp-2',
                                          'text-start',
                                        ),
                                        children: o.description,
                                      }),
                                    e.jsxs('div', {
                                      className: l(
                                        'flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400',
                                        g && 'flex-row-reverse',
                                      ),
                                      children: [
                                        o.similarity_score !== void 0 &&
                                          e.jsxs('span', {
                                            className: 'flex items-center gap-1',
                                            children: [
                                              e.jsx('span', {
                                                className: 'font-medium',
                                                children: 'Match:',
                                              }),
                                              e.jsxs('span', {
                                                className: l(
                                                  'font-semibold',
                                                  o.similarity_score > 0.7
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : o.similarity_score > 0.4
                                                      ? 'text-yellow-600 dark:text-yellow-400'
                                                      : 'text-slate-500',
                                                ),
                                                children: [
                                                  Math.round(o.similarity_score * 100),
                                                  '%',
                                                ],
                                              }),
                                            ],
                                          }),
                                        o.classification_level !== void 0 &&
                                          e.jsxs('span', {
                                            className: 'flex items-center gap-1',
                                            children: [
                                              e.jsx('span', {
                                                className: 'font-medium',
                                                children: 'Level:',
                                              }),
                                              e.jsx('span', { children: o.classification_level }),
                                            ],
                                          }),
                                        o.last_linked_at &&
                                          e.jsxs('span', {
                                            className: 'flex items-center gap-1',
                                            children: [
                                              e.jsx('span', {
                                                className: 'font-medium',
                                                children: 'Last used:',
                                              }),
                                              e.jsx('span', {
                                                children: new Date(
                                                  o.last_linked_at,
                                                ).toLocaleDateString(),
                                              }),
                                            ],
                                          }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          },
                          y,
                        )
                      }),
                    }),
                ],
              }),
            }),
            m.length > 0 &&
              e.jsxs('div', {
                className: l(
                  'px-4 py-3 sm:px-6 sm:py-4',
                  'border-t bg-slate-50/50 dark:bg-slate-900/20',
                  'space-y-2',
                ),
                children: [
                  b &&
                    h &&
                    e.jsxs('div', {
                      className: l(
                        'flex items-start gap-2 p-2 sm:p-3',
                        'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg',
                        g && 'flex-row-reverse',
                      ),
                      children: [
                        e.jsx('div', {
                          className: 'flex-shrink-0 mt-0.5',
                          children: e.jsx('svg', {
                            className: 'h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400',
                            fill: 'none',
                            viewBox: '0 0 24 24',
                            stroke: 'currentColor',
                            children: e.jsx('path', {
                              strokeLinecap: 'round',
                              strokeLinejoin: 'round',
                              strokeWidth: 2,
                              d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
                            }),
                          }),
                        }),
                        e.jsx('div', {
                          className: 'flex-1 min-w-0',
                          children: e.jsx('p', {
                            className: l(
                              'text-xs sm:text-sm text-amber-800 dark:text-amber-200',
                              'text-start',
                            ),
                            children: r('entityLinks.replacePrimaryWarning', {
                              defaultValue: `This will replace the existing primary link (${h.entity_name || h.entity_id})`,
                              currentPrimary: h.entity_name || h.entity_id,
                            }),
                          }),
                        }),
                      ],
                    }),
                  e.jsxs('div', {
                    className: l(
                      'flex items-center justify-between gap-4',
                      g && 'flex-row-reverse',
                    ),
                    children: [
                      e.jsx('span', {
                        className: l(
                          'text-sm font-medium text-slate-700 dark:text-slate-300',
                          'text-start',
                        ),
                        children: r('entityLinks.selectedCount', {
                          count: m.length,
                          defaultValue: `${m.length} selected`,
                        }),
                      }),
                      e.jsx(S, {
                        onClick: ie,
                        className: l(
                          'min-h-11 px-4 sm:px-6',
                          'text-sm sm:text-base',
                          'touch-manipulation',
                        ),
                        children: r('entityLinks.linkSelected', {
                          count: m.length,
                          defaultValue: `Link ${m.length} ${m.length === 1 ? 'entity' : 'entities'}`,
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
  })
}
const pe = {
  primary: {
    variant: 'default',
    colorClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: '⭐',
  },
  related: {
    variant: 'secondary',
    colorClass: 'bg-slate-600 hover:bg-slate-700 text-white',
    icon: '🔗',
  },
  requested: {
    variant: 'outline',
    colorClass: 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300',
    icon: '📋',
  },
  mentioned: {
    variant: 'outline',
    colorClass: 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300',
    icon: '💬',
  },
  assigned_to: {
    variant: 'outline',
    colorClass: 'bg-green-100 hover:bg-green-200 text-green-800 border-green-300',
    icon: '👤',
  },
}
function bs({ linkType: s, showIcon: t, className: i, size: a = 'default' }) {
  const { t: n, i18n: c } = q(),
    d = c.language === 'ar',
    r = pe[s] || pe.related,
    x = t ?? !1,
    g = {
      sm: 'text-xs px-2 py-0.5 gap-1',
      default: 'text-sm px-3 py-1 gap-1.5 sm:gap-2',
      lg: 'text-base px-4 py-1.5 gap-2 sm:gap-2.5',
    },
    m = `entityLinks.linkTypes.${s}`
  return e.jsxs(G, {
    variant: r.variant,
    className: l(
      'inline-flex items-center justify-center',
      'font-medium',
      'transition-colors duration-200',
      g[a],
      r.colorClass,
      d && x && 'flex-row-reverse',
      i,
    ),
    'aria-label': n(m),
    role: 'status',
    children: [
      x && e.jsx('span', { className: 'inline-block', 'aria-hidden': 'true', children: r.icon }),
      e.jsx('span', { className: 'inline-block whitespace-nowrap', children: n(m) }),
    ],
  })
}
function Ns({
  link: s,
  isDeleted: t = !1,
  canRestore: i = !1,
  isDraggable: a = !1,
  onDelete: n,
  onRestore: c,
  onUpdateNotes: d,
  className: r,
}) {
  const { t: x, i18n: g } = q(),
    m = g.language === 'ar',
    [j, w] = f.useState(!1),
    [k, D] = f.useState(s.notes || ''),
    [_, L] = f.useState(!1),
    p = () => {
      ;(d && k !== s.notes && d(s.id, k), w(!1))
    },
    N = () => {
      ;(D(s.notes || ''), w(!1))
    },
    A = () => {
      ;(n && n(s.id), L(!1))
    }
  return e.jsxs(e.Fragment, {
    children: [
      e.jsxs(B, {
        className: l(
          'w-full',
          'transition-all duration-200',
          t && 'opacity-60 bg-slate-50 dark:bg-slate-900',
          !t && 'hover:shadow-md',
          r,
        ),
        role: 'article',
        'aria-label': x('entityLinks.linkCard', { entity: s.entity_id }),
        children: [
          e.jsxs(K, {
            className: l(
              'px-3 py-3 sm:px-4 sm:py-4',
              'flex flex-row items-center gap-2 sm:gap-3',
              m && 'flex-row-reverse',
            ),
            children: [
              a &&
                !t &&
                e.jsx('button', {
                  className: l(
                    'flex items-center justify-center',
                    'min-h-11 min-w-11',
                    'touch-manipulation',
                    'cursor-grab active:cursor-grabbing',
                    'text-slate-400 hover:text-slate-600',
                    'transition-colors duration-200',
                    '-my-2',
                    m ? '-me-1' : '-ms-1',
                  ),
                  'aria-label': x('entityLinks.dragHandle'),
                  children: e.jsx(ze, { className: 'h-5 w-5' }),
                }),
              e.jsxs('div', {
                className: 'flex-1 min-w-0',
                children: [
                  e.jsx('h3', {
                    className: l(
                      'text-sm sm:text-base font-medium',
                      'truncate',
                      'text-start',
                      'mb-1',
                      t && 'line-through',
                    ),
                    children: s.entity_name || s.entity_id,
                  }),
                  e.jsxs('div', {
                    className: l('flex items-center gap-2', m && 'flex-row-reverse'),
                    children: [
                      e.jsx(bs, { linkType: s.link_type, size: 'sm' }),
                      e.jsx('p', {
                        className: l(
                          'text-xs sm:text-sm text-slate-500 dark:text-slate-400',
                          'text-start',
                        ),
                        children: x(`entityLinks.entityTypes.${s.entity_type}`),
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs('div', {
                className: l('flex items-center gap-1 sm:gap-2', m && 'flex-row-reverse'),
                children: [
                  !t &&
                    e.jsxs(e.Fragment, {
                      children: [
                        d &&
                          e.jsx(S, {
                            variant: 'ghost',
                            size: 'icon',
                            className: l('min-h-11 min-w-11', 'touch-manipulation'),
                            onClick: () => w(!j),
                            'aria-label': x('entityLinks.editNotes'),
                            children: e.jsx(Qe, { className: 'h-4 w-4 sm:h-5 sm:w-5' }),
                          }),
                        n &&
                          e.jsx(S, {
                            variant: 'ghost',
                            size: 'icon',
                            className: l(
                              'min-h-11 min-w-11',
                              'touch-manipulation',
                              'text-red-600 hover:text-red-700 hover:bg-red-50',
                            ),
                            onClick: () => L(!0),
                            'aria-label': x('entityLinks.deleteLink'),
                            children: e.jsx(be, { className: 'h-4 w-4 sm:h-5 sm:w-5' }),
                          }),
                      ],
                    }),
                  t &&
                    i &&
                    c &&
                    e.jsxs(S, {
                      variant: 'outline',
                      size: 'sm',
                      className: l(
                        'min-h-11 px-3 sm:px-4',
                        'touch-manipulation',
                        'text-blue-600 border-blue-300 hover:bg-blue-50',
                      ),
                      onClick: () => c(s.id),
                      'aria-label': x('entityLinks.restoreLink'),
                      children: [
                        e.jsx(Oe, { className: l('h-4 w-4', m ? 'ms-2' : 'me-2') }),
                        e.jsx('span', {
                          className: 'text-xs sm:text-sm',
                          children: x('entityLinks.restore'),
                        }),
                      ],
                    }),
                ],
              }),
            ],
          }),
          (s.notes || j) &&
            e.jsx(R, {
              className: l('px-3 py-0 pb-3 sm:px-4 sm:pb-4', 'pt-0'),
              children: j
                ? e.jsxs('div', {
                    className: 'space-y-2',
                    children: [
                      e.jsx(Ae, {
                        value: k,
                        onChange: (P) => D(P.target.value),
                        placeholder: x('entityLinks.notesPlaceholder'),
                        className: l(
                          'text-sm resize-none',
                          'min-h-20 sm:min-h-24',
                          'text-start',
                          m && 'text-end',
                        ),
                        maxLength: 1e3,
                        dir: m ? 'rtl' : 'ltr',
                        'aria-label': x('entityLinks.notesInput'),
                      }),
                      e.jsxs('div', {
                        className: l(
                          'flex items-center justify-between gap-2',
                          'text-xs text-slate-500',
                          m && 'flex-row-reverse',
                        ),
                        children: [
                          e.jsxs('span', {
                            className: 'text-start',
                            children: [k.length, '/1000'],
                          }),
                          e.jsxs('div', {
                            className: l('flex gap-2', m && 'flex-row-reverse'),
                            children: [
                              e.jsxs(S, {
                                variant: 'ghost',
                                size: 'sm',
                                className: l('min-h-11 px-3', 'touch-manipulation'),
                                onClick: N,
                                'aria-label': x('common.cancel'),
                                children: [
                                  e.jsx(oe, { className: l('h-4 w-4', m ? 'ms-1' : 'me-1') }),
                                  e.jsx('span', {
                                    className: 'text-xs sm:text-sm',
                                    children: x('common.cancel'),
                                  }),
                                ],
                              }),
                              e.jsxs(S, {
                                variant: 'default',
                                size: 'sm',
                                className: l('min-h-11 px-3', 'touch-manipulation'),
                                onClick: p,
                                'aria-label': x('common.save'),
                                children: [
                                  e.jsx(ne, { className: l('h-4 w-4', m ? 'ms-1' : 'me-1') }),
                                  e.jsx('span', {
                                    className: 'text-xs sm:text-sm',
                                    children: x('common.save'),
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  })
                : e.jsx('p', {
                    className: l(
                      'text-sm text-slate-600 dark:text-slate-300',
                      'whitespace-pre-wrap',
                      'text-start',
                      m && 'text-end',
                    ),
                    children: s.notes,
                  }),
            }),
        ],
      }),
      e.jsx(He, {
        open: _,
        onOpenChange: L,
        children: e.jsxs(Ye, {
          className: l('max-w-md mx-4 sm:mx-auto', m && 'text-end'),
          children: [
            e.jsxs(We, {
              children: [
                e.jsx(Ze, {
                  className: 'text-start',
                  children: x('entityLinks.deleteConfirmTitle'),
                }),
                e.jsx(Xe, {
                  className: 'text-start',
                  children: x('entityLinks.deleteConfirmDescription'),
                }),
              ],
            }),
            e.jsxs(es, {
              className: l(m && 'flex-row-reverse'),
              children: [
                e.jsx(ss, { className: ' touch-manipulation', children: x('common.cancel') }),
                e.jsx(ts, {
                  className: ' touch-manipulation bg-red-600 hover:bg-red-700',
                  onClick: A,
                  children: x('common.delete'),
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  })
}
function ye({
  intakeId: s,
  links: t,
  showDeleted: i = !1,
  canRestore: a = !1,
  enableReorder: n = !1,
  onDelete: c,
  onRestore: d,
  onUpdateNotes: r,
  className: x,
}) {
  const { t: g, i18n: m } = q()
  m.language
  const j = ys(s),
    k = [
      ...(i ? t.filter((p) => p.deleted_at !== null) : t.filter((p) => p.deleted_at === null)),
    ].sort((p, N) => p.link_order - N.link_order),
    D = f.useCallback((p, N) => {
      ;((p.dataTransfer.effectAllowed = 'move'), p.dataTransfer.setData('text/plain', N))
    }, []),
    _ = f.useCallback((p) => {
      ;(p.preventDefault(), (p.dataTransfer.dropEffect = 'move'))
    }, []),
    L = f.useCallback(
      (p, N) => {
        p.preventDefault()
        const A = p.dataTransfer.getData('text/plain')
        if (A === N) return
        const P = k.findIndex((b) => b.id === A),
          E = k.findIndex((b) => b.id === N)
        if (P === -1 || E === -1) return
        const u = [...k],
          [M] = u.splice(P, 1)
        u.splice(E, 0, M)
        const h = u.map((b, $) => ({ link_id: b.id, link_order: $ + 1 }))
        j.mutate(h)
      },
      [k, j],
    )
  return k.length === 0
    ? e.jsx('div', {
        className: l('text-center py-8 sm:py-12', x),
        children: e.jsx('p', {
          className: 'text-sm sm:text-base text-slate-500',
          children: g(i ? 'entityLinks.noDeletedLinks' : 'entityLinks.noLinks'),
        }),
      })
    : e.jsxs('div', {
        className: l('flex flex-col gap-3 sm:gap-4', 'w-full', x),
        role: 'list',
        'aria-label': g('entityLinks.linkList'),
        children: [
          k.map((p) =>
            e.jsx(
              'div',
              {
                draggable: n && !i,
                onDragStart: (N) => n && D(N, p.id),
                onDragOver: n ? _ : void 0,
                onDrop: (N) => n && L(N, p.id),
                className: l(n && !i && 'cursor-move'),
                role: 'listitem',
                children: e.jsx(Ns, {
                  link: p,
                  isDeleted: i,
                  canRestore: a,
                  isDraggable: n && !i,
                  onDelete: c,
                  onRestore: d,
                  onUpdateNotes: r,
                }),
              },
              p.id,
            ),
          ),
          n &&
            !i &&
            k.length > 1 &&
            e.jsx('p', {
              className: l('text-xs text-slate-500 text-center', 'mt-2', 'hidden sm:block'),
              children: g('entityLinks.reorderHint'),
            }),
        ],
      })
}
function vs(s, t = {}) {
  const { t: i } = q()
  return Z({
    queryKey: ['ai-suggestions', s, t.entity_types],
    queryFn: async () => {
      const a = {
        entity_types: t.entity_types || ['dossier', 'position', 'organization', 'country'],
        max_suggestions: t.max_suggestions || 5,
      }
      return await Q.ai.generateSuggestions(s, a)
    },
    enabled: t.enabled !== !1,
    staleTime: 60 * 1e3,
    gcTime: 5 * 60 * 1e3,
    retry: (a, n) => (n.status === 503 || n.status === 429 ? !1 : a < 2),
    retryDelay: (a) => Math.min(1e3 * 2 ** a, 5e3),
    meta: {
      errorMessage: i('entityLinks.aiSuggestions.error', 'Failed to generate AI suggestions'),
    },
  })
}
function ws(s) {
  const t = I(),
    { t: i } = q()
  return O({
    mutationFn: async (a) => await Q.ai.acceptSuggestion(s, a),
    onSuccess: (a, n) => {
      ;(t.invalidateQueries({ queryKey: ['entity-links', s] }),
        t.invalidateQueries({ queryKey: ['ai-suggestions', s] }))
    },
    onError: (a) => {},
    meta: {
      successMessage: i(
        'entityLinks.aiSuggestions.accepted',
        'AI suggestion accepted and link created',
      ),
      errorMessage: i('entityLinks.aiSuggestions.acceptError', 'Failed to accept suggestion'),
    },
  })
}
function Ls(s) {
  return {
    trackSuggestionGenerated: (n, c) => {},
    trackSuggestionAccepted: (n, c, d, r) => {},
    trackFallbackToManualSearch: (n) => {},
  }
}
function _s({ intakeId: s, onManualSearchClick: t, onSuggestionAccepted: i }) {
  const { t: a, i18n: n } = q(),
    c = n.language === 'ar',
    [d, r] = f.useState(!1),
    [x, g] = f.useState(null),
    m = Ls(),
    { data: j, isLoading: w, error: k, refetch: D } = vs(s, { enabled: d }),
    _ = ws(s)
  ;(f.useEffect(() => {
    d && !x && g(Date.now())
  }, [d, x]),
    f.useEffect(() => {
      j && x && m.trackSuggestionGenerated(j.suggestions.length, j.metadata?.cache_hit ?? !1)
    }, [j, x, m]))
  const L = () => {
      ;(r(!0), g(Date.now()))
    },
    p = (u) => {
      const M = Date.now()
      _.mutate(
        {
          suggestion_id: u.suggestion_id,
          entity_id: u.entity_id,
          entity_type: u.entity_type,
          link_type: u.suggested_link_type,
        },
        {
          onSuccess: (h) => {
            const b = Date.now() - M
            ;(m.trackSuggestionAccepted(u.suggestion_id, u.rank, u.confidence_score, b), i(h.link))
          },
        },
      )
    },
    N = () => {
      ;(m.trackFallbackToManualSearch('user_clicked_manual_search'), t())
    },
    A = (u) => `${Math.round(u * 100)}%`,
    P = (u) => (u >= 0.85 ? 'default' : u >= 0.75 ? 'secondary' : 'destructive')
  if (!d)
    return e.jsxs(B, {
      className: 'w-full',
      children: [
        e.jsxs(K, {
          children: [
            e.jsxs(V, {
              className: 'flex items-center gap-2 text-start',
              children: [
                e.jsx(ee, { className: `h-5 w-5 text-purple-500 ${c ? 'ms-2' : 'me-2'}` }),
                a('entityLinks.aiSuggestions.title', 'AI-Powered Suggestions'),
              ],
            }),
            e.jsx(W, {
              className: 'text-start',
              children: a(
                'entityLinks.aiSuggestions.description',
                'Let AI analyze your intake content and suggest relevant entities to link',
              ),
            }),
          ],
        }),
        e.jsx(R, {
          children: e.jsxs(S, {
            onClick: L,
            className: 'w-full sm:w-auto px-4',
            variant: 'default',
            children: [
              e.jsx(ee, { className: `h-4 w-4 ${c ? 'ms-2' : 'me-2'}` }),
              a('entityLinks.aiSuggestions.getButton', 'Get AI Suggestions'),
            ],
          }),
        }),
      ],
    })
  if (w)
    return e.jsxs(B, {
      className: 'w-full',
      children: [
        e.jsxs(K, {
          children: [
            e.jsxs(V, {
              className: 'flex items-center gap-2 text-start',
              children: [
                e.jsx(te, {
                  className: `h-5 w-5 animate-spin text-purple-500 ${c ? 'ms-2' : 'me-2'}`,
                }),
                a('entityLinks.aiSuggestions.loading', 'Analyzing intake content...'),
              ],
            }),
            e.jsx(W, {
              className: 'text-start',
              children: a(
                'entityLinks.aiSuggestions.loadingDescription',
                'This usually takes 2-3 seconds',
              ),
            }),
          ],
        }),
        e.jsx(R, {
          children: e.jsx('div', {
            className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
            children: [1, 2, 3].map((u) =>
              e.jsxs(
                B,
                {
                  className: 'p-4',
                  children: [
                    e.jsx(H, { className: 'h-6 w-3/4 mb-2' }),
                    e.jsx(H, { className: 'h-4 w-1/2 mb-4' }),
                    e.jsx(H, { className: 'h-16 w-full mb-2' }),
                    e.jsx(H, { className: 'h-10 w-full' }),
                  ],
                },
                u,
              ),
            ),
          }),
        }),
      ],
    })
  if (k) {
    const u = k.response?.data,
      M = u?.fallback === 'manual_search'
    return e.jsxs(B, {
      className: 'w-full',
      children: [
        e.jsx(K, {
          children: e.jsxs(V, {
            className: 'flex items-center gap-2 text-start text-destructive',
            children: [
              e.jsx(Be, { className: `h-5 w-5 ${c ? 'ms-2' : 'me-2'}` }),
              a('entityLinks.aiSuggestions.error', 'AI Service Unavailable'),
            ],
          }),
        }),
        e.jsxs(R, {
          className: 'space-y-4',
          children: [
            e.jsx(fe, {
              variant: 'destructive',
              children: e.jsx(ke, {
                className: 'text-start',
                children:
                  u?.details ||
                  a(
                    'entityLinks.aiSuggestions.errorDescription',
                    'Unable to generate AI suggestions at this time',
                  ),
              }),
            }),
            M &&
              e.jsxs('div', {
                className: 'flex flex-col sm:flex-row gap-2',
                children: [
                  e.jsxs(S, {
                    onClick: N,
                    variant: 'default',
                    className: 'flex-1 ',
                    children: [
                      e.jsx(Y, { className: `h-4 w-4 ${c ? 'ms-2' : 'me-2'}` }),
                      a('entityLinks.aiSuggestions.manualSearch', 'Use Manual Search'),
                    ],
                  }),
                  u?.retry_after &&
                    e.jsxs(S, {
                      onClick: () => {
                        ;(r(!1), setTimeout(() => r(!0), 1e3))
                      },
                      variant: 'outline',
                      className: '',
                      children: [
                        e.jsx(te, { className: `h-4 w-4 ${c ? 'ms-2' : 'me-2'}` }),
                        a('entityLinks.aiSuggestions.retry', 'Retry'),
                      ],
                    }),
                ],
              }),
          ],
        }),
      ],
    })
  }
  const E = j?.suggestions || []
  return E.length === 0
    ? e.jsxs(B, {
        className: 'w-full',
        children: [
          e.jsxs(K, {
            children: [
              e.jsx(V, {
                className: 'text-start',
                children: a('entityLinks.aiSuggestions.noResults', 'No Suggestions Found'),
              }),
              e.jsx(W, {
                className: 'text-start',
                children: a(
                  'entityLinks.aiSuggestions.noResultsDescription',
                  'AI could not find relevant entities. Try manual search.',
                ),
              }),
            ],
          }),
          e.jsx(R, {
            children: e.jsxs(S, {
              onClick: N,
              variant: 'default',
              className: 'w-full sm:w-auto ',
              children: [
                e.jsx(Y, { className: `h-4 w-4 ${c ? 'ms-2' : 'me-2'}` }),
                a('entityLinks.aiSuggestions.manualSearch', 'Use Manual Search'),
              ],
            }),
          }),
        ],
      })
    : e.jsxs(B, {
        className: 'w-full',
        children: [
          e.jsxs(K, {
            children: [
              e.jsxs(V, {
                className: 'flex items-center gap-2 text-start',
                children: [
                  e.jsx(je, { className: `h-5 w-5 text-green-500 ${c ? 'ms-2' : 'me-2'}` }),
                  a('entityLinks.aiSuggestions.resultsTitle', 'AI Suggestions'),
                ],
              }),
              e.jsx(W, {
                className: 'text-start',
                children: a('entityLinks.aiSuggestions.resultsDescription', {
                  count: E.length,
                  defaultValue: `Found ${E.length} relevant entities. Click to create link.`,
                }),
              }),
            ],
          }),
          e.jsxs(R, {
            children: [
              e.jsx('div', {
                className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
                children: E.map((u) =>
                  e.jsx(
                    B,
                    {
                      className: 'p-4 hover:border-primary transition-colors',
                      children: e.jsxs('div', {
                        className: 'space-y-3',
                        children: [
                          e.jsxs('div', {
                            children: [
                              e.jsx('h4', {
                                className:
                                  'font-semibold text-start text-sm sm:text-base line-clamp-2',
                                children: u.entity_name,
                              }),
                              e.jsx('p', {
                                className: 'text-xs text-muted-foreground text-start mt-1',
                                children: a(`entityTypes.${u.entity_type}`, u.entity_type),
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            className: 'flex items-center gap-2',
                            children: [
                              e.jsx(G, {
                                variant: P(u.confidence_score),
                                children: A(u.confidence_score),
                              }),
                              e.jsx('span', {
                                className: 'text-xs text-muted-foreground',
                                children: a('entityLinks.aiSuggestions.confidence', 'Confidence'),
                              }),
                            ],
                          }),
                          e.jsx('p', {
                            className: 'text-xs text-muted-foreground text-start line-clamp-3',
                            children: u.reasoning,
                          }),
                          e.jsx(S, {
                            onClick: () => p(u),
                            disabled: _.isPending,
                            className: 'w-full ',
                            size: 'sm',
                            children: _.isPending
                              ? e.jsxs(e.Fragment, {
                                  children: [
                                    e.jsx(te, {
                                      className: `h-3 w-3 animate-spin ${c ? 'ms-2' : 'me-2'}`,
                                    }),
                                    a('entityLinks.aiSuggestions.accepting', 'Creating...'),
                                  ],
                                })
                              : e.jsxs(e.Fragment, {
                                  children: [
                                    a('entityLinks.aiSuggestions.accept', 'Create Link'),
                                    u.rank === 1 && ' (Primary)',
                                  ],
                                }),
                          }),
                        ],
                      }),
                    },
                    u.suggestion_id,
                  ),
                ),
              }),
              e.jsx('div', {
                className: 'mt-4 pt-4 border-t',
                children: e.jsxs(S, {
                  onClick: N,
                  variant: 'outline',
                  className: 'w-full sm:w-auto ',
                  children: [
                    e.jsx(Y, { className: `h-4 w-4 ${c ? 'ms-2' : 'me-2'}` }),
                    a('entityLinks.aiSuggestions.stillUseManualSearch', 'Or use manual search'),
                  ],
                }),
              }),
            ],
          }),
        ],
      })
}
const U = 'http://localhost:5001/api',
  we = { dossier: de, position: Ge, person: Re, engagement: Ke, commitment: ne }
function Ss({ ticketId: s, onLinkClick: t, className: i }) {
  const { t: a, i18n: n } = q('entity-linking'),
    c = n.language === 'ar',
    d = I(),
    [r, x] = f.useState(!1),
    { data: g, isLoading: m } = Z({
      queryKey: ['entity-proposals', s],
      queryFn: async () => {
        const {
            data: { session: h },
          } = await J.auth.getSession(),
          b = await fetch(`${U}/ai/intake/${s}/proposals?status=pending_approval`, {
            headers: { Authorization: `Bearer ${h?.access_token}` },
          })
        if (!b.ok) throw new Error('Failed to fetch proposals')
        return (await b.json()).data
      },
    }),
    { data: j, isLoading: w } = Z({
      queryKey: ['entity-links', s],
      queryFn: async () => {
        const {
            data: { session: h },
          } = await J.auth.getSession(),
          b = await fetch(`${U}/ai/intake/${s}/links`, {
            headers: { Authorization: `Bearer ${h?.access_token}` },
          })
        if (!b.ok) throw new Error('Failed to fetch links')
        return (await b.json()).data
      },
    }),
    k = O({
      mutationFn: async () => {
        const {
            data: { session: h },
          } = await J.auth.getSession(),
          b = await fetch(`${U}/ai/intake/${s}/propose-links`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${h?.access_token}`,
            },
            body: JSON.stringify({ language: n.language }),
          })
        if (!b.ok) throw new Error('Failed to generate proposals')
        return b.json()
      },
      onSuccess: () => {
        d.invalidateQueries({ queryKey: ['entity-proposals', s] })
      },
    }),
    D = O({
      mutationFn: async (h) => {
        const {
            data: { session: b },
          } = await J.auth.getSession(),
          $ = await fetch(`${U}/ai/proposals/${h}/approve`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${b?.access_token}` },
          })
        if (!$.ok) throw new Error('Failed to approve proposal')
        return $.json()
      },
      onSuccess: () => {
        ;(d.invalidateQueries({ queryKey: ['entity-proposals', s] }),
          d.invalidateQueries({ queryKey: ['entity-links', s] }))
      },
    }),
    _ = O({
      mutationFn: async (h) => {
        const {
            data: { session: b },
          } = await J.auth.getSession(),
          $ = await fetch(`${U}/ai/proposals/${h}/reject`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${b?.access_token}`,
            },
            body: JSON.stringify({}),
          })
        if (!$.ok) throw new Error('Failed to reject proposal')
        return $.json()
      },
      onSuccess: () => {
        d.invalidateQueries({ queryKey: ['entity-proposals', s] })
      },
    }),
    L = O({
      mutationFn: async (h) => {
        const {
            data: { session: b },
          } = await J.auth.getSession(),
          $ = await fetch(`${U}/ai/intake/links/${h}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${b?.access_token}` },
          })
        if (!$.ok) throw new Error('Failed to delete link')
        return $.json()
      },
      onSuccess: () => {
        d.invalidateQueries({ queryKey: ['entity-links', s] })
      },
    }),
    p = async () => {
      x(!0)
      try {
        await k.mutateAsync()
      } finally {
        x(!1)
      }
    },
    N = (h) => (h >= 90 ? 'bg-green-500' : h >= 70 ? 'bg-yellow-500' : 'bg-orange-500'),
    A = (h) =>
      h >= 90
        ? a('confidence.high', 'High')
        : h >= 70
          ? a('confidence.medium', 'Medium')
          : a('confidence.low', 'Low'),
    P = m || w,
    E = g?.filter((h) => h.status === 'pending_approval') || [],
    u = E.length > 0,
    M = (j?.length || 0) > 0
  return e.jsxs(B, {
    className: l('w-full', i),
    dir: c ? 'rtl' : 'ltr',
    children: [
      e.jsxs(K, {
        className: 'pb-3',
        children: [
          e.jsxs('div', {
            className: 'flex items-center justify-between',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-2',
                children: [
                  e.jsx(he, { className: 'h-5 w-5 text-primary' }),
                  e.jsx(V, { className: 'text-lg', children: a('title', 'Entity Links') }),
                ],
              }),
              e.jsxs(S, {
                variant: 'outline',
                size: 'sm',
                onClick: p,
                disabled: r || k.isPending,
                children: [
                  r || k.isPending
                    ? e.jsx(X, { className: 'h-4 w-4 me-1 animate-spin' })
                    : e.jsx(ee, { className: l('h-4 w-4 me-1', c && 'rotate-180') }),
                  a('suggestLinks', 'Suggest Links'),
                ],
              }),
            ],
          }),
          e.jsx(W, { children: a('description', 'AI-suggested and manually linked entities') }),
        ],
      }),
      e.jsx(R, {
        className: 'space-y-4',
        children: P
          ? e.jsxs('div', {
              className: 'space-y-3',
              children: [
                e.jsx(H, { className: 'h-16 w-full' }),
                e.jsx(H, { className: 'h-16 w-full' }),
              ],
            })
          : e.jsxs(e.Fragment, {
              children: [
                u &&
                  e.jsxs('div', {
                    className: 'space-y-3',
                    children: [
                      e.jsxs('h4', {
                        className:
                          'text-sm font-medium text-muted-foreground flex items-center gap-2',
                        children: [
                          e.jsx(ee, { className: 'h-4 w-4' }),
                          a('pendingProposals', 'AI Suggestions'),
                          ' (',
                          E.length,
                          ')',
                        ],
                      }),
                      E.map((h) =>
                        e.jsx(
                          Cs,
                          {
                            proposal: h,
                            isRTL: c,
                            onApprove: () => D.mutate(h.id),
                            onReject: () => _.mutate(h.id),
                            isApproving: D.isPending,
                            isRejecting: _.isPending,
                            getConfidenceColor: N,
                            getConfidenceLabel: A,
                            t: a,
                          },
                          h.id,
                        ),
                      ),
                    ],
                  }),
                M &&
                  e.jsxs('div', {
                    className: 'space-y-3',
                    children: [
                      e.jsxs('h4', {
                        className:
                          'text-sm font-medium text-muted-foreground flex items-center gap-2',
                        children: [
                          e.jsx(ne, { className: 'h-4 w-4' }),
                          a('linkedEntities', 'Linked Entities'),
                          ' (',
                          j?.length,
                          ')',
                        ],
                      }),
                      j?.map((h) =>
                        e.jsx(
                          Ts,
                          {
                            link: h,
                            onDelete: () => L.mutate(h.id),
                            onClick: () => t?.(h.entity_type, h.entity_id),
                            isDeleting: L.isPending,
                          },
                          h.id,
                        ),
                      ),
                    ],
                  }),
                !u &&
                  !M &&
                  e.jsxs('div', {
                    className: 'text-center py-8 text-muted-foreground',
                    children: [
                      e.jsx(he, { className: 'h-12 w-12 mx-auto mb-3 opacity-50' }),
                      e.jsx('p', {
                        className: 'text-sm',
                        children: a('noLinks', 'No linked entities yet'),
                      }),
                      e.jsx('p', {
                        className: 'text-xs mt-1',
                        children: a(
                          'noLinksHint',
                          'Click "Suggest Links" to get AI recommendations',
                        ),
                      }),
                    ],
                  }),
                k.isError &&
                  e.jsx(fe, {
                    variant: 'destructive',
                    children: e.jsxs(ke, {
                      className: 'flex items-center justify-between',
                      children: [
                        e.jsx('span', {
                          children: a('errors.generateFailed', 'Failed to generate suggestions'),
                        }),
                        e.jsxs(S, {
                          variant: 'ghost',
                          size: 'sm',
                          onClick: p,
                          children: [e.jsx(te, { className: 'h-4 w-4 me-1' }), a('retry', 'Retry')],
                        }),
                      ],
                    }),
                  }),
              ],
            }),
      }),
    ],
  })
}
function Cs({
  proposal: s,
  isRTL: t,
  onApprove: i,
  onReject: a,
  isApproving: n,
  isRejecting: c,
  getConfidenceColor: d,
  getConfidenceLabel: r,
  t: x,
}) {
  const g = we[s.entity_type] || de
  return e.jsx('div', {
    className: 'border rounded-lg p-3 bg-muted/30 space-y-2',
    children: e.jsxs('div', {
      className: 'flex items-start justify-between gap-2',
      children: [
        e.jsxs('div', {
          className: 'flex items-start gap-2 flex-1',
          children: [
            e.jsx('div', {
              className: 'p-1.5 rounded bg-primary/10',
              children: e.jsx(g, { className: 'h-4 w-4 text-primary' }),
            }),
            e.jsxs('div', {
              className: 'flex-1 min-w-0',
              children: [
                e.jsxs('div', {
                  className: 'flex items-center gap-2',
                  children: [
                    e.jsx(G, {
                      variant: 'outline',
                      className: 'text-xs capitalize',
                      children: s.entity_type,
                    }),
                    e.jsx(as, {
                      children: e.jsxs(ns, {
                        children: [
                          e.jsx(is, {
                            asChild: !0,
                            children: e.jsxs('div', {
                              className: 'flex items-center gap-1',
                              children: [
                                e.jsx(Pe, {
                                  value: s.confidence_score,
                                  className: l('h-2 w-16', d(s.confidence_score)),
                                }),
                                e.jsxs('span', {
                                  className: 'text-xs text-muted-foreground',
                                  children: [s.confidence_score, '%'],
                                }),
                              ],
                            }),
                          }),
                          e.jsxs(rs, {
                            children: [
                              r(s.confidence_score),
                              ' ',
                              x('confidence.label', 'confidence'),
                            ],
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                e.jsx('p', {
                  className: 'text-xs text-muted-foreground mt-1 line-clamp-2',
                  children: s.justification,
                }),
              ],
            }),
          ],
        }),
        e.jsxs('div', {
          className: 'flex items-center gap-1 shrink-0',
          children: [
            e.jsx(S, {
              variant: 'ghost',
              size: 'icon',
              className: 'h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100',
              onClick: i,
              disabled: n || c,
              children: n
                ? e.jsx(X, { className: 'h-4 w-4 animate-spin' })
                : e.jsx(ne, { className: 'h-4 w-4' }),
            }),
            e.jsx(S, {
              variant: 'ghost',
              size: 'icon',
              className: 'h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100',
              onClick: a,
              disabled: n || c,
              children: c
                ? e.jsx(X, { className: 'h-4 w-4 animate-spin' })
                : e.jsx(oe, { className: 'h-4 w-4' }),
            }),
          ],
        }),
      ],
    }),
  })
}
function Ts({ link: s, onDelete: t, onClick: i, isDeleting: a }) {
  const n = we[s.entity_type] || de
  return e.jsxs('div', {
    className:
      'border rounded-lg p-3 flex items-center justify-between gap-2 hover:bg-muted/30 transition-colors',
    children: [
      e.jsxs('div', {
        className: 'flex items-center gap-2 flex-1 cursor-pointer',
        onClick: i,
        children: [
          e.jsx('div', {
            className: 'p-1.5 rounded bg-primary/10',
            children: e.jsx(n, { className: 'h-4 w-4 text-primary' }),
          }),
          e.jsx('div', {
            className: 'flex-1 min-w-0',
            children: e.jsxs('div', {
              className: 'flex items-center gap-2',
              children: [
                e.jsx('span', {
                  className: 'text-sm font-medium truncate',
                  children: s.entity_name || s.entity_id.substring(0, 8),
                }),
                e.jsx(G, {
                  variant: 'outline',
                  className: 'text-xs capitalize',
                  children: s.entity_type,
                }),
                s.is_ai_suggested &&
                  e.jsxs(G, {
                    variant: 'secondary',
                    className: 'text-xs',
                    children: [e.jsx(ee, { className: 'h-3 w-3 me-1' }), 'AI'],
                  }),
              ],
            }),
          }),
          i && e.jsx(Ie, { className: 'h-4 w-4 text-muted-foreground' }),
        ],
      }),
      e.jsx(S, {
        variant: 'ghost',
        size: 'icon',
        className: 'h-8 w-8 text-muted-foreground hover:text-destructive',
        onClick: (c) => {
          ;(c.stopPropagation(), t())
        },
        disabled: a,
        children: a
          ? e.jsx(X, { className: 'h-4 w-4 animate-spin' })
          : e.jsx(be, { className: 'h-4 w-4' }),
      }),
    ],
  })
}
function Ks({
  intakeId: s,
  organizationId: t,
  classificationLevel: i,
  canRestore: a = !1,
  enableReorder: n = !1,
  useAgentSuggestions: c = !0,
  className: d,
}) {
  const { t: r, i18n: x } = q(),
    g = x.language === 'ar',
    m = Le(),
    [j, w] = f.useState(!1),
    [k, D] = f.useState('active'),
    { data: _ = [], isLoading: L, error: p } = ve(s, k === 'deleted'),
    N = hs(s),
    A = fs(s),
    P = gs(s),
    E = ps(s),
    u = f.useMemo(() => _.filter((o) => o.deleted_at === null), [_]),
    M = f.useMemo(() => _.filter((o) => o.deleted_at !== null), [_]),
    h = async (o, y) => {
      const C = u.find((T) => T.link_type === 'primary')
      if (y && C)
        try {
          await Q.updateLink(s, C.id, { link_type: 'related' })
        } catch (T) {
          console.error('[EntityLinkManager] Failed to demote existing primary:', T)
        }
      const F = o.map((T) => {
        let le = 'related'
        return (
          T._shouldBePrimary
            ? (y || !C) && (le = 'primary')
            : !C &&
              !y &&
              !o.some((se) => se._shouldBePrimary) &&
              (T.entity_type === 'dossier' || T.entity_type === 'position') &&
              o.indexOf(T) ===
                o.findIndex(
                  (se) => se.entity_type === 'dossier' || se.entity_type === 'position',
                ) &&
              (le = 'primary'),
          { entity_type: T.entity_type, entity_id: T.entity_id, link_type: le, notes: '' }
        )
      })
      F.length === 1 ? N.mutate(F[0]) : F.length > 1 && A.mutate(F)
    },
    b = (o) => {
      P.mutate(o)
    },
    $ = (o) => {
      E.mutate(o)
    },
    ie = async (o, y) => {
      try {
        await Q.updateLink(s, o, { notes: y })
      } catch (C) {
        console.error('[EntityLinkManager] Failed to update notes:', C)
      }
    },
    re = (o, y) => {
      switch (o) {
        case 'dossier':
          m({ to: '/dossiers/$id', params: { id: y } })
          break
        case 'position':
          m({ to: '/positions/$id', params: { id: y } })
          break
        case 'person':
          m({ to: '/persons/$id', params: { id: y } })
          break
        case 'engagement':
          m({ to: '/engagements/$engagementId', params: { engagementId: y } })
          break
        case 'commitment':
          m({ to: '/commitments', search: { id: y } })
          break
        default:
          m({ to: '/search', search: { q: y, type: o, includeArchived: !1 } })
      }
    }
  return e.jsxs('div', {
    className: l('w-full', d),
    'aria-label': r('entityLinks.manager'),
    children: [
      e.jsxs('div', {
        className: l(
          'flex items-center justify-between',
          'mb-4 sm:mb-6',
          'gap-3 sm:gap-4',
          g && 'flex-row-reverse',
        ),
        children: [
          e.jsxs('div', {
            className: l('flex items-center gap-2', g && 'flex-row-reverse'),
            children: [
              e.jsx(Je, { className: 'h-5 w-5 sm:h-6 sm:w-6 text-slate-600 dark:text-slate-400' }),
              e.jsx('h2', {
                className: l(
                  'text-lg sm:text-xl font-semibold',
                  'text-slate-900 dark:text-slate-100',
                  'text-start',
                ),
                children: r('entityLinks.title'),
              }),
            ],
          }),
          e.jsxs(S, {
            variant: 'default',
            className: l('px-4 sm:px-6', 'touch-manipulation', 'text-sm sm:text-base'),
            onClick: () => w(!0),
            disabled: L || N.isPending,
            'aria-label': r('entityLinks.addLink'),
            children: [
              e.jsx(Ue, { className: l('h-4 w-4 sm:h-5 sm:w-5', g ? 'ms-2' : 'me-2') }),
              e.jsx('span', { className: 'hidden sm:inline', children: r('entityLinks.addLink') }),
              e.jsx('span', { className: 'sm:hidden', children: r('entityLinks.add') }),
            ],
          }),
        ],
      }),
      e.jsx('div', {
        className: 'mb-6 sm:mb-8',
        children: c
          ? e.jsx(Ss, { ticketId: s, onLinkClick: re })
          : e.jsx(_s, {
              intakeId: s,
              onManualSearchClick: () => w(!0),
              onSuggestionAccepted: (o) => {},
            }),
      }),
      e.jsxs(Fe, {
        value: k,
        onValueChange: (o) => D(o),
        className: 'w-full',
        children: [
          e.jsxs(Me, {
            className: l('w-full sm:w-auto', 'grid grid-cols-2 sm:inline-grid', 'mb-4 sm:mb-6'),
            children: [
              e.jsx(ue, {
                value: 'active',
                className: l('touch-manipulation', 'text-sm sm:text-base'),
                children: e.jsxs('span', {
                  className: l(g && 'ms-2'),
                  children: [r('entityLinks.activeLinks'), ' (', u.length, ')'],
                }),
              }),
              e.jsxs(ue, {
                value: 'deleted',
                className: l('touch-manipulation', 'text-sm sm:text-base'),
                children: [
                  e.jsx(Ve, {
                    className: l('h-4 w-4', M.length > 0 && 'text-red-600', g ? 'ms-2' : 'me-2'),
                  }),
                  e.jsxs('span', {
                    children: [r('entityLinks.deletedLinks'), ' (', M.length, ')'],
                  }),
                ],
              }),
            ],
          }),
          e.jsxs(xe, {
            value: 'active',
            className: 'mt-0',
            children: [
              L &&
                e.jsx('div', {
                  className: 'flex items-center justify-center py-8 sm:py-12',
                  children: e.jsx('div', {
                    className: 'animate-pulse text-slate-400',
                    children: r('common.loading'),
                  }),
                }),
              p &&
                e.jsx('div', {
                  className: 'text-center py-8 sm:py-12',
                  children: e.jsx('p', {
                    className: 'text-sm sm:text-base text-red-600',
                    children: r('entityLinks.loadError'),
                  }),
                }),
              !L &&
                !p &&
                e.jsx(ye, {
                  intakeId: s,
                  links: u,
                  showDeleted: !1,
                  enableReorder: n,
                  onDelete: b,
                  onUpdateNotes: ie,
                }),
            ],
          }),
          e.jsxs(xe, {
            value: 'deleted',
            className: 'mt-0',
            children: [
              L &&
                e.jsx('div', {
                  className: 'flex items-center justify-center py-8 sm:py-12',
                  children: e.jsx('div', {
                    className: 'animate-pulse text-slate-400',
                    children: r('common.loading'),
                  }),
                }),
              p &&
                e.jsx('div', {
                  className: 'text-center py-8 sm:py-12',
                  children: e.jsx('p', {
                    className: 'text-sm sm:text-base text-red-600',
                    children: r('entityLinks.loadError'),
                  }),
                }),
              !L &&
                !p &&
                e.jsx(ye, { intakeId: s, links: M, showDeleted: !0, canRestore: a, onRestore: $ }),
            ],
          }),
        ],
      }),
      e.jsx(js, {
        open: j,
        onOpenChange: w,
        onSelect: h,
        intakeId: s,
        organizationId: t,
        classificationLevel: i,
        includeArchived: !1,
      }),
    ],
  })
}
export { Ks as EntityLinkManager, Ks as default }
//# sourceMappingURL=EntityLinkManager-HzbH6mRj.js.map
