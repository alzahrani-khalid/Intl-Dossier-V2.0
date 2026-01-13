import { j as a, r as s, R as F, a as Ve } from './react-vendor-Buoak6m3.js'
import {
  k as ie,
  l as Je,
  r as Xe,
  n as N,
  o as Ye,
  q as Re,
  t as Ze,
  v as ve,
  x as et,
  B as tt,
  y as rt,
  z as nt,
  A as Ce,
  C as q,
  D as ot,
  E as z,
  F as xe,
  G as st,
  H as at,
  I as be,
  J as it,
  K as ut,
  R as ct,
  L as Me,
  M as je,
  N as ae,
  O as lt,
  Q as dt,
  S as ft,
  U as ht,
} from './vendor-misc-BiJvMP0A.js'
function ue(e) {
  const r = e.errorComponent ?? $
  return a.jsx(mt, {
    getResetKey: e.getResetKey,
    onCatch: e.onCatch,
    children: ({ error: t, reset: n }) =>
      t ? s.createElement(r, { error: t, reset: n }) : e.children,
  })
}
class mt extends s.Component {
  constructor() {
    ;(super(...arguments), (this.state = { error: null }))
  }
  static getDerivedStateFromProps(r) {
    return { resetKey: r.getResetKey() }
  }
  static getDerivedStateFromError(r) {
    return { error: r }
  }
  reset() {
    this.setState({ error: null })
  }
  componentDidUpdate(r, t) {
    t.error && t.resetKey !== this.state.resetKey && this.reset()
  }
  componentDidCatch(r, t) {
    this.props.onCatch && this.props.onCatch(r, t)
  }
  render() {
    return this.props.children({
      error: this.state.resetKey !== this.props.getResetKey() ? null : this.state.error,
      reset: () => {
        this.reset()
      },
    })
  }
}
function $({ error: e }) {
  const [r, t] = s.useState(!1)
  return a.jsxs('div', {
    style: { padding: '.5rem', maxWidth: '100%' },
    children: [
      a.jsxs('div', {
        style: { display: 'flex', alignItems: 'center', gap: '.5rem' },
        children: [
          a.jsx('strong', { style: { fontSize: '1rem' }, children: 'Something went wrong!' }),
          a.jsx('button', {
            style: {
              appearance: 'none',
              fontSize: '.6em',
              border: '1px solid currentColor',
              padding: '.1rem .2rem',
              fontWeight: 'bold',
              borderRadius: '.25rem',
            },
            onClick: () => t((n) => !n),
            children: r ? 'Hide Error' : 'Show Error',
          }),
        ],
      }),
      a.jsx('div', { style: { height: '.25rem' } }),
      r
        ? a.jsx('div', {
            children: a.jsx('pre', {
              style: {
                fontSize: '.7em',
                border: '1px solid red',
                borderRadius: '.25rem',
                padding: '.3rem',
                color: 'red',
                overflow: 'auto',
              },
              children: e.message ? a.jsx('code', { children: e.message }) : null,
            }),
          })
        : null,
    ],
  })
}
function pt({ children: e, fallback: r = null }) {
  return gt() ? a.jsx(F.Fragment, { children: e }) : a.jsx(F.Fragment, { children: r })
}
function gt() {
  return F.useSyncExternalStore(
    yt,
    () => !0,
    () => !1,
  )
}
function yt() {
  return () => {}
}
const ne = s.createContext(null)
function Le() {
  return typeof document > 'u'
    ? ne
    : window.__TSR_ROUTER_CONTEXT__
      ? window.__TSR_ROUTER_CONTEXT__
      : ((window.__TSR_ROUTER_CONTEXT__ = ne), ne)
}
function R(e) {
  const r = s.useContext(Le())
  return (ie(!((e?.warn ?? !0) && !r)), r)
}
function S(e) {
  const r = R({ warn: e?.router === void 0 }),
    t = e?.router || r,
    n = s.useRef(void 0)
  return Je(t.__store, (o) => {
    if (e?.select) {
      if (e.structuralSharing ?? t.options.defaultStructuralSharing) {
        const c = Xe(n.current, e.select(o))
        return ((n.current = c), c)
      }
      return e.select(o)
    }
    return o
  })
}
const H = s.createContext(void 0),
  St = s.createContext(void 0)
