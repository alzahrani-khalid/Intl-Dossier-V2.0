import { a as p, c as _, d } from './tanstack-vendor-BZC-rs5U.js'
import { s as u } from './index-qYY0KoZ1.js'
import { aP as r } from './vendor-misc-BiJvMP0A.js'
import { u as l } from './react-vendor-Buoak6m3.js'
const h = 'https://zkrcjzdemdmwhearhfgg.supabase.co'
class i extends Error {
  constructor(e, s, a) {
    ;(super(e), (this.statusCode = s), (this.details = a), (this.name = 'InteractionAPIError'))
  }
}
async function y() {
  const {
    data: { session: t },
  } = await u.auth.getSession()
  if (!t) throw new i('Not authenticated', 401)
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${t.access_token}` }
}
async function f(t) {
  if (!t.ok) {
    let e = `Request failed with status ${t.status}`
    try {
      const s = await t.json()
      e = s.error || s.message || e
    } catch {}
    throw new i(e, t.status)
  }
  try {
    return await t.json()
  } catch (e) {
    throw new i('Failed to parse response', t.status, e)
  }
}
async function b(t) {
  const e = await y(),
    s = await fetch(`${h}/functions/v1/interaction-notes-create`, {
      method: 'POST',
      headers: e,
      body: JSON.stringify(t),
    })
  return f(s)
}
async function D(t) {
  const e = await y(),
    s = await fetch(`${h}/functions/v1/interaction-notes-list?contact_id=${t}`, {
      method: 'GET',
      headers: e,
    })
  return (await f(s)).notes
}
async function N(t = {}) {
  const e = await y(),
    s = new URLSearchParams()
  Object.entries(t).forEach(([o, c]) => {
    c != null && s.append(o, String(c))
  })
  const a = await fetch(`${h}/functions/v1/interaction-notes-search?${s.toString()}`, {
    method: 'GET',
    headers: e,
  })
  return f(a)
}
async function $(t) {
  const e = await y(),
    s = await fetch(`${h}/functions/v1/interaction-notes-delete`, {
      method: 'POST',
      headers: e,
      body: JSON.stringify({ id: t }),
    })
  await f(s)
}
async function k(t, e, s) {
  const {
    data: { session: a },
  } = await u.auth.getSession()
  if (!a) throw new i('Not authenticated', 401)
  const o = Date.now(),
    c = s.name.replace(/[^a-zA-Z0-9._-]/g, '_'),
    m = `contacts/interactions/${t}/${e}/${o}_${c}`,
    { data: g, error: w } = await u.storage
      .from('contact-files')
      .upload(m, s, { cacheControl: '3600', upsert: !1 })
  if (w) throw new i(`Failed to upload file: ${w.message}`, 500, w)
  return g.path
}
async function S(t) {
  const { data: e, error: s } = await u.storage.from('contact-files').download(t)
  if (s) throw new i(`Failed to download file: ${s.message}`, 500, s)
  return e
}
const n = {
  all: ['interactions'],
  lists: () => [...n.all, 'list'],
  list: (t) => [...n.lists(), t],
  searches: () => [...n.all, 'search'],
  search: (t) => [...n.searches(), { params: t }],
  details: () => [...n.all, 'detail'],
  detail: (t) => [...n.details(), t],
}
function C(t, e) {
  return p({ queryKey: n.list(t), queryFn: () => D(t), enabled: !!t, ...e })
}
function Q(t, e) {
  return p({ queryKey: n.search(t), queryFn: () => N(t), ...e })
}
function A() {
  const t = _(),
    { t: e } = l('contacts')
  return d({
    mutationFn: async (s) => await b(s),
    onSuccess: (s, a) => {
      ;(t.invalidateQueries({ queryKey: n.list(a.contact_id) }),
        t.invalidateQueries({ queryKey: n.searches() }),
        r.success(
          e('contactDirectory.interactions.hooks.note_created_success', {
            type: e(`contactDirectory.interactions.types.${s.type}`),
          }),
        ))
    },
    onError: (s) => {
      r.error(e('contactDirectory.interactions.hooks.note_created_error', { error: s.message }))
    },
  })
}
function K() {
  const t = _(),
    { t: e } = l('contacts')
  return d({
    mutationFn: ({ id: s, contactId: a }) => $(s),
    onMutate: async ({ id: s, contactId: a }) => {
      await t.cancelQueries({ queryKey: n.list(a) })
      const o = t.getQueryData(n.list(a))
      if (o) {
        const c = o.filter((m) => m.id !== s)
        t.setQueryData(n.list(a), c)
      }
      return { previousNotes: o, contactId: a }
    },
    onSuccess: (s, a) => {
      ;(t.invalidateQueries({ queryKey: n.list(a.contactId) }),
        t.invalidateQueries({ queryKey: n.searches() }),
        r.success(e('contactDirectory.interactions.hooks.note_deleted_success')))
    },
    onError: (s, a, o) => {
      ;(o?.previousNotes && o?.contactId && t.setQueryData(n.list(o.contactId), o.previousNotes),
        r.error(e('contactDirectory.interactions.hooks.note_deleted_error', { error: s.message })))
    },
  })
}
function P() {
  const { t } = l('contacts')
  return d({
    mutationFn: async ({ contactId: e, noteId: s, file: a }) => await k(e, s, a),
    onSuccess: () => {
      r.success(t('contactDirectory.interactions.hooks.attachment_uploaded_success'))
    },
    onError: (e) => {
      r.error(
        t('contactDirectory.interactions.hooks.attachment_upload_error', { error: e.message }),
      )
    },
  })
}
function j() {
  const { t } = l('contacts')
  return d({
    mutationFn: async ({ path: e, filename: s }) => ({ blob: await S(e), filename: s }),
    onSuccess: ({ blob: e, filename: s }) => {
      const a = URL.createObjectURL(e),
        o = document.createElement('a')
      ;((o.href = a),
        (o.download = s),
        document.body.appendChild(o),
        o.click(),
        document.body.removeChild(o),
        URL.revokeObjectURL(a),
        r.success(t('contactDirectory.interactions.hooks.attachment_downloaded_success')))
    },
    onError: (e) => {
      r.error(
        t('contactDirectory.interactions.hooks.attachment_download_error', { error: e.message }),
      )
    },
  })
}
export { C as a, K as b, j as c, A as d, P as e, Q as u }
//# sourceMappingURL=useInteractions-BJmtWgB5.js.map
