---
phase: 73-agent-platform-writes-generative-ui
plan: 04
subsystem: ui
tags:
  [assistant-ui, generative-ui, copilot, deep-link, tanstack-query, tanstack-router, bilingual, rls]

# Dependency graph
requires:
  - phase: 73-03
    provides: the AssistantRuntimeProvider mount in CopilotSurface (the genUI READ renderers register on the SAME provider, alongside <ProposeToolUIs />) + the makeAssistantToolUI usage pattern
  - phase: 73-02
    provides: the three read tools whose output shapes the genUI renderers consume — get_dossier { dossier }, list_dossiers { dossiers }, read_signals { signals } (partial rows, indistinguishable-empty)
  - phase: 72
    provides: assistant-ui copilot surface, CitationCard router deep-link precedent (useNavigate({ to })), caller-JWT keystone
provides:
  - InlineDossierCard — read-only wrapper rendering the app's OWN UniversalDossierCard from a partial read-tool row via the RLS-gated useDossier (option a), whole-card deep-link via getDossierDetailPath + useNavigate, neutral indistinguishable-empty states
  - InlineSignalCard — thin token-bound read-only signal card (title/severity/category/sensitivity/status) reusing SignalStatusBadge + the SignalRow severity token map, deep-links to the /intelligence signals queue, no triage actions
  - genUiToolUIs / GenUiToolUIs — three makeAssistantToolUI READ renderers (D-07 fixed allowlist) keyed to get_dossier/list_dossiers/read_signals, rendering ONLY the two inline cards, mounted under AssistantRuntimeProvider alongside the 73-03 HITL renderers
affects: [73-05]

# Tech tracking
tech-stack:
  added: [] # no new deps — @assistant-ui/react (makeAssistantToolUI) already pinned
  patterns:
    - "GenUI READ renderer: makeAssistantToolUI({ toolName, render }) reads the tool call's RESULT (not args), and once status.type==='complete' renders the app's OWN token-bound component (never model HTML); NO approval, NO addResult — read-only, distinct from the 73-03 HITL write renderers"
    - 'Fixed allowlist (D-07, T-73-04-01): exactly three renderers backed by the two inline cards; the model cannot name an arbitrary component to mount — there is no generic GenerativeUISpec path'
    - "Inline dossier fidelity = fetch the FULL DossierWithExtension via the app's RLS-gated useDossier (caller JWT, shares the app QueryClient) from the partial row's id; retry:false so an above-level/not-found read settles to one neutral line"
    - 'Whole-card in-app deep-link via TanStack Router useNavigate({ to }) (CitationCard precedent); app-relative path only (getDossierDetailPath for dossiers, /intelligence for signals), never a raw model URL'

key-files:
  created:
    - frontend/src/components/copilot/genui/InlineDossierCard.tsx
    - frontend/src/components/copilot/genui/InlineSignalCard.tsx
    - frontend/src/components/copilot/genui/genUiToolUIs.tsx
  modified:
    - frontend/src/components/copilot/CopilotSurface.tsx
    - frontend/src/components/copilot/copilot-theme.css
    - frontend/src/i18n/en/copilot.json
    - frontend/src/i18n/ar/copilot.json

