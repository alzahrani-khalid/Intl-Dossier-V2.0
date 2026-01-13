import { u as R, r as m, j as e } from './react-vendor-Buoak6m3.js'
import {
  s as S,
  j as x,
  B as h,
  q as ne,
  r as re,
  t as oe,
  v as le,
  w as U,
  n as ke,
  m as y,
  c as N,
  l as k,
  k as $,
  o as D,
  J as q,
  A as Se,
  E as Ce,
  F as Ae,
  G as Te,
  H as ze,
  K as Le,
  a2 as Q,
  ae as Ee,
  aY as Pe,
  a0 as ce,
  Z as $e,
  _ as De,
  $ as J,
  aa as W,
} from './index-qYY0KoZ1.js'
import { u as Fe } from './usePosition-ChrBL0hW.js'
import { c as K, d as M, a as Re } from './tanstack-vendor-BZC-rs5U.js'
import {
  dE as Ie,
  b9 as Be,
  aD as He,
  dT as de,
  dU as ue,
  dV as me,
  dW as xe,
  aS as he,
  bw as F,
  bq as Ue,
  dX as pe,
  aB as qe,
  be as V,
  bk as Ve,
  bd as Qe,
  bS as ve,
  aA as X,
  aO as Ke,
  aN as Me,
  bV as Oe,
  cF as ge,
  bW as Je,
  aH as Y,
  aI as We,
  bh as Xe,
} from './vendor-misc-BiJvMP0A.js'
import { A as fe } from './ApprovalChain-D9q84Iai.js'
import { A as Ye } from './AttachmentUploader-DnTiValP.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
import './tooltip-CE0dVuox.js'
import './useIntakeApi-84Q7PHHY.js'
const Ze = 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1',
  Ge = async () => {
    const {
      data: { session: s },
    } = await S.auth.getSession()
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${s?.access_token}` }
  },
  es = () => {
    const s = K()
    return M({
      mutationFn: async ({ id: a, data: t }) => {
        const r = await Ge(),
          i = await fetch(`${Ze}/positions-update?id=${a}`, {
            method: 'PUT',
            headers: r,
            body: JSON.stringify(t),
          })
        if (!i.ok) {
          const p = await i.json().catch(() => ({ message: i.statusText }))
          throw i.status === 409
            ? new Error(
                'Version conflict: The position has been modified by another user. Please refresh and try again.',
              )
            : new Error(p.message || `Failed to update position: ${i.status}`)
        }
        return i.json()
      },
      onMutate: async ({ id: a, data: t }) => {
        await s.cancelQueries({ queryKey: ['positions', 'detail', a] })
        const r = s.getQueryData(['positions', 'detail', a])
        return (
          r &&
            s.setQueryData(['positions', 'detail', a], {
              ...r,
              ...t,
              updated_at: new Date().toISOString(),
            }),
          { previousPosition: r }
        )
      },
      onError: (a, { id: t }, r) => {
        r?.previousPosition && s.setQueryData(['positions', 'detail', t], r.previousPosition)
      },
      onSuccess: (a, { id: t }) => {
        ;(s.setQueryData(['positions', 'detail', t], a),
          s.invalidateQueries({ queryKey: ['positions', 'list'] }))
      },
    })
  },
  ss = 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1',
  ts = async () => {
    const {
      data: { session: s },
    } = await S.auth.getSession()
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${s?.access_token}` }
  },
  as = () => {
    const s = K()
    return M({
      mutationFn: async (a) => {
        const t = await ts(),
          r = await fetch(`${ss}/positions-submit?id=${a}`, { method: 'PUT', headers: t })
        if (!r.ok) {
          const i = await r.json().catch(() => ({ message: r.statusText }))
          throw new Error(i.message || `Failed to submit position: ${r.status}`)
        }
        return r.json()
      },
      onSuccess: (a, t) => {
        ;(s.setQueryData(['positions', 'detail', t], a.position),
          s.invalidateQueries({ queryKey: ['positions', 'list'] }))
      },
    })
  }
