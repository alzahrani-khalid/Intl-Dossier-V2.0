---
status: issues_found
phase: 77-linear-token-system
scope: git diff 299c290ff..HEAD -- frontend/ scripts/ tools/ .github/
reviewed: 2026-07-03
advisory: true
counts:
  critical: 0
  high: 1
  medium: 2
  low: 4
---

# Phase 77 (linear-token-system) — Code Review (ADVISORY)

Reviewed the source diff from the phase base `299c290ff` to `HEAD` (`8c965fcf7`),
skipping `.planning/**` and `*-SUMMARY.md`. Focus areas per the brief: the
byte-coupled token engine (`tokens/{directions,buildTokens,types}.ts` +
`public/bootstrap.js`), `DesignProvider.tsx` coercion, `check-bootstrap-parity.mjs`,
the Linear CSS recipes, the `components/ui/*` carve-out migrations, the i18n prune,
the ClassificationBar collapse, and `fonts.ts`.

## Verification performed (what is CONFIRMED good)

The load-bearing parts of the phase are correct and well-guarded:

- **Coercion / no-token-loss on first paint — SOLID.** Both layers force any
  non-`'linear'`/absent `id.dir` to `'linear'`. `bootstrap.js:19-23` coerces with a
  try-guarded one-time write-back; `DesignProvider` hard-codes `direction` to
  `'linear'` (`DesignProvider.tsx:169`) and rewrites the stored key in a
  post-mount `useEffect` (`:210-213`), never in a lazy initializer. Every
  `useState` initializer (`:174-194`) is read-only; the `'spacious'→'dense'`
  rewrite, the `id.dir` coercion, the `id.hue` removal, and the legacy-key wipe
  are all in idempotent `useEffect`s → StrictMode double-invoke safe. Default mode
  is `'dark'` in both layers, with explicit `'light'` preserved. No path loses
  tokens.
- **Three-copy byte-match — ENFORCED.** Ran `scripts/check-bootstrap-parity.mjs`:
  passes (6 linear combos × 56 vars + 5 coercion probes + 51 `:root` checks). The
  bad fixture (`tools/bootstrap-fixtures/bad-bootstrap.js`) exits 1 as intended;
  CI wires both the positive check and the `! …` negative assertion
  (`ci.yml` new steps). The vm sandbox stubs the exact surface `bootstrap.js`
  touches and fails loudly on `painted.size === 0`, closing the "swallowed
  ReferenceError → zero vars" hole.
- **Orphan sweep — CLEAN.** No dangling code references to `useHue`,
  `directionDefaults`, `initialHue`, `setHue`, `DIRECTION_DEFAULTS`, or `id.hue`
  outside the intended `safeRemoveItem('id.hue')` cleanup. Removed switcher UI in
  `TweaksDrawer.tsx` / `AppearanceSettingsSection.tsx` took its imports/handlers
  with it (no unused `Label`/`RadioGroupItem`). `useDesignDirection` is retained
  and still has live consumers (`design-compliance-provider.tsx`, `AppShell.tsx`).
- **i18n prune — SYMMETRIC & SCOPED.** EN and AR each dropped only the
  `direction.*` and `hue.*` keys in `common.json` + `settings.json`. No unrelated
  keys removed. Tajawal RTL cascade in `index.css:479-551` is untouched.
- **Carve-out migrations — FAITHFUL.** `ui/{file-upload,sidebar-collapsible,…}`
  replaced hardcoded Tailwind color literals (`text-neutral-700`, `bg-white`,
  `border-sky-400`, `bg-gray-100`, `dark:bg-neutral-900`) with token utilities
  (`text-ink`, `bg-surface`, `border-accent`, `bg-surface-3`, `bg-bg`). No raw hex
  introduced; even/odd structure preserved.
- **Phase's own guards green:** `contrast.test.ts` + `buildTokens.test.ts` +
  `coercion.test.ts` = 86 passing. `fonts.ts` is imported before `index.css` in
  `main.tsx` (ordering claim holds).

---

## HIGH

### H1 — Dark-mode WCAG AA failure: `--accent-ink` on `--accent-soft` = 2.03:1

