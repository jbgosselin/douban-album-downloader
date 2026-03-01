# Image Filtering / Preview

## Problem

All images in an album are downloaded unconditionally. Users may only want a subset of the photos.

## Affected Files

- `src/renderer/DownloadList.vue` — split discovery from download
- Possibly a new component (e.g., `ImagePreview.vue`)
- `src/renderer/App.vue` — add a new step in the flow

## Current Flow

```
URL input → directory selection → fetch all pages → download all images
```

## Proposed Solution

Insert a preview/selection step between page fetching and downloading:

```
URL input → directory selection → fetch all pages → show thumbnail grid → user selects images → download selected
```

1. **Discovery phase**: Fetch all pages and collect image URLs (as today), but don't start downloading yet

2. **Preview grid**: Show thumbnails in a grid layout
   - Use the small/thumbnail size URLs (before the `xl` replacement) for fast loading
   - Checkboxes or click-to-toggle selection
   - "Select All" / "Deselect All" buttons
   - Show total count and selected count

3. **Download phase**: Only download the selected images with the `xl` size replacement

## Acceptance Criteria

- Users can see thumbnails before downloading
- Users can select/deselect individual images
- Only selected images are downloaded
- "Select All" is the default so existing behavior is preserved for users who don't want to filter
