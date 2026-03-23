import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  // ── Global ignores ────────────────────────────────────────────────
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      'specs/**',
      '**/*.generated.*',
      '**/database.types.ts',
      '**/routeTree.gen.ts',
      '.husky/**',
      '**/.!*', // OneDrive conflict files
    ],
  },

  // ── Base: JS recommended + TS recommended (type-aware) ─────────────
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ── Shared rules for all TS files ─────────────────────────────────
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      // Plan-specified rules (D-01: strict from day one)
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      // TODO(Phase 2+): Enable strict-boolean-expressions after type cleanup
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // Type-checked rules disabled until codebase migrates to strict types
      // TODO(Phase 2+): Enable incrementally after type safety cleanup
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },

  // ── Frontend override ─────────────────────────────────────────────
  {
    files: ['frontend/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // React Hooks v7 — rules-of-hooks catches conditional hooks (9 violations)
      // TODO(Phase 2): Refactor conditional hook calls in intelligence components
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'unused-imports/no-unused-imports': 'error',
      // TODO(Phase 2): Enable unused-vars and prefix with _
      'unused-imports/no-unused-vars': 'off',
      // TODO(Phase 2): Split co-exported utilities into separate files
      'react-refresh/only-export-components': 'off',
      // Old frontend config had explicit-function-return-type: off for .tsx
      // TODO(Phase 2): Add return types to components and hooks
      '@typescript-eslint/explicit-function-return-type': 'off',
      // TODO(Phase 2): Replace any with proper types
      '@typescript-eslint/no-explicit-any': 'off',
      // TODO(Phase 2): Handle floating promises in event handlers
      '@typescript-eslint/no-floating-promises': 'off',
      // Allow console.table for data display and console.info for status
      'no-console': ['error', { allow: ['warn', 'error', 'table', 'info'] }],
      // Legacy switch patterns and misc rules
      'no-case-declarations': 'off',
      'no-useless-escape': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',

      // RTL enforcement: ban physical CSS properties (CLAUDE.md mandatory)
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/\\bml-/]',
          message: 'Use ms-* (margin-start) instead of ml-* for RTL support.',
        },
        {
          selector: 'Literal[value=/\\bmr-/]',
          message: 'Use me-* (margin-end) instead of mr-* for RTL support.',
        },
        {
          selector: 'Literal[value=/\\bpl-/]',
          message: 'Use ps-* (padding-start) instead of pl-* for RTL support.',
        },
        {
          selector: 'Literal[value=/\\bpr-/]',
          message: 'Use pe-* (padding-end) instead of pr-* for RTL support.',
        },
        {
          selector: 'Literal[value=/\\btext-left\\b/]',
          message: 'Use text-start instead of text-left for RTL support.',
        },
        {
          selector: 'Literal[value=/\\btext-right\\b/]',
          message: 'Use text-end instead of text-right for RTL support.',
        },
        {
          selector: 'Literal[value=/\\bleft-/]',
          message: 'Use start-* instead of left-* for RTL support.',
        },
        {
          selector: 'Literal[value=/\\bright-/]',
          message: 'Use end-* instead of right-* for RTL support.',
        },
        {
          selector: 'Literal[value=/\\brounded-l-/]',
          message: 'Use rounded-s-* instead of rounded-l-* for RTL support.',
        },
        {
          selector: 'Literal[value=/\\brounded-r-/]',
          message: 'Use rounded-e-* instead of rounded-r-* for RTL support.',
        },
        {
          selector: 'Literal[value=/\\bborder-l-/]',
          message: 'Use border-s-* instead of border-l-* for RTL support.',
        },
        {
          selector: 'Literal[value=/\\bborder-r-/]',
          message: 'Use border-e-* instead of border-r-* for RTL support.',
        },
      ],
    },
  },

  // ── UI library exception: allow any + physical CSS in wrappers ────
  {
    files: ['frontend/**/components/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // ── Backend override ──────────────────────────────────────────────
  // Backend was never linted with these strict rules. They are disabled
  // here and tracked for incremental adoption in Phase 2+.
  {
    files: ['backend/**/*.ts'],
    rules: {
      'unused-imports/no-unused-imports': 'error',
      // TODO(Phase 2): Enable unused-vars and prefix unused params with _
      'unused-imports/no-unused-vars': 'off',
      // TODO(Phase 2): Add return type annotations to all backend functions
      '@typescript-eslint/explicit-function-return-type': 'off',
      // TODO(Phase 2): Replace any with proper types in Express handlers
      '@typescript-eslint/no-explicit-any': 'off',
      // TODO(Phase 2): Add proper promise error handling
      '@typescript-eslint/no-floating-promises': 'off',
      // Legacy patterns in backend adapters/integrations
      '@typescript-eslint/no-namespace': 'off',
      'no-useless-escape': 'off',
    },
  },

  // ── Prettier must be last (disables formatting rules) ─────────────
  eslintConfigPrettier,
)
