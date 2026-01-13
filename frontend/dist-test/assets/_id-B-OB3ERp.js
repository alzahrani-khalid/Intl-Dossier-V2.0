import { u, j as e, r as z } from './react-vendor-Buoak6m3.js'
import { f as A } from './useDossier-CiPcwRKl.js'
import { D as S } from './DossierDetailLayout-BuE-52qO.js'
import { u as U, C as y } from './CollapsibleSection-Bj_Tk5Ee.js'
import {
  ec as B,
  aJ as F,
  aR as O,
  aK as G,
  aI as R,
  ca as H,
  d$ as w,
  dH as K,
  dI as V,
  dJ as q,
  dL as J,
  dN as W,
  cd as Z,
  aH as P,
  aS as Q,
  bw as X,
} from './vendor-misc-BiJvMP0A.js'
import { a as Y, L as _ } from './tanstack-vendor-BZC-rs5U.js'
import { s as ee } from './supabase-client-CBUJ6sHP.js'
import { m as se, b8 as te, B as T } from './index-qYY0KoZ1.js'
import { U as ie, V as re } from './visualization-vendor-f5uYUx4I.js'
import { O as ae } from './OrganizationTimeline-Bvhhh3g1.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './useUnifiedTimeline-2-SmgReu.js'
import './avatar-lQOCSoMx.js'
import './use-outside-click-DyRG7K6b.js'
function ne({ dossier: i }) {
  const { t, i18n: l } = u('dossier'),
    n = l.language === 'ar',
    { extension: s } = i,
    a = (d) => {
      if (!d) return t('common.notAvailable')
      const x = new Date(d)
      return new Intl.DateTimeFormat(l.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(x)
    },
    m = (d) =>
      ({
        government: { en: 'Government', ar: 'حكومية' },
        ngo: { en: 'NGO', ar: 'منظمة غير حكومية' },
        international: { en: 'International', ar: 'دولية' },
        private: { en: 'Private Sector', ar: 'قطاع خاص' },
      })[d]?.[n ? 'ar' : 'en'] || d
  function c({ icon: d, label: x, value: p, link: N }) {
    const v = p || t('common.notAvailable')
    return e.jsxs('div', {
      className:
        'flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors',
      children: [
        e.jsx(d, { className: 'h-5 w-5 text-muted-foreground shrink-0 mt-0.5' }),
        e.jsxs('div', {
          className: 'flex-1 min-w-0',
          children: [
            e.jsx('dt', {
              className: 'text-xs sm:text-sm font-medium text-muted-foreground mb-1',
              children: x,
            }),
            e.jsx('dd', {
              className: 'text-sm sm:text-base font-medium break-words',
              children:
                N && p
                  ? e.jsx('a', {
                      href: N,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                      className: 'text-primary hover:underline',
                      children: v,
                    })
                  : v,
            }),
          ],
        }),
      ],
    })
  }
  return e.jsxs('div', {
    className: 'space-y-4',
    dir: n ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4',
        children: [
          e.jsx(c, { icon: B, label: 'Organization Code', value: s.org_code }),
          e.jsx(c, { icon: F, label: 'Organization Type', value: m(s.org_type) }),
        ],
      }),
      e.jsxs('div', {
        className: 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4',
        children: [
          e.jsx(c, { icon: O, label: 'Established Date', value: a(s.established_date) }),
          e.jsx(c, { icon: G, label: 'Website', value: s.website_url, link: s.website_url }),
        ],
      }),
      e.jsxs('div', {
        className: 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4',
        children: [
          e.jsx(c, { icon: R, label: 'Headcount', value: s.head_count }),
          s.parent_org_id &&
            e.jsx(c, { icon: H, label: 'Parent Organization', value: s.parent_org_id }),
        ],
      }),
    ],
  })
}
const M = z.memo(({ data: i }) =>
  e.jsx('div', {
    className:
      'bg-card border-2 border-primary rounded-lg px-3 py-2 sm:px-4 sm:py-3 shadow-md min-w-[120px] sm:min-w-[160px] hover:shadow-lg transition-shadow',
    children: e.jsxs('div', {
      className: 'flex flex-col items-center gap-1',
      children: [
        e.jsx(se, { variant: 'outline', className: 'text-xs', children: i.orgCode }),
        e.jsx('div', {
          className: 'text-sm sm:text-base font-semibold text-foreground text-center',
          children: i.label,
        }),
        e.jsx('div', { className: 'text-xs text-muted-foreground', children: i.orgType }),
        i.headCount !== void 0 &&
          e.jsxs('div', {
            className: 'text-xs text-muted-foreground',
            children: [i.headCount, ' employees'],
          }),
      ],
    }),
  }),
)
M.displayName = 'OrganizationNode'
const oe = { organization: M }
function le({ dossier: i }) {
  const { t, i18n: l } = u('dossier'),
    n = l.language === 'ar',
    { extension: s } = i,
    { data: a, isLoading: m } = Y({
      queryKey: ['org-hierarchy', i.id],
      queryFn: async () => {
        const { data: h, error: f } = await ee
          .from('dossiers')
          .select('id, name_en, name_ar, extension')
          .eq('type', 'organization')
        if (f) throw f
        return h
      },
    }),
    { nodes: c, edges: d } = z.useMemo(() => {
      if (!a || a.length === 0) return { nodes: [], edges: [] }
      const h = new Map()
      a.forEach((r) => h.set(r.id, r))
      const f = a.filter((r) => !r.extension.parent_org_id),
        b = (r) => {
          const o = h.get(r)
          if (!o) return null
          const C = a
            .filter((j) => j.extension.parent_org_id === r)
            .map((j) => b(j.id))
            .filter((j) => j !== null)
          return {
            id: o.id,
            name: n ? o.name_ar : o.name_en,
            orgCode: o.extension.org_code || o.id.slice(0, 8),
            orgType: o.extension.org_type || 'organization',
            headCount: o.extension.head_count,
            children: C,
          }
        }
      let g = null
      if (s.parent_org_id) {
        i.id
        let r = s.parent_org_id
        for (; r; ) {
          const o = h.get(r)
          if (!o || !o.extension.parent_org_id) {
            g = b(r)
            break
          }
          r = o.extension.parent_org_id
        }
      } else g = b(i.id)
      if ((!g && f.length > 0 && (g = b(f[0].id)), !g)) return { nodes: [], edges: [] }
      const I = ie(g),
        k = re()
          .size([800, 600])
          .separation((r, o) => (r.parent === o.parent ? 1 : 2))(I),
        E = []
      k.descendants().forEach((r) => {
        const o = n ? 800 - r.y : r.y,
          C = r.x
        E.push({
          id: r.data.id,
          type: 'organization',
          position: { x: o, y: C },
          data: {
            label: r.data.name,
            orgCode: r.data.orgCode,
            orgType: r.data.orgType,
            headCount: r.data.headCount,
          },
          sourcePosition: n ? w.Left : w.Right,
          targetPosition: n ? w.Right : w.Left,
        })
      })
      const L = []
      return (
        k.links().forEach((r) => {
          L.push({
            id: `${r.source.data.id}-${r.target.data.id}`,
            source: r.source.data.id,
            target: r.target.data.id,
            type: 'step',
            animated: !1,
            style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
          })
        }),
        { nodes: E, edges: L }
      )
    }, [a, i.id, s.parent_org_id, n]),
    [x, p, N] = K(c),
    [v, D, $] = V(d)
  return (
    z.useMemo(() => {
      ;(p(c), D(d))
    }, [c, d, p, D]),
    m
      ? e.jsx('div', {
          className: 'flex items-center justify-center py-12 sm:py-16',
          dir: n ? 'rtl' : 'ltr',
          children: e.jsxs('div', {
            className: 'text-center',
            children: [
              e.jsx('div', {
                className:
                  'h-12 w-12 sm:h-16 sm:w-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4',
              }),
              e.jsx('p', {
                className: 'text-sm sm:text-base text-muted-foreground',
                children: t('common.loading'),
              }),
            ],
          }),
        })
      : !a || a.length === 0
        ? e.jsxs('div', {
            className: 'flex flex-col items-center justify-center py-8 sm:py-12 text-center',
            dir: n ? 'rtl' : 'ltr',
            children: [
              e.jsx('div', {
                className: 'rounded-full bg-muted p-4 sm:p-6 mb-4',
                children: e.jsx(H, { className: 'h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground' }),
              }),
              e.jsx('h3', {
                className: 'text-sm sm:text-base font-medium text-muted-foreground mb-2',
                children: 'No Organizational Hierarchy',
              }),
              e.jsx('p', {
                className: 'text-xs sm:text-sm text-muted-foreground max-w-md',
                children: 'This organization does not have a parent organization defined.',
              }),
            ],
          })
        : e.jsx('div', {
            className:
              'w-full h-[500px] sm:h-[600px] lg:h-[700px] border rounded-lg overflow-hidden',
            dir: n ? 'rtl' : 'ltr',
            children: e.jsxs(q, {
              nodes: x,
              edges: v,
              onNodesChange: N,
              onEdgesChange: $,
              nodeTypes: oe,
              fitView: !0,
              attributionPosition: n ? 'top-left' : 'top-right',
              minZoom: 0.1,
              maxZoom: 1.5,
              defaultEdgeOptions: { type: 'step', animated: !1 },
              onlyRenderVisibleElements: !0,
              children: [
                e.jsx(J, { color: 'hsl(var(--muted-foreground))', gap: 16 }),
                e.jsx(W, { position: n ? 'top-left' : 'top-right' }),
              ],
            }),
          })
  )
}
function de({ dossier: i }) {
  const { t, i18n: l } = u('dossier'),
    n = l.language === 'ar',
    s = []
  return s.length === 0
    ? e.jsxs('div', {
        className: 'flex flex-col items-center justify-center py-8 sm:py-12 text-center',
        dir: n ? 'rtl' : 'ltr',
        children: [
          e.jsx('div', {
            className: 'rounded-full bg-muted p-4 sm:p-6 mb-4',
            children: e.jsx(R, { className: 'h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground' }),
          }),
          e.jsx('h3', {
            className: 'text-sm sm:text-base font-medium text-muted-foreground mb-2',
            children: 'No Key Contacts',
          }),
          e.jsx('p', {
            className: 'text-xs sm:text-sm text-muted-foreground max-w-md',
            children:
              'Person dossier relationships will populate this section. Integration pending.',
          }),
        ],
      })
    : e.jsx('div', {
        className: 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4',
        dir: n ? 'rtl' : 'ltr',
        children: s.map((a) =>
          e.jsx(
            'div',
            {
              className: 'p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors',
              children: e.jsxs('div', {
                className: 'flex items-start gap-3',
                children: [
                  e.jsx(Z, { className: 'h-10 w-10 text-muted-foreground shrink-0' }),
                  e.jsxs('div', {
                    className: 'flex-1 min-w-0',
                    children: [
                      e.jsx('h4', { className: 'text-sm font-medium truncate', children: a.name }),
                      e.jsx('p', {
                        className: 'text-xs text-muted-foreground truncate',
                        children: a.title,
                      }),
                    ],
                  }),
                ],
              }),
            },
            a.id,
          ),
        ),
      })
}
function ce({ dossier: i }) {
  const { t, i18n: l } = u('dossier'),
    n = l.language === 'ar',
    s = []
  return s.length === 0
    ? e.jsxs('div', {
        className: 'flex flex-col items-center justify-center py-8 sm:py-12 text-center',
        dir: n ? 'rtl' : 'ltr',
        children: [
          e.jsx('div', {
            className: 'rounded-full bg-muted p-4 sm:p-6 mb-4',
            children: e.jsx(P, { className: 'h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground' }),
          }),
          e.jsx('h3', {
            className: 'text-sm sm:text-base font-medium text-muted-foreground mb-2',
            children: 'No Active MoUs',
          }),
          e.jsx('p', {
            className: 'text-xs sm:text-sm text-muted-foreground max-w-md',
            children: 'MoUs table integration pending. Active memorandums will appear here.',
          }),
        ],
      })
    : e.jsx('div', {
        className: 'space-y-3',
        dir: n ? 'rtl' : 'ltr',
        children: s.map((a) =>
          e.jsx(
            'div',
            {
              className: 'p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors',
              children: e.jsxs('div', {
                className: 'flex items-start gap-3',
                children: [
                  e.jsx(P, { className: 'h-5 w-5 text-muted-foreground shrink-0 mt-0.5' }),
                  e.jsxs('div', {
                    className: 'flex-1 min-w-0',
                    children: [
                      e.jsx('h4', {
                        className: 'text-sm font-medium mb-1 truncate',
                        children: a.title,
                      }),
                      e.jsxs('div', {
                        className: 'flex items-center gap-2 text-xs text-muted-foreground',
                        children: [
                          e.jsx(O, { className: 'h-3 w-3' }),
                          e.jsxs('span', { children: ['Expires: ', a.expiry_date] }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            },
            a.id,
          ),
        ),
      })
}
function me({ dossier: i }) {
  const { t, i18n: l } = u('dossier'),
    n = l.language === 'ar',
    [s, a] = U(i.id, 'organization', {
      institutionalProfile: !0,
      orgHierarchy: !0,
      keyContacts: !0,
      timeline: !0,
      activeMous: !0,
    })
  return e.jsxs('div', {
    className: 'space-y-4 sm:space-y-6 lg:space-y-8',
    dir: n ? 'rtl' : 'ltr',
    children: [
      e.jsx('div', {
        className: 'lg:col-span-3',
        children: e.jsx(y, {
          id: 'institutionalProfile',
          title: t('sections.organization.institutionalProfile'),
          description: t('sections.organization.institutionalProfileDescription'),
          isExpanded: s.institutionalProfile,
          onToggle: () => a('institutionalProfile'),
          children: e.jsx(ne, { dossier: i }),
        }),
      }),
      e.jsx('div', {
        className: 'lg:col-span-3',
        children: e.jsx(y, {
          id: 'orgHierarchy',
          title: t('sections.organization.orgHierarchy'),
          description: t('sections.organization.orgHierarchyDescription'),
          isExpanded: s.orgHierarchy,
          onToggle: () => a('orgHierarchy'),
          children: e.jsx(le, { dossier: i }),
        }),
      }),
      e.jsx('div', {
        className: 'lg:col-span-2',
        children: e.jsx(y, {
          id: 'keyContacts',
          title: t('sections.organization.keyContacts'),
          description: t('sections.organization.keyContactsDescription'),
          isExpanded: s.keyContacts,
          onToggle: () => a('keyContacts'),
          children: e.jsx(de, { dossier: i }),
        }),
      }),
      e.jsx('div', {
        className: 'lg:col-span-1',
        children: e.jsx(y, {
          id: 'activeMous',
          title: t('sections.organization.activeMous'),
          description: t('sections.organization.activeMousDescription'),
          isExpanded: s.activeMous,
          onToggle: () => a('activeMous'),
          children: e.jsx(ce, { dossier: i }),
        }),
      }),
      e.jsx('div', {
        className: 'lg:col-span-3',
        children: e.jsx(y, {
          id: 'timeline',
          title: t('timeline.title'),
          description: t('sections.shared.timelineDescription'),
          isExpanded: s.timeline,
          onToggle: () => a('timeline'),
          children: e.jsx(ae, { dossierId: i.id }),
        }),
      }),
    ],
  })
}
function xe({ dossier: i }) {
  return e.jsx(S, {
    dossier: i,
    gridClassName: 'grid-cols-1 lg:grid-cols-3',
    children: e.jsx(me, { dossier: i }),
  })
}
function Pe() {
  const { id: i } = te.useParams(),
    { t, i18n: l } = u('dossier'),
    n = l.language === 'ar',
    { data: s, isLoading: a, error: m } = A(i, 'organization')
  return a
    ? e.jsx('div', {
        className: 'flex min-h-[50vh] items-center justify-center',
        dir: n ? 'rtl' : 'ltr',
        children: e.jsxs('div', {
          className: 'flex flex-col items-center gap-3',
          children: [
            e.jsx(Q, { className: 'h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary' }),
            e.jsx('p', {
              className: 'text-sm sm:text-base text-muted-foreground',
              children: t('detail.loading'),
            }),
          ],
        }),
      })
    : m || !s
      ? e.jsx('div', {
          className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12',
          dir: n ? 'rtl' : 'ltr',
          children: e.jsx('div', {
            className: 'max-w-2xl mx-auto',
            children: e.jsx('div', {
              className: 'rounded-lg border border-destructive/20 bg-destructive/10 p-6 sm:p-8',
              children: e.jsxs('div', {
                className: 'flex items-start gap-4',
                children: [
                  e.jsx(X, { className: 'h-5 w-5 sm:h-6 sm:w-6 text-destructive shrink-0 mt-1' }),
                  e.jsxs('div', {
                    className: 'flex-1',
                    children: [
                      e.jsx('h2', {
                        className: 'text-lg sm:text-xl font-semibold text-destructive mb-2',
                        children: t('detail.error'),
                      }),
                      e.jsx('p', {
                        className: 'text-sm sm:text-base text-destructive/90 mb-4',
                        children: m?.message || t('detail.errorGeneric'),
                      }),
                      e.jsx(T, {
                        asChild: !0,
                        variant: 'outline',
                        children: e.jsx(_, { to: '/dossiers', children: t('action.backToHub') }),
                      }),
                    ],
                  }),
                ],
              }),
            }),
          }),
        })
      : s.type !== 'organization'
        ? e.jsx('div', {
            className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12',
            dir: n ? 'rtl' : 'ltr',
            children: e.jsx('div', {
              className: 'max-w-2xl mx-auto',
              children: e.jsxs('div', {
                className: 'rounded-lg border border-warning/20 bg-warning/10 p-6 sm:p-8',
                children: [
                  e.jsx('h2', {
                    className: 'text-lg sm:text-xl font-semibold mb-2',
                    children: t('detail.wrongType'),
                  }),
                  e.jsx('p', {
                    className: 'text-sm sm:text-base text-muted-foreground mb-4',
                    children: t('detail.wrongTypeDescription', {
                      actualType: t(`type.${s.type}`),
                      expectedType: t('type.organization'),
                    }),
                  }),
                  e.jsxs('div', {
                    className: 'flex gap-3',
                    children: [
                      e.jsx(T, {
                        asChild: !0,
                        children: e.jsx(_, {
                          to: `/dossiers/${s.type}s/${i}`,
                          children: t('action.viewCorrectType', { type: t(`type.${s.type}`) }),
                        }),
                      }),
                      e.jsx(T, {
                        asChild: !0,
                        variant: 'outline',
                        children: e.jsx(_, { to: '/dossiers', children: t('action.backToHub') }),
                      }),
                    ],
                  }),
                ],
              }),
            }),
          })
        : e.jsx(xe, { dossier: s })
}
export { Pe as component }
//# sourceMappingURL=_id-B-OB3ERp.js.map
