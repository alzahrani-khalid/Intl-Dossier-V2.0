# Phase 53: Bundle Tightening + Tag Provenance - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Three narrow hygiene tasks that close v6.2/v6.3 carryover before v7.0 Intelligence Engine work begins:

1. **BUNDLE-05** — Tighten the `frontend/.size-limit.json` React vendor ceiling from the current 349 KB gz to the Phase 49 D-03 standard (`min(current, measured + 5 KB)`). Phase 49 measured react-vendor at 279.92 KB on 2026-05-12 and deliberately deferred lowering the ceiling ("not lowered to keep the Plan-02 diff surgical"). Phase 53 applies the rule. Fresh `ANALYZE=true pnpm build` measurement is taken on phase-53-base (post-Phase-52 `tunnel-rat` removal) to confirm or refine the value before lock. `Bundle Size Check (size-limit)` must continue to exit 0 on `main`.

2. **BUNDLE-06** — Re-issue `phase-47-base`, `phase-48-base`, and `phase-49-base` as **annotated + signed** tags so `git tag -v <name>` succeeds locally. `phase-47-base` and `phase-48-base` are currently lightweight (commit-typed) refs; `phase-49-base` is annotated but unsigned. SSH-signing is configured (no GPG keyring); the existing GitHub SSH key is reused as the signing identity. Local re-issue is force-pushed to `origin` so remote tag verification matches local.

3. **BUNDLE-07** — Update CLAUDE.md Node engine references to match `package.json` `engines.node: ">=22.13.0"`. Two stale lines exist (line 84 "Node.js 18+ LTS", line 457 "Node.js 20.19.0+"); both align to "Node.js 22.13.0+".

Scope is hygiene only — no new build tooling, no chunk strategy changes beyond the ceiling number, no CI workflow edits beyond what BUNDLE-05 already requires. v7.0 Intelligence Engine work (Phase 54+) is explicitly out of scope.

Measured starting points (from `frontend/docs/bundle-budget.md` 2026-05-12 audit):
- React vendor gz: **279.92 KB** (current ceiling 349 KB — overshoot 69 KB)
- Initial JS gz: 412.06 KB (ceiling 450, untouched in this phase)
- Total JS gz: 2.42 MB (ceiling 2.45, untouched in this phase)

</domain>

<decisions>
## Implementation Decisions

### React vendor ceiling rebaseline (BUNDLE-05)

- **D-01:** Apply Phase 49 D-03 verbatim — `ceiling = min(current, measured + 5 KB)`. With the 2026-05-12 measurement of 279.92 KB, the computed ceiling rounds up to **285 KB gz** (`ceil(279.92 + 5)`). Matches the roadmap "~285 KB" target exactly. ~1.8% slack absorbs React minor-version drift; tighter (284 KB) would trip on every legitimate minor upgrade.

- **D-02:** Take a **fresh `ANALYZE=true pnpm build` measurement on phase-53-base** before locking the ceiling. Rationale: Phase 52 D-19 removed `tunnel-rat` from the lockfile (post-2026-05-12 audit). `tunnel-rat` lived in kibo-ui (not react-vendor by `manualChunks` rule), so react-vendor gz is **unlikely** to have shifted — but verify, don't assume. If fresh measurement diverges from 279.92, recompute the ceiling via D-01's rule (`measured + 5`, rounded up). Do **not** retune any other chunks — that's scope creep beyond BUNDLE-05; goes to a follow-up phase.

- **D-03:** Update the React vendor row in `frontend/docs/bundle-budget.md` with the Phase 53 audit date, fresh gz measurement, the new 285 KB ceiling, and rationale prose: "Phase 53 applied D-03 verbatim after Phase 49 deferred. Headroom 5 KB ≈ 1.8% slack for React minor drift." Existing Phase 49 prose is replaced (not appended) — the living doc reflects current state, the lineage lives in plan SUMMARY.md and git history.

- **D-04:** No audit artifact under `.planning/phases/53-.../`. The inline update to `frontend/docs/bundle-budget.md` is the canonical evidence. Phase 49's separate `49-BUNDLE-AUDIT.md` was sized to a full re-audit; Phase 53 changes one row.

### Tag re-issue (BUNDLE-06)

- **D-05:** **SSH-sign** all three tags. `git config gpg.format ssh` + `git config user.signingkey ~/.ssh/<existing-github-key>.pub` + an `allowed_signers` file at `~/.ssh/allowed_signers` mapping `alzahrani.khalid@gmail.com` to the key. No GPG keyring is introduced. `git tag -v <name>` validates against the `allowed_signers` file. GitHub displays "Verified" badge for SSH-signed tags when the signing key matches a GitHub-registered SSH/signing key.

