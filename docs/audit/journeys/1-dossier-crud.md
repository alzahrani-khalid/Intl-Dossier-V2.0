# Journey 1 — Dossier Creation & Management

**Date:** 2026-04-10
**Status:** Code audit complete, browser verification pending
**Agents:** Theme, Component, RTL/i18n, Data Flow

## Summary

- **Critical:** 1
- **Warning:** 10
- **Info:** 3
- **Pass:** 7 checklist items confirmed correct

---

## Findings

### Theme Auditor

#### [WARNING] T-10: Hardcoded type colors in DossierTypeIcon

- **File:** frontend/src/components/Dossier/DossierTypeIcon.tsx:33-39
- **Agent:** theme-auditor
- **Journey:** 1-dossier-crud
- **Issue:** Dossier type icon colors hardcoded as Tailwind utilities (text-blue-500, text-purple-500, etc.). No dark mode/theme awareness.
- **Expected:** Use theme tokens or CSS variables for dossier type color mapping
- **Fix:** Create dossier type color mapping using --heroui-\* variables
- **Affects:** [1-dossier-crud, all dossier views]

#### [WARNING] T-11: Hardcoded status colors in ActivityTimelineItem

- **File:** frontend/src/components/Dossier/ActivityTimelineItem.tsx:43-54
- **Agent:** theme-auditor
- **Journey:** 1-dossier-crud
- **Issue:** 12+ status badge colors hardcoded with manual dark mode overrides instead of theme system
- **Expected:** Status colors from theme token system
- **Fix:** Extract status colors to theme-aware constants using --heroui-\* variables
- **Affects:** [1-dossier-crud, status badges across all dossier views]

#### [WARNING] T-12: Hardcoded activity type colors in ActivityTimelineSection

- **File:** frontend/src/components/Dossier/DossierOverview/sections/ActivityTimelineSection.tsx:77-100
- **Agent:** theme-auditor
- **Journey:** 1-dossier-crud
- **Issue:** 8+ activity type colors and event action colors hardcoded as Tailwind classes
- **Expected:** Use semantic color tokens (--heroui-success, --heroui-warning, etc.)
- **Fix:** Create theme-aware activity color mapping
- **Affects:** [1-dossier-crud, activity timeline across all dossier types]

#### [WARNING] T-13: Hardcoded alert colors in DossierOverview

- **File:** frontend/src/components/Dossier/DossierOverview/DossierOverview.tsx:72-79
- **Agent:** theme-auditor
- **Journey:** 1-dossier-crud
- **Issue:** Warning/success backgrounds hardcoded (bg-amber-50, bg-green-50) with manual /30 opacity dark mode
- **Expected:** Use --heroui-warning and --heroui-success CSS variables
- **Fix:** Replace amber/green classes with theme-driven colors
- **Affects:** [1-dossier-crud, dossier overview alerts]

#### [WARNING] T-14: Hardcoded interaction type colors

- **File:** frontend/src/components/Dossier/sections/InteractionHistory.tsx:42-47
- **Agent:** theme-auditor
- **Journey:** 1-dossier-crud
- **Issue:** Interaction type colors (meeting, conference, visit, negotiation) hardcoded without theme awareness
- **Expected:** Theme color tokens for interaction types
- **Fix:** Create interaction color mapping using CSS variables
- **Affects:** [1-dossier-crud, interaction history]

---

### Component Auditor

#### [WARNING] C-10: TooltipProvider re-created every render in DossierContextBadge

- **File:** frontend/src/components/Dossier/DossierContextBadge.tsx:157-172
- **Agent:** component-auditor
- **Journey:** 1-dossier-crud
- **Issue:** TooltipProvider instantiated inside render — causes tooltip state loss and performance issues on re-render
- **Expected:** TooltipProvider should be a parent wrapper, not per-instance
- **Fix:** Lift TooltipProvider to parent or use singleton pattern
- **Affects:** [1-dossier-crud, all dossier context badges]

#### [WARNING] C-11: Missing key prop on similar dossiers list

- **File:** frontend/src/components/Dossier/DossierCreateWizard.tsx:798
- **Agent:** component-auditor
- **Journey:** 1-dossier-crud
- **Issue:** Similar dossiers list renders without stable key prop — potential state misalignment on updates
- **Expected:** Use dossier ID as key
- **Fix:** Add `key={dossier.id}` to mapped items
- **Affects:** [1-dossier-crud]

