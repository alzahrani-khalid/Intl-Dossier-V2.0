const d = (i) => typeof i == 'string',
  T = () => {
    let i, e
    const t = new Promise((s, n) => {
      ;((i = s), (e = n))
    })
    return ((t.resolve = i), (t.reject = e), t)
  },
  ee = (i) => (i == null ? '' : '' + i),
  we = (i, e, t) => {
    i.forEach((s) => {
      e[s] && (t[s] = e[s])
    })
  },
  ve = /###/g,
  te = (i) => (i && i.indexOf('###') > -1 ? i.replace(ve, '.') : i),
  se = (i) => !i || d(i),
  U = (i, e, t) => {
    const s = d(e) ? e.split('.') : e
    let n = 0
    for (; n < s.length - 1; ) {
      if (se(i)) return {}
      const r = te(s[n])
      ;(!i[r] && t && (i[r] = new t()),
        Object.prototype.hasOwnProperty.call(i, r) ? (i = i[r]) : (i = {}),
        ++n)
    }
    return se(i) ? {} : { obj: i, k: te(s[n]) }
  },
  ne = (i, e, t) => {
    const { obj: s, k: n } = U(i, e, Object)
    if (s !== void 0 || e.length === 1) {
      s[n] = t
      return
    }
    let r = e[e.length - 1],
      a = e.slice(0, e.length - 1),
      o = U(i, a, Object)
    for (; o.obj === void 0 && a.length; )
      ((r = `${a[a.length - 1]}.${r}`),
        (a = a.slice(0, a.length - 1)),
        (o = U(i, a, Object)),
        o && o.obj && typeof o.obj[`${o.k}.${r}`] < 'u' && (o.obj = void 0))
    o.obj[`${o.k}.${r}`] = t
  },
  Le = (i, e, t, s) => {
    const { obj: n, k: r } = U(i, e, Object)
    ;((n[r] = n[r] || []), n[r].push(t))
  },
  z = (i, e) => {
    const { obj: t, k: s } = U(i, e)
    if (t) return t[s]
  },
  Oe = (i, e, t) => {
    const s = z(i, t)
    return s !== void 0 ? s : z(e, t)
  },
  pe = (i, e, t) => {
    for (const s in e)
      s !== '__proto__' &&
        s !== 'constructor' &&
        (s in i
          ? d(i[s]) || i[s] instanceof String || d(e[s]) || e[s] instanceof String
            ? t && (i[s] = e[s])
            : pe(i[s], e[s], t)
          : (i[s] = e[s]))
    return i
  },
  P = (i) => i.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
