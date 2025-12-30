import markdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import EleventyPluginNavigation from '@11ty/eleventy-navigation';
import EleventyPluginRss from '@11ty/eleventy-plugin-rss';
import EleventyPluginSyntaxhighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import EleventyVitePlugin from '@11ty/eleventy-plugin-vite';

import filters from './utils/filters.mjs';
import transforms from './utils/transforms.mjs';
import shortcodes from './utils/shortcodes.mjs';
import {
	generatePageStyles,
	getDynamicEntries,
} from './utils/generate-page-styles.mjs';
import { generateCriticalCSS } from './utils/generate-critical.mjs';
import { purgeCSSFiles } from './utils/purge-css.mjs';
import { removeEmptyCss } from './utils/remove-empty-css.mjs';

export default function (eleventyConfig) {
	// Build hooks
	// Before build: Generate page-specific SCSS and JS entry points
	eleventyConfig.on('eleventy.before', async () => {
		console.log('Generating page styles...\n');
		await generatePageStyles();
	});

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
						await purgeCSSFiles();
						await removeEmptyCss();
						await generateCriticalCSS();
					},
				},
			],
			build: {
				mode: 'production',
				sourcemap: 'hidden',
				manifest: true,

				rollupOptions: {
					input: getDynamicEntries(),
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
					},
				},
			},
		},
	});

	// Watch source folder
	eleventyConfig.addWatchTarget('./src/**/*.*');
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

	// Layouts
	eleventyConfig.addLayoutAlias('base', 'base.njk');
	eleventyConfig.addLayoutAlias('post', 'post.njk');

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
			includes: '../_includes',
			layouts: '../_includes',
			data: '../_data',
		},
	};
}
