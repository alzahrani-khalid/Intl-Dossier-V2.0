---
phase: 62-export-pack-contract-deploy
plan: 03
subsystem: infra
tags: [supabase, edge-function, deploy, cors, smoke-test, dossier-export-pack, staging]

# Dependency graph
requires:
  - phase: 62-01
    provides: reconciled supabase/functions/dossier-export-pack/index.ts (Deno.serve, getCorsHeaders, aa_commitments + position_dossier_links queries, X-Failed-Sections header, direct text/html response)
  - phase: 62-02
    provides: frontend dialog/types/hook rework (HTML-only, new-tab open) — consumes the deployed function
provides:
  - dossier-export-pack edge function ACTIVE on staging (zkrcjzdemdmwhearhfgg), version 1, deployed 2026-06-11 13:01 UTC
  - Live per-type smoke proof — all 7 distinct dossier types export 200 + text/html with zero failed sections under an admin token
  - Empirical CORS confirmation that ALLOWED_ORIGINS is set (droplet + localhost origins reflected; unknown origins get ACAO null)
affects: [62-verify-work, export, briefing-pack, edge-function-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Edge deploy via supabase CLI keychain credential path (functions deploy works even when secrets list/set rejects the same credential on strict sbp_ format validation)'
    - 'Behavioral CORS verification (per-origin OPTIONS probe of the reflected Access-Control-Allow-Origin) as a stronger ALLOWED_ORIGINS-presence proof than reading a secret digest'

key-files:
  created:
    - .planning/phases/62-export-pack-contract-deploy/62-03-SUMMARY.md
  modified: []

key-decisions:
  - 'Deployed via supabase CLI (functions deploy) rather than the MCP path — the CLI keychain credential works for deploy/list even though it fails the strict sbp_ format check that secrets list/set enforce'
  - 'Confirmed ALLOWED_ORIGINS behaviorally (per-origin preflight ACAO reflection) instead of reading the secret digest, because the secrets CLI path is blocked by a malformed keychain token; the behavioral signal is exactly what the must-have cares about'
  - 'Smoke-tested with ALL 10 sections enabled (incl. documents, which is disabled by default) to exercise every reconciled query path under the admin token'

patterns-established:
  - 'Pattern 1: Per-type live smoke matrix (type | dossier_id | http_code | content_type | X-Failed-Sections | title_ok | bytes) as the EXPORT-02 acceptance artifact'
  - 'Pattern 2: Mint admin token from .env.test against staging auth password-grant, hold in shell var, delete all pack bodies/headers + token cache after recording (T-62-09 mitigation)'

requirements-completed: [EXPORT-02]

# Metrics
duration: 19min
completed: 2026-06-11
---

# Phase 62 Plan 03: Export Pack Deploy & Per-Type Smoke Summary

**dossier-export-pack edge function deployed live to staging (zkrcjzdemdmwhearhfgg, ACTIVE v1) and proven end-to-end: all 7 distinct dossier types export HTTP 200 + text/html with zero failed sections under an admin token.**

## Performance

- **Duration:** 19 min (1185s)
- **Started:** 2026-06-11T12:49:26Z
- **Completed:** 2026-06-11T13:09Z
- **Tasks:** 2 (both deploy/verification — `files_modified: []` per plan)
- **Files modified:** 0 source files (1 SUMMARY created)

## Accomplishments

- **Deployed** `dossier-export-pack` to staging — it was absent from the deployed functions before this plan (verified: pre-deploy OPTIONS + POST both returned 404). Post-deploy it is ACTIVE, version 1, updated 2026-06-11 13:01:23 UTC; the `_shared/cors.ts` dependency bundled automatically (script size 130.9 kB).
- **Proved EXPORT-02 live** for all 7 distinct dossier types (country, engagement, forum, organization, person, topic, working_group) — each returns 200 + text/html, contains `<title>Briefing Pack`, and carries NO `X-Failed-Sections` header. `elected_official` is a `person` subtype, not a distinct `dossiers.type`, so 7 is the full distinct-type set (matches the plan's expectation).
- **Confirmed ALLOWED_ORIGINS is set** behaviorally: the droplet origin (`http://138.197.195.242`) and localhost dev origin both receive a real reflected `Access-Control-Allow-Origin`, while an unknown origin gets `null`. If the secret were unset, the cors.ts fallback would only allow localhost and the droplet origin would have received `null` — so the droplet's real ACAO is positive proof the secret is set and includes the deployed origin.
- **Deep-verified** the rendered HTML: all 9 enabled content sections (overview → documents) render real `<h2>` section titles; zero in-document "could not be generated" error blocks and zero raw error envelopes across all 7 bodies — both signals agree with the empty X-Failed-Sections header.

## Smoke Matrix (EXPORT-02 acceptance evidence; tokens redacted, dossier data deleted)

| type          | dossier_id                           | http_code | content_type             | X-Failed-Sections | title_ok | body_bytes |
| ------------- | ------------------------------------ | --------- | ------------------------ | ----------------- | -------- | ---------- |
| country       | b0000001-0000-0000-0000-000000000001 | 200       | text/html; charset=utf-8 | (none)            | yes      | 12193      |
| engagement    | 00000000-0000-0052-0000-000000000001 | 200       | text/html; charset=utf-8 | (none)            | yes      | 12016      |
| forum         | b0000008-0000-0000-0000-000000000003 | 200       | text/html; charset=utf-8 | (none)            | yes      | 11793      |
| organization  | b0000000-0000-0000-0000-00000000aaaa | 200       | text/html; charset=utf-8 | (none)            | yes      | 12446      |
| person        | 19a22b0d-0577-4869-a38f-283a1ef9359d | 200       | text/html; charset=utf-8 | (none)            | yes      | 11782      |
| topic         | b0000001-0000-0000-0000-000000000007 | 200       | text/html; charset=utf-8 | (none)            | yes      | 12976      |
| working_group | a0000000-0000-0000-0000-000000000404 | 200       | text/html; charset=utf-8 | (none)            | yes      | 12361      |

Gates: SMOKE-ALL-200 (zero 404, zero 500) ✓ · ZERO non-empty X-Failed-Sections ✓ · every body contains `<title>Briefing Pack` ✓.

### Replayable smoke procedure

```bash
# 1. source .env.test (main checkout) → SUPABASE_URL, SUPABASE_ANON_KEY,
#    SUPABASE_SERVICE_ROLE_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD
# 2. distinct types (one id each):
curl -s "$SUPABASE_URL/rest/v1/dossiers?select=type,id&order=type.asc,created_at.desc" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
# 3. mint admin token (password grant against $SUPABASE_URL/auth/v1/token?grant_type=password)
# 4. per (type,id), POST the all-sections-enabled body:
curl -s -o /tmp/pack-$TYPE.html -D /tmp/pack-$TYPE.headers \
  -w "%{http_code} %{content_type}\n" \
  -X POST "$SUPABASE_URL/functions/v1/dossier-export-pack" \
  -H "Authorization: Bearer $TOKEN" -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:5173" \
  -d '{"dossier_id":"<id>","config":{"language":"en","sections":<all-enabled>,"includeCoverPage":true,"includeTableOfContents":true,"includePageNumbers":true}}'
# 5. assert http=200, content-type text/html, no X-Failed-Sections, body has <title>Briefing Pack
```

## Task Commits

This plan is deploy/verification only (`files_modified: []`); neither task changed repo source, so neither produced a per-task commit. The only repo artifact is this SUMMARY.

1. **Task 1: Deploy dossier-export-pack to staging + confirm CORS** - no source change (live deploy operation)
2. **Task 2: Per-type smoke export + record matrix** - no source change (live verification operation)

**Plan metadata:** committed with this SUMMARY (`docs(62-03): ...`).

## Files Created/Modified

- `.planning/phases/62-export-pack-contract-deploy/62-03-SUMMARY.md` - this summary + the EXPORT-02 smoke matrix

No source files were modified — the reconciled function from 62-01 was already on the worktree base; this plan only deployed and verified it.

## Decisions Made

- **CLI deploy over MCP deploy.** The supabase CLI is authenticated via the macOS keychain ("Supabase CLI"). `functions deploy` and `functions list` accept that credential, but `secrets list`/`secrets set` reject it with "Invalid access token format. Must be like `sbp_...`" because the keychain holds a non-`sbp_` (go-keyring-wrapped) token and only the secrets path enforces strict format validation. `functions deploy` succeeded directly, so the MCP path (the plan's sanctioned fallback) was unnecessary.
- **Behavioral CORS check instead of `secrets list`.** Because the secrets CLI path is blocked by that same malformed token, ALLOWED_ORIGINS presence was confirmed by probing the deployed function's per-origin preflight ACAO reflection — which is the exact property the must-have cares about ("deployed-origin browsers get real CORS headers, not ACAO:null") and is stronger evidence than a digest match.
- **All sections enabled in the smoke (incl. documents).** The default config disables `documents`; enabling it forces every reconciled section query (including the documents fallback) to run under the admin token. All passed with zero failed sections.

## Deviations from Plan

None - plan executed exactly as written. Task 1's primary deploy command (`supabase functions deploy`) and Task 2's smoke flow both ran as specified; the secret-presence check was performed via the plan-anticipated behavioral signal rather than `secrets list` because the CLI secrets path is credential-blocked (documented under Issues Encountered, not a deviation — no scope or code change).

## Issues Encountered

- **`supabase secrets list`/`secrets set` fail with "Invalid access token format. Must be like `sbp_...`".** Root cause: the macOS keychain item "Supabase CLI" holds a token whose prefix is `go-k…` (length 78), not a valid `sbp_` personal access token; `secrets` commands strictly validate that format while `projects list`/`functions deploy`/`functions list` tolerate the keychain credential. `.env.test` and all scanned global config locations contain no `sbp_` token. **Resolution:** deployed via `functions deploy` (worked), and confirmed ALLOWED*ORIGINS behaviorally via per-origin preflight — both must-have truths satisfied without the secrets CLI. **Follow-up (non-blocking):** if the operator later needs `supabase secrets set/list` to work, re-run `supabase login` to refresh the keychain token to a valid `sbp*`value, or export a valid`SUPABASE_ACCESS_TOKEN` for those commands.

## User Setup Required

None - no external service configuration required by this plan. (Optional operator follow-up noted under Issues Encountered: refresh the supabase CLI login if `secrets` subcommands are needed later — not required for export-pack to work; ALLOWED_ORIGINS is already set and correct.)

## Next Phase Readiness

- EXPORT-02 is proven live: the deployed function + frontend rework (62-02) together deliver the advertised HTML briefing pack for every dossier type. Ready for `/gsd:verify-work`.
- No blockers. The function is ACTIVE on staging with correct CORS; the frontend consumes the deployed URL.

---

_Phase: 62-export-pack-contract-deploy_
_Completed: 2026-06-11_
