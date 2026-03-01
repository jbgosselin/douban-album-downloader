# Pause/Resume Downloads

## Problem

If the user closes the app mid-download, all progress is lost. There is no way to pause and resume later. Large albums must be re-downloaded from scratch.

## Affected Files

- `src/renderer/DownloadList.vue` — download logic
- `src/main/main.ts` — may need new IPC handlers for state persistence
- `src/preload/preload.ts` — bridge for new IPC calls

## Current Behavior

- Download state lives entirely in Vue reactive refs (`images`, `imageIDs`)
- State is lost on page reload or app close
- The "Restart" button does `window.location.reload()` which wipes everything

## Proposed Solution

1. **Persist download state** using `electron-store` (already a dependency):
   - Save the list of image URLs, their download status, and the output directory
   - Key by album ID so different albums don't conflict

2. **On app start**, check if there's a saved session:
   - If yes, offer to resume (show the album ID and how many images remain)
   - If no, show the normal URL input form

3. **Pause button**: Stop queuing new downloads, let in-flight ones finish, save state

4. **Resume**: Load saved state, skip already-downloaded images (check file existence or trust the saved status), continue with remaining

5. **Clear state** when all downloads complete successfully or when the user explicitly restarts

## Acceptance Criteria

- Download progress survives app restart
- User can pause downloads and resume later
- Already-downloaded images are not re-downloaded
- Completed albums clear their saved state
