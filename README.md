# Eleventy Starter

A scaffolding for building static websites with [Eleventy](https://www.11ty.dev/) and the `@eleventy-plugin-themer` framework.

The starter showcases integration patterns; the plugin is treated as a black box. For framework internals (cascade resolution, override discovery, security model), see the plugin's own `README.md` / `CLAUDE.md`.

## Getting Started

```bash
npm install
npm run dev     # Development server
npm run build   # Production build
```

## Scripts

| Command              | Description                                                 |
| -------------------- | ----------------------------------------------------------- |
| `npm run dev`        | Start development server with hot reload                    |
| `npm run build`      | Clean and build for production                              |
| `npm run serve`      | Serve the built `_site` directory                           |
| `npm run lint`       | Run all linters (Prettier, ESLint, Stylelint, markdownlint) |
| `npm run lighthouse` | Run Lighthouse audit on the built site                      |
| `npm run deploy`     | Deploy to AWS (S3 + Amplify)                                |

## Project Structure

```text
content/           # Site content (pages, posts, data)
  _data/           # Global data files (site.js, theme.js, build.js)
  posts/           # Blog posts
overrides/         # Theme overrides
  layouts/         # Custom layout overrides
  styles/          # Custom SCSS overrides
  scripts/         # Custom JS overrides
  features/        # Custom feature overrides
  lib/             # User filters and shortcodes
public/            # Static assets (copied as-is)
```

## Customizing PurgeCSS Safelist

The production build runs PurgeCSS to remove unused CSS. The safelist (patterns preserved from purging) merges from three layers:

1. **Build plugin defaults** -- generic state class patterns (`is-*`, `has-*`, `js-*`, `page-*`)
2. **Theme** -- declared in the theme's `theme.json` under `build.purgeCSS.safelist`
3. **Site config** -- declared in `eleventy.config.mjs` (this repo)

If you add a feature that uses CSS selectors applied dynamically via JavaScript (not present in the static HTML), you need to safelist those patterns. Pass an object to `purgeCSS` instead of `true`:

```js
// eleventy.config.mjs
await eleventyConfig.addPlugin(eleventyPluginThemerVite, {
  theme: THEME_NAME,
  projectRoot: __dirname,
  optimizations: {
    purgeCSS: {
      safelist: {
        deep: [/my-custom-widget/], // Preserve selectors containing this pattern
        standard: [/^widget-/], // Preserve classes starting with "widget-"
      },
    },
    criticalCSS: true,
    minifyHTML: true,
    validateLinks: true,
    preserveNonHtml: {
      extensions: ['xml', 'txt', 'xsl'],
    },
  },
});
```

The safelist supports three types of patterns (matching [PurgeCSS safelist options](https://purgecss.com/safelisting.html)):

- **`standard`** -- classes matching these patterns are preserved
- **`deep`** -- entire CSS rules are preserved if the selector contains a match
- **`greedy`** -- like `deep` but also preserves child selectors
