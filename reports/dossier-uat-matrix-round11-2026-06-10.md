# Dossier UAT Matrix - Round 11 - 2026-06-10

Scope: bucket-A fixes landed in `2eef7c75` (round 6), `87d61b52` (round 7), `f48dfc60` (round 8), `048fb2b9` (round 9), and `d30789f1` (round 10).

Run target: `http://localhost:5173`, logged in as admin. Frontend uses staging Supabase `zkrcjzdemdmwhearhfgg` and local Express backend through the Vite proxy.

Route notes:

- Dossier tabs are path routes, not tab query params: `/overview`, `/engagements`, `/docs`, `/tasks`, `/timeline`, plus extras (`/positions`, `/mous`, `/committees`). Do not use `?tab=...` for dossier detail tabs.
- Drawer query params exist on any protected route: `?dossier=$DOSSIER_ID&dossierType=$TYPE`, where type is one of `country`, `organization`, `forum`, `engagement`, `topic`, `working_group`, `person`, `elected_official`.
- List pages may use their own search params, but none are needed for these checks.

Suggested staging subjects, without querying:

- Country: any country dossier, prefer Saudi Arabia; for contact-count checks prefer one with key contacts if visible.
- Organization: any organization dossier; prefer one with docs/work items if available.
- Forum: any forum dossier; prefer one with scheduled events or relationships.
- Topic: any topic dossier; good for cache-key and hidden document-upload checks.
- Working group: any working-group dossier; prefer one with more than five related members.
- Person: any person dossier; prefer one with linked engagements and work items.
- Elected official: any elected-official dossier; prefer one with office/term data and timeline rows.
- Engagement: any engagement dossier with at least one generated brief and nonzero kanban stats if available.

Suggested walk order:

1. Open the drawer from `/dashboard?dossier=$COUNTRY_ID&dossierType=country`, then immediately visit a full overview page to check cache separation.
2. Walk country overview: key contacts and bilateral summary.
3. Walk one generic dossier shell header, then organization docs/tasks.
4. Walk forum and working-group pages for calendar, relationships, sidebar, and member-list checks.
5. Walk person and elected-official detail tabs.
6. Finish with engagement workspace and engagements list.

## Dashboard Drawer And Cache

### R8-01 - Drawer documents KPI reads loaded documents section

- URL(s): `http://localhost:5173/dashboard?dossier=$COUNTRY_ID&dossierType=country` or any protected route with the same drawer params.
- Preconditions: Use any dossier. Prefer one with related documents (MoUs, position papers, or briefs). If no documents exist, the KPI may legitimately be `0`.
- Steps:
  1. Visit the URL with drawer params.
  2. Wait for the quick-look drawer body to finish loading.
  3. Inspect the KPI strip row for `Documents`.
- Expected EN: KPI strip shows `Engagements`, `Commitments`, `Overdue`, `Documents`. `Documents` reflects the dossier overview documents section; it is not forced to `0` when documents exist.
- Expected AR: labels are `ارتباطات`, `التزامات`, `متأخر`, `مستندات`; digits are Arabic-Indic, for example `١` instead of `1`.
- Failure signature: `Documents` is always `0` even for a dossier known to have MoUs/briefs/positions; network overview request omits `documents`.
- Verifiability: BROWSER-PARTIAL - fully browser-visible, but positive proof depends on a dossier with documents.

### R8-02 - Overview cache key includes requested sections

- URL(s): first `http://localhost:5173/dashboard?dossier=$TOPIC_ID&dossierType=topic`, then `http://localhost:5173/dossiers/topics/$TOPIC_ID/overview`; also useful: `http://localhost:5173/dossiers/organizations/$ORG_ID/docs`.
- Preconditions: Use a topic or organization with any related dossiers, work items, calendar rows, activity, or documents. Empty dossiers can only prove the page does not crash.
- Steps:
  1. Open the drawer for the dossier and wait for it to load.
  2. Close the drawer.
  3. Navigate to the dossier full overview or docs tab without hard-refreshing.
  4. Watch overview cards and analytics after loading.
