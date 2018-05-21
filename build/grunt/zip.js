'use strict';

module.exports = function( grunt ) {
	grunt.config.set( 'zip', {
			bundle: {
				cwd: 'browser',
				src: [ 'browser/**/*', 'LICENSE' ],
				dest: 'documentation/wpapi.zip',
			},
		} );

	grunt.loadNpmTasks( 'grunt-zip' );
};
