import path from 'path';
import { fileURLToPath } from 'url';

import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { getAvailableFeatures } from '@eleventy-plugin-themer/core';
import { metadata as themeMetadata } from '@eleventy-plugin-themer/theme-base';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

// Cache features to avoid re-reading filesystem on every validation
let cachedFeatures = null;

/**
 * Get available features (cached)
 * Uses theme's getAvailableFeatures which includes both theme and user features
 */
async function getFeatures() {
	if (!cachedFeatures) {
		// Theme returns Map<string, Object>, convert to array of names
		const featuresMap = getAvailableFeatures(projectRoot, themeMetadata);
		cachedFeatures = Array.from(featuresMap.keys());
	}
	return cachedFeatures;
}

/**
 * Eleventy Data Schema
 * Validates front matter for technical correctness
 *
 * This ensures builds won't break due to:
 * - Invalid bundle names
 * - Wrong data types
 * - Missing required fields
 *
 * For style/SEO, use:
 * - markdownlint (formatting)
 * - vale (prose style)
 * - SEO-specific tools
 */
export default function () {
	return async function (data) {
		const features = await getFeatures();

		// Base schema - technical validation only
		const schema = z.object({
			// Draft status
			draft: z.boolean().optional(),

			// Feature validation - must match available features
			pageFeature:
				features.length > 0
					? z
							.enum(features, {
								errorMap: () => ({
									message: `Invalid feature. Available: ${features.join(', ')}`,
								}),
							})
							.optional()
					: z.string().optional(),

			pageFeatures:
				features.length > 0
					? z
							.array(
								z.enum(features, {
									errorMap: () => ({
										message: `Invalid feature. Available: ${features.join(', ')}`,
									}),
								}),
							)
							.optional()
					: z.array(z.string()).optional(),

			// Tags - must be array if present
			tags: z.array(z.string()).optional(),

			// Date - must be valid date if present
			date: z.coerce.date().optional(),
		});

		const result = schema.safeParse(data);

		if (result.error) {
			throw fromZodError(result.error);
		}
	};
}
