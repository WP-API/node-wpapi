const extend = require( 'node.extend' );
module.exports = function( grunt ) {
	'use strict';

	// Reusable file globbing
	var files = {
		grunt: [ 'Gruntfile.js' ],
		lib: [ 'index.js', 'lib/**/*.js' ],
		test: [ 'test/**/*.js' ]
	};

	// Reusable JSHintRC options
	var jshintrc = grunt.file.readJSON( '.jshintrc' );

	// Load tasks.
	require( 'load-grunt-tasks' )( grunt );

	grunt.initConfig({

		pkg: grunt.file.readJSON( 'package.json' ),

		jscs: {
			options: {
				config: '.jscsrc',
				reporter: require( 'jscs-stylish' ).path
			},
			grunt: {
				src: files.grunt
			},
			lib: {
				src: files.lib
			},
			tests: {
				src: files.test
			}
		},

		jshint: {
			options: {
				reporter: require( 'jshint-stylish' )
			},
			grunt: {
				options: jshintrc,
				src: files.grunt
			},
			lib: {
				options: jshintrc,
				src: files.lib
			},
			tests: {
				options: extend({
					globals: {
						'describe': false,
						'it': false
					}
				}, jshintrc ),
				src: files.test
			}
		},

		simplemocha: {
			test: {
				src: files.test,
				options: {
					reporter: 'Nyan'
				}
			}
		},

		watch: {
			lib: {
				files: files.lib,
				tasks: [ 'jscs:lib', 'jshint:lib', 'simplemocha' ]
			},
			tests: {
				files: files.test,
				tasks: [ 'jscs:tests', 'jshint:tests', 'simplemocha' ]
			}
		}

	});

	grunt.registerTask( 'lint', [ 'jscs', 'jshint' ] );
	grunt.registerTask( 'test', [ 'simplemocha' ] );
	grunt.registerTask( 'default', [ 'lint', 'test' ] );
};
