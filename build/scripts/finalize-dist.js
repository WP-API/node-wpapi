/**
 * Post-build pass over tsdown's dist/ output, run as the final step of `npm run build`.
 *
 * 1. Replaces the fetch.* entry files with one-line re-exports of index.*: wpapi/fetch
 *    is documented as an alias of the main export, and shipping re-exports (rather than
 *    the second full bundle tsdown emits) keeps both subpaths resolving to the same
 *    module instance and trims ~190 kB from the package.
 *
 * 2. Replaces the generated index.d.* declarations with a hand-written interim typing.
 *    The generated ones are worse than none: bindTransport's untyped return erases the
 *    export to an anonymous Function shape with no construct signature, so typed
 *    consumers could not even `new WPAPI()`. (Typing it at the source is blocked by
 *    rolldown-plugin-dts's inability to bundle cross-file CJS declarations; the real
 *    fix is the Phase 3 TypeScript migration, which should delete this workaround.)
 */
'use strict';

const fs = require( 'fs' );
const path = require( 'path' );

const dist = path.resolve( __dirname, '..', '..', 'dist' );

// Interim declaration body, shared by the CJS and ESM declaration files. The API
// surface is generated dynamically from route definitions, so instances are typed
// permissively until the TypeScript migration produces real typings.
const declaration = `declare class WPAPI {
	constructor( options: WPAPI.Options );
	static site( endpoint: string, routes?: Record<string, unknown> ): WPAPI;
	static discover( url: string ): Promise<WPAPI>;
	static readonly transport: {
		get( wpreq: unknown ): Promise<any>;
		post( wpreq: unknown, data?: unknown ): Promise<any>;
		put( wpreq: unknown, data?: unknown ): Promise<any>;
		delete( wpreq: unknown, data?: unknown ): Promise<any>;
		head( wpreq: unknown ): Promise<any>;
	};
	[ routeHandler: string ]: any;
}
declare namespace WPAPI {
	interface Options {
		endpoint: string;
		username?: string;
		password?: string;
		nonce?: string;
		routes?: Record<string, unknown>;
		transport?: Partial<typeof WPAPI.transport>;
	}
}
`;

const files = {
	'index.d.cts': `${ declaration }export = WPAPI;\n`,
	'index.d.mts': `${ declaration }export default WPAPI;\n`,
	'fetch.cjs': 'module.exports = require( \'./index.cjs\' );\n',
	'fetch.mjs': 'export { default } from \'./index.mjs\';\n',
	'fetch.d.cts': 'import WPAPI = require( \'./index.cjs\' );\nexport = WPAPI;\n',
	'fetch.d.mts': 'export { default } from \'./index.mjs\';\n',
};

Object.keys( files ).forEach( ( name ) => {
	fs.writeFileSync( path.join( dist, name ), files[ name ] );
} );

console.log( `Finalized ${ Object.keys( files ).length } dist files (fetch aliases + interim typings)` );
