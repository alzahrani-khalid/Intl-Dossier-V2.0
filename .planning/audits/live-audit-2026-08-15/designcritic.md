# Lane designcritic: design & localization judgment audit

Judged against the contract: `frontend/DESIGN.md` (Linear spec) + `frontend/src/design-system/CLAUDE.md`.
Probed EN + AR at 1440 (plus AR dashboard/kanban and EN my-work at 1024). All screenshots read.
Token fidelity is genuinely good: **zero raw Tailwind color literals, zero card shadows, zero
gradients, correct surface ladder and radii on every screen probed. Tajawal applies globally in AR;
`dir=rtl` mirroring of shell, tables, kanban, breadcrumbs, and drawers is fundamentally correct.**
What undermines the finished feeling is copy, bilingual consistency, and a handful of broken layouts.

## Routes covered (15 screens × EN/AR)

- /dashboard (1440 EN/AR, 1024 AR) — OK, findings F5 F12 F13 F17 F18 F23 F25
- /dossiers/countries (list, EN/AR) — OK, findings F5 F6
- /dossiers (hub, EN/AR) — OK, findings F4 F10 F13 F24
- /dossiers/:id/overview (detail + tabs, EN/AR) — OK, findings F9 F19
- /dossiers/:id (no /overview) — **BROKEN** (404 for a real id; only /overview exists)
- Dossier quick-look drawer (?dossier= deep link, EN/AR) — **BROKEN layout**, F1 F16
- /dossiers/create (type picker, EN/AR) — OK (cleanest screen in the app)
- /kanban (1440 EN/AR, 1024 AR) — OK, best-localized screen
- /calendar (EN/AR) — **HOLLOW** (toggle with no grid), F11 F21
- /settings (EN/AR) — OK
- /my-work/intake (intake queue, EN/AR) — **AR i18n broken**, F2 F20
- /search (EN/AR) — OK, findings F15
- /my-work (1440 EN/AR, 1024 EN) — OK, findings F10 F12 F14
- /engagements (EN/AR) — findings F7 F8
- 404 error page (bogus dossier id, EN/AR) — EN fine, **AR untranslated**, F3

## Findings

### F1. Dossier quick-look drawer stat block renders as a broken stacked column [severity: P1] [class: design]

- Route: /dossiers/countries?dossier=<id>&dossierType=country (opens on row click)
- Observed: The four header stats render as a flat vertical list — `0 / Engagements / 3 / Commitments / 4 / Overdue / 1 / Documents` — number orphaned above its label, one per line, in the app's most-used surface (the quick look). In AR the same DOM justifies labels to the right and numbers to the far-left edge, so each pair is separated by ~600px of empty drawer. Clearly a collapsed stat-grid, not a design choice.
- Evidence: shots/designcritic/en_dossiers_countries_1440.png (left drawer half), shots/designcritic/ar_dossiers_countries_page_1_1440.png
- Data-vs-wiring: feature not wired (CSS grid/flex broken; data is present and correct)
- Suggested fix (1 line): Restore the 4-up stat row (grid-cols-4, number+label per cell) in the quick-look header.

### F2. Intake queue ships three English strings in Arabic, incl. the primary button [severity: P1] [class: i18n]

- Route: /my-work/intake (lang=ar)
- Observed: Subtitle "Review and classify incoming requests", primary button "New Request", and filter "Pending Triage" are English in the AR UI while everything around them is Arabic. Cause verified in code: `pages/IntakeQueue.tsx:278,287,298` use dot-form keys (`t('intake.description', 'Review and…')`) — the known dot-vs-colon namespace gotcha — so the English default renders in both languages.
- Evidence: shots/designcritic/ar_my-work_intake_1440.png; IntakeQueue.tsx:278
- Data-vs-wiring: feature not wired (wrong key form; ar translations unreachable)
- Suggested fix (1 line): Switch to colon namespace form `t('intake:description')` etc. and add the ar keys.

### F3. The 404 page is entirely English in Arabic [severity: P1] [class: i18n]

