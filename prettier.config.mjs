// Prettier config
// https://prettier.io/docs/configuration
export default {
	// Duplicating .editorconfig settings
	// Should be read automatically by Prettier in most scenarios, but just in case
	useTabs: true,
	tabWidth: 2,
	endOfLine: 'lf',
	// Prettier specific settings
	semi: true,
	singleQuote: true,
	trailingComma: 'all',
	plugins: ['prettier-plugin-jinja-template'],
	overrides: [
		{
			files: ['**/*.njk'],
			options: {
				parser: 'jinja-template',
			},
		},
		{
			files: ['**/*.jsonc'],
			options: {
				trailingComma: 'none',
			},
		},
	],
};
