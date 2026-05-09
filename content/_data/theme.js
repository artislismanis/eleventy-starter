/**
 * Theme Configuration Overrides
 *
 * This file overrides the theme's default configuration.
 * Only include values you want to change from the theme defaults.
 *
 * Available sections:
 * - themeToggle: Dark/light mode toggle settings
 * - colors.light / colors.dark: Color palettes for light and dark themes
 * - typography: Font families, sizes, line heights
 * - logos: Paths to logo images
 * - social: Array of social media links
 * - analytics: Analytics service IDs
 * - codeHighlighting: PrismJS theme and diff-highlight settings
 * - features: Feature toggles (search, comments, etc.)
 * - navigation: Navigation settings
 * - footer: Footer configuration
 *
 * @see theme.json in the theme package for all available options
 */

export default {
	/**
	 * Theme Toggle Configuration
	 *
	 * Controls the dark/light mode behavior:
	 *
	 * @property {string} defaultTheme - Initial theme mode:
	 *   - 'auto': Use system preference (prefers-color-scheme)
	 *   - 'light': Always start in light mode
	 *   - 'dark': Always start in dark mode
	 *
	 * @property {boolean} showToggle - Whether to show the toggle button:
	 *   - true: Show toggle button in header (users can switch manually)
	 *   - false: Hide toggle button (theme follows defaultTheme/system only)
	 *
	 * Note: showToggle and defaultTheme are independent settings.
	 * Example combinations:
	 *   - defaultTheme: 'auto', showToggle: true  → Respects system, user can override
	 *   - defaultTheme: 'dark', showToggle: true  → Starts dark, user can switch to light
	 *   - defaultTheme: 'light', showToggle: false → Always light, no toggle shown
	 *   - defaultTheme: 'auto', showToggle: false → Follows system, no manual override
	 */
	themeToggle: {
		defaultTheme: 'auto',
		showToggle: true,
	},

	// Social links
	social: [
		{
			platform: 'github',
			url: 'https://github.com/artislismanis',
			label: 'GitHub',
		},
	],

	// Footer configuration
	footer: {
		copyright: ' © {year} Eleventy Starter',
		startYear: 2024,
		showPoweredBy: true,
		showGitSha: true,
		gitHubRepo: 'https://github.com/artislismanis/eleventy-starter',
	},
};
