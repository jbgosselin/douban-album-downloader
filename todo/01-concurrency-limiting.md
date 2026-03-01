# Concurrency Limiting for Downloads

## Problem

`DownloadList.vue` fires all image downloads simultaneously via `Promise.all()`. A large album with hundreds of photos creates hundreds of parallel fetch requests, which can overwhelm the network, cause timeouts, or get rate-limited by Douban servers.

## Affected Files

- `src/renderer/DownloadList.vue` — lines 81-105 (`onMounted`) and lines 40-56 (`retryErrors`)

## Current Behavior

```typescript
// All downloads start at once
for (const img of images) {
    imagesPromises.push(downloadImage(imgUrl));
}
await Promise.all(imagesPromises);
```

## Proposed Solution

Add a concurrency pool to limit parallel downloads to ~5-10 at a time.

**Option A: Use `p-limit`** (lightweight, ~1KB)
```
npm install p-limit
```
```typescript
import pLimit from 'p-limit';
const limit = pLimit(5);
// ...
imagesPromises.push(limit(() => downloadImage(imgUrl)));
```

**Option B: Manual pool** — Implement a simple semaphore/queue to avoid adding a dependency.

Both `onMounted` and `retryErrors` need the same treatment since they both use `Promise.all()` on unbounded arrays.

## Acceptance Criteria

- No more than N concurrent downloads at a time (N configurable, default ~5)
- Progress bar still updates correctly as each image completes
- Both initial download and retry flows respect the limit
