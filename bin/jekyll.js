/**
 * This script will start the Jekyll server in the context of the docs
 * directory. It is only for use in local development, and sets the --baseurl
 * option to override the production-only baseurl in _config.yml.
 */
/* eslint-disable no-console */
'use strict';

const path = require( 'path' );
const spawn = require( 'child_process' ).spawn;
const argv = require( 'minimist' )( process.argv.slice( 2 ) );

// Execute within the context of the docs directory
const docsDir = path.resolve( __dirname, '../documentation' );

if ( argv.install || argv.i ) {
	// Install the ruby bundle needed to run jekyll
	const server = spawn( 'bundle', [ 'install' ], {
		cwd: docsDir,
		stdio: 'inherit',
	} );

	server.on( 'error', err => console.error( err ) );
} else {
	// Start the server in local dev mode
	const bundleOptions = [ 'exec', 'jekyll', 'serve', '--baseurl', '' ];
	if ( argv.host ) {
		bundleOptions.push( '--host', argv.host );
	}

	const server = spawn( 'bundle', bundleOptions, {
		cwd: docsDir,
		stdio: 'inherit',
	} );

	server.on( 'error', err => console.error( err ) );
}
