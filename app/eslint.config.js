import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{js,jsx,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.browser, parserOptions: { ecmaFeatures: { jsx: true } } },
  },
  { files: ['src/**/*.{js,jsx}'], extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite] },
  { files: ['*.config.js', 'scripts/**/*.mjs', 'tests/**/*.js'], languageOptions: { globals: globals.node } },
  { files: ['src/shared/**/*.{js,jsx}'], rules: { 'no-restricted-imports': ['error', { patterns: [{ group: ['**/features/**', '**/app/**'], message: 'A camada compartilhada não pode depender de funcionalidades ou da composição da aplicação.' }] }] } },
]);
