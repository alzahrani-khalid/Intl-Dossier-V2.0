# SRTL-02 Verification Record — Calendar / Pagination / Sidebar (Arabic RTL)

- **Phase:** 76 — RTL Infrastructure Bridge (shadcn logical properties)
- **Plan:** 76-05, Task 1 (automated evidence pack)
- **Requirement:** SRTL-02 — the three shadcn CLI-exempt components verified RTL-correct in Arabic
- **Date:** 2026-07-02
- **Captured against:** local dev (`pnpm dev` → :5173) + staging Supabase, test user `kazahrani@stats.gov.sa` (admin), AR locale (`localStorage['id.locale']='ar'`, `<html dir="rtl">`)

This record is the durable, human-reviewable evidence for SRTL-02. **Task 1 (automated capture) is complete; Task 2 (human visual sign-off) is APPROVED 2026-07-02** — every "human sign-off" cell below reads `approved (2026-07-02)`.

---

## 1. Automated regression gate — `calendar-rtl.spec.ts`

Command: `cd frontend && pnpm exec playwright test tests/e2e/calendar-rtl.spec.ts`

Result (verbatim):

```
✓  1 [chromium] › tests/e2e/calendar-rtl.spec.ts:6:3 › Phase 39: Calendar RTL — Arabic dow + Indic digits › renders Arabic short labels and Arabic-Indic day digits in ar (4.0s)

  1 passed (9.1s)
```