- Expected EN: full-page cards load the sections they ask for; a drawer response does not poison the full overview with false zero/empty values.
- Expected AR: no locale-specific string changed; Arabic pages should show the same data fidelity in RTL.
- Failure signature: after opening the drawer, full overview cards or docs tab show empty/zero values until hard refresh or cache expiry.
- Verifiability: BROWSER-PARTIAL - requires data that differs across requested overview sections.

## Country Overview

### R6-01 - Key Contacts removed dead `?tab=contacts` deep link

- URL(s): `http://localhost:5173/dossiers/countries/$COUNTRY_ID/overview`; old invalid target was `/dossiers/countries/$COUNTRY_ID?tab=contacts`.
- Preconditions: Prefer a country with more than five key contacts. If five or fewer exist, verify only that no `View all` contact affordance appears.
- Steps:
  1. Open country overview.
  2. Find `Key Contacts`.
  3. If more than five contacts render, inspect the overflow line.
  4. Confirm there is no clickable `View all` link and no navigation to `?tab=contacts`.
- Expected EN: overflow is plain muted text like `+2 more contacts`, not a button/link.
- Expected AR: overflow uses `+{{count}} جهة اتصال أخرى`, for example `+٢ جهة اتصال أخرى`.
- Failure signature: clickable `View all {{count}} contacts` navigates to a non-existent `?tab=contacts` state.
- Verifiability: BROWSER-PARTIAL - positive overflow check needs more than five contacts.

### R10/R6-02 - Key Contacts query narrowed to live columns

- URL(s): `http://localhost:5173/dossiers/countries/$COUNTRY_ID/overview`.
- Preconditions: Use any country dossier. Prefer Saudi Arabia. Contacts may be present or absent.
- Steps:
  1. Open DevTools console/network.
  2. Open country overview and wait for `Key Contacts`.
  3. Check that the overview request does not 400 on `key_contacts`.
  4. If contacts exist, verify names/role/organization render; if none exist, verify the empty state renders.
- Expected EN: either contact rows or `No contacts linked`; no missing-column error. Rich fields absent live (photo/person link/Arabic title) degrade silently to text-only rows.
- Expected AR: either contact rows or `لا توجد جهات اتصال مرتبطة`; no raw key or error text.
- Failure signature: Supabase/PostgREST 400 for missing columns such as `name_ar`, `title_en`, `photo_url`, or `linked_person_dossier_id`; card is always empty.
- Verifiability: BROWSER - network/console absence of the old 400 is directly testable.

### R9-01 - Bilateral summary counts use locale-aware digits

- URL(s): `http://localhost:5173/dossiers/countries/$COUNTRY_ID/overview`.
- Preconditions: Prefer a country with bilateral relationships or MoUs. If none exist, the card may show `No bilateral data available`.
- Steps:
  1. Open country overview in EN.
  2. Inspect `Bilateral Summary` count values for `Bilateral Partners` and `Key Agreements`.
  3. Switch topbar to Arabic.
  4. Reinspect the same values.
- Expected EN: numeric counts are normal English digits, e.g. `2`.
- Expected AR: labels include `الملخص الثنائي`, `الشركاء الثنائيون`, `الاتفاقيات الرئيسية`; counts use Arabic-Indic digits, e.g. `٢`.
- Failure signature: Arabic UI shows Latin digits such as `2` in the count cells.
- Verifiability: BROWSER-PARTIAL - needs nonzero counts to see the digit difference.

## Shared Dossier Shell

### R7-03 - Placeholder Audit tab hidden from dossier tab nav

- URL(s): any dossier detail overview, e.g. `http://localhost:5173/dossiers/forums/$FORUM_ID/overview`. Direct placeholder routes still exist, e.g. `/dossiers/forums/$FORUM_ID/audit`.
- Preconditions: Use any shell dossier type: country, organization, forum, topic, working_group, person, or elected_official.
- Steps:
  1. Open a dossier overview.
  2. Inspect the tab row.
  3. Confirm `Audit Log` is not shown as a normal tab.
  4. Optional: direct-open `/audit` and confirm it is still a placeholder route, not a tab-nav destination.
