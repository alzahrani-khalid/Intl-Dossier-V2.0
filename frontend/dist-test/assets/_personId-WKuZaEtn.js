import { u as W, r as E, j as e } from './react-vendor-Buoak6m3.js'
import { m as ee, i as se } from './tanstack-vendor-BZC-rs5U.js'
import {
  B as o,
  Z as ae,
  _ as te,
  $ as v,
  aa as _,
  j as i,
  k as m,
  o as x,
  l,
  m as d,
} from './index-qYY0KoZ1.js'
import { A as y, b, a as w } from './avatar-lQOCSoMx.js'
import {
  A as re,
  h as ne,
  a as ie,
  b as le,
  c as ce,
  d as oe,
  e as de,
  f as me,
  g as xe,
} from './alert-dialog-DaWYDPc1.js'
import { b as he, c as pe, I as D, A as I, R as S } from './person.types-Ck48Y8hE.js'
import {
  aS as B,
  c6 as je,
  aX as R,
  c0 as ge,
  b6 as ue,
  dx as Ne,
  bz as fe,
  dj as ve,
  aK as _e,
  bV as ye,
  bC as A,
  aJ as g,
  aI as $,
  aO as F,
  aN as O,
  by as H,
  bx as U,
  b9 as C,
  aR as be,
} from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function we() {
  const { personId: u } = ee({ from: '/_protected/persons/$personId' }),
    { t: a, i18n: V } = W('persons'),
    n = V.language === 'ar',
    p = se(),
    [M, Y] = E.useState('overview'),
    [j, q] = E.useState({ roles: !0, affiliations: !0, relationships: !0 }),
    { data: t, isLoading: G, isError: J, error: K } = he(u),
    k = pe(),
    z = (s) => {
      q((c) => ({ ...c, [s]: !c[s] }))
    },
    T = () => {
      p({ to: '/persons' })
    },
    X = () => {
      p({ to: '/persons/$personId/edit', params: { personId: u } })
    },
    Z = async () => {
      ;(await k.mutateAsync(u), p({ to: '/persons' }))
    },
    N = (s) =>
      s
        .split(' ')
        .map((c) => c[0])
        .join('')
        .substring(0, 2)
        .toUpperCase(),
    Q = (s) => {
      switch (s) {
        case 5:
          return 'bg-red-500/10 text-red-600 border-red-200'
        case 4:
          return 'bg-orange-500/10 text-orange-600 border-orange-200'
        case 3:
          return 'bg-yellow-500/10 text-yellow-600 border-yellow-200'
        case 2:
          return 'bg-blue-500/10 text-blue-600 border-blue-200'
        default:
          return 'bg-gray-500/10 text-gray-600 border-gray-200'
      }
    },
    f = (s) =>
      s
        ? new Date(s).toLocaleDateString(n ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short' })
        : null
  if (G)
    return e.jsx('div', {
      className: 'flex min-h-96 items-center justify-center',
      children: e.jsx(B, { className: 'size-8 animate-spin text-primary' }),
    })
  if (J || !t)
    return e.jsxs('div', {
      className: 'flex min-h-96 flex-col items-center justify-center gap-4',
      children: [
        e.jsx(je, { className: 'size-12 text-destructive' }),
        e.jsxs('div', {
          className: 'text-center',
          children: [
            e.jsx('h2', {
              className: 'text-xl font-semibold text-foreground',
              children: a('error.notFound', 'Person not found'),
            }),
            e.jsx('p', {
              className: 'text-sm text-muted-foreground',
              children:
                K?.message ||
                a('error.notFoundDescription', 'The person you are looking for does not exist'),
            }),
          ],
        }),
        e.jsxs(o, {
          onClick: T,
          children: [
            e.jsx(R, { className: 'h-4 w-4 me-2' }),
            a('actions.backToList', 'Back to List'),
          ],
        }),
      ],
    })
  const r = t.person,
    h = n ? r.name_ar : r.name_en,
    L = n ? r.title_ar : r.title_en,
    P = n ? r.biography_ar : r.biography_en
  return e.jsxs('div', {
    className: 'min-h-screen bg-background',
    dir: n ? 'rtl' : 'ltr',
    children: [
      e.jsx('header', {
        className: 'border-b bg-background sticky top-0 z-10',
        children: e.jsx('div', {
          className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-4',
          children: e.jsxs('div', {
            className: 'flex items-center justify-between gap-4',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-4',
                children: [
                  e.jsx(o, {
                    variant: 'ghost',
                    size: 'icon',
                    onClick: T,
                    className: 'h-10 w-10',
                    children: e.jsx(R, { className: `h-5 w-5 ${n ? 'rotate-180' : ''}` }),
                  }),
                  e.jsxs('div', {
                    className: 'flex items-center gap-3',
                    children: [
                      e.jsxs(y, {
                        className: 'h-12 w-12',
                        children: [
                          e.jsx(b, { src: r.photo_url || '', alt: h }),
                          e.jsx(w, {
                            className: 'bg-primary/10 text-primary font-medium',
                            children: N(h),
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        children: [
                          e.jsx('h1', { className: 'text-xl sm:text-2xl font-bold', children: h }),
                          L &&
                            e.jsx('p', { className: 'text-sm text-muted-foreground', children: L }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'flex gap-2',
                children: [
                  e.jsxs(o, {
                    variant: 'outline',
                    size: 'sm',
                    onClick: X,
                    children: [
                      e.jsx(ge, { className: 'h-4 w-4 sm:me-2' }),
                      e.jsx('span', {
                        className: 'hidden sm:inline',
                        children: a('actions.edit', 'Edit'),
                      }),
                    ],
                  }),
                  e.jsxs(re, {
                    children: [
                      e.jsx(ne, {
                        asChild: !0,
                        children: e.jsx(o, {
                          variant: 'outline',
                          size: 'sm',
                          className: 'text-destructive hover:text-destructive',
                          children: e.jsx(ue, { className: 'h-4 w-4' }),
                        }),
                      }),
                      e.jsxs(ie, {
                        children: [
                          e.jsxs(le, {
                            children: [
                              e.jsx(ce, { children: a('archive.title', 'Archive Person?') }),
                              e.jsx(oe, {
                                children: a(
                                  'archive.description',
                                  'This will archive the person and hide them from the list. This action can be undone.',
                                ),
                              }),
                            ],
                          }),
                          e.jsxs(de, {
                            children: [
                              e.jsx(me, { children: a('actions.cancel', 'Cancel') }),
                              e.jsxs(xe, {
                                onClick: Z,
                                className:
                                  'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                                children: [
                                  k.isPending &&
                                    e.jsx(B, { className: 'h-4 w-4 animate-spin me-2' }),
                                  a('actions.archive', 'Archive'),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      }),
      e.jsx('main', {
        className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6',
        children: e.jsxs(ae, {
          value: M,
          onValueChange: Y,
          className: 'space-y-6',
          children: [
            e.jsxs(te, {
              className: 'w-full sm:w-auto',
              children: [
                e.jsx(v, {
                  value: 'overview',
                  className: 'flex-1 sm:flex-none',
                  children: a('tabs.overview', 'Overview'),
                }),
                e.jsx(v, {
                  value: 'career',
                  className: 'flex-1 sm:flex-none',
                  children: a('tabs.career', 'Career'),
                }),
                e.jsx(v, {
                  value: 'network',
                  className: 'flex-1 sm:flex-none',
                  children: a('tabs.network', 'Network'),
                }),
              ],
            }),
            e.jsx(_, {
              value: 'overview',
              className: 'space-y-6',
              children: e.jsxs('div', {
                className: 'grid grid-cols-1 lg:grid-cols-3 gap-6',
                children: [
                  e.jsxs(i, {
                    className: 'lg:col-span-1',
                    children: [
                      e.jsx(m, {
                        children: e.jsx(x, {
                          className: 'text-lg',
                          children: a('sections.profile', 'Profile'),
                        }),
                      }),
                      e.jsxs(l, {
                        className: 'space-y-4',
                        children: [
                          e.jsx('div', {
                            className: 'flex justify-center',
                            children: e.jsxs(y, {
                              className: 'h-24 w-24 sm:h-32 sm:w-32',
                              children: [
                                e.jsx(b, { src: r.photo_url || '', alt: h }),
                                e.jsx(w, {
                                  className: 'bg-primary/10 text-primary text-2xl font-medium',
                                  children: N(h),
                                }),
                              ],
                            }),
                          }),
                          e.jsx('div', {
                            className: 'flex justify-center',
                            children: e.jsxs(d, {
                              variant: 'outline',
                              className: Q(r.importance_level),
                              children: [
                                e.jsx(Ne, { className: 'h-3 w-3 me-1' }),
                                n ? D[r.importance_level]?.ar : D[r.importance_level]?.en,
                              ],
                            }),
                          }),
                          e.jsxs('div', {
                            className: 'space-y-2 pt-4 border-t',
                            children: [
                              r.email &&
                                e.jsxs('a', {
                                  href: `mailto:${r.email}`,
                                  className: 'flex items-center gap-2 text-sm hover:text-primary',
                                  children: [
                                    e.jsx(fe, { className: 'h-4 w-4 text-muted-foreground' }),
                                    e.jsx('span', { className: 'truncate', children: r.email }),
                                  ],
                                }),
                              r.phone &&
                                e.jsxs('a', {
                                  href: `tel:${r.phone}`,
                                  className: 'flex items-center gap-2 text-sm hover:text-primary',
                                  children: [
                                    e.jsx(ve, { className: 'h-4 w-4 text-muted-foreground' }),
                                    e.jsx('span', { dir: 'ltr', children: r.phone }),
                                  ],
                                }),
                              r.linkedin_url &&
                                e.jsxs('a', {
                                  href: r.linkedin_url,
                                  target: '_blank',
                                  rel: 'noopener noreferrer',
                                  className: 'flex items-center gap-2 text-sm hover:text-primary',
                                  children: [
                                    e.jsx(_e, { className: 'h-4 w-4 text-muted-foreground' }),
                                    e.jsx('span', { children: 'LinkedIn' }),
                                    e.jsx(ye, { className: 'h-3 w-3' }),
                                  ],
                                }),
                            ],
                          }),
                          r.languages &&
                            r.languages.length > 0 &&
                            e.jsxs('div', {
                              className: 'pt-4 border-t',
                              children: [
                                e.jsx('h4', {
                                  className: 'text-sm font-medium mb-2',
                                  children: a('profile.languages', 'Languages'),
                                }),
                                e.jsx('div', {
                                  className: 'flex flex-wrap gap-1',
                                  children: r.languages.map((s, c) =>
                                    e.jsx(
                                      d,
                                      { variant: 'secondary', className: 'text-xs', children: s },
                                      c,
                                    ),
                                  ),
                                }),
                              ],
                            }),
                          r.expertise_areas &&
                            r.expertise_areas.length > 0 &&
                            e.jsxs('div', {
                              className: 'pt-4 border-t',
                              children: [
                                e.jsx('h4', {
                                  className: 'text-sm font-medium mb-2',
                                  children: a('profile.expertise', 'Expertise'),
                                }),
                                e.jsx('div', {
                                  className: 'flex flex-wrap gap-1',
                                  children: r.expertise_areas.map((s, c) =>
                                    e.jsx(
                                      d,
                                      { variant: 'outline', className: 'text-xs', children: s },
                                      c,
                                    ),
                                  ),
                                }),
                              ],
                            }),
                        ],
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'lg:col-span-2 space-y-6',
                    children: [
                      t.current_role &&
                        e.jsxs(i, {
                          children: [
                            e.jsx(m, {
                              children: e.jsxs(x, {
                                className: 'flex items-center gap-2 text-lg',
                                children: [
                                  e.jsx(A, { className: 'h-5 w-5 text-primary' }),
                                  a('sections.currentRole', 'Current Position'),
                                ],
                              }),
                            }),
                            e.jsx(l, {
                              children: e.jsxs('div', {
                                className: 'flex items-start gap-4',
                                children: [
                                  e.jsx('div', {
                                    className:
                                      'h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0',
                                    children: e.jsx(g, { className: 'h-6 w-6 text-primary' }),
                                  }),
                                  e.jsxs('div', {
                                    children: [
                                      e.jsx('h3', {
                                        className: 'font-semibold',
                                        children:
                                          (n && t.current_role.role_title_ar) ||
                                          t.current_role.role_title_en,
                                      }),
                                      e.jsx('p', {
                                        className: 'text-sm text-muted-foreground',
                                        children:
                                          (n && t.current_role.organization_name_ar) ||
                                          t.current_role.organization_name_en,
                                      }),
                                      t.current_role.start_date &&
                                        e.jsx('p', {
                                          className: 'text-xs text-muted-foreground mt-1',
                                          children: a('role.since', 'Since {{date}}', {
                                            date: f(t.current_role.start_date),
                                          }),
                                        }),
                                    ],
                                  }),
                                ],
                              }),
                            }),
                          ],
                        }),
                      P &&
                        e.jsxs(i, {
                          children: [
                            e.jsx(m, {
                              children: e.jsx(x, {
                                className: 'text-lg',
                                children: a('sections.biography', 'Biography'),
                              }),
                            }),
                            e.jsx(l, {
                              children: e.jsx('p', {
                                className: 'text-sm text-muted-foreground whitespace-pre-wrap',
                                children: P,
                              }),
                            }),
                          ],
                        }),
                      e.jsxs('div', {
                        className: 'grid grid-cols-3 gap-4',
                        children: [
                          e.jsx(i, {
                            children: e.jsxs(l, {
                              className: 'pt-6 text-center',
                              children: [
                                e.jsx(A, { className: 'h-6 w-6 text-primary mx-auto mb-2' }),
                                e.jsx('p', {
                                  className: 'text-2xl font-bold',
                                  children: t.roles?.length || 0,
                                }),
                                e.jsx('p', {
                                  className: 'text-xs text-muted-foreground',
                                  children: a('stats.roles', 'Roles'),
                                }),
                              ],
                            }),
                          }),
                          e.jsx(i, {
                            children: e.jsxs(l, {
                              className: 'pt-6 text-center',
                              children: [
                                e.jsx(g, { className: 'h-6 w-6 text-primary mx-auto mb-2' }),
                                e.jsx('p', {
                                  className: 'text-2xl font-bold',
                                  children: t.affiliations?.length || 0,
                                }),
                                e.jsx('p', {
                                  className: 'text-xs text-muted-foreground',
                                  children: a('stats.affiliations', 'Affiliations'),
                                }),
                              ],
                            }),
                          }),
                          e.jsx(i, {
                            children: e.jsxs(l, {
                              className: 'pt-6 text-center',
                              children: [
                                e.jsx($, { className: 'h-6 w-6 text-primary mx-auto mb-2' }),
                                e.jsx('p', {
                                  className: 'text-2xl font-bold',
                                  children: t.relationships?.length || 0,
                                }),
                                e.jsx('p', {
                                  className: 'text-xs text-muted-foreground',
                                  children: a('stats.connections', 'Connections'),
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
            }),
            e.jsxs(_, {
              value: 'career',
              className: 'space-y-6',
              children: [
                e.jsxs(i, {
                  children: [
                    e.jsx(m, {
                      className: 'cursor-pointer',
                      onClick: () => z('roles'),
                      children: e.jsxs('div', {
                        className: 'flex items-center justify-between',
                        children: [
                          e.jsxs(x, {
                            className: 'flex items-center gap-2 text-lg',
                            children: [
                              e.jsx(A, { className: 'h-5 w-5 text-primary' }),
                              a('sections.careerHistory', 'Career History'),
                              e.jsx(d, {
                                variant: 'secondary',
                                className: 'ms-2',
                                children: t.roles?.length || 0,
                              }),
                            ],
                          }),
                          e.jsx(o, {
                            variant: 'ghost',
                            size: 'icon',
                            children: j.roles
                              ? e.jsx(F, { className: 'h-4 w-4' })
                              : e.jsx(O, { className: 'h-4 w-4' }),
                          }),
                        ],
                      }),
                    }),
                    e.jsx(H, {
                      children:
                        j.roles &&
                        e.jsx(U.div, {
                          initial: { height: 0, opacity: 0 },
                          animate: { height: 'auto', opacity: 1 },
                          exit: { height: 0, opacity: 0 },
                          transition: { duration: 0.2 },
                          children: e.jsxs(l, {
                            className: 'pt-0',
                            children: [
                              t.roles && t.roles.length > 0
                                ? e.jsx('div', {
                                    className: 'space-y-4',
                                    children: t.roles.map((s, c) =>
                                      e.jsxs(
                                        'div',
                                        {
                                          className: `flex gap-4 ${c < t.roles.length - 1 ? 'pb-4 border-b' : ''}`,
                                          children: [
                                            e.jsx('div', {
                                              className:
                                                'h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0',
                                              children: e.jsx(g, {
                                                className: 'h-5 w-5 text-primary',
                                              }),
                                            }),
                                            e.jsxs('div', {
                                              className: 'flex-1',
                                              children: [
                                                e.jsxs('div', {
                                                  className: 'flex items-start justify-between',
                                                  children: [
                                                    e.jsxs('div', {
                                                      children: [
                                                        e.jsx('h4', {
                                                          className: 'font-medium',
                                                          children:
                                                            (n && s.role_title_ar) ||
                                                            s.role_title_en,
                                                        }),
                                                        e.jsx('p', {
                                                          className:
                                                            'text-sm text-muted-foreground',
                                                          children:
                                                            (n && s.organization_name_ar) ||
                                                            s.organization_name_en,
                                                        }),
                                                      ],
                                                    }),
                                                    s.is_current &&
                                                      e.jsx(d, {
                                                        variant: 'default',
                                                        children: a('role.current', 'Current'),
                                                      }),
                                                  ],
                                                }),
                                                e.jsxs('p', {
                                                  className: 'text-xs text-muted-foreground mt-1',
                                                  children: [
                                                    f(s.start_date),
                                                    ' - ',
                                                    s.end_date
                                                      ? f(s.end_date)
                                                      : a('role.present', 'Present'),
                                                  ],
                                                }),
                                              ],
                                            }),
                                          ],
                                        },
                                        s.id,
                                      ),
                                    ),
                                  })
                                : e.jsx('p', {
                                    className: 'text-sm text-muted-foreground text-center py-8',
                                    children: a('empty.roles', 'No career history recorded'),
                                  }),
                              e.jsxs(o, {
                                variant: 'outline',
                                size: 'sm',
                                className: 'mt-4 w-full',
                                children: [
                                  e.jsx(C, { className: 'h-4 w-4 me-2' }),
                                  a('actions.addRole', 'Add Role'),
                                ],
                              }),
                            ],
                          }),
                        }),
                    }),
                  ],
                }),
                e.jsxs(i, {
                  children: [
                    e.jsx(m, {
                      className: 'cursor-pointer',
                      onClick: () => z('affiliations'),
                      children: e.jsxs('div', {
                        className: 'flex items-center justify-between',
                        children: [
                          e.jsxs(x, {
                            className: 'flex items-center gap-2 text-lg',
                            children: [
                              e.jsx(g, { className: 'h-5 w-5 text-primary' }),
                              a('sections.affiliations', 'Organization Affiliations'),
                              e.jsx(d, {
                                variant: 'secondary',
                                className: 'ms-2',
                                children: t.affiliations?.length || 0,
                              }),
                            ],
                          }),
                          e.jsx(o, {
                            variant: 'ghost',
                            size: 'icon',
                            children: j.affiliations
                              ? e.jsx(F, { className: 'h-4 w-4' })
                              : e.jsx(O, { className: 'h-4 w-4' }),
                          }),
                        ],
                      }),
                    }),
                    e.jsx(H, {
                      children:
                        j.affiliations &&
                        e.jsx(U.div, {
                          initial: { height: 0, opacity: 0 },
                          animate: { height: 'auto', opacity: 1 },
                          exit: { height: 0, opacity: 0 },
                          transition: { duration: 0.2 },
                          children: e.jsxs(l, {
                            className: 'pt-0',
                            children: [
                              t.affiliations && t.affiliations.length > 0
                                ? e.jsx('div', {
                                    className: 'space-y-3',
                                    children: t.affiliations.map((s) =>
                                      e.jsxs(
                                        'div',
                                        {
                                          className:
                                            'flex items-center justify-between p-3 rounded-lg bg-muted/50',
                                          children: [
                                            e.jsxs('div', {
                                              children: [
                                                e.jsx('p', {
                                                  className: 'font-medium text-sm',
                                                  children:
                                                    (n && s.organization_name_ar) ||
                                                    s.organization_name_en,
                                                }),
                                                e.jsx('p', {
                                                  className: 'text-xs text-muted-foreground',
                                                  children: n
                                                    ? I[s.affiliation_type]?.ar
                                                    : I[s.affiliation_type]?.en,
                                                }),
                                              ],
                                            }),
                                            s.is_active &&
                                              e.jsx(d, {
                                                variant: 'secondary',
                                                children: a('affiliation.active', 'Active'),
                                              }),
                                          ],
                                        },
                                        s.id,
                                      ),
                                    ),
                                  })
                                : e.jsx('p', {
                                    className: 'text-sm text-muted-foreground text-center py-8',
                                    children: a('empty.affiliations', 'No affiliations recorded'),
                                  }),
                              e.jsxs(o, {
                                variant: 'outline',
                                size: 'sm',
                                className: 'mt-4 w-full',
                                children: [
                                  e.jsx(C, { className: 'h-4 w-4 me-2' }),
                                  a('actions.addAffiliation', 'Add Affiliation'),
                                ],
                              }),
                            ],
                          }),
                        }),
                    }),
                  ],
                }),
              ],
            }),
            e.jsxs(_, {
              value: 'network',
              className: 'space-y-6',
              children: [
                e.jsxs(i, {
                  children: [
                    e.jsx(m, {
                      children: e.jsxs(x, {
                        className: 'flex items-center gap-2 text-lg',
                        children: [
                          e.jsx($, { className: 'h-5 w-5 text-primary' }),
                          a('sections.relationships', 'Professional Network'),
                          e.jsx(d, {
                            variant: 'secondary',
                            className: 'ms-2',
                            children: t.relationships?.length || 0,
                          }),
                        ],
                      }),
                    }),
                    e.jsxs(l, {
                      children: [
                        t.relationships && t.relationships.length > 0
                          ? e.jsx('div', {
                              className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
                              children: t.relationships.map((s) =>
                                e.jsx(
                                  i,
                                  {
                                    className: 'cursor-pointer hover:shadow-md transition-shadow',
                                    onClick: () =>
                                      p({
                                        to: '/persons/$personId',
                                        params: { personId: s.related_person.id },
                                      }),
                                    children: e.jsx(l, {
                                      className: 'p-4',
                                      children: e.jsxs('div', {
                                        className: 'flex items-center gap-3',
                                        children: [
                                          e.jsxs(y, {
                                            className: 'h-10 w-10',
                                            children: [
                                              e.jsx(b, { src: s.related_person.photo_url || '' }),
                                              e.jsx(w, {
                                                className: 'bg-primary/10 text-primary text-sm',
                                                children: N(
                                                  n
                                                    ? s.related_person.name_ar
                                                    : s.related_person.name_en,
                                                ),
                                              }),
                                            ],
                                          }),
                                          e.jsxs('div', {
                                            className: 'flex-1 min-w-0',
                                            children: [
                                              e.jsx('p', {
                                                className: 'font-medium text-sm truncate',
                                                children: n
                                                  ? s.related_person.name_ar
                                                  : s.related_person.name_en,
                                              }),
                                              e.jsx('p', {
                                                className: 'text-xs text-muted-foreground',
                                                children: n
                                                  ? S[s.relationship.relationship_type]?.ar
                                                  : S[s.relationship.relationship_type]?.en,
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                    }),
                                  },
                                  s.relationship.id,
                                ),
                              ),
                            })
                          : e.jsx('p', {
                              className: 'text-sm text-muted-foreground text-center py-8',
                              children: a('empty.relationships', 'No connections recorded'),
                            }),
                        e.jsxs(o, {
                          variant: 'outline',
                          size: 'sm',
                          className: 'mt-4 w-full',
                          children: [
                            e.jsx(C, { className: 'h-4 w-4 me-2' }),
                            a('actions.addConnection', 'Add Connection'),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                t.recent_engagements &&
                  t.recent_engagements.length > 0 &&
                  e.jsxs(i, {
                    children: [
                      e.jsx(m, {
                        children: e.jsxs(x, {
                          className: 'flex items-center gap-2 text-lg',
                          children: [
                            e.jsx(be, { className: 'h-5 w-5 text-primary' }),
                            a('sections.engagements', 'Recent Engagements'),
                          ],
                        }),
                      }),
                      e.jsx(l, {
                        children: e.jsx('div', {
                          className: 'space-y-3',
                          children: t.recent_engagements.map((s) =>
                            e.jsxs(
                              'div',
                              {
                                className:
                                  'flex items-center justify-between p-3 rounded-lg bg-muted/50',
                                children: [
                                  e.jsxs('div', {
                                    children: [
                                      e.jsx('p', {
                                        className: 'font-medium text-sm',
                                        children: n ? s.engagement.name_ar : s.engagement.name_en,
                                      }),
                                      e.jsxs('p', {
                                        className: 'text-xs text-muted-foreground',
                                        children: [
                                          s.engagement.engagement_type,
                                          ' - ',
                                          s.link.role,
                                        ],
                                      }),
                                    ],
                                  }),
                                  s.link.attended &&
                                    e.jsx(d, {
                                      variant: 'secondary',
                                      children: a('engagement.attended', 'Attended'),
                                    }),
                                ],
                              },
                              s.link.id,
                            ),
                          ),
                        }),
                      }),
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
const $e = we
export { $e as component }
//# sourceMappingURL=_personId-WKuZaEtn.js.map
