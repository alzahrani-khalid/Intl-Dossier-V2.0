import { u as z, r as d, j as e } from './react-vendor-Buoak6m3.js'
import { i as ee, k as se, a as ae } from './tanstack-vendor-BZC-rs5U.js'
import {
  B as I,
  q as S,
  r as T,
  t as _,
  v as k,
  w as n,
  j as V,
  m as C,
  k as te,
  o as re,
  V as le,
  l as E,
  I as ie,
  p as ne,
  a2 as oe,
  af as A,
  ag as F,
  J as P,
  a0 as ce,
  Z as de,
  _ as he,
  $ as q,
  aa as G,
  s as xe,
} from './index-qYY0KoZ1.js'
import {
  dG as me,
  dH as pe,
  dI as ge,
  dJ as ue,
  dK as je,
  dL as fe,
  dM as ve,
  dN as Ne,
  dO as be,
  dP as $,
  dQ as ye,
  dR as we,
  bY as Ce,
  b8 as Z,
  aE as Se,
  aM as Te,
  bw as B,
  bg as _e,
  ca as ke,
  cv as Me,
} from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
d.memo(({ data: s }) => {
  const { i18n: h } = z(),
    l = h.language === 'ar' ? s.name_ar : s.name_en
  return e.jsx(V, {
    className: 'min-w-[200px] px-4 py-3 border-2 shadow-md',
    children: e.jsxs('div', {
      className: 'flex flex-col gap-2',
      children: [
        e.jsxs('div', {
          className: 'flex items-center justify-between gap-2',
          children: [
            e.jsx('span', { className: 'text-sm font-semibold truncate', children: l }),
            s.degree > 0 &&
              e.jsxs(C, {
                variant: 'outline',
                className: 'text-xs shrink-0',
                children: [s.degree, '°'],
              }),
          ],
        }),
        e.jsxs('div', {
          className: 'flex items-center gap-2',
          children: [
            e.jsx(C, { variant: 'secondary', className: 'text-xs', children: s.type }),
            e.jsx(C, {
              variant: s.status === 'active' ? 'default' : 'outline',
              className: 'text-xs',
              children: s.status,
            }),
          ],
        }),
      ],
    }),
  })
})
const Q = (s) =>
    ({
      country: '#3b82f6',
      organization: '#8b5cf6',
      individual: '#10b981',
      forum: '#f59e0b',
      engagement: '#ec4899',
      mou: '#14b8a6',
      position: '#6366f1',
    })[s] || '#6b7280',
  Re = (s) =>
    ({
      member_of: '#3b82f6',
      partner: '#10b981',
      parent_org: '#8b5cf6',
      hosted_by: '#f59e0b',
      participant: '#ec4899',
      signatory: '#14b8a6',
    })[s] || '#9ca3af'
