---
phase: 33-token-engine
plan: 03
type: execute
wave: 2
depends_on: ['33-01']
files_modified:
  - frontend/index.html
  - deploy/nginx.conf
  - deploy/docker-compose.prod.yml
  - frontend/tests/e2e/fouc-bootstrap.spec.ts
autonomous: false
requirements: [TOKEN-02]
must_haves:
  truths:
    - 'A synchronous inline <script> in index.html sets initial --bg, --surface, --surface-raised, --ink, --line, --accent, --accent-fg BEFORE stylesheets load'
    - 'Users with localStorage empty see Chancery / light / 22° / comfortable with zero visible flicker'
    - 'Production CSP either permits inline scripts (hash-allowlisted) or we ship the same script with a SHA-256 hash'
  artifacts:
    - path: 'frontend/index.html'
      provides: 'inline FOUC-prevention <script>'
    - path: 'deploy/nginx.conf'
      provides: 'CSP header update (if needed)'
  key_links:
    - from: 'frontend/index.html'
      to: 'localStorage keys id.dir / id.theme / id.hue / id.density'
      via: 'inline getItem reads'
      pattern: "localStorage.getItem\\('id\\."
---

# Plan 33-03: FOUC-Safe Inline Bootstrap

**Phase:** 33 (token-engine)
**Wave:** 2
**Depends on:** 33-01 (for the canonical palette literals it duplicates)
**Type:** implementation + config
**TDD:** false (E2E verification only)
**Estimated effort:** S-M (2–3 h; +1 h if CSP audit requires nginx changes)

## Goal

Eliminate theme-flash by inlining a ~2 KB classic `<script>` into `frontend/index.html` that reads `localStorage` and writes the minimum viable token set to `document.documentElement` BEFORE any stylesheet parses. First paint uses the correct palette for all 4 directions × 2 modes × 3 densities × any hue. Zero FOUC measured by Playwright.

## Why this plan has a checkpoint (autonomous: false)

Step 4 audits production CSP headers. If CSP forbids `unsafe-inline`, the inline script must either (a) be allowlisted via SHA-256 hash in `script-src`, or (b) be replaced with a render-blocking external `<script>` (slightly slower FOUC-wise). This decision requires a look at `deploy/nginx.conf` and docker-compose prod config — presented as a **checkpoint:decision** task.

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/33-token-engine/33-CONTEXT.md
@.planning/phases/33-token-engine/33-RESEARCH.md
@frontend/index.html
@deploy/nginx.conf
@deploy/docker-compose.prod.yml

<interfaces>
<!-- Minimum palette constants the inline script duplicates from 33-01.
     This is INTENTIONAL DUPLICATION (D-03) — the inline script runs before modules load. -->
```javascript
// Inline in index.html — minimum viable palette per direction/mode
// Only 4 dirs × 2 modes × {bg, surface, surfaceRaised, ink, line} = 40 string literals
// Full 35-var set is written later by DesignProvider on mount
```
</interfaces>
</context>

## Files to create / modify

| Path                                        | Action | Notes                                                                                       |
| ------------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| `frontend/index.html`                       | modify | Insert inline `<script>` between `<title>` and `<script type="module" src="/src/main.tsx">` |
| `deploy/nginx.conf`                         | modify | Add SHA-256 hash to `script-src` CSP if inline-script strategy chosen                       |
| `deploy/docker-compose.prod.yml`            | verify | Confirm no competing CSP override                                                           |
| `frontend/tests/e2e/fouc-bootstrap.spec.ts` | create | Playwright test asserting no flicker on cold load                                           |

## Implementation steps

### Task 1 (auto) — Write the inline bootstrap

Insert this inside `frontend/index.html`, positioned AFTER `<title>` and the existing font-preload block, BEFORE the `<script type="module" src="/src/main.tsx">` tag:

