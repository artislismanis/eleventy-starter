# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Eleventy (11ty) static site generator project using the `@eleventy-plugin-themer` framework. The framework provides:

- **Cascade override system** - User customizations always win over theme defaults
- **Feature bundles** - Per-page JavaScript/CSS loaded only when needed
- **Dark/light mode** - Configurable theme toggle with system preference support
- **Navigation** - Uses `@11ty/eleventy-navigation` for all menus

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
npm run lint:js          # ESLint
npm run lint:css         # Stylelint for SCSS files
npm run lint:md          # Markdownlint
```

### Deployment

```bash
npm run deploy           # Deploy to S3 + trigger Amplify (main branch only)
npm run deploy:dry       # Dry-run deployment (shows changes without executing)
npm run deploy:force     # Force deploy from any branch
```

## Architecture

### Theme Framework

This project uses the `@eleventy-plugin-themer` framework consisting of:

- `@eleventy-plugin-themer/core` - Cascade system, template engine, validation
- `@eleventy-plugin-themer/build-vite` - Vite integration and optimizations
- `@eleventy-plugin-themer/theme-base` - Base blog theme with layouts and styles

### Directory Structure

```text
eleventy-starter/
├── content/                    # Site content
│   ├── posts/                 # Blog posts
│   ├── index.njk              # Homepage
│   ├── blog.njk               # Blog index
│   ├── privacy.njk            # Footer navigation page
│   └── _data/                 # Site data
│       ├── site.js            # Site metadata
│       ├── theme.js           # Theme configuration overrides
│       └── eleventyDataSchema.js
├── overrides/                  # Site-specific customizations
│   ├── layouts/               # Override theme layouts
│   ├── features/              # Custom features
│   ├── scripts/
│   │   └── main.js           # Entry point
│   ├── styles/                # Custom styles
│   └── lib/                   # Custom filters/shortcodes
├── public/                     # Static files
├── eleventy.config.mjs         # Eleventy configuration
└── package.json
```

### Cascade Override System

User customizations always win over theme defaults:

1. **Layouts**: `overrides/layouts/base.njk` overrides theme's `base.njk`
2. **Features**: `overrides/features/code-highlighting/` overrides theme feature
3. **Styles**: Import theme styles and override CSS custom properties
4. **Filters/Shortcodes**: Define in `overrides/lib/` to override theme helpers

### Theme Configuration

Configure the theme in `content/_data/theme.js`:

```javascript
export default {
  // Dark/light mode toggle
  themeToggle: {
    defaultTheme: 'auto', // 'auto', 'light', or 'dark'
    showToggle: true, // Show toggle button in header
  },

  // Override colors
  colors: {
    light: { primary: '#ff6b6b' },
    dark: { primary: '#4ecdc4' },
  },

  // Footer configuration
  footer: {
    copyright: '© {year} My Site',
    showPoweredBy: true,
  },
};
```

### Navigation

Uses `@11ty/eleventy-navigation` plugin for all navigation:

**Header navigation** - Add to page front matter:

```yaml
eleventyNavigation:
  key: About
  order: 2
```

**Footer navigation** - Add with `parent: footer`:

```yaml
eleventyNavigation:
  key: Privacy Policy
  parent: footer
  order: 1
```

**Breadcrumbs** - Automatically rendered for pages with hierarchical navigation.

### Features (Per-Page Bundles)

Load JavaScript/CSS only on pages that need it:

```yaml
---
title: My Post
features:
  - code-highlighting
---
```

Create custom features in `overrides/features/{name}/index.js`.

### Shortcodes

Available paired shortcodes for layouts:

**Hero Section:**

```nunjucks
{% hero title="Welcome", subtitle="Build great sites" %}
  {% heroButton url="/start", variant="primary" %}Get Started{% endheroButton %}
{% endhero %}
```

**Content Grid with Boxes:**

```nunjucks
{% contentGrid cols=3 %}
  {% box title="Feature 1", link="/about" %}Description{% endbox %}
  {% box title="Feature 2" %}Another box{% endbox %}
{% endcontentGrid %}
```

### Build Optimizations

Production builds include:

- **PurgeCSS** - Remove unused CSS
- **Critical CSS** - Inline above-the-fold styles
- **HTML Minification** - Compress output
- **Link Validation** - Check for broken links

Configure in `eleventy.config.mjs`:

```text
optimizations: {
  purgeCSS: true,
  criticalCSS: true,
  minifyHTML: true,
  validateLinks: true,
}
```

## Key Files

| File                           | Purpose                         |
| ------------------------------ | ------------------------------- |
| `eleventy.config.mjs`          | Eleventy and Vite configuration |
| `content/_data/theme.js`       | Theme customization             |
| `content/_data/site.js`        | Site metadata                   |
| `overrides/scripts/main.js`    | JavaScript entry point          |
| `overrides/lib/filters.mjs`    | Custom Nunjucks filters         |
| `overrides/lib/shortcodes.mjs` | Custom shortcodes               |

## Plugins

- `@11ty/eleventy-navigation` - Navigation menus and breadcrumbs
- `@11ty/eleventy-plugin-rss` - RSS/Atom feed generation
- `@11ty/eleventy-plugin-syntaxhighlight` - Prism code highlighting
- `@11ty/eleventy-plugin-vite` - Vite integration

## Git Workflow

Pre-commit hooks via Husky run lint-staged on changed files.