var ke = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;' }
const Ce = (i) => (d(i) ? i.replace(/[&<>"'\/]/g, (e) => ke[e]) : i)
class Ne {
  constructor(e) {
    ;((this.capacity = e), (this.regExpMap = new Map()), (this.regExpQueue = []))
  }
  getRegExp(e) {
    const t = this.regExpMap.get(e)
    if (t !== void 0) return t
    const s = new RegExp(e)
    return (
      this.regExpQueue.length === this.capacity && this.regExpMap.delete(this.regExpQueue.shift()),
      this.regExpMap.set(e, s),
      this.regExpQueue.push(e),
      s
    )
  }
}
const Pe = [' ', ',', '?', '!', ';'],
  Re = new Ne(20),
  $e = (i, e, t) => {
    ;((e = e || ''), (t = t || ''))
    const s = Pe.filter((a) => e.indexOf(a) < 0 && t.indexOf(a) < 0)
    if (s.length === 0) return !0
    const n = Re.getRegExp(`(${s.map((a) => (a === '?' ? '\\?' : a)).join('|')})`)
    let r = !n.test(i)
    if (!r) {
      const a = i.indexOf(t)
      a > 0 && !n.test(i.substring(0, a)) && (r = !0)
    }
    return r
  },
  Z = function (i, e) {
    let t = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : '.'
    if (!i) return
    if (i[e]) return i[e]
    const s = e.split(t)
    let n = i
    for (let r = 0; r < s.length; ) {
      if (!n || typeof n != 'object') return
      let a,
        o = ''
      for (let l = r; l < s.length; ++l)
        if ((l !== r && (o += t), (o += s[l]), (a = n[o]), a !== void 0)) {
          if (['string', 'number', 'boolean'].indexOf(typeof a) > -1 && l < s.length - 1) continue
          r += l - r + 1
          break
        }
      n = a
    }
    return n
  },
  J = (i) => i && i.replace('_', '-'),
  Ie = {
    type: 'logger',
    log(i) {
      this.output('log', i)
    },
    warn(i) {
      this.output('warn', i)
    },
    error(i) {
      this.output('error', i)
    },
    output(i, e) {
      console && console[i] && console[i].apply(console, e)
    },
  }
class B {
  constructor(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}
    this.init(e, t)
  }
  init(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}
    ;((this.prefix = t.prefix || 'i18next:'),
      (this.logger = e || Ie),
      (this.options = t),
      (this.debug = t.debug))
  }
  log() {
    for (var e = arguments.length, t = new Array(e), s = 0; s < e; s++) t[s] = arguments[s]
    return this.forward(t, 'log', '', !0)
  }
  warn() {
    for (var e = arguments.length, t = new Array(e), s = 0; s < e; s++) t[s] = arguments[s]
    return this.forward(t, 'warn', '', !0)
  }
  error() {
    for (var e = arguments.length, t = new Array(e), s = 0; s < e; s++) t[s] = arguments[s]
    return this.forward(t, 'error', '')
  }
  deprecate() {
    for (var e = arguments.length, t = new Array(e), s = 0; s < e; s++) t[s] = arguments[s]
    return this.forward(t, 'warn', 'WARNING DEPRECATED: ', !0)
  }
  forward(e, t, s, n) {
    return n && !this.debug
      ? null
      : (d(e[0]) && (e[0] = `${s}${this.prefix} ${e[0]}`), this.logger[t](e))
  }
  create(e) {
    return new B(this.logger, { prefix: `${this.prefix}:${e}:`, ...this.options })
  }
  clone(e) {
    return ((e = e || this.options), (e.prefix = e.prefix || this.prefix), new B(this.logger, e))
  }
}
var C = new B()
class W {
  constructor() {
    this.observers = {}
  }
  on(e, t) {
    return (
      e.split(' ').forEach((s) => {
        this.observers[s] || (this.observers[s] = new Map())
        const n = this.observers[s].get(t) || 0
        this.observers[s].set(t, n + 1)
      }),
      this
    )
  }
  off(e, t) {
    if (this.observers[e]) {
      if (!t) {
        delete this.observers[e]
        return
      }
      this.observers[e].delete(t)
    }
  }
  emit(e) {
    for (var t = arguments.length, s = new Array(t > 1 ? t - 1 : 0), n = 1; n < t; n++)
      s[n - 1] = arguments[n]
    ;(this.observers[e] &&
      Array.from(this.observers[e].entries()).forEach((a) => {
        let [o, l] = a
        for (let f = 0; f < l; f++) o(...s)
      }),
      this.observers['*'] &&
        Array.from(this.observers['*'].entries()).forEach((a) => {
          let [o, l] = a
          for (let f = 0; f < l; f++) o.apply(o, [e, ...s])
        }))
  }
}
class ie extends W {
  constructor(e) {
    let t =
      arguments.length > 1 && arguments[1] !== void 0
        ? arguments[1]
        : { ns: ['translation'], defaultNS: 'translation' }
    ;(super(),
      (this.data = e || {}),
      (this.options = t),
      this.options.keySeparator === void 0 && (this.options.keySeparator = '.'),
      this.options.ignoreJSONStructure === void 0 && (this.options.ignoreJSONStructure = !0))
  }
  addNamespaces(e) {
    this.options.ns.indexOf(e) < 0 && this.options.ns.push(e)
  }
  removeNamespaces(e) {
    const t = this.options.ns.indexOf(e)
    t > -1 && this.options.ns.splice(t, 1)
  }
  getResource(e, t, s) {
    let n = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {}
    const r = n.keySeparator !== void 0 ? n.keySeparator : this.options.keySeparator,
      a =
        n.ignoreJSONStructure !== void 0 ? n.ignoreJSONStructure : this.options.ignoreJSONStructure
    let o
    e.indexOf('.') > -1
      ? (o = e.split('.'))
      : ((o = [e, t]),
        s && (Array.isArray(s) ? o.push(...s) : d(s) && r ? o.push(...s.split(r)) : o.push(s)))
    const l = z(this.data, o)
    return (
      !l && !t && !s && e.indexOf('.') > -1 && ((e = o[0]), (t = o[1]), (s = o.slice(2).join('.'))),
      l || !a || !d(s) ? l : Z(this.data && this.data[e] && this.data[e][t], s, r)
    )
  }
  addResource(e, t, s, n) {
    let r = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : { silent: !1 }
    const a = r.keySeparator !== void 0 ? r.keySeparator : this.options.keySeparator
    let o = [e, t]
    ;(s && (o = o.concat(a ? s.split(a) : s)),
      e.indexOf('.') > -1 && ((o = e.split('.')), (n = t), (t = o[1])),
      this.addNamespaces(t),
      ne(this.data, o, n),
      r.silent || this.emit('added', e, t, s, n))
  }
  addResources(e, t, s) {
    let n = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : { silent: !1 }
    for (const r in s)
      (d(s[r]) || Array.isArray(s[r])) && this.addResource(e, t, r, s[r], { silent: !0 })
    n.silent || this.emit('added', e, t, s)
  }
  addResourceBundle(e, t, s, n, r) {
    let a =
        arguments.length > 5 && arguments[5] !== void 0
          ? arguments[5]
          : { silent: !1, skipCopy: !1 },
      o = [e, t]
    ;(e.indexOf('.') > -1 && ((o = e.split('.')), (n = s), (s = t), (t = o[1])),
      this.addNamespaces(t))
    let l = z(this.data, o) || {}
    ;(a.skipCopy || (s = JSON.parse(JSON.stringify(s))),
      n ? pe(l, s, r) : (l = { ...l, ...s }),
      ne(this.data, o, l),
      a.silent || this.emit('added', e, t, s))
  }
  removeResourceBundle(e, t) {
    ;(this.hasResourceBundle(e, t) && delete this.data[e][t],
      this.removeNamespaces(t),
      this.emit('removed', e, t))
  }
  hasResourceBundle(e, t) {
    return this.getResource(e, t) !== void 0
  }
  getResourceBundle(e, t) {
    return (
      t || (t = this.options.defaultNS),
      this.options.compatibilityAPI === 'v1'
        ? { ...this.getResource(e, t) }
        : this.getResource(e, t)
    )
  }
  getDataByLanguage(e) {
    return this.data[e]
  }
  hasLanguageSomeTranslations(e) {
    const t = this.getDataByLanguage(e)
    return !!((t && Object.keys(t)) || []).find((n) => t[n] && Object.keys(t[n]).length > 0)
  }
  toJSON() {
    return this.data
  }
}
var me = {
  processors: {},
  addPostProcessor(i) {
    this.processors[i.name] = i
  },
  handle(i, e, t, s, n) {
    return (
      i.forEach((r) => {
        this.processors[r] && (e = this.processors[r].process(e, t, s, n))
      }),
      e
    )
  },
}
const re = {}
class Q extends W {
  constructor(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}
    ;(super(),
      we(
        [
          'resourceStore',
          'languageUtils',
          'pluralResolver',
          'interpolator',
          'backendConnector',
          'i18nFormat',
          'utils',
        ],
        e,
        this,
      ),
      (this.options = t),
      this.options.keySeparator === void 0 && (this.options.keySeparator = '.'),
      (this.logger = C.create('translator')))
  }
  changeLanguage(e) {
    e && (this.language = e)
  }
  exists(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : { interpolation: {} }
    if (e == null) return !1
    const s = this.resolve(e, t)
    return s && s.res !== void 0
  }
  extractFromKey(e, t) {
    let s = t.nsSeparator !== void 0 ? t.nsSeparator : this.options.nsSeparator
    s === void 0 && (s = ':')
    const n = t.keySeparator !== void 0 ? t.keySeparator : this.options.keySeparator
    let r = t.ns || this.options.defaultNS || []
    const a = s && e.indexOf(s) > -1,
      o =
        !this.options.userDefinedKeySeparator &&
        !t.keySeparator &&
        !this.options.userDefinedNsSeparator &&
        !t.nsSeparator &&
        !$e(e, s, n)
    if (a && !o) {
      const l = e.match(this.interpolator.nestingRegexp)
      if (l && l.length > 0) return { key: e, namespaces: d(r) ? [r] : r }
      const f = e.split(s)
      ;((s !== n || (s === n && this.options.ns.indexOf(f[0]) > -1)) && (r = f.shift()),
        (e = f.join(n)))
    }
    return { key: e, namespaces: d(r) ? [r] : r }
  }
  translate(e, t, s) {
    if (
      (typeof t != 'object' &&
        this.options.overloadTranslationOptionHandler &&
        (t = this.options.overloadTranslationOptionHandler(arguments)),
      typeof t == 'object' && (t = { ...t }),
      t || (t = {}),
      e == null)
    )
      return ''
    Array.isArray(e) || (e = [String(e)])
    const n = t.returnDetails !== void 0 ? t.returnDetails : this.options.returnDetails,
      r = t.keySeparator !== void 0 ? t.keySeparator : this.options.keySeparator,
      { key: a, namespaces: o } = this.extractFromKey(e[e.length - 1], t),
      l = o[o.length - 1],
      f = t.lng || this.language,
      h = t.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode
    if (f && f.toLowerCase() === 'cimode') {
      if (h) {
        const b = t.nsSeparator || this.options.nsSeparator
        return n
          ? {
              res: `${l}${b}${a}`,
              usedKey: a,
              exactUsedKey: a,
              usedLng: f,
              usedNS: l,
              usedParams: this.getUsedParamsDetails(t),
            }
          : `${l}${b}${a}`
      }
      return n
        ? {
            res: a,
            usedKey: a,
            exactUsedKey: a,
            usedLng: f,
            usedNS: l,
            usedParams: this.getUsedParamsDetails(t),
          }
        : a
    }
    const c = this.resolve(e, t)
    let u = c && c.res
    const g = (c && c.usedKey) || a,
      p = (c && c.exactUsedKey) || a,
      x = Object.prototype.toString.apply(u),
      m = ['[object Number]', '[object Function]', '[object RegExp]'],
      v = t.joinArrays !== void 0 ? t.joinArrays : this.options.joinArrays,
      y = !this.i18nFormat || this.i18nFormat.handleAsObject,
      E = !d(u) && typeof u != 'boolean' && typeof u != 'number'
    if (y && u && E && m.indexOf(x) < 0 && !(d(v) && Array.isArray(u))) {
      if (!t.returnObjects && !this.options.returnObjects) {
        this.options.returnedObjectHandler ||
          this.logger.warn('accessing an object - but returnObjects options is not enabled!')
        const b = this.options.returnedObjectHandler
          ? this.options.returnedObjectHandler(g, u, { ...t, ns: o })
          : `key '${a} (${this.language})' returned an object instead of string.`
        return n ? ((c.res = b), (c.usedParams = this.getUsedParamsDetails(t)), c) : b
      }
      if (r) {
        const b = Array.isArray(u),
          L = b ? [] : {},
          k = b ? p : g
        for (const S in u)
          if (Object.prototype.hasOwnProperty.call(u, S)) {
            const K = `${k}${r}${S}`
            ;((L[S] = this.translate(K, { ...t, joinArrays: !1, ns: o })),
              L[S] === K && (L[S] = u[S]))
          }
        u = L
      }
    } else if (y && d(v) && Array.isArray(u))
      ((u = u.join(v)), u && (u = this.extendTranslation(u, e, t, s)))
    else {
      let b = !1,
        L = !1
      const k = t.count !== void 0 && !d(t.count),
        S = Q.hasDefaultValue(t),
        K = k ? this.pluralResolver.getSuffix(f, t.count, t) : '',
        ye = t.ordinal && k ? this.pluralResolver.getSuffix(f, t.count, { ordinal: !1 }) : '',
        G = k && !t.ordinal && t.count === 0 && this.pluralResolver.shouldUseIntlApi(),
        F =
          (G && t[`defaultValue${this.options.pluralSeparator}zero`]) ||
          t[`defaultValue${K}`] ||
          t[`defaultValue${ye}`] ||
          t.defaultValue
      ;(!this.isValidLookup(u) && S && ((b = !0), (u = F)),
        this.isValidLookup(u) || ((L = !0), (u = a)))
      const Se =
          (t.missingKeyNoValueFallbackToKey || this.options.missingKeyNoValueFallbackToKey) && L
            ? void 0
            : u,
        A = S && F !== u && this.options.updateMissing
      if (L || b || A) {
        if ((this.logger.log(A ? 'updateKey' : 'missingKey', f, l, a, A ? F : u), r)) {
          const O = this.resolve(a, { ...t, keySeparator: !1 })
          O &&
            O.res &&
            this.logger.warn(
              'Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.',
            )
        }
        let D = []
        const M = this.languageUtils.getFallbackCodes(
          this.options.fallbackLng,
          t.lng || this.language,
        )
        if (this.options.saveMissingTo === 'fallback' && M && M[0])
          for (let O = 0; O < M.length; O++) D.push(M[O])
        else
          this.options.saveMissingTo === 'all'
            ? (D = this.languageUtils.toResolveHierarchy(t.lng || this.language))
            : D.push(t.lng || this.language)
        const X = (O, N, j) => {
          const _ = S && j !== u ? j : Se
          ;(this.options.missingKeyHandler
            ? this.options.missingKeyHandler(O, l, N, _, A, t)
            : this.backendConnector &&
              this.backendConnector.saveMissing &&
              this.backendConnector.saveMissing(O, l, N, _, A, t),
            this.emit('missingKey', O, l, N, u))
        }
        this.options.saveMissing &&
          (this.options.saveMissingPlurals && k
            ? D.forEach((O) => {
                const N = this.pluralResolver.getSuffixes(O, t)
                ;(G &&
                  t[`defaultValue${this.options.pluralSeparator}zero`] &&
                  N.indexOf(`${this.options.pluralSeparator}zero`) < 0 &&
                  N.push(`${this.options.pluralSeparator}zero`),
                  N.forEach((j) => {
                    X([O], a + j, t[`defaultValue${j}`] || F)
                  }))
              })
            : X(D, a, F))
      }
      ;((u = this.extendTranslation(u, e, t, c, s)),
        L && u === a && this.options.appendNamespaceToMissingKey && (u = `${l}:${a}`),
        (L || b) &&
          this.options.parseMissingKeyHandler &&
          (this.options.compatibilityAPI !== 'v1'
            ? (u = this.options.parseMissingKeyHandler(
                this.options.appendNamespaceToMissingKey ? `${l}:${a}` : a,
                b ? u : void 0,
              ))
            : (u = this.options.parseMissingKeyHandler(u))))
    }
    return n ? ((c.res = u), (c.usedParams = this.getUsedParamsDetails(t)), c) : u
  }
  extendTranslation(e, t, s, n, r) {
    var a = this
    if (this.i18nFormat && this.i18nFormat.parse)
      e = this.i18nFormat.parse(
        e,
        { ...this.options.interpolation.defaultVariables, ...s },
        s.lng || this.language || n.usedLng,
        n.usedNS,
        n.usedKey,
        { resolved: n },
      )
    else if (!s.skipInterpolation) {
      s.interpolation &&
        this.interpolator.init({
          ...s,
          interpolation: { ...this.options.interpolation, ...s.interpolation },
        })
      const f =
        d(e) &&
        (s && s.interpolation && s.interpolation.skipOnVariables !== void 0
          ? s.interpolation.skipOnVariables
          : this.options.interpolation.skipOnVariables)
      let h
      if (f) {
        const u = e.match(this.interpolator.nestingRegexp)
        h = u && u.length
      }
      let c = s.replace && !d(s.replace) ? s.replace : s
      if (
        (this.options.interpolation.defaultVariables &&
          (c = { ...this.options.interpolation.defaultVariables, ...c }),
        (e = this.interpolator.interpolate(e, c, s.lng || this.language || n.usedLng, s)),
        f)
      ) {
        const u = e.match(this.interpolator.nestingRegexp),
          g = u && u.length
        h < g && (s.nest = !1)
      }
      ;(!s.lng &&
        this.options.compatibilityAPI !== 'v1' &&
        n &&
        n.res &&
        (s.lng = this.language || n.usedLng),
        s.nest !== !1 &&
          (e = this.interpolator.nest(
            e,
            function () {
              for (var u = arguments.length, g = new Array(u), p = 0; p < u; p++)
                g[p] = arguments[p]
              return r && r[0] === g[0] && !s.context
                ? (a.logger.warn(
                    `It seems you are nesting recursively key: ${g[0]} in key: ${t[0]}`,
                  ),
                  null)
                : a.translate(...g, t)
            },
            s,
          )),
        s.interpolation && this.interpolator.reset())
    }
    const o = s.postProcess || this.options.postProcess,
      l = d(o) ? [o] : o
    return (
      e != null &&
        l &&
        l.length &&
        s.applyPostProcessor !== !1 &&
        (e = me.handle(
          l,
          e,
          t,
          this.options && this.options.postProcessPassResolved
            ? { i18nResolved: { ...n, usedParams: this.getUsedParamsDetails(s) }, ...s }
            : s,
          this,
        )),
      e
    )
  }
  resolve(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
      s,
      n,
      r,
      a,
      o
    return (
      d(e) && (e = [e]),
      e.forEach((l) => {
        if (this.isValidLookup(s)) return
        const f = this.extractFromKey(l, t),
          h = f.key
        n = h
        let c = f.namespaces
        this.options.fallbackNS && (c = c.concat(this.options.fallbackNS))
        const u = t.count !== void 0 && !d(t.count),
          g = u && !t.ordinal && t.count === 0 && this.pluralResolver.shouldUseIntlApi(),
          p =
            t.context !== void 0 &&
            (d(t.context) || typeof t.context == 'number') &&
            t.context !== '',
          x = t.lngs
            ? t.lngs
            : this.languageUtils.toResolveHierarchy(t.lng || this.language, t.fallbackLng)
        c.forEach((m) => {
          this.isValidLookup(s) ||
            ((o = m),
            !re[`${x[0]}-${m}`] &&
              this.utils &&
              this.utils.hasLoadedNamespace &&
              !this.utils.hasLoadedNamespace(o) &&
              ((re[`${x[0]}-${m}`] = !0),
              this.logger.warn(
                `key "${n}" for languages "${x.join(', ')}" won't get resolved as namespace "${o}" was not yet loaded`,
                'This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!',
              )),
            x.forEach((v) => {
              if (this.isValidLookup(s)) return
              a = v
              const y = [h]
              if (this.i18nFormat && this.i18nFormat.addLookupKeys)
                this.i18nFormat.addLookupKeys(y, h, v, m, t)
              else {
                let b
                u && (b = this.pluralResolver.getSuffix(v, t.count, t))
                const L = `${this.options.pluralSeparator}zero`,
                  k = `${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`
                if (
                  (u &&
                    (y.push(h + b),
                    t.ordinal &&
                      b.indexOf(k) === 0 &&
                      y.push(h + b.replace(k, this.options.pluralSeparator)),
                    g && y.push(h + L)),
                  p)
                ) {
                  const S = `${h}${this.options.contextSeparator}${t.context}`
                  ;(y.push(S),
                    u &&
                      (y.push(S + b),
                      t.ordinal &&
                        b.indexOf(k) === 0 &&
                        y.push(S + b.replace(k, this.options.pluralSeparator)),
                      g && y.push(S + L)))
                }
              }
              let E
              for (; (E = y.pop()); )
                this.isValidLookup(s) || ((r = E), (s = this.getResource(v, m, E, t)))
            }))
        })
      }),
      { res: s, usedKey: n, exactUsedKey: r, usedLng: a, usedNS: o }
    )
  }
  isValidLookup(e) {
    return (
      e !== void 0 &&
      !(!this.options.returnNull && e === null) &&
      !(!this.options.returnEmptyString && e === '')
    )
  }
  getResource(e, t, s) {
    let n = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {}
    return this.i18nFormat && this.i18nFormat.getResource
      ? this.i18nFormat.getResource(e, t, s, n)
      : this.resourceStore.getResource(e, t, s, n)
  }
  getUsedParamsDetails() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}
    const t = [
        'defaultValue',
        'ordinal',
        'context',
        'replace',
        'lng',
        'lngs',
        'fallbackLng',
        'ns',
        'keySeparator',
        'nsSeparator',
        'returnObjects',
        'returnDetails',
        'joinArrays',
        'postProcess',
        'interpolation',
      ],
      s = e.replace && !d(e.replace)
    let n = s ? e.replace : e
    if (
      (s && typeof e.count < 'u' && (n.count = e.count),
      this.options.interpolation.defaultVariables &&
        (n = { ...this.options.interpolation.defaultVariables, ...n }),
      !s)
    ) {
      n = { ...n }
      for (const r of t) delete n[r]
    }
    return n
  }
  static hasDefaultValue(e) {
    const t = 'defaultValue'
    for (const s in e)
      if (
        Object.prototype.hasOwnProperty.call(e, s) &&
        t === s.substring(0, t.length) &&
        e[s] !== void 0
      )
        return !0
    return !1
  }
}
const Y = (i) => i.charAt(0).toUpperCase() + i.slice(1)
class ae {
  constructor(e) {
    ;((this.options = e),
      (this.supportedLngs = this.options.supportedLngs || !1),
      (this.logger = C.create('languageUtils')))
  }
  getScriptPartFromCode(e) {
    if (((e = J(e)), !e || e.indexOf('-') < 0)) return null
    const t = e.split('-')
    return t.length === 2 || (t.pop(), t[t.length - 1].toLowerCase() === 'x')
      ? null
      : this.formatLanguageCode(t.join('-'))
  }
  getLanguagePartFromCode(e) {
    if (((e = J(e)), !e || e.indexOf('-') < 0)) return e
    const t = e.split('-')
    return this.formatLanguageCode(t[0])
  }
  formatLanguageCode(e) {
    if (d(e) && e.indexOf('-') > -1) {
      if (typeof Intl < 'u' && typeof Intl.getCanonicalLocales < 'u')
        try {
          let n = Intl.getCanonicalLocales(e)[0]
          if ((n && this.options.lowerCaseLng && (n = n.toLowerCase()), n)) return n
        } catch {}
      const t = ['hans', 'hant', 'latn', 'cyrl', 'cans', 'mong', 'arab']
      let s = e.split('-')
      return (
        this.options.lowerCaseLng
          ? (s = s.map((n) => n.toLowerCase()))
          : s.length === 2
            ? ((s[0] = s[0].toLowerCase()),
              (s[1] = s[1].toUpperCase()),
              t.indexOf(s[1].toLowerCase()) > -1 && (s[1] = Y(s[1].toLowerCase())))
            : s.length === 3 &&
              ((s[0] = s[0].toLowerCase()),
              s[1].length === 2 && (s[1] = s[1].toUpperCase()),
              s[0] !== 'sgn' && s[2].length === 2 && (s[2] = s[2].toUpperCase()),
              t.indexOf(s[1].toLowerCase()) > -1 && (s[1] = Y(s[1].toLowerCase())),
              t.indexOf(s[2].toLowerCase()) > -1 && (s[2] = Y(s[2].toLowerCase()))),
        s.join('-')
      )
    }
    return this.options.cleanCode || this.options.lowerCaseLng ? e.toLowerCase() : e
  }
  isSupportedCode(e) {
    return (
      (this.options.load === 'languageOnly' || this.options.nonExplicitSupportedLngs) &&
        (e = this.getLanguagePartFromCode(e)),
      !this.supportedLngs || !this.supportedLngs.length || this.supportedLngs.indexOf(e) > -1
    )
  }
  getBestMatchFromCodes(e) {
    if (!e) return null
    let t
    return (
      e.forEach((s) => {
        if (t) return
        const n = this.formatLanguageCode(s)
        ;(!this.options.supportedLngs || this.isSupportedCode(n)) && (t = n)
      }),
      !t &&
        this.options.supportedLngs &&
        e.forEach((s) => {
          if (t) return
          const n = this.getLanguagePartFromCode(s)
          if (this.isSupportedCode(n)) return (t = n)
          t = this.options.supportedLngs.find((r) => {
            if (r === n) return r
            if (
              !(r.indexOf('-') < 0 && n.indexOf('-') < 0) &&
              ((r.indexOf('-') > 0 && n.indexOf('-') < 0 && r.substring(0, r.indexOf('-')) === n) ||
                (r.indexOf(n) === 0 && n.length > 1))
            )
              return r
          })
        }),
      t || (t = this.getFallbackCodes(this.options.fallbackLng)[0]),
      t
    )
  }
  getFallbackCodes(e, t) {
    if (!e) return []
    if ((typeof e == 'function' && (e = e(t)), d(e) && (e = [e]), Array.isArray(e))) return e
    if (!t) return e.default || []
    let s = e[t]
    return (
      s || (s = e[this.getScriptPartFromCode(t)]),
      s || (s = e[this.formatLanguageCode(t)]),
      s || (s = e[this.getLanguagePartFromCode(t)]),
      s || (s = e.default),
      s || []
    )
  }
  toResolveHierarchy(e, t) {
    const s = this.getFallbackCodes(t || this.options.fallbackLng || [], e),
      n = [],
      r = (a) => {
        a &&
          (this.isSupportedCode(a)
            ? n.push(a)
            : this.logger.warn(`rejecting language code not found in supportedLngs: ${a}`))
      }
    return (
      d(e) && (e.indexOf('-') > -1 || e.indexOf('_') > -1)
        ? (this.options.load !== 'languageOnly' && r(this.formatLanguageCode(e)),
          this.options.load !== 'languageOnly' &&
            this.options.load !== 'currentOnly' &&
            r(this.getScriptPartFromCode(e)),
          this.options.load !== 'currentOnly' && r(this.getLanguagePartFromCode(e)))
        : d(e) && r(this.formatLanguageCode(e)),
      s.forEach((a) => {
        n.indexOf(a) < 0 && r(this.formatLanguageCode(a))
      }),
      n
    )
  }
}
let Ee = [
    {
      lngs: [
        'ach',
        'ak',
        'am',
        'arn',
        'br',
        'fil',
        'gun',
        'ln',
        'mfe',
        'mg',
        'mi',
        'oc',
        'pt',
        'pt-BR',
        'tg',
        'tl',
        'ti',
        'tr',
        'uz',
        'wa',
      ],
      nr: [1, 2],
      fc: 1,
    },
    {
      lngs: [
        'af',
        'an',
        'ast',
        'az',
        'bg',
        'bn',
        'ca',
        'da',
        'de',
        'dev',
        'el',
        'en',
        'eo',
        'es',
        'et',
        'eu',
        'fi',
        'fo',
        'fur',
        'fy',
        'gl',
        'gu',
        'ha',
        'hi',
        'hu',
        'hy',
        'ia',
        'it',
        'kk',
        'kn',
        'ku',
        'lb',
        'mai',
        'ml',
        'mn',
        'mr',
        'nah',
        'nap',
        'nb',
        'ne',
        'nl',
        'nn',
        'no',
        'nso',
        'pa',
        'pap',
        'pms',
        'ps',
        'pt-PT',
        'rm',
        'sco',
        'se',
        'si',
        'so',
        'son',
        'sq',
        'sv',
        'sw',
        'ta',
        'te',
        'tk',
        'ur',
        'yo',
      ],
      nr: [1, 2],
      fc: 2,
    },
    {
      lngs: [
        'ay',
        'bo',
        'cgg',
        'fa',
        'ht',
        'id',
        'ja',
        'jbo',
        'ka',
        'km',
        'ko',
        'ky',
        'lo',
        'ms',
        'sah',
        'su',
        'th',
        'tt',
        'ug',
        'vi',
        'wo',
        'zh',
      ],
      nr: [1],
      fc: 3,
    },
    { lngs: ['be', 'bs', 'cnr', 'dz', 'hr', 'ru', 'sr', 'uk'], nr: [1, 2, 5], fc: 4 },
    { lngs: ['ar'], nr: [0, 1, 2, 3, 11, 100], fc: 5 },
    { lngs: ['cs', 'sk'], nr: [1, 2, 5], fc: 6 },
    { lngs: ['csb', 'pl'], nr: [1, 2, 5], fc: 7 },
    { lngs: ['cy'], nr: [1, 2, 3, 8], fc: 8 },
    { lngs: ['fr'], nr: [1, 2], fc: 9 },
    { lngs: ['ga'], nr: [1, 2, 3, 7, 11], fc: 10 },
    { lngs: ['gd'], nr: [1, 2, 3, 20], fc: 11 },
    { lngs: ['is'], nr: [1, 2], fc: 12 },
    { lngs: ['jv'], nr: [0, 1], fc: 13 },
    { lngs: ['kw'], nr: [1, 2, 3, 4], fc: 14 },
    { lngs: ['lt'], nr: [1, 2, 10], fc: 15 },
    { lngs: ['lv'], nr: [1, 2, 0], fc: 16 },
    { lngs: ['mk'], nr: [1, 2], fc: 17 },
    { lngs: ['mnk'], nr: [0, 1, 2], fc: 18 },
    { lngs: ['mt'], nr: [1, 2, 11, 20], fc: 19 },
    { lngs: ['or'], nr: [2, 1], fc: 2 },
    { lngs: ['ro'], nr: [1, 2, 20], fc: 20 },
    { lngs: ['sl'], nr: [5, 1, 2, 3], fc: 21 },
    { lngs: ['he', 'iw'], nr: [1, 2, 20, 21], fc: 22 },
  ],
  Fe = {
    1: (i) => +(i > 1),
    2: (i) => +(i != 1),
    3: (i) => 0,
    4: (i) =>
      i % 10 == 1 && i % 100 != 11
        ? 0
        : i % 10 >= 2 && i % 10 <= 4 && (i % 100 < 10 || i % 100 >= 20)
          ? 1
          : 2,
    5: (i) =>
      i == 0
        ? 0
        : i == 1
          ? 1
          : i == 2
            ? 2
            : i % 100 >= 3 && i % 100 <= 10
              ? 3
              : i % 100 >= 11
                ? 4
                : 5,
    6: (i) => (i == 1 ? 0 : i >= 2 && i <= 4 ? 1 : 2),
    7: (i) => (i == 1 ? 0 : i % 10 >= 2 && i % 10 <= 4 && (i % 100 < 10 || i % 100 >= 20) ? 1 : 2),
    8: (i) => (i == 1 ? 0 : i == 2 ? 1 : i != 8 && i != 11 ? 2 : 3),
    9: (i) => +(i >= 2),
    10: (i) => (i == 1 ? 0 : i == 2 ? 1 : i < 7 ? 2 : i < 11 ? 3 : 4),
    11: (i) => (i == 1 || i == 11 ? 0 : i == 2 || i == 12 ? 1 : i > 2 && i < 20 ? 2 : 3),
    12: (i) => +(i % 10 != 1 || i % 100 == 11),
    13: (i) => +(i !== 0),
    14: (i) => (i == 1 ? 0 : i == 2 ? 1 : i == 3 ? 2 : 3),
    15: (i) =>
      i % 10 == 1 && i % 100 != 11 ? 0 : i % 10 >= 2 && (i % 100 < 10 || i % 100 >= 20) ? 1 : 2,
    16: (i) => (i % 10 == 1 && i % 100 != 11 ? 0 : i !== 0 ? 1 : 2),
    17: (i) => (i == 1 || (i % 10 == 1 && i % 100 != 11) ? 0 : 1),
    18: (i) => (i == 0 ? 0 : i == 1 ? 1 : 2),
    19: (i) =>
      i == 1
        ? 0
        : i == 0 || (i % 100 > 1 && i % 100 < 11)
          ? 1
          : i % 100 > 10 && i % 100 < 20
            ? 2
            : 3,
    20: (i) => (i == 1 ? 0 : i == 0 || (i % 100 > 0 && i % 100 < 20) ? 1 : 2),
    21: (i) => (i % 100 == 1 ? 1 : i % 100 == 2 ? 2 : i % 100 == 3 || i % 100 == 4 ? 3 : 0),
    22: (i) => (i == 1 ? 0 : i == 2 ? 1 : (i < 0 || i > 10) && i % 10 == 0 ? 2 : 3),
  }