- Expected EN: tab row shows real tabs only, such as `Overview`, `Engagements`, `Documents`, `Tasks`, `Timeline`, plus type extras. No `Audit Log` tab.
- Expected AR: tab row shows `نظرة عامة`, `المشاركات`, `المستندات`, `المهام`, `الجدول الزمني`; no `سجل المراجعة` tab.
- Failure signature: `Audit Log` / `سجل المراجعة` appears in nav and opens `Content coming soon` / `المحتوى قريبًا`.
- Verifiability: BROWSER.

### R6-11 - Add-to-Dossier context badge localizes inheritance source

- URL(s): any dossier detail route with header menu, e.g. `http://localhost:5173/dossiers/organizations/$ORG_ID/overview`.
- Preconditions: Any dossier where the header `Add to Dossier` menu loads.
- Steps:
  1. Open the dossier.
  2. Click `Add to Dossier`.
  3. Open any dialog, for example `New Commitment` or `Schedule Event`.
  4. Inspect the context badge beside `Will be linked to`.
  5. Repeat after switching to Arabic.
- Expected EN: badge is `Direct` for direct dossier actions. Other supported sources are `Engagement`, `After-action`, `Position`, `MoU`.
- Expected AR: badge is `مباشر`. Other supported sources are `مشاركة`, `ما بعد الاجتماع`, `موقف`, `مذكرة تفاهم`.
- Failure signature: raw `direct`, `engagement`, `after_action`, `position`, or `mou` appears in the badge.
- Verifiability: BROWSER.

### R10/R6-06-mitigation - Broken Upload Document action removed from Add-to-Dossier menu

- URL(s): `http://localhost:5173/dossiers/topics/$TOPIC_ID/overview` or any dossier detail route.
- Preconditions: Any dossier where `Add to Dossier` menu loads.
- Steps:
  1. Open the dossier.
  2. Click `Add to Dossier`.
  3. Inspect the `Content & Info` group.
- Expected EN: `Add Relationship` and `Generate Brief` are present; `Upload Document` is absent.
- Expected AR: `إضافة علاقة` and `إنشاء موجز` are present; `رفع مستند` is absent.
- Failure signature: `Upload Document` opens a file picker and later fails due multipart upload to a JSON-only edge/table contract.
- Verifiability: BROWSER.

## Organization Tasks And Docs

### R8-03 - Documents tab removes inert view/download icon buttons

- URL(s): `http://localhost:5173/dossiers/organizations/$ORG_ID/docs`.
- Preconditions: Prefer an organization with documents in the docs tab. If no documents exist, verify the empty state only.
- Steps:
  1. Open organization docs tab.
  2. If document cards appear, inspect the right side of each card.
  3. Confirm no eye/download icon buttons are rendered without actions.
- Expected EN: document cards show title, document type, status, classification/date/size as applicable; no inert view/download buttons.
- Expected AR: tab labels include `المستندات`; empty states include `لم يتم العثور على مستندات`; no unlabeled inert icon buttons.
- Failure signature: eye/download icon buttons exist but do nothing and have no accessible label.
- Verifiability: BROWSER-PARTIAL - positive card check needs documents.

### R7-02 - Work-item priorities normalize deprecated values

- URL(s): `http://localhost:5173/dossiers/organizations/$ORG_ID/tasks`; also valid on `/dossiers/working_groups/$WG_ID/tasks`.
- Preconditions: Need linked work items whose raw priority may be `critical`, `normal`, or unknown. If staging data lacks those values, verify no raw priority keys appear in ordinary rows.
- Steps:
  1. Open the tasks tab.
  2. Inspect priority badges on tasks, commitments, and intake rows.
  3. Switch to Arabic and reinspect.