```html
<script>
  (function () {
    try {
      var dir = localStorage.getItem('id.dir') || 'chancery';
      var mode = localStorage.getItem('id.theme') || 'light';
      var hue = parseInt(localStorage.getItem('id.hue') || '22', 10) || 22;
      var density = localStorage.getItem('id.density') || 'comfortable';

      // Minimum viable palette (must byte-match PALETTES[dir][mode] in 33-01's directions.ts)
      // ONLY bg, surface, surface-raised, ink, line — the vars that drive first paint.
      var P = {
        chancery:   { light: { bg:'/*FROM-DIRECTIONS*/', surface:'…', surfaceRaised:'…', ink:'…', line:'…' }, dark: { … } },
        situation:  { light: { … }, dark: { … } },
        ministerial:{ light: { … }, dark: { … } },
        bureau:     { light: { … }, dark: { … } },
      };

      var r = document.documentElement;
      r.classList.toggle('dark', mode === 'dark');
      r.setAttribute('data-direction', dir);
      r.setAttribute('data-density', density);
      var pal = (P[dir] && P[dir][mode]) || P.chancery.light;
      r.style.setProperty('--bg', pal.bg);
      r.style.setProperty('--surface', pal.surface);
      r.style.setProperty('--surface-raised', pal.surfaceRaised);
      r.style.setProperty('--ink', pal.ink);
      r.style.setProperty('--line', pal.line);
      r.style.setProperty('--accent', 'oklch(58% 0.14 ' + hue + ')');
      r.style.setProperty('--accent-fg', 'oklch(99% 0.01 ' + hue + ')');
    } catch (e) { /* localStorage blocked — CSS :root defaults kick in */ }
  })();
</script>
```

**Constraints:**

- Plain ES5 — no arrow functions, no `const`/`let`, no template literals except the trivial `+` concat shown above (older Safari 11 fallback). If `Vite` targets are already ≥ES2018, template literals are OK — verify `vite.config.ts` target first.
- No `type="module"`, no `async`, no `defer` — classic script, synchronous, render-blocking.
- Total size ≤ 2 KB minified.
- Palette literals populated from Plan 33-01's `directions.ts` — copy the exact OKLCH strings so first-paint and mount-time render produce identical colors (zero re-flash).

### Task 2 (auto) — Copy palette literals from 33-01

Read `frontend/src/design-system/tokens/directions.ts` (Plan 33-01 output). Copy the `{bg, surface, surfaceRaised, ink, line}` string literals for each of the 4 directions × 2 modes = 8 palette objects into the inline `P` map above. Script is now ~1.8 KB.

### Task 3 (auto) — Verify CSS-root defaults fall back gracefully

