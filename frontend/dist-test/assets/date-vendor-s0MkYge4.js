function d(t) {
  const e = Object.prototype.toString.call(t)
  return t instanceof Date || (typeof t == 'object' && e === '[object Date]')
    ? new t.constructor(+t)
    : typeof t == 'number' ||
        e === '[object Number]' ||
        typeof t == 'string' ||
        e === '[object String]'
      ? new Date(t)
      : new Date(NaN)
}
function b(t, e) {
  return t instanceof Date ? new t.constructor(e) : new Date(e)
}
function bt(t, e) {
  const n = d(t)
  return isNaN(e) ? b(t, NaN) : (n.setDate(n.getDate() + e), n)
}
function Mt(t, e) {
  const n = d(t)
  if (isNaN(e)) return b(t, NaN)
  if (!e) return n
  const r = n.getDate(),
    a = b(t, n.getTime())
  a.setMonth(n.getMonth() + e + 1, 0)
  const o = a.getDate()
  return r >= o ? a : (n.setFullYear(a.getFullYear(), a.getMonth(), r), n)
}
const ot = 6048e5,
  pt = 864e5,
  _ = 43200,
  B = 1440
let Dt = {}
function C() {
  return Dt
}
function N(t, e) {
  const n = C(),
    r =
      e?.weekStartsOn ??
      e?.locale?.options?.weekStartsOn ??
      n.weekStartsOn ??
      n.locale?.options?.weekStartsOn ??
      0,
    a = d(t),
    o = a.getDay(),
    i = (o < r ? 7 : 0) + o - r
  return (a.setDate(a.getDate() - i), a.setHours(0, 0, 0, 0), a)
}
function X(t) {
  return N(t, { weekStartsOn: 1 })
}
function it(t) {
  const e = d(t),
    n = e.getFullYear(),
    r = b(t, 0)
  ;(r.setFullYear(n + 1, 0, 4), r.setHours(0, 0, 0, 0))
  const a = X(r),
    o = b(t, 0)
  ;(o.setFullYear(n, 0, 4), o.setHours(0, 0, 0, 0))
  const i = X(o)
  return e.getTime() >= a.getTime() ? n + 1 : e.getTime() >= i.getTime() ? n : n - 1
}
function L(t) {
  const e = d(t)
  return (e.setHours(0, 0, 0, 0), e)
}
function Q(t) {
  const e = d(t),
    n = new Date(
      Date.UTC(
        e.getFullYear(),
        e.getMonth(),
        e.getDate(),
        e.getHours(),
        e.getMinutes(),
        e.getSeconds(),
        e.getMilliseconds(),
      ),
    )
  return (n.setUTCFullYear(e.getFullYear()), +t - +n)
}
function st(t, e) {
  const n = L(t),
    r = L(e),
    a = +n - Q(n),
    o = +r - Q(r)
  return Math.round((a - o) / pt)
}
function Pt(t) {
  const e = it(t),
    n = b(t, 0)
  return (n.setFullYear(e, 0, 4), n.setHours(0, 0, 0, 0), X(n))
}
function q(t, e) {
  const n = d(t),
    r = d(e),
    a = n.getTime() - r.getTime()
  return a < 0 ? -1 : a > 0 ? 1 : a
}
function G(t) {
  return b(t, Date.now())
}
function ut(t, e) {
  const n = L(t),
    r = L(e)
  return +n == +r
}
function Ot(t) {
  return (
    t instanceof Date ||
    (typeof t == 'object' && Object.prototype.toString.call(t) === '[object Date]')
  )
}
function vt(t) {
  if (!Ot(t) && typeof t != 'number') return !1
  const e = d(t)
  return !isNaN(Number(e))
}
function kt(t, e) {
  const n = d(t),
    r = d(e),
    a = n.getFullYear() - r.getFullYear(),
    o = n.getMonth() - r.getMonth()
  return a * 12 + o
}
function wr(t, e) {
  const n = d(t),
    r = d(e),
    a = V(n, r),
    o = Math.abs(st(n, r))
  n.setDate(n.getDate() - a * o)
  const i = +(V(n, r) === -a),
    s = a * (o - i)
  return s === 0 ? 0 : s
}
function V(t, e) {
  const n =
    t.getFullYear() - e.getFullYear() ||
    t.getMonth() - e.getMonth() ||
    t.getDate() - e.getDate() ||
    t.getHours() - e.getHours() ||
    t.getMinutes() - e.getMinutes() ||
    t.getSeconds() - e.getSeconds() ||
    t.getMilliseconds() - e.getMilliseconds()
  return n < 0 ? -1 : n > 0 ? 1 : n
}
function Wt(t) {
  return (e) => {
    const r = (t ? Math[t] : Math.trunc)(e)
    return r === 0 ? 0 : r
  }
}
function xt(t, e) {
  return +d(t) - +d(e)
}
function Tt(t) {
  const e = d(t)
  return (e.setHours(23, 59, 59, 999), e)
}
function Yt(t) {
  const e = d(t),
    n = e.getMonth()
  return (e.setFullYear(e.getFullYear(), n + 1, 0), e.setHours(23, 59, 59, 999), e)
}
function St(t) {
  const e = d(t)
  return +Tt(e) == +Yt(e)
}
function $t(t, e) {
  const n = d(t),
    r = d(e),
    a = q(n, r),
    o = Math.abs(kt(n, r))
  let i
  if (o < 1) i = 0
  else {
    ;(n.getMonth() === 1 && n.getDate() > 27 && n.setDate(30), n.setMonth(n.getMonth() - a * o))
    let s = q(n, r) === -a
    ;(St(d(t)) && o === 1 && q(t, r) === 1 && (s = !1), (i = a * (o - Number(s))))
  }
  return i === 0 ? 0 : i
}
function Ft(t, e, n) {
  const r = xt(t, e) / 1e3
  return Wt(n?.roundingMethod)(r)
}
function yr(t, e) {
  const n = d(t.start),
    r = d(t.end)
  let a = +n > +r
  const o = a ? +n : +r,
    i = a ? r : n
  i.setHours(0, 0, 0, 0)
  let s = 1
  const u = []
  for (; +i <= o; ) (u.push(d(i)), i.setDate(i.getDate() + s), i.setHours(0, 0, 0, 0))
  return a ? u.reverse() : u
}
function br(t) {
  const e = d(t)
  return (e.setDate(1), e.setHours(0, 0, 0, 0), e)
}
function Nt(t) {
  const e = d(t),
    n = b(t, 0)
  return (n.setFullYear(e.getFullYear(), 0, 1), n.setHours(0, 0, 0, 0), n)
}
const Et = {
    lessThanXSeconds: { one: 'less than a second', other: 'less than {{count}} seconds' },
    xSeconds: { one: '1 second', other: '{{count}} seconds' },
    halfAMinute: 'half a minute',
    lessThanXMinutes: { one: 'less than a minute', other: 'less than {{count}} minutes' },
    xMinutes: { one: '1 minute', other: '{{count}} minutes' },
    aboutXHours: { one: 'about 1 hour', other: 'about {{count}} hours' },
    xHours: { one: '1 hour', other: '{{count}} hours' },
    xDays: { one: '1 day', other: '{{count}} days' },
    aboutXWeeks: { one: 'about 1 week', other: 'about {{count}} weeks' },
    xWeeks: { one: '1 week', other: '{{count}} weeks' },
    aboutXMonths: { one: 'about 1 month', other: 'about {{count}} months' },
    xMonths: { one: '1 month', other: '{{count}} months' },
    aboutXYears: { one: 'about 1 year', other: 'about {{count}} years' },
    xYears: { one: '1 year', other: '{{count}} years' },
    overXYears: { one: 'over 1 year', other: 'over {{count}} years' },
    almostXYears: { one: 'almost 1 year', other: 'almost {{count}} years' },
  },
  Ct = (t, e, n) => {
    let r
    const a = Et[t]
    return (
      typeof a == 'string'
        ? (r = a)
        : e === 1
          ? (r = a.one)
          : (r = a.other.replace('{{count}}', e.toString())),
      n?.addSuffix ? (n.comparison && n.comparison > 0 ? 'in ' + r : r + ' ago') : r
    )
  }
function Y(t) {
  return (e = {}) => {
    const n = e.width ? String(e.width) : t.defaultWidth
    return t.formats[n] || t.formats[t.defaultWidth]
  }
}
const Ht = {
    full: 'EEEE, MMMM do, y',
    long: 'MMMM do, y',
    medium: 'MMM d, y',
    short: 'MM/dd/yyyy',
  },
  _t = { full: 'h:mm:ss a zzzz', long: 'h:mm:ss a z', medium: 'h:mm:ss a', short: 'h:mm a' },
  qt = {
    full: "{{date}} 'at' {{time}}",
    long: "{{date}} 'at' {{time}}",
    medium: '{{date}}, {{time}}',
    short: '{{date}}, {{time}}',
  },
  Xt = {
    date: Y({ formats: Ht, defaultWidth: 'full' }),
    time: Y({ formats: _t, defaultWidth: 'full' }),
    dateTime: Y({ formats: qt, defaultWidth: 'full' }),
  },
  Lt = {
    lastWeek: "'last' eeee 'at' p",
    yesterday: "'yesterday at' p",
    today: "'today at' p",
    tomorrow: "'tomorrow at' p",
    nextWeek: "eeee 'at' p",
    other: 'P',
  },
  Qt = (t, e, n, r) => Lt[t]
function M(t) {
  return (e, n) => {
    const r = n?.context ? String(n.context) : 'standalone'
    let a
    if (r === 'formatting' && t.formattingValues) {
      const i = t.defaultFormattingWidth || t.defaultWidth,
        s = n?.width ? String(n.width) : i
      a = t.formattingValues[s] || t.formattingValues[i]
    } else {
      const i = t.defaultWidth,
        s = n?.width ? String(n.width) : t.defaultWidth
      a = t.values[s] || t.values[i]
    }
    const o = t.argumentCallback ? t.argumentCallback(e) : e
    return a[o]
  }
}
const It = {
    narrow: ['B', 'A'],
    abbreviated: ['BC', 'AD'],
    wide: ['Before Christ', 'Anno Domini'],
  },
  jt = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
    wide: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter'],
  },
  Rt = {
    narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    abbreviated: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    wide: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
  },
  At = {
    narrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    short: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    abbreviated: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    wide: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  Gt = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'mi',
      noon: 'n',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night',
    },
    wide: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night',
    },
  },
  Bt = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'mi',
      noon: 'n',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night',
    },
    wide: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night',
    },
  },
  Vt = (t, e) => {
    const n = Number(t),
      r = n % 100
    if (r > 20 || r < 10)
      switch (r % 10) {
        case 1:
          return n + 'st'
        case 2:
          return n + 'nd'
        case 3:
          return n + 'rd'
      }
    return n + 'th'
  },
  Jt = {
    ordinalNumber: Vt,
    era: M({ values: It, defaultWidth: 'wide' }),
    quarter: M({ values: jt, defaultWidth: 'wide', argumentCallback: (t) => t - 1 }),
    month: M({ values: Rt, defaultWidth: 'wide' }),
    day: M({ values: At, defaultWidth: 'wide' }),
    dayPeriod: M({
      values: Gt,
      defaultWidth: 'wide',
      formattingValues: Bt,
      defaultFormattingWidth: 'wide',
    }),
  }
