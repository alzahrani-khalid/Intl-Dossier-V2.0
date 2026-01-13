import { u as j, r as l, j as n } from './react-vendor-Buoak6m3.js'
import { c as N } from './supabase-vendor-CTsC8ILD.js'
function R({ ticketId: h, targetMinutes: s, eventType: y, startedAt: f, className: v = '' }) {
  const { t: a } = j('intake'),
    [c, g] = l.useState(s),
    [m, x] = l.useState(!1),
    [u, p] = l.useState(!1)
  ;(l.useEffect(() => {
    const e = () => {
      const i = new Date(f).getTime(),
        t = Date.now(),
        d = Math.floor((t - i) / (1e3 * 60)),
        o = s - d
      ;(g(o), x(o < 0))
    }
    e()
    const r = setInterval(e, 6e4)
    return () => clearInterval(r)
  }, [s, f]),
    l.useEffect(() => {
      const e = N(
          'https://zkrcjzdemdmwhearhfgg.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcmNqemRlbWRtd2hlYXJoZmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MjY0OTAsImV4cCI6MjA3NDQwMjQ5MH0.JnSwNH0rsz8yg9zx73_3qc5CpJ6oo-udpo3G4ZIwkYQ',
        ),
        r = e
          .channel(`sla_events:${h}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'sla_events', filter: `ticket_id=eq.${h}` },
            (i) => {
              const t = i.new
              ;(t.event_type === 'paused'
                ? p(!0)
                : t.event_type === 'resumed'
                  ? p(!1)
                  : t.event_type === 'breached'
                    ? x(!0)
                    : t.event_type === 'met' && g(0),
                g(t.remaining_minutes))
            },
          )
          .subscribe()
      return () => {
        e.removeChannel(r)
      }
    }, [h]))
  const w = (e) => {
      if (e < 0) {
        const t = Math.abs(e),
          d = Math.floor(t / 60),
          o = t % 60
        return d > 0
          ? a('sla.breached_by_hours', { hours: d, minutes: o })
          : a('sla.breached_by_minutes', { minutes: o })
      }
      const r = Math.floor(e / 60),
        i = e % 60
      return r > 0
        ? a('sla.time_remaining_hours', { hours: r, minutes: i })
        : a('sla.time_remaining_minutes', { minutes: i })
    },
    I = () => {
      if (m) return 'bg-red-500 text-white'
      if (u) return 'bg-gray-400 text-white'
      const e = (c / s) * 100
      return e > 25
        ? 'bg-green-500 text-white'
        : e > 10
          ? 'bg-yellow-500 text-gray-900'
          : 'bg-orange-500 text-white'
    },
    _ = () => {
      if (m) return '⚠️'
      if (u) return '⏸️'
      const e = (c / s) * 100
      return e > 25 ? '✓' : e > 10 ? '⚡' : '🔴'
    },
    b = () => {
      if (m) return 100
      const e = ((s - c) / s) * 100
      return Math.min(Math.max(e, 0), 100)
    }
  return n.jsxs('div', {
    className: `sla-countdown ${v}`,
    children: [
      n.jsxs('div', {
        className: 'mb-2 flex items-center justify-between',
        children: [
          n.jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              n.jsx('span', {
                className: 'text-sm font-medium text-gray-700 dark:text-gray-300',
                children: a(y === 'acknowledgment' ? 'sla.acknowledgment' : 'sla.resolution'),
              }),
              u &&
                n.jsx('span', {
                  className: 'text-xs text-gray-500 dark:text-gray-400',
                  children: a('sla.paused'),
                }),
            ],
          }),
          n.jsxs('span', {
            className: `rounded-full px-3 py-1 text-xs font-semibold ${I()}`,
            role: 'status',
            'aria-live': 'polite',
            children: [_(), ' ', w(c)],
          }),
        ],
      }),
      n.jsx('div', {
        className: 'h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
        children: n.jsx('div', {
          className: `h-full transition-all duration-1000 ${m ? 'bg-red-500' : u ? 'bg-gray-400' : 'bg-gradient-to-r from-green-500 to-green-600'}`,
          style: { width: `${b()}%` },
          role: 'progressbar',
          'aria-valuenow': b(),
          'aria-valuemin': 0,
          'aria-valuemax': 100,
        }),
      }),
      n.jsxs('div', {
        className: 'mt-1 text-xs text-gray-500 dark:text-gray-400',
        children: [a('sla.target'), ': ', Math.floor(s / 60), 'h ', s % 60, 'm'],
      }),
    ],
  })
}
export { R as S }
//# sourceMappingURL=SLACountdown-Bedgm05V.js.map
