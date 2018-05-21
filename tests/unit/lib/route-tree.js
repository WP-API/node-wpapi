'use strict';
const { expect } = require( 'chai' );

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
			expect( keys.length ).to.equal( 2 );
			expect( keys ).to.deep.equal( [ 'oembed/1.0', 'wp/v2' ] );
		} );

		it( 'includes objects for all default wp/v2 routes', () => {
			const routes = Object.keys( tree[ 'wp/v2' ] ).sort();
			expect( routes ).to.have.length( 11 );
			expect( routes.join( ',' ) ).to
				.equal( 'categories,comments,media,pages,posts,settings,statuses,tags,taxonomies,types,users' );
		} );

		it( 'includes objects for all default oembed/1.0 routes', () => {
			const routes = Object.keys( tree[ 'oembed/1.0' ] ).sort();
			expect( routes ).to.have.length( 1 );
			expect( routes.join( ',' ) ).to.equal( 'embed' );
		} );

		// Inspect the .posts tree as a smoke test for whether parsing the API
		// definition object was successful
		describe( 'posts resource tree', () => {
			let posts;

			beforeEach( () => {
				posts = tree[ 'wp/v2' ].posts;
			} );

			it( 'includes a ._getArgs property', () => {
				expect( posts ).to.have.property( '_getArgs' );
				expect( posts._getArgs ).to.be.an( 'object' );
			} );

			it( '._getArgs specifies a list of supported parameters', () => {
				expect( posts ).to.have.property( '_getArgs' );
				expect( posts._getArgs ).to.be.an( 'object' );
				expect( posts._getArgs ).to.deep.equal( {
					context: {},
					page: {},
					per_page: {},
					search: {},
					after: {},
					author: {},
					author_exclude: {},
					before: {},
					exclude: {},
					include: {},
					offset: {},
					order: {},
					orderby: {},
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
				expect( posts ).to.have.property( 'posts' );
				expect( posts.posts ).to.be.an( 'object' );
			} );

			// This is a decidedly incomplete smoke test...
			// But if this fails, so will everything else!
			it( '.posts defines the top level of a route tree', () => {
				const routeTree = posts.posts;
				expect( routeTree ).to.have.property( 'level' );
				expect( routeTree.level ).to.equal( 0 );
				expect( routeTree ).to.have.property( 'methods' );
				expect( routeTree.methods.sort().join( '|' ) ).to.equal( 'get|head|post' );
				expect( routeTree ).to.have.property( 'namedGroup' );
				expect( routeTree.namedGroup ).to.equal( false );
				expect( routeTree ).to.have.property( 'names' );
				expect( routeTree.names ).to.deep.equal( [ 'posts' ] );
				expect( routeTree ).to.have.property( 'validate' );
				expect( routeTree.validate ).to.be.a( 'function' );
				expect( routeTree ).to.have.property( 'children' );
				expect( routeTree.children ).to.be.an( 'object' );
			} );

		} );

	} );

} );
