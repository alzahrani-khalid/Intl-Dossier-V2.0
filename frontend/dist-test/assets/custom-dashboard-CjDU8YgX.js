import { r as j, u as L, j as e } from './react-vendor-Buoak6m3.js'
import {
  c as y,
  j as Se,
  k as Ce,
  o as Te,
  B as z,
  l as De,
  ae as Ae,
  p as Y,
  m as F,
  C as Ie,
  S as Le,
  e as Re,
  f as ze,
  g as We,
  h as Me,
  I as J,
  A as Pe,
  E as $e,
  F as Ee,
  G as Oe,
  H as Be,
  Z as Fe,
  _ as Ve,
  $ as ue,
  aa as me,
  K as _e,
  J as D,
  q as W,
  r as M,
  t as P,
  v as $,
  w,
  X as V,
  a0 as Ue,
} from './index-qYY0KoZ1.js'
import { T as _, a as U, b as q, c as G } from './tooltip-CE0dVuox.js'
import {
  A as qe,
  h as Ge,
  a as He,
  b as Ke,
  c as Qe,
  d as Ze,
  e as Ye,
  f as Je,
  g as Xe,
} from './alert-dialog-DaWYDPc1.js'
import {
  d0 as es,
  d3 as ss,
  d9 as fe,
  aS as ts,
  aB as je,
  bg as le,
  aD as as,
  bm as be,
  bo as rs,
  da as ns,
  b_ as is,
  aR as X,
  aM as oe,
  aH as Q,
  bd as ce,
  bw as ls,
  aI as os,
  bi as cs,
  aA as ds,
  b3 as us,
  aW as ve,
  cl as de,
  db as ms,
  c7 as ye,
  dc as gs,
  c5 as hs,
  dd as xs,
  de as ne,
  aE as we,
  b9 as H,
  cW as ps,
  cX as te,
  d4 as fs,
  d5 as js,
  d6 as bs,
  d7 as vs,
  cY as ys,
  cZ as ws,
  df as ks,
  d1 as Ns,
  dg as Ss,
  c$ as Cs,
  dh as Ts,
  bk as Ds,
  bO as As,
  di as B,
  bE as Is,
  bp as Ls,
  bq as Rs,
  aP as K,
} from './vendor-misc-BiJvMP0A.js'
import { L as zs, c as Ws, a as Ms } from './tanstack-vendor-BZC-rs5U.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
const Ps = {
    small: 'col-span-1',
    medium: 'col-span-1 sm:col-span-2',
    large: 'col-span-1 sm:col-span-2 lg:col-span-3',
    full: 'col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4',
  },
  $s = { small: 'row-span-1', medium: 'row-span-1', large: 'row-span-2', full: 'row-span-2' },
  ie = j.forwardRef(
    (
      {
        id: s,
        title: r,
        size: t,
        isEditMode: n,
        loadingState: a,
        onSettings: i,
        onRefresh: c,
        onRemove: l,
        children: m,
        className: o,
      },
      d,
    ) => {
      const { t: u, i18n: p } = L('dashboard-widgets'),
        x = p.language === 'ar',
        {
          attributes: g,
          listeners: N,
          setNodeRef: h,
          transform: f,
          transition: v,
          isDragging: k,
        } = es({ id: s, disabled: !n }),
        S = { transform: ss.Transform.toString(f), transition: v },
        C = a?.isLoading,
        T = a?.isError
      return e.jsx('div', {
        ref: (I) => {
          ;(h(I), typeof d == 'function' ? d(I) : d && (d.current = I))
        },
        style: S,
        className: y(Ps[t], $s[t], 'min-h-[150px]', k && 'opacity-50 z-50', o),
        dir: x ? 'rtl' : 'ltr',
        children: e.jsxs(Se, {
          className: y(
            'h-full flex flex-col transition-all duration-200',
            n && 'ring-2 ring-dashed ring-primary/30 hover:ring-primary/50',
            T && 'border-destructive/50',
          ),
          children: [
            e.jsxs(Ce, {
              className:
                'flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-3 sm:px-4',
              children: [
                e.jsxs('div', {
                  className: 'flex items-center gap-2 min-w-0',
                  children: [
                    n &&
                      e.jsx('button', {
                        ...g,
                        ...N,
                        className: y(
                          'cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted',
                          'touch-none select-none',
                          'min-h-8 min-w-8 flex items-center justify-center',
                        ),
                        'aria-label': u('accessibility.dragHandle'),
                        children: e.jsx(fe, { className: 'h-4 w-4 text-muted-foreground' }),
                      }),
                    e.jsx(Te, {
                      className: 'text-sm sm:text-base font-medium truncate',
                      children: r,
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'flex items-center gap-1',
                  children: [
                    C && e.jsx(ts, { className: 'h-4 w-4 animate-spin text-muted-foreground' }),
                    c &&
                      !n &&
                      e.jsx(_, {
                        children: e.jsxs(U, {
                          children: [
                            e.jsx(q, {
                              asChild: !0,
                              children: e.jsxs(z, {
                                variant: 'ghost',
                                size: 'icon',
                                onClick: c,
                                disabled: C,
                                className: 'h-8 w-8',
                                children: [
                                  e.jsx(je, { className: 'h-4 w-4' }),
                                  e.jsx('span', {
                                    className: 'sr-only',
                                    children: u('actions.refresh'),
                                  }),
                                ],
                              }),
                            }),
                            e.jsx(G, { children: e.jsx('p', { children: u('actions.refresh') }) }),
                          ],
                        }),
                      }),
                    i &&
                      n &&
                      e.jsx(_, {
                        children: e.jsxs(U, {
                          children: [
                            e.jsx(q, {
                              asChild: !0,
                              children: e.jsxs(z, {
                                variant: 'ghost',
                                size: 'icon',
                                onClick: i,
                                className: 'h-8 w-8',
                                children: [
                                  e.jsx(le, { className: 'h-4 w-4' }),
                                  e.jsx('span', {
                                    className: 'sr-only',
                                    children: u('accessibility.settingsButton', { widget: r }),
                                  }),
                                ],
                              }),
                            }),
                            e.jsx(G, { children: e.jsx('p', { children: u('configureWidget') }) }),
                          ],
                        }),
                      }),
                    l &&
                      n &&
                      e.jsx(_, {
                        children: e.jsxs(U, {
                          children: [
                            e.jsx(q, {
                              asChild: !0,
                              children: e.jsxs(z, {
                                variant: 'ghost',
                                size: 'icon',
                                onClick: l,
                                className:
                                  'h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10',
                                children: [
                                  e.jsx(as, { className: 'h-4 w-4' }),
                                  e.jsx('span', {
                                    className: 'sr-only',
                                    children: u('accessibility.removeButton', { widget: r }),
                                  }),
                                ],
                              }),
                            }),
                            e.jsx(G, { children: e.jsx('p', { children: u('removeWidget') }) }),
                          ],
                        }),
                      }),
                  ],
                }),
              ],
            }),
            e.jsx(De, {
              className: 'flex-1 p-3 sm:p-4 pt-0 overflow-hidden',
              children: T
                ? e.jsx('div', {
                    className:
                      'h-full flex items-center justify-center text-sm text-muted-foreground',
                    children: e.jsx('p', { children: u('errors.loadFailed') }),
                  })
                : m,
            }),
          ],
        }),
      })
    },
  )
ie.displayName = 'WidgetContainer'
function Es({ data: s, className: r, color: t = 'currentColor' }) {
  const n = j.useMemo(() => {
    if (s.length < 2) return ''
    const a = Math.max(...s),
      i = Math.min(...s),
      c = a - i || 1,
      l = 100,
      m = 24,
      o = 2
    return `M ${s
      .map((u, p) => {
        const x = (p / (s.length - 1)) * (l - o * 2) + o,
          g = m - o - ((u - i) / c) * (m - o * 2)
        return `${x},${g}`
      })
      .join(' L ')}`
  }, [s])
  return s.length < 2
    ? null
    : e.jsx('svg', {
        className: y('w-full h-6', r),
        viewBox: '0 0 100 24',
        preserveAspectRatio: 'none',
        children: e.jsx('path', {
          d: n,
          fill: 'none',
          stroke: t,
          strokeWidth: '2',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      })
}
function Os({ direction: s, percentage: r, period: t }) {
  const { t: n } = L('dashboard-widgets'),
    a = s === 'up' ? be : s === 'down' ? rs : ns,
    i = {
      up: 'text-green-600 dark:text-green-400',
      down: 'text-red-600 dark:text-red-400',
      neutral: 'text-muted-foreground',
    },
    c = {
      up: 'bg-green-100 dark:bg-green-900/30',
      down: 'bg-red-100 dark:bg-red-900/30',
      neutral: 'bg-muted',
    }
  return e.jsxs('div', {
    className: 'flex items-center gap-1 sm:gap-2',
    children: [
      e.jsxs('span', {
        className: y(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium',
          i[s],
          c[s],
        ),
        children: [
          e.jsx(a, { className: 'h-3 w-3' }),
          e.jsxs('span', { children: [r.toFixed(1), '%'] }),
        ],
      }),
      e.jsx('span', {
        className: 'text-xs text-muted-foreground',
        children: n('trends.fromLastPeriod', { period: n(`periods.${t}`) }),
      }),
    ],
  })
}
function Bs({ current: s, target: r, progress: t }) {
  return e.jsxs('div', {
    className: 'space-y-1.5',
    children: [
      e.jsxs('div', {
        className: 'flex items-center justify-between text-xs text-muted-foreground',
        children: [
          e.jsxs('div', {
            className: 'flex items-center gap-1',
            children: [
              e.jsx(is, { className: 'h-3 w-3' }),
              e.jsxs('span', { children: [s.toLocaleString(), ' / ', r.toLocaleString()] }),
            ],
          }),
          e.jsxs('span', { children: [t.toFixed(0), '%'] }),
        ],
      }),
      e.jsx(Ae, { value: t, className: 'h-1.5' }),
    ],
  })
}
function Fs({ config: s, data: r, isLoading: t }) {
  const { t: n, i18n: a } = L('dashboard-widgets'),
    i = a.language === 'ar',
    {
      settings: { metric: c, showTrend: l, showSparkline: m, comparisonPeriod: o },
    } = s,
    d = n(`metrics.${c}`, c)
  if (t || !r)
    return e.jsxs('div', {
      className: 'h-full flex flex-col justify-center animate-pulse',
      children: [
        e.jsx('div', { className: 'h-3 w-24 bg-muted rounded mb-2' }),
        e.jsx('div', { className: 'h-8 w-32 bg-muted rounded mb-3' }),
        e.jsx('div', { className: 'h-3 w-20 bg-muted rounded' }),
      ],
    })
  const {
      value: u,
      trend: p,
      trendPercentage: x,
      sparklineData: g,
      target: N,
      targetProgress: h,
    } = r,
    f = j.useMemo(
      () =>
        c === 'response-rate' || c === 'sla-compliance'
          ? `${u.toFixed(1)}%`
          : u.toLocaleString(i ? 'ar-SA' : 'en-US'),
      [u, c, i],
    ),
    v = p === 'up' ? 'rgb(22, 163, 74)' : p === 'down' ? 'rgb(220, 38, 38)' : 'rgb(156, 163, 175)'
  return e.jsxs('div', {
    className: 'h-full flex flex-col justify-between',
    children: [
      e.jsx('p', { className: 'text-xs sm:text-sm text-muted-foreground mb-1', children: d }),
      e.jsxs('div', {
        className: 'flex-1 flex flex-col justify-center',
        children: [
          e.jsx('p', {
            className: y(
              'text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight',
              'tabular-nums',
            ),
            dir: 'ltr',
            children: f,
          }),
          m &&
            g &&
            g.length > 1 &&
            e.jsx('div', {
              className: 'mt-2',
              children: e.jsx(Es, { data: g, color: v, className: 'opacity-80' }),
            }),
        ],
      }),
      e.jsxs('div', {
        className: 'mt-2 space-y-2',
        children: [
          l && e.jsx(Os, { direction: p, percentage: x, period: o }),
          N && h !== void 0 && e.jsx(Bs, { current: u, target: N, progress: h }),
        ],
      }),
    ],
  })
}
const Vs = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
function _s({ data: s, showLegend: r, colors: t, isRTL: n }) {
  const { labels: a, datasets: i } = s,
    c = Math.max(...i.flatMap((l) => l.data))
  return e.jsxs('div', {
    className: 'h-full flex flex-col',
    children: [
      e.jsx('div', {
        className: 'flex-1 flex items-end gap-1 sm:gap-2',
        children: a.map((l, m) =>
          e.jsxs(
            'div',
            {
              className: 'flex-1 flex flex-col items-center gap-1',
              style: { order: n ? a.length - m : m },
              children: [
                e.jsx('div', {
                  className: 'w-full flex justify-center gap-0.5',
                  children: i.map((o, d) =>
                    e.jsx(
                      'div',
                      {
                        className:
                          'flex-1 max-w-8 rounded-t transition-all duration-300 hover:opacity-80',
                        style: {
                          height: `${((o.data[m] ?? 0) / c) * 100}%`,
                          minHeight: (o.data[m] ?? 0) > 0 ? '4px' : '0',
                          backgroundColor:
                            typeof o.backgroundColor == 'string'
                              ? o.backgroundColor
                              : Array.isArray(o.backgroundColor)
                                ? o.backgroundColor[m]
                                : t[d % t.length],
                        },
                        title: `${o.label}: ${o.data[m]}`,
                      },
                      o.label,
                    ),
                  ),
                }),
                e.jsx('span', {
                  className:
                    'text-[10px] sm:text-xs text-muted-foreground text-center truncate w-full',
                  children: l,
                }),
              ],
            },
            l,
          ),
        ),
      }),
      r &&
        i.length > 1 &&
        e.jsx('div', {
          className: 'flex flex-wrap justify-center gap-2 sm:gap-4 mt-2 pt-2 border-t',
          children: i.map((l, m) =>
            e.jsxs(
              'div',
              {
                className: 'flex items-center gap-1',
                children: [
                  e.jsx('div', {
                    className: 'w-2.5 h-2.5 rounded-sm',
                    style: {
                      backgroundColor:
                        typeof l.backgroundColor == 'string' ? l.backgroundColor : t[m % t.length],
                    },
                  }),
                  e.jsx('span', { className: 'text-xs text-muted-foreground', children: l.label }),
                ],
              },
              l.label,
            ),
          ),
        }),
    ],
  })
}
function ge({ data: s, showLegend: r, colors: t, isDonut: n = !1 }) {
  const { labels: a, datasets: i } = s,
    c = i[0]?.data || [],
    l = c.reduce((o, d) => o + d, 0),
    m = j.useMemo(() => {
      let o = -90
      return c.map((d, u) => {
        const p = (d / l) * 100,
          x = (d / l) * 360,
          g = o
        o += x
        const N = (g * Math.PI) / 180,
          h = ((g + x) * Math.PI) / 180,
          f = x > 180 ? 1 : 0,
          v = n ? 35 : 0,
          k = 50,
          S = 50 + k * Math.cos(N),
          C = 50 + k * Math.sin(N),
          T = 50 + k * Math.cos(h),
          I = 50 + k * Math.sin(h),
          O = 50 + v * Math.cos(h),
          R = 50 + v * Math.sin(h),
          ee = 50 + v * Math.cos(N),
          se = 50 + v * Math.sin(N)
        let b
        n
          ? (b = `M ${S} ${C} A ${k} ${k} 0 ${f} 1 ${T} ${I} L ${O} ${R} A ${v} ${v} 0 ${f} 0 ${ee} ${se} Z`)
          : (b = `M 50 50 L ${S} ${C} A ${k} ${k} 0 ${f} 1 ${T} ${I} Z`)
        const A = i[0]
        return {
          path: b,
          color:
            typeof A?.backgroundColor == 'string'
              ? A.backgroundColor
              : Array.isArray(A?.backgroundColor)
                ? (A?.backgroundColor?.[u] ?? t[u % t.length])
                : t[u % t.length],
          label: a[u],
          value: d,
          percentage: p,
        }
      })
    }, [c, l, a, i, t, n])
  return e.jsxs('div', {
    className: 'h-full flex flex-col sm:flex-row items-center gap-2 sm:gap-4',
    children: [
      e.jsx('div', {
        className: 'flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32',
        children: e.jsxs('svg', {
          viewBox: '0 0 100 100',
          className: 'w-full h-full',
          children: [
            m.map((o, d) =>
              e.jsx(
                'path',
                {
                  d: o.path,
                  fill: o.color,
                  className: 'transition-opacity hover:opacity-80',
                  children: e.jsxs('title', {
                    children: [o.label, ': ', o.value, ' (', o.percentage.toFixed(1), '%)'],
                  }),
                },
                d,
              ),
            ),
            n &&
              e.jsx('text', {
                x: '50',
                y: '50',
                textAnchor: 'middle',
                dominantBaseline: 'middle',
                className: 'text-xs font-medium fill-foreground',
                children: l,
              }),
          ],
        }),
      }),
      r &&
        e.jsx('div', {
          className: 'flex flex-wrap sm:flex-col gap-1.5 sm:gap-2 justify-center',
          children: m.map((o, d) =>
            e.jsxs(
              'div',
              {
                className: 'flex items-center gap-1.5',
                children: [
                  e.jsx('div', {
                    className: 'w-2.5 h-2.5 rounded-sm flex-shrink-0',
                    style: { backgroundColor: o.color },
                  }),
                  e.jsx('span', {
                    className: 'text-xs text-muted-foreground truncate max-w-[100px]',
                    children: o.label,
                  }),
                  e.jsxs('span', {
                    className: 'text-xs font-medium ms-auto',
                    children: [o.percentage.toFixed(0), '%'],
                  }),
                ],
              },
              d,
            ),
          ),
        }),
    ],
  })
}
function he({ data: s, showGrid: r, showLegend: t, colors: n, isArea: a = !1, isRTL: i }) {
  const { labels: c, datasets: l } = s,
    m = l.flatMap((h) => h.data),
    o = Math.max(...m),
    d = Math.min(...m),
    u = o - d || 1,
    p = 100,
    x = 60,
    g = { top: 4, right: 4, bottom: 4, left: 4 },
    N = (h) => {
      const f = h.map((T, I) => {
          const O = g.left + (I / (h.length - 1)) * (p - g.left - g.right),
            R = x - g.bottom - ((T - d) / u) * (x - g.top - g.bottom)
          return { x: O, y: R }
        }),
        v = `M ${f.map((T) => `${T.x},${T.y}`).join(' L ')}`,
        k = f[f.length - 1],
        S = f[0],
        C = k && S ? `${v} L ${k.x},${x - g.bottom} L ${S.x},${x - g.bottom} Z` : v
      return { linePath: v, areaPath: C }
    }
  return e.jsxs('div', {
    className: 'h-full flex flex-col',
    children: [
      e.jsx('div', {
        className: 'flex-1',
        children: e.jsxs('svg', {
          viewBox: `0 0 ${p} ${x}`,
          className: 'w-full h-full',
          preserveAspectRatio: 'none',
          style: { direction: 'ltr' },
          children: [
            r &&
              e.jsx('g', {
                className: 'text-border',
                opacity: '0.3',
                children: [0, 0.25, 0.5, 0.75, 1].map((h) => {
                  const f = g.top + h * (x - g.top - g.bottom)
                  return e.jsx(
                    'line',
                    {
                      x1: g.left,
                      y1: f,
                      x2: p - g.right,
                      y2: f,
                      stroke: 'currentColor',
                      strokeDasharray: '2,2',
                    },
                    h,
                  )
                }),
              }),
            l.map((h, f) => {
              const { linePath: v, areaPath: k } = N(h.data),
                S =
                  h.borderColor ||
                  (typeof h.backgroundColor == 'string' ? h.backgroundColor : n[f % n.length])
              return e.jsxs(
                'g',
                {
                  children: [
                    a && e.jsx('path', { d: k, fill: S, opacity: '0.2' }),
                    e.jsx('path', {
                      d: v,
                      fill: 'none',
                      stroke: S,
                      strokeWidth: '2',
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                    }),
                    h.data.map((C, T) => {
                      const I = g.left + (T / (h.data.length - 1)) * (p - g.left - g.right),
                        O = x - g.bottom - ((C - d) / u) * (x - g.top - g.bottom)
                      return e.jsx(
                        'circle',
                        {
                          cx: I,
                          cy: O,
                          r: '2',
                          fill: S,
                          className: 'hover:r-3 transition-all',
                          children: e.jsxs('title', { children: [c[T], ': ', C] }),
                        },
                        T,
                      )
                    }),
                  ],
                },
                h.label,
              )
            }),
          ],
        }),
      }),
      e.jsx('div', {
        className: 'flex justify-between px-1 mt-1',
        children:
          c.length <= 7
            ? c.map((h, f) =>
                e.jsx(
                  'span',
                  {
                    className: 'text-[10px] text-muted-foreground',
                    style: { order: i ? c.length - f : f },
                    children: h,
                  },
                  f,
                ),
              )
            : e.jsxs(e.Fragment, {
                children: [
                  e.jsx('span', { className: 'text-[10px] text-muted-foreground', children: c[0] }),
                  e.jsx('span', {
                    className: 'text-[10px] text-muted-foreground',
                    children: c[c.length - 1],
                  }),
                ],
              }),
      }),
      t &&
        l.length > 1 &&
        e.jsx('div', {
          className: 'flex flex-wrap justify-center gap-2 sm:gap-4 mt-2 pt-2 border-t',
          children: l.map((h, f) =>
            e.jsxs(
              'div',
              {
                className: 'flex items-center gap-1',
                children: [
                  e.jsx('div', {
                    className: 'w-2.5 h-2.5 rounded-sm',
                    style: {
                      backgroundColor:
                        h.borderColor ||
                        (typeof h.backgroundColor == 'string'
                          ? h.backgroundColor
                          : n[f % n.length]),
                    },
                  }),
                  e.jsx('span', { className: 'text-xs text-muted-foreground', children: h.label }),
                ],
              },
              h.label,
            ),
          ),
        }),
    ],
  })
}
function Us({ config: s, data: r, isLoading: t }) {
  const { t: n, i18n: a } = L('dashboard-widgets'),
    i = a.language === 'ar',
    {
      settings: { chartType: c, showLegend: l, showGrid: m, colors: o },
    } = s,
    d = o || Vs
  if (t || !r)
    return e.jsx('div', {
      className: 'h-full flex items-center justify-center animate-pulse',
      children: e.jsx('div', { className: 'w-full h-full bg-muted rounded' }),
    })
  if (!r.datasets.length || !r.labels.length)
    return e.jsx('div', {
      className: 'h-full flex items-center justify-center text-sm text-muted-foreground',
      children: e.jsx('p', { children: n('emptyStates.noData') }),
    })
  const u = () => {
    switch (c) {
      case 'bar':
        return e.jsx(_s, { data: r, showLegend: l, colors: d, isRTL: i })
      case 'pie':
        return e.jsx(ge, { data: r, showLegend: l, colors: d })
      case 'donut':
        return e.jsx(ge, { data: r, showLegend: l, colors: d, isDonut: !0 })
      case 'area':
        return e.jsx(he, { data: r, showGrid: m, showLegend: l, colors: d, isArea: !0, isRTL: i })
      case 'line':
      case 'sparkline':
      default:
        return e.jsx(he, { data: r, showGrid: m, showLegend: l, colors: d, isRTL: i })
    }
  }
  return e.jsx('div', { className: 'h-full', children: u() })
}
function qs(s) {
  switch (s) {
    case 'meeting':
      return os
    case 'deadline':
      return ls
    case 'follow-up':
      return ce
    case 'engagement':
      return Q
    case 'mou-renewal':
      return Q
    default:
      return X
  }
}
function Gs(s) {
  switch (s) {
    case 'meeting':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      }
    case 'deadline':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-600 dark:text-red-400',
        badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      }
    case 'follow-up':
      return {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      }
    case 'engagement':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-600 dark:text-green-400',
        badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      }
    case 'mou-renewal':
      return {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-600 dark:text-purple-400',
        badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      }
    default:
      return {
        bg: 'bg-muted',
        text: 'text-muted-foreground',
        badge: 'bg-muted text-muted-foreground',
      }
  }
}
function Hs(s, r) {
  const t = new Date(s),
    n = new Date(),
    a = t.getTime() - n.getTime(),
    i = Math.ceil(a / (1e3 * 60 * 60 * 24)),
    c = new Intl.RelativeTimeFormat(r, { numeric: 'auto' })
  return i === 0
    ? t.toLocaleTimeString(r, { hour: '2-digit', minute: '2-digit' })
    : i === 1
      ? c.format(1, 'day')
      : i === -1
        ? c.format(-1, 'day')
        : (i > 0 && i <= 7) || (i < 0 && i >= -7)
          ? c.format(i, 'day')
          : t.toLocaleDateString(r, { month: 'short', day: 'numeric' })
}
function Ks({ event: s, locale: r, isRTL: t }) {
  const { t: n } = L('dashboard-widgets'),
    a = qs(s.type),
    i = Gs(s.type),
    c = new Date(s.startDate) < new Date(),
    l = Hs(s.startDate, r)
  return e.jsxs('div', {
    className: y(
      'flex items-start gap-3 p-2 sm:p-3 rounded-lg transition-colors',
      'hover:bg-muted/50 cursor-pointer group',
      c && 'opacity-60',
    ),
    children: [
      e.jsx('div', {
        className: y('p-2 rounded-lg shrink-0', i.bg),
        children: e.jsx(a, { className: y('h-4 w-4', i.text) }),
      }),
      e.jsxs('div', {
        className: 'flex-1 min-w-0',
        children: [
          e.jsxs('div', {
            className: 'flex items-start justify-between gap-2',
            children: [
              e.jsx('h4', { className: 'text-sm font-medium truncate', children: s.title }),
              e.jsx('span', {
                className: 'text-xs text-muted-foreground whitespace-nowrap',
                children: l,
              }),
            ],
          }),
          s.description &&
            e.jsx('p', {
              className: 'text-xs text-muted-foreground mt-0.5 line-clamp-1',
              children: s.description,
            }),
          e.jsxs('div', {
            className: 'flex items-center gap-2 mt-1.5',
            children: [
              e.jsx(F, {
                variant: 'secondary',
                className: y('text-[10px] px-1.5 py-0', i.badge),
                children: n(`eventTypes.${s.type}`),
              }),
              s.priority === 'high' &&
                e.jsx(F, {
                  variant: 'destructive',
                  className: 'text-[10px] px-1.5 py-0',
                  children: n('settings.kpi.targetValue'),
                }),
            ],
          }),
        ],
      }),
      e.jsx(oe, {
        className: y(
          'h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0',
          t && 'rotate-180',
        ),
      }),
    ],
  })
}
function Qs({ config: s, data: r, isLoading: t }) {
  const { t: n, i18n: a } = L('dashboard-widgets'),
    i = a.language === 'ar',
    c = i ? 'ar-SA' : 'en-US',
    { settings: l } = s,
    m = j.useMemo(() => {
      if (!r) return []
      let o = [...r]
      return (
        l.eventTypes.includes('all') || (o = o.filter((d) => l.eventTypes.includes(d.type))),
        l.showPastEvents || (o = o.filter((d) => new Date(d.startDate) >= new Date())),
        o.sort((d, u) => new Date(d.startDate).getTime() - new Date(u.startDate).getTime()),
        o.slice(0, l.maxItems)
      )
    }, [r, l])
  return t
    ? e.jsx('div', {
        className: 'h-full space-y-2 animate-pulse',
        children: Array.from({ length: 3 }).map((o, d) =>
          e.jsxs(
            'div',
            {
              className: 'flex items-start gap-3 p-2',
              children: [
                e.jsx('div', { className: 'w-8 h-8 bg-muted rounded-lg' }),
                e.jsxs('div', {
                  className: 'flex-1',
                  children: [
                    e.jsx('div', { className: 'h-4 w-3/4 bg-muted rounded mb-1' }),
                    e.jsx('div', { className: 'h-3 w-1/2 bg-muted rounded' }),
                  ],
                }),
              ],
            },
            d,
          ),
        ),
      })
    : m.length
      ? e.jsx(Y, {
          className: 'h-full',
          children: e.jsx('div', {
            className: 'space-y-1',
            children: m.map((o) => e.jsx(Ks, { event: o, locale: c, isRTL: i }, o.id)),
          }),
        })
      : e.jsxs('div', {
          className: 'h-full flex flex-col items-center justify-center text-center p-4',
          children: [
            e.jsx(X, { className: 'h-8 w-8 text-muted-foreground mb-2' }),
            e.jsx('p', {
              className: 'text-sm text-muted-foreground',
              children: n('emptyStates.noEvents'),
            }),
          ],
        })
}
function Zs(s) {
  switch (s) {
    case 'commitment':
      return Q
    case 'task':
      return de
    case 'intake':
      return ve
    default:
      return us
  }
}
function Ys(s) {
  switch (s) {
    case 'commitment':
      return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' }
    case 'task':
      return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' }
    case 'intake':
      return {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-600 dark:text-purple-400',
      }
    default:
      return { bg: 'bg-muted', text: 'text-muted-foreground' }
  }
}
function Js(s) {
  switch (s) {
    case 'urgent':
      return { variant: 'destructive', label: 'Urgent' }
    case 'high':
      return { variant: 'destructive', label: 'High' }
    case 'medium':
      return { variant: 'secondary', label: 'Medium' }
    case 'low':
      return { variant: 'outline', label: 'Low' }
    default:
      return { variant: 'outline', label: s }
  }
}
function Xs(s, r) {
  const t = new Date(s),
    n = new Date(),
    a = t.getTime() - n.getTime(),
    i = Math.ceil(a / (1e3 * 60 * 60 * 24))
  return i < 0
    ? new Intl.RelativeTimeFormat(r, { numeric: 'auto' }).format(i, 'day')
    : i === 0
      ? new Intl.RelativeTimeFormat(r, { numeric: 'auto' }).format(0, 'day')
      : i <= 7
        ? new Intl.RelativeTimeFormat(r, { numeric: 'auto' }).format(i, 'day')
        : t.toLocaleDateString(r, { month: 'short', day: 'numeric' })
}
function xe({ task: s, locale: r, isRTL: t, onToggle: n }) {
  const { t: a } = L('dashboard-widgets'),
    i = Zs(s.source),
    c = Ys(s.source),
    l = Js(s.priority),
    m = s.status === 'completed'
  return e.jsxs('div', {
    className: y(
      'flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors',
      'hover:bg-muted/50 group',
      m && 'opacity-60',
    ),
    children: [
      e.jsx('div', {
        className: 'pt-0.5',
        children: e.jsx(Ie, { checked: m, onCheckedChange: (o) => n?.(o), className: 'h-4 w-4' }),
      }),
      e.jsx('div', {
        className: y('p-1.5 rounded shrink-0', c.bg),
        children: e.jsx(i, { className: y('h-3.5 w-3.5', c.text) }),
      }),
      e.jsxs('div', {
        className: 'flex-1 min-w-0',
        children: [
          e.jsx('h4', {
            className: y('text-sm font-medium truncate', m && 'line-through text-muted-foreground'),
            children: s.title,
          }),
          e.jsxs('div', {
            className: 'flex flex-wrap items-center gap-1.5 mt-1',
            children: [
              e.jsx(F, {
                variant: 'outline',
                className: 'text-[10px] px-1.5 py-0',
                children: a(`sources.${s.source}`),
              }),
              (s.priority === 'high' || s.priority === 'urgent') &&
                e.jsx(F, {
                  variant: l.variant,
                  className: 'text-[10px] px-1.5 py-0',
                  children: a(`sortBy.${s.priority}`, l.label),
                }),
              s.deadline &&
                e.jsxs('div', {
                  className: y(
                    'flex items-center gap-0.5 text-[10px]',
                    s.isOverdue ? 'text-destructive' : 'text-muted-foreground',
                  ),
                  children: [
                    s.isOverdue
                      ? e.jsx(ds, { className: 'h-3 w-3' })
                      : e.jsx(ce, { className: 'h-3 w-3' }),
                    e.jsx('span', { children: Xs(s.deadline, r) }),
                  ],
                }),
            ],
          }),
        ],
      }),
      e.jsx(oe, {
        className: y(
          'h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-center',
          t && 'rotate-180',
        ),
      }),
    ],
  })
}
function et({ label: s, count: r }) {
  return e.jsxs('div', {
    className: 'flex items-center justify-between px-2 py-1.5 bg-muted/50 rounded-lg mb-1',
    children: [
      e.jsx('span', { className: 'text-xs font-medium text-muted-foreground', children: s }),
      e.jsx(F, { variant: 'secondary', className: 'text-[10px] px-1.5 py-0', children: r }),
    ],
  })
}
function st({ config: s, data: r, isLoading: t, onTaskToggle: n }) {
  const { t: a, i18n: i } = L('dashboard-widgets'),
    c = i.language === 'ar',
    l = c ? 'ar-SA' : 'en-US',
    { settings: m } = s,
    o = j.useMemo(() => {
      if (!r) return { items: [], groups: null }
      let u = [...r]
      if (
        (m.filterSource &&
          m.filterSource !== 'all' &&
          (u = u.filter((p) => p.source === m.filterSource)),
        m.showCompleted || (u = u.filter((p) => p.status !== 'completed')),
        u.sort((p, x) => {
          switch (m.sortBy) {
            case 'deadline':
              return !p.deadline && !x.deadline
                ? 0
                : p.deadline
                  ? x.deadline
                    ? new Date(p.deadline).getTime() - new Date(x.deadline).getTime()
                    : -1
                  : 1
            case 'priority':
              const g = { urgent: 0, high: 1, medium: 2, low: 3 }
              return g[p.priority] - g[x.priority]
            case 'created_at':
            default:
              return 0
          }
        }),
        (u = u.slice(0, m.maxItems)),
        m.groupBy !== 'none')
      ) {
        const p = {}
        return (
          u.forEach((x) => {
            const g = x[m.groupBy]
            ;(p[g] || (p[g] = []), p[g].push(x))
          }),
          { items: [], groups: p }
        )
      }
      return { items: u, groups: null }
    }, [r, m])
  return t
    ? e.jsx('div', {
        className: 'h-full space-y-2 animate-pulse',
        children: Array.from({ length: 4 }).map((u, p) =>
          e.jsxs(
            'div',
            {
              className: 'flex items-start gap-3 p-2',
              children: [
                e.jsx('div', { className: 'w-4 h-4 bg-muted rounded' }),
                e.jsx('div', { className: 'w-6 h-6 bg-muted rounded' }),
                e.jsxs('div', {
                  className: 'flex-1',
                  children: [
                    e.jsx('div', { className: 'h-4 w-3/4 bg-muted rounded mb-1' }),
                    e.jsx('div', { className: 'h-3 w-1/2 bg-muted rounded' }),
                  ],
                }),
              ],
            },
            p,
          ),
        ),
      })
    : (o.groups ? Object.keys(o.groups).length === 0 : o.items.length === 0)
      ? e.jsxs('div', {
          className: 'h-full flex flex-col items-center justify-center text-center p-4',
          children: [
            e.jsx(cs, { className: 'h-8 w-8 text-muted-foreground mb-2' }),
            e.jsx('p', {
              className: 'text-sm text-muted-foreground',
              children: a('emptyStates.noTasks'),
            }),
          ],
        })
      : e.jsx(Y, {
          className: 'h-full',
          children: e.jsx('div', {
            className: 'space-y-1',
            children: o.groups
              ? Object.entries(o.groups).map(([u, p]) =>
                  e.jsxs(
                    'div',
                    {
                      className: 'mb-3',
                      children: [
                        e.jsx(et, { label: a(`${m.groupBy}.${u}`, u), count: p.length }),
                        p.map((x) =>
                          e.jsx(
                            xe,
                            { task: x, locale: l, isRTL: c, onToggle: (g) => n?.(x.id, g) },
                            x.id,
                          ),
                        ),
                      ],
                    },
                    u,
                  ),
                )
              : o.items.map((u) =>
                  e.jsx(xe, { task: u, locale: l, isRTL: c, onToggle: (p) => n?.(u.id, p) }, u.id),
                ),
          }),
        })
}
function tt(s) {
  switch (s) {
    case 'task-assigned':
      return hs
    case 'deadline-approaching':
      return ce
    case 'status-change':
      return je
    case 'mention':
      return gs
    case 'system':
      return le
    default:
      return ye
  }
}
function at(s) {
  switch (s) {
    case 'task-assigned':
      return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' }
    case 'deadline-approaching':
      return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' }
    case 'status-change':
      return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' }
    case 'mention':
      return {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-600 dark:text-purple-400',
      }
    case 'system':
      return { bg: 'bg-muted', text: 'text-muted-foreground' }
    default:
      return { bg: 'bg-muted', text: 'text-muted-foreground' }
  }
}
function rt(s, r) {
  const t = new Date(s),
    a = new Date().getTime() - t.getTime(),
    i = Math.floor(a / (1e3 * 60)),
    c = Math.floor(a / (1e3 * 60 * 60)),
    l = Math.floor(a / (1e3 * 60 * 60 * 24)),
    m = new Intl.RelativeTimeFormat(r, { numeric: 'auto' })
  return i < 1
    ? m.format(0, 'second')
    : i < 60
      ? m.format(-i, 'minute')
      : c < 24
        ? m.format(-c, 'hour')
        : l < 7
          ? m.format(-l, 'day')
          : t.toLocaleDateString(r, { month: 'short', day: 'numeric' })
}
function nt({ notification: s, locale: r, isRTL: t, onMarkAsRead: n }) {
  const a = tt(s.category),
    i = at(s.category),
    c = rt(s.createdAt, r)
  return e.jsxs('div', {
    className: y(
      'flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors cursor-pointer group',
      s.isRead ? 'opacity-60 hover:bg-muted/30' : 'bg-muted/30 hover:bg-muted/50',
    ),
    onClick: n,
    children: [
      !s.isRead && e.jsx('div', { className: 'w-2 h-2 mt-2 rounded-full bg-primary shrink-0' }),
      e.jsx('div', {
        className: y('p-1.5 rounded shrink-0', i.bg),
        children: e.jsx(a, { className: y('h-3.5 w-3.5', i.text) }),
      }),
      e.jsxs('div', {
        className: 'flex-1 min-w-0',
        children: [
          e.jsxs('div', {
            className: 'flex items-start justify-between gap-2',
            children: [
              e.jsx('h4', {
                className: y('text-sm truncate', s.isRead ? 'font-normal' : 'font-medium'),
                children: s.title,
              }),
              e.jsx('span', {
                className: 'text-[10px] text-muted-foreground whitespace-nowrap',
                children: c,
              }),
            ],
          }),
          e.jsx('p', {
            className: 'text-xs text-muted-foreground mt-0.5 line-clamp-2',
            children: s.message,
          }),
        ],
      }),
      s.actionUrl &&
        e.jsx(oe, {
          className: y(
            'h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-center',
            t && 'rotate-180',
          ),
        }),
    ],
  })
}
function it({ config: s, data: r, isLoading: t, onMarkAsRead: n }) {
  const { t: a, i18n: i } = L('dashboard-widgets'),
    c = i.language === 'ar',
    l = c ? 'ar-SA' : 'en-US',
    { settings: m } = s,
    o = j.useMemo(() => {
      if (!r) return []
      let d = [...r]
      return (
        m.categories.includes('all') || (d = d.filter((u) => m.categories.includes(u.category))),
        m.showRead || (d = d.filter((u) => !u.isRead)),
        d.sort((u, p) => new Date(p.createdAt).getTime() - new Date(u.createdAt).getTime()),
        d.slice(0, m.maxItems)
      )
    }, [r, m])
  return t
    ? e.jsx('div', {
        className: 'h-full space-y-2 animate-pulse',
        children: Array.from({ length: 4 }).map((d, u) =>
          e.jsxs(
            'div',
            {
              className: 'flex items-start gap-3 p-2',
              children: [
                e.jsx('div', { className: 'w-2 h-2 bg-muted rounded-full mt-2' }),
                e.jsx('div', { className: 'w-6 h-6 bg-muted rounded' }),
                e.jsxs('div', {
                  className: 'flex-1',
                  children: [
                    e.jsx('div', { className: 'h-4 w-3/4 bg-muted rounded mb-1' }),
                    e.jsx('div', { className: 'h-3 w-full bg-muted rounded' }),
                  ],
                }),
              ],
            },
            u,
          ),
        ),
      })
    : o.length
      ? e.jsx(Y, {
          className: 'h-full',
          children: e.jsx('div', {
            className: 'space-y-1',
            children: o.map((d) =>
              e.jsx(
                nt,
                { notification: d, locale: l, isRTL: c, onMarkAsRead: () => n?.(d.id) },
                d.id,
              ),
            ),
          }),
        })
      : e.jsxs('div', {
          className: 'h-full flex flex-col items-center justify-center text-center p-4',
          children: [
            e.jsx(ms, { className: 'h-8 w-8 text-muted-foreground mb-2' }),
            e.jsx('p', {
              className: 'text-sm text-muted-foreground',
              children: a('emptyStates.noNotifications'),
            }),
          ],
        })
}
function lt(s) {
  return (
    {
      Plus: H,
      Search: we,
      Calendar: X,
      FileText: Q,
      Inbox: ve,
      ListTodo: de,
      BarChart2: ne,
      FolderPlus: xs,
    }[s] || H
  )
}
const ot = [
  {
    id: 'create-dossier',
    label: 'Create Dossier',
    labelAr: 'إنشاء ملف',
    icon: 'FolderPlus',
    action: 'create-dossier',
    route: '/dossiers/new',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  },
  {
    id: 'create-task',
    label: 'Create Task',
    labelAr: 'إنشاء مهمة',
    icon: 'ListTodo',
    action: 'create-task',
    route: '/my-work?action=create-task',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  },
  {
    id: 'create-intake',
    label: 'Create Intake',
    labelAr: 'إنشاء استقبال',
    icon: 'Inbox',
    action: 'create-intake',
    route: '/intake/new',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  },
  {
    id: 'search',
    label: 'Search',
    labelAr: 'بحث',
    icon: 'Search',
    action: 'open-search',
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  },
  {
    id: 'view-calendar',
    label: 'Calendar',
    labelAr: 'التقويم',
    icon: 'Calendar',
    action: 'navigate',
    route: '/calendar',
    color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  },
  {
    id: 'view-reports',
    label: 'Reports',
    labelAr: 'التقارير',
    icon: 'BarChart2',
    action: 'navigate',
    route: '/reports',
    color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
  },
]
function ct({ action: s, isRTL: r, onClick: t }) {
  const n = lt(s.icon),
    a = r ? s.labelAr : s.label,
    i = e.jsxs('div', {
      className: 'flex flex-col items-center gap-1.5 p-2 sm:p-3',
      children: [
        e.jsx('div', {
          className: y('p-2 sm:p-3 rounded-lg', s.color || 'bg-muted'),
          children: e.jsx(n, { className: 'h-4 w-4 sm:h-5 sm:w-5' }),
        }),
        e.jsx('span', {
          className: 'text-[10px] sm:text-xs font-medium text-center line-clamp-1',
          children: a,
        }),
      ],
    })
  return s.route && s.action === 'navigate'
    ? e.jsx(zs, {
        to: s.route,
        className: y(
          'flex-1 min-w-[70px] sm:min-w-[80px] rounded-lg transition-colors',
          'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        ),
        children: i,
      })
    : e.jsx('button', {
        onClick: t,
        className: y(
          'flex-1 min-w-[70px] sm:min-w-[80px] rounded-lg transition-colors',
          'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        ),
        children: i,
      })
}
function dt({ config: s, onActionClick: r }) {
  const { i18n: t } = L('dashboard-widgets'),
    n = t.language === 'ar',
    { settings: a } = s,
    i = a.actions.length > 0 ? a.actions : ot,
    c = (l) => {
      r && r(l)
    }
  return e.jsx('div', {
    className: 'h-full flex items-center justify-center',
    children: e.jsx('div', {
      className: 'flex flex-wrap justify-center gap-2 sm:gap-3 p-1',
      children: i.map((l) => e.jsx(ct, { action: l, isRTL: n, onClick: () => c(l) }, l.id)),
    }),
  })
}
function pe(s, r, t) {
  switch (s.type) {
    case 'kpi-card':
      return e.jsx(Fs, { config: s, data: r, isLoading: t })
    case 'chart':
      return e.jsx(Us, { config: s, data: r, isLoading: t })
    case 'upcoming-events':
      return e.jsx(Qs, { config: s, data: r, isLoading: t })
    case 'task-list':
      return e.jsx(st, { config: s, data: r, isLoading: t })
    case 'notifications':
      return e.jsx(it, { config: s, data: r, isLoading: t })
    case 'quick-actions':
      return e.jsx(dt, { config: s })
    default:
      return e.jsxs('div', {
        className: 'h-full flex items-center justify-center text-sm text-muted-foreground',
        children: ['Unknown widget type: ', s.type],
      })
  }
}
function ut({
  widgets: s,
  widgetData: r,
  isEditMode: t,
  onReorder: n,
  onRemove: a,
  onSettings: i,
  onRefresh: c,
  className: l,
}) {
  const { i18n: m } = L('dashboard-widgets'),
    o = m.language === 'ar',
    [d, u] = j.useState(null),
    p = ps(
      te(vs, { activationConstraint: { distance: 8 } }),
      te(bs, { activationConstraint: { delay: 200, tolerance: 5 } }),
      te(js, { coordinateGetter: fs }),
    ),
    x = j.useCallback(
      (h) => {
        const { active: f } = h,
          v = s.find((k) => k.id === f.id)
        v && u(v)
      },
      [s],
    ),
    g = j.useCallback(
      (h) => {
        const { active: f, over: v } = h
        if ((u(null), v && f.id !== v.id)) {
          const k = s.findIndex((C) => C.id === f.id),
            S = s.findIndex((C) => C.id === v.id)
          if (k !== -1 && S !== -1) {
            const C = ys(s, k, S).map((T, I) => ({ ...T, order: I }))
            n(C)
          }
        }
      },
      [s, n],
    ),
    N = s.map((h) => h.id)
  return e.jsxs(ws, {
    sensors: p,
    collisionDetection: ks,
    onDragStart: x,
    onDragEnd: g,
    children: [
      e.jsx(Ns, {
        items: N,
        strategy: Ss,
        children: e.jsx('div', {
          className: y(
            'grid gap-4',
            'grid-cols-1',
            'sm:grid-cols-2',
            'lg:grid-cols-3',
            'xl:grid-cols-4',
            'auto-rows-[minmax(150px,auto)]',
            l,
          ),
          dir: o ? 'rtl' : 'ltr',
          children: s
            .filter((h) => h.isVisible)
            .sort((h, f) => h.order - f.order)
            .map((h) => {
              const f = r[h.id],
                v = !f
              return e.jsx(
                ie,
                {
                  id: h.id,
                  title: h.title,
                  size: h.size,
                  isEditMode: t,
                  loadingState: { isLoading: v, isError: !1 },
                  onSettings: () => i(h),
                  onRefresh: c ? () => c(h.id) : void 0,
                  onRemove: () => a(h.id),
                  children: pe(h, f, v),
                },
                h.id,
              )
            }),
        }),
      }),
      e.jsx(Cs, {
        adjustScale: !1,
        children: d
          ? e.jsx('div', {
              className: y('opacity-90 shadow-lg rounded-lg', 'ring-2 ring-primary'),
              children: e.jsx(ie, {
                id: d.id,
                title: d.title,
                size: d.size,
                isEditMode: !1,
                children: pe(d, r[d.id], !1),
              }),
            })
          : null,
      }),
    ],
  })
}
const ke = {
  'kpi-card': {
    type: 'kpi-card',
    name: 'KPI Card',
    nameAr: 'بطاقة مؤشر الأداء',
    description: 'Display key performance indicators with trends',
    descriptionAr: 'عرض مؤشرات الأداء الرئيسية مع الاتجاهات',
    icon: 'TrendingUp',
    defaultSize: 'small',
    minSize: 'small',
    maxSize: 'medium',
    supportedSizes: ['small', 'medium'],
    defaultConfig: {
      settings: {
        metric: 'active-dossiers',
        showTrend: !0,
        showSparkline: !1,
        comparisonPeriod: 'week',
      },
    },
  },
  chart: {
    type: 'chart',
    name: 'Chart',
    nameAr: 'رسم بياني',
    description: 'Visualize data with various chart types',
    descriptionAr: 'تصور البيانات بأنواع مختلفة من الرسوم البيانية',
    icon: 'BarChart2',
    defaultSize: 'medium',
    minSize: 'medium',
    maxSize: 'full',
    supportedSizes: ['medium', 'large', 'full'],
    defaultConfig: {
      settings: {
        chartType: 'bar',
        dataSource: 'work-items-by-status',
        showLegend: !0,
        showGrid: !0,
        dateRange: 'week',
      },
    },
  },
  'upcoming-events': {
    type: 'upcoming-events',
    name: 'Upcoming Events',
    nameAr: 'الأحداث القادمة',
    description: 'Show upcoming deadlines and events',
    descriptionAr: 'عرض المواعيد النهائية والأحداث القادمة',
    icon: 'Calendar',
    defaultSize: 'medium',
    minSize: 'small',
    maxSize: 'large',
    supportedSizes: ['small', 'medium', 'large'],
    defaultConfig: {
      settings: { maxItems: 5, showPastEvents: !1, eventTypes: ['all'], dateRange: 'week' },
    },
  },
  'task-list': {
    type: 'task-list',
    name: 'Task List',
    nameAr: 'قائمة المهام',
    description: 'Display your tasks and work items',
    descriptionAr: 'عرض المهام وبنود العمل',
    icon: 'ListTodo',
    defaultSize: 'medium',
    minSize: 'small',
    maxSize: 'large',
    supportedSizes: ['small', 'medium', 'large'],
    defaultConfig: {
      settings: {
        maxItems: 10,
        showCompleted: !1,
        groupBy: 'none',
        sortBy: 'deadline',
        filterSource: 'all',
      },
    },
  },
  notifications: {
    type: 'notifications',
    name: 'Notifications',
    nameAr: 'الإشعارات',
    description: 'Show recent notifications and alerts',
    descriptionAr: 'عرض الإشعارات والتنبيهات الأخيرة',
    icon: 'Bell',
    defaultSize: 'medium',
    minSize: 'small',
    maxSize: 'large',
    supportedSizes: ['small', 'medium', 'large'],
    defaultConfig: { settings: { maxItems: 10, showRead: !1, categories: ['all'] } },
  },
  'activity-feed': {
    type: 'activity-feed',
    name: 'Activity Feed',
    nameAr: 'سجل النشاط',
    description: 'Track recent activity and changes',
    descriptionAr: 'تتبع النشاط والتغييرات الأخيرة',
    icon: 'Activity',
    defaultSize: 'medium',
    minSize: 'medium',
    maxSize: 'large',
    supportedSizes: ['medium', 'large'],
    defaultConfig: { settings: { maxItems: 10, activityTypes: ['all'], showTimestamps: !0 } },
  },
  'quick-actions': {
    type: 'quick-actions',
    name: 'Quick Actions',
    nameAr: 'الإجراءات السريعة',
    description: 'Access frequently used actions',
    descriptionAr: 'الوصول إلى الإجراءات المستخدمة بشكل متكرر',
    icon: 'Zap',
    defaultSize: 'medium',
    minSize: 'small',
    maxSize: 'full',
    supportedSizes: ['small', 'medium', 'large', 'full'],
    defaultConfig: { settings: { actions: [] } },
  },
  'stats-summary': {
    type: 'stats-summary',
    name: 'Stats Summary',
    nameAr: 'ملخص الإحصائيات',
    description: 'Overview of key statistics',
    descriptionAr: 'نظرة عامة على الإحصائيات الرئيسية',
    icon: 'PieChart',
    defaultSize: 'large',
    minSize: 'medium',
    maxSize: 'full',
    supportedSizes: ['medium', 'large', 'full'],
    defaultConfig: {
      settings: {
        metrics: ['active-dossiers', 'pending-tasks', 'overdue-items'],
        layout: 'grid',
        showTrends: !0,
      },
    },
  },
}
function mt(s) {
  return (
    {
      TrendingUp: be,
      BarChart2: ne,
      Calendar: X,
      ListTodo: de,
      Bell: ye,
      Activity: As,
      Zap: Ds,
      PieChart: Ts,
    }[s] || ne
  )
}
const gt = {
  'kpi-card': 'metrics',
  chart: 'data',
  'upcoming-events': 'lists',
  'task-list': 'lists',
  notifications: 'lists',
  'activity-feed': 'lists',
  'quick-actions': 'other',
  'stats-summary': 'metrics',
}
function ht({ entry: s, isRTL: r, isAdded: t, onAdd: n }) {
  const { t: a } = L('dashboard-widgets'),
    i = mt(s.icon),
    c = r ? s.nameAr : s.name,
    l = r ? s.descriptionAr : s.description
  return e.jsx('div', {
    className: y(
      'p-3 sm:p-4 rounded-lg border bg-card',
      'hover:border-primary/50 hover:shadow-sm transition-all',
      t && 'opacity-50',
    ),
    children: e.jsxs('div', {
      className: 'flex items-start gap-3',
      children: [
        e.jsx('div', {
          className: 'p-2 rounded-lg bg-primary/10 shrink-0',
          children: e.jsx(i, { className: 'h-5 w-5 text-primary' }),
        }),
        e.jsxs('div', {
          className: 'flex-1 min-w-0',
          children: [
            e.jsxs('div', {
              className: 'flex items-center gap-2 mb-1',
              children: [
                e.jsx('h4', { className: 'font-medium text-sm', children: c }),
                t &&
                  e.jsx(F, {
                    variant: 'secondary',
                    className: 'text-[10px] px-1.5 py-0',
                    children: a('actions.added', 'Added'),
                  }),
              ],
            }),
            e.jsx('p', { className: 'text-xs text-muted-foreground line-clamp-2', children: l }),
            e.jsx('div', {
              className: 'flex items-center gap-2 mt-2',
              children: e.jsx(F, {
                variant: 'outline',
                className: 'text-[10px] px-1.5 py-0',
                children: a(`settings.sizes.${s.defaultSize}`),
              }),
            }),
          ],
        }),
        e.jsxs(z, {
          variant: 'ghost',
          size: 'icon',
          onClick: n,
          disabled: t,
          className: 'shrink-0 h-8 w-8',
          children: [
            e.jsx(H, { className: 'h-4 w-4' }),
            e.jsx('span', { className: 'sr-only', children: a('addWidget') }),
          ],
        }),
      ],
    }),
  })
}
function xt({ isOpen: s, onClose: r, onAddWidget: t, existingWidgetTypes: n = [] }) {
  const { t: a, i18n: i } = L('dashboard-widgets'),
    c = i.language === 'ar',
    [l, m] = j.useState(''),
    [o, d] = j.useState('all'),
    u = j.useMemo(
      () =>
        Object.values(ke).filter((g) => {
          if (l) {
            const N = l.toLowerCase(),
              h = c ? g.nameAr : g.name,
              f = c ? g.descriptionAr : g.description
            if (!h.toLowerCase().includes(N) && !f.toLowerCase().includes(N)) return !1
          }
          return !(o !== 'all' && gt[g.type] !== o)
        }),
      [l, o, c],
    ),
    p = [
      { value: 'all', label: a('widgetLibrary.categories.all') },
      { value: 'metrics', label: a('widgetLibrary.categories.metrics') },
      { value: 'data', label: a('widgetLibrary.categories.data') },
      { value: 'lists', label: a('widgetLibrary.categories.lists') },
      { value: 'other', label: a('widgetLibrary.categories.other') },
    ]
  return e.jsx(Le, {
    open: s,
    onOpenChange: (x) => !x && r(),
    children: e.jsxs(Re, {
      side: c ? 'left' : 'right',
      className: 'w-full sm:max-w-md',
      dir: c ? 'rtl' : 'ltr',
      children: [
        e.jsxs(ze, {
          className: 'mb-4',
          children: [
            e.jsx(We, { children: a('widgetLibrary.title') }),
            e.jsx(Me, { children: a('widgetLibrary.description') }),
          ],
        }),
        e.jsxs('div', {
          className: 'relative mb-4',
          children: [
            e.jsx(we, {
              className: 'absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
            }),
            e.jsx(J, {
              placeholder: a('widgetLibrary.search'),
              value: l,
              onChange: (x) => m(x.target.value),
              className: 'ps-9',
            }),
          ],
        }),
        e.jsx('div', {
          className: 'flex flex-wrap gap-1.5 mb-4',
          children: p.map((x) =>
            e.jsx(
              z,
              {
                variant: o === x.value ? 'default' : 'outline',
                size: 'sm',
                onClick: () => d(x.value),
                className: 'text-xs h-7',
                children: x.label,
              },
              x.value,
            ),
          ),
        }),
        e.jsx(Y, {
          className: 'h-[calc(100vh-280px)]',
          children: e.jsx('div', {
            className: 'space-y-3 pe-4',
            children:
              u.length === 0
                ? e.jsx('div', {
                    className: 'text-center py-8 text-sm text-muted-foreground',
                    children: a('emptyStates.noWidgets'),
                  })
                : u.map((x) =>
                    e.jsx(
                      ht,
                      {
                        entry: x,
                        isRTL: c,
                        isAdded: n.includes(x.type),
                        onAdd: () => {
                          t(x.type)
                        },
                      },
                      x.type,
                    ),
                  ),
          }),
        }),
      ],
    }),
  })
}
const pt = [
    { value: 'small', label: 'settings.sizes.small' },
    { value: 'medium', label: 'settings.sizes.medium' },
    { value: 'large', label: 'settings.sizes.large' },
    { value: 'full', label: 'settings.sizes.full' },
  ],
  ft = [
    { value: 0, label: 'settings.intervals.never' },
    { value: 3e4, label: 'settings.intervals.30s' },
    { value: 6e4, label: 'settings.intervals.1m' },
    { value: 3e5, label: 'settings.intervals.5m' },
    { value: 6e5, label: 'settings.intervals.10m' },
    { value: 18e5, label: 'settings.intervals.30m' },
  ],
  jt = [
    'active-dossiers',
    'pending-tasks',
    'overdue-items',
    'completed-this-week',
    'response-rate',
    'engagement-count',
    'intake-volume',
    'sla-compliance',
  ],
  bt = ['line', 'bar', 'pie', 'donut', 'area', 'sparkline'],
  vt = [
    'work-items-by-status',
    'work-items-by-source',
    'completion-trend',
    'intake-volume-trend',
    'engagement-distribution',
    'priority-breakdown',
    'team-workload',
  ]
function yt({ widget: s, onChange: r, t }) {
  return e.jsxs('div', {
    className: 'space-y-4',
    children: [
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx(D, { htmlFor: 'widget-title', children: t('settings.widgetTitle') }),
          e.jsx(J, {
            id: 'widget-title',
            value: s.title,
            onChange: (n) => r({ title: n.target.value }),
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx(D, { htmlFor: 'widget-size', children: t('settings.widgetSize') }),
          e.jsxs(W, {
            value: s.size,
            onValueChange: (n) => r({ size: n }),
            children: [
              e.jsx(M, { id: 'widget-size', children: e.jsx(P, {}) }),
              e.jsx($, {
                children: pt.map((n) =>
                  e.jsx(w, { value: n.value, children: t(n.label) }, n.value),
                ),
              }),
            ],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx(D, { htmlFor: 'refresh-interval', children: t('settings.refreshInterval') }),
          e.jsxs(W, {
            value: String(s.refreshInterval),
            onValueChange: (n) => r({ refreshInterval: Number(n) }),
            children: [
              e.jsx(M, { id: 'refresh-interval', children: e.jsx(P, {}) }),
              e.jsx($, {
                children: ft.map((n) =>
                  e.jsx(w, { value: String(n.value), children: t(n.label) }, n.value),
                ),
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
function wt({ settings: s, onChange: r, t }) {
  const n = s
  return e.jsxs('div', {
    className: 'space-y-4',
    children: [
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx(D, { children: t('settings.kpi.metric') }),
          e.jsxs(W, {
            value: n.metric,
            onValueChange: (a) => r({ metric: a }),
            children: [
              e.jsx(M, { children: e.jsx(P, {}) }),
              e.jsx($, {
                children: jt.map((a) => e.jsx(w, { value: a, children: t(`metrics.${a}`) }, a)),
              }),
            ],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          e.jsx(D, { htmlFor: 'show-trend', children: t('settings.kpi.showTrend') }),
          e.jsx(V, {
            id: 'show-trend',
            checked: n.showTrend,
            onCheckedChange: (a) => r({ showTrend: a }),
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          e.jsx(D, { htmlFor: 'show-sparkline', children: t('settings.kpi.showSparkline') }),
          e.jsx(V, {
            id: 'show-sparkline',
            checked: n.showSparkline,
            onCheckedChange: (a) => r({ showSparkline: a }),
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx(D, { children: t('settings.kpi.comparisonPeriod') }),
          e.jsxs(W, {
            value: n.comparisonPeriod,
            onValueChange: (a) => r({ comparisonPeriod: a }),
            children: [
              e.jsx(M, { children: e.jsx(P, {}) }),
              e.jsxs($, {
                children: [
                  e.jsx(w, { value: 'day', children: t('periods.day') }),
                  e.jsx(w, { value: 'week', children: t('periods.week') }),
                  e.jsx(w, { value: 'month', children: t('periods.month') }),
                  e.jsx(w, { value: 'quarter', children: t('periods.quarter') }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
function kt({ settings: s, onChange: r, t }) {
  const n = s
  return e.jsxs('div', {
    className: 'space-y-4',
    children: [
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx(D, { children: t('settings.chart.chartType') }),
          e.jsxs(W, {
            value: n.chartType,
            onValueChange: (a) => r({ chartType: a }),
            children: [
              e.jsx(M, { children: e.jsx(P, {}) }),
              e.jsx($, {
                children: bt.map((a) => e.jsx(w, { value: a, children: t(`chartTypes.${a}`) }, a)),
              }),
            ],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx(D, { children: t('settings.chart.dataSource') }),
          e.jsxs(W, {
            value: n.dataSource,
            onValueChange: (a) => r({ dataSource: a }),
            children: [
              e.jsx(M, { children: e.jsx(P, {}) }),
              e.jsx($, {
                children: vt.map((a) => e.jsx(w, { value: a, children: t(`dataSources.${a}`) }, a)),
              }),
            ],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          e.jsx(D, { htmlFor: 'show-legend', children: t('settings.chart.showLegend') }),
          e.jsx(V, {
            id: 'show-legend',
            checked: n.showLegend,
            onCheckedChange: (a) => r({ showLegend: a }),
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          e.jsx(D, { htmlFor: 'show-grid', children: t('settings.chart.showGrid') }),
          e.jsx(V, {
            id: 'show-grid',
            checked: n.showGrid,
            onCheckedChange: (a) => r({ showGrid: a }),
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx(D, { children: t('settings.chart.dateRange') }),
          e.jsxs(W, {
            value: n.dateRange,
            onValueChange: (a) => r({ dateRange: a }),
            children: [
              e.jsx(M, { children: e.jsx(P, {}) }),
              e.jsxs($, {
                children: [
                  e.jsx(w, { value: 'week', children: t('periods.week') }),
                  e.jsx(w, { value: 'month', children: t('periods.month') }),
                  e.jsx(w, { value: 'quarter', children: t('periods.quarter') }),
                  e.jsx(w, { value: 'year', children: t('periods.year') }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
function Nt({ settings: s, onChange: r, t }) {
  const n = s
  return e.jsxs('div', {
    className: 'space-y-4',
    children: [
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx(D, { htmlFor: 'max-items', children: t('settings.events.maxItems') }),
          e.jsx(J, {
            id: 'max-items',
            type: 'number',
            min: 1,
            max: 20,
            value: n.maxItems,
            onChange: (a) => r({ maxItems: Number(a.target.value) }),
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          e.jsx(D, { htmlFor: 'show-past', children: t('settings.events.showPastEvents') }),
          e.jsx(V, {
            id: 'show-past',
            checked: n.showPastEvents,
            onCheckedChange: (a) => r({ showPastEvents: a }),
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx(D, { children: t('settings.events.dateRange') }),
          e.jsxs(W, {
            value: n.dateRange,
            onValueChange: (a) => r({ dateRange: a }),
            children: [
              e.jsx(M, { children: e.jsx(P, {}) }),
              e.jsxs($, {
                children: [
                  e.jsx(w, { value: 'today', children: t('periods.today') }),
                  e.jsx(w, { value: 'week', children: t('periods.week') }),
                  e.jsx(w, { value: 'month', children: t('periods.month') }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
function St({ settings: s, onChange: r, t }) {
  const n = s
  return e.jsxs('div', {
    className: 'space-y-4',
    children: [
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx(D, { htmlFor: 'max-items', children: t('settings.tasks.maxItems') }),
          e.jsx(J, {
            id: 'max-items',
            type: 'number',
            min: 1,
            max: 20,
            value: n.maxItems,
            onChange: (a) => r({ maxItems: Number(a.target.value) }),
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          e.jsx(D, { htmlFor: 'show-completed', children: t('settings.tasks.showCompleted') }),
          e.jsx(V, {
            id: 'show-completed',
            checked: n.showCompleted,
            onCheckedChange: (a) => r({ showCompleted: a }),
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx(D, { children: t('settings.tasks.groupBy') }),
          e.jsxs(W, {
            value: n.groupBy,
            onValueChange: (a) => r({ groupBy: a }),
            children: [
              e.jsx(M, { children: e.jsx(P, {}) }),
              e.jsxs($, {
                children: [
                  e.jsx(w, { value: 'none', children: t('groupBy.none') }),
                  e.jsx(w, { value: 'source', children: t('groupBy.source') }),
                  e.jsx(w, { value: 'priority', children: t('groupBy.priority') }),
                  e.jsx(w, { value: 'status', children: t('groupBy.status') }),
                ],
              }),
            ],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx(D, { children: t('settings.tasks.sortBy') }),
          e.jsxs(W, {
            value: n.sortBy,
            onValueChange: (a) => r({ sortBy: a }),
            children: [
              e.jsx(M, { children: e.jsx(P, {}) }),
              e.jsxs($, {
                children: [
                  e.jsx(w, { value: 'deadline', children: t('sortBy.deadline') }),
                  e.jsx(w, { value: 'priority', children: t('sortBy.priority') }),
                  e.jsx(w, { value: 'created_at', children: t('sortBy.created_at') }),
                ],
              }),
            ],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx(D, { children: t('settings.tasks.filterSource') }),
          e.jsxs(W, {
            value: n.filterSource || 'all',
            onValueChange: (a) => r({ filterSource: a }),
            children: [
              e.jsx(M, { children: e.jsx(P, {}) }),
              e.jsxs($, {
                children: [
                  e.jsx(w, { value: 'all', children: t('sources.all') }),
                  e.jsx(w, { value: 'commitment', children: t('sources.commitment') }),
                  e.jsx(w, { value: 'task', children: t('sources.task') }),
                  e.jsx(w, { value: 'intake', children: t('sources.intake') }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
function Ct({ widget: s, isOpen: r, onClose: t, onSave: n }) {
  const { t: a, i18n: i } = L('dashboard-widgets'),
    c = i.language === 'ar',
    [l, m] = j.useState(null)
  if (
    (j.useEffect(() => {
      s && m({ ...s })
    }, [s]),
    !l)
  )
    return null
  const o = (x) => {
      m((g) => g && { ...g, ...x })
    },
    d = (x) => {
      m((g) => g && { ...g, settings: { ...g.settings, ...x } })
    },
    u = () => {
      l && (n(l), t())
    },
    p = () => {
      switch (l.type) {
        case 'kpi-card':
          return e.jsx(wt, { settings: l.settings, onChange: d, t: a })
        case 'chart':
          return e.jsx(kt, { settings: l.settings, onChange: d, t: a })
        case 'upcoming-events':
          return e.jsx(Nt, { settings: l.settings, onChange: d, t: a })
        case 'task-list':
          return e.jsx(St, { settings: l.settings, onChange: d, t: a })
        default:
          return e.jsxs('div', {
            className: 'text-sm text-muted-foreground',
            children: [a('settings.general'), ' ', a('settings.title')],
          })
      }
    }
  return e.jsx(Pe, {
    open: r,
    onOpenChange: (x) => !x && t(),
    children: e.jsxs($e, {
      className: 'sm:max-w-md',
      dir: c ? 'rtl' : 'ltr',
      children: [
        e.jsxs(Ee, {
          children: [
            e.jsx(Oe, { children: a('settings.title') }),
            e.jsx(Be, { children: a('widgetTypes.' + l.type + '.name', l.type) }),
          ],
        }),
        e.jsxs(Fe, {
          defaultValue: 'general',
          className: 'mt-4',
          children: [
            e.jsxs(Ve, {
              className: 'grid w-full grid-cols-2',
              children: [
                e.jsx(ue, { value: 'general', children: a('settings.general') }),
                e.jsx(ue, { value: 'widget', children: a('settings.data') }),
              ],
            }),
            e.jsx(me, {
              value: 'general',
              className: 'mt-4',
              children: e.jsx(yt, { widget: l, onChange: o, t: a }),
            }),
            e.jsx(me, { value: 'widget', className: 'mt-4', children: p() }),
          ],
        }),
        e.jsxs(_e, {
          className: 'mt-6',
          children: [
            e.jsx(z, { variant: 'outline', onClick: t, children: a('actions.cancel', 'Cancel') }),
            e.jsx(z, { onClick: u, children: a('saveLayout') }),
          ],
        }),
      ],
    }),
  })
}
const Z = {
    all: ['widget-dashboard'],
    layout: () => [...Z.all, 'layout'],
    widgetData: (s) => [...Z.all, 'data', s],
  },
  ae = 'dashboard-widget-layout',
  re = (s) => [
    {
      id: B(),
      type: 'kpi-card',
      title: s('metrics.active-dossiers'),
      size: 'small',
      refreshInterval: 3e5,
      isVisible: !0,
      order: 0,
      settings: {
        metric: 'active-dossiers',
        showTrend: !0,
        showSparkline: !1,
        comparisonPeriod: 'week',
      },
    },
    {
      id: B(),
      type: 'kpi-card',
      title: s('metrics.pending-tasks'),
      size: 'small',
      refreshInterval: 3e5,
      isVisible: !0,
      order: 1,
      settings: {
        metric: 'pending-tasks',
        showTrend: !0,
        showSparkline: !1,
        comparisonPeriod: 'week',
      },
    },
    {
      id: B(),
      type: 'kpi-card',
      title: s('metrics.overdue-items'),
      size: 'small',
      refreshInterval: 3e5,
      isVisible: !0,
      order: 2,
      settings: {
        metric: 'overdue-items',
        showTrend: !0,
        showSparkline: !1,
        comparisonPeriod: 'week',
      },
    },
    {
      id: B(),
      type: 'kpi-card',
      title: s('metrics.completed-this-week'),
      size: 'small',
      refreshInterval: 3e5,
      isVisible: !0,
      order: 3,
      settings: {
        metric: 'completed-this-week',
        showTrend: !0,
        showSparkline: !1,
        comparisonPeriod: 'week',
      },
    },
    {
      id: B(),
      type: 'chart',
      title: s('dataSources.work-items-by-status'),
      size: 'medium',
      refreshInterval: 3e5,
      isVisible: !0,
      order: 4,
      settings: {
        chartType: 'bar',
        dataSource: 'work-items-by-status',
        showLegend: !0,
        showGrid: !0,
        dateRange: 'week',
      },
    },
    {
      id: B(),
      type: 'upcoming-events',
      title: s('widgetTypes.upcoming-events.name'),
      size: 'medium',
      refreshInterval: 3e5,
      isVisible: !0,
      order: 5,
      settings: { maxItems: 5, showPastEvents: !1, eventTypes: ['all'], dateRange: 'week' },
    },
    {
      id: B(),
      type: 'task-list',
      title: s('widgetTypes.task-list.name'),
      size: 'medium',
      refreshInterval: 3e5,
      isVisible: !0,
      order: 6,
      settings: {
        maxItems: 10,
        showCompleted: !1,
        groupBy: 'none',
        sortBy: 'deadline',
        filterSource: 'all',
      },
    },
    {
      id: B(),
      type: 'quick-actions',
      title: s('widgetTypes.quick-actions.name'),
      size: 'medium',
      refreshInterval: 0,
      isVisible: !0,
      order: 7,
      settings: { actions: [] },
    },
  ]
function Tt(s) {
  const t =
      {
        'active-dossiers': 147,
        'pending-tasks': 23,
        'overdue-items': 5,
        'completed-this-week': 42,
        'response-rate': 94.5,
        'engagement-count': 18,
        'intake-volume': 156,
        'sla-compliance': 98.2,
      }[s] || Math.floor(Math.random() * 100),
    n = t + (Math.random() - 0.5) * t * 0.2,
    a = ((t - n) / n) * 100
  return {
    value: t,
    previousValue: n,
    trend: a > 1 ? 'up' : a < -1 ? 'down' : 'neutral',
    trendPercentage: Math.abs(a),
    sparklineData: Array.from({ length: 7 }, () => Math.floor(t * (0.8 + Math.random() * 0.4))),
  }
}
function Dt(s) {
  switch (s) {
    case 'work-items-by-status':
      return {
        labels: ['Pending', 'In Progress', 'Review', 'Completed'],
        datasets: [
          {
            label: 'Work Items',
            data: [23, 15, 8, 42],
            backgroundColor: ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'],
          },
        ],
        total: 88,
      }
    case 'work-items-by-source':
      return {
        labels: ['Tasks', 'Commitments', 'Intake'],
        datasets: [
          {
            label: 'Work Items',
            data: [35, 28, 25],
            backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6'],
          },
        ],
        total: 88,
      }
    case 'completion-trend':
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{ label: 'Completed', data: [8, 12, 6, 15, 10, 4, 7], borderColor: '#10b981' }],
      }
    default:
      return { labels: ['A', 'B', 'C', 'D'], datasets: [{ label: 'Data', data: [25, 35, 20, 20] }] }
  }
}
function At() {
  const s = new Date()
  return [
    {
      id: '1',
      title: 'Team Meeting',
      type: 'meeting',
      startDate: new Date(s.getTime() + 2 * 60 * 60 * 1e3).toISOString(),
      description: 'Weekly sync with the team',
    },
    {
      id: '2',
      title: 'Report Deadline',
      type: 'deadline',
      startDate: new Date(s.getTime() + 24 * 60 * 60 * 1e3).toISOString(),
      description: 'Q4 report submission',
      priority: 'high',
    },
    {
      id: '3',
      title: 'Follow-up: Saudi Embassy',
      type: 'follow-up',
      startDate: new Date(s.getTime() + 48 * 60 * 60 * 1e3).toISOString(),
    },
    {
      id: '4',
      title: 'MOU Renewal - UAE',
      type: 'mou-renewal',
      startDate: new Date(s.getTime() + 72 * 60 * 60 * 1e3).toISOString(),
      priority: 'high',
    },
    {
      id: '5',
      title: 'Engagement Review',
      type: 'engagement',
      startDate: new Date(s.getTime() + 96 * 60 * 60 * 1e3).toISOString(),
    },
  ]
}
function It() {
  return [
    {
      id: '1',
      title: 'Review dossier updates',
      source: 'task',
      priority: 'high',
      status: 'pending',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString(),
    },
    {
      id: '2',
      title: 'Prepare briefing document',
      source: 'commitment',
      priority: 'urgent',
      status: 'in_progress',
      deadline: new Date(Date.now() + 2 * 60 * 60 * 1e3).toISOString(),
      isOverdue: !1,
    },
    {
      id: '3',
      title: 'Response to intake ticket #156',
      source: 'intake',
      priority: 'medium',
      status: 'pending',
      deadline: new Date(Date.now() - 2 * 60 * 60 * 1e3).toISOString(),
      isOverdue: !0,
    },
    {
      id: '4',
      title: 'Update contact information',
      source: 'task',
      priority: 'low',
      status: 'pending',
    },
    {
      id: '5',
      title: 'Follow up on meeting notes',
      source: 'commitment',
      priority: 'medium',
      status: 'completed',
    },
  ]
}
function Lt() {
  return [
    {
      id: '1',
      title: 'New Task Assigned',
      message: 'You have been assigned to review the Q4 report',
      category: 'task-assigned',
      isRead: !1,
      createdAt: new Date(Date.now() - 5 * 60 * 1e3).toISOString(),
      actionUrl: '/my-work',
    },
    {
      id: '2',
      title: 'Deadline Approaching',
      message: 'Report submission due in 2 hours',
      category: 'deadline-approaching',
      isRead: !1,
      createdAt: new Date(Date.now() - 30 * 60 * 1e3).toISOString(),
    },
    {
      id: '3',
      title: 'Status Updated',
      message: 'Dossier #147 status changed to Active',
      category: 'status-change',
      isRead: !0,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1e3).toISOString(),
    },
    {
      id: '4',
      title: 'You were mentioned',
      message: 'Ahmed mentioned you in a comment',
      category: 'mention',
      isRead: !1,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1e3).toISOString(),
    },
  ]
}
function Rt(s) {
  return Ms({
    queryKey: Z.widgetData(s.id),
    queryFn: async () => {
      switch ((await new Promise((r) => setTimeout(r, 500)), s.type)) {
        case 'kpi-card': {
          const r = s.settings
          return Tt(r.metric)
        }
        case 'chart': {
          const r = s.settings
          return Dt(r.dataSource)
        }
        case 'upcoming-events':
          return At()
        case 'task-list':
          return It()
        case 'notifications':
          return Lt()
        case 'quick-actions':
          return null
        default:
          return null
      }
    },
    refetchInterval: s.refreshInterval || !1,
    staleTime: 3e4,
  })
}
function zt(s = {}) {
  const { autoSave: r = !0 } = s,
    { t } = L('dashboard-widgets'),
    n = Ws(),
    [a, i] = j.useState([]),
    [c, l] = j.useState(!1),
    [m, o] = j.useState(null),
    [d, u] = j.useState(!1),
    [p, x] = j.useState(!1),
    [g, N] = j.useState(!1)
  ;(j.useEffect(() => {
    ;(() => {
      try {
        const A = localStorage.getItem(ae)
        if (A) {
          const E = JSON.parse(A)
          i(E)
        } else i(re(t))
      } catch (A) {
        ;(console.error('Failed to load dashboard layout:', A), i(re(t)))
      }
      N(!0)
    })()
  }, [t]),
    j.useEffect(() => {
      if (r && g && a.length > 0)
        try {
          localStorage.setItem(ae, JSON.stringify(a))
        } catch (b) {
          console.error('Failed to save dashboard layout:', b)
        }
    }, [a, r, g]))
  const h = a.map((b) => ({ widget: b, ...Rt(b) })),
    f = j.useMemo(() => h.reduce((b, { widget: A, data: E }) => ((b[A.id] = E), b), {}), [h]),
    v = j.useCallback(
      (b) => {
        const A = ke[b]
        if (!A) return
        const E = {
          id: B(),
          type: b,
          title: t(`widgetTypes.${b}.name`),
          size: A.defaultSize,
          refreshInterval: 3e5,
          isVisible: !0,
          order: a.length,
          settings: A.defaultConfig?.settings || {},
        }
        i((Ne) => [...Ne, E])
      },
      [a.length, t],
    ),
    k = j.useCallback((b) => {
      i((A) => A.filter((E) => E.id !== b))
    }, []),
    S = j.useCallback((b) => {
      i((A) => A.map((E) => (E.id === b.id ? b : E)))
    }, []),
    C = j.useCallback((b) => {
      i(b)
    }, []),
    T = j.useCallback(() => {
      ;(i(re(t)), localStorage.removeItem(ae))
    }, [t]),
    I = j.useCallback(
      (b) => {
        n.invalidateQueries({ queryKey: Z.widgetData(b) })
      },
      [n],
    ),
    O = j.useCallback((b) => {
      ;(o(b), x(!0))
    }, []),
    R = j.useCallback(() => {
      ;(o(null), x(!1))
    }, []),
    ee = j.useCallback(() => {
      l((b) => !b)
    }, []),
    se = j.useMemo(() => a.map((b) => b.type), [a])
  return {
    widgets: a,
    widgetData: f,
    isEditMode: c,
    selectedWidget: m,
    isLibraryOpen: d,
    isSettingsOpen: p,
    isInitialized: g,
    existingWidgetTypes: se,
    addWidget: v,
    removeWidget: k,
    updateWidget: S,
    reorderWidgets: C,
    resetLayout: T,
    refreshWidget: I,
    openSettings: O,
    closeSettings: R,
    toggleEditMode: ee,
    setIsLibraryOpen: u,
  }
}
function Wt({
  isEditMode: s,
  onToggleEditMode: r,
  onAddWidget: t,
  onResetLayout: n,
  isRTL: a,
  t: i,
}) {
  return e.jsxs('header', {
    className: 'flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6',
    children: [
      e.jsxs('div', {
        className: 'flex items-center gap-3',
        children: [
          e.jsx('div', {
            className: 'p-2 rounded-lg bg-primary/10',
            children: e.jsx(Is, { className: 'h-5 w-5 sm:h-6 sm:w-6 text-primary' }),
          }),
          e.jsxs('div', {
            children: [
              e.jsx('h1', {
                className: 'text-xl sm:text-2xl font-bold',
                children: i('customDashboard'),
              }),
              e.jsx('p', {
                className: 'text-sm text-muted-foreground hidden sm:block',
                children: i(s ? 'widgetLibrary.description' : 'title'),
              }),
            ],
          }),
          s && e.jsx(F, { variant: 'secondary', className: 'ms-2', children: i('editMode') }),
        ],
      }),
      e.jsxs('div', {
        className: 'flex items-center gap-2',
        children: [
          s &&
            e.jsx(_, {
              children: e.jsxs(U, {
                children: [
                  e.jsx(q, {
                    asChild: !0,
                    children: e.jsxs(z, {
                      variant: 'outline',
                      size: 'sm',
                      onClick: t,
                      className: 'h-9',
                      children: [
                        e.jsx(H, { className: 'h-4 w-4 me-1' }),
                        e.jsx('span', { className: 'hidden sm:inline', children: i('addWidget') }),
                      ],
                    }),
                  }),
                  e.jsx(G, { children: e.jsx('p', { children: i('addWidget') }) }),
                ],
              }),
            }),
          s &&
            e.jsxs(qe, {
              children: [
                e.jsx(_, {
                  children: e.jsxs(U, {
                    children: [
                      e.jsx(q, {
                        asChild: !0,
                        children: e.jsx(Ge, {
                          asChild: !0,
                          children: e.jsxs(z, {
                            variant: 'outline',
                            size: 'sm',
                            className: 'h-9',
                            children: [
                              e.jsx(Ls, { className: 'h-4 w-4 me-1' }),
                              e.jsx('span', {
                                className: 'hidden sm:inline',
                                children: i('resetLayout'),
                              }),
                            ],
                          }),
                        }),
                      }),
                      e.jsx(G, { children: e.jsx('p', { children: i('resetLayout') }) }),
                    ],
                  }),
                }),
                e.jsxs(He, {
                  dir: a ? 'rtl' : 'ltr',
                  children: [
                    e.jsxs(Ke, {
                      children: [
                        e.jsx(Qe, { children: i('resetLayout') }),
                        e.jsx(Ze, { children: i('confirmations.resetLayout') }),
                      ],
                    }),
                    e.jsxs(Ye, {
                      children: [
                        e.jsx(Je, { children: i('actions.cancel') }),
                        e.jsx(Xe, { onClick: n, children: i('resetLayout') }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          e.jsx(z, {
            variant: s ? 'default' : 'outline',
            size: 'sm',
            onClick: r,
            className: 'h-9',
            children: s
              ? e.jsxs(e.Fragment, {
                  children: [
                    e.jsx(Rs, { className: 'h-4 w-4 me-1' }),
                    e.jsx('span', { children: i('exitEditMode') }),
                  ],
                })
              : e.jsxs(e.Fragment, {
                  children: [
                    e.jsx(le, { className: 'h-4 w-4 me-1' }),
                    e.jsx('span', { className: 'hidden sm:inline', children: i('editMode') }),
                  ],
                }),
          }),
        ],
      }),
    ],
  })
}
function Mt({ onAddWidget: s, t: r }) {
  return e.jsxs('div', {
    className: 'flex flex-col items-center justify-center py-12 sm:py-16 text-center',
    children: [
      e.jsx('div', {
        className: 'p-4 rounded-full bg-muted mb-4',
        children: e.jsx(fe, { className: 'h-8 w-8 text-muted-foreground' }),
      }),
      e.jsx('h3', { className: 'text-lg font-medium mb-2', children: r('emptyStates.noWidgets') }),
      e.jsx('p', {
        className: 'text-sm text-muted-foreground mb-6 max-w-md',
        children: r('emptyStates.addWidgetHint'),
      }),
      e.jsxs(z, {
        onClick: s,
        children: [e.jsx(H, { className: 'h-4 w-4 me-2' }), r('addWidget')],
      }),
    ],
  })
}
function Pt() {
  return e.jsx('div', {
    className: 'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    children: Array.from({ length: 8 }).map((s, r) =>
      e.jsx(Ue, { className: 'h-[150px] rounded-lg' }, r),
    ),
  })
}
function $t() {
  const { t: s, i18n: r } = L('dashboard-widgets'),
    t = r.language === 'ar',
    {
      widgets: n,
      widgetData: a,
      isEditMode: i,
      selectedWidget: c,
      isLibraryOpen: l,
      isSettingsOpen: m,
      isInitialized: o,
      existingWidgetTypes: d,
      addWidget: u,
      removeWidget: p,
      updateWidget: x,
      reorderWidgets: g,
      resetLayout: N,
      refreshWidget: h,
      openSettings: f,
      closeSettings: v,
      toggleEditMode: k,
      setIsLibraryOpen: S,
    } = zt(),
    C = (R) => {
      ;(u(R), K.success(s('layoutSaved')))
    },
    T = (R) => {
      ;(p(R), K.success(s('layoutSaved')))
    },
    I = () => {
      ;(N(), K.success(s('layoutReset')))
    },
    O = (R) => {
      ;(x(R), K.success(s('layoutSaved')))
    }
  return e.jsxs('div', {
    className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6',
    dir: t ? 'rtl' : 'ltr',
    children: [
      e.jsx(Wt, {
        isEditMode: i,
        onToggleEditMode: k,
        onAddWidget: () => S(!0),
        onResetLayout: I,
        isRTL: t,
        t: s,
      }),
      o
        ? n.length === 0
          ? e.jsx(Mt, { onAddWidget: () => S(!0), t: s })
          : e.jsx(ut, {
              widgets: n,
              widgetData: a,
              isEditMode: i,
              onReorder: g,
              onRemove: T,
              onSettings: f,
              onRefresh: h,
            })
        : e.jsx(Pt, {}),
      e.jsx(xt, { isOpen: l, onClose: () => S(!1), onAddWidget: C, existingWidgetTypes: d }),
      e.jsx(Ct, { widget: c, isOpen: m, onClose: v, onSave: O }),
    ],
  })
}
const Zt = $t
export { Zt as component }
//# sourceMappingURL=custom-dashboard-CjDU8YgX.js.map
