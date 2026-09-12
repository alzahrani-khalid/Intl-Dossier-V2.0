---
status: complete
phase: 102-staging-data-debt-tail
plan: 17
requirement: CARRY-07
---

# P102-17 entry chunk budget

The entry chunk is under 500 KB: the measured post-change entry is 120.68 kB gzipped and its limit is 124 KB (the next 4 kB boundary).

## Change and populations

`frontend/vite.config.ts` now assigns the application locale catalog modules under `src/i18n/{ar,en}/**` to the named `translations` manual chunk. The catalogs remain eager dependencies of the i18n bootstrap, but are no longer executable code inside `app-*.js`. No vendor rule or `chunkSizeWarningLimit` changed. The config also resolves the frontend root from `import.meta.url`, allowing Vite's runner loader to build in the isolated worktree without writing a temporary config beside the harness-owned `node_modules` target.

The entry population remains exactly `dist/assets/app-*.js` with gzip enabled. `node frontend/scripts/assert-size-limit-matches.mjs` re-derived one matching entry file and one file for every exact-count budget. The size-limit tables below re-derived all ten named budget populations.

Post-change measured entry: 120.68 kB. `ceil(120.68 / 4) * 4 = 124`, so `frontend/.size-limit.json` records `124 KB`.

## Execution record

The initial `pnpm -C frontend build` attempt could not write Vite's temporary bundled config into the read-only, harness-owned shared dependency tree and exited 1:

```text
failed to load config from frontend/vite.config.ts
error during build:
Error: EPERM: operation not permitted, open 'frontend/node_modules/.vite-temp/vite.config.ts.timestamp-…mjs'
ELIFECYCLE Command failed with exit code 1.
```

The first runner attempt exposed the existing CommonJS-only root expression and exited 1:

```text
failed to load config from frontend/vite.config.ts
error during build:
ReferenceError: __dirname is not defined
```

After replacing that expression with the equivalent `import.meta.url` root, the fresh HEAD build command was:

```text
$ pnpm -C frontend exec vite build --configLoader runner
vite v7.3.3 building client environment for production...
✓ 9537 modules transformed.
dist/assets/app-CTrRplJe.js                                       1,891.30 kB │ gzip: 519.67 kB
dist/assets/vendor-CO0QbQgk.js                                    2,344.80 kB │ gzip: 744.66 kB
✓ built in 11.49s
```

### HEAD build size-limit table (verbatim)

Command: `pnpm -C frontend size-limit` (exit 1)

```text
- Running JS in headless Chrome
✔ Running JS in headless Chrome

  Initial JS (entry point)
  Package size limit has exceeded by 15.68 kB
  Size limit:   500 kB
  Size:         515.68 kB gzipped
  Loading time: 10.1 s    on slow 3G

  React vendor
  Size limit:   285 kB
  Size:         60.95 kB gzipped
  Loading time: 1.2 s    on slow 3G

  TanStack vendor
  Size limit:   63 kB
  Size:         58.21 kB gzipped
  Loading time: 1.2 s    on slow 3G

  HeroUI vendor
  Size limit:   9 kB
  Size:         3.52 kB gzipped
  Loading time: 69 ms   on slow 3G

  Sentry vendor
  Size limit:   9 kB
  Size:         3.9 kB gzipped
  Loading time: 77 ms  on slow 3G

  DnD vendor
  Size limit:   22 kB
  Size:         16.52 kB gzipped
  Loading time: 323 ms   on slow 3G

  Copilot vendor (lazy)
  Size limit:   145 kB
  Size:         136.87 kB gzipped
  Loading time: 2.7 s     on slow 3G

  Total JS
  Size limit:   2.78 MB
  Size:         2.64 MB gzipped
  Loading time: 51.7 s  on slow 3G

  signature-visuals/d3-geospatial
  Size limit:   55 kB
  Size:         54.23 kB gzipped
  Loading time: 1.1 s    on slow 3G

  signature-visuals/static-primitives
  Size limit:   12 kB
  Size:         8.05 kB gzipped
  Loading time: 158 ms  on slow 3G

  Try to reduce size or increase limit at .size-limit.json
ELIFECYCLE Command failed with exit code 1.
```

The first application split used the name `app-translations`; the entry glob then matched both chunks, and size-limit reported 517.34 kB. Renaming the same application chunk to `translations` restored the required one-file entry population. The final fresh build reported:

```text
$ pnpm -C frontend exec vite build --configLoader runner
vite v7.3.3 building client environment for production...
✓ 9537 modules transformed.
dist/assets/app-DHkaO3gX.js                                         464.82 kB │ gzip: 121.08 kB
dist/assets/translations-B4QbwwjM.js                              1,427.90 kB │ gzip: 400.10 kB
dist/assets/vendor-CO0QbQgk.js                                    2,344.80 kB │ gzip: 744.66 kB
✓ built in 10.70s
```

