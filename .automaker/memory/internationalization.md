---
tags: [internationalization]
summary: internationalization implementation decisions and patterns
relevantTo: [internationalization]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 0
  referenced: 0
  successfulFeatures: 0
---

# internationalization

#### [Pattern] Used RTL-aware CSS utilities (ms-_, me-_, ps-_, pe-_) for spacing instead of left/right hardcoded values (2026-01-13)

- **Problem solved:** Feature needs to work in both English (LTR) and Arabic (RTL) without separate component variants
- **Why this works:** Logical properties automatically flip based on document direction. Single codebase supports both language directions. No conditional rendering needed.
- **Trade-offs:** Requires understanding logical properties but eliminates duplication and direction-specific bugs

### Adding translations for entire conflict resolution UI (buttons, labels, help text) alongside existing calendar translations, not as separate i18n namespace (2026-01-14)

- **Context:** Supporting both English and Arabic for conflict resolution feature
- **Why:** Keeps all calendar-related translations together in `en/calendar.json` and `ar/calendar.json`, maintaining coherent translation organization. Users working in Arabic see Arabic conflict messages without code changes
- **Rejected:** Separate `conflicts.json` file (fragments translations), hardcoding English with `t('calendar.conflictComparison.reschedule')` lookups only (no Arabic support), lazy loading translations (adds async overhead)
- **Trade-offs:** Calendar translation files get larger but all related strings stay together. Translator only needs to maintain one file per language instead of hunting across multiple i18n files
- **Breaking if changed:** If translations are removed or structure changes, users don't see localized conflict resolution options. Arabic users would see English buttons

#### [Pattern] Created separate i18n namespace (form-auto-save.json) instead of mixing keys into generic form namespace (2026-01-14)

- **Problem solved:** Auto-save feature has specialized vocabulary (draft, restore, persist) distinct from standard form terms
- **Why this works:** Separate namespaces prevent key collision, make feature extraction easier, and allow loading only necessary translations. Future features can reuse form-auto-save namespace without feature duplication
- **Trade-offs:** Extra namespace file adds 2 files (en + ar) but enables cleaner modularization; must register in i18n index

#### [Pattern] Breadcrumb component always renders entity names in their stored language (not current UI language), but labels/UI text follow user's language preference (2026-01-14)

- **Problem solved:** Entities have both English and Arabic names; breadcrumb should show what was used when viewing that entity
- **Why this works:** Consistency - if user was viewing in Arabic, seeing entity in English in breadcrumb is confusing. Storing language with entity allows correct display even if user switches languages. Labels still follow UI language for consistency
- **Trade-offs:** Easier: Accurate representation of what user viewed. Harder: Must store language_code with each history item, more complex data shape