function p(t) {
  return (e, n = {}) => {
    const r = n.width,
      a = (r && t.matchPatterns[r]) || t.matchPatterns[t.defaultMatchWidth],
      o = e.match(a)
    if (!o) return null
    const i = o[0],
      s = (r && t.parsePatterns[r]) || t.parsePatterns[t.defaultParseWidth],
      u = Array.isArray(s) ? Ut(s, (c) => c.test(i)) : zt(s, (c) => c.test(i))
    let g
    ;((g = t.valueCallback ? t.valueCallback(u) : u),
      (g = n.valueCallback ? n.valueCallback(g) : g))
    const f = e.slice(i.length)
    return { value: g, rest: f }
  }
}
function zt(t, e) {
  for (const n in t) if (Object.prototype.hasOwnProperty.call(t, n) && e(t[n])) return n
}
function Ut(t, e) {
  for (let n = 0; n < t.length; n++) if (e(t[n])) return n
}
function ct(t) {
  return (e, n = {}) => {
    const r = e.match(t.matchPattern)
    if (!r) return null
    const a = r[0],
      o = e.match(t.parsePattern)
    if (!o) return null
    let i = t.valueCallback ? t.valueCallback(o[0]) : o[0]
    i = n.valueCallback ? n.valueCallback(i) : i
    const s = e.slice(a.length)
    return { value: i, rest: s }
  }
}
const Kt = /^(\d+)(th|st|nd|rd)?/i,
  Zt = /\d+/i,
  te = {
    narrow: /^(b|a)/i,
    abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
    wide: /^(before christ|before common era|anno domini|common era)/i,
  },
  ee = { any: [/^b/i, /^(a|c)/i] },
  ne = { narrow: /^[1234]/i, abbreviated: /^q[1234]/i, wide: /^[1234](th|st|nd|rd)? quarter/i },
  re = { any: [/1/i, /2/i, /3/i, /4/i] },
  ae = {
    narrow: /^[jfmasond]/i,
    abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i,
  },
  oe = {
    narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
    any: [
      /^ja/i,
      /^f/i,
      /^mar/i,
      /^ap/i,
      /^may/i,
      /^jun/i,
      /^jul/i,
      /^au/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],
  },
  ie = {
    narrow: /^[smtwf]/i,
    short: /^(su|mo|tu|we|th|fr|sa)/i,
    abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
    wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i,
  },
  se = {
    narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
    any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i],
  },
  ue = {
    narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
    any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i,
  },
  ce = {
    any: {
      am: /^a/i,
      pm: /^p/i,
      midnight: /^mi/i,
      noon: /^no/i,
      morning: /morning/i,
      afternoon: /afternoon/i,
      evening: /evening/i,
      night: /night/i,
    },
  },
  de = {
    ordinalNumber: ct({
      matchPattern: Kt,
      parsePattern: Zt,
      valueCallback: (t) => parseInt(t, 10),
    }),
    era: p({
      matchPatterns: te,
      defaultMatchWidth: 'wide',
      parsePatterns: ee,
      defaultParseWidth: 'any',
    }),
    quarter: p({
      matchPatterns: ne,
      defaultMatchWidth: 'wide',
      parsePatterns: re,
      defaultParseWidth: 'any',
      valueCallback: (t) => t + 1,
    }),
    month: p({
      matchPatterns: ae,
      defaultMatchWidth: 'wide',
      parsePatterns: oe,
      defaultParseWidth: 'any',
    }),
    day: p({
      matchPatterns: ie,
      defaultMatchWidth: 'wide',
      parsePatterns: se,
      defaultParseWidth: 'any',
    }),
    dayPeriod: p({
      matchPatterns: ue,
      defaultMatchWidth: 'any',
      parsePatterns: ce,
      defaultParseWidth: 'any',
    }),
  },
  dt = {
    code: 'en-US',
    formatDistance: Ct,
    formatLong: Xt,
    formatRelative: Qt,
    localize: Jt,
    match: de,
    options: { weekStartsOn: 0, firstWeekContainsDate: 1 },
  }
