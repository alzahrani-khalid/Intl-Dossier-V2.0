import { u as W, r as N, j as e } from './react-vendor-Buoak6m3.js'
import {
  s as g,
  B as v,
  j as w,
  k as T,
  o as O,
  l as b,
  I as z,
  q as C,
  r as k,
  t as D,
  v as E,
  w as j,
  m as X,
  D as ye,
  x as Ne,
  y as we,
  z as Z,
  A as ee,
  E as se,
  F as ae,
  G as te,
  H as re,
  J as x,
  n as $,
  K as ie,
} from './index-qYY0KoZ1.js'
import {
  A as be,
  a as Ce,
  b as ke,
  c as De,
  d as Ee,
  e as qe,
  f as Se,
  g as Fe,
} from './alert-dialog-DaWYDPc1.js'
import { a as de, c as V, d as H } from './tanstack-vendor-BZC-rs5U.js'
import {
  aP as A,
  aS as K,
  bw as ze,
  b9 as ne,
  b_ as Ae,
  aI as Q,
  bi as le,
  aR as Pe,
  aE as Ge,
  b8 as Me,
  bx as Te,
  aJ as Oe,
  bd as $e,
  b$ as Ke,
  c0 as We,
  c1 as Ue,
  aM as ce,
} from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
const c = {
  all: ['working-groups'],
  lists: () => [...c.all, 'list'],
  list: (s) => [...c.lists(), s],
  details: () => [...c.all, 'detail'],
  detail: (s) => [...c.details(), s],
  full: (s) => [...c.all, 'full', s],
  members: (s) => [...c.all, 'members', s],
  deliverables: (s) => [...c.all, 'deliverables', s],
  meetings: (s) => [...c.all, 'meetings', s],
  decisions: (s) => [...c.all, 'decisions', s],
  stats: () => [...c.all, 'stats'],
}
function Ie(s = {}, u) {
  return de({
    queryKey: c.list(s),
    queryFn: async () => {
      const {
          search: r,
          status: t,
          wg_status: o,
          wg_type: d,
          parent_forum_id: p,
          lead_org_id: n,
          page: h = 1,
          limit: _ = 20,
        } = s,
        q = (h - 1) * _,
        { data: G, error: S } = await g.rpc('search_working_groups', {
          p_search_term: r || null,
          p_status: t && t !== 'all' ? t : null,
          p_wg_type: d && d !== 'all' ? d : null,
          p_parent_forum_id: p || null,
          p_lead_org_id: n || null,
          p_limit: _,
          p_offset: q,
        })
      if (S) throw new Error(S.message)
      let f = g
        .from('dossiers')
        .select('*', { count: 'exact', head: !0 })
        .eq('type', 'working_group')
        .neq('archived', !0)
      ;(t && t !== 'all' && (f = f.eq('status', t)),
        r && (f = f.or(`name_en.ilike.%${r}%,name_ar.ilike.%${r}%`)))
      const { count: y } = await f
      return {
        data: G || [],
        pagination: {
          page: h,
          limit: _,
          total: y || 0,
          totalPages: Math.ceil((y || 0) / _),
          has_more: (G?.length || 0) === _,
        },
      }
    },
    staleTime: 3e4,
    gcTime: 5 * 6e4,
    ...u,
  })
}
function Qe() {
  const s = V(),
    { t: u } = W('working-groups')
  return H({
    mutationFn: async (r) => {
      const {
        data: { user: t },
      } = await g.auth.getUser()
      if (!t) throw new Error('Not authenticated')
      const o = { low: 1, medium: 2, high: 3, critical: 4 },
        d =
          typeof r.sensitivity_level == 'string'
            ? o[r.sensitivity_level] || 1
            : r.sensitivity_level || 1,
        { data: p, error: n } = await g
          .from('dossiers')
          .insert({
            type: 'working_group',
            name_en: r.name_en,
            name_ar: r.name_ar || r.name_en,
            description_en: r.summary_en,
            description_ar: r.summary_ar,
            status: 'active',
            sensitivity_level: d,
            tags: r.tags || [],
          })
          .select()
          .single()
      if (n) throw new Error(n.message)
      const { data: h, error: _ } = await g
        .from('working_groups')
        .insert({
          id: p.id,
          wg_type: r.wg_type,
          wg_status: r.wg_status || 'active',
          mandate_en: r.mandate_en,
          mandate_ar: r.mandate_ar,
          description_en: r.description_en,
          description_ar: r.description_ar,
          meeting_frequency: r.meeting_frequency,
          established_date: r.established_date,
          parent_forum_id: r.parent_forum_id,
          lead_org_id: r.lead_org_id,
          chair_person_id: r.chair_person_id,
          secretary_person_id: r.secretary_person_id,
          objectives: r.objectives,
          created_by: t.id,
          updated_by: t.id,
        })
        .select()
        .single()
      if (_) throw (await g.from('dossiers').delete().eq('id', p.id), new Error(_.message))
      return (
        await g
          .from('dossier_owners')
          .insert({ dossier_id: p.id, user_id: t.id, role_type: 'owner' }),
        { ...p, ...h }
      )
    },
    onSuccess: (r) => {
      ;(s.invalidateQueries({ queryKey: c.lists() }),
        s.invalidateQueries({ queryKey: c.stats() }),
        A.success(u('messages.created', { name: r.name_en })))
    },
    onError: (r) => {
      A.error(u('messages.createError', { error: r.message }))
    },
  })
}
function Re() {
  const s = V(),
    { t: u } = W('working-groups')
  return H({
    mutationFn: async ({ id: r, data: t }) => {
      const {
        data: { user: o },
      } = await g.auth.getUser()
      if (!o) throw new Error('Not authenticated')
      const d = { updated_at: new Date().toISOString() }
      ;(t.name_en !== void 0 && (d.name_en = t.name_en),
        t.name_ar !== void 0 && (d.name_ar = t.name_ar),
        t.summary_en !== void 0 && (d.summary_en = t.summary_en),
        t.summary_ar !== void 0 && (d.summary_ar = t.summary_ar),
        t.status !== void 0 && (d.status = t.status),
        t.sensitivity_level !== void 0 && (d.sensitivity_level = t.sensitivity_level),
        t.tags !== void 0 && (d.tags = t.tags))
      const { error: p } = await g.from('dossiers').update(d).eq('id', r)
      if (p) throw new Error(p.message)
      const n = { updated_by: o.id }
      ;(t.wg_type !== void 0 && (n.wg_type = t.wg_type),
        t.wg_status !== void 0 && (n.wg_status = t.wg_status),
        t.mandate_en !== void 0 && (n.mandate_en = t.mandate_en),
        t.mandate_ar !== void 0 && (n.mandate_ar = t.mandate_ar),
        t.description_en !== void 0 && (n.description_en = t.description_en),
        t.description_ar !== void 0 && (n.description_ar = t.description_ar),
        t.meeting_frequency !== void 0 && (n.meeting_frequency = t.meeting_frequency),
        t.next_meeting_date !== void 0 && (n.next_meeting_date = t.next_meeting_date),
        t.disbandment_date !== void 0 && (n.disbandment_date = t.disbandment_date),
        t.parent_forum_id !== void 0 && (n.parent_forum_id = t.parent_forum_id),
        t.lead_org_id !== void 0 && (n.lead_org_id = t.lead_org_id),
        t.chair_person_id !== void 0 && (n.chair_person_id = t.chair_person_id),
        t.secretary_person_id !== void 0 && (n.secretary_person_id = t.secretary_person_id),
        t.objectives !== void 0 && (n.objectives = t.objectives))
      const { error: h } = await g.from('working_groups').update(n).eq('id', r)
      if (h) throw new Error(h.message)
      const { data: _ } = await g.rpc('get_working_group_full', { p_working_group_id: r })
      return _?.working_group
    },
    onSuccess: (r) => {
      ;(s.invalidateQueries({ queryKey: c.lists() }),
        s.invalidateQueries({ queryKey: c.full(r.id) }),
        A.success(u('messages.updated')))
    },
    onError: (r) => {
      A.error(u('messages.updateError', { error: r.message }))
    },
  })
}
function Ve() {
  const s = V(),
    { t: u } = W('working-groups')
  return H({
    mutationFn: async (r) => {
      const { error: t } = await g
        .from('dossiers')
        .update({ archived: !0, status: 'archived' })
        .eq('id', r)
        .eq('type', 'working_group')
      if (t) throw new Error(t.message)
      return r
    },
    onSuccess: (r) => {
      ;(s.invalidateQueries({ queryKey: c.lists() }),
        s.removeQueries({ queryKey: c.full(r) }),
        s.invalidateQueries({ queryKey: c.stats() }),
        A.success(u('messages.archived')))
    },
    onError: (r) => {
      A.error(u('messages.archiveError', { error: r.message }))
    },
  })
}
function He() {
  return de({
    queryKey: c.stats(),
    queryFn: async () => {
      const { data: s, error: u } = await g.from('working_group_stats').select('*')
      if (u) throw new Error(u.message)
      return {
        total: s?.length || 0,
        active: s?.filter((t) => t.wg_status === 'active').length || 0,
        suspended: s?.filter((t) => t.wg_status === 'suspended').length || 0,
        disbanded: s?.filter((t) => t.wg_status === 'disbanded').length || 0,
        totalMembers: s?.reduce((t, o) => t + (o.active_member_count || 0), 0) || 0,
        totalDeliverables: s?.reduce((t, o) => t + (o.total_deliverables || 0), 0) || 0,
        completedDeliverables: s?.reduce((t, o) => t + (o.completed_deliverables || 0), 0) || 0,
        totalMeetings: s?.reduce((t, o) => t + (o.total_meetings || 0), 0) || 0,
      }
    },
    staleTime: 6e4,
  })
}
const R = ['committee', 'task_force', 'advisory_board', 'technical_group', 'steering_committee'],
  Le = ['active', 'suspended', 'disbanded'],
  oe = ['weekly', 'biweekly', 'monthly', 'quarterly', 'biannually', 'annually', 'as_needed']
