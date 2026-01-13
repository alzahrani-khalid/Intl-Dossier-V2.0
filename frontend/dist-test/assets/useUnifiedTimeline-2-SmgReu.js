import { u as E, r as f, j as e, v as Q } from './react-vendor-Buoak6m3.js'
import {
  c as r,
  m as k,
  B as v,
  af as ne,
  al as le,
  ag as re,
  I as ce,
  J as C,
  C as oe,
  a2 as z,
  q as L,
  r as U,
  t as V,
  v as q,
  w as N,
  ah as me,
  ai as de,
  aj as xe,
  ak as B,
  s as ue,
} from './index-qYY0KoZ1.js'
import { i as he, b as pe } from './tanstack-vendor-BZC-rs5U.js'
import { A as ge, b as je, a as fe } from './avatar-lQOCSoMx.js'
import { u as be } from './use-outside-click-DyRG7K6b.js'
import {
  by as W,
  bx as D,
  aR as T,
  bd as $,
  cj as G,
  bV as H,
  aI as M,
  aH as R,
  bP as Ne,
  bm as X,
  bw as ye,
  bi as ve,
  b_ as we,
  bC as _e,
  aS as ke,
  aE as Ce,
  aD as K,
  b8 as Se,
  aO as De,
  aN as Te,
  bp as Ee,
} from './vendor-misc-BiJvMP0A.js'
const Ie = (t) =>
    ({
      calendar: T,
      interaction: M,
      intelligence: X,
      document: R,
      mou: _e,
      position: we,
      relationship: M,
      commitment: ve,
      decision: ye,
    })[t] || T,
  Ae = (t) =>
    ({
      calendar: 'timeline-icon-calendar',
      interaction: 'timeline-icon-interaction',
      intelligence: 'timeline-icon-intelligence',
      document: 'timeline-icon-document',
      mou: 'timeline-icon-mou',
      position: 'timeline-icon-position',
      relationship: 'timeline-icon-relationship',
      commitment: 'timeline-icon-commitment',
      decision: 'timeline-icon-decision',
    })[t] || 'timeline-icon-calendar',
  Y = (t) => {
    const a = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    }
    return a[t] || a.low
  },
  J = (t) => {
    const a = {
      planned: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      ongoing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      postponed: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    }
    return a[t] || a.planned
  },
  Pe = (t, a) => {
    const n = new Date(t)
    return new Intl.DateTimeFormat(a === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(n)
  },
  Re = (t, a) => {
    const n = new Date(t)
    return new Intl.DateTimeFormat(a === 'ar' ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(n)
  }
function Me() {
  return e.jsxs(D.svg, {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0, transition: { duration: 0.05 } },
    xmlns: 'http://www.w3.org/2000/svg',
    width: '24',
    height: '24',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'h-4 w-4 text-black dark:text-white',
    children: [
      e.jsx('path', { stroke: 'none', d: 'M0 0h24v24H0z', fill: 'none' }),
      e.jsx('path', { d: 'M18 6l-12 12' }),
      e.jsx('path', { d: 'M6 6l12 12' }),
    ],
  })
}
function Fe({ event: t, index: a }) {
  const { t: n, i18n: o } = E('dossier'),
    g = he(),
    l = o.language === 'ar',
    [x, d] = f.useState(!1),
    s = f.useId(),
    w = f.useRef(null),
    c = Ie(t.event_type),
    b = Ae(t.event_type),
    u = l ? t.title_ar : t.title_en,
    h = l ? t.description_ar : t.description_en,
    _ = Pe(t.event_date, o.language),
    p = Re(t.event_date, o.language)
  ;(f.useEffect(() => {
    function m(S) {
      S.key === 'Escape' && d(!1)
    }
    return (
      x ? (document.body.style.overflow = 'hidden') : (document.body.style.overflow = 'auto'),
      window.addEventListener('keydown', m),
      () => window.removeEventListener('keydown', m)
    )
  }, [x]),
    be(w, () => d(!1)))
  const I = () => {
      t.metadata.navigation_url && (d(!1), g({ to: t.metadata.navigation_url }))
    },
    A = () => {
      d(!0)
    }
  return e.jsxs(e.Fragment, {
    children: [
      e.jsx(W, {
        children:
          x &&
          e.jsx(D.div, {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            className:
              'fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm h-full w-full z-[100]',
          }),
      }),
      e.jsx(W, {
        children:
          x &&
          e.jsxs('div', {
            className: 'fixed inset-0 grid place-items-center z-[101] p-4',
            dir: l ? 'rtl' : 'ltr',
            children: [
              e.jsx(
                D.button,
                {
                  layout: !0,
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  exit: { opacity: 0, transition: { duration: 0.05 } },
                  className:
                    'flex absolute top-4 end-4 items-center justify-center bg-white dark:bg-neutral-900 rounded-full h-10 w-10 shadow-lg z-[102] hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors',
                  onClick: () => d(!1),
                  'aria-label': n('common.close'),
                  children: e.jsx(Me, {}),
                },
                `button-${t.id}-${s}`,
              ),
              e.jsxs(D.div, {
                layoutId: `card-${t.id}-${s}`,
                ref: w,
                className:
                  'w-full max-w-3xl h-full md:h-fit md:max-h-[90%] flex flex-col bg-white dark:bg-neutral-900 sm:rounded-3xl overflow-hidden shadow-2xl',
                children: [
                  e.jsxs('div', {
                    className: r(
                      'w-full h-32 sm:h-40 flex items-center justify-center',
                      b,
                      'sm:rounded-t-3xl relative overflow-hidden',
                    ),
                    children: [
                      e.jsx('div', {
                        className:
                          'absolute inset-0 bg-gradient-to-br from-white/10 to-transparent',
                      }),
                      e.jsx(c, { className: 'h-16 w-16 sm:h-20 sm:w-20 text-white relative z-10' }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'flex-1 overflow-auto',
                    children: [
                      e.jsxs('div', {
                        className: 'p-4 sm:p-6 border-b border-border',
                        children: [
                          e.jsx(D.h3, {
                            layoutId: `title-${t.id}-${s}`,
                            className:
                              'font-bold text-neutral-700 dark:text-neutral-200 text-xl sm:text-2xl mb-3 text-start',
                            children: u,
                          }),
                          e.jsxs('div', {
                            className:
                              'flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4',
                            children: [
                              e.jsxs('div', {
                                className: 'flex items-center gap-2',
                                children: [
                                  e.jsx(T, { className: 'h-4 w-4' }),
                                  e.jsx('span', { className: 'font-medium', children: _ }),
                                ],
                              }),
                              e.jsxs('div', {
                                className: 'flex items-center gap-2',
                                children: [
                                  e.jsx($, { className: 'h-4 w-4' }),
                                  e.jsx('span', { children: p }),
                                ],
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            className: 'flex flex-wrap gap-2',
                            children: [
                              e.jsx(k, {
                                variant: 'outline',
                                className: r(Y(t.priority), 'text-xs'),
                                children: n(`timeline.priority.${t.priority}`),
                              }),
                              t.status &&
                                e.jsx(k, {
                                  variant: 'outline',
                                  className: r(J(t.status), 'text-xs'),
                                  children: n(`timeline.status.${t.status}`),
                                }),
                              t.metadata.badge_text_en &&
                                e.jsx(k, {
                                  variant: 'secondary',
                                  className: 'text-xs',
                                  children: l ? t.metadata.badge_text_ar : t.metadata.badge_text_en,
                                }),
                            ],
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'p-4 sm:p-6 space-y-6',
                        children: [
                          h &&
                            e.jsx(D.div, {
                              layout: !0,
                              initial: { opacity: 0 },
                              animate: { opacity: 1 },
                              exit: { opacity: 0 },
                              className:
                                'text-neutral-600 dark:text-neutral-400 text-sm sm:text-base text-start whitespace-pre-wrap leading-relaxed',
                              children: h,
                            }),
                          (t.metadata.location_en || t.metadata.location_ar) &&
                            e.jsxs('div', {
                              className: 'flex items-start gap-3 p-4 rounded-lg bg-muted',
                              children: [
                                e.jsx(G, {
                                  className: r('h-5 w-5 mt-0.5 text-primary', l && 'rotate-180'),
                                }),
                                e.jsxs('div', {
                                  className: 'flex-1 text-start',
                                  children: [
                                    e.jsx('p', {
                                      className: 'font-semibold text-sm mb-1',
                                      children: n('timeline.location'),
                                    }),
                                    e.jsx('p', {
                                      className: 'text-sm text-muted-foreground',
                                      children: l ? t.metadata.location_ar : t.metadata.location_en,
                                    }),
                                    t.metadata.is_virtual &&
                                      t.metadata.virtual_link &&
                                      e.jsxs('a', {
                                        href: t.metadata.virtual_link,
                                        target: '_blank',
                                        rel: 'noopener noreferrer',
                                        className:
                                          'text-primary hover:underline inline-flex items-center gap-1 text-sm mt-2 font-medium',
                                        children: [
                                          n('timeline.join_virtual'),
                                          e.jsx(H, { className: 'h-3.5 w-3.5' }),
                                        ],
                                      }),
                                  ],
                                }),
                              ],
                            }),
                          t.metadata.participants &&
                            t.metadata.participants.length > 0 &&
                            e.jsxs('div', {
                              className: 'space-y-3',
                              children: [
                                e.jsxs('p', {
                                  className:
                                    'text-sm font-semibold text-start flex items-center gap-2',
                                  children: [
                                    e.jsx(M, { className: 'h-4 w-4' }),
                                    n('timeline.participants'),
                                  ],
                                }),
                                e.jsxs('div', {
                                  className: 'flex flex-wrap gap-2',
                                  children: [
                                    t.metadata.participants.slice(0, 10).map((m) =>
                                      e.jsxs(
                                        'div',
                                        {
                                          className:
                                            'flex items-center gap-2 rounded-full bg-muted px-3 py-2 hover:bg-muted/80 transition-colors',
                                          children: [
                                            e.jsxs(ge, {
                                              className: 'h-7 w-7',
                                              children: [
                                                m.avatar_url && e.jsx(je, { src: m.avatar_url }),
                                                e.jsx(fe, {
                                                  className: 'text-xs',
                                                  children: (l ? m.name_ar : m.name_en)
                                                    .split(' ')
                                                    .map((S) => S[0])
                                                    .join('')
                                                    .toUpperCase()
                                                    .slice(0, 2),
                                                }),
                                              ],
                                            }),
                                            e.jsx('span', {
                                              className: 'text-xs sm:text-sm font-medium',
                                              children: l ? m.name_ar : m.name_en,
                                            }),
                                          ],
                                        },
                                        m.id,
                                      ),
                                    ),
                                    t.metadata.participants.length > 10 &&
                                      e.jsxs(k, {
                                        variant: 'secondary',
                                        className: 'rounded-full',
                                        children: [
                                          '+',
                                          t.metadata.participants.length - 10,
                                          ' ',
                                          n('timeline.more'),
                                        ],
                                      }),
                                  ],
                                }),
                              ],
                            }),
                          t.metadata.attachments &&
                            t.metadata.attachments.length > 0 &&
                            e.jsxs('div', {
                              className: 'space-y-3',
                              children: [
                                e.jsxs('p', {
                                  className:
                                    'text-sm font-semibold text-start flex items-center gap-2',
                                  children: [
                                    e.jsx(R, { className: 'h-4 w-4' }),
                                    n('timeline.attachments'),
                                  ],
                                }),
                                e.jsx('div', {
                                  className: 'space-y-2',
                                  children: t.metadata.attachments.map((m) =>
                                    e.jsxs(
                                      'a',
                                      {
                                        href: m.url,
                                        target: '_blank',
                                        rel: 'noopener noreferrer',
                                        className:
                                          'flex items-center gap-3 rounded-lg bg-muted px-4 py-3 text-sm hover:bg-muted/80 transition-colors group',
                                        children: [
                                          e.jsx(R, {
                                            className:
                                              'h-5 w-5 text-muted-foreground flex-shrink-0',
                                          }),
                                          e.jsx('span', {
                                            className: 'flex-1 text-start truncate font-medium',
                                            children: m.filename,
                                          }),
                                          e.jsx(Ne, {
                                            className:
                                              'h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0',
                                          }),
                                        ],
                                      },
                                      m.id,
                                    ),
                                  ),
                                }),
                              ],
                            }),
                          t.event_type === 'intelligence' &&
                            t.metadata.confidence_score &&
                            e.jsxs('div', {
                              className: 'flex items-center gap-3 p-4 rounded-lg bg-muted',
                              children: [
                                e.jsx(X, { className: 'h-5 w-5 text-primary' }),
                                e.jsxs('span', {
                                  className: 'text-sm font-medium',
                                  children: [n('timeline.confidence'), ':'],
                                }),
                                e.jsxs(k, {
                                  variant: 'outline',
                                  className: 'font-semibold',
                                  children: [Math.round(t.metadata.confidence_score * 100), '%'],
                                }),
                              ],
                            }),
                        ],
                      }),
                      t.metadata.navigation_url &&
                        e.jsx('div', {
                          className: 'p-4 sm:p-6 border-t border-border bg-muted/30',
                          children: e.jsxs(v, {
                            onClick: I,
                            className: 'w-full min-h-11 sm:min-h-10',
                            size: 'lg',
                            children: [
                              n('timeline.view_details'),
                              e.jsx(H, { className: r('h-4 w-4', l ? 'me-2' : 'ms-2') }),
                            ],
                          }),
                        }),
                    ],
                  }),
                ],
              }),
            ],
          }),
      }),
      e.jsx(Q.VerticalTimelineElement, {
        className: r(
          'vertical-timeline-element',
          t.priority === 'high' && 'timeline-priority-high',
        ),
        contentStyle: { cursor: 'pointer' },
        contentArrowStyle: { borderRight: '7px solid hsl(var(--border))' },
        date: _,
        iconStyle: { cursor: 'pointer' },
        icon: e.jsx(c, { className: 'h-5 w-5 sm:h-6 sm:w-6' }),
        iconClassName: b,
        onTimelineElementClick: A,
        children: e.jsxs('div', {
          className: 'space-y-3',
          dir: l ? 'rtl' : 'ltr',
          children: [
            e.jsxs('div', {
              className: 'xl:hidden mb-3 pb-3 border-b border-border',
              children: [
                e.jsxs('div', {
                  className: 'flex items-center gap-2 text-primary',
                  children: [
                    e.jsx(T, { className: 'h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0' }),
                    e.jsx('span', { className: 'text-base sm:text-lg font-bold', children: _ }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'flex items-center gap-2 text-muted-foreground mt-1 ms-6 sm:ms-7',
                  children: [
                    e.jsx($, { className: 'h-3.5 w-3.5 sm:h-4 sm:w-4' }),
                    e.jsx('span', { className: 'text-sm sm:text-base', children: p }),
                  ],
                }),
              ],
            }),
            e.jsx('div', {
              className: 'flex items-start justify-between gap-3',
              children: e.jsx('h3', {
                className: 'vertical-timeline-element-title text-start flex-1',
                children: u,
              }),
            }),
            e.jsxs('h4', {
              className:
                'hidden xl:flex vertical-timeline-element-subtitle text-start items-center gap-2',
              children: [e.jsx($, { className: 'h-3.5 w-3.5' }), p],
            }),
            h && e.jsx('p', { className: 'text-start line-clamp-2', children: h }),
            e.jsxs('div', {
              className: 'flex flex-wrap gap-2 pt-1',
              children: [
                e.jsx(k, {
                  variant: 'outline',
                  className: r(Y(t.priority), 'text-xs'),
                  children: n(`timeline.priority.${t.priority}`),
                }),
                t.status &&
                  e.jsx(k, {
                    variant: 'outline',
                    className: r(J(t.status), 'text-xs'),
                    children: n(`timeline.status.${t.status}`),
                  }),
              ],
            }),
            e.jsxs('div', {
              className: 'flex items-center gap-3 text-xs text-muted-foreground pt-1',
              children: [
                t.metadata.participants &&
                  t.metadata.participants.length > 0 &&
                  e.jsxs('span', {
                    className: 'flex items-center gap-1',
                    children: [
                      e.jsx(M, { className: 'h-3.5 w-3.5' }),
                      t.metadata.participants.length,
                    ],
                  }),
                t.metadata.attachments &&
                  t.metadata.attachments.length > 0 &&
                  e.jsxs('span', {
                    className: 'flex items-center gap-1',
                    children: [
                      e.jsx(R, { className: 'h-3.5 w-3.5' }),
                      t.metadata.attachments.length,
                    ],
                  }),
                (t.metadata.location_en || t.metadata.location_ar) &&
                  e.jsxs('span', {
                    className: 'flex items-center gap-1',
                    children: [
                      e.jsx(G, { className: r('h-3.5 w-3.5', l && 'rotate-180') }),
                      t.metadata.is_virtual ? n('timeline.virtual') : n('timeline.in_person'),
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
function ze({ count: t = 3 }) {
  return e.jsx('div', {
    className: 'space-y-8 sm:space-y-12 py-8 sm:py-12',
    children: Array.from({ length: t }).map((a, n) =>
      e.jsxs(
        'div',
        {
          className: 'relative flex items-start gap-4 sm:gap-6 animate-pulse',
          children: [
            e.jsx('div', {
              className: 'flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-muted',
            }),
            e.jsxs('div', {
              className: 'flex-1 space-y-3',
              children: [
                e.jsx('div', { className: 'h-5 sm:h-6 bg-muted rounded-md w-3/4' }),
                e.jsx('div', { className: 'h-4 bg-muted rounded-md w-1/2' }),
                e.jsx('div', { className: 'h-20 sm:h-24 bg-muted rounded-lg' }),
                e.jsxs('div', {
                  className: 'flex gap-2',
                  children: [
                    e.jsx('div', { className: 'h-6 w-16 bg-muted rounded-full' }),
                    e.jsx('div', { className: 'h-6 w-20 bg-muted rounded-full' }),
                  ],
                }),
              ],
            }),
          ],
        },
        n,
      ),
    ),
  })
}
function $e({ message: t }) {
  const { t: a } = E('dossier')
  return e.jsxs('div', {
    className: 'flex flex-col items-center justify-center py-16 sm:py-20 lg:py-24 text-center px-4',
    children: [
      e.jsx('div', {
        className: 'rounded-full bg-muted p-8 sm:p-10 lg:p-12 mb-6 sm:mb-8',
        children: e.jsx(T, {
          className: 'h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-muted-foreground',
        }),
      }),
      e.jsx('h3', {
        className: 'text-xl sm:text-2xl lg:text-3xl font-semibold mb-3',
        children: a('timeline.empty.title'),
      }),
      e.jsx('p', {
        className: 'text-sm sm:text-base text-muted-foreground max-w-md',
        children: t || a('timeline.empty.description'),
      }),
    ],
  })
}
function Oe({ error: t }) {
  const { t: a } = E('dossier')
  return e.jsxs(ne, {
    variant: 'destructive',
    className: 'mb-6 mx-4',
    children: [
      e.jsx(le, { children: a('timeline.error.title') }),
      e.jsx(re, {
        className: 'text-start',
        children: t.message || a('timeline.error.description'),
      }),
    ],
  })
}
function He({
  events: t,
  isLoading: a = !1,
  isFetchingNextPage: n = !1,
  hasNextPage: o = !1,
  onLoadMore: g,
  error: l,
  emptyMessage: x,
  className: d,
}) {
  const { t: s, i18n: w } = E('dossier'),
    c = w.language === 'ar',
    b = f.useRef(null)
  return (
    f.useEffect(() => {
      if (!b.current || !o || n) return
      const u = new IntersectionObserver(
        (h) => {
          h[0].isIntersecting && g && g()
        },
        { threshold: 0.1, rootMargin: '100px' },
      )
      return (u.observe(b.current), () => u.disconnect())
    }, [o, n, g]),
    a
      ? e.jsx('div', {
          className: r('w-full', d),
          dir: c ? 'rtl' : 'ltr',
          children: e.jsx(ze, { count: 5 }),
        })
      : l
        ? e.jsx('div', {
            className: r('w-full', d),
            dir: c ? 'rtl' : 'ltr',
            children: e.jsx(Oe, { error: l }),
          })
        : t.length === 0
          ? e.jsx('div', {
              className: r('w-full', d),
              dir: c ? 'rtl' : 'ltr',
              children: e.jsx($e, { message: x || '' }),
            })
          : e.jsx('div', {
              className: r('w-full bg-background font-sans', d),
              dir: c ? 'rtl' : 'ltr',
              children: e.jsxs('div', {
                className: 'max-w-7xl mx-auto',
                children: [
                  e.jsx(Q.VerticalTimeline, {
                    animate: !0,
                    layout: '2-columns',
                    lineColor:
                      (typeof window < 'u' &&
                        document.documentElement.getAttribute('data-color-mode') === 'dark',
                      'hsl(var(--border))'),
                    children: t.map((u, h) => e.jsx(Fe, { event: u, index: h }, u.id)),
                  }),
                  o &&
                    e.jsx('div', {
                      ref: b,
                      className: 'flex justify-center py-8 sm:py-10 lg:py-12 px-4',
                      children: n
                        ? e.jsxs('div', {
                            className:
                              'flex items-center gap-3 text-sm sm:text-base text-muted-foreground',
                            children: [
                              e.jsx(ke, { className: 'h-5 w-5 sm:h-6 sm:w-6 animate-spin' }),
                              e.jsx('span', { children: s('timeline.loading_more') }),
                            ],
                          })
                        : e.jsx(v, {
                            variant: 'outline',
                            onClick: g,
                            className: 'min-h-11 sm:min-h-10 px-6 sm:px-8',
                            size: 'lg',
                            children: s('timeline.load_more'),
                          }),
                    }),
                  !o &&
                    t.length > 0 &&
                    e.jsx('div', {
                      className: 'flex justify-center py-8 sm:py-10 lg:py-12 px-4',
                      children: e.jsxs('div', {
                        className: 'flex flex-col items-center gap-2 text-center',
                        children: [
                          e.jsx('div', { className: 'h-px w-24 bg-border' }),
                          e.jsx('p', {
                            className: 'text-xs sm:text-sm text-muted-foreground font-medium',
                            children: s('timeline.end'),
                          }),
                          e.jsx('div', { className: 'h-px w-24 bg-border' }),
                        ],
                      }),
                    }),
                ],
              }),
            })
  )
}
function Ke({
  filters: t,
  onFiltersChange: a,
  availableEventTypes: n,
  defaultEventTypes: o,
  showFilters: g,
  onToggleFilters: l,
  onRefresh: x,
  className: d,
}) {
  const { t: s, i18n: w } = E('dossier'),
    c = w.language === 'ar',
    [b, u] = f.useState(t.search_query || ''),
    [h, _] = f.useState('all_time'),
    [p, I] = f.useState(),
    [A, m] = f.useState(),
    S = {
      calendar: { en: 'Calendar Events', ar: 'أحداث التقويم' },
      interaction: { en: 'Interactions', ar: 'التفاعلات' },
      intelligence: { en: 'Intelligence Reports', ar: 'تقارير استخبارية' },
      document: { en: 'Documents', ar: 'المستندات' },
      mou: { en: 'MoUs', ar: 'مذكرات التفاهم' },
      position: { en: 'Positions', ar: 'المناصب' },
      relationship: { en: 'Relationships', ar: 'العلاقات' },
      commitment: { en: 'Commitments', ar: 'الالتزامات' },
      decision: { en: 'Decisions', ar: 'القرارات' },
    },
    Z = (i) => {
      const j = t.event_types || o,
        y = j.includes(i) ? j.filter((P) => P !== i) : [...j, i]
      a({ ...t, event_types: y.length > 0 ? y : o })
    },
    ee = (i) => {
      a({ ...t, priority: i === 'all' ? void 0 : [i] })
    },
    te = (i) => {
      a({ ...t, status: i === 'all' ? void 0 : [i] })
    },
    ae = (i) => {
      _(i)
      const j = new Date()
      let y, P
      switch (i) {
        case 'last_7_days':
          y = new Date(j.setDate(j.getDate() - 7)).toISOString()
          break
        case 'last_30_days':
          y = new Date(j.setDate(j.getDate() - 30)).toISOString()
          break
        case 'last_90_days':
          y = new Date(j.setDate(j.getDate() - 90)).toISOString()
          break
        case 'last_year':
          y = new Date(j.setFullYear(j.getFullYear() - 1)).toISOString()
          break
        case 'all_time':
          ;((y = void 0), (P = void 0))
          break
      }
      i !== 'custom' && a({ ...t, date_from: y, date_to: P })
    },
    se = () => {
      a({ ...t, date_from: p?.toISOString(), date_to: A?.toISOString() })
    },
    O = (i) => {
      ;(u(i), a({ ...t, search_query: i || void 0 }))
    },
    ie = () => {
      ;(u(''), _('all_time'), I(void 0), m(void 0), a({ event_types: o }))
    },
    F =
      (t.event_types && t.event_types.length !== o.length ? 1 : 0) +
      (t.priority ? 1 : 0) +
      (t.status ? 1 : 0) +
      (t.date_from || t.date_to ? 1 : 0) +
      (t.search_query ? 1 : 0)
  return e.jsxs('div', {
    className: r('space-y-4 mb-6', d),
    dir: c ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'flex flex-col sm:flex-row gap-2 sm:gap-4',
        children: [
          e.jsxs('div', {
            className: 'relative flex-1',
            children: [
              e.jsx(Ce, {
                className: r(
                  'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
                  c ? 'end-3' : 'start-3',
                ),
              }),
              e.jsx(ce, {
                type: 'text',
                placeholder: s('timeline.search_placeholder'),
                value: b,
                onChange: (i) => O(i.target.value),
                className: r('min-h-11 sm:min-h-10', c ? 'pe-9' : 'ps-9'),
              }),
              b &&
                e.jsx(v, {
                  variant: 'ghost',
                  size: 'sm',
                  onClick: () => O(''),
                  className: r(
                    'absolute top-1/2 -translate-y-1/2 h-7 w-7 p-0',
                    c ? 'start-1' : 'end-1',
                  ),
                  children: e.jsx(K, { className: 'h-4 w-4' }),
                }),
            ],
          }),
          e.jsxs(v, {
            variant: 'outline',
            onClick: l,
            className: 'min-h-11 sm:min-h-10 justify-between',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-2',
                children: [
                  e.jsx(Se, { className: 'h-4 w-4' }),
                  e.jsx('span', { children: s('timeline.filters') }),
                  F > 0 &&
                    e.jsx(k, {
                      variant: 'secondary',
                      className: 'h-5 min-w-5 rounded-full px-1.5',
                      children: F,
                    }),
                ],
              }),
              g
                ? e.jsx(De, { className: r('h-4 w-4', c ? 'me-2' : 'ms-2') })
                : e.jsx(Te, { className: r('h-4 w-4', c ? 'me-2' : 'ms-2') }),
            ],
          }),
          e.jsx(v, {
            variant: 'outline',
            size: 'icon',
            onClick: x,
            className: 'min-h-11 min-w-11 sm:min-h-10 sm:min-w-10',
            children: e.jsx(Ee, { className: 'h-4 w-4' }),
          }),
        ],
      }),
      g &&
        e.jsxs('div', {
          className: 'rounded-lg border bg-card p-4 sm:p-6 space-y-4 sm:space-y-6',
          children: [
            e.jsxs('div', {
              className: 'space-y-3',
              children: [
                e.jsx(C, { className: 'text-start block', children: s('timeline.event_types') }),
                e.jsx('div', {
                  className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3',
                  children: n.map((i) =>
                    e.jsxs(
                      'div',
                      {
                        className: 'flex items-center gap-2',
                        children: [
                          e.jsx(oe, {
                            id: `event-type-${i}`,
                            checked: (t.event_types || o).includes(i),
                            onCheckedChange: () => Z(i),
                          }),
                          e.jsx(C, {
                            htmlFor: `event-type-${i}`,
                            className: 'text-sm font-normal cursor-pointer text-start',
                            children: c ? S[i].ar : S[i].en,
                          }),
                        ],
                      },
                      i,
                    ),
                  ),
                }),
              ],
            }),
            e.jsx(z, {}),
            e.jsxs('div', {
              className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
              children: [
                e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    e.jsx(C, {
                      className: 'text-start block',
                      children: s('timeline.priority_filter'),
                    }),
                    e.jsxs(L, {
                      value: t.priority?.[0] || 'all',
                      onValueChange: (i) => ee(i),
                      children: [
                        e.jsx(U, { className: 'min-h-11 sm:min-h-10', children: e.jsx(V, {}) }),
                        e.jsxs(q, {
                          children: [
                            e.jsx(N, { value: 'all', children: s('timeline.all_priorities') }),
                            e.jsx(N, { value: 'high', children: s('timeline.priority.high') }),
                            e.jsx(N, { value: 'medium', children: s('timeline.priority.medium') }),
                            e.jsx(N, { value: 'low', children: s('timeline.priority.low') }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    e.jsx(C, {
                      className: 'text-start block',
                      children: s('timeline.status_filter'),
                    }),
                    e.jsxs(L, {
                      value: t.status?.[0] || 'all',
                      onValueChange: (i) => te(i),
                      children: [
                        e.jsx(U, { className: 'min-h-11 sm:min-h-10', children: e.jsx(V, {}) }),
                        e.jsxs(q, {
                          children: [
                            e.jsx(N, { value: 'all', children: s('timeline.all_statuses') }),
                            e.jsx(N, { value: 'planned', children: s('timeline.status.planned') }),
                            e.jsx(N, { value: 'ongoing', children: s('timeline.status.ongoing') }),
                            e.jsx(N, {
                              value: 'completed',
                              children: s('timeline.status.completed'),
                            }),
                            e.jsx(N, {
                              value: 'cancelled',
                              children: s('timeline.status.cancelled'),
                            }),
                            e.jsx(N, {
                              value: 'postponed',
                              children: s('timeline.status.postponed'),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            e.jsx(z, {}),
            e.jsxs('div', {
              className: 'space-y-3',
              children: [
                e.jsx(C, { className: 'text-start block', children: s('timeline.date_range') }),
                e.jsxs('div', {
                  className: 'flex flex-wrap gap-2',
                  children: [
                    [
                      { value: 'last_7_days', label: s('timeline.last_7_days') },
                      { value: 'last_30_days', label: s('timeline.last_30_days') },
                      { value: 'last_90_days', label: s('timeline.last_90_days') },
                      { value: 'last_year', label: s('timeline.last_year') },
                      { value: 'all_time', label: s('timeline.all_time') },
                    ].map((i) =>
                      e.jsx(
                        v,
                        {
                          variant: h === i.value ? 'default' : 'outline',
                          size: 'sm',
                          onClick: () => ae(i.value),
                          className: 'min-h-9 sm:min-h-8',
                          children: i.label,
                        },
                        i.value,
                      ),
                    ),
                    e.jsxs(me, {
                      children: [
                        e.jsx(de, {
                          asChild: !0,
                          children: e.jsxs(v, {
                            variant: h === 'custom' ? 'default' : 'outline',
                            size: 'sm',
                            className: 'min-h-9 sm:min-h-8',
                            children: [
                              e.jsx(T, { className: r('h-4 w-4', c ? 'ms-2' : 'me-2') }),
                              s('timeline.custom_range'),
                            ],
                          }),
                        }),
                        e.jsx(xe, {
                          className: 'w-auto p-0',
                          align: 'start',
                          children: e.jsxs('div', {
                            className: 'p-4 space-y-4',
                            children: [
                              e.jsxs('div', {
                                className: 'space-y-2',
                                children: [
                                  e.jsx(C, { children: s('timeline.from_date') }),
                                  e.jsx(B, { mode: 'single', selected: p, onSelect: I }),
                                ],
                              }),
                              e.jsxs('div', {
                                className: 'space-y-2',
                                children: [
                                  e.jsx(C, { children: s('timeline.to_date') }),
                                  e.jsx(B, { mode: 'single', selected: A, onSelect: m }),
                                ],
                              }),
                              e.jsx(v, {
                                onClick: () => {
                                  ;(_('custom'), se())
                                },
                                className: 'w-full',
                                children: s('timeline.apply_custom_range'),
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
            F > 0 &&
              e.jsxs(e.Fragment, {
                children: [
                  e.jsx(z, {}),
                  e.jsxs(v, {
                    variant: 'outline',
                    onClick: ie,
                    className: 'w-full min-h-11 sm:min-h-10',
                    children: [
                      e.jsx(K, { className: r('h-4 w-4', c ? 'ms-2' : 'me-2') }),
                      s('timeline.reset_filters'),
                    ],
                  }),
                ],
              }),
          ],
        }),
    ],
  })
}
async function Le(t, a, n, o, g = 20) {
  const { data: l, error: x } = await ue.functions.invoke('unified-timeline', {
    body: { dossier_id: t, dossier_type: a, filters: n, cursor: o, limit: g },
  })
  if (x) throw new Error(x.message || 'Failed to fetch timeline events')
  if (!l) throw new Error('No data returned from timeline API')
  return l
}
function Ye({
  dossierId: t,
  dossierType: a,
  initialFilters: n = {},
  itemsPerPage: o = 20,
  enableRealtime: g = !1,
}) {
  const [l, x] = f.useState(n),
    {
      data: d,
      isLoading: s,
      isFetchingNextPage: w,
      hasNextPage: c,
      fetchNextPage: b,
      error: u,
      refetch: h,
    } = pe({
      queryKey: ['timeline', t, a, l],
      queryFn: ({ pageParam: p }) => Le(t, a, l, p, o),
      initialPageParam: void 0,
      getNextPageParam: (p) => (p.has_more ? p.next_cursor : void 0),
      refetchOnWindowFocus: !1,
      staleTime: 1e3 * 60 * 5,
    })
  return {
    events: f.useMemo(() => (d?.pages ? d.pages.flatMap((p) => p.events) : []), [d]),
    isLoading: s,
    isFetchingNextPage: w,
    hasNextPage: c ?? !1,
    error: u,
    fetchNextPage: () => b(),
    refetch: h,
    filters: l,
    setFilters: x,
  }
}
function Je(t) {
  return (
    {
      Country: ['intelligence', 'mou', 'calendar', 'document', 'relationship'],
      Organization: ['interaction', 'mou', 'calendar', 'document', 'relationship'],
      Person: ['interaction', 'position', 'calendar', 'relationship'],
      Engagement: ['calendar', 'commitment', 'decision', 'document'],
      Forum: ['calendar', 'decision', 'document', 'relationship'],
      WorkingGroup: ['calendar', 'commitment', 'decision', 'document'],
      Topic: ['document', 'calendar', 'intelligence', 'relationship'],
    }[t] || ['calendar', 'document']
  )
}
function Qe(t) {
  return (
    {
      Country: [
        'intelligence',
        'mou',
        'calendar',
        'document',
        'interaction',
        'position',
        'relationship',
      ],
      Organization: ['interaction', 'mou', 'calendar', 'document', 'relationship', 'position'],
      Person: ['interaction', 'position', 'calendar', 'document', 'relationship'],
      Engagement: ['calendar', 'commitment', 'decision', 'document', 'interaction'],
      Forum: ['calendar', 'decision', 'document', 'relationship', 'interaction'],
      WorkingGroup: ['calendar', 'commitment', 'decision', 'document', 'interaction'],
      Topic: ['document', 'calendar', 'intelligence', 'relationship', 'interaction'],
    }[t] || [
      'calendar',
      'interaction',
      'intelligence',
      'document',
      'mou',
      'position',
      'relationship',
      'commitment',
      'decision',
    ]
  )
}
export { He as E, Ke as T, Qe as a, Je as g, Ye as u }
//# sourceMappingURL=useUnifiedTimeline-2-SmgReu.js.map
