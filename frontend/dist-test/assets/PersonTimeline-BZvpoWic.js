import { u as P, r as v, j as e } from './react-vendor-Buoak6m3.js'
import { g as F, a as y, u as E, T as j, E as b } from './useUnifiedTimeline-2-SmgReu.js'
function w({ dossierId: n, className: i }) {
  const { t: a } = P('dossier'),
    [s, r] = v.useState(!1),
    t = F('Person'),
    o = y('Person'),
    {
      events: l,
      isLoading: c,
      isFetchingNextPage: g,
      hasNextPage: m,
      error: p,
      fetchNextPage: f,
      refetch: h,
      filters: T,
      setFilters: d,
    } = E({
      dossierId: n,
      dossierType: 'Person',
      initialFilters: { event_types: t },
      itemsPerPage: 20,
      enableRealtime: !1,
    }),
    u = (x) => {
      d(x)
    }
  return e.jsxs('div', {
    className: i,
    children: [
      e.jsx(j, {
        filters: T,
        onFiltersChange: u,
        availableEventTypes: o,
        defaultEventTypes: t,
        showFilters: s,
        onToggleFilters: () => r(!s),
        onRefresh: h,
      }),
      e.jsx(b, {
        events: l,
        isLoading: c,
        isFetchingNextPage: g,
        hasNextPage: m,
        onLoadMore: f,
        error: p,
        emptyMessage: a('timeline.empty.person'),
      }),
    ],
  })
}
export { w as P }
//# sourceMappingURL=PersonTimeline-BZvpoWic.js.map