- Route: any bad URL, e.g. /dossiers/00000000-dead-beef-0000-000000000000 (lang=ar)
- Observed: "Page not found", "The page you are looking for does not exist or has been moved.", "Go back / Dashboard / Search" — all English under `dir=rtl`. Verified: `routes/__root.tsx:21-26` uses dot-form `t('errors.pageNotFound', …)` and `ar/common.json` has no `errors.pageNotFound`/`notFound` keys (only preferenceSaveFailed, networkError, …).
- Evidence: json/designcritic/ar_detail_1440.json (heading "Page not found", bodyFont Tajawal); shots/designcritic/en_dossiers_00000000-…png
- Data-vs-wiring: feature not wired (missing ar keys + dot-form lookup)
- Suggested fix (1 line): Add errors.pageNotFound block to ar/common.json (and en) and address via working keys.

### F4. Dossiers hub type cards: hardcoded English "% of total active dossiers" in AR [severity: P1] [class: i18n]

- Route: /dossiers (lang=ar)
- Observed: All 7 type cards show the raw English label "% of total active dossiers" between Arabic title and Arabic Active/Inactive labels; bidi shuffles it into "of total active dossiers %" which reads broken. Verified: `components/dossier/DossierTypeStatsCard.tsx:193` is a bare string, not a t() call.
- Evidence: shots/designcritic/ar_dossiers_1440.png; DossierTypeStatsCard.tsx:193
- Data-vs-wiring: feature not wired (untranslatable hardcoded string)
- Suggested fix (1 line): Wrap in t() with ar copy, e.g. "من إجمالي الملفات النشطة".

### F5. Dates are never localized in Arabic — every date on every screen is English [severity: P1] [class: i18n]

- Route: systemic — /dashboard ("Sat 15 Aug · نظرة عامة", digest "Fri 08 May 11:44 GST"), /dossiers/countries table ("Mon 06 Jul"), engagement rows ("Sun 05 Jul 18:00 GST"), detail footer ("تم إنشاء البيانات في: Sat 15 Aug 01:56 GST")
- Observed: The `Tue 28 Apr` day/month tokens are always rendered with English day and month names inside otherwise fully-Arabic sentences. Latin digits are deliberate (fine); English weekday/month names are not a digits decision — an Arabic reader gets "السبت ١٥ أغسطس"-class content nowhere. GST also never becomes توقيت الخليج. Minor within the same finding: days are zero-padded ("Mon 06 Jul") while the spec exemplar is unpadded ("Tue 28 Apr").
- Evidence: shots/designcritic/ar_dashboard_1440.png, ar_countries_1440.png, ar_engagements_1440.png
- Data-vs-wiring: feature not wired (formatter locale hardcoded to en)
- Suggested fix (1 line): Route all date formatting through the shared locale-aware formatter (lib/format-locale) with ar day/month names, unpadded day.

### F6. The Arabic name of the core object — the dossier — is unstable across the app [severity: P1] [class: i18n]

- Route: systemic
- Observed: Three competing terms for "dossier": **دوسيه/الدوسيهات** (hub title "جميع الدوسيهات", create page, list search placeholder), **ملف/الملفات** (dashboard widget "الملفات الأخيرة", topbar search "ابحث في الملفات…", breadcrumb "مركز الملفات", quick-look "نظرة سريعة على الملف", countries subtitle "جميع ملفات الدول"), and brand "دوسييه". Same instability for engagement: nav says **الارتباطات**, the page it opens is titled **المشاركات**, and the create card says **ارتباط** — nav label and page title disagree on the same click. Countries: nav **البلدان** vs page title **الدول** on the same screen. For a terminology-driven workspace this is the single biggest "unfinished" tell for an Arabic reader.
- Evidence: shots/designcritic/ar_dossiers_1440.png, ar_countries_1440.png, ar_engagements_1440.png, ar_dashboard_1440.png
- Data-vs-wiring: feature not wired (translation-glossary drift across namespaces)
- Suggested fix (1 line): Pick one glossary (recommend ملف for dossier, ارتباط for engagement, الدول for countries) and sweep all ar namespaces against it.

### F7. Engagements filter chips break onto an overlapping second row in both languages [severity: P1] [class: design]

- Route: /engagements (EN and AR, 1440)
- Observed: The type filter renders "All | Meeting" beside the search box and orphans "Travel" onto a second line that collides with the row below — with ~700px of free width available. Mirrored identically broken in AR ("سفر" orphaned). Looks accidental (fixed-width flex container), not responsive wrapping.
- Evidence: shots/designcritic/en_engagements_1440.png, ar_engagements_1440.png
- Data-vs-wiring: feature not wired (layout bug)
- Suggested fix (1 line): Put the three chips in one flex row (flex-nowrap w-fit) beside the search input.