- Expected EN: badges are only `Low`, `Medium`, `High`, `Urgent`; old `critical` displays as `Urgent`, old `normal` as `Medium`, unknown as `Medium`.
- Expected AR: badges are only `منخفض`, `متوسط`, `عالي`, `عاجل`; old `critical` displays as `عاجل`, old `normal` as `متوسط`.
- Failure signature: raw `priority.critical`, `priority.normal`, `critical`, `normal`, or an unstyled/incorrect urgent badge appears.
- Verifiability: BROWSER-PARTIAL - depends on deprecated priority rows.

### R10/R6-03-part - Position dossier link edge uses `created_by`

- URL(s): related UI starts at `http://localhost:5173/dossiers/organizations/$ORG_ID/overview`, but this specific fix is in `supabase/functions/positions-dossiers-create/index.ts`.
- Preconditions: Do not use the header `New Position` action for this check; position-create defaults remain phase work. This fix is only the link-edge insert field after a position exists.
- Steps:
  1. Treat browser testing as out of scope unless there is a separate approved UI that links an existing position to a dossier.
  2. If such a UI is available and writes are allowed, link a disposable existing position to a disposable dossier.
  3. Verify no edge error references `linked_by`.
- Expected EN: approved link path succeeds against `position_dossier_links.created_by`.
- Expected AR: no locale change.
- Failure signature: edge rejects insert because `linked_by` column does not exist.
- Verifiability: NOT-BROWSER - edge-deploy/link-contract check; the visible `New Position` dialog is still intentionally not a valid full create workflow.

## Forum And Calendar

### R10/R6-04 - Dossier Engagements tab reads `calendar_entries`

- URL(s): `http://localhost:5173/dossiers/forums/$FORUM_ID/engagements`; same shared reader affects any `/dossiers/*/$id/engagements` and drawer event KPI.
- Preconditions: Prefer a dossier with scheduled dossier-linked `calendar_entries`. If none exist, verify the tab does not error and shows an empty state.
- Steps:
  1. Open the forum engagements tab.
  2. Inspect event rows grouped with related engagements.
  3. Open DevTools network if needed and confirm no `calendar_events` table request is used for the dossier overview section.
- Expected EN: dossier-linked scheduled events from the operational calendar appear when present; title/location/date render normally.
- Expected AR: event labels use existing overview/event translations, for example `اجتماع`, `موعد نهائي`, `تذكير`, when those event types are present.
- Failure signature: events created from `Schedule Event` remain invisible because the reader queries empty `calendar_events`; console/network may show the wrong table.
- Verifiability: BROWSER-PARTIAL - positive proof needs dossier-linked calendar entries.

### R8-05 - Relationship sidebar labels and remove controls localized

- URL(s): `http://localhost:5173/dossiers/forums/$FORUM_ID/overview`.
- Preconditions: Prefer a forum with at least one linked dossier. If none exist, use sidebar empty state plus `Link Dossier` button as limited coverage.
- Steps:
  1. Open the forum overview on desktop width (`lg` or wider).
  2. Ensure the relationship sidebar is expanded.
  3. Inspect tier headers, relationship-type labels, remove icon accessible label, and remove confirmation buttons.
  4. Repeat in Arabic.
- Expected EN: tier labels are `Strategic`, `Operational`, `Informational`; relationship labels include values such as `Partnership`, `Cooperates with`, `Related to`; confirm buttons are `Cancel` and `Remove`.
- Expected AR: tier labels are `استراتيجي`, `تشغيلي`, `معلوماتي`; relationship labels include `شراكة`, `يتعاون مع`, `مرتبط بـ`; confirm buttons are `إلغاء` and `إزالة`; remove aria text is `إزالة {{name}}`.
- Failure signature: raw relationship types like `related_to`, English `Cancel`/`Remove`, or English tier labels appear in Arabic.
- Verifiability: BROWSER-PARTIAL - relationship row coverage needs linked dossiers.

## Working Group Overview And Relationships

### R8-06 - Collapsed relationship strip has localized labels and names

- URL(s): `http://localhost:5173/dossiers/working_groups/$WG_ID/overview`.
- Preconditions: Prefer a working group with linked dossiers of one or more types.
- Steps:
  1. Open working-group overview on desktop width.
  2. Collapse the relationship sidebar.
  3. Hover/focus each collapsed icon.
  4. Repeat in Arabic.
