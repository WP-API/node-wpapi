'use strict';
var expect = require( 'chai' ).expect;

var routeTree = require( '../../../lib/route-tree' );
var endpointResponse = require( '../../../lib/data/endpoint-response.json' );

describe( 'route-tree utility', function() {

	describe( '.build()', function() {
		var tree;

		beforeEach(function() {
			tree = routeTree.build( endpointResponse.routes );
		});

		it( 'returns an object keyed by API namespace', function() {
			var keys = Object.keys( tree ).sort();
			expect( keys.length ).to.equal( 2 );
			expect( keys ).to.deep.equal([ 'oembed/1.0', 'wp/v2' ]);
		});

		it( 'includes objects for all default wp/v2 routes', function() {
			var routes = Object.keys( tree[ 'wp/v2' ] ).sort();
			expect( routes ).to.have.length( 10 );
			expect( routes.join( ',' ) ).to
				.equal( 'categories,comments,media,pages,posts,statuses,tags,taxonomies,types,users' );
		});

		it( 'includes objects for all default oembed/1.0 routes', function() {
			var routes = Object.keys( tree[ 'oembed/1.0' ] ).sort();
			expect( routes ).to.have.length( 1 );
			expect( routes.join( ',' ) ).to.equal( 'embed' );
		});

		// Inspect the .posts tree as a smoke test for whether parsing the API
		// definition object was successful
		describe( 'posts resource tree', function() {
			var posts;

			beforeEach(function() {
				posts = tree[ 'wp/v2' ].posts;
			});

			it ( 'includes a ._getArgs property', function() {
				expect( posts ).to.have.property( '_getArgs' );
				expect( posts._getArgs ).to.be.an( 'object' );
			});

			it ( '._getArgs specifies a list of supported parameters', function() {
				expect( posts ).to.have.property( '_getArgs' );
				expect( posts._getArgs ).to.be.an( 'object' );
				expect( posts._getArgs ).to.deep.equal({
					context: false,
					page: false,
					per_page: false,
					search: false,
					after: false,
					author: false,
					author_exclude: false,
					before: false,
					exclude: false,
					include: false,
					offset: false,
					order: false,
					orderby: false,
					slug: false,
					status: false,
					filter: false,
					categories: false,
					tags: false
				});
			});

			it ( 'includes a .posts property', function() {
				expect( posts ).to.have.property( 'posts' );
				expect( posts.posts ).to.be.an( 'object' );
			});

			// This is a decidedly incomplete smoke test...
			// But if this fails, so will everything else!
			it ( '.posts defines the top level of a route tree', function() {
				var routeTree = posts.posts;
				expect( routeTree ).to.have.property( 'level' );
				expect( routeTree.level ).to.equal( 0 );
				expect( routeTree ).to.have.property( 'methods' );
				expect( routeTree.methods.sort().join( '|' ) ).to.equal( 'get|head|post' );
				expect( routeTree ).to.have.property( 'namedGroup' );
				expect( routeTree.namedGroup ).to.equal( false );
				expect( routeTree ).to.have.property( 'names' );
				expect( routeTree.names ).to.deep.equal([ 'posts' ]);
				expect( routeTree ).to.have.property( 'validate' );
				expect( routeTree.validate ).to.be.a( 'function' );
				expect( routeTree ).to.have.property( 'children' );
				expect( routeTree.children ).to.be.an( 'object' );
			});

		});

	});

});
