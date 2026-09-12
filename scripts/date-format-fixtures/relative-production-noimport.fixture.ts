// POSITIVE-FAILURE FIXTURE for scripts/check-date-formatting.mjs — checks 9b + 9c.
// Deliberately violating. See relative-time.fixture.ts for the directory note.
//
// WITNESSED ESCAPE SHAPE #1 — THE NO-IMPORT LOCAL. Five components shipped exactly
// this: a local `formatRelativeTime` that hand-rolls the phrase from `Date.now()`
// arithmetic and imports NOTHING from date-fns, so check 5 (which keys on a date-fns
// import token) was structurally blind to it. Reproduced here so the drill fails on
// the real shape, not on a convenient one.
//
// Two offences are planted: the local relative-time DECLARATION (9b) and the
// short-format assembly it returns (9c) — `${diffD}d` / `${diffD}ي`, the literal
// tokens `/activity` rendered under `ar` at wave 1.

export function formatRelativeTime(iso: string, locale: 'en' | 'ar'): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (diffSec < 60) return locale === 'ar' ? `${diffSec}ث` : `${diffSec}s`
  const diffD = Math.floor(diffSec / 86400)
  return locale === 'ar' ? `${diffD}ي` : `${diffD}d`
}
