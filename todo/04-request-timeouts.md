# Request Timeouts

## Problem

Neither the page-fetching `fetch()` in the renderer nor the image-downloading `fetch()` in the main process have timeouts. A stalled server will hang the app indefinitely.

## Affected Files

- `src/renderer/DownloadList.vue` — line 86 (`fetch(pageUrl)`)
- `src/main/main.ts` — line 102 (`fetch(imgUrl)`)

## Current Behavior

```typescript
// Renderer — no timeout
const res = await fetch(pageUrl);

// Main process — no timeout
const res = await fetch(imgUrl);
```

Both calls will wait forever if the server stops responding.

## Proposed Solution

Use `AbortSignal.timeout()` (available in Node 18+ and modern browsers):

```typescript
// Renderer — page fetching (e.g., 30 second timeout)
const res = await fetch(pageUrl, { signal: AbortSignal.timeout(30_000) });

// Main process — image download (e.g., 60 second timeout for large images)
const res = await fetch(imgUrl, { signal: AbortSignal.timeout(60_000) });
```

If combined with the cancellation feature (#03), compose the timeout signal with the user's abort signal using `AbortSignal.any()`.

## Acceptance Criteria

- Page fetches time out after a reasonable duration (~30s)
- Image downloads time out after a reasonable duration (~60s)
- Timeout errors are handled gracefully (marked as ERROR, retryable)
- Timeouts do not block the rest of the download queue