function fe(t) {
  const e = d(t)
  return st(e, Nt(e)) + 1
}
function he(t) {
  const e = d(t),
    n = +X(e) - +Pt(e)
  return Math.round(n / ot) + 1
}
function ft(t, e) {
  const n = d(t),
    r = n.getFullYear(),
    a = C(),
    o =
      e?.firstWeekContainsDate ??
      e?.locale?.options?.firstWeekContainsDate ??
      a.firstWeekContainsDate ??
      a.locale?.options?.firstWeekContainsDate ??
      1,
    i = b(t, 0)
  ;(i.setFullYear(r + 1, 0, o), i.setHours(0, 0, 0, 0))
  const s = N(i, e),
    u = b(t, 0)
  ;(u.setFullYear(r, 0, o), u.setHours(0, 0, 0, 0))
  const g = N(u, e)
  return n.getTime() >= s.getTime() ? r + 1 : n.getTime() >= g.getTime() ? r : r - 1
}
function le(t, e) {
  const n = C(),
    r =
      e?.firstWeekContainsDate ??
      e?.locale?.options?.firstWeekContainsDate ??
      n.firstWeekContainsDate ??
      n.locale?.options?.firstWeekContainsDate ??
      1,
    a = ft(t, e),
    o = b(t, 0)
  return (o.setFullYear(a, 0, r), o.setHours(0, 0, 0, 0), N(o, e))
}
function me(t, e) {
  const n = d(t),
    r = +N(n, e) - +le(n, e)
  return Math.round(r / ot) + 1
}
function h(t, e) {
  const n = t < 0 ? '-' : '',
    r = Math.abs(t).toString().padStart(e, '0')
  return n + r
}
const P = {
    y(t, e) {
      const n = t.getFullYear(),
        r = n > 0 ? n : 1 - n
      return h(e === 'yy' ? r % 100 : r, e.length)
    },
    M(t, e) {
      const n = t.getMonth()
      return e === 'M' ? String(n + 1) : h(n + 1, 2)
    },
    d(t, e) {
      return h(t.getDate(), e.length)
    },
    a(t, e) {
      const n = t.getHours() / 12 >= 1 ? 'pm' : 'am'
      switch (e) {
        case 'a':
        case 'aa':
          return n.toUpperCase()
        case 'aaa':
          return n
        case 'aaaaa':
          return n[0]
        case 'aaaa':
        default:
          return n === 'am' ? 'a.m.' : 'p.m.'
      }
    },
    h(t, e) {
      return h(t.getHours() % 12 || 12, e.length)
    },
    H(t, e) {
      return h(t.getHours(), e.length)
    },
    m(t, e) {
      return h(t.getMinutes(), e.length)
    },
    s(t, e) {
      return h(t.getSeconds(), e.length)
    },
    S(t, e) {
      const n = e.length,
        r = t.getMilliseconds(),
        a = Math.trunc(r * Math.pow(10, n - 3))
      return h(a, e.length)
    },
  },
  x = {
    midnight: 'midnight',
    noon: 'noon',
    morning: 'morning',
    afternoon: 'afternoon',
    evening: 'evening',
    night: 'night',
  },
  J = {
    G: function (t, e, n) {
      const r = t.getFullYear() > 0 ? 1 : 0
      switch (e) {
        case 'G':
        case 'GG':
        case 'GGG':
          return n.era(r, { width: 'abbreviated' })
        case 'GGGGG':
          return n.era(r, { width: 'narrow' })
        case 'GGGG':
        default:
          return n.era(r, { width: 'wide' })
      }
    },
    y: function (t, e, n) {
      if (e === 'yo') {
        const r = t.getFullYear(),
          a = r > 0 ? r : 1 - r
        return n.ordinalNumber(a, { unit: 'year' })
      }
      return P.y(t, e)
    },
    Y: function (t, e, n, r) {
      const a = ft(t, r),
        o = a > 0 ? a : 1 - a
      if (e === 'YY') {
        const i = o % 100
        return h(i, 2)
      }
      return e === 'Yo' ? n.ordinalNumber(o, { unit: 'year' }) : h(o, e.length)
    },
    R: function (t, e) {
      const n = it(t)
      return h(n, e.length)
    },
    u: function (t, e) {
      const n = t.getFullYear()
      return h(n, e.length)
    },
    Q: function (t, e, n) {
      const r = Math.ceil((t.getMonth() + 1) / 3)
      switch (e) {
        case 'Q':
          return String(r)
        case 'QQ':
          return h(r, 2)
        case 'Qo':
          return n.ordinalNumber(r, { unit: 'quarter' })
        case 'QQQ':
          return n.quarter(r, { width: 'abbreviated', context: 'formatting' })
        case 'QQQQQ':
          return n.quarter(r, { width: 'narrow', context: 'formatting' })
        case 'QQQQ':
        default:
          return n.quarter(r, { width: 'wide', context: 'formatting' })
      }
    },
    q: function (t, e, n) {
      const r = Math.ceil((t.getMonth() + 1) / 3)
      switch (e) {
        case 'q':
          return String(r)
        case 'qq':
          return h(r, 2)
        case 'qo':
          return n.ordinalNumber(r, { unit: 'quarter' })
        case 'qqq':
          return n.quarter(r, { width: 'abbreviated', context: 'standalone' })
        case 'qqqqq':
          return n.quarter(r, { width: 'narrow', context: 'standalone' })
        case 'qqqq':
        default:
          return n.quarter(r, { width: 'wide', context: 'standalone' })
      }
    },
    M: function (t, e, n) {
      const r = t.getMonth()
      switch (e) {
        case 'M':
        case 'MM':
          return P.M(t, e)
        case 'Mo':
          return n.ordinalNumber(r + 1, { unit: 'month' })
        case 'MMM':
          return n.month(r, { width: 'abbreviated', context: 'formatting' })
        case 'MMMMM':
          return n.month(r, { width: 'narrow', context: 'formatting' })
        case 'MMMM':
        default:
          return n.month(r, { width: 'wide', context: 'formatting' })
      }
    },
    L: function (t, e, n) {
      const r = t.getMonth()
      switch (e) {
        case 'L':
          return String(r + 1)
        case 'LL':
          return h(r + 1, 2)
        case 'Lo':
          return n.ordinalNumber(r + 1, { unit: 'month' })
        case 'LLL':
          return n.month(r, { width: 'abbreviated', context: 'standalone' })
        case 'LLLLL':
          return n.month(r, { width: 'narrow', context: 'standalone' })
        case 'LLLL':
        default:
          return n.month(r, { width: 'wide', context: 'standalone' })
      }
    },
    w: function (t, e, n, r) {
      const a = me(t, r)
      return e === 'wo' ? n.ordinalNumber(a, { unit: 'week' }) : h(a, e.length)
    },
    I: function (t, e, n) {
      const r = he(t)
      return e === 'Io' ? n.ordinalNumber(r, { unit: 'week' }) : h(r, e.length)
    },
    d: function (t, e, n) {
      return e === 'do' ? n.ordinalNumber(t.getDate(), { unit: 'date' }) : P.d(t, e)
    },
    D: function (t, e, n) {
      const r = fe(t)
      return e === 'Do' ? n.ordinalNumber(r, { unit: 'dayOfYear' }) : h(r, e.length)
    },
    E: function (t, e, n) {
      const r = t.getDay()
      switch (e) {
        case 'E':
        case 'EE':
        case 'EEE':
          return n.day(r, { width: 'abbreviated', context: 'formatting' })
        case 'EEEEE':
          return n.day(r, { width: 'narrow', context: 'formatting' })
        case 'EEEEEE':
          return n.day(r, { width: 'short', context: 'formatting' })
        case 'EEEE':
        default:
          return n.day(r, { width: 'wide', context: 'formatting' })
      }
    },
    e: function (t, e, n, r) {
      const a = t.getDay(),
        o = (a - r.weekStartsOn + 8) % 7 || 7
      switch (e) {
        case 'e':
          return String(o)
        case 'ee':
          return h(o, 2)
        case 'eo':
          return n.ordinalNumber(o, { unit: 'day' })
        case 'eee':
          return n.day(a, { width: 'abbreviated', context: 'formatting' })
        case 'eeeee':
          return n.day(a, { width: 'narrow', context: 'formatting' })
        case 'eeeeee':
          return n.day(a, { width: 'short', context: 'formatting' })
        case 'eeee':
        default:
          return n.day(a, { width: 'wide', context: 'formatting' })
      }
    },
    c: function (t, e, n, r) {
      const a = t.getDay(),
        o = (a - r.weekStartsOn + 8) % 7 || 7
      switch (e) {
        case 'c':
          return String(o)
        case 'cc':
          return h(o, e.length)
        case 'co':
          return n.ordinalNumber(o, { unit: 'day' })
        case 'ccc':
          return n.day(a, { width: 'abbreviated', context: 'standalone' })
        case 'ccccc':
          return n.day(a, { width: 'narrow', context: 'standalone' })
        case 'cccccc':
          return n.day(a, { width: 'short', context: 'standalone' })
        case 'cccc':
        default:
          return n.day(a, { width: 'wide', context: 'standalone' })
      }
    },
    i: function (t, e, n) {
      const r = t.getDay(),
        a = r === 0 ? 7 : r
      switch (e) {
        case 'i':
          return String(a)
        case 'ii':
          return h(a, e.length)
        case 'io':
          return n.ordinalNumber(a, { unit: 'day' })
        case 'iii':
          return n.day(r, { width: 'abbreviated', context: 'formatting' })
        case 'iiiii':
          return n.day(r, { width: 'narrow', context: 'formatting' })
        case 'iiiiii':
          return n.day(r, { width: 'short', context: 'formatting' })
        case 'iiii':
        default:
          return n.day(r, { width: 'wide', context: 'formatting' })
      }
    },
    a: function (t, e, n) {
      const a = t.getHours() / 12 >= 1 ? 'pm' : 'am'
      switch (e) {
        case 'a':
        case 'aa':
          return n.dayPeriod(a, { width: 'abbreviated', context: 'formatting' })
        case 'aaa':
          return n.dayPeriod(a, { width: 'abbreviated', context: 'formatting' }).toLowerCase()
        case 'aaaaa':
          return n.dayPeriod(a, { width: 'narrow', context: 'formatting' })
        case 'aaaa':
        default:
          return n.dayPeriod(a, { width: 'wide', context: 'formatting' })
      }
    },
    b: function (t, e, n) {
      const r = t.getHours()
      let a
      switch (
        (r === 12 ? (a = x.noon) : r === 0 ? (a = x.midnight) : (a = r / 12 >= 1 ? 'pm' : 'am'), e)
      ) {
        case 'b':
        case 'bb':
          return n.dayPeriod(a, { width: 'abbreviated', context: 'formatting' })
        case 'bbb':
          return n.dayPeriod(a, { width: 'abbreviated', context: 'formatting' }).toLowerCase()
        case 'bbbbb':
          return n.dayPeriod(a, { width: 'narrow', context: 'formatting' })
        case 'bbbb':
        default:
          return n.dayPeriod(a, { width: 'wide', context: 'formatting' })
      }
    },
    B: function (t, e, n) {
      const r = t.getHours()
      let a
      switch (
        (r >= 17
          ? (a = x.evening)
          : r >= 12
            ? (a = x.afternoon)
            : r >= 4
              ? (a = x.morning)
              : (a = x.night),
        e)
      ) {
        case 'B':
        case 'BB':
        case 'BBB':
          return n.dayPeriod(a, { width: 'abbreviated', context: 'formatting' })
        case 'BBBBB':
          return n.dayPeriod(a, { width: 'narrow', context: 'formatting' })
        case 'BBBB':
        default:
          return n.dayPeriod(a, { width: 'wide', context: 'formatting' })
      }
    },
    h: function (t, e, n) {
      if (e === 'ho') {
        let r = t.getHours() % 12
        return (r === 0 && (r = 12), n.ordinalNumber(r, { unit: 'hour' }))
      }
      return P.h(t, e)
    },
    H: function (t, e, n) {
      return e === 'Ho' ? n.ordinalNumber(t.getHours(), { unit: 'hour' }) : P.H(t, e)
    },
    K: function (t, e, n) {
      const r = t.getHours() % 12
      return e === 'Ko' ? n.ordinalNumber(r, { unit: 'hour' }) : h(r, e.length)
    },
    k: function (t, e, n) {
      let r = t.getHours()
      return (
        r === 0 && (r = 24),
        e === 'ko' ? n.ordinalNumber(r, { unit: 'hour' }) : h(r, e.length)
      )
    },
    m: function (t, e, n) {
      return e === 'mo' ? n.ordinalNumber(t.getMinutes(), { unit: 'minute' }) : P.m(t, e)
    },
    s: function (t, e, n) {
      return e === 'so' ? n.ordinalNumber(t.getSeconds(), { unit: 'second' }) : P.s(t, e)
    },
    S: function (t, e) {
      return P.S(t, e)
    },
    X: function (t, e, n) {
      const r = t.getTimezoneOffset()
      if (r === 0) return 'Z'
      switch (e) {
        case 'X':
          return U(r)
        case 'XXXX':
        case 'XX':
          return v(r)
        case 'XXXXX':
        case 'XXX':
        default:
          return v(r, ':')
      }
    },
    x: function (t, e, n) {
      const r = t.getTimezoneOffset()
      switch (e) {
        case 'x':
          return U(r)
        case 'xxxx':
        case 'xx':
          return v(r)
        case 'xxxxx':
        case 'xxx':
        default:
          return v(r, ':')
      }
    },
    O: function (t, e, n) {
      const r = t.getTimezoneOffset()
      switch (e) {
        case 'O':
        case 'OO':
        case 'OOO':
          return 'GMT' + z(r, ':')
        case 'OOOO':
        default:
          return 'GMT' + v(r, ':')
      }
    },
    z: function (t, e, n) {
      const r = t.getTimezoneOffset()
      switch (e) {
        case 'z':
        case 'zz':
        case 'zzz':
          return 'GMT' + z(r, ':')
        case 'zzzz':
        default:
          return 'GMT' + v(r, ':')
      }
    },
    t: function (t, e, n) {
      const r = Math.trunc(t.getTime() / 1e3)
      return h(r, e.length)
    },
    T: function (t, e, n) {
      const r = t.getTime()
      return h(r, e.length)
    },
  }
function z(t, e = '') {
  const n = t > 0 ? '-' : '+',
    r = Math.abs(t),
    a = Math.trunc(r / 60),
    o = r % 60
  return o === 0 ? n + String(a) : n + String(a) + e + h(o, 2)
}
function U(t, e) {
  return t % 60 === 0 ? (t > 0 ? '-' : '+') + h(Math.abs(t) / 60, 2) : v(t, e)
}
function v(t, e = '') {
  const n = t > 0 ? '-' : '+',
    r = Math.abs(t),
    a = h(Math.trunc(r / 60), 2),
    o = h(r % 60, 2)
  return n + a + e + o
}
const K = (t, e) => {
    switch (t) {
      case 'P':
        return e.date({ width: 'short' })
      case 'PP':
        return e.date({ width: 'medium' })
      case 'PPP':
        return e.date({ width: 'long' })
      case 'PPPP':
      default:
        return e.date({ width: 'full' })
    }
  },
  ht = (t, e) => {
    switch (t) {
      case 'p':
        return e.time({ width: 'short' })
      case 'pp':
        return e.time({ width: 'medium' })
      case 'ppp':
        return e.time({ width: 'long' })
      case 'pppp':
      default:
        return e.time({ width: 'full' })
    }
  },
  ge = (t, e) => {
    const n = t.match(/(P+)(p+)?/) || [],
      r = n[1],
      a = n[2]
    if (!a) return K(t, e)
    let o
    switch (r) {
      case 'P':
        o = e.dateTime({ width: 'short' })
        break
      case 'PP':
        o = e.dateTime({ width: 'medium' })
        break
      case 'PPP':
        o = e.dateTime({ width: 'long' })
        break
      case 'PPPP':
      default:
        o = e.dateTime({ width: 'full' })
        break
    }
    return o.replace('{{date}}', K(r, e)).replace('{{time}}', ht(a, e))
  },
  we = { p: ht, P: ge },
  ye = /^D+$/,
  be = /^Y+$/,
  Me = ['D', 'DD', 'YY', 'YYYY']
