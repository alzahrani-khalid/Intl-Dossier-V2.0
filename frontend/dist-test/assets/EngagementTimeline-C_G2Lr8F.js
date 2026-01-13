import { u as x, r as v, j as e } from './react-vendor-Buoak6m3.js'
import { g as F, a as y, u as j, T as P, E as b } from './useUnifiedTimeline-2-SmgReu.js'
function w({ dossierId: n, className: a }) {
  const { t: i } = x('dossier'),
    [t, r] = v.useState(!1),
    s = F('Engagement'),
    l = y('Engagement'),
    {
      events: o,
      isLoading: g,
      isFetchingNextPage: m,
      hasNextPage: c,
      error: p,
      fetchNextPage: E,
      refetch: f,
      filters: h,
      setFilters: T,
    } = j({
      dossierId: n,
      dossierType: 'Engagement',
      initialFilters: { event_types: s },
      itemsPerPage: 20,
      enableRealtime: !1,
    }),
    d = (u) => {
      T(u)
    }
  return e.jsxs('div', {
    className: a,
    children: [
      e.jsx(P, {
        filters: h,
        onFiltersChange: d,
        availableEventTypes: l,
        defaultEventTypes: s,
        showFilters: t,
        onToggleFilters: () => r(!t),
        onRefresh: f,
      }),
      e.jsx(b, {
        events: o,
        isLoading: g,
        isFetchingNextPage: m,
        hasNextPage: c,
        onLoadMore: E,
        error: p,
        emptyMessage: i('timeline.empty.engagement'),
      }),
    ],
  })
}
export { w as E }
//# sourceMappingURL=EngagementTimeline-C_G2Lr8F.js.map
