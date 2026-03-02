# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Douban Album Downloader is a Tauri v2 desktop app (Vue 3 + TypeScript frontend, Rust backend) for downloading photo albums from Douban (Chinese social network). It supports multiple Douban URL formats with pagination, parallel downloads, and retry on failure.

## Commands

- `npm start` — Run the app in dev mode with HMR (alias for `tauri dev`)
- `npm run dev` — Run only the Vite dev server (no Tauri)
- `npm run build` — Type-check and build the frontend
- `npm run dist` — Build distributable binary for current platform
- `npm run dist-all` — Build macOS universal binary

There is no test suite or linter script configured. ESLint configs exist but there's no `lint` npm script.

## Architecture

Tauri v2 two-layer architecture:

- **Rust backend** (`src-tauri/src/lib.rs`) — Tauri commands for file dialogs, image downloads (via reqwest), page fetching, cancellation (CancellationToken), and random User-Agent rotation
- **Frontend** (`src/renderer/`) — Vue 3 SPA with Bootstrap 5 styling, communicates with Rust via `@tauri-apps/api` invoke calls

### Key Files

- `src-tauri/Cargo.toml` — Rust dependencies (tauri, reqwest, tokio, rand, serde)
- `src-tauri/tauri.conf.json` — Window config, bundle settings, CSP, updater
- `src-tauri/capabilities/default.json` — Tauri v2 permission declarations
- `src/renderer/tauri-bridge.ts` — TypeScript bridge wrapping all Tauri invoke calls
- `src/renderer/App.vue` — Root component, toggles between URL input and download progress
- `src/renderer/AlbumUrlForm.vue` — URL validation and site pattern matching
- `src/renderer/AlbumPattern.ts` — Supported Douban URL patterns (host, path regex, CSS selector, pagination key)
- `src/renderer/DownloadList.vue` — Core download logic: fetches pages via Rust, extracts image URLs from DOM, downloads in parallel, tracks per-image status with retry

### Data Flow

URL input → pattern matching → output directory selection (native dialog via Rust) → paginated page fetching (Rust reqwest) → image URL extraction via CSS selectors in JS → parallel image download via Rust IPC → progress tracking with retry

## Build Configuration

- `vite.config.ts` — Standard Vite config with Vue plugin and `@` path alias → `src/renderer`
- `src-tauri/tauri.conf.json` — Tauri build config, points to `dist/` for frontend and `http://localhost:5173` for dev
- TypeScript: single `tsconfig.json` extending `@vue/tsconfig/tsconfig.dom.json`

## Dev Environment

Node 24 and Rust toolchain are expected. A Nix flake (`flake.nix` + `.envrc`) provides a reproducible dev environment with both.
