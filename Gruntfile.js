module.exports = function( grunt ) {
	'use strict';

	// Reusable file globbing
	var sourceFiles = [
		'index.js',
		'libs/**/*.js'
	];

	// Load tasks.
	grunt.loadNpmTasks( 'grunt-jscs-checker' );
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );
	grunt.loadNpmTasks( 'grunt-simple-mocha' );

	grunt.initConfig({
		pkg: grunt.file.readJSON( 'package.json' ),
		jscs: {
			all: {
				options: {
					config: '.jscsrc'
				},
				src: sourceFiles
			}
		},
		jshint: {
			options: {
				reporter: require( 'jshint-stylish' )
			},
			grunt: {
				options: grunt.file.readJSON( '.jshintrc' ),
				src: [ 'Gruntfile.js' ]
			},
			// tests: {
			// 	src: [
			// 		'tests/**/*.js'
			// 	],
			// 	options: grunt.file.readJSON( 'tests/.jshintrc' )
			// },
			src: {
				options: grunt.file.readJSON( '.jshintrc' ),
				src: sourceFiles
			}
		},
		simplemocha: {
			test: {
				src: [ 'test/**/*.js' ],
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
				files: sourceFiles,
				tasks: [ 'jscs', 'jshint', 'simplemocha' ]
			},
			build: {
				files: sourceFiles,
				tasks: [ 'jscs', 'jshint' ]
			}
		}
	});

	grunt.registerTask( 'default', [ 'jshint', 'simplemocha' ] );
	grunt.registerTask( 'test', [ 'jshint', 'simplemocha' ] );
};
