module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  ignorePatterns: ['node_modules', 'docs', 'dist', 'nodesrc', 'index.html', 'src/components', 'src/utils'],
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
    extraFileExtensions: ['.svelte'],
  },
  plugins: ['svelte3', '@typescript-eslint'],
  extends: [
    'airbnb-base',
    'eslint:recommended',
    'plugin:eslint-comments/recommended',
    'plugin:promise/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'error',
  },
  overrides: [
    {
      files: ['**/*.svelte'],
      processor: 'svelte3/svelte3',
      rules: {
        /*
          Disabling the following rules since they
          do not work as expected with svelte eslint plugin
        */
        'import/first': 'off',
        'import/no-duplicates': 'off',
        'import/no-mutable-exports': 'off',
        'import/no-unresolved': 'off',
        'import/extensions': 'off',
        'import/prefer-default-export': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
      },
      settings: {
        // eslint-disable-next-line global-require
        'svelte3/typescript': require('typescript'),
      },
    },
    {
      files: ['**/*.js'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
      },
    },
    {
      files: ['**/*.ts'],
      rules: {
        'import/extensions': [
          'error',
          'ignorePackages',
          {
            js: 'never',
            ts: 'never',
          },
        ],
      },
    },
  ],
  settings: {
    // eslint-disable-next-line global-require
    'svelte3/typescript': require('typescript'),
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
      },
    },
  },
};
