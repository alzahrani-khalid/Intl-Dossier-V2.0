import { u as R, r as f, j as e } from './react-vendor-Buoak6m3.js'
import { c as Z, d as W, a as be, L as Te } from './tanstack-vendor-BZC-rs5U.js'
import {
  c as b,
  ah as Ce,
  ai as Se,
  B as v,
  aj as Ee,
  ak as ie,
  q as L,
  r as F,
  t as P,
  v as G,
  w as O,
  m as ee,
  I as E,
  s as _e,
  a0 as D,
  C as Ie,
  j as z,
  l as B,
  k as H,
  o as ce,
  p as De,
  A as qe,
  E as Oe,
  F as Ae,
  G as Re,
  J as A,
  X as Le,
  K as Fe,
  V as Pe,
} from './index-qYY0KoZ1.js'
import { C as de, a as me, b as ue } from './collapsible-BZnv9hxQ.js'
import {
  aR as J,
  aD as ae,
  aN as Q,
  b6 as Ge,
  dv as ze,
  dw as Be,
  b9 as Me,
  dx as fe,
  aI as Y,
  bd as je,
  b8 as U,
  dy as Je,
  cR as te,
  dz as se,
  aK as re,
  aT as le,
  cf as ge,
  dm as Ye,
  bh as He,
  be as Ve,
  aH as q,
  aE as I,
  aM as Qe,
  aO as pe,
  bG as ve,
  bp as Ue,
  bq as $e,
  aS as he,
  bw as xe,
  bV as Ke,
} from './vendor-misc-BiJvMP0A.js'
import {
  A as Xe,
  a as Ze,
  b as We,
  c as ea,
  d as aa,
  e as ta,
  f as sa,
  g as ra,
} from './alert-dialog-DaWYDPc1.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
const la = [
  {
    name: 'title_en',
    label_en: 'Title (English)',
    label_ar: 'العنوان (إنجليزي)',
    type: 'text',
    entity_types: ['dossier', 'engagement', 'position', 'document'],
    operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with'],
  },
  {
    name: 'title_ar',
    label_en: 'Title (Arabic)',
    label_ar: 'العنوان (عربي)',
    type: 'text',
    entity_types: ['dossier', 'engagement', 'position', 'document'],
    operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with'],
  },
  {
    name: 'status',
    label_en: 'Status',
    label_ar: 'الحالة',
    type: 'select',
    entity_types: ['dossier', 'engagement', 'position'],
    operators: ['equals', 'not_equals', 'in', 'not_in'],
    options: [
      { value: 'active', label_en: 'Active', label_ar: 'نشط' },
      { value: 'inactive', label_en: 'Inactive', label_ar: 'غير نشط' },
      { value: 'archived', label_en: 'Archived', label_ar: 'مؤرشف' },
      { value: 'draft', label_en: 'Draft', label_ar: 'مسودة' },
      { value: 'published', label_en: 'Published', label_ar: 'منشور' },
    ],
  },
  {
    name: 'type',
    label_en: 'Dossier Type',
    label_ar: 'نوع الملف',
    type: 'select',
    entity_types: ['dossier'],
    operators: ['equals', 'not_equals', 'in', 'not_in'],
    options: [
      { value: 'country', label_en: 'Country', label_ar: 'دولة' },
      { value: 'organization', label_en: 'Organization', label_ar: 'منظمة' },
      { value: 'forum', label_en: 'Forum', label_ar: 'منتدى' },
      { value: 'engagement', label_en: 'Engagement', label_ar: 'مشاركة' },
      { value: 'theme', label_en: 'Theme', label_ar: 'موضوع' },
    ],
  },
  {
    name: 'sensitivity_level',
    label_en: 'Sensitivity Level',
    label_ar: 'مستوى الحساسية',
    type: 'select',
    entity_types: ['dossier', 'document'],
    operators: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal'],
    options: [
      { value: 'low', label_en: 'Low', label_ar: 'منخفض' },
      { value: 'medium', label_en: 'Medium', label_ar: 'متوسط' },
      { value: 'high', label_en: 'High', label_ar: 'عالي' },
    ],
  },
  {
    name: 'tags',
    label_en: 'Tags',
    label_ar: 'الوسوم',
    type: 'multi-select',
    entity_types: ['dossier'],
    operators: ['contains', 'not_contains'],
  },
  {
    name: 'created_at',
    label_en: 'Created Date',
    label_ar: 'تاريخ الإنشاء',
    type: 'date',
    entity_types: ['dossier', 'engagement', 'position', 'document', 'person'],
    operators: [
      'equals',
      'not_equals',
      'greater_than',
      'less_than',
      'greater_equal',
      'less_equal',
      'between',
    ],
  },
  {
    name: 'updated_at',
    label_en: 'Updated Date',
    label_ar: 'تاريخ التحديث',
    type: 'date',
    entity_types: ['dossier', 'engagement', 'position', 'document', 'person'],
    operators: [
      'equals',
      'not_equals',
      'greater_than',
      'less_than',
      'greater_equal',
      'less_equal',
      'between',
    ],
  },
  {
    name: 'start_date',
    label_en: 'Start Date',
    label_ar: 'تاريخ البدء',
    type: 'date',
    entity_types: ['engagement'],
    operators: [
      'equals',
      'not_equals',
      'greater_than',
      'less_than',
      'greater_equal',
      'less_equal',
      'between',
    ],
  },
  {
    name: 'end_date',
    label_en: 'End Date',
    label_ar: 'تاريخ الانتهاء',
    type: 'date',
    entity_types: ['engagement'],
    operators: [
      'equals',
      'not_equals',
      'greater_than',
      'less_than',
      'greater_equal',
      'less_equal',
      'between',
    ],
  },
  {
    name: 'location',
    label_en: 'Location',
    label_ar: 'الموقع',
    type: 'text',
    entity_types: ['engagement'],
    operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with'],
  },
  {
    name: 'file_type',
    label_en: 'File Type',
    label_ar: 'نوع الملف',
    type: 'select',
    entity_types: ['document'],
    operators: ['equals', 'not_equals', 'in', 'not_in'],
    options: [
      { value: 'pdf', label_en: 'PDF', label_ar: 'PDF' },
      { value: 'doc', label_en: 'Word Document', label_ar: 'مستند وورد' },
      { value: 'docx', label_en: 'Word Document', label_ar: 'مستند وورد' },
      { value: 'xls', label_en: 'Excel Spreadsheet', label_ar: 'جدول إكسل' },
      { value: 'xlsx', label_en: 'Excel Spreadsheet', label_ar: 'جدول إكسل' },
      { value: 'ppt', label_en: 'PowerPoint', label_ar: 'باوربوينت' },
      { value: 'pptx', label_en: 'PowerPoint', label_ar: 'باوربوينت' },
      { value: 'txt', label_en: 'Text File', label_ar: 'ملف نصي' },
      { value: 'csv', label_en: 'CSV', label_ar: 'CSV' },
    ],
  },
  {
    name: 'file_size',
    label_en: 'File Size (bytes)',
    label_ar: 'حجم الملف (بايت)',
    type: 'number',
    entity_types: ['document'],
    operators: [
      'equals',
      'not_equals',
      'greater_than',
      'less_than',
      'greater_equal',
      'less_equal',
      'between',
    ],
  },
  {
    name: 'email',
    label_en: 'Email',
    label_ar: 'البريد الإلكتروني',
    type: 'text',
    entity_types: ['person'],
    operators: ['equals', 'not_equals', 'contains', 'not_contains', 'ends_with'],
  },
  {
    name: 'department',
    label_en: 'Department',
    label_ar: 'القسم',
    type: 'text',
    entity_types: ['person'],
    operators: ['equals', 'not_equals', 'contains', 'not_contains'],
  },
]
function na(a) {
  return la.filter((s) => s.entity_types.some((r) => a.includes(r)))
}
function V(a) {
  const s = {
    equals: { label_en: 'Equals', label_ar: 'يساوي' },
    not_equals: { label_en: 'Not Equals', label_ar: 'لا يساوي' },
    contains: { label_en: 'Contains', label_ar: 'يحتوي على' },
    not_contains: { label_en: 'Does Not Contain', label_ar: 'لا يحتوي على' },
    starts_with: { label_en: 'Starts With', label_ar: 'يبدأ بـ' },
    ends_with: { label_en: 'Ends With', label_ar: 'ينتهي بـ' },
    greater_than: { label_en: 'Greater Than', label_ar: 'أكبر من' },
    less_than: { label_en: 'Less Than', label_ar: 'أصغر من' },
    greater_equal: { label_en: 'Greater or Equal', label_ar: 'أكبر أو يساوي' },
    less_equal: { label_en: 'Less or Equal', label_ar: 'أصغر أو يساوي' },
    between: { label_en: 'Between', label_ar: 'بين' },
    not_between: { label_en: 'Not Between', label_ar: 'ليس بين' },
    in: { label_en: 'In List', label_ar: 'في القائمة' },
    not_in: { label_en: 'Not In List', label_ar: 'ليس في القائمة' },
    is_null: { label_en: 'Is Empty', label_ar: 'فارغ' },
    is_not_null: { label_en: 'Is Not Empty', label_ar: 'غير فارغ' },
    matches_regex: { label_en: 'Matches Pattern', label_ar: 'يطابق النمط' },
  }
  return {
    text: [
      'equals',
      'not_equals',
      'contains',
      'not_contains',
      'starts_with',
      'ends_with',
      'is_null',
      'is_not_null',
    ],
    number: [
      'equals',
      'not_equals',
      'greater_than',
      'less_than',
      'greater_equal',
      'less_equal',
      'between',
      'is_null',
      'is_not_null',
    ],
    date: [
      'equals',
      'not_equals',
      'greater_than',
      'less_than',
      'greater_equal',
      'less_equal',
      'between',
      'is_null',
      'is_not_null',
    ],
    boolean: ['equals', 'not_equals'],
    select: ['equals', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null'],
    'multi-select': ['contains', 'not_contains', 'is_null', 'is_not_null'],
  }[a].map((l) => ({ value: l, ...s[l] }))
}
const M = {
    today: { label_en: 'Today', label_ar: 'اليوم' },
    yesterday: { label_en: 'Yesterday', label_ar: 'أمس' },
    last_7_days: { label_en: 'Last 7 Days', label_ar: 'آخر 7 أيام' },
    last_30_days: { label_en: 'Last 30 Days', label_ar: 'آخر 30 يوماً' },
    last_90_days: { label_en: 'Last 90 Days', label_ar: 'آخر 90 يوماً' },
    this_month: { label_en: 'This Month', label_ar: 'هذا الشهر' },
    this_year: { label_en: 'This Year', label_ar: 'هذه السنة' },
    next_7_days: { label_en: 'Next 7 Days', label_ar: 'الأيام السبعة القادمة' },
    next_30_days: { label_en: 'Next 30 Days', label_ar: 'الثلاثون يوماً القادمة' },
  },
  $ = {
    dossier: { label_en: 'Dossier', label_ar: 'ملف', icon: 'folder' },
    engagement: { label_en: 'Engagement', label_ar: 'مشاركة', icon: 'calendar' },
    position: { label_en: 'Position', label_ar: 'موقف', icon: 'file-text' },
    document: { label_en: 'Document', label_ar: 'مستند', icon: 'file' },
    person: { label_en: 'Person', label_ar: 'شخص', icon: 'user' },
    organization: { label_en: 'Organization', label_ar: 'منظمة', icon: 'building' },
    forum: { label_en: 'Forum', label_ar: 'منتدى', icon: 'users' },
    country: { label_en: 'Country', label_ar: 'دولة', icon: 'globe' },
    theme: { label_en: 'Theme', label_ar: 'موضوع', icon: 'tag' },
  }
function oa({ value: a, onChange: s, className: r }) {
  const { t: l, i18n: o } = R('advanced-search'),
    m = o.language === 'ar',
    [k, i] = f.useState(!1),
    [h, c] = f.useState(a?.preset ? 'preset' : 'custom'),
    C = [
      'today',
      'yesterday',
      'last_7_days',
      'last_30_days',
      'last_90_days',
      'this_month',
      'this_year',
      'next_7_days',
      'next_30_days',
    ],
    j = (g) => {
      ;(s({ preset: g, from: null, to: null }), i(!1))
    },
    _ = (g, d) => {
      d &&
        s({
          preset: null,
          from: g === 'from' ? d.toISOString() : a?.from || null,
          to: g === 'to' ? d.toISOString() : a?.to || null,
        })
    },
    u = () => {
      ;(s(null), i(!1))
    },
    N = () => {
      if (!a) return l('dateRange.preset')
      if (a.preset) return m ? M[a.preset].label_ar : M[a.preset].label_en
      if (a.from || a.to) {
        const g = a.from ? new Date(a.from).toLocaleDateString() : '...',
          d = a.to ? new Date(a.to).toLocaleDateString() : '...'
        return `${g} - ${d}`
      }
      return l('dateRange.preset')
    }
  return e.jsxs('div', {
    className: b('flex flex-col gap-2', r),
    dir: m ? 'rtl' : 'ltr',
    children: [
      e.jsx('label', {
        className: 'text-sm font-medium text-gray-700 dark:text-gray-300',
        children: l('dateRange.title'),
      }),
      e.jsxs(Ce, {
        open: k,
        onOpenChange: i,
        children: [
          e.jsx(Se, {
            asChild: !0,
            children: e.jsxs(v, {
              variant: 'outline',
              className: b('w-full justify-between min-h-11 px-3', a && 'text-foreground'),
              children: [
                e.jsxs('span', {
                  className: 'flex items-center gap-2',
                  children: [
                    e.jsx(J, { className: 'h-4 w-4 text-muted-foreground' }),
                    e.jsx('span', { className: 'truncate', children: N() }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'flex items-center gap-1',
                  children: [
                    a &&
                      e.jsx('button', {
                        type: 'button',
                        onClick: (g) => {
                          ;(g.stopPropagation(), u())
                        },
                        className: 'p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700',
                        'aria-label': l('dateRange.clear'),
                        children: e.jsx(ae, { className: 'h-3 w-3' }),
                      }),
                    e.jsx(Q, { className: b('h-4 w-4 transition-transform', k && 'rotate-180') }),
                  ],
                }),
              ],
            }),
          }),
          e.jsx(Ee, {
            className: 'w-auto p-0',
            align: m ? 'end' : 'start',
            side: 'bottom',
            children: e.jsx('div', {
              className: 'flex flex-col sm:flex-row',
              children: e.jsxs('div', {
                className: 'border-b sm:border-b-0 sm:border-e p-2 sm:p-3',
                children: [
                  e.jsxs('div', {
                    className: 'flex gap-2 mb-2',
                    children: [
                      e.jsx(v, {
                        variant: h === 'preset' ? 'default' : 'ghost',
                        size: 'sm',
                        onClick: () => c('preset'),
                        className: 'flex-1',
                        children: l('dateRange.preset'),
                      }),
                      e.jsx(v, {
                        variant: h === 'custom' ? 'default' : 'ghost',
                        size: 'sm',
                        onClick: () => c('custom'),
                        className: 'flex-1',
                        children: l('dateRange.custom'),
                      }),
                    ],
                  }),
                  h === 'preset' &&
                    e.jsx('div', {
                      className: 'flex flex-col gap-1 max-h-64 overflow-y-auto',
                      children: C.map((g) => {
                        const d = m ? M[g].label_ar : M[g].label_en,
                          S = a?.preset === g
                        return e.jsx(
                          'button',
                          {
                            type: 'button',
                            onClick: () => j(g),
                            className: b(
                              'w-full text-start px-3 py-2 rounded-md text-sm transition-colors min-h-10',
                              S
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                            ),
                            children: d,
                          },
                          g,
                        )
                      }),
                    }),
                  h === 'custom' &&
                    e.jsxs('div', {
                      className: 'flex flex-col gap-3 mt-3',
                      children: [
                        e.jsxs('div', {
                          children: [
                            e.jsx('label', {
                              className: 'text-xs font-medium text-gray-500 mb-1 block',
                              children: l('dateRange.from'),
                            }),
                            e.jsx(ie, {
                              mode: 'single',
                              selected: a?.from ? new Date(a.from) : void 0,
                              onSelect: (g) => _('from', g),
                              className: 'rounded-md border',
                            }),
                          ],
                        }),
                        e.jsxs('div', {
                          children: [
                            e.jsx('label', {
                              className: 'text-xs font-medium text-gray-500 mb-1 block',
                              children: l('dateRange.to'),
                            }),
                            e.jsx(ie, {
                              mode: 'single',
                              selected: a?.to ? new Date(a.to) : void 0,
                              onSelect: (g) => _('to', g),
                              className: 'rounded-md border',
                              disabled: (g) => (a?.from ? g < new Date(a.from) : !1),
                            }),
                          ],
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
  })
}
function ia({
  conditions: a,
  entityTypes: s,
  logic: r,
  onConditionAdd: l,
  onConditionUpdate: o,
  onConditionRemove: m,
  onLogicChange: k,
  onClear: i,
  className: h,
}) {
  const { t: c, i18n: C } = R('advanced-search'),
    j = C.language === 'ar',
    _ = na(s),
    u = () => {
      if (_.length === 0) return
      const n = _[0],
        t = V(n.type)
      l({ field_name: n.name, operator: t[0]?.value || 'equals', value: '', is_negated: !1 })
    },
    N = (n, t) => {
      const x = _.find((we) => we.name === t)
      if (!x) return
      const p = V(x.type),
        y = a[n]
      o(n, {
        ...y,
        field_name: t,
        operator: p[0]?.value || 'equals',
        value: x.type === 'boolean' ? !1 : '',
      })
    },
    g = (n, t) => {
      o(n, { ...a[n], operator: t })
    },
    d = (n, t) => {
      o(n, { ...a[n], value: t })
    },
    S = (n) => {
      o(n, { ...a[n], is_negated: !a[n].is_negated })
    },
    w = (n, t) => {
      const x = _.find((p) => p.name === n.field_name)
      if (!x || n.operator === 'is_null' || n.operator === 'is_not_null') return null
      switch (x.type) {
        case 'select':
          return e.jsxs(L, {
            value: n.value,
            onValueChange: (p) => d(t, p),
            children: [
              e.jsx(F, {
                className: 'flex-1 min-h-10',
                children: e.jsx(P, { placeholder: c('conditions.placeholder') }),
              }),
              e.jsx(G, {
                children: x.options?.map((p) =>
                  e.jsx(O, { value: p.value, children: j ? p.label_ar : p.label_en }, p.value),
                ),
              }),
            ],
          })
        case 'multi-select':
          return e.jsx(E, {
            type: 'text',
            value: Array.isArray(n.value) ? n.value.join(', ') : n.value || '',
            onChange: (p) =>
              d(
                t,
                p.target.value
                  .split(',')
                  .map((y) => y.trim())
                  .filter(Boolean),
              ),
            placeholder: c('conditions.placeholder'),
            className: 'flex-1 min-h-10',
          })
        case 'number':
          return e.jsx(E, {
            type: 'number',
            value: n.value || '',
            onChange: (p) => d(t, p.target.value ? Number(p.target.value) : ''),
            placeholder: c('conditions.placeholder'),
            className: 'flex-1 min-h-10',
          })
        case 'date':
          return e.jsx(E, {
            type: 'date',
            value: n.value || '',
            onChange: (p) => d(t, p.target.value),
            className: 'flex-1 min-h-10',
          })
        case 'boolean':
          return e.jsxs(L, {
            value: String(n.value),
            onValueChange: (p) => d(t, p === 'true'),
            children: [
              e.jsx(F, { className: 'flex-1 min-h-10', children: e.jsx(P, {}) }),
              e.jsxs(G, {
                children: [
                  e.jsx(O, { value: 'true', children: 'Yes' }),
                  e.jsx(O, { value: 'false', children: 'No' }),
                ],
              }),
            ],
          })
        default:
          return e.jsx(E, {
            type: 'text',
            value: n.value || '',
            onChange: (p) => d(t, p.target.value),
            placeholder: c('conditions.placeholder'),
            className: 'flex-1 min-h-10',
          })
      }
    }
  return e.jsxs('div', {
    className: b('flex flex-col gap-4', h),
    dir: j ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
        children: [
          e.jsx('h3', {
            className: 'text-sm font-medium text-gray-700 dark:text-gray-300',
            children: c('conditions.title'),
          }),
          e.jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1',
                children: [
                  e.jsx('button', {
                    type: 'button',
                    onClick: () => k('AND'),
                    className: b(
                      'px-3 py-1 rounded text-sm font-medium transition-colors',
                      r === 'AND'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100',
                    ),
                    children: c('logic.and'),
                  }),
                  e.jsx('button', {
                    type: 'button',
                    onClick: () => k('OR'),
                    className: b(
                      'px-3 py-1 rounded text-sm font-medium transition-colors',
                      r === 'OR'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100',
                    ),
                    children: c('logic.or'),
                  }),
                ],
              }),
              a.length > 0 &&
                e.jsxs(v, {
                  variant: 'ghost',
                  size: 'sm',
                  onClick: i,
                  children: [e.jsx(Ge, { className: 'h-4 w-4 me-1' }), c('filters.clear')],
                }),
            ],
          }),
        ],
      }),
      e.jsx('p', {
        className: 'text-xs text-gray-500 dark:text-gray-400',
        children: c(r === 'AND' ? 'logic.andDescription' : 'logic.orDescription'),
      }),
      e.jsxs('div', {
        className: 'flex flex-col gap-3',
        children: [
          a.map((n, t) => {
            const x = _.find((y) => y.name === n.field_name),
              p = x ? V(x.type) : []
            return e.jsxs(
              'div',
              {
                className: b(
                  'flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-lg border',
                  n.is_negated
                    ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800',
                ),
                children: [
                  e.jsxs('button', {
                    type: 'button',
                    onClick: () => S(t),
                    className: b(
                      'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                      n.is_negated
                        ? 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
                    ),
                    'aria-label': c('a11y.toggleNegate'),
                    children: [
                      n.is_negated
                        ? e.jsx(ze, { className: 'h-4 w-4' })
                        : e.jsx(Be, { className: 'h-4 w-4' }),
                      c('logic.not'),
                    ],
                  }),
                  e.jsxs(L, {
                    value: n.field_name,
                    onValueChange: (y) => N(t, y),
                    children: [
                      e.jsx(F, {
                        className: 'w-full sm:w-40 min-h-10',
                        children: e.jsx(P, { placeholder: c('conditions.field') }),
                      }),
                      e.jsx(G, {
                        children: _.map((y) =>
                          e.jsx(
                            O,
                            { value: y.name, children: j ? y.label_ar : y.label_en },
                            y.name,
                          ),
                        ),
                      }),
                    ],
                  }),
                  e.jsxs(L, {
                    value: n.operator,
                    onValueChange: (y) => g(t, y),
                    children: [
                      e.jsx(F, {
                        className: 'w-full sm:w-40 min-h-10',
                        children: e.jsx(P, { placeholder: c('conditions.operator') }),
                      }),
                      e.jsx(G, {
                        children: p.map((y) =>
                          e.jsx(
                            O,
                            { value: y.value, children: j ? y.label_ar : y.label_en },
                            y.value,
                          ),
                        ),
                      }),
                    ],
                  }),
                  w(n, t),
                  e.jsx(v, {
                    variant: 'ghost',
                    size: 'icon',
                    onClick: () => m(t),
                    className: 'shrink-0 min-h-10 min-w-10',
                    'aria-label': c('a11y.removeCondition'),
                    children: e.jsx(ae, { className: 'h-4 w-4' }),
                  }),
                ],
              },
              t,
            )
          }),
          e.jsxs(v, {
            variant: 'outline',
            onClick: u,
            className: 'min-h-11 border-dashed',
            disabled: _.length === 0,
            children: [e.jsx(Me, { className: 'h-4 w-4 me-2' }), c('conditions.add')],
          }),
        ],
      }),
      a.length > 0 &&
        e.jsxs('div', {
          className: 'flex flex-wrap gap-2 pt-2 border-t',
          children: [
            e.jsxs('span', {
              className: 'text-xs text-gray-500 dark:text-gray-400 self-center',
              children: [c('filters.activeCount', { count: a.length }), ':'],
            }),
            a.map((n, t) => {
              const x = _.find((y) => y.name === n.field_name),
                p = x ? (j ? x.label_ar : x.label_en) : n.field_name
              return e.jsxs(
                ee,
                {
                  variant: n.is_negated ? 'destructive' : 'secondary',
                  className: 'text-xs',
                  children: [n.is_negated && `${c('logic.not')} `, p],
                },
                t,
              )
            }),
          ],
        }),
    ],
  })
}
const T = {
    all: ['search-templates'],
    lists: () => [...T.all, 'list'],
    list: (a) => [...T.lists(), a],
    details: () => [...T.all, 'detail'],
    detail: (a) => [...T.details(), a],
    popular: () => [...T.all, 'popular'],
    recent: () => [...T.all, 'recent'],
    system: () => [...T.all, 'system'],
  },
  ne = () => 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/search-templates'
async function oe() {
  const { data: a } = await _e.auth.getSession()
  if (!a?.session?.access_token) throw new Error('Not authenticated')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${a.session.access_token}`,
    apikey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcmNqemRlbWRtd2hlYXJoZmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MjY0OTAsImV4cCI6MjA3NDQwMjQ5MH0.JnSwNH0rsz8yg9zx73_3qc5CpJ6oo-udpo3G4ZIwkYQ',
  }
}
async function Ne(a) {
  const s = await oe(),
    r = new URL(ne())
  ;(a.category && r.searchParams.set('category', a.category),
    a.limit && r.searchParams.set('limit', a.limit.toString()),
    a.offset && r.searchParams.set('offset', a.offset.toString()),
    a.sortBy && r.searchParams.set('sort_by', a.sortBy),
    a.sortOrder && r.searchParams.set('sort_order', a.sortOrder))
  const l = await fetch(r.toString(), { method: 'GET', headers: s })
  if (!l.ok) {
    const o = await l.json()
    throw new Error(o.message || 'Failed to fetch templates')
  }
  return l.json()
}
async function ca(a) {
  const s = await oe(),
    r = await fetch(ne(), { method: 'POST', headers: s, body: JSON.stringify(a) })
  if (!r.ok) {
    const l = await r.json()
    throw new Error(l.message || 'Failed to create template')
  }
  return r.json()
}
async function da(a) {
  const s = await oe(),
    r = await fetch(`${ne()}/${a}`, { method: 'DELETE', headers: s })
  if (!r.ok) {
    const l = await r.json()
    throw new Error(l.message || 'Failed to delete template')
  }
  return r.json()
}
function ma(a = 5) {
  return be({
    queryKey: T.popular(),
    queryFn: () => Ne({ limit: a, sortBy: 'use_count', sortOrder: 'desc' }),
    staleTime: 5 * 60 * 1e3,
  })
}
function ua() {
  return be({
    queryKey: T.list({ category: 'quick' }),
    queryFn: () => Ne({ category: 'quick', limit: 10 }),
    staleTime: 5 * 60 * 1e3,
  })
}
function ga() {
  const a = Z()
  return W({
    mutationFn: ca,
    onSuccess: (s) => {
      ;(a.invalidateQueries({ queryKey: T.lists() }), a.setQueryData(T.detail(s.data.id), s))
    },
  })
}
function pa() {
  const a = Z()
  return W({
    mutationFn: da,
    onSuccess: (s, r) => {
      ;(a.removeQueries({ queryKey: T.detail(r) }), a.invalidateQueries({ queryKey: T.lists() }))
    },
  })
}
function ha(a) {
  const s = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-950',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800',
      hover: 'hover:bg-green-100 dark:hover:bg-green-900',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800',
      hover: 'hover:bg-red-100 dark:hover:bg-red-900',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      hover: 'hover:bg-purple-100 dark:hover:bg-purple-900',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-950',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800',
      hover: 'hover:bg-orange-100 dark:hover:bg-orange-900',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      text: 'text-yellow-700 dark:text-yellow-300',
      border: 'border-yellow-200 dark:border-yellow-800',
      hover: 'hover:bg-yellow-100 dark:hover:bg-yellow-900',
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-900',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-700',
      hover: 'hover:bg-gray-100 dark:hover:bg-gray-800',
    },
    pink: {
      bg: 'bg-pink-50 dark:bg-pink-950',
      text: 'text-pink-700 dark:text-pink-300',
      border: 'border-pink-200 dark:border-pink-800',
      hover: 'hover:bg-pink-100 dark:hover:bg-pink-900',
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800',
      hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900',
    },
    teal: {
      bg: 'bg-teal-50 dark:bg-teal-950',
      text: 'text-teal-700 dark:text-teal-300',
      border: 'border-teal-200 dark:border-teal-800',
      hover: 'hover:bg-teal-100 dark:hover:bg-teal-900',
    },
  }
  return s[a] || s.gray
}
const xa = {
  search: I,
  'file-text': q,
  'folder-open': ge,
  shield: Ve,
  calendar: J,
  history: He,
  file: Ye,
  folder: ge,
  users: Y,
  user: le,
  globe: re,
  building: se,
  tag: te,
  star: fe,
  bookmark: Je,
  filter: U,
  clock: je,
}
function ya({ onApply: a, className: s }) {
  const { t: r, i18n: l } = R('advanced-search'),
    o = l.language === 'ar',
    [m, k] = f.useState(null),
    { data: i, isLoading: h } = ua(),
    { data: c, isLoading: C } = ma(),
    j = pa(),
    _ = (d) => {
      a(d.template_definition)
    },
    u = async () => {
      m && (await j.mutateAsync(m), k(null))
    },
    N = (d) => {
      const S = xa[d.icon] || I,
        w = ha(d.color)
      return e.jsxs(
        'button',
        {
          type: 'button',
          onClick: () => _(d),
          className: b(
            'flex items-start gap-3 p-3 rounded-lg border text-start w-full min-h-16 transition-all',
            w.border,
            w.bg,
            w.hover,
          ),
          children: [
            e.jsx('div', {
              className: b('p-2 rounded-lg shrink-0', w.bg),
              children: e.jsx(S, { className: b('h-4 w-4', w.text) }),
            }),
            e.jsxs('div', {
              className: 'flex-1 min-w-0',
              children: [
                e.jsx('h4', {
                  className: 'text-sm font-medium text-gray-900 dark:text-gray-100 truncate',
                  children: o ? d.name_ar : d.name_en,
                }),
                (d.description_en || d.description_ar) &&
                  e.jsx('p', {
                    className: 'text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5',
                    children: o ? d.description_ar : d.description_en,
                  }),
                d.use_count > 0 &&
                  e.jsx('p', {
                    className: 'text-xs text-gray-400 dark:text-gray-500 mt-1',
                    children: r('templates.useCount', { count: d.use_count }),
                  }),
              ],
            }),
            e.jsx(Qe, {
              className: b('h-4 w-4 text-gray-400 shrink-0 self-center', o && 'rotate-180'),
            }),
          ],
        },
        d.id,
      )
    },
    g = (d) =>
      e.jsx(e.Fragment, {
        children: Array.from({ length: d }).map((S, w) =>
          e.jsx(D, { className: 'h-16 w-full rounded-lg' }, w),
        ),
      })
  return e.jsxs('div', {
    className: b('flex flex-col gap-6', s),
    dir: o ? 'rtl' : 'ltr',
    children: [
      e.jsxs('section', {
        children: [
          e.jsxs('h3', {
            className:
              'text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2',
            children: [e.jsx(fe, { className: 'h-4 w-4 text-yellow-500' }), r('templates.quick')],
          }),
          e.jsx('div', {
            className: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
            children: h
              ? g(4)
              : i?.data && i.data.length > 0
                ? i.data.map(N)
                : e.jsx('p', {
                    className: 'text-sm text-gray-500 dark:text-gray-400 col-span-2',
                    children: r('templates.noTemplates'),
                  }),
          }),
        ],
      }),
      e.jsxs('section', {
        children: [
          e.jsxs('h3', {
            className:
              'text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2',
            children: [e.jsx(Y, { className: 'h-4 w-4 text-blue-500' }), r('templates.popular')],
          }),
          e.jsx('div', {
            className: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
            children: C
              ? g(4)
              : c?.data && c.data.length > 0
                ? c.data.map(N)
                : e.jsx('p', {
                    className: 'text-sm text-gray-500 dark:text-gray-400 col-span-2',
                    children: r('templates.noTemplates'),
                  }),
          }),
        ],
      }),
      e.jsx(Xe, {
        open: !!m,
        onOpenChange: () => k(null),
        children: e.jsxs(Ze, {
          children: [
            e.jsxs(We, {
              children: [
                e.jsx(ea, { children: r('templates.delete') }),
                e.jsx(aa, { children: r('templates.deleteConfirm') }),
              ],
            }),
            e.jsxs(ta, {
              children: [
                e.jsx(sa, { children: r('actions.cancel') }),
                e.jsx(ra, {
                  onClick: u,
                  className: 'bg-red-600 hover:bg-red-700',
                  children: r('templates.delete'),
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  })
}
const K = {
  all: ['advanced-search'],
  search: (a) => [...K.all, 'results', a],
  history: () => [...K.all, 'history'],
}
async function ba(a) {
  const { data: s } = await _e.auth.getSession()
  if (!s?.session?.access_token) throw new Error('Not authenticated')
  const r = await fetch('https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/advanced-search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${s.session.access_token}`,
      apikey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcmNqemRlbWRtd2hlYXJoZmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MjY0OTAsImV4cCI6MjA3NDQwMjQ5MH0.JnSwNH0rsz8yg9zx73_3qc5CpJ6oo-udpo3G4ZIwkYQ',
    },
    body: JSON.stringify(a),
  })
  if (!r.ok) {
    const l = await r.json()
    throw new Error(l.message || 'Search failed')
  }
  return r.json()
}
function _a() {
  const a = Z()
  return W({
    mutationFn: ba,
    onSuccess: (s, r) => {
      ;(a.setQueryData(K.search(r), s), ja(r))
    },
  })
}
const ke = 'advanced-search-history',
  fa = 10
function ja(a) {
  try {
    const s = va(),
      r = {
        id: crypto.randomUUID(),
        request: a,
        timestamp: new Date().toISOString(),
        resultCount: 0,
      },
      l = s.filter((m) => JSON.stringify(m.request) !== JSON.stringify(a)),
      o = [r, ...l].slice(0, fa)
    localStorage.setItem(ke, JSON.stringify(o))
  } catch {
    console.warn('Failed to save search history')
  }
}
function va() {
  try {
    const a = localStorage.getItem(ke)
    return a ? JSON.parse(a) : []
  } catch {
    return []
  }
}
const X = {
  query: '',
  entityTypes: ['dossier'],
  conditions: [],
  conditionGroups: [],
  relationships: [],
  dateRange: null,
  status: [],
  tags: [],
  filterLogic: 'AND',
  includeArchived: !1,
  sortBy: 'relevance',
  sortOrder: 'desc',
  limit: 50,
  offset: 0,
  savedFilterId: null,
}
function Na(a) {
  const s = {
    entity_types: a.entityTypes,
    filter_logic: a.filterLogic,
    include_archived: a.includeArchived,
    sort_by: a.sortBy,
    sort_order: a.sortOrder,
    limit: a.limit,
    offset: a.offset,
  }
  return (
    a.query.trim() && (s.query = a.query.trim()),
    a.conditions.length > 0 && (s.conditions = a.conditions),
    a.conditionGroups.length > 0 && (s.condition_groups = a.conditionGroups),
    a.relationships.length > 0 && (s.relationships = a.relationships),
    a.dateRange &&
      (a.dateRange.from || a.dateRange.to || a.dateRange.preset) &&
      (s.date_range = a.dateRange),
    a.status.length > 0 && (s.status = a.status),
    a.tags.length > 0 && (s.tags = a.tags),
    a.savedFilterId && (s.saved_filter_id = a.savedFilterId),
    s
  )
}
function ka(a, s) {
  switch (s.type) {
    case 'SET_QUERY':
      return { ...a, query: s.payload, offset: 0 }
    case 'SET_ENTITY_TYPES':
      return { ...a, entityTypes: s.payload, offset: 0 }
    case 'TOGGLE_ENTITY_TYPE': {
      const r = a.entityTypes.includes(s.payload)
        ? a.entityTypes.filter((l) => l !== s.payload)
        : [...a.entityTypes, s.payload]
      return { ...a, entityTypes: r.length > 0 ? r : a.entityTypes, offset: 0 }
    }
    case 'ADD_CONDITION':
      return { ...a, conditions: [...a.conditions, s.payload], offset: 0 }
    case 'UPDATE_CONDITION':
      return {
        ...a,
        conditions: a.conditions.map((r, l) => (l === s.payload.index ? s.payload.condition : r)),
        offset: 0,
      }
    case 'REMOVE_CONDITION':
      return { ...a, conditions: a.conditions.filter((r, l) => l !== s.payload), offset: 0 }
    case 'CLEAR_CONDITIONS':
      return { ...a, conditions: [], conditionGroups: [], offset: 0 }
    case 'ADD_CONDITION_GROUP':
      return { ...a, conditionGroups: [...a.conditionGroups, s.payload], offset: 0 }
    case 'REMOVE_CONDITION_GROUP':
      return {
        ...a,
        conditionGroups: a.conditionGroups.filter((r, l) => l !== s.payload),
        offset: 0,
      }
    case 'ADD_RELATIONSHIP':
      return { ...a, relationships: [...a.relationships, s.payload], offset: 0 }
    case 'REMOVE_RELATIONSHIP':
      return { ...a, relationships: a.relationships.filter((r, l) => l !== s.payload), offset: 0 }
    case 'SET_DATE_RANGE':
      return { ...a, dateRange: s.payload, offset: 0 }
    case 'SET_STATUS':
      return { ...a, status: s.payload, offset: 0 }
    case 'TOGGLE_STATUS': {
      const r = a.status.includes(s.payload)
        ? a.status.filter((l) => l !== s.payload)
        : [...a.status, s.payload]
      return { ...a, status: r, offset: 0 }
    }
    case 'SET_TAGS':
      return { ...a, tags: s.payload, offset: 0 }
    case 'SET_FILTER_LOGIC':
      return { ...a, filterLogic: s.payload, offset: 0 }
    case 'SET_INCLUDE_ARCHIVED':
      return { ...a, includeArchived: s.payload, offset: 0 }
    case 'SET_SORT':
      return { ...a, sortBy: s.payload.sortBy, sortOrder: s.payload.sortOrder, offset: 0 }
    case 'SET_PAGINATION':
      return { ...a, limit: s.payload.limit ?? a.limit, offset: s.payload.offset ?? a.offset }
    case 'SET_SAVED_FILTER_ID':
      return { ...a, savedFilterId: s.payload }
    case 'LOAD_STATE':
      return { ...a, ...s.payload, offset: 0 }
    case 'RESET':
      return { ...X }
    default:
      return a
  }
}
function wa(a) {
  return (
    a.query.trim().length > 0 ||
    a.conditions.length > 0 ||
    a.conditionGroups.length > 0 ||
    a.relationships.length > 0 ||
    a.dateRange !== null ||
    a.status.length > 0 ||
    a.tags.length > 0 ||
    a.includeArchived
  )
}
function Ta(a) {
  let s = 0
  return (
    a.query.trim() && s++,
    (s += a.conditions.length),
    (s += a.conditionGroups.length),
    (s += a.relationships.length),
    a.dateRange && s++,
    (s += a.status.length),
    (s += a.tags.length),
    a.includeArchived && s++,
    s
  )
}
const Ca = {
  dossier: ve,
  engagement: J,
  position: q,
  document: q,
  person: le,
  organization: se,
  forum: Y,
  country: re,
  theme: te,
}
function Sa({ onSearch: a, onSaveTemplate: s, className: r, initialState: l }) {
  const { t: o, i18n: m } = R('advanced-search'),
    k = m.language === 'ar',
    [i, h] = f.useReducer(ka, l ? { ...X, ...l } : X),
    [c, C] = f.useState(!0),
    [j, _] = f.useState(!1),
    u = Ta(i),
    N = wa(i),
    g = f.useCallback(() => {
      a(i)
    }, [i, a]),
    d = f.useCallback(() => {
      h({ type: 'RESET' })
    }, []),
    S = f.useCallback((t) => {
      h({ type: 'TOGGLE_ENTITY_TYPE', payload: t })
    }, []),
    w = f.useCallback((t) => {
      ;(h({
        type: 'LOAD_STATE',
        payload: {
          entityTypes: t.entity_types || ['dossier'],
          query: t.query || '',
          conditions: t.conditions || [],
          conditionGroups: t.condition_groups || [],
          relationships: t.relationships || [],
          dateRange: t.date_range || null,
          status: t.status || [],
          tags: t.tags || [],
          filterLogic: t.filter_logic || 'AND',
          includeArchived: t.include_archived || !1,
          sortBy: t.sort_by || 'relevance',
          sortOrder: t.sort_order || 'desc',
        },
      }),
        _(!1))
    }, []),
    n = [
      { value: 'active', label: o('status.active') },
      { value: 'inactive', label: o('status.inactive') },
      { value: 'archived', label: o('status.archived') },
      { value: 'draft', label: o('status.draft') },
      { value: 'published', label: o('status.published') },
    ]
  return e.jsxs('div', {
    className: b('flex flex-col gap-4 bg-background', r),
    dir: k ? 'rtl' : 'ltr',
    role: 'search',
    'aria-label': o('a11y.searchForm'),
    children: [
      e.jsxs('div', {
        className: 'relative',
        children: [
          e.jsx(I, {
            className: 'absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
          }),
          e.jsx(E, {
            type: 'text',
            value: i.query,
            onChange: (t) => h({ type: 'SET_QUERY', payload: t.target.value }),
            onKeyDown: (t) => t.key === 'Enter' && g(),
            placeholder: o('search.placeholder'),
            className: 'ps-10 pe-4 min-h-12 text-base',
          }),
          i.query &&
            e.jsx('button', {
              type: 'button',
              onClick: () => h({ type: 'SET_QUERY', payload: '' }),
              className:
                'absolute end-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700',
              'aria-label': o('search.clear'),
              children: e.jsx(ae, { className: 'h-4 w-4' }),
            }),
        ],
      }),
      e.jsxs(de, {
        open: j,
        onOpenChange: _,
        children: [
          e.jsx(me, {
            asChild: !0,
            children: e.jsxs(v, {
              variant: 'ghost',
              className: 'w-full justify-between px-3 min-h-10',
              children: [
                e.jsxs('span', {
                  className: 'flex items-center gap-2',
                  children: [e.jsx(U, { className: 'h-4 w-4' }), o('templates.title')],
                }),
                j ? e.jsx(pe, { className: 'h-4 w-4' }) : e.jsx(Q, { className: 'h-4 w-4' }),
              ],
            }),
          }),
          e.jsx(ue, { className: 'pt-3', children: e.jsx(ya, { onApply: w }) }),
        ],
      }),
      e.jsxs('div', {
        className: 'space-y-3',
        children: [
          e.jsx('h3', {
            className: 'text-sm font-medium text-gray-700 dark:text-gray-300',
            children: o('entityTypes.label'),
          }),
          e.jsx('div', {
            className: 'flex flex-wrap gap-2',
            children: Object.keys($).map((t) => {
              const x = Ca[t],
                p = i.entityTypes.includes(t),
                y = $[t]
              return e.jsxs(
                'button',
                {
                  type: 'button',
                  onClick: () => S(t),
                  className: b(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all min-h-10',
                    p
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary',
                  ),
                  children: [e.jsx(x, { className: 'h-4 w-4' }), k ? y.label_ar : y.label_en],
                },
                t,
              )
            }),
          }),
        ],
      }),
      e.jsxs(de, {
        open: c,
        onOpenChange: C,
        children: [
          e.jsx(me, {
            asChild: !0,
            children: e.jsxs(v, {
              variant: 'ghost',
              className: 'w-full justify-between px-3 min-h-10',
              children: [
                e.jsxs('span', {
                  className: 'flex items-center gap-2',
                  children: [
                    e.jsx(U, { className: 'h-4 w-4' }),
                    o('filters.title'),
                    u > 0 && e.jsx(ee, { variant: 'secondary', className: 'ms-2', children: u }),
                  ],
                }),
                c ? e.jsx(pe, { className: 'h-4 w-4' }) : e.jsx(Q, { className: 'h-4 w-4' }),
              ],
            }),
          }),
          e.jsxs(ue, {
            className: 'pt-4 space-y-6',
            'aria-label': o('a11y.filterSection'),
            children: [
              e.jsx(ia, {
                conditions: i.conditions,
                entityTypes: i.entityTypes,
                logic: i.filterLogic,
                onConditionAdd: (t) => h({ type: 'ADD_CONDITION', payload: t }),
                onConditionUpdate: (t, x) =>
                  h({ type: 'UPDATE_CONDITION', payload: { index: t, condition: x } }),
                onConditionRemove: (t) => h({ type: 'REMOVE_CONDITION', payload: t }),
                onLogicChange: (t) => h({ type: 'SET_FILTER_LOGIC', payload: t }),
                onClear: () => h({ type: 'CLEAR_CONDITIONS' }),
              }),
              e.jsx(oa, {
                value: i.dateRange,
                onChange: (t) => h({ type: 'SET_DATE_RANGE', payload: t }),
              }),
              e.jsxs('div', {
                className: 'space-y-3',
                children: [
                  e.jsx('h3', {
                    className: 'text-sm font-medium text-gray-700 dark:text-gray-300',
                    children: o('status.title'),
                  }),
                  e.jsx('div', {
                    className: 'flex flex-wrap gap-2',
                    children: n.map((t) => {
                      const x = i.status.includes(t.value)
                      return e.jsx(
                        'button',
                        {
                          type: 'button',
                          onClick: () => h({ type: 'TOGGLE_STATUS', payload: t.value }),
                          className: b(
                            'px-3 py-1.5 rounded-full border text-sm transition-all min-h-8',
                            x
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary',
                          ),
                          children: t.label,
                        },
                        t.value,
                      )
                    }),
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'flex items-center gap-3 py-2',
                children: [
                  e.jsx(Ie, {
                    id: 'include-archived',
                    checked: i.includeArchived,
                    onCheckedChange: (t) => h({ type: 'SET_INCLUDE_ARCHIVED', payload: t === !0 }),
                  }),
                  e.jsx('label', {
                    htmlFor: 'include-archived',
                    className: 'text-sm text-gray-700 dark:text-gray-300 cursor-pointer',
                    children: o('options.includeArchived'),
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'space-y-3',
                children: [
                  e.jsx('h3', {
                    className: 'text-sm font-medium text-gray-700 dark:text-gray-300',
                    children: o('sorting.title'),
                  }),
                  e.jsxs('div', {
                    className: 'flex flex-wrap gap-2',
                    children: [
                      ['relevance', 'date', 'title'].map((t) =>
                        e.jsx(
                          'button',
                          {
                            type: 'button',
                            onClick: () =>
                              h({
                                type: 'SET_SORT',
                                payload: { sortBy: t, sortOrder: i.sortOrder },
                              }),
                            className: b(
                              'px-3 py-1.5 rounded-full border text-sm transition-all min-h-8',
                              i.sortBy === t
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary',
                            ),
                            children: o(`sorting.${t === 'title' ? 'title_sort' : t}`),
                          },
                          t,
                        ),
                      ),
                      e.jsx('button', {
                        type: 'button',
                        onClick: () =>
                          h({
                            type: 'SET_SORT',
                            payload: {
                              sortBy: i.sortBy,
                              sortOrder: i.sortOrder === 'asc' ? 'desc' : 'asc',
                            },
                          }),
                        className:
                          'px-3 py-1.5 rounded-full border text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary transition-all min-h-8',
                        children:
                          i.sortOrder === 'asc' ? o('sorting.ascending') : o('sorting.descending'),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'flex flex-col sm:flex-row gap-3 pt-4 border-t',
        children: [
          e.jsxs(v, {
            onClick: g,
            className: 'flex-1 min-h-11',
            disabled: i.entityTypes.length === 0,
            children: [e.jsx(I, { className: 'h-4 w-4 me-2' }), o('actions.search')],
          }),
          N &&
            e.jsxs(v, {
              variant: 'outline',
              onClick: d,
              className: 'min-h-11',
              children: [e.jsx(Ue, { className: 'h-4 w-4 me-2' }), o('actions.reset')],
            }),
          s &&
            N &&
            e.jsxs(v, {
              variant: 'outline',
              onClick: () => s(i),
              className: 'min-h-11',
              children: [e.jsx($e, { className: 'h-4 w-4 me-2' }), o('templates.create')],
            }),
        ],
      }),
    ],
  })
}
const Ea = {
    dossier: ve,
    engagement: J,
    position: q,
    document: q,
    person: le,
    organization: se,
    forum: Y,
    country: re,
    theme: te,
  },
  ye = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    archived: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    draft: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    published: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  }
function Ia() {
  const { t: a, i18n: s } = R('advanced-search'),
    r = s.language === 'ar',
    [l, o] = f.useState(!1),
    [m, k] = f.useState(null),
    [i, h] = f.useState({ en: '', ar: '' }),
    [c, C] = f.useState({ en: '', ar: '' }),
    [j, _] = f.useState(!1),
    u = _a(),
    N = ga(),
    g = f.useCallback(
      (t) => {
        const x = Na(t)
        u.mutate(x)
      },
      [u],
    ),
    d = f.useCallback((t) => {
      ;(k(t), h({ en: '', ar: '' }), C({ en: '', ar: '' }), _(!1), o(!0))
    }, []),
    S = f.useCallback(async () => {
      if (!(!m || !i.en || !i.ar))
        try {
          ;(await N.mutateAsync({
            name_en: i.en,
            name_ar: i.ar,
            description_en: c.en || void 0,
            description_ar: c.ar || void 0,
            template_definition: {
              entity_types: m.entityTypes,
              query: m.query || void 0,
              conditions: m.conditions.length > 0 ? m.conditions : void 0,
              condition_groups: m.conditionGroups.length > 0 ? m.conditionGroups : void 0,
              relationships: m.relationships.length > 0 ? m.relationships : void 0,
              date_range: m.dateRange || void 0,
              status: m.status.length > 0 ? m.status : void 0,
              tags: m.tags.length > 0 ? m.tags : void 0,
              filter_logic: m.filterLogic,
              include_archived: m.includeArchived,
              sort_by: m.sortBy,
              sort_order: m.sortOrder,
            },
            is_public: j,
            category: 'custom',
          }),
            o(!1))
        } catch (t) {
          console.error('Failed to create template:', t)
        }
    }, [m, i, c, j, N]),
    w = (t) => {
      const x = Ea[t.entity_type] || q,
        p = $[t.entity_type]
      return e.jsxs(
        z,
        {
          className: 'hover:shadow-md transition-shadow cursor-pointer',
          children: [
            e.jsx(H, {
              className: 'pb-3',
              children: e.jsxs('div', {
                className: 'flex items-start justify-between gap-3',
                children: [
                  e.jsxs('div', {
                    className: 'flex items-start gap-3 min-w-0',
                    children: [
                      e.jsx('div', {
                        className: 'p-2 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0',
                        children: e.jsx(x, {
                          className: 'h-5 w-5 text-gray-600 dark:text-gray-400',
                        }),
                      }),
                      e.jsxs('div', {
                        className: 'min-w-0',
                        children: [
                          e.jsx(ce, {
                            className: 'text-base line-clamp-1',
                            children: r ? t.title_ar : t.title_en,
                          }),
                          e.jsxs(Pe, {
                            className: 'flex items-center gap-2 mt-1',
                            children: [
                              e.jsx('span', { children: r ? p?.label_ar : p?.label_en }),
                              e.jsx(ee, {
                                variant: 'secondary',
                                className: b('text-xs', ye[t.status] || ye.active),
                                children: a(`status.${t.status}`),
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  e.jsx(v, {
                    variant: 'ghost',
                    size: 'icon',
                    asChild: !0,
                    className: 'shrink-0',
                    children: e.jsx(Te, {
                      to: `/${t.entity_type}s/${t.entity_id}`,
                      children: e.jsx(Ke, { className: b('h-4 w-4', r && 'rotate-180') }),
                    }),
                  }),
                ],
              }),
            }),
            (t.snippet_en || t.snippet_ar) &&
              e.jsxs(B, {
                className: 'pt-0',
                children: [
                  e.jsx('p', {
                    className: 'text-sm text-gray-600 dark:text-gray-400 line-clamp-2',
                    dangerouslySetInnerHTML: { __html: r ? t.snippet_ar : t.snippet_en },
                  }),
                  e.jsxs('div', {
                    className: 'flex items-center gap-4 mt-3 text-xs text-gray-500',
                    children: [
                      e.jsxs('span', {
                        className: 'flex items-center gap-1',
                        children: [
                          e.jsx(je, { className: 'h-3 w-3' }),
                          new Date(t.updated_at).toLocaleDateString(),
                        ],
                      }),
                      t.rank_score &&
                        e.jsxs('span', {
                          className: 'flex items-center gap-1',
                          children: [
                            e.jsx(I, { className: 'h-3 w-3' }),
                            Math.round(t.rank_score),
                            '% ',
                            a('sorting.relevance').toLowerCase(),
                          ],
                        }),
                    ],
                  }),
                ],
              }),
          ],
        },
        t.entity_id,
      )
    },
    n = () =>
      e.jsx(e.Fragment, {
        children: Array.from({ length: 5 }).map((t, x) =>
          e.jsxs(
            z,
            {
              children: [
                e.jsx(H, {
                  className: 'pb-3',
                  children: e.jsxs('div', {
                    className: 'flex items-start gap-3',
                    children: [
                      e.jsx(D, { className: 'h-10 w-10 rounded-lg' }),
                      e.jsxs('div', {
                        className: 'flex-1 space-y-2',
                        children: [
                          e.jsx(D, { className: 'h-5 w-3/4' }),
                          e.jsx(D, { className: 'h-4 w-1/4' }),
                        ],
                      }),
                    ],
                  }),
                }),
                e.jsxs(B, {
                  className: 'pt-0',
                  children: [
                    e.jsx(D, { className: 'h-4 w-full mb-2' }),
                    e.jsx(D, { className: 'h-4 w-2/3' }),
                  ],
                }),
              ],
            },
            x,
          ),
        ),
      })
  return e.jsxs('div', {
    className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6',
    dir: r ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'mb-6',
        children: [
          e.jsx('h1', {
            className: 'text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100',
            children: a('title'),
          }),
          e.jsx('p', {
            className: 'text-gray-600 dark:text-gray-400 mt-1',
            children: a('description'),
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'grid grid-cols-1 lg:grid-cols-3 gap-6',
        children: [
          e.jsx('div', {
            className: 'lg:col-span-1',
            children: e.jsx(z, {
              className: 'sticky top-20',
              children: e.jsx(B, {
                className: 'pt-6',
                children: e.jsx(Sa, { onSearch: g, onSaveTemplate: d }),
              }),
            }),
          }),
          e.jsx('div', {
            className: 'lg:col-span-2',
            children: e.jsxs(z, {
              children: [
                e.jsx(H, {
                  className: 'pb-4',
                  children: e.jsxs('div', {
                    className: 'flex items-center justify-between',
                    children: [
                      e.jsxs(ce, {
                        className: 'flex items-center gap-2',
                        children: [e.jsx(I, { className: 'h-5 w-5' }), a('results.title')],
                      }),
                      u.data &&
                        e.jsxs('div', {
                          className: 'flex items-center gap-2 text-sm text-gray-500',
                          children: [
                            e.jsx('span', {
                              children: a('results.found', { count: u.data.count }),
                            }),
                            e.jsxs('span', {
                              className: 'text-xs',
                              children: ['(', a('results.took', { ms: u.data.took_ms }), ')'],
                            }),
                          ],
                        }),
                    ],
                  }),
                }),
                e.jsxs(B, {
                  children: [
                    u.isPending &&
                      e.jsxs('div', {
                        className: 'space-y-4',
                        children: [
                          e.jsxs('div', {
                            className: 'flex items-center justify-center py-8',
                            children: [
                              e.jsx(he, { className: 'h-8 w-8 animate-spin text-primary' }),
                              e.jsx('span', {
                                className: 'ms-3 text-gray-600 dark:text-gray-400',
                                children: a('results.loading'),
                              }),
                            ],
                          }),
                          n(),
                        ],
                      }),
                    u.isError &&
                      e.jsxs('div', {
                        className: 'flex flex-col items-center justify-center py-12 text-center',
                        children: [
                          e.jsx(xe, { className: 'h-12 w-12 text-red-500 mb-4' }),
                          e.jsx('h3', {
                            className: 'text-lg font-medium text-gray-900 dark:text-gray-100 mb-2',
                            children: a('errors.searchFailed'),
                          }),
                          e.jsx('p', {
                            className: 'text-gray-600 dark:text-gray-400 max-w-md',
                            children: u.error?.message,
                          }),
                          e.jsx(v, {
                            variant: 'outline',
                            className: 'mt-4',
                            onClick: () => u.reset(),
                            children: a('actions.reset'),
                          }),
                        ],
                      }),
                    u.isSuccess &&
                      u.data.data.length === 0 &&
                      e.jsxs('div', {
                        className: 'flex flex-col items-center justify-center py-12 text-center',
                        children: [
                          e.jsx(I, { className: 'h-12 w-12 text-gray-400 mb-4' }),
                          e.jsx('h3', {
                            className: 'text-lg font-medium text-gray-900 dark:text-gray-100 mb-2',
                            children: a('results.noResults'),
                          }),
                          e.jsx('p', {
                            className: 'text-gray-600 dark:text-gray-400 max-w-md',
                            children: a('results.noResultsHint'),
                          }),
                        ],
                      }),
                    u.isSuccess &&
                      u.data.data.length > 0 &&
                      e.jsx(De, {
                        className: 'h-[calc(100vh-400px)] pe-4',
                        children: e.jsxs('div', {
                          className: 'space-y-4',
                          children: [
                            u.data.data.map(w),
                            u.data.metadata.has_more &&
                              e.jsx('div', {
                                className: 'flex justify-center pt-4',
                                children: e.jsx(v, {
                                  variant: 'outline',
                                  children: a('results.loadMore'),
                                }),
                              }),
                          ],
                        }),
                      }),
                    !u.isPending &&
                      !u.isError &&
                      !u.data &&
                      e.jsxs('div', {
                        className: 'flex flex-col items-center justify-center py-12 text-center',
                        children: [
                          e.jsx(I, { className: 'h-12 w-12 text-gray-400 mb-4' }),
                          e.jsx('h3', {
                            className: 'text-lg font-medium text-gray-900 dark:text-gray-100 mb-2',
                            children: a('search.noQuery'),
                          }),
                          e.jsx('p', {
                            className: 'text-gray-600 dark:text-gray-400 max-w-md',
                            children: a('description'),
                          }),
                        ],
                      }),
                    u.data?.warnings &&
                      u.data.warnings.length > 0 &&
                      e.jsx('div', {
                        className:
                          'mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg',
                        children: e.jsxs('div', {
                          className: 'flex items-start gap-2',
                          children: [
                            e.jsx(xe, { className: 'h-4 w-4 text-yellow-600 shrink-0 mt-0.5' }),
                            e.jsx('div', {
                              className: 'text-sm text-yellow-800 dark:text-yellow-200',
                              children: u.data.warnings.map((t, x) =>
                                e.jsx('p', { children: t }, x),
                              ),
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
      e.jsx(qe, {
        open: l,
        onOpenChange: o,
        children: e.jsxs(Oe, {
          className: 'sm:max-w-md',
          children: [
            e.jsx(Ae, { children: e.jsx(Re, { children: a('templates.createTitle') }) }),
            e.jsxs('div', {
              className: 'space-y-4 py-4',
              children: [
                e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    e.jsx(A, { htmlFor: 'template-name-en', children: a('templates.nameEn') }),
                    e.jsx(E, {
                      id: 'template-name-en',
                      value: i.en,
                      onChange: (t) => h({ ...i, en: t.target.value }),
                      placeholder: 'My Search Template',
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    e.jsx(A, { htmlFor: 'template-name-ar', children: a('templates.nameAr') }),
                    e.jsx(E, {
                      id: 'template-name-ar',
                      value: i.ar,
                      onChange: (t) => h({ ...i, ar: t.target.value }),
                      placeholder: 'قالب البحث الخاص بي',
                      dir: 'rtl',
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    e.jsx(A, {
                      htmlFor: 'template-desc-en',
                      children: a('templates.descriptionEn'),
                    }),
                    e.jsx(E, {
                      id: 'template-desc-en',
                      value: c.en,
                      onChange: (t) => C({ ...c, en: t.target.value }),
                      placeholder: 'Optional description',
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    e.jsx(A, {
                      htmlFor: 'template-desc-ar',
                      children: a('templates.descriptionAr'),
                    }),
                    e.jsx(E, {
                      id: 'template-desc-ar',
                      value: c.ar,
                      onChange: (t) => C({ ...c, ar: t.target.value }),
                      placeholder: 'وصف اختياري',
                      dir: 'rtl',
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'flex items-center justify-between py-2',
                  children: [
                    e.jsxs('div', {
                      className: 'space-y-0.5',
                      children: [
                        e.jsx(A, { children: a('templates.makePublic') }),
                        e.jsx('p', {
                          className: 'text-xs text-gray-500',
                          children: a('templates.publicDescription'),
                        }),
                      ],
                    }),
                    e.jsx(Le, { checked: j, onCheckedChange: _ }),
                  ],
                }),
              ],
            }),
            e.jsxs(Fe, {
              className: 'flex-col sm:flex-row gap-2',
              children: [
                e.jsx(v, {
                  variant: 'outline',
                  onClick: () => o(!1),
                  children: a('actions.cancel'),
                }),
                e.jsxs(v, {
                  onClick: S,
                  disabled: !i.en || !i.ar || N.isPending,
                  children: [
                    N.isPending && e.jsx(he, { className: 'h-4 w-4 me-2 animate-spin' }),
                    a('actions.save'),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  })
}
const Ja = Ia
export { Ja as component }
//# sourceMappingURL=advanced-search-DiYVc25J.js.map
