'use strict';

module.exports = function( grunt ) {
	grunt.config.set( 'clean', {
		generated_api_docs: [ 'documentation/api-reference' ],
		generated_pages: [ 'documentation/*.md' ],
		generated_files: [ 'documentation/index.html', 'documentation/404.html' ],
		generated_zip: [ 'documentation/*.zip' ],
		leftover_pages_from_docs_branch: [
			'./Gemfile.lock',
			'./_pages/',
			'./_site/',
			'./api-reference/',
			'./css/',
			'./index.html.combyne',
		],
	} );

	grunt.loadNpmTasks( 'grunt-contrib-clean' );
};