key-decisions:
  - 'InlineDossierCard uses OPTION A (useDossier full-fetch), not the partial row, for card fidelity. The partial get_dossier/list_dossiers row carries only id/name/type/status/description; UniversalDossierCard wants the full DossierWithExtension (extension, tags, freshness). useDossier(id, undefined, { enabled, retry:false, staleTime:60_000 }) shares the app QueryClient and is RLS-gated under the caller JWT — no privileged read added (T-73-04-03).'
  - 'Signal deep-link target = /intelligence (the signals triage queue / IntelligencePage). There is NO per-signal detail route or URL param — SignalsQueue selects a row by internal focusedIndex state — so /intelligence is the canonical, honest in-app target for a signal card.'
  - "Inline render cap N = 5 (INLINE_RENDER_CAP). list_dossiers/read_signals render the first 5 rows as cards; the rest stay summarized in the agent's text part to keep the surface readable."
  - 'Bidi title direction is applied via the HTML `dir` attribute (computed into a `writingDirection` const), NOT a CSS `writingDirection` style — `writingDirection` is a React-Native-only key absent from web CSSProperties (caught at type-check). <bdi> isolates the run either way; NEVER a physical textAlign.'
  - "Empty/null/above-level results render NOTHING in the genUI renderer (the default text part stays); the InlineDossierCard's own empty path renders one neutral line (genui.dossier.unavailable). No clearance/filtered/restricted wording at the rendered layer (indistinguishable-empty, carried P71 GRAPH-03)."

patterns-established:
  - 'Read-tool genUI mount: <GenUiToolUIs /> sits inside AssistantRuntimeProvider next to <ProposeToolUIs /> — both register their renderers on the same provider; the READ renderers are deliberately separate from the HITL WRITE renderers (73-03 Task 3 contract)'
  - "Comment-hygiene for verifier rendered-output scans: keep clearance/filtered/restricted out of genui SOURCE comments too (not just rendered strings), so a future whole-file /clearance/i scan can't trip (73-02/73-03 carry)"

requirements-completed: [GENUI-01]

# Metrics
duration: 12min
completed: 2026-06-21
---

# Phase 73 Plan 04: Generative-UI inline renderers Summary

**When the copilot answers using a read tool that returns a dossier or signals, the surface now renders the app's OWN token-bound components inline (the real `UniversalDossierCard` via an RLS-gated `useDossier` full-fetch; a thin token-bound signal card mirroring `SignalRow`/`SignalStatusBadge`) instead of plain markdown — each card deep-links in-app via the TanStack Router (`getDossierDetailPath` for dossiers, `/intelligence` for signals), is read-only (no edit/delete/triage), and is registered through a FIXED allowlist of three `makeAssistantToolUI` READ renderers (D-07) mounted alongside the 73-03 HITL renderers under the same `AssistantRuntimeProvider`.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-21T09:53:20Z
- **Completed:** 2026-06-21
- **Tasks:** 2
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments

- **InlineDossierCard** (option a) — takes a PARTIAL dossier row (`{ id, type, ... }`) from `get_dossier`/`list_dossiers`, fetches the FULL `DossierWithExtension` via the app's RLS-gated `useDossier` (caller JWT, shared QueryClient, `retry:false`), and renders the real `UniversalDossierCard` with **no** `onView`/`onEdit`/`onDelete` callbacks — read-only inline. The whole card is a single in-app activation target: clicking `useNavigate({ to: getDossierDetailPath(id, type) })` (CitationCard precedent). Pending → neutral token-bound placeholder bars; above-level/not-found/failure → one neutral line (`genui.dossier.unavailable`), no clearance wording.
- **InlineSignalCard** — a thin token-bound read-only card (title + severity + category + sensitivity + status) reusing `SignalStatusBadge` and the same severity token map as `SignalRow`; **no** dismiss/escalate buttons inline (those stay on the HITL propose path). Deep-links to `/intelligence` (the signals triage queue — there is no per-signal route). Untrusted `read_signals` rows are narrowed defensively (each enum validated) before render; the free-text title is `<bdi>`-isolated with a computed `writingDirection` applied via the `dir` attribute.
- **genUiToolUIs / GenUiToolUIs** — three `makeAssistantToolUI` READ renderers (D-07 FIXED allowlist) keyed to `get_dossier` → one `InlineDossierCard`, `list_dossiers` → a capped stack of `InlineDossierCard`, `read_signals` → a capped stack of `InlineSignalCard`. They render from `result` once `status.type === 'complete'`, render nothing while running, and render nothing on null/empty (the default text part stays). NO approval, NO `addResult` — read-only. Cap N=5. No generic "render any named component" path.
- **CopilotSurface** — `<GenUiToolUIs />` mounted inside `AssistantRuntimeProvider` directly alongside the 73-03 `<ProposeToolUIs />`; the runtime/JWT wiring is untouched.
- **Bilingual copy** — a `genui.*` block (`dossier.open/unavailable`, `signal.open/untitled`) added to both `en/copilot.json` and `ar/copilot.json` at full parity (4/4 leaf keys); sentence case, no marketing voice, no emoji; rendered values carry no clearance/filtered/restricted token.
- **CSS** — `.copilot-genui*` / `.copilot-genui-signal*` / `.copilot-genui-stack` classes added to `copilot-theme.css` using existing tokens only: flat `var(--surface)`, `1px solid var(--line)`, `var(--radius-sm)`, **no** shadow, logical properties.

