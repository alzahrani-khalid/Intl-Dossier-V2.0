import { u as _, r as c, j as e } from './react-vendor-Buoak6m3.js'
import {
  af as f,
  ag as N,
  j as k,
  k as P,
  o as S,
  V as T,
  l as A,
  m as F,
  B as R,
  ae as E,
  s as v,
} from './index-qYY0KoZ1.js'
import { d as I } from './tanstack-vendor-BZC-rs5U.js'
import {
  bg as D,
  bw as B,
  aK as $,
  bi as o,
  ba as z,
  bP as U,
  aB as p,
  cL as y,
} from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
const w = 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1'
async function L() {
  const {
      data: { session: s },
    } = await v.auth.getSession(),
    i = await fetch(`${w}/populate-countries-v2`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${s?.access_token}`, 'Content-Type': 'application/json' },
    })
  if (!i.ok) {
    const n = await i.json()
    throw new Error(n.message_en || n.error || 'Failed to populate countries')
  }
  return i.json()
}
async function M(s) {
  const {
      data: { session: i },
    } = await v.auth.getSession(),
    n = await fetch(`${w}/operation-progress?id=${s}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${i?.access_token}` },
    })
  if (!n.ok) throw new Error('Failed to fetch progress')
  return (await n.json()).progress
}
function Z() {
  const { t: s, i18n: i } = _('admin'),
    n = i.language === 'ar',
    [t, d] = c.useState(null),
    [a, h] = c.useState(null),
    [O, g] = c.useState(null),
    m = c.useRef(null),
    u = I({
      mutationFn: L,
      onSuccess: (r) => {
        r.progress_id ? (g(r.progress_id), b(r.progress_id)) : d(r)
      },
      onError: (r) => {
        ;(d({
          success: !1,
          summary: { total: 0, processed: 0, successful: 0, failed: 1 },
          message_en: r.message,
          message_ar: 'فشل في تحديث بيانات الدول',
          error: r.message,
        }),
          x())
      },
    }),
    b = (r) => {
      ;(x(),
        j(r),
        (m.current = setInterval(() => {
          j(r)
        }, 2e3)))
    },
    x = () => {
      m.current && (clearInterval(m.current), (m.current = null))
    },
    j = async (r) => {
      try {
        const l = await M(r)
        ;(h(l),
          l.is_complete &&
            (x(),
            d({
              success: l.status === 'completed',
              summary: {
                total: l.total_items,
                processed: l.processed_items,
                successful: l.successful_items,
                failed: l.failed_items,
              },
              message_en: `Successfully processed ${l.successful_items} countries`,
              message_ar: `تم معالجة ${l.successful_items} دولة بنجاح`,
            })))
      } catch (l) {
        console.error('Failed to fetch progress:', l)
      }
    }
  c.useEffect(
    () => () => {
      x()
    },
    [],
  )
  const C = () => {
    ;(d(null), h(null), g(null), u.mutate())
  }
  return e.jsxs('div', {
    className: 'container mx-auto py-6 space-y-6',
    dir: n ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'flex items-center gap-3',
        children: [
          e.jsx('div', {
            className: 'p-3 bg-primary/10 rounded-lg',
            children: e.jsx(D, { className: 'h-6 w-6 text-primary' }),
          }),
          e.jsxs('div', {
            children: [
              e.jsx('h1', {
                className: 'text-3xl font-bold',
                children: s('system.title', 'System Utilities'),
              }),
              e.jsx('p', {
                className: 'text-muted-foreground',
                children: s('system.subtitle', 'Maintenance and data management tools'),
              }),
            ],
          }),
        ],
      }),
      e.jsxs(f, {
        variant: 'default',
        className: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
        children: [
          e.jsx(B, { className: 'h-5 w-5 text-yellow-600 dark:text-yellow-400' }),
          e.jsxs(N, {
            className: 'text-yellow-800 dark:text-yellow-200',
            children: [
              e.jsx('p', {
                className: 'font-medium',
                children: s('system.warning', 'Admin Privileges Active'),
              }),
              e.jsx('p', {
                className: 'text-sm mt-1',
                children: s(
                  'system.warningText',
                  'These operations modify system data. Use with caution.',
                ),
              }),
            ],
          }),
        ],
      }),
      e.jsxs(k, {
        children: [
          e.jsx(P, {
            children: e.jsx('div', {
              className: 'flex items-start justify-between',
              children: e.jsxs('div', {
                className: 'flex items-center gap-3',
                children: [
                  e.jsx('div', {
                    className: 'p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg',
                    children: e.jsx($, {
                      className: 'h-5 w-5 text-emerald-600 dark:text-emerald-400',
                    }),
                  }),
                  e.jsxs('div', {
                    children: [
                      e.jsx(S, {
                        className: 'text-xl',
                        children: s('system.populateCountries.title', 'Populate Country Data'),
                      }),
                      e.jsx(T, {
                        children: s(
                          'system.populateCountries.description',
                          'Fetch and update geographic data for all countries from REST Countries API',
                        ),
                      }),
                    ],
                  }),
                ],
              }),
            }),
          }),
          e.jsxs(A, {
            className: 'space-y-4',
            children: [
              e.jsxs('div', {
                className: 'space-y-2',
                children: [
                  e.jsx('h3', {
                    className: 'text-sm font-medium',
                    children: s('system.populateCountries.whatIsIncluded', 'What will be updated:'),
                  }),
                  e.jsxs('div', {
                    className:
                      'grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground',
                    children: [
                      e.jsxs('div', {
                        className: 'flex items-center gap-2',
                        children: [
                          e.jsx(o, { className: 'h-4 w-4 text-emerald-600' }),
                          e.jsx('span', {
                            children: s(
                              'system.populateCountries.isoCodes',
                              'ISO Codes (2 & 3 letter)',
                            ),
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'flex items-center gap-2',
                        children: [
                          e.jsx(o, { className: 'h-4 w-4 text-emerald-600' }),
                          e.jsx('span', {
                            children: s('system.populateCountries.capitals', 'Capital Cities'),
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'flex items-center gap-2',
                        children: [
                          e.jsx(o, { className: 'h-4 w-4 text-emerald-600' }),
                          e.jsx('span', {
                            children: s('system.populateCountries.regions', 'Regions & Subregions'),
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'flex items-center gap-2',
                        children: [
                          e.jsx(o, { className: 'h-4 w-4 text-emerald-600' }),
                          e.jsx('span', {
                            children: s('system.populateCountries.population', 'Population Data'),
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'flex items-center gap-2',
                        children: [
                          e.jsx(o, { className: 'h-4 w-4 text-emerald-600' }),
                          e.jsx('span', {
                            children: s('system.populateCountries.area', 'Area (km²)'),
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'flex items-center gap-2',
                        children: [
                          e.jsx(o, { className: 'h-4 w-4 text-emerald-600' }),
                          e.jsx('span', {
                            children: s('system.populateCountries.flags', 'Flag URLs'),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'flex items-center gap-2',
                children: [
                  e.jsx(z, { className: 'h-4 w-4 text-muted-foreground' }),
                  e.jsx('span', {
                    className: 'text-sm text-muted-foreground',
                    children: s('system.populateCountries.dataSource', 'Data Source:'),
                  }),
                  e.jsxs(F, {
                    variant: 'secondary',
                    className: 'gap-1',
                    children: [e.jsx(U, { className: 'h-3 w-3' }), 'REST Countries API'],
                  }),
                  e.jsxs('span', {
                    className: 'text-xs text-muted-foreground',
                    children: [
                      '(',
                      s('system.populateCountries.countriesCount', '~250 countries'),
                      ')',
                    ],
                  }),
                ],
              }),
              e.jsx(R, {
                onClick: C,
                disabled: u.isPending,
                size: 'lg',
                className: 'w-full sm:w-auto',
                children: u.isPending
                  ? e.jsxs(e.Fragment, {
                      children: [
                        e.jsx(p, { className: 'h-4 w-4 animate-spin' }),
                        e.jsx('span', {
                          children: s('system.populateCountries.processing', 'Processing...'),
                        }),
                      ],
                    })
                  : e.jsxs(e.Fragment, {
                      children: [
                        e.jsx(p, { className: 'h-4 w-4' }),
                        e.jsx('span', {
                          children: s(
                            'system.populateCountries.updateButton',
                            'Update Country Data',
                          ),
                        }),
                      ],
                    }),
              }),
              (u.isPending || a) &&
                !t &&
                e.jsxs('div', {
                  className: 'space-y-3 p-4 bg-muted/30 rounded-lg border',
                  children: [
                    e.jsxs('div', {
                      className: 'flex items-center justify-between text-sm',
                      children: [
                        e.jsx('span', {
                          className: 'text-muted-foreground font-medium',
                          children:
                            a && a.processed_items > 0
                              ? e.jsxs(e.Fragment, {
                                  children: [
                                    s('system.populateCountries.processing', 'Processing'),
                                    ':',
                                    ' ',
                                    e.jsxs('span', {
                                      className: 'font-bold text-foreground',
                                      children: [a.processed_items, '/', a.total_items],
                                    }),
                                    ' ',
                                    s('system.populateCountries.countries', 'countries'),
                                  ],
                                })
                              : s(
                                  'system.populateCountries.fetching',
                                  'Fetching and updating countries...',
                                ),
                        }),
                        a &&
                          e.jsxs('span', {
                            className: 'text-lg font-bold text-emerald-600',
                            children: [a.percentage, '%'],
                          }),
                      ],
                    }),
                    e.jsx('div', {
                      className: 'relative',
                      children: e.jsx(E, { value: a?.percentage || 0, className: 'w-full h-3' }),
                    }),
                    a &&
                      e.jsxs('div', {
                        className: 'grid grid-cols-3 gap-2 text-xs',
                        children: [
                          e.jsxs('div', {
                            className: 'text-center p-2 bg-background rounded',
                            children: [
                              e.jsx('div', {
                                className: 'font-bold text-blue-600',
                                children: a.successful_items,
                              }),
                              e.jsx('div', {
                                className: 'text-muted-foreground',
                                children: s('system.populateCountries.successful', 'Successful'),
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            className: 'text-center p-2 bg-background rounded',
                            children: [
                              e.jsx('div', {
                                className: 'font-bold text-yellow-600',
                                children: a.processed_items - a.successful_items - a.failed_items,
                              }),
                              e.jsx('div', {
                                className: 'text-muted-foreground',
                                children: s('system.populateCountries.pending', 'Pending'),
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            className: 'text-center p-2 bg-background rounded',
                            children: [
                              e.jsx('div', {
                                className: 'font-bold text-red-600',
                                children: a.failed_items,
                              }),
                              e.jsx('div', {
                                className: 'text-muted-foreground',
                                children: s('system.populateCountries.failed', 'Failed'),
                              }),
                            ],
                          }),
                        ],
                      }),
                    e.jsxs('p', {
                      className: 'text-xs text-muted-foreground text-center',
                      children: [
                        !a &&
                          s('system.populateCountries.estimatedTime', 'This may take 2-3 minutes'),
                        a &&
                          a.percentage < 100 &&
                          e.jsxs('span', {
                            className: 'flex items-center justify-center gap-1',
                            children: [
                              e.jsx(p, { className: 'h-3 w-3 animate-spin inline' }),
                              s('system.populateCountries.inProgress', 'Operation in progress...'),
                            ],
                          }),
                      ],
                    }),
                  ],
                }),
              t &&
                e.jsxs(f, {
                  variant: t.success ? 'default' : 'destructive',
                  className: t.success
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : '',
                  children: [
                    t.success
                      ? e.jsx(o, { className: 'h-5 w-5 text-emerald-600 dark:text-emerald-400' })
                      : e.jsx(y, { className: 'h-5 w-5' }),
                    e.jsx(N, {
                      children: e.jsxs('div', {
                        className: 'space-y-3',
                        children: [
                          e.jsx('p', {
                            className: t.success
                              ? 'text-emerald-800 dark:text-emerald-200 font-medium'
                              : 'font-medium',
                            children: n ? t.message_ar : t.message_en,
                          }),
                          t.success &&
                            t.summary &&
                            e.jsxs('div', {
                              className: 'grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2',
                              children: [
                                e.jsxs('div', {
                                  className: 'text-center p-2 bg-background rounded',
                                  children: [
                                    e.jsx('div', {
                                      className: 'text-2xl font-bold text-emerald-600',
                                      children: t.summary.total,
                                    }),
                                    e.jsx('div', {
                                      className: 'text-xs text-muted-foreground',
                                      children: s('system.populateCountries.total', 'Total'),
                                    }),
                                  ],
                                }),
                                e.jsxs('div', {
                                  className: 'text-center p-2 bg-background rounded',
                                  children: [
                                    e.jsx('div', {
                                      className: 'text-2xl font-bold text-blue-600',
                                      children: t.summary.processed,
                                    }),
                                    e.jsx('div', {
                                      className: 'text-xs text-muted-foreground',
                                      children: s(
                                        'system.populateCountries.processed',
                                        'Processed',
                                      ),
                                    }),
                                  ],
                                }),
                                e.jsxs('div', {
                                  className: 'text-center p-2 bg-background rounded',
                                  children: [
                                    e.jsx('div', {
                                      className: 'text-2xl font-bold text-green-600',
                                      children: t.summary.successful,
                                    }),
                                    e.jsx('div', {
                                      className: 'text-xs text-muted-foreground',
                                      children: s(
                                        'system.populateCountries.successful',
                                        'Successful',
                                      ),
                                    }),
                                  ],
                                }),
                                e.jsxs('div', {
                                  className: 'text-center p-2 bg-background rounded',
                                  children: [
                                    e.jsx('div', {
                                      className: `text-2xl font-bold ${t.summary.failed > 0 ? 'text-red-600' : 'text-gray-400'}`,
                                      children: t.summary.failed,
                                    }),
                                    e.jsx('div', {
                                      className: 'text-xs text-muted-foreground',
                                      children: s('system.populateCountries.failed', 'Failed'),
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          t.errors &&
                            t.errors.length > 0 &&
                            e.jsxs('details', {
                              className: 'text-sm',
                              children: [
                                e.jsxs('summary', {
                                  className:
                                    'cursor-pointer text-muted-foreground hover:text-foreground',
                                  children: [
                                    s('system.populateCountries.viewErrors', 'View error details'),
                                    ' (',
                                    t.errors.length,
                                    ')',
                                  ],
                                }),
                                e.jsx('ul', {
                                  className: 'mt-2 space-y-1 text-xs max-h-40 overflow-y-auto',
                                  children: t.errors.map((r, l) =>
                                    e.jsxs(
                                      'li',
                                      {
                                        className: 'flex items-start gap-2',
                                        children: [
                                          e.jsx(y, {
                                            className: 'h-3 w-3 mt-0.5 flex-shrink-0 text-red-500',
                                          }),
                                          e.jsx('span', { children: r }),
                                        ],
                                      },
                                      l,
                                    ),
                                  ),
                                }),
                              ],
                            }),
                        ],
                      }),
                    }),
                  ],
                }),
              e.jsxs('div', {
                className: 'text-xs text-muted-foreground space-y-1 pt-2 border-t',
                children: [
                  e.jsxs('p', {
                    children: [
                      '💡 ',
                      s(
                        'system.populateCountries.tip1',
                        'This operation is safe to run multiple times - it will update existing countries.',
                      ),
                    ],
                  }),
                  e.jsxs('p', {
                    children: [
                      '💡 ',
                      s(
                        'system.populateCountries.tip2',
                        'Run this annually to keep population and area data up to date.',
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
  })
}
export { Z as component }
//# sourceMappingURL=system-DodGAIl5.js.map
