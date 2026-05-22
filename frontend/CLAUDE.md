# frontend — React 19 + TanStack + IntelDossier Design System

Desktop-primary analyst workstation. Default direction: **Bureau**. Target width: 1280–1400px.

## Visual Design Source of Truth (READ BEFORE ANY UI WORK)

The canonical visual design is the **IntelDossier prototype** at:

```
frontend/design-system/inteldossier_handoff_design/
├── README.md             <-- voice, content rules, visual foundations
├── colors_and_type.css   <-- foundational tokens (Bureau light)
├── handoff/app.css       <-- production stylesheet (the prototype)
└── src/
    ├── themes.jsx        <-- token builder (4 directions × theme × density × hue)
    ├── app.css           <-- production stylesheet (full prototype)
    ├── icons.jsx         <-- 38-glyph stroked icon set
    ├── glyph.jsx         <-- DossierGlyph (circular flag system)
    ├── loader.jsx        <-- GlobeSpinner / GlobeLoader
    ├── dashboard.jsx     <-- canonical Card / KPI / list patterns
    ├── pages.jsx         <-- canonical page templates
    └── shell.jsx         <-- topbar, sidebar, layout
```

The runtime port lives at **`frontend/src/design-system/`**
(`DesignProvider.tsx`, `tokens/{directions,densities,buildTokens,applyTokens}.ts`,
hooks). The FOUC bootstrap that paints first-frame tokens is at
`frontend/public/bootstrap.js` — its palette/font literals must byte-match
`tokens/directions.ts`.

**Default direction: Bureau.** Ignore Chancery, Situation, and Ministerial
unless a task explicitly references them.

### Required reading order before building or modifying any UI

1. `frontend/design-system/inteldossier_handoff_design/README.md` — voice,
   content rules, visual foundations
2. `frontend/design-system/inteldossier_handoff_design/colors_and_type.css` —
   token names and exact values
3. The closest matching component in
   `frontend/design-system/inteldossier_handoff_design/src/`

If you cannot identify a closest match, **ask before inventing**.

### Design rules — non-negotiable

- All colors via `var(--*)` tokens or the `@theme`-mapped Tailwind utilities
  (`bg-bg`, `bg-surface`, `text-ink`, `border-line`, `bg-accent`, etc.).
  **No raw hex. No Tailwind color literals** like `text-blue-500`.
- Borders are `1px solid var(--line)`. **No drop-shadows on cards.**
  Shadow is reserved for drawers (`var(--shadow-lg)`) and hovered list rows.
- **No gradient backgrounds.** Surfaces are flat.
- Buttons follow `.btn-primary` / `.btn-ghost` from the prototype's `app.css`.
  Do not introduce new button variants without an explicit ask.
- Row heights use `var(--row-h)` (density-aware). Tables and lists must
  obey it.
- Corner radii come from `--radius-sm / --radius / --radius-lg`. Bureau
  radii are 8/12/16. Do not hard-code px.
- **No emoji in user-visible copy.** Emoji is allowed only as data input
  (e.g. flag codepoints).
- **No marketing voice.** Banned: "Discover", "Easily", "Unleash",
  exclamation marks, "you're in!", first-person plural ("we"). Sentence
  case for titles and buttons; UPPERCASE only for classification ribbons,
  mono labels, and table-column headers.
- Dates: `Tue 28 Apr` (day-first, no comma). Times: `14:30 GST`.
  SLA windows: `T-3` / `T+2` (mono-formatted).

### Definition of Done — UI checklist

Before declaring any UI task complete:

- [ ] All colors resolve to design tokens (no raw hex; no `text-blue-500`)
- [ ] Borders are `1px solid var(--line)`; no card shadows
- [ ] Row heights use `var(--row-h)`
- [ ] Buttons mirror prototype `.btn-primary` / `.btn-ghost`
- [ ] Logical properties for spacing (`ms-*`, `ps-*`, `text-start`)
- [ ] No emoji in copy; no marketing voice
- [ ] Tested at 1024px and 1400px (the actual analyst-workstation widths)
- [ ] RTL: rendered with `dir="rtl"` and verified Tajawal applies

## Responsive Design

IntelDossier is a **desktop-primary analyst workstation**. The default
target is 1280–1400px. Mobile is a secondary surface for read-only
review.

### Breakpoints

| Width     | Treatment                                                  |
| --------- | ---------------------------------------------------------- |
| 1400px+   | Full layout (sidebar + 2:1 dashboard grid + dossier rail)  |
| 1024–1399 | Full layout, max-page-width 1400 enforced                  |
| 768–1023  | Collapse sidebar to icon rail; KPI strip 2×2               |
| 320–767   | Read-only mobile: stacked, no edit forms, no drag-and-drop |

