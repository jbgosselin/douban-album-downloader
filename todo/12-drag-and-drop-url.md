# Drag-and-Drop URL Input

## Problem

Users must manually copy-paste URLs into the input field. Drag-and-drop from a browser would be a smoother workflow.

## Affected Files

- `src/renderer/AlbumUrlForm.vue` — add drop zone handling
- `src/renderer/App.vue` — possibly prevent default drag behavior at the app level

## Current Behavior

A single text input (`<input type="url">`) with manual paste.

## Proposed Solution

1. **Add drag-and-drop handlers** to the form or the input:
   ```typescript
   function onDrop(event: DragEvent) {
       event.preventDefault();
       const url = event.dataTransfer?.getData('text/uri-list')
                || event.dataTransfer?.getData('text/plain');
       if (url) {
           albumUrl.value = url.trim();
           // Trigger validation
       }
   }
   ```

2. **Visual feedback**: Show a drop zone indicator when dragging over the form (e.g., dashed border, "Drop URL here" text)

3. **Prevent default browser drag behavior** at the window level to avoid navigation:
   ```typescript
   // In App.vue or main.ts
   document.addEventListener('dragover', (e) => e.preventDefault());
   document.addEventListener('drop', (e) => e.preventDefault());
   ```

4. Handle both `text/uri-list` and `text/plain` MIME types since browsers vary in what they provide when dragging a link.

## Acceptance Criteria

- Dragging a URL from a browser onto the app populates the input field
- Visual feedback indicates the app accepts drops
- Default browser navigation on drop is prevented
- Validation runs automatically after a drop