function pe(t) {
  return ye.test(t)
}
function De(t) {
  return be.test(t)
}
function Pe(t, e, n) {
  const r = Oe(t, e, n)
  if ((console.warn(r), Me.includes(t))) throw new RangeError(r)
}
function Oe(t, e, n) {
  const r = t[0] === 'Y' ? 'years' : 'days of the month'
  return `Use \`${t.toLowerCase()}\` instead of \`${t}\` (in \`${e}\`) for formatting ${r} to the input \`${n}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`
}
const ve = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g,
  ke = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g,
  We = /^'([^]*?)'?$/,
  xe = /''/g,
  Te = /[a-zA-Z]/
function Mr(t, e, n) {
  const r = C(),
    a = n?.locale ?? r.locale ?? dt,
    o =
      n?.firstWeekContainsDate ??
      n?.locale?.options?.firstWeekContainsDate ??
      r.firstWeekContainsDate ??
      r.locale?.options?.firstWeekContainsDate ??
      1,
    i =
      n?.weekStartsOn ??
      n?.locale?.options?.weekStartsOn ??
      r.weekStartsOn ??
      r.locale?.options?.weekStartsOn ??
      0,
    s = d(t)
  if (!vt(s)) throw new RangeError('Invalid time value')
  let u = e
    .match(ke)
    .map((f) => {
      const c = f[0]
      if (c === 'p' || c === 'P') {
        const w = we[c]
        return w(f, a.formatLong)
      }
      return f
    })
    .join('')
    .match(ve)
    .map((f) => {
      if (f === "''") return { isToken: !1, value: "'" }
      const c = f[0]
      if (c === "'") return { isToken: !1, value: Ye(f) }
      if (J[c]) return { isToken: !0, value: f }
      if (c.match(Te))
        throw new RangeError(
          'Format string contains an unescaped latin alphabet character `' + c + '`',
        )
      return { isToken: !1, value: f }
    })
  a.localize.preprocessor && (u = a.localize.preprocessor(s, u))
  const g = { firstWeekContainsDate: o, weekStartsOn: i, locale: a }
  return u
    .map((f) => {
      if (!f.isToken) return f.value
      const c = f.value
      ;((!n?.useAdditionalWeekYearTokens && De(c)) ||
        (!n?.useAdditionalDayOfYearTokens && pe(c))) &&
        Pe(c, e, String(t))
      const w = J[c[0]]
      return w(s, c, a.localize, g)
    })
    .join('')
}
function Ye(t) {
  const e = t.match(We)
  return e ? e[1].replace(xe, "'") : t
}
function Se(t, e, n) {
  const r = C(),
    a = n?.locale ?? r.locale ?? dt,
    o = 2520,
    i = q(t, e)
  if (isNaN(i)) throw new RangeError('Invalid time value')
  const s = Object.assign({}, n, { addSuffix: n?.addSuffix, comparison: i })
  let u, g
  i > 0 ? ((u = d(e)), (g = d(t))) : ((u = d(t)), (g = d(e)))
  const f = Ft(g, u),
    c = (Q(g) - Q(u)) / 1e3,
    w = Math.round((f - c) / 60)
  let W
  if (w < 2)
    return n?.includeSeconds
      ? f < 5
        ? a.formatDistance('lessThanXSeconds', 5, s)
        : f < 10
          ? a.formatDistance('lessThanXSeconds', 10, s)
          : f < 20
            ? a.formatDistance('lessThanXSeconds', 20, s)
            : f < 40
              ? a.formatDistance('halfAMinute', 0, s)
              : f < 60
                ? a.formatDistance('lessThanXMinutes', 1, s)
                : a.formatDistance('xMinutes', 1, s)
      : w === 0
        ? a.formatDistance('lessThanXMinutes', 1, s)
        : a.formatDistance('xMinutes', w, s)
  if (w < 45) return a.formatDistance('xMinutes', w, s)
  if (w < 90) return a.formatDistance('aboutXHours', 1, s)
  if (w < B) {
    const D = Math.round(w / 60)
    return a.formatDistance('aboutXHours', D, s)
  } else {
    if (w < o) return a.formatDistance('xDays', 1, s)
    if (w < _) {
      const D = Math.round(w / B)
      return a.formatDistance('xDays', D, s)
    } else if (w < _ * 2) return ((W = Math.round(w / _)), a.formatDistance('aboutXMonths', W, s))
  }
  if (((W = $t(g, u)), W < 12)) {
    const D = Math.round(w / _)
    return a.formatDistance('xMonths', D, s)
  } else {
    const D = W % 12,
      R = Math.trunc(W / 12)
    return D < 3
      ? a.formatDistance('aboutXYears', R, s)
      : D < 9
        ? a.formatDistance('overXYears', R, s)
        : a.formatDistance('almostXYears', R + 1, s)
  }
}
function pr(t, e) {
  return Se(t, G(t), e)
}
function Dr(t) {
  return +d(t) > Date.now()
}
function Pr(t) {
  return +d(t) < Date.now()
}
function Or(t, e) {
  const n = d(t),
    r = d(e)
  return n.getFullYear() === r.getFullYear() && n.getMonth() === r.getMonth()
}
function vr(t) {
  return ut(t, G(t))
}
function kr(t) {
  return ut(t, bt(G(t), 1))
}
function Wr(t, e) {
  return Mt(t, -1)
}
const $e = {
    lessThanXSeconds: {
      one: 'أقل من ثانية',
      two: 'أقل من ثانيتين',
      threeToTen: 'أقل من {{count}} ثواني',
      other: 'أقل من {{count}} ثانية',
    },
    xSeconds: {
      one: 'ثانية واحدة',
      two: 'ثانيتان',
      threeToTen: '{{count}} ثواني',
      other: '{{count}} ثانية',
    },
    halfAMinute: 'نصف دقيقة',
    lessThanXMinutes: {
      one: 'أقل من دقيقة',
      two: 'أقل من دقيقتين',
      threeToTen: 'أقل من {{count}} دقائق',
      other: 'أقل من {{count}} دقيقة',
    },
    xMinutes: {
      one: 'دقيقة واحدة',
      two: 'دقيقتان',
      threeToTen: '{{count}} دقائق',
      other: '{{count}} دقيقة',
    },
    aboutXHours: {
      one: 'ساعة واحدة تقريباً',
      two: 'ساعتين تقريبا',
      threeToTen: '{{count}} ساعات تقريباً',
      other: '{{count}} ساعة تقريباً',
    },
    xHours: {
      one: 'ساعة واحدة',
      two: 'ساعتان',
      threeToTen: '{{count}} ساعات',
      other: '{{count}} ساعة',
    },
    xDays: { one: 'يوم واحد', two: 'يومان', threeToTen: '{{count}} أيام', other: '{{count}} يوم' },
    aboutXWeeks: {
      one: 'أسبوع واحد تقريبا',
      two: 'أسبوعين تقريبا',
      threeToTen: '{{count}} أسابيع تقريبا',
      other: '{{count}} أسبوعا تقريبا',
    },
    xWeeks: {
      one: 'أسبوع واحد',
      two: 'أسبوعان',
      threeToTen: '{{count}} أسابيع',
      other: '{{count}} أسبوعا',
    },
    aboutXMonths: {
      one: 'شهر واحد تقريباً',
      two: 'شهرين تقريبا',
      threeToTen: '{{count}} أشهر تقريبا',
      other: '{{count}} شهرا تقريباً',
    },
    xMonths: {
      one: 'شهر واحد',
      two: 'شهران',
      threeToTen: '{{count}} أشهر',
      other: '{{count}} شهرا',
    },
    aboutXYears: {
      one: 'سنة واحدة تقريباً',
      two: 'سنتين تقريبا',
      threeToTen: '{{count}} سنوات تقريباً',
      other: '{{count}} سنة تقريباً',
    },
    xYears: {
      one: 'سنة واحد',
      two: 'سنتان',
      threeToTen: '{{count}} سنوات',
      other: '{{count}} سنة',
    },
    overXYears: {
      one: 'أكثر من سنة',
      two: 'أكثر من سنتين',
      threeToTen: 'أكثر من {{count}} سنوات',
      other: 'أكثر من {{count}} سنة',
    },
    almostXYears: {
      one: 'ما يقارب سنة واحدة',
      two: 'ما يقارب سنتين',
      threeToTen: 'ما يقارب {{count}} سنوات',
      other: 'ما يقارب {{count}} سنة',
    },
  },
  Fe = (t, e, n) => {
    const r = $e[t]
    let a
    return (
      typeof r == 'string'
        ? (a = r)
        : e === 1
          ? (a = r.one)
          : e === 2
            ? (a = r.two)
            : e <= 10
              ? (a = r.threeToTen.replace('{{count}}', String(e)))
              : (a = r.other.replace('{{count}}', String(e))),
      n?.addSuffix ? (n.comparison && n.comparison > 0 ? 'خلال ' + a : 'منذ ' + a) : a
    )
  },
  Ne = { full: 'EEEE، do MMMM y', long: 'do MMMM y', medium: 'd MMM y', short: 'dd/MM/yyyy' },
  Ee = { full: 'HH:mm:ss', long: 'HH:mm:ss', medium: 'HH:mm:ss', short: 'HH:mm' },
  Ce = {
    full: "{{date}} 'عند الساعة' {{time}}",
    long: "{{date}} 'عند الساعة' {{time}}",
    medium: '{{date}}, {{time}}',
    short: '{{date}}, {{time}}',
  },
  He = {
    date: Y({ formats: Ne, defaultWidth: 'full' }),
    time: Y({ formats: Ee, defaultWidth: 'full' }),
    dateTime: Y({ formats: Ce, defaultWidth: 'full' }),
  },
  _e = {
    lastWeek: "eeee 'الماضي عند الساعة' p",
    yesterday: "'الأمس عند الساعة' p",
    today: "'اليوم عند الساعة' p",
    tomorrow: "'غدا عند الساعة' p",
    nextWeek: "eeee 'القادم عند الساعة' p",
    other: 'P',
  },
  qe = (t) => _e[t],
  Xe = { narrow: ['ق', 'ب'], abbreviated: ['ق.م.', 'ب.م.'], wide: ['قبل الميلاد', 'بعد الميلاد'] },
  Le = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['ر1', 'ر2', 'ر3', 'ر4'],
    wide: ['الربع الأول', 'الربع الثاني', 'الربع الثالث', 'الربع الرابع'],
  },
  Qe = {
    narrow: ['ي', 'ف', 'م', 'أ', 'م', 'ي', 'ي', 'أ', 'س', 'أ', 'ن', 'د'],
    abbreviated: [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ],
    wide: [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ],
  },
  Ie = {
    narrow: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
    short: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
    abbreviated: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
    wide: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  },
  je = {
    narrow: {
      am: 'ص',
      pm: 'م',
      morning: 'الصباح',
      noon: 'الظهر',
      afternoon: 'بعد الظهر',
      evening: 'المساء',
      night: 'الليل',
      midnight: 'منتصف الليل',
    },
    abbreviated: {
      am: 'ص',
      pm: 'م',
      morning: 'الصباح',
      noon: 'الظهر',
      afternoon: 'بعد الظهر',
      evening: 'المساء',
      night: 'الليل',
      midnight: 'منتصف الليل',
    },
    wide: {
      am: 'ص',
      pm: 'م',
      morning: 'الصباح',
      noon: 'الظهر',
      afternoon: 'بعد الظهر',
      evening: 'المساء',
      night: 'الليل',
      midnight: 'منتصف الليل',
    },
  },
  Re = {
    narrow: {
      am: 'ص',
      pm: 'م',
      morning: 'في الصباح',
      noon: 'الظهر',
      afternoon: 'بعد الظهر',
      evening: 'في المساء',
      night: 'في الليل',
      midnight: 'منتصف الليل',
    },
    abbreviated: {
      am: 'ص',
      pm: 'م',
      morning: 'في الصباح',
      noon: 'الظهر',
      afternoon: 'بعد الظهر',
      evening: 'في المساء',
      night: 'في الليل',
      midnight: 'منتصف الليل',
    },
    wide: {
      am: 'ص',
      pm: 'م',
      morning: 'في الصباح',
      noon: 'الظهر',
      afternoon: 'بعد الظهر',
      evening: 'في المساء',
      night: 'في الليل',
      midnight: 'منتصف الليل',
    },
  },
  Ae = (t) => String(t),
  Ge = {
    ordinalNumber: Ae,
    era: M({ values: Xe, defaultWidth: 'wide' }),
    quarter: M({ values: Le, defaultWidth: 'wide', argumentCallback: (t) => t - 1 }),
    month: M({ values: Qe, defaultWidth: 'wide' }),
    day: M({ values: Ie, defaultWidth: 'wide' }),
    dayPeriod: M({
      values: je,
      defaultWidth: 'wide',
      formattingValues: Re,
      defaultFormattingWidth: 'wide',
    }),
  },
  Be = /^(\d+)(th|st|nd|rd)?/i,
  Ve = /\d+/i,
  Je = { narrow: /[قب]/, abbreviated: /[قب]\.م\./, wide: /(قبل|بعد) الميلاد/ },
  ze = { any: [/قبل/, /بعد/] },
  Ue = { narrow: /^[1234]/i, abbreviated: /ر[1234]/, wide: /الربع (الأول|الثاني|الثالث|الرابع)/ },
  Ke = { any: [/1/i, /2/i, /3/i, /4/i] },
  Ze = {
    narrow: /^[أيفمسند]/,
    abbreviated: /^(يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)/,
    wide: /^(يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)/,
  },
  tn = {
    narrow: [/^ي/i, /^ف/i, /^م/i, /^أ/i, /^م/i, /^ي/i, /^ي/i, /^أ/i, /^س/i, /^أ/i, /^ن/i, /^د/i],
    any: [
      /^يناير/i,
      /^فبراير/i,
      /^مارس/i,
      /^أبريل/i,
      /^مايو/i,
      /^يونيو/i,
      /^يوليو/i,
      /^أغسطس/i,
      /^سبتمبر/i,
      /^أكتوبر/i,
      /^نوفمبر/i,
      /^ديسمبر/i,
    ],
  },
  en = {
    narrow: /^[حنثرخجس]/i,
    short: /^(أحد|اثنين|ثلاثاء|أربعاء|خميس|جمعة|سبت)/i,
    abbreviated: /^(أحد|اثنين|ثلاثاء|أربعاء|خميس|جمعة|سبت)/i,
    wide: /^(الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت)/i,
  },
  nn = {
    narrow: [/^ح/i, /^ن/i, /^ث/i, /^ر/i, /^خ/i, /^ج/i, /^س/i],
    wide: [/^الأحد/i, /^الاثنين/i, /^الثلاثاء/i, /^الأربعاء/i, /^الخميس/i, /^الجمعة/i, /^السبت/i],
    any: [/^أح/i, /^اث/i, /^ث/i, /^أر/i, /^خ/i, /^ج/i, /^س/i],
  },
  rn = {
    narrow: /^(ص|م|منتصف الليل|الظهر|بعد الظهر|في الصباح|في المساء|في الليل)/,
    any: /^(ص|م|منتصف الليل|الظهر|بعد الظهر|في الصباح|في المساء|في الليل)/,
  },
  an = {
    any: {
      am: /^ص/,
      pm: /^م/,
      midnight: /منتصف الليل/,
      noon: /الظهر/,
      afternoon: /بعد الظهر/,
      morning: /في الصباح/,
      evening: /في المساء/,
      night: /في الليل/,
    },
  },
  on = {
    ordinalNumber: ct({
      matchPattern: Be,
      parsePattern: Ve,
      valueCallback: (t) => parseInt(t, 10),
    }),
    era: p({
      matchPatterns: Je,
      defaultMatchWidth: 'wide',
      parsePatterns: ze,
      defaultParseWidth: 'any',
    }),
    quarter: p({
      matchPatterns: Ue,
      defaultMatchWidth: 'wide',
      parsePatterns: Ke,
      defaultParseWidth: 'any',
      valueCallback: (t) => t + 1,
    }),
    month: p({
      matchPatterns: Ze,
      defaultMatchWidth: 'wide',
      parsePatterns: tn,
      defaultParseWidth: 'any',
    }),
    day: p({
      matchPatterns: en,
      defaultMatchWidth: 'wide',
      parsePatterns: nn,
      defaultParseWidth: 'any',
    }),
    dayPeriod: p({
      matchPatterns: rn,
      defaultMatchWidth: 'any',
      parsePatterns: an,
      defaultParseWidth: 'any',
    }),
  },
  xr = {
    code: 'ar',
    formatDistance: Fe,
    formatLong: He,
    formatRelative: qe,
    localize: Ge,
    match: on,
    options: { weekStartsOn: 6, firstWeekContainsDate: 1 },
  },
  lt = 6048e5,
  sn = 864e5,
  Z = Symbol.for('constructDateFrom')