### Rules

- Build for 1280px first, verify at 1024px, then degrade gracefully
  to 768. Below 768 is read-only.
- Touch targets at 44×44 only on `< 768px`. Above that, density tokens
  (`--row-h`) drive sizing.
- Use logical properties (`ms-*`, `ps-*`) so RTL works without re-styling.
- Never hide critical analyst content behind a mobile-toggle. If the
  feature can't fit at 768, omit it on mobile entirely.

## Arabic RTL Support Guidelines (MANDATORY)

### RTL Detection & Implementation

```tsx
import { useTranslation } from 'react-i18next'
const { i18n } = useTranslation()
const isRTL = i18n.language === 'ar'
```

### RTL-Safe Tailwind Classes (REQUIRED)

**NEVER** use `left`, `right`, `ml-*`, `mr-*`, `pl-*`, `pr-*`
**ALWAYS** use logical properties:

| ❌ Avoid      | ✅ Use Instead | Description         |
| ------------- | -------------- | ------------------- |
| `ml-*`        | `ms-*`         | Margin start        |
| `mr-*`        | `me-*`         | Margin end          |
| `pl-*`        | `ps-*`         | Padding start       |
| `pr-*`        | `pe-*`         | Padding end         |
| `left-*`      | `start-*`      | Position start      |
| `right-*`     | `end-*`        | Position end        |
| `text-left`   | `text-start`   | Text align start    |
| `text-right`  | `text-end`     | Text align end      |
| `rounded-l-*` | `rounded-s-*`  | Border radius start |
| `rounded-r-*` | `rounded-e-*`  | Border radius end   |

### RTL Component Template

```tsx
import { useTranslation } from 'react-i18next'

export function ResponsiveRTLComponent() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row gap-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl text-start">{t('title')}</h1>
      <button className="h-11 min-w-11 px-4 sm:px-6 ms-4 sm:ms-6 rounded-s-lg rounded-e-lg">
        {t('action')}
      </button>
      {/* Flip directional icons */}
      <ChevronRight className={isRTL ? 'rotate-180' : ''} />
    </div>
  )
}
```

## Component Library Strategy

**The IntelDossier prototype is the visual source of truth.** The
component cascade below is for **interactive primitives only** —
unstyled or minimally-styled building blocks (focus management,
keyboard handling, ARIA). Visual styling, color, spacing, type,
borders, and shadows always come from the prototype tokens.

**Primitive cascade (in order):**

1. **HeroUI v3** — for accessible primitives (Modal, Popover, Combobox,
   etc.). Override its color/spacing/radius via the design tokens; never
   accept its default chrome.
2. **Radix UI** (already in via `@radix-ui/react-slot`) — for headless
   primitives HeroUI doesn't cover.
3. **Build it yourself**, mirroring a prototype component, if no
   primitive fits.

**Banned without explicit user request:**

- Aceternity UI — animation-heavy, marketing aesthetic. Conflicts with
  IntelDossier's restrained motion language. Do not install or import.
- Kibo UI — different visual system. Do not install or import.
- shadcn/ui defaults — the wrappers in `components/ui/heroui-*.tsx` exist
  for API compatibility, not visual fidelity. Re-skin them via tokens.

If a feature seems to require Aceternity-style motion or shadcn defaults,
**stop and ask** before installing anything.

### Component file locations

- **Token-bound primitives**: `frontend/src/components/ui/`
- **Design-system port**: `frontend/src/design-system/` (DesignProvider,
  tokens, hooks)
- **FOUC bootstrap**: `frontend/public/bootstrap.js` (palette + font literals
  must byte-match `tokens/directions.ts`)

## Tests

```bash
pnpm --filter frontend test              # frontend suite
pnpm --filter frontend test <file>       # one file
pnpm --filter frontend typecheck
pnpm --filter frontend test:e2e          # Playwright
```

## Gotchas

- **Theme tokens MUST resolve to design-system tokens.** No raw hex, no `text-blue-500` literals. Use `var(--*)` or the @theme-mapped Tailwind utilities (`bg-bg`, `text-ink`, etc.).
- **No `ml-*`/`mr-*`/`pl-*`/`pr-*`/`text-left`/`text-right`.** Logical properties only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`).
- **No card shadows.** Borders are `1px solid var(--line)`. Shadow only on drawers + hovered list rows.
- **FOUC bootstrap parity:** if you touch `frontend/src/design-system/tokens/directions.ts`, the literals in `frontend/public/bootstrap.js` must byte-match. See `frontend/src/design-system/CLAUDE.md`.
