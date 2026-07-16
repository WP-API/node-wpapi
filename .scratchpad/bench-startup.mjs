// Benchmark default-mode WPAPI startup cost against the built dist/ output.
// Usage: npm run build && node .scratchpad/bench-startup.mjs [samples]
//
// Reports, across N fresh node child processes:
//   - load: time to require('dist/index.cjs')
//   - init: time for the first default-mode `new WPAPI(...)` (route parse + factories)
//   - init2: time for a second instantiation (factories already cached)
// Plus an in-process micro-benchmark of the default-route bootstrap work itself.

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '..' );
const samples = parseInt( process.argv[ 2 ], 10 ) || 30;

const childScript = `
	const t0 = performance.now();
	const WPAPI = require( ${ JSON.stringify( path.join( repoRoot, 'dist/index.cjs' ) ) } );
	const t1 = performance.now();
	new WPAPI( { endpoint: 'http://localhost/wp-json' } );
	const t2 = performance.now();
	new WPAPI( { endpoint: 'http://localhost/wp-json' } );
	const t3 = performance.now();
	console.log( JSON.stringify( { load: t1 - t0, init: t2 - t1, init2: t3 - t2 } ) );
`;

const results = [];
for ( let i = 0; i < samples; i++ ) {
	const out = execFileSync( process.execPath, [ '-e', childScript ], { encoding: 'utf8' } );
	results.push( JSON.parse( out ) );
}

const stats = ( key ) => {
	const values = results.map( r => r[ key ] ).sort( ( a, b ) => a - b );
	const mean = values.reduce( ( a, b ) => a + b, 0 ) / values.length;
	const median = values[ Math.floor( values.length / 2 ) ];
	return { mean, median, min: values[ 0 ], max: values[ values.length - 1 ] };
};

const fmt = ( s ) => `median ${ s.median.toFixed( 3 ) }ms  mean ${ s.mean.toFixed( 3 ) }ms  min ${ s.min.toFixed( 3 ) }ms  max ${ s.max.toFixed( 3 ) }ms`;

console.log( `samples: ${ samples } (fresh node process each)` );
console.log( `require('dist/index.cjs')      ${ fmt( stats( 'load' ) ) }` );
console.log( `first new WPAPI() (parse)      ${ fmt( stats( 'init' ) ) }` );
console.log( `second new WPAPI() (cached)    ${ fmt( stats( 'init2' ) ) }` );

// In-process micro-benchmark: repeat the first-instantiation bootstrap work by
// clearing the module cache so the lazy default-factory cache is rebuilt.
const microScript = `
	const distPath = ${ JSON.stringify( path.join( repoRoot, 'dist/index.cjs' ) ) };
	const ITERATIONS = 200;
	// Warm up disk cache / JIT with one throwaway pass.
	let WPAPI = require( distPath );
	new WPAPI( { endpoint: 'http://localhost/wp-json' } );
	const times = [];
	for ( let i = 0; i < ITERATIONS; i++ ) {
		delete require.cache[ require.resolve( distPath ) ];
		WPAPI = require( distPath );
		const t0 = performance.now();
		new WPAPI( { endpoint: 'http://localhost/wp-json' } );
		times.push( performance.now() - t0 );
	}
	times.sort( ( a, b ) => a - b );
	const mean = times.reduce( ( a, b ) => a + b, 0 ) / times.length;
	console.log( JSON.stringify( { mean, median: times[ Math.floor( times.length / 2 ) ] } ) );
`;
const micro = JSON.parse( execFileSync( process.execPath, [ '-e', microScript ], { encoding: 'utf8' } ) );
console.log( `bootstrap micro (200 iter)     median ${ micro.median.toFixed( 3 ) }ms  mean ${ micro.mean.toFixed( 3 ) }ms` );
