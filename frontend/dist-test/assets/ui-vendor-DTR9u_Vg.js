import {
  r as s,
  j as u,
  b as kn,
  a as Io,
  d as Ln,
  e as Rt,
  R as B,
} from './react-vendor-Buoak6m3.js'
import {
  V as Et,
  W as mc,
  X as gc,
  Y as hc,
  Z as Cc,
  $ as xc,
  a0 as wc,
  a1 as bc,
  a2 as yc,
  a3 as Rc,
  a4 as Ec,
} from './vendor-misc-BiJvMP0A.js'
function gn(e, o) {
  if (typeof e == 'function') return e(o)
  e != null && (e.current = o)
}
function me(...e) {
  return (o) => {
    let t = !1
    const r = e.map((n) => {
      const a = gn(n, o)
      return (!t && typeof a == 'function' && (t = !0), a)
    })
    if (t)
      return () => {
        for (let n = 0; n < r.length; n++) {
          const a = r[n]
          typeof a == 'function' ? a() : gn(e[n], null)
        }
      }
  }
}
function O(...e) {
  return s.useCallback(me(...e), e)
}
function be(e) {
  const o = Sc(e),
    t = s.forwardRef((r, n) => {
      const { children: a, ...i } = r,
        c = s.Children.toArray(a),
        l = c.find(Pc)
      if (l) {
        const d = l.props.children,
          f = c.map((p) =>
            p === l
              ? s.Children.count(d) > 1
                ? s.Children.only(null)
                : s.isValidElement(d)
                  ? d.props.children
                  : null
              : p,
          )
        return u.jsx(o, {
          ...i,
          ref: n,
          children: s.isValidElement(d) ? s.cloneElement(d, void 0, f) : null,
        })
      }
      return u.jsx(o, { ...i, ref: n, children: a })
    })
  return ((t.displayName = `${e}.Slot`), t)
}
var Qp = be('Slot')
function Sc(e) {
  const o = s.forwardRef((t, r) => {
    const { children: n, ...a } = t
    if (s.isValidElement(n)) {
      const i = Ic(n),
        c = _c(a, n.props)
      return (n.type !== s.Fragment && (c.ref = r ? me(r, i) : i), s.cloneElement(n, c))
    }
    return s.Children.count(n) > 1 ? s.Children.only(null) : null
  })
  return ((o.displayName = `${e}.SlotClone`), o)
}
var $n = Symbol('radix.slottable')
function Fn(e) {
  const o = ({ children: t }) => u.jsx(u.Fragment, { children: t })
  return ((o.displayName = `${e}.Slottable`), (o.__radixId = $n), o)
}
function Pc(e) {
  return (
    s.isValidElement(e) &&
    typeof e.type == 'function' &&
    '__radixId' in e.type &&
    e.type.__radixId === $n
  )
}
function _c(e, o) {
  const t = { ...o }
  for (const r in o) {
    const n = e[r],
      a = o[r]
    ;/^on[A-Z]/.test(r)
      ? n && a
        ? (t[r] = (...c) => {
            const l = a(...c)
            return (n(...c), l)
          })
        : n && (t[r] = n)
      : r === 'style'
        ? (t[r] = { ...n, ...a })
        : r === 'className' && (t[r] = [n, a].filter(Boolean).join(' '))
  }
  return { ...e, ...t }
}
function Ic(e) {
  let o = Object.getOwnPropertyDescriptor(e.props, 'ref')?.get,
    t = o && 'isReactWarning' in o && o.isReactWarning
  return t
    ? e.ref
    : ((o = Object.getOwnPropertyDescriptor(e, 'ref')?.get),
      (t = o && 'isReactWarning' in o && o.isReactWarning),
      t ? e.props.ref : e.props.ref || e.ref)
}
var hn = 1,
  Tc = 0.9,
  Ac = 0.8,
  Mc = 0.17,
  to = 0.1,
  oo = 0.999,
  Nc = 0.9999,
  Dc = 0.99,
  Oc = /[\\\/_+.#"@\[\(\{&]/,
  jc = /[\\\/_+.#"@\[\(\{&]/g,
  kc = /[\s-]/,
  Vn = /[\s-]/g
function co(e, o, t, r, n, a, i) {
  if (a === o.length) return n === e.length ? hn : Dc
  var c = `${n},${a}`
  if (i[c] !== void 0) return i[c]
  for (var l = r.charAt(a), d = t.indexOf(l, n), f = 0, p, v, m, h; d >= 0; )
    ((p = co(e, o, t, r, d + 1, a + 1, i)),
      p > f &&
        (d === n
          ? (p *= hn)
          : Oc.test(e.charAt(d - 1))
            ? ((p *= Ac),
              (m = e.slice(n, d - 1).match(jc)),
              m && n > 0 && (p *= Math.pow(oo, m.length)))
            : kc.test(e.charAt(d - 1))
              ? ((p *= Tc),
                (h = e.slice(n, d - 1).match(Vn)),
                h && n > 0 && (p *= Math.pow(oo, h.length)))
              : ((p *= Mc), n > 0 && (p *= Math.pow(oo, d - n))),
        e.charAt(d) !== o.charAt(a) && (p *= Nc)),
      ((p < to && t.charAt(d - 1) === r.charAt(a + 1)) ||
        (r.charAt(a + 1) === r.charAt(a) && t.charAt(d - 1) !== r.charAt(a))) &&
        ((v = co(e, o, t, r, d + 1, a + 2, i)), v * to > p && (p = v * to)),
      p > f && (f = p),
      (d = t.indexOf(l, d + 1)))
  return ((i[c] = f), f)
}
function Cn(e) {
  return e.toLowerCase().replace(Vn, ' ')
}
function Lc(e, o, t) {
  return (
    (e = t && t.length > 0 ? `${e + ' ' + t.join(' ')}` : e),
    co(e, o, Cn(e), Cn(o), 0, 0, {})
  )
}
function y(e, o, { checkForDefaultPrevented: t = !0 } = {}) {
  return function (n) {
    if ((e?.(n), t === !1 || !n.defaultPrevented)) return o?.(n)
  }
}
function $c(e, o) {
  const t = s.createContext(o),
    r = (a) => {
      const { children: i, ...c } = a,
        l = s.useMemo(() => c, Object.values(c))
      return u.jsx(t.Provider, { value: l, children: i })
    }
  r.displayName = e + 'Provider'
  function n(a) {
    const i = s.useContext(t)
    if (i) return i
    if (o !== void 0) return o
    throw new Error(`\`${a}\` must be used within \`${e}\``)
  }
  return [r, n]
}
function ee(e, o = []) {
  let t = []
  function r(a, i) {
    const c = s.createContext(i),
      l = t.length
    t = [...t, i]
    const d = (p) => {
      const { scope: v, children: m, ...h } = p,
        g = v?.[e]?.[l] || c,
        C = s.useMemo(() => h, Object.values(h))
      return u.jsx(g.Provider, { value: C, children: m })
    }
    d.displayName = a + 'Provider'
    function f(p, v) {
      const m = v?.[e]?.[l] || c,
        h = s.useContext(m)
      if (h) return h
      if (i !== void 0) return i
      throw new Error(`\`${p}\` must be used within \`${a}\``)
    }
    return [d, f]
  }
  const n = () => {
    const a = t.map((i) => s.createContext(i))
    return function (c) {
      const l = c?.[e] || a
      return s.useMemo(() => ({ [`__scope${e}`]: { ...c, [e]: l } }), [c, l])
    }
  }
  return ((n.scopeName = e), [r, Fc(n, ...o)])
}
function Fc(...e) {
  const o = e[0]
  if (e.length === 1) return o
  const t = () => {
    const r = e.map((n) => ({ useScope: n(), scopeName: n.scopeName }))
    return function (a) {
      const i = r.reduce((c, { useScope: l, scopeName: d }) => {
        const p = l(a)[`__scope${d}`]
        return { ...c, ...p }
      }, {})
      return s.useMemo(() => ({ [`__scope${o.scopeName}`]: i }), [i])
    }
  }
  return ((t.scopeName = o.scopeName), t)
}
var Y = globalThis?.document ? s.useLayoutEffect : () => {},
  Vc = kn[' useId '.trim().toString()] || (() => {}),
  Gc = 0
function Q(e) {
  const [o, t] = s.useState(Vc())
  return (
    Y(() => {
      t((r) => r ?? String(Gc++))
    }, [e]),
    o ? `radix-${o}` : ''
  )
}
var Bc = kn[' useInsertionEffect '.trim().toString()] || Y
function re({ prop: e, defaultProp: o, onChange: t = () => {}, caller: r }) {
  const [n, a, i] = Kc({ defaultProp: o, onChange: t }),
    c = e !== void 0,
    l = c ? e : n
  {
    const f = s.useRef(e !== void 0)
    s.useEffect(() => {
      const p = f.current
      ;(p !== c &&
        console.warn(
          `${r} is changing from ${p ? 'controlled' : 'uncontrolled'} to ${c ? 'controlled' : 'uncontrolled'}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`,
        ),
        (f.current = c))
    }, [c, r])
  }
  const d = s.useCallback(
    (f) => {
      if (c) {
        const p = Uc(f) ? f(e) : f
        p !== e && i.current?.(p)
      } else a(f)
    },
    [c, e, a, i],
  )
  return [l, d]
}
function Kc({ defaultProp: e, onChange: o }) {
  const [t, r] = s.useState(e),
    n = s.useRef(t),
    a = s.useRef(o)
  return (
    Bc(() => {
      a.current = o
    }, [o]),
    s.useEffect(() => {
      n.current !== t && (a.current?.(t), (n.current = t))
    }, [t, n]),
    [t, r, a]
  )
}
function Uc(e) {
  return typeof e == 'function'
}
var Hc = [
    'a',
    'button',
    'div',
    'form',
    'h2',
    'h3',
    'img',
    'input',
    'label',
    'li',
    'nav',
    'ol',
    'p',
    'select',
    'span',
    'svg',
    'ul',
  ],
  S = Hc.reduce((e, o) => {
    const t = be(`Primitive.${o}`),
      r = s.forwardRef((n, a) => {
        const { asChild: i, ...c } = n,
          l = i ? t : o
        return (
          typeof window < 'u' && (window[Symbol.for('radix-ui')] = !0),
          u.jsx(l, { ...c, ref: a })
        )
      })
    return ((r.displayName = `Primitive.${o}`), { ...e, [o]: r })
  }, {})
function ft(e, o) {
  e && Io.flushSync(() => e.dispatchEvent(o))
}
function W(e) {
  const o = s.useRef(e)
  return (
    s.useEffect(() => {
      o.current = e
    }),
    s.useMemo(
      () =>
        (...t) =>
          o.current?.(...t),
      [],
    )
  )
}
function Wc(e, o = globalThis?.document) {
  const t = W(e)
  s.useEffect(() => {
    const r = (n) => {
      n.key === 'Escape' && t(n)
    }
    return (
      o.addEventListener('keydown', r, { capture: !0 }),
      () => o.removeEventListener('keydown', r, { capture: !0 })
    )
  }, [t, o])
}
var zc = 'DismissableLayer',
  lo = 'dismissableLayer.update',
  Yc = 'dismissableLayer.pointerDownOutside',
  Xc = 'dismissableLayer.focusOutside',
  xn,
  Gn = s.createContext({
    layers: new Set(),
    layersWithOutsidePointerEventsDisabled: new Set(),
    branches: new Set(),
  }),
  je = s.forwardRef((e, o) => {
    const {
        disableOutsidePointerEvents: t = !1,
        onEscapeKeyDown: r,
        onPointerDownOutside: n,
        onFocusOutside: a,
        onInteractOutside: i,
        onDismiss: c,
        ...l
      } = e,
      d = s.useContext(Gn),
      [f, p] = s.useState(null),
      v = f?.ownerDocument ?? globalThis?.document,
      [, m] = s.useState({}),
      h = O(o, (_) => p(_)),
      g = Array.from(d.layers),
      [C] = [...d.layersWithOutsidePointerEventsDisabled].slice(-1),
      w = g.indexOf(C),
      x = f ? g.indexOf(f) : -1,
      b = d.layersWithOutsidePointerEventsDisabled.size > 0,
      E = x >= w,
      I = Jc((_) => {
        const N = _.target,
          A = [...d.branches].some((k) => k.contains(N))
        !E || A || (n?.(_), i?.(_), _.defaultPrevented || c?.())
      }, v),
      T = Qc((_) => {
        const N = _.target
        ;[...d.branches].some((k) => k.contains(N)) || (a?.(_), i?.(_), _.defaultPrevented || c?.())
      }, v)
    return (
      Wc((_) => {
        x === d.layers.size - 1 && (r?.(_), !_.defaultPrevented && c && (_.preventDefault(), c()))
      }, v),
      s.useEffect(() => {
        if (f)
          return (
            t &&
              (d.layersWithOutsidePointerEventsDisabled.size === 0 &&
                ((xn = v.body.style.pointerEvents), (v.body.style.pointerEvents = 'none')),
              d.layersWithOutsidePointerEventsDisabled.add(f)),
            d.layers.add(f),
            wn(),
            () => {
              t &&
                d.layersWithOutsidePointerEventsDisabled.size === 1 &&
                (v.body.style.pointerEvents = xn)
            }
          )
      }, [f, v, t, d]),
      s.useEffect(
        () => () => {
          f && (d.layers.delete(f), d.layersWithOutsidePointerEventsDisabled.delete(f), wn())
        },
        [f, d],
      ),
      s.useEffect(() => {
        const _ = () => m({})
        return (document.addEventListener(lo, _), () => document.removeEventListener(lo, _))
      }, []),
      u.jsx(S.div, {
        ...l,
        ref: h,
        style: { pointerEvents: b ? (E ? 'auto' : 'none') : void 0, ...e.style },
        onFocusCapture: y(e.onFocusCapture, T.onFocusCapture),
        onBlurCapture: y(e.onBlurCapture, T.onBlurCapture),
        onPointerDownCapture: y(e.onPointerDownCapture, I.onPointerDownCapture),
      })
    )
  })
je.displayName = zc
var qc = 'DismissableLayerBranch',
  Zc = s.forwardRef((e, o) => {
    const t = s.useContext(Gn),
      r = s.useRef(null),
      n = O(o, r)
    return (
      s.useEffect(() => {
        const a = r.current
        if (a)
          return (
            t.branches.add(a),
            () => {
              t.branches.delete(a)
            }
          )
      }, [t.branches]),
      u.jsx(S.div, { ...e, ref: n })
    )
  })
Zc.displayName = qc
function Jc(e, o = globalThis?.document) {
  const t = W(e),
    r = s.useRef(!1),
    n = s.useRef(() => {})
  return (
    s.useEffect(() => {
      const a = (c) => {
          if (c.target && !r.current) {
            let l = function () {
              Bn(Yc, t, d, { discrete: !0 })
            }
            const d = { originalEvent: c }
            c.pointerType === 'touch'
              ? (o.removeEventListener('click', n.current),
                (n.current = l),
                o.addEventListener('click', n.current, { once: !0 }))
              : l()
          } else o.removeEventListener('click', n.current)
          r.current = !1
        },
        i = window.setTimeout(() => {
          o.addEventListener('pointerdown', a)
        }, 0)
      return () => {
        ;(window.clearTimeout(i),
          o.removeEventListener('pointerdown', a),
          o.removeEventListener('click', n.current))
      }
    }, [o, t]),
    { onPointerDownCapture: () => (r.current = !0) }
  )
}
function Qc(e, o = globalThis?.document) {
  const t = W(e),
    r = s.useRef(!1)
  return (
    s.useEffect(() => {
      const n = (a) => {
        a.target && !r.current && Bn(Xc, t, { originalEvent: a }, { discrete: !1 })
      }
      return (o.addEventListener('focusin', n), () => o.removeEventListener('focusin', n))
    }, [o, t]),
    { onFocusCapture: () => (r.current = !0), onBlurCapture: () => (r.current = !1) }
  )
}
function wn() {
  const e = new CustomEvent(lo)
  document.dispatchEvent(e)
}
function Bn(e, o, t, { discrete: r }) {
  const n = t.originalEvent.target,
    a = new CustomEvent(e, { bubbles: !1, cancelable: !0, detail: t })
  ;(o && n.addEventListener(e, o, { once: !0 }), r ? ft(n, a) : n.dispatchEvent(a))
}
var no = 'focusScope.autoFocusOnMount',
  ro = 'focusScope.autoFocusOnUnmount',
  bn = { bubbles: !1, cancelable: !0 },
  el = 'FocusScope',
  tt = s.forwardRef((e, o) => {
    const { loop: t = !1, trapped: r = !1, onMountAutoFocus: n, onUnmountAutoFocus: a, ...i } = e,
      [c, l] = s.useState(null),
      d = W(n),
      f = W(a),
      p = s.useRef(null),
      v = O(o, (g) => l(g)),
      m = s.useRef({
        paused: !1,
        pause() {
          this.paused = !0
        },
        resume() {
          this.paused = !1
        },
      }).current
    ;(s.useEffect(() => {
      if (r) {
        let g = function (b) {
            if (m.paused || !c) return
            const E = b.target
            c.contains(E) ? (p.current = E) : xe(p.current, { select: !0 })
          },
          C = function (b) {
            if (m.paused || !c) return
            const E = b.relatedTarget
            E !== null && (c.contains(E) || xe(p.current, { select: !0 }))
          },
          w = function (b) {
            if (document.activeElement === document.body)
              for (const I of b) I.removedNodes.length > 0 && xe(c)
          }
        ;(document.addEventListener('focusin', g), document.addEventListener('focusout', C))
        const x = new MutationObserver(w)
        return (
          c && x.observe(c, { childList: !0, subtree: !0 }),
          () => {
            ;(document.removeEventListener('focusin', g),
              document.removeEventListener('focusout', C),
              x.disconnect())
          }
        )
      }
    }, [r, c, m.paused]),
      s.useEffect(() => {
        if (c) {
          Rn.add(m)
          const g = document.activeElement
          if (!c.contains(g)) {
            const w = new CustomEvent(no, bn)
            ;(c.addEventListener(no, d),
              c.dispatchEvent(w),
              w.defaultPrevented ||
                (tl(sl(Kn(c)), { select: !0 }), document.activeElement === g && xe(c)))
          }
          return () => {
            ;(c.removeEventListener(no, d),
              setTimeout(() => {
                const w = new CustomEvent(ro, bn)
                ;(c.addEventListener(ro, f),
                  c.dispatchEvent(w),
                  w.defaultPrevented || xe(g ?? document.body, { select: !0 }),
                  c.removeEventListener(ro, f),
                  Rn.remove(m))
              }, 0))
          }
        }
      }, [c, d, f, m]))
    const h = s.useCallback(
      (g) => {
        if ((!t && !r) || m.paused) return
        const C = g.key === 'Tab' && !g.altKey && !g.ctrlKey && !g.metaKey,
          w = document.activeElement
        if (C && w) {
          const x = g.currentTarget,
            [b, E] = ol(x)
          b && E
            ? !g.shiftKey && w === E
              ? (g.preventDefault(), t && xe(b, { select: !0 }))
              : g.shiftKey && w === b && (g.preventDefault(), t && xe(E, { select: !0 }))
            : w === x && g.preventDefault()
        }
      },
      [t, r, m.paused],
    )
    return u.jsx(S.div, { tabIndex: -1, ...i, ref: v, onKeyDown: h })
  })
tt.displayName = el
function tl(e, { select: o = !1 } = {}) {
  const t = document.activeElement
  for (const r of e) if ((xe(r, { select: o }), document.activeElement !== t)) return
}
function ol(e) {
  const o = Kn(e),
    t = yn(o, e),
    r = yn(o.reverse(), e)
  return [t, r]
}
function Kn(e) {
  const o = [],
    t = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (r) => {
        const n = r.tagName === 'INPUT' && r.type === 'hidden'
        return r.disabled || r.hidden || n
          ? NodeFilter.FILTER_SKIP
          : r.tabIndex >= 0
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP
      },
    })
  for (; t.nextNode(); ) o.push(t.currentNode)
  return o
}
function yn(e, o) {
  for (const t of e) if (!nl(t, { upTo: o })) return t
}
function nl(e, { upTo: o }) {
  if (getComputedStyle(e).visibility === 'hidden') return !0
  for (; e; ) {
    if (o !== void 0 && e === o) return !1
    if (getComputedStyle(e).display === 'none') return !0
    e = e.parentElement
  }
  return !1
}
function rl(e) {
  return e instanceof HTMLInputElement && 'select' in e
}
function xe(e, { select: o = !1 } = {}) {
  if (e && e.focus) {
    const t = document.activeElement
    ;(e.focus({ preventScroll: !0 }), e !== t && rl(e) && o && e.select())
  }
}
var Rn = al()
function al() {
  let e = []
  return {
    add(o) {
      const t = e[0]
      ;(o !== t && t?.pause(), (e = En(e, o)), e.unshift(o))
    },
    remove(o) {
      ;((e = En(e, o)), e[0]?.resume())
    },
  }
}
function En(e, o) {
  const t = [...e],
    r = t.indexOf(o)
  return (r !== -1 && t.splice(r, 1), t)
}
function sl(e) {
  return e.filter((o) => o.tagName !== 'A')
}
var il = 'Portal',
  We = s.forwardRef((e, o) => {
    const { container: t, ...r } = e,
      [n, a] = s.useState(!1)
    Y(() => a(!0), [])
    const i = t || (n && globalThis?.document?.body)
    return i ? Ln.createPortal(u.jsx(S.div, { ...r, ref: o }), i) : null
  })
We.displayName = il
function cl(e, o) {
  return s.useReducer((t, r) => o[t][r] ?? t, e)
}
var X = (e) => {
  const { present: o, children: t } = e,
    r = ll(o),
    n = typeof t == 'function' ? t({ present: r.isPresent }) : s.Children.only(t),
    a = O(r.ref, ul(n))
  return typeof t == 'function' || r.isPresent ? s.cloneElement(n, { ref: a }) : null
}
X.displayName = 'Presence'
function ll(e) {
  const [o, t] = s.useState(),
    r = s.useRef(null),
    n = s.useRef(e),
    a = s.useRef('none'),
    i = e ? 'mounted' : 'unmounted',
    [c, l] = cl(i, {
      mounted: { UNMOUNT: 'unmounted', ANIMATION_OUT: 'unmountSuspended' },
      unmountSuspended: { MOUNT: 'mounted', ANIMATION_END: 'unmounted' },
      unmounted: { MOUNT: 'mounted' },
    })
  return (
    s.useEffect(() => {
      const d = ut(r.current)
      a.current = c === 'mounted' ? d : 'none'
    }, [c]),
    Y(() => {
      const d = r.current,
        f = n.current
      if (f !== e) {
        const v = a.current,
          m = ut(d)
        ;(e
          ? l('MOUNT')
          : m === 'none' || d?.display === 'none'
            ? l('UNMOUNT')
            : l(f && v !== m ? 'ANIMATION_OUT' : 'UNMOUNT'),
          (n.current = e))
      }
    }, [e, l]),
    Y(() => {
      if (o) {
        let d
        const f = o.ownerDocument.defaultView ?? window,
          p = (m) => {
            const g = ut(r.current).includes(CSS.escape(m.animationName))
            if (m.target === o && g && (l('ANIMATION_END'), !n.current)) {
              const C = o.style.animationFillMode
              ;((o.style.animationFillMode = 'forwards'),
                (d = f.setTimeout(() => {
                  o.style.animationFillMode === 'forwards' && (o.style.animationFillMode = C)
                })))
            }
          },
          v = (m) => {
            m.target === o && (a.current = ut(r.current))
          }
        return (
          o.addEventListener('animationstart', v),
          o.addEventListener('animationcancel', p),
          o.addEventListener('animationend', p),
          () => {
            ;(f.clearTimeout(d),
              o.removeEventListener('animationstart', v),
              o.removeEventListener('animationcancel', p),
              o.removeEventListener('animationend', p))
          }
        )
      } else l('ANIMATION_END')
    }, [o, l]),
    {
      isPresent: ['mounted', 'unmountSuspended'].includes(c),
      ref: s.useCallback((d) => {
        ;((r.current = d ? getComputedStyle(d) : null), t(d))
      }, []),
    }
  )
}
function ut(e) {
  return e?.animationName || 'none'
}
function ul(e) {
  let o = Object.getOwnPropertyDescriptor(e.props, 'ref')?.get,
    t = o && 'isReactWarning' in o && o.isReactWarning
  return t
    ? e.ref
    : ((o = Object.getOwnPropertyDescriptor(e, 'ref')?.get),
      (t = o && 'isReactWarning' in o && o.isReactWarning),
      t ? e.props.ref : e.props.ref || e.ref)
}
var ao = 0
function St() {
  s.useEffect(() => {
    const e = document.querySelectorAll('[data-radix-focus-guard]')
    return (
      document.body.insertAdjacentElement('afterbegin', e[0] ?? Sn()),
      document.body.insertAdjacentElement('beforeend', e[1] ?? Sn()),
      ao++,
      () => {
        ;(ao === 1 &&
          document.querySelectorAll('[data-radix-focus-guard]').forEach((o) => o.remove()),
          ao--)
      }
    )
  }, [])
}
function Sn() {
  const e = document.createElement('span')
  return (
    e.setAttribute('data-radix-focus-guard', ''),
    (e.tabIndex = 0),
    (e.style.outline = 'none'),
    (e.style.opacity = '0'),
    (e.style.position = 'fixed'),
    (e.style.pointerEvents = 'none'),
    e
  )
}
var Pt = 'Dialog',
  [Un, Hn] = ee(Pt),
  [dl, pe] = Un(Pt),
  Wn = (e) => {
    const {
        __scopeDialog: o,
        children: t,
        open: r,
        defaultOpen: n,
        onOpenChange: a,
        modal: i = !0,
      } = e,
      c = s.useRef(null),
      l = s.useRef(null),
      [d, f] = re({ prop: r, defaultProp: n ?? !1, onChange: a, caller: Pt })
    return u.jsx(dl, {
      scope: o,
      triggerRef: c,
      contentRef: l,
      contentId: Q(),
      titleId: Q(),
      descriptionId: Q(),
      open: d,
      onOpenChange: f,
      onOpenToggle: s.useCallback(() => f((p) => !p), [f]),
      modal: i,
      children: t,
    })
  }
Wn.displayName = Pt
var zn = 'DialogTrigger',
  Yn = s.forwardRef((e, o) => {
    const { __scopeDialog: t, ...r } = e,
      n = pe(zn, t),
      a = O(o, n.triggerRef)
    return u.jsx(S.button, {
      type: 'button',
      'aria-haspopup': 'dialog',
      'aria-expanded': n.open,
      'aria-controls': n.contentId,
      'data-state': Mo(n.open),
      ...r,
      ref: a,
      onClick: y(e.onClick, n.onOpenToggle),
    })
  })
Yn.displayName = zn
var To = 'DialogPortal',
  [fl, Xn] = Un(To, { forceMount: void 0 }),
  qn = (e) => {
    const { __scopeDialog: o, forceMount: t, children: r, container: n } = e,
      a = pe(To, o)
    return u.jsx(fl, {
      scope: o,
      forceMount: t,
      children: s.Children.map(r, (i) =>
        u.jsx(X, {
          present: t || a.open,
          children: u.jsx(We, { asChild: !0, container: n, children: i }),
        }),
      ),
    })
  }
qn.displayName = To
var pt = 'DialogOverlay',
  Zn = s.forwardRef((e, o) => {
    const t = Xn(pt, e.__scopeDialog),
      { forceMount: r = t.forceMount, ...n } = e,
      a = pe(pt, e.__scopeDialog)
    return a.modal
      ? u.jsx(X, { present: r || a.open, children: u.jsx(vl, { ...n, ref: o }) })
      : null
  })
Zn.displayName = pt
var pl = be('DialogOverlay.RemoveScroll'),
  vl = s.forwardRef((e, o) => {
    const { __scopeDialog: t, ...r } = e,
      n = pe(pt, t)
    return u.jsx(Rt, {
      as: pl,
      allowPinchZoom: !0,
      shards: [n.contentRef],
      children: u.jsx(S.div, {
        'data-state': Mo(n.open),
        ...r,
        ref: o,
        style: { pointerEvents: 'auto', ...r.style },
      }),
    })
  }),
  Me = 'DialogContent',
  Jn = s.forwardRef((e, o) => {
    const t = Xn(Me, e.__scopeDialog),
      { forceMount: r = t.forceMount, ...n } = e,
      a = pe(Me, e.__scopeDialog)
    return u.jsx(X, {
      present: r || a.open,
      children: a.modal ? u.jsx(ml, { ...n, ref: o }) : u.jsx(gl, { ...n, ref: o }),
    })
  })
