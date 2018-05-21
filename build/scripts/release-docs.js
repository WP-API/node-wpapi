/* eslint-disable no-console */
'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const prompt = require( 'prompt' );
const spawn = require( 'child_process' ).spawn;

// Get package info
const pkg = require( '../../package.json' );

// This is the commit message that will be used by the script
const commitMessage = `Release latest documentation for node-wpapi v${pkg.version}`;

// Run all commands in base project directory
const projectRoot = path.join( __dirname, '../..' );

// This regex is used to exclude hidden files, the Gemfile.lock, and combyne
// templates (which are used to generate Jekyll files, and not needed on the
// deployed site)
const OMIT_FILE_RE = /^\.|\.lock|\.combyne$/;

// This regex is used to find directories to explicitly rm -rf when copying
// files from the temporary directory into the repo proper: we make the
// incorrect but still helpful assumption that no file extension means that
// something is a directory. This means Gemfile and other no-ext files are
// unnecessarily deleted, but it makes things work with minimal complexity.
const PROBABLY_A_DIRECTORY_RE = /^[^\.]+$/;

// RE to match the markdown files that are extracted from the README.md
const GENERATED_MARKDOWN_RE = /^\d+-.*\.md$/;

// RE to match "y", yes", "yeah", "yes please", and other affirmative responses
const AFFIRMATIVE_RE = /^y(:?e[asp]?h?)?(:? [^\n]+)?\s*$/i;

/**
 * Helper method to request yes/no confirmation from the user, with some
 *
 * @private
 * @returns {Promise} A promise that will resolve with a boolean true/false
 * indicating whether assent was given
 */
const promptYN = () => new Promise( ( resolve, reject ) => {
	prompt.message = '';
	prompt.start();
	prompt.get( [ 'y/n' ], ( err, result ) => {
		if ( err ) {
			return reject( err );
		}
		resolve( AFFIRMATIVE_RE.test( result[ 'y/n' ] ) );
	} );
} );

/**
 * Get the list of files in a directory, either as a list of file and subdir
 * names or a list of absolute file system paths
 *
 * @private
 * @param {string} inputDir The file system path to the directory to read
 * @returns {Promise} A promise to the string array of file names
 */
const ls = ( inputDir, absolute ) => {
	return new Promise( ( resolve, reject ) => {
		fs.readdir( inputDir, ( err, list ) => {
			if ( err ) {
				return reject( err );
			}

			resolve( list );
		} );
	} );
};

/**
 * Spawn a shell command, pipe its output to the parent process's stdio, and
 * return a promise that will resolve or reject when the subprocess completes
 *
 * @private
 * @param {string}   commandStr  A string containing a shell command to run
 * @param {string[]} [otherArgs] Array of additional string arguments, so that
 * quoted arguments with spaces like github commit messages will not be broken
 * @returns {Promise} A promise that will resolve if the command executes
 * successfully or reject if it errors
 */
const runCommand = ( commandStr, otherArgs ) => {
	return new Promise( ( resolve, reject ) => {
		const commandArgs = commandStr.split( ' ' );
		if ( Array.isArray( otherArgs ) ) {
			otherArgs.forEach( arg => commandArgs.push( arg ) );
		}
		const command = commandArgs.shift();

		const spawnedCommand = spawn( command, commandArgs, {
			cwd: projectRoot,
			stdio: 'inherit',
		} );

		spawnedCommand.on( 'error', err => {
			reject( err );
		} );

		spawnedCommand.on( 'close', code => {
			return code ? reject( code ) : resolve();
		} );
	} );
};

/**
 * Helper function that takes in an array of functions that return promises,
 * then executes those functions sequentially to execute each action
 *
 * @param {function[]} arrOfFnsReturningPromises An array of functions
 * @returns {Promise} A promise that will resolve once all the promises
 * returned by that function successfully complete
 */
const runInSequence = arrOfFnsReturningPromises => {
	return arrOfFnsReturningPromises.reduce(
		( lastStep, startNextStep ) => lastStep.then( startNextStep ),
		Promise.resolve()
	);
};

