const extend = require( 'node.extend' );
module.exports = function( grunt ) {
	'use strict';

	// Reusable file globbing
	var files = {
		grunt: [ 'Gruntfile.js' ],
		src: [ 'index.js', 'lib/**/*.js' ],
		test: [ 'test/**/*.js' ]
	};

	// Reusable JSHintRC options
	var jshintrc = grunt.file.readJSON( '.jshintrc' );

	// Load tasks.
	grunt.loadNpmTasks( 'grunt-jscs-checker' );
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );
	grunt.loadNpmTasks( 'grunt-simple-mocha' );

	grunt.initConfig( {

		pkg: grunt.file.readJSON( 'package.json' ),

		jscs: {
			all: {
				options: {
					config: '.jscsrc'
				},
				src: files.src.concat( files.test ).concat( files.grunt )
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
				src: files.src
			},
			tests: {
				options: extend( {
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
					reporter: 'Nyan',
					ui: 'bdd',
					globals: [ 'describe', 'it' ],
					log: true,
					logErrors: true
				}
			}
		},

		watch: {
			test: {
				files: files.src,
				tasks: [ 'jscs', 'jshint', 'simplemocha' ]
			},
			build: {
				files: files.src,
				tasks: [ 'jscs', 'jshint' ]
			}
		}

	} );

	grunt.registerTask( 'default', [ 'jshint', 'simplemocha' ] );
	grunt.registerTask( 'test', [ 'jshint', 'simplemocha' ] );
};
