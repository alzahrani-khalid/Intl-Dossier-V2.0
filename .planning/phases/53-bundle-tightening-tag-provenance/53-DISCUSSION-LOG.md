# Phase 53: Bundle Tightening + Tag Provenance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `53-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 53-bundle-tightening-tag-provenance
**Areas discussed:** Ceiling value & slack rule, Re-measurement before lock, Tag signing mechanism, Tag push posture after re-issue, CLAUDE.md Node note scope

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Ceiling value & slack rule | BUNDLE-05 exact number + headroom rule | ✓ |
| Re-measurement before lock | Fresh ANALYZE pass vs trust May 12 audit | ✓ |
| Tag signing mechanism | SSH vs GPG, key choice, config location | ✓ |
| Tag push posture after re-issue | Force-push origin vs local-only | ✓ |

**User's choice:** All four areas selected.
**Notes:** Phase 53 has unusually narrow scope (3 requirements). User opted to discuss every gray area rather than auto-resolve.

---

## Ceiling value & slack rule

### Q1 — React vendor ceiling: how strict?

| Option | Description | Selected |
|--------|-------------|----------|
| 285 KB (D-03 standard) | Apply Phase 49 D-03 verbatim: `ceil(279.92 + 5) = 285`. Matches roadmap "~285 KB". | ✓ |
| 284 KB (tighter, floor+5) | Round down `279.92 + 5 = 284.92 → 284`. Trips on legitimate React minor upgrades (~1 KB). | |
| 290 KB (10 KB headroom) | Extra slack. Absorbs ~5 KB of silent drift; violates D-03 spirit. | |
| Lock at re-measured value + 5 KB | Defer to fresh ANALYZE pass; apply same rule to whatever it shows. | |

**Notes:** D-03 verbatim wins; user wanted consistency with TanStack/HeroUI/Sentry/DnD entries already on that rule. Captured as D-01 in CONTEXT.md; the "re-measure then apply rule" idea folded into D-02 — same rule applied to whatever fresh measurement shows.

### Q2 — bundle-budget.md update style

| Option | Description | Selected |
|--------|-------------|----------|
| Rewrite row with Phase 53 audit date | Replace 349 → 285, update date, new rationale referencing the Phase 49 deferral. | ✓ |
| Append Phase 53 note, keep Phase 49 prose | Add row or trailing paragraph; preserves Phase 49 history. | |
| Minimal edit: ceiling cell + date only | Just change 349 → 285 and Last audited; keep old rationale. | |

**Notes:** Living-doc treatment — current state in the doc, lineage in git + plan SUMMARY.md. Captured as D-03 in CONTEXT.md.

---

## Re-measurement before lock

### Q1 — Fresh ANALYZE pass before locking ceiling?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — fresh measurement, recompute | Run on phase-53-base; recompute if fresh number differs. | ✓ |
| Trust 2026-05-12 measurement, lock 285 | tunnel-rat affected vendor super-chunk only; faster phase. | |
| Measure all chunks, retune all ceilings | Full re-audit; scope creep. | |

**Notes:** Verification preferred over assumption. Captured as D-02 in CONTEXT.md with the explicit caveat that only the React vendor ceiling is recomputed — other chunks deferred.

### Q2 — Where to commit fresh audit evidence?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline note in bundle-budget.md row | One-row update + Last audited date. | ✓ |
| 53-BUNDLE-AUDIT.md sibling artifact | Mirror Phase 49 pattern: separate file with top-20, deltas. | |
| Plan SUMMARY.md only | Capture in plan close docs; no .planning/ artifact. | |

**Notes:** Phase 53 changes one row; an audit artifact mirrors Phase 49's broader scope and adds unjustified files. Captured as D-04 in CONTEXT.md.

---

## Tag signing mechanism

### Q1 — Signing key type?

| Option | Description | Selected |
|--------|-------------|----------|
| SSH-sign | Reuses GitHub SSH key, no new keyring, GH "Verified" badge supported. | ✓ |
| GPG-sign | Traditional, more tooling; needs keyring on every signing machine. | |
| Skip signing, annotated-only | Fails `git tag -v` ("no signature found") — blocks BUNDLE-06 acceptance. | |

**Notes:** SSH chosen for solo-dev simplicity. Captured as D-05 in CONTEXT.md.

