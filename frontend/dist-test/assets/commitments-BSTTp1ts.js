import { u as F, r as U, j as e } from './react-vendor-Buoak6m3.js'
import { L as v } from './tanstack-vendor-BZC-rs5U.js'
import {
  B as y,
  Z as O,
  _ as D,
  $ as d,
  aa as o,
  j as a,
  k as x,
  o as h,
  V as C,
  l,
  a2 as n,
  m,
} from './index-qYY0KoZ1.js'
import { A as R, a as p, b as j, c as g } from './accordion-DiUjAmkv.js'
import {
  aX as E,
  b_ as T,
  bT as S,
  b8 as A,
  cM as L,
  aH as M,
  bd as $,
  aA as I,
  aI as k,
  aM as P,
  c0 as z,
  bi as H,
  b6 as B,
  cq as q,
} from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function _() {
  const { t: i, i18n: t } = F(),
    s = t.language === 'ar',
    [r, c] = U.useState('overview')
  return e.jsxs('div', {
    className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6',
    dir: s ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'mb-6',
        children: [
          e.jsx(v, {
            to: '/help',
            children: e.jsxs(y, {
              variant: 'ghost',
              size: 'sm',
              className: 'mb-4 min-h-11',
              children: [
                e.jsx(E, { className: `size-4 ${s ? 'ms-2 rotate-180' : 'me-2'}` }),
                s ? 'العودة للمساعدة' : 'Back to Help',
              ],
            }),
          }),
          e.jsx('h1', {
            className: 'text-2xl sm:text-3xl md:text-4xl font-bold text-start mb-2',
            children: s ? 'دليل إدارة الالتزامات' : 'Commitments Management Guide',
          }),
          e.jsx('p', {
            className: 'text-sm sm:text-base text-muted-foreground text-start',
            children: s
              ? 'تعلم كيفية إنشاء وتتبع وإدارة الالتزامات المرتبطة بملفاتك'
              : 'Learn how to create, track, and manage commitments linked to your dossiers',
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8',
        children: [
          e.jsx(u, {
            icon: T,
            title: s ? 'ما هو الالتزام؟' : 'What is a Commitment?',
            description: s ? 'فهم المفهوم الأساسي' : 'Understand the core concept',
            onClick: () => c('overview'),
            isRTL: s,
          }),
          e.jsx(u, {
            icon: S,
            title: s ? 'إنشاء وإدارة' : 'Create & Manage',
            description: s ? 'عمليات CRUD' : 'CRUD operations',
            onClick: () => c('crud'),
            isRTL: s,
          }),
          e.jsx(u, {
            icon: A,
            title: s ? 'التصفية والبحث' : 'Filter & Search',
            description: s ? 'البحث عن الالتزامات' : 'Find commitments',
            onClick: () => c('filtering'),
            isRTL: s,
          }),
          e.jsx(u, {
            icon: L,
            title: s ? 'رفع الأدلة' : 'Evidence Upload',
            description: s ? 'إثبات الإنجاز' : 'Proof of completion',
            onClick: () => c('evidence'),
            isRTL: s,
          }),
        ],
      }),
      e.jsxs(O, {
        value: r,
        onValueChange: c,
        className: 'space-y-6',
        children: [
          e.jsxs(D, {
            className: 'grid w-full grid-cols-2 sm:grid-cols-4 gap-2 h-auto',
            children: [
              e.jsx(d, {
                value: 'overview',
                className: 'min-h-11 text-xs sm:text-sm',
                children: s ? 'نظرة عامة' : 'Overview',
              }),
              e.jsx(d, {
                value: 'crud',
                className: 'min-h-11 text-xs sm:text-sm',
                children: s ? 'إنشاء وإدارة' : 'Create & Manage',
              }),
              e.jsx(d, {
                value: 'filtering',
                className: 'min-h-11 text-xs sm:text-sm',
                children: s ? 'التصفية' : 'Filtering',
              }),
              e.jsx(d, {
                value: 'evidence',
                className: 'min-h-11 text-xs sm:text-sm',
                children: s ? 'الأدلة' : 'Evidence',
              }),
            ],
          }),
          e.jsx(o, {
            value: 'overview',
            className: 'space-y-6',
            children: e.jsxs(a, {
              children: [
                e.jsxs(x, {
                  children: [
                    e.jsxs(h, {
                      className: 'flex items-center gap-2 text-start',
                      children: [
                        e.jsx(T, { className: 'size-5 text-primary' }),
                        s ? 'ما هو الالتزام؟' : 'What is a Commitment?',
                      ],
                    }),
                    e.jsx(C, {
                      className: 'text-start',
                      children: s
                        ? 'الالتزام هو تعهد أو مهمة مرتبطة بملف دبلوماسي'
                        : 'A commitment is a tracked obligation or task linked to a diplomatic dossier',
                    }),
                  ],
                }),
                e.jsxs(l, {
                  className: 'space-y-4',
                  children: [
                    e.jsx('p', {
                      className: 'text-sm sm:text-base text-start',
                      children: s
                        ? 'الالتزامات هي وعود أو مهام يجب إنجازها كجزء من إدارة العلاقات الدولية. يمكن أن تكون مهام داخلية يجب على فريقك إكمالها، أو التزامات خارجية تراقبها مع الشركاء.'
                        : 'Commitments are promises or tasks that need to be fulfilled as part of managing international relationships. They can be internal tasks your team must complete, or external obligations you monitor with partners.',
                    }),
                    e.jsxs('div', {
                      className: 'grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6',
                      children: [
                        e.jsx(N, {
                          title: s ? 'العنوان والوصف' : 'Title & Description',
                          description: s
                            ? 'اسم قصير ووصف تفصيلي للالتزام'
                            : 'Short name and detailed explanation',
                          icon: M,
                          isRTL: s,
                        }),
                        e.jsx(N, {
                          title: s ? 'تاريخ الاستحقاق' : 'Due Date',
                          description: s ? 'الموعد النهائي للإنجاز' : 'Deadline for completion',
                          icon: $,
                          isRTL: s,
                        }),
                        e.jsx(N, {
                          title: s ? 'الأولوية' : 'Priority',
                          description: s
                            ? 'منخفض، متوسط، عالي، حرج'
                            : 'Low, Medium, High, Critical',
                          icon: I,
                          isRTL: s,
                        }),
                        e.jsx(N, {
                          title: s ? 'المالك' : 'Owner',
                          description: s
                            ? 'داخلي (فريقك) أو خارجي (شريك)'
                            : 'Internal (your team) or External (partner)',
                          icon: k,
                          isRTL: s,
                        }),
                      ],
                    }),
                    e.jsx(n, { className: 'my-6' }),
                    e.jsxs('div', {
                      children: [
                        e.jsx('h3', {
                          className: 'text-lg font-semibold mb-4 text-start',
                          children: s ? 'دورة حياة الحالة' : 'Status Lifecycle',
                        }),
                        e.jsxs('div', {
                          className: 'flex flex-wrap items-center justify-start gap-2 sm:gap-4',
                          children: [
                            e.jsx(w, { status: 'pending', isRTL: s }),
                            e.jsx(P, {
                              className: `size-4 text-muted-foreground ${s ? 'rotate-180' : ''}`,
                            }),
                            e.jsx(w, { status: 'in_progress', isRTL: s }),
                            e.jsx(P, {
                              className: `size-4 text-muted-foreground ${s ? 'rotate-180' : ''}`,
                            }),
                            e.jsx(w, { status: 'completed', isRTL: s }),
                          ],
                        }),
                        e.jsx('p', {
                          className: 'text-sm text-muted-foreground mt-4 text-start',
                          children: s
                            ? 'يمكن أيضًا إلغاء الالتزامات أو تصبح متأخرة تلقائيًا عند تجاوز تاريخ الاستحقاق'
                            : 'Commitments can also be cancelled, or become overdue automatically when past due date',
                        }),
                      ],
                    }),
                    e.jsx(n, { className: 'my-6' }),
                    e.jsxs('div', {
                      children: [
                        e.jsx('h3', {
                          className: 'text-lg font-semibold mb-4 text-start',
                          children: s ? 'أنواع المالكين' : 'Owner Types',
                        }),
                        e.jsxs('div', {
                          className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
                          children: [
                            e.jsx(a, {
                              className: 'border-blue-200 dark:border-blue-800',
                              children: e.jsx(l, {
                                className: 'pt-6',
                                children: e.jsxs('div', {
                                  className: 'flex items-start gap-3',
                                  children: [
                                    e.jsx('div', {
                                      className:
                                        'w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center',
                                      children: e.jsx(k, {
                                        className: 'size-5 text-blue-600 dark:text-blue-400',
                                      }),
                                    }),
                                    e.jsxs('div', {
                                      className: 'flex-1',
                                      children: [
                                        e.jsx('h4', {
                                          className: 'font-semibold text-start',
                                          children: s ? 'داخلي' : 'Internal',
                                        }),
                                        e.jsx('p', {
                                          className: 'text-sm text-muted-foreground text-start',
                                          children: s
                                            ? 'أحد أعضاء فريقك مسؤول. يتم تتبعه تلقائيًا.'
                                            : 'A team member is responsible. Tracked automatically.',
                                        }),
                                        e.jsx(m, {
                                          variant: 'secondary',
                                          className: 'mt-2',
                                          children: s ? 'تتبع تلقائي' : 'Auto Tracking',
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              }),
                            }),
                            e.jsx(a, {
                              className: 'border-purple-200 dark:border-purple-800',
                              children: e.jsx(l, {
                                className: 'pt-6',
                                children: e.jsxs('div', {
                                  className: 'flex items-start gap-3',
                                  children: [
                                    e.jsx('div', {
                                      className:
                                        'w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center',
                                      children: e.jsx(k, {
                                        className: 'size-5 text-purple-600 dark:text-purple-400',
                                      }),
                                    }),
                                    e.jsxs('div', {
                                      className: 'flex-1',
                                      children: [
                                        e.jsx('h4', {
                                          className: 'font-semibold text-start',
                                          children: s ? 'خارجي' : 'External',
                                        }),
                                        e.jsx('p', {
                                          className: 'text-sm text-muted-foreground text-start',
                                          children: s
                                            ? 'شريك أو جهة اتصال خارجية مسؤولة. تحتاج للمتابعة.'
                                            : 'A partner or external contact is responsible. Needs follow-up.',
                                        }),
                                        e.jsx(m, {
                                          variant: 'secondary',
                                          className: 'mt-2',
                                          children: s ? 'متابعة يدوية' : 'Manual Follow-up',
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
              ],
            }),
          }),
          e.jsx(o, {
            value: 'crud',
            className: 'space-y-6',
            children: e.jsxs(a, {
              children: [
                e.jsx(x, {
                  children: e.jsxs(h, {
                    className: 'flex items-center gap-2 text-start',
                    children: [
                      e.jsx(S, { className: 'size-5 text-primary' }),
                      s ? 'إنشاء وإدارة الالتزامات' : 'Create & Manage Commitments',
                    ],
                  }),
                }),
                e.jsx(l, {
                  children: e.jsxs(R, {
                    type: 'single',
                    collapsible: !0,
                    className: 'w-full',
                    children: [
                      e.jsxs(p, {
                        value: 'create',
                        children: [
                          e.jsx(j, {
                            className: 'text-start',
                            children: e.jsxs('span', {
                              className: 'flex items-center gap-2',
                              children: [
                                e.jsx(z, { className: 'size-4 text-green-600' }),
                                s ? 'إنشاء التزام جديد' : 'Create a New Commitment',
                              ],
                            }),
                          }),
                          e.jsxs(g, {
                            className: 'space-y-4',
                            children: [
                              e.jsxs('ol', {
                                className: `list-decimal ${s ? 'list-inside' : 'ms-4'} space-y-2 text-sm sm:text-base`,
                                children: [
                                  e.jsx('li', {
                                    className: 'text-start',
                                    children: s
                                      ? 'افتح ملفًا تم تعيينك عليه'
                                      : 'Open a dossier you are assigned to',
                                  }),
                                  e.jsx('li', {
                                    className: 'text-start',
                                    children: s
                                      ? 'انقر على زر "إضافة التزام"'
                                      : 'Click the "Add Commitment" button',
                                  }),
                                  e.jsx('li', {
                                    className: 'text-start',
                                    children: s
                                      ? 'املأ النموذج: العنوان، الوصف، تاريخ الاستحقاق، الأولوية، المالك'
                                      : 'Fill in the form: Title, Description, Due Date, Priority, Owner',
                                  }),
                                  e.jsx('li', {
                                    className: 'text-start',
                                    children: s
                                      ? 'اختر نوع المالك (داخلي أو خارجي)'
                                      : 'Select owner type (Internal or External)',
                                  }),
                                  e.jsx('li', {
                                    className: 'text-start',
                                    children: s
                                      ? 'انقر على "حفظ" لإنشاء الالتزام'
                                      : 'Click "Save" to create the commitment',
                                  }),
                                ],
                              }),
                              e.jsx(a, {
                                className: 'bg-muted/50',
                                children: e.jsx(l, {
                                  className: 'pt-4',
                                  children: e.jsxs('p', {
                                    className: 'text-sm text-muted-foreground text-start',
                                    children: [
                                      e.jsx('strong', { children: s ? 'نصيحة:' : 'Tip:' }),
                                      ' ',
                                      s
                                        ? 'استخدم عناوين واضحة ومحددة لتسهيل التتبع لاحقًا'
                                        : 'Use clear, specific titles to make tracking easier later',
                                    ],
                                  }),
                                }),
                              }),
                            ],
                          }),
                        ],
                      }),
                      e.jsxs(p, {
                        value: 'edit',
                        children: [
                          e.jsx(j, {
                            className: 'text-start',
                            children: e.jsxs('span', {
                              className: 'flex items-center gap-2',
                              children: [
                                e.jsx(z, { className: 'size-4 text-blue-600' }),
                                s ? 'تعديل التزام' : 'Edit a Commitment',
                              ],
                            }),
                          }),
                          e.jsx(g, {
                            className: 'space-y-4',
                            children: e.jsxs('ol', {
                              className: `list-decimal ${s ? 'list-inside' : 'ms-4'} space-y-2 text-sm sm:text-base`,
                              children: [
                                e.jsx('li', {
                                  className: 'text-start',
                                  children: s
                                    ? 'افتح قائمة الالتزامات أو انتقل إلى الملف'
                                    : 'Open the commitments list or navigate to the dossier',
                                }),
                                e.jsx('li', {
                                  className: 'text-start',
                                  children: s
                                    ? 'انقر على بطاقة الالتزام لفتح التفاصيل'
                                    : 'Click on the commitment card to open details',
                                }),
                                e.jsx('li', {
                                  className: 'text-start',
                                  children: s ? 'انقر على زر "تعديل"' : 'Click the "Edit" button',
                                }),
                                e.jsx('li', {
                                  className: 'text-start',
                                  children: s
                                    ? 'قم بتعديل الحقول المطلوبة'
                                    : 'Modify the desired fields',
                                }),
                                e.jsx('li', {
                                  className: 'text-start',
                                  children: s ? 'انقر على "حفظ التغييرات"' : 'Click "Save Changes"',
                                }),
                              ],
                            }),
                          }),
                        ],
                      }),
                      e.jsxs(p, {
                        value: 'status',
                        children: [
                          e.jsx(j, {
                            className: 'text-start',
                            children: e.jsxs('span', {
                              className: 'flex items-center gap-2',
                              children: [
                                e.jsx(H, { className: 'size-4 text-emerald-600' }),
                                s ? 'تحديث الحالة بسرعة' : 'Quick Status Update',
                              ],
                            }),
                          }),
                          e.jsxs(g, {
                            className: 'space-y-4',
                            children: [
                              e.jsx('p', {
                                className: 'text-sm sm:text-base text-start',
                                children: s
                                  ? 'يمكنك تحديث الحالة مباشرة من قائمة الالتزامات بدون فتح التفاصيل:'
                                  : 'You can update status directly from the commitments list without opening details:',
                              }),
                              e.jsxs('ol', {
                                className: `list-decimal ${s ? 'list-inside' : 'ms-4'} space-y-2 text-sm sm:text-base`,
                                children: [
                                  e.jsx('li', {
                                    className: 'text-start',
                                    children: s
                                      ? 'ابحث عن شارة الحالة على بطاقة الالتزام'
                                      : 'Find the status badge on the commitment card',
                                  }),
                                  e.jsx('li', {
                                    className: 'text-start',
                                    children: s
                                      ? 'انقر على الشارة لفتح قائمة الحالات'
                                      : 'Tap the badge to open the status dropdown',
                                  }),
                                  e.jsx('li', {
                                    className: 'text-start',
                                    children: s ? 'اختر الحالة الجديدة' : 'Select the new status',
                                  }),
                                  e.jsx('li', {
                                    className: 'text-start',
                                    children: s
                                      ? 'سيتم التحديث فورًا!'
                                      : 'Update happens immediately!',
                                  }),
                                ],
                              }),
                              e.jsx(a, {
                                className:
                                  'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
                                children: e.jsx(l, {
                                  className: 'pt-4',
                                  children: e.jsxs('p', {
                                    className:
                                      'text-sm text-amber-800 dark:text-amber-200 text-start',
                                    children: [
                                      e.jsx('strong', { children: s ? 'ملاحظة:' : 'Note:' }),
                                      ' ',
                                      s
                                        ? 'لا يمكن إرجاع الحالة من "مكتمل" إلى "معلق" إلا للمسؤولين'
                                        : 'Status cannot be reverted from "Completed" to "Pending" except by admins',
                                    ],
                                  }),
                                }),
                              }),
                            ],
                          }),
                        ],
                      }),
                      e.jsxs(p, {
                        value: 'delete',
                        children: [
                          e.jsx(j, {
                            className: 'text-start',
                            children: e.jsxs('span', {
                              className: 'flex items-center gap-2',
                              children: [
                                e.jsx(B, { className: 'size-4 text-red-600' }),
                                s ? 'إلغاء أو حذف التزام' : 'Cancel or Delete a Commitment',
                              ],
                            }),
                          }),
                          e.jsxs(g, {
                            className: 'space-y-4',
                            children: [
                              e.jsx('p', {
                                className: 'text-sm sm:text-base text-start',
                                children: s
                                  ? 'بدلاً من الحذف، نوصي بإلغاء الالتزامات للحفاظ على السجل:'
                                  : 'Instead of deleting, we recommend cancelling commitments to preserve history:',
                              }),
                              e.jsxs('ol', {
                                className: `list-decimal ${s ? 'list-inside' : 'ms-4'} space-y-2 text-sm sm:text-base`,
                                children: [
                                  e.jsx('li', {
                                    className: 'text-start',
                                    children: s
                                      ? 'افتح تفاصيل الالتزام'
                                      : 'Open the commitment details',
                                  }),
                                  e.jsx('li', {
                                    className: 'text-start',
                                    children: s
                                      ? 'انقر على "إلغاء الالتزام"'
                                      : 'Click "Cancel Commitment"',
                                  }),
                                  e.jsx('li', {
                                    className: 'text-start',
                                    children: s
                                      ? 'أضف سبب الإلغاء (اختياري)'
                                      : 'Add a cancellation reason (optional)',
                                  }),
                                  e.jsx('li', {
                                    className: 'text-start',
                                    children: s ? 'أكد الإلغاء' : 'Confirm cancellation',
                                  }),
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
          }),
          e.jsx(o, {
            value: 'filtering',
            className: 'space-y-6',
            children: e.jsxs(a, {
              children: [
                e.jsxs(x, {
                  children: [
                    e.jsxs(h, {
                      className: 'flex items-center gap-2 text-start',
                      children: [
                        e.jsx(A, { className: 'size-5 text-primary' }),
                        s ? 'التصفية والبحث' : 'Filtering & Searching',
                      ],
                    }),
                    e.jsx(C, {
                      className: 'text-start',
                      children: s
                        ? 'ابحث عن الالتزامات بسرعة باستخدام المرشحات'
                        : 'Find commitments quickly using filters',
                    }),
                  ],
                }),
                e.jsxs(l, {
                  className: 'space-y-6',
                  children: [
                    e.jsxs('div', {
                      children: [
                        e.jsx('h3', {
                          className: 'text-lg font-semibold mb-4 text-start',
                          children: s ? 'خيارات التصفية المتاحة' : 'Available Filter Options',
                        }),
                        e.jsxs('div', {
                          className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
                          children: [
                            e.jsx(b, {
                              title: s ? 'الحالة' : 'Status',
                              options: s
                                ? ['معلق', 'قيد التنفيذ', 'مكتمل', 'ملغى', 'متأخر']
                                : ['Pending', 'In Progress', 'Completed', 'Cancelled', 'Overdue'],
                              isRTL: s,
                            }),
                            e.jsx(b, {
                              title: s ? 'الأولوية' : 'Priority',
                              options: s
                                ? ['منخفض', 'متوسط', 'عالي', 'حرج']
                                : ['Low', 'Medium', 'High', 'Critical'],
                              isRTL: s,
                            }),
                            e.jsx(b, {
                              title: s ? 'نوع المالك' : 'Owner Type',
                              options: s ? ['داخلي', 'خارجي'] : ['Internal', 'External'],
                              isRTL: s,
                            }),
                            e.jsx(b, {
                              title: s ? 'نطاق التاريخ' : 'Date Range',
                              options: s ? ['من تاريخ', 'إلى تاريخ'] : ['From Date', 'To Date'],
                              isRTL: s,
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsx(n, {}),
                    e.jsxs('div', {
                      children: [
                        e.jsx('h3', {
                          className: 'text-lg font-semibold mb-4 text-start',
                          children: s ? 'مشاركة عبر الرابط' : 'URL Sharing',
                        }),
                        e.jsx('p', {
                          className: 'text-sm sm:text-base text-start mb-4',
                          children: s
                            ? 'المرشحات المطبقة يتم حفظها في عنوان URL. يمكنك نسخ الرابط ومشاركته مع الزملاء!'
                            : 'Applied filters are saved in the URL. You can copy and share the link with colleagues!',
                        }),
                        e.jsx(a, {
                          className: 'bg-muted/50',
                          children: e.jsx(l, {
                            className: 'pt-4',
                            children: e.jsx('code', {
                              className: 'text-xs sm:text-sm break-all',
                              children:
                                '/commitments?status=pending,in_progress&priority=high,critical&overdue=true',
                            }),
                          }),
                        }),
                      ],
                    }),
                    e.jsx(n, {}),
                    e.jsxs('div', {
                      children: [
                        e.jsx('h3', {
                          className: 'text-lg font-semibold mb-4 text-start',
                          children: s ? 'شرائح المرشحات' : 'Filter Chips',
                        }),
                        e.jsx('p', {
                          className: 'text-sm sm:text-base text-start mb-4',
                          children: s
                            ? 'المرشحات النشطة تظهر كشرائح فوق القائمة. انقر على X لإزالة مرشح معين.'
                            : 'Active filters appear as chips above the list. Click X to remove a specific filter.',
                        }),
                        e.jsxs('div', {
                          className: 'flex flex-wrap gap-2',
                          children: [
                            e.jsxs(m, {
                              variant: 'secondary',
                              className: 'flex items-center gap-1',
                              children: [
                                s ? 'الحالة: معلق' : 'Status: Pending',
                                e.jsx('span', { className: 'ms-1 cursor-pointer', children: '×' }),
                              ],
                            }),
                            e.jsxs(m, {
                              variant: 'secondary',
                              className: 'flex items-center gap-1',
                              children: [
                                s ? 'الأولوية: عالي' : 'Priority: High',
                                e.jsx('span', { className: 'ms-1 cursor-pointer', children: '×' }),
                              ],
                            }),
                            e.jsxs(m, {
                              variant: 'secondary',
                              className: 'flex items-center gap-1',
                              children: [
                                s ? 'متأخر فقط' : 'Overdue Only',
                                e.jsx('span', { className: 'ms-1 cursor-pointer', children: '×' }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),
          e.jsx(o, {
            value: 'evidence',
            className: 'space-y-6',
            children: e.jsxs(a, {
              children: [
                e.jsxs(x, {
                  children: [
                    e.jsxs(h, {
                      className: 'flex items-center gap-2 text-start',
                      children: [
                        e.jsx(L, { className: 'size-5 text-primary' }),
                        s ? 'رفع الأدلة والإثباتات' : 'Evidence Upload',
                      ],
                    }),
                    e.jsx(C, {
                      className: 'text-start',
                      children: s
                        ? 'رفع المستندات كدليل على إنجاز الالتزام'
                        : 'Upload documents as proof of commitment completion',
                    }),
                  ],
                }),
                e.jsxs(l, {
                  className: 'space-y-6',
                  children: [
                    e.jsxs('div', {
                      children: [
                        e.jsx('h3', {
                          className: 'text-lg font-semibold mb-4 text-start',
                          children: s ? 'متى يجب الرفع؟' : 'When to Upload?',
                        }),
                        e.jsx('p', {
                          className: 'text-sm sm:text-base text-start',
                          children: s
                            ? 'بعض الالتزامات تتطلب إثباتًا للإنجاز. ستظهر أيقونة رفع على البطاقة عندما يكون "الإثبات مطلوب" مفعلًا.'
                            : 'Some commitments require proof of completion. An upload icon appears on the card when "Proof Required" is enabled.',
                        }),
                      ],
                    }),
                    e.jsx(n, {}),
                    e.jsxs('div', {
                      children: [
                        e.jsx('h3', {
                          className: 'text-lg font-semibold mb-4 text-start',
                          children: s ? 'الصيغ المدعومة' : 'Supported Formats',
                        }),
                        e.jsxs('div', {
                          className: 'grid grid-cols-2 sm:grid-cols-4 gap-4',
                          children: [
                            e.jsx(f, { format: 'PDF', color: 'red' }),
                            e.jsx(f, { format: 'JPG', color: 'green' }),
                            e.jsx(f, { format: 'PNG', color: 'blue' }),
                            e.jsx(f, { format: 'DOCX', color: 'indigo' }),
                          ],
                        }),
                        e.jsx('p', {
                          className: 'text-sm text-muted-foreground mt-4 text-start',
                          children: s
                            ? 'الحد الأقصى لحجم الملف: 10 ميجابايت'
                            : 'Maximum file size: 10MB',
                        }),
                      ],
                    }),
                    e.jsx(n, {}),
                    e.jsxs('div', {
                      children: [
                        e.jsx('h3', {
                          className: 'text-lg font-semibold mb-4 text-start',
                          children: s ? 'خطوات الرفع' : 'Upload Steps',
                        }),
                        e.jsxs('ol', {
                          className: `list-decimal ${s ? 'list-inside' : 'ms-4'} space-y-2 text-sm sm:text-base`,
                          children: [
                            e.jsx('li', {
                              className: 'text-start',
                              children: s
                                ? 'افتح تفاصيل الالتزام الذي يتطلب إثباتًا'
                                : 'Open the commitment details that requires proof',
                            }),
                            e.jsx('li', {
                              className: 'text-start',
                              children: s
                                ? 'انقر على زر "رفع دليل"'
                                : 'Click the "Upload Evidence" button',
                            }),
                            e.jsx('li', {
                              className: 'text-start',
                              children: s
                                ? 'على الجوال: اختر "التقاط صورة" أو "اختيار ملف"'
                                : 'On mobile: Choose "Take Photo" or "Choose File"',
                            }),
                            e.jsx('li', {
                              className: 'text-start',
                              children: s
                                ? 'انتظر اكتمال الرفع (ستظهر نسبة التقدم)'
                                : 'Wait for upload to complete (progress bar will show)',
                            }),
                            e.jsx('li', {
                              className: 'text-start',
                              children: s
                                ? 'سيتم تسجيل وقت الرفع تلقائيًا'
                                : 'Timestamp will be recorded automatically',
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsx(n, {}),
                    e.jsxs('div', {
                      children: [
                        e.jsx('h3', {
                          className: 'text-lg font-semibold mb-4 text-start',
                          children: s ? 'عرض الأدلة المرفوعة' : 'Viewing Uploaded Evidence',
                        }),
                        e.jsx('p', {
                          className: 'text-sm sm:text-base text-start',
                          children: s
                            ? 'بعد الرفع، ستظهر الأدلة في تفاصيل الالتزام مع رابط تنزيل ووقت الرفع.'
                            : 'After upload, evidence appears in commitment details with a download link and upload timestamp.',
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
      e.jsx(a, {
        className: 'mt-8',
        children: e.jsx(l, {
          className: 'pt-6',
          children: e.jsxs('div', {
            className:
              'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
            children: [
              e.jsxs('div', {
                children: [
                  e.jsx('h3', {
                    className: 'font-semibold text-start',
                    children: s ? 'هل تحتاج مساعدة إضافية؟' : 'Need more help?',
                  }),
                  e.jsx('p', {
                    className: 'text-sm text-muted-foreground text-start',
                    children: s
                      ? 'تواصل مع فريق الدعم أو عد إلى صفحة المساعدة الرئيسية'
                      : 'Contact support or go back to the main help page',
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'flex gap-2',
                children: [
                  e.jsx(v, {
                    to: '/help',
                    children: e.jsx(y, {
                      variant: 'outline',
                      className: 'min-h-11',
                      children: s ? 'صفحة المساعدة' : 'Help Page',
                    }),
                  }),
                  e.jsx(v, {
                    to: '/commitments',
                    children: e.jsxs(y, {
                      className: 'min-h-11',
                      children: [
                        s ? 'فتح الالتزامات' : 'Open Commitments',
                        e.jsx(q, { className: `size-4 ${s ? 'me-2 rotate-180' : 'ms-2'}` }),
                      ],
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
function u({ icon: i, title: t, description: s, onClick: r, isRTL: c }) {
  return e.jsx(a, {
    className: 'cursor-pointer hover:shadow-md transition-shadow',
    onClick: r,
    children: e.jsx(l, {
      className: 'pt-6',
      children: e.jsxs('div', {
        className: 'flex items-center gap-3',
        children: [
          e.jsx('div', {
            className: 'w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center',
            children: e.jsx(i, { className: 'size-5 text-primary' }),
          }),
          e.jsxs('div', {
            className: 'flex-1',
            children: [
              e.jsx('h3', { className: 'font-semibold text-sm text-start', children: t }),
              e.jsx('p', { className: 'text-xs text-muted-foreground text-start', children: s }),
            ],
          }),
        ],
      }),
    }),
  })
}
function N({ title: i, description: t, icon: s, isRTL: r }) {
  return e.jsxs('div', {
    className: 'flex items-start gap-3 p-4 rounded-lg bg-muted/50',
    children: [
      e.jsx(s, { className: 'size-5 text-primary mt-0.5' }),
      e.jsxs('div', {
        children: [
          e.jsx('h4', { className: 'font-medium text-sm text-start', children: i }),
          e.jsx('p', { className: 'text-xs text-muted-foreground text-start', children: t }),
        ],
      }),
    ],
  })
}
function w({ status: i, isRTL: t }) {
  const s = {
      pending: {
        label: 'Pending',
        arLabel: 'معلق',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      },
      in_progress: {
        label: 'In Progress',
        arLabel: 'قيد التنفيذ',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      },
      completed: {
        label: 'Completed',
        arLabel: 'مكتمل',
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      },
    },
    r = s[i] || s.pending
  return e.jsx(m, { className: r.className, children: t ? r.arLabel : r.label })
}
function b({ title: i, options: t, isRTL: s }) {
  return e.jsxs('div', {
    className: 'p-4 rounded-lg border bg-card',
    children: [
      e.jsx('h4', { className: 'font-medium text-sm mb-2 text-start', children: i }),
      e.jsx('div', {
        className: 'flex flex-wrap gap-1',
        children: t.map((r, c) =>
          e.jsx(m, { variant: 'outline', className: 'text-xs', children: r }, c),
        ),
      }),
    ],
  })
}
function f({ format: i, color: t }) {
  const s = {
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  }
  return e.jsx('div', {
    className: `flex items-center justify-center p-4 rounded-lg ${s[t]}`,
    children: e.jsx('span', { className: 'font-mono font-bold', children: i }),
  })
}
const te = _
export { te as component }
//# sourceMappingURL=commitments-BSTTp1ts.js.map
