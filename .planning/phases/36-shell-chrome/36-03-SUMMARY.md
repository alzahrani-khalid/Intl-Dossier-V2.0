---
phase: 36-shell-chrome
plan: 03
type: execute
status: PASS-WITH-DEVIATION
wave: 1
requirements: [SHELL-02, SHELL-03]
completed_at: '2026-04-22T13:08:00+03:00'
commits:
  - f44b8041 · (absorbed into sibling 36-02 commit by concurrent-write race) feat(36-03): Topbar 7-item row + Tweaks trigger
  - 0db812d7 · feat(36-03): ClassificationBar with 3-variant internal switch
---

# 36-03 SUMMARY — Wave 1 Topbar + ClassificationBar (PASS-WITH-DEVIATION)

## Objective

Ship two shell-chrome surfaces for Phase 36:

1. **Topbar.tsx (SHELL-02)** — 56px row with 7 controls (menu, search+⌘K, direction switcher, notification bell, theme toggle, locale switcher, Tweaks button). Re-hosts the Phase-34 `useTweaksOpen()` API at slot 7.
2. **ClassificationBar.tsx (SHELL-03)** — single component whose internal `switch(direction)` emits 3 distinct DOM shapes (chancery marginalia / situation ribbon / ministerial+bureau chip) with a visibility gate via `useClassification()`.

Also: replace the Wave-0 RED test scaffolds (`Topbar.test.tsx`, `ClassificationBar.test.tsx`) with GREEN assertions for the 7 `it` titles listed in VALIDATION.md.

## Deliverables

| Artifact                        | Path                                                        | Status     |
| ------------------------------- | ----------------------------------------------------------- | ---------- |
| Topbar component                | `frontend/src/components/layout/Topbar.tsx`                 | ✅ shipped |
| Topbar tests (GREEN)            | `frontend/src/components/layout/Topbar.test.tsx`            | ✅ 3/3     |
| ClassificationBar component     | `frontend/src/components/layout/ClassificationBar.tsx`      | ✅ shipped |
| ClassificationBar tests (GREEN) | `frontend/src/components/layout/ClassificationBar.test.tsx` | ✅ 4/4     |

## Acceptance criteria — verification

| Criterion                                                                                          | Result                                           |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Topbar.tsx `>=` 140 lines                                                                          | ✅ 238 lines (after prettier auto-format to 237) |
| Topbar carries h-14/min-h-14, lg:hidden, `hidden lg:inline`, ms-auto, 4× role=radio                | ✅ all grep counts meet spec                     |
| Topbar calls `useTweaksOpen` (Phase-34 API re-hosted, zero duplicate state)                        | ✅ 3 references in source                        |
| Topbar zero physical-property Tailwind classes (ml-/mr-/pl-/pr-/left-/right-/text-left/text-right) | ✅ grep=0 after comment-text fix                 |
| ClassificationBar.tsx `>=` 80 lines                                                                | ✅ 137 lines                                     |
| ClassificationBar switch covers all 4 directions (chancery/situation/ministerial/bureau)           | ✅ 4 `case` labels                               |
| ClassificationBar has `if (!classif) return null` visibility gate                                  | ✅ present                                       |
| ClassificationBar emits `.cls-marginalia`, `.cls-ribbon`, `.cls-chip` class hooks                  | ✅ all 3 present                                 |
| ClassificationBar uses `ms-5` + `insetInlineStart` for RTL-safe chip anchor                        | ✅ both present (Pitfall 5 mitigation)           |
| ClassificationBar zero physical-property Tailwind classes                                          | ✅ grep=0                                        |
| `pnpm vitest run Topbar.test.tsx ClassificationBar.test.tsx` → 7 green                             | ✅ 7/7 pass, 527ms                               |

## Test run summary

```
 Test Files  2 passed (2)
      Tests  7 passed (7)
```

- Topbar.test.tsx: `item order`, `kbd hint responsive`, `tweaks trigger` — 3/3 green
- ClassificationBar.test.tsx: `visibility gate`, `chancery marginalia`, `situation ribbon`, `chip variants` — 4/4 green

## Deviations (documented)

### D-01 · Plan hook interfaces were stale — real APIs are `useDesignDirection` + `useClassification().classif`

**Plan said:** Use `useDirection()` returning `{direction, setDirection}` and `useClassification()` returning `{classification, setClassification}`.

**Actual repo:** The design-system hook is **`useDesignDirection`** (renamed in Phase 33 plan 33-02 to avoid collision with the DOM-level `@/hooks/useDirection`, which returns `{direction: 'ltr'|'rtl', isRTL}`). The classification hook returns **`{classif, setClassif}`** per `design-system/hooks/useClassification.ts`. See the header comment in `useDesignDirection.ts` that explicitly calls out the name collision.

