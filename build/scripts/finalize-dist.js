/**
 * Post-build pass over tsdown's dist/ output, run as the final step of `npm run build`.
 *
 * Replaces the fetch.* entry files with one-line re-exports of index.*: wpapi/fetch is
 * documented as an alias of the main export, and shipping re-exports (rather than the
 * second full bundle tsdown emits) keeps both subpaths resolving to the same module
 * instance and trims ~220 kB from the package. This applies to the declaration files
 * too, so the alias shares the main entry's generated types.
 *
 * (This script previously also replaced the generated index.d.* files with a
 * hand-written interim declaration; the Phase 3 TypeScript migration made the
 * generated declarations authoritative and removed that workaround.)
 */
'use strict';

const fs = require( 'fs' );
const path = require( 'path' );

const dist = path.resolve( __dirname, '..', '..', 'dist' );

const files = {
	'fetch.cjs': 'module.exports = require( \'./index.cjs\' );\n',
	'fetch.mjs': 'export { default } from \'./index.mjs\';\n',
	'fetch.d.cts': 'import WPAPI = require( \'./index.cjs\' );\nexport = WPAPI;\n',
	'fetch.d.mts': 'export { default } from \'./index.mjs\';\n',
};

Object.keys( files ).forEach( ( name ) => {
	fs.writeFileSync( path.join( dist, name ), files[ name ] );
} );

console.log( `Finalized ${ Object.keys( files ).length } dist files (fetch aliases)` );
