import { r as k, j as e, u as D } from './react-vendor-Buoak6m3.js'
import { i as xe, L as ge } from './tanstack-vendor-BZC-rs5U.js'
import { b as pe, c as be } from './useDossier-CiPcwRKl.js'
import { u as fe } from './useIntelligence-BMjousVq.js'
import {
  c as n,
  m as z,
  B as S,
  j as Z,
  a0 as w,
  l as ee,
  I as we,
  ah as je,
  ai as ve,
  aj as ye,
  aO as Ne,
  aP as ke,
  aQ as Ce,
  aR as _e,
  aS as ze,
  aT as Se,
  q,
  r as U,
  t as R,
  v as O,
  w as A,
  af as $e,
  al as Te,
  ag as Ae,
} from './index-qYY0KoZ1.js'
import { A as F, b as B, a as G } from './avatar-lQOCSoMx.js'
import { u as Ie } from './use-outside-click-DyRG7K6b.js'
import {
  aK as $,
  bx as p,
  bd as H,
  by as Ee,
  aD as Le,
  b5 as De,
  c0 as Pe,
  aT as ae,
  bC as se,
  b_ as te,
  aR as re,
  aI as ne,
  aJ as ie,
  da as Me,
  bo as qe,
  bm as Ue,
  b9 as Re,
  aE as V,
  aF as Oe,
  aG as Fe,
  bw as Be,
  aL as Ge,
  aM as He,
} from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
const Ve = {
  'saudi arabia': 'sa',
  'المملكة العربية السعودية': 'sa',
  السعودية: 'sa',
  uae: 'ae',
  'united arab emirates': 'ae',
  'الإمارات العربية المتحدة': 'ae',
  الإمارات: 'ae',
  kuwait: 'kw',
  الكويت: 'kw',
  qatar: 'qa',
  قطر: 'qa',
  bahrain: 'bh',
  البحرين: 'bh',
  oman: 'om',
  عمان: 'om',
  'سلطنة عمان': 'om',
  egypt: 'eg',
  مصر: 'eg',
  jordan: 'jo',
  الأردن: 'jo',
  lebanon: 'lb',
  لبنان: 'lb',
  syria: 'sy',
  سوريا: 'sy',
  iraq: 'iq',
  العراق: 'iq',
  palestine: 'ps',
  فلسطين: 'ps',
  israel: 'il',
  إسرائيل: 'il',
  yemen: 'ye',
  اليمن: 'ye',
  iran: 'ir',
  إيران: 'ir',
  turkey: 'tr',
  تركيا: 'tr',
  morocco: 'ma',
  المغرب: 'ma',
  algeria: 'dz',
  الجزائر: 'dz',
  tunisia: 'tn',
  تونس: 'tn',
  libya: 'ly',
  ليبيا: 'ly',
  sudan: 'sd',
  السودان: 'sd',
  mauritania: 'mr',
  موريتانيا: 'mr',
  'south africa': 'za',
  'جنوب أفريقيا': 'za',
  nigeria: 'ng',
  نيجيريا: 'ng',
  kenya: 'ke',
  كينيا: 'ke',
  ethiopia: 'et',
  إثيوبيا: 'et',
  somalia: 'so',
  الصومال: 'so',
  djibouti: 'dj',
  جيبوتي: 'dj',
  china: 'cn',
  الصين: 'cn',
  japan: 'jp',
  اليابان: 'jp',
  'south korea': 'kr',
  'كوريا الجنوبية': 'kr',
  'north korea': 'kp',
  'كوريا الشمالية': 'kp',
  india: 'in',
  الهند: 'in',
  pakistan: 'pk',
  باكستان: 'pk',
  bangladesh: 'bd',
  بنغلاديش: 'bd',
  indonesia: 'id',
  إندونيسيا: 'id',
  malaysia: 'my',
  ماليزيا: 'my',
  singapore: 'sg',
  سنغافورة: 'sg',
  thailand: 'th',
  تايلاند: 'th',
  vietnam: 'vn',
  فيتنام: 'vn',
  philippines: 'ph',
  الفلبين: 'ph',
  'united kingdom': 'gb',
  'المملكة المتحدة': 'gb',
  uk: 'gb',
  britain: 'gb',
  بريطانيا: 'gb',
  france: 'fr',
  فرنسا: 'fr',
  germany: 'de',
  ألمانيا: 'de',
  italy: 'it',
  إيطاليا: 'it',
  spain: 'es',
  إسبانيا: 'es',
  netherlands: 'nl',
  هولندا: 'nl',
  belgium: 'be',
  بلجيكا: 'be',
  switzerland: 'ch',
  سويسرا: 'ch',
  austria: 'at',
  النمسا: 'at',
  sweden: 'se',
  السويد: 'se',
  norway: 'no',
  النرويج: 'no',
  denmark: 'dk',
  الدنمارك: 'dk',
  finland: 'fi',
  فنلندا: 'fi',
  poland: 'pl',
  بولندا: 'pl',
  russia: 'ru',
  روسيا: 'ru',
  ukraine: 'ua',
  أوكرانيا: 'ua',
  greece: 'gr',
  اليونان: 'gr',
  portugal: 'pt',
  البرتغال: 'pt',
  'czech republic': 'cz',
  التشيك: 'cz',
  'united states': 'us',
  'الولايات المتحدة': 'us',
  usa: 'us',
  america: 'us',
  أمريكا: 'us',
  canada: 'ca',
  كندا: 'ca',
  mexico: 'mx',
  المكسيك: 'mx',
  brazil: 'br',
  البرازيل: 'br',
  argentina: 'ar',
  الأرجنتين: 'ar',
  chile: 'cl',
  تشيلي: 'cl',
  colombia: 'co',
  كولومبيا: 'co',
  peru: 'pe',
  بيرو: 'pe',
  australia: 'au',
  أستراليا: 'au',
  'new zealand': 'nz',
  نيوزيلندا: 'nz',
  fiji: 'fj',
  'papua new guinea': 'pg',
  samoa: 'ws',
  tonga: 'to',
  vanuatu: 'vu',
  'solomon islands': 'sb',
  micronesia: 'fm',
  kiribati: 'ki',
  'marshall islands': 'mh',
  palau: 'pw',
  nauru: 'nr',
  tuvalu: 'tv',
  kazakhstan: 'kz',
  uzbekistan: 'uz',
  turkmenistan: 'tm',
  kyrgyzstan: 'kg',
  tajikistan: 'tj',
  afghanistan: 'af',
  أفغانستان: 'af',
  myanmar: 'mm',
  cambodia: 'kh',
  laos: 'la',
  brunei: 'bn',
  'timor-leste': 'tl',
  'east timor': 'tl',
  'sri lanka': 'lk',
  nepal: 'np',
  bhutan: 'bt',
  maldives: 'mv',
  mongolia: 'mn',
  taiwan: 'tw',
  'hong kong': 'hk',
  macau: 'mo',
  belarus: 'by',
  moldova: 'md',
  romania: 'ro',
  bulgaria: 'bg',
  hungary: 'hu',
  slovakia: 'sk',
  slovenia: 'si',
  croatia: 'hr',
  'bosnia and herzegovina': 'ba',
  serbia: 'rs',
  montenegro: 'me',
  'north macedonia': 'mk',
  macedonia: 'mk',
  albania: 'al',
  kosovo: 'xk',
  estonia: 'ee',
  latvia: 'lv',
  lithuania: 'lt',
  georgia: 'ge',
  armenia: 'am',
  azerbaijan: 'az',
  ireland: 'ie',
  luxembourg: 'lu',
  iceland: 'is',
  monaco: 'mc',
  liechtenstein: 'li',
  andorra: 'ad',
  'san marino': 'sm',
  'vatican city': 'va',
  malta: 'mt',
  cyprus: 'cy',
  guatemala: 'gt',
  honduras: 'hn',
  'el salvador': 'sv',
  nicaragua: 'ni',
  'costa rica': 'cr',
  panama: 'pa',
  belize: 'bz',
  cuba: 'cu',
  jamaica: 'jm',
  haiti: 'ht',
  'dominican republic': 'do',
  bahamas: 'bs',
  'trinidad and tobago': 'tt',
  barbados: 'bb',
  'saint lucia': 'lc',
  grenada: 'gd',
  'saint vincent and the grenadines': 'vc',
  'antigua and barbuda': 'ag',
  dominica: 'dm',
  'saint kitts and nevis': 'kn',
  venezuela: 've',
  ecuador: 'ec',
  bolivia: 'bo',
  paraguay: 'py',
  uruguay: 'uy',
  guyana: 'gy',
  suriname: 'sr',
  'french guiana': 'gf',
  ghana: 'gh',
  senegal: 'sn',
  'ivory coast': 'ci',
  "cote d'ivoire": 'ci',
  cameroon: 'cm',
  'democratic republic of the congo': 'cd',
  congo: 'cg',
  'republic of the congo': 'cg',
  angola: 'ao',
  mozambique: 'mz',
  madagascar: 'mg',
  uganda: 'ug',
  tanzania: 'tz',
  rwanda: 'rw',
  burundi: 'bi',
  zambia: 'zm',
  zimbabwe: 'zw',
  malawi: 'mw',
  botswana: 'bw',
  namibia: 'na',
  lesotho: 'ls',
  eswatini: 'sz',
  swaziland: 'sz',
  mali: 'ml',
  'burkina faso': 'bf',
  niger: 'ne',
  chad: 'td',
  'central african republic': 'cf',
  gabon: 'ga',
  'equatorial guinea': 'gq',
  guinea: 'gn',
  'guinea-bissau': 'gw',
  'sierra leone': 'sl',
  liberia: 'lr',
  togo: 'tg',
  benin: 'bj',
  eritrea: 'er',
  'south sudan': 'ss',
  gambia: 'gm',
  mauritius: 'mu',
  seychelles: 'sc',
  comoros: 'km',
  'cape verde': 'cv',
  'sao tome and principe': 'st',
  england: 'gb',
  scotland: 'gb',
  wales: 'gb',
  'northern ireland': 'gb',
  'puerto rico': 'pr',
  greenland: 'gl',
  'faroe islands': 'fo',
  guam: 'gu',
  'american samoa': 'as',
  'northern mariana islands': 'mp',
  'virgin islands': 'vi',
  'u.s. virgin islands': 'vi',
  'british virgin islands': 'vg',
  'cayman islands': 'ky',
  bermuda: 'bm',
  'turks and caicos islands': 'tc',
  anguilla: 'ai',
  montserrat: 'ms',
  'falkland islands': 'fk',
  'french polynesia': 'pf',
  'new caledonia': 'nc',
  'cook islands': 'ck',
  niue: 'nu',
  tokelau: 'tk',
  'wallis and futuna': 'wf',
  'pitcairn islands': 'pn',
  'saint helena': 'sh',
  reunion: 're',
  mayotte: 'yt',
  martinique: 'mq',
  guadeloupe: 'gp',
  aruba: 'aw',
  curacao: 'cw',
  'sint maarten': 'sx',
  bonaire: 'bq',
  'caribbean netherlands': 'bq',
  'isle of man': 'im',
  jersey: 'je',
  guernsey: 'gg',
  gibraltar: 'gi',
  'aland islands': 'ax',
  'svalbard and jan mayen': 'sj',
  'bouvet island': 'bv',
  'heard island and mcdonald islands': 'hm',
  'christmas island': 'cx',
  'cocos islands': 'cc',
  'norfolk island': 'nf',
  antarctica: 'aq',
  'french southern territories': 'tf',
  'british indian ocean territory': 'io',
  'western sahara': 'eh',
  'south georgia': 'gs',
  'saint pierre and miquelon': 'pm',
  'saint martin': 'mf',
  'saint barthelemy': 'bl',
}
function le(a) {
  if (!a) return null
  const r = a.toLowerCase().trim()
  return Ve[r] || null
}
const Ke = { xs: 64, sm: 128, md: 256, lg: 512, xl: 1024 }
function K({ countryCode: a, className: r, size: i = 'md', showLoading: c = !0, alt: t }) {
  const [o, x] = k.useState(!1),
    [b, d] = k.useState(!0),
    f = a.toLowerCase().trim(),
    u = Ke[i],
    g = [16, 24, 32, 48, 64, 80, 96, 128, 256, 512, 1024],
    m = `/assets/maps/all_countries/${f}`,
    h = `${m}/vector.svg`,
    y = (N) => `${m}/${N}.png`,
    T = g.map((N) => `${y(N)} ${N}w`).join(', '),
    j = `
    (max-width: 320px) 64px,
    (max-width: 640px) 128px,
    (max-width: 768px) 256px,
    (max-width: 1024px) 512px,
    ${u}px
  `.trim(),
    C = () => {
      ;(console.warn(`Country map not found for code: ${f}`), x(!0), d(!1))
    },
    _ = () => {
      d(!1)
    }
  return o || !f
    ? e.jsxs('div', {
        className: n(
          'relative overflow-hidden flex items-center justify-center',
          'bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg',
          'min-h-32 sm:min-h-48',
          r,
        ),
        title: t || `Map not available for ${a.toUpperCase()}`,
        children: [
          e.jsx($, { className: 'h-16 w-16 sm:h-24 sm:w-24 text-primary/30', strokeWidth: 1.5 }),
          e.jsx('span', {
            className: 'absolute bottom-2 end-2 text-xs text-muted-foreground font-mono',
            children: a.toUpperCase(),
          }),
        ],
      })
    : e.jsxs('div', {
        className: n(
          'relative overflow-hidden flex items-center justify-center',
          'bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg',
          r,
        ),
        children: [
          b &&
            c &&
            e.jsx('div', {
              className: 'absolute inset-0 flex items-center justify-center',
              children: e.jsx($, {
                className: 'h-16 w-16 sm:h-24 sm:w-24 text-primary/20 animate-pulse',
                strokeWidth: 1.5,
              }),
            }),
          e.jsxs('picture', {
            className: 'w-full h-full flex items-center justify-center',
            children: [
              e.jsx('source', { type: 'image/svg+xml', srcSet: h }),
              e.jsx('img', {
                src: y(u),
                srcSet: T,
                sizes: j,
                alt: t || `Map of ${a.toUpperCase()}`,
                onError: C,
                onLoad: _,
                loading: 'lazy',
                decoding: 'async',
                className: n(
                  'object-contain w-full h-full transition-opacity duration-300',
                  b ? 'opacity-0' : 'opacity-100',
                  'filter drop-shadow-sm',
                ),
                style: { maxWidth: '100%', maxHeight: '100%' },
              }),
            ],
          }),
          e.jsx('span', {
            className: 'absolute bottom-2 end-2 text-xs text-muted-foreground font-mono opacity-60',
            children: a.toUpperCase(),
          }),
        ],
      })
}
function W(a, r) {
  const i = { className: r || 'h-4 w-4 sm:h-5 sm:w-5 text-white' }
  switch (a) {
    case 'country':
      return e.jsx($, { ...i })
    case 'organization':
      return e.jsx(ie, { ...i })
    case 'forum':
      return e.jsx(ne, { ...i })
    case 'engagement':
      return e.jsx(re, { ...i })
    case 'topic':
      return e.jsx(te, { ...i })
    case 'working_group':
      return e.jsx(se, { ...i })
    case 'person':
      return e.jsx(ae, { ...i })
    default:
      return e.jsx($, { ...i })
  }
}
function J({ countryName: a, className: r }) {
  const i = le(a)
  if (!i)
    return e.jsx('div', {
      className: n(
        'rounded-full border-2 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg',
        r,
      ),
      children: e.jsx($, { className: 'h-5 w-5 sm:h-6 sm:w-6 text-white' }),
    })
  const c = `/assets/flags/${i}.svg`
  return e.jsx('div', {
    className: n('overflow-hidden rounded-full border-2 border-white/30 shadow-lg', r),
    children: e.jsx('img', {
      src: c,
      alt: a || 'Country flag',
      className: 'w-full h-full object-cover',
      onError: (t) => {
        const o = t.target
        o.style.display = 'none'
        const x = o.parentElement
        if (x) {
          x.className = n(
            'rounded-full border-2 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg',
            r,
          )
          const b = document.createElement('div')
          ;((b.innerHTML =
            '<svg class="h-5 w-5 sm:h-6 sm:w-6 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>'),
            x.appendChild(b))
        }
      },
    }),
  })
}
function Q(a) {
  switch (a) {
    case 'country':
      return 'from-blue-500/90 via-blue-600/80 to-blue-700/70'
    case 'organization':
      return 'from-purple-500/90 via-purple-600/80 to-purple-700/70'
    case 'forum':
      return 'from-green-500/90 via-green-600/80 to-green-700/70'
    case 'engagement':
      return 'from-orange-500/90 via-orange-600/80 to-orange-700/70'
    case 'topic':
      return 'from-pink-500/90 via-pink-600/80 to-pink-700/70'
    case 'working_group':
      return 'from-indigo-500/90 via-indigo-600/80 to-indigo-700/70'
    case 'person':
      return 'from-teal-500/90 via-teal-600/80 to-teal-700/70'
    default:
      return 'from-gray-500/90 via-gray-600/80 to-gray-700/70'
  }
}
function X(a) {
  switch (a) {
    case 'active':
      return 'bg-green-500/90 text-white'
    case 'inactive':
      return 'bg-yellow-500/90 text-white'
    case 'archived':
      return 'bg-gray-500/90 text-white'
    default:
      return 'bg-gray-500/90 text-white'
  }
}
function Y(a) {
  const r = a.trim().split(/\s+/)
  return r.length === 1
    ? r[0].slice(0, 2).toUpperCase()
    : (r[0].charAt(0) + r[r.length - 1].charAt(0)).toUpperCase()
}
function We(a, r) {
  const i = new Date(),
    c = new Date(a),
    t = i.getTime() - c.getTime(),
    o = Math.floor(t / (1e3 * 60 * 60 * 24))
  return o === 0
    ? r('time.today')
    : o === 1
      ? r('time.yesterday')
      : o < 7
        ? r('time.daysAgo', { count: o })
        : o < 30
          ? r('time.weeksAgo', { count: Math.floor(o / 7) })
          : o < 365
            ? r('time.monthsAgo', { count: Math.floor(o / 30) })
            : r('time.yearsAgo', { count: Math.floor(o / 365) })
}
function Je({
  dossier: a,
  isActive: r,
  onActivate: i,
  onDeactivate: c,
  onView: t,
  onEdit: o,
  onMouseEnter: x,
  className: b,
}) {
  const { t: d, i18n: f } = D('dossier'),
    u = f.language === 'ar',
    g = k.useId(),
    m = k.useRef(null),
    h = u ? a.name_ar : a.name_en,
    y = u ? a.description_ar : a.description_en,
    T = We(a.updated_at, d),
    j = a.type === 'country' ? le(h) : null
  return (
    k.useEffect(() => {
      function C(_) {
        _.key === 'Escape' && r && c()
      }
      return (
        r ? (document.body.style.overflow = 'hidden') : (document.body.style.overflow = 'auto'),
        window.addEventListener('keydown', C),
        () => window.removeEventListener('keydown', C)
      )
    }, [r, c]),
    Ie(m, () => {
      r && c()
    }),
    e.jsxs('div', {
      className: n('w-full', b),
      dir: u ? 'rtl' : 'ltr',
      onMouseEnter: x,
      children: [
        e.jsxs(p.div, {
          layoutId: `card-${a.id}-${g}`,
          onClick: i,
          className: n(
            'cursor-pointer overflow-hidden relative group/card',
            'h-72 sm:h-80 rounded-2xl shadow-xl',
            'flex flex-col justify-between p-4 sm:p-6',
            'bg-gradient-to-br',
            Q(a.type),
            'transition-transform duration-200',
            'hover:scale-[1.02]',
          ),
          children: [
            a.type === 'country' &&
              j &&
              e.jsx(K, {
                countryCode: j,
                size: 'lg',
                showLoading: !1,
                className:
                  'absolute inset-0 opacity-20 group-hover/card:opacity-30 transition-opacity duration-300',
              }),
            e.jsx('div', {
              className:
                'absolute w-full h-full top-0 start-0 transition duration-300 group-hover/card:bg-black/20 opacity-0 group-hover/card:opacity-100',
            }),
            e.jsx('div', {
              className: 'flex flex-col gap-3 sm:gap-4 z-10',
              children: e.jsxs('div', {
                className: 'flex items-center gap-3 sm:gap-4',
                children: [
                  a.type === 'person' && a.extension?.photo_url
                    ? e.jsxs(F, {
                        className: 'h-12 w-12 sm:h-14 sm:w-14 border-2 border-white/30 shadow-lg',
                        children: [
                          e.jsx(B, { src: a.extension.photo_url, alt: h || '' }),
                          e.jsx(G, {
                            className:
                              'bg-white/20 text-white text-sm sm:text-base font-bold backdrop-blur-sm',
                            children: h ? Y(h) : 'VIP',
                          }),
                        ],
                      })
                    : a.type === 'country'
                      ? e.jsx(J, { countryName: h, className: 'h-12 w-12 sm:h-14 sm:w-14' })
                      : e.jsx('div', {
                          className:
                            'h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg',
                          children: W(a.type),
                        }),
                  e.jsxs('div', {
                    className: 'flex flex-col gap-1.5 sm:gap-2 flex-1 min-w-0',
                    children: [
                      e.jsx(z, {
                        variant: 'secondary',
                        className:
                          'w-fit text-xs sm:text-sm bg-white/20 text-white border-white/30 backdrop-blur-sm',
                        children: d(`type.${a.type}`),
                      }),
                      e.jsxs('div', {
                        className: 'flex items-center gap-2 text-xs sm:text-sm text-white/80',
                        children: [
                          e.jsx(H, { className: 'h-3 w-3 sm:h-4 sm:w-4' }),
                          e.jsx('span', { children: T }),
                        ],
                      }),
                    ],
                  }),
                  e.jsx(z, {
                    className: n('text-xs sm:text-sm shrink-0 border-0', X(a.status)),
                    children: d(`status.${a.status}`),
                  }),
                ],
              }),
            }),
            e.jsxs('div', {
              className: 'text-content z-10',
              children: [
                e.jsx(p.h1, {
                  layoutId: `title-${a.id}-${g}`,
                  className:
                    'font-bold text-xl sm:text-2xl md:text-3xl text-white relative line-clamp-2 text-start mb-2',
                  children: h || d('untitled'),
                }),
                y &&
                  e.jsx(p.p, {
                    layoutId: `description-${a.id}-${g}`,
                    className:
                      'font-normal text-sm sm:text-base text-white/90 relative line-clamp-2 text-start',
                    children: y,
                  }),
              ],
            }),
          ],
        }),
        e.jsx(Ee, {
          children:
            r &&
            e.jsxs(e.Fragment, {
              children: [
                e.jsx(p.div, {
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  exit: { opacity: 0 },
                  className: 'fixed inset-0 bg-black/40 backdrop-blur-sm h-full w-full z-[100]',
                }),
                e.jsx('div', {
                  className: 'fixed inset-0 grid place-items-center z-[101] p-4',
                  children: e.jsxs(p.div, {
                    ref: m,
                    layoutId: `card-${a.id}-${g}`,
                    className:
                      'w-full max-w-2xl h-full md:h-fit md:max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl',
                    children: [
                      e.jsx(
                        p.button,
                        {
                          layout: !0,
                          initial: { opacity: 0 },
                          animate: { opacity: 1 },
                          exit: { opacity: 0, transition: { duration: 0.05 } },
                          className: n(
                            'absolute top-4 z-10',
                            'flex items-center justify-center',
                            'bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm',
                            'rounded-full h-8 w-8 sm:h-10 sm:w-10',
                            'shadow-lg',
                            'hover:bg-white dark:hover:bg-neutral-800',
                            'transition-colors duration-200',
                            u ? 'start-4' : 'end-4',
                          ),
                          onClick: c,
                          'aria-label': d('action.close'),
                          children: e.jsx(Le, {
                            className:
                              'h-4 w-4 sm:h-5 sm:w-5 text-neutral-700 dark:text-neutral-200',
                          }),
                        },
                        `button-${a.id}-${g}`,
                      ),
                      e.jsxs(p.div, {
                        layoutId: `image-${a.id}-${g}`,
                        className: n(
                          'relative w-full h-48 sm:h-64 md:h-72',
                          'bg-gradient-to-br',
                          Q(a.type),
                          'flex items-center justify-center',
                        ),
                        children: [
                          a.type === 'country' &&
                            j &&
                            e.jsx(K, {
                              countryCode: j,
                              size: 'xl',
                              showLoading: !1,
                              className: 'absolute inset-0 opacity-30',
                            }),
                          e.jsx('div', {
                            className: 'relative z-10',
                            children:
                              a.type === 'person' && a.extension?.photo_url
                                ? e.jsxs(F, {
                                    className:
                                      'h-24 w-24 sm:h-32 sm:w-32 border-4 border-white/30 shadow-2xl',
                                    children: [
                                      e.jsx(B, { src: a.extension.photo_url, alt: h || '' }),
                                      e.jsx(G, {
                                        className:
                                          'bg-white/20 text-white text-3xl font-bold backdrop-blur-sm',
                                        children: h ? Y(h) : 'VIP',
                                      }),
                                    ],
                                  })
                                : a.type === 'country'
                                  ? e.jsx(J, {
                                      countryName: h,
                                      className: 'h-24 w-24 sm:h-32 sm:w-32',
                                    })
                                  : e.jsx('div', {
                                      className:
                                        'h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl',
                                      children: W(a.type, 'h-12 w-12 sm:h-16 sm:w-16'),
                                    }),
                          }),
                        ],
                      }),
                      e.jsx('div', {
                        className: 'flex-1 overflow-y-auto',
                        children: e.jsx('div', {
                          className: 'p-4 sm:p-6',
                          children: e.jsxs('div', {
                            className: 'flex flex-col gap-4',
                            children: [
                              e.jsxs('div', {
                                children: [
                                  e.jsxs('div', {
                                    className: 'flex flex-wrap items-center gap-2 mb-3',
                                    children: [
                                      e.jsx(z, {
                                        variant: 'secondary',
                                        className: 'text-xs sm:text-sm',
                                        children: d(`type.${a.type}`),
                                      }),
                                      e.jsx(z, {
                                        className: n('text-xs sm:text-sm border-0', X(a.status)),
                                        children: d(`status.${a.status}`),
                                      }),
                                      e.jsxs('div', {
                                        className:
                                          'flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground',
                                        children: [
                                          e.jsx(H, { className: 'h-3 w-3 sm:h-4 sm:w-4' }),
                                          e.jsx('span', { children: T }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  e.jsx(p.h3, {
                                    layoutId: `title-${a.id}-${g}`,
                                    className:
                                      'font-bold text-2xl sm:text-3xl md:text-4xl text-start mb-2',
                                    children: h || d('untitled'),
                                  }),
                                  e.jsx(p.p, {
                                    layoutId: `description-${a.id}-${g}`,
                                    className:
                                      'text-sm sm:text-base text-muted-foreground text-start',
                                    children: y,
                                  }),
                                ],
                              }),
                              a.tags &&
                                a.tags.length > 0 &&
                                e.jsx('div', {
                                  className: 'flex flex-wrap gap-2',
                                  children: a.tags.map((C, _) =>
                                    e.jsx(
                                      z,
                                      { variant: 'secondary', className: 'text-xs', children: C },
                                      _,
                                    ),
                                  ),
                                }),
                              e.jsxs('div', {
                                className: 'grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t',
                                children: [
                                  e.jsxs('div', {
                                    className: 'flex flex-col gap-1',
                                    children: [
                                      e.jsx('span', {
                                        className: 'text-xs text-muted-foreground text-start',
                                        children: d('detail.id'),
                                      }),
                                      e.jsx('span', {
                                        className: 'text-sm font-mono text-start',
                                        children: a.id,
                                      }),
                                    ],
                                  }),
                                  e.jsxs('div', {
                                    className: 'flex flex-col gap-1',
                                    children: [
                                      e.jsx('span', {
                                        className: 'text-xs text-muted-foreground text-start',
                                        children: d('detail.updated'),
                                      }),
                                      e.jsx('span', {
                                        className: 'text-sm text-start',
                                        children: new Date(a.updated_at).toLocaleDateString(
                                          f.language,
                                          { year: 'numeric', month: 'long', day: 'numeric' },
                                        ),
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              e.jsxs(p.div, {
                                layout: !0,
                                initial: { opacity: 0 },
                                animate: { opacity: 1 },
                                className: 'flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4',
                                children: [
                                  t &&
                                    e.jsxs(S, {
                                      onClick: () => t(a.id, a.type),
                                      className: 'flex-1',
                                      children: [
                                        e.jsx(De, { className: n('h-4 w-4', u ? 'ms-2' : 'me-2') }),
                                        d('action.viewDetails'),
                                      ],
                                    }),
                                  o &&
                                    e.jsxs(S, {
                                      variant: 'outline',
                                      onClick: () => o(a.id),
                                      className: 'flex-1',
                                      children: [
                                        e.jsx(Pe, { className: n('h-4 w-4', u ? 'ms-2' : 'me-2') }),
                                        d('action.edit'),
                                      ],
                                    }),
                                ],
                              }),
                            ],
                          }),
                        }),
                      }),
                    ],
                  }),
                }),
              ],
            }),
        }),
      ],
    })
  )
}
function Qe(a, r) {
  const i = { className: r }
  switch (a) {
    case 'country':
      return e.jsx($, { ...i })
    case 'organization':
      return e.jsx(ie, { ...i })
    case 'forum':
      return e.jsx(ne, { ...i })
    case 'engagement':
      return e.jsx(re, { ...i })
    case 'topic':
      return e.jsx(te, { ...i })
    case 'working_group':
      return e.jsx(se, { ...i })
    case 'person':
      return e.jsx(ae, { ...i })
    default:
      return e.jsx($, { ...i })
  }
}
function Xe(a) {
  switch (a) {
    case 'country':
      return 'from-blue-500 to-blue-600'
    case 'organization':
      return 'from-purple-500 to-purple-600'
    case 'forum':
      return 'from-green-500 to-green-600'
    case 'engagement':
      return 'from-orange-500 to-orange-600'
    case 'topic':
      return 'from-pink-500 to-pink-600'
    case 'working_group':
      return 'from-indigo-500 to-indigo-600'
    case 'person':
      return 'from-teal-500 to-teal-600'
    default:
      return 'from-gray-500 to-gray-600'
  }
}
function Ye(a) {
  switch (a) {
    case 'country':
      return 'hover:from-blue-600 hover:to-blue-700'
    case 'organization':
      return 'hover:from-purple-600 hover:to-purple-700'
    case 'forum':
      return 'hover:from-green-600 hover:to-green-700'
    case 'engagement':
      return 'hover:from-orange-600 hover:to-orange-700'
    case 'topic':
      return 'hover:from-pink-600 hover:to-pink-700'
    case 'working_group':
      return 'hover:from-indigo-600 hover:to-indigo-700'
    case 'person':
      return 'hover:from-teal-600 hover:to-teal-700'
    default:
      return 'hover:from-gray-600 hover:to-gray-700'
  }
}
function Ze(a) {
  const r = { className: 'h-4 w-4' }
  switch (a) {
    case 'up':
      return e.jsx(Ue, { ...r })
    case 'down':
      return e.jsx(qe, { ...r })
    case 'stable':
      return e.jsx(Me, { ...r })
    default:
      return null
  }
}
function ea({
  type: a,
  totalCount: r,
  activeCount: i,
  inactiveCount: c,
  percentage: t,
  trend: o,
  trendValue: x,
  isSelected: b = !1,
  onClick: d,
  className: f,
}) {
  const { t: u, i18n: g } = D('dossier'),
    m = g.language === 'ar'
  return e.jsx(p.div, {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.2 },
    className: 'w-full aspect-square sm:aspect-auto',
    children: e.jsxs(Z, {
      className: n(
        'cursor-pointer h-full flex flex-col overflow-hidden',
        'transition-all duration-300',
        'hover:shadow-lg',
        b && 'ring-2 ring-offset-2',
        f,
      ),
      onClick: d,
      dir: m ? 'rtl' : 'ltr',
      children: [
        e.jsxs('div', {
          className: n(
            'bg-gradient-to-br',
            Xe(a),
            Ye(a),
            'text-white',
            'p-1.5 sm:p-3',
            'transition-all duration-300',
            'flex-shrink-0',
          ),
          children: [
            e.jsxs('div', {
              className: 'flex items-center justify-between mb-0.5 sm:mb-1',
              children: [
                e.jsx('div', {
                  className: 'p-0.5 sm:p-1.5 bg-white/20 backdrop-blur-sm rounded',
                  children: Qe(a, 'h-2.5 w-2.5 sm:h-4 sm:w-4'),
                }),
                e.jsx(p.div, {
                  initial: { scale: 0.9, opacity: 0 },
                  animate: { scale: 1, opacity: 1 },
                  transition: { duration: 0.3 },
                  className: n(
                    'inline-block px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded',
                    'bg-white/25 backdrop-blur-sm',
                    'text-[10px] sm:text-base font-bold leading-none',
                  ),
                  children: r,
                }),
              ],
            }),
            e.jsx('h3', {
              className: 'text-sm sm:text-base font-bold text-start leading-tight',
              children: u(`type.${a}`),
            }),
            o &&
              x &&
              e.jsxs(z, {
                variant: 'secondary',
                className:
                  'hidden sm:inline-flex mt-1 bg-white/20 backdrop-blur-sm text-white border-0 text-xs',
                children: [
                  Ze(o),
                  e.jsxs('span', {
                    className: n(m ? 'me-1' : 'ms-1'),
                    children: [x > 0 ? '+' : '', x, '%'],
                  }),
                ],
              }),
          ],
        }),
        e.jsxs(ee, {
          className: 'p-1.5 sm:p-3 flex-1 flex flex-col justify-between bg-white',
          children: [
            e.jsxs('div', {
              className: 'mb-2 sm:mb-3 text-center',
              children: [
                e.jsx('div', {
                  className: 'text-[10px] sm:text-xs font-medium text-muted-foreground mb-1',
                  children: '% of total active dossiers',
                }),
                e.jsxs('div', {
                  className: 'text-sm sm:text-lg font-bold text-foreground',
                  children: [Math.round(t), '%'],
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'grid grid-cols-2 gap-1 sm:gap-2',
              children: [
                e.jsxs('div', {
                  className: 'flex flex-col gap-0.5 items-center',
                  children: [
                    e.jsx('span', {
                      className:
                        'text-[10px] sm:text-xs text-muted-foreground text-center leading-tight',
                      children: u('status.active'),
                    }),
                    e.jsx('span', {
                      className:
                        'text-xs sm:text-base font-semibold text-green-600 dark:text-green-400 text-center',
                      children: i,
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'flex flex-col gap-0.5 items-center',
                  children: [
                    e.jsx('span', {
                      className:
                        'text-[10px] sm:text-xs text-muted-foreground text-center leading-tight',
                      children: u('status.inactive'),
                    }),
                    e.jsx('span', {
                      className:
                        'text-xs sm:text-base font-semibold text-yellow-600 dark:text-yellow-400 text-center',
                      children: c,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  })
}
function aa({ className: a }) {
  return e.jsx('div', {
    className: 'w-full aspect-square sm:aspect-auto',
    children: e.jsxs(Z, {
      className: n('h-full flex flex-col overflow-hidden', a),
      children: [
        e.jsxs('div', {
          className: 'bg-gradient-to-br from-gray-400 to-gray-500 p-1.5 sm:p-3 flex-shrink-0',
          children: [
            e.jsxs('div', {
              className: 'flex items-center justify-between mb-0.5 sm:mb-1',
              children: [
                e.jsx(w, { className: 'h-4 w-4 sm:h-7 sm:w-7 rounded bg-white/20' }),
                e.jsx(w, { className: 'h-5 sm:h-9 w-9 sm:w-16 rounded bg-white/20' }),
              ],
            }),
            e.jsx(w, { className: 'h-4 sm:h-5 w-16 sm:w-20 bg-white/20' }),
            e.jsx(w, { className: 'hidden sm:block h-4 w-12 rounded-full bg-white/20 mt-1' }),
          ],
        }),
        e.jsxs(ee, {
          className: 'p-1.5 sm:p-3 flex-1 flex flex-col justify-between bg-white',
          children: [
            e.jsxs('div', {
              className: 'mb-2 sm:mb-3 text-center',
              children: [
                e.jsx(w, { className: 'h-3 sm:h-4 w-24 sm:w-32 mx-auto mb-1' }),
                e.jsx(w, { className: 'h-4 sm:h-5 w-12 sm:w-16 mx-auto' }),
              ],
            }),
            e.jsxs('div', {
              className: 'grid grid-cols-2 gap-1 sm:gap-2',
              children: [
                e.jsxs('div', {
                  className: 'flex flex-col gap-0.5 items-center',
                  children: [
                    e.jsx(w, { className: 'h-2.5 sm:h-3 w-8' }),
                    e.jsx(w, { className: 'h-3 sm:h-4 w-4' }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'flex flex-col gap-0.5 items-center',
                  children: [
                    e.jsx(w, { className: 'h-2.5 sm:h-3 w-8' }),
                    e.jsx(w, { className: 'h-3 sm:h-4 w-4' }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  })
}
const sa = ['country', 'organization', 'forum', 'engagement', 'topic', 'working_group', 'person'],
  ta = ['active', 'inactive', 'archived']
function ra() {
  const { t: a, i18n: r } = D('dossier'),
    i = r.language === 'ar',
    c = xe(),
    [t, o] = k.useState({
      page: 1,
      page_size: 12,
      sort_by: 'updated_at',
      sort_order: 'desc',
      status: ['active'],
    }),
    [x, b] = k.useState(''),
    [d, f] = k.useState(null),
    [u, g] = k.useState(!1),
    { data: m, isLoading: h, isError: y, error: T } = pe(t),
    { data: j, isLoading: C } = be(),
    _ = fe(),
    N = (s, l) => {
      o((v) => ({ ...v, [s]: l, page: 1 }))
    },
    P = () => {
      o((s) => ({ ...s, search: x || void 0, page: 1 }))
    },
    oe = (s) => {
      o((l) => {
        const v = Array.isArray(l.status) ? l.status : l.status ? [l.status] : []
        if (v.includes(s)) {
          const I = v.filter((L) => L !== s)
          return { ...l, status: I.length > 0 ? I : void 0, page: 1 }
        } else return { ...l, status: [...v, s], page: 1 }
      })
    },
    M = (s) => {
      ;(o((l) => ({ ...l, page: s })), window.scrollTo({ top: 0, behavior: 'smooth' }))
    },
    ce = (s, l) => {
      switch (l) {
        case 'country':
          c({ to: '/dossiers/countries/$id', params: { id: s } })
          break
        case 'organization':
          c({ to: '/dossiers/organizations/$id', params: { id: s } })
          break
        case 'person':
          c({ to: '/dossiers/persons/$id', params: { id: s } })
          break
        case 'engagement':
          c({ to: '/dossiers/engagements/$id', params: { id: s } })
          break
        case 'forum':
          c({ to: '/dossiers/forums/$id', params: { id: s } })
          break
        case 'working_group':
          c({ to: '/dossiers/working_groups/$id', params: { id: s } })
          break
        case 'topic':
          c({ to: '/dossiers/topics/$id', params: { id: s } })
          break
        default:
          ;(console.warn(`Unknown dossier type: ${l}, defaulting to countries route`),
            c({ to: '/dossiers/countries/$id', params: { id: s } }))
      }
    },
    de = (s) => {
      c({ to: '/dossiers/$id/edit', params: { id: s } })
    },
    me = (s) => {
      t.type === s ? N('type', void 0) : N('type', s)
    },
    E = m ? Math.ceil(m.total / (t.page_size || 12)) : 0,
    ue = (s) => {
      const l = j?.[s]
      if (!l) return { count: 0, percentage: 0, activeCount: 0, inactiveCount: 0 }
      const v = j ? Object.values(j).reduce((L, he) => L + he.active, 0) : 0,
        I = v > 0 ? (l.active / v) * 100 : 0
      return { count: l.total, percentage: I, activeCount: l.active, inactiveCount: l.inactive }
    }
  return e.jsxs('div', {
    className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10',
    dir: i ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className:
          'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-10',
        children: [
          e.jsxs('div', {
            children: [
              e.jsx('h1', {
                className: 'text-3xl sm:text-4xl md:text-5xl font-bold text-start tracking-tight',
                children: a('list.title'),
              }),
              e.jsx('p', {
                className: 'text-sm sm:text-base text-muted-foreground/80 text-start mt-2 sm:mt-3',
                children: a('list.subtitle'),
              }),
            ],
          }),
          e.jsx(ge, {
            to: '/dossiers/create',
            children: e.jsxs(S, {
              className: n(
                'w-full sm:w-auto',
                'shadow-md hover:shadow-lg',
                'transition-all duration-200',
              ),
              children: [
                e.jsx(Re, { className: n('h-5 w-5', i ? 'ms-2' : 'me-2') }),
                a('list.createNew'),
              ],
            }),
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'mb-10',
        children: [
          e.jsx('h2', {
            className: 'text-xl sm:text-2xl font-bold text-start mb-4 sm:mb-6',
            children: a('list.typeOverview'),
          }),
          C
            ? e.jsx('div', {
                className:
                  'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-1.5 sm:gap-3 md:gap-4',
                children: Array.from({ length: 7 }).map((s, l) => e.jsx(aa, {}, l)),
              })
            : e.jsx('div', {
                className:
                  'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-1.5 sm:gap-3 md:gap-4',
                children: sa.map((s) => {
                  const l = ue(s)
                  return e.jsx(
                    ea,
                    {
                      type: s,
                      totalCount: l.count,
                      activeCount: l.activeCount,
                      inactiveCount: l.inactiveCount,
                      percentage: l.percentage,
                      isSelected: t.type === s,
                      onClick: () => me(s),
                    },
                    s,
                  )
                }),
              }),
        ],
      }),
      e.jsxs('div', {
        className: n(
          'rounded-3xl border border-black/5 p-5 sm:p-7 mb-8 space-y-6',
          'bg-white/60 backdrop-blur-xl',
          'shadow-[0_6px_20px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)]',
        ),
        children: [
          e.jsxs('div', {
            className: 'flex flex-col sm:flex-row gap-3 sm:gap-4',
            children: [
              e.jsx('div', {
                className: 'flex-1',
                children: e.jsxs('div', {
                  className: 'relative',
                  children: [
                    e.jsx(V, {
                      className: n(
                        'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50',
                        i ? 'end-4' : 'start-4',
                      ),
                    }),
                    e.jsx(we, {
                      placeholder: a('list.searchPlaceholder'),
                      value: x,
                      onChange: (s) => b(s.target.value),
                      onKeyDown: (s) => s.key === 'Enter' && P(),
                      className: n(
                        'h-12 w-full',
                        i ? 'pe-11 ps-4' : 'ps-11 pe-4',
                        'bg-white/40 border border-black/5',
                        'rounded-2xl',
                        'text-sm placeholder:text-muted-foreground/40',
                        'shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]',
                        'focus-visible:bg-white/60 focus-visible:border-black/10',
                        'focus-visible:shadow-[inset_0_2px_6px_rgba(0,0,0,0.08)]',
                        'transition-all duration-150',
                      ),
                    }),
                  ],
                }),
              }),
              e.jsxs(S, {
                onClick: P,
                className: n(
                  'w-full sm:w-auto px-6',
                  'rounded-xl',
                  'shadow-md hover:shadow-lg',
                  'transition-all duration-200',
                ),
                children: [
                  e.jsx(V, { className: n('h-4 w-4', i ? 'ms-2' : 'me-2') }),
                  a('list.search'),
                ],
              }),
            ],
          }),
          e.jsx('div', {
            className: 'space-y-3',
            children: e.jsxs('div', {
              className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4',
              children: [
                e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    e.jsxs(je, {
                      open: u,
                      onOpenChange: g,
                      children: [
                        e.jsx(ve, {
                          asChild: !0,
                          children: e.jsxs(S, {
                            variant: 'outline',
                            role: 'combobox',
                            'aria-expanded': u,
                            className: n(
                              'h-12 justify-between w-full',
                              'bg-white/40 border border-black/5',
                              'rounded-xl',
                              'shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)]',
                              'hover:bg-white/60 hover:border-black/10',
                              'transition-all duration-150',
                            ),
                            children: [
                              e.jsx('span', {
                                children:
                                  t.status &&
                                  (Array.isArray(t.status) ? t.status : [t.status]).length > 0
                                    ? `${(Array.isArray(t.status) ? t.status : [t.status]).length} status(es) selected`
                                    : a('list.filterByStatus'),
                              }),
                              e.jsx(Oe, { className: 'h-4 w-4 shrink-0 opacity-50' }),
                            ],
                          }),
                        }),
                        e.jsx(ye, {
                          className: 'w-[250px] p-0',
                          align: 'start',
                          children: e.jsxs(Ne, {
                            children: [
                              e.jsx(ke, {
                                placeholder: a('filter.search_status', 'Search statuses...'),
                              }),
                              e.jsxs(Ce, {
                                children: [
                                  e.jsx(_e, {
                                    children: a('filter.no_status_found', 'No status found'),
                                  }),
                                  e.jsx(ze, {
                                    children: ta.map((s) => {
                                      const v = (
                                        Array.isArray(t.status)
                                          ? t.status
                                          : t.status
                                            ? [t.status]
                                            : []
                                      ).includes(s)
                                      return e.jsxs(
                                        Se,
                                        {
                                          value: s,
                                          onSelect: () => oe(s),
                                          children: [
                                            e.jsx(Fe, {
                                              className: n(
                                                'me-2 h-4 w-4',
                                                v ? 'opacity-100' : 'opacity-0',
                                              ),
                                            }),
                                            a(`status.${s}`),
                                          ],
                                        },
                                        s,
                                      )
                                    }),
                                  }),
                                ],
                              }),
                            ],
                          }),
                        }),
                      ],
                    }),
                    t.status &&
                      (Array.isArray(t.status) ? t.status : [t.status]).length > 0 &&
                      e.jsx('div', {
                        className: 'flex flex-wrap gap-1',
                        children: (Array.isArray(t.status) ? t.status : [t.status]).map((s) =>
                          e.jsx(
                            z,
                            {
                              variant: 'secondary',
                              className: 'text-xs',
                              children: a(`status.${s}`),
                            },
                            s,
                          ),
                        ),
                      }),
                  ],
                }),
                e.jsxs(q, {
                  value: t.sort_by,
                  onValueChange: (s) => N('sort_by', s),
                  children: [
                    e.jsx(U, {
                      className: n(
                        'h-12',
                        'bg-white/40 border border-black/5',
                        'rounded-xl',
                        'shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)]',
                        'hover:bg-white/60 hover:border-black/10',
                        'transition-all duration-150',
                      ),
                      children: e.jsx(R, { placeholder: a('list.sortBy') }),
                    }),
                    e.jsxs(O, {
                      className: 'rounded-xl',
                      children: [
                        e.jsx(A, { value: 'updated_at', children: a('list.sortUpdated') }),
                        e.jsx(A, { value: 'created_at', children: a('list.sortCreated') }),
                        e.jsx(A, { value: 'name_en', children: a('list.sortNameEn') }),
                        e.jsx(A, { value: 'name_ar', children: a('list.sortNameAr') }),
                      ],
                    }),
                  ],
                }),
                e.jsxs(q, {
                  value: t.sort_order,
                  onValueChange: (s) => N('sort_order', s),
                  children: [
                    e.jsx(U, {
                      className: n(
                        'h-12',
                        'bg-white/40 border border-black/5',
                        'rounded-xl',
                        'shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)]',
                        'hover:bg-white/60 hover:border-black/10',
                        'transition-all duration-150',
                      ),
                      children: e.jsx(R, { placeholder: a('list.sortOrder') }),
                    }),
                    e.jsxs(O, {
                      className: 'rounded-xl',
                      children: [
                        e.jsx(A, { value: 'desc', children: a('list.sortDesc') }),
                        e.jsx(A, { value: 'asc', children: a('list.sortAsc') }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),
        ],
      }),
      h &&
        e.jsx('div', {
          className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7',
          children: Array.from({ length: 6 }).map((s, l) =>
            e.jsx(w, { className: 'h-72 sm:h-80 rounded-2xl' }, l),
          ),
        }),
      y &&
        e.jsxs($e, {
          variant: 'destructive',
          className: n('rounded-2xl border-destructive/20', 'bg-destructive/5'),
          children: [
            e.jsx(Be, { className: 'h-5 w-5' }),
            e.jsx(Te, { className: 'text-base font-semibold', children: a('list.errorTitle') }),
            e.jsx(Ae, { className: 'text-sm', children: T?.message || a('list.errorMessage') }),
          ],
        }),
      !h &&
        !y &&
        m &&
        e.jsxs(e.Fragment, {
          children: [
            m.total > 0 &&
              e.jsx('div', {
                className: 'flex items-center justify-between mb-6',
                children: e.jsx('p', {
                  className: 'text-sm font-medium text-muted-foreground/70 text-start',
                  children: a('list.showing', {
                    from: ((t.page || 1) - 1) * (t.page_size || 12) + 1,
                    to: Math.min((t.page || 1) * (t.page_size || 12), m.total),
                    total: m.total,
                  }),
                }),
              }),
            m.data.length === 0
              ? e.jsx('div', {
                  className: n(
                    'text-center py-16 px-4',
                    'rounded-2xl',
                    'bg-white/40 border border-black/5',
                  ),
                  children: e.jsx('p', {
                    className: 'text-muted-foreground text-base',
                    children: a('list.noDossiers'),
                  }),
                })
              : e.jsx('div', {
                  className:
                    'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7 mb-10',
                  children: m.data.map((s) =>
                    e.jsx(
                      Je,
                      {
                        dossier: s,
                        isActive: d === s.id,
                        onActivate: () => f(s.id),
                        onDeactivate: () => f(null),
                        onView: ce,
                        onEdit: de,
                        onMouseEnter: () => _(s.id),
                      },
                      s.id,
                    ),
                  ),
                }),
            E > 1 &&
              e.jsxs('div', {
                className: n(
                  'flex flex-col sm:flex-row items-center justify-between gap-4',
                  'pt-6 mt-2',
                  'border-t border-black/5',
                ),
                children: [
                  e.jsx('p', {
                    className: 'text-sm font-medium text-muted-foreground/70',
                    children: a('list.page', { current: t.page || 1, total: E }),
                  }),
                  e.jsxs('div', {
                    className: 'flex items-center gap-2',
                    children: [
                      e.jsxs(S, {
                        variant: 'outline',
                        size: 'sm',
                        onClick: () => M((t.page || 1) - 1),
                        disabled: (t.page || 1) === 1,
                        className: n(
                          'px-4',
                          'rounded-xl',
                          'bg-white/40 border border-black/5',
                          'hover:bg-white/60 hover:border-black/10',
                          'disabled:opacity-40 disabled:cursor-not-allowed',
                          'shadow-sm hover:shadow-md',
                          'transition-all duration-150',
                        ),
                        children: [
                          e.jsx(Ge, { className: n('h-4 w-4', i && 'rotate-180') }),
                          e.jsx('span', {
                            className: n('sm:inline hidden', i ? 'me-2' : 'ms-2'),
                            children: a('list.previous'),
                          }),
                        ],
                      }),
                      e.jsxs(S, {
                        variant: 'outline',
                        size: 'sm',
                        onClick: () => M((t.page || 1) + 1),
                        disabled: (t.page || 1) === E,
                        className: n(
                          'px-4',
                          'rounded-xl',
                          'bg-white/40 border border-black/5',
                          'hover:bg-white/60 hover:border-black/10',
                          'disabled:opacity-40 disabled:cursor-not-allowed',
                          'shadow-sm hover:shadow-md',
                          'transition-all duration-150',
                        ),
                        children: [
                          e.jsx('span', {
                            className: n('sm:inline hidden', i ? 'ms-2' : 'me-2'),
                            children: a('list.next'),
                          }),
                          e.jsx(He, { className: n('h-4 w-4', i && 'rotate-180') }),
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
const wa = ra
export { wa as component }
//# sourceMappingURL=index-CMZHLQ7F.js.map
