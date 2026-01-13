import { u as m, j as e } from './react-vendor-Buoak6m3.js'
import { f as x } from './useDossier-CiPcwRKl.js'
import { D as p } from './DossierDetailLayout-BuE-52qO.js'
import { u, C as o } from './CollapsibleSection-Bj_Tk5Ee.js'
import { M as g, a as h, D as j, b } from './DecisionLogs-DwclOktp.js'
import { b9 as f, B as l } from './index-qYY0KoZ1.js'
import { L as c } from './tanstack-vendor-BZC-rs5U.js'
import { aS as v, bw as N } from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function y({ dossier: i }) {
  const { t: s, i18n: n } = m('dossier'),
    a = n.language === 'ar',
    [r, t] = u(i.id, 'forum', {
      memberOrganizations: !0,
      meetingSchedule: !0,
      deliverablesTracker: !0,
      decisionLogs: !0,
    })
  return e.jsxs('div', {
    className: 'space-y-5',
    dir: a ? 'rtl' : 'ltr',
    children: [
      e.jsx('div', {
        className: 'lg:col-span-2',
        children: e.jsx(o, {
          id: 'memberOrganizations',
          title: s('sections.forum.memberOrganizations'),
          description: s('sections.forum.memberOrganizationsDescription'),
          isExpanded: r.memberOrganizations,
          onToggle: () => t('memberOrganizations'),
          children: e.jsx(g, { dossier: i }),
        }),
      }),
      e.jsx('div', {
        className: 'lg:col-span-1',
        children: e.jsx(o, {
          id: 'meetingSchedule',
          title: s('sections.forum.meetingSchedule'),
          description: s('sections.forum.meetingScheduleDescription'),
          isExpanded: r.meetingSchedule,
          onToggle: () => t('meetingSchedule'),
          children: e.jsx(h, { dossier: i }),
        }),
      }),
      e.jsx('div', {
        className: 'lg:col-span-3',
        children: e.jsx(o, {
          id: 'deliverablesTracker',
          title: s('sections.forum.deliverablesTracker'),
          description: s('sections.forum.deliverablesTrackerDescription'),
          isExpanded: r.deliverablesTracker,
          onToggle: () => t('deliverablesTracker'),
          children: e.jsx(j, { dossier: i }),
        }),
      }),
      e.jsx('div', {
        className: 'lg:col-span-3',
        children: e.jsx(o, {
          id: 'decisionLogs',
          title: s('sections.forum.decisionLogs'),
          description: s('sections.forum.decisionLogsDescription'),
          isExpanded: r.decisionLogs,
          onToggle: () => t('decisionLogs'),
          children: e.jsx(b, { dossier: i }),
        }),
      }),
    ],
  })
}
function T({ dossier: i }) {
  return e.jsx(p, {
    dossier: i,
    gridClassName: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    children: e.jsx(y, { dossier: i }),
  })
}
function H() {
  const { id: i } = f.useParams(),
    { t: s, i18n: n } = m('dossier'),
    a = n.language === 'ar',
    { data: r, isLoading: t, error: d } = x(i, 'forum')
  return t
    ? e.jsx('div', {
        className: 'flex min-h-[50vh] items-center justify-center',
        dir: a ? 'rtl' : 'ltr',
        children: e.jsxs('div', {
          className: 'flex flex-col items-center gap-3',
          children: [
            e.jsx(v, { className: 'h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary' }),
            e.jsx('p', {
              className: 'text-sm sm:text-base text-muted-foreground',
              children: s('detail.loading'),
            }),
          ],
        }),
      })
    : d || !r
      ? e.jsx('div', {
          className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12',
          dir: a ? 'rtl' : 'ltr',
          children: e.jsx('div', {
            className: 'max-w-2xl mx-auto',
            children: e.jsx('div', {
              className: 'rounded-lg border border-destructive/20 bg-destructive/10 p-6 sm:p-8',
              children: e.jsxs('div', {
                className: 'flex items-start gap-4',
                children: [
                  e.jsx(N, { className: 'h-5 w-5 sm:h-6 sm:w-6 text-destructive shrink-0 mt-1' }),
                  e.jsxs('div', {
                    className: 'flex-1',
                    children: [
                      e.jsx('h2', {
                        className: 'text-lg sm:text-xl font-semibold text-destructive mb-2',
                        children: s('detail.error'),
                      }),
                      e.jsx('p', {
                        className: 'text-sm sm:text-base text-destructive/90 mb-4',
                        children: d?.message || s('detail.errorGeneric'),
                      }),
                      e.jsx(l, {
                        asChild: !0,
                        variant: 'outline',
                        children: e.jsx(c, { to: '/dossiers', children: s('action.backToHub') }),
                      }),
                    ],
                  }),
                ],
              }),
            }),
          }),
        })
      : r.type !== 'forum'
        ? e.jsx('div', {
            className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12',
            dir: a ? 'rtl' : 'ltr',
            children: e.jsx('div', {
              className: 'max-w-2xl mx-auto',
              children: e.jsxs('div', {
                className: 'rounded-lg border border-warning/20 bg-warning/10 p-6 sm:p-8',
                children: [
                  e.jsx('h2', {
                    className: 'text-lg sm:text-xl font-semibold mb-2',
                    children: s('detail.wrongType'),
                  }),
                  e.jsx('p', {
                    className: 'text-sm sm:text-base text-muted-foreground mb-4',
                    children: s('detail.wrongTypeDescription', {
                      actualType: s(`type.${r.type}`),
                      expectedType: s('type.forum'),
                    }),
                  }),
                  e.jsxs('div', {
                    className: 'flex gap-3',
                    children: [
                      e.jsx(l, {
                        asChild: !0,
                        children: e.jsx(c, {
                          to: `/dossiers/${r.type}s/${i}`,
                          children: s('action.viewCorrectType', { type: s(`type.${r.type}`) }),
                        }),
                      }),
                      e.jsx(l, {
                        asChild: !0,
                        variant: 'outline',
                        children: e.jsx(c, { to: '/dossiers', children: s('action.backToHub') }),
                      }),
                    ],
                  }),
                ],
              }),
            }),
          })
        : e.jsx(T, { dossier: r })
}
export { H as component }
//# sourceMappingURL=_id-DXTnTe4P.js.map
