import { u as E, o as L, j as e } from './react-vendor-Buoak6m3.js'
import { i as P } from './tanstack-vendor-BZC-rs5U.js'
import {
  aQ as T,
  aX as D,
  aT as F,
  dx as B,
  bz as w,
  dj as z,
  aK as C,
  bC as R,
  cg as V,
  aS as M,
  bq as U,
} from './vendor-misc-BiJvMP0A.js'
import {
  B as _,
  aA as $,
  j as d,
  k as h,
  o as p,
  V as q,
  l as j,
  aB as n,
  aC as i,
  aD as l,
  aE as t,
  I as m,
  aF as o,
  q as G,
  r as H,
  t as O,
  v as X,
  w as J,
  aG as N,
  n as I,
} from './index-qYY0KoZ1.js'
import { a as K, I as A } from './person.types-Ck48Y8hE.js'
import { o as Q, s as c, n as W, l as b } from './form-vendor-BX1BhTCI.js'
import './date-vendor-s0MkYge4.js'
import './visualization-vendor-f5uYUx4I.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
const Y = Q({
  name_en: c().min(2, 'Name must be at least 2 characters').max(200),
  name_ar: c().min(2, 'Name must be at least 2 characters').max(200),
  title_en: c().max(200).optional(),
  title_ar: c().max(200).optional(),
  email: c().email('Invalid email').optional().or(b('')),
  phone: c().max(50).optional(),
  organization_name: c().max(200).optional(),
  biography_en: c().max(5e3).optional(),
  biography_ar: c().max(5e3).optional(),
  linkedin_url: c().url('Invalid URL').optional().or(b('')),
  twitter_url: c().url('Invalid URL').optional().or(b('')),
  importance_level: W().min(1).max(5).default(1),
  languages: c().optional(),
  expertise_areas: c().optional(),
})
function Z() {
  const { t: r, i18n: S } = E('persons'),
    g = S.language === 'ar',
    y = P(),
    u = K(),
    a = L({
      resolver: T(Y),
      defaultValues: {
        name_en: '',
        name_ar: '',
        title_en: '',
        title_ar: '',
        email: '',
        phone: '',
        organization_name: '',
        biography_en: '',
        biography_ar: '',
        linkedin_url: '',
        twitter_url: '',
        importance_level: 1,
        languages: '',
        expertise_areas: '',
      },
    }),
    k = async (s) => {
      try {
        const x = await u.mutateAsync({
          name_en: s.name_en,
          name_ar: s.name_ar,
          title_en: s.title_en || void 0,
          title_ar: s.title_ar || void 0,
          email: s.email || void 0,
          phone: s.phone || void 0,
          biography_en: s.biography_en || void 0,
          biography_ar: s.biography_ar || void 0,
          linkedin_url: s.linkedin_url || void 0,
          twitter_url: s.twitter_url || void 0,
          importance_level: s.importance_level,
          languages: s.languages ? s.languages.split(',').map((f) => f.trim()) : void 0,
          expertise_areas: s.expertise_areas
            ? s.expertise_areas.split(',').map((f) => f.trim())
            : void 0,
        })
        y({ to: '/persons/$personId', params: { personId: x.id } })
      } catch {}
    },
    v = () => {
      y({ to: '/persons' })
    }
  return e.jsxs('div', {
    className: 'min-h-screen bg-background',
    dir: g ? 'rtl' : 'ltr',
    children: [
      e.jsx('header', {
        className: 'border-b bg-background sticky top-0 z-10',
        children: e.jsx('div', {
          className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-4',
          children: e.jsxs('div', {
            className: 'flex items-center gap-4',
            children: [
              e.jsx(_, {
                variant: 'ghost',
                size: 'icon',
                onClick: v,
                className: 'h-10 w-10',
                children: e.jsx(D, { className: `h-5 w-5 ${g ? 'rotate-180' : ''}` }),
              }),
              e.jsxs('div', {
                children: [
                  e.jsx('h1', {
                    className: 'text-xl sm:text-2xl font-bold',
                    children: r('create.title', 'Add New Person'),
                  }),
                  e.jsx('p', {
                    className: 'text-sm text-muted-foreground',
                    children: r('create.subtitle', 'Create a new contact profile'),
                  }),
                ],
              }),
            ],
          }),
        }),
      }),
      e.jsx('main', {
        className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6',
        children: e.jsx($, {
          ...a,
          children: e.jsxs('form', {
            onSubmit: a.handleSubmit(k),
            className: 'space-y-6 max-w-2xl mx-auto',
            children: [
              e.jsxs(d, {
                children: [
                  e.jsxs(h, {
                    children: [
                      e.jsxs(p, {
                        className: 'flex items-center gap-2 text-lg',
                        children: [
                          e.jsx(F, { className: 'h-5 w-5 text-primary' }),
                          r('create.sections.basicInfo', 'Basic Information'),
                        ],
                      }),
                      e.jsx(q, {
                        children: r(
                          'create.sections.basicInfoDescription',
                          "Enter the person's name and title",
                        ),
                      }),
                    ],
                  }),
                  e.jsxs(j, {
                    className: 'space-y-4',
                    children: [
                      e.jsxs('div', {
                        className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
                        children: [
                          e.jsx(n, {
                            control: a.control,
                            name: 'name_en',
                            render: ({ field: s }) =>
                              e.jsxs(i, {
                                children: [
                                  e.jsxs(l, {
                                    children: [r('form.nameEn', 'Name (English)'), ' *'],
                                  }),
                                  e.jsx(t, {
                                    children: e.jsx(m, { placeholder: 'John Doe', ...s }),
                                  }),
                                  e.jsx(o, {}),
                                ],
                              }),
                          }),
                          e.jsx(n, {
                            control: a.control,
                            name: 'name_ar',
                            render: ({ field: s }) =>
                              e.jsxs(i, {
                                children: [
                                  e.jsxs(l, {
                                    children: [r('form.nameAr', 'Name (Arabic)'), ' *'],
                                  }),
                                  e.jsx(t, {
                                    children: e.jsx(m, { placeholder: 'جون دو', dir: 'rtl', ...s }),
                                  }),
                                  e.jsx(o, {}),
                                ],
                              }),
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
                        children: [
                          e.jsx(n, {
                            control: a.control,
                            name: 'title_en',
                            render: ({ field: s }) =>
                              e.jsxs(i, {
                                children: [
                                  e.jsx(l, { children: r('form.titleEn', 'Title (English)') }),
                                  e.jsx(t, {
                                    children: e.jsx(m, {
                                      placeholder: 'Director of Operations',
                                      ...s,
                                    }),
                                  }),
                                  e.jsx(o, {}),
                                ],
                              }),
                          }),
                          e.jsx(n, {
                            control: a.control,
                            name: 'title_ar',
                            render: ({ field: s }) =>
                              e.jsxs(i, {
                                children: [
                                  e.jsx(l, { children: r('form.titleAr', 'Title (Arabic)') }),
                                  e.jsx(t, {
                                    children: e.jsx(m, {
                                      placeholder: 'مدير العمليات',
                                      dir: 'rtl',
                                      ...s,
                                    }),
                                  }),
                                  e.jsx(o, {}),
                                ],
                              }),
                          }),
                        ],
                      }),
                      e.jsx(n, {
                        control: a.control,
                        name: 'importance_level',
                        render: ({ field: s }) =>
                          e.jsxs(i, {
                            children: [
                              e.jsxs(l, {
                                className: 'flex items-center gap-2',
                                children: [
                                  e.jsx(B, { className: 'h-4 w-4' }),
                                  r('form.importanceLevel', 'Importance Level'),
                                ],
                              }),
                              e.jsxs(G, {
                                value: String(s.value),
                                onValueChange: (x) => s.onChange(Number(x)),
                                children: [
                                  e.jsx(t, { children: e.jsx(H, { children: e.jsx(O, {}) }) }),
                                  e.jsx(X, {
                                    children: [1, 2, 3, 4, 5].map((x) =>
                                      e.jsx(
                                        J,
                                        { value: String(x), children: g ? A[x].ar : A[x].en },
                                        x,
                                      ),
                                    ),
                                  }),
                                ],
                              }),
                              e.jsx(N, {
                                children: r(
                                  'form.importanceLevelDescription',
                                  'How important is this contact?',
                                ),
                              }),
                              e.jsx(o, {}),
                            ],
                          }),
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs(d, {
                children: [
                  e.jsx(h, {
                    children: e.jsxs(p, {
                      className: 'flex items-center gap-2 text-lg',
                      children: [
                        e.jsx(w, { className: 'h-5 w-5 text-primary' }),
                        r('create.sections.contactInfo', 'Contact Information'),
                      ],
                    }),
                  }),
                  e.jsxs(j, {
                    className: 'space-y-4',
                    children: [
                      e.jsxs('div', {
                        className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
                        children: [
                          e.jsx(n, {
                            control: a.control,
                            name: 'email',
                            render: ({ field: s }) =>
                              e.jsxs(i, {
                                children: [
                                  e.jsxs(l, {
                                    className: 'flex items-center gap-2',
                                    children: [
                                      e.jsx(w, { className: 'h-4 w-4' }),
                                      r('form.email', 'Email'),
                                    ],
                                  }),
                                  e.jsx(t, {
                                    children: e.jsx(m, {
                                      type: 'email',
                                      placeholder: 'john@example.com',
                                      ...s,
                                    }),
                                  }),
                                  e.jsx(o, {}),
                                ],
                              }),
                          }),
                          e.jsx(n, {
                            control: a.control,
                            name: 'phone',
                            render: ({ field: s }) =>
                              e.jsxs(i, {
                                children: [
                                  e.jsxs(l, {
                                    className: 'flex items-center gap-2',
                                    children: [
                                      e.jsx(z, { className: 'h-4 w-4' }),
                                      r('form.phone', 'Phone'),
                                    ],
                                  }),
                                  e.jsx(t, {
                                    children: e.jsx(m, {
                                      type: 'tel',
                                      placeholder: '+966 50 123 4567',
                                      dir: 'ltr',
                                      ...s,
                                    }),
                                  }),
                                  e.jsx(o, {}),
                                ],
                              }),
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
                        children: [
                          e.jsx(n, {
                            control: a.control,
                            name: 'linkedin_url',
                            render: ({ field: s }) =>
                              e.jsxs(i, {
                                children: [
                                  e.jsxs(l, {
                                    className: 'flex items-center gap-2',
                                    children: [
                                      e.jsx(C, { className: 'h-4 w-4' }),
                                      r('form.linkedin', 'LinkedIn'),
                                    ],
                                  }),
                                  e.jsx(t, {
                                    children: e.jsx(m, {
                                      placeholder: 'https://linkedin.com/in/...',
                                      ...s,
                                    }),
                                  }),
                                  e.jsx(o, {}),
                                ],
                              }),
                          }),
                          e.jsx(n, {
                            control: a.control,
                            name: 'twitter_url',
                            render: ({ field: s }) =>
                              e.jsxs(i, {
                                children: [
                                  e.jsxs(l, {
                                    className: 'flex items-center gap-2',
                                    children: [
                                      e.jsx(C, { className: 'h-4 w-4' }),
                                      r('form.twitter', 'Twitter / X'),
                                    ],
                                  }),
                                  e.jsx(t, {
                                    children: e.jsx(m, {
                                      placeholder: 'https://twitter.com/...',
                                      ...s,
                                    }),
                                  }),
                                  e.jsx(o, {}),
                                ],
                              }),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs(d, {
                children: [
                  e.jsx(h, {
                    children: e.jsxs(p, {
                      className: 'flex items-center gap-2 text-lg',
                      children: [
                        e.jsx(R, { className: 'h-5 w-5 text-primary' }),
                        r('create.sections.professionalDetails', 'Professional Details'),
                      ],
                    }),
                  }),
                  e.jsxs(j, {
                    className: 'space-y-4',
                    children: [
                      e.jsx(n, {
                        control: a.control,
                        name: 'languages',
                        render: ({ field: s }) =>
                          e.jsxs(i, {
                            children: [
                              e.jsxs(l, {
                                className: 'flex items-center gap-2',
                                children: [
                                  e.jsx(V, { className: 'h-4 w-4' }),
                                  r('form.languages', 'Languages'),
                                ],
                              }),
                              e.jsx(t, {
                                children: e.jsx(m, {
                                  placeholder: 'English, Arabic, French',
                                  ...s,
                                }),
                              }),
                              e.jsx(N, {
                                children: r(
                                  'form.languagesDescription',
                                  'Comma-separated list of languages',
                                ),
                              }),
                              e.jsx(o, {}),
                            ],
                          }),
                      }),
                      e.jsx(n, {
                        control: a.control,
                        name: 'expertise_areas',
                        render: ({ field: s }) =>
                          e.jsxs(i, {
                            children: [
                              e.jsx(l, { children: r('form.expertiseAreas', 'Expertise Areas') }),
                              e.jsx(t, {
                                children: e.jsx(m, {
                                  placeholder: 'Statistics, Data Analysis, Policy',
                                  ...s,
                                }),
                              }),
                              e.jsx(N, {
                                children: r(
                                  'form.expertiseAreasDescription',
                                  'Comma-separated list of expertise areas',
                                ),
                              }),
                              e.jsx(o, {}),
                            ],
                          }),
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs(d, {
                children: [
                  e.jsx(h, {
                    children: e.jsx(p, {
                      className: 'text-lg',
                      children: r('create.sections.biography', 'Biography'),
                    }),
                  }),
                  e.jsxs(j, {
                    className: 'space-y-4',
                    children: [
                      e.jsx(n, {
                        control: a.control,
                        name: 'biography_en',
                        render: ({ field: s }) =>
                          e.jsxs(i, {
                            children: [
                              e.jsx(l, { children: r('form.biographyEn', 'Biography (English)') }),
                              e.jsx(t, {
                                children: e.jsx(I, {
                                  placeholder: 'Professional background and achievements...',
                                  className: 'min-h-[100px]',
                                  ...s,
                                }),
                              }),
                              e.jsx(o, {}),
                            ],
                          }),
                      }),
                      e.jsx(n, {
                        control: a.control,
                        name: 'biography_ar',
                        render: ({ field: s }) =>
                          e.jsxs(i, {
                            children: [
                              e.jsx(l, { children: r('form.biographyAr', 'Biography (Arabic)') }),
                              e.jsx(t, {
                                children: e.jsx(I, {
                                  placeholder: 'السيرة المهنية والإنجازات...',
                                  className: 'min-h-[100px]',
                                  dir: 'rtl',
                                  ...s,
                                }),
                              }),
                              e.jsx(o, {}),
                            ],
                          }),
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'flex flex-col-reverse sm:flex-row gap-3 justify-end',
                children: [
                  e.jsx(_, {
                    type: 'button',
                    variant: 'outline',
                    onClick: v,
                    children: r('actions.cancel', 'Cancel'),
                  }),
                  e.jsxs(_, {
                    type: 'submit',
                    disabled: u.isPending,
                    children: [
                      u.isPending
                        ? e.jsx(M, { className: 'h-4 w-4 animate-spin me-2' })
                        : e.jsx(U, { className: 'h-4 w-4 me-2' }),
                      r('actions.create', 'Create Person'),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      }),
    ],
  })
}
const xe = Z
export { xe as component }
//# sourceMappingURL=create-TXEQjmZM.js.map
