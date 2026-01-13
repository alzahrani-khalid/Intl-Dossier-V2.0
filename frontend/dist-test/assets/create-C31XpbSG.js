import { u as J, r, R as Se, j as e } from './react-vendor-Buoak6m3.js'
import { i as Ee } from './tanstack-vendor-BZC-rs5U.js'
import {
  j as R,
  l as U,
  B as u,
  k as H,
  o as V,
  V as G,
  C as se,
  J as M,
  ae as he,
  af as q,
  ag as K,
  m as O,
  I as X,
  Z as Re,
  _ as $e,
  $ as Q,
  aa as Y,
  A as le,
  E as ne,
  F as ie,
  G as oe,
  H as de,
  K as me,
} from './index-qYY0KoZ1.js'
import { u as Be, a as Pe, b as ze, g as pe, C as Te } from './ContactForm-Csabxwy7.js'
import {
  dl as xe,
  aD as je,
  cM as ae,
  aS as te,
  bw as W,
  bi as Fe,
  aI as fe,
  aH as ge,
  e4 as Le,
  aU as Ue,
  b6 as ee,
  aX as Ae,
  e5 as Ie,
  aA as ue,
} from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
import './tooltip-CE0dVuox.js'
function Me({ onExtracted: s, onCancel: m }) {
  const { t: l, i18n: $ } = J('contacts'),
    y = $.language === 'ar',
    [i, S] = r.useState(null),
    [x, g] = r.useState(null),
    [j, A] = r.useState(!1),
    [_, z] = r.useState(!1),
    [N, T] = r.useState(null),
    C = r.useRef(null),
    v = r.useRef(null),
    B = r.useRef(null),
    E = Be(),
    F = r.useCallback(
      (c) => {
        const a = c.target.files?.[0]
        if (!a) return
        if (
          !['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'].includes(
            a.type.toLowerCase(),
          )
        ) {
          alert(l('contactDirectory.ocr.invalid_file_type'))
          return
        }
        const b = 10 * 1024 * 1024
        if (a.size > b) {
          alert(l('contactDirectory.ocr.file_too_large'))
          return
        }
        S(a)
        const w = URL.createObjectURL(a)
        g(w)
      },
      [l],
    ),
    L = r.useCallback(async () => {
      try {
        const c = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: !1,
        })
        ;(T(c), z(!0), v.current && (v.current.srcObject = c))
      } catch (c) {
        ;(console.error('Camera error:', c), alert(l('contactDirectory.ocr.camera_error')))
      }
    }, [l]),
    P = r.useCallback(() => {
      ;(N && (N.getTracks().forEach((c) => c.stop()), T(null)), z(!1))
    }, [N]),
    t = r.useCallback(() => {
      if (!v.current || !B.current) return
      const c = v.current,
        a = B.current,
        f = a.getContext('2d')
      f &&
        ((a.width = c.videoWidth),
        (a.height = c.videoHeight),
        f.drawImage(c, 0, 0, a.width, a.height),
        a.toBlob(
          (b) => {
            if (!b) return
            const w = new File([b], `business-card-${Date.now()}.jpg`, { type: 'image/jpeg' })
            S(w)
            const I = URL.createObjectURL(b)
            ;(g(I), P())
          },
          'image/jpeg',
          0.95,
        ))
    }, [P]),
    n = r.useCallback(() => {
      ;(S(null), x && (URL.revokeObjectURL(x), g(null)), C.current && (C.current.value = ''))
    }, [x]),
    d = r.useCallback(async () => {
      if (!i) return
      const c = await E.mutateAsync({ file: i, consentCloudOCR: j })
      s(c.normalized_fields, c.confidence, c.text)
    }, [i, j, E, s])
  return (
    Se.useEffect(
      () => () => {
        ;(x && URL.revokeObjectURL(x), N && N.getTracks().forEach((c) => c.stop()))
      },
      [x, N],
    ),
    e.jsxs('div', {
      className: 'space-y-4 sm:space-y-6',
      dir: y ? 'rtl' : 'ltr',
      children: [
        _ &&
          e.jsx(R, {
            children: e.jsx(U, {
              className: 'p-4 sm:p-6',
              children: e.jsxs('div', {
                className: 'relative',
                children: [
                  e.jsx('video', {
                    ref: v,
                    autoPlay: !0,
                    playsInline: !0,
                    className: 'w-full rounded-lg',
                  }),
                  e.jsxs('div', {
                    className: 'flex gap-3 mt-4 justify-center',
                    children: [
                      e.jsxs(u, {
                        type: 'button',
                        onClick: t,
                        className: 'h-11 px-6 sm:h-10',
                        children: [
                          e.jsx(xe, { className: `h-4 w-4 ${y ? 'ml-2' : 'mr-2'}` }),
                          l('contactDirectory.ocr.capture_photo'),
                        ],
                      }),
                      e.jsx(u, {
                        type: 'button',
                        variant: 'outline',
                        onClick: P,
                        className: 'h-11 px-6 sm:h-10',
                        children: l('contactDirectory.ocr.cancel'),
                      }),
                    ],
                  }),
                ],
              }),
            }),
          }),
        !_ &&
          e.jsxs(R, {
            children: [
              e.jsxs(H, {
                children: [
                  e.jsx(V, {
                    className: 'text-start',
                    children: l('contactDirectory.ocr.scan_business_card'),
                  }),
                  e.jsx(G, {
                    className: 'text-start',
                    children: l('contactDirectory.ocr.scan_description'),
                  }),
                ],
              }),
              e.jsxs(U, {
                className: 'space-y-4',
                children: [
                  x &&
                    e.jsxs('div', {
                      className: 'relative',
                      children: [
                        e.jsx('img', {
                          src: x,
                          alt: 'Business card preview',
                          className: 'w-full rounded-lg border',
                        }),
                        e.jsx(u, {
                          type: 'button',
                          variant: 'destructive',
                          size: 'icon',
                          onClick: n,
                          className: 'absolute top-2 end-2 min-h-8 min-w-8',
                          children: e.jsx(je, { className: 'h-4 w-4' }),
                        }),
                      ],
                    }),
                  !x &&
                    e.jsxs('div', {
                      className: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
                      children: [
                        e.jsxs(u, {
                          type: 'button',
                          variant: 'outline',
                          onClick: L,
                          className: 'h-11 px-4 sm:h-10 sm:px-6',
                          children: [
                            e.jsx(xe, { className: `h-4 w-4 ${y ? 'ml-2' : 'mr-2'}` }),
                            l('contactDirectory.ocr.take_photo'),
                          ],
                        }),
                        e.jsxs(u, {
                          type: 'button',
                          variant: 'outline',
                          onClick: () => C.current?.click(),
                          className: 'h-11 px-4 sm:h-10 sm:px-6',
                          children: [
                            e.jsx(ae, { className: `h-4 w-4 ${y ? 'ml-2' : 'mr-2'}` }),
                            l('contactDirectory.ocr.upload_image'),
                          ],
                        }),
                      ],
                    }),
                  e.jsx('input', {
                    ref: C,
                    type: 'file',
                    accept: 'image/jpeg,image/jpg,image/png,image/heic,image/heif',
                    onChange: F,
                    className: 'hidden',
                  }),
                  i &&
                    e.jsxs('div', {
                      className: 'space-y-4 pt-4 border-t',
                      children: [
                        e.jsxs('div', {
                          className: 'flex items-start gap-3',
                          children: [
                            e.jsx(se, {
                              id: 'consent-cloud-ocr',
                              checked: j,
                              onCheckedChange: (c) => A(c === !0),
                              className: 'mt-1',
                            }),
                            e.jsxs('div', {
                              className: 'flex-1',
                              children: [
                                e.jsx(M, {
                                  htmlFor: 'consent-cloud-ocr',
                                  className: 'text-sm font-medium cursor-pointer text-start block',
                                  children: l('contactDirectory.ocr.consent_cloud_ocr_title'),
                                }),
                                e.jsx('p', {
                                  className: 'text-xs text-muted-foreground mt-1 text-start',
                                  children: l('contactDirectory.ocr.consent_cloud_ocr_description'),
                                }),
                              ],
                            }),
                          ],
                        }),
                        e.jsxs(u, {
                          type: 'button',
                          onClick: d,
                          disabled: E.isPending,
                          className: 'w-full h-11 sm:h-10',
                          children: [
                            E.isPending &&
                              e.jsx(te, {
                                className: `h-4 w-4 animate-spin ${y ? 'ml-2' : 'mr-2'}`,
                              }),
                            l('contactDirectory.ocr.process_card'),
                          ],
                        }),
                        E.isPending &&
                          e.jsxs('div', {
                            className: 'space-y-2',
                            children: [
                              e.jsx(he, { value: void 0, className: 'h-2' }),
                              e.jsx('p', {
                                className: 'text-xs text-center text-muted-foreground',
                                children: l('contactDirectory.ocr.processing'),
                              }),
                            ],
                          }),
                      ],
                    }),
                ],
              }),
            ],
          }),
        e.jsx('canvas', { ref: B, className: 'hidden' }),
        e.jsxs(q, {
          children: [
            e.jsx(W, { className: 'h-4 w-4' }),
            e.jsx(K, {
              className: 'text-start text-sm',
              children: l('contactDirectory.ocr.info_alert'),
            }),
          ],
        }),
        m &&
          e.jsx('div', {
            className: 'flex justify-end',
            children: e.jsx(u, {
              type: 'button',
              variant: 'ghost',
              onClick: m,
              disabled: E.isPending,
              className: 'h-11 px-6 sm:h-10',
              children: l('contactDirectory.ocr.back_to_manual'),
            }),
          }),
      ],
    })
  )
}
function Oe({ onExtracted: s, onCancel: m }) {
  const { t: l, i18n: $ } = J('contacts'),
    y = $.language === 'ar',
    [i, S] = r.useState(null),
    [x, g] = r.useState(null),
    [j, A] = r.useState([]),
    [_, z] = r.useState(!1),
    [N, T] = r.useState(null),
    C = r.useRef(null),
    v = Pe(),
    { data: B, isLoading: E } = ze(x, {
      enabled: !!x && !_ && !N,
      onCompleted: (a) => {
        ;(z(!0), a.extracted_contacts && a.extracted_contacts.length > 0 && A(a.extracted_contacts))
      },
      onFailed: (a) => {
        T(a)
      },
    }),
    F = r.useCallback(
      (a) => {
        const f = a.target.files?.[0]
        if (!f) return
        const b = ['pdf', 'docx', 'doc', 'txt', 'csv', 'xls', 'xlsx'],
          w = f.name.toLowerCase().split('.').pop()
        if (!w || !b.includes(w)) {
          alert(l('contactDirectory.documentExtraction.invalid_file_type'))
          return
        }
        const I = 50 * 1024 * 1024
        if (f.size > I) {
          alert(l('contactDirectory.documentExtraction.file_too_large'))
          return
        }
        S(f)
      },
      [l],
    ),
    L = r.useCallback(() => {
      ;(S(null), g(null), A([]), z(!1), T(null), C.current && (C.current.value = ''))
    }, []),
    P = r.useCallback(async () => {
      if (i)
        try {
          const a = await v.mutateAsync({ file: i })
          g(a.document_source_id)
        } catch (a) {
          console.error('Upload error:', a)
        }
    }, [i, v]),
    t = r.useCallback(() => {
      const a = j.map((f) => ({
        full_name: f.full_name,
        organization_id: void 0,
        position: f.position || void 0,
        email_addresses: f.email_addresses || [],
        phone_numbers: f.phone_numbers || [],
        source_type: 'document',
        ocr_confidence: f.confidence,
        source_document_id: x || void 0,
      }))
      s(a)
    }, [j, x, s]),
    n = (a) => (
      a.toLowerCase().split('.').pop(),
      e.jsx(ge, { className: 'h-8 w-8 text-muted-foreground' })
    ),
    d = (a) =>
      a < 1024
        ? `${a} B`
        : a < 1024 * 1024
          ? `${(a / 1024).toFixed(1)} KB`
          : `${(a / (1024 * 1024)).toFixed(1)} MB`,
    c = !!x && !_ && !N
  return e.jsxs('div', {
    className: 'space-y-4 sm:space-y-6',
    dir: y ? 'rtl' : 'ltr',
    children: [
      !x &&
        e.jsxs(R, {
          children: [
            e.jsxs(H, {
              children: [
                e.jsx(V, {
                  className: 'text-start',
                  children: l('contactDirectory.documentExtraction.title'),
                }),
                e.jsx(G, {
                  className: 'text-start',
                  children: l('contactDirectory.documentExtraction.description'),
                }),
              ],
            }),
            e.jsxs(U, {
              className: 'space-y-4',
              children: [
                i &&
                  e.jsxs('div', {
                    className: 'border rounded-lg p-4 flex items-start gap-4',
                    children: [
                      e.jsx('div', { className: 'flex-shrink-0', children: n(i.name) }),
                      e.jsxs('div', {
                        className: 'flex-1 min-w-0',
                        children: [
                          e.jsx('p', {
                            className: 'text-sm font-medium truncate text-start',
                            children: i.name,
                          }),
                          e.jsx('p', {
                            className: 'text-xs text-muted-foreground text-start',
                            children: d(i.size),
                          }),
                        ],
                      }),
                      e.jsx(u, {
                        type: 'button',
                        variant: 'ghost',
                        size: 'icon',
                        onClick: L,
                        className: 'flex-shrink-0 min-h-8 min-w-8',
                        children: e.jsx(je, { className: 'h-4 w-4' }),
                      }),
                    ],
                  }),
                !i &&
                  e.jsxs('div', {
                    className:
                      'border-2 border-dashed rounded-lg p-8 sm:p-12 text-center cursor-pointer hover:border-primary transition-colors',
                    onClick: () => C.current?.click(),
                    children: [
                      e.jsx(ae, { className: 'h-12 w-12 mx-auto mb-4 text-muted-foreground' }),
                      e.jsx('p', {
                        className: 'text-sm font-medium mb-2',
                        children: l('contactDirectory.documentExtraction.click_to_upload'),
                      }),
                      e.jsx('p', {
                        className: 'text-xs text-muted-foreground',
                        children: l('contactDirectory.documentExtraction.supported_formats'),
                      }),
                    ],
                  }),
                e.jsx('input', {
                  ref: C,
                  type: 'file',
                  accept: '.pdf,.docx,.doc,.txt,.csv,.xls,.xlsx',
                  onChange: F,
                  className: 'hidden',
                }),
                i &&
                  e.jsxs(u, {
                    type: 'button',
                    onClick: P,
                    disabled: v.isPending,
                    className: 'w-full h-11 sm:h-10',
                    children: [
                      v.isPending &&
                        e.jsx(te, { className: `h-4 w-4 animate-spin ${y ? 'ml-2' : 'mr-2'}` }),
                      l('contactDirectory.documentExtraction.extract_contacts'),
                    ],
                  }),
              ],
            }),
          ],
        }),
      c &&
        e.jsx(R, {
          children: e.jsxs(U, {
            className: 'p-6 space-y-4',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-3',
                children: [
                  e.jsx(te, { className: 'h-5 w-5 animate-spin text-primary' }),
                  e.jsxs('div', {
                    className: 'flex-1',
                    children: [
                      e.jsx('p', {
                        className: 'text-sm font-medium text-start',
                        children: l('contactDirectory.documentExtraction.processing'),
                      }),
                      B &&
                        e.jsx('p', {
                          className: 'text-xs text-muted-foreground text-start',
                          children: l(
                            `contactDirectory.documentExtraction.status_${B.processing_status}`,
                          ),
                        }),
                    ],
                  }),
                ],
              }),
              e.jsx(he, { value: void 0, className: 'h-2' }),
              e.jsx('p', {
                className: 'text-xs text-center text-muted-foreground',
                children: l('contactDirectory.documentExtraction.processing_time_estimate'),
              }),
            ],
          }),
        }),
      N &&
        e.jsxs(q, {
          variant: 'destructive',
          children: [
            e.jsx(W, { className: 'h-4 w-4' }),
            e.jsx(K, {
              className: 'text-start',
              children: l('contactDirectory.documentExtraction.processing_error', { error: N }),
            }),
          ],
        }),
      _ &&
        j.length > 0 &&
        e.jsxs(R, {
          children: [
            e.jsxs(H, {
              children: [
                e.jsxs('div', {
                  className: 'flex items-center justify-between',
                  children: [
                    e.jsxs(V, {
                      className: 'text-start flex items-center gap-2',
                      children: [
                        e.jsx(Fe, { className: 'h-5 w-5 text-green-600' }),
                        l('contactDirectory.documentExtraction.extraction_complete'),
                      ],
                    }),
                    e.jsxs(O, {
                      variant: 'secondary',
                      className: 'text-sm',
                      children: [
                        e.jsx(fe, { className: `h-3 w-3 ${y ? 'ml-1' : 'mr-1'}` }),
                        j.length,
                        ' ',
                        l('contactDirectory.documentExtraction.contacts_found'),
                      ],
                    }),
                  ],
                }),
                e.jsx(G, {
                  className: 'text-start',
                  children: l('contactDirectory.documentExtraction.review_and_edit'),
                }),
              ],
            }),
            e.jsxs(U, {
              className: 'space-y-3',
              children: [
                e.jsx('div', {
                  className: 'space-y-2 max-h-[400px] overflow-y-auto',
                  children: j.map((a, f) =>
                    e.jsx(
                      'div',
                      {
                        className: 'border rounded-lg p-3 sm:p-4 hover:bg-accent transition-colors',
                        children: e.jsx('div', {
                          className: 'flex items-start justify-between gap-3',
                          children: e.jsxs('div', {
                            className: 'flex-1 min-w-0',
                            children: [
                              e.jsxs('div', {
                                className: 'flex items-center gap-2 mb-1',
                                children: [
                                  e.jsx('p', {
                                    className: 'text-sm font-medium truncate text-start',
                                    children: a.full_name,
                                  }),
                                  e.jsxs(O, {
                                    className: `text-xs ${pe(a.confidence)}`,
                                    children: [a.confidence, '%'],
                                  }),
                                ],
                              }),
                              a.organization &&
                                e.jsx('p', {
                                  className: 'text-xs text-muted-foreground text-start truncate',
                                  children: a.organization,
                                }),
                              a.position &&
                                e.jsx('p', {
                                  className: 'text-xs text-muted-foreground text-start truncate',
                                  children: a.position,
                                }),
                              e.jsxs('div', {
                                className: 'flex flex-wrap gap-1 mt-2',
                                children: [
                                  a.email_addresses?.map((b, w) =>
                                    e.jsx(
                                      O,
                                      { variant: 'outline', className: 'text-xs', children: b },
                                      w,
                                    ),
                                  ),
                                  a.phone_numbers?.map((b, w) =>
                                    e.jsx(
                                      O,
                                      { variant: 'outline', className: 'text-xs', children: b },
                                      w,
                                    ),
                                  ),
                                ],
                              }),
                            ],
                          }),
                        }),
                      },
                      f,
                    ),
                  ),
                }),
                e.jsxs('div', {
                  className: 'flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t',
                  children: [
                    e.jsx(u, {
                      type: 'button',
                      variant: 'outline',
                      onClick: L,
                      className: 'h-11 sm:h-10',
                      children: l('contactDirectory.documentExtraction.start_over'),
                    }),
                    e.jsx(u, {
                      type: 'button',
                      onClick: t,
                      className: 'h-11 sm:h-10 flex-1',
                      children: l('contactDirectory.documentExtraction.review_and_import'),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      _ &&
        j.length === 0 &&
        e.jsxs(q, {
          children: [
            e.jsx(W, { className: 'h-4 w-4' }),
            e.jsx(K, {
              className: 'text-start',
              children: l('contactDirectory.documentExtraction.no_contacts_found'),
            }),
          ],
        }),
      !x &&
        e.jsxs(q, {
          children: [
            e.jsx(W, { className: 'h-4 w-4' }),
            e.jsx(K, {
              className: 'text-start text-sm',
              children: l('contactDirectory.documentExtraction.info_alert'),
            }),
          ],
        }),
      m &&
        !c &&
        e.jsx('div', {
          className: 'flex justify-end',
          children: e.jsx(u, {
            type: 'button',
            variant: 'ghost',
            onClick: m,
            className: 'h-11 px-6 sm:h-10',
            children: l('contactDirectory.documentExtraction.back_to_manual'),
          }),
        }),
    ],
  })
}
function He({ contacts: s, onContactsChange: m, onImport: l, onCancel: $, isImporting: y = !1 }) {
  const { t: i, i18n: S } = J('contacts'),
    x = S.language === 'ar',
    g = r.useMemo(() => s.filter((t) => t.selected), [s]),
    j = s.length > 0 && g.length === s.length,
    A = g.length > 0 && g.length < s.length,
    _ = r.useCallback(() => {
      const t = !j
      m(s.map((n) => ({ ...n, selected: t })))
    }, [j, s, m]),
    z = r.useCallback(
      (t) => {
        m(s.map((n) => (n.id === t ? { ...n, selected: !n.selected } : n)))
      },
      [s, m],
    ),
    N = r.useCallback(
      (t, n, d) => {
        m(s.map((c) => (c.id === t ? { ...c, [n]: d } : c)))
      },
      [s, m],
    ),
    T = r.useCallback(
      (t) => {
        m(
          s.map((n) => {
            if (n.id === t) {
              const d = n.email_addresses || []
              return { ...n, email_addresses: [...d, ''] }
            }
            return n
          }),
        )
      },
      [s, m],
    ),
    C = r.useCallback(
      (t, n, d) => {
        m(
          s.map((c) => {
            if (c.id === t) {
              const a = [...(c.email_addresses || [])]
              return ((a[n] = d), { ...c, email_addresses: a })
            }
            return c
          }),
        )
      },
      [s, m],
    ),
    v = r.useCallback(
      (t, n) => {
        m(
          s.map((d) => {
            if (d.id === t) {
              const c = [...(d.email_addresses || [])]
              return (c.splice(n, 1), { ...d, email_addresses: c })
            }
            return d
          }),
        )
      },
      [s, m],
    ),
    B = r.useCallback(
      (t) => {
        m(
          s.map((n) => {
            if (n.id === t) {
              const d = n.phone_numbers || []
              return { ...n, phone_numbers: [...d, ''] }
            }
            return n
          }),
        )
      },
      [s, m],
    ),
    E = r.useCallback(
      (t, n, d) => {
        m(
          s.map((c) => {
            if (c.id === t) {
              const a = [...(c.phone_numbers || [])]
              return ((a[n] = d), { ...c, phone_numbers: a })
            }
            return c
          }),
        )
      },
      [s, m],
    ),
    F = r.useCallback(
      (t, n) => {
        m(
          s.map((d) => {
            if (d.id === t) {
              const c = [...(d.phone_numbers || [])]
              return (c.splice(n, 1), { ...d, phone_numbers: c })
            }
            return d
          }),
        )
      },
      [s, m],
    ),
    L = r.useCallback(
      (t) => {
        m(s.filter((n) => n.id !== t))
      },
      [s, m],
    ),
    P = r.useCallback(() => {
      if (g.length === 0) {
        alert(i('contactDirectory.documentExtraction.no_contacts_selected'))
        return
      }
      l(g)
    }, [g, l, i])
  return e.jsx('div', {
    className: 'space-y-4 sm:space-y-6',
    dir: x ? 'rtl' : 'ltr',
    children: e.jsxs(R, {
      children: [
        e.jsxs(H, {
          children: [
            e.jsxs('div', {
              className: 'flex items-center justify-between gap-4',
              children: [
                e.jsx(V, {
                  className: 'text-start',
                  children: i('contactDirectory.documentExtraction.review_contacts'),
                }),
                e.jsxs(O, {
                  variant: 'secondary',
                  className: 'text-sm',
                  children: [
                    e.jsx(fe, { className: `h-3 w-3 ${x ? 'ml-1' : 'mr-1'}` }),
                    g.length,
                    ' / ',
                    s.length,
                  ],
                }),
              ],
            }),
            e.jsx(G, {
              className: 'text-start',
              children: i('contactDirectory.documentExtraction.review_description'),
            }),
          ],
        }),
        e.jsxs(U, {
          className: 'space-y-4',
          children: [
            e.jsxs('div', {
              className: 'flex items-center justify-between gap-4 pb-4 border-b',
              children: [
                e.jsxs('div', {
                  className: 'flex items-center gap-2',
                  children: [
                    e.jsx(se, {
                      id: 'select-all',
                      checked: j,
                      onCheckedChange: _,
                      className: 'data-[state=indeterminate]:bg-primary',
                      ...(A ? { 'data-state': 'indeterminate' } : {}),
                    }),
                    e.jsx(M, {
                      htmlFor: 'select-all',
                      className: 'text-sm font-medium cursor-pointer',
                      children: i(
                        j
                          ? 'contactDirectory.documentExtraction.deselect_all'
                          : 'contactDirectory.documentExtraction.select_all',
                      ),
                    }),
                  ],
                }),
                e.jsxs(u, {
                  variant: 'ghost',
                  size: 'sm',
                  onClick: _,
                  className: 'text-xs',
                  children: [
                    j
                      ? e.jsx(Le, { className: `h-3 w-3 ${x ? 'ml-1' : 'mr-1'}` })
                      : e.jsx(Ue, { className: `h-3 w-3 ${x ? 'ml-1' : 'mr-1'}` }),
                    i(
                      j
                        ? 'contactDirectory.documentExtraction.deselect_all'
                        : 'contactDirectory.documentExtraction.select_all',
                    ),
                  ],
                }),
              ],
            }),
            e.jsx('div', {
              className: 'space-y-4 max-h-[600px] overflow-y-auto',
              children: s.map((t) =>
                e.jsx(
                  R,
                  {
                    className: `border-2 transition-colors ${t.selected ? 'border-primary bg-primary/5' : 'border-border'}`,
                    children: e.jsx(U, {
                      className: 'p-4 space-y-3',
                      children: e.jsxs('div', {
                        className: 'flex items-start gap-3',
                        children: [
                          e.jsx(se, {
                            checked: t.selected,
                            onCheckedChange: () => z(t.id),
                            className: 'mt-1',
                          }),
                          e.jsxs('div', {
                            className: 'flex-1 space-y-3',
                            children: [
                              e.jsxs('div', {
                                children: [
                                  e.jsxs('div', {
                                    className: 'flex items-center gap-2 mb-1',
                                    children: [
                                      e.jsx(M, {
                                        className: 'text-xs text-muted-foreground text-start',
                                        children: i('contactDirectory.form.full_name'),
                                      }),
                                      t.ocr_confidence &&
                                        e.jsxs(O, {
                                          className: `text-xs ${pe(t.ocr_confidence)}`,
                                          children: [t.ocr_confidence, '%'],
                                        }),
                                    ],
                                  }),
                                  e.jsx(X, {
                                    value: t.full_name || '',
                                    onChange: (n) => N(t.id, 'full_name', n.target.value),
                                    placeholder: i('contactDirectory.form.full_name_placeholder'),
                                    className: 'h-9',
                                  }),
                                ],
                              }),
                              e.jsxs('div', {
                                children: [
                                  e.jsx(M, {
                                    className:
                                      'text-xs text-muted-foreground mb-1 block text-start',
                                    children: i('contactDirectory.form.position'),
                                  }),
                                  e.jsx(X, {
                                    value: t.position || '',
                                    onChange: (n) => N(t.id, 'position', n.target.value),
                                    placeholder: i('contactDirectory.form.position_placeholder'),
                                    className: 'h-9',
                                  }),
                                ],
                              }),
                              e.jsxs('div', {
                                children: [
                                  e.jsx(M, {
                                    className:
                                      'text-xs text-muted-foreground mb-1 block text-start',
                                    children: i('contactDirectory.form.email_addresses'),
                                  }),
                                  e.jsxs('div', {
                                    className: 'space-y-2',
                                    children: [
                                      t.email_addresses?.map((n, d) =>
                                        e.jsxs(
                                          'div',
                                          {
                                            className: 'flex gap-2',
                                            children: [
                                              e.jsx(X, {
                                                type: 'email',
                                                value: n,
                                                onChange: (c) => C(t.id, d, c.target.value),
                                                placeholder: i(
                                                  'contactDirectory.form.email_placeholder',
                                                ),
                                                className: 'h-9',
                                              }),
                                              t.email_addresses &&
                                                t.email_addresses.length > 1 &&
                                                e.jsx(u, {
                                                  type: 'button',
                                                  variant: 'ghost',
                                                  size: 'icon',
                                                  onClick: () => v(t.id, d),
                                                  className: 'flex-shrink-0 min-h-9 min-w-9',
                                                  children: e.jsx(ee, { className: 'h-3 w-3' }),
                                                }),
                                            ],
                                          },
                                          d,
                                        ),
                                      ),
                                      e.jsx(u, {
                                        type: 'button',
                                        variant: 'outline',
                                        size: 'sm',
                                        onClick: () => T(t.id),
                                        className: 'w-full h-8 text-xs',
                                        children: i('contactDirectory.form.add_email'),
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              e.jsxs('div', {
                                children: [
                                  e.jsx(M, {
                                    className:
                                      'text-xs text-muted-foreground mb-1 block text-start',
                                    children: i('contactDirectory.form.phone_numbers'),
                                  }),
                                  e.jsxs('div', {
                                    className: 'space-y-2',
                                    children: [
                                      t.phone_numbers?.map((n, d) =>
                                        e.jsxs(
                                          'div',
                                          {
                                            className: 'flex gap-2',
                                            children: [
                                              e.jsx(X, {
                                                type: 'tel',
                                                value: n,
                                                onChange: (c) => E(t.id, d, c.target.value),
                                                placeholder: i(
                                                  'contactDirectory.form.phone_placeholder',
                                                ),
                                                className: 'h-9',
                                              }),
                                              t.phone_numbers &&
                                                t.phone_numbers.length > 1 &&
                                                e.jsx(u, {
                                                  type: 'button',
                                                  variant: 'ghost',
                                                  size: 'icon',
                                                  onClick: () => F(t.id, d),
                                                  className: 'flex-shrink-0 min-h-9 min-w-9',
                                                  children: e.jsx(ee, { className: 'h-3 w-3' }),
                                                }),
                                            ],
                                          },
                                          d,
                                        ),
                                      ),
                                      e.jsx(u, {
                                        type: 'button',
                                        variant: 'outline',
                                        size: 'sm',
                                        onClick: () => B(t.id),
                                        className: 'w-full h-8 text-xs',
                                        children: i('contactDirectory.form.add_phone'),
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                          e.jsx(u, {
                            type: 'button',
                            variant: 'ghost',
                            size: 'icon',
                            onClick: () => L(t.id),
                            className: 'flex-shrink-0 min-h-9 min-w-9',
                            children: e.jsx(ee, { className: 'h-4 w-4 text-destructive' }),
                          }),
                        ],
                      }),
                    }),
                  },
                  t.id,
                ),
              ),
            }),
            s.length === 0 &&
              e.jsxs(q, {
                children: [
                  e.jsx(W, { className: 'h-4 w-4' }),
                  e.jsx(K, {
                    className: 'text-start',
                    children: i('contactDirectory.documentExtraction.no_contacts_to_review'),
                  }),
                ],
              }),
            e.jsxs('div', {
              className: 'flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t',
              children: [
                e.jsx(u, {
                  type: 'button',
                  variant: 'outline',
                  onClick: $,
                  disabled: y,
                  className: 'h-11 sm:h-10',
                  children: i('contactDirectory.form.cancel'),
                }),
                e.jsx(u, {
                  type: 'button',
                  onClick: P,
                  disabled: g.length === 0 || y,
                  className: 'h-11 sm:h-10 flex-1',
                  children: y
                    ? e.jsxs(e.Fragment, {
                        children: [
                          e.jsx('div', {
                            className: `animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full ${x ? 'ml-2' : 'mr-2'}`,
                          }),
                          i('contactDirectory.documentExtraction.importing'),
                        ],
                      })
                    : e.jsxs(e.Fragment, {
                        children: [
                          i('contactDirectory.documentExtraction.import_selected'),
                          ' (',
                          g.length,
                          ')',
                        ],
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
function Ve() {
  const { t: s, i18n: m } = J('contacts'),
    l = m.language === 'ar',
    $ = Ee(),
    [y, i] = r.useState('manual'),
    [S, x] = r.useState(null),
    [g, j] = r.useState([]),
    [A, _] = r.useState(!1),
    [z, N] = r.useState(null),
    [T, C] = r.useState(),
    [v, B] = r.useState(),
    [E, F] = r.useState([]),
    [L, P] = r.useState(!1),
    [t, n] = r.useState(new Map()),
    [d, c] = r.useState(!1),
    [a, f] = r.useState([]),
    b = useCreateContact(),
    w = useCheckDuplicates(),
    I = useBatchCreateContacts(),
    ce = () => {
      $({ to: '/contacts' })
    },
    Ne = (o, h, D) => {
      const p = {
          full_name: o.full_name || '',
          position: o.position || '',
          email_addresses: o.email_addresses || [],
          phone_numbers: o.phone_numbers || [],
          source_type: 'business_card',
          ocr_confidence: h,
        },
        k = {
          full_name: o.full_name ? h : void 0,
          position: o.position ? h : void 0,
          email_addresses: o.email_addresses && o.email_addresses.length > 0 ? h : void 0,
          phone_numbers: o.phone_numbers && o.phone_numbers.length > 0 ? h : void 0,
        }
      ;(N(p), C(k), B(D), i('manual'))
    },
    ye = async (o) => {
      try {
        const h = await w.mutateAsync({
          full_name: o.full_name,
          email_addresses: o.email_addresses || [],
          phone_numbers: o.phone_numbers || [],
        })
        h && h.length > 0 ? (x(o), j(h), _(!0)) : Z(o)
      } catch (h) {
        ;(console.error('Duplicate check failed:', h), Z(o))
      }
    },
    Z = (o) => {
      b.mutate(o, {
        onSuccess: (h) => {
          $({ to: '/contacts/$contactId', params: { contactId: h.id } })
        },
      })
    },
    _e = () => {
      S && (Z(S), _(!1), x(null), j([]))
    },
    ve = () => {
      ;(_(!1), x(null), j([]))
    },
    be = (o) => {
      const h = o.map((D, p) => ({ ...D, id: `temp-${Date.now()}-${p}`, selected: !0 }))
      ;(F(h), P(!0))
    },
    we = async (o) => {
      const h = new Map()
      let D = !1
      for (const p of o)
        if (!(!p.full_name || !p.full_name.trim()))
          try {
            const k = await w.mutateAsync({
              full_name: p.full_name,
              email_addresses: p.email_addresses || [],
              phone_numbers: p.phone_numbers || [],
            })
            k && k.length > 0 && (h.set(p.id, k), (D = !0))
          } catch (k) {
            console.error('Duplicate check failed for contact:', p.full_name, k)
          }
      D ? (n(h), f(o), c(!0)) : await re(o)
    },
    re = async (o) => {
      const h = o.map(({ id: D, selected: p, ...k }) => k)
      try {
        const D = await I.mutateAsync(h)
        $({ to: '/contacts' })
      } catch (D) {
        console.error('Batch import error:', D)
      }
    },
    De = async () => {
      ;(c(!1), await re(a), n(new Map()), f([]))
    },
    Ce = () => {
      ;(c(!1), n(new Map()), f([]))
    },
    ke = () => {
      ;(P(!1), F([]))
    }
  return e.jsxs(e.Fragment, {
    children: [
      e.jsx('div', {
        className: 'min-h-screen',
        dir: l ? 'rtl' : 'ltr',
        children: e.jsxs('div', {
          className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6',
          children: [
            e.jsxs('div', {
              className: 'mb-6',
              children: [
                e.jsxs(u, {
                  variant: 'ghost',
                  onClick: ce,
                  className: 'mb-4',
                  children: [
                    e.jsx(Ae, { className: `h-4 w-4 ${l ? 'ml-2' : 'mr-2'}` }),
                    s('contactDirectory.buttons.back'),
                  ],
                }),
                e.jsx('h1', {
                  className: 'text-2xl sm:text-3xl font-bold text-start',
                  children: s('contactDirectory.buttons.createContact'),
                }),
              ],
            }),
            !L &&
              e.jsxs(Re, {
                value: y,
                onValueChange: (o) => i(o),
                children: [
                  e.jsxs($e, {
                    className: 'grid w-full grid-cols-1 sm:grid-cols-3 mb-4',
                    children: [
                      e.jsxs(Q, {
                        value: 'manual',
                        className: 'gap-2',
                        children: [
                          e.jsx(ge, { className: 'h-4 w-4' }),
                          s('contactDirectory.tabs.manual_entry'),
                        ],
                      }),
                      e.jsxs(Q, {
                        value: 'scan',
                        className: 'gap-2',
                        children: [
                          e.jsx(Ie, { className: 'h-4 w-4' }),
                          s('contactDirectory.tabs.scan_card'),
                        ],
                      }),
                      e.jsxs(Q, {
                        value: 'document',
                        className: 'gap-2',
                        children: [
                          e.jsx(ae, { className: 'h-4 w-4' }),
                          s('contactDirectory.documentExtraction.batch_import_tab'),
                        ],
                      }),
                    ],
                  }),
                  e.jsx(Y, {
                    value: 'manual',
                    children: e.jsxs(R, {
                      children: [
                        e.jsx(H, {
                          children: e.jsx(V, { children: s('contactDirectory.subtitle') }),
                        }),
                        e.jsx(U, {
                          children: e.jsx(Te, {
                            defaultValues: z || void 0,
                            ocrConfidence: T,
                            ocrRawText: v,
                            onSubmit: ye,
                            onCancel: ce,
                            isSubmitting: b.isPending || w.isPending,
                            mode: 'create',
                          }),
                        }),
                      ],
                    }),
                  }),
                  e.jsx(Y, {
                    value: 'scan',
                    children: e.jsx(Me, { onExtracted: Ne, onCancel: () => i('manual') }),
                  }),
                  e.jsx(Y, {
                    value: 'document',
                    children: e.jsx(Oe, { onExtracted: be, onCancel: () => i('manual') }),
                  }),
                ],
              }),
            L &&
              e.jsx(He, {
                contacts: E,
                onContactsChange: F,
                onImport: we,
                onCancel: ke,
                isImporting: I.isPending,
              }),
          ],
        }),
      }),
      e.jsx(le, {
        open: A,
        onOpenChange: _,
        children: e.jsxs(ne, {
          className: 'max-w-2xl',
          dir: l ? 'rtl' : 'ltr',
          children: [
            e.jsxs(ie, {
              children: [
                e.jsxs(oe, {
                  className: 'flex items-center gap-2 text-start',
                  children: [
                    e.jsx(ue, { className: 'h-5 w-5 text-yellow-600' }),
                    s('contactDirectory.duplicates.dialog_title'),
                  ],
                }),
                e.jsx(de, {
                  className: 'text-start',
                  children: s('contactDirectory.duplicates.dialog_description'),
                }),
              ],
            }),
            e.jsx('div', {
              className: 'space-y-3 max-h-[400px] overflow-y-auto',
              children: g.map((o) =>
                e.jsx(
                  R,
                  {
                    className: 'p-4',
                    children: e.jsxs('div', {
                      className: 'space-y-2',
                      children: [
                        e.jsxs('div', {
                          className: 'flex items-start justify-between gap-4',
                          children: [
                            e.jsxs('div', {
                              className: 'flex-1',
                              children: [
                                e.jsx('h4', {
                                  className: 'font-medium text-start',
                                  children: o.full_name,
                                }),
                                o.organization_name &&
                                  e.jsx('p', {
                                    className: 'text-sm text-muted-foreground text-start',
                                    children: o.organization_name,
                                  }),
                              ],
                            }),
                            e.jsxs('div', {
                              className: 'text-sm font-medium text-yellow-600',
                              children: [
                                o.match_score,
                                '% ',
                                s('contactDirectory.duplicates.match'),
                              ],
                            }),
                          ],
                        }),
                        e.jsx('div', {
                          className: 'flex flex-wrap gap-2',
                          children: o.match_reasons.map((h) =>
                            e.jsx(
                              'span',
                              {
                                className:
                                  'px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800',
                                children: s(`contactDirectory.duplicates.reasons.${h}`),
                              },
                              h,
                            ),
                          ),
                        }),
                        e.jsx(u, {
                          variant: 'outline',
                          size: 'sm',
                          onClick: () =>
                            $({ to: '/contacts/$contactId', params: { contactId: o.contact_id } }),
                          className: 'mt-2',
                          children: s('contactDirectory.duplicates.view_contact'),
                        }),
                      ],
                    }),
                  },
                  o.contact_id,
                ),
              ),
            }),
            e.jsxs(me, {
              className: 'flex flex-col-reverse gap-2 sm:flex-row',
              children: [
                e.jsx(u, {
                  variant: 'outline',
                  onClick: ve,
                  className: 'h-11 sm:h-10',
                  children: s('contactDirectory.duplicates.cancel'),
                }),
                e.jsx(u, {
                  onClick: _e,
                  className: 'h-11 sm:h-10',
                  children: s('contactDirectory.duplicates.proceed_anyway'),
                }),
              ],
            }),
          ],
        }),
      }),
      e.jsx(le, {
        open: d,
        onOpenChange: c,
        children: e.jsxs(ne, {
          className: 'max-w-4xl max-h-[80vh] overflow-y-auto',
          dir: l ? 'rtl' : 'ltr',
          children: [
            e.jsxs(ie, {
              children: [
                e.jsxs(oe, {
                  className: 'flex items-center gap-2 text-start',
                  children: [
                    e.jsx(ue, { className: 'h-5 w-5 text-yellow-600' }),
                    s('contactDirectory.duplicates.dialog_title'),
                    ' (',
                    t.size,
                    ' ',
                    s('contactDirectory.documentExtraction.contacts_found'),
                    ')',
                  ],
                }),
                e.jsx(de, {
                  className: 'text-start',
                  children: s('contactDirectory.duplicates.dialog_description'),
                }),
              ],
            }),
            e.jsx('div', {
              className: 'space-y-4',
              children: Array.from(t.entries()).map(([o, h]) => {
                const D = a.find((p) => p.id === o)
                return D
                  ? e.jsxs(
                      R,
                      {
                        className: 'border-yellow-200',
                        children: [
                          e.jsxs(H, {
                            className: 'pb-3',
                            children: [
                              e.jsx(V, {
                                className: 'text-base text-start',
                                children: D.full_name,
                              }),
                              D.organization_id &&
                                e.jsx('p', {
                                  className: 'text-sm text-muted-foreground text-start',
                                }),
                            ],
                          }),
                          e.jsx(U, {
                            className: 'space-y-2',
                            children: h.map((p) =>
                              e.jsx(
                                R,
                                {
                                  className: 'p-3 bg-yellow-50',
                                  children: e.jsxs('div', {
                                    className: 'space-y-2',
                                    children: [
                                      e.jsxs('div', {
                                        className: 'flex items-start justify-between gap-4',
                                        children: [
                                          e.jsxs('div', {
                                            className: 'flex-1',
                                            children: [
                                              e.jsx('h4', {
                                                className: 'font-medium text-sm text-start',
                                                children: p.full_name,
                                              }),
                                              p.organization_name &&
                                                e.jsx('p', {
                                                  className:
                                                    'text-xs text-muted-foreground text-start',
                                                  children: p.organization_name,
                                                }),
                                            ],
                                          }),
                                          e.jsxs('div', {
                                            className: 'text-sm font-medium text-yellow-600',
                                            children: [
                                              p.match_score,
                                              '% ',
                                              s('contactDirectory.duplicates.match'),
                                            ],
                                          }),
                                        ],
                                      }),
                                      e.jsx('div', {
                                        className: 'flex flex-wrap gap-1',
                                        children: p.match_reasons.map((k) =>
                                          e.jsx(
                                            'span',
                                            {
                                              className:
                                                'px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800',
                                              children: s(
                                                `contactDirectory.duplicates.reasons.${k}`,
                                              ),
                                            },
                                            k,
                                          ),
                                        ),
                                      }),
                                      e.jsx(u, {
                                        variant: 'outline',
                                        size: 'sm',
                                        onClick: () => {
                                          window.open(`/contacts/${p.contact_id}`, '_blank')
                                        },
                                        className: 'mt-2',
                                        children: s('contactDirectory.duplicates.view_contact'),
                                      }),
                                    ],
                                  }),
                                },
                                p.contact_id,
                              ),
                            ),
                          }),
                        ],
                      },
                      o,
                    )
                  : null
              }),
            }),
            e.jsxs(me, {
              className: 'flex flex-col-reverse gap-2 sm:flex-row',
              children: [
                e.jsx(u, {
                  variant: 'outline',
                  onClick: Ce,
                  className: 'h-11 sm:h-10',
                  children: s('contactDirectory.duplicates.cancel'),
                }),
                e.jsx(u, {
                  onClick: De,
                  disabled: I.isPending,
                  className: 'h-11 sm:h-10',
                  children: I.isPending
                    ? e.jsxs(e.Fragment, {
                        children: [
                          e.jsx('div', {
                            className: `animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full ${l ? 'ml-2' : 'mr-2'}`,
                          }),
                          s('contactDirectory.documentExtraction.importing'),
                        ],
                      })
                    : s('contactDirectory.duplicates.proceed_anyway'),
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  })
}
const as = Ve
export { as as component }
//# sourceMappingURL=create-C31XpbSG.js.map