function Be() {
  const { t: s, i18n: u } = W('working-groups'),
    r = u.language === 'ar',
    [t, o] = N.useState({ page: 1, limit: 20 }),
    [d, p] = N.useState(''),
    [n, h] = N.useState(!1),
    [_, q] = N.useState(!1),
    [G, S] = N.useState(!1),
    [f, y] = N.useState(null),
    [l, m] = N.useState({ name_en: '', name_ar: '', wg_type: 'committee' }),
    { data: L, isLoading: me, isError: ue, error: xe } = Ie({ ...t, search: d || void 0 }),
    { data: F } = He(),
    U = Qe(),
    I = Re(),
    B = Ve(),
    he = async () => {
      l.name_en.trim() && (await U.mutateAsync(l), h(!1), M())
    },
    ge = async () => {
      !f || !l.name_en.trim() || (await I.mutateAsync({ id: f.id, data: l }), q(!1), y(null), M())
    },
    _e = async () => {
      f && (await B.mutateAsync(f.id), S(!1), y(null))
    },
    pe = (a) => {
      ;(y(a),
        m({
          name_en: a.name_en,
          name_ar: a.name_ar,
          summary_en: a.summary_en,
          summary_ar: a.summary_ar,
          wg_type: a.wg_type,
          wg_status: a.wg_status,
          mandate_en: a.mandate_en,
          mandate_ar: a.mandate_ar,
          description_en: a.description_en,
          description_ar: a.description_ar,
          meeting_frequency: a.meeting_frequency,
          established_date: a.established_date,
        }),
        q(!0))
    },
    je = (a) => {
      ;(y(a), S(!0))
    },
    M = () => {
      m({ name_en: '', name_ar: '', wg_type: 'committee' })
    },
    J = (a, i) => {
      o((ve) => ({ ...ve, [a]: i === 'all' ? void 0 : i, page: 1 }))
    },
    Y = L?.data || [],
    P = L?.pagination,
    fe = (a) => {
      switch (a) {
        case 'active':
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        case 'suspended':
          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
        case 'disbanded':
          return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    }
  return me
    ? e.jsx('div', {
        className: 'flex min-h-96 items-center justify-center',
        children: e.jsx(K, { className: 'size-8 animate-spin text-primary' }),
      })
    : ue
      ? e.jsxs('div', {
          className: 'flex min-h-96 flex-col items-center justify-center gap-4',
          children: [
            e.jsx(ze, { className: 'size-12 text-destructive' }),
            e.jsxs('div', {
              className: 'text-center',
              children: [
                e.jsx('h2', {
                  className: 'text-xl font-semibold',
                  children: s('errors.loadFailed'),
                }),
                e.jsx('p', { className: 'text-sm text-muted-foreground', children: xe?.message }),
              ],
            }),
          ],
        })
      : e.jsxs('div', {
          className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6',
          dir: r ? 'rtl' : 'ltr',
          children: [
            e.jsx('header', {
              className: 'flex flex-col gap-2',
              children: e.jsxs('div', {
                className:
                  'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4',
                children: [
                  e.jsxs('div', {
                    children: [
                      e.jsx('h1', {
                        className: 'text-2xl sm:text-3xl font-bold',
                        children: s('title'),
                      }),
                      e.jsx('p', {
                        className: 'text-sm sm:text-base text-muted-foreground',
                        children: s('subtitle'),
                      }),
                    ],
                  }),
                  e.jsxs(v, {
                    className: 'w-full sm:w-auto min-h-11 gap-2',
                    onClick: () => h(!0),
                    children: [e.jsx(ne, { className: 'size-4' }), s('actions.add')],
                  }),
                ],
              }),
            }),
            e.jsxs('section', {
              className: 'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
              children: [
                e.jsxs(w, {
                  children: [
                    e.jsxs(T, {
                      className: 'flex flex-row items-center justify-between pb-2',
                      children: [
                        e.jsx(O, {
                          className: 'text-sm font-medium',
                          children: s('metrics.activeGroups'),
                        }),
                        e.jsx(Ae, { className: 'size-5 text-primary' }),
                      ],
                    }),
                    e.jsxs(b, {
                      children: [
                        e.jsx('p', { className: 'text-2xl font-bold', children: F?.active || 0 }),
                        e.jsxs('p', {
                          className: 'text-xs text-muted-foreground',
                          children: [s('metrics.totalGroups'), ': ', F?.total || 0],
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsxs(w, {
                  children: [
                    e.jsxs(T, {
                      className: 'flex flex-row items-center justify-between pb-2',
                      children: [
                        e.jsx(O, {
                          className: 'text-sm font-medium',
                          children: s('metrics.totalMembers'),
                        }),
                        e.jsx(Q, { className: 'size-5 text-primary' }),
                      ],
                    }),
                    e.jsxs(b, {
                      children: [
                        e.jsx('p', {
                          className: 'text-2xl font-bold',
                          children: F?.totalMembers || 0,
                        }),
                        e.jsx('p', {
                          className: 'text-xs text-muted-foreground',
                          children: s('metrics.totalMembersHint'),
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsxs(w, {
                  children: [
                    e.jsxs(T, {
                      className: 'flex flex-row items-center justify-between pb-2',
                      children: [
                        e.jsx(O, {
                          className: 'text-sm font-medium',
                          children: s('metrics.totalDeliverables'),
                        }),
                        e.jsx(le, { className: 'size-5 text-primary' }),
                      ],
                    }),
                    e.jsxs(b, {
                      children: [
                        e.jsx('p', {
                          className: 'text-2xl font-bold',
                          children: F?.totalDeliverables || 0,
                        }),
                        e.jsxs('p', {
                          className: 'text-xs text-muted-foreground',
                          children: [
                            s('metrics.completedDeliverables'),
                            ': ',
                            F?.completedDeliverables || 0,
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsxs(w, {
                  children: [
                    e.jsxs(T, {
                      className: 'flex flex-row items-center justify-between pb-2',
                      children: [
                        e.jsx(O, {
                          className: 'text-sm font-medium',
                          children: s('metrics.upcomingMeetings'),
                        }),
                        e.jsx(Pe, { className: 'size-5 text-primary' }),
                      ],
                    }),
                    e.jsx(b, {
                      children: e.jsx('p', {
                        className: 'text-2xl font-bold',
                        children: F?.totalMeetings || 0,
                      }),
                    }),
                  ],
                }),
              ],
            }),
            e.jsx(w, {
              children: e.jsx(b, {
                className: 'pt-6',
                children: e.jsxs('div', {
                  className: 'flex flex-col gap-4',
                  children: [
                    e.jsxs('div', {
                      className: 'relative',
                      children: [
                        e.jsx(Ge, {
                          className:
                            'absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground',
                        }),
                        e.jsx(z, {
                          placeholder: s('filters.searchPlaceholder'),
                          value: d,
                          onChange: (a) => p(a.target.value),
                          className: 'ps-10 min-h-11',
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'flex flex-col sm:flex-row gap-3',
                      children: [
                        e.jsxs('div', {
                          className: 'flex items-center gap-2 text-sm text-muted-foreground',
                          children: [
                            e.jsx(Me, { className: 'size-4' }),
                            e.jsxs('span', { children: [s('filters.title'), ':'] }),
                          ],
                        }),
                        e.jsxs(C, {
                          value: t.status || 'all',
                          onValueChange: (a) => J('status', a),
                          children: [
                            e.jsx(k, {
                              className: 'w-full sm:w-40 min-h-11',
                              children: e.jsx(D, { placeholder: s('filters.allStatuses') }),
                            }),
                            e.jsxs(E, {
                              children: [
                                e.jsx(j, { value: 'all', children: s('filters.allStatuses') }),
                                e.jsx(j, { value: 'active', children: s('status.active') }),
                                e.jsx(j, { value: 'inactive', children: s('status.inactive') }),
                                e.jsx(j, { value: 'archived', children: s('status.archived') }),
                              ],
                            }),
                          ],
                        }),
                        e.jsxs(C, {
                          value: t.wg_type || 'all',
                          onValueChange: (a) => J('wg_type', a),
                          children: [
                            e.jsx(k, {
                              className: 'w-full sm:w-44 min-h-11',
                              children: e.jsx(D, { placeholder: s('filters.allTypes') }),
                            }),
                            e.jsxs(E, {
                              children: [
                                e.jsx(j, { value: 'all', children: s('filters.allTypes') }),
                                R.map((a) => e.jsx(j, { value: a, children: s(`types.${a}`) }, a)),
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
            Y.length === 0
              ? e.jsx(w, {
                  children: e.jsx(b, {
                    className: 'py-12',
                    children: e.jsxs('div', {
                      className: 'text-center',
                      children: [
                        e.jsx(Q, { className: 'mx-auto size-12 text-muted-foreground mb-4' }),
                        e.jsx('h3', {
                          className: 'text-lg font-semibold',
                          children: s('empty.title'),
                        }),
                        e.jsx('p', {
                          className: 'text-sm text-muted-foreground mt-1',
                          children: s('empty.description'),
                        }),
                        e.jsxs(v, {
                          className: 'mt-4',
                          onClick: () => h(!0),
                          children: [e.jsx(ne, { className: 'size-4 me-2' }), s('actions.add')],
                        }),
                      ],
                    }),
                  }),
                })
              : e.jsx('div', {
                  className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
                  children: Y.map((a, i) =>
                    e.jsx(
                      Te.div,
                      {
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { delay: i * 0.05 },
                        children: e.jsx(w, {
                          className: 'h-full hover:shadow-md transition-shadow cursor-pointer',
                          children: e.jsx(b, {
                            className: 'p-4',
                            children: e.jsxs('div', {
                              className: 'flex items-start justify-between gap-2',
                              children: [
                                e.jsxs('div', {
                                  className: 'flex-1 min-w-0',
                                  children: [
                                    e.jsx('h3', {
                                      className: 'font-semibold text-base truncate',
                                      children: r ? a.name_ar : a.name_en,
                                    }),
                                    e.jsx('p', {
                                      className: 'text-xs text-muted-foreground truncate',
                                      children: r ? a.name_en : a.name_ar,
                                    }),
                                    e.jsxs('div', {
                                      className: 'flex items-center gap-2 mt-2',
                                      children: [
                                        e.jsx(X, {
                                          variant: 'outline',
                                          className: 'text-xs',
                                          children: s(`types.${a.wg_type}`),
                                        }),
                                        e.jsx(X, {
                                          className: `text-xs ${fe(a.wg_status)}`,
                                          children: s(`status.${a.wg_status}`),
                                        }),
                                      ],
                                    }),
                                    e.jsxs('div', {
                                      className:
                                        'flex items-center gap-4 mt-3 text-sm text-muted-foreground',
                                      children: [
                                        e.jsxs('span', {
                                          className: 'flex items-center gap-1',
                                          children: [
                                            e.jsx(Q, { className: 'size-3.5' }),
                                            a.active_member_count || 0,
                                          ],
                                        }),
                                        e.jsxs('span', {
                                          className: 'flex items-center gap-1',
                                          children: [
                                            e.jsx(le, { className: 'size-3.5' }),
                                            a.total_deliverables || 0,
                                          ],
                                        }),
                                        a.lead_org_name_en &&
                                          e.jsxs('span', {
                                            className: 'flex items-center gap-1 truncate',
                                            children: [
                                              e.jsx(Oe, { className: 'size-3.5 flex-shrink-0' }),
                                              e.jsx('span', {
                                                className: 'truncate',
                                                children: r
                                                  ? a.lead_org_name_ar
                                                  : a.lead_org_name_en,
                                              }),
                                            ],
                                          }),
                                      ],
                                    }),
                                    e.jsxs('div', {
                                      className:
                                        'flex items-center gap-1 mt-2 text-xs text-muted-foreground',
                                      children: [
                                        e.jsx($e, { className: 'size-3' }),
                                        new Date(a.updated_at).toLocaleDateString(
                                          r ? 'ar-SA' : 'en-US',
                                        ),
                                      ],
                                    }),
                                  ],
                                }),
                                e.jsxs(ye, {
                                  children: [
                                    e.jsx(Ne, {
                                      asChild: !0,
                                      children: e.jsx(v, {
                                        variant: 'ghost',
                                        size: 'icon',
                                        className: 'size-8',
                                        children: e.jsx(Ke, { className: 'size-4' }),
                                      }),
                                    }),
                                    e.jsxs(we, {
                                      align: r ? 'start' : 'end',
                                      children: [
                                        e.jsxs(Z, {
                                          onClick: () => pe(a),
                                          children: [
                                            e.jsx(We, { className: 'size-4 me-2' }),
                                            s('actions.edit'),
                                          ],
                                        }),
                                        e.jsxs(Z, {
                                          onClick: () => je(a),
                                          children: [
                                            e.jsx(Ue, { className: 'size-4 me-2' }),
                                            s('actions.archive'),
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
                      },
                      a.id,
                    ),
                  ),
                }),
            P &&
              P.totalPages > 1 &&
              e.jsxs('div', {
                className: 'flex items-center justify-center gap-2 mt-6',
                children: [
                  e.jsx(v, {
                    variant: 'outline',
                    size: 'sm',
                    onClick: () => o((a) => ({ ...a, page: Math.max(1, (a.page || 1) - 1) })),
                    disabled: t.page === 1,
                    className: 'min-h-10',
                    children: e.jsx(ce, { className: `size-4 ${r ? '' : 'rotate-180'}` }),
                  }),
                  e.jsxs('span', {
                    className: 'text-sm px-4',
                    children: [t.page || 1, ' / ', P.totalPages],
                  }),
                  e.jsx(v, {
                    variant: 'outline',
                    size: 'sm',
                    onClick: () =>
                      o((a) => ({ ...a, page: Math.min(P.totalPages, (a.page || 1) + 1) })),
                    disabled: t.page === P.totalPages,
                    className: 'min-h-10',
                    children: e.jsx(ce, { className: `size-4 ${r ? 'rotate-180' : ''}` }),
                  }),
                ],
              }),
            e.jsx(ee, {
              open: n,
              onOpenChange: h,
              children: e.jsxs(se, {
                className: 'max-w-lg max-h-[90vh] overflow-y-auto',
                children: [
                  e.jsxs(ae, {
                    children: [
                      e.jsx(te, { children: s('createDialog.title') }),
                      e.jsx(re, { children: s('createDialog.description') }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'space-y-4 py-4',
                    children: [
                      e.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          e.jsxs(x, { htmlFor: 'name_en', children: [s('form.nameEn'), ' *'] }),
                          e.jsx(z, {
                            id: 'name_en',
                            placeholder: s('form.nameEnPlaceholder'),
                            value: l.name_en,
                            onChange: (a) => m((i) => ({ ...i, name_en: a.target.value })),
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          e.jsx(x, { htmlFor: 'name_ar', children: s('form.nameAr') }),
                          e.jsx(z, {
                            id: 'name_ar',
                            placeholder: s('form.nameArPlaceholder'),
                            value: l.name_ar || '',
                            onChange: (a) => m((i) => ({ ...i, name_ar: a.target.value })),
                            dir: 'rtl',
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          e.jsxs(x, { children: [s('form.type'), ' *'] }),
                          e.jsxs(C, {
                            value: l.wg_type,
                            onValueChange: (a) => m((i) => ({ ...i, wg_type: a })),
                            children: [
                              e.jsx(k, {
                                children: e.jsx(D, { placeholder: s('form.typePlaceholder') }),
                              }),
                              e.jsx(E, {
                                children: R.map((a) =>
                                  e.jsx(j, { value: a, children: s(`types.${a}`) }, a),
                                ),
                              }),
                            ],
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          e.jsx(x, { children: s('form.meetingFrequency') }),
                          e.jsxs(C, {
                            value: l.meeting_frequency || '',
                            onValueChange: (a) => m((i) => ({ ...i, meeting_frequency: a })),
                            children: [
                              e.jsx(k, {
                                children: e.jsx(D, {
                                  placeholder: s('form.meetingFrequencyPlaceholder'),
                                }),
                              }),
                              e.jsx(E, {
                                children: oe.map((a) =>
                                  e.jsx(j, { value: a, children: s(`meetingFrequency.${a}`) }, a),
                                ),
                              }),
                            ],
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          e.jsx(x, { htmlFor: 'summary_en', children: s('form.summaryEn') }),
                          e.jsx($, {
                            id: 'summary_en',
                            value: l.summary_en || '',
                            onChange: (a) => m((i) => ({ ...i, summary_en: a.target.value })),
                            rows: 2,
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          e.jsx(x, { htmlFor: 'mandate_en', children: s('form.mandateEn') }),
                          e.jsx($, {
                            id: 'mandate_en',
                            placeholder: s('form.mandateEnPlaceholder'),
                            value: l.mandate_en || '',
                            onChange: (a) => m((i) => ({ ...i, mandate_en: a.target.value })),
                            rows: 3,
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          e.jsx(x, {
                            htmlFor: 'established_date',
                            children: s('form.establishedDate'),
                          }),
                          e.jsx(z, {
                            id: 'established_date',
                            type: 'date',
                            value: l.established_date || '',
                            onChange: (a) => m((i) => ({ ...i, established_date: a.target.value })),
                          }),
                        ],
                      }),
                    ],
                  }),
                  e.jsxs(ie, {
                    className: 'flex-col sm:flex-row gap-2',
                    children: [
                      e.jsx(v, {
                        variant: 'outline',
                        onClick: () => {
                          ;(h(!1), M())
                        },
                        children: s('form.cancel'),
                      }),
                      e.jsxs(v, {
                        onClick: he,
                        disabled: !l.name_en.trim() || U.isPending,
                        children: [
                          U.isPending && e.jsx(K, { className: 'size-4 me-2 animate-spin' }),
                          s('form.create'),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            }),
            e.jsx(ee, {
              open: _,
              onOpenChange: q,
              children: e.jsxs(se, {
                className: 'max-w-lg max-h-[90vh] overflow-y-auto',
                children: [
                  e.jsxs(ae, {
                    children: [
                      e.jsx(te, { children: s('editDialog.title') }),
                      e.jsx(re, { children: s('editDialog.description') }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'space-y-4 py-4',
                    children: [
                      e.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          e.jsxs(x, {
                            htmlFor: 'edit_name_en',
                            children: [s('form.nameEn'), ' *'],
                          }),
                          e.jsx(z, {
                            id: 'edit_name_en',
                            value: l.name_en,
                            onChange: (a) => m((i) => ({ ...i, name_en: a.target.value })),
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          e.jsx(x, { htmlFor: 'edit_name_ar', children: s('form.nameAr') }),
                          e.jsx(z, {
                            id: 'edit_name_ar',
                            value: l.name_ar || '',
                            onChange: (a) => m((i) => ({ ...i, name_ar: a.target.value })),
                            dir: 'rtl',
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          e.jsxs(x, { children: [s('form.type'), ' *'] }),
                          e.jsxs(C, {
                            value: l.wg_type,
                            onValueChange: (a) => m((i) => ({ ...i, wg_type: a })),
                            children: [
                              e.jsx(k, { children: e.jsx(D, {}) }),
                              e.jsx(E, {
                                children: R.map((a) =>
                                  e.jsx(j, { value: a, children: s(`types.${a}`) }, a),
                                ),
                              }),
                            ],
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          e.jsx(x, { children: s('form.status') }),
                          e.jsxs(C, {
                            value: l.wg_status || 'active',
                            onValueChange: (a) => m((i) => ({ ...i, wg_status: a })),
                            children: [
                              e.jsx(k, { children: e.jsx(D, {}) }),
                              e.jsx(E, {
                                children: Le.map((a) =>
                                  e.jsx(j, { value: a, children: s(`status.${a}`) }, a),
                                ),
                              }),
                            ],
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          e.jsx(x, { children: s('form.meetingFrequency') }),
                          e.jsxs(C, {
                            value: l.meeting_frequency || '',
                            onValueChange: (a) => m((i) => ({ ...i, meeting_frequency: a })),
                            children: [
                              e.jsx(k, {
                                children: e.jsx(D, {
                                  placeholder: s('form.meetingFrequencyPlaceholder'),
                                }),
                              }),
                              e.jsx(E, {
                                children: oe.map((a) =>
                                  e.jsx(j, { value: a, children: s(`meetingFrequency.${a}`) }, a),
                                ),
                              }),
                            ],
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          e.jsx(x, { htmlFor: 'edit_summary_en', children: s('form.summaryEn') }),
                          e.jsx($, {
                            id: 'edit_summary_en',
                            value: l.summary_en || '',
                            onChange: (a) => m((i) => ({ ...i, summary_en: a.target.value })),
                            rows: 2,
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          e.jsx(x, { htmlFor: 'edit_mandate_en', children: s('form.mandateEn') }),
                          e.jsx($, {
                            id: 'edit_mandate_en',
                            value: l.mandate_en || '',
                            onChange: (a) => m((i) => ({ ...i, mandate_en: a.target.value })),
                            rows: 3,
                          }),
                        ],
                      }),
                    ],
                  }),
                  e.jsxs(ie, {
                    className: 'flex-col sm:flex-row gap-2',
                    children: [
                      e.jsx(v, {
                        variant: 'outline',
                        onClick: () => {
                          ;(q(!1), y(null), M())
                        },
                        children: s('form.cancel'),
                      }),
                      e.jsxs(v, {
                        onClick: ge,
                        disabled: !l.name_en.trim() || I.isPending,
                        children: [
                          I.isPending && e.jsx(K, { className: 'size-4 me-2 animate-spin' }),
                          s('form.update'),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            }),
            e.jsx(be, {
              open: G,
              onOpenChange: S,
              children: e.jsxs(Ce, {
                children: [
                  e.jsxs(ke, {
                    children: [
                      e.jsx(De, { children: s('confirmations.archive') }),
                      e.jsx(Ee, { children: s('confirmations.archiveDescription') }),
                    ],
                  }),
                  e.jsxs(qe, {
                    className: 'flex-col sm:flex-row gap-2',
                    children: [
                      e.jsx(Se, { children: s('form.cancel') }),
                      e.jsxs(Fe, {
                        onClick: _e,
                        className:
                          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                        children: [
                          B.isPending && e.jsx(K, { className: 'size-4 me-2 animate-spin' }),
                          s('actions.archive'),
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
const ls = Be
export { ls as component }
//# sourceMappingURL=working-groups-qzxQPV4G.js.map