**Decision:** Rule 3 auto-fix — both components import from `@/design-system/hooks` and use the real hook names + real return shapes. Tests also mock the real module path. Topbar.tsx + ClassificationBar.tsx carry inline header comments flagging the divergence so Wave-2/3 readers aren't surprised.

**Impact:** Zero behavior change versus what the plan intended — the hooks expose identical state, just under slightly different names. No follow-up work needed.

### D-02 · AuthUser shape — `.name` not `.full_name`

**Plan said:** `getInitials(user?.full_name ?? user?.email ?? '??')`.

**Actual `AuthUser`** (`frontend/src/store/authStore.ts` line 11): `{ id, email, name?, role?, avatar? }`. There is no `full_name` field.

**Decision:** ClassificationBar reads `user?.name ?? user?.email ?? ''` and feeds the result through `getInitials`, which also handles the email-prefix case (`k.alzahrani@gastat.gov.sa` → `KA`) so the initials remain sensible when only an email is available. This matches Plan 36-02's Sidebar initials logic for consistency.

**Impact:** Identical user experience; the string "KA" renders in both directions. When Phase 37 adds `name_ar` we'll extend this helper.

### D-03 · Task-1 commit was absorbed into sibling's Task-2 commit by concurrent-write race

**Symptom:** Both 36-02 and 36-03 executors ran in the same working tree (no worktree isolation). When the 36-02 executor's `git add -A` fired at commit time, it picked up 36-03's already-staged Topbar.tsx + Topbar.test.tsx. The actual git ref-lock surfaced a `cannot lock ref 'HEAD'` error on our commit, and the sibling's commit `f44b8041 feat(36-02): Sidebar …` landed carrying all three files.

**Decision:** The Topbar files committed in `f44b8041` are **byte-identical** to what 36-03 authored (`git diff HEAD -- Topbar.tsx Topbar.test.tsx` → empty). Rather than rewriting history (destructive + risks sibling agent's in-flight work), we accept the misleading commit subject and document the absorption here.

**Impact:** History is mislabeled but correct. Topbar.tsx + Topbar.test.tsx are on the branch at HEAD with the intended content; all tests pass. Future `git blame` readers will need to consult this SUMMARY for attribution.

### D-04 · Global `react-i18next` mock means `t(key)` returns the raw key in tests

**Observation:** `frontend/tests/setup.ts` installs a module-level i18n stub where `t(key)` returns the key string (except for a hardcoded `afterActions.*` + `common.selectDate` table). `shell.*` keys are not in that table.

**Decision:** Rather than re-mock `react-i18next` per file (as `TweaksDrawer.test.tsx` does when it needs real Arabic/English strings), we assert only on **DOM structure + CSS classes + aria-labels**. `aria-label="shell.tweaks"` is still a deterministic, stable selector — same on every render. This keeps the tests fast and avoids coupling to i18n JSON content.

**Impact:** Tests assert structural contracts (class hooks, role attributes, click handlers), not translated copy. Real-translation smoke coverage lives in Playwright (Plan 36-01 `tests/e2e/phase-36-shell*.spec.ts`).

## Known Stubs

None. The only hardcoded value is the notification badge's `0` count — documented in the Topbar header comment as "Phase-42 will wire real count". This is intentional per UI-SPEC: Phase 36 renders the trigger shell only; the dropdown + live count land in the Operations phase.

## Self-Check: PASSED

- ✅ `frontend/src/components/layout/Topbar.tsx` exists (238 lines, 7-slot JSX, useTweaksOpen wired)
- ✅ `frontend/src/components/layout/Topbar.test.tsx` exists (3 `it` titles GREEN)
- ✅ `frontend/src/components/layout/ClassificationBar.tsx` exists (137 lines, 4-case switch, `.cls-*` hooks)
- ✅ `frontend/src/components/layout/ClassificationBar.test.tsx` exists (4 `it` titles GREEN)
- ✅ Commit `f44b8041` on branch DesignV2 carries Topbar.tsx + Topbar.test.tsx (absorbed — see D-03)
- ✅ Commit `0db812d7` on branch DesignV2 carries ClassificationBar.tsx + ClassificationBar.test.tsx
- ✅ Combined Vitest run → 7/7 green (3 + 4)
- ✅ Zero physical-property Tailwind classes in either production file

## Next steps

- Plan 36-04 (AppShell, Wave 2) mounts `<Topbar />` + `<ClassificationBar />` + Sidebar on the shared grid and wires the `onOpenDrawer` prop to a HeroUI Drawer controlled by AppShell-local state.
- Plan 36-05 deletes the legacy `SiteHeader.tsx` + swaps the mount point in `_protected.tsx`.
