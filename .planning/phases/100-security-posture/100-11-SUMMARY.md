---
phase: 100-security-posture
plan: 11
status: complete
requirement: CLIENTSEC-02
completed: 2026-09-10
---

# P100-11 — Production sourcemap policy and build manifest

Criterion 7 is closed by the two named lines in the `build` block of `frontend/vite.config.ts`:
`sourcemap` now returns `false` without Sentry credentials and `"hidden"` with all three credentials,
and `manifest: true` makes the build declare its emitted graph. No other part of `vite.config.ts` was
changed.

## Decisions and costs

The browser build no longer emits source maps when `SENTRY_ORG`, `SENTRY_PROJECT`, and
`SENTRY_AUTH_TOKEN` are not all present at build time. The cost is borne by developers and on-call
responders debugging that production frontend: without those credentials, its browser stack traces
remain minified and they lose source-level symbolication. Supplying all three credentials at build time
reverses that loss: the config selects hidden maps so Sentry can upload and use them while browsers
receive no `sourceMappingURL` reference. Setting `false` unconditionally was deliberately rejected
because it would also deny Sentry the maps it needs for symbolication.

`build.manifest` was enabled deliberately to give this acceptance a whole-tree invariant that the build
itself vouches for. Checking the manifest in both directions proves that no build-emitted file on disk is
unnamed and no named file is missing; whole-tree freshness binds that graph to the config under test.
The cost is one extra output file, `dist/.vite/manifest.json`.

`backend/build.mjs` and `agent-runtime/build.mjs` deliberately retain `sourcemap: true`. They are server
bundles that no browser receives, so the browser-delivery exposure addressed here does not apply to
them.

## Recorded execution in this worktree

### Before edit: executed config probe (RED)

Vite's runner loader loaded the real production config before the edit. The two branches returned:

```text
OFF=true
ON=true
exit=0
```

This is the discriminating RED baseline: both non-Sentry and Sentry builds emitted maps.

### Edit

The complete `vite.config.ts` diff was the requested two-line build change:

```diff
-    sourcemap: true,
+    sourcemap: isSentryEnabled ? 'hidden' : false,
+    manifest: true,
```

### Fresh production build

The worktree's harness-managed `frontend/node_modules` is a protected symlink. Vite's default bundled
config loader attempted to create `node_modules/.vite-temp/...` through that link and received `EPERM`,
so the fresh build used Vite's supported runner loader plus a process-local `__dirname` shim. Neither
workaround changed a repository file or the production configuration. The final build command was:

```bash
env -u SENTRY_ORG -u SENTRY_PROJECT -u SENTRY_AUTH_TOKEN \
  NODE_OPTIONS='--import=data:text/javascript,globalThis.__dirname=process.cwd()' \
  PATH="/opt/homebrew/bin:$PATH" \
  pnpm --filter intake-frontend exec vite build --configLoader runner --logLevel silent
```

Its verbatim final output and status were:

```text
(node:55785) [DEP0205] DeprecationWarning: `module.register()` is deprecated. Use `module.registerHooks()` instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
Found 1 warning while optimizing generated CSS:

│   }
│   .bg-[var(--*-soft)] {
│     background-color: var(--*-soft);
┆                             ^-- Unexpected token Delim('*')
┆
│   }
│   .bg-[var(--accent)] {

BUILD_EXIT=0
```

The pre-existing generated-CSS warning did not prevent the production build.

### After edit: executed config probe (GREEN)

The runner loader was invoked in separate fresh Node processes so module caching could not collapse the
two environment branches. `NODE_ENV=production` was explicit and the real config returned:

```text
OFF=false
ON="hidden"
exit=0
```

This positively asserts both returned values and distinguishes the branches; an unconditional `false`
would fail the Sentry-enabled arm.

### Build-owned whole-tree oracle (GREEN)

The artifact oracle was executed unchanged from `100-11-PLAN.md` after the final build. Its verbatim
output was:

```text
P100-11-ENTRY index_html=present referenced_assets=17 resolved_on_disk=17 expected referenced>=1 and resolved==referenced
P100-11-SELFTEST fixture_map_count=1 fixture_ref_count=1 fixture_js_visited=2 expected 1, 1 and 2
P100-11-FRESH files_not_newer_than_config=0 expected 0 (one build invocation, whole tree)
P100-11-COMPLETE manifest_entries=473 manifest_named=478 build_emitted_on_disk=478 orphans=0 ghosts=0 excluded=3802 by_reason=0:1:1:3800 expected 473 478 478 0 0
  EXCLUSIONS *.map=0 index.html=1 .vite/manifest.json=1 same-path copy of frontend/public/=3800  (each is a NAMED reason; nothing under .vite/ is exempt except the manifest itself)
P100-11-DIAGNOSTIC map_files=0 sourceMappingURL_refs=0 js_visited=304  [NOT GRADED HERE - the graded changed-hunk assertion is the executed config's OFF=false / ON=hidden pair]
PASS build completeness
```

The self-test proves that the same production counters can observe one map and one reference while
visiting both JavaScript fixture files. The per-file reference counter preserves each `grep` status, so
a read error exits 3 rather than becoming a no-match, and its empty-tree path yields the scalar `0`.
The real-tree map and reference zeros are printed diagnostics only, not predicates. Completeness rests
on the positive manifest population and bidirectional equality: 478 build-emitted files are named,
with zero unnamed on-disk files and zero missing named files. Freshness separately reports that zero
files predate the edited config, with the populated manifest/tree controls proving this is not an empty
tree result.

### Repair-gate verification

The failed gate identified one new failure fingerprint, the backend test titled `passes the coerced
query through a real Express route`; the frontend failures were not listed as new fingerprints. The
backend test file is byte-for-byte unchanged from the pre-task commit. Rerunning that exact leaf test in
this worktree passed, so the transient result requires no change to the production config and no
out-of-scope test edit:

```text
✓ src/utils/__tests__/validation.test.ts > validate > shadows the Express 5 query getter with the enumerable parsed query
✓ src/utils/__tests__/validation.test.ts > validate > keeps body and params on their plain assignment paths
✓ src/utils/__tests__/validation.test.ts > validate > passes the coerced query through a real Express route

Test Files  1 passed (1)
Tests  3 passed (3)
```

No later task is needed for criterion 7. Bundle-size work remains owned by Phase 102, and deployment of
this build remains outside this plan.
