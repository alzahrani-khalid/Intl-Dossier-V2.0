import { u as H, r as T, j as e } from './react-vendor-Buoak6m3.js'
import { a as P, L as U } from './tanstack-vendor-BZC-rs5U.js'
import {
  c as o,
  j as h,
  k as b,
  o as C,
  l as y,
  q as A,
  r as E,
  t as L,
  v as F,
  w as O,
  B as u,
  af as w,
  ag as _,
  N as G,
  O as X,
  P as R,
  Q as V,
  R as W,
  U as S,
  s as I,
  b2 as Y,
  a0 as q,
  m as k,
} from './index-qYY0KoZ1.js'
import { cq as Z, aS as D, bw as z, aX as ee, ea as se } from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function ne({
  positionId: d,
  availableVersions: t = [],
  defaultFromVersion: i,
  defaultToVersion: x,
  className: f,
}) {
  const { t: n, i18n: g } = H(),
    a = g.language === 'ar',
    [r, M] = T.useState(i),
    [l, J] = T.useState(x),
    {
      data: c,
      isLoading: j,
      error: v,
      refetch: K,
    } = P({
      queryKey: ['positions', d, 'compare', r, l],
      queryFn: async () => {
        if (!r || !l) throw new Error('Both versions must be selected')
        const {
          data: { session: s },
        } = await I.auth.getSession()
        if (!s) throw new Error('No active session')
        const m = await fetch(
          'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/positions-versions-compare',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${s.access_token}`,
            },
            body: JSON.stringify({ position_id: d, from_version: r, to_version: l }),
          },
        )
        if (!m.ok) {
          const p = await m.json()
          throw new Error(p.error || 'Failed to fetch version comparison')
        }
        return m.json()
      },
      enabled: !!r && !!l && r !== l,
    }),
    Q = () => {
      r && l && r !== l && K()
    },
    B = (s, m = !1) =>
      e.jsx('div', {
        className: o('text-sm leading-relaxed whitespace-pre-wrap', m && 'text-end'),
        dir: m ? 'rtl' : 'ltr',
        children: s.map((p, N) =>
          p.type === 'added'
            ? e.jsx(
                'span',
                {
                  className: 'rounded bg-green-100 px-0.5 text-green-900',
                  'aria-label': n('positions.versionComparison.added'),
                  children: p.text,
                },
                N,
              )
            : p.type === 'removed'
              ? e.jsx(
                  'span',
                  {
                    className: 'rounded bg-red-100 px-0.5 text-red-900 line-through',
                    'aria-label': n('positions.versionComparison.removed'),
                    children: p.text,
                  },
                  N,
                )
              : e.jsx('span', { className: 'text-gray-700', children: p.text }, N),
        ),
      }),
    $ = (s) =>
      s == null
        ? n('common.none')
        : typeof s == 'boolean'
          ? n(s ? 'common.yes' : 'common.no')
          : typeof s == 'object'
            ? JSON.stringify(s)
            : String(s)
  return e.jsxs('div', {
    className: o('space-y-6', f),
    children: [
      e.jsxs(h, {
        children: [
          e.jsx(b, {
            children: e.jsx(C, {
              className: o('flex items-center gap-2', a && 'flex-row-reverse'),
              children: n('positions.versionComparison.title'),
            }),
          }),
          e.jsxs(y, {
            children: [
              e.jsxs('div', {
                className: o('flex items-center gap-4', a && 'flex-row-reverse'),
                children: [
                  e.jsxs('div', {
                    className: 'flex-1',
                    children: [
                      e.jsx('label', {
                        className: o('block text-sm font-medium mb-2', a && 'text-end'),
                        htmlFor: 'from-version',
                        children: n('positions.versionComparison.fromVersion'),
                      }),
                      e.jsxs(A, {
                        value: r?.toString(),
                        onValueChange: (s) => M(parseInt(s)),
                        children: [
                          e.jsx(E, {
                            id: 'from-version',
                            className: 'w-full',
                            children: e.jsx(L, {
                              placeholder: n('positions.versionComparison.selectVersion'),
                            }),
                          }),
                          e.jsx(F, {
                            children: t.map((s) =>
                              e.jsxs(
                                O,
                                {
                                  value: s.version_number.toString(),
                                  disabled: s.version_number === l,
                                  children: [
                                    'v',
                                    s.version_number,
                                    s.change_summary && ` - ${s.change_summary}`,
                                  ],
                                },
                                s.version_number,
                              ),
                            ),
                          }),
                        ],
                      }),
                    ],
                  }),
                  e.jsx(Z, { className: 'mt-6 size-5 shrink-0 text-muted-foreground' }),
                  e.jsxs('div', {
                    className: 'flex-1',
                    children: [
                      e.jsx('label', {
                        className: o('block text-sm font-medium mb-2', a && 'text-end'),
                        htmlFor: 'to-version',
                        children: n('positions.versionComparison.toVersion'),
                      }),
                      e.jsxs(A, {
                        value: l?.toString(),
                        onValueChange: (s) => J(parseInt(s)),
                        children: [
                          e.jsx(E, {
                            id: 'to-version',
                            className: 'w-full',
                            children: e.jsx(L, {
                              placeholder: n('positions.versionComparison.selectVersion'),
                            }),
                          }),
                          e.jsx(F, {
                            children: t.map((s) =>
                              e.jsxs(
                                O,
                                {
                                  value: s.version_number.toString(),
                                  disabled: s.version_number === r,
                                  children: [
                                    'v',
                                    s.version_number,
                                    s.change_summary && ` - ${s.change_summary}`,
                                  ],
                                },
                                s.version_number,
                              ),
                            ),
                          }),
                        ],
                      }),
                    ],
                  }),
                  e.jsx(u, {
                    onClick: Q,
                    disabled: !r || !l || r === l || j,
                    className: 'mt-6',
                    children: j
                      ? e.jsx(D, { className: 'size-4 animate-spin' })
                      : n('positions.versionComparison.compare'),
                  }),
                ],
              }),
              r === l &&
                r &&
                e.jsxs(w, {
                  className: 'mt-4',
                  children: [
                    e.jsx(z, { className: 'size-4' }),
                    e.jsx(_, { children: n('positions.versionComparison.sameVersionError') }),
                  ],
                }),
            ],
          }),
        ],
      }),
      j &&
        e.jsx('div', {
          className: 'flex items-center justify-center py-12',
          children: e.jsx(D, { className: 'size-8 animate-spin text-primary' }),
        }),
      v &&
        e.jsxs(w, {
          variant: 'destructive',
          children: [
            e.jsx(z, { className: 'size-4' }),
            e.jsx(_, {
              children: v instanceof Error ? v.message : n('positions.versionComparison.error'),
            }),
          ],
        }),
      c &&
        !j &&
        e.jsxs('div', {
          className: 'space-y-6',
          children: [
            e.jsxs(h, {
              children: [
                e.jsx(b, {
                  children: e.jsx(C, {
                    className: o('flex items-center gap-2', a && 'flex-row-reverse'),
                    children: n('positions.versionComparison.contentChanges'),
                  }),
                }),
                e.jsx(y, {
                  children: e.jsxs('div', {
                    className: 'grid grid-cols-1 gap-6 lg:grid-cols-2',
                    children: [
                      e.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          e.jsxs('div', {
                            className: 'mb-3 flex items-center gap-2',
                            children: [
                              e.jsx('h3', {
                                className: 'text-sm font-semibold',
                                children: n('positions.versionComparison.englishVersion'),
                              }),
                              e.jsxs('div', {
                                className: 'flex items-center gap-2 text-xs text-muted-foreground',
                                children: [
                                  e.jsxs('span', {
                                    className: 'inline-flex items-center gap-1',
                                    children: [
                                      e.jsx('span', {
                                        className:
                                          'size-3 rounded border border-green-300 bg-green-100',
                                      }),
                                      n('positions.versionComparison.added'),
                                    ],
                                  }),
                                  e.jsxs('span', {
                                    className: 'inline-flex items-center gap-1',
                                    children: [
                                      e.jsx('span', {
                                        className:
                                          'size-3 rounded border border-red-300 bg-red-100',
                                      }),
                                      n('positions.versionComparison.removed'),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                          e.jsx('div', {
                            className: 'min-h-[200px] rounded-md border bg-gray-50 p-4',
                            children:
                              c.english_diff.length > 0
                                ? B(c.english_diff, !1)
                                : e.jsx('p', {
                                    className: 'text-sm text-muted-foreground',
                                    children: n('positions.versionComparison.noChanges'),
                                  }),
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          e.jsxs('div', {
                            className: 'mb-3 flex items-center justify-end gap-2',
                            children: [
                              e.jsxs('div', {
                                className: 'flex items-center gap-2 text-xs text-muted-foreground',
                                children: [
                                  e.jsxs('span', {
                                    className: 'inline-flex items-center gap-1',
                                    children: [
                                      e.jsx('span', {
                                        className:
                                          'size-3 rounded border border-red-300 bg-red-100',
                                      }),
                                      n('positions.versionComparison.removed'),
                                    ],
                                  }),
                                  e.jsxs('span', {
                                    className: 'inline-flex items-center gap-1',
                                    children: [
                                      e.jsx('span', {
                                        className:
                                          'size-3 rounded border border-green-300 bg-green-100',
                                      }),
                                      n('positions.versionComparison.added'),
                                    ],
                                  }),
                                ],
                              }),
                              e.jsx('h3', {
                                className: 'text-sm font-semibold',
                                children: n('positions.versionComparison.arabicVersion'),
                              }),
                            ],
                          }),
                          e.jsx('div', {
                            className: 'min-h-[200px] rounded-md border bg-gray-50 p-4',
                            dir: 'rtl',
                            children:
                              c.arabic_diff.length > 0
                                ? B(c.arabic_diff, !0)
                                : e.jsx('p', {
                                    className: 'text-end text-sm text-muted-foreground',
                                    children: n('positions.versionComparison.noChanges'),
                                  }),
                          }),
                        ],
                      }),
                    ],
                  }),
                }),
              ],
            }),
            Object.keys(c.metadata_changes).length > 0 &&
              e.jsxs(h, {
                children: [
                  e.jsx(b, {
                    children: e.jsx(C, {
                      className: o('flex items-center gap-2', a && 'flex-row-reverse'),
                      children: n('positions.versionComparison.metadataChanges'),
                    }),
                  }),
                  e.jsx(y, {
                    children: e.jsx('div', {
                      className: 'rounded-md border',
                      children: e.jsxs(G, {
                        children: [
                          e.jsx(X, {
                            children: e.jsxs(R, {
                              children: [
                                e.jsx(V, {
                                  className: o(a && 'text-end'),
                                  children: n('positions.versionComparison.field'),
                                }),
                                e.jsx(V, {
                                  className: o(a && 'text-end'),
                                  children: n('positions.versionComparison.oldValue'),
                                }),
                                e.jsx(V, {
                                  className: o(a && 'text-end'),
                                  children: n('positions.versionComparison.newValue'),
                                }),
                              ],
                            }),
                          }),
                          e.jsx(W, {
                            children: Object.entries(c.metadata_changes).map(([s, m]) =>
                              e.jsxs(
                                R,
                                {
                                  children: [
                                    e.jsx(S, {
                                      className: o('font-medium', a && 'text-end'),
                                      children: n(`positions.fields.${s}`, s),
                                    }),
                                    e.jsx(S, {
                                      className: o(a && 'text-end'),
                                      children: e.jsx('span', {
                                        className: 'text-red-600',
                                        children: $(m.old),
                                      }),
                                    }),
                                    e.jsx(S, {
                                      className: o(a && 'text-end'),
                                      children: e.jsx('span', {
                                        className: 'text-green-600',
                                        children: $(m.new),
                                      }),
                                    }),
                                  ],
                                },
                                s,
                              ),
                            ),
                          }),
                        ],
                      }),
                    }),
                  }),
                ],
              }),
            c.english_diff.length === 0 &&
              c.arabic_diff.length === 0 &&
              Object.keys(c.metadata_changes).length === 0 &&
              e.jsxs(w, {
                children: [
                  e.jsx(z, { className: 'size-4' }),
                  e.jsx(_, { children: n('positions.versionComparison.noChangesBetweenVersions') }),
                ],
              }),
          ],
        }),
    ],
  })
}
const re = 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1'
async function ie(d) {
  const {
      data: { session: t },
    } = await I.auth.getSession(),
    i = await fetch(`${re}/positions-versions-list?id=${d}`, {
      headers: { Authorization: `Bearer ${t?.access_token}`, 'Content-Type': 'application/json' },
    })
  if (!i.ok) throw new Error('Failed to fetch versions')
  return (await i.json()).versions || []
}
function je() {
  const { id: d } = Y.useParams(),
    { t } = H(),
    [i, x] = T.useState([null, null]),
    { data: f, isLoading: n } = P({ queryKey: ['positions', 'versions', d], queryFn: () => ie(d) }),
    g = (r) => {
      i[0] === null ? x([r, null]) : i[1] === null && r !== i[0] ? x([i[0], r]) : x([r, null])
    },
    a = i[0] !== null && i[1] !== null
  return n
    ? e.jsxs('div', {
        className: 'container mx-auto py-6 space-y-4',
        children: [e.jsx(q, { className: 'h-8 w-64' }), e.jsx(q, { className: 'h-96' })],
      })
    : e.jsxs('div', {
        className: 'container mx-auto py-6 space-y-6',
        children: [
          e.jsxs('div', {
            className: 'flex items-center justify-between',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-4',
                children: [
                  e.jsx(U, {
                    to: '/positions/$id',
                    params: { id: d },
                    children: e.jsxs(u, {
                      variant: 'outline',
                      size: 'sm',
                      children: [
                        e.jsx(ee, { className: 'me-2 h-4 w-4' }),
                        t('common.back', 'Back'),
                      ],
                    }),
                  }),
                  e.jsx('h1', {
                    className: 'text-3xl font-bold',
                    children: t('positions.versions.title', 'Version History'),
                  }),
                ],
              }),
              a &&
                e.jsxs(u, {
                  onClick: () => {},
                  children: [
                    e.jsx(se, { className: 'me-2 h-4 w-4' }),
                    t('positions.versions.compare', 'Compare Versions'),
                  ],
                }),
            ],
          }),
          !a &&
            e.jsx(h, {
              className: 'p-6',
              children: e.jsxs('div', {
                className: 'space-y-4',
                children: [
                  e.jsx('p', {
                    className: 'text-sm text-muted-foreground',
                    children: t('positions.versions.selectTwo', 'Select two versions to compare'),
                  }),
                  e.jsx('div', {
                    className: 'space-y-2',
                    children: f?.map((r) =>
                      e.jsx(
                        'div',
                        {
                          className: `p-4 border rounded-lg cursor-pointer transition-colors ${i.includes(r.version_number) ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`,
                          onClick: () => g(r.version_number),
                          children: e.jsx('div', {
                            className: 'flex items-center justify-between',
                            children: e.jsxs('div', {
                              className: 'space-y-1',
                              children: [
                                e.jsxs('div', {
                                  className: 'flex items-center gap-2',
                                  children: [
                                    e.jsxs('span', {
                                      className: 'font-semibold',
                                      children: [
                                        t('positions.versions.version', 'Version'),
                                        ' ',
                                        r.version_number,
                                      ],
                                    }),
                                    !r.superseded &&
                                      e.jsx(k, {
                                        variant: 'success',
                                        children: t('positions.versions.current', 'Current'),
                                      }),
                                  ],
                                }),
                                e.jsx('p', {
                                  className: 'text-sm text-muted-foreground',
                                  children: new Date(r.created_at).toLocaleString(),
                                }),
                              ],
                            }),
                          }),
                        },
                        r.id,
                      ),
                    ),
                  }),
                ],
              }),
            }),
          a &&
            e.jsxs(h, {
              className: 'p-6',
              children: [
                e.jsxs('div', {
                  className: 'mb-4 flex items-center justify-between',
                  children: [
                    e.jsxs('div', {
                      className: 'flex items-center gap-2',
                      children: [
                        e.jsxs('span', {
                          className: 'text-sm text-muted-foreground',
                          children: [t('positions.versions.comparing', 'Comparing versions'), ':'],
                        }),
                        e.jsx(k, { children: i[0] }),
                        e.jsx('span', {
                          className: 'text-sm text-muted-foreground',
                          children: 'vs',
                        }),
                        e.jsx(k, { children: i[1] }),
                      ],
                    }),
                    e.jsx(u, {
                      variant: 'outline',
                      onClick: () => x([null, null]),
                      children: t('common.clear', 'Clear Selection'),
                    }),
                  ],
                }),
                e.jsx(ne, {
                  positionId: d,
                  fromVersion: Math.min(i[0], i[1]),
                  toVersion: Math.max(i[0], i[1]),
                }),
              ],
            }),
        ],
      })
}
export { je as component }
//# sourceMappingURL=versions-BvqaXXJZ.js.map