function P(e) {
  const r = s.useContext(e.from ? St : H)
  return S({
    select: (n) => {
      const o = n.matches.find((c) => (e.from ? e.from === c.routeId : c.id === r))
      if (
        (N(
          !((e.shouldThrow ?? !0) && !o),
          `Could not find ${e.from ? `an active match from "${e.from}"` : 'a nearest match!'}`,
        ),
        o !== void 0)
      )
        return e.select ? e.select(o) : o
    },
    structuralSharing: e.structuralSharing,
  })
}
function ce(e) {
  return P({
    from: e.from,
    strict: e.strict,
    structuralSharing: e.structuralSharing,
    select: (r) => (e.select ? e.select(r.loaderData) : r.loaderData),
  })
}
function le(e) {
  const { select: r, ...t } = e
  return P({ ...t, select: (n) => (r ? r(n.loaderDeps) : n.loaderDeps) })
}
function de(e) {
  return P({
    from: e.from,
    shouldThrow: e.shouldThrow,
    structuralSharing: e.structuralSharing,
    strict: e.strict,
    select: (r) => {
      const t = e.strict === !1 ? r.params : r._strictParams
      return e.select ? e.select(t) : t
    },
  })
}
function fe(e) {
  return P({
    from: e.from,
    strict: e.strict,
    shouldThrow: e.shouldThrow,
    structuralSharing: e.structuralSharing,
    select: (r) => (e.select ? e.select(r.search) : r.search),
  })
}
function U(e) {
  const r = R()
  return s.useCallback((t) => r.navigate({ ...t, from: t.from ?? e?.from }), [e?.from, r])
}
function ir(e) {
  const r = R(),
    t = U(),
    n = s.useRef(null)
  return (
    s.useEffect(() => {
      n.current !== e && (t(e), (n.current = e))
    }, [r, e, t]),
    null
  )
}
const A = typeof window < 'u' ? s.useLayoutEffect : s.useEffect
function oe(e) {
  const r = s.useRef({ value: e, prev: null }),
    t = r.current.value
  return (e !== t && (r.current = { value: e, prev: t }), r.current.prev)
}
function Rt(e, r, t = {}, n = {}) {
  s.useEffect(() => {
    if (!e.current || n.disabled || typeof IntersectionObserver != 'function') return
    const o = new IntersectionObserver(([c]) => {
      r(c)
    }, t)
    return (
      o.observe(e.current),
      () => {
        o.disconnect()
      }
    )
  }, [r, t, n.disabled, e])
}
function vt(e) {
  const r = s.useRef(null)
  return (s.useImperativeHandle(e, () => r.current, []), r)
}
function Ct(e, r) {
  const t = R(),
    [n, o] = s.useState(!1),
    c = s.useRef(!1),
    i = vt(r),
    {
      activeProps: m,
      inactiveProps: l,
      activeOptions: u,
      to: d,
      preload: h,
      preloadDelay: p,
      hashScrollIntoView: k,
      replace: b,
      startTransition: W,
      resetScroll: G,
      viewTransition: g,
      children: C,
      target: _,
      disabled: v,
      style: O,
      className: V,
      onClick: J,
      onFocus: X,
      onMouseEnter: Y,
      onMouseLeave: Z,
      onTouchStart: ee,
      ignoreBlocker: qe,
      params: Jt,
      search: Xt,
      hash: Yt,
      state: Zt,
      mask: er,
      reloadDocument: tr,
      unsafeRelative: rr,
      from: nr,
      _fromLocation: or,
      ...he
    } = e,
    ze = S({ select: (f) => f.location.search, structuralSharing: !0 }),
    me = e.from,
    M = s.useMemo(
      () => ({ ...e, from: me }),
      [
        t,
        ze,
        me,
        e._fromLocation,
        e.hash,
        e.to,
        e.search,
        e.params,
        e.state,
        e.mask,
        e.unsafeRelative,
      ],
    ),
    w = s.useMemo(() => t.buildLocation({ ...M }), [t, M]),
    D = s.useMemo(() => {
      if (v) return
      let f = w.maskedLocation ? w.maskedLocation.url : w.url,
        y = !1
      return (
        t.origin &&
          (f.startsWith(t.origin)
            ? (f = t.history.createHref(f.replace(t.origin, '')) || '/')
            : (y = !0)),
        { href: f, external: y }
      )
    }, [v, w.maskedLocation, w.url, t.origin, t.history]),
    B = s.useMemo(() => {
      if (D?.external) return D.href
      try {
        return (new URL(d), d)
      } catch {}
    }, [d, D]),
    I = e.reloadDocument || B ? !1 : (h ?? t.options.defaultPreload),
    te = p ?? t.options.defaultPreloadDelay ?? 0,
    re = S({
      select: (f) => {
        if (B) return !1
        if (u?.exact) {
          if (!Ze(f.location.pathname, w.pathname, t.basepath)) return !1
        } else {
          const y = ve(f.location.pathname, t.basepath),
            x = ve(w.pathname, t.basepath)
          if (!(y.startsWith(x) && (y.length === x.length || y[x.length] === '/'))) return !1
        }
        return (u?.includeSearch ?? !0) &&
          !et(f.location.search, w.search, {
            partial: !u?.exact,
            ignoreUndefined: !u?.explicitUndefined,
          })
          ? !1
          : u?.includeHash
            ? f.location.hash === w.hash
            : !0
      },
    }),
    E = s.useCallback(() => {
      t.preloadRoute({ ...M }).catch((f) => {
        ;(console.warn(f), console.warn(Ye))
      })
    }, [t, M]),
    $e = s.useCallback(
      (f) => {
        f?.isIntersecting && E()
      },
      [E],
    )
  ;(Rt(i, $e, Et, { disabled: !!v || I !== 'viewport' }),
    s.useEffect(() => {
      c.current || (!v && I === 'render' && (E(), (c.current = !0)))
    }, [v, E, I]))
  const He = (f) => {
    const y = f.currentTarget.target,
      x = _ !== void 0 ? _ : y
    if (!v && !It(f) && !f.defaultPrevented && (!x || x === '_self') && f.button === 0) {
      ;(f.preventDefault(),
        Ve.flushSync(() => {
          o(!0)
        }))
      const Se = t.subscribe('onResolved', () => {
        ;(Se(), o(!1))
      })
      t.navigate({
        ...M,
        replace: b,
        resetScroll: G,
        hashScrollIntoView: k,
        startTransition: W,
        viewTransition: g,
        ignoreBlocker: qe,
      })
    }
  }
  if (B)
    return {
      ...he,
      ref: i,
      href: B,
      ...(C && { children: C }),
      ...(_ && { target: _ }),
      ...(v && { disabled: v }),
      ...(O && { style: O }),
      ...(V && { className: V }),
      ...(J && { onClick: J }),
      ...(X && { onFocus: X }),
      ...(Y && { onMouseEnter: Y }),
      ...(Z && { onMouseLeave: Z }),
      ...(ee && { onTouchStart: ee }),
    }
  const pe = (f) => {
      v || (I && E())
    },
    Ue = pe,
    We = (f) => {
      if (!(v || !I))
        if (!te) E()
        else {
          const y = f.target
          if (j.has(y)) return
          const x = setTimeout(() => {
            ;(j.delete(y), E())
          }, te)
          j.set(y, x)
        }
    },
    Ge = (f) => {
      if (v || !I || !te) return
      const y = f.target,
        x = j.get(y)
      x && (clearTimeout(x), j.delete(y))
    },
    K = re ? (Re(m, {}) ?? xt) : se,
    Q = re ? se : (Re(l, {}) ?? se),
    ge = [V, K.className, Q.className].filter(Boolean).join(' '),
    ye = (O || K.style || Q.style) && { ...O, ...K.style, ...Q.style }
  return {
    ...he,
    ...K,
    ...Q,
    href: D?.href,
    ref: i,
    onClick: L([J, He]),
    onFocus: L([X, pe]),
    onMouseEnter: L([Y, We]),
    onMouseLeave: L([Z, Ge]),
    onTouchStart: L([ee, Ue]),
    disabled: !!v,
    target: _,
    ...(ye && { style: ye }),
    ...(ge && { className: ge }),
    ...(v && Pt),
    ...(re && _t),
    ...(n && wt),
  }
}
const se = {},
  xt = { className: 'active' },
  Pt = { role: 'link', 'aria-disabled': !0 },
  _t = { 'data-status': 'active', 'aria-current': 'page' },
  wt = { 'data-transitioning': 'transitioning' },
  j = new WeakMap(),
  Et = { rootMargin: '100px' },
  L = (e) => (r) => {
    for (const t of e)
      if (t) {
        if (r.defaultPrevented) return
        t(r)
      }
  },
  Fe = s.forwardRef((e, r) => {
    const { _asChild: t, ...n } = e,
      { type: o, ref: c, ...i } = Ct(n, r),
      m =
        typeof n.children == 'function'
          ? n.children({ isActive: i['data-status'] === 'active' })
          : n.children
    return (t === void 0 && delete i.disabled, s.createElement(t || 'a', { ...i, ref: c }, m))
  })
