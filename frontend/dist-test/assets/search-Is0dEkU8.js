import { u as D, r as g, j as e } from './react-vendor-Buoak6m3.js'
import { a as L, d as X, i as Q, k as W } from './tanstack-vendor-BZC-rs5U.js'
import {
  Y as U,
  I as Y,
  B as J,
  p as F,
  Z,
  _ as ee,
  $ as te,
  m as $,
  a0 as w,
  s as P,
} from './index-qYY0KoZ1.js'
import { aE as ae, aS as se, aD as re, ca as ne, aL as T, aM as z } from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function le({
  value: t,
  onChange: a,
  onSearch: r,
  isLoading: m = !1,
  placeholder: x,
  autoFocus: c = !1,
  className: i = '',
  onFocus: n,
  onBlur: o,
}) {
  const { t: d, i18n: s } = D(),
    l = g.useRef(null),
    [u, h] = g.useState(t),
    p = U(u, 200)
  ;(g.useEffect(() => {
    p !== t && a(p)
  }, [p, a, t]),
    g.useEffect(() => {
      h(t)
    }, [t]),
    g.useEffect(() => {
      const y = (E) => {
        E.key === '/' &&
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA' &&
          (E.preventDefault(), l.current?.focus())
      }
      return (window.addEventListener('keydown', y), () => window.removeEventListener('keydown', y))
    }, []))
  const f = (y) => {
      h(y.target.value)
    },
    N = () => {
      ;(h(''), a(''), l.current?.focus())
    },
    v = (y) => {
      ;(y.key === 'Enter' && r && (y.preventDefault(), r(u)),
        y.key === 'Escape' && (y.preventDefault(), N()))
    },
    k = s.language === 'ar' ? 'rtl' : 'ltr',
    S = x || d('search.placeholder', 'Search dossiers, people, positions...')
  return e.jsxs('div', {
    className: `relative w-full ${i}`,
    dir: k,
    children: [
      e.jsx('div', {
        className: `absolute top-1/2 -translate-y-1/2 ${k === 'rtl' ? 'right-3' : 'left-3'} pointer-events-none text-muted-foreground`,
        children: e.jsx(ae, { className: 'size-4' }),
      }),
      e.jsx(Y, {
        ref: l,
        type: 'search',
        value: u,
        onChange: f,
        onKeyDown: v,
        onFocus: n,
        onBlur: o,
        placeholder: S,
        className: `w-full ${k === 'rtl' ? 'pe-10 ps-20' : 'pe-20 ps-10'}`,
        dir: 'auto',
        autoFocus: c,
        autoComplete: 'off',
        autoCorrect: 'off',
        autoCapitalize: 'off',
        spellCheck: 'false',
        role: 'searchbox',
        'aria-label': d('search.label', 'Global search'),
        'aria-autocomplete': 'list',
        'aria-controls': 'search-suggestions',
        'aria-expanded': !1,
      }),
      e.jsxs('div', {
        className: `absolute top-1/2 -translate-y-1/2 ${k === 'rtl' ? 'left-2' : 'right-2'} flex items-center gap-1`,
        children: [
          m &&
            e.jsx('div', {
              className: 'me-1',
              'aria-label': d('search.loading', 'Loading...'),
              children: e.jsx(se, { className: 'size-4 animate-spin text-muted-foreground' }),
            }),
          u &&
            !m &&
            e.jsx(J, {
              type: 'button',
              variant: 'ghost',
              size: 'sm',
              onClick: N,
              className: 'size-7 p-0 hover:bg-muted',
              'aria-label': d('search.clear', 'Clear search'),
              children: e.jsx(re, { className: 'size-4' }),
            }),
          !u &&
            !m &&
            e.jsx('div', {
              className:
                'hidden items-center gap-1 rounded bg-muted px-2 py-1 text-xs text-muted-foreground sm:flex',
              children: e.jsx('kbd', { className: 'font-mono', children: '/' }),
            }),
        ],
      }),
    ],
  })
}
const ie = {
    dossier: '📁',
    person: '👤',
    engagement: '🤝',
    position: '📋',
    document: '📄',
    mou: '📜',
  },
  M = {
    dossier: { en: 'Dossier', ar: 'ملف' },
    person: { en: 'Person', ar: 'شخص' },
    engagement: { en: 'Engagement', ar: 'مشاركة' },
    position: { en: 'Position', ar: 'موقف' },
    document: { en: 'Document', ar: 'وثيقة' },
    mou: { en: 'MoU', ar: 'مذكرة تفاهم' },
  }
