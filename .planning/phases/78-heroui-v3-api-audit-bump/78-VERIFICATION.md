---
phase: 78-heroui-v3-api-audit-bump
verified: 2026-07-03T05:05:00Z
status: passed
score: 14/14 must-haves verified
overrides_applied: 0
re_verification: false
deferred:
  - truth: 'Formal full-route EN/AR × dark/light visual re-compare against the Phase 77 baseline + axe-core sweep + portal-animation RTL smoke gating CI'
    addressed_in: 'Phase 80'
    evidence: "Phase 80 (Full-Route Visual + A11y Verification & Smoke Suite) SC1: 'All baselined surfaces (the existing Playwright specs, EN+AR × dark+light) are re-compared against the pre-token baseline captured in Phase 77…'. Phase 78's own scope was explicitly smoke depth."
---

# Phase 78: HeroUI v3 API Audit & Bump — Verification Report

**Phase Goal:** HeroUI is bumped 3.0.5 → 3.2.1 with no visual/behavioral regression. Light phase — version bump + regression sweep, not an API migration.
**Verified:** 2026-07-03T05:05:00Z
**Status:** passed
**Re-verification:** No — initial verification

Verification method: every check below was **independently re-executed** by the verifier against the main checkout at `HEAD = 332197f37` (working tree clean apart from the `.planning/ROADMAP.md` `[x]` completion marker). SUMMARY claims were treated as untrusted; the smoke screenshots were opened and inspected directly rather than trusting the recorded console counts.

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                                                                                                                           | Status     | Evidence                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `@heroui/react` + `@heroui/styles` resolve to exactly 3.2.1 in lockstep, zero 3.0.5 remnants, no v2 anywhere (ROADMAP SC1)                                                                                                      | ✓ VERIFIED | `grep -E "@heroui/(react\|styles)@3\.0\.5" pnpm-lock.yaml` → no output, **exit 1**. `grep -cE "@heroui/(react\|styles)@3\.2\.1"` → **5**. `pnpm list` → `@heroui/react 3.2.1` + `@heroui/styles 3.2.1` (single version each). `package.json:44-45` both `"3.2.1"`; `@heroui-pro/react` line 43 unchanged (`1.0.0-beta.6`). No `@heroui/*@2.*` in tree.                                         |
| 2   | Frontend tree type-checks (exit 0) on the 3.2.1 typings                                                                                                                                                                         | ✓ VERIFIED | Ran `pnpm --dir frontend type-check` → **exit 0**, `tsc --noEmit` no output.                                                                                                                                                                                                                                                                                                                   |
| 3   | Two real HeroUI Drawers mount with focus containment on the externalized react-aria runtime                                                                                                                                     | ✓ VERIFIED | Ran `pnpm --dir frontend test run ConcurrentDrawers` → **3/3 pass** (part of the 7/7 combined run). Directly exercises the only runtime-relevant 3.2.1 packaging change (react-aria externalization).                                                                                                                                                                                          |
| 4   | Bump is a single atomic, independently-revertible commit (only package.json + lockfile)                                                                                                                                         | ✓ VERIFIED | `git show --stat 10de0c95` → exactly 2 files (`frontend/package.json`, `pnpm-lock.yaml`). Migration (`41c925c5`) is a separate commit touching only `heroui-forms.tsx`.                                                                                                                                                                                                                        |
| 5   | Production build succeeds on 3.2.1                                                                                                                                                                                              | ✓ VERIFIED | Ran `pnpm --dir frontend build` → **exit 0**, built in 12.39s, `frontend/dist/index.html` exists.                                                                                                                                                                                                                                                                                              |
| 6   | ALL size-limit budgets green (REQUIRED CI gate)                                                                                                                                                                                 | ✓ VERIFIED | Ran `pnpm --dir frontend size` → **exit 0**; `grep -i exceed` over full log → **0 hits**. HeroUI vendor **3.56 kB / 9 kB**; Total JS **2.65 MB / 2.78 MB**.                                                                                                                                                                                                                                    |
| 7   | AppShell drawer + TweaksDrawer render in EN with zero app/HeroUI console errors                                                                                                                                                 | ✓ VERIFIED | Screenshot `en-tweaks-drawer.png` inspected: TweaksDrawer open on right edge, Theme/Density/Reading-Direction/Ribbon controls render, Linear dark tokens, dashboard KPIs (3/18/2) behind. Corroborated by ConcurrentDrawers oracle; recorded app-console errors 0. tasks-get CORS network noise is pre-existing infra (per briefing), not HeroUI.                                              |
| 8   | Same drawers render in AR (`html[dir=rtl]`, Tajawal) with zero app/HeroUI console errors (ROADMAP SC3, smoke depth)                                                                                                             | ✓ VERIFIED | Screenshot `ar-appshell-drawer.png` inspected: fully Arabic nav (الموقف/الارتباطات/التقويم/الملخصات/النشاط, البلدان/المنظمات/الأشخاص/المنتديات/المواضيع/مجموعات العمل), **RTL mirrored** shell (drawer on left edge, hamburger on right, RTL text flow), Arabic (Tajawal) glyphs, Linear dark tokens, KPIs matching EN. Formal full-route re-compare deferred to Phase 80 by design.           |
| 9   | The one expected visual delta (drawer thin scrollbars) is pre-recorded as intentional, not flagged as regression                                                                                                                | ✓ VERIFIED | 78-04-SUMMARY §"Expected upstream delta" + plan 78-04 Task 2 step 4 both pre-record the `@apply … scrollbar` drawer-body rule as the single intentional 3.2.1 CSS change; zero app CSS added to counter it.                                                                                                                                                                                    |
| 10  | `heroui-forms.tsx` renders the v3.2.0 `*.Content` composition for both toggles                                                                                                                                                  | ✓ VERIFIED | `grep -c HeroUICheckbox.Content` = 2, `HeroUISwitch.Content` = 2. Read markup: root = Field wrapper; `*.Content` wraps `Control(+Indicator/Thumb)` + plain `{label}` text; `Description` is a sibling of Content — the canonical anatomy.                                                                                                                                                      |
| 11  | Label-click toggles both Checkbox and Switch under 3.2.1 — behavioral oracle passes (the test tsc cannot provide)                                                                                                               | ✓ VERIFIED | Ran `pnpm --dir frontend test run heroui-forms` → **4/4 pass**. Oracle resolves the control by its visible-label accessible name (`getByRole('checkbox'\|'switch',{name})`) + clicks it + asserts `onChange(true)` + checked, plus a structural `<label>`-ancestor assertion. Documented RED against the old markup (78-02-SUMMARY). Faithful jsdom proxy for label-click; honestly disclosed. |
| 12  | `heroui-chip.tsx` docstring truthfully describes cva + Radix Slot (no false HeroUI-primitive claim)                                                                                                                             | ✓ VERIFIED | `grep "Real @heroui/react Chip primitive"` → no output (exit 1). Read header: states it "is NOT a HeroUI primitive and imports nothing from `@heroui/react`… built on `cva` + `@radix-ui/react-slot`"; Phase 33-05 provenance kept; comment-only.                                                                                                                                              |
| 13  | Migration + test + docstring commits are separate from the 78-01 bump (independently revertible)                                                                                                                                | ✓ VERIFIED | Distinct SHAs in history: bump `10de0c95` → test `b7c98c41` → migrate `41c925c5` → docstring `47a6a75e` → protocol `97e4a2d6` → gate `332197f37`.                                                                                                                                                                                                                                              |
| 14  | Phase 75 protocol re-run holds on 3.2.1: import-site count 8 (test file absent), 0 removed-name imports (exit 1), type-check exit 0, compound dot-notation present, 0 flat-prop stragglers, every delta explained (ROADMAP SC2) | ✓ VERIFIED | Re-ran all 4 commands myself: import count **8** (heroui-forms.test.tsx absent — imports only `./heroui-forms`), removed-name grep **exit 1**, type-check **exit 0**, Content greps present. Artifact `78-PROTOCOL-RERUN.md` (268 lines) records all markers + "Diff vs Phase 75" + all 5 false-positive guards + the single explained `*.Content` delta. Straggler count 0.                   |