function It(e) {
  return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
}
class Tt extends rt {
  constructor(r) {
    ;(super(r),
      (this.useMatch = (t) =>
        P({ select: t?.select, from: this.id, structuralSharing: t?.structuralSharing })),
      (this.useRouteContext = (t) =>
        P({ ...t, from: this.id, select: (n) => (t?.select ? t.select(n.context) : n.context) })),
      (this.useSearch = (t) =>
        fe({ select: t?.select, structuralSharing: t?.structuralSharing, from: this.id })),
      (this.useParams = (t) =>
        de({ select: t?.select, structuralSharing: t?.structuralSharing, from: this.id })),
      (this.useLoaderDeps = (t) => le({ ...t, from: this.id })),
      (this.useLoaderData = (t) => ce({ ...t, from: this.id })),
      (this.useNavigate = () => U({ from: this.fullPath })),
      (this.Link = F.forwardRef((t, n) => a.jsx(Fe, { ref: n, from: this.fullPath, ...t }))),
      (this.$$typeof = Symbol.for('react.memo')))
  }
}
function bt(e) {
  return new Tt(e)
}
class Mt extends tt {
  constructor(r) {
    ;(super(r),
      (this.useMatch = (t) =>
        P({ select: t?.select, from: this.id, structuralSharing: t?.structuralSharing })),
      (this.useRouteContext = (t) =>
        P({ ...t, from: this.id, select: (n) => (t?.select ? t.select(n.context) : n.context) })),
      (this.useSearch = (t) =>
        fe({ select: t?.select, structuralSharing: t?.structuralSharing, from: this.id })),
      (this.useParams = (t) =>
        de({ select: t?.select, structuralSharing: t?.structuralSharing, from: this.id })),
      (this.useLoaderDeps = (t) => le({ ...t, from: this.id })),
      (this.useLoaderData = (t) => ce({ ...t, from: this.id })),
      (this.useNavigate = () => U({ from: this.fullPath })),
      (this.Link = F.forwardRef((t, n) => a.jsx(Fe, { ref: n, from: this.fullPath, ...t }))),
      (this.$$typeof = Symbol.for('react.memo')))
  }
}
function ur(e) {
  return new Mt(e)
}
function Pe(e) {
  return typeof e == 'object'
    ? new _e(e, { silent: !0 }).createRoute(e)
    : new _e(e, { silent: !0 }).createRoute
}
class _e {
  constructor(r, t) {
    ;((this.path = r),
      (this.createRoute = (n) => {
        ie(this.silent)
        const o = bt(n)
        return ((o.isRoot = !1), o)
      }),
      (this.silent = t?.silent))
  }
}
class we {
  constructor(r) {
    ;((this.useMatch = (t) =>
      P({ select: t?.select, from: this.options.id, structuralSharing: t?.structuralSharing })),
      (this.useRouteContext = (t) =>
        P({ from: this.options.id, select: (n) => (t?.select ? t.select(n.context) : n.context) })),
      (this.useSearch = (t) =>
        fe({ select: t?.select, structuralSharing: t?.structuralSharing, from: this.options.id })),
      (this.useParams = (t) =>
        de({ select: t?.select, structuralSharing: t?.structuralSharing, from: this.options.id })),
      (this.useLoaderDeps = (t) => le({ ...t, from: this.options.id })),
      (this.useLoaderData = (t) => ce({ ...t, from: this.options.id })),
      (this.useNavigate = () => {
        const t = R()
        return U({ from: t.routesById[this.options.id].fullPath })
      }),
      (this.options = r),
      (this.$$typeof = Symbol.for('react.memo')))
  }
}
function Ee(e) {
  return typeof e == 'object' ? new we(e) : (r) => new we({ id: e, ...r })
}
function cr(e, r) {
  let t, n, o, c
  const i = () => (
      t ||
        (t = e()
          .then((l) => {
            ;((t = void 0), (n = l[r ?? 'default']))
          })
          .catch((l) => {
            if (
              ((o = l),
              nt(o) && o instanceof Error && typeof window < 'u' && typeof sessionStorage < 'u')
            ) {
              const u = `tanstack_router_reload:${o.message}`
              sessionStorage.getItem(u) || (sessionStorage.setItem(u, '1'), (c = !0))
            }
          })),
      t
    ),
    m = function (u) {
      if (c) throw (window.location.reload(), new Promise(() => {}))
      if (o) throw o
      if (!n) throw i()
      return s.createElement(n, u)
    }
  return ((m.preload = i), m)
}
function jt() {
  const e = R(),
    r = s.useRef({ router: e, mounted: !1 }),
    [t, n] = s.useState(!1),
    { hasPendingMatches: o, isLoading: c } = S({
      select: (h) => ({
        isLoading: h.isLoading,
        hasPendingMatches: h.matches.some((p) => p.status === 'pending'),
      }),
      structuralSharing: !0,
    }),
    i = oe(c),
    m = c || t || o,
    l = oe(m),
    u = c || o,
    d = oe(u)
  return (
    (e.startTransition = (h) => {
      ;(n(!0),
        s.startTransition(() => {
          ;(h(), n(!1))
        }))
    }),
    s.useEffect(() => {
      const h = e.history.subscribe(e.load),
        p = e.buildLocation({
          to: e.latestLocation.pathname,
          search: !0,
          params: !0,
          hash: !0,
          state: !0,
          _includeValidateSearch: !0,
        })
      return (
        Ce(e.latestLocation.href) !== Ce(p.href) && e.commitLocation({ ...p, replace: !0 }),
        () => {
          h()
        }
      )
    }, [e, e.history]),
    A(() => {
      if ((typeof window < 'u' && e.ssr) || (r.current.router === e && r.current.mounted)) return
      ;((r.current = { router: e, mounted: !0 }),
        (async () => {
          try {
            await e.load()
          } catch (p) {
            console.error(p)
          }
        })())
    }, [e]),
    A(() => {
      i && !c && e.emit({ type: 'onLoad', ...q(e.state) })
    }, [i, e, c]),
    A(() => {
      d && !u && e.emit({ type: 'onBeforeRouteMount', ...q(e.state) })
    }, [u, d, e]),
    A(() => {
      l &&
        !m &&
        (e.emit({ type: 'onResolved', ...q(e.state) }),
        e.__store.setState((h) => ({ ...h, status: 'idle', resolvedLocation: h.location })),
        ot(e))
    }, [m, l, e]),
    null
  )
}
function Lt(e) {
  const r = S({ select: (t) => `not-found-${t.location.pathname}-${t.status}` })
  return a.jsx(ue, {
    getResetKey: () => r,
    onCatch: (t, n) => {
      if (z(t)) e.onCatch?.(t, n)
      else throw t
    },
    errorComponent: ({ error: t }) => {
      if (z(t)) return e.fallback?.(t)
      throw t
    },
    children: e.children,
  })
}
function Ft() {
  return a.jsx('p', { children: 'Not Found' })
}
function T(e) {
  return a.jsx(a.Fragment, { children: e.children })
}
function Ne(e, r, t) {
  return r.options.notFoundComponent
    ? a.jsx(r.options.notFoundComponent, { data: t })
    : e.options.defaultNotFoundComponent
      ? a.jsx(e.options.defaultNotFoundComponent, { data: t })
      : a.jsx(Ft, {})
}
function Nt({ children: e }) {
  const r = R()
  return r.isServer
    ? a.jsx('script', {
        nonce: r.options.ssr?.nonce,
        className: '$tsr',
        dangerouslySetInnerHTML: {
          __html:
            [e].filter(Boolean).join(`
`) + ';$_TSR.c()',
        },
      })
    : null
}
function kt() {
  const e = R()
  if (
    !e.isScrollRestoring ||
    !e.isServer ||
    (typeof e.options.scrollRestoration == 'function' &&
      !e.options.scrollRestoration({ location: e.latestLocation }))
  )
    return null
  const t = (e.options.getScrollRestorationKey || xe)(e.latestLocation),
    n = t !== xe(e.latestLocation) ? t : void 0,
    o = { storageKey: at, shouldScrollRestoration: !0 }
  return (n && (o.key = n), a.jsx(Nt, { children: `(${st.toString()})(${JSON.stringify(o)})` }))
}
const ke = s.memo(function ({ matchId: r }) {
  const t = R(),
    n = S({
      select: (g) => {
        const C = g.matches.find((_) => _.id === r)
        return (N(C), { routeId: C.routeId, ssr: C.ssr, _displayPending: C._displayPending })
      },
      structuralSharing: !0,
    }),
    o = t.routesById[n.routeId],
    c = o.options.pendingComponent ?? t.options.defaultPendingComponent,
    i = c ? a.jsx(c, {}) : null,
    m = o.options.errorComponent ?? t.options.defaultErrorComponent,
    l = o.options.onCatch ?? t.options.defaultOnCatch,
    u = o.isRoot
      ? (o.options.notFoundComponent ?? t.options.notFoundRoute?.options.component)
      : o.options.notFoundComponent,
    d = n.ssr === !1 || n.ssr === 'data-only',
    h =
      (!o.isRoot || o.options.wrapInSuspense || d) &&
      (o.options.wrapInSuspense ?? c ?? (o.options.errorComponent?.preload || d))
        ? s.Suspense
        : T,
    p = m ? ue : T,
    k = u ? Lt : T,
    b = S({ select: (g) => g.loadedAt }),
    W = S({
      select: (g) => {
        const C = g.matches.findIndex((_) => _.id === r)
        return g.matches[C - 1]?.routeId
      },
    }),
    G = o.isRoot ? (o.options.shellComponent ?? T) : T
  return a.jsxs(G, {
    children: [
      a.jsx(H.Provider, {
        value: r,
        children: a.jsx(h, {
          fallback: i,
          children: a.jsx(p, {
            getResetKey: () => b,
            errorComponent: m || $,
            onCatch: (g, C) => {
              if (z(g)) throw g
              l?.(g, C)
            },
            children: a.jsx(k, {
              fallback: (g) => {
                if (!u || (g.routeId && g.routeId !== n.routeId) || (!g.routeId && !o.isRoot))
                  throw g
                return s.createElement(u, g)
              },
              children:
                d || n._displayPending
                  ? a.jsx(pt, { fallback: i, children: a.jsx(Ie, { matchId: r }) })
                  : a.jsx(Ie, { matchId: r }),
            }),
          }),
        }),
      }),
      W === be && t.options.scrollRestoration
        ? a.jsxs(a.Fragment, { children: [a.jsx(Ot, {}), a.jsx(kt, {})] })
        : null,
    ],
  })
})
function Ot() {
  const e = R(),
    r = s.useRef(void 0)
  return a.jsx(
    'script',
    {
      suppressHydrationWarning: !0,
      ref: (t) => {
        t &&
          (r.current === void 0 || r.current.href !== e.latestLocation.href) &&
          (e.emit({ type: 'onRendered', ...q(e.state) }), (r.current = e.latestLocation))
      },
    },
    e.latestLocation.state.__TSR_key,
  )
}
const Ie = s.memo(function ({ matchId: r }) {
    const t = R(),
      {
        match: n,
        key: o,
        routeId: c,
      } = S({
        select: (l) => {
          const u = l.matches.find((b) => b.id === r),
            d = u.routeId,
            p = (t.routesById[d].options.remountDeps ?? t.options.defaultRemountDeps)?.({
              routeId: d,
              loaderDeps: u.loaderDeps,
              params: u._strictParams,
              search: u._strictSearch,
            })
          return {
            key: p ? JSON.stringify(p) : void 0,
            routeId: d,
            match: {
              id: u.id,
              status: u.status,
              error: u.error,
              _forcePending: u._forcePending,
              _displayPending: u._displayPending,
            },
          }
        },
        structuralSharing: !0,
      }),
      i = t.routesById[c],
      m = s.useMemo(() => {
        const l = i.options.component ?? t.options.defaultComponent
        return l ? a.jsx(l, {}, o) : a.jsx(Dt, {})
      }, [o, i.options.component, t.options.defaultComponent])
    if (n._displayPending) throw t.getMatch(n.id)?._nonReactive.displayPendingPromise
    if (n._forcePending) throw t.getMatch(n.id)?._nonReactive.minPendingPromise
    if (n.status === 'pending') {
      const l = i.options.pendingMinMs ?? t.options.defaultPendingMinMs
      if (l) {
        const u = t.getMatch(n.id)
        if (u && !u._nonReactive.minPendingPromise && !t.isServer) {
          const d = it()
          ;((u._nonReactive.minPendingPromise = d),
            setTimeout(() => {
              ;(d.resolve(), (u._nonReactive.minPendingPromise = void 0))
            }, l))
        }
      }
      throw t.getMatch(n.id)?._nonReactive.loadPromise
    }
    if (n.status === 'notFound') return (N(z(n.error)), Ne(t, i, n.error))
    if (n.status === 'redirected')
      throw (N(ut(n.error)), t.getMatch(n.id)?._nonReactive.loadPromise)
    if (n.status === 'error') {
      if (t.isServer) {
        const l = (i.options.errorComponent ?? t.options.defaultErrorComponent) || $
        return a.jsx(l, { error: n.error, reset: void 0, info: { componentStack: '' } })
      }
      throw n.error
    }
    return m
  }),
  Dt = s.memo(function () {
    const r = R(),
      t = s.useContext(H),
      n = S({ select: (u) => u.matches.find((d) => d.id === t)?.routeId }),
      o = r.routesById[n],
      c = S({
        select: (u) => {
          const h = u.matches.find((p) => p.id === t)
          return (N(h), h.globalNotFound)
        },
      }),
      i = S({
        select: (u) => {
          const d = u.matches,
            h = d.findIndex((p) => p.id === t)
          return d[h + 1]?.id
        },
      }),
      m = r.options.defaultPendingComponent ? a.jsx(r.options.defaultPendingComponent, {}) : null
    if (c) return Ne(r, o, void 0)
    if (!i) return null
    const l = a.jsx(ke, { matchId: i })
    return t === be ? a.jsx(s.Suspense, { fallback: m, children: l }) : l
  })