### Post-change size-limit table (verbatim)

Command: `pnpm -C frontend size-limit` (exit 0)

```text
- Running JS in headless Chrome
✔ Running JS in headless Chrome

  Initial JS (entry point)
  Size limit:   124 kB
  Size:         120.68 kB gzipped
  Loading time: 2.4 s     on slow 3G

  React vendor
  Size limit:   285 kB
  Size:         60.95 kB gzipped
  Loading time: 1.2 s    on slow 3G

  TanStack vendor
  Size limit:   63 kB
  Size:         58.21 kB gzipped
  Loading time: 1.2 s    on slow 3G

  HeroUI vendor
  Size limit:   9 kB
  Size:         3.52 kB gzipped
  Loading time: 69 ms   on slow 3G

  Sentry vendor
  Size limit:   9 kB
  Size:         3.9 kB gzipped
  Loading time: 77 ms  on slow 3G

  DnD vendor
  Size limit:   22 kB
  Size:         16.52 kB gzipped
  Loading time: 323 ms   on slow 3G

  Copilot vendor (lazy)
  Size limit:   145 kB
  Size:         136.87 kB gzipped
  Loading time: 2.7 s     on slow 3G

  Total JS
  Size limit:   2.78 MB
  Size:         2.65 MB gzipped
  Loading time: 51.8 s  on slow 3G

  signature-visuals/d3-geospatial
  Size limit:   55 kB
  Size:         54.23 kB gzipped
  Loading time: 1.1 s    on slow 3G

  signature-visuals/static-primitives
  Size limit:   12 kB
  Size:         8.06 kB gzipped
  Loading time: 158 ms  on slow 3G
```

### Delta per named chunk

| Named size-limit check              |      HEAD | Post-change |      Delta |
| ----------------------------------- | --------: | ----------: | ---------: |
| Initial JS (entry point)            | 515.68 kB |   120.68 kB | -395.00 kB |
| React vendor                        |  60.95 kB |    60.95 kB |    0.00 kB |
| TanStack vendor                     |  58.21 kB |    58.21 kB |    0.00 kB |
| HeroUI vendor                       |   3.52 kB |     3.52 kB |    0.00 kB |
| Sentry vendor                       |   3.90 kB |     3.90 kB |    0.00 kB |
| DnD vendor                          |  16.52 kB |    16.52 kB |    0.00 kB |
| Copilot vendor (lazy)               | 136.87 kB |   136.87 kB |    0.00 kB |
| Total JS                            |   2.64 MB |     2.65 MB |   +0.01 MB |
| signature-visuals/d3-geospatial     |  54.23 kB |    54.23 kB |    0.00 kB |
| signature-visuals/static-primitives |   8.05 kB |     8.06 kB |   +0.01 kB |

The newly named application chunk `translations` is 400.10 kB gzipped in Vite's final build report (no HEAD counterpart).

### assert-size-limit-matches output (verbatim)

Command: `node frontend/scripts/assert-size-limit-matches.mjs` (exit 0)

```text
Initial JS (entry point): 1 file(s)
React vendor: 1 file(s)
TanStack vendor: 1 file(s)
HeroUI vendor: 1 file(s)
Sentry vendor: 1 file(s)
DnD vendor: 1 file(s)
Copilot vendor (lazy): 1 file(s)
Total JS: 304 file(s)
signature-visuals/d3-geospatial: 1 file(s)
signature-visuals/static-primitives: 1 file(s)
```

The control is the exact-count assertion itself: it exited 0 with one entry match and would exit 1 for zero or multiple entry matches, as observed when the intermediate `app-translations` name made the entry population two files.

### Acceptance Vitest output (verbatim)

Command: `pnpm -C frontend exec vitest run src/routes/__tests__/p102-entry-budget.test.ts --config vite.config.ts --configLoader runner --environment node` (exit 0)

```text
 RUN  v4.1.7 frontend

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Duration  999ms (transform 7ms, setup 0ms, import 11ms, tests 928ms, environment 0ms)
```

The default Vitest config loader also attempted to write beneath the harness-owned dependency symlink and exited 1 before loading tests; selecting the in-scope Vite config with the runner loader exercised all three tests without changing the repository test configuration.

### Command oracle output (verbatim)

The plan's complete command oracle exited 0 after the work:

```text
P102-17-SHAPE entry_path=[dist/assets/app-*.js] gzip=[true] assert_matches_exit=0 expected [dist/assets/app-*.js] [true] 0
P102-17-BUDGET configured_limit=[124 KB] size_limit_exit=0 entry=[Size:         120.68 kB] expected limit<500 KB and exit 0
PASS budget
```

Nothing is left for a later task.
