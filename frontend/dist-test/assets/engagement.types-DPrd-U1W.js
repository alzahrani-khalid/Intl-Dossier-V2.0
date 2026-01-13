import { a as g, c as d, d as u } from './tanstack-vendor-BZC-rs5U.js'
import { aP as l } from './vendor-misc-BiJvMP0A.js'
import { s as _ } from './index-qYY0KoZ1.js'
import { u as m } from './react-vendor-Buoak6m3.js'
const i = 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1',
  n = {
    all: ['engagements'],
    lists: () => [...n.all, 'list'],
    list: (e) => [...n.lists(), e],
    details: () => [...n.all, 'detail'],
    detail: (e) => [...n.details(), e],
    participants: (e) => [...n.all, 'participants', e],
    agenda: (e) => [...n.all, 'agenda', e],
  },
  c = async () => {
    const {
      data: { session: e },
    } = await _.auth.getSession()
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${e?.access_token}` }
  }
function y(e, s) {
  return g({
    queryKey: n.list(e),
    queryFn: async () => {
      const r = await c(),
        t = new URLSearchParams()
      ;(e?.search && t.set('search', e.search),
        e?.engagement_type && t.set('engagement_type', e.engagement_type),
        e?.engagement_category && t.set('engagement_category', e.engagement_category),
        e?.engagement_status && t.set('engagement_status', e.engagement_status),
        e?.host_country_id && t.set('host_country_id', e.host_country_id),
        e?.start_date && t.set('start_date', e.start_date),
        e?.end_date && t.set('end_date', e.end_date),
        e?.page && t.set('page', String(e.page)),
        e?.limit && t.set('limit', String(e.limit)))
      const a = await fetch(`${i}/engagement-dossiers?${t}`, { headers: r })
      if (!a.ok) {
        const o = await a.json()
        throw new Error(o.error?.message_en || 'Failed to fetch engagements')
      }
      return a.json()
    },
    staleTime: 3e4,
    gcTime: 5 * 6e4,
    ...s,
  })
}
function A(e, s) {
  return g({
    queryKey: n.detail(e),
    queryFn: async () => {
      const r = await c(),
        t = await fetch(`${i}/engagement-dossiers/${e}`, { headers: r })
      if (!t.ok) {
        const a = await t.json()
        throw new Error(a.error?.message_en || 'Failed to fetch engagement')
      }
      return t.json()
    },
    enabled: !!e,
    staleTime: 6e4,
    gcTime: 10 * 6e4,
    ...s,
  })
}
function S() {
  const e = d(),
    { t: s } = m('engagements')
  return u({
    mutationFn: async (r) => {
      const t = await c(),
        a = await fetch(`${i}/engagement-dossiers/${r}`, { method: 'DELETE', headers: t })
      if (!a.ok) {
        const o = await a.json()
        throw new Error(o.error?.message_en || 'Failed to archive engagement')
      }
      return a.json()
    },
    onSuccess: (r, t) => {
      ;(e.removeQueries({ queryKey: n.detail(t) }),
        e.invalidateQueries({ queryKey: n.lists() }),
        l.success(s('messages.archived')))
    },
    onError: (r) => {
      l.error(s('messages.archiveError', { error: r.message }))
    },
  })
}
const T = {
    bilateral_meeting: { en: 'Bilateral Meeting', ar: 'اجتماع ثنائي' },
    mission: { en: 'Mission', ar: 'بعثة' },
    delegation: { en: 'Delegation', ar: 'وفد' },
    summit: { en: 'Summit', ar: 'قمة' },
    working_group: { en: 'Working Group', ar: 'مجموعة عمل' },
    roundtable: { en: 'Roundtable', ar: 'طاولة مستديرة' },
    official_visit: { en: 'Official Visit', ar: 'زيارة رسمية' },
    consultation: { en: 'Consultation', ar: 'استشارة' },
    other: { en: 'Other', ar: 'أخرى' },
  },
  w = {
    diplomatic: { en: 'Diplomatic', ar: 'دبلوماسي' },
    statistical: { en: 'Statistical', ar: 'إحصائي' },
    technical: { en: 'Technical', ar: 'فني' },
    economic: { en: 'Economic', ar: 'اقتصادي' },
    cultural: { en: 'Cultural', ar: 'ثقافي' },
    educational: { en: 'Educational', ar: 'تعليمي' },
    research: { en: 'Research', ar: 'بحثي' },
    other: { en: 'Other', ar: 'أخرى' },
  },
  L = {
    planned: { en: 'Planned', ar: 'مخطط' },
    confirmed: { en: 'Confirmed', ar: 'مؤكد' },
    in_progress: { en: 'In Progress', ar: 'جاري' },
    completed: { en: 'Completed', ar: 'مكتمل' },
    postponed: { en: 'Postponed', ar: 'مؤجل' },
    cancelled: { en: 'Cancelled', ar: 'ملغي' },
  },
  C = {
    head_of_state: { en: 'Head of State', ar: 'رئيس دولة' },
    ministerial: { en: 'Ministerial', ar: 'وزاري' },
    senior_official: { en: 'Senior Official', ar: 'مسؤول رفيع' },
    director: { en: 'Director', ar: 'مدير' },
    expert: { en: 'Expert', ar: 'خبير' },
    technical: { en: 'Technical', ar: 'فني' },
  },
  P = {
    host: { en: 'Host', ar: 'مضيف' },
    guest: { en: 'Guest', ar: 'ضيف' },
    delegate: { en: 'Delegate', ar: 'مندوب' },
    head_of_delegation: { en: 'Head of Delegation', ar: 'رئيس الوفد' },
    speaker: { en: 'Speaker', ar: 'متحدث' },
    observer: { en: 'Observer', ar: 'مراقب' },
    organizer: { en: 'Organizer', ar: 'منظم' },
    support_staff: { en: 'Support Staff', ar: 'طاقم دعم' },
    interpreter: { en: 'Interpreter', ar: 'مترجم' },
    other: { en: 'Other', ar: 'أخرى' },
  },
  v = {
    expected: { en: 'Expected', ar: 'متوقع' },
    confirmed: { en: 'Confirmed', ar: 'مؤكد' },
    attended: { en: 'Attended', ar: 'حضر' },
    no_show: { en: 'No Show', ar: 'لم يحضر' },
    cancelled: { en: 'Cancelled', ar: 'ملغي' },
    tentative: { en: 'Tentative', ar: 'غير مؤكد' },
  },
  N = {
    planned: { en: 'Planned', ar: 'مخطط' },
    in_progress: { en: 'In Progress', ar: 'جاري' },
    completed: { en: 'Completed', ar: 'مكتمل' },
    skipped: { en: 'Skipped', ar: 'تم تخطيه' },
    postponed: { en: 'Postponed', ar: 'مؤجل' },
  }
export { v as A, C as D, T as E, P, L as a, w as b, A as c, S as d, N as e, y as u }
//# sourceMappingURL=engagement.types-DPrd-U1W.js.map
