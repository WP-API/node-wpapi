'use strict';

module.exports = function( grunt ) {

	grunt.initConfig({

		pkg: grunt.file.readJSON( 'package.json' ),

		yuidoc: {
			compile: {
				name: '<%= pkg.name %>',
				description: '<%= pkg.description %>',
				version: '<%= pkg.version %>',
				url: '<%= pkg.homepage %>',
				options: {
					ignorePaths: [ 'node_modules', 'tests' ],
					paths: '.',
					themedir: './docs-theme',
					// theme: 'simple',
					outdir: 'docs/',
					tabtospace: 2
				}
			}
		}

	});

	grunt.loadNpmTasks( 'grunt-contrib-yuidoc' );

	grunt.registerTask( 'docs', [ 'yuidoc' ] );
};