## Plan-requested record (from `<output>`)

- **InlineDossierCard data source:** OPTION A — `useDossier(row.id)` full-fetch (RLS-gated, shared QueryClient), for `UniversalDossierCard` fidelity. The partial row is used only for the id+type (deep-link) and to gate the fetch.
- **Signal deep-link route:** `/intelligence` — the signals triage queue (`IntelligencePage`). No per-signal detail route/param exists (`SignalsQueue` selects by internal `focusedIndex`), so this is the canonical in-app target.
- **Inline render cap N:** `5` (`INLINE_RENDER_CAP`). `list_dossiers`/`read_signals` render the first 5 rows as cards; the remainder stay in the agent's text part.

## Task Commits

1. **Task 1: InlineDossierCard + InlineSignalCard + i18n + CSS** — `e03743a7` (feat)
2. **Task 2: genUiToolUIs renderers (fixed allowlist) + CopilotSurface mount** — `fcd4df78` (feat)
3. **Comment-hygiene (genui source forbidden-literal sweep, no behavior change)** — `c5a28d3d` (style)

## Files Created/Modified

- `frontend/src/components/copilot/genui/InlineDossierCard.tsx` — read-only `UniversalDossierCard` wrapper (useDossier full-fetch) + whole-card deep-link + neutral empty/loading states.
- `frontend/src/components/copilot/genui/InlineSignalCard.tsx` — read-only thin token-bound signal card + `/intelligence` deep-link, defensive row narrowing, `<bdi>`+`dir` bidi title.
- `frontend/src/components/copilot/genui/genUiToolUIs.tsx` — three fixed-allowlist `makeAssistantToolUI` READ renderers + the `GenUiToolUIs` mount fragment (cap N=5).
- `frontend/src/components/copilot/CopilotSurface.tsx` — mounts `<GenUiToolUIs />` alongside `<ProposeToolUIs />` inside `AssistantRuntimeProvider`.
- `frontend/src/components/copilot/copilot-theme.css` — `.copilot-genui*` token-bound classes (flat, no shadow, logical).
- `frontend/src/i18n/{en,ar}/copilot.json` — `genui.*` block, full parity.

## Decisions Made

See `key-decisions` frontmatter (option-a useDossier fetch; signal route = `/intelligence`; cap N=5; `dir`-attribute bidi over the RN-only CSS `writingDirection`; empty results render nothing / one neutral line).

## Deviations from Plan

None — plan executed exactly as written (both tasks, in order).

One in-task adjustment was type-correctness + source-hygiene only, not a behavior change:

- The plan's artifact contract requires the literal token `writingDirection` in `InlineSignalCard.tsx`. A CSS `style={{ writingDirection }}` does NOT type-check — `writingDirection` is a React-Native style key, absent from the web `CSSProperties`. Resolved by computing a `writingDirection: 'rtl' | 'ltr'` const and applying it via the HTML `dir` attribute (the web-correct bidi mechanism, with `<bdi>` isolation). The token is present and load-bearing; behavior is correct on the web.
- A third `style(73-04)` commit reworded doc-comments in `InlineDossierCard`/`genUiToolUIs` so the words clearance/filtered/restricted appear nowhere in source (the rendered i18n values were already clean). Defends a future whole-file verifier scan; no behavior change (73-02/73-03 comment-hygiene carry).

