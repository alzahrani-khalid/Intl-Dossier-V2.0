---
quick_id: 260607-fxt
slug: dossier-glyph-accurate-flags
status: complete
date: 2026-06-07
commit: 71dd20ed
branch: quick/260607-fxt-dossier-glyph-accurate-flags
---

# Quick Task 260607-fxt — Summary

Follow-up to 260607-eqp. After that task made flags _render_, the user noticed the
flags themselves were **inaccurate** (the Saudi "flag" was a green rectangle + a
thin white bar + a dot — no shahada, no sword).

## Root cause

`DossierGlyph` rendered **24 hand-drawn flag approximations**
(`signature-visuals/flags/*.tsx`, a Phase-37 port) and ignored the accurate
world-flag SVG set already committed in the repo at `public/assets/flags/` (266
files; 258 two-letter ISO codes), served at `/assets/flags/{iso}.svg`. Nothing
referenced that set or the bundled `flag-icons` package.

## Fix

- **New `signature-visuals/flagCodes.ts`** — `FLAG_CODES` allowlist (258 codes,
  generated from the asset filenames). Replaces the 24-key `FLAG_KEYS`. Set
  membership is both the coverage gate and the path-safety guard (only known
  codes ever reach the asset URL).
- **`DossierGlyph.tsx`** — same circular clipPath + 1px hairline structure; the
  inline `<FlagSvg/>` is now `<image href="/assets/flags/{iso}.svg"
preserveAspectRatio="xMidYMid slice">`, gated on `FLAG_CODES`. Unknown ISO →
  initials (unchanged). Updated the T-37-01 security comment.
- **Removed** the dead `signature-visuals/flags/` (24 `*.tsx` + `index.ts`).
- **Tests** — added `<image href>` assertions + an unlisted-ISO (`zz`) initials
  fallback to `DossierGlyph.flags.test.tsx`; refreshed two stale header comments.

Coverage went from 24 → 258 countries; props are unchanged, so every consumer
(list pages, detail headers, cards) shows accurate flags with no call-site edits.

## Verification

- `vitest run` — **46 passed** across the 6 DossierGlyph + DossierTable test files.
- `tsc -p tsconfig.app.json --noEmit` — 0 errors in touched files.
- Pre-commit `pnpm build` passed.
- **Browser (live, :5173):** all 4 country rows load `/assets/flags/{sa,id,ae,cn}.svg`
  — the real Saudi flag (shahada + sword), UAE, China, Indonesia.

## Files

- `frontend/src/components/signature-visuals/flagCodes.ts` (new)
- `frontend/src/components/signature-visuals/DossierGlyph.tsx`
- `frontend/src/components/signature-visuals/__tests__/DossierGlyph.flags.test.tsx`
- `frontend/src/components/signature-visuals/__tests__/DossierGlyph.sanitized.test.tsx`
- Deleted: `frontend/src/components/signature-visuals/flags/` (25 files)

## Tradeoffs / notes

- The accurate SVGs are detailed (`sa.svg` ≈ 107 KB). They are static, cached,
  same-origin assets — **not** bundled JS, so the JS bundle actually shrinks
  (24 components + barrel removed). If list-render perf ever matters, swap to
  `flag-icons` 1×1 or SVGO-minify the asset set.
- `public/assets/flags/` (266 svgs) is git-tracked → production-safe.