- Expected EN: tooltips/accessible names use dossier type labels such as `Country (2)` or `Working Group (1)`.
- Expected AR: tooltips/accessible names use `دولة`, `منظمة`, `منتدى`, `ارتباط`, `موضوع`, `فريق عمل`, `شخص`, `مسؤول منتخب` with counts.
- Failure signature: tooltip text is raw `working_group (1)` / `related_to`, or collapsed icon buttons have no accessible name.
- Verifiability: BROWSER-PARTIAL - needs linked dossiers; accessible name inspection may require browser accessibility snapshot.

### R10/R6-07 - Add Relationship uses canonical source/target contract

- URL(s): `http://localhost:5173/dossiers/working_groups/$WG_ID/overview`; also `http://localhost:5173/dossiers/elected-officials/$EO_ID/overview`.
- Preconditions: Use a disposable source dossier and a valid target dossier UUID if submitting. Dialog-only option checks do not require writes.
- Steps:
  1. Open the dossier.
  2. Click `Add to Dossier` -> `Add Relationship`.
  3. Confirm default relationship type is `Related to`.
  4. Open the relationship type dropdown.
  5. If writes are allowed, enter a target dossier UUID and submit once, watching the network request.
- Expected EN: options are `Related to`, `Member Of`, `Participates In`, `Cooperates with`, `Hosted by`. Submit posts to `/functions/v1/dossier-relationships` with `source_dossier_id`, `target_dossier_id`, and `relationship_type`.
- Expected AR: options are `مرتبط بـ`, `عضو في`, `يشارك في`, `يتعاون مع`, `مستضاف من`.
- Failure signature: old options `Collaborates With`, `Monitors`, `Hosts`; payload has `child_dossier_id`; request hits `dossiers-relationships-create?dossierId=...` and 400s.
- Verifiability: BROWSER-PARTIAL - dialog/options are browser-testable; full proof requires a disposable relationship write.

### R9-04 - Working-group member overflow is honest non-interactive text

- URL(s): `http://localhost:5173/dossiers/working_groups/$WG_ID/overview`.
- Preconditions: Prefer a working group with more than five related member/partner dossiers. If five or fewer exist, verify no fake link appears.
- Steps:
  1. Open working-group overview.
  2. Find the `Members` card.
  3. If more than five related members exist, inspect the overflow row.
- Expected EN: overflow is muted text like `+3 more members`, not clickable.
- Expected AR: overflow uses `+{{count}} أعضاء آخرين`, for example `+٣ أعضاء آخرين`.
- Failure signature: `View all members` appears styled as a link/button but has no route or handler.
- Verifiability: BROWSER-PARTIAL - positive overflow check needs more than five related members.

## Person Detail

### R7-07 - Person Engagements tab localizes relationship/event badges

- URL(s): `http://localhost:5173/dossiers/persons/$PERSON_ID/engagements`.
- Preconditions: Prefer a person dossier with related engagement dossiers and/or calendar events. Empty tab only proves no crash.
- Steps:
  1. Open the person engagements tab.
  2. Inspect badge text on related dossier rows and event rows.
  3. Switch to Arabic and reinspect.
- Expected EN: relationship badges use labels such as `Member Of`, `Related To`, `Bilateral`, and event badges use `Meeting`, `Deadline`, `Reminder`, etc.
- Expected AR: relationship badges use `عضو في`, `مرتبط بـ`, `ثنائي`; event badges use `اجتماع`, `موعد نهائي`, `تذكير`, `مشاركة`, `مراجعة`.
- Failure signature: raw enum badges such as `member_of`, `related_to`, `engagement`, or `deadline`.
- Verifiability: BROWSER-PARTIAL - depends on related rows/events.

### R6-09 - New Commitment invalidates work-items tab and avoids duplicate success toast

