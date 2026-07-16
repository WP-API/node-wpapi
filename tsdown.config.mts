import { defineConfig } from 'tsdown';

// Node / bundler consumers: dual ESM + CJS, generated .d.ts, generated
// package.json `exports` map. `index` is the batteries-included main export
// (WPAPI with the fetch transport bound in); `fetch` is an alias subpath for
// the same thing. Each entry gets its own build (rather than one multi-entry
// config) because sharing a chunk across entries breaks rolldown's CJS
// `module.exports` codegen, so bundling each entry's full dependency closure
// independently is the safe option, at the cost of some duplicated code
// across the files.
const nodeEntry = ( name, input ) => ( {
	entry: { [ name ]: input },
	format: [ 'esm', 'cjs' ],
	platform: 'node',
	dts: true,
	exports: true,
	outDir: 'dist',
} );

// Browser <script> consumers: a UMD bundle exposing the `WPAPI` global. tsdown
// auto-externalizes anything in package.json dependencies/optionalDependencies;
// for a <script>-tag bundle there's no node_modules to resolve those against,
// so every real dependency must be forced back into the bundle (`qs`/`li` are
// plain isomorphic JS). The transport's lazy `node:fs/promises` require stays
// in the bundle unresolved — it is only reachable from the Node-specific
// path-string upload branch, which has no meaning in a browser.
const browserEntry = ( name, input ) => ( {
	entry: { [ name ]: input },
	format: 'umd',
	globalName: 'WPAPI',
	platform: 'browser',
	dts: false,
	outDir: 'dist/browser',
	deps: {
		alwaysBundle: [ 'qs', 'li' ],
	},
} );

// `superagent` is a stub which throws a migration error; it remains an entry so
// the package keeps exporting the wpapi/superagent subpath removed in 2.0.0.
export default defineConfig( [
	nodeEntry( 'index', 'fetch/index.ts' ),
	nodeEntry( 'fetch', 'fetch/index.ts' ),
	nodeEntry( 'superagent', 'superagent/index.ts' ),
	browserEntry( 'wpapi', 'fetch/index.ts' ),
] );
