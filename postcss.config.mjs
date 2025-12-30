import postcssPresetEnv from 'postcss-preset-env';
import cssnano from 'cssnano';

export default {
	plugins: [
		postcssPresetEnv({
			stage: 3,
			features: {
				'nesting-rules': true,
				'custom-properties': true,
				'custom-media-queries': true,
			},
		}),

		...(process.env.NODE_ENV === 'production'
			? [
					cssnano({
						preset: [
							'default',
							{
								discardComments: {
									removeAll: true,
								},
								normalizeWhitespace: true,
								colormin: true,
								minifyFontValues: true,
							},
						],
					}),
				]
			: []),
	],
};
