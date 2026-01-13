import { u as c, j as e } from './react-vendor-Buoak6m3.js'
import {
  aJ as u,
  bH as p,
  bd as N,
  b_ as b,
  bi as v,
  b3 as y,
  aH as h,
  aR as w,
} from './vendor-misc-BiJvMP0A.js'
import { c as f } from './index-qYY0KoZ1.js'
function C({ dossier: t, isWorkingGroup: o = !1 }) {
  const { t: x, i18n: n } = c('dossier'),
    a = n.language === 'ar',
    r =
      t.type === 'forum'
        ? t.extension.member_organizations || []
        : t.type === 'working_group'
          ? t.extension.members || []
          : []
  return r.length === 0
    ? e.jsxs('div', {
        className: 'flex flex-col items-center justify-center py-8 sm:py-12 text-center',
        dir: a ? 'rtl' : 'ltr',
        children: [
          e.jsx('div', {
            className: 'rounded-full bg-muted p-4 sm:p-6 mb-4',
            children: e.jsx(u, { className: 'h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground' }),
          }),
          e.jsx('h3', {
            className: 'text-sm sm:text-base font-medium text-muted-foreground mb-2',
            children: 'No Member Organizations',
          }),
          e.jsx('p', {
            className: 'text-xs sm:text-sm text-muted-foreground max-w-md',
            children:
              'Member organizations will appear here. Integration with organization dossiers pending.',
          }),
        ],
      })
    : e.jsx('div', {
        className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4',
        dir: a ? 'rtl' : 'ltr',
        children: r.map((s, l) => {
          const i = typeof s == 'string' ? s : s.dossier_id,
            m = typeof s == 'object' && 'role' in s ? s.role : void 0
          return e.jsx(
            'div',
            {
              className: 'p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors',
              children: e.jsxs('div', {
                className: 'flex items-start gap-3',
                children: [
                  e.jsx(u, { className: 'h-10 w-10 text-muted-foreground shrink-0' }),
                  e.jsxs('div', {
                    className: 'flex-1 min-w-0',
                    children: [
                      e.jsxs('h4', {
                        className: 'text-sm font-medium mb-1 truncate',
                        children: ['Organization ', l + 1],
                      }),
                      e.jsxs('p', {
                        className: 'text-xs text-muted-foreground truncate',
                        children: ['ID: ', i],
                      }),
                      m &&
                        e.jsx('div', {
                          className:
                            'mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5',
                          children: e.jsx('span', {
                            className: 'text-xs font-medium text-primary capitalize',
                            children: m,
                          }),
                        }),
                    ],
                  }),
                ],
              }),
            },
            i || l,
          )
        }),
      })
}
function L({ dossier: t, isWorkingGroup: o = !1 }) {
  const { t: x, i18n: n } = c('dossier'),
    a = n.language === 'ar',
    r = t.type === 'forum' ? t.extension.next_meeting_date : void 0,
    s = []
  return e.jsxs('div', {
    className: 'space-y-4',
    dir: a ? 'rtl' : 'ltr',
    children: [
      r &&
        e.jsx('div', {
          className: 'p-4 rounded-lg bg-primary/10 border border-primary/20',
          children: e.jsxs('div', {
            className: 'flex items-start gap-3',
            children: [
              e.jsx(p, { className: 'h-5 w-5 text-primary shrink-0 mt-0.5' }),
              e.jsxs('div', {
                className: 'flex-1',
                children: [
                  e.jsx('h4', {
                    className: 'text-sm font-medium text-primary mb-1',
                    children: 'Next Meeting',
                  }),
                  e.jsx('p', {
                    className: 'text-xs text-muted-foreground',
                    children: new Date(r).toLocaleDateString(n.language, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }),
                  }),
                ],
              }),
            ],
          }),
        }),
      t.type === 'forum' &&
        t.extension.meeting_frequency &&
        e.jsx('div', {
          className: 'p-4 rounded-lg bg-muted/30',
          children: e.jsxs('div', {
            className: 'flex items-start gap-3',
            children: [
              e.jsx(N, { className: 'h-5 w-5 text-muted-foreground shrink-0 mt-0.5' }),
              e.jsxs('div', {
                className: 'flex-1',
                children: [
                  e.jsx('h4', {
                    className: 'text-sm font-medium mb-1',
                    children: 'Meeting Frequency',
                  }),
                  e.jsx('p', {
                    className: 'text-xs text-muted-foreground',
                    children: t.extension.meeting_frequency,
                  }),
                ],
              }),
            ],
          }),
        }),
      s.length === 0 &&
        e.jsxs('div', {
          className: 'text-center py-6 sm:py-8',
          children: [
            e.jsx(p, { className: 'h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mx-auto mb-3' }),
            e.jsx('p', {
              className: 'text-xs sm:text-sm text-muted-foreground',
              children: 'Calendar integration pending. Meetings will appear here.',
            }),
          ],
        }),
    ],
  })
}
function M({ dossier: t, isWorkingGroup: o = !1 }) {
  const { t: x, i18n: n } = c('dossier'),
    a = n.language === 'ar',
    r = t.type === 'forum' ? t.extension.deliverables || [] : []
  if (r.length === 0)
    return e.jsxs('div', {
      className: 'flex flex-col items-center justify-center py-8 sm:py-12 text-center',
      dir: a ? 'rtl' : 'ltr',
      children: [
        e.jsx('div', {
          className: 'rounded-full bg-muted p-4 sm:p-6 mb-4',
          children: e.jsx(b, { className: 'h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground' }),
        }),
        e.jsx('h3', {
          className: 'text-sm sm:text-base font-medium text-muted-foreground mb-2',
          children: 'No Deliverables Tracked',
        }),
        e.jsx('p', {
          className: 'text-xs sm:text-sm text-muted-foreground max-w-md',
          children: 'Deliverables and milestones will appear here as they are defined.',
        }),
      ],
    })
  const s = {
    pending: { icon: y, label: 'Pending', className: 'text-muted-foreground bg-muted/30' },
    in_progress: { icon: N, label: 'In Progress', className: 'text-warning bg-warning/10' },
    completed: { icon: v, label: 'Completed', className: 'text-success bg-success/10' },
  }
  return e.jsx('div', {
    className: 'grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6',
    dir: a ? 'rtl' : 'ltr',
    children: ['pending', 'in_progress', 'completed'].map((l) => {
      const i = s[l],
        m = i.icon,
        g = r.filter((d) => d.status === l)
      return e.jsxs(
        'div',
        {
          className: 'space-y-3',
          children: [
            e.jsxs('div', {
              className: 'flex items-center gap-2 pb-2 border-b',
              children: [
                e.jsx(m, { className: f('h-4 w-4', i.className.split(' ')[0]) }),
                e.jsx('h4', { className: 'text-sm font-medium', children: i.label }),
                e.jsx('span', {
                  className: 'ms-auto text-xs text-muted-foreground',
                  children: g.length,
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'space-y-2',
              children: [
                g.map((d, j) =>
                  e.jsxs(
                    'div',
                    {
                      className: f(
                        'p-3 rounded-lg border',
                        i.className.split(' ').slice(1).join(' '),
                      ),
                      children: [
                        e.jsx('h5', { className: 'text-sm font-medium mb-1', children: d.name }),
                        e.jsxs('p', {
                          className: 'text-xs text-muted-foreground',
                          children: ['Due: ', new Date(d.due_date).toLocaleDateString(n.language)],
                        }),
                      ],
                    },
                    j,
                  ),
                ),
                g.length === 0 &&
                  e.jsxs('div', {
                    className: 'text-center py-4 text-xs text-muted-foreground',
                    children: ['No ', i.label.toLowerCase(), ' items'],
                  }),
              ],
            }),
          ],
        },
        l,
      )
    }),
  })
}
function T({ dossier: t, isWorkingGroup: o = !1 }) {
  const { t: x, i18n: n } = c('dossier'),
    a = n.language === 'ar',
    r = []
  return r.length === 0
    ? e.jsxs('div', {
        className: 'flex flex-col items-center justify-center py-8 sm:py-12 text-center',
        dir: a ? 'rtl' : 'ltr',
        children: [
          e.jsx('div', {
            className: 'rounded-full bg-muted p-4 sm:p-6 mb-4',
            children: e.jsx(h, { className: 'h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground' }),
          }),
          e.jsx('h3', {
            className: 'text-sm sm:text-base font-medium text-muted-foreground mb-2',
            children: 'No Decision Logs',
          }),
          e.jsx('p', {
            className: 'text-xs sm:text-sm text-muted-foreground max-w-md',
            children:
              'Formal decisions and resolutions from meetings will appear here. Engagement dossiers integration pending.',
          }),
        ],
      })
    : e.jsx('div', {
        className: 'space-y-3',
        dir: a ? 'rtl' : 'ltr',
        children: r.map((s) =>
          e.jsx(
            'div',
            {
              className: 'p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors',
              children: e.jsxs('div', {
                className: 'flex items-start gap-3',
                children: [
                  e.jsx(h, { className: 'h-5 w-5 text-muted-foreground shrink-0 mt-0.5' }),
                  e.jsxs('div', {
                    className: 'flex-1 min-w-0',
                    children: [
                      e.jsx('h4', { className: 'text-sm font-medium mb-2', children: s.title }),
                      e.jsx('p', {
                        className: 'text-xs text-muted-foreground mb-2',
                        children: s.description,
                      }),
                      e.jsxs('div', {
                        className: 'flex items-center gap-2 text-xs text-muted-foreground',
                        children: [
                          e.jsx(w, { className: 'h-3 w-3' }),
                          e.jsx('span', { children: s.date }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            },
            s.id,
          ),
        ),
      })
}
export { M as D, C as M, L as a, T as b }
//# sourceMappingURL=DecisionLogs-DwclOktp.js.map
