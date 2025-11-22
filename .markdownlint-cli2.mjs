// markdownlint-cli2 config
// https://github.com/DavidAnson/markdownlint-cli2?tab=readme-ov-file#markdownlint-cli2jsonc
export default {
	globs: ['./src/**/*.{md,markdown}'],
	ignores: [
		'./.husky/**',
		'./_site/**',
		'./.11ty-vite/**',
		'./node_modules/**',
		'./public/**',
	],
	fix: false,
	config: {
		// https://github.com/DavidAnson/markdownlint?tab=readme-ov-file#rules--aliases
		//'no-inline-html'
		MD033: false,
		// 'line-length', 80 char
		MD013: false,
	},
};
