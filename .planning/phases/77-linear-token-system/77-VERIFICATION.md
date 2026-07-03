---
phase: 77-linear-token-system
type: verification
status: passed
verified: 2026-07-03
verifier: gsd-verifier (goal-backward)
requirements_verified: [TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04, TOKEN-05, TOKEN-06, FOUC-01, DOC-01]
requirements_gated_here_closed_elsewhere: [VERIFY-01]
must_haves_scoreboard: 35/35
gaps_found: 0
human_needed: false
base_commit: 299c290ff
baseline_gate_commit: 14191cb85
---

# Phase 77 (Linear Token System) — Goal-Backward Verification

**Verdict: `passed`.** Every Phase-77 requirement (TOKEN-01..06, FOUC-01, DOC-01) is
delivered and verified against the live codebase — not merely committed. All 35
`must_haves.truths` across the 8 plans hold. The VERIFY-01 pre-swap baseline gate
(the phase's only VERIFY-01 obligation) was satisfied in the correct order; VERIFY-01
itself closes in Phase 80.

**Phase goal (from ROADMAP):** _Linear is the sole visual direction — dark and light
token sets derived from the Linear spec, wired end-to-end (bootstrap → tokens →
primitives), with the FOUC byte-match invariant and the pre-swap visual baseline both
enforced as gates._ — **ACHIEVED.**

---

## Checks executed against the live tree

| Check                                         | Command                                                            | Result                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Parity guard v2 (live)                        | `node scripts/check-bootstrap-parity.mjs`                          | **exit 0** — 6 linear combos (2 modes × 3 densities, 56 vars) + 5 coercion probes + 51 `:root` literal checks |
| Parity guard v2 (fixture)                     | `node …parity.mjs tools/bootstrap-fixtures/bad-bootstrap.js`       | **exit 1** — 8 divergences named (byte-match + coercion)                                                      |
| Type-check                                    | `pnpm -C frontend type-check`                                      | **exit 0**, clean                                                                                             |
| TOKEN-03 + engine + coercion                  | `vitest run contrast.test.ts buildTokens.test.ts coercion.test.ts` | **86/86 pass**                                                                                                |
| Full DS + bootstrap suites                    | `vitest run tests/unit/design-system tests/bootstrap`              | **144/144 pass** (10 files)                                                                                   |
| Full frontend lint (incl. Design Token Check) | `pnpm run lint`                                                    | **exit 0** — eslint `--max-warnings 0` + i18n + duplicate-rtl + parity all green                              |
| Order gate                                    | `git log` baseline vs first `directions.ts` change                 | baseline `14191cb85` (22:23) **precedes** `0ba9c9044` (22:43) ✓                                               |

---

## Per-requirement verdicts

### TOKEN-01 — Dark (canonical) + light token sets from the Linear reference, wired end-to-end — ✅ PASS

- `PALETTES.linear` carries the verbatim Linear dark set (`bg #010102`, `accent.base #5e6ad2`, `accent.hover #828fff`, `surface3 #18191a`, `surface4 #191a1b`, `lineStrong #34343a`) plus a fully-derived light set — `frontend/src/design-system/tokens/directions.ts`.
- `FONTS.linear` uses the registered families `'Inter Variable'` / `'JetBrains Mono Variable'`.
- `Direction` is the single-value union `'linear'` (`tokens/types.ts:16`); `buildTokens({direction, mode, density})` reads palette literals unconditionally.
- Zero raw hex / palette literals in app code: ESLint Design Token Check green under `--max-warnings 0`.
- Evidence: 144 DS+bootstrap tests pass; lint exit 0.

### TOKEN-02 — `bootstrap.js` byte-matches `directions.ts`, enforced by CI guard — ✅ PASS

- `scripts/check-bootstrap-parity.mjs` executes the real ES5 `bootstrap.js` in a `node:vm` sandbox and compares _painted_ values to _exported_ token literals. Live exit 0; single-byte fixture exit 1.
- Wired: `frontend/package.json` lint chain (1 ref) + `.github/workflows/ci.yml` Lint job (2 refs — run step + positive-failure step).
- The guard also enforces the third copy (`index.css :root`, 51 vars) — closing the historical drift class.

### TOKEN-03 — Form-error/warning + 6-value status palette, Linear dark-band, WCAG AA — ✅ PASS

- `directions.ts` emits `semantic {danger,warn,ok,info +soft}`, `sla {ok,risk,bad +soft}`, and a 6-entry `status[]` for **both** dark and light.
- `tests/unit/design-system/contrast.test.ts` asserts (via culori `wcagContrast`, dark AND light): ink ladder, accent, semantic family on surface AND own soft, and all 6 status pairs on surface AND own soft — all ≥ 4.5:1. 86 assertions pass.
- Measured tightest pair `accent.fg #ffffff` on `accent.base #5e6ad2` = 4.70:1 (verbatim Linear on-primary anchor).

### TOKEN-04 — 4-direction switcher retired; Linear sole direction; legacy `id.dir` coerced; explicit dark default — ✅ PASS

- **Type/data:** `Direction = 'linear'` only; retired names absent from `directions.ts` (0) and `bootstrap.js` (0). `.dir-bureau/chancery/situation/ministerial` gone from CSS (0); `.dir-linear` present.
- **UI surfaces:** `DIRECTIONS` removed from `Topbar.tsx` / `TweaksDrawer.tsx` / `AppearanceSettingsSection.tsx` (grep 0); hue control removed from Tweaks + Appearance (grep 0).
- **Coercion (load-bearing migration):** `bootstrap.js:19-22` coerces any `id.dir !== 'linear'` → `'linear'` with try-guarded `setItem` write-back; `DesignProvider.tsx:211-212` mirrors it in a one-time WR-10 effect; direction state is constant `'linear'` (`:169`), `isDirection` narrows to `'linear'` (`:54`).
- **Dark default:** `bootstrap.js:25-26` defaults unset `id.theme` → `dark`, preserves explicit `light`; `App.tsx` `initialMode="dark"`, `fallbackColorMode="dark"`. `coercion.test.ts` proves all 4 retired dirs + unset → linear-dark paint + write-back, and persisted `light` is preserved (8 vm cases).
- Guard v2 coercion probes make any regression build-breaking.

### TOKEN-05 — Inter + JetBrains Mono Latin stack; Tajawal RTL cascade preserved — ✅ PASS

- `frontend/src/fonts.ts` self-hosts exactly 5 `@fontsource` imports: Inter Variable + JetBrains Mono Variable + Tajawal 400/500/700 (retired per-direction fonts dropped).
- `FONTS.linear` byte-matches `bootstrap.js` F table (parity guard green). `index.css` RTL cascade keeps Tajawal first under `html[dir='rtl']`.
- `tests/e2e/font-registration.spec.ts` present — probes the _registered_ variable families via `document.fonts.check` and Tajawal-under-RTL (honest verification; e2e is dev-server/deploy-gated per the Phase-46 harness precedent — see Notes).

### TOKEN-06 — `components/ui/*` re-skinned to Linear recipes; ~74 carve-out literals decisioned — ✅ PASS

- The 6 live carve-out files (`file-upload`, `enhanced-progress`, `sidebar-collapsible`, `timeline`, `pull-to-refresh-indicator`, `form-wizard`) contain **0** Tailwind palette literals after migration to semantic tokens.
- Linear recipes applied in the effective recipe CSS (`index.css` + `styles/list-pages.css`): flat cards/buttons (terracotta Bureau-residue button shadow removed), hairline `var(--line)` borders, token-only radii, surface-1..4 ladder (popover/menu → `--surface-3`, drawer/modal → `--surface-4`). `handoff-css-contract.test.ts` green.
- The full carve-out (74 palette lines + 20 hex across 14 files) has an explicit per-item keep/migrate/skip table in `77-06-SUMMARY.md` (6 migrate / 2 keep / 6 skip). See Notes on the documented "7 vs 6 skipped" off-by-one — 100% of lines are still accounted for.

### FOUC-01 — CI script fails on `bootstrap.js` ↔ `directions.ts` divergence — ✅ PASS

- Same guard as TOKEN-02, proven both polarities and wired into lint + CI (run + positive-failure). Landed at the **start** of the phase (77-02, `fcac42766`) before any Linear literal moved — ROADMAP hard-sequencing honored.

### DOC-01 — Design source-of-truth migrated to Linear — ✅ PASS

- The three CLAUDE.md files carry **0** matches for `Bureau is the default` / `initialDirection="bureau"` / `RTLWrapper`.
- `frontend/DESIGN.md` is the Linear spec: `#5e6ad2` (4×), `Inter Variable` (6×), **0** `bureau` (case-insensitive).
- `inteldossier_handoff_design/README.md` opens with a `SUPERSEDED (2026-07) — historical reference only` banner; no CLAUDE.md required-reading points new work at it.
- Phase-76 carryover drift closed: no `RTLWrapper` in the provider-tree prose (MD-01); `useLocale.ts` comment corrected (LO-02).

### VERIFY-01 (gating step only — closes in Phase 80) — ✅ GATE SATISFIED

- Pre-swap baseline committed at `14191cb85` (2026-07-02 22:23) — **before** the first phase-77 `directions.ts` change `0ba9c9044` (22:43). No baseline laundering.
- All 12 visual specs theme+locale-pinned; 43 human-reviewed `-chromium-darwin` PNGs + `77-BASELINE-VALIDATION.md` capture log committed. Re-comparison is Phase 80's job (correctly out of scope here).

---

## Must-haves scoreboard — 35/35 verified

| Plan  | Truths | Verified | Key live evidence                                                                                                                                        |
| ----- | ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 77-01 | 4      | 4        | Order gate (`14191cb85` < `0ba9c9044`); baseline commit + log present                                                                                    |
| 77-02 | 4      | 4        | Guard exit 0 live / 1 fixture; lint chain (1) + ci.yml (2)                                                                                               |
| 77-03 | 5      | 5        | `PALETTES.linear` dark verbatim + derived light; contrast 86/86; buildTokens tests green                                                                 |
| 77-04 | 6      | 6        | Dual-layer coercion (bootstrap:19-22 + DesignProvider:211); dark default; `:root` enforced; `.dir-linear` rename                                         |
| 77-05 | 4      | 4        | `DIRECTIONS`/hue gone from 3 surfaces (0/0); i18n retired NAMES gone (only "Situation" nav label residual)                                               |
| 77-06 | 3      | 3        | 6 migrated files 0 palette literals; recipes flat/hairline/ladder; Design Token Check green                                                              |
| 77-07 | 5      | 5        | `Direction='linear'`; hue fully retired (only `safeRemoveItem('id.hue')`); fonts 5 imports; qa-sweep 2 linear PNGs; engagement `'ministerial'` preserved |
| 77-08 | 4      | 4        | 3 CLAUDE.md clean; DESIGN.md Linear (0 bureau); handoff superseded; MD-01/LO-02 closed                                                                   |

---

## Requirement ID cross-reference (PLAN frontmatter → REQUIREMENTS.md)

Union of all PLAN `requirements:` frontmatter = **VERIFY-01, TOKEN-01, TOKEN-02, TOKEN-03,
TOKEN-04, TOKEN-05, TOKEN-06, FOUC-01, DOC-01**. Every ID is accounted for:

| ID           | Owning phase (REQUIREMENTS.md) | This phase's role                 | Verified state                                                 |
| ------------ | ------------------------------ | --------------------------------- | -------------------------------------------------------------- |
| TOKEN-01..06 | Phase 77                       | deliver                           | Complete ✓                                                     |
| FOUC-01      | Phase 77                       | deliver                           | Complete ✓                                                     |
| DOC-01       | Phase 77                       | deliver                           | Complete ✓                                                     |
| VERIFY-01    | Phase 80                       | pre-swap baseline **gating step** | Gate satisfied here; closure in Phase 80 (correctly `Pending`) |

REQUIREMENTS.md traceability table already reflects TOKEN-01..06 / FOUC-01 / DOC-01 =
`Complete`, VERIFY-01 = `Pending` (Phase 80). Consistent.

---

## Gaps

**None.** No Phase-77 requirement is unmet.

## Notes (non-gaps — documented, out-of-scope, or pre-existing)

1. **Pre-existing test failure (out of scope).** The frontend unit suite is 1409/1410. The
   single failure — `tests/accessibility/waiting-queue-a11y.test.tsx` "RTL Keyboard
   Navigation" — is **pre-existing**: `git log 299c290ff..HEAD` shows the file was **not
   touched** in Phase 77, and its wrapper (`QueryClientProvider > LanguageProvider`) renders
   none of the Phase-77-modified providers. Not a phase regression.

2. **TOKEN-06 "7 vs 6 skipped" off-by-one (documentation, not coverage).** The brief/research
   prose said "7 dead files skipped"; the honest re-count in `77-06-SUMMARY.md` is 6 skip /
   6 migrate / 2 keep — and research's own arithmetic (25 palette + 10 hex) sums to exactly
   the 6 tabled dead files. 100% of the 74 palette lines + 20 hex are decisioned. No missing
   coverage.

3. **i18n residual "Situation" (intentional Pitfall-3 keep).** `en/common.json:155
"dashboard": "Situation"` is a pre-existing **navigation label**, not a retired
   design-direction NAME, and is not a key any removed control consumed. Correctly left
   untouched (documented in 77-05).

4. **E2E specs are dev-server/deploy-gated (harness reality, per ROADMAP).** `font-registration`,
   the 12 visual baselines, and the qa-sweep focused-primitive shots require a seeded local
   dev server (the `Visual Regression (Phase 46)` CI job is red on `main` — issue #31 class).
   Per the ROADMAP's stated Phase-46 precedent, these were captured + human-reviewed + committed
   locally rather than re-run in CI. Verified here by artifact presence (spec files + committed
   PNGs + `77-BASELINE-VALIDATION.md`) and the order gate, not by re-execution — consistent with
   the phase's declared verification model.

5. **Ratified in-plan deviations (per brief).** 77-01 (dashboard-widgets frozen-clock realign +
   playwright pathTemplate fix, human-approved at the checkpoint) and 77-06 (recipes live in
   `list-pages.css`; both edited) are documented and accepted — not gaps.

---

VERIFICATION 77 DONE — status: passed, 35/35 must-haves
