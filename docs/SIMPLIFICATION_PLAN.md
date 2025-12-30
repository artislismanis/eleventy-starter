# Simplification Plan: Option A (Recommended)

## Overview

Remove per-page bundling complexity while maintaining performance through PurgeCSS.

## Changes Required

### 1. Remove Auto-Generation System

**Delete these files:**
- `utils/generate-page-styles.mjs`
- `utils/remove-empty-css.mjs`
- All files in `src/assets/styles/pages/` (will be recreated manually)
- All files in `src/assets/scripts/pages/` (will be recreated manually)

**Keep:**
- `utils/purge-css.mjs` (still useful)
- `utils/generate-critical.mjs` (make opt-in)

### 2. Simplify Vite Entry Points

**Replace dynamic entries with static ones:**

**BEFORE:**

```js
// eleventy.config.mjs
import { generatePageStyles, getDynamicEntries } from './utils/generate-page-styles.mjs';

eleventyConfig.on('eleventy.before', async () => {
  console.log('Generating page styles...\n');
  await generatePageStyles();
});

// In Vite config
eleventyConfig.addPlugin(EleventyVitePlugin, {
  viteOptions: {
    build: {
      rollupOptions: {
        input: getDynamicEntries(),
      },
    },
  },
});
```

**AFTER:**

```js
// eleventy.config.mjs
import path from 'path';

// Remove eleventy.before hook entirely

// In Vite config
eleventyConfig.addPlugin(EleventyVitePlugin, {
  viteOptions: {
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(process.cwd(), 'src/assets/scripts/main.js'),
          // Optional: add a blog-specific bundle if needed
          // blog: path.resolve(process.cwd(), 'src/assets/scripts/blog.js'),
        },
      },
    },
  },
});
```

### 3. Restructure Assets

**New structure:**

```
src/assets/
├── scripts/
│   ├── main.js              # Global JS entry
│   └── modules/             # Shared modules
│       └── nav.js
├── styles/
│   ├── main.scss            # Global styles entry
│   ├── _variables.scss
│   ├── _base.scss
│   ├── _layout.scss
│   ├── _posts.scss
│   ├── _components.scss
│   ├── components/
│   │   └── _message-box.scss
│   ├── vendor/
│   │   └── _prism.scss
│   └── pages/               # Optional page-specific overrides
│       └── about.scss       # Only if truly needed
```

**main.scss becomes:**

```scss
// Global styles loaded on every page
@use 'variables';
@use 'base';
@use 'layout';
@use 'posts';
@use 'components';

// Optionally import vendor (or conditionally via build)
// @use 'vendor/prism';
```

### 4. Update Templates to Load Assets

**Before (per-page bundles):**

```njk
{# Each page had its own bundle #}
<link rel="stylesheet" href="/assets/css/{{ page.fileSlug }}.css">
<script src="/assets/js/{{ page.fileSlug }}.js"></script>
```

**After (global bundle):**

```njk
{# layouts/base.njk - global assets #}
<link rel="stylesheet" href="/assets/css/main.css">
<script src="/assets/js/main.js" defer></script>

{# Optional: load blog bundle only on blog pages #}
{% if tags contains "post" %}
  <link rel="stylesheet" href="/assets/css/blog.css">
{% endif %}
```

### 5. Simplify Build Pipeline

**Before:**
```
eleventy.before → generatePageStyles (scan, generate 48 files)
  ↓
vite build (bundle all pages)
  ↓
closeBundle → purgeCSSFiles() → removeEmptyCss() → generateCriticalCSS()
```

**After:**
```
vite build (bundle main.js/css)
  ↓
closeBundle → purgeCSSFiles() [critical CSS opt-in]
```

### 6. Make Critical CSS Opt-In

```js
// eleventy.config.mjs - Vite plugin
eleventyConfig.addPlugin(EleventyVitePlugin, {
  viteOptions: {
    plugins: [
      {
        name: 'css-post-build',
        apply: 'build',
        async closeBundle() {
          await purgeCSSFiles();

          // Only generate critical CSS in production with env flag
          if (process.env.GENERATE_CRITICAL_CSS === 'true') {
            await generateCriticalCSS();
          }
        },
      },
    ],
  },
});
```

### 7. Component Usage (Optional)

**Option 1: Remove `data-component` detection**
- Import all components globally in `main.scss`
- Let PurgeCSS remove unused styles

**Option 2: Keep detection for documentation**
- Remove automatic import generation
- Use `data-component` attributes for documentation/debugging only
- Manually import components you actually use

## Migration Steps

1. **Backup current approach** (git branch: `feature/simplified`)

2. **Delete auto-generation**
   ```bash
   rm utils/generate-page-styles.mjs utils/remove-empty-css.mjs
   rm -rf src/assets/styles/pages/_generated
   rm -rf src/assets/styles/pages/_custom
   rm -rf src/assets/scripts/pages/_generated
   rm -rf src/assets/scripts/pages/_custom
   ```

3. **Create new main.scss** (consolidate all global styles)

4. **Update eleventy.config.mjs** (remove hooks, simplify Vite config)

5. **Update base layout** (use global bundles)

6. **Build and test**
   ```bash
   npm run build
   # Check bundle sizes
   ls -lh _site/assets/css/
   ls -lh _site/assets/js/
   ```

7. **Compare performance**
   - Before/after bundle sizes
   - Before/after build time
   - Lighthouse scores

## Expected Outcomes

- **Files reduced:** 48 generated files → 2-4 static files
- **Build time:** ~5-10s → ~1-2s
- **Complexity:** Much lower cognitive overhead
- **Bundle size:** Slightly larger but offset by PurgeCSS
- **Performance:** Nearly identical (PurgeCSS removes unused CSS anyway)
- **Maintainability:** Significantly better

## Rollback Plan

If simplified version doesn't work:
```bash
git checkout main
git branch -D feature/simplified
```

The old system is preserved in git history.

## Future: Template Package (Phase 2)

After simplification, extract to:
- `eleventy-theme-simple-blog` package
- Contains: layouts, base styles, filters, config
- Your blog: just content + customizations

This is much easier with simplified architecture.
