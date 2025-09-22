// ESLint config
// https://eslint.org/docs/latest/use/configure/
import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import promisePlugin from 'eslint-plugin-promise';
import prettierConfig from 'eslint-config-prettier';

export default [
	// Project-wide folder ignores
	{
		ignores: [
			'**/node_modules/**',
			'_site/**',
			'.11ty-vite/**',
			'public/**',
			// add other dirs here
		],
	},
	js.configs.recommended,
	importPlugin.flatConfigs.recommended,
	promisePlugin.configs['flat/recommended'],

	{
		files: ['**/*.{js,cjs,mjs}'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.es2022,
				...globals.browser,
				...globals.node,
			},
		},
		rules: {
			// Override eslint-plugin-import recommended settings
			'import/order': ['warn', { 'newlines-between': 'always' }],
		},
	},

	// Override for config files
	{
		files: ['*.config.mjs', '.markdownlint-cli2.mjs'],
		languageOptions: {
			globals: { ...globals.node },
		},
	},

	prettierConfig,
];
