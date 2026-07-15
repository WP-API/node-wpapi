'use strict';

// Vitest loads CommonJS source files through native Node require, which cannot
// resolve or execute the TypeScript files this codebase is migrating to. Registering
// a .ts compiler with require.extensions makes native require both resolve
// extensionless specifiers to .ts files and transpile them on load. Uses the
// project's own typescript package; inline source maps keep stack traces accurate.
const ts = require( 'typescript' );
const fs = require( 'node:fs' );

require.extensions[ '.ts' ] = ( module, filename ) => {
	const source = fs.readFileSync( filename, 'utf8' );
	const { outputText } = ts.transpileModule( source, {
		fileName: filename,
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2020,
			esModuleInterop: true,
			inlineSourceMap: true,
		},
	} );
	module._compile( outputText, filename );
};