### F8. Engagement meta line ships raw enums and an ISO week header [severity: P2] [class: devcopy]

- Route: /engagements
- Observed: Row meta reads "Sat 04 Jul 01:00 GST · meeting · in_progress · Riyadh · GASTAT HQ" — `in_progress` with underscore is a raw status enum shipped to users; in AR the enums stay English ("travel · scheduled") inside Arabic rows. Group header is "WEEK OF 2026-W27" / "أسبوع 2026-W27" — an ISO week number where the contract format would be a date ("Week of Mon 29 Jun").
- Evidence: shots/designcritic/en_engagements_1440.png, ar_engagements_1440.png
- Data-vs-wiring: feature not wired (missing enum→label map + week formatter)
- Suggested fix (1 line): Map status/type enums through i18n labels and format the week header from its start date.

### F9. Dossier detail KPI labels truncate at the default desktop width [severity: P2] [class: design]

- Route: /dossiers/:id/overview (EN, 1440)
- Observed: First and last KPI cards render "Related Doss..." and "Upcoming Ev..." — the page's own six KPI cards can't fit their own labels at 1440, the primary analyst width. AR fits (shorter labels), making EN look like the untested language.
- Evidence: shots/designcritic/en_dossiers_b0000001-…\_overview_1440.png
- Data-vs-wiring: feature not wired (fixed card min-width + truncate)
- Suggested fix (1 line): Let KPI labels wrap to two lines (or shorten to "Related", "Upcoming").

### F10. Search inputs paint the magnifier icon on top of the placeholder text [severity: P2] [class: design]

- Route: /my-work (work-items search) and /dossiers (saved-views search), EN 1440 + 1024
- Observed: The icon overlaps the first letter — placeholder reads "🔍earch work items…" / "🔍earch dossiers…". Same shared block in two places; the countries list search (different component) is fine.
- Evidence: shots/designcritic/en_my-work_1440.png (x≈300,y≈710), en_dossiers_1440.png (bottom card)
- Data-vs-wiring: feature not wired (missing ps-9 on the input)
- Suggested fix (1 line): Add start padding to the input in the shared searchbox used by my-work/hub.

### F11. Calendar empty state violates the voice contract five ways [severity: P2] [class: design]

- Route: /calendar (EN/AR)
- Observed: "Your Calendar is Empty" (Title Case), "Use a Template" / "Create from Scratch" (Title Case), "Quick setup with smart defaults" + "Recommended for you" (marketing voice), the link **"I'll add events later"** (first-person user-voice copy — the exact register the contract bans; AR mirrors it: "سأضيف الفعاليات لاحقاً"), and a template chip labeled **"Deadline / Due Date"** — the glossary explicitly retired "Due Date" in favor of "Deadline", and this chip ships both, styled as a solid danger-filled button (an off-recipe fourth variant). Template cards also use dashed borders where the contract knows only 1px solid hairlines.
- Evidence: shots/designcritic/en_calendar_1440.png, ar_calendar_1440.png
- Data-vs-wiring: feature not wired (copy + recipe)
- Suggested fix (1 line): Rewrite empty-state copy in sentence-case analyst voice ("Add your first event", "Skip for now"), rename chip to "Deadline", restyle as .btn-ghost.

### F12. Five different formats for the same overdue-age concept [severity: P2] [class: design]

- Route: cross-screen
- Observed: Dashboard says "271d" (and leaves "271d" untranslated in AR), kanban says "Overdue 271d" / correctly translated "متأخر 271 يوم", my-work rows say "9 months ago", quick-look meta says "Last touched 40d ago", quick-look commitments say mono "T-232". Same quantity, five presentations — and the AR dashboard inherits the raw "d" suffix. The contract's SLA format (T-3/T+2) is being stretched to T-232 where it stops reading as a window.
- Evidence: shots/designcritic/en_dashboard_1440.png, en_kanban_1440.png, en_my-work_1440.png, en_dossiers_countries_1440.png
- Data-vs-wiring: feature not wired (no shared duration formatter)
- Suggested fix (1 line): One overdue formatter (mono "271d" EN / "271 يوم" AR) used by dashboard, kanban, my-work, and quick-look.

### F13. Title Case is the de-facto style; the contract mandates sentence case [severity: P2] [class: design]

