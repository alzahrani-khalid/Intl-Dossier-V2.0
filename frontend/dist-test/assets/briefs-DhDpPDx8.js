import { r as d, u as te, j as e } from './react-vendor-Buoak6m3.js'
import { c as ge, a as ae } from './tanstack-vendor-BZC-rs5U.js'
import {
  s as F,
  j as D,
  c as B,
  k as M,
  o as G,
  B as x,
  V as je,
  l as P,
  ae as be,
  a0 as H,
  af as J,
  al as Y,
  ag as Z,
  n as V,
  J as Q,
  m as ee,
  p as Ne,
  I as ye,
  A as re,
  E as ne,
  F as ie,
  G as le,
  H as ce,
  q as ve,
  r as we,
  t as Ee,
  v as _e,
  w as ke,
  ab as Ae,
} from './index-qYY0KoZ1.js'
import { D as Ce } from './DataTable-C-BIRk0G.js'
import {
  bL as $,
  aD as Re,
  aS as Te,
  bw as Se,
  aB as Ie,
  ds as oe,
  bp as de,
  bS as X,
  b5 as q,
  c2 as De,
  dt as Be,
  bP as fe,
  aH as W,
  bh as me,
  aI as ue,
  bV as K,
  b_ as Pe,
  bn as Oe,
  co as Le,
  b9 as Fe,
  aR as ze,
} from './vendor-misc-BiJvMP0A.js'
import { H as Ue } from './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
const xe = 'http://localhost:5001/api'
function Me() {
  const [s, t] = d.useState(null),
    [m, o] = d.useState(null)
  d.useEffect(() => {
    ;(async () => {
      const {
        data: { session: _ },
      } = await F.auth.getSession()
      t(_?.access_token || null)
    })()
    const {
      data: { subscription: R },
    } = F.auth.onAuthStateChange((_, r) => {
      t(r?.access_token || null)
    })
    return () => R.unsubscribe()
  }, [])
  const [A, n] = d.useState(''),
    [S, f] = d.useState(!1),
    [C, v] = d.useState(0),
    [I, w] = d.useState(null),
    c = d.useRef(null),
    g = d.useRef(null),
    u = d.useCallback(
      async (j) => {
        if (S) return
        const {
            data: { session: R },
          } = await F.auth.getSession(),
          _ = R?.access_token
        if (!_) {
          w('UNAUTHORIZED')
          return
        }
        ;((g.current = j),
          f(!0),
          w(null),
          n(''),
          v(0),
          o(null),
          (c.current = new AbortController()))
        try {
          const r = await fetch(`${xe}/ai/briefs/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'text/event-stream',
              Authorization: `Bearer ${_}`,
            },
            body: JSON.stringify({
              engagement_id: j.engagementId,
              dossier_id: j.dossierId,
              custom_prompt: j.customPrompt,
              language: j.language || 'en',
            }),
            signal: c.current.signal,
          })
          if (!r.ok) {
            const a = await r.json().catch(() => ({}))
            throw new Error(a.error || 'Failed to generate brief')
          }
          const i = r.body?.getReader()
          if (!i) throw new Error('No response body')
          const k = new TextDecoder()
          let b = '',
            N
          for (;;) {
            const { done: a, value: T } = await i.read()
            if (a) break
            const z = k.decode(T).split(`
`)
            for (const U of z)
              if (U.startsWith('data: '))
                try {
                  const E = JSON.parse(U.slice(6))
                  if (E.type === 'init' && E.briefId) ((N = E.briefId), v(10))
                  else if (E.type === 'content' && E.content)
                    ((b += E.content), n(b), v((y) => Math.min(90, y + 1)))
                  else if (E.type === 'done') {
                    if ((v(100), N))
                      try {
                        const y = await fetch(`${xe}/ai/briefs/${N}`, {
                          headers: { Authorization: `Bearer ${_}` },
                        })
                        if (y.ok) {
                          const pe = await y.json()
                          o(pe.data)
                        } else throw new Error('BRIEF_FETCH_FAILED')
                      } catch {
                        w('BRIEF_FETCH_FAILED')
                      }
                  } else {
                    if (E.type === 'error') throw new Error(E.code || 'GENERATION_FAILED')
                    E.type === 'timeout' && (w('TIMEOUT'), v(100))
                  }
                } catch {}
          }
        } catch (r) {
          if (r instanceof Error && r.name === 'AbortError') w('CANCELLED')
          else {
            const i = r instanceof Error ? r.message : 'UNKNOWN_ERROR'
            w(i)
          }
        } finally {
          ;(f(!1), (c.current = null))
        }
      },
      [S],
    ),
    l = d.useCallback(() => {
      ;(c.current && (c.current.abort(), (c.current = null)), f(!1))
    }, []),
    h = d.useCallback(() => {
      g.current && u(g.current)
    }, [u]),
    p = d.useCallback(() => {
      ;(o(null),
        n(''),
        v(0),
        w(null),
        (g.current = null),
        c.current && (c.current.abort(), (c.current = null)),
        f(!1))
    }, [])
  return {
    generate: u,
    brief: m,
    streamingContent: A,
    isGenerating: S,
    progress: C,
    error: I,
    cancel: l,
    retry: h,
    reset: p,
  }
}
function Ge(s) {
  if (typeof s == 'object' && s !== null) {
    const t = s
    if (t.code && typeof t.code == 'string')
      return {
        code: t.code,
        message: t.message || 'An error occurred',
        details: t.details,
        retryable: he(t.code),
        retryAfter: t.retryAfter,
      }
    if (t.name === 'TypeError' || t.message?.toString().includes('fetch'))
      return { code: 'NETWORK_ERROR', message: 'Network error', retryable: !0 }
  }
  if (s instanceof Error) {
    const t = $e(s.message)
    return { code: t, message: s.message, retryable: he(t) }
  }
  return { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred', retryable: !1 }
}
function $e(s) {
  const t = s.toLowerCase()
  return t.includes('rate limit') || t.includes('429')
    ? 'RATE_LIMIT_EXCEEDED'
    : t.includes('spend') || t.includes('cap')
      ? 'SPEND_CAP_REACHED'
      : t.includes('provider') || t.includes('unavailable')
        ? 'PROVIDER_UNAVAILABLE'
        : t.includes('model')
          ? 'MODEL_UNAVAILABLE'
          : t.includes('context') || t.includes('too long')
            ? 'CONTEXT_TOO_LONG'
            : t.includes('filter') || t.includes('content policy')
              ? 'CONTENT_FILTERED'
              : t.includes('timeout') || t.includes('timed out')
                ? 'TIMEOUT'
                : t.includes('unauthorized') || t.includes('401')
                  ? 'UNAUTHORIZED'
                  : t.includes('disabled') || t.includes('not enabled')
                    ? 'FEATURE_DISABLED'
                    : t.includes('network') || t.includes('fetch failed')
                      ? 'NETWORK_ERROR'
                      : t.includes('cancelled') || t.includes('canceled') || t.includes('abort')
                        ? 'CANCELLED'
                        : t.includes('brief_fetch') || t.includes('fetch brief')
                          ? 'BRIEF_FETCH_FAILED'
                          : 'UNKNOWN_ERROR'
}
function he(s) {
  return [
    'RATE_LIMIT_EXCEEDED',
    'PROVIDER_UNAVAILABLE',
    'TIMEOUT',
    'NETWORK_ERROR',
    'BRIEF_FETCH_FAILED',
  ].includes(s)
}
function He(s, t) {
  const m = {
    RATE_LIMIT_EXCEEDED: t(
      'ai.errors.rateLimitExceeded',
      'Too many requests. Please wait a moment and try again.',
    ),
    SPEND_CAP_REACHED: t(
      'ai.errors.spendCapReached',
      'AI usage limit reached. Please contact your administrator.',
    ),
    PROVIDER_UNAVAILABLE: t(
      'ai.errors.providerUnavailable',
      'AI service is temporarily unavailable. Please try again later.',
    ),
    MODEL_UNAVAILABLE: t(
      'ai.errors.modelUnavailable',
      'The AI model is not available. Please try a different request.',
    ),
    GENERATION_FAILED: t(
      'ai.errors.generationFailed',
      'Failed to generate content. Please try again.',
    ),
    CONTEXT_TOO_LONG: t(
      'ai.errors.contextTooLong',
      'The input is too long. Please shorten your request.',
    ),
    CONTENT_FILTERED: t(
      'ai.errors.contentFiltered',
      'The request was filtered due to content policy. Please revise your input.',
    ),
    TIMEOUT: t('ai.errors.timeout', 'The request timed out. Please try again.'),
    UNAUTHORIZED: t(
      'ai.errors.unauthorized',
      'You are not authorized to use this feature. Please log in again.',
    ),
    FEATURE_DISABLED: t(
      'ai.errors.featureDisabled',
      'This AI feature is currently disabled for your organization.',
    ),
    NETWORK_ERROR: t(
      'ai.errors.networkError',
      'Network error. Please check your connection and try again.',
    ),
    CANCELLED: t('ai.errors.cancelled', 'Generation was cancelled.'),
    BRIEF_FETCH_FAILED: t(
      'ai.errors.briefFetchFailed',
      'Brief was generated but could not be retrieved. Please try again.',
    ),
    UNKNOWN_ERROR: t('ai.errors.unknown', 'An unexpected error occurred. Please try again.'),
  }
  return m[s.code] || m.UNKNOWN_ERROR
}
function Ve(s, t) {
  return s.retryable
    ? s.retryAfter
      ? t('ai.errors.retryAfter', 'Try again in {{seconds}} seconds', { seconds: s.retryAfter })
      : t('ai.errors.retryNow', 'Click to retry')
    : s.code === 'SPEND_CAP_REACHED'
      ? t('ai.errors.contactAdmin', 'Contact your administrator to increase the limit')
      : s.code === 'UNAUTHORIZED'
        ? t('ai.errors.loginAgain', 'Please log in again')
        : s.code === 'CONTEXT_TOO_LONG'
          ? t('ai.errors.shortenInput', 'Try with a shorter input')
          : null
}
function Ke(s, t) {
  const m = Ge(s)
  return {
    title: t('ai.errors.title', 'AI Error'),
    message: He(m, t),
    action: Ve(m, t),
    retryable: m.retryable,
  }
}
function qe({ engagementId: s, dossierId: t, onBriefGenerated: m, onClose: o, className: A }) {
  const { t: n, i18n: S } = te('ai-brief'),
    f = S.language === 'ar',
    [C, v] = d.useState(''),
    [I, w] = d.useState(!1),
    [c, g] = d.useState('idle'),
    [u, l] = d.useState({ summary: '', background: '', recommendations: '' }),
    {
      generate: h,
      brief: p,
      streamingContent: j,
      isGenerating: R,
      progress: _,
      error: r,
      cancel: i,
      retry: k,
      reset: b,
    } = Me()
  d.useEffect(() => {
    r
      ? g('error')
      : p && p.status !== 'generating'
        ? g('success')
        : R
          ? _ < 10
            ? g('context')
            : g('generating')
          : !R && !p && !r && g('idle')
  }, [R, _, p, r])
  const N = r ? Ke(r, n) : null,
    a = async () => {
      const y = { engagementId: s, dossierId: t, customPrompt: C || void 0, language: S.language }
      await h(y)
    },
    T = () => {
      p?.id && m && m(p.id)
    },
    O = () => {
      ;(b(), g('idle'), v(''), w(!1), l({ summary: '', background: '', recommendations: '' }))
    },
    z = () => {
      ;(b(), g('manual'))
    },
    U = () => {
      console.log('Manual brief submitted:', u)
    },
    E = () => {
      switch (c) {
        case 'context':
          return n('phases.context', 'Gathering context...')
        case 'generating':
          return n('phases.generating', 'Generating brief...')
        case 'success':
          return n('phases.success', 'Complete')
        case 'error':
          return n('phases.error', 'Error')
        default:
          return ''
      }
    }
  return e.jsxs(D, {
    className: B('w-full', A),
    dir: f ? 'rtl' : 'ltr',
    children: [
      e.jsxs(M, {
        className: 'pb-3',
        children: [
          e.jsxs('div', {
            className: 'flex items-center justify-between',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-2',
                children: [
                  e.jsx($, { className: B('h-5 w-5 text-primary', f && 'rotate-180') }),
                  e.jsx(G, { className: 'text-lg', children: n('title', 'Generate AI Brief') }),
                ],
              }),
              R &&
                e.jsxs(x, {
                  variant: 'ghost',
                  size: 'sm',
                  onClick: i,
                  className: 'h-8',
                  children: [e.jsx(Re, { className: 'h-4 w-4 me-1' }), n('cancel', 'Cancel')],
                }),
            ],
          }),
          e.jsx(je, {
            children: n('description', 'Generate a comprehensive brief using AI analysis'),
          }),
        ],
      }),
      e.jsxs(P, {
        className: 'space-y-4',
        children: [
          (c === 'context' || c === 'generating' || c === 'success') &&
            e.jsxs('div', {
              className: 'space-y-3',
              children: [
                e.jsx('div', {
                  className: 'flex items-center justify-between',
                  children: e.jsxs('div', {
                    className: 'flex items-center gap-2 flex-1',
                    children: [
                      e.jsx(se, {
                        step: 1,
                        label: n('steps.context', 'Context'),
                        active: c === 'context',
                        complete: c === 'generating' || c === 'success',
                      }),
                      e.jsx('div', {
                        className: B(
                          'flex-1 h-0.5 mx-1',
                          c === 'generating' || c === 'success' ? 'bg-primary' : 'bg-muted',
                        ),
                      }),
                      e.jsx(se, {
                        step: 2,
                        label: n('steps.generating', 'Generate'),
                        active: c === 'generating',
                        complete: c === 'success',
                      }),
                      e.jsx('div', {
                        className: B(
                          'flex-1 h-0.5 mx-1',
                          c === 'success' ? 'bg-primary' : 'bg-muted',
                        ),
                      }),
                      e.jsx(se, {
                        step: 3,
                        label: n('steps.review', 'Review'),
                        active: c === 'success',
                        complete: !1,
                      }),
                    ],
                  }),
                }),
                R &&
                  e.jsxs('div', {
                    className: 'space-y-1',
                    children: [
                      e.jsxs('div', {
                        className: 'flex items-center justify-between text-sm',
                        children: [
                          e.jsxs('span', {
                            className: 'text-muted-foreground flex items-center gap-2',
                            children: [e.jsx(Te, { className: 'h-3 w-3 animate-spin' }), E()],
                          }),
                          e.jsxs('span', {
                            className: 'text-muted-foreground font-mono',
                            children: [Math.round(_), '%'],
                          }),
                        ],
                      }),
                      e.jsx(be, { value: _, className: 'h-2' }),
                    ],
                  }),
              ],
            }),
          R &&
            e.jsx('div', {
              className: 'bg-muted/50 rounded-lg p-4 max-h-64 overflow-y-auto border',
              children: j
                ? e.jsxs('pre', {
                    className: 'text-sm whitespace-pre-wrap font-sans leading-relaxed',
                    children: [
                      j,
                      e.jsx('span', {
                        className: 'inline-block w-2 h-4 bg-primary/60 animate-pulse ms-1',
                      }),
                    ],
                  })
                : e.jsxs('div', {
                    className: 'space-y-2',
                    children: [
                      e.jsx(H, { className: 'h-4 w-full' }),
                      e.jsx(H, { className: 'h-4 w-3/4' }),
                      e.jsx(H, { className: 'h-4 w-5/6' }),
                      e.jsx(H, { className: 'h-4 w-2/3' }),
                    ],
                  }),
            }),
          c === 'error' &&
            N &&
            e.jsxs(J, {
              variant: 'destructive',
              children: [
                e.jsx(Se, { className: 'h-4 w-4' }),
                e.jsx(Y, { children: N.title }),
                e.jsxs(Z, {
                  className: 'mt-2 space-y-3',
                  children: [
                    e.jsx('p', { children: N.message }),
                    N.action && e.jsx('p', { className: 'text-sm opacity-80', children: N.action }),
                    e.jsxs('div', {
                      className: 'flex flex-wrap items-center gap-2 mt-3',
                      children: [
                        N.retryable &&
                          e.jsxs(x, {
                            variant: 'outline',
                            size: 'sm',
                            onClick: k,
                            className: 'gap-1',
                            children: [e.jsx(Ie, { className: 'h-3 w-3' }), n('retry', 'Retry')],
                          }),
                        e.jsxs(x, {
                          variant: 'outline',
                          size: 'sm',
                          onClick: z,
                          className: 'gap-1',
                          children: [
                            e.jsx(oe, { className: 'h-3 w-3' }),
                            n('fallback.switchToManual', 'Enter Manually'),
                          ],
                        }),
                        e.jsxs(x, {
                          variant: 'ghost',
                          size: 'sm',
                          onClick: O,
                          className: 'gap-1',
                          children: [
                            e.jsx(de, { className: 'h-3 w-3' }),
                            n('startOver', 'Start over'),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          c === 'success' &&
            p &&
            e.jsxs(J, {
              className: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
              children: [
                e.jsx(X, { className: 'h-4 w-4 text-green-600' }),
                e.jsx(Y, {
                  className: 'text-green-800 dark:text-green-200',
                  children: n('success', 'Brief generated successfully!'),
                }),
                e.jsxs(Z, {
                  className: 'mt-3',
                  children: [
                    e.jsx('p', {
                      className: 'text-sm text-green-700 dark:text-green-300 mb-3',
                      children: p.title,
                    }),
                    e.jsxs('div', {
                      className: 'flex items-center gap-2',
                      children: [
                        e.jsxs(x, {
                          variant: 'default',
                          size: 'sm',
                          onClick: T,
                          className: 'gap-1',
                          children: [
                            e.jsx(q, { className: 'h-3 w-3' }),
                            n('viewBrief', 'Open Brief'),
                          ],
                        }),
                        e.jsxs(x, {
                          variant: 'outline',
                          size: 'sm',
                          onClick: O,
                          className: 'gap-1',
                          children: [
                            e.jsx($, { className: B('h-3 w-3', f && 'rotate-180') }),
                            n('generateAnother', 'Generate Another'),
                          ],
                        }),
                        o &&
                          e.jsx(x, {
                            variant: 'ghost',
                            size: 'sm',
                            onClick: o,
                            children: n('close', 'Close'),
                          }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          c === 'idle' &&
            e.jsxs(e.Fragment, {
              children: [
                e.jsxs('div', {
                  children: [
                    e.jsx(x, {
                      variant: 'ghost',
                      size: 'sm',
                      onClick: () => w(!I),
                      className: 'text-muted-foreground',
                      children: I
                        ? n('hideAdvanced', 'Hide options')
                        : n('showAdvanced', 'Show options'),
                    }),
                    I &&
                      e.jsxs('div', {
                        className: 'mt-2 space-y-2',
                        children: [
                          e.jsx('label', {
                            className: 'text-sm font-medium mb-1 block',
                            children: n('customPrompt', 'Custom instructions (optional)'),
                          }),
                          e.jsx(V, {
                            value: C,
                            onChange: (y) => v(y.target.value),
                            placeholder: n(
                              'customPromptPlaceholder',
                              'e.g., Focus on trade agreements and recent developments',
                            ),
                            className: 'resize-none',
                            rows: 3,
                            maxLength: 500,
                          }),
                          e.jsxs('p', {
                            className: 'text-xs text-muted-foreground text-end',
                            children: [C.length, '/500'],
                          }),
                        ],
                      }),
                  ],
                }),
                e.jsxs(x, {
                  onClick: a,
                  disabled: !s && !t,
                  className: 'w-full min-h-11',
                  children: [
                    e.jsx($, { className: B('h-4 w-4 me-2', f && 'rotate-180') }),
                    n('generate', 'Generate Brief'),
                  ],
                }),
              ],
            }),
          c === 'manual' &&
            e.jsxs('div', {
              className: 'space-y-4',
              children: [
                e.jsxs(J, {
                  className: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
                  children: [
                    e.jsx(oe, { className: 'h-4 w-4 text-amber-600' }),
                    e.jsx(Y, {
                      className: 'text-amber-800 dark:text-amber-200',
                      children: n('fallback.title', 'Manual Brief Entry'),
                    }),
                    e.jsx(Z, {
                      className: 'text-amber-700 dark:text-amber-300',
                      children: n(
                        'fallback.description',
                        'AI service is unavailable. You can enter the brief details manually.',
                      ),
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'space-y-4',
                  children: [
                    e.jsxs('div', {
                      className: 'space-y-2',
                      children: [
                        e.jsx(Q, {
                          htmlFor: 'manual-summary',
                          className: 'text-sm font-medium',
                          children: n('fallback.summary', 'Executive Summary'),
                        }),
                        e.jsx(V, {
                          id: 'manual-summary',
                          value: u.summary,
                          onChange: (y) => l({ ...u, summary: y.target.value }),
                          placeholder: n(
                            'fallback.summaryPlaceholder',
                            'Enter a brief executive summary...',
                          ),
                          className: 'resize-none min-h-[100px]',
                          rows: 4,
                          dir: f ? 'rtl' : 'ltr',
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'space-y-2',
                      children: [
                        e.jsx(Q, {
                          htmlFor: 'manual-background',
                          className: 'text-sm font-medium',
                          children: n('fallback.background', 'Background'),
                        }),
                        e.jsx(V, {
                          id: 'manual-background',
                          value: u.background,
                          onChange: (y) => l({ ...u, background: y.target.value }),
                          placeholder: n(
                            'fallback.backgroundPlaceholder',
                            'Enter background information...',
                          ),
                          className: 'resize-none min-h-[80px]',
                          rows: 3,
                          dir: f ? 'rtl' : 'ltr',
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'space-y-2',
                      children: [
                        e.jsx(Q, {
                          htmlFor: 'manual-recommendations',
                          className: 'text-sm font-medium',
                          children: n('fallback.recommendations', 'Recommendations'),
                        }),
                        e.jsx(V, {
                          id: 'manual-recommendations',
                          value: u.recommendations,
                          onChange: (y) => l({ ...u, recommendations: y.target.value }),
                          placeholder: n(
                            'fallback.recommendationsPlaceholder',
                            'Enter your recommendations...',
                          ),
                          className: 'resize-none min-h-[80px]',
                          rows: 3,
                          dir: f ? 'rtl' : 'ltr',
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'flex flex-col sm:flex-row gap-2',
                      children: [
                        e.jsxs(x, {
                          onClick: U,
                          disabled: !u.summary.trim(),
                          className: 'flex-1 min-h-11',
                          children: [
                            e.jsx(X, { className: 'h-4 w-4 me-2' }),
                            n('fallback.submit', 'Submit Brief'),
                          ],
                        }),
                        e.jsxs(x, {
                          variant: 'outline',
                          onClick: O,
                          className: 'min-h-11',
                          children: [
                            e.jsx(de, { className: 'h-3 w-3 me-2' }),
                            n('startOver', 'Start over'),
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
    ],
  })
}
function se({ step: s, label: t, active: m, complete: o }) {
  return e.jsxs('div', {
    className: 'flex flex-col items-center gap-1',
    children: [
      e.jsx('div', {
        className: B(
          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
          o
            ? 'bg-primary text-primary-foreground'
            : m
              ? 'bg-primary/20 text-primary border-2 border-primary'
              : 'bg-muted text-muted-foreground',
        ),
        children: o ? e.jsx(X, { className: 'h-3 w-3' }) : s,
      }),
      e.jsx('span', {
        className: B('text-xs', m || o ? 'text-foreground' : 'text-muted-foreground'),
        children: t,
      }),
    ],
  })
}
function We({ brief: s, onCitationClick: t, className: m }) {
  const { t: o, i18n: A } = te('ai-brief'),
    n = A.language === 'ar',
    S = s.keyParticipants ?? [],
    f = s.relevantPositions ?? [],
    C = s.activeCommitments ?? [],
    v = s.talkingPoints ?? [],
    I = s.citations ?? [],
    w = () => {
      window.print()
    },
    c = async () => {
      const l = `
${s.title || 'Untitled Brief'}

Executive Summary:
${s.executiveSummary || ''}

Background:
${s.background || ''}

Talking Points:
${v.map((h, p) => `${p + 1}. ${h}`).join(`
`)}

Recommendations:
${s.recommendations || ''}
    `.trim()
      await navigator.clipboard.writeText(l)
    },
    g = () => {
      const l = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' }),
        h = URL.createObjectURL(l),
        p = document.createElement('a')
      ;((p.href = h), (p.download = `brief-${s.id}.json`), p.click(), URL.revokeObjectURL(h))
    },
    u = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      generating: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    }
  return e.jsxs('div', {
    className: B('space-y-6', m),
    dir: n ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'flex items-start justify-between',
        children: [
          e.jsxs('div', {
            children: [
              e.jsx('h1', { className: 'text-2xl font-bold', children: s.title }),
              e.jsxs('div', {
                className: 'flex items-center gap-2 mt-2',
                children: [
                  e.jsx(ee, {
                    className: u[s.status],
                    children: o(`status.${s.status}`, s.status),
                  }),
                  e.jsxs('span', {
                    className: 'text-sm text-muted-foreground',
                    children: [I.length, ' ', o('citations', 'citations')],
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              e.jsxs(x, {
                variant: 'outline',
                size: 'sm',
                onClick: c,
                children: [e.jsx(De, { className: 'h-4 w-4 me-1' }), o('copy', 'Copy')],
              }),
              e.jsxs(x, {
                variant: 'outline',
                size: 'sm',
                onClick: w,
                children: [e.jsx(Be, { className: 'h-4 w-4 me-1' }), o('print', 'Print')],
              }),
              e.jsxs(x, {
                variant: 'outline',
                size: 'sm',
                onClick: g,
                children: [e.jsx(fe, { className: 'h-4 w-4 me-1' }), o('export', 'Export')],
              }),
            ],
          }),
        ],
      }),
      e.jsx(Ne, {
        className: 'h-[calc(100vh-200px)]',
        children: e.jsxs('div', {
          className: 'space-y-6 pe-4',
          children: [
            s.executiveSummary &&
              e.jsx(L, {
                icon: e.jsx(W, { className: 'h-5 w-5' }),
                title: o('sections.executiveSummary', 'Executive Summary'),
                children: e.jsx('p', {
                  className: 'text-muted-foreground whitespace-pre-wrap',
                  children: s.executiveSummary,
                }),
              }),
            s.background &&
              e.jsx(L, {
                icon: e.jsx(me, { className: 'h-5 w-5' }),
                title: o('sections.background', 'Background'),
                children: e.jsx('p', {
                  className: 'text-muted-foreground whitespace-pre-wrap',
                  children: s.background,
                }),
              }),
            S.length > 0 &&
              e.jsx(L, {
                icon: e.jsx(ue, { className: 'h-5 w-5' }),
                title: o('sections.keyParticipants', 'Key Participants'),
                children: e.jsx('div', {
                  className: 'space-y-3',
                  children: S.map((l, h) =>
                    e.jsxs(
                      'div',
                      {
                        className: 'flex items-start gap-3',
                        children: [
                          e.jsx('div', {
                            className:
                              'w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0',
                            children: e.jsx(ue, { className: 'h-4 w-4 text-primary' }),
                          }),
                          e.jsxs('div', {
                            children: [
                              e.jsx('p', { className: 'font-medium', children: l.name }),
                              e.jsx('p', {
                                className: 'text-sm text-muted-foreground',
                                children: l.role,
                              }),
                              e.jsx('p', {
                                className: 'text-sm text-muted-foreground',
                                children: l.relevance,
                              }),
                            ],
                          }),
                        ],
                      },
                      h,
                    ),
                  ),
                }),
              }),
            f.length > 0 &&
              e.jsx(L, {
                icon: e.jsx(Pe, { className: 'h-5 w-5' }),
                title: o('sections.positions', 'Relevant Positions'),
                children: e.jsx('div', {
                  className: 'space-y-3',
                  children: f.map((l, h) =>
                    e.jsx(
                      D,
                      {
                        className: 'bg-muted/30',
                        children: e.jsx(P, {
                          className: 'p-4',
                          children: e.jsxs('div', {
                            className: 'flex items-start justify-between',
                            children: [
                              e.jsxs('div', {
                                children: [
                                  e.jsx('p', { className: 'font-medium', children: l.title }),
                                  e.jsx('p', {
                                    className: 'text-sm text-muted-foreground',
                                    children: l.stance,
                                  }),
                                  e.jsxs('p', {
                                    className: 'text-xs text-muted-foreground mt-1',
                                    children: [o('source', 'Source'), ': ', l.source],
                                  }),
                                ],
                              }),
                              t &&
                                e.jsx(x, {
                                  variant: 'ghost',
                                  size: 'sm',
                                  onClick: () => t('position', l.sourceId),
                                  children: e.jsx(K, { className: 'h-4 w-4' }),
                                }),
                            ],
                          }),
                        }),
                      },
                      h,
                    ),
                  ),
                }),
              }),
            C.length > 0 &&
              e.jsx(L, {
                icon: e.jsx(X, { className: 'h-5 w-5' }),
                title: o('sections.commitments', 'Active Commitments'),
                children: e.jsx('div', {
                  className: 'space-y-3',
                  children: C.map((l, h) =>
                    e.jsx(
                      D,
                      {
                        className: 'bg-muted/30',
                        children: e.jsx(P, {
                          className: 'p-4',
                          children: e.jsxs('div', {
                            className: 'flex items-start justify-between',
                            children: [
                              e.jsxs('div', {
                                children: [
                                  e.jsx('p', { className: 'text-sm', children: l.description }),
                                  e.jsxs('div', {
                                    className: 'flex items-center gap-2 mt-2',
                                    children: [
                                      e.jsx(ee, { variant: 'outline', children: l.status }),
                                      l.deadline &&
                                        e.jsxs('span', {
                                          className: 'text-xs text-muted-foreground',
                                          children: [o('deadline', 'Deadline'), ': ', l.deadline],
                                        }),
                                    ],
                                  }),
                                ],
                              }),
                              t &&
                                e.jsx(x, {
                                  variant: 'ghost',
                                  size: 'sm',
                                  onClick: () => t('commitment', l.sourceId),
                                  children: e.jsx(K, { className: 'h-4 w-4' }),
                                }),
                            ],
                          }),
                        }),
                      },
                      h,
                    ),
                  ),
                }),
              }),
            s.historicalContext &&
              e.jsx(L, {
                icon: e.jsx(me, { className: 'h-5 w-5' }),
                title: o('sections.historicalContext', 'Historical Context'),
                children: e.jsx('p', {
                  className: 'text-muted-foreground whitespace-pre-wrap',
                  children: s.historicalContext,
                }),
              }),
            v.length > 0 &&
              e.jsx(L, {
                icon: e.jsx(Oe, { className: 'h-5 w-5' }),
                title: o('sections.talkingPoints', 'Talking Points'),
                children: e.jsx('ul', {
                  className: 'space-y-2',
                  children: v.map((l, h) =>
                    e.jsxs(
                      'li',
                      {
                        className: 'flex items-start gap-2',
                        children: [
                          e.jsx('span', {
                            className:
                              'w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-medium',
                            children: h + 1,
                          }),
                          e.jsx('span', { className: 'text-muted-foreground', children: l }),
                        ],
                      },
                      h,
                    ),
                  ),
                }),
              }),
            s.recommendations &&
              e.jsx(L, {
                icon: e.jsx(Le, { className: 'h-5 w-5' }),
                title: o('sections.recommendations', 'Recommendations'),
                children: e.jsx('p', {
                  className: 'text-muted-foreground whitespace-pre-wrap',
                  children: s.recommendations,
                }),
              }),
            I.length > 0 &&
              e.jsx(L, {
                icon: e.jsx(K, { className: 'h-5 w-5' }),
                title: o('sections.citations', 'Sources & Citations'),
                children: e.jsx('div', {
                  className: 'space-y-2',
                  children: I.map((l, h) =>
                    e.jsxs(
                      'div',
                      {
                        className:
                          'flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer',
                        onClick: () => t?.(l.type, l.id),
                        children: [
                          e.jsxs('div', {
                            className: 'flex items-center gap-2',
                            children: [
                              e.jsx(ee, {
                                variant: 'outline',
                                className: 'text-xs',
                                children: l.type,
                              }),
                              e.jsx('span', { className: 'text-sm', children: l.title }),
                            ],
                          }),
                          e.jsx(K, { className: 'h-4 w-4 text-muted-foreground' }),
                        ],
                      },
                      h,
                    ),
                  ),
                }),
              }),
          ],
        }),
      }),
    ],
  })
}
function L({ icon: s, title: t, children: m }) {
  return e.jsxs(D, {
    children: [
      e.jsx(M, {
        className: 'pb-3',
        children: e.jsxs(G, { className: 'flex items-center gap-2 text-lg', children: [s, t] }),
      }),
      e.jsx(P, { children: m }),
    ],
  })
}
function Xe() {
  const { t: s, i18n: t } = te(),
    [m, o] = d.useState(''),
    [A, n] = d.useState('all'),
    [S, f] = d.useState(!1),
    [C, v] = d.useState(''),
    [I, w] = d.useState(!1),
    [c, g] = d.useState(null),
    u = t.language === 'ar',
    { toast: l } = Ae(),
    h = ge(),
    { data: p } = ae({
      queryKey: ['dossiers-for-brief'],
      queryFn: async () => {
        const { data: r, error: i } = await F.from('dossiers')
          .select('id, name_en, name_ar')
          .eq('is_active', !0)
          .order('name_en')
          .limit(100)
        if (i) throw i
        return r || []
      },
    }),
    { data: j, isLoading: R } = ae({
      queryKey: ['briefs', m, A],
      queryFn: async () => {
        const [r, i] = await Promise.all([
          F.from('briefs').select('*').order('created_at', { ascending: !1 }),
          F.from('ai_briefs')
            .select('*')
            .eq('status', 'completed')
            .order('created_at', { ascending: !1 }),
        ])
        ;(r.error && console.error('Failed to load briefs', r.error),
          i.error && console.error('Failed to load AI briefs', i.error))
        const k =
            r.data?.map((a) => {
              const T = a.title_en ?? a.title ?? 'Untitled brief',
                O = a.summary_en ?? a.summary ?? '',
                z = a.status ?? (a.is_published ? 'published' : 'draft'),
                U = a.is_published ?? z === 'published',
                E = a.created_at ?? a.createdAt ?? new Date().toISOString(),
                y = a.published_date ?? a.published_at ?? (U ? E : null)
              return {
                id: a.id,
                reference_number: a.reference_number
                  ? String(a.reference_number)
                  : `BRF-${String(a.id ?? '')
                      .replace(/-/g, '')
                      .slice(0, 8)
                      .toUpperCase()}`,
                title_en: T,
                title_ar: a.title_ar ?? T,
                summary_en: O,
                summary_ar: a.summary_ar ?? O,
                category: a.category ?? 'other',
                tags: Array.isArray(a.tags) ? a.tags : [],
                is_published: !!U,
                published_date: y,
                created_at: E,
                author: { full_name: a.author?.full_name ?? a.author_name ?? a.created_by ?? '—' },
                related_country: null,
                related_organization: null,
                related_event: null,
                isAiBrief: !1,
              }
            }) ?? [],
          b =
            i.data?.map((a) => ({
              id: a.id,
              reference_number: `AI-${String(a.id).replace(/-/g, '').slice(0, 8).toUpperCase()}`,
              title_en: a.title ?? 'AI Generated Brief',
              title_ar: a.title ?? 'AI Generated Brief',
              summary_en: a.executive_summary?.slice(0, 200) ?? '',
              summary_ar: a.executive_summary?.slice(0, 200) ?? '',
              category: 'ai-generated',
              tags: ['AI'],
              is_published: a.status === 'completed',
              published_date: a.completed_at,
              created_at: a.created_at,
              author: { full_name: 'AI Assistant' },
              related_country: null,
              related_organization: null,
              related_event: null,
              isAiBrief: !0,
            })) ?? []
        return [...k, ...b]
          .sort((a, T) => new Date(T.created_at).getTime() - new Date(a.created_at).getTime())
          .filter((a) => {
            const T = A === 'all' ? !0 : A === 'published' ? a.is_published : !a.is_published,
              O = m
                ? [a.reference_number, a.title_en, a.title_ar, a.summary_en, a.summary_ar]
                    .filter(Boolean)
                    .some((z) => z.toLowerCase().includes(m.toLowerCase()))
                : !0
            return T && O
          })
      },
    }),
    _ = [
      {
        id: 'reference',
        accessorKey: 'reference_number',
        header: s('briefs.referenceNumber'),
        size: 110,
        cell: ({ row: r }) => {
          const i = r.original
          return e.jsxs('div', {
            className: 'flex flex-col gap-0.5',
            children: [
              e.jsx('span', { className: 'font-mono text-xs', children: i.reference_number }),
              i.isAiBrief &&
                e.jsxs('span', {
                  className:
                    'inline-flex items-center gap-0.5 w-fit px-1 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
                  children: [e.jsx($, { className: 'h-2.5 w-2.5' }), 'AI'],
                }),
            ],
          })
        },
      },
      {
        id: 'title',
        accessorKey: 'title_en',
        header: s('briefs.title'),
        size: 400,
        cell: ({ row: r }) => {
          const i = r.original
          return e.jsxs('div', {
            className: B('w-full min-w-0 overflow-hidden', u ? 'text-end' : 'text-start'),
            children: [
              e.jsx('div', {
                className: 'font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis',
                children: u ? i.title_ar : i.title_en,
              }),
              e.jsx('div', {
                className:
                  'text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis',
                children: u ? i.summary_ar : i.summary_en,
              }),
            ],
          })
        },
      },
      {
        id: 'status',
        accessorKey: 'is_published',
        header: s('briefs.status'),
        size: 100,
        cell: ({ row: r }) => {
          const i = r.original
          return e.jsx('div', {
            className: 'flex flex-col gap-0.5',
            children: i.is_published
              ? e.jsxs(e.Fragment, {
                  children: [
                    e.jsxs('span', {
                      className: 'inline-flex items-center gap-1 text-xs text-green-600',
                      children: [e.jsx(q, { className: 'h-3 w-3' }), s('briefs.published')],
                    }),
                    i.published_date &&
                      e.jsx('span', {
                        className: 'text-[10px] text-muted-foreground',
                        children: Ue(new Date(i.published_date), 'dd MMM yy'),
                      }),
                  ],
                })
              : e.jsxs('span', {
                  className: 'inline-flex items-center gap-1 text-xs text-muted-foreground',
                  children: [e.jsx(W, { className: 'h-3 w-3' }), s('briefs.draft')],
                }),
          })
        },
      },
      {
        id: 'actions',
        header: '',
        size: 70,
        cell: ({ row: r }) => {
          const i = r.original
          return e.jsxs('div', {
            className: 'flex items-center gap-0.5',
            children: [
              e.jsx(x, {
                size: 'icon',
                variant: 'ghost',
                className: 'h-7 w-7',
                onClick: async (k) => {
                  if ((k.stopPropagation(), i.isAiBrief))
                    try {
                      const {
                        data: { session: b },
                      } = await F.auth.getSession()
                      if (!b?.access_token) return
                      const a = await fetch(`http://localhost:5001/api/ai/briefs/${i.id}`, {
                        headers: { Authorization: `Bearer ${b.access_token}` },
                      })
                      if (a.ok) {
                        const T = await a.json()
                        ;(g(T.data), w(!0))
                      }
                    } catch (b) {
                      console.error('Failed to fetch brief:', b)
                    }
                },
                title: s('common.view'),
                children: e.jsx(q, { className: 'h-3.5 w-3.5' }),
              }),
              e.jsx(x, {
                size: 'icon',
                variant: 'ghost',
                className: 'h-7 w-7',
                onClick: (k) => {
                  k.stopPropagation()
                  const b = new Blob([JSON.stringify(i, null, 2)], { type: 'application/json' }),
                    N = URL.createObjectURL(b),
                    a = document.createElement('a')
                  ;((a.href = N),
                    (a.download = `brief-${i.reference_number}.json`),
                    a.click(),
                    URL.revokeObjectURL(N))
                },
                title: s('common.download'),
                children: e.jsx(fe, { className: 'h-3.5 w-3.5' }),
              }),
            ],
          })
        },
      },
    ]
  return e.jsxs('div', {
    className: 'container mx-auto py-6',
    children: [
      e.jsxs('div', {
        className: 'flex justify-between items-center mb-6',
        children: [
          e.jsx('h1', { className: 'text-3xl font-bold', children: s('navigation.briefs') }),
          e.jsxs(x, {
            onClick: () => f(!0),
            children: [e.jsx(Fe, { className: 'h-4 w-4 me-2' }), s('briefs.generateBrief')],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'grid gap-4 md:grid-cols-4 mb-6',
        children: [
          e.jsxs(D, {
            children: [
              e.jsxs(M, {
                className: 'flex flex-row items-center justify-between space-y-0 pb-2',
                children: [
                  e.jsx(G, { className: 'text-sm font-medium', children: s('briefs.totalBriefs') }),
                  e.jsx(W, { className: 'h-4 w-4 text-muted-foreground' }),
                ],
              }),
              e.jsx(P, {
                children: e.jsx('div', {
                  className: 'text-2xl font-bold',
                  children: j?.length || 0,
                }),
              }),
            ],
          }),
          e.jsxs(D, {
            children: [
              e.jsxs(M, {
                className: 'flex flex-row items-center justify-between space-y-0 pb-2',
                children: [
                  e.jsx(G, { className: 'text-sm font-medium', children: s('briefs.published') }),
                  e.jsx(q, { className: 'h-4 w-4 text-green-600' }),
                ],
              }),
              e.jsx(P, {
                children: e.jsx('div', {
                  className: 'text-2xl font-bold',
                  children: j?.filter((r) => r.is_published).length || 0,
                }),
              }),
            ],
          }),
          e.jsxs(D, {
            children: [
              e.jsxs(M, {
                className: 'flex flex-row items-center justify-between space-y-0 pb-2',
                children: [
                  e.jsx(G, { className: 'text-sm font-medium', children: s('briefs.drafts') }),
                  e.jsx(W, { className: 'h-4 w-4 text-gray-400' }),
                ],
              }),
              e.jsx(P, {
                children: e.jsx('div', {
                  className: 'text-2xl font-bold',
                  children: j?.filter((r) => !r.is_published).length || 0,
                }),
              }),
            ],
          }),
          e.jsxs(D, {
            children: [
              e.jsxs(M, {
                className: 'flex flex-row items-center justify-between space-y-0 pb-2',
                children: [
                  e.jsx(G, { className: 'text-sm font-medium', children: s('briefs.thisMonth') }),
                  e.jsx(ze, { className: 'h-4 w-4 text-muted-foreground' }),
                ],
              }),
              e.jsx(P, {
                children: e.jsx('div', {
                  className: 'text-2xl font-bold',
                  children:
                    j?.filter((r) => {
                      const i = new Date(r.published_date || r.created_at),
                        k = new Date()
                      return i.getMonth() === k.getMonth() && i.getFullYear() === k.getFullYear()
                    }).length || 0,
                }),
              }),
            ],
          }),
        ],
      }),
      e.jsxs(D, {
        className: 'mb-6',
        children: [
          e.jsx(M, { children: e.jsx(G, { children: s('common.filter') }) }),
          e.jsx(P, {
            children: e.jsxs('div', {
              className: 'space-y-4',
              children: [
                e.jsx(ye, {
                  placeholder: s('common.search'),
                  value: m,
                  onChange: (r) => o(r.target.value),
                  className: 'max-w-sm',
                }),
                e.jsxs('div', {
                  className: 'flex gap-2',
                  children: [
                    e.jsxs('span', {
                      className: 'text-sm text-muted-foreground mt-2',
                      children: [s('briefs.status'), ':'],
                    }),
                    e.jsx(x, {
                      variant: A === 'all' ? 'default' : 'outline',
                      size: 'sm',
                      onClick: () => n('all'),
                      children: s('common.all'),
                    }),
                    e.jsx(x, {
                      variant: A === 'published' ? 'default' : 'outline',
                      size: 'sm',
                      onClick: () => n('published'),
                      children: s('briefs.published'),
                    }),
                    e.jsx(x, {
                      variant: A === 'draft' ? 'default' : 'outline',
                      size: 'sm',
                      onClick: () => n('draft'),
                      children: s('briefs.draft'),
                    }),
                  ],
                }),
              ],
            }),
          }),
        ],
      }),
      e.jsx(D, {
        className: 'min-w-0 overflow-hidden',
        children: e.jsx(P, {
          className: 'p-0',
          children: R
            ? e.jsx('div', { className: 'p-8 text-center', children: s('common.loading') })
            : j && j.length > 0
              ? e.jsx(Ce, {
                  data: j,
                  columns: _,
                  enableFiltering: !1,
                  enableColumnVisibility: !1,
                  pageSize: 10,
                  onRowClick: (r) => {},
                })
              : e.jsx('div', {
                  className: 'p-8 text-center text-muted-foreground',
                  children: s('common.noData'),
                }),
        }),
      }),
      e.jsx(re, {
        open: S,
        onOpenChange: f,
        children: e.jsxs(ne, {
          className: 'sm:max-w-lg',
          dir: u ? 'rtl' : 'ltr',
          children: [
            e.jsxs(ie, {
              children: [
                e.jsxs(le, {
                  className: 'flex items-center gap-2',
                  children: [
                    e.jsx($, { className: `h-5 w-5 text-primary ${u ? 'rotate-180' : ''}` }),
                    s('briefs.generateBrief'),
                  ],
                }),
                e.jsx(ce, {
                  children: s(
                    'briefs.generateDescription',
                    'Select a dossier to generate an AI-powered brief.',
                  ),
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'space-y-2 py-2',
              children: [
                e.jsx('label', {
                  className: 'text-sm font-medium',
                  children: s('briefs.selectDossier', 'Select Dossier'),
                }),
                e.jsxs(ve, {
                  value: C,
                  onValueChange: v,
                  children: [
                    e.jsx(we, {
                      children: e.jsx(Ee, {
                        placeholder: s('briefs.chooseDossier', 'Choose a dossier...'),
                      }),
                    }),
                    e.jsx(_e, {
                      children: p?.map((r) =>
                        e.jsx(ke, { value: r.id, children: u ? r.name_ar : r.name_en }, r.id),
                      ),
                    }),
                  ],
                }),
              ],
            }),
            C &&
              e.jsx(qe, {
                dossierId: C,
                onBriefGenerated: async (r) => {
                  try {
                    const {
                      data: { session: i },
                    } = await F.auth.getSession()
                    if (!i?.access_token) return
                    const b = await fetch(`http://localhost:5001/api/ai/briefs/${r}`, {
                      headers: { Authorization: `Bearer ${i.access_token}` },
                    })
                    if (b.ok) {
                      const N = await b.json()
                      ;(g(N.data),
                        f(!1),
                        w(!0),
                        h.invalidateQueries({ queryKey: ['briefs'] }),
                        l({
                          title: s('briefs.generationComplete', 'Brief generated'),
                          description: s(
                            'briefs.generationCompleteDesc',
                            'Your brief is ready to view.',
                          ),
                        }))
                    }
                  } catch (i) {
                    console.error('Failed to fetch brief:', i)
                  }
                },
                onClose: () => {
                  ;(f(!1), v(''))
                },
                className: 'border-0 shadow-none p-0',
              }),
          ],
        }),
      }),
      e.jsx(re, {
        open: I,
        onOpenChange: w,
        children: e.jsxs(ne, {
          className: 'sm:max-w-4xl max-h-[90vh] overflow-hidden',
          dir: u ? 'rtl' : 'ltr',
          children: [
            e.jsxs(ie, {
              className: 'sr-only',
              children: [
                e.jsx(le, { children: s('briefs.viewBrief', 'View Brief') }),
                e.jsx(ce, {
                  children: s('briefs.viewBriefDescription', 'AI-generated brief content'),
                }),
              ],
            }),
            c &&
              e.jsx(We, {
                brief: c,
                onCitationClick: (r, i) => {
                  console.log('Citation clicked:', r, i)
                },
              }),
          ],
        }),
      }),
    ],
  })
}
const ls = Xe
export { ls as component }
//# sourceMappingURL=briefs-DhDpPDx8.js.map
