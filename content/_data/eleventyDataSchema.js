import path from 'path';
import { fileURLToPath } from 'url';

import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { featuresFrontMatterSchema } from '@eleventy-plugin-themer/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

let cachedFeaturesSchema = null;
function getFeaturesSchema(themeMetadata) {
	if (!cachedFeaturesSchema) {
		cachedFeaturesSchema = featuresFrontMatterSchema(
			projectRoot,
			themeMetadata,
		);
	}
	return cachedFeaturesSchema;
}

/**
 * Eleventy data schema — technical front-matter validation.
 * Style/SEO concerns belong elsewhere (markdownlint, vale, etc.).
 */
export default function () {
	return async function (data) {
		const schema = z.object({
			draft: z.boolean().optional(),
			features: getFeaturesSchema(data.themeMetadata),
			tags: z.array(z.string()).optional(),
			date: z.coerce.date().optional(),
		});

		const result = schema.safeParse(data);
		if (result.error) {
			throw fromZodError(result.error);
		}
	};
}