- Route: systemic (EN)
- Observed: "Recent Dossiers", "Overdue Commitments", "Week Ahead", "Intake Queue", "No Pending Reviews", "Evaluation Criteria", "Create New Dossier", "Board View", "Import Dossiers", "Saved Views", "Profile Settings", "Upload Photo", "Work Board"… Practically every heading and button except the dashboard header actions ("New request", "New engagement" — which are correct, proving the inconsistency: dashboard says "New request" while intake says "New Request").
- Evidence: every EN screenshot in shots/designcritic/
- Data-vs-wiring: feature not wired (copy authored off-contract)
- Suggested fix (1 line): One sweep of en namespaces to sentence case (keep UPPERCASE only for the mono table headers/section labels, which are correctly uppercase today).

### F14. "1 members" / "1 أعضاء" — no plural rules on team workload [severity: P2] [class: i18n]

- Route: /my-work (EN and AR)
- Observed: The Team Workload chip shows "1 members" (EN) and "1 أعضاء" (AR — plural-of-paucity with a singular count, reads machine-generated). Verified: `pages/my-work/components/TeamWorkloadPanel.tsx:72` concatenates `nf.format(length) + t('team.members','members')` with no i18next plural forms; Arabic needs the full plural category set.
- Evidence: shots/designcritic/en_my-work_1440.png chip; TeamWorkloadPanel.tsx:72
- Data-vs-wiring: feature not wired
- Suggested fix (1 line): Use `t('team:members', {count})` with \_one/\_two/\_few/\_other forms in both bundles.

### F15. Search page example chips are hardcoded English in Arabic [severity: P2] [class: i18n]

- Route: /search (lang=ar)
- Observed: Under a fully-Arabic empty state, the four suggestion chips read "climate", "G20", "UN", "Saudi Arabia" in Latin. Verified hardcoded array at `pages/DossierSearchPage.tsx:292`.
- Evidence: shots/designcritic/ar_search_1440.png; DossierSearchPage.tsx:292
- Data-vs-wiring: feature not wired
- Suggested fix (1 line): Localize the suggestions (المناخ، مجموعة العشرين، الأمم المتحدة، السعودية) via i18n.

### F16. Quick-look "recent activity" line is a bidi garble in AR and sloppy in EN [severity: P2] [class: rtl]

- Route: quick-look drawer (countries)
- Observed: EN renders "8 Jun&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;— E2E UAE task 13333" with stray gaps and a dangling em-dash; AR reorders it to "…E2E UAE task — · يونيو 8" with the date run reversed mid-line. The drawer meta line also ships a literal "—" placeholder ("Global · — · 0 engagements"), and each open commitment carries an empty "—" line under its T-code.
- Evidence: shots/designcritic/en_dossiers_countries_1440.png, ar_dossiers_countries_page_1_1440.png
- Data-vs-wiring: mixed — the "—"s are missing data rendered verbatim; the bidi order is wiring (missing dir isolation on the Latin title + date)
- Suggested fix (1 line): Wrap the activity title in a bdi/dir=auto span, drop empty fields instead of printing "—".

### F17. Country chips use name initials, not ISO — "CH" badges China [severity: P3] [class: design]

- Route: /dashboard → Overdue Commitments group headers
- Observed: Avatar chips show "UA" for United Arab Emirates and "CH" for China. In a foreign-affairs product those read as ISO codes — and CH is Switzerland, UA is Ukraine. The countries list right next door has correct SVG flags.
- Evidence: shots/designcritic/en_dashboard_1440.png
- Data-vs-wiring: feature not wired (chip derives from name.slice(0,2))
- Suggested fix (1 line): Reuse the flag SVGs (public/assets/flags/{iso}.svg) in the group header chip.

### F18. Floating refresh FAB: unmirrored in RTL and off-contract [severity: P3] [class: rtl]

- Route: every protected route
- Observed: An accent-filled circular FAB sits bottom-right in LTR **and stays bottom-right in RTL** (physical positioning; every other shell element mirrors). The component itself — floating accent circle with shadow — belongs to no recipe in the contract (shadow is reserved for drawers; buttons are btn-primary/ghost/secondary).
- Evidence: shots/designcritic/ar_dashboard_1440.png vs en_dashboard_1440.png (same corner)
- Data-vs-wiring: feature not wired (uses `right-*` not `end-*`)
- Suggested fix (1 line): Position with `end-*`; consider replacing the FAB with a topbar ghost refresh button to stay on-recipe.

### F19. Dossier detail defaults to its only empty tab; dev-speak footer [severity: P3] [class: design]

