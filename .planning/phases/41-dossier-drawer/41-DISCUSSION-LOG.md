# Phase 41: dossier-drawer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-01
**Phase:** 41-dossier-drawer
**Areas discussed:** Open trigger + page strategy, Mount strategy: URL or context, Data wiring + KPI mapping, CTA + commitment click targets

---

## Open trigger + page strategy

| Option                                 | Description                                                                                                                                                              | Selected |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Drawer replaces row navigation         | Row click opens drawer; full /dossiers/{type}/$id route preserved for direct URL/bookmarks. Drawer has 'Open full dossier' CTA. Closest to handoff prototype.            |          |
| Drawer augments via separate gesture   | Row click still navigates to /dossiers/{type}/$id (Phase 40 wiring unchanged). Drawer opens via separate gesture (preview icon button or ⌘+click). Two surfaces coexist. |          |
| Drawer-only on dashboard + calendar    | Lists keep current full-page navigation. Drawer mounts only from dashboard widgets and calendar event clicks (linkedItemType=dossier).                                   | ✓        |
| Drawer everywhere, deprecate full page | Drawer becomes canonical dossier view. /dossiers/$id/overview deleted. Most aggressive — biggest blast radius.                                                           |          |

**User's choice:** Initially "I think it depends. Please decide for me" → Claude recommended Option 3 (Drawer-only on dashboard + calendar) with preserved Phase 40 list navigation and an "Open full dossier" CTA inside the drawer header. User confirmed: "Yes, ship that (Recommended)".

**Notes:** Reasoning for Option 3:

1. Phase 40 just shipped row-click → /dossiers/{type}/$id navigation; ripping that out in Phase 41 is a regression on shipped work
2. /dossiers/$id/overview is a real aggregated view (relationships, documents, work items, calendar, contacts, activity) that the 720px drawer doesn't replace
3. Lists are destination workflows ("show me all countries"); drawer is for inline references ("what's this dossier I see in this widget")
4. DRAWER-01..03 only require the drawer can be opened, has the right anatomy, flips RTL, full-screen on mobile — they don't dictate which surfaces open it

---

## Mount strategy: URL or context

| Option           | Description                                                                                                                                                        | Selected |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| URL search param | ?dossier=<id>&dossierType=<type> on current route. Browser back closes; refresh restores; URL is shareable. TanStack Router validateSearch already used elsewhere. | ✓        |
| Context provider | <DossierDrawerProvider> with openDossier(id, type) / closeDossier(). In-memory only — refresh closes it; not shareable. Faster to ship.                            |          |
| Parallel route   | Separate route segment for the drawer. Most invasive — requires router-tree changes and parallel slot layout.                                                      |          |

**User's choice:** URL search param

**Notes:** Analyst-tool deep-link expectations matter — the user expects to share a quick-look URL with a teammate, expects browser-back to dismiss the overlay, and expects refresh to keep them where they were. Search-param plumbing is small (~30 lines including schema + hook + drawer mount). Schema declared via TanStack Router validateSearch on the protected layout (\_protected/route.tsx).

---

## Data wiring + KPI mapping

### Data source

| Option                                | Description                                                                                                                                           | Selected |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| useDossierOverview aggregate          | Single useDossierOverview call covers stats + Upcoming + Activity + Open Commitments. One loading state, one cache key, one network round-trip.       | ✓        |
| Per-section hooks                     | useDossier core + useDossierActivityTimeline infinite + work-items query. Independent loading skeletons; infinite scroll for activity. More plumbing. |          |
| Hybrid: aggregate + activity infinite | Aggregate for stats + Upcoming + Open Commitments; useDossierActivityTimeline for Recent Activity only. Pragmatic compromise.                         |          |

**User's choice:** useDossierOverview aggregate

### KPI mapping

| Option                               | Description                                                                                                                                        | Selected |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Calendar+work-items mapping          | engagements → calendar_events_count; commitments → work_items by source==='commitment'; overdue → overdue_work_items; documents → documents_count. | ✓        |
| Work-items-only mapping              | engagements → work_items by source==='engagement'; commitments → work_items by source==='commitment'; etc. Decouples from calendar_events.         |          |
| Defer specific mapping to researcher | Lock the four labels and visual placement; researcher reads dossier-overview Edge Function to determine canonical aggregate per metric.            |          |

**User's choice:** Calendar+work-items mapping

**Notes:** Activity uses fixed top-4 slice (no infinite scroll inside drawer — Phase 38 D-11 fixed-slice precedent). Researcher confirms calendar_events_count includes engagement-type events; if not, planner adds engagement_type filter on work_items section as fallback.

