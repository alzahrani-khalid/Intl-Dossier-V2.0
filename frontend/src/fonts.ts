// Phase 77 — self-hosted font pipeline for the Linear single-direction engine.
// Pure side-effect module: each font CSS import below injects `@font-face`
// rules into the global cascade. Imports-only; consumed for its CSS side effect
// alone (no symbols produced).
//
// The four retired directions' per-direction fonts (Fraunces, Public Sans,
// Space Grotesk, IBM Plex Sans/Mono) were dropped in 77-07 — Linear uses only
// Inter Variable (display + body) and JetBrains Mono Variable (mono). Tajawal
// stays for the Arabic RTL cascade (Inter has no Arabic coverage).
//
// Ordering rule (Pitfall 2, RESEARCH §Common Pitfalls): this module MUST be
// imported BEFORE `./index.css` in `main.tsx` so the @font-face rules reach
// the cascade before index.css's `font-family: var(--font-body)` evaluates.

// Variable-axis — Inter (display + body) + JetBrains Mono (mono)
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/jetbrains-mono/wght.css'

// Classic per-weight — Tajawal (Arabic RTL cascade, D-06 unconditional load)
import '@fontsource/tajawal/400.css'
import '@fontsource/tajawal/500.css'
import '@fontsource/tajawal/700.css'
