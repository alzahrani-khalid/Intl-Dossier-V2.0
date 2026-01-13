import {
  s as Ng,
  h as xl,
  u as xg,
  w as gn,
  m as Rg,
  c as Ug,
  _ as Bg,
  a as Hg,
  b as ta,
  g as Yg,
  d as wg,
  e as Vg,
  T as Xt,
  f as lc,
  i as jg,
  P as fe,
  p as Ty,
  j as Cy,
} from './vendor-misc-BiJvMP0A.js'
import {
  a as qg,
  b as Lg,
  c as Gg,
  d as Xg,
  e as kg,
  f as Zg,
  g as Qg,
  h as Kg,
  i as Wg,
  j as Jg,
  k as Fg,
  l as $g,
  m as Ig,
  n as Pg,
  o as e0,
  p as t0,
  q as l0,
  r as n0,
  s as a0,
  t as u0,
  u as i0,
  v as r0,
  w as c0,
  x as f0,
  y as s0,
  z as o0,
  A as d0,
  B as y0,
  C as m0,
  D as h0,
  E as v0,
  F as g0,
  G as zy,
} from './date-vendor-s0MkYge4.js'
function b0(e, t) {
  for (var l = 0; l < t.length; l++) {
    const n = t[l]
    if (typeof n != 'string' && !Array.isArray(n)) {
      for (const a in n)
        if (a !== 'default' && !(a in e)) {
          const u = Object.getOwnPropertyDescriptor(n, a)
          u && Object.defineProperty(e, a, u.get ? u : { enumerable: !0, get: () => n[a] })
        }
    }
  }
  return Object.freeze(Object.defineProperty(e, Symbol.toStringTag, { value: 'Module' }))
}
var JD =
  typeof globalThis < 'u'
    ? globalThis
    : typeof window < 'u'
      ? window
      : typeof global < 'u'
        ? global
        : typeof self < 'u'
          ? self
          : {}
function Ny(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, 'default') ? e.default : e
}
function p0(e) {
  if (e.__esModule) return e
  var t = e.default
  if (typeof t == 'function') {
    var l = function n() {
      return this instanceof n
        ? Reflect.construct(t, arguments, this.constructor)
        : t.apply(this, arguments)
    }
    l.prototype = t.prototype
  } else l = {}
  return (
    Object.defineProperty(l, '__esModule', { value: !0 }),
    Object.keys(e).forEach(function (n) {
      var a = Object.getOwnPropertyDescriptor(e, n)
      Object.defineProperty(
        l,
        n,
        a.get
          ? a
          : {
              enumerable: !0,
              get: function () {
                return e[n]
              },
            },
      )
    }),
    l
  )
}
var xy = { exports: {} },
  pr = {}
/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var S0 = Symbol.for('react.transitional.element'),
  E0 = Symbol.for('react.fragment')
function Ry(e, t, l) {
  var n = null
  if ((l !== void 0 && (n = '' + l), t.key !== void 0 && (n = '' + t.key), 'key' in t)) {
    l = {}
    for (var a in t) a !== 'key' && (l[a] = t[a])
  } else l = t
  return ((t = l.ref), { $$typeof: S0, type: e, key: n, ref: t !== void 0 ? t : null, props: l })
}
pr.Fragment = E0
pr.jsx = Ry
pr.jsxs = Ry
xy.exports = pr
var FD = xy.exports,
  Uy = { exports: {} },
  k = {}
/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var ns = Symbol.for('react.transitional.element'),
  D0 = Symbol.for('react.portal'),
  O0 = Symbol.for('react.fragment'),
  _0 = Symbol.for('react.strict_mode'),
  M0 = Symbol.for('react.profiler'),
  A0 = Symbol.for('react.consumer'),
  T0 = Symbol.for('react.context'),
  C0 = Symbol.for('react.forward_ref'),
  z0 = Symbol.for('react.suspense'),
  N0 = Symbol.for('react.memo'),
  By = Symbol.for('react.lazy'),
  x0 = Symbol.for('react.activity'),
  Eo = Symbol.iterator
function R0(e) {
  return e === null || typeof e != 'object'
    ? null
    : ((e = (Eo && e[Eo]) || e['@@iterator']), typeof e == 'function' ? e : null)
}
var Hy = {
    isMounted: function () {
      return !1
    },
    enqueueForceUpdate: function () {},
    enqueueReplaceState: function () {},
    enqueueSetState: function () {},
  },
  Yy = Object.assign,
  wy = {}
function wa(e, t, l) {
  ;((this.props = e), (this.context = t), (this.refs = wy), (this.updater = l || Hy))
}
wa.prototype.isReactComponent = {}
wa.prototype.setState = function (e, t) {
  if (typeof e != 'object' && typeof e != 'function' && e != null)
    throw Error(
      'takes an object of state variables to update or a function which returns an object of state variables.',
    )
  this.updater.enqueueSetState(this, e, t, 'setState')
}
wa.prototype.forceUpdate = function (e) {
  this.updater.enqueueForceUpdate(this, e, 'forceUpdate')
}
function Vy() {}
Vy.prototype = wa.prototype
function as(e, t, l) {
  ;((this.props = e), (this.context = t), (this.refs = wy), (this.updater = l || Hy))
}
var us = (as.prototype = new Vy())
us.constructor = as
Yy(us, wa.prototype)
us.isPureReactComponent = !0
var Do = Array.isArray
function Kc() {}
var pe = { H: null, A: null, T: null, S: null },
  jy = Object.prototype.hasOwnProperty
function is(e, t, l) {
  var n = l.ref
  return { $$typeof: ns, type: e, key: t, ref: n !== void 0 ? n : null, props: l }
}
function U0(e, t) {
  return is(e.type, t, e.props)
}
function rs(e) {
  return typeof e == 'object' && e !== null && e.$$typeof === ns
}
function B0(e) {
  var t = { '=': '=0', ':': '=2' }
  return (
    '$' +
    e.replace(/[=:]/g, function (l) {
      return t[l]
    })
  )
}
var Oo = /\/+/g
function nc(e, t) {
  return typeof e == 'object' && e !== null && e.key != null ? B0('' + e.key) : t.toString(36)
}
function H0(e) {
  switch (e.status) {
    case 'fulfilled':
      return e.value
    case 'rejected':
      throw e.reason
    default:
      switch (
        (typeof e.status == 'string'
          ? e.then(Kc, Kc)
          : ((e.status = 'pending'),
            e.then(
              function (t) {
                e.status === 'pending' && ((e.status = 'fulfilled'), (e.value = t))
              },
              function (t) {
                e.status === 'pending' && ((e.status = 'rejected'), (e.reason = t))
              },
            )),
        e.status)
      ) {
        case 'fulfilled':
          return e.value
        case 'rejected':
          throw e.reason
      }
  }
  throw e
}
function la(e, t, l, n, a) {
  var u = typeof e
  ;(u === 'undefined' || u === 'boolean') && (e = null)
  var i = !1
  if (e === null) i = !0
  else
    switch (u) {
      case 'bigint':
      case 'string':
      case 'number':
        i = !0
        break
      case 'object':
        switch (e.$$typeof) {
          case ns:
          case D0:
            i = !0
            break
          case By:
            return ((i = e._init), la(i(e._payload), t, l, n, a))
        }
    }
  if (i)
    return (
      (a = a(e)),
      (i = n === '' ? '.' + nc(e, 0) : n),
      Do(a)
        ? ((l = ''),
          i != null && (l = i.replace(Oo, '$&/') + '/'),
          la(a, t, l, '', function (f) {
            return f
          }))
        : a != null &&
          (rs(a) &&
            (a = U0(
              a,
              l +
                (a.key == null || (e && e.key === a.key)
                  ? ''
                  : ('' + a.key).replace(Oo, '$&/') + '/') +
                i,
            )),
          t.push(a)),
      1
    )
  i = 0
  var r = n === '' ? '.' : n + ':'
  if (Do(e))
    for (var c = 0; c < e.length; c++) ((n = e[c]), (u = r + nc(n, c)), (i += la(n, t, l, u, a)))
  else if (((c = R0(e)), typeof c == 'function'))
    for (e = c.call(e), c = 0; !(n = e.next()).done; )
      ((n = n.value), (u = r + nc(n, c++)), (i += la(n, t, l, u, a)))
  else if (u === 'object') {
    if (typeof e.then == 'function') return la(H0(e), t, l, n, a)
    throw (
      (t = String(e)),
      Error(
        'Objects are not valid as a React child (found: ' +
          (t === '[object Object]' ? 'object with keys {' + Object.keys(e).join(', ') + '}' : t) +
          '). If you meant to render a collection of children, use an array instead.',
      )
    )
  }
  return i
}
function $u(e, t, l) {
  if (e == null) return e
  var n = [],
    a = 0
  return (
    la(e, n, '', '', function (u) {
      return t.call(l, u, a++)
    }),
    n
  )
}
function Y0(e) {
  if (e._status === -1) {
    var t = e._result
    ;((t = t()),
      t.then(
        function (l) {
          ;(e._status === 0 || e._status === -1) && ((e._status = 1), (e._result = l))
        },
        function (l) {
          ;(e._status === 0 || e._status === -1) && ((e._status = 2), (e._result = l))
        },
      ),
      e._status === -1 && ((e._status = 0), (e._result = t)))
  }
  if (e._status === 1) return e._result.default
  throw e._result
}
var _o =
    typeof reportError == 'function'
      ? reportError
      : function (e) {
          if (typeof window == 'object' && typeof window.ErrorEvent == 'function') {
            var t = new window.ErrorEvent('error', {
              bubbles: !0,
              cancelable: !0,
              message:
                typeof e == 'object' && e !== null && typeof e.message == 'string'
                  ? String(e.message)
                  : String(e),
              error: e,
            })
            if (!window.dispatchEvent(t)) return
          } else if (typeof process == 'object' && typeof process.emit == 'function') {
            process.emit('uncaughtException', e)
            return
          }
          console.error(e)
        },
  w0 = {
    map: $u,
    forEach: function (e, t, l) {
      $u(
        e,
        function () {
          t.apply(this, arguments)
        },
        l,
      )
    },
    count: function (e) {
      var t = 0
      return (
        $u(e, function () {
          t++
        }),
        t
      )
    },
    toArray: function (e) {
      return (
        $u(e, function (t) {
          return t
        }) || []
      )
    },
    only: function (e) {
      if (!rs(e))
        throw Error('React.Children.only expected to receive a single React element child.')
      return e
    },
  }
k.Activity = x0
k.Children = w0
k.Component = wa
k.Fragment = O0
k.Profiler = M0
k.PureComponent = as
k.StrictMode = _0
k.Suspense = z0
k.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = pe
k.__COMPILER_RUNTIME = {
  __proto__: null,
  c: function (e) {
    return pe.H.useMemoCache(e)
  },
}
k.cache = function (e) {
  return function () {
    return e.apply(null, arguments)
  }
}
k.cacheSignal = function () {
  return null
}
k.cloneElement = function (e, t, l) {
  if (e == null) throw Error('The argument must be a React element, but you passed ' + e + '.')
  var n = Yy({}, e.props),
    a = e.key
  if (t != null)
    for (u in (t.key !== void 0 && (a = '' + t.key), t))
      !jy.call(t, u) ||
        u === 'key' ||
        u === '__self' ||
        u === '__source' ||
        (u === 'ref' && t.ref === void 0) ||
        (n[u] = t[u])
  var u = arguments.length - 2
  if (u === 1) n.children = l
  else if (1 < u) {
    for (var i = Array(u), r = 0; r < u; r++) i[r] = arguments[r + 2]
    n.children = i
  }
  return is(e.type, a, n)
}
k.createContext = function (e) {
  return (
    (e = {
      $$typeof: T0,
      _currentValue: e,
      _currentValue2: e,
      _threadCount: 0,
      Provider: null,
      Consumer: null,
    }),
    (e.Provider = e),
    (e.Consumer = { $$typeof: A0, _context: e }),
    e
  )
}
k.createElement = function (e, t, l) {
  var n,
    a = {},
    u = null
  if (t != null)
    for (n in (t.key !== void 0 && (u = '' + t.key), t))
      jy.call(t, n) && n !== 'key' && n !== '__self' && n !== '__source' && (a[n] = t[n])
  var i = arguments.length - 2
  if (i === 1) a.children = l
  else if (1 < i) {
    for (var r = Array(i), c = 0; c < i; c++) r[c] = arguments[c + 2]
    a.children = r
  }
  if (e && e.defaultProps) for (n in ((i = e.defaultProps), i)) a[n] === void 0 && (a[n] = i[n])
  return is(e, u, a)
}
k.createRef = function () {
  return { current: null }
}
k.forwardRef = function (e) {
  return { $$typeof: C0, render: e }
}
k.isValidElement = rs
k.lazy = function (e) {
  return { $$typeof: By, _payload: { _status: -1, _result: e }, _init: Y0 }
}
k.memo = function (e, t) {
  return { $$typeof: N0, type: e, compare: t === void 0 ? null : t }
}
k.startTransition = function (e) {
  var t = pe.T,
    l = {}
  pe.T = l
  try {
    var n = e(),
      a = pe.S
    ;(a !== null && a(l, n),
      typeof n == 'object' && n !== null && typeof n.then == 'function' && n.then(Kc, _o))
  } catch (u) {
    _o(u)
  } finally {
    ;(t !== null && l.types !== null && (t.types = l.types), (pe.T = t))
  }
}
k.unstable_useCacheRefresh = function () {
  return pe.H.useCacheRefresh()
}
k.use = function (e) {
  return pe.H.use(e)
}
k.useActionState = function (e, t, l) {
  return pe.H.useActionState(e, t, l)
}
k.useCallback = function (e, t) {
  return pe.H.useCallback(e, t)
}
k.useContext = function (e) {
  return pe.H.useContext(e)
}
k.useDebugValue = function () {}
k.useDeferredValue = function (e, t) {
  return pe.H.useDeferredValue(e, t)
}
k.useEffect = function (e, t) {
  return pe.H.useEffect(e, t)
}
k.useEffectEvent = function (e) {
  return pe.H.useEffectEvent(e)
}
k.useId = function () {
  return pe.H.useId()
}
k.useImperativeHandle = function (e, t, l) {
  return pe.H.useImperativeHandle(e, t, l)
}
k.useInsertionEffect = function (e, t) {
  return pe.H.useInsertionEffect(e, t)
}
k.useLayoutEffect = function (e, t) {
  return pe.H.useLayoutEffect(e, t)
}
k.useMemo = function (e, t) {
  return pe.H.useMemo(e, t)
}
k.useOptimistic = function (e, t) {
  return pe.H.useOptimistic(e, t)
}
k.useReducer = function (e, t, l) {
  return pe.H.useReducer(e, t, l)
}
k.useRef = function (e) {
  return pe.H.useRef(e)
}
k.useState = function (e) {
  return pe.H.useState(e)
}
k.useSyncExternalStore = function (e, t, l) {
  return pe.H.useSyncExternalStore(e, t, l)
}
k.useTransition = function () {
  return pe.H.useTransition()
}
k.version = '19.2.1'
Uy.exports = k
var O = Uy.exports
const N = Ny(O),
  $D = b0({ __proto__: null, default: N }, [O])
var qy = { exports: {} },
  Sr = {},
  Ly = { exports: {} },
  et = {}
/**
 * @license React
 * react-dom.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var V0 = O
function Gy(e) {
  var t = 'https://react.dev/errors/' + e
  if (1 < arguments.length) {
    t += '?args[]=' + encodeURIComponent(arguments[1])
    for (var l = 2; l < arguments.length; l++) t += '&args[]=' + encodeURIComponent(arguments[l])
  }
  return (
    'Minified React error #' +
    e +
    '; visit ' +
    t +
    ' for the full message or use the non-minified dev environment for full errors and additional helpful warnings.'
  )
}
function Xl() {}
var Pe = {
    d: {
      f: Xl,
      r: function () {
        throw Error(Gy(522))
      },
      D: Xl,
      C: Xl,
      L: Xl,
      m: Xl,
      X: Xl,
      S: Xl,
      M: Xl,
    },
    p: 0,
    findDOMNode: null,
  },
  j0 = Symbol.for('react.portal')
function q0(e, t, l) {
  var n = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null
  return {
    $$typeof: j0,
    key: n == null ? null : '' + n,
    children: e,
    containerInfo: t,
    implementation: l,
  }
}
var au = V0.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
function Er(e, t) {
  if (e === 'font') return ''
  if (typeof t == 'string') return t === 'use-credentials' ? t : ''
}
et.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Pe
et.createPortal = function (e, t) {
  var l = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null
  if (!t || (t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11)) throw Error(Gy(299))
  return q0(e, t, null, l)
}
et.flushSync = function (e) {
  var t = au.T,
    l = Pe.p
  try {
    if (((au.T = null), (Pe.p = 2), e)) return e()
  } finally {
    ;((au.T = t), (Pe.p = l), Pe.d.f())
  }
}
et.preconnect = function (e, t) {
  typeof e == 'string' &&
    (t
      ? ((t = t.crossOrigin),
        (t = typeof t == 'string' ? (t === 'use-credentials' ? t : '') : void 0))
      : (t = null),
    Pe.d.C(e, t))
}
et.prefetchDNS = function (e) {
  typeof e == 'string' && Pe.d.D(e)
}
et.preinit = function (e, t) {
  if (typeof e == 'string' && t && typeof t.as == 'string') {
    var l = t.as,
      n = Er(l, t.crossOrigin),
      a = typeof t.integrity == 'string' ? t.integrity : void 0,
      u = typeof t.fetchPriority == 'string' ? t.fetchPriority : void 0
    l === 'style'
      ? Pe.d.S(e, typeof t.precedence == 'string' ? t.precedence : void 0, {
          crossOrigin: n,
          integrity: a,
          fetchPriority: u,
        })
      : l === 'script' &&
        Pe.d.X(e, {
          crossOrigin: n,
          integrity: a,
          fetchPriority: u,
          nonce: typeof t.nonce == 'string' ? t.nonce : void 0,
        })
  }
}
et.preinitModule = function (e, t) {
  if (typeof e == 'string')
    if (typeof t == 'object' && t !== null) {
      if (t.as == null || t.as === 'script') {
        var l = Er(t.as, t.crossOrigin)
        Pe.d.M(e, {
          crossOrigin: l,
          integrity: typeof t.integrity == 'string' ? t.integrity : void 0,
          nonce: typeof t.nonce == 'string' ? t.nonce : void 0,
        })
      }
    } else t == null && Pe.d.M(e)
}
et.preload = function (e, t) {
  if (typeof e == 'string' && typeof t == 'object' && t !== null && typeof t.as == 'string') {
    var l = t.as,
      n = Er(l, t.crossOrigin)
    Pe.d.L(e, l, {
      crossOrigin: n,
      integrity: typeof t.integrity == 'string' ? t.integrity : void 0,
      nonce: typeof t.nonce == 'string' ? t.nonce : void 0,
      type: typeof t.type == 'string' ? t.type : void 0,
      fetchPriority: typeof t.fetchPriority == 'string' ? t.fetchPriority : void 0,
      referrerPolicy: typeof t.referrerPolicy == 'string' ? t.referrerPolicy : void 0,
      imageSrcSet: typeof t.imageSrcSet == 'string' ? t.imageSrcSet : void 0,
      imageSizes: typeof t.imageSizes == 'string' ? t.imageSizes : void 0,
      media: typeof t.media == 'string' ? t.media : void 0,
    })
  }
}
et.preloadModule = function (e, t) {
  if (typeof e == 'string')
    if (t) {
      var l = Er(t.as, t.crossOrigin)
      Pe.d.m(e, {
        as: typeof t.as == 'string' && t.as !== 'script' ? t.as : void 0,
        crossOrigin: l,
        integrity: typeof t.integrity == 'string' ? t.integrity : void 0,
      })
    } else Pe.d.m(e)
}
et.requestFormReset = function (e) {
  Pe.d.r(e)
}
et.unstable_batchedUpdates = function (e, t) {
  return e(t)
}
et.useFormState = function (e, t, l) {
  return au.H.useFormState(e, t, l)
}
et.useFormStatus = function () {
  return au.H.useHostTransitionStatus()
}
et.version = '19.2.1'
function Xy() {
  if (
    !(
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > 'u' ||
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != 'function'
    )
  )
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Xy)
    } catch (e) {
      console.error(e)
    }
}
;(Xy(), (Ly.exports = et))
var ky = Ly.exports
const ID = Ny(ky)
/**
 * @license React
 * react-dom-client.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Le = Ng,
  Zy = O,
  L0 = ky
function z(e) {
  var t = 'https://react.dev/errors/' + e
  if (1 < arguments.length) {
    t += '?args[]=' + encodeURIComponent(arguments[1])
    for (var l = 2; l < arguments.length; l++) t += '&args[]=' + encodeURIComponent(arguments[l])
  }
  return (
    'Minified React error #' +
    e +
    '; visit ' +
    t +
    ' for the full message or use the non-minified dev environment for full errors and additional helpful warnings.'
  )
}
function Qy(e) {
  return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11))
}
function Hu(e) {
  var t = e,
    l = e
  if (e.alternate) for (; t.return; ) t = t.return
  else {
    e = t
    do ((t = e), t.flags & 4098 && (l = t.return), (e = t.return))
    while (e)
  }
  return t.tag === 3 ? l : null
}
function Ky(e) {
  if (e.tag === 13) {
    var t = e.memoizedState
    if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null))
      return t.dehydrated
  }
  return null
}
function Wy(e) {
  if (e.tag === 31) {
    var t = e.memoizedState
    if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null))
      return t.dehydrated
  }
  return null
}
function Mo(e) {
  if (Hu(e) !== e) throw Error(z(188))
}
function G0(e) {
  var t = e.alternate
  if (!t) {
    if (((t = Hu(e)), t === null)) throw Error(z(188))
    return t !== e ? null : e
  }
  for (var l = e, n = t; ; ) {
    var a = l.return
    if (a === null) break
    var u = a.alternate
    if (u === null) {
      if (((n = a.return), n !== null)) {
        l = n
        continue
      }
      break
    }
    if (a.child === u.child) {
      for (u = a.child; u; ) {
        if (u === l) return (Mo(a), e)
        if (u === n) return (Mo(a), t)
        u = u.sibling
      }
      throw Error(z(188))
    }
    if (l.return !== n.return) ((l = a), (n = u))
    else {
      for (var i = !1, r = a.child; r; ) {
        if (r === l) {
          ;((i = !0), (l = a), (n = u))
          break
        }
        if (r === n) {
          ;((i = !0), (n = a), (l = u))
          break
        }
        r = r.sibling
      }
      if (!i) {
        for (r = u.child; r; ) {
          if (r === l) {
            ;((i = !0), (l = u), (n = a))
            break
          }
          if (r === n) {
            ;((i = !0), (n = u), (l = a))
            break
          }
          r = r.sibling
        }
        if (!i) throw Error(z(189))
      }
    }
    if (l.alternate !== n) throw Error(z(190))
  }
  if (l.tag !== 3) throw Error(z(188))
  return l.stateNode.current === l ? e : t
}
function Jy(e) {
  var t = e.tag
  if (t === 5 || t === 26 || t === 27 || t === 6) return e
  for (e = e.child; e !== null; ) {
    if (((t = Jy(e)), t !== null)) return t
    e = e.sibling
  }
  return null
}
var Se = Object.assign,
  X0 = Symbol.for('react.element'),
  Iu = Symbol.for('react.transitional.element'),
  Pa = Symbol.for('react.portal'),
  ia = Symbol.for('react.fragment'),
  Fy = Symbol.for('react.strict_mode'),
  Wc = Symbol.for('react.profiler'),
  $y = Symbol.for('react.consumer'),
  Ol = Symbol.for('react.context'),
  cs = Symbol.for('react.forward_ref'),
  Jc = Symbol.for('react.suspense'),
  Fc = Symbol.for('react.suspense_list'),
  fs = Symbol.for('react.memo'),
  Ql = Symbol.for('react.lazy'),
  $c = Symbol.for('react.activity'),
  k0 = Symbol.for('react.memo_cache_sentinel'),
  Ao = Symbol.iterator
function Za(e) {
  return e === null || typeof e != 'object'
    ? null
    : ((e = (Ao && e[Ao]) || e['@@iterator']), typeof e == 'function' ? e : null)
}
var Z0 = Symbol.for('react.client.reference')
function Ic(e) {
  if (e == null) return null
  if (typeof e == 'function') return e.$$typeof === Z0 ? null : e.displayName || e.name || null
  if (typeof e == 'string') return e
  switch (e) {
    case ia:
      return 'Fragment'
    case Wc:
      return 'Profiler'
    case Fy:
      return 'StrictMode'
    case Jc:
      return 'Suspense'
    case Fc:
      return 'SuspenseList'
    case $c:
      return 'Activity'
  }
  if (typeof e == 'object')
    switch (e.$$typeof) {
      case Pa:
        return 'Portal'
      case Ol:
        return e.displayName || 'Context'
      case $y:
        return (e._context.displayName || 'Context') + '.Consumer'
      case cs:
        var t = e.render
        return (
          (e = e.displayName),
          e ||
            ((e = t.displayName || t.name || ''),
            (e = e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')),
          e
        )
      case fs:
        return ((t = e.displayName || null), t !== null ? t : Ic(e.type) || 'Memo')
      case Ql:
        ;((t = e._payload), (e = e._init))
        try {
          return Ic(e(t))
        } catch {}
    }
  return null
}
var eu = Array.isArray,
  L = Zy.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
  ae = L0.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
  xn = { pending: !1, data: null, method: null, action: null },
  Pc = [],
  ra = -1
function il(e) {
  return { current: e }
}
function ke(e) {
  0 > ra || ((e.current = Pc[ra]), (Pc[ra] = null), ra--)
}
function he(e, t) {
  ;(ra++, (Pc[ra] = e.current), (e.current = t))
}
var ul = il(null),
  Su = il(null),
  nn = il(null),
  wi = il(null)
function Vi(e, t) {
  switch ((he(nn, t), he(Su, e), he(ul, null), t.nodeType)) {
    case 9:
    case 11:
      e = (e = t.documentElement) && (e = e.namespaceURI) ? Rd(e) : 0
      break
    default:
      if (((e = t.tagName), (t = t.namespaceURI))) ((t = Rd(t)), (e = gv(t, e)))
      else
        switch (e) {
          case 'svg':
            e = 1
            break
          case 'math':
            e = 2
            break
          default:
            e = 0
        }
  }
  ;(ke(ul), he(ul, e))
}
function Aa() {
  ;(ke(ul), ke(Su), ke(nn))
}
function ef(e) {
  e.memoizedState !== null && he(wi, e)
  var t = ul.current,
    l = gv(t, e.type)
  t !== l && (he(Su, e), he(ul, l))
}
function ji(e) {
  ;(Su.current === e && (ke(ul), ke(Su)), wi.current === e && (ke(wi), (xu._currentValue = xn)))
}
var ac, To
function Mn(e) {
  if (ac === void 0)
    try {
      throw Error()
    } catch (l) {
      var t = l.stack.trim().match(/\n( *(at )?)/)
      ;((ac = (t && t[1]) || ''),
        (To =
          -1 <
          l.stack.indexOf(`
    at`)
            ? ' (<anonymous>)'
            : -1 < l.stack.indexOf('@')
              ? '@unknown:0:0'
              : ''))
    }
  return (
    `
` +
    ac +
    e +
    To
  )
}
var uc = !1
function ic(e, t) {
  if (!e || uc) return ''
  uc = !0
  var l = Error.prepareStackTrace
  Error.prepareStackTrace = void 0
  try {
    var n = {
      DetermineComponentFrameRoot: function () {
        try {
          if (t) {
            var y = function () {
              throw Error()
            }
            if (
              (Object.defineProperty(y.prototype, 'props', {
                set: function () {
                  throw Error()
                },
              }),
              typeof Reflect == 'object' && Reflect.construct)
            ) {
              try {
                Reflect.construct(y, [])
              } catch (v) {
                var o = v
              }
              Reflect.construct(e, [], y)
            } else {
              try {
                y.call()
              } catch (v) {
                o = v
              }
              e.call(y.prototype)
            }
          } else {
            try {
              throw Error()
            } catch (v) {
              o = v
            }
            ;(y = e()) && typeof y.catch == 'function' && y.catch(function () {})
          }
        } catch (v) {
          if (v && o && typeof v.stack == 'string') return [v.stack, o.stack]
        }
        return [null, null]
      },
    }
    n.DetermineComponentFrameRoot.displayName = 'DetermineComponentFrameRoot'
    var a = Object.getOwnPropertyDescriptor(n.DetermineComponentFrameRoot, 'name')
    a &&
      a.configurable &&
      Object.defineProperty(n.DetermineComponentFrameRoot, 'name', {
        value: 'DetermineComponentFrameRoot',
      })
    var u = n.DetermineComponentFrameRoot(),
      i = u[0],
      r = u[1]
    if (i && r) {
      var c = i.split(`
`),
        f = r.split(`
`)
      for (a = n = 0; n < c.length && !c[n].includes('DetermineComponentFrameRoot'); ) n++
      for (; a < f.length && !f[a].includes('DetermineComponentFrameRoot'); ) a++
      if (n === c.length || a === f.length)
        for (n = c.length - 1, a = f.length - 1; 1 <= n && 0 <= a && c[n] !== f[a]; ) a--
      for (; 1 <= n && 0 <= a; n--, a--)
        if (c[n] !== f[a]) {
          if (n !== 1 || a !== 1)
            do
              if ((n--, a--, 0 > a || c[n] !== f[a])) {
                var d =
                  `
` + c[n].replace(' at new ', ' at ')
                return (
                  e.displayName &&
                    d.includes('<anonymous>') &&
                    (d = d.replace('<anonymous>', e.displayName)),
                  d
                )
              }
            while (1 <= n && 0 <= a)
          break
        }
    }
  } finally {
    ;((uc = !1), (Error.prepareStackTrace = l))
  }
  return (l = e ? e.displayName || e.name : '') ? Mn(l) : ''
}
function Q0(e, t) {
  switch (e.tag) {
    case 26:
    case 27:
    case 5:
      return Mn(e.type)
    case 16:
      return Mn('Lazy')
    case 13:
      return e.child !== t && t !== null ? Mn('Suspense Fallback') : Mn('Suspense')
    case 19:
      return Mn('SuspenseList')
    case 0:
    case 15:
      return ic(e.type, !1)
    case 11:
      return ic(e.type.render, !1)
    case 1:
      return ic(e.type, !0)
    case 31:
      return Mn('Activity')
    default:
      return ''
  }
}
function Co(e) {
  try {
    var t = '',
      l = null
    do ((t += Q0(e, l)), (l = e), (e = e.return))
    while (e)
    return t
  } catch (n) {
    return (
      `
Error generating stack: ` +
      n.message +
      `
` +
      n.stack
    )
  }
}
var tf = Object.prototype.hasOwnProperty,
  ss = Le.unstable_scheduleCallback,
  rc = Le.unstable_cancelCallback,
  K0 = Le.unstable_shouldYield,
  W0 = Le.unstable_requestPaint,
  Et = Le.unstable_now,
  J0 = Le.unstable_getCurrentPriorityLevel,
  Iy = Le.unstable_ImmediatePriority,
  Py = Le.unstable_UserBlockingPriority,
  qi = Le.unstable_NormalPriority,
  F0 = Le.unstable_LowPriority,
  em = Le.unstable_IdlePriority,
  $0 = Le.log,
  I0 = Le.unstable_setDisableYieldValue,
  Yu = null,
  Dt = null
function Il(e) {
  if ((typeof $0 == 'function' && I0(e), Dt && typeof Dt.setStrictMode == 'function'))
    try {
      Dt.setStrictMode(Yu, e)
    } catch {}
}
var Ot = Math.clz32 ? Math.clz32 : tb,
  P0 = Math.log,
  eb = Math.LN2
function tb(e) {
  return ((e >>>= 0), e === 0 ? 32 : (31 - ((P0(e) / eb) | 0)) | 0)
}
var Pu = 256,
  ei = 262144,
  ti = 4194304
function An(e) {
  var t = e & 42
  if (t !== 0) return t
  switch (e & -e) {
    case 1:
      return 1
    case 2:
      return 2
    case 4:
      return 4
    case 8:
      return 8
    case 16:
      return 16
    case 32:
      return 32
    case 64:
      return 64
    case 128:
      return 128
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
      return e & 261888
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return e & 3932160
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
      return e & 62914560
    case 67108864:
      return 67108864
    case 134217728:
      return 134217728
    case 268435456:
      return 268435456
    case 536870912:
      return 536870912
    case 1073741824:
      return 0
    default:
      return e
  }
}
function Dr(e, t, l) {
  var n = e.pendingLanes
  if (n === 0) return 0
  var a = 0,
    u = e.suspendedLanes,
    i = e.pingedLanes
  e = e.warmLanes
  var r = n & 134217727
  return (
    r !== 0
      ? ((n = r & ~u),
        n !== 0
          ? (a = An(n))
          : ((i &= r), i !== 0 ? (a = An(i)) : l || ((l = r & ~e), l !== 0 && (a = An(l)))))
      : ((r = n & ~u),
        r !== 0
          ? (a = An(r))
          : i !== 0
            ? (a = An(i))
            : l || ((l = n & ~e), l !== 0 && (a = An(l)))),
    a === 0
      ? 0
      : t !== 0 &&
          t !== a &&
          !(t & u) &&
          ((u = a & -a), (l = t & -t), u >= l || (u === 32 && (l & 4194048) !== 0))
        ? t
        : a
  )
}
function wu(e, t) {
  return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0
}
function lb(e, t) {
  switch (e) {
    case 1:
    case 2:
    case 4:
    case 8:
    case 64:
      return t + 250
    case 16:
    case 32:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return t + 5e3
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
      return -1
    case 67108864:
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1
    default:
      return -1
  }
}
function tm() {
  var e = ti
  return ((ti <<= 1), !(ti & 62914560) && (ti = 4194304), e)
}
function cc(e) {
  for (var t = [], l = 0; 31 > l; l++) t.push(e)
  return t
}
function Vu(e, t) {
  ;((e.pendingLanes |= t),
    t !== 268435456 && ((e.suspendedLanes = 0), (e.pingedLanes = 0), (e.warmLanes = 0)))
}
function nb(e, t, l, n, a, u) {
  var i = e.pendingLanes
  ;((e.pendingLanes = l),
    (e.suspendedLanes = 0),
    (e.pingedLanes = 0),
    (e.warmLanes = 0),
    (e.expiredLanes &= l),
    (e.entangledLanes &= l),
    (e.errorRecoveryDisabledLanes &= l),
    (e.shellSuspendCounter = 0))
  var r = e.entanglements,
    c = e.expirationTimes,
    f = e.hiddenUpdates
  for (l = i & ~l; 0 < l; ) {
    var d = 31 - Ot(l),
      y = 1 << d
    ;((r[d] = 0), (c[d] = -1))
    var o = f[d]
    if (o !== null)
      for (f[d] = null, d = 0; d < o.length; d++) {
        var v = o[d]
        v !== null && (v.lane &= -536870913)
      }
    l &= ~y
  }
  ;(n !== 0 && lm(e, n, 0),
    u !== 0 && a === 0 && e.tag !== 0 && (e.suspendedLanes |= u & ~(i & ~t)))
}
function lm(e, t, l) {
  ;((e.pendingLanes |= t), (e.suspendedLanes &= ~t))
  var n = 31 - Ot(t)
  ;((e.entangledLanes |= t), (e.entanglements[n] = e.entanglements[n] | 1073741824 | (l & 261930)))
}
function nm(e, t) {
  var l = (e.entangledLanes |= t)
  for (e = e.entanglements; l; ) {
    var n = 31 - Ot(l),
      a = 1 << n
    ;((a & t) | (e[n] & t) && (e[n] |= t), (l &= ~a))
  }
}
function am(e, t) {
  var l = t & -t
  return ((l = l & 42 ? 1 : os(l)), l & (e.suspendedLanes | t) ? 0 : l)
}
function os(e) {
  switch (e) {
    case 2:
      e = 1
      break
    case 8:
      e = 4
      break
    case 32:
      e = 16
      break
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
      e = 128
      break
    case 268435456:
      e = 134217728
      break
    default:
      e = 0
  }
  return e
}
function ds(e) {
  return ((e &= -e), 2 < e ? (8 < e ? (e & 134217727 ? 32 : 268435456) : 8) : 2)
}
function um() {
  var e = ae.p
  return e !== 0 ? e : ((e = window.event), e === void 0 ? 32 : Cv(e.type))
}
function zo(e, t) {
  var l = ae.p
  try {
    return ((ae.p = e), t())
  } finally {
    ae.p = l
  }
}
var bn = Math.random().toString(36).slice(2),
  Ke = '__reactFiber$' + bn,
  ft = '__reactProps$' + bn,
  Va = '__reactContainer$' + bn,
  lf = '__reactEvents$' + bn,
  ab = '__reactListeners$' + bn,
  ub = '__reactHandles$' + bn,
  No = '__reactResources$' + bn,
  ju = '__reactMarker$' + bn
function ys(e) {
  ;(delete e[Ke], delete e[ft], delete e[lf], delete e[ab], delete e[ub])
}
function ca(e) {
  var t = e[Ke]
  if (t) return t
  for (var l = e.parentNode; l; ) {
    if ((t = l[Va] || l[Ke])) {
      if (((l = t.alternate), t.child !== null || (l !== null && l.child !== null)))
        for (e = wd(e); e !== null; ) {
          if ((l = e[Ke])) return l
          e = wd(e)
        }
      return t
    }
    ;((e = l), (l = e.parentNode))
  }
  return null
}
function ja(e) {
  if ((e = e[Ke] || e[Va])) {
    var t = e.tag
    if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e
  }
  return null
}
function tu(e) {
  var t = e.tag
  if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode
  throw Error(z(33))
}
function ba(e) {
  var t = e[No]
  return (t || (t = e[No] = { hoistableStyles: new Map(), hoistableScripts: new Map() }), t)
}
function Xe(e) {
  e[ju] = !0
}
var im = new Set(),
  rm = {}
function Gn(e, t) {
  ;(Ta(e, t), Ta(e + 'Capture', t))
}
function Ta(e, t) {
  for (rm[e] = t, e = 0; e < t.length; e++) im.add(t[e])
}
var ib = RegExp(
    '^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$',
  ),
  xo = {},
  Ro = {}
function rb(e) {
  return tf.call(Ro, e) ? !0 : tf.call(xo, e) ? !1 : ib.test(e) ? (Ro[e] = !0) : ((xo[e] = !0), !1)
}
function pi(e, t, l) {
  if (rb(t))
    if (l === null) e.removeAttribute(t)
    else {
      switch (typeof l) {
        case 'undefined':
        case 'function':
        case 'symbol':
          e.removeAttribute(t)
          return
        case 'boolean':
          var n = t.toLowerCase().slice(0, 5)
          if (n !== 'data-' && n !== 'aria-') {
            e.removeAttribute(t)
            return
          }
      }
      e.setAttribute(t, '' + l)
    }
}
function li(e, t, l) {
  if (l === null) e.removeAttribute(t)
  else {
    switch (typeof l) {
      case 'undefined':
      case 'function':
      case 'symbol':
      case 'boolean':
        e.removeAttribute(t)
        return
    }
    e.setAttribute(t, '' + l)
  }
}
function ml(e, t, l, n) {
  if (n === null) e.removeAttribute(l)
  else {
    switch (typeof n) {
      case 'undefined':
      case 'function':
      case 'symbol':
      case 'boolean':
        e.removeAttribute(l)
        return
    }
    e.setAttributeNS(t, l, '' + n)
  }
}
function Nt(e) {
  switch (typeof e) {
    case 'bigint':
    case 'boolean':
    case 'number':
    case 'string':
    case 'undefined':
      return e
    case 'object':
      return e
    default:
      return ''
  }
}
function cm(e) {
  var t = e.type
  return (e = e.nodeName) && e.toLowerCase() === 'input' && (t === 'checkbox' || t === 'radio')
}
function cb(e, t, l) {
  var n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t)
  if (
    !e.hasOwnProperty(t) &&
    typeof n < 'u' &&
    typeof n.get == 'function' &&
    typeof n.set == 'function'
  ) {
    var a = n.get,
      u = n.set
    return (
      Object.defineProperty(e, t, {
        configurable: !0,
        get: function () {
          return a.call(this)
        },
        set: function (i) {
          ;((l = '' + i), u.call(this, i))
        },
      }),
      Object.defineProperty(e, t, { enumerable: n.enumerable }),
      {
        getValue: function () {
          return l
        },
        setValue: function (i) {
          l = '' + i
        },
        stopTracking: function () {
          ;((e._valueTracker = null), delete e[t])
        },
      }
    )
  }
}
function nf(e) {
  if (!e._valueTracker) {
    var t = cm(e) ? 'checked' : 'value'
    e._valueTracker = cb(e, t, '' + e[t])
  }
}
function fm(e) {
  if (!e) return !1
  var t = e._valueTracker
  if (!t) return !0
  var l = t.getValue(),
    n = ''
  return (
    e && (n = cm(e) ? (e.checked ? 'true' : 'false') : e.value),
    (e = n),
    e !== l ? (t.setValue(e), !0) : !1
  )
}
function Li(e) {
  if (((e = e || (typeof document < 'u' ? document : void 0)), typeof e > 'u')) return null
  try {
    return e.activeElement || e.body
  } catch {
    return e.body
  }
}
var fb = /[\n"\\]/g
function Ut(e) {
  return e.replace(fb, function (t) {
    return '\\' + t.charCodeAt(0).toString(16) + ' '
  })
}
function af(e, t, l, n, a, u, i, r) {
  ;((e.name = ''),
    i != null && typeof i != 'function' && typeof i != 'symbol' && typeof i != 'boolean'
      ? (e.type = i)
      : e.removeAttribute('type'),
    t != null
      ? i === 'number'
        ? ((t === 0 && e.value === '') || e.value != t) && (e.value = '' + Nt(t))
        : e.value !== '' + Nt(t) && (e.value = '' + Nt(t))
      : (i !== 'submit' && i !== 'reset') || e.removeAttribute('value'),
    t != null
      ? uf(e, i, Nt(t))
      : l != null
        ? uf(e, i, Nt(l))
        : n != null && e.removeAttribute('value'),
    a == null && u != null && (e.defaultChecked = !!u),
    a != null && (e.checked = a && typeof a != 'function' && typeof a != 'symbol'),
    r != null && typeof r != 'function' && typeof r != 'symbol' && typeof r != 'boolean'
      ? (e.name = '' + Nt(r))
      : e.removeAttribute('name'))
}
function sm(e, t, l, n, a, u, i, r) {
  if (
    (u != null &&
      typeof u != 'function' &&
      typeof u != 'symbol' &&
      typeof u != 'boolean' &&
      (e.type = u),
    t != null || l != null)
  ) {
    if (!((u !== 'submit' && u !== 'reset') || t != null)) {
      nf(e)
      return
    }
    ;((l = l != null ? '' + Nt(l) : ''),
      (t = t != null ? '' + Nt(t) : l),
      r || t === e.value || (e.value = t),
      (e.defaultValue = t))
  }
  ;((n = n ?? a),
    (n = typeof n != 'function' && typeof n != 'symbol' && !!n),
    (e.checked = r ? e.checked : !!n),
    (e.defaultChecked = !!n),
    i != null &&
      typeof i != 'function' &&
      typeof i != 'symbol' &&
      typeof i != 'boolean' &&
      (e.name = i),
    nf(e))
}
function uf(e, t, l) {
  ;(t === 'number' && Li(e.ownerDocument) === e) ||
    e.defaultValue === '' + l ||
    (e.defaultValue = '' + l)
}
function pa(e, t, l, n) {
  if (((e = e.options), t)) {
    t = {}
    for (var a = 0; a < l.length; a++) t['$' + l[a]] = !0
    for (l = 0; l < e.length; l++)
      ((a = t.hasOwnProperty('$' + e[l].value)),
        e[l].selected !== a && (e[l].selected = a),
        a && n && (e[l].defaultSelected = !0))
  } else {
    for (l = '' + Nt(l), t = null, a = 0; a < e.length; a++) {
      if (e[a].value === l) {
        ;((e[a].selected = !0), n && (e[a].defaultSelected = !0))
        return
      }
      t !== null || e[a].disabled || (t = e[a])
    }
    t !== null && (t.selected = !0)
  }
}
function om(e, t, l) {
  if (t != null && ((t = '' + Nt(t)), t !== e.value && (e.value = t), l == null)) {
    e.defaultValue !== t && (e.defaultValue = t)
    return
  }
  e.defaultValue = l != null ? '' + Nt(l) : ''
}
function dm(e, t, l, n) {
  if (t == null) {
    if (n != null) {
      if (l != null) throw Error(z(92))
      if (eu(n)) {
        if (1 < n.length) throw Error(z(93))
        n = n[0]
      }
      l = n
    }
    ;(l == null && (l = ''), (t = l))
  }
  ;((l = Nt(t)),
    (e.defaultValue = l),
    (n = e.textContent),
    n === l && n !== '' && n !== null && (e.value = n),
    nf(e))
}
function Ca(e, t) {
  if (t) {
    var l = e.firstChild
    if (l && l === e.lastChild && l.nodeType === 3) {
      l.nodeValue = t
      return
    }
  }
  e.textContent = t
}
var sb = new Set(
  'animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp'.split(
    ' ',
  ),
)
function Uo(e, t, l) {
  var n = t.indexOf('--') === 0
  l == null || typeof l == 'boolean' || l === ''
    ? n
      ? e.setProperty(t, '')
      : t === 'float'
        ? (e.cssFloat = '')
        : (e[t] = '')
    : n
      ? e.setProperty(t, l)
      : typeof l != 'number' || l === 0 || sb.has(t)
        ? t === 'float'
          ? (e.cssFloat = l)
          : (e[t] = ('' + l).trim())
        : (e[t] = l + 'px')
}
function ym(e, t, l) {
  if (t != null && typeof t != 'object') throw Error(z(62))
  if (((e = e.style), l != null)) {
    for (var n in l)
      !l.hasOwnProperty(n) ||
        (t != null && t.hasOwnProperty(n)) ||
        (n.indexOf('--') === 0
          ? e.setProperty(n, '')
          : n === 'float'
            ? (e.cssFloat = '')
            : (e[n] = ''))
    for (var a in t) ((n = t[a]), t.hasOwnProperty(a) && l[a] !== n && Uo(e, a, n))
  } else for (var u in t) t.hasOwnProperty(u) && Uo(e, u, t[u])
}
function ms(e) {
  if (e.indexOf('-') === -1) return !1
  switch (e) {
    case 'annotation-xml':
    case 'color-profile':
    case 'font-face':
    case 'font-face-src':
    case 'font-face-uri':
    case 'font-face-format':
    case 'font-face-name':
    case 'missing-glyph':
      return !1
    default:
      return !0
  }
}
var ob = new Map([
    ['acceptCharset', 'accept-charset'],
    ['htmlFor', 'for'],
    ['httpEquiv', 'http-equiv'],
    ['crossOrigin', 'crossorigin'],
    ['accentHeight', 'accent-height'],
    ['alignmentBaseline', 'alignment-baseline'],
    ['arabicForm', 'arabic-form'],
    ['baselineShift', 'baseline-shift'],
    ['capHeight', 'cap-height'],
    ['clipPath', 'clip-path'],
    ['clipRule', 'clip-rule'],
    ['colorInterpolation', 'color-interpolation'],
    ['colorInterpolationFilters', 'color-interpolation-filters'],
    ['colorProfile', 'color-profile'],
    ['colorRendering', 'color-rendering'],
    ['dominantBaseline', 'dominant-baseline'],
    ['enableBackground', 'enable-background'],
    ['fillOpacity', 'fill-opacity'],
    ['fillRule', 'fill-rule'],
    ['floodColor', 'flood-color'],
    ['floodOpacity', 'flood-opacity'],
    ['fontFamily', 'font-family'],
    ['fontSize', 'font-size'],
    ['fontSizeAdjust', 'font-size-adjust'],
    ['fontStretch', 'font-stretch'],
    ['fontStyle', 'font-style'],
    ['fontVariant', 'font-variant'],
    ['fontWeight', 'font-weight'],
    ['glyphName', 'glyph-name'],
    ['glyphOrientationHorizontal', 'glyph-orientation-horizontal'],
    ['glyphOrientationVertical', 'glyph-orientation-vertical'],
    ['horizAdvX', 'horiz-adv-x'],
    ['horizOriginX', 'horiz-origin-x'],
    ['imageRendering', 'image-rendering'],
    ['letterSpacing', 'letter-spacing'],
    ['lightingColor', 'lighting-color'],
    ['markerEnd', 'marker-end'],
    ['markerMid', 'marker-mid'],
    ['markerStart', 'marker-start'],
    ['overlinePosition', 'overline-position'],
    ['overlineThickness', 'overline-thickness'],
    ['paintOrder', 'paint-order'],
    ['panose-1', 'panose-1'],
    ['pointerEvents', 'pointer-events'],
    ['renderingIntent', 'rendering-intent'],
    ['shapeRendering', 'shape-rendering'],
    ['stopColor', 'stop-color'],
    ['stopOpacity', 'stop-opacity'],
    ['strikethroughPosition', 'strikethrough-position'],
    ['strikethroughThickness', 'strikethrough-thickness'],
    ['strokeDasharray', 'stroke-dasharray'],
    ['strokeDashoffset', 'stroke-dashoffset'],
    ['strokeLinecap', 'stroke-linecap'],
    ['strokeLinejoin', 'stroke-linejoin'],
    ['strokeMiterlimit', 'stroke-miterlimit'],
    ['strokeOpacity', 'stroke-opacity'],
    ['strokeWidth', 'stroke-width'],
    ['textAnchor', 'text-anchor'],
    ['textDecoration', 'text-decoration'],
    ['textRendering', 'text-rendering'],
    ['transformOrigin', 'transform-origin'],
    ['underlinePosition', 'underline-position'],
    ['underlineThickness', 'underline-thickness'],
    ['unicodeBidi', 'unicode-bidi'],
    ['unicodeRange', 'unicode-range'],
    ['unitsPerEm', 'units-per-em'],
    ['vAlphabetic', 'v-alphabetic'],
    ['vHanging', 'v-hanging'],
    ['vIdeographic', 'v-ideographic'],
    ['vMathematical', 'v-mathematical'],
    ['vectorEffect', 'vector-effect'],
    ['vertAdvY', 'vert-adv-y'],
    ['vertOriginX', 'vert-origin-x'],
    ['vertOriginY', 'vert-origin-y'],
    ['wordSpacing', 'word-spacing'],
    ['writingMode', 'writing-mode'],
    ['xmlnsXlink', 'xmlns:xlink'],
    ['xHeight', 'x-height'],
  ]),
  db =
    /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i
function Si(e) {
  return db.test('' + e)
    ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')"
    : e
}
function _l() {}
var rf = null
function hs(e) {
  return (
    (e = e.target || e.srcElement || window),
    e.correspondingUseElement && (e = e.correspondingUseElement),
    e.nodeType === 3 ? e.parentNode : e
  )
}
var fa = null,
  Sa = null
function Bo(e) {
  var t = ja(e)
  if (t && (e = t.stateNode)) {
    var l = e[ft] || null
    e: switch (((e = t.stateNode), t.type)) {
      case 'input':
        if (
          (af(
            e,
            l.value,
            l.defaultValue,
            l.defaultValue,
            l.checked,
            l.defaultChecked,
            l.type,
            l.name,
          ),
          (t = l.name),
          l.type === 'radio' && t != null)
        ) {
          for (l = e; l.parentNode; ) l = l.parentNode
          for (
            l = l.querySelectorAll('input[name="' + Ut('' + t) + '"][type="radio"]'), t = 0;
            t < l.length;
            t++
          ) {
            var n = l[t]
            if (n !== e && n.form === e.form) {
              var a = n[ft] || null
              if (!a) throw Error(z(90))
              af(
                n,
                a.value,
                a.defaultValue,
                a.defaultValue,
                a.checked,
                a.defaultChecked,
                a.type,
                a.name,
              )
            }
          }
          for (t = 0; t < l.length; t++) ((n = l[t]), n.form === e.form && fm(n))
        }
        break e
      case 'textarea':
        om(e, l.value, l.defaultValue)
        break e
      case 'select':
        ;((t = l.value), t != null && pa(e, !!l.multiple, t, !1))
    }
  }
}
var fc = !1
function mm(e, t, l) {
  if (fc) return e(t, l)
  fc = !0
  try {
    var n = e(t)
    return n
  } finally {
    if (
      ((fc = !1),
      (fa !== null || Sa !== null) &&
        (Br(), fa && ((t = fa), (e = Sa), (Sa = fa = null), Bo(t), e)))
    )
      for (t = 0; t < e.length; t++) Bo(e[t])
  }
}
function Eu(e, t) {
  var l = e.stateNode
  if (l === null) return null
  var n = l[ft] || null
  if (n === null) return null
  l = n[t]
  e: switch (t) {
    case 'onClick':
    case 'onClickCapture':
    case 'onDoubleClick':
    case 'onDoubleClickCapture':
    case 'onMouseDown':
    case 'onMouseDownCapture':
    case 'onMouseMove':
    case 'onMouseMoveCapture':
    case 'onMouseUp':
    case 'onMouseUpCapture':
    case 'onMouseEnter':
      ;((n = !n.disabled) ||
        ((e = e.type),
        (n = !(e === 'button' || e === 'input' || e === 'select' || e === 'textarea'))),
        (e = !n))
      break e
    default:
      e = !1
  }
  if (e) return null
  if (l && typeof l != 'function') throw Error(z(231, t, typeof l))
  return l
}
var Rl = !(
    typeof window > 'u' ||
    typeof window.document > 'u' ||
    typeof window.document.createElement > 'u'
  ),
  cf = !1
if (Rl)
  try {
    var Qa = {}
    ;(Object.defineProperty(Qa, 'passive', {
      get: function () {
        cf = !0
      },
    }),
      window.addEventListener('test', Qa, Qa),
      window.removeEventListener('test', Qa, Qa))
  } catch {
    cf = !1
  }
var Pl = null,
  vs = null,
  Ei = null
function hm() {
  if (Ei) return Ei
  var e,
    t = vs,
    l = t.length,
    n,
    a = 'value' in Pl ? Pl.value : Pl.textContent,
    u = a.length
  for (e = 0; e < l && t[e] === a[e]; e++);
  var i = l - e
  for (n = 1; n <= i && t[l - n] === a[u - n]; n++);
  return (Ei = a.slice(e, 1 < n ? 1 - n : void 0))
}
function Di(e) {
  var t = e.keyCode
  return (
    'charCode' in e ? ((e = e.charCode), e === 0 && t === 13 && (e = 13)) : (e = t),
    e === 10 && (e = 13),
    32 <= e || e === 13 ? e : 0
  )
}
function ni() {
  return !0
}
function Ho() {
  return !1
}
function st(e) {
  function t(l, n, a, u, i) {
    ;((this._reactName = l),
      (this._targetInst = a),
      (this.type = n),
      (this.nativeEvent = u),
      (this.target = i),
      (this.currentTarget = null))
    for (var r in e) e.hasOwnProperty(r) && ((l = e[r]), (this[r] = l ? l(u) : u[r]))
    return (
      (this.isDefaultPrevented = (
        u.defaultPrevented != null ? u.defaultPrevented : u.returnValue === !1
      )
        ? ni
        : Ho),
      (this.isPropagationStopped = Ho),
      this
    )
  }
  return (
    Se(t.prototype, {
      preventDefault: function () {
        this.defaultPrevented = !0
        var l = this.nativeEvent
        l &&
          (l.preventDefault
            ? l.preventDefault()
            : typeof l.returnValue != 'unknown' && (l.returnValue = !1),
          (this.isDefaultPrevented = ni))
      },
      stopPropagation: function () {
        var l = this.nativeEvent
        l &&
          (l.stopPropagation
            ? l.stopPropagation()
            : typeof l.cancelBubble != 'unknown' && (l.cancelBubble = !0),
          (this.isPropagationStopped = ni))
      },
      persist: function () {},
      isPersistent: ni,
    }),
    t
  )
}
var Xn = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function (e) {
      return e.timeStamp || Date.now()
    },
    defaultPrevented: 0,
    isTrusted: 0,
  },
  Or = st(Xn),
  qu = Se({}, Xn, { view: 0, detail: 0 }),
  yb = st(qu),
  sc,
  oc,
  Ka,
  _r = Se({}, qu, {
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    getModifierState: gs,
    button: 0,
    buttons: 0,
    relatedTarget: function (e) {
      return e.relatedTarget === void 0
        ? e.fromElement === e.srcElement
          ? e.toElement
          : e.fromElement
        : e.relatedTarget
    },
    movementX: function (e) {
      return 'movementX' in e
        ? e.movementX
        : (e !== Ka &&
            (Ka && e.type === 'mousemove'
              ? ((sc = e.screenX - Ka.screenX), (oc = e.screenY - Ka.screenY))
              : (oc = sc = 0),
            (Ka = e)),
          sc)
    },
    movementY: function (e) {
      return 'movementY' in e ? e.movementY : oc
    },
  }),
  Yo = st(_r),
  mb = Se({}, _r, { dataTransfer: 0 }),
  hb = st(mb),
  vb = Se({}, qu, { relatedTarget: 0 }),
  dc = st(vb),
  gb = Se({}, Xn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
  bb = st(gb),
  pb = Se({}, Xn, {
    clipboardData: function (e) {
      return 'clipboardData' in e ? e.clipboardData : window.clipboardData
    },
  }),
  Sb = st(pb),
  Eb = Se({}, Xn, { data: 0 }),
  wo = st(Eb),
  Db = {
    Esc: 'Escape',
    Spacebar: ' ',
    Left: 'ArrowLeft',
    Up: 'ArrowUp',
    Right: 'ArrowRight',
    Down: 'ArrowDown',
    Del: 'Delete',
    Win: 'OS',
    Menu: 'ContextMenu',
    Apps: 'ContextMenu',
    Scroll: 'ScrollLock',
    MozPrintableKey: 'Unidentified',
  },
  Ob = {
    8: 'Backspace',
    9: 'Tab',
    12: 'Clear',
    13: 'Enter',
    16: 'Shift',
    17: 'Control',
    18: 'Alt',
    19: 'Pause',
    20: 'CapsLock',
    27: 'Escape',
    32: ' ',
    33: 'PageUp',
    34: 'PageDown',
    35: 'End',
    36: 'Home',
    37: 'ArrowLeft',
    38: 'ArrowUp',
    39: 'ArrowRight',
    40: 'ArrowDown',
    45: 'Insert',
    46: 'Delete',
    112: 'F1',
    113: 'F2',
    114: 'F3',
    115: 'F4',
    116: 'F5',
    117: 'F6',
    118: 'F7',
    119: 'F8',
    120: 'F9',
    121: 'F10',
    122: 'F11',
    123: 'F12',
    144: 'NumLock',
    145: 'ScrollLock',
    224: 'Meta',
  },
  _b = { Alt: 'altKey', Control: 'ctrlKey', Meta: 'metaKey', Shift: 'shiftKey' }
function Mb(e) {
  var t = this.nativeEvent
  return t.getModifierState ? t.getModifierState(e) : (e = _b[e]) ? !!t[e] : !1
}
function gs() {
  return Mb
}
var Ab = Se({}, qu, {
    key: function (e) {
      if (e.key) {
        var t = Db[e.key] || e.key
        if (t !== 'Unidentified') return t
      }
      return e.type === 'keypress'
        ? ((e = Di(e)), e === 13 ? 'Enter' : String.fromCharCode(e))
        : e.type === 'keydown' || e.type === 'keyup'
          ? Ob[e.keyCode] || 'Unidentified'
          : ''
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: gs,
    charCode: function (e) {
      return e.type === 'keypress' ? Di(e) : 0
    },
    keyCode: function (e) {
      return e.type === 'keydown' || e.type === 'keyup' ? e.keyCode : 0
    },
    which: function (e) {
      return e.type === 'keypress'
        ? Di(e)
        : e.type === 'keydown' || e.type === 'keyup'
          ? e.keyCode
          : 0
    },
  }),
  Tb = st(Ab),
  Cb = Se({}, _r, {
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 0,
    isPrimary: 0,
  }),
  Vo = st(Cb),
  zb = Se({}, qu, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: gs,
  }),
  Nb = st(zb),
  xb = Se({}, Xn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
  Rb = st(xb),
  Ub = Se({}, _r, {
    deltaX: function (e) {
      return 'deltaX' in e ? e.deltaX : 'wheelDeltaX' in e ? -e.wheelDeltaX : 0
    },
    deltaY: function (e) {
      return 'deltaY' in e
        ? e.deltaY
        : 'wheelDeltaY' in e
          ? -e.wheelDeltaY
          : 'wheelDelta' in e
            ? -e.wheelDelta
            : 0
    },
    deltaZ: 0,
    deltaMode: 0,
  }),
  Bb = st(Ub),
  Hb = Se({}, Xn, { newState: 0, oldState: 0 }),
  Yb = st(Hb),
  wb = [9, 13, 27, 32],
  bs = Rl && 'CompositionEvent' in window,
  uu = null
Rl && 'documentMode' in document && (uu = document.documentMode)
var Vb = Rl && 'TextEvent' in window && !uu,
  vm = Rl && (!bs || (uu && 8 < uu && 11 >= uu)),
  jo = ' ',
  qo = !1
function gm(e, t) {
  switch (e) {
    case 'keyup':
      return wb.indexOf(t.keyCode) !== -1
    case 'keydown':
      return t.keyCode !== 229
    case 'keypress':
    case 'mousedown':
    case 'focusout':
      return !0
    default:
      return !1
  }
}
function bm(e) {
  return ((e = e.detail), typeof e == 'object' && 'data' in e ? e.data : null)
}
var sa = !1
function jb(e, t) {
  switch (e) {
    case 'compositionend':
      return bm(t)
    case 'keypress':
      return t.which !== 32 ? null : ((qo = !0), jo)
    case 'textInput':
      return ((e = t.data), e === jo && qo ? null : e)
    default:
      return null
  }
}
function qb(e, t) {
  if (sa)
    return e === 'compositionend' || (!bs && gm(e, t))
      ? ((e = hm()), (Ei = vs = Pl = null), (sa = !1), e)
      : null
  switch (e) {
    case 'paste':
      return null
    case 'keypress':
      if (!(t.ctrlKey || t.altKey || t.metaKey) || (t.ctrlKey && t.altKey)) {
        if (t.char && 1 < t.char.length) return t.char
        if (t.which) return String.fromCharCode(t.which)
      }
      return null
    case 'compositionend':
      return vm && t.locale !== 'ko' ? null : t.data
    default:
      return null
  }
}
var Lb = {
  color: !0,
  date: !0,
  datetime: !0,
  'datetime-local': !0,
  email: !0,
  month: !0,
  number: !0,
  password: !0,
  range: !0,
  search: !0,
  tel: !0,
  text: !0,
  time: !0,
  url: !0,
  week: !0,
}
function Lo(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase()
  return t === 'input' ? !!Lb[e.type] : t === 'textarea'
}
function pm(e, t, l, n) {
  ;(fa ? (Sa ? Sa.push(n) : (Sa = [n])) : (fa = n),
    (t = ur(t, 'onChange')),
    0 < t.length &&
      ((l = new Or('onChange', 'change', null, l, n)), e.push({ event: l, listeners: t })))
}
var iu = null,
  Du = null
function Gb(e) {
  mv(e, 0)
}
function Mr(e) {
  var t = tu(e)
  if (fm(t)) return e
}
function Go(e, t) {
  if (e === 'change') return t
}
var Sm = !1
if (Rl) {
  var yc
  if (Rl) {
    var mc = 'oninput' in document
    if (!mc) {
      var Xo = document.createElement('div')
      ;(Xo.setAttribute('oninput', 'return;'), (mc = typeof Xo.oninput == 'function'))
    }
    yc = mc
  } else yc = !1
  Sm = yc && (!document.documentMode || 9 < document.documentMode)
}
function ko() {
  iu && (iu.detachEvent('onpropertychange', Em), (Du = iu = null))
}
function Em(e) {
  if (e.propertyName === 'value' && Mr(Du)) {
    var t = []
    ;(pm(t, Du, e, hs(e)), mm(Gb, t))
  }
}
function Xb(e, t, l) {
  e === 'focusin'
    ? (ko(), (iu = t), (Du = l), iu.attachEvent('onpropertychange', Em))
    : e === 'focusout' && ko()
}
function kb(e) {
  if (e === 'selectionchange' || e === 'keyup' || e === 'keydown') return Mr(Du)
}
function Zb(e, t) {
  if (e === 'click') return Mr(t)
}
function Qb(e, t) {
  if (e === 'input' || e === 'change') return Mr(t)
}
function Kb(e, t) {
  return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t)
}
var Mt = typeof Object.is == 'function' ? Object.is : Kb
function Ou(e, t) {
  if (Mt(e, t)) return !0
  if (typeof e != 'object' || e === null || typeof t != 'object' || t === null) return !1
  var l = Object.keys(e),
    n = Object.keys(t)
  if (l.length !== n.length) return !1
  for (n = 0; n < l.length; n++) {
    var a = l[n]
    if (!tf.call(t, a) || !Mt(e[a], t[a])) return !1
  }
  return !0
}
function Zo(e) {
  for (; e && e.firstChild; ) e = e.firstChild
  return e
}
function Qo(e, t) {
  var l = Zo(e)
  e = 0
  for (var n; l; ) {
    if (l.nodeType === 3) {
      if (((n = e + l.textContent.length), e <= t && n >= t)) return { node: l, offset: t - e }
      e = n
    }
    e: {
      for (; l; ) {
        if (l.nextSibling) {
          l = l.nextSibling
          break e
        }
        l = l.parentNode
      }
      l = void 0
    }
    l = Zo(l)
  }
}
function Dm(e, t) {
  return e && t
    ? e === t
      ? !0
      : e && e.nodeType === 3
        ? !1
        : t && t.nodeType === 3
          ? Dm(e, t.parentNode)
          : 'contains' in e
            ? e.contains(t)
            : e.compareDocumentPosition
              ? !!(e.compareDocumentPosition(t) & 16)
              : !1
    : !1
}
function Om(e) {
  e =
    e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null
      ? e.ownerDocument.defaultView
      : window
  for (var t = Li(e.document); t instanceof e.HTMLIFrameElement; ) {
    try {
      var l = typeof t.contentWindow.location.href == 'string'
    } catch {
      l = !1
    }
    if (l) e = t.contentWindow
    else break
    t = Li(e.document)
  }
  return t
}
function ps(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase()
  return (
    t &&
    ((t === 'input' &&
      (e.type === 'text' ||
        e.type === 'search' ||
        e.type === 'tel' ||
        e.type === 'url' ||
        e.type === 'password')) ||
      t === 'textarea' ||
      e.contentEditable === 'true')
  )
}
var Wb = Rl && 'documentMode' in document && 11 >= document.documentMode,
  oa = null,
  ff = null,
  ru = null,
  sf = !1
function Ko(e, t, l) {
  var n = l.window === l ? l.document : l.nodeType === 9 ? l : l.ownerDocument
  sf ||
    oa == null ||
    oa !== Li(n) ||
    ((n = oa),
    'selectionStart' in n && ps(n)
      ? (n = { start: n.selectionStart, end: n.selectionEnd })
      : ((n = ((n.ownerDocument && n.ownerDocument.defaultView) || window).getSelection()),
        (n = {
          anchorNode: n.anchorNode,
          anchorOffset: n.anchorOffset,
          focusNode: n.focusNode,
          focusOffset: n.focusOffset,
        })),
    (ru && Ou(ru, n)) ||
      ((ru = n),
      (n = ur(ff, 'onSelect')),
      0 < n.length &&
        ((t = new Or('onSelect', 'select', null, t, l)),
        e.push({ event: t, listeners: n }),
        (t.target = oa))))
}
function _n(e, t) {
  var l = {}
  return (
    (l[e.toLowerCase()] = t.toLowerCase()),
    (l['Webkit' + e] = 'webkit' + t),
    (l['Moz' + e] = 'moz' + t),
    l
  )
}
var da = {
    animationend: _n('Animation', 'AnimationEnd'),
    animationiteration: _n('Animation', 'AnimationIteration'),
    animationstart: _n('Animation', 'AnimationStart'),
    transitionrun: _n('Transition', 'TransitionRun'),
    transitionstart: _n('Transition', 'TransitionStart'),
    transitioncancel: _n('Transition', 'TransitionCancel'),
    transitionend: _n('Transition', 'TransitionEnd'),
  },
  hc = {},
  _m = {}
Rl &&
  ((_m = document.createElement('div').style),
  'AnimationEvent' in window ||
    (delete da.animationend.animation,
    delete da.animationiteration.animation,
    delete da.animationstart.animation),
  'TransitionEvent' in window || delete da.transitionend.transition)
function kn(e) {
  if (hc[e]) return hc[e]
  if (!da[e]) return e
  var t = da[e],
    l
  for (l in t) if (t.hasOwnProperty(l) && l in _m) return (hc[e] = t[l])
  return e
}
var Mm = kn('animationend'),
  Am = kn('animationiteration'),
  Tm = kn('animationstart'),
  Jb = kn('transitionrun'),
  Fb = kn('transitionstart'),
  $b = kn('transitioncancel'),
  Cm = kn('transitionend'),
  zm = new Map(),
  of =
    'abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel'.split(
      ' ',
    )
of.push('scrollEnd')
function Wt(e, t) {
  ;(zm.set(e, t), Gn(t, [e]))
}
var Gi =
    typeof reportError == 'function'
      ? reportError
      : function (e) {
          if (typeof window == 'object' && typeof window.ErrorEvent == 'function') {
            var t = new window.ErrorEvent('error', {
              bubbles: !0,
              cancelable: !0,
              message:
                typeof e == 'object' && e !== null && typeof e.message == 'string'
                  ? String(e.message)
                  : String(e),
              error: e,
            })
            if (!window.dispatchEvent(t)) return
          } else if (typeof process == 'object' && typeof process.emit == 'function') {
            process.emit('uncaughtException', e)
            return
          }
          console.error(e)
        },
  zt = [],
  ya = 0,
  Ss = 0
function Ar() {
  for (var e = ya, t = (Ss = ya = 0); t < e; ) {
    var l = zt[t]
    zt[t++] = null
    var n = zt[t]
    zt[t++] = null
    var a = zt[t]
    zt[t++] = null
    var u = zt[t]
    if (((zt[t++] = null), n !== null && a !== null)) {
      var i = n.pending
      ;(i === null ? (a.next = a) : ((a.next = i.next), (i.next = a)), (n.pending = a))
    }
    u !== 0 && Nm(l, a, u)
  }
}
function Tr(e, t, l, n) {
  ;((zt[ya++] = e),
    (zt[ya++] = t),
    (zt[ya++] = l),
    (zt[ya++] = n),
    (Ss |= n),
    (e.lanes |= n),
    (e = e.alternate),
    e !== null && (e.lanes |= n))
}
function Es(e, t, l, n) {
  return (Tr(e, t, l, n), Xi(e))
}
function Zn(e, t) {
  return (Tr(e, null, null, t), Xi(e))
}
function Nm(e, t, l) {
  e.lanes |= l
  var n = e.alternate
  n !== null && (n.lanes |= l)
  for (var a = !1, u = e.return; u !== null; )
    ((u.childLanes |= l),
      (n = u.alternate),
      n !== null && (n.childLanes |= l),
      u.tag === 22 && ((e = u.stateNode), e === null || e._visibility & 1 || (a = !0)),
      (e = u),
      (u = u.return))
  return e.tag === 3
    ? ((u = e.stateNode),
      a &&
        t !== null &&
        ((a = 31 - Ot(l)),
        (e = u.hiddenUpdates),
        (n = e[a]),
        n === null ? (e[a] = [t]) : n.push(t),
        (t.lane = l | 536870912)),
      u)
    : null
}
function Xi(e) {
  if (50 < vu) throw ((vu = 0), (Rf = null), Error(z(185)))
  for (var t = e.return; t !== null; ) ((e = t), (t = e.return))
  return e.tag === 3 ? e.stateNode : null
}
var ma = {}
function Ib(e, t, l, n) {
  ;((this.tag = e),
    (this.key = l),
    (this.sibling =
      this.child =
      this.return =
      this.stateNode =
      this.type =
      this.elementType =
        null),
    (this.index = 0),
    (this.refCleanup = this.ref = null),
    (this.pendingProps = t),
    (this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null),
    (this.mode = n),
    (this.subtreeFlags = this.flags = 0),
    (this.deletions = null),
    (this.childLanes = this.lanes = 0),
    (this.alternate = null))
}
function bt(e, t, l, n) {
  return new Ib(e, t, l, n)
}
function Ds(e) {
  return ((e = e.prototype), !(!e || !e.isReactComponent))
}
function Cl(e, t) {
  var l = e.alternate
  return (
    l === null
      ? ((l = bt(e.tag, t, e.key, e.mode)),
        (l.elementType = e.elementType),
        (l.type = e.type),
        (l.stateNode = e.stateNode),
        (l.alternate = e),
        (e.alternate = l))
      : ((l.pendingProps = t),
        (l.type = e.type),
        (l.flags = 0),
        (l.subtreeFlags = 0),
        (l.deletions = null)),
    (l.flags = e.flags & 65011712),
    (l.childLanes = e.childLanes),
    (l.lanes = e.lanes),
    (l.child = e.child),
    (l.memoizedProps = e.memoizedProps),
    (l.memoizedState = e.memoizedState),
    (l.updateQueue = e.updateQueue),
    (t = e.dependencies),
    (l.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }),
    (l.sibling = e.sibling),
    (l.index = e.index),
    (l.ref = e.ref),
    (l.refCleanup = e.refCleanup),
    l
  )
}
function xm(e, t) {
  e.flags &= 65011714
  var l = e.alternate
  return (
    l === null
      ? ((e.childLanes = 0),
        (e.lanes = t),
        (e.child = null),
        (e.subtreeFlags = 0),
        (e.memoizedProps = null),
        (e.memoizedState = null),
        (e.updateQueue = null),
        (e.dependencies = null),
        (e.stateNode = null))
      : ((e.childLanes = l.childLanes),
        (e.lanes = l.lanes),
        (e.child = l.child),
        (e.subtreeFlags = 0),
        (e.deletions = null),
        (e.memoizedProps = l.memoizedProps),
        (e.memoizedState = l.memoizedState),
        (e.updateQueue = l.updateQueue),
        (e.type = l.type),
        (t = l.dependencies),
        (e.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext })),
    e
  )
}
function Oi(e, t, l, n, a, u) {
  var i = 0
  if (((n = e), typeof e == 'function')) Ds(e) && (i = 1)
  else if (typeof e == 'string')
    i = np(e, l, ul.current) ? 26 : e === 'html' || e === 'head' || e === 'body' ? 27 : 5
  else
    e: switch (e) {
      case $c:
        return ((e = bt(31, l, t, a)), (e.elementType = $c), (e.lanes = u), e)
      case ia:
        return Rn(l.children, a, u, t)
      case Fy:
        ;((i = 8), (a |= 24))
        break
      case Wc:
        return ((e = bt(12, l, t, a | 2)), (e.elementType = Wc), (e.lanes = u), e)
      case Jc:
        return ((e = bt(13, l, t, a)), (e.elementType = Jc), (e.lanes = u), e)
      case Fc:
        return ((e = bt(19, l, t, a)), (e.elementType = Fc), (e.lanes = u), e)
      default:
        if (typeof e == 'object' && e !== null)
          switch (e.$$typeof) {
            case Ol:
              i = 10
              break e
            case $y:
              i = 9
              break e
            case cs:
              i = 11
              break e
            case fs:
              i = 14
              break e
            case Ql:
              ;((i = 16), (n = null))
              break e
          }
        ;((i = 29), (l = Error(z(130, e === null ? 'null' : typeof e, ''))), (n = null))
    }
  return ((t = bt(i, l, t, a)), (t.elementType = e), (t.type = n), (t.lanes = u), t)
}
function Rn(e, t, l, n) {
  return ((e = bt(7, e, n, t)), (e.lanes = l), e)
}
function vc(e, t, l) {
  return ((e = bt(6, e, null, t)), (e.lanes = l), e)
}
function Rm(e) {
  var t = bt(18, null, null, 0)
  return ((t.stateNode = e), t)
}
function gc(e, t, l) {
  return (
    (t = bt(4, e.children !== null ? e.children : [], e.key, t)),
    (t.lanes = l),
    (t.stateNode = {
      containerInfo: e.containerInfo,
      pendingChildren: null,
      implementation: e.implementation,
    }),
    t
  )
}
var Wo = new WeakMap()
function Bt(e, t) {
  if (typeof e == 'object' && e !== null) {
    var l = Wo.get(e)
    return l !== void 0 ? l : ((t = { value: e, source: t, stack: Co(t) }), Wo.set(e, t), t)
  }
  return { value: e, source: t, stack: Co(t) }
}
var ha = [],
  va = 0,
  ki = null,
  _u = 0,
  xt = [],
  Rt = 0,
  yn = null,
  tl = 1,
  ll = ''
function Sl(e, t) {
  ;((ha[va++] = _u), (ha[va++] = ki), (ki = e), (_u = t))
}
function Um(e, t, l) {
  ;((xt[Rt++] = tl), (xt[Rt++] = ll), (xt[Rt++] = yn), (yn = e))
  var n = tl
  e = ll
  var a = 32 - Ot(n) - 1
  ;((n &= ~(1 << a)), (l += 1))
  var u = 32 - Ot(t) + a
  if (30 < u) {
    var i = a - (a % 5)
    ;((u = (n & ((1 << i) - 1)).toString(32)),
      (n >>= i),
      (a -= i),
      (tl = (1 << (32 - Ot(t) + a)) | (l << a) | n),
      (ll = u + e))
  } else ((tl = (1 << u) | (l << a) | n), (ll = e))
}
function Os(e) {
  e.return !== null && (Sl(e, 1), Um(e, 1, 0))
}
function _s(e) {
  for (; e === ki; ) ((ki = ha[--va]), (ha[va] = null), (_u = ha[--va]), (ha[va] = null))
  for (; e === yn; )
    ((yn = xt[--Rt]),
      (xt[Rt] = null),
      (ll = xt[--Rt]),
      (xt[Rt] = null),
      (tl = xt[--Rt]),
      (xt[Rt] = null))
}
function Bm(e, t) {
  ;((xt[Rt++] = tl), (xt[Rt++] = ll), (xt[Rt++] = yn), (tl = t.id), (ll = t.overflow), (yn = e))
}
var We = null,
  be = null,
  ee = !1,
  an = null,
  Ht = !1,
  df = Error(z(519))
function mn(e) {
  var t = Error(
    z(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? 'text' : 'HTML', ''),
  )
  throw (Mu(Bt(t, e)), df)
}
function Jo(e) {
  var t = e.stateNode,
    l = e.type,
    n = e.memoizedProps
  switch (((t[Ke] = e), (t[ft] = n), l)) {
    case 'dialog':
      ;(F('cancel', t), F('close', t))
      break
    case 'iframe':
    case 'object':
    case 'embed':
      F('load', t)
      break
    case 'video':
    case 'audio':
      for (l = 0; l < zu.length; l++) F(zu[l], t)
      break
    case 'source':
      F('error', t)
      break
    case 'img':
    case 'image':
    case 'link':
      ;(F('error', t), F('load', t))
      break
    case 'details':
      F('toggle', t)
      break
    case 'input':
      ;(F('invalid', t),
        sm(t, n.value, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name, !0))
      break
    case 'select':
      F('invalid', t)
      break
    case 'textarea':
      ;(F('invalid', t), dm(t, n.value, n.defaultValue, n.children))
  }
  ;((l = n.children),
    (typeof l != 'string' && typeof l != 'number' && typeof l != 'bigint') ||
    t.textContent === '' + l ||
    n.suppressHydrationWarning === !0 ||
    vv(t.textContent, l)
      ? (n.popover != null && (F('beforetoggle', t), F('toggle', t)),
        n.onScroll != null && F('scroll', t),
        n.onScrollEnd != null && F('scrollend', t),
        n.onClick != null && (t.onclick = _l),
        (t = !0))
      : (t = !1),
    t || mn(e, !0))
}
function Fo(e) {
  for (We = e.return; We; )
    switch (We.tag) {
      case 5:
      case 31:
      case 13:
        Ht = !1
        return
      case 27:
      case 3:
        Ht = !0
        return
      default:
        We = We.return
    }
}
function Fn(e) {
  if (e !== We) return !1
  if (!ee) return (Fo(e), (ee = !0), !1)
  var t = e.tag,
    l
  if (
    ((l = t !== 3 && t !== 27) &&
      ((l = t === 5) &&
        ((l = e.type), (l = !(l !== 'form' && l !== 'button') || wf(e.type, e.memoizedProps))),
      (l = !l)),
    l && be && mn(e),
    Fo(e),
    t === 13)
  ) {
    if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e)) throw Error(z(317))
    be = Yd(e)
  } else if (t === 31) {
    if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e)) throw Error(z(317))
    be = Yd(e)
  } else
    t === 27
      ? ((t = be), pn(e.type) ? ((e = Lf), (Lf = null), (be = e)) : (be = t))
      : (be = We ? wt(e.stateNode.nextSibling) : null)
  return !0
}
function wn() {
  ;((be = We = null), (ee = !1))
}
function bc() {
  var e = an
  return (e !== null && (it === null ? (it = e) : it.push.apply(it, e), (an = null)), e)
}
function Mu(e) {
  an === null ? (an = [e]) : an.push(e)
}
var yf = il(null),
  Qn = null,
  Ml = null
function Wl(e, t, l) {
  ;(he(yf, t._currentValue), (t._currentValue = l))
}
function zl(e) {
  ;((e._currentValue = yf.current), ke(yf))
}
function mf(e, t, l) {
  for (; e !== null; ) {
    var n = e.alternate
    if (
      ((e.childLanes & t) !== t
        ? ((e.childLanes |= t), n !== null && (n.childLanes |= t))
        : n !== null && (n.childLanes & t) !== t && (n.childLanes |= t),
      e === l)
    )
      break
    e = e.return
  }
}
function hf(e, t, l, n) {
  var a = e.child
  for (a !== null && (a.return = e); a !== null; ) {
    var u = a.dependencies
    if (u !== null) {
      var i = a.child
      u = u.firstContext
      e: for (; u !== null; ) {
        var r = u
        u = a
        for (var c = 0; c < t.length; c++)
          if (r.context === t[c]) {
            ;((u.lanes |= l),
              (r = u.alternate),
              r !== null && (r.lanes |= l),
              mf(u.return, l, e),
              n || (i = null))
            break e
          }
        u = r.next
      }
    } else if (a.tag === 18) {
      if (((i = a.return), i === null)) throw Error(z(341))
      ;((i.lanes |= l), (u = i.alternate), u !== null && (u.lanes |= l), mf(i, l, e), (i = null))
    } else i = a.child
    if (i !== null) i.return = a
    else
      for (i = a; i !== null; ) {
        if (i === e) {
          i = null
          break
        }
        if (((a = i.sibling), a !== null)) {
          ;((a.return = i.return), (i = a))
          break
        }
        i = i.return
      }
    a = i
  }
}
function qa(e, t, l, n) {
  e = null
  for (var a = t, u = !1; a !== null; ) {
    if (!u) {
      if (a.flags & 524288) u = !0
      else if (a.flags & 262144) break
    }
    if (a.tag === 10) {
      var i = a.alternate
      if (i === null) throw Error(z(387))
      if (((i = i.memoizedProps), i !== null)) {
        var r = a.type
        Mt(a.pendingProps.value, i.value) || (e !== null ? e.push(r) : (e = [r]))
      }
    } else if (a === wi.current) {
      if (((i = a.alternate), i === null)) throw Error(z(387))
      i.memoizedState.memoizedState !== a.memoizedState.memoizedState &&
        (e !== null ? e.push(xu) : (e = [xu]))
    }
    a = a.return
  }
  ;(e !== null && hf(t, e, l, n), (t.flags |= 262144))
}
function Zi(e) {
  for (e = e.firstContext; e !== null; ) {
    if (!Mt(e.context._currentValue, e.memoizedValue)) return !0
    e = e.next
  }
  return !1
}
function Vn(e) {
  ;((Qn = e), (Ml = null), (e = e.dependencies), e !== null && (e.firstContext = null))
}
function Je(e) {
  return Hm(Qn, e)
}
function ai(e, t) {
  return (Qn === null && Vn(e), Hm(e, t))
}
function Hm(e, t) {
  var l = t._currentValue
  if (((t = { context: t, memoizedValue: l, next: null }), Ml === null)) {
    if (e === null) throw Error(z(308))
    ;((Ml = t), (e.dependencies = { lanes: 0, firstContext: t }), (e.flags |= 524288))
  } else Ml = Ml.next = t
  return l
}
var Pb =
    typeof AbortController < 'u'
      ? AbortController
      : function () {
          var e = [],
            t = (this.signal = {
              aborted: !1,
              addEventListener: function (l, n) {
                e.push(n)
              },
            })
          this.abort = function () {
            ;((t.aborted = !0),
              e.forEach(function (l) {
                return l()
              }))
          }
        },
  e1 = Le.unstable_scheduleCallback,
  t1 = Le.unstable_NormalPriority,
  He = {
    $$typeof: Ol,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0,
  }
function Ms() {
  return { controller: new Pb(), data: new Map(), refCount: 0 }
}
function Lu(e) {
  ;(e.refCount--,
    e.refCount === 0 &&
      e1(t1, function () {
        e.controller.abort()
      }))
}
var cu = null,
  vf = 0,
  za = 0,
  Ea = null
function l1(e, t) {
  if (cu === null) {
    var l = (cu = [])
    ;((vf = 0),
      (za = Fs()),
      (Ea = {
        status: 'pending',
        value: void 0,
        then: function (n) {
          l.push(n)
        },
      }))
  }
  return (vf++, t.then($o, $o), t)
}
function $o() {
  if (--vf === 0 && cu !== null) {
    Ea !== null && (Ea.status = 'fulfilled')
    var e = cu
    ;((cu = null), (za = 0), (Ea = null))
    for (var t = 0; t < e.length; t++) (0, e[t])()
  }
}
function n1(e, t) {
  var l = [],
    n = {
      status: 'pending',
      value: null,
      reason: null,
      then: function (a) {
        l.push(a)
      },
    }
  return (
    e.then(
      function () {
        ;((n.status = 'fulfilled'), (n.value = t))
        for (var a = 0; a < l.length; a++) (0, l[a])(t)
      },
      function (a) {
        for (n.status = 'rejected', n.reason = a, a = 0; a < l.length; a++) (0, l[a])(void 0)
      },
    ),
    n
  )
}
var Io = L.S
L.S = function (e, t) {
  ;((Jh = Et()),
    typeof t == 'object' && t !== null && typeof t.then == 'function' && l1(e, t),
    Io !== null && Io(e, t))
}
var Un = il(null)
function As() {
  var e = Un.current
  return e !== null ? e : se.pooledCache
}
function _i(e, t) {
  t === null ? he(Un, Un.current) : he(Un, t.pool)
}
function Ym() {
  var e = As()
  return e === null ? null : { parent: He._currentValue, pool: e }
}
var La = Error(z(460)),
  Ts = Error(z(474)),
  Cr = Error(z(542)),
  Qi = { then: function () {} }
function Po(e) {
  return ((e = e.status), e === 'fulfilled' || e === 'rejected')
}
function wm(e, t, l) {
  switch (((l = e[l]), l === void 0 ? e.push(t) : l !== t && (t.then(_l, _l), (t = l)), t.status)) {
    case 'fulfilled':
      return t.value
    case 'rejected':
      throw ((e = t.reason), td(e), e)
    default:
      if (typeof t.status == 'string') t.then(_l, _l)
      else {
        if (((e = se), e !== null && 100 < e.shellSuspendCounter)) throw Error(z(482))
        ;((e = t),
          (e.status = 'pending'),
          e.then(
            function (n) {
              if (t.status === 'pending') {
                var a = t
                ;((a.status = 'fulfilled'), (a.value = n))
              }
            },
            function (n) {
              if (t.status === 'pending') {
                var a = t
                ;((a.status = 'rejected'), (a.reason = n))
              }
            },
          ))
      }
      switch (t.status) {
        case 'fulfilled':
          return t.value
        case 'rejected':
          throw ((e = t.reason), td(e), e)
      }
      throw ((Bn = t), La)
  }
}
function Tn(e) {
  try {
    var t = e._init
    return t(e._payload)
  } catch (l) {
    throw l !== null && typeof l == 'object' && typeof l.then == 'function' ? ((Bn = l), La) : l
  }
}
var Bn = null
function ed() {
  if (Bn === null) throw Error(z(459))
  var e = Bn
  return ((Bn = null), e)
}
function td(e) {
  if (e === La || e === Cr) throw Error(z(483))
}
var Da = null,
  Au = 0
function ui(e) {
  var t = Au
  return ((Au += 1), Da === null && (Da = []), wm(Da, e, t))
}
function Wa(e, t) {
  ;((t = t.props.ref), (e.ref = t !== void 0 ? t : null))
}
function ii(e, t) {
  throw t.$$typeof === X0
    ? Error(z(525))
    : ((e = Object.prototype.toString.call(t)),
      Error(
        z(31, e === '[object Object]' ? 'object with keys {' + Object.keys(t).join(', ') + '}' : e),
      ))
}
function Vm(e) {
  function t(h, s) {
    if (e) {
      var m = h.deletions
      m === null ? ((h.deletions = [s]), (h.flags |= 16)) : m.push(s)
    }
  }
  function l(h, s) {
    if (!e) return null
    for (; s !== null; ) (t(h, s), (s = s.sibling))
    return null
  }
  function n(h) {
    for (var s = new Map(); h !== null; )
      (h.key !== null ? s.set(h.key, h) : s.set(h.index, h), (h = h.sibling))
    return s
  }
  function a(h, s) {
    return ((h = Cl(h, s)), (h.index = 0), (h.sibling = null), h)
  }
  function u(h, s, m) {
    return (
      (h.index = m),
      e
        ? ((m = h.alternate),
          m !== null
            ? ((m = m.index), m < s ? ((h.flags |= 67108866), s) : m)
            : ((h.flags |= 67108866), s))
        : ((h.flags |= 1048576), s)
    )
  }
  function i(h) {
    return (e && h.alternate === null && (h.flags |= 67108866), h)
  }
  function r(h, s, m, b) {
    return s === null || s.tag !== 6
      ? ((s = vc(m, h.mode, b)), (s.return = h), s)
      : ((s = a(s, m)), (s.return = h), s)
  }
  function c(h, s, m, b) {
    var S = m.type
    return S === ia
      ? d(h, s, m.props.children, b, m.key)
      : s !== null &&
          (s.elementType === S ||
            (typeof S == 'object' && S !== null && S.$$typeof === Ql && Tn(S) === s.type))
        ? ((s = a(s, m.props)), Wa(s, m), (s.return = h), s)
        : ((s = Oi(m.type, m.key, m.props, null, h.mode, b)), Wa(s, m), (s.return = h), s)
  }
  function f(h, s, m, b) {
    return s === null ||
      s.tag !== 4 ||
      s.stateNode.containerInfo !== m.containerInfo ||
      s.stateNode.implementation !== m.implementation
      ? ((s = gc(m, h.mode, b)), (s.return = h), s)
      : ((s = a(s, m.children || [])), (s.return = h), s)
  }
  function d(h, s, m, b, S) {
    return s === null || s.tag !== 7
      ? ((s = Rn(m, h.mode, b, S)), (s.return = h), s)
      : ((s = a(s, m)), (s.return = h), s)
  }
  function y(h, s, m) {
    if ((typeof s == 'string' && s !== '') || typeof s == 'number' || typeof s == 'bigint')
      return ((s = vc('' + s, h.mode, m)), (s.return = h), s)
    if (typeof s == 'object' && s !== null) {
      switch (s.$$typeof) {
        case Iu:
          return ((m = Oi(s.type, s.key, s.props, null, h.mode, m)), Wa(m, s), (m.return = h), m)
        case Pa:
          return ((s = gc(s, h.mode, m)), (s.return = h), s)
        case Ql:
          return ((s = Tn(s)), y(h, s, m))
      }
      if (eu(s) || Za(s)) return ((s = Rn(s, h.mode, m, null)), (s.return = h), s)
      if (typeof s.then == 'function') return y(h, ui(s), m)
      if (s.$$typeof === Ol) return y(h, ai(h, s), m)
      ii(h, s)
    }
    return null
  }
  function o(h, s, m, b) {
    var S = s !== null ? s.key : null
    if ((typeof m == 'string' && m !== '') || typeof m == 'number' || typeof m == 'bigint')
      return S !== null ? null : r(h, s, '' + m, b)
    if (typeof m == 'object' && m !== null) {
      switch (m.$$typeof) {
        case Iu:
          return m.key === S ? c(h, s, m, b) : null
        case Pa:
          return m.key === S ? f(h, s, m, b) : null
        case Ql:
          return ((m = Tn(m)), o(h, s, m, b))
      }
      if (eu(m) || Za(m)) return S !== null ? null : d(h, s, m, b, null)
      if (typeof m.then == 'function') return o(h, s, ui(m), b)
      if (m.$$typeof === Ol) return o(h, s, ai(h, m), b)
      ii(h, m)
    }
    return null
  }
  function v(h, s, m, b, S) {
    if ((typeof b == 'string' && b !== '') || typeof b == 'number' || typeof b == 'bigint')
      return ((h = h.get(m) || null), r(s, h, '' + b, S))
    if (typeof b == 'object' && b !== null) {
      switch (b.$$typeof) {
        case Iu:
          return ((h = h.get(b.key === null ? m : b.key) || null), c(s, h, b, S))
        case Pa:
          return ((h = h.get(b.key === null ? m : b.key) || null), f(s, h, b, S))
        case Ql:
          return ((b = Tn(b)), v(h, s, m, b, S))
      }
      if (eu(b) || Za(b)) return ((h = h.get(m) || null), d(s, h, b, S, null))
      if (typeof b.then == 'function') return v(h, s, m, ui(b), S)
      if (b.$$typeof === Ol) return v(h, s, m, ai(s, b), S)
      ii(s, b)
    }
    return null
  }
  function _(h, s, m, b) {
    for (var S = null, x = null, M = s, R = (s = 0), H = null; M !== null && R < m.length; R++) {
      M.index > R ? ((H = M), (M = null)) : (H = M.sibling)
      var w = o(h, M, m[R], b)
      if (w === null) {
        M === null && (M = H)
        break
      }
      ;(e && M && w.alternate === null && t(h, M),
        (s = u(w, s, R)),
        x === null ? (S = w) : (x.sibling = w),
        (x = w),
        (M = H))
    }
    if (R === m.length) return (l(h, M), ee && Sl(h, R), S)
    if (M === null) {
      for (; R < m.length; R++)
        ((M = y(h, m[R], b)),
          M !== null && ((s = u(M, s, R)), x === null ? (S = M) : (x.sibling = M), (x = M)))
      return (ee && Sl(h, R), S)
    }
    for (M = n(M); R < m.length; R++)
      ((H = v(M, h, R, m[R], b)),
        H !== null &&
          (e && H.alternate !== null && M.delete(H.key === null ? R : H.key),
          (s = u(H, s, R)),
          x === null ? (S = H) : (x.sibling = H),
          (x = H)))
    return (
      e &&
        M.forEach(function (J) {
          return t(h, J)
        }),
      ee && Sl(h, R),
      S
    )
  }
  function p(h, s, m, b) {
    if (m == null) throw Error(z(151))
    for (
      var S = null, x = null, M = s, R = (s = 0), H = null, w = m.next();
      M !== null && !w.done;
      R++, w = m.next()
    ) {
      M.index > R ? ((H = M), (M = null)) : (H = M.sibling)
      var J = o(h, M, w.value, b)
      if (J === null) {
        M === null && (M = H)
        break
      }
      ;(e && M && J.alternate === null && t(h, M),
        (s = u(J, s, R)),
        x === null ? (S = J) : (x.sibling = J),
        (x = J),
        (M = H))
    }
    if (w.done) return (l(h, M), ee && Sl(h, R), S)
    if (M === null) {
      for (; !w.done; R++, w = m.next())
        ((w = y(h, w.value, b)),
          w !== null && ((s = u(w, s, R)), x === null ? (S = w) : (x.sibling = w), (x = w)))
      return (ee && Sl(h, R), S)
    }
    for (M = n(M); !w.done; R++, w = m.next())
      ((w = v(M, h, R, w.value, b)),
        w !== null &&
          (e && w.alternate !== null && M.delete(w.key === null ? R : w.key),
          (s = u(w, s, R)),
          x === null ? (S = w) : (x.sibling = w),
          (x = w)))
    return (
      e &&
        M.forEach(function (j) {
          return t(h, j)
        }),
      ee && Sl(h, R),
      S
    )
  }
  function A(h, s, m, b) {
    if (
      (typeof m == 'object' &&
        m !== null &&
        m.type === ia &&
        m.key === null &&
        (m = m.props.children),
      typeof m == 'object' && m !== null)
    ) {
      switch (m.$$typeof) {
        case Iu:
          e: {
            for (var S = m.key; s !== null; ) {
              if (s.key === S) {
                if (((S = m.type), S === ia)) {
                  if (s.tag === 7) {
                    ;(l(h, s.sibling), (b = a(s, m.props.children)), (b.return = h), (h = b))
                    break e
                  }
                } else if (
                  s.elementType === S ||
                  (typeof S == 'object' && S !== null && S.$$typeof === Ql && Tn(S) === s.type)
                ) {
                  ;(l(h, s.sibling), (b = a(s, m.props)), Wa(b, m), (b.return = h), (h = b))
                  break e
                }
                l(h, s)
                break
              } else t(h, s)
              s = s.sibling
            }
            m.type === ia
              ? ((b = Rn(m.props.children, h.mode, b, m.key)), (b.return = h), (h = b))
              : ((b = Oi(m.type, m.key, m.props, null, h.mode, b)),
                Wa(b, m),
                (b.return = h),
                (h = b))
          }
          return i(h)
        case Pa:
          e: {
            for (S = m.key; s !== null; ) {
              if (s.key === S)
                if (
                  s.tag === 4 &&
                  s.stateNode.containerInfo === m.containerInfo &&
                  s.stateNode.implementation === m.implementation
                ) {
                  ;(l(h, s.sibling), (b = a(s, m.children || [])), (b.return = h), (h = b))
                  break e
                } else {
                  l(h, s)
                  break
                }
              else t(h, s)
              s = s.sibling
            }
            ;((b = gc(m, h.mode, b)), (b.return = h), (h = b))
          }
          return i(h)
        case Ql:
          return ((m = Tn(m)), A(h, s, m, b))
      }
      if (eu(m)) return _(h, s, m, b)
      if (Za(m)) {
        if (((S = Za(m)), typeof S != 'function')) throw Error(z(150))
        return ((m = S.call(m)), p(h, s, m, b))
      }
      if (typeof m.then == 'function') return A(h, s, ui(m), b)
      if (m.$$typeof === Ol) return A(h, s, ai(h, m), b)
      ii(h, m)
    }
    return (typeof m == 'string' && m !== '') || typeof m == 'number' || typeof m == 'bigint'
      ? ((m = '' + m),
        s !== null && s.tag === 6
          ? (l(h, s.sibling), (b = a(s, m)), (b.return = h), (h = b))
          : (l(h, s), (b = vc(m, h.mode, b)), (b.return = h), (h = b)),
        i(h))
      : l(h, s)
  }
  return function (h, s, m, b) {
    try {
      Au = 0
      var S = A(h, s, m, b)
      return ((Da = null), S)
    } catch (M) {
      if (M === La || M === Cr) throw M
      var x = bt(29, M, null, h.mode)
      return ((x.lanes = b), (x.return = h), x)
    } finally {
    }
  }
}
var jn = Vm(!0),
  jm = Vm(!1),
  Kl = !1
function Cs(e) {
  e.updateQueue = {
    baseState: e.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: { pending: null, lanes: 0, hiddenCallbacks: null },
    callbacks: null,
  }
}
function gf(e, t) {
  ;((e = e.updateQueue),
    t.updateQueue === e &&
      (t.updateQueue = {
        baseState: e.baseState,
        firstBaseUpdate: e.firstBaseUpdate,
        lastBaseUpdate: e.lastBaseUpdate,
        shared: e.shared,
        callbacks: null,
      }))
}
function un(e) {
  return { lane: e, tag: 0, payload: null, callback: null, next: null }
}
function rn(e, t, l) {
  var n = e.updateQueue
  if (n === null) return null
  if (((n = n.shared), ne & 2)) {
    var a = n.pending
    return (
      a === null ? (t.next = t) : ((t.next = a.next), (a.next = t)),
      (n.pending = t),
      (t = Xi(e)),
      Nm(e, null, l),
      t
    )
  }
  return (Tr(e, n, t, l), Xi(e))
}
function fu(e, t, l) {
  if (((t = t.updateQueue), t !== null && ((t = t.shared), (l & 4194048) !== 0))) {
    var n = t.lanes
    ;((n &= e.pendingLanes), (l |= n), (t.lanes = l), nm(e, l))
  }
}
function pc(e, t) {
  var l = e.updateQueue,
    n = e.alternate
  if (n !== null && ((n = n.updateQueue), l === n)) {
    var a = null,
      u = null
    if (((l = l.firstBaseUpdate), l !== null)) {
      do {
        var i = { lane: l.lane, tag: l.tag, payload: l.payload, callback: null, next: null }
        ;(u === null ? (a = u = i) : (u = u.next = i), (l = l.next))
      } while (l !== null)
      u === null ? (a = u = t) : (u = u.next = t)
    } else a = u = t
    ;((l = {
      baseState: n.baseState,
      firstBaseUpdate: a,
      lastBaseUpdate: u,
      shared: n.shared,
      callbacks: n.callbacks,
    }),
      (e.updateQueue = l))
    return
  }
  ;((e = l.lastBaseUpdate),
    e === null ? (l.firstBaseUpdate = t) : (e.next = t),
    (l.lastBaseUpdate = t))
}
var bf = !1
function su() {
  if (bf) {
    var e = Ea
    if (e !== null) throw e
  }
}
function ou(e, t, l, n) {
  bf = !1
  var a = e.updateQueue
  Kl = !1
  var u = a.firstBaseUpdate,
    i = a.lastBaseUpdate,
    r = a.shared.pending
  if (r !== null) {
    a.shared.pending = null
    var c = r,
      f = c.next
    ;((c.next = null), i === null ? (u = f) : (i.next = f), (i = c))
    var d = e.alternate
    d !== null &&
      ((d = d.updateQueue),
      (r = d.lastBaseUpdate),
      r !== i && (r === null ? (d.firstBaseUpdate = f) : (r.next = f), (d.lastBaseUpdate = c)))
  }
  if (u !== null) {
    var y = a.baseState
    ;((i = 0), (d = f = c = null), (r = u))
    do {
      var o = r.lane & -536870913,
        v = o !== r.lane
      if (v ? (I & o) === o : (n & o) === o) {
        ;(o !== 0 && o === za && (bf = !0),
          d !== null &&
            (d = d.next = { lane: 0, tag: r.tag, payload: r.payload, callback: null, next: null }))
        e: {
          var _ = e,
            p = r
          o = t
          var A = l
          switch (p.tag) {
            case 1:
              if (((_ = p.payload), typeof _ == 'function')) {
                y = _.call(A, y, o)
                break e
              }
              y = _
              break e
            case 3:
              _.flags = (_.flags & -65537) | 128
            case 0:
              if (((_ = p.payload), (o = typeof _ == 'function' ? _.call(A, y, o) : _), o == null))
                break e
              y = Se({}, y, o)
              break e
            case 2:
              Kl = !0
          }
        }
        ;((o = r.callback),
          o !== null &&
            ((e.flags |= 64),
            v && (e.flags |= 8192),
            (v = a.callbacks),
            v === null ? (a.callbacks = [o]) : v.push(o)))
      } else
        ((v = { lane: o, tag: r.tag, payload: r.payload, callback: r.callback, next: null }),
          d === null ? ((f = d = v), (c = y)) : (d = d.next = v),
          (i |= o))
      if (((r = r.next), r === null)) {
        if (((r = a.shared.pending), r === null)) break
        ;((v = r), (r = v.next), (v.next = null), (a.lastBaseUpdate = v), (a.shared.pending = null))
      }
    } while (!0)
    ;(d === null && (c = y),
      (a.baseState = c),
      (a.firstBaseUpdate = f),
      (a.lastBaseUpdate = d),
      u === null && (a.shared.lanes = 0),
      (vn |= i),
      (e.lanes = i),
      (e.memoizedState = y))
  }
}
function qm(e, t) {
  if (typeof e != 'function') throw Error(z(191, e))
  e.call(t)
}
function Lm(e, t) {
  var l = e.callbacks
  if (l !== null) for (e.callbacks = null, e = 0; e < l.length; e++) qm(l[e], t)
}
var Na = il(null),
  Ki = il(0)
function ld(e, t) {
  ;((e = Yl), he(Ki, e), he(Na, t), (Yl = e | t.baseLanes))
}
function pf() {
  ;(he(Ki, Yl), he(Na, Na.current))
}
function zs() {
  ;((Yl = Ki.current), ke(Na), ke(Ki))
}
var At = il(null),
  Yt = null
function Jl(e) {
  var t = e.alternate
  ;(he(ze, ze.current & 1),
    he(At, e),
    Yt === null && (t === null || Na.current !== null || t.memoizedState !== null) && (Yt = e))
}
function Sf(e) {
  ;(he(ze, ze.current), he(At, e), Yt === null && (Yt = e))
}
function Gm(e) {
  e.tag === 22 ? (he(ze, ze.current), he(At, e), Yt === null && (Yt = e)) : Fl()
}
function Fl() {
  ;(he(ze, ze.current), he(At, At.current))
}
function gt(e) {
  ;(ke(At), Yt === e && (Yt = null), ke(ze))
}
var ze = il(0)
function Wi(e) {
  for (var t = e; t !== null; ) {
    if (t.tag === 13) {
      var l = t.memoizedState
      if (l !== null && ((l = l.dehydrated), l === null || jf(l) || qf(l))) return t
    } else if (
      t.tag === 19 &&
      (t.memoizedProps.revealOrder === 'forwards' ||
        t.memoizedProps.revealOrder === 'backwards' ||
        t.memoizedProps.revealOrder === 'unstable_legacy-backwards' ||
        t.memoizedProps.revealOrder === 'together')
    ) {
      if (t.flags & 128) return t
    } else if (t.child !== null) {
      ;((t.child.return = t), (t = t.child))
      continue
    }
    if (t === e) break
    for (; t.sibling === null; ) {
      if (t.return === null || t.return === e) return null
      t = t.return
    }
    ;((t.sibling.return = t.return), (t = t.sibling))
  }
  return null
}
var Ul = 0,
  K = null,
  ce = null,
  Ue = null,
  Ji = !1,
  Oa = !1,
  qn = !1,
  Fi = 0,
  Tu = 0,
  _a = null,
  a1 = 0
function _e() {
  throw Error(z(321))
}
function Ns(e, t) {
  if (t === null) return !1
  for (var l = 0; l < t.length && l < e.length; l++) if (!Mt(e[l], t[l])) return !1
  return !0
}
function xs(e, t, l, n, a, u) {
  return (
    (Ul = u),
    (K = t),
    (t.memoizedState = null),
    (t.updateQueue = null),
    (t.lanes = 0),
    (L.H = e === null || e.memoizedState === null ? ph : Gs),
    (qn = !1),
    (u = l(n, a)),
    (qn = !1),
    Oa && (u = km(t, l, n, a)),
    Xm(e),
    u
  )
}
function Xm(e) {
  L.H = Cu
  var t = ce !== null && ce.next !== null
  if (((Ul = 0), (Ue = ce = K = null), (Ji = !1), (Tu = 0), (_a = null), t)) throw Error(z(300))
  e === null || Ye || ((e = e.dependencies), e !== null && Zi(e) && (Ye = !0))
}
function km(e, t, l, n) {
  K = e
  var a = 0
  do {
    if ((Oa && (_a = null), (Tu = 0), (Oa = !1), 25 <= a)) throw Error(z(301))
    if (((a += 1), (Ue = ce = null), e.updateQueue != null)) {
      var u = e.updateQueue
      ;((u.lastEffect = null),
        (u.events = null),
        (u.stores = null),
        u.memoCache != null && (u.memoCache.index = 0))
    }
    ;((L.H = Sh), (u = t(l, n)))
  } while (Oa)
  return u
}
function u1() {
  var e = L.H,
    t = e.useState()[0]
  return (
    (t = typeof t.then == 'function' ? Gu(t) : t),
    (e = e.useState()[0]),
    (ce !== null ? ce.memoizedState : null) !== e && (K.flags |= 1024),
    t
  )
}
function Rs() {
  var e = Fi !== 0
  return ((Fi = 0), e)
}
function Us(e, t, l) {
  ;((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~l))
}
function Bs(e) {
  if (Ji) {
    for (e = e.memoizedState; e !== null; ) {
      var t = e.queue
      ;(t !== null && (t.pending = null), (e = e.next))
    }
    Ji = !1
  }
  ;((Ul = 0), (Ue = ce = K = null), (Oa = !1), (Tu = Fi = 0), (_a = null))
}
function Ie() {
  var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null }
  return (Ue === null ? (K.memoizedState = Ue = e) : (Ue = Ue.next = e), Ue)
}
function Ne() {
  if (ce === null) {
    var e = K.alternate
    e = e !== null ? e.memoizedState : null
  } else e = ce.next
  var t = Ue === null ? K.memoizedState : Ue.next
  if (t !== null) ((Ue = t), (ce = e))
  else {
    if (e === null) throw K.alternate === null ? Error(z(467)) : Error(z(310))
    ;((ce = e),
      (e = {
        memoizedState: ce.memoizedState,
        baseState: ce.baseState,
        baseQueue: ce.baseQueue,
        queue: ce.queue,
        next: null,
      }),
      Ue === null ? (K.memoizedState = Ue = e) : (Ue = Ue.next = e))
  }
  return Ue
}
function zr() {
  return { lastEffect: null, events: null, stores: null, memoCache: null }
}
function Gu(e) {
  var t = Tu
  return (
    (Tu += 1),
    _a === null && (_a = []),
    (e = wm(_a, e, t)),
    (t = K),
    (Ue === null ? t.memoizedState : Ue.next) === null &&
      ((t = t.alternate), (L.H = t === null || t.memoizedState === null ? ph : Gs)),
    e
  )
}
function Nr(e) {
  if (e !== null && typeof e == 'object') {
    if (typeof e.then == 'function') return Gu(e)
    if (e.$$typeof === Ol) return Je(e)
  }
  throw Error(z(438, String(e)))
}
function Hs(e) {
  var t = null,
    l = K.updateQueue
  if ((l !== null && (t = l.memoCache), t == null)) {
    var n = K.alternate
    n !== null &&
      ((n = n.updateQueue),
      n !== null &&
        ((n = n.memoCache),
        n != null &&
          (t = {
            data: n.data.map(function (a) {
              return a.slice()
            }),
            index: 0,
          })))
  }
  if (
    (t == null && (t = { data: [], index: 0 }),
    l === null && ((l = zr()), (K.updateQueue = l)),
    (l.memoCache = t),
    (l = t.data[t.index]),
    l === void 0)
  )
    for (l = t.data[t.index] = Array(e), n = 0; n < e; n++) l[n] = k0
  return (t.index++, l)
}
function Bl(e, t) {
  return typeof t == 'function' ? t(e) : t
}
function Mi(e) {
  var t = Ne()
  return Ys(t, ce, e)
}
function Ys(e, t, l) {
  var n = e.queue
  if (n === null) throw Error(z(311))
  n.lastRenderedReducer = l
  var a = e.baseQueue,
    u = n.pending
  if (u !== null) {
    if (a !== null) {
      var i = a.next
      ;((a.next = u.next), (u.next = i))
    }
    ;((t.baseQueue = a = u), (n.pending = null))
  }
  if (((u = e.baseState), a === null)) e.memoizedState = u
  else {
    t = a.next
    var r = (i = null),
      c = null,
      f = t,
      d = !1
    do {
      var y = f.lane & -536870913
      if (y !== f.lane ? (I & y) === y : (Ul & y) === y) {
        var o = f.revertLane
        if (o === 0)
          (c !== null &&
            (c = c.next =
              {
                lane: 0,
                revertLane: 0,
                gesture: null,
                action: f.action,
                hasEagerState: f.hasEagerState,
                eagerState: f.eagerState,
                next: null,
              }),
            y === za && (d = !0))
        else if ((Ul & o) === o) {
          ;((f = f.next), o === za && (d = !0))
          continue
        } else
          ((y = {
            lane: 0,
            revertLane: f.revertLane,
            gesture: null,
            action: f.action,
            hasEagerState: f.hasEagerState,
            eagerState: f.eagerState,
            next: null,
          }),
            c === null ? ((r = c = y), (i = u)) : (c = c.next = y),
            (K.lanes |= o),
            (vn |= o))
        ;((y = f.action), qn && l(u, y), (u = f.hasEagerState ? f.eagerState : l(u, y)))
      } else
        ((o = {
          lane: y,
          revertLane: f.revertLane,
          gesture: f.gesture,
          action: f.action,
          hasEagerState: f.hasEagerState,
          eagerState: f.eagerState,
          next: null,
        }),
          c === null ? ((r = c = o), (i = u)) : (c = c.next = o),
          (K.lanes |= y),
          (vn |= y))
      f = f.next
    } while (f !== null && f !== t)
    if (
      (c === null ? (i = u) : (c.next = r),
      !Mt(u, e.memoizedState) && ((Ye = !0), d && ((l = Ea), l !== null)))
    )
      throw l
    ;((e.memoizedState = u), (e.baseState = i), (e.baseQueue = c), (n.lastRenderedState = u))
  }
  return (a === null && (n.lanes = 0), [e.memoizedState, n.dispatch])
}
function Sc(e) {
  var t = Ne(),
    l = t.queue
  if (l === null) throw Error(z(311))
  l.lastRenderedReducer = e
  var n = l.dispatch,
    a = l.pending,
    u = t.memoizedState
  if (a !== null) {
    l.pending = null
    var i = (a = a.next)
    do ((u = e(u, i.action)), (i = i.next))
    while (i !== a)
    ;(Mt(u, t.memoizedState) || (Ye = !0),
      (t.memoizedState = u),
      t.baseQueue === null && (t.baseState = u),
      (l.lastRenderedState = u))
  }
  return [u, n]
}
function Zm(e, t, l) {
  var n = K,
    a = Ne(),
    u = ee
  if (u) {
    if (l === void 0) throw Error(z(407))
    l = l()
  } else l = t()
  var i = !Mt((ce || a).memoizedState, l)
  if (
    (i && ((a.memoizedState = l), (Ye = !0)),
    (a = a.queue),
    ws(Wm.bind(null, n, a, e), [e]),
    a.getSnapshot !== t || i || (Ue !== null && Ue.memoizedState.tag & 1))
  ) {
    if (
      ((n.flags |= 2048), xa(9, { destroy: void 0 }, Km.bind(null, n, a, l, t), null), se === null)
    )
      throw Error(z(349))
    u || Ul & 127 || Qm(n, t, l)
  }
  return l
}
function Qm(e, t, l) {
  ;((e.flags |= 16384),
    (e = { getSnapshot: t, value: l }),
    (t = K.updateQueue),
    t === null
      ? ((t = zr()), (K.updateQueue = t), (t.stores = [e]))
      : ((l = t.stores), l === null ? (t.stores = [e]) : l.push(e)))
}
function Km(e, t, l, n) {
  ;((t.value = l), (t.getSnapshot = n), Jm(t) && Fm(e))
}
function Wm(e, t, l) {
  return l(function () {
    Jm(t) && Fm(e)
  })
}
function Jm(e) {
  var t = e.getSnapshot
  e = e.value
  try {
    var l = t()
    return !Mt(e, l)
  } catch {
    return !0
  }
}
function Fm(e) {
  var t = Zn(e, 2)
  t !== null && ct(t, e, 2)
}
function Ef(e) {
  var t = Ie()
  if (typeof e == 'function') {
    var l = e
    if (((e = l()), qn)) {
      Il(!0)
      try {
        l()
      } finally {
        Il(!1)
      }
    }
  }
  return (
    (t.memoizedState = t.baseState = e),
    (t.queue = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: Bl,
      lastRenderedState: e,
    }),
    t
  )
}
function $m(e, t, l, n) {
  return ((e.baseState = l), Ys(e, ce, typeof n == 'function' ? n : Bl))
}
function i1(e, t, l, n, a) {
  if (Rr(e)) throw Error(z(485))
  if (((e = t.action), e !== null)) {
    var u = {
      payload: a,
      action: e,
      next: null,
      isTransition: !0,
      status: 'pending',
      value: null,
      reason: null,
      listeners: [],
      then: function (i) {
        u.listeners.push(i)
      },
    }
    ;(L.T !== null ? l(!0) : (u.isTransition = !1),
      n(u),
      (l = t.pending),
      l === null
        ? ((u.next = t.pending = u), Im(t, u))
        : ((u.next = l.next), (t.pending = l.next = u)))
  }
}
function Im(e, t) {
  var l = t.action,
    n = t.payload,
    a = e.state
  if (t.isTransition) {
    var u = L.T,
      i = {}
    L.T = i
    try {
      var r = l(a, n),
        c = L.S
      ;(c !== null && c(i, r), nd(e, t, r))
    } catch (f) {
      Df(e, t, f)
    } finally {
      ;(u !== null && i.types !== null && (u.types = i.types), (L.T = u))
    }
  } else
    try {
      ;((u = l(a, n)), nd(e, t, u))
    } catch (f) {
      Df(e, t, f)
    }
}
function nd(e, t, l) {
  l !== null && typeof l == 'object' && typeof l.then == 'function'
    ? l.then(
        function (n) {
          ad(e, t, n)
        },
        function (n) {
          return Df(e, t, n)
        },
      )
    : ad(e, t, l)
}
function ad(e, t, l) {
  ;((t.status = 'fulfilled'),
    (t.value = l),
    Pm(t),
    (e.state = l),
    (t = e.pending),
    t !== null &&
      ((l = t.next), l === t ? (e.pending = null) : ((l = l.next), (t.next = l), Im(e, l))))
}
function Df(e, t, l) {
  var n = e.pending
  if (((e.pending = null), n !== null)) {
    n = n.next
    do ((t.status = 'rejected'), (t.reason = l), Pm(t), (t = t.next))
    while (t !== n)
  }
  e.action = null
}
function Pm(e) {
  e = e.listeners
  for (var t = 0; t < e.length; t++) (0, e[t])()
}
function eh(e, t) {
  return t
}
function ud(e, t) {
  if (ee) {
    var l = se.formState
    if (l !== null) {
      e: {
        var n = K
        if (ee) {
          if (be) {
            t: {
              for (var a = be, u = Ht; a.nodeType !== 8; ) {
                if (!u) {
                  a = null
                  break t
                }
                if (((a = wt(a.nextSibling)), a === null)) {
                  a = null
                  break t
                }
              }
              ;((u = a.data), (a = u === 'F!' || u === 'F' ? a : null))
            }
            if (a) {
              ;((be = wt(a.nextSibling)), (n = a.data === 'F!'))
              break e
            }
          }
          mn(n)
        }
        n = !1
      }
      n && (t = l[0])
    }
  }
  return (
    (l = Ie()),
    (l.memoizedState = l.baseState = t),
    (n = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: eh,
      lastRenderedState: t,
    }),
    (l.queue = n),
    (l = vh.bind(null, K, n)),
    (n.dispatch = l),
    (n = Ef(!1)),
    (u = Ls.bind(null, K, !1, n.queue)),
    (n = Ie()),
    (a = { state: t, dispatch: null, action: e, pending: null }),
    (n.queue = a),
    (l = i1.bind(null, K, a, u, l)),
    (a.dispatch = l),
    (n.memoizedState = e),
    [t, l, !1]
  )
}
function id(e) {
  var t = Ne()
  return th(t, ce, e)
}
function th(e, t, l) {
  if (
    ((t = Ys(e, t, eh)[0]),
    (e = Mi(Bl)[0]),
    typeof t == 'object' && t !== null && typeof t.then == 'function')
  )
    try {
      var n = Gu(t)
    } catch (i) {
      throw i === La ? Cr : i
    }
  else n = t
  t = Ne()
  var a = t.queue,
    u = a.dispatch
  return (
    l !== t.memoizedState &&
      ((K.flags |= 2048), xa(9, { destroy: void 0 }, r1.bind(null, a, l), null)),
    [n, u, e]
  )
}
function r1(e, t) {
  e.action = t
}
function rd(e) {
  var t = Ne(),
    l = ce
  if (l !== null) return th(t, l, e)
  ;(Ne(), (t = t.memoizedState), (l = Ne()))
  var n = l.queue.dispatch
  return ((l.memoizedState = e), [t, n, !1])
}
function xa(e, t, l, n) {
  return (
    (e = { tag: e, create: l, deps: n, inst: t, next: null }),
    (t = K.updateQueue),
    t === null && ((t = zr()), (K.updateQueue = t)),
    (l = t.lastEffect),
    l === null
      ? (t.lastEffect = e.next = e)
      : ((n = l.next), (l.next = e), (e.next = n), (t.lastEffect = e)),
    e
  )
}
function lh() {
  return Ne().memoizedState
}
function Ai(e, t, l, n) {
  var a = Ie()
  ;((K.flags |= e), (a.memoizedState = xa(1 | t, { destroy: void 0 }, l, n === void 0 ? null : n)))
}
function xr(e, t, l, n) {
  var a = Ne()
  n = n === void 0 ? null : n
  var u = a.memoizedState.inst
  ce !== null && n !== null && Ns(n, ce.memoizedState.deps)
    ? (a.memoizedState = xa(t, u, l, n))
    : ((K.flags |= e), (a.memoizedState = xa(1 | t, u, l, n)))
}
function cd(e, t) {
  Ai(8390656, 8, e, t)
}
function ws(e, t) {
  xr(2048, 8, e, t)
}
function c1(e) {
  K.flags |= 4
  var t = K.updateQueue
  if (t === null) ((t = zr()), (K.updateQueue = t), (t.events = [e]))
  else {
    var l = t.events
    l === null ? (t.events = [e]) : l.push(e)
  }
}
function nh(e) {
  var t = Ne().memoizedState
  return (
    c1({ ref: t, nextImpl: e }),
    function () {
      if (ne & 2) throw Error(z(440))
      return t.impl.apply(void 0, arguments)
    }
  )
}
function ah(e, t) {
  return xr(4, 2, e, t)
}
function uh(e, t) {
  return xr(4, 4, e, t)
}
function ih(e, t) {
  if (typeof t == 'function') {
    e = e()
    var l = t(e)
    return function () {
      typeof l == 'function' ? l() : t(null)
    }
  }
  if (t != null)
    return (
      (e = e()),
      (t.current = e),
      function () {
        t.current = null
      }
    )
}
function rh(e, t, l) {
  ;((l = l != null ? l.concat([e]) : null), xr(4, 4, ih.bind(null, t, e), l))
}
function Vs() {}
function ch(e, t) {
  var l = Ne()
  t = t === void 0 ? null : t
  var n = l.memoizedState
  return t !== null && Ns(t, n[1]) ? n[0] : ((l.memoizedState = [e, t]), e)
}
function fh(e, t) {
  var l = Ne()
  t = t === void 0 ? null : t
  var n = l.memoizedState
  if (t !== null && Ns(t, n[1])) return n[0]
  if (((n = e()), qn)) {
    Il(!0)
    try {
      e()
    } finally {
      Il(!1)
    }
  }
  return ((l.memoizedState = [n, t]), n)
}
function js(e, t, l) {
  return l === void 0 || (Ul & 1073741824 && !(I & 261930))
    ? (e.memoizedState = t)
    : ((e.memoizedState = l), (e = $h()), (K.lanes |= e), (vn |= e), l)
}
function sh(e, t, l, n) {
  return Mt(l, t)
    ? l
    : Na.current !== null
      ? ((e = js(e, l, n)), Mt(e, t) || (Ye = !0), e)
      : !(Ul & 42) || (Ul & 1073741824 && !(I & 261930))
        ? ((Ye = !0), (e.memoizedState = l))
        : ((e = $h()), (K.lanes |= e), (vn |= e), t)
}
function oh(e, t, l, n, a) {
  var u = ae.p
  ae.p = u !== 0 && 8 > u ? u : 8
  var i = L.T,
    r = {}
  ;((L.T = r), Ls(e, !1, t, l))
  try {
    var c = a(),
      f = L.S
    if (
      (f !== null && f(r, c), c !== null && typeof c == 'object' && typeof c.then == 'function')
    ) {
      var d = n1(c, n)
      du(e, t, d, _t(e))
    } else du(e, t, n, _t(e))
  } catch (y) {
    du(e, t, { then: function () {}, status: 'rejected', reason: y }, _t())
  } finally {
    ;((ae.p = u), i !== null && r.types !== null && (i.types = r.types), (L.T = i))
  }
}
function f1() {}
function Of(e, t, l, n) {
  if (e.tag !== 5) throw Error(z(476))
  var a = dh(e).queue
  oh(
    e,
    a,
    t,
    xn,
    l === null
      ? f1
      : function () {
          return (yh(e), l(n))
        },
  )
}
function dh(e) {
  var t = e.memoizedState
  if (t !== null) return t
  t = {
    memoizedState: xn,
    baseState: xn,
    baseQueue: null,
    queue: {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: Bl,
      lastRenderedState: xn,
    },
    next: null,
  }
  var l = {}
  return (
    (t.next = {
      memoizedState: l,
      baseState: l,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: Bl,
        lastRenderedState: l,
      },
      next: null,
    }),
    (e.memoizedState = t),
    (e = e.alternate),
    e !== null && (e.memoizedState = t),
    t
  )
}
function yh(e) {
  var t = dh(e)
  ;(t.next === null && (t = e.alternate.memoizedState), du(e, t.next.queue, {}, _t()))
}
function qs() {
  return Je(xu)
}
function mh() {
  return Ne().memoizedState
}
function hh() {
  return Ne().memoizedState
}
function s1(e) {
  for (var t = e.return; t !== null; ) {
    switch (t.tag) {
      case 24:
      case 3:
        var l = _t()
        e = un(l)
        var n = rn(t, e, l)
        ;(n !== null && (ct(n, t, l), fu(n, t, l)), (t = { cache: Ms() }), (e.payload = t))
        return
    }
    t = t.return
  }
}
function o1(e, t, l) {
  var n = _t()
  ;((l = {
    lane: n,
    revertLane: 0,
    gesture: null,
    action: l,
    hasEagerState: !1,
    eagerState: null,
    next: null,
  }),
    Rr(e) ? gh(t, l) : ((l = Es(e, t, l, n)), l !== null && (ct(l, e, n), bh(l, t, n))))
}
function vh(e, t, l) {
  var n = _t()
  du(e, t, l, n)
}
function du(e, t, l, n) {
  var a = {
    lane: n,
    revertLane: 0,
    gesture: null,
    action: l,
    hasEagerState: !1,
    eagerState: null,
    next: null,
  }
  if (Rr(e)) gh(t, a)
  else {
    var u = e.alternate
    if (e.lanes === 0 && (u === null || u.lanes === 0) && ((u = t.lastRenderedReducer), u !== null))
      try {
        var i = t.lastRenderedState,
          r = u(i, l)
        if (((a.hasEagerState = !0), (a.eagerState = r), Mt(r, i)))
          return (Tr(e, t, a, 0), se === null && Ar(), !1)
      } catch {
      } finally {
      }
    if (((l = Es(e, t, a, n)), l !== null)) return (ct(l, e, n), bh(l, t, n), !0)
  }
  return !1
}
function Ls(e, t, l, n) {
  if (
    ((n = {
      lane: 2,
      revertLane: Fs(),
      gesture: null,
      action: n,
      hasEagerState: !1,
      eagerState: null,
      next: null,
    }),
    Rr(e))
  ) {
    if (t) throw Error(z(479))
  } else ((t = Es(e, l, n, 2)), t !== null && ct(t, e, 2))
}
function Rr(e) {
  var t = e.alternate
  return e === K || (t !== null && t === K)
}
function gh(e, t) {
  Oa = Ji = !0
  var l = e.pending
  ;(l === null ? (t.next = t) : ((t.next = l.next), (l.next = t)), (e.pending = t))
}
function bh(e, t, l) {
  if (l & 4194048) {
    var n = t.lanes
    ;((n &= e.pendingLanes), (l |= n), (t.lanes = l), nm(e, l))
  }
}
var Cu = {
  readContext: Je,
  use: Nr,
  useCallback: _e,
  useContext: _e,
  useEffect: _e,
  useImperativeHandle: _e,
  useLayoutEffect: _e,
  useInsertionEffect: _e,
  useMemo: _e,
  useReducer: _e,
  useRef: _e,
  useState: _e,
  useDebugValue: _e,
  useDeferredValue: _e,
  useTransition: _e,
  useSyncExternalStore: _e,
  useId: _e,
  useHostTransitionStatus: _e,
  useFormState: _e,
  useActionState: _e,
  useOptimistic: _e,
  useMemoCache: _e,
  useCacheRefresh: _e,
}
Cu.useEffectEvent = _e
var ph = {
    readContext: Je,
    use: Nr,
    useCallback: function (e, t) {
      return ((Ie().memoizedState = [e, t === void 0 ? null : t]), e)
    },
    useContext: Je,
    useEffect: cd,
    useImperativeHandle: function (e, t, l) {
      ;((l = l != null ? l.concat([e]) : null), Ai(4194308, 4, ih.bind(null, t, e), l))
    },
    useLayoutEffect: function (e, t) {
      return Ai(4194308, 4, e, t)
    },
    useInsertionEffect: function (e, t) {
      Ai(4, 2, e, t)
    },
    useMemo: function (e, t) {
      var l = Ie()
      t = t === void 0 ? null : t
      var n = e()
      if (qn) {
        Il(!0)
        try {
          e()
        } finally {
          Il(!1)
        }
      }
      return ((l.memoizedState = [n, t]), n)
    },
    useReducer: function (e, t, l) {
      var n = Ie()
      if (l !== void 0) {
        var a = l(t)
        if (qn) {
          Il(!0)
          try {
            l(t)
          } finally {
            Il(!1)
          }
        }
      } else a = t
      return (
        (n.memoizedState = n.baseState = a),
        (e = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: e,
          lastRenderedState: a,
        }),
        (n.queue = e),
        (e = e.dispatch = o1.bind(null, K, e)),
        [n.memoizedState, e]
      )
    },
    useRef: function (e) {
      var t = Ie()
      return ((e = { current: e }), (t.memoizedState = e))
    },
    useState: function (e) {
      e = Ef(e)
      var t = e.queue,
        l = vh.bind(null, K, t)
      return ((t.dispatch = l), [e.memoizedState, l])
    },
    useDebugValue: Vs,
    useDeferredValue: function (e, t) {
      var l = Ie()
      return js(l, e, t)
    },
    useTransition: function () {
      var e = Ef(!1)
      return ((e = oh.bind(null, K, e.queue, !0, !1)), (Ie().memoizedState = e), [!1, e])
    },
    useSyncExternalStore: function (e, t, l) {
      var n = K,
        a = Ie()
      if (ee) {
        if (l === void 0) throw Error(z(407))
        l = l()
      } else {
        if (((l = t()), se === null)) throw Error(z(349))
        I & 127 || Qm(n, t, l)
      }
      a.memoizedState = l
      var u = { value: l, getSnapshot: t }
      return (
        (a.queue = u),
        cd(Wm.bind(null, n, u, e), [e]),
        (n.flags |= 2048),
        xa(9, { destroy: void 0 }, Km.bind(null, n, u, l, t), null),
        l
      )
    },
    useId: function () {
      var e = Ie(),
        t = se.identifierPrefix
      if (ee) {
        var l = ll,
          n = tl
        ;((l = (n & ~(1 << (32 - Ot(n) - 1))).toString(32) + l),
          (t = '_' + t + 'R_' + l),
          (l = Fi++),
          0 < l && (t += 'H' + l.toString(32)),
          (t += '_'))
      } else ((l = a1++), (t = '_' + t + 'r_' + l.toString(32) + '_'))
      return (e.memoizedState = t)
    },
    useHostTransitionStatus: qs,
    useFormState: ud,
    useActionState: ud,
    useOptimistic: function (e) {
      var t = Ie()
      t.memoizedState = t.baseState = e
      var l = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: null,
        lastRenderedState: null,
      }
      return ((t.queue = l), (t = Ls.bind(null, K, !0, l)), (l.dispatch = t), [e, t])
    },
    useMemoCache: Hs,
    useCacheRefresh: function () {
      return (Ie().memoizedState = s1.bind(null, K))
    },
    useEffectEvent: function (e) {
      var t = Ie(),
        l = { impl: e }
      return (
        (t.memoizedState = l),
        function () {
          if (ne & 2) throw Error(z(440))
          return l.impl.apply(void 0, arguments)
        }
      )
    },
  },
  Gs = {
    readContext: Je,
    use: Nr,
    useCallback: ch,
    useContext: Je,
    useEffect: ws,
    useImperativeHandle: rh,
    useInsertionEffect: ah,
    useLayoutEffect: uh,
    useMemo: fh,
    useReducer: Mi,
    useRef: lh,
    useState: function () {
      return Mi(Bl)
    },
    useDebugValue: Vs,
    useDeferredValue: function (e, t) {
      var l = Ne()
      return sh(l, ce.memoizedState, e, t)
    },
    useTransition: function () {
      var e = Mi(Bl)[0],
        t = Ne().memoizedState
      return [typeof e == 'boolean' ? e : Gu(e), t]
    },
    useSyncExternalStore: Zm,
    useId: mh,
    useHostTransitionStatus: qs,
    useFormState: id,
    useActionState: id,
    useOptimistic: function (e, t) {
      var l = Ne()
      return $m(l, ce, e, t)
    },
    useMemoCache: Hs,
    useCacheRefresh: hh,
  }
Gs.useEffectEvent = nh
var Sh = {
  readContext: Je,
  use: Nr,
  useCallback: ch,
  useContext: Je,
  useEffect: ws,
  useImperativeHandle: rh,
  useInsertionEffect: ah,
  useLayoutEffect: uh,
  useMemo: fh,
  useReducer: Sc,
  useRef: lh,
  useState: function () {
    return Sc(Bl)
  },
  useDebugValue: Vs,
  useDeferredValue: function (e, t) {
    var l = Ne()
    return ce === null ? js(l, e, t) : sh(l, ce.memoizedState, e, t)
  },
  useTransition: function () {
    var e = Sc(Bl)[0],
      t = Ne().memoizedState
    return [typeof e == 'boolean' ? e : Gu(e), t]
  },
  useSyncExternalStore: Zm,
  useId: mh,
  useHostTransitionStatus: qs,
  useFormState: rd,
  useActionState: rd,
  useOptimistic: function (e, t) {
    var l = Ne()
    return ce !== null ? $m(l, ce, e, t) : ((l.baseState = e), [e, l.queue.dispatch])
  },
  useMemoCache: Hs,
  useCacheRefresh: hh,
}
Sh.useEffectEvent = nh
function Ec(e, t, l, n) {
  ;((t = e.memoizedState),
    (l = l(n, t)),
    (l = l == null ? t : Se({}, t, l)),
    (e.memoizedState = l),
    e.lanes === 0 && (e.updateQueue.baseState = l))
}
var _f = {
  enqueueSetState: function (e, t, l) {
    e = e._reactInternals
    var n = _t(),
      a = un(n)
    ;((a.payload = t),
      l != null && (a.callback = l),
      (t = rn(e, a, n)),
      t !== null && (ct(t, e, n), fu(t, e, n)))
  },
  enqueueReplaceState: function (e, t, l) {
    e = e._reactInternals
    var n = _t(),
      a = un(n)
    ;((a.tag = 1),
      (a.payload = t),
      l != null && (a.callback = l),
      (t = rn(e, a, n)),
      t !== null && (ct(t, e, n), fu(t, e, n)))
  },
  enqueueForceUpdate: function (e, t) {
    e = e._reactInternals
    var l = _t(),
      n = un(l)
    ;((n.tag = 2),
      t != null && (n.callback = t),
      (t = rn(e, n, l)),
      t !== null && (ct(t, e, l), fu(t, e, l)))
  },
}
function fd(e, t, l, n, a, u, i) {
  return (
    (e = e.stateNode),
    typeof e.shouldComponentUpdate == 'function'
      ? e.shouldComponentUpdate(n, u, i)
      : t.prototype && t.prototype.isPureReactComponent
        ? !Ou(l, n) || !Ou(a, u)
        : !0
  )
}
function sd(e, t, l, n) {
  ;((e = t.state),
    typeof t.componentWillReceiveProps == 'function' && t.componentWillReceiveProps(l, n),
    typeof t.UNSAFE_componentWillReceiveProps == 'function' &&
      t.UNSAFE_componentWillReceiveProps(l, n),
    t.state !== e && _f.enqueueReplaceState(t, t.state, null))
}
function Ln(e, t) {
  var l = t
  if ('ref' in t) {
    l = {}
    for (var n in t) n !== 'ref' && (l[n] = t[n])
  }
  if ((e = e.defaultProps)) {
    l === t && (l = Se({}, l))
    for (var a in e) l[a] === void 0 && (l[a] = e[a])
  }
  return l
}
function Eh(e) {
  Gi(e)
}
function Dh(e) {
  console.error(e)
}
function Oh(e) {
  Gi(e)
}
function $i(e, t) {
  try {
    var l = e.onUncaughtError
    l(t.value, { componentStack: t.stack })
  } catch (n) {
    setTimeout(function () {
      throw n
    })
  }
}
function od(e, t, l) {
  try {
    var n = e.onCaughtError
    n(l.value, { componentStack: l.stack, errorBoundary: t.tag === 1 ? t.stateNode : null })
  } catch (a) {
    setTimeout(function () {
      throw a
    })
  }
}
function Mf(e, t, l) {
  return (
    (l = un(l)),
    (l.tag = 3),
    (l.payload = { element: null }),
    (l.callback = function () {
      $i(e, t)
    }),
    l
  )
}
function _h(e) {
  return ((e = un(e)), (e.tag = 3), e)
}
function Mh(e, t, l, n) {
  var a = l.type.getDerivedStateFromError
  if (typeof a == 'function') {
    var u = n.value
    ;((e.payload = function () {
      return a(u)
    }),
      (e.callback = function () {
        od(t, l, n)
      }))
  }
  var i = l.stateNode
  i !== null &&
    typeof i.componentDidCatch == 'function' &&
    (e.callback = function () {
      ;(od(t, l, n),
        typeof a != 'function' && (cn === null ? (cn = new Set([this])) : cn.add(this)))
      var r = n.stack
      this.componentDidCatch(n.value, { componentStack: r !== null ? r : '' })
    })
}
function d1(e, t, l, n, a) {
  if (((l.flags |= 32768), n !== null && typeof n == 'object' && typeof n.then == 'function')) {
    if (((t = l.alternate), t !== null && qa(t, l, a, !0), (l = At.current), l !== null)) {
      switch (l.tag) {
        case 31:
        case 13:
          return (
            Yt === null ? lr() : l.alternate === null && Ae === 0 && (Ae = 3),
            (l.flags &= -257),
            (l.flags |= 65536),
            (l.lanes = a),
            n === Qi
              ? (l.flags |= 16384)
              : ((t = l.updateQueue),
                t === null ? (l.updateQueue = new Set([n])) : t.add(n),
                Rc(e, n, a)),
            !1
          )
        case 22:
          return (
            (l.flags |= 65536),
            n === Qi
              ? (l.flags |= 16384)
              : ((t = l.updateQueue),
                t === null
                  ? ((t = { transitions: null, markerInstances: null, retryQueue: new Set([n]) }),
                    (l.updateQueue = t))
                  : ((l = t.retryQueue), l === null ? (t.retryQueue = new Set([n])) : l.add(n)),
                Rc(e, n, a)),
            !1
          )
      }
      throw Error(z(435, l.tag))
    }
    return (Rc(e, n, a), lr(), !1)
  }
  if (ee)
    return (
      (t = At.current),
      t !== null
        ? (!(t.flags & 65536) && (t.flags |= 256),
          (t.flags |= 65536),
          (t.lanes = a),
          n !== df && ((e = Error(z(422), { cause: n })), Mu(Bt(e, l))))
        : (n !== df && ((t = Error(z(423), { cause: n })), Mu(Bt(t, l))),
          (e = e.current.alternate),
          (e.flags |= 65536),
          (a &= -a),
          (e.lanes |= a),
          (n = Bt(n, l)),
          (a = Mf(e.stateNode, n, a)),
          pc(e, a),
          Ae !== 4 && (Ae = 2)),
      !1
    )
  var u = Error(z(520), { cause: n })
  if (((u = Bt(u, l)), hu === null ? (hu = [u]) : hu.push(u), Ae !== 4 && (Ae = 2), t === null))
    return !0
  ;((n = Bt(n, l)), (l = t))
  do {
    switch (l.tag) {
      case 3:
        return (
          (l.flags |= 65536),
          (e = a & -a),
          (l.lanes |= e),
          (e = Mf(l.stateNode, n, e)),
          pc(l, e),
          !1
        )
      case 1:
        if (
          ((t = l.type),
          (u = l.stateNode),
          (l.flags & 128) === 0 &&
            (typeof t.getDerivedStateFromError == 'function' ||
              (u !== null &&
                typeof u.componentDidCatch == 'function' &&
                (cn === null || !cn.has(u)))))
        )
          return (
            (l.flags |= 65536),
            (a &= -a),
            (l.lanes |= a),
            (a = _h(a)),
            Mh(a, e, l, n),
            pc(l, a),
            !1
          )
    }
    l = l.return
  } while (l !== null)
  return !1
}
var Xs = Error(z(461)),
  Ye = !1
function Qe(e, t, l, n) {
  t.child = e === null ? jm(t, null, l, n) : jn(t, e.child, l, n)
}
function dd(e, t, l, n, a) {
  l = l.render
  var u = t.ref
  if ('ref' in n) {
    var i = {}
    for (var r in n) r !== 'ref' && (i[r] = n[r])
  } else i = n
  return (
    Vn(t),
    (n = xs(e, t, l, i, u, a)),
    (r = Rs()),
    e !== null && !Ye
      ? (Us(e, t, a), Hl(e, t, a))
      : (ee && r && Os(t), (t.flags |= 1), Qe(e, t, n, a), t.child)
  )
}
function yd(e, t, l, n, a) {
  if (e === null) {
    var u = l.type
    return typeof u == 'function' && !Ds(u) && u.defaultProps === void 0 && l.compare === null
      ? ((t.tag = 15), (t.type = u), Ah(e, t, u, n, a))
      : ((e = Oi(l.type, null, n, t, t.mode, a)), (e.ref = t.ref), (e.return = t), (t.child = e))
  }
  if (((u = e.child), !ks(e, a))) {
    var i = u.memoizedProps
    if (((l = l.compare), (l = l !== null ? l : Ou), l(i, n) && e.ref === t.ref)) return Hl(e, t, a)
  }
  return ((t.flags |= 1), (e = Cl(u, n)), (e.ref = t.ref), (e.return = t), (t.child = e))
}
function Ah(e, t, l, n, a) {
  if (e !== null) {
    var u = e.memoizedProps
    if (Ou(u, n) && e.ref === t.ref)
      if (((Ye = !1), (t.pendingProps = n = u), ks(e, a))) e.flags & 131072 && (Ye = !0)
      else return ((t.lanes = e.lanes), Hl(e, t, a))
  }
  return Af(e, t, l, n, a)
}
function Th(e, t, l, n) {
  var a = n.children,
    u = e !== null ? e.memoizedState : null
  if (
    (e === null &&
      t.stateNode === null &&
      (t.stateNode = {
        _visibility: 1,
        _pendingMarkers: null,
        _retryCache: null,
        _transitions: null,
      }),
    n.mode === 'hidden')
  ) {
    if (t.flags & 128) {
      if (((u = u !== null ? u.baseLanes | l : l), e !== null)) {
        for (n = t.child = e.child, a = 0; n !== null; )
          ((a = a | n.lanes | n.childLanes), (n = n.sibling))
        n = a & ~u
      } else ((n = 0), (t.child = null))
      return md(e, t, u, l, n)
    }
    if (l & 536870912)
      ((t.memoizedState = { baseLanes: 0, cachePool: null }),
        e !== null && _i(t, u !== null ? u.cachePool : null),
        u !== null ? ld(t, u) : pf(),
        Gm(t))
    else return ((n = t.lanes = 536870912), md(e, t, u !== null ? u.baseLanes | l : l, l, n))
  } else
    u !== null
      ? (_i(t, u.cachePool), ld(t, u), Fl(), (t.memoizedState = null))
      : (e !== null && _i(t, null), pf(), Fl())
  return (Qe(e, t, a, l), t.child)
}
function lu(e, t) {
  return (
    (e !== null && e.tag === 22) ||
      t.stateNode !== null ||
      (t.stateNode = {
        _visibility: 1,
        _pendingMarkers: null,
        _retryCache: null,
        _transitions: null,
      }),
    t.sibling
  )
}
function md(e, t, l, n, a) {
  var u = As()
  return (
    (u = u === null ? null : { parent: He._currentValue, pool: u }),
    (t.memoizedState = { baseLanes: l, cachePool: u }),
    e !== null && _i(t, null),
    pf(),
    Gm(t),
    e !== null && qa(e, t, n, !0),
    (t.childLanes = a),
    null
  )
}
function Ti(e, t) {
  return (
    (t = Ii({ mode: t.mode, children: t.children }, e.mode)),
    (t.ref = e.ref),
    (e.child = t),
    (t.return = e),
    t
  )
}
function hd(e, t, l) {
  return (
    jn(t, e.child, null, l),
    (e = Ti(t, t.pendingProps)),
    (e.flags |= 2),
    gt(t),
    (t.memoizedState = null),
    e
  )
}
function y1(e, t, l) {
  var n = t.pendingProps,
    a = (t.flags & 128) !== 0
  if (((t.flags &= -129), e === null)) {
    if (ee) {
      if (n.mode === 'hidden') return ((e = Ti(t, n)), (t.lanes = 536870912), lu(null, e))
      if (
        (Sf(t),
        (e = be)
          ? ((e = pv(e, Ht)),
            (e = e !== null && e.data === '&' ? e : null),
            e !== null &&
              ((t.memoizedState = {
                dehydrated: e,
                treeContext: yn !== null ? { id: tl, overflow: ll } : null,
                retryLane: 536870912,
                hydrationErrors: null,
              }),
              (l = Rm(e)),
              (l.return = t),
              (t.child = l),
              (We = t),
              (be = null)))
          : (e = null),
        e === null)
      )
        throw mn(t)
      return ((t.lanes = 536870912), null)
    }
    return Ti(t, n)
  }
  var u = e.memoizedState
  if (u !== null) {
    var i = u.dehydrated
    if ((Sf(t), a))
      if (t.flags & 256) ((t.flags &= -257), (t = hd(e, t, l)))
      else if (t.memoizedState !== null) ((t.child = e.child), (t.flags |= 128), (t = null))
      else throw Error(z(558))
    else if ((Ye || qa(e, t, l, !1), (a = (l & e.childLanes) !== 0), Ye || a)) {
      if (((n = se), n !== null && ((i = am(n, l)), i !== 0 && i !== u.retryLane)))
        throw ((u.retryLane = i), Zn(e, i), ct(n, e, i), Xs)
      ;(lr(), (t = hd(e, t, l)))
    } else
      ((e = u.treeContext),
        (be = wt(i.nextSibling)),
        (We = t),
        (ee = !0),
        (an = null),
        (Ht = !1),
        e !== null && Bm(t, e),
        (t = Ti(t, n)),
        (t.flags |= 4096))
    return t
  }
  return (
    (e = Cl(e.child, { mode: n.mode, children: n.children })),
    (e.ref = t.ref),
    (t.child = e),
    (e.return = t),
    e
  )
}
function Ci(e, t) {
  var l = t.ref
  if (l === null) e !== null && e.ref !== null && (t.flags |= 4194816)
  else {
    if (typeof l != 'function' && typeof l != 'object') throw Error(z(284))
    ;(e === null || e.ref !== l) && (t.flags |= 4194816)
  }
}
function Af(e, t, l, n, a) {
  return (
    Vn(t),
    (l = xs(e, t, l, n, void 0, a)),
    (n = Rs()),
    e !== null && !Ye
      ? (Us(e, t, a), Hl(e, t, a))
      : (ee && n && Os(t), (t.flags |= 1), Qe(e, t, l, a), t.child)
  )
}
function vd(e, t, l, n, a, u) {
  return (
    Vn(t),
    (t.updateQueue = null),
    (l = km(t, n, l, a)),
    Xm(e),
    (n = Rs()),
    e !== null && !Ye
      ? (Us(e, t, u), Hl(e, t, u))
      : (ee && n && Os(t), (t.flags |= 1), Qe(e, t, l, u), t.child)
  )
}
function gd(e, t, l, n, a) {
  if ((Vn(t), t.stateNode === null)) {
    var u = ma,
      i = l.contextType
    ;(typeof i == 'object' && i !== null && (u = Je(i)),
      (u = new l(n, u)),
      (t.memoizedState = u.state !== null && u.state !== void 0 ? u.state : null),
      (u.updater = _f),
      (t.stateNode = u),
      (u._reactInternals = t),
      (u = t.stateNode),
      (u.props = n),
      (u.state = t.memoizedState),
      (u.refs = {}),
      Cs(t),
      (i = l.contextType),
      (u.context = typeof i == 'object' && i !== null ? Je(i) : ma),
      (u.state = t.memoizedState),
      (i = l.getDerivedStateFromProps),
      typeof i == 'function' && (Ec(t, l, i, n), (u.state = t.memoizedState)),
      typeof l.getDerivedStateFromProps == 'function' ||
        typeof u.getSnapshotBeforeUpdate == 'function' ||
        (typeof u.UNSAFE_componentWillMount != 'function' &&
          typeof u.componentWillMount != 'function') ||
        ((i = u.state),
        typeof u.componentWillMount == 'function' && u.componentWillMount(),
        typeof u.UNSAFE_componentWillMount == 'function' && u.UNSAFE_componentWillMount(),
        i !== u.state && _f.enqueueReplaceState(u, u.state, null),
        ou(t, n, u, a),
        su(),
        (u.state = t.memoizedState)),
      typeof u.componentDidMount == 'function' && (t.flags |= 4194308),
      (n = !0))
  } else if (e === null) {
    u = t.stateNode
    var r = t.memoizedProps,
      c = Ln(l, r)
    u.props = c
    var f = u.context,
      d = l.contextType
    ;((i = ma), typeof d == 'object' && d !== null && (i = Je(d)))
    var y = l.getDerivedStateFromProps
    ;((d = typeof y == 'function' || typeof u.getSnapshotBeforeUpdate == 'function'),
      (r = t.pendingProps !== r),
      d ||
        (typeof u.UNSAFE_componentWillReceiveProps != 'function' &&
          typeof u.componentWillReceiveProps != 'function') ||
        ((r || f !== i) && sd(t, u, n, i)),
      (Kl = !1))
    var o = t.memoizedState
    ;((u.state = o),
      ou(t, n, u, a),
      su(),
      (f = t.memoizedState),
      r || o !== f || Kl
        ? (typeof y == 'function' && (Ec(t, l, y, n), (f = t.memoizedState)),
          (c = Kl || fd(t, l, c, n, o, f, i))
            ? (d ||
                (typeof u.UNSAFE_componentWillMount != 'function' &&
                  typeof u.componentWillMount != 'function') ||
                (typeof u.componentWillMount == 'function' && u.componentWillMount(),
                typeof u.UNSAFE_componentWillMount == 'function' && u.UNSAFE_componentWillMount()),
              typeof u.componentDidMount == 'function' && (t.flags |= 4194308))
            : (typeof u.componentDidMount == 'function' && (t.flags |= 4194308),
              (t.memoizedProps = n),
              (t.memoizedState = f)),
          (u.props = n),
          (u.state = f),
          (u.context = i),
          (n = c))
        : (typeof u.componentDidMount == 'function' && (t.flags |= 4194308), (n = !1)))
  } else {
    ;((u = t.stateNode),
      gf(e, t),
      (i = t.memoizedProps),
      (d = Ln(l, i)),
      (u.props = d),
      (y = t.pendingProps),
      (o = u.context),
      (f = l.contextType),
      (c = ma),
      typeof f == 'object' && f !== null && (c = Je(f)),
      (r = l.getDerivedStateFromProps),
      (f = typeof r == 'function' || typeof u.getSnapshotBeforeUpdate == 'function') ||
        (typeof u.UNSAFE_componentWillReceiveProps != 'function' &&
          typeof u.componentWillReceiveProps != 'function') ||
        ((i !== y || o !== c) && sd(t, u, n, c)),
      (Kl = !1),
      (o = t.memoizedState),
      (u.state = o),
      ou(t, n, u, a),
      su())
    var v = t.memoizedState
    i !== y || o !== v || Kl || (e !== null && e.dependencies !== null && Zi(e.dependencies))
      ? (typeof r == 'function' && (Ec(t, l, r, n), (v = t.memoizedState)),
        (d =
          Kl ||
          fd(t, l, d, n, o, v, c) ||
          (e !== null && e.dependencies !== null && Zi(e.dependencies)))
          ? (f ||
              (typeof u.UNSAFE_componentWillUpdate != 'function' &&
                typeof u.componentWillUpdate != 'function') ||
              (typeof u.componentWillUpdate == 'function' && u.componentWillUpdate(n, v, c),
              typeof u.UNSAFE_componentWillUpdate == 'function' &&
                u.UNSAFE_componentWillUpdate(n, v, c)),
            typeof u.componentDidUpdate == 'function' && (t.flags |= 4),
            typeof u.getSnapshotBeforeUpdate == 'function' && (t.flags |= 1024))
          : (typeof u.componentDidUpdate != 'function' ||
              (i === e.memoizedProps && o === e.memoizedState) ||
              (t.flags |= 4),
            typeof u.getSnapshotBeforeUpdate != 'function' ||
              (i === e.memoizedProps && o === e.memoizedState) ||
              (t.flags |= 1024),
            (t.memoizedProps = n),
            (t.memoizedState = v)),
        (u.props = n),
        (u.state = v),
        (u.context = c),
        (n = d))
      : (typeof u.componentDidUpdate != 'function' ||
          (i === e.memoizedProps && o === e.memoizedState) ||
          (t.flags |= 4),
        typeof u.getSnapshotBeforeUpdate != 'function' ||
          (i === e.memoizedProps && o === e.memoizedState) ||
          (t.flags |= 1024),
        (n = !1))
  }
  return (
    (u = n),
    Ci(e, t),
    (n = (t.flags & 128) !== 0),
    u || n
      ? ((u = t.stateNode),
        (l = n && typeof l.getDerivedStateFromError != 'function' ? null : u.render()),
        (t.flags |= 1),
        e !== null && n
          ? ((t.child = jn(t, e.child, null, a)), (t.child = jn(t, null, l, a)))
          : Qe(e, t, l, a),
        (t.memoizedState = u.state),
        (e = t.child))
      : (e = Hl(e, t, a)),
    e
  )
}
function bd(e, t, l, n) {
  return (wn(), (t.flags |= 256), Qe(e, t, l, n), t.child)
}
var Dc = { dehydrated: null, treeContext: null, retryLane: 0, hydrationErrors: null }
function Oc(e) {
  return { baseLanes: e, cachePool: Ym() }
}
function _c(e, t, l) {
  return ((e = e !== null ? e.childLanes & ~l : 0), t && (e |= St), e)
}
function Ch(e, t, l) {
  var n = t.pendingProps,
    a = !1,
    u = (t.flags & 128) !== 0,
    i
  if (
    ((i = u) || (i = e !== null && e.memoizedState === null ? !1 : (ze.current & 2) !== 0),
    i && ((a = !0), (t.flags &= -129)),
    (i = (t.flags & 32) !== 0),
    (t.flags &= -33),
    e === null)
  ) {
    if (ee) {
      if (
        (a ? Jl(t) : Fl(),
        (e = be)
          ? ((e = pv(e, Ht)),
            (e = e !== null && e.data !== '&' ? e : null),
            e !== null &&
              ((t.memoizedState = {
                dehydrated: e,
                treeContext: yn !== null ? { id: tl, overflow: ll } : null,
                retryLane: 536870912,
                hydrationErrors: null,
              }),
              (l = Rm(e)),
              (l.return = t),
              (t.child = l),
              (We = t),
              (be = null)))
          : (e = null),
        e === null)
      )
        throw mn(t)
      return (qf(e) ? (t.lanes = 32) : (t.lanes = 536870912), null)
    }
    var r = n.children
    return (
      (n = n.fallback),
      a
        ? (Fl(),
          (a = t.mode),
          (r = Ii({ mode: 'hidden', children: r }, a)),
          (n = Rn(n, a, l, null)),
          (r.return = t),
          (n.return = t),
          (r.sibling = n),
          (t.child = r),
          (n = t.child),
          (n.memoizedState = Oc(l)),
          (n.childLanes = _c(e, i, l)),
          (t.memoizedState = Dc),
          lu(null, n))
        : (Jl(t), Tf(t, r))
    )
  }
  var c = e.memoizedState
  if (c !== null && ((r = c.dehydrated), r !== null)) {
    if (u)
      t.flags & 256
        ? (Jl(t), (t.flags &= -257), (t = Mc(e, t, l)))
        : t.memoizedState !== null
          ? (Fl(), (t.child = e.child), (t.flags |= 128), (t = null))
          : (Fl(),
            (r = n.fallback),
            (a = t.mode),
            (n = Ii({ mode: 'visible', children: n.children }, a)),
            (r = Rn(r, a, l, null)),
            (r.flags |= 2),
            (n.return = t),
            (r.return = t),
            (n.sibling = r),
            (t.child = n),
            jn(t, e.child, null, l),
            (n = t.child),
            (n.memoizedState = Oc(l)),
            (n.childLanes = _c(e, i, l)),
            (t.memoizedState = Dc),
            (t = lu(null, n)))
    else if ((Jl(t), qf(r))) {
      if (((i = r.nextSibling && r.nextSibling.dataset), i)) var f = i.dgst
      ;((i = f),
        (n = Error(z(419))),
        (n.stack = ''),
        (n.digest = i),
        Mu({ value: n, source: null, stack: null }),
        (t = Mc(e, t, l)))
    } else if ((Ye || qa(e, t, l, !1), (i = (l & e.childLanes) !== 0), Ye || i)) {
      if (((i = se), i !== null && ((n = am(i, l)), n !== 0 && n !== c.retryLane)))
        throw ((c.retryLane = n), Zn(e, n), ct(i, e, n), Xs)
      ;(jf(r) || lr(), (t = Mc(e, t, l)))
    } else
      jf(r)
        ? ((t.flags |= 192), (t.child = e.child), (t = null))
        : ((e = c.treeContext),
          (be = wt(r.nextSibling)),
          (We = t),
          (ee = !0),
          (an = null),
          (Ht = !1),
          e !== null && Bm(t, e),
          (t = Tf(t, n.children)),
          (t.flags |= 4096))
    return t
  }
  return a
    ? (Fl(),
      (r = n.fallback),
      (a = t.mode),
      (c = e.child),
      (f = c.sibling),
      (n = Cl(c, { mode: 'hidden', children: n.children })),
      (n.subtreeFlags = c.subtreeFlags & 65011712),
      f !== null ? (r = Cl(f, r)) : ((r = Rn(r, a, l, null)), (r.flags |= 2)),
      (r.return = t),
      (n.return = t),
      (n.sibling = r),
      (t.child = n),
      lu(null, n),
      (n = t.child),
      (r = e.child.memoizedState),
      r === null
        ? (r = Oc(l))
        : ((a = r.cachePool),
          a !== null
            ? ((c = He._currentValue), (a = a.parent !== c ? { parent: c, pool: c } : a))
            : (a = Ym()),
          (r = { baseLanes: r.baseLanes | l, cachePool: a })),
      (n.memoizedState = r),
      (n.childLanes = _c(e, i, l)),
      (t.memoizedState = Dc),
      lu(e.child, n))
    : (Jl(t),
      (l = e.child),
      (e = l.sibling),
      (l = Cl(l, { mode: 'visible', children: n.children })),
      (l.return = t),
      (l.sibling = null),
      e !== null &&
        ((i = t.deletions), i === null ? ((t.deletions = [e]), (t.flags |= 16)) : i.push(e)),
      (t.child = l),
      (t.memoizedState = null),
      l)
}
function Tf(e, t) {
  return ((t = Ii({ mode: 'visible', children: t }, e.mode)), (t.return = e), (e.child = t))
}
function Ii(e, t) {
  return ((e = bt(22, e, null, t)), (e.lanes = 0), e)
}
function Mc(e, t, l) {
  return (
    jn(t, e.child, null, l),
    (e = Tf(t, t.pendingProps.children)),
    (e.flags |= 2),
    (t.memoizedState = null),
    e
  )
}
function pd(e, t, l) {
  e.lanes |= t
  var n = e.alternate
  ;(n !== null && (n.lanes |= t), mf(e.return, t, l))
}
function Ac(e, t, l, n, a, u) {
  var i = e.memoizedState
  i === null
    ? (e.memoizedState = {
        isBackwards: t,
        rendering: null,
        renderingStartTime: 0,
        last: n,
        tail: l,
        tailMode: a,
        treeForkCount: u,
      })
    : ((i.isBackwards = t),
      (i.rendering = null),
      (i.renderingStartTime = 0),
      (i.last = n),
      (i.tail = l),
      (i.tailMode = a),
      (i.treeForkCount = u))
}
function zh(e, t, l) {
  var n = t.pendingProps,
    a = n.revealOrder,
    u = n.tail
  n = n.children
  var i = ze.current,
    r = (i & 2) !== 0
  if (
    (r ? ((i = (i & 1) | 2), (t.flags |= 128)) : (i &= 1),
    he(ze, i),
    Qe(e, t, n, l),
    (n = ee ? _u : 0),
    !r && e !== null && e.flags & 128)
  )
    e: for (e = t.child; e !== null; ) {
      if (e.tag === 13) e.memoizedState !== null && pd(e, l, t)
      else if (e.tag === 19) pd(e, l, t)
      else if (e.child !== null) {
        ;((e.child.return = e), (e = e.child))
        continue
      }
      if (e === t) break e
      for (; e.sibling === null; ) {
        if (e.return === null || e.return === t) break e
        e = e.return
      }
      ;((e.sibling.return = e.return), (e = e.sibling))
    }
  switch (a) {
    case 'forwards':
      for (l = t.child, a = null; l !== null; )
        ((e = l.alternate), e !== null && Wi(e) === null && (a = l), (l = l.sibling))
      ;((l = a),
        l === null ? ((a = t.child), (t.child = null)) : ((a = l.sibling), (l.sibling = null)),
        Ac(t, !1, a, l, u, n))
      break
    case 'backwards':
    case 'unstable_legacy-backwards':
      for (l = null, a = t.child, t.child = null; a !== null; ) {
        if (((e = a.alternate), e !== null && Wi(e) === null)) {
          t.child = a
          break
        }
        ;((e = a.sibling), (a.sibling = l), (l = a), (a = e))
      }
      Ac(t, !0, l, null, u, n)
      break
    case 'together':
      Ac(t, !1, null, null, void 0, n)
      break
    default:
      t.memoizedState = null
  }
  return t.child
}
function Hl(e, t, l) {
  if ((e !== null && (t.dependencies = e.dependencies), (vn |= t.lanes), !(l & t.childLanes)))
    if (e !== null) {
      if ((qa(e, t, l, !1), (l & t.childLanes) === 0)) return null
    } else return null
  if (e !== null && t.child !== e.child) throw Error(z(153))
  if (t.child !== null) {
    for (e = t.child, l = Cl(e, e.pendingProps), t.child = l, l.return = t; e.sibling !== null; )
      ((e = e.sibling), (l = l.sibling = Cl(e, e.pendingProps)), (l.return = t))
    l.sibling = null
  }
  return t.child
}
function ks(e, t) {
  return e.lanes & t ? !0 : ((e = e.dependencies), !!(e !== null && Zi(e)))
}
function m1(e, t, l) {
  switch (t.tag) {
    case 3:
      ;(Vi(t, t.stateNode.containerInfo), Wl(t, He, e.memoizedState.cache), wn())
      break
    case 27:
    case 5:
      ef(t)
      break
    case 4:
      Vi(t, t.stateNode.containerInfo)
      break
    case 10:
      Wl(t, t.type, t.memoizedProps.value)
      break
    case 31:
      if (t.memoizedState !== null) return ((t.flags |= 128), Sf(t), null)
      break
    case 13:
      var n = t.memoizedState
      if (n !== null)
        return n.dehydrated !== null
          ? (Jl(t), (t.flags |= 128), null)
          : l & t.child.childLanes
            ? Ch(e, t, l)
            : (Jl(t), (e = Hl(e, t, l)), e !== null ? e.sibling : null)
      Jl(t)
      break
    case 19:
      var a = (e.flags & 128) !== 0
      if (
        ((n = (l & t.childLanes) !== 0), n || (qa(e, t, l, !1), (n = (l & t.childLanes) !== 0)), a)
      ) {
        if (n) return zh(e, t, l)
        t.flags |= 128
      }
      if (
        ((a = t.memoizedState),
        a !== null && ((a.rendering = null), (a.tail = null), (a.lastEffect = null)),
        he(ze, ze.current),
        n)
      )
        break
      return null
    case 22:
      return ((t.lanes = 0), Th(e, t, l, t.pendingProps))
    case 24:
      Wl(t, He, e.memoizedState.cache)
  }
  return Hl(e, t, l)
}
function Nh(e, t, l) {
  if (e !== null)
    if (e.memoizedProps !== t.pendingProps) Ye = !0
    else {
      if (!ks(e, l) && !(t.flags & 128)) return ((Ye = !1), m1(e, t, l))
      Ye = !!(e.flags & 131072)
    }
  else ((Ye = !1), ee && t.flags & 1048576 && Um(t, _u, t.index))
  switch (((t.lanes = 0), t.tag)) {
    case 16:
      e: {
        var n = t.pendingProps
        if (((e = Tn(t.elementType)), (t.type = e), typeof e == 'function'))
          Ds(e)
            ? ((n = Ln(e, n)), (t.tag = 1), (t = gd(null, t, e, n, l)))
            : ((t.tag = 0), (t = Af(null, t, e, n, l)))
        else {
          if (e != null) {
            var a = e.$$typeof
            if (a === cs) {
              ;((t.tag = 11), (t = dd(null, t, e, n, l)))
              break e
            } else if (a === fs) {
              ;((t.tag = 14), (t = yd(null, t, e, n, l)))
              break e
            }
          }
          throw ((t = Ic(e) || e), Error(z(306, t, '')))
        }
      }
      return t
    case 0:
      return Af(e, t, t.type, t.pendingProps, l)
    case 1:
      return ((n = t.type), (a = Ln(n, t.pendingProps)), gd(e, t, n, a, l))
    case 3:
      e: {
        if ((Vi(t, t.stateNode.containerInfo), e === null)) throw Error(z(387))
        n = t.pendingProps
        var u = t.memoizedState
        ;((a = u.element), gf(e, t), ou(t, n, null, l))
        var i = t.memoizedState
        if (
          ((n = i.cache),
          Wl(t, He, n),
          n !== u.cache && hf(t, [He], l, !0),
          su(),
          (n = i.element),
          u.isDehydrated)
        )
          if (
            ((u = { element: n, isDehydrated: !1, cache: i.cache }),
            (t.updateQueue.baseState = u),
            (t.memoizedState = u),
            t.flags & 256)
          ) {
            t = bd(e, t, n, l)
            break e
          } else if (n !== a) {
            ;((a = Bt(Error(z(424)), t)), Mu(a), (t = bd(e, t, n, l)))
            break e
          } else {
            switch (((e = t.stateNode.containerInfo), e.nodeType)) {
              case 9:
                e = e.body
                break
              default:
                e = e.nodeName === 'HTML' ? e.ownerDocument.body : e
            }
            for (
              be = wt(e.firstChild),
                We = t,
                ee = !0,
                an = null,
                Ht = !0,
                l = jm(t, null, n, l),
                t.child = l;
              l;

            )
              ((l.flags = (l.flags & -3) | 4096), (l = l.sibling))
          }
        else {
          if ((wn(), n === a)) {
            t = Hl(e, t, l)
            break e
          }
          Qe(e, t, n, l)
        }
        t = t.child
      }
      return t
    case 26:
      return (
        Ci(e, t),
        e === null
          ? (l = jd(t.type, null, t.pendingProps, null))
            ? (t.memoizedState = l)
            : ee ||
              ((l = t.type),
              (e = t.pendingProps),
              (n = ir(nn.current).createElement(l)),
              (n[Ke] = t),
              (n[ft] = e),
              Fe(n, l, e),
              Xe(n),
              (t.stateNode = n))
          : (t.memoizedState = jd(t.type, e.memoizedProps, t.pendingProps, e.memoizedState)),
        null
      )
    case 27:
      return (
        ef(t),
        e === null &&
          ee &&
          ((n = t.stateNode = Sv(t.type, t.pendingProps, nn.current)),
          (We = t),
          (Ht = !0),
          (a = be),
          pn(t.type) ? ((Lf = a), (be = wt(n.firstChild))) : (be = a)),
        Qe(e, t, t.pendingProps.children, l),
        Ci(e, t),
        e === null && (t.flags |= 4194304),
        t.child
      )
    case 5:
      return (
        e === null &&
          ee &&
          ((a = n = be) &&
            ((n = k1(n, t.type, t.pendingProps, Ht)),
            n !== null
              ? ((t.stateNode = n), (We = t), (be = wt(n.firstChild)), (Ht = !1), (a = !0))
              : (a = !1)),
          a || mn(t)),
        ef(t),
        (a = t.type),
        (u = t.pendingProps),
        (i = e !== null ? e.memoizedProps : null),
        (n = u.children),
        wf(a, u) ? (n = null) : i !== null && wf(a, i) && (t.flags |= 32),
        t.memoizedState !== null && ((a = xs(e, t, u1, null, null, l)), (xu._currentValue = a)),
        Ci(e, t),
        Qe(e, t, n, l),
        t.child
      )
    case 6:
      return (
        e === null &&
          ee &&
          ((e = l = be) &&
            ((l = Z1(l, t.pendingProps, Ht)),
            l !== null ? ((t.stateNode = l), (We = t), (be = null), (e = !0)) : (e = !1)),
          e || mn(t)),
        null
      )
    case 13:
      return Ch(e, t, l)
    case 4:
      return (
        Vi(t, t.stateNode.containerInfo),
        (n = t.pendingProps),
        e === null ? (t.child = jn(t, null, n, l)) : Qe(e, t, n, l),
        t.child
      )
    case 11:
      return dd(e, t, t.type, t.pendingProps, l)
    case 7:
      return (Qe(e, t, t.pendingProps, l), t.child)
    case 8:
      return (Qe(e, t, t.pendingProps.children, l), t.child)
    case 12:
      return (Qe(e, t, t.pendingProps.children, l), t.child)
    case 10:
      return ((n = t.pendingProps), Wl(t, t.type, n.value), Qe(e, t, n.children, l), t.child)
    case 9:
      return (
        (a = t.type._context),
        (n = t.pendingProps.children),
        Vn(t),
        (a = Je(a)),
        (n = n(a)),
        (t.flags |= 1),
        Qe(e, t, n, l),
        t.child
      )
    case 14:
      return yd(e, t, t.type, t.pendingProps, l)
    case 15:
      return Ah(e, t, t.type, t.pendingProps, l)
    case 19:
      return zh(e, t, l)
    case 31:
      return y1(e, t, l)
    case 22:
      return Th(e, t, l, t.pendingProps)
    case 24:
      return (
        Vn(t),
        (n = Je(He)),
        e === null
          ? ((a = As()),
            a === null &&
              ((a = se),
              (u = Ms()),
              (a.pooledCache = u),
              u.refCount++,
              u !== null && (a.pooledCacheLanes |= l),
              (a = u)),
            (t.memoizedState = { parent: n, cache: a }),
            Cs(t),
            Wl(t, He, a))
          : (e.lanes & l && (gf(e, t), ou(t, null, null, l), su()),
            (a = e.memoizedState),
            (u = t.memoizedState),
            a.parent !== n
              ? ((a = { parent: n, cache: n }),
                (t.memoizedState = a),
                t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a),
                Wl(t, He, n))
              : ((n = u.cache), Wl(t, He, n), n !== a.cache && hf(t, [He], l, !0))),
        Qe(e, t, t.pendingProps.children, l),
        t.child
      )
    case 29:
      throw t.pendingProps
  }
  throw Error(z(156, t.tag))
}
function hl(e) {
  e.flags |= 4
}
function Tc(e, t, l, n, a) {
  if (((t = (e.mode & 32) !== 0) && (t = !1), t)) {
    if (((e.flags |= 16777216), (a & 335544128) === a))
      if (e.stateNode.complete) e.flags |= 8192
      else if (ev()) e.flags |= 8192
      else throw ((Bn = Qi), Ts)
  } else e.flags &= -16777217
}
function Sd(e, t) {
  if (t.type !== 'stylesheet' || t.state.loading & 4) e.flags &= -16777217
  else if (((e.flags |= 16777216), !Ov(t)))
    if (ev()) e.flags |= 8192
    else throw ((Bn = Qi), Ts)
}
function ri(e, t) {
  ;(t !== null && (e.flags |= 4),
    e.flags & 16384 && ((t = e.tag !== 22 ? tm() : 536870912), (e.lanes |= t), (Ra |= t)))
}
function Ja(e, t) {
  if (!ee)
    switch (e.tailMode) {
      case 'hidden':
        t = e.tail
        for (var l = null; t !== null; ) (t.alternate !== null && (l = t), (t = t.sibling))
        l === null ? (e.tail = null) : (l.sibling = null)
        break
      case 'collapsed':
        l = e.tail
        for (var n = null; l !== null; ) (l.alternate !== null && (n = l), (l = l.sibling))
        n === null
          ? t || e.tail === null
            ? (e.tail = null)
            : (e.tail.sibling = null)
          : (n.sibling = null)
    }
}
function ve(e) {
  var t = e.alternate !== null && e.alternate.child === e.child,
    l = 0,
    n = 0
  if (t)
    for (var a = e.child; a !== null; )
      ((l |= a.lanes | a.childLanes),
        (n |= a.subtreeFlags & 65011712),
        (n |= a.flags & 65011712),
        (a.return = e),
        (a = a.sibling))
  else
    for (a = e.child; a !== null; )
      ((l |= a.lanes | a.childLanes),
        (n |= a.subtreeFlags),
        (n |= a.flags),
        (a.return = e),
        (a = a.sibling))
  return ((e.subtreeFlags |= n), (e.childLanes = l), t)
}
function h1(e, t, l) {
  var n = t.pendingProps
  switch ((_s(t), t.tag)) {
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return (ve(t), null)
    case 1:
      return (ve(t), null)
    case 3:
      return (
        (l = t.stateNode),
        (n = null),
        e !== null && (n = e.memoizedState.cache),
        t.memoizedState.cache !== n && (t.flags |= 2048),
        zl(He),
        Aa(),
        l.pendingContext && ((l.context = l.pendingContext), (l.pendingContext = null)),
        (e === null || e.child === null) &&
          (Fn(t)
            ? hl(t)
            : e === null ||
              (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
              ((t.flags |= 1024), bc())),
        ve(t),
        null
      )
    case 26:
      var a = t.type,
        u = t.memoizedState
      return (
        e === null
          ? (hl(t), u !== null ? (ve(t), Sd(t, u)) : (ve(t), Tc(t, a, null, n, l)))
          : u
            ? u !== e.memoizedState
              ? (hl(t), ve(t), Sd(t, u))
              : (ve(t), (t.flags &= -16777217))
            : ((e = e.memoizedProps), e !== n && hl(t), ve(t), Tc(t, a, e, n, l)),
        null
      )
    case 27:
      if ((ji(t), (l = nn.current), (a = t.type), e !== null && t.stateNode != null))
        e.memoizedProps !== n && hl(t)
      else {
        if (!n) {
          if (t.stateNode === null) throw Error(z(166))
          return (ve(t), null)
        }
        ;((e = ul.current), Fn(t) ? Jo(t) : ((e = Sv(a, n, l)), (t.stateNode = e), hl(t)))
      }
      return (ve(t), null)
    case 5:
      if ((ji(t), (a = t.type), e !== null && t.stateNode != null)) e.memoizedProps !== n && hl(t)
      else {
        if (!n) {
          if (t.stateNode === null) throw Error(z(166))
          return (ve(t), null)
        }
        if (((u = ul.current), Fn(t))) Jo(t)
        else {
          var i = ir(nn.current)
          switch (u) {
            case 1:
              u = i.createElementNS('http://www.w3.org/2000/svg', a)
              break
            case 2:
              u = i.createElementNS('http://www.w3.org/1998/Math/MathML', a)
              break
            default:
              switch (a) {
                case 'svg':
                  u = i.createElementNS('http://www.w3.org/2000/svg', a)
                  break
                case 'math':
                  u = i.createElementNS('http://www.w3.org/1998/Math/MathML', a)
                  break
                case 'script':
                  ;((u = i.createElement('div')),
                    (u.innerHTML = '<script><\/script>'),
                    (u = u.removeChild(u.firstChild)))
                  break
                case 'select':
                  ;((u =
                    typeof n.is == 'string'
                      ? i.createElement('select', { is: n.is })
                      : i.createElement('select')),
                    n.multiple ? (u.multiple = !0) : n.size && (u.size = n.size))
                  break
                default:
                  u =
                    typeof n.is == 'string' ? i.createElement(a, { is: n.is }) : i.createElement(a)
              }
          }
          ;((u[Ke] = t), (u[ft] = n))
          e: for (i = t.child; i !== null; ) {
            if (i.tag === 5 || i.tag === 6) u.appendChild(i.stateNode)
            else if (i.tag !== 4 && i.tag !== 27 && i.child !== null) {
              ;((i.child.return = i), (i = i.child))
              continue
            }
            if (i === t) break e
            for (; i.sibling === null; ) {
              if (i.return === null || i.return === t) break e
              i = i.return
            }
            ;((i.sibling.return = i.return), (i = i.sibling))
          }
          t.stateNode = u
          e: switch ((Fe(u, a, n), a)) {
            case 'button':
            case 'input':
            case 'select':
            case 'textarea':
              n = !!n.autoFocus
              break e
            case 'img':
              n = !0
              break e
            default:
              n = !1
          }
          n && hl(t)
        }
      }
      return (ve(t), Tc(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, l), null)
    case 6:
      if (e && t.stateNode != null) e.memoizedProps !== n && hl(t)
      else {
        if (typeof n != 'string' && t.stateNode === null) throw Error(z(166))
        if (((e = nn.current), Fn(t))) {
          if (((e = t.stateNode), (l = t.memoizedProps), (n = null), (a = We), a !== null))
            switch (a.tag) {
              case 27:
              case 5:
                n = a.memoizedProps
            }
          ;((e[Ke] = t),
            (e = !!(
              e.nodeValue === l ||
              (n !== null && n.suppressHydrationWarning === !0) ||
              vv(e.nodeValue, l)
            )),
            e || mn(t, !0))
        } else ((e = ir(e).createTextNode(n)), (e[Ke] = t), (t.stateNode = e))
      }
      return (ve(t), null)
    case 31:
      if (((l = t.memoizedState), e === null || e.memoizedState !== null)) {
        if (((n = Fn(t)), l !== null)) {
          if (e === null) {
            if (!n) throw Error(z(318))
            if (((e = t.memoizedState), (e = e !== null ? e.dehydrated : null), !e))
              throw Error(z(557))
            e[Ke] = t
          } else (wn(), !(t.flags & 128) && (t.memoizedState = null), (t.flags |= 4))
          ;(ve(t), (e = !1))
        } else
          ((l = bc()),
            e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = l),
            (e = !0))
        if (!e) return t.flags & 256 ? (gt(t), t) : (gt(t), null)
        if (t.flags & 128) throw Error(z(558))
      }
      return (ve(t), null)
    case 13:
      if (
        ((n = t.memoizedState),
        e === null || (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
      ) {
        if (((a = Fn(t)), n !== null && n.dehydrated !== null)) {
          if (e === null) {
            if (!a) throw Error(z(318))
            if (((a = t.memoizedState), (a = a !== null ? a.dehydrated : null), !a))
              throw Error(z(317))
            a[Ke] = t
          } else (wn(), !(t.flags & 128) && (t.memoizedState = null), (t.flags |= 4))
          ;(ve(t), (a = !1))
        } else
          ((a = bc()),
            e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a),
            (a = !0))
        if (!a) return t.flags & 256 ? (gt(t), t) : (gt(t), null)
      }
      return (
        gt(t),
        t.flags & 128
          ? ((t.lanes = l), t)
          : ((l = n !== null),
            (e = e !== null && e.memoizedState !== null),
            l &&
              ((n = t.child),
              (a = null),
              n.alternate !== null &&
                n.alternate.memoizedState !== null &&
                n.alternate.memoizedState.cachePool !== null &&
                (a = n.alternate.memoizedState.cachePool.pool),
              (u = null),
              n.memoizedState !== null &&
                n.memoizedState.cachePool !== null &&
                (u = n.memoizedState.cachePool.pool),
              u !== a && (n.flags |= 2048)),
            l !== e && l && (t.child.flags |= 8192),
            ri(t, t.updateQueue),
            ve(t),
            null)
      )
    case 4:
      return (Aa(), e === null && $s(t.stateNode.containerInfo), ve(t), null)
    case 10:
      return (zl(t.type), ve(t), null)
    case 19:
      if ((ke(ze), (n = t.memoizedState), n === null)) return (ve(t), null)
      if (((a = (t.flags & 128) !== 0), (u = n.rendering), u === null))
        if (a) Ja(n, !1)
        else {
          if (Ae !== 0 || (e !== null && e.flags & 128))
            for (e = t.child; e !== null; ) {
              if (((u = Wi(e)), u !== null)) {
                for (
                  t.flags |= 128,
                    Ja(n, !1),
                    e = u.updateQueue,
                    t.updateQueue = e,
                    ri(t, e),
                    t.subtreeFlags = 0,
                    e = l,
                    l = t.child;
                  l !== null;

                )
                  (xm(l, e), (l = l.sibling))
                return (he(ze, (ze.current & 1) | 2), ee && Sl(t, n.treeForkCount), t.child)
              }
              e = e.sibling
            }
          n.tail !== null &&
            Et() > er &&
            ((t.flags |= 128), (a = !0), Ja(n, !1), (t.lanes = 4194304))
        }
      else {
        if (!a)
          if (((e = Wi(u)), e !== null)) {
            if (
              ((t.flags |= 128),
              (a = !0),
              (e = e.updateQueue),
              (t.updateQueue = e),
              ri(t, e),
              Ja(n, !0),
              n.tail === null && n.tailMode === 'hidden' && !u.alternate && !ee)
            )
              return (ve(t), null)
          } else
            2 * Et() - n.renderingStartTime > er &&
              l !== 536870912 &&
              ((t.flags |= 128), (a = !0), Ja(n, !1), (t.lanes = 4194304))
        n.isBackwards
          ? ((u.sibling = t.child), (t.child = u))
          : ((e = n.last), e !== null ? (e.sibling = u) : (t.child = u), (n.last = u))
      }
      return n.tail !== null
        ? ((e = n.tail),
          (n.rendering = e),
          (n.tail = e.sibling),
          (n.renderingStartTime = Et()),
          (e.sibling = null),
          (l = ze.current),
          he(ze, a ? (l & 1) | 2 : l & 1),
          ee && Sl(t, n.treeForkCount),
          e)
        : (ve(t), null)
    case 22:
    case 23:
      return (
        gt(t),
        zs(),
        (n = t.memoizedState !== null),
        e !== null ? (e.memoizedState !== null) !== n && (t.flags |= 8192) : n && (t.flags |= 8192),
        n
          ? l & 536870912 && !(t.flags & 128) && (ve(t), t.subtreeFlags & 6 && (t.flags |= 8192))
          : ve(t),
        (l = t.updateQueue),
        l !== null && ri(t, l.retryQueue),
        (l = null),
        e !== null &&
          e.memoizedState !== null &&
          e.memoizedState.cachePool !== null &&
          (l = e.memoizedState.cachePool.pool),
        (n = null),
        t.memoizedState !== null &&
          t.memoizedState.cachePool !== null &&
          (n = t.memoizedState.cachePool.pool),
        n !== l && (t.flags |= 2048),
        e !== null && ke(Un),
        null
      )
    case 24:
      return (
        (l = null),
        e !== null && (l = e.memoizedState.cache),
        t.memoizedState.cache !== l && (t.flags |= 2048),
        zl(He),
        ve(t),
        null
      )
    case 25:
      return null
    case 30:
      return null
  }
  throw Error(z(156, t.tag))
}
function v1(e, t) {
  switch ((_s(t), t.tag)) {
    case 1:
      return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null)
    case 3:
      return (
        zl(He),
        Aa(),
        (e = t.flags),
        e & 65536 && !(e & 128) ? ((t.flags = (e & -65537) | 128), t) : null
      )
    case 26:
    case 27:
    case 5:
      return (ji(t), null)
    case 31:
      if (t.memoizedState !== null) {
        if ((gt(t), t.alternate === null)) throw Error(z(340))
        wn()
      }
      return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null)
    case 13:
      if ((gt(t), (e = t.memoizedState), e !== null && e.dehydrated !== null)) {
        if (t.alternate === null) throw Error(z(340))
        wn()
      }
      return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null)
    case 19:
      return (ke(ze), null)
    case 4:
      return (Aa(), null)
    case 10:
      return (zl(t.type), null)
    case 22:
    case 23:
      return (
        gt(t),
        zs(),
        e !== null && ke(Un),
        (e = t.flags),
        e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
      )
    case 24:
      return (zl(He), null)
    case 25:
      return null
    default:
      return null
  }
}
function xh(e, t) {
  switch ((_s(t), t.tag)) {
    case 3:
      ;(zl(He), Aa())
      break
    case 26:
    case 27:
    case 5:
      ji(t)
      break
    case 4:
      Aa()
      break
    case 31:
      t.memoizedState !== null && gt(t)
      break
    case 13:
      gt(t)
      break
    case 19:
      ke(ze)
      break
    case 10:
      zl(t.type)
      break
    case 22:
    case 23:
      ;(gt(t), zs(), e !== null && ke(Un))
      break
    case 24:
      zl(He)
  }
}
function Xu(e, t) {
  try {
    var l = t.updateQueue,
      n = l !== null ? l.lastEffect : null
    if (n !== null) {
      var a = n.next
      l = a
      do {
        if ((l.tag & e) === e) {
          n = void 0
          var u = l.create,
            i = l.inst
          ;((n = u()), (i.destroy = n))
        }
        l = l.next
      } while (l !== a)
    }
  } catch (r) {
    ie(t, t.return, r)
  }
}
function hn(e, t, l) {
  try {
    var n = t.updateQueue,
      a = n !== null ? n.lastEffect : null
    if (a !== null) {
      var u = a.next
      n = u
      do {
        if ((n.tag & e) === e) {
          var i = n.inst,
            r = i.destroy
          if (r !== void 0) {
            ;((i.destroy = void 0), (a = t))
            var c = l,
              f = r
            try {
              f()
            } catch (d) {
              ie(a, c, d)
            }
          }
        }
        n = n.next
      } while (n !== u)
    }
  } catch (d) {
    ie(t, t.return, d)
  }
}
function Rh(e) {
  var t = e.updateQueue
  if (t !== null) {
    var l = e.stateNode
    try {
      Lm(t, l)
    } catch (n) {
      ie(e, e.return, n)
    }
  }
}
function Uh(e, t, l) {
  ;((l.props = Ln(e.type, e.memoizedProps)), (l.state = e.memoizedState))
  try {
    l.componentWillUnmount()
  } catch (n) {
    ie(e, t, n)
  }
}
function yu(e, t) {
  try {
    var l = e.ref
    if (l !== null) {
      switch (e.tag) {
        case 26:
        case 27:
        case 5:
          var n = e.stateNode
          break
        case 30:
          n = e.stateNode
          break
        default:
          n = e.stateNode
      }
      typeof l == 'function' ? (e.refCleanup = l(n)) : (l.current = n)
    }
  } catch (a) {
    ie(e, t, a)
  }
}
function nl(e, t) {
  var l = e.ref,
    n = e.refCleanup
  if (l !== null)
    if (typeof n == 'function')
      try {
        n()
      } catch (a) {
        ie(e, t, a)
      } finally {
        ;((e.refCleanup = null), (e = e.alternate), e != null && (e.refCleanup = null))
      }
    else if (typeof l == 'function')
      try {
        l(null)
      } catch (a) {
        ie(e, t, a)
      }
    else l.current = null
}
function Bh(e) {
  var t = e.type,
    l = e.memoizedProps,
    n = e.stateNode
  try {
    e: switch (t) {
      case 'button':
      case 'input':
      case 'select':
      case 'textarea':
        l.autoFocus && n.focus()
        break e
      case 'img':
        l.src ? (n.src = l.src) : l.srcSet && (n.srcset = l.srcSet)
    }
  } catch (a) {
    ie(e, e.return, a)
  }
}
function Cc(e, t, l) {
  try {
    var n = e.stateNode
    ;(V1(n, e.type, l, t), (n[ft] = t))
  } catch (a) {
    ie(e, e.return, a)
  }
}
function Hh(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 26 || (e.tag === 27 && pn(e.type)) || e.tag === 4
}
function zc(e) {
  e: for (;;) {
    for (; e.sibling === null; ) {
      if (e.return === null || Hh(e.return)) return null
      e = e.return
    }
    for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
      if ((e.tag === 27 && pn(e.type)) || e.flags & 2 || e.child === null || e.tag === 4) continue e
      ;((e.child.return = e), (e = e.child))
    }
    if (!(e.flags & 2)) return e.stateNode
  }
}
function Cf(e, t, l) {
  var n = e.tag
  if (n === 5 || n === 6)
    ((e = e.stateNode),
      t
        ? (l.nodeType === 9
            ? l.body
            : l.nodeName === 'HTML'
              ? l.ownerDocument.body
              : l
          ).insertBefore(e, t)
        : ((t = l.nodeType === 9 ? l.body : l.nodeName === 'HTML' ? l.ownerDocument.body : l),
          t.appendChild(e),
          (l = l._reactRootContainer),
          l != null || t.onclick !== null || (t.onclick = _l)))
  else if (
    n !== 4 &&
    (n === 27 && pn(e.type) && ((l = e.stateNode), (t = null)), (e = e.child), e !== null)
  )
    for (Cf(e, t, l), e = e.sibling; e !== null; ) (Cf(e, t, l), (e = e.sibling))
}
function Pi(e, t, l) {
  var n = e.tag
  if (n === 5 || n === 6) ((e = e.stateNode), t ? l.insertBefore(e, t) : l.appendChild(e))
  else if (n !== 4 && (n === 27 && pn(e.type) && (l = e.stateNode), (e = e.child), e !== null))
    for (Pi(e, t, l), e = e.sibling; e !== null; ) (Pi(e, t, l), (e = e.sibling))
}
function Yh(e) {
  var t = e.stateNode,
    l = e.memoizedProps
  try {
    for (var n = e.type, a = t.attributes; a.length; ) t.removeAttributeNode(a[0])
    ;(Fe(t, n, l), (t[Ke] = e), (t[ft] = l))
  } catch (u) {
    ie(e, e.return, u)
  }
}
var El = !1,
  Be = !1,
  Nc = !1,
  Ed = typeof WeakSet == 'function' ? WeakSet : Set,
  Ge = null
function g1(e, t) {
  if (((e = e.containerInfo), (Hf = sr), (e = Om(e)), ps(e))) {
    if ('selectionStart' in e) var l = { start: e.selectionStart, end: e.selectionEnd }
    else
      e: {
        l = ((l = e.ownerDocument) && l.defaultView) || window
        var n = l.getSelection && l.getSelection()
        if (n && n.rangeCount !== 0) {
          l = n.anchorNode
          var a = n.anchorOffset,
            u = n.focusNode
          n = n.focusOffset
          try {
            ;(l.nodeType, u.nodeType)
          } catch {
            l = null
            break e
          }
          var i = 0,
            r = -1,
            c = -1,
            f = 0,
            d = 0,
            y = e,
            o = null
          t: for (;;) {
            for (
              var v;
              y !== l || (a !== 0 && y.nodeType !== 3) || (r = i + a),
                y !== u || (n !== 0 && y.nodeType !== 3) || (c = i + n),
                y.nodeType === 3 && (i += y.nodeValue.length),
                (v = y.firstChild) !== null;

            )
              ((o = y), (y = v))
            for (;;) {
              if (y === e) break t
              if (
                (o === l && ++f === a && (r = i),
                o === u && ++d === n && (c = i),
                (v = y.nextSibling) !== null)
              )
                break
              ;((y = o), (o = y.parentNode))
            }
            y = v
          }
          l = r === -1 || c === -1 ? null : { start: r, end: c }
        } else l = null
      }
    l = l || { start: 0, end: 0 }
  } else l = null
  for (Yf = { focusedElem: e, selectionRange: l }, sr = !1, Ge = t; Ge !== null; )
    if (((t = Ge), (e = t.child), (t.subtreeFlags & 1028) !== 0 && e !== null))
      ((e.return = t), (Ge = e))
    else
      for (; Ge !== null; ) {
        switch (((t = Ge), (u = t.alternate), (e = t.flags), t.tag)) {
          case 0:
            if (e & 4 && ((e = t.updateQueue), (e = e !== null ? e.events : null), e !== null))
              for (l = 0; l < e.length; l++) ((a = e[l]), (a.ref.impl = a.nextImpl))
            break
          case 11:
          case 15:
            break
          case 1:
            if (e & 1024 && u !== null) {
              ;((e = void 0),
                (l = t),
                (a = u.memoizedProps),
                (u = u.memoizedState),
                (n = l.stateNode))
              try {
                var _ = Ln(l.type, a)
                ;((e = n.getSnapshotBeforeUpdate(_, u)),
                  (n.__reactInternalSnapshotBeforeUpdate = e))
              } catch (p) {
                ie(l, l.return, p)
              }
            }
            break
          case 3:
            if (e & 1024) {
              if (((e = t.stateNode.containerInfo), (l = e.nodeType), l === 9)) Vf(e)
              else if (l === 1)
                switch (e.nodeName) {
                  case 'HEAD':
                  case 'HTML':
                  case 'BODY':
                    Vf(e)
                    break
                  default:
                    e.textContent = ''
                }
            }
            break
          case 5:
          case 26:
          case 27:
          case 6:
          case 4:
          case 17:
            break
          default:
            if (e & 1024) throw Error(z(163))
        }
        if (((e = t.sibling), e !== null)) {
          ;((e.return = t.return), (Ge = e))
          break
        }
        Ge = t.return
      }
}
function wh(e, t, l) {
  var n = l.flags
  switch (l.tag) {
    case 0:
    case 11:
    case 15:
      ;(gl(e, l), n & 4 && Xu(5, l))
      break
    case 1:
      if ((gl(e, l), n & 4))
        if (((e = l.stateNode), t === null))
          try {
            e.componentDidMount()
          } catch (i) {
            ie(l, l.return, i)
          }
        else {
          var a = Ln(l.type, t.memoizedProps)
          t = t.memoizedState
          try {
            e.componentDidUpdate(a, t, e.__reactInternalSnapshotBeforeUpdate)
          } catch (i) {
            ie(l, l.return, i)
          }
        }
      ;(n & 64 && Rh(l), n & 512 && yu(l, l.return))
      break
    case 3:
      if ((gl(e, l), n & 64 && ((e = l.updateQueue), e !== null))) {
        if (((t = null), l.child !== null))
          switch (l.child.tag) {
            case 27:
            case 5:
              t = l.child.stateNode
              break
            case 1:
              t = l.child.stateNode
          }
        try {
          Lm(e, t)
        } catch (i) {
          ie(l, l.return, i)
        }
      }
      break
    case 27:
      t === null && n & 4 && Yh(l)
    case 26:
    case 5:
      ;(gl(e, l), t === null && n & 4 && Bh(l), n & 512 && yu(l, l.return))
      break
    case 12:
      gl(e, l)
      break
    case 31:
      ;(gl(e, l), n & 4 && qh(e, l))
      break
    case 13:
      ;(gl(e, l),
        n & 4 && Lh(e, l),
        n & 64 &&
          ((e = l.memoizedState),
          e !== null && ((e = e.dehydrated), e !== null && ((l = A1.bind(null, l)), Q1(e, l)))))
      break
    case 22:
      if (((n = l.memoizedState !== null || El), !n)) {
        ;((t = (t !== null && t.memoizedState !== null) || Be), (a = El))
        var u = Be
        ;((El = n),
          (Be = t) && !u ? pl(e, l, (l.subtreeFlags & 8772) !== 0) : gl(e, l),
          (El = a),
          (Be = u))
      }
      break
    case 30:
      break
    default:
      gl(e, l)
  }
}
function Vh(e) {
  var t = e.alternate
  ;(t !== null && ((e.alternate = null), Vh(t)),
    (e.child = null),
    (e.deletions = null),
    (e.sibling = null),
    e.tag === 5 && ((t = e.stateNode), t !== null && ys(t)),
    (e.stateNode = null),
    (e.return = null),
    (e.dependencies = null),
    (e.memoizedProps = null),
    (e.memoizedState = null),
    (e.pendingProps = null),
    (e.stateNode = null),
    (e.updateQueue = null))
}
var Ee = null,
  at = !1
function vl(e, t, l) {
  for (l = l.child; l !== null; ) (jh(e, t, l), (l = l.sibling))
}
function jh(e, t, l) {
  if (Dt && typeof Dt.onCommitFiberUnmount == 'function')
    try {
      Dt.onCommitFiberUnmount(Yu, l)
    } catch {}
  switch (l.tag) {
    case 26:
      ;(Be || nl(l, t),
        vl(e, t, l),
        l.memoizedState
          ? l.memoizedState.count--
          : l.stateNode && ((l = l.stateNode), l.parentNode.removeChild(l)))
      break
    case 27:
      Be || nl(l, t)
      var n = Ee,
        a = at
      ;(pn(l.type) && ((Ee = l.stateNode), (at = !1)),
        vl(e, t, l),
        gu(l.stateNode),
        (Ee = n),
        (at = a))
      break
    case 5:
      Be || nl(l, t)
    case 6:
      if (((n = Ee), (a = at), (Ee = null), vl(e, t, l), (Ee = n), (at = a), Ee !== null))
        if (at)
          try {
            ;(Ee.nodeType === 9
              ? Ee.body
              : Ee.nodeName === 'HTML'
                ? Ee.ownerDocument.body
                : Ee
            ).removeChild(l.stateNode)
          } catch (u) {
            ie(l, t, u)
          }
        else
          try {
            Ee.removeChild(l.stateNode)
          } catch (u) {
            ie(l, t, u)
          }
      break
    case 18:
      Ee !== null &&
        (at
          ? ((e = Ee),
            Bd(
              e.nodeType === 9 ? e.body : e.nodeName === 'HTML' ? e.ownerDocument.body : e,
              l.stateNode,
            ),
            Ya(e))
          : Bd(Ee, l.stateNode))
      break
    case 4:
      ;((n = Ee),
        (a = at),
        (Ee = l.stateNode.containerInfo),
        (at = !0),
        vl(e, t, l),
        (Ee = n),
        (at = a))
      break
    case 0:
    case 11:
    case 14:
    case 15:
      ;(hn(2, l, t), Be || hn(4, l, t), vl(e, t, l))
      break
    case 1:
      ;(Be ||
        (nl(l, t), (n = l.stateNode), typeof n.componentWillUnmount == 'function' && Uh(l, t, n)),
        vl(e, t, l))
      break
    case 21:
      vl(e, t, l)
      break
    case 22:
      ;((Be = (n = Be) || l.memoizedState !== null), vl(e, t, l), (Be = n))
      break
    default:
      vl(e, t, l)
  }
}
function qh(e, t) {
  if (
    t.memoizedState === null &&
    ((e = t.alternate), e !== null && ((e = e.memoizedState), e !== null))
  ) {
    e = e.dehydrated
    try {
      Ya(e)
    } catch (l) {
      ie(t, t.return, l)
    }
  }
}
function Lh(e, t) {
  if (
    t.memoizedState === null &&
    ((e = t.alternate),
    e !== null && ((e = e.memoizedState), e !== null && ((e = e.dehydrated), e !== null)))
  )
    try {
      Ya(e)
    } catch (l) {
      ie(t, t.return, l)
    }
}
function b1(e) {
  switch (e.tag) {
    case 31:
    case 13:
    case 19:
      var t = e.stateNode
      return (t === null && (t = e.stateNode = new Ed()), t)
    case 22:
      return (
        (e = e.stateNode),
        (t = e._retryCache),
        t === null && (t = e._retryCache = new Ed()),
        t
      )
    default:
      throw Error(z(435, e.tag))
  }
}
function ci(e, t) {
  var l = b1(e)
  t.forEach(function (n) {
    if (!l.has(n)) {
      l.add(n)
      var a = T1.bind(null, e, n)
      n.then(a, a)
    }
  })
}
function lt(e, t) {
  var l = t.deletions
  if (l !== null)
    for (var n = 0; n < l.length; n++) {
      var a = l[n],
        u = e,
        i = t,
        r = i
      e: for (; r !== null; ) {
        switch (r.tag) {
          case 27:
            if (pn(r.type)) {
              ;((Ee = r.stateNode), (at = !1))
              break e
            }
            break
          case 5:
            ;((Ee = r.stateNode), (at = !1))
            break e
          case 3:
          case 4:
            ;((Ee = r.stateNode.containerInfo), (at = !0))
            break e
        }
        r = r.return
      }
      if (Ee === null) throw Error(z(160))
      ;(jh(u, i, a),
        (Ee = null),
        (at = !1),
        (u = a.alternate),
        u !== null && (u.return = null),
        (a.return = null))
    }
  if (t.subtreeFlags & 13886) for (t = t.child; t !== null; ) (Gh(t, e), (t = t.sibling))
}
var kt = null
function Gh(e, t) {
  var l = e.alternate,
    n = e.flags
  switch (e.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      ;(lt(t, e), nt(e), n & 4 && (hn(3, e, e.return), Xu(3, e), hn(5, e, e.return)))
      break
    case 1:
      ;(lt(t, e),
        nt(e),
        n & 512 && (Be || l === null || nl(l, l.return)),
        n & 64 &&
          El &&
          ((e = e.updateQueue),
          e !== null &&
            ((n = e.callbacks),
            n !== null &&
              ((l = e.shared.hiddenCallbacks),
              (e.shared.hiddenCallbacks = l === null ? n : l.concat(n))))))
      break
    case 26:
      var a = kt
      if ((lt(t, e), nt(e), n & 512 && (Be || l === null || nl(l, l.return)), n & 4)) {
        var u = l !== null ? l.memoizedState : null
        if (((n = e.memoizedState), l === null))
          if (n === null)
            if (e.stateNode === null) {
              e: {
                ;((n = e.type), (l = e.memoizedProps), (a = a.ownerDocument || a))
                t: switch (n) {
                  case 'title':
                    ;((u = a.getElementsByTagName('title')[0]),
                      (!u ||
                        u[ju] ||
                        u[Ke] ||
                        u.namespaceURI === 'http://www.w3.org/2000/svg' ||
                        u.hasAttribute('itemprop')) &&
                        ((u = a.createElement(n)),
                        a.head.insertBefore(u, a.querySelector('head > title'))),
                      Fe(u, n, l),
                      (u[Ke] = e),
                      Xe(u),
                      (n = u))
                    break e
                  case 'link':
                    var i = Ld('link', 'href', a).get(n + (l.href || ''))
                    if (i) {
                      for (var r = 0; r < i.length; r++)
                        if (
                          ((u = i[r]),
                          u.getAttribute('href') ===
                            (l.href == null || l.href === '' ? null : l.href) &&
                            u.getAttribute('rel') === (l.rel == null ? null : l.rel) &&
                            u.getAttribute('title') === (l.title == null ? null : l.title) &&
                            u.getAttribute('crossorigin') ===
                              (l.crossOrigin == null ? null : l.crossOrigin))
                        ) {
                          i.splice(r, 1)
                          break t
                        }
                    }
                    ;((u = a.createElement(n)), Fe(u, n, l), a.head.appendChild(u))
                    break
                  case 'meta':
                    if ((i = Ld('meta', 'content', a).get(n + (l.content || '')))) {
                      for (r = 0; r < i.length; r++)
                        if (
                          ((u = i[r]),
                          u.getAttribute('content') ===
                            (l.content == null ? null : '' + l.content) &&
                            u.getAttribute('name') === (l.name == null ? null : l.name) &&
                            u.getAttribute('property') ===
                              (l.property == null ? null : l.property) &&
                            u.getAttribute('http-equiv') ===
                              (l.httpEquiv == null ? null : l.httpEquiv) &&
                            u.getAttribute('charset') === (l.charSet == null ? null : l.charSet))
                        ) {
                          i.splice(r, 1)
                          break t
                        }
                    }
                    ;((u = a.createElement(n)), Fe(u, n, l), a.head.appendChild(u))
                    break
                  default:
                    throw Error(z(468, n))
                }
                ;((u[Ke] = e), Xe(u), (n = u))
              }
              e.stateNode = n
            } else Gd(a, e.type, e.stateNode)
          else e.stateNode = qd(a, n, e.memoizedProps)
        else
          u !== n
            ? (u === null
                ? l.stateNode !== null && ((l = l.stateNode), l.parentNode.removeChild(l))
                : u.count--,
              n === null ? Gd(a, e.type, e.stateNode) : qd(a, n, e.memoizedProps))
            : n === null && e.stateNode !== null && Cc(e, e.memoizedProps, l.memoizedProps)
      }
      break
    case 27:
      ;(lt(t, e),
        nt(e),
        n & 512 && (Be || l === null || nl(l, l.return)),
        l !== null && n & 4 && Cc(e, e.memoizedProps, l.memoizedProps))
      break
    case 5:
      if ((lt(t, e), nt(e), n & 512 && (Be || l === null || nl(l, l.return)), e.flags & 32)) {
        a = e.stateNode
        try {
          Ca(a, '')
        } catch (_) {
          ie(e, e.return, _)
        }
      }
      ;(n & 4 &&
        e.stateNode != null &&
        ((a = e.memoizedProps), Cc(e, a, l !== null ? l.memoizedProps : a)),
        n & 1024 && (Nc = !0))
      break
    case 6:
      if ((lt(t, e), nt(e), n & 4)) {
        if (e.stateNode === null) throw Error(z(162))
        ;((n = e.memoizedProps), (l = e.stateNode))
        try {
          l.nodeValue = n
        } catch (_) {
          ie(e, e.return, _)
        }
      }
      break
    case 3:
      if (
        ((xi = null),
        (a = kt),
        (kt = rr(t.containerInfo)),
        lt(t, e),
        (kt = a),
        nt(e),
        n & 4 && l !== null && l.memoizedState.isDehydrated)
      )
        try {
          Ya(t.containerInfo)
        } catch (_) {
          ie(e, e.return, _)
        }
      Nc && ((Nc = !1), Xh(e))
      break
    case 4:
      ;((n = kt), (kt = rr(e.stateNode.containerInfo)), lt(t, e), nt(e), (kt = n))
      break
    case 12:
      ;(lt(t, e), nt(e))
      break
    case 31:
      ;(lt(t, e),
        nt(e),
        n & 4 && ((n = e.updateQueue), n !== null && ((e.updateQueue = null), ci(e, n))))
      break
    case 13:
      ;(lt(t, e),
        nt(e),
        e.child.flags & 8192 &&
          (e.memoizedState !== null) != (l !== null && l.memoizedState !== null) &&
          (Ur = Et()),
        n & 4 && ((n = e.updateQueue), n !== null && ((e.updateQueue = null), ci(e, n))))
      break
    case 22:
      a = e.memoizedState !== null
      var c = l !== null && l.memoizedState !== null,
        f = El,
        d = Be
      if (((El = f || a), (Be = d || c), lt(t, e), (Be = d), (El = f), nt(e), n & 8192))
        e: for (
          t = e.stateNode,
            t._visibility = a ? t._visibility & -2 : t._visibility | 1,
            a && (l === null || c || El || Be || Cn(e)),
            l = null,
            t = e;
          ;

        ) {
          if (t.tag === 5 || t.tag === 26) {
            if (l === null) {
              c = l = t
              try {
                if (((u = c.stateNode), a))
                  ((i = u.style),
                    typeof i.setProperty == 'function'
                      ? i.setProperty('display', 'none', 'important')
                      : (i.display = 'none'))
                else {
                  r = c.stateNode
                  var y = c.memoizedProps.style,
                    o = y != null && y.hasOwnProperty('display') ? y.display : null
                  r.style.display = o == null || typeof o == 'boolean' ? '' : ('' + o).trim()
                }
              } catch (_) {
                ie(c, c.return, _)
              }
            }
          } else if (t.tag === 6) {
            if (l === null) {
              c = t
              try {
                c.stateNode.nodeValue = a ? '' : c.memoizedProps
              } catch (_) {
                ie(c, c.return, _)
              }
            }
          } else if (t.tag === 18) {
            if (l === null) {
              c = t
              try {
                var v = c.stateNode
                a ? Hd(v, !0) : Hd(c.stateNode, !1)
              } catch (_) {
                ie(c, c.return, _)
              }
            }
          } else if (
            ((t.tag !== 22 && t.tag !== 23) || t.memoizedState === null || t === e) &&
            t.child !== null
          ) {
            ;((t.child.return = t), (t = t.child))
            continue
          }
          if (t === e) break e
          for (; t.sibling === null; ) {
            if (t.return === null || t.return === e) break e
            ;(l === t && (l = null), (t = t.return))
          }
          ;(l === t && (l = null), (t.sibling.return = t.return), (t = t.sibling))
        }
      n & 4 &&
        ((n = e.updateQueue),
        n !== null && ((l = n.retryQueue), l !== null && ((n.retryQueue = null), ci(e, l))))
      break
    case 19:
      ;(lt(t, e),
        nt(e),
        n & 4 && ((n = e.updateQueue), n !== null && ((e.updateQueue = null), ci(e, n))))
      break
    case 30:
      break
    case 21:
      break
    default:
      ;(lt(t, e), nt(e))
  }
}
function nt(e) {
  var t = e.flags
  if (t & 2) {
    try {
      for (var l, n = e.return; n !== null; ) {
        if (Hh(n)) {
          l = n
          break
        }
        n = n.return
      }
      if (l == null) throw Error(z(160))
      switch (l.tag) {
        case 27:
          var a = l.stateNode,
            u = zc(e)
          Pi(e, u, a)
          break
        case 5:
          var i = l.stateNode
          l.flags & 32 && (Ca(i, ''), (l.flags &= -33))
          var r = zc(e)
          Pi(e, r, i)
          break
        case 3:
        case 4:
          var c = l.stateNode.containerInfo,
            f = zc(e)
          Cf(e, f, c)
          break
        default:
          throw Error(z(161))
      }
    } catch (d) {
      ie(e, e.return, d)
    }
    e.flags &= -3
  }
  t & 4096 && (e.flags &= -4097)
}
function Xh(e) {
  if (e.subtreeFlags & 1024)
    for (e = e.child; e !== null; ) {
      var t = e
      ;(Xh(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), (e = e.sibling))
    }
}
function gl(e, t) {
  if (t.subtreeFlags & 8772)
    for (t = t.child; t !== null; ) (wh(e, t.alternate, t), (t = t.sibling))
}
function Cn(e) {
  for (e = e.child; e !== null; ) {
    var t = e
    switch (t.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        ;(hn(4, t, t.return), Cn(t))
        break
      case 1:
        nl(t, t.return)
        var l = t.stateNode
        ;(typeof l.componentWillUnmount == 'function' && Uh(t, t.return, l), Cn(t))
        break
      case 27:
        gu(t.stateNode)
      case 26:
      case 5:
        ;(nl(t, t.return), Cn(t))
        break
      case 22:
        t.memoizedState === null && Cn(t)
        break
      case 30:
        Cn(t)
        break
      default:
        Cn(t)
    }
    e = e.sibling
  }
}
function pl(e, t, l) {
  for (l = l && (t.subtreeFlags & 8772) !== 0, t = t.child; t !== null; ) {
    var n = t.alternate,
      a = e,
      u = t,
      i = u.flags
    switch (u.tag) {
      case 0:
      case 11:
      case 15:
        ;(pl(a, u, l), Xu(4, u))
        break
      case 1:
        if ((pl(a, u, l), (n = u), (a = n.stateNode), typeof a.componentDidMount == 'function'))
          try {
            a.componentDidMount()
          } catch (f) {
            ie(n, n.return, f)
          }
        if (((n = u), (a = n.updateQueue), a !== null)) {
          var r = n.stateNode
          try {
            var c = a.shared.hiddenCallbacks
            if (c !== null)
              for (a.shared.hiddenCallbacks = null, a = 0; a < c.length; a++) qm(c[a], r)
          } catch (f) {
            ie(n, n.return, f)
          }
        }
        ;(l && i & 64 && Rh(u), yu(u, u.return))
        break
      case 27:
        Yh(u)
      case 26:
      case 5:
        ;(pl(a, u, l), l && n === null && i & 4 && Bh(u), yu(u, u.return))
        break
      case 12:
        pl(a, u, l)
        break
      case 31:
        ;(pl(a, u, l), l && i & 4 && qh(a, u))
        break
      case 13:
        ;(pl(a, u, l), l && i & 4 && Lh(a, u))
        break
      case 22:
        ;(u.memoizedState === null && pl(a, u, l), yu(u, u.return))
        break
      case 30:
        break
      default:
        pl(a, u, l)
    }
    t = t.sibling
  }
}
function Zs(e, t) {
  var l = null
  ;(e !== null &&
    e.memoizedState !== null &&
    e.memoizedState.cachePool !== null &&
    (l = e.memoizedState.cachePool.pool),
    (e = null),
    t.memoizedState !== null &&
      t.memoizedState.cachePool !== null &&
      (e = t.memoizedState.cachePool.pool),
    e !== l && (e != null && e.refCount++, l != null && Lu(l)))
}
function Qs(e, t) {
  ;((e = null),
    t.alternate !== null && (e = t.alternate.memoizedState.cache),
    (t = t.memoizedState.cache),
    t !== e && (t.refCount++, e != null && Lu(e)))
}
function Gt(e, t, l, n) {
  if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) (kh(e, t, l, n), (t = t.sibling))
}
function kh(e, t, l, n) {
  var a = t.flags
  switch (t.tag) {
    case 0:
    case 11:
    case 15:
      ;(Gt(e, t, l, n), a & 2048 && Xu(9, t))
      break
    case 1:
      Gt(e, t, l, n)
      break
    case 3:
      ;(Gt(e, t, l, n),
        a & 2048 &&
          ((e = null),
          t.alternate !== null && (e = t.alternate.memoizedState.cache),
          (t = t.memoizedState.cache),
          t !== e && (t.refCount++, e != null && Lu(e))))
      break
    case 12:
      if (a & 2048) {
        ;(Gt(e, t, l, n), (e = t.stateNode))
        try {
          var u = t.memoizedProps,
            i = u.id,
            r = u.onPostCommit
          typeof r == 'function' &&
            r(i, t.alternate === null ? 'mount' : 'update', e.passiveEffectDuration, -0)
        } catch (c) {
          ie(t, t.return, c)
        }
      } else Gt(e, t, l, n)
      break
    case 31:
      Gt(e, t, l, n)
      break
    case 13:
      Gt(e, t, l, n)
      break
    case 23:
      break
    case 22:
      ;((u = t.stateNode),
        (i = t.alternate),
        t.memoizedState !== null
          ? u._visibility & 2
            ? Gt(e, t, l, n)
            : mu(e, t)
          : u._visibility & 2
            ? Gt(e, t, l, n)
            : ((u._visibility |= 2), na(e, t, l, n, (t.subtreeFlags & 10256) !== 0 || !1)),
        a & 2048 && Zs(i, t))
      break
    case 24:
      ;(Gt(e, t, l, n), a & 2048 && Qs(t.alternate, t))
      break
    default:
      Gt(e, t, l, n)
  }
}
function na(e, t, l, n, a) {
  for (a = a && ((t.subtreeFlags & 10256) !== 0 || !1), t = t.child; t !== null; ) {
    var u = e,
      i = t,
      r = l,
      c = n,
      f = i.flags
    switch (i.tag) {
      case 0:
      case 11:
      case 15:
        ;(na(u, i, r, c, a), Xu(8, i))
        break
      case 23:
        break
      case 22:
        var d = i.stateNode
        ;(i.memoizedState !== null
          ? d._visibility & 2
            ? na(u, i, r, c, a)
            : mu(u, i)
          : ((d._visibility |= 2), na(u, i, r, c, a)),
          a && f & 2048 && Zs(i.alternate, i))
        break
      case 24:
        ;(na(u, i, r, c, a), a && f & 2048 && Qs(i.alternate, i))
        break
      default:
        na(u, i, r, c, a)
    }
    t = t.sibling
  }
}
function mu(e, t) {
  if (t.subtreeFlags & 10256)
    for (t = t.child; t !== null; ) {
      var l = e,
        n = t,
        a = n.flags
      switch (n.tag) {
        case 22:
          ;(mu(l, n), a & 2048 && Zs(n.alternate, n))
          break
        case 24:
          ;(mu(l, n), a & 2048 && Qs(n.alternate, n))
          break
        default:
          mu(l, n)
      }
      t = t.sibling
    }
}
var nu = 8192
function $n(e, t, l) {
  if (e.subtreeFlags & nu) for (e = e.child; e !== null; ) (Zh(e, t, l), (e = e.sibling))
}
function Zh(e, t, l) {
  switch (e.tag) {
    case 26:
      ;($n(e, t, l),
        e.flags & nu && e.memoizedState !== null && ap(l, kt, e.memoizedState, e.memoizedProps))
      break
    case 5:
      $n(e, t, l)
      break
    case 3:
    case 4:
      var n = kt
      ;((kt = rr(e.stateNode.containerInfo)), $n(e, t, l), (kt = n))
      break
    case 22:
      e.memoizedState === null &&
        ((n = e.alternate),
        n !== null && n.memoizedState !== null
          ? ((n = nu), (nu = 16777216), $n(e, t, l), (nu = n))
          : $n(e, t, l))
      break
    default:
      $n(e, t, l)
  }
}
function Qh(e) {
  var t = e.alternate
  if (t !== null && ((e = t.child), e !== null)) {
    t.child = null
    do ((t = e.sibling), (e.sibling = null), (e = t))
    while (e !== null)
  }
}
function Fa(e) {
  var t = e.deletions
  if (e.flags & 16) {
    if (t !== null)
      for (var l = 0; l < t.length; l++) {
        var n = t[l]
        ;((Ge = n), Wh(n, e))
      }
    Qh(e)
  }
  if (e.subtreeFlags & 10256) for (e = e.child; e !== null; ) (Kh(e), (e = e.sibling))
}
function Kh(e) {
  switch (e.tag) {
    case 0:
    case 11:
    case 15:
      ;(Fa(e), e.flags & 2048 && hn(9, e, e.return))
      break
    case 3:
      Fa(e)
      break
    case 12:
      Fa(e)
      break
    case 22:
      var t = e.stateNode
      e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13)
        ? ((t._visibility &= -3), zi(e))
        : Fa(e)
      break
    default:
      Fa(e)
  }
}
function zi(e) {
  var t = e.deletions
  if (e.flags & 16) {
    if (t !== null)
      for (var l = 0; l < t.length; l++) {
        var n = t[l]
        ;((Ge = n), Wh(n, e))
      }
    Qh(e)
  }
  for (e = e.child; e !== null; ) {
    switch (((t = e), t.tag)) {
      case 0:
      case 11:
      case 15:
        ;(hn(8, t, t.return), zi(t))
        break
      case 22:
        ;((l = t.stateNode), l._visibility & 2 && ((l._visibility &= -3), zi(t)))
        break
      default:
        zi(t)
    }
    e = e.sibling
  }
}
function Wh(e, t) {
  for (; Ge !== null; ) {
    var l = Ge
    switch (l.tag) {
      case 0:
      case 11:
      case 15:
        hn(8, l, t)
        break
      case 23:
      case 22:
        if (l.memoizedState !== null && l.memoizedState.cachePool !== null) {
          var n = l.memoizedState.cachePool.pool
          n != null && n.refCount++
        }
        break
      case 24:
        Lu(l.memoizedState.cache)
    }
    if (((n = l.child), n !== null)) ((n.return = l), (Ge = n))
    else
      e: for (l = e; Ge !== null; ) {
        n = Ge
        var a = n.sibling,
          u = n.return
        if ((Vh(n), n === l)) {
          Ge = null
          break e
        }
        if (a !== null) {
          ;((a.return = u), (Ge = a))
          break e
        }
        Ge = u
      }
  }
}
var p1 = {
    getCacheForType: function (e) {
      var t = Je(He),
        l = t.data.get(e)
      return (l === void 0 && ((l = e()), t.data.set(e, l)), l)
    },
    cacheSignal: function () {
      return Je(He).controller.signal
    },
  },
  S1 = typeof WeakMap == 'function' ? WeakMap : Map,
  ne = 0,
  se = null,
  $ = null,
  I = 0,
  ue = 0,
  mt = null,
  en = !1,
  Ga = !1,
  Ks = !1,
  Yl = 0,
  Ae = 0,
  vn = 0,
  Hn = 0,
  Ws = 0,
  St = 0,
  Ra = 0,
  hu = null,
  it = null,
  zf = !1,
  Ur = 0,
  Jh = 0,
  er = 1 / 0,
  tr = null,
  cn = null,
  qe = 0,
  fn = null,
  Ua = null,
  Nl = 0,
  Nf = 0,
  xf = null,
  Fh = null,
  vu = 0,
  Rf = null
function _t() {
  return ne & 2 && I !== 0 ? I & -I : L.T !== null ? Fs() : um()
}
function $h() {
  if (St === 0)
    if (!(I & 536870912) || ee) {
      var e = ei
      ;((ei <<= 1), !(ei & 3932160) && (ei = 262144), (St = e))
    } else St = 536870912
  return ((e = At.current), e !== null && (e.flags |= 32), St)
}
function ct(e, t, l) {
  ;(((e === se && (ue === 2 || ue === 9)) || e.cancelPendingCommit !== null) &&
    (Ba(e, 0), tn(e, I, St, !1)),
    Vu(e, l),
    (!(ne & 2) || e !== se) &&
      (e === se && (!(ne & 2) && (Hn |= l), Ae === 4 && tn(e, I, St, !1)), rl(e)))
}
function Ih(e, t, l) {
  if (ne & 6) throw Error(z(327))
  var n = (!l && (t & 127) === 0 && (t & e.expiredLanes) === 0) || wu(e, t),
    a = n ? O1(e, t) : xc(e, t, !0),
    u = n
  do {
    if (a === 0) {
      Ga && !n && tn(e, t, 0, !1)
      break
    } else {
      if (((l = e.current.alternate), u && !E1(l))) {
        ;((a = xc(e, t, !1)), (u = !1))
        continue
      }
      if (a === 2) {
        if (((u = t), e.errorRecoveryDisabledLanes & u)) var i = 0
        else ((i = e.pendingLanes & -536870913), (i = i !== 0 ? i : i & 536870912 ? 536870912 : 0))
        if (i !== 0) {
          t = i
          e: {
            var r = e
            a = hu
            var c = r.current.memoizedState.isDehydrated
            if ((c && (Ba(r, i).flags |= 256), (i = xc(r, i, !1)), i !== 2)) {
              if (Ks && !c) {
                ;((r.errorRecoveryDisabledLanes |= u), (Hn |= u), (a = 4))
                break e
              }
              ;((u = it), (it = a), u !== null && (it === null ? (it = u) : it.push.apply(it, u)))
            }
            a = i
          }
          if (((u = !1), a !== 2)) continue
        }
      }
      if (a === 1) {
        ;(Ba(e, 0), tn(e, t, 0, !0))
        break
      }
      e: {
        switch (((n = e), (u = a), u)) {
          case 0:
          case 1:
            throw Error(z(345))
          case 4:
            if ((t & 4194048) !== t) break
          case 6:
            tn(n, t, St, !en)
            break e
          case 2:
            it = null
            break
          case 3:
          case 5:
            break
          default:
            throw Error(z(329))
        }
        if ((t & 62914560) === t && ((a = Ur + 300 - Et()), 10 < a)) {
          if ((tn(n, t, St, !en), Dr(n, 0, !0) !== 0)) break e
          ;((Nl = t),
            (n.timeoutHandle = bv(
              Dd.bind(null, n, l, it, tr, zf, t, St, Hn, Ra, en, u, 'Throttled', -0, 0),
              a,
            )))
          break e
        }
        Dd(n, l, it, tr, zf, t, St, Hn, Ra, en, u, null, -0, 0)
      }
    }
    break
  } while (!0)
  rl(e)
}
function Dd(e, t, l, n, a, u, i, r, c, f, d, y, o, v) {
  if (((e.timeoutHandle = -1), (y = t.subtreeFlags), y & 8192 || (y & 16785408) === 16785408)) {
    ;((y = {
      stylesheets: null,
      count: 0,
      imgCount: 0,
      imgBytes: 0,
      suspenseyImages: [],
      waitingForImages: !0,
      waitingForViewTransition: !1,
      unsuspend: _l,
    }),
      Zh(t, u, y))
    var _ = (u & 62914560) === u ? Ur - Et() : (u & 4194048) === u ? Jh - Et() : 0
    if (((_ = up(y, _)), _ !== null)) {
      ;((Nl = u),
        (e.cancelPendingCommit = _(_d.bind(null, e, t, u, l, n, a, i, r, c, d, y, null, o, v))),
        tn(e, u, i, !f))
      return
    }
  }
  _d(e, t, u, l, n, a, i, r, c)
}
function E1(e) {
  for (var t = e; ; ) {
    var l = t.tag
    if (
      (l === 0 || l === 11 || l === 15) &&
      t.flags & 16384 &&
      ((l = t.updateQueue), l !== null && ((l = l.stores), l !== null))
    )
      for (var n = 0; n < l.length; n++) {
        var a = l[n],
          u = a.getSnapshot
        a = a.value
        try {
          if (!Mt(u(), a)) return !1
        } catch {
          return !1
        }
      }
    if (((l = t.child), t.subtreeFlags & 16384 && l !== null)) ((l.return = t), (t = l))
    else {
      if (t === e) break
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e) return !0
        t = t.return
      }
      ;((t.sibling.return = t.return), (t = t.sibling))
    }
  }
  return !0
}
function tn(e, t, l, n) {
  ;((t &= ~Ws),
    (t &= ~Hn),
    (e.suspendedLanes |= t),
    (e.pingedLanes &= ~t),
    n && (e.warmLanes |= t),
    (n = e.expirationTimes))
  for (var a = t; 0 < a; ) {
    var u = 31 - Ot(a),
      i = 1 << u
    ;((n[u] = -1), (a &= ~i))
  }
  l !== 0 && lm(e, l, t)
}
function Br() {
  return ne & 6 ? !0 : (ku(0), !1)
}
function Js() {
  if ($ !== null) {
    if (ue === 0) var e = $.return
    else ((e = $), (Ml = Qn = null), Bs(e), (Da = null), (Au = 0), (e = $))
    for (; e !== null; ) (xh(e.alternate, e), (e = e.return))
    $ = null
  }
}
function Ba(e, t) {
  var l = e.timeoutHandle
  ;(l !== -1 && ((e.timeoutHandle = -1), L1(l)),
    (l = e.cancelPendingCommit),
    l !== null && ((e.cancelPendingCommit = null), l()),
    (Nl = 0),
    Js(),
    (se = e),
    ($ = l = Cl(e.current, null)),
    (I = t),
    (ue = 0),
    (mt = null),
    (en = !1),
    (Ga = wu(e, t)),
    (Ks = !1),
    (Ra = St = Ws = Hn = vn = Ae = 0),
    (it = hu = null),
    (zf = !1),
    t & 8 && (t |= t & 32))
  var n = e.entangledLanes
  if (n !== 0)
    for (e = e.entanglements, n &= t; 0 < n; ) {
      var a = 31 - Ot(n),
        u = 1 << a
      ;((t |= e[a]), (n &= ~u))
    }
  return ((Yl = t), Ar(), l)
}
function Ph(e, t) {
  ;((K = null),
    (L.H = Cu),
    t === La || t === Cr
      ? ((t = ed()), (ue = 3))
      : t === Ts
        ? ((t = ed()), (ue = 4))
        : (ue =
            t === Xs
              ? 8
              : t !== null && typeof t == 'object' && typeof t.then == 'function'
                ? 6
                : 1),
    (mt = t),
    $ === null && ((Ae = 1), $i(e, Bt(t, e.current))))
}
function ev() {
  var e = At.current
  return e === null
    ? !0
    : (I & 4194048) === I
      ? Yt === null
      : (I & 62914560) === I || I & 536870912
        ? e === Yt
        : !1
}
function tv() {
  var e = L.H
  return ((L.H = Cu), e === null ? Cu : e)
}
function lv() {
  var e = L.A
  return ((L.A = p1), e)
}
function lr() {
  ;((Ae = 4),
    en || ((I & 4194048) !== I && At.current !== null) || (Ga = !0),
    (!(vn & 134217727) && !(Hn & 134217727)) || se === null || tn(se, I, St, !1))
}
function xc(e, t, l) {
  var n = ne
  ne |= 2
  var a = tv(),
    u = lv()
  ;((se !== e || I !== t) && ((tr = null), Ba(e, t)), (t = !1))
  var i = Ae
  e: do
    try {
      if (ue !== 0 && $ !== null) {
        var r = $,
          c = mt
        switch (ue) {
          case 8:
            ;(Js(), (i = 6))
            break e
          case 3:
          case 2:
          case 9:
          case 6:
            At.current === null && (t = !0)
            var f = ue
            if (((ue = 0), (mt = null), ga(e, r, c, f), l && Ga)) {
              i = 0
              break e
            }
            break
          default:
            ;((f = ue), (ue = 0), (mt = null), ga(e, r, c, f))
        }
      }
      ;(D1(), (i = Ae))
      break
    } catch (d) {
      Ph(e, d)
    }
  while (!0)
  return (
    t && e.shellSuspendCounter++,
    (Ml = Qn = null),
    (ne = n),
    (L.H = a),
    (L.A = u),
    $ === null && ((se = null), (I = 0), Ar()),
    i
  )
}
function D1() {
  for (; $ !== null; ) nv($)
}
function O1(e, t) {
  var l = ne
  ne |= 2
  var n = tv(),
    a = lv()
  se !== e || I !== t ? ((tr = null), (er = Et() + 500), Ba(e, t)) : (Ga = wu(e, t))
  e: do
    try {
      if (ue !== 0 && $ !== null) {
        t = $
        var u = mt
        t: switch (ue) {
          case 1:
            ;((ue = 0), (mt = null), ga(e, t, u, 1))
            break
          case 2:
          case 9:
            if (Po(u)) {
              ;((ue = 0), (mt = null), Od(t))
              break
            }
            ;((t = function () {
              ;((ue !== 2 && ue !== 9) || se !== e || (ue = 7), rl(e))
            }),
              u.then(t, t))
            break e
          case 3:
            ue = 7
            break e
          case 4:
            ue = 5
            break e
          case 7:
            Po(u) ? ((ue = 0), (mt = null), Od(t)) : ((ue = 0), (mt = null), ga(e, t, u, 7))
            break
          case 5:
            var i = null
            switch ($.tag) {
              case 26:
                i = $.memoizedState
              case 5:
              case 27:
                var r = $
                if (i ? Ov(i) : r.stateNode.complete) {
                  ;((ue = 0), (mt = null))
                  var c = r.sibling
                  if (c !== null) $ = c
                  else {
                    var f = r.return
                    f !== null ? (($ = f), Hr(f)) : ($ = null)
                  }
                  break t
                }
            }
            ;((ue = 0), (mt = null), ga(e, t, u, 5))
            break
          case 6:
            ;((ue = 0), (mt = null), ga(e, t, u, 6))
            break
          case 8:
            ;(Js(), (Ae = 6))
            break e
          default:
            throw Error(z(462))
        }
      }
      _1()
      break
    } catch (d) {
      Ph(e, d)
    }
  while (!0)
  return (
    (Ml = Qn = null),
    (L.H = n),
    (L.A = a),
    (ne = l),
    $ !== null ? 0 : ((se = null), (I = 0), Ar(), Ae)
  )
}
function _1() {
  for (; $ !== null && !K0(); ) nv($)
}
function nv(e) {
  var t = Nh(e.alternate, e, Yl)
  ;((e.memoizedProps = e.pendingProps), t === null ? Hr(e) : ($ = t))
}
function Od(e) {
  var t = e,
    l = t.alternate
  switch (t.tag) {
    case 15:
    case 0:
      t = vd(l, t, t.pendingProps, t.type, void 0, I)
      break
    case 11:
      t = vd(l, t, t.pendingProps, t.type.render, t.ref, I)
      break
    case 5:
      Bs(t)
    default:
      ;(xh(l, t), (t = $ = xm(t, Yl)), (t = Nh(l, t, Yl)))
  }
  ;((e.memoizedProps = e.pendingProps), t === null ? Hr(e) : ($ = t))
}
function ga(e, t, l, n) {
  ;((Ml = Qn = null), Bs(t), (Da = null), (Au = 0))
  var a = t.return
  try {
    if (d1(e, a, t, l, I)) {
      ;((Ae = 1), $i(e, Bt(l, e.current)), ($ = null))
      return
    }
  } catch (u) {
    if (a !== null) throw (($ = a), u)
    ;((Ae = 1), $i(e, Bt(l, e.current)), ($ = null))
    return
  }
  t.flags & 32768
    ? (ee || n === 1
        ? (e = !0)
        : Ga || I & 536870912
          ? (e = !1)
          : ((en = e = !0),
            (n === 2 || n === 9 || n === 3 || n === 6) &&
              ((n = At.current), n !== null && n.tag === 13 && (n.flags |= 16384))),
      av(t, e))
    : Hr(t)
}
function Hr(e) {
  var t = e
  do {
    if (t.flags & 32768) {
      av(t, en)
      return
    }
    e = t.return
    var l = h1(t.alternate, t, Yl)
    if (l !== null) {
      $ = l
      return
    }
    if (((t = t.sibling), t !== null)) {
      $ = t
      return
    }
    $ = t = e
  } while (t !== null)
  Ae === 0 && (Ae = 5)
}
function av(e, t) {
  do {
    var l = v1(e.alternate, e)
    if (l !== null) {
      ;((l.flags &= 32767), ($ = l))
      return
    }
    if (
      ((l = e.return),
      l !== null && ((l.flags |= 32768), (l.subtreeFlags = 0), (l.deletions = null)),
      !t && ((e = e.sibling), e !== null))
    ) {
      $ = e
      return
    }
    $ = e = l
  } while (e !== null)
  ;((Ae = 6), ($ = null))
}
function _d(e, t, l, n, a, u, i, r, c) {
  e.cancelPendingCommit = null
  do Yr()
  while (qe !== 0)
  if (ne & 6) throw Error(z(327))
  if (t !== null) {
    if (t === e.current) throw Error(z(177))
    if (
      ((u = t.lanes | t.childLanes),
      (u |= Ss),
      nb(e, l, u, i, r, c),
      e === se && (($ = se = null), (I = 0)),
      (Ua = t),
      (fn = e),
      (Nl = l),
      (Nf = u),
      (xf = a),
      (Fh = n),
      t.subtreeFlags & 10256 || t.flags & 10256
        ? ((e.callbackNode = null),
          (e.callbackPriority = 0),
          C1(qi, function () {
            return (fv(), null)
          }))
        : ((e.callbackNode = null), (e.callbackPriority = 0)),
      (n = (t.flags & 13878) !== 0),
      t.subtreeFlags & 13878 || n)
    ) {
      ;((n = L.T), (L.T = null), (a = ae.p), (ae.p = 2), (i = ne), (ne |= 4))
      try {
        g1(e, t, l)
      } finally {
        ;((ne = i), (ae.p = a), (L.T = n))
      }
    }
    ;((qe = 1), uv(), iv(), rv())
  }
}
function uv() {
  if (qe === 1) {
    qe = 0
    var e = fn,
      t = Ua,
      l = (t.flags & 13878) !== 0
    if (t.subtreeFlags & 13878 || l) {
      ;((l = L.T), (L.T = null))
      var n = ae.p
      ae.p = 2
      var a = ne
      ne |= 4
      try {
        Gh(t, e)
        var u = Yf,
          i = Om(e.containerInfo),
          r = u.focusedElem,
          c = u.selectionRange
        if (i !== r && r && r.ownerDocument && Dm(r.ownerDocument.documentElement, r)) {
          if (c !== null && ps(r)) {
            var f = c.start,
              d = c.end
            if ((d === void 0 && (d = f), 'selectionStart' in r))
              ((r.selectionStart = f), (r.selectionEnd = Math.min(d, r.value.length)))
            else {
              var y = r.ownerDocument || document,
                o = (y && y.defaultView) || window
              if (o.getSelection) {
                var v = o.getSelection(),
                  _ = r.textContent.length,
                  p = Math.min(c.start, _),
                  A = c.end === void 0 ? p : Math.min(c.end, _)
                !v.extend && p > A && ((i = A), (A = p), (p = i))
                var h = Qo(r, p),
                  s = Qo(r, A)
                if (
                  h &&
                  s &&
                  (v.rangeCount !== 1 ||
                    v.anchorNode !== h.node ||
                    v.anchorOffset !== h.offset ||
                    v.focusNode !== s.node ||
                    v.focusOffset !== s.offset)
                ) {
                  var m = y.createRange()
                  ;(m.setStart(h.node, h.offset),
                    v.removeAllRanges(),
                    p > A
                      ? (v.addRange(m), v.extend(s.node, s.offset))
                      : (m.setEnd(s.node, s.offset), v.addRange(m)))
                }
              }
            }
          }
          for (y = [], v = r; (v = v.parentNode); )
            v.nodeType === 1 && y.push({ element: v, left: v.scrollLeft, top: v.scrollTop })
          for (typeof r.focus == 'function' && r.focus(), r = 0; r < y.length; r++) {
            var b = y[r]
            ;((b.element.scrollLeft = b.left), (b.element.scrollTop = b.top))
          }
        }
        ;((sr = !!Hf), (Yf = Hf = null))
      } finally {
        ;((ne = a), (ae.p = n), (L.T = l))
      }
    }
    ;((e.current = t), (qe = 2))
  }
}
function iv() {
  if (qe === 2) {
    qe = 0
    var e = fn,
      t = Ua,
      l = (t.flags & 8772) !== 0
    if (t.subtreeFlags & 8772 || l) {
      ;((l = L.T), (L.T = null))
      var n = ae.p
      ae.p = 2
      var a = ne
      ne |= 4
      try {
        wh(e, t.alternate, t)
      } finally {
        ;((ne = a), (ae.p = n), (L.T = l))
      }
    }
    qe = 3
  }
}
function rv() {
  if (qe === 4 || qe === 3) {
    ;((qe = 0), W0())
    var e = fn,
      t = Ua,
      l = Nl,
      n = Fh
    t.subtreeFlags & 10256 || t.flags & 10256
      ? (qe = 5)
      : ((qe = 0), (Ua = fn = null), cv(e, e.pendingLanes))
    var a = e.pendingLanes
    if (
      (a === 0 && (cn = null),
      ds(l),
      (t = t.stateNode),
      Dt && typeof Dt.onCommitFiberRoot == 'function')
    )
      try {
        Dt.onCommitFiberRoot(Yu, t, void 0, (t.current.flags & 128) === 128)
      } catch {}
    if (n !== null) {
      ;((t = L.T), (a = ae.p), (ae.p = 2), (L.T = null))
      try {
        for (var u = e.onRecoverableError, i = 0; i < n.length; i++) {
          var r = n[i]
          u(r.value, { componentStack: r.stack })
        }
      } finally {
        ;((L.T = t), (ae.p = a))
      }
    }
    ;(Nl & 3 && Yr(),
      rl(e),
      (a = e.pendingLanes),
      l & 261930 && a & 42 ? (e === Rf ? vu++ : ((vu = 0), (Rf = e))) : (vu = 0),
      ku(0))
  }
}
function cv(e, t) {
  ;(e.pooledCacheLanes &= t) === 0 &&
    ((t = e.pooledCache), t != null && ((e.pooledCache = null), Lu(t)))
}
function Yr() {
  return (uv(), iv(), rv(), fv())
}
function fv() {
  if (qe !== 5) return !1
  var e = fn,
    t = Nf
  Nf = 0
  var l = ds(Nl),
    n = L.T,
    a = ae.p
  try {
    ;((ae.p = 32 > l ? 32 : l), (L.T = null), (l = xf), (xf = null))
    var u = fn,
      i = Nl
    if (((qe = 0), (Ua = fn = null), (Nl = 0), ne & 6)) throw Error(z(331))
    var r = ne
    if (
      ((ne |= 4),
      Kh(u.current),
      kh(u, u.current, i, l),
      (ne = r),
      ku(0, !1),
      Dt && typeof Dt.onPostCommitFiberRoot == 'function')
    )
      try {
        Dt.onPostCommitFiberRoot(Yu, u)
      } catch {}
    return !0
  } finally {
    ;((ae.p = a), (L.T = n), cv(e, t))
  }
}
function Md(e, t, l) {
  ;((t = Bt(l, t)), (t = Mf(e.stateNode, t, 2)), (e = rn(e, t, 2)), e !== null && (Vu(e, 2), rl(e)))
}
function ie(e, t, l) {
  if (e.tag === 3) Md(e, e, l)
  else
    for (; t !== null; ) {
      if (t.tag === 3) {
        Md(t, e, l)
        break
      } else if (t.tag === 1) {
        var n = t.stateNode
        if (
          typeof t.type.getDerivedStateFromError == 'function' ||
          (typeof n.componentDidCatch == 'function' && (cn === null || !cn.has(n)))
        ) {
          ;((e = Bt(l, e)),
            (l = _h(2)),
            (n = rn(t, l, 2)),
            n !== null && (Mh(l, n, t, e), Vu(n, 2), rl(n)))
          break
        }
      }
      t = t.return
    }
}
function Rc(e, t, l) {
  var n = e.pingCache
  if (n === null) {
    n = e.pingCache = new S1()
    var a = new Set()
    n.set(t, a)
  } else ((a = n.get(t)), a === void 0 && ((a = new Set()), n.set(t, a)))
  a.has(l) || ((Ks = !0), a.add(l), (e = M1.bind(null, e, t, l)), t.then(e, e))
}
function M1(e, t, l) {
  var n = e.pingCache
  ;(n !== null && n.delete(t),
    (e.pingedLanes |= e.suspendedLanes & l),
    (e.warmLanes &= ~l),
    se === e &&
      (I & l) === l &&
      (Ae === 4 || (Ae === 3 && (I & 62914560) === I && 300 > Et() - Ur)
        ? !(ne & 2) && Ba(e, 0)
        : (Ws |= l),
      Ra === I && (Ra = 0)),
    rl(e))
}
function sv(e, t) {
  ;(t === 0 && (t = tm()), (e = Zn(e, t)), e !== null && (Vu(e, t), rl(e)))
}
function A1(e) {
  var t = e.memoizedState,
    l = 0
  ;(t !== null && (l = t.retryLane), sv(e, l))
}
function T1(e, t) {
  var l = 0
  switch (e.tag) {
    case 31:
    case 13:
      var n = e.stateNode,
        a = e.memoizedState
      a !== null && (l = a.retryLane)
      break
    case 19:
      n = e.stateNode
      break
    case 22:
      n = e.stateNode._retryCache
      break
    default:
      throw Error(z(314))
  }
  ;(n !== null && n.delete(t), sv(e, l))
}
function C1(e, t) {
  return ss(e, t)
}
var nr = null,
  aa = null,
  Uf = !1,
  ar = !1,
  Uc = !1,
  ln = 0
function rl(e) {
  ;(e !== aa && e.next === null && (aa === null ? (nr = aa = e) : (aa = aa.next = e)),
    (ar = !0),
    Uf || ((Uf = !0), N1()))
}
function ku(e, t) {
  if (!Uc && ar) {
    Uc = !0
    do
      for (var l = !1, n = nr; n !== null; ) {
        if (e !== 0) {
          var a = n.pendingLanes
          if (a === 0) var u = 0
          else {
            var i = n.suspendedLanes,
              r = n.pingedLanes
            ;((u = (1 << (31 - Ot(42 | e) + 1)) - 1),
              (u &= a & ~(i & ~r)),
              (u = u & 201326741 ? (u & 201326741) | 1 : u ? u | 2 : 0))
          }
          u !== 0 && ((l = !0), Ad(n, u))
        } else
          ((u = I),
            (u = Dr(n, n === se ? u : 0, n.cancelPendingCommit !== null || n.timeoutHandle !== -1)),
            !(u & 3) || wu(n, u) || ((l = !0), Ad(n, u)))
        n = n.next
      }
    while (l)
    Uc = !1
  }
}
function z1() {
  ov()
}
function ov() {
  ar = Uf = !1
  var e = 0
  ln !== 0 && q1() && (e = ln)
  for (var t = Et(), l = null, n = nr; n !== null; ) {
    var a = n.next,
      u = dv(n, t)
    ;(u === 0
      ? ((n.next = null), l === null ? (nr = a) : (l.next = a), a === null && (aa = l))
      : ((l = n), (e !== 0 || u & 3) && (ar = !0)),
      (n = a))
  }
  ;((qe !== 0 && qe !== 5) || ku(e), ln !== 0 && (ln = 0))
}
function dv(e, t) {
  for (
    var l = e.suspendedLanes,
      n = e.pingedLanes,
      a = e.expirationTimes,
      u = e.pendingLanes & -62914561;
    0 < u;

  ) {
    var i = 31 - Ot(u),
      r = 1 << i,
      c = a[i]
    ;(c === -1 ? (!(r & l) || r & n) && (a[i] = lb(r, t)) : c <= t && (e.expiredLanes |= r),
      (u &= ~r))
  }
  if (
    ((t = se),
    (l = I),
    (l = Dr(e, e === t ? l : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1)),
    (n = e.callbackNode),
    l === 0 || (e === t && (ue === 2 || ue === 9)) || e.cancelPendingCommit !== null)
  )
    return (n !== null && n !== null && rc(n), (e.callbackNode = null), (e.callbackPriority = 0))
  if (!(l & 3) || wu(e, l)) {
    if (((t = l & -l), t === e.callbackPriority)) return t
    switch ((n !== null && rc(n), ds(l))) {
      case 2:
      case 8:
        l = Py
        break
      case 32:
        l = qi
        break
      case 268435456:
        l = em
        break
      default:
        l = qi
    }
    return (
      (n = yv.bind(null, e)),
      (l = ss(l, n)),
      (e.callbackPriority = t),
      (e.callbackNode = l),
      t
    )
  }
  return (n !== null && n !== null && rc(n), (e.callbackPriority = 2), (e.callbackNode = null), 2)
}
function yv(e, t) {
  if (qe !== 0 && qe !== 5) return ((e.callbackNode = null), (e.callbackPriority = 0), null)
  var l = e.callbackNode
  if (Yr() && e.callbackNode !== l) return null
  var n = I
  return (
    (n = Dr(e, e === se ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1)),
    n === 0
      ? null
      : (Ih(e, n, t),
        dv(e, Et()),
        e.callbackNode != null && e.callbackNode === l ? yv.bind(null, e) : null)
  )
}
function Ad(e, t) {
  if (Yr()) return null
  Ih(e, t, !0)
}
function N1() {
  G1(function () {
    ne & 6 ? ss(Iy, z1) : ov()
  })
}
function Fs() {
  if (ln === 0) {
    var e = za
    ;(e === 0 && ((e = Pu), (Pu <<= 1), !(Pu & 261888) && (Pu = 256)), (ln = e))
  }
  return ln
}
function Td(e) {
  return e == null || typeof e == 'symbol' || typeof e == 'boolean'
    ? null
    : typeof e == 'function'
      ? e
      : Si('' + e)
}
function Cd(e, t) {
  var l = t.ownerDocument.createElement('input')
  return (
    (l.name = t.name),
    (l.value = t.value),
    e.id && l.setAttribute('form', e.id),
    t.parentNode.insertBefore(l, t),
    (e = new FormData(e)),
    l.parentNode.removeChild(l),
    e
  )
}
function x1(e, t, l, n, a) {
  if (t === 'submit' && l && l.stateNode === a) {
    var u = Td((a[ft] || null).action),
      i = n.submitter
    i &&
      ((t = (t = i[ft] || null) ? Td(t.formAction) : i.getAttribute('formAction')),
      t !== null && ((u = t), (i = null)))
    var r = new Or('action', 'action', null, n, a)
    e.push({
      event: r,
      listeners: [
        {
          instance: null,
          listener: function () {
            if (n.defaultPrevented) {
              if (ln !== 0) {
                var c = i ? Cd(a, i) : new FormData(a)
                Of(l, { pending: !0, data: c, method: a.method, action: u }, null, c)
              }
            } else
              typeof u == 'function' &&
                (r.preventDefault(),
                (c = i ? Cd(a, i) : new FormData(a)),
                Of(l, { pending: !0, data: c, method: a.method, action: u }, u, c))
          },
          currentTarget: a,
        },
      ],
    })
  }
}
for (var Bc = 0; Bc < of.length; Bc++) {
  var Hc = of[Bc],
    R1 = Hc.toLowerCase(),
    U1 = Hc[0].toUpperCase() + Hc.slice(1)
  Wt(R1, 'on' + U1)
}
Wt(Mm, 'onAnimationEnd')
Wt(Am, 'onAnimationIteration')
Wt(Tm, 'onAnimationStart')
Wt('dblclick', 'onDoubleClick')
Wt('focusin', 'onFocus')
Wt('focusout', 'onBlur')
Wt(Jb, 'onTransitionRun')
Wt(Fb, 'onTransitionStart')
Wt($b, 'onTransitionCancel')
Wt(Cm, 'onTransitionEnd')
Ta('onMouseEnter', ['mouseout', 'mouseover'])
Ta('onMouseLeave', ['mouseout', 'mouseover'])
Ta('onPointerEnter', ['pointerout', 'pointerover'])
Ta('onPointerLeave', ['pointerout', 'pointerover'])
Gn('onChange', 'change click focusin focusout input keydown keyup selectionchange'.split(' '))
Gn(
  'onSelect',
  'focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange'.split(' '),
)
Gn('onBeforeInput', ['compositionend', 'keypress', 'textInput', 'paste'])
Gn('onCompositionEnd', 'compositionend focusout keydown keypress keyup mousedown'.split(' '))
Gn('onCompositionStart', 'compositionstart focusout keydown keypress keyup mousedown'.split(' '))
Gn('onCompositionUpdate', 'compositionupdate focusout keydown keypress keyup mousedown'.split(' '))
var zu =
    'abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting'.split(
      ' ',
    ),
  B1 = new Set(
    'beforetoggle cancel close invalid load scroll scrollend toggle'.split(' ').concat(zu),
  )
function mv(e, t) {
  t = (t & 4) !== 0
  for (var l = 0; l < e.length; l++) {
    var n = e[l],
      a = n.event
    n = n.listeners
    e: {
      var u = void 0
      if (t)
        for (var i = n.length - 1; 0 <= i; i--) {
          var r = n[i],
            c = r.instance,
            f = r.currentTarget
          if (((r = r.listener), c !== u && a.isPropagationStopped())) break e
          ;((u = r), (a.currentTarget = f))
          try {
            u(a)
          } catch (d) {
            Gi(d)
          }
          ;((a.currentTarget = null), (u = c))
        }
      else
        for (i = 0; i < n.length; i++) {
          if (
            ((r = n[i]),
            (c = r.instance),
            (f = r.currentTarget),
            (r = r.listener),
            c !== u && a.isPropagationStopped())
          )
            break e
          ;((u = r), (a.currentTarget = f))
          try {
            u(a)
          } catch (d) {
            Gi(d)
          }
          ;((a.currentTarget = null), (u = c))
        }
    }
  }
}
function F(e, t) {
  var l = t[lf]
  l === void 0 && (l = t[lf] = new Set())
  var n = e + '__bubble'
  l.has(n) || (hv(t, e, 2, !1), l.add(n))
}
function Yc(e, t, l) {
  var n = 0
  ;(t && (n |= 4), hv(l, e, n, t))
}
var fi = '_reactListening' + Math.random().toString(36).slice(2)
function $s(e) {
  if (!e[fi]) {
    ;((e[fi] = !0),
      im.forEach(function (l) {
        l !== 'selectionchange' && (B1.has(l) || Yc(l, !1, e), Yc(l, !0, e))
      }))
    var t = e.nodeType === 9 ? e : e.ownerDocument
    t === null || t[fi] || ((t[fi] = !0), Yc('selectionchange', !1, t))
  }
}
function hv(e, t, l, n) {
  switch (Cv(t)) {
    case 2:
      var a = cp
      break
    case 8:
      a = fp
      break
    default:
      a = to
  }
  ;((l = a.bind(null, t, l, e)),
    (a = void 0),
    !cf || (t !== 'touchstart' && t !== 'touchmove' && t !== 'wheel') || (a = !0),
    n
      ? a !== void 0
        ? e.addEventListener(t, l, { capture: !0, passive: a })
        : e.addEventListener(t, l, !0)
      : a !== void 0
        ? e.addEventListener(t, l, { passive: a })
        : e.addEventListener(t, l, !1))
}
function wc(e, t, l, n, a) {
  var u = n
  if (!(t & 1) && !(t & 2) && n !== null)
    e: for (;;) {
      if (n === null) return
      var i = n.tag
      if (i === 3 || i === 4) {
        var r = n.stateNode.containerInfo
        if (r === a) break
        if (i === 4)
          for (i = n.return; i !== null; ) {
            var c = i.tag
            if ((c === 3 || c === 4) && i.stateNode.containerInfo === a) return
            i = i.return
          }
        for (; r !== null; ) {
          if (((i = ca(r)), i === null)) return
          if (((c = i.tag), c === 5 || c === 6 || c === 26 || c === 27)) {
            n = u = i
            continue e
          }
          r = r.parentNode
        }
      }
      n = n.return
    }
  mm(function () {
    var f = u,
      d = hs(l),
      y = []
    e: {
      var o = zm.get(e)
      if (o !== void 0) {
        var v = Or,
          _ = e
        switch (e) {
          case 'keypress':
            if (Di(l) === 0) break e
          case 'keydown':
          case 'keyup':
            v = Tb
            break
          case 'focusin':
            ;((_ = 'focus'), (v = dc))
            break
          case 'focusout':
            ;((_ = 'blur'), (v = dc))
            break
          case 'beforeblur':
          case 'afterblur':
            v = dc
            break
          case 'click':
            if (l.button === 2) break e
          case 'auxclick':
          case 'dblclick':
          case 'mousedown':
          case 'mousemove':
          case 'mouseup':
          case 'mouseout':
          case 'mouseover':
          case 'contextmenu':
            v = Yo
            break
          case 'drag':
          case 'dragend':
          case 'dragenter':
          case 'dragexit':
          case 'dragleave':
          case 'dragover':
          case 'dragstart':
          case 'drop':
            v = hb
            break
          case 'touchcancel':
          case 'touchend':
          case 'touchmove':
          case 'touchstart':
            v = Nb
            break
          case Mm:
          case Am:
          case Tm:
            v = bb
            break
          case Cm:
            v = Rb
            break
          case 'scroll':
          case 'scrollend':
            v = yb
            break
          case 'wheel':
            v = Bb
            break
          case 'copy':
          case 'cut':
          case 'paste':
            v = Sb
            break
          case 'gotpointercapture':
          case 'lostpointercapture':
          case 'pointercancel':
          case 'pointerdown':
          case 'pointermove':
          case 'pointerout':
          case 'pointerover':
          case 'pointerup':
            v = Vo
            break
          case 'toggle':
          case 'beforetoggle':
            v = Yb
        }
        var p = (t & 4) !== 0,
          A = !p && (e === 'scroll' || e === 'scrollend'),
          h = p ? (o !== null ? o + 'Capture' : null) : o
        p = []
        for (var s = f, m; s !== null; ) {
          var b = s
          if (
            ((m = b.stateNode),
            (b = b.tag),
            (b !== 5 && b !== 26 && b !== 27) ||
              m === null ||
              h === null ||
              ((b = Eu(s, h)), b != null && p.push(Nu(s, b, m))),
            A)
          )
            break
          s = s.return
        }
        0 < p.length && ((o = new v(o, _, null, l, d)), y.push({ event: o, listeners: p }))
      }
    }
    if (!(t & 7)) {
      e: {
        if (
          ((o = e === 'mouseover' || e === 'pointerover'),
          (v = e === 'mouseout' || e === 'pointerout'),
          o && l !== rf && (_ = l.relatedTarget || l.fromElement) && (ca(_) || _[Va]))
        )
          break e
        if (
          (v || o) &&
          ((o =
            d.window === d ? d : (o = d.ownerDocument) ? o.defaultView || o.parentWindow : window),
          v
            ? ((_ = l.relatedTarget || l.toElement),
              (v = f),
              (_ = _ ? ca(_) : null),
              _ !== null &&
                ((A = Hu(_)), (p = _.tag), _ !== A || (p !== 5 && p !== 27 && p !== 6)) &&
                (_ = null))
            : ((v = null), (_ = f)),
          v !== _)
        ) {
          if (
            ((p = Yo),
            (b = 'onMouseLeave'),
            (h = 'onMouseEnter'),
            (s = 'mouse'),
            (e === 'pointerout' || e === 'pointerover') &&
              ((p = Vo), (b = 'onPointerLeave'), (h = 'onPointerEnter'), (s = 'pointer')),
            (A = v == null ? o : tu(v)),
            (m = _ == null ? o : tu(_)),
            (o = new p(b, s + 'leave', v, l, d)),
            (o.target = A),
            (o.relatedTarget = m),
            (b = null),
            ca(d) === f &&
              ((p = new p(h, s + 'enter', _, l, d)),
              (p.target = m),
              (p.relatedTarget = A),
              (b = p)),
            (A = b),
            v && _)
          )
            t: {
              for (p = H1, h = v, s = _, m = 0, b = h; b; b = p(b)) m++
              b = 0
              for (var S = s; S; S = p(S)) b++
              for (; 0 < m - b; ) ((h = p(h)), m--)
              for (; 0 < b - m; ) ((s = p(s)), b--)
              for (; m--; ) {
                if (h === s || (s !== null && h === s.alternate)) {
                  p = h
                  break t
                }
                ;((h = p(h)), (s = p(s)))
              }
              p = null
            }
          else p = null
          ;(v !== null && zd(y, o, v, p, !1), _ !== null && A !== null && zd(y, A, _, p, !0))
        }
      }
      e: {
        if (
          ((o = f ? tu(f) : window),
          (v = o.nodeName && o.nodeName.toLowerCase()),
          v === 'select' || (v === 'input' && o.type === 'file'))
        )
          var x = Go
        else if (Lo(o))
          if (Sm) x = Qb
          else {
            x = kb
            var M = Xb
          }
        else
          ((v = o.nodeName),
            !v || v.toLowerCase() !== 'input' || (o.type !== 'checkbox' && o.type !== 'radio')
              ? f && ms(f.elementType) && (x = Go)
              : (x = Zb))
        if (x && (x = x(e, f))) {
          pm(y, x, l, d)
          break e
        }
        ;(M && M(e, o, f),
          e === 'focusout' &&
            f &&
            o.type === 'number' &&
            f.memoizedProps.value != null &&
            uf(o, 'number', o.value))
      }
      switch (((M = f ? tu(f) : window), e)) {
        case 'focusin':
          ;(Lo(M) || M.contentEditable === 'true') && ((oa = M), (ff = f), (ru = null))
          break
        case 'focusout':
          ru = ff = oa = null
          break
        case 'mousedown':
          sf = !0
          break
        case 'contextmenu':
        case 'mouseup':
        case 'dragend':
          ;((sf = !1), Ko(y, l, d))
          break
        case 'selectionchange':
          if (Wb) break
        case 'keydown':
        case 'keyup':
          Ko(y, l, d)
      }
      var R
      if (bs)
        e: {
          switch (e) {
            case 'compositionstart':
              var H = 'onCompositionStart'
              break e
            case 'compositionend':
              H = 'onCompositionEnd'
              break e
            case 'compositionupdate':
              H = 'onCompositionUpdate'
              break e
          }
          H = void 0
        }
      else
        sa
          ? gm(e, l) && (H = 'onCompositionEnd')
          : e === 'keydown' && l.keyCode === 229 && (H = 'onCompositionStart')
      ;(H &&
        (vm &&
          l.locale !== 'ko' &&
          (sa || H !== 'onCompositionStart'
            ? H === 'onCompositionEnd' && sa && (R = hm())
            : ((Pl = d), (vs = 'value' in Pl ? Pl.value : Pl.textContent), (sa = !0))),
        (M = ur(f, H)),
        0 < M.length &&
          ((H = new wo(H, e, null, l, d)),
          y.push({ event: H, listeners: M }),
          R ? (H.data = R) : ((R = bm(l)), R !== null && (H.data = R)))),
        (R = Vb ? jb(e, l) : qb(e, l)) &&
          ((H = ur(f, 'onBeforeInput')),
          0 < H.length &&
            ((M = new wo('onBeforeInput', 'beforeinput', null, l, d)),
            y.push({ event: M, listeners: H }),
            (M.data = R))),
        x1(y, e, f, l, d))
    }
    mv(y, t)
  })
}
function Nu(e, t, l) {
  return { instance: e, listener: t, currentTarget: l }
}
function ur(e, t) {
  for (var l = t + 'Capture', n = []; e !== null; ) {
    var a = e,
      u = a.stateNode
    if (
      ((a = a.tag),
      (a !== 5 && a !== 26 && a !== 27) ||
        u === null ||
        ((a = Eu(e, l)),
        a != null && n.unshift(Nu(e, a, u)),
        (a = Eu(e, t)),
        a != null && n.push(Nu(e, a, u))),
      e.tag === 3)
    )
      return n
    e = e.return
  }
  return []
}
function H1(e) {
  if (e === null) return null
  do e = e.return
  while (e && e.tag !== 5 && e.tag !== 27)
  return e || null
}
function zd(e, t, l, n, a) {
  for (var u = t._reactName, i = []; l !== null && l !== n; ) {
    var r = l,
      c = r.alternate,
      f = r.stateNode
    if (((r = r.tag), c !== null && c === n)) break
    ;((r !== 5 && r !== 26 && r !== 27) ||
      f === null ||
      ((c = f),
      a
        ? ((f = Eu(l, u)), f != null && i.unshift(Nu(l, f, c)))
        : a || ((f = Eu(l, u)), f != null && i.push(Nu(l, f, c)))),
      (l = l.return))
  }
  i.length !== 0 && e.push({ event: t, listeners: i })
}
var Y1 = /\r\n?/g,
  w1 = /\u0000|\uFFFD/g
function Nd(e) {
  return (typeof e == 'string' ? e : '' + e)
    .replace(
      Y1,
      `
`,
    )
    .replace(w1, '')
}
function vv(e, t) {
  return ((t = Nd(t)), Nd(e) === t)
}
function re(e, t, l, n, a, u) {
  switch (l) {
    case 'children':
      typeof n == 'string'
        ? t === 'body' || (t === 'textarea' && n === '') || Ca(e, n)
        : (typeof n == 'number' || typeof n == 'bigint') && t !== 'body' && Ca(e, '' + n)
      break
    case 'className':
      li(e, 'class', n)
      break
    case 'tabIndex':
      li(e, 'tabindex', n)
      break
    case 'dir':
    case 'role':
    case 'viewBox':
    case 'width':
    case 'height':
      li(e, l, n)
      break
    case 'style':
      ym(e, n, u)
      break
    case 'data':
      if (t !== 'object') {
        li(e, 'data', n)
        break
      }
    case 'src':
    case 'href':
      if (n === '' && (t !== 'a' || l !== 'href')) {
        e.removeAttribute(l)
        break
      }
      if (n == null || typeof n == 'function' || typeof n == 'symbol' || typeof n == 'boolean') {
        e.removeAttribute(l)
        break
      }
      ;((n = Si('' + n)), e.setAttribute(l, n))
      break
    case 'action':
    case 'formAction':
      if (typeof n == 'function') {
        e.setAttribute(
          l,
          "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')",
        )
        break
      } else
        typeof u == 'function' &&
          (l === 'formAction'
            ? (t !== 'input' && re(e, t, 'name', a.name, a, null),
              re(e, t, 'formEncType', a.formEncType, a, null),
              re(e, t, 'formMethod', a.formMethod, a, null),
              re(e, t, 'formTarget', a.formTarget, a, null))
            : (re(e, t, 'encType', a.encType, a, null),
              re(e, t, 'method', a.method, a, null),
              re(e, t, 'target', a.target, a, null)))
      if (n == null || typeof n == 'symbol' || typeof n == 'boolean') {
        e.removeAttribute(l)
        break
      }
      ;((n = Si('' + n)), e.setAttribute(l, n))
      break
    case 'onClick':
      n != null && (e.onclick = _l)
      break
    case 'onScroll':
      n != null && F('scroll', e)
      break
    case 'onScrollEnd':
      n != null && F('scrollend', e)
      break
    case 'dangerouslySetInnerHTML':
      if (n != null) {
        if (typeof n != 'object' || !('__html' in n)) throw Error(z(61))
        if (((l = n.__html), l != null)) {
          if (a.children != null) throw Error(z(60))
          e.innerHTML = l
        }
      }
      break
    case 'multiple':
      e.multiple = n && typeof n != 'function' && typeof n != 'symbol'
      break
    case 'muted':
      e.muted = n && typeof n != 'function' && typeof n != 'symbol'
      break
    case 'suppressContentEditableWarning':
    case 'suppressHydrationWarning':
    case 'defaultValue':
    case 'defaultChecked':
    case 'innerHTML':
    case 'ref':
      break
    case 'autoFocus':
      break
    case 'xlinkHref':
      if (n == null || typeof n == 'function' || typeof n == 'boolean' || typeof n == 'symbol') {
        e.removeAttribute('xlink:href')
        break
      }
      ;((l = Si('' + n)), e.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', l))
      break
    case 'contentEditable':
    case 'spellCheck':
    case 'draggable':
    case 'value':
    case 'autoReverse':
    case 'externalResourcesRequired':
    case 'focusable':
    case 'preserveAlpha':
      n != null && typeof n != 'function' && typeof n != 'symbol'
        ? e.setAttribute(l, '' + n)
        : e.removeAttribute(l)
      break
    case 'inert':
    case 'allowFullScreen':
    case 'async':
    case 'autoPlay':
    case 'controls':
    case 'default':
    case 'defer':
    case 'disabled':
    case 'disablePictureInPicture':
    case 'disableRemotePlayback':
    case 'formNoValidate':
    case 'hidden':
    case 'loop':
    case 'noModule':
    case 'noValidate':
    case 'open':
    case 'playsInline':
    case 'readOnly':
    case 'required':
    case 'reversed':
    case 'scoped':
    case 'seamless':
    case 'itemScope':
      n && typeof n != 'function' && typeof n != 'symbol'
        ? e.setAttribute(l, '')
        : e.removeAttribute(l)
      break
    case 'capture':
    case 'download':
      n === !0
        ? e.setAttribute(l, '')
        : n !== !1 && n != null && typeof n != 'function' && typeof n != 'symbol'
          ? e.setAttribute(l, n)
          : e.removeAttribute(l)
      break
    case 'cols':
    case 'rows':
    case 'size':
    case 'span':
      n != null && typeof n != 'function' && typeof n != 'symbol' && !isNaN(n) && 1 <= n
        ? e.setAttribute(l, n)
        : e.removeAttribute(l)
      break
    case 'rowSpan':
    case 'start':
      n == null || typeof n == 'function' || typeof n == 'symbol' || isNaN(n)
        ? e.removeAttribute(l)
        : e.setAttribute(l, n)
      break
    case 'popover':
      ;(F('beforetoggle', e), F('toggle', e), pi(e, 'popover', n))
      break
    case 'xlinkActuate':
      ml(e, 'http://www.w3.org/1999/xlink', 'xlink:actuate', n)
      break
    case 'xlinkArcrole':
      ml(e, 'http://www.w3.org/1999/xlink', 'xlink:arcrole', n)
      break
    case 'xlinkRole':
      ml(e, 'http://www.w3.org/1999/xlink', 'xlink:role', n)
      break
    case 'xlinkShow':
      ml(e, 'http://www.w3.org/1999/xlink', 'xlink:show', n)
      break
    case 'xlinkTitle':
      ml(e, 'http://www.w3.org/1999/xlink', 'xlink:title', n)
      break
    case 'xlinkType':
      ml(e, 'http://www.w3.org/1999/xlink', 'xlink:type', n)
      break
    case 'xmlBase':
      ml(e, 'http://www.w3.org/XML/1998/namespace', 'xml:base', n)
      break
    case 'xmlLang':
      ml(e, 'http://www.w3.org/XML/1998/namespace', 'xml:lang', n)
      break
    case 'xmlSpace':
      ml(e, 'http://www.w3.org/XML/1998/namespace', 'xml:space', n)
      break
    case 'is':
      pi(e, 'is', n)
      break
    case 'innerText':
    case 'textContent':
      break
    default:
      ;(!(2 < l.length) || (l[0] !== 'o' && l[0] !== 'O') || (l[1] !== 'n' && l[1] !== 'N')) &&
        ((l = ob.get(l) || l), pi(e, l, n))
  }
}
function Bf(e, t, l, n, a, u) {
  switch (l) {
    case 'style':
      ym(e, n, u)
      break
    case 'dangerouslySetInnerHTML':
      if (n != null) {
        if (typeof n != 'object' || !('__html' in n)) throw Error(z(61))
        if (((l = n.__html), l != null)) {
          if (a.children != null) throw Error(z(60))
          e.innerHTML = l
        }
      }
      break
    case 'children':
      typeof n == 'string'
        ? Ca(e, n)
        : (typeof n == 'number' || typeof n == 'bigint') && Ca(e, '' + n)
      break
    case 'onScroll':
      n != null && F('scroll', e)
      break
    case 'onScrollEnd':
      n != null && F('scrollend', e)
      break
    case 'onClick':
      n != null && (e.onclick = _l)
      break
    case 'suppressContentEditableWarning':
    case 'suppressHydrationWarning':
    case 'innerHTML':
    case 'ref':
      break
    case 'innerText':
    case 'textContent':
      break
    default:
      if (!rm.hasOwnProperty(l))
        e: {
          if (
            l[0] === 'o' &&
            l[1] === 'n' &&
            ((a = l.endsWith('Capture')),
            (t = l.slice(2, a ? l.length - 7 : void 0)),
            (u = e[ft] || null),
            (u = u != null ? u[l] : null),
            typeof u == 'function' && e.removeEventListener(t, u, a),
            typeof n == 'function')
          ) {
            ;(typeof u != 'function' &&
              u !== null &&
              (l in e ? (e[l] = null) : e.hasAttribute(l) && e.removeAttribute(l)),
              e.addEventListener(t, n, a))
            break e
          }
          l in e ? (e[l] = n) : n === !0 ? e.setAttribute(l, '') : pi(e, l, n)
        }
  }
}
function Fe(e, t, l) {
  switch (t) {
    case 'div':
    case 'span':
    case 'svg':
    case 'path':
    case 'a':
    case 'g':
    case 'p':
    case 'li':
      break
    case 'img':
      ;(F('error', e), F('load', e))
      var n = !1,
        a = !1,
        u
      for (u in l)
        if (l.hasOwnProperty(u)) {
          var i = l[u]
          if (i != null)
            switch (u) {
              case 'src':
                n = !0
                break
              case 'srcSet':
                a = !0
                break
              case 'children':
              case 'dangerouslySetInnerHTML':
                throw Error(z(137, t))
              default:
                re(e, t, u, i, l, null)
            }
        }
      ;(a && re(e, t, 'srcSet', l.srcSet, l, null), n && re(e, t, 'src', l.src, l, null))
      return
    case 'input':
      F('invalid', e)
      var r = (u = i = a = null),
        c = null,
        f = null
      for (n in l)
        if (l.hasOwnProperty(n)) {
          var d = l[n]
          if (d != null)
            switch (n) {
              case 'name':
                a = d
                break
              case 'type':
                i = d
                break
              case 'checked':
                c = d
                break
              case 'defaultChecked':
                f = d
                break
              case 'value':
                u = d
                break
              case 'defaultValue':
                r = d
                break
              case 'children':
              case 'dangerouslySetInnerHTML':
                if (d != null) throw Error(z(137, t))
                break
              default:
                re(e, t, n, d, l, null)
            }
        }
      sm(e, u, r, c, f, i, a, !1)
      return
    case 'select':
      ;(F('invalid', e), (n = i = u = null))
      for (a in l)
        if (l.hasOwnProperty(a) && ((r = l[a]), r != null))
          switch (a) {
            case 'value':
              u = r
              break
            case 'defaultValue':
              i = r
              break
            case 'multiple':
              n = r
            default:
              re(e, t, a, r, l, null)
          }
      ;((t = u),
        (l = i),
        (e.multiple = !!n),
        t != null ? pa(e, !!n, t, !1) : l != null && pa(e, !!n, l, !0))
      return
    case 'textarea':
      ;(F('invalid', e), (u = a = n = null))
      for (i in l)
        if (l.hasOwnProperty(i) && ((r = l[i]), r != null))
          switch (i) {
            case 'value':
              n = r
              break
            case 'defaultValue':
              a = r
              break
            case 'children':
              u = r
              break
            case 'dangerouslySetInnerHTML':
              if (r != null) throw Error(z(91))
              break
            default:
              re(e, t, i, r, l, null)
          }
      dm(e, n, a, u)
      return
    case 'option':
      for (c in l)
        if (l.hasOwnProperty(c) && ((n = l[c]), n != null))
          switch (c) {
            case 'selected':
              e.selected = n && typeof n != 'function' && typeof n != 'symbol'
              break
            default:
              re(e, t, c, n, l, null)
          }
      return
    case 'dialog':
      ;(F('beforetoggle', e), F('toggle', e), F('cancel', e), F('close', e))
      break
    case 'iframe':
    case 'object':
      F('load', e)
      break
    case 'video':
    case 'audio':
      for (n = 0; n < zu.length; n++) F(zu[n], e)
      break
    case 'image':
      ;(F('error', e), F('load', e))
      break
    case 'details':
      F('toggle', e)
      break
    case 'embed':
    case 'source':
    case 'link':
      ;(F('error', e), F('load', e))
    case 'area':
    case 'base':
    case 'br':
    case 'col':
    case 'hr':
    case 'keygen':
    case 'meta':
    case 'param':
    case 'track':
    case 'wbr':
    case 'menuitem':
      for (f in l)
        if (l.hasOwnProperty(f) && ((n = l[f]), n != null))
          switch (f) {
            case 'children':
            case 'dangerouslySetInnerHTML':
              throw Error(z(137, t))
            default:
              re(e, t, f, n, l, null)
          }
      return
    default:
      if (ms(t)) {
        for (d in l) l.hasOwnProperty(d) && ((n = l[d]), n !== void 0 && Bf(e, t, d, n, l, void 0))
        return
      }
  }
  for (r in l) l.hasOwnProperty(r) && ((n = l[r]), n != null && re(e, t, r, n, l, null))
}
function V1(e, t, l, n) {
  switch (t) {
    case 'div':
    case 'span':
    case 'svg':
    case 'path':
    case 'a':
    case 'g':
    case 'p':
    case 'li':
      break
    case 'input':
      var a = null,
        u = null,
        i = null,
        r = null,
        c = null,
        f = null,
        d = null
      for (v in l) {
        var y = l[v]
        if (l.hasOwnProperty(v) && y != null)
          switch (v) {
            case 'checked':
              break
            case 'value':
              break
            case 'defaultValue':
              c = y
            default:
              n.hasOwnProperty(v) || re(e, t, v, null, n, y)
          }
      }
      for (var o in n) {
        var v = n[o]
        if (((y = l[o]), n.hasOwnProperty(o) && (v != null || y != null)))
          switch (o) {
            case 'type':
              u = v
              break
            case 'name':
              a = v
              break
            case 'checked':
              f = v
              break
            case 'defaultChecked':
              d = v
              break
            case 'value':
              i = v
              break
            case 'defaultValue':
              r = v
              break
            case 'children':
            case 'dangerouslySetInnerHTML':
              if (v != null) throw Error(z(137, t))
              break
            default:
              v !== y && re(e, t, o, v, n, y)
          }
      }
      af(e, i, r, c, f, d, u, a)
      return
    case 'select':
      v = i = r = o = null
      for (u in l)
        if (((c = l[u]), l.hasOwnProperty(u) && c != null))
          switch (u) {
            case 'value':
              break
            case 'multiple':
              v = c
            default:
              n.hasOwnProperty(u) || re(e, t, u, null, n, c)
          }
      for (a in n)
        if (((u = n[a]), (c = l[a]), n.hasOwnProperty(a) && (u != null || c != null)))
          switch (a) {
            case 'value':
              o = u
              break
            case 'defaultValue':
              r = u
              break
            case 'multiple':
              i = u
            default:
              u !== c && re(e, t, a, u, n, c)
          }
      ;((t = r),
        (l = i),
        (n = v),
        o != null
          ? pa(e, !!l, o, !1)
          : !!n != !!l && (t != null ? pa(e, !!l, t, !0) : pa(e, !!l, l ? [] : '', !1)))
      return
    case 'textarea':
      v = o = null
      for (r in l)
        if (((a = l[r]), l.hasOwnProperty(r) && a != null && !n.hasOwnProperty(r)))
          switch (r) {
            case 'value':
              break
            case 'children':
              break
            default:
              re(e, t, r, null, n, a)
          }
      for (i in n)
        if (((a = n[i]), (u = l[i]), n.hasOwnProperty(i) && (a != null || u != null)))
          switch (i) {
            case 'value':
              o = a
              break
            case 'defaultValue':
              v = a
              break
            case 'children':
              break
            case 'dangerouslySetInnerHTML':
              if (a != null) throw Error(z(91))
              break
            default:
              a !== u && re(e, t, i, a, n, u)
          }
      om(e, o, v)
      return
    case 'option':
      for (var _ in l)
        if (((o = l[_]), l.hasOwnProperty(_) && o != null && !n.hasOwnProperty(_)))
          switch (_) {
            case 'selected':
              e.selected = !1
              break
            default:
              re(e, t, _, null, n, o)
          }
      for (c in n)
        if (((o = n[c]), (v = l[c]), n.hasOwnProperty(c) && o !== v && (o != null || v != null)))
          switch (c) {
            case 'selected':
              e.selected = o && typeof o != 'function' && typeof o != 'symbol'
              break
            default:
              re(e, t, c, o, n, v)
          }
      return
    case 'img':
    case 'link':
    case 'area':
    case 'base':
    case 'br':
    case 'col':
    case 'embed':
    case 'hr':
    case 'keygen':
    case 'meta':
    case 'param':
    case 'source':
    case 'track':
    case 'wbr':
    case 'menuitem':
      for (var p in l)
        ((o = l[p]),
          l.hasOwnProperty(p) && o != null && !n.hasOwnProperty(p) && re(e, t, p, null, n, o))
      for (f in n)
        if (((o = n[f]), (v = l[f]), n.hasOwnProperty(f) && o !== v && (o != null || v != null)))
          switch (f) {
            case 'children':
            case 'dangerouslySetInnerHTML':
              if (o != null) throw Error(z(137, t))
              break
            default:
              re(e, t, f, o, n, v)
          }
      return
    default:
      if (ms(t)) {
        for (var A in l)
          ((o = l[A]),
            l.hasOwnProperty(A) &&
              o !== void 0 &&
              !n.hasOwnProperty(A) &&
              Bf(e, t, A, void 0, n, o))
        for (d in n)
          ((o = n[d]),
            (v = l[d]),
            !n.hasOwnProperty(d) ||
              o === v ||
              (o === void 0 && v === void 0) ||
              Bf(e, t, d, o, n, v))
        return
      }
  }
  for (var h in l)
    ((o = l[h]),
      l.hasOwnProperty(h) && o != null && !n.hasOwnProperty(h) && re(e, t, h, null, n, o))
  for (y in n)
    ((o = n[y]),
      (v = l[y]),
      !n.hasOwnProperty(y) || o === v || (o == null && v == null) || re(e, t, y, o, n, v))
}
function xd(e) {
  switch (e) {
    case 'css':
    case 'script':
    case 'font':
    case 'img':
    case 'image':
    case 'input':
    case 'link':
      return !0
    default:
      return !1
  }
}
function j1() {
  if (typeof performance.getEntriesByType == 'function') {
    for (var e = 0, t = 0, l = performance.getEntriesByType('resource'), n = 0; n < l.length; n++) {
      var a = l[n],
        u = a.transferSize,
        i = a.initiatorType,
        r = a.duration
      if (u && r && xd(i)) {
        for (i = 0, r = a.responseEnd, n += 1; n < l.length; n++) {
          var c = l[n],
            f = c.startTime
          if (f > r) break
          var d = c.transferSize,
            y = c.initiatorType
          d && xd(y) && ((c = c.responseEnd), (i += d * (c < r ? 1 : (r - f) / (c - f))))
        }
        if ((--n, (t += (8 * (u + i)) / (a.duration / 1e3)), e++, 10 < e)) break
      }
    }
    if (0 < e) return t / e / 1e6
  }
  return navigator.connection && ((e = navigator.connection.downlink), typeof e == 'number') ? e : 5
}
var Hf = null,
  Yf = null
function ir(e) {
  return e.nodeType === 9 ? e : e.ownerDocument
}
function Rd(e) {
  switch (e) {
    case 'http://www.w3.org/2000/svg':
      return 1
    case 'http://www.w3.org/1998/Math/MathML':
      return 2
    default:
      return 0
  }
}
function gv(e, t) {
  if (e === 0)
    switch (t) {
      case 'svg':
        return 1
      case 'math':
        return 2
      default:
        return 0
    }
  return e === 1 && t === 'foreignObject' ? 0 : e
}
function wf(e, t) {
  return (
    e === 'textarea' ||
    e === 'noscript' ||
    typeof t.children == 'string' ||
    typeof t.children == 'number' ||
    typeof t.children == 'bigint' ||
    (typeof t.dangerouslySetInnerHTML == 'object' &&
      t.dangerouslySetInnerHTML !== null &&
      t.dangerouslySetInnerHTML.__html != null)
  )
}
var Vc = null
function q1() {
  var e = window.event
  return e && e.type === 'popstate' ? (e === Vc ? !1 : ((Vc = e), !0)) : ((Vc = null), !1)
}
var bv = typeof setTimeout == 'function' ? setTimeout : void 0,
  L1 = typeof clearTimeout == 'function' ? clearTimeout : void 0,
  Ud = typeof Promise == 'function' ? Promise : void 0,
  G1 =
    typeof queueMicrotask == 'function'
      ? queueMicrotask
      : typeof Ud < 'u'
        ? function (e) {
            return Ud.resolve(null).then(e).catch(X1)
          }
        : bv
function X1(e) {
  setTimeout(function () {
    throw e
  })
}
function pn(e) {
  return e === 'head'
}
function Bd(e, t) {
  var l = t,
    n = 0
  do {
    var a = l.nextSibling
    if ((e.removeChild(l), a && a.nodeType === 8))
      if (((l = a.data), l === '/$' || l === '/&')) {
        if (n === 0) {
          ;(e.removeChild(a), Ya(t))
          return
        }
        n--
      } else if (l === '$' || l === '$?' || l === '$~' || l === '$!' || l === '&') n++
      else if (l === 'html') gu(e.ownerDocument.documentElement)
      else if (l === 'head') {
        ;((l = e.ownerDocument.head), gu(l))
        for (var u = l.firstChild; u; ) {
          var i = u.nextSibling,
            r = u.nodeName
          ;(u[ju] ||
            r === 'SCRIPT' ||
            r === 'STYLE' ||
            (r === 'LINK' && u.rel.toLowerCase() === 'stylesheet') ||
            l.removeChild(u),
            (u = i))
        }
      } else l === 'body' && gu(e.ownerDocument.body)
    l = a
  } while (l)
  Ya(t)
}
function Hd(e, t) {
  var l = e
  e = 0
  do {
    var n = l.nextSibling
    if (
      (l.nodeType === 1
        ? t
          ? ((l._stashedDisplay = l.style.display), (l.style.display = 'none'))
          : ((l.style.display = l._stashedDisplay || ''),
            l.getAttribute('style') === '' && l.removeAttribute('style'))
        : l.nodeType === 3 &&
          (t
            ? ((l._stashedText = l.nodeValue), (l.nodeValue = ''))
            : (l.nodeValue = l._stashedText || '')),
      n && n.nodeType === 8)
    )
      if (((l = n.data), l === '/$')) {
        if (e === 0) break
        e--
      } else (l !== '$' && l !== '$?' && l !== '$~' && l !== '$!') || e++
    l = n
  } while (l)
}
function Vf(e) {
  var t = e.firstChild
  for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
    var l = t
    switch (((t = t.nextSibling), l.nodeName)) {
      case 'HTML':
      case 'HEAD':
      case 'BODY':
        ;(Vf(l), ys(l))
        continue
      case 'SCRIPT':
      case 'STYLE':
        continue
      case 'LINK':
        if (l.rel.toLowerCase() === 'stylesheet') continue
    }
    e.removeChild(l)
  }
}
function k1(e, t, l, n) {
  for (; e.nodeType === 1; ) {
    var a = l
    if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
      if (!n && (e.nodeName !== 'INPUT' || e.type !== 'hidden')) break
    } else if (n) {
      if (!e[ju])
        switch (t) {
          case 'meta':
            if (!e.hasAttribute('itemprop')) break
            return e
          case 'link':
            if (
              ((u = e.getAttribute('rel')), u === 'stylesheet' && e.hasAttribute('data-precedence'))
            )
              break
            if (
              u !== a.rel ||
              e.getAttribute('href') !== (a.href == null || a.href === '' ? null : a.href) ||
              e.getAttribute('crossorigin') !== (a.crossOrigin == null ? null : a.crossOrigin) ||
              e.getAttribute('title') !== (a.title == null ? null : a.title)
            )
              break
            return e
          case 'style':
            if (e.hasAttribute('data-precedence')) break
            return e
          case 'script':
            if (
              ((u = e.getAttribute('src')),
              (u !== (a.src == null ? null : a.src) ||
                e.getAttribute('type') !== (a.type == null ? null : a.type) ||
                e.getAttribute('crossorigin') !== (a.crossOrigin == null ? null : a.crossOrigin)) &&
                u &&
                e.hasAttribute('async') &&
                !e.hasAttribute('itemprop'))
            )
              break
            return e
          default:
            return e
        }
    } else if (t === 'input' && e.type === 'hidden') {
      var u = a.name == null ? null : '' + a.name
      if (a.type === 'hidden' && e.getAttribute('name') === u) return e
    } else return e
    if (((e = wt(e.nextSibling)), e === null)) break
  }
  return null
}
function Z1(e, t, l) {
  if (t === '') return null
  for (; e.nodeType !== 3; )
    if (
      ((e.nodeType !== 1 || e.nodeName !== 'INPUT' || e.type !== 'hidden') && !l) ||
      ((e = wt(e.nextSibling)), e === null)
    )
      return null
  return e
}
function pv(e, t) {
  for (; e.nodeType !== 8; )
    if (
      ((e.nodeType !== 1 || e.nodeName !== 'INPUT' || e.type !== 'hidden') && !t) ||
      ((e = wt(e.nextSibling)), e === null)
    )
      return null
  return e
}
function jf(e) {
  return e.data === '$?' || e.data === '$~'
}
function qf(e) {
  return e.data === '$!' || (e.data === '$?' && e.ownerDocument.readyState !== 'loading')
}
function Q1(e, t) {
  var l = e.ownerDocument
  if (e.data === '$~') e._reactRetry = t
  else if (e.data !== '$?' || l.readyState !== 'loading') t()
  else {
    var n = function () {
      ;(t(), l.removeEventListener('DOMContentLoaded', n))
    }
    ;(l.addEventListener('DOMContentLoaded', n), (e._reactRetry = n))
  }
}
function wt(e) {
  for (; e != null; e = e.nextSibling) {
    var t = e.nodeType
    if (t === 1 || t === 3) break
    if (t === 8) {
      if (
        ((t = e.data),
        t === '$' || t === '$!' || t === '$?' || t === '$~' || t === '&' || t === 'F!' || t === 'F')
      )
        break
      if (t === '/$' || t === '/&') return null
    }
  }
  return e
}
var Lf = null
function Yd(e) {
  e = e.nextSibling
  for (var t = 0; e; ) {
    if (e.nodeType === 8) {
      var l = e.data
      if (l === '/$' || l === '/&') {
        if (t === 0) return wt(e.nextSibling)
        t--
      } else (l !== '$' && l !== '$!' && l !== '$?' && l !== '$~' && l !== '&') || t++
    }
    e = e.nextSibling
  }
  return null
}
function wd(e) {
  e = e.previousSibling
  for (var t = 0; e; ) {
    if (e.nodeType === 8) {
      var l = e.data
      if (l === '$' || l === '$!' || l === '$?' || l === '$~' || l === '&') {
        if (t === 0) return e
        t--
      } else (l !== '/$' && l !== '/&') || t++
    }
    e = e.previousSibling
  }
  return null
}
function Sv(e, t, l) {
  switch (((t = ir(l)), e)) {
    case 'html':
      if (((e = t.documentElement), !e)) throw Error(z(452))
      return e
    case 'head':
      if (((e = t.head), !e)) throw Error(z(453))
      return e
    case 'body':
      if (((e = t.body), !e)) throw Error(z(454))
      return e
    default:
      throw Error(z(451))
  }
}
function gu(e) {
  for (var t = e.attributes; t.length; ) e.removeAttributeNode(t[0])
  ys(e)
}
var Vt = new Map(),
  Vd = new Set()
function rr(e) {
  return typeof e.getRootNode == 'function'
    ? e.getRootNode()
    : e.nodeType === 9
      ? e
      : e.ownerDocument
}
var wl = ae.d
ae.d = { f: K1, r: W1, D: J1, C: F1, L: $1, m: I1, X: ep, S: P1, M: tp }
function K1() {
  var e = wl.f(),
    t = Br()
  return e || t
}
function W1(e) {
  var t = ja(e)
  t !== null && t.tag === 5 && t.type === 'form' ? yh(t) : wl.r(e)
}
var Xa = typeof document > 'u' ? null : document
function Ev(e, t, l) {
  var n = Xa
  if (n && typeof t == 'string' && t) {
    var a = Ut(t)
    ;((a = 'link[rel="' + e + '"][href="' + a + '"]'),
      typeof l == 'string' && (a += '[crossorigin="' + l + '"]'),
      Vd.has(a) ||
        (Vd.add(a),
        (e = { rel: e, crossOrigin: l, href: t }),
        n.querySelector(a) === null &&
          ((t = n.createElement('link')), Fe(t, 'link', e), Xe(t), n.head.appendChild(t))))
  }
}
function J1(e) {
  ;(wl.D(e), Ev('dns-prefetch', e, null))
}
function F1(e, t) {
  ;(wl.C(e, t), Ev('preconnect', e, t))
}
function $1(e, t, l) {
  wl.L(e, t, l)
  var n = Xa
  if (n && e && t) {
    var a = 'link[rel="preload"][as="' + Ut(t) + '"]'
    t === 'image' && l && l.imageSrcSet
      ? ((a += '[imagesrcset="' + Ut(l.imageSrcSet) + '"]'),
        typeof l.imageSizes == 'string' && (a += '[imagesizes="' + Ut(l.imageSizes) + '"]'))
      : (a += '[href="' + Ut(e) + '"]')
    var u = a
    switch (t) {
      case 'style':
        u = Ha(e)
        break
      case 'script':
        u = ka(e)
    }
    Vt.has(u) ||
      ((e = Se(
        { rel: 'preload', href: t === 'image' && l && l.imageSrcSet ? void 0 : e, as: t },
        l,
      )),
      Vt.set(u, e),
      n.querySelector(a) !== null ||
        (t === 'style' && n.querySelector(Zu(u))) ||
        (t === 'script' && n.querySelector(Qu(u))) ||
        ((t = n.createElement('link')), Fe(t, 'link', e), Xe(t), n.head.appendChild(t)))
  }
}
function I1(e, t) {
  wl.m(e, t)
  var l = Xa
  if (l && e) {
    var n = t && typeof t.as == 'string' ? t.as : 'script',
      a = 'link[rel="modulepreload"][as="' + Ut(n) + '"][href="' + Ut(e) + '"]',
      u = a
    switch (n) {
      case 'audioworklet':
      case 'paintworklet':
      case 'serviceworker':
      case 'sharedworker':
      case 'worker':
      case 'script':
        u = ka(e)
    }
    if (
      !Vt.has(u) &&
      ((e = Se({ rel: 'modulepreload', href: e }, t)), Vt.set(u, e), l.querySelector(a) === null)
    ) {
      switch (n) {
        case 'audioworklet':
        case 'paintworklet':
        case 'serviceworker':
        case 'sharedworker':
        case 'worker':
        case 'script':
          if (l.querySelector(Qu(u))) return
      }
      ;((n = l.createElement('link')), Fe(n, 'link', e), Xe(n), l.head.appendChild(n))
    }
  }
}
function P1(e, t, l) {
  wl.S(e, t, l)
  var n = Xa
  if (n && e) {
    var a = ba(n).hoistableStyles,
      u = Ha(e)
    t = t || 'default'
    var i = a.get(u)
    if (!i) {
      var r = { loading: 0, preload: null }
      if ((i = n.querySelector(Zu(u)))) r.loading = 5
      else {
        ;((e = Se({ rel: 'stylesheet', href: e, 'data-precedence': t }, l)),
          (l = Vt.get(u)) && Is(e, l))
        var c = (i = n.createElement('link'))
        ;(Xe(c),
          Fe(c, 'link', e),
          (c._p = new Promise(function (f, d) {
            ;((c.onload = f), (c.onerror = d))
          })),
          c.addEventListener('load', function () {
            r.loading |= 1
          }),
          c.addEventListener('error', function () {
            r.loading |= 2
          }),
          (r.loading |= 4),
          Ni(i, t, n))
      }
      ;((i = { type: 'stylesheet', instance: i, count: 1, state: r }), a.set(u, i))
    }
  }
}
function ep(e, t) {
  wl.X(e, t)
  var l = Xa
  if (l && e) {
    var n = ba(l).hoistableScripts,
      a = ka(e),
      u = n.get(a)
    u ||
      ((u = l.querySelector(Qu(a))),
      u ||
        ((e = Se({ src: e, async: !0 }, t)),
        (t = Vt.get(a)) && Ps(e, t),
        (u = l.createElement('script')),
        Xe(u),
        Fe(u, 'link', e),
        l.head.appendChild(u)),
      (u = { type: 'script', instance: u, count: 1, state: null }),
      n.set(a, u))
  }
}
function tp(e, t) {
  wl.M(e, t)
  var l = Xa
  if (l && e) {
    var n = ba(l).hoistableScripts,
      a = ka(e),
      u = n.get(a)
    u ||
      ((u = l.querySelector(Qu(a))),
      u ||
        ((e = Se({ src: e, async: !0, type: 'module' }, t)),
        (t = Vt.get(a)) && Ps(e, t),
        (u = l.createElement('script')),
        Xe(u),
        Fe(u, 'link', e),
        l.head.appendChild(u)),
      (u = { type: 'script', instance: u, count: 1, state: null }),
      n.set(a, u))
  }
}
function jd(e, t, l, n) {
  var a = (a = nn.current) ? rr(a) : null
  if (!a) throw Error(z(446))
  switch (e) {
    case 'meta':
    case 'title':
      return null
    case 'style':
      return typeof l.precedence == 'string' && typeof l.href == 'string'
        ? ((t = Ha(l.href)),
          (l = ba(a).hoistableStyles),
          (n = l.get(t)),
          n || ((n = { type: 'style', instance: null, count: 0, state: null }), l.set(t, n)),
          n)
        : { type: 'void', instance: null, count: 0, state: null }
    case 'link':
      if (l.rel === 'stylesheet' && typeof l.href == 'string' && typeof l.precedence == 'string') {
        e = Ha(l.href)
        var u = ba(a).hoistableStyles,
          i = u.get(e)
        if (
          (i ||
            ((a = a.ownerDocument || a),
            (i = {
              type: 'stylesheet',
              instance: null,
              count: 0,
              state: { loading: 0, preload: null },
            }),
            u.set(e, i),
            (u = a.querySelector(Zu(e))) && !u._p && ((i.instance = u), (i.state.loading = 5)),
            Vt.has(e) ||
              ((l = {
                rel: 'preload',
                as: 'style',
                href: l.href,
                crossOrigin: l.crossOrigin,
                integrity: l.integrity,
                media: l.media,
                hrefLang: l.hrefLang,
                referrerPolicy: l.referrerPolicy,
              }),
              Vt.set(e, l),
              u || lp(a, e, l, i.state))),
          t && n === null)
        )
          throw Error(z(528, ''))
        return i
      }
      if (t && n !== null) throw Error(z(529, ''))
      return null
    case 'script':
      return (
        (t = l.async),
        (l = l.src),
        typeof l == 'string' && t && typeof t != 'function' && typeof t != 'symbol'
          ? ((t = ka(l)),
            (l = ba(a).hoistableScripts),
            (n = l.get(t)),
            n || ((n = { type: 'script', instance: null, count: 0, state: null }), l.set(t, n)),
            n)
          : { type: 'void', instance: null, count: 0, state: null }
      )
    default:
      throw Error(z(444, e))
  }
}
function Ha(e) {
  return 'href="' + Ut(e) + '"'
}
function Zu(e) {
  return 'link[rel="stylesheet"][' + e + ']'
}
function Dv(e) {
  return Se({}, e, { 'data-precedence': e.precedence, precedence: null })
}
function lp(e, t, l, n) {
  e.querySelector('link[rel="preload"][as="style"][' + t + ']')
    ? (n.loading = 1)
    : ((t = e.createElement('link')),
      (n.preload = t),
      t.addEventListener('load', function () {
        return (n.loading |= 1)
      }),
      t.addEventListener('error', function () {
        return (n.loading |= 2)
      }),
      Fe(t, 'link', l),
      Xe(t),
      e.head.appendChild(t))
}
function ka(e) {
  return '[src="' + Ut(e) + '"]'
}
function Qu(e) {
  return 'script[async]' + e
}
function qd(e, t, l) {
  if ((t.count++, t.instance === null))
    switch (t.type) {
      case 'style':
        var n = e.querySelector('style[data-href~="' + Ut(l.href) + '"]')
        if (n) return ((t.instance = n), Xe(n), n)
        var a = Se({}, l, {
          'data-href': l.href,
          'data-precedence': l.precedence,
          href: null,
          precedence: null,
        })
        return (
          (n = (e.ownerDocument || e).createElement('style')),
          Xe(n),
          Fe(n, 'style', a),
          Ni(n, l.precedence, e),
          (t.instance = n)
        )
      case 'stylesheet':
        a = Ha(l.href)
        var u = e.querySelector(Zu(a))
        if (u) return ((t.state.loading |= 4), (t.instance = u), Xe(u), u)
        ;((n = Dv(l)),
          (a = Vt.get(a)) && Is(n, a),
          (u = (e.ownerDocument || e).createElement('link')),
          Xe(u))
        var i = u
        return (
          (i._p = new Promise(function (r, c) {
            ;((i.onload = r), (i.onerror = c))
          })),
          Fe(u, 'link', n),
          (t.state.loading |= 4),
          Ni(u, l.precedence, e),
          (t.instance = u)
        )
      case 'script':
        return (
          (u = ka(l.src)),
          (a = e.querySelector(Qu(u)))
            ? ((t.instance = a), Xe(a), a)
            : ((n = l),
              (a = Vt.get(u)) && ((n = Se({}, l)), Ps(n, a)),
              (e = e.ownerDocument || e),
              (a = e.createElement('script')),
              Xe(a),
              Fe(a, 'link', n),
              e.head.appendChild(a),
              (t.instance = a))
        )
      case 'void':
        return null
      default:
        throw Error(z(443, t.type))
    }
  else
    t.type === 'stylesheet' &&
      !(t.state.loading & 4) &&
      ((n = t.instance), (t.state.loading |= 4), Ni(n, l.precedence, e))
  return t.instance
}
function Ni(e, t, l) {
  for (
    var n = l.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),
      a = n.length ? n[n.length - 1] : null,
      u = a,
      i = 0;
    i < n.length;
    i++
  ) {
    var r = n[i]
    if (r.dataset.precedence === t) u = r
    else if (u !== a) break
  }
  u
    ? u.parentNode.insertBefore(e, u.nextSibling)
    : ((t = l.nodeType === 9 ? l.head : l), t.insertBefore(e, t.firstChild))
}
function Is(e, t) {
  ;(e.crossOrigin == null && (e.crossOrigin = t.crossOrigin),
    e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy),
    e.title == null && (e.title = t.title))
}
function Ps(e, t) {
  ;(e.crossOrigin == null && (e.crossOrigin = t.crossOrigin),
    e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy),
    e.integrity == null && (e.integrity = t.integrity))
}
var xi = null
function Ld(e, t, l) {
  if (xi === null) {
    var n = new Map(),
      a = (xi = new Map())
    a.set(l, n)
  } else ((a = xi), (n = a.get(l)), n || ((n = new Map()), a.set(l, n)))
  if (n.has(e)) return n
  for (n.set(e, null), l = l.getElementsByTagName(e), a = 0; a < l.length; a++) {
    var u = l[a]
    if (
      !(u[ju] || u[Ke] || (e === 'link' && u.getAttribute('rel') === 'stylesheet')) &&
      u.namespaceURI !== 'http://www.w3.org/2000/svg'
    ) {
      var i = u.getAttribute(t) || ''
      i = e + i
      var r = n.get(i)
      r ? r.push(u) : n.set(i, [u])
    }
  }
  return n
}
function Gd(e, t, l) {
  ;((e = e.ownerDocument || e),
    e.head.insertBefore(l, t === 'title' ? e.querySelector('head > title') : null))
}
function np(e, t, l) {
  if (l === 1 || t.itemProp != null) return !1
  switch (e) {
    case 'meta':
    case 'title':
      return !0
    case 'style':
      if (typeof t.precedence != 'string' || typeof t.href != 'string' || t.href === '') break
      return !0
    case 'link':
      if (
        typeof t.rel != 'string' ||
        typeof t.href != 'string' ||
        t.href === '' ||
        t.onLoad ||
        t.onError
      )
        break
      switch (t.rel) {
        case 'stylesheet':
          return ((e = t.disabled), typeof t.precedence == 'string' && e == null)
        default:
          return !0
      }
    case 'script':
      if (
        t.async &&
        typeof t.async != 'function' &&
        typeof t.async != 'symbol' &&
        !t.onLoad &&
        !t.onError &&
        t.src &&
        typeof t.src == 'string'
      )
        return !0
  }
  return !1
}
function Ov(e) {
  return !(e.type === 'stylesheet' && !(e.state.loading & 3))
}
function ap(e, t, l, n) {
  if (
    l.type === 'stylesheet' &&
    (typeof n.media != 'string' || matchMedia(n.media).matches !== !1) &&
    !(l.state.loading & 4)
  ) {
    if (l.instance === null) {
      var a = Ha(n.href),
        u = t.querySelector(Zu(a))
      if (u) {
        ;((t = u._p),
          t !== null &&
            typeof t == 'object' &&
            typeof t.then == 'function' &&
            (e.count++, (e = cr.bind(e)), t.then(e, e)),
          (l.state.loading |= 4),
          (l.instance = u),
          Xe(u))
        return
      }
      ;((u = t.ownerDocument || t),
        (n = Dv(n)),
        (a = Vt.get(a)) && Is(n, a),
        (u = u.createElement('link')),
        Xe(u))
      var i = u
      ;((i._p = new Promise(function (r, c) {
        ;((i.onload = r), (i.onerror = c))
      })),
        Fe(u, 'link', n),
        (l.instance = u))
    }
    ;(e.stylesheets === null && (e.stylesheets = new Map()),
      e.stylesheets.set(l, t),
      (t = l.state.preload) &&
        !(l.state.loading & 3) &&
        (e.count++,
        (l = cr.bind(e)),
        t.addEventListener('load', l),
        t.addEventListener('error', l)))
  }
}
var jc = 0
function up(e, t) {
  return (
    e.stylesheets && e.count === 0 && Ri(e, e.stylesheets),
    0 < e.count || 0 < e.imgCount
      ? function (l) {
          var n = setTimeout(function () {
            if ((e.stylesheets && Ri(e, e.stylesheets), e.unsuspend)) {
              var u = e.unsuspend
              ;((e.unsuspend = null), u())
            }
          }, 6e4 + t)
          0 < e.imgBytes && jc === 0 && (jc = 62500 * j1())
          var a = setTimeout(
            function () {
              if (
                ((e.waitingForImages = !1),
                e.count === 0 && (e.stylesheets && Ri(e, e.stylesheets), e.unsuspend))
              ) {
                var u = e.unsuspend
                ;((e.unsuspend = null), u())
              }
            },
            (e.imgBytes > jc ? 50 : 800) + t,
          )
          return (
            (e.unsuspend = l),
            function () {
              ;((e.unsuspend = null), clearTimeout(n), clearTimeout(a))
            }
          )
        }
      : null
  )
}
function cr() {
  if ((this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages))) {
    if (this.stylesheets) Ri(this, this.stylesheets)
    else if (this.unsuspend) {
      var e = this.unsuspend
      ;((this.unsuspend = null), e())
    }
  }
}
var fr = null
function Ri(e, t) {
  ;((e.stylesheets = null),
    e.unsuspend !== null &&
      (e.count++, (fr = new Map()), t.forEach(ip, e), (fr = null), cr.call(e)))
}
function ip(e, t) {
  if (!(t.state.loading & 4)) {
    var l = fr.get(e)
    if (l) var n = l.get(null)
    else {
      ;((l = new Map()), fr.set(e, l))
      for (
        var a = e.querySelectorAll('link[data-precedence],style[data-precedence]'), u = 0;
        u < a.length;
        u++
      ) {
        var i = a[u]
        ;(i.nodeName === 'LINK' || i.getAttribute('media') !== 'not all') &&
          (l.set(i.dataset.precedence, i), (n = i))
      }
      n && l.set(null, n)
    }
    ;((a = t.instance),
      (i = a.getAttribute('data-precedence')),
      (u = l.get(i) || n),
      u === n && l.set(null, a),
      l.set(i, a),
      this.count++,
      (n = cr.bind(this)),
      a.addEventListener('load', n),
      a.addEventListener('error', n),
      u
        ? u.parentNode.insertBefore(a, u.nextSibling)
        : ((e = e.nodeType === 9 ? e.head : e), e.insertBefore(a, e.firstChild)),
      (t.state.loading |= 4))
  }
}
var xu = {
  $$typeof: Ol,
  Provider: null,
  Consumer: null,
  _currentValue: xn,
  _currentValue2: xn,
  _threadCount: 0,
}
function rp(e, t, l, n, a, u, i, r, c) {
  ;((this.tag = 1),
    (this.containerInfo = e),
    (this.pingCache = this.current = this.pendingChildren = null),
    (this.timeoutHandle = -1),
    (this.callbackNode =
      this.next =
      this.pendingContext =
      this.context =
      this.cancelPendingCommit =
        null),
    (this.callbackPriority = 0),
    (this.expirationTimes = cc(-1)),
    (this.entangledLanes =
      this.shellSuspendCounter =
      this.errorRecoveryDisabledLanes =
      this.expiredLanes =
      this.warmLanes =
      this.pingedLanes =
      this.suspendedLanes =
      this.pendingLanes =
        0),
    (this.entanglements = cc(0)),
    (this.hiddenUpdates = cc(null)),
    (this.identifierPrefix = n),
    (this.onUncaughtError = a),
    (this.onCaughtError = u),
    (this.onRecoverableError = i),
    (this.pooledCache = null),
    (this.pooledCacheLanes = 0),
    (this.formState = c),
    (this.incompleteTransitions = new Map()))
}
function _v(e, t, l, n, a, u, i, r, c, f, d, y) {
  return (
    (e = new rp(e, t, l, i, c, f, d, y, r)),
    (t = 1),
    u === !0 && (t |= 24),
    (u = bt(3, null, null, t)),
    (e.current = u),
    (u.stateNode = e),
    (t = Ms()),
    t.refCount++,
    (e.pooledCache = t),
    t.refCount++,
    (u.memoizedState = { element: n, isDehydrated: l, cache: t }),
    Cs(u),
    e
  )
}
function Mv(e) {
  return e ? ((e = ma), e) : ma
}
function Av(e, t, l, n, a, u) {
  ;((a = Mv(a)),
    n.context === null ? (n.context = a) : (n.pendingContext = a),
    (n = un(t)),
    (n.payload = { element: l }),
    (u = u === void 0 ? null : u),
    u !== null && (n.callback = u),
    (l = rn(e, n, t)),
    l !== null && (ct(l, e, t), fu(l, e, t)))
}
function Xd(e, t) {
  if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
    var l = e.retryLane
    e.retryLane = l !== 0 && l < t ? l : t
  }
}
function eo(e, t) {
  ;(Xd(e, t), (e = e.alternate) && Xd(e, t))
}
function Tv(e) {
  if (e.tag === 13 || e.tag === 31) {
    var t = Zn(e, 67108864)
    ;(t !== null && ct(t, e, 67108864), eo(e, 67108864))
  }
}
function kd(e) {
  if (e.tag === 13 || e.tag === 31) {
    var t = _t()
    t = os(t)
    var l = Zn(e, t)
    ;(l !== null && ct(l, e, t), eo(e, t))
  }
}
var sr = !0
function cp(e, t, l, n) {
  var a = L.T
  L.T = null
  var u = ae.p
  try {
    ;((ae.p = 2), to(e, t, l, n))
  } finally {
    ;((ae.p = u), (L.T = a))
  }
}
function fp(e, t, l, n) {
  var a = L.T
  L.T = null
  var u = ae.p
  try {
    ;((ae.p = 8), to(e, t, l, n))
  } finally {
    ;((ae.p = u), (L.T = a))
  }
}
function to(e, t, l, n) {
  if (sr) {
    var a = Gf(n)
    if (a === null) (wc(e, t, n, or, l), Zd(e, n))
    else if (op(a, e, t, l, n)) n.stopPropagation()
    else if ((Zd(e, n), t & 4 && -1 < sp.indexOf(e))) {
      for (; a !== null; ) {
        var u = ja(a)
        if (u !== null)
          switch (u.tag) {
            case 3:
              if (((u = u.stateNode), u.current.memoizedState.isDehydrated)) {
                var i = An(u.pendingLanes)
                if (i !== 0) {
                  var r = u
                  for (r.pendingLanes |= 2, r.entangledLanes |= 2; i; ) {
                    var c = 1 << (31 - Ot(i))
                    ;((r.entanglements[1] |= c), (i &= ~c))
                  }
                  ;(rl(u), !(ne & 6) && ((er = Et() + 500), ku(0)))
                }
              }
              break
            case 31:
            case 13:
              ;((r = Zn(u, 2)), r !== null && ct(r, u, 2), Br(), eo(u, 2))
          }
        if (((u = Gf(n)), u === null && wc(e, t, n, or, l), u === a)) break
        a = u
      }
      a !== null && n.stopPropagation()
    } else wc(e, t, n, null, l)
  }
}
function Gf(e) {
  return ((e = hs(e)), lo(e))
}
var or = null
function lo(e) {
  if (((or = null), (e = ca(e)), e !== null)) {
    var t = Hu(e)
    if (t === null) e = null
    else {
      var l = t.tag
      if (l === 13) {
        if (((e = Ky(t)), e !== null)) return e
        e = null
      } else if (l === 31) {
        if (((e = Wy(t)), e !== null)) return e
        e = null
      } else if (l === 3) {
        if (t.stateNode.current.memoizedState.isDehydrated)
          return t.tag === 3 ? t.stateNode.containerInfo : null
        e = null
      } else t !== e && (e = null)
    }
  }
  return ((or = e), null)
}
function Cv(e) {
  switch (e) {
    case 'beforetoggle':
    case 'cancel':
    case 'click':
    case 'close':
    case 'contextmenu':
    case 'copy':
    case 'cut':
    case 'auxclick':
    case 'dblclick':
    case 'dragend':
    case 'dragstart':
    case 'drop':
    case 'focusin':
    case 'focusout':
    case 'input':
    case 'invalid':
    case 'keydown':
    case 'keypress':
    case 'keyup':
    case 'mousedown':
    case 'mouseup':
    case 'paste':
    case 'pause':
    case 'play':
    case 'pointercancel':
    case 'pointerdown':
    case 'pointerup':
    case 'ratechange':
    case 'reset':
    case 'resize':
    case 'seeked':
    case 'submit':
    case 'toggle':
    case 'touchcancel':
    case 'touchend':
    case 'touchstart':
    case 'volumechange':
    case 'change':
    case 'selectionchange':
    case 'textInput':
    case 'compositionstart':
    case 'compositionend':
    case 'compositionupdate':
    case 'beforeblur':
    case 'afterblur':
    case 'beforeinput':
    case 'blur':
    case 'fullscreenchange':
    case 'focus':
    case 'hashchange':
    case 'popstate':
    case 'select':
    case 'selectstart':
      return 2
    case 'drag':
    case 'dragenter':
    case 'dragexit':
    case 'dragleave':
    case 'dragover':
    case 'mousemove':
    case 'mouseout':
    case 'mouseover':
    case 'pointermove':
    case 'pointerout':
    case 'pointerover':
    case 'scroll':
    case 'touchmove':
    case 'wheel':
    case 'mouseenter':
    case 'mouseleave':
    case 'pointerenter':
    case 'pointerleave':
      return 8
    case 'message':
      switch (J0()) {
        case Iy:
          return 2
        case Py:
          return 8
        case qi:
        case F0:
          return 32
        case em:
          return 268435456
        default:
          return 32
      }
    default:
      return 32
  }
}
var Xf = !1,
  sn = null,
  on = null,
  dn = null,
  Ru = new Map(),
  Uu = new Map(),
  $l = [],
  sp =
    'mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset'.split(
      ' ',
    )
function Zd(e, t) {
  switch (e) {
    case 'focusin':
    case 'focusout':
      sn = null
      break
    case 'dragenter':
    case 'dragleave':
      on = null
      break
    case 'mouseover':
    case 'mouseout':
      dn = null
      break
    case 'pointerover':
    case 'pointerout':
      Ru.delete(t.pointerId)
      break
    case 'gotpointercapture':
    case 'lostpointercapture':
      Uu.delete(t.pointerId)
  }
}
function $a(e, t, l, n, a, u) {
  return e === null || e.nativeEvent !== u
    ? ((e = {
        blockedOn: t,
        domEventName: l,
        eventSystemFlags: n,
        nativeEvent: u,
        targetContainers: [a],
      }),
      t !== null && ((t = ja(t)), t !== null && Tv(t)),
      e)
    : ((e.eventSystemFlags |= n),
      (t = e.targetContainers),
      a !== null && t.indexOf(a) === -1 && t.push(a),
      e)
}
function op(e, t, l, n, a) {
  switch (t) {
    case 'focusin':
      return ((sn = $a(sn, e, t, l, n, a)), !0)
    case 'dragenter':
      return ((on = $a(on, e, t, l, n, a)), !0)
    case 'mouseover':
      return ((dn = $a(dn, e, t, l, n, a)), !0)
    case 'pointerover':
      var u = a.pointerId
      return (Ru.set(u, $a(Ru.get(u) || null, e, t, l, n, a)), !0)
    case 'gotpointercapture':
      return ((u = a.pointerId), Uu.set(u, $a(Uu.get(u) || null, e, t, l, n, a)), !0)
  }
  return !1
}
function zv(e) {
  var t = ca(e.target)
  if (t !== null) {
    var l = Hu(t)
    if (l !== null) {
      if (((t = l.tag), t === 13)) {
        if (((t = Ky(l)), t !== null)) {
          ;((e.blockedOn = t),
            zo(e.priority, function () {
              kd(l)
            }))
          return
        }
      } else if (t === 31) {
        if (((t = Wy(l)), t !== null)) {
          ;((e.blockedOn = t),
            zo(e.priority, function () {
              kd(l)
            }))
          return
        }
      } else if (t === 3 && l.stateNode.current.memoizedState.isDehydrated) {
        e.blockedOn = l.tag === 3 ? l.stateNode.containerInfo : null
        return
      }
    }
  }
  e.blockedOn = null
}
function Ui(e) {
  if (e.blockedOn !== null) return !1
  for (var t = e.targetContainers; 0 < t.length; ) {
    var l = Gf(e.nativeEvent)
    if (l === null) {
      l = e.nativeEvent
      var n = new l.constructor(l.type, l)
      ;((rf = n), l.target.dispatchEvent(n), (rf = null))
    } else return ((t = ja(l)), t !== null && Tv(t), (e.blockedOn = l), !1)
    t.shift()
  }
  return !0
}
function Qd(e, t, l) {
  Ui(e) && l.delete(t)
}
function dp() {
  ;((Xf = !1),
    sn !== null && Ui(sn) && (sn = null),
    on !== null && Ui(on) && (on = null),
    dn !== null && Ui(dn) && (dn = null),
    Ru.forEach(Qd),
    Uu.forEach(Qd))
}
function si(e, t) {
  e.blockedOn === t &&
    ((e.blockedOn = null),
    Xf || ((Xf = !0), Le.unstable_scheduleCallback(Le.unstable_NormalPriority, dp)))
}
var oi = null
function Kd(e) {
  oi !== e &&
    ((oi = e),
    Le.unstable_scheduleCallback(Le.unstable_NormalPriority, function () {
      oi === e && (oi = null)
      for (var t = 0; t < e.length; t += 3) {
        var l = e[t],
          n = e[t + 1],
          a = e[t + 2]
        if (typeof n != 'function') {
          if (lo(n || l) === null) continue
          break
        }
        var u = ja(l)
        u !== null &&
          (e.splice(t, 3),
          (t -= 3),
          Of(u, { pending: !0, data: a, method: l.method, action: n }, n, a))
      }
    }))
}
function Ya(e) {
  function t(c) {
    return si(c, e)
  }
  ;(sn !== null && si(sn, e),
    on !== null && si(on, e),
    dn !== null && si(dn, e),
    Ru.forEach(t),
    Uu.forEach(t))
  for (var l = 0; l < $l.length; l++) {
    var n = $l[l]
    n.blockedOn === e && (n.blockedOn = null)
  }
  for (; 0 < $l.length && ((l = $l[0]), l.blockedOn === null); )
    (zv(l), l.blockedOn === null && $l.shift())
  if (((l = (e.ownerDocument || e).$$reactFormReplay), l != null))
    for (n = 0; n < l.length; n += 3) {
      var a = l[n],
        u = l[n + 1],
        i = a[ft] || null
      if (typeof u == 'function') i || Kd(l)
      else if (i) {
        var r = null
        if (u && u.hasAttribute('formAction')) {
          if (((a = u), (i = u[ft] || null))) r = i.formAction
          else if (lo(a) !== null) continue
        } else r = i.action
        ;(typeof r == 'function' ? (l[n + 1] = r) : (l.splice(n, 3), (n -= 3)), Kd(l))
      }
    }
}
function Nv() {
  function e(u) {
    u.canIntercept &&
      u.info === 'react-transition' &&
      u.intercept({
        handler: function () {
          return new Promise(function (i) {
            return (a = i)
          })
        },
        focusReset: 'manual',
        scroll: 'manual',
      })
  }
  function t() {
    ;(a !== null && (a(), (a = null)), n || setTimeout(l, 20))
  }
  function l() {
    if (!n && !navigation.transition) {
      var u = navigation.currentEntry
      u &&
        u.url != null &&
        navigation.navigate(u.url, {
          state: u.getState(),
          info: 'react-transition',
          history: 'replace',
        })
    }
  }
  if (typeof navigation == 'object') {
    var n = !1,
      a = null
    return (
      navigation.addEventListener('navigate', e),
      navigation.addEventListener('navigatesuccess', t),
      navigation.addEventListener('navigateerror', t),
      setTimeout(l, 100),
      function () {
        ;((n = !0),
          navigation.removeEventListener('navigate', e),
          navigation.removeEventListener('navigatesuccess', t),
          navigation.removeEventListener('navigateerror', t),
          a !== null && (a(), (a = null)))
      }
    )
  }
}
function no(e) {
  this._internalRoot = e
}
wr.prototype.render = no.prototype.render = function (e) {
  var t = this._internalRoot
  if (t === null) throw Error(z(409))
  var l = t.current,
    n = _t()
  Av(l, n, e, t, null, null)
}
wr.prototype.unmount = no.prototype.unmount = function () {
  var e = this._internalRoot
  if (e !== null) {
    this._internalRoot = null
    var t = e.containerInfo
    ;(Av(e.current, 2, null, e, null, null), Br(), (t[Va] = null))
  }
}
function wr(e) {
  this._internalRoot = e
}
wr.prototype.unstable_scheduleHydration = function (e) {
  if (e) {
    var t = um()
    e = { blockedOn: null, target: e, priority: t }
    for (var l = 0; l < $l.length && t !== 0 && t < $l[l].priority; l++);
    ;($l.splice(l, 0, e), l === 0 && zv(e))
  }
}
var Wd = Zy.version
if (Wd !== '19.2.1') throw Error(z(527, Wd, '19.2.1'))
ae.findDOMNode = function (e) {
  var t = e._reactInternals
  if (t === void 0)
    throw typeof e.render == 'function'
      ? Error(z(188))
      : ((e = Object.keys(e).join(',')), Error(z(268, e)))
  return ((e = G0(t)), (e = e !== null ? Jy(e) : null), (e = e === null ? null : e.stateNode), e)
}
var yp = {
  bundleType: 0,
  version: '19.2.1',
  rendererPackageName: 'react-dom',
  currentDispatcherRef: L,
  reconcilerVersion: '19.2.1',
}
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < 'u') {
  var di = __REACT_DEVTOOLS_GLOBAL_HOOK__
  if (!di.isDisabled && di.supportsFiber)
    try {
      ;((Yu = di.inject(yp)), (Dt = di))
    } catch {}
}
Sr.createRoot = function (e, t) {
  if (!Qy(e)) throw Error(z(299))
  var l = !1,
    n = '',
    a = Eh,
    u = Dh,
    i = Oh
  return (
    t != null &&
      (t.unstable_strictMode === !0 && (l = !0),
      t.identifierPrefix !== void 0 && (n = t.identifierPrefix),
      t.onUncaughtError !== void 0 && (a = t.onUncaughtError),
      t.onCaughtError !== void 0 && (u = t.onCaughtError),
      t.onRecoverableError !== void 0 && (i = t.onRecoverableError)),
    (t = _v(e, 1, !1, null, null, l, n, null, a, u, i, Nv)),
    (e[Va] = t.current),
    $s(e),
    new no(t)
  )
}
Sr.hydrateRoot = function (e, t, l) {
  if (!Qy(e)) throw Error(z(299))
  var n = !1,
    a = '',
    u = Eh,
    i = Dh,
    r = Oh,
    c = null
  return (
    l != null &&
      (l.unstable_strictMode === !0 && (n = !0),
      l.identifierPrefix !== void 0 && (a = l.identifierPrefix),
      l.onUncaughtError !== void 0 && (u = l.onUncaughtError),
      l.onCaughtError !== void 0 && (i = l.onCaughtError),
      l.onRecoverableError !== void 0 && (r = l.onRecoverableError),
      l.formState !== void 0 && (c = l.formState)),
    (t = _v(e, 1, !0, t, l ?? null, n, a, c, u, i, r, Nv)),
    (t.context = Mv(null)),
    (l = t.current),
    (n = _t()),
    (n = os(n)),
    (a = un(n)),
    (a.callback = null),
    rn(l, a, n),
    (l = n),
    (t.current.lanes = l),
    Vu(t, l),
    rl(t),
    (e[Va] = t.current),
    $s(e),
    new wr(t)
  )
}
Sr.version = '19.2.1'
function xv() {
  if (
    !(
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > 'u' ||
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != 'function'
    )
  )
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(xv)
    } catch (e) {
      console.error(e)
    }
}
;(xv(), (qy.exports = Sr))
var PD = qy.exports
const mp = (e, t, l, n) => {
    const a = [l, { code: t, ...(n || {}) }]
    if (e?.services?.logger?.forward)
      return e.services.logger.forward(a, 'warn', 'react-i18next::', !0)
    ;(Yn(a[0]) && (a[0] = `react-i18next:: ${a[0]}`),
      e?.services?.logger?.warn
        ? e.services.logger.warn(...a)
        : console?.warn && console.warn(...a))
  },
  Jd = {},
  kf = (e, t, l, n) => {
    ;(Yn(l) && Jd[l]) || (Yn(l) && (Jd[l] = new Date()), mp(e, t, l, n))
  },
  Rv = (e, t) => () => {
    if (e.isInitialized) t()
    else {
      const l = () => {
        ;(setTimeout(() => {
          e.off('initialized', l)
        }, 0),
          t())
      }
      e.on('initialized', l)
    }
  },
  Zf = (e, t, l) => {
    e.loadNamespaces(t, Rv(e, l))
  },
  Fd = (e, t, l, n) => {
    if ((Yn(l) && (l = [l]), e.options.preload && e.options.preload.indexOf(t) > -1))
      return Zf(e, l, n)
    ;(l.forEach((a) => {
      e.options.ns.indexOf(a) < 0 && e.options.ns.push(a)
    }),
      e.loadLanguages(t, Rv(e, n)))
  },
  hp = (e, t, l = {}) =>
    !t.languages || !t.languages.length
      ? (kf(t, 'NO_LANGUAGES', 'i18n.languages were undefined or empty', {
          languages: t.languages,
        }),
        !0)
      : t.hasLoadedNamespace(e, {
          lng: l.lng,
          precheck: (n, a) => {
            if (
              l.bindI18n &&
              l.bindI18n.indexOf('languageChanging') > -1 &&
              n.services.backendConnector.backend &&
              n.isLanguageChangingTo &&
              !a(n.isLanguageChangingTo, e)
            )
              return !1
          },
        }),
  Yn = (e) => typeof e == 'string',
  vp = (e) => typeof e == 'object' && e !== null,
  gp =
    /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160|copy|#169|reg|#174|hellip|#8230|#x2F|#47);/g,
  bp = {
    '&amp;': '&',
    '&#38;': '&',
    '&lt;': '<',
    '&#60;': '<',
    '&gt;': '>',
    '&#62;': '>',
    '&apos;': "'",
    '&#39;': "'",
    '&quot;': '"',
    '&#34;': '"',
    '&nbsp;': ' ',
    '&#160;': ' ',
    '&copy;': '©',
    '&#169;': '©',
    '&reg;': '®',
    '&#174;': '®',
    '&hellip;': '…',
    '&#8230;': '…',
    '&#x2F;': '/',
    '&#47;': '/',
  },
  pp = (e) => bp[e],
  Sp = (e) => e.replace(gp, pp)
let Qf = {
  bindI18n: 'languageChanged',
  bindI18nStore: '',
  transEmptyNodeValue: '',
  transSupportBasicHtmlNodes: !0,
  transWrapTextNodes: '',
  transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
  useSuspense: !0,
  unescape: Sp,
}
const Ep = (e = {}) => {
    Qf = { ...Qf, ...e }
  },
  Dp = () => Qf
let Uv
const Op = (e) => {
    Uv = e
  },
  _p = () => Uv,
  eO = {
    type: '3rdParty',
    init(e) {
      ;(Ep(e.options.react), Op(e))
    },
  },
  Mp = O.createContext()
class Ap {
  constructor() {
    this.usedNamespaces = {}
  }
  addUsedNamespaces(t) {
    t.forEach((l) => {
      this.usedNamespaces[l] || (this.usedNamespaces[l] = !0)
    })
  }
  getUsedNamespaces() {
    return Object.keys(this.usedNamespaces)
  }
}
const Tp = (e, t) => {
    const l = O.useRef()
    return (
      O.useEffect(() => {
        l.current = e
      }, [e, t]),
      l.current
    )
  },
  Bv = (e, t, l, n) => e.getFixedT(t, l, n),
  Cp = (e, t, l, n) => O.useCallback(Bv(e, t, l, n), [e, t, l, n]),
  tO = (e, t = {}) => {
    const { i18n: l } = t,
      { i18n: n, defaultNS: a } = O.useContext(Mp) || {},
      u = l || n || _p()
    if ((u && !u.reportNamespaces && (u.reportNamespaces = new Ap()), !u)) {
      kf(
        u,
        'NO_I18NEXT_INSTANCE',
        'useTranslation: You will need to pass in an i18next instance by using initReactI18next',
      )
      const b = (x, M) =>
          Yn(M)
            ? M
            : vp(M) && Yn(M.defaultValue)
              ? M.defaultValue
              : Array.isArray(x)
                ? x[x.length - 1]
                : x,
        S = [b, {}, !1]
      return ((S.t = b), (S.i18n = {}), (S.ready = !1), S)
    }
    u.options.react?.wait &&
      kf(
        u,
        'DEPRECATED_OPTION',
        'useTranslation: It seems you are still using the old wait option, you may migrate to the new useSuspense behaviour.',
      )
    const i = { ...Dp(), ...u.options.react, ...t },
      { useSuspense: r, keyPrefix: c } = i
    let f = e || a || u.options?.defaultNS
    ;((f = Yn(f) ? [f] : f || ['translation']), u.reportNamespaces.addUsedNamespaces?.(f))
    const d = (u.isInitialized || u.initializedStoreOnce) && f.every((b) => hp(b, u, i)),
      y = Cp(u, t.lng || null, i.nsMode === 'fallback' ? f : f[0], c),
      o = () => y,
      v = () => Bv(u, t.lng || null, i.nsMode === 'fallback' ? f : f[0], c),
      [_, p] = O.useState(o)
    let A = f.join()
    t.lng && (A = `${t.lng}${A}`)
    const h = Tp(A),
      s = O.useRef(!0)
    ;(O.useEffect(() => {
      const { bindI18n: b, bindI18nStore: S } = i
      ;((s.current = !0),
        !d &&
          !r &&
          (t.lng
            ? Fd(u, t.lng, f, () => {
                s.current && p(v)
              })
            : Zf(u, f, () => {
                s.current && p(v)
              })),
        d && h && h !== A && s.current && p(v))
      const x = () => {
        s.current && p(v)
      }
      return (
        b && u?.on(b, x),
        S && u?.store.on(S, x),
        () => {
          ;((s.current = !1),
            u && b && b?.split(' ').forEach((M) => u.off(M, x)),
            S && u && S.split(' ').forEach((M) => u.store.off(M, x)))
        }
      )
    }, [u, A]),
      O.useEffect(() => {
        s.current && d && p(o)
      }, [u, c, d]))
    const m = [_, u, d]
    if (((m.t = _), (m.i18n = u), (m.ready = d), d || (!d && !r))) return m
    throw new Promise((b) => {
      t.lng ? Fd(u, t.lng, f, () => b()) : Zf(u, f, () => b())
    })
  }
var zp = (e) => typeof e == 'function',
  dr = (e, t) => (zp(e) ? e(t) : e),
  Np = (() => {
    let e = 0
    return () => (++e).toString()
  })(),
  Hv = (() => {
    let e
    return () => {
      if (e === void 0 && typeof window < 'u') {
        let t = matchMedia('(prefers-reduced-motion: reduce)')
        e = !t || t.matches
      }
      return e
    }
  })(),
  xp = 20,
  ao = 'default',
  Yv = (e, t) => {
    let { toastLimit: l } = e.settings
    switch (t.type) {
      case 0:
        return { ...e, toasts: [t.toast, ...e.toasts].slice(0, l) }
      case 1:
        return {
          ...e,
          toasts: e.toasts.map((i) => (i.id === t.toast.id ? { ...i, ...t.toast } : i)),
        }
      case 2:
        let { toast: n } = t
        return Yv(e, { type: e.toasts.find((i) => i.id === n.id) ? 1 : 0, toast: n })
      case 3:
        let { toastId: a } = t
        return {
          ...e,
          toasts: e.toasts.map((i) =>
            i.id === a || a === void 0 ? { ...i, dismissed: !0, visible: !1 } : i,
          ),
        }
      case 4:
        return t.toastId === void 0
          ? { ...e, toasts: [] }
          : { ...e, toasts: e.toasts.filter((i) => i.id !== t.toastId) }
      case 5:
        return { ...e, pausedAt: t.time }
      case 6:
        let u = t.time - (e.pausedAt || 0)
        return {
          ...e,
          pausedAt: void 0,
          toasts: e.toasts.map((i) => ({ ...i, pauseDuration: i.pauseDuration + u })),
        }
    }
  },
  Bi = [],
  wv = { toasts: [], pausedAt: void 0, settings: { toastLimit: xp } },
  al = {},
  Vv = (e, t = ao) => {
    ;((al[t] = Yv(al[t] || wv, e)),
      Bi.forEach(([l, n]) => {
        l === t && n(al[t])
      }))
  },
  jv = (e) => Object.keys(al).forEach((t) => Vv(e, t)),
  Rp = (e) => Object.keys(al).find((t) => al[t].toasts.some((l) => l.id === e)),
  Vr =
    (e = ao) =>
    (t) => {
      Vv(t, e)
    },
  Up = { blank: 4e3, error: 4e3, success: 2e3, loading: 1 / 0, custom: 4e3 },
  Bp = (e = {}, t = ao) => {
    let [l, n] = O.useState(al[t] || wv),
      a = O.useRef(al[t])
    O.useEffect(
      () => (
        a.current !== al[t] && n(al[t]),
        Bi.push([t, n]),
        () => {
          let i = Bi.findIndex(([r]) => r === t)
          i > -1 && Bi.splice(i, 1)
        }
      ),
      [t],
    )
    let u = l.toasts.map((i) => {
      var r, c, f
      return {
        ...e,
        ...e[i.type],
        ...i,
        removeDelay:
          i.removeDelay || ((r = e[i.type]) == null ? void 0 : r.removeDelay) || e?.removeDelay,
        duration:
          i.duration ||
          ((c = e[i.type]) == null ? void 0 : c.duration) ||
          e?.duration ||
          Up[i.type],
        style: { ...e.style, ...((f = e[i.type]) == null ? void 0 : f.style), ...i.style },
      }
    })
    return { ...l, toasts: u }
  },
  Hp = (e, t = 'blank', l) => ({
    createdAt: Date.now(),
    visible: !0,
    dismissed: !1,
    type: t,
    ariaProps: { role: 'status', 'aria-live': 'polite' },
    message: e,
    pauseDuration: 0,
    ...l,
    id: l?.id || Np(),
  }),
  Ku = (e) => (t, l) => {
    let n = Hp(t, e, l)
    return (Vr(n.toasterId || Rp(n.id))({ type: 2, toast: n }), n.id)
  },
  je = (e, t) => Ku('blank')(e, t)
je.error = Ku('error')
je.success = Ku('success')
je.loading = Ku('loading')
je.custom = Ku('custom')
je.dismiss = (e, t) => {
  let l = { type: 3, toastId: e }
  t ? Vr(t)(l) : jv(l)
}
je.dismissAll = (e) => je.dismiss(void 0, e)
je.remove = (e, t) => {
  let l = { type: 4, toastId: e }
  t ? Vr(t)(l) : jv(l)
}
je.removeAll = (e) => je.remove(void 0, e)
je.promise = (e, t, l) => {
  let n = je.loading(t.loading, { ...l, ...l?.loading })
  return (
    typeof e == 'function' && (e = e()),
    e
      .then((a) => {
        let u = t.success ? dr(t.success, a) : void 0
        return (u ? je.success(u, { id: n, ...l, ...l?.success }) : je.dismiss(n), a)
      })
      .catch((a) => {
        let u = t.error ? dr(t.error, a) : void 0
        u ? je.error(u, { id: n, ...l, ...l?.error }) : je.dismiss(n)
      }),
    e
  )
}
var Yp = 1e3,
  wp = (e, t = 'default') => {
    let { toasts: l, pausedAt: n } = Bp(e, t),
      a = O.useRef(new Map()).current,
      u = O.useCallback((y, o = Yp) => {
        if (a.has(y)) return
        let v = setTimeout(() => {
          ;(a.delete(y), i({ type: 4, toastId: y }))
        }, o)
        a.set(y, v)
      }, [])
    O.useEffect(() => {
      if (n) return
      let y = Date.now(),
        o = l.map((v) => {
          if (v.duration === 1 / 0) return
          let _ = (v.duration || 0) + v.pauseDuration - (y - v.createdAt)
          if (_ < 0) {
            v.visible && je.dismiss(v.id)
            return
          }
          return setTimeout(() => je.dismiss(v.id, t), _)
        })
      return () => {
        o.forEach((v) => v && clearTimeout(v))
      }
    }, [l, n, t])
    let i = O.useCallback(Vr(t), [t]),
      r = O.useCallback(() => {
        i({ type: 5, time: Date.now() })
      }, [i]),
      c = O.useCallback(
        (y, o) => {
          i({ type: 1, toast: { id: y, height: o } })
        },
        [i],
      ),
      f = O.useCallback(() => {
        n && i({ type: 6, time: Date.now() })
      }, [n, i]),
      d = O.useCallback(
        (y, o) => {
          let { reverseOrder: v = !1, gutter: _ = 8, defaultPosition: p } = o || {},
            A = l.filter((m) => (m.position || p) === (y.position || p) && m.height),
            h = A.findIndex((m) => m.id === y.id),
            s = A.filter((m, b) => b < h && m.visible).length
          return A.filter((m) => m.visible)
            .slice(...(v ? [s + 1] : [0, s]))
            .reduce((m, b) => m + (b.height || 0) + _, 0)
        },
        [l],
      )
    return (
      O.useEffect(() => {
        l.forEach((y) => {
          if (y.dismissed) u(y.id, y.removeDelay)
          else {
            let o = a.get(y.id)
            o && (clearTimeout(o), a.delete(y.id))
          }
        })
      }, [l, u]),
      { toasts: l, handlers: { updateHeight: c, startPause: r, endPause: f, calculateOffset: d } }
    )
  },
  Vp = xl`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,
  jp = xl`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,
  qp = xl`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,
  Lp = gn('div')`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${(e) => e.primary || '#ff4b4b'};
  position: relative;
  transform: rotate(45deg);

  animation: ${Vp} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${jp} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${(e) => e.secondary || '#fff'};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${qp} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,
  Gp = xl`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,
  Xp = gn('div')`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${(e) => e.secondary || '#e0e0e0'};
  border-right-color: ${(e) => e.primary || '#616161'};
  animation: ${Gp} 1s linear infinite;
`,
  kp = xl`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,
  Zp = xl`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,
  Qp = gn('div')`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${(e) => e.primary || '#61d345'};
  position: relative;
  transform: rotate(45deg);

  animation: ${kp} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${Zp} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${(e) => e.secondary || '#fff'};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,
  Kp = gn('div')`
  position: absolute;
`,
  Wp = gn('div')`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,
  Jp = xl`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,
  Fp = gn('div')`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${Jp} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,
  $p = ({ toast: e }) => {
    let { icon: t, type: l, iconTheme: n } = e
    return t !== void 0
      ? typeof t == 'string'
        ? O.createElement(Fp, null, t)
        : t
      : l === 'blank'
        ? null
        : O.createElement(
            Wp,
            null,
            O.createElement(Xp, { ...n }),
            l !== 'loading' &&
              O.createElement(
                Kp,
                null,
                l === 'error' ? O.createElement(Lp, { ...n }) : O.createElement(Qp, { ...n }),
              ),
          )
  },
  Ip = (e) => `
0% {transform: translate3d(0,${e * -200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,
  Pp = (e) => `
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e * -150}%,-1px) scale(.6); opacity:0;}
`,
  eS = '0%{opacity:0;} 100%{opacity:1;}',
  tS = '0%{opacity:1;} 100%{opacity:0;}',
  lS = gn('div')`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,
  nS = gn('div')`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,
  aS = (e, t) => {
    let l = e.includes('top') ? 1 : -1,
      [n, a] = Hv() ? [eS, tS] : [Ip(l), Pp(l)]
    return {
      animation: t
        ? `${xl(n)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`
        : `${xl(a)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`,
    }
  },
  uS = O.memo(({ toast: e, position: t, style: l, children: n }) => {
    let a = e.height ? aS(e.position || t || 'top-center', e.visible) : { opacity: 0 },
      u = O.createElement($p, { toast: e }),
      i = O.createElement(nS, { ...e.ariaProps }, dr(e.message, e))
    return O.createElement(
      lS,
      { className: e.className, style: { ...a, ...l, ...e.style } },
      typeof n == 'function' ? n({ icon: u, message: i }) : O.createElement(O.Fragment, null, u, i),
    )
  })
Rg(O.createElement)
var iS = ({ id: e, className: t, style: l, onHeightUpdate: n, children: a }) => {
    let u = O.useCallback(
      (i) => {
        if (i) {
          let r = () => {
            let c = i.getBoundingClientRect().height
            n(e, c)
          }
          ;(r(),
            new MutationObserver(r).observe(i, { subtree: !0, childList: !0, characterData: !0 }))
        }
      },
      [e, n],
    )
    return O.createElement('div', { ref: u, className: t, style: l }, a)
  },
  rS = (e, t) => {
    let l = e.includes('top'),
      n = l ? { top: 0 } : { bottom: 0 },
      a = e.includes('center')
        ? { justifyContent: 'center' }
        : e.includes('right')
          ? { justifyContent: 'flex-end' }
          : {}
    return {
      left: 0,
      right: 0,
      display: 'flex',
      position: 'absolute',
      transition: Hv() ? void 0 : 'all 230ms cubic-bezier(.21,1.02,.73,1)',
      transform: `translateY(${t * (l ? 1 : -1)}px)`,
      ...n,
      ...a,
    }
  },
  cS = xg`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,
  yi = 16,
  lO = ({
    reverseOrder: e,
    position: t = 'top-center',
    toastOptions: l,
    gutter: n,
    children: a,
    toasterId: u,
    containerStyle: i,
    containerClassName: r,
  }) => {
    let { toasts: c, handlers: f } = wp(l, u)
    return O.createElement(
      'div',
      {
        'data-rht-toaster': u || '',
        style: {
          position: 'fixed',
          zIndex: 9999,
          top: yi,
          left: yi,
          right: yi,
          bottom: yi,
          pointerEvents: 'none',
          ...i,
        },
        className: r,
        onMouseEnter: f.startPause,
        onMouseLeave: f.endPause,
      },
      c.map((d) => {
        let y = d.position || t,
          o = f.calculateOffset(d, { reverseOrder: e, gutter: n, defaultPosition: t }),
          v = rS(y, o)
        return O.createElement(
          iS,
          {
            id: d.id,
            key: d.id,
            onHeightUpdate: f.updateHeight,
            className: d.visible ? cS : '',
            style: v,
          },
          d.type === 'custom'
            ? dr(d.message, d)
            : a
              ? a(d)
              : O.createElement(uS, { toast: d, position: y }),
        )
      }),
    )
  },
  nO = je,
  Hi = 'right-scroll-bar-position',
  Yi = 'width-before-scroll-bar',
  fS = 'with-scroll-bars-hidden',
  sS = '--removed-body-scroll-bar-size',
  qv = Ug(),
  qc = function () {},
  jr = O.forwardRef(function (e, t) {
    var l = O.useRef(null),
      n = O.useState({ onScrollCapture: qc, onWheelCapture: qc, onTouchMoveCapture: qc }),
      a = n[0],
      u = n[1],
      i = e.forwardProps,
      r = e.children,
      c = e.className,
      f = e.removeScrollBar,
      d = e.enabled,
      y = e.shards,
      o = e.sideCar,
      v = e.noRelative,
      _ = e.noIsolation,
      p = e.inert,
      A = e.allowPinchZoom,
      h = e.as,
      s = h === void 0 ? 'div' : h,
      m = e.gapMode,
      b = Bg(e, [
        'forwardProps',
        'children',
        'className',
        'removeScrollBar',
        'enabled',
        'shards',
        'sideCar',
        'noRelative',
        'noIsolation',
        'inert',
        'allowPinchZoom',
        'as',
        'gapMode',
      ]),
      S = o,
      x = Hg([l, t]),
      M = ta(ta({}, b), a)
    return O.createElement(
      O.Fragment,
      null,
      d &&
        O.createElement(S, {
          sideCar: qv,
          removeScrollBar: f,
          shards: y,
          noRelative: v,
          noIsolation: _,
          inert: p,
          setCallbacks: u,
          allowPinchZoom: !!A,
          lockRef: l,
          gapMode: m,
        }),
      i
        ? O.cloneElement(O.Children.only(r), ta(ta({}, M), { ref: x }))
        : O.createElement(s, ta({}, M, { className: c, ref: x }), r),
    )
  })
jr.defaultProps = { enabled: !0, removeScrollBar: !0, inert: !1 }
jr.classNames = { fullWidth: Yi, zeroRight: Hi }
function oS() {
  if (!document) return null
  var e = document.createElement('style')
  e.type = 'text/css'
  var t = Yg()
  return (t && e.setAttribute('nonce', t), e)
}
function dS(e, t) {
  e.styleSheet ? (e.styleSheet.cssText = t) : e.appendChild(document.createTextNode(t))
}
function yS(e) {
  var t = document.head || document.getElementsByTagName('head')[0]
  t.appendChild(e)
}
var mS = function () {
    var e = 0,
      t = null
    return {
      add: function (l) {
        ;(e == 0 && (t = oS()) && (dS(t, l), yS(t)), e++)
      },
      remove: function () {
        ;(e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), (t = null)))
      },
    }
  },
  hS = function () {
    var e = mS()
    return function (t, l) {
      O.useEffect(
        function () {
          return (
            e.add(t),
            function () {
              e.remove()
            }
          )
        },
        [t && l],
      )
    }
  },
  Lv = function () {
    var e = hS(),
      t = function (l) {
        var n = l.styles,
          a = l.dynamic
        return (e(n, a), null)
      }
    return t
  },
  vS = { left: 0, top: 0, right: 0, gap: 0 },
  Lc = function (e) {
    return parseInt(e || '', 10) || 0
  },
  gS = function (e) {
    var t = window.getComputedStyle(document.body),
      l = t[e === 'padding' ? 'paddingLeft' : 'marginLeft'],
      n = t[e === 'padding' ? 'paddingTop' : 'marginTop'],
      a = t[e === 'padding' ? 'paddingRight' : 'marginRight']
    return [Lc(l), Lc(n), Lc(a)]
  },
  bS = function (e) {
    if ((e === void 0 && (e = 'margin'), typeof window > 'u')) return vS
    var t = gS(e),
      l = document.documentElement.clientWidth,
      n = window.innerWidth
    return { left: t[0], top: t[1], right: t[2], gap: Math.max(0, n - l + t[2] - t[0]) }
  },
  pS = Lv(),
  Ma = 'data-scroll-locked',
  SS = function (e, t, l, n) {
    var a = e.left,
      u = e.top,
      i = e.right,
      r = e.gap
    return (
      l === void 0 && (l = 'margin'),
      `
  .`
        .concat(
          fS,
          ` {
   overflow: hidden `,
        )
        .concat(
          n,
          `;
   padding-right: `,
        )
        .concat(r, 'px ')
        .concat(
          n,
          `;
  }
  body[`,
        )
        .concat(
          Ma,
          `] {
    overflow: hidden `,
        )
        .concat(
          n,
          `;
    overscroll-behavior: contain;
    `,
        )
        .concat(
          [
            t && 'position: relative '.concat(n, ';'),
            l === 'margin' &&
              `
    padding-left: `
                .concat(
                  a,
                  `px;
    padding-top: `,
                )
                .concat(
                  u,
                  `px;
    padding-right: `,
                )
                .concat(
                  i,
                  `px;
    margin-left:0;
    margin-top:0;
    margin-right: `,
                )
                .concat(r, 'px ')
                .concat(
                  n,
                  `;
    `,
                ),
            l === 'padding' && 'padding-right: '.concat(r, 'px ').concat(n, ';'),
          ]
            .filter(Boolean)
            .join(''),
          `
  }
  
  .`,
        )
        .concat(
          Hi,
          ` {
    right: `,
        )
        .concat(r, 'px ')
        .concat(
          n,
          `;
  }
  
  .`,
        )
        .concat(
          Yi,
          ` {
    margin-right: `,
        )
        .concat(r, 'px ')
        .concat(
          n,
          `;
  }
  
  .`,
        )
        .concat(Hi, ' .')
        .concat(
          Hi,
          ` {
    right: 0 `,
        )
        .concat(
          n,
          `;
  }
  
  .`,
        )
        .concat(Yi, ' .')
        .concat(
          Yi,
          ` {
    margin-right: 0 `,
        )
        .concat(
          n,
          `;
  }
  
  body[`,
        )
        .concat(
          Ma,
          `] {
    `,
        )
        .concat(sS, ': ')
        .concat(
          r,
          `px;
  }
`,
        )
    )
  },
  $d = function () {
    var e = parseInt(document.body.getAttribute(Ma) || '0', 10)
    return isFinite(e) ? e : 0
  },
  ES = function () {
    O.useEffect(function () {
      return (
        document.body.setAttribute(Ma, ($d() + 1).toString()),
        function () {
          var e = $d() - 1
          e <= 0 ? document.body.removeAttribute(Ma) : document.body.setAttribute(Ma, e.toString())
        }
      )
    }, [])
  },
  DS = function (e) {
    var t = e.noRelative,
      l = e.noImportant,
      n = e.gapMode,
      a = n === void 0 ? 'margin' : n
    ES()
    var u = O.useMemo(
      function () {
        return bS(a)
      },
      [a],
    )
    return O.createElement(pS, { styles: SS(u, !t, a, l ? '' : '!important') })
  },
  Kf = !1
if (typeof window < 'u')
  try {
    var mi = Object.defineProperty({}, 'passive', {
      get: function () {
        return ((Kf = !0), !0)
      },
    })
    ;(window.addEventListener('test', mi, mi), window.removeEventListener('test', mi, mi))
  } catch {
    Kf = !1
  }
var In = Kf ? { passive: !1 } : !1,
  OS = function (e) {
    return e.tagName === 'TEXTAREA'
  },
  Gv = function (e, t) {
    if (!(e instanceof Element)) return !1
    var l = window.getComputedStyle(e)
    return l[t] !== 'hidden' && !(l.overflowY === l.overflowX && !OS(e) && l[t] === 'visible')
  },
  _S = function (e) {
    return Gv(e, 'overflowY')
  },
  MS = function (e) {
    return Gv(e, 'overflowX')
  },
  Id = function (e, t) {
    var l = t.ownerDocument,
      n = t
    do {
      typeof ShadowRoot < 'u' && n instanceof ShadowRoot && (n = n.host)
      var a = Xv(e, n)
      if (a) {
        var u = kv(e, n),
          i = u[1],
          r = u[2]
        if (i > r) return !0
      }
      n = n.parentNode
    } while (n && n !== l.body)
    return !1
  },
  AS = function (e) {
    var t = e.scrollTop,
      l = e.scrollHeight,
      n = e.clientHeight
    return [t, l, n]
  },
  TS = function (e) {
    var t = e.scrollLeft,
      l = e.scrollWidth,
      n = e.clientWidth
    return [t, l, n]
  },
  Xv = function (e, t) {
    return e === 'v' ? _S(t) : MS(t)
  },
  kv = function (e, t) {
    return e === 'v' ? AS(t) : TS(t)
  },
  CS = function (e, t) {
    return e === 'h' && t === 'rtl' ? -1 : 1
  },
  zS = function (e, t, l, n, a) {
    var u = CS(e, window.getComputedStyle(t).direction),
      i = u * n,
      r = l.target,
      c = t.contains(r),
      f = !1,
      d = i > 0,
      y = 0,
      o = 0
    do {
      if (!r) break
      var v = kv(e, r),
        _ = v[0],
        p = v[1],
        A = v[2],
        h = p - A - u * _
      ;(_ || h) && Xv(e, r) && ((y += h), (o += _))
      var s = r.parentNode
      r = s && s.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? s.host : s
    } while ((!c && r !== document.body) || (c && (t.contains(r) || t === r)))
    return (((d && Math.abs(y) < 1) || (!d && Math.abs(o) < 1)) && (f = !0), f)
  },
  hi = function (e) {
    return 'changedTouches' in e
      ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY]
      : [0, 0]
  },
  Pd = function (e) {
    return [e.deltaX, e.deltaY]
  },
  ey = function (e) {
    return e && 'current' in e ? e.current : e
  },
  NS = function (e, t) {
    return e[0] === t[0] && e[1] === t[1]
  },
  xS = function (e) {
    return `
  .block-interactivity-`
      .concat(
        e,
        ` {pointer-events: none;}
  .allow-interactivity-`,
      )
      .concat(
        e,
        ` {pointer-events: all;}
`,
      )
  },
  RS = 0,
  Pn = []
function US(e) {
  var t = O.useRef([]),
    l = O.useRef([0, 0]),
    n = O.useRef(),
    a = O.useState(RS++)[0],
    u = O.useState(Lv)[0],
    i = O.useRef(e)
  ;(O.useEffect(
    function () {
      i.current = e
    },
    [e],
  ),
    O.useEffect(
      function () {
        if (e.inert) {
          document.body.classList.add('block-interactivity-'.concat(a))
          var p = wg([e.lockRef.current], (e.shards || []).map(ey), !0).filter(Boolean)
          return (
            p.forEach(function (A) {
              return A.classList.add('allow-interactivity-'.concat(a))
            }),
            function () {
              ;(document.body.classList.remove('block-interactivity-'.concat(a)),
                p.forEach(function (A) {
                  return A.classList.remove('allow-interactivity-'.concat(a))
                }))
            }
          )
        }
      },
      [e.inert, e.lockRef.current, e.shards],
    ))
  var r = O.useCallback(function (p, A) {
      if (('touches' in p && p.touches.length === 2) || (p.type === 'wheel' && p.ctrlKey))
        return !i.current.allowPinchZoom
      var h = hi(p),
        s = l.current,
        m = 'deltaX' in p ? p.deltaX : s[0] - h[0],
        b = 'deltaY' in p ? p.deltaY : s[1] - h[1],
        S,
        x = p.target,
        M = Math.abs(m) > Math.abs(b) ? 'h' : 'v'
      if ('touches' in p && M === 'h' && x.type === 'range') return !1
      var R = Id(M, x)
      if (!R) return !0
      if ((R ? (S = M) : ((S = M === 'v' ? 'h' : 'v'), (R = Id(M, x))), !R)) return !1
      if ((!n.current && 'changedTouches' in p && (m || b) && (n.current = S), !S)) return !0
      var H = n.current || S
      return zS(H, A, p, H === 'h' ? m : b)
    }, []),
    c = O.useCallback(function (p) {
      var A = p
      if (!(!Pn.length || Pn[Pn.length - 1] !== u)) {
        var h = 'deltaY' in A ? Pd(A) : hi(A),
          s = t.current.filter(function (S) {
            return (
              S.name === A.type &&
              (S.target === A.target || A.target === S.shadowParent) &&
              NS(S.delta, h)
            )
          })[0]
        if (s && s.should) {
          A.cancelable && A.preventDefault()
          return
        }
        if (!s) {
          var m = (i.current.shards || [])
              .map(ey)
              .filter(Boolean)
              .filter(function (S) {
                return S.contains(A.target)
              }),
            b = m.length > 0 ? r(A, m[0]) : !i.current.noIsolation
          b && A.cancelable && A.preventDefault()
        }
      }
    }, []),
    f = O.useCallback(function (p, A, h, s) {
      var m = { name: p, delta: A, target: h, should: s, shadowParent: BS(h) }
      ;(t.current.push(m),
        setTimeout(function () {
          t.current = t.current.filter(function (b) {
            return b !== m
          })
        }, 1))
    }, []),
    d = O.useCallback(function (p) {
      ;((l.current = hi(p)), (n.current = void 0))
    }, []),
    y = O.useCallback(function (p) {
      f(p.type, Pd(p), p.target, r(p, e.lockRef.current))
    }, []),
    o = O.useCallback(function (p) {
      f(p.type, hi(p), p.target, r(p, e.lockRef.current))
    }, [])
  O.useEffect(function () {
    return (
      Pn.push(u),
      e.setCallbacks({ onScrollCapture: y, onWheelCapture: y, onTouchMoveCapture: o }),
      document.addEventListener('wheel', c, In),
      document.addEventListener('touchmove', c, In),
      document.addEventListener('touchstart', d, In),
      function () {
        ;((Pn = Pn.filter(function (p) {
          return p !== u
        })),
          document.removeEventListener('wheel', c, In),
          document.removeEventListener('touchmove', c, In),
          document.removeEventListener('touchstart', d, In))
      }
    )
  }, [])
  var v = e.removeScrollBar,
    _ = e.inert
  return O.createElement(
    O.Fragment,
    null,
    _ ? O.createElement(u, { styles: xS(a) }) : null,
    v ? O.createElement(DS, { noRelative: e.noRelative, gapMode: e.gapMode }) : null,
  )
}
function BS(e) {
  for (var t = null; e !== null; )
    (e instanceof ShadowRoot && ((t = e.host), (e = e.host)), (e = e.parentNode))
  return t
}
const HS = Vg(qv, US)
var YS = O.forwardRef(function (e, t) {
  return O.createElement(jr, ta({}, e, { ref: t, sideCar: HS }))
})
YS.classNames = jr.classNames
var Wu = (e) => e.type === 'checkbox',
  Nn = (e) => e instanceof Date,
  rt = (e) => e == null
const Zv = (e) => typeof e == 'object'
var we = (e) => !rt(e) && !Array.isArray(e) && Zv(e) && !Nn(e),
  Qv = (e) => (we(e) && e.target ? (Wu(e.target) ? e.target.checked : e.target.value) : e),
  wS = (e) => e.substring(0, e.search(/\.\d+(\.|$)/)) || e,
  Kv = (e, t) => e.has(wS(t)),
  VS = (e) => {
    const t = e.constructor && e.constructor.prototype
    return we(t) && t.hasOwnProperty('isPrototypeOf')
  },
  uo = typeof window < 'u' && typeof window.HTMLElement < 'u' && typeof document < 'u'
function Ve(e) {
  let t
  const l = Array.isArray(e),
    n = typeof FileList < 'u' ? e instanceof FileList : !1
  if (e instanceof Date) t = new Date(e)
  else if (!(uo && (e instanceof Blob || n)) && (l || we(e)))
    if (((t = l ? [] : Object.create(Object.getPrototypeOf(e))), !l && !VS(e))) t = e
    else for (const a in e) e.hasOwnProperty(a) && (t[a] = Ve(e[a]))
  else return e
  return t
}
var qr = (e) => /^\w*$/.test(e),
  Me = (e) => e === void 0,
  io = (e) => (Array.isArray(e) ? e.filter(Boolean) : []),
  ro = (e) => io(e.replace(/["|']|\]/g, '').split(/\.|\[/)),
  Y = (e, t, l) => {
    if (!t || !we(e)) return l
    const n = (qr(t) ? [t] : ro(t)).reduce((a, u) => (rt(a) ? a : a[u]), e)
    return Me(n) || n === e ? (Me(e[t]) ? l : e[t]) : n
  },
  vt = (e) => typeof e == 'boolean',
  me = (e, t, l) => {
    let n = -1
    const a = qr(t) ? [t] : ro(t),
      u = a.length,
      i = u - 1
    for (; ++n < u; ) {
      const r = a[n]
      let c = l
      if (n !== i) {
        const f = e[r]
        c = we(f) || Array.isArray(f) ? f : isNaN(+a[n + 1]) ? {} : []
      }
      if (r === '__proto__' || r === 'constructor' || r === 'prototype') return
      ;((e[r] = c), (e = e[r]))
    }
  }
const yr = { BLUR: 'blur', FOCUS_OUT: 'focusout', CHANGE: 'change' },
  Zt = {
    onBlur: 'onBlur',
    onChange: 'onChange',
    onSubmit: 'onSubmit',
    onTouched: 'onTouched',
    all: 'all',
  },
  bl = {
    max: 'max',
    min: 'min',
    maxLength: 'maxLength',
    minLength: 'minLength',
    pattern: 'pattern',
    required: 'required',
    validate: 'validate',
  },
  co = N.createContext(null)
co.displayName = 'HookFormContext'
const fo = () => N.useContext(co),
  aO = (e) => {
    const { children: t, ...l } = e
    return N.createElement(co.Provider, { value: l }, t)
  }
var Wv = (e, t, l, n = !0) => {
  const a = { defaultValues: t._defaultValues }
  for (const u in e)
    Object.defineProperty(a, u, {
      get: () => {
        const i = u
        return (
          t._proxyFormState[i] !== Zt.all && (t._proxyFormState[i] = !n || Zt.all),
          l && (l[i] = !0),
          e[i]
        )
      },
    })
  return a
}
const so = typeof window < 'u' ? N.useLayoutEffect : N.useEffect
function jS(e) {
  const t = fo(),
    { control: l = t.control, disabled: n, name: a, exact: u } = e || {},
    [i, r] = N.useState(l._formState),
    c = N.useRef({
      isDirty: !1,
      isLoading: !1,
      dirtyFields: !1,
      touchedFields: !1,
      validatingFields: !1,
      isValidating: !1,
      isValid: !1,
      errors: !1,
    })
  return (
    so(
      () =>
        l._subscribe({
          name: a,
          formState: c.current,
          exact: u,
          callback: (f) => {
            !n && r({ ...l._formState, ...f })
          },
        }),
      [a, n, u],
    ),
    N.useEffect(() => {
      c.current.isValid && l._setValid(!0)
    }, [l]),
    N.useMemo(() => Wv(i, l, c.current, !1), [i, l])
  )
}
var pt = (e) => typeof e == 'string',
  Jv = (e, t, l, n, a) =>
    pt(e)
      ? (n && t.watch.add(e), Y(l, e, a))
      : Array.isArray(e)
        ? e.map((u) => (n && t.watch.add(u), Y(l, u)))
        : (n && (t.watchAll = !0), l),
  Wf = (e) => rt(e) || !Zv(e)
function Dl(e, t, l = new WeakSet()) {
  if (Wf(e) || Wf(t)) return e === t
  if (Nn(e) && Nn(t)) return e.getTime() === t.getTime()
  const n = Object.keys(e),
    a = Object.keys(t)
  if (n.length !== a.length) return !1
  if (l.has(e) || l.has(t)) return !0
  ;(l.add(e), l.add(t))
  for (const u of n) {
    const i = e[u]
    if (!a.includes(u)) return !1
    if (u !== 'ref') {
      const r = t[u]
      if (
        (Nn(i) && Nn(r)) || (we(i) && we(r)) || (Array.isArray(i) && Array.isArray(r))
          ? !Dl(i, r, l)
          : i !== r
      )
        return !1
    }
  }
  return !0
}
function qS(e) {
  const t = fo(),
    {
      control: l = t.control,
      name: n,
      defaultValue: a,
      disabled: u,
      exact: i,
      compute: r,
    } = e || {},
    c = N.useRef(a),
    f = N.useRef(r),
    d = N.useRef(void 0)
  f.current = r
  const y = N.useMemo(() => l._getWatch(n, c.current), [l, n]),
    [o, v] = N.useState(f.current ? f.current(y) : y)
  return (
    so(
      () =>
        l._subscribe({
          name: n,
          formState: { values: !0 },
          exact: i,
          callback: (_) => {
            if (!u) {
              const p = Jv(n, l._names, _.values || l._formValues, !1, c.current)
              if (f.current) {
                const A = f.current(p)
                Dl(A, d.current) || (v(A), (d.current = A))
              } else v(p)
            }
          },
        }),
      [l, u, n, i],
    ),
    N.useEffect(() => l._removeUnmounted()),
    o
  )
}
function LS(e) {
  const t = fo(),
    { name: l, disabled: n, control: a = t.control, shouldUnregister: u, defaultValue: i } = e,
    r = Kv(a._names.array, l),
    c = N.useMemo(() => Y(a._formValues, l, Y(a._defaultValues, l, i)), [a, l, i]),
    f = qS({ control: a, name: l, defaultValue: c, exact: !0 }),
    d = jS({ control: a, name: l, exact: !0 }),
    y = N.useRef(e),
    o = N.useRef(void 0),
    v = N.useRef(
      a.register(l, { ...e.rules, value: f, ...(vt(e.disabled) ? { disabled: e.disabled } : {}) }),
    )
  y.current = e
  const _ = N.useMemo(
      () =>
        Object.defineProperties(
          {},
          {
            invalid: { enumerable: !0, get: () => !!Y(d.errors, l) },
            isDirty: { enumerable: !0, get: () => !!Y(d.dirtyFields, l) },
            isTouched: { enumerable: !0, get: () => !!Y(d.touchedFields, l) },
            isValidating: { enumerable: !0, get: () => !!Y(d.validatingFields, l) },
            error: { enumerable: !0, get: () => Y(d.errors, l) },
          },
        ),
      [d, l],
    ),
    p = N.useCallback(
      (m) => v.current.onChange({ target: { value: Qv(m), name: l }, type: yr.CHANGE }),
      [l],
    ),
    A = N.useCallback(
      () => v.current.onBlur({ target: { value: Y(a._formValues, l), name: l }, type: yr.BLUR }),
      [l, a._formValues],
    ),
    h = N.useCallback(
      (m) => {
        const b = Y(a._fields, l)
        b &&
          m &&
          (b._f.ref = {
            focus: () => m.focus && m.focus(),
            select: () => m.select && m.select(),
            setCustomValidity: (S) => m.setCustomValidity(S),
            reportValidity: () => m.reportValidity(),
          })
      },
      [a._fields, l],
    ),
    s = N.useMemo(
      () => ({
        name: l,
        value: f,
        ...(vt(n) || d.disabled ? { disabled: d.disabled || n } : {}),
        onChange: p,
        onBlur: A,
        ref: h,
      }),
      [l, n, d.disabled, p, A, h, f],
    )
  return (
    N.useEffect(() => {
      const m = a._options.shouldUnregister || u,
        b = o.current
      ;(b && b !== l && !r && a.unregister(b),
        a.register(l, {
          ...y.current.rules,
          ...(vt(y.current.disabled) ? { disabled: y.current.disabled } : {}),
        }))
      const S = (x, M) => {
        const R = Y(a._fields, x)
        R && R._f && (R._f.mount = M)
      }
      if ((S(l, !0), m)) {
        const x = Ve(Y(a._options.defaultValues, l, y.current.defaultValue))
        ;(me(a._defaultValues, l, x), Me(Y(a._formValues, l)) && me(a._formValues, l, x))
      }
      return (
        !r && a.register(l),
        (o.current = l),
        () => {
          ;(r ? m && !a._state.action : m) ? a.unregister(l) : S(l, !1)
        }
      )
    }, [l, a, r, u]),
    N.useEffect(() => {
      a._setDisabledField({ disabled: n, name: l })
    }, [n, l, a]),
    N.useMemo(() => ({ field: s, formState: d, fieldState: _ }), [s, d, _])
  )
}
const uO = (e) => e.render(LS(e))
var GS = (e, t, l, n, a) =>
    t ? { ...l[e], types: { ...(l[e] && l[e].types ? l[e].types : {}), [n]: a || !0 } } : {},
  bu = (e) => (Array.isArray(e) ? e : [e]),
  ty = () => {
    let e = []
    return {
      get observers() {
        return e
      },
      next: (a) => {
        for (const u of e) u.next && u.next(a)
      },
      subscribe: (a) => (
        e.push(a),
        {
          unsubscribe: () => {
            e = e.filter((u) => u !== a)
          },
        }
      ),
      unsubscribe: () => {
        e = []
      },
    }
  }
function Fv(e, t) {
  const l = {}
  for (const n in e)
    if (e.hasOwnProperty(n)) {
      const a = e[n],
        u = t[n]
      if (a && we(a) && u) {
        const i = Fv(a, u)
        we(i) && (l[n] = i)
      } else e[n] && (l[n] = u)
    }
  return l
}
var ut = (e) => we(e) && !Object.keys(e).length,
  oo = (e) => e.type === 'file',
  Qt = (e) => typeof e == 'function',
  mr = (e) => {
    if (!uo) return !1
    const t = e ? e.ownerDocument : 0
    return e instanceof (t && t.defaultView ? t.defaultView.HTMLElement : HTMLElement)
  },
  $v = (e) => e.type === 'select-multiple',
  yo = (e) => e.type === 'radio',
  XS = (e) => yo(e) || Wu(e),
  Gc = (e) => mr(e) && e.isConnected
function kS(e, t) {
  const l = t.slice(0, -1).length
  let n = 0
  for (; n < l; ) e = Me(e) ? n++ : e[t[n++]]
  return e
}
function ZS(e) {
  for (const t in e) if (e.hasOwnProperty(t) && !Me(e[t])) return !1
  return !0
}
function Re(e, t) {
  const l = Array.isArray(t) ? t : qr(t) ? [t] : ro(t),
    n = l.length === 1 ? e : kS(e, l),
    a = l.length - 1,
    u = l[a]
  return (
    n && delete n[u],
    a !== 0 && ((we(n) && ut(n)) || (Array.isArray(n) && ZS(n))) && Re(e, l.slice(0, -1)),
    e
  )
}
var QS = (e) => {
  for (const t in e) if (Qt(e[t])) return !0
  return !1
}
function Iv(e) {
  return Array.isArray(e) || (we(e) && !QS(e))
}
function Jf(e, t = {}) {
  for (const l in e)
    Iv(e[l]) ? ((t[l] = Array.isArray(e[l]) ? [] : {}), Jf(e[l], t[l])) : Me(e[l]) || (t[l] = !0)
  return t
}
function ua(e, t, l) {
  l || (l = Jf(t))
  for (const n in e)
    Iv(e[n])
      ? Me(t) || Wf(l[n])
        ? (l[n] = Jf(e[n], Array.isArray(e[n]) ? [] : {}))
        : ua(e[n], rt(t) ? {} : t[n], l[n])
      : (l[n] = !Dl(e[n], t[n]))
  return l
}
const ly = { value: !1, isValid: !1 },
  ny = { value: !0, isValid: !0 }
var Pv = (e) => {
    if (Array.isArray(e)) {
      if (e.length > 1) {
        const t = e.filter((l) => l && l.checked && !l.disabled).map((l) => l.value)
        return { value: t, isValid: !!t.length }
      }
      return e[0].checked && !e[0].disabled
        ? e[0].attributes && !Me(e[0].attributes.value)
          ? Me(e[0].value) || e[0].value === ''
            ? ny
            : { value: e[0].value, isValid: !0 }
          : ny
        : ly
    }
    return ly
  },
  eg = (e, { valueAsNumber: t, valueAsDate: l, setValueAs: n }) =>
    Me(e) ? e : t ? (e === '' ? NaN : e && +e) : l && pt(e) ? new Date(e) : n ? n(e) : e
const ay = { isValid: !1, value: null }
var tg = (e) =>
  Array.isArray(e)
    ? e.reduce((t, l) => (l && l.checked && !l.disabled ? { isValid: !0, value: l.value } : t), ay)
    : ay
function uy(e) {
  const t = e.ref
  return oo(t)
    ? t.files
    : yo(t)
      ? tg(e.refs).value
      : $v(t)
        ? [...t.selectedOptions].map(({ value: l }) => l)
        : Wu(t)
          ? Pv(e.refs).value
          : eg(Me(t.value) ? e.ref.value : t.value, e)
}
var KS = (e, t, l, n) => {
    const a = {}
    for (const u of e) {
      const i = Y(t, u)
      i && me(a, u, i._f)
    }
    return { criteriaMode: l, names: [...e], fields: a, shouldUseNativeValidation: n }
  },
  hr = (e) => e instanceof RegExp,
  Ia = (e) => (Me(e) ? e : hr(e) ? e.source : we(e) ? (hr(e.value) ? e.value.source : e.value) : e),
  iy = (e) => ({
    isOnSubmit: !e || e === Zt.onSubmit,
    isOnBlur: e === Zt.onBlur,
    isOnChange: e === Zt.onChange,
    isOnAll: e === Zt.all,
    isOnTouch: e === Zt.onTouched,
  })
const ry = 'AsyncFunction'
var WS = (e) =>
    !!e &&
    !!e.validate &&
    !!(
      (Qt(e.validate) && e.validate.constructor.name === ry) ||
      (we(e.validate) && Object.values(e.validate).find((t) => t.constructor.name === ry))
    ),
  JS = (e) =>
    e.mount &&
    (e.required || e.min || e.max || e.maxLength || e.minLength || e.pattern || e.validate),
  cy = (e, t, l) =>
    !l &&
    (t.watchAll ||
      t.watch.has(e) ||
      [...t.watch].some((n) => e.startsWith(n) && /^\.\w+/.test(e.slice(n.length))))
const pu = (e, t, l, n) => {
  for (const a of l || Object.keys(e)) {
    const u = Y(e, a)
    if (u) {
      const { _f: i, ...r } = u
      if (i) {
        if (i.refs && i.refs[0] && t(i.refs[0], a) && !n) return !0
        if (i.ref && t(i.ref, i.name) && !n) return !0
        if (pu(r, t)) break
      } else if (we(r) && pu(r, t)) break
    }
  }
}
function fy(e, t, l) {
  const n = Y(e, l)
  if (n || qr(l)) return { error: n, name: l }
  const a = l.split('.')
  for (; a.length; ) {
    const u = a.join('.'),
      i = Y(t, u),
      r = Y(e, u)
    if (i && !Array.isArray(i) && l !== u) return { name: l }
    if (r && r.type) return { name: u, error: r }
    if (r && r.root && r.root.type) return { name: `${u}.root`, error: r.root }
    a.pop()
  }
  return { name: l }
}
var FS = (e, t, l, n) => {
    l(e)
    const { name: a, ...u } = e
    return (
      ut(u) ||
      Object.keys(u).length >= Object.keys(t).length ||
      Object.keys(u).find((i) => t[i] === (!n || Zt.all))
    )
  },
  $S = (e, t, l) =>
    !e ||
    !t ||
    e === t ||
    bu(e).some((n) => n && (l ? n === t : n.startsWith(t) || t.startsWith(n))),
  IS = (e, t, l, n, a) =>
    a.isOnAll
      ? !1
      : !l && a.isOnTouch
        ? !(t || e)
        : (l ? n.isOnBlur : a.isOnBlur)
          ? !e
          : (l ? n.isOnChange : a.isOnChange)
            ? e
            : !0,
  PS = (e, t) => !io(Y(e, t)).length && Re(e, t),
  eE = (e, t, l) => {
    const n = bu(Y(e, l))
    return (me(n, 'root', t[l]), me(e, l, n), e)
  }
function sy(e, t, l = 'validate') {
  if (pt(e) || (Array.isArray(e) && e.every(pt)) || (vt(e) && !e))
    return { type: l, message: pt(e) ? e : '', ref: t }
}
var ea = (e) => (we(e) && !hr(e) ? e : { value: e, message: '' }),
  oy = async (e, t, l, n, a, u) => {
    const {
        ref: i,
        refs: r,
        required: c,
        maxLength: f,
        minLength: d,
        min: y,
        max: o,
        pattern: v,
        validate: _,
        name: p,
        valueAsNumber: A,
        mount: h,
      } = e._f,
      s = Y(l, p)
    if (!h || t.has(p)) return {}
    const m = r ? r[0] : i,
      b = (j) => {
        a && m.reportValidity && (m.setCustomValidity(vt(j) ? '' : j || ''), m.reportValidity())
      },
      S = {},
      x = yo(i),
      M = Wu(i),
      R = x || M,
      H =
        ((A || oo(i)) && Me(i.value) && Me(s)) ||
        (mr(i) && i.value === '') ||
        s === '' ||
        (Array.isArray(s) && !s.length),
      w = GS.bind(null, p, n, S),
      J = (j, W, G, P = bl.maxLength, Te = bl.minLength) => {
        const Ze = j ? W : G
        S[p] = { type: j ? P : Te, message: Ze, ref: i, ...w(j ? P : Te, Ze) }
      }
    if (
      u
        ? !Array.isArray(s) || !s.length
        : c &&
          ((!R && (H || rt(s))) || (vt(s) && !s) || (M && !Pv(r).isValid) || (x && !tg(r).isValid))
    ) {
      const { value: j, message: W } = pt(c) ? { value: !!c, message: c } : ea(c)
      if (j && ((S[p] = { type: bl.required, message: W, ref: m, ...w(bl.required, W) }), !n))
        return (b(W), S)
    }
    if (!H && (!rt(y) || !rt(o))) {
      let j, W
      const G = ea(o),
        P = ea(y)
      if (!rt(s) && !isNaN(s)) {
        const Te = i.valueAsNumber || (s && +s)
        ;(rt(G.value) || (j = Te > G.value), rt(P.value) || (W = Te < P.value))
      } else {
        const Te = i.valueAsDate || new Date(s),
          Ze = ($e) => new Date(new Date().toDateString() + ' ' + $e),
          Ce = i.type == 'time',
          te = i.type == 'week'
        ;(pt(G.value) &&
          s &&
          (j = Ce ? Ze(s) > Ze(G.value) : te ? s > G.value : Te > new Date(G.value)),
          pt(P.value) &&
            s &&
            (W = Ce ? Ze(s) < Ze(P.value) : te ? s < P.value : Te < new Date(P.value)))
      }
      if ((j || W) && (J(!!j, G.message, P.message, bl.max, bl.min), !n))
        return (b(S[p].message), S)
    }
    if ((f || d) && !H && (pt(s) || (u && Array.isArray(s)))) {
      const j = ea(f),
        W = ea(d),
        G = !rt(j.value) && s.length > +j.value,
        P = !rt(W.value) && s.length < +W.value
      if ((G || P) && (J(G, j.message, W.message), !n)) return (b(S[p].message), S)
    }
    if (v && !H && pt(s)) {
      const { value: j, message: W } = ea(v)
      if (
        hr(j) &&
        !s.match(j) &&
        ((S[p] = { type: bl.pattern, message: W, ref: i, ...w(bl.pattern, W) }), !n)
      )
        return (b(W), S)
    }
    if (_) {
      if (Qt(_)) {
        const j = await _(s, l),
          W = sy(j, m)
        if (W && ((S[p] = { ...W, ...w(bl.validate, W.message) }), !n)) return (b(W.message), S)
      } else if (we(_)) {
        let j = {}
        for (const W in _) {
          if (!ut(j) && !n) break
          const G = sy(await _[W](s, l), m, W)
          G && ((j = { ...G, ...w(W, G.message) }), b(G.message), n && (S[p] = j))
        }
        if (!ut(j) && ((S[p] = { ref: m, ...j }), !n)) return S
      }
    }
    return (b(!0), S)
  }
const tE = { mode: Zt.onSubmit, reValidateMode: Zt.onChange, shouldFocusError: !0 }
function lE(e = {}) {
  let t = { ...tE, ...e },
    l = {
      submitCount: 0,
      isDirty: !1,
      isReady: !1,
      isLoading: Qt(t.defaultValues),
      isValidating: !1,
      isSubmitted: !1,
      isSubmitting: !1,
      isSubmitSuccessful: !1,
      isValid: !1,
      touchedFields: {},
      dirtyFields: {},
      validatingFields: {},
      errors: t.errors || {},
      disabled: t.disabled || !1,
    },
    n = {},
    a = we(t.defaultValues) || we(t.values) ? Ve(t.defaultValues || t.values) || {} : {},
    u = t.shouldUnregister ? {} : Ve(a),
    i = { action: !1, mount: !1, watch: !1 },
    r = {
      mount: new Set(),
      disabled: new Set(),
      unMount: new Set(),
      array: new Set(),
      watch: new Set(),
    },
    c,
    f = 0
  const d = {
    isDirty: !1,
    dirtyFields: !1,
    validatingFields: !1,
    touchedFields: !1,
    isValidating: !1,
    isValid: !1,
    errors: !1,
  }
  let y = { ...d }
  const o = { array: ty(), state: ty() },
    v = t.criteriaMode === Zt.all,
    _ = (g) => (E) => {
      ;(clearTimeout(f), (f = setTimeout(g, E)))
    },
    p = async (g) => {
      if (!t.disabled && (d.isValid || y.isValid || g)) {
        const E = t.resolver ? ut((await M()).errors) : await H(n, !0)
        E !== l.isValid && o.state.next({ isValid: E })
      }
    },
    A = (g, E) => {
      !t.disabled &&
        (d.isValidating || d.validatingFields || y.isValidating || y.validatingFields) &&
        ((g || Array.from(r.mount)).forEach((C) => {
          C && (E ? me(l.validatingFields, C, E) : Re(l.validatingFields, C))
        }),
        o.state.next({
          validatingFields: l.validatingFields,
          isValidating: !ut(l.validatingFields),
        }))
    },
    h = (g, E = [], C, B, D = !0, T = !0) => {
      if (B && C && !t.disabled) {
        if (((i.action = !0), T && Array.isArray(Y(n, g)))) {
          const U = C(Y(n, g), B.argA, B.argB)
          D && me(n, g, U)
        }
        if (T && Array.isArray(Y(l.errors, g))) {
          const U = C(Y(l.errors, g), B.argA, B.argB)
          ;(D && me(l.errors, g, U), PS(l.errors, g))
        }
        if ((d.touchedFields || y.touchedFields) && T && Array.isArray(Y(l.touchedFields, g))) {
          const U = C(Y(l.touchedFields, g), B.argA, B.argB)
          D && me(l.touchedFields, g, U)
        }
        ;((d.dirtyFields || y.dirtyFields) && (l.dirtyFields = ua(a, u)),
          o.state.next({
            name: g,
            isDirty: J(g, E),
            dirtyFields: l.dirtyFields,
            errors: l.errors,
            isValid: l.isValid,
          }))
      } else me(u, g, E)
    },
    s = (g, E) => {
      ;(me(l.errors, g, E), o.state.next({ errors: l.errors }))
    },
    m = (g) => {
      ;((l.errors = g), o.state.next({ errors: l.errors, isValid: !1 }))
    },
    b = (g, E, C, B) => {
      const D = Y(n, g)
      if (D) {
        const T = Y(u, g, Me(C) ? Y(a, g) : C)
        ;(Me(T) || (B && B.defaultChecked) || E ? me(u, g, E ? T : uy(D._f)) : G(g, T),
          i.mount && p())
      }
    },
    S = (g, E, C, B, D) => {
      let T = !1,
        U = !1
      const q = { name: g }
      if (!t.disabled) {
        if (!C || B) {
          ;(d.isDirty || y.isDirty) &&
            ((U = l.isDirty), (l.isDirty = q.isDirty = J()), (T = U !== q.isDirty))
          const Z = Dl(Y(a, g), E)
          ;((U = !!Y(l.dirtyFields, g)),
            Z ? Re(l.dirtyFields, g) : me(l.dirtyFields, g, !0),
            (q.dirtyFields = l.dirtyFields),
            (T = T || ((d.dirtyFields || y.dirtyFields) && U !== !Z)))
        }
        if (C) {
          const Z = Y(l.touchedFields, g)
          Z ||
            (me(l.touchedFields, g, C),
            (q.touchedFields = l.touchedFields),
            (T = T || ((d.touchedFields || y.touchedFields) && Z !== C)))
        }
        T && D && o.state.next(q)
      }
      return T ? q : {}
    },
    x = (g, E, C, B) => {
      const D = Y(l.errors, g),
        T = (d.isValid || y.isValid) && vt(E) && l.isValid !== E
      if (
        (t.delayError && C
          ? ((c = _(() => s(g, C))), c(t.delayError))
          : (clearTimeout(f), (c = null), C ? me(l.errors, g, C) : Re(l.errors, g)),
        (C ? !Dl(D, C) : D) || !ut(B) || T)
      ) {
        const U = { ...B, ...(T && vt(E) ? { isValid: E } : {}), errors: l.errors, name: g }
        ;((l = { ...l, ...U }), o.state.next(U))
      }
    },
    M = async (g) => {
      A(g, !0)
      const E = await t.resolver(
        u,
        t.context,
        KS(g || r.mount, n, t.criteriaMode, t.shouldUseNativeValidation),
      )
      return (A(g), E)
    },
    R = async (g) => {
      const { errors: E } = await M(g)
      if (g)
        for (const C of g) {
          const B = Y(E, C)
          B ? me(l.errors, C, B) : Re(l.errors, C)
        }
      else l.errors = E
      return E
    },
    H = async (g, E, C = { valid: !0 }) => {
      for (const B in g) {
        const D = g[B]
        if (D) {
          const { _f: T, ...U } = D
          if (T) {
            const q = r.array.has(T.name),
              Z = D._f && WS(D._f)
            Z && d.validatingFields && A([T.name], !0)
            const xe = await oy(D, r.disabled, u, v, t.shouldUseNativeValidation && !E, q)
            if ((Z && d.validatingFields && A([T.name]), xe[T.name] && ((C.valid = !1), E))) break
            !E &&
              (Y(xe, T.name)
                ? q
                  ? eE(l.errors, xe, T.name)
                  : me(l.errors, T.name, xe[T.name])
                : Re(l.errors, T.name))
          }
          !ut(U) && (await H(U, E, C))
        }
      }
      return C.valid
    },
    w = () => {
      for (const g of r.unMount) {
        const E = Y(n, g)
        E && (E._f.refs ? E._f.refs.every((C) => !Gc(C)) : !Gc(E._f.ref)) && jl(g)
      }
      r.unMount = new Set()
    },
    J = (g, E) => !t.disabled && (g && E && me(u, g, E), !Dl($e(), a)),
    j = (g, E, C) => Jv(g, r, { ...(i.mount ? u : Me(E) ? a : pt(g) ? { [g]: E } : E) }, C, E),
    W = (g) => io(Y(i.mount ? u : a, g, t.shouldUnregister ? Y(a, g, []) : [])),
    G = (g, E, C = {}) => {
      const B = Y(n, g)
      let D = E
      if (B) {
        const T = B._f
        T &&
          (!T.disabled && me(u, g, eg(E, T)),
          (D = mr(T.ref) && rt(E) ? '' : E),
          $v(T.ref)
            ? [...T.ref.options].forEach((U) => (U.selected = D.includes(U.value)))
            : T.refs
              ? Wu(T.ref)
                ? T.refs.forEach((U) => {
                    ;(!U.defaultChecked || !U.disabled) &&
                      (Array.isArray(D)
                        ? (U.checked = !!D.find((q) => q === U.value))
                        : (U.checked = D === U.value || !!D))
                  })
                : T.refs.forEach((U) => (U.checked = U.value === D))
              : oo(T.ref)
                ? (T.ref.value = '')
                : ((T.ref.value = D), T.ref.type || o.state.next({ name: g, values: Ve(u) })))
      }
      ;((C.shouldDirty || C.shouldTouch) && S(g, D, C.shouldTouch, C.shouldDirty, !0),
        C.shouldValidate && te(g))
    },
    P = (g, E, C) => {
      for (const B in E) {
        if (!E.hasOwnProperty(B)) return
        const D = E[B],
          T = g + '.' + B,
          U = Y(n, T)
        ;(r.array.has(g) || we(D) || (U && !U._f)) && !Nn(D) ? P(T, D, C) : G(T, D, C)
      }
    },
    Te = (g, E, C = {}) => {
      const B = Y(n, g),
        D = r.array.has(g),
        T = Ve(E)
      ;(me(u, g, T),
        D
          ? (o.array.next({ name: g, values: Ve(u) }),
            (d.isDirty || d.dirtyFields || y.isDirty || y.dirtyFields) &&
              C.shouldDirty &&
              o.state.next({ name: g, dirtyFields: ua(a, u), isDirty: J(g, T) }))
          : B && !B._f && !rt(T)
            ? P(g, T, C)
            : G(g, T, C),
        cy(g, r) && o.state.next({ ...l, name: g }),
        o.state.next({ name: i.mount ? g : void 0, values: Ve(u) }))
    },
    Ze = async (g) => {
      i.mount = !0
      const E = g.target
      let C = E.name,
        B = !0
      const D = Y(n, C),
        T = (Z) => {
          B = Number.isNaN(Z) || (Nn(Z) && isNaN(Z.getTime())) || Dl(Z, Y(u, C, Z))
        },
        U = iy(t.mode),
        q = iy(t.reValidateMode)
      if (D) {
        let Z, xe
        const dt = E.type ? uy(D._f) : Qv(g),
          tt = g.type === yr.BLUR || g.type === yr.FOCUS_OUT,
          En =
            (!JS(D._f) && !t.resolver && !Y(l.errors, C) && !D._f.deps) ||
            IS(tt, Y(l.touchedFields, C), l.isSubmitted, q, U),
          dl = cy(C, r, tt)
        ;(me(u, C, dt),
          tt
            ? (!E || !E.readOnly) && (D._f.onBlur && D._f.onBlur(g), c && c(0))
            : D._f.onChange && D._f.onChange(g))
        const It = S(C, dt, tt),
          Dn = !ut(It) || dl
        if ((!tt && o.state.next({ name: C, type: g.type, values: Ve(u) }), En))
          return (
            (d.isValid || y.isValid) && (t.mode === 'onBlur' ? tt && p() : tt || p()),
            Dn && o.state.next({ name: C, ...(dl ? {} : It) })
          )
        if ((!tt && dl && o.state.next({ ...l }), t.resolver)) {
          const { errors: yl } = await M([C])
          if ((T(dt), B)) {
            const On = fy(l.errors, n, C),
              X = fy(yl, n, On.name || C)
            ;((Z = X.error), (C = X.name), (xe = ut(yl)))
          }
        } else
          (A([C], !0),
            (Z = (await oy(D, r.disabled, u, v, t.shouldUseNativeValidation))[C]),
            A([C]),
            T(dt),
            B && (Z ? (xe = !1) : (d.isValid || y.isValid) && (xe = await H(n, !0))))
        B &&
          (D._f.deps && (!Array.isArray(D._f.deps) || D._f.deps.length > 0) && te(D._f.deps),
          x(C, xe, Z, It))
      }
    },
    Ce = (g, E) => {
      if (Y(l.errors, E) && g.focus) return (g.focus(), 1)
    },
    te = async (g, E = {}) => {
      let C, B
      const D = bu(g)
      if (t.resolver) {
        const T = await R(Me(g) ? g : D)
        ;((C = ut(T)), (B = g ? !D.some((U) => Y(T, U)) : C))
      } else
        g
          ? ((B = (
              await Promise.all(
                D.map(async (T) => {
                  const U = Y(n, T)
                  return await H(U && U._f ? { [T]: U } : U)
                }),
              )
            ).every(Boolean)),
            !(!B && !l.isValid) && p())
          : (B = C = await H(n))
      return (
        o.state.next({
          ...(!pt(g) || ((d.isValid || y.isValid) && C !== l.isValid) ? {} : { name: g }),
          ...(t.resolver || !g ? { isValid: C } : {}),
          errors: l.errors,
        }),
        E.shouldFocus && !B && pu(n, Ce, g ? D : r.mount),
        B
      )
    },
    $e = (g, E) => {
      let C = { ...(i.mount ? u : a) }
      return (
        E && (C = Fv(E.dirtyFields ? l.dirtyFields : l.touchedFields, C)),
        Me(g) ? C : pt(g) ? Y(C, g) : g.map((B) => Y(C, B))
      )
    },
    fl = (g, E) => ({
      invalid: !!Y((E || l).errors, g),
      isDirty: !!Y((E || l).dirtyFields, g),
      error: Y((E || l).errors, g),
      isValidating: !!Y(l.validatingFields, g),
      isTouched: !!Y((E || l).touchedFields, g),
    }),
    Jt = (g) => {
      ;(g && bu(g).forEach((E) => Re(l.errors, E)), o.state.next({ errors: g ? l.errors : {} }))
    },
    sl = (g, E, C) => {
      const B = (Y(n, g, { _f: {} })._f || {}).ref,
        D = Y(l.errors, g) || {},
        { ref: T, message: U, type: q, ...Z } = D
      ;(me(l.errors, g, { ...Z, ...E, ref: B }),
        o.state.next({ name: g, errors: l.errors, isValid: !1 }),
        C && C.shouldFocus && B && B.focus && B.focus())
    },
    ot = (g, E) =>
      Qt(g) ? o.state.subscribe({ next: (C) => 'values' in C && g(j(void 0, E), C) }) : j(g, E, !0),
    Vl = (g) =>
      o.state.subscribe({
        next: (E) => {
          $S(g.name, E.name, g.exact) &&
            FS(E, g.formState || d, $t, g.reRenderRoot) &&
            g.callback({ values: { ...u }, ...l, ...E, defaultValues: a })
        },
      }).unsubscribe,
    Ct = (g) => ((i.mount = !0), (y = { ...y, ...g.formState }), Vl({ ...g, formState: y })),
    jl = (g, E = {}) => {
      for (const C of g ? bu(g) : r.mount)
        (r.mount.delete(C),
          r.array.delete(C),
          E.keepValue || (Re(n, C), Re(u, C)),
          !E.keepError && Re(l.errors, C),
          !E.keepDirty && Re(l.dirtyFields, C),
          !E.keepTouched && Re(l.touchedFields, C),
          !E.keepIsValidating && Re(l.validatingFields, C),
          !t.shouldUnregister && !E.keepDefaultValue && Re(a, C))
      ;(o.state.next({ values: Ve(u) }),
        o.state.next({ ...l, ...(E.keepDirty ? { isDirty: J() } : {}) }),
        !E.keepIsValid && p())
    },
    ql = ({ disabled: g, name: E }) => {
      ;((vt(g) && i.mount) || g || r.disabled.has(E)) &&
        (g ? r.disabled.add(E) : r.disabled.delete(E))
    },
    qt = (g, E = {}) => {
      let C = Y(n, g)
      const B = vt(E.disabled) || vt(t.disabled)
      return (
        me(n, g, {
          ...(C || {}),
          _f: { ...(C && C._f ? C._f : { ref: { name: g } }), name: g, mount: !0, ...E },
        }),
        r.mount.add(g),
        C ? ql({ disabled: vt(E.disabled) ? E.disabled : t.disabled, name: g }) : b(g, !0, E.value),
        {
          ...(B ? { disabled: E.disabled || t.disabled } : {}),
          ...(t.progressive
            ? {
                required: !!E.required,
                min: Ia(E.min),
                max: Ia(E.max),
                minLength: Ia(E.minLength),
                maxLength: Ia(E.maxLength),
                pattern: Ia(E.pattern),
              }
            : {}),
          name: g,
          onChange: Ze,
          onBlur: Ze,
          ref: (D) => {
            if (D) {
              ;(qt(g, E), (C = Y(n, g)))
              const T =
                  (Me(D.value) &&
                    D.querySelectorAll &&
                    D.querySelectorAll('input,select,textarea')[0]) ||
                  D,
                U = XS(T),
                q = C._f.refs || []
              if (U ? q.find((Z) => Z === T) : T === C._f.ref) return
              ;(me(n, g, {
                _f: {
                  ...C._f,
                  ...(U
                    ? {
                        refs: [...q.filter(Gc), T, ...(Array.isArray(Y(a, g)) ? [{}] : [])],
                        ref: { type: T.type, name: g },
                      }
                    : { ref: T }),
                },
              }),
                b(g, !1, void 0, T))
            } else
              ((C = Y(n, g, {})),
                C._f && (C._f.mount = !1),
                (t.shouldUnregister || E.shouldUnregister) &&
                  !(Kv(r.array, g) && i.action) &&
                  r.unMount.add(g))
          },
        }
      )
    },
    Ft = () => t.shouldFocusError && pu(n, Ce, r.mount),
    Ll = (g) => {
      vt(g) &&
        (o.state.next({ disabled: g }),
        pu(
          n,
          (E, C) => {
            const B = Y(n, C)
            B &&
              ((E.disabled = B._f.disabled || g),
              Array.isArray(B._f.refs) &&
                B._f.refs.forEach((D) => {
                  D.disabled = B._f.disabled || g
                }))
          },
          0,
          !1,
        ))
    },
    Lt = (g, E) => async (C) => {
      let B
      C && (C.preventDefault && C.preventDefault(), C.persist && C.persist())
      let D = Ve(u)
      if ((o.state.next({ isSubmitting: !0 }), t.resolver)) {
        const { errors: T, values: U } = await M()
        ;((l.errors = T), (D = Ve(U)))
      } else await H(n)
      if (r.disabled.size) for (const T of r.disabled) Re(D, T)
      if ((Re(l.errors, 'root'), ut(l.errors))) {
        o.state.next({ errors: {} })
        try {
          await g(D, C)
        } catch (T) {
          B = T
        }
      } else (E && (await E({ ...l.errors }, C)), Ft(), setTimeout(Ft))
      if (
        (o.state.next({
          isSubmitted: !0,
          isSubmitting: !1,
          isSubmitSuccessful: ut(l.errors) && !B,
          submitCount: l.submitCount + 1,
          errors: l.errors,
        }),
        B)
      )
        throw B
    },
    Kn = (g, E = {}) => {
      Y(n, g) &&
        (Me(E.defaultValue)
          ? Te(g, Ve(Y(a, g)))
          : (Te(g, E.defaultValue), me(a, g, Ve(E.defaultValue))),
        E.keepTouched || Re(l.touchedFields, g),
        E.keepDirty ||
          (Re(l.dirtyFields, g), (l.isDirty = E.defaultValue ? J(g, Ve(Y(a, g))) : J())),
        E.keepError || (Re(l.errors, g), d.isValid && p()),
        o.state.next({ ...l }))
    },
    Gl = (g, E = {}) => {
      const C = g ? Ve(g) : a,
        B = Ve(C),
        D = ut(g),
        T = D ? a : B
      if ((E.keepDefaultValues || (a = C), !E.keepValues)) {
        if (E.keepDirtyValues) {
          const U = new Set([...r.mount, ...Object.keys(ua(a, u))])
          for (const q of Array.from(U)) Y(l.dirtyFields, q) ? me(T, q, Y(u, q)) : Te(q, Y(T, q))
        } else {
          if (uo && Me(g))
            for (const U of r.mount) {
              const q = Y(n, U)
              if (q && q._f) {
                const Z = Array.isArray(q._f.refs) ? q._f.refs[0] : q._f.ref
                if (mr(Z)) {
                  const xe = Z.closest('form')
                  if (xe) {
                    xe.reset()
                    break
                  }
                }
              }
            }
          if (E.keepFieldsRef) for (const U of r.mount) Te(U, Y(T, U))
          else n = {}
        }
        ;((u = t.shouldUnregister ? (E.keepDefaultValues ? Ve(a) : {}) : Ve(T)),
          o.array.next({ values: { ...T } }),
          o.state.next({ values: { ...T } }))
      }
      ;((r = {
        mount: E.keepDirtyValues ? r.mount : new Set(),
        unMount: new Set(),
        array: new Set(),
        disabled: new Set(),
        watch: new Set(),
        watchAll: !1,
        focus: '',
      }),
        (i.mount = !d.isValid || !!E.keepIsValid || !!E.keepDirtyValues),
        (i.watch = !!t.shouldUnregister),
        o.state.next({
          submitCount: E.keepSubmitCount ? l.submitCount : 0,
          isDirty: D ? !1 : E.keepDirty ? l.isDirty : !!(E.keepDefaultValues && !Dl(g, a)),
          isSubmitted: E.keepIsSubmitted ? l.isSubmitted : !1,
          dirtyFields: D
            ? {}
            : E.keepDirtyValues
              ? E.keepDefaultValues && u
                ? ua(a, u)
                : l.dirtyFields
              : E.keepDefaultValues && g
                ? ua(a, g)
                : E.keepDirty
                  ? l.dirtyFields
                  : {},
          touchedFields: E.keepTouched ? l.touchedFields : {},
          errors: E.keepErrors ? l.errors : {},
          isSubmitSuccessful: E.keepIsSubmitSuccessful ? l.isSubmitSuccessful : !1,
          isSubmitting: !1,
          defaultValues: a,
        }))
    },
    Sn = (g, E) => Gl(Qt(g) ? g(u) : g, E),
    Wn = (g, E = {}) => {
      const C = Y(n, g),
        B = C && C._f
      if (B) {
        const D = B.refs ? B.refs[0] : B.ref
        D.focus && (D.focus(), E.shouldSelect && Qt(D.select) && D.select())
      }
    },
    $t = (g) => {
      l = { ...l, ...g }
    },
    ol = {
      control: {
        register: qt,
        unregister: jl,
        getFieldState: fl,
        handleSubmit: Lt,
        setError: sl,
        _subscribe: Vl,
        _runSchema: M,
        _focusError: Ft,
        _getWatch: j,
        _getDirty: J,
        _setValid: p,
        _setFieldArray: h,
        _setDisabledField: ql,
        _setErrors: m,
        _getFieldArray: W,
        _reset: Gl,
        _resetDefaultValues: () =>
          Qt(t.defaultValues) &&
          t.defaultValues().then((g) => {
            ;(Sn(g, t.resetOptions), o.state.next({ isLoading: !1 }))
          }),
        _removeUnmounted: w,
        _disableForm: Ll,
        _subjects: o,
        _proxyFormState: d,
        get _fields() {
          return n
        },
        get _formValues() {
          return u
        },
        get _state() {
          return i
        },
        set _state(g) {
          i = g
        },
        get _defaultValues() {
          return a
        },
        get _names() {
          return r
        },
        set _names(g) {
          r = g
        },
        get _formState() {
          return l
        },
        get _options() {
          return t
        },
        set _options(g) {
          t = { ...t, ...g }
        },
      },
      subscribe: Ct,
      trigger: te,
      register: qt,
      handleSubmit: Lt,
      watch: ot,
      setValue: Te,
      getValues: $e,
      reset: Sn,
      resetField: Kn,
      clearErrors: Jt,
      unregister: jl,
      setError: sl,
      setFocus: Wn,
      getFieldState: fl,
    }
  return { ...ol, formControl: ol }
}
function iO(e = {}) {
  const t = N.useRef(void 0),
    l = N.useRef(void 0),
    [n, a] = N.useState({
      isDirty: !1,
      isValidating: !1,
      isLoading: Qt(e.defaultValues),
      isSubmitted: !1,
      isSubmitting: !1,
      isSubmitSuccessful: !1,
      isValid: !1,
      submitCount: 0,
      dirtyFields: {},
      touchedFields: {},
      validatingFields: {},
      errors: e.errors || {},
      disabled: e.disabled || !1,
      isReady: !1,
      defaultValues: Qt(e.defaultValues) ? void 0 : e.defaultValues,
    })
  if (!t.current)
    if (e.formControl)
      ((t.current = { ...e.formControl, formState: n }),
        e.defaultValues &&
          !Qt(e.defaultValues) &&
          e.formControl.reset(e.defaultValues, e.resetOptions))
    else {
      const { formControl: i, ...r } = lE(e)
      t.current = { ...r, formState: n }
    }
  const u = t.current.control
  return (
    (u._options = e),
    so(() => {
      const i = u._subscribe({
        formState: u._proxyFormState,
        callback: () => a({ ...u._formState }),
        reRenderRoot: !0,
      })
      return (a((r) => ({ ...r, isReady: !0 })), (u._formState.isReady = !0), i)
    }, [u]),
    N.useEffect(() => u._disableForm(e.disabled), [u, e.disabled]),
    N.useEffect(() => {
      ;(e.mode && (u._options.mode = e.mode),
        e.reValidateMode && (u._options.reValidateMode = e.reValidateMode))
    }, [u, e.mode, e.reValidateMode]),
    N.useEffect(() => {
      e.errors && (u._setErrors(e.errors), u._focusError())
    }, [u, e.errors]),
    N.useEffect(() => {
      e.shouldUnregister && u._subjects.state.next({ values: u._getWatch() })
    }, [u, e.shouldUnregister]),
    N.useEffect(() => {
      if (u._proxyFormState.isDirty) {
        const i = u._getDirty()
        i !== n.isDirty && u._subjects.state.next({ isDirty: i })
      }
    }, [u, n.isDirty]),
    N.useEffect(() => {
      e.values && !Dl(e.values, l.current)
        ? (u._reset(e.values, { keepFieldsRef: !0, ...u._options.resetOptions }),
          (l.current = e.values),
          a((i) => ({ ...i })))
        : u._resetDefaultValues()
    }, [u, e.values]),
    N.useEffect(() => {
      ;(u._state.mount || (u._setValid(), (u._state.mount = !0)),
        u._state.watch && ((u._state.watch = !1), u._subjects.state.next({ ...u._formState })),
        u._removeUnmounted())
    }),
    (t.current.formState = Wv(n, u)),
    t.current
  )
}
const dy = 5,
  nE = 4
function aE(e, t) {
  const l = t.startOfMonth(e),
    n = l.getDay() > 0 ? l.getDay() : 7,
    a = t.addDays(e, -n + 1),
    u = t.addDays(a, dy * 7 - 1)
  return t.getMonth(e) === t.getMonth(u) ? dy : nE
}
function lg(e, t) {
  const l = t.startOfMonth(e),
    n = l.getDay()
  return n === 1 ? l : n === 0 ? t.addDays(l, -1 * 6) : t.addDays(l, -1 * (n - 1))
}
function uE(e, t) {
  const l = lg(e, t),
    n = aE(e, t)
  return t.addDays(l, n * 7 - 1)
}
class Tt {
  constructor(t, l) {
    ;((this.Date = Date),
      (this.today = () =>
        this.overrides?.today
          ? this.overrides.today()
          : this.options.timeZone
            ? Xt.tz(this.options.timeZone)
            : new this.Date()),
      (this.newDate = (n, a, u) =>
        this.overrides?.newDate
          ? this.overrides.newDate(n, a, u)
          : this.options.timeZone
            ? new Xt(n, a, u, this.options.timeZone)
            : new Date(n, a, u)),
      (this.addDays = (n, a) =>
        this.overrides?.addDays ? this.overrides.addDays(n, a) : qg(n, a)),
      (this.addMonths = (n, a) =>
        this.overrides?.addMonths ? this.overrides.addMonths(n, a) : Lg(n, a)),
      (this.addWeeks = (n, a) =>
        this.overrides?.addWeeks ? this.overrides.addWeeks(n, a) : Gg(n, a)),
      (this.addYears = (n, a) =>
        this.overrides?.addYears ? this.overrides.addYears(n, a) : Xg(n, a)),
      (this.differenceInCalendarDays = (n, a) =>
        this.overrides?.differenceInCalendarDays
          ? this.overrides.differenceInCalendarDays(n, a)
          : kg(n, a)),
      (this.differenceInCalendarMonths = (n, a) =>
        this.overrides?.differenceInCalendarMonths
          ? this.overrides.differenceInCalendarMonths(n, a)
          : Zg(n, a)),
      (this.eachMonthOfInterval = (n) =>
        this.overrides?.eachMonthOfInterval ? this.overrides.eachMonthOfInterval(n) : Qg(n)),
      (this.eachYearOfInterval = (n) => {
        const a = this.overrides?.eachYearOfInterval ? this.overrides.eachYearOfInterval(n) : Kg(n),
          u = new Set(a.map((r) => this.getYear(r)))
        if (u.size === a.length) return a
        const i = []
        return (
          u.forEach((r) => {
            i.push(new Date(r, 0, 1))
          }),
          i
        )
      }),
      (this.endOfBroadcastWeek = (n) =>
        this.overrides?.endOfBroadcastWeek ? this.overrides.endOfBroadcastWeek(n) : uE(n, this)),
      (this.endOfISOWeek = (n) =>
        this.overrides?.endOfISOWeek ? this.overrides.endOfISOWeek(n) : Wg(n)),
      (this.endOfMonth = (n) =>
        this.overrides?.endOfMonth ? this.overrides.endOfMonth(n) : Jg(n)),
      (this.endOfWeek = (n, a) =>
        this.overrides?.endOfWeek ? this.overrides.endOfWeek(n, a) : Fg(n, this.options)),
      (this.endOfYear = (n) => (this.overrides?.endOfYear ? this.overrides.endOfYear(n) : $g(n))),
      (this.format = (n, a, u) => {
        const i = this.overrides?.format
          ? this.overrides.format(n, a, this.options)
          : Ig(n, a, this.options)
        return this.options.numerals && this.options.numerals !== 'latn' ? this.replaceDigits(i) : i
      }),
      (this.getISOWeek = (n) =>
        this.overrides?.getISOWeek ? this.overrides.getISOWeek(n) : Pg(n)),
      (this.getMonth = (n, a) =>
        this.overrides?.getMonth ? this.overrides.getMonth(n, this.options) : e0(n, this.options)),
      (this.getYear = (n, a) =>
        this.overrides?.getYear ? this.overrides.getYear(n, this.options) : t0(n, this.options)),
      (this.getWeek = (n, a) =>
        this.overrides?.getWeek ? this.overrides.getWeek(n, this.options) : l0(n, this.options)),
      (this.isAfter = (n, a) =>
        this.overrides?.isAfter ? this.overrides.isAfter(n, a) : n0(n, a)),
      (this.isBefore = (n, a) =>
        this.overrides?.isBefore ? this.overrides.isBefore(n, a) : a0(n, a)),
      (this.isDate = (n) => (this.overrides?.isDate ? this.overrides.isDate(n) : u0(n))),
      (this.isSameDay = (n, a) =>
        this.overrides?.isSameDay ? this.overrides.isSameDay(n, a) : i0(n, a)),
      (this.isSameMonth = (n, a) =>
        this.overrides?.isSameMonth ? this.overrides.isSameMonth(n, a) : r0(n, a)),
      (this.isSameYear = (n, a) =>
        this.overrides?.isSameYear ? this.overrides.isSameYear(n, a) : c0(n, a)),
      (this.max = (n) => (this.overrides?.max ? this.overrides.max(n) : f0(n))),
      (this.min = (n) => (this.overrides?.min ? this.overrides.min(n) : s0(n))),
      (this.setMonth = (n, a) =>
        this.overrides?.setMonth ? this.overrides.setMonth(n, a) : o0(n, a)),
      (this.setYear = (n, a) =>
        this.overrides?.setYear ? this.overrides.setYear(n, a) : d0(n, a)),
      (this.startOfBroadcastWeek = (n, a) =>
        this.overrides?.startOfBroadcastWeek
          ? this.overrides.startOfBroadcastWeek(n, this)
          : lg(n, this)),
      (this.startOfDay = (n) =>
        this.overrides?.startOfDay ? this.overrides.startOfDay(n) : y0(n)),
      (this.startOfISOWeek = (n) =>
        this.overrides?.startOfISOWeek ? this.overrides.startOfISOWeek(n) : m0(n)),
      (this.startOfMonth = (n) =>
        this.overrides?.startOfMonth ? this.overrides.startOfMonth(n) : h0(n)),
      (this.startOfWeek = (n, a) =>
        this.overrides?.startOfWeek
          ? this.overrides.startOfWeek(n, this.options)
          : v0(n, this.options)),
      (this.startOfYear = (n) =>
        this.overrides?.startOfYear ? this.overrides.startOfYear(n) : g0(n)),
      (this.options = { locale: zy, ...t }),
      (this.overrides = l))
  }
  getDigitMap() {
    const { numerals: t = 'latn' } = this.options,
      l = new Intl.NumberFormat('en-US', { numberingSystem: t }),
      n = {}
    for (let a = 0; a < 10; a++) n[a.toString()] = l.format(a)
    return n
  }
  replaceDigits(t) {
    const l = this.getDigitMap()
    return t.replace(/\d/g, (n) => l[n] || n)
  }
  formatNumber(t) {
    return this.replaceDigits(t.toString())
  }
  getMonthYearOrder() {
    const t = this.options.locale?.code
    return t && Tt.yearFirstLocales.has(t) ? 'year-first' : 'month-first'
  }
  formatMonthYear(t) {
    const { locale: l, timeZone: n, numerals: a } = this.options,
      u = l?.code
    if (u && Tt.yearFirstLocales.has(u))
      try {
        return new Intl.DateTimeFormat(u, {
          month: 'long',
          year: 'numeric',
          timeZone: n,
          numberingSystem: a,
        }).format(t)
      } catch {}
    const i = this.getMonthYearOrder() === 'year-first' ? 'y LLLL' : 'LLLL y'
    return this.format(t, i)
  }
}
Tt.yearFirstLocales = new Set([
  'eu',
  'hu',
  'ja',
  'ja-Hira',
  'ja-JP',
  'ko',
  'ko-KR',
  'lt',
  'lt-LT',
  'lv',
  'lv-LV',
  'mn',
  'mn-MN',
  'zh',
  'zh-CN',
  'zh-HK',
  'zh-TW',
])
const cl = new Tt()
class ng {
  constructor(t, l, n = cl) {
    ;((this.date = t),
      (this.displayMonth = l),
      (this.outside = !!(l && !n.isSameMonth(t, l))),
      (this.dateLib = n))
  }
  isEqualTo(t) {
    return (
      this.dateLib.isSameDay(t.date, this.date) &&
      this.dateLib.isSameMonth(t.displayMonth, this.displayMonth)
    )
  }
}
class iE {
  constructor(t, l) {
    ;((this.date = t), (this.weeks = l))
  }
}
class rE {
  constructor(t, l) {
    ;((this.days = l), (this.weekNumber = t))
  }
}
function cE(e) {
  return N.createElement('button', { ...e })
}
function fE(e) {
  return N.createElement('span', { ...e })
}
function sE(e) {
  const { size: t = 24, orientation: l = 'left', className: n } = e
  return N.createElement(
    'svg',
    { className: n, width: t, height: t, viewBox: '0 0 24 24' },
    l === 'up' &&
      N.createElement('polygon', { points: '6.77 17 12.5 11.43 18.24 17 20 15.28 12.5 8 5 15.28' }),
    l === 'down' &&
      N.createElement('polygon', { points: '6.77 8 12.5 13.57 18.24 8 20 9.72 12.5 17 5 9.72' }),
    l === 'left' &&
      N.createElement('polygon', {
        points: '16 18.112 9.81111111 12 16 5.87733333 14.0888889 4 6 12 14.0888889 20',
      }),
    l === 'right' &&
      N.createElement('polygon', {
        points: '8 18.112 14.18888889 12 8 5.87733333 9.91111111 4 18 12 9.91111111 20',
      }),
  )
}
function oE(e) {
  const { day: t, modifiers: l, ...n } = e
  return N.createElement('td', { ...n })
}
function dE(e) {
  const { day: t, modifiers: l, ...n } = e,
    a = N.useRef(null)
  return (
    N.useEffect(() => {
      l.focused && a.current?.focus()
    }, [l.focused]),
    N.createElement('button', { ref: a, ...n })
  )
}
var V
;(function (e) {
  ;((e.Root = 'root'),
    (e.Chevron = 'chevron'),
    (e.Day = 'day'),
    (e.DayButton = 'day_button'),
    (e.CaptionLabel = 'caption_label'),
    (e.Dropdowns = 'dropdowns'),
    (e.Dropdown = 'dropdown'),
    (e.DropdownRoot = 'dropdown_root'),
    (e.Footer = 'footer'),
    (e.MonthGrid = 'month_grid'),
    (e.MonthCaption = 'month_caption'),
    (e.MonthsDropdown = 'months_dropdown'),
    (e.Month = 'month'),
    (e.Months = 'months'),
    (e.Nav = 'nav'),
    (e.NextMonthButton = 'button_next'),
    (e.PreviousMonthButton = 'button_previous'),
    (e.Week = 'week'),
    (e.Weeks = 'weeks'),
    (e.Weekday = 'weekday'),
    (e.Weekdays = 'weekdays'),
    (e.WeekNumber = 'week_number'),
    (e.WeekNumberHeader = 'week_number_header'),
    (e.YearsDropdown = 'years_dropdown'))
})(V || (V = {}))
var Oe
;(function (e) {
  ;((e.disabled = 'disabled'),
    (e.hidden = 'hidden'),
    (e.outside = 'outside'),
    (e.focused = 'focused'),
    (e.today = 'today'))
})(Oe || (Oe = {}))
var Kt
;(function (e) {
  ;((e.range_end = 'range_end'),
    (e.range_middle = 'range_middle'),
    (e.range_start = 'range_start'),
    (e.selected = 'selected'))
})(Kt || (Kt = {}))
var ht
;(function (e) {
  ;((e.weeks_before_enter = 'weeks_before_enter'),
    (e.weeks_before_exit = 'weeks_before_exit'),
    (e.weeks_after_enter = 'weeks_after_enter'),
    (e.weeks_after_exit = 'weeks_after_exit'),
    (e.caption_after_enter = 'caption_after_enter'),
    (e.caption_after_exit = 'caption_after_exit'),
    (e.caption_before_enter = 'caption_before_enter'),
    (e.caption_before_exit = 'caption_before_exit'))
})(ht || (ht = {}))
function yE(e) {
  const { options: t, className: l, components: n, classNames: a, ...u } = e,
    i = [a[V.Dropdown], l].join(' '),
    r = t?.find(({ value: c }) => c === u.value)
  return N.createElement(
    'span',
    { 'data-disabled': u.disabled, className: a[V.DropdownRoot] },
    N.createElement(
      n.Select,
      { className: i, ...u },
      t?.map(({ value: c, label: f, disabled: d }) =>
        N.createElement(n.Option, { key: c, value: c, disabled: d }, f),
      ),
    ),
    N.createElement(
      'span',
      { className: a[V.CaptionLabel], 'aria-hidden': !0 },
      r?.label,
      N.createElement(n.Chevron, { orientation: 'down', size: 18, className: a[V.Chevron] }),
    ),
  )
}
function mE(e) {
  return N.createElement('div', { ...e })
}
function hE(e) {
  return N.createElement('div', { ...e })
}
function vE(e) {
  const { calendarMonth: t, displayIndex: l, ...n } = e
  return N.createElement('div', { ...n }, e.children)
}
function gE(e) {
  const { calendarMonth: t, displayIndex: l, ...n } = e
  return N.createElement('div', { ...n })
}
function bE(e) {
  return N.createElement('table', { ...e })
}
function pE(e) {
  return N.createElement('div', { ...e })
}
const ag = O.createContext(void 0)
function Ju() {
  const e = O.useContext(ag)
  if (e === void 0) throw new Error('useDayPicker() must be used within a custom component.')
  return e
}
function SE(e) {
  const { components: t } = Ju()
  return N.createElement(t.Dropdown, { ...e })
}
function EE(e) {
  const { onPreviousClick: t, onNextClick: l, previousMonth: n, nextMonth: a, ...u } = e,
    {
      components: i,
      classNames: r,
      labels: { labelPrevious: c, labelNext: f },
    } = Ju(),
    d = O.useCallback(
      (o) => {
        a && l?.(o)
      },
      [a, l],
    ),
    y = O.useCallback(
      (o) => {
        n && t?.(o)
      },
      [n, t],
    )
  return N.createElement(
    'nav',
    { ...u },
    N.createElement(
      i.PreviousMonthButton,
      {
        type: 'button',
        className: r[V.PreviousMonthButton],
        tabIndex: n ? void 0 : -1,
        'aria-disabled': n ? void 0 : !0,
        'aria-label': c(n),
        onClick: y,
      },
      N.createElement(i.Chevron, {
        disabled: n ? void 0 : !0,
        className: r[V.Chevron],
        orientation: 'left',
      }),
    ),
    N.createElement(
      i.NextMonthButton,
      {
        type: 'button',
        className: r[V.NextMonthButton],
        tabIndex: a ? void 0 : -1,
        'aria-disabled': a ? void 0 : !0,
        'aria-label': f(a),
        onClick: d,
      },
      N.createElement(i.Chevron, {
        disabled: a ? void 0 : !0,
        orientation: 'right',
        className: r[V.Chevron],
      }),
    ),
  )
}
function DE(e) {
  const { components: t } = Ju()
  return N.createElement(t.Button, { ...e })
}
function OE(e) {
  return N.createElement('option', { ...e })
}
function _E(e) {
  const { components: t } = Ju()
  return N.createElement(t.Button, { ...e })
}
function ME(e) {
  const { rootRef: t, ...l } = e
  return N.createElement('div', { ...l, ref: t })
}
function AE(e) {
  return N.createElement('select', { ...e })
}
function TE(e) {
  const { week: t, ...l } = e
  return N.createElement('tr', { ...l })
}
function CE(e) {
  return N.createElement('th', { ...e })
}
function zE(e) {
  return N.createElement('thead', { 'aria-hidden': !0 }, N.createElement('tr', { ...e }))
}
function NE(e) {
  const { week: t, ...l } = e
  return N.createElement('th', { ...l })
}
function xE(e) {
  return N.createElement('th', { ...e })
}
function RE(e) {
  return N.createElement('tbody', { ...e })
}
function UE(e) {
  const { components: t } = Ju()
  return N.createElement(t.Dropdown, { ...e })
}
const BE = Object.freeze(
  Object.defineProperty(
    {
      __proto__: null,
      Button: cE,
      CaptionLabel: fE,
      Chevron: sE,
      Day: oE,
      DayButton: dE,
      Dropdown: yE,
      DropdownNav: mE,
      Footer: hE,
      Month: vE,
      MonthCaption: gE,
      MonthGrid: bE,
      Months: pE,
      MonthsDropdown: SE,
      Nav: EE,
      NextMonthButton: DE,
      Option: OE,
      PreviousMonthButton: _E,
      Root: ME,
      Select: AE,
      Week: TE,
      WeekNumber: NE,
      WeekNumberHeader: xE,
      Weekday: CE,
      Weekdays: zE,
      Weeks: RE,
      YearsDropdown: UE,
    },
    Symbol.toStringTag,
    { value: 'Module' },
  ),
)
function Al(e, t, l = !1, n = cl) {
  let { from: a, to: u } = e
  const { differenceInCalendarDays: i, isSameDay: r } = n
  return a && u
    ? (i(u, a) < 0 && ([a, u] = [u, a]), i(t, a) >= (l ? 1 : 0) && i(u, t) >= (l ? 1 : 0))
    : !l && u
      ? r(u, t)
      : !l && a
        ? r(a, t)
        : !1
}
function ug(e) {
  return !!(e && typeof e == 'object' && 'before' in e && 'after' in e)
}
function mo(e) {
  return !!(e && typeof e == 'object' && 'from' in e)
}
function ig(e) {
  return !!(e && typeof e == 'object' && 'after' in e)
}
function rg(e) {
  return !!(e && typeof e == 'object' && 'before' in e)
}
function cg(e) {
  return !!(e && typeof e == 'object' && 'dayOfWeek' in e)
}
function fg(e, t) {
  return Array.isArray(e) && e.every(t.isDate)
}
function Tl(e, t, l = cl) {
  const n = Array.isArray(t) ? t : [t],
    { isSameDay: a, differenceInCalendarDays: u, isAfter: i } = l
  return n.some((r) => {
    if (typeof r == 'boolean') return r
    if (l.isDate(r)) return a(e, r)
    if (fg(r, l)) return r.includes(e)
    if (mo(r)) return Al(r, e, !1, l)
    if (cg(r))
      return Array.isArray(r.dayOfWeek)
        ? r.dayOfWeek.includes(e.getDay())
        : r.dayOfWeek === e.getDay()
    if (ug(r)) {
      const c = u(r.before, e),
        f = u(r.after, e),
        d = c > 0,
        y = f < 0
      return i(r.before, r.after) ? y && d : d || y
    }
    return ig(r)
      ? u(e, r.after) > 0
      : rg(r)
        ? u(r.before, e) > 0
        : typeof r == 'function'
          ? r(e)
          : !1
  })
}
function HE(e, t, l, n, a) {
  const {
      disabled: u,
      hidden: i,
      modifiers: r,
      showOutsideDays: c,
      broadcastCalendar: f,
      today: d,
    } = t,
    { isSameDay: y, isSameMonth: o, startOfMonth: v, isBefore: _, endOfMonth: p, isAfter: A } = a,
    h = l && v(l),
    s = n && p(n),
    m = { [Oe.focused]: [], [Oe.outside]: [], [Oe.disabled]: [], [Oe.hidden]: [], [Oe.today]: [] },
    b = {}
  for (const S of e) {
    const { date: x, displayMonth: M } = S,
      R = !!(M && !o(x, M)),
      H = !!(h && _(x, h)),
      w = !!(s && A(x, s)),
      J = !!(u && Tl(x, u, a)),
      j = !!(i && Tl(x, i, a)) || H || w || (!f && !c && R) || (f && c === !1 && R),
      W = y(x, d ?? a.today())
    ;(R && m.outside.push(S),
      J && m.disabled.push(S),
      j && m.hidden.push(S),
      W && m.today.push(S),
      r &&
        Object.keys(r).forEach((G) => {
          const P = r?.[G]
          P && Tl(x, P, a) && (b[G] ? b[G].push(S) : (b[G] = [S]))
        }))
  }
  return (S) => {
    const x = {
        [Oe.focused]: !1,
        [Oe.disabled]: !1,
        [Oe.hidden]: !1,
        [Oe.outside]: !1,
        [Oe.today]: !1,
      },
      M = {}
    for (const R in m) {
      const H = m[R]
      x[R] = H.some((w) => w === S)
    }
    for (const R in b) M[R] = b[R].some((H) => H === S)
    return { ...x, ...M }
  }
}
function YE(e, t, l = {}) {
  return Object.entries(e)
    .filter(([, a]) => a === !0)
    .reduce(
      (a, [u]) => (
        l[u] ? a.push(l[u]) : t[Oe[u]] ? a.push(t[Oe[u]]) : t[Kt[u]] && a.push(t[Kt[u]]),
        a
      ),
      [t[V.Day]],
    )
}
function wE(e) {
  return { ...BE, ...e }
}
function VE(e) {
  const t = {
    'data-mode': e.mode ?? void 0,
    'data-required': 'required' in e ? e.required : void 0,
    'data-multiple-months': (e.numberOfMonths && e.numberOfMonths > 1) || void 0,
    'data-week-numbers': e.showWeekNumber || void 0,
    'data-broadcast-calendar': e.broadcastCalendar || void 0,
    'data-nav-layout': e.navLayout || void 0,
  }
  return (
    Object.entries(e).forEach(([l, n]) => {
      l.startsWith('data-') && (t[l] = n)
    }),
    t
  )
}
function jE() {
  const e = {}
  for (const t in V) e[V[t]] = `rdp-${V[t]}`
  for (const t in Oe) e[Oe[t]] = `rdp-${Oe[t]}`
  for (const t in Kt) e[Kt[t]] = `rdp-${Kt[t]}`
  for (const t in ht) e[ht[t]] = `rdp-${ht[t]}`
  return e
}
function sg(e, t, l) {
  return (l ?? new Tt(t)).formatMonthYear(e)
}
const qE = sg
function LE(e, t, l) {
  return (l ?? new Tt(t)).format(e, 'd')
}
function GE(e, t = cl) {
  return t.format(e, 'LLLL')
}
function XE(e, t, l) {
  return (l ?? new Tt(t)).format(e, 'cccccc')
}
function kE(e, t = cl) {
  return e < 10 ? t.formatNumber(`0${e.toLocaleString()}`) : t.formatNumber(`${e.toLocaleString()}`)
}
function ZE() {
  return ''
}
function og(e, t = cl) {
  return t.format(e, 'yyyy')
}
const QE = og,
  KE = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        formatCaption: sg,
        formatDay: LE,
        formatMonthCaption: qE,
        formatMonthDropdown: GE,
        formatWeekNumber: kE,
        formatWeekNumberHeader: ZE,
        formatWeekdayName: XE,
        formatYearCaption: QE,
        formatYearDropdown: og,
      },
      Symbol.toStringTag,
      { value: 'Module' },
    ),
  )
function WE(e) {
  return (
    e?.formatMonthCaption && !e.formatCaption && (e.formatCaption = e.formatMonthCaption),
    e?.formatYearCaption && !e.formatYearDropdown && (e.formatYearDropdown = e.formatYearCaption),
    { ...KE, ...e }
  )
}
function JE(e, t, l, n, a) {
  const { startOfMonth: u, startOfYear: i, endOfYear: r, eachMonthOfInterval: c, getMonth: f } = a
  return c({ start: i(e), end: r(e) }).map((o) => {
    const v = n.formatMonthDropdown(o, a),
      _ = f(o),
      p = (t && o < u(t)) || (l && o > u(l)) || !1
    return { value: _, label: v, disabled: p }
  })
}
function FE(e, t = {}, l = {}) {
  let n = { ...t?.[V.Day] }
  return (
    Object.entries(e)
      .filter(([, a]) => a === !0)
      .forEach(([a]) => {
        n = { ...n, ...l?.[a] }
      }),
    n
  )
}
function $E(e, t, l) {
  const n = e.today(),
    a = t ? e.startOfISOWeek(n) : e.startOfWeek(n),
    u = []
  for (let i = 0; i < 7; i++) {
    const r = e.addDays(a, i)
    u.push(r)
  }
  return u
}
function IE(e, t, l, n, a = !1) {
  if (!e || !t) return
  const { startOfYear: u, endOfYear: i, eachYearOfInterval: r, getYear: c } = n,
    f = u(e),
    d = i(t),
    y = r({ start: f, end: d })
  return (
    a && y.reverse(),
    y.map((o) => {
      const v = l.formatYearDropdown(o, n)
      return { value: c(o), label: v, disabled: !1 }
    })
  )
}
function dg(e, t, l, n) {
  let a = (n ?? new Tt(l)).format(e, 'PPPP')
  return (t.today && (a = `Today, ${a}`), t.selected && (a = `${a}, selected`), a)
}
const PE = dg
function yg(e, t, l) {
  return (l ?? new Tt(t)).formatMonthYear(e)
}
const e2 = yg
function t2(e, t, l, n) {
  let a = (n ?? new Tt(l)).format(e, 'PPPP')
  return (t?.today && (a = `Today, ${a}`), a)
}
function l2(e) {
  return 'Choose the Month'
}
function n2() {
  return ''
}
function a2(e) {
  return 'Go to the Next Month'
}
function u2(e) {
  return 'Go to the Previous Month'
}
function i2(e, t, l) {
  return (l ?? new Tt(t)).format(e, 'cccc')
}
function r2(e, t) {
  return `Week ${e}`
}
function c2(e) {
  return 'Week Number'
}
function f2(e) {
  return 'Choose the Year'
}
const s2 = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        labelCaption: e2,
        labelDay: PE,
        labelDayButton: dg,
        labelGrid: yg,
        labelGridcell: t2,
        labelMonthDropdown: l2,
        labelNav: n2,
        labelNext: a2,
        labelPrevious: u2,
        labelWeekNumber: r2,
        labelWeekNumberHeader: c2,
        labelWeekday: i2,
        labelYearDropdown: f2,
      },
      Symbol.toStringTag,
      { value: 'Module' },
    ),
  ),
  Fu = (e) => (e instanceof HTMLElement ? e : null),
  Xc = (e) => [...(e.querySelectorAll('[data-animated-month]') ?? [])],
  o2 = (e) => Fu(e.querySelector('[data-animated-month]')),
  kc = (e) => Fu(e.querySelector('[data-animated-caption]')),
  Zc = (e) => Fu(e.querySelector('[data-animated-weeks]')),
  d2 = (e) => Fu(e.querySelector('[data-animated-nav]')),
  y2 = (e) => Fu(e.querySelector('[data-animated-weekdays]'))
function m2(e, t, { classNames: l, months: n, focused: a, dateLib: u }) {
  const i = O.useRef(null),
    r = O.useRef(n),
    c = O.useRef(!1)
  O.useLayoutEffect(() => {
    const f = r.current
    if (
      ((r.current = n),
      !t ||
        !e.current ||
        !(e.current instanceof HTMLElement) ||
        n.length === 0 ||
        f.length === 0 ||
        n.length !== f.length)
    )
      return
    const d = u.isSameMonth(n[0].date, f[0].date),
      y = u.isAfter(n[0].date, f[0].date),
      o = y ? l[ht.caption_after_enter] : l[ht.caption_before_enter],
      v = y ? l[ht.weeks_after_enter] : l[ht.weeks_before_enter],
      _ = i.current,
      p = e.current.cloneNode(!0)
    if (
      (p instanceof HTMLElement
        ? (Xc(p).forEach((m) => {
            if (!(m instanceof HTMLElement)) return
            const b = o2(m)
            b && m.contains(b) && m.removeChild(b)
            const S = kc(m)
            S && S.classList.remove(o)
            const x = Zc(m)
            x && x.classList.remove(v)
          }),
          (i.current = p))
        : (i.current = null),
      c.current || d || a)
    )
      return
    const A = _ instanceof HTMLElement ? Xc(_) : [],
      h = Xc(e.current)
    if (
      h?.every((s) => s instanceof HTMLElement) &&
      A &&
      A.every((s) => s instanceof HTMLElement)
    ) {
      ;((c.current = !0), (e.current.style.isolation = 'isolate'))
      const s = d2(e.current)
      ;(s && (s.style.zIndex = '1'),
        h.forEach((m, b) => {
          const S = A[b]
          if (!S) return
          ;((m.style.position = 'relative'), (m.style.overflow = 'hidden'))
          const x = kc(m)
          x && x.classList.add(o)
          const M = Zc(m)
          M && M.classList.add(v)
          const R = () => {
            ;((c.current = !1),
              e.current && (e.current.style.isolation = ''),
              s && (s.style.zIndex = ''),
              x && x.classList.remove(o),
              M && M.classList.remove(v),
              (m.style.position = ''),
              (m.style.overflow = ''),
              m.contains(S) && m.removeChild(S))
          }
          ;((S.style.pointerEvents = 'none'),
            (S.style.position = 'absolute'),
            (S.style.overflow = 'hidden'),
            S.setAttribute('aria-hidden', 'true'))
          const H = y2(S)
          H && (H.style.opacity = '0')
          const w = kc(S)
          w &&
            (w.classList.add(y ? l[ht.caption_before_exit] : l[ht.caption_after_exit]),
            w.addEventListener('animationend', R))
          const J = Zc(S)
          ;(J && J.classList.add(y ? l[ht.weeks_before_exit] : l[ht.weeks_after_exit]),
            m.insertBefore(S, m.firstChild))
        }))
    }
  })
}
function h2(e, t, l, n) {
  const a = e[0],
    u = e[e.length - 1],
    { ISOWeek: i, fixedWeeks: r, broadcastCalendar: c } = l ?? {},
    {
      addDays: f,
      differenceInCalendarDays: d,
      differenceInCalendarMonths: y,
      endOfBroadcastWeek: o,
      endOfISOWeek: v,
      endOfMonth: _,
      endOfWeek: p,
      isAfter: A,
      startOfBroadcastWeek: h,
      startOfISOWeek: s,
      startOfWeek: m,
    } = n,
    b = c ? h(a, n) : i ? s(a) : m(a),
    S = c ? o(u) : i ? v(_(u)) : p(_(u)),
    x = d(S, b),
    M = y(u, a) + 1,
    R = []
  for (let J = 0; J <= x; J++) {
    const j = f(b, J)
    if (t && A(j, t)) break
    R.push(j)
  }
  const w = (c ? 35 : 42) * M
  if (r && R.length < w) {
    const J = w - R.length
    for (let j = 0; j < J; j++) {
      const W = f(R[R.length - 1], 1)
      R.push(W)
    }
  }
  return R
}
function v2(e) {
  const t = []
  return e.reduce((l, n) => {
    const a = n.weeks.reduce((u, i) => u.concat(i.days.slice()), t.slice())
    return l.concat(a.slice())
  }, t.slice())
}
function g2(e, t, l, n) {
  const { numberOfMonths: a = 1 } = l,
    u = []
  for (let i = 0; i < a; i++) {
    const r = n.addMonths(e, i)
    if (t && r > t) break
    u.push(r)
  }
  return u
}
function yy(e, t, l, n) {
  const { month: a, defaultMonth: u, today: i = n.today(), numberOfMonths: r = 1 } = e
  let c = a || u || i
  const { differenceInCalendarMonths: f, addMonths: d, startOfMonth: y } = n
  if (l && f(l, c) < r - 1) {
    const o = -1 * (r - 1)
    c = d(l, o)
  }
  return (t && f(c, t) < 0 && (c = t), y(c))
}
function b2(e, t, l, n) {
  const {
      addDays: a,
      endOfBroadcastWeek: u,
      endOfISOWeek: i,
      endOfMonth: r,
      endOfWeek: c,
      getISOWeek: f,
      getWeek: d,
      startOfBroadcastWeek: y,
      startOfISOWeek: o,
      startOfWeek: v,
    } = n,
    _ = e.reduce((p, A) => {
      const h = l.broadcastCalendar ? y(A, n) : l.ISOWeek ? o(A) : v(A),
        s = l.broadcastCalendar ? u(A) : l.ISOWeek ? i(r(A)) : c(r(A)),
        m = t.filter((M) => M >= h && M <= s),
        b = l.broadcastCalendar ? 35 : 42
      if (l.fixedWeeks && m.length < b) {
        const M = t.filter((R) => {
          const H = b - m.length
          return R > s && R <= a(s, H)
        })
        m.push(...M)
      }
      const S = m.reduce((M, R) => {
          const H = l.ISOWeek ? f(R) : d(R),
            w = M.find((j) => j.weekNumber === H),
            J = new ng(R, A, n)
          return (w ? w.days.push(J) : M.push(new rE(H, [J])), M)
        }, []),
        x = new iE(A, S)
      return (p.push(x), p)
    }, [])
  return l.reverseMonths ? _.reverse() : _
}
function p2(e, t) {
  let { startMonth: l, endMonth: n } = e
  const {
      startOfYear: a,
      startOfDay: u,
      startOfMonth: i,
      endOfMonth: r,
      addYears: c,
      endOfYear: f,
      newDate: d,
      today: y,
    } = t,
    { fromYear: o, toYear: v, fromMonth: _, toMonth: p } = e
  ;(!l && _ && (l = _),
    !l && o && (l = t.newDate(o, 0, 1)),
    !n && p && (n = p),
    !n && v && (n = d(v, 11, 31)))
  const A = e.captionLayout === 'dropdown' || e.captionLayout === 'dropdown-years'
  return (
    l ? (l = i(l)) : o ? (l = d(o, 0, 1)) : !l && A && (l = a(c(e.today ?? y(), -100))),
    n ? (n = r(n)) : v ? (n = d(v, 11, 31)) : !n && A && (n = f(e.today ?? y())),
    [l && u(l), n && u(n)]
  )
}
function S2(e, t, l, n) {
  if (l.disableNavigation) return
  const { pagedNavigation: a, numberOfMonths: u = 1 } = l,
    { startOfMonth: i, addMonths: r, differenceInCalendarMonths: c } = n,
    f = a ? u : 1,
    d = i(e)
  if (!t) return r(d, f)
  if (!(c(t, e) < u)) return r(d, f)
}
function E2(e, t, l, n) {
  if (l.disableNavigation) return
  const { pagedNavigation: a, numberOfMonths: u } = l,
    { startOfMonth: i, addMonths: r, differenceInCalendarMonths: c } = n,
    f = a ? (u ?? 1) : 1,
    d = i(e)
  if (!t) return r(d, -f)
  if (!(c(d, t) <= 0)) return r(d, -f)
}
function D2(e) {
  const t = []
  return e.reduce((l, n) => l.concat(n.weeks.slice()), t.slice())
}
function Lr(e, t) {
  const [l, n] = O.useState(e)
  return [t === void 0 ? l : t, n]
}
function O2(e, t) {
  const [l, n] = p2(e, t),
    { startOfMonth: a, endOfMonth: u } = t,
    i = yy(e, l, n, t),
    [r, c] = Lr(i, e.month ? i : void 0)
  O.useEffect(() => {
    const x = yy(e, l, n, t)
    c(x)
  }, [e.timeZone])
  const f = g2(r, n, e, t),
    d = h2(f, e.endMonth ? u(e.endMonth) : void 0, e, t),
    y = b2(f, d, e, t),
    o = D2(y),
    v = v2(y),
    _ = E2(r, l, e, t),
    p = S2(r, n, e, t),
    { disableNavigation: A, onMonthChange: h } = e,
    s = (x) => o.some((M) => M.days.some((R) => R.isEqualTo(x))),
    m = (x) => {
      if (A) return
      let M = a(x)
      ;(l && M < a(l) && (M = a(l)), n && M > a(n) && (M = a(n)), c(M), h?.(M))
    }
  return {
    months: y,
    weeks: o,
    days: v,
    navStart: l,
    navEnd: n,
    previousMonth: _,
    nextMonth: p,
    goToMonth: m,
    goToDay: (x) => {
      s(x) || m(x.date)
    },
  }
}
var el
;(function (e) {
  ;((e[(e.Today = 0)] = 'Today'),
    (e[(e.Selected = 1)] = 'Selected'),
    (e[(e.LastFocused = 2)] = 'LastFocused'),
    (e[(e.FocusedModifier = 3)] = 'FocusedModifier'))
})(el || (el = {}))
function my(e) {
  return !e[Oe.disabled] && !e[Oe.hidden] && !e[Oe.outside]
}
function _2(e, t, l, n) {
  let a,
    u = -1
  for (const i of e) {
    const r = t(i)
    my(r) &&
      (r[Oe.focused] && u < el.FocusedModifier
        ? ((a = i), (u = el.FocusedModifier))
        : n?.isEqualTo(i) && u < el.LastFocused
          ? ((a = i), (u = el.LastFocused))
          : l(i.date) && u < el.Selected
            ? ((a = i), (u = el.Selected))
            : r[Oe.today] && u < el.Today && ((a = i), (u = el.Today)))
  }
  return (a || (a = e.find((i) => my(t(i)))), a)
}
function M2(e, t, l, n, a, u, i) {
  const { ISOWeek: r, broadcastCalendar: c } = u,
    {
      addDays: f,
      addMonths: d,
      addWeeks: y,
      addYears: o,
      endOfBroadcastWeek: v,
      endOfISOWeek: _,
      endOfWeek: p,
      max: A,
      min: h,
      startOfBroadcastWeek: s,
      startOfISOWeek: m,
      startOfWeek: b,
    } = i
  let x = {
    day: f,
    week: y,
    month: d,
    year: o,
    startOfWeek: (M) => (c ? s(M, i) : r ? m(M) : b(M)),
    endOfWeek: (M) => (c ? v(M) : r ? _(M) : p(M)),
  }[e](l, t === 'after' ? 1 : -1)
  return (t === 'before' && n ? (x = A([n, x])) : t === 'after' && a && (x = h([a, x])), x)
}
function mg(e, t, l, n, a, u, i, r = 0) {
  if (r > 365) return
  const c = M2(e, t, l.date, n, a, u, i),
    f = !!(u.disabled && Tl(c, u.disabled, i)),
    d = !!(u.hidden && Tl(c, u.hidden, i)),
    y = c,
    o = new ng(c, y, i)
  return !f && !d ? o : mg(e, t, o, n, a, u, i, r + 1)
}
function A2(e, t, l, n, a) {
  const { autoFocus: u } = e,
    [i, r] = O.useState(),
    c = _2(t.days, l, n || (() => !1), i),
    [f, d] = O.useState(u ? c : void 0)
  return {
    isFocusTarget: (p) => !!c?.isEqualTo(p),
    setFocused: d,
    focused: f,
    blur: () => {
      ;(r(f), d(void 0))
    },
    moveFocus: (p, A) => {
      if (!f) return
      const h = mg(p, A, f, t.navStart, t.navEnd, e, a)
      h && ((e.disableNavigation && !t.days.some((m) => m.isEqualTo(h))) || (t.goToDay(h), d(h)))
    },
  }
}
function T2(e, t) {
  const { selected: l, required: n, onSelect: a } = e,
    [u, i] = Lr(l, a ? l : void 0),
    r = a ? l : u,
    { isSameDay: c } = t,
    f = (v) => r?.some((_) => c(_, v)) ?? !1,
    { min: d, max: y } = e
  return {
    selected: r,
    select: (v, _, p) => {
      let A = [...(r ?? [])]
      if (f(v)) {
        if (r?.length === d || (n && r?.length === 1)) return
        A = r?.filter((h) => !c(h, v))
      } else r?.length === y ? (A = [v]) : (A = [...A, v])
      return (a || i(A), a?.(A, v, _, p), A)
    },
    isSelected: f,
  }
}
function C2(e, t, l = 0, n = 0, a = !1, u = cl) {
  const { from: i, to: r } = t || {},
    { isSameDay: c, isAfter: f, isBefore: d } = u
  let y
  if (!i && !r) y = { from: e, to: l > 0 ? void 0 : e }
  else if (i && !r)
    c(i, e)
      ? l === 0
        ? (y = { from: i, to: e })
        : a
          ? (y = { from: i, to: void 0 })
          : (y = void 0)
      : d(e, i)
        ? (y = { from: e, to: i })
        : (y = { from: i, to: e })
  else if (i && r)
    if (c(i, e) && c(r, e)) a ? (y = { from: i, to: r }) : (y = void 0)
    else if (c(i, e)) y = { from: i, to: l > 0 ? void 0 : e }
    else if (c(r, e)) y = { from: e, to: l > 0 ? void 0 : e }
    else if (d(e, i)) y = { from: e, to: r }
    else if (f(e, i)) y = { from: i, to: e }
    else if (f(e, r)) y = { from: i, to: e }
    else throw new Error('Invalid range')
  if (y?.from && y?.to) {
    const o = u.differenceInCalendarDays(y.to, y.from)
    n > 0 && o > n ? (y = { from: e, to: void 0 }) : l > 1 && o < l && (y = { from: e, to: void 0 })
  }
  return y
}
function z2(e, t, l = cl) {
  const n = Array.isArray(t) ? t : [t]
  let a = e.from
  const u = l.differenceInCalendarDays(e.to, e.from),
    i = Math.min(u, 6)
  for (let r = 0; r <= i; r++) {
    if (n.includes(a.getDay())) return !0
    a = l.addDays(a, 1)
  }
  return !1
}
function hy(e, t, l = cl) {
  return Al(e, t.from, !1, l) || Al(e, t.to, !1, l) || Al(t, e.from, !1, l) || Al(t, e.to, !1, l)
}
function N2(e, t, l = cl) {
  const n = Array.isArray(t) ? t : [t]
  if (
    n
      .filter((r) => typeof r != 'function')
      .some((r) =>
        typeof r == 'boolean'
          ? r
          : l.isDate(r)
            ? Al(e, r, !1, l)
            : fg(r, l)
              ? r.some((c) => Al(e, c, !1, l))
              : mo(r)
                ? r.from && r.to
                  ? hy(e, { from: r.from, to: r.to }, l)
                  : !1
                : cg(r)
                  ? z2(e, r.dayOfWeek, l)
                  : ug(r)
                    ? l.isAfter(r.before, r.after)
                      ? hy(e, { from: l.addDays(r.after, 1), to: l.addDays(r.before, -1) }, l)
                      : Tl(e.from, r, l) || Tl(e.to, r, l)
                    : ig(r) || rg(r)
                      ? Tl(e.from, r, l) || Tl(e.to, r, l)
                      : !1,
      )
  )
    return !0
  const i = n.filter((r) => typeof r == 'function')
  if (i.length) {
    let r = e.from
    const c = l.differenceInCalendarDays(e.to, e.from)
    for (let f = 0; f <= c; f++) {
      if (i.some((d) => d(r))) return !0
      r = l.addDays(r, 1)
    }
  }
  return !1
}
function x2(e, t) {
  const { disabled: l, excludeDisabled: n, selected: a, required: u, onSelect: i } = e,
    [r, c] = Lr(a, i ? a : void 0),
    f = i ? a : r
  return {
    selected: f,
    select: (o, v, _) => {
      const { min: p, max: A } = e,
        h = o ? C2(o, f, p, A, u, t) : void 0
      return (
        n &&
          l &&
          h?.from &&
          h.to &&
          N2({ from: h.from, to: h.to }, l, t) &&
          ((h.from = o), (h.to = void 0)),
        i || c(h),
        i?.(h, o, v, _),
        h
      )
    },
    isSelected: (o) => f && Al(f, o, !1, t),
  }
}
function R2(e, t) {
  const { selected: l, required: n, onSelect: a } = e,
    [u, i] = Lr(l, a ? l : void 0),
    r = a ? l : u,
    { isSameDay: c } = t
  return {
    selected: r,
    select: (y, o, v) => {
      let _ = y
      return (!n && r && r && c(y, r) && (_ = void 0), a || i(_), a?.(_, y, o, v), _)
    },
    isSelected: (y) => (r ? c(r, y) : !1),
  }
}
function U2(e, t) {
  const l = R2(e, t),
    n = T2(e, t),
    a = x2(e, t)
  switch (e.mode) {
    case 'single':
      return l
    case 'multiple':
      return n
    case 'range':
      return a
    default:
      return
  }
}
function rO(e) {
  let t = e
  t.timeZone &&
    ((t = { ...e }),
    t.today && (t.today = new Xt(t.today, t.timeZone)),
    t.month && (t.month = new Xt(t.month, t.timeZone)),
    t.defaultMonth && (t.defaultMonth = new Xt(t.defaultMonth, t.timeZone)),
    t.startMonth && (t.startMonth = new Xt(t.startMonth, t.timeZone)),
    t.endMonth && (t.endMonth = new Xt(t.endMonth, t.timeZone)),
    t.mode === 'single' && t.selected
      ? (t.selected = new Xt(t.selected, t.timeZone))
      : t.mode === 'multiple' && t.selected
        ? (t.selected = t.selected?.map((X) => new Xt(X, t.timeZone)))
        : t.mode === 'range' &&
          t.selected &&
          (t.selected = {
            from: t.selected.from ? new Xt(t.selected.from, t.timeZone) : void 0,
            to: t.selected.to ? new Xt(t.selected.to, t.timeZone) : void 0,
          }))
  const {
      components: l,
      formatters: n,
      labels: a,
      dateLib: u,
      locale: i,
      classNames: r,
    } = O.useMemo(() => {
      const X = { ...zy, ...t.locale }
      return {
        dateLib: new Tt(
          {
            locale: X,
            weekStartsOn: t.broadcastCalendar ? 1 : t.weekStartsOn,
            firstWeekContainsDate: t.firstWeekContainsDate,
            useAdditionalWeekYearTokens: t.useAdditionalWeekYearTokens,
            useAdditionalDayOfYearTokens: t.useAdditionalDayOfYearTokens,
            timeZone: t.timeZone,
            numerals: t.numerals,
          },
          t.dateLib,
        ),
        components: wE(t.components),
        formatters: WE(t.formatters),
        labels: { ...s2, ...t.labels },
        locale: X,
        classNames: { ...jE(), ...t.classNames },
      }
    }, [
      t.locale,
      t.broadcastCalendar,
      t.weekStartsOn,
      t.firstWeekContainsDate,
      t.useAdditionalWeekYearTokens,
      t.useAdditionalDayOfYearTokens,
      t.timeZone,
      t.numerals,
      t.dateLib,
      t.components,
      t.formatters,
      t.labels,
      t.classNames,
    ]),
    {
      captionLayout: c,
      mode: f,
      navLayout: d,
      numberOfMonths: y = 1,
      onDayBlur: o,
      onDayClick: v,
      onDayFocus: _,
      onDayKeyDown: p,
      onDayMouseEnter: A,
      onDayMouseLeave: h,
      onNextClick: s,
      onPrevClick: m,
      showWeekNumber: b,
      styles: S,
    } = t,
    {
      formatCaption: x,
      formatDay: M,
      formatMonthDropdown: R,
      formatWeekNumber: H,
      formatWeekNumberHeader: w,
      formatWeekdayName: J,
      formatYearDropdown: j,
    } = n,
    W = O2(t, u),
    {
      days: G,
      months: P,
      navStart: Te,
      navEnd: Ze,
      previousMonth: Ce,
      nextMonth: te,
      goToMonth: $e,
    } = W,
    fl = HE(G, t, Te, Ze, u),
    { isSelected: Jt, select: sl, selected: ot } = U2(t, u) ?? {},
    {
      blur: Vl,
      focused: Ct,
      isFocusTarget: jl,
      moveFocus: ql,
      setFocused: qt,
    } = A2(t, W, fl, Jt ?? (() => !1), u),
    {
      labelDayButton: Ft,
      labelGridcell: Ll,
      labelGrid: Lt,
      labelMonthDropdown: Kn,
      labelNav: Gl,
      labelPrevious: Sn,
      labelNext: Wn,
      labelWeekday: $t,
      labelWeekNumber: Jn,
      labelWeekNumberHeader: ol,
      labelYearDropdown: g,
    } = a,
    E = O.useMemo(() => $E(u, t.ISOWeek), [u, t.ISOWeek]),
    C = f !== void 0 || v !== void 0,
    B = O.useCallback(() => {
      Ce && ($e(Ce), m?.(Ce))
    }, [Ce, $e, m]),
    D = O.useCallback(() => {
      te && ($e(te), s?.(te))
    }, [$e, te, s]),
    T = O.useCallback(
      (X, de) => (Q) => {
        ;(Q.preventDefault(), Q.stopPropagation(), qt(X), sl?.(X.date, de, Q), v?.(X.date, de, Q))
      },
      [sl, v, qt],
    ),
    U = O.useCallback(
      (X, de) => (Q) => {
        ;(qt(X), _?.(X.date, de, Q))
      },
      [_, qt],
    ),
    q = O.useCallback(
      (X, de) => (Q) => {
        ;(Vl(), o?.(X.date, de, Q))
      },
      [Vl, o],
    ),
    Z = O.useCallback(
      (X, de) => (Q) => {
        const ye = {
          ArrowLeft: [Q.shiftKey ? 'month' : 'day', t.dir === 'rtl' ? 'after' : 'before'],
          ArrowRight: [Q.shiftKey ? 'month' : 'day', t.dir === 'rtl' ? 'before' : 'after'],
          ArrowDown: [Q.shiftKey ? 'year' : 'week', 'after'],
          ArrowUp: [Q.shiftKey ? 'year' : 'week', 'before'],
          PageUp: [Q.shiftKey ? 'year' : 'month', 'before'],
          PageDown: [Q.shiftKey ? 'year' : 'month', 'after'],
          Home: ['startOfWeek', 'before'],
          End: ['endOfWeek', 'after'],
        }
        if (ye[Q.key]) {
          ;(Q.preventDefault(), Q.stopPropagation())
          const [yt, le] = ye[Q.key]
          ql(yt, le)
        }
        p?.(X.date, de, Q)
      },
      [ql, p, t.dir],
    ),
    xe = O.useCallback(
      (X, de) => (Q) => {
        A?.(X.date, de, Q)
      },
      [A],
    ),
    dt = O.useCallback(
      (X, de) => (Q) => {
        h?.(X.date, de, Q)
      },
      [h],
    ),
    tt = O.useCallback(
      (X) => (de) => {
        const Q = Number(de.target.value),
          ye = u.setMonth(u.startOfMonth(X), Q)
        $e(ye)
      },
      [u, $e],
    ),
    En = O.useCallback(
      (X) => (de) => {
        const Q = Number(de.target.value),
          ye = u.setYear(u.startOfMonth(X), Q)
        $e(ye)
      },
      [u, $e],
    ),
    { className: dl, style: It } = O.useMemo(
      () => ({
        className: [r[V.Root], t.className].filter(Boolean).join(' '),
        style: { ...S?.[V.Root], ...t.style },
      }),
      [r, t.className, t.style, S],
    ),
    Dn = VE(t),
    yl = O.useRef(null)
  m2(yl, !!t.animate, { classNames: r, months: P, focused: Ct, dateLib: u })
  const On = {
    dayPickerProps: t,
    selected: ot,
    select: sl,
    isSelected: Jt,
    months: P,
    nextMonth: te,
    previousMonth: Ce,
    goToMonth: $e,
    getModifiers: fl,
    components: l,
    classNames: r,
    styles: S,
    labels: a,
    formatters: n,
  }
  return N.createElement(
    ag.Provider,
    { value: On },
    N.createElement(
      l.Root,
      {
        rootRef: t.animate ? yl : void 0,
        className: dl,
        style: It,
        dir: t.dir,
        id: t.id,
        lang: t.lang,
        nonce: t.nonce,
        title: t.title,
        role: t.role,
        'aria-label': t['aria-label'],
        'aria-labelledby': t['aria-labelledby'],
        ...Dn,
      },
      N.createElement(
        l.Months,
        { className: r[V.Months], style: S?.[V.Months] },
        !t.hideNavigation &&
          !d &&
          N.createElement(l.Nav, {
            'data-animated-nav': t.animate ? 'true' : void 0,
            className: r[V.Nav],
            style: S?.[V.Nav],
            'aria-label': Gl(),
            onPreviousClick: B,
            onNextClick: D,
            previousMonth: Ce,
            nextMonth: te,
          }),
        P.map((X, de) =>
          N.createElement(
            l.Month,
            {
              'data-animated-month': t.animate ? 'true' : void 0,
              className: r[V.Month],
              style: S?.[V.Month],
              key: de,
              displayIndex: de,
              calendarMonth: X,
            },
            d === 'around' &&
              !t.hideNavigation &&
              de === 0 &&
              N.createElement(
                l.PreviousMonthButton,
                {
                  type: 'button',
                  className: r[V.PreviousMonthButton],
                  tabIndex: Ce ? void 0 : -1,
                  'aria-disabled': Ce ? void 0 : !0,
                  'aria-label': Sn(Ce),
                  onClick: B,
                  'data-animated-button': t.animate ? 'true' : void 0,
                },
                N.createElement(l.Chevron, {
                  disabled: Ce ? void 0 : !0,
                  className: r[V.Chevron],
                  orientation: t.dir === 'rtl' ? 'right' : 'left',
                }),
              ),
            N.createElement(
              l.MonthCaption,
              {
                'data-animated-caption': t.animate ? 'true' : void 0,
                className: r[V.MonthCaption],
                style: S?.[V.MonthCaption],
                calendarMonth: X,
                displayIndex: de,
              },
              c?.startsWith('dropdown')
                ? N.createElement(
                    l.DropdownNav,
                    { className: r[V.Dropdowns], style: S?.[V.Dropdowns] },
                    (() => {
                      const Q =
                          c === 'dropdown' || c === 'dropdown-months'
                            ? N.createElement(l.MonthsDropdown, {
                                key: 'month',
                                className: r[V.MonthsDropdown],
                                'aria-label': Kn(),
                                classNames: r,
                                components: l,
                                disabled: !!t.disableNavigation,
                                onChange: tt(X.date),
                                options: JE(X.date, Te, Ze, n, u),
                                style: S?.[V.Dropdown],
                                value: u.getMonth(X.date),
                              })
                            : N.createElement('span', { key: 'month' }, R(X.date, u)),
                        ye =
                          c === 'dropdown' || c === 'dropdown-years'
                            ? N.createElement(l.YearsDropdown, {
                                key: 'year',
                                className: r[V.YearsDropdown],
                                'aria-label': g(u.options),
                                classNames: r,
                                components: l,
                                disabled: !!t.disableNavigation,
                                onChange: En(X.date),
                                options: IE(Te, Ze, n, u, !!t.reverseYears),
                                style: S?.[V.Dropdown],
                                value: u.getYear(X.date),
                              })
                            : N.createElement('span', { key: 'year' }, j(X.date, u))
                      return u.getMonthYearOrder() === 'year-first' ? [ye, Q] : [Q, ye]
                    })(),
                    N.createElement(
                      'span',
                      {
                        role: 'status',
                        'aria-live': 'polite',
                        style: {
                          border: 0,
                          clip: 'rect(0 0 0 0)',
                          height: '1px',
                          margin: '-1px',
                          overflow: 'hidden',
                          padding: 0,
                          position: 'absolute',
                          width: '1px',
                          whiteSpace: 'nowrap',
                          wordWrap: 'normal',
                        },
                      },
                      x(X.date, u.options, u),
                    ),
                  )
                : N.createElement(
                    l.CaptionLabel,
                    { className: r[V.CaptionLabel], role: 'status', 'aria-live': 'polite' },
                    x(X.date, u.options, u),
                  ),
            ),
            d === 'around' &&
              !t.hideNavigation &&
              de === y - 1 &&
              N.createElement(
                l.NextMonthButton,
                {
                  type: 'button',
                  className: r[V.NextMonthButton],
                  tabIndex: te ? void 0 : -1,
                  'aria-disabled': te ? void 0 : !0,
                  'aria-label': Wn(te),
                  onClick: D,
                  'data-animated-button': t.animate ? 'true' : void 0,
                },
                N.createElement(l.Chevron, {
                  disabled: te ? void 0 : !0,
                  className: r[V.Chevron],
                  orientation: t.dir === 'rtl' ? 'left' : 'right',
                }),
              ),
            de === y - 1 &&
              d === 'after' &&
              !t.hideNavigation &&
              N.createElement(l.Nav, {
                'data-animated-nav': t.animate ? 'true' : void 0,
                className: r[V.Nav],
                style: S?.[V.Nav],
                'aria-label': Gl(),
                onPreviousClick: B,
                onNextClick: D,
                previousMonth: Ce,
                nextMonth: te,
              }),
            N.createElement(
              l.MonthGrid,
              {
                role: 'grid',
                'aria-multiselectable': f === 'multiple' || f === 'range',
                'aria-label': Lt(X.date, u.options, u) || void 0,
                className: r[V.MonthGrid],
                style: S?.[V.MonthGrid],
              },
              !t.hideWeekdays &&
                N.createElement(
                  l.Weekdays,
                  {
                    'data-animated-weekdays': t.animate ? 'true' : void 0,
                    className: r[V.Weekdays],
                    style: S?.[V.Weekdays],
                  },
                  b &&
                    N.createElement(
                      l.WeekNumberHeader,
                      {
                        'aria-label': ol(u.options),
                        className: r[V.WeekNumberHeader],
                        style: S?.[V.WeekNumberHeader],
                        scope: 'col',
                      },
                      w(),
                    ),
                  E.map((Q) =>
                    N.createElement(
                      l.Weekday,
                      {
                        'aria-label': $t(Q, u.options, u),
                        className: r[V.Weekday],
                        key: String(Q),
                        style: S?.[V.Weekday],
                        scope: 'col',
                      },
                      J(Q, u.options, u),
                    ),
                  ),
                ),
              N.createElement(
                l.Weeks,
                {
                  'data-animated-weeks': t.animate ? 'true' : void 0,
                  className: r[V.Weeks],
                  style: S?.[V.Weeks],
                },
                X.weeks.map((Q) =>
                  N.createElement(
                    l.Week,
                    { className: r[V.Week], key: Q.weekNumber, style: S?.[V.Week], week: Q },
                    b &&
                      N.createElement(
                        l.WeekNumber,
                        {
                          week: Q,
                          style: S?.[V.WeekNumber],
                          'aria-label': Jn(Q.weekNumber, { locale: i }),
                          className: r[V.WeekNumber],
                          scope: 'row',
                          role: 'rowheader',
                        },
                        H(Q.weekNumber, u),
                      ),
                    Q.days.map((ye) => {
                      const { date: yt } = ye,
                        le = fl(ye)
                      if (
                        ((le[Oe.focused] = !le.hidden && !!Ct?.isEqualTo(ye)),
                        (le[Kt.selected] = Jt?.(yt) || le.selected),
                        mo(ot))
                      ) {
                        const { from: ec, to: tc } = ot
                        ;((le[Kt.range_start] = !!(ec && tc && u.isSameDay(yt, ec))),
                          (le[Kt.range_end] = !!(ec && tc && u.isSameDay(yt, tc))),
                          (le[Kt.range_middle] = Al(ot, yt, !0, u)))
                      }
                      const Tg = FE(le, S, t.modifiersStyles),
                        Cg = YE(le, r, t.modifiersClassNames),
                        zg = !C && !le.hidden ? Ll(yt, le, u.options, u) : void 0
                      return N.createElement(
                        l.Day,
                        {
                          key: `${u.format(yt, 'yyyy-MM-dd')}_${u.format(ye.displayMonth, 'yyyy-MM')}`,
                          day: ye,
                          modifiers: le,
                          className: Cg.join(' '),
                          style: Tg,
                          role: 'gridcell',
                          'aria-selected': le.selected || void 0,
                          'aria-label': zg,
                          'data-day': u.format(yt, 'yyyy-MM-dd'),
                          'data-month': ye.outside ? u.format(yt, 'yyyy-MM') : void 0,
                          'data-selected': le.selected || void 0,
                          'data-disabled': le.disabled || void 0,
                          'data-hidden': le.hidden || void 0,
                          'data-outside': ye.outside || void 0,
                          'data-focused': le.focused || void 0,
                          'data-today': le.today || void 0,
                        },
                        !le.hidden && C
                          ? N.createElement(
                              l.DayButton,
                              {
                                className: r[V.DayButton],
                                style: S?.[V.DayButton],
                                type: 'button',
                                day: ye,
                                modifiers: le,
                                disabled: le.disabled || void 0,
                                tabIndex: jl(ye) ? 0 : -1,
                                'aria-label': Ft(yt, le, u.options, u),
                                onClick: T(ye, le),
                                onBlur: q(ye, le),
                                onFocus: U(ye, le),
                                onKeyDown: Z(ye, le),
                                onMouseEnter: xe(ye, le),
                                onMouseLeave: dt(ye, le),
                              },
                              M(yt, u.options, u),
                            )
                          : !le.hidden && M(ye.date, u.options, u),
                      )
                    }),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      t.footer &&
        N.createElement(
          l.Footer,
          { className: r[V.Footer], style: S?.[V.Footer], role: 'status', 'aria-live': 'polite' },
          t.footer,
        ),
    ),
  )
}
function vy(e) {
  return Y2(e) || H2(e) || vg(e) || B2()
}
function B2() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)
}
function H2(e) {
  if ((typeof Symbol < 'u' && e[Symbol.iterator] != null) || e['@@iterator'] != null)
    return Array.from(e)
}
function Y2(e) {
  if (Array.isArray(e)) return Ff(e)
}
function gy(e, t) {
  var l = Object.keys(e)
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e)
    ;(t &&
      (n = n.filter(function (a) {
        return Object.getOwnPropertyDescriptor(e, a).enumerable
      })),
      l.push.apply(l, n))
  }
  return l
}
function by(e) {
  for (var t = 1; t < arguments.length; t++) {
    var l = arguments[t] != null ? arguments[t] : {}
    t % 2
      ? gy(Object(l), !0).forEach(function (n) {
          hg(e, n, l[n])
        })
      : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(l))
        : gy(Object(l)).forEach(function (n) {
            Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(l, n))
          })
  }
  return e
}
function hg(e, t, l) {
  return (
    t in e
      ? Object.defineProperty(e, t, { value: l, enumerable: !0, configurable: !0, writable: !0 })
      : (e[t] = l),
    e
  )
}
function Bu(e, t) {
  return j2(e) || V2(e, t) || vg(e, t) || w2()
}
function w2() {
  throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)
}
function vg(e, t) {
  if (e) {
    if (typeof e == 'string') return Ff(e, t)
    var l = Object.prototype.toString.call(e).slice(8, -1)
    if ((l === 'Object' && e.constructor && (l = e.constructor.name), l === 'Map' || l === 'Set'))
      return Array.from(e)
    if (l === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(l)) return Ff(e, t)
  }
}
function Ff(e, t) {
  ;(t == null || t > e.length) && (t = e.length)
  for (var l = 0, n = new Array(t); l < t; l++) n[l] = e[l]
  return n
}
function V2(e, t) {
  var l = e == null ? null : (typeof Symbol < 'u' && e[Symbol.iterator]) || e['@@iterator']
  if (l != null) {
    var n = [],
      a = !0,
      u = !1,
      i,
      r
    try {
      for (
        l = l.call(e);
        !(a = (i = l.next()).done) && (n.push(i.value), !(t && n.length === t));
        a = !0
      );
    } catch (c) {
      ;((u = !0), (r = c))
    } finally {
      try {
        !a && l.return != null && l.return()
      } finally {
        if (u) throw r
      }
    }
    return n
  }
}
function j2(e) {
  if (Array.isArray(e)) return e
}
var q2 = typeof lc == 'function' ? lc : lc.default,
  L2 = 'file-invalid-type',
  G2 = 'file-too-large',
  X2 = 'file-too-small',
  k2 = 'too-many-files',
  Z2 = function () {
    var t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : '',
      l = t.split(','),
      n = l.length > 1 ? 'one of '.concat(l.join(', ')) : l[0]
    return { code: L2, message: 'File type must be '.concat(n) }
  },
  py = function (t) {
    return {
      code: G2,
      message: 'File is larger than '.concat(t, ' ').concat(t === 1 ? 'byte' : 'bytes'),
    }
  },
  Sy = function (t) {
    return {
      code: X2,
      message: 'File is smaller than '.concat(t, ' ').concat(t === 1 ? 'byte' : 'bytes'),
    }
  },
  Q2 = { code: k2, message: 'Too many files' }
function gg(e, t) {
  var l = e.type === 'application/x-moz-file' || q2(e, t)
  return [l, l ? null : Z2(t)]
}
function bg(e, t, l) {
  if (zn(e.size))
    if (zn(t) && zn(l)) {
      if (e.size > l) return [!1, py(l)]
      if (e.size < t) return [!1, Sy(t)]
    } else {
      if (zn(t) && e.size < t) return [!1, Sy(t)]
      if (zn(l) && e.size > l) return [!1, py(l)]
    }
  return [!0, null]
}
function zn(e) {
  return e != null
}
function K2(e) {
  var t = e.files,
    l = e.accept,
    n = e.minSize,
    a = e.maxSize,
    u = e.multiple,
    i = e.maxFiles,
    r = e.validator
  return (!u && t.length > 1) || (u && i >= 1 && t.length > i)
    ? !1
    : t.every(function (c) {
        var f = gg(c, l),
          d = Bu(f, 1),
          y = d[0],
          o = bg(c, n, a),
          v = Bu(o, 1),
          _ = v[0],
          p = r ? r(c) : null
        return y && _ && !p
      })
}
function vr(e) {
  return typeof e.isPropagationStopped == 'function'
    ? e.isPropagationStopped()
    : typeof e.cancelBubble < 'u'
      ? e.cancelBubble
      : !1
}
function vi(e) {
  return e.dataTransfer
    ? Array.prototype.some.call(e.dataTransfer.types, function (t) {
        return t === 'Files' || t === 'application/x-moz-file'
      })
    : !!e.target && !!e.target.files
}
function Ey(e) {
  e.preventDefault()
}
function W2(e) {
  return e.indexOf('MSIE') !== -1 || e.indexOf('Trident/') !== -1
}
function J2(e) {
  return e.indexOf('Edge/') !== -1
}
function F2() {
  var e =
    arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : window.navigator.userAgent
  return W2(e) || J2(e)
}
function Pt() {
  for (var e = arguments.length, t = new Array(e), l = 0; l < e; l++) t[l] = arguments[l]
  return function (n) {
    for (var a = arguments.length, u = new Array(a > 1 ? a - 1 : 0), i = 1; i < a; i++)
      u[i - 1] = arguments[i]
    return t.some(function (r) {
      return (!vr(n) && r && r.apply(void 0, [n].concat(u)), vr(n))
    })
  }
}
function $2() {
  return 'showOpenFilePicker' in window
}
function I2(e) {
  if (zn(e)) {
    var t = Object.entries(e)
      .filter(function (l) {
        var n = Bu(l, 2),
          a = n[0],
          u = n[1],
          i = !0
        return (
          pg(a) ||
            (console.warn(
              'Skipped "'.concat(
                a,
                '" because it is not a valid MIME type. Check https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types for a list of valid MIME types.',
              ),
            ),
            (i = !1)),
          (!Array.isArray(u) || !u.every(Sg)) &&
            (console.warn(
              'Skipped "'.concat(a, '" because an invalid file extension was provided.'),
            ),
            (i = !1)),
          i
        )
      })
      .reduce(function (l, n) {
        var a = Bu(n, 2),
          u = a[0],
          i = a[1]
        return by(by({}, l), {}, hg({}, u, i))
      }, {})
    return [{ description: 'Files', accept: t }]
  }
  return e
}
function P2(e) {
  if (zn(e))
    return Object.entries(e)
      .reduce(function (t, l) {
        var n = Bu(l, 2),
          a = n[0],
          u = n[1]
        return [].concat(vy(t), [a], vy(u))
      }, [])
      .filter(function (t) {
        return pg(t) || Sg(t)
      })
      .join(',')
}
function eD(e) {
  return e instanceof DOMException && (e.name === 'AbortError' || e.code === e.ABORT_ERR)
}
function tD(e) {
  return e instanceof DOMException && (e.name === 'SecurityError' || e.code === e.SECURITY_ERR)
}
function pg(e) {
  return (
    e === 'audio/*' ||
    e === 'video/*' ||
    e === 'image/*' ||
    e === 'text/*' ||
    e === 'application/*' ||
    /\w+\/[-+.\w]+/g.test(e)
  )
}
function Sg(e) {
  return /^.*\.[\w]+$/.test(e)
}
var lD = ['children'],
  nD = ['open'],
  aD = [
    'refKey',
    'role',
    'onKeyDown',
    'onFocus',
    'onBlur',
    'onClick',
    'onDragEnter',
    'onDragOver',
    'onDragLeave',
    'onDrop',
  ],
  uD = ['refKey', 'onChange', 'onClick']
function iD(e) {
  return fD(e) || cD(e) || Eg(e) || rD()
}
function rD() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)
}
function cD(e) {
  if ((typeof Symbol < 'u' && e[Symbol.iterator] != null) || e['@@iterator'] != null)
    return Array.from(e)
}
function fD(e) {
  if (Array.isArray(e)) return $f(e)
}
function Qc(e, t) {
  return dD(e) || oD(e, t) || Eg(e, t) || sD()
}
function sD() {
  throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)
}
function Eg(e, t) {
  if (e) {
    if (typeof e == 'string') return $f(e, t)
    var l = Object.prototype.toString.call(e).slice(8, -1)
    if ((l === 'Object' && e.constructor && (l = e.constructor.name), l === 'Map' || l === 'Set'))
      return Array.from(e)
    if (l === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(l)) return $f(e, t)
  }
}
function $f(e, t) {
  ;(t == null || t > e.length) && (t = e.length)
  for (var l = 0, n = new Array(t); l < t; l++) n[l] = e[l]
  return n
}
function oD(e, t) {
  var l = e == null ? null : (typeof Symbol < 'u' && e[Symbol.iterator]) || e['@@iterator']
  if (l != null) {
    var n = [],
      a = !0,
      u = !1,
      i,
      r
    try {
      for (
        l = l.call(e);
        !(a = (i = l.next()).done) && (n.push(i.value), !(t && n.length === t));
        a = !0
      );
    } catch (c) {
      ;((u = !0), (r = c))
    } finally {
      try {
        !a && l.return != null && l.return()
      } finally {
        if (u) throw r
      }
    }
    return n
  }
}
function dD(e) {
  if (Array.isArray(e)) return e
}
function Dy(e, t) {
  var l = Object.keys(e)
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e)
    ;(t &&
      (n = n.filter(function (a) {
        return Object.getOwnPropertyDescriptor(e, a).enumerable
      })),
      l.push.apply(l, n))
  }
  return l
}
function De(e) {
  for (var t = 1; t < arguments.length; t++) {
    var l = arguments[t] != null ? arguments[t] : {}
    t % 2
      ? Dy(Object(l), !0).forEach(function (n) {
          If(e, n, l[n])
        })
      : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(l))
        : Dy(Object(l)).forEach(function (n) {
            Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(l, n))
          })
  }
  return e
}
function If(e, t, l) {
  return (
    t in e
      ? Object.defineProperty(e, t, { value: l, enumerable: !0, configurable: !0, writable: !0 })
      : (e[t] = l),
    e
  )
}
function gr(e, t) {
  if (e == null) return {}
  var l = yD(e, t),
    n,
    a
  if (Object.getOwnPropertySymbols) {
    var u = Object.getOwnPropertySymbols(e)
    for (a = 0; a < u.length; a++)
      ((n = u[a]),
        !(t.indexOf(n) >= 0) && Object.prototype.propertyIsEnumerable.call(e, n) && (l[n] = e[n]))
  }
  return l
}
function yD(e, t) {
  if (e == null) return {}
  var l = {},
    n = Object.keys(e),
    a,
    u
  for (u = 0; u < n.length; u++) ((a = n[u]), !(t.indexOf(a) >= 0) && (l[a] = e[a]))
  return l
}
var ho = O.forwardRef(function (e, t) {
  var l = e.children,
    n = gr(e, lD),
    a = mD(n),
    u = a.open,
    i = gr(a, nD)
  return (
    O.useImperativeHandle(
      t,
      function () {
        return { open: u }
      },
      [u],
    ),
    N.createElement(O.Fragment, null, l(De(De({}, i), {}, { open: u })))
  )
})
ho.displayName = 'Dropzone'
var Dg = {
  disabled: !1,
  getFilesFromEvent: jg,
  maxSize: 1 / 0,
  minSize: 0,
  multiple: !0,
  maxFiles: 0,
  preventDropOnDocument: !0,
  noClick: !1,
  noKeyboard: !1,
  noDrag: !1,
  noDragEventsBubbling: !1,
  validator: null,
  useFsAccessApi: !1,
  autoFocus: !1,
}
ho.defaultProps = Dg
ho.propTypes = {
  children: fe.func,
  accept: fe.objectOf(fe.arrayOf(fe.string)),
  multiple: fe.bool,
  preventDropOnDocument: fe.bool,
  noClick: fe.bool,
  noKeyboard: fe.bool,
  noDrag: fe.bool,
  noDragEventsBubbling: fe.bool,
  minSize: fe.number,
  maxSize: fe.number,
  maxFiles: fe.number,
  disabled: fe.bool,
  getFilesFromEvent: fe.func,
  onFileDialogCancel: fe.func,
  onFileDialogOpen: fe.func,
  useFsAccessApi: fe.bool,
  autoFocus: fe.bool,
  onDragEnter: fe.func,
  onDragLeave: fe.func,
  onDragOver: fe.func,
  onDrop: fe.func,
  onDropAccepted: fe.func,
  onDropRejected: fe.func,
  onError: fe.func,
  validator: fe.func,
}
var Pf = {
  isFocused: !1,
  isFileDialogActive: !1,
  isDragActive: !1,
  isDragAccept: !1,
  isDragReject: !1,
  acceptedFiles: [],
  fileRejections: [],
}
function mD() {
  var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
    t = De(De({}, Dg), e),
    l = t.accept,
    n = t.disabled,
    a = t.getFilesFromEvent,
    u = t.maxSize,
    i = t.minSize,
    r = t.multiple,
    c = t.maxFiles,
    f = t.onDragEnter,
    d = t.onDragLeave,
    y = t.onDragOver,
    o = t.onDrop,
    v = t.onDropAccepted,
    _ = t.onDropRejected,
    p = t.onFileDialogCancel,
    A = t.onFileDialogOpen,
    h = t.useFsAccessApi,
    s = t.autoFocus,
    m = t.preventDropOnDocument,
    b = t.noClick,
    S = t.noKeyboard,
    x = t.noDrag,
    M = t.noDragEventsBubbling,
    R = t.onError,
    H = t.validator,
    w = O.useMemo(
      function () {
        return P2(l)
      },
      [l],
    ),
    J = O.useMemo(
      function () {
        return I2(l)
      },
      [l],
    ),
    j = O.useMemo(
      function () {
        return typeof A == 'function' ? A : Oy
      },
      [A],
    ),
    W = O.useMemo(
      function () {
        return typeof p == 'function' ? p : Oy
      },
      [p],
    ),
    G = O.useRef(null),
    P = O.useRef(null),
    Te = O.useReducer(hD, Pf),
    Ze = Qc(Te, 2),
    Ce = Ze[0],
    te = Ze[1],
    $e = Ce.isFocused,
    fl = Ce.isFileDialogActive,
    Jt = O.useRef(typeof window < 'u' && window.isSecureContext && h && $2()),
    sl = function () {
      !Jt.current &&
        fl &&
        setTimeout(function () {
          if (P.current) {
            var T = P.current.files
            T.length || (te({ type: 'closeDialog' }), W())
          }
        }, 300)
    }
  O.useEffect(
    function () {
      return (
        window.addEventListener('focus', sl, !1),
        function () {
          window.removeEventListener('focus', sl, !1)
        }
      )
    },
    [P, fl, W, Jt],
  )
  var ot = O.useRef([]),
    Vl = function (T) {
      ;(G.current && G.current.contains(T.target)) || (T.preventDefault(), (ot.current = []))
    }
  ;(O.useEffect(
    function () {
      return (
        m &&
          (document.addEventListener('dragover', Ey, !1),
          document.addEventListener('drop', Vl, !1)),
        function () {
          m &&
            (document.removeEventListener('dragover', Ey), document.removeEventListener('drop', Vl))
        }
      )
    },
    [G, m],
  ),
    O.useEffect(
      function () {
        return (!n && s && G.current && G.current.focus(), function () {})
      },
      [G, s, n],
    ))
  var Ct = O.useCallback(
      function (D) {
        R ? R(D) : console.error(D)
      },
      [R],
    ),
    jl = O.useCallback(
      function (D) {
        ;(D.preventDefault(),
          D.persist(),
          g(D),
          (ot.current = [].concat(iD(ot.current), [D.target])),
          vi(D) &&
            Promise.resolve(a(D))
              .then(function (T) {
                if (!(vr(D) && !M)) {
                  var U = T.length,
                    q =
                      U > 0 &&
                      K2({
                        files: T,
                        accept: w,
                        minSize: i,
                        maxSize: u,
                        multiple: r,
                        maxFiles: c,
                        validator: H,
                      }),
                    Z = U > 0 && !q
                  ;(te({
                    isDragAccept: q,
                    isDragReject: Z,
                    isDragActive: !0,
                    type: 'setDraggedFiles',
                  }),
                    f && f(D))
                }
              })
              .catch(function (T) {
                return Ct(T)
              }))
      },
      [a, f, Ct, M, w, i, u, r, c, H],
    ),
    ql = O.useCallback(
      function (D) {
        ;(D.preventDefault(), D.persist(), g(D))
        var T = vi(D)
        if (T && D.dataTransfer)
          try {
            D.dataTransfer.dropEffect = 'copy'
          } catch {}
        return (T && y && y(D), !1)
      },
      [y, M],
    ),
    qt = O.useCallback(
      function (D) {
        ;(D.preventDefault(), D.persist(), g(D))
        var T = ot.current.filter(function (q) {
            return G.current && G.current.contains(q)
          }),
          U = T.indexOf(D.target)
        ;(U !== -1 && T.splice(U, 1),
          (ot.current = T),
          !(T.length > 0) &&
            (te({ type: 'setDraggedFiles', isDragActive: !1, isDragAccept: !1, isDragReject: !1 }),
            vi(D) && d && d(D)))
      },
      [G, d, M],
    ),
    Ft = O.useCallback(
      function (D, T) {
        var U = [],
          q = []
        ;(D.forEach(function (Z) {
          var xe = gg(Z, w),
            dt = Qc(xe, 2),
            tt = dt[0],
            En = dt[1],
            dl = bg(Z, i, u),
            It = Qc(dl, 2),
            Dn = It[0],
            yl = It[1],
            On = H ? H(Z) : null
          if (tt && Dn && !On) U.push(Z)
          else {
            var X = [En, yl]
            ;(On && (X = X.concat(On)),
              q.push({
                file: Z,
                errors: X.filter(function (de) {
                  return de
                }),
              }))
          }
        }),
          ((!r && U.length > 1) || (r && c >= 1 && U.length > c)) &&
            (U.forEach(function (Z) {
              q.push({ file: Z, errors: [Q2] })
            }),
            U.splice(0)),
          te({ acceptedFiles: U, fileRejections: q, isDragReject: q.length > 0, type: 'setFiles' }),
          o && o(U, q, T),
          q.length > 0 && _ && _(q, T),
          U.length > 0 && v && v(U, T))
      },
      [te, r, w, i, u, c, o, v, _, H],
    ),
    Ll = O.useCallback(
      function (D) {
        ;(D.preventDefault(),
          D.persist(),
          g(D),
          (ot.current = []),
          vi(D) &&
            Promise.resolve(a(D))
              .then(function (T) {
                ;(vr(D) && !M) || Ft(T, D)
              })
              .catch(function (T) {
                return Ct(T)
              }),
          te({ type: 'reset' }))
      },
      [a, Ft, Ct, M],
    ),
    Lt = O.useCallback(
      function () {
        if (Jt.current) {
          ;(te({ type: 'openDialog' }), j())
          var D = { multiple: r, types: J }
          window
            .showOpenFilePicker(D)
            .then(function (T) {
              return a(T)
            })
            .then(function (T) {
              ;(Ft(T, null), te({ type: 'closeDialog' }))
            })
            .catch(function (T) {
              eD(T)
                ? (W(T), te({ type: 'closeDialog' }))
                : tD(T)
                  ? ((Jt.current = !1),
                    P.current
                      ? ((P.current.value = null), P.current.click())
                      : Ct(
                          new Error(
                            'Cannot open the file picker because the https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API is not supported and no <input> was provided.',
                          ),
                        ))
                  : Ct(T)
            })
          return
        }
        P.current && (te({ type: 'openDialog' }), j(), (P.current.value = null), P.current.click())
      },
      [te, j, W, h, Ft, Ct, J, r],
    ),
    Kn = O.useCallback(
      function (D) {
        !G.current ||
          !G.current.isEqualNode(D.target) ||
          ((D.key === ' ' || D.key === 'Enter' || D.keyCode === 32 || D.keyCode === 13) &&
            (D.preventDefault(), Lt()))
      },
      [G, Lt],
    ),
    Gl = O.useCallback(function () {
      te({ type: 'focus' })
    }, []),
    Sn = O.useCallback(function () {
      te({ type: 'blur' })
    }, []),
    Wn = O.useCallback(
      function () {
        b || (F2() ? setTimeout(Lt, 0) : Lt())
      },
      [b, Lt],
    ),
    $t = function (T) {
      return n ? null : T
    },
    Jn = function (T) {
      return S ? null : $t(T)
    },
    ol = function (T) {
      return x ? null : $t(T)
    },
    g = function (T) {
      M && T.stopPropagation()
    },
    E = O.useMemo(
      function () {
        return function () {
          var D = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
            T = D.refKey,
            U = T === void 0 ? 'ref' : T,
            q = D.role,
            Z = D.onKeyDown,
            xe = D.onFocus,
            dt = D.onBlur,
            tt = D.onClick,
            En = D.onDragEnter,
            dl = D.onDragOver,
            It = D.onDragLeave,
            Dn = D.onDrop,
            yl = gr(D, aD)
          return De(
            De(
              If(
                {
                  onKeyDown: Jn(Pt(Z, Kn)),
                  onFocus: Jn(Pt(xe, Gl)),
                  onBlur: Jn(Pt(dt, Sn)),
                  onClick: $t(Pt(tt, Wn)),
                  onDragEnter: ol(Pt(En, jl)),
                  onDragOver: ol(Pt(dl, ql)),
                  onDragLeave: ol(Pt(It, qt)),
                  onDrop: ol(Pt(Dn, Ll)),
                  role: typeof q == 'string' && q !== '' ? q : 'presentation',
                },
                U,
                G,
              ),
              !n && !S ? { tabIndex: 0 } : {},
            ),
            yl,
          )
        }
      },
      [G, Kn, Gl, Sn, Wn, jl, ql, qt, Ll, S, x, n],
    ),
    C = O.useCallback(function (D) {
      D.stopPropagation()
    }, []),
    B = O.useMemo(
      function () {
        return function () {
          var D = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
            T = D.refKey,
            U = T === void 0 ? 'ref' : T,
            q = D.onChange,
            Z = D.onClick,
            xe = gr(D, uD),
            dt = If(
              {
                accept: w,
                multiple: r,
                type: 'file',
                style: {
                  border: 0,
                  clip: 'rect(0, 0, 0, 0)',
                  clipPath: 'inset(50%)',
                  height: '1px',
                  margin: '0 -1px -1px 0',
                  overflow: 'hidden',
                  padding: 0,
                  position: 'absolute',
                  width: '1px',
                  whiteSpace: 'nowrap',
                },
                onChange: $t(Pt(q, Ll)),
                onClick: $t(Pt(Z, C)),
                tabIndex: -1,
              },
              U,
              P,
            )
          return De(De({}, dt), xe)
        }
      },
      [P, l, r, Ll, n],
    )
  return De(
    De({}, Ce),
    {},
    {
      isFocused: $e && !n,
      getRootProps: E,
      getInputProps: B,
      rootRef: G,
      inputRef: P,
      open: $t(Lt),
    },
  )
}
function hD(e, t) {
  switch (t.type) {
    case 'focus':
      return De(De({}, e), {}, { isFocused: !0 })
    case 'blur':
      return De(De({}, e), {}, { isFocused: !1 })
    case 'openDialog':
      return De(De({}, Pf), {}, { isFileDialogActive: !0 })
    case 'closeDialog':
      return De(De({}, e), {}, { isFileDialogActive: !1 })
    case 'setDraggedFiles':
      return De(
        De({}, e),
        {},
        {
          isDragActive: t.isDragActive,
          isDragAccept: t.isDragAccept,
          isDragReject: t.isDragReject,
        },
      )
    case 'setFiles':
      return De(
        De({}, e),
        {},
        {
          acceptedFiles: t.acceptedFiles,
          fileRejections: t.fileRejections,
          isDragReject: t.isDragReject,
        },
      )
    case 'reset':
      return De({}, Pf)
    default:
      return e
  }
}
function Oy() {}
var Og = { exports: {} },
  oe = {}
/**
 * @license React
 * react-is.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var vo = Symbol.for('react.transitional.element'),
  go = Symbol.for('react.portal'),
  Gr = Symbol.for('react.fragment'),
  Xr = Symbol.for('react.strict_mode'),
  kr = Symbol.for('react.profiler'),
  Zr = Symbol.for('react.consumer'),
  Qr = Symbol.for('react.context'),
  Kr = Symbol.for('react.forward_ref'),
  Wr = Symbol.for('react.suspense'),
  Jr = Symbol.for('react.suspense_list'),
  Fr = Symbol.for('react.memo'),
  $r = Symbol.for('react.lazy'),
  vD = Symbol.for('react.view_transition'),
  gD = Symbol.for('react.client.reference')
function jt(e) {
  if (typeof e == 'object' && e !== null) {
    var t = e.$$typeof
    switch (t) {
      case vo:
        switch (((e = e.type), e)) {
          case Gr:
          case kr:
          case Xr:
          case Wr:
          case Jr:
          case vD:
            return e
          default:
            switch (((e = e && e.$$typeof), e)) {
              case Qr:
              case Kr:
              case $r:
              case Fr:
                return e
              case Zr:
                return e
              default:
                return t
            }
        }
      case go:
        return t
    }
  }
}
oe.ContextConsumer = Zr
oe.ContextProvider = Qr
oe.Element = vo
oe.ForwardRef = Kr
oe.Fragment = Gr
oe.Lazy = $r
oe.Memo = Fr
oe.Portal = go
oe.Profiler = kr
oe.StrictMode = Xr
oe.Suspense = Wr
oe.SuspenseList = Jr
oe.isContextConsumer = function (e) {
  return jt(e) === Zr
}
oe.isContextProvider = function (e) {
  return jt(e) === Qr
}
oe.isElement = function (e) {
  return typeof e == 'object' && e !== null && e.$$typeof === vo
}
oe.isForwardRef = function (e) {
  return jt(e) === Kr
}
oe.isFragment = function (e) {
  return jt(e) === Gr
}
oe.isLazy = function (e) {
  return jt(e) === $r
}
oe.isMemo = function (e) {
  return jt(e) === Fr
}
oe.isPortal = function (e) {
  return jt(e) === go
}
oe.isProfiler = function (e) {
  return jt(e) === kr
}
oe.isStrictMode = function (e) {
  return jt(e) === Xr
}
oe.isSuspense = function (e) {
  return jt(e) === Wr
}
oe.isSuspenseList = function (e) {
  return jt(e) === Jr
}
oe.isValidElementType = function (e) {
  return (
    typeof e == 'string' ||
    typeof e == 'function' ||
    e === Gr ||
    e === kr ||
    e === Xr ||
    e === Wr ||
    e === Jr ||
    (typeof e == 'object' &&
      e !== null &&
      (e.$$typeof === $r ||
        e.$$typeof === Fr ||
        e.$$typeof === Qr ||
        e.$$typeof === Zr ||
        e.$$typeof === Kr ||
        e.$$typeof === gD ||
        e.getModuleId !== void 0))
  )
}
oe.typeOf = jt
Og.exports = oe
var cO = Og.exports
function bD(e) {
  e()
}
function pD() {
  let e = null,
    t = null
  return {
    clear() {
      ;((e = null), (t = null))
    },
    notify() {
      bD(() => {
        let l = e
        for (; l; ) (l.callback(), (l = l.next))
      })
    },
    get() {
      const l = []
      let n = e
      for (; n; ) (l.push(n), (n = n.next))
      return l
    },
    subscribe(l) {
      let n = !0
      const a = (t = { callback: l, next: null, prev: t })
      return (
        a.prev ? (a.prev.next = a) : (e = a),
        function () {
          !n ||
            e === null ||
            ((n = !1),
            a.next ? (a.next.prev = a.prev) : (t = a.prev),
            a.prev ? (a.prev.next = a.next) : (e = a.next))
        }
      )
    },
  }
}
var _y = { notify() {}, get: () => [] }
function SD(e, t) {
  let l,
    n = _y,
    a = 0,
    u = !1
  function i(p) {
    d()
    const A = n.subscribe(p)
    let h = !1
    return () => {
      h || ((h = !0), A(), y())
    }
  }
  function r() {
    n.notify()
  }
  function c() {
    _.onStateChange && _.onStateChange()
  }
  function f() {
    return u
  }
  function d() {
    ;(a++, l || ((l = e.subscribe(c)), (n = pD())))
  }
  function y() {
    ;(a--, l && a === 0 && (l(), (l = void 0), n.clear(), (n = _y)))
  }
  function o() {
    u || ((u = !0), d())
  }
  function v() {
    u && ((u = !1), y())
  }
  const _ = {
    addNestedSub: i,
    notifyNestedSubs: r,
    handleChangeWrapper: c,
    isSubscribed: f,
    trySubscribe: o,
    tryUnsubscribe: v,
    getListeners: () => n,
  }
  return _
}
var ED = () =>
    typeof window < 'u' &&
    typeof window.document < 'u' &&
    typeof window.document.createElement < 'u',
  DD = ED(),
  OD = () => typeof navigator < 'u' && navigator.product === 'ReactNative',
  _D = OD(),
  MD = () => (DD || _D ? O.useLayoutEffect : O.useEffect),
  AD = MD(),
  TD = Symbol.for('react-redux-context'),
  CD = typeof globalThis < 'u' ? globalThis : {}
function zD() {
  if (!O.createContext) return {}
  const e = (CD[TD] ??= new Map())
  let t = e.get(O.createContext)
  return (t || ((t = O.createContext(null)), e.set(O.createContext, t)), t)
}
var ND = zD()
function xD(e) {
  const { children: t, context: l, serverState: n, store: a } = e,
    u = O.useMemo(() => {
      const c = SD(a)
      return { store: a, subscription: c, getServerState: n ? () => n : void 0 }
    }, [a, n]),
    i = O.useMemo(() => a.getState(), [a])
  AD(() => {
    const { subscription: c } = u
    return (
      (c.onStateChange = c.notifyNestedSubs),
      c.trySubscribe(),
      i !== a.getState() && c.notifyNestedSubs(),
      () => {
        ;(c.tryUnsubscribe(), (c.onStateChange = void 0))
      }
    )
  }, [u, i])
  const r = l || ND
  return O.createElement(r.Provider, { value: u }, t)
}
var fO = xD,
  Ir = {}
Ir.__esModule = !0
Ir.default = void 0
var RD = bo(O),
  kl = bo(Ty),
  UD = bo(Cy)
function bo(e) {
  return e && e.__esModule ? e : { default: e }
}
const _g = ({
  animate: e = !0,
  className: t = '',
  layout: l = '2-columns',
  lineColor: n = '#FFF',
  children: a,
}) => (
  typeof window == 'object' && document.documentElement.style.setProperty('--line-color', n),
  RD.default.createElement(
    'div',
    {
      className: (0, UD.default)(t, 'vertical-timeline', {
        'vertical-timeline--animate': e,
        'vertical-timeline--two-columns': l === '2-columns',
        'vertical-timeline--one-column-left': l === '1-column' || l === '1-column-left',
        'vertical-timeline--one-column-right': l === '1-column-right',
      }),
    },
    a,
  )
)
_g.propTypes = {
  children: kl.default.oneOfType([kl.default.arrayOf(kl.default.node), kl.default.node]).isRequired,
  className: kl.default.string,
  animate: kl.default.bool,
  layout: kl.default.oneOf(['1-column-left', '1-column', '2-columns', '1-column-right']),
  lineColor: kl.default.string,
}
var BD = _g
Ir.default = BD
var Pr = {}
function es() {
  return (
    (es =
      Object.assign ||
      function (e) {
        for (var t = 1; t < arguments.length; t++) {
          var l = arguments[t]
          for (var n in l) Object.prototype.hasOwnProperty.call(l, n) && (e[n] = l[n])
        }
        return e
      }),
    es.apply(this, arguments)
  )
}
function HD(e, t) {
  ;((e.prototype = Object.create(t.prototype)), (e.prototype.constructor = e), ts(e, t))
}
function ts(e, t) {
  return (
    (ts =
      Object.setPrototypeOf ||
      function (n, a) {
        return ((n.__proto__ = a), n)
      }),
    ts(e, t)
  )
}
function YD(e, t) {
  if (e == null) return {}
  var l = {},
    n = Object.keys(e),
    a,
    u
  for (u = 0; u < n.length; u++) ((a = n[u]), !(t.indexOf(a) >= 0) && (l[a] = e[a]))
  return l
}
var ls = new Map(),
  gi = new WeakMap(),
  My = 0,
  Mg = void 0
function wD(e) {
  Mg = e
}
function VD(e) {
  return e ? (gi.has(e) || ((My += 1), gi.set(e, My.toString())), gi.get(e)) : '0'
}
function jD(e) {
  return Object.keys(e)
    .sort()
    .filter(function (t) {
      return e[t] !== void 0
    })
    .map(function (t) {
      return t + '_' + (t === 'root' ? VD(e.root) : e[t])
    })
    .toString()
}
function qD(e) {
  var t = jD(e),
    l = ls.get(t)
  if (!l) {
    var n = new Map(),
      a,
      u = new IntersectionObserver(function (i) {
        i.forEach(function (r) {
          var c,
            f =
              r.isIntersecting &&
              a.some(function (d) {
                return r.intersectionRatio >= d
              })
          ;(e.trackVisibility && typeof r.isVisible > 'u' && (r.isVisible = f),
            (c = n.get(r.target)) == null ||
              c.forEach(function (d) {
                d(f, r)
              }))
        })
      }, e)
    ;((a = u.thresholds || (Array.isArray(e.threshold) ? e.threshold : [e.threshold || 0])),
      (l = { id: t, observer: u, elements: n }),
      ls.set(t, l))
  }
  return l
}
function po(e, t, l, n) {
  if (
    (l === void 0 && (l = {}),
    n === void 0 && (n = Mg),
    typeof window.IntersectionObserver > 'u' && n !== void 0)
  ) {
    var a = e.getBoundingClientRect()
    return (
      t(n, {
        isIntersecting: n,
        target: e,
        intersectionRatio: typeof l.threshold == 'number' ? l.threshold : 0,
        time: 0,
        boundingClientRect: a,
        intersectionRect: a,
        rootBounds: a,
      }),
      function () {}
    )
  }
  var u = qD(l),
    i = u.id,
    r = u.observer,
    c = u.elements,
    f = c.get(e) || []
  return (
    c.has(e) || c.set(e, f),
    f.push(t),
    r.observe(e),
    function () {
      ;(f.splice(f.indexOf(t), 1),
        f.length === 0 && (c.delete(e), r.unobserve(e)),
        c.size === 0 && (r.disconnect(), ls.delete(i)))
    }
  )
}
var LD = [
  'children',
  'as',
  'triggerOnce',
  'threshold',
  'root',
  'rootMargin',
  'onChange',
  'skip',
  'trackVisibility',
  'delay',
  'initialInView',
  'fallbackInView',
]
function Ay(e) {
  return typeof e.children != 'function'
}
var br = (function (e) {
  HD(t, e)
  function t(n) {
    var a
    return (
      (a = e.call(this, n) || this),
      (a.node = null),
      (a._unobserveCb = null),
      (a.handleNode = function (u) {
        ;(a.node &&
          (a.unobserve(),
          !u &&
            !a.props.triggerOnce &&
            !a.props.skip &&
            a.setState({ inView: !!a.props.initialInView, entry: void 0 })),
          (a.node = u || null),
          a.observeNode())
      }),
      (a.handleChange = function (u, i) {
        ;(u && a.props.triggerOnce && a.unobserve(),
          Ay(a.props) || a.setState({ inView: u, entry: i }),
          a.props.onChange && a.props.onChange(u, i))
      }),
      (a.state = { inView: !!n.initialInView, entry: void 0 }),
      a
    )
  }
  var l = t.prototype
  return (
    (l.componentDidUpdate = function (a) {
      ;(a.rootMargin !== this.props.rootMargin ||
        a.root !== this.props.root ||
        a.threshold !== this.props.threshold ||
        a.skip !== this.props.skip ||
        a.trackVisibility !== this.props.trackVisibility ||
        a.delay !== this.props.delay) &&
        (this.unobserve(), this.observeNode())
    }),
    (l.componentWillUnmount = function () {
      ;(this.unobserve(), (this.node = null))
    }),
    (l.observeNode = function () {
      if (!(!this.node || this.props.skip)) {
        var a = this.props,
          u = a.threshold,
          i = a.root,
          r = a.rootMargin,
          c = a.trackVisibility,
          f = a.delay,
          d = a.fallbackInView
        this._unobserveCb = po(
          this.node,
          this.handleChange,
          { threshold: u, root: i, rootMargin: r, trackVisibility: c, delay: f },
          d,
        )
      }
    }),
    (l.unobserve = function () {
      this._unobserveCb && (this._unobserveCb(), (this._unobserveCb = null))
    }),
    (l.render = function () {
      if (!Ay(this.props)) {
        var a = this.state,
          u = a.inView,
          i = a.entry
        return this.props.children({ inView: u, entry: i, ref: this.handleNode })
      }
      var r = this.props,
        c = r.children,
        f = r.as,
        d = YD(r, LD)
      return O.createElement(f || 'div', es({ ref: this.handleNode }, d), c)
    }),
    t
  )
})(O.Component)
br.displayName = 'InView'
br.defaultProps = { threshold: 0, triggerOnce: !1, initialInView: !1 }
function GD(e) {
  var t = e === void 0 ? {} : e,
    l = t.threshold,
    n = t.delay,
    a = t.trackVisibility,
    u = t.rootMargin,
    i = t.root,
    r = t.triggerOnce,
    c = t.skip,
    f = t.initialInView,
    d = t.fallbackInView,
    y = O.useRef(),
    o = O.useState({ inView: !!f }),
    v = o[0],
    _ = o[1],
    p = O.useCallback(
      function (h) {
        ;(y.current !== void 0 && (y.current(), (y.current = void 0)),
          !c &&
            h &&
            (y.current = po(
              h,
              function (s, m) {
                ;(_({ inView: s, entry: m }),
                  m.isIntersecting && r && y.current && (y.current(), (y.current = void 0)))
              },
              { root: i, rootMargin: u, threshold: l, trackVisibility: a, delay: n },
              d,
            )))
      },
      [Array.isArray(l) ? l.toString() : l, i, u, r, c, a, d, n],
    )
  O.useEffect(function () {
    !y.current && v.entry && !r && !c && _({ inView: !!f })
  })
  var A = [p, v.inView, v.entry]
  return ((A.ref = A[0]), (A.inView = A[1]), (A.entry = A[2]), A)
}
const XD = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        InView: br,
        default: br,
        defaultFallbackInView: wD,
        observe: po,
        useInView: GD,
      },
      Symbol.toStringTag,
      { value: 'Module' },
    ),
  ),
  kD = p0(XD)
Pr.__esModule = !0
Pr.default = void 0
var Zl = So(O),
  ge = So(Ty),
  bi = So(Cy),
  ZD = kD
function So(e) {
  return e && e.__esModule ? e : { default: e }
}
const Ag = ({
  children: e = '',
  className: t = '',
  contentArrowStyle: l = null,
  contentStyle: n = null,
  date: a = '',
  dateClassName: u = '',
  icon: i = null,
  iconClassName: r = '',
  iconOnClick: c = null,
  onTimelineElementClick: f = null,
  iconStyle: d = null,
  id: y = '',
  position: o = '',
  style: v = null,
  textClassName: _ = '',
  intersectionObserverProps: p = { rootMargin: '0px 0px -40px 0px', triggerOnce: !0 },
  visible: A = !1,
  shadowSize: h = 'small',
}) =>
  Zl.default.createElement(ZD.InView, p, ({ inView: s, ref: m }) =>
    Zl.default.createElement(
      'div',
      {
        ref: m,
        id: y,
        className: (0, bi.default)(t, 'vertical-timeline-element', {
          'vertical-timeline-element--left': o === 'left',
          'vertical-timeline-element--right': o === 'right',
          'vertical-timeline-element--no-children': e === '',
        }),
        style: v,
      },
      Zl.default.createElement(
        Zl.default.Fragment,
        null,
        Zl.default.createElement(
          'span',
          {
            style: d,
            onClick: c,
            className: (0, bi.default)(r, 'vertical-timeline-element-icon', `shadow-size-${h}`, {
              'bounce-in': s || A,
              'is-hidden': !(s || A),
            }),
          },
          i,
        ),
        Zl.default.createElement(
          'div',
          {
            style: n,
            onClick: f,
            className: (0, bi.default)(_, 'vertical-timeline-element-content', {
              'bounce-in': s || A,
              'is-hidden': !(s || A),
            }),
          },
          Zl.default.createElement('div', {
            style: l,
            className: 'vertical-timeline-element-content-arrow',
          }),
          e,
          Zl.default.createElement(
            'span',
            { className: (0, bi.default)(u, 'vertical-timeline-element-date') },
            a,
          ),
        ),
      ),
    ),
  )
Ag.propTypes = {
  children: ge.default.oneOfType([ge.default.arrayOf(ge.default.node), ge.default.node]),
  className: ge.default.string,
  contentArrowStyle: ge.default.shape({}),
  contentStyle: ge.default.shape({}),
  date: ge.default.node,
  dateClassName: ge.default.string,
  icon: ge.default.element,
  iconClassName: ge.default.string,
  iconStyle: ge.default.shape({}),
  iconOnClick: ge.default.func,
  onTimelineElementClick: ge.default.func,
  id: ge.default.string,
  position: ge.default.string,
  style: ge.default.shape({}),
  textClassName: ge.default.string,
  visible: ge.default.bool,
  shadowSize: ge.default.string,
  intersectionObserverProps: ge.default.shape({
    root: ge.default.object,
    rootMargin: ge.default.string,
    threshold: ge.default.number,
    triggerOnce: ge.default.bool,
  }),
}
var QD = Ag
Pr.default = QD
var sO = { VerticalTimeline: Ir.default, VerticalTimelineElement: Pr.default }
export {
  uO as C,
  rO as D,
  aO as F,
  fO as P,
  N as R,
  ky as a,
  $D as b,
  JD as c,
  ID as d,
  YS as e,
  Ny as f,
  p0 as g,
  Y as h,
  GS as i,
  FD as j,
  cO as k,
  eO as l,
  jE as m,
  fo as n,
  iO as o,
  lO as p,
  PD as q,
  O as r,
  me as s,
  mD as t,
  tO as u,
  sO as v,
  nO as z,
}
//# sourceMappingURL=react-vendor-Buoak6m3.js.map
