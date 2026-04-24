---
phase: 37-signature-visuals
plan: 05
subsystem: signature-visuals
tags: [frontend, svg, flags, dossier, security, viz-04]
requirements: [VIZ-04]
dependency_graph:
  requires:
    - '@/types/dossier-context.types (DossierType union)'
    - frontend/src/components/signature-visuals/flags/index.ts (via flags map)
  provides:
    - DossierGlyph primitive (barrel export)
    - DossierGlyphProps
    - 24 named flag components (tree-shakeable)
    - FlagKey union
    - flags map
  affects:
    - frontend/src/components/signature-visuals/index.ts (barrel append)
tech_stack:
  added: []
  patterns:
    - Discriminated-union glyph resolver (country flag / symbol / initials)
    - Inline SVG with clipPath + hairline ring
    - `color-mix(in srgb, ...)` soft tint (D-10)
    - Reset-safe flag registry: named + keyed exports
key_files:
  created:
    - frontend/src/components/signature-visuals/DossierGlyph.tsx
    - frontend/src/components/signature-visuals/flags/sa.tsx
    - frontend/src/components/signature-visuals/flags/ae.tsx
    - frontend/src/components/signature-visuals/flags/id.tsx
    - frontend/src/components/signature-visuals/flags/eg.tsx
    - frontend/src/components/signature-visuals/flags/qa.tsx
    - frontend/src/components/signature-visuals/flags/jo.tsx
    - frontend/src/components/signature-visuals/flags/bh.tsx
    - frontend/src/components/signature-visuals/flags/om.tsx
    - frontend/src/components/signature-visuals/flags/kw.tsx
    - frontend/src/components/signature-visuals/flags/pk.tsx
    - frontend/src/components/signature-visuals/flags/ma.tsx
    - frontend/src/components/signature-visuals/flags/tr.tsx
    - frontend/src/components/signature-visuals/flags/cn.tsx
    - frontend/src/components/signature-visuals/flags/it.tsx
    - frontend/src/components/signature-visuals/flags/fr.tsx
    - frontend/src/components/signature-visuals/flags/de.tsx
    - frontend/src/components/signature-visuals/flags/gb.tsx
    - frontend/src/components/signature-visuals/flags/us.tsx
    - frontend/src/components/signature-visuals/flags/jp.tsx
    - frontend/src/components/signature-visuals/flags/kr.tsx
    - frontend/src/components/signature-visuals/flags/in.tsx
    - frontend/src/components/signature-visuals/flags/br.tsx
    - frontend/src/components/signature-visuals/flags/eu.tsx
    - frontend/src/components/signature-visuals/flags/un.tsx
    - frontend/src/components/signature-visuals/__tests__/DossierGlyph.flags.test.tsx
    - frontend/src/components/signature-visuals/__tests__/DossierGlyph.symbols.test.tsx
    - frontend/src/components/signature-visuals/__tests__/DossierGlyph.initials.test.tsx
    - frontend/src/components/signature-visuals/__tests__/DossierGlyph.hairline.test.tsx
    - frontend/src/components/signature-visuals/__tests__/DossierGlyph.sanitized.test.tsx
  modified:
    - frontend/src/components/signature-visuals/flags/index.ts
    - frontend/src/components/signature-visuals/index.ts
decisions:
  - 'DossierType has 7 members (not 8) — elected_official is a person_subtype per frontend/src/types/dossier-context.types.ts, so Pitfall 6 covers 2 fallback types (engagement, working_group) plus unknown-iso.'
  - 'Each flag file returns `<g>` (not `<svg>`) — DossierGlyph wraps them in a shared outer svg + circular clipPath per D-09..D-11.'
  - 'Flag SVG paths ported verbatim from /tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx — zero simplifications, zero coordinate adjustments.'
metrics:
  duration_minutes: 6
  tasks_completed: 3
  files_created: 30
  files_modified: 2
  tests_added: 38
  commits: 3
  completed_date: '2026-04-24'
---

# Phase 37 Plan 05: DossierGlyph + 24 Flags Summary

One-liner: Ships `<DossierGlyph>` with a 24-flag registry and 4-path resolver (flag / symbol / unknown-iso initials / unsupported-type initials) — the dossier visual identity primitive for Phase 38+ widgets.

## Objective

