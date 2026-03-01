# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Douban Album Downloader is an Electron desktop app (Vue 3 + TypeScript) for downloading photo albums from Douban (Chinese social network). It supports multiple Douban URL formats with pagination, parallel downloads, and retry on failure.

## Commands

- `npm start` — Run the app in preview/dev mode (opens DevTools automatically)
- `npm run prebuild` — Build all bundles with electron-vite
- `npm run pack` — Build and package for local testing (no installer)
- `npm run dist` — Build and package for current platform
- `npm run dist-all` — Build for macOS (universal), Windows (portable), Linux (AppImage)

There is no test suite or linter script configured. ESLint configs exist but there's no `lint` npm script.

## Architecture

Three-process Electron architecture built with **electron-vite**:

- **Main process** (`src/main/main.ts`) — Window management, IPC handlers for file dialogs and image downloads (via fetch), persistent window state via `electron-store`
- **Preload** (`src/preload/preload.ts`) — Secure bridge exposing `window.electron` API via `contextBridge`. Types in `src/preload/index.d.ts`
- **Renderer** (`src/renderer/`) — Vue 3 SPA with Bootstrap 5 styling

### Renderer Components

- `App.vue` — Root component, toggles between URL input and download progress
- `AlbumUrlForm.vue` — URL validation and site pattern matching
- `AlbumPattern.ts` — Defines supported Douban URL patterns (host, path regex, CSS selector for images, pagination key)
- `DownloadList.vue` — Core download logic: fetches pages, extracts image URLs from DOM, downloads in parallel, tracks per-image status with retry
- `ProgressBar.vue` — Reusable progress bar

### Data Flow

URL input → pattern matching → output directory selection (native dialog) → paginated page fetching → image URL extraction via CSS selectors → parallel download via main process IPC → progress tracking with retry

## Build Configuration

- `electron.vite.config.ts` — Three Vite build targets (main, preload, renderer). Renderer uses Vue plugin and `@` path alias → `src/renderer`
- TypeScript composite project: `tsconfig.json` references `tsconfig.node.json` (main/config) and `src/renderer/tsconfig.json` (renderer)
- Output goes to `out/` directory

## Dev Environment

Node 20 is expected. A Nix flake (`flake.nix` + `.envrc`) provides a reproducible dev environment.
