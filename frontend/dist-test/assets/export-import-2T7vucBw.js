import { u as B, r as o, j as e, t as Se } from './react-vendor-Buoak6m3.js'
import {
  A as be,
  E as ve,
  F as we,
  G as Ne,
  H as ye,
  J as D,
  q as Q,
  r as Z,
  t as ee,
  v as se,
  w as M,
  C as xe,
  ae as oe,
  K as ke,
  B as F,
  c as K,
  m as Y,
  p as Ee,
  N as _e,
  O as De,
  P as pe,
  Q as X,
  R as Te,
  U as G,
  j as $,
  k as V,
  o as W,
  V as ue,
  l as J,
  a2 as Fe,
} from './index-qYY0KoZ1.js'
import { R as Ce, a as z } from './radio-group-XNQBLInt.js'
import {
  cI as ie,
  aP as O,
  bP as ae,
  cb as H,
  aS as ce,
  cJ as qe,
  aH as Re,
  cK as Le,
  cL as de,
  aA as Ae,
  bw as re,
  aN as he,
  bA as Ie,
  b5 as Oe,
  aO as Me,
  bi as me,
  cM as te,
  aD as Ue,
  aJ as Ye,
  aI as ze,
  aR as Be,
  bC as Pe,
  b_ as $e,
  aV as Ve,
} from './vendor-misc-BiJvMP0A.js'
import { C as We, a as Je, b as He } from './collapsible-BZnv9hxQ.js'
import { T as Xe, a as Ge, b as Ke, c as Qe } from './tooltip-CE0dVuox.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './tanstack-vendor-BZC-rs5U.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
const ge = 'https://zkrcjzdemdmwhearhfgg.supabase.co',
  Ze = {
    dossier: {
      columns: [
        {
          field: 'name_en',
          header: 'Name (English) *',
          headerAr: 'الاسم (إنجليزي) *',
          required: !0,
          example: 'Ministry of Finance',
        },
        {
          field: 'name_ar',
          header: 'Name (Arabic)',
          headerAr: 'الاسم (عربي)',
          required: !1,
          example: 'وزارة المالية',
        },
        {
          field: 'type',
          header: 'Type *',
          headerAr: 'النوع *',
          required: !0,
          example: 'organization',
        },
        { field: 'status', header: 'Status', headerAr: 'الحالة', required: !1, example: 'active' },
        {
          field: 'summary_en',
          header: 'Summary (English)',
          headerAr: 'الملخص (إنجليزي)',
          required: !1,
        },
        {
          field: 'summary_ar',
          header: 'Summary (Arabic)',
          headerAr: 'الملخص (عربي)',
          required: !1,
        },
        {
          field: 'sensitivity_level',
          header: 'Sensitivity Level',
          headerAr: 'مستوى الحساسية',
          required: !1,
          example: 'low',
        },
        {
          field: 'tags',
          header: 'Tags',
          headerAr: 'الوسوم',
          required: !1,
          example: 'finance; government',
        },
      ],
    },
    person: {
      columns: [
        {
          field: 'name_en',
          header: 'Name (English) *',
          headerAr: 'الاسم (إنجليزي) *',
          required: !0,
          example: 'John Doe',
        },
        {
          field: 'name_ar',
          header: 'Name (Arabic)',
          headerAr: 'الاسم (عربي)',
          required: !1,
          example: 'جون دو',
        },
        {
          field: 'title_en',
          header: 'Title (English)',
          headerAr: 'المسمى الوظيفي (إنجليزي)',
          required: !1,
          example: 'Director',
        },
        {
          field: 'title_ar',
          header: 'Title (Arabic)',
          headerAr: 'المسمى الوظيفي (عربي)',
          required: !1,
        },
        {
          field: 'email',
          header: 'Email',
          headerAr: 'البريد الإلكتروني',
          required: !1,
          example: 'john@example.com',
        },
        {
          field: 'phone',
          header: 'Phone',
          headerAr: 'الهاتف',
          required: !1,
          example: '+1234567890',
        },
        {
          field: 'importance_level',
          header: 'Importance Level (1-5)',
          headerAr: 'مستوى الأهمية (1-5)',
          required: !1,
          example: '3',
        },
        {
          field: 'expertise_areas',
          header: 'Expertise Areas',
          headerAr: 'مجالات الخبرة',
          required: !1,
          example: 'Finance; Policy',
        },
        {
          field: 'languages',
          header: 'Languages',
          headerAr: 'اللغات',
          required: !1,
          example: 'English; Arabic',
        },
      ],
    },
    engagement: {
      columns: [
        {
          field: 'name_en',
          header: 'Name (English) *',
          headerAr: 'الاسم (إنجليزي) *',
          required: !0,
          example: 'Bilateral Meeting',
        },
        { field: 'name_ar', header: 'Name (Arabic)', headerAr: 'الاسم (عربي)', required: !1 },
        {
          field: 'engagement_type',
          header: 'Type *',
          headerAr: 'النوع *',
          required: !0,
          example: 'bilateral_meeting',
        },
        {
          field: 'category',
          header: 'Category',
          headerAr: 'الفئة',
          required: !1,
          example: 'diplomatic',
        },
        { field: 'status', header: 'Status', headerAr: 'الحالة', required: !1, example: 'planned' },
        {
          field: 'start_date',
          header: 'Start Date (YYYY-MM-DD)',
          headerAr: 'تاريخ البدء',
          required: !1,
          example: '2025-03-15',
        },
        {
          field: 'end_date',
          header: 'End Date (YYYY-MM-DD)',
          headerAr: 'تاريخ الانتهاء',
          required: !1,
          example: '2025-03-16',
        },
        {
          field: 'location_en',
          header: 'Location (English)',
          headerAr: 'الموقع (إنجليزي)',
          required: !1,
          example: 'Riyadh',
        },
        {
          field: 'location_ar',
          header: 'Location (Arabic)',
          headerAr: 'الموقع (عربي)',
          required: !1,
          example: 'الرياض',
        },
        {
          field: 'is_virtual',
          header: 'Virtual (true/false)',
          headerAr: 'افتراضي',
          required: !1,
          example: 'false',
        },
        {
          field: 'delegation_size',
          header: 'Delegation Size',
          headerAr: 'حجم الوفد',
          required: !1,
          example: '5',
        },
      ],
    },
    'working-group': {
      columns: [
        {
          field: 'name_en',
          header: 'Name (English) *',
          headerAr: 'الاسم (إنجليزي) *',
          required: !0,
          example: 'Statistics Committee',
        },
        { field: 'name_ar', header: 'Name (Arabic)', headerAr: 'الاسم (عربي)', required: !1 },
        { field: 'status', header: 'Status', headerAr: 'الحالة', required: !1, example: 'active' },
        {
          field: 'mandate_en',
          header: 'Mandate (English)',
          headerAr: 'التفويض (إنجليزي)',
          required: !1,
        },
        {
          field: 'mandate_ar',
          header: 'Mandate (Arabic)',
          headerAr: 'التفويض (عربي)',
          required: !1,
        },
        {
          field: 'formation_date',
          header: 'Formation Date (YYYY-MM-DD)',
          headerAr: 'تاريخ التشكيل',
          required: !1,
          example: '2024-01-01',
        },
        {
          field: 'dissolution_date',
          header: 'Dissolution Date (YYYY-MM-DD)',
          headerAr: 'تاريخ الحل',
          required: !1,
        },
      ],
    },
    commitment: {
      columns: [
        {
          field: 'title_en',
          header: 'Title (English) *',
          headerAr: 'العنوان (إنجليزي) *',
          required: !0,
          example: 'Deliver quarterly report',
        },
        { field: 'title_ar', header: 'Title (Arabic)', headerAr: 'العنوان (عربي)', required: !1 },
        {
          field: 'commitment_type',
          header: 'Type *',
          headerAr: 'النوع *',
          required: !0,
          example: 'internal',
        },
        { field: 'status', header: 'Status', headerAr: 'الحالة', required: !1, example: 'pending' },
        {
          field: 'priority',
          header: 'Priority',
          headerAr: 'الأولوية',
          required: !1,
          example: 'medium',
        },
        {
          field: 'deadline',
          header: 'Deadline (YYYY-MM-DD)',
          headerAr: 'الموعد النهائي',
          required: !1,
          example: '2025-03-31',
        },
        {
          field: 'completion_percentage',
          header: 'Completion %',
          headerAr: 'نسبة الإنجاز',
          required: !1,
          example: '0',
        },
      ],
    },
    deliverable: {
      columns: [
        {
          field: 'title_en',
          header: 'Title (English) *',
          headerAr: 'العنوان (إنجليزي) *',
          required: !0,
          example: 'Project Report',
        },
        { field: 'title_ar', header: 'Title (Arabic)', headerAr: 'العنوان (عربي)', required: !1 },
        { field: 'status', header: 'Status', headerAr: 'الحالة', required: !1, example: 'pending' },
        {
          field: 'due_date',
          header: 'Due Date (YYYY-MM-DD)',
          headerAr: 'تاريخ الاستحقاق',
          required: !1,
          example: '2025-04-15',
        },
        {
          field: 'completion_date',
          header: 'Completion Date (YYYY-MM-DD)',
          headerAr: 'تاريخ الإنجاز',
          required: !1,
        },
      ],
    },
  }