- Route: /dossiers/:id/overview
- Observed: Default tab is "Related Dossiers (0)" showing "No relationships mapped" while "Work Items (4)" sits populated one tab over; Work Items shows a duplicated count — "(4)" plus a red "4" badge. Footer reads "Data generated at: Sat 15 Aug 01:56 GST" — report-generator voice on a live page (and English-dated in AR, see F5).
- Evidence: shots/designcritic/en_dossiers_b0000001-…\_overview_1440.png
- Data-vs-wiring: partly data (counts real), default-tab choice and dup badge are wiring
- Suggested fix (1 line): Default to the first non-empty tab (or Work Items), drop the duplicate badge and the footer line.

### F20. "Never synced" chip shipped to end users [severity: P3] [class: devcopy]

- Route: /my-work and /my-work/intake toolbars
- Observed: A status chip reading "Never synced" / "لم تتم المزامنة" sits in the list toolbar — sync internals surfaced as user copy, twice on one page (toolbar + list header).
- Evidence: shots/designcritic/en_my-work_1440.png (two instances)
- Data-vs-wiring: unsure — may be a real sync state, but the wording is infra-facing
- Suggested fix (1 line): Hide when never-synced, or reword to "Updated just now / Updated 5m ago" semantics.

### F21. Calendar view toggle controls nothing when empty [severity: P3] [class: design]

- Route: /calendar
- Observed: Month/Week/Day segmented control renders above an empty-state card, with no calendar grid anywhere; toggling changes nothing visible. An empty calendar should still show its month grid — that's what tells an analyst "this works, there's just nothing scheduled".
- Evidence: shots/designcritic/en_calendar_1440.png
- Data-vs-wiring: no data seeded exposes it, but replacing the grid entirely is a wiring/design choice
- Suggested fix (1 line): Always render the grid; overlay the create-prompt as an inline banner instead.

### F22. Dashboard has 6 unlabeled icon-only buttons [severity: P3] [class: a11y]

- Route: /dashboard (probe count: 6; /search: 1)
- Observed: Icon-only controls (row open-arrows, digest refresh, FAB) with no aria-label/title.
- Evidence: json/designcritic/en_dashboard_1440.json unlabeledButtons:6
- Data-vs-wiring: feature not wired
- Suggested fix (1 line): aria-label each icon button (open, refresh, etc.) in both languages.

### F23. One hub, four names [severity: P3] [class: design]

- Route: /dossiers vs detail breadcrumb
- Observed: The same destination is "All Dossiers" (page title), "Dossiers Hub" (breadcrumb), "جميع الدوسيهات" and "مركز الملفات". EN and AR each disagree with themselves.
- Evidence: shots/designcritic/en_dossiers_1440.png vs en_dossiers_b…\_overview_1440.png breadcrumb
- Data-vs-wiring: feature not wired (copy)
- Suggested fix (1 line): One name per language ("Dossiers" / "الملفات") everywhere.

### F24. Test/seed artifacts undermine the first-run impression [severity: P3] [class: devcopy]

- Route: /dashboard, /kanban, /my-work, quick-look
- Observed: "UAT round-11 commitment", "Test commitment for China partnership", "E2E UAE task 13333" headline the Overdue Commitments widget and kanban — with 271-day overdue ages that make the demo data look like neglect. (Data, not wiring — but it's what every stakeholder demo shows.)
- Evidence: shots/designcritic/en_dashboard_1440.png, en_kanban_1440.png
- Data-vs-wiring: no data seeded (bad seed content)
- Suggested fix (1 line): Reseed staging with plausible diplomatic work items dated within the last quarter.

## Retracted after verification

- Suspected "AR active-nav renders a bright accent bar unlike EN": pixel-sampled both screenshots — identical rgb(36,41,71); a downscaled-viewing artifact, not a bug.

## Routes that are genuinely fine

- /settings (both languages; well-mirrored, textarea resize handle mirrors, good Arabic)
- /dossiers/create type picker (both; correct mirrored grid, good Arabic copy)
- /kanban (both, 1440 + 1024; the best-localized screen — "متأخر 271 يوم" is the model the rest should copy)
- /dossiers/countries table layout (flags, mirrored columns, sensitivity badges)
- 404 page in EN (clean, sentence case, correct button recipes)
- Token discipline everywhere: no color-literal classes, no card shadows, no gradients, ladder respected, radii 6/8/12, Tajawal applies, no horizontal overflow at 1440/1024 in either language
