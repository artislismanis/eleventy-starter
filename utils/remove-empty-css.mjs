import fs from 'fs';
import path from 'path';

export async function removeEmptyCss() {
	return {
		name: 'remove-empty-css',
		enforce: 'post', // Run after other plugins including PurgeCSS

		async closeBundle() {
			const distDir = path.resolve(process.cwd(), 'dist');
			const emptyCssFiles = new Set();

			// Find empty CSS files
			function scanForEmptyCss(dir) {
				const entries = fs.readdirSync(dir, { withFileTypes: true });

				for (const entry of entries) {
					const fullPath = path.join(dir, entry.name);

					if (entry.isDirectory()) {
						scanForEmptyCss(fullPath);
					} else if (entry.isFile() && entry.name.endsWith('.css')) {
						const content = fs.readFileSync(fullPath, 'utf-8').trim();

						if (content === '') {
							console.log(`Found empty CSS file: ${fullPath}`);
							emptyCssFiles.add(entry.name);
							fs.unlinkSync(fullPath);
							console.log(`Deleted: ${fullPath}`);
						}
					}
				}
			}

			// Remove references from HTML files
			function removeReferencesFromHtml(dir) {
				const entries = fs.readdirSync(dir, { withFileTypes: true });

				for (const entry of entries) {
					const fullPath = path.join(dir, entry.name);

					if (entry.isDirectory()) {
						removeReferencesFromHtml(fullPath);
					} else if (entry.isFile() && entry.name.endsWith('.html')) {
						let content = fs.readFileSync(fullPath, 'utf-8');
						let modified = false;

						for (const cssFile of emptyCssFiles) {
							// Match <link> tags referencing this CSS file
							const linkRegex = new RegExp(
								`\\s*<link[^>]*href=["'][^"']*${cssFile.replace('.', '\\.')}["'][^>]*>\\s*`,
								'g',
							);

							if (linkRegex.test(content)) {
								content = content.replace(linkRegex, '');
								modified = true;
								console.log(`Removed reference to ${cssFile} from ${fullPath}`);
							}
						}

						if (modified) {
							fs.writeFileSync(fullPath, 'utf-8');
						}
					}
				}
			}

			scanForEmptyCss(distDir);

			if (emptyCssFiles.size > 0) {
				console.log(
					`Removing references to ${emptyCssFiles.size} empty CSS file(s)`,
				);
				removeReferencesFromHtml(distDir);
			}
		},
	};
}