function es(a = {}) {
  const { t: r, i18n: C } = B('export-import'),
    [x, t] = o.useState(null),
    [b, k] = o.useState(!1),
    [y, N] = o.useState(null),
    R = o.useCallback(() => {
      const v = `sb-${new URL(ge).hostname.split('.')[0]}-auth-token`,
        u = localStorage.getItem(v)
      if (u)
        try {
          const s = JSON.parse(u)
          return s.access_token || s
        } catch {
          return u
        }
      return null
    }, []),
    h = o.useCallback(
      async (v) => {
        ;(k(!0),
          N(null),
          t({
            stage: 'fetching',
            progress: 0,
            message_en: r('progress.fetching'),
            message_ar: r('progress.fetching'),
          }))
        try {
          const u = R()
          if (!u) throw new Error('Not authenticated')
          t({
            stage: 'fetching',
            progress: 30,
            message_en: r('progress.fetching'),
            message_ar: r('progress.fetching'),
          })
          const s = await fetch(`${ge}/functions/v1/data-export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${u}` },
            body: JSON.stringify(v),
          })
          if (!s.ok) {
            const g = await s.json().catch(() => ({}))
            throw new Error(g.error?.message_en || 'Export failed')
          }
          const l = await s.json()
          if (
            (t({
              stage: 'generating',
              progress: 70,
              message_en: r('progress.generating'),
              message_ar: r('progress.generating'),
            }),
            v.format === 'xlsx' && l.content)
          ) {
            const g = new ie.Workbook(),
              f = g.addWorksheet(v.entityType),
              w = l.content.replace(/^\uFEFF/, '').split(`\r
`),
              S = w[0].split(',').map((j) => j.replace(/^"|"$/g, ''))
            f.addRow(S)
            const d = f.getRow(1)
            ;((d.font = { bold: !0 }),
              (d.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }))
            for (let j = 1; j < w.length; j++)
              if (w[j].trim()) {
                const E =
                  w[j]
                    .match(/(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)/g)
                    ?.map((_) => _.replace(/^,/, '').replace(/^"|"$/g, '').replace(/""/g, '"')) ||
                  []
                f.addRow(E)
              }
            f.columns.forEach((j) => {
              let E = 10
              ;(j.eachCell?.({ includeEmpty: !0 }, (_) => {
                const q = _.value ? _.value.toString().length : 0
                q > E && (E = Math.min(q, 50))
              }),
                (j.width = E + 2))
            })
            const m = await g.xlsx.writeBuffer(),
              n = new Blob([m], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              }),
              i = URL.createObjectURL(n),
              p = document.createElement('a')
            ;((p.href = i),
              (p.download = l.fileName.replace('.csv', '.xlsx')),
              document.body.appendChild(p),
              p.click(),
              document.body.removeChild(p),
              URL.revokeObjectURL(i))
          } else if (l.content) {
            const g = new Blob([l.content], { type: l.contentType }),
              f = URL.createObjectURL(g),
              w = document.createElement('a')
            ;((w.href = f),
              (w.download = l.fileName),
              document.body.appendChild(w),
              w.click(),
              document.body.removeChild(w),
              URL.revokeObjectURL(f))
          }
          t({
            stage: 'complete',
            progress: 100,
            message_en: r('progress.complete'),
            message_ar: r('progress.complete'),
          })
          const c = {
            success: !0,
            fileName: l.fileName,
            recordCount: l.recordCount,
            exportedAt: l.exportedAt,
            entityType: l.entityType,
            format: l.format,
          }
          return (
            a.onSuccess?.(c),
            O.success(r('export.success.title'), {
              description: r('export.success.message', { count: l.recordCount }),
            }),
            c
          )
        } catch (u) {
          const s = u instanceof Error ? u : new Error('Export failed')
          throw (
            N(s),
            t({ stage: 'error', progress: 0, message_en: s.message, message_ar: s.message }),
            a.onError?.(s),
            O.error(r('export.error.title'), { description: s.message }),
            s
          )
        } finally {
          k(!1)
        }
      },
      [R, a, r],
    ),
    A = o.useCallback(
      async (v) => {
        ;(k(!0), N(null))
        try {
          const u = Ze[v.entityType]
          if (!u) throw new Error(`Unknown entity type: ${v.entityType}`)
          const s = v.language || (C.language === 'ar' ? 'ar' : 'en')
          if (v.format === 'xlsx') {
            const l = new ie.Workbook(),
              c = l.addWorksheet(v.entityType),
              g = u.columns.map((p) =>
                s === 'both' ? `${p.header} / ${p.headerAr}` : s === 'ar' ? p.headerAr : p.header,
              )
            c.addRow(g)
            const f = c.getRow(1)
            if (
              ((f.font = { bold: !0 }),
              (f.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }),
              (f.font = { bold: !0, color: { argb: 'FFFFFFFF' } }),
              v.includeSampleData)
            ) {
              const p = u.columns.map((j) => j.example || '')
              c.addRow(p)
            }
            const w = u.columns.map((p) => (p.required ? '(Required)' : '(Optional)')),
              S = c.addRow(w)
            ;((S.font = { italic: !0, color: { argb: 'FF808080' } }),
              c.columns.forEach((p, j) => {
                const E = g[j] || '',
                  _ = Math.max(E.length, 15)
                p.width = Math.min(_ + 2, 40)
              }))
            const d = await l.xlsx.writeBuffer(),
              m = new Blob([d], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              }),
              n = URL.createObjectURL(m),
              i = document.createElement('a')
            ;((i.href = n),
              (i.download = `${v.entityType}_template.xlsx`),
              document.body.appendChild(i),
              i.click(),
              document.body.removeChild(i),
              URL.revokeObjectURL(n))
          } else {
            const c = [
              u.columns
                .map((d) => {
                  if (s === 'both') return `"${d.header} / ${d.headerAr}"`
                  const m = s === 'ar' ? d.headerAr : d.header
                  return m.includes(',') ? `"${m}"` : m
                })
                .join(','),
            ]
            if (v.includeSampleData) {
              const d = u.columns.map((m) => {
                const n = m.example || ''
                return n.includes(',') || n.includes('"') ? `"${n.replace(/"/g, '""')}"` : n
              })
              c.push(d.join(','))
            }
            const g =
                '\uFEFF' +
                c.join(`\r
`),
              f = new Blob([g], { type: 'text/csv; charset=utf-8' }),
              w = URL.createObjectURL(f),
              S = document.createElement('a')
            ;((S.href = w),
              (S.download = `${v.entityType}_template.csv`),
              document.body.appendChild(S),
              S.click(),
              document.body.removeChild(S),
              URL.revokeObjectURL(w))
          }
          O.success(r('template.success'))
        } catch (u) {
          const s = u instanceof Error ? u : new Error('Template download failed')
          throw (N(s), O.error(s.message), s)
        } finally {
          k(!1)
        }
      },
      [C.language, r],
    ),
    T = o.useCallback(() => {
      ;(t(null), N(null), k(!1))
    }, [])
  return { exportData: h, downloadTemplate: A, progress: x, isExporting: b, error: y, reset: T }
}
function ss({ open: a, onOpenChange: r, entityType: C, selectedIds: x, onExportComplete: t }) {
  const { t: b, i18n: k } = B('export-import'),
    y = k.language === 'ar',
    [N, R] = o.useState('xlsx'),
    [h, A] = o.useState('both'),
    [T, v] = o.useState(!1),
    [u, s] = o.useState(!!x?.length),
    {
      exportData: l,
      downloadTemplate: c,
      progress: g,
      isExporting: f,
      reset: w,
    } = es({
      onSuccess: () => {
        ;(t?.(),
          setTimeout(() => {
            ;(w(), r(!1))
          }, 1500))
      },
    }),
    S = o.useCallback(async () => {
      await l({ entityType: C, format: N, ids: u ? x : void 0, includeTemplate: T, language: h })
    }, [C, N, u, x, T, h, l]),
    d = o.useCallback(async () => {
      await c({
        entityType: C,
        format: N === 'xlsx' ? 'xlsx' : 'csv',
        includeSampleData: !0,
        language: h,
      })
    }, [C, N, h, c]),
    m = o.useCallback(() => {
      f || (w(), r(!1))
    }, [f, w, r]),
    n = {
      xlsx: e.jsx(H, { className: 'h-4 w-4' }),
      csv: e.jsx(Re, { className: 'h-4 w-4' }),
      json: e.jsx(qe, { className: 'h-4 w-4' }),
    }
  return e.jsx(be, {
    open: a,
    onOpenChange: m,
    children: e.jsxs(ve, {
      className: 'sm:max-w-[480px]',
      dir: y ? 'rtl' : 'ltr',
      children: [
        e.jsxs(we, {
          children: [
            e.jsxs(Ne, {
              className: 'flex items-center gap-2',
              children: [e.jsx(ae, { className: 'h-5 w-5' }), b('export.title')],
            }),
            e.jsx(ye, { children: b('export.description') }),
          ],
        }),
        e.jsxs('div', {
          className: 'grid gap-6 py-4',
          children: [
            e.jsxs('div', {
              className: 'space-y-3',
              children: [
                e.jsx(D, { children: b('export.format.label') }),
                e.jsxs(Ce, {
                  value: N,
                  onValueChange: (i) => R(i),
                  className: 'grid grid-cols-3 gap-2',
                  children: [
                    e.jsxs('div', {
                      children: [
                        e.jsx(z, { value: 'xlsx', id: 'format-xlsx', className: 'peer sr-only' }),
                        e.jsxs(D, {
                          htmlFor: 'format-xlsx',
                          className:
                            'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer',
                          children: [
                            n.xlsx,
                            e.jsx('span', {
                              className: 'text-xs mt-1',
                              children: b('export.format.xlsx'),
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      children: [
                        e.jsx(z, { value: 'csv', id: 'format-csv', className: 'peer sr-only' }),
                        e.jsxs(D, {
                          htmlFor: 'format-csv',
                          className:
                            'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer',
                          children: [
                            n.csv,
                            e.jsx('span', {
                              className: 'text-xs mt-1',
                              children: b('export.format.csv'),
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      children: [
                        e.jsx(z, { value: 'json', id: 'format-json', className: 'peer sr-only' }),
                        e.jsxs(D, {
                          htmlFor: 'format-json',
                          className:
                            'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer',
                          children: [
                            n.json,
                            e.jsx('span', {
                              className: 'text-xs mt-1',
                              children: b('export.format.json'),
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
              className: 'space-y-3',
              children: [
                e.jsx(D, { children: b('export.language.title') }),
                e.jsxs(Q, {
                  value: h,
                  onValueChange: (i) => A(i),
                  children: [
                    e.jsx(Z, { children: e.jsx(ee, {}) }),
                    e.jsxs(se, {
                      children: [
                        e.jsx(M, { value: 'en', children: b('export.language.en') }),
                        e.jsx(M, { value: 'ar', children: b('export.language.ar') }),
                        e.jsx(M, { value: 'both', children: b('export.language.both') }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'space-y-3',
              children: [
                e.jsx(D, { children: b('export.options.title') }),
                e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    x?.length
                      ? e.jsxs('div', {
                          className: 'flex items-center space-x-2 rtl:space-x-reverse',
                          children: [
                            e.jsx(xe, {
                              id: 'export-selected',
                              checked: u,
                              onCheckedChange: (i) => s(!!i),
                            }),
                            e.jsxs(D, {
                              htmlFor: 'export-selected',
                              className: 'text-sm font-normal cursor-pointer',
                              children: [b('export.options.selectedOnly'), ' (', x.length, ')'],
                            }),
                          ],
                        })
                      : null,
                    e.jsxs('div', {
                      className: 'flex items-center space-x-2 rtl:space-x-reverse',
                      children: [
                        e.jsx(xe, {
                          id: 'include-template',
                          checked: T,
                          onCheckedChange: (i) => v(!!i),
                        }),
                        e.jsx(D, {
                          htmlFor: 'include-template',
                          className: 'text-sm font-normal cursor-pointer',
                          children: b('export.options.includeTemplate'),
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            g &&
              e.jsxs('div', {
                className: 'space-y-2',
                children: [
                  e.jsxs('div', {
                    className: 'flex items-center justify-between text-sm',
                    children: [
                      e.jsx('span', {
                        children: k.language === 'ar' ? g.message_ar : g.message_en,
                      }),
                      e.jsxs('span', { children: [g.progress, '%'] }),
                    ],
                  }),
                  e.jsx(oe, { value: g.progress, className: 'h-2' }),
                ],
              }),
          ],
        }),
        e.jsxs(ke, {
          className: 'flex-col sm:flex-row gap-2',
          children: [
            e.jsxs(F, {
              variant: 'outline',
              onClick: d,
              disabled: f,
              className: 'w-full sm:w-auto',
              children: [e.jsx(H, { className: 'h-4 w-4 me-2' }), b('template.button')],
            }),
            e.jsxs('div', {
              className: 'flex gap-2 w-full sm:w-auto',
              children: [
                e.jsx(F, {
                  variant: 'outline',
                  onClick: m,
                  disabled: f,
                  className: 'flex-1 sm:flex-none',
                  children: b('common.cancel'),
                }),
                e.jsx(F, {
                  onClick: S,
                  disabled: f,
                  className: 'flex-1 sm:flex-none',
                  children: f
                    ? e.jsxs(e.Fragment, {
                        children: [
                          e.jsx(ce, { className: 'h-4 w-4 me-2 animate-spin' }),
                          b('export.downloading'),
                        ],
                      })
                    : e.jsxs(e.Fragment, {
                        children: [e.jsx(ae, { className: 'h-4 w-4 me-2' }), b('export.button')],
                      }),
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  })
}
const le = 'https://zkrcjzdemdmwhearhfgg.supabase.co',
  fe = 10
function as(a) {
  const { t: r } = B('export-import'),
    [C, x] = o.useState(null),
    [t, b] = o.useState(null),
    [k, y] = o.useState(null),
    [N, R] = o.useState(!1),
    [h, A] = o.useState(!1),
    [T, v] = o.useState(null),
    u = o.useRef(null),
    s = o.useCallback(() => {
      const d = `sb-${new URL(le).hostname.split('.')[0]}-auth-token`,
        m = localStorage.getItem(d)
      if (m)
        try {
          const n = JSON.parse(m)
          return n.access_token || n
        } catch {
          return m
        }
      return null
    }, []),
    l = o.useCallback(
      (d) =>
        new Promise((m, n) => {
          Le.parse(d, {
            header: !0,
            skipEmptyLines: !0,
            transformHeader: (i) => i.trim(),
            complete: (i) => {
              const p = i.meta.fields || [],
                j = i.data
              m({ headers: p, data: j })
            },
            error: (i) => {
              n(i)
            },
          })
        }),
      [],
    ),
    c = o.useCallback(async (d) => {
      const m = new ie.Workbook(),
        n = await d.arrayBuffer()
      await m.xlsx.load(n)
      const i = m.worksheets[0]
      if (!i) throw new Error('No worksheet found in file')
      const p = [],
        j = []
      return (
        i.eachRow((E, _) => {
          if (_ === 1)
            E.eachCell((q, U) => {
              p[U - 1] = String(q.value || '').trim()
            })
          else {
            const q = {}
            ;(E.eachCell((U, L) => {
              const P = p[L - 1]
              if (P) {
                let I = U.value
                ;(typeof I == 'object' &&
                  I !== null &&
                  ('text' in I ? (I = I.text) : 'result' in I && (I = I.result)),
                  (q[P] = I))
              }
            }),
              Object.keys(q).length > 0 && j.push(q))
          }
        }),
        { headers: p, data: j }
      )
    }, []),
    g = o.useCallback(
      async (d) => {
        ;(R(!0), v(null), x(null), (u.current = new AbortController()))
        try {
          if (d.size / 1048576 > fe) throw new Error(r('import.error.tooLarge', { size: fe }))
          y({
            stage: 'uploading',
            progress: 10,
            message_en: r('progress.uploading'),
            message_ar: r('progress.uploading'),
          })
          let n
          const i = d.name.toLowerCase()
          if (
            (y({
              stage: 'parsing',
              progress: 30,
              message_en: r('progress.parsing'),
              message_ar: r('progress.parsing'),
            }),
            i.endsWith('.xlsx') || i.endsWith('.xls'))
          )
            n = await c(d)
          else if (i.endsWith('.csv')) {
            const _ = await d.text()
            n = await l(_)
          } else throw new Error(r('import.error.invalidFormat'))
          if (n.data.length === 0) throw new Error(r('import.error.emptyFile'))
          y({
            stage: 'validating',
            progress: 50,
            message_en: r('progress.validating'),
            message_ar: r('progress.validating'),
            totalRows: n.data.length,
          })
          const p = s()
          if (!p) throw new Error('Not authenticated')
          const j = await fetch(`${le}/functions/v1/data-import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p}` },
            body: JSON.stringify({
              entityType: a.entityType,
              headers: n.headers,
              data: n.data,
              mode: a.defaultMode || 'upsert',
            }),
            signal: u.current.signal,
          })
          if (!j.ok) {
            const _ = await j.json().catch(() => ({}))
            throw new Error(_.error?.message_en || 'Validation failed')
          }
          const E = await j.json()
          return (
            (E.fileInfo = {
              name: d.name,
              size: d.size,
              rows: n.data.length,
              columns: n.headers,
              format: i.endsWith('.xlsx') || i.endsWith('.xls') ? 'xlsx' : 'csv',
            }),
            y({
              stage: 'complete',
              progress: 100,
              message_en: r('progress.complete'),
              message_ar: r('progress.complete'),
            }),
            x(E),
            a.onValidationComplete?.(E),
            E
          )
        } catch (m) {
          if (m.name === 'AbortError') throw new Error('Operation cancelled')
          const n = m instanceof Error ? m : new Error('Upload failed')
          throw (
            v(n),
            y({ stage: 'error', progress: 0, message_en: n.message, message_ar: n.message }),
            a.onError?.(n),
            O.error(r('import.error.title'), { description: n.message }),
            n
          )
        } finally {
          R(!1)
        }
      },
      [s, a, l, c, r],
    ),
    f = o.useCallback(
      async (d) => {
        ;(A(!0), v(null), (u.current = new AbortController()))
        try {
          y({
            stage: 'importing',
            progress: 0,
            message_en: r('progress.importing'),
            message_ar: r('progress.importing'),
            totalRows: d.rows.length,
            currentRow: 0,
          })
          const m = s()
          if (!m) throw new Error('Not authenticated')
          const n = d.rows.filter(
            (j) => j.status === 'valid' || j.status === 'warning' || j.status === 'conflict',
          )
          y({
            stage: 'importing',
            progress: 20,
            message_en: r('progress.importing'),
            message_ar: r('progress.importing'),
            totalRows: n.length,
          })
          const i = await fetch(`${le}/functions/v1/data-import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${m}` },
            body: JSON.stringify({
              entityType: a.entityType,
              mode: d.mode,
              conflictResolution: d.conflictResolution,
              rows: n,
              conflictResolutions: d.conflictResolutions,
              skipWarnings: d.skipWarnings,
              dryRun: d.dryRun,
            }),
            signal: u.current.signal,
          })
          if (!i.ok) {
            const j = await i.json().catch(() => ({}))
            throw new Error(j.error?.message_en || 'Import failed')
          }
          const p = await i.json()
          return (
            y({
              stage: 'complete',
              progress: 100,
              message_en: r('progress.complete'),
              message_ar: r('progress.complete'),
            }),
            b(p),
            a.onSuccess?.(p),
            p.success
              ? O.success(r('import.success.title'), {
                  description: r('import.success.message', {
                    success: p.successCount,
                    total: p.totalRows,
                  }),
                })
              : p.successCount > 0
                ? O.warning(r('import.error.partialSuccess'), {
                    description: r('import.error.partialSuccess', {
                      failed: p.failedCount,
                      total: p.totalRows,
                    }),
                  })
                : O.error(r('import.error.title')),
            p
          )
        } catch (m) {
          if (m.name === 'AbortError') throw new Error('Operation cancelled')
          const n = m instanceof Error ? m : new Error('Import failed')
          throw (
            v(n),
            y({ stage: 'error', progress: 0, message_en: n.message, message_ar: n.message }),
            a.onError?.(n),
            O.error(r('import.error.title'), { description: n.message }),
            n
          )
        } finally {
          A(!1)
        }
      },
      [s, a, r],
    ),
    w = o.useCallback(() => {
      ;(u.current && u.current.abort(), R(!1), A(!1), y(null))
    }, []),
    S = o.useCallback(() => {
      ;(x(null), b(null), y(null), v(null), R(!1), A(!1))
    }, [])
  return {
    uploadFile: g,
    executeImport: f,
    cancel: w,
    validationResult: C,
    importResponse: t,
    progress: k,
    isValidating: N,
    isImporting: h,
    error: T,
    reset: S,
  }
}
const rs = {
    valid: e.jsx(me, { className: 'h-4 w-4 text-green-500' }),
    invalid: e.jsx(de, { className: 'h-4 w-4 text-red-500' }),
    warning: e.jsx(Ae, { className: 'h-4 w-4 text-yellow-500' }),
    conflict: e.jsx(re, { className: 'h-4 w-4 text-blue-500' }),
    pending: e.jsx(re, { className: 'h-4 w-4 text-muted-foreground' }),
  },
  je = {
    valid: {
      variant: 'default',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    },
    invalid: { variant: 'destructive' },
    warning: {
      variant: 'secondary',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    conflict: { variant: 'outline', className: 'border-blue-500 text-blue-600 dark:text-blue-400' },
    pending: { variant: 'secondary' },
  }
function ts({ result: a, maxRowsPreview: r = 100, className: C }) {
  const { t: x, i18n: t } = B('export-import'),
    b = t.language === 'ar',
    [k, y] = o.useState(!1),
    [N, R] = o.useState(new Set()),
    h = (s) => {
      R((l) => {
        const c = new Set(l)
        return (c.has(s) ? c.delete(s) : c.add(s), c)
      })
    },
    A = o.useMemo(() => {
      let s = a.rows
      if (!k) {
        const l = s.filter(
          (c) => c.status === 'invalid' || c.status === 'warning' || c.status === 'conflict',
        )
        l.length > 0 && l.length < s.length && (s = l)
      }
      return s.slice(0, r)
    }, [a.rows, k, r]),
    T = o.useMemo(() => {
      const s = {}
      for (const l of a.rows) for (const c of l.errors) s[c.code] = (s[c.code] || 0) + 1
      return s
    }, [a.rows]),
    v = (s) => (b ? s.message_ar : s.message_en),
    u = (s) => (b ? s.suggestion_ar : s.suggestion_en)
  return e.jsxs('div', {
    className: K('space-y-4', C),
    dir: b ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'grid grid-cols-2 sm:grid-cols-4 gap-3',
        children: [
          e.jsxs('div', {
            className: 'rounded-lg border p-3 bg-card',
            children: [
              e.jsx('div', { className: 'text-2xl font-bold', children: a.totalRows }),
              e.jsx('div', {
                className: 'text-xs text-muted-foreground',
                children: x('import.validation.summary.totalRows'),
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'rounded-lg border p-3 bg-green-50 dark:bg-green-900/20',
            children: [
              e.jsx('div', {
                className: 'text-2xl font-bold text-green-600',
                children: a.validRows,
              }),
              e.jsx('div', {
                className: 'text-xs text-green-700 dark:text-green-400',
                children: x('import.validation.summary.validRows'),
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'rounded-lg border p-3 bg-red-50 dark:bg-red-900/20',
            children: [
              e.jsx('div', {
                className: 'text-2xl font-bold text-red-600',
                children: a.invalidRows,
              }),
              e.jsx('div', {
                className: 'text-xs text-red-700 dark:text-red-400',
                children: x('import.validation.summary.invalidRows'),
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'rounded-lg border p-3 bg-yellow-50 dark:bg-yellow-900/20',
            children: [
              e.jsx('div', {
                className: 'text-2xl font-bold text-yellow-600',
                children: a.warningRows,
              }),
              e.jsx('div', {
                className: 'text-xs text-yellow-700 dark:text-yellow-400',
                children: x('import.validation.summary.warningRows'),
              }),
            ],
          }),
        ],
      }),
      a.missingRequiredColumns &&
        a.missingRequiredColumns.length > 0 &&
        e.jsx('div', {
          className: 'rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 p-4',
          children: e.jsxs('div', {
            className: 'flex items-center gap-2 text-red-700 dark:text-red-400',
            children: [
              e.jsx(de, { className: 'h-5 w-5' }),
              e.jsx('span', {
                className: 'font-medium',
                children: x('import.error.missingColumns', {
                  columns: a.missingRequiredColumns.join(', '),
                }),
              }),
            ],
          }),
        }),
      a.unmappedColumns &&
        a.unmappedColumns.length > 0 &&
        e.jsx('div', {
          className: 'rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-4',
          children: e.jsxs('div', {
            className: 'flex items-center gap-2 text-yellow-700 dark:text-yellow-400',
            children: [
              e.jsx(Ae, { className: 'h-5 w-5' }),
              e.jsxs('span', {
                children: ['Unmapped columns will be ignored: ', a.unmappedColumns.join(', ')],
              }),
            ],
          }),
        }),
      Object.keys(T).length > 0 &&
        e.jsxs(We, {
          children: [
            e.jsx(Je, {
              asChild: !0,
              children: e.jsxs(F, {
                variant: 'outline',
                className: 'w-full justify-between',
                children: [
                  e.jsxs('span', {
                    className: 'flex items-center gap-2',
                    children: [
                      e.jsx(re, { className: 'h-4 w-4' }),
                      x('import.validation.errors.title'),
                      e.jsx(Y, {
                        variant: 'secondary',
                        children: Object.values(T).reduce((s, l) => s + l, 0),
                      }),
                    ],
                  }),
                  e.jsx(he, { className: 'h-4 w-4' }),
                ],
              }),
            }),
            e.jsx(He, {
              className: 'mt-2',
              children: e.jsx('div', {
                className: 'rounded-lg border p-3 space-y-2',
                children: Object.entries(T).map(([s, l]) =>
                  e.jsxs(
                    'div',
                    {
                      className: 'flex items-center justify-between text-sm',
                      children: [
                        e.jsx('span', {
                          className: 'text-muted-foreground',
                          children: x(`errors.${s}`),
                        }),
                        e.jsx(Y, { variant: 'outline', children: l }),
                      ],
                    },
                    s,
                  ),
                ),
              }),
            }),
          ],
        }),
      a.validRows > 0 &&
        a.invalidRows > 0 &&
        e.jsx('div', {
          className: 'flex justify-end',
          children: e.jsx(F, {
            variant: 'ghost',
            size: 'sm',
            onClick: () => y(!k),
            children: k
              ? e.jsxs(e.Fragment, {
                  children: [
                    e.jsx(Ie, { className: 'h-4 w-4 me-2' }),
                    x('import.validation.errors.hideErrors'),
                  ],
                })
              : e.jsxs(e.Fragment, {
                  children: [
                    e.jsx(Oe, { className: 'h-4 w-4 me-2' }),
                    x('import.validation.errors.showAll'),
                  ],
                }),
          }),
        }),
      e.jsx(Ee, {
        className: 'h-[300px] rounded-md border',
        children: e.jsxs(_e, {
          children: [
            e.jsx(De, {
              children: e.jsxs(pe, {
                children: [
                  e.jsx(X, {
                    className: 'w-16',
                    children:
                      (x('import.preview.showingRows', { shown: '', total: '' }) || '')
                        .split(':')[0]
                        .trim() || 'Row',
                  }),
                  e.jsx(X, {
                    className: 'w-24',
                    children: x('import.validation.status.valid').split(' ')[0] || 'Status',
                  }),
                  e.jsx(X, {
                    children: x('import.validation.errors.title').split(' ')[0] || 'Details',
                  }),
                  e.jsx(X, { className: 'w-10' }),
                ],
              }),
            }),
            e.jsx(Te, {
              children: A.map((s) =>
                e.jsxs(
                  pe,
                  {
                    className: K(
                      s.status === 'invalid' && 'bg-red-50/50 dark:bg-red-900/10',
                      s.status === 'warning' && 'bg-yellow-50/50 dark:bg-yellow-900/10',
                      s.status === 'conflict' && 'bg-blue-50/50 dark:bg-blue-900/10',
                    ),
                    children: [
                      e.jsxs(G, { className: 'font-medium', children: ['#', s.row] }),
                      e.jsx(G, {
                        children: e.jsx(Y, {
                          variant: je[s.status]?.variant || 'secondary',
                          className: je[s.status]?.className,
                          children: e.jsxs('span', {
                            className: 'flex items-center gap-1',
                            children: [rs[s.status], x(`import.validation.status.${s.status}`)],
                          }),
                        }),
                      }),
                      e.jsx(G, {
                        children:
                          s.errors.length > 0
                            ? e.jsxs('div', {
                                className: 'space-y-1',
                                children: [
                                  s.errors
                                    .slice(0, N.has(s.row) ? void 0 : 2)
                                    .map((l, c) =>
                                      e.jsx(
                                        Xe,
                                        {
                                          children: e.jsxs(Ge, {
                                            children: [
                                              e.jsx(Ke, {
                                                asChild: !0,
                                                children: e.jsxs('div', {
                                                  className: 'text-sm',
                                                  children: [
                                                    e.jsxs('span', {
                                                      className:
                                                        'font-medium text-muted-foreground',
                                                      children: [l.column, ':'],
                                                    }),
                                                    ' ',
                                                    e.jsx('span', {
                                                      className:
                                                        l.severity === 'error'
                                                          ? 'text-red-600'
                                                          : 'text-yellow-600',
                                                      children: v(l),
                                                    }),
                                                  ],
                                                }),
                                              }),
                                              u(l) &&
                                                e.jsx(Qe, {
                                                  children: e.jsx('p', { children: u(l) }),
                                                }),
                                            ],
                                          }),
                                        },
                                        c,
                                      ),
                                    ),
                                  s.errors.length > 2 &&
                                    !N.has(s.row) &&
                                    e.jsxs('div', {
                                      className: 'text-xs text-muted-foreground',
                                      children: ['+', s.errors.length - 2, ' more errors'],
                                    }),
                                ],
                              })
                            : s.status === 'conflict'
                              ? e.jsxs('div', {
                                  className: 'text-sm text-blue-600',
                                  children: [
                                    x('errors.conflict_detected'),
                                    s.existingId &&
                                      e.jsxs('span', {
                                        className: 'text-muted-foreground ms-2',
                                        children: ['(ID: ', s.existingId.slice(0, 8), '...)'],
                                      }),
                                  ],
                                })
                              : s.data
                                ? e.jsx('div', {
                                    className:
                                      'text-sm text-muted-foreground truncate max-w-[300px]',
                                    children: Object.entries(s.data)
                                      .filter(([l, c]) => c && !l.includes('_at'))
                                      .slice(0, 3)
                                      .map(([l, c]) => `${l}: ${String(c).slice(0, 20)}`)
                                      .join(', '),
                                  })
                                : null,
                      }),
                      e.jsx(G, {
                        children:
                          s.errors.length > 2 &&
                          e.jsx(F, {
                            variant: 'ghost',
                            size: 'icon',
                            className: 'h-8 w-8',
                            onClick: () => h(s.row),
                            children: N.has(s.row)
                              ? e.jsx(Me, { className: 'h-4 w-4' })
                              : e.jsx(he, { className: 'h-4 w-4' }),
                          }),
                      }),
                    ],
                  },
                  s.row,
                ),
              ),
            }),
          ],
        }),
      }),
      A.length < a.rows.length &&
        e.jsx('p', {
          className: 'text-sm text-muted-foreground text-center',
          children: x('import.preview.showingRows', { shown: A.length, total: a.rows.length }),
        }),
      e.jsx('div', {
        className: K(
          'rounded-lg p-4 text-center',
          a.invalidRows === 0 &&
            'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
          a.invalidRows > 0 && 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
        ),
        children:
          a.invalidRows === 0
            ? e.jsxs('div', {
                className: 'flex items-center justify-center gap-2',
                children: [e.jsx(me, { className: 'h-5 w-5' }), x('import.validation.noErrors')],
              })
            : e.jsxs('div', {
                className: 'flex items-center justify-center gap-2',
                children: [e.jsx(de, { className: 'h-5 w-5' }), x('import.validation.hasErrors')],
              }),
      }),
    ],
  })
}
function ls({ open: a, onOpenChange: r, entityType: C, onImportComplete: x }) {
  const { t, i18n: b } = B('export-import'),
    k = b.language === 'ar',
    [y, N] = o.useState('upload'),
    [R, h] = o.useState(null),
    [A, T] = o.useState('upsert'),
    [v, u] = o.useState('skip'),
    {
      uploadFile: s,
      executeImport: l,
      cancel: c,
      validationResult: g,
      importResponse: f,
      progress: w,
      isValidating: S,
      isImporting: d,
      reset: m,
    } = as({
      entityType: C,
      defaultMode: A,
      defaultConflictResolution: v,
      onSuccess: () => {
        x?.()
      },
    }),
    n = o.useCallback(
      async (L) => {
        if (L.length > 0) {
          const P = L[0]
          ;(h(P), N('validate'))
          try {
            ;(await s(P), N('options'))
          } catch {
            N('upload')
          }
        }
      },
      [s],
    ),
    {
      getRootProps: i,
      getInputProps: p,
      isDragActive: j,
    } = Se({
      onDrop: n,
      accept: {
        'text/csv': ['.csv'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-excel': ['.xls'],
      },
      maxFiles: 1,
      disabled: S || d,
    }),
    E = o.useCallback(async () => {
      if (!g) return
      N('import')
      const L = {
        entityType: C,
        mode: A,
        conflictResolution: v,
        rows: g.rows,
        skipWarnings: !1,
        dryRun: !1,
      }
      try {
        ;(await l(L), N('complete'))
      } catch {
        N('options')
      }
    }, [g, C, A, v, l]),
    _ = o.useCallback(() => {
      !S && !d && (m(), N('upload'), h(null), T('upsert'), u('skip'), r(!1))
    }, [S, d, m, r]),
    q = o.useCallback(() => {
      ;(c(), m(), N('upload'), h(null))
    }, [c, m]),
    U = g && g.validRows > 0 && !g.missingRequiredColumns?.length
  return e.jsx(be, {
    open: a,
    onOpenChange: _,
    children: e.jsxs(ve, {
      className: 'sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col',
      dir: k ? 'rtl' : 'ltr',
      children: [
        e.jsxs(we, {
          children: [
            e.jsxs(Ne, {
              className: 'flex items-center gap-2',
              children: [e.jsx(te, { className: 'h-5 w-5' }), t('import.title')],
            }),
            e.jsx(ye, { children: t('import.description') }),
          ],
        }),
        e.jsxs('div', {
          className: 'flex-1 overflow-y-auto py-4',
          children: [
            y === 'upload' &&
              e.jsxs('div', {
                className: 'space-y-4',
                children: [
                  e.jsxs('div', {
                    ...i(),
                    className: K(
                      'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                      j && 'border-primary bg-primary/5',
                      !j && 'border-muted-foreground/25 hover:border-primary/50',
                    ),
                    children: [
                      e.jsx('input', { ...p() }),
                      e.jsxs('div', {
                        className: 'flex flex-col items-center gap-3',
                        children: [
                          e.jsxs('div', {
                            className: 'flex gap-2',
                            children: [
                              e.jsx(H, { className: 'h-10 w-10 text-green-500' }),
                              e.jsx(Re, { className: 'h-10 w-10 text-blue-500' }),
                            ],
                          }),
                          e.jsxs('div', {
                            children: [
                              e.jsx('p', {
                                className: 'text-lg font-medium',
                                children: t('import.dropzone.title'),
                              }),
                              e.jsx('p', {
                                className: 'text-sm text-muted-foreground mt-1',
                                children: t('import.dropzone.subtitle'),
                              }),
                              e.jsx('p', {
                                className: 'text-xs text-muted-foreground mt-2',
                                children: t('import.dropzone.maxSize', { size: 10 }),
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'rounded-lg border bg-muted/50 p-4 space-y-2',
                    children: [
                      e.jsx('h4', {
                        className: 'font-medium',
                        children: t('template.instructions.title'),
                      }),
                      e.jsxs('ul', {
                        className: 'text-sm text-muted-foreground space-y-1',
                        children: [
                          e.jsx('li', { children: t('template.instructions.requiredFields') }),
                          e.jsx('li', { children: t('template.instructions.dateFormat') }),
                          e.jsx('li', { children: t('template.instructions.booleanFormat') }),
                          e.jsx('li', { children: t('template.instructions.encoding') }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            y === 'validate' &&
              e.jsxs('div', {
                className: 'flex flex-col items-center justify-center py-8 space-y-4',
                children: [
                  e.jsx(ce, { className: 'h-12 w-12 animate-spin text-primary' }),
                  e.jsxs('div', {
                    className: 'text-center',
                    children: [
                      e.jsx('p', {
                        className: 'font-medium',
                        children: t('import.validation.validating'),
                      }),
                      R &&
                        e.jsx('p', {
                          className: 'text-sm text-muted-foreground mt-1',
                          children: R.name,
                        }),
                    ],
                  }),
                  w &&
                    e.jsxs('div', {
                      className: 'w-full max-w-xs space-y-2',
                      children: [
                        e.jsx(oe, { value: w.progress, className: 'h-2' }),
                        e.jsx('p', {
                          className: 'text-xs text-center text-muted-foreground',
                          children: k ? w.message_ar : w.message_en,
                        }),
                      ],
                    }),
                ],
              }),
            y === 'options' &&
              g &&
              e.jsxs('div', {
                className: 'space-y-6',
                children: [
                  e.jsxs('div', {
                    className: 'flex items-center gap-3 p-3 rounded-lg bg-muted/50',
                    children: [
                      e.jsx(H, { className: 'h-8 w-8 text-green-500' }),
                      e.jsxs('div', {
                        className: 'flex-1 min-w-0',
                        children: [
                          e.jsx('p', {
                            className: 'font-medium truncate',
                            children: g.fileInfo?.name,
                          }),
                          e.jsxs('p', {
                            className: 'text-sm text-muted-foreground',
                            children: [
                              g.fileInfo?.rows,
                              ' rows, ',
                              g.fileInfo?.columns.length,
                              ' columns',
                            ],
                          }),
                        ],
                      }),
                      e.jsx(F, {
                        variant: 'ghost',
                        size: 'icon',
                        onClick: q,
                        children: e.jsx(Ue, { className: 'h-4 w-4' }),
                      }),
                    ],
                  }),
                  e.jsx(ts, { result: g, maxRowsPreview: 50 }),
                  U &&
                    e.jsxs(e.Fragment, {
                      children: [
                        e.jsxs('div', {
                          className: 'space-y-3',
                          children: [
                            e.jsx(D, { children: t('import.mode.title') }),
                            e.jsxs(Ce, {
                              value: A,
                              onValueChange: (L) => T(L),
                              className: 'space-y-2',
                              children: [
                                e.jsxs('div', {
                                  className:
                                    'flex items-start space-x-3 rtl:space-x-reverse p-3 rounded-lg border hover:bg-muted/50',
                                  children: [
                                    e.jsx(z, {
                                      value: 'create',
                                      id: 'mode-create',
                                      className: 'mt-1',
                                    }),
                                    e.jsxs('div', {
                                      className: 'flex-1',
                                      children: [
                                        e.jsx(D, {
                                          htmlFor: 'mode-create',
                                          className: 'font-medium cursor-pointer',
                                          children: t('import.mode.create'),
                                        }),
                                        e.jsx('p', {
                                          className: 'text-sm text-muted-foreground',
                                          children: t('import.mode.createDescription'),
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                e.jsxs('div', {
                                  className:
                                    'flex items-start space-x-3 rtl:space-x-reverse p-3 rounded-lg border hover:bg-muted/50',
                                  children: [
                                    e.jsx(z, {
                                      value: 'update',
                                      id: 'mode-update',
                                      className: 'mt-1',
                                    }),
                                    e.jsxs('div', {
                                      className: 'flex-1',
                                      children: [
                                        e.jsx(D, {
                                          htmlFor: 'mode-update',
                                          className: 'font-medium cursor-pointer',
                                          children: t('import.mode.update'),
                                        }),
                                        e.jsx('p', {
                                          className: 'text-sm text-muted-foreground',
                                          children: t('import.mode.updateDescription'),
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                e.jsxs('div', {
                                  className:
                                    'flex items-start space-x-3 rtl:space-x-reverse p-3 rounded-lg border hover:bg-muted/50',
                                  children: [
                                    e.jsx(z, {
                                      value: 'upsert',
                                      id: 'mode-upsert',
                                      className: 'mt-1',
                                    }),
                                    e.jsxs('div', {
                                      className: 'flex-1',
                                      children: [
                                        e.jsx(D, {
                                          htmlFor: 'mode-upsert',
                                          className: 'font-medium cursor-pointer',
                                          children: t('import.mode.upsert'),
                                        }),
                                        e.jsx('p', {
                                          className: 'text-sm text-muted-foreground',
                                          children: t('import.mode.upsertDescription'),
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                        g.conflictRows > 0 &&
                          e.jsxs('div', {
                            className: 'space-y-3',
                            children: [
                              e.jsx(D, { children: t('import.conflictResolution.title') }),
                              e.jsxs(Q, {
                                value: v,
                                onValueChange: (L) => u(L),
                                children: [
                                  e.jsx(Z, { children: e.jsx(ee, {}) }),
                                  e.jsxs(se, {
                                    children: [
                                      e.jsx(M, {
                                        value: 'skip',
                                        children: e.jsxs('div', {
                                          children: [
                                            e.jsx('span', {
                                              className: 'font-medium',
                                              children: t('import.conflictResolution.skip'),
                                            }),
                                            e.jsx('p', {
                                              className: 'text-xs text-muted-foreground',
                                              children: t(
                                                'import.conflictResolution.skipDescription',
                                              ),
                                            }),
                                          ],
                                        }),
                                      }),
                                      e.jsx(M, {
                                        value: 'overwrite',
                                        children: e.jsxs('div', {
                                          children: [
                                            e.jsx('span', {
                                              className: 'font-medium',
                                              children: t('import.conflictResolution.overwrite'),
                                            }),
                                            e.jsx('p', {
                                              className: 'text-xs text-muted-foreground',
                                              children: t(
                                                'import.conflictResolution.overwriteDescription',
                                              ),
                                            }),
                                          ],
                                        }),
                                      }),
                                      e.jsx(M, {
                                        value: 'merge',
                                        children: e.jsxs('div', {
                                          children: [
                                            e.jsx('span', {
                                              className: 'font-medium',
                                              children: t('import.conflictResolution.merge'),
                                            }),
                                            e.jsx('p', {
                                              className: 'text-xs text-muted-foreground',
                                              children: t(
                                                'import.conflictResolution.mergeDescription',
                                              ),
                                            }),
                                          ],
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
                ],
              }),
            y === 'import' &&
              e.jsxs('div', {
                className: 'flex flex-col items-center justify-center py-8 space-y-4',
                children: [
                  e.jsx(ce, { className: 'h-12 w-12 animate-spin text-primary' }),
                  e.jsx('div', {
                    className: 'text-center',
                    children: e.jsx('p', {
                      className: 'font-medium',
                      children: t('import.execute.importing'),
                    }),
                  }),
                  w &&
                    e.jsxs('div', {
                      className: 'w-full max-w-xs space-y-2',
                      children: [
                        e.jsx(oe, { value: w.progress, className: 'h-2' }),
                        e.jsx('p', {
                          className: 'text-xs text-center text-muted-foreground',
                          children: k ? w.message_ar : w.message_en,
                        }),
                      ],
                    }),
                ],
              }),
            y === 'complete' &&
              f &&
              e.jsxs('div', {
                className: 'flex flex-col items-center justify-center py-8 space-y-4',
                children: [
                  f.success
                    ? e.jsx(me, { className: 'h-12 w-12 text-green-500' })
                    : e.jsx(re, { className: 'h-12 w-12 text-yellow-500' }),
                  e.jsxs('div', {
                    className: 'text-center space-y-2',
                    children: [
                      e.jsx('p', {
                        className: 'font-medium text-lg',
                        children: f.success
                          ? t('import.success.title')
                          : t('import.error.partialSuccess', {
                              failed: f.failedCount,
                              total: f.totalRows,
                            }),
                      }),
                      e.jsx('p', {
                        className: 'text-muted-foreground',
                        children: t('import.success.message', {
                          success: f.successCount,
                          total: f.totalRows,
                        }),
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'grid grid-cols-3 gap-4 w-full max-w-sm mt-4',
                    children: [
                      e.jsxs('div', {
                        className: 'text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20',
                        children: [
                          e.jsx('p', {
                            className: 'text-2xl font-bold text-green-600',
                            children: f.createdCount,
                          }),
                          e.jsx('p', { className: 'text-xs text-green-700', children: 'Created' }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20',
                        children: [
                          e.jsx('p', {
                            className: 'text-2xl font-bold text-blue-600',
                            children: f.updatedCount,
                          }),
                          e.jsx('p', { className: 'text-xs text-blue-700', children: 'Updated' }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'text-center p-3 rounded-lg bg-muted',
                        children: [
                          e.jsx('p', {
                            className: 'text-2xl font-bold text-muted-foreground',
                            children: f.skippedCount,
                          }),
                          e.jsx('p', {
                            className: 'text-xs text-muted-foreground',
                            children: 'Skipped',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
          ],
        }),
        e.jsxs(ke, {
          className: 'flex-col sm:flex-row gap-2 border-t pt-4',
          children: [
            y === 'upload' &&
              e.jsx(F, {
                variant: 'outline',
                onClick: _,
                className: 'w-full sm:w-auto',
                children: t('common.cancel'),
              }),
            y === 'options' &&
              e.jsxs(e.Fragment, {
                children: [
                  e.jsx(F, {
                    variant: 'outline',
                    onClick: q,
                    className: 'w-full sm:w-auto',
                    children: t('common.back'),
                  }),
                  e.jsxs(F, {
                    onClick: E,
                    disabled: !U,
                    className: 'w-full sm:w-auto',
                    children: [
                      e.jsx(te, { className: 'h-4 w-4 me-2' }),
                      t('import.execute.button'),
                      ' (',
                      g?.validRows || 0,
                      ')',
                    ],
                  }),
                ],
              }),
            y === 'complete' &&
              e.jsx(F, { onClick: _, className: 'w-full sm:w-auto', children: t('common.close') }),
          ],
        }),
      ],
    }),
  })
}
const ne = [
  {
    value: 'dossier',
    label: 'Dossiers',
    labelAr: 'الملفات',
    icon: e.jsx(Ye, { className: 'h-4 w-4' }),
  },
  {
    value: 'person',
    label: 'Persons',
    labelAr: 'الأشخاص',
    icon: e.jsx(ze, { className: 'h-4 w-4' }),
  },
  {
    value: 'engagement',
    label: 'Engagements',
    labelAr: 'الارتباطات',
    icon: e.jsx(Be, { className: 'h-4 w-4' }),
  },
  {
    value: 'working-group',
    label: 'Working Groups',
    labelAr: 'مجموعات العمل',
    icon: e.jsx(Pe, { className: 'h-4 w-4' }),
  },
  {
    value: 'commitment',
    label: 'Commitments',
    labelAr: 'الالتزامات',
    icon: e.jsx($e, { className: 'h-4 w-4' }),
  },
  {
    value: 'deliverable',
    label: 'Deliverables',
    labelAr: 'المخرجات',
    icon: e.jsx(Ve, { className: 'h-4 w-4' }),
  },
]
function ns() {
  const { t: a, i18n: r } = B('export-import'),
    C = r.language === 'ar',
    [x, t] = o.useState('dossier'),
    [b, k] = o.useState(!1),
    [y, N] = o.useState(!1),
    R = ne.find((h) => h.value === x)
  return e.jsxs('div', {
    className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6',
    dir: C ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'mb-6',
        children: [
          e.jsx('h1', { className: 'text-2xl sm:text-3xl font-bold', children: a('title') }),
          e.jsxs('p', {
            className: 'text-muted-foreground mt-1',
            children: [a('export.description'), ' / ', a('import.description')],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'grid gap-6 md:grid-cols-2',
        children: [
          e.jsxs($, {
            children: [
              e.jsxs(V, {
                children: [
                  e.jsxs(W, {
                    className: 'flex items-center gap-2',
                    children: [e.jsx(ae, { className: 'h-5 w-5' }), a('export.title')],
                  }),
                  e.jsx(ue, { children: a('export.description') }),
                ],
              }),
              e.jsxs(J, {
                className: 'space-y-4',
                children: [
                  e.jsxs('div', {
                    className: 'space-y-2',
                    children: [
                      e.jsxs(D, { children: [a('entities.dossier').split(' ')[0], ' Type'] }),
                      e.jsxs(Q, {
                        value: x,
                        onValueChange: (h) => t(h),
                        children: [
                          e.jsx(Z, { children: e.jsx(ee, {}) }),
                          e.jsx(se, {
                            children: ne.map((h) =>
                              e.jsx(
                                M,
                                {
                                  value: h.value,
                                  children: e.jsxs('span', {
                                    className: 'flex items-center gap-2',
                                    children: [h.icon, C ? h.labelAr : h.label],
                                  }),
                                },
                                h.value,
                              ),
                            ),
                          }),
                        ],
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'rounded-lg border bg-muted/50 p-4',
                    children: [
                      e.jsxs('div', {
                        className: 'flex items-center gap-3 mb-3',
                        children: [
                          R?.icon,
                          e.jsxs('div', {
                            children: [
                              e.jsx('p', {
                                className: 'font-medium',
                                children: C ? R?.labelAr : R?.label,
                              }),
                              e.jsx('p', {
                                className: 'text-sm text-muted-foreground',
                                children: 'Export to Excel, CSV, or JSON',
                              }),
                            ],
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'flex flex-wrap gap-2',
                        children: [
                          e.jsxs(Y, {
                            variant: 'outline',
                            children: [e.jsx(H, { className: 'h-3 w-3 me-1' }), 'XLSX'],
                          }),
                          e.jsx(Y, { variant: 'outline', children: 'CSV' }),
                          e.jsx(Y, { variant: 'outline', children: 'JSON' }),
                        ],
                      }),
                    ],
                  }),
                  e.jsxs(F, {
                    onClick: () => k(!0),
                    className: 'w-full',
                    children: [e.jsx(ae, { className: 'h-4 w-4 me-2' }), a('export.button')],
                  }),
                ],
              }),
            ],
          }),
          e.jsxs($, {
            children: [
              e.jsxs(V, {
                children: [
                  e.jsxs(W, {
                    className: 'flex items-center gap-2',
                    children: [e.jsx(te, { className: 'h-5 w-5' }), a('import.title')],
                  }),
                  e.jsx(ue, { children: a('import.description') }),
                ],
              }),
              e.jsxs(J, {
                className: 'space-y-4',
                children: [
                  e.jsxs('div', {
                    className: 'space-y-2',
                    children: [
                      e.jsxs(D, { children: [a('entities.dossier').split(' ')[0], ' Type'] }),
                      e.jsxs(Q, {
                        value: x,
                        onValueChange: (h) => t(h),
                        children: [
                          e.jsx(Z, { children: e.jsx(ee, {}) }),
                          e.jsx(se, {
                            children: ne.map((h) =>
                              e.jsx(
                                M,
                                {
                                  value: h.value,
                                  children: e.jsxs('span', {
                                    className: 'flex items-center gap-2',
                                    children: [h.icon, C ? h.labelAr : h.label],
                                  }),
                                },
                                h.value,
                              ),
                            ),
                          }),
                        ],
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'rounded-lg border bg-muted/50 p-4',
                    children: [
                      e.jsxs('div', {
                        className: 'flex items-center gap-3 mb-3',
                        children: [
                          R?.icon,
                          e.jsxs('div', {
                            children: [
                              e.jsx('p', {
                                className: 'font-medium',
                                children: C ? R?.labelAr : R?.label,
                              }),
                              e.jsx('p', {
                                className: 'text-sm text-muted-foreground',
                                children: 'Import from Excel or CSV files',
                              }),
                            ],
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'space-y-1 text-sm text-muted-foreground',
                        children: [
                          e.jsx('p', { children: a('template.instructions.requiredFields') }),
                          e.jsx('p', { children: a('template.instructions.dateFormat') }),
                        ],
                      }),
                    ],
                  }),
                  e.jsxs(F, {
                    onClick: () => N(!0),
                    className: 'w-full',
                    children: [e.jsx(te, { className: 'h-4 w-4 me-2' }), a('import.button')],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      e.jsx(Fe, { className: 'my-8' }),
      e.jsxs('div', {
        className: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
        children: [
          e.jsxs($, {
            className: 'bg-muted/50',
            children: [
              e.jsx(V, {
                className: 'pb-2',
                children: e.jsx(W, {
                  className: 'text-sm font-medium',
                  children: a('import.validation.title'),
                }),
              }),
              e.jsx(J, {
                children: e.jsx('p', {
                  className: 'text-sm text-muted-foreground',
                  children:
                    'Row-by-row validation with detailed error messages and suggestions for fixing issues.',
                }),
              }),
            ],
          }),
          e.jsxs($, {
            className: 'bg-muted/50',
            children: [
              e.jsx(V, {
                className: 'pb-2',
                children: e.jsx(W, {
                  className: 'text-sm font-medium',
                  children: a('import.conflictResolution.title'),
                }),
              }),
              e.jsx(J, {
                children: e.jsx('p', {
                  className: 'text-sm text-muted-foreground',
                  children:
                    'Detect and resolve conflicts with existing records. Choose to skip, overwrite, or merge changes.',
                }),
              }),
            ],
          }),
          e.jsxs($, {
            className: 'bg-muted/50',
            children: [
              e.jsx(V, {
                className: 'pb-2',
                children: e.jsx(W, {
                  className: 'text-sm font-medium',
                  children: a('export.language.title'),
                }),
              }),
              e.jsx(J, {
                children: e.jsx('p', {
                  className: 'text-sm text-muted-foreground',
                  children:
                    'Export with English, Arabic, or bilingual column headers for maximum compatibility.',
                }),
              }),
            ],
          }),
        ],
      }),
      e.jsx(ss, { open: b, onOpenChange: k, entityType: x }),
      e.jsx(ls, { open: y, onOpenChange: N, entityType: x }),
    ],
  })
}
const vs = ns
export { vs as component }
//# sourceMappingURL=export-import-2T7vucBw.js.map