- **D-06:** **Reuse the existing GitHub SSH key** as the signing identity — no dedicated "Phase 53 signing key" is generated. The signing key path resolves to whichever `~/.ssh/id_*.pub` is registered on GitHub for the active user. If the user has not enrolled the SSH key as a "Signing Key" on GitHub (separate enrollment from auth-key enrollment), the plan adds that as a one-time setup step.

- **D-07:** Signing config lives in `~/.gitconfig` (global) — **not** committed to the repo. Per-user identity state. The plan documents the verbatim `git config` commands in a `CLAUDE.md` "Tag signing setup" appendix (or similar named section) so a second machine can be configured in seconds. No `scripts/setup-tag-signing.sh` artifact is added; one-time solo-dev setup doesn't justify scripting.

- **D-08:** Tag re-issue procedure for each of `phase-47-base`, `phase-48-base`, `phase-49-base`:
  1. Capture the existing tag's target commit SHA via `git rev-parse <tag>^{commit}`.
  2. Delete the local tag: `git tag -d <tag>`.
  3. Re-create as annotated + signed at the same SHA: `git tag -a -s <tag> <sha> -m "Phase NN diff anchor — <slug>"`.
  4. Verify locally: `git tag -v <tag>` exits 0.
  5. Force-push to origin: `git push --force origin <tag>`.

- **D-09:** **Preserve the existing tag message format** — `"Phase NN diff anchor — <slug>"`. This matches `phase-49-base` verbatim. Slugs come from ROADMAP.md phase names:
  - `phase-47-base` → "Phase 47 diff anchor — type-check-zero"
  - `phase-48-base` → "Phase 48 diff anchor — lint-config-alignment"
  - `phase-49-base` → "Phase 49 diff anchor — bundle-budget-reset" (unchanged)
  No expansion to multi-line bodies, no "re-issued 2026-05-XX" suffix — the re-issue paper trail lives in the Phase 53 plan SUMMARY.md and git tag object dates.

- **D-10:** **Force-push all three tags to `origin`** after local re-issue. Remote and local must agree so a fresh clone can `git tag -v` successfully without the user needing local fixup. Tag refs are not shared-history like branches — `--force` push on tags is the standard re-issue idiom, not a destructive operation in the branch-rewrite sense. No two-step delete-then-push is needed; `--force` is atomic and clearer.

### CLAUDE.md Node engine alignment (BUNDLE-07)

- **D-11:** **Update both** stale Node references in `CLAUDE.md` to `Node.js 22.13.0+`:
  - Line ~84 (Core Tech Stack → Backend): `"Node.js 18+ LTS"` → `"Node.js 22.13.0+"`. Reading "18+ LTS" was a v2.0-era looser description; aligning to engines.node removes drift between docs and the lockfile floor.
  - Line ~457 (Technology Stack → Runtime): `"Node.js 20.19.0+"` → `"Node.js 22.13.0+"`. This is the explicit runtime floor; was bumped post-engines update but not synchronized with engines.node.
  Both lines now match `package.json` `engines.node: ">=22.13.0"`. Mechanical edit; no rewording of surrounding prose.

### Claude's Discretion

- **Plan split granularity.** One plan, two, or three is the planner's call. Natural cleavage: 53-01 = BUNDLE-05 (audit + ceiling tighten + bundle-budget.md update); 53-02 = BUNDLE-06 (signing config + tag re-issue + push); 53-03 = BUNDLE-07 (CLAUDE.md Node note). All three could land in a single plan given the small surface area; the planner picks based on whether any plan exceeds plan-budget heuristics.
- **Order of execution.** BUNDLE-07 has no dependency on BUNDLE-05 or BUNDLE-06; can run in parallel or first. BUNDLE-05 should land before any tag operation if `phase-53-base` is meant to anchor the post-tighten state. BUNDLE-06 sequencing is independent of the others.
- **Whether to add the `Bundle Size Check (size-limit)` job confirmation to the plan close** — the success criterion says "exits 0 on `main`", which is already enforced by Phase 49 D-10 / D-11 branch protection. No new CI wiring is required; the planner decides if a verification step (`pnpm -C frontend size-limit` locally after the ceiling change) is plan-explicit or assumed.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements

- `.planning/ROADMAP.md` §"Phase 53: Bundle Tightening + Tag Provenance" — Goal, depends-on (Phase 50/52), success criteria.
- `.planning/REQUIREMENTS.md` §"v6.3 Bundle (BUNDLE-05..07)" — verbatim acceptance text for the three requirements.
- `.planning/STATE.md` §"Phase 52 summary" + "Next Action" — confirms Phase 52 closed PASS-WITH-DEVIATION, Phase 53 unblocked, `tunnel-rat` removal context.

