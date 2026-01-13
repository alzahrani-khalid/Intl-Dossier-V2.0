import { u as m, j as e } from './react-vendor-Buoak6m3.js'
import { f as p } from './useDossier-CiPcwRKl.js'
import { D as g } from './DossierDetailLayout-BuE-52qO.js'
import { u as x, C as n } from './CollapsibleSection-Bj_Tk5Ee.js'
import { M as u, a as h, D as j, b } from './DecisionLogs-DwclOktp.js'
import { b5 as v, B as l } from './index-qYY0KoZ1.js'
import { L as c } from './tanstack-vendor-BZC-rs5U.js'
import { aS as k, bw as f } from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function w({ dossier: i }) {
  const { t: s, i18n: a } = m('dossier'),
    o = a.language === 'ar',
    [r, t] = x(i.id, 'working_group', {
      memberOrganizations: !0,
      meetingSchedule: !0,
      deliverablesTracker: !0,
      decisionLogs: !0,
    })
  return e.jsxs('div', {
    className: 'space-y-5',
    dir: o ? 'rtl' : 'ltr',
    children: [
      e.jsx('div', {
        className: 'lg:col-span-2',
        children: e.jsx(n, {
          id: 'memberOrganizations',
          title: s('sections.workingGroup.memberOrganizations'),
          description: s('sections.workingGroup.memberOrganizationsDescription'),
          isExpanded: r.memberOrganizations,
          onToggle: () => t('memberOrganizations'),
          children: e.jsx(u, { dossier: i, isWorkingGroup: !0 }),
        }),
      }),
      e.jsx('div', {
        className: 'lg:col-span-1',
        children: e.jsx(n, {
          id: 'meetingSchedule',
          title: s('sections.workingGroup.meetingSchedule'),
          description: s('sections.workingGroup.meetingScheduleDescription'),
          isExpanded: r.meetingSchedule,
          onToggle: () => t('meetingSchedule'),
          children: e.jsx(h, { dossier: i, isWorkingGroup: !0 }),
        }),
      }),
      e.jsx('div', {
        className: 'lg:col-span-3',
        children: e.jsx(n, {
          id: 'deliverablesTracker',
          title: s('sections.workingGroup.deliverablesTracker'),
          description: s('sections.workingGroup.deliverablesTrackerDescription'),
          isExpanded: r.deliverablesTracker,
          onToggle: () => t('deliverablesTracker'),
          children: e.jsx(j, { dossier: i, isWorkingGroup: !0 }),
        }),
      }),
      e.jsx('div', {
        className: 'lg:col-span-3',
        children: e.jsx(n, {
          id: 'decisionLogs',
          title: s('sections.workingGroup.decisionLogs'),
          description: s('sections.workingGroup.decisionLogsDescription'),
          isExpanded: r.decisionLogs,
          onToggle: () => t('decisionLogs'),
          children: e.jsx(b, { dossier: i, isWorkingGroup: !0 }),
        }),
      }),
    ],
  })
}
function N({ dossier: i }) {
  return e.jsx(g, {
    dossier: i,
    gridClassName: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    children: e.jsx(w, { dossier: i }),
  })
}
function M() {
  const { id: i } = v.useParams(),
    { t: s, i18n: a } = m('dossier'),
    o = a.language === 'ar',
    { data: r, isLoading: t, error: d } = p(i, 'working_group')
  return t
    ? e.jsx('div', {
        className: 'flex min-h-[50vh] items-center justify-center',
        dir: o ? 'rtl' : 'ltr',
        children: e.jsxs('div', {
          className: 'flex flex-col items-center gap-3',
          children: [
            e.jsx(k, { className: 'h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary' }),
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
          dir: o ? 'rtl' : 'ltr',
          children: e.jsx('div', {
            className: 'max-w-2xl mx-auto',
            children: e.jsx('div', {
              className: 'rounded-lg border border-destructive/20 bg-destructive/10 p-6 sm:p-8',
              children: e.jsxs('div', {
                className: 'flex items-start gap-4',
                children: [
                  e.jsx(f, { className: 'h-5 w-5 sm:h-6 sm:w-6 text-destructive shrink-0 mt-1' }),
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
      : r.type !== 'working_group'
        ? e.jsx('div', {
            className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12',
            dir: o ? 'rtl' : 'ltr',
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
                      expectedType: s('type.working_group'),
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
        : e.jsx(N, { dossier: r })
}
export { M as component }
//# sourceMappingURL=_id-DCphLvlZ.js.map
