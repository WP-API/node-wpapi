'use strict';

module.exports = function( grunt ) {

	grunt.initConfig({

		pkg: grunt.file.readJSON( 'package.json' ),

		clean: {
			generated_api_docs: [ 'documentation/api-reference' ],
			generated_pages: [ 'documentation/*.md' ],
			generated_index: [ 'documentation/index.html' ],
			generated_zip: [ 'documentation/*.zip' ],
			leftover_pages_from_docs_branch: [
				'./Gemfile.lock',
				'./_site/',
				'./api-reference/',
				'./css/',
				'./index.html.combyne'
			]
		},

		yuidoc: {
			compile: {
				name: '<%= pkg.name %>',
				description: '<%= pkg.description %>',
				version: '<%= pkg.version %>',
				url: '<%= pkg.homepage %>',
				options: {
					ignorePaths: [ 'node_modules', 'tests', 'browser' ],
					exclude: 'browser',
					paths: '.',
					themedir: './docs-theme',
					// theme: 'simple',
					outdir: 'documentation/api-reference',
					tabtospace: 2
				}
			}
		},

		zip: {
			bundle: {
				cwd: 'browser',
				src: [ 'browser/**/*', 'LICENSE' ],
				dest: 'documentation/wpapi.zip'
			}
		}

	});

	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-contrib-yuidoc' );
	grunt.loadNpmTasks( 'grunt-zip' );

	grunt.registerTask( 'generate_readme_pages', [
		'Parse the contents of README.md out into individual markdown pages that',
		'can be rendered with Jekyll.'
	].join( ' ' ), function() {
		// Force task into async mode and grab a handle to the "done" function.
		var done = this.async();

		grunt.log.writeln( 'Extracting page content from README.md...' );

		// Kick off generation
		require( './build/generate-docs-markdown' ).then(function() {
			grunt.log.writeln( 'Pages generated successfully' );
			done();
		});
	});

	grunt.registerTask( 'docs', [
		'clean',
		'generate_readme_pages',
		'zip',
		'yuidoc'
	]);
};
