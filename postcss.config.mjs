/**
 * PostCSS config — defers to the active theme's declared plugins via the
 * `build.postcss.plugins` block in its `theme.json`.
 *
 * Append project-specific plugins to `userPlugins` if needed; they run after
 * the theme defaults (PostCSS evaluates plugins in declaration order).
 */
import path from 'path';
import { fileURLToPath } from 'url';

import { resolveThemeMetadata } from '@eleventy-plugin-themer/core';
import { createPostcssConfig } from '@eleventy-plugin-themer/build-vite/postcss';

import { THEME_NAME } from './theme.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themeMetadata = resolveThemeMetadata(__dirname, THEME_NAME);

export default await createPostcssConfig({
	themeMetadata,
	projectRoot: __dirname,
	userPlugins: [],
});
