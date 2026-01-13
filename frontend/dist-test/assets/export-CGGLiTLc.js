import { r as n, j as e } from './react-vendor-Buoak6m3.js'
import './vendor-misc-BiJvMP0A.js'
import './visualization-vendor-f5uYUx4I.js'
import './date-vendor-s0MkYge4.js'
async function p(s, r) {
  const t = await fetch(s, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-auth-token' },
    body: JSON.stringify(r),
  })
  if (!t.ok) throw new Error(`Failed ${t.status}`)
  return t.json()
}
async function h(s) {
  const r = await fetch(s, { headers: { Authorization: 'Bearer test-auth-token' } })
  if (!r.ok) throw new Error(`Failed ${r.status}`)
  return r.json()
}
function x() {
  const [s, r] = n.useState(null),
    [t, l] = n.useState(null),
    [c, u] = n.useState('csv'),
    d = async () => {
      const o = await p('/export', { resource_type: 'users', format: c })
      r(o.id)
    }
  return (
    n.useEffect(() => {
      if (!s) return
      let o = !1
      const a = async () => {
        try {
          const i = await h(`/export/${s}`)
          if ((o || l(i), i.status === 'completed' || i.status === 'failed')) return
          setTimeout(a, 1e3)
        } catch {
          setTimeout(a, 1500)
        }
      }
      return (
        a(),
        () => {
          o = !0
        }
      )
    }, [s]),
    e.jsxs('div', {
      style: { padding: 8 },
      children: [
        e.jsx('h3', { children: 'Export Data' }),
        e.jsxs('div', {
          style: { display: 'flex', gap: 8, alignItems: 'center' },
          children: [
            e.jsxs('select', {
              value: c,
              onChange: (o) => u(o.target.value),
              children: [
                e.jsx('option', { value: 'csv', children: 'CSV' }),
                e.jsx('option', { value: 'json', children: 'JSON' }),
                e.jsx('option', { value: 'excel', children: 'Excel' }),
              ],
            }),
            e.jsx('button', { onClick: d, children: 'Start Export' }),
          ],
        }),
        t &&
          e.jsxs('div', {
            style: { marginTop: 8 },
            children: [
              e.jsxs('div', { children: ['Status: ', t.status] }),
              typeof t.progress == 'number' &&
                e.jsxs('div', { children: ['Progress: ', t.progress, '%'] }),
              t.status === 'completed' &&
                t.download_url &&
                e.jsx('a', {
                  href: `/export/${t.id}/download`,
                  target: '_blank',
                  rel: 'noreferrer',
                  children: 'Download',
                }),
              t.status === 'failed' && e.jsxs('div', { children: ['Error: ', t.error_message] }),
            ],
          }),
      ],
    })
  )
}
const y = x
export { y as component }
//# sourceMappingURL=export-CGGLiTLc.js.map