### Prior phase context (carried forward — read for posture and rules)

- `.planning/phases/49-bundle-budget-reset/49-CONTEXT.md` — **MUST READ**. D-03 establishes the `min(current, measured + 5 KB)` rebaseline rule applied verbatim in Phase 53 D-01. D-09 establishes the `bundle-budget.md` living-rationale doc. D-14 establishes the "zero net-new ceiling raises" suppression policy (Phase 53 honors this; the lone change is a *lowering*).
- `.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md` — Phase 49's full audit artifact; reference for the per-chunk methodology Phase 53's narrower re-measurement follows.
- `.planning/phases/47-type-check-zero/47-CONTEXT.md` — D-13 smoke-PR pattern (not applied here; BUNDLE-05 doesn't add a new gate). Read for `enforce_admins: true` posture context.
- `.planning/phases/48-lint-config-alignment/48-CONTEXT.md` — D-14 single-CI-job posture; D-17 zero-net-new-suppression rule (Phase 53 carries this for the ceiling-lowering, not raising).
- `.planning/phases/52-heroui-v3-kanban-migration/52-CONTEXT.md` (and 52-SUMMARY.md) — context for the `tunnel-rat` removal in Phase 52 D-19; informs the D-02 fresh-measurement decision.

### Project conventions (non-negotiable)

- `CLAUDE.md` §"Karpathy Coding Principles" §3 "Surgical Changes" — bounds Phase 53 to the three named edits; no opportunistic refactors of `bundle-budget.md`, `vite.config.ts`, or `.size-limit.json` beyond what BUNDLE-05/06/07 require.
- `CLAUDE.md` §"Logging" + §"Component Library Strategy" — informs why `sentry-vendor` / `heroui-vendor` exist as separate chunks (read for context if the fresh `ANALYZE` audit shows unexpected shifts).
- `CLAUDE.md` Node engine note (lines ~84 and ~457) — the targets of BUNDLE-07 D-11.

### Build + CI wiring (read before changing)

- `frontend/.size-limit.json` — current ceilings. BUNDLE-05 D-01 changes only the "React vendor" entry's `limit` value from `"349 KB"` to `"285 KB"` (or the recomputed value from D-02's fresh measurement).
- `frontend/docs/bundle-budget.md` — living rationale doc. BUNDLE-05 D-03 rewrites the React vendor row only.
- `frontend/vite.config.ts` — `manualChunks` arrow defines react-vendor's contents (no edits this phase; reference only).
- `frontend/scripts/assert-size-limit-matches.mjs` — sanity check that every `.size-limit.json` glob matches a built file. The React vendor glob is unchanged; this script's pass/fail state should remain green.
- `.github/workflows/ci.yml` §`bundle-size-check` — exists with `needs: [lint, type-check]` chain. No edits this phase; ceiling enforcement is via the `limit` value in `.size-limit.json`.

### Git + signing references

- `package.json` `engines.node` — the source-of-truth Node floor that BUNDLE-07 aligns CLAUDE.md to (`">=22.13.0"`).
- `git tag -v` documentation behavior — annotated tags pass with metadata; signed tags require the signature to verify against `allowed_signers`. SSH signing is supported in git 2.34+ (confirmed available locally).

### Codebase maps

- `.planning/codebase/STACK.md` — dep inventory; consult if the D-02 fresh measurement shows react-vendor shift and the cause is non-obvious.
- `.planning/codebase/STRUCTURE.md` §"frontend/" — confirms `frontend/.size-limit.json` and `frontend/docs/bundle-budget.md` are the right edit surfaces.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **Phase 49 D-03 rebaseline rule** (`min(current, measured + 5 KB)`) — already operational across all other size-limit entries. Phase 53 BUNDLE-05 is a single-row application of the rule, not a new policy.
- **`rollup-plugin-visualizer` + `ANALYZE=true pnpm build`** — already wired in `vite.config.ts` (per 49-CONTEXT.md D-05). D-02 reuses verbatim.
- **`frontend/docs/bundle-budget.md`** — living rationale doc already in repo; D-03 edits one row.
- **`phase-49-base` tag** — already an annotated tag with the canonical message format `"Phase 49 diff anchor — bundle-budget-reset"`. D-09 copies this format for the other two.
- **`.size-limit.json` `assert-size-limit-matches.mjs` sanity-check pattern** — Phase 49's D-11 / Phase 53 inherits without change.
- **GitHub branch protection on `main` (Phase 49 D-10)** — `Bundle Size Check (size-limit)` is already a required context. The Phase 53 ceiling change benefits from this gate by default.

### Established Patterns

