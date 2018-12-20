'use strict';

const routeTree = require( '../../../lib/route-tree' );
const defaultRoutes = require( '../../../lib/data/default-routes.json' );

describe( 'route-tree utility', () => {

	describe( '.build()', () => {
		let tree;

		beforeEach( () => {
			tree = routeTree.build( defaultRoutes );
		} );

		it( 'returns an object keyed by API namespace', () => {
			const keys = Object.keys( tree ).sort();
			expect( keys.length ).toBe( 2 );
			expect( keys ).toEqual( [ 'oembed/1.0', 'wp/v2' ] );
		} );

		it( 'includes objects for all default wp/v2 routes', () => {
			const routes = Object.keys( tree[ 'wp/v2' ] ).sort();
			expect( routes.length ).toBe( 15 );
			expect( routes.sort() ).toEqual( [
				'block-renderer',
				'blocks',
				'categories',
				'comments',
				'media',
				'pages',
				'posts',
				'search',
				'settings',
				'statuses',
				'tags',
				'taxonomies',
				'themes',
				'types',
				'users',
			] );
		} );

		it( 'includes objects for all default oembed/1.0 routes', () => {
			const routes = Object.keys( tree[ 'oembed/1.0' ] ).sort();
			expect( routes.length ).toBe( 2 );
			expect( routes.sort().join( ',' ) ).toBe( 'embed,proxy' );
		} );

		// Inspect the .posts tree as a smoke test for whether parsing the API
		// definition object was successful
		describe( 'posts resource tree', () => {
			let posts;

			beforeEach( () => {
				posts = tree[ 'wp/v2' ].posts;
			} );

			it( 'includes a ._getArgs property', () => {
				expect( posts ).toHaveProperty( '_getArgs' );
				expect( typeof posts._getArgs ).toBe( 'object' );
			} );

			it( '._getArgs specifies a list of supported parameters', () => {
				expect( posts ).toHaveProperty( '_getArgs' );
				expect( typeof posts._getArgs ).toBe( 'object' );
				expect( posts._getArgs ).toEqual( {
					context: {},
					page: {},
					per_page: {},
					search: {},
					after: {},
					author: {},
					author_exclude: {},
					before: {},
					exclude: {},
					id: {},
					include: {},
					offset: {},
					order: {},
					orderby: {},
					parent: {},
					password: {},
					slug: {},
					status: {},
					sticky: {},
					categories: {},
					categories_exclude: {},
					tags: {},
					tags_exclude: {},
				} );
			} );

			it( 'includes a .posts property', () => {
				expect( posts ).toHaveProperty( 'posts' );
				expect( typeof posts.posts ).toBe( 'object' );
			} );

			// This is a decidedly incomplete smoke test...
			// But if this fails, so will everything else!
			it( '.posts defines the top level of a route tree', () => {
				const routeTree = posts.posts;
				expect( routeTree ).toHaveProperty( 'level' );
				expect( routeTree.level ).toBe( 0 );
				expect( routeTree ).toHaveProperty( 'methods' );
				expect( routeTree.methods.sort().join( '|' ) ).toBe( 'get|head|post' );
				expect( routeTree ).toHaveProperty( 'namedGroup' );
				expect( routeTree.namedGroup ).toBe( false );
				expect( routeTree ).toHaveProperty( 'names' );
				expect( routeTree.names ).toEqual( [ 'posts' ] );
				expect( routeTree ).toHaveProperty( 'validate' );
				expect( typeof routeTree.validate ).toBe( 'function' );
				expect( routeTree ).toHaveProperty( 'children' );
				expect( typeof routeTree.children ).toBe( 'object' );
			} );

		} );

	} );

} );
