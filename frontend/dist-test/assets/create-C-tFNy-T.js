import { u as $, j as e, o as G, r as B } from './react-vendor-Buoak6m3.js'
import { i as M } from './tanstack-vendor-BZC-rs5U.js'
import { e as q } from './useDossier-CiPcwRKl.js'
import {
  c,
  j as z,
  k as F,
  o as E,
  l as P,
  V as A,
  aA as H,
  m as J,
  aB as d,
  aC as p,
  aD as x,
  aE as h,
  I as w,
  aF as j,
  n as T,
  q as I,
  r as L,
  t as V,
  v as R,
  w as S,
  aG as k,
  a2 as O,
  B as K,
} from './index-qYY0KoZ1.js'
import {
  aK as Q,
  aJ as X,
  aI as W,
  aR as Y,
  b_ as Z,
  bC as ee,
  aT as se,
  aG as te,
  aQ as re,
  aS as ae,
  aX as le,
  aP as U,
} from './vendor-misc-BiJvMP0A.js'
import { o as f, a as ne, n as C, e as N, s as t } from './form-vendor-BX1BhTCI.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './visualization-vendor-f5uYUx4I.js'
const ie = [
  {
    type: 'country',
    icon: Q,
    colorClass: 'text-blue-600 dark:text-blue-400',
    descriptionKey: 'typeDescription.country',
  },
  {
    type: 'organization',
    icon: X,
    colorClass: 'text-purple-600 dark:text-purple-400',
    descriptionKey: 'typeDescription.organization',
  },
  {
    type: 'forum',
    icon: W,
    colorClass: 'text-green-600 dark:text-green-400',
    descriptionKey: 'typeDescription.forum',
  },
  {
    type: 'engagement',
    icon: Y,
    colorClass: 'text-orange-600 dark:text-orange-400',
    descriptionKey: 'typeDescription.engagement',
  },
  {
    type: 'theme',
    icon: Z,
    colorClass: 'text-pink-600 dark:text-pink-400',
    descriptionKey: 'typeDescription.theme',
  },
  {
    type: 'working_group',
    icon: ee,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    descriptionKey: 'typeDescription.working_group',
  },
  {
    type: 'person',
    icon: se,
    colorClass: 'text-teal-600 dark:text-teal-400',
    descriptionKey: 'typeDescription.person',
  },
]
function oe({ value: a, onChange: _, className: v, disabled: o = !1 }) {
  const { t: g, i18n: u } = $('dossier'),
    s = u.language === 'ar'
  return e.jsx('div', {
    className: c('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6', v),
    dir: s ? 'rtl' : 'ltr',
    children: ie.map((l) => {
      const b = l.icon,
        m = a === l.type
      return e.jsxs(
        z,
        {
          className: c(
            'relative cursor-pointer transition-all',
            'hover:shadow-md hover:border-primary',
            'min-h-[120px] sm:min-h-[140px]',
            m && 'border-primary ring-2 ring-primary ring-offset-2',
            o && 'opacity-50 cursor-not-allowed',
          ),
          onClick: () => !o && _(l.type),
          role: 'button',
          tabIndex: o ? -1 : 0,
          onKeyDown: (n) => {
            !o && (n.key === 'Enter' || n.key === ' ') && (n.preventDefault(), _(l.type))
          },
          'aria-pressed': m,
          'aria-disabled': o,
          children: [
            m &&
              e.jsx('div', {
                className: c(
                  'absolute top-2 end-2 bg-primary text-primary-foreground rounded-full p-1',
                  'animate-in zoom-in duration-200',
                ),
                children: e.jsx(te, { className: 'h-4 w-4' }),
              }),
            e.jsxs(F, {
              className: 'flex flex-col items-center gap-2 p-4 sm:p-6',
              children: [
                e.jsx('div', {
                  className: c(
                    'flex items-center justify-center',
                    'h-12 w-12 sm:h-14 sm:w-14',
                    'rounded-lg bg-muted',
                    m && 'bg-primary/10',
                  ),
                  children: e.jsx(b, { className: c('h-6 w-6 sm:h-7 sm:w-7', l.colorClass) }),
                }),
                e.jsx(E, {
                  className: 'text-base sm:text-lg text-center',
                  children: g(`type.${l.type}`),
                }),
              ],
            }),
            e.jsx(P, {
              className: 'px-4 sm:px-6 pb-4 sm:pb-6 pt-0',
              children: e.jsx(A, {
                className: 'text-xs sm:text-sm text-center line-clamp-3',
                children: g(l.descriptionKey),
              }),
            }),
          ],
        },
        l.type,
      )
    }),
  })
}
const ce = f({
  name_en: t().min(2, { message: 'English name must be at least 2 characters' }),
  name_ar: t().min(2, { message: 'Arabic name must be at least 2 characters' }),
  description_en: t().optional(),
  description_ar: t().optional(),
  status: N(['active', 'inactive', 'archived', 'deleted']).default('active'),
  sensitivity_level: C().min(0).max(5).default(0),
  tags: ne(t()).optional(),
})
f({
  iso_code_2: t().length(2).optional(),
  iso_code_3: t().length(3).optional(),
  capital_en: t().optional(),
  capital_ar: t().optional(),
  region: t().optional(),
  subregion: t().optional(),
  population: C().positive().optional(),
  area_sq_km: C().positive().optional(),
  flag_url: t().url().optional(),
})
f({
  org_code: t().optional(),
  org_type: N(['government', 'ngo', 'private', 'international', 'academic']).optional(),
  website: t().url().optional(),
  email: t().email().optional(),
  phone: t().optional(),
  address_en: t().optional(),
  address_ar: t().optional(),
  logo_url: t().url().optional(),
  established_date: t().optional(),
})
f({
  number_of_sessions: C().int().positive().optional(),
  registration_fee: C().nonnegative().optional(),
  currency: t().length(3).optional(),
  agenda_url: t().url().optional(),
  live_stream_url: t().url().optional(),
})
f({
  engagement_type: N([
    'meeting',
    'consultation',
    'coordination',
    'workshop',
    'conference',
    'site_visit',
    'ceremony',
  ]).optional(),
  engagement_category: N(['bilateral', 'multilateral', 'regional', 'internal']).optional(),
  location_en: t().optional(),
  location_ar: t().optional(),
})
f({ theme_category: N(['policy', 'technical', 'strategic', 'operational']).optional() })
f({
  mandate_en: t().optional(),
  mandate_ar: t().optional(),
  wg_status: N(['active', 'suspended', 'disbanded']).optional(),
  established_date: t().optional(),
  disbandment_date: t().optional(),
})
f({
  title_en: t().optional(),
  title_ar: t().optional(),
  biography_en: t().optional(),
  biography_ar: t().optional(),
  photo_url: t().url().optional(),
})
function me({ dossier: a, type: _, onSubmit: v, onCancel: o, isLoading: g = !1, className: u }) {
  const { t: s, i18n: l } = $('dossier'),
    b = l.language === 'ar',
    m = !!a,
    n = m ? a.type : _,
    i = G({
      resolver: re(ce),
      defaultValues: {
        name_en: a?.name_en || '',
        name_ar: a?.name_ar || '',
        description_en: a?.description_en || '',
        description_ar: a?.description_ar || '',
        status: a?.status || 'active',
        sensitivity_level: a?.sensitivity_level || 0,
        tags: a?.tags || [],
      },
    }),
    D = (r) => {
      v(!m && n ? { ...r, type: n } : r)
    }
  return e.jsx('div', {
    className: c('w-full', u),
    dir: b ? 'rtl' : 'ltr',
    children: e.jsx(H, {
      ...i,
      children: e.jsxs('form', {
        onSubmit: i.handleSubmit(D),
        className: 'space-y-4 sm:space-y-6',
        children: [
          m &&
            n &&
            e.jsx('div', {
              className: 'flex items-center gap-2',
              children: e.jsx(J, {
                variant: 'outline',
                className: 'text-xs sm:text-sm',
                children: s(`type.${n}`),
              }),
            }),
          e.jsxs('div', {
            className: 'space-y-4',
            children: [
              e.jsx('h3', {
                className: 'text-base sm:text-lg font-semibold text-start',
                children: s('form.basicInformation'),
              }),
              e.jsxs('div', {
                className: 'grid grid-cols-1 md:grid-cols-2 gap-4',
                children: [
                  e.jsx(d, {
                    control: i.control,
                    name: 'name_en',
                    render: ({ field: r }) =>
                      e.jsxs(p, {
                        children: [
                          e.jsx(x, { children: s('form.nameEn') }),
                          e.jsx(h, {
                            children: e.jsx(w, {
                              ...r,
                              placeholder: s('form.nameEnPlaceholder'),
                              className: '',
                            }),
                          }),
                          e.jsx(j, {}),
                        ],
                      }),
                  }),
                  e.jsx(d, {
                    control: i.control,
                    name: 'name_ar',
                    render: ({ field: r }) =>
                      e.jsxs(p, {
                        children: [
                          e.jsx(x, { children: s('form.nameAr') }),
                          e.jsx(h, {
                            children: e.jsx(w, {
                              ...r,
                              placeholder: s('form.nameArPlaceholder'),
                              className: '',
                              dir: 'rtl',
                            }),
                          }),
                          e.jsx(j, {}),
                        ],
                      }),
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'grid grid-cols-1 md:grid-cols-2 gap-4',
                children: [
                  e.jsx(d, {
                    control: i.control,
                    name: 'description_en',
                    render: ({ field: r }) =>
                      e.jsxs(p, {
                        children: [
                          e.jsx(x, { children: s('form.descriptionEn') }),
                          e.jsx(h, {
                            children: e.jsx(T, {
                              ...r,
                              placeholder: s('form.descriptionEnPlaceholder'),
                              className: 'min-h-[88px]',
                              rows: 3,
                            }),
                          }),
                          e.jsx(j, {}),
                        ],
                      }),
                  }),
                  e.jsx(d, {
                    control: i.control,
                    name: 'description_ar',
                    render: ({ field: r }) =>
                      e.jsxs(p, {
                        children: [
                          e.jsx(x, { children: s('form.descriptionAr') }),
                          e.jsx(h, {
                            children: e.jsx(T, {
                              ...r,
                              placeholder: s('form.descriptionArPlaceholder'),
                              className: 'min-h-[88px]',
                              dir: 'rtl',
                              rows: 3,
                            }),
                          }),
                          e.jsx(j, {}),
                        ],
                      }),
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
                children: [
                  e.jsx(d, {
                    control: i.control,
                    name: 'status',
                    render: ({ field: r }) =>
                      e.jsxs(p, {
                        children: [
                          e.jsx(x, { children: s('form.status') }),
                          e.jsxs(I, {
                            onValueChange: r.onChange,
                            defaultValue: r.value,
                            children: [
                              e.jsx(h, {
                                children: e.jsx(L, {
                                  className: '',
                                  children: e.jsx(V, { placeholder: s('form.selectStatus') }),
                                }),
                              }),
                              e.jsxs(R, {
                                children: [
                                  e.jsx(S, { value: 'active', children: s('status.active') }),
                                  e.jsx(S, { value: 'inactive', children: s('status.inactive') }),
                                  e.jsx(S, { value: 'archived', children: s('status.archived') }),
                                ],
                              }),
                            ],
                          }),
                          e.jsx(j, {}),
                        ],
                      }),
                  }),
                  e.jsx(d, {
                    control: i.control,
                    name: 'sensitivity_level',
                    render: ({ field: r }) =>
                      e.jsxs(p, {
                        children: [
                          e.jsx(x, { children: s('form.sensitivityLevel') }),
                          e.jsxs(I, {
                            onValueChange: (y) => r.onChange(Number(y)),
                            defaultValue: String(r.value),
                            children: [
                              e.jsx(h, {
                                children: e.jsx(L, {
                                  className: '',
                                  children: e.jsx(V, { placeholder: s('form.selectSensitivity') }),
                                }),
                              }),
                              e.jsx(R, {
                                children: [0, 1, 2, 3, 4, 5].map((y) =>
                                  e.jsx(
                                    S,
                                    { value: String(y), children: s(`sensitivityLevel.${y}`) },
                                    y,
                                  ),
                                ),
                              }),
                            ],
                          }),
                          e.jsx(k, { children: s('form.sensitivityDescription') }),
                          e.jsx(j, {}),
                        ],
                      }),
                  }),
                ],
              }),
            ],
          }),
          e.jsx(O, {}),
          n &&
            e.jsxs('div', {
              className: 'space-y-4',
              children: [
                e.jsx('h3', {
                  className: 'text-base sm:text-lg font-semibold text-start',
                  children: s(`form.${n}Fields`),
                }),
                n === 'person' &&
                  e.jsxs('div', {
                    className: 'space-y-4',
                    children: [
                      e.jsxs('div', {
                        className: 'grid grid-cols-1 md:grid-cols-2 gap-4',
                        children: [
                          e.jsx(d, {
                            control: i.control,
                            name: 'extension_data.title_en',
                            render: ({ field: r }) =>
                              e.jsxs(p, {
                                children: [
                                  e.jsx(x, { children: s('form.person.titleEn') }),
                                  e.jsx(h, {
                                    children: e.jsx(w, {
                                      ...r,
                                      placeholder: s('form.person.titleEnPlaceholder'),
                                      className: '',
                                    }),
                                  }),
                                  e.jsx(k, { children: s('form.person.titleDescription') }),
                                  e.jsx(j, {}),
                                ],
                              }),
                          }),
                          e.jsx(d, {
                            control: i.control,
                            name: 'extension_data.title_ar',
                            render: ({ field: r }) =>
                              e.jsxs(p, {
                                children: [
                                  e.jsx(x, { children: s('form.person.titleAr') }),
                                  e.jsx(h, {
                                    children: e.jsx(w, {
                                      ...r,
                                      placeholder: s('form.person.titleArPlaceholder'),
                                      className: '',
                                      dir: 'rtl',
                                    }),
                                  }),
                                  e.jsx(j, {}),
                                ],
                              }),
                          }),
                        ],
                      }),
                      e.jsx(d, {
                        control: i.control,
                        name: 'extension_data.photo_url',
                        render: ({ field: r }) =>
                          e.jsxs(p, {
                            children: [
                              e.jsx(x, { children: s('form.person.photoUrl') }),
                              e.jsx(h, {
                                children: e.jsx(w, {
                                  ...r,
                                  type: 'url',
                                  placeholder: s('form.person.photoUrlPlaceholder'),
                                  className: '',
                                }),
                              }),
                              e.jsx(k, { children: s('form.person.photoUrlDescription') }),
                              e.jsx(j, {}),
                            ],
                          }),
                      }),
                      e.jsxs('div', {
                        className: 'grid grid-cols-1 md:grid-cols-2 gap-4',
                        children: [
                          e.jsx(d, {
                            control: i.control,
                            name: 'extension_data.biography_en',
                            render: ({ field: r }) =>
                              e.jsxs(p, {
                                children: [
                                  e.jsx(x, { children: s('form.person.biographyEn') }),
                                  e.jsx(h, {
                                    children: e.jsx(T, {
                                      ...r,
                                      placeholder: s('form.person.biographyEnPlaceholder'),
                                      className: 'min-h-[120px]',
                                      rows: 5,
                                    }),
                                  }),
                                  e.jsx(j, {}),
                                ],
                              }),
                          }),
                          e.jsx(d, {
                            control: i.control,
                            name: 'extension_data.biography_ar',
                            render: ({ field: r }) =>
                              e.jsxs(p, {
                                children: [
                                  e.jsx(x, { children: s('form.person.biographyAr') }),
                                  e.jsx(h, {
                                    children: e.jsx(T, {
                                      ...r,
                                      placeholder: s('form.person.biographyArPlaceholder'),
                                      className: 'min-h-[120px]',
                                      dir: 'rtl',
                                      rows: 5,
                                    }),
                                  }),
                                  e.jsx(j, {}),
                                ],
                              }),
                          }),
                        ],
                      }),
                    ],
                  }),
                n !== 'person' &&
                  e.jsx('p', {
                    className: 'text-sm text-muted-foreground text-start',
                    children: s('form.typeSpecificFieldsPlaceholder', { type: s(`type.${n}`) }),
                  }),
              ],
            }),
          e.jsxs('div', {
            className:
              'flex flex-col-reverse sm:flex-row gap-2 sm:gap-4 sm:justify-end pt-4 sm:pt-6',
            children: [
              o &&
                e.jsx(K, {
                  type: 'button',
                  variant: 'outline',
                  onClick: o,
                  disabled: g,
                  className: ' w-full sm:w-auto',
                  children: s('form.cancel'),
                }),
              e.jsxs(K, {
                type: 'submit',
                disabled: g,
                className: ' w-full sm:w-auto',
                children: [
                  g && e.jsx(ae, { className: c('h-4 w-4 animate-spin', b ? 'ms-2' : 'me-2') }),
                  s(m ? 'form.update' : 'form.create'),
                ],
              }),
            ],
          }),
        ],
      }),
    }),
  })
}
function de() {
  const { t: a, i18n: _ } = $('dossier'),
    v = _.language === 'ar',
    o = M(),
    g = q(),
    [u, s] = B.useState(null),
    [l, b] = B.useState('select-type'),
    m = () => {
      l === 'fill-form' ? (b('select-type'), s(null)) : o({ to: '/dossiers' })
    },
    n = (r) => {
      ;(s(r), b('fill-form'))
    },
    i = async (r) => {
      try {
        const y = await g.mutateAsync(r)
        ;(U.success(a('create.success')), o({ to: `/dossiers/${y.id}` }))
      } catch (y) {
        U.error(y?.message || a('create.error'))
      }
    },
    D = () => {
      o({ to: '/dossiers' })
    }
  return e.jsxs('div', {
    className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8',
    dir: v ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className:
          'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8',
        children: [
          e.jsxs('div', {
            children: [
              e.jsx('h1', {
                className: 'text-2xl sm:text-3xl md:text-4xl font-bold text-start',
                children: a('create.title'),
              }),
              e.jsx('p', {
                className: 'text-sm sm:text-base text-muted-foreground text-start mt-1 sm:mt-2',
                children:
                  l === 'select-type'
                    ? a('create.subtitleSelectType')
                    : a('create.subtitleFillForm', { type: u ? a(`type.${u}`) : '' }),
              }),
            ],
          }),
          e.jsxs(K, {
            onClick: m,
            variant: 'ghost',
            size: 'sm',
            className: ' self-start sm:self-center',
            children: [
              e.jsx(le, { className: c('h-4 w-4', v ? 'ms-2 rotate-180' : 'me-2') }),
              a(l === 'fill-form' ? 'create.changeType' : 'create.cancel'),
            ],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8',
        children: [
          e.jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              e.jsx('div', {
                className: c(
                  'flex items-center justify-center h-8 w-8 rounded-full text-xs sm:text-sm font-semibold',
                  l === 'select-type'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/20 text-primary',
                ),
                children: '1',
              }),
              e.jsx('span', {
                className: c(
                  'text-xs sm:text-sm font-medium',
                  l === 'select-type' ? 'text-primary' : 'text-muted-foreground',
                ),
                children: a('create.step1'),
              }),
            ],
          }),
          e.jsx('div', { className: 'h-px w-8 sm:w-16 bg-border' }),
          e.jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              e.jsx('div', {
                className: c(
                  'flex items-center justify-center h-8 w-8 rounded-full text-xs sm:text-sm font-semibold',
                  l === 'fill-form'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                ),
                children: '2',
              }),
              e.jsx('span', {
                className: c(
                  'text-xs sm:text-sm font-medium',
                  l === 'fill-form' ? 'text-primary' : 'text-muted-foreground',
                ),
                children: a('create.step2'),
              }),
            ],
          }),
        ],
      }),
      e.jsxs(z, {
        className: 'max-w-4xl mx-auto',
        children: [
          l === 'select-type' &&
            e.jsxs(e.Fragment, {
              children: [
                e.jsxs(F, {
                  className: 'p-4 sm:p-6',
                  children: [
                    e.jsx(E, {
                      className: 'text-lg sm:text-xl text-start',
                      children: a('create.selectTypeTitle'),
                    }),
                    e.jsx(A, {
                      className: 'text-sm sm:text-base text-start',
                      children: a('create.selectTypeDescription'),
                    }),
                  ],
                }),
                e.jsx(P, { className: 'p-4 sm:p-6', children: e.jsx(oe, { onChange: n }) }),
              ],
            }),
          l === 'fill-form' &&
            u &&
            e.jsxs(e.Fragment, {
              children: [
                e.jsxs(F, {
                  className: 'p-4 sm:p-6',
                  children: [
                    e.jsx(E, {
                      className: 'text-lg sm:text-xl text-start',
                      children: a('create.fillFormTitle', { type: a(`type.${u}`) }),
                    }),
                    e.jsx(A, {
                      className: 'text-sm sm:text-base text-start',
                      children: a('create.fillFormDescription'),
                    }),
                  ],
                }),
                e.jsx(P, {
                  className: 'p-4 sm:p-6',
                  children: e.jsx(me, {
                    type: u,
                    onSubmit: i,
                    onCancel: D,
                    isLoading: g.isPending,
                  }),
                }),
              ],
            }),
        ],
      }),
      e.jsx('div', {
        className: 'max-w-4xl mx-auto mt-4 sm:mt-6 p-4 bg-muted rounded-lg',
        children: e.jsxs('p', {
          className: 'text-xs sm:text-sm text-muted-foreground text-start',
          children: [
            e.jsxs('strong', { children: [a('create.helpTitle'), ':'] }),
            ' ',
            a('create.helpText'),
          ],
        }),
      }),
    ],
  })
}
const Ne = de
export { Ne as component }
//# sourceMappingURL=create-C-tFNy-T.js.map
