# CLAUDE.md — Patch

Apply these changes to `Intl-Dossier-V2.0/CLAUDE.md`. The goal is to point
Claude Code at the IntelDossier prototype as the visual source of truth, and
to disarm the conflicting guidance that's currently pulling it toward
generic shadcn/HeroUI/Aceternity defaults.

---

## ① INSERT — at the top of the file (right after `Last updated:` line)

```markdown
## Visual Design Source of Truth (READ BEFORE ANY UI WORK)

The canonical visual design is the **IntelDossier prototype** at:

```
design-prototype/         <-- copy or symlink the prototype here
├── README.md             <-- voice, content rules, visual foundations
├── colors_and_type.css   <-- foundational tokens (Bureau light)
└── src/
    ├── themes.jsx        <-- token builder (4 directions × theme × density × hue)
    ├── app.css           <-- production stylesheet
    ├── icons.jsx         <-- 38-glyph stroked icon set
    ├── glyph.jsx         <-- DossierGlyph (circular flag system)
    ├── dashboard.jsx     <-- canonical Card / KPI / list patterns
    ├── pages.jsx         <-- canonical page templates
    └── shell.jsx         <-- topbar, sidebar, layout

```

**Default direction: Bureau.** Ignore Chancery, Situation, and Ministerial
unless a task explicitly references them.

### Required reading order before building or modifying any UI

1. `design-prototype/README.md` — voice, content rules, visual foundations
2. `design-prototype/colors_and_type.css` — token names and exact values
3. The closest matching component in `design-prototype/src/`

If you cannot identify a closest match, **ask before inventing**.

### Design rules — non-negotiable

- All colors via `var(--*)` tokens. **No raw hex. No Tailwind color
  utilities** except those mapped to design tokens (`bg-background`,
  `text-foreground`, `border-line`, etc.).
- Borders are `1px solid var(--line)`. **No drop-shadows on cards.**
  Shadow is reserved for drawers (`var(--shadow-lg)`) and hovered list rows.
- **No gradient backgrounds.** Surfaces are flat.
- Buttons follow `.btn-primary` / `.btn-ghost` from the prototype's
  `app.css`. Do not introduce new button variants without an explicit ask.
- Row heights use `var(--row-h)` (density-aware). Tables and lists
  must obey it.
- Corner radii come from `--radius-sm / --radius / --radius-lg`.
  Bureau radii are 8/12/16. Do not hard-code px.
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

```

---

## ② REPLACE — the entire `## Mobile-First & Responsive Design (MANDATORY)` section

The current language ("ALWAYS start mobile, NEVER write desktop-first") is
wrong for an analyst workstation. Replace with:

```markdown
## Responsive Design

IntelDossier is a **desktop-primary analyst workstation**. The default
target is 1280–1400px. Mobile is a secondary surface for read-only
review.

### Breakpoints

| Width      | Treatment                                                  |
| ---------- | ---------------------------------------------------------- |
| 1400px+    | Full layout (sidebar + 2:1 dashboard grid + dossier rail)  |
| 1024–1399  | Full layout, max-page-width 1400 enforced                  |
| 768–1023   | Collapse sidebar to icon rail; KPI strip 2×2               |
| 320–767    | Read-only mobile: stacked, no edit forms, no drag-and-drop |

### Rules

- Build for 1280px first, verify at 1024px, then degrade gracefully
  to 768. Below 768 is read-only.
- Touch targets at 44×44 only on `< 768px`. Above that, density tokens
  (`--row-h`) drive sizing.
- Use logical properties (`ms-*`, `ps-*`) so RTL works without re-styling.
- Never hide critical analyst content behind a mobile-toggle. If the
  feature can't fit at 768, omit it on mobile entirely.

```

---

## ③ REPLACE — the entire `### HeroUI v3 Component Strategy` section

Tighten so the cascade is for primitives only, never visual styling:

```markdown
### Component Library Strategy

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

```

---

## ④ DELETE — these sections (or move them to an archive doc)

These exist in the current `CLAUDE.md` and contradict the prototype.
Remove them outright:

- The full `### HeroUI v3 Drop-In Replacement Pattern` block (kept as
  internal reference, not for AI guidance — move to a separate
  `docs/HEROUI_INTERNALS.md`).
- The "Aceternity UI (Secondary - For Animations)" bullet list.
- Any "GASTAT green" color references (the prototype's Bureau accent
  is warm terracotta at hue 32, not green).

---

## ⑤ ARCHIVE — these top-level docs

Move the following out of `frontend/` into `frontend/.archive/` so
Claude Code stops averaging across them:

- `frontend/DESIGN_SYSTEM.md` (Kibo/GASTAT green vocabulary)
- `frontend/DESIGN_SYSTEM_V2.md` (migration stub pointing elsewhere)
- `frontend/DESIGN_SYSTEM_MIGRATION.md`
- `frontend/KIBO_UI_MIGRATION_CHECKLIST.md`
- `frontend/LANDING_PAGE_REDESIGN.md` (and Quick_Ref + Preview)
- `frontend/MOBILE_FIRST_EXAMPLES.md`
- `frontend/COMPONENT_INVENTORY.md` (regenerate from current state if needed)
- The `frontend/design-system/` folder if its content predates the
  prototype — audit first.

Replace them with a single `frontend/DESIGN_SYSTEM.md` containing only:

```markdown
# IntelDossier Design System

The visual source of truth lives at `<repo-root>/design-prototype/`.
See `CLAUDE.md` → "Visual Design Source of Truth" for required reading.

This frontend implements that prototype. Tokens are in `app.css`.
Tailwind utilities are mapped to those tokens via `tailwind.config.ts`.

Do not add new design documentation here. Update the prototype, then
re-port the tokens.
```

---

## ⑥ COPY — the prototype into the repo

The prototype currently lives outside the codebase. Claude Code can
only follow what it can read.

```bash
# from repo root
mkdir -p design-prototype
# copy the prototype project into design-prototype/
# (or add it as a git submodule if you want versioning)
```

Then verify Claude Code can `read_file design-prototype/README.md` from a
fresh session before relying on the rules above.