Jn.displayName = Me
var ml = s.forwardRef((e, o) => {
    const t = pe(Me, e.__scopeDialog),
      r = s.useRef(null),
      n = O(o, t.contentRef, r)
    return (
      s.useEffect(() => {
        const a = r.current
        if (a) return Et(a)
      }, []),
      u.jsx(Qn, {
        ...e,
        ref: n,
        trapFocus: t.open,
        disableOutsidePointerEvents: !0,
        onCloseAutoFocus: y(e.onCloseAutoFocus, (a) => {
          ;(a.preventDefault(), t.triggerRef.current?.focus())
        }),
        onPointerDownOutside: y(e.onPointerDownOutside, (a) => {
          const i = a.detail.originalEvent,
            c = i.button === 0 && i.ctrlKey === !0
          ;(i.button === 2 || c) && a.preventDefault()
        }),
        onFocusOutside: y(e.onFocusOutside, (a) => a.preventDefault()),
      })
    )
  }),
  gl = s.forwardRef((e, o) => {
    const t = pe(Me, e.__scopeDialog),
      r = s.useRef(!1),
      n = s.useRef(!1)
    return u.jsx(Qn, {
      ...e,
      ref: o,
      trapFocus: !1,
      disableOutsidePointerEvents: !1,
      onCloseAutoFocus: (a) => {
        ;(e.onCloseAutoFocus?.(a),
          a.defaultPrevented || (r.current || t.triggerRef.current?.focus(), a.preventDefault()),
          (r.current = !1),
          (n.current = !1))
      },
      onInteractOutside: (a) => {
        ;(e.onInteractOutside?.(a),
          a.defaultPrevented ||
            ((r.current = !0), a.detail.originalEvent.type === 'pointerdown' && (n.current = !0)))
        const i = a.target
        ;(t.triggerRef.current?.contains(i) && a.preventDefault(),
          a.detail.originalEvent.type === 'focusin' && n.current && a.preventDefault())
      },
    })
  }),
  Qn = s.forwardRef((e, o) => {
    const { __scopeDialog: t, trapFocus: r, onOpenAutoFocus: n, onCloseAutoFocus: a, ...i } = e,
      c = pe(Me, t),
      l = s.useRef(null),
      d = O(o, l)
    return (
      St(),
      u.jsxs(u.Fragment, {
        children: [
          u.jsx(tt, {
            asChild: !0,
            loop: !0,
            trapped: r,
            onMountAutoFocus: n,
            onUnmountAutoFocus: a,
            children: u.jsx(je, {
              role: 'dialog',
              id: c.contentId,
              'aria-describedby': c.descriptionId,
              'aria-labelledby': c.titleId,
              'data-state': Mo(c.open),
              ...i,
              ref: d,
              onDismiss: () => c.onOpenChange(!1),
            }),
          }),
          u.jsxs(u.Fragment, {
            children: [
              u.jsx(Cl, { titleId: c.titleId }),
              u.jsx(wl, { contentRef: l, descriptionId: c.descriptionId }),
            ],
          }),
        ],
      })
    )
  }),
  Ao = 'DialogTitle',
  er = s.forwardRef((e, o) => {
    const { __scopeDialog: t, ...r } = e,
      n = pe(Ao, t)
    return u.jsx(S.h2, { id: n.titleId, ...r, ref: o })
  })
er.displayName = Ao
var tr = 'DialogDescription',
  or = s.forwardRef((e, o) => {
    const { __scopeDialog: t, ...r } = e,
      n = pe(tr, t)
    return u.jsx(S.p, { id: n.descriptionId, ...r, ref: o })
  })
or.displayName = tr
var nr = 'DialogClose',
  rr = s.forwardRef((e, o) => {
    const { __scopeDialog: t, ...r } = e,
      n = pe(nr, t)
    return u.jsx(S.button, {
      type: 'button',
      ...r,
      ref: o,
      onClick: y(e.onClick, () => n.onOpenChange(!1)),
    })
  })
rr.displayName = nr
function Mo(e) {
  return e ? 'open' : 'closed'
}
var ar = 'DialogTitleWarning',
  [hl, sr] = $c(ar, { contentName: Me, titleName: Ao, docsSlug: 'dialog' }),
  Cl = ({ titleId: e }) => {
    const o = sr(ar),
      t = `\`${o.contentName}\` requires a \`${o.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${o.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${o.docsSlug}`
    return (
      s.useEffect(() => {
        e && (document.getElementById(e) || console.error(t))
      }, [t, e]),
      null
    )
  },
  xl = 'DialogDescriptionWarning',
  wl = ({ contentRef: e, descriptionId: o }) => {
    const r = `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${sr(xl).contentName}}.`
    return (
      s.useEffect(() => {
        const n = e.current?.getAttribute('aria-describedby')
        o && n && (document.getElementById(o) || console.warn(r))
      }, [r, e, o]),
      null
    )
  },
  ir = Wn,
  bl = Yn,
  cr = qn,
  lr = Zn,
  ur = Jn,
  yl = er,
  Rl = or,
  dr = rr,
  Xe = '[cmdk-group=""]',
  so = '[cmdk-group-items=""]',
  El = '[cmdk-group-heading=""]',
  fr = '[cmdk-item=""]',
  Pn = `${fr}:not([aria-disabled="true"])`,
  uo = 'cmdk-item-select',
  Fe = 'data-value',
  Sl = (e, o, t) => Lc(e, o, t),
  pr = s.createContext(void 0),
  ot = () => s.useContext(pr),
  vr = s.createContext(void 0),
  No = () => s.useContext(vr),
  mr = s.createContext(void 0),
  gr = s.forwardRef((e, o) => {
    let t = Ve(() => {
        var R, j
        return {
          search: '',
          value: (j = (R = e.value) != null ? R : e.defaultValue) != null ? j : '',
          selectedItemId: void 0,
          filtered: { count: 0, items: new Map(), groups: new Set() },
        }
      }),
      r = Ve(() => new Set()),
      n = Ve(() => new Map()),
      a = Ve(() => new Map()),
      i = Ve(() => new Set()),
      c = hr(e),
      {
        label: l,
        children: d,
        value: f,
        onValueChange: p,
        filter: v,
        shouldFilter: m,
        loop: h,
        disablePointerSelection: g = !1,
        vimBindings: C = !0,
        ...w
      } = e,
      x = Q(),
      b = Q(),
      E = Q(),
      I = s.useRef(null),
      T = kl()
    ;(Ne(() => {
      if (f !== void 0) {
        let R = f.trim()
        ;((t.current.value = R), _.emit())
      }
    }, [f]),
      Ne(() => {
        T(6, te)
      }, []))
    let _ = s.useMemo(
        () => ({
          subscribe: (R) => (i.current.add(R), () => i.current.delete(R)),
          snapshot: () => t.current,
          setState: (R, j, L) => {
            var M, $, P, F
            if (!Object.is(t.current[R], j)) {
              if (((t.current[R] = j), R === 'search')) (Z(), k(), T(1, V))
              else if (R === 'value') {
                if (
                  document.activeElement.hasAttribute('cmdk-input') ||
                  document.activeElement.hasAttribute('cmdk-root')
                ) {
                  let G = document.getElementById(E)
                  G ? G.focus() : (M = document.getElementById(x)) == null || M.focus()
                }
                if (
                  (T(7, () => {
                    var G
                    ;((t.current.selectedItemId = (G = q()) == null ? void 0 : G.id), _.emit())
                  }),
                  L || T(5, te),
                  (($ = c.current) == null ? void 0 : $.value) !== void 0)
                ) {
                  let G = j ?? ''
                  ;(F = (P = c.current).onValueChange) == null || F.call(P, G)
                  return
                }
              }
              _.emit()
            }
          },
          emit: () => {
            i.current.forEach((R) => R())
          },
        }),
        [],
      ),
      N = s.useMemo(
        () => ({
          value: (R, j, L) => {
            var M
            j !== ((M = a.current.get(R)) == null ? void 0 : M.value) &&
              (a.current.set(R, { value: j, keywords: L }),
              t.current.filtered.items.set(R, A(j, L)),
              T(2, () => {
                ;(k(), _.emit())
              }))
          },
          item: (R, j) => (
            r.current.add(R),
            j && (n.current.has(j) ? n.current.get(j).add(R) : n.current.set(j, new Set([R]))),
            T(3, () => {
              ;(Z(), k(), t.current.value || V(), _.emit())
            }),
            () => {
              ;(a.current.delete(R), r.current.delete(R), t.current.filtered.items.delete(R))
              let L = q()
              T(4, () => {
                ;(Z(), L?.getAttribute('id') === R && V(), _.emit())
              })
            }
          ),
          group: (R) => (
            n.current.has(R) || n.current.set(R, new Set()),
            () => {
              ;(a.current.delete(R), n.current.delete(R))
            }
          ),
          filter: () => c.current.shouldFilter,
          label: l || e['aria-label'],
          getDisablePointerSelection: () => c.current.disablePointerSelection,
          listId: x,
          inputId: E,
          labelId: b,
          listInnerRef: I,
        }),
        [],
      )
    function A(R, j) {
      var L, M
      let $ = (M = (L = c.current) == null ? void 0 : L.filter) != null ? M : Sl
      return R ? $(R, t.current.search, j) : 0
    }
    function k() {
      if (!t.current.search || c.current.shouldFilter === !1) return
      let R = t.current.filtered.items,
        j = []
      t.current.filtered.groups.forEach((M) => {
        let $ = n.current.get(M),
          P = 0
        ;($.forEach((F) => {
          let G = R.get(F)
          P = Math.max(G, P)
        }),
          j.push([M, P]))
      })
      let L = I.current
      ;(J()
        .sort((M, $) => {
          var P, F
          let G = M.getAttribute('id'),
            U = $.getAttribute('id')
          return ((P = R.get(U)) != null ? P : 0) - ((F = R.get(G)) != null ? F : 0)
        })
        .forEach((M) => {
          let $ = M.closest(so)
          $
            ? $.appendChild(M.parentElement === $ ? M : M.closest(`${so} > *`))
            : L.appendChild(M.parentElement === L ? M : M.closest(`${so} > *`))
        }),
        j
          .sort((M, $) => $[1] - M[1])
          .forEach((M) => {
            var $
            let P =
              ($ = I.current) == null
                ? void 0
                : $.querySelector(`${Xe}[${Fe}="${encodeURIComponent(M[0])}"]`)
            P?.parentElement.appendChild(P)
          }))
    }
    function V() {
      let R = J().find((L) => L.getAttribute('aria-disabled') !== 'true'),
        j = R?.getAttribute(Fe)
      _.setState('value', j || void 0)
    }
    function Z() {
      var R, j, L, M
      if (!t.current.search || c.current.shouldFilter === !1) {
        t.current.filtered.count = r.current.size
        return
      }
      t.current.filtered.groups = new Set()
      let $ = 0
      for (let P of r.current) {
        let F = (j = (R = a.current.get(P)) == null ? void 0 : R.value) != null ? j : '',
          G = (M = (L = a.current.get(P)) == null ? void 0 : L.keywords) != null ? M : [],
          U = A(F, G)
        ;(t.current.filtered.items.set(P, U), U > 0 && $++)
      }
      for (let [P, F] of n.current)
        for (let G of F)
          if (t.current.filtered.items.get(G) > 0) {
            t.current.filtered.groups.add(P)
            break
          }
      t.current.filtered.count = $
    }
    function te() {
      var R, j, L
      let M = q()
      M &&
        (((R = M.parentElement) == null ? void 0 : R.firstChild) === M &&
          ((L = (j = M.closest(Xe)) == null ? void 0 : j.querySelector(El)) == null ||
            L.scrollIntoView({ block: 'nearest' })),
        M.scrollIntoView({ block: 'nearest' }))
    }
    function q() {
      var R
      return (R = I.current) == null ? void 0 : R.querySelector(`${fr}[aria-selected="true"]`)
    }
    function J() {
      var R
      return Array.from(((R = I.current) == null ? void 0 : R.querySelectorAll(Pn)) || [])
    }
    function K(R) {
      let j = J()[R]
      j && _.setState('value', j.getAttribute(Fe))
    }
    function oe(R) {
      var j
      let L = q(),
        M = J(),
        $ = M.findIndex((F) => F === L),
        P = M[$ + R]
      ;((j = c.current) != null &&
        j.loop &&
        (P = $ + R < 0 ? M[M.length - 1] : $ + R === M.length ? M[0] : M[$ + R]),
        P && _.setState('value', P.getAttribute(Fe)))
    }
    function H(R) {
      let j = q(),
        L = j?.closest(Xe),
        M
      for (; L && !M; ) ((L = R > 0 ? Ol(L, Xe) : jl(L, Xe)), (M = L?.querySelector(Pn)))
      M ? _.setState('value', M.getAttribute(Fe)) : oe(R)
    }
    let D = () => K(J().length - 1),
      se = (R) => {
        ;(R.preventDefault(), R.metaKey ? D() : R.altKey ? H(1) : oe(1))
      },
      ae = (R) => {
        ;(R.preventDefault(), R.metaKey ? K(0) : R.altKey ? H(-1) : oe(-1))
      }
    return s.createElement(
      S.div,
      {
        ref: o,
        tabIndex: -1,
        ...w,
        'cmdk-root': '',
        onKeyDown: (R) => {
          var j
          ;(j = w.onKeyDown) == null || j.call(w, R)
          let L = R.nativeEvent.isComposing || R.keyCode === 229
          if (!(R.defaultPrevented || L))
            switch (R.key) {
              case 'n':
              case 'j': {
                C && R.ctrlKey && se(R)
                break
              }
              case 'ArrowDown': {
                se(R)
                break
              }
              case 'p':
              case 'k': {
                C && R.ctrlKey && ae(R)
                break
              }
              case 'ArrowUp': {
                ae(R)
                break
              }
              case 'Home': {
                ;(R.preventDefault(), K(0))
                break
              }
              case 'End': {
                ;(R.preventDefault(), D())
                break
              }
              case 'Enter': {
                R.preventDefault()
                let M = q()
                if (M) {
                  let $ = new Event(uo)
                  M.dispatchEvent($)
                }
              }
            }
        },
      },
      s.createElement(
        'label',
        { 'cmdk-label': '', htmlFor: N.inputId, id: N.labelId, style: $l },
        l,
      ),
      _t(e, (R) =>
        s.createElement(vr.Provider, { value: _ }, s.createElement(pr.Provider, { value: N }, R)),
      ),
    )
  }),
  Pl = s.forwardRef((e, o) => {
    var t, r
    let n = Q(),
      a = s.useRef(null),
      i = s.useContext(mr),
      c = ot(),
      l = hr(e),
      d = (r = (t = l.current) == null ? void 0 : t.forceMount) != null ? r : i?.forceMount
    Ne(() => {
      if (!d) return c.item(n, i?.id)
    }, [d])
    let f = Cr(n, a, [e.value, e.children, a], e.keywords),
      p = No(),
      v = ye((T) => T.value && T.value === f.current),
      m = ye((T) => (d || c.filter() === !1 ? !0 : T.search ? T.filtered.items.get(n) > 0 : !0))
    s.useEffect(() => {
      let T = a.current
      if (!(!T || e.disabled))
        return (T.addEventListener(uo, h), () => T.removeEventListener(uo, h))
    }, [m, e.onSelect, e.disabled])
    function h() {
      var T, _
      ;(g(), (_ = (T = l.current).onSelect) == null || _.call(T, f.current))
    }
    function g() {
      p.setState('value', f.current, !0)
    }
    if (!m) return null
    let { disabled: C, value: w, onSelect: x, forceMount: b, keywords: E, ...I } = e
    return s.createElement(
      S.div,
      {
        ref: me(a, o),
        ...I,
        id: n,
        'cmdk-item': '',
        role: 'option',
        'aria-disabled': !!C,
        'aria-selected': !!v,
        'data-disabled': !!C,
        'data-selected': !!v,
        onPointerMove: C || c.getDisablePointerSelection() ? void 0 : g,
        onClick: C ? void 0 : h,
      },
      e.children,
    )
  }),
  _l = s.forwardRef((e, o) => {
    let { heading: t, children: r, forceMount: n, ...a } = e,
      i = Q(),
      c = s.useRef(null),
      l = s.useRef(null),
      d = Q(),
      f = ot(),
      p = ye((m) => (n || f.filter() === !1 ? !0 : m.search ? m.filtered.groups.has(i) : !0))
    ;(Ne(() => f.group(i), []), Cr(i, c, [e.value, e.heading, l]))
    let v = s.useMemo(() => ({ id: i, forceMount: n }), [n])
    return s.createElement(
      S.div,
      { ref: me(c, o), ...a, 'cmdk-group': '', role: 'presentation', hidden: p ? void 0 : !0 },
      t &&
        s.createElement('div', { ref: l, 'cmdk-group-heading': '', 'aria-hidden': !0, id: d }, t),
      _t(e, (m) =>
        s.createElement(
          'div',
          { 'cmdk-group-items': '', role: 'group', 'aria-labelledby': t ? d : void 0 },
          s.createElement(mr.Provider, { value: v }, m),
        ),
      ),
    )
  }),
  Il = s.forwardRef((e, o) => {
    let { alwaysRender: t, ...r } = e,
      n = s.useRef(null),
      a = ye((i) => !i.search)
    return !t && !a
      ? null
      : s.createElement(S.div, { ref: me(n, o), ...r, 'cmdk-separator': '', role: 'separator' })
  }),
  Tl = s.forwardRef((e, o) => {
    let { onValueChange: t, ...r } = e,
      n = e.value != null,
      a = No(),
      i = ye((d) => d.search),
      c = ye((d) => d.selectedItemId),
      l = ot()
    return (
      s.useEffect(() => {
        e.value != null && a.setState('search', e.value)
      }, [e.value]),
      s.createElement(S.input, {
        ref: o,
        ...r,
        'cmdk-input': '',
        autoComplete: 'off',
        autoCorrect: 'off',
        spellCheck: !1,
        'aria-autocomplete': 'list',
        role: 'combobox',
        'aria-expanded': !0,
        'aria-controls': l.listId,
        'aria-labelledby': l.labelId,
        'aria-activedescendant': c,
        id: l.inputId,
        type: 'text',
        value: n ? e.value : i,
        onChange: (d) => {
          ;(n || a.setState('search', d.target.value), t?.(d.target.value))
        },
      })
    )
  }),
  Al = s.forwardRef((e, o) => {
    let { children: t, label: r = 'Suggestions', ...n } = e,
      a = s.useRef(null),
      i = s.useRef(null),
      c = ye((d) => d.selectedItemId),
      l = ot()
    return (
      s.useEffect(() => {
        if (i.current && a.current) {
          let d = i.current,
            f = a.current,
            p,
            v = new ResizeObserver(() => {
              p = requestAnimationFrame(() => {
                let m = d.offsetHeight
                f.style.setProperty('--cmdk-list-height', m.toFixed(1) + 'px')
              })
            })
          return (
            v.observe(d),
            () => {
              ;(cancelAnimationFrame(p), v.unobserve(d))
            }
          )
        }
      }, []),
      s.createElement(
        S.div,
        {
          ref: me(a, o),
          ...n,
          'cmdk-list': '',
          role: 'listbox',
          tabIndex: -1,
          'aria-activedescendant': c,
          'aria-label': r,
          id: l.listId,
        },
        _t(e, (d) =>
          s.createElement('div', { ref: me(i, l.listInnerRef), 'cmdk-list-sizer': '' }, d),
        ),
      )
    )
  }),
  Ml = s.forwardRef((e, o) => {
    let {
      open: t,
      onOpenChange: r,
      overlayClassName: n,
      contentClassName: a,
      container: i,
      ...c
    } = e
    return s.createElement(
      ir,
      { open: t, onOpenChange: r },
      s.createElement(
        cr,
        { container: i },
        s.createElement(lr, { 'cmdk-overlay': '', className: n }),
        s.createElement(
          ur,
          { 'aria-label': e.label, 'cmdk-dialog': '', className: a },
          s.createElement(gr, { ref: o, ...c }),
        ),
      ),
    )
  }),
  Nl = s.forwardRef((e, o) =>
    ye((t) => t.filtered.count === 0)
      ? s.createElement(S.div, { ref: o, ...e, 'cmdk-empty': '', role: 'presentation' })
      : null,
  ),
  Dl = s.forwardRef((e, o) => {
    let { progress: t, children: r, label: n = 'Loading...', ...a } = e
    return s.createElement(
      S.div,
      {
        ref: o,
        ...a,
        'cmdk-loading': '',
        role: 'progressbar',
        'aria-valuenow': t,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-label': n,
      },
      _t(e, (i) => s.createElement('div', { 'aria-hidden': !0 }, i)),
    )
  }),
  ev = Object.assign(gr, {
    List: Al,
    Item: Pl,
    Input: Tl,
    Group: _l,
    Separator: Il,
    Dialog: Ml,
    Empty: Nl,
    Loading: Dl,
  })
function Ol(e, o) {
  let t = e.nextElementSibling
  for (; t; ) {
    if (t.matches(o)) return t
    t = t.nextElementSibling
  }
}
function jl(e, o) {
  let t = e.previousElementSibling
  for (; t; ) {
    if (t.matches(o)) return t
    t = t.previousElementSibling
  }
}
function hr(e) {
  let o = s.useRef(e)
  return (
    Ne(() => {
      o.current = e
    }),
    o
  )
}
var Ne = typeof window > 'u' ? s.useEffect : s.useLayoutEffect
function Ve(e) {
  let o = s.useRef()
  return (o.current === void 0 && (o.current = e()), o)
}
function ye(e) {
  let o = No(),
    t = () => e(o.snapshot())
  return s.useSyncExternalStore(o.subscribe, t, t)
}
function Cr(e, o, t, r = []) {
  let n = s.useRef(),
    a = ot()
  return (
    Ne(() => {
      var i
      let c = (() => {
          var d
          for (let f of t) {
            if (typeof f == 'string') return f.trim()
            if (typeof f == 'object' && 'current' in f)
              return f.current
                ? (d = f.current.textContent) == null
                  ? void 0
                  : d.trim()
                : n.current
          }
        })(),
        l = r.map((d) => d.trim())
      ;(a.value(e, c, l), (i = o.current) == null || i.setAttribute(Fe, c), (n.current = c))
    }),
    n
  )
}
var kl = () => {
  let [e, o] = s.useState(),
    t = Ve(() => new Map())
  return (
    Ne(() => {
      ;(t.current.forEach((r) => r()), (t.current = new Map()))
    }, [e]),
    (r, n) => {
      ;(t.current.set(r, n), o({}))
    }
  )
}
function Ll(e) {
  let o = e.type
  return typeof o == 'function' ? o(e.props) : 'render' in o ? o.render(e.props) : e
}
function _t({ asChild: e, children: o }, t) {
  return e && s.isValidElement(o)
    ? s.cloneElement(Ll(o), { ref: o.ref }, t(o.props.children))
    : t(o)
}
var $l = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0',
}
function Re(e, o) {
  if (e == null) return {}
  var t = {},
    r = Object.keys(e),
    n,
    a
  for (a = 0; a < r.length; a++) ((n = r[a]), !(o.indexOf(n) >= 0) && (t[n] = e[n]))
  return t
}
var Fl = ['color'],
  tv = s.forwardRef(function (e, o) {
    var t = e.color,
      r = t === void 0 ? 'currentColor' : t,
      n = Re(e, Fl)
    return s.createElement(
      'svg',
      Object.assign(
        {
          width: '15',
          height: '15',
          viewBox: '0 0 15 15',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
        },
        n,
        { ref: o },
      ),
      s.createElement('path', {
        d: 'M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z',
        fill: r,
        fillRule: 'evenodd',
        clipRule: 'evenodd',
      }),
    )
  }),
  Vl = ['color'],
  ov = s.forwardRef(function (e, o) {
    var t = e.color,
      r = t === void 0 ? 'currentColor' : t,
      n = Re(e, Vl)
    return s.createElement(
      'svg',
      Object.assign(
        {
          width: '15',
          height: '15',
          viewBox: '0 0 15 15',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
        },
        n,
        { ref: o },
      ),
      s.createElement('path', {
        d: 'M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z',
        fill: r,
        fillRule: 'evenodd',
        clipRule: 'evenodd',
      }),
    )
  }),
  Gl = ['color'],
  nv = s.forwardRef(function (e, o) {
    var t = e.color,
      r = t === void 0 ? 'currentColor' : t,
      n = Re(e, Gl)
    return s.createElement(
      'svg',
      Object.assign(
        {
          width: '15',
          height: '15',
          viewBox: '0 0 15 15',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
        },
        n,
        { ref: o },
      ),
      s.createElement('path', {
        d: 'M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z',
        fill: r,
        fillRule: 'evenodd',
        clipRule: 'evenodd',
      }),
    )
  }),
  Bl = ['color'],
  rv = s.forwardRef(function (e, o) {
    var t = e.color,
      r = t === void 0 ? 'currentColor' : t,
      n = Re(e, Bl)
    return s.createElement(
      'svg',
      Object.assign(
        {
          width: '15',
          height: '15',
          viewBox: '0 0 15 15',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
        },
        n,
        { ref: o },
      ),
      s.createElement('path', {
        d: 'M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z',
        fill: r,
        fillRule: 'evenodd',
        clipRule: 'evenodd',
      }),
    )
  }),
  Kl = ['color'],
  av = s.forwardRef(function (e, o) {
    var t = e.color,
      r = t === void 0 ? 'currentColor' : t,
      n = Re(e, Kl)
    return s.createElement(
      'svg',
      Object.assign(
        {
          width: '15',
          height: '15',
          viewBox: '0 0 15 15',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
        },
        n,
        { ref: o },
      ),
      s.createElement('path', {
        d: 'M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z',
        fill: r,
        fillRule: 'evenodd',
        clipRule: 'evenodd',
      }),
    )
  }),
  Ul = ['color'],
  sv = s.forwardRef(function (e, o) {
    var t = e.color,
      r = t === void 0 ? 'currentColor' : t,
      n = Re(e, Ul)
    return s.createElement(
      'svg',
      Object.assign(
        {
          width: '15',
          height: '15',
          viewBox: '0 0 15 15',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
        },
        n,
        { ref: o },
      ),
      s.createElement('path', {
        d: 'M9.875 7.5C9.875 8.81168 8.81168 9.875 7.5 9.875C6.18832 9.875 5.125 8.81168 5.125 7.5C5.125 6.18832 6.18832 5.125 7.5 5.125C8.81168 5.125 9.875 6.18832 9.875 7.5Z',
        fill: r,
      }),
    )
  }),
  Hl = ['color'],
  iv = s.forwardRef(function (e, o) {
    var t = e.color,
      r = t === void 0 ? 'currentColor' : t,
      n = Re(e, Hl)
    return s.createElement(
      'svg',
      Object.assign(
        {
          width: '15',
          height: '15',
          viewBox: '0 0 15 15',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
        },
        n,
        { ref: o },
      ),
      s.createElement('path', {
        d: 'M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z',
        fill: r,
        fillRule: 'evenodd',
        clipRule: 'evenodd',
      }),
    )
  }),
  Wl = ['color'],
  cv = s.forwardRef(function (e, o) {
    var t = e.color,
      r = t === void 0 ? 'currentColor' : t,
      n = Re(e, Wl)
    return s.createElement(
      'svg',
      Object.assign(
        {
          width: '15',
          height: '15',
          viewBox: '0 0 15 15',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
        },
        n,
        { ref: o },
      ),
      s.createElement('path', {
        d: 'M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z',
        fill: r,
        fillRule: 'evenodd',
        clipRule: 'evenodd',
      }),
    )
  }),
  xr = Object.freeze({
    position: 'absolute',
    border: 0,
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    wordWrap: 'normal',
  }),
  zl = 'VisuallyHidden',
  wr = s.forwardRef((e, o) => u.jsx(S.span, { ...e, ref: o, style: { ...xr, ...e.style } }))
wr.displayName = zl
var br = wr,
  Yl = 'Arrow',
  yr = s.forwardRef((e, o) => {
    const { children: t, width: r = 10, height: n = 5, ...a } = e
    return u.jsx(S.svg, {
      ...a,
      ref: o,
      width: r,
      height: n,
      viewBox: '0 0 30 10',
      preserveAspectRatio: 'none',
      children: e.asChild ? t : u.jsx('polygon', { points: '0,0 30,0 15,10' }),
    })
  })
yr.displayName = Yl
var Xl = yr
function It(e) {
  const [o, t] = s.useState(void 0)
  return (
    Y(() => {
      if (e) {
        t({ width: e.offsetWidth, height: e.offsetHeight })
        const r = new ResizeObserver((n) => {
          if (!Array.isArray(n) || !n.length) return
          const a = n[0]
          let i, c
          if ('borderBoxSize' in a) {
            const l = a.borderBoxSize,
              d = Array.isArray(l) ? l[0] : l
            ;((i = d.inlineSize), (c = d.blockSize))
          } else ((i = e.offsetWidth), (c = e.offsetHeight))
          t({ width: i, height: c })
        })
        return (r.observe(e, { box: 'border-box' }), () => r.unobserve(e))
      } else t(void 0)
    }, [e]),
    o
  )
}
var Do = 'Popper',
  [Rr, Ee] = ee(Do),
  [ql, Er] = Rr(Do),
  Sr = (e) => {
    const { __scopePopper: o, children: t } = e,
      [r, n] = s.useState(null)
    return u.jsx(ql, { scope: o, anchor: r, onAnchorChange: n, children: t })
  }
Sr.displayName = Do
var Pr = 'PopperAnchor',
  _r = s.forwardRef((e, o) => {
    const { __scopePopper: t, virtualRef: r, ...n } = e,
      a = Er(Pr, t),
      i = s.useRef(null),
      c = O(o, i),
      l = s.useRef(null)
    return (
      s.useEffect(() => {
        const d = l.current
        ;((l.current = r?.current || i.current), d !== l.current && a.onAnchorChange(l.current))
      }),
      r ? null : u.jsx(S.div, { ...n, ref: c })
    )
  })
