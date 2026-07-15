'use strict';

const { defineConfig } = require( 'vitest/config' );

module.exports = defineConfig( {
	test: {
		globals: true,
		environment: 'node',
		// Integration tests hit a real, shared WP instance; give slower
		// requests (e.g. media uploads) headroom beyond the 5s default.
		testTimeout: 15000,
		setupFiles: [ './tests/helpers/vitest-jest-compat.js' ],
		include: [
			'tests/**/*.js',
			'fetch/tests/**/*.js',
		],
		exclude: [
			'**/node_modules/**',
			'**/tests/helpers/**',
		],
		coverage: {
			provider: 'v8',
			exclude: [ '**/tests/helpers/**' ],
		},
	},
} );
