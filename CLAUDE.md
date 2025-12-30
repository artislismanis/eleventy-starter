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

### Auto-Generated Page Bundles

The build system automatically generates page-specific CSS and JavaScript bundles based on template files. This happens via `eleventy.before` hook calling `generatePageStyles()`.

**How it works:**

1. **Template scanning:** All files in `src/pages/**/*.{njk,md,html}` are scanned
2. **Component detection:** Finds `data-component="name"` attributes in templates
3. **Code block detection:** Detects code blocks and conditionally includes Prism syntax highlighting
4. **File generation:** Creates three types of files for each page:
   - `_generated/*.components.scss` - Auto-generated component imports (overwritten each build)
   - `_custom/*.custom.scss` - Manual customizations (committed to git, preserved across builds)
   - `pages/*.scss` - Final merged SCSS that imports both above files

**File structure:**

```
src/assets/
├── styles/pages/
│   ├── _generated/           # Auto-generated, not committed
│   │   └── index.components.scss
│   ├── _custom/              # Manual overrides, committed to git
│   │   └── index.custom.scss
│   └── index.scss            # Final merge (auto-generated)
├── scripts/pages/
│   ├── _generated/           # Auto-generated base imports
│   │   └── index.base.js
│   ├── _custom/              # Custom page JS, committed to git
│   │   └── index.custom.js
│   └── index.js              # Final entry point (auto-generated)
```

**Adding page-specific styles/scripts:**

- Edit files in `_custom/` directories (these are preserved)
- DO NOT edit files in `_generated/` or root `pages/` directories (these are overwritten)

### Build Pipeline

**Development mode (`npm run dev`):**

1. `eleventy.before` hook → generates page-specific entry files
2. Vite serves files with HMR
3. SCSS compiled on-demand

**Production build (`npm run build`):**

1. `eleventy.before` hook → generates page-specific entry files
2. Vite builds all entry points with hashing
3. Vite `closeBundle` hook runs post-processing:
   - `purgeCSSFiles()` - Removes unused CSS
   - `removeEmptyCss()` - Deletes empty CSS files
   - `generateCriticalCSS()` - Generates inline critical CSS using Critters

### Eleventy Configuration

**Key settings (eleventy.config.mjs):**

- Input directory: `src/pages`
- Output directory: `_site`
- Template formats: `md`, `njk` (both use Nunjucks templating)
- Includes/layouts: `src/_includes`
- Data files: `src/_data`

**Plugins:**

- `@11ty/eleventy-navigation` - Navigation helper
- `@11ty/eleventy-plugin-rss` - RSS feed generation
- `@11ty/eleventy-plugin-syntaxhighlight` - Prism syntax highlighting
- `@11ty/eleventy-plugin-vite` - Vite integration

**Custom utilities:**

- `utils/filters.mjs` - Custom Nunjucks filters
- `utils/transforms.mjs` - HTML transforms
- `utils/shortcodes.mjs` - Custom shortcodes

### Data Schema Validation

Front matter is validated using Zod schemas in `src/_data/eleventyDataSchema.js`. Currently validates:

- `draft: boolean | undefined` - Mark posts as drafts

### PostCSS Configuration

Located in `postcss.config.mjs`:

- `postcss-preset-env` - Modern CSS features (nesting, custom properties, custom media queries)
- `cssnano` - Minification (production only)

### Vite Entry Points

Entry points are dynamically generated in `utils/generate-page-styles.mjs`:

- `main.js` - Global entry point (loaded on all pages)
- Page-specific entries - Generated from `src/assets/scripts/pages/_generated/*.js`

## Component System

Components are detected via `data-component="component-name"` attributes in templates. Component SCSS files live in `src/assets/styles/components/_*.scss`.

**Adding a new component:**

1. Create `src/assets/styles/components/_mycomponent.scss`
2. Add `data-component="mycomponent"` to template elements
3. Build will automatically import it for pages that use it

## Directory Structure Notes

- `src/pages/` - Page templates (becomes site structure)
- `src/_includes/` - Layouts and partials
- `src/_data/` - Global data files and schemas
- `src/assets/scripts/` - JavaScript source
- `src/assets/styles/` - SCSS source
- `utils/` - Build utilities (filters, transforms, shortcodes, CSS processing)
- `scripts/` - Standalone scripts (deployment)
- `public/` - Static files (copied as-is to output)
- `_site/` - Build output (not committed)
- `.11ty-vite/` - Vite temp folder (not committed)

## Git Workflow

Pre-commit hooks run via Husky:

- Lint-staged configured in `lint-staged.config.mjs`
- Runs format + lint on staged files before commit
