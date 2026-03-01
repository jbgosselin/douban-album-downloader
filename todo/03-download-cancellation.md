# Download Cancellation

## Problem

Once downloads start, there is no way to cancel them. If a user enters the wrong URL or wants to stop, they must wait for all downloads to finish or force-quit the app.

## Affected Files

- `src/renderer/DownloadList.vue` — `onMounted` and `downloadImage` functions
- `src/main/main.ts` — `downloadSingleImage` IPC handler (line 99)
- `src/preload/preload.ts` — bridge API

## Current Behavior

Downloads run to completion with no abort mechanism. The only escape is `window.location.reload()` via the Restart button (shown only after all downloads finish).

## Proposed Solution

1. **Renderer side:** Create an `AbortController` and pass its signal through to downloads
   ```typescript
   const controller = new AbortController();
   // Pass signal to fetch in main process via IPC
   ```

2. **Main process:** Accept an abort signal or implement a cancellation IPC channel
   - Option A: Add a `cancelDownloads` IPC handler that sets a flag checked before each fetch
   - Option B: Track in-flight requests and abort them via `AbortController` on the Node side

3. **UI:** Add a "Cancel" button visible during the download phase (the `v-else` template block, line 126-136)

4. **Cleanup:** On cancel, stop the pagination loop and any pending downloads. Already-downloaded files can remain on disk.

## Acceptance Criteria

- A Cancel button is visible while downloads are in progress
- Clicking Cancel stops the pagination loop and pending downloads
- Already-completed downloads are preserved
- The UI returns to a state where the user can start over
