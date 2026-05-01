# IntelDossier — Web UI Kit

This kit is the live prototype at the project root: **`IntelDossier Redesign.html`**.

It is a click-thru recreation of the IntelDossier web app: dashboard, engagements, dossier detail, countries directory, organizations, forums, settings — across four directions, two themes, three densities, and a 360° hue dial, in both LTR and RTL.

## Surfaces covered

- **Dashboard** — KPI strip, week-ahead, overdue commitments, tasks, digest, recent dossiers
- **Engagements list** — filterable table with SLA chips, classification, owners
- **Dossier detail (drawer)** — country header with glyph + flag, MoUs, briefs, SLA donut
- **Countries directory** — table with circular flag glyphs, ISO codes, engagement counts
- **Organizations directory** — same skeleton, geometric glyphs
- **Forums** — upcoming + recent, with date stack
- **Settings** — appearance, language, density, classification

## How to read it

Open `IntelDossier Redesign.html` and use the topbar:
- **Direction** segmented control — switch Bureau / Chancery / Situation / Ministerial
- **🌙/☀** — theme toggle
- **EN / ع** — locale (LTR / RTL)
- **Tweaks** (toolbar toggle) — density, accent hue, classification visibility

The full source lives in `src/`:
- `app.jsx` — entry, routing, top-level wiring
- `shell.jsx` — sidebar + topbar
- `dashboard.jsx`, `pages.jsx` — surfaces
- `themes.jsx` — token builder
- `tweaks.jsx` — settings panel
- `glyph.jsx`, `icons.jsx`, `loader.jsx` — brand primitives
- `data.jsx` — sample data
- `app.css` — full stylesheet

## What this kit does *not* cover

- Login / auth flows
- Mobile native (the responsive layout adapts; no mobile-specific patterns)
- Print/export views
