module.exports = {
	root: true,
	env: {
		node: true
	},
	globals: {},
	rules: {
		'no-cond-assign': [
			2,
			'except-parens'
		],
		'camelcase': 2,
		'curly': [
			2,
			'all'
		],
		'eqeqeq': 2,
		'no-eq-null': 2,
		'no-unused-expressions': 2,
		'wrap-iife': 2,
		'no-caller': 2,
		'quotes': [
			2,
			'single',
			'avoid-escape'
		],
		'strict': [
			2,
			'global'
		],
		'no-undef': 2,
		'no-unused-vars': 2,
		'operator-linebreak': [
			2,
			'after'
		],
		'comma-style': [
			2,
			'last'
		],
		'dot-notation': 2,
		'max-len': [
			2,
			100,
			{
				tabWidth: 2
			}
		],
		'one-var': [
			2,
			'never'
		],
		'no-mixed-spaces-and-tabs': 2,
		'no-trailing-spaces': 2,
		'no-multi-str': 2,
		'comma-dangle': [
			2,
			'never'
		],
		'indent': [
			2,
			'tab',
			{
				'SwitchCase': 1
			}
		],
		'space-before-function-paren': [
			2,
			'never'
		],
		'keyword-spacing': [
			2,
			{}
		],
		'array-bracket-spacing': [
			2,
			'always'
		],
		'space-in-parens': [
			0
			// 2,
			// 'always',
			// {
			// 	'exceptions': [
			// 		'empty',
			// 		'{}',
			// 		'()',
			// 		'[]'
			// 	]
			// }
		],
		// 'object-curly-spacing': [
		// 	2,
		// 	'always',
		// 	{
		// 		objectsInObjects: false,
		// 		arraysInObjects: false
		// 	}
		// ],
		'space-infix-ops': 2,
		'eol-last': 2,
		'space-unary-ops': [
			2,
			{
				'words': false,
				'nonwords': false,
				'overrides': {
					'!': true
				}
			}
		],
		'linebreak-style': [
			2,
			'unix'
		],
		'no-with': 2,
		'brace-style': [
			2,
			'1tbs',
			{
				'allowSingleLine': true
			}
		],
		'key-spacing': [
			2,
			{
				'beforeColon': false,
				'afterColon': true
			}
		],
		'no-multiple-empty-lines': 2
	}
};