function oe({
  suggestions: t,
  isOpen: a,
  activeIndex: r,
  onSelect: m,
  onClose: x,
  onActiveIndexChange: c,
  isLoading: i = !1,
}) {
  const { t: n, i18n: o } = D(),
    d = g.useRef(null),
    s = g.useRef(null),
    l = o.language === 'ar'
  if (
    (g.useEffect(() => {
      s.current && a && s.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, [r, a]),
    g.useEffect(() => {
      if (!a) return
      const h = (p) => {
        switch (p.key) {
          case 'ArrowDown':
            ;(p.preventDefault(), c(Math.min(r + 1, t.length - 1)))
            break
          case 'ArrowUp':
            ;(p.preventDefault(), c(Math.max(r - 1, 0)))
            break
          case 'Enter':
            ;(p.preventDefault(), r >= 0 && t[r] && m(t[r]))
            break
          case 'Escape':
            ;(p.preventDefault(), x())
            break
        }
      }
      return (window.addEventListener('keydown', h), () => window.removeEventListener('keydown', h))
    }, [a, r, t, c, m, x]),
    !a)
  )
    return null
  const u = t.reduce((h, p) => (h[p.type] || (h[p.type] = []), h[p.type].push(p), h), {})
  return e.jsxs('div', {
    className:
      'absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800',
    role: 'listbox',
    'aria-label': n('search.suggestions.label'),
    dir: l ? 'rtl' : 'ltr',
    children: [
      e.jsx(F, {
        className: 'max-h-96',
        children: e.jsx('div', {
          ref: d,
          className: 'p-2',
          children: i
            ? e.jsx('div', {
                className: 'px-4 py-3 text-sm text-gray-500 dark:text-gray-400',
                children: n('search.suggestions.loading'),
              })
            : t.length === 0
              ? e.jsx('div', {
                  className: 'px-4 py-3 text-sm text-gray-500 dark:text-gray-400',
                  children: n('search.suggestions.noResults'),
                })
              : Object.entries(u).map(([h, p]) =>
                  e.jsxs(
                    'div',
                    {
                      className: 'mb-3 last:mb-0',
                      children: [
                        e.jsxs('div', {
                          className:
                            'px-3 py-1 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400',
                          children: [
                            e.jsx('span', { className: 'me-1', children: ie[h] }),
                            l ? M[h]?.ar || h : M[h]?.en || h,
                          ],
                        }),
                        p.map((f, N) => {
                          const v = t.indexOf(f),
                            k = v === r
                          return e.jsx(
                            'div',
                            {
                              ref: k ? s : null,
                              role: 'option',
                              'aria-selected': k,
                              className: `
 cursor-pointer rounded-md px-3 py-2 transition-colors
 ${k ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
 `,
                              onClick: () => m(f),
                              onMouseEnter: () => c(v),
                              children: e.jsxs('div', {
                                className: 'flex items-start justify-between',
                                children: [
                                  e.jsxs('div', {
                                    className: 'min-w-0 flex-1',
                                    children: [
                                      e.jsx('div', {
                                        className:
                                          'truncate text-sm font-medium text-gray-900 dark:text-gray-100',
                                        children: l ? f.title_ar : f.title_en,
                                      }),
                                      f.title_en &&
                                        f.title_ar &&
                                        e.jsx('div', {
                                          className:
                                            'truncate text-xs text-gray-500 dark:text-gray-400',
                                          children: l ? f.title_en : f.title_ar,
                                        }),
                                      f.preview &&
                                        e.jsx('div', {
                                          className:
                                            'mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-300',
                                          children: f.preview,
                                        }),
                                    ],
                                  }),
                                  !1,
                                ],
                              }),
                            },
                            f.id,
                          )
                        }),
                      ],
                    },
                    h,
                  ),
                ),
        }),
      }),
      !i &&
        t.length > 0 &&
        e.jsx('div', {
          className:
            'border-t border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50',
          children: e.jsx('div', {
            className: 'flex items-center justify-between text-xs text-gray-500 dark:text-gray-400',
            children: e.jsx('span', {
              children: l
                ? 'استخدم ↑/↓ للتنقل، Enter للاختيار، Esc للإغلاق'
                : 'Use ↑/↓ to navigate, Enter to select, Esc to close',
            }),
          }),
        }),
    ],
  })
}
const K = {
  all: { icon: '🔍', labelKey: 'all', color: 'text-gray-700 dark:text-gray-300' },
  country: { icon: '🌍', labelKey: 'country', color: 'text-blue-600 dark:text-blue-400' },
  organization: {
    icon: '🏢',
    labelKey: 'organization',
    color: 'text-purple-600 dark:text-purple-400',
  },
  forum: { icon: '👥', labelKey: 'forum', color: 'text-cyan-600 dark:text-cyan-400' },
  engagement: { icon: '🤝', labelKey: 'engagement', color: 'text-green-600 dark:text-green-400' },
  theme: { icon: '🎯', labelKey: 'theme', color: 'text-pink-600 dark:text-pink-400' },
  working_group: {
    icon: '💼',
    labelKey: 'working_group',
    color: 'text-amber-600 dark:text-amber-400',
  },
  person: { icon: '👤', labelKey: 'person', color: 'text-teal-600 dark:text-teal-400' },
  positions: { icon: '📋', labelKey: 'positions', color: 'text-orange-600 dark:text-orange-400' },
  documents: { icon: '📄', labelKey: 'documents', color: 'text-indigo-600 dark:text-indigo-400' },
}
function ce({ selectedType: t, counts: a, onTypeChange: r, isLoading: m = !1 }) {
  const { t: x, i18n: c } = D(),
    i = g.useRef(null),
    n = c.language === 'ar'
  return (
    g.useEffect(() => {
      const o = (d) => {
        if (!i.current?.contains(document.activeElement)) return
        const s = Object.keys(K),
          l = s.indexOf(t)
        switch (d.key) {
          case 'ArrowLeft':
            if ((d.preventDefault(), n)) {
              const u = (l + 1) % s.length
              r(s[u])
            } else {
              const u = (l - 1 + s.length) % s.length
              r(s[u])
            }
            break
          case 'ArrowRight':
            if ((d.preventDefault(), n)) {
              const u = (l - 1 + s.length) % s.length
              r(s[u])
            } else {
              const u = (l + 1) % s.length
              r(s[u])
            }
            break
          case 'Home':
            ;(d.preventDefault(), r('all'))
            break
          case 'End':
            ;(d.preventDefault(), r(s[s.length - 1]))
            break
        }
      }
      return (window.addEventListener('keydown', o), () => window.removeEventListener('keydown', o))
    }, [t, n, r]),
    e.jsxs('div', {
      ref: i,
      className: 'w-full overflow-x-auto',
      dir: n ? 'rtl' : 'ltr',
      children: [
        e.jsx(Z, {
          value: t,
          onValueChange: (o) => r(o),
          children: e.jsx(ee, {
            className:
              'inline-flex h-10 w-full items-center justify-start rounded-md bg-muted p-1 text-muted-foreground sm:w-auto',
            role: 'tablist',
            'aria-label': x('search.tabs.label'),
            children: Object.keys(K).map((o) => {
              const d = K[o],
                s = a[o] || 0,
                l = t === o
              return e.jsxs(
                te,
                {
                  value: o,
                  role: 'tab',
                  'aria-selected': l,
                  'aria-controls': `search-results-${o}`,
                  className: `
 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5
 text-sm font-medium ring-offset-background transition-all
 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
 disabled:pointer-events-none disabled:opacity-50
 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm
 ${m ? 'cursor-wait' : 'cursor-pointer'}
 `,
                  disabled: m,
                  children: [
                    e.jsx('span', { className: `me-2 ${n ? 'me-0 ms-2' : ''}`, children: d.icon }),
                    e.jsx('span', {
                      className: l ? d.color : '',
                      children: x(`search.entityTypes.${d.labelKey}`),
                    }),
                    s > 0 &&
                      e.jsx('span', {
                        className: `
 ms-2 ${n ? 'me-2 ms-0' : ''}
 inline-flex h-5 min-w-5
 items-center justify-center rounded-full px-1.5
 text-xs font-semibold
 ${l ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'}
 `,
                        'aria-label': x('search.tabs.countLabel', { count: s }),
                        children: s > 999 ? '999+' : s,
                      }),
                    m &&
                      l &&
                      e.jsx('span', {
                        className:
                          'ms-2 inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent',
                      }),
                  ],
                },
                o,
              )
            }),
          }),
        }),
        e.jsx('div', {
          className: 'sr-only',
          role: 'status',
          'aria-live': 'polite',
          children: x('search.tabs.keyboardHint'),
        }),
      ],
    })
  )
}
const q = {
  dossier: {
    icon: '📁',
    label: { en: 'Dossier', ar: 'ملف' },
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  person: {
    icon: '👤',
    label: { en: 'Person', ar: 'شخص' },
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  },
  engagement: {
    icon: '🤝',
    label: { en: 'Engagement', ar: 'مشاركة' },
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  },
  position: {
    icon: '📋',
    label: { en: 'Position', ar: 'موقف' },
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  },
  document: {
    icon: '📄',
    label: { en: 'Document', ar: 'وثيقة' },
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  },
  mou: {
    icon: '📜',
    label: { en: 'MoU', ar: 'مذكرة تفاهم' },
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
}
function B({ result: t, isRTL: a }) {
  const r = q[t.entityType] || q.dossier,
    [m, x] = g.useState(!1),
    c = (i) => {
      switch (i) {
        case 'primary':
          return 'text-blue-600 dark:text-blue-400'
        case 'secondary':
          return 'text-gray-600 dark:text-gray-400'
        case 'observer':
          return 'text-gray-400 dark:text-gray-500'
        default:
          return 'text-gray-600 dark:text-gray-400'
      }
    }
  return e.jsx('a', {
    href: t.url,
    className:
      'block rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-500 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-400',
    role: 'listitem',
    children: e.jsxs('div', {
      className: 'flex items-start justify-between gap-3',
      children: [
        e.jsxs('div', {
          className: 'min-w-0 flex-1',
          children: [
            e.jsxs('div', {
              className: 'mb-2 flex flex-wrap items-center gap-2',
              children: [
                e.jsxs('span', {
                  className: `inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${r.color}`,
                  children: [
                    e.jsx('span', { className: 'me-1', children: r.icon }),
                    a ? r.label.ar : r.label.en,
                  ],
                }),
                t.isArchived &&
                  e.jsx('span', {
                    className:
                      'inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                    children: a ? 'مؤرشف' : 'Archived',
                  }),
                t.matchType === 'semantic' &&
                  e.jsx('span', {
                    className:
                      'inline-flex items-center rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                    children: a ? 'تطابق دلالي' : 'Semantic match',
                  }),
                t.relationshipPath &&
                  t.relationshipPath.length > 1 &&
                  e.jsxs('button', {
                    onClick: (i) => {
                      ;(i.preventDefault(), x(!m))
                    },
                    className:
                      'inline-flex items-center rounded-md bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/40',
                    children: [
                      e.jsx(ne, { className: 'me-1 size-3' }),
                      t.relationshipPath.length,
                      ' ',
                      a ? 'ملفات' : 'dossiers',
                    ],
                  }),
              ],
            }),
            e.jsx('h3', {
              className: 'mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100',
              children: a ? t.title_ar : t.title_en,
            }),
            t.title_en &&
              t.title_ar &&
              e.jsx('p', {
                className: 'mb-2 text-sm text-gray-600 dark:text-gray-400',
                children: a ? t.title_en : t.title_ar,
              }),
            (t.snippet_en || t.snippet_ar) &&
              e.jsx('div', {
                className: 'line-clamp-2 text-sm text-gray-700 dark:text-gray-300',
                dangerouslySetInnerHTML: { __html: a ? t.snippet_ar || '' : t.snippet_en || '' },
              }),
            e.jsxs('div', {
              className: 'mt-2 text-xs text-gray-500 dark:text-gray-400',
              children: [
                a ? 'آخر تحديث:' : 'Updated:',
                ' ',
                new Date(t.updatedAt).toLocaleDateString(a ? 'ar-SA' : 'en-US'),
              ],
            }),
            t.parentDossier &&
              e.jsxs('div', {
                className: 'mt-2 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400',
                children: [
                  e.jsx('span', { children: a ? 'من:' : 'from' }),
                  e.jsx($, {
                    variant: 'outline',
                    className: 'text-xs',
                    children: a ? t.parentDossier.name_ar : t.parentDossier.name_en,
                  }),
                  e.jsxs('span', {
                    className: 'text-gray-400',
                    children: ['(', t.parentDossier.type, ')'],
                  }),
                ],
              }),
            t.linkedDossiers &&
              t.linkedDossiers.length > 0 &&
              e.jsxs('div', {
                className:
                  'mt-2 flex flex-wrap items-center gap-1 text-xs text-gray-600 dark:text-gray-400',
                children: [
                  e.jsx('span', { children: a ? 'مرتبط بـ:' : 'linked to:' }),
                  t.linkedDossiers.slice(0, 2).map((i, n) =>
                    e.jsx(
                      $,
                      {
                        variant: 'outline',
                        className: 'text-xs',
                        children: a ? i.name_ar : i.name_en,
                      },
                      i.id,
                    ),
                  ),
                  t.linkedDossiers.length > 2 &&
                    e.jsx('span', {
                      className: 'text-gray-400',
                      children: a
                        ? `...و ${t.linkedDossiers.length - 2} أخرى`
                        : `...and ${t.linkedDossiers.length - 2} more`,
                    }),
                ],
              }),
            m &&
              t.relationshipPath &&
              t.relationshipPath.length > 0 &&
              e.jsxs('div', {
                className:
                  'mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50',
                children: [
                  e.jsx('div', {
                    className: 'mb-2 text-xs font-medium text-gray-700 dark:text-gray-300',
                    children: a ? 'مسار العلاقة:' : 'Relationship Path:',
                  }),
                  e.jsx('div', {
                    className: 'flex flex-col gap-2',
                    children: t.relationshipPath.map((i, n) =>
                      e.jsxs(
                        'div',
                        {
                          className: 'flex items-center gap-2 text-xs',
                          children: [
                            e.jsx($, {
                              variant: 'outline',
                              className: 'text-xs',
                              children: a ? i.dossier_name_ar : i.dossier_name_en,
                            }),
                            n < t.relationshipPath.length - 1 &&
                              e.jsxs(e.Fragment, {
                                children: [
                                  a
                                    ? e.jsx(T, { className: 'size-3 text-gray-400' })
                                    : e.jsx(z, { className: 'size-3 text-gray-400' }),
                                  i.relationship_type &&
                                    e.jsx('span', {
                                      className: `text-xs ${c(i.relationship_strength)}`,
                                      children: i.relationship_type,
                                    }),
                                  a
                                    ? e.jsx(T, { className: 'size-3 text-gray-400' })
                                    : e.jsx(z, { className: 'size-3 text-gray-400' }),
                                ],
                              }),
                          ],
                        },
                        i.dossier_id,
                      ),
                    ),
                  }),
                ],
              }),
          ],
        }),
        !1,
      ],
    }),
  })
}
function de() {
  return e.jsx('div', {
    className: 'rounded-lg border border-gray-200 p-4 dark:border-gray-700',
    children: e.jsx('div', {
      className: 'flex items-start gap-3',
      children: e.jsxs('div', {
        className: 'flex-1 space-y-3',
        children: [
          e.jsxs('div', {
            className: 'flex gap-2',
            children: [e.jsx(w, { className: 'h-6 w-20' }), e.jsx(w, { className: 'h-6 w-16' })],
          }),
          e.jsx(w, { className: 'h-6 w-3/4' }),
          e.jsx(w, { className: 'h-4 w-1/2' }),
          e.jsx(w, { className: 'h-4 w-full' }),
          e.jsx(w, { className: 'h-4 w-full' }),
          e.jsx(w, { className: 'h-3 w-32' }),
        ],
      }),
    }),
  })
}
function me({
  results: t,
  exactMatches: a = [],
  isLoading: r = !1,
  hasMore: m = !1,
  onLoadMore: x,
  typoSuggestions: c = [],
  searchTips: i = [],
}) {
  const { t: n, i18n: o } = D(),
    d = o.language === 'ar'
  return !r && t.length === 0 && a.length === 0
    ? e.jsxs('div', {
        className: 'py-12 text-center',
        dir: d ? 'rtl' : 'ltr',
        children: [
          e.jsx('div', { className: 'mb-4 text-6xl', children: '🔍' }),
          e.jsx('h3', {
            className: 'mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100',
            children: n('search.noResults.title'),
          }),
          e.jsx('p', {
            className: 'mb-6 text-gray-600 dark:text-gray-400',
            children: n('search.noResults.description'),
          }),
          c.length > 0 &&
            e.jsxs('div', {
              className: 'mb-6',
              children: [
                e.jsx('p', {
                  className: 'mb-2 text-sm text-gray-700 dark:text-gray-300',
                  children: n('search.noResults.didYouMean'),
                }),
                e.jsx('div', {
                  className: 'flex flex-wrap justify-center gap-2',
                  children: c.map((s, l) =>
                    e.jsx(
                      'button',
                      {
                        className:
                          'rounded-md bg-blue-50 px-3 py-1 text-sm text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30',
                        onClick: () => {},
                        children: s,
                      },
                      l,
                    ),
                  ),
                }),
              ],
            }),
          i.length > 0 &&
            e.jsxs('div', {
              className: 'mx-auto max-w-md text-start',
              children: [
                e.jsx('p', {
                  className: 'mb-2 text-sm font-medium text-gray-700 dark:text-gray-300',
                  children: n('search.noResults.tips'),
                }),
                e.jsx('ul', {
                  className:
                    'list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400',
                  children: i.map((s, l) => e.jsx('li', { children: s }, l)),
                }),
              ],
            }),
        ],
      })
    : e.jsx(F, {
        className: 'h-full',
        dir: d ? 'rtl' : 'ltr',
        children: e.jsxs('div', {
          className: 'space-y-4',
          role: 'list',
          children: [
            a.length > 0 &&
              e.jsxs('div', {
                children: [
                  e.jsxs('h2', {
                    className: 'mb-3 px-1 text-sm font-semibold text-gray-700 dark:text-gray-300',
                    children: [n('search.sections.exactMatches'), ' (', a.length, ')'],
                  }),
                  e.jsx('div', {
                    className: 'space-y-3',
                    children: a.map((s) => e.jsx(B, { result: s, isRTL: d }, s.id)),
                  }),
                ],
              }),
            t.length > 0 &&
              e.jsxs('div', {
                children: [
                  a.length > 0 &&
                    e.jsxs('h2', {
                      className:
                        'mb-3 mt-6 px-1 text-sm font-semibold text-gray-700 dark:text-gray-300',
                      children: [n('search.sections.related'), ' (', t.length, ')'],
                    }),
                  e.jsx('div', {
                    className: 'space-y-3',
                    children: t.map((s) => e.jsx(B, { result: s, isRTL: d }, s.id)),
                  }),
                ],
              }),
            r &&
              e.jsx('div', {
                className: 'space-y-3',
                children: [...Array(3)].map((s, l) => e.jsx(de, {}, l)),
              }),
            !r &&
              m &&
              x &&
              e.jsx('div', {
                className: 'pt-4 text-center',
                children: e.jsx('button', {
                  onClick: x,
                  className:
                    'rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700',
                  children: n('search.loadMore'),
                }),
              }),
          ],
        }),
      })
}
class xe extends g.Component {
  constructor(a) {
    ;(super(a), (this.state = { hasError: !1, error: null }))
  }
  static getDerivedStateFromError(a) {
    return { hasError: !0, error: a }
  }
  componentDidCatch(a, r) {
    ;(console.error('Search Error Boundary caught an error:', a, r),
      this.props.onError && this.props.onError(a, r))
  }
  handleReset = () => {
    this.setState({ hasError: !1, error: null })
  }
  render() {
    return this.state.hasError
      ? this.props.fallback
        ? this.props.fallback
        : e.jsx('div', {
            className: 'flex min-h-[400px] items-center justify-center p-8',
            children: e.jsxs('div', {
              className: 'max-w-md text-center',
              children: [
                e.jsx('div', { className: 'mb-4 text-6xl', children: '⚠️' }),
                e.jsx('h2', {
                  className: 'mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100',
                  children: 'Search Error',
                }),
                e.jsx('h2', {
                  className: 'mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100',
                  dir: 'rtl',
                  children: 'خطأ في البحث',
                }),
                e.jsx('p', {
                  className: 'mb-2 text-gray-600 dark:text-gray-400',
                  children: 'Something went wrong while loading the search results.',
                }),
                e.jsx('p', {
                  className: 'mb-6 text-gray-600 dark:text-gray-400',
                  dir: 'rtl',
                  children: 'حدث خطأ أثناء تحميل نتائج البحث.',
                }),
                !1,
                e.jsxs('div', {
                  className: 'flex flex-col justify-center gap-3 sm:flex-row',
                  children: [
                    e.jsx('button', {
                      onClick: this.handleReset,
                      className:
                        'rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700',
                      children: 'Try Again / حاول مرة أخرى',
                    }),
                    e.jsx('button', {
                      onClick: () => window.location.reload(),
                      className:
                        'rounded-md bg-gray-200 px-4 py-2 text-gray-900 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
                      children: 'Reload Page / إعادة تحميل الصفحة',
                    }),
                  ],
                }),
                e.jsxs('p', {
                  className: 'mt-6 text-sm text-gray-500 dark:text-gray-400',
                  children: [
                    'If the problem persists, please contact support.',
                    e.jsx('br', {}),
                    'إذا استمرت المشكلة، يرجى الاتصال بالدعم الفني.',
                  ],
                }),
              ],
            }),
          })
      : this.props.children
  }
}
function he(t) {
  const {
    query: a,
    entityTypes: r = 'all',
    limit: m = 20,
    offset: x = 0,
    includeArchived: c = !1,
    language: i,
  } = t
  return L({
    queryKey: ['search', a, r, m, x, c, i],
    queryFn: async ({ signal: n }) => {
      const o = new URLSearchParams()
      ;(o.set('q', a),
        Array.isArray(r) ? o.set('type', r.join(',')) : r !== 'all' && o.set('type', r),
        o.set('limit', m.toString()),
        o.set('offset', x.toString()),
        o.set('include_archived', c.toString()),
        i && o.set('lang', i))
      const {
        data: { session: d },
      } = await P.auth.getSession()
      if (!d) throw new Error('Not authenticated')
      const s = await fetch(`http://localhost:5001/api/api/search?${o}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${d.access_token}`, 'Content-Type': 'application/json' },
        signal: n,
      })
      if (!s.ok) {
        const u = await s.json()
        throw new Error(u.message || 'Search failed')
      }
      return await s.json()
    },
    enabled: !!(a && a.trim().length > 0),
    staleTime: 60 * 1e3,
    gcTime: 5 * 60 * 1e3,
    retry: 2,
    retryDelay: (n) => Math.min(1e3 * 2 ** n, 3e4),
    refetchOnWindowFocus: !1,
    refetchOnReconnect: !0,
  })
}
function ue(t) {
  const { prefix: a, entityType: r = 'all', limit: m = 10, language: x, debounceMs: c = 200 } = t,
    i = U(a, c),
    n = L({
      queryKey: ['suggestions', i, r, m, x],
      queryFn: async ({ signal: d }) => {
        const s = new URLSearchParams()
        ;(s.set('q', i),
          r !== 'all' && s.set('type', r),
          s.set('limit', m.toString()),
          x && s.set('lang', x))
        const {
          data: { session: l },
        } = await P.auth.getSession()
        if (!l) throw new Error('Not authenticated')
        const u = await fetch(`http://localhost:5001/api/api/search/suggest?${s}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${l.access_token}`,
            'Content-Type': 'application/json',
          },
          signal: d,
        })
        if (!u.ok) {
          const p = await u.json()
          throw new Error(p.message || 'Failed to fetch suggestions')
        }
        const h = await u.json()
        return (
          h.took_ms > 200 && console.warn(`Suggestions took ${h.took_ms}ms (requirement: <200ms)`),
          h
        )
      },
      enabled: !!(i && i.trim().length >= 2),
      staleTime: 5 * 60 * 1e3,
      gcTime: 10 * 60 * 1e3,
      retry: 1,
      retryDelay: 500,
      refetchOnWindowFocus: !1,
      refetchOnReconnect: !1,
    })
  return g.useMemo(
    () => ({
      ...n,
      suggestions: n.data?.suggestions || [],
      cacheHit: n.data?.cache_hit || !1,
      tookMs: n.data?.took_ms || 0,
      isEmpty: (n.data?.suggestions?.length || 0) === 0,
    }),
    [n],
  )
}
function ge() {
  return X({
    mutationFn: async (t) => {
      const {
          query: a,
          entityTypes: r = ['positions', 'documents', 'briefs'],
          similarityThreshold: m = 0.6,
          limit: x = 20,
          includeKeywordResults: c = !1,
        } = t,
        {
          data: { session: i },
        } = await P.auth.getSession()
      if (!i) throw new Error('Not authenticated')
      const n = {
          query: a,
          entity_types: r,
          similarity_threshold: m,
          limit: x,
          include_keyword_results: c,
        },
        o = await fetch('http://localhost:5001/api/api/search/semantic', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${i.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(n),
        })
      if (!o.ok) {
        const s = await o.json()
        throw o.status === 503
          ? new Error('Semantic search is temporarily unavailable. Please try again later.')
          : new Error(s.message || 'Semantic search failed')
      }
      const d = await o.json()
      return (
        d.performance.total_ms > 1e3 &&
          console.warn(`Semantic search took ${d.performance.total_ms}ms (target: <1000ms)`),
        d
      )
    },
    retry: 1,
    retryDelay: 1e3,
    onError: (t) => {},
    onSuccess: (t) => {},
  })
}
function pe({
  searchInputRef: t,
  isOpen: a,
  onClose: r,
  onSubmit: m,
  onNavigate: x,
  onSelect: c,
  disabled: i = !1,
}) {
  const n = g.useCallback(() => {
      t.current?.focus()
    }, [t]),
    o = g.useCallback(() => {
      r()
    }, [r]),
    d = g.useCallback(() => {
      c && c()
    }, [c])
  return (
    g.useEffect(() => {
      if (i) return
      const s = (l) => {
        const u = l.target,
          h = u.tagName === 'INPUT' || u.tagName === 'TEXTAREA' || u.isContentEditable
        if (l.key === '/' && !h) {
          ;(l.preventDefault(), n())
          return
        }
        if (h || a)
          switch (l.key) {
            case 'Escape':
              ;(l.preventDefault(), a ? o() : t.current?.blur())
              break
            case 'Enter':
              !l.shiftKey &&
                !l.ctrlKey &&
                !l.metaKey &&
                (a && c ? (l.preventDefault(), d()) : m && (l.preventDefault(), m()))
              break
            case 'ArrowDown':
              a && x && (l.preventDefault(), x('down'))
              break
            case 'ArrowUp':
              a && x && (l.preventDefault(), x('up'))
              break
            case 'Tab':
              a && o()
              break
          }
      }
      return (
        window.addEventListener('keydown', s),
        () => {
          window.removeEventListener('keydown', s)
        }
      )
    }, [i, a, n, o, d, x, m, c, t]),
    { focusSearch: n, closeDropdown: o, selectSuggestion: d }
  )
}
function fe() {
  const { t, i18n: a } = D(),
    r = Q(),
    m = W({ from: '/search' }),
    x = a.language === 'ar',
    [c, i] = g.useState(m.q || ''),
    [n, o] = g.useState(m.type || 'all'),
    [d, s] = g.useState(!1),
    [l, u] = g.useState(0),
    [h, p] = g.useState(!1),
    f = g.useRef(null),
    {
      data: N,
      isLoading: v,
      error: k,
      refetch: S,
    } = he(c, { includeArchived: m.includeArchived === 'true' }),
    { suggestions: y, isLoading: E } = ue(c),
    { data: I, isLoading: V, mutate: O } = ge()
  ;(pe({
    searchInputRef: f,
    isOpen: d,
    onClose: () => s(!1),
    onSubmit: _,
    onNavigate: (j) => {
      u(j === 'down' ? (C) => Math.min(C + 1, y.length - 1) : (C) => Math.max(C - 1, 0))
    },
    onSelect: () => {
      y[l] && R(y[l])
    },
  }),
    g.useEffect(() => {
      c &&
        r({
          to: '/search',
          search: { q: c, type: n !== 'all' ? n : void 0, includeArchived: m.includeArchived },
        })
    }, [c, n, r, m.includeArchived]))
  function _() {
    ;(s(!1),
      h
        ? O({
            query: c,
            entityTypes: n === 'all' ? ['positions', 'documents'] : [n],
            includeKeywordResults: !0,
          })
        : S())
  }
  function R(j) {
    ;(i(x ? j.title_ar : j.title_en), s(!1), _())
  }
  function G(j) {
    ;(i(j), s(j.length > 0), u(0))
  }
  function H(j) {
    ;(o(j), c && S())
  }
  const b = h ? I : N,
    A = h ? V : v
  return e.jsx(xe, {
    children: e.jsxs('div', {
      className: 'container mx-auto max-w-6xl px-4 py-6',
      dir: x ? 'rtl' : 'ltr',
      children: [
        e.jsxs('div', {
          className: 'mb-6',
          children: [
            e.jsx('h1', {
              className: 'mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100',
              children: t('search.title'),
            }),
            e.jsx('p', {
              className: 'text-gray-600 dark:text-gray-400',
              children: t('search.description'),
            }),
          ],
        }),
        e.jsxs('div', {
          className: 'relative mb-6',
          children: [
            e.jsx(le, {
              ref: f,
              value: c,
              onChange: G,
              onSubmit: _,
              onFocus: () => c && s(!0),
              placeholder: t('search.placeholder'),
              isLoading: E,
            }),
            e.jsx(oe, {
              suggestions: y,
              isOpen: d,
              activeIndex: l,
              onSelect: R,
              onClose: () => s(!1),
              onActiveIndexChange: u,
              isLoading: E,
            }),
          ],
        }),
        c &&
          e.jsxs('div', {
            className: 'mb-4 flex items-center gap-4',
            children: [
              e.jsx('button', {
                onClick: () => p(!1),
                className: `rounded-md px-4 py-2 transition-colors ${h ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : 'bg-blue-600 text-white'}`,
                children: t('search.modes.keyword'),
              }),
              e.jsx('button', {
                onClick: () => p(!0),
                className: `rounded-md px-4 py-2 transition-colors ${h ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`,
                children: t('search.modes.semantic'),
              }),
              e.jsxs('label', {
                className: 'ms-auto flex items-center gap-2',
                children: [
                  e.jsx('input', {
                    type: 'checkbox',
                    checked: m.includeArchived === 'true',
                    onChange: (j) => {
                      r({
                        to: '/search',
                        search: { ...m, includeArchived: j.target.checked ? 'true' : void 0 },
                      })
                    },
                    className: 'size-4 rounded text-blue-600',
                  }),
                  e.jsx('span', {
                    className: 'text-sm text-gray-700 dark:text-gray-300',
                    children: t('search.includeArchived'),
                  }),
                ],
              }),
            ],
          }),
        b &&
          e.jsx('div', {
            className: 'mb-6',
            children: e.jsx(ce, {
              selectedType: n,
              counts: {
                all: b.counts?.total || 0,
                dossiers: b.counts?.dossiers || 0,
                people: b.counts?.people || 0,
                engagements: b.counts?.engagements || 0,
                positions: b.counts?.positions || 0,
                mous: b.counts?.mous || 0,
                documents: b.counts?.documents || 0,
              },
              onTypeChange: H,
              isLoading: A,
            }),
          }),
        k
          ? e.jsxs('div', {
              className: 'py-12 text-center',
              children: [
                e.jsx('div', { className: 'mb-4 text-4xl', children: '❌' }),
                e.jsx('h3', {
                  className: 'mb-2 text-lg font-semibold text-red-600 dark:text-red-400',
                  children: t('search.error.title'),
                }),
                e.jsx('p', {
                  className: 'mb-4 text-gray-600 dark:text-gray-400',
                  children: k instanceof Error ? k.message : t('search.error.generic'),
                }),
                e.jsx('button', {
                  onClick: () => S(),
                  className:
                    'rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700',
                  children: t('search.error.retry'),
                }),
              ],
            })
          : e.jsx(me, {
              results: b?.results || [],
              exactMatches: b?.exactMatches,
              isLoading: A,
              hasMore: b?.hasMore,
              onLoadMore: () => {},
              typoSuggestions: b?.typoSuggestions,
              searchTips:
                c && !A && !b?.results?.length
                  ? [
                      t('search.tips.tryDifferentKeywords'),
                      t('search.tips.useOrOperator'),
                      t('search.tips.checkSpelling'),
                    ]
                  : [],
            }),
        !1,
      ],
    }),
  })
}
const _e = fe
export { _e as component }
//# sourceMappingURL=search-Is0dEkU8.js.map