#### [INFO] C-12: DossierCreateWizard is very large (~1000+ LOC)

- **File:** frontend/src/components/Dossier/DossierCreateWizard.tsx
- **Agent:** component-auditor
- **Journey:** 1-dossier-crud
- **Issue:** 92 FormField instances in single component. Maintainability concern.
- **Expected:** Consider extracting per-type form sections into sub-components
- **Fix:** Split into DossierCountryForm, DossierOrganizationForm, etc.
- **Affects:** [code maintainability]

---

### RTL/i18n Auditor

#### [CRITICAL] R-10: Missing entire `tabs` namespace in Arabic

- **File:** frontend/public/locales/ar/translation.json
- **Agent:** rtl-i18n-auditor
- **Journey:** 1-dossier-crud
- **Issue:** `tabs` namespace completely missing from Arabic. Keys like tabs.activity, tabs.timeline, tabs.positions, tabs.mous, tabs.contacts, tabs.comments, tabs.languages show raw keys to Arabic users.
- **Expected:** Full tabs namespace translated in AR
- **Fix:** Add complete tabs object to AR translation file
- **Affects:** [1-dossier-crud, all dossier detail pages]

#### [WARNING] R-10: Hardcoded Arabic text in DossierCreateWizard

- **File:** frontend/src/components/Dossier/DossierCreateWizard.tsx:483-545
- **Agent:** rtl-i18n-auditor
- **Journey:** 1-dossier-crud
- **Issue:** Wizard step titles/descriptions hardcoded in Arabic (titleAr: 'اختيار النوع', etc.) instead of using translation files
- **Expected:** Use t() function with translation keys
- **Fix:** Extract hardcoded Arabic to translation files
- **Affects:** [1-dossier-crud, wizard UX]

#### [WARNING] R-11: Hardcoded English form placeholders

- **File:** frontend/src/components/Dossier/DossierCreateWizard.tsx:1087-1159
- **Agent:** rtl-i18n-auditor
- **Journey:** 1-dossier-crud
- **Issue:** Placeholders hardcoded: "SA", "SAU", "Middle East", "Riyadh", "الرياض". Should use t() function.
- **Expected:** Use placeholder={t('fields.countryCode.placeholder')} pattern
- **Fix:** Create translation keys for all form placeholders
- **Affects:** [1-dossier-crud, form accessibility]

#### [WARNING] R-12: Hardcoded dir="rtl" attributes

- **File:** frontend/src/components/Dossier/DossierCreateWizard.tsx:698, 856, 998, 1060, 1159
- **Agent:** rtl-i18n-auditor
- **Journey:** 1-dossier-crud
- **Issue:** Multiple elements have hardcoded dir="rtl" instead of dynamic direction binding
- **Expected:** Use dir={direction} from useDirection() hook
- **Fix:** Replace hardcoded dir="rtl" with dynamic direction binding
- **Affects:** [1-dossier-crud, language toggle responsiveness]

#### [INFO] R-13: Missing 265+ dossier-specific AR translation keys

- **File:** frontend/public/locales/ar/translation.json
- **Agent:** rtl-i18n-auditor
- **Journey:** 1-dossier-crud
- **Issue:** Missing: dossierTypes._, dossierLinks._, waitingQueue.\* dossier-related keys
- **Expected:** All dossier user-visible strings translated
- **Fix:** Add missing 265+ translation keys
- **Affects:** [1-dossier-crud, dossier type selection, link management]

---

### Data Flow Auditor

**All critical data flow checks PASSED for Journey 1:**

- [PASS] Create mutation invalidates list query (dossierKeys.lists()) on success
- [PASS] Submit button disabled during mutation (isPending guard)
- [PASS] Success redirects to dossier detail via getDossierDetailPath()
- [PASS] Error handling uses translated messages (t('dossier.create.error'))
- [PASS] Query config: staleTime 30s, gcTime 5min, keys include filters
- [PASS] Validation via Zod schema before API call
- [PASS] No floating promises — uses await mutateAsync()

No new data flow findings beyond Journey 0.

---

## Cross-Reference with Journey 0

These Journey 0 findings also affect Journey 1:

- C-01/C-02: Button forwardRef broken (affects all forms)
- D-01/D-02: Auth race condition (affects all protected routes)
- R-01: 293 missing AR translations (includes dossier namespace)
- R-02: Physical position classes in UI components (used in dossier views)