### Q2 — Signing-key scope and persistence?

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse existing GitHub SSH key | Use the key already trusted by GitHub for auth. | ✓ |
| Generate Phase 53 dedicated signing key | Separate "signing-only" key. More key management. | |
| Document setup, leave key choice to executor | Less prescriptive; risks per-machine inconsistency. | |

**Notes:** Single identity, less surface area. Captured as D-06 in CONTEXT.md. May require enrolling the SSH key as a "Signing Key" on GitHub (separate from auth-key enrollment) — flagged as a one-time setup step in the plan.

### Q3 — Where do the signing config commands land?

| Option | Description | Selected |
|--------|-------------|----------|
| Local (~/.gitconfig) only | Per-user identity state; not committed; CLAUDE.md appendix documents commands. | ✓ |
| Commit setup script (scripts/setup-tag-signing.sh) | Idempotent script; easier multi-machine reproduction. | |
| Document in CLAUDE.md, no script | Verbatim commands in CLAUDE.md; solo dev runs once. | |

**Notes:** Solo-dev pragmatism — one-time setup doesn't justify a script. Documentation in CLAUDE.md is sufficient. Captured as D-07 in CONTEXT.md.

---

## Tag push posture after re-issue

### Q1 — What happens to origin after local re-issue?

| Option | Description | Selected |
|--------|-------------|----------|
| Force-push all three to origin | `git push --force origin <tag>` per tag; remote matches local; standard re-issue idiom. | ✓ |
| Local-only re-issue, leave origin alone | Roadmap silent on remote; lower blast radius; fresh clones see old lightweight tags. | |
| Delete old origin tags first, then push fresh | Two-step; same end state; slightly safer audit trail. | |

**Notes:** Consistent posture — local and origin must agree. Captured as D-10 in CONTEXT.md.

### Q2 — Tag message format?

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve existing message format | `"Phase NN diff anchor — <slug>"` matching phase-49-base. | ✓ |
| Expand with link to phase SUMMARY.md | Multi-line; more context in `tag -v` output. | |
| Add Phase 53 re-issue note | Append "Re-issued 2026-05-XX per BUNDLE-06" to each message. | |

**Notes:** Existing format wins for consistency. Re-issue paper trail lives in the Phase 53 plan SUMMARY.md and git tag object dates. Captured as D-09 in CONTEXT.md.

---

## CLAUDE.md Node note scope (BUNDLE-07)

### Q — Which lines to update?

| Option | Description | Selected |
|--------|-------------|----------|
| Update both lines to Node.js 22.13.0+ | Lines 84 + 457; both align to engines.node. | ✓ |
| Only update line 457 (Runtime) | Strict reading of roadmap "Node engine note" singular. | |
| Update line 457 + remove line 84 | Drop redundant reference entirely. | |

**Notes:** Aligning both removes the doc-vs-engines drift completely. Removing line 84 entirely was tempting but a doc-cleanup beyond strict BUNDLE-07 scope. Captured as D-11 in CONTEXT.md; full removal noted in Deferred Ideas.

---

## Claude's Discretion

- **Plan split granularity** — one, two, or three plans. Natural cleavage exists per requirement but small surface justifies a single plan.
- **Execution order** — BUNDLE-07 independent of others; BUNDLE-05 should land before tag operations if phase-53-base anchors the post-tighten state.
- **Whether to add a local `pnpm size-limit` verification step in the plan** — already enforced by Phase 49 D-10 branch protection.

## Deferred Ideas

- Tighten all other size-limit ceilings by Phase 49 D-03 — full re-audit; its own phase.
- `tag.gpgsign = true` global config — makes future tags signed-by-default. Useful but not BUNDLE-06.
- CI gate for `git tag -v phase-*-base` on PRs — provenance enforcement permanently. BUNDLE-06 only requires "succeeds locally".
- Standardize tag message format across the whole repo (not just `phase-NN-base`). Tags/governance phase.
- Reduce vendor super-chunk further (exceljs, dotted-map, tiptap/prosemirror, proj4, date-fns wildcards) — already documented in `bundle-budget.md` Residual vendor chunk table.
- Remove the redundant Node reference at line 84 entirely (after aligning per D-11). Future cleanup phase.
