// Stylelint config
// https://stylelint.io/user-guide/configure/
export default {
	extends: ['stylelint-config-standard-scss'],
	overrides: [
		{
			files: ['**/*.scss'],
			customSyntax: 'postcss-scss',
		},
	],
	ignoreFiles: [
		'./.husky/**',
		'./_site/**',
		'./.11ty-vite/**',
		'./node_modules/**',
		'./.unlighthouse/**',
	],
	rules: {
		'selector-not-notation': 'simple',
	},
};
