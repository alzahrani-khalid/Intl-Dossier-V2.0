import { s as n } from './index-qYY0KoZ1.js'
async function d(t, r) {
  const { data: a } = await n.auth.getSession()
  if (!a.session) throw new Error('User not authenticated')
  const e = new URL('https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/dossier-stats')
  ;(e.searchParams.append('dossierId', t),
    r && r.length > 0 && e.searchParams.append('include', r.join(',')))
  const s = await fetch(e.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${a.session.access_token}`,
      'Content-Type': 'application/json',
    },
  })
  if (!s.ok) {
    const o = await s.json()
    throw new Error(o.error?.message_en || 'Failed to fetch dossier stats')
  }
  return s.json()
}
function h(t) {
  return t === null
    ? 'text-gray-400'
    : t >= 80
      ? 'text-green-600 dark:text-green-400'
      : t >= 60
        ? 'text-yellow-600 dark:text-yellow-400'
        : t >= 40
          ? 'text-orange-600 dark:text-orange-400'
          : 'text-red-600 dark:text-red-400'
}
function c(t) {
  return t === null
    ? 'Insufficient Data'
    : t >= 80
      ? 'Excellent'
      : t >= 60
        ? 'Good'
        : t >= 40
          ? 'Fair'
          : 'Poor'
}
async function g(t, r) {
  const { data: a } = await n.auth.getSession()
  if (!a.session) throw new Error('User not authenticated')
  const e = await fetch(
    'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/dossier-stats/dashboard-aggregations',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${a.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ groupBy: t, filter: r }),
    },
  )
  if (!e.ok) {
    const s = await e.json()
    throw new Error(s.error?.message_en || 'Failed to fetch dashboard aggregations')
  }
  return e.json()
}
export { c as a, h as b, d as c, g }
//# sourceMappingURL=dossier-stats.service-BBABWT3E.js.map
