/**
 * Custom Filters
 *
 * The active theme's filters are auto-registered by the plugin BEFORE this
 * file. Entries returned here register afterwards with the same
 * `addFilter` calls, so:
 *
 *   - new keys add new filters
 *   - keys matching a theme filter SHADOW the theme's by name
 *
 * The active theme's filter inventory lives in
 * `node_modules/<theme-package>/lib/filters.mjs`. Read it before shadowing
 * — security-critical helpers like `escapeHtml`, `escapeAttr`,
 * `escapeCssValue`, `escapeJsString`, and `safeUrl` should usually be
 * extended rather than replaced.
 *
 * See `overrides/README.md` for the full override-cascade rules.
 */

export default {
	// Add your custom filters here, e.g.:
	// upper: (value) => String(value).toUpperCase(),
};