---

## CTA + commitment click targets

### CTAs

| Option                                     | Description                                                                                                                                                               | Selected |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Log Engagement wired; Brief + Follow stubs | 'Log engagement' navigates to engagement-create with prefill. 'Brief' + 'Follow' are visual stubs (aria-disabled + "Coming soon" tooltip) per Phase 39 D-06 stub pattern. | ✓        |
| All three wired                            | All three navigate to existing flows. Most complete but adds wiring risk per CTA.                                                                                         |          |
| All three as stubs                         | All three rendered with handoff visual but aria-disabled. Phase 41 only delivers the drawer surface itself.                                                               |          |

**User's choice:** Log Engagement wired; Brief + Follow stubs

### Open Commitment row click

| Option                                | Description                                                                                                                | Selected |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------- |
| Open existing work-item detail dialog | Click → opens whatever surface Phase 39 D-09 wired for work-item details. Drawer stays open behind dialog (z-index stack). | ✓        |
| Navigate to work-item route           | Click → navigate to /work-items/$id. Drawer closes via URL change. Simpler than stacked dialog.                            |          |
| Visual-only this phase                | Render the row exactly per handoff but row is not clickable. Click target deferred.                                        |          |

**User's choice:** Open existing work-item detail dialog

**Notes:** Reuses Phase 39 D-09 work-item detail dialog without changes. Drawer at z-41 (handoff CSS); dialog at z-50+. Researcher confirms which component handles WorkItem.source === 'commitment' detail rendering.

---

## Claude's Discretion

- **Primitive choice:** HeroUI v3 Drawer per CLAUDE.md component cascade (HeroUI for accessible primitives unless not covered) styled with handoff `.drawer-*` CSS classes. Fallback to existing Radix `Sheet` (already in repo with handoff-aligned classnames) if HeroUI Drawer's RTL placement props don't cleanly support inline-end/inline-start semantics. Researcher decides during research, planner finalizes.
- **Sensitivity chip threshold** — researcher confirms which sensitivity_level integer values map to "CONFIDENTIAL" labeling (likely >= 3); chip uses chip-warn class per handoff line 486.
- **Meta strip composition** — handoff "📍 Global · Lead: {name} · 22 engagements · Last touched today". Researcher maps each segment from real data; "📍" emoji replaced with token-driven map-pin icon per CLAUDE.md no-emoji rule.
- **Recent Activity row composition** — handoff `.act-row` uses `time | dot-icon | who + what` grid. Researcher locates `activity_timeline.activities[].actor_name` / `.action_label` / `.created_at` field names.
- **Bilingual digit rendering** — engagement count, KPI values, days-overdue, last-touched relative time via existing `toArDigits` utility (Phase 39/40 precedent).
- **Empty states per section** — bilingual concise copy per section; KPI strip renders 0 literally (no empty-state for the strip itself).
- **CTA i18n keys** — `dossier-drawer:cta.{log_engagement,brief,follow,open_full_dossier,coming_soon,close}`.
- **Animation timing** — `var(--dur)` (Phase 33 token) with `ease-out` if handoff doesn't specify a transition rule.

## Deferred Ideas

- **Brief CTA wiring** — likely targets future Phase 42 Briefs page or an existing brief view route (not wired this phase)
- **Follow CTA wiring** — dossier_subscriptions toggle endpoint or new API; not in current Edge Function set. Defer to a future "dossier follow / digest" phase
- **List-row preview affordance / ⌘+click on list rows** — not selected; lists keep current row navigation. Could be added in a future polish phase if usage signals it matters
- **Activity-timeline infinite scroll inside the drawer** — drawer uses fixed top-4 slice; full scroll lives on /dossiers/$id/overview page
- **Drawer-stacked-on-drawer for related dossiers** — out of scope; drawer doesn't render related_dossiers section in Phase 41
- **Engagement-source work-item filter** — if stats.calendar_events_count doesn't reflect engagement-type events accurately, planner may add an engagement_type filter on the work_items section. If neither path covers it, consider adding engagements_count to DossierOverviewStats in a separate API phase
- **Replacing /dossiers/$id/overview with the drawer** — out of scope; page is a real aggregated view that the 720px drawer doesn't replace
- **Mobile breakpoint visual regression snapshots** — Phase 38/40 precedent is render assertion only
- **"📍 Global" location segment fallback** — handoff hard-codes "Global"; researcher proposes real source (dossier.metadata.region / country.iso) or defer to a future enrichment phase