function Bt() {
  const e = R(),
    r = e.options.defaultPendingComponent ? a.jsx(e.options.defaultPendingComponent, {}) : null,
    t = e.isServer || (typeof document < 'u' && e.ssr) ? T : s.Suspense,
    n = a.jsxs(t, { fallback: r, children: [!e.isServer && a.jsx(jt, {}), a.jsx(Kt, {})] })
  return e.options.InnerWrap ? a.jsx(e.options.InnerWrap, { children: n }) : n
}
function Kt() {
  const e = R(),
    r = S({ select: (o) => o.matches[0]?.id }),
    t = S({ select: (o) => o.loadedAt }),
    n = r ? a.jsx(ke, { matchId: r }) : null
  return a.jsx(H.Provider, {
    value: r,
    children: e.options.disableGlobalCatchBoundary
      ? n
      : a.jsx(ue, {
          getResetKey: () => t,
          errorComponent: $,
          onCatch: (o) => {
            ie(!1, o.message || o.toString())
          },
          children: n,
        }),
  })
}
const lr = (e) => new Qt(e)
class Qt extends ct {
  constructor(r) {
    super(r)
  }
}
typeof globalThis < 'u'
  ? ((globalThis.createFileRoute = Pe), (globalThis.createLazyFileRoute = Ee))
  : typeof window < 'u' && ((window.createFileRoute = Pe), (window.createLazyFileRoute = Ee))
