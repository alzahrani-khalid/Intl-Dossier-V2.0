# Lane sweeper: edges (auth, errors, dead/demo routes, logout)

Shots directory: `scratchpad/sweeper/shots/`. All probes run against
localhost:5173 with the local backend/Supabase staging project. Clean-session
probes used my own `sweeper/clean-probe.mjs` (no storageState). Interactive
tests used my own throwaway Playwright scripts in `sweeper/`, copying
probe.mjs's setup block. **I never signed out or mutated auth state using the
shared `storageState.json`** — for the logout test I minted an independent
session (`sweeper/own-storageState.json`) with the same test credentials so
other lanes' shared session stayed untouched.

## Routes covered (18)

- `/` (clean session) — OK, but see F1 (design regression)
- `/login` (clean session, en+ar) — OK
- `/register` (clean session) — OK
- `/reset-password` (clean session, no token) — OK, honest "invalid or expired" state; see F8 (design drift)
- `/this-does-not-exist` (authed, en+ar) — OK page-level, see F9 (i18n gap in ar)
- `/dossiers/countries/00000000-0000-0000-0000-000000000000` — BROKEN, see F2
- `/responsive-demo` — dead demo, correctly gated (see verdicts)
- `/scenario-sandbox` — BROKEN, see F3
- `/modern-nav-standalone` — dead demo, correctly gated (see verdicts)
- `/dashboard/project-management` — OK (intentional redirect)
- `/admin/preview-layouts` — OK, real feature
- `/word-assistant` — HOLLOW, see F4
- `/custom-dashboard` — HOLLOW/BROKEN, see F5
- `/compare` — OK, real feature (verified end-to-end)
- `/geographic-visualization` — HOLLOW, see F10
- `/stakeholder-influence` — BROKEN, see F11
- `/settings` (found via source, not in nav) — OK page, but no sign-out control, see F6
- Logout flow + protected-route bounce — BROKEN, see F6 + F7

## Findings

### F1. Landing page (`/`) uses dead pre-Linear color tokens — unstyled button, invisible heading tint [severity: P1] [class: design]

- Route: `/` (clean session, first thing an unauthenticated visitor sees)
- Observed: Page renders as near-black with plain white text and a "Sign In" link that has **no button styling at all** (no background, no border) — compare to `/login` and `/register`, which render a proper indigo `.btn-primary` button on the same content.
- Evidence: `sweeper/shots/en__1440.png` vs `sweeper/shots/en_login_1440.png`. Root cause confirmed by source: `frontend/src/routes/index.tsx:32-44` uses `text-base-900`, `text-base-600`, `bg-primary-600`, `text-primary-50` — a legacy pre-Linear Tailwind color scale defined in `tailwind.config.js:9-38` as `hsl(var(--base-900))` / `hsl(var(--primary-600))`. Those CSS custom properties (`--base-900`, `--primary-600`, `--primary-50`, `--base-600`) are **not defined anywhere in `src/index.css`** (grep confirms zero hits), so the `hsl(var(...))` calls resolve to invalid color and the browser silently drops the style, leaving default/inherited rendering.
- Data-vs-wiring: feature not wired — this is a design-token regression, not a data problem. `/login` and `/register` were migrated to the Linear tokens (`bg-accent`, `rounded-[var(--radius-lg)]`, `border-line`); `/` (`HomePage` in `index.tsx`) was missed.
- Suggested fix (1 line): rewrite `HomePage` in `index.tsx` to use `bg-bg`/`text-ink`/`btn-primary` like `LoginPage.tsx` does.

### F2. Nonexistent dossier ID shows no not-found state — perpetual skeletons, then a misleading "connection" error instead of "Dossier not found" [severity: P0] [class: broken]

