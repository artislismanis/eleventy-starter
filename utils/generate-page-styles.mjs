import fs from 'fs/promises';
import path from 'path';

import { globSync } from 'glob';

/**
 * Check if content contains code blocks
 * NEW FUNCTION - Added for Prism detection
 */
function hasCodeBlocks(content) {
	const codePatterns = [
		/<pre[^>]*>/i, // <pre> tags
		/<code[^>]*class="language-/i, // Prism format: class="language-js"
		/<code[^>]*class="[^"]*hljs/i, // Highlight.js format (if you switch)
		/```[\s\S]*?```/m, // Markdown code fences
		/^ {4}/m, // Markdown indented code blocks
	];

	return codePatterns.some((pattern) => pattern.test(content));
}

/**
 * Generates page-specific SCSS and JS entry files
 *
 * File Strategy:
 * - Auto-generated files can be excluded from version control
 * - Manual override files (.custom.scss/.custom.js) are committed
 * - Final output merges both
 *
 * MODIFIED - Now detects code blocks and conditionally includes Prism
 */
export async function generatePageStyles() {
	const templates = globSync('src/pages/**/*.{njk,md,html}');
	const components = await getComponentRegistry();

	for (const templatePath of templates) {
		const slug = getSlug(templatePath);
		const content = await fs.readFile(templatePath, 'utf-8');
		const usedComponents = extractComponents(content);
		const hasCode = hasCodeBlocks(content); // NEW - Detect code blocks

		// Log what was detected - MODIFIED
		console.log(
			`📄 ${slug}: ${usedComponents.size} components ${hasCode ? ' + code blocks' : ''}`,
		);

		// === SCSS FILES ===

		// Generate component imports file (auto-generated) - MODIFIED to include hasCode
		const componentsSCSS = generateComponentImports(
			slug,
			usedComponents,
			components,
			hasCode,
		);
		await fs.mkdir('src/assets/styles/pages/_generated', { recursive: true });
		await fs.writeFile(
			`src/assets/styles/pages/_generated/${slug}.components.scss`,
			componentsSCSS,
		);

		// Create or check for custom styles file (manual)
		await ensureCustomSCSSFile(slug);

		// Generate final SCSS that merges both (auto-generated)
		const finalSCSS = generateFinalSCSS(slug);
		await fs.mkdir('src/assets/styles/pages', { recursive: true });
		await fs.writeFile(`src/assets/styles/pages/${slug}.scss`, finalSCSS);

		// === JAVASCRIPT FILES ===

		// Generate base JS imports file (auto-generated)
		const baseJS = generateBaseJS(slug);
		await fs.mkdir('src/assets/scripts/pages/_generated', { recursive: true });
		await fs.writeFile(
			`src/assets/scripts/pages/_generated/${slug}.base.js`,
			baseJS,
		);

		// Create or check for custom JS file (manual)
		await ensureCustomJSFile(slug);

		// Generate final JS entry that merges both (auto-generated)
		const finalJS = generateFinalJS(slug);
		await fs.writeFile(`src/assets/scripts/pages/${slug}.js`, finalJS);
	}

	// Ensure main.js exists
	await ensureMainJS();

	console.log(`✓ Generated ${templates.length} page bundles\n`);
	console.log('📝 To customize page styles: src/assets/styles/pages/_custom/');
	console.log('📝 To add page JavaScript: src/assets/scripts/pages/_custom/\n');
}

/**
 * Returns entry points for Vite
 */
export function getDynamicEntries() {
	const entries = {};

	// Main entry point
	entries.main = path.resolve(process.cwd(), 'src/assets/scripts/main.js');

	// All generated page entry points
	globSync('src/assets/scripts/pages/_generated/*.js').forEach((file) => {
		// Only include final merged files, not .base.js files
		if (!file.endsWith('.base.js')) {
			const name = path.basename(file, '.js');
			entries[name] = path.resolve(process.cwd(), file);
		}
	});

	return entries;
}

/**
 * Ensure custom styles file exists
 */
async function ensureCustomSCSSFile(slug) {
	const customPath = `src/assets/styles/pages/_custom/${slug}.custom.scss`;

	try {
		await fs.access(customPath);
	} catch {
		const content = `// Custom styles for ${slug} page
// This file is committed to version control
// Add page-specific customizations here


.page-${slug} {
  // Custom page styles
}
`;
		await fs.mkdir(path.dirname(customPath), { recursive: true });
		await fs.writeFile(customPath, content);
	}
}

/**
 * Ensure custom JavaScript file exists
 */
