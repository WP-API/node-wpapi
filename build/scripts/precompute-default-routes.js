'use strict';

/**
 * Precompute the default-route data that wpapi.ts consumes at runtime.
 *
 * Runs lib/route-tree's `build` over lib/data/default-routes.json (the
 * human-editable source of truth) and writes:
 *
 * - lib/data/default-route-tree.json: the parsed route tree, so default-mode
 *   WPAPI instances skip route parsing entirely at startup.
 * - lib/data/default-route-handlers.ts: a type-only module declaring each
 *   generated handler factory and its request methods, so the default-mode
 *   handler surface is typed instead of falling through to WPAPI's string
 *   index signature.
 *
 * Both output files are generated -- do not edit them by hand. Re-run this
 * script (`npm run precompute-routes`) whenever default-routes.json or the
 * route parsing pipeline changes; CI fails if the committed output is stale.
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
const endpointFactories = require( '../../lib/endpoint-factories' );
const mixins = require( '../../lib/mixins' );
const defaultRoutes = require( '../../lib/data/default-routes.json' );

const treeOutputPath = path.resolve( __dirname, '../../lib/data/default-route-tree.json' );
const typesOutputPath = path.resolve( __dirname, '../../lib/data/default-route-handlers.ts' );

// Typings generation
// ===============================================================================================

/**
 * Signatures (and docs) for every mixin method lib/mixins can apply to a
 * generated request prototype, keyed by method name. Parameter types mirror
 * the runtime behavior documented in lib/mixins/parameters.ts and filters.ts;
 * all methods chain, so each returns `this`.
 */
const MIXIN_SIGNATURES = {
	categories: {
		args: 'categories: string | number | Array<string | number>',
		doc: 'Retrieve only records associated with one of the provided category IDs.',
	},
	category: {
		args: 'category: string | number | Array<string | number>',
		doc: 'Query by category slug or ID.',
		deprecated: 'Use .categories() and query by category IDs.',
	},
	excludeCategories: {
		args: 'categories: string | number | Array<string | number>',
		doc: 'Exclude records associated with any of the provided category IDs.',
	},
	tags: {
		args: 'tags: string | number | Array<string | number>',
		doc: 'Retrieve only records associated with one of the provided tag IDs.',
	},
	tag: {
		args: 'tag: string | number | Array<string | number>',
		doc: 'Query by tag slug or ID.',
		deprecated: 'Use .tags() and query by term IDs.',
	},
	excludeTags: {
		args: 'tags: string | number | Array<string | number>',
		doc: 'Exclude records associated with any of the provided tag IDs.',
	},
	post: {
		args: 'post: string | number | Array<string | number>',
		doc: 'Specify the post for which to retrieve records.',
	},
	forPost: {
		args: 'post: string | number | Array<string | number>',
		doc: 'Specify the post for which to retrieve records.',
		deprecated: 'Use .post().',
	},
	author: {
		args: 'author?: string | number | null',
		doc: 'Query for records by a specific author ID (or, deprecated, nicename string).',
	},
	parent: {
		args: 'parent: string | number | Array<string | number>',
		doc: 'Retrieve only records which are children of the provided parent ID.',
	},
	password: {
		args: 'password: string',
		doc: 'Specify the password with which to access a protected post\'s content.',
	},
	status: {
		args: 'status: string | string[]',
		doc: 'Specify one or more post statuses for which to return records.',
	},
	sticky: {
		args: 'sticky: boolean',
		doc: 'Return only sticky posts (true) or only non-sticky posts (false).',
	},
	filter: {
		args: 'props: string | Record<string, unknown>, value?: unknown',
		doc: 'Set a WP_Query filter parameter (requires the rest-filter plugin).',
	},
	taxonomy: {
		args: 'taxonomy: string, term: string | number | Array<string | number>',
		doc: 'Filter results to those matching the specified taxonomy term(s).',
	},
	year: {
		args: 'year: number',
		doc: 'Filter results to those published in the specified year.',
	},
	month: {
		args: 'month: number | string',
		doc: 'Filter results to those published in the specified month.',
	},
	day: {
		args: 'day: number',
		doc: 'Filter results to those published on the specified day of the month.',
	},
	before: {
		args: 'date: string | Date',
		doc: 'Retrieve only records published before the specified date.',
	},
	after: {
		args: 'date: string | Date',
		doc: 'Retrieve only records published after the specified date.',
	},
};

