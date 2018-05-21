/**
 * The Gruntfile in this project is not responsible for the code build or
 * linting, and instead handles all tasks related to documentation generation
 * and output.
 */
'use strict';

module.exports = function( grunt ) {
	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),
	} );

	// Individual tasks are defined within build/grunt
	grunt.loadTasks( 'build/grunt' );

	grunt.registerTask( 'docs', [
		'clean',
		'generate_readme_docs',
		'zip',
	] );
};
