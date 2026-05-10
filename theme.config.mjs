/**
 * Theme configuration entry point for this starter.
 *
 * Single source of truth for theme-level constants shared across the build
 * (Eleventy, Vite, PostCSS, tests) — so a value lives in exactly one place.
 *
 * For *content overrides* (colors, social links, footer, analytics, etc.)
 * edit `content/_data/theme.js`. Top-level keys there are validated against
 * the active theme's defaults (`theme.json#config`) at build time.
 *
 * For *code overrides* (filters, shortcodes, layouts, features, styles,
 * scripts) see the `overrides/` directory and `overrides/README.md`.
 */

/**
 * Active theme package. Resolved via Node's module resolution; must be a
 * runtime dependency in `package.json`.
 */
export const THEME_NAME = '@eleventy-plugin-themer/theme-base';

/**
 * Eleventy input directory (relative to project root).
 */
export const INPUT_DIR = 'content';

/**
 * Eleventy output directory (relative to project root).
 */
export const OUTPUT_DIR = '_site';

/* -------------------------------------------------------------------------
 * Where to override what
 * -------------------------------------------------------------------------
 *
 * Theme config (data overrides — colors, copy, toggles):
 *   content/_data/theme.js
 *   - Strict-key validation against the active theme's defaults; typos fail
 *     the build with the list of valid keys.
 *
 * Layouts (Nunjucks templates):
 *   overrides/layouts/<name>.njk
 *   - A file matching a theme layout name takes precedence (cascade).
 *
 * Filters / shortcodes (additions or by-name shadowing of theme defaults):
 *   overrides/lib/filters.mjs
 *   overrides/lib/shortcodes.mjs
 *   - Theme defaults register first; entries here register after with the
 *     same `addFilter`/`addShortcode` calls, so same-name entries win.
 *
 * Features (auto-init JS modules; replace a theme feature by name):
 *   overrides/features/<name>/index.auto.js   (preferred — auto-init)
 *   overrides/features/<name>/index.js
 *
 * Styles (SCSS partials picked up by the theme cascade):
 *   overrides/styles/...
 *
 * Scripts entry (browser bundle):
 *   overrides/scripts/main.js
 *
 * Static assets (favicon, social images, robots.txt):
 *   public/
 * -------------------------------------------------------------------------
 */