**Score:** 14/14 truths verified

### Deferred Items

| #   | Item                                                                                                                                | Addressed In | Evidence                                                                                                                                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Formal full-route EN/AR × dark/light visual re-compare vs Phase 77 baseline + axe-core sweep + portal-animation RTL smoke gating CI | Phase 80     | Phase 80 "Full-Route Visual + A11y Verification & Smoke Suite" SC1–SC3. Phase 78's criterion 3 was explicitly scoped to **smoke depth**; the formal re-compare is Phase 80's job. |

### Required Artifacts

| Artifact                                           | Expected                                         | Status     | Details                                                                             |
| -------------------------------------------------- | ------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------- |
| `frontend/package.json`                            | Exact coupled 3.2.1 pins                         | ✓ VERIFIED | Lines 44-45 both `"3.2.1"`; pro line untouched                                      |
| `pnpm-lock.yaml`                                   | Single-version resolution both packages          | ✓ VERIFIED | 0×3.0.5, 5×3.2.1, single version each                                               |
| `frontend/src/components/ui/heroui-forms.tsx`      | Migrated toggle wrappers (`*.Content`)           | ✓ VERIFIED | Both wrappers on `*.Content`; props/exports unchanged                               |
| `frontend/src/components/ui/heroui-forms.test.tsx` | Behavioral oracle, imports only `./heroui-forms` | ✓ VERIFIED | 85 lines, 4 tests, 0 `@heroui/react` imports (import from `./heroui-forms` line 32) |
| `frontend/src/components/ui/heroui-chip.tsx`       | Corrected docstring                              | ✓ VERIFIED | Honest cva + Radix Slot header; comment-only change                                 |
| `.planning/.../78-PROTOCOL-RERUN.md`               | Evidence-paired re-run (≥60 lines)               | ✓ VERIFIED | 268 lines; 4 commands + raw output + dates + diff + 5 guards                        |
| `frontend/dist/index.html`                         | 3.2.1 build output                               | ✓ VERIFIED | Exists after `pnpm build` exit 0                                                    |

