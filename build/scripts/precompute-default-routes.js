'use strict';

/**
 * Precompute the default-route data that wpapi.ts consumes at runtime.
 *
 * Runs lib/route-tree's `build` over lib/data/default-routes.json (the
 * human-editable source of truth) and writes the parsed result to
 * lib/data/default-route-tree.json, so that default-mode WPAPI instances
 * skip route parsing entirely at startup.
 *
 * The output file is generated -- do not edit it by hand. Re-run this script
 * (`npm run precompute-routes`) whenever default-routes.json or the route
 * parsing pipeline changes; CI fails if the committed output is stale.
 *
 * @example
 *     node build/scripts/precompute-default-routes.js
 */

// The route pipeline is TypeScript source; reuse the test suite's require
// hook so this script can load it without a build step.
require( '../../tests/helpers/ts-require-hook' );

const fs = require( 'fs' );
const path = require( 'path' );

const routeTree = require( '../../lib/route-tree' );
const defaultRoutes = require( '../../lib/data/default-routes.json' );

const outputPath = path.resolve( __dirname, '../../lib/data/default-route-tree.json' );

const tree = routeTree.build( defaultRoutes );

fs.writeFileSync( outputPath, JSON.stringify( tree, null, '\t' ) + '\n' );

const resourceCount = Object.keys( tree )
	.reduce( ( sum, ns ) => sum + Object.keys( tree[ ns ] ).length, 0 );
console.log(
	`Wrote ${ path.relative( process.cwd(), outputPath ) }: ` +
	`${ Object.keys( tree ).length } namespaces, ${ resourceCount } resources`,
);
