import { a as i } from './tanstack-vendor-BZC-rs5U.js'
import { s as n } from './index-qYY0KoZ1.js'
const r = 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1',
  e = {
    all: ['positions'],
    lists: () => [...e.all, 'list'],
    details: () => [...e.all, 'detail'],
    detail: (s) => [...e.details(), s],
  },
  c = async () => {
    const {
      data: { session: s },
    } = await n.auth.getSession()
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${s?.access_token}` }
  },
  h = (s, u) =>
    i({
      queryKey: e.detail(s || ''),
      queryFn: async () => {
        if (!s) throw new Error('Position ID is required')
        const o = await c(),
          t = await fetch(`${r}/positions-get?position_id=${s}`, { method: 'GET', headers: o })
        if (!t.ok) {
          const a = await t.json().catch(() => ({ message: t.statusText }))
          throw new Error(a.message || `Failed to fetch position: ${t.status}`)
        }
        return t.json()
      },
      enabled: !!s,
      staleTime: 5 * 60 * 1e3,
      refetchOnWindowFocus: !1,
    })
export { h as u }
//# sourceMappingURL=usePosition-ChrBL0hW.js.map
