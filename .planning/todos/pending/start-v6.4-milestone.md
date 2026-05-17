---
title: Start v6.4 Stabilization & Carryover Sweep milestone
date: 2026-05-17
priority: high
source: /gsd:explore session 2026-05-17
---

# Start v6.4 milestone

v6.3 is archived and the next milestone direction is decided: **v6.4
Stabilization & Carryover Sweep** (carryover-first, then v7.0 Intelligence
Engine). Full milestone shape and rationale captured in
`.planning/notes/v6.4-milestone-shape.md`.

## Action

```
/clear
/gsd:new-milestone
```

When prompted for scope, feed the milestone shape note as input. Target shape:

- **Name:** v6.4 Stabilization & Carryover Sweep
- **Phases:** 55 (DesignV2 merge), 56 (RLS + shim), 57 (D-19..D-23), 58 (Tier-C full clear), 59 (cosmetic + CI gap)
- **Total plans (est.):** 14-18
- **Tier-C scope:** full clear (271 suppressions / 2336 nodes — all in v6.4)

## Pre-flight checks before running `/gsd:new-milestone`

- [ ] Confirm DesignV2 branch state: `git status` clean? unpushed commits?
- [ ] Confirm v6.3 tag exists locally and on origin: `git tag -l v6.3` + `git ls-remote --tags origin v6.3`
- [ ] Confirm `.planning/STATE.md` shows milestone archived (it does, as of 2026-05-17)
- [ ] Confirm no in-flight quick tasks in `.planning/quick/` — if any, decide ship-or-defer first

## After milestone is created

- [ ] Move this todo to `.planning/todos/completed/`
- [ ] Update `.planning/seeds/v7.0-intelligence-engine.md` `last_updated` if its trigger needs further refinement
- [ ] Run `/gsd:discuss-phase 55` to start Phase 55 (DesignV2 → main merge) — sequencing dependency for the rest of the milestone
