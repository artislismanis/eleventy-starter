import { globSync } from 'glob';
import path from 'path';

/**
 * Auto-discover page bundles from src/assets/scripts/pages/ directory
 *
 * Returns Vite entry points for:
 * - main.js (global bundle - always included)
 * - page bundles (discovered from pages/*.js files)
 *
 * Usage in eleventy.config.mjs:
 *   import { getPageBundleEntries } from './utils/get-page-bundles.mjs';
 *
 *   build: {
 *     rollupOptions: {
 *       input: getPageBundleEntries(),
 *     }
 *   }
 */
export function getPageBundleEntries() {
	const entries = {
		// Main bundle - always included
		main: path.resolve(process.cwd(), 'theme/scripts/main.js'),
	};

	// Discover page bundles from src/assets/scripts/pages/*.js
	// Excludes subdirectories like _custom and _generated
	const pageBundles = globSync('src/assets/scripts/pages/*.js');

	pageBundles.forEach((file) => {
		const name = path.basename(file, '.js');
		entries[name] = path.resolve(process.cwd(), file);
	});

	if (Object.keys(entries).length > 1) {
		console.log('📦 Discovered page bundles:', Object.keys(entries).filter(k => k !== 'main').join(', '));
	}

	return entries;
}
