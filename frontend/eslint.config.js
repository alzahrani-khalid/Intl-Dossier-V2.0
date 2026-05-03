import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

import unusedImports from 'eslint-plugin-unused-imports'
import rtlFriendly from 'eslint-plugin-rtl-friendly'

export default tseslint.config(
  {
    ignores: ['dist'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
{
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Type safety: Enforce no explicit any types
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-unused-expressions': 'off',
      'react-refresh/only-export-components': 'warn',
      // UI Library Consolidation: Warn when using shadcn components that have Aceternity alternatives
      // See: frontend/src/components/ui/COMPONENT_REGISTRY.md for full list
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/components/ui/card'],
              message:
                '💡 UI Library: Consider using 3d-card or bento-grid from Aceternity for enhanced visuals. See COMPONENT_REGISTRY.md',
            },
            {
              group: ['@/components/ui/hover-card'],
              message:
                '💡 UI Library: Use link-preview from Aceternity for better link previews. See COMPONENT_REGISTRY.md',
            },
            {
              group: ['@/components/ui/navigation-menu'],
              message:
                '💡 UI Library: Use floating-navbar from Aceternity for scroll-reactive navigation. See COMPONENT_REGISTRY.md',
            },
          ],
        },
      ],
      // RTL Support: Prevent non-RTL-safe Tailwind classes
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/\\bml-/]',
          message: '⚠️ RTL: Use "ms-*" (margin-start) instead of "ml-*"',
        },
        {
          selector: 'Literal[value=/\\bmr-/]',
          message: '⚠️ RTL: Use "me-*" (margin-end) instead of "mr-*"',
        },
        {
          selector: 'Literal[value=/\\bpl-/]',
          message: '⚠️ RTL: Use "ps-*" (padding-start) instead of "pl-*"',
        },
        {
          selector: 'Literal[value=/\\bpr-/]',
          message: '⚠️ RTL: Use "pe-*" (padding-end) instead of "pr-*"',
        },
        {
          selector: 'Literal[value=/\\btext-left\\b/]',
          message: '⚠️ RTL: Use "text-start" instead of "text-left"',
        },
        {
          selector: 'Literal[value=/\\btext-right\\b/]',
          message: '⚠️ RTL: Use "text-end" instead of "text-right"',
        },
        {
          selector: 'Literal[value=/\\bleft-/]',
          message: '⚠️ RTL: Use "start-*" instead of "left-*"',
        },
        {
          selector: 'Literal[value=/\\bright-/]',
          message: '⚠️ RTL: Use "end-*" instead of "right-*"',
        },
        {
          selector: 'Literal[value=/\\brounded-l-/]',
          message: '⚠️ RTL: Use "rounded-s-*" instead of "rounded-l-*"',
        },
        {
          selector: 'Literal[value=/\\brounded-r-/]',
          message: '⚠️ RTL: Use "rounded-e-*" instead of "rounded-r-*"',
        },
        {
          selector: 'Literal[value=/\\bborder-l-/]',
          message: '⚠️ RTL: Use "border-s-*" instead of "border-l-*"',
        },
        {
          selector: 'Literal[value=/\\bborder-r-/]',
          message: '⚠️ RTL: Use "border-e-*" instead of "border-r-*"',
        },
      ],
    },
  },
  // UI Library Exceptions (shadcn/ui, Aceternity, etc.)
  // These components are auto-generated and exempt from RTL rules and any type rules
  {
    files: ['**/components/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // RTL-friendly plugin: catches physical CSS properties in JS/TS string literals
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'rtl-friendly': rtlFriendly },
    rules: {
      'rtl-friendly/no-physical-properties': 'error',
    },
  },
  // RTL-friendly exceptions for auto-generated UI components
  {
    files: ['**/components/ui/**/*.{ts,tsx}'],
    rules: {
      'rtl-friendly/no-physical-properties': 'off',
    },
  },
  // Phase 40 + Phase 43 — reinforce logical-properties enforcement on the full v6.0 surface.
  // Global rules above already block physical RTL classes; this block re-asserts the
  // contract on every v6.0-touched route, page, component, and hook so drift is caught
  // at the source. Per QA-01.
  {
    files: [
      // Phase 40 list-pages
      'src/components/list-page/**/*.{ts,tsx}',
      'src/routes/_protected/dossiers/{countries,organizations,forums,topics,working_groups}/index.tsx',
      'src/routes/_protected/{persons,engagements}/index.tsx',
      'src/routes/_protected/dossiers/engagements/index.tsx',
      'src/pages/{Persons,Engagements}/**/*.{ts,tsx}',
      'src/pages/{persons,engagements}/**/*.{ts,tsx}',
      'src/hooks/{useCountries,useOrganizations,useEngagementsInfinite}.ts',
      // Phase 38 dashboard
      'src/routes/_protected/dashboard.tsx',
      'src/pages/Dashboard/**/*.{ts,tsx}',
      // Phase 39 kanban + calendar
      'src/routes/_protected/{kanban,calendar}.tsx',
      'src/components/unified-kanban/**/*.{ts,tsx}',
      'src/components/calendar/UnifiedCalendar.tsx',
      'src/components/calendar/{CalendarMonthGrid,CalendarEventPill,WeekListMobile}.tsx',
      // Phase 41 dossier-drawer
      'src/components/dossier/DossierDrawer/**/*.{ts,tsx}',
      'src/components/dossier/DossierShell.tsx',
      // Phase 42 remaining pages
      'src/routes/_protected/{briefs,activity,settings}.tsx',
      'src/routes/_protected/{after-actions,tasks}/index.tsx',
      'src/pages/{Briefs,activity,settings}/**/*.{ts,tsx}',
      'src/pages/MyTasks.tsx',
      'src/components/{briefs,activity,after-actions}/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "Literal[value=/\\b(ml-|mr-|pl-|pr-|text-left|text-right|rounded-l-|rounded-r-|left-|right-)\\b/]",
          message:
            'v6.0 surface (Phase 38–42): physical RTL classes are forbidden. Use logical properties (ms-/me-/ps-/pe-/text-start/text-end/rounded-s-/rounded-e-/start-/end-).',
        },
      ],
    },
  },
  // Disabled/backup files are exempt from all rules
  {
    files: ['**/*.disabled', '**/*.bak*', '**/.!*'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
)
