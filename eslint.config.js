// Flat-config ESLint for the whole monorepo. One config covers server (Node)
// and client (browser/React-friendly) code with shared rules.

import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'no-var': 'error',
      'prefer-const': 'warn',
    },
  },
  // The client uses Vite/JSX — relax for now and let the client's own tooling
  // catch JSX-specifics. ESLint here is a safety net, not a JSX linter.
  {
    files: ['client/**/*.{js,jsx}'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },
  // Tests get to use console freely
  {
    files: ['tests/**/*.{js,mjs}'],
    rules: { 'no-console': 'off' },
  },
  prettier,
  {
    ignores: [
      '**/node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.venv/**',
      'client/dist/**',
      'client/node_modules/**',
      'server/node_modules/**',
    ],
  },
];