**Files:** `frontend/src/design-system/tokens/directions.ts:47` (dark
`accent.ink #98a6ea`) + `:46`-area (`accent.soft #5e69d1`); consumed as a real
foreground/background pairing in:

- `frontend/src/styles/list-pages.css:308-309` — `.dir-linear .sb-item.active`
  (**active sidebar navigation** — primary chrome)
- `frontend/src/styles/list-pages.css:433-434` — `.btn-secondary`
- `frontend/src/styles/list-pages.css:521-522` — `.chip-accent`
- `frontend/src/index.css:566` — `.btn-secondary` (`@apply bg-secondary text-secondary-foreground`)
- `frontend/src/index.css:775-776` — `.settings-nav.active`
- `frontend/src/index.css:118-119` — `@theme` maps `--color-secondary: var(--accent-soft)`
  and `--color-secondary-foreground: var(--accent-ink)`, so **every** `bg-secondary
text-secondary-foreground` call site inherits the failure (e.g.
  `BotIntegrationsSettings.tsx:250-251`, `dossier-overview/.../DocumentsSection.tsx:71`,
  `CalendarEventsSection.tsx:62`, `InteractionTimeline.tsx:76`).

**Why:** In the now-default **dark** mode, `--accent-ink` (`#98a6ea`) on
`--accent-soft` (`#5e69d1`) is **2.03:1** — below AA-normal (4.5) and even below
AA-large (3:1). The mismatch is structural: the dark `accent.soft` is the verbatim
Linear _primary-focus_ value (a saturated mid-tone meant as a focus/ring color),
but the app uses it as a **text background**. In light mode the same pairing is
`#4d57b7` on the pale wash `#e8edff` = **5.35:1** (fine) — so the defect is
dark-only, which is exactly the mode Phase 77 promoted to default.

`contrast.test.ts` stays green because it gates `accent.fg`-on-`accent.base` and
the semantic/status softs but **never** tests `accent.ink` against `accent.soft`
(see M1). This is a genuine, reproducible a11y regression on interactive text
(active nav, secondary buttons), not a borderline case.

**Suggested fix:** give dark `accent.soft` a pale-wash value (mirroring light's
role) so `accent.ink` clears AA on it, OR pick a lighter dark `accent.ink`; then
add the pairing to `contrast.test.ts` so it can't regress.

---

## MEDIUM

### M1 — `contrast.test.ts` omits derived text-role tokens it claims are AA

**File:** `frontend/tests/unit/design-system/contrast.test.ts` (whole suite).

The TOKEN-03 AA guard is the "automated successor to the hand-audited WCAG
comments," but several **derived text-role** tokens whose `directions.ts` comments
assert AA are not gated:

- `accent.ink` on `surface` **and** on `accent.soft` — comment says "AA on
  surface-1"/"AA on surface" (`directions.ts:47,97`). The `accent.soft` pairing is
  the exact gap that let **H1** through (dark = 2.03:1).
- `sidebarInk` on `sidebar` — comment claims "13.0:1 on sidebar" (`directions.ts:36`).
- `sla.{ok,risk,bad}` fg on `surface` and their own softs — used as
  indicator/text colors.

The latter three currently **pass** (I measured sidebarInk 13.0/16.7:1; sla all
≥4.73:1), so this is coverage, not a live bug — but because they're ungated, a
future palette edit could silently drop them below AA without turning the suite
red. Add these to the `it.each` matrices.

### M2 — `--accent` used as text on `--surface` is below AA-normal (4.05:1 dark / 4.34:1 light)

**File:** `frontend/src/design-system/tokens/directions.ts` (`accent.base #5e6ad2`,
same literal in both modes); exposed as `text-accent` / `text-primary` via the
`@theme` remap (`index.css:61,101`).

`--accent` (`#5e6ad2`) on `--surface` is **4.05:1** (dark) / **4.34:1** (light) —
both under the 4.5 AA-normal threshold (both clear AA-large 3:1). Where the brand
accent is used as **fill/ring/underline** (`.btn-primary` bg, `--color-ring`,
`decoration-primary`, `.tab.active` underline) this is fine. Where it's used as
**normal-size text** on a surface (`text-accent`/`text-primary` utilities appear
widely), it is marginally sub-AA. `contrast.test.ts` only checks `accent.fg` on
`accent.base`, not `accent.base` on `surface`. Recommend auditing `text-accent`/
`text-primary` usages on plain surfaces and either bumping the token for the
text role or routing text through `--accent-ink` (which does clear AA on surface).

