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
    ],
  },

  // ── Base: JS recommended + TS type-checked ────────────────────────
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

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
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
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
      ...reactHooks.configs.recommended.rules,
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'react-refresh/only-export-components': 'error',

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
  {
    files: ['backend/**/*.ts'],
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
    },
  },

  // ── Prettier must be last (disables formatting rules) ─────────────
  eslintConfigPrettier,
)
