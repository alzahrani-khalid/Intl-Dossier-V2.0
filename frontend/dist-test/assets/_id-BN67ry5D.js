import { u as c, j as s } from './react-vendor-Buoak6m3.js'
import { L as p } from './tanstack-vendor-BZC-rs5U.js'
import { b7 as P, af as h, al as u, ag as j, B as x } from './index-qYY0KoZ1.js'
import { a as O } from './useDossier-CiPcwRKl.js'
import { a as H } from './dossier-type-guards-DQ1YbbnG.js'
import { D as A } from './DossierDetailLayout-BuE-52qO.js'
import { a as m, C as d } from './CollapsibleSection-Bj_Tk5Ee.js'
import { bC as b, aJ as L, bn as _, bw as g, aX as y } from './vendor-misc-BiJvMP0A.js'
import { P as $ } from './PersonTimeline-BZvpoWic.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
import './useUnifiedTimeline-2-SmgReu.js'
import './avatar-lQOCSoMx.js'
import './use-outside-click-DyRG7K6b.js'
function E({ dossier: e }) {
  const { t, i18n: i } = c('dossier'),
    r = i.language === 'ar',
    n = e.extension,
    l = r ? n.title_ar : n.title_en,
    o = r ? n.biography_ar : n.biography_en,
    a = n.photo_url
  return s.jsxs('div', {
    className: 'space-y-4 sm:space-y-6',
    dir: r ? 'rtl' : 'ltr',
    children: [
      a &&
        s.jsx('div', {
          className: 'flex justify-center',
          children: s.jsx('img', {
            src: a,
            alt: r ? e.name_ar : e.name_en,
            className:
              'h-32 w-32 sm:h-40 sm:w-40 rounded-full object-cover border-4 border-primary/10',
          }),
        }),
      l &&
        s.jsx('div', {
          className: 'p-3 sm:p-4 rounded-lg border bg-card',
          children: s.jsxs('div', {
            className: 'flex items-start gap-3',
            children: [
              s.jsx(b, { className: 'h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5' }),
              s.jsxs('div', {
                children: [
                  s.jsx('p', {
                    className: 'text-xs sm:text-sm font-medium text-muted-foreground',
                    children: t('form.person.titleEn'),
                  }),
                  s.jsx('p', { className: 'text-sm sm:text-base font-semibold', children: l }),
                ],
              }),
            ],
          }),
        }),
      o &&
        s.jsxs('div', {
          className: 'p-3 sm:p-4 rounded-lg border bg-card',
          children: [
            s.jsx('h4', {
              className: 'text-sm sm:text-base font-semibold mb-2',
              children: t('form.person.biographyEn'),
            }),
            s.jsx('p', {
              className: 'text-sm sm:text-base text-muted-foreground whitespace-pre-wrap',
              children: o,
            }),
          ],
        }),
    ],
  })
}
function I({ dossierId: e }) {
  const { t, i18n: i } = c('dossier'),
    r = i.language === 'ar'
  return s.jsxs('div', {
    className: 'flex flex-col items-center justify-center py-8 sm:py-12 text-center',
    dir: r ? 'rtl' : 'ltr',
    children: [
      s.jsx('div', {
        className: 'mb-4 sm:mb-6',
        children: s.jsx('div', {
          className:
            'h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center',
          children: s.jsx(b, { className: 'h-8 w-8 sm:h-10 sm:w-10 text-primary' }),
        }),
      }),
      s.jsx('h3', {
        className: 'text-base sm:text-lg font-semibold text-foreground mb-2',
        children: t('sections.person.positionsHeldEmpty'),
      }),
      s.jsx('p', {
        className: 'text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4',
        children: t('sections.person.positionsHeldEmptyDescription'),
      }),
      s.jsx('div', {
        className: 'text-xs sm:text-sm text-muted-foreground px-4',
        children: s.jsx('p', { children: t('sections.person.positionsHeldPlaceholder') }),
      }),
    ],
  })
}
function R({ dossierId: e }) {
  const { t, i18n: i } = c('dossier'),
    r = i.language === 'ar'
  return s.jsxs('div', {
    className: 'flex flex-col items-center justify-center py-8 sm:py-12 text-center',
    dir: r ? 'rtl' : 'ltr',
    children: [
      s.jsx('div', {
        className: 'mb-4 sm:mb-6',
        children: s.jsx('div', {
          className:
            'h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center',
          children: s.jsx(L, { className: 'h-8 w-8 sm:h-10 sm:w-10 text-primary' }),
        }),
      }),
      s.jsx('h3', {
        className: 'text-base sm:text-lg font-semibold text-foreground mb-2',
        children: t('sections.person.organizationAffiliationsEmpty'),
      }),
      s.jsx('p', {
        className: 'text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4',
        children: t('sections.person.organizationAffiliationsEmptyDescription'),
      }),
      s.jsx('div', {
        className: 'text-xs sm:text-sm text-muted-foreground px-4',
        children: s.jsx('p', {
          children: t('sections.person.organizationAffiliationsPlaceholder'),
        }),
      }),
    ],
  })
}
function z({ dossierId: e }) {
  const { t, i18n: i } = c('dossier'),
    r = i.language === 'ar'
  return s.jsxs('div', {
    className: 'flex flex-col items-center justify-center py-8 sm:py-12 text-center',
    dir: r ? 'rtl' : 'ltr',
    children: [
      s.jsx('div', {
        className: 'mb-4 sm:mb-6',
        children: s.jsx('div', {
          className:
            'h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center',
          children: s.jsx(_, { className: 'h-8 w-8 sm:h-10 sm:w-10 text-primary' }),
        }),
      }),
      s.jsx('h3', {
        className: 'text-base sm:text-lg font-semibold text-foreground mb-2',
        children: t('sections.person.interactionHistoryEmpty'),
      }),
      s.jsx('p', {
        className: 'text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4',
        children: t('sections.person.interactionHistoryEmptyDescription'),
      }),
      s.jsx('div', {
        className: 'text-xs sm:text-sm text-muted-foreground px-4',
        children: s.jsx('p', { children: t('sections.person.interactionHistoryPlaceholder') }),
      }),
    ],
  })
}
function C({ dossier: e }) {
  const { t, i18n: i } = c('dossier'),
    r = i.language === 'ar',
    [n, l] = m(`person-${e.id}-profile-open`, !0),
    [o, a] = m(`person-${e.id}-positions-open`, !0),
    [f, N] = m(`person-${e.id}-affiliations-open`, !0),
    [w, v] = m(`person-${e.id}-interactions-open`, !0),
    [T, D] = m(`person-${e.id}-timeline-open`, !0)
  return s.jsxs('div', {
    className: 'grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 sm:gap-6 lg:gap-8',
    dir: r ? 'rtl' : 'ltr',
    children: [
      s.jsx('div', {
        className: 'space-y-4 sm:space-y-6',
        children: s.jsx(d, {
          title: t('sections.person.professionalProfile'),
          description: t('sections.person.professionalProfileDescription'),
          isOpen: n,
          onToggle: l,
          children: s.jsx(E, { dossier: e }),
        }),
      }),
      s.jsxs('div', {
        className: 'space-y-4 sm:space-y-6',
        children: [
          s.jsx(d, {
            title: t('sections.person.positionsHeld'),
            description: t('sections.person.positionsHeldDescription'),
            isOpen: o,
            onToggle: a,
            children: s.jsx(I, { dossierId: e.id }),
          }),
          s.jsx(d, {
            title: t('sections.person.organizationAffiliations'),
            description: t('sections.person.organizationAffiliationsDescription'),
            isOpen: f,
            onToggle: N,
            children: s.jsx(R, { dossierId: e.id }),
          }),
          s.jsx(d, {
            title: t('sections.person.interactionHistory'),
            description: t('sections.person.interactionHistoryDescription'),
            isOpen: w,
            onToggle: v,
            children: s.jsx(z, { dossierId: e.id }),
          }),
          s.jsx(d, {
            title: t('timeline.title'),
            description: t('sections.shared.timelineDescription'),
            isOpen: T,
            onToggle: D,
            children: s.jsx($, { dossierId: e.id }),
          }),
        ],
      }),
    ],
  })
}
function k({ dossier: e }) {
  return s.jsx(A, {
    dossier: e,
    gridClassName: 'lg:grid-cols-[1fr_2fr]',
    children: s.jsx(C, { dossier: e }),
  })
}
function is() {
  const { t: e, i18n: t } = c('dossier'),
    i = t.language === 'ar',
    { id: r } = P.useParams(),
    { data: n, isLoading: l, error: o } = O(r, ['stats', 'owners', 'contacts'])
  if (l)
    return s.jsxs('div', {
      className: 'flex flex-col items-center justify-center min-h-[50vh] space-y-4',
      dir: i ? 'rtl' : 'ltr',
      children: [
        s.jsx('div', {
          className:
            'h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent',
        }),
        s.jsx('p', {
          className: 'text-sm sm:text-base text-muted-foreground',
          children: e('detail.loading'),
        }),
      ],
    })
  if (o)
    return s.jsxs('div', {
      className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
      dir: i ? 'rtl' : 'ltr',
      children: [
        s.jsxs(h, {
          variant: 'destructive',
          children: [
            s.jsx(g, { className: 'h-4 w-4' }),
            s.jsx(u, { children: e('detail.error') }),
            s.jsx(j, { children: o instanceof Error ? o.message : e('detail.errorGeneric') }),
          ],
        }),
        s.jsx('div', {
          className: 'mt-4 sm:mt-6',
          children: s.jsx(p, {
            to: '/dossiers',
            children: s.jsxs(x, {
              variant: 'outline',
              className: 'gap-2',
              children: [
                s.jsx(y, { className: `h-4 w-4 ${i ? 'rotate-180' : ''}` }),
                e('action.backToHub'),
              ],
            }),
          }),
        }),
      ],
    })
  if (!n)
    return s.jsxs('div', {
      className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
      dir: i ? 'rtl' : 'ltr',
      children: [
        s.jsxs(h, {
          children: [
            s.jsx(g, { className: 'h-4 w-4' }),
            s.jsx(u, { children: e('detail.notFound') }),
            s.jsx(j, { children: e('detail.errorGeneric') }),
          ],
        }),
        s.jsx('div', {
          className: 'mt-4 sm:mt-6',
          children: s.jsx(p, {
            to: '/dossiers',
            children: s.jsxs(x, {
              variant: 'outline',
              className: 'gap-2',
              children: [
                s.jsx(y, { className: `h-4 w-4 ${i ? 'rotate-180' : ''}` }),
                e('action.backToHub'),
              ],
            }),
          }),
        }),
      ],
    })
  if (!H(n)) {
    const a = e(`type.${n.dossier_type}`),
      f = e('type.person')
    return s.jsxs('div', {
      className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
      dir: i ? 'rtl' : 'ltr',
      children: [
        s.jsxs(h, {
          children: [
            s.jsx(g, { className: 'h-4 w-4' }),
            s.jsx(u, { children: e('detail.wrongType') }),
            s.jsx(j, {
              children: e('detail.wrongTypeDescription', { actualType: a, expectedType: f }),
            }),
          ],
        }),
        s.jsxs('div', {
          className: 'mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3',
          children: [
            s.jsx(p, {
              to: `/dossiers/${n.dossier_type}s/$id`,
              params: { id: n.id },
              children: s.jsx(x, {
                className: 'gap-2 w-full sm:w-auto',
                children: e('action.viewCorrectType', { type: a }),
              }),
            }),
            s.jsx(p, {
              to: '/dossiers/persons',
              children: s.jsxs(x, {
                variant: 'outline',
                className: 'gap-2 w-full sm:w-auto',
                children: [
                  s.jsx(y, { className: `h-4 w-4 ${i ? 'rotate-180' : ''}` }),
                  e('action.backToList'),
                ],
              }),
            }),
          ],
        }),
      ],
    })
  }
  return s.jsx(k, { dossier: n })
}
export { is as component }
//# sourceMappingURL=_id-BN67ry5D.js.map
