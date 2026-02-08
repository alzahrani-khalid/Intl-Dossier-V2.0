/**
 * Navigation helpers
 *
 * TanStack Router v1's route tree generator adds `as any` to route definitions,
 * which breaks param type inference. This module provides typed navigation helpers
 * that work around the issue.
 */

/**
 * Cast params/search for TanStack Router navigate/Link.
 * Use when passing params or search to navigate() or <Link>.
 *
 * @example
 * navigate({ to: '/tasks/$id', params: p({ id: taskId }) })
 * <Link to="/commitments" search={s({ id: commitmentId })}>
 */
export function p(params: Record<string, string>): any {
  return params
}

export function s(search: Record<string, unknown>): any {
  return search
}
