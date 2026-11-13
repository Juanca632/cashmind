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
    'insertEntry',
    'updateEntry',
    'deleteEntry',
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

const SPACING_PROPS = 'Property[key.name=/^(padding|margin|gap|rowGap|columnGap|minHeight)/]';
const TOKENS = '/^(Spacing|Layout|Size)$/';
const USE_TOKENS = 'Use the shared Layout and Size tokens from src/shared/theme/theme.ts (add one there if needed).';

/**
 * Screens receive the database only to hand it to services, so they may not query it themselves.
 * Screens and components also take every spacing and minimum height from the shared tokens, so the
 * app keeps one rhythm. Flat config replaces this rule's options per block, so both live here.
 */
const screenRules = {
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
      { selector: `${SPACING_PROPS} > Literal[value!=0]`, message: USE_TOKENS },
      {
        selector: `Property[key.name=/^(width|height|minWidth|maxWidth|maxHeight|borderWidth|opacity|size)$/] > Literal[raw=/^[0-9.]+$/][value!=0][value!=1]`,
        message: USE_TOKENS,
      },
      { selector: 'JSXAttribute[name.name="size"] > JSXExpressionContainer > Literal', message: USE_TOKENS },
      { selector: "MemberExpression[object.name='Spacing']", message: USE_TOKENS },
      { selector: `${SPACING_PROPS} > UnaryExpression > Literal`, message: USE_TOKENS },
      {
        selector: `${SPACING_PROPS} > BinaryExpression[left.object.name=${TOKENS}][right.object.name=${TOKENS}]`,
        message: USE_TOKENS,
      },
      // A token plus a number is a new value in disguise; adding a safe-area inset is fine.
      { selector: `${SPACING_PROPS} > BinaryExpression:has(> Literal)`, message: USE_TOKENS },
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
  zone(['src/shared/**'], [noFeatures('entries', 'plan', 'home'), NO_DB]),
  ...featureZones('entries', [noFeatures('plan', 'home')]),
  ...featureZones('plan', [noFeatures('entries', 'home')]),
  ...featureZones('home', []),
  screenRules,
]);