function At({ router: e, children: r, ...t }) {
  Object.keys(t).length > 0 &&
    e.update({ ...e.options, ...t, context: { ...e.options.context, ...t.context } })
  const n = Le(),
    o = a.jsx(n.Provider, { value: e, children: r })
  return e.options.Wrap ? a.jsx(e.options.Wrap, { children: o }) : o
}
function dr({ router: e, ...r }) {
  return a.jsx(At, { router: e, ...r, children: a.jsx(Bt, {}) })
}
function fr(e) {
  return S({ select: (r) => r.location })
}
var Oe = s.createContext(void 0),
  De = (e) => {
    const r = s.useContext(Oe)
    if (!r) throw new Error('No QueryClient set, use QueryClientProvider to set one')
    return r
  },
  hr = ({ client: e, children: r }) => (
    s.useEffect(
      () => (
        e.mount(),
        () => {
          e.unmount()
        }
      ),
      [e],
    ),
    a.jsx(Oe.Provider, { value: e, children: r })
  ),
  Be = s.createContext(!1),
  qt = () => s.useContext(Be)
Be.Provider
function Ke() {
  let e = !1
  return {
    clearReset: () => {
      e = !1
    },
    reset: () => {
      e = !0
    },
    isReset: () => e,
  }
}
var Qe = s.createContext(Ke()),
  zt = () => s.useContext(Qe),
  mr = ({ children: e }) => {
    const [r] = s.useState(() => Ke())
    return a.jsx(Qe.Provider, { value: r, children: typeof e == 'function' ? e(r) : e })
  },
  $t = (e, r) => {
    ;(e.suspense || e.throwOnError || e.experimental_prefetchInRender) &&
      (r.isReset() || (e.retryOnMount = !1))
  },
  Ht = (e) => {
    s.useEffect(() => {
      e.clearReset()
    }, [e])
  },
  Ut = ({ result: e, errorResetBoundary: r, throwOnError: t, query: n, suspense: o }) =>
    e.isError &&
    !r.isReset() &&
    !e.isFetching &&
    n &&
    ((o && e.data === void 0) || Me(t, [e.error, n])),
  Wt = (e) => {
    if (e.suspense) {
      const t = (o) => (o === 'static' ? o : Math.max(o ?? 1e3, 1e3)),
        n = e.staleTime
      ;((e.staleTime = typeof n == 'function' ? (...o) => t(n(...o)) : t(n)),
        typeof e.gcTime == 'number' && (e.gcTime = Math.max(e.gcTime, 1e3)))
    }
  },
  Gt = (e, r) => e.isLoading && e.isFetching && !r,
  Vt = (e, r) => e?.suspense && r.isPending,
  Te = (e, r, t) =>
    r.fetchOptimistic(e).catch(() => {
      t.clearReset()
    })
