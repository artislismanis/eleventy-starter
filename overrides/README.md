# Overrides

Theme-shaped customisations. Files placed here win over the theme's defaults via the framework's cascade. Empty directories are intentional scaffolding — drop a file in to override.

| Directory   | Purpose                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `layouts/`  | Override theme layouts by filename (e.g. `layouts/post.njk` shadows the theme's).                      |
| `styles/`   | Override or extend theme styles.                                                                       |
| `scripts/`  | Entry point for client JS (`scripts/main.js`) and project-specific scripts.                            |
| `features/` | Override or add JavaScript features. Each feature is a subdirectory with `index.js` / `index.auto.js`. |
| `lib/`      | Auto-discovered: `filters.mjs` and `shortcodes.mjs` default exports are registered with Eleventy.      |
