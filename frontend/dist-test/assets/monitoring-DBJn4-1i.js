import { j as e } from './react-vendor-Buoak6m3.js'
import { a as i } from './tanstack-vendor-BZC-rs5U.js'
import './vendor-misc-BiJvMP0A.js'
import './visualization-vendor-f5uYUx4I.js'
import './date-vendor-s0MkYge4.js'
async function h(s, r) {
  const t = await fetch(s, r)
  if (!t.ok) throw new Error(`Failed ${t.status}`)
  return t.json()
}
function l() {
  const { data: s } = i({
      queryKey: ['monitoring-health'],
      queryFn: () => h('/monitoring/health'),
      refetchInterval: 5e3,
    }),
    { data: r } = i({
      queryKey: ['monitoring-alerts'],
      queryFn: () => h('/monitoring/alerts'),
      refetchInterval: 1e4,
    })
  return e.jsxs('div', {
    style: { padding: 16 },
    children: [
      e.jsx('h1', { children: 'Monitoring Dashboard' }),
      e.jsxs('section', {
        children: [
          e.jsx('h2', { children: 'Health' }),
          !s && e.jsx('p', { children: 'Loading health...' }),
          s &&
            e.jsxs('div', {
              children: [
                e.jsxs('p', { children: ['Overall: ', s.status] }),
                e.jsx('ul', {
                  children: Object.entries(s.services).map(([t, n]) =>
                    e.jsxs(
                      'li',
                      {
                        children: [
                          e.jsx('strong', { children: t }),
                          ': ',
                          n.status,
                          ' (',
                          n.latency_ms,
                          ' ms)',
                        ],
                      },
                      t,
                    ),
                  ),
                }),
              ],
            }),
        ],
      }),
      e.jsxs('section', {
        children: [
          e.jsx('h2', { children: 'Alerts' }),
          !r && e.jsx('p', { children: 'Loading alerts...' }),
          r && r.length === 0 && e.jsx('p', { children: 'No alerts configured' }),
          r &&
            r.length > 0 &&
            e.jsxs('table', {
              children: [
                e.jsx('thead', {
                  children: e.jsxs('tr', {
                    children: [
                      e.jsx('th', { children: 'Name' }),
                      e.jsx('th', { children: 'Severity' }),
                      e.jsx('th', { children: 'Active' }),
                    ],
                  }),
                }),
                e.jsx('tbody', {
                  children: r.map((t) =>
                    e.jsxs(
                      'tr',
                      {
                        children: [
                          e.jsx('td', { children: t.name }),
                          e.jsx('td', { children: t.severity }),
                          e.jsx('td', { children: t.is_active ? 'Yes' : 'No' }),
                        ],
                      },
                      t.id,
                    ),
                  ),
                }),
              ],
            }),
        ],
      }),
    ],
  })
}
const x = l
export { x as component }
//# sourceMappingURL=monitoring-DBJn4-1i.js.map
