import { d as u, a as y, c as d } from './tanstack-vendor-BZC-rs5U.js'
import { s as h } from './index-qYY0KoZ1.js'
const o = 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1',
  i = {
    all: ['intake'],
    tickets: () => [...i.all, 'tickets'],
    ticketList: (e) => [...i.tickets(), 'list', e],
    ticket: (e) => [...i.tickets(), 'detail', e],
    triage: (e) => [...i.tickets(), 'triage', e],
    duplicates: (e) => [...i.tickets(), 'duplicates', e],
    attachments: (e) => [...i.tickets(), 'attachments', e],
    health: () => [...i.all, 'health'],
    aiHealth: () => [...i.all, 'ai-health'],
  },
  c = async () => {
    const {
      data: { session: e },
    } = await h.auth.getSession()
    if (!e) throw new Error('No active session')
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${e.access_token}` }
  },
  m = () => {
    const e = d()
    return u({
      mutationFn: async (t) => {
        const s = await c(),
          n = {
            request_type: t.requestType,
            title: t.title,
            title_ar: t.titleAr,
            description: t.description,
            description_ar: t.descriptionAr,
            urgency: t.urgency,
            dossier_id: t.dossierId,
            type_specific_fields: t.typeSpecificFields,
            attachments: t.attachments,
          },
          r = await fetch(`${o}/intake-tickets-create`, {
            method: 'POST',
            headers: s,
            body: JSON.stringify(n),
          })
        if (!r.ok) {
          const a = await r.json()
          throw new Error(a.message || 'Failed to create ticket')
        }
        return r.json()
      },
      onSuccess: () => {
        e.invalidateQueries({ queryKey: i.tickets() })
      },
    })
  },
  p = (e) =>
    y({
      queryKey: i.ticketList(e),
      queryFn: async () => {
        const t = await c(),
          s = new URLSearchParams()
        e &&
          Object.entries(e).forEach(([r, a]) => {
            a != null && s.append(r, String(a))
          })
        const n = await fetch(`${o}/intake-tickets-list?${s.toString()}`, { headers: t })
        if (!n.ok) {
          const r = await n.json()
          throw new Error(r.message || 'Failed to fetch tickets')
        }
        return n.json()
      },
    }),
  f = (e) =>
    y({
      queryKey: i.ticket(e),
      queryFn: async () => {
        const t = await c(),
          s = await fetch(`${o}/intake-tickets-get?id=${e}`, { headers: t })
        if (!s.ok) {
          const n = await s.json()
          throw new Error(n.message || 'Failed to fetch ticket')
        }
        return s.json()
      },
      enabled: !!e,
    }),
  q = (e) => {
    const t = d()
    return u({
      mutationFn: async (s) => {
        const n = await c(),
          r = await fetch(`${o}/intake-tickets-update`, {
            method: 'PATCH',
            headers: n,
            body: JSON.stringify({ id: e, ...s }),
          })
        if (!r.ok) {
          const a = await r.json()
          throw new Error(a.message || 'Failed to update ticket')
        }
        return r.json()
      },
      onSuccess: () => {
        ;(t.invalidateQueries({ queryKey: i.ticket(e) }),
          t.invalidateQueries({ queryKey: i.tickets() }))
      },
    })
  },
  j = (e) =>
    y({
      queryKey: i.triage(e),
      queryFn: async () => {
        const t = await c(),
          s = await fetch(`${o}/intake-tickets-triage/${e}/triage`, { method: 'GET', headers: t })
        if (!s.ok) {
          const n = await s.json()
          throw new Error(n.message || 'Failed to fetch triage suggestions')
        }
        return s.json()
      },
      enabled: !!e,
      staleTime: 5 * 60 * 1e3,
    }),
  S = (e) => {
    const t = d()
    return u({
      mutationFn: async (s) => {
        const n = await c(),
          a = {
            action: s.decision_type === 'ai_suggestion' ? 'accept' : 'override',
            sensitivity: s.suggested_sensitivity,
            urgency: s.suggested_urgency,
            assigned_to: s.suggested_assignee,
            assigned_unit: s.suggested_unit,
            override_reason: s.override_reason,
            override_reason_ar: s.override_reason_ar,
          },
          l = await fetch(`${o}/intake-tickets-triage/${e}/triage`, {
            method: 'POST',
            headers: n,
            body: JSON.stringify(a),
          })
        if (!l.ok) {
          const w = await l.json()
          throw new Error(w.message || 'Failed to apply triage')
        }
        return l.json()
      },
      onSuccess: () => {
        ;(t.invalidateQueries({ queryKey: i.ticket(e) }),
          t.invalidateQueries({ queryKey: i.triage(e) }),
          t.invalidateQueries({ queryKey: i.tickets() }))
      },
    })
  },
  F = (e) => {
    const t = d()
    return u({
      mutationFn: async (s) => {
        const n = await c(),
          r = await fetch(`${o}/intake-tickets-convert`, {
            method: 'POST',
            headers: n,
            body: JSON.stringify({ id: e, ...s }),
          })
        if (!r.ok) {
          const a = await r.json()
          throw new Error(a.message || 'Failed to convert ticket')
        }
        return r.json()
      },
      onSuccess: () => {
        ;(t.invalidateQueries({ queryKey: i.ticket(e) }),
          t.invalidateQueries({ queryKey: i.tickets() }))
      },
    })
  },
  v = (e, t = 0.65) =>
    y({
      queryKey: i.duplicates(e),
      queryFn: async () => {
        const s = await c(),
          n = await fetch(`${o}/intake-tickets-duplicates?id=${e}&threshold=${t}`, { headers: s })
        if (!n.ok) {
          const r = await n.json()
          throw new Error(r.message || 'Failed to fetch duplicates')
        }
        return n.json()
      },
      enabled: !!e,
    }),
  _ = (e) => {
    const t = d()
    return u({
      mutationFn: async (s) => {
        const n = await c(),
          r = await fetch(`${o}/intake-tickets-merge`, {
            method: 'POST',
            headers: n,
            body: JSON.stringify({ id: e, ...s }),
          })
        if (!r.ok) {
          const a = await r.json()
          throw new Error(a.message || 'Failed to merge tickets')
        }
        return r.json()
      },
      onSuccess: () => {
        t.invalidateQueries({ queryKey: i.tickets() })
      },
    })
  },
  T = (e) => {
    const t = d()
    return u({
      mutationFn: async (s) => {
        const n = await c(),
          r = await fetch(`${o}/intake-tickets-close`, {
            method: 'POST',
            headers: n,
            body: JSON.stringify({ id: e, ...s }),
          })
        if (!r.ok) {
          const a = await r.json()
          throw new Error(a.message || 'Failed to close ticket')
        }
        return r.json()
      },
      onSuccess: () => {
        ;(t.invalidateQueries({ queryKey: i.ticket(e) }),
          t.invalidateQueries({ queryKey: i.tickets() }))
      },
    })
  },
  $ = () =>
    u({
      mutationFn: async (e) => {
        const {
          data: { session: t },
        } = await h.auth.getSession()
        if (!t) throw new Error('No active session')
        const s = await fetch(`${o}/intake-tickets-attachments`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${t.access_token}` },
          body: e,
        })
        if (!s.ok) {
          const n = await s.json()
          throw new Error(n.message || 'Failed to upload attachment')
        }
        return s.json()
      },
    }),
  E = () =>
    u({
      mutationFn: async (e) => {
        const t = await c(),
          s = await fetch(`${o}/intake-tickets-attachments?id=${e}`, {
            method: 'DELETE',
            headers: t,
          })
        if (!s.ok) {
          const n = await s.json()
          throw new Error(n.message || 'Failed to delete attachment')
        }
      },
    }),
  b = (e) =>
    y({
      queryKey: ['sla-preview', e],
      queryFn: async () => {
        const t = {
          critical: { acknowledgmentMinutes: 15, resolutionHours: 4, businessHoursOnly: !1 },
          high: { acknowledgmentMinutes: 30, resolutionHours: 8, businessHoursOnly: !0 },
          medium: { acknowledgmentMinutes: 60, resolutionHours: 24, businessHoursOnly: !0 },
          low: { acknowledgmentMinutes: 120, resolutionHours: 72, businessHoursOnly: !0 },
        }
        return t[e] || t.medium
      },
      enabled: !!e,
    })
export {
  E as a,
  j as b,
  S as c,
  p as d,
  m as e,
  b as f,
  v as g,
  _ as h,
  f as i,
  q as j,
  F as k,
  T as l,
  $ as u,
}
//# sourceMappingURL=useIntakeApi-84Q7PHHY.js.map
