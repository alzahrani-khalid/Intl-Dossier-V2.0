import { r as d, u as I, j as s } from './react-vendor-Buoak6m3.js'
import { c as x } from './index-qYY0KoZ1.js'
import { aN as k, by as D, bx as V, aS as J } from './vendor-misc-BiJvMP0A.js'
function K(t, i) {
  const [a, o] = d.useState(() => {
      if (typeof window > 'u') return i
      try {
        const e = window.sessionStorage.getItem(t)
        return e ? JSON.parse(e) : i
      } catch (e) {
        return (console.warn(`Error reading sessionStorage key "${t}":`, e), i)
      }
    }),
    u = d.useCallback(
      (e) => {
        try {
          const n = e instanceof Function ? e(a) : e
          ;(o(n), typeof window < 'u' && window.sessionStorage.setItem(t, JSON.stringify(n)))
        } catch (n) {
          console.warn(`Error setting sessionStorage key "${t}":`, n)
        }
      },
      [t, a],
    )
  return (
    d.useEffect(() => {
      if (typeof window > 'u') return
      const e = (n) => {
        if (n.key === t && n.newValue !== null)
          try {
            o(JSON.parse(n.newValue))
          } catch (r) {
            console.warn(`Error syncing sessionStorage key "${t}":`, r)
          }
      }
      return (
        window.addEventListener('storage', e),
        () => {
          window.removeEventListener('storage', e)
        }
      )
    }, [t]),
    [a, u]
  )
}
function q(t, i, a) {
  const o = `dossier-sections-${i}-${t}`,
    [u, e] = K(o, a),
    n = d.useCallback(
      (r) => {
        e((l) => ({ ...l, [r]: !l[r] }))
      },
      [e],
    )
  return [u, n, e]
}
function A({
  id: t,
  title: i,
  description: a,
  children: o,
  defaultExpanded: u = !0,
  isExpanded: e,
  onToggle: n,
  isLoading: r = !1,
  error: l,
  emptyMessage: b,
  showEmptyState: w = !1,
  headerClassName: j,
  contentClassName: v,
}) {
  const { t: p, i18n: S } = I('dossier'),
    N = S.language === 'ar',
    f = d.useId(),
    [E, C] = d.useState(u),
    m = e ?? E,
    g = `collapsible-header-${f}-${t}`,
    h = `collapsible-panel-${f}-${t}`,
    y = () => {
      const c = !m
      n ? n(c) : C(c)
    },
    $ = (c) => {
      ;(c.key === 'Enter' || c.key === ' ') && (c.preventDefault(), y())
    }
  return s.jsxs('div', {
    className: 'border rounded-lg overflow-hidden',
    dir: N ? 'rtl' : 'ltr',
    children: [
      s.jsxs('button', {
        type: 'button',
        id: g,
        'aria-expanded': m,
        'aria-controls': h,
        onClick: y,
        onKeyDown: $,
        className: x(
          'w-full min-h-11 px-4 py-3 sm:px-6 sm:py-4',
          'flex items-center justify-between gap-3',
          'bg-card text-card-foreground',
          'hover:bg-accent hover:text-accent-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'transition-colors duration-200',
          'text-start',
          j,
        ),
        children: [
          s.jsxs('div', {
            className: 'flex-1',
            children: [
              s.jsx('h2', { className: 'text-base sm:text-lg font-semibold', children: i }),
              a && s.jsx('p', { className: 'text-sm text-muted-foreground mt-1', children: a }),
            ],
          }),
          s.jsx(k, {
            className: x(
              'h-5 w-5 text-muted-foreground',
              'transition-transform duration-300',
              m && 'rotate-180',
            ),
            'aria-hidden': 'true',
          }),
        ],
      }),
      s.jsx(D, {
        initial: !1,
        children:
          m &&
          s.jsx(V.div, {
            initial: { height: 0, opacity: 0 },
            animate: { height: 'auto', opacity: 1 },
            exit: { height: 0, opacity: 0 },
            transition: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
            role: 'region',
            id: h,
            'aria-labelledby': g,
            children: s.jsxs('div', {
              className: x('px-4 py-3 sm:px-6 sm:py-4 bg-background', 'border-t', v),
              children: [
                r &&
                  s.jsxs('div', {
                    className: 'flex items-center justify-center py-8 sm:py-12',
                    'aria-live': 'polite',
                    'aria-busy': 'true',
                    children: [
                      s.jsx(J, {
                        className: 'h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground',
                      }),
                      s.jsx('span', {
                        className: 'ms-3 text-muted-foreground',
                        children: p('sections.collapsible.loading'),
                      }),
                    ],
                  }),
                l &&
                  !r &&
                  s.jsx('div', {
                    className: 'flex items-center justify-center py-8 sm:py-12',
                    role: 'alert',
                    'aria-live': 'assertive',
                    children: s.jsx('p', {
                      className: 'text-destructive text-sm sm:text-base',
                      children: l,
                    }),
                  }),
                w &&
                  !r &&
                  !l &&
                  !o &&
                  s.jsx('div', {
                    className: 'flex items-center justify-center py-8 sm:py-12',
                    children: s.jsx('p', {
                      className: 'text-muted-foreground text-sm sm:text-base',
                      children: b || p('sections.collapsible.empty'),
                    }),
                  }),
                !r &&
                  !l &&
                  o &&
                  s.jsx('div', {
                    className: 'prose prose-sm sm:prose max-w-none dark:prose-invert',
                    children: o,
                  }),
              ],
            }),
          }),
      }),
    ],
  })
}
export { A as C, K as a, q as u }
//# sourceMappingURL=CollapsibleSection-Bj_Tk5Ee.js.map