const Ae = ['v1', 'v2', 'v3'],
  De = ['v4'],
  oe = { zero: 0, one: 1, two: 2, few: 3, many: 4, other: 5 },
  je = () => {
    const i = {}
    return (
      Ee.forEach((e) => {
        e.lngs.forEach((t) => {
          i[t] = { numbers: e.nr, plurals: Fe[e.fc] }
        })
      }),
      i
    )
  }
class Te {
  constructor(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}
    ;((this.languageUtils = e),
      (this.options = t),
      (this.logger = C.create('pluralResolver')),
      (!this.options.compatibilityJSON || De.includes(this.options.compatibilityJSON)) &&
        (typeof Intl > 'u' || !Intl.PluralRules) &&
        ((this.options.compatibilityJSON = 'v3'),
        this.logger.error(
          'Your environment seems not to be Intl API compatible, use an Intl.PluralRules polyfill. Will fallback to the compatibilityJSON v3 format handling.',
        )),
      (this.rules = je()),
      (this.pluralRulesCache = {}))
  }
  addRule(e, t) {
    this.rules[e] = t
  }
  clearCache() {
    this.pluralRulesCache = {}
  }
  getRule(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}
    if (this.shouldUseIntlApi()) {
      const s = J(e === 'dev' ? 'en' : e),
        n = t.ordinal ? 'ordinal' : 'cardinal',
        r = JSON.stringify({ cleanedCode: s, type: n })
      if (r in this.pluralRulesCache) return this.pluralRulesCache[r]
      let a
      try {
        a = new Intl.PluralRules(s, { type: n })
      } catch {
        if (!e.match(/-|_/)) return
        const l = this.languageUtils.getLanguagePartFromCode(e)
        a = this.getRule(l, t)
      }
      return ((this.pluralRulesCache[r] = a), a)
    }
    return this.rules[e] || this.rules[this.languageUtils.getLanguagePartFromCode(e)]
  }
  needsPlural(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}
    const s = this.getRule(e, t)
    return this.shouldUseIntlApi()
      ? s && s.resolvedOptions().pluralCategories.length > 1
      : s && s.numbers.length > 1
  }
  getPluralFormsOfKey(e, t) {
    let s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}
    return this.getSuffixes(e, s).map((n) => `${t}${n}`)
  }
  getSuffixes(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}
    const s = this.getRule(e, t)
    return s
      ? this.shouldUseIntlApi()
        ? s
            .resolvedOptions()
            .pluralCategories.sort((n, r) => oe[n] - oe[r])
            .map(
              (n) =>
                `${this.options.prepend}${t.ordinal ? `ordinal${this.options.prepend}` : ''}${n}`,
            )
        : s.numbers.map((n) => this.getSuffix(e, n, t))
      : []
  }
  getSuffix(e, t) {
    let s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}
    const n = this.getRule(e, s)
    return n
      ? this.shouldUseIntlApi()
        ? `${this.options.prepend}${s.ordinal ? `ordinal${this.options.prepend}` : ''}${n.select(t)}`
        : this.getSuffixRetroCompatible(n, t)
      : (this.logger.warn(`no plural rule found for: ${e}`), '')
  }
  getSuffixRetroCompatible(e, t) {
    const s = e.noAbs ? e.plurals(t) : e.plurals(Math.abs(t))
    let n = e.numbers[s]
    this.options.simplifyPluralSuffix &&
      e.numbers.length === 2 &&
      e.numbers[0] === 1 &&
      (n === 2 ? (n = 'plural') : n === 1 && (n = ''))
    const r = () =>
      this.options.prepend && n.toString() ? this.options.prepend + n.toString() : n.toString()
    return this.options.compatibilityJSON === 'v1'
      ? n === 1
        ? ''
        : typeof n == 'number'
          ? `_plural_${n.toString()}`
          : r()
      : this.options.compatibilityJSON === 'v2' ||
          (this.options.simplifyPluralSuffix && e.numbers.length === 2 && e.numbers[0] === 1)
        ? r()
        : this.options.prepend && s.toString()
          ? this.options.prepend + s.toString()
          : s.toString()
  }
  shouldUseIntlApi() {
    return !Ae.includes(this.options.compatibilityJSON)
  }
}
const le = function (i, e, t) {
    let s = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : '.',
      n = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : !0,
      r = Oe(i, e, t)
    return (!r && n && d(t) && ((r = Z(i, t, s)), r === void 0 && (r = Z(e, t, s))), r)
  },
  q = (i) => i.replace(/\$/g, '$$$$')