> **Environment note (transparency — data-seed deviation).** On first run this spec FAILED
> (`expect(locator('.cal-dow')).toHaveCount(7)` → received `0`). Root cause is **not** an RTL
> regression: `/calendar` (the custom `UnifiedCalendar`) renders `CalendarEmptyWizard` — "التقويم
> فارغ" — instead of the month grid whenever the **current month** has zero events
> (`isCalendarEmpty = events.length === 0`, `showWizard` defaults `true` with no persistence).
> `calendar_entries` held 6 rows, all Apr 30 – Jun 8 2026, none in the run month (Jul 2026). The
> spec is **date-sensitive** (it always reads `new Date()`'s month). To make the as-is gate
> meaningful, three labeled current-month seed rows were inserted into `calendar_entries`
> (`title_en LIKE 'SRTL-02 regression seed %'`, `organizer_id = the test user` so RLS
> `calendar_entries_select_policy` makes them visible). After seeding, the spec passes and the
> real AR month grid renders. This is anticipated by the plan's threat model T-76-08
> ("local dev with test/seed data only"). The seed rows are left in place so the gate stays
> green for the current month; the underlying date-sensitivity is a pre-existing property of the
> Phase-39 spec, out of scope for this verification plan.

---

## 2. Source-patch confirmation (hand-patches present post-migrate)

The migrate-rtl output was rejected in Plan 76-04, so these three hand-patches are at their
pre-phase state. Greps re-run 2026-07-02 from `frontend/` (verbatim):

**Pagination** — `grep -nc 'rtl:rotate-180' src/components/ui/pagination.tsx` → **2**

```
58:    <ChevronLeftIcon className="h-4 w-4 rtl:rotate-180" />
71:    <ChevronRightIcon className="h-4 w-4 rtl:rotate-180" />
```

**Sidebar** — `grep -nc 'rtl:-scale-x-100' src/components/ui/sidebar.tsx` → **1**

```
329:          <PanelLeft className="size-3.5 transition-transform duration-200 group-data-[state=collapsed]:rotate-180 rtl:-scale-x-100" />
```

**Calendar** — `grep -nc 'rotate-180' src/components/ui/calendar.tsx` → **2**

```
27:        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
28:        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
```

---

## 3. Live-component mapping (important context for the reviewer)

The three hand-patches live in the shadcn `src/components/ui/*` files. The live app does not
render all three of those files directly — the honest mapping is:

| Hand-patched file                                        | Where it is actually live                                                                                                                                                                                              | What the screenshot below shows                                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ui/calendar.tsx` (react-day-picker)                     | Used as the **date-picker popover** inside ~15 forms/dialogs (task/commitment/filter/date-range). NOT the `/calendar` page.                                                                                            | `/calendar` renders the **custom** `UnifiedCalendar` / `CalendarMonthGrid` (`.cal-dow`/`.cal-d`). The e2e gate + the calendar screenshot verify that month-view's AR correctness (Arabic dow order, Arabic-Indic digits, mirrored month-nav chevrons). The `ui/calendar.tsx` rdp chevron patch is confirmed at source level (§2). |
| `ui/pagination.tsx`                                      | **Sole live consumer: `/users`** (`UsersListPage`, admin-gated). The dossiers list uses a different pagination pattern, so pagination evidence is captured on `/users`, not the dossiers list.                         | Mirrored prev/next chevrons + page numbers in AR.                                                                                                                                                                                                                                                                                 |
| `ui/sidebar.tsx` (shadcn `SidebarTrigger` / `PanelLeft`) | **Not mounted** in the live shell — `nav-main`, `SidebarSearch`, `nav-user`, `QuickNavigationMenu`, `sidebar-collapsible` have no live consumers. The live shell (`AppShell`) mounts the bespoke `layout/Sidebar.tsx`. | The live sidebar's AR edge + collapse behavior (viewport-driven: desktop rail ↔ mobile drawer via the Topbar hamburger). The `rtl:-scale-x-100` PanelLeft toggle-icon mirror is verified at **source level only** (§2) because that component is not on screen anywhere.                                                          |

---

## 4. Per-component checklists

### 4a. Calendar

| check                                       | expected behavior (interfaces table)                            | evidence                                                           | automated result                                                       | human sign-off        |
| ------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------- | --------------------- |
| calendar-rtl e2e regression gate            | Arabic short dow labels + Arabic-Indic day digits in AR         | §1 (no PNG)                                                        | PASS — `1 passed (9.1s)`                                               | approved (2026-07-02) |
| Month grid renders in AR (`dir=rtl`)        | 7 dow headers read right→left; day cells in Arabic-Indic digits | [evidence/srtl02-calendar-ar.png](evidence/srtl02-calendar-ar.png) | PASS — `.cal-dow` count 7, RTL confirmed                               | approved (2026-07-02) |
| Month-nav chevrons point/advance correctly  | next = later month, prev = earlier; chevrons mirrored           | [evidence/srtl02-calendar-ar.png](evidence/srtl02-calendar-ar.png) | Chevrons visible beside "July 2026"; next/prev _direction_ needs human | approved (2026-07-02) |
| `ui/calendar.tsx` rdp chevron patch present | `rtl:**:[.rdp-button_next/_previous>svg]:rotate-180` ×2         | §2 grep                                                            | PASS — count 2                                                         | approved (2026-07-02) |

### 4b. Pagination

| check                                    | expected behavior (interfaces table)                 | evidence                                                               | automated result                                | human sign-off        |
| ---------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------- | --------------------- |
| `ui/pagination.tsx` patch present        | `rtl:rotate-180` on ChevronLeft/Right (lines 58, 71) | §2 grep                                                                | PASS — count 2                                  | approved (2026-07-02) |
| Prev/next affordances mirror in AR       | chevrons flip; controls laid out right→left          | [evidence/srtl02-pagination-ar.png](evidence/srtl02-pagination-ar.png) | PASS — mirrored chevrons captured on `/users`   | approved (2026-07-02) |
| `aria-current` (current page) unaffected | active page highlight correct, not flipped           | [evidence/srtl02-pagination-ar.png](evidence/srtl02-pagination-ar.png) | Page "1" highlighted; final confirm needs human | approved (2026-07-02) |

### 4c. Sidebar

| check                                                      | expected behavior (interfaces table)                         | evidence                                                                             | automated result                                                                      | human sign-off        |
| ---------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | --------------------- |
| `ui/sidebar.tsx` patch present                             | `rtl:-scale-x-100` on PanelLeft toggle (line 329)            | §2 grep                                                                              | PASS — count 1                                                                        | approved (2026-07-02) |
| Rail sits on the correct (inline-start = right in AR) edge | sidebar hugs the right edge in AR                            | [evidence/srtl02-sidebar-expanded-ar.png](evidence/srtl02-sidebar-expanded-ar.png)   | PASS — rail on the right, expanded                                                    | approved (2026-07-02) |
| Rail collapses to that same edge                           | narrow viewport collapses the rail; hamburger toggle appears | [evidence/srtl02-sidebar-collapsed-ar.png](evidence/srtl02-sidebar-collapsed-ar.png) | PASS — rail collapsed, hamburger visible                                              | approved (2026-07-02) |
| Toggle icon mirrored (`rtl:-scale-x-100`)                  | shadcn PanelLeft toggle icon mirrored in AR                  | §2 grep (source only)                                                                | Source-verified only — shadcn `ui/sidebar.tsx` not mounted in the live shell (see §3) | approved (2026-07-02) |

---

## 5. Human visual sign-off (Task 2 — NOT done here)

The reviewer should confirm, in Arabic (evidence PNGs above, or live at http://localhost:5173
after `pnpm dev` + topbar `ع`):

1. **Calendar** — month-nav chevrons mirrored; "next" advances to the LATER month, "previous" to the earlier one (not swapped).
2. **Pagination** (`/users`) — prev/next chevrons mirrored; clicking next moves forward; current-page highlight unaffected.
3. **Sidebar** — rail sits on the inline-start (right in AR) edge; collapsing tucks it to that same edge; (toggle-icon mirror is source-verified only — the shadcn toggle is not mounted live).

On approval, every `pending` cell above was updated to `approved (2026-07-02)`.

**Status: all sign-off cells = `approved (2026-07-02)`.** Signed off by the user (visual review of the four AR evidence PNGs).
