/**
 * Settings Route Utilities
 *
 * The SINGLE authored answer to "is this location inside the settings subtree".
 * Every consumer that needs to know imports from here — never a second copy that
 * happens to agree today, because agreement by authorship is not agreement.
 *
 * Before Phase 97 (NAV-02) two sites answered the question differently:
 * `AppShell.tsx` suppressed the global sidebar by bare PREFIX, while
 * `routes/_protected/settings.tsx` mounted the settings nav column on an EXACT
 * match. Every `/settings/*` child fell into the gap between those two readings
 * and rendered no navigation at all — not the global sidebar, not the settings
 * column.
 *
 * Both readings are defined here, side by side and named as variants of one
 * predicate (`isSettingsPath` / `isSettingsPathExact`), so that the prefix
 * answer and the exact answer can never drift apart again the way they did.
 */

/**
 * Is this pathname inside the `/settings` subtree — the index itself, or any child?
 *
 * The boundary is written out rather than left to a bare `startsWith('/settings')`,
 * which also matches a sibling route like `/settingsFoo`. Closing that latent hole
 * is part of unifying the two readings, not a separate improvement.
 *
 * @param pathname - A router location pathname (e.g. `/settings/calendar/callback`)
 * @returns True for `/settings` and for anything under `/settings/`
 */
export function isSettingsPath(pathname: string): boolean {
  return pathname === '/settings' || pathname.startsWith('/settings/')
}

/**
 * The EXACT variant: is this pathname the settings subtree index itself, as
 * opposed to one of its children?
 *
 * Lives here beside `isSettingsPath` rather than being re-derived inline at each
 * consumer, so "inside settings" and "at the settings index" have one authored
 * definition between them.
 *
 * @param pathname - A router location pathname
 * @returns True only for exactly `/settings`
 */
export function isSettingsPathExact(pathname: string): boolean {
  return pathname === '/settings'
}
