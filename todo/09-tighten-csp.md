# Tighten Content Security Policy

## Problem

The renderer's CSP includes `'unsafe-inline'` for scripts, which weakens XSS protection in production builds.

## Affected Files

- `src/renderer/index.html` — line 8

## Current CSP

```html
<meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline';" />
```

`'unsafe-inline'` allows any inline script to execute, which defeats much of CSP's purpose.

## Proposed Solution

1. **For production:** Remove `'unsafe-inline'` and use nonce-based or hash-based CSP if any inline scripts are needed. Since the app uses `<script type="module" src="./main.ts">` (an external script), `'unsafe-inline'` may not be needed at all in the built output.

2. **For development:** electron-vite's dev server may require `'unsafe-inline'` for HMR. Use a conditional approach:
   - Set a strict CSP in the built HTML
   - Let electron-vite's dev server inject a looser CSP during development

3. **Additional directives to consider:**
   ```
   default-src 'self';
   script-src 'self';
   style-src 'self' 'unsafe-inline';
   img-src 'self' https://*.doubanio.com;
   connect-src 'self' https://*.douban.com;
   ```
   This locks down which hosts the app can contact (only Douban) and which can serve images.

## Acceptance Criteria

- Production builds do not use `'unsafe-inline'` for scripts
- The app still works correctly in both dev and production modes
- CSP restricts `connect-src` and `img-src` to expected Douban domains
