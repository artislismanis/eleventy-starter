# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Eleventy (11ty) static site generator project with advanced features including Vite integration, per-page CSS/JS bundling, and automatic component detection. The build system generates optimized, page-specific asset bundles while supporting manual customization.

## Common Commands

### Development

```bash
npm run dev              # Start development server with hot reload
npm run build            # Production build (clean + eleventy)
npm run serve            # Serve built site locally
```

### Linting & Formatting

```bash
npm run lint             # Run all linters (format, lint:js, lint:css, lint:md)
npm run format           # Format all files with Prettier
npm run lint:js          # ESLint (with DEBUG output)
npm run lint:css         # Stylelint for SCSS files
npm run lint:md          # Markdownlint
```

### Deployment

```bash
npm run deploy           # Deploy to S3 + trigger Amplify (main branch only)
npm run deploy:dry       # Dry-run deployment (shows changes without executing)
npm run deploy:force     # Force deploy from any branch
npm run deploy:s3-only   # Sync to S3 without triggering Amplify
```

**Deployment notes:**

- Requires environment variables: `S3_BUCKET`, `AWS_REGION`, `AMPLIFY_APP_ID`, `AMPLIFY_BRANCH_NAME`
- Only deploys from `main` branch by default (use `--force` to bypass)
- Files are uploaded to S3 with branch name as prefix (e.g., `s3://bucket/main/`)
- See `scripts/deploy.mjs` for all options

### Other

```bash
npm run clean            # Delete _site and .11ty-vite folders
npm run lighthouse       # Run Unlighthouse performance audit
```

## Architecture

### Theme Integration

This project uses the `eleventy-base-blog-template` theme, installed as an npm package from GitHub. The theme provides base layouts, styles, scripts, and build utilities, while the content repository focuses on content and customization.

