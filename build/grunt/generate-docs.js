'use strict';

module.exports = function( grunt ) {
	grunt.registerTask( 'generate_readme_docs', [
		'Parse the contents of README.md out into individual markdown pages that',
		'can be rendered with Jekyll.'
	].join( ' ' ), function() {
		// Force task into async mode and grab a handle to the "done" function.
		var done = this.async();

		grunt.log.writeln( 'Extracting page content from README.md...' );

		// Kick off generation
		require( '../scripts/generate-docs-markdown' ).then(function() {
			grunt.log.writeln( 'Pages generated successfully' );
			done();
		});
	});
};
