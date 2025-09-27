// Shim config for tools expecting .eslintrc.js
// Note: Project uses ESLint flat config via `eslint.config.js`.
// This file exists to satisfy legacy tooling and task specs.
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { node: true, es2022: true },
  ignorePatterns: ['dist/**'],
};

