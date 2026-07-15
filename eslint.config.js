'use strict';

const js = require( '@eslint/js' );
const globals = require( 'globals' );
const tseslint = require( 'typescript-eslint' );

// Project style predates Prettier and intentionally spaces the insides of
// parens/brackets/braces (WordPress-flavored, not a Prettier-compatible
// convention), so these rules are enforced directly by ESLint rather than
// delegated to a formatter.
const styleRules = {
	'array-bracket-spacing': [ 'error', 'always' ],
	'arrow-parens': [ 'error', 'as-needed', { requireForBlockBody: true } ],
	'arrow-spacing': [ 'error', {
		before: true,
		after: true,
	} ],
	'block-spacing': [ 'error' ],
	'comma-dangle': [ 'error', 'always-multiline' ],
	'comma-spacing': [ 'error', {
		before: false,
		after: true,
	} ],
	'eol-last': [ 'error', 'unix' ],
	eqeqeq: [ 'error' ],
	'func-call-spacing': [ 'error' ],
	indent: [ 'error', 'tab' ],
	'key-spacing': [ 'error', {
		beforeColon: false,
		afterColon: true,
	} ],
	'linebreak-style': [ 'error', 'unix' ],
	'no-console': [ 'warn' ],
	'no-mixed-spaces-and-tabs': [ 'error', 'smart-tabs' ],
	'no-multiple-empty-lines': [ 'error', {
		max: 1,
	} ],
	'no-var': [ 'error' ],
	'object-curly-newline': [ 'error', {
		ObjectExpression: {
			consistent: true,
			minProperties: 2,
			multiline: true,
		},
		ObjectPattern: {
			consistent: true,
			multiline: true,
		},
		ImportDeclaration: {
			consistent: true,
			multiline: true,
		},
		ExportDeclaration: {
			consistent: true,
			minProperties: 2,
			multiline: true,
		},
	} ],
	'object-curly-spacing': [ 'error', 'always' ],
	'object-property-newline': [ 'error' ],
	'prefer-arrow-callback': [ 'error' ],
	'prefer-const': [ 'error' ],
	quotes: [ 'error', 'single' ],
	semi: [ 'error', 'always' ],
	'semi-spacing': [ 'error', {
		before: false,
		after: true,
	} ],
	'space-before-function-paren': [ 'error', {
		anonymous: 'never',
		asyncArrow: 'always',
		named: 'never',
	} ],
	'space-in-parens': [ 'error', 'always' ],
	yoda: [ 'error', 'never' ],
};

// Vitest runs test files with `globals: true` (Jest-compatible globals) and
// a setup file aliasing `jest` to `vi`; declare both here so ESLint doesn't
// flag them as undefined.
const testGlobals = {
	describe: 'readonly',
	it: 'readonly',
	test: 'readonly',
	expect: 'readonly',
	beforeAll: 'readonly',
	beforeEach: 'readonly',
	afterAll: 'readonly',
	afterEach: 'readonly',
	vi: 'readonly',
	jest: 'readonly',
};

module.exports = tseslint.config(
	{
		ignores: [
			'dist/',
			'coverage/',
			'documentation/',
			'.scratchpad/',
			'test.js',
		],
	},
	js.configs.recommended,
	{
		files: [ '**/*.js' ],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'commonjs',
			globals: {
				...globals.node,
			},
		},
		rules: styleRules,
	},
	{
		files: [ 'tests/**/*.js', 'fetch/tests/**/*.js' ],
		languageOptions: {
			globals: testGlobals,
		},
	},
	{
		files: [ 'build/**/*.js', 'lib/data/**/*.js' ],
		rules: {
			'no-console': 'off',
		},
	},
	tseslint.configs.recommended.map( config => ( {
		...config,
		files: [ '**/*.ts' ],
	} ) ),
);
