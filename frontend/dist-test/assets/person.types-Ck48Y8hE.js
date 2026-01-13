import { a as u, c as f, d as m } from './tanstack-vendor-BZC-rs5U.js'
import { aP as i } from './vendor-misc-BiJvMP0A.js'
import { s as h } from './index-qYY0KoZ1.js'
import { u as d } from './react-vendor-Buoak6m3.js'
const l = 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1',
  t = {
    all: ['persons'],
    lists: () => [...t.all, 'list'],
    list: (e) => [...t.lists(), e],
    details: () => [...t.all, 'detail'],
    detail: (e) => [...t.details(), e],
    network: (e, o) => [...t.all, 'network', e, o],
    roles: (e) => [...t.all, 'roles', e],
    affiliations: (e) => [...t.all, 'affiliations', e],
    relationships: (e) => [...t.all, 'relationships', e],
  },
  c = async () => {
    const {
      data: { session: e },
    } = await h.auth.getSession()
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${e?.access_token}` }
  }
function _(e, o) {
  return u({
    queryKey: t.list(e),
    queryFn: async () => {
      const s = await c(),
        r = new URLSearchParams()
      ;(e?.search && r.set('search', e.search),
        e?.organization_id && r.set('organization_id', e.organization_id),
        e?.nationality_id && r.set('nationality_id', e.nationality_id),
        e?.importance_level && r.set('importance_level', String(e.importance_level)),
        e?.limit && r.set('limit', String(e.limit)),
        e?.offset && r.set('offset', String(e.offset)))
      const n = await fetch(`${l}/persons?${r}`, { headers: s })
      if (!n.ok) {
        const a = await n.json()
        throw new Error(a.error?.message_en || 'Failed to fetch persons')
      }
      return n.json()
    },
    staleTime: 3e4,
    gcTime: 5 * 6e4,
    ...o,
  })
}
function E(e, o) {
  return u({
    queryKey: t.detail(e),
    queryFn: async () => {
      const s = await c(),
        r = await fetch(`${l}/persons/${e}`, { headers: s })
      if (!r.ok) {
        const n = await r.json()
        throw new Error(n.error?.message_en || 'Failed to fetch person')
      }
      return r.json()
    },
    enabled: !!e,
    staleTime: 6e4,
    gcTime: 10 * 6e4,
    ...o,
  })
}
function v() {
  const e = f(),
    { t: o } = d('persons')
  return m({
    mutationFn: async (s) => {
      const r = await c(),
        n = await fetch(`${l}/persons`, { method: 'POST', headers: r, body: JSON.stringify(s) })
      if (!n.ok) {
        const a = await n.json()
        throw new Error(a.error?.message_en || 'Failed to create person')
      }
      return n.json()
    },
    onSuccess: (s) => {
      ;(e.invalidateQueries({ queryKey: t.lists() }),
        e.setQueryData(t.detail(s.id), s),
        i.success(o('messages.created', { name: s.name_en })))
    },
    onError: (s) => {
      i.error(o('messages.createError', { error: s.message }))
    },
  })
}
function A() {
  const e = f(),
    { t: o } = d('persons')
  return m({
    mutationFn: async (s) => {
      const r = await c(),
        n = await fetch(`${l}/persons/${s}`, { method: 'DELETE', headers: r })
      if (!n.ok) {
        const a = await n.json()
        throw new Error(a.error?.message_en || 'Failed to archive person')
      }
      return n.json()
    },
    onSuccess: (s, r) => {
      ;(e.removeQueries({ queryKey: t.detail(r) }),
        e.invalidateQueries({ queryKey: t.lists() }),
        i.success(o('messages.archived')))
    },
    onError: (s) => {
      i.error(o('messages.archiveError', { error: s.message }))
    },
  })
}
const P = {
    1: { en: 'Regular', ar: 'عادي' },
    2: { en: 'Important', ar: 'مهم' },
    3: { en: 'Key Contact', ar: 'جهة اتصال رئيسية' },
    4: { en: 'VIP', ar: 'شخصية هامة' },
    5: { en: 'Critical', ar: 'حرج' },
  },
  S = {
    reports_to: { en: 'Reports to', ar: 'يرفع تقاريره إلى' },
    supervises: { en: 'Supervises', ar: 'يشرف على' },
    colleague: { en: 'Colleague', ar: 'زميل' },
    collaborates_with: { en: 'Collaborates with', ar: 'يتعاون مع' },
    mentors: { en: 'Mentors', ar: 'يوجه' },
    knows: { en: 'Knows', ar: 'يعرف' },
    former_colleague: { en: 'Former colleague', ar: 'زميل سابق' },
    referral: { en: 'Referral', ar: 'إحالة' },
  },
  L = {
    member: { en: 'Member', ar: 'عضو' },
    board_member: { en: 'Board Member', ar: 'عضو مجلس إدارة' },
    advisor: { en: 'Advisor', ar: 'مستشار' },
    consultant: { en: 'Consultant', ar: 'استشاري' },
    representative: { en: 'Representative', ar: 'ممثل' },
    delegate: { en: 'Delegate', ar: 'مندوب' },
    liaison: { en: 'Liaison', ar: 'منسق' },
    partner: { en: 'Partner', ar: 'شريك' },
    volunteer: { en: 'Volunteer', ar: 'متطوع' },
    alumni: { en: 'Alumni', ar: 'خريج' },
  }
export { L as A, P as I, S as R, v as a, E as b, A as c, _ as u }
//# sourceMappingURL=person.types-Ck48Y8hE.js.map
