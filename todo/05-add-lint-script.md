# Add Lint Script

## Problem

ESLint is installed and configured (`eslint.config.js`) but there is no `lint` npm script in `package.json`, making it inconvenient to run.

## Affected Files

- `package.json` — `scripts` section (line 7)
- `eslint.config.js` — already configured, no changes needed

## Current Configuration

```js
// eslint.config.js — flat config with Vue + TypeScript
export default defineConfigWithVueTs(
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
)
```

## Proposed Solution

Add lint scripts to `package.json`:

```json
"scripts": {
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    // ... existing scripts
}
```

Optionally, also add a `type-check` script:

```json
"type-check": "vue-tsc --build"
```

## Acceptance Criteria

- `npm run lint` runs ESLint on the source files and reports issues
- `npm run lint:fix` auto-fixes what it can
- Both scripts exit with appropriate codes (0 on success, non-zero on errors)