function is(s, a) {
  const {
    data: t,
    isLoading: r,
    error: i,
    refetch: p,
  } = Re({
    queryKey: ['position-dossier-links', s, a],
    queryFn: async () => {
      const o = new URLSearchParams({ positionId: s }),
        {
          data: { session: f },
        } = await S.auth.getSession()
      if (!f) throw new Error('Not authenticated')
      const d = await fetch(
        `${S.supabaseUrl}/functions/v1/positions-dossiers-get?${o.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${f.access_token}`,
            'Content-Type': 'application/json',
          },
        },
      )
      if (!d.ok) {
        const j = await d.json()
        throw new Error(j.error || 'Failed to fetch position-dossier links')
      }
      return await d.json()
    },
    staleTime: 3e5,
    enabled: !!s,
  })
  return {
    links: t?.links || [],
    totalCount: t?.total_count || 0,
    isLoading: r,
    error: i,
    refetch: p,
  }
}
function ns(s) {
  const a = K()
  return M({
    mutationFn: async (t) => {
      const {
        data: { session: r },
      } = await S.auth.getSession()
      if (!r) throw new Error('Not authenticated')
      const i = await fetch(
        `${S.supabaseUrl}/functions/v1/positions-dossiers-create?positionId=${s}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${r.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(t),
        },
      )
      if (!i.ok) {
        const p = await i.json()
        throw new Error(p.error || 'Failed to create position-dossier link')
      }
      return await i.json()
    },
    onSuccess: () => {
      a.invalidateQueries({ queryKey: ['position-dossier-links', s] })
    },
  })
}
function rs() {
  const s = K()
  return M({
    mutationFn: async (a) => {
      const {
        data: { session: t },
      } = await S.auth.getSession()
      if (!t) throw new Error('Not authenticated')
      const r = new URLSearchParams({ positionId: a.positionId, dossierId: a.dossierId }),
        i = await fetch(`${S.supabaseUrl}/functions/v1/positions-dossiers-delete?${r.toString()}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${t.access_token}`,
            'Content-Type': 'application/json',
          },
        })
      if (!i.ok) {
        const p = await i.json()
        throw new Error(p.error || 'Failed to delete position-dossier link')
      }
      return await i.json()
    },
    onSuccess: (a, t) => {
      s.invalidateQueries({ queryKey: ['position-dossier-links', t.positionId] })
    },
  })
}
function os({ positionId: s }) {
  const { t: a, i18n: t } = R(['positions', 'translation']),
    r = t.language === 'ar',
    [i, p] = m.useState(!1),
    [o, f] = m.useState(''),
    [d, g] = m.useState('related'),
    [j, w] = m.useState(''),
    { links: _, isLoading: E, error: C } = is(s),
    v = ns(s),
    A = rs(),
    b = async () => {
      if (o)
        try {
          ;(await v.mutateAsync({ dossier_id: o, link_type: d, notes: j || void 0 }),
            f(''),
            g('related'),
            w(''),
            p(!1))
        } catch (l) {
          console.error('Failed to create link:', l)
        }
    },
    n = async (l) => {
      try {
        await A.mutateAsync({ positionId: s, dossierId: l })
      } catch (T) {
        console.error('Failed to delete link:', T)
      }
    }
  return E
    ? e.jsx(x, {
        className: 'p-8 text-center',
        children: e.jsx('p', { className: 'text-muted-foreground', children: a('common.loading') }),
      })
    : C
      ? e.jsx(x, {
          className: 'p-8 text-center',
          children: e.jsx('p', {
            className: 'text-destructive',
            children: a('errors.failed_to_load'),
          }),
        })
      : e.jsxs('div', {
          className: 'flex flex-col gap-4',
          dir: r ? 'rtl' : 'ltr',
          children: [
            e.jsxs('div', {
              className:
                'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2',
              children: [
                e.jsxs('h3', {
                  className: 'text-lg sm:text-xl font-semibold flex items-center gap-2',
                  children: [
                    e.jsx(Ie, { className: 'h-5 w-5' }),
                    a('position_dossier_links.title'),
                  ],
                }),
                !i &&
                  e.jsxs(h, {
                    size: 'sm',
                    onClick: () => p(!0),
                    className: 'w-full sm:w-auto',
                    children: [
                      e.jsx(Be, { className: `h-4 w-4 ${r ? 'ms-2' : 'me-2'}` }),
                      a('position_dossier_links.add_link'),
                    ],
                  }),
              ],
            }),
            i &&
              e.jsx(x, {
                className: 'p-4',
                children: e.jsxs('div', {
                  className: 'flex flex-col gap-4',
                  children: [
                    e.jsxs('div', {
                      className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
                      children: [
                        e.jsxs('div', {
                          className: 'flex flex-col gap-2',
                          children: [
                            e.jsx('label', {
                              className: 'text-sm font-medium',
                              children: a('position_dossier_links.select_dossier'),
                            }),
                            e.jsxs(ne, {
                              value: o,
                              onValueChange: f,
                              children: [
                                e.jsx(re, {
                                  children: e.jsx(oe, {
                                    placeholder: a('position_dossier_links.select_placeholder'),
                                  }),
                                }),
                                e.jsx(le, {
                                  children: e.jsx(U, {
                                    value: 'placeholder',
                                    children: a('position_dossier_links.no_dossiers'),
                                  }),
                                }),
                              ],
                            }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'flex flex-col gap-2',
                          children: [
                            e.jsx('label', {
                              className: 'text-sm font-medium',
                              children: a('position_dossier_links.link_type'),
                            }),
                            e.jsxs(ne, {
                              value: d,
                              onValueChange: (l) => g(l),
                              children: [
                                e.jsx(re, { children: e.jsx(oe, {}) }),
                                e.jsxs(le, {
                                  children: [
                                    e.jsx(U, {
                                      value: 'primary',
                                      children: a('position_dossier_links.types.primary'),
                                    }),
                                    e.jsx(U, {
                                      value: 'related',
                                      children: a('position_dossier_links.types.related'),
                                    }),
                                    e.jsx(U, {
                                      value: 'reference',
                                      children: a('position_dossier_links.types.reference'),
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
                      className: 'flex flex-col gap-2',
                      children: [
                        e.jsx('label', {
                          className: 'text-sm font-medium',
                          children: a('position_dossier_links.notes_optional'),
                        }),
                        e.jsx(ke, {
                          value: j,
                          onChange: (l) => w(l.target.value),
                          placeholder: a('position_dossier_links.notes_placeholder'),
                          rows: 2,
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'flex flex-col-reverse sm:flex-row gap-2 justify-end',
                      children: [
                        e.jsx(h, {
                          variant: 'outline',
                          onClick: () => {
                            ;(p(!1), f(''), w(''))
                          },
                          className: 'w-full sm:w-auto',
                          children: a('common.cancel'),
                        }),
                        e.jsx(h, {
                          onClick: b,
                          disabled: !o || v.isPending,
                          className: 'w-full sm:w-auto',
                          children: v.isPending
                            ? a('common.saving')
                            : a('position_dossier_links.add_link'),
                        }),
                      ],
                    }),
                  ],
                }),
              }),
            _.length === 0
              ? e.jsx(x, {
                  className: 'p-8 text-center',
                  children: e.jsx('p', {
                    className: 'text-muted-foreground',
                    children: a('position_dossier_links.no_links'),
                  }),
                })
              : e.jsx('div', {
                  className: 'grid grid-cols-1 gap-2',
                  children: _.map((l) =>
                    e.jsx(
                      x,
                      {
                        className: 'p-4',
                        children: e.jsxs('div', {
                          className: 'flex flex-col sm:flex-row justify-between items-start gap-4',
                          children: [
                            e.jsxs('div', {
                              className: 'flex-1 min-w-0',
                              children: [
                                e.jsxs('div', {
                                  className: 'flex items-center gap-2 flex-wrap',
                                  children: [
                                    e.jsx('h4', {
                                      className: 'font-medium text-sm sm:text-base truncate',
                                      children: r ? l.dossier?.name_ar : l.dossier?.name_en,
                                    }),
                                    e.jsx(y, {
                                      variant: 'outline',
                                      className: 'shrink-0',
                                      children: a(`position_dossier_links.types.${l.link_type}`),
                                    }),
                                  ],
                                }),
                                l.notes &&
                                  e.jsx('p', {
                                    className:
                                      'text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2',
                                    children: l.notes,
                                  }),
                              ],
                            }),
                            e.jsx(h, {
                              variant: 'ghost',
                              size: 'sm',
                              onClick: () => n(l.dossier_id),
                              disabled: A.isPending,
                              className: 'shrink-0',
                              children: e.jsx(He, { className: 'h-4 w-4' }),
                            }),
                          ],
                        }),
                      },
                      l.dossier_id,
                    ),
                  ),
                }),
          ],
        })
}
function je({ editor: s, disabled: a = !1 }) {
  const { t } = R('positions')
  return s
    ? e.jsxs('div', {
        className: 'flex flex-wrap gap-1 border-b border-gray-200 p-2',
        role: 'toolbar',
        'aria-label': t('editor.toolbar'),
        children: [
          e.jsx(h, {
            type: 'button',
            variant: 'ghost',
            size: 'sm',
            onClick: () => s.chain().focus().toggleBold().run(),
            disabled: a || !s.can().chain().focus().toggleBold().run(),
            className: N(s.isActive('bold') && 'bg-gray-100'),
            'aria-label': t('editor.bold'),
            'aria-pressed': s.isActive('bold'),
            children: e.jsx('strong', { children: 'B' }),
          }),
          e.jsx(h, {
            type: 'button',
            variant: 'ghost',
            size: 'sm',
            onClick: () => s.chain().focus().toggleItalic().run(),
            disabled: a || !s.can().chain().focus().toggleItalic().run(),
            className: N(s.isActive('italic') && 'bg-gray-100'),
            'aria-label': t('editor.italic'),
            'aria-pressed': s.isActive('italic'),
            children: e.jsx('em', { children: 'I' }),
          }),
          e.jsx(Q, { orientation: 'vertical', className: 'h-6' }),
          e.jsx(h, {
            type: 'button',
            variant: 'ghost',
            size: 'sm',
            onClick: () => s.chain().focus().toggleHeading({ level: 2 }).run(),
            disabled: a,
            className: N(s.isActive('heading', { level: 2 }) && 'bg-gray-100'),
            'aria-label': t('editor.heading2'),
            'aria-pressed': s.isActive('heading', { level: 2 }),
            children: 'H2',
          }),
          e.jsx(h, {
            type: 'button',
            variant: 'ghost',
            size: 'sm',
            onClick: () => s.chain().focus().toggleHeading({ level: 3 }).run(),
            disabled: a,
            className: N(s.isActive('heading', { level: 3 }) && 'bg-gray-100'),
            'aria-label': t('editor.heading3'),
            'aria-pressed': s.isActive('heading', { level: 3 }),
            children: 'H3',
          }),
          e.jsx(Q, { orientation: 'vertical', className: 'h-6' }),
          e.jsx(h, {
            type: 'button',
            variant: 'ghost',
            size: 'sm',
            onClick: () => s.chain().focus().toggleBulletList().run(),
            disabled: a,
            className: N(s.isActive('bulletList') && 'bg-gray-100'),
            'aria-label': t('editor.bulletList'),
            'aria-pressed': s.isActive('bulletList'),
            children: '•',
          }),
          e.jsx(h, {
            type: 'button',
            variant: 'ghost',
            size: 'sm',
            onClick: () => s.chain().focus().toggleOrderedList().run(),
            disabled: a,
            className: N(s.isActive('orderedList') && 'bg-gray-100'),
            'aria-label': t('editor.orderedList'),
            'aria-pressed': s.isActive('orderedList'),
            children: '1.',
          }),
          e.jsx(Q, { orientation: 'vertical', className: 'h-6' }),
          e.jsx(h, {
            type: 'button',
            variant: 'ghost',
            size: 'sm',
            onClick: () => s.chain().focus().toggleBlockquote().run(),
            disabled: a,
            className: N(s.isActive('blockquote') && 'bg-gray-100'),
            'aria-label': t('editor.quote'),
            'aria-pressed': s.isActive('blockquote'),
            children: '"',
          }),
        ],
      })
    : null
}
function ls({
  initialData: s,
  onSave: a,
  onConflict: t,
  readOnly: r = !1,
  autoSaveInterval: i = 3e4,
  className: p,
}) {
  const { t: o, i18n: f } = R('positions')
  f.language
  const [d, g] = m.useState({
      title_en: s?.title_en || '',
      title_ar: s?.title_ar || '',
      content_en: s?.content_en || '',
      content_ar: s?.content_ar || '',
      rationale_en: s?.rationale_en || '',
      rationale_ar: s?.rationale_ar || '',
      alignment_notes_en: s?.alignment_notes_en || '',
      alignment_notes_ar: s?.alignment_notes_ar || '',
      version: s?.version || 1,
      ...(s?.id && { id: s.id }),
    }),
    [j, w] = m.useState(!1),
    [_, E] = m.useState(!1),
    [C, v] = m.useState(!1),
    [A, b] = m.useState(null),
    [n, l] = m.useState(null),
    [T, z] = m.useState(!1),
    [I, Z] = m.useState(null),
    G = m.useRef(null),
    ee = m.useRef(null),
    O = m.useRef({ en: !1, ar: !1 }),
    P = m.useRef(null),
    se = de({
      extensions: [
        ue.configure({ link: !1 }),
        me.configure({ placeholder: o('editor.placeholderEn') }),
        xe.configure({ openOnClick: !1, HTMLAttributes: { class: 'text-blue-600 underline' } }),
      ],
      content: d.content_en,
      editable: !r,
      onUpdate: ({ editor: c }) => {
        const u = c.getHTML()
        ;(g((L) => ({ ...L, content_en: u })), v(!0), B())
      },
    }),
    te = de({
      extensions: [
        ue.configure({ link: !1 }),
        me.configure({ placeholder: o('editor.placeholderAr') }),
        xe.configure({ openOnClick: !1, HTMLAttributes: { class: 'text-blue-600 underline' } }),
      ],
      content: d.content_ar,
      editable: !r,
      onUpdate: ({ editor: c }) => {
        const u = c.getHTML()
        ;(g((L) => ({ ...L, content_ar: u })), v(!0), B())
      },
    }),
    B = m.useCallback(() => {
      ;(P.current && clearTimeout(P.current),
        (P.current = setTimeout(() => {
          be()
        }, i)))
    }, [i]),
    be = async () => {
      if (!(!C || r || j)) {
        E(!0)
        try {
          ;(await a(d), v(!1), b(new Date()), l(null))
        } catch (c) {
          if (
            c.status === 409 ||
            c.message?.includes('version') ||
            c.message?.includes('conflict')
          ) {
            const u = c.serverVersion || d.version + 1
            ;(Z({ current: d.version, server: u }), z(!0), t && t(d.version, u))
          } else l(c.message || o('editor.autoSaveError'))
        } finally {
          E(!1)
        }
      }
    },
    ae = async () => {
      if (!j) {
        ;(w(!0), l(null))
        try {
          ;(await a(d), v(!1), b(new Date()), g((c) => ({ ...c, version: c.version + 1 })))
        } catch (c) {
          if (
            c.status === 409 ||
            c.message?.includes('version') ||
            c.message?.includes('conflict')
          ) {
            const u = c.serverVersion || d.version + 1
            ;(Z({ current: d.version, server: u }), z(!0), t && t(d.version, u))
          } else l(c.message || o('editor.saveError'))
        } finally {
          w(!1)
        }
      }
    }
  ;(m.useEffect(() => {
    const c = (u) => {
      ;(u.ctrlKey || u.metaKey) && u.key === 's' && (u.preventDefault(), ae())
    }
    return (window.addEventListener('keydown', c), () => window.removeEventListener('keydown', c))
  }, [d, j]),
    m.useEffect(
      () => () => {
        P.current && clearTimeout(P.current)
      },
      [],
    ))
  const ie = (c) => (u) => {
      const L = u.currentTarget,
        ye = L.scrollTop / (L.scrollHeight - L.clientHeight)
      if (O.current[c]) return
      O.current[c] = !0
      const H = c === 'en' ? ee : G,
        we = c === 'en' ? 'ar' : 'en'
      if (H.current) {
        const _e = ye * (H.current.scrollHeight - H.current.clientHeight)
        H.current.scrollTop = _e
      }
      setTimeout(() => {
        O.current[we] = !1
      }, 100)
    },
    Ne = () => {
      ;(z(!1), window.location.reload())
    }
  return e.jsxs('div', {
    className: N('space-y-4', p),
    children: [
      e.jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          e.jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              _ &&
                e.jsxs(y, {
                  variant: 'outline',
                  className: 'gap-1',
                  children: [
                    e.jsx(he, { className: 'size-3 animate-spin' }),
                    o('editor.autoSaving'),
                  ],
                }),
              !_ &&
                A &&
                e.jsx(y, {
                  variant: 'outline',
                  children: o('editor.lastSaved', { time: A.toLocaleTimeString() }),
                }),
              C &&
                !_ &&
                e.jsxs(y, {
                  variant: 'outline',
                  className: 'gap-1',
                  children: [e.jsx(F, { className: 'size-3' }), o('editor.unsavedChanges')],
                }),
            ],
          }),
          e.jsxs(h, {
            onClick: ae,
            disabled: j || !C || r,
            className: 'gap-2',
            'aria-label': o('editor.save'),
            children: [
              j
                ? e.jsx(he, { className: 'size-4 animate-spin' })
                : e.jsx(Ue, { className: 'size-4' }),
              o('editor.save'),
            ],
          }),
        ],
      }),
      n &&
        e.jsx(x, {
          className: 'border-red-200 bg-red-50',
          children: e.jsx(k, {
            className: 'pt-4',
            children: e.jsxs('div', {
              className: 'flex items-center gap-2 text-red-800',
              children: [e.jsx(F, { className: 'size-4' }), e.jsx('span', { children: n })],
            }),
          }),
        }),
      e.jsxs('div', {
        className: 'grid grid-cols-1 gap-4 md:grid-cols-2',
        children: [
          e.jsxs(x, {
            children: [
              e.jsx($, {
                children: e.jsx(D, {
                  className: 'text-sm font-medium',
                  children: o('editor.englishContent'),
                }),
              }),
              e.jsxs(k, {
                className: 'space-y-2',
                children: [
                  e.jsxs('div', {
                    children: [
                      e.jsx(q, { htmlFor: 'title_en', children: o('editor.title') }),
                      e.jsx('input', {
                        id: 'title_en',
                        type: 'text',
                        value: d.title_en,
                        onChange: (c) => {
                          ;(g((u) => ({ ...u, title_en: c.target.value })), v(!0), B())
                        },
                        readOnly: r,
                        className: N(
                          'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                          r && 'bg-gray-100 cursor-not-allowed',
                        ),
                        'aria-label': o('editor.titleEnglish'),
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    children: [
                      e.jsx(q, { children: o('editor.content') }),
                      e.jsxs('div', {
                        className: 'overflow-hidden rounded-md border border-gray-300',
                        dir: 'ltr',
                        children: [
                          e.jsx(je, { editor: se, disabled: r }),
                          e.jsx('div', {
                            ref: G,
                            onScroll: ie('en'),
                            className: 'h-96 overflow-y-auto',
                            children: e.jsx(pe, {
                              editor: se,
                              className: 'prose prose-sm max-w-none p-4 focus:outline-none',
                              'aria-label': o('editor.contentEnglish'),
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
          e.jsxs(x, {
            children: [
              e.jsx($, {
                children: e.jsx(D, {
                  className: 'text-sm font-medium',
                  children: o('editor.arabicContent'),
                }),
              }),
              e.jsxs(k, {
                className: 'space-y-2',
                children: [
                  e.jsxs('div', {
                    children: [
                      e.jsx(q, { htmlFor: 'title_ar', children: o('editor.title') }),
                      e.jsx('input', {
                        id: 'title_ar',
                        type: 'text',
                        value: d.title_ar,
                        onChange: (c) => {
                          ;(g((u) => ({ ...u, title_ar: c.target.value })), v(!0), B())
                        },
                        readOnly: r,
                        className: N(
                          'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                          r && 'bg-gray-100 cursor-not-allowed',
                        ),
                        dir: 'rtl',
                        'aria-label': o('editor.titleArabic'),
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    children: [
                      e.jsx(q, { children: o('editor.content') }),
                      e.jsxs('div', {
                        className: 'overflow-hidden rounded-md border border-gray-300',
                        dir: 'rtl',
                        children: [
                          e.jsx(je, { editor: te, disabled: r }),
                          e.jsx('div', {
                            ref: ee,
                            onScroll: ie('ar'),
                            className: 'h-96 overflow-y-auto',
                            children: e.jsx(pe, {
                              editor: te,
                              className: 'prose prose-sm max-w-none p-4 focus:outline-none',
                              'aria-label': o('editor.contentArabic'),
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
      s?.id &&
        e.jsxs(x, {
          className: 'mt-6',
          children: [
            e.jsx($, {
              children: e.jsx(D, {
                className: 'text-sm font-medium',
                children: o('editor.linkedDossiers'),
              }),
            }),
            e.jsx(k, { children: e.jsx(os, { positionId: s.id }) }),
          ],
        }),
      e.jsx(Se, {
        open: T,
        onOpenChange: z,
        children: e.jsxs(Ce, {
          children: [
            e.jsxs(Ae, {
              children: [
                e.jsxs(Te, {
                  className: 'flex items-center gap-2',
                  children: [
                    e.jsx(F, { className: 'size-5 text-red-600' }),
                    o('editor.conflictTitle'),
                  ],
                }),
                e.jsx(ze, {
                  children: o('editor.conflictDescription', {
                    current: I?.current,
                    server: I?.server,
                  }),
                }),
              ],
            }),
            e.jsxs(Le, {
              children: [
                e.jsx(h, {
                  variant: 'outline',
                  onClick: () => z(!1),
                  children: o('common.cancel'),
                }),
                e.jsxs(h, {
                  onClick: Ne,
                  className: 'gap-2',
                  children: [e.jsx(qe, { className: 'size-4' }), o('editor.reloadPage')],
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  })
}
function cs({
  consistencyCheck: s,
  onResolveConflict: a,
  onViewConflictingPosition: t,
  loading: r = !1,
}) {
  const { t: i, i18n: p } = R('positions')
  p.language
  const [o, f] = m.useState(new Set()),
    d = (n) => {
      const l = new Set(o)
      ;(l.has(n) ? l.delete(n) : l.add(n), f(l))
    },
    g = (n) =>
      n >= 90
        ? 'text-green-600'
        : n >= 75
          ? 'text-blue-600'
          : n >= 60
            ? 'text-amber-600'
            : n >= 40
              ? 'text-orange-600'
              : 'text-red-600',
    j = (n) =>
      n >= 90
        ? 'bg-green-50'
        : n >= 75
          ? 'bg-blue-50'
          : n >= 60
            ? 'bg-amber-50'
            : n >= 40
              ? 'bg-orange-50'
              : 'bg-red-50',
    w = (n) =>
      n >= 90
        ? i('consistency.scoreLabels.excellent')
        : n >= 75
          ? i('consistency.scoreLabels.good')
          : n >= 60
            ? i('consistency.scoreLabels.fair')
            : n >= 40
              ? i('consistency.scoreLabels.poor')
              : i('consistency.scoreLabels.critical'),
    _ = (n) => {
      switch (n) {
        case 'high':
          return 'destructive'
        case 'medium':
          return 'default'
        case 'low':
          return 'secondary'
      }
    },
    E = (n) => {
      switch (n) {
        case 'high':
          return e.jsx(X, { className: 'size-3' })
        case 'medium':
          return e.jsx(F, { className: 'size-3' })
        case 'low':
          return e.jsx(ge, { className: 'size-3' })
      }
    },
    C = (n) => {
      const l = {
        contradiction: e.jsx(X, { className: 'size-3' }),
        ambiguity: e.jsx(F, { className: 'size-3' }),
        overlap: e.jsx(ge, { className: 'size-3' }),
      }
      return e.jsxs(y, {
        variant: 'outline',
        className: 'gap-1',
        children: [l[n], i(`consistency.conflictTypes.${n}`)],
      })
    },
    v = (n) => {
      const l = new Date(n)
      return new Intl.DateTimeFormat(p.language, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(l)
    }
  if (!s)
    return e.jsxs(x, {
      children: [
        e.jsx($, {
          children: e.jsxs(D, {
            className: 'flex items-center gap-2 text-base',
            children: [
              e.jsx(V, { className: 'size-5 text-muted-foreground' }),
              i('consistency.title'),
            ],
          }),
        }),
        e.jsx(k, {
          children: e.jsxs('div', {
            className: 'space-y-2 py-8 text-center',
            children: [
              e.jsx(V, { className: 'mx-auto size-12 text-muted-foreground opacity-50' }),
              e.jsx('p', {
                className: 'text-sm font-medium text-muted-foreground',
                children: i('consistency.emptyState.title'),
              }),
              e.jsx('p', {
                className: 'text-xs text-muted-foreground',
                children: i('consistency.emptyState.description'),
              }),
            ],
          }),
        }),
      ],
    })
  const A = s.conflicts.length > 0,
    b = s.consistency_score
  return e.jsxs(x, {
    children: [
      e.jsx($, {
        children: e.jsxs(D, {
          className: 'flex items-center justify-between text-base',
          children: [
            e.jsxs('div', {
              className: 'flex items-center gap-2',
              children: [e.jsx(V, { className: 'size-5' }), i('consistency.title')],
            }),
            e.jsxs(y, {
              variant: s.ai_service_available ? 'default' : 'secondary',
              className: 'gap-1',
              children: [
                e.jsx(Ve, { className: 'size-3' }),
                s.ai_service_available
                  ? i('consistency.aiAvailable')
                  : i('consistency.aiUnavailable'),
              ],
            }),
          ],
        }),
      }),
      e.jsxs(k, {
        className: 'space-y-4',
        children: [
          e.jsxs('div', {
            className: `rounded-lg border p-4 ${j(b)}`,
            role: 'region',
            'aria-label': i('consistency.score'),
            children: [
              e.jsxs('div', {
                className: 'mb-2 flex items-center justify-between',
                children: [
                  e.jsx('span', {
                    className: 'text-sm font-medium text-muted-foreground',
                    children: i('consistency.score'),
                  }),
                  e.jsx('span', { className: `text-3xl font-bold ${g(b)}`, children: b }),
                ],
              }),
              e.jsx(Ee, {
                value: b,
                className: 'mb-2 h-2',
                'aria-label': `${i('consistency.score')}: ${b} out of 100`,
              }),
              e.jsxs('div', {
                className: 'flex items-center justify-between',
                children: [
                  e.jsx('span', { className: 'text-xs text-muted-foreground', children: '0' }),
                  e.jsx('span', { className: `text-sm font-medium ${g(b)}`, children: w(b) }),
                  e.jsx('span', { className: 'text-xs text-muted-foreground', children: '100' }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'grid grid-cols-2 gap-3 text-sm',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-2 text-muted-foreground',
                children: [
                  e.jsx(V, { className: 'size-4' }),
                  e.jsxs('div', {
                    children: [
                      e.jsx('p', { className: 'text-xs', children: i('consistency.checkTrigger') }),
                      e.jsx('p', {
                        className: 'font-medium text-foreground',
                        children:
                          s.check_trigger === 'manual'
                            ? i('consistency.manual')
                            : i('consistency.automaticOnSubmit'),
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'flex items-center gap-2 text-muted-foreground',
                children: [
                  e.jsx(Qe, { className: 'size-4' }),
                  e.jsxs('div', {
                    children: [
                      e.jsx('p', { className: 'text-xs', children: i('consistency.checkedAt') }),
                      e.jsx('p', {
                        className: 'font-medium text-foreground',
                        children: v(s.checked_at),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          e.jsx(Q, {}),
          A
            ? e.jsxs('div', {
                className: 'space-y-3',
                children: [
                  e.jsxs('div', {
                    className:
                      'flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3',
                    children: [
                      e.jsx(X, { className: 'size-5 shrink-0 text-amber-600' }),
                      e.jsxs('div', {
                        children: [
                          e.jsxs('p', {
                            className: 'text-sm font-medium text-amber-900',
                            children: [
                              i('consistency.conflictsFound'),
                              ' (',
                              s.conflicts.length,
                              ')',
                            ],
                          }),
                          e.jsx('p', {
                            className: 'text-xs text-amber-700',
                            children: i('consistency.conflictsFoundDescription'),
                          }),
                        ],
                      }),
                    ],
                  }),
                  e.jsx('div', {
                    className: 'space-y-2',
                    children: s.conflicts.map((n, l) => {
                      const T = o.has(l)
                      return e.jsxs(
                        'div',
                        {
                          className: 'overflow-hidden rounded-lg border',
                          children: [
                            e.jsxs('button', {
                              onClick: () => d(l),
                              className:
                                'flex w-full items-center justify-between bg-muted/50 px-4 py-3 text-start transition-colors hover:bg-muted',
                              'aria-expanded': T,
                              'aria-controls': `conflict-${l}`,
                              children: [
                                e.jsxs('div', {
                                  className: 'flex min-w-0 flex-1 items-center gap-2',
                                  children: [
                                    E(n.severity),
                                    e.jsx('span', {
                                      className: 'truncate text-sm font-medium',
                                      children: n.description,
                                    }),
                                  ],
                                }),
                                e.jsxs('div', {
                                  className: 'ms-2 flex shrink-0 items-center gap-2',
                                  children: [
                                    e.jsx(y, {
                                      variant: _(n.severity),
                                      className: 'gap-1',
                                      children: i(`consistency.severityLevels.${n.severity}`),
                                    }),
                                    C(n.conflict_type),
                                    T
                                      ? e.jsx(Ke, { className: 'size-4 text-muted-foreground' })
                                      : e.jsx(Me, { className: 'size-4 text-muted-foreground' }),
                                  ],
                                }),
                              ],
                            }),
                            T &&
                              e.jsxs('div', {
                                id: `conflict-${l}`,
                                className: 'space-y-3 bg-background p-4',
                                children: [
                                  n.affected_sections.length > 0 &&
                                    e.jsxs('div', {
                                      children: [
                                        e.jsx('p', {
                                          className:
                                            'mb-1 text-xs font-medium text-muted-foreground',
                                          children: i('consistency.conflict.affectedSections'),
                                        }),
                                        e.jsx('div', {
                                          className: 'flex flex-wrap gap-1',
                                          children: n.affected_sections.map((z, I) =>
                                            e.jsx(
                                              y,
                                              {
                                                variant: 'outline',
                                                className: 'text-xs',
                                                children: z,
                                              },
                                              I,
                                            ),
                                          ),
                                        }),
                                      ],
                                    }),
                                  e.jsxs('div', {
                                    className: 'rounded-md border border-blue-200 bg-blue-50 p-3',
                                    children: [
                                      e.jsx('p', {
                                        className: 'mb-1 text-xs font-medium text-blue-900',
                                        children: i('consistency.conflict.suggestedResolution'),
                                      }),
                                      e.jsx('p', {
                                        className: 'text-sm text-blue-800',
                                        children: n.suggested_resolution,
                                      }),
                                    ],
                                  }),
                                  e.jsxs('div', {
                                    className: 'flex flex-wrap gap-2 pt-2',
                                    children: [
                                      e.jsx(h, {
                                        variant: 'default',
                                        size: 'sm',
                                        onClick: () => a?.(n.conflict_position_id, 'modify'),
                                        className: 'flex-1 sm:flex-initial',
                                        children: i('consistency.actions.modify'),
                                      }),
                                      e.jsxs(h, {
                                        variant: 'outline',
                                        size: 'sm',
                                        onClick: () => t?.(n.conflict_position_id),
                                        className: 'gap-1',
                                        children: [
                                          i('consistency.actions.viewPosition'),
                                          e.jsx(Oe, { className: 'size-3' }),
                                        ],
                                      }),
                                      e.jsx(h, {
                                        variant: 'secondary',
                                        size: 'sm',
                                        onClick: () => a?.(n.conflict_position_id, 'accept'),
                                        children: i('consistency.actions.accept'),
                                      }),
                                      e.jsx(h, {
                                        variant: 'destructive',
                                        size: 'sm',
                                        onClick: () => a?.(n.conflict_position_id, 'escalate'),
                                        children: i('consistency.actions.escalate'),
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                          ],
                        },
                        `${n.conflict_position_id}-${l}`,
                      )
                    }),
                  }),
                ],
              })
            : e.jsxs('div', {
                className:
                  'flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4',
                children: [
                  e.jsx(ve, { className: 'size-5 shrink-0 text-green-600' }),
                  e.jsxs('div', {
                    children: [
                      e.jsx('p', {
                        className: 'text-sm font-medium text-green-900',
                        children: i('consistency.noConflicts'),
                      }),
                      e.jsx('p', {
                        className: 'text-xs text-green-700',
                        children: i('consistency.noConflictsDescription'),
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
function ks() {
  const { id: s } = Pe.useParams(),
    { t: a } = R('positions'),
    { data: t, isLoading: r } = Fe(s),
    i = es(),
    p = as()
  if (r)
    return e.jsxs('div', {
      className: 'container mx-auto py-6 space-y-6',
      children: [e.jsx(ce, { className: 'h-8 w-64' }), e.jsx(ce, { className: 'h-96' })],
    })
  if (!t)
    return e.jsx('div', {
      className: 'container mx-auto py-6',
      children: e.jsx(x, {
        className: 'p-6 text-center',
        children: e.jsx('p', {
          className: 'text-lg text-muted-foreground',
          children: a('notFound', 'Position not found'),
        }),
      }),
    })
  const o = async (g) => {
      await i.mutateAsync({ id: t.id, data: { ...g, version: t.version } })
    },
    f = async () => {
      await p.mutateAsync(t.id)
    },
    d = (g) => {
      switch (g) {
        case 'draft':
          return 'default'
        case 'under_review':
          return 'secondary'
        case 'approved':
          return 'success'
        case 'published':
          return 'primary'
        default:
          return 'default'
      }
    }
  return e.jsxs('div', {
    className: 'container mx-auto py-6 space-y-6',
    children: [
      e.jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          e.jsxs('div', {
            className: 'space-y-1',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-3',
                children: [
                  e.jsx('h1', { className: 'text-3xl font-bold', children: t.title_en }),
                  e.jsx(y, { variant: d(t.status), children: a(`status.${t.status}`, t.status) }),
                ],
              }),
              e.jsx('p', { className: 'text-sm text-muted-foreground', children: t.title_ar }),
            ],
          }),
          e.jsxs('div', {
            className: 'flex gap-2',
            children: [
              t.status === 'draft' &&
                e.jsx(e.Fragment, {
                  children: e.jsxs(h, {
                    variant: 'outline',
                    onClick: f,
                    children: [
                      e.jsx(Je, { className: 'me-2 h-4 w-4' }),
                      a('submit', 'Submit for Review'),
                    ],
                  }),
                }),
              t.status === 'approved' &&
                e.jsxs(h, {
                  children: [e.jsx(ve, { className: 'me-2 h-4 w-4' }), a('publish', 'Publish')],
                }),
            ],
          }),
        ],
      }),
      e.jsxs($e, {
        defaultValue: 'editor',
        className: 'space-y-4',
        children: [
          e.jsxs(De, {
            children: [
              e.jsxs(J, {
                value: 'editor',
                children: [e.jsx(Y, { className: 'me-2 h-4 w-4' }), a('tabs.editor', 'Editor')],
              }),
              (t.status === 'under_review' ||
                t.status === 'approved' ||
                t.status === 'published') &&
                e.jsxs(J, {
                  value: 'approvals',
                  children: [
                    e.jsx(We, { className: 'me-2 h-4 w-4' }),
                    a('tabs.approvals', 'Approvals'),
                  ],
                }),
              e.jsxs(J, {
                value: 'versions',
                children: [
                  e.jsx(Xe, { className: 'me-2 h-4 w-4' }),
                  a('tabs.versions', 'Versions'),
                ],
              }),
            ],
          }),
          e.jsxs(W, {
            value: 'editor',
            className: 'space-y-6',
            children: [
              t.status !== 'draft' &&
                e.jsx(x, {
                  className: 'bg-muted/50 border-border',
                  children: e.jsx(k, {
                    className: 'pt-3 pb-3',
                    children: e.jsxs('div', {
                      className: 'flex items-start gap-2',
                      children: [
                        e.jsx(Y, {
                          className: 'h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0',
                        }),
                        e.jsxs('p', {
                          className: 'text-xs font-bold text-foreground',
                          children: [
                            t.status === 'under_review' &&
                              'Position Under Review - Read Only. This position is currently under review and cannot be edited. It must go through the approval chain before any changes can be made.',
                            t.status === 'approved' &&
                              'Position Approved - Read Only. This position has been approved and is awaiting publication. Contact an administrator to make changes.',
                            t.status === 'published' &&
                              'Position Published - Read Only. This position has been published. To make changes, you must use the Emergency Correction workflow or create a new version.',
                          ],
                        }),
                      ],
                    }),
                  }),
                }),
              t.status === 'draft' &&
                e.jsx(x, {
                  className: 'bg-muted/50 border-border',
                  children: e.jsx(k, {
                    className: 'pt-3 pb-3',
                    children: e.jsxs('div', {
                      className: 'flex items-start gap-2',
                      children: [
                        e.jsx(Y, {
                          className: 'h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0',
                        }),
                        e.jsx('p', {
                          className: 'text-xs font-bold text-foreground',
                          children:
                            'Draft Mode - Editing Enabled. You can edit this position. Changes are auto-saved every 30 seconds. Click "Submit for Review" when ready to start the approval process.',
                        }),
                      ],
                    }),
                  }),
                }),
              e.jsxs('div', {
                className: 'grid grid-cols-1 lg:grid-cols-3 gap-6',
                children: [
                  e.jsxs('div', {
                    className: 'lg:col-span-2 space-y-6',
                    children: [
                      e.jsx(x, {
                        className: 'p-6',
                        children: e.jsx(ls, {
                          initialData: t,
                          onSave: o,
                          readOnly: t.status !== 'draft',
                          autoSaveInterval: 3e4,
                        }),
                      }),
                      e.jsxs(x, {
                        className: 'p-6',
                        children: [
                          e.jsx('h3', {
                            className: 'text-lg font-semibold mb-4',
                            children: a('attachments', 'Attachments'),
                          }),
                          e.jsx(Ye, { positionId: t.id }),
                        ],
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'space-y-6',
                    children: [
                      t.consistency_score !== void 0 &&
                        e.jsxs(x, {
                          className: 'p-6',
                          children: [
                            e.jsx('h3', {
                              className: 'text-lg font-semibold mb-4',
                              children: a('consistency.title', 'Consistency Check'),
                            }),
                            e.jsx(cs, { positionId: t.id }),
                          ],
                        }),
                      (t.status === 'under_review' || t.status === 'approved') &&
                        e.jsxs(x, {
                          className: 'p-6',
                          children: [
                            e.jsx('h3', {
                              className: 'text-lg font-semibold mb-4',
                              children: a('approvalChain', 'Approval Progress'),
                            }),
                            e.jsx(fe, { positionId: t.id, currentStage: t.current_stage }),
                          ],
                        }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          e.jsx(W, {
            value: 'approvals',
            children: e.jsx(x, {
              className: 'p-6',
              children: e.jsx(fe, {
                positionId: t.id,
                currentStage: t.current_stage,
                detailed: !0,
              }),
            }),
          }),
          e.jsx(W, {
            value: 'versions',
            children: e.jsx(x, {
              className: 'p-6',
              children: e.jsx('p', {
                className: 'text-muted-foreground',
                children: a('versions.description', 'View version history and compare changes'),
              }),
            }),
          }),
        ],
      }),
    ],
  })
}
export { ks as component }
//# sourceMappingURL=_id-Da85llYI.js.map
