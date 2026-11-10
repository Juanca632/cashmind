// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const TESTS = ['**/__tests__/**', 'src/test-support/**'];

const NO_REPOSITORIES = {
  group: ['**/repository'],
  message: 'Screens and components read through hooks and write through services.',
};
const NO_DB = { group: ['@/db/*'], message: 'Only the root layout and repositories use the database setup.' };
const NO_WRITES_IN_HOOKS = {
  group: ['**/repository'],
  importNames: [
    'insertExpense',
    'updateExpense',
    'deleteExpense',
    'savePlanFromMonth',
  ],
  message: 'Writes go through services.',
};
const noFeatures = (...features) => ({
  group: features.map((feature) => `@/features/${feature}/*`),
  message: 'Features do not depend on each other: move shared code to src/shared. Only home combines features.',
});

/** Flat config replaces rule options between matching blocks, so each zone lists all its patterns. */
const zone = (files, patterns) => ({
  files,
  ignores: TESTS,
  rules: { 'no-restricted-imports': ['error', { patterns }] },
});

/** Screens receive the database only to hand it to services, so they may not query it themselves. */
const noDirectQueries = {
  files: ['src/app/**', 'src/features/*/screens/**', 'src/features/*/components/**', 'src/shared/ui/**'],
  ignores: TESTS,
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector:
          'CallExpression[callee.property.name=/^(runAsync|execAsync|getAllAsync|getFirstAsync|withTransactionAsync|withExclusiveTransactionAsync|prepareAsync)$/]',
        message: 'Screens and components read through hooks and write through services.',
      },
    ],
  },
};

const featureZones = (feature, others) => [
  zone([`src/features/${feature}/**`], others),
  zone(
    [`src/features/${feature}/screens/**`, `src/features/${feature}/components/**`],
    [NO_REPOSITORIES, NO_DB, ...others],
  ),
  zone([`src/features/${feature}/hooks/**`], [NO_WRITES_IN_HOOKS, NO_DB, ...others]),
];

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  zone(['src/app/**'], [NO_REPOSITORIES, NO_DB]),
  { files: ['src/app/_layout.tsx'], rules: { 'no-restricted-imports': 'off' } },
  zone(['src/shared/**'], [noFeatures('expenses', 'plan', 'home'), NO_DB]),
  ...featureZones('expenses', [noFeatures('plan', 'home')]),
  ...featureZones('plan', [noFeatures('expenses', 'home')]),
  ...featureZones('home', []),
  noDirectQueries,
]);
