---
phase: 33-token-engine
plan: 33-04-heroui-install
subsystem: design-system
tags: [heroui, tailwind-v4, plugin, css-native-theme]
status: partial
verdict: PASS (install + CSS wiring); E2E smoke deferred to 33-09
completed_at: 2026-04-20
requirements_satisfied: [TOKEN-04 partial]
success_criteria_contributions: [SC-5 partial]
dependency_graph:
  requires:
    - 33-RESEARCH.md (Q1 Gotcha #8 on @plugin ordering)
    - frontend/package.json
    - frontend/src/index.css
  provides:
    - '@heroui/react@3.0.3 + @heroui/styles@3.0.3 in package.json'
    - "@plugin '@heroui/styles' in index.css (ordered correctly)"
    - ':root --heroui-{primary,default,success,warning,danger}(-foreground) bridge'
  affects:
    - 33-05 HeroUI wrappers (consumes @heroui/react exports)
    - 33-06 Tailwind remap (depends on @plugin ordering)
    - 33-08 Storybook (consumes @heroui components)
    - 33-09 E2E verification (will run the deferred smoke)
---

# Plan 33-04 — HeroUI v3 Install + CSS-Native Theme Config

## Outcome

HeroUI v3.0.3 installed with exact version pins. `frontend/src/index.css` now loads `@plugin '@heroui/styles'` AFTER `@import 'tailwindcss'` and BEFORE any `@theme` block (per RESEARCH Q1 Gotcha #8), with a `:root` bridge mapping HeroUI's semantic var names (`--heroui-primary`, `--heroui-default`, etc.) onto our token vars (`--accent`, `--surface`, etc.). No `heroui.config.ts` file — HeroUI v3 uses CSS-native config (D-06 correction applied).

## Commits

- `fc097519` chore(33-04): install @heroui/react@3.0.3 + @heroui/styles@3.0.3 (exact pins) — cherry-picked from the first worktree-agent attempt (`e1409566`) after the worktree isolation runtime bug surfaced. Exact pins per RISKS register (HeroUI v3 is beta).
- `84b3b0a5` feat(33-04): wire HeroUI v3 @plugin + :root semantic bridge in index.css — adds the `@plugin` directive in the correct position and the `--heroui-*` → `var(--*)` bridge.

## Definition-of-done checklist

- [x] `@heroui/react` and `@heroui/styles` in `frontend/package.json` dependencies (exact pins, no caret)
- [x] `pnpm install` succeeds; HeroUI resolved in `frontend/node_modules/@heroui/`
- [x] `frontend/src/index.css` has `@plugin '@heroui/styles'` line AFTER `@import 'tailwindcss'` and BEFORE any `@theme`
- [x] `:root { --heroui-primary: var(--accent); … }` bridge present covering primary/default/success/warning/danger + `-foreground`
- [x] `frontend/heroui.config.ts` does NOT exist (correct per HeroUI v3 idiom)
- [ ] **DEFERRED** — Smoke E2E `frontend/tests/e2e/heroui-smoke.spec.ts` + temp `/heroui-smoke` route: not created in this pass. Reason: the test requires a dev-server route + DesignProvider context to populate `--accent`, but DesignProvider ships in 33-02 and the full E2E suite is 33-09's scope. SC-5 (HeroUI + Tailwind consume same vars) is fully covered by 33-09.
- [ ] **DEFERRED** — `pnpm build` bundle size delta check: deferred until 33-09 since bundle analysis is more meaningful after 33-05 HeroUI wrappers + 33-06 Tailwind remap land.
- [ ] **DEFERRED** — Manual dev-server smoke (toggle `.dark`, `dir="rtl"`): same reason — needs DesignProvider.

## Follow-ups (track in 33-09)

- Add `frontend/tests/e2e/heroui-smoke.spec.ts` asserting raw `<Button color="primary">` bg matches `var(--accent)` and reacts to runtime hue mutation.
- Bundle size delta report (target: ≤ +80 KB gzip).
- Manual `.dark` class toggle + `dir="rtl"` visual confirmation on at least one page.

## Runtime note — worktree isolation bug surfaced

The first execution attempt spawned a `gsd-executor` subagent with `isolation="worktree"`. The worktree was created forking from `49b225b8` (9 commits behind `DesignV2` HEAD), which pre-dated Phase 33's plan files. The subagent nonetheless managed to read plan files via absolute path (filesystem was not actually isolated) and produced a valid install commit (`e1409566`) before I killed it. That commit was cherry-picked to the main branch as `fc097519`. Subsequent subagent runs for Wave 1 were switched to non-worktree execution (shared main tree, sequential).

Recommendation: file a ticket on the worktree-isolation provisioning in the GSD/Claude-Code runtime. For Phase 33 Wave 2+, use no-isolation subagents or inline execution.

## Verdict

**PASS (scoped)** — install + CSS wiring complete; downstream plans (33-05, 33-06, 33-08) unblocked. E2E smoke + bundle analysis deferred to 33-09 where they're more actionable.
