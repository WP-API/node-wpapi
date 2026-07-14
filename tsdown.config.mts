import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsdown';

const shim = ( name ) => fileURLToPath( new URL( `./build/browser-shims/${ name }.js`, import.meta.url ) );

// Node / bundler consumers: dual ESM + CJS, generated .d.ts, generated
// package.json `exports` map. `fetch` and `superagent` are alias subpaths
// bound to their respective HTTP transports; `index` is the transport-less
// base export used internally by both. Each gets its own build (rather than
// one multi-entry config) because `fetch`/`superagent` both require `index`:
// sharing a chunk across entries breaks rolldown's CJS `module.exports`
// codegen, so bundling each entry's full dependency closure independently
// is the safe option, at the cost of some duplicated code across the files.
const nodeEntry = ( name, input ) => ( {
	entry: { [ name ]: input },
	format: [ 'esm', 'cjs' ],
	platform: 'node',
	dts: true,
	exports: true,
	outDir: 'dist',
} );

// Browser <script> consumers: UMD bundles exposing the `WPAPI` global. tsdown
// auto-externalizes anything in package.json dependencies/optionalDependencies;
// for a <script>-tag bundle there's no node_modules to resolve those against,
// so every real dependency must be forced back into the bundle. `node-fetch`
// and `form-data` are then aliased to thin stand-ins for the browser globals
// they mirror; `qs`/`li` are plain isomorphic JS and just bundle as-is.
const browserEntry = ( name, input ) => ( {
	entry: { [ name ]: input },
	format: 'umd',
	globalName: 'WPAPI',
	platform: 'browser',
	dts: false,
	outDir: 'dist/browser',
	alias: {
		fs: shim( 'fs' ),
		'node-fetch': shim( 'node-fetch' ),
		'form-data': shim( 'form-data' ),
	},
	deps: {
		alwaysBundle: [ 'node-fetch', 'form-data', 'qs', 'li', 'superagent' ],
	},
} );

export default defineConfig( [
	nodeEntry( 'index', 'wpapi.js' ),
	nodeEntry( 'fetch', 'fetch/index.js' ),
	nodeEntry( 'superagent', 'superagent/index.js' ),
	browserEntry( 'wpapi', 'fetch/index.js' ),
	browserEntry( 'wpapi-superagent', 'superagent/index.js' ),
] );