function De({
  nodes: s,
  edges: h,
  onNodeClick: x,
  height: l = '600px',
  showMiniMap: b = !0,
  showControls: c = !0,
  enableTypeFilter: g = !0,
  enableRelationshipFilter: y = !0,
}) {
  const { t: i, i18n: M } = z(),
    m = M.language === 'ar',
    { zoomIn: R, zoomOut: o, fitView: D } = me(),
    [u, w] = d.useState('all'),
    [j, a] = d.useState('all'),
    r = d.useMemo(() => {
      const t = new Set(s.map((p) => p.type))
      return ['all', ...Array.from(t)]
    }, [s]),
    f = d.useMemo(() => {
      const t = new Set(h.map((p) => p.relationship_type))
      return ['all', ...Array.from(t)]
    }, [h]),
    N = d.useMemo(() => (u === 'all' ? s : s.filter((t) => t.type === u)), [s, u]),
    L = d.useMemo(() => {
      const t = new Set(N.map((v) => v.id))
      let p = h.filter((v) => t.has(v.source_id) && t.has(v.target_id))
      return (j !== 'all' && (p = p.filter((v) => v.relationship_type === j)), p)
    }, [h, N, j]),
    H = d.useMemo(
      () =>
        N.map((t, p) => {
          const v = (p / N.length) * 2 * Math.PI,
            O = 250
          return {
            id: t.id,
            type: 'dossier',
            data: t,
            position: { x: 400 + O * Math.cos(v), y: 300 + O * Math.sin(v) },
            style: { borderColor: Q(t.type), borderWidth: t.degree === 0 ? 3 : 2 },
          }
        }),
      [N],
    ),
    W = d.useMemo(
      () =>
        L.map((t, p) => ({
          id: `edge-${p}`,
          source: t.source_id,
          target: t.target_id,
          type: 'smoothstep',
          animated: !1,
          label: t.relationship_type.replace(/_/g, ' '),
          style: { stroke: Re(t.relationship_type), strokeWidth: 2 },
          labelStyle: { fontSize: 12, fontWeight: 500 },
        })),
      [L],
    ),
    [J, , K] = pe(H),
    [U, , Y] = ge(W),
    X = d.useCallback(
      (t, p) => {
        x && x(p.id)
      },
      [x],
    )
  return e.jsx('div', {
    className: 'relative w-full rounded-lg border bg-background',
    style: { height: l },
    dir: m ? 'rtl' : 'ltr',
    children: e.jsxs(ue, {
      nodes: J,
      edges: U,
      onNodesChange: K,
      onEdgesChange: Y,
      onNodeClick: X,
      nodeTypes: r,
      connectionMode: je.Loose,
      fitView: !0,
      attributionPosition: m ? 'bottom-left' : 'bottom-right',
      children: [
        e.jsx(fe, { variant: ve.Dots, gap: 16, size: 1 }),
        c && e.jsx(Ne, { position: m ? 'top-left' : 'top-right' }),
        b &&
          e.jsx(be, {
            position: m ? 'bottom-left' : 'bottom-right',
            nodeColor: (t) => Q(t.data?.type || ''),
            nodeBorderRadius: 8,
            maskColor: 'rgba(0, 0, 0, 0.1)',
          }),
        e.jsxs($, {
          position: m ? 'bottom-right' : 'bottom-left',
          className: 'flex gap-2',
          children: [
            e.jsx(I, {
              size: 'sm',
              variant: 'outline',
              className: 'h-8 w-8 p-0',
              onClick: () => R(),
              title: i('graph.zoomIn', 'Zoom In'),
              children: e.jsx(ye, { className: 'h-4 w-4' }),
            }),
            e.jsx(I, {
              size: 'sm',
              variant: 'outline',
              className: 'h-8 w-8 p-0',
              onClick: () => o(),
              title: i('graph.zoomOut', 'Zoom Out'),
              children: e.jsx(we, { className: 'h-4 w-4' }),
            }),
            e.jsx(I, {
              size: 'sm',
              variant: 'outline',
              className: 'h-8 w-8 p-0',
              onClick: () => D(),
              title: i('graph.fitView', 'Fit View'),
              children: e.jsx(Ce, { className: 'h-4 w-4' }),
            }),
          ],
        }),
        (g || y) &&
          e.jsxs($, {
            position: m ? 'top-left' : 'top-right',
            className: 'bg-background/95 p-3 rounded-lg border shadow-sm flex flex-col gap-3',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-2 text-sm font-semibold',
                children: [
                  e.jsx(Z, { className: 'h-4 w-4' }),
                  e.jsx('span', { children: i('graph.filters', 'Filters') }),
                ],
              }),
              g &&
                e.jsxs('div', {
                  className: 'flex flex-col gap-1.5',
                  children: [
                    e.jsx('label', {
                      className: 'text-xs text-muted-foreground',
                      children: i('graph.nodeType', 'Node Type'),
                    }),
                    e.jsxs(S, {
                      value: u,
                      onValueChange: w,
                      children: [
                        e.jsx(T, { className: 'h-8 w-[160px] text-xs', children: e.jsx(_, {}) }),
                        e.jsx(k, {
                          children: r.map((t) =>
                            e.jsx(
                              n,
                              {
                                value: t,
                                className: 'text-xs',
                                children:
                                  t === 'all'
                                    ? i('graph.allTypes', 'All Types')
                                    : t.replace(/_/g, ' '),
                              },
                              t,
                            ),
                          ),
                        }),
                      ],
                    }),
                  ],
                }),
              y &&
                e.jsxs('div', {
                  className: 'flex flex-col gap-1.5',
                  children: [
                    e.jsx('label', {
                      className: 'text-xs text-muted-foreground',
                      children: i('graph.relationshipType', 'Relationship'),
                    }),
                    e.jsxs(S, {
                      value: j,
                      onValueChange: a,
                      children: [
                        e.jsx(T, { className: 'h-8 w-[160px] text-xs', children: e.jsx(_, {}) }),
                        e.jsx(k, {
                          children: f.map((t) =>
                            e.jsx(
                              n,
                              {
                                value: t,
                                className: 'text-xs',
                                children:
                                  t === 'all'
                                    ? i('graph.allRelationships', 'All Relationships')
                                    : t.replace(/_/g, ' '),
                              },
                              t,
                            ),
                          ),
                        }),
                      ],
                    }),
                  ],
                }),
              e.jsxs('div', {
                className: 'text-xs text-muted-foreground pt-1 border-t',
                children: [
                  N.length,
                  ' ',
                  i('graph.nodesShown', 'nodes'),
                  ' ·',
                  ' ',
                  L.length,
                  ' ',
                  i('graph.edgesShown', 'edges'),
                ],
              }),
            ],
          }),
        e.jsx($, {
          position: m ? 'top-right' : 'top-left',
          className: 'bg-background/95 p-3 rounded-lg border shadow-sm',
          children: e.jsxs('div', {
            className: 'flex flex-col gap-2',
            children: [
              e.jsx('div', {
                className: 'text-sm font-semibold',
                children: i('graph.legend', 'Legend'),
              }),
              e.jsxs('div', {
                className: 'flex flex-col gap-1 text-xs',
                children: [
                  e.jsxs('div', {
                    className: 'flex items-center gap-2',
                    children: [
                      e.jsx('div', {
                        className: 'h-3 w-3 rounded-full',
                        style: { backgroundColor: '#3b82f6' },
                      }),
                      e.jsx('span', { children: i('graph.country', 'Country') }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'flex items-center gap-2',
                    children: [
                      e.jsx('div', {
                        className: 'h-3 w-3 rounded-full',
                        style: { backgroundColor: '#8b5cf6' },
                      }),
                      e.jsx('span', { children: i('graph.organization', 'Organization') }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'flex items-center gap-2',
                    children: [
                      e.jsx('div', {
                        className: 'h-3 w-3 rounded-full',
                        style: { backgroundColor: '#10b981' },
                      }),
                      e.jsx('span', { children: i('graph.individual', 'Individual') }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'flex items-center gap-2',
                    children: [
                      e.jsx('div', {
                        className: 'h-3 w-3 rounded-full',
                        style: { backgroundColor: '#f59e0b' },
                      }),
                      e.jsx('span', { children: i('graph.forum', 'Forum') }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      ],
    }),
  })
}
function Ie({ nodes: s, startDossierId: h, onNodeSelect: x }) {
  const { t: l, i18n: b } = z(),
    c = b.language === 'ar',
    [g, y] = d.useState(''),
    [i, M] = d.useState('all'),
    [m, R] = d.useState('all'),
    o = [...new Set(s.map((a) => a.type))],
    D = Math.max(...s.map((a) => a.degree)),
    u = s.filter((a) => {
      if (a.id === h) return !1
      if (g) {
        const r = g.toLowerCase(),
          f = a.name_en.toLowerCase().includes(r),
          N = a.name_ar.toLowerCase().includes(r)
        if (!f && !N) return !1
      }
      return !((i !== 'all' && a.degree !== parseInt(i)) || (m !== 'all' && a.type !== m))
    }),
    w = u.reduce((a, r) => {
      const f = r.degree
      return (a[f] || (a[f] = []), a[f].push(r), a)
    }, {}),
    j = (a) => {
      x && x(a)
    }
  return e.jsxs(V, {
    className: 'w-full',
    children: [
      e.jsxs(te, {
        children: [
          e.jsxs(re, {
            className: 'flex items-center gap-2',
            children: [
              e.jsx(Z, { className: 'h-5 w-5' }),
              l('relationship.navigator.title', 'Relationship Navigator'),
            ],
          }),
          e.jsx(le, {
            children: l(
              'relationship.navigator.description',
              'Browse and filter connected entities by degree and type',
            ),
          }),
        ],
      }),
      e.jsxs(E, {
        children: [
          e.jsxs('div', {
            className: 'flex flex-col gap-4 mb-6',
            children: [
              e.jsxs('div', {
                className: 'relative',
                children: [
                  e.jsx(Se, {
                    className: `absolute ${c ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-muted-foreground`,
                  }),
                  e.jsx(ie, {
                    placeholder: l('relationship.navigator.search', 'Search entities...'),
                    value: g,
                    onChange: (a) => y(a.target.value),
                    className: c ? 'pe-9' : 'ps-9',
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
                children: [
                  e.jsxs('div', {
                    children: [
                      e.jsx('label', {
                        className: 'text-sm font-medium mb-2 block',
                        children: l('relationship.navigator.degree', 'Degree'),
                      }),
                      e.jsxs(S, {
                        value: i,
                        onValueChange: M,
                        children: [
                          e.jsx(T, { children: e.jsx(_, {}) }),
                          e.jsxs(k, {
                            children: [
                              e.jsx(n, {
                                value: 'all',
                                children: l('relationship.navigator.allDegrees', 'All Degrees'),
                              }),
                              Array.from({ length: D }, (a, r) => r + 1).map((a) =>
                                e.jsxs(
                                  n,
                                  {
                                    value: a.toString(),
                                    children: [
                                      a,
                                      '° ',
                                      l('relationship.navigator.separation', 'separation'),
                                    ],
                                  },
                                  a,
                                ),
                              ),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    children: [
                      e.jsx('label', {
                        className: 'text-sm font-medium mb-2 block',
                        children: l('relationship.navigator.type', 'Entity Type'),
                      }),
                      e.jsxs(S, {
                        value: m,
                        onValueChange: R,
                        children: [
                          e.jsx(T, { children: e.jsx(_, {}) }),
                          e.jsxs(k, {
                            children: [
                              e.jsx(n, {
                                value: 'all',
                                children: l('relationship.navigator.allTypes', 'All Types'),
                              }),
                              o.map((a) =>
                                e.jsx(n, { value: a, children: l(`dossier.type.${a}`, a) }, a),
                              ),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          e.jsx('div', {
            className: 'mb-4 text-sm text-muted-foreground',
            children: l('relationship.navigator.results', {
              count: u.length,
              defaultValue: '{{count}} entities found',
            }),
          }),
          e.jsxs(ne, {
            className: 'h-[400px]',
            children: [
              Object.keys(w)
                .sort((a, r) => parseInt(a) - parseInt(r))
                .map((a) =>
                  e.jsxs(
                    'div',
                    {
                      className: 'mb-6',
                      children: [
                        e.jsxs('div', {
                          className: 'flex items-center gap-2 mb-3',
                          children: [
                            e.jsxs(C, {
                              variant: 'outline',
                              className: 'text-sm font-semibold',
                              children: [
                                a,
                                '° ',
                                l('relationship.navigator.separation', 'Separation'),
                              ],
                            }),
                            e.jsx(oe, { className: 'flex-1' }),
                          ],
                        }),
                        e.jsx('div', {
                          className: 'space-y-2',
                          children: w[parseInt(a)].map((r) => {
                            const f = c ? r.name_ar : r.name_en
                            return e.jsx(
                              I,
                              {
                                variant: 'ghost',
                                className: 'w-full justify-start h-auto p-3 hover:bg-accent',
                                onClick: () => j(r.id),
                                children: e.jsxs('div', {
                                  className: 'flex items-center gap-3 w-full',
                                  children: [
                                    e.jsxs('div', {
                                      className: 'flex-1 text-start',
                                      children: [
                                        e.jsx('div', {
                                          className: 'font-medium mb-1',
                                          children: f,
                                        }),
                                        e.jsxs('div', {
                                          className: 'flex items-center gap-2 flex-wrap',
                                          children: [
                                            e.jsx(C, {
                                              variant: 'secondary',
                                              className: 'text-xs',
                                              children: l(`dossier.type.${r.type}`, r.type),
                                            }),
                                            e.jsx(C, {
                                              variant:
                                                r.status === 'active' ? 'default' : 'outline',
                                              className: 'text-xs',
                                              children: l(`dossier.status.${r.status}`, r.status),
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    e.jsx(Te, {
                                      className: `h-4 w-4 shrink-0 ${c ? 'rotate-180' : ''}`,
                                    }),
                                  ],
                                }),
                              },
                              r.id,
                            )
                          }),
                        }),
                      ],
                    },
                    a,
                  ),
                ),
              u.length === 0 &&
                e.jsx('div', {
                  className: 'text-center py-8 text-muted-foreground',
                  children: l('relationship.navigator.noResults', 'No entities match your filters'),
                }),
            ],
          }),
        ],
      }),
    ],
  })
}
async function Ve(s, h, x) {
  const {
    data: { session: l },
  } = await xe.auth.getSession()
  if (!l) throw new Error('Not authenticated')
  const b = new URLSearchParams({ startDossierId: s, maxDegrees: h.toString() })
  x && x !== 'all' && b.append('relationshipType', x)
  const c = await fetch(
    `https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/graph-traversal?${b}`,
    { headers: { Authorization: `Bearer ${l.access_token}` } },
  )
  if (!c.ok) {
    const g = await c.json()
    throw new Error(g.error || 'Failed to fetch graph data')
  }
  return c.json()
}
function ze() {
  const { t: s, i18n: h } = z(),
    x = h.language === 'ar',
    l = ee(),
    c = se({ strict: !1 })?.dossierId,
    [g, y] = d.useState(2),
    [i, M] = d.useState('all'),
    [m, R] = d.useState('graph'),
    {
      data: o,
      isLoading: D,
      error: u,
      refetch: w,
    } = ae({
      queryKey: ['graph-traversal', c, g, i],
      queryFn: () => Ve(c, g, i),
      enabled: !!c,
      staleTime: 3e4,
    }),
    j = (r) => {
      l({ to: '/dossiers/$dossierId', params: { dossierId: r } })
    },
    a = () => {
      w()
    }
  return c
    ? e.jsxs('div', {
        className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-8',
        dir: x ? 'rtl' : 'ltr',
        children: [
          e.jsxs('div', {
            className: 'mb-6',
            children: [
              e.jsx('h1', {
                className: 'text-2xl sm:text-3xl font-bold mb-2',
                children: s('graph.title', 'Relationship Graph'),
              }),
              e.jsx('p', {
                className: 'text-muted-foreground',
                children: s('graph.description', 'Explore connections between entities'),
              }),
            ],
          }),
          e.jsx(V, {
            className: 'mb-6',
            children: e.jsxs(E, {
              className: 'pt-6',
              children: [
                e.jsxs('div', {
                  className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
                  children: [
                    e.jsxs('div', {
                      children: [
                        e.jsx(P, {
                          htmlFor: 'maxDegrees',
                          className: 'mb-2 block',
                          children: s('graph.maxDegrees', 'Degrees of Separation'),
                        }),
                        e.jsxs(S, {
                          value: g.toString(),
                          onValueChange: (r) => y(parseInt(r)),
                          children: [
                            e.jsx(T, { id: 'maxDegrees', children: e.jsx(_, {}) }),
                            e.jsxs(k, {
                              children: [
                                e.jsxs(n, {
                                  value: '1',
                                  children: ['1° ', s('graph.degree', 'degree')],
                                }),
                                e.jsxs(n, {
                                  value: '2',
                                  children: ['2° ', s('graph.degrees', 'degrees')],
                                }),
                                e.jsxs(n, {
                                  value: '3',
                                  children: ['3° ', s('graph.degrees', 'degrees')],
                                }),
                                e.jsxs(n, {
                                  value: '4',
                                  children: ['4° ', s('graph.degrees', 'degrees')],
                                }),
                                e.jsxs(n, {
                                  value: '5',
                                  children: ['5° ', s('graph.degrees', 'degrees')],
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      children: [
                        e.jsx(P, {
                          htmlFor: 'relationshipType',
                          className: 'mb-2 block',
                          children: s('graph.relationshipType', 'Relationship Type'),
                        }),
                        e.jsxs(S, {
                          value: i,
                          onValueChange: M,
                          children: [
                            e.jsx(T, { id: 'relationshipType', children: e.jsx(_, {}) }),
                            e.jsxs(k, {
                              children: [
                                e.jsx(n, {
                                  value: 'all',
                                  children: s('graph.allTypes', 'All Types'),
                                }),
                                e.jsx(n, {
                                  value: 'member_of',
                                  children: s('relationship.memberOf', 'Member Of'),
                                }),
                                e.jsx(n, {
                                  value: 'partner',
                                  children: s('relationship.partner', 'Partner'),
                                }),
                                e.jsx(n, {
                                  value: 'parent_org',
                                  children: s('relationship.parentOrg', 'Parent Organization'),
                                }),
                                e.jsx(n, {
                                  value: 'hosted_by',
                                  children: s('relationship.hostedBy', 'Hosted By'),
                                }),
                                e.jsx(n, {
                                  value: 'participant',
                                  children: s('relationship.participant', 'Participant'),
                                }),
                                e.jsx(n, {
                                  value: 'signatory',
                                  children: s('relationship.signatory', 'Signatory'),
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsx('div', {
                      className: 'flex items-end',
                      children: e.jsxs(I, {
                        onClick: a,
                        variant: 'outline',
                        className: 'w-full',
                        children: [
                          e.jsx(_e, { className: 'h-4 w-4 me-2' }),
                          s('graph.refresh', 'Refresh'),
                        ],
                      }),
                    }),
                  ],
                }),
                o &&
                  e.jsxs('div', {
                    className: 'mt-4 p-4 bg-muted rounded-lg',
                    children: [
                      e.jsxs('div', {
                        className: 'grid grid-cols-2 sm:grid-cols-4 gap-4 text-center',
                        children: [
                          e.jsxs('div', {
                            children: [
                              e.jsx('div', {
                                className: 'text-2xl font-bold',
                                children: o.stats.node_count,
                              }),
                              e.jsx('div', {
                                className: 'text-xs text-muted-foreground',
                                children: s('graph.nodes', 'Entities'),
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            children: [
                              e.jsx('div', {
                                className: 'text-2xl font-bold',
                                children: o.stats.edge_count,
                              }),
                              e.jsx('div', {
                                className: 'text-xs text-muted-foreground',
                                children: s('graph.edges', 'Relationships'),
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            children: [
                              e.jsxs('div', {
                                className: 'text-2xl font-bold',
                                children: [o.stats.max_degree, '°'],
                              }),
                              e.jsx('div', {
                                className: 'text-xs text-muted-foreground',
                                children: s('graph.maxDegree', 'Max Degree'),
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            children: [
                              e.jsxs('div', {
                                className: 'text-2xl font-bold',
                                children: [o.stats.query_time_ms, 'ms'],
                              }),
                              e.jsx('div', {
                                className: 'text-xs text-muted-foreground',
                                children: s('graph.queryTime', 'Query Time'),
                              }),
                            ],
                          }),
                        ],
                      }),
                      o.stats.performance_warning &&
                        e.jsxs(A, {
                          variant: 'destructive',
                          className: 'mt-4',
                          children: [
                            e.jsx(B, { className: 'h-4 w-4' }),
                            e.jsx(F, { children: o.stats.performance_warning }),
                          ],
                        }),
                    ],
                  }),
              ],
            }),
          }),
          u &&
            e.jsxs(A, {
              variant: 'destructive',
              className: 'mb-6',
              children: [
                e.jsx(B, { className: 'h-4 w-4' }),
                e.jsxs(F, {
                  children: [s('graph.error', 'Failed to load graph data'), ': ', u.message],
                }),
              ],
            }),
          D &&
            e.jsx(V, {
              children: e.jsx(E, {
                className: 'pt-6',
                children: e.jsx(ce, { className: 'h-[600px] w-full' }),
              }),
            }),
          o &&
            e.jsxs(de, {
              value: m,
              onValueChange: (r) => R(r),
              children: [
                e.jsxs(he, {
                  className: 'mb-4',
                  children: [
                    e.jsxs(q, {
                      value: 'graph',
                      className: 'gap-2',
                      children: [
                        e.jsx(ke, { className: 'h-4 w-4' }),
                        s('graph.graphView', 'Graph View'),
                      ],
                    }),
                    e.jsxs(q, {
                      value: 'list',
                      className: 'gap-2',
                      children: [
                        e.jsx(Me, { className: 'h-4 w-4' }),
                        s('graph.listView', 'List View'),
                      ],
                    }),
                  ],
                }),
                e.jsx(G, {
                  value: 'graph',
                  children: e.jsx(De, {
                    nodes: [o.start_dossier, ...o.nodes],
                    edges: o.edges,
                    onNodeClick: j,
                    height: 'calc(100vh - 500px)',
                    showMiniMap: !0,
                    showControls: !0,
                  }),
                }),
                e.jsx(G, {
                  value: 'list',
                  children: e.jsx(Ie, {
                    nodes: [o.start_dossier, ...o.nodes],
                    startDossierId: c,
                    onNodeSelect: j,
                  }),
                }),
              ],
            }),
        ],
      })
    : e.jsx('div', {
        className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-8',
        children: e.jsxs(A, {
          children: [
            e.jsx(B, { className: 'h-4 w-4' }),
            e.jsx(F, {
              children: s(
                'graph.noDossier',
                'No dossier selected. Please select a dossier to view its relationship graph.',
              ),
            }),
          ],
        }),
      })
}
const Qe = ze
export { Qe as component }
//# sourceMappingURL=graph-DtxYjPno.js.map
