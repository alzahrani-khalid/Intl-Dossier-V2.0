---
quick_id: 260607-fxt
slug: dossier-glyph-accurate-flags
status: in-progress
date: 2026-06-07
---

# Quick Task 260607-fxt — DossierGlyph: accurate world flags

Follow-up to 260607-eqp. The flags rendered for countries were **inaccurate** —
e.g. the Saudi flag was a green rectangle + a thin white bar + a dot (no shahada,
no sword). `DossierGlyph` rendered 24 **hand-drawn approximations**
(`signature-visuals/flags/*.tsx`) and ignored the accurate world-flag SVG set
already in the repo at `public/assets/flags/` (258 two-letter ISO codes, served
at `/assets/flags/{iso}.svg`).

Decision (user): use the in-repo `public/assets/flags` set and remove the 24
hand-drawn flags.

## Tasks

### Task 1 — Render accurate flag assets

- New `signature-visuals/flagCodes.ts` — `FLAG_CODES` allowlist (258 two-letter
  codes generated from `public/assets/flags/*.svg`). Supersedes the 24-entry
  `FLAG_KEYS`. Set membership is both the coverage gate and the path-safety guard.
- `signature-visuals/DossierGlyph.tsx` — keep the exact SVG structure (circular
  clipPath + 1px hairline circle); swap the inline `<FlagSvg/>` for
  `<image href="/assets/flags/{iso}.svg" preserveAspectRatio="xMidYMid slice">`,
  gated on `FLAG_CODES.has(iso.toLowerCase())`. Unknown ISO → initials (unchanged).
  Update the T-37-01 security doc comment (same-origin asset via `<image href>`,
  allowlist-gated, no `xlink:href`).
- Delete `signature-visuals/flags/` (24 `*.tsx` + `index.ts`) — now dead.

### Task 2 — Tests

- `DossierGlyph.flags.test.tsx` — keep the clipPath/case-insensitivity assertions
  (still valid); add a block asserting `<image href="/assets/flags/{iso}.svg">`
  renders for a known ISO and that a valid-shape-but-unlisted ISO (`zz`) falls
  back to initials. Refresh the stale header comment.
- `DossierGlyph.sanitized.test.tsx` — refresh the now-inaccurate header comment
  (assertions unchanged: no `<script>`, no `xlink:href`).
- **verify:** all 6 DossierGlyph + DossierTable test files green; tsc clean on
  touched files; browser shows accurate flags on :5173.

## Notes / tradeoffs

- The accurate SVGs are detailed (sa.svg ≈ 107 KB) — static, cached, same-origin
  assets (NOT bundled JS, so the JS bundle actually shrinks). If list-render perf
  ever matters, swap to `flag-icons` 1×1 or SVGO-minify the set.
- Props unchanged → every `DossierGlyph` consumer (list pages, detail headers,
  cards) benefits with no call-site changes.
