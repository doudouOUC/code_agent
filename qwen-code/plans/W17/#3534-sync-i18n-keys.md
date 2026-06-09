# fix(i18n): sync mismatched keys between en.js and zh.js

PR: #3534 | Merged: 2026-04-23 | +202/-18 | 5 files

## What it does
Adds 4 missing keys to `en.js` and 5 missing Chinese translations to `zh.js`, bringing both locales to full alignment at 1268 keys each. Adds a `npm run check-i18n` CI step to prevent future key drift, with CI-aware behavior to avoid dirtying the working tree.

## Key files changed
- `packages/cli/src/i18n/locales/en.js`: Add 4 missing keys used by source code `t()` calls
- `packages/cli/src/i18n/locales/zh.js`: Add 5 missing Chinese translations
- `scripts/check-i18n.ts`: New script to validate locale key alignment
- `.github/workflows/ci.yml`: Add check-i18n step to lint job
- `scripts/unused-keys-only-in-locales.json`: Updated unused keys inventory

## Final Implementation Status
- **Status**: MERGED (2026-04-23)
- **Outcome**: Implemented as designed
