import { a as i, c as p, d as y } from './tanstack-vendor-BZC-rs5U.js'
import { s as d } from './index-qYY0KoZ1.js'
import { aP as n } from './vendor-misc-BiJvMP0A.js'
import { u as f } from './react-vendor-Buoak6m3.js'
const c = 'https://zkrcjzdemdmwhearhfgg.supabase.co'
class o extends Error {
  constructor(e, s, r) {
    ;(super(e), (this.statusCode = s), (this.details = r), (this.name = 'RelationshipAPIError'))
  }
}
async function u() {
  const {
    data: { session: t },
  } = await d.auth.getSession()
  if (!t) throw new o('Not authenticated', 401)
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${t.access_token}` }
}
async function l(t) {
  if (!t.ok) {
    let e = `Request failed with status ${t.status}`
    try {
      const s = await t.json()
      e = s.error || s.message || e
    } catch {}
    throw new o(e, t.status)
  }
  try {
    return await t.json()
  } catch (e) {
    throw new o('Failed to parse response', t.status, e)
  }
}
async function m(t) {
  const e = await u(),
    s = await fetch(`${c}/functions/v1/relationships-manage`, {
      method: 'POST',
      headers: e,
      body: JSON.stringify(t),
    })
  return l(s)
}
async function h(t) {
  const e = await u(),
    s = await fetch(`${c}/functions/v1/relationships-manage?contact_id=${t}`, {
      method: 'GET',
      headers: e,
    })
  return (await l(s)).relationships
}
async function w(t) {
  const e = await h(t),
    s = {
      total: e.length,
      by_type: { reports_to: 0, collaborates_with: 0, partner: 0, colleague: 0, other: 0 },
    }
  return (
    e.forEach((r) => {
      s.by_type[r.relationship_type]++
    }),
    s
  )
}
const a = {
  all: ['contact-relationships'],
  lists: () => [...a.all, 'list'],
  list: (t) => [...a.lists(), t],
  stats: (t) => [...a.all, 'stats', t],
}
function R(t, e) {
  return i({ queryKey: a.list(t), queryFn: () => h(t), enabled: !!t, ...e })
}
function K(t, e) {
  return i({ queryKey: a.stats(t), queryFn: () => w(t), enabled: !!t, ...e })
}
function v() {
  const t = p(),
    { t: e } = f('contacts')
  return y({
    mutationFn: (s) => m(s),
    onSuccess: (s) => {
      ;(t.invalidateQueries({ queryKey: a.list(s.from_contact_id) }),
        t.invalidateQueries({ queryKey: a.list(s.to_contact_id) }),
        t.invalidateQueries({ queryKey: a.stats(s.from_contact_id) }),
        t.invalidateQueries({ queryKey: a.stats(s.to_contact_id) }),
        n.success(e('contactDirectory.relationships.created_success')))
    },
    onError: (s) => {
      n.error(e('contactDirectory.relationships.created_error', { error: s.message }))
    },
  })
}
export { v as a, R as b, K as u }
//# sourceMappingURL=useContactRelationships-VllNTxgh.js.map
