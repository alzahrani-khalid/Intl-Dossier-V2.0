import { u as C, r as h, j as e } from './react-vendor-Buoak6m3.js'
import { c as W, d as xe, a as ie } from './tanstack-vendor-BZC-rs5U.js'
import {
  aS as he,
  bi as ve,
  c7 as Ne,
  aD as pe,
  bG as ke,
  dD as ye,
  aT as _e,
  aU as Qe,
  cV as ue,
  b7 as Se,
  bd as Z,
  cC as Ce,
  aA as me,
  dF as ee,
  bk as Ae,
  bz as Te,
} from './vendor-misc-BiJvMP0A.js'
import {
  s as T,
  B as z,
  ab as fe,
  C as I,
  J as H,
  ah as Fe,
  ai as ze,
  aj as Ie,
  p as Ee,
  a2 as se,
  q as Re,
  r as De,
  t as qe,
  v as Pe,
  w as L,
  Z as $e,
  _ as Be,
  $ as D,
  aa as Le,
  aZ as Oe,
  j as te,
  m as O,
} from './index-qYY0KoZ1.js'
import { A as Me, a as M, b as U, c as K } from './accordion-DiUjAmkv.js'
import { Q as Ue } from './QueryErrorBoundary-C6TJE_Qg.js'
import './date-vendor-s0MkYge4.js'
import './visualization-vendor-f5uYUx4I.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
function Ke() {
  const s = W()
  return xe({
    mutationFn: async ({ assignmentId: r }) => {
      const t = 'https://zkrcjzdemdmwhearhfgg.supabase.co',
        {
          data: { session: i },
        } = await T.auth.getSession()
      if (!i?.access_token) throw new Error('Unauthorized: No active session')
      const c = await fetch(`${t}/functions/v1/waiting-queue-reminder/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${i.access_token}` },
        body: JSON.stringify({ assignment_id: r }),
      })
      if (!c.ok) throw await c.json()
      return c.json()
    },
    onMutate: async ({ assignmentId: r }) => {
      await s.cancelQueries({ queryKey: ['assignment', r] })
      const t = s.getQueryData(['assignment', r])
      return (
        s.setQueryData(
          ['assignment', r],
          (i) => i && { ...i, last_reminder_sent_at: new Date().toISOString() },
        ),
        { previousAssignment: t }
      )
    },
    onSuccess: (r, t) => {
      ;(s.invalidateQueries({ queryKey: ['assignment', t.assignmentId] }),
        s.invalidateQueries({ queryKey: ['assignments'] }),
        s.invalidateQueries({ queryKey: ['waiting-queue'] }))
    },
    onError: (r, t, i) => {
      ;(i?.previousAssignment &&
        s.setQueryData(['assignment', t.assignmentId], i.previousAssignment),
        console.error('Failed to send reminder:', r.message, r.details))
    },
  })
}
function Je() {
  const s = W()
  return {
    sendBulk: xe({
      mutationFn: async ({ assignmentIds: t }) => {
        if (t.length === 0) throw new Error('No assignments selected')
        if (t.length > 100)
          throw new Error('Maximum 100 assignments can be selected for bulk action')
        const i = 'https://zkrcjzdemdmwhearhfgg.supabase.co',
          {
            data: { session: c },
          } = await T.auth.getSession()
        if (!c?.access_token) throw new Error('Unauthorized: No active session')
        const d = await fetch(`${i}/functions/v1/waiting-queue-reminder/send-bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${c.access_token}`,
          },
          body: JSON.stringify({ assignment_ids: t }),
        })
        if (!d.ok) throw await d.json()
        return d.json()
      },
      onSuccess: () => {
        s.invalidateQueries({ queryKey: ['assignments'] })
      },
      onError: (t) => {
        console.error('Failed to send bulk reminders:', t.message, t.details)
      },
    }),
  }
}
function We(s, r = !0) {
  return ie({
    queryKey: ['bulk-reminder-job', s],
    queryFn: async () => {
      if (!s) throw new Error('Job ID is required')
      const t = 'https://zkrcjzdemdmwhearhfgg.supabase.co',
        {
          data: { session: i },
        } = await T.auth.getSession()
      if (!i?.access_token) throw new Error('Unauthorized: No active session')
      const c = await fetch(`${t}/functions/v1/waiting-queue-reminder/status/${s}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${i.access_token}` },
      })
      if (!c.ok) throw await c.json()
      return c.json()
    },
    enabled: !!s && r,
    refetchInterval: (t) => {
      const i = t.state.data
      return !i || i.status === 'completed' || i.status === 'failed' ? !1 : 2e3
    },
    staleTime: 0,
  })
}
function ge({
  assignmentId: s,
  assigneeId: r,
  lastReminderSentAt: t,
  workItemId: i,
  disabled: c = !1,
  variant: d = 'outline',
  size: g = 'default',
  className: a = '',
}) {
  const { t: l, i18n: u } = C(),
    { toast: x } = fe(),
    { mutate: f, isPending: _ } = Ke(),
    [j, E] = h.useState(!1),
    V = u.language === 'ar',
    A = () => {
      if (!t) return !1
      const w = new Date(t)
      return (new Date().getTime() - w.getTime()) / 1e3 / 60 / 60 < 24
    },
    G = () => {
      if (!t) return 0
      const w = new Date(t),
        v = (new Date().getTime() - w.getTime()) / 1e3 / 60 / 60
      return Math.ceil(24 - v)
    },
    X = () => {
      if (!r) {
        x({
          variant: 'destructive',
          title: l('waitingQueue.reminder.noAssignee.title', 'No Assignee'),
          description: l(
            'waitingQueue.reminder.noAssignee.description',
            'This assignment has no assignee. Please assign it first.',
          ),
        })
        return
      }
      if (A()) {
        const w = G()
        x({
          variant: 'destructive',
          title: l('waitingQueue.reminder.cooldown.title', 'Cooldown Active'),
          description: l(
            'waitingQueue.reminder.cooldown.description',
            'Please wait {{hours}} more hours before sending another reminder.',
            { hours: w },
          ),
        })
        return
      }
      f(
        { assignmentId: s },
        {
          onSuccess: () => {
            ;(E(!0),
              x({
                title: l('waitingQueue.reminder.success.title', 'Reminder Sent'),
                description: l(
                  'waitingQueue.reminder.success.description',
                  'Follow-up reminder has been sent successfully.',
                ),
                variant: 'default',
              }),
              setTimeout(() => E(!1), 2e3))
          },
          onError: (w) => {
            let N = l('waitingQueue.reminder.error.title', 'Failed to Send Reminder'),
              v = l(
                'waitingQueue.reminder.error.description',
                'An error occurred while sending the reminder. Please try again.',
              )
            if (w?.error === 'COOLDOWN_ACTIVE') {
              const b = w?.details?.hours_remaining || 24
              ;((N = l('waitingQueue.reminder.cooldown.title', 'Cooldown Active')),
                (v = l(
                  'waitingQueue.reminder.cooldown.description',
                  'Please wait {{hours}} more hours before sending another reminder.',
                  { hours: b },
                )))
            } else
              w?.error === 'RATE_LIMIT_EXCEEDED'
                ? ((N = l('waitingQueue.reminder.rateLimit.title', 'Rate Limit Exceeded')),
                  (v = l(
                    'waitingQueue.reminder.rateLimit.description',
                    'You have sent too many reminders. Please wait a few minutes and try again.',
                  )))
                : w?.error === 'NO_ASSIGNEE'
                  ? ((N = l('waitingQueue.reminder.noAssignee.title', 'No Assignee')),
                    (v = l(
                      'waitingQueue.reminder.noAssignee.description',
                      'This assignment has no assignee. Please assign it first.',
                    )))
                  : w?.error === 'ASSIGNMENT_NOT_FOUND'
                    ? ((N = l('waitingQueue.reminder.notFound.title', 'Assignment Not Found')),
                      (v = l(
                        'waitingQueue.reminder.notFound.description',
                        'The assignment could not be found. It may have been deleted.',
                      )))
                    : w?.error === 'VERSION_CONFLICT' &&
                      ((N = l('waitingQueue.reminder.conflict.title', 'Assignment Changed')),
                      (v = l(
                        'waitingQueue.reminder.conflict.description',
                        'This assignment was modified by another user. Please refresh and try again.',
                      )))
            x({ variant: 'destructive', title: N, description: v })
          },
        },
      )
    },
    S = A(),
    F = c || _ || S || !r
  return e.jsx(z, {
    variant: d,
    size: g,
    onClick: X,
    disabled: F,
    className: `min-h-11 min-w-11 gap-2 ${a}`,
    'data-testid': 'reminder-button',
    'aria-label': l('waitingQueue.reminder.button.label', 'Send follow-up reminder'),
    children: _
      ? e.jsxs(e.Fragment, {
          children: [
            e.jsx(he, { className: 'h-4 w-4 animate-spin ' }),
            e.jsx('span', {
              className: 'hidden sm:inline',
              children: l('waitingQueue.reminder.button.sending', 'Sending...'),
            }),
          ],
        })
      : j
        ? e.jsxs(e.Fragment, {
            children: [
              e.jsx(ve, { className: 'h-4 w-4 text-green-600' }),
              e.jsx('span', {
                className: 'hidden sm:inline text-green-600',
                children: l('waitingQueue.reminder.button.sent', 'Sent!'),
              }),
            ],
          })
        : e.jsxs(e.Fragment, {
            children: [
              e.jsx(Ne, { className: 'h-4 w-4' }),
              e.jsx('span', {
                className: 'hidden sm:inline',
                children: l('waitingQueue.reminder.button.send', 'Send Reminder'),
              }),
            ],
          }),
  })
}
function He({ selectedCount: s, onSendReminders: r, onClearSelection: t, isProcessing: i = !1 }) {
  const { t: c, i18n: d } = C(),
    g = d.language === 'ar'
  return s === 0
    ? null
    : e.jsxs('div', {
        className:
          'sticky top-0 z-10 flex flex-col gap-2 p-4 bg-blue-50 border-b border-blue-200 dark:bg-blue-950 dark:border-blue-800 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
        dir: g ? 'rtl' : 'ltr',
        role: 'toolbar',
        'aria-label': c('waitingQueue.bulkActions.toolbar'),
        children: [
          e.jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              e.jsx('span', {
                className: 'text-sm font-medium text-blue-900 dark:text-blue-100 sm:text-base',
                children: c('waitingQueue.bulkActions.selectedCount', { count: s }),
              }),
              e.jsx('span', {
                className: 'text-xs text-blue-700 dark:text-blue-300 sm:text-sm',
                children: c('waitingQueue.bulkActions.maxItems', { max: 100 }),
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'flex gap-2 sm:gap-3',
            children: [
              e.jsx(z, {
                onClick: r,
                disabled: i,
                className: 'flex-1 h-11 px-4 text-sm sm:flex-initial sm:px-6 sm:text-base',
                'aria-label': c('waitingQueue.bulkActions.sendReminders'),
                children: c(
                  i ? 'waitingQueue.bulkActions.sending' : 'waitingQueue.bulkActions.sendReminders',
                ),
              }),
              e.jsxs(z, {
                onClick: t,
                variant: 'outline',
                disabled: i,
                className: 'h-11 px-3 sm:px-4',
                'aria-label': c('waitingQueue.bulkActions.clearSelection'),
                children: [
                  e.jsx(pe, { className: `h-4 w-4 ${g ? 'rotate-180' : ''}` }),
                  e.jsx('span', {
                    className: 'hidden sm:inline ms-2',
                    children: c('waitingQueue.bulkActions.clear'),
                  }),
                ],
              }),
            ],
          }),
          s >= 100 &&
            e.jsx('div', {
              className: 'text-xs text-orange-600 dark:text-orange-400 sm:text-sm',
              children: c('waitingQueue.bulkActions.maxReached'),
            }),
        ],
      })
}
const Ve = [
  { value: 'low', label: 'Low', dotColor: 'bg-gray-500' },
  { value: 'medium', label: 'Medium', dotColor: 'bg-blue-500' },
  { value: 'high', label: 'High', dotColor: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', dotColor: 'bg-red-500' },
]
function Ge({ value: s = [], onChange: r, disabled: t = !1 }) {
  const { t: i, i18n: c } = C(),
    d = c.language === 'ar',
    g = (a) => {
      const l = s.includes(a) ? s.filter((u) => u !== a) : [...s, a]
      r(l.length > 0 ? l : void 0)
    }
  return e.jsx('div', {
    className: 'space-y-1.5',
    role: 'group',
    'aria-labelledby': 'priority-filter-label',
    children: Ve.map((a) =>
      e.jsxs(
        'div',
        {
          className:
            'flex items-center gap-2 rounded-sm hover:bg-accent/50 transition-colors px-1 py-1',
          dir: d ? 'rtl' : 'ltr',
          children: [
            e.jsx(I, {
              id: `priority-${a.value}`,
              checked: s.includes(a.value),
              onCheckedChange: () => g(a.value),
              disabled: t,
              className: 'h-4 w-4',
            }),
            e.jsx(H, {
              htmlFor: `priority-${a.value}`,
              className: 'flex-1 cursor-pointer text-start text-xs',
              children: i(`waitingQueue.filters.priorities.${a.value}`),
            }),
          ],
        },
        a.value,
      ),
    ),
  })
}
const Xe = [
  { value: '0-2', label: '0-2 days', barColor: 'bg-green-500' },
  { value: '3-6', label: '3-6 days', barColor: 'bg-yellow-500' },
  { value: '7+', label: '7+ days', barColor: 'bg-red-500' },
]
function Ye({ value: s = [], onChange: r, disabled: t = !1 }) {
  const { t: i, i18n: c } = C(),
    d = c.language === 'ar',
    g = (a) => {
      const l = s.includes(a) ? s.filter((u) => u !== a) : [...s, a]
      r(l.length > 0 ? l : void 0)
    }
  return e.jsx('div', {
    className: 'space-y-1.5',
    role: 'group',
    'aria-labelledby': 'aging-filter-label',
    children: Xe.map((a) =>
      e.jsxs(
        'div',
        {
          className:
            'flex items-center gap-2 rounded-sm hover:bg-accent/50 transition-colors px-1 py-1',
          dir: d ? 'rtl' : 'ltr',
          children: [
            e.jsx(I, {
              id: `aging-${a.value}`,
              checked: s.includes(a.value),
              onCheckedChange: () => g(a.value),
              disabled: t,
              className: 'h-4 w-4',
            }),
            e.jsx(H, {
              htmlFor: `aging-${a.value}`,
              className: 'flex-1 cursor-pointer text-start text-xs',
              children: i(`waitingQueue.filters.agingBuckets.${a.value}.label`),
            }),
          ],
        },
        a.value,
      ),
    ),
  })
}
const Ze = [
  { value: 'dossier', label: 'Dossier', Icon: ke, color: 'text-blue-600' },
  { value: 'ticket', label: 'Ticket', Icon: ye, color: 'text-purple-600' },
  { value: 'position', label: 'Position', Icon: _e, color: 'text-green-600' },
  { value: 'task', label: 'Task', Icon: Qe, color: 'text-orange-600' },
]
function es({ value: s = [], onChange: r, disabled: t = !1 }) {
  const { t: i, i18n: c } = C(),
    d = c.language === 'ar',
    g = (a) => {
      const l = s.includes(a) ? s.filter((u) => u !== a) : [...s, a]
      r(l.length > 0 ? l : void 0)
    }
  return e.jsx('div', {
    className: 'space-y-1.5',
    role: 'group',
    'aria-labelledby': 'type-filter-label',
    children: Ze.map(
      (a) => (
        a.Icon,
        e.jsxs(
          'div',
          {
            className:
              'flex items-center gap-2 rounded-sm hover:bg-accent/50 transition-colors px-1 py-1',
            dir: d ? 'rtl' : 'ltr',
            children: [
              e.jsx(I, {
                id: `type-${a.value}`,
                checked: s.includes(a.value),
                onCheckedChange: () => g(a.value),
                disabled: t,
                className: 'h-4 w-4',
              }),
              e.jsx(H, {
                htmlFor: `type-${a.value}`,
                className: 'flex-1 cursor-pointer text-start text-xs',
                children: i(`waitingQueue.filters.types.${a.value}`),
              }),
            ],
          },
          a.value,
        )
      ),
    ),
  })
}
function ss({ value: s, onChange: r, disabled: t = !1 }) {
  const { t: i, i18n: c } = C(),
    d = c.language === 'ar',
    { data: g } = ie({
      queryKey: ['current-user'],
      queryFn: async () => {
        const {
          data: { user: l },
        } = await T.auth.getUser()
        return l
      },
    }),
    a = s === g?.id
  return e.jsx('div', {
    className: 'space-y-1.5',
    role: 'group',
    'aria-labelledby': 'assignee-filter-label',
    children: e.jsxs('div', {
      className:
        'flex items-center gap-2 rounded-sm hover:bg-accent/50 transition-colors px-1 py-1',
      dir: d ? 'rtl' : 'ltr',
      children: [
        e.jsx(I, {
          id: 'assignee-me',
          checked: a,
          onCheckedChange: (l) => {
            r(l ? g?.id : void 0)
          },
          disabled: t,
          className: 'h-4 w-4',
        }),
        e.jsx(H, {
          htmlFor: 'assignee-me',
          className: 'flex-1 cursor-pointer text-start text-xs',
          children: i('waitingQueue.filters.myAssignments'),
        }),
      ],
    }),
  })
}
function ts({
  filters: s,
  onFiltersChange: r,
  onClearFilters: t,
  isOpen: i,
  onOpenChange: c,
  resultCount: d,
  isLoading: g = !1,
  isApplying: a = !1,
  hasFilters: l = !1,
  filterCount: u = 0,
}) {
  const { t: x, i18n: f } = C(),
    _ = f.language === 'ar'
  return e.jsxs(Fe, {
    open: i,
    onOpenChange: c,
    children: [
      e.jsx(ze, {
        asChild: !0,
        children: e.jsxs(z, {
          variant: l ? 'default' : 'outline',
          size: 'sm',
          className: 'h-9',
          'aria-label': x('waitingQueue.filters.openFilters'),
          children: [
            e.jsx(ue, { className: 'h-4 w-4 me-2' }),
            l ? `${u} ${x('waitingQueue.filters.active')}` : x('waitingQueue.filters.title'),
          ],
        }),
      }),
      e.jsx(Ie, {
        className: 'w-[240px] p-0',
        align: _ ? 'end' : 'start',
        side: 'bottom',
        dir: _ ? 'rtl' : 'ltr',
        children: e.jsxs('div', {
          className: 'flex flex-col max-h-[520px]',
          children: [
            e.jsxs('div', {
              className: 'flex items-center justify-between px-3 py-2.5 border-b',
              children: [
                e.jsxs('div', {
                  className: 'flex items-center gap-2',
                  children: [
                    e.jsx(ue, { className: 'h-4 w-4 text-muted-foreground' }),
                    e.jsx('h2', {
                      className: 'text-sm font-semibold',
                      children: x('waitingQueue.filters.title'),
                    }),
                    l &&
                      e.jsxs('span', {
                        className: 'text-xs text-muted-foreground',
                        children: ['(', u, ')'],
                      }),
                  ],
                }),
                l &&
                  e.jsxs(z, {
                    variant: 'ghost',
                    size: 'sm',
                    onClick: t,
                    disabled: a,
                    className: 'h-7 px-2 text-xs',
                    children: [
                      e.jsx(pe, { className: 'h-3 w-3 me-1' }),
                      x('waitingQueue.filters.clearAll'),
                    ],
                  }),
              ],
            }),
            d !== void 0 &&
              e.jsx('div', {
                className: 'px-3 py-2 bg-muted/50 text-xs text-muted-foreground',
                children: x('waitingQueue.filters.showingResults', { count: d }),
              }),
            g
              ? e.jsx('div', {
                  className: 'space-y-3 p-3',
                  children: [1, 2, 3, 4].map((j) =>
                    e.jsxs(
                      'div',
                      {
                        className: 'space-y-1.5',
                        'data-testid': 'filter-skeleton',
                        children: [
                          e.jsx('div', { className: 'h-4 w-16 bg-muted animate-pulse rounded' }),
                          e.jsx('div', { className: 'h-7 bg-muted animate-pulse rounded' }),
                        ],
                      },
                      j,
                    ),
                  ),
                })
              : e.jsx(Ee, {
                  className: 'flex-1',
                  children: e.jsxs(Me, {
                    type: 'multiple',
                    defaultValue: ['priority', 'aging', 'type', 'assignee'],
                    className: 'w-full',
                    children: [
                      e.jsxs(M, {
                        value: 'priority',
                        className: 'border-b-0',
                        children: [
                          e.jsx(U, {
                            className: 'px-3 py-2 hover:no-underline hover:bg-accent/50',
                            children: e.jsx('span', {
                              className: 'text-xs font-medium',
                              children: x('waitingQueue.filters.priority'),
                            }),
                          }),
                          e.jsx(K, {
                            className: 'px-3 pb-3',
                            children: e.jsx(Ge, {
                              value: s.priority,
                              onChange: (j) => r({ ...s, priority: j, page: 1 }),
                              disabled: a,
                            }),
                          }),
                        ],
                      }),
                      e.jsx(se, {}),
                      e.jsxs(M, {
                        value: 'aging',
                        className: 'border-b-0',
                        children: [
                          e.jsx(U, {
                            className: 'px-3 py-2 hover:no-underline hover:bg-accent/50',
                            children: e.jsx('span', {
                              className: 'text-xs font-medium',
                              children: x('waitingQueue.filters.aging'),
                            }),
                          }),
                          e.jsx(K, {
                            className: 'px-3 pb-3',
                            children: e.jsx(Ye, {
                              value: s.aging,
                              onChange: (j) => r({ ...s, aging: j, page: 1 }),
                              disabled: a,
                            }),
                          }),
                        ],
                      }),
                      e.jsx(se, {}),
                      e.jsxs(M, {
                        value: 'type',
                        className: 'border-b-0',
                        children: [
                          e.jsx(U, {
                            className: 'px-3 py-2 hover:no-underline hover:bg-accent/50',
                            children: e.jsx('span', {
                              className: 'text-xs font-medium',
                              children: x('waitingQueue.filters.type'),
                            }),
                          }),
                          e.jsx(K, {
                            className: 'px-3 pb-3',
                            children: e.jsx(es, {
                              value: s.type,
                              onChange: (j) => r({ ...s, type: j, page: 1 }),
                              disabled: a,
                            }),
                          }),
                        ],
                      }),
                      e.jsx(se, {}),
                      e.jsxs(M, {
                        value: 'assignee',
                        className: 'border-b-0',
                        children: [
                          e.jsx(U, {
                            className: 'px-3 py-2 hover:no-underline hover:bg-accent/50',
                            children: e.jsx('span', {
                              className: 'text-xs font-medium',
                              children: x('waitingQueue.filters.assignee'),
                            }),
                          }),
                          e.jsx(K, {
                            className: 'px-3 pb-3',
                            children: e.jsx(ss, {
                              value: s.assignee,
                              onChange: (j) => r({ ...s, assignee: j, page: 1 }),
                              disabled: a,
                            }),
                          }),
                        ],
                      }),
                    ],
                  }),
                }),
          ],
        }),
      }),
    ],
  })
}
const q = 100
function is() {
  const [s, r] = h.useState(new Set()),
    t = s.size,
    i = t < q,
    c = t >= q,
    d = h.useCallback((u) => s.has(u), [s]),
    g = h.useCallback((u) => {
      r((x) => {
        const f = new Set(x)
        return (
          f.has(u)
            ? f.delete(u)
            : f.size < q
              ? f.add(u)
              : console.warn(`Maximum selection limit (${q}) reached. Cannot select more items.`),
          f
        )
      })
    }, []),
    a = h.useCallback((u) => {
      r((x) => {
        const f = u.slice(0, q)
        return new Set(f)
      })
    }, []),
    l = h.useCallback(() => {
      r(new Set())
    }, [])
  return h.useMemo(
    () => ({
      selectedIds: s,
      selectedCount: t,
      isSelected: d,
      toggleSelection: g,
      selectAll: a,
      clearSelection: l,
      canSelectMore: i,
      maxReached: c,
    }),
    [s, t, d, g, a, l, i, c],
  )
}
const J = 'waiting-queue-filters',
  ns = 7
function as() {
  try {
    const s = localStorage.getItem(J)
    if (!s) return {}
    const r = JSON.parse(s),
      t = Date.now() - r.timestamp,
      i = ns * 24 * 60 * 60 * 1e3
    return t > i ? (localStorage.removeItem(J), {}) : r.filters
  } catch {
    return {}
  }
}
function rs(s) {
  try {
    const r = { filters: s, timestamp: Date.now() }
    localStorage.setItem(J, JSON.stringify(r))
  } catch (r) {
    console.error('Failed to save filters to localStorage:', r)
  }
}
function ls() {
  const [s, r] = h.useState(as),
    t = W()
  h.useEffect(() => {
    rs(s)
  }, [s])
  const i = h.useCallback((u, x) => {
      r((f) => ({ ...f, [u]: x }))
    }, []),
    c = h.useCallback((u) => {
      r((x) => ({ ...x, ...u }))
    }, []),
    d = h.useCallback(() => {
      ;(r({}),
        localStorage.removeItem(J),
        t.invalidateQueries({ queryKey: ['waiting-queue-assignments'] }))
    }, [t]),
    g = h.useCallback((u) => {
      r(u)
    }, []),
    a = Object.keys(s).filter(
      (u) => u !== 'page' && u !== 'page_size' && u !== 'sort_by' && s[u] !== void 0,
    ).length,
    l = a > 0
  return {
    filters: s,
    updateFilter: i,
    updateFilters: c,
    clearFilters: d,
    resetFilters: g,
    filterCount: a,
    hasFilters: l,
  }
}
function os(s) {
  return ie({
    queryKey: ['waiting-queue-assignments', s],
    queryFn: async () => {
      const {
        data: { session: r },
      } = await T.auth.getSession()
      if (!r) throw new Error('Not authenticated')
      const t = new URLSearchParams()
      Object.entries(s).forEach(([c, d]) => {
        d != null &&
          (Array.isArray(d) ? d.forEach((g) => t.append(c, String(g))) : t.append(c, String(d)))
      })
      const i = await fetch(
        `https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/waiting-queue-filters/assignments?${t}`,
        {
          headers: {
            Authorization: `Bearer ${r.access_token}`,
            'Content-Type': 'application/json',
          },
        },
      )
      if (!i.ok) {
        const c = await i.json()
        throw new Error(c.error || 'Failed to fetch assignments')
      }
      return i.json()
    },
    staleTime: 5 * 60 * 1e3,
    gcTime: 10 * 60 * 1e3,
  })
}
function cs() {
  const { t: s, i18n: r } = C(),
    t = r.language === 'ar',
    { toast: i } = fe(),
    c = W(),
    [d, g] = h.useState('all'),
    [a, l] = h.useState(null),
    [u, x] = h.useState(!1),
    f = h.useRef(null),
    { filters: _, updateFilters: j, clearFilters: E, filterCount: V, hasFilters: A } = ls(),
    {
      selectedIds: G,
      selectedCount: X,
      isSelected: S,
      toggleSelection: F,
      clearSelection: w,
      maxReached: N,
    } = is(),
    { sendBulk: v } = Je(),
    { data: b, isLoading: us } = We(a, !!a),
    ne = (n) => {
      window.location.href = `/tasks/${n}`
    },
    we = async () => {
      const n = Array.from(G),
        o = Q?.filter((p) => n.includes(p.id) && p.assignee_id) || [],
        m = n.length - o.length
      if (o.length === 0) {
        i({
          variant: 'destructive',
          title: s('waitingQueue.bulkActions.noAssignees'),
          description: s('waitingQueue.bulkActions.noAssigneesDesc'),
        })
        return
      }
      try {
        const p = await v.mutateAsync({ assignmentIds: o.map((y) => y.id) })
        ;(l(p.job_id),
          m > 0
            ? i({
                title: s('waitingQueue.bulkActions.processing'),
                description: s('waitingQueue.bulkActions.skippedSome', {
                  sent: o.length,
                  skipped: m,
                }),
              })
            : i({
                title: s('waitingQueue.bulkActions.processing'),
                description: s('waitingQueue.bulkActions.jobCreated', { count: o.length }),
              }))
      } catch (p) {
        i({
          variant: 'destructive',
          title: s('waitingQueue.bulkActions.error'),
          description: p.message || s('waitingQueue.bulkActions.errorDesc'),
        })
      }
    },
    be = () => {
      ;(w(),
        i({
          title: s('waitingQueue.bulkActions.selectionCleared'),
          description: s('waitingQueue.bulkActions.selectionClearedDesc'),
        }))
    }
  h.useEffect(() => {
    if (b)
      if (b.status === 'completed') {
        ;(w(), l(null))
        const n = b.successful_items,
          o = b.failed_items
        i({
          title: s('waitingQueue.bulkActions.completed'),
          description: s('waitingQueue.bulkActions.summary', {
            success: n,
            failed: o,
            total: b.total_items,
          }),
          variant: (o > 0, 'default'),
        })
      } else
        b.status === 'failed' &&
          (l(null),
          i({
            variant: 'destructive',
            title: s('waitingQueue.bulkActions.failed'),
            description: s('waitingQueue.bulkActions.failedDesc'),
          }))
  }, [b, w, s, i])
  const { data: ae, isLoading: P } = os(_),
    $ = ae?.data || [],
    je = ae?.pagination
  h.useEffect(() => {
    const n = T.channel('waiting-queue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
          filter: 'status=in.(pending,assigned,completed,cancelled)',
        },
        (o) => {
          if (o.eventType === 'UPDATE') {
            const m = o.new
            ;((m.status === 'completed' || m.status === 'cancelled') &&
              (S(m.id) && F(m.id),
              i({
                title: s('waiting.assignmentUpdated'),
                description: s('waiting.assignmentCompletedDesc', { id: m.work_item_id }),
              })),
              c.invalidateQueries({ queryKey: ['waiting-queue'] }))
          }
          ;(o.eventType === 'INSERT' && c.invalidateQueries({ queryKey: ['waiting-queue'] }),
            o.eventType === 'DELETE' && c.invalidateQueries({ queryKey: ['waiting-queue'] }))
        },
      )
      .subscribe()
    return () => {
      T.removeChannel(n)
    }
  }, [S, F, c, s, i])
  const re = (n) => {
      const o = new Date(),
        m = new Date(n),
        p = Math.floor((o.getTime() - m.getTime()) / (1e3 * 60 * 60 * 24))
      return p >= 7
        ? { color: 'text-red-600', severity: 'critical', days: p }
        : p >= 3
          ? { color: 'text-orange-600', severity: 'warning', days: p }
          : { color: 'text-yellow-600', severity: 'normal', days: p }
    },
    le = (n) => {
      switch (n) {
        case 'dossier':
          return ee
        case 'ticket':
          return Te
        case 'position':
          return Ae
        default:
          return Z
      }
    },
    oe = (n) =>
      (n.work_item && (t ? n.work_item.title_ar : n.work_item.title_en)) ||
      n.work_item_id.substring(0, 8) + '...',
    ce = (n) => {
      if (!n.work_item?.linked_entities || n.work_item.linked_entities.length === 0) return null
      const o = n.work_item.linked_entities
        .map((m) =>
          m.type === 'dossier'
            ? t
              ? m.name_ar
              : m.name_en
            : m.type === 'position'
              ? t
                ? m.title_ar
                : m.title_en
              : m.type === 'ticket'
                ? m.ticket_number || (t ? m.title_ar : m.title_en)
                : null,
        )
        .filter(Boolean)
      return o.length === 0 ? null : s('waitingQueue.relatedTo', 'Related to: ') + o.join(', ')
    },
    Q = d === 'all' ? $ : $?.filter((n) => n.work_item_type === d),
    B = $?.reduce((n, o) => ((n[o.work_item_type] = (n[o.work_item_type] || 0) + 1), n), {}) || {},
    de = (Q?.length || 0) > 100,
    Y = Se({
      count: Q?.length || 0,
      getScrollElement: () => f.current,
      estimateSize: () => 120,
      overscan: 5,
      enabled: de,
    })
  return e.jsxs('div', {
    className: 'min-h-screen bg-background',
    dir: t ? 'rtl' : 'ltr',
    children: [
      e.jsx('div', {
        className: 'border-b border-border bg-card',
        children: e.jsx('div', {
          className: 'container mx-auto p-4 sm:p-6 lg:px-8',
          children: e.jsxs('div', {
            className: 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-3',
                children: [
                  e.jsx('div', {
                    className:
                      'flex size-10 items-center justify-center rounded-lg bg-orange-500/10 sm:size-12',
                    children: e.jsx(Z, { className: 'size-5 text-orange-600 sm:size-6' }),
                  }),
                  e.jsxs('div', {
                    children: [
                      e.jsx('h1', {
                        className: 'text-xl font-bold text-foreground sm:text-2xl md:text-3xl',
                        children: s('navigation.waitingQueue', 'Waiting Queue'),
                      }),
                      e.jsx('p', {
                        className: 'mt-1 text-sm text-muted-foreground',
                        children: s(
                          'waiting.description',
                          'Items pending or assigned but not yet started',
                        ),
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'flex items-center gap-2',
                children: [
                  e.jsxs(Re, {
                    value: _.sort_by || 'assigned_at_desc',
                    onValueChange: (n) => j({ sort_by: n }),
                    children: [
                      e.jsxs(De, {
                        className: 'hidden min-h-9 w-[180px] sm:flex',
                        'aria-label': s('waitingQueue.filters.sortBy'),
                        children: [e.jsx(Ce, { className: 'me-2 size-4' }), e.jsx(qe, {})],
                      }),
                      e.jsxs(Pe, {
                        children: [
                          e.jsx(L, {
                            value: 'assigned_at_desc',
                            children: s('waitingQueue.filters.sort.oldestFirst'),
                          }),
                          e.jsx(L, {
                            value: 'assigned_at_asc',
                            children: s('waitingQueue.filters.sort.newestFirst'),
                          }),
                          e.jsx(L, {
                            value: 'priority_desc',
                            children: s('waitingQueue.filters.sort.highPriorityFirst'),
                          }),
                          e.jsx(L, {
                            value: 'priority_asc',
                            children: s('waitingQueue.filters.sort.lowPriorityFirst'),
                          }),
                        ],
                      }),
                    ],
                  }),
                  e.jsx(ts, {
                    filters: _,
                    onFiltersChange: j,
                    onClearFilters: E,
                    isOpen: u,
                    onOpenChange: x,
                    resultCount: je?.total_count,
                    isLoading: P,
                    hasFilters: A,
                    filterCount: V,
                  }),
                ],
              }),
            ],
          }),
        }),
      }),
      e.jsx(He, {
        selectedCount: X,
        onSendReminders: we,
        onClearSelection: be,
        isProcessing: v.isPending || !!a,
      }),
      a &&
        b &&
        e.jsx('div', {
          className: 'border-b border-border bg-blue-50 dark:bg-blue-950',
          dir: t ? 'rtl' : 'ltr',
          children: e.jsx('div', {
            className: 'container mx-auto px-4 py-3 sm:px-6 lg:px-8',
            children: e.jsxs('div', {
              className: 'flex items-center gap-3',
              children: [
                e.jsx(he, { className: 'size-4 animate-spin text-blue-600' }),
                e.jsxs('div', {
                  className: 'flex-1',
                  children: [
                    e.jsx('p', {
                      className: 'text-sm font-medium text-blue-900 dark:text-blue-100',
                      children: s('waitingQueue.bulkActions.sending'),
                    }),
                    e.jsxs('p', {
                      className: 'text-xs text-blue-700 dark:text-blue-300',
                      children: [
                        b.processed_items,
                        ' / ',
                        b.total_items,
                        ' ',
                        s('waitingQueue.bulkActions.completed'),
                      ],
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'text-sm text-blue-900 dark:text-blue-100',
                  children: [Math.round((b.processed_items / b.total_items) * 100), '%'],
                }),
              ],
            }),
          }),
        }),
      e.jsx('div', {
        className: 'container mx-auto px-4 py-6 sm:px-6 lg:px-8',
        children: e.jsx('main', {
          className: 'w-full',
          children: e.jsxs($e, {
            value: d,
            onValueChange: g,
            className: 'space-y-4',
            children: [
              e.jsxs(Be, {
                className: 'grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-5',
                children: [
                  e.jsxs(D, {
                    value: 'all',
                    className: 'min-h-9 text-xs sm:text-sm',
                    children: [s('common.all', 'All'), ' (', $?.length || 0, ')'],
                  }),
                  e.jsxs(D, {
                    value: 'dossier',
                    className: 'min-h-9 text-xs sm:text-sm',
                    children: [s('waiting.dossiers', 'Dossiers'), ' (', B.dossier || 0, ')'],
                  }),
                  e.jsxs(D, {
                    value: 'ticket',
                    className: 'min-h-9 text-xs sm:text-sm',
                    children: [s('waiting.tickets', 'Tickets'), ' (', B.ticket || 0, ')'],
                  }),
                  e.jsxs(D, {
                    value: 'position',
                    className: 'min-h-9 text-xs sm:text-sm',
                    children: [s('waiting.positions', 'Positions'), ' (', B.position || 0, ')'],
                  }),
                  e.jsxs(D, {
                    value: 'task',
                    className: 'min-h-9 text-xs sm:text-sm',
                    children: [s('waiting.tasks', 'Tasks'), ' (', B.task || 0, ')'],
                  }),
                ],
              }),
              e.jsxs(Le, {
                value: d,
                className: 'mt-4 space-y-3',
                children: [
                  P &&
                    e.jsx('div', {
                      className: 'space-y-4',
                      'data-testid': 'loading-skeletons',
                      children: [1, 2, 3].map((n) => e.jsx(Oe, {}, n)),
                    }),
                  !P &&
                    (!Q || Q.length === 0) &&
                    e.jsxs(te, {
                      className: 'p-8 text-center sm:p-12',
                      children: [
                        e.jsx(Z, {
                          className: 'mx-auto mb-4 size-12 text-muted-foreground sm:size-16',
                        }),
                        e.jsx('h3', {
                          className: 'mb-2 text-lg font-semibold text-foreground sm:text-xl',
                          children: A
                            ? s('waitingQueue.filters.noResults')
                            : s('waiting.empty', 'No waiting items'),
                        }),
                        e.jsx('p', {
                          className: 'mb-4 text-sm text-muted-foreground',
                          children: A
                            ? s('waitingQueue.filters.noResultsDesc')
                            : d === 'all'
                              ? s('waiting.emptyDescription', 'All work items are progressing')
                              : s('waiting.emptyCategory', 'No items waiting for this reason'),
                        }),
                        A &&
                          e.jsx(z, {
                            variant: 'outline',
                            size: 'sm',
                            onClick: E,
                            className: 'min-h-9',
                            children: s('waitingQueue.filters.clearFilters'),
                          }),
                      ],
                    }),
                  !P &&
                    Q &&
                    Q.length > 0 &&
                    e.jsx(e.Fragment, {
                      children: de
                        ? e.jsx('div', {
                            ref: f,
                            className: 'overflow-auto',
                            style: { height: '600px' },
                            children: e.jsx('div', {
                              style: {
                                height: `${Y.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative',
                              },
                              children: Y.getVirtualItems().map((n) => {
                                const o = Q[n.index],
                                  m = re(o.assigned_at),
                                  p = le(o.work_item_type),
                                  y = ce(o),
                                  k = o.work_item?.engagement
                                return e.jsx(
                                  'div',
                                  {
                                    'data-index': n.index,
                                    ref: Y.measureElement,
                                    style: {
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      transform: `translateY(${n.start}px)`,
                                    },
                                    children: e.jsx(te, {
                                      className:
                                        'group mb-3 cursor-pointer p-4 transition-all hover:shadow-lg sm:p-6',
                                      'data-testid': 'assignment-row',
                                      'data-has-reminder': 'false',
                                      onClick: () => ne(o.work_item_id),
                                      children: e.jsxs('div', {
                                        className: 'flex gap-3 sm:gap-4',
                                        children: [
                                          e.jsx('div', {
                                            className: 'flex items-start pt-1',
                                            children: e.jsx(I, {
                                              checked: S(o.id),
                                              onCheckedChange: (R) => {
                                                if ((R.stopPropagation(), !S(o.id) && N)) {
                                                  i({
                                                    variant: 'destructive',
                                                    title: s('waitingQueue.bulkActions.maxReached'),
                                                    description: s(
                                                      'waitingQueue.bulkActions.maxReachedDesc',
                                                    ),
                                                  })
                                                  return
                                                }
                                                F(o.id)
                                              },
                                              onClick: (R) => R.stopPropagation(),
                                              'aria-label': s(
                                                'waitingQueue.bulkActions.selectItem',
                                                { id: o.work_item_id },
                                              ),
                                              className: 'mt-0.5 size-5',
                                            }),
                                          }),
                                          e.jsx('div', {
                                            className: 'min-w-0 flex-1',
                                            children: e.jsxs('div', {
                                              className:
                                                'flex flex-col gap-4 sm:flex-row sm:items-start',
                                              children: [
                                                e.jsxs('div', {
                                                  className: 'flex-1 space-y-3',
                                                  children: [
                                                    e.jsxs('div', {
                                                      className:
                                                        'flex flex-wrap items-center gap-2',
                                                      children: [
                                                        e.jsx('h3', {
                                                          className:
                                                            'text-base font-semibold text-foreground transition-colors group-hover:text-primary sm:text-lg',
                                                          'data-testid': 'row-work-item-id',
                                                          children: oe(o),
                                                        }),
                                                        e.jsx(O, {
                                                          variant: 'outline',
                                                          className: 'capitalize',
                                                          children: o.priority,
                                                        }),
                                                        m.severity === 'critical' &&
                                                          e.jsxs(O, {
                                                            variant: 'destructive',
                                                            className: 'gap-1',
                                                            children: [
                                                              e.jsx(me, { className: 'size-3' }),
                                                              m.days,
                                                              'd',
                                                            ],
                                                          }),
                                                      ],
                                                    }),
                                                    k &&
                                                      e.jsxs('div', {
                                                        className:
                                                          'flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-sm dark:bg-blue-950',
                                                        children: [
                                                          e.jsx(ee, {
                                                            className:
                                                              'size-4 text-blue-600 dark:text-blue-400',
                                                          }),
                                                          e.jsx('span', {
                                                            className:
                                                              'font-medium text-blue-900 dark:text-blue-100',
                                                            children: k.title,
                                                          }),
                                                          k.dossiers &&
                                                            e.jsxs(e.Fragment, {
                                                              children: [
                                                                e.jsx('span', {
                                                                  className:
                                                                    'text-blue-600 dark:text-blue-400',
                                                                  children: '•',
                                                                }),
                                                                e.jsx('span', {
                                                                  className:
                                                                    'text-xs text-blue-700 dark:text-blue-300',
                                                                  children: t
                                                                    ? k.dossiers.name_ar
                                                                    : k.dossiers.name_en,
                                                                }),
                                                              ],
                                                            }),
                                                        ],
                                                      }),
                                                    y &&
                                                      e.jsx('div', {
                                                        className: 'text-sm text-muted-foreground',
                                                        children: y,
                                                      }),
                                                    e.jsxs('div', {
                                                      className:
                                                        'flex items-center gap-2 text-sm text-muted-foreground',
                                                      children: [
                                                        e.jsx(p, { className: 'size-4' }),
                                                        e.jsx('span', {
                                                          className: 'capitalize',
                                                          children: o.status,
                                                        }),
                                                        e.jsx('span', { children: '•' }),
                                                        e.jsxs('span', {
                                                          className: m.color,
                                                          children: [
                                                            s('waiting.waitingFor', 'Waiting for'),
                                                            ' ',
                                                            m.days,
                                                            ' ',
                                                            m.days === 1
                                                              ? s('waiting.day', 'day')
                                                              : s('waiting.days', 'days'),
                                                          ],
                                                        }),
                                                      ],
                                                    }),
                                                    e.jsxs('div', {
                                                      className:
                                                        'flex flex-wrap items-center gap-3 text-xs text-muted-foreground',
                                                      children: [
                                                        e.jsxs('span', {
                                                          'data-testid': 'row-assignee-name',
                                                          children: [
                                                            s('waiting.assignee', 'Assignee'),
                                                            ':',
                                                            ' ',
                                                            o.assignee_name,
                                                          ],
                                                        }),
                                                        e.jsx('span', { children: '•' }),
                                                        e.jsxs('span', {
                                                          children: [
                                                            s('waiting.status', 'Status'),
                                                            ': ',
                                                            o.status,
                                                          ],
                                                        }),
                                                        e.jsx('span', { children: '•' }),
                                                        e.jsxs('span', {
                                                          children: [
                                                            'ID: ',
                                                            o.work_item_id.substring(0, 8),
                                                            '...',
                                                          ],
                                                        }),
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                                e.jsx('div', {
                                                  className: 'flex gap-2 sm:flex-col',
                                                  children: e.jsx(ge, {
                                                    assignmentId: o.id,
                                                    assigneeId: o.assignee_id,
                                                    lastReminderSentAt: o.last_reminder_sent_at,
                                                    workItemId: o.work_item_id,
                                                    variant: 'outline',
                                                    size: 'sm',
                                                    className: 'flex-1 sm:flex-none',
                                                    onClick: (R) => R.stopPropagation(),
                                                  }),
                                                }),
                                              ],
                                            }),
                                          }),
                                        ],
                                      }),
                                    }),
                                  },
                                  o.id,
                                )
                              }),
                            }),
                          })
                        : e.jsx('div', {
                            className: 'space-y-3',
                            children: Q.map((n) => {
                              const o = re(n.assigned_at),
                                m = le(n.work_item_type),
                                p = ce(n),
                                y = n.work_item?.engagement
                              return e.jsx(
                                te,
                                {
                                  className:
                                    'group cursor-pointer p-4 transition-all hover:shadow-lg sm:p-6',
                                  'data-testid': 'assignment-row',
                                  'data-has-reminder': 'false',
                                  onClick: () => ne(n.work_item_id),
                                  children: e.jsxs('div', {
                                    className: 'flex gap-3 sm:gap-4',
                                    children: [
                                      e.jsx('div', {
                                        className: 'flex items-start pt-1',
                                        children: e.jsx(I, {
                                          checked: S(n.id),
                                          onCheckedChange: (k) => {
                                            if ((k.stopPropagation(), !S(n.id) && N)) {
                                              i({
                                                variant: 'destructive',
                                                title: s('waitingQueue.bulkActions.maxReached'),
                                                description: s(
                                                  'waitingQueue.bulkActions.maxReachedDesc',
                                                ),
                                              })
                                              return
                                            }
                                            F(n.id)
                                          },
                                          onClick: (k) => k.stopPropagation(),
                                          'aria-label': s('waitingQueue.bulkActions.selectItem', {
                                            id: n.work_item_id,
                                          }),
                                          className: 'mt-0.5 size-5',
                                        }),
                                      }),
                                      e.jsx('div', {
                                        className: 'min-w-0 flex-1',
                                        children: e.jsxs('div', {
                                          className:
                                            'flex flex-col gap-4 sm:flex-row sm:items-start',
                                          children: [
                                            e.jsxs('div', {
                                              className: 'flex-1 space-y-3',
                                              children: [
                                                e.jsxs('div', {
                                                  className: 'flex flex-wrap items-center gap-2',
                                                  children: [
                                                    e.jsx('h3', {
                                                      className:
                                                        'text-base font-semibold text-foreground transition-colors group-hover:text-primary sm:text-lg',
                                                      'data-testid': 'row-work-item-id',
                                                      children: oe(n),
                                                    }),
                                                    e.jsx(O, {
                                                      variant: 'outline',
                                                      className: 'capitalize',
                                                      children: n.priority,
                                                    }),
                                                    o.severity === 'critical' &&
                                                      e.jsxs(O, {
                                                        variant: 'destructive',
                                                        className: 'gap-1',
                                                        children: [
                                                          e.jsx(me, { className: 'size-3' }),
                                                          o.days,
                                                          'd',
                                                        ],
                                                      }),
                                                  ],
                                                }),
                                                y &&
                                                  e.jsxs('div', {
                                                    className:
                                                      'flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-sm dark:bg-blue-950',
                                                    children: [
                                                      e.jsx(ee, {
                                                        className:
                                                          'size-4 text-blue-600 dark:text-blue-400',
                                                      }),
                                                      e.jsx('span', {
                                                        className:
                                                          'font-medium text-blue-900 dark:text-blue-100',
                                                        children: y.title,
                                                      }),
                                                      y.dossiers &&
                                                        e.jsxs(e.Fragment, {
                                                          children: [
                                                            e.jsx('span', {
                                                              className:
                                                                'text-blue-600 dark:text-blue-400',
                                                              children: '•',
                                                            }),
                                                            e.jsx('span', {
                                                              className:
                                                                'text-xs text-blue-700 dark:text-blue-300',
                                                              children: t
                                                                ? y.dossiers.name_ar
                                                                : y.dossiers.name_en,
                                                            }),
                                                          ],
                                                        }),
                                                    ],
                                                  }),
                                                p &&
                                                  e.jsx('div', {
                                                    className: 'text-sm text-muted-foreground',
                                                    children: p,
                                                  }),
                                                e.jsxs('div', {
                                                  className:
                                                    'flex items-center gap-2 text-sm text-muted-foreground',
                                                  children: [
                                                    e.jsx(m, { className: 'size-4' }),
                                                    e.jsx('span', {
                                                      className: 'capitalize',
                                                      children: n.status,
                                                    }),
                                                    e.jsx('span', { children: '•' }),
                                                    e.jsxs('span', {
                                                      className: o.color,
                                                      children: [
                                                        s('waiting.waitingFor', 'Waiting for'),
                                                        ' ',
                                                        o.days,
                                                        ' ',
                                                        o.days === 1
                                                          ? s('waiting.day', 'day')
                                                          : s('waiting.days', 'days'),
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                                e.jsxs('div', {
                                                  className:
                                                    'flex flex-wrap items-center gap-3 text-xs text-muted-foreground',
                                                  children: [
                                                    e.jsxs('span', {
                                                      'data-testid': 'row-assignee-name',
                                                      children: [
                                                        s('waiting.assignee', 'Assignee'),
                                                        ': ',
                                                        n.assignee_name,
                                                      ],
                                                    }),
                                                    e.jsx('span', { children: '•' }),
                                                    e.jsxs('span', {
                                                      children: [
                                                        s('waiting.status', 'Status'),
                                                        ': ',
                                                        n.status,
                                                      ],
                                                    }),
                                                    e.jsx('span', { children: '•' }),
                                                    e.jsxs('span', {
                                                      children: [
                                                        'ID: ',
                                                        n.work_item_id.substring(0, 8),
                                                        '...',
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                              ],
                                            }),
                                            e.jsx('div', {
                                              className: 'flex gap-2 sm:flex-col',
                                              children: e.jsx(ge, {
                                                assignmentId: n.id,
                                                assigneeId: n.assignee_id,
                                                lastReminderSentAt: n.last_reminder_sent_at,
                                                workItemId: n.work_item_id,
                                                variant: 'outline',
                                                size: 'sm',
                                                className: 'flex-1 sm:flex-none',
                                                onClick: (k) => k.stopPropagation(),
                                              }),
                                            }),
                                          ],
                                        }),
                                      }),
                                    ],
                                  }),
                                },
                                n.id,
                              )
                            }),
                          }),
                    }),
                ],
              }),
            ],
          }),
        }),
      }),
    ],
  })
}
function ds() {
  return e.jsx(Ue, { children: e.jsx(cs, {}) })
}
const ys = ds
export { ys as component }
//# sourceMappingURL=waiting-CwnWZNL1.js.map
