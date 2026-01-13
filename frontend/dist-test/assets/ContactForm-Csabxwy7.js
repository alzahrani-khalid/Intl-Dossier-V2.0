import { u as z, o as q, j as e } from './react-vendor-Buoak6m3.js'
import {
  s as G,
  aA as U,
  aB as _,
  aC as g,
  aD as h,
  aE as j,
  I as N,
  aF as y,
  q as X,
  r as H,
  t as J,
  v as K,
  w as Q,
  B as w,
  m as E,
  n as W,
  aG as Y,
} from './index-qYY0KoZ1.js'
import { T as Z, a as ee, b as se, c as te } from './tooltip-CE0dVuox.js'
import { d as $, a as ae } from './tanstack-vendor-BZC-rs5U.js'
import { aP as C, aD as P, b9 as k, aS as re, bL as ne } from './vendor-misc-BiJvMP0A.js'
const F = 'https://zkrcjzdemdmwhearhfgg.supabase.co'
class u extends Error {
  constructor(s, c, i) {
    ;(super(s), (this.statusCode = c), (this.details = i), (this.name = 'OCRAPIError'))
  }
}
async function T() {
  const {
    data: { session: t },
  } = await G.auth.getSession()
  if (!t) throw new u('Not authenticated', 401)
  return { Authorization: `Bearer ${t.access_token}` }
}
async function S(t) {
  if (!t.ok) {
    let s = `Request failed with status ${t.status}`
    try {
      const c = await t.json()
      s = c.error || c.message || s
    } catch {}
    throw new u(s, t.status)
  }
  try {
    return await t.json()
  } catch (s) {
    throw new u('Failed to parse response', t.status, s)
  }
}
async function oe(t, s = !1) {
  if (
    !['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'].includes(
      t.type.toLowerCase(),
    )
  )
    throw new u('Invalid file type. Please upload JPEG, PNG, or HEIC image.', 400)
  const i = 10 * 1024 * 1024
  if (t.size > i) throw new u('File too large. Maximum size is 10MB.', 400)
  const l = await T(),
    d = new FormData()
  ;(d.append('image', t), d.append('consent_cloud_ocr', String(s)))
  const p = await fetch(`${F}/functions/v1/ocr-extract`, { method: 'POST', headers: l, body: d })
  return S(p)
}
function ce(t) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}
function ie(t) {
  const s = t.replace(/[\s\-()]/g, '')
  return /\d{7,}/.test(s)
}
function le(t) {
  const s = { ...t }
  return (
    s.full_name && (s.full_name = s.full_name.trim()),
    s.organization && (s.organization = s.organization.trim()),
    s.position && (s.position = s.position.trim()),
    s.email_addresses &&
      s.email_addresses.length > 0 &&
      (s.email_addresses = Array.from(
        new Set(s.email_addresses.map((c) => c.toLowerCase().trim()).filter(ce)),
      )),
    s.phone_numbers &&
      s.phone_numbers.length > 0 &&
      (s.phone_numbers = Array.from(new Set(s.phone_numbers.map((c) => c.trim()).filter(ie)))),
    s
  )
}
async function me(t) {
  const s = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    c = t.name.toLowerCase().split('.').pop(),
    i = ['pdf', 'docx', 'doc', 'txt', 'csv', 'xls', 'xlsx']
  if (!s.includes(t.type.toLowerCase()) && !i.includes(c || ''))
    throw new u('Invalid file type. Please upload PDF, DOCX, DOC, TXT, CSV, or Excel file.', 400)
  const l = 50 * 1024 * 1024
  if (t.size > l) throw new u('File too large. Maximum size is 50MB.', 400)
  const d = await T(),
    p = new FormData()
  p.append('file', t)
  const b = await fetch(`${F}/functions/v1/contacts-extract-document`, {
    method: 'POST',
    headers: { Authorization: d.Authorization },
    body: p,
  })
  return S(b)
}
async function de(t) {
  const s = await T(),
    c = await fetch(`${F}/functions/v1/contacts-extract-document/${t}`, {
      method: 'GET',
      headers: s,
    })
  return S(c)
}
function ye() {
  const { t } = z('contacts')
  return $({
    mutationFn: async ({ file: s, consentCloudOCR: c = !1 }) => {
      const i = await oe(s, c),
        l = le(i.parsed_fields)
      return { ...i, normalized_fields: l }
    },
    onSuccess: (s) => {
      const c = Object.keys(s.normalized_fields).filter((i) => {
        const l = s.normalized_fields[i]
        return l && (Array.isArray(l) ? l.length > 0 : !0)
      }).length
      C.success(
        t('contactDirectory.ocr.extraction_success', {
          confidence: Math.round(s.confidence),
          fieldsCount: c,
        }),
      )
    },
    onError: (s) => {
      C.error(t('contactDirectory.ocr.extraction_error', { error: s.message }))
    },
  })
}
function ue(t) {
  return t >= 85 ? 'high' : t >= 70 ? 'medium' : 'low'
}
function he(t) {
  switch (ue(t)) {
    case 'high':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'low':
      return 'bg-red-100 text-red-800 border-red-300'
  }
}
function we() {
  const { t } = z('contacts')
  return $({
    mutationFn: async ({ file: s }) => await me(s),
    onSuccess: () => {
      C.success(t('contactDirectory.documentExtraction.upload_success'))
    },
    onError: (s) => {
      C.error(t('contactDirectory.documentExtraction.upload_error', { error: s.message }))
    },
  })
}
function be(t, s) {
  return ae({
    queryKey: ['document-status', t],
    queryFn: async () => {
      if (!t) throw new u('Document source ID is required', 400)
      return await de(t)
    },
    enabled: s?.enabled !== !1 && !!t,
    refetchInterval: (c) => {
      const i = c.state.data
      return i
        ? i.processing_status === 'completed'
          ? (s?.onCompleted?.(i), !1)
          : i.processing_status === 'failed'
            ? (s?.onFailed?.(i.processing_error || 'Processing failed'), !1)
            : 2e3
        : !1
    },
    refetchIntervalInBackground: !0,
  })
}
function ve({
  defaultValues: t,
  organizations: s = [],
  tags: c = [],
  onSubmit: i,
  onCancel: l,
  isSubmitting: d = !1,
  mode: p = 'create',
  ocrConfidence: b,
  ocrRawText: pe,
}) {
  const { t: n, i18n: A } = z('contacts'),
    x = A.language === 'ar',
    D = (a) => {
      if (!b || b[a] === void 0) return null
      const r = b[a],
        m = he(r)
      return e.jsx(Z, {
        children: e.jsxs(ee, {
          children: [
            e.jsx(se, {
              asChild: !0,
              children: e.jsxs(E, {
                variant: 'outline',
                className: `${m} text-xs gap-1 ${x ? 'mr-2' : 'ml-2'}`,
                children: [e.jsx(ne, { className: 'h-3 w-3' }), Math.round(r), '%'],
              }),
            }),
            e.jsx(te, {
              children: e.jsx('p', {
                children: n('contactDirectory.ocr.confidence_tooltip', {
                  confidence: Math.round(r),
                }),
              }),
            }),
          ],
        }),
      })
    },
    o = q({
      defaultValues: {
        full_name: t?.name_en || '',
        organization_id: t?.metadata?.organization_id || '',
        position: t?.metadata?.title_en || '',
        email_addresses: t?.metadata?.email || [''],
        phone_numbers: t?.metadata?.phone || [''],
        notes: t?.metadata?.notes || '',
        tags: t?.tags || [],
        source_type: t?.metadata?.source_type || 'manual',
      },
    }),
    B = (a) => {
      const r = a.email_addresses.filter((v) => v.trim() !== ''),
        m = a.phone_numbers.filter((v) => v.trim() !== ''),
        f = s.find((v) => v.id === a.organization_id),
        O = {
          name_en: a.full_name,
          name_ar: a.full_name,
          metadata: {
            title_en: a.position,
            organization_id: a.organization_id || void 0,
            organization_name_en: f?.name_en,
            organization_name_ar: f?.name_ar,
            email: r.length > 0 ? r : void 0,
            phone: m.length > 0 ? m : void 0,
            notes: a.notes || void 0,
            source_type: a.source_type,
          },
          tags: a.tags,
        }
      i(O)
    },
    L = () => {
      const a = o.getValues('email_addresses')
      o.setValue('email_addresses', [...a, ''])
    },
    V = (a) => {
      const r = o.getValues('email_addresses')
      o.setValue(
        'email_addresses',
        r.filter((m, f) => f !== a),
      )
    },
    M = () => {
      const a = o.getValues('phone_numbers')
      o.setValue('phone_numbers', [...a, ''])
    },
    R = (a) => {
      const r = o.getValues('phone_numbers')
      o.setValue(
        'phone_numbers',
        r.filter((m, f) => f !== a),
      )
    },
    I = (a) => {
      const r = o.getValues('tags')
      r.includes(a)
        ? o.setValue(
            'tags',
            r.filter((m) => m !== a),
          )
        : o.setValue('tags', [...r, a])
    }
  return e.jsx(U, {
    ...o,
    children: e.jsxs('form', {
      onSubmit: o.handleSubmit(B),
      className: 'space-y-4 sm:space-y-6',
      dir: x ? 'rtl' : 'ltr',
      children: [
        e.jsx(_, {
          control: o.control,
          name: 'full_name',
          rules: {
            required: n('contactDirectory.form.full_name_required'),
            minLength: { value: 2, message: n('contactDirectory.form.full_name_min_length') },
            maxLength: { value: 200, message: n('contactDirectory.form.full_name_max_length') },
          },
          render: ({ field: a }) =>
            e.jsxs(g, {
              children: [
                e.jsxs('div', {
                  className: 'flex items-center',
                  children: [
                    e.jsx(h, {
                      className: 'text-sm sm:text-base',
                      children: n('contactDirectory.form.full_name'),
                    }),
                    D('full_name'),
                  ],
                }),
                e.jsx(j, {
                  children: e.jsx(N, {
                    ...a,
                    placeholder: n('contactDirectory.form.full_name_placeholder'),
                    className: 'h-11 px-4 text-base sm:h-10',
                    dir: x ? 'rtl' : 'ltr',
                  }),
                }),
                e.jsx(y, {}),
              ],
            }),
        }),
        e.jsx(_, {
          control: o.control,
          name: 'organization_id',
          render: ({ field: a }) =>
            e.jsxs(g, {
              children: [
                e.jsx(h, {
                  className: 'text-sm sm:text-base',
                  children: n('contactDirectory.form.organization'),
                }),
                e.jsxs(X, {
                  onValueChange: a.onChange,
                  defaultValue: a.value,
                  children: [
                    e.jsx(j, {
                      children: e.jsx(H, {
                        className: 'h-11 px-4 text-base sm:h-10',
                        children: e.jsx(J, {
                          placeholder: n('contactDirectory.form.select_organization'),
                        }),
                      }),
                    }),
                    e.jsx(K, {
                      children: s.map((r) => e.jsx(Q, { value: r.id, children: r.name }, r.id)),
                    }),
                  ],
                }),
                e.jsx(y, {}),
              ],
            }),
        }),
        e.jsx(_, {
          control: o.control,
          name: 'position',
          render: ({ field: a }) =>
            e.jsxs(g, {
              children: [
                e.jsxs('div', {
                  className: 'flex items-center',
                  children: [
                    e.jsx(h, {
                      className: 'text-sm sm:text-base',
                      children: n('contactDirectory.form.position'),
                    }),
                    D('position'),
                  ],
                }),
                e.jsx(j, {
                  children: e.jsx(N, {
                    ...a,
                    placeholder: n('contactDirectory.form.position_placeholder'),
                    className: 'h-11 px-4 text-base sm:h-10',
                    dir: x ? 'rtl' : 'ltr',
                  }),
                }),
                e.jsx(y, {}),
              ],
            }),
        }),
        e.jsxs('div', {
          className: 'space-y-2',
          children: [
            e.jsxs('div', {
              className: 'flex items-center',
              children: [
                e.jsx(h, {
                  className: 'text-sm sm:text-base',
                  children: n('contactDirectory.form.email_addresses'),
                }),
                D('email_addresses'),
              ],
            }),
            o
              .watch('email_addresses')
              .map((a, r) =>
                e.jsxs(
                  'div',
                  {
                    className: 'flex gap-2',
                    children: [
                      e.jsx(_, {
                        control: o.control,
                        name: `email_addresses.${r}`,
                        rules: {
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: n('contactDirectory.form.email_invalid'),
                          },
                        },
                        render: ({ field: m }) =>
                          e.jsxs(g, {
                            className: 'flex-1',
                            children: [
                              e.jsx(j, {
                                children: e.jsx(N, {
                                  ...m,
                                  type: 'email',
                                  placeholder: n('contactDirectory.form.email_placeholder'),
                                  className: 'h-11 px-4 text-base sm:h-10',
                                }),
                              }),
                              e.jsx(y, {}),
                            ],
                          }),
                      }),
                      o.watch('email_addresses').length > 1 &&
                        e.jsx(w, {
                          type: 'button',
                          variant: 'outline',
                          size: 'icon',
                          onClick: () => V(r),
                          className: ' sm:h-10 sm:w-10',
                          children: e.jsx(P, { className: 'h-4 w-4' }),
                        }),
                    ],
                  },
                  r,
                ),
              ),
            e.jsxs(w, {
              type: 'button',
              variant: 'outline',
              size: 'sm',
              onClick: L,
              className: 'h-9 gap-2',
              children: [e.jsx(k, { className: 'h-4 w-4' }), n('contactDirectory.form.add_email')],
            }),
          ],
        }),
        e.jsxs('div', {
          className: 'space-y-2',
          children: [
            e.jsxs('div', {
              className: 'flex items-center',
              children: [
                e.jsx(h, {
                  className: 'text-sm sm:text-base',
                  children: n('contactDirectory.form.phone_numbers'),
                }),
                D('phone_numbers'),
              ],
            }),
            o
              .watch('phone_numbers')
              .map((a, r) =>
                e.jsxs(
                  'div',
                  {
                    className: 'flex gap-2',
                    children: [
                      e.jsx(_, {
                        control: o.control,
                        name: `phone_numbers.${r}`,
                        render: ({ field: m }) =>
                          e.jsxs(g, {
                            className: 'flex-1',
                            children: [
                              e.jsx(j, {
                                children: e.jsx(N, {
                                  ...m,
                                  type: 'tel',
                                  placeholder: n('contactDirectory.form.phone_placeholder'),
                                  className: 'h-11 px-4 text-base sm:h-10',
                                }),
                              }),
                              e.jsx(y, {}),
                            ],
                          }),
                      }),
                      o.watch('phone_numbers').length > 1 &&
                        e.jsx(w, {
                          type: 'button',
                          variant: 'outline',
                          size: 'icon',
                          onClick: () => R(r),
                          className: ' sm:h-10 sm:w-10',
                          children: e.jsx(P, { className: 'h-4 w-4' }),
                        }),
                    ],
                  },
                  r,
                ),
              ),
            e.jsxs(w, {
              type: 'button',
              variant: 'outline',
              size: 'sm',
              onClick: M,
              className: 'h-9 gap-2',
              children: [e.jsx(k, { className: 'h-4 w-4' }), n('contactDirectory.form.add_phone')],
            }),
          ],
        }),
        c.length > 0 &&
          e.jsxs('div', {
            className: 'space-y-2',
            children: [
              e.jsx(h, {
                className: 'text-sm sm:text-base',
                children: n('contactDirectory.form.tags'),
              }),
              e.jsx('div', {
                className: 'flex flex-wrap gap-2',
                children: c.map((a) => {
                  const r = o.watch('tags').includes(a.id)
                  return e.jsx(
                    E,
                    {
                      variant: r ? 'default' : 'outline',
                      className: 'cursor-pointer px-3 py-1.5 text-sm',
                      onClick: () => I(a.id),
                      style:
                        r && a.color ? { backgroundColor: a.color, borderColor: a.color } : void 0,
                      children: a.name,
                    },
                    a.id,
                  )
                }),
              }),
            ],
          }),
        e.jsx(_, {
          control: o.control,
          name: 'notes',
          render: ({ field: a }) =>
            e.jsxs(g, {
              children: [
                e.jsx(h, {
                  className: 'text-sm sm:text-base',
                  children: n('contactDirectory.form.notes'),
                }),
                e.jsx(j, {
                  children: e.jsx(W, {
                    ...a,
                    placeholder: n('contactDirectory.form.notes_placeholder'),
                    className: 'min-h-[100px] px-4 py-3 text-base resize-y',
                    dir: x ? 'rtl' : 'ltr',
                  }),
                }),
                e.jsx(Y, { children: n('contactDirectory.form.notes_description') }),
                e.jsx(y, {}),
              ],
            }),
        }),
        e.jsxs('div', {
          className: 'flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end',
          children: [
            l &&
              e.jsx(w, {
                type: 'button',
                variant: 'outline',
                onClick: l,
                disabled: d,
                className: 'h-11 px-6 sm:h-10',
                children: n('contactDirectory.form.cancel'),
              }),
            e.jsxs(w, {
              type: 'submit',
              disabled: d,
              className: 'h-11 px-6 sm:h-10',
              children: [
                d && e.jsx(re, { className: `h-4 w-4 animate-spin ${x ? 'ml-2' : 'mr-2'}` }),
                n(
                  p === 'create'
                    ? 'contactDirectory.form.create_contact'
                    : 'contactDirectory.form.save_changes',
                ),
              ],
            }),
          ],
        }),
      ],
    }),
  })
}
export { ve as C, we as a, be as b, he as g, ye as u }
//# sourceMappingURL=ContactForm-Csabxwy7.js.map