- URL(s): start at `http://localhost:5173/dossiers/persons/$PERSON_ID/tasks` and/or `http://localhost:5173/dossiers/persons/$PERSON_ID/overview`.
- Preconditions: Only run on a disposable staging person dossier if writes are allowed. Requires creating a commitment.
- Steps:
  1. Open the person tasks tab and note existing work-item count.
  2. Click `Add to Dossier` -> `New Commitment`.
  3. Fill title and due date, choose owner type, and submit.
  4. Stay on or return to `/tasks`.
  5. Observe toast count and whether the new commitment appears without hard refresh.
- Expected EN: one success toast from the commitment hook; tasks/work-items and timeline refresh so the new commitment is visible.
- Expected AR: dialog labels include `التزام جديد`, `تاريخ الاستحقاق`, `نوع المالك`, `إنشاء التزام`; no duplicate success toasts.
- Failure signature: two success toasts, or the new commitment does not appear on work-items/timeline until manual refresh.
- Verifiability: BROWSER-PARTIAL - browser-testable only with an approved disposable write.

### R8-07 - Mobile relationships trigger has accessible name

- URL(s): `http://localhost:5173/dossiers/persons/$PERSON_ID/overview`.
- Preconditions: Set browser viewport below the `sm` breakpoint so only the icon is visible.
- Steps:
  1. Open person overview on a narrow/mobile viewport.
  2. Locate the icon-only relationship trigger in the header.
  3. Inspect accessible name or use keyboard/screen-reader snapshot.
  4. Repeat in Arabic.
- Expected EN: icon button accessible name is `Relationships`.
- Expected AR: icon button accessible name is `العلاقات`.
- Failure signature: icon-only button has no accessible name.
- Verifiability: BROWSER.

### R9-05 - Shared summary stats use locale-aware digits

- URL(s): `http://localhost:5173/dossiers/persons/$PERSON_ID/overview`; also visible on topic/organization overview cards that use shared stats.
- Preconditions: Prefer a person with any nonzero related dossier, work item, event, or activity stat.
- Steps:
  1. Open person overview in EN and inspect the `Summary` card.
  2. Switch to Arabic and inspect values again.
- Expected EN: labels include `Linked Dossiers`, `Open Work Items`, `Upcoming Events`, `Recent Activity`; numbers are English digits.
- Expected AR: labels include `الدوسيهات المرتبطة`, `عناصر العمل المفتوحة`, `الفعاليات القادمة`, `النشاط الأخير`; numbers use Arabic-Indic digits such as `١`, `٢`, `٣`.
- Failure signature: Arabic summary values render Latin digits.
- Verifiability: BROWSER-PARTIAL - needs nonzero stat values.

## Elected Official Detail

### R8-08 - Timeline covers returned DB status labels

- URL(s): `http://localhost:5173/dossiers/elected-officials/$EO_ID/timeline`.
- Preconditions: Prefer an elected-official dossier whose timeline includes intake/commitment statuses like `draft`, `submitted`, `triaged`, `assigned`, `converted`, `merged`, or `overdue`.
- Steps:
  1. Open the elected-official timeline.
  2. Inspect status badges on activities.
  3. Switch to Arabic and reinspect.
- Expected EN: statuses render as `Draft`, `Submitted`, `Triaged`, `Assigned`, `Converted`, `Merged`, `Overdue` when present.
- Expected AR: statuses render as `مسودة`, `مُرسلة`, `مفروزة`, `معيّنة`, `محوّلة`, `مدمجة`, `متأخرة`.
- Failure signature: raw `draft`, `submitted`, `triaged`, `assigned`, `converted`, `merged`, or `overdue` badges.
- Verifiability: BROWSER-PARTIAL - depends on timeline rows with those statuses.

### R7-08 - Elected-official export dialog label is localized

- URL(s): `http://localhost:5173/dossiers/elected-officials/$EO_ID/overview`.
- Preconditions: Any elected-official dossier.
- Steps:
  1. Open elected-official overview.
  2. Click the header export button.
  3. Inspect dossier type text in the dialog.
  4. Repeat in Arabic.