function y(t, e) {
  return typeof t == 'function'
    ? t(e)
    : t && typeof t == 'object' && Z in t
      ? t[Z](e)
      : t instanceof Date
        ? new t.constructor(e)
        : new Date(e)
}
function m(t, e) {
  return y(e || t, t)
}
function un(t, e, n) {
  const r = m(t, n?.in)
  return isNaN(e) ? y(t, NaN) : (e && r.setDate(r.getDate() + e), r)
}
function cn(t, e, n) {
  const r = m(t, n?.in)
  if (isNaN(e)) return y(t, NaN)
  if (!e) return r
  const a = r.getDate(),
    o = y(t, r.getTime())
  o.setMonth(r.getMonth() + e + 1, 0)
  const i = o.getDate()
  return a >= i ? o : (r.setFullYear(o.getFullYear(), o.getMonth(), a), r)
}
let dn = {}
function H() {
  return dn
}
function E(t, e) {
  const n = H(),
    r =
      e?.weekStartsOn ??
      e?.locale?.options?.weekStartsOn ??
      n.weekStartsOn ??
      n.locale?.options?.weekStartsOn ??
      0,
    a = m(t, e?.in),
    o = a.getDay(),
    i = (o < r ? 7 : 0) + o - r
  return (a.setDate(a.getDate() - i), a.setHours(0, 0, 0, 0), a)
}
function I(t, e) {
  return E(t, { ...e, weekStartsOn: 1 })
}
function mt(t, e) {
  const n = m(t, e?.in),
    r = n.getFullYear(),
    a = y(n, 0)
  ;(a.setFullYear(r + 1, 0, 4), a.setHours(0, 0, 0, 0))
  const o = I(a),
    i = y(n, 0)
  ;(i.setFullYear(r, 0, 4), i.setHours(0, 0, 0, 0))
  const s = I(i)
  return n.getTime() >= o.getTime() ? r + 1 : n.getTime() >= s.getTime() ? r : r - 1
}
function tt(t) {
  const e = m(t),
    n = new Date(
      Date.UTC(
        e.getFullYear(),
        e.getMonth(),
        e.getDate(),
        e.getHours(),
        e.getMinutes(),
        e.getSeconds(),
        e.getMilliseconds(),
      ),
    )
  return (n.setUTCFullYear(e.getFullYear()), +t - +n)
}
function S(t, ...e) {
  const n = y.bind(
    null,
    e.find((r) => typeof r == 'object'),
  )
  return e.map(n)
}
function j(t, e) {
  const n = m(t, e?.in)
  return (n.setHours(0, 0, 0, 0), n)
}
function fn(t, e, n) {
  const [r, a] = S(n?.in, t, e),
    o = j(r),
    i = j(a),
    s = +o - tt(o),
    u = +i - tt(i)
  return Math.round((s - u) / sn)
}
function hn(t, e) {
  const n = mt(t, e),
    r = y(t, 0)
  return (r.setFullYear(n, 0, 4), r.setHours(0, 0, 0, 0), I(r))
}
function Tr(t, e, n) {
  return un(t, e * 7, n)
}
function Yr(t, e, n) {
  return cn(t, e * 12, n)
}
function Sr(t, e) {
  let n,
    r = e?.in
  return (
    t.forEach((a) => {
      !r && typeof a == 'object' && (r = y.bind(null, a))
      const o = m(a, r)
      ;(!n || n < o || isNaN(+o)) && (n = o)
    }),
    y(r, n || NaN)
  )
}
function $r(t, e) {
  let n,
    r = e?.in
  return (
    t.forEach((a) => {
      !r && typeof a == 'object' && (r = y.bind(null, a))
      const o = m(a, r)
      ;(!n || n > o || isNaN(+o)) && (n = o)
    }),
    y(r, n || NaN)
  )
}
function Fr(t, e, n) {
  const [r, a] = S(n?.in, t, e)
  return +j(r) == +j(a)
}
function ln(t) {
  return (
    t instanceof Date ||
    (typeof t == 'object' && Object.prototype.toString.call(t) === '[object Date]')
  )
}
function mn(t) {
  return !((!ln(t) && typeof t != 'number') || isNaN(+m(t)))
}
function Nr(t, e, n) {
  const [r, a] = S(n?.in, t, e),
    o = r.getFullYear() - a.getFullYear(),
    i = r.getMonth() - a.getMonth()
  return o * 12 + i
}
function Er(t, e) {
  const n = m(t, e?.in),
    r = n.getMonth()
  return (n.setFullYear(n.getFullYear(), r + 1, 0), n.setHours(23, 59, 59, 999), n)
}
function gt(t, e) {
  const [n, r] = S(t, e.start, e.end)
  return { start: n, end: r }
}
function Cr(t, e) {
  const { start: n, end: r } = gt(e?.in, t)
  let a = +n > +r
  const o = a ? +n : +r,
    i = a ? r : n
  ;(i.setHours(0, 0, 0, 0), i.setDate(1))
  let s = 1
  const u = []
  for (; +i <= o; ) (u.push(y(n, i)), i.setMonth(i.getMonth() + s))
  return a ? u.reverse() : u
}
function Hr(t, e) {
  const n = m(t, e?.in)
  return (n.setDate(1), n.setHours(0, 0, 0, 0), n)
}
function _r(t, e) {
  const n = m(t, e?.in),
    r = n.getFullYear()
  return (n.setFullYear(r + 1, 0, 0), n.setHours(23, 59, 59, 999), n)
}
function gn(t, e) {
  const n = m(t, e?.in)
  return (n.setFullYear(n.getFullYear(), 0, 1), n.setHours(0, 0, 0, 0), n)
}
function qr(t, e) {
  const { start: n, end: r } = gt(e?.in, t)
  let a = +n > +r
  const o = a ? +n : +r,
    i = a ? r : n
  ;(i.setHours(0, 0, 0, 0), i.setMonth(0, 1))
  let s = 1
  const u = []
  for (; +i <= o; ) (u.push(y(n, i)), i.setFullYear(i.getFullYear() + s))
  return a ? u.reverse() : u
}
function wn(t, e) {
  const n = H(),
    r =
      e?.weekStartsOn ??
      e?.locale?.options?.weekStartsOn ??
      n.weekStartsOn ??
      n.locale?.options?.weekStartsOn ??
      0,
    a = m(t, e?.in),
    o = a.getDay(),
    i = (o < r ? -7 : 0) + 6 - (o - r)
  return (a.setDate(a.getDate() + i), a.setHours(23, 59, 59, 999), a)
}
function Xr(t, e) {
  return wn(t, { ...e, weekStartsOn: 1 })
}
const yn = {
    lessThanXSeconds: { one: 'less than a second', other: 'less than {{count}} seconds' },
    xSeconds: { one: '1 second', other: '{{count}} seconds' },
    halfAMinute: 'half a minute',
    lessThanXMinutes: { one: 'less than a minute', other: 'less than {{count}} minutes' },
    xMinutes: { one: '1 minute', other: '{{count}} minutes' },
    aboutXHours: { one: 'about 1 hour', other: 'about {{count}} hours' },
    xHours: { one: '1 hour', other: '{{count}} hours' },
    xDays: { one: '1 day', other: '{{count}} days' },
    aboutXWeeks: { one: 'about 1 week', other: 'about {{count}} weeks' },
    xWeeks: { one: '1 week', other: '{{count}} weeks' },
    aboutXMonths: { one: 'about 1 month', other: 'about {{count}} months' },
    xMonths: { one: '1 month', other: '{{count}} months' },
    aboutXYears: { one: 'about 1 year', other: 'about {{count}} years' },
    xYears: { one: '1 year', other: '{{count}} years' },
    overXYears: { one: 'over 1 year', other: 'over {{count}} years' },
    almostXYears: { one: 'almost 1 year', other: 'almost {{count}} years' },
  },
  bn = (t, e, n) => {
    let r
    const a = yn[t]
    return (
      typeof a == 'string'
        ? (r = a)
        : e === 1
          ? (r = a.one)
          : (r = a.other.replace('{{count}}', e.toString())),
      n?.addSuffix ? (n.comparison && n.comparison > 0 ? 'in ' + r : r + ' ago') : r
    )
  }
