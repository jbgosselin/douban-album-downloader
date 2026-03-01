# Auto-Update

## Problem

Users must manually download new versions of the app. There is no update notification or automatic update mechanism.

## Affected Files

- `package.json` — add `electron-updater` dependency and configure publish targets
- `src/main/main.ts` — add update checking logic
- `build` config in `package.json` — configure publish settings for electron-builder

## Current Build Setup

electron-builder is configured for macOS (universal), Windows (portable), and Linux (AppImage). The app is hosted on GitHub (`github.com/jbgosselin/douban-album-downloader`).

## Proposed Solution

1. **Install `electron-updater`**:
   ```
   npm install electron-updater
   ```

2. **Add update checking in main process** (`src/main/main.ts`):
   ```typescript
   import { autoUpdater } from 'electron-updater';

   app.whenReady().then(() => {
       autoUpdater.checkForUpdatesAndNotify();
   });
   ```

3. **Configure GitHub releases** as the publish target in `package.json`:
   ```json
   "build": {
       "publish": {
           "provider": "github"
       }
   }
   ```

4. **Use GitHub Releases** to distribute builds — electron-builder can upload artifacts automatically with `npm run dist -- --publish always`

5. **Note on portable/AppImage**: Auto-update works differently for portable Windows builds and AppImage. Consider switching Windows to NSIS installer for better update support, or accept that auto-update only works on macOS.

## Acceptance Criteria

- The app checks for updates on launch
- Users are notified when a new version is available
- Updates can be downloaded and installed (at least on macOS)
- The update check does not block app startup
