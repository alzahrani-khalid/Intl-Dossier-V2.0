import { u as W, r as j, j as e } from './react-vendor-Buoak6m3.js'
import { a as X, d as Y } from './tanstack-vendor-BZC-rs5U.js'
import { s as T, B as c, j as r, k as x, o as u, l as o, I as z } from './index-qYY0KoZ1.js'
import { D as Z } from './DataTable-C-BIRk0G.js'
import {
  bP as ee,
  b9 as se,
  br as I,
  be as L,
  aA as R,
  b_ as k,
  aE as te,
  bm as ne,
} from './vendor-misc-BiJvMP0A.js'
import { H as le } from './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function ie() {
  const { t: n, i18n: B } = W(),
    [f, D] = j.useState(''),
    [d, S] = j.useState('all'),
    [m, w] = j.useState('all'),
    [_, F] = j.useState(''),
    A = B.language === 'ar',
    { data: a, isLoading: P } = X({
      queryKey: ['intelligence', f, d, m],
      queryFn: async () => {
        const { data: s, error: i } = await T.from('intelligence_reports')
          .select('*')
          .order('created_at', { ascending: !1 })
        if (i) throw (console.error('Failed to load intelligence reports', i), i)
        return (
          s?.map((t) => {
            const h = t.title_en ?? t.title ?? 'Untitled report',
              b = t.title_ar ?? h,
              g = t.executive_summary_en ?? t.summary_en ?? t.summary ?? '',
              v = t.executive_summary_ar ?? t.summary_ar ?? g,
              J = t.confidence_level ?? t.confidence ?? 'medium',
              K = t.classification ?? 'internal',
              Q = t.status ?? 'draft',
              G = t.created_at ?? t.createdAt ?? new Date().toISOString(),
              V = t.published_at ?? null,
              N = (p) => {
                if (Array.isArray(p)) return p
                if (typeof p == 'string') {
                  const C = p.trim()
                  if (!C) return []
                  try {
                    const y = JSON.parse(C)
                    if (Array.isArray(y)) return y
                    if (typeof y == 'string') return [y]
                  } catch {
                    return [C]
                  }
                  return []
                }
                return []
              }
            return {
              id: t.id,
              report_number: t.report_number ?? t.id ?? 'N/A',
              title_en: h,
              title_ar: b,
              executive_summary_en: g,
              executive_summary_ar: v,
              confidence_level: J,
              classification: K,
              analysis_type: N(
                t.analysis_type && !Array.isArray(t.analysis_type)
                  ? t.analysis_type
                  : (t.analysis_types ?? t.analysis_type ?? []),
              ),
              key_findings: N(t.key_findings ?? t.findings ?? []),
              recommendations: N(t.recommendations ?? []),
              status: Q,
              author: { full_name: t.author?.full_name ?? t.author_name ?? t.created_by ?? '—' },
              reviewed_by: t.reviewed_by
                ? { full_name: t.reviewed_by.full_name ?? '—' }
                : t.reviewed_by_name
                  ? { full_name: t.reviewed_by_name }
                  : null,
              approved_by: t.approved_by
                ? { full_name: t.approved_by.full_name ?? '—' }
                : t.approved_by_name
                  ? { full_name: t.approved_by_name }
                  : null,
              created_at: G,
              published_at: V,
            }
          }) ?? []
        ).filter((t) => {
          const h = d === 'all' ? !0 : t.confidence_level === d,
            b = m === 'all' ? !0 : t.classification === m,
            g = f
              ? [
                  t.report_number,
                  t.title_en,
                  t.title_ar,
                  t.executive_summary_en,
                  t.executive_summary_ar,
                ]
                  .filter(Boolean)
                  .some((v) => v.toLowerCase().includes(f.toLowerCase()))
              : !0
          return h && b && g
        })
      },
    }),
    $ = Y({
      mutationFn: async (s) => {
        const { data: i, error: l } = await T.rpc('search_intelligence_by_similarity', {
          query_text: s,
          match_threshold: 0.7,
          match_count: 10,
        })
        if (l) throw l
        return i
      },
    }),
    E = ({ level: s }) => {
      const l = {
        low: { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: '25%' },
        medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: '50%' },
        high: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '75%' },
        verified: { color: 'text-green-600', bgColor: 'bg-green-100', icon: '100%' },
      }[s]
      return e.jsxs('div', {
        className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${l.bgColor} ${l.color}`,
        children: [
          e.jsx(L, { className: 'h-3 w-3 me-1' }),
          n(`intelligence.confidenceLevels.${s}`),
          ' (',
          l.icon,
          ')',
        ],
      })
    },
    M = ({ classification: s }) => {
      const l = {
        public: { color: 'text-green-800', bgColor: 'bg-green-100' },
        internal: { color: 'text-blue-800', bgColor: 'bg-blue-100' },
        confidential: { color: 'text-orange-800', bgColor: 'bg-orange-100' },
        restricted: { color: 'text-red-800', bgColor: 'bg-red-100' },
      }[s]
      return e.jsx('span', {
        className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${l.bgColor} ${l.color}`,
        children: n(`intelligence.classification.${s}`),
      })
    },
    q = ({ types: s }) => {
      const i = {
        trends: e.jsx(ne, { className: 'h-3 w-3' }),
        patterns: e.jsx(I, { className: 'h-3 w-3' }),
        predictions: e.jsx(k, { className: 'h-3 w-3' }),
        risks: e.jsx(R, { className: 'h-3 w-3' }),
        opportunities: e.jsx(k, { className: 'h-3 w-3' }),
      }
      return e.jsx('div', {
        className: 'flex flex-wrap gap-1',
        children: s?.map((l, t) =>
          e.jsxs(
            'span',
            {
              className: 'inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs',
              children: [i[l], n(`intelligence.analysisTypes.${l}`)],
            },
            t,
          ),
        ),
      })
    },
    H = [
      {
        key: 'report',
        header: n('intelligence.report'),
        cell: (s) =>
          e.jsxs('div', {
            children: [
              e.jsx('div', {
                className: 'font-mono text-xs text-muted-foreground mb-1',
                children: s.report_number,
              }),
              e.jsx('div', { className: 'font-medium', children: A ? s.title_ar : s.title_en }),
              e.jsx('div', {
                className: 'text-sm text-muted-foreground line-clamp-2 mt-1',
                children: A ? s.executive_summary_ar : s.executive_summary_en,
              }),
            ],
          }),
      },
      {
        key: 'analysis',
        header: n('intelligence.analysisType'),
        cell: (s) => e.jsx(q, { types: s.analysis_type }),
      },
      {
        key: 'confidence',
        header: n('intelligence.confidence'),
        cell: (s) => e.jsx(E, { level: s.confidence_level }),
      },
      {
        key: 'classification',
        header: n('intelligence.classification'),
        cell: (s) => e.jsx(M, { classification: s.classification }),
      },
      {
        key: 'findings',
        header: n('intelligence.keyFindings'),
        cell: (s) =>
          e.jsxs('div', {
            className: 'text-sm',
            children: [
              e.jsx('span', { className: 'font-medium', children: s.key_findings?.length || 0 }),
              e.jsxs('span', {
                className: 'text-muted-foreground',
                children: [' ', n('intelligence.findings')],
              }),
            ],
          }),
      },
      {
        key: 'status',
        header: n('intelligence.status'),
        cell: (s) =>
          e.jsxs('div', {
            className: 'space-y-1',
            children: [
              e.jsx('span', {
                className: `
 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
 ${s.status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
 ${s.status === 'review' ? 'bg-yellow-100 text-yellow-800' : ''}
 ${s.status === 'approved' ? 'bg-blue-100 text-blue-800' : ''}
 ${s.status === 'published' ? 'bg-green-100 text-green-800' : ''}
 `,
                children: n(`intelligence.statuses.${s.status}`),
              }),
              s.published_at &&
                e.jsx('div', {
                  className: 'text-xs text-muted-foreground',
                  children: le(new Date(s.published_at), 'dd MMM yyyy'),
                }),
            ],
          }),
      },
      {
        key: 'people',
        header: n('intelligence.people'),
        cell: (s) =>
          e.jsxs('div', {
            className: 'text-sm space-y-1',
            children: [
              e.jsxs('div', {
                children: [
                  e.jsxs('span', {
                    className: 'text-muted-foreground',
                    children: [n('intelligence.author'), ':'],
                  }),
                  ' ',
                  s.author.full_name,
                ],
              }),
              s.reviewed_by &&
                e.jsxs('div', {
                  children: [
                    e.jsxs('span', {
                      className: 'text-muted-foreground',
                      children: [n('intelligence.reviewer'), ':'],
                    }),
                    ' ',
                    s.reviewed_by.full_name,
                  ],
                }),
              s.approved_by &&
                e.jsxs('div', {
                  children: [
                    e.jsxs('span', {
                      className: 'text-muted-foreground',
                      children: [n('intelligence.approver'), ':'],
                    }),
                    ' ',
                    s.approved_by.full_name,
                  ],
                }),
            ],
          }),
      },
      {
        key: 'actions',
        header: '',
        cell: () =>
          e.jsx(c, { size: 'sm', variant: 'ghost', children: e.jsx(ee, { className: 'h-4 w-4' }) }),
      },
    ],
    O = ['low', 'medium', 'high', 'verified'],
    U = ['public', 'internal', 'confidential', 'restricted']
  return e.jsxs('div', {
    className: 'container mx-auto py-6',
    children: [
      e.jsxs('div', {
        className: 'flex justify-between items-center mb-6',
        children: [
          e.jsx('h1', { className: 'text-3xl font-bold', children: n('navigation.intelligence') }),
          e.jsxs(c, {
            children: [e.jsx(se, { className: 'h-4 w-4 me-2' }), n('intelligence.createReport')],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mb-6',
        children: [
          e.jsxs(r, {
            children: [
              e.jsxs(x, {
                className: 'flex flex-row items-center justify-between space-y-0 pb-2',
                children: [
                  e.jsx(u, {
                    className: 'text-sm font-medium',
                    children: n('intelligence.totalReports'),
                  }),
                  e.jsx(I, { className: 'h-4 w-4 text-muted-foreground' }),
                ],
              }),
              e.jsx(o, {
                children: e.jsx('div', {
                  className: 'text-2xl font-bold',
                  children: a?.length || 0,
                }),
              }),
            ],
          }),
          e.jsxs(r, {
            children: [
              e.jsxs(x, {
                className: 'flex flex-row items-center justify-between space-y-0 pb-2',
                children: [
                  e.jsx(u, {
                    className: 'text-sm font-medium',
                    children: n('intelligence.verifiedReports'),
                  }),
                  e.jsx(L, { className: 'h-4 w-4 text-green-600' }),
                ],
              }),
              e.jsx(o, {
                children: e.jsx('div', {
                  className: 'text-2xl font-bold',
                  children: a?.filter((s) => s.confidence_level === 'verified').length || 0,
                }),
              }),
            ],
          }),
          e.jsxs(r, {
            children: [
              e.jsxs(x, {
                className: 'flex flex-row items-center justify-between space-y-0 pb-2',
                children: [
                  e.jsx(u, {
                    className: 'text-sm font-medium',
                    children: n('intelligence.pendingReview'),
                  }),
                  e.jsx(R, { className: 'h-4 w-4 text-yellow-600' }),
                ],
              }),
              e.jsx(o, {
                children: e.jsx('div', {
                  className: 'text-2xl font-bold',
                  children: a?.filter((s) => s.status === 'review').length || 0,
                }),
              }),
            ],
          }),
          e.jsxs(r, {
            children: [
              e.jsxs(x, {
                className: 'flex flex-row items-center justify-between space-y-0 pb-2',
                children: [
                  e.jsx(u, {
                    className: 'text-sm font-medium',
                    children: n('intelligence.published'),
                  }),
                  e.jsx(k, { className: 'h-4 w-4 text-blue-600' }),
                ],
              }),
              e.jsx(o, {
                children: e.jsx('div', {
                  className: 'text-2xl font-bold',
                  children: a?.filter((s) => s.status === 'published').length || 0,
                }),
              }),
            ],
          }),
        ],
      }),
      e.jsxs(r, {
        className: 'mb-6',
        children: [
          e.jsx(x, { children: e.jsx(u, { children: n('intelligence.search') }) }),
          e.jsx(o, {
            children: e.jsxs('div', {
              className: 'space-y-4',
              children: [
                e.jsxs('div', {
                  className: 'flex gap-4',
                  children: [
                    e.jsx(z, {
                      placeholder: n('intelligence.searchPlaceholder'),
                      value: f,
                      onChange: (s) => D(s.target.value),
                      className: 'max-w-sm',
                    }),
                    e.jsxs('div', {
                      className: 'flex-1 flex gap-2',
                      children: [
                        e.jsx(z, {
                          placeholder: n('intelligence.similaritySearchPlaceholder'),
                          value: _,
                          onChange: (s) => F(s.target.value),
                        }),
                        e.jsxs(c, {
                          onClick: () => $.mutate(_),
                          disabled: !_ || $.isPending,
                          children: [
                            e.jsx(te, { className: 'h-4 w-4 me-2' }),
                            n('intelligence.vectorSearch'),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'flex gap-4',
                  children: [
                    e.jsxs('div', {
                      className: 'flex gap-2',
                      children: [
                        e.jsxs('span', {
                          className: 'text-sm text-muted-foreground mt-2',
                          children: [n('intelligence.confidence'), ':'],
                        }),
                        e.jsx(c, {
                          variant: d === 'all' ? 'default' : 'outline',
                          size: 'sm',
                          onClick: () => S('all'),
                          children: n('common.all'),
                        }),
                        O.map((s) =>
                          e.jsx(
                            c,
                            {
                              variant: d === s ? 'default' : 'outline',
                              size: 'sm',
                              onClick: () => S(s),
                              children: n(`intelligence.confidenceLevels.${s}`),
                            },
                            s,
                          ),
                        ),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'flex gap-2',
                      children: [
                        e.jsxs('span', {
                          className: 'text-sm text-muted-foreground mt-2',
                          children: [n('intelligence.classification'), ':'],
                        }),
                        e.jsx(c, {
                          variant: m === 'all' ? 'default' : 'outline',
                          size: 'sm',
                          onClick: () => w('all'),
                          children: n('common.all'),
                        }),
                        U.map((s) =>
                          e.jsx(
                            c,
                            {
                              variant: m === s ? 'default' : 'outline',
                              size: 'sm',
                              onClick: () => w(s),
                              children: n(`intelligence.classifications.${s}`),
                            },
                            s,
                          ),
                        ),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),
        ],
      }),
      e.jsx(r, {
        children: e.jsx(o, {
          className: 'p-0',
          children: P
            ? e.jsx('div', { className: 'p-8 text-center', children: n('common.loading') })
            : a && a.length > 0
              ? e.jsx(Z, { data: a, columns: H, onRowClick: (s) => {} })
              : e.jsx('div', {
                  className: 'p-8 text-center text-muted-foreground',
                  children: n('common.noData'),
                }),
        }),
      }),
    ],
  })
}
function ae() {
  return e.jsx(ie, {})
}
const ye = ae
export { ye as component }
//# sourceMappingURL=intelligence-SFCAxf_y.js.map
