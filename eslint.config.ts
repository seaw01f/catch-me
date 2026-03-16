import { defineConfig } from 'eslint/config'
import eslint from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import tseslint from 'typescript-eslint'

export default defineConfig(
  { plugins: { '@stylistic': stylistic } },
  // Apply global ignores
  // Exclude build artifacts and generated JS files
  { ignores: ['dist', 'build', '**/*.js'] },
  // Configure files to lint
  {
    files: ['**/*.ts', '**/*.cts', '**/*.mts'], // Target only TypeScript files
    extends: [
      eslint.configs.recommended, // Basic ESLint recommended rules
      stylistic.configs.recommended, // Stylistic ESLint recommended rules
      ...tseslint.configs.recommended, // TypeScript ESLint recommended rules
    ],
    // Add specific rules or override existing ones
    rules: {
      'sort-imports': ['error', {
        ignoreCase: false,
        ignoreDeclarationSort: false,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        allowSeparatedGroups: false,
      }],
      'no-console': 'warn',
      // '@stylistic/array-bracket-spacing': ['error', 'never'],
      // '@stylistic/brace-style': ['error', '1tbs'],
      // '@stylistic/comma-dangle': ['error', 'always-multiline'],
      // '@stylistic/comma-spacing': ['error', { before: false, after: true }],
      // '@stylistic/eol-last': ['error', 'always'],
      // '@stylistic/function-call-spacing': ['error', 'never'],
      // '@stylistic/indent': ['error', 2],
      // '@stylistic/implicit-arrow-linebreak': ['error', 'beside'],
      // '@stylistic/no-confusing-arrow': 'error',
      // '@stylistic/no-multiple-empty-lines': ['error', { max: 1 }],
      // '@stylistic/no-multi-spaces': 'error',
      // '@stylistic/no-tabs': 'error',
      // '@stylistic/object-curly-spacing': ['error', 'always'],
      // '@stylistic/semi': ['error', 'never'],
      // '@stylistic/space-before-function-paren': ['error', 'never'],
      // '@stylistic/space-in-parens': ['error', 'never'],
      // '@stylistic/quotes': ['error', 'single', { avoidEscape: false }],
      // '@stylistic/quote-props': ['error', 'as-needed'],
      // '@typescript-eslint/no-unused-vars': 'warn',
    },
    // Specify the parser options for TypeScript files
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'], // Required for rules that use type information
      },
    },
  },
)
