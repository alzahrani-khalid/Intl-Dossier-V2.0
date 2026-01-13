import { u as c, j as e } from './react-vendor-Buoak6m3.js'
import { L as l } from './tanstack-vendor-BZC-rs5U.js'
import {
  j as m,
  l as u,
  m as b,
  b6 as k,
  af as g,
  al as f,
  ag as N,
  B as d,
} from './index-qYY0KoZ1.js'
import { a as O } from './useDossier-CiPcwRKl.js'
import { i as _ } from './dossier-type-guards-DQ1YbbnG.js'
import { D as $ } from './DossierDetailLayout-BuE-52qO.js'
import { a as x, C as p } from './CollapsibleSection-Bj_Tk5Ee.js'
import { b_ as L, ca as C, aH as R, eb as P, bw as v, aX as y } from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function A({ dossier: s }) {
  const { t, i18n: r } = c('dossier'),
    o = r.language === 'ar',
    i = s.extension
  return e.jsx(m, {
    children: e.jsxs(u, {
      className: 'p-4 sm:p-6 space-y-4',
      children: [
        e.jsxs('div', {
          className: 'flex items-center gap-3',
          children: [
            e.jsx('div', {
              className: 'p-2 rounded-lg bg-pink-500/10',
              children: e.jsx(L, { className: 'h-5 w-5 text-pink-600 dark:text-pink-400' }),
            }),
            e.jsxs('div', {
              className: 'flex-1',
              children: [
                e.jsx('h3', {
                  className: 'font-semibold text-base sm:text-lg text-start',
                  children: t('sections.topic.policyOverview'),
                }),
                e.jsx('p', {
                  className: 'text-xs sm:text-sm text-muted-foreground text-start',
                  children: t('sections.topic.policyOverviewDescription'),
                }),
              ],
            }),
          ],
        }),
        e.jsxs('div', {
          className: 'space-y-3',
          children: [
            i?.topic_category &&
              e.jsxs('div', {
                className: 'flex flex-col sm:flex-row sm:items-center gap-2',
                children: [
                  e.jsxs('span', {
                    className: 'text-sm font-medium text-muted-foreground min-w-[120px] text-start',
                    children: [t('sections.topic.category'), ':'],
                  }),
                  e.jsx(b, {
                    variant: 'secondary',
                    className: 'w-fit capitalize',
                    children: i.topic_category,
                  }),
                ],
              }),
            i?.parent_topic_id &&
              e.jsxs('div', {
                className: 'flex flex-col sm:flex-row sm:items-center gap-2',
                children: [
                  e.jsxs('span', {
                    className: 'text-sm font-medium text-muted-foreground min-w-[120px] text-start',
                    children: [t('sections.topic.parentTopic'), ':'],
                  }),
                  e.jsx(b, { variant: 'outline', className: 'w-fit', children: i.parent_topic_id }),
                ],
              }),
            e.jsx('div', {
              className: 'pt-3 border-t',
              children: e.jsx('p', {
                className: 'text-sm text-muted-foreground text-start leading-relaxed',
                children: o ? s.description_ar : s.description_en || t('common.notAvailable'),
              }),
            }),
          ],
        }),
      ],
    }),
  })
}
function I({ dossierId: s }) {
  const { t } = c('dossier')
  return e.jsx(m, {
    children: e.jsxs(u, {
      className: 'p-4 sm:p-6',
      children: [
        e.jsxs('div', {
          className: 'flex items-center gap-3 mb-4',
          children: [
            e.jsx('div', {
              className: 'p-2 rounded-lg bg-blue-500/10',
              children: e.jsx(C, { className: 'h-5 w-5 text-blue-600 dark:text-blue-400' }),
            }),
            e.jsxs('div', {
              className: 'flex-1',
              children: [
                e.jsx('h3', {
                  className: 'font-semibold text-base sm:text-lg text-start',
                  children: t('sections.topic.relatedDossiers'),
                }),
                e.jsx('p', {
                  className: 'text-xs sm:text-sm text-muted-foreground text-start',
                  children: t('sections.topic.relatedDossiersDescription'),
                }),
              ],
            }),
          ],
        }),
        e.jsx('div', {
          className: 'text-center py-8 text-sm text-muted-foreground',
          children: t('sections.topic.relatedDossiersPlaceholder'),
        }),
      ],
    }),
  })
}
function S({ dossierId: s }) {
  const { t } = c('dossier')
  return e.jsx(m, {
    children: e.jsxs(u, {
      className: 'p-4 sm:p-6',
      children: [
        e.jsxs('div', {
          className: 'flex items-center gap-3 mb-4',
          children: [
            e.jsx('div', {
              className: 'p-2 rounded-lg bg-green-500/10',
              children: e.jsx(R, { className: 'h-5 w-5 text-green-600 dark:text-green-400' }),
            }),
            e.jsxs('div', {
              className: 'flex-1',
              children: [
                e.jsx('h3', {
                  className: 'font-semibold text-base sm:text-lg text-start',
                  children: t('sections.topic.keyDocuments'),
                }),
                e.jsx('p', {
                  className: 'text-xs sm:text-sm text-muted-foreground text-start',
                  children: t('sections.topic.keyDocumentsDescription'),
                }),
              ],
            }),
          ],
        }),
        e.jsx('div', {
          className: 'text-center py-8 text-sm text-muted-foreground',
          children: t('sections.topic.keyDocumentsPlaceholder'),
        }),
      ],
    }),
  })
}
function B({ dossierId: s }) {
  const { t } = c('dossier')
  return e.jsx(m, {
    children: e.jsxs(u, {
      className: 'p-4 sm:p-6',
      children: [
        e.jsxs('div', {
          className: 'flex items-center gap-3 mb-4',
          children: [
            e.jsx('div', {
              className: 'p-2 rounded-lg bg-purple-500/10',
              children: e.jsx(P, { className: 'h-5 w-5 text-purple-600 dark:text-purple-400' }),
            }),
            e.jsxs('div', {
              className: 'flex-1',
              children: [
                e.jsx('h3', {
                  className: 'font-semibold text-base sm:text-lg text-start',
                  children: t('sections.topic.subtopics'),
                }),
                e.jsx('p', {
                  className: 'text-xs sm:text-sm text-muted-foreground text-start',
                  children: t('sections.topic.subtopicsDescription'),
                }),
              ],
            }),
          ],
        }),
        e.jsx('div', {
          className: 'text-center py-8 text-sm text-muted-foreground',
          children: t('sections.topic.subtopicsPlaceholder'),
        }),
      ],
    }),
  })
}
function F({ dossier: s }) {
  const { t, i18n: r } = c('dossier'),
    o = r.language === 'ar',
    [i, j] = x(`topic-${s.id}-policy-open`, !0),
    [a, n] = x(`topic-${s.id}-related-open`, !0),
    [h, w] = x(`topic-${s.id}-documents-open`, !0),
    [D, T] = x(`topic-${s.id}-subtopics-open`, !0)
  return e.jsxs('div', {
    className: 'space-y-4 sm:space-y-6',
    dir: o ? 'rtl' : 'ltr',
    children: [
      e.jsx(p, {
        title: t('sections.topic.policyOverview'),
        description: t('sections.topic.policyOverviewDescription'),
        isOpen: i,
        onToggle: j,
        children: e.jsx(A, { dossier: s }),
      }),
      e.jsx(p, {
        title: t('sections.topic.relatedDossiers'),
        description: t('sections.topic.relatedDossiersDescription'),
        isOpen: a,
        onToggle: n,
        children: e.jsx(I, { dossierId: s.id }),
      }),
      e.jsx(p, {
        title: t('sections.topic.keyDocuments'),
        description: t('sections.topic.keyDocumentsDescription'),
        isOpen: h,
        onToggle: w,
        children: e.jsx(S, { dossierId: s.id }),
      }),
      e.jsx(p, {
        title: t('sections.topic.subtopics'),
        description: t('sections.topic.subtopicsDescription'),
        isOpen: D,
        onToggle: T,
        children: e.jsx(B, { dossierId: s.id }),
      }),
    ],
  })
}
function H({ dossier: s }) {
  return e.jsx($, { dossier: s, gridClassName: 'grid-cols-1', children: e.jsx(F, { dossier: s }) })
}
function ee() {
  const { t: s, i18n: t } = c('dossier'),
    r = t.language === 'ar',
    { id: o } = k.useParams(),
    { data: i, isLoading: j, error: a } = O(o, ['stats', 'owners', 'contacts'])
  if (j)
    return e.jsxs('div', {
      className: 'flex flex-col items-center justify-center min-h-[50vh] space-y-4',
      dir: r ? 'rtl' : 'ltr',
      children: [
        e.jsx('div', {
          className:
            'h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent',
        }),
        e.jsx('p', {
          className: 'text-sm sm:text-base text-muted-foreground',
          children: s('detail.loading'),
        }),
      ],
    })
  if (a)
    return e.jsxs('div', {
      className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
      dir: r ? 'rtl' : 'ltr',
      children: [
        e.jsxs(g, {
          variant: 'destructive',
          children: [
            e.jsx(v, { className: 'h-4 w-4' }),
            e.jsx(f, { children: s('detail.error') }),
            e.jsx(N, { children: a instanceof Error ? a.message : s('detail.errorGeneric') }),
          ],
        }),
        e.jsx('div', {
          className: 'mt-4 sm:mt-6',
          children: e.jsx(l, {
            to: '/dossiers',
            children: e.jsxs(d, {
              variant: 'outline',
              className: 'gap-2',
              children: [
                e.jsx(y, { className: `h-4 w-4 ${r ? 'rotate-180' : ''}` }),
                s('action.backToHub'),
              ],
            }),
          }),
        }),
      ],
    })
  if (!i)
    return e.jsxs('div', {
      className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
      dir: r ? 'rtl' : 'ltr',
      children: [
        e.jsxs(g, {
          children: [
            e.jsx(v, { className: 'h-4 w-4' }),
            e.jsx(f, { children: s('detail.notFound') }),
            e.jsx(N, { children: s('detail.errorGeneric') }),
          ],
        }),
        e.jsx('div', {
          className: 'mt-4 sm:mt-6',
          children: e.jsx(l, {
            to: '/dossiers',
            children: e.jsxs(d, {
              variant: 'outline',
              className: 'gap-2',
              children: [
                e.jsx(y, { className: `h-4 w-4 ${r ? 'rotate-180' : ''}` }),
                s('action.backToHub'),
              ],
            }),
          }),
        }),
      ],
    })
  if (!_(i)) {
    const n = s(`type.${i.dossier_type}`),
      h = s('type.topic')
    return e.jsxs('div', {
      className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
      dir: r ? 'rtl' : 'ltr',
      children: [
        e.jsxs(g, {
          children: [
            e.jsx(v, { className: 'h-4 w-4' }),
            e.jsx(f, { children: s('detail.wrongType') }),
            e.jsx(N, {
              children: s('detail.wrongTypeDescription', { actualType: n, expectedType: h }),
            }),
          ],
        }),
        e.jsxs('div', {
          className: 'mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3',
          children: [
            e.jsx(l, {
              to: `/dossiers/${i.dossier_type}s/$id`,
              params: { id: i.id },
              children: e.jsx(d, {
                className: 'gap-2 w-full sm:w-auto',
                children: s('action.viewCorrectType', { type: n }),
              }),
            }),
            e.jsx(l, {
              to: '/dossiers/topics',
              children: e.jsxs(d, {
                variant: 'outline',
                className: 'gap-2 w-full sm:w-auto',
                children: [
                  e.jsx(y, { className: `h-4 w-4 ${r ? 'rotate-180' : ''}` }),
                  s('action.backToList'),
                ],
              }),
            }),
          ],
        }),
      ],
    })
  }
  return e.jsx(H, { dossier: i })
}
export { ee as component }
//# sourceMappingURL=_id-DjFkdvYn.js.map
