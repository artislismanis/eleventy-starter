/**
 * Output sanity test.
 *
 * Cheap structural assertions on the built `_site/`. The build itself is run
 * by `__tests__/global-setup.mjs`, so this file is order-independent.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { describe, it, expect, beforeAll } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const sitePath = path.join(projectRoot, '_site');

function walkHtml(dir) {
	const out = [];
	if (!fs.existsSync(dir)) return out;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walkHtml(full));
		else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
	}
	return out;
}

describe('output sanity', () => {
	let pages;

	beforeAll(() => {
		// global-setup.mjs builds _site/ before any test runs.
		pages = walkHtml(sitePath);
	});

	it('built at least 5 HTML pages', () => {
		expect(pages.length).toBeGreaterThanOrEqual(5);
	});

	it('every page has a non-empty <title>', () => {
		const failures = pages.filter((p) => {
			const html = fs.readFileSync(p, 'utf8');
			const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
			return !m || m[1].trim().length === 0;
		});
		expect(failures).toEqual([]);
	});

	it('no href contains a broken templating sentinel', () => {
		// Catches `href="undefined"`, `href=null`, `href=NaN`, etc. — symptoms
		// of broken templating where a value resolved to undefined/null.
		// Tolerates both quoted and unquoted attributes (the HTML minifier
		// strips quotes from "safe" values).
		const failures = [];
		for (const p of pages) {
			const html = fs.readFileSync(p, 'utf8');
			const broken = html.match(
				/href=["']?(undefined|null|NaN|\[object Object\])(["'\s>])/g,
			);
			if (broken) failures.push({ page: path.relative(sitePath, p), broken });
		}
		expect(failures).toEqual([]);
	});

	it('each page declares a charset and viewport', () => {
		const failures = pages.filter((p) => {
			const html = fs.readFileSync(p, 'utf8');
			// Attributes may be quoted or unquoted (HTML minifier strips quotes).
			return (
				!/charset=["']?utf-8/i.test(html) || !/name=["']?viewport/i.test(html)
			);
		});
		expect(failures).toEqual([]);
	});
});