**Theme package:** [eleventy-base-blog-template](https://github.com/artislismanis/eleventy-base-blog-template)

**Current directory structure:**

```text
eleventy-starter/
├── content/                    # Site content (flattened from src/pages/)
│   ├── posts/                 # Blog posts
│   ├── index.njk              # Homepage
│   ├── blog.njk               # Blog index
│   └── _data/                 # Site data and schemas
├── overrides/                  # Site-specific customizations
│   ├── layouts/               # Override theme layouts (optional)
│   ├── scripts/
│   │   └── main.js           # Entry point (imports theme)
│   ├── bundles/               # Optional feature bundles
│   ├── styles/                # Custom styles
│   └── lib/                   # Custom filters/shortcodes
│       ├── filters.mjs        # Override/extend theme filters
│       └── shortcodes.mjs     # Override/extend theme shortcodes
├── lib/                        # Build utilities
│   └── layout-resolver.mjs    # Layout cascade resolution
├── public/                     # Static files
├── docs/                       # Documentation
│   ├── THEME_CONFIGURATION.md # Theme setup and switching guide
│   └── OVERRIDES.md           # Override system guide
├── node_modules/
│   └── eleventy-base-blog-template/  # Theme package
│       ├── layouts/           # Theme templates
│       ├── lib/               # Theme filters/shortcodes/transforms
│       ├── styles/            # Theme SCSS
│       ├── scripts/           # Theme JavaScript
│       ├── utils/             # Build utilities
│       └── config/            # Configuration helpers
├── theme.config.mjs            # Theme configuration (single source of truth)
└── eleventy.config.mjs         # Eleventy configuration
```

#### Theme Configuration (Single Source of Truth)

All theme-related configuration is centralized in `theme.config.mjs`. This provides:

- **One place** to specify theme package name
- **Easy theme switching** - change one file to switch themes
- **No hardcoded imports** - all theme imports handled centrally
- **Theme-agnostic** `eleventy.config.mjs` - doesn't know about theme internals

**See `docs/THEME_CONFIGURATION.md` for complete guide on theme configuration and switching.**

#### Upgrading the Theme

Update to the latest theme version:

```bash
npm update eleventy-base-blog-template
npm run build  # Test that everything still works
```

Pin to a specific theme version in `package.json`:

```json
{
  "dependencies": {
    "eleventy-base-blog-template": "github:artislismanis/eleventy-base-blog-template#v1.0.0"
  }
}
```

#### Switching Themes

To switch to a different theme:

1. Install new theme: `npm install my-new-theme`
2. Edit `theme.config.mjs`:
   - Change `THEME_PACKAGE` to new theme name
   - Update imports based on new theme's structure
   - Update metadata (paths, features, layouts)
3. Test: `npm run build`

See `docs/THEME_CONFIGURATION.md` for detailed instructions.

#### Cascade Override System

The theme uses a **cascade/layering system** where your content repository can override any theme component:

**1. Override layouts:** Create files in `overrides/layouts/` with the same name as theme layouts. For example, create `overrides/layouts/base.njk` to override the theme's base layout.

**2. Override/extend filters:** Define custom filters in `overrides/lib/filters.mjs`:

```javascript
// overrides/lib/filters.mjs
export default {
  // Override theme's currentYear filter
  currentYear: () => new Date().getFullYear() + ' (Custom)',

  // Add new custom filters
  customDate: (date) => new Date(date).toLocaleDateString(),
  uppercase: (str) => str.toUpperCase(),
};
```

Then import in `eleventy.config.mjs`:

```javascript
import userFilters from './overrides/lib/filters.mjs';
import { initTheme } from 'eleventy-base-blog-template';

export default function (eleventyConfig) {
  // User filters override theme filters
  initTheme(eleventyConfig, {
    filters: userFilters,
  });
  // ...
}
```

**3. Override/extend shortcodes:** Similar pattern using `overrides/lib/shortcodes.mjs`:

```javascript
// overrides/lib/shortcodes.mjs
export default {
  youtube: (id) => `<iframe src="https://youtube.com/embed/${id}"></iframe>`,
};
```

**4. Customize styles:** Import theme styles and override CSS custom properties:

```scss
// overrides/styles/custom.scss
@use 'eleventy-base-blog-template/styles/main';

:root {
  --color-primary: #ff6b6b;
  --background-color: #f5f5f5;
}
```

Then import in `overrides/scripts/main.js`:

```javascript
import '../styles/custom.scss';
import 'eleventy-base-blog-template/scripts/main.js';
```

**5. Extend theme scripts:** Import and extend theme JavaScript:

```javascript
// overrides/scripts/main.js
import 'eleventy-base-blog-template/styles/main.scss';
import 'eleventy-base-blog-template/scripts/main.js';

// Add site-specific JavaScript
console.log('Site loaded');
```

**Principle:** Your content repository always wins over theme defaults.

### Optional Feature Bundles (Explicit Opt-In)

Instead of auto-generating bundles for every page, you explicitly opt-in to feature bundles via front matter:

**Single bundle:**

```yaml
---
title: My Post
pageBundle: code-highlighting
---
```

**Multiple bundles:**

```yaml
---
title: My Post
pageBundles:
  - code-highlighting
  - data-viz
---
```

**How it works:**

1. Set `pageBundle` or `pageBundles` in front matter
2. Create matching file: `overrides/bundles/code-highlighting.js`
3. The JS file imports its styles: `import '../styles/code-highlighting.scss'`
4. Vite auto-discovers all bundles in `overrides/bundles/` directory
5. Theme base layout loads bundles conditionally based on front matter

**Creating a new feature bundle:**

1. Create `overrides/bundles/mybundle.js`:

   ```js
   // Import bundle styles
   import '../styles/mybundle.scss';

   // Add bundle JavaScript
   console.log('My bundle loaded');
   ```

2. Create `overrides/styles/mybundle.scss`:

   ```scss
   // Bundle-specific styles
   .my-feature {
     color: blue;
   }
   ```

3. Add to page front matter:

   ```yaml
   ---
   pageBundle: mybundle
   ---
   ```

That's it! No build configuration needed. Vite auto-discovers the bundle.

### Build Pipeline

**Development mode (`npm run dev`):**

1. Eleventy builds templates from `content/` to `_site/`
2. Vite middleware serves files with HMR
3. SCSS compiled on-demand from `overrides/scripts/main.js` and feature bundles
4. Changes to content/templates/styles/scripts trigger hot reload

**Production build (`npm run build`):**

1. Theme's `getPageBundleEntries()` discovers all bundles from `overrides/bundles/*.js`
2. Eleventy builds templates to `_site/`
3. Vite builds all entry points with content hashing:
   - `main.js` → `main.[hash].js` (global bundle)
   - Feature bundles → `[name].[hash].js` (code-highlighting, etc.)
4. Vite `closeBundle` hook runs post-processing (theme utilities):
   - `purgeCSSFiles()` - Removes unused CSS from all bundles
   - `generateCriticalCSS()` - Optional, controlled via `.env`

**Build configuration (`.env`):**

```bash
# Critical CSS generation (optional, slower builds)
GENERATE_CRITICAL_CSS=false  # Set to 'true' to enable
```

### Eleventy Configuration

**Key settings (eleventy.config.mjs):**

- Input directory: `content` (flattened from `src/pages`)
- Output directory: `_site`
- Template formats: `md`, `njk` (both use Nunjucks templating)
- Includes/layouts: `../node_modules/eleventy-base-blog-template/layouts` (from theme package)
- Data files: `content/_data`

**Plugins:**

- `@11ty/eleventy-navigation` - Navigation helper
- `@11ty/eleventy-plugin-rss` - RSS feed generation
- `@11ty/eleventy-plugin-syntaxhighlight` - Prism syntax highlighting
- `@11ty/eleventy-plugin-vite` - Vite integration

**Theme integration:**

- `initTheme()` - Theme initialization helper (merges user filters/shortcodes with theme)
- `getThemeViteConfig()` - Vite configuration helper (from `eleventy-base-blog-template/config/vite`)
- Build utilities: `getPageBundleEntries()`, `purgeCSSFiles()`, `generateCriticalCSS()` (from theme package)

### Data Schema Validation

Front matter is validated using Zod schemas in `content/_data/eleventyDataSchema.js`. Currently validates:

- `draft: boolean | undefined` - Mark posts as drafts

### PostCSS Configuration

Located in `postcss.config.mjs`:

- `postcss-preset-env` - Modern CSS features (nesting, custom properties, custom media queries)
- `cssnano` - Minification (production only)

### Vite Entry Points

Entry points are auto-discovered by the theme's `getPageBundleEntries()` utility:

- `main.js` - Global entry point (`overrides/scripts/main.js`, loaded on all pages)
- Feature bundles - Auto-discovered from `overrides/bundles/*.js`

**Example discovered entries:**

```javascript
const entries = {
  main: 'overrides/scripts/main.js',
  'code-highlighting': 'overrides/bundles/code-highlighting.js',
};
```

Vite builds these into separate bundles with content hashing. The theme base layout conditionally loads bundles based on `pageBundle` or `pageBundles` front matter.

## Real-World Examples

### Example: Code Highlighting Bundle

**Page front matter:**

```yaml
---
title: My Post
pageBundle: code-highlighting
---
```

**Bundle JS (`overrides/bundles/code-highlighting.js`):**

```js
import '../styles/code-highlighting.scss';

function addCopyButtons() {
  document.querySelectorAll('pre[class*="language-"]').forEach((pre) => {
    const button = document.createElement('button');
    button.className = 'copy-button';
    button.textContent = 'Copy';
    // Copy functionality...
    pre.appendChild(button);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addCopyButtons);
} else {
  addCopyButtons();
}
```

**Bundle SCSS (`overrides/styles/code-highlighting.scss`):**

```scss
@use 'prism'; // Import Prism theme (from same directory)

pre[class*='language-'] {
  .copy-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    // Button styles...
  }
}
```

### Example: D3.js Data Visualization

**Page front matter:**

```yaml
---
title: Data Dashboard
pageBundles:
  - data-viz
  - charts
---
```

**Bundle JS (`overrides/bundles/data-viz.js`):**

```js
import * as d3 from 'd3';
import '../styles/data-viz.scss';

// D3 visualization code
const svg = d3.select('#chart').append('svg');
// ... D3 code
```

This keeps D3.js out of the main bundle and only loads it on pages that need it.

## Directory Structure

```text
eleventy-starter/
├── content/                    # Site content (flattened structure)
│   ├── posts/                 # Blog posts
│   │   ├── firstpost.md
│   │   ├── secondpost.md
│   │   └── ...
│   ├── index.njk              # Homepage
│   ├── blog.njk               # Blog index page
│   ├── about.md               # About page
│   └── _data/                 # Site data and schemas
│       ├── site.js
│       └── eleventyDataSchema.js
├── overrides/                  # Site-specific customizations
│   ├── layouts/               # Override theme layouts (optional)
│   │   └── base.njk          # (Example override)
│   ├── scripts/
│   │   └── main.js           # Entry point (imports theme)
│   ├── bundles/               # Optional feature bundles
│   │   └── code-highlighting.js
│   ├── styles/                # Custom styles
│   │   ├── code-highlighting.scss
│   │   └── custom.scss       # (Optional custom styles)
│   └── lib/                   # Custom filters/shortcodes
│       ├── filters.mjs        # Override/extend theme filters
│       └── shortcodes.mjs     # Override/extend theme shortcodes
├── public/                     # Static files (copied as-is to root)
│   ├── favicon.ico
│   └── robots.txt
├── scripts/                    # Deployment scripts
│   └── deploy.mjs
├── docs/                       # Documentation and migration guides
├── node_modules/
│   └── eleventy-base-blog-template/  # Theme package
│       ├── layouts/           # Theme templates
│       ├── lib/               # Theme filters/shortcodes/transforms
│       ├── styles/            # Theme SCSS
│       ├── scripts/           # Theme JavaScript
│       ├── utils/             # Build utilities
│       └── config/            # Configuration helpers
├── _site/                      # Build output (gitignored)
├── .11ty-vite/                # Vite temp folder (gitignored)
├── eleventy.config.mjs         # Eleventy configuration
├── postcss.config.mjs          # PostCSS configuration
└── package.json
```

**Key directories:**

- `content/` - Your site content (creates URL structure, flattened from `src/pages/`)
- `content/_data/` - Site data files (metadata, navigation, etc.)
- `overrides/` - All site-specific customizations in one place
- `overrides/scripts/main.js` - **Entry point that imports theme styles and scripts**
- `overrides/bundles/` - Optional feature bundles (code-highlighting, D3, etc.)
- `overrides/styles/` - Custom and bundle-specific styles
- `overrides/lib/` - Custom filters and shortcodes (extend or override theme)
- `overrides/layouts/` - Override theme layouts (optional, only if needed)
- `public/` - Static files copied as-is to site root
- `scripts/` - Standalone deployment and utility scripts
- `node_modules/eleventy-base-blog-template/` - Theme package (managed by npm)

## Git Workflow

Pre-commit hooks run via Husky:

- Lint-staged configured in `lint-staged.config.mjs`
- Runs format + lint on staged files before commit
