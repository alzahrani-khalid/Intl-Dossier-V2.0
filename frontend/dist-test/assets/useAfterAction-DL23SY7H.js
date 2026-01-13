import { a, c as i, d as s } from './tanstack-vendor-BZC-rs5U.js'
import { s as n } from './index-qYY0KoZ1.js'
function f(e) {
  return a({
    queryKey: ['after-action', e],
    queryFn: async () => {
      if (!e) throw new Error('After-action ID is required')
      const { data: r, error: t } = await n.functions.invoke('after-actions-get', {
        body: { id: e },
      })
      if (t) throw t
      return r
    },
    enabled: !!e,
  })
}
function y() {
  const e = i()
  return s({
    mutationFn: async (r) => {
      const { data: t, error: o } = await n.functions.invoke('after-actions-create', { body: r })
      if (o) throw o
      return t
    },
    onSuccess: (r) => {
      ;(e.invalidateQueries({ queryKey: ['after-actions', r.dossier_id] }),
        e.setQueryData(['after-action', r.id], r))
    },
  })
}
function w(e) {
  return a({
    queryKey: ['after-action-versions', e],
    queryFn: async () => {
      if (!e) throw new Error('After-action ID is required')
      const { data: r, error: t } = await n.functions.invoke('after-actions-versions', {
        body: { after_action_id: e },
      })
      if (t) throw t
      return r
    },
    enabled: !!e,
  })
}
export { y as a, w as b, f as u }
//# sourceMappingURL=useAfterAction-DL23SY7H.js.map