### Key Link Verification

| From                       | To                                | Via                                                          | Status  | Details                                                                  |
| -------------------------- | --------------------------------- | ------------------------------------------------------------ | ------- | ------------------------------------------------------------------------ |
| `heroui-forms.test.tsx`    | `heroui-forms.tsx`                | import from wrapper, never `@heroui/react`                   | ✓ WIRED | Import at line 32; keeps protocol count at 8                             |
| `HeroUICheckbox.Content`   | Control + label text              | Content wraps Control+Indicator+label; Description sibling   | ✓ WIRED | Verified in markup (lines 201-207)                                       |
| `frontend/src/index.css`   | `@heroui/styles` subpaths         | `@import` lines resolving through the direct 3.2.1 dep       | ✓ WIRED | styles dep resolved to 3.2.1; build+drawer render succeed                |
| `.size-limit.json` budgets | vite manualChunks                 | react-aria externalization shifts weight to vendor catch-all | ✓ WIRED | heroui-vendor shrank to 3.56 kB; only Total JS absorbed shift; all green |
| `78-PROTOCOL-RERUN.md`     | `75-AUDIT-heroui-confirmation.md` | per-command diff                                             | ✓ WIRED | 2 references; per-command verdict table present                          |

### Behavioral Spot-Checks

| Behavior                       | Command                                                                | Result                                    | Status |
| ------------------------------ | ---------------------------------------------------------------------- | ----------------------------------------- | ------ |
| Type-check on 3.2.1            | `pnpm --dir frontend type-check`                                       | exit 0                                    | ✓ PASS |
| Toggle oracle + Drawer runtime | `pnpm --dir frontend test run heroui-forms ConcurrentDrawers`          | Test Files 2 passed, Tests 7 passed       | ✓ PASS |
| Production build               | `pnpm --dir frontend build`                                            | exit 0, dist/index.html produced (12.39s) | ✓ PASS |
| Bundle Size REQUIRED gate      | `pnpm --dir frontend size`                                             | exit 0, 0 `exceeded` lines                | ✓ PASS |
| Import-site count              | `grep -rlnE "from ['\"]@heroui/react['\"]" … \| grep -vc node_modules` | 8                                         | ✓ PASS |
| Removed-name imports           | protocol command 2 grep                                                | no output, exit 1                         | ✓ PASS |

### Probe Execution

