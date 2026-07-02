# Pitfalls Research

**Domain:** v8.0 Linear Design System Migration on an existing Arabic-first RTL React 19 + Vite + Tailwind v4 + Supabase app (shadcn RTL infra + Linear token replacement + HeroUI v2→v3 + Aceternity removal + FOUC bootstrap sync)
**Researched:** 2026-07-01
**Confidence:** HIGH (shadcn RTL docs + changelog verified; HeroUI v3 migration docs verified; project's own v6.0 FOUC-invariant and dual-RTL history verified from PROJECT.md/CLAUDE.md/MEMORY.md)

> Scope note: this is a **migration onto an existing system**, not a greenfield build. Every pitfall below is about the _collision_ between what already ships (a working `useDirection()` / `i18n.language === 'ar'` RTL mechanism, an OKLCH IntelDossier token engine, a byte-matched `bootstrap.js`, a partial HeroUI v3 adoption, and an already-purged-then-reintroduced Aceternity surface) and what v8.0 layers on top.

## Critical Pitfalls

### Pitfall 1: Dual RTL mechanism → double-flip (shadcn `dir` + existing `useDirection()`/`I18nManager`)

**What goes wrong:**
The app already computes direction from `i18n.language === 'ar'` and drives it through `useDirection()` + `LtrIsolate` + `eslint-plugin-rtl-friendly` (zero physical CSS). shadcn's RTL model expects a single `DirectionProvider direction="rtl"` (Radix) plus `dir="rtl"` on `<html>`. If you wire shadcn's `DirectionProvider` **in addition to** the existing setter without making one the single source of truth, you get two independent direction owners. Symptoms: Radix portals (Popover/Tooltip/Dropdown) render LTR while the page is RTL (or vice-versa), and any component that reads the _nearest_ `dir` gets a stale value. Worse, if a container already has `dir="rtl"` and a child logical-flip class _also_ flips, content double-flips back to visual LTR — the exact class of bug the global RTL rules (Rule 4: never `.reverse()`, `forceRTL` already flips) warn about.

**Why it happens:**
Teams treat `DirectionProvider` as "just another provider to add" and mount it high in `main.tsx` with a hard-coded `direction="rtl"`, ignoring that `useDirection()`/i18n is already the authority and that direction must be _reactive_ to the language toggle (topbar ع), not static.

**How to avoid:**
Bridge, don't duplicate. Make `DesignProvider.tsx` (or the existing direction owner) the single source: derive one `dir` value from `i18n.language`, set it on `<html dir=…>` **and** feed the _same_ value into Radix `DirectionProvider direction={dir}`. Do not hard-code `direction="rtl"` — the app is bilingual and switches at runtime under `localStorage id.locale`. Add a smoke assertion: toggle to EN, confirm `document.dir==='ltr'` AND a mounted Radix Popover reports LTR in the same frame.

**Warning signs:**
A Popover/Tooltip/Dropdown whose arrow/offset sits on the wrong side while the page body is correct; content that looks correct in AR but the _menu_ opens from the wrong edge; anything that flips correctly once but not after a language toggle.

**Phase to address:** RTL infra (DirectionProvider bridge into DesignProvider) — this is the phase's central risk.

---

### Pitfall 2: `shadcn migrate rtl` run twice → duplicated `rtl:*` / `rtl:translate-x-*` classes

**What goes wrong:**
The upstream `migrate rtl` transform is **not idempotent** (shadcn-ui/ui #9891). A second run appends duplicate logical/`rtl:` variants — e.g. `rtl:translate-x-*` stacked twice, or `space-x-4 rtl:space-x-reverse rtl:space-x-reverse`. Duplicate `rtl:` utilities produce non-deterministic cascade wins and subtle mis-offsets that are painful to trace because the class list _looks_ plausible.

**Why it happens:**
The migration touches `components/ui/*` files that are also under active edit during the token re-skin. A developer re-runs `migrate rtl` "to be safe" after adding a new shadcn component, re-transforming already-logical files. Because the app _already_ uses logical properties everywhere (zero physical CSS per v2.0 Phase 4), some files are already logical and the transform's "already migrated?" detection is unreliable.

**How to avoid:**
Run `migrate rtl` **exactly once**, on a dedicated commit, against a clean `components/ui` tree, then commit the diff immediately and never re-run it. For components added _after_ the migration, install with `rtl: true` in `components.json` (install-time transform) instead of re-running the bulk migrate. Add a lint/grep guard in CI that fails if any `rtl:` utility appears twice in one `className` string.

**Warning signs:**
`grep -rE 'rtl:[a-z-]+ .*rtl:' frontend/src/components/ui` returns lines with a repeated utility; git diff on a re-run shows growth in already-migrated files.

**Phase to address:** RTL infra.

---

### Pitfall 3: `tw-animate-css` logical slide utilities silently broken in RTL (shadcn's own flagged bug)

**What goes wrong:**
shadcn's RTL docs explicitly flag that with `tw-animate-css` the **logical slide utilities do not work as expected** — `slide-in-from-start`/`slide-in-from-end` don't respect direction inside portalled content. Popovers, Tooltips, Dropdowns, Sheets, and the 720px dossier drawer will slide in from the physically wrong edge in Arabic even after a correct `migrate rtl`. This looks like the migration "didn't work" and sends people down a false-trail chasing token/class bugs.

**Why it happens:**
Portal content mounts outside the `dir` context, so the logical slide direction resolves against the document default, not the trigger's direction. It's a library-level gap, not a class mistake — so no amount of class fixing helps.

**How to avoid:**
Apply the documented workaround: pass `dir="rtl"` (reactive to language) directly to every portal element — Popover, Tooltip, Dropdown, Sheet, Dialog content, and the dossier drawer — not just to the page root. Audit the existing v6.0 drawer's "RTL slide flip" (DRAWER-03) and calendar/kanban pill animations against this; they may already hand-roll the correct behavior and _conflict_ with shadcn's logical slide once migrated. Note the project's own MEMORY fact: Tailwind v4 `translate-x/y` is a standalone `translate` prop that `transform:none` won't clear — inline DialogContent needs `translate:'none'`. Add one EN+AR animation smoke per portal type.

**Warning signs:**
A menu/tooltip/drawer that opens from the correct edge in EN but the wrong edge in AR; animation direction correct on non-portalled elements but wrong on portalled ones.

**Phase to address:** RTL infra (portal `dir` propagation), re-verified in Aceternity removal (the 5 rebuilt form components use Radix/HeroUI portals).

---

### Pitfall 4: Wholesale token swap with no per-route EN+AR visual baseline → silent regressions across 150+ routes

**What goes wrong:**
Replacing the entire IntelDossier OKLCH token set with Linear-derived tokens changes every surface at once. Without a locked visual baseline, contrast failures, broken status-tag/form-error palettes (explicitly called out as gap-fill work), and RTL-specific spacing drift ship undetected across ~150 route files. The app already has WCAG AA bidirectional requirements and axe gates — a token swap can quietly drop a color pair below AA in _one_ direction/mode combination (dark-AR is the usual casualty) while the other three pass.

**Why it happens:**
The token file is one seam; the blast radius is the whole app. Teams verify a handful of "representative" pages, but Linear's dark-canonical palette interacts differently with RTL Tajawal/Inter cascades than the old Bureau light default. Four axes (dark/light × LTR/RTL) multiply the surface.

**How to avoid:**
Snapshot **every route in EN and AR, in both dark and light**, _before_ touching `tokens/directions.ts` — reuse the existing Playwright visual-baseline harness (v6.0 Phase 46 regenerated EN/AR list/drawer/widget baselines; extend it to full route coverage). Gate the token PR on that baseline replay. Run axe-core across all four axis combinations, not just default Bureau. Treat the status-tag and form-error palette gap-fill as first-class token work with its own contrast check, not an afterthought.

**Warning signs:**
Visual-baseline job "passes" because baselines were regenerated _after_ the token change (baseline laundering); axe run only covers one mode/direction; only EN screenshots exist.

**Phase to address:** Tokens (Linear migration) — this is the phase's defining risk.

---

### Pitfall 5: `bootstrap.js` FOUC script drifts from `tokens/directions.ts` during token churn

**What goes wrong:**
`frontend/public/bootstrap.js` paints first-frame tokens synchronously and its palette/font literals **must byte-match** `tokens/directions.ts` (a locked v6.0 invariant). During heavy Linear token churn, `directions.ts` gets updated repeatedly while `bootstrap.js` lags. Result: a first-paint flash of _old_ colors/fonts before React hydrates the new ones — a visible FOUC that's intermittent (only on cold loads / slow networks) and therefore easy to miss in dev.

**Why it happens:**
The two files are edited in different phases by different concerns (token author vs. FOUC maintainer). `bootstrap.js` is plain JS in `public/` — outside TypeScript's type graph, so a mismatch never fails `type-check` or `lint`. Nothing forces them to stay in lockstep except memory.

**How to avoid:**
Add a CI byte-match assertion: extract the palette/font literals from both files and fail the build if they diverge (a small node script comparing the Bureau→Linear literal set). Change both files in the **same commit** every time a first-paint token changes. Verify FOUC on a throttled cold load (DevTools "Slow 3G" + disable cache) in dark-AR specifically, since that's the combination most visible against a light default flash. Also confirm the switch from Tajawal-default to Inter/JetBrains Mono is reflected in _both_ files' `--font-*` literals.

**Warning signs:**
A color/font flash on hard reload that disappears after hydration; the byte-match CI check absent; `bootstrap.js` last-modified far behind `directions.ts`.

**Phase to address:** Tokens (Linear migration) — add the CI guard at phase start, before token literals move.

---

### Pitfall 6: HeroUI v2→v3 attempted mid-token-churn or with v2+v3 coexisting

**What goes wrong:**
HeroUI's own docs state **v2 and v3 cannot coexist without special setup** and that during full migration "the project will be broken." There is **no first-party codemod/CLI** — only an MCP server and per-component guides. v3 is beta (breaking changes expected). If v3 migration runs _before_ Linear tokens are stable on v2, you're debugging two moving targets at once: is the visual break a token issue or a v3 API/design-overhaul issue? v3 also completely overhauls its own design system (new color tokens/shadows), which will fight the Linear `@theme` bridge unless the semantic mapping (accent→primary, established in v6.0) is re-derived for v3.

**Why it happens:**
Enthusiasm to "do it all at once." Also, the project already has _partial_ v3 adoption (Kanban migrated in v6.3, drop-in re-export pattern) so teams assume the rest is mechanical — but the remaining components hit the harder breaking changes: compound `.Root` API, `HeroUIProvider` removal, `useDisclosure`→`useOverlayState`, `useSwitch`/`useInput` hooks removed, collection items now `id`+`textValue`, Framer Motion removed, and renamed/removed components (Autocomplete→ComboBox, DateInput→DateField; Navbar/Snippet/User/Spacer/Image/Code/Ripple removed).

**How to avoid:**
Sequence HeroUI v3 **last**, only after Linear tokens are stable on the current HeroUI baseline (as the milestone plan already states). Migrate on a feature branch, convert _all_ remaining HeroUI component code before flipping the dependency — never ship a half-flipped tree. Inventory every removed/renamed component (Navbar, Snippet, User, Spacer, Image, Code, Autocomplete, DateInput) against the codebase _first_ and plan replacements; those aren't renames, they're deletions needing new implementations. Re-derive the accent→primary semantic token bridge for v3's overhauled token system. Use the HeroUI Migration MCP server for per-component API deltas rather than guessing.

**Warning signs:**
A commit where both `@heroui/*` v2 and v3 packages resolve; visual breaks appearing simultaneously with token changes; `useDisclosure`/`useSwitch`/`useInput` imports still present; references to removed components (Navbar/Snippet/User).

**Phase to address:** HeroUI v3 (sequenced after Tokens).

---

### Pitfall 7: Removing Aceternity from form components breaks validation/a11y wiring, not just visuals

**What goes wrong:**
The 5 Aceternity-based form components carry more than animation: focus management, ARIA attributes, label association, and the React Hook Form + Zod validation wiring often thread through the animated wrapper (error message reveal, aria-invalid, aria-describedby on the animated input). Ripping out Aceternity and dropping in a HeroUI v3/Radix primitive without re-threading these breaks form error announcement (screen readers stop reading errors), keyboard focus order, and sometimes the RHF register/ref chain — while the form _looks_ fine and still submits, so it passes casual QA.

**Why it happens:**
The visual layer is the obvious part; the invisible a11y/validation contract is easy to overlook. Also this app has a _history_ of Aceternity being purged (v6.2) then partially reintroduced — so the current 5 components may already be inconsistent, and a blind swap propagates that inconsistency. ESLint already bans Aceternity via inverted `no-restricted-imports`, so the removal is enforced, but enforcement doesn't guarantee behavioral parity.

**How to avoid:**
For each of the 5 components, first capture the _behavioral contract_: which ARIA attributes, which RHF `register`/`Controller` wiring, which error-reveal path, focus-trap/focus-order, and RTL error-message placement. Rebuild on HeroUI v3/Radix preserving that contract, then verify with axe-core AND keyboard traversal AND a screen-reader error-announcement check in EN+AR — not a visual diff. Write/extend a form-error-announcement test per component (assert `role="alert"` / `aria-live` fires on invalid submit) before touching the component, following the project's established `role="alert"` error-contract pattern.

**Warning signs:**
Form submits and looks right but invalid fields don't announce; `aria-invalid`/`aria-describedby` missing after the swap; focus jumps or skips on Tab; error text renders on the wrong side in AR.

**Phase to address:** Aceternity removal (last phase, on HeroUI v3).

---

### Pitfall 8: Audit mislabels domain-specific bespoke components as "replace with shadcn primitive"

**What goes wrong:**
The audit phase maps every hand-rolled surface to replace-with-shadcn / keep-custom / replace-with-block. The trap: classifying a component as a generic primitive when it actually encodes domain logic (clearance-aware rendering, RTL chevron/flag logic, DossierGlyph flag system, GlobeLoader, clearance-filtered lists). Replacing these with a stock shadcn primitive silently drops the domain behavior — e.g. a clearance filter, an RTL-correct chevron, or the `sensitivity_level <= clearance` visual gating from v7.0.

**Why it happens:**
Components look generic on the surface (a card, a list row, a badge) but carry invisible domain contracts. Auditors optimize for "reduce bespoke count" and over-classify toward shadcn.

**How to avoid:**
The audit's default for any component touching clearance, RTL directionality, flags/glyphs, or dossier-type logic is **keep-custom (or shadcn-block-with-domain-wrapper)**, not primitive-replace. Require each "replace with primitive" classification to explicitly list the behaviors the primitive must preserve; if the list is non-trivial, downgrade to keep-custom. Cross-check against the CLAUDE.md primitive cascade (HeroUI v3 → Radix → custom) which already says primitives are for _interactive behavior only_, with all visual styling from tokens.

**Warning signs:**
Audit output has a high "replace with primitive" ratio with empty "behaviors to preserve" columns; clearance/RTL/flag components marked primitive.

**Phase to address:** UI component audit (first phase) — sets the blast radius for every later phase.

---

## Technical Debt Patterns

| Shortcut                                                                  | Immediate Benefit           | Long-term Cost                                                | When Acceptable                                                        |
| ------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Hard-code `DirectionProvider direction="rtl"` instead of bridging to i18n | RTL works immediately in AR | EN toggle breaks all Radix portals; a runtime bilingual bug   | Never — app is bilingual with a live toggle                            |
| Re-run `migrate rtl` "to be safe" after adding a component                | Feels thorough              | Duplicated `rtl:` classes (#9891), non-deterministic cascade  | Never — install new components with `rtl:true` instead                 |
| Regenerate visual baselines _after_ the token swap                        | Green CI, no red diffs      | Baseline laundering hides every regression                    | Never for the token phase; only after human review of intended changes |
| Skip the `bootstrap.js`/`directions.ts` byte-match CI check               | One less CI job to write    | Intermittent cold-load FOUC that only appears in prod dark-AR | Never — the invariant is load-bearing per v6.0                         |
| Migrate HeroUI v3 in parallel with tokens                                 | Fewer phases                | Two moving targets; can't attribute breaks                    | Never — sequence v3 strictly after tokens stabilize                    |
| Blind visual-only swap of Aceternity form components                      | Fast removal                | Broken a11y/validation contract that passes visual QA         | Never for form components; maybe for pure-decoration surfaces          |

## Integration Gotchas

| Integration                                                              | Common Mistake                                 | Correct Approach                                                                                                 |
| ------------------------------------------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Radix `DirectionProvider` ↔ existing `useDirection()`/i18n               | Two direction owners, static `direction="rtl"` | Single source: derive `dir` from `i18n.language`, feed both `<html dir>` and `DirectionProvider direction={dir}` |
| `tw-animate-css` logical slides ↔ Radix portals                          | Assume `migrate rtl` fixes portal animations   | Pass reactive `dir` to every portal (Popover/Tooltip/Dropdown/Sheet/Dialog/drawer)                               |
| `shadcn migrate rtl` ↔ already-logical codebase (v2.0 zero-physical-CSS) | Re-run bulk migrate over logical files         | Run once, commit, then `rtl:true` install for new components only                                                |
| Linear `@theme` tokens ↔ HeroUI v3 overhauled token system               | Reuse v6.0 accent→primary mapping unchanged    | Re-derive the semantic bridge for v3's new color/shadow tokens                                                   |
| `bootstrap.js` (plain JS, `public/`) ↔ `tokens/directions.ts` (TS)       | Rely on type-check to catch drift (it can't)   | Dedicated CI byte-match script comparing literal sets                                                            |
| HeroUI v2 packages ↔ v3 packages                                         | Let both resolve during incremental migration  | Convert all component code on a branch, flip dependency once; no coexistence                                     |
| shadcn auto-migrate ↔ Calendar/Pagination/Sidebar                        | Assume bulk migrate covers them                | These 3 require manual RTL patching per their individual guides                                                  |

## Performance Traps

| Trap                                                                  | Symptoms                                                    | Prevention                                                                                                           | When It Breaks                     |
| --------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Font swap (Tajawal→Inter/JetBrains Mono) not self-hosted/preloaded    | CLS + FOUT on first paint; bundle regresses past size-limit | Self-host via @fontsource (existing v6.0 pattern), preload critical weight only, mirror `--font-*` in `bootstrap.js` | First cold load / slow network     |
| HeroUI v3 + Radix + shadcn primitives all bundled without chunk audit | `heroui-vendor` chunk blows the `===1` size-limit assertion | Re-audit manualChunks after each library swap; keep the sub-vendor decomposition (heroui/radix/dnd) budgets green    | At the PR-blocking size-limit gate |
| Duplicate `rtl:` utilities from double-migrate                        | Larger CSS, cascade churn                                   | Idempotency guard (Pitfall 2)                                                                                        | Compounds silently per re-run      |

## Security Mistakes

| Mistake                                                              | Risk                                                                                           | Prevention                                                                                 |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Audit swaps a clearance-aware list/card for a stock shadcn primitive | Drops `sensitivity_level <= clearance` visual gating from v7.0; over-clearance content renders | Default clearance-touching components to keep-custom; list preserved behaviors (Pitfall 8) |
| Aceternity form rebuild drops server-echoed validation display       | Client shows success while server rejected; user acts on stale state                           | Preserve the RHF+Zod error path and server-error surface, not just client validation       |
| Token/`bootstrap.js` change ships raw hex bypassing token gate       | Reintroduces the banned raw-hex/`text-blue-500` literals the ESLint D-05 gate cleared to 0     | Keep the Design Token Check CI context green; all Linear colors as `var(--*)` tokens       |

## UX Pitfalls

| Pitfall                                                               | User Impact                                                                                   | Better Approach                                                                                                                  |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Directional icons not given `rtl:rotate-180` after migrate            | Chevrons/arrows point the wrong way in AR (drill-in looks like go-back)                       | Verify `migrate rtl` applied `rtl:rotate-180` to supported icons; manually add for custom icons; cross-check `docs/rtl-icons.md` |
| Calendar/Pagination/Sidebar shipped as auto-migrated                  | These 3 require **manual** RTL patching per shadcn docs; auto-migrate leaves them wrong in AR | Hand-patch Calendar, Pagination, Sidebar against their individual RTL guides; don't trust the bulk migrate for them              |
| Dark-canonical Linear palette applied without light-mode parity check | Light mode (or one direction) becomes an afterthought with worse contrast                     | Verify all four axes (dark/light × LTR/RTL) reach WCAG AA before merge                                                           |
| Status-tag / form-error palette gap left to default                   | Semantic colors read wrong or fail contrast in one mode                                       | Treat gap-fill palette as first-class token work with its own contrast pass                                                      |

## "Looks Done But Isn't" Checklist

- [ ] **RTL infra:** Language toggle works — verify EN toggle flips `document.dir` AND every Radix portal in the _same_ frame (not just page load in AR)
- [ ] **RTL infra:** Portal animations — verify Popover/Tooltip/Dropdown/Sheet/drawer slide from the correct edge in **AR**, not just EN (tw-animate-css bug, Pitfall 3)
- [ ] **RTL infra:** Calendar, Pagination, Sidebar manually patched — auto-migrate does NOT cover them
- [ ] **RTL infra:** No duplicate `rtl:*` classes — grep guard passes after migrate
- [ ] **Tokens:** Full-route EN+AR baselines captured _before_ the swap, not regenerated after
- [ ] **Tokens:** axe-core AA passes on all four axes (dark/light × LTR/RTL), not just Bureau/EN
- [ ] **Tokens:** `bootstrap.js` byte-matches `directions.ts` (font literals too) — CI check present and green
- [ ] **Tokens:** No cold-load FOUC on throttled dark-AR reload
- [ ] **HeroUI v3:** Removed components (Navbar/Snippet/User/Spacer/Image/Code/Autocomplete/DateInput) inventoried and re-implemented, not just renamed
- [ ] **HeroUI v3:** No v2+v3 coexistence in the shipped tree
- [ ] **Aceternity removal:** Each rebuilt form component announces errors (`role="alert"`/`aria-live`) on invalid submit in EN+AR
- [ ] **Aceternity removal:** Keyboard focus order and `aria-invalid`/`aria-describedby` preserved
- [ ] **Audit:** Every "replace with primitive" row lists the behaviors the primitive must preserve

## Recovery Strategies

| Pitfall                                             | Recovery Cost | Recovery Steps                                                                                                                                                    |
| --------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Double-run `migrate rtl` duplicated classes         | LOW           | `git revert` the second run; if committed together, grep-and-dedupe `rtl:` utilities per file                                                                     |
| Dual-RTL double-flip in production                  | MEDIUM        | Consolidate to single direction source in DesignProvider; add toggle smoke test; re-verify all portals                                                            |
| Token swap shipped visual regressions (no baseline) | HIGH          | Retro-capture baselines from last-known-good tag; diff current against it; triage per-route; expensive because blast radius is 150+ routes                        |
| `bootstrap.js` drift shipped FOUC                   | LOW           | Sync literals in one commit; add the byte-match CI guard to prevent recurrence                                                                                    |
| HeroUI v3 half-flipped tree                         | HIGH          | Branch is broken by design mid-migration; only recovery is finishing all component conversions before re-flipping the dependency — do not attempt to ship partial |
| Aceternity swap broke a11y silently                 | MEDIUM        | Re-derive behavioral contract from git history of the pre-swap component; re-thread ARIA/RHF; add the announcement test that should have gated it                 |

## Pitfall-to-Phase Mapping

| Pitfall                                           | Prevention Phase   | Verification                                                                           |
| ------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------- |
| P8: Over-classify domain components as primitives | UI component audit | Each primitive-replace row lists preserved behaviors; clearance/RTL/flag → keep-custom |
| P1: Dual RTL double-flip                          | RTL infra          | EN↔AR toggle flips page + all portals in one frame                                     |
| P2: Double `migrate rtl`                          | RTL infra          | One-commit migrate; duplicate-`rtl:` grep guard green                                  |
| P3: tw-animate-css portal slides                  | RTL infra          | AR portal-animation smoke per portal type                                              |
| P4: Token swap w/o baseline                       | Tokens (Linear)    | Full-route EN+AR+dark/light baseline replay + 4-axis axe                               |
| P5: bootstrap.js drift                            | Tokens (Linear)    | CI byte-match guard; throttled dark-AR cold-load                                       |
| P6: HeroUI v3 mid-churn / coexistence             | HeroUI v3          | Sequenced after stable tokens; single-version tree; removed-component inventory        |
| P7: Aceternity a11y/validation break              | Aceternity removal | Per-component error-announcement + keyboard + EN/AR test                               |

## Sources

- [RTL - shadcn/ui](https://ui.shadcn.com/docs/rtl) — tw-animate-css logical-slide bug + `dir` portal workaround; Calendar/Pagination/Sidebar manual migration; `rtl:rotate-180` for icons; base-nova/radix-nova style requirement (HIGH)
- [January 2026 RTL Support changelog - shadcn/ui](https://ui.shadcn.com/docs/changelog/2026-01-rtl) — `migrate rtl` class transforms (slide-in-from-left→start, ml→ms, text-left→text-start) (HIGH)
- [Vite RTL setup - shadcn/ui](https://ui.shadcn.com/docs/rtl/vite) — DirectionProvider placement in main.tsx, components.json rtl:true, html dir/lang (HIGH)
- [shadcn-ui/ui #9891 — migrate rtl not idempotent / duplicated rtl: classes](https://github.com/shadcn-ui/ui) — run-once guidance (MEDIUM — issue referenced via WebSearch)
- [HeroUI v3 Migration](https://heroui.com/docs/react/migration) — no first-party codemod; v2/v3 cannot coexist; project broken during full migration; provider removal; removed/renamed components (HIGH)
- [Introducing HeroUI v3 / v3-0-0-beta.1 changelog](https://v3.heroui.com/docs/changelog/v3-0-0-beta-1) — beta status, compound `.Root`, hooks removed, collection id/textValue, design-system overhaul (MEDIUM — beta, subject to change)
- Project docs: `.planning/PROJECT.md`, `CLAUDE.md` (FOUC byte-mirror invariant, primitive cascade, RTL rules), MEMORY.md (dual-RTL history, i18n static-bundle, Tailwind v4 translate gotcha, Aceternity purge/reintro) (HIGH)

---

_Pitfalls research for: v8.0 Linear Design System Migration (shadcn RTL infra + Linear tokens + HeroUI v3 + Aceternity removal, on an existing Arabic-first RTL app)_
_Researched: 2026-07-01_
</content>
