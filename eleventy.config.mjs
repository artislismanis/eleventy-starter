import markdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import EleventyPluginNavigation from '@11ty/eleventy-navigation';
import EleventyPluginRss from '@11ty/eleventy-plugin-rss';
import EleventyPluginSyntaxhighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import EleventyVitePlugin from '@11ty/eleventy-plugin-vite';
import path from 'path';
import { fileURLToPath } from 'url';

// Import from theme (will become npm package later)
import filters from './theme/lib/filters.mjs';
import transforms from './theme/lib/transforms.mjs';
import shortcodes from './theme/lib/shortcodes.mjs';

// Import page bundle discovery
import { getPageBundleEntries } from './utils/get-page-bundles.mjs';

// Import build utilities (keep only the ones we use)
import { purgeCSSFiles } from './utils/purge-css.mjs';
import { generateCriticalCSS } from './utils/generate-critical.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function (eleventyConfig) {
	// Plugins
	eleventyConfig.addPlugin(EleventyPluginNavigation);
	eleventyConfig.addPlugin(EleventyPluginRss);
	eleventyConfig.addPlugin(EleventyPluginSyntaxhighlight);
	eleventyConfig.addPlugin(EleventyVitePlugin, {
		tempFolderName: '.11ty-vite', // Default name of the temp folder

		// Vite options (equal to vite.config.js inside project root)
		viteOptions: {
			publicDir: 'public',
			clearScreen: false,
			server: {
				mode: 'development',
				middlewareMode: true,
				watch: {
					usePolling: true,
					interval: 100,
					ignored: ['**/_site/**', '**/node_modules/**'],
				},
				hmr: { overlay: true },
			},
			appType: 'custom',

			plugins: [
				{
					name: 'css-post-build',
					apply: 'build',
					async closeBundle() {
						// Always run PurgeCSS
						await purgeCSSFiles();

						// Critical CSS is opt-in via environment variable
						if (process.env.GENERATE_CRITICAL_CSS === 'true') {
							await generateCriticalCSS();
						}
					},
				},
			],
			build: {
				mode: 'production',
				sourcemap: 'hidden',
				manifest: true,

				rollupOptions: {
					// Auto-discover bundles (main + any page bundles)
					input: getPageBundleEntries(),
					output: {
						entryFileNames: 'assets/js/[name].[hash].js',
						chunkFileNames: 'assets/js/[name].[hash].js',
						assetFileNames: ({ name }) => {
							if (/\.(css)$/.test(name ?? '')) {
								return 'assets/css/[name].[hash][extname]';
							}
							if (/\.(woff|woff2|eot|ttf|otf)$/.test(name ?? '')) {
								return 'assets/fonts/[name].[hash][extname]';
							}
							if (/\.(png|jpe?g|svg|gif|webp|avif)$/.test(name ?? '')) {
								return 'assets/images/[name].[hash][extname]';
							}
							return 'assets/[name].[hash][extname]';
						},
					},
				},
				cssCodeSplit: true,
			},
			css: {
				devSourcemap: true,
				preprocessorOptions: {
					scss: {
						api: 'modern-compiler',
						// Allow imports from theme and site assets
						includePaths: [
							path.resolve(__dirname, 'theme/styles'),
							path.resolve(__dirname, 'src/assets/styles'),
						],
					},
				},
			},
		},
	});

	// Watch source folders
	eleventyConfig.addWatchTarget('./src/**/*.*');
	eleventyConfig.addWatchTarget('./theme/**/*.*');
	eleventyConfig.addWatchTarget('./utils/**/*.*');
	eleventyConfig.addWatchTarget('./*.*');

	eleventyConfig.setChokidarConfig({
		usePolling: true,
		interval: 100,
	});

	// Filters
	Object.keys(filters).forEach((filterName) => {
		eleventyConfig.addFilter(filterName, filters[filterName]);
	});

	// Transforms
	Object.keys(transforms).forEach((transformName) => {
		eleventyConfig.addTransform(transformName, transforms[transformName]);
	});

	// Shortcodes
	Object.keys(shortcodes).forEach((shortcodeName) => {
		eleventyConfig.addShortcode(shortcodeName, shortcodes[shortcodeName]);
	});

	// Customize Markdown library and settings:
	let markdownLibrary = markdownIt({
		html: true,
		breaks: true,
		linkify: true,
	}).use(markdownItAnchor, {
		level: 2,
		permalink: markdownItAnchor.permalink.linkAfterHeader({
			style: 'visually-hidden',
			assistiveText: (title) => `Permalink to “${title}”`,
			visuallyHiddenClass: 'visually-hidden',
			wrapper: ['<div class="heading-wrapper">', '</div>'],
		}),
		slugify: eleventyConfig.getFilter('slugify'),
	});
	eleventyConfig.setLibrary('md', markdownLibrary);

	// Layouts (from theme)
	eleventyConfig.addLayoutAlias('base', 'base.njk');
	eleventyConfig.addLayoutAlias('post', 'post.njk');
	eleventyConfig.addLayoutAlias('home', 'home.njk');

	// File passthrough config
	eleventyConfig.setServerPassthroughCopyBehavior('copy');
	eleventyConfig.addPassthroughCopy({ './src/assets/': '/assets/' });
	eleventyConfig.addPassthroughCopy({ './src/feed/': '/feed/' });
	eleventyConfig.addPassthroughCopy({ './public/': '/' });

	return {
		templateFormats: ['md', 'njk'],
		htmlTemplateEngine: 'njk',
		markdownTemplateEngine: 'njk',
		passthroughFileCopy: true,
		dir: {
			input: 'src/pages',
			output: '_site',
			includes: '../../theme/layouts', // From theme
			layouts: '../../theme/layouts', // From theme
			data: '../_data',
		},
	};
}