_r.displayName = Pr
var Oo = 'PopperContent',
  [Zl, Jl] = Rr(Oo),
  Ir = s.forwardRef((e, o) => {
    const {
        __scopePopper: t,
        side: r = 'bottom',
        sideOffset: n = 0,
        align: a = 'center',
        alignOffset: i = 0,
        arrowPadding: c = 0,
        avoidCollisions: l = !0,
        collisionBoundary: d = [],
        collisionPadding: f = 0,
        sticky: p = 'partial',
        hideWhenDetached: v = !1,
        updatePositionStrategy: m = 'optimized',
        onPlaced: h,
        ...g
      } = e,
      C = Er(Oo, t),
      [w, x] = s.useState(null),
      b = O(o, (P) => x(P)),
      [E, I] = s.useState(null),
      T = It(E),
      _ = T?.width ?? 0,
      N = T?.height ?? 0,
      A = r + (a !== 'center' ? '-' + a : ''),
      k = typeof f == 'number' ? f : { top: 0, right: 0, bottom: 0, left: 0, ...f },
      V = Array.isArray(d) ? d : [d],
      Z = V.length > 0,
      te = { padding: k, boundary: V.filter(eu), altBoundary: Z },
      {
        refs: q,
        floatingStyles: J,
        placement: K,
        isPositioned: oe,
        middlewareData: H,
      } = mc({
        strategy: 'fixed',
        placement: A,
        whileElementsMounted: (...P) => Rc(...P, { animationFrame: m === 'always' }),
        elements: { reference: C.anchor },
        middleware: [
          gc({ mainAxis: n + N, alignmentAxis: i }),
          l && hc({ mainAxis: !0, crossAxis: !1, limiter: p === 'partial' ? yc() : void 0, ...te }),
          l && Cc({ ...te }),
          xc({
            ...te,
            apply: ({ elements: P, rects: F, availableWidth: G, availableHeight: U }) => {
              const { width: z, height: ne } = F.reference,
                ce = P.floating.style
              ;(ce.setProperty('--radix-popper-available-width', `${G}px`),
                ce.setProperty('--radix-popper-available-height', `${U}px`),
                ce.setProperty('--radix-popper-anchor-width', `${z}px`),
                ce.setProperty('--radix-popper-anchor-height', `${ne}px`))
            },
          }),
          E && wc({ element: E, padding: c }),
          tu({ arrowWidth: _, arrowHeight: N }),
          v && bc({ strategy: 'referenceHidden', ...te }),
        ],
      }),
      [D, se] = Mr(K),
      ae = W(h)
    Y(() => {
      oe && ae?.()
    }, [oe, ae])
    const R = H.arrow?.x,
      j = H.arrow?.y,
      L = H.arrow?.centerOffset !== 0,
      [M, $] = s.useState()
    return (
      Y(() => {
        w && $(window.getComputedStyle(w).zIndex)
      }, [w]),
      u.jsx('div', {
        ref: q.setFloating,
        'data-radix-popper-content-wrapper': '',
        style: {
          ...J,
          transform: oe ? J.transform : 'translate(0, -200%)',
          minWidth: 'max-content',
          zIndex: M,
          '--radix-popper-transform-origin': [H.transformOrigin?.x, H.transformOrigin?.y].join(' '),
          ...(H.hide?.referenceHidden && { visibility: 'hidden', pointerEvents: 'none' }),
        },
        dir: e.dir,
        children: u.jsx(Zl, {
          scope: t,
          placedSide: D,
          onArrowChange: I,
          arrowX: R,
          arrowY: j,
          shouldHideArrow: L,
          children: u.jsx(S.div, {
            'data-side': D,
            'data-align': se,
            ...g,
            ref: b,
            style: { ...g.style, animation: oe ? void 0 : 'none' },
          }),
        }),
      })
    )
  })
Ir.displayName = Oo
var Tr = 'PopperArrow',
  Ql = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' },
  Ar = s.forwardRef(function (o, t) {
    const { __scopePopper: r, ...n } = o,
      a = Jl(Tr, r),
      i = Ql[a.placedSide]
    return u.jsx('span', {
      ref: a.onArrowChange,
      style: {
        position: 'absolute',
        left: a.arrowX,
        top: a.arrowY,
        [i]: 0,
        transformOrigin: { top: '', right: '0 0', bottom: 'center 0', left: '100% 0' }[
          a.placedSide
        ],
        transform: {
          top: 'translateY(100%)',
          right: 'translateY(50%) rotate(90deg) translateX(-50%)',
          bottom: 'rotate(180deg)',
          left: 'translateY(50%) rotate(-90deg) translateX(50%)',
        }[a.placedSide],
        visibility: a.shouldHideArrow ? 'hidden' : void 0,
      },
      children: u.jsx(Xl, { ...n, ref: t, style: { ...n.style, display: 'block' } }),
    })
  })
Ar.displayName = Tr
function eu(e) {
  return e !== null
}
var tu = (e) => ({
  name: 'transformOrigin',
  options: e,
  fn(o) {
    const { placement: t, rects: r, middlewareData: n } = o,
      i = n.arrow?.centerOffset !== 0,
      c = i ? 0 : e.arrowWidth,
      l = i ? 0 : e.arrowHeight,
      [d, f] = Mr(t),
      p = { start: '0%', center: '50%', end: '100%' }[f],
      v = (n.arrow?.x ?? 0) + c / 2,
      m = (n.arrow?.y ?? 0) + l / 2
    let h = '',
      g = ''
    return (
      d === 'bottom'
        ? ((h = i ? p : `${v}px`), (g = `${-l}px`))
        : d === 'top'
          ? ((h = i ? p : `${v}px`), (g = `${r.floating.height + l}px`))
          : d === 'right'
            ? ((h = `${-l}px`), (g = i ? p : `${m}px`))
            : d === 'left' && ((h = `${r.floating.width + l}px`), (g = i ? p : `${m}px`)),
      { data: { x: h, y: g } }
    )
  },
})
function Mr(e) {
  const [o, t = 'center'] = e.split('-')
  return [o, t]
}
var Tt = Sr,
  nt = _r,
  At = Ir,
  Mt = Ar,
  Nt = 'Popover',
  [Nr] = ee(Nt, [Ee]),
  rt = Ee(),
  [ou, Se] = Nr(Nt),
  Dr = (e) => {
    const {
        __scopePopover: o,
        children: t,
        open: r,
        defaultOpen: n,
        onOpenChange: a,
        modal: i = !1,
      } = e,
      c = rt(o),
      l = s.useRef(null),
      [d, f] = s.useState(!1),
      [p, v] = re({ prop: r, defaultProp: n ?? !1, onChange: a, caller: Nt })
    return u.jsx(Tt, {
      ...c,
      children: u.jsx(ou, {
        scope: o,
        contentId: Q(),
        triggerRef: l,
        open: p,
        onOpenChange: v,
        onOpenToggle: s.useCallback(() => v((m) => !m), [v]),
        hasCustomAnchor: d,
        onCustomAnchorAdd: s.useCallback(() => f(!0), []),
        onCustomAnchorRemove: s.useCallback(() => f(!1), []),
        modal: i,
        children: t,
      }),
    })
  }
Dr.displayName = Nt
var Or = 'PopoverAnchor',
  nu = s.forwardRef((e, o) => {
    const { __scopePopover: t, ...r } = e,
      n = Se(Or, t),
      a = rt(t),
      { onCustomAnchorAdd: i, onCustomAnchorRemove: c } = n
    return (s.useEffect(() => (i(), () => c()), [i, c]), u.jsx(nt, { ...a, ...r, ref: o }))
  })
nu.displayName = Or
var jr = 'PopoverTrigger',
  kr = s.forwardRef((e, o) => {
    const { __scopePopover: t, ...r } = e,
      n = Se(jr, t),
      a = rt(t),
      i = O(o, n.triggerRef),
      c = u.jsx(S.button, {
        type: 'button',
        'aria-haspopup': 'dialog',
        'aria-expanded': n.open,
        'aria-controls': n.contentId,
        'data-state': Gr(n.open),
        ...r,
        ref: i,
        onClick: y(e.onClick, n.onOpenToggle),
      })
    return n.hasCustomAnchor ? c : u.jsx(nt, { asChild: !0, ...a, children: c })
  })
kr.displayName = jr
var jo = 'PopoverPortal',
  [ru, au] = Nr(jo, { forceMount: void 0 }),
  Lr = (e) => {
    const { __scopePopover: o, forceMount: t, children: r, container: n } = e,
      a = Se(jo, o)
    return u.jsx(ru, {
      scope: o,
      forceMount: t,
      children: u.jsx(X, {
        present: t || a.open,
        children: u.jsx(We, { asChild: !0, container: n, children: r }),
      }),
    })
  }
Lr.displayName = jo
var Be = 'PopoverContent',
  $r = s.forwardRef((e, o) => {
    const t = au(Be, e.__scopePopover),
      { forceMount: r = t.forceMount, ...n } = e,
      a = Se(Be, e.__scopePopover)
    return u.jsx(X, {
      present: r || a.open,
      children: a.modal ? u.jsx(iu, { ...n, ref: o }) : u.jsx(cu, { ...n, ref: o }),
    })
  })
$r.displayName = Be
var su = be('PopoverContent.RemoveScroll'),
  iu = s.forwardRef((e, o) => {
    const t = Se(Be, e.__scopePopover),
      r = s.useRef(null),
      n = O(o, r),
      a = s.useRef(!1)
    return (
      s.useEffect(() => {
        const i = r.current
        if (i) return Et(i)
      }, []),
      u.jsx(Rt, {
        as: su,
        allowPinchZoom: !0,
        children: u.jsx(Fr, {
          ...e,
          ref: n,
          trapFocus: t.open,
          disableOutsidePointerEvents: !0,
          onCloseAutoFocus: y(e.onCloseAutoFocus, (i) => {
            ;(i.preventDefault(), a.current || t.triggerRef.current?.focus())
          }),
          onPointerDownOutside: y(
            e.onPointerDownOutside,
            (i) => {
              const c = i.detail.originalEvent,
                l = c.button === 0 && c.ctrlKey === !0,
                d = c.button === 2 || l
              a.current = d
            },
            { checkForDefaultPrevented: !1 },
          ),
          onFocusOutside: y(e.onFocusOutside, (i) => i.preventDefault(), {
            checkForDefaultPrevented: !1,
          }),
        }),
      })
    )
  }),
  cu = s.forwardRef((e, o) => {
    const t = Se(Be, e.__scopePopover),
      r = s.useRef(!1),
      n = s.useRef(!1)
    return u.jsx(Fr, {
      ...e,
      ref: o,
      trapFocus: !1,
      disableOutsidePointerEvents: !1,
      onCloseAutoFocus: (a) => {
        ;(e.onCloseAutoFocus?.(a),
          a.defaultPrevented || (r.current || t.triggerRef.current?.focus(), a.preventDefault()),
          (r.current = !1),
          (n.current = !1))
      },
      onInteractOutside: (a) => {
        ;(e.onInteractOutside?.(a),
          a.defaultPrevented ||
            ((r.current = !0), a.detail.originalEvent.type === 'pointerdown' && (n.current = !0)))
        const i = a.target
        ;(t.triggerRef.current?.contains(i) && a.preventDefault(),
          a.detail.originalEvent.type === 'focusin' && n.current && a.preventDefault())
      },
    })
  }),
  Fr = s.forwardRef((e, o) => {
    const {
        __scopePopover: t,
        trapFocus: r,
        onOpenAutoFocus: n,
        onCloseAutoFocus: a,
        disableOutsidePointerEvents: i,
        onEscapeKeyDown: c,
        onPointerDownOutside: l,
        onFocusOutside: d,
        onInteractOutside: f,
        ...p
      } = e,
      v = Se(Be, t),
      m = rt(t)
    return (
      St(),
      u.jsx(tt, {
        asChild: !0,
        loop: !0,
        trapped: r,
        onMountAutoFocus: n,
        onUnmountAutoFocus: a,
        children: u.jsx(je, {
          asChild: !0,
          disableOutsidePointerEvents: i,
          onInteractOutside: f,
          onEscapeKeyDown: c,
          onPointerDownOutside: l,
          onFocusOutside: d,
          onDismiss: () => v.onOpenChange(!1),
          children: u.jsx(At, {
            'data-state': Gr(v.open),
            role: 'dialog',
            id: v.contentId,
            ...m,
            ...p,
            ref: o,
            style: {
              ...p.style,
              '--radix-popover-content-transform-origin': 'var(--radix-popper-transform-origin)',
              '--radix-popover-content-available-width': 'var(--radix-popper-available-width)',
              '--radix-popover-content-available-height': 'var(--radix-popper-available-height)',
              '--radix-popover-trigger-width': 'var(--radix-popper-anchor-width)',
              '--radix-popover-trigger-height': 'var(--radix-popper-anchor-height)',
            },
          }),
        }),
      })
    )
  }),
  Vr = 'PopoverClose',
  lu = s.forwardRef((e, o) => {
    const { __scopePopover: t, ...r } = e,
      n = Se(Vr, t)
    return u.jsx(S.button, {
      type: 'button',
      ...r,
      ref: o,
      onClick: y(e.onClick, () => n.onOpenChange(!1)),
    })
  })
lu.displayName = Vr
var uu = 'PopoverArrow',
  du = s.forwardRef((e, o) => {
    const { __scopePopover: t, ...r } = e,
      n = rt(t)
    return u.jsx(Mt, { ...n, ...r, ref: o })
  })
du.displayName = uu
function Gr(e) {
  return e ? 'open' : 'closed'
}
var lv = Dr,
  uv = kr,
  dv = Lr,
  fv = $r,
  fu = 'Label',
  Br = s.forwardRef((e, o) =>
    u.jsx(S.label, {
      ...e,
      ref: o,
      onMouseDown: (t) => {
        t.target.closest('button, input, select, textarea') ||
          (e.onMouseDown?.(t), !t.defaultPrevented && t.detail > 1 && t.preventDefault())
      },
    }),
  )
Br.displayName = fu
var pv = Br
function fo(e, [o, t]) {
  return Math.min(t, Math.max(o, e))
}
function ze(e) {
  const o = e + 'CollectionProvider',
    [t, r] = ee(o),
    [n, a] = t(o, { collectionRef: { current: null }, itemMap: new Map() }),
    i = (g) => {
      const { scope: C, children: w } = g,
        x = B.useRef(null),
        b = B.useRef(new Map()).current
      return u.jsx(n, { scope: C, itemMap: b, collectionRef: x, children: w })
    }
  i.displayName = o
  const c = e + 'CollectionSlot',
    l = be(c),
    d = B.forwardRef((g, C) => {
      const { scope: w, children: x } = g,
        b = a(c, w),
        E = O(C, b.collectionRef)
      return u.jsx(l, { ref: E, children: x })
    })
  d.displayName = c
  const f = e + 'CollectionItemSlot',
    p = 'data-radix-collection-item',
    v = be(f),
    m = B.forwardRef((g, C) => {
      const { scope: w, children: x, ...b } = g,
        E = B.useRef(null),
        I = O(C, E),
        T = a(f, w)
      return (
        B.useEffect(() => (T.itemMap.set(E, { ref: E, ...b }), () => void T.itemMap.delete(E))),
        u.jsx(v, { [p]: '', ref: I, children: x })
      )
    })
  m.displayName = f
  function h(g) {
    const C = a(e + 'CollectionConsumer', g)
    return B.useCallback(() => {
      const x = C.collectionRef.current
      if (!x) return []
      const b = Array.from(x.querySelectorAll(`[${p}]`))
      return Array.from(C.itemMap.values()).sort(
        (T, _) => b.indexOf(T.ref.current) - b.indexOf(_.ref.current),
      )
    }, [C.collectionRef, C.itemMap])
  }
  return [{ Provider: i, Slot: d, ItemSlot: m }, h, r]
}
var pu = s.createContext(void 0)
function he(e) {
  const o = s.useContext(pu)
  return e || o || 'ltr'
}
function at(e) {
  const o = s.useRef({ value: e, previous: e })
  return s.useMemo(
    () => (
      o.current.value !== e && ((o.current.previous = o.current.value), (o.current.value = e)),
      o.current.previous
    ),
    [e],
  )
}
var vu = [' ', 'Enter', 'ArrowUp', 'ArrowDown'],
  mu = [' ', 'Enter'],
  De = 'Select',
  [Dt, Ot, gu] = ze(De),
  [Ye] = ee(De, [gu, Ee]),
  jt = Ee(),
  [hu, Pe] = Ye(De),
  [Cu, xu] = Ye(De),
  Kr = (e) => {
    const {
        __scopeSelect: o,
        children: t,
        open: r,
        defaultOpen: n,
        onOpenChange: a,
        value: i,
        defaultValue: c,
        onValueChange: l,
        dir: d,
        name: f,
        autoComplete: p,
        disabled: v,
        required: m,
        form: h,
      } = e,
      g = jt(o),
      [C, w] = s.useState(null),
      [x, b] = s.useState(null),
      [E, I] = s.useState(!1),
      T = he(d),
      [_, N] = re({ prop: r, defaultProp: n ?? !1, onChange: a, caller: De }),
      [A, k] = re({ prop: i, defaultProp: c, onChange: l, caller: De }),
      V = s.useRef(null),
      Z = C ? h || !!C.closest('form') : !0,
      [te, q] = s.useState(new Set()),
      J = Array.from(te)
        .map((K) => K.props.value)
        .join(';')
    return u.jsx(Tt, {
      ...g,
      children: u.jsxs(hu, {
        required: m,
        scope: o,
        trigger: C,
        onTriggerChange: w,
        valueNode: x,
        onValueNodeChange: b,
        valueNodeHasChildren: E,
        onValueNodeHasChildrenChange: I,
        contentId: Q(),
        value: A,
        onValueChange: k,
        open: _,
        onOpenChange: N,
        dir: T,
        triggerPointerDownPosRef: V,
        disabled: v,
        children: [
          u.jsx(Dt.Provider, {
            scope: o,
            children: u.jsx(Cu, {
              scope: e.__scopeSelect,
              onNativeOptionAdd: s.useCallback((K) => {
                q((oe) => new Set(oe).add(K))
              }, []),
              onNativeOptionRemove: s.useCallback((K) => {
                q((oe) => {
                  const H = new Set(oe)
                  return (H.delete(K), H)
                })
              }, []),
              children: t,
            }),
          }),
          Z
            ? u.jsxs(
                pa,
                {
                  'aria-hidden': !0,
                  required: m,
                  tabIndex: -1,
                  name: f,
                  autoComplete: p,
                  value: A,
                  onChange: (K) => k(K.target.value),
                  disabled: v,
                  form: h,
                  children: [A === void 0 ? u.jsx('option', { value: '' }) : null, Array.from(te)],
                },
                J,
              )
            : null,
        ],
      }),
    })
  }
Kr.displayName = De
var Ur = 'SelectTrigger',
  Hr = s.forwardRef((e, o) => {
    const { __scopeSelect: t, disabled: r = !1, ...n } = e,
      a = jt(t),
      i = Pe(Ur, t),
      c = i.disabled || r,
      l = O(o, i.onTriggerChange),
      d = Ot(t),
      f = s.useRef('touch'),
      [p, v, m] = ma((g) => {
        const C = d().filter((b) => !b.disabled),
          w = C.find((b) => b.value === i.value),
          x = ga(C, g, w)
        x !== void 0 && i.onValueChange(x.value)
      }),
      h = (g) => {
        ;(c || (i.onOpenChange(!0), m()),
          g &&
            (i.triggerPointerDownPosRef.current = {
              x: Math.round(g.pageX),
              y: Math.round(g.pageY),
            }))
      }
    return u.jsx(nt, {
      asChild: !0,
      ...a,
      children: u.jsx(S.button, {
        type: 'button',
        role: 'combobox',
        'aria-controls': i.contentId,
        'aria-expanded': i.open,
        'aria-required': i.required,
        'aria-autocomplete': 'none',
        dir: i.dir,
        'data-state': i.open ? 'open' : 'closed',
        disabled: c,
        'data-disabled': c ? '' : void 0,
        'data-placeholder': va(i.value) ? '' : void 0,
        ...n,
        ref: l,
        onClick: y(n.onClick, (g) => {
          ;(g.currentTarget.focus(), f.current !== 'mouse' && h(g))
        }),
        onPointerDown: y(n.onPointerDown, (g) => {
          f.current = g.pointerType
          const C = g.target
          ;(C.hasPointerCapture(g.pointerId) && C.releasePointerCapture(g.pointerId),
            g.button === 0 &&
              g.ctrlKey === !1 &&
              g.pointerType === 'mouse' &&
              (h(g), g.preventDefault()))
        }),
        onKeyDown: y(n.onKeyDown, (g) => {
          const C = p.current !== ''
          ;(!(g.ctrlKey || g.altKey || g.metaKey) && g.key.length === 1 && v(g.key),
            !(C && g.key === ' ') && vu.includes(g.key) && (h(), g.preventDefault()))
        }),
      }),
    })
  })
Hr.displayName = Ur
var Wr = 'SelectValue',
  zr = s.forwardRef((e, o) => {
    const { __scopeSelect: t, className: r, style: n, children: a, placeholder: i = '', ...c } = e,
      l = Pe(Wr, t),
      { onValueNodeHasChildrenChange: d } = l,
      f = a !== void 0,
      p = O(o, l.onValueNodeChange)
    return (
      Y(() => {
        d(f)
      }, [d, f]),
      u.jsx(S.span, {
        ...c,
        ref: p,
        style: { pointerEvents: 'none' },
        children: va(l.value) ? u.jsx(u.Fragment, { children: i }) : a,
      })
    )
  })
zr.displayName = Wr
var wu = 'SelectIcon',
  Yr = s.forwardRef((e, o) => {
    const { __scopeSelect: t, children: r, ...n } = e
    return u.jsx(S.span, { 'aria-hidden': !0, ...n, ref: o, children: r || '▼' })
  })
Yr.displayName = wu
var bu = 'SelectPortal',
  Xr = (e) => u.jsx(We, { asChild: !0, ...e })
Xr.displayName = bu
var Oe = 'SelectContent',
  qr = s.forwardRef((e, o) => {
    const t = Pe(Oe, e.__scopeSelect),
      [r, n] = s.useState()
    if (
      (Y(() => {
        n(new DocumentFragment())
      }, []),
      !t.open)
    ) {
      const a = r
      return a
        ? Io.createPortal(
            u.jsx(Zr, {
              scope: e.__scopeSelect,
              children: u.jsx(Dt.Slot, {
                scope: e.__scopeSelect,
                children: u.jsx('div', { children: e.children }),
              }),
            }),
            a,
          )
        : null
    }
    return u.jsx(Jr, { ...e, ref: o })
  })