---

## LOW

### L1 — `@theme --shadow-card` (real shadow) diverges from runtime `var(--shadow-card): none`; comment is inaccurate

**File:** `frontend/src/index.css:122-128`.

The `@theme` block sets `--shadow-card: 0 1px 2px …, 0 4px 12px …` (a visible drop
shadow) and comments "Shadows are palette-invariant … stays in sync with the D-16
runtime." But the runtime token is `none` — `buildTokens.ts:101` (`'--shadow-card': 'none'`,
"Linear has no card shadows") and the `:root` fallback `index.css:212`. So the
Tailwind `shadow-card` **utility** would paint a drop shadow while `box-shadow:
var(--shadow-card)` paints nothing, contradicting the Linear flat-card rule. No
live consumers today (`shadow-card` is unused as a className, `var(--shadow-card)`
is unused in CSS), so this is latent — but the "stays in sync" comment is now
false and the utility is a trap. Fix: `@theme { --shadow-card: none; }` (or drop
the utility).

### L2 — Dark-canonical default drifts in two fallback paths

- `frontend/src/components/theme-error-boundary/ThemeErrorBoundary.tsx:42` —
  internal default `fallbackColorMode = 'light'`. `App.tsx` passes `"dark"`
  explicitly so it never bites today, but the default contradicts the Phase-77
  dark-canonical decision; if the boundary is ever mounted without the prop it
  paints a light error fallback.
- `frontend/src/services/preference-sync.ts:75` — `color_mode: preferences.colorMode || 'light'`
  (DB upsert default). Same latent light-default drift (not a first-paint path).

Low impact; align both to `'dark'` for consistency with the engine default.

### L3 — Stale comments referencing retired palette / directions

- `frontend/src/styles/list-pages.css:791` — "raw `--accent #bf5542` is 4.23:1 on
  `--surface`". `#bf5542` is the **retired Bureau terracotta** accent, not Linear
  `#5e6ad2`; both the value and the ratio are stale (real Linear `--accent` on
  surface is 4.05/4.34 — see M2). Misleading rationale.
- `frontend/src/design-system/DesignProvider.tsx:14` — docblock example
  `[data-direction="situation"]` (retired direction).
- `frontend/src/components/relationships/AnalyticQueryPicker.tsx:9` — "(Bureau)".

Comment-only; no runtime impact. Refresh to Linear.

### L4 — Token-engine hygiene notes (non-blocking)

- `--field-radius` is emitted by `buildTokens.ts:97` (`calc(radius.base * 1.5)`)
  but has **zero consumers** and no `:root`/bootstrap fallback — dead output.
- The shadow triplet (`--shadow-sm`/`--shadow`/`--shadow-lg`, painted only by
  `bootstrap.js:108-110`) and `--shadow-card`/`--shadow-drawer` (painted only by
  `buildTokens.ts:99-101`) are disjoint sets across bootstrap / buildTokens /
  `:root` / `@theme`, and are **not** covered by `check-bootstrap-parity.mjs`.
  They are consistent today, but could drift silently since the guard's scope is
  palette/font/density only. Consider either extending the guard or consolidating
  the shadow definitions to a single source.

---

## Security

No issues. localStorage values only index static tables (`P.linear[m]`, `D[dn]`)
with safe fallbacks and are otherwise coerced to a fixed enum before use — no
injection surface. No secrets. `check-bootstrap-parity.mjs` reads its optional
`process.argv[2]` fixture path via `resolve(repoRoot, …)` (used only by the CI
step against a repo-local fixture), spawns no subprocess, and exposes no
`require`/`process`/network into the vm sandbox. `extractRootVars`' non-greedy
`:root { … }` regex could truncate on a `}` inside a `:root` comment, but that
would surface as loud parity **failures** (missing vars), not a silent pass — and
the current `:root` block contains no braces.

---

REVIEW 77 DONE — status: issues_found, C:0 H:1 M:2 L:4