function Ae(e, r, t) {
  const n = qt(),
    o = zt(),
    c = De(),
    i = c.defaultQueryOptions(e)
  ;(c.getDefaultOptions().queries?._experimental_beforeQuery?.(i),
    (i._optimisticResults = n ? 'isRestoring' : 'optimistic'),
    Wt(i),
    $t(i, o),
    Ht(o))
  const m = !c.getQueryCache().get(i.queryHash),
    [l] = s.useState(() => new r(c, i)),
    u = l.getOptimisticResult(i),
    d = !n && e.subscribed !== !1
  if (
    (s.useSyncExternalStore(
      s.useCallback(
        (h) => {
          const p = d ? l.subscribe(je.batchCalls(h)) : ae
          return (l.updateResult(), p)
        },
        [l, d],
      ),
      () => l.getCurrentResult(),
      () => l.getCurrentResult(),
    ),
    s.useEffect(() => {
      l.setOptions(i)
    }, [i, l]),
    Vt(i, u))
  )
    throw Te(i, l, o)
  if (
    Ut({
      result: u,
      errorResetBoundary: o,
      throwOnError: i.throwOnError,
      query: c.getQueryCache().get(i.queryHash),
      suspense: i.suspense,
    })
  )
    throw u.error
  return (
    c.getDefaultOptions().queries?._experimental_afterQuery?.(i, u),
    i.experimental_prefetchInRender &&
      !lt &&
      Gt(u, n) &&
      (m ? Te(i, l, o) : c.getQueryCache().get(i.queryHash)?.promise)?.catch(ae).finally(() => {
        l.updateResult()
      }),
    i.notifyOnChangeProps ? u : l.trackResult(u)
  )
}
function pr(e, r) {
  return Ae(e, dt)
}
function gr(e, r) {
  const t = De(),
    [n] = s.useState(() => new ft(t, e))
  s.useEffect(() => {
    n.setOptions(e)
  }, [n, e])
  const o = s.useSyncExternalStore(
      s.useCallback((i) => n.subscribe(je.batchCalls(i)), [n]),
      () => n.getCurrentResult(),
      () => n.getCurrentResult(),
    ),
    c = s.useCallback(
      (i, m) => {
        n.mutate(i, m).catch(ae)
      },
      [n],
    )
  if (o.error && Me(n.options.throwOnError, [o.error])) throw o.error
  return { ...o, mutate: c, mutateAsync: o.mutate }
}
function yr(e, r) {
  return Ae(e, ht)
}
var Sr = function () {
  return null
}
const Rr = function () {
  return null
}
export {
  Fe as L,
  ir as N,
  Dt as O,
  hr as Q,
  Sr as R,
  Rr as T,
  pr as a,
  yr as b,
  De as c,
  gr as d,
  ur as e,
  Pe as f,
  lr as g,
  dr as h,
  U as i,
  fr as j,
  fe as k,
  cr as l,
  de as m,
  mr as n,
  S as u,
}
//# sourceMappingURL=tanstack-vendor-BZC-rs5U.js.map
