import { u } from './react-vendor-Buoak6m3.js'
import { c as d, a as _, d as E } from './tanstack-vendor-BZC-rs5U.js'
import { s as w } from './index-qYY0KoZ1.js'
import { aP as o } from './vendor-misc-BiJvMP0A.js'
const p = 'https://zkrcjzdemdmwhearhfgg.supabase.co',
  y = `${p}/functions/v1`
async function g() {
  const {
    data: { session: n },
    error: e,
  } = await w.auth.getSession()
  if (e || !n) throw new Error('Authentication required. Please log in.')
  return n.access_token
}
async function f(n) {
  let e
  try {
    e = await n.json()
  } catch {
    e = {
      error: {
        code: 'UNKNOWN_ERROR',
        message_en: n.statusText || 'An unknown error occurred',
        message_ar: 'حدث خطأ غير معروف',
      },
    }
  }
  const t = new Error(e.error?.message_en || 'API request failed')
  return (
    (t.status = n.status),
    (t.code = e.error?.code || 'UNKNOWN_ERROR'),
    (t.message_ar = e.error?.message_ar),
    (t.details = e.error?.details),
    (t.correlation_id = e.error?.correlation_id),
    t
  )
}
async function h(n) {
  try {
    const e = await g(),
      t = new URLSearchParams({
        entity_id: n.entity_id,
        ...(n.intelligence_type && { intelligence_type: n.intelligence_type }),
        ...(n.include_stale !== void 0 && { include_stale: String(n.include_stale) }),
        ...(n.language && { language: n.language }),
      }),
      i = await fetch(`${y}/intelligence-get?${t}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${e}`, 'Content-Type': 'application/json' },
      })
    if (!i.ok) throw await f(i)
    return await i.json()
  } catch (e) {
    if (e instanceof Error && 'status' in e) throw e
    const t = new Error('Failed to fetch intelligence data')
    throw ((t.status = 500), (t.code = 'FETCH_ERROR'), t)
  }
}
async function R(n) {
  try {
    const e = await g(),
      t = await fetch(`${y}/intelligence-refresh-v2`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${e}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(n),
      })
    if (!t.ok) throw await f(t)
    return await t.json()
  } catch (e) {
    if (e instanceof Error && 'status' in e) throw e
    const t = new Error('Failed to refresh intelligence data')
    throw ((t.status = 500), (t.code = 'REFRESH_ERROR'), t)
  }
}
const r = {
  all: ['intelligence'],
  lists: () => [...r.all, 'list'],
  list: (n) => [...r.lists(), n],
  details: () => [...r.all, 'detail'],
  detail: (n, e) => [...r.details(), n, e],
  forEntity: (n) => [...r.all, 'entity', n],
}
function A(n, e) {
  const { i18n: t } = u()
  return _({
    queryKey: r.forEntity(n),
    queryFn: () => h({ entity_id: n, include_stale: !0, language: t.language }),
    staleTime: 5 * 60 * 1e3,
    gcTime: 60 * 60 * 1e3,
    ...e,
  })
}
function P(n) {
  const e = d(),
    { t } = u()
  return E({
    mutationFn: (i) => R(i),
    onMutate: async (i) => {
      await e.cancelQueries({ queryKey: r.forEntity(i.entity_id) })
      const a = e.getQueryData(r.forEntity(i.entity_id))
      if (a) {
        const l = {
          ...a,
          data: a.data.map((c) =>
            !i.intelligence_types || i.intelligence_types.includes(c.intelligence_type)
              ? { ...c, refresh_status: 'refreshing' }
              : c,
          ),
        }
        e.setQueryData(r.forEntity(i.entity_id), l)
      }
      const s = o.loading(t('intelligence.refresh.loading', 'Refreshing intelligence data...'))
      return { previousData: a, toastId: s }
    },
    onSuccess: (i, a, s) => {
      ;(s?.toastId && o.dismiss(s.toastId),
        o.success(t('intelligence.refresh.success', i.message_en)),
        setTimeout(() => {
          ;(e.invalidateQueries({ queryKey: r.forEntity(a.entity_id) }),
            a.intelligence_types &&
              a.intelligence_types.forEach((l) => {
                e.invalidateQueries({ queryKey: r.detail(a.entity_id, l) })
              }),
            e.refetchQueries({ queryKey: r.forEntity(a.entity_id) }))
        }, 1e3))
    },
    onError: (i, a, s) => {
      ;(s?.toastId && o.dismiss(s.toastId),
        s?.previousData && e.setQueryData(r.forEntity(a.entity_id), s.previousData),
        i.status === 409
          ? o.warning(
              t('intelligence.refresh.conflict', 'A refresh is already in progress. Please wait.'),
            )
          : i.status === 503
            ? o.error(
                t(
                  'intelligence.refresh.serviceUnavailable',
                  'Intelligence service is temporarily unavailable. Cached data remains accessible.',
                ),
              )
            : o.error(t('intelligence.refresh.error', `Failed to refresh: ${i.message}`)))
    },
    ...n,
  })
}
function Q() {
  const n = d(),
    { i18n: e } = u()
  return (t) => {
    n.prefetchQuery({
      queryKey: r.forEntity(t),
      queryFn: () => h({ entity_id: t, language: e.language }),
      staleTime: 5 * 60 * 1e3,
    })
  }
}
export { A as a, P as b, Q as u }
//# sourceMappingURL=useIntelligence-BMjousVq.js.map
