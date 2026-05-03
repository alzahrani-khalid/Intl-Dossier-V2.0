# Directional Icons in v6.0

This doc enumerates every directional glyph in the v6.0 surface area, the
mechanism it uses to flip in RTL, and provides LTR/RTL screenshot pairs as
visual evidence. Generated and maintained per Phase 43 (`QA-04`).

---

## 1. Flip mechanisms

The v6.0 surface uses **three** sanctioned mechanisms for RTL icon flipping.
Any directional glyph SHOULD use one of these. `rotate-180` is **not
sanctioned** — visually it does flip horizontally but it conflates rotation
semantics with mirroring.

### A. `.icon-flip` class (CSS-only, the default)

Source: `frontend/src/styles/list-pages.css:861-863`

```css
html[dir='rtl'] .icon-flip {
  transform: scaleX(-1);
}
```

Used by: row chevrons in DossierTable, GenericListPage, DossierShell
breadcrumbs, DrawerCtaRow, AfterActionsTable. Applied as a class on the icon
element.

### B. Inline `style={{ transform: 'scaleX(-1)' }}` (Phase 40 G3 belt-and-braces)

Source: `frontend/src/components/list-page/GenericListPage.tsx:121-124`

```tsx
<ChevronRight className="icon-flip" style={{ transform: isRTL ? 'scaleX(-1)' : undefined }} />
```

Used when `.icon-flip` alone has been observed to lose specificity under
Tailwind v4 cascade. Belt-and-braces with the class — both are present.

### C. Locale-driven SVG transform (signature visuals)

Source: `frontend/src/components/signature-visuals/Sparkline.tsx:92`

```tsx
<svg style={{ transform: isRTL ? 'scaleX(-1)' : undefined }}>
  <polyline ... />
</svg>
```

Used by `<Sparkline/>` (the polyline mirrors so the trailing dot lands at the
visually-leading edge in RTL). Driven by `useLocale()` hook.

### Deprecation: `rotate-180` is NOT sanctioned

(`rotate-180` is **not sanctioned** for RTL flipping.)

`className={isRTL ? 'rotate-180' : ''}` produces the same visual result as
`scaleX(-1)` for symmetric chevrons but conflates rotation with mirroring
(asymmetric icons would render incorrectly). All v6.0 sites previously using
`rotate-180` were migrated to `.icon-flip` in Phase 43 Wave 2 (Plan 43-07).
New code MUST NOT introduce `rotate-180` for RTL flipping.

---

## 2. Audit table — every directional glyph in v6.0