function A(t) {
  return (e = {}) => {
    const n = e.width ? String(e.width) : t.defaultWidth
    return t.formats[n] || t.formats[t.defaultWidth]
  }
}
const Mn = {
    full: 'EEEE, MMMM do, y',
    long: 'MMMM do, y',
    medium: 'MMM d, y',
    short: 'MM/dd/yyyy',
  },
  pn = { full: 'h:mm:ss a zzzz', long: 'h:mm:ss a z', medium: 'h:mm:ss a', short: 'h:mm a' },
  Dn = {
    full: "{{date}} 'at' {{time}}",
    long: "{{date}} 'at' {{time}}",
    medium: '{{date}}, {{time}}',
    short: '{{date}}, {{time}}',
  },
  Pn = {
    date: A({ formats: Mn, defaultWidth: 'full' }),
    time: A({ formats: pn, defaultWidth: 'full' }),
    dateTime: A({ formats: Dn, defaultWidth: 'full' }),
  },
  On = {
    lastWeek: "'last' eeee 'at' p",
    yesterday: "'yesterday at' p",
    today: "'today at' p",
    tomorrow: "'tomorrow at' p",
    nextWeek: "eeee 'at' p",
    other: 'P',
  },
  vn = (t, e, n, r) => On[t]
function $(t) {
  return (e, n) => {
    const r = n?.context ? String(n.context) : 'standalone'
    let a
    if (r === 'formatting' && t.formattingValues) {
      const i = t.defaultFormattingWidth || t.defaultWidth,
        s = n?.width ? String(n.width) : i
      a = t.formattingValues[s] || t.formattingValues[i]
    } else {
      const i = t.defaultWidth,
        s = n?.width ? String(n.width) : t.defaultWidth
      a = t.values[s] || t.values[i]
    }
    const o = t.argumentCallback ? t.argumentCallback(e) : e
    return a[o]
  }
}
const kn = {
    narrow: ['B', 'A'],
    abbreviated: ['BC', 'AD'],
    wide: ['Before Christ', 'Anno Domini'],
  },
  Wn = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
    wide: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter'],
  },
  xn = {
    narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    abbreviated: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    wide: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
  },
  Tn = {
    narrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    short: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    abbreviated: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    wide: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  Yn = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'mi',
      noon: 'n',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night',
    },
    wide: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night',
    },
  },
  Sn = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'mi',
      noon: 'n',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night',
    },
    wide: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night',
    },
  },
  $n = (t, e) => {
    const n = Number(t),
      r = n % 100
    if (r > 20 || r < 10)
      switch (r % 10) {
        case 1:
          return n + 'st'
        case 2:
          return n + 'nd'
        case 3:
          return n + 'rd'
      }
    return n + 'th'
  },
  Fn = {
    ordinalNumber: $n,
    era: $({ values: kn, defaultWidth: 'wide' }),
    quarter: $({ values: Wn, defaultWidth: 'wide', argumentCallback: (t) => t - 1 }),
    month: $({ values: xn, defaultWidth: 'wide' }),
    day: $({ values: Tn, defaultWidth: 'wide' }),
    dayPeriod: $({
      values: Yn,
      defaultWidth: 'wide',
      formattingValues: Sn,
      defaultFormattingWidth: 'wide',
    }),
  }
function F(t) {
  return (e, n = {}) => {
    const r = n.width,
      a = (r && t.matchPatterns[r]) || t.matchPatterns[t.defaultMatchWidth],
      o = e.match(a)
    if (!o) return null
    const i = o[0],
      s = (r && t.parsePatterns[r]) || t.parsePatterns[t.defaultParseWidth],
      u = Array.isArray(s) ? En(s, (c) => c.test(i)) : Nn(s, (c) => c.test(i))
    let g
    ;((g = t.valueCallback ? t.valueCallback(u) : u),
      (g = n.valueCallback ? n.valueCallback(g) : g))
    const f = e.slice(i.length)
    return { value: g, rest: f }
  }
}
function Nn(t, e) {
  for (const n in t) if (Object.prototype.hasOwnProperty.call(t, n) && e(t[n])) return n
}
function En(t, e) {
  for (let n = 0; n < t.length; n++) if (e(t[n])) return n
}
function Cn(t) {
  return (e, n = {}) => {
    const r = e.match(t.matchPattern)
    if (!r) return null
    const a = r[0],
      o = e.match(t.parsePattern)
    if (!o) return null
    let i = t.valueCallback ? t.valueCallback(o[0]) : o[0]
    i = n.valueCallback ? n.valueCallback(i) : i
    const s = e.slice(a.length)
    return { value: i, rest: s }
  }
}
const Hn = /^(\d+)(th|st|nd|rd)?/i,
  _n = /\d+/i,
  qn = {
    narrow: /^(b|a)/i,
    abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
    wide: /^(before christ|before common era|anno domini|common era)/i,
  },
  Xn = { any: [/^b/i, /^(a|c)/i] },
  Ln = { narrow: /^[1234]/i, abbreviated: /^q[1234]/i, wide: /^[1234](th|st|nd|rd)? quarter/i },
  Qn = { any: [/1/i, /2/i, /3/i, /4/i] },
  In = {
    narrow: /^[jfmasond]/i,
    abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i,
  },
  jn = {
    narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
    any: [
      /^ja/i,
      /^f/i,
      /^mar/i,
      /^ap/i,
      /^may/i,
      /^jun/i,
      /^jul/i,
      /^au/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],
  },
  Rn = {
    narrow: /^[smtwf]/i,
    short: /^(su|mo|tu|we|th|fr|sa)/i,
    abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
    wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i,
  },
  An = {
    narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
    any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i],
  },
  Gn = {
    narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
    any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i,
  },
  Bn = {
    any: {
      am: /^a/i,
      pm: /^p/i,
      midnight: /^mi/i,
      noon: /^no/i,
      morning: /morning/i,
      afternoon: /afternoon/i,
      evening: /evening/i,
      night: /night/i,
    },
  },
  Vn = {
    ordinalNumber: Cn({
      matchPattern: Hn,
      parsePattern: _n,
      valueCallback: (t) => parseInt(t, 10),
    }),
    era: F({
      matchPatterns: qn,
      defaultMatchWidth: 'wide',
      parsePatterns: Xn,
      defaultParseWidth: 'any',
    }),
    quarter: F({
      matchPatterns: Ln,
      defaultMatchWidth: 'wide',
      parsePatterns: Qn,
      defaultParseWidth: 'any',
      valueCallback: (t) => t + 1,
    }),
    month: F({
      matchPatterns: In,
      defaultMatchWidth: 'wide',
      parsePatterns: jn,
      defaultParseWidth: 'any',
    }),
    day: F({
      matchPatterns: Rn,
      defaultMatchWidth: 'wide',
      parsePatterns: An,
      defaultParseWidth: 'any',
    }),
    dayPeriod: F({
      matchPatterns: Gn,
      defaultMatchWidth: 'any',
      parsePatterns: Bn,
      defaultParseWidth: 'any',
    }),
  },
  Jn = {
    code: 'en-US',
    formatDistance: bn,
    formatLong: Pn,
    formatRelative: vn,
    localize: Fn,
    match: Vn,
    options: { weekStartsOn: 0, firstWeekContainsDate: 1 },
  }
