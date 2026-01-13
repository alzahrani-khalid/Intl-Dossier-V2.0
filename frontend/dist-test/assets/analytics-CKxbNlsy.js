import { j as t } from './react-vendor-Buoak6m3.js'
import {
  S as l,
  H as m,
  X as p,
  Y as x,
  T as d,
  L as u,
  I as f,
} from './visualization-vendor-f5uYUx4I.js'
import './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
function j({ points: e, labels: r }) {
  const n = e.map((s, i) => ({ x: s[0], y: s[1], cluster: r[i] })),
    o = Array.from(new Set(r)),
    a = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']
  return t.jsxs(l, {
    width: 480,
    height: 360,
    margin: { top: 16, right: 16, bottom: 16, left: 16 },
    children: [
      t.jsx(m, {}),
      t.jsx(p, { type: 'number', dataKey: 'x', name: 'X' }),
      t.jsx(x, { type: 'number', dataKey: 'y', name: 'Y' }),
      t.jsx(d, { cursor: { strokeDasharray: '3 3' } }),
      t.jsx(u, {}),
      o.map((s, i) =>
        t.jsx(
          f,
          { name: `Cluster ${s}`, data: n.filter((c) => c.cluster === s), fill: a[i % a.length] },
          s,
        ),
      ),
    ],
  })
}
function C() {
  const e = [
      [1, 1, 0],
      [2, 2, 0],
      [8, 8, 0],
    ],
    r = [0, 0, 1],
    n = e.map(([o, a]) => [o, a])
  return t.jsxs('div', {
    style: { padding: 16 },
    children: [t.jsx('h2', { children: 'Clustering' }), t.jsx(j, { points: n, labels: r })],
  })
}
export { C as component }
//# sourceMappingURL=analytics-CKxbNlsy.js.map
