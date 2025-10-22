module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'tailwindcss'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:tailwindcss/recommended',
  ],
  env: {
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    // RTL-safe patterns - disallow physical direction properties
    'tailwindcss/no-custom-classname': [
      'warn',
      {
        whitelist: ['^(ms|me|ps|pe|start|end|text-start|text-end|rounded-s|rounded-e)-.*$'],
      },
    ],
  },
  overrides: [
    {
      files: ['*.tsx', '*.jsx'],
      rules: {
        // Additional rules for React components
        '@typescript-eslint/explicit-function-return-type': 'off', // Allow implicit return types in components
      },
    },
  ],
};
