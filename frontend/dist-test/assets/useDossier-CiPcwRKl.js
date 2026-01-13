import { a as c, c as g, d as w } from './tanstack-vendor-BZC-rs5U.js'
import { s as h } from './index-qYY0KoZ1.js'
import { aP as f } from './vendor-misc-BiJvMP0A.js'
import { u as D } from './react-vendor-Buoak6m3.js'
const u = 'https://zkrcjzdemdmwhearhfgg.supabase.co'
class y extends Error {
  code
  status
  details
  constructor(e, t, r, o) {
    ;(super(e),
      (this.name = 'DossierAPIError'),
      (this.code = r),
      (this.status = t),
      (this.details = o))
  }
}
async function d() {
  const {
    data: { session: s },
  } = await h.auth.getSession()
  if (!s) throw new y('Not authenticated', 401, 'AUTH_REQUIRED')
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${s.access_token}` }
}
async function l(s) {
  if (!s.ok) {
    let e
    try {
      e = await s.json()
    } catch {
      e = { message: s.statusText }
    }
    throw new y(e.message || 'API request failed', s.status, e.code || 'API_ERROR', e.details)
  }
  return s.json()
}
async function E(s) {
  const e = await d(),
    t = await fetch(`${u}/functions/v1/dossiers-create`, {
      method: 'POST',
      headers: e,
      body: JSON.stringify(s),
    })
  return l(t)
}
async function m(s, e) {
  const t = await d(),
    r = e && e.length > 0 ? `&include=${e.join(',')}` : '',
    o = await fetch(`${u}/functions/v1/dossiers-get?id=${s}${r}`, { method: 'GET', headers: t })
  return l(o)
}
async function p(s) {
  const e = await d(),
    t = new URLSearchParams()
  s &&
    Object.entries(s).forEach(([i, a]) => {
      a != null && (Array.isArray(a) ? t.append(i, JSON.stringify(a)) : t.append(i, String(a)))
    })
  const r = `${u}/functions/v1/dossiers-list${t.toString() ? `?${t.toString()}` : ''}`,
    o = await fetch(r, { method: 'GET', headers: e })
  return l(o)
}
async function T(s, e, t) {
  return p({ type: s, page: e, page_size: t })
}
async function q() {
  const { data: s, error: e } = await h
    .from('dossiers')
    .select('type, status')
    .not('status', 'eq', 'deleted')
  if (e) throw new y(e.message || 'Failed to fetch dossier counts', 500, 'COUNTS_FETCH_FAILED', e)
  const t = ['country', 'organization', 'forum', 'engagement', 'topic', 'working_group', 'person'],
    r = {}
  return (
    t.forEach((o) => {
      r[o] = { type: o, total: 0, active: 0, inactive: 0, archived: 0 }
    }),
    s?.forEach((o) => {
      const i = o.type,
        a = o.status
      r[i] &&
        (r[i].total++,
        a === 'active'
          ? r[i].active++
          : a === 'inactive'
            ? r[i].inactive++
            : a === 'archived' && r[i].archived++)
    }),
    r
  )
}
const n = {
  all: ['dossiers'],
  lists: () => [...n.all, 'list'],
  list: (s) => [...n.lists(), { filters: s }],
  details: () => [...n.all, 'detail'],
  detail: (s) => [...n.details(), s],
  byType: (s, e, t) => [...n.all, 'type', s, { page: e, page_size: t }],
}
function S(s, e, t) {
  return c({ queryKey: [...n.detail(s), { include: e }], queryFn: () => m(s, e), ...t })
}
function b(s, e) {
  return c({ queryKey: n.list(s), queryFn: () => p(s), ...e })
}
function K(s, e, t, r) {
  return c({ queryKey: n.byType(s, e, t), queryFn: () => T(s, e, t), ...r })
}
function P() {
  const s = g(),
    { t: e } = D()
  return w({
    mutationFn: (t) => E(t),
    onSuccess: (t) => {
      ;(s.invalidateQueries({ queryKey: n.lists() }),
        s.invalidateQueries({ queryKey: n.byType(t.type) }),
        s.setQueryData(n.detail(t.id), t),
        f.success(e('dossier.create.success', { name: t.name_en })))
    },
    onError: (t) => {
      f.error(e('dossier.create.error', { message: t.message }))
    },
  })
}
function R(s, e, t) {
  const r = getTypeGuard(e)
  return c({
    queryKey: [...n.detail(s), { expectedType: e }],
    queryFn: async () => {
      const o = await m(s)
      if (!validateDossierType(o, e)) throw new Error(`Type mismatch: expected ${e}, got ${o.type}`)
      if (!r(o)) throw new Error(`Type guard failed for dossier ${s} with type ${e}`)
      return o
    },
    ...t,
  })
}
const v = { all: ['dossierCounts'] }
function _(s) {
  return c({
    queryKey: v.all,
    queryFn: async () => {
      try {
        return await q()
      } catch (e) {
        console.warn('Failed to fetch dossier counts:', e)
        const t = ['country', 'organization', 'person', 'engagement', 'forum', 'working_group'],
          r = {}
        return (
          t.forEach((o) => {
            r[o] = { type: o, total: 0, active: 0, inactive: 0, archived: 0 }
          }),
          r
        )
      }
    },
    staleTime: 5 * 60 * 1e3,
    ...s,
  })
}
export { S as a, b, _ as c, n as d, P as e, R as f, T as g, K as u }
//# sourceMappingURL=useDossier-CiPcwRKl.js.map