- **Surgical single-row edits to `bundle-budget.md`** — Phase 49 D-09 set the precedent: edit only the row that changed, keep the rest of the doc stable.
- **Phase-base tags as diff anchors** — every phase since 47 has had `phase-NN-base` to anchor pre-phase diffs. Phase 53 normalizes the provenance of the three existing tags; new tags going forward are created annotated + signed from the start (out-of-scope for Phase 53 but worth noting for Phase 54+).
- **Solo-dev SSH-signed commits/tags** — no GPG keyring infra in the project; SSH is the lighter, faster path. CLAUDE.md's "Deployment Configuration" already documents SSH-key-based DigitalOcean access — same posture.
- **Zero net-new ceiling raises per Phase 49 D-14** — Phase 53 is a *lowering* (not a raise) and a one-line CLAUDE.md edit (not a suppression). Honors the suppression-policy spirit by definition.

### Integration Points

- **`frontend/.size-limit.json`** — one-line edit to the React vendor `limit` field.
- **`frontend/docs/bundle-budget.md`** — one-row rewrite in the Ceilings table.
- **`CLAUDE.md`** — two-line edit to align Node references.
- **`~/.gitconfig` (user-local, not repo state)** — SSH signing config set once by the executor running the plan.
- **`origin` tag refs** — force-pushed three tags after local re-issue.

### Notable observations

- **`phase-49-base` already has the right tag message** but is unsigned; D-08 re-creates it at the same SHA with `-a -s`. The annotated-only state is treated identically to lightweight for purposes of "needs re-issue" because `git tag -v` fails with "no signature found" on annotated-unsigned tags.
- **No `commit.gpgsign` / `tag.gpgsign` is set** today, meaning future tags would be lightweight unless the plan adds a `tag.gpgsign = true` to global gitconfig. D-07 leaves this as the executor's choice — useful but not required for BUNDLE-06 acceptance.

</code_context>

<specifics>
## Specific Ideas

- **Ceiling number target**: 285 KB exact (the rounded D-03 application), with the D-02 fresh measurement providing the audit trail that 285 is honest. If fresh measurement shows e.g. 281 KB, ceiling becomes 286 KB per D-01 — recomputed honestly, not pre-locked.
- **Tag verification command for plan acceptance evidence**: `git tag -v phase-47-base && git tag -v phase-48-base && git tag -v phase-49-base` must all exit 0. Capture the verbatim output (showing "Good signature from") in the plan SUMMARY.md.
- **CLAUDE.md edit is a literal find-and-replace**: `"Node.js 18+ LTS"` → `"Node.js 22.13.0+"` on line ~84; `"Node.js 20.19.0+"` → `"Node.js 22.13.0+"` on line ~457. No surrounding prose changes.
- **SSH signing setup documentation**: Add a "Tag signing setup" section to CLAUDE.md (Deployment Configuration neighborhood) with the verbatim three commands: `git config --global gpg.format ssh`, `git config --global user.signingkey ~/.ssh/<key>.pub`, `git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers`. Plus the `allowed_signers` file line format: `<email> <key-type> <key-public-blob>`. This makes a second-machine setup a 4-step copy/paste.

</specifics>

<deferred>
## Deferred Ideas

- **Tighten all other size-limit entries by D-03** — only React vendor is the named BUNDLE-05 target. Other chunks (Initial JS, HeroUI, Sentry, DnD, signature-visuals/*) may have headroom worth reclaiming, but a full re-audit is its own phase. Captured as "v7.0+ bundle hygiene follow-up".
- **`tag.gpgsign = true` global config** — making future tags signed-by-default. Useful but not required by BUNDLE-06. Leave for the executor or a v7.0 onboarding doc.
- **CI gate for `git tag -v` on `phase-*-base` tags** — would enforce provenance permanently. BUNDLE-06 only requires "succeeds locally"; CI enforcement is scope creep into a CI-policy phase.
- **Standardize tag message format across the project** (currently only `phase-NN-base` follows the `"Phase NN diff anchor — <slug>"` shape; other ad-hoc tags do not). Belongs in a tags/governance phase, not a hygiene phase.
- **Reduce vendor super-chunk further** (`exceljs`, `dotted-map`, `tiptap`/`prosemirror`, `proj4`, `date-fns` wildcard imports) — documented in `bundle-budget.md` "Residual vendor chunk" table as Phase 49 follow-ups. Each is its own refactor (named-import conversion, lazy-import expansion); none belong in BUNDLE-05's narrow scope.
- **Remove the redundant `Node.js 18+ LTS` reference entirely from CLAUDE.md** — D-11 aligns both lines but leaves both present. A future cleanup phase could deduplicate. Not blocking.

</deferred>

---

*Phase: 53-bundle-tightening-tag-provenance*
*Context gathered: 2026-05-16*
