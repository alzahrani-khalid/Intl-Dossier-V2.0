import { u as ne, r as l, j as e } from './react-vendor-Buoak6m3.js'
import { c as xe, d as ue, L as ce } from './tanstack-vendor-BZC-rs5U.js'
import { u as we } from './useAfterAction-DL23SY7H.js'
import {
  s as ae,
  A as he,
  E as fe,
  F as pe,
  G as je,
  H as ge,
  I as be,
  B as f,
  K as ye,
  aW as Ae,
  c as H,
  af as P,
  ag as E,
  J as U,
  j as v,
  k as A,
  o as S,
  l as _,
  m as $,
  n as oe,
  b1 as _e,
  i as Fe,
  a0 as de,
  V as Q,
  a2 as se,
} from './index-qYY0KoZ1.js'
import { R as Ce, a as ie } from './radio-group-XNQBLInt.js'
import {
  be as re,
  aA as Se,
  bd as ke,
  aB as De,
  aH as te,
  aS as Y,
  bS as Z,
  bw as J,
  bP as ze,
  e9 as Te,
  b5 as Pe,
  cL as me,
  aX as Ee,
  bc as Re,
  c0 as Ue,
  bh as Ie,
  aI as Le,
  aP as le,
} from './vendor-misc-BiJvMP0A.js'
import { H as B, I as qe, J as Me } from './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function Oe() {
  const o = xe()
  return ue({
    mutationFn: async ({ afterActionId: a, isConfidential: g }) => {
      const { data: N, error: n } = await ae.functions.invoke('after-actions-publish', {
        body: { after_action_id: a, is_confidential: g },
      })
      if (n) throw n
      return N
    },
    onSuccess: (a, { afterActionId: g }) => {
      ;(o.invalidateQueries({ queryKey: ['after-action', g] }),
        o.invalidateQueries({ queryKey: ['after-actions'] }))
    },
  })
}
function $e() {
  const o = xe()
  return ue({
    mutationFn: async ({ afterActionId: a, reason: g }) => {
      const { data: N, error: n } = await ae.functions.invoke('after-actions-request-edit', {
        body: { after_action_id: a, reason: g },
      })
      if (n) throw n
      return N
    },
    onSuccess: (a, { afterActionId: g }) => {
      o.invalidateQueries({ queryKey: ['after-action', g] })
    },
  })
}
function Be({ open: o, action: a, positionId: g, onSuccess: N, onCancel: n, reason: r }) {
  const { t: s, i18n: k } = ne('positions')
  k.language
  const [m, F] = l.useState(null),
    [D, c] = l.useState(''),
    [p, I] = l.useState(!1),
    [x, w] = l.useState(!1),
    [z, C] = l.useState(!1),
    [b, t] = l.useState(null),
    [d, L] = l.useState(0),
    [V, R] = l.useState(!1),
    G = l.useRef(null),
    y = l.useRef(null),
    W = (h) => {
      const j = Math.floor(h / 60),
        T = h % 60
      return `${j.toString().padStart(2, '0')}:${T.toString().padStart(2, '0')}`
    },
    q = l.useCallback(
      (h) => {
        y.current && clearInterval(y.current)
        const j = () => {
          const T = Date.now(),
            O = new Date(h).getTime(),
            X = Math.max(0, Math.floor((O - T) / 1e3))
          ;(L(X),
            X < 570 && (m?.challenge_type === 'sms' || m?.challenge_type === 'push') && R(!0),
            X === 0 && (y.current && clearInterval(y.current), t(s('stepUp.errors.expired'))))
        }
        ;(j(), (y.current = setInterval(j, 1e3)))
      },
      [m?.challenge_type, s],
    ),
    i = l.useCallback(async () => {
      ;(I(!0), t(null))
      try {
        const {
          data: { session: h },
        } = await ae.auth.getSession()
        if (!h) throw new Error('No active session')
        const j = await fetch(
          'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/auth-step-up-initiate',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${h.access_token}`,
            },
            body: JSON.stringify({ action: a, position_id: g }),
          },
        )
        if (!j.ok) {
          const O = await j.json()
          throw new Error(O.message || 'Failed to initiate step-up challenge')
        }
        const T = await j.json()
        ;(F(T),
          q(T.expires_at),
          setTimeout(() => {
            G.current?.focus()
          }, 100))
      } catch (h) {
        ;(console.error('Failed to initiate step-up challenge:', h),
          t(h instanceof Error ? h.message : s('stepUp.errors.networkError')))
      } finally {
        I(!1)
      }
    }, [a, g, q, s]),
    u = async (h) => {
      if ((h.preventDefault(), !m)) {
        t(s('stepUp.errors.noChallengeActive'))
        return
      }
      if (D.length !== 6 || !/^\d{6}$/.test(D)) {
        t(s('stepUp.errors.invalidFormat'))
        return
      }
      ;(w(!0), t(null))
      try {
        const {
          data: { session: j },
        } = await ae.auth.getSession()
        if (!j) throw new Error('No active session')
        const T = await fetch(
          'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/auth-step-up-complete',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${j.access_token}`,
            },
            body: JSON.stringify({ challenge_id: m.challenge_id, verification_code: D }),
          },
        )
        if (!T.ok) {
          const X = await T.json()
          throw T.status === 401
            ? new Error(s('stepUp.errors.invalidCode'))
            : new Error(X.message || 'Verification failed')
        }
        const O = await T.json()
        ;(sessionStorage.setItem('elevated_token', O.elevated_token),
          sessionStorage.setItem('elevated_token_valid_until', O.valid_until),
          N(O.elevated_token, O.valid_until),
          M())
      } catch (j) {
        ;(console.error('Failed to verify step-up code:', j),
          t(j instanceof Error ? j.message : s('stepUp.errors.verificationFailed')),
          c(''))
      } finally {
        w(!1)
      }
    },
    K = async () => {
      if (!(!V || !m)) {
        ;(C(!0), t(null), R(!1))
        try {
          ;(await i(), c(''))
        } catch (h) {
          ;(console.error('Failed to resend code:', h), t(s('stepUp.errors.resendFailed')))
        } finally {
          C(!1)
        }
      }
    },
    M = () => {
      ;(F(null),
        c(''),
        t(null),
        L(0),
        R(!1),
        y.current && (clearInterval(y.current), (y.current = null)))
    },
    ee = () => {
      ;(M(), n())
    }
  ;(l.useEffect(() => {
    o && !m ? i() : o || M()
  }, [o, m, i]),
    l.useEffect(
      () => () => {
        y.current && clearInterval(y.current)
      },
      [],
    ))
  const ve = () => {
      if (!m) return ''
      switch (m.challenge_type) {
        case 'totp':
          return s('stepUp.challengeTypes.totp')
        case 'sms':
          return s('stepUp.challengeTypes.sms')
        case 'push':
          return s('stepUp.challengeTypes.push')
        default:
          return ''
      }
    },
    Ne = () => {
      if (!m) return '000000'
      switch (m.challenge_type) {
        case 'totp':
          return s('stepUp.placeholders.totp')
        case 'sms':
          return s('stepUp.placeholders.sms')
        case 'push':
          return s('stepUp.placeholders.push')
        default:
          return '000000'
      }
    }
  return e.jsx(he, {
    open: o,
    onOpenChange: (h) => !h && ee(),
    children: e.jsxs(fe, {
      className: 'max-w-md',
      'aria-describedby': 'step-up-description',
      children: [
        e.jsxs(pe, {
          children: [
            e.jsxs(je, {
              className: 'flex items-center gap-2',
              children: [
                e.jsx(re, { className: 'size-5 text-orange-500', 'aria-hidden': 'true' }),
                e.jsx('span', { children: s('stepUp.title') }),
              ],
            }),
            e.jsx(ge, { id: 'step-up-description', children: s('stepUp.description') }),
          ],
        }),
        r &&
          e.jsx('div', {
            className: 'rounded-md border border-amber-200 bg-amber-50 p-3',
            children: e.jsxs('div', {
              className: 'flex items-start gap-2',
              children: [
                e.jsx(Se, {
                  className: 'mt-0.5 size-4 shrink-0 text-amber-600',
                  'aria-hidden': 'true',
                }),
                e.jsx('p', { className: 'text-sm text-amber-900', children: r }),
              ],
            }),
          }),
        p &&
          e.jsxs('div', {
            className: 'flex items-center justify-center py-8',
            children: [
              e.jsx('div', {
                className: 'size-8 animate-spin rounded-full border-b-2 border-primary',
              }),
              e.jsx('span', {
                className: 'ms-3 text-sm text-muted-foreground',
                children: s('stepUp.initiating'),
              }),
            ],
          }),
        m &&
          !p &&
          e.jsxs('form', {
            onSubmit: u,
            className: 'space-y-4',
            children: [
              e.jsxs('div', {
                className: 'flex items-center justify-between rounded-md bg-muted p-3',
                children: [
                  e.jsxs('div', {
                    className: 'flex items-center gap-2',
                    children: [
                      e.jsx(re, {
                        className: 'size-4 text-muted-foreground',
                        'aria-hidden': 'true',
                      }),
                      e.jsx('span', { className: 'text-sm font-medium', children: ve() }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'flex items-center gap-2 text-sm text-muted-foreground',
                    children: [
                      e.jsx(ke, { className: 'size-4', 'aria-hidden': 'true' }),
                      e.jsx('span', {
                        'aria-live': 'polite',
                        'aria-atomic': 'true',
                        className: d < 60 ? 'font-medium text-destructive' : '',
                        children: W(d),
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'space-y-2',
                children: [
                  e.jsx('label', {
                    htmlFor: 'verification-code',
                    className: 'text-sm font-medium',
                    children: s('stepUp.codeLabel'),
                  }),
                  e.jsx(be, {
                    ref: G,
                    id: 'verification-code',
                    type: 'text',
                    inputMode: 'numeric',
                    pattern: '\\d{6}',
                    maxLength: 6,
                    value: D,
                    onChange: (h) => {
                      const j = h.target.value.replace(/\D/g, '')
                      ;(c(j), t(null))
                    },
                    placeholder: Ne(),
                    disabled: x || d === 0,
                    className: 'text-center font-mono text-2xl tracking-widest',
                    'aria-invalid': !!b,
                    'aria-describedby': b ? 'verification-error' : void 0,
                    autoComplete: 'one-time-code',
                  }),
                ],
              }),
              b &&
                e.jsx('div', {
                  id: 'verification-error',
                  className: 'rounded-md border border-destructive/20 bg-destructive/10 p-3',
                  role: 'alert',
                  children: e.jsx('p', { className: 'text-sm text-destructive', children: b }),
                }),
              (m.challenge_type === 'sms' || m.challenge_type === 'push') &&
                e.jsxs(f, {
                  type: 'button',
                  variant: 'ghost',
                  size: 'sm',
                  onClick: K,
                  disabled: !V || z || d === 0,
                  className: 'w-full',
                  children: [
                    e.jsx(De, {
                      className: `me-2 size-4 ${z ? 'animate-spin' : ''}`,
                      'aria-hidden': 'true',
                    }),
                    s(z ? 'stepUp.resending' : 'stepUp.resendCode'),
                  ],
                }),
              e.jsxs(ye, {
                className: 'flex-col gap-2 sm:flex-row',
                children: [
                  e.jsx(f, {
                    type: 'button',
                    variant: 'outline',
                    onClick: ee,
                    disabled: x,
                    className: 'w-full sm:w-auto',
                    children: s('stepUp.cancel'),
                  }),
                  e.jsx(f, {
                    type: 'submit',
                    disabled: x || D.length !== 6 || d === 0,
                    className: 'w-full sm:w-auto',
                    children: x
                      ? e.jsxs(e.Fragment, {
                          children: [
                            e.jsx('div', {
                              className:
                                'me-2 size-4 animate-spin rounded-full border-b-2 border-white',
                            }),
                            s('stepUp.verifying'),
                          ],
                        })
                      : s('stepUp.verify'),
                  }),
                ],
              }),
            ],
          }),
        e.jsx('div', {
          className: 'border-t pt-4',
          children: e.jsx('p', {
            className: 'text-center text-xs text-muted-foreground',
            children: s('stepUp.helpText'),
          }),
        }),
      ],
    }),
  })
}
function Ve({ afterActionId: o, isConfidential: a, disabled: g = !1, className: N }) {
  const { t: n, i18n: r } = ne(),
    s = r.language === 'ar',
    [k, m] = l.useState(!1),
    [F, D] = l.useState('both'),
    [c, p] = l.useState('idle'),
    [I, x] = l.useState(null),
    [w, z] = l.useState(null),
    [C, b] = l.useState(null),
    [t, d] = l.useState(!1),
    [L, V] = l.useState(null),
    R = async () => {
      if (a && !L) {
        d(!0)
        return
      }
      ;(p('generating'), x(null))
      try {
        const u = await fetch(`/api/after-actions/${o}/pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(L && { 'X-MFA-Token': L }) },
          body: JSON.stringify({ language: F }),
        })
        if (!u.ok) {
          const M = await u.json()
          if (u.status === 403 && M.error === 'step_up_required') {
            ;(d(!0), p('verifying'))
            return
          }
          throw new Error(M.error || n('afterActions.pdf.generationFailed'))
        }
        const K = await u.json()
        ;(p('completed'), z(K.pdf_url), b(new Date(Date.now() + 24 * 60 * 60 * 1e3)))
      } catch (u) {
        ;(p('failed'), x(u instanceof Error ? u.message : n('afterActions.pdf.generationFailed')))
      }
    },
    G = (u) => {
      ;(V(u), d(!1), R())
    },
    y = () => {
      w && window.open(w, '_blank')
    },
    W = () => {
      ;(p('idle'), x(null), z(null), b(null), V(null), d(!1))
    },
    q = (u) => {
      ;(m(u), u || W())
    },
    i = () => {
      if (!C) return ''
      const u = new Date(),
        K = C.getTime() - u.getTime(),
        M = Math.floor(K / (1e3 * 60 * 60)),
        ee = Math.floor((K % (1e3 * 60 * 60)) / (1e3 * 60))
      return n('afterActions.pdf.expiresIn', { hours: M, minutes: ee })
    }
  return t
    ? e.jsx(Be, {
        open: t,
        onClose: () => {
          ;(d(!1), p('idle'))
        },
        onSuccess: G,
        reason: n('afterActions.pdf.mfaReason'),
      })
    : e.jsxs(he, {
        open: k,
        onOpenChange: q,
        children: [
          e.jsx(Ae, {
            asChild: !0,
            children: e.jsxs(f, {
              type: 'button',
              variant: 'outline',
              disabled: g,
              className: H('gap-2', N),
              children: [e.jsx(te, { className: 'size-4' }), n('afterActions.pdf.generateButton')],
            }),
          }),
          e.jsxs(fe, {
            className: 'sm:max-w-[450px]',
            dir: s ? 'rtl' : 'ltr',
            children: [
              e.jsxs(pe, {
                children: [
                  e.jsxs(je, {
                    className: 'flex items-center gap-2',
                    children: [
                      e.jsx(te, { className: 'size-5' }),
                      n('afterActions.pdf.title'),
                      a && e.jsx(re, { className: 'size-4 text-amber-500' }),
                    ],
                  }),
                  e.jsx(ge, { children: n('afterActions.pdf.description') }),
                ],
              }),
              e.jsxs('div', {
                className: 'space-y-4 py-4',
                children: [
                  a &&
                    c === 'idle' &&
                    e.jsxs(P, {
                      className: 'border-amber-500',
                      children: [
                        e.jsx(re, { className: 'size-4 text-amber-500' }),
                        e.jsx(E, {
                          className: 'text-amber-700',
                          children: n('afterActions.pdf.confidentialWarning'),
                        }),
                      ],
                    }),
                  c === 'idle' &&
                    e.jsxs('div', {
                      className: 'space-y-3',
                      children: [
                        e.jsx(U, { children: n('afterActions.pdf.selectLanguage') }),
                        e.jsxs(Ce, {
                          value: F,
                          onValueChange: (u) => D(u),
                          children: [
                            e.jsxs('div', {
                              className: 'flex items-center space-x-2',
                              children: [
                                e.jsx(ie, { value: 'en', id: 'lang-en' }),
                                e.jsx(U, {
                                  htmlFor: 'lang-en',
                                  className: 'cursor-pointer font-normal',
                                  children: n('afterActions.pdf.englishOnly'),
                                }),
                              ],
                            }),
                            e.jsxs('div', {
                              className: 'flex items-center space-x-2',
                              children: [
                                e.jsx(ie, { value: 'ar', id: 'lang-ar' }),
                                e.jsx(U, {
                                  htmlFor: 'lang-ar',
                                  className: 'cursor-pointer font-normal',
                                  children: n('afterActions.pdf.arabicOnly'),
                                }),
                              ],
                            }),
                            e.jsxs('div', {
                              className: 'flex items-center space-x-2',
                              children: [
                                e.jsx(ie, { value: 'both', id: 'lang-both' }),
                                e.jsxs(U, {
                                  htmlFor: 'lang-both',
                                  className: 'cursor-pointer font-normal',
                                  children: [
                                    n('afterActions.pdf.both'),
                                    ' ',
                                    n('common.recommended'),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  c === 'verifying' &&
                    e.jsxs(P, {
                      children: [
                        e.jsx(Y, { className: 'size-4 animate-spin' }),
                        e.jsx(E, { children: n('afterActions.pdf.verifying') }),
                      ],
                    }),
                  c === 'generating' &&
                    e.jsxs(P, {
                      children: [
                        e.jsx(Y, { className: 'size-4 animate-spin' }),
                        e.jsxs(E, {
                          children: [
                            n('afterActions.pdf.generating'),
                            e.jsx('span', {
                              className: 'mt-1 block text-xs text-muted-foreground',
                              children: n('afterActions.pdf.estimatedTime'),
                            }),
                          ],
                        }),
                      ],
                    }),
                  c === 'completed' &&
                    w &&
                    e.jsxs(P, {
                      className: 'border-green-500',
                      children: [
                        e.jsx(Z, { className: 'size-4 text-green-500' }),
                        e.jsx(E, {
                          className: 'text-green-700',
                          children: e.jsxs('div', {
                            className: 'space-y-2',
                            children: [
                              e.jsx('p', { children: n('afterActions.pdf.completed') }),
                              e.jsx('p', {
                                className: 'text-xs text-muted-foreground',
                                children: i(),
                              }),
                            ],
                          }),
                        }),
                      ],
                    }),
                  c === 'failed' &&
                    e.jsxs(P, {
                      variant: 'destructive',
                      children: [e.jsx(J, { className: 'size-4' }), e.jsx(E, { children: I })],
                    }),
                  c === 'idle' &&
                    e.jsxs(P, {
                      children: [
                        e.jsx(J, { className: 'size-4' }),
                        e.jsx(E, { children: n('afterActions.pdf.info') }),
                      ],
                    }),
                ],
              }),
              e.jsx('div', {
                className: H('flex gap-2', s && 'flex-row-reverse'),
                children:
                  c === 'completed' && w
                    ? e.jsxs(e.Fragment, {
                        children: [
                          e.jsxs(f, {
                            onClick: y,
                            className: 'flex-1',
                            children: [
                              e.jsx(ze, { className: 'me-2 size-4' }),
                              n('afterActions.pdf.download'),
                            ],
                          }),
                          e.jsx(f, {
                            type: 'button',
                            variant: 'outline',
                            onClick: () => q(!1),
                            children: n('common.close'),
                          }),
                        ],
                      })
                    : e.jsxs(e.Fragment, {
                        children: [
                          e.jsx(f, {
                            onClick: R,
                            disabled: c === 'generating' || c === 'verifying',
                            className: 'flex-1',
                            children:
                              c === 'generating' || c === 'verifying'
                                ? e.jsxs(e.Fragment, {
                                    children: [
                                      e.jsx(Y, { className: 'me-2 size-4 animate-spin' }),
                                      n('afterActions.pdf.generating'),
                                    ],
                                  })
                                : e.jsxs(e.Fragment, {
                                    children: [
                                      e.jsx(te, { className: 'me-2 size-4' }),
                                      n('afterActions.pdf.generate'),
                                    ],
                                  }),
                          }),
                          e.jsx(f, {
                            type: 'button',
                            variant: 'outline',
                            onClick: () => q(!1),
                            disabled: c === 'generating' || c === 'verifying',
                            children: n('common.cancel'),
                          }),
                        ],
                      }),
              }),
            ],
          }),
        ],
      })
}
function He({ editRequest: o, onApprove: a, onReject: g, disabled: N = !1, className: n }) {
  const { t: r, i18n: s } = ne(),
    k = s.language === 'ar',
    [m, F] = l.useState(null),
    [D, c] = l.useState(''),
    [p, I] = l.useState(''),
    [x, w] = l.useState(!1),
    [z, C] = l.useState(null),
    [b, t] = l.useState(!0),
    d = Te.diff(o.current_content, o.proposed_changes) || [],
    L = async () => {
      ;(w(!0), C(null))
      try {
        await a(D || void 0)
      } catch (i) {
        C(i instanceof Error ? i.message : r('afterActions.editFlow.approveFailed'))
      } finally {
        w(!1)
      }
    },
    V = async () => {
      if (p.length < 10) {
        C(r('afterActions.editFlow.rejectionReasonTooShort'))
        return
      }
      if (p.length > 500) {
        C(r('afterActions.editFlow.rejectionReasonTooLong'))
        return
      }
      ;(w(!0), C(null))
      try {
        await g(p)
      } catch (i) {
        C(i instanceof Error ? i.message : r('afterActions.editFlow.rejectFailed'))
      } finally {
        w(!1)
      }
    },
    R = (i) => (i == null ? 'null' : typeof i == 'object' ? JSON.stringify(i, null, 2) : String(i)),
    G = (i) => {
      switch (i) {
        case 'N':
          return 'border-green-500 bg-green-50'
        case 'D':
          return 'border-red-500 bg-red-50'
        case 'E':
          return 'border-yellow-500 bg-yellow-50'
        case 'A':
          return 'border-blue-500 bg-blue-50'
        default:
          return ''
      }
    },
    y = (i) => {
      switch (i) {
        case 'N':
          return r('afterActions.editFlow.added')
        case 'D':
          return r('afterActions.editFlow.deleted')
        case 'E':
          return r('afterActions.editFlow.modified')
        case 'A':
          return r('afterActions.editFlow.arrayChange')
        default:
          return ''
      }
    },
    W = (i) => {
      switch (i) {
        case 'N':
          return 'default'
        case 'D':
          return 'destructive'
        case 'E':
          return 'secondary'
        case 'A':
          return 'outline'
        default:
          return 'outline'
      }
    },
    q = (i) => i.join(' � ')
  return e.jsxs('div', {
    className: H('space-y-6', n),
    dir: k ? 'rtl' : 'ltr',
    children: [
      e.jsxs(v, {
        children: [
          e.jsx(A, { children: e.jsx(S, { children: r('afterActions.editFlow.title') }) }),
          e.jsxs(_, {
            className: 'space-y-3',
            children: [
              e.jsxs('div', {
                children: [
                  e.jsx(U, { children: r('afterActions.editFlow.requestedBy') }),
                  e.jsxs('div', {
                    className: 'mt-1',
                    children: [
                      e.jsx('p', { className: 'font-medium', children: o.requested_by.name }),
                      e.jsx('p', {
                        className: 'text-sm text-muted-foreground',
                        children: o.requested_by.email,
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs('div', {
                children: [
                  e.jsx(U, { children: r('afterActions.editFlow.requestedAt') }),
                  e.jsx('p', { className: 'mt-1', children: B(new Date(o.requested_at), 'PPp') }),
                ],
              }),
              e.jsxs('div', {
                children: [
                  e.jsx(U, { children: r('afterActions.editFlow.reason') }),
                  e.jsx(v, {
                    className: 'mt-1 border-l-4 border-l-blue-500',
                    children: e.jsx(_, {
                      className: 'pt-4',
                      children: e.jsx('p', { className: 'text-sm', children: o.reason }),
                    }),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      e.jsxs(v, {
        children: [
          e.jsx(A, {
            children: e.jsxs('div', {
              className: 'flex items-center justify-between',
              children: [
                e.jsx(S, { children: r('afterActions.editFlow.proposedChanges') }),
                e.jsxs(f, {
                  variant: 'ghost',
                  size: 'sm',
                  onClick: () => t(!b),
                  children: [
                    e.jsx(Pe, { className: 'me-2 size-4' }),
                    r(b ? 'common.hide' : 'common.show'),
                  ],
                }),
              ],
            }),
          }),
          b &&
            e.jsx(_, {
              className: 'space-y-3',
              children:
                d.length === 0
                  ? e.jsxs(P, {
                      children: [
                        e.jsx(J, { className: 'size-4' }),
                        e.jsx(E, { children: r('afterActions.editFlow.noChanges') }),
                      ],
                    })
                  : d.map((i, u) =>
                      e.jsxs(
                        v,
                        {
                          className: H('border-l-4', G(i.kind)),
                          children: [
                            e.jsx(A, {
                              className: 'pb-3',
                              children: e.jsxs('div', {
                                className: 'flex items-center justify-between',
                                children: [
                                  e.jsx($, { variant: W(i.kind), children: y(i.kind) }),
                                  e.jsx('code', {
                                    className: 'text-xs text-muted-foreground',
                                    children: q(i.path),
                                  }),
                                ],
                              }),
                            }),
                            e.jsx(_, {
                              className: 'text-sm',
                              children: e.jsxs('div', {
                                className: 'grid grid-cols-1 gap-4 md:grid-cols-2',
                                children: [
                                  i.kind !== 'N' &&
                                    e.jsxs('div', {
                                      children: [
                                        e.jsxs('p', {
                                          className: 'mb-1 font-semibold text-red-600',
                                          children: [
                                            r('afterActions.editFlow.currentVersion'),
                                            ':',
                                          ],
                                        }),
                                        e.jsx('pre', {
                                          className:
                                            'overflow-x-auto rounded border border-red-200 bg-red-50 p-2 text-xs',
                                          children: R(i.lhs),
                                        }),
                                      ],
                                    }),
                                  i.kind !== 'D' &&
                                    e.jsxs('div', {
                                      children: [
                                        e.jsxs('p', {
                                          className: 'mb-1 font-semibold text-green-600',
                                          children: [
                                            r('afterActions.editFlow.proposedVersion'),
                                            ':',
                                          ],
                                        }),
                                        e.jsx('pre', {
                                          className:
                                            'overflow-x-auto rounded border border-green-200 bg-green-50 p-2 text-xs',
                                          children: R(i.rhs),
                                        }),
                                      ],
                                    }),
                                ],
                              }),
                            }),
                          ],
                        },
                        u,
                      ),
                    ),
            }),
        ],
      }),
      z &&
        e.jsxs(P, {
          variant: 'destructive',
          children: [e.jsx(J, { className: 'size-4' }), e.jsx(E, { children: z })],
        }),
      !m &&
        e.jsx(v, {
          children: e.jsx(_, {
            className: 'pt-6',
            children: e.jsxs('div', {
              className: H('flex gap-4', k && 'flex-row-reverse'),
              children: [
                e.jsxs(f, {
                  onClick: () => F('approve'),
                  disabled: N || x,
                  className: 'flex-1',
                  variant: 'default',
                  children: [
                    e.jsx(Z, { className: 'me-2 size-4' }),
                    r('afterActions.editFlow.approve'),
                  ],
                }),
                e.jsxs(f, {
                  onClick: () => F('reject'),
                  disabled: N || x,
                  className: 'flex-1',
                  variant: 'destructive',
                  children: [
                    e.jsx(me, { className: 'me-2 size-4' }),
                    r('afterActions.editFlow.reject'),
                  ],
                }),
              ],
            }),
          }),
        }),
      m === 'approve' &&
        e.jsxs(v, {
          className: 'border-green-500',
          children: [
            e.jsx(A, {
              children: e.jsx(S, {
                className: 'text-green-700',
                children: r('afterActions.editFlow.approveTitle'),
              }),
            }),
            e.jsxs(_, {
              className: 'space-y-4',
              children: [
                e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    e.jsxs(U, {
                      htmlFor: 'approval-notes',
                      children: [
                        r('afterActions.editFlow.approvalNotes'),
                        ' (',
                        r('common.optional'),
                        ')',
                      ],
                    }),
                    e.jsx(oe, {
                      id: 'approval-notes',
                      value: D,
                      onChange: (i) => c(i.target.value),
                      placeholder: r('afterActions.editFlow.approvalNotesPlaceholder'),
                      rows: 3,
                      disabled: x,
                      dir: k ? 'rtl' : 'ltr',
                    }),
                  ],
                }),
                e.jsxs(P, {
                  children: [
                    e.jsx(J, { className: 'size-4' }),
                    e.jsx(E, { children: r('afterActions.editFlow.approvalWarning') }),
                  ],
                }),
                e.jsxs('div', {
                  className: H('flex gap-2', k && 'flex-row-reverse'),
                  children: [
                    e.jsx(f, {
                      onClick: L,
                      disabled: x,
                      className: 'flex-1',
                      children: x
                        ? e.jsxs(e.Fragment, {
                            children: [
                              e.jsx(Y, { className: 'me-2 size-4 animate-spin' }),
                              r('afterActions.editFlow.approving'),
                            ],
                          })
                        : e.jsxs(e.Fragment, {
                            children: [
                              e.jsx(Z, { className: 'me-2 size-4' }),
                              r('afterActions.editFlow.confirmApprove'),
                            ],
                          }),
                    }),
                    e.jsx(f, {
                      variant: 'outline',
                      onClick: () => F(null),
                      disabled: x,
                      children: r('common.cancel'),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      m === 'reject' &&
        e.jsxs(v, {
          className: 'border-red-500',
          children: [
            e.jsx(A, {
              children: e.jsx(S, {
                className: 'text-red-700',
                children: r('afterActions.editFlow.rejectTitle'),
              }),
            }),
            e.jsxs(_, {
              className: 'space-y-4',
              children: [
                e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    e.jsxs(U, {
                      htmlFor: 'rejection-reason',
                      children: [r('afterActions.editFlow.rejectionReason'), ' *'],
                    }),
                    e.jsx(oe, {
                      id: 'rejection-reason',
                      value: p,
                      onChange: (i) => I(i.target.value),
                      placeholder: r('afterActions.editFlow.rejectionReasonPlaceholder'),
                      rows: 4,
                      maxLength: 500,
                      required: !0,
                      disabled: x,
                      dir: k ? 'rtl' : 'ltr',
                    }),
                    e.jsxs('p', {
                      className: 'text-xs text-muted-foreground',
                      children: [
                        p.length,
                        ' / 500 (',
                        r('afterActions.editFlow.minChars', { count: 10 }),
                        ')',
                      ],
                    }),
                  ],
                }),
                e.jsxs(P, {
                  variant: 'destructive',
                  children: [
                    e.jsx(J, { className: 'size-4' }),
                    e.jsx(E, { children: r('afterActions.editFlow.rejectionWarning') }),
                  ],
                }),
                e.jsxs('div', {
                  className: H('flex gap-2', k && 'flex-row-reverse'),
                  children: [
                    e.jsx(f, {
                      onClick: V,
                      disabled: x || p.length < 10,
                      variant: 'destructive',
                      className: 'flex-1',
                      children: x
                        ? e.jsxs(e.Fragment, {
                            children: [
                              e.jsx(Y, { className: 'me-2 size-4 animate-spin' }),
                              r('afterActions.editFlow.rejecting'),
                            ],
                          })
                        : e.jsxs(e.Fragment, {
                            children: [
                              e.jsx(me, { className: 'me-2 size-4' }),
                              r('afterActions.editFlow.confirmReject'),
                            ],
                          }),
                    }),
                    e.jsx(f, {
                      variant: 'outline',
                      onClick: () => F(null),
                      disabled: x,
                      children: r('common.cancel'),
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
function rs() {
  const { afterActionId: o } = _e.useParams(),
    { t: a, i18n: g } = ne(),
    N = g.language === 'ar',
    n = N ? qe : Me,
    { user: r } = Fe(),
    { data: s, isLoading: k, error: m } = we(o),
    F = Oe(),
    D = $e()
  if (k)
    return e.jsxs('div', {
      className: 'container mx-auto p-6 space-y-6',
      children: [e.jsx(de, { className: 'h-8 w-64' }), e.jsx(de, { className: 'h-screen w-full' })],
    })
  if (m)
    return e.jsx('div', {
      className: 'container mx-auto p-6',
      children: e.jsx(v, {
        className: 'border-destructive',
        children: e.jsxs(A, {
          children: [
            e.jsx(S, { className: 'text-destructive', children: a('common.error') }),
            e.jsx(Q, { children: a('afterActions.loadError') }),
          ],
        }),
      }),
    })
  if (!s)
    return e.jsx('div', {
      className: 'container mx-auto p-6',
      children: e.jsx(v, {
        children: e.jsxs(A, {
          children: [
            e.jsx(S, { children: a('afterActions.notFound') }),
            e.jsx(Q, { children: a('afterActions.notFoundDescription') }),
          ],
        }),
      }),
    })
  const c = ['supervisor', 'admin'].includes(r?.role || ''),
    p =
      s.publication_status === 'draft' ||
      (s.publication_status === 'published' && (r?.id === s.created_by || c)),
    I = s.publication_status === 'published',
    x = s.publication_status === 'edit_requested',
    w = async () => {
      try {
        ;(await F.mutateAsync({ afterActionId: o, isConfidential: s.is_confidential }),
          le.success(a('afterActions.publishSuccess')))
      } catch (t) {
        le.error(t.message || a('afterActions.publishFailed'))
      }
    },
    z = async () => {
      le.info(a('afterActions.editRequestFeature'))
    },
    b = {
      draft: { label: a('afterActions.status.draft'), variant: 'secondary' },
      published: { label: a('afterActions.status.published'), variant: 'default' },
      edit_requested: { label: a('afterActions.status.editRequested'), variant: 'warning' },
    }[s.publication_status] || { label: s.publication_status, variant: 'secondary' }
  return e.jsxs('div', {
    className: `container mx-auto p-6 space-y-6 ${N ? 'rtl' : 'ltr'}`,
    children: [
      e.jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          e.jsxs('div', {
            className: 'flex items-center gap-4',
            children: [
              e.jsx(f, {
                variant: 'ghost',
                size: 'icon',
                asChild: !0,
                children: e.jsx(ce, {
                  to: '/dossiers/$dossierId',
                  params: { dossierId: s.dossier_id },
                  children: e.jsx(Ee, { className: `h-4 w-4 ${N ? 'rotate-180' : ''}` }),
                }),
              }),
              e.jsxs('div', {
                children: [
                  e.jsx('h1', {
                    className: 'text-3xl font-bold',
                    children: a('afterActions.detail'),
                  }),
                  e.jsx('p', {
                    className: 'text-muted-foreground',
                    children: B(new Date(s.created_at), 'PPP', { locale: n }),
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              e.jsx($, { variant: b.variant, children: b.label }),
              s.is_confidential &&
                e.jsxs($, {
                  variant: 'destructive',
                  children: [
                    e.jsx(Re, { className: 'h-3 w-3 me-1' }),
                    a('afterActions.confidential'),
                  ],
                }),
            ],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'flex items-center gap-2 justify-end flex-wrap',
        children: [
          s.publication_status === 'draft' &&
            c &&
            e.jsxs(f, {
              onClick: w,
              disabled: F.isPending,
              children: [e.jsx(Z, { className: 'h-4 w-4 me-2' }), a('afterActions.publish')],
            }),
          I &&
            p &&
            e.jsxs(f, {
              variant: 'outline',
              onClick: z,
              disabled: D.isPending,
              children: [e.jsx(Ue, { className: 'h-4 w-4 me-2' }), a('afterActions.requestEdit')],
            }),
          e.jsx(f, {
            variant: 'outline',
            asChild: !0,
            children: e.jsxs(ce, {
              to: '/after-actions/$afterActionId/versions',
              params: { afterActionId: o },
              children: [
                e.jsx(Ie, { className: 'h-4 w-4 me-2' }),
                a('afterActions.versionHistory'),
              ],
            }),
          }),
          e.jsx(Ve, { afterActionId: o, isConfidential: s.is_confidential }),
        ],
      }),
      x && c && e.jsx(He, { afterActionId: o }),
      e.jsxs('div', {
        className: 'grid gap-6',
        children: [
          e.jsxs(v, {
            children: [
              e.jsx(A, {
                children: e.jsxs(S, {
                  className: 'flex items-center gap-2',
                  children: [e.jsx(Le, { className: 'h-5 w-5' }), a('afterActions.attendees')],
                }),
              }),
              e.jsx(_, {
                children: e.jsx('div', {
                  className: 'flex flex-wrap gap-2',
                  children:
                    s.attendees && s.attendees.length > 0
                      ? s.attendees.map((t, d) => e.jsx($, { variant: 'outline', children: t }, d))
                      : e.jsx('p', {
                          className: 'text-sm text-muted-foreground',
                          children: a('afterActions.noAttendees'),
                        }),
                }),
              }),
            ],
          }),
          s.decisions &&
            s.decisions.length > 0 &&
            e.jsxs(v, {
              children: [
                e.jsxs(A, {
                  children: [
                    e.jsx(S, { children: a('afterActions.decisions') }),
                    e.jsx(Q, {
                      children: a('afterActions.decisionsCount', { count: s.decisions.length }),
                    }),
                  ],
                }),
                e.jsx(_, {
                  className: 'space-y-4',
                  children: s.decisions.map((t, d) =>
                    e.jsxs(
                      'div',
                      {
                        className: 'space-y-2',
                        children: [
                          d > 0 && e.jsx(se, {}),
                          e.jsxs('div', {
                            className: 'pt-2',
                            children: [
                              e.jsx('p', { className: 'font-medium', children: t.description }),
                              t.rationale &&
                                e.jsxs('p', {
                                  className: 'text-sm text-muted-foreground mt-1',
                                  children: [a('afterActions.rationale'), ': ', t.rationale],
                                }),
                              e.jsxs('div', {
                                className:
                                  'flex items-center gap-4 mt-2 text-sm text-muted-foreground',
                                children: [
                                  e.jsxs('span', {
                                    children: [
                                      a('afterActions.decisionMaker'),
                                      ': ',
                                      t.decision_maker,
                                    ],
                                  }),
                                  e.jsx('span', {
                                    children: B(new Date(t.decision_date), 'PP', { locale: n }),
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      },
                      t.id,
                    ),
                  ),
                }),
              ],
            }),
          s.commitments &&
            s.commitments.length > 0 &&
            e.jsxs(v, {
              children: [
                e.jsxs(A, {
                  children: [
                    e.jsx(S, { children: a('afterActions.commitments') }),
                    e.jsx(Q, {
                      children: a('afterActions.commitmentsCount', { count: s.commitments.length }),
                    }),
                  ],
                }),
                e.jsx(_, {
                  className: 'space-y-4',
                  children: s.commitments.map((t, d) =>
                    e.jsxs(
                      'div',
                      {
                        className: 'space-y-2',
                        children: [
                          d > 0 && e.jsx(se, {}),
                          e.jsx('div', {
                            className: 'pt-2',
                            children: e.jsx('div', {
                              className: 'flex items-start justify-between gap-4',
                              children: e.jsxs('div', {
                                className: 'flex-1',
                                children: [
                                  e.jsx('p', { className: 'font-medium', children: t.description }),
                                  e.jsxs('div', {
                                    className:
                                      'flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap',
                                    children: [
                                      e.jsxs('span', {
                                        children: [
                                          a('afterActions.owner'),
                                          ': ',
                                          t.owner_type === 'internal'
                                            ? t.owner_user_id
                                            : t.owner_contact_id,
                                        ],
                                      }),
                                      e.jsxs('span', {
                                        children: [
                                          a('afterActions.dueDate'),
                                          ': ',
                                          B(new Date(t.due_date), 'PP', { locale: n }),
                                        ],
                                      }),
                                      e.jsx($, { variant: 'outline', children: t.priority }),
                                      e.jsx($, { children: t.status }),
                                    ],
                                  }),
                                ],
                              }),
                            }),
                          }),
                        ],
                      },
                      t.id,
                    ),
                  ),
                }),
              ],
            }),
          s.risks &&
            s.risks.length > 0 &&
            e.jsxs(v, {
              children: [
                e.jsxs(A, {
                  children: [
                    e.jsxs(S, {
                      className: 'flex items-center gap-2',
                      children: [e.jsx(J, { className: 'h-5 w-5' }), a('afterActions.risks')],
                    }),
                    e.jsx(Q, { children: a('afterActions.risksCount', { count: s.risks.length }) }),
                  ],
                }),
                e.jsx(_, {
                  className: 'space-y-4',
                  children: s.risks.map((t, d) =>
                    e.jsxs(
                      'div',
                      {
                        className: 'space-y-2',
                        children: [
                          d > 0 && e.jsx(se, {}),
                          e.jsxs('div', {
                            className: 'pt-2',
                            children: [
                              e.jsx('p', { className: 'font-medium', children: t.description }),
                              e.jsxs('div', {
                                className: 'flex items-center gap-2 mt-2 flex-wrap',
                                children: [
                                  e.jsxs($, {
                                    variant:
                                      t.severity === 'critical' || t.severity === 'high'
                                        ? 'destructive'
                                        : 'outline',
                                    children: [a('afterActions.severity'), ': ', t.severity],
                                  }),
                                  e.jsxs($, {
                                    variant: 'outline',
                                    children: [a('afterActions.likelihood'), ': ', t.likelihood],
                                  }),
                                ],
                              }),
                              t.mitigation_strategy &&
                                e.jsxs('p', {
                                  className: 'text-sm text-muted-foreground mt-2',
                                  children: [
                                    a('afterActions.mitigation'),
                                    ': ',
                                    t.mitigation_strategy,
                                  ],
                                }),
                            ],
                          }),
                        ],
                      },
                      t.id,
                    ),
                  ),
                }),
              ],
            }),
          s.follow_up_actions &&
            s.follow_up_actions.length > 0 &&
            e.jsxs(v, {
              children: [
                e.jsxs(A, {
                  children: [
                    e.jsx(S, { children: a('afterActions.followUps') }),
                    e.jsx(Q, {
                      children: a('afterActions.followUpsCount', {
                        count: s.follow_up_actions.length,
                      }),
                    }),
                  ],
                }),
                e.jsx(_, {
                  className: 'space-y-4',
                  children: s.follow_up_actions.map((t, d) =>
                    e.jsxs(
                      'div',
                      {
                        className: 'space-y-2',
                        children: [
                          d > 0 && e.jsx(se, {}),
                          e.jsx('div', {
                            className: 'pt-2',
                            children: e.jsxs('div', {
                              className: 'flex items-start gap-2',
                              children: [
                                t.completed
                                  ? e.jsx(Z, { className: 'h-5 w-5 text-green-600 mt-0.5' })
                                  : e.jsx('div', {
                                      className:
                                        'h-5 w-5 rounded-full border-2 border-muted-foreground mt-0.5',
                                    }),
                                e.jsxs('div', {
                                  className: 'flex-1',
                                  children: [
                                    e.jsx('p', {
                                      className: t.completed
                                        ? 'line-through text-muted-foreground'
                                        : '',
                                      children: t.description,
                                    }),
                                    t.assigned_to || t.target_date
                                      ? e.jsxs('div', {
                                          className:
                                            'flex items-center gap-4 mt-1 text-sm text-muted-foreground',
                                          children: [
                                            t.assigned_to &&
                                              e.jsx('span', { children: t.assigned_to }),
                                            t.target_date &&
                                              e.jsx('span', {
                                                children: B(new Date(t.target_date), 'PP', {
                                                  locale: n,
                                                }),
                                              }),
                                          ],
                                        })
                                      : null,
                                  ],
                                }),
                              ],
                            }),
                          }),
                        ],
                      },
                      t.id,
                    ),
                  ),
                }),
              ],
            }),
          s.notes &&
            e.jsxs(v, {
              children: [
                e.jsx(A, {
                  children: e.jsxs(S, {
                    className: 'flex items-center gap-2',
                    children: [e.jsx(te, { className: 'h-5 w-5' }), a('afterActions.notes')],
                  }),
                }),
                e.jsx(_, {
                  children: e.jsx('p', {
                    className: 'text-sm whitespace-pre-wrap',
                    children: s.notes,
                  }),
                }),
              ],
            }),
          e.jsxs(v, {
            children: [
              e.jsx(A, { children: e.jsx(S, { children: a('afterActions.metadata') }) }),
              e.jsxs(_, {
                className: 'space-y-2 text-sm',
                children: [
                  e.jsxs('div', {
                    className: 'flex items-center justify-between',
                    children: [
                      e.jsx('span', {
                        className: 'text-muted-foreground',
                        children: a('afterActions.createdAt'),
                      }),
                      e.jsx('span', { children: B(new Date(s.created_at), 'PPp', { locale: n }) }),
                    ],
                  }),
                  s.updated_at &&
                    e.jsxs('div', {
                      className: 'flex items-center justify-between',
                      children: [
                        e.jsx('span', {
                          className: 'text-muted-foreground',
                          children: a('afterActions.updatedAt'),
                        }),
                        e.jsx('span', {
                          children: B(new Date(s.updated_at), 'PPp', { locale: n }),
                        }),
                      ],
                    }),
                  s.published_at &&
                    e.jsxs('div', {
                      className: 'flex items-center justify-between',
                      children: [
                        e.jsx('span', {
                          className: 'text-muted-foreground',
                          children: a('afterActions.publishedAt'),
                        }),
                        e.jsx('span', {
                          children: B(new Date(s.published_at), 'PPp', { locale: n }),
                        }),
                      ],
                    }),
                  e.jsxs('div', {
                    className: 'flex items-center justify-between',
                    children: [
                      e.jsx('span', {
                        className: 'text-muted-foreground',
                        children: a('afterActions.version'),
                      }),
                      e.jsxs('span', { children: ['v', s.version] }),
                    ],
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
export { rs as component }
//# sourceMappingURL=_afterActionId-ME2G5_Vb.js.map
