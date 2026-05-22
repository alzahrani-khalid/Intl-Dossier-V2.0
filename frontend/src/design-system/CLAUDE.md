# frontend/src/design-system — runtime port of the IntelDossier prototype

This directory ports `frontend/design-system/inteldossier_handoff_design/src/themes.jsx` into the production runtime. The prototype is the visual source of truth; this is the executable mirror.

## Conventions

- **DesignProvider owns the cascade.** `DesignProvider.tsx` reads density/direction/theme/hue, builds the token set via `tokens/buildTokens.ts`, applies via `tokens/applyTokens.ts`. Never set CSS custom properties from a component.
- **`tokens/directions.ts` and `frontend/public/bootstrap.js` must byte-match on palette + font literals.** The FOUC bootstrap paints the first frame before React mounts; any drift causes a visible flash. There is no automated test for this — diff by hand on any change.
- **Direction = Bureau** by default. Chancery, Situation, Ministerial are present in the codebase but ignored unless a task explicitly references them.
- **Hooks (`hooks/`) are thin wrappers** over context — no business logic, just `useDesign()`-style accessors.

## Tests

```bash
pnpm --filter frontend test src/design-system
```

## Gotchas

- **Tailwind v4 `@theme` mapping is the bridge** — utilities like `bg-bg`, `text-ink`, `border-line` exist only because of the `@theme` block. If you add a token, add the matching `@theme` entry.
- **Touching this directory triggers the full frontend suite** in the `scoped-tests` skill — every component depends on tokens.
- **Don't touch `frontend/design-system/inteldossier_handoff_design/`** from here. That's the prototype (read-only source of truth). This port reads it conceptually, not as a runtime dependency.
