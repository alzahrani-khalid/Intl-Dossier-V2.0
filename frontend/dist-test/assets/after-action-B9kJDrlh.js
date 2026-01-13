import { u as B, j as e, r as v } from './react-vendor-Buoak6m3.js'
import { a as pe, i as ve, L as Ae } from './tanstack-vendor-BZC-rs5U.js'
import {
  s as be,
  c as j,
  B as A,
  j as S,
  k as T,
  o as P,
  m as J,
  l as M,
  J as h,
  n as V,
  I as z,
  ah as ne,
  ai as le,
  aj as ce,
  ak as oe,
  q as R,
  r as q,
  t as I,
  v as U,
  w as F,
  C as ge,
  A as Ne,
  aW as _e,
  E as we,
  F as ye,
  G as Ce,
  H as Fe,
  af as D,
  ag as E,
  a2 as Q,
  b4 as ke,
  a0 as he,
  V as ue,
} from './index-qYY0KoZ1.js'
import { a as $e } from './useAfterAction-DL23SY7H.js'
import {
  b9 as O,
  b6 as ee,
  aR as de,
  aT as Se,
  bz as ze,
  aA as Te,
  cl as Pe,
  bL as xe,
  aS as X,
  bS as Le,
  bw as re,
  cM as De,
  be as ie,
  bq as Ee,
  bW as Re,
  aX as qe,
  aP as fe,
} from './vendor-misc-BiJvMP0A.js'
import { H as me } from './date-vendor-s0MkYge4.js'
import { R as Ie, a as je } from './radio-group-XNQBLInt.js'
import { A as Ue } from './AttachmentUploader-DnTiValP.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
import './useIntakeApi-84Q7PHHY.js'
function Me(n) {
  return pe({
    queryKey: ['engagement', n],
    queryFn: async () => {
      const { data: c, error: o } = await be
        .from('dossiers')
        .select(
          `
          id,
          name_en,
          name_ar,
          description_en,
          description_ar,
          status,
          created_at,
          updated_at,
          created_by,
          updated_by,
          engagements!inner (
            engagement_type,
            engagement_category,
            location_en,
            location_ar
          )
        `,
        )
        .eq('id', n)
        .eq('type', 'engagement')
        .single()
      if (o) throw o
      return {
        id: c.id,
        name_en: c.name_en,
        name_ar: c.name_ar,
        description_en: c.description_en,
        description_ar: c.description_ar,
        engagement_type: c.engagements.engagement_type,
        engagement_category: c.engagements.engagement_category,
        location_en: c.engagements.location_en,
        location_ar: c.engagements.location_ar,
        status: c.status,
        created_at: c.created_at,
        updated_at: c.updated_at,
        created_by: c.created_by,
        updated_by: c.updated_by,
      }
    },
    enabled: !!n,
  })
}
function Ve({ decisions: n, onChange: c, readOnly: o = !1 }) {
  const { t: i, i18n: d } = B(),
    l = d.language === 'ar',
    g = () => {
      c([...n, { description: '', decision_maker: '', decision_date: new Date() }])
    },
    b = (a) => {
      c(n.filter((s, t) => t !== a))
    },
    u = (a, s, t) => {
      const r = [...n]
      ;((r[a] = { ...r[a], [s]: t }), c(r))
    }
  return e.jsxs('div', {
    className: 'space-y-4',
    children: [
      e.jsxs('div', {
        className: j('flex items-center justify-between', l && 'flex-row-reverse'),
        children: [
          e.jsx('h3', {
            className: 'text-lg font-semibold',
            children: i('afterActions.decisions.title'),
          }),
          !o &&
            e.jsxs(A, {
              type: 'button',
              variant: 'outline',
              size: 'sm',
              onClick: g,
              children: [e.jsx(O, { className: 'me-2 size-4' }), i('afterActions.decisions.add')],
            }),
        ],
      }),
      n.length === 0 &&
        e.jsx('p', {
          className: 'text-sm text-muted-foreground',
          children: i('afterActions.decisions.empty'),
        }),
      n.map((a, s) =>
        e.jsxs(
          S,
          {
            children: [
              e.jsx(T, {
                children: e.jsxs('div', {
                  className: j('flex items-center justify-between', l && 'flex-row-reverse'),
                  children: [
                    e.jsx(P, {
                      className: 'text-base',
                      children: i('afterActions.decisions.item', { number: s + 1 }),
                    }),
                    e.jsxs('div', {
                      className: j('flex items-center gap-2', l && 'flex-row-reverse'),
                      children: [
                        a.ai_confidence !== void 0 &&
                          e.jsx(J, {
                            variant:
                              a.ai_confidence >= 0.8
                                ? 'default'
                                : a.ai_confidence >= 0.5
                                  ? 'secondary'
                                  : 'destructive',
                            children: i('afterActions.confidence', {
                              value: Math.round(a.ai_confidence * 100),
                            }),
                          }),
                        !o &&
                          e.jsx(A, {
                            type: 'button',
                            variant: 'ghost',
                            size: 'sm',
                            onClick: () => b(s),
                            children: e.jsx(ee, { className: 'size-4 text-destructive' }),
                          }),
                      ],
                    }),
                  ],
                }),
              }),
              e.jsxs(M, {
                className: 'space-y-4',
                children: [
                  e.jsxs('div', {
                    children: [
                      e.jsxs(h, {
                        htmlFor: `decision-description-${s}`,
                        children: [i('afterActions.decisions.description'), ' *'],
                      }),
                      e.jsx(V, {
                        id: `decision-description-${s}`,
                        value: a.description,
                        onChange: (t) => u(s, 'description', t.target.value),
                        placeholder: i('afterActions.decisions.descriptionPlaceholder'),
                        rows: 3,
                        maxLength: 2e3,
                        disabled: o,
                        dir: l ? 'rtl' : 'ltr',
                        required: !0,
                      }),
                      e.jsxs('p', {
                        className: 'mt-1 text-xs text-muted-foreground',
                        children: [a.description.length, '/2000'],
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    children: [
                      e.jsx(h, {
                        htmlFor: `decision-rationale-${s}`,
                        children: i('afterActions.decisions.rationale'),
                      }),
                      e.jsx(V, {
                        id: `decision-rationale-${s}`,
                        value: a.rationale || '',
                        onChange: (t) => u(s, 'rationale', t.target.value),
                        placeholder: i('afterActions.decisions.rationalePlaceholder'),
                        rows: 2,
                        disabled: o,
                        dir: l ? 'rtl' : 'ltr',
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'grid grid-cols-1 gap-4 md:grid-cols-2',
                    children: [
                      e.jsxs('div', {
                        children: [
                          e.jsxs(h, {
                            htmlFor: `decision-maker-${s}`,
                            children: [i('afterActions.decisions.decisionMaker'), ' *'],
                          }),
                          e.jsx(z, {
                            id: `decision-maker-${s}`,
                            value: a.decision_maker,
                            onChange: (t) => u(s, 'decision_maker', t.target.value),
                            placeholder: i('afterActions.decisions.decisionMakerPlaceholder'),
                            maxLength: 200,
                            disabled: o,
                            dir: l ? 'rtl' : 'ltr',
                            required: !0,
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        children: [
                          e.jsxs(h, { children: [i('afterActions.decisions.decisionDate'), ' *'] }),
                          e.jsxs(ne, {
                            children: [
                              e.jsx(le, {
                                asChild: !0,
                                children: e.jsxs(A, {
                                  variant: 'outline',
                                  className: j(
                                    'w-full justify-start text-start font-normal',
                                    !a.decision_date && 'text-muted-foreground',
                                  ),
                                  disabled: o,
                                  children: [
                                    e.jsx(de, { className: 'me-2 size-4 opacity-50' }),
                                    a.decision_date
                                      ? me(a.decision_date, 'PPP')
                                      : i('common.selectDate'),
                                  ],
                                }),
                              }),
                              e.jsx(ce, {
                                className: 'w-auto p-0',
                                align: 'start',
                                children: e.jsx(oe, {
                                  mode: 'single',
                                  selected: a.decision_date,
                                  onSelect: (t) => t && u(s, 'decision_date', t),
                                  disabled: (t) => t > new Date(),
                                  initialFocus: !0,
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
          },
          s,
        ),
      ),
    ],
  })
}
const Be = ['low', 'medium', 'high', 'critical'],
  He = ['pending', 'in_progress', 'completed', 'cancelled', 'overdue']
function Je({ commitments: n, onChange: c, readOnly: o = !1, availableUsers: i = [] }) {
  const { t: d, i18n: l } = B(),
    g = l.language === 'ar',
    b = () => {
      c([
        ...n,
        {
          description: '',
          priority: 'medium',
          status: 'pending',
          owner_type: 'internal',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3),
        },
      ])
    },
    u = (s) => {
      c(n.filter((t, r) => r !== s))
    },
    a = (s, t, r) => {
      const N = [...n]
      ;((N[s] = { ...N[s], [t]: r }),
        t === 'owner_type' && (N[s].tracking_mode = r === 'internal' ? 'automatic' : 'manual'),
        c(N))
    }
  return e.jsxs('div', {
    className: 'space-y-4',
    children: [
      e.jsxs('div', {
        className: j('flex items-center justify-between', g && 'flex-row-reverse'),
        children: [
          e.jsx('h3', {
            className: 'text-lg font-semibold',
            children: d('afterActions.commitments.title'),
          }),
          !o &&
            e.jsxs(A, {
              type: 'button',
              variant: 'outline',
              size: 'sm',
              onClick: b,
              children: [
                e.jsx(O, { className: j('h-4 w-4', g ? 'ms-2' : 'me-2') }),
                d('afterActions.commitments.add'),
              ],
            }),
        ],
      }),
      n.length === 0 &&
        e.jsx('p', {
          className: 'text-sm text-muted-foreground',
          children: d('afterActions.commitments.empty'),
        }),
      n.map((s, t) =>
        e.jsxs(
          S,
          {
            children: [
              e.jsx(T, {
                children: e.jsxs('div', {
                  className: j('flex items-center justify-between', g && 'flex-row-reverse'),
                  children: [
                    e.jsx(P, {
                      className: 'text-base',
                      children: d('afterActions.commitments.item', { number: t + 1 }),
                    }),
                    e.jsxs('div', {
                      className: j('flex items-center gap-2', g && 'flex-row-reverse'),
                      children: [
                        s.tracking_mode &&
                          e.jsx(J, {
                            variant: 'outline',
                            children: d(`afterActions.commitments.tracking.${s.tracking_mode}`),
                          }),
                        s.ai_confidence !== void 0 &&
                          e.jsx(J, {
                            variant:
                              s.ai_confidence >= 0.8
                                ? 'default'
                                : s.ai_confidence >= 0.5
                                  ? 'secondary'
                                  : 'destructive',
                            children: d('afterActions.confidence', {
                              value: Math.round(s.ai_confidence * 100),
                            }),
                          }),
                        !o &&
                          e.jsx(A, {
                            type: 'button',
                            variant: 'ghost',
                            size: 'sm',
                            onClick: () => u(t),
                            children: e.jsx(ee, { className: 'size-4 text-destructive' }),
                          }),
                      ],
                    }),
                  ],
                }),
              }),
              e.jsxs(M, {
                className: 'space-y-4',
                children: [
                  e.jsxs('div', {
                    children: [
                      e.jsxs(h, {
                        htmlFor: `commitment-description-${t}`,
                        children: [d('afterActions.commitments.description'), ' *'],
                      }),
                      e.jsx(V, {
                        id: `commitment-description-${t}`,
                        value: s.description,
                        onChange: (r) => a(t, 'description', r.target.value),
                        placeholder: d('afterActions.commitments.descriptionPlaceholder'),
                        rows: 2,
                        maxLength: 2e3,
                        disabled: o,
                        dir: g ? 'rtl' : 'ltr',
                        required: !0,
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    children: [
                      e.jsxs(h, { children: [d('afterActions.commitments.ownerType'), ' *'] }),
                      e.jsxs(Ie, {
                        value: s.owner_type,
                        onValueChange: (r) => a(t, 'owner_type', r),
                        disabled: o,
                        className: 'flex gap-4',
                        children: [
                          e.jsxs('div', {
                            className: 'flex items-center space-x-2',
                            children: [
                              e.jsx(je, { value: 'internal', id: `internal-${t}` }),
                              e.jsxs(h, {
                                htmlFor: `internal-${t}`,
                                className: 'flex items-center gap-2',
                                children: [
                                  e.jsx(Se, { className: 'size-4' }),
                                  d('afterActions.commitments.internal'),
                                ],
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            className: 'flex items-center space-x-2',
                            children: [
                              e.jsx(je, { value: 'external', id: `external-${t}` }),
                              e.jsxs(h, {
                                htmlFor: `external-${t}`,
                                className: 'flex items-center gap-2',
                                children: [
                                  e.jsx(ze, { className: 'size-4' }),
                                  d('afterActions.commitments.external'),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  s.owner_type === 'internal'
                    ? e.jsxs('div', {
                        children: [
                          e.jsxs(h, {
                            htmlFor: `owner-user-${t}`,
                            children: [d('afterActions.commitments.assignedTo'), ' *'],
                          }),
                          e.jsxs(R, {
                            value: s.owner_user_id,
                            onValueChange: (r) => a(t, 'owner_user_id', r),
                            disabled: o,
                            children: [
                              e.jsx(q, {
                                id: `owner-user-${t}`,
                                dir: g ? 'rtl' : 'ltr',
                                children: e.jsx(I, {
                                  placeholder: d('afterActions.commitments.selectUser'),
                                }),
                              }),
                              e.jsx(U, {
                                children: i.map((r) =>
                                  e.jsx(F, { value: r.id, children: r.name }, r.id),
                                ),
                              }),
                            ],
                          }),
                        ],
                      })
                    : e.jsxs('div', {
                        className: 'space-y-4',
                        children: [
                          e.jsxs('div', {
                            children: [
                              e.jsxs(h, {
                                htmlFor: `contact-email-${t}`,
                                children: [d('afterActions.commitments.contactEmail'), ' *'],
                              }),
                              e.jsx(z, {
                                id: `contact-email-${t}`,
                                type: 'email',
                                value: s.owner_contact_email || '',
                                onChange: (r) => a(t, 'owner_contact_email', r.target.value),
                                placeholder: d('afterActions.commitments.emailPlaceholder'),
                                disabled: o,
                                dir: g ? 'rtl' : 'ltr',
                                required: !0,
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            children: [
                              e.jsxs(h, {
                                htmlFor: `contact-name-${t}`,
                                children: [d('afterActions.commitments.contactName'), ' *'],
                              }),
                              e.jsx(z, {
                                id: `contact-name-${t}`,
                                value: s.owner_contact_name || '',
                                onChange: (r) => a(t, 'owner_contact_name', r.target.value),
                                placeholder: d('afterActions.commitments.namePlaceholder'),
                                maxLength: 200,
                                disabled: o,
                                dir: g ? 'rtl' : 'ltr',
                                required: !0,
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            children: [
                              e.jsx(h, {
                                htmlFor: `contact-org-${t}`,
                                children: d('afterActions.commitments.organization'),
                              }),
                              e.jsx(z, {
                                id: `contact-org-${t}`,
                                value: s.owner_contact_organization || '',
                                onChange: (r) => a(t, 'owner_contact_organization', r.target.value),
                                placeholder: d('afterActions.commitments.orgPlaceholder'),
                                maxLength: 200,
                                disabled: o,
                                dir: g ? 'rtl' : 'ltr',
                              }),
                            ],
                          }),
                        ],
                      }),
                  e.jsxs('div', {
                    className: 'grid grid-cols-1 gap-4 md:grid-cols-3',
                    children: [
                      e.jsxs('div', {
                        children: [
                          e.jsxs(h, {
                            htmlFor: `priority-${t}`,
                            children: [d('afterActions.commitments.priority'), ' *'],
                          }),
                          e.jsxs(R, {
                            value: s.priority,
                            onValueChange: (r) => a(t, 'priority', r),
                            disabled: o,
                            children: [
                              e.jsx(q, {
                                id: `priority-${t}`,
                                dir: g ? 'rtl' : 'ltr',
                                children: e.jsx(I, {}),
                              }),
                              e.jsx(U, {
                                children: Be.map((r) =>
                                  e.jsx(
                                    F,
                                    {
                                      value: r,
                                      children: d(`afterActions.commitments.priorities.${r}`),
                                    },
                                    r,
                                  ),
                                ),
                              }),
                            ],
                          }),
                        ],
                      }),
                      s.status &&
                        e.jsxs('div', {
                          children: [
                            e.jsx(h, {
                              htmlFor: `status-${t}`,
                              children: d('afterActions.commitments.status'),
                            }),
                            e.jsxs(R, {
                              value: s.status,
                              onValueChange: (r) => a(t, 'status', r),
                              disabled:
                                o ||
                                (s.owner_type === 'internal' && s.tracking_mode === 'automatic'),
                              children: [
                                e.jsx(q, {
                                  id: `status-${t}`,
                                  dir: g ? 'rtl' : 'ltr',
                                  children: e.jsx(I, {}),
                                }),
                                e.jsx(U, {
                                  children: He.map((r) =>
                                    e.jsx(
                                      F,
                                      {
                                        value: r,
                                        children: d(`afterActions.commitments.statuses.${r}`),
                                      },
                                      r,
                                    ),
                                  ),
                                }),
                              ],
                            }),
                          ],
                        }),
                      e.jsxs('div', {
                        children: [
                          e.jsxs(h, { children: [d('afterActions.commitments.dueDate'), ' *'] }),
                          e.jsxs(ne, {
                            children: [
                              e.jsx(le, {
                                asChild: !0,
                                children: e.jsxs(A, {
                                  variant: 'outline',
                                  className: j(
                                    'w-full justify-start text-start font-normal',
                                    !s.due_date && 'text-muted-foreground',
                                    g && 'justify-end text-end',
                                  ),
                                  disabled: o,
                                  children: [
                                    e.jsx(de, {
                                      className: j('h-4 w-4 opacity-50', g ? 'ms-2' : 'me-2'),
                                    }),
                                    s.due_date ? me(s.due_date, 'PPP') : d('common.selectDate'),
                                  ],
                                }),
                              }),
                              e.jsx(ce, {
                                className: 'w-auto p-0',
                                align: 'start',
                                children: e.jsx(oe, {
                                  mode: 'single',
                                  selected: s.due_date,
                                  onSelect: (r) => r && a(t, 'due_date', r),
                                  disabled: (r) => r < new Date(),
                                  initialFocus: !0,
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
          },
          t,
        ),
      ),
    ],
  })
}
const Ge = ['low', 'medium', 'high', 'critical'],
  We = ['unlikely', 'possible', 'likely', 'certain'],
  Ke = {
    low: 'bg-green-500 hover:bg-green-500/80 text-white',
    medium: 'bg-amber-500 hover:bg-amber-500/80 text-white',
    high: 'bg-orange-600 hover:bg-orange-600/80 text-white',
    critical: 'bg-red-600 hover:bg-red-600/80 text-white',
  }
function Qe({ risks: n, onChange: c, readOnly: o = !1 }) {
  const { t: i, i18n: d } = B(),
    l = d.language === 'ar',
    g = () => {
      c([...n, { description: '', severity: 'medium', likelihood: 'possible' }])
    },
    b = (a) => {
      c(n.filter((s, t) => t !== a))
    },
    u = (a, s, t) => {
      const r = [...n]
      ;((r[a] = { ...r[a], [s]: t }), c(r))
    }
  return e.jsxs('div', {
    className: 'space-y-4',
    children: [
      e.jsxs('div', {
        className: j('flex items-center justify-between', l && 'flex-row-reverse'),
        children: [
          e.jsxs('h3', {
            className: 'flex items-center gap-2 text-lg font-semibold',
            children: [e.jsx(Te, { className: 'size-5' }), i('afterActions.risks.title')],
          }),
          !o &&
            e.jsxs(A, {
              type: 'button',
              variant: 'outline',
              size: 'sm',
              onClick: g,
              children: [
                e.jsx(O, { className: j('h-4 w-4', l ? 'ms-2' : 'me-2') }),
                i('afterActions.risks.add'),
              ],
            }),
        ],
      }),
      n.length === 0 &&
        e.jsx('p', {
          className: 'text-sm text-muted-foreground',
          children: i('afterActions.risks.empty'),
        }),
      n.map((a, s) =>
        e.jsxs(
          S,
          {
            className: j(
              'border-l-4',
              a.severity === 'low' && 'border-l-green-500',
              a.severity === 'medium' && 'border-l-amber-500',
              a.severity === 'high' && 'border-l-orange-600',
              a.severity === 'critical' && 'border-l-red-600',
            ),
            children: [
              e.jsx(T, {
                children: e.jsxs('div', {
                  className: j('flex items-center justify-between', l && 'flex-row-reverse'),
                  children: [
                    e.jsx(P, {
                      className: 'text-base',
                      children: i('afterActions.risks.item', { number: s + 1 }),
                    }),
                    e.jsxs('div', {
                      className: j('flex items-center gap-2', l && 'flex-row-reverse'),
                      children: [
                        e.jsx(J, {
                          className: Ke[a.severity],
                          children: i(`afterActions.risks.severities.${a.severity}`),
                        }),
                        a.ai_confidence !== void 0 &&
                          e.jsx(J, {
                            variant:
                              a.ai_confidence >= 0.8
                                ? 'default'
                                : a.ai_confidence >= 0.5
                                  ? 'secondary'
                                  : 'destructive',
                            children: i('afterActions.confidence', {
                              value: Math.round(a.ai_confidence * 100),
                            }),
                          }),
                        !o &&
                          e.jsx(A, {
                            type: 'button',
                            variant: 'ghost',
                            size: 'sm',
                            onClick: () => b(s),
                            children: e.jsx(ee, { className: 'size-4 text-destructive' }),
                          }),
                      ],
                    }),
                  ],
                }),
              }),
              e.jsxs(M, {
                className: 'space-y-4',
                children: [
                  e.jsxs('div', {
                    children: [
                      e.jsxs(h, {
                        htmlFor: `risk-description-${s}`,
                        children: [i('afterActions.risks.description'), ' *'],
                      }),
                      e.jsx(V, {
                        id: `risk-description-${s}`,
                        value: a.description,
                        onChange: (t) => u(s, 'description', t.target.value),
                        placeholder: i('afterActions.risks.descriptionPlaceholder'),
                        rows: 2,
                        maxLength: 2e3,
                        disabled: o,
                        dir: l ? 'rtl' : 'ltr',
                        required: !0,
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'grid grid-cols-1 gap-4 md:grid-cols-2',
                    children: [
                      e.jsxs('div', {
                        children: [
                          e.jsxs(h, {
                            htmlFor: `severity-${s}`,
                            children: [i('afterActions.risks.severity'), ' *'],
                          }),
                          e.jsxs(R, {
                            value: a.severity,
                            onValueChange: (t) => u(s, 'severity', t),
                            disabled: o,
                            children: [
                              e.jsx(q, {
                                id: `severity-${s}`,
                                dir: l ? 'rtl' : 'ltr',
                                children: e.jsx(I, {}),
                              }),
                              e.jsx(U, {
                                children: Ge.map((t) =>
                                  e.jsx(
                                    F,
                                    { value: t, children: i(`afterActions.risks.severities.${t}`) },
                                    t,
                                  ),
                                ),
                              }),
                            ],
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        children: [
                          e.jsxs(h, {
                            htmlFor: `likelihood-${s}`,
                            children: [i('afterActions.risks.likelihood'), ' *'],
                          }),
                          e.jsxs(R, {
                            value: a.likelihood,
                            onValueChange: (t) => u(s, 'likelihood', t),
                            disabled: o,
                            children: [
                              e.jsx(q, {
                                id: `likelihood-${s}`,
                                dir: l ? 'rtl' : 'ltr',
                                children: e.jsx(I, {}),
                              }),
                              e.jsx(U, {
                                children: We.map((t) =>
                                  e.jsx(
                                    F,
                                    {
                                      value: t,
                                      children: i(`afterActions.risks.likelihoods.${t}`),
                                    },
                                    t,
                                  ),
                                ),
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    children: [
                      e.jsx(h, {
                        htmlFor: `mitigation-${s}`,
                        children: i('afterActions.risks.mitigationStrategy'),
                      }),
                      e.jsx(V, {
                        id: `mitigation-${s}`,
                        value: a.mitigation_strategy || '',
                        onChange: (t) => u(s, 'mitigation_strategy', t.target.value),
                        placeholder: i('afterActions.risks.mitigationPlaceholder'),
                        rows: 2,
                        disabled: o,
                        dir: l ? 'rtl' : 'ltr',
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    children: [
                      e.jsx(h, {
                        htmlFor: `risk-owner-${s}`,
                        children: i('afterActions.risks.owner'),
                      }),
                      e.jsx(z, {
                        id: `risk-owner-${s}`,
                        value: a.owner || '',
                        onChange: (t) => u(s, 'owner', t.target.value),
                        placeholder: i('afterActions.risks.ownerPlaceholder'),
                        maxLength: 200,
                        disabled: o,
                        dir: l ? 'rtl' : 'ltr',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          },
          s,
        ),
      ),
    ],
  })
}
function Xe({ followUpActions: n, onChange: c, readOnly: o = !1 }) {
  const { t: i, i18n: d } = B(),
    l = d.language === 'ar',
    g = () => {
      c([...n, { description: '', completed: !1 }])
    },
    b = (a) => {
      c(n.filter((s, t) => t !== a))
    },
    u = (a, s, t) => {
      const r = [...n]
      ;((r[a] = { ...r[a], [s]: t }), c(r))
    }
  return e.jsxs('div', {
    className: 'space-y-4',
    children: [
      e.jsxs('div', {
        className: j('flex items-center justify-between', l && 'flex-row-reverse'),
        children: [
          e.jsxs('h3', {
            className: 'flex items-center gap-2 text-lg font-semibold',
            children: [e.jsx(Pe, { className: 'size-5' }), i('afterActions.followUps.title')],
          }),
          !o &&
            e.jsxs(A, {
              type: 'button',
              variant: 'outline',
              size: 'sm',
              onClick: g,
              children: [
                e.jsx(O, { className: j('h-4 w-4', l ? 'ms-2' : 'me-2') }),
                i('afterActions.followUps.add'),
              ],
            }),
        ],
      }),
      n.length === 0 &&
        e.jsx('p', {
          className: 'text-sm text-muted-foreground',
          children: i('afterActions.followUps.empty'),
        }),
      n.map((a, s) =>
        e.jsxs(
          S,
          {
            className: j(a.completed && 'opacity-60'),
            children: [
              e.jsx(T, {
                children: e.jsxs('div', {
                  className: j('flex items-center justify-between', l && 'flex-row-reverse'),
                  children: [
                    e.jsxs(P, {
                      className: 'flex items-center gap-2 text-base',
                      children: [
                        e.jsx(ge, {
                          checked: a.completed,
                          onCheckedChange: (t) => u(s, 'completed', t),
                          disabled: o,
                        }),
                        i('afterActions.followUps.item', { number: s + 1 }),
                      ],
                    }),
                    !o &&
                      e.jsx(A, {
                        type: 'button',
                        variant: 'ghost',
                        size: 'sm',
                        onClick: () => b(s),
                        children: e.jsx(ee, { className: 'size-4 text-destructive' }),
                      }),
                  ],
                }),
              }),
              e.jsxs(M, {
                className: 'space-y-4',
                children: [
                  e.jsxs('div', {
                    children: [
                      e.jsxs(h, {
                        htmlFor: `followup-description-${s}`,
                        children: [i('afterActions.followUps.description'), ' *'],
                      }),
                      e.jsx(V, {
                        id: `followup-description-${s}`,
                        value: a.description,
                        onChange: (t) => u(s, 'description', t.target.value),
                        placeholder: i('afterActions.followUps.descriptionPlaceholder'),
                        rows: 2,
                        maxLength: 2e3,
                        disabled: o,
                        dir: l ? 'rtl' : 'ltr',
                        required: !0,
                        className: j(a.completed && 'line-through'),
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'grid grid-cols-1 gap-4 md:grid-cols-2',
                    children: [
                      e.jsxs('div', {
                        children: [
                          e.jsxs(h, {
                            htmlFor: `followup-assigned-${s}`,
                            children: [
                              i('afterActions.followUps.assignedTo'),
                              e.jsx('span', {
                                className: 'ms-1 text-xs text-muted-foreground',
                                children: i('common.optional'),
                              }),
                            ],
                          }),
                          e.jsx(z, {
                            id: `followup-assigned-${s}`,
                            value: a.assigned_to || '',
                            onChange: (t) => u(s, 'assigned_to', t.target.value),
                            placeholder: i('afterActions.followUps.assignedPlaceholder'),
                            maxLength: 200,
                            disabled: o,
                            dir: l ? 'rtl' : 'ltr',
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        children: [
                          e.jsxs(h, {
                            children: [
                              i('afterActions.followUps.targetDate'),
                              e.jsx('span', {
                                className: 'ms-1 text-xs text-muted-foreground',
                                children: i('common.optional'),
                              }),
                            ],
                          }),
                          e.jsxs(ne, {
                            children: [
                              e.jsx(le, {
                                asChild: !0,
                                children: e.jsxs(A, {
                                  variant: 'outline',
                                  className: j(
                                    'w-full justify-start text-start font-normal',
                                    !a.target_date && 'text-muted-foreground',
                                    l && 'justify-end text-end',
                                  ),
                                  disabled: o,
                                  children: [
                                    e.jsx(de, {
                                      className: j('h-4 w-4 opacity-50', l ? 'ms-2' : 'me-2'),
                                    }),
                                    a.target_date
                                      ? me(a.target_date, 'PPP')
                                      : i('afterActions.followUps.selectDate'),
                                  ],
                                }),
                              }),
                              e.jsx(ce, {
                                className: 'w-auto p-0',
                                align: 'start',
                                children: e.jsx(oe, {
                                  mode: 'single',
                                  selected: a.target_date,
                                  onSelect: (t) => u(s, 'target_date', t || void 0),
                                  initialFocus: !0,
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
          },
          s,
        ),
      ),
    ],
  })
}
function Ye({ onExtract: n, disabled: c = !1, className: o }) {
  const { t: i, i18n: d } = B(),
    l = d.language === 'ar',
    [g, b] = v.useState(!1),
    [u, a] = v.useState(null),
    [s, t] = v.useState(d.language),
    [r, N] = v.useState('auto'),
    [p, y] = v.useState('idle'),
    [G, H] = v.useState(0),
    [W, w] = v.useState(null),
    [K, k] = v.useState(null),
    [Y, L] = v.useState(null),
    se = v.useCallback((f, _) => {
      const C = f / 102400
      return Math.ceil(C * (_ === 'ar' ? 1.3 : 1))
    }, []),
    te = (f) => {
      const _ = f.target.files?.[0]
      if (!_) return
      if (
        ![
          'text/plain',
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ].includes(_.type)
      ) {
        w(i('afterActions.ai.invalidFileType'))
        return
      }
      if (_.size > 10 * 1024 * 1024) {
        w(i('afterActions.ai.fileTooLarge'))
        return
      }
      ;(a(_), w(null))
      const $ = se(_.size, s)
      L($)
    },
    ae = async () => {
      if (u) {
        ;(y('uploading'), w(null))
        try {
          const f = new FormData()
          ;(f.append('file', u), f.append('language', s), f.append('mode', r))
          const _ = await fetch('/api/ai/extract', { method: 'POST', body: f })
          if (!_.ok) throw new Error(i('afterActions.ai.extractionFailed'))
          const C = await _.json()
          C.job_id
            ? (k(C.job_id), L(C.estimated_time), y('processing'), Z(C.job_id))
            : (y('completed'),
              n(C.result),
              setTimeout(() => {
                ;(b(!1), m())
              }, 1500))
        } catch (f) {
          ;(y('failed'), w(f instanceof Error ? f.message : i('afterActions.ai.extractionFailed')))
        }
      }
    },
    Z = async (f) => {
      const _ = async () => {
        try {
          const $ = await (await fetch(`/api/ai/extract/${f}`)).json()
          $.status === 'completed'
            ? (y('completed'),
              H(100),
              n($.result),
              setTimeout(() => {
                ;(b(!1), m())
              }, 1500))
            : $.status === 'failed'
              ? (y('failed'), w($.error || i('afterActions.ai.extractionFailed')))
              : $.status === 'processing' && (H($.progress || 0), setTimeout(_, 2e3))
        } catch {
          ;(y('failed'), w(i('afterActions.ai.extractionFailed')))
        }
      }
      _()
    },
    m = () => {
      ;(a(null), y('idle'), H(0), w(null), k(null), L(null))
    },
    x = (f) => {
      ;(b(f), f || m())
    }
  return e.jsxs(Ne, {
    open: g,
    onOpenChange: x,
    children: [
      e.jsx(_e, {
        asChild: !0,
        children: e.jsxs(A, {
          type: 'button',
          variant: 'outline',
          disabled: c,
          className: j('gap-2', o),
          children: [e.jsx(xe, { className: 'size-4' }), i('afterActions.ai.extractButton')],
        }),
      }),
      e.jsxs(we, {
        className: 'sm:max-w-[500px]',
        dir: l ? 'rtl' : 'ltr',
        children: [
          e.jsxs(ye, {
            children: [
              e.jsxs(Ce, {
                className: 'flex items-center gap-2',
                children: [
                  e.jsx(xe, { className: 'size-5 text-primary' }),
                  i('afterActions.ai.title'),
                ],
              }),
              e.jsx(Fe, { children: i('afterActions.ai.description') }),
            ],
          }),
          e.jsxs('div', {
            className: 'space-y-4 py-4',
            children: [
              e.jsxs('div', {
                className: 'space-y-2',
                children: [
                  e.jsx(h, { htmlFor: 'file-upload', children: i('afterActions.ai.uploadFile') }),
                  e.jsx(z, {
                    id: 'file-upload',
                    type: 'file',
                    accept: '.txt,.pdf,.docx',
                    onChange: te,
                    disabled: p === 'processing' || p === 'uploading',
                  }),
                  u &&
                    e.jsxs('p', {
                      className: 'text-sm text-muted-foreground',
                      children: [
                        u.name,
                        ' (',
                        (u.size / 1024).toFixed(2),
                        ' KB)',
                        Y &&
                          e.jsxs('span', {
                            className: 'ms-2',
                            children: ['" ', i('afterActions.ai.estimatedTime'), ': ', Y, 's'],
                          }),
                      ],
                    }),
                ],
              }),
              e.jsxs('div', {
                className: 'space-y-2',
                children: [
                  e.jsx(h, { htmlFor: 'language', children: i('afterActions.ai.language') }),
                  e.jsxs(R, {
                    value: s,
                    onValueChange: (f) => t(f),
                    children: [
                      e.jsx(q, { id: 'language', children: e.jsx(I, {}) }),
                      e.jsxs(U, {
                        children: [
                          e.jsx(F, { value: 'en', children: i('common.english') }),
                          e.jsx(F, { value: 'ar', children: i('common.arabic') }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'space-y-2',
                children: [
                  e.jsx(h, { htmlFor: 'mode', children: i('afterActions.ai.mode') }),
                  e.jsxs(R, {
                    value: r,
                    onValueChange: (f) => N(f),
                    children: [
                      e.jsx(q, { id: 'mode', children: e.jsx(I, {}) }),
                      e.jsxs(U, {
                        children: [
                          e.jsx(F, { value: 'auto', children: i('afterActions.ai.modeAuto') }),
                          e.jsx(F, { value: 'sync', children: i('afterActions.ai.modeSync') }),
                          e.jsx(F, { value: 'async', children: i('afterActions.ai.modeAsync') }),
                        ],
                      }),
                    ],
                  }),
                  e.jsxs('p', {
                    className: 'text-xs text-muted-foreground',
                    children: [
                      r === 'auto' && i('afterActions.ai.modeAutoDesc'),
                      r === 'sync' && i('afterActions.ai.modeSyncDesc'),
                      r === 'async' && i('afterActions.ai.modeAsyncDesc'),
                    ],
                  }),
                ],
              }),
              p !== 'idle' &&
                e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    p === 'uploading' &&
                      e.jsxs(D, {
                        children: [
                          e.jsx(X, { className: 'size-4 animate-spin' }),
                          e.jsx(E, { children: i('afterActions.ai.uploading') }),
                        ],
                      }),
                    p === 'processing' &&
                      e.jsxs(D, {
                        children: [
                          e.jsx(X, { className: 'size-4 animate-spin' }),
                          e.jsxs(E, {
                            children: [
                              i('afterActions.ai.processing'),
                              ' (',
                              G,
                              '%)',
                              K &&
                                e.jsxs(J, {
                                  variant: 'secondary',
                                  className: 'ms-2',
                                  children: ['Job: ', K.substring(0, 8)],
                                }),
                            ],
                          }),
                        ],
                      }),
                    p === 'completed' &&
                      e.jsxs(D, {
                        className: 'border-green-500',
                        children: [
                          e.jsx(Le, { className: 'size-4 text-green-500' }),
                          e.jsx(E, {
                            className: 'text-green-700',
                            children: i('afterActions.ai.completed'),
                          }),
                        ],
                      }),
                    p === 'failed' &&
                      e.jsxs(D, {
                        variant: 'destructive',
                        children: [e.jsx(re, { className: 'size-4' }), e.jsx(E, { children: W })],
                      }),
                  ],
                }),
              p === 'idle' &&
                e.jsxs(D, {
                  children: [
                    e.jsx(re, { className: 'size-4' }),
                    e.jsx(E, { children: i('afterActions.ai.info') }),
                  ],
                }),
            ],
          }),
          e.jsxs('div', {
            className: j('flex gap-2', l && 'flex-row-reverse'),
            children: [
              e.jsx(A, {
                onClick: ae,
                disabled: !u || p === 'processing' || p === 'uploading',
                className: 'flex-1',
                children:
                  p === 'uploading' || p === 'processing'
                    ? e.jsxs(e.Fragment, {
                        children: [
                          e.jsx(X, { className: 'me-2 size-4 animate-spin' }),
                          i('afterActions.ai.extracting'),
                        ],
                      })
                    : e.jsxs(e.Fragment, {
                        children: [
                          e.jsx(De, { className: 'me-2 size-4' }),
                          i('afterActions.ai.extract'),
                        ],
                      }),
              }),
              e.jsx(A, {
                type: 'button',
                variant: 'outline',
                onClick: () => x(!1),
                disabled: p === 'processing' || p === 'uploading',
                children: i('common.cancel'),
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
function Ze({
  initialData: n,
  engagementId: c,
  dossierId: o,
  onSave: i,
  onPublish: d,
  readOnly: l = !1,
  canPublish: g = !1,
  availableUsers: b = [],
  className: u,
}) {
  const { t: a, i18n: s } = B(),
    t = s.language === 'ar',
    [r, N] = v.useState({
      engagement_id: c,
      dossier_id: o,
      is_confidential: n?.is_confidential || !1,
      attendees: n?.attendees || [],
      decisions: n?.decisions || [],
      commitments: n?.commitments || [],
      risks: n?.risks || [],
      follow_ups: n?.follow_ups || [],
      notes: n?.notes || '',
      version: n?.version,
      ...(n?.id && { id: n.id }),
    }),
    [p, y] = v.useState(n?.attendees?.join(', ') || ''),
    [G, H] = v.useState(!1),
    [W, w] = v.useState(!1),
    [K, k] = v.useState(null),
    [Y, L] = v.useState(!1)
  ;(v.useEffect(() => {
    const m = p
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x.length > 0)
    N((x) => ({ ...x, attendees: m }))
  }, [p]),
    v.useEffect(() => {
      n && L(!0)
    }, [r, n]))
  const se = async () => {
      ;(H(!0), k(null))
      try {
        ;(await i(r, !0), L(!1))
      } catch (m) {
        k(m instanceof Error ? m.message : a('afterActions.form.saveFailed'))
      } finally {
        H(!1)
      }
    },
    te = async () => {
      if (d) {
        if (r.attendees.length === 0) {
          k(a('afterActions.form.attendeesRequired'))
          return
        }
        if (r.attendees.length > 100) {
          k(a('afterActions.form.attendeesMax'))
          return
        }
        ;(w(!0), k(null))
        try {
          ;(await d(r), L(!1))
        } catch (m) {
          k(m instanceof Error ? m.message : a('afterActions.form.publishFailed'))
        } finally {
          w(!1)
        }
      }
    },
    ae = (m) => {
      N((x) => ({
        ...x,
        decisions: [
          ...x.decisions,
          ...(m.decisions?.filter((f) => (f.ai_confidence || 0) >= 0.5) || []),
        ],
        commitments: [
          ...x.commitments,
          ...(m.commitments?.filter((f) => (f.ai_confidence || 0) >= 0.5) || []),
        ],
        risks: [...x.risks, ...(m.risks?.filter((f) => (f.ai_confidence || 0) >= 0.5) || [])],
        follow_ups: [...x.follow_ups, ...(m.follow_ups || [])],
      }))
    },
    Z = () =>
      r.attendees.length > 0 &&
      r.attendees.length <= 100 &&
      (r.decisions.length > 0 ||
        r.commitments.length > 0 ||
        r.risks.length > 0 ||
        r.follow_ups.length > 0)
  return e.jsxs('form', {
    className: j('space-y-6', u),
    dir: t ? 'rtl' : 'ltr',
    onSubmit: (m) => {
      ;(m.preventDefault(), se())
    },
    children: [
      e.jsx(S, {
        children: e.jsx(T, {
          children: e.jsxs('div', {
            className: 'flex items-center justify-between',
            children: [
              e.jsxs(P, {
                className: 'flex items-center gap-2',
                children: [
                  a('afterActions.form.title'),
                  r.is_confidential && e.jsx(ie, { className: 'size-5 text-amber-500' }),
                ],
              }),
              !l && e.jsx(Ye, { onExtract: ae }),
            ],
          }),
        }),
      }),
      K &&
        e.jsxs(D, {
          variant: 'destructive',
          children: [e.jsx(re, { className: 'size-4' }), e.jsx(E, { children: K })],
        }),
      e.jsxs(S, {
        children: [
          e.jsx(T, { children: e.jsx(P, { children: a('afterActions.form.basicInfo') }) }),
          e.jsxs(M, {
            className: 'space-y-4',
            children: [
              e.jsxs('div', {
                className: 'space-y-2',
                children: [
                  e.jsxs(h, {
                    htmlFor: 'attendees',
                    children: [a('afterActions.form.attendees'), ' *'],
                  }),
                  e.jsx(z, {
                    id: 'attendees',
                    type: 'text',
                    value: p,
                    onChange: (m) => y(m.target.value),
                    placeholder: a('afterActions.form.attendeesPlaceholder'),
                    disabled: l,
                    dir: t ? 'rtl' : 'ltr',
                    required: !0,
                  }),
                  e.jsxs('p', {
                    className: 'text-xs text-muted-foreground',
                    children: [
                      a('afterActions.form.attendeesHelp'),
                      ' (',
                      r.attendees.length,
                      '/100)',
                    ],
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'flex items-center space-x-2',
                children: [
                  e.jsx(ge, {
                    id: 'confidential',
                    checked: r.is_confidential,
                    onCheckedChange: (m) => N((x) => ({ ...x, is_confidential: !!m })),
                    disabled: l,
                  }),
                  e.jsxs(h, {
                    htmlFor: 'confidential',
                    className: 'flex cursor-pointer items-center gap-2 text-sm font-normal',
                    children: [
                      r.is_confidential && e.jsx(ie, { className: 'size-4 text-amber-500' }),
                      a('afterActions.form.confidential'),
                    ],
                  }),
                ],
              }),
              r.is_confidential &&
                e.jsxs(D, {
                  className: 'border-amber-500',
                  children: [
                    e.jsx(ie, { className: 'size-4 text-amber-500' }),
                    e.jsx(E, {
                      className: 'text-amber-700',
                      children: a('afterActions.form.confidentialWarning'),
                    }),
                  ],
                }),
              e.jsxs('div', {
                className: 'space-y-2',
                children: [
                  e.jsx(h, { htmlFor: 'notes', children: a('afterActions.form.notes') }),
                  e.jsx(V, {
                    id: 'notes',
                    value: r.notes,
                    onChange: (m) => N((x) => ({ ...x, notes: m.target.value })),
                    placeholder: a('afterActions.form.notesPlaceholder'),
                    rows: 4,
                    disabled: l,
                    dir: t ? 'rtl' : 'ltr',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      e.jsx(Q, {}),
      e.jsx(Ve, {
        decisions: r.decisions,
        onChange: (m) => N((x) => ({ ...x, decisions: m })),
        readOnly: l,
      }),
      e.jsx(Q, {}),
      e.jsx(Je, {
        commitments: r.commitments,
        onChange: (m) => N((x) => ({ ...x, commitments: m })),
        readOnly: l,
        availableUsers: b,
      }),
      e.jsx(Q, {}),
      e.jsx(Qe, { risks: r.risks, onChange: (m) => N((x) => ({ ...x, risks: m })), readOnly: l }),
      e.jsx(Q, {}),
      e.jsx(Xe, {
        followUpActions: r.follow_ups,
        onChange: (m) => N((x) => ({ ...x, follow_ups: m })),
        readOnly: l,
      }),
      e.jsx(Q, {}),
      e.jsx(Ue, {
        attachmentIds: [],
        onChange: () => {},
        maxFiles: 10,
        maxFileSize: 100 * 1024 * 1024,
      }),
      !l &&
        e.jsx(S, {
          children: e.jsxs(M, {
            className: 'pt-6',
            children: [
              e.jsxs('div', {
                className: j('flex gap-4', t && 'flex-row-reverse'),
                children: [
                  e.jsx(A, {
                    type: 'submit',
                    disabled: G || W || !Y,
                    className: 'flex-1',
                    variant: 'outline',
                    children: G
                      ? e.jsxs(e.Fragment, {
                          children: [
                            e.jsx(X, { className: 'me-2 size-4 animate-spin' }),
                            a('afterActions.form.saving'),
                          ],
                        })
                      : e.jsxs(e.Fragment, {
                          children: [
                            e.jsx(Ee, { className: 'me-2 size-4' }),
                            a('afterActions.form.saveDraft'),
                          ],
                        }),
                  }),
                  g &&
                    d &&
                    e.jsx(A, {
                      type: 'button',
                      onClick: te,
                      disabled: G || W || !Z(),
                      className: 'flex-1',
                      children: W
                        ? e.jsxs(e.Fragment, {
                            children: [
                              e.jsx(X, { className: 'me-2 size-4 animate-spin' }),
                              a('afterActions.form.publishing'),
                            ],
                          })
                        : e.jsxs(e.Fragment, {
                            children: [
                              e.jsx(Re, { className: 'me-2 size-4' }),
                              a('afterActions.form.publish'),
                            ],
                          }),
                    }),
                ],
              }),
              !Z() &&
                e.jsx('p', {
                  className: 'mt-4 text-center text-sm text-muted-foreground',
                  children: a('afterActions.form.publishRequirements'),
                }),
            ],
          }),
        }),
    ],
  })
}
function us() {
  const { engagementId: n } = ke.useParams(),
    { t: c, i18n: o } = B(),
    i = o.language === 'ar',
    d = ve(),
    { data: l, isLoading: g } = Me(n),
    b = $e()
  if (g)
    return e.jsxs('div', {
      className: 'container mx-auto p-6 space-y-6',
      children: [e.jsx(he, { className: 'h-8 w-64' }), e.jsx(he, { className: 'h-screen w-full' })],
    })
  if (!l)
    return e.jsx('div', {
      className: 'container mx-auto p-6',
      children: e.jsx(S, {
        className: 'border-destructive',
        children: e.jsxs(T, {
          children: [
            e.jsx(P, { className: 'text-destructive', children: c('common.error') }),
            e.jsx(ue, { children: c('engagements.notFound') }),
          ],
        }),
      }),
    })
  const u = async (a) => {
    try {
      const s = await b.mutateAsync({
        engagement_id: n,
        dossier_id: l.dossier_id,
        publication_status: 'draft',
        ...a,
      })
      ;(fe.success(c('afterActions.draftSaved')),
        d({ to: '/after-actions/$afterActionId', params: { afterActionId: s.id } }))
    } catch (s) {
      fe.error(s.message || c('afterActions.saveFailed'))
    }
  }
  return e.jsxs('div', {
    className: `container mx-auto p-6 space-y-6 ${i ? 'rtl' : 'ltr'}`,
    children: [
      e.jsxs('div', {
        className: 'flex items-center gap-4',
        children: [
          e.jsx(A, {
            variant: 'ghost',
            size: 'icon',
            asChild: !0,
            children: e.jsx(Ae, {
              to: '/engagements/$engagementId',
              params: { engagementId: n },
              children: e.jsx(qe, { className: `h-4 w-4 ${i ? 'rotate-180' : ''}` }),
            }),
          }),
          e.jsxs('div', {
            children: [
              e.jsx('h1', {
                className: 'text-3xl font-bold',
                children: c('afterActions.logAfterAction'),
              }),
              e.jsx('p', { className: 'text-muted-foreground', children: l.title }),
            ],
          }),
        ],
      }),
      e.jsxs(S, {
        children: [
          e.jsxs(T, {
            children: [
              e.jsx(P, { children: c('afterActions.formTitle') }),
              e.jsx(ue, { children: c('afterActions.formDescription') }),
            ],
          }),
          e.jsx(M, {
            children: e.jsx(Ze, {
              engagementId: n,
              dossierId: l.dossier_id,
              onSaveDraft: u,
              isLoading: b.isPending,
            }),
          }),
        ],
      }),
    ],
  })
}
export { us as component }
//# sourceMappingURL=after-action-B9kJDrlh.js.map
