---
phase: 33-token-engine
plan: 09
type: summary
wave: 4
verdict: PARTIAL
summary_version: 1.0
---

# Plan 33-09: E2E Success-Criteria Verification — SUMMARY

**Verdict:** PARTIAL — Spec code + test hatch + npm script landed correctly; execution blocked by a pre-existing `@heroui/styles@3.0.3` × `tailwindcss@4.2.2` compatibility crash (the same "y is not a function" deferred from 33-06).

## What landed (PASS)

| Task                                  | Commit     | Artifact                                                    | Status                                                                                                                                                                        |
| ------------------------------------- | ---------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task 1 — window.\_\_design test hatch | `b01b5cd0` | `frontend/src/design-system/DesignProvider.tsx` (+32 lines) | ✅ typechecks, 18/18 DesignProvider unit tests still pass, hatch is Vite-inlined so it tree-shakes to false in prod                                                           |
| Task 2 — SC-1..SC-5 Playwright spec   | `068a63d2` | `tests/e2e/token-engine-sc.spec.ts` (326 lines)             | ✅ 5 `base()` blocks, beforeEach wipes `id.*` localStorage keys, `waitForHatch()` polls window.\_\_design, assertion values verified against `buildTokens.ts` source of truth |
| Task 3 — `test:e2e:sc` npm script     | `6c21203e` | `package.json` (+1 line)                                    | ✅ `pnpm test:e2e:sc` routes to `playwright test tests/e2e/token-engine-sc --project=chromium-en --no-deps`                                                                   |

## What did NOT run (BLOCKED)

The 5 SC tests could not be executed because the Vite dev server crashes on every request for `frontend/src/index.css`:

```
[vite] Internal server error: y is not a function
  Plugin: @tailwindcss/vite:generate:serve
  File: frontend/src/index.css
      at Wi (…/tailwindcss@4.2.2/dist/chunk-F4544Y4M.mjs:27:2347)
```

Symptoms:

- `GET http://localhost:5173/` returns 200 + HTML,
- `GET …/src/index.css` returns **HTTP 500**,
- `<link rel="stylesheet">` fails, no rendered UI, no React bootstrap,
- `window.__design` is never attached → `waitForHatch()` times out at 10 s → all 5 SC tests fail.

## Bisect trail

| Step      | Change                                  | Result                                                                                                                                                                        |
| --------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline  | index.css untouched                     | `y is not a function` on every CSS request                                                                                                                                    |
| Bisect #1 | Comment out `@plugin '@heroui/styles';` | New error: `Cannot apply unknown utility class 'text-accent-foreground'` from `@apply` in `src/index.css:326` and shadcn-style `-foreground` classes in `src/components/ui/*` |
| Restore   | Re-enable `@plugin '@heroui/styles';`   | Back to baseline `y is not a function`                                                                                                                                        |

**Conclusion:** The primary trigger is `@plugin '@heroui/styles'`. @heroui/styles@3.0.3 (latest) and tailwindcss@4.2.2 (latest — the `next` dist-tag is 4.0.0, which is older) are mutually incompatible in Tailwind v4's utility generator. Secondary observation: if @plugin is removed, our `@theme` block is missing `--color-accent-foreground` (we define `--color-accent-fg` instead), so shadcn semantic classes like `hover:text-accent-foreground` (found in 10+ ui/ files) break regardless of the primary crash.

## Diagnostic evidence

```
installed    tailwindcss@^4.2.2  (dist-tag latest = 4.2.2; `next` = 4.0.0)
installed    @heroui/react@3.0.3, @heroui/styles@3.0.3  (latest stable)
```

Error happens inside tailwindcss's `chunk-F4544Y4M.mjs:27:2347` — the minified `Wi` function (variant application). Stack trace is identical to the 33-06 production build crash (`@tailwindcss/vite:generate:build`). Dev vs prod is only different in the plugin name (`generate:serve` vs `generate:build`); the underlying crash is the same.

## Remediation options (pick one — deferred to user)

