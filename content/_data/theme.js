/**
 * Theme Configuration Overrides
 *
 * This file overrides the active theme's default configuration.
 * Only include the values you want to change — anything you omit falls back
 * to the theme's defaults declared in its `theme.json`.
 *
 * Top-level keys are validated **strictly** against the theme's defaults at
 * build time, so a typo here fails fast with a helpful error pointing at the
 * exact key (and the list of valid keys for the active theme).
 *
 * @see node_modules/@eleventy-plugin-themer/theme-base/theme.json
 *      for all the keys and shapes the active theme supports.
 *
 * @type {import('@eleventy-plugin-themer/core/types').ThemeUserConfig}
 */
export default {
	// --- Theme toggle ---------------------------------------------------------
	// Controls dark/light mode behaviour. `defaultTheme` is the initial mode
	// before any user preference; `showToggle` controls whether the header
	// button is rendered.
	themeToggle: {
		defaultTheme: 'auto', // 'auto' | 'light' | 'dark'
		showToggle: true,
	},

	// --- Social links ---------------------------------------------------------
	// Each entry is rendered via the `socialUrl()` filter, which validates the
	// URL protocol (only http/https/mailto/tel/relative are allowed).
	social: [
		{
			platform: 'github',
			url: 'https://github.com/artislismanis',
			label: 'GitHub',
		},
	],

	// --- Footer ---------------------------------------------------------------
	footer: {
		copyright: ' © {year} Eleventy Starter',
		startYear: 2024,
		showPoweredBy: true,
		showGitSha: true,
		gitHubRepo: 'https://github.com/artislismanis/eleventy-starter',
	},

	// --- Other commonly-overridden sections (uncomment to use) ---------------
	//
	// colors: {
	//   light: { primary: '#172c51', accent: '#ca7033' },
	//   dark:  { primary: '#5b9bd5', accent: '#ca7033' },
	// },
	//
	// typography: {
	//   fontFamily: 'system-ui, sans-serif',
	//   fontFamilyHeading: 'inherit',
	// },
	//
	// analytics: {
	//   googleAnalytics: '',  // e.g. 'G-XXXXXXXXXX'
	//   plausible: '',
	// },
	//
	// codeHighlighting: {
	//   prismTheme: 'prism-tomorrow',
	//   diffHighlight: true,
	// },
	//
	// navigation: {
	//   showHomeLink: true,
	//   pagination: { enabled: true, pageSize: 10 },
	// },
};
