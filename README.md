# Douban Album Downloader

Desktop app for batch-downloading photo albums from [Douban](https://www.douban.com). Paste a URL, pick a folder, and the app handles pagination, parallel downloads, and automatic retries.

Built with Tauri v2, Vue 3, TypeScript, and Rust.

## Download

Grab the latest release for your platform from the [Releases page](https://github.com/jbgosselin/douban-album-downloader/releases):

- **macOS** — DMG (universal, Intel + Apple Silicon)
- **Windows** — NSIS installer
- **Linux** — AppImage (x64 and ARM64)

## Usage

1. Paste or drag-and-drop a Douban album URL into the app
2. Choose an output directory
3. The app fetches all pages and downloads images in parallel
4. When complete, open the folder or retry any failed downloads

### Settings

Expand the **Settings** section in the URL form to configure:

- **Max parallel downloads** (1–20, default 5)
- **Page fetch retries** (0–10, default 3)
- **Page fetch timeout** (5–300s, default 30s)
- **Image download timeout** (5–600s, default 60s)

## Building from Source

Requires **Node 24** and a **Rust toolchain**. A Nix flake is provided for reproducible setup (`nix develop` or use [direnv](https://direnv.net/)).

```sh
# Install dependencies
npm ci

# Run in dev/preview mode
npm start

# Build and package for your current platform
npm run dist

# Build macOS universal binary
npm run dist-all
```

## License

[MIT](LICENSE)
