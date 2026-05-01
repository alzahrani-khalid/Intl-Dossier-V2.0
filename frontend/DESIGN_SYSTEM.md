# IntelDossier Design System

The visual source of truth lives at
`frontend/design-system/inteldossier_handoff_design/`.

See `CLAUDE.md` → "Visual Design Source of Truth" for required reading.

This frontend implements that prototype. Tokens are in
`frontend/design-system/inteldossier_handoff_design/colors_and_type.css`
(foundational) and `handoff/app.css` (production). The runtime port lives at
`frontend/src/design-system/` (DesignProvider, tokens, hooks).

Tailwind v4 utilities (`bg-bg`, `bg-surface`, `text-ink`, `border-line`,
`bg-accent`, etc.) are mapped to those tokens via `@theme` in
`frontend/src/index.css`. The slim `tailwind.config.ts` no longer defines
colors — `@theme` is the single source of truth.

The FOUC bootstrap that paints first-frame tokens is at
`frontend/public/bootstrap.js`; its palette and font literals must
byte-match `frontend/src/design-system/tokens/directions.ts`.

**Do not add new design documentation here.** Update the prototype, then
re-port the tokens via `tokens/directions.ts` and `bootstrap.js`.

Legacy design docs (Kibo UI migration, GASTAT-green vocabulary,
mobile-first examples, landing-page redesigns) are archived under
`.archive/` and are not load-bearing.