/**
 * Convert snake_case or kebab-case to camelCase, exactly as
 * lib/resource-handler-spec.ts does when naming setter methods.
 */
function camelCase( name ) {
	return name.replace(
		/[_-]+\w/g,
		match => match.replace( /[_-]+/, '' ).toUpperCase(),
	);
}

/** Convert a namespace or resource string to a PascalCase identifier fragment. */
function pascalCase( name ) {
	return camelCase( name.replace( /[^a-zA-Z0-9]+/g, '-' ) )
		.replace( /^\w/, c => c.toUpperCase() );
}

/** Quote a property name in interface output if it is not a valid identifier. */
function propertyName( name ) {
	return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test( name ) ? name : `'${ name }'`;
}

/**
 * Collect the path-part setter methods one resource's tree defines, keyed by
 * setter method name, mirroring lib/resource-handler-spec.ts's walk order and
 * first-wins deduplication so the winning node's shape drives the signature.
 */
function collectSetterNodes( levels ) {
	const setters = {};
	const walk = ( node ) => {
		if ( node.level > 0 ) {
			node.names.forEach( ( name ) => {
				const setterFnName = camelCase( name );
				if ( ! setters[ setterFnName ] ) {
					setters[ setterFnName ] = node;
				}
			} );
		}
		if ( node.children ) {
			Object.keys( node.children ).forEach( key => walk( node.children[ key ] ) );
		}
	};
	Object.keys( levels ).forEach( ( key ) => {
		if ( key !== '_getArgs' ) {
			walk( levels[ key ] );
		}
	} );
	return setters;
}

/**
 * Collect the names of every mixin method the endpoint-request stage would
 * apply for a resource's GET arguments (whether or not it lands on the
 * prototype -- inherited-method collisions are filtered by the caller, which
 * only inspects prototype own-properties).
 */
function collectMixinMethodNames( levels ) {
	const methodNames = new Set();
	Object.keys( levels._getArgs || {} ).forEach( ( param ) => {
		if ( typeof mixins[ param ] === 'object' ) {
			Object.keys( mixins[ param ] ).forEach( name => methodNames.add( name ) );
		}
	} );
	return methodNames;
}

/** Render one method declaration (with a preceding docblock) at one-tab depth. */
function renderMethod( name, args, returnType, doc, deprecated ) {
	const docLines = [ '\t/**', `\t * ${ doc }` ];
	if ( deprecated ) {
		docLines.push( `\t * @deprecated ${ deprecated }` );
	}
	docLines.push( '\t */' );
	return `${ docLines.join( '\n' ) }\n\t${ propertyName( name ) }( ${ args } ): ${ returnType };`;
}

/**
 * Generate the source of lib/data/default-route-handlers.ts: one request
 * interface per resource (its methods read off the actual generated
 * EndpointRequest prototype, so the types cannot drift from the runtime
 * surface), one handler-factory interface per namespace, and the aggregate
 * types wpapi.ts consumes.
 */