class Ue {
  constructor() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}
    ;((this.logger = C.create('interpolator')),
      (this.options = e),
      (this.format = (e.interpolation && e.interpolation.format) || ((t) => t)),
      this.init(e))
  }
  init() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}
    e.interpolation || (e.interpolation = { escapeValue: !0 })
    const {
      escape: t,
      escapeValue: s,
      useRawValueToEscape: n,
      prefix: r,
      prefixEscaped: a,
      suffix: o,
      suffixEscaped: l,
      formatSeparator: f,
      unescapeSuffix: h,
      unescapePrefix: c,
      nestingPrefix: u,
      nestingPrefixEscaped: g,
      nestingSuffix: p,
      nestingSuffixEscaped: x,
      nestingOptionsSeparator: m,
      maxReplaces: v,
      alwaysFormat: y,
    } = e.interpolation
    ;((this.escape = t !== void 0 ? t : Ce),
      (this.escapeValue = s !== void 0 ? s : !0),
      (this.useRawValueToEscape = n !== void 0 ? n : !1),
      (this.prefix = r ? P(r) : a || '{{'),
      (this.suffix = o ? P(o) : l || '}}'),
      (this.formatSeparator = f || ','),
      (this.unescapePrefix = h ? '' : c || '-'),
      (this.unescapeSuffix = this.unescapePrefix ? '' : h || ''),
      (this.nestingPrefix = u ? P(u) : g || P('$t(')),
      (this.nestingSuffix = p ? P(p) : x || P(')')),
      (this.nestingOptionsSeparator = m || ','),
      (this.maxReplaces = v || 1e3),
      (this.alwaysFormat = y !== void 0 ? y : !1),
      this.resetRegExp())
  }
  reset() {
    this.options && this.init(this.options)
  }
  resetRegExp() {
    const e = (t, s) => (t && t.source === s ? ((t.lastIndex = 0), t) : new RegExp(s, 'g'))
    ;((this.regexp = e(this.regexp, `${this.prefix}(.+?)${this.suffix}`)),
      (this.regexpUnescape = e(
        this.regexpUnescape,
        `${this.prefix}${this.unescapePrefix}(.+?)${this.unescapeSuffix}${this.suffix}`,
      )),
      (this.nestingRegexp = e(
        this.nestingRegexp,
        `${this.nestingPrefix}(.+?)${this.nestingSuffix}`,
      )))
  }
  interpolate(e, t, s, n) {
    let r, a, o
    const l =
        (this.options &&
          this.options.interpolation &&
          this.options.interpolation.defaultVariables) ||
        {},
      f = (g) => {
        if (g.indexOf(this.formatSeparator) < 0) {
          const v = le(t, l, g, this.options.keySeparator, this.options.ignoreJSONStructure)
          return this.alwaysFormat
            ? this.format(v, void 0, s, { ...n, ...t, interpolationkey: g })
            : v
        }
        const p = g.split(this.formatSeparator),
          x = p.shift().trim(),
          m = p.join(this.formatSeparator).trim()
        return this.format(
          le(t, l, x, this.options.keySeparator, this.options.ignoreJSONStructure),
          m,
          s,
          { ...n, ...t, interpolationkey: x },
        )
      }
    this.resetRegExp()
    const h = (n && n.missingInterpolationHandler) || this.options.missingInterpolationHandler,
      c =
        n && n.interpolation && n.interpolation.skipOnVariables !== void 0
          ? n.interpolation.skipOnVariables
          : this.options.interpolation.skipOnVariables
    return (
      [
        { regex: this.regexpUnescape, safeValue: (g) => q(g) },
        { regex: this.regexp, safeValue: (g) => (this.escapeValue ? q(this.escape(g)) : q(g)) },
      ].forEach((g) => {
        for (o = 0; (r = g.regex.exec(e)); ) {
          const p = r[1].trim()
          if (((a = f(p)), a === void 0))
            if (typeof h == 'function') {
              const m = h(e, r, n)
              a = d(m) ? m : ''
            } else if (n && Object.prototype.hasOwnProperty.call(n, p)) a = ''
            else if (c) {
              a = r[0]
              continue
            } else
              (this.logger.warn(`missed to pass in variable ${p} for interpolating ${e}`), (a = ''))
          else !d(a) && !this.useRawValueToEscape && (a = ee(a))
          const x = g.safeValue(a)
          if (
            ((e = e.replace(r[0], x)),
            c
              ? ((g.regex.lastIndex += a.length), (g.regex.lastIndex -= r[0].length))
              : (g.regex.lastIndex = 0),
            o++,
            o >= this.maxReplaces)
          )
            break
        }
      }),
      e
    )
  }
  nest(e, t) {
    let s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {},
      n,
      r,
      a
    const o = (l, f) => {
      const h = this.nestingOptionsSeparator
      if (l.indexOf(h) < 0) return l
      const c = l.split(new RegExp(`${h}[ ]*{`))
      let u = `{${c[1]}`
      ;((l = c[0]), (u = this.interpolate(u, a)))
      const g = u.match(/'/g),
        p = u.match(/"/g)
      ;((g && g.length % 2 === 0 && !p) || p.length % 2 !== 0) && (u = u.replace(/'/g, '"'))
      try {
        ;((a = JSON.parse(u)), f && (a = { ...f, ...a }))
      } catch (x) {
        return (
          this.logger.warn(`failed parsing options string in nesting for key ${l}`, x),
          `${l}${h}${u}`
        )
      }
      return (
        a.defaultValue && a.defaultValue.indexOf(this.prefix) > -1 && delete a.defaultValue,
        l
      )
    }
    for (; (n = this.nestingRegexp.exec(e)); ) {
      let l = []
      ;((a = { ...s }),
        (a = a.replace && !d(a.replace) ? a.replace : a),
        (a.applyPostProcessor = !1),
        delete a.defaultValue)
      let f = !1
      if (n[0].indexOf(this.formatSeparator) !== -1 && !/{.*}/.test(n[1])) {
        const h = n[1].split(this.formatSeparator).map((c) => c.trim())
        ;((n[1] = h.shift()), (l = h), (f = !0))
      }
      if (((r = t(o.call(this, n[1].trim(), a), a)), r && n[0] === e && !d(r))) return r
      ;(d(r) || (r = ee(r)),
        r || (this.logger.warn(`missed to resolve ${n[1]} for nesting ${e}`), (r = '')),
        f &&
          (r = l.reduce(
            (h, c) => this.format(h, c, s.lng, { ...s, interpolationkey: n[1].trim() }),
            r.trim(),
          )),
        (e = e.replace(n[0], r)),
        (this.regexp.lastIndex = 0))
    }
    return e
  }
}
const Ve = (i) => {
    let e = i.toLowerCase().trim()
    const t = {}
    if (i.indexOf('(') > -1) {
      const s = i.split('(')
      e = s[0].toLowerCase().trim()
      const n = s[1].substring(0, s[1].length - 1)
      e === 'currency' && n.indexOf(':') < 0
        ? t.currency || (t.currency = n.trim())
        : e === 'relativetime' && n.indexOf(':') < 0
          ? t.range || (t.range = n.trim())
          : n.split(';').forEach((a) => {
              if (a) {
                const [o, ...l] = a.split(':'),
                  f = l
                    .join(':')
                    .trim()
                    .replace(/^'+|'+$/g, ''),
                  h = o.trim()
                ;(t[h] || (t[h] = f),
                  f === 'false' && (t[h] = !1),
                  f === 'true' && (t[h] = !0),
                  isNaN(f) || (t[h] = parseInt(f, 10)))
              }
            })
    }
    return { formatName: e, formatOptions: t }
  },
  R = (i) => {
    const e = {}
    return (t, s, n) => {
      let r = n
      n &&
        n.interpolationkey &&
        n.formatParams &&
        n.formatParams[n.interpolationkey] &&
        n[n.interpolationkey] &&
        (r = { ...r, [n.interpolationkey]: void 0 })
      const a = s + JSON.stringify(r)
      let o = e[a]
      return (o || ((o = i(J(s), n)), (e[a] = o)), o(t))
    }
  }
class Ke {
  constructor() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}
    ;((this.logger = C.create('formatter')),
      (this.options = e),
      (this.formats = {
        number: R((t, s) => {
          const n = new Intl.NumberFormat(t, { ...s })
          return (r) => n.format(r)
        }),
        currency: R((t, s) => {
          const n = new Intl.NumberFormat(t, { ...s, style: 'currency' })
          return (r) => n.format(r)
        }),
        datetime: R((t, s) => {
          const n = new Intl.DateTimeFormat(t, { ...s })
          return (r) => n.format(r)
        }),
        relativetime: R((t, s) => {
          const n = new Intl.RelativeTimeFormat(t, { ...s })
          return (r) => n.format(r, s.range || 'day')
        }),
        list: R((t, s) => {
          const n = new Intl.ListFormat(t, { ...s })
          return (r) => n.format(r)
        }),
      }),
      this.init(e))
  }
  init(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : { interpolation: {} }
    this.formatSeparator = t.interpolation.formatSeparator || ','
  }
  add(e, t) {
    this.formats[e.toLowerCase().trim()] = t
  }
  addCached(e, t) {
    this.formats[e.toLowerCase().trim()] = R(t)
  }
  format(e, t, s) {
    let n = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {}
    const r = t.split(this.formatSeparator)
    if (
      r.length > 1 &&
      r[0].indexOf('(') > 1 &&
      r[0].indexOf(')') < 0 &&
      r.find((o) => o.indexOf(')') > -1)
    ) {
      const o = r.findIndex((l) => l.indexOf(')') > -1)
      r[0] = [r[0], ...r.splice(1, o)].join(this.formatSeparator)
    }
    return r.reduce((o, l) => {
      const { formatName: f, formatOptions: h } = Ve(l)
      if (this.formats[f]) {
        let c = o
        try {
          const u = (n && n.formatParams && n.formatParams[n.interpolationkey]) || {},
            g = u.locale || u.lng || n.locale || n.lng || s
          c = this.formats[f](o, g, { ...h, ...n, ...u })
        } catch (u) {
          this.logger.warn(u)
        }
        return c
      } else this.logger.warn(`there was no format function for ${f}`)
      return o
    }, e)
  }
}
const Me = (i, e) => {
  i.pending[e] !== void 0 && (delete i.pending[e], i.pendingCount--)
}
class He extends W {
  constructor(e, t, s) {
    let n = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {}
    ;(super(),
      (this.backend = e),
      (this.store = t),
      (this.services = s),
      (this.languageUtils = s.languageUtils),
      (this.options = n),
      (this.logger = C.create('backendConnector')),
      (this.waitingReads = []),
      (this.maxParallelReads = n.maxParallelReads || 10),
      (this.readingCalls = 0),
      (this.maxRetries = n.maxRetries >= 0 ? n.maxRetries : 5),
      (this.retryTimeout = n.retryTimeout >= 1 ? n.retryTimeout : 350),
      (this.state = {}),
      (this.queue = []),
      this.backend && this.backend.init && this.backend.init(s, n.backend, n))
  }
  queueLoad(e, t, s, n) {
    const r = {},
      a = {},
      o = {},
      l = {}
    return (
      e.forEach((f) => {
        let h = !0
        ;(t.forEach((c) => {
          const u = `${f}|${c}`
          !s.reload && this.store.hasResourceBundle(f, c)
            ? (this.state[u] = 2)
            : this.state[u] < 0 ||
              (this.state[u] === 1
                ? a[u] === void 0 && (a[u] = !0)
                : ((this.state[u] = 1),
                  (h = !1),
                  a[u] === void 0 && (a[u] = !0),
                  r[u] === void 0 && (r[u] = !0),
                  l[c] === void 0 && (l[c] = !0)))
        }),
          h || (o[f] = !0))
      }),
      (Object.keys(r).length || Object.keys(a).length) &&
        this.queue.push({
          pending: a,
          pendingCount: Object.keys(a).length,
          loaded: {},
          errors: [],
          callback: n,
        }),
      {
        toLoad: Object.keys(r),
        pending: Object.keys(a),
        toLoadLanguages: Object.keys(o),
        toLoadNamespaces: Object.keys(l),
      }
    )
  }
  loaded(e, t, s) {
    const n = e.split('|'),
      r = n[0],
      a = n[1]
    ;(t && this.emit('failedLoading', r, a, t),
      !t && s && this.store.addResourceBundle(r, a, s, void 0, void 0, { skipCopy: !0 }),
      (this.state[e] = t ? -1 : 2),
      t && s && (this.state[e] = 0))
    const o = {}
    ;(this.queue.forEach((l) => {
      ;(Le(l.loaded, [r], a),
        Me(l, e),
        t && l.errors.push(t),
        l.pendingCount === 0 &&
          !l.done &&
          (Object.keys(l.loaded).forEach((f) => {
            o[f] || (o[f] = {})
            const h = l.loaded[f]
            h.length &&
              h.forEach((c) => {
                o[f][c] === void 0 && (o[f][c] = !0)
              })
          }),
          (l.done = !0),
          l.errors.length ? l.callback(l.errors) : l.callback()))
    }),
      this.emit('loaded', o),
      (this.queue = this.queue.filter((l) => !l.done)))
  }
  read(e, t, s) {
    let n = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0,
      r = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : this.retryTimeout,
      a = arguments.length > 5 ? arguments[5] : void 0
    if (!e.length) return a(null, {})
    if (this.readingCalls >= this.maxParallelReads) {
      this.waitingReads.push({ lng: e, ns: t, fcName: s, tried: n, wait: r, callback: a })
      return
    }
    this.readingCalls++
    const o = (f, h) => {
        if ((this.readingCalls--, this.waitingReads.length > 0)) {
          const c = this.waitingReads.shift()
          this.read(c.lng, c.ns, c.fcName, c.tried, c.wait, c.callback)
        }
        if (f && h && n < this.maxRetries) {
          setTimeout(() => {
            this.read.call(this, e, t, s, n + 1, r * 2, a)
          }, r)
          return
        }
        a(f, h)
      },
      l = this.backend[s].bind(this.backend)
    if (l.length === 2) {
      try {
        const f = l(e, t)
        f && typeof f.then == 'function' ? f.then((h) => o(null, h)).catch(o) : o(null, f)
      } catch (f) {
        o(f)
      }
      return
    }
    return l(e, t, o)
  }
  prepareLoading(e, t) {
    let s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {},
      n = arguments.length > 3 ? arguments[3] : void 0
    if (!this.backend)
      return (
        this.logger.warn('No backend was added via i18next.use. Will not load resources.'),
        n && n()
      )
    ;(d(e) && (e = this.languageUtils.toResolveHierarchy(e)), d(t) && (t = [t]))
    const r = this.queueLoad(e, t, s, n)
    if (!r.toLoad.length) return (r.pending.length || n(), null)
    r.toLoad.forEach((a) => {
      this.loadOne(a)
    })
  }
  load(e, t, s) {
    this.prepareLoading(e, t, {}, s)
  }
  reload(e, t, s) {
    this.prepareLoading(e, t, { reload: !0 }, s)
  }
  loadOne(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : ''
    const s = e.split('|'),
      n = s[0],
      r = s[1]
    this.read(n, r, 'read', void 0, void 0, (a, o) => {
      ;(a && this.logger.warn(`${t}loading namespace ${r} for language ${n} failed`, a),
        !a && o && this.logger.log(`${t}loaded namespace ${r} for language ${n}`, o),
        this.loaded(e, a, o))
    })
  }
  saveMissing(e, t, s, n, r) {
    let a = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : {},
      o = arguments.length > 6 && arguments[6] !== void 0 ? arguments[6] : () => {}
    if (
      this.services.utils &&
      this.services.utils.hasLoadedNamespace &&
      !this.services.utils.hasLoadedNamespace(t)
    ) {
      this.logger.warn(
        `did not save key "${s}" as the namespace "${t}" was not yet loaded`,
        'This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!',
      )
      return
    }
    if (!(s == null || s === '')) {
      if (this.backend && this.backend.create) {
        const l = { ...a, isUpdate: r },
          f = this.backend.create.bind(this.backend)
        if (f.length < 6)
          try {
            let h
            ;(f.length === 5 ? (h = f(e, t, s, n, l)) : (h = f(e, t, s, n)),
              h && typeof h.then == 'function' ? h.then((c) => o(null, c)).catch(o) : o(null, h))
          } catch (h) {
            o(h)
          }
        else f(e, t, s, n, o, l)
      }
      !e || !e[0] || this.store.addResource(e[0], t, s, n)
    }
  }
}
const ue = () => ({
    debug: !1,
    initImmediate: !0,
    ns: ['translation'],
    defaultNS: ['translation'],
    fallbackLng: ['dev'],
    fallbackNS: !1,
    supportedLngs: !1,
    nonExplicitSupportedLngs: !1,
    load: 'all',
    preload: !1,
    simplifyPluralSuffix: !0,
    keySeparator: '.',
    nsSeparator: ':',
    pluralSeparator: '_',
    contextSeparator: '_',
    partialBundledLanguages: !1,
    saveMissing: !1,
    updateMissing: !1,
    saveMissingTo: 'fallback',
    saveMissingPlurals: !0,
    missingKeyHandler: !1,
    missingInterpolationHandler: !1,
    postProcess: !1,
    postProcessPassResolved: !1,
    returnNull: !1,
    returnEmptyString: !0,
    returnObjects: !1,
    joinArrays: !1,
    returnedObjectHandler: !1,
    parseMissingKeyHandler: !1,
    appendNamespaceToMissingKey: !1,
    appendNamespaceToCIMode: !1,
    overloadTranslationOptionHandler: (i) => {
      let e = {}
      if (
        (typeof i[1] == 'object' && (e = i[1]),
        d(i[1]) && (e.defaultValue = i[1]),
        d(i[2]) && (e.tDescription = i[2]),
        typeof i[2] == 'object' || typeof i[3] == 'object')
      ) {
        const t = i[3] || i[2]
        Object.keys(t).forEach((s) => {
          e[s] = t[s]
        })
      }
      return e
    },
    interpolation: {
      escapeValue: !0,
      format: (i) => i,
      prefix: '{{',
      suffix: '}}',
      formatSeparator: ',',
      unescapePrefix: '-',
      nestingPrefix: '$t(',
      nestingSuffix: ')',
      nestingOptionsSeparator: ',',
      maxReplaces: 1e3,
      skipOnVariables: !0,
    },
  }),
  fe = (i) => (
    d(i.ns) && (i.ns = [i.ns]),
    d(i.fallbackLng) && (i.fallbackLng = [i.fallbackLng]),
    d(i.fallbackNS) && (i.fallbackNS = [i.fallbackNS]),
    i.supportedLngs &&
      i.supportedLngs.indexOf('cimode') < 0 &&
      (i.supportedLngs = i.supportedLngs.concat(['cimode'])),
    i
  ),
  H = () => {},
  ze = (i) => {
    Object.getOwnPropertyNames(Object.getPrototypeOf(i)).forEach((t) => {
      typeof i[t] == 'function' && (i[t] = i[t].bind(i))
    })
  }
class V extends W {
  constructor() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
      t = arguments.length > 1 ? arguments[1] : void 0
    if (
      (super(),
      (this.options = fe(e)),
      (this.services = {}),
      (this.logger = C),
      (this.modules = { external: [] }),
      ze(this),
      t && !this.isInitialized && !e.isClone)
    ) {
      if (!this.options.initImmediate) return (this.init(e, t), this)
      setTimeout(() => {
        this.init(e, t)
      }, 0)
    }
  }
  init() {
    var e = this
    let t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
      s = arguments.length > 1 ? arguments[1] : void 0
    ;((this.isInitializing = !0),
      typeof t == 'function' && ((s = t), (t = {})),
      !t.defaultNS &&
        t.defaultNS !== !1 &&
        t.ns &&
        (d(t.ns)
          ? (t.defaultNS = t.ns)
          : t.ns.indexOf('translation') < 0 && (t.defaultNS = t.ns[0])))
    const n = ue()
    ;((this.options = { ...n, ...this.options, ...fe(t) }),
      this.options.compatibilityAPI !== 'v1' &&
        (this.options.interpolation = { ...n.interpolation, ...this.options.interpolation }),
      t.keySeparator !== void 0 && (this.options.userDefinedKeySeparator = t.keySeparator),
      t.nsSeparator !== void 0 && (this.options.userDefinedNsSeparator = t.nsSeparator))
    const r = (h) => (h ? (typeof h == 'function' ? new h() : h) : null)
    if (!this.options.isClone) {
      this.modules.logger
        ? C.init(r(this.modules.logger), this.options)
        : C.init(null, this.options)
      let h
      this.modules.formatter ? (h = this.modules.formatter) : typeof Intl < 'u' && (h = Ke)
      const c = new ae(this.options)
      this.store = new ie(this.options.resources, this.options)
      const u = this.services
      ;((u.logger = C),
        (u.resourceStore = this.store),
        (u.languageUtils = c),
        (u.pluralResolver = new Te(c, {
          prepend: this.options.pluralSeparator,
          compatibilityJSON: this.options.compatibilityJSON,
          simplifyPluralSuffix: this.options.simplifyPluralSuffix,
        })),
        h &&
          (!this.options.interpolation.format ||
            this.options.interpolation.format === n.interpolation.format) &&
          ((u.formatter = r(h)),
          u.formatter.init(u, this.options),
          (this.options.interpolation.format = u.formatter.format.bind(u.formatter))),
        (u.interpolator = new Ue(this.options)),
        (u.utils = { hasLoadedNamespace: this.hasLoadedNamespace.bind(this) }),
        (u.backendConnector = new He(r(this.modules.backend), u.resourceStore, u, this.options)),
        u.backendConnector.on('*', function (g) {
          for (var p = arguments.length, x = new Array(p > 1 ? p - 1 : 0), m = 1; m < p; m++)
            x[m - 1] = arguments[m]
          e.emit(g, ...x)
        }),
        this.modules.languageDetector &&
          ((u.languageDetector = r(this.modules.languageDetector)),
          u.languageDetector.init &&
            u.languageDetector.init(u, this.options.detection, this.options)),
        this.modules.i18nFormat &&
          ((u.i18nFormat = r(this.modules.i18nFormat)),
          u.i18nFormat.init && u.i18nFormat.init(this)),
        (this.translator = new Q(this.services, this.options)),
        this.translator.on('*', function (g) {
          for (var p = arguments.length, x = new Array(p > 1 ? p - 1 : 0), m = 1; m < p; m++)
            x[m - 1] = arguments[m]
          e.emit(g, ...x)
        }),
        this.modules.external.forEach((g) => {
          g.init && g.init(this)
        }))
    }
    if (
      ((this.format = this.options.interpolation.format),
      s || (s = H),
      this.options.fallbackLng && !this.services.languageDetector && !this.options.lng)
    ) {
      const h = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng)
      h.length > 0 && h[0] !== 'dev' && (this.options.lng = h[0])
    }
    ;(!this.services.languageDetector &&
      !this.options.lng &&
      this.logger.warn('init: no languageDetector is used and no lng is defined'),
      ['getResource', 'hasResourceBundle', 'getResourceBundle', 'getDataByLanguage'].forEach(
        (h) => {
          this[h] = function () {
            return e.store[h](...arguments)
          }
        },
      ),
      ['addResource', 'addResources', 'addResourceBundle', 'removeResourceBundle'].forEach((h) => {
        this[h] = function () {
          return (e.store[h](...arguments), e)
        }
      }))
    const l = T(),
      f = () => {
        const h = (c, u) => {
          ;((this.isInitializing = !1),
            this.isInitialized &&
              !this.initializedStoreOnce &&
              this.logger.warn(
                'init: i18next is already initialized. You should call init just once!',
              ),
            (this.isInitialized = !0),
            this.options.isClone || this.logger.log('initialized', this.options),
            this.emit('initialized', this.options),
            l.resolve(u),
            s(c, u))
        }
        if (this.languages && this.options.compatibilityAPI !== 'v1' && !this.isInitialized)
          return h(null, this.t.bind(this))
        this.changeLanguage(this.options.lng, h)
      }
    return (this.options.resources || !this.options.initImmediate ? f() : setTimeout(f, 0), l)
  }
  loadResources(e) {
    let s = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : H
    const n = d(e) ? e : this.language
    if (
      (typeof e == 'function' && (s = e),
      !this.options.resources || this.options.partialBundledLanguages)
    ) {
      if (
        n &&
        n.toLowerCase() === 'cimode' &&
        (!this.options.preload || this.options.preload.length === 0)
      )
        return s()
      const r = [],
        a = (o) => {
          if (!o || o === 'cimode') return
          this.services.languageUtils.toResolveHierarchy(o).forEach((f) => {
            f !== 'cimode' && r.indexOf(f) < 0 && r.push(f)
          })
        }
      ;(n
        ? a(n)
        : this.services.languageUtils
            .getFallbackCodes(this.options.fallbackLng)
            .forEach((l) => a(l)),
        this.options.preload && this.options.preload.forEach((o) => a(o)),
        this.services.backendConnector.load(r, this.options.ns, (o) => {
          ;(!o &&
            !this.resolvedLanguage &&
            this.language &&
            this.setResolvedLanguage(this.language),
            s(o))
        }))
    } else s(null)
  }
  reloadResources(e, t, s) {
    const n = T()
    return (
      typeof e == 'function' && ((s = e), (e = void 0)),
      typeof t == 'function' && ((s = t), (t = void 0)),
      e || (e = this.languages),
      t || (t = this.options.ns),
      s || (s = H),
      this.services.backendConnector.reload(e, t, (r) => {
        ;(n.resolve(), s(r))
      }),
      n
    )
  }
  use(e) {
    if (!e)
      throw new Error(
        'You are passing an undefined module! Please check the object you are passing to i18next.use()',
      )
    if (!e.type)
      throw new Error(
        'You are passing a wrong module! Please check the object you are passing to i18next.use()',
      )
    return (
      e.type === 'backend' && (this.modules.backend = e),
      (e.type === 'logger' || (e.log && e.warn && e.error)) && (this.modules.logger = e),
      e.type === 'languageDetector' && (this.modules.languageDetector = e),
      e.type === 'i18nFormat' && (this.modules.i18nFormat = e),
      e.type === 'postProcessor' && me.addPostProcessor(e),
      e.type === 'formatter' && (this.modules.formatter = e),
      e.type === '3rdParty' && this.modules.external.push(e),
      this
    )
  }
  setResolvedLanguage(e) {
    if (!(!e || !this.languages) && !(['cimode', 'dev'].indexOf(e) > -1))
      for (let t = 0; t < this.languages.length; t++) {
        const s = this.languages[t]
        if (!(['cimode', 'dev'].indexOf(s) > -1) && this.store.hasLanguageSomeTranslations(s)) {
          this.resolvedLanguage = s
          break
        }
      }
  }
  changeLanguage(e, t) {
    var s = this
    this.isLanguageChangingTo = e
    const n = T()
    this.emit('languageChanging', e)
    const r = (l) => {
        ;((this.language = l),
          (this.languages = this.services.languageUtils.toResolveHierarchy(l)),
          (this.resolvedLanguage = void 0),
          this.setResolvedLanguage(l))
      },
      a = (l, f) => {
        ;(f
          ? (r(f),
            this.translator.changeLanguage(f),
            (this.isLanguageChangingTo = void 0),
            this.emit('languageChanged', f),
            this.logger.log('languageChanged', f))
          : (this.isLanguageChangingTo = void 0),
          n.resolve(function () {
            return s.t(...arguments)
          }),
          t &&
            t(l, function () {
              return s.t(...arguments)
            }))
      },
      o = (l) => {
        !e && !l && this.services.languageDetector && (l = [])
        const f = d(l) ? l : this.services.languageUtils.getBestMatchFromCodes(l)
        ;(f &&
          (this.language || r(f),
          this.translator.language || this.translator.changeLanguage(f),
          this.services.languageDetector &&
            this.services.languageDetector.cacheUserLanguage &&
            this.services.languageDetector.cacheUserLanguage(f)),
          this.loadResources(f, (h) => {
            a(h, f)
          }))
      }
    return (
      !e && this.services.languageDetector && !this.services.languageDetector.async
        ? o(this.services.languageDetector.detect())
        : !e && this.services.languageDetector && this.services.languageDetector.async
          ? this.services.languageDetector.detect.length === 0
            ? this.services.languageDetector.detect().then(o)
            : this.services.languageDetector.detect(o)
          : o(e),
      n
    )
  }
  getFixedT(e, t, s) {
    var n = this
    const r = function (a, o) {
      let l
      if (typeof o != 'object') {
        for (var f = arguments.length, h = new Array(f > 2 ? f - 2 : 0), c = 2; c < f; c++)
          h[c - 2] = arguments[c]
        l = n.options.overloadTranslationOptionHandler([a, o].concat(h))
      } else l = { ...o }
      ;((l.lng = l.lng || r.lng),
        (l.lngs = l.lngs || r.lngs),
        (l.ns = l.ns || r.ns),
        l.keyPrefix !== '' && (l.keyPrefix = l.keyPrefix || s || r.keyPrefix))
      const u = n.options.keySeparator || '.'
      let g
      return (
        l.keyPrefix && Array.isArray(a)
          ? (g = a.map((p) => `${l.keyPrefix}${u}${p}`))
          : (g = l.keyPrefix ? `${l.keyPrefix}${u}${a}` : a),
        n.t(g, l)
      )
    }
    return (d(e) ? (r.lng = e) : (r.lngs = e), (r.ns = t), (r.keyPrefix = s), r)
  }
  t() {
    return this.translator && this.translator.translate(...arguments)
  }
  exists() {
    return this.translator && this.translator.exists(...arguments)
  }
  setDefaultNamespace(e) {
    this.options.defaultNS = e
  }
  hasLoadedNamespace(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}
    if (!this.isInitialized)
      return (
        this.logger.warn('hasLoadedNamespace: i18next was not initialized', this.languages),
        !1
      )
    if (!this.languages || !this.languages.length)
      return (
        this.logger.warn(
          'hasLoadedNamespace: i18n.languages were undefined or empty',
          this.languages,
        ),
        !1
      )
    const s = t.lng || this.resolvedLanguage || this.languages[0],
      n = this.options ? this.options.fallbackLng : !1,
      r = this.languages[this.languages.length - 1]
    if (s.toLowerCase() === 'cimode') return !0
    const a = (o, l) => {
      const f = this.services.backendConnector.state[`${o}|${l}`]
      return f === -1 || f === 0 || f === 2
    }
    if (t.precheck) {
      const o = t.precheck(this, a)
      if (o !== void 0) return o
    }
    return !!(
      this.hasResourceBundle(s, e) ||
      !this.services.backendConnector.backend ||
      (this.options.resources && !this.options.partialBundledLanguages) ||
      (a(s, e) && (!n || a(r, e)))
    )
  }
  loadNamespaces(e, t) {
    const s = T()
    return this.options.ns
      ? (d(e) && (e = [e]),
        e.forEach((n) => {
          this.options.ns.indexOf(n) < 0 && this.options.ns.push(n)
        }),
        this.loadResources((n) => {
          ;(s.resolve(), t && t(n))
        }),
        s)
      : (t && t(), Promise.resolve())
  }
  loadLanguages(e, t) {
    const s = T()
    d(e) && (e = [e])
    const n = this.options.preload || [],
      r = e.filter((a) => n.indexOf(a) < 0 && this.services.languageUtils.isSupportedCode(a))
    return r.length
      ? ((this.options.preload = n.concat(r)),
        this.loadResources((a) => {
          ;(s.resolve(), t && t(a))
        }),
        s)
      : (t && t(), Promise.resolve())
  }
  dir(e) {
    if (
      (e ||
        (e =
          this.resolvedLanguage ||
          (this.languages && this.languages.length > 0 ? this.languages[0] : this.language)),
      !e)
    )
      return 'rtl'
    const t = [
        'ar',
        'shu',
        'sqr',
        'ssh',
        'xaa',
        'yhd',
        'yud',
        'aao',
        'abh',
        'abv',
        'acm',
        'acq',
        'acw',
        'acx',
        'acy',
        'adf',
        'ads',
        'aeb',
        'aec',
        'afb',
        'ajp',
        'apc',
        'apd',
        'arb',
        'arq',
        'ars',
        'ary',
        'arz',
        'auz',
        'avl',
        'ayh',
        'ayl',
        'ayn',
        'ayp',
        'bbz',
        'pga',
        'he',
        'iw',
        'ps',
        'pbt',
        'pbu',
        'pst',
        'prp',
        'prd',
        'ug',
        'ur',
        'ydd',
        'yds',
        'yih',
        'ji',
        'yi',
        'hbo',
        'men',
        'xmn',
        'fa',
        'jpr',
        'peo',
        'pes',
        'prs',
        'dv',
        'sam',
        'ckb',
      ],
      s = (this.services && this.services.languageUtils) || new ae(ue())
    return t.indexOf(s.getLanguagePartFromCode(e)) > -1 || e.toLowerCase().indexOf('-arab') > 1
      ? 'rtl'
      : 'ltr'
  }
  static createInstance() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
      t = arguments.length > 1 ? arguments[1] : void 0
    return new V(e, t)
  }
  cloneInstance() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
      t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : H
    const s = e.forkResourceStore
    s && delete e.forkResourceStore
    const n = { ...this.options, ...e, isClone: !0 },
      r = new V(n)
    return (
      (e.debug !== void 0 || e.prefix !== void 0) && (r.logger = r.logger.clone(e)),
      ['store', 'services', 'language'].forEach((o) => {
        r[o] = this[o]
      }),
      (r.services = { ...this.services }),
      (r.services.utils = { hasLoadedNamespace: r.hasLoadedNamespace.bind(r) }),
      s && ((r.store = new ie(this.store.data, n)), (r.services.resourceStore = r.store)),
      (r.translator = new Q(r.services, n)),
      r.translator.on('*', function (o) {
        for (var l = arguments.length, f = new Array(l > 1 ? l - 1 : 0), h = 1; h < l; h++)
          f[h - 1] = arguments[h]
        r.emit(o, ...f)
      }),
      r.init(n, t),
      (r.translator.options = n),
      (r.translator.backendConnector.services.utils = {
        hasLoadedNamespace: r.hasLoadedNamespace.bind(r),
      }),
      r
    )
  }
  toJSON() {
    return {
      options: this.options,
      store: this.store,
      language: this.language,
      languages: this.languages,
      resolvedLanguage: this.resolvedLanguage,
    }
  }
}
const w = V.createInstance()
w.createInstance = V.createInstance
w.createInstance
w.dir
w.init
w.loadResources
w.reloadResources
w.use
w.changeLanguage
w.getFixedT
w.t
w.exists
w.setDefaultNamespace
w.hasLoadedNamespace
w.loadNamespaces
w.loadLanguages
const { slice: Je, forEach: Be } = []
function Qe(i) {
  return (
    Be.call(Je.call(arguments, 1), (e) => {
      if (e) for (const t in e) i[t] === void 0 && (i[t] = e[t])
    }),
    i
  )
}
function We(i) {
  return typeof i != 'string'
    ? !1
    : [
        /<\s*script.*?>/i,
        /<\s*\/\s*script\s*>/i,
        /<\s*img.*?on\w+\s*=/i,
        /<\s*\w+\s*on\w+\s*=.*?>/i,
        /javascript\s*:/i,
        /vbscript\s*:/i,
        /expression\s*\(/i,
        /eval\s*\(/i,
        /alert\s*\(/i,
        /document\.cookie/i,
        /document\.write\s*\(/i,
        /window\.location/i,
        /innerHTML/i,
      ].some((t) => t.test(i))
}
const he = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/,
  Ye = function (i, e) {
    const s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : { path: '/' },
      n = encodeURIComponent(e)
    let r = `${i}=${n}`
    if (s.maxAge > 0) {
      const a = s.maxAge - 0
      if (Number.isNaN(a)) throw new Error('maxAge should be a Number')
      r += `; Max-Age=${Math.floor(a)}`
    }
    if (s.domain) {
      if (!he.test(s.domain)) throw new TypeError('option domain is invalid')
      r += `; Domain=${s.domain}`
    }
    if (s.path) {
      if (!he.test(s.path)) throw new TypeError('option path is invalid')
      r += `; Path=${s.path}`
    }
    if (s.expires) {
      if (typeof s.expires.toUTCString != 'function')
        throw new TypeError('option expires is invalid')
      r += `; Expires=${s.expires.toUTCString()}`
    }
    if ((s.httpOnly && (r += '; HttpOnly'), s.secure && (r += '; Secure'), s.sameSite))
      switch (typeof s.sameSite == 'string' ? s.sameSite.toLowerCase() : s.sameSite) {
        case !0:
          r += '; SameSite=Strict'
          break
        case 'lax':
          r += '; SameSite=Lax'
          break
        case 'strict':
          r += '; SameSite=Strict'
          break
        case 'none':
          r += '; SameSite=None'
          break
        default:
          throw new TypeError('option sameSite is invalid')
      }
    return (s.partitioned && (r += '; Partitioned'), r)
  },
  ce = {
    create(i, e, t, s) {
      let n =
        arguments.length > 4 && arguments[4] !== void 0
          ? arguments[4]
          : { path: '/', sameSite: 'strict' }
      ;(t && ((n.expires = new Date()), n.expires.setTime(n.expires.getTime() + t * 60 * 1e3)),
        s && (n.domain = s),
        (document.cookie = Ye(i, e, n)))
    },
    read(i) {
      const e = `${i}=`,
        t = document.cookie.split(';')
      for (let s = 0; s < t.length; s++) {
        let n = t[s]
        for (; n.charAt(0) === ' '; ) n = n.substring(1, n.length)
        if (n.indexOf(e) === 0) return n.substring(e.length, n.length)
      }
      return null
    },
    remove(i, e) {
      this.create(i, '', -1, e)
    },
  }
var qe = {
    name: 'cookie',
    lookup(i) {
      let { lookupCookie: e } = i
      if (e && typeof document < 'u') return ce.read(e) || void 0
    },
    cacheUserLanguage(i, e) {
      let { lookupCookie: t, cookieMinutes: s, cookieDomain: n, cookieOptions: r } = e
      t && typeof document < 'u' && ce.create(t, i, s, n, r)
    },
  },
  Ze = {
    name: 'querystring',
    lookup(i) {
      let { lookupQuerystring: e } = i,
        t
      if (typeof window < 'u') {
        let { search: s } = window.location
        !window.location.search &&
          window.location.hash?.indexOf('?') > -1 &&
          (s = window.location.hash.substring(window.location.hash.indexOf('?')))
        const r = s.substring(1).split('&')
        for (let a = 0; a < r.length; a++) {
          const o = r[a].indexOf('=')
          o > 0 && r[a].substring(0, o) === e && (t = r[a].substring(o + 1))
        }
      }
      return t
    },
  },
  Ge = {
    name: 'hash',
    lookup(i) {
      let { lookupHash: e, lookupFromHashIndex: t } = i,
        s
      if (typeof window < 'u') {
        const { hash: n } = window.location
        if (n && n.length > 2) {
          const r = n.substring(1)
          if (e) {
            const a = r.split('&')
            for (let o = 0; o < a.length; o++) {
              const l = a[o].indexOf('=')
              l > 0 && a[o].substring(0, l) === e && (s = a[o].substring(l + 1))
            }
          }
          if (s) return s
          if (!s && t > -1) {
            const a = n.match(/\/([a-zA-Z-]*)/g)
            return Array.isArray(a) ? a[typeof t == 'number' ? t : 0]?.replace('/', '') : void 0
          }
        }
      }
      return s
    },
  }
let $ = null
const ge = () => {
  if ($ !== null) return $
  try {
    if ((($ = typeof window < 'u' && window.localStorage !== null), !$)) return !1
    const i = 'i18next.translate.boo'
    ;(window.localStorage.setItem(i, 'foo'), window.localStorage.removeItem(i))
  } catch {
    $ = !1
  }
  return $
}
var Xe = {
  name: 'localStorage',
  lookup(i) {
    let { lookupLocalStorage: e } = i
    if (e && ge()) return window.localStorage.getItem(e) || void 0
  },
  cacheUserLanguage(i, e) {
    let { lookupLocalStorage: t } = e
    t && ge() && window.localStorage.setItem(t, i)
  },
}
let I = null
const de = () => {
  if (I !== null) return I
  try {
    if (((I = typeof window < 'u' && window.sessionStorage !== null), !I)) return !1
    const i = 'i18next.translate.boo'
    ;(window.sessionStorage.setItem(i, 'foo'), window.sessionStorage.removeItem(i))
  } catch {
    I = !1
  }
  return I
}
var _e = {
    name: 'sessionStorage',
    lookup(i) {
      let { lookupSessionStorage: e } = i
      if (e && de()) return window.sessionStorage.getItem(e) || void 0
    },
    cacheUserLanguage(i, e) {
      let { lookupSessionStorage: t } = e
      t && de() && window.sessionStorage.setItem(t, i)
    },
  },
  et = {
    name: 'navigator',
    lookup(i) {
      const e = []
      if (typeof navigator < 'u') {
        const { languages: t, userLanguage: s, language: n } = navigator
        if (t) for (let r = 0; r < t.length; r++) e.push(t[r])
        ;(s && e.push(s), n && e.push(n))
      }
      return e.length > 0 ? e : void 0
    },
  },
  tt = {
    name: 'htmlTag',
    lookup(i) {
      let { htmlTag: e } = i,
        t
      const s = e || (typeof document < 'u' ? document.documentElement : null)
      return (s && typeof s.getAttribute == 'function' && (t = s.getAttribute('lang')), t)
    },
  },
  st = {
    name: 'path',
    lookup(i) {
      let { lookupFromPathIndex: e } = i
      if (typeof window > 'u') return
      const t = window.location.pathname.match(/\/([a-zA-Z-]*)/g)
      return Array.isArray(t) ? t[typeof e == 'number' ? e : 0]?.replace('/', '') : void 0
    },
  },
  nt = {
    name: 'subdomain',
    lookup(i) {
      let { lookupFromSubdomainIndex: e } = i
      const t = typeof e == 'number' ? e + 1 : 1,
        s =
          typeof window < 'u' &&
          window.location?.hostname?.match(/^(\w{2,5})\.(([a-z0-9-]{1,63}\.[a-z]{2,6})|localhost)/i)
      if (s) return s[t]
    },
  }
let xe = !1
try {
  ;(document.cookie, (xe = !0))
} catch {}
const be = ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag']
xe || be.splice(1, 1)
const it = () => ({
  order: be,
  lookupQuerystring: 'lng',
  lookupCookie: 'i18next',
  lookupLocalStorage: 'i18nextLng',
  lookupSessionStorage: 'i18nextLng',
  caches: ['localStorage'],
  excludeCacheFor: ['cimode'],
  convertDetectedLanguage: (i) => i,
})
class rt {
  constructor(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}
    ;((this.type = 'languageDetector'), (this.detectors = {}), this.init(e, t))
  }
  init() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : { languageUtils: {} },
      t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
      s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}
    ;((this.services = e),
      (this.options = Qe(t, this.options || {}, it())),
      typeof this.options.convertDetectedLanguage == 'string' &&
        this.options.convertDetectedLanguage.indexOf('15897') > -1 &&
        (this.options.convertDetectedLanguage = (n) => n.replace('-', '_')),
      this.options.lookupFromUrlIndex &&
        (this.options.lookupFromPathIndex = this.options.lookupFromUrlIndex),
      (this.i18nOptions = s),
      this.addDetector(qe),
      this.addDetector(Ze),
      this.addDetector(Xe),
      this.addDetector(_e),
      this.addDetector(et),
      this.addDetector(tt),
      this.addDetector(st),
      this.addDetector(nt),
      this.addDetector(Ge))
  }
  addDetector(e) {
    return ((this.detectors[e.name] = e), this)
  }
  detect() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : this.options.order,
      t = []
    return (
      e.forEach((s) => {
        if (this.detectors[s]) {
          let n = this.detectors[s].lookup(this.options)
          ;(n && typeof n == 'string' && (n = [n]), n && (t = t.concat(n)))
        }
      }),
      (t = t
        .filter((s) => s != null && !We(s))
        .map((s) => this.options.convertDetectedLanguage(s))),
      this.services &&
      this.services.languageUtils &&
      this.services.languageUtils.getBestMatchFromCodes
        ? t
        : t.length > 0
          ? t[0]
          : null
    )
  }
  cacheUserLanguage(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : this.options.caches
    t &&
      ((this.options.excludeCacheFor && this.options.excludeCacheFor.indexOf(e) > -1) ||
        t.forEach((s) => {
          this.detectors[s] && this.detectors[s].cacheUserLanguage(e, this.options)
        }))
  }
}
rt.type = 'languageDetector'
export { rt as B, w as i }
//# sourceMappingURL=i18n-vendor-Coo-X0AG.js.map