Deliver VIZ-04: `<DossierGlyph type iso? name? size? accent? className?>` renders a circular visual identity for any of the 7 `DossierType` members. Country + known ISO (24-set) shows a hand-drawn flag clipped to a circle with a 1px `rgba(0,0,0,0.15)` hairline; unknown ISO / unsupported types fall through to initials or Unicode symbol tiles. All flag paths ported verbatim from the handoff `glyph.jsx`.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Port 24 flag SVGs + flags barrel | `b9449165` (concurrent bundle) | 24 flag/*.tsx + flags/index.ts |
| 2 | RED: failing tests for DossierGlyph | `8e36d922` | 5 test files |
| 3 | GREEN: DossierGlyph resolver + barrel export | `75302937` | DossierGlyph.tsx + signature-visuals/index.ts |

### Commit notes

- Task 05-1's files landed in commit `b9449165` which was an amendment window created by a parallel Wave 2 executor bundling the flags alongside the 37-04 SUMMARY. Contents on disk match the committed versions exactly (`git status` clean for the flags directory after that commit). All acceptance criteria for Task 05-1 are met by that commit; the commit message does not reference 37-05 but the file set exactly matches the plan's `files_modified` for Task 05-1.

## Files Modified

### Created (30)

Flag components (24):
`flags/sa.tsx`, `flags/ae.tsx`, `flags/id.tsx`, `flags/eg.tsx`, `flags/qa.tsx`, `flags/jo.tsx`, `flags/bh.tsx`, `flags/om.tsx`, `flags/kw.tsx`, `flags/pk.tsx`, `flags/ma.tsx`, `flags/tr.tsx`, `flags/cn.tsx`, `flags/it.tsx`, `flags/fr.tsx`, `flags/de.tsx`, `flags/gb.tsx`, `flags/us.tsx`, `flags/jp.tsx`, `flags/kr.tsx`, `flags/in.tsx`, `flags/br.tsx`, `flags/eu.tsx`, `flags/un.tsx`

Resolver: `DossierGlyph.tsx`

Tests (5):
`__tests__/DossierGlyph.flags.test.tsx` (26 cases — 24 flags + 1 case-insensitivity + render),
`__tests__/DossierGlyph.symbols.test.tsx` (5 cases),
`__tests__/DossierGlyph.initials.test.tsx` (5 cases),
`__tests__/DossierGlyph.hairline.test.tsx` (1 case),
`__tests__/DossierGlyph.sanitized.test.tsx` (2 cases).

### Modified (2)

- `flags/index.ts` — 24 named re-exports, `FlagKey` union, `flags: Record<FlagKey, () => ReactElement>` keyed map
- `signature-visuals/index.ts` — appended `DossierGlyph` + `DossierGlyphProps`

## Verification

- `pnpm exec vitest run src/components/signature-visuals/__tests__/DossierGlyph` → **5 test files, 38 tests, all GREEN** (706ms).
- `pnpm exec tsc --noEmit` → **zero new errors in signature-visuals/** (pre-existing repo-wide errors unchanged and out of scope).
- `ls frontend/src/components/signature-visuals/flags/*.tsx | wc -l` → **24** (exact).
- `grep -rc "dangerously\|xlink:href\|<script" frontend/src/components/signature-visuals/` → **0** (T-37-01 sanitized).
- `grep -c "aria-hidden" frontend/src/components/signature-visuals/flags/*.tsx` ≥ 24 (every flag wrapper).

## Flag registry totals

- **24 flag TSX files, 482 LOC combined** (includes JSDoc + imports + empty lines).
- **Zero handoff flags required simplification of primitives** — all ported verbatim. The UK, USA, EU, and Korea flags use deterministic inline trig / `.map()` generation exactly as the handoff authored them (allowed per T-37-01 — no external refs, no string injection).

## FLAG_KEYS ↔ DossierType coverage map

| DossierType member | Path | Resolution |
|---|---|---|
| `country` | path 1 + path 2 | flag (if iso ∈ FLAG_KEYS) / initials (unknown iso) |
| `forum` | path 3 | symbol `◇` (U+25C7) |
| `person` | path 3 | symbol `●` (U+25CF) |
| `topic` | path 3 | symbol `◆` (U+25C6) |
| `organization` | path 3 | symbol `▲` (U+25B2) |
| `engagement` | path 4 | initials (Pitfall 6) |
| `working_group` | path 4 | initials (Pitfall 6) |

All 7 members render without throwing. `elected_official` is a `person_subtype`, not a top-level `DossierType`, and is unreachable at the resolver layer — consumers that distinguish electeds should pass `type="person"`.

## Deviations from Plan

### Plan metadata correction

The plan's `must_haves.truths` referenced "type…elected_official" and Pitfall 6 enumerated 3 extra types. `frontend/src/types/dossier-context.types.ts` defines `DossierType` as a 7-member union (engagement, working_group only — `elected_official` lives in the `person_subtype` discriminator). Implementation adapted:

- `SYMBOL_MAP` keyed on the 4 documented symbol types.
- Path 4 (initials fallback) covers the remaining 2 members: `engagement` + `working_group`.
- Initials test file asserts no crash on those 2 (not 3) — all plan-intent coverage maintained.

No blocked work or new security surface introduced — strictly an alignment of plan metadata with the canonical types file.

### None (auto-fixed bugs / critical functionality / blocking issues)

Plan executed as written after the type-alignment note above.

## Known Stubs

None — DossierGlyph is fully wired. Consumers can import `DossierGlyph` from `@/components/signature-visuals` today.

## Self-Check: PASSED

- File `frontend/src/components/signature-visuals/DossierGlyph.tsx`: **FOUND**
- All 24 `flags/*.tsx`: **FOUND** (ls | wc -l = 24)
- 5 test files: **FOUND**
- Commits `b9449165`, `8e36d922`, `75302937`: **FOUND in git log**
- Vitest: 38/38 **GREEN**
- TSC: zero new errors in signature-visuals
- T-37-01 invariants: `dangerously*`, `xlink:href`, `<script` grep counts all **0**