// Start fresh
runCommand( 'rm -rf docs-tmp' )
	// Make sure that we know what we are doing
	.then( () => new Promise( ( resolve, reject ) => {
		console.log( '\nBefore we begin,' );
		console.log( '1. Are you on the "master" branch?' );
		console.log( '2. Does "git status" show that HEAD is clean?' );
		console.log( '3. Is the code in "master" current with a released version?' );
		console.log( '\nWhatever is in this branch will be released in the public .zip download.' );
		console.log( 'By proceeding, you affirm that this is not going to ruin anybody\'s day.' );
		console.log( '\nContinue?' );

		return promptYN().then( result => {
			if ( result ) {
				console.log( '\nGreat, let\'s get this show on the road...' );
				resolve();
			} else {
				console.log( '\nDiscretion is the better part of valor\n' );
				// Throw a raw string to make the logging easier
				reject( '(User aborted deployment process)' );
			}
		} );
	} ) )
	// Ensure the built JS library is up to date
	.then( () => runCommand( 'npm run build' ) )
	// Build the docs site content (web bundle .zip, generated pages, etc)
	.then( () => runCommand( 'npm run docs' ) )
	// Copy the docs folder to a temp location to move its contents across branches
	.then( () => runCommand( 'cp -r documentation docs-tmp' ) )
	.then( () => console.log( '\nTemporary directory created successfully. Switching branches...\n' ) )
	// Switch to the docs site branch
	.then( () => runCommand( 'git checkout gh-pages' ) )
	// Remove auto-generated files from the root of the gh-pages branch, in case
	// file names have changed since the last deploy
	.then( () => ls( projectRoot )
		.then( files => {
			const removeFiles = files
				.filter( file => GENERATED_MARKDOWN_RE.test( file ) )
				.map( file => () => runCommand( `rm ${file}` ) );

			return runInSequence( removeFiles );
		} )
	)
	.then( () => console.log( '\nCopying files from temp directory...\n' ) )
	// Get a list of generated files in the temp directory
	.then( () => ls( path.join( projectRoot, 'docs-tmp' ) ) )
	// Filter out unneeded files from the list
	.then( fileList => fileList.filter( result => ! OMIT_FILE_RE.test( result ) ) )
	// Copy things from the temp directory down into the directory root
	.then( fileList => {
		// Create an array of functions that each remove a directory in the root of
		// this project which could block the success of the `mv` command below
		const removeDirectories = fileList
			.filter( file => PROBABLY_A_DIRECTORY_RE.test( file ) )
			.map( dir => {
				// Ignore errors b/c they will usually be nothing more than a warning
				// that a file we tried to delete didn't exist to begin with
				return () => runCommand( `rm -rf ${dir}` ).catch( err => console.log( err ) );
			} );

		return runInSequence( removeDirectories ).then( () => fileList );
	} )
	// Copy files over
	.then( fileList => {
		const copyFiles = fileList.map( file => {
			return () => runCommand( `mv docs-tmp/${file} ./${file}` );
		} );
		return runInSequence( copyFiles ).then( () => fileList );
	} )
	.then( fileList => console.log( `${fileList.length} files moved successfully` ) )
	// Remove the temp directory
	.then( () => runCommand( 'rm -rf docs-tmp' ) )
	// Give the option of not re-deploying wpapi.zip: if the package's contents
	// have not changed but a new .zip is generated with the same contents, Git
	// will still regard it as an updated file and too many of those could bloat
	// the repo. Easier to exclude it for docs-only updates.
	.then( () => new Promise( ( resolve, reject ) => {
		console.log( '\nHas the wpapi.zip bundle changed since last deploy? (If unsure, answer "Yes")' );

		return promptYN().then( result => {
			if ( result ) {
				console.log( 'Including updated wpapi.zip in build...' );
				resolve();
			} else {
				console.log( 'Removing unneeded wpapi.zip update from the commit' );
				resolve( runCommand( 'git checkout gh-pages wpapi.zip' ) );
			}
		} );
	} ) )
	// Stage files for commit
	.then( () => runCommand( 'git add .' ) )
	// Require user confirmation before proceeding with the commit & push
	.then( () => new Promise( ( resolve, reject ) => {
		console.log( '\nDocumentation staged for commit. Proceed with commit & push?' );

		return promptYN().then( result => {
			if ( result ) {
				console.log( '\nConfirmed, committing & pushing docs branch...' );
				resolve();
			} else {
				console.log( '\nCommit & push canceled, exiting.\n' );
				// Throw a raw string to make the logging easier
				reject( '(User aborted deployment process)' );
			}
		} );
	} ) )
	// Commit files
	.then( () => runCommand( 'git commit -m', [ `"${commitMessage}"` ] ) )
	// Push docs branch
	.then( () => runCommand( 'git push origin gh-pages' ) )
	// Switch back to master
	.then( () => runCommand( 'git checkout master' ) )
	// Run the clean command again to remove any ignored docs files left over
	// after switching back to master
	.then( () => runCommand( 'grunt clean' ) )
	// Log success!
	.then( () => console.log( '\nDocs site updated!' ) )
	.catch( err => console.error( err ) );
