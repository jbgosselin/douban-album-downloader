# Pagination Progress Feedback

## Problem

While album pages are being fetched (before any downloads start), the user sees "Downloading..." with a 0/0 progress bar. There is no indication that the app is working on discovering images. For large albums with many pages, this feels like the app is frozen.

## Affected Files

- `src/renderer/DownloadList.vue` — `onMounted` (lines 79-106) and template (lines 126-136)

## Current Behavior

The pagination loop runs silently:
```typescript
for (; ;) {
    console.log(`Fetching ${props.album.albumId} ${valueMax}`);
    // ... fetches page, no UI feedback
}
```

Only `console.log` indicates progress. The progress bar shows 0/0 until images start downloading.

## Proposed Solution

Add a reactive state for the fetching phase:

```typescript
const fetchingPage = ref(0);
const isFetching = ref(true);

// In the loop:
fetchingPage.value += 1;
// After the loop:
isFetching.value = false;
```

In the template, show a message like:
```
Discovering images... (page 3)
```

This could replace the "Downloading..." text while `isFetching` is true, or appear above the progress bar.

## Acceptance Criteria

- User sees which page is being fetched during the discovery phase
- The message disappears once image downloads begin
- Total image count updates as new pages are discovered
