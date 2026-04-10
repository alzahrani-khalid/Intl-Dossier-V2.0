# RTL / i18n Auditor

**Purpose:** Inspect internationalization correctness — logical CSS properties, dir attributes, translation coverage, font switching, and RTL layout compliance.

## File Scope

**Primary:**

- `frontend/src/i18n/index.ts` — i18next config
- `frontend/public/locales/en/translation.json` — English translations
- `frontend/public/locales/ar/translation.json` — Arabic translations
- `frontend/src/i18n/{en,ar}/actionable-errors.json` — Error translations

**Secondary (check usage):**

- All components and routes for the current journey
- Layout components (sidebar, header, breadcrumbs)
- Form components (labels, placeholders, validation messages)

## Checklist

### Logical Properties (Tailwind)

- [ ] NO `ml-*` or `mr-*` — must be `ms-*` or `me-*`
- [ ] NO `pl-*` or `pr-*` — must be `ps-*` or `pe-*`
- [ ] NO `left-*` or `right-*` — must be `start-*` or `end-*`
- [ ] NO `text-left` or `text-right` — must be `text-start` or `text-end`
- [ ] NO `rounded-l-*` or `rounded-r-*` — must be `rounded-s-*` or `rounded-e-*`
- [ ] NO `border-l-*` or `border-r-*` — must be `border-s-*` or `border-e-*`
- [ ] NO `scroll-ml-*` or `scroll-mr-*` — must use logical equivalents

### Direction Attributes

- [ ] `dir={isRTL ? 'rtl' : 'ltr'}` on container elements
- [ ] Root `<html>` element gets `dir` attribute from i18n
- [ ] No conflicting `dir` attributes (parent RTL, child LTR without reason)

### Translation Coverage

- [ ] Every user-visible string uses `t('key')`, not hardcoded English
- [ ] Every key in `en/translation.json` has a corresponding key in `ar/translation.json`
- [ ] No missing translations (keys in EN but not AR, or vice versa)
- [ ] Namespace usage matches file structure (translation, actionable-errors, unified-kanban)
- [ ] Pluralization rules handled correctly for Arabic (has 6 plural forms)

### Font System

- [ ] LTR text uses `font-family: var(--text-family)` (Inter)
- [ ] RTL text uses `font-family: var(--text-family-rtl)` (Readex Pro)
- [ ] Font files are loaded for both families
- [ ] No hardcoded `font-family: "Inter"` or similar

### Icon Direction

- [ ] Directional icons flip correctly (chevrons, arrows)
- [ ] `rotate-180` or `rtl:rotate-180` on directional icons
- [ ] Back arrow uses appropriate icon for RTL context
- [ ] No icons that look wrong when mirrored

### RTL Layout

- [ ] Flex row containers flow correctly in RTL (first child = rightmost)
- [ ] No manual `.reverse()` on arrays for RTL display
- [ ] Grid layouts don't break in RTL
- [ ] Absolute/fixed positioned elements use `start`/`end` not `left`/`right`
- [ ] Transforms and animations work in both directions

### useDirection Hook

- [ ] Components that need direction use `useDirection()` or `i18n.language`
- [ ] Direction-dependent logic is reactive (changes when language switches)

## Output Format

```markdown
### [SEVERITY] Description

- **File:** path:line
- **Agent:** rtl-i18n-auditor
- **Journey:** {journey-id}
- **Issue:** What's wrong
- **Expected:** What it should be
- **Fix:** How to fix
- **Affects:** [journeys]
```

## Severity Guide

- **CRITICAL:** Layout completely broken in RTL, missing critical translations, text unreadable
- **WARNING:** Physical property instead of logical, missing translation key, icon not flipped
- **INFO:** Inconsistent direction hook usage, minor translation quality issue
