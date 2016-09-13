'use strict';

module.exports = function( grunt ) {
	grunt.config.set( 'yuidoc', {
		compile: {
			name: '<%= pkg.name %>',
			description: '<%= pkg.description %>',
			version: '<%= pkg.version %>',
			url: '<%= pkg.homepage %>',
			options: {
				ignorePaths: [ 'node_modules', 'tests', 'browser' ],
				exclude: 'browser,bin,build,tests',
				paths: '.',
				themedir: './docs-theme',
				// theme: 'simple',
				outdir: 'documentation/api-reference',
				tabtospace: 2
			}
		}
	});

	grunt.loadNpmTasks( 'grunt-contrib-yuidoc' );
};
