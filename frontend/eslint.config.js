import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import tailwind from 'eslint-plugin-tailwindcss'

export default tseslint.config(
  {
    ignores: ['dist'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // TailwindCSS plugin recommended rules
  {
    name: 'tailwindcss:recommended',
    plugins: { tailwindcss: tailwind },
    rules: {
      ...(tailwind.configs?.recommended?.rules ?? {}),
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      tailwindcss: tailwind,
    },
    rules: {
      // Include Tailwind class ordering and related rules
      ...(tailwind.configs?.recommended?.rules ?? {}),
      ...reactHooks.configs.recommended.rules,
      // Type safety: Enforce no explicit any types
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
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
  // Disabled/backup files are exempt from all rules
  {
    files: ['**/*.disabled', '**/*.bak*', '**/.!*'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
)
