import { u as v, r as F, j as e } from './react-vendor-Buoak6m3.js'
import { g as y, a as E, u as j, T as z, E as O } from './useUnifiedTimeline-2-SmgReu.js'
function N({ dossierId: i, className: a }) {
  const { t: n } = v('dossier'),
    [t, r] = F.useState(!1),
    s = y('Organization'),
    o = E('Organization'),
    {
      events: l,
      isLoading: g,
      isFetchingNextPage: c,
      hasNextPage: m,
      error: p,
      fetchNextPage: f,
      refetch: h,
      filters: T,
      setFilters: d,
    } = j({
      dossierId: i,
      dossierType: 'Organization',
      initialFilters: { event_types: s },
      itemsPerPage: 20,
      enableRealtime: !1,
    }),
    u = (x) => {
      d(x)
    }
  return e.jsxs('div', {
    className: a,
    children: [
      e.jsx(z, {
        filters: T,
        onFiltersChange: u,
        availableEventTypes: o,
        defaultEventTypes: s,
        showFilters: t,
        onToggleFilters: () => r(!t),
        onRefresh: h,
      }),
      e.jsx(O, {
        events: l,
        isLoading: g,
        isFetchingNextPage: c,
        hasNextPage: m,
        onLoadMore: f,
        error: p,
        emptyMessage: n('timeline.empty.organization'),
      }),
    ],
  })
}
export { N as O }
//# sourceMappingURL=OrganizationTimeline-Bvhhh3g1.js.map