function generateHandlerTypes( parsedTree ) {
	const factories = endpointFactories.generate( parsedTree );
	const namespaceBlocks = [];
	const requestBlocks = [];
	const namespaceEntries = [];

	Object.keys( parsedTree ).forEach( ( namespace ) => {
		const nsPrefix = pascalCase( namespace );
		const factoryLines = [];

		Object.keys( parsedTree[ namespace ] ).forEach( ( resource ) => {
			const levels = parsedTree[ namespace ][ resource ];
			const setterNodes = collectSetterNodes( levels );
			const mixinMethodNames = collectMixinMethodNames( levels );
			const prototype = factories[ namespace ][ resource ].Ctor.prototype;
			const methodNames = Object.getOwnPropertyNames( prototype )
				.filter( name => name !== 'constructor' );

			const methods = methodNames.map( ( name ) => {
				// Mixins are applied to the prototype before setters, so a name
				// present in both sets is the mixin at runtime.
				if ( mixinMethodNames.has( name ) ) {
					const signature = MIXIN_SIGNATURES[ name ];
					if ( ! signature ) {
						throw new Error( `No signature defined for mixin method .${ name }()` );
					}
					return renderMethod( name, signature.args, 'this', signature.doc, signature.deprecated );
				}
				const node = setterNodes[ name ];
				if ( ! node ) {
					throw new Error( `Cannot classify prototype method .${ name }() on ${ namespace }/${ resource }` );
				}
				if ( node.namedGroup ) {
					return renderMethod(
						name,
						'val: string | number',
						'this',
						`Set the ${ name } path part of this request URL.`,
					);
				}
				return renderMethod(
					name,
					'val?: string | number',
					'this',
					`Select the ${ node.component } collection, or one resource within it.`,
				);
			} );

			const requestType = `${ nsPrefix }${ pascalCase( resource ) }Request`;
			if ( methods.length ) {
				requestBlocks.push(
					`/** Request handler for ${ namespace }/${ resource } routes. */\n` +
					`export interface ${ requestType } extends WPRequest {\n${ methods.join( '\n\n' ) }\n}`,
				);
			} else {
				requestBlocks.push(
					`/** Request handler for ${ namespace }/${ resource } routes. */\n` +
					`export type ${ requestType } = WPRequest;`,
				);
			}

			factoryLines.push(
				`\t/** Create a request handler for ${ namespace }/${ resource }. */\n` +
				`\t${ propertyName( resource ) }( options?: Record<string, unknown> ): ${ requestType };`,
			);
		} );

		namespaceBlocks.push(
			`/** Handler factory methods for the ${ namespace } namespace. */\n` +
			`export interface ${ nsPrefix }Handlers {\n${ factoryLines.join( '\n\n' ) }\n}`,
		);
		namespaceEntries.push( `\t'${ namespace }': ${ nsPrefix }Handlers;` );
	} );

	return `/**
 * Typings for the endpoint handler factories a default-mode WPAPI instance is
 * bootstrapped with, and for the request handlers those factories create.
 *
 * GENERATED FILE -- do not edit. Regenerate with \`npm run precompute-routes\`
 * (build/scripts/precompute-default-routes.js), which derives these interfaces
 * from lib/data/default-routes.json via the same pipeline that generates the
 * runtime handlers.
 *
 * This module is type-only: it has no runtime output.
 *
 * @module default-route-handlers
 */

type WPRequest = InstanceType<typeof import( '../constructors/wp-request' )>;

${ requestBlocks.join( '\n\n' ) }

${ namespaceBlocks.join( '\n\n' ) }

/**
 * The handler factories assigned to default namespaces, keyed by namespace
 * string as consumed by \`.namespace()\`.
 */
export interface DefaultNamespaceHandlers {
${ namespaceEntries.join( '\n' ) }
}

/**
 * The handler factories assigned directly onto a default-mode WPAPI instance
 * (those of the default wp/v2 namespace).
 */
export type DefaultRouteHandlers = DefaultNamespaceHandlers[ 'wp/v2' ];
`;
}

// Generate and write the output files
// ===============================================================================================

const tree = routeTree.build( defaultRoutes );

fs.writeFileSync( treeOutputPath, JSON.stringify( tree, null, '\t' ) + '\n' );

fs.writeFileSync( typesOutputPath, generateHandlerTypes( tree ) );

const resourceCount = Object.keys( tree )
	.reduce( ( sum, ns ) => sum + Object.keys( tree[ ns ] ).length, 0 );
console.log(
	`Wrote ${ path.relative( process.cwd(), treeOutputPath ) } and ` +
	`${ path.relative( process.cwd(), typesOutputPath ) }: ` +
	`${ Object.keys( tree ).length } namespaces, ${ resourceCount } resources`,
);
