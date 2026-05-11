// Phase 35 — self-hosted font pipeline (D-05, TYPO-02).
// Pure side-effect module: each `@fontsource[-variable]/*` CSS import injects
// `@font-face` rules into the global cascade. Imports-only; consumed for its
// CSS side effect alone (no symbols produced).
//
// Ordering rule (Pitfall 2, RESEARCH §Common Pitfalls): this module MUST be
// imported BEFORE `./index.css` in `main.tsx` so the @font-face rules reach
// the cascade before index.css's `font-family: var(--font-body)` evaluates.
//
// Grouping convention: variable-axis packages first (wght.css sub-path per
// D-04), then classic per-weight imports grouped by package. Alphabetical
// within groups for reviewability.

// Variable-axis — 5 packages (1 wght.css sub-path each)
import '@fontsource-variable/fraunces/wght.css'
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/jetbrains-mono/wght.css'
import '@fontsource-variable/public-sans/wght.css'
import '@fontsource-variable/space-grotesk/wght.css'

// Classic per-weight — IBM Plex Sans (body for Situation direction)
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-sans/700.css'

// Classic per-weight — IBM Plex Mono (mono for Situation direction)
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'

// Classic per-weight — Tajawal (Arabic RTL cascade, D-06 unconditional load)
import '@fontsource/tajawal/400.css'
import '@fontsource/tajawal/500.css'
import '@fontsource/tajawal/700.css'
