# Add Basic Test Suite

## Problem

There are no tests at all. `AlbumPattern.ts` contains pure logic (regex matching, URL parsing) that is very testable and likely to break if new patterns are added.

## Affected Files

- `package.json` — add test framework dependency and `test` script
- `src/renderer/AlbumPattern.ts` — test target (no changes needed to the file itself)
- New file: `src/renderer/__tests__/AlbumPattern.test.ts` (or similar)

## Key Functions to Test

### `matchSite(uri: URL)`

- Returns correct `Album` for each of the 3 supported URL patterns
- Returns `null` for non-Douban URLs
- Returns `null` for Douban URLs with unsupported paths
- Strips query parameters from the album URL
- Extracts the correct `albumId` from each pattern

### Test data (from `availableSites`):

```
https://www.douban.com/photos/album/34084898/     → albumId: "34084898", pageKey: "m_start"
https://site.douban.com/108128/widget/photos/1164317/  → albumId: "1164317", pageKey: "start"
https://site.douban.com/108128/widget/public_album/161454/ → albumId: "161454", pageKey: "start"
https://example.com/photos/album/123/              → null
https://www.douban.com/other/path/                 → null
```

## Proposed Solution

Use **Vitest** since the project already uses Vite:

```
npm install -D vitest
```

Add to `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

## Acceptance Criteria

- `npm test` runs and passes
- All 3 URL patterns have positive test cases
- Negative cases (wrong host, wrong path) are covered
- Tests run in CI-friendly mode (`vitest run`)
