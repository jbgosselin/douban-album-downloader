# Improve README

## Problem

The README is essentially empty (27 bytes, just a header). Users and contributors have no information about what the app does, how to install it, or what URL formats are supported.

## Affected Files

- `README.md`

## Proposed Content

1. **Project description** — What the app does (download photo albums from Douban)
2. **Screenshot** — A screenshot of the app in action
3. **Supported URL formats** — List the 3 patterns from `AlbumPattern.ts`:
   - `https://www.douban.com/photos/album/{id}/`
   - `https://site.douban.com/{siteId}/widget/photos/{id}/`
   - `https://site.douban.com/{siteId}/widget/public_album/{id}/`
4. **Installation** — Download links or build instructions
5. **Development** — How to set up the dev environment (`nix develop` or manual Node 20 setup), available scripts
6. **Building** — `npm run dist` / `npm run dist-all` for packaging
7. **License** — MIT (already in `package.json`)

## Acceptance Criteria

- README explains what the project is
- Supported URL formats are documented
- Dev setup instructions are present
- Build/distribution instructions are present
