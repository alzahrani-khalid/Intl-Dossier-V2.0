import { u as b, r as v, j as e } from './react-vendor-Buoak6m3.js'
import { L as y } from './tanstack-vendor-BZC-rs5U.js'
import { I as w, a2 as x, j as i, l as n, B as l, m as h } from './index-qYY0KoZ1.js'
import { A as k, a as C, b as S, c as A } from './accordion-DiUjAmkv.js'
import {
  co as z,
  aI as p,
  aH as u,
  b_ as g,
  bw as q,
  bL as I,
  aE as L,
  cl as $,
  aR as M,
  bE as F,
  bB as T,
  cq as G,
  dj as j,
  bz as H,
  aM as d,
  dC as P,
  bC as Q,
  aK as B,
  bV as E,
} from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function R() {
  const { i18n: t } = b(),
    s = t.language === 'ar',
    [r, o] = v.useState(''),
    f = [
      {
        id: 'commitments',
        title: s ? 'إدارة الالتزامات' : 'Commitments',
        description: s
          ? 'إنشاء وتتبع الالتزامات المرتبطة بالملفات'
          : 'Create and track dossier obligations',
        icon: g,
        href: '/help/commitments',
        color: 'bg-blue-500',
        badge: s ? 'جديد' : 'New',
      },
      {
        id: 'dossiers',
        title: s ? 'الملفات' : 'Dossiers',
        description: s ? 'إدارة ملفات الدول والمنظمات' : 'Manage country & organization files',
        icon: u,
        href: '/help/dossiers',
        color: 'bg-emerald-500',
        comingSoon: !0,
      },
      {
        id: 'tasks',
        title: s ? 'المهام' : 'Tasks & Workflows',
        description: s ? 'إدارة المهام وسير العمل' : 'Manage assignments and workflows',
        icon: $,
        href: '/help/tasks',
        color: 'bg-orange-500',
        comingSoon: !0,
      },
      {
        id: 'calendar',
        title: s ? 'التقويم' : 'Calendar',
        description: s ? 'جدولة وتتبع الأحداث' : 'Schedule and track events',
        icon: M,
        href: '/help/calendar',
        color: 'bg-purple-500',
        comingSoon: !0,
      },
      {
        id: 'contacts',
        title: s ? 'جهات الاتصال' : 'Contacts',
        description: s ? 'إدارة جهات الاتصال الخارجية' : 'Manage external contacts',
        icon: p,
        href: '/help/contacts',
        color: 'bg-pink-500',
        comingSoon: !0,
      },
      {
        id: 'analytics',
        title: s ? 'التحليلات' : 'Analytics',
        description: s ? 'عرض التقارير والإحصائيات' : 'View reports and statistics',
        icon: F,
        href: '/help/analytics',
        color: 'bg-cyan-500',
        comingSoon: !0,
      },
    ],
    m = [
      {
        id: 'getting-started',
        question: s ? 'كيف أبدأ باستخدام النظام؟' : 'How do I get started?',
        answer: s
          ? 'ابدأ بإنشاء ملف جديد من صفحة الملفات، ثم أضف المعلومات والالتزامات والمستندات المرتبطة.'
          : 'Start by creating a new dossier from the Dossiers page, then add related information, commitments, and documents.',
        icon: z,
      },
      {
        id: 'roles',
        question: s ? 'ما هي الأدوار المتاحة؟' : 'What user roles are available?',
        answer: s
          ? 'هناك أربعة أدوار رئيسية: مدير النظام (وصول كامل)، المدير (إدارة الفريق)، الموظف (إنشاء/تعديل)، والمشاهد (قراءة فقط).'
          : 'Four main roles: Admin (full access), Manager (team management), Staff (create/edit), and Viewer (read-only).',
        icon: p,
      },
      {
        id: 'dossier',
        question: s ? 'ما هو الملف؟' : 'What is a dossier?',
        answer: s
          ? 'الملف هو سجل شامل للكيانات الدبلوماسية مثل الدول والمنظمات والمنتديات. يجمع جميع المعلومات ذات الصلة في مكان واحد.'
          : 'A dossier is a comprehensive record for diplomatic entities like countries, organizations, and forums. It centralizes all related information.',
        icon: u,
      },
      {
        id: 'commitment',
        question: s ? 'ما هو الالتزام؟' : 'What is a commitment?',
        answer: s
          ? 'الالتزام هو تعهد أو مهمة مرتبطة بملف. يمكن أن يكون مهمة داخلية أو التزام خارجي يحتاج للمتابعة.'
          : 'A commitment is a tracked obligation linked to a dossier. It can be an internal task or external obligation requiring follow-up.',
        icon: g,
      },
      {
        id: 'password',
        question: s ? 'كيف أعيد تعيين كلمة المرور؟' : 'How do I reset my password?',
        answer: s
          ? 'انقر على ملفك الشخصي، اختر "الإعدادات"، ثم انتقل إلى تبويب "الأمان" وانقر على "تغيير كلمة المرور".'
          : 'Click your profile, select "Settings", go to the "Security" tab, and click "Change Password".',
        icon: q,
      },
    ].filter(
      (a) =>
        !r ||
        a.question.toLowerCase().includes(r.toLowerCase()) ||
        a.answer.toLowerCase().includes(r.toLowerCase()),
    )
  return e.jsxs('div', {
    className: 'min-h-screen bg-gradient-to-b from-background to-muted/20',
    dir: s ? 'rtl' : 'ltr',
    children: [
      e.jsx('div', {
        className: 'bg-primary/5 border-b',
        children: e.jsx('div', {
          className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16',
          children: e.jsxs('div', {
            className: 'max-w-3xl mx-auto text-center',
            children: [
              e.jsxs('div', {
                className:
                  'inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4',
                children: [
                  e.jsx(I, { className: 'size-4' }),
                  e.jsx('span', {
                    className: 'text-sm font-medium',
                    children: s ? 'مركز المساعدة' : 'Help Center',
                  }),
                ],
              }),
              e.jsx('h1', {
                className: 'text-3xl sm:text-4xl lg:text-5xl font-bold mb-4',
                children: s ? 'كيف يمكننا مساعدتك؟' : 'How can we help you?',
              }),
              e.jsx('p', {
                className: 'text-lg text-muted-foreground mb-8',
                children: s
                  ? 'ابحث في المقالات أو تصفح الأدلة أدناه'
                  : 'Search articles or browse guides below',
              }),
              e.jsxs('div', {
                className: 'relative max-w-xl mx-auto',
                children: [
                  e.jsx(L, {
                    className: `absolute top-1/2 -translate-y-1/2 size-5 text-muted-foreground ${s ? 'right-4' : 'left-4'}`,
                  }),
                  e.jsx(w, {
                    type: 'search',
                    placeholder: s ? 'ابحث عن المساعدة...' : 'Search for help...',
                    value: r,
                    onChange: (a) => o(a.target.value),
                    className: `h-14 text-lg rounded-full border-2 ${s ? 'pr-12 pl-4' : 'pl-12 pr-4'}`,
                  }),
                ],
              }),
            ],
          }),
        }),
      }),
      e.jsxs('div', {
        className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12',
        children: [
          e.jsxs('section', {
            className: 'mb-12',
            children: [
              e.jsx('div', {
                className: 'flex items-center justify-between mb-6',
                children: e.jsxs('div', {
                  children: [
                    e.jsx('h2', {
                      className: 'text-2xl font-bold text-start',
                      children: s ? 'أدلة الميزات' : 'Feature Guides',
                    }),
                    e.jsx('p', {
                      className: 'text-muted-foreground text-start',
                      children: s ? 'تعلم كيفية استخدام كل ميزة' : 'Learn how to use each feature',
                    }),
                  ],
                }),
              }),
              e.jsx('div', {
                className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
                children: f.map((a) => e.jsx(D, { guide: a, isRTL: s }, a.id)),
              }),
            ],
          }),
          e.jsx(x, { className: 'my-8' }),
          e.jsxs('div', {
            className: 'grid grid-cols-1 lg:grid-cols-3 gap-8',
            children: [
              e.jsxs('section', {
                className: 'lg:col-span-2',
                children: [
                  e.jsxs('div', {
                    className: 'flex items-center gap-2 mb-6',
                    children: [
                      e.jsx(T, { className: 'size-6 text-primary' }),
                      e.jsx('h2', {
                        className: 'text-2xl font-bold text-start',
                        children: s ? 'الأسئلة الشائعة' : 'Frequently Asked Questions',
                      }),
                    ],
                  }),
                  m.length === 0
                    ? e.jsx(i, {
                        children: e.jsx(n, {
                          className: 'py-12 text-center text-muted-foreground',
                          children: s
                            ? 'لم يتم العثور على نتائج'
                            : 'No results found matching your search',
                        }),
                      })
                    : e.jsx(i, {
                        children: e.jsx(n, {
                          className: 'pt-6',
                          children: e.jsx(k, {
                            type: 'single',
                            collapsible: !0,
                            className: 'w-full',
                            children: m.map((a, W) => {
                              const N = a.icon
                              return e.jsxs(
                                C,
                                {
                                  value: a.id,
                                  children: [
                                    e.jsx(S, {
                                      className: 'text-start hover:no-underline',
                                      children: e.jsxs('span', {
                                        className: 'flex items-center gap-3',
                                        children: [
                                          e.jsx('div', {
                                            className:
                                              'w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0',
                                            children: e.jsx(N, {
                                              className: 'size-4 text-primary',
                                            }),
                                          }),
                                          e.jsx('span', {
                                            className: 'text-sm sm:text-base font-medium',
                                            children: a.question,
                                          }),
                                        ],
                                      }),
                                    }),
                                    e.jsx(A, {
                                      className: 'text-muted-foreground ps-11',
                                      children: a.answer,
                                    }),
                                  ],
                                },
                                a.id,
                              )
                            }),
                          }),
                        }),
                      }),
                  e.jsx('div', {
                    className: 'mt-4 text-center',
                    children: e.jsxs(l, {
                      variant: 'ghost',
                      className: 'gap-2',
                      children: [
                        s ? 'عرض جميع الأسئلة' : 'View all questions',
                        e.jsx(G, { className: `size-4 ${s ? 'rotate-180' : ''}` }),
                      ],
                    }),
                  }),
                ],
              }),
              e.jsxs('section', {
                children: [
                  e.jsxs('div', {
                    className: 'flex items-center gap-2 mb-6',
                    children: [
                      e.jsx(j, { className: 'size-6 text-primary' }),
                      e.jsx('h2', {
                        className: 'text-2xl font-bold text-start',
                        children: s ? 'تواصل معنا' : 'Contact Support',
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'space-y-4',
                    children: [
                      e.jsx(i, {
                        className: 'border-2 hover:border-primary/50 transition-colors',
                        children: e.jsx(n, {
                          className: 'pt-6',
                          children: e.jsxs('div', {
                            className: 'flex items-start gap-4',
                            children: [
                              e.jsx('div', {
                                className:
                                  'w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0',
                                children: e.jsx(H, {
                                  className: 'size-6 text-blue-600 dark:text-blue-400',
                                }),
                              }),
                              e.jsxs('div', {
                                className: 'flex-1 min-w-0',
                                children: [
                                  e.jsx('h3', {
                                    className: 'font-semibold text-start',
                                    children: s ? 'البريد الإلكتروني' : 'Email Support',
                                  }),
                                  e.jsx('p', {
                                    className: 'text-sm text-muted-foreground text-start truncate',
                                    children: 'support@gastat.gov.sa',
                                  }),
                                  e.jsxs(l, {
                                    variant: 'link',
                                    className: 'h-auto p-0 mt-1',
                                    children: [
                                      s ? 'إرسال رسالة' : 'Send message',
                                      e.jsx(d, {
                                        className: `size-4 ms-1 ${s ? 'rotate-180' : ''}`,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        }),
                      }),
                      e.jsx(i, {
                        className: 'border-2 hover:border-primary/50 transition-colors',
                        children: e.jsx(n, {
                          className: 'pt-6',
                          children: e.jsxs('div', {
                            className: 'flex items-start gap-4',
                            children: [
                              e.jsx('div', {
                                className:
                                  'w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0',
                                children: e.jsx(j, {
                                  className: 'size-6 text-green-600 dark:text-green-400',
                                }),
                              }),
                              e.jsxs('div', {
                                className: 'flex-1 min-w-0',
                                children: [
                                  e.jsx('h3', {
                                    className: 'font-semibold text-start',
                                    children: s ? 'الدعم الهاتفي' : 'Phone Support',
                                  }),
                                  e.jsx('p', {
                                    className: 'text-sm text-muted-foreground text-start',
                                    dir: 'ltr',
                                    children: '+966 11 123 4567',
                                  }),
                                  e.jsxs(l, {
                                    variant: 'link',
                                    className: 'h-auto p-0 mt-1',
                                    children: [
                                      s ? 'اتصل الآن' : 'Call now',
                                      e.jsx(d, {
                                        className: `size-4 ms-1 ${s ? 'rotate-180' : ''}`,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        }),
                      }),
                      e.jsx(i, {
                        className: 'bg-muted/50',
                        children: e.jsx(n, {
                          className: 'pt-6',
                          children: e.jsxs('div', {
                            className: 'text-center',
                            children: [
                              e.jsx('p', {
                                className: 'text-sm font-medium mb-1',
                                children: s ? 'ساعات العمل' : 'Support Hours',
                              }),
                              e.jsx('p', {
                                className: 'text-sm text-muted-foreground',
                                children: s ? 'الأحد - الخميس' : 'Sunday - Thursday',
                              }),
                              e.jsx('p', {
                                className: 'text-sm text-muted-foreground',
                                children: '8:00 AM - 4:00 PM (GMT+3)',
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
          e.jsx(x, { className: 'my-8' }),
          e.jsxs('section', {
            children: [
              e.jsx('h2', {
                className: 'text-2xl font-bold mb-6 text-start',
                children: s ? 'موارد إضافية' : 'Additional Resources',
              }),
              e.jsxs('div', {
                className: 'grid grid-cols-1 sm:grid-cols-3 gap-4',
                children: [
                  e.jsx(c, {
                    icon: P,
                    title: s ? 'دليل المستخدم' : 'User Guide',
                    description: s ? 'دليل شامل للنظام' : 'Comprehensive system guide',
                    isRTL: s,
                  }),
                  e.jsx(c, {
                    icon: Q,
                    title: s ? 'دليل المدير' : 'Admin Guide',
                    description: s ? 'إدارة النظام والمستخدمين' : 'System & user management',
                    isRTL: s,
                  }),
                  e.jsx(c, {
                    icon: B,
                    title: s ? 'توثيق API' : 'API Documentation',
                    description: s ? 'للمطورين والتكامل' : 'For developers & integration',
                    isRTL: s,
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
function D({ guide: t, isRTL: s }) {
  const r = t.icon,
    o = e.jsxs(i, {
      className: `group relative overflow-hidden transition-all duration-300 ${t.comingSoon ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg hover:border-primary/50 cursor-pointer'}`,
      children: [
        e.jsx('div', {
          className: `absolute top-0 ${s ? 'right-0' : 'left-0'} w-1 h-full ${t.color}`,
        }),
        e.jsx(n, {
          className: 'pt-6 ps-5',
          children: e.jsxs('div', {
            className: 'flex items-start gap-4',
            children: [
              e.jsx('div', {
                className: `w-12 h-12 rounded-xl ${t.color} bg-opacity-10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`,
                children: e.jsx(r, { className: `size-6 ${t.color.replace('bg-', 'text-')}` }),
              }),
              e.jsxs('div', {
                className: 'flex-1 min-w-0',
                children: [
                  e.jsxs('div', {
                    className: 'flex items-center gap-2 mb-1',
                    children: [
                      e.jsx('h3', { className: 'font-semibold text-start', children: t.title }),
                      t.badge &&
                        e.jsx(h, { variant: 'secondary', className: 'text-xs', children: t.badge }),
                      t.comingSoon &&
                        e.jsx(h, {
                          variant: 'outline',
                          className: 'text-xs',
                          children: s ? 'قريبًا' : 'Coming Soon',
                        }),
                    ],
                  }),
                  e.jsx('p', {
                    className: 'text-sm text-muted-foreground text-start line-clamp-2',
                    children: t.description,
                  }),
                ],
              }),
              !t.comingSoon &&
                e.jsx(d, {
                  className: `size-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ${s ? 'rotate-180' : ''}`,
                }),
            ],
          }),
        }),
      ],
    })
  return t.comingSoon ? o : e.jsx(y, { to: t.href, children: o })
}
function c({ icon: t, title: s, description: r, isRTL: o }) {
  return e.jsx(i, {
    className: 'group hover:shadow-md transition-shadow cursor-pointer',
    children: e.jsx(n, {
      className: 'pt-6',
      children: e.jsxs('div', {
        className: 'flex items-center gap-3',
        children: [
          e.jsx('div', {
            className:
              'w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors',
            children: e.jsx(t, {
              className: 'size-5 text-muted-foreground group-hover:text-primary transition-colors',
            }),
          }),
          e.jsxs('div', {
            className: 'flex-1',
            children: [
              e.jsx('h3', { className: 'font-medium text-sm text-start', children: s }),
              e.jsx('p', { className: 'text-xs text-muted-foreground text-start', children: r }),
            ],
          }),
          e.jsx(E, { className: 'size-4 text-muted-foreground' }),
        ],
      }),
    }),
  })
}
const ae = R
export { ae as component }
//# sourceMappingURL=index-D8OXaOzF.js.map