No `scripts/*/tests/probe-*.sh` probes exist for this phase. The phase's "protocol" is the 4 Phase-75 commands, which the verifier **independently re-executed** (import count 8, removed-name exit 1, type-check exit 0, Content composition present) rather than trusting the recorded outputs — see truth #14 and Behavioral Spot-Checks.

### Requirements Coverage

| Requirement | Source Plan  | Description                                                                                                                                                  | Status      | Evidence                                                                                                                                                                    |
| ----------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HEROUI-01   | 78-01, 78-04 | `@heroui/react`/`@heroui/styles` bump 3.0.5 → 3.2.1 (lockstep)                                                                                               | ✓ SATISFIED | Lockstep 3.2.1 (truths 1-4), build + REQUIRED size gate green (5-6), EN/AR drawer smoke corroborated by screenshots + ConcurrentDrawers (7-9)                               |
| HEROUI-02   | 78-02, 78-03 | Residual flat-prop call sites converted to compound-component pattern (confirmation; the one real range breaking change is the toggles `*.Content` refactor) | ✓ SATISFIED | Toggles migrated to `*.Content` + behavioral oracle 4/4 (truths 10-11), chip docstring honest (12), protocol re-run holds: 8 sites / 0 removed / exit 0 / 0 stragglers (14) |

No orphaned requirements: REQUIREMENTS.md maps only HEROUI-01 + HEROUI-02 to Phase 78, both claimed by plans and both satisfied.

### Data-Flow Trace (Level 4)

Not applicable in the dynamic-data sense — this phase ships a dependency bump plus a wrapper-markup migration, not data-rendering surfaces. The equivalent "does real behavior flow" check is the drawer runtime (ConcurrentDrawers mounts two real Drawers with focus containment — passed) and the toggle oracle (label-resolved control actually flips `onChange(true)` + checked — passed).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact                                                                                                                                                                                 |
| ---- | ---- | ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| —    | —    | None    | —        | `grep -nE "TBD\|FIXME\|XXX\|HACK\|PLACEHOLDER\|not yet implemented\|coming soon"` over all 3 phase-modified source files → clean. No stubs, no debt markers, no empty-return handlers. |

### Human Verification Required

None gating. The live EN/AR render smoke — normally a human-class visual/RTL check — was independently corroborated three ways: (1) the verifier opened and inspected the on-disk screenshots (`ar-appshell-drawer.png` shows correct RTL Arabic render; `en-tweaks-drawer.png` shows the drawer + controls), (2) the automated `ConcurrentDrawers` jsdom oracle (the materially-changed runtime) passed on re-run, (3) the recorded app-console-error metric is 0/0 with the only network noise being the pre-cleared `tasks-get` CORS infra gap. The **formal** full-route visual + axe-core + portal-RTL verification is Phase 80's explicit scope (see Deferred Items) and is not a Phase 78 gate.

### Gaps Summary

No gaps. Both requirements (HEROUI-01, HEROUI-02) and all three ROADMAP success criteria are satisfied with independently re-executed evidence:

1. **Lockstep 3.2.1** — verified in `package.json` + `pnpm-lock.yaml` (0×3.0.5, single 3.2.1 each), atomic revertible commit `10de0c95`.
2. **Phase 75 confirmation holds** — 8 import sites, 0 removed-name imports (exit 1), type-check exit 0, compound API present, 0 flat-prop stragglers; the single `*.Content` delta is the intended 78-02 toggles migration, and the one real range breaking change (toggles composition) is closed with a behavioral vitest oracle (4/4) that tsc/grep are blind to.
3. **Renders without regression EN + AR (smoke depth)** — build + REQUIRED size gate green (heroui-vendor 3.56 kB, Total JS 2.65 MB); EN/AR drawers render with RTL/Tajawal confirmed via inspected screenshots; the one expected upstream visual delta (thin scrollbars) is pre-recorded, not chased.

The CONTEXT.md locked decision (light bump, do NOT re-open a v2→v3 migration narrative) was honored — no migration narrative surfaced; the work was a coupled bump + the one shipped toggles refactor + confirmation evidence.

---

_Verified: 2026-07-03T05:05:00Z_
_Verifier: Claude (gsd-verifier)_