function zn(t, e) {
  const n = m(t, e?.in)
  return fn(n, gn(n)) + 1
}
function Un(t, e) {
  const n = m(t, e?.in),
    r = +I(n) - +hn(n)
  return Math.round(r / lt) + 1
}
function wt(t, e) {
  const n = m(t, e?.in),
    r = n.getFullYear(),
    a = H(),
    o =
      e?.firstWeekContainsDate ??
      e?.locale?.options?.firstWeekContainsDate ??
      a.firstWeekContainsDate ??
      a.locale?.options?.firstWeekContainsDate ??
      1,
    i = y(e?.in || t, 0)
  ;(i.setFullYear(r + 1, 0, o), i.setHours(0, 0, 0, 0))
  const s = E(i, e),
    u = y(e?.in || t, 0)
  ;(u.setFullYear(r, 0, o), u.setHours(0, 0, 0, 0))
  const g = E(u, e)
  return +n >= +s ? r + 1 : +n >= +g ? r : r - 1
}
function Kn(t, e) {
  const n = H(),
    r =
      e?.firstWeekContainsDate ??
      e?.locale?.options?.firstWeekContainsDate ??
      n.firstWeekContainsDate ??
      n.locale?.options?.firstWeekContainsDate ??
      1,
    a = wt(t, e),
    o = y(e?.in || t, 0)
  return (o.setFullYear(a, 0, r), o.setHours(0, 0, 0, 0), E(o, e))
}
function Zn(t, e) {
  const n = m(t, e?.in),
    r = +E(n, e) - +Kn(n, e)
  return Math.round(r / lt) + 1
}
function l(t, e) {
  const n = t < 0 ? '-' : '',
    r = Math.abs(t).toString().padStart(e, '0')
  return n + r
}
const O = {
    y(t, e) {
      const n = t.getFullYear(),
        r = n > 0 ? n : 1 - n
      return l(e === 'yy' ? r % 100 : r, e.length)
    },
    M(t, e) {
      const n = t.getMonth()
      return e === 'M' ? String(n + 1) : l(n + 1, 2)
    },
    d(t, e) {
      return l(t.getDate(), e.length)
    },
    a(t, e) {
      const n = t.getHours() / 12 >= 1 ? 'pm' : 'am'
      switch (e) {
        case 'a':
        case 'aa':
          return n.toUpperCase()
        case 'aaa':
          return n
        case 'aaaaa':
          return n[0]
        case 'aaaa':
        default:
          return n === 'am' ? 'a.m.' : 'p.m.'
      }
    },
    h(t, e) {
      return l(t.getHours() % 12 || 12, e.length)
    },
    H(t, e) {
      return l(t.getHours(), e.length)
    },
    m(t, e) {
      return l(t.getMinutes(), e.length)
    },
    s(t, e) {
      return l(t.getSeconds(), e.length)
    },
    S(t, e) {
      const n = e.length,
        r = t.getMilliseconds(),
        a = Math.trunc(r * Math.pow(10, n - 3))
      return l(a, e.length)
    },
  },
  T = {
    midnight: 'midnight',
    noon: 'noon',
    morning: 'morning',
    afternoon: 'afternoon',
    evening: 'evening',
    night: 'night',
  },
  et = {
    G: function (t, e, n) {
      const r = t.getFullYear() > 0 ? 1 : 0
      switch (e) {
        case 'G':
        case 'GG':
        case 'GGG':
          return n.era(r, { width: 'abbreviated' })
        case 'GGGGG':
          return n.era(r, { width: 'narrow' })
        case 'GGGG':
        default:
          return n.era(r, { width: 'wide' })
      }
    },
    y: function (t, e, n) {
      if (e === 'yo') {
        const r = t.getFullYear(),
          a = r > 0 ? r : 1 - r
        return n.ordinalNumber(a, { unit: 'year' })
      }
      return O.y(t, e)
    },
    Y: function (t, e, n, r) {
      const a = wt(t, r),
        o = a > 0 ? a : 1 - a
      if (e === 'YY') {
        const i = o % 100
        return l(i, 2)
      }
      return e === 'Yo' ? n.ordinalNumber(o, { unit: 'year' }) : l(o, e.length)
    },
    R: function (t, e) {
      const n = mt(t)
      return l(n, e.length)
    },
    u: function (t, e) {
      const n = t.getFullYear()
      return l(n, e.length)
    },
    Q: function (t, e, n) {
      const r = Math.ceil((t.getMonth() + 1) / 3)
      switch (e) {
        case 'Q':
          return String(r)
        case 'QQ':
          return l(r, 2)
        case 'Qo':
          return n.ordinalNumber(r, { unit: 'quarter' })
        case 'QQQ':
          return n.quarter(r, { width: 'abbreviated', context: 'formatting' })
        case 'QQQQQ':
          return n.quarter(r, { width: 'narrow', context: 'formatting' })
        case 'QQQQ':
        default:
          return n.quarter(r, { width: 'wide', context: 'formatting' })
      }
    },
    q: function (t, e, n) {
      const r = Math.ceil((t.getMonth() + 1) / 3)
      switch (e) {
        case 'q':
          return String(r)
        case 'qq':
          return l(r, 2)
        case 'qo':
          return n.ordinalNumber(r, { unit: 'quarter' })
        case 'qqq':
          return n.quarter(r, { width: 'abbreviated', context: 'standalone' })
        case 'qqqqq':
          return n.quarter(r, { width: 'narrow', context: 'standalone' })
        case 'qqqq':
        default:
          return n.quarter(r, { width: 'wide', context: 'standalone' })
      }
    },
    M: function (t, e, n) {
      const r = t.getMonth()
      switch (e) {
        case 'M':
        case 'MM':
          return O.M(t, e)
        case 'Mo':
          return n.ordinalNumber(r + 1, { unit: 'month' })
        case 'MMM':
          return n.month(r, { width: 'abbreviated', context: 'formatting' })
        case 'MMMMM':
          return n.month(r, { width: 'narrow', context: 'formatting' })
        case 'MMMM':
        default:
          return n.month(r, { width: 'wide', context: 'formatting' })
      }
    },
    L: function (t, e, n) {
      const r = t.getMonth()
      switch (e) {
        case 'L':
          return String(r + 1)
        case 'LL':
          return l(r + 1, 2)
        case 'Lo':
          return n.ordinalNumber(r + 1, { unit: 'month' })
        case 'LLL':
          return n.month(r, { width: 'abbreviated', context: 'standalone' })
        case 'LLLLL':
          return n.month(r, { width: 'narrow', context: 'standalone' })
        case 'LLLL':
        default:
          return n.month(r, { width: 'wide', context: 'standalone' })
      }
    },
    w: function (t, e, n, r) {
      const a = Zn(t, r)
      return e === 'wo' ? n.ordinalNumber(a, { unit: 'week' }) : l(a, e.length)
    },
    I: function (t, e, n) {
      const r = Un(t)
      return e === 'Io' ? n.ordinalNumber(r, { unit: 'week' }) : l(r, e.length)
    },
    d: function (t, e, n) {
      return e === 'do' ? n.ordinalNumber(t.getDate(), { unit: 'date' }) : O.d(t, e)
    },
    D: function (t, e, n) {
      const r = zn(t)
      return e === 'Do' ? n.ordinalNumber(r, { unit: 'dayOfYear' }) : l(r, e.length)
    },
    E: function (t, e, n) {
      const r = t.getDay()
      switch (e) {
        case 'E':
        case 'EE':
        case 'EEE':
          return n.day(r, { width: 'abbreviated', context: 'formatting' })
        case 'EEEEE':
          return n.day(r, { width: 'narrow', context: 'formatting' })
        case 'EEEEEE':
          return n.day(r, { width: 'short', context: 'formatting' })
        case 'EEEE':
        default:
          return n.day(r, { width: 'wide', context: 'formatting' })
      }
    },
    e: function (t, e, n, r) {
      const a = t.getDay(),
        o = (a - r.weekStartsOn + 8) % 7 || 7
      switch (e) {
        case 'e':
          return String(o)
        case 'ee':
          return l(o, 2)
        case 'eo':
          return n.ordinalNumber(o, { unit: 'day' })
        case 'eee':
          return n.day(a, { width: 'abbreviated', context: 'formatting' })
        case 'eeeee':
          return n.day(a, { width: 'narrow', context: 'formatting' })
        case 'eeeeee':
          return n.day(a, { width: 'short', context: 'formatting' })
        case 'eeee':
        default:
          return n.day(a, { width: 'wide', context: 'formatting' })
      }
    },
    c: function (t, e, n, r) {
      const a = t.getDay(),
        o = (a - r.weekStartsOn + 8) % 7 || 7
      switch (e) {
        case 'c':
          return String(o)
        case 'cc':
          return l(o, e.length)
        case 'co':
          return n.ordinalNumber(o, { unit: 'day' })
        case 'ccc':
          return n.day(a, { width: 'abbreviated', context: 'standalone' })
        case 'ccccc':
          return n.day(a, { width: 'narrow', context: 'standalone' })
        case 'cccccc':
          return n.day(a, { width: 'short', context: 'standalone' })
        case 'cccc':
        default:
          return n.day(a, { width: 'wide', context: 'standalone' })
      }
    },
    i: function (t, e, n) {
      const r = t.getDay(),
        a = r === 0 ? 7 : r
      switch (e) {
        case 'i':
          return String(a)
        case 'ii':
          return l(a, e.length)
        case 'io':
          return n.ordinalNumber(a, { unit: 'day' })
        case 'iii':
          return n.day(r, { width: 'abbreviated', context: 'formatting' })
        case 'iiiii':
          return n.day(r, { width: 'narrow', context: 'formatting' })
        case 'iiiiii':
          return n.day(r, { width: 'short', context: 'formatting' })
        case 'iiii':
        default:
          return n.day(r, { width: 'wide', context: 'formatting' })
      }
    },
    a: function (t, e, n) {
      const a = t.getHours() / 12 >= 1 ? 'pm' : 'am'
      switch (e) {
        case 'a':
        case 'aa':
          return n.dayPeriod(a, { width: 'abbreviated', context: 'formatting' })
        case 'aaa':
          return n.dayPeriod(a, { width: 'abbreviated', context: 'formatting' }).toLowerCase()
        case 'aaaaa':
          return n.dayPeriod(a, { width: 'narrow', context: 'formatting' })
        case 'aaaa':
        default:
          return n.dayPeriod(a, { width: 'wide', context: 'formatting' })
      }
    },
    b: function (t, e, n) {
      const r = t.getHours()
      let a
      switch (
        (r === 12 ? (a = T.noon) : r === 0 ? (a = T.midnight) : (a = r / 12 >= 1 ? 'pm' : 'am'), e)
      ) {
        case 'b':
        case 'bb':
          return n.dayPeriod(a, { width: 'abbreviated', context: 'formatting' })
        case 'bbb':
          return n.dayPeriod(a, { width: 'abbreviated', context: 'formatting' }).toLowerCase()
        case 'bbbbb':
          return n.dayPeriod(a, { width: 'narrow', context: 'formatting' })
        case 'bbbb':
        default:
          return n.dayPeriod(a, { width: 'wide', context: 'formatting' })
      }
    },
    B: function (t, e, n) {
      const r = t.getHours()
      let a
      switch (
        (r >= 17
          ? (a = T.evening)
          : r >= 12
            ? (a = T.afternoon)
            : r >= 4
              ? (a = T.morning)
              : (a = T.night),
        e)
      ) {
        case 'B':
        case 'BB':
        case 'BBB':
          return n.dayPeriod(a, { width: 'abbreviated', context: 'formatting' })
        case 'BBBBB':
          return n.dayPeriod(a, { width: 'narrow', context: 'formatting' })
        case 'BBBB':
        default:
          return n.dayPeriod(a, { width: 'wide', context: 'formatting' })
      }
    },
    h: function (t, e, n) {
      if (e === 'ho') {
        let r = t.getHours() % 12
        return (r === 0 && (r = 12), n.ordinalNumber(r, { unit: 'hour' }))
      }
      return O.h(t, e)
    },
    H: function (t, e, n) {
      return e === 'Ho' ? n.ordinalNumber(t.getHours(), { unit: 'hour' }) : O.H(t, e)
    },
    K: function (t, e, n) {
      const r = t.getHours() % 12
      return e === 'Ko' ? n.ordinalNumber(r, { unit: 'hour' }) : l(r, e.length)
    },
    k: function (t, e, n) {
      let r = t.getHours()
      return (
        r === 0 && (r = 24),
        e === 'ko' ? n.ordinalNumber(r, { unit: 'hour' }) : l(r, e.length)
      )
    },
    m: function (t, e, n) {
      return e === 'mo' ? n.ordinalNumber(t.getMinutes(), { unit: 'minute' }) : O.m(t, e)
    },
    s: function (t, e, n) {
      return e === 'so' ? n.ordinalNumber(t.getSeconds(), { unit: 'second' }) : O.s(t, e)
    },
    S: function (t, e) {
      return O.S(t, e)
    },
    X: function (t, e, n) {
      const r = t.getTimezoneOffset()
      if (r === 0) return 'Z'
      switch (e) {
        case 'X':
          return rt(r)
        case 'XXXX':
        case 'XX':
          return k(r)
        case 'XXXXX':
        case 'XXX':
        default:
          return k(r, ':')
      }
    },
    x: function (t, e, n) {
      const r = t.getTimezoneOffset()
      switch (e) {
        case 'x':
          return rt(r)
        case 'xxxx':
        case 'xx':
          return k(r)
        case 'xxxxx':
        case 'xxx':
        default:
          return k(r, ':')
      }
    },
    O: function (t, e, n) {
      const r = t.getTimezoneOffset()
      switch (e) {
        case 'O':
        case 'OO':
        case 'OOO':
          return 'GMT' + nt(r, ':')
        case 'OOOO':
        default:
          return 'GMT' + k(r, ':')
      }
    },
    z: function (t, e, n) {
      const r = t.getTimezoneOffset()
      switch (e) {
        case 'z':
        case 'zz':
        case 'zzz':
          return 'GMT' + nt(r, ':')
        case 'zzzz':
        default:
          return 'GMT' + k(r, ':')
      }
    },
    t: function (t, e, n) {
      const r = Math.trunc(+t / 1e3)
      return l(r, e.length)
    },
    T: function (t, e, n) {
      return l(+t, e.length)
    },
  }
