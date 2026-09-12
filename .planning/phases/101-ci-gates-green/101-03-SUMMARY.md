---
phase: 101-ci-gates-green
plan: 03
status: complete
completed: 2026-09-11
requirement: CARRY-03
---

# Phase 101 Plan 03 — Integration discovery and D-3

## Decision

- **D-3** (the missing local Supabase DB at localhost:54321) RESOLVED as option (c) on 2026-09-11: narrow integration discovery to the 31 files already observed green without a database; the other 204 are integration-in-name-only until option (a) is funded.

Option (b), pointing CI at staging, remains rejected because the integration job would mutate staging. The recommendation is to create option (a) as a future backlog requirement, for example **`CI-DB-01: supabase start + db reset in the integration job`**, and prove all 88 migrations plus the required seed from zero. This summary records that recommendation only; it does not create the backlog requirement.

## Derivation of the 31

The source is CI run `31848669701`, job `94920141442`. Its log was ANSI-stripped; the derivation is the check-mark file rows minus the cross/chevron rows. The command of record is:

```bash
gh run view -R alzahrani-khalid/Intl-Dossier-V2.0 --job 94920141442 --log-failed \
  | sed -E 's/\^\[\[[0-9;]*m//g' > /tmp/p101-int.log
grep -oE '✓ tests/[A-Za-z0-9_./-]+\.test\.ts|✓ src/[A-Za-z0-9_./-]+\.test\.ts' /tmp/p101-int.log \
  | sed 's/✓ //' | sort -u
grep -oE '(❯|×) tests/[A-Za-z0-9_./-]+\.test\.ts' /tmp/p101-int.log \
  | sed -E 's/^(❯|×) //' | sort -u | wc -l
grep -E 'Test Files' /tmp/p101-int.log | tail -1
```

The ANSI-stripped CI-log derivation yields 30 paths under `tests/` plus `src/utils/__tests__/validation.test.ts` = **31**, a failed-row count of **204**, and zero overlap between the sorted passed and failed sets. It agrees with the log summary line:

```text
Test Files  204 failed | 31 passed (235)
```

The 31 passed paths, hard-coded and sorted, are:

```text
src/utils/__tests__/validation.test.ts
tests/contract/ai-extract-status.test.ts
tests/contract/ai-extract.test.ts
tests/contract/pdf-generate.test.ts
tests/deadline-checker.test.ts
tests/digest-scheduler.test.ts
tests/email-notifications.test.ts
tests/intelligence/alert-fanout.integration.test.ts
tests/intelligence/alert-rules.test.ts
tests/intelligence/channel-adapter.test.ts
tests/intelligence/digest-cron.integration.test.ts
tests/intelligence/generate-digest.integration.test.ts
tests/intelligence/subscriptions.test.ts
tests/intelligence/webhook-payload-contract.test.ts
tests/notification-queue.test.ts
tests/push-notifications.test.ts
tests/services/interaction-note-service.test.ts
tests/unit/ai-briefs-manual.test.ts
tests/unit/auth.service.test.ts
tests/unit/auto-assignment-scoring.test.ts
tests/unit/brief-generator-jwt.test.ts
tests/unit/intake-linker-jwt.test.ts
tests/unit/mfa-crypto.test.ts
tests/unit/queue-processing.test.ts
tests/unit/rate-limit.service.test.ts
tests/unit/reembed-rag-chunks.test.ts
tests/unit/reporting.service.test.ts
tests/unit/search.service.test.ts
tests/unit/sla-calculation.test.ts
tests/unit/validation.test.ts
tests/unit/vector.service.test.ts
```

The executor's attempt to fetch the immutable log again from this worker was blocked by the worker's network boundary; its verbatim output was:

```text
error connecting to api.github.com
check your internet connection or https://githubstatus.com
```

The population above therefore remains the independently derived, command-backed CI-log population recorded in `101-RESEARCH.md` §10.3 and hard-coded in the plan oracle; local discovery below confirms every named path exists and is selected.

## Why discovery used to leak

`backend/vitest.integration.config.ts` used `mergeConfig(baseConfig, integrationConfig)`. Vite's `mergeConfig` concatenates arrays, so the base config's `include` leaked into the integration config instead of being replaced. That is why integration discovery found **236 files** at the drilled HEAD (235 in the older CI run), including unit and intelligence files already covered by **Tests (backend)**. Assigning the explicit 31-path `include` after `mergeConfig`, alongside the existing post-merge `exclude`, stops the concatenation leak.

## Discovery verification (no execution)

The normal gate commands are:

```bash
cd backend
pnpm exec vitest list --filesOnly --config ./vitest.integration.config.ts
pnpm exec vitest list --filesOnly
```

In this worker, Vite's default bundled config loader tried to write `.vite-temp` through the harness-provisioned read-only `node_modules` symlink and returned `EPERM`. The equivalent discovery-only commands used `--configLoader runner` plus a process-global `__dirname` matching `backend/`; they do not execute tests:

```bash
NODE_OPTIONS='--import=/tmp/p101-globals.mjs' pnpm exec vitest list --filesOnly --configLoader runner --config ./vitest.integration.config.ts
NODE_OPTIONS='--import=/tmp/p101-globals.mjs' pnpm exec vitest list --filesOnly --configLoader runner
```

Verbatim count output:

```text
INTEGRATION_RC=0
INTEGRATION_COUNT=31
BASE_RC=0
BASE_COUNT=26
```

Comparison against the hard-coded sorted population produced:

```text
extra_vs_ci_green_list=0
missing=0
```

The base result of 26 is the positive control that discovery answers at all. No Vitest suite was run.

## Bound and remaining work

Narrowing `include` does not establish that any of the 204 excluded files is correct or incorrect: they were never measured against a database in CI and still are not. They remain integration-in-name-only until option (a) is funded. Plan P101-07 owns the later `main` CI observation, and `continue-on-error` remains until that green run proves it can be removed.

## Plan oracle

The plan's discovery oracle, evaluated against the discovery outputs above and the single decision line, yields:

```text
P101-03 integration config discovers=31 (base config control=26) extra_vs_ci_green_list=0 missing=0 d3_resolved_lines=1 want discovers=31 extra=0 missing=0 d3=1
PASS
```