1. **Upgrade lever (upstream-first):** wait for `@heroui/styles > 3.0.3` or `tailwindcss > 4.2.2` — file a minimal-repro upstream issue pointing at index.css lines 10 (`@import 'tailwindcss'`) + 14 (`@plugin '@heroui/styles'`). Neither library currently has a newer stable release.
2. **Downgrade lever:** pin `tailwindcss@4.0.0` (the `next` dist-tag) if @heroui/styles's changelog cites it as the verified target.
3. **Decouple lever:** stop using `@plugin '@heroui/styles'` entirely. Build our own tiny bridge CSS that defines the 6 tokens HeroUI v3 components read (`--heroui-primary`, `--heroui-default`, `--heroui-success`, `--heroui-warning`, `--heroui-danger`, …) and drop the plugin. This would require a follow-up phase to audit all HeroUI v3 component expectations.
4. **Additive hygiene (partial unblock only):** add `--color-accent-foreground: var(--accent-fg);` + audit `grep -r "-foreground" frontend/src/components/ui/` so shadcn-style utilities keep working even when @plugin is absent. Does NOT fix the primary crash, but shortens the dependency surface.

## Evaluation against DoD

| DoD item                                                           | Status | Notes                                                                                                                                                                                                         |
| ------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `window.__design` test hatch present and gated behind DEV/test env | ✅     | `DesignProvider.tsx:235-254` — effect runs only when `import.meta.env.DEV \|\| MODE === 'test'`, cleanup deletes the hatch on unmount                                                                         |
| 5 `test()` blocks present, one per SC, each with the assertions    | ✅     | Spec file has all 5, beforeEach state reset, `waitForFunction` polls instead of sleep, assertions byte-match `buildTokens.ts` palette math                                                                    |
| `pnpm test:e2e:sc` passes locally against a running dev server     | ❌     | Blocked — dev server crashes on CSS transform (see above)                                                                                                                                                     |
| CI runs the suite on push                                          | ⚠️     | Script wired but unrunnable until the Tailwind/HeroUI compat crash is fixed; CI would go red                                                                                                                  |
| Each test passes in EN and AR locales                              | ⚠️     | SC assertions are locale-invariant (tokens are i18n-agnostic); RTL check inline in SC-4 via `document.documentElement.setAttribute('dir','rtl')`. No separate `ar-smoke/` copy added (would run identically). |
| No flakiness — `--repeat-each 3` with 100% pass                    | ❌     | Blocked along with the per-SC run                                                                                                                                                                             |

## Files modified

- `frontend/src/design-system/DesignProvider.tsx` — +32 lines (hatch effect + DesignTestHatch interface export)
- `tests/e2e/token-engine-sc.spec.ts` — new, 326 lines
- `package.json` — +1 script line

## Files verified unchanged

- `frontend/src/index.css` — touched only during bisect; restored to pre-session state
- `frontend/tailwind.config.ts` — not touched
- `frontend/src/App.tsx` — not touched

## Related work deferred

- 33-07 Tier B–E (preference-sync removal, i18n rewrite, AppearanceSection rewrite, layout call-site sweep, 5 integration tests, `docs/DESIGN_SYSTEM_MIGRATION.md`)
- 33-08 Storybook bootstrap + TokenGrid VRT
- **New:** 33-09 blocker — `@heroui/styles` + `tailwindcss@4.2.2` compat (needs upstream triage OR one of the 4 remediation levers above)

## Baseline metrics

- Frontend typecheck: 1594 errors (delta 0 vs pre-session; 1578 baseline in STATE.md is slightly stale — branch drift, not caused by this plan)
- DesignProvider unit tests: 18/18 PASS (no regression)
- Dev server: crashes as above
- Prod build: unchanged (same crash as 33-06 SUMMARY documented)

## Recommendation

Ship the three code commits (`b01b5cd0`, `068a63d2`, `6c21203e`) as-is — the artifacts are correct and will become executable the moment the compat crash is unblocked. Open a follow-up session to pick one of the four remediation levers, then re-run `pnpm test:e2e:sc` to promote verdict from PARTIAL → PASS without needing to touch the spec or hatch.
