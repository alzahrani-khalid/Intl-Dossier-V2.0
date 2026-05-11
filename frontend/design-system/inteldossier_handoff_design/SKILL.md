---
name: inteldossier-design
description: Use this skill to generate well-branded interfaces and assets for IntelDossier — the foreign-affairs intelligence workspace. Contains essential design guidelines, colors, type, fonts, assets, and UI components for prototyping screens, decks, and full applications.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files (`src/themes.jsx`, `src/app.css`, `src/icons.jsx`, `src/glyph.jsx`, `src/loader.jsx`, `colors_and_type.css`, `preview/`, `ui_kits/web/`).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. The design system supports four interchangeable visual directions — Bureau (default, warm SaaS), Chancery (editorial serif), Situation (intelligence terminal), Ministerial (government-formal). Ask the user which direction unless context makes it obvious.

If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions (which direction? LTR or RTL? density? hue?), and act as an expert designer who outputs HTML artifacts or production code, depending on the need.
