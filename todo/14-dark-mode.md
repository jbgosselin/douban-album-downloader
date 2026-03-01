# Dark Mode

## Problem

The app only has a light theme. Many users prefer dark mode, especially when browsing photos.

## Affected Files

- `src/renderer/index.html` — add `data-bs-theme` attribute
- `src/renderer/main.ts` or `App.vue` — theme toggle logic
- Possibly `src/main/main.ts` — read system preference via `nativeTheme`

## Current Styling

The app uses Bootstrap 5.3.8, which has built-in dark mode support via `data-bs-theme="dark"` on the `<html>` element. No custom CSS is used.

## Proposed Solution

### Option A: Follow system preference (simplest)

1. In the main process, read `nativeTheme.shouldUseDarkColors`
2. Pass the preference to the renderer via a new IPC call or preload API
3. Set `document.documentElement.setAttribute('data-bs-theme', 'dark')` accordingly
4. Listen for `nativeTheme.on('updated', ...)` to react to OS theme changes

### Option B: User toggle with system default

1. Add a theme toggle button (sun/moon icon) in the app header
2. Default to the system preference
3. Save the user's choice in `electron-store`
4. Apply `data-bs-theme` attribute based on preference

### Implementation (Option A — minimal):

```typescript
// preload.ts — expose theme info
theme: {
    isDark: () => ipcRenderer.invoke('isDarkMode'),
    onChange: (callback) => ipcRenderer.on('theme-changed', callback),
}

// main.ts
ipcMain.handle('isDarkMode', () => nativeTheme.shouldUseDarkColors);
nativeTheme.on('updated', () => {
    mainWindow.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors);
});
```

Since Bootstrap 5.3+ handles all component styling via `data-bs-theme`, no custom CSS should be needed.

## Acceptance Criteria

- The app respects the OS dark/light mode preference
- All Bootstrap components render correctly in dark mode
- Theme changes are reflected without restarting the app