| Icon                         | Source file                                                              | Flip mechanism                                                | RTL behavior                                                                                        | Owning primitive                                           | LTR                                               | RTL                                               |
| ---------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- |
| chevron-right                | `frontend/src/components/list-page/DossierTable.tsx:147-150`             | A + B (`.icon-flip` + inline)                                 | Mirrors horizontally on `dir="rtl"`                                                                 | DossierTable mobile row chevron                            | ![](rtl-icons/chevron-right-table-ltr.png)        | ![](rtl-icons/chevron-right-table-rtl.png)        |
| chevron-right                | `frontend/src/components/list-page/GenericListPage.tsx:121-124`          | A + B (Phase 40 G3)                                           | Mirrors horizontally on `dir="rtl"`                                                                 | GenericListPage row chevron (Forums/Topics/Working Groups) | ![](rtl-icons/chevron-right-list-ltr.png)         | ![](rtl-icons/chevron-right-list-rtl.png)         |
| chevron-right ×2             | `frontend/src/components/dossier/DossierShell.tsx:149,156`               | A (`.icon-flip`)                                              | Mirrors horizontally on `dir="rtl"`                                                                 | DossierShell breadcrumb chevrons                           | ![](rtl-icons/chevron-breadcrumb-dossier-ltr.png) | ![](rtl-icons/chevron-breadcrumb-dossier-rtl.png) |
| chevron-right                | `frontend/src/components/dossier/DossierDrawer/DrawerCtaRow.tsx:96`      | A (`.icon-flip`)                                              | Mirrors horizontally on `dir="rtl"`                                                                 | Drawer CTA row trailing chevron                            | ![](rtl-icons/chevron-drawer-cta-ltr.png)         | ![](rtl-icons/chevron-drawer-cta-rtl.png)         |
| chevron-right                | `frontend/src/components/after-actions/AfterActionsTable.tsx:142`        | A (`.icon-flip`, via Phase 37 `<Icon name="chevron-right"/>`) | Mirrors horizontally on `dir="rtl"`                                                                 | AfterActionsTable row                                      | ![](rtl-icons/chevron-after-actions-ltr.png)      | ![](rtl-icons/chevron-after-actions-rtl.png)      |
| arrow-right                  | `frontend/src/pages/Dashboard/widgets/VipVisits.tsx:123`                 | A (`.icon-flip`) — migrated from `rotate-180` in Phase 43 W2  | Mirrors horizontally on `dir="rtl"`                                                                 | VipVisits trailing arrow                                   | ![](rtl-icons/arrow-right-vip-ltr.png)            | ![](rtl-icons/arrow-right-vip-rtl.png)            |
| arrow-up-right               | `frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx:172`        | A (`.icon-flip`) — added in Phase 43 W2 (was never flipping)  | Mirrors horizontally on `dir="rtl"`                                                                 | OverdueCommitments row trailing arrow                      | ![](rtl-icons/arrow-up-right-overdue-ltr.png)     | ![](rtl-icons/arrow-up-right-overdue-rtl.png)     |
| chevron (disclosure)         | `frontend/src/pages/Dashboard/components/EngagementStageGroup.tsx:68-70` | A (`.icon-flip`) — migrated from `rotate-180` in Phase 43 W2  | Mirrors horizontally on `dir="rtl"` (rotation reflects open/closed disclosure state, not direction) | EngagementStageGroup disclosure chevron                    | ![](rtl-icons/chevron-engagement-stage-ltr.png)   | ![](rtl-icons/chevron-engagement-stage-rtl.png)   |
| chevron-right                | `frontend/src/pages/persons/PersonsListPage.tsx:387-388`                 | A (`.icon-flip`) — migrated from `rotate-180` in Phase 43 W2  | Mirrors horizontally on `dir="rtl"`                                                                 | PersonsListPage card trailing chevron                      | ![](rtl-icons/chevron-right-persons-ltr.png)      | ![](rtl-icons/chevron-right-persons-rtl.png)      |
| chevron-left + chevron-right | `frontend/src/components/calendar/UnifiedCalendar.tsx:202,213`           | A (`.icon-flip`) — migrated from `rotate-180` in Phase 43 W2  | Mirrors horizontally on `dir="rtl"` (prev/next month nav)                                           | UnifiedCalendar month navigation                           | ![](rtl-icons/chevron-calendar-nav-ltr.png)       | ![](rtl-icons/chevron-calendar-nav-rtl.png)       |
| sparkline polyline           | `frontend/src/components/signature-visuals/Sparkline.tsx:92`             | C (locale-driven SVG `transform: scaleX(-1)`)                 | Mirrors so trailing dot lands at visually-leading edge in RTL                                       | Sparkline polyline (consumed by SlaHealth widget)          | ![](rtl-icons/sparkline-polyline-ltr.png)         | ![](rtl-icons/sparkline-polyline-rtl.png)         |

PNG screenshots regenerable via `pnpm -C frontend docs:rtl-icons` (Plan 43-05
spec). Run after any token change that affects icon contrast or sizing.

---

## 3. Out of scope (pre-v6.0 surface)

The following directories use `rotate-180` for RTL handling. They are
**outside the v6.0 surface area** scoped by Phase 43 and remain unchanged.
Tracked as v6.1 follow-ups.

- `frontend/src/components/forms/`
- `frontend/src/components/waiting-queue/`
- `frontend/src/components/calendar/ConflictResolution/`
- `frontend/src/components/dossier/UniversalDossierCard.tsx`
- `frontend/src/components/dossier/DossierDetailLayout.tsx`
- `frontend/src/components/guided-tours/`
- `frontend/src/components/field-history/`
- `frontend/src/components/responsive/responsive-nav.tsx`

When any of these surfaces is brought into a future v6.x design phase, audit
its directional glyphs against the mechanisms in §1 and migrate to `.icon-flip`
(or `<Icon name="…"/>` if that primitive is in use).

---

## 4. Adding a new directional icon to v6.0

1. Add the icon to its component using one of the §1 mechanisms (prefer A unless the icon is inside an SVG primitive — then C).
2. Add a row to §2 with the file:line citation, mechanism, and a placeholder for the screenshot pair.
3. Add an entry to `frontend/tests/e2e/qa-sweep-icon-screenshots.spec.ts` `iconFixtures` array with a stable selector.
4. Run `pnpm -C frontend docs:rtl-icons` to regenerate the PNG pair.
5. Commit the doc + the two PNGs in the same change.

---

_Doc owner: Phase 43 (`docs/rtl-icons.md`). See `.planning/phases/43-rtl-a11y-responsive-sweep/` for context._