async function ensureCustomJSFile(slug) {
	const customPath = `src/assets/scripts/pages/_custom/${slug}.custom.js`;

	try {
		await fs.access(customPath);
	} catch {
		const content = `// Custom JavaScript for ${slug} page
// This file is committed to version control
// Add page-specific JavaScript here
`;
		await fs.mkdir(path.dirname(customPath), { recursive: true });
		await fs.writeFile(customPath, content);
	}
}

/**
 * Generate component imports file (SCSS)
 * MODIFIED - Added hasCode parameter and conditional Prism import
 */
function generateComponentImports(slug, usedComponents, registry, hasCode) {
	const list = Array.from(usedComponents).sort();

	let scss = `// AUTO-GENERATED - Do not edit manually
// Generated: ${new Date().toISOString()}
// Components detected: ${list.join(', ') || 'none'}
${hasCode ? '// Code highlighting: enabled' : ''}

// This file is regenerated on every build
// Add custom styles to: _custom/${slug}.custom.scss


`;

	// Import only used components
	if (list.length > 0) {
		list.forEach((component) => {
			if (registry.has(component)) {
				scss += `@use '../../components/${component}';\n`;
			}
		});
	} else {
		scss += `// No components detected on this page\n`;
	}

	// NEW - Add Prism if code blocks detected
	if (hasCode) {
		scss += `\n// Code highlighting\n`;
		scss += `@use '../../vendor/prism';\n`;
	}

	return scss;
}

/**
 * Generate final SCSS that merges auto-generated and custom files
 */
function generateFinalSCSS(slug) {
	// Create valid SCSS identifier for namespace
	const namespace = slug.match(/^\d/) ? `page-${slug}` : slug;

	return `// AUTO-GENERATED - Do not edit manually
// This file merges auto-generated component imports with your custom styles
// Generated: ${new Date().toISOString()}

// 1. Auto-generated component imports (based on data-component attributes)
@use '_generated/${slug}.components' as components-${namespace};

// 2. Your custom page styles (committed to version control)
@use '_custom/${slug}.custom' as custom-${namespace};
`;
}

/**
 * Generate base JavaScript file that imports styles
 */
function generateBaseJS(slug) {
	return `// AUTO-GENERATED - Do not edit manually
// Base imports for ${slug} page
// Generated: ${new Date().toISOString()}

// Import page styles
import '../../../styles/pages/${slug}.scss';

// Note: Custom JavaScript is in _custom/${slug}.custom.js
`;
}

/**
 * Generate final JS entry point that merges base and custom
 */
function generateFinalJS(slug) {
	return `// AUTO-GENERATED - Do not edit manually
// Final entry point for ${slug} page
// This file merges auto-generated imports with your custom JavaScript
// Generated: ${new Date().toISOString()}

// 1. Import styles (auto-generated)
import './_generated/${slug}.base.js';

// 2. Import custom page JavaScript (committed to version control)
import './_custom/${slug}.custom.js';
`;
}

/**
 * Ensure main.js exists
 */
async function ensureMainJS() {
	const mainPath = 'src/assets/scripts/main.js';

	try {
		await fs.access(mainPath);
	} catch {
		const content = `// Main entry point
// Imports global styles that are loaded on every page

import '../styles/main.scss';

// Global JavaScript
console.log('Site loaded');

// Add global functionality here:
// - Mobile menu toggle
// - Global analytics
// - Service worker registration
// - etc.
`;
		await fs.mkdir(path.dirname(mainPath), { recursive: true });
		await fs.writeFile(mainPath, content);
	}
}

/**
 * Build registry of available components
 */
async function getComponentRegistry() {
	const files = globSync('src/assets/styles/components/_*.scss');
	const registry = new Map();

	files.forEach((file) => {
		const name = path.basename(file, '.scss').replace(/^_/, '');
		if (name !== 'index') {
			registry.set(name, file);
		}
	});

	return registry;
}

/**
 * Extract component names from template
 */
function extractComponents(content) {
	const components = new Set();
	const regex = /data-component=["']([^"']+)["']/g;
	let match;

	while ((match = regex.exec(content)) !== null) {
		components.add(match[1]);
	}

	return components;
}

/**
 * Get page slug from template path
 */
function getSlug(templatePath) {
	let slug = path.basename(templatePath).replace(/\.(njk|md|html)$/, '');

	if (slug === 'index') {
		const parent = path.basename(path.dirname(templatePath));
		if (parent !== 'pages') {
			slug = parent;
		}
	}

	return slug;
}

// Allow standalone execution
if (import.meta.url === `file://${process.argv[1]}`) {
	generatePageStyles().catch(console.error);
}