qr.displayName = Oe
var fe = 10,
  [Zr, _e] = Ye(Oe),
  yu = 'SelectContentImpl',
  Ru = be('SelectContent.RemoveScroll'),
  Jr = s.forwardRef((e, o) => {
    const {
        __scopeSelect: t,
        position: r = 'item-aligned',
        onCloseAutoFocus: n,
        onEscapeKeyDown: a,
        onPointerDownOutside: i,
        side: c,
        sideOffset: l,
        align: d,
        alignOffset: f,
        arrowPadding: p,
        collisionBoundary: v,
        collisionPadding: m,
        sticky: h,
        hideWhenDetached: g,
        avoidCollisions: C,
        ...w
      } = e,
      x = Pe(Oe, t),
      [b, E] = s.useState(null),
      [I, T] = s.useState(null),
      _ = O(o, (P) => E(P)),
      [N, A] = s.useState(null),
      [k, V] = s.useState(null),
      Z = Ot(t),
      [te, q] = s.useState(!1),
      J = s.useRef(!1)
    ;(s.useEffect(() => {
      if (b) return Et(b)
    }, [b]),
      St())
    const K = s.useCallback(
        (P) => {
          const [F, ...G] = Z().map((ne) => ne.ref.current),
            [U] = G.slice(-1),
            z = document.activeElement
          for (const ne of P)
            if (
              ne === z ||
              (ne?.scrollIntoView({ block: 'nearest' }),
              ne === F && I && (I.scrollTop = 0),
              ne === U && I && (I.scrollTop = I.scrollHeight),
              ne?.focus(),
              document.activeElement !== z)
            )
              return
        },
        [Z, I],
      ),
      oe = s.useCallback(() => K([N, b]), [K, N, b])
    s.useEffect(() => {
      te && oe()
    }, [te, oe])
    const { onOpenChange: H, triggerPointerDownPosRef: D } = x
    ;(s.useEffect(() => {
      if (b) {
        let P = { x: 0, y: 0 }
        const F = (U) => {
            P = {
              x: Math.abs(Math.round(U.pageX) - (D.current?.x ?? 0)),
              y: Math.abs(Math.round(U.pageY) - (D.current?.y ?? 0)),
            }
          },
          G = (U) => {
            ;(P.x <= 10 && P.y <= 10 ? U.preventDefault() : b.contains(U.target) || H(!1),
              document.removeEventListener('pointermove', F),
              (D.current = null))
          }
        return (
          D.current !== null &&
            (document.addEventListener('pointermove', F),
            document.addEventListener('pointerup', G, { capture: !0, once: !0 })),
          () => {
            ;(document.removeEventListener('pointermove', F),
              document.removeEventListener('pointerup', G, { capture: !0 }))
          }
        )
      }
    }, [b, H, D]),
      s.useEffect(() => {
        const P = () => H(!1)
        return (
          window.addEventListener('blur', P),
          window.addEventListener('resize', P),
          () => {
            ;(window.removeEventListener('blur', P), window.removeEventListener('resize', P))
          }
        )
      }, [H]))
    const [se, ae] = ma((P) => {
        const F = Z().filter((z) => !z.disabled),
          G = F.find((z) => z.ref.current === document.activeElement),
          U = ga(F, P, G)
        U && setTimeout(() => U.ref.current.focus())
      }),
      R = s.useCallback(
        (P, F, G) => {
          const U = !J.current && !G
          ;((x.value !== void 0 && x.value === F) || U) && (A(P), U && (J.current = !0))
        },
        [x.value],
      ),
      j = s.useCallback(() => b?.focus(), [b]),
      L = s.useCallback(
        (P, F, G) => {
          const U = !J.current && !G
          ;((x.value !== void 0 && x.value === F) || U) && V(P)
        },
        [x.value],
      ),
      M = r === 'popper' ? po : Qr,
      $ =
        M === po
          ? {
              side: c,
              sideOffset: l,
              align: d,
              alignOffset: f,
              arrowPadding: p,
              collisionBoundary: v,
              collisionPadding: m,
              sticky: h,
              hideWhenDetached: g,
              avoidCollisions: C,
            }
          : {}
    return u.jsx(Zr, {
      scope: t,
      content: b,
      viewport: I,
      onViewportChange: T,
      itemRefCallback: R,
      selectedItem: N,
      onItemLeave: j,
      itemTextRefCallback: L,
      focusSelectedItem: oe,
      selectedItemText: k,
      position: r,
      isPositioned: te,
      searchRef: se,
      children: u.jsx(Rt, {
        as: Ru,
        allowPinchZoom: !0,
        children: u.jsx(tt, {
          asChild: !0,
          trapped: x.open,
          onMountAutoFocus: (P) => {
            P.preventDefault()
          },
          onUnmountAutoFocus: y(n, (P) => {
            ;(x.trigger?.focus({ preventScroll: !0 }), P.preventDefault())
          }),
          children: u.jsx(je, {
            asChild: !0,
            disableOutsidePointerEvents: !0,
            onEscapeKeyDown: a,
            onPointerDownOutside: i,
            onFocusOutside: (P) => P.preventDefault(),
            onDismiss: () => x.onOpenChange(!1),
            children: u.jsx(M, {
              role: 'listbox',
              id: x.contentId,
              'data-state': x.open ? 'open' : 'closed',
              dir: x.dir,
              onContextMenu: (P) => P.preventDefault(),
              ...w,
              ...$,
              onPlaced: () => q(!0),
              ref: _,
              style: { display: 'flex', flexDirection: 'column', outline: 'none', ...w.style },
              onKeyDown: y(w.onKeyDown, (P) => {
                const F = P.ctrlKey || P.altKey || P.metaKey
                if (
                  (P.key === 'Tab' && P.preventDefault(),
                  !F && P.key.length === 1 && ae(P.key),
                  ['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(P.key))
                ) {
                  let U = Z()
                    .filter((z) => !z.disabled)
                    .map((z) => z.ref.current)
                  if (
                    (['ArrowUp', 'End'].includes(P.key) && (U = U.slice().reverse()),
                    ['ArrowUp', 'ArrowDown'].includes(P.key))
                  ) {
                    const z = P.target,
                      ne = U.indexOf(z)
                    U = U.slice(ne + 1)
                  }
                  ;(setTimeout(() => K(U)), P.preventDefault())
                }
              }),
            }),
          }),
        }),
      }),
    })
  })
Jr.displayName = yu
var Eu = 'SelectItemAlignedPosition',
  Qr = s.forwardRef((e, o) => {
    const { __scopeSelect: t, onPlaced: r, ...n } = e,
      a = Pe(Oe, t),
      i = _e(Oe, t),
      [c, l] = s.useState(null),
      [d, f] = s.useState(null),
      p = O(o, (_) => f(_)),
      v = Ot(t),
      m = s.useRef(!1),
      h = s.useRef(!0),
      { viewport: g, selectedItem: C, selectedItemText: w, focusSelectedItem: x } = i,
      b = s.useCallback(() => {
        if (a.trigger && a.valueNode && c && d && g && C && w) {
          const _ = a.trigger.getBoundingClientRect(),
            N = d.getBoundingClientRect(),
            A = a.valueNode.getBoundingClientRect(),
            k = w.getBoundingClientRect()
          if (a.dir !== 'rtl') {
            const z = k.left - N.left,
              ne = A.left - z,
              ce = _.left - ne,
              Ae = _.width + ce,
              Jt = Math.max(Ae, N.width),
              Qt = window.innerWidth - fe,
              eo = fo(ne, [fe, Math.max(fe, Qt - Jt)])
            ;((c.style.minWidth = Ae + 'px'), (c.style.left = eo + 'px'))
          } else {
            const z = N.right - k.right,
              ne = window.innerWidth - A.right - z,
              ce = window.innerWidth - _.right - ne,
              Ae = _.width + ce,
              Jt = Math.max(Ae, N.width),
              Qt = window.innerWidth - fe,
              eo = fo(ne, [fe, Math.max(fe, Qt - Jt)])
            ;((c.style.minWidth = Ae + 'px'), (c.style.right = eo + 'px'))
          }
          const V = v(),
            Z = window.innerHeight - fe * 2,
            te = g.scrollHeight,
            q = window.getComputedStyle(d),
            J = parseInt(q.borderTopWidth, 10),
            K = parseInt(q.paddingTop, 10),
            oe = parseInt(q.borderBottomWidth, 10),
            H = parseInt(q.paddingBottom, 10),
            D = J + K + te + H + oe,
            se = Math.min(C.offsetHeight * 5, D),
            ae = window.getComputedStyle(g),
            R = parseInt(ae.paddingTop, 10),
            j = parseInt(ae.paddingBottom, 10),
            L = _.top + _.height / 2 - fe,
            M = Z - L,
            $ = C.offsetHeight / 2,
            P = C.offsetTop + $,
            F = J + K + P,
            G = D - F
          if (F <= L) {
            const z = V.length > 0 && C === V[V.length - 1].ref.current
            c.style.bottom = '0px'
            const ne = d.clientHeight - g.offsetTop - g.offsetHeight,
              ce = Math.max(M, $ + (z ? j : 0) + ne + oe),
              Ae = F + ce
            c.style.height = Ae + 'px'
          } else {
            const z = V.length > 0 && C === V[0].ref.current
            c.style.top = '0px'
            const ce = Math.max(L, J + g.offsetTop + (z ? R : 0) + $) + G
            ;((c.style.height = ce + 'px'), (g.scrollTop = F - L + g.offsetTop))
          }
          ;((c.style.margin = `${fe}px 0`),
            (c.style.minHeight = se + 'px'),
            (c.style.maxHeight = Z + 'px'),
            r?.(),
            requestAnimationFrame(() => (m.current = !0)))
        }
      }, [v, a.trigger, a.valueNode, c, d, g, C, w, a.dir, r])
    Y(() => b(), [b])
    const [E, I] = s.useState()
    Y(() => {
      d && I(window.getComputedStyle(d).zIndex)
    }, [d])
    const T = s.useCallback(
      (_) => {
        _ && h.current === !0 && (b(), x?.(), (h.current = !1))
      },
      [b, x],
    )
    return u.jsx(Pu, {
      scope: t,
      contentWrapper: c,
      shouldExpandOnScrollRef: m,
      onScrollButtonChange: T,
      children: u.jsx('div', {
        ref: l,
        style: { display: 'flex', flexDirection: 'column', position: 'fixed', zIndex: E },
        children: u.jsx(S.div, {
          ...n,
          ref: p,
          style: { boxSizing: 'border-box', maxHeight: '100%', ...n.style },
        }),
      }),
    })
  })
Qr.displayName = Eu
var Su = 'SelectPopperPosition',
  po = s.forwardRef((e, o) => {
    const { __scopeSelect: t, align: r = 'start', collisionPadding: n = fe, ...a } = e,
      i = jt(t)
    return u.jsx(At, {
      ...i,
      ...a,
      ref: o,
      align: r,
      collisionPadding: n,
      style: {
        boxSizing: 'border-box',
        ...a.style,
        '--radix-select-content-transform-origin': 'var(--radix-popper-transform-origin)',
        '--radix-select-content-available-width': 'var(--radix-popper-available-width)',
        '--radix-select-content-available-height': 'var(--radix-popper-available-height)',
        '--radix-select-trigger-width': 'var(--radix-popper-anchor-width)',
        '--radix-select-trigger-height': 'var(--radix-popper-anchor-height)',
      },
    })
  })
po.displayName = Su
var [Pu, ko] = Ye(Oe, {}),
  vo = 'SelectViewport',
  ea = s.forwardRef((e, o) => {
    const { __scopeSelect: t, nonce: r, ...n } = e,
      a = _e(vo, t),
      i = ko(vo, t),
      c = O(o, a.onViewportChange),
      l = s.useRef(0)
    return u.jsxs(u.Fragment, {
      children: [
        u.jsx('style', {
          dangerouslySetInnerHTML: {
            __html:
              '[data-radix-select-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-select-viewport]::-webkit-scrollbar{display:none}',
          },
          nonce: r,
        }),
        u.jsx(Dt.Slot, {
          scope: t,
          children: u.jsx(S.div, {
            'data-radix-select-viewport': '',
            role: 'presentation',
            ...n,
            ref: c,
            style: { position: 'relative', flex: 1, overflow: 'hidden auto', ...n.style },
            onScroll: y(n.onScroll, (d) => {
              const f = d.currentTarget,
                { contentWrapper: p, shouldExpandOnScrollRef: v } = i
              if (v?.current && p) {
                const m = Math.abs(l.current - f.scrollTop)
                if (m > 0) {
                  const h = window.innerHeight - fe * 2,
                    g = parseFloat(p.style.minHeight),
                    C = parseFloat(p.style.height),
                    w = Math.max(g, C)
                  if (w < h) {
                    const x = w + m,
                      b = Math.min(h, x),
                      E = x - b
                    ;((p.style.height = b + 'px'),
                      p.style.bottom === '0px' &&
                        ((f.scrollTop = E > 0 ? E : 0), (p.style.justifyContent = 'flex-end')))
                  }
                }
              }
              l.current = f.scrollTop
            }),
          }),
        }),
      ],
    })
  })
ea.displayName = vo
var ta = 'SelectGroup',
  [_u, Iu] = Ye(ta),
  Tu = s.forwardRef((e, o) => {
    const { __scopeSelect: t, ...r } = e,
      n = Q()
    return u.jsx(_u, {
      scope: t,
      id: n,
      children: u.jsx(S.div, { role: 'group', 'aria-labelledby': n, ...r, ref: o }),
    })
  })
Tu.displayName = ta
var oa = 'SelectLabel',
  na = s.forwardRef((e, o) => {
    const { __scopeSelect: t, ...r } = e,
      n = Iu(oa, t)
    return u.jsx(S.div, { id: n.id, ...r, ref: o })
  })
na.displayName = oa
var vt = 'SelectItem',
  [Au, ra] = Ye(vt),
  aa = s.forwardRef((e, o) => {
    const { __scopeSelect: t, value: r, disabled: n = !1, textValue: a, ...i } = e,
      c = Pe(vt, t),
      l = _e(vt, t),
      d = c.value === r,
      [f, p] = s.useState(a ?? ''),
      [v, m] = s.useState(!1),
      h = O(o, (x) => l.itemRefCallback?.(x, r, n)),
      g = Q(),
      C = s.useRef('touch'),
      w = () => {
        n || (c.onValueChange(r), c.onOpenChange(!1))
      }
    if (r === '')
      throw new Error(
        'A <Select.Item /> must have a value prop that is not an empty string. This is because the Select value can be set to an empty string to clear the selection and show the placeholder.',
      )
    return u.jsx(Au, {
      scope: t,
      value: r,
      disabled: n,
      textId: g,
      isSelected: d,
      onItemTextChange: s.useCallback((x) => {
        p((b) => b || (x?.textContent ?? '').trim())
      }, []),
      children: u.jsx(Dt.ItemSlot, {
        scope: t,
        value: r,
        disabled: n,
        textValue: f,
        children: u.jsx(S.div, {
          role: 'option',
          'aria-labelledby': g,
          'data-highlighted': v ? '' : void 0,
          'aria-selected': d && v,
          'data-state': d ? 'checked' : 'unchecked',
          'aria-disabled': n || void 0,
          'data-disabled': n ? '' : void 0,
          tabIndex: n ? void 0 : -1,
          ...i,
          ref: h,
          onFocus: y(i.onFocus, () => m(!0)),
          onBlur: y(i.onBlur, () => m(!1)),
          onClick: y(i.onClick, () => {
            C.current !== 'mouse' && w()
          }),
          onPointerUp: y(i.onPointerUp, () => {
            C.current === 'mouse' && w()
          }),
          onPointerDown: y(i.onPointerDown, (x) => {
            C.current = x.pointerType
          }),
          onPointerMove: y(i.onPointerMove, (x) => {
            ;((C.current = x.pointerType),
              n
                ? l.onItemLeave?.()
                : C.current === 'mouse' && x.currentTarget.focus({ preventScroll: !0 }))
          }),
          onPointerLeave: y(i.onPointerLeave, (x) => {
            x.currentTarget === document.activeElement && l.onItemLeave?.()
          }),
          onKeyDown: y(i.onKeyDown, (x) => {
            ;(l.searchRef?.current !== '' && x.key === ' ') ||
              (mu.includes(x.key) && w(), x.key === ' ' && x.preventDefault())
          }),
        }),
      }),
    })
  })
aa.displayName = vt
var qe = 'SelectItemText',
  sa = s.forwardRef((e, o) => {
    const { __scopeSelect: t, className: r, style: n, ...a } = e,
      i = Pe(qe, t),
      c = _e(qe, t),
      l = ra(qe, t),
      d = xu(qe, t),
      [f, p] = s.useState(null),
      v = O(
        o,
        (w) => p(w),
        l.onItemTextChange,
        (w) => c.itemTextRefCallback?.(w, l.value, l.disabled),
      ),
      m = f?.textContent,
      h = s.useMemo(
        () => u.jsx('option', { value: l.value, disabled: l.disabled, children: m }, l.value),
        [l.disabled, l.value, m],
      ),
      { onNativeOptionAdd: g, onNativeOptionRemove: C } = d
    return (
      Y(() => (g(h), () => C(h)), [g, C, h]),
      u.jsxs(u.Fragment, {
        children: [
          u.jsx(S.span, { id: l.textId, ...a, ref: v }),
          l.isSelected && i.valueNode && !i.valueNodeHasChildren
            ? Io.createPortal(a.children, i.valueNode)
            : null,
        ],
      })
    )
  })
sa.displayName = qe
var ia = 'SelectItemIndicator',
  ca = s.forwardRef((e, o) => {
    const { __scopeSelect: t, ...r } = e
    return ra(ia, t).isSelected ? u.jsx(S.span, { 'aria-hidden': !0, ...r, ref: o }) : null
  })
ca.displayName = ia
var mo = 'SelectScrollUpButton',
  la = s.forwardRef((e, o) => {
    const t = _e(mo, e.__scopeSelect),
      r = ko(mo, e.__scopeSelect),
      [n, a] = s.useState(!1),
      i = O(o, r.onScrollButtonChange)
    return (
      Y(() => {
        if (t.viewport && t.isPositioned) {
          let c = function () {
            const d = l.scrollTop > 0
            a(d)
          }
          const l = t.viewport
          return (c(), l.addEventListener('scroll', c), () => l.removeEventListener('scroll', c))
        }
      }, [t.viewport, t.isPositioned]),
      n
        ? u.jsx(da, {
            ...e,
            ref: i,
            onAutoScroll: () => {
              const { viewport: c, selectedItem: l } = t
              c && l && (c.scrollTop = c.scrollTop - l.offsetHeight)
            },
          })
        : null
    )
  })
la.displayName = mo
var go = 'SelectScrollDownButton',
  ua = s.forwardRef((e, o) => {
    const t = _e(go, e.__scopeSelect),
      r = ko(go, e.__scopeSelect),
      [n, a] = s.useState(!1),
      i = O(o, r.onScrollButtonChange)
    return (
      Y(() => {
        if (t.viewport && t.isPositioned) {
          let c = function () {
            const d = l.scrollHeight - l.clientHeight,
              f = Math.ceil(l.scrollTop) < d
            a(f)
          }
          const l = t.viewport
          return (c(), l.addEventListener('scroll', c), () => l.removeEventListener('scroll', c))
        }
      }, [t.viewport, t.isPositioned]),
      n
        ? u.jsx(da, {
            ...e,
            ref: i,
            onAutoScroll: () => {
              const { viewport: c, selectedItem: l } = t
              c && l && (c.scrollTop = c.scrollTop + l.offsetHeight)
            },
          })
        : null
    )
  })
ua.displayName = go
var da = s.forwardRef((e, o) => {
    const { __scopeSelect: t, onAutoScroll: r, ...n } = e,
      a = _e('SelectScrollButton', t),
      i = s.useRef(null),
      c = Ot(t),
      l = s.useCallback(() => {
        i.current !== null && (window.clearInterval(i.current), (i.current = null))
      }, [])
    return (
      s.useEffect(() => () => l(), [l]),
      Y(() => {
        c()
          .find((f) => f.ref.current === document.activeElement)
          ?.ref.current?.scrollIntoView({ block: 'nearest' })
      }, [c]),
      u.jsx(S.div, {
        'aria-hidden': !0,
        ...n,
        ref: o,
        style: { flexShrink: 0, ...n.style },
        onPointerDown: y(n.onPointerDown, () => {
          i.current === null && (i.current = window.setInterval(r, 50))
        }),
        onPointerMove: y(n.onPointerMove, () => {
          ;(a.onItemLeave?.(), i.current === null && (i.current = window.setInterval(r, 50)))
        }),
        onPointerLeave: y(n.onPointerLeave, () => {
          l()
        }),
      })
    )
  }),
  Mu = 'SelectSeparator',
  fa = s.forwardRef((e, o) => {
    const { __scopeSelect: t, ...r } = e
    return u.jsx(S.div, { 'aria-hidden': !0, ...r, ref: o })
  })
fa.displayName = Mu
var ho = 'SelectArrow',
  Nu = s.forwardRef((e, o) => {
    const { __scopeSelect: t, ...r } = e,
      n = jt(t),
      a = Pe(ho, t),
      i = _e(ho, t)
    return a.open && i.position === 'popper' ? u.jsx(Mt, { ...n, ...r, ref: o }) : null
  })
Nu.displayName = ho
var Du = 'SelectBubbleInput',
  pa = s.forwardRef(({ __scopeSelect: e, value: o, ...t }, r) => {
    const n = s.useRef(null),
      a = O(r, n),
      i = at(o)
    return (
      s.useEffect(() => {
        const c = n.current
        if (!c) return
        const l = window.HTMLSelectElement.prototype,
          f = Object.getOwnPropertyDescriptor(l, 'value').set
        if (i !== o && f) {
          const p = new Event('change', { bubbles: !0 })
          ;(f.call(c, o), c.dispatchEvent(p))
        }
      }, [i, o]),
      u.jsx(S.select, { ...t, style: { ...xr, ...t.style }, ref: a, defaultValue: o })
    )
  })
pa.displayName = Du
function va(e) {
  return e === '' || e === void 0
}
function ma(e) {
  const o = W(e),
    t = s.useRef(''),
    r = s.useRef(0),
    n = s.useCallback(
      (i) => {
        const c = t.current + i
        ;(o(c),
          (function l(d) {
            ;((t.current = d),
              window.clearTimeout(r.current),
              d !== '' && (r.current = window.setTimeout(() => l(''), 1e3)))
          })(c))
      },
      [o],
    ),
    a = s.useCallback(() => {
      ;((t.current = ''), window.clearTimeout(r.current))
    }, [])
  return (s.useEffect(() => () => window.clearTimeout(r.current), []), [t, n, a])
}
function ga(e, o, t) {
  const n = o.length > 1 && Array.from(o).every((d) => d === o[0]) ? o[0] : o,
    a = t ? e.indexOf(t) : -1
  let i = Ou(e, Math.max(a, 0))
  n.length === 1 && (i = i.filter((d) => d !== t))
  const l = i.find((d) => d.textValue.toLowerCase().startsWith(n.toLowerCase()))
  return l !== t ? l : void 0
}
function Ou(e, o) {
  return e.map((t, r) => e[(o + r) % e.length])
}
var vv = Kr,
  mv = Hr,
  gv = zr,
  hv = Yr,
  Cv = Xr,
  xv = qr,
  wv = ea,
  bv = na,
  yv = aa,
  Rv = sa,
  Ev = ca,
  Sv = la,
  Pv = ua,
  _v = fa,
  ke = 'NavigationMenu',
  [Lo, ha, ju] = ze(ke),
  [Co, ku, Lu] = ze(ke),
  [$o] = ee(ke, [ju, Lu]),
  [$u, ue] = $o(ke),
  [Fu, Vu] = $o(ke),
  Ca = s.forwardRef((e, o) => {
    const {
        __scopeNavigationMenu: t,
        value: r,
        onValueChange: n,
        defaultValue: a,
        delayDuration: i = 200,
        skipDelayDuration: c = 300,
        orientation: l = 'horizontal',
        dir: d,
        ...f
      } = e,
      [p, v] = s.useState(null),
      m = O(o, (A) => v(A)),
      h = he(d),
      g = s.useRef(0),
      C = s.useRef(0),
      w = s.useRef(0),
      [x, b] = s.useState(!0),
      [E, I] = re({
        prop: r,
        onChange: (A) => {
          const k = A !== '',
            V = c > 0
          ;(k
            ? (window.clearTimeout(w.current), V && b(!1))
            : (window.clearTimeout(w.current), (w.current = window.setTimeout(() => b(!0), c))),
            n?.(A))
        },
        defaultProp: a ?? '',
        caller: ke,
      }),
      T = s.useCallback(() => {
        ;(window.clearTimeout(C.current), (C.current = window.setTimeout(() => I(''), 150)))
      }, [I]),
      _ = s.useCallback(
        (A) => {
          ;(window.clearTimeout(C.current), I(A))
        },
        [I],
      ),
      N = s.useCallback(
        (A) => {
          E === A
            ? window.clearTimeout(C.current)
            : (g.current = window.setTimeout(() => {
                ;(window.clearTimeout(C.current), I(A))
              }, i))
        },
        [E, I, i],
      )
    return (
      s.useEffect(
        () => () => {
          ;(window.clearTimeout(g.current),
            window.clearTimeout(C.current),
            window.clearTimeout(w.current))
        },
        [],
      ),
      u.jsx(xa, {
        scope: t,
        isRootMenu: !0,
        value: E,
        dir: h,
        orientation: l,
        rootNavigationMenu: p,
        onTriggerEnter: (A) => {
          ;(window.clearTimeout(g.current), x ? N(A) : _(A))
        },
        onTriggerLeave: () => {
          ;(window.clearTimeout(g.current), T())
        },
        onContentEnter: () => window.clearTimeout(C.current),
        onContentLeave: T,
        onItemSelect: (A) => {
          I((k) => (k === A ? '' : A))
        },
        onItemDismiss: () => I(''),
        children: u.jsx(S.nav, {
          'aria-label': 'Main',
          'data-orientation': l,
          dir: h,
          ...f,
          ref: m,
        }),
      })
    )
  })
Ca.displayName = ke
var xo = 'NavigationMenuSub',
  Gu = s.forwardRef((e, o) => {
    const {
        __scopeNavigationMenu: t,
        value: r,
        onValueChange: n,
        defaultValue: a,
        orientation: i = 'horizontal',
        ...c
      } = e,
      l = ue(xo, t),
      [d, f] = re({ prop: r, onChange: n, defaultProp: a ?? '', caller: xo })
    return u.jsx(xa, {
      scope: t,
      isRootMenu: !1,
      value: d,
      dir: l.dir,
      orientation: i,
      rootNavigationMenu: l.rootNavigationMenu,
      onTriggerEnter: (p) => f(p),
      onItemSelect: (p) => f(p),
      onItemDismiss: () => f(''),
      children: u.jsx(S.div, { 'data-orientation': i, ...c, ref: o }),
    })
  })
Gu.displayName = xo
var xa = (e) => {
    const {
        scope: o,
        isRootMenu: t,
        rootNavigationMenu: r,
        dir: n,
        orientation: a,
        children: i,
        value: c,
        onItemSelect: l,
        onItemDismiss: d,
        onTriggerEnter: f,
        onTriggerLeave: p,
        onContentEnter: v,
        onContentLeave: m,
      } = e,
      [h, g] = s.useState(null),
      [C, w] = s.useState(new Map()),
      [x, b] = s.useState(null)
    return u.jsx($u, {
      scope: o,
      isRootMenu: t,
      rootNavigationMenu: r,
      value: c,
      previousValue: at(c),
      baseId: Q(),
      dir: n,
      orientation: a,
      viewport: h,
      onViewportChange: g,
      indicatorTrack: x,
      onIndicatorTrackChange: b,
      onTriggerEnter: W(f),
      onTriggerLeave: W(p),
      onContentEnter: W(v),
      onContentLeave: W(m),
      onItemSelect: W(l),
      onItemDismiss: W(d),
      onViewportContentChange: s.useCallback((E, I) => {
        w((T) => (T.set(E, I), new Map(T)))
      }, []),
      onViewportContentRemove: s.useCallback((E) => {
        w((I) => (I.has(E) ? (I.delete(E), new Map(I)) : I))
      }, []),
      children: u.jsx(Lo.Provider, {
        scope: o,
        children: u.jsx(Fu, { scope: o, items: C, children: i }),
      }),
    })
  },
  wa = 'NavigationMenuList',
  ba = s.forwardRef((e, o) => {
    const { __scopeNavigationMenu: t, ...r } = e,
      n = ue(wa, t),
      a = u.jsx(S.ul, { 'data-orientation': n.orientation, ...r, ref: o })
    return u.jsx(S.div, {
      style: { position: 'relative' },
      ref: n.onIndicatorTrackChange,
      children: u.jsx(Lo.Slot, {
        scope: t,
        children: n.isRootMenu ? u.jsx(Ma, { asChild: !0, children: a }) : a,
      }),
    })
  })
ba.displayName = wa
var ya = 'NavigationMenuItem',
  [Bu, Ra] = $o(ya),
  Ea = s.forwardRef((e, o) => {
    const { __scopeNavigationMenu: t, value: r, ...n } = e,
      a = Q(),
      i = r || a || 'LEGACY_REACT_AUTO_VALUE',
      c = s.useRef(null),
      l = s.useRef(null),
      d = s.useRef(null),
      f = s.useRef(() => {}),
      p = s.useRef(!1),
      v = s.useCallback((h = 'start') => {
        if (c.current) {
          f.current()
          const g = bo(c.current)
          g.length && Go(h === 'start' ? g : g.reverse())
        }
      }, []),
      m = s.useCallback(() => {
        if (c.current) {
          const h = bo(c.current)
          h.length && (f.current = Xu(h))
        }
      }, [])
    return u.jsx(Bu, {
      scope: t,
      value: i,
      triggerRef: l,
      contentRef: c,
      focusProxyRef: d,
      wasEscapeCloseRef: p,
      onEntryKeyDown: v,
      onFocusProxyEnter: v,
      onRootContentClose: m,
      onContentFocusOutside: m,
      children: u.jsx(S.li, { ...n, ref: o }),
    })
  })
Ea.displayName = ya
var wo = 'NavigationMenuTrigger',
  Sa = s.forwardRef((e, o) => {
    const { __scopeNavigationMenu: t, disabled: r, ...n } = e,
      a = ue(wo, e.__scopeNavigationMenu),
      i = Ra(wo, e.__scopeNavigationMenu),
      c = s.useRef(null),
      l = O(c, i.triggerRef, o),
      d = Da(a.baseId, i.value),
      f = Oa(a.baseId, i.value),
      p = s.useRef(!1),
      v = s.useRef(!1),
      m = i.value === a.value
    return u.jsxs(u.Fragment, {
      children: [
        u.jsx(Lo.ItemSlot, {
          scope: t,
          value: i.value,
          children: u.jsx(Na, {
            asChild: !0,
            children: u.jsx(S.button, {
              id: d,
              disabled: r,
              'data-disabled': r ? '' : void 0,
              'data-state': Bo(m),
              'aria-expanded': m,
              'aria-controls': f,
              ...n,
              ref: l,
              onPointerEnter: y(e.onPointerEnter, () => {
                ;((v.current = !1), (i.wasEscapeCloseRef.current = !1))
              }),
              onPointerMove: y(
                e.onPointerMove,
                mt(() => {
                  r ||
                    v.current ||
                    i.wasEscapeCloseRef.current ||
                    p.current ||
                    (a.onTriggerEnter(i.value), (p.current = !0))
                }),
              ),
              onPointerLeave: y(
                e.onPointerLeave,
                mt(() => {
                  r || (a.onTriggerLeave(), (p.current = !1))
                }),
              ),
              onClick: y(e.onClick, () => {
                ;(a.onItemSelect(i.value), (v.current = m))
              }),
              onKeyDown: y(e.onKeyDown, (h) => {
                const C = {
                  horizontal: 'ArrowDown',
                  vertical: a.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight',
                }[a.orientation]
                m && h.key === C && (i.onEntryKeyDown(), h.preventDefault())
              }),
            }),
          }),
        }),
        m &&
          u.jsxs(u.Fragment, {
            children: [
              u.jsx(br, {
                'aria-hidden': !0,
                tabIndex: 0,
                ref: i.focusProxyRef,
                onFocus: (h) => {
                  const g = i.contentRef.current,
                    C = h.relatedTarget,
                    w = C === c.current,
                    x = g?.contains(C)
                  ;(w || !x) && i.onFocusProxyEnter(w ? 'start' : 'end')
                },
              }),
              a.viewport && u.jsx('span', { 'aria-owns': f }),
            ],
          }),
      ],
    })
  })
Sa.displayName = wo
var Ku = 'NavigationMenuLink',
  _n = 'navigationMenu.linkSelect',
  Pa = s.forwardRef((e, o) => {
    const { __scopeNavigationMenu: t, active: r, onSelect: n, ...a } = e
    return u.jsx(Na, {
      asChild: !0,
      children: u.jsx(S.a, {
        'data-active': r ? '' : void 0,
        'aria-current': r ? 'page' : void 0,
        ...a,
        ref: o,
        onClick: y(
          e.onClick,
          (i) => {
            const c = i.target,
              l = new CustomEvent(_n, { bubbles: !0, cancelable: !0 })
            if (
              (c.addEventListener(_n, (d) => n?.(d), { once: !0 }),
              ft(c, l),
              !l.defaultPrevented && !i.metaKey)
            ) {
              const d = new CustomEvent(dt, { bubbles: !0, cancelable: !0 })
              ft(c, d)
            }
          },
          { checkForDefaultPrevented: !1 },
        ),
      }),
    })
  })
Pa.displayName = Ku
var Fo = 'NavigationMenuIndicator',
  _a = s.forwardRef((e, o) => {
    const { forceMount: t, ...r } = e,
      n = ue(Fo, e.__scopeNavigationMenu),
      a = !!n.value
    return n.indicatorTrack
      ? Ln.createPortal(
          u.jsx(X, { present: t || a, children: u.jsx(Uu, { ...r, ref: o }) }),
          n.indicatorTrack,
        )
      : null
  })
_a.displayName = Fo
var Uu = s.forwardRef((e, o) => {
    const { __scopeNavigationMenu: t, ...r } = e,
      n = ue(Fo, t),
      a = ha(t),
      [i, c] = s.useState(null),
      [l, d] = s.useState(null),
      f = n.orientation === 'horizontal',
      p = !!n.value
    s.useEffect(() => {
      const h = a().find((g) => g.value === n.value)?.ref.current
      h && c(h)
    }, [a, n.value])
    const v = () => {
      i && d({ size: f ? i.offsetWidth : i.offsetHeight, offset: f ? i.offsetLeft : i.offsetTop })
    }
    return (
      yo(i, v),
      yo(n.indicatorTrack, v),
      l
        ? u.jsx(S.div, {
            'aria-hidden': !0,
            'data-state': p ? 'visible' : 'hidden',
            'data-orientation': n.orientation,
            ...r,
            ref: o,
            style: {
              position: 'absolute',
              ...(f
                ? { left: 0, width: l.size + 'px', transform: `translateX(${l.offset}px)` }
                : { top: 0, height: l.size + 'px', transform: `translateY(${l.offset}px)` }),
              ...r.style,
            },
          })
        : null
    )
  }),
  Ke = 'NavigationMenuContent',
  Ia = s.forwardRef((e, o) => {
    const { forceMount: t, ...r } = e,
      n = ue(Ke, e.__scopeNavigationMenu),
      a = Ra(Ke, e.__scopeNavigationMenu),
      i = O(a.contentRef, o),
      c = a.value === n.value,
      l = {
        value: a.value,
        triggerRef: a.triggerRef,
        focusProxyRef: a.focusProxyRef,
        wasEscapeCloseRef: a.wasEscapeCloseRef,
        onContentFocusOutside: a.onContentFocusOutside,
        onRootContentClose: a.onRootContentClose,
        ...r,
      }
    return n.viewport
      ? u.jsx(Hu, { forceMount: t, ...l, ref: i })
      : u.jsx(X, {
          present: t || c,
          children: u.jsx(Ta, {
            'data-state': Bo(c),
            ...l,
            ref: i,
            onPointerEnter: y(e.onPointerEnter, n.onContentEnter),
            onPointerLeave: y(e.onPointerLeave, mt(n.onContentLeave)),
            style: { pointerEvents: !c && n.isRootMenu ? 'none' : void 0, ...l.style },
          }),
        })
  })
Ia.displayName = Ke
var Hu = s.forwardRef((e, o) => {
    const t = ue(Ke, e.__scopeNavigationMenu),
      { onViewportContentChange: r, onViewportContentRemove: n } = t
    return (
      Y(() => {
        r(e.value, { ref: o, ...e })
      }, [e, o, r]),
      Y(() => () => n(e.value), [e.value, n]),
      null
    )
  }),
  dt = 'navigationMenu.rootContentDismiss',
  Ta = s.forwardRef((e, o) => {
    const {
        __scopeNavigationMenu: t,
        value: r,
        triggerRef: n,
        focusProxyRef: a,
        wasEscapeCloseRef: i,
        onRootContentClose: c,
        onContentFocusOutside: l,
        ...d
      } = e,
      f = ue(Ke, t),
      p = s.useRef(null),
      v = O(p, o),
      m = Da(f.baseId, r),
      h = Oa(f.baseId, r),
      g = ha(t),
      C = s.useRef(null),
      { onItemDismiss: w } = f
    s.useEffect(() => {
      const b = p.current
      if (f.isRootMenu && b) {
        const E = () => {
          ;(w(), c(), b.contains(document.activeElement) && n.current?.focus())
        }
        return (b.addEventListener(dt, E), () => b.removeEventListener(dt, E))
      }
    }, [f.isRootMenu, e.value, n, w, c])
    const x = s.useMemo(() => {
      const E = g().map((k) => k.value)
      f.dir === 'rtl' && E.reverse()
      const I = E.indexOf(f.value),
        T = E.indexOf(f.previousValue),
        _ = r === f.value,
        N = T === E.indexOf(r)
      if (!_ && !N) return C.current
      const A = (() => {
        if (I !== T) {
          if (_ && T !== -1) return I > T ? 'from-end' : 'from-start'
          if (N && I !== -1) return I > T ? 'to-start' : 'to-end'
        }
        return null
      })()
      return ((C.current = A), A)
    }, [f.previousValue, f.value, f.dir, g, r])
    return u.jsx(Ma, {
      asChild: !0,
      children: u.jsx(je, {
        id: h,
        'aria-labelledby': m,
        'data-motion': x,
        'data-orientation': f.orientation,
        ...d,
        ref: v,
        disableOutsidePointerEvents: !1,
        onDismiss: () => {
          const b = new Event(dt, { bubbles: !0, cancelable: !0 })
          p.current?.dispatchEvent(b)
        },
        onFocusOutside: y(e.onFocusOutside, (b) => {
          l()
          const E = b.target
          f.rootNavigationMenu?.contains(E) && b.preventDefault()
        }),
        onPointerDownOutside: y(e.onPointerDownOutside, (b) => {
          const E = b.target,
            I = g().some((_) => _.ref.current?.contains(E)),
            T = f.isRootMenu && f.viewport?.contains(E)
          ;(I || T || !f.isRootMenu) && b.preventDefault()
        }),
        onKeyDown: y(e.onKeyDown, (b) => {
          const E = b.altKey || b.ctrlKey || b.metaKey
          if (b.key === 'Tab' && !E) {
            const T = bo(b.currentTarget),
              _ = document.activeElement,
              N = T.findIndex((V) => V === _),
              k = b.shiftKey ? T.slice(0, N).reverse() : T.slice(N + 1, T.length)
            Go(k) ? b.preventDefault() : a.current?.focus()
          }
        }),
        onEscapeKeyDown: y(e.onEscapeKeyDown, (b) => {
          i.current = !0
        }),
      }),
    })
  }),
  Vo = 'NavigationMenuViewport',
  Aa = s.forwardRef((e, o) => {
    const { forceMount: t, ...r } = e,
      a = !!ue(Vo, e.__scopeNavigationMenu).value
    return u.jsx(X, { present: t || a, children: u.jsx(Wu, { ...r, ref: o }) })
  })
Aa.displayName = Vo
var Wu = s.forwardRef((e, o) => {
    const { __scopeNavigationMenu: t, children: r, ...n } = e,
      a = ue(Vo, t),
      i = O(o, a.onViewportChange),
      c = Vu(Ke, e.__scopeNavigationMenu),
      [l, d] = s.useState(null),
      [f, p] = s.useState(null),
      v = l ? l?.width + 'px' : void 0,
      m = l ? l?.height + 'px' : void 0,
      h = !!a.value,
      g = h ? a.value : a.previousValue
    return (
      yo(f, () => {
        f && d({ width: f.offsetWidth, height: f.offsetHeight })
      }),
      u.jsx(S.div, {
        'data-state': Bo(h),
        'data-orientation': a.orientation,
        ...n,
        ref: i,
        style: {
          pointerEvents: !h && a.isRootMenu ? 'none' : void 0,
          '--radix-navigation-menu-viewport-width': v,
          '--radix-navigation-menu-viewport-height': m,
          ...n.style,
        },
        onPointerEnter: y(e.onPointerEnter, a.onContentEnter),
        onPointerLeave: y(e.onPointerLeave, mt(a.onContentLeave)),
        children: Array.from(c.items).map(([w, { ref: x, forceMount: b, ...E }]) => {
          const I = g === w
          return u.jsx(
            X,
            {
              present: b || I,
              children: u.jsx(Ta, {
                ...E,
                ref: me(x, (T) => {
                  I && T && p(T)
                }),
              }),
            },
            w,
          )
        }),
      })
    )
  }),
  zu = 'FocusGroup',
  Ma = s.forwardRef((e, o) => {
    const { __scopeNavigationMenu: t, ...r } = e,
      n = ue(zu, t)
    return u.jsx(Co.Provider, {
      scope: t,
      children: u.jsx(Co.Slot, { scope: t, children: u.jsx(S.div, { dir: n.dir, ...r, ref: o }) }),
    })
  }),
  In = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'],
  Yu = 'FocusGroupItem',
  Na = s.forwardRef((e, o) => {
    const { __scopeNavigationMenu: t, ...r } = e,
      n = ku(t),
      a = ue(Yu, t)
    return u.jsx(Co.ItemSlot, {
      scope: t,
      children: u.jsx(S.button, {
        ...r,
        ref: o,
        onKeyDown: y(e.onKeyDown, (i) => {
          if (['Home', 'End', ...In].includes(i.key)) {
            let l = n().map((p) => p.ref.current)
            if (
              ([a.dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft', 'ArrowUp', 'End'].includes(i.key) &&
                l.reverse(),
              In.includes(i.key))
            ) {
              const p = l.indexOf(i.currentTarget)
              l = l.slice(p + 1)
            }
            ;(setTimeout(() => Go(l)), i.preventDefault())
          }
        }),
      }),
    })
  })
function bo(e) {
  const o = [],
    t = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (r) => {
        const n = r.tagName === 'INPUT' && r.type === 'hidden'
        return r.disabled || r.hidden || n
          ? NodeFilter.FILTER_SKIP
          : r.tabIndex >= 0
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP
      },
    })
  for (; t.nextNode(); ) o.push(t.currentNode)
  return o
}
function Go(e) {
  const o = document.activeElement
  return e.some((t) => (t === o ? !0 : (t.focus(), document.activeElement !== o)))
}
function Xu(e) {
  return (
    e.forEach((o) => {
      ;((o.dataset.tabindex = o.getAttribute('tabindex') || ''), o.setAttribute('tabindex', '-1'))
    }),
    () => {
      e.forEach((o) => {
        const t = o.dataset.tabindex
        o.setAttribute('tabindex', t)
      })
    }
  )
}
function yo(e, o) {
  const t = W(o)
  Y(() => {
    let r = 0
    if (e) {
      const n = new ResizeObserver(() => {
        ;(cancelAnimationFrame(r), (r = window.requestAnimationFrame(t)))
      })
      return (
        n.observe(e),
        () => {
          ;(window.cancelAnimationFrame(r), n.unobserve(e))
        }
      )
    }
  }, [e, t])
}
function Bo(e) {
  return e ? 'open' : 'closed'
}
function Da(e, o) {
  return `${e}-trigger-${o}`
}
function Oa(e, o) {
  return `${e}-content-${o}`
}
function mt(e) {
  return (o) => (o.pointerType === 'mouse' ? e(o) : void 0)
}
var Iv = Ca,
  Tv = ba,
  Av = Ea,
  Mv = Sa,
  Nv = Pa,
  Dv = _a,
  Ov = Ia,
  jv = Aa,
  io = 'rovingFocusGroup.onEntryFocus',
  qu = { bubbles: !1, cancelable: !0 },
  st = 'RovingFocusGroup',
  [Ro, ja, Zu] = ze(st),
  [Ju, Ie] = ee(st, [Zu]),
  [Qu, ed] = Ju(st),
  ka = s.forwardRef((e, o) =>
    u.jsx(Ro.Provider, {
      scope: e.__scopeRovingFocusGroup,
      children: u.jsx(Ro.Slot, {
        scope: e.__scopeRovingFocusGroup,
        children: u.jsx(td, { ...e, ref: o }),
      }),
    }),
  )
ka.displayName = st
var td = s.forwardRef((e, o) => {
    const {
        __scopeRovingFocusGroup: t,
        orientation: r,
        loop: n = !1,
        dir: a,
        currentTabStopId: i,
        defaultCurrentTabStopId: c,
        onCurrentTabStopIdChange: l,
        onEntryFocus: d,
        preventScrollOnEntryFocus: f = !1,
        ...p
      } = e,
      v = s.useRef(null),
      m = O(o, v),
      h = he(a),
      [g, C] = re({ prop: i, defaultProp: c ?? null, onChange: l, caller: st }),
      [w, x] = s.useState(!1),
      b = W(d),
      E = ja(t),
      I = s.useRef(!1),
      [T, _] = s.useState(0)
    return (
      s.useEffect(() => {
        const N = v.current
        if (N) return (N.addEventListener(io, b), () => N.removeEventListener(io, b))
      }, [b]),
      u.jsx(Qu, {
        scope: t,
        orientation: r,
        dir: h,
        loop: n,
        currentTabStopId: g,
        onItemFocus: s.useCallback((N) => C(N), [C]),
        onItemShiftTab: s.useCallback(() => x(!0), []),
        onFocusableItemAdd: s.useCallback(() => _((N) => N + 1), []),
        onFocusableItemRemove: s.useCallback(() => _((N) => N - 1), []),
        children: u.jsx(S.div, {
          tabIndex: w || T === 0 ? -1 : 0,
          'data-orientation': r,
          ...p,
          ref: m,
          style: { outline: 'none', ...e.style },
          onMouseDown: y(e.onMouseDown, () => {
            I.current = !0
          }),
          onFocus: y(e.onFocus, (N) => {
            const A = !I.current
            if (N.target === N.currentTarget && A && !w) {
              const k = new CustomEvent(io, qu)
              if ((N.currentTarget.dispatchEvent(k), !k.defaultPrevented)) {
                const V = E().filter((K) => K.focusable),
                  Z = V.find((K) => K.active),
                  te = V.find((K) => K.id === g),
                  J = [Z, te, ...V].filter(Boolean).map((K) => K.ref.current)
                Fa(J, f)
              }
            }
            I.current = !1
          }),
          onBlur: y(e.onBlur, () => x(!1)),
        }),
      })
    )
  }),
  La = 'RovingFocusGroupItem',
  $a = s.forwardRef((e, o) => {
    const {
        __scopeRovingFocusGroup: t,
        focusable: r = !0,
        active: n = !1,
        tabStopId: a,
        children: i,
        ...c
      } = e,
      l = Q(),
      d = a || l,
      f = ed(La, t),
      p = f.currentTabStopId === d,
      v = ja(t),
      { onFocusableItemAdd: m, onFocusableItemRemove: h, currentTabStopId: g } = f
    return (
      s.useEffect(() => {
        if (r) return (m(), () => h())
      }, [r, m, h]),
      u.jsx(Ro.ItemSlot, {
        scope: t,
        id: d,
        focusable: r,
        active: n,
        children: u.jsx(S.span, {
          tabIndex: p ? 0 : -1,
          'data-orientation': f.orientation,
          ...c,
          ref: o,
          onMouseDown: y(e.onMouseDown, (C) => {
            r ? f.onItemFocus(d) : C.preventDefault()
          }),
          onFocus: y(e.onFocus, () => f.onItemFocus(d)),
          onKeyDown: y(e.onKeyDown, (C) => {
            if (C.key === 'Tab' && C.shiftKey) {
              f.onItemShiftTab()
              return
            }
            if (C.target !== C.currentTarget) return
            const w = rd(C, f.orientation, f.dir)
            if (w !== void 0) {
              if (C.metaKey || C.ctrlKey || C.altKey || C.shiftKey) return
              C.preventDefault()
              let b = v()
                .filter((E) => E.focusable)
                .map((E) => E.ref.current)
              if (w === 'last') b.reverse()
              else if (w === 'prev' || w === 'next') {
                w === 'prev' && b.reverse()
                const E = b.indexOf(C.currentTarget)
                b = f.loop ? ad(b, E + 1) : b.slice(E + 1)
              }
              setTimeout(() => Fa(b))
            }
          }),
          children: typeof i == 'function' ? i({ isCurrentTabStop: p, hasTabStop: g != null }) : i,
        }),
      })
    )
  })
$a.displayName = La
var od = {
  ArrowLeft: 'prev',
  ArrowUp: 'prev',
  ArrowRight: 'next',
  ArrowDown: 'next',
  PageUp: 'first',
  Home: 'first',
  PageDown: 'last',
  End: 'last',
}
function nd(e, o) {
  return o !== 'rtl' ? e : e === 'ArrowLeft' ? 'ArrowRight' : e === 'ArrowRight' ? 'ArrowLeft' : e
}
function rd(e, o, t) {
  const r = nd(e.key, t)
  if (
    !(o === 'vertical' && ['ArrowLeft', 'ArrowRight'].includes(r)) &&
    !(o === 'horizontal' && ['ArrowUp', 'ArrowDown'].includes(r))
  )
    return od[r]
}
function Fa(e, o = !1) {
  const t = document.activeElement
  for (const r of e)
    if (r === t || (r.focus({ preventScroll: o }), document.activeElement !== t)) return
}
function ad(e, o) {
  return e.map((t, r) => e[(o + r) % e.length])
}
var kt = ka,
  Lt = $a,
  Eo = ['Enter', ' '],
  sd = ['ArrowDown', 'PageUp', 'Home'],
  Va = ['ArrowUp', 'PageDown', 'End'],
  id = [...sd, ...Va],
  cd = { ltr: [...Eo, 'ArrowRight'], rtl: [...Eo, 'ArrowLeft'] },
  ld = { ltr: ['ArrowLeft'], rtl: ['ArrowRight'] },
  it = 'Menu',
  [Je, ud, dd] = ze(it),
  [Le, Ga] = ee(it, [dd, Ee, Ie]),
  $t = Ee(),
  Ba = Ie(),
  [fd, $e] = Le(it),
  [pd, ct] = Le(it),
  Ka = (e) => {
    const { __scopeMenu: o, open: t = !1, children: r, dir: n, onOpenChange: a, modal: i = !0 } = e,
      c = $t(o),
      [l, d] = s.useState(null),
      f = s.useRef(!1),
      p = W(a),
      v = he(n)
    return (
      s.useEffect(() => {
        const m = () => {
            ;((f.current = !0),
              document.addEventListener('pointerdown', h, { capture: !0, once: !0 }),
              document.addEventListener('pointermove', h, { capture: !0, once: !0 }))
          },
          h = () => (f.current = !1)
        return (
          document.addEventListener('keydown', m, { capture: !0 }),
          () => {
            ;(document.removeEventListener('keydown', m, { capture: !0 }),
              document.removeEventListener('pointerdown', h, { capture: !0 }),
              document.removeEventListener('pointermove', h, { capture: !0 }))
          }
        )
      }, []),
      u.jsx(Tt, {
        ...c,
        children: u.jsx(fd, {
          scope: o,
          open: t,
          onOpenChange: p,
          content: l,
          onContentChange: d,
          children: u.jsx(pd, {
            scope: o,
            onClose: s.useCallback(() => p(!1), [p]),
            isUsingKeyboardRef: f,
            dir: v,
            modal: i,
            children: r,
          }),
        }),
      })
    )
  }
Ka.displayName = it
var vd = 'MenuAnchor',
  Ko = s.forwardRef((e, o) => {
    const { __scopeMenu: t, ...r } = e,
      n = $t(t)
    return u.jsx(nt, { ...n, ...r, ref: o })
  })
Ko.displayName = vd
var Uo = 'MenuPortal',
  [md, Ua] = Le(Uo, { forceMount: void 0 }),
  Ha = (e) => {
    const { __scopeMenu: o, forceMount: t, children: r, container: n } = e,
      a = $e(Uo, o)
    return u.jsx(md, {
      scope: o,
      forceMount: t,
      children: u.jsx(X, {
        present: t || a.open,
        children: u.jsx(We, { asChild: !0, container: n, children: r }),
      }),
    })
  }
Ha.displayName = Uo
var le = 'MenuContent',
  [gd, Ho] = Le(le),
  Wa = s.forwardRef((e, o) => {
    const t = Ua(le, e.__scopeMenu),
      { forceMount: r = t.forceMount, ...n } = e,
      a = $e(le, e.__scopeMenu),
      i = ct(le, e.__scopeMenu)
    return u.jsx(Je.Provider, {
      scope: e.__scopeMenu,
      children: u.jsx(X, {
        present: r || a.open,
        children: u.jsx(Je.Slot, {
          scope: e.__scopeMenu,
          children: i.modal ? u.jsx(hd, { ...n, ref: o }) : u.jsx(Cd, { ...n, ref: o }),
        }),
      }),
    })
  }),
  hd = s.forwardRef((e, o) => {
    const t = $e(le, e.__scopeMenu),
      r = s.useRef(null),
      n = O(o, r)
    return (
      s.useEffect(() => {
        const a = r.current
        if (a) return Et(a)
      }, []),
      u.jsx(Wo, {
        ...e,
        ref: n,
        trapFocus: t.open,
        disableOutsidePointerEvents: t.open,
        disableOutsideScroll: !0,
        onFocusOutside: y(e.onFocusOutside, (a) => a.preventDefault(), {
          checkForDefaultPrevented: !1,
        }),
        onDismiss: () => t.onOpenChange(!1),
      })
    )
  }),
  Cd = s.forwardRef((e, o) => {
    const t = $e(le, e.__scopeMenu)
    return u.jsx(Wo, {
      ...e,
      ref: o,
      trapFocus: !1,
      disableOutsidePointerEvents: !1,
      disableOutsideScroll: !1,
      onDismiss: () => t.onOpenChange(!1),
    })
  }),
  xd = be('MenuContent.ScrollLock'),
  Wo = s.forwardRef((e, o) => {
    const {
        __scopeMenu: t,
        loop: r = !1,
        trapFocus: n,
        onOpenAutoFocus: a,
        onCloseAutoFocus: i,
        disableOutsidePointerEvents: c,
        onEntryFocus: l,
        onEscapeKeyDown: d,
        onPointerDownOutside: f,
        onFocusOutside: p,
        onInteractOutside: v,
        onDismiss: m,
        disableOutsideScroll: h,
        ...g
      } = e,
      C = $e(le, t),
      w = ct(le, t),
      x = $t(t),
      b = Ba(t),
      E = ud(t),
      [I, T] = s.useState(null),
      _ = s.useRef(null),
      N = O(o, _, C.onContentChange),
      A = s.useRef(0),
      k = s.useRef(''),
      V = s.useRef(0),
      Z = s.useRef(null),
      te = s.useRef('right'),
      q = s.useRef(0),
      J = h ? Rt : s.Fragment,
      K = h ? { as: xd, allowPinchZoom: !0 } : void 0,
      oe = (D) => {
        const se = k.current + D,
          ae = E().filter((P) => !P.disabled),
          R = document.activeElement,
          j = ae.find((P) => P.ref.current === R)?.textValue,
          L = ae.map((P) => P.textValue),
          M = Md(L, se, j),
          $ = ae.find((P) => P.textValue === M)?.ref.current
        ;((function P(F) {
          ;((k.current = F),
            window.clearTimeout(A.current),
            F !== '' && (A.current = window.setTimeout(() => P(''), 1e3)))
        })(se),
          $ && setTimeout(() => $.focus()))
      }
    ;(s.useEffect(() => () => window.clearTimeout(A.current), []), St())
    const H = s.useCallback((D) => te.current === Z.current?.side && Dd(D, Z.current?.area), [])
    return u.jsx(gd, {
      scope: t,
      searchRef: k,
      onItemEnter: s.useCallback(
        (D) => {
          H(D) && D.preventDefault()
        },
        [H],
      ),
      onItemLeave: s.useCallback(
        (D) => {
          H(D) || (_.current?.focus(), T(null))
        },
        [H],
      ),
      onTriggerLeave: s.useCallback(
        (D) => {
          H(D) && D.preventDefault()
        },
        [H],
      ),
      pointerGraceTimerRef: V,
      onPointerGraceIntentChange: s.useCallback((D) => {
        Z.current = D
      }, []),
      children: u.jsx(J, {
        ...K,
        children: u.jsx(tt, {
          asChild: !0,
          trapped: n,
          onMountAutoFocus: y(a, (D) => {
            ;(D.preventDefault(), _.current?.focus({ preventScroll: !0 }))
          }),
          onUnmountAutoFocus: i,
          children: u.jsx(je, {
            asChild: !0,
            disableOutsidePointerEvents: c,
            onEscapeKeyDown: d,
            onPointerDownOutside: f,
            onFocusOutside: p,
            onInteractOutside: v,
            onDismiss: m,
            children: u.jsx(kt, {
              asChild: !0,
              ...b,
              dir: w.dir,
              orientation: 'vertical',
              loop: r,
              currentTabStopId: I,
              onCurrentTabStopIdChange: T,
              onEntryFocus: y(l, (D) => {
                w.isUsingKeyboardRef.current || D.preventDefault()
              }),
              preventScrollOnEntryFocus: !0,
              children: u.jsx(At, {
                role: 'menu',
                'aria-orientation': 'vertical',
                'data-state': cs(C.open),
                'data-radix-menu-content': '',
                dir: w.dir,
                ...x,
                ...g,
                ref: N,
                style: { outline: 'none', ...g.style },
                onKeyDown: y(g.onKeyDown, (D) => {
                  const ae = D.target.closest('[data-radix-menu-content]') === D.currentTarget,
                    R = D.ctrlKey || D.altKey || D.metaKey,
                    j = D.key.length === 1
                  ae && (D.key === 'Tab' && D.preventDefault(), !R && j && oe(D.key))
                  const L = _.current
                  if (D.target !== L || !id.includes(D.key)) return
                  D.preventDefault()
                  const $ = E()
                    .filter((P) => !P.disabled)
                    .map((P) => P.ref.current)
                  ;(Va.includes(D.key) && $.reverse(), Td($))
                }),
                onBlur: y(e.onBlur, (D) => {
                  D.currentTarget.contains(D.target) ||
                    (window.clearTimeout(A.current), (k.current = ''))
                }),
                onPointerMove: y(
                  e.onPointerMove,
                  Qe((D) => {
                    const se = D.target,
                      ae = q.current !== D.clientX
                    if (D.currentTarget.contains(se) && ae) {
                      const R = D.clientX > q.current ? 'right' : 'left'
                      ;((te.current = R), (q.current = D.clientX))
                    }
                  }),
                ),
              }),
            }),
          }),
        }),
      }),
    })
  })
Wa.displayName = le
var wd = 'MenuGroup',
  zo = s.forwardRef((e, o) => {
    const { __scopeMenu: t, ...r } = e
    return u.jsx(S.div, { role: 'group', ...r, ref: o })
  })
zo.displayName = wd
var bd = 'MenuLabel',
  za = s.forwardRef((e, o) => {
    const { __scopeMenu: t, ...r } = e
    return u.jsx(S.div, { ...r, ref: o })
  })
za.displayName = bd
var gt = 'MenuItem',
  Tn = 'menu.itemSelect',
  Ft = s.forwardRef((e, o) => {
    const { disabled: t = !1, onSelect: r, ...n } = e,
      a = s.useRef(null),
      i = ct(gt, e.__scopeMenu),
      c = Ho(gt, e.__scopeMenu),
      l = O(o, a),
      d = s.useRef(!1),
      f = () => {
        const p = a.current
        if (!t && p) {
          const v = new CustomEvent(Tn, { bubbles: !0, cancelable: !0 })
          ;(p.addEventListener(Tn, (m) => r?.(m), { once: !0 }),
            ft(p, v),
            v.defaultPrevented ? (d.current = !1) : i.onClose())
        }
      }
    return u.jsx(Ya, {
      ...n,
      ref: l,
      disabled: t,
      onClick: y(e.onClick, f),
      onPointerDown: (p) => {
        ;(e.onPointerDown?.(p), (d.current = !0))
      },
      onPointerUp: y(e.onPointerUp, (p) => {
        d.current || p.currentTarget?.click()
      }),
      onKeyDown: y(e.onKeyDown, (p) => {
        const v = c.searchRef.current !== ''
        t ||
          (v && p.key === ' ') ||
          (Eo.includes(p.key) && (p.currentTarget.click(), p.preventDefault()))
      }),
    })
  })
Ft.displayName = gt
var Ya = s.forwardRef((e, o) => {
    const { __scopeMenu: t, disabled: r = !1, textValue: n, ...a } = e,
      i = Ho(gt, t),
      c = Ba(t),
      l = s.useRef(null),
      d = O(o, l),
      [f, p] = s.useState(!1),
      [v, m] = s.useState('')
    return (
      s.useEffect(() => {
        const h = l.current
        h && m((h.textContent ?? '').trim())
      }, [a.children]),
      u.jsx(Je.ItemSlot, {
        scope: t,
        disabled: r,
        textValue: n ?? v,
        children: u.jsx(Lt, {
          asChild: !0,
          ...c,
          focusable: !r,
          children: u.jsx(S.div, {
            role: 'menuitem',
            'data-highlighted': f ? '' : void 0,
            'aria-disabled': r || void 0,
            'data-disabled': r ? '' : void 0,
            ...a,
            ref: d,
            onPointerMove: y(
              e.onPointerMove,
              Qe((h) => {
                r
                  ? i.onItemLeave(h)
                  : (i.onItemEnter(h),
                    h.defaultPrevented || h.currentTarget.focus({ preventScroll: !0 }))
              }),
            ),
            onPointerLeave: y(
              e.onPointerLeave,
              Qe((h) => i.onItemLeave(h)),
            ),
            onFocus: y(e.onFocus, () => p(!0)),
            onBlur: y(e.onBlur, () => p(!1)),
          }),
        }),
      })
    )
  }),
  yd = 'MenuCheckboxItem',
  Xa = s.forwardRef((e, o) => {
    const { checked: t = !1, onCheckedChange: r, ...n } = e
    return u.jsx(es, {
      scope: e.__scopeMenu,
      checked: t,
      children: u.jsx(Ft, {
        role: 'menuitemcheckbox',
        'aria-checked': ht(t) ? 'mixed' : t,
        ...n,
        ref: o,
        'data-state': Xo(t),
        onSelect: y(n.onSelect, () => r?.(ht(t) ? !0 : !t), { checkForDefaultPrevented: !1 }),
      }),
    })
  })
Xa.displayName = yd
var qa = 'MenuRadioGroup',
  [Rd, Ed] = Le(qa, { value: void 0, onValueChange: () => {} }),
  Za = s.forwardRef((e, o) => {
    const { value: t, onValueChange: r, ...n } = e,
      a = W(r)
    return u.jsx(Rd, {
      scope: e.__scopeMenu,
      value: t,
      onValueChange: a,
      children: u.jsx(zo, { ...n, ref: o }),
    })
  })
Za.displayName = qa
var Ja = 'MenuRadioItem',
  Qa = s.forwardRef((e, o) => {
    const { value: t, ...r } = e,
      n = Ed(Ja, e.__scopeMenu),
      a = t === n.value
    return u.jsx(es, {
      scope: e.__scopeMenu,
      checked: a,
      children: u.jsx(Ft, {
        role: 'menuitemradio',
        'aria-checked': a,
        ...r,
        ref: o,
        'data-state': Xo(a),
        onSelect: y(r.onSelect, () => n.onValueChange?.(t), { checkForDefaultPrevented: !1 }),
      }),
    })
  })
Qa.displayName = Ja
var Yo = 'MenuItemIndicator',
  [es, Sd] = Le(Yo, { checked: !1 }),
  ts = s.forwardRef((e, o) => {
    const { __scopeMenu: t, forceMount: r, ...n } = e,
      a = Sd(Yo, t)
    return u.jsx(X, {
      present: r || ht(a.checked) || a.checked === !0,
      children: u.jsx(S.span, { ...n, ref: o, 'data-state': Xo(a.checked) }),
    })
  })
ts.displayName = Yo
var Pd = 'MenuSeparator',
  os = s.forwardRef((e, o) => {
    const { __scopeMenu: t, ...r } = e
    return u.jsx(S.div, { role: 'separator', 'aria-orientation': 'horizontal', ...r, ref: o })
  })
os.displayName = Pd
var _d = 'MenuArrow',
  ns = s.forwardRef((e, o) => {
    const { __scopeMenu: t, ...r } = e,
      n = $t(t)
    return u.jsx(Mt, { ...n, ...r, ref: o })
  })
ns.displayName = _d
var Id = 'MenuSub',
  [kv, rs] = Le(Id),
  Ze = 'MenuSubTrigger',
  as = s.forwardRef((e, o) => {
    const t = $e(Ze, e.__scopeMenu),
      r = ct(Ze, e.__scopeMenu),
      n = rs(Ze, e.__scopeMenu),
      a = Ho(Ze, e.__scopeMenu),
      i = s.useRef(null),
      { pointerGraceTimerRef: c, onPointerGraceIntentChange: l } = a,
      d = { __scopeMenu: e.__scopeMenu },
      f = s.useCallback(() => {
        ;(i.current && window.clearTimeout(i.current), (i.current = null))
      }, [])
    return (
      s.useEffect(() => f, [f]),
      s.useEffect(() => {
        const p = c.current
        return () => {
          ;(window.clearTimeout(p), l(null))
        }
      }, [c, l]),
      u.jsx(Ko, {
        asChild: !0,
        ...d,
        children: u.jsx(Ya, {
          id: n.triggerId,
          'aria-haspopup': 'menu',
          'aria-expanded': t.open,
          'aria-controls': n.contentId,
          'data-state': cs(t.open),
          ...e,
          ref: me(o, n.onTriggerChange),
          onClick: (p) => {
            ;(e.onClick?.(p),
              !(e.disabled || p.defaultPrevented) &&
                (p.currentTarget.focus(), t.open || t.onOpenChange(!0)))
          },
          onPointerMove: y(
            e.onPointerMove,
            Qe((p) => {
              ;(a.onItemEnter(p),
                !p.defaultPrevented &&
                  !e.disabled &&
                  !t.open &&
                  !i.current &&
                  (a.onPointerGraceIntentChange(null),
                  (i.current = window.setTimeout(() => {
                    ;(t.onOpenChange(!0), f())
                  }, 100))))
            }),
          ),
          onPointerLeave: y(
            e.onPointerLeave,
            Qe((p) => {
              f()
              const v = t.content?.getBoundingClientRect()
              if (v) {
                const m = t.content?.dataset.side,
                  h = m === 'right',
                  g = h ? -5 : 5,
                  C = v[h ? 'left' : 'right'],
                  w = v[h ? 'right' : 'left']
                ;(a.onPointerGraceIntentChange({
                  area: [
                    { x: p.clientX + g, y: p.clientY },
                    { x: C, y: v.top },
                    { x: w, y: v.top },
                    { x: w, y: v.bottom },
                    { x: C, y: v.bottom },
                  ],
                  side: m,
                }),
                  window.clearTimeout(c.current),
                  (c.current = window.setTimeout(() => a.onPointerGraceIntentChange(null), 300)))
              } else {
                if ((a.onTriggerLeave(p), p.defaultPrevented)) return
                a.onPointerGraceIntentChange(null)
              }
            }),
          ),
          onKeyDown: y(e.onKeyDown, (p) => {
            const v = a.searchRef.current !== ''
            e.disabled ||
              (v && p.key === ' ') ||
              (cd[r.dir].includes(p.key) &&
                (t.onOpenChange(!0), t.content?.focus(), p.preventDefault()))
          }),
        }),
      })
    )
  })
as.displayName = Ze
var ss = 'MenuSubContent',
  is = s.forwardRef((e, o) => {
    const t = Ua(le, e.__scopeMenu),
      { forceMount: r = t.forceMount, ...n } = e,
      a = $e(le, e.__scopeMenu),
      i = ct(le, e.__scopeMenu),
      c = rs(ss, e.__scopeMenu),
      l = s.useRef(null),
      d = O(o, l)
    return u.jsx(Je.Provider, {
      scope: e.__scopeMenu,
      children: u.jsx(X, {
        present: r || a.open,
        children: u.jsx(Je.Slot, {
          scope: e.__scopeMenu,
          children: u.jsx(Wo, {
            id: c.contentId,
            'aria-labelledby': c.triggerId,
            ...n,
            ref: d,
            align: 'start',
            side: i.dir === 'rtl' ? 'left' : 'right',
            disableOutsidePointerEvents: !1,
            disableOutsideScroll: !1,
            trapFocus: !1,
            onOpenAutoFocus: (f) => {
              ;(i.isUsingKeyboardRef.current && l.current?.focus(), f.preventDefault())
            },
            onCloseAutoFocus: (f) => f.preventDefault(),
            onFocusOutside: y(e.onFocusOutside, (f) => {
              f.target !== c.trigger && a.onOpenChange(!1)
            }),
            onEscapeKeyDown: y(e.onEscapeKeyDown, (f) => {
              ;(i.onClose(), f.preventDefault())
            }),
            onKeyDown: y(e.onKeyDown, (f) => {
              const p = f.currentTarget.contains(f.target),
                v = ld[i.dir].includes(f.key)
              p && v && (a.onOpenChange(!1), c.trigger?.focus(), f.preventDefault())
            }),
          }),
        }),
      }),
    })
  })
is.displayName = ss
function cs(e) {
  return e ? 'open' : 'closed'
}
function ht(e) {
  return e === 'indeterminate'
}
function Xo(e) {
  return ht(e) ? 'indeterminate' : e ? 'checked' : 'unchecked'
}
function Td(e) {
  const o = document.activeElement
  for (const t of e) if (t === o || (t.focus(), document.activeElement !== o)) return
}
function Ad(e, o) {
  return e.map((t, r) => e[(o + r) % e.length])
}
function Md(e, o, t) {
  const n = o.length > 1 && Array.from(o).every((d) => d === o[0]) ? o[0] : o,
    a = t ? e.indexOf(t) : -1
  let i = Ad(e, Math.max(a, 0))
  n.length === 1 && (i = i.filter((d) => d !== t))
  const l = i.find((d) => d.toLowerCase().startsWith(n.toLowerCase()))
  return l !== t ? l : void 0
}
function Nd(e, o) {
  const { x: t, y: r } = e
  let n = !1
  for (let a = 0, i = o.length - 1; a < o.length; i = a++) {
    const c = o[a],
      l = o[i],
      d = c.x,
      f = c.y,
      p = l.x,
      v = l.y
    f > r != v > r && t < ((p - d) * (r - f)) / (v - f) + d && (n = !n)
  }
  return n
}
function Dd(e, o) {
  if (!o) return !1
  const t = { x: e.clientX, y: e.clientY }
  return Nd(t, o)
}
function Qe(e) {
  return (o) => (o.pointerType === 'mouse' ? e(o) : void 0)
}
var Od = Ka,
  jd = Ko,
  kd = Ha,
  Ld = Wa,
  $d = zo,
  Fd = za,
  Vd = Ft,
  Gd = Xa,
  Bd = Za,
  Kd = Qa,
  Ud = ts,
  Hd = os,
  Wd = ns,
  zd = as,
  Yd = is,
  Vt = 'DropdownMenu',
  [Xd] = ee(Vt, [Ga]),
  ie = Ga(),
  [qd, ls] = Xd(Vt),
  us = (e) => {
    const {
        __scopeDropdownMenu: o,
        children: t,
        dir: r,
        open: n,
        defaultOpen: a,
        onOpenChange: i,
        modal: c = !0,
      } = e,
      l = ie(o),
      d = s.useRef(null),
      [f, p] = re({ prop: n, defaultProp: a ?? !1, onChange: i, caller: Vt })
    return u.jsx(qd, {
      scope: o,
      triggerId: Q(),
      triggerRef: d,
      contentId: Q(),
      open: f,
      onOpenChange: p,
      onOpenToggle: s.useCallback(() => p((v) => !v), [p]),
      modal: c,
      children: u.jsx(Od, { ...l, open: f, onOpenChange: p, dir: r, modal: c, children: t }),
    })
  }
us.displayName = Vt
var ds = 'DropdownMenuTrigger',
  fs = s.forwardRef((e, o) => {
    const { __scopeDropdownMenu: t, disabled: r = !1, ...n } = e,
      a = ls(ds, t),
      i = ie(t)
    return u.jsx(jd, {
      asChild: !0,
      ...i,
      children: u.jsx(S.button, {
        type: 'button',
        id: a.triggerId,
        'aria-haspopup': 'menu',
        'aria-expanded': a.open,
        'aria-controls': a.open ? a.contentId : void 0,
        'data-state': a.open ? 'open' : 'closed',
        'data-disabled': r ? '' : void 0,
        disabled: r,
        ...n,
        ref: me(o, a.triggerRef),
        onPointerDown: y(e.onPointerDown, (c) => {
          !r &&
            c.button === 0 &&
            c.ctrlKey === !1 &&
            (a.onOpenToggle(), a.open || c.preventDefault())
        }),
        onKeyDown: y(e.onKeyDown, (c) => {
          r ||
            (['Enter', ' '].includes(c.key) && a.onOpenToggle(),
            c.key === 'ArrowDown' && a.onOpenChange(!0),
            ['Enter', ' ', 'ArrowDown'].includes(c.key) && c.preventDefault())
        }),
      }),
    })
  })
fs.displayName = ds
var Zd = 'DropdownMenuPortal',
  ps = (e) => {
    const { __scopeDropdownMenu: o, ...t } = e,
      r = ie(o)
    return u.jsx(kd, { ...r, ...t })
  }
ps.displayName = Zd
var vs = 'DropdownMenuContent',
  ms = s.forwardRef((e, o) => {
    const { __scopeDropdownMenu: t, ...r } = e,
      n = ls(vs, t),
      a = ie(t),
      i = s.useRef(!1)
    return u.jsx(Ld, {
      id: n.contentId,
      'aria-labelledby': n.triggerId,
      ...a,
      ...r,
      ref: o,
      onCloseAutoFocus: y(e.onCloseAutoFocus, (c) => {
        ;(i.current || n.triggerRef.current?.focus(), (i.current = !1), c.preventDefault())
      }),
      onInteractOutside: y(e.onInteractOutside, (c) => {
        const l = c.detail.originalEvent,
          d = l.button === 0 && l.ctrlKey === !0,
          f = l.button === 2 || d
        ;(!n.modal || f) && (i.current = !0)
      }),
      style: {
        ...e.style,
        '--radix-dropdown-menu-content-transform-origin': 'var(--radix-popper-transform-origin)',
        '--radix-dropdown-menu-content-available-width': 'var(--radix-popper-available-width)',
        '--radix-dropdown-menu-content-available-height': 'var(--radix-popper-available-height)',
        '--radix-dropdown-menu-trigger-width': 'var(--radix-popper-anchor-width)',
        '--radix-dropdown-menu-trigger-height': 'var(--radix-popper-anchor-height)',
      },
    })
  })
ms.displayName = vs
var Jd = 'DropdownMenuGroup',
  Qd = s.forwardRef((e, o) => {
    const { __scopeDropdownMenu: t, ...r } = e,
      n = ie(t)
    return u.jsx($d, { ...n, ...r, ref: o })
  })
Qd.displayName = Jd
var ef = 'DropdownMenuLabel',
  gs = s.forwardRef((e, o) => {
    const { __scopeDropdownMenu: t, ...r } = e,
      n = ie(t)
    return u.jsx(Fd, { ...n, ...r, ref: o })
  })
gs.displayName = ef
var tf = 'DropdownMenuItem',
  hs = s.forwardRef((e, o) => {
    const { __scopeDropdownMenu: t, ...r } = e,
      n = ie(t)
    return u.jsx(Vd, { ...n, ...r, ref: o })
  })
hs.displayName = tf
var of = 'DropdownMenuCheckboxItem',
  Cs = s.forwardRef((e, o) => {
    const { __scopeDropdownMenu: t, ...r } = e,
      n = ie(t)
    return u.jsx(Gd, { ...n, ...r, ref: o })
  })
Cs.displayName = of
var nf = 'DropdownMenuRadioGroup',
  rf = s.forwardRef((e, o) => {
    const { __scopeDropdownMenu: t, ...r } = e,
      n = ie(t)
    return u.jsx(Bd, { ...n, ...r, ref: o })
  })
rf.displayName = nf
var af = 'DropdownMenuRadioItem',
  xs = s.forwardRef((e, o) => {
    const { __scopeDropdownMenu: t, ...r } = e,
      n = ie(t)
    return u.jsx(Kd, { ...n, ...r, ref: o })
  })
xs.displayName = af
var sf = 'DropdownMenuItemIndicator',
  ws = s.forwardRef((e, o) => {
    const { __scopeDropdownMenu: t, ...r } = e,
      n = ie(t)
    return u.jsx(Ud, { ...n, ...r, ref: o })
  })
ws.displayName = sf
var cf = 'DropdownMenuSeparator',
  bs = s.forwardRef((e, o) => {
    const { __scopeDropdownMenu: t, ...r } = e,
      n = ie(t)
    return u.jsx(Hd, { ...n, ...r, ref: o })
  })
bs.displayName = cf
var lf = 'DropdownMenuArrow',
  uf = s.forwardRef((e, o) => {
    const { __scopeDropdownMenu: t, ...r } = e,
      n = ie(t)
    return u.jsx(Wd, { ...n, ...r, ref: o })
  })
uf.displayName = lf
var df = 'DropdownMenuSubTrigger',
  ys = s.forwardRef((e, o) => {
    const { __scopeDropdownMenu: t, ...r } = e,
      n = ie(t)
    return u.jsx(zd, { ...n, ...r, ref: o })
  })
ys.displayName = df
var ff = 'DropdownMenuSubContent',
  Rs = s.forwardRef((e, o) => {
    const { __scopeDropdownMenu: t, ...r } = e,
      n = ie(t)
    return u.jsx(Yd, {
      ...n,
      ...r,
      ref: o,
      style: {
        ...e.style,
        '--radix-dropdown-menu-content-transform-origin': 'var(--radix-popper-transform-origin)',
        '--radix-dropdown-menu-content-available-width': 'var(--radix-popper-available-width)',
        '--radix-dropdown-menu-content-available-height': 'var(--radix-popper-available-height)',
        '--radix-dropdown-menu-trigger-width': 'var(--radix-popper-anchor-width)',
        '--radix-dropdown-menu-trigger-height': 'var(--radix-popper-anchor-height)',
      },
    })
  })
Rs.displayName = ff
var Lv = us,
  $v = fs,
  Fv = ps,
  Vv = ms,
  Gv = gs,
  Bv = hs,
  Kv = Cs,
  Uv = xs,
  Hv = ws,
  Wv = bs,
  zv = ys,
  Yv = Rs,
  Gt = 'Checkbox',
  [pf] = ee(Gt),
  [vf, qo] = pf(Gt)
function mf(e) {
  const {
      __scopeCheckbox: o,
      checked: t,
      children: r,
      defaultChecked: n,
      disabled: a,
      form: i,
      name: c,
      onCheckedChange: l,
      required: d,
      value: f = 'on',
      internal_do_not_use_render: p,
    } = e,
    [v, m] = re({ prop: t, defaultProp: n ?? !1, onChange: l, caller: Gt }),
    [h, g] = s.useState(null),
    [C, w] = s.useState(null),
    x = s.useRef(!1),
    b = h ? !!i || !!h.closest('form') : !0,
    E = {
      checked: v,
      disabled: a,
      setChecked: m,
      control: h,
      setControl: g,
      name: c,
      form: i,
      value: f,
      hasConsumerStoppedPropagationRef: x,
      required: d,
      defaultChecked: we(n) ? !1 : n,
      isFormControl: b,
      bubbleInput: C,
      setBubbleInput: w,
    }
  return u.jsx(vf, { scope: o, ...E, children: Cf(p) ? p(E) : r })
}
var Es = 'CheckboxTrigger',
  Ss = s.forwardRef(({ __scopeCheckbox: e, onKeyDown: o, onClick: t, ...r }, n) => {
    const {
        control: a,
        value: i,
        disabled: c,
        checked: l,
        required: d,
        setControl: f,
        setChecked: p,
        hasConsumerStoppedPropagationRef: v,
        isFormControl: m,
        bubbleInput: h,
      } = qo(Es, e),
      g = O(n, f),
      C = s.useRef(l)
    return (
      s.useEffect(() => {
        const w = a?.form
        if (w) {
          const x = () => p(C.current)
          return (w.addEventListener('reset', x), () => w.removeEventListener('reset', x))
        }
      }, [a, p]),
      u.jsx(S.button, {
        type: 'button',
        role: 'checkbox',
        'aria-checked': we(l) ? 'mixed' : l,
        'aria-required': d,
        'data-state': Ts(l),
        'data-disabled': c ? '' : void 0,
        disabled: c,
        value: i,
        ...r,
        ref: g,
        onKeyDown: y(o, (w) => {
          w.key === 'Enter' && w.preventDefault()
        }),
        onClick: y(t, (w) => {
          ;(p((x) => (we(x) ? !0 : !x)),
            h && m && ((v.current = w.isPropagationStopped()), v.current || w.stopPropagation()))
        }),
      })
    )
  })
Ss.displayName = Es
var gf = s.forwardRef((e, o) => {
  const {
    __scopeCheckbox: t,
    name: r,
    checked: n,
    defaultChecked: a,
    required: i,
    disabled: c,
    value: l,
    onCheckedChange: d,
    form: f,
    ...p
  } = e
  return u.jsx(mf, {
    __scopeCheckbox: t,
    checked: n,
    defaultChecked: a,
    disabled: c,
    required: i,
    onCheckedChange: d,
    name: r,
    form: f,
    value: l,
    internal_do_not_use_render: ({ isFormControl: v }) =>
      u.jsxs(u.Fragment, {
        children: [
          u.jsx(Ss, { ...p, ref: o, __scopeCheckbox: t }),
          v && u.jsx(Is, { __scopeCheckbox: t }),
        ],
      }),
  })
})
gf.displayName = Gt
var Ps = 'CheckboxIndicator',
  hf = s.forwardRef((e, o) => {
    const { __scopeCheckbox: t, forceMount: r, ...n } = e,
      a = qo(Ps, t)
    return u.jsx(X, {
      present: r || we(a.checked) || a.checked === !0,
      children: u.jsx(S.span, {
        'data-state': Ts(a.checked),
        'data-disabled': a.disabled ? '' : void 0,
        ...n,
        ref: o,
        style: { pointerEvents: 'none', ...e.style },
      }),
    })
  })
hf.displayName = Ps
var _s = 'CheckboxBubbleInput',
  Is = s.forwardRef(({ __scopeCheckbox: e, ...o }, t) => {
    const {
        control: r,
        hasConsumerStoppedPropagationRef: n,
        checked: a,
        defaultChecked: i,
        required: c,
        disabled: l,
        name: d,
        value: f,
        form: p,
        bubbleInput: v,
        setBubbleInput: m,
      } = qo(_s, e),
      h = O(t, m),
      g = at(a),
      C = It(r)
    s.useEffect(() => {
      const x = v
      if (!x) return
      const b = window.HTMLInputElement.prototype,
        I = Object.getOwnPropertyDescriptor(b, 'checked').set,
        T = !n.current
      if (g !== a && I) {
        const _ = new Event('click', { bubbles: T })
        ;((x.indeterminate = we(a)), I.call(x, we(a) ? !1 : a), x.dispatchEvent(_))
      }
    }, [v, g, a, n])
    const w = s.useRef(we(a) ? !1 : a)
    return u.jsx(S.input, {
      type: 'checkbox',
      'aria-hidden': !0,
      defaultChecked: i ?? w.current,
      required: c,
      disabled: l,
      name: d,
      value: f,
      form: p,
      ...o,
      tabIndex: -1,
      ref: h,
      style: {
        ...o.style,
        ...C,
        position: 'absolute',
        pointerEvents: 'none',
        opacity: 0,
        margin: 0,
        transform: 'translateX(-100%)',
      },
    })
  })
Is.displayName = _s
function Cf(e) {
  return typeof e == 'function'
}
function we(e) {
  return e === 'indeterminate'
}
function Ts(e) {
  return we(e) ? 'indeterminate' : e ? 'checked' : 'unchecked'
}
function xf(e, o) {
  return s.useReducer((t, r) => o[t][r] ?? t, e)
}
var Zo = 'ScrollArea',
  [As] = ee(Zo),
  [wf, de] = As(Zo),
  Ms = s.forwardRef((e, o) => {
    const { __scopeScrollArea: t, type: r = 'hover', dir: n, scrollHideDelay: a = 600, ...i } = e,
      [c, l] = s.useState(null),
      [d, f] = s.useState(null),
      [p, v] = s.useState(null),
      [m, h] = s.useState(null),
      [g, C] = s.useState(null),
      [w, x] = s.useState(0),
      [b, E] = s.useState(0),
      [I, T] = s.useState(!1),
      [_, N] = s.useState(!1),
      A = O(o, (V) => l(V)),
      k = he(n)
    return u.jsx(wf, {
      scope: t,
      type: r,
      dir: k,
      scrollHideDelay: a,
      scrollArea: c,
      viewport: d,
      onViewportChange: f,
      content: p,
      onContentChange: v,
      scrollbarX: m,
      onScrollbarXChange: h,
      scrollbarXEnabled: I,
      onScrollbarXEnabledChange: T,
      scrollbarY: g,
      onScrollbarYChange: C,
      scrollbarYEnabled: _,
      onScrollbarYEnabledChange: N,
      onCornerWidthChange: x,
      onCornerHeightChange: E,
      children: u.jsx(S.div, {
        dir: k,
        ...i,
        ref: A,
        style: {
          position: 'relative',
          '--radix-scroll-area-corner-width': w + 'px',
          '--radix-scroll-area-corner-height': b + 'px',
          ...e.style,
        },
      }),
    })
  })
Ms.displayName = Zo
var Ns = 'ScrollAreaViewport',
  Ds = s.forwardRef((e, o) => {
    const { __scopeScrollArea: t, children: r, nonce: n, ...a } = e,
      i = de(Ns, t),
      c = s.useRef(null),
      l = O(o, c, i.onViewportChange)
    return u.jsxs(u.Fragment, {
      children: [
        u.jsx('style', {
          dangerouslySetInnerHTML: {
            __html:
              '[data-radix-scroll-area-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-scroll-area-viewport]::-webkit-scrollbar{display:none}',
          },
          nonce: n,
        }),
        u.jsx(S.div, {
          'data-radix-scroll-area-viewport': '',
          ...a,
          ref: l,
          style: {
            overflowX: i.scrollbarXEnabled ? 'scroll' : 'hidden',
            overflowY: i.scrollbarYEnabled ? 'scroll' : 'hidden',
            ...e.style,
          },
          children: u.jsx('div', {
            ref: i.onContentChange,
            style: { minWidth: '100%', display: 'table' },
            children: r,
          }),
        }),
      ],
    })
  })
Ds.displayName = Ns
var ge = 'ScrollAreaScrollbar',
  bf = s.forwardRef((e, o) => {
    const { forceMount: t, ...r } = e,
      n = de(ge, e.__scopeScrollArea),
      { onScrollbarXEnabledChange: a, onScrollbarYEnabledChange: i } = n,
      c = e.orientation === 'horizontal'
    return (
      s.useEffect(
        () => (
          c ? a(!0) : i(!0),
          () => {
            c ? a(!1) : i(!1)
          }
        ),
        [c, a, i],
      ),
      n.type === 'hover'
        ? u.jsx(yf, { ...r, ref: o, forceMount: t })
        : n.type === 'scroll'
          ? u.jsx(Rf, { ...r, ref: o, forceMount: t })
          : n.type === 'auto'
            ? u.jsx(Os, { ...r, ref: o, forceMount: t })
            : n.type === 'always'
              ? u.jsx(Jo, { ...r, ref: o })
              : null
    )
  })
bf.displayName = ge
var yf = s.forwardRef((e, o) => {
    const { forceMount: t, ...r } = e,
      n = de(ge, e.__scopeScrollArea),
      [a, i] = s.useState(!1)
    return (
      s.useEffect(() => {
        const c = n.scrollArea
        let l = 0
        if (c) {
          const d = () => {
              ;(window.clearTimeout(l), i(!0))
            },
            f = () => {
              l = window.setTimeout(() => i(!1), n.scrollHideDelay)
            }
          return (
            c.addEventListener('pointerenter', d),
            c.addEventListener('pointerleave', f),
            () => {
              ;(window.clearTimeout(l),
                c.removeEventListener('pointerenter', d),
                c.removeEventListener('pointerleave', f))
            }
          )
        }
      }, [n.scrollArea, n.scrollHideDelay]),
      u.jsx(X, {
        present: t || a,
        children: u.jsx(Os, { 'data-state': a ? 'visible' : 'hidden', ...r, ref: o }),
      })
    )
  }),
  Rf = s.forwardRef((e, o) => {
    const { forceMount: t, ...r } = e,
      n = de(ge, e.__scopeScrollArea),
      a = e.orientation === 'horizontal',
      i = Kt(() => l('SCROLL_END'), 100),
      [c, l] = xf('hidden', {
        hidden: { SCROLL: 'scrolling' },
        scrolling: { SCROLL_END: 'idle', POINTER_ENTER: 'interacting' },
        interacting: { SCROLL: 'interacting', POINTER_LEAVE: 'idle' },
        idle: { HIDE: 'hidden', SCROLL: 'scrolling', POINTER_ENTER: 'interacting' },
      })
    return (
      s.useEffect(() => {
        if (c === 'idle') {
          const d = window.setTimeout(() => l('HIDE'), n.scrollHideDelay)
          return () => window.clearTimeout(d)
        }
      }, [c, n.scrollHideDelay, l]),
      s.useEffect(() => {
        const d = n.viewport,
          f = a ? 'scrollLeft' : 'scrollTop'
        if (d) {
          let p = d[f]
          const v = () => {
            const m = d[f]
            ;(p !== m && (l('SCROLL'), i()), (p = m))
          }
          return (d.addEventListener('scroll', v), () => d.removeEventListener('scroll', v))
        }
      }, [n.viewport, a, l, i]),
      u.jsx(X, {
        present: t || c !== 'hidden',
        children: u.jsx(Jo, {
          'data-state': c === 'hidden' ? 'hidden' : 'visible',
          ...r,
          ref: o,
          onPointerEnter: y(e.onPointerEnter, () => l('POINTER_ENTER')),
          onPointerLeave: y(e.onPointerLeave, () => l('POINTER_LEAVE')),
        }),
      })
    )
  }),
  Os = s.forwardRef((e, o) => {
    const t = de(ge, e.__scopeScrollArea),
      { forceMount: r, ...n } = e,
      [a, i] = s.useState(!1),
      c = e.orientation === 'horizontal',
      l = Kt(() => {
        if (t.viewport) {
          const d = t.viewport.offsetWidth < t.viewport.scrollWidth,
            f = t.viewport.offsetHeight < t.viewport.scrollHeight
          i(c ? d : f)
        }
      }, 10)
    return (
      Ue(t.viewport, l),
      Ue(t.content, l),
      u.jsx(X, {
        present: r || a,
        children: u.jsx(Jo, { 'data-state': a ? 'visible' : 'hidden', ...n, ref: o }),
      })
    )
  }),
  Jo = s.forwardRef((e, o) => {
    const { orientation: t = 'vertical', ...r } = e,
      n = de(ge, e.__scopeScrollArea),
      a = s.useRef(null),
      i = s.useRef(0),
      [c, l] = s.useState({
        content: 0,
        viewport: 0,
        scrollbar: { size: 0, paddingStart: 0, paddingEnd: 0 },
      }),
      d = $s(c.viewport, c.content),
      f = {
        ...r,
        sizes: c,
        onSizesChange: l,
        hasThumb: d > 0 && d < 1,
        onThumbChange: (v) => (a.current = v),
        onThumbPointerUp: () => (i.current = 0),
        onThumbPointerDown: (v) => (i.current = v),
      }
    function p(v, m) {
      return Af(v, i.current, c, m)
    }
    return t === 'horizontal'
      ? u.jsx(Ef, {
          ...f,
          ref: o,
          onThumbPositionChange: () => {
            if (n.viewport && a.current) {
              const v = n.viewport.scrollLeft,
                m = An(v, c, n.dir)
              a.current.style.transform = `translate3d(${m}px, 0, 0)`
            }
          },
          onWheelScroll: (v) => {
            n.viewport && (n.viewport.scrollLeft = v)
          },
          onDragScroll: (v) => {
            n.viewport && (n.viewport.scrollLeft = p(v, n.dir))
          },
        })
      : t === 'vertical'
        ? u.jsx(Sf, {
            ...f,
            ref: o,
            onThumbPositionChange: () => {
              if (n.viewport && a.current) {
                const v = n.viewport.scrollTop,
                  m = An(v, c)
                a.current.style.transform = `translate3d(0, ${m}px, 0)`
              }
            },
            onWheelScroll: (v) => {
              n.viewport && (n.viewport.scrollTop = v)
            },
            onDragScroll: (v) => {
              n.viewport && (n.viewport.scrollTop = p(v))
            },
          })
        : null
  }),
  Ef = s.forwardRef((e, o) => {
    const { sizes: t, onSizesChange: r, ...n } = e,
      a = de(ge, e.__scopeScrollArea),
      [i, c] = s.useState(),
      l = s.useRef(null),
      d = O(o, l, a.onScrollbarXChange)
    return (
      s.useEffect(() => {
        l.current && c(getComputedStyle(l.current))
      }, [l]),
      u.jsx(ks, {
        'data-orientation': 'horizontal',
        ...n,
        ref: d,
        sizes: t,
        style: {
          bottom: 0,
          left: a.dir === 'rtl' ? 'var(--radix-scroll-area-corner-width)' : 0,
          right: a.dir === 'ltr' ? 'var(--radix-scroll-area-corner-width)' : 0,
          '--radix-scroll-area-thumb-width': Bt(t) + 'px',
          ...e.style,
        },
        onThumbPointerDown: (f) => e.onThumbPointerDown(f.x),
        onDragScroll: (f) => e.onDragScroll(f.x),
        onWheelScroll: (f, p) => {
          if (a.viewport) {
            const v = a.viewport.scrollLeft + f.deltaX
            ;(e.onWheelScroll(v), Vs(v, p) && f.preventDefault())
          }
        },
        onResize: () => {
          l.current &&
            a.viewport &&
            i &&
            r({
              content: a.viewport.scrollWidth,
              viewport: a.viewport.offsetWidth,
              scrollbar: {
                size: l.current.clientWidth,
                paddingStart: xt(i.paddingLeft),
                paddingEnd: xt(i.paddingRight),
              },
            })
        },
      })
    )
  }),
  Sf = s.forwardRef((e, o) => {
    const { sizes: t, onSizesChange: r, ...n } = e,
      a = de(ge, e.__scopeScrollArea),
      [i, c] = s.useState(),
      l = s.useRef(null),
      d = O(o, l, a.onScrollbarYChange)
    return (
      s.useEffect(() => {
        l.current && c(getComputedStyle(l.current))
      }, [l]),
      u.jsx(ks, {
        'data-orientation': 'vertical',
        ...n,
        ref: d,
        sizes: t,
        style: {
          top: 0,
          right: a.dir === 'ltr' ? 0 : void 0,
          left: a.dir === 'rtl' ? 0 : void 0,
          bottom: 'var(--radix-scroll-area-corner-height)',
          '--radix-scroll-area-thumb-height': Bt(t) + 'px',
          ...e.style,
        },
        onThumbPointerDown: (f) => e.onThumbPointerDown(f.y),
        onDragScroll: (f) => e.onDragScroll(f.y),
        onWheelScroll: (f, p) => {
          if (a.viewport) {
            const v = a.viewport.scrollTop + f.deltaY
            ;(e.onWheelScroll(v), Vs(v, p) && f.preventDefault())
          }
        },
        onResize: () => {
          l.current &&
            a.viewport &&
            i &&
            r({
              content: a.viewport.scrollHeight,
              viewport: a.viewport.offsetHeight,
              scrollbar: {
                size: l.current.clientHeight,
                paddingStart: xt(i.paddingTop),
                paddingEnd: xt(i.paddingBottom),
              },
            })
        },
      })
    )
  }),
  [Pf, js] = As(ge),
  ks = s.forwardRef((e, o) => {
    const {
        __scopeScrollArea: t,
        sizes: r,
        hasThumb: n,
        onThumbChange: a,
        onThumbPointerUp: i,
        onThumbPointerDown: c,
        onThumbPositionChange: l,
        onDragScroll: d,
        onWheelScroll: f,
        onResize: p,
        ...v
      } = e,
      m = de(ge, t),
      [h, g] = s.useState(null),
      C = O(o, (A) => g(A)),
      w = s.useRef(null),
      x = s.useRef(''),
      b = m.viewport,
      E = r.content - r.viewport,
      I = W(f),
      T = W(l),
      _ = Kt(p, 10)
    function N(A) {
      if (w.current) {
        const k = A.clientX - w.current.left,
          V = A.clientY - w.current.top
        d({ x: k, y: V })
      }
    }
    return (
      s.useEffect(() => {
        const A = (k) => {
          const V = k.target
          h?.contains(V) && I(k, E)
        }
        return (
          document.addEventListener('wheel', A, { passive: !1 }),
          () => document.removeEventListener('wheel', A, { passive: !1 })
        )
      }, [b, h, E, I]),
      s.useEffect(T, [r, T]),
      Ue(h, _),
      Ue(m.content, _),
      u.jsx(Pf, {
        scope: t,
        scrollbar: h,
        hasThumb: n,
        onThumbChange: W(a),
        onThumbPointerUp: W(i),
        onThumbPositionChange: T,
        onThumbPointerDown: W(c),
        children: u.jsx(S.div, {
          ...v,
          ref: C,
          style: { position: 'absolute', ...v.style },
          onPointerDown: y(e.onPointerDown, (A) => {
            A.button === 0 &&
              (A.target.setPointerCapture(A.pointerId),
              (w.current = h.getBoundingClientRect()),
              (x.current = document.body.style.webkitUserSelect),
              (document.body.style.webkitUserSelect = 'none'),
              m.viewport && (m.viewport.style.scrollBehavior = 'auto'),
              N(A))
          }),
          onPointerMove: y(e.onPointerMove, N),
          onPointerUp: y(e.onPointerUp, (A) => {
            const k = A.target
            ;(k.hasPointerCapture(A.pointerId) && k.releasePointerCapture(A.pointerId),
              (document.body.style.webkitUserSelect = x.current),
              m.viewport && (m.viewport.style.scrollBehavior = ''),
              (w.current = null))
          }),
        }),
      })
    )
  }),
  Ct = 'ScrollAreaThumb',
  _f = s.forwardRef((e, o) => {
    const { forceMount: t, ...r } = e,
      n = js(Ct, e.__scopeScrollArea)
    return u.jsx(X, { present: t || n.hasThumb, children: u.jsx(If, { ref: o, ...r }) })
  }),
  If = s.forwardRef((e, o) => {
    const { __scopeScrollArea: t, style: r, ...n } = e,
      a = de(Ct, t),
      i = js(Ct, t),
      { onThumbPositionChange: c } = i,
      l = O(o, (p) => i.onThumbChange(p)),
      d = s.useRef(void 0),
      f = Kt(() => {
        d.current && (d.current(), (d.current = void 0))
      }, 100)
    return (
      s.useEffect(() => {
        const p = a.viewport
        if (p) {
          const v = () => {
            if ((f(), !d.current)) {
              const m = Mf(p, c)
              ;((d.current = m), c())
            }
          }
          return (c(), p.addEventListener('scroll', v), () => p.removeEventListener('scroll', v))
        }
      }, [a.viewport, f, c]),
      u.jsx(S.div, {
        'data-state': i.hasThumb ? 'visible' : 'hidden',
        ...n,
        ref: l,
        style: {
          width: 'var(--radix-scroll-area-thumb-width)',
          height: 'var(--radix-scroll-area-thumb-height)',
          ...r,
        },
        onPointerDownCapture: y(e.onPointerDownCapture, (p) => {
          const m = p.target.getBoundingClientRect(),
            h = p.clientX - m.left,
            g = p.clientY - m.top
          i.onThumbPointerDown({ x: h, y: g })
        }),
        onPointerUp: y(e.onPointerUp, i.onThumbPointerUp),
      })
    )
  })
_f.displayName = Ct
var Qo = 'ScrollAreaCorner',
  Ls = s.forwardRef((e, o) => {
    const t = de(Qo, e.__scopeScrollArea),
      r = !!(t.scrollbarX && t.scrollbarY)
    return t.type !== 'scroll' && r ? u.jsx(Tf, { ...e, ref: o }) : null
  })
Ls.displayName = Qo
var Tf = s.forwardRef((e, o) => {
  const { __scopeScrollArea: t, ...r } = e,
    n = de(Qo, t),
    [a, i] = s.useState(0),
    [c, l] = s.useState(0),
    d = !!(a && c)
  return (
    Ue(n.scrollbarX, () => {
      const f = n.scrollbarX?.offsetHeight || 0
      ;(n.onCornerHeightChange(f), l(f))
    }),
    Ue(n.scrollbarY, () => {
      const f = n.scrollbarY?.offsetWidth || 0
      ;(n.onCornerWidthChange(f), i(f))
    }),
    d
      ? u.jsx(S.div, {
          ...r,
          ref: o,
          style: {
            width: a,
            height: c,
            position: 'absolute',
            right: n.dir === 'ltr' ? 0 : void 0,
            left: n.dir === 'rtl' ? 0 : void 0,
            bottom: 0,
            ...e.style,
          },
        })
      : null
  )
})
function xt(e) {
  return e ? parseInt(e, 10) : 0
}
function $s(e, o) {
  const t = e / o
  return isNaN(t) ? 0 : t
}
function Bt(e) {
  const o = $s(e.viewport, e.content),
    t = e.scrollbar.paddingStart + e.scrollbar.paddingEnd,
    r = (e.scrollbar.size - t) * o
  return Math.max(r, 18)
}
function Af(e, o, t, r = 'ltr') {
  const n = Bt(t),
    a = n / 2,
    i = o || a,
    c = n - i,
    l = t.scrollbar.paddingStart + i,
    d = t.scrollbar.size - t.scrollbar.paddingEnd - c,
    f = t.content - t.viewport,
    p = r === 'ltr' ? [0, f] : [f * -1, 0]
  return Fs([l, d], p)(e)
}
function An(e, o, t = 'ltr') {
  const r = Bt(o),
    n = o.scrollbar.paddingStart + o.scrollbar.paddingEnd,
    a = o.scrollbar.size - n,
    i = o.content - o.viewport,
    c = a - r,
    l = t === 'ltr' ? [0, i] : [i * -1, 0],
    d = fo(e, l)
  return Fs([0, i], [0, c])(d)
}
function Fs(e, o) {
  return (t) => {
    if (e[0] === e[1] || o[0] === o[1]) return o[0]
    const r = (o[1] - o[0]) / (e[1] - e[0])
    return o[0] + r * (t - e[0])
  }
}
function Vs(e, o) {
  return e > 0 && e < o
}
var Mf = (e, o = () => {}) => {
  let t = { left: e.scrollLeft, top: e.scrollTop },
    r = 0
  return (
    (function n() {
      const a = { left: e.scrollLeft, top: e.scrollTop },
        i = t.left !== a.left,
        c = t.top !== a.top
      ;((i || c) && o(), (t = a), (r = window.requestAnimationFrame(n)))
    })(),
    () => window.cancelAnimationFrame(r)
  )
}
function Kt(e, o) {
  const t = W(e),
    r = s.useRef(0)
  return (
    s.useEffect(() => () => window.clearTimeout(r.current), []),
    s.useCallback(() => {
      ;(window.clearTimeout(r.current), (r.current = window.setTimeout(t, o)))
    }, [t, o])
  )
}
function Ue(e, o) {
  const t = W(o)
  Y(() => {
    let r = 0
    if (e) {
      const n = new ResizeObserver(() => {
        ;(cancelAnimationFrame(r), (r = window.requestAnimationFrame(t)))
      })
      return (
        n.observe(e),
        () => {
          ;(window.cancelAnimationFrame(r), n.unobserve(e))
        }
      )
    }
  }, [e, t])
}
var Xv = Ms,
  qv = Ds,
  Zv = Ls,
  Nf = 'Separator',
  Mn = 'horizontal',
  Df = ['horizontal', 'vertical'],
  Gs = s.forwardRef((e, o) => {
    const { decorative: t, orientation: r = Mn, ...n } = e,
      a = Of(r) ? r : Mn,
      c = t
        ? { role: 'none' }
        : { 'aria-orientation': a === 'vertical' ? a : void 0, role: 'separator' }
    return u.jsx(S.div, { 'data-orientation': a, ...c, ...n, ref: o })
  })
Gs.displayName = Nf
function Of(e) {
  return Df.includes(e)
}
var Jv = Gs,
  Ut = 'Tabs',
  [jf] = ee(Ut, [Ie]),
  Bs = Ie(),
  [kf, en] = jf(Ut),
  Ks = s.forwardRef((e, o) => {
    const {
        __scopeTabs: t,
        value: r,
        onValueChange: n,
        defaultValue: a,
        orientation: i = 'horizontal',
        dir: c,
        activationMode: l = 'automatic',
        ...d
      } = e,
      f = he(c),
      [p, v] = re({ prop: r, onChange: n, defaultProp: a ?? '', caller: Ut })
    return u.jsx(kf, {
      scope: t,
      baseId: Q(),
      value: p,
      onValueChange: v,
      orientation: i,
      dir: f,
      activationMode: l,
      children: u.jsx(S.div, { dir: f, 'data-orientation': i, ...d, ref: o }),
    })
  })
Ks.displayName = Ut
var Us = 'TabsList',
  Hs = s.forwardRef((e, o) => {
    const { __scopeTabs: t, loop: r = !0, ...n } = e,
      a = en(Us, t),
      i = Bs(t)
    return u.jsx(kt, {
      asChild: !0,
      ...i,
      orientation: a.orientation,
      dir: a.dir,
      loop: r,
      children: u.jsx(S.div, { role: 'tablist', 'aria-orientation': a.orientation, ...n, ref: o }),
    })
  })
Hs.displayName = Us
var Ws = 'TabsTrigger',
  zs = s.forwardRef((e, o) => {
    const { __scopeTabs: t, value: r, disabled: n = !1, ...a } = e,
      i = en(Ws, t),
      c = Bs(t),
      l = qs(i.baseId, r),
      d = Zs(i.baseId, r),
      f = r === i.value
    return u.jsx(Lt, {
      asChild: !0,
      ...c,
      focusable: !n,
      active: f,
      children: u.jsx(S.button, {
        type: 'button',
        role: 'tab',
        'aria-selected': f,
        'aria-controls': d,
        'data-state': f ? 'active' : 'inactive',
        'data-disabled': n ? '' : void 0,
        disabled: n,
        id: l,
        ...a,
        ref: o,
        onMouseDown: y(e.onMouseDown, (p) => {
          !n && p.button === 0 && p.ctrlKey === !1 ? i.onValueChange(r) : p.preventDefault()
        }),
        onKeyDown: y(e.onKeyDown, (p) => {
          ;[' ', 'Enter'].includes(p.key) && i.onValueChange(r)
        }),
        onFocus: y(e.onFocus, () => {
          const p = i.activationMode !== 'manual'
          !f && !n && p && i.onValueChange(r)
        }),
      }),
    })
  })
zs.displayName = Ws
var Ys = 'TabsContent',
  Xs = s.forwardRef((e, o) => {
    const { __scopeTabs: t, value: r, forceMount: n, children: a, ...i } = e,
      c = en(Ys, t),
      l = qs(c.baseId, r),
      d = Zs(c.baseId, r),
      f = r === c.value,
      p = s.useRef(f)
    return (
      s.useEffect(() => {
        const v = requestAnimationFrame(() => (p.current = !1))
        return () => cancelAnimationFrame(v)
      }, []),
      u.jsx(X, {
        present: n || f,
        children: ({ present: v }) =>
          u.jsx(S.div, {
            'data-state': f ? 'active' : 'inactive',
            'data-orientation': c.orientation,
            role: 'tabpanel',
            'aria-labelledby': l,
            hidden: !v,
            id: d,
            tabIndex: 0,
            ...i,
            ref: o,
            style: { ...e.style, animationDuration: p.current ? '0s' : void 0 },
            children: v && a,
          }),
      })
    )
  })
Xs.displayName = Ys
function qs(e, o) {
  return `${e}-trigger-${o}`
}
function Zs(e, o) {
  return `${e}-content-${o}`
}
var Qv = Ks,
  em = Hs,
  tm = zs,
  om = Xs,
  Ht = 'Switch',
  [Lf] = ee(Ht),
  [$f, Ff] = Lf(Ht),
  Js = s.forwardRef((e, o) => {
    const {
        __scopeSwitch: t,
        name: r,
        checked: n,
        defaultChecked: a,
        required: i,
        disabled: c,
        value: l = 'on',
        onCheckedChange: d,
        form: f,
        ...p
      } = e,
      [v, m] = s.useState(null),
      h = O(o, (b) => m(b)),
      g = s.useRef(!1),
      C = v ? f || !!v.closest('form') : !0,
      [w, x] = re({ prop: n, defaultProp: a ?? !1, onChange: d, caller: Ht })
    return u.jsxs($f, {
      scope: t,
      checked: w,
      disabled: c,
      children: [
        u.jsx(S.button, {
          type: 'button',
          role: 'switch',
          'aria-checked': w,
          'aria-required': i,
          'data-state': oi(w),
          'data-disabled': c ? '' : void 0,
          disabled: c,
          value: l,
          ...p,
          ref: h,
          onClick: y(e.onClick, (b) => {
            ;(x((E) => !E),
              C && ((g.current = b.isPropagationStopped()), g.current || b.stopPropagation()))
          }),
        }),
        C &&
          u.jsx(ti, {
            control: v,
            bubbles: !g.current,
            name: r,
            value: l,
            checked: w,
            required: i,
            disabled: c,
            form: f,
            style: { transform: 'translateX(-100%)' },
          }),
      ],
    })
  })
Js.displayName = Ht
var Qs = 'SwitchThumb',
  ei = s.forwardRef((e, o) => {
    const { __scopeSwitch: t, ...r } = e,
      n = Ff(Qs, t)
    return u.jsx(S.span, {
      'data-state': oi(n.checked),
      'data-disabled': n.disabled ? '' : void 0,
      ...r,
      ref: o,
    })
  })
ei.displayName = Qs
var Vf = 'SwitchBubbleInput',
  ti = s.forwardRef(({ __scopeSwitch: e, control: o, checked: t, bubbles: r = !0, ...n }, a) => {
    const i = s.useRef(null),
      c = O(i, a),
      l = at(t),
      d = It(o)
    return (
      s.useEffect(() => {
        const f = i.current
        if (!f) return
        const p = window.HTMLInputElement.prototype,
          m = Object.getOwnPropertyDescriptor(p, 'checked').set
        if (l !== t && m) {
          const h = new Event('click', { bubbles: r })
          ;(m.call(f, t), f.dispatchEvent(h))
        }
      }, [l, t, r]),
      u.jsx('input', {
        type: 'checkbox',
        'aria-hidden': !0,
        defaultChecked: t,
        ...n,
        tabIndex: -1,
        ref: c,
        style: {
          ...n.style,
          ...d,
          position: 'absolute',
          pointerEvents: 'none',
          opacity: 0,
          margin: 0,
        },
      })
    )
  })
ti.displayName = Vf
function oi(e) {
  return e ? 'checked' : 'unchecked'
}
var nm = Js,
  rm = ei,
  tn = 'Progress',
  on = 100,
  [Gf] = ee(tn),
  [Bf, Kf] = Gf(tn),
  ni = s.forwardRef((e, o) => {
    const { __scopeProgress: t, value: r = null, max: n, getValueLabel: a = Uf, ...i } = e
    ;(n || n === 0) && !Nn(n) && console.error(Hf(`${n}`, 'Progress'))
    const c = Nn(n) ? n : on
    r !== null && !Dn(r, c) && console.error(Wf(`${r}`, 'Progress'))
    const l = Dn(r, c) ? r : null,
      d = wt(l) ? a(l, c) : void 0
    return u.jsx(Bf, {
      scope: t,
      value: l,
      max: c,
      children: u.jsx(S.div, {
        'aria-valuemax': c,
        'aria-valuemin': 0,
        'aria-valuenow': wt(l) ? l : void 0,
        'aria-valuetext': d,
        role: 'progressbar',
        'data-state': si(l, c),
        'data-value': l ?? void 0,
        'data-max': c,
        ...i,
        ref: o,
      }),
    })
  })
ni.displayName = tn
var ri = 'ProgressIndicator',
  ai = s.forwardRef((e, o) => {
    const { __scopeProgress: t, ...r } = e,
      n = Kf(ri, t)
    return u.jsx(S.div, {
      'data-state': si(n.value, n.max),
      'data-value': n.value ?? void 0,
      'data-max': n.max,
      ...r,
      ref: o,
    })
  })
ai.displayName = ri
function Uf(e, o) {
  return `${Math.round((e / o) * 100)}%`
}
function si(e, o) {
  return e == null ? 'indeterminate' : e === o ? 'complete' : 'loading'
}
function wt(e) {
  return typeof e == 'number'
}
function Nn(e) {
  return wt(e) && !isNaN(e) && e > 0
}
function Dn(e, o) {
  return wt(e) && !isNaN(e) && e <= o && e >= 0
}
function Hf(e, o) {
  return `Invalid prop \`max\` of value \`${e}\` supplied to \`${o}\`. Only numbers greater than 0 are valid max values. Defaulting to \`${on}\`.`
}
function Wf(e, o) {
  return `Invalid prop \`value\` of value \`${e}\` supplied to \`${o}\`. The \`value\` prop must be:
  - a positive number
  - less than the value passed to \`max\` (or ${on} if no \`max\` prop is set)
  - \`null\` or \`undefined\` if the progress is indeterminate.

Defaulting to \`null\`.`
}
var am = ni,
  sm = ai,
  [Wt] = ee('Tooltip', [Ee]),
  zt = Ee(),
  ii = 'TooltipProvider',
  zf = 700,
  So = 'tooltip.open',
  [Yf, nn] = Wt(ii),
  ci = (e) => {
    const {
        __scopeTooltip: o,
        delayDuration: t = zf,
        skipDelayDuration: r = 300,
        disableHoverableContent: n = !1,
        children: a,
      } = e,
      i = s.useRef(!0),
      c = s.useRef(!1),
      l = s.useRef(0)
    return (
      s.useEffect(() => {
        const d = l.current
        return () => window.clearTimeout(d)
      }, []),
      u.jsx(Yf, {
        scope: o,
        isOpenDelayedRef: i,
        delayDuration: t,
        onOpen: s.useCallback(() => {
          ;(window.clearTimeout(l.current), (i.current = !1))
        }, []),
        onClose: s.useCallback(() => {
          ;(window.clearTimeout(l.current),
            (l.current = window.setTimeout(() => (i.current = !0), r)))
        }, [r]),
        isPointerInTransitRef: c,
        onPointerInTransitChange: s.useCallback((d) => {
          c.current = d
        }, []),
        disableHoverableContent: n,
        children: a,
      })
    )
  }
ci.displayName = ii
var et = 'Tooltip',
  [Xf, lt] = Wt(et),
  li = (e) => {
    const {
        __scopeTooltip: o,
        children: t,
        open: r,
        defaultOpen: n,
        onOpenChange: a,
        disableHoverableContent: i,
        delayDuration: c,
      } = e,
      l = nn(et, e.__scopeTooltip),
      d = zt(o),
      [f, p] = s.useState(null),
      v = Q(),
      m = s.useRef(0),
      h = i ?? l.disableHoverableContent,
      g = c ?? l.delayDuration,
      C = s.useRef(!1),
      [w, x] = re({
        prop: r,
        defaultProp: n ?? !1,
        onChange: (_) => {
          ;(_ ? (l.onOpen(), document.dispatchEvent(new CustomEvent(So))) : l.onClose(), a?.(_))
        },
        caller: et,
      }),
      b = s.useMemo(() => (w ? (C.current ? 'delayed-open' : 'instant-open') : 'closed'), [w]),
      E = s.useCallback(() => {
        ;(window.clearTimeout(m.current), (m.current = 0), (C.current = !1), x(!0))
      }, [x]),
      I = s.useCallback(() => {
        ;(window.clearTimeout(m.current), (m.current = 0), x(!1))
      }, [x]),
      T = s.useCallback(() => {
        ;(window.clearTimeout(m.current),
          (m.current = window.setTimeout(() => {
            ;((C.current = !0), x(!0), (m.current = 0))
          }, g)))
      }, [g, x])
    return (
      s.useEffect(
        () => () => {
          m.current && (window.clearTimeout(m.current), (m.current = 0))
        },
        [],
      ),
      u.jsx(Tt, {
        ...d,
        children: u.jsx(Xf, {
          scope: o,
          contentId: v,
          open: w,
          stateAttribute: b,
          trigger: f,
          onTriggerChange: p,
          onTriggerEnter: s.useCallback(() => {
            l.isOpenDelayedRef.current ? T() : E()
          }, [l.isOpenDelayedRef, T, E]),
          onTriggerLeave: s.useCallback(() => {
            h ? I() : (window.clearTimeout(m.current), (m.current = 0))
          }, [I, h]),
          onOpen: E,
          onClose: I,
          disableHoverableContent: h,
          children: t,
        }),
      })
    )
  }
li.displayName = et
var Po = 'TooltipTrigger',
  ui = s.forwardRef((e, o) => {
    const { __scopeTooltip: t, ...r } = e,
      n = lt(Po, t),
      a = nn(Po, t),
      i = zt(t),
      c = s.useRef(null),
      l = O(o, c, n.onTriggerChange),
      d = s.useRef(!1),
      f = s.useRef(!1),
      p = s.useCallback(() => (d.current = !1), [])
    return (
      s.useEffect(() => () => document.removeEventListener('pointerup', p), [p]),
      u.jsx(nt, {
        asChild: !0,
        ...i,
        children: u.jsx(S.button, {
          'aria-describedby': n.open ? n.contentId : void 0,
          'data-state': n.stateAttribute,
          ...r,
          ref: l,
          onPointerMove: y(e.onPointerMove, (v) => {
            v.pointerType !== 'touch' &&
              !f.current &&
              !a.isPointerInTransitRef.current &&
              (n.onTriggerEnter(), (f.current = !0))
          }),
          onPointerLeave: y(e.onPointerLeave, () => {
            ;(n.onTriggerLeave(), (f.current = !1))
          }),
          onPointerDown: y(e.onPointerDown, () => {
            ;(n.open && n.onClose(),
              (d.current = !0),
              document.addEventListener('pointerup', p, { once: !0 }))
          }),
          onFocus: y(e.onFocus, () => {
            d.current || n.onOpen()
          }),
          onBlur: y(e.onBlur, n.onClose),
          onClick: y(e.onClick, n.onClose),
        }),
      })
    )
  })
ui.displayName = Po
var rn = 'TooltipPortal',
  [qf, Zf] = Wt(rn, { forceMount: void 0 }),
  di = (e) => {
    const { __scopeTooltip: o, forceMount: t, children: r, container: n } = e,
      a = lt(rn, o)
    return u.jsx(qf, {
      scope: o,
      forceMount: t,
      children: u.jsx(X, {
        present: t || a.open,
        children: u.jsx(We, { asChild: !0, container: n, children: r }),
      }),
    })
  }
di.displayName = rn
var He = 'TooltipContent',
  fi = s.forwardRef((e, o) => {
    const t = Zf(He, e.__scopeTooltip),
      { forceMount: r = t.forceMount, side: n = 'top', ...a } = e,
      i = lt(He, e.__scopeTooltip)
    return u.jsx(X, {
      present: r || i.open,
      children: i.disableHoverableContent
        ? u.jsx(pi, { side: n, ...a, ref: o })
        : u.jsx(Jf, { side: n, ...a, ref: o }),
    })
  }),
  Jf = s.forwardRef((e, o) => {
    const t = lt(He, e.__scopeTooltip),
      r = nn(He, e.__scopeTooltip),
      n = s.useRef(null),
      a = O(o, n),
      [i, c] = s.useState(null),
      { trigger: l, onClose: d } = t,
      f = n.current,
      { onPointerInTransitChange: p } = r,
      v = s.useCallback(() => {
        ;(c(null), p(!1))
      }, [p]),
      m = s.useCallback(
        (h, g) => {
          const C = h.currentTarget,
            w = { x: h.clientX, y: h.clientY },
            x = np(w, C.getBoundingClientRect()),
            b = rp(w, x),
            E = ap(g.getBoundingClientRect()),
            I = ip([...b, ...E])
          ;(c(I), p(!0))
        },
        [p],
      )
    return (
      s.useEffect(() => () => v(), [v]),
      s.useEffect(() => {
        if (l && f) {
          const h = (C) => m(C, f),
            g = (C) => m(C, l)
          return (
            l.addEventListener('pointerleave', h),
            f.addEventListener('pointerleave', g),
            () => {
              ;(l.removeEventListener('pointerleave', h), f.removeEventListener('pointerleave', g))
            }
          )
        }
      }, [l, f, m, v]),
      s.useEffect(() => {
        if (i) {
          const h = (g) => {
            const C = g.target,
              w = { x: g.clientX, y: g.clientY },
              x = l?.contains(C) || f?.contains(C),
              b = !sp(w, i)
            x ? v() : b && (v(), d())
          }
          return (
            document.addEventListener('pointermove', h),
            () => document.removeEventListener('pointermove', h)
          )
        }
      }, [l, f, i, d, v]),
      u.jsx(pi, { ...e, ref: a })
    )
  }),
  [Qf, ep] = Wt(et, { isInside: !1 }),
  tp = Fn('TooltipContent'),
  pi = s.forwardRef((e, o) => {
    const {
        __scopeTooltip: t,
        children: r,
        'aria-label': n,
        onEscapeKeyDown: a,
        onPointerDownOutside: i,
        ...c
      } = e,
      l = lt(He, t),
      d = zt(t),
      { onClose: f } = l
    return (
      s.useEffect(
        () => (document.addEventListener(So, f), () => document.removeEventListener(So, f)),
        [f],
      ),
      s.useEffect(() => {
        if (l.trigger) {
          const p = (v) => {
            v.target?.contains(l.trigger) && f()
          }
          return (
            window.addEventListener('scroll', p, { capture: !0 }),
            () => window.removeEventListener('scroll', p, { capture: !0 })
          )
        }
      }, [l.trigger, f]),
      u.jsx(je, {
        asChild: !0,
        disableOutsidePointerEvents: !1,
        onEscapeKeyDown: a,
        onPointerDownOutside: i,
        onFocusOutside: (p) => p.preventDefault(),
        onDismiss: f,
        children: u.jsxs(At, {
          'data-state': l.stateAttribute,
          ...d,
          ...c,
          ref: o,
          style: {
            ...c.style,
            '--radix-tooltip-content-transform-origin': 'var(--radix-popper-transform-origin)',
            '--radix-tooltip-content-available-width': 'var(--radix-popper-available-width)',
            '--radix-tooltip-content-available-height': 'var(--radix-popper-available-height)',
            '--radix-tooltip-trigger-width': 'var(--radix-popper-anchor-width)',
            '--radix-tooltip-trigger-height': 'var(--radix-popper-anchor-height)',
          },
          children: [
            u.jsx(tp, { children: r }),
            u.jsx(Qf, {
              scope: t,
              isInside: !0,
              children: u.jsx(br, { id: l.contentId, role: 'tooltip', children: n || r }),
            }),
          ],
        }),
      })
    )
  })
fi.displayName = He
var vi = 'TooltipArrow',
  op = s.forwardRef((e, o) => {
    const { __scopeTooltip: t, ...r } = e,
      n = zt(t)
    return ep(vi, t).isInside ? null : u.jsx(Mt, { ...n, ...r, ref: o })
  })
op.displayName = vi
function np(e, o) {
  const t = Math.abs(o.top - e.y),
    r = Math.abs(o.bottom - e.y),
    n = Math.abs(o.right - e.x),
    a = Math.abs(o.left - e.x)
  switch (Math.min(t, r, n, a)) {
    case a:
      return 'left'
    case n:
      return 'right'
    case t:
      return 'top'
    case r:
      return 'bottom'
    default:
      throw new Error('unreachable')
  }
}
function rp(e, o, t = 5) {
  const r = []
  switch (o) {
    case 'top':
      r.push({ x: e.x - t, y: e.y + t }, { x: e.x + t, y: e.y + t })
      break
    case 'bottom':
      r.push({ x: e.x - t, y: e.y - t }, { x: e.x + t, y: e.y - t })
      break
    case 'left':
      r.push({ x: e.x + t, y: e.y - t }, { x: e.x + t, y: e.y + t })
      break
    case 'right':
      r.push({ x: e.x - t, y: e.y - t }, { x: e.x - t, y: e.y + t })
      break
  }
  return r
}
function ap(e) {
  const { top: o, right: t, bottom: r, left: n } = e
  return [
    { x: n, y: o },
    { x: t, y: o },
    { x: t, y: r },
    { x: n, y: r },
  ]
}
function sp(e, o) {
  const { x: t, y: r } = e
  let n = !1
  for (let a = 0, i = o.length - 1; a < o.length; i = a++) {
    const c = o[a],
      l = o[i],
      d = c.x,
      f = c.y,
      p = l.x,
      v = l.y
    f > r != v > r && t < ((p - d) * (r - f)) / (v - f) + d && (n = !n)
  }
  return n
}
function ip(e) {
  const o = e.slice()
  return (
    o.sort((t, r) => (t.x < r.x ? -1 : t.x > r.x ? 1 : t.y < r.y ? -1 : t.y > r.y ? 1 : 0)),
    cp(o)
  )
}
function cp(e) {
  if (e.length <= 1) return e.slice()
  const o = []
  for (let r = 0; r < e.length; r++) {
    const n = e[r]
    for (; o.length >= 2; ) {
      const a = o[o.length - 1],
        i = o[o.length - 2]
      if ((a.x - i.x) * (n.y - i.y) >= (a.y - i.y) * (n.x - i.x)) o.pop()
      else break
    }
    o.push(n)
  }
  o.pop()
  const t = []
  for (let r = e.length - 1; r >= 0; r--) {
    const n = e[r]
    for (; t.length >= 2; ) {
      const a = t[t.length - 1],
        i = t[t.length - 2]
      if ((a.x - i.x) * (n.y - i.y) >= (a.y - i.y) * (n.x - i.x)) t.pop()
      else break
    }
    t.push(n)
  }
  return (
    t.pop(),
    o.length === 1 && t.length === 1 && o[0].x === t[0].x && o[0].y === t[0].y ? o : o.concat(t)
  )
}
var im = ci,
  cm = li,
  lm = ui,
  um = di,
  dm = fi
function lp() {
  return Ec.useSyncExternalStore(
    up,
    () => !0,
    () => !1,
  )
}
function up() {
  return () => {}
}
var an = 'Avatar',
  [dp] = ee(an),
  [fp, mi] = dp(an),
  gi = s.forwardRef((e, o) => {
    const { __scopeAvatar: t, ...r } = e,
      [n, a] = s.useState('idle')
    return u.jsx(fp, {
      scope: t,
      imageLoadingStatus: n,
      onImageLoadingStatusChange: a,
      children: u.jsx(S.span, { ...r, ref: o }),
    })
  })
gi.displayName = an
var hi = 'AvatarImage',
  Ci = s.forwardRef((e, o) => {
    const { __scopeAvatar: t, src: r, onLoadingStatusChange: n = () => {}, ...a } = e,
      i = mi(hi, t),
      c = pp(r, a),
      l = W((d) => {
        ;(n(d), i.onImageLoadingStatusChange(d))
      })
    return (
      Y(() => {
        c !== 'idle' && l(c)
      }, [c, l]),
      c === 'loaded' ? u.jsx(S.img, { ...a, ref: o, src: r }) : null
    )
  })
Ci.displayName = hi
var xi = 'AvatarFallback',
  wi = s.forwardRef((e, o) => {
    const { __scopeAvatar: t, delayMs: r, ...n } = e,
      a = mi(xi, t),
      [i, c] = s.useState(r === void 0)
    return (
      s.useEffect(() => {
        if (r !== void 0) {
          const l = window.setTimeout(() => c(!0), r)
          return () => window.clearTimeout(l)
        }
      }, [r]),
      i && a.imageLoadingStatus !== 'loaded' ? u.jsx(S.span, { ...n, ref: o }) : null
    )
  })
wi.displayName = xi
function On(e, o) {
  return e
    ? o
      ? (e.src !== o && (e.src = o), e.complete && e.naturalWidth > 0 ? 'loaded' : 'loading')
      : 'error'
    : 'idle'
}
function pp(e, { referrerPolicy: o, crossOrigin: t }) {
  const r = lp(),
    n = s.useRef(null),
    a = r ? (n.current || (n.current = new window.Image()), n.current) : null,
    [i, c] = s.useState(() => On(a, e))
  return (
    Y(() => {
      c(On(a, e))
    }, [a, e]),
    Y(() => {
      const l = (p) => () => {
        c(p)
      }
      if (!a) return
      const d = l('loaded'),
        f = l('error')
      return (
        a.addEventListener('load', d),
        a.addEventListener('error', f),
        o && (a.referrerPolicy = o),
        typeof t == 'string' && (a.crossOrigin = t),
        () => {
          ;(a.removeEventListener('load', d), a.removeEventListener('error', f))
        }
      )
    }, [a, t, o]),
    i
  )
}
var fm = gi,
  pm = Ci,
  vm = wi,
  Yt = 'Collapsible',
  [vp, bi] = ee(Yt),
  [mp, sn] = vp(Yt),
  yi = s.forwardRef((e, o) => {
    const {
        __scopeCollapsible: t,
        open: r,
        defaultOpen: n,
        disabled: a,
        onOpenChange: i,
        ...c
      } = e,
      [l, d] = re({ prop: r, defaultProp: n ?? !1, onChange: i, caller: Yt })
    return u.jsx(mp, {
      scope: t,
      disabled: a,
      contentId: Q(),
      open: l,
      onOpenToggle: s.useCallback(() => d((f) => !f), [d]),
      children: u.jsx(S.div, {
        'data-state': ln(l),
        'data-disabled': a ? '' : void 0,
        ...c,
        ref: o,
      }),
    })
  })
yi.displayName = Yt
var Ri = 'CollapsibleTrigger',
  Ei = s.forwardRef((e, o) => {
    const { __scopeCollapsible: t, ...r } = e,
      n = sn(Ri, t)
    return u.jsx(S.button, {
      type: 'button',
      'aria-controls': n.contentId,
      'aria-expanded': n.open || !1,
      'data-state': ln(n.open),
      'data-disabled': n.disabled ? '' : void 0,
      disabled: n.disabled,
      ...r,
      ref: o,
      onClick: y(e.onClick, n.onOpenToggle),
    })
  })
Ei.displayName = Ri
var cn = 'CollapsibleContent',
  Si = s.forwardRef((e, o) => {
    const { forceMount: t, ...r } = e,
      n = sn(cn, e.__scopeCollapsible)
    return u.jsx(X, {
      present: t || n.open,
      children: ({ present: a }) => u.jsx(gp, { ...r, ref: o, present: a }),
    })
  })
Si.displayName = cn
var gp = s.forwardRef((e, o) => {
  const { __scopeCollapsible: t, present: r, children: n, ...a } = e,
    i = sn(cn, t),
    [c, l] = s.useState(r),
    d = s.useRef(null),
    f = O(o, d),
    p = s.useRef(0),
    v = p.current,
    m = s.useRef(0),
    h = m.current,
    g = i.open || c,
    C = s.useRef(g),
    w = s.useRef(void 0)
  return (
    s.useEffect(() => {
      const x = requestAnimationFrame(() => (C.current = !1))
      return () => cancelAnimationFrame(x)
    }, []),
    Y(() => {
      const x = d.current
      if (x) {
        ;((w.current = w.current || {
          transitionDuration: x.style.transitionDuration,
          animationName: x.style.animationName,
        }),
          (x.style.transitionDuration = '0s'),
          (x.style.animationName = 'none'))
        const b = x.getBoundingClientRect()
        ;((p.current = b.height),
          (m.current = b.width),
          C.current ||
            ((x.style.transitionDuration = w.current.transitionDuration),
            (x.style.animationName = w.current.animationName)),
          l(r))
      }
    }, [i.open, r]),
    u.jsx(S.div, {
      'data-state': ln(i.open),
      'data-disabled': i.disabled ? '' : void 0,
      id: i.contentId,
      hidden: !g,
      ...a,
      ref: f,
      style: {
        '--radix-collapsible-content-height': v ? `${v}px` : void 0,
        '--radix-collapsible-content-width': h ? `${h}px` : void 0,
        ...e.style,
      },
      children: g && n,
    })
  )
})
function ln(e) {
  return e ? 'open' : 'closed'
}
var hp = yi,
  Cp = Ei,
  xp = Si,
  Pi = 'AlertDialog',
  [wp] = ee(Pi, [Hn]),
  Ce = Hn(),
  _i = (e) => {
    const { __scopeAlertDialog: o, ...t } = e,
      r = Ce(o)
    return u.jsx(ir, { ...r, ...t, modal: !0 })
  }
_i.displayName = Pi
var bp = 'AlertDialogTrigger',
  Ii = s.forwardRef((e, o) => {
    const { __scopeAlertDialog: t, ...r } = e,
      n = Ce(t)
    return u.jsx(bl, { ...n, ...r, ref: o })
  })
Ii.displayName = bp
var yp = 'AlertDialogPortal',
  Ti = (e) => {
    const { __scopeAlertDialog: o, ...t } = e,
      r = Ce(o)
    return u.jsx(cr, { ...r, ...t })
  }
Ti.displayName = yp
var Rp = 'AlertDialogOverlay',
  Ai = s.forwardRef((e, o) => {
    const { __scopeAlertDialog: t, ...r } = e,
      n = Ce(t)
    return u.jsx(lr, { ...n, ...r, ref: o })
  })
Ai.displayName = Rp
var Ge = 'AlertDialogContent',
  [Ep, Sp] = wp(Ge),
  Pp = Fn('AlertDialogContent'),
  Mi = s.forwardRef((e, o) => {
    const { __scopeAlertDialog: t, children: r, ...n } = e,
      a = Ce(t),
      i = s.useRef(null),
      c = O(o, i),
      l = s.useRef(null)
    return u.jsx(hl, {
      contentName: Ge,
      titleName: Ni,
      docsSlug: 'alert-dialog',
      children: u.jsx(Ep, {
        scope: t,
        cancelRef: l,
        children: u.jsxs(ur, {
          role: 'alertdialog',
          ...a,
          ...n,
          ref: c,
          onOpenAutoFocus: y(n.onOpenAutoFocus, (d) => {
            ;(d.preventDefault(), l.current?.focus({ preventScroll: !0 }))
          }),
          onPointerDownOutside: (d) => d.preventDefault(),
          onInteractOutside: (d) => d.preventDefault(),
          children: [u.jsx(Pp, { children: r }), u.jsx(Ip, { contentRef: i })],
        }),
      }),
    })
  })
Mi.displayName = Ge
var Ni = 'AlertDialogTitle',
  Di = s.forwardRef((e, o) => {
    const { __scopeAlertDialog: t, ...r } = e,
      n = Ce(t)
    return u.jsx(yl, { ...n, ...r, ref: o })
  })
Di.displayName = Ni
var Oi = 'AlertDialogDescription',
  ji = s.forwardRef((e, o) => {
    const { __scopeAlertDialog: t, ...r } = e,
      n = Ce(t)
    return u.jsx(Rl, { ...n, ...r, ref: o })
  })
ji.displayName = Oi
var _p = 'AlertDialogAction',
  ki = s.forwardRef((e, o) => {
    const { __scopeAlertDialog: t, ...r } = e,
      n = Ce(t)
    return u.jsx(dr, { ...n, ...r, ref: o })
  })
ki.displayName = _p
var Li = 'AlertDialogCancel',
  $i = s.forwardRef((e, o) => {
    const { __scopeAlertDialog: t, ...r } = e,
      { cancelRef: n } = Sp(Li, t),
      a = Ce(t),
      i = O(o, n)
    return u.jsx(dr, { ...a, ...r, ref: i })
  })
$i.displayName = Li
var Ip = ({ contentRef: e }) => {
    const o = `\`${Ge}\` requires a description for the component to be accessible for screen reader users.

You can add a description to the \`${Ge}\` by passing a \`${Oi}\` component as a child, which also benefits sighted users by adding visible context to the dialog.

Alternatively, you can use your own component as a description by assigning it an \`id\` and passing the same value to the \`aria-describedby\` prop in \`${Ge}\`. If the description is confusing or duplicative for sighted users, you can use the \`@radix-ui/react-visually-hidden\` primitive as a wrapper around your description component.

For more information, see https://radix-ui.com/primitives/docs/components/alert-dialog`
    return (
      s.useEffect(() => {
        document.getElementById(e.current?.getAttribute('aria-describedby')) || console.warn(o)
      }, [o, e]),
      null
    )
  },
  mm = _i,
  gm = Ii,
  hm = Ti,
  Cm = Ai,
  xm = Mi,
  wm = ki,
  bm = $i,
  ym = Di,
  Rm = ji,
  Fi = 'Toggle',
  un = s.forwardRef((e, o) => {
    const { pressed: t, defaultPressed: r, onPressedChange: n, ...a } = e,
      [i, c] = re({ prop: t, onChange: n, defaultProp: r ?? !1, caller: Fi })
    return u.jsx(S.button, {
      type: 'button',
      'aria-pressed': i,
      'data-state': i ? 'on' : 'off',
      'data-disabled': e.disabled ? '' : void 0,
      ...a,
      ref: o,
      onClick: y(e.onClick, () => {
        e.disabled || c(!i)
      }),
    })
  })
un.displayName = Fi
var Em = un,
  Te = 'ToggleGroup',
  [Vi] = ee(Te, [Ie]),
  Gi = Ie(),
  dn = B.forwardRef((e, o) => {
    const { type: t, ...r } = e
    if (t === 'single') {
      const n = r
      return u.jsx(Tp, { ...n, ref: o })
    }
    if (t === 'multiple') {
      const n = r
      return u.jsx(Ap, { ...n, ref: o })
    }
    throw new Error(`Missing prop \`type\` expected on \`${Te}\``)
  })
dn.displayName = Te
var [Bi, Ki] = Vi(Te),
  Tp = B.forwardRef((e, o) => {
    const { value: t, defaultValue: r, onValueChange: n = () => {}, ...a } = e,
      [i, c] = re({ prop: t, defaultProp: r ?? '', onChange: n, caller: Te })
    return u.jsx(Bi, {
      scope: e.__scopeToggleGroup,
      type: 'single',
      value: B.useMemo(() => (i ? [i] : []), [i]),
      onItemActivate: c,
      onItemDeactivate: B.useCallback(() => c(''), [c]),
      children: u.jsx(Ui, { ...a, ref: o }),
    })
  }),
  Ap = B.forwardRef((e, o) => {
    const { value: t, defaultValue: r, onValueChange: n = () => {}, ...a } = e,
      [i, c] = re({ prop: t, defaultProp: r ?? [], onChange: n, caller: Te }),
      l = B.useCallback((f) => c((p = []) => [...p, f]), [c]),
      d = B.useCallback((f) => c((p = []) => p.filter((v) => v !== f)), [c])
    return u.jsx(Bi, {
      scope: e.__scopeToggleGroup,
      type: 'multiple',
      value: i,
      onItemActivate: l,
      onItemDeactivate: d,
      children: u.jsx(Ui, { ...a, ref: o }),
    })
  })
dn.displayName = Te
var [Mp, Np] = Vi(Te),
  Ui = B.forwardRef((e, o) => {
    const {
        __scopeToggleGroup: t,
        disabled: r = !1,
        rovingFocus: n = !0,
        orientation: a,
        dir: i,
        loop: c = !0,
        ...l
      } = e,
      d = Gi(t),
      f = he(i),
      p = { role: 'group', dir: f, ...l }
    return u.jsx(Mp, {
      scope: t,
      rovingFocus: n,
      disabled: r,
      children: n
        ? u.jsx(kt, {
            asChild: !0,
            ...d,
            orientation: a,
            dir: f,
            loop: c,
            children: u.jsx(S.div, { ...p, ref: o }),
          })
        : u.jsx(S.div, { ...p, ref: o }),
    })
  }),
  bt = 'ToggleGroupItem',
  Hi = B.forwardRef((e, o) => {
    const t = Ki(bt, e.__scopeToggleGroup),
      r = Np(bt, e.__scopeToggleGroup),
      n = Gi(e.__scopeToggleGroup),
      a = t.value.includes(e.value),
      i = r.disabled || e.disabled,
      c = { ...e, pressed: a, disabled: i },
      l = B.useRef(null)
    return r.rovingFocus
      ? u.jsx(Lt, {
          asChild: !0,
          ...n,
          focusable: !i,
          active: a,
          ref: l,
          children: u.jsx(jn, { ...c, ref: o }),
        })
      : u.jsx(jn, { ...c, ref: o })
  })
Hi.displayName = bt
var jn = B.forwardRef((e, o) => {
    const { __scopeToggleGroup: t, value: r, ...n } = e,
      a = Ki(bt, t),
      i = { role: 'radio', 'aria-checked': e.pressed, 'aria-pressed': void 0 },
      c = a.type === 'single' ? i : void 0
    return u.jsx(un, {
      ...c,
      ...n,
      ref: o,
      onPressedChange: (l) => {
        l ? a.onItemActivate(r) : a.onItemDeactivate(r)
      },
    })
  }),
  Sm = dn,
  Pm = Hi,
  fn = 'Radio',
  [Dp, Wi] = ee(fn),
  [Op, jp] = Dp(fn),
  zi = s.forwardRef((e, o) => {
    const {
        __scopeRadio: t,
        name: r,
        checked: n = !1,
        required: a,
        disabled: i,
        value: c = 'on',
        onCheck: l,
        form: d,
        ...f
      } = e,
      [p, v] = s.useState(null),
      m = O(o, (C) => v(C)),
      h = s.useRef(!1),
      g = p ? d || !!p.closest('form') : !0
    return u.jsxs(Op, {
      scope: t,
      checked: n,
      disabled: i,
      children: [
        u.jsx(S.button, {
          type: 'button',
          role: 'radio',
          'aria-checked': n,
          'data-state': Zi(n),
          'data-disabled': i ? '' : void 0,
          disabled: i,
          value: c,
          ...f,
          ref: m,
          onClick: y(e.onClick, (C) => {
            ;(n || l?.(),
              g && ((h.current = C.isPropagationStopped()), h.current || C.stopPropagation()))
          }),
        }),
        g &&
          u.jsx(qi, {
            control: p,
            bubbles: !h.current,
            name: r,
            value: c,
            checked: n,
            required: a,
            disabled: i,
            form: d,
            style: { transform: 'translateX(-100%)' },
          }),
      ],
    })
  })
zi.displayName = fn
var Yi = 'RadioIndicator',
  Xi = s.forwardRef((e, o) => {
    const { __scopeRadio: t, forceMount: r, ...n } = e,
      a = jp(Yi, t)
    return u.jsx(X, {
      present: r || a.checked,
      children: u.jsx(S.span, {
        'data-state': Zi(a.checked),
        'data-disabled': a.disabled ? '' : void 0,
        ...n,
        ref: o,
      }),
    })
  })
Xi.displayName = Yi
var kp = 'RadioBubbleInput',
  qi = s.forwardRef(({ __scopeRadio: e, control: o, checked: t, bubbles: r = !0, ...n }, a) => {
    const i = s.useRef(null),
      c = O(i, a),
      l = at(t),
      d = It(o)
    return (
      s.useEffect(() => {
        const f = i.current
        if (!f) return
        const p = window.HTMLInputElement.prototype,
          m = Object.getOwnPropertyDescriptor(p, 'checked').set
        if (l !== t && m) {
          const h = new Event('click', { bubbles: r })
          ;(m.call(f, t), f.dispatchEvent(h))
        }
      }, [l, t, r]),
      u.jsx(S.input, {
        type: 'radio',
        'aria-hidden': !0,
        defaultChecked: t,
        ...n,
        tabIndex: -1,
        ref: c,
        style: {
          ...n.style,
          ...d,
          position: 'absolute',
          pointerEvents: 'none',
          opacity: 0,
          margin: 0,
        },
      })
    )
  })
qi.displayName = kp
function Zi(e) {
  return e ? 'checked' : 'unchecked'
}
var Lp = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
  Xt = 'RadioGroup',
  [$p] = ee(Xt, [Ie, Wi]),
  Ji = Ie(),
  Qi = Wi(),
  [Fp, Vp] = $p(Xt),
  ec = s.forwardRef((e, o) => {
    const {
        __scopeRadioGroup: t,
        name: r,
        defaultValue: n,
        value: a,
        required: i = !1,
        disabled: c = !1,
        orientation: l,
        dir: d,
        loop: f = !0,
        onValueChange: p,
        ...v
      } = e,
      m = Ji(t),
      h = he(d),
      [g, C] = re({ prop: a, defaultProp: n ?? null, onChange: p, caller: Xt })
    return u.jsx(Fp, {
      scope: t,
      name: r,
      required: i,
      disabled: c,
      value: g,
      onValueChange: C,
      children: u.jsx(kt, {
        asChild: !0,
        ...m,
        orientation: l,
        dir: h,
        loop: f,
        children: u.jsx(S.div, {
          role: 'radiogroup',
          'aria-required': i,
          'aria-orientation': l,
          'data-disabled': c ? '' : void 0,
          dir: h,
          ...v,
          ref: o,
        }),
      }),
    })
  })
ec.displayName = Xt
var tc = 'RadioGroupItem',
  oc = s.forwardRef((e, o) => {
    const { __scopeRadioGroup: t, disabled: r, ...n } = e,
      a = Vp(tc, t),
      i = a.disabled || r,
      c = Ji(t),
      l = Qi(t),
      d = s.useRef(null),
      f = O(o, d),
      p = a.value === n.value,
      v = s.useRef(!1)
    return (
      s.useEffect(() => {
        const m = (g) => {
            Lp.includes(g.key) && (v.current = !0)
          },
          h = () => (v.current = !1)
        return (
          document.addEventListener('keydown', m),
          document.addEventListener('keyup', h),
          () => {
            ;(document.removeEventListener('keydown', m), document.removeEventListener('keyup', h))
          }
        )
      }, []),
      u.jsx(Lt, {
        asChild: !0,
        ...c,
        focusable: !i,
        active: p,
        children: u.jsx(zi, {
          disabled: i,
          required: a.required,
          checked: p,
          ...l,
          ...n,
          name: a.name,
          ref: f,
          onCheck: () => a.onValueChange(n.value),
          onKeyDown: y((m) => {
            m.key === 'Enter' && m.preventDefault()
          }),
          onFocus: y(n.onFocus, () => {
            v.current && d.current?.click()
          }),
        }),
      })
    )
  })
oc.displayName = tc
var Gp = 'RadioGroupIndicator',
  nc = s.forwardRef((e, o) => {
    const { __scopeRadioGroup: t, ...r } = e,
      n = Qi(t)
    return u.jsx(Xi, { ...n, ...r, ref: o })
  })
nc.displayName = Gp
var _m = ec,
  Im = oc,
  Tm = nc,
  ve = 'Accordion',
  Bp = ['Home', 'End', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'],
  [pn, Kp, Up] = ze(ve),
  [qt] = ee(ve, [Up, bi]),
  vn = bi(),
  rc = B.forwardRef((e, o) => {
    const { type: t, ...r } = e,
      n = r,
      a = r
    return u.jsx(pn.Provider, {
      scope: e.__scopeAccordion,
      children: t === 'multiple' ? u.jsx(Yp, { ...a, ref: o }) : u.jsx(zp, { ...n, ref: o }),
    })
  })
rc.displayName = ve
var [ac, Hp] = qt(ve),
  [sc, Wp] = qt(ve, { collapsible: !1 }),
  zp = B.forwardRef((e, o) => {
    const { value: t, defaultValue: r, onValueChange: n = () => {}, collapsible: a = !1, ...i } = e,
      [c, l] = re({ prop: t, defaultProp: r ?? '', onChange: n, caller: ve })
    return u.jsx(ac, {
      scope: e.__scopeAccordion,
      value: B.useMemo(() => (c ? [c] : []), [c]),
      onItemOpen: l,
      onItemClose: B.useCallback(() => a && l(''), [a, l]),
      children: u.jsx(sc, {
        scope: e.__scopeAccordion,
        collapsible: a,
        children: u.jsx(ic, { ...i, ref: o }),
      }),
    })
  }),
  Yp = B.forwardRef((e, o) => {
    const { value: t, defaultValue: r, onValueChange: n = () => {}, ...a } = e,
      [i, c] = re({ prop: t, defaultProp: r ?? [], onChange: n, caller: ve }),
      l = B.useCallback((f) => c((p = []) => [...p, f]), [c]),
      d = B.useCallback((f) => c((p = []) => p.filter((v) => v !== f)), [c])
    return u.jsx(ac, {
      scope: e.__scopeAccordion,
      value: i,
      onItemOpen: l,
      onItemClose: d,
      children: u.jsx(sc, {
        scope: e.__scopeAccordion,
        collapsible: !0,
        children: u.jsx(ic, { ...a, ref: o }),
      }),
    })
  }),
  [Xp, Zt] = qt(ve),
  ic = B.forwardRef((e, o) => {
    const { __scopeAccordion: t, disabled: r, dir: n, orientation: a = 'vertical', ...i } = e,
      c = B.useRef(null),
      l = O(c, o),
      d = Kp(t),
      p = he(n) === 'ltr',
      v = y(e.onKeyDown, (m) => {
        if (!Bp.includes(m.key)) return
        const h = m.target,
          g = d().filter((N) => !N.ref.current?.disabled),
          C = g.findIndex((N) => N.ref.current === h),
          w = g.length
        if (C === -1) return
        m.preventDefault()
        let x = C
        const b = 0,
          E = w - 1,
          I = () => {
            ;((x = C + 1), x > E && (x = b))
          },
          T = () => {
            ;((x = C - 1), x < b && (x = E))
          }
        switch (m.key) {
          case 'Home':
            x = b
            break
          case 'End':
            x = E
            break
          case 'ArrowRight':
            a === 'horizontal' && (p ? I() : T())
            break
          case 'ArrowDown':
            a === 'vertical' && I()
            break
          case 'ArrowLeft':
            a === 'horizontal' && (p ? T() : I())
            break
          case 'ArrowUp':
            a === 'vertical' && T()
            break
        }
        const _ = x % w
        g[_].ref.current?.focus()
      })
    return u.jsx(Xp, {
      scope: t,
      disabled: r,
      direction: n,
      orientation: a,
      children: u.jsx(pn.Slot, {
        scope: t,
        children: u.jsx(S.div, { ...i, 'data-orientation': a, ref: l, onKeyDown: r ? void 0 : v }),
      }),
    })
  }),
  yt = 'AccordionItem',
  [qp, mn] = qt(yt),
  cc = B.forwardRef((e, o) => {
    const { __scopeAccordion: t, value: r, ...n } = e,
      a = Zt(yt, t),
      i = Hp(yt, t),
      c = vn(t),
      l = Q(),
      d = (r && i.value.includes(r)) || !1,
      f = a.disabled || e.disabled
    return u.jsx(qp, {
      scope: t,
      open: d,
      disabled: f,
      triggerId: l,
      children: u.jsx(hp, {
        'data-orientation': a.orientation,
        'data-state': vc(d),
        ...c,
        ...n,
        ref: o,
        disabled: f,
        open: d,
        onOpenChange: (p) => {
          p ? i.onItemOpen(r) : i.onItemClose(r)
        },
      }),
    })
  })
cc.displayName = yt
var lc = 'AccordionHeader',
  uc = B.forwardRef((e, o) => {
    const { __scopeAccordion: t, ...r } = e,
      n = Zt(ve, t),
      a = mn(lc, t)
    return u.jsx(S.h3, {
      'data-orientation': n.orientation,
      'data-state': vc(a.open),
      'data-disabled': a.disabled ? '' : void 0,
      ...r,
      ref: o,
    })
  })
uc.displayName = lc
var _o = 'AccordionTrigger',
  dc = B.forwardRef((e, o) => {
    const { __scopeAccordion: t, ...r } = e,
      n = Zt(ve, t),
      a = mn(_o, t),
      i = Wp(_o, t),
      c = vn(t)
    return u.jsx(pn.ItemSlot, {
      scope: t,
      children: u.jsx(Cp, {
        'aria-disabled': (a.open && !i.collapsible) || void 0,
        'data-orientation': n.orientation,
        id: a.triggerId,
        ...c,
        ...r,
        ref: o,
      }),
    })
  })
dc.displayName = _o
var fc = 'AccordionContent',
  pc = B.forwardRef((e, o) => {
    const { __scopeAccordion: t, ...r } = e,
      n = Zt(ve, t),
      a = mn(fc, t),
      i = vn(t)
    return u.jsx(xp, {
      role: 'region',
      'aria-labelledby': a.triggerId,
      'data-orientation': n.orientation,
      ...i,
      ...r,
      ref: o,
      style: {
        '--radix-accordion-content-height': 'var(--radix-collapsible-content-height)',
        '--radix-accordion-content-width': 'var(--radix-collapsible-content-width)',
        ...e.style,
      },
    })
  })
pc.displayName = fc
function vc(e) {
  return e ? 'open' : 'closed'
}
var Am = rc,
  Mm = cc,
  Nm = uc,
  Dm = dc,
  Om = pc
export {
  hf as $,
  Av as A,
  Nv as B,
  ur as C,
  Rl as D,
  Lv as E,
  $v as F,
  Fv as G,
  Vv as H,
  hv as I,
  Gv as J,
  Wv as K,
  bv as L,
  cv as M,
  Bv as N,
  lr as O,
  cr as P,
  zv as Q,
  ir as R,
  Qp as S,
  yl as T,
  Yv as U,
  wr as V,
  Kv as W,
  Hv as X,
  Uv as Y,
  gf as Z,
  ev as _,
  dr as a,
  tv as a0,
  Xv as a1,
  qv as a2,
  Zv as a3,
  bf as a4,
  _f as a5,
  Jv as a6,
  Qv as a7,
  em as a8,
  tm as a9,
  Sm as aA,
  Pm as aB,
  _m as aC,
  Im as aD,
  Tm as aE,
  sv as aF,
  hp as aG,
  Ei as aH,
  Si as aI,
  Am as aJ,
  Mm as aK,
  Nm as aL,
  Dm as aM,
  ov as aN,
  Om as aO,
  om as aa,
  nm as ab,
  rm as ac,
  am as ad,
  sm as ae,
  nv as af,
  iv as ag,
  rv as ah,
  im as ai,
  cm as aj,
  lm as ak,
  um as al,
  dm as am,
  fm as an,
  pm as ao,
  vm as ap,
  mm as aq,
  hm as ar,
  xm as as,
  ym as at,
  Rm as au,
  bm as av,
  wm as aw,
  Cm as ax,
  gm as ay,
  Em as az,
  av as b,
  bl as c,
  dv as d,
  fv as e,
  lv as f,
  uv as g,
  pv as h,
  mv as i,
  Sv as j,
  Pv as k,
  Cv as l,
  xv as m,
  wv as n,
  yv as o,
  Ev as p,
  Rv as q,
  _v as r,
  vv as s,
  gv as t,
  Iv as u,
  Tv as v,
  Mv as w,
  Ov as x,
  jv as y,
  Dv as z,
}
//# sourceMappingURL=ui-vendor-DTR9u_Vg.js.map