function nt(t, e = '') {
  const n = t > 0 ? '-' : '+',
    r = Math.abs(t),
    a = Math.trunc(r / 60),
    o = r % 60
  return o === 0 ? n + String(a) : n + String(a) + e + l(o, 2)
}
function rt(t, e) {
  return t % 60 === 0 ? (t > 0 ? '-' : '+') + l(Math.abs(t) / 60, 2) : k(t, e)
}
function k(t, e = '') {
  const n = t > 0 ? '-' : '+',
    r = Math.abs(t),
    a = l(Math.trunc(r / 60), 2),
    o = l(r % 60, 2)
  return n + a + e + o
}
const at = (t, e) => {
    switch (t) {
      case 'P':
        return e.date({ width: 'short' })
      case 'PP':
        return e.date({ width: 'medium' })
      case 'PPP':
        return e.date({ width: 'long' })
      case 'PPPP':
      default:
        return e.date({ width: 'full' })
    }
  },
  yt = (t, e) => {
    switch (t) {
      case 'p':
        return e.time({ width: 'short' })
      case 'pp':
        return e.time({ width: 'medium' })
      case 'ppp':
        return e.time({ width: 'long' })
      case 'pppp':
      default:
        return e.time({ width: 'full' })
    }
  },
  tr = (t, e) => {
    const n = t.match(/(P+)(p+)?/) || [],
      r = n[1],
      a = n[2]
    if (!a) return at(t, e)
    let o
    switch (r) {
      case 'P':
        o = e.dateTime({ width: 'short' })
        break
      case 'PP':
        o = e.dateTime({ width: 'medium' })
        break
      case 'PPP':
        o = e.dateTime({ width: 'long' })
        break
      case 'PPPP':
      default:
        o = e.dateTime({ width: 'full' })
        break
    }
    return o.replace('{{date}}', at(r, e)).replace('{{time}}', yt(a, e))
  },
  er = { p: yt, P: tr },
  nr = /^D+$/,
  rr = /^Y+$/,
  ar = ['D', 'DD', 'YY', 'YYYY']
function or(t) {
  return nr.test(t)
}
function ir(t) {
  return rr.test(t)
}
function sr(t, e, n) {
  const r = ur(t, e, n)
  if ((console.warn(r), ar.includes(t))) throw new RangeError(r)
}
function ur(t, e, n) {
  const r = t[0] === 'Y' ? 'years' : 'days of the month'
  return `Use \`${t.toLowerCase()}\` instead of \`${t}\` (in \`${e}\`) for formatting ${r} to the input \`${n}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`
}
const cr = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g,
  dr = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g,
  fr = /^'([^]*?)'?$/,
  hr = /''/g,
  lr = /[a-zA-Z]/
function Lr(t, e, n) {
  const r = H(),
    a = n?.locale ?? r.locale ?? Jn,
    o =
      n?.firstWeekContainsDate ??
      n?.locale?.options?.firstWeekContainsDate ??
      r.firstWeekContainsDate ??
      r.locale?.options?.firstWeekContainsDate ??
      1,
    i =
      n?.weekStartsOn ??
      n?.locale?.options?.weekStartsOn ??
      r.weekStartsOn ??
      r.locale?.options?.weekStartsOn ??
      0,
    s = m(t, n?.in)
  if (!mn(s)) throw new RangeError('Invalid time value')
  let u = e
    .match(dr)
    .map((f) => {
      const c = f[0]
      if (c === 'p' || c === 'P') {
        const w = er[c]
        return w(f, a.formatLong)
      }
      return f
    })
    .join('')
    .match(cr)
    .map((f) => {
      if (f === "''") return { isToken: !1, value: "'" }
      const c = f[0]
      if (c === "'") return { isToken: !1, value: mr(f) }
      if (et[c]) return { isToken: !0, value: f }
      if (c.match(lr))
        throw new RangeError(
          'Format string contains an unescaped latin alphabet character `' + c + '`',
        )
      return { isToken: !1, value: f }
    })
  a.localize.preprocessor && (u = a.localize.preprocessor(s, u))
  const g = { firstWeekContainsDate: o, weekStartsOn: i, locale: a }
  return u
    .map((f) => {
      if (!f.isToken) return f.value
      const c = f.value
      ;((!n?.useAdditionalWeekYearTokens && ir(c)) ||
        (!n?.useAdditionalDayOfYearTokens && or(c))) &&
        sr(c, e, String(t))
      const w = et[c[0]]
      return w(s, c, a.localize, g)
    })
    .join('')
}
function mr(t) {
  const e = t.match(fr)
  return e ? e[1].replace(hr, "'") : t
}
function gr(t, e) {
  const n = m(t, e?.in),
    r = n.getFullYear(),
    a = n.getMonth(),
    o = y(n, 0)
  return (o.setFullYear(r, a + 1, 0), o.setHours(0, 0, 0, 0), o.getDate())
}
function Qr(t, e) {
  return m(t, e?.in).getMonth()
}
function Ir(t, e) {
  return m(t, e?.in).getFullYear()
}
function jr(t, e) {
  return +m(t) > +m(e)
}
function Rr(t, e) {
  return +m(t) < +m(e)
}
function Ar(t, e, n) {
  const [r, a] = S(n?.in, t, e)
  return r.getFullYear() === a.getFullYear() && r.getMonth() === a.getMonth()
}
function Gr(t, e, n) {
  const [r, a] = S(n?.in, t, e)
  return r.getFullYear() === a.getFullYear()
}
function Br(t, e, n) {
  const r = m(t, n?.in),
    a = r.getFullYear(),
    o = r.getDate(),
    i = y(t, 0)
  ;(i.setFullYear(a, e, 15), i.setHours(0, 0, 0, 0))
  const s = gr(i)
  return (r.setMonth(e, Math.min(o, s)), r)
}
function Vr(t, e, n) {
  const r = m(t, n?.in)
  return isNaN(+r) ? y(t, NaN) : (r.setFullYear(e), r)
}
export {
  Vr as A,
  j as B,
  I as C,
  Hr as D,
  E,
  gn as F,
  Jn as G,
  Mr as H,
  xr as I,
  dt as J,
  br as K,
  Yt as L,
  yr as M,
  Or as N,
  ut as O,
  wr as P,
  Pr as Q,
  Dr as R,
  Mt as S,
  Wr as T,
  pr as U,
  vr as V,
  kr as W,
  un as a,
  cn as b,
  Tr as c,
  Yr as d,
  fn as e,
  Nr as f,
  Cr as g,
  qr as h,
  Xr as i,
  Er as j,
  wn as k,
  _r as l,
  Lr as m,
  Un as n,
  Qr as o,
  Ir as p,
  Zn as q,
  jr as r,
  Rr as s,
  ln as t,
  Fr as u,
  Ar as v,
  Gr as w,
  Sr as x,
  $r as y,
  Br as z,
}
//# sourceMappingURL=date-vendor-s0MkYge4.js.map