- Expected EN: dialog type line is `Elected official`.
- Expected AR: dialog type line is `مسؤول منتخب`.
- Failure signature: raw `elected_official` appears in the export dialog.
- Verifiability: BROWSER.

### R9-06 - Elected-official office empty state and term number are localized

- URL(s): `http://localhost:5173/dossiers/elected-officials/$EO_ID/overview`.
- Preconditions: For empty-state check, use an elected official with no office fields. For number check, use one with `term_number`.
- Steps:
  1. Open elected-official overview.
  2. Inspect `Office Information`.
  3. If office data is absent, check the empty copy.
  4. If term number exists, switch to Arabic and inspect its digits.
- Expected EN: empty copy is `No office data available`; term label is `Term Number` with English digits.
- Expected AR: card title `معلومات المنصب`; empty copy `لا تتوفر بيانات المنصب`; term label `رقم الولاية`; term number uses Arabic-Indic digits.
- Failure signature: list-level empty copy appears instead of office-specific copy, or Arabic term number uses Latin digits.
- Verifiability: BROWSER-PARTIAL - depends on office/term data shape.

## Engagement Workspace And List

### R6-05 - Engagement Docs brief card uses engagement-brief labels and no inert View button

- URL(s): `http://localhost:5173/engagements/$ENGAGEMENT_ID/docs`; legacy dossier URL `http://localhost:5173/dossiers/engagements/$ENGAGEMENT_ID` redirects to `/engagements/$ENGAGEMENT_ID/overview`.
- Preconditions: Prefer an engagement with at least one generated/listed brief. If no briefs exist, do not generate unless disposable writes are allowed.
- Steps:
  1. Open the docs tab.
  2. Inspect each brief card badge row.
  3. Confirm there is no `View` button on the card.
  4. Repeat in Arabic.
- Expected EN: brief statuses/types render as `Completed`, `Generating`, `Failed`, `Draft`, `Classic Brief`, `AI Generated`, `Has Citations` when applicable.
- Expected AR: labels render as `مكتمل`, `قيد الإنشاء`, `فشل`, `مسودة`, `موجز كلاسيكي`, `مُنشأ بالذكاء الاصطناعي`, `يحتوي على اقتباسات`.
- Failure signature: raw `draft`, `legacy`, `ai`, hard-coded `Citations`, or an inert `View` button.
- Verifiability: BROWSER-PARTIAL - positive badge check needs brief rows.

### R9-03 - Engagement overview metrics use locale-aware numbers and percent

- URL(s): `http://localhost:5173/engagements/$ENGAGEMENT_ID/overview`.
- Preconditions: Prefer an engagement with lifecycle history and kanban stats. Empty/zero stats still prove formatting for zero only.
- Steps:
  1. Open engagement overview in EN.
  2. Inspect `Days in Stage`, `Task Progress`, and done/total count.
  3. Switch to Arabic and reinspect.
- Expected EN: examples: `3`, `50%`, `2/4`.
- Expected AR: labels are `أيام في المرحلة`, `تقدم المهام`; digits are Arabic-Indic, for example `٣`, `٥٠٪`, `٢/٤`.
- Failure signature: Arabic UI shows Latin digits or plain concatenated percent such as `50%`.
- Verifiability: BROWSER-PARTIAL - nonzero values make this easier to prove.

### R7-05 - Engagement list removes dead Call filter pill

- URL(s): `http://localhost:5173/dossiers/engagements` and `http://localhost:5173/engagements`.
- Preconditions: Any engagement list state.
- Steps:
  1. Open the engagements list.
  2. Inspect filter pills next to search.
  3. Switch to Arabic and reinspect.
- Expected EN: filter pills are `All`, `Meeting`, `Travel`; no `Call` pill. `Event` remains deferred.
- Expected AR: filter pills are `الكل`, `اجتماع`, `سفر`; no `مكالمة` pill. `فعالية` remains deferred.
- Failure signature: `Call` / `مكالمة` appears and filtering to it always produces an empty list.
- Verifiability: BROWSER.