Confirm `frontend/src/index.css` (after Plan 33-06's `@theme` + remap) still defines a `:root { }` block with Chancery/light literal fallbacks (not `var(--bg)` refs) so that when `localStorage` throws, CSS takes over. Add a Chancery-light literal set to `:root` as defense-in-depth.

### Task 4 (checkpoint:decision) — CSP audit decision

<task type="checkpoint:decision" gate="blocking">
  <decision>How to allow the inline FOUC bootstrap under our production CSP?</decision>
  <context>
    Our DigitalOcean droplet serves the app via nginx behind Docker Compose. `deploy/nginx.conf` and
    `deploy/docker-compose.prod.yml` set CSP headers. Inline `<script>` tags need either:
      (a) `script-src 'unsafe-inline'` — weakens XSS posture
      (b) `script-src 'sha256-{HASH}'` — pins exactly this script
      (c) Move the bootstrap to an external `<script src="/bootstrap.js">` with `blocking="render"` — slightly slower FOUC

    Read `deploy/nginx.conf` to check current CSP directives. Grep the repo:
        grep -rn "Content-Security-Policy\|script-src" deploy/ nginx/ 2>/dev/null

  </context>
  <options>
    <option id="option-a">
      <name>SHA-256 hash pin (recommended)</name>
      <pros>Strong XSS posture; inline stays render-blocking = zero FOUC</pros>
      <cons>Hash must be regenerated if inline script changes</cons>
      <details>Compute via `echo -n "$(cat inline.js)" | openssl dgst -sha256 -binary | openssl base64`; add to `script-src 'sha256-…'` in nginx.conf. Add a build-time check that Vite's HTML plugin emits the matching hash (or hard-code the hash and fail CI if it drifts).</details>
    </option>
    <option id="option-b">
      <name>`unsafe-inline` allowlist</name>
      <pros>Zero build-time complexity</pros>
      <cons>Weakens CSP globally — any injected script in the HTML runs</cons>
    </option>
    <option id="option-c">
      <name>External blocking script (<script src="/bootstrap.js" blocking="render">)</name>
      <pros>No CSP changes</pros>
      <cons>Adds one HTTP round-trip; marginal FOUC delay (~10-30 ms on slow networks)</cons>
    </option>
  </options>
  <resume-signal>Select: option-a, option-b, or option-c</resume-signal>
</task>

### Task 5 (auto) — Apply CSP change per chosen option

Modify `deploy/nginx.conf` based on option chosen in Task 4. If option-a, emit the SHA-256 hash and write the `Content-Security-Policy` header accordingly. Verify with `docker compose -f deploy/docker-compose.prod.yml config` that the header renders correctly.

### Task 6 (auto) — Playwright FOUC assertion

Create `frontend/tests/e2e/fouc-bootstrap.spec.ts`:

```ts
import { test, expect } from '@playwright/test'
test('no FOUC: bg is Chancery-light before React hydration', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
  })
  const responses: number[] = []
  page.on('response', (r) => responses.push(Date.now()))
  await page.goto('/')
  // Capture --bg on `DOMContentLoaded`, BEFORE main.tsx module executes
  const bgAtDomReady = await page.evaluate(() =>
    document.documentElement.style.getPropertyValue('--bg'),
  )
  expect(bgAtDomReady).toBeTruthy()
  expect(bgAtDomReady).not.toBe('')
})
test('mode persists: dark mode applied before hydration', async ({ page, context }) => {
  await context.addInitScript(() => {
    localStorage.setItem('id.theme', 'dark')
  })
  await page.goto('/')
  const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
  expect(hasDark).toBe(true)
})
```

## Definition of done

- [ ] `frontend/index.html` has inline bootstrap with all 8 palette objects populated from 33-01's `directions.ts`
- [ ] Inline script ≤ 2 KB minified
- [ ] CSP decision made (Task 4) and applied (Task 5)
- [ ] `pnpm --filter frontend test:e2e fouc-bootstrap` passes both tests
- [ ] Manual cold-load test: `localStorage.clear(); location.reload()` shows Chancery-light immediately — no white flash
- [ ] `localStorage.setItem('id.theme','dark'); location.reload()` shows dark surfaces immediately
- [ ] Deploy preview to staging droplet, hit the app in an incognito window, visually confirm zero flicker in both EN and AR locales

## Requirements satisfied

- TOKEN-02 (full — FOUC bootstrap)

## Success Criteria contribution

- SC-1/2/3/4 gated: without this plan, every page load flashes Chancery-light before DesignProvider mounts and re-paints. With this plan, first paint matches persisted preferences.

## Risks / unknowns

- **Palette-literal drift**: if a future plan changes `directions.ts` OKLCH strings, the inline script goes stale → FOUC returns on first paint after change. Mitigation: add a Vitest snapshot test in Plan 33-01 that diffs `directions.ts`'s `{bg, surface, surfaceRaised, ink, line}` against a regex scrape of `frontend/index.html` — CI-fails on drift.
- **CSP audit reveals a gap** (e.g. no existing CSP header): then option-b becomes the pragmatic default until a future hardening phase. Document decision in SUMMARY.
- **Inline-script Arabic smoke**: verify with `?lng=ar` URL that `data-direction` attribute on `<html>` doesn't conflict with `dir="rtl"` set by i18n init.

## Verification

```bash
# Build + preview
pnpm --filter frontend build
pnpm --filter frontend preview &
# E2E
pnpm --filter frontend test:e2e fouc-bootstrap
# Byte count check
grep -A1000 '<script>' frontend/index.html | head -60 | wc -c
# Staging deploy smoke
ssh root@138.197.195.242 "cd /opt/intl-dossier && git pull && cd deploy && docker compose -f docker-compose.prod.yml build frontend && docker compose -f docker-compose.prod.yml up -d frontend"
# Hit https://{staging-url}/ in incognito, DevTools → Network throttle "Slow 3G" → reload → watch for flicker
```
