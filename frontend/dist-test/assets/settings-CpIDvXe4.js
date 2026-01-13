import { u as R, r as b, j as e } from './react-vendor-Buoak6m3.js'
import { a as P, d as q } from './tanstack-vendor-BZC-rs5U.js'
import {
  u as U,
  W as I,
  s as M,
  b as B,
  B as l,
  j as r,
  l as c,
  k as p,
  o as g,
  V as f,
  J as t,
  X as o,
  I as _,
} from './index-qYY0KoZ1.js'
import {
  aT as K,
  b0 as $,
  c7 as H,
  be as J,
  bq as O,
  aG as T,
  aM as Q,
  aK as Y,
  b2 as V,
  b1 as W,
  c8 as X,
  bw as Z,
  c9 as A,
} from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function ee() {
  const { t: a, i18n: C } = R(),
    { user: u } = U(),
    { theme: se, setTheme: ae, colorMode: w, setColorMode: k } = I(),
    [d, z] = b.useState('general'),
    [E, x] = b.useState(!1),
    j = C.language === 'ar',
    { data: L, isLoading: G } = P({
      queryKey: ['user-settings', u?.id],
      queryFn: async () => {
        const { data: s, error: n } = await M.from('users').select('*').eq('id', u?.id).single()
        if (n) throw n
        return {
          language_preference: s.language_preference || 'en',
          timezone: s.timezone || 'UTC',
          theme: s.theme || 'auto',
          notifications: {
            email: s.notifications_email ?? !0,
            push: s.notifications_push ?? !0,
            mou_expiry: s.notifications_mou_expiry ?? !0,
            event_reminders: s.notifications_event_reminders ?? !0,
            report_generation: s.notifications_report_generation ?? !0,
          },
          security: { mfa_enabled: s.mfa_enabled || !1, session_timeout: s.session_timeout || 30 },
        }
      },
      enabled: !!u?.id,
    }),
    [i, N] = b.useState(
      L || {
        language_preference: 'en',
        timezone: 'UTC',
        theme: 'auto',
        notifications: {
          email: !0,
          push: !0,
          mou_expiry: !0,
          event_reminders: !0,
          report_generation: !0,
        },
        security: { mfa_enabled: !1, session_timeout: 30 },
      },
    ),
    v = q({
      mutationFn: async (s) => {
        const { error: n } = await M.from('users')
          .update({
            language_preference: s.language_preference,
            timezone: s.timezone,
            theme: s.theme,
            notifications_email: s.notifications.email,
            notifications_push: s.notifications.push,
            notifications_mou_expiry: s.notifications.mou_expiry,
            notifications_event_reminders: s.notifications.event_reminders,
            notifications_report_generation: s.notifications.report_generation,
            mfa_enabled: s.security.mfa_enabled,
            session_timeout: s.security.session_timeout,
            updated_at: new Date().toISOString(),
          })
          .eq('id', u?.id)
        if (n) throw n
        return (
          s.language_preference !== C.language && (await B(s.language_preference)),
          s.theme === 'dark'
            ? document.documentElement.classList.add('dark')
            : s.theme === 'light'
              ? document.documentElement.classList.remove('dark')
              : window.matchMedia('(prefers-color-scheme: dark)').matches
                ? document.documentElement.classList.add('dark')
                : document.documentElement.classList.remove('dark'),
          s
        )
      },
      onSuccess: () => {
        x(!1)
      },
    }),
    y = (s) => {
      ;(N((n) => ({ ...n, ...s })), x(!0))
    },
    m = (s, n) => {
      ;(N((h) => ({ ...h, notifications: { ...h.notifications, [s]: n } })), x(!0))
    },
    D = (s, n) => {
      ;(N((h) => ({ ...h, security: { ...h.security, [s]: n } })), x(!0))
    },
    S = [
      { id: 'general', label: a('settings.general'), icon: e.jsx(K, { className: 'h-4 w-4' }) },
      {
        id: 'appearance',
        label: a('settings.appearance'),
        icon: e.jsx($, { className: 'h-4 w-4' }),
      },
      {
        id: 'notifications',
        label: a('settings.notifications'),
        icon: e.jsx(H, { className: 'h-4 w-4' }),
      },
      { id: 'security', label: a('settings.security'), icon: e.jsx(J, { className: 'h-4 w-4' }) },
    ],
    F = [
      { value: 'UTC', label: 'UTC' },
      { value: 'Asia/Riyadh', label: 'Riyadh (GMT+3)' },
      { value: 'Asia/Dubai', label: 'Dubai (GMT+4)' },
      { value: 'Africa/Cairo', label: 'Cairo (GMT+2)' },
      { value: 'Europe/London', label: 'London (GMT)' },
      { value: 'America/New_York', label: 'New York (GMT-5)' },
    ]
  return e.jsxs('div', {
    className: 'container mx-auto py-6',
    children: [
      e.jsxs('div', {
        className: 'flex justify-between items-center mb-6',
        children: [
          e.jsx('h1', { className: 'text-3xl font-bold', children: a('navigation.settings') }),
          E &&
            e.jsxs(l, {
              onClick: () => v.mutate(i),
              disabled: v.isPending,
              children: [e.jsx(O, { className: 'h-4 w-4 me-2' }), a('common.save')],
            }),
        ],
      }),
      v.isSuccess &&
        e.jsx(r, {
          className: 'mb-6 border-green-200 bg-green-50',
          children: e.jsx(c, {
            className: 'p-4',
            children: e.jsxs('div', {
              className: 'flex items-center gap-2 text-green-800',
              children: [
                e.jsx(T, { className: 'h-5 w-5' }),
                e.jsx('span', { children: a('settings.savedSuccessfully') }),
              ],
            }),
          }),
        }),
      e.jsxs('div', {
        className: 'grid gap-6 md:grid-cols-4',
        children: [
          e.jsx('div', {
            children: e.jsx(r, {
              children: e.jsx(c, {
                className: 'p-0',
                children: S.map((s) =>
                  e.jsxs(
                    'button',
                    {
                      className: `w-full flex items-center justify-between p-4 hover:bg-muted transition-colors ${d === s.id ? 'bg-muted' : ''}`,
                      onClick: () => z(s.id),
                      children: [
                        e.jsxs('div', {
                          className: 'flex items-center gap-3',
                          children: [
                            s.icon,
                            e.jsx('span', { className: 'font-medium', children: s.label }),
                          ],
                        }),
                        e.jsx(Q, { className: 'h-4 w-4' }),
                      ],
                    },
                    s.id,
                  ),
                ),
              }),
            }),
          }),
          e.jsx('div', {
            className: 'md:col-span-3',
            children: G
              ? e.jsx(r, {
                  children: e.jsx(c, {
                    className: 'p-8 text-center',
                    children: a('common.loading'),
                  }),
                })
              : e.jsxs(e.Fragment, {
                  children: [
                    d === 'general' &&
                      e.jsxs(r, {
                        children: [
                          e.jsxs(p, {
                            children: [
                              e.jsx(g, { children: a('settings.general') }),
                              e.jsx(f, { children: a('settings.generalDesc') }),
                            ],
                          }),
                          e.jsxs(c, {
                            className: 'space-y-6',
                            children: [
                              e.jsxs('div', {
                                className: 'space-y-2',
                                children: [
                                  e.jsx(t, { children: a('settings.language') }),
                                  e.jsxs('div', {
                                    className: 'flex gap-2',
                                    children: [
                                      e.jsxs(l, {
                                        variant:
                                          i.language_preference === 'en' ? 'default' : 'outline',
                                        onClick: () => y({ language_preference: 'en' }),
                                        children: [
                                          e.jsx(Y, { className: 'h-4 w-4 me-2' }),
                                          'English',
                                        ],
                                      }),
                                      e.jsxs(l, {
                                        variant:
                                          i.language_preference === 'ar' ? 'default' : 'outline',
                                        onClick: () => y({ language_preference: 'ar' }),
                                        children: [
                                          e.jsx(Y, { className: 'h-4 w-4 me-2' }),
                                          'العربية',
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              e.jsxs('div', {
                                className: 'space-y-2',
                                children: [
                                  e.jsx(t, { children: a('settings.timezone') }),
                                  e.jsx('select', {
                                    value: i.timezone,
                                    onChange: (s) => y({ timezone: s.target.value }),
                                    className:
                                      'w-full rounded-md border border-input bg-background px-3 py-2',
                                    children: F.map((s) =>
                                      e.jsx(
                                        'option',
                                        { value: s.value, children: s.label },
                                        s.value,
                                      ),
                                    ),
                                  }),
                                ],
                              }),
                              e.jsxs('div', {
                                className: 'space-y-2',
                                children: [
                                  e.jsx(t, { children: a('settings.dateFormat') }),
                                  e.jsxs('div', {
                                    className: 'flex gap-2',
                                    children: [
                                      e.jsx(l, {
                                        variant: 'outline',
                                        size: 'sm',
                                        children: 'DD/MM/YYYY',
                                      }),
                                      e.jsx(l, {
                                        variant: 'outline',
                                        size: 'sm',
                                        children: 'MM/DD/YYYY',
                                      }),
                                      e.jsx(l, {
                                        variant: 'outline',
                                        size: 'sm',
                                        children: 'YYYY-MM-DD',
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    d === 'appearance' &&
                      e.jsxs(r, {
                        children: [
                          e.jsxs(p, {
                            children: [
                              e.jsx(g, { children: a('settings.appearance') }),
                              e.jsx(f, { children: a('settings.appearanceDesc') }),
                            ],
                          }),
                          e.jsxs(c, {
                            className: 'space-y-8',
                            children: [
                              e.jsxs('div', {
                                className: 'space-y-4',
                                children: [
                                  e.jsx(t, {
                                    className: 'text-base font-semibold',
                                    children: a('settings.colorMode'),
                                  }),
                                  e.jsxs('div', {
                                    className: 'grid grid-cols-2 gap-4',
                                    children: [
                                      e.jsx(r, {
                                        className: `cursor-pointer transition-all hover:shadow-md ${w === 'light' ? 'ring-2 ring-primary' : ''}`,
                                        onClick: () => k('light'),
                                        children: e.jsxs(c, {
                                          className: 'p-6 text-center',
                                          children: [
                                            e.jsx(V, {
                                              className: 'h-10 w-10 mx-auto mb-3 text-yellow-500',
                                            }),
                                            e.jsx('span', {
                                              className: 'text-sm font-medium',
                                              children: a('settings.lightMode'),
                                            }),
                                          ],
                                        }),
                                      }),
                                      e.jsx(r, {
                                        className: `cursor-pointer transition-all hover:shadow-md ${w === 'dark' ? 'ring-2 ring-primary' : ''}`,
                                        onClick: () => k('dark'),
                                        children: e.jsxs(c, {
                                          className: 'p-6 text-center',
                                          children: [
                                            e.jsx(W, {
                                              className: 'h-10 w-10 mx-auto mb-3 text-blue-500',
                                            }),
                                            e.jsx('span', {
                                              className: 'text-sm font-medium',
                                              children: a('settings.darkMode'),
                                            }),
                                          ],
                                        }),
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              e.jsxs('div', {
                                className: 'space-y-4',
                                children: [
                                  e.jsxs('div', {
                                    children: [
                                      e.jsx(t, {
                                        className: 'text-base font-semibold',
                                        children: j ? 'نمط السمة' : 'Theme Style',
                                      }),
                                      e.jsx('p', {
                                        className: 'text-sm text-muted-foreground mt-1',
                                        children: j
                                          ? 'سمة التطبيق الحالية'
                                          : 'Current application theme',
                                      }),
                                    ],
                                  }),
                                  e.jsx('div', {
                                    className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
                                    children: e.jsx(r, {
                                      className: 'ring-2 ring-primary',
                                      children: e.jsxs(c, {
                                        className: 'p-6',
                                        children: [
                                          e.jsxs('div', {
                                            className: 'flex items-center gap-3 mb-4',
                                            children: [
                                              e.jsxs('div', {
                                                className: 'flex gap-1',
                                                children: [
                                                  e.jsx('div', {
                                                    className: 'w-4 h-4 rounded-full',
                                                    style: {
                                                      backgroundColor: 'hsl(155 50.6% 37.3%)',
                                                    },
                                                  }),
                                                  e.jsx('div', {
                                                    className: 'w-4 h-4 rounded-full',
                                                    style: { backgroundColor: 'hsl(0 0% 89.8%)' },
                                                  }),
                                                  e.jsx('div', {
                                                    className: 'w-4 h-4 rounded-full',
                                                    style: {
                                                      backgroundColor: 'hsl(155 55.8% 58.4%)',
                                                    },
                                                  }),
                                                ],
                                              }),
                                              e.jsx(T, {
                                                className: 'h-5 w-5 text-primary ms-auto',
                                              }),
                                            ],
                                          }),
                                          e.jsxs('div', {
                                            className: 'text-center',
                                            children: [
                                              e.jsx('span', {
                                                className: 'text-sm font-medium',
                                                children: j ? 'كانفس' : 'Canvas',
                                              }),
                                              e.jsx('p', {
                                                className: 'text-xs text-muted-foreground mt-1',
                                                children: j
                                                  ? 'أخضر يوكاليبتوس مع رمادي ألاباستر'
                                                  : 'Eucalyptus green with Alabaster gray',
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                    }),
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    d === 'notifications' &&
                      e.jsxs(r, {
                        children: [
                          e.jsxs(p, {
                            children: [
                              e.jsx(g, { children: a('settings.notifications') }),
                              e.jsx(f, { children: a('settings.notificationsDesc') }),
                            ],
                          }),
                          e.jsx(c, {
                            className: 'space-y-6',
                            children: e.jsxs('div', {
                              className: 'space-y-4',
                              children: [
                                e.jsxs('div', {
                                  className: 'flex items-center justify-between',
                                  children: [
                                    e.jsxs('div', {
                                      className: 'space-y-0.5',
                                      children: [
                                        e.jsx(t, { children: a('settings.emailNotifications') }),
                                        e.jsx('p', {
                                          className: 'text-sm text-muted-foreground',
                                          children: a('settings.emailNotificationsDesc'),
                                        }),
                                      ],
                                    }),
                                    e.jsx(o, {
                                      checked: i.notifications.email,
                                      onCheckedChange: (s) => m('email', s),
                                    }),
                                  ],
                                }),
                                e.jsxs('div', {
                                  className: 'flex items-center justify-between',
                                  children: [
                                    e.jsxs('div', {
                                      className: 'space-y-0.5',
                                      children: [
                                        e.jsx(t, { children: a('settings.pushNotifications') }),
                                        e.jsx('p', {
                                          className: 'text-sm text-muted-foreground',
                                          children: a('settings.pushNotificationsDesc'),
                                        }),
                                      ],
                                    }),
                                    e.jsx(o, {
                                      checked: i.notifications.push,
                                      onCheckedChange: (s) => m('push', s),
                                    }),
                                  ],
                                }),
                                e.jsxs('div', {
                                  className: 'flex items-center justify-between',
                                  children: [
                                    e.jsxs('div', {
                                      className: 'space-y-0.5',
                                      children: [
                                        e.jsx(t, { children: a('settings.mouExpiryAlerts') }),
                                        e.jsx('p', {
                                          className: 'text-sm text-muted-foreground',
                                          children: a('settings.mouExpiryAlertsDesc'),
                                        }),
                                      ],
                                    }),
                                    e.jsx(o, {
                                      checked: i.notifications.mou_expiry,
                                      onCheckedChange: (s) => m('mou_expiry', s),
                                    }),
                                  ],
                                }),
                                e.jsxs('div', {
                                  className: 'flex items-center justify-between',
                                  children: [
                                    e.jsxs('div', {
                                      className: 'space-y-0.5',
                                      children: [
                                        e.jsx(t, { children: a('settings.eventReminders') }),
                                        e.jsx('p', {
                                          className: 'text-sm text-muted-foreground',
                                          children: a('settings.eventRemindersDesc'),
                                        }),
                                      ],
                                    }),
                                    e.jsx(o, {
                                      checked: i.notifications.event_reminders,
                                      onCheckedChange: (s) => m('event_reminders', s),
                                    }),
                                  ],
                                }),
                                e.jsxs('div', {
                                  className: 'flex items-center justify-between',
                                  children: [
                                    e.jsxs('div', {
                                      className: 'space-y-0.5',
                                      children: [
                                        e.jsx(t, { children: a('settings.reportGeneration') }),
                                        e.jsx('p', {
                                          className: 'text-sm text-muted-foreground',
                                          children: a('settings.reportGenerationDesc'),
                                        }),
                                      ],
                                    }),
                                    e.jsx(o, {
                                      checked: i.notifications.report_generation,
                                      onCheckedChange: (s) => m('report_generation', s),
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          }),
                        ],
                      }),
                    d === 'security' &&
                      e.jsxs(r, {
                        children: [
                          e.jsxs(p, {
                            children: [
                              e.jsx(g, { children: a('settings.security') }),
                              e.jsx(f, { children: a('settings.securityDesc') }),
                            ],
                          }),
                          e.jsx(c, {
                            className: 'space-y-6',
                            children: e.jsxs('div', {
                              className: 'space-y-4',
                              children: [
                                e.jsxs('div', {
                                  className: 'flex items-center justify-between',
                                  children: [
                                    e.jsxs('div', {
                                      className: 'space-y-0.5',
                                      children: [
                                        e.jsxs(t, {
                                          className: 'flex items-center gap-2',
                                          children: [
                                            e.jsx(X, { className: 'h-4 w-4' }),
                                            a('settings.twoFactorAuth'),
                                          ],
                                        }),
                                        e.jsx('p', {
                                          className: 'text-sm text-muted-foreground',
                                          children: a('settings.twoFactorAuthDesc'),
                                        }),
                                      ],
                                    }),
                                    e.jsx(o, {
                                      checked: i.security.mfa_enabled,
                                      onCheckedChange: (s) => D('mfa_enabled', s),
                                    }),
                                  ],
                                }),
                                i.security.mfa_enabled &&
                                  e.jsx(r, {
                                    className: 'border-orange-200 bg-orange-50',
                                    children: e.jsx(c, {
                                      className: 'p-4',
                                      children: e.jsxs('div', {
                                        className: 'flex items-start gap-2',
                                        children: [
                                          e.jsx(Z, { className: 'h-5 w-5 text-orange-600 mt-0.5' }),
                                          e.jsxs('div', {
                                            className: 'text-sm text-orange-800',
                                            children: [
                                              e.jsx('p', {
                                                className: 'font-medium mb-1',
                                                children: a('settings.mfaSetupRequired'),
                                              }),
                                              e.jsx('p', {
                                                children: a('settings.mfaSetupInstructions'),
                                              }),
                                              e.jsxs(l, {
                                                size: 'sm',
                                                className: 'mt-2',
                                                children: [
                                                  e.jsx(A, { className: 'h-4 w-4 me-2' }),
                                                  a('settings.setupMfa'),
                                                ],
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                    }),
                                  }),
                                e.jsxs('div', {
                                  className: 'space-y-2',
                                  children: [
                                    e.jsx(t, { children: a('settings.sessionTimeout') }),
                                    e.jsx('p', {
                                      className: 'text-sm text-muted-foreground',
                                      children: a('settings.sessionTimeoutDesc'),
                                    }),
                                    e.jsxs('select', {
                                      value: i.security.session_timeout,
                                      onChange: (s) => D('session_timeout', Number(s.target.value)),
                                      className:
                                        'w-full rounded-md border border-input bg-background px-3 py-2',
                                      children: [
                                        e.jsxs('option', {
                                          value: 15,
                                          children: ['15 ', a('settings.minutes')],
                                        }),
                                        e.jsxs('option', {
                                          value: 30,
                                          children: ['30 ', a('settings.minutes')],
                                        }),
                                        e.jsxs('option', {
                                          value: 60,
                                          children: ['1 ', a('settings.hour')],
                                        }),
                                        e.jsxs('option', {
                                          value: 120,
                                          children: ['2 ', a('settings.hours')],
                                        }),
                                        e.jsxs('option', {
                                          value: 480,
                                          children: ['8 ', a('settings.hours')],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                e.jsxs('div', {
                                  className: 'pt-4 border-t',
                                  children: [
                                    e.jsx('h3', {
                                      className: 'font-medium mb-4',
                                      children: a('settings.passwordChange'),
                                    }),
                                    e.jsxs('div', {
                                      className: 'space-y-4',
                                      children: [
                                        e.jsxs('div', {
                                          children: [
                                            e.jsx(t, { children: a('settings.currentPassword') }),
                                            e.jsx(_, { type: 'password', className: 'mt-2' }),
                                          ],
                                        }),
                                        e.jsxs('div', {
                                          children: [
                                            e.jsx(t, { children: a('settings.newPassword') }),
                                            e.jsx(_, { type: 'password', className: 'mt-2' }),
                                          ],
                                        }),
                                        e.jsxs('div', {
                                          children: [
                                            e.jsx(t, { children: a('settings.confirmPassword') }),
                                            e.jsx(_, { type: 'password', className: 'mt-2' }),
                                          ],
                                        }),
                                        e.jsxs(l, {
                                          children: [
                                            e.jsx(A, { className: 'h-4 w-4 me-2' }),
                                            a('settings.changePassword'),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          }),
                        ],
                      }),
                  ],
                }),
          }),
        ],
      }),
    ],
  })
}
const ue = ee
export { ue as component }
//# sourceMappingURL=settings-CpIDvXe4.js.map