- Route: `/dossiers/countries/00000000-0000-0000-0000-000000000000`
- Observed: At 3.5s the page is still showing 24 skeleton placeholders with the full DossierHub chrome (tabs, Edit/Analyze/Export/Relationships buttons) as if the dossier existed. At 9s, 4 of 6 panels resolve to red `role="alert"` text **"Failed to load this section. Check your connection and try again."** — a networking-sounding message for what is actually a 404/406 (dossier doesn't exist). One panel ("Engagements by Stage") is _still_ a skeleton at 9s and never resolves in my test window. The breadcrumb never shows a dossier name or any "not found" indicator — it just says generic "DOSSIER HUB".
- Evidence: `sweeper/shots/en_dossiers_countries_00000000-0000-0000-0000-000000000000_1440.png` (9s-wait version). Console: 4× `406` on `GET .../rest/v1/dossiers?...id=eq.00000000-000...` (a `.single()` query against zero rows), `404` on `GET .../functions/v1/dossiers-get?id=...`, `403` on `GET .../functions/v1/dossier-activity-timeline?dossier_id=...`.
- Data-vs-wiring: feature not wired — there is no dossier-not-found UI state at all; the route/hub component has no branch for "the ID resolved to zero rows," so it falls through to the generic per-section fetch-failure copy, and it took 9+ seconds to even get that far.
- Suggested fix (1 line): have the dossier-detail loader distinguish a 404/406/empty-row response from a real network failure and render a page-level "Dossier not found" state (like the app's own 404 page) instead of per-panel "check your connection" errors.

### F3. `/scenario-sandbox` — infinite spinner caused by a real 500 from the backend, never surfaced to the user [severity: P0] [class: broken]

- Route: `/scenario-sandbox`
- Observed: The list area shows a spinner that is still spinning, unchanged, at both 3s and 8s waits — no error message, no empty state, no retry affordance. KPI tiles above it correctly show "0" for all counts (that part loaded).
- Evidence: `sweeper/shots/en_scenario-sandbox_1440.png` (identical at 3s and 8s). Console/network: `500 GET https://<project>.supabase.co/functions/v1/scenario-sandbox?limit=50`.
- Data-vs-wiring: feature not wired correctly — the backend edge function itself is erroring (500), and the frontend query has no error UI branch, so a hard backend failure renders identically to "still loading" forever. This is exactly the "spinner that never resolves" class called out in the brief.
- Suggested fix (1 line): fix the `scenario-sandbox` edge function's 500, and add an error state to the scenario list query so a failed fetch doesn't look identical to a pending one.

### F4. `/word-assistant` — "Connected" badge is misleading; every response is a canned stub that tells the user the AI isn't actually available [severity: P0] [class: devcopy]

- Route: `/word-assistant`
- Observed: Header shows a green **"Connected"** status pill. Sending any prompt (e.g. "Say hello in one short sentence.") returns, every time, a templated non-answer:
  > "Draft response — You asked: Say hello in one short sentence. — Context considered (38 chars shown): USER: ... — Suggested next steps: - Refine the prompt... - Add any constraints... - **When the AI service is available, re-run for a full draft.**"
- Evidence: `sweeper/shots/word-assistant_after_send.png`. No console errors, no 4xx/5xx — the mutation itself succeeds and returns this template as its payload, so this isn't a transient outage; it's the endpoint's actual current behavior.
- Data-vs-wiring: feature not wired — this is the exact class of bug the brief flagged as a confirmed pattern (cf. the VIP-widget seed-instruction copy on `/dashboard`). The UI is fully built and the request/response plumbing works, but the backend returns a developer-facing placeholder that explicitly admits the real AI integration isn't live, while the status badge claims "Connected."
- Suggested fix (1 line): either wire the real AI backend response here, or change the status pill to reflect the actual state ("Limited" / "Offline") instead of "Connected."

### F5. `/custom-dashboard` — "Upcoming Events" silently empty from a real schema-mismatch 400; all 4 KPI trend deltas flatlined at "0.0%" [severity: P1] [class: broken]

- Route: `/custom-dashboard`
- Observed: KPI tiles show real counts (Active Dossiers 43, Pending Tasks 6, Overdue Items 16, Completed This Week 0) but **every single tile's trend shows "— 0.0% from last Week"**. "Upcoming Events" panel renders its header/refresh icon and nothing else — no items, no empty-state copy. "Work Items by Status" shows only its legend (Pending/In Progress/Review/Completed) with no chart/bars above it.
- Evidence: `sweeper/shots/en_custom-dashboard_1440.png`. Network: `400 GET .../rest/v1/calendar_entries?...&order=start_datetime.asc...` → response body `{"code":"42703","message":"column calendar_entries.start_datetime does not exist"}` (confirmed via a dedicated network-logging script, reproduced twice). Also multiple `FAILED HEAD .../rest/v1/dossiers?...` and `FAILED HEAD .../rest/v1/unified_work_items?...` (net::ERR_ABORTED) — these are the week-over-week comparison count queries, which is why every delta shows exactly 0.0% instead of a real percentage.
- Data-vs-wiring: feature not wired — `calendar_entries.start_datetime` doesn't exist as a column (real schema mismatch, Postgres error 42703), so this is a genuine code/schema bug, not missing seed data. The KPI deltas are the same class: the count-comparison queries never complete, so the widget quietly shows 0.0% instead of surfacing an error.
- Suggested fix (1 line): fix the column name used by the Upcoming Events query to match the real `calendar_entries` schema, and stop swallowing the aborted trend-comparison requests.

### F6. There is no way to log out of the app — the sidebar user card is a static, non-interactive `<div>` [severity: P0] [class: broken]

- Route: global (sidebar present on every authenticated page); also checked `/settings`
- Observed: Clicking the "KA / Khalid Alzahrani / Head of International Partnerships" user card in the sidebar does nothing — no menu opens, no navigation happens. The top bar (search, sparkle/copilot, bell, theme toggle, EN/ع, Tweaks) has no user icon or menu at all. `/settings` (a real page, but **not linked from the sidebar nav** — I found it only by reading the router source) has Profile/General/Appearance/Notifications/Access & Security/Accessibility/Data & Privacy/Email Digest/Integrations tabs; "Access & Security" has a _Session Timeout (auto sign-out after inactivity)_ setting but no manual "Sign out" button anywhere.
- Evidence: `sweeper/shots/logout_menu_open.png` (dashboard unchanged after clicking the user card — no dropdown appeared) and `sweeper/shots/en_settings_1440.png`. Source: `frontend/src/components/layout/Sidebar.tsx:101-113` — the `.sb-user` block is a plain `<div>` with no `onClick`, no `<button>`, no `<Link>`. `frontend/src/components/layout/Topbar.tsx` (the component actually mounted by `AppShell.tsx:196-202`) has zero references to logout/signOut/UserMenu/Avatar (grepped). A **working** logout dropdown exists in the codebase at `frontend/src/components/layout/nav-user.tsx:40-92` (`DropdownMenuTrigger` → `logout()`) and `frontend/src/components/layout/Header.tsx`, but neither is imported by `AppShell.tsx`, so they're dead code — not reachable from the live UI.
- Data-vs-wiring: feature not wired — this isn't a data-seeding issue; the working logout code exists in the repo, it's just not mounted anywhere in the currently-shipped shell.
- Suggested fix (1 line): mount `NavUser` (or wire the static `.sb-user` div to the same dropdown/`logout()` call) in `Sidebar.tsx`, and link `/settings` from the nav.

### F7. Session invalidation mid-session doesn't bounce the open tab — it decays into a broken "Member/Member" ghost state instead [severity: P1] [class: broken]

- Route: `/dashboard` (protected route bounce test, part 4 of brief)
- Observed: Using an independently-minted session (not the shared one), I called `supabase.auth.signOut()` directly while sitting on `/dashboard`. **3 seconds later, the tab was still on `/dashboard`** — no redirect. The page visibly degraded instead: sidebar user card changed to a generic "Member / Member" placeholder, greeting changed from "Good evening, Khalid" to "Good evening, there", the entire ADMINISTRATION nav section (AI Settings, System Settings, Tags, Field Permissions, Audit Logs, Data Retention, Approvals) disappeared, and "Overdue Commitments" reset to "No overdue commitments" even though real overdue items were showing seconds earlier. A **fresh** navigation to `/dashboard` after this correctly bounced to `/login` (that half of the guard works — `_protected.tsx`'s `beforeLoad` checks the live session).
- Evidence: `sweeper/shots/after_programmatic_signout_same_tab.png` (broken ghost state, same URL) vs `sweeper/shots/after_signout_fresh_nav.png` (correct redirect to `/login` on fresh nav).
- Data-vs-wiring: feature not wired — there's no `onAuthStateChange` subscription driving the already-mounted route to react and redirect; the guard only runs on navigation/load, not reactively. Since F6 means there's no UI path to trigger a real signOut today, this specifically matters for token-expiry / revoked-session scenarios, which do reach the same code path.
- Suggested fix (1 line): subscribe to Supabase `onAuthStateChange` at the app root and force a redirect to `/login` on `SIGNED_OUT`, instead of relying only on route-load checks.

### F8. `/reset-password` uses legacy (pre-Linear) design tokens and a stale copyright year [severity: P2] [class: design]

- Route: `/reset-password` (no token — the honest "invalid/expired" state)
- Observed: Footer reads **"© 2025 GASTAT - General Authority for Statistics"** (hyphen) while every other auth page (`/login`, `/register`) reads **"© 2026 GASTAT — General Authority for Statistics"** (em dash, correct year for 2026-08-15 "today"). Visually the card still looks acceptable because the legacy tokens happen to resolve to similar dark colors, but it's real drift: `frontend/src/auth/ResetPasswordPage.tsx` uses `bg-background`, `bg-card`, `rounded-2xl`, `text-foreground`, `text-muted-foreground`, `bg-primary` (shadcn/legacy tokens) throughout, instead of the Linear tokens (`bg-bg`, `bg-surface`, `rounded-[var(--radius-lg)]`, `text-ink`) that `LoginPage.tsx` and `RegisterPage.tsx` already use.
- Evidence: `sweeper/shots/en_reset-password_1440.png` vs `sweeper/shots/en_login_1440.png` (footer text differs); source grep for `bg-background\|bg-card\|rounded-2xl` in `ResetPasswordPage.tsx`.
- Data-vs-wiring: n/a (design/copy drift, not a data issue).
- Suggested fix (1 line): port `ResetPasswordPage.tsx` to the Linear tokens and fix the hardcoded "© 2025 ... -" footer to match the other auth pages' "© 2026 ... —" string (ideally share one `<AuthFooter>` component).

### F9. 404 page not truly localized — Arabic (and English) both silently fall back to hardcoded strings instead of the app's own translations [severity: P2] [class: i18n]

- Route: `/this-does-not-exist` (ar)
- Observed: In Arabic mode the 404 page shows: "404 / Page not found / The page you are looking for does not exist or has been moved. / Go back / Dashboard / **بحث**" — only the last link ("Search"→"بحث") is actually translated; the heading, description, and the other two buttons stay in English even though `dir="rtl"` and Tajawal are correctly applied everywhere else.
- Evidence: `sweeper/shots/ar_this-does-not-exist_1440.png`. Root cause confirmed in source: `frontend/src/routes/__root.tsx:20-42` calls `t('errors.pageNotFound', 'Page not found')`, `t('errors.pageNotFoundDescription', ...)`, `t('common.goBack', 'Go back')`, `t('common.dashboard', 'Dashboard')`. None of those four key paths exist in `src/i18n/en/common.json` (confirmed by parsing the JSON: `common.errors` only has `preferenceSaveFailed/themeLoadFailed/languageLoadFailed/networkError/unknownError/generic`; `common.common` has no `dashboard` key) — so i18next always falls back to the literal English default string, in both languages. The real translated strings already exist, just at different, unused key paths: `common.notFound.title` / `common.notFound.message` / `common.notFound.goHome` / `common.notFound.goBack` (present in both `en/common.json` and `ar/common.json`).
- Data-vs-wiring: feature not wired — the translated copy exists in the bundle, `NotFoundPage` just points at the wrong keys.
- Suggested fix (1 line): change `NotFoundPage` to use `t('common.notFound.title')` / `.message` / `.goBack` / `.goHome` instead of the nonexistent `errors.*` / flat `common.*` keys.

### F10. `/geographic-visualization` — Engagements and Relationships pinned at 0 across every time range, while the same countries show real engagement data elsewhere [severity: P2] [class: hollow]

- Route: `/geographic-visualization`
- Observed: KPI strip shows "Countries: 5 (0 active) / Engagements: 0 / Relationships: 0 / Regions: 3", with 5 real country dots (SA, AE, CN, GB, ID) correctly plotted on the map. Cycling the Time Period filter through Last 7 Days → Last 30 Days → Last 90 Days → **Last Year** does not change Engagements or Relationships at all — both stay exactly 0. Elsewhere in the app (`/dashboard`, `/custom-dashboard`) these same countries (UAE, China) show real, non-zero engagements/commitments.
- Evidence: `sweeper/shots/en_geographic-visualization_1440.png` and `sweeper/shots/geo_last_year.png` (identical KPI values). No console errors or failed requests observed on this route, which is why I can't point at one broken query.
- Data-vs-wiring: **unsure, because** I didn't have time to trace the specific RPC/query this widget uses for engagement/relationship counts. The fact that the numbers don't move at all across a 7-day-to-1-year range, combined with the countries dossier having verified engagement data via a different code path elsewhere in the app, makes "wrong join/table" more likely than "no data," but I can't confirm which query is at fault without reading `GeographicVisualizationPage.tsx`'s data hooks.
- Suggested fix (1 line): trace which query backs the Engagements/Relationships counters on this page and verify it's joining through the same `engagement_dossiers` extension table the rest of the app uses.

### F11. `/stakeholder-influence` — React hydration/nesting error plus a TanStack Query contract violation; two side panels render completely empty with no empty-state copy [severity: P1] [class: broken]

- Route: `/stakeholder-influence`
- Observed: Page renders visually intact (KPI tiles all 0, "No network data available" empty state in the main panel is fine), but the console shows a real React DOM-nesting violation (`<p>` cannot contain a nested `<div>`, described as causing a hydration error) and a TanStack Query error: `Query data cannot be undefined. Please make sure to return a value other than undefined from your query function. Affected query key: ["stakeholder-influence","network-statistics",null]`. Separately, the "Top Influencers" and "Key Connectors" side panels are just an empty box under their heading — no "no data" text, no skeleton, nothing.
- Evidence: `sweeper/shots/en_stakeholder-influence_1440.png`; console errors captured verbatim in the probe JSON.
- Data-vs-wiring: feature not wired correctly — a `queryFn` that returns `undefined` violates the react-query contract regardless of whether the underlying table is empty; that's a code bug, not just "no data seeded" (a correctly-wired empty-result query would return `{data: []}` or similar, not `undefined`).
- Suggested fix (1 line): fix the `network-statistics` query to always return a defined value, and add explicit empty-state copy to the Top Influencers / Key Connectors panels.

## Dead/demo route verdicts

- **`/responsive-demo`** — **dead demo, safe.** Component test harness for the `useResponsive` hook / `ResponsiveCard` / `ResponsiveNav` / `ResponsiveTable` primitives (hardcoded "Saudi Arabia / UAE" rows, no i18n, `data-testid` attrs throughout). Explicitly gated by `beforeLoad: devModeGuard` (`frontend/src/lib/dev-mode-guard.ts`), which redirects to `/dashboard` unless `VITE_DEV_MODE==='true'` or Vite dev mode — it only renders because we're hitting the dev server. In a real prod build it 404s-to-dashboard safely. Recommend leaving it (useful for manual QA of the responsive primitives) or moving it out of the route tree entirely if it's never actually used for that.

- **`/modern-nav-standalone`** — **dead demo, safe.** Explicitly self-described in its own source comment as "Standalone Modern Navigation Demo... to showcase the complete navigation system" (`frontend/src/routes/modern-nav-standalone.tsx:8-14`), with a literal "Reference Design Match" checklist section, a fake "John Doe / customerpop@gmail.com" user, and "DOSSIER 2025" branding (not even this app's real name/year). Also gated by `devModeGuard`. Same verdict as above — harmless design-reference scratch page, correctly kept out of prod.

- **`/dashboard/project-management`** — **not dead, working as intended.** It's a one-line `<Navigate to="/dashboard" />` with an explicit comment: "Legacy project-management dashboard route. The old DashboardPage was replaced by OperationsHub in Phase 10. Redirect to the main dashboard (OperationsHub) to avoid 404s." Confirmed live: it renders the real, current OperationsHub dashboard. This is an intentional compatibility redirect, not a bug — leave it.

- **`/admin/preview-layouts`** — **real feature, fully wired.** Initially looked suspicious (1182-line route file with zero direct `supabase`/`useQuery` calls), but the mutations/queries live in `frontend/src/hooks/usePreviewLayouts.ts`, which does call real Supabase RPCs (`get_entity_layouts`) and real tables (`entity_preview_layouts`, `preview_layout_fields`). Selecting "Country" live pulled a real seeded "Default Country Preview" layout with no errors. Admin-gated via `requireAdmin`. Genuinely fine — don't delete.

- **`/word-assistant`** — **real route, UI fully built, backend is a stub.** Not dead (it's linked, reachable, and functional as a chat UI), but see F4 — the "AI" backend currently returns a canned template that admits it isn't live. Classify as unfinished, not dead.

- **`/custom-dashboard`** — **real feature, real seeded data**, but has genuine backend bugs (F5). Not dead or hollow as a whole — 3 of 6 widgets work correctly with real numbers.

- **`/compare`** — **real feature, fully working.** Verified end-to-end: select entity type → pick 2 countries → "Compare Selected" produces a real side-by-side table (18 fields, 9 identical / 9 different, 50% similarity score, Table/Side-by-Side/Differences-only view toggles) sourced from real backend data (real UUIDs, real ISO codes, real created/updated timestamps). One minor polish nit (not written up as its own finding): the "Updated By" field showed a raw UUID instead of a resolved display name for one entity — worth a look but low severity.

- **`/geographic-visualization`** — **real feature** (real map, real country plotting), with a likely wiring gap on two of its four KPIs (F10).

- **`/stakeholder-influence`** — **real feature**, with real console-level defects (F11), not just missing data.

- **`/scenario-sandbox`** — **real feature, currently completely broken** by a backend 500 (F3) — not a stub, an outage.

## Routes that are genuinely fine

- `/login` (en + ar) — correct, well-styled, Tajawal applies in ar, "Forgot password" wired to a real `resetPassword()` call.
- `/register` — correctly styled, client-side zod validation works (mismatched-password case verified without hitting the network), and a valid submit does reach the real `supabase.auth.signUp()` call (verified by intercepting/aborting the network request and observing the resulting error toast, without creating a real account).
- `/reset-password` (no token) — correctly shows an honest "This reset link is invalid or has expired" state rather than crashing or spinning forever; only issue is design-token/copy drift (F8), not broken behavior.
- `/this-does-not-exist` — proper page-level 404 with "Go back / Dashboard / Search" links, no console errors, no dead-end; only issue is the i18n gap (F9).
- `/dashboard/project-management` — intentional redirect, works.
- `/admin/preview-layouts` — real, wired, working admin feature.
- `/compare` — real, wired, working end-to-end.
- Protected-route guard on a **fresh navigation** — correctly bounces an unauthenticated/invalidated session to `/login` (only the _reactive_, same-tab case is broken — F7).
