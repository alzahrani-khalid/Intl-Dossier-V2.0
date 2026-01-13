import { u as R, r as l, j as s } from './react-vendor-Buoak6m3.js'
import { d as S } from './tanstack-vendor-BZC-rs5U.js'
import { B as p, j as x, l as u, I as E, k as C, o as T } from './index-qYY0KoZ1.js'
import {
  aH as M,
  bL as H,
  bU as b,
  aB as B,
  c2 as z,
  c3 as W,
  c4 as F,
  aT as L,
  bW as _,
} from './vendor-misc-BiJvMP0A.js'
import { H as K } from './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function V() {
  const { t } = R(),
    [c, h] = l.useState([]),
    [j, f] = l.useState(''),
    [w, g] = l.useState(!0),
    v = l.useRef(null),
    d = l.useRef([]),
    k = [
      {
        icon: s.jsx(M, { className: 'h-5 w-5' }),
        title: t('wordAssistant.prompts.briefTitle'),
        prompt: t('wordAssistant.prompts.briefPrompt'),
      },
      {
        icon: s.jsx(H, { className: 'h-5 w-5' }),
        title: t('wordAssistant.prompts.analysisTitle'),
        prompt: t('wordAssistant.prompts.analysisPrompt'),
      },
      {
        icon: s.jsx(M, { className: 'h-5 w-5' }),
        title: t('wordAssistant.prompts.summaryTitle'),
        prompt: t('wordAssistant.prompts.summaryPrompt'),
      },
      {
        icon: s.jsx(b, { className: 'h-5 w-5' }),
        title: t('wordAssistant.prompts.recommendationTitle'),
        prompt: t('wordAssistant.prompts.recommendationPrompt'),
      },
    ]
  l.useEffect(() => {
    d.current = c
  }, [c])
  const I = 'fallback'
  function U(e, a) {
    return {
      result: [
        '📝 *Draft Response*',
        `You asked: ${e}`,
        a
          ? `Context considered (${Math.min(a.length, 120)} chars shown): ${a.slice(-120)}`
          : 'No prior context provided.',
        'Suggested next steps:',
        '- Refine the prompt with specific objectives or data points.',
        '- Add any constraints such as audience, tone, or deadline.',
        '- When the AI service is available, re-run for a full draft.',
      ].join(`

`),
      model: 'local-fallback',
    }
  }
  const N = S({
      mutationFn: async ({ text: e, action: a = 'complete', targetLanguage: n }) => {
        const i = d.current
          .filter((r) => !r.isTyping)
          .map((r) => `${r.role.toUpperCase()}: ${r.content}`).join(`
`)
        return U(e, i)
      },
      onMutate: async ({ text: e }) => {
        const a = { id: crypto.randomUUID(), role: 'user', content: e, timestamp: new Date() },
          n = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isTyping: !0,
          }
        return (
          h((i) => {
            const r = [...i, a, n]
            return ((d.current = r), r)
          }),
          { typingMessageId: n.id }
        )
      },
      onSuccess: (e, a, n) => {
        ;(g(!0),
          h((i) => {
            const r = n
                ? i.filter((o) => o.id !== n.typingMessageId)
                : i.filter((o) => !o.isTyping),
              y = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: e.result || t('wordAssistant.fallbackContent'),
                timestamp: new Date(),
              },
              m = [...r, y]
            return ((d.current = m), m)
          }))
      },
      onError: (e, a, n) => {
        ;(g(!1),
          h((i) => {
            const r = n
                ? i.filter((o) => o.id !== n.typingMessageId)
                : i.filter((o) => !o.isTyping),
              y = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: t('wordAssistant.errorMessage'),
                timestamp: new Date(),
              },
              m = [...r, y]
            return ((d.current = m), m)
          }),
          console.error('Word assistant error:', e))
      },
    }),
    A = () => {
      j.trim() && (N.mutate({ text: j.trim(), action: 'complete' }), f(''))
    },
    P = (e) => {
      f(e)
    },
    D = (e) => {
      navigator.clipboard.writeText(e)
    },
    $ = () => {
      v.current?.scrollIntoView({ behavior: 'smooth' })
    }
  return (
    l.useEffect(() => {
      $()
    }, [c]),
    l.useEffect(() => {
      let e = !0
      return (
        (async () => {
          {
            e && g(!0)
            return
          }
        })(),
        () => {
          e = !1
        }
      )
    }, [I]),
    s.jsxs('div', {
      className: 'container mx-auto py-6 h-[calc(100vh-8rem)]',
      children: [
        s.jsxs('div', {
          className: 'flex justify-between items-center mb-6',
          children: [
            s.jsxs('div', {
              children: [
                s.jsx('h1', {
                  className: 'text-3xl font-bold',
                  children: t('navigation.wordAssistant'),
                }),
                s.jsx('p', {
                  className: 'text-muted-foreground mt-1',
                  children: t('wordAssistant.description'),
                }),
              ],
            }),
            s.jsxs('div', {
              className: 'flex items-center gap-2',
              children: [
                s.jsxs('div', {
                  className: `flex items-center gap-2 px-3 py-1 rounded-full text-sm ${w ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`,
                  children: [
                    s.jsx('div', {
                      className: `w-2 h-2 rounded-full ${w ? 'bg-green-600' : 'bg-red-600'}`,
                    }),
                    t(w ? 'wordAssistant.connected' : 'wordAssistant.disconnected'),
                  ],
                }),
                s.jsxs(p, {
                  variant: 'outline',
                  size: 'sm',
                  onClick: () => h([]),
                  children: [s.jsx(B, { className: 'h-4 w-4 me-2' }), t('wordAssistant.clearChat')],
                }),
              ],
            }),
          ],
        }),
        s.jsxs('div', {
          className: 'grid gap-6 md:grid-cols-4 h-[calc(100%-5rem)]',
          children: [
            s.jsx('div', {
              className: 'md:col-span-3',
              children: s.jsxs(x, {
                className: 'h-full flex flex-col',
                children: [
                  s.jsx(u, {
                    className: 'flex-1 overflow-y-auto p-6',
                    children:
                      c.length === 0
                        ? s.jsxs('div', {
                            className:
                              'flex flex-col items-center justify-center h-full text-center',
                            children: [
                              s.jsx(b, { className: 'h-16 w-16 text-muted-foreground mb-4' }),
                              s.jsx('h2', {
                                className: 'text-xl font-semibold mb-2',
                                children: t('wordAssistant.welcomeTitle'),
                              }),
                              s.jsx('p', {
                                className: 'text-muted-foreground max-w-md',
                                children: t('wordAssistant.welcomeMessage'),
                              }),
                              s.jsx('div', {
                                className: 'grid gap-3 mt-6 md:grid-cols-2 w-full max-w-2xl',
                                children: k.map((e, a) =>
                                  s.jsx(
                                    x,
                                    {
                                      className: 'cursor-pointer hover:shadow-md transition-shadow',
                                      onClick: () => P(e.prompt),
                                      children: s.jsx(u, {
                                        className: 'p-4',
                                        children: s.jsxs('div', {
                                          className: 'flex items-center gap-3',
                                          children: [
                                            s.jsx('div', {
                                              className: 'text-primary',
                                              children: e.icon,
                                            }),
                                            s.jsxs('div', {
                                              className: 'text-start',
                                              children: [
                                                s.jsx('p', {
                                                  className: 'font-medium text-sm',
                                                  children: e.title,
                                                }),
                                                s.jsx('p', {
                                                  className:
                                                    'text-xs text-muted-foreground line-clamp-2',
                                                  children: e.prompt,
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                      }),
                                    },
                                    a,
                                  ),
                                ),
                              }),
                            ],
                          })
                        : s.jsxs('div', {
                            className: 'space-y-4',
                            children: [
                              c.map((e) =>
                                s.jsxs(
                                  'div',
                                  {
                                    className: `flex gap-3 ${e.role === 'user' ? 'justify-end' : 'justify-start'}`,
                                    children: [
                                      e.role === 'assistant' &&
                                        s.jsx('div', {
                                          className:
                                            'w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center',
                                          children: s.jsx(b, { className: 'h-5 w-5 text-primary' }),
                                        }),
                                      s.jsx('div', {
                                        className: `max-w-[70%] ${e.role === 'user' ? 'order-1' : 'order-2'}`,
                                        children: s.jsx(x, {
                                          className: `${e.role === 'user' ? 'bg-primary text-primary-foreground' : ''}`,
                                          children: s.jsx(u, {
                                            className: 'p-4',
                                            children: e.isTyping
                                              ? s.jsxs('div', {
                                                  className: 'flex gap-1',
                                                  children: [
                                                    s.jsx('span', {
                                                      className:
                                                        'w-2 h-2 rounded-full bg-current animate-bounce',
                                                    }),
                                                    s.jsx('span', {
                                                      className:
                                                        'w-2 h-2 rounded-full bg-current animate-bounce delay-100',
                                                    }),
                                                    s.jsx('span', {
                                                      className:
                                                        'w-2 h-2 rounded-full bg-current animate-bounce delay-200',
                                                    }),
                                                  ],
                                                })
                                              : s.jsxs(s.Fragment, {
                                                  children: [
                                                    s.jsx('p', {
                                                      className: 'whitespace-pre-wrap',
                                                      children: e.content,
                                                    }),
                                                    s.jsxs('div', {
                                                      className:
                                                        'flex items-center gap-2 mt-3 pt-3 border-t border-current/10',
                                                      children: [
                                                        s.jsx('span', {
                                                          className: 'text-xs opacity-70',
                                                          children: K(e.timestamp, 'HH:mm'),
                                                        }),
                                                        e.role === 'assistant' &&
                                                          s.jsxs('div', {
                                                            className: 'flex gap-1 ms-auto',
                                                            children: [
                                                              s.jsx(p, {
                                                                size: 'sm',
                                                                variant: 'ghost',
                                                                className: 'h-6 w-6 p-0',
                                                                onClick: () => D(e.content),
                                                                children: s.jsx(z, {
                                                                  className: 'h-3 w-3',
                                                                }),
                                                              }),
                                                              s.jsx(p, {
                                                                size: 'sm',
                                                                variant: 'ghost',
                                                                className: 'h-6 w-6 p-0',
                                                                children: s.jsx(W, {
                                                                  className: 'h-3 w-3',
                                                                }),
                                                              }),
                                                              s.jsx(p, {
                                                                size: 'sm',
                                                                variant: 'ghost',
                                                                className: 'h-6 w-6 p-0',
                                                                children: s.jsx(F, {
                                                                  className: 'h-3 w-3',
                                                                }),
                                                              }),
                                                            ],
                                                          }),
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                          }),
                                        }),
                                      }),
                                      e.role === 'user' &&
                                        s.jsx('div', {
                                          className:
                                            'w-8 h-8 rounded-full bg-primary flex items-center justify-center order-2',
                                          children: s.jsx(L, {
                                            className: 'h-5 w-5 text-primary-foreground',
                                          }),
                                        }),
                                    ],
                                  },
                                  e.id,
                                ),
                              ),
                              s.jsx('div', { ref: v }),
                            ],
                          }),
                  }),
                  s.jsx('div', {
                    className: 'border-t p-4',
                    children: s.jsxs('div', {
                      className: 'flex gap-2',
                      children: [
                        s.jsx(E, {
                          placeholder: t('wordAssistant.inputPlaceholder'),
                          value: j,
                          onChange: (e) => f(e.target.value),
                          onKeyPress: (e) => e.key === 'Enter' && A(),
                          disabled: N.isPending,
                        }),
                        s.jsx(p, {
                          onClick: A,
                          disabled: !j.trim() || N.isPending,
                          children: s.jsx(_, { className: 'h-4 w-4' }),
                        }),
                      ],
                    }),
                  }),
                ],
              }),
            }),
            s.jsxs('div', {
              children: [
                s.jsxs(x, {
                  className: 'mb-4',
                  children: [
                    s.jsx(C, {
                      children: s.jsx(T, {
                        className: 'text-sm',
                        children: t('wordAssistant.capabilities'),
                      }),
                    }),
                    s.jsx(u, {
                      children: s.jsxs('ul', {
                        className: 'text-sm space-y-2 text-muted-foreground',
                        children: [
                          s.jsxs('li', { children: ['• ', t('wordAssistant.capability1')] }),
                          s.jsxs('li', { children: ['• ', t('wordAssistant.capability2')] }),
                          s.jsxs('li', { children: ['• ', t('wordAssistant.capability3')] }),
                          s.jsxs('li', { children: ['• ', t('wordAssistant.capability4')] }),
                          s.jsxs('li', { children: ['• ', t('wordAssistant.capability5')] }),
                          s.jsxs('li', { children: ['• ', t('wordAssistant.capability6')] }),
                        ],
                      }),
                    }),
                  ],
                }),
                s.jsxs(x, {
                  children: [
                    s.jsx(C, {
                      children: s.jsx(T, {
                        className: 'text-sm',
                        children: t('wordAssistant.tips'),
                      }),
                    }),
                    s.jsx(u, {
                      children: s.jsxs('ul', {
                        className: 'text-sm space-y-2 text-muted-foreground',
                        children: [
                          s.jsxs('li', { children: ['• ', t('wordAssistant.tip1')] }),
                          s.jsxs('li', { children: ['• ', t('wordAssistant.tip2')] }),
                          s.jsxs('li', { children: ['• ', t('wordAssistant.tip3')] }),
                          s.jsxs('li', { children: ['• ', t('wordAssistant.tip4')] }),
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
    })
  )
}
const ts = V
export { ts as component }
//# sourceMappingURL=word-assistant-rSzs7QuZ.js.map
