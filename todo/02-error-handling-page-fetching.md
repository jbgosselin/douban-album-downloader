# Error Handling in Page Fetching

## Problem

The pagination loop in `DownloadList.vue:onMounted` has no error handling around `fetch()` or `DOMParser`. A network failure, HTTP error (403, 429, 500), or malformed HTML silently breaks the download flow with no feedback to the user.

## Affected Files

- `src/renderer/DownloadList.vue` — lines 79-106 (`onMounted`)

## Current Behavior

```typescript
// No try/catch, no HTTP status check
const res = await fetch(pageUrl);
const content = await res.text();
const parser = new DOMParser();
const doc = parser.parseFromString(content, 'text/html');
```

If `fetch` throws (network error) or returns a non-200 status, the app either hangs or silently produces wrong results.

## Proposed Solution

1. Wrap the pagination loop body in try/catch
2. Check `res.ok` before parsing the response
3. Surface errors to the user via a reactive error message in the template
4. Consider retry logic for transient failures (e.g., retry once on 5xx)

```typescript
try {
    const res = await fetch(pageUrl);
    if (!res.ok) {
        // Show error to user, optionally retry
        break;
    }
    const content = await res.text();
    // ...
} catch (err) {
    // Network error — show message, stop pagination
}
```

5. Add an error state to the template (e.g., a Bootstrap alert) so the user sees what went wrong

## Acceptance Criteria

- Network errors during pagination are caught and displayed to the user
- Non-200 HTTP responses are detected and handled
- The app does not hang or silently fail
- User can retry or restart after a page-fetching error
