require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
    parserOptions: {
      ecmaVersion: 'latest'
    },
    'extends': [
      'plugin:vue/vue3-essential',
      'eslint:recommended',
      '@vue/eslint-config-typescript'
    ],
};