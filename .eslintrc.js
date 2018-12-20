module.exports = {
	'env': {
		'es6': true,
		'node': true,
	},
	'extends': 'eslint:recommended',
	'parserOptions': {
		'ecmaVersion': 2018,
	},
	'rules': {
		'array-bracket-spacing': [ 'error', 'always' ],
		'arrow-parens': [ 'error', 'as-needed', { 'requireForBlockBody': true } ],
		'arrow-spacing': [ 'error', {
			'before': true,
			'after': true,
		} ],
		'block-spacing': [ 'error' ],
		'comma-dangle': [ 'error', 'always-multiline' ],
		'comma-spacing': [ 'error', {
			'before': false,
			'after': true,
		} ],
		'eol-last': [ 'error', 'unix' ],
		'eqeqeq': [ 'error' ],
		'func-call-spacing': [ 'error' ],
		'indent': [ 'error', 'tab' ],
		'key-spacing': [ 'error', {
			'beforeColon': false,
			'afterColon': true,
		} ],
		'linebreak-style': [ 'error', 'unix' ],
		'no-console': [ 'warn' ],
		'no-mixed-spaces-and-tabs': [ 'error', 'smart-tabs' ],
		'no-multiple-empty-lines': [ 'error', {
			'max': 1,
		} ],
		'no-var': [ 'error' ],
		'object-curly-newline': [ 'error', {
			'ObjectExpression': {
				'consistent': true,
				'minProperties': 2,
				'multiline': true,
			},
			'ObjectPattern': {
				'consistent': true,
				'multiline': true,
			},
			'ImportDeclaration': {
				'consistent': true,
				'multiline': true,
			},
			'ExportDeclaration': {
				'consistent': true,
				'minProperties': 2,
				'multiline': true,
			},
		} ],
		'object-curly-spacing': [ 'error', 'always' ],
		'object-property-newline': [ 'error' ],
		'prefer-arrow-callback': [ 'error' ],
		'prefer-const': [ 'error' ],
		'quotes': [ 'error', 'single' ],
		'semi': [ 'error', 'always' ],
		'semi-spacing': [ 'error', {
			'before': false,
			'after': true,
		} ],
		'space-before-function-paren': [ 'error', {
			'anonymous': 'never',
			'asyncArrow': 'always',
			'named': 'never',
		} ],
		'space-in-parens': [ 'error', 'always' ],
		'yoda': [ 'error', 'never' ],
	},
};
