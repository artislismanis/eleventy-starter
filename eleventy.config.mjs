import path from 'path';
import { fileURLToPath } from 'url';

import 'dotenv/config'; // Load environment variables from .env
import markdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import { HtmlBasePlugin, InputPathToUrlTransformPlugin } from '@11ty/eleventy';
import EleventyPluginNavigation from '@11ty/eleventy-navigation';
import { feedPlugin } from '@11ty/eleventy-plugin-rss';
import EleventyPluginSyntaxhighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import EleventyVitePlugin from '@11ty/eleventy-plugin-vite';
import { eleventyImageTransformPlugin } from '@11ty/eleventy-img';
// Theme v3 imports - monorepo packages
import {
	plugin as baseBlogTheme,
	metadata as themeMetadata,
} from '@eleventy-themes/base-blog';
import {
	createThemeViteConfig,
	getFeatureEntries,
} from '@eleventy-themes/vite';
import { generateDirConfig } from '@eleventy-themes/core';

// User overrides
import userFilters from './overrides/lib/filters.mjs';
import userShortcodes from './overrides/lib/shortcodes.mjs';
// Site metadata
import siteData from './content/_data/site.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function (eleventyConfig) {
	// Draft preprocessor: exclude draft posts in production builds
	// See also: content/_data/eleventyDataSchema.js for draft field validation
	eleventyConfig.addPreprocessor('drafts', '*', (data) => {
		if (data.draft) {
			data.title = `${data.title} (draft)`;
		}

		// Exclude drafts from production builds
		if (data.draft && process.env.ELEVENTY_RUN_MODE === 'build') {
			return false;
		}
	});

	// Initialize theme (v3 API)
	eleventyConfig.addPlugin(baseBlogTheme, {
		projectRoot: __dirname,
	});

	// Add user filters and shortcodes
	Object.keys(userFilters).forEach((name) => {
		eleventyConfig.addFilter(name, userFilters[name]);
	});
	Object.keys(userShortcodes).forEach((name) => {
		eleventyConfig.addShortcode(name, userShortcodes[name]);
	});

	// Plugins
	eleventyConfig.addPlugin(EleventyPluginNavigation);
	eleventyConfig.addPlugin(EleventyPluginSyntaxhighlight);
	eleventyConfig.addPlugin(HtmlBasePlugin);
	eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

	// RSS/Atom feed: https://www.11ty.dev/docs/plugins/rss/
	eleventyConfig.addPlugin(feedPlugin, {
		type: 'atom', // or "rss", "json"
		outputPath: '/feed.xml',
		stylesheet: 'feed/pretty-atom-feed.xsl',
		collection: {
			name: 'posts',
			limit: 10,
		},
		metadata: {
			language: siteData.language,
			title: siteData.title,
			subtitle: siteData.description,
			base: siteData.url,
			author: {
				name: siteData.author.name,
				email: siteData.author.email,
			},
		},
	});

	// Image optimization - https://www.11ty.dev/docs/plugins/image/#eleventy-transform
	eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
		formats: ['avif', 'webp', 'auto'],
		// widths: ['auto'], // Uncomment to generate multiple widths
		failOnError: false,
		htmlOptions: {
			imgAttributes: {
				loading: 'lazy',
				decoding: 'async',
			},
		},
		sharpOptions: {
			animated: true,
		},
	});

	// Vite integrations with theme optimizations
	eleventyConfig.addPlugin(EleventyVitePlugin, {
		tempFolderName: '.11ty-vite',
		viteOptions: createThemeViteConfig(themeMetadata, {
			projectRoot: __dirname,
			optimizations: {
				purgeCSS: false,
				criticalCSS: false,
				minifyHTML: false,
				validateLinks: false,
				preserveNonHtml: true,
			},
			dirs: {
				temp: '.11ty-vite',
				output: '_site',
			},
			assetsInclude: ['**/*.xml', '**/*.txt', '**/*.xsl'],
			publicDir: 'public',
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
			resolve: {
				alias: {
					// Add alias for the HTML script references
					'/assets/scripts/main.js': path.resolve(
						__dirname,
						'overrides/scripts/main.js',
					),
					'/assets/scripts/features': path.resolve(
						__dirname,
						'overrides/features',
					),
				},
			},
			build: {
				mode: 'production',
				sourcemap: 'hidden',
				manifest: true,
				emptyOutDir: false,
				rollupOptions: {
					// Entry points: main + all discovered features
					input: getFeatureEntries(
						__dirname,
						themeMetadata.name,
						themeMetadata,
					),
					output: {
						entryFileNames: (chunkInfo) => {
							if (chunkInfo.name === 'main') {
								return 'assets/scripts/[name].[hash].js';
							}
							// Entry names like /code-highlighting.js -> code-highlighting.[hash].js
							const cleanName = chunkInfo.name
								.replace(/^\//, '')
								.replace(/\.js$/, '');
							return `assets/scripts/${cleanName}.[hash].js`;
						},
						chunkFileNames: 'assets/scripts/chunks/[name].[hash].js',
						assetFileNames: ({ name }) => {
							if (/\.(xml|txt|xsl)$/.test(name ?? '')) {
								return '[name][extname]';
							}
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
		}),
	});

	// Watch source folders
	eleventyConfig.addWatchTarget('./content/**/*.*');
	eleventyConfig.addWatchTarget('./overrides/**/*.*');
	eleventyConfig.addWatchTarget('./public/**/*.*');
	// Watch root-level config files (eleventy.config.mjs, postcss.config.mjs, etc.)
	eleventyConfig.addWatchTarget('./*.{mjs,js}');

	eleventyConfig.setChokidarConfig({
		usePolling: true,
		interval: 100,
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
			assistiveText: (title) => `Permalink to "${title}"`,
			visuallyHiddenClass: 'visually-hidden',
			wrapper: ['<div class="heading-wrapper">', '</div>'],
		}),
		slugify: eleventyConfig.getFilter('slugify'),
	});
	eleventyConfig.setLibrary('md', markdownLibrary);

	// Additional passthrough copy for content/feed
	eleventyConfig.setServerPassthroughCopyBehavior('copy');
	eleventyConfig.addPassthroughCopy('./content/feed/pretty-atom-feed.xsl');

	return {
		templateFormats: ['md', 'njk'],
		htmlTemplateEngine: 'njk',
		markdownTemplateEngine: 'njk',
		passthroughFileCopy: true,
		// Use theme's dir configuration with cascade support
		...generateDirConfig(themeMetadata, { projectRoot: __dirname }),
	};
}