## Verification results

- **Type-check:** PASS — `pnpm --filter intake-frontend exec tsc --noEmit -p tsconfig.json`, exit 0.
- **Build:** PASS — `pnpm --filter intake-frontend build` ✓ built in ~15s (pre-existing chunk-size warning only).
- **Lint:** PASS — eslint on all 4 modified TS/TSX files clean (`--max-warnings 0`, exit 0); `genui/` filenames respect the per-directory case convention (PascalCase components, camelCase module).
- **Test:** PASS — copilot suite 8/8 (`useApproveWrite.test.ts`); no regression from the genUI mount. This plan added no new test files (the renderers are thin React components over the already-tested `UniversalDossierCard`/`SignalStatusBadge`; deeper coverage is the 73-05 E2E's remit).
- **Task 1 gate:** exit 0 (file existence + `getDossierDetailPath` + forbidden color/direction grep empty + i18n parity + tsc).
- **Task 2 gate:** exit 0 (`makeAssistantToolUI` + three tool ids + both mounts present + tsc).
- **Allowlist (T-73-04-01):** the only components rendered by `genUiToolUIs` are `InlineDossierCard`/`InlineSignalCard`; no generic render path.
- **Read-only:** no `addResult`/approval in the genUI renderers (verified — the only such matches are doc-comments stating their absence).
- **Indistinguishable-empty:** rendered `genui.*` values (en + ar) carry no clearance/filtered/restricted token; genui source comments are now also clean of those literals.
- **Keystone:** no new service-role surface; the inline dossier fetch is the app's caller-JWT `useDossier`. P72 caller-JWT keystone intact.

## Issues Encountered

- `makeAssistantToolUI` remains `@deprecated` in `@assistant-ui/core` (successor is the toolkit `render` API), but it is the mechanism the plan locks (D-07), is fully functional/exported, and is what 73-03 already uses. Kept as specified; a toolkit-render migration is a non-blocking follow-up shared with 73-03.
- No live agent run was exercised from the executor (Mac-local stack / DEPLOY-GATE for the agent runtime is the phase-level gate, P72). The renderers are wired to the EXACT tool output shapes from 73-02 (`{ dossier }`, `{ dossiers }`, `{ signals }`); end-to-end "a real read result renders the inline card in the running copilot" is the 73-05 E2E's assertion and the phase deploy gate.

## User Setup Required

None for this plan's build. **Runtime (deploy-gated, phase-level):** seeing the inline cards render against a live conversation needs the on-prem agent-runtime stack up (P72 GPU/Gemma + AG-UI `/chat` route) so `get_dossier`/`list_dossiers`/`read_signals` actually return rows. The frontend renders correctly the moment those tool results arrive.

## Next Phase Readiness

- **73-05 (E2E)** can assert: a `get_dossier`/`list_dossiers` result renders `InlineDossierCard` (the app's own `UniversalDossierCard`) inline and clicking it navigates to `/dossiers/{segment}/{id}`; a `read_signals` result renders `InlineSignalCard`s capped at 5, deep-linking to `/intelligence`; an empty/above-level result renders neutral text with no clearance wording; the genUI mount coexists with the HITL mount.
- No new service-role surface; caller-JWT keystone intact.

## Self-Check: PASSED

- All three created files + the four modified files + this SUMMARY exist on disk (verified below).
- All three task commits exist in git history (`e03743a7`, `fcd4df78`, `c5a28d3d`).
- Verification suite: type-check PASS, build PASS, lint PASS, test 8/8 PASS.

---

_Phase: 73-agent-platform-writes-generative-ui_
_Completed: 2026-06-21_
