'use strict';
var expect = require( 'chai' ).expect;

var simplifyObject = require( '../../../../lib/data/simplify-object' );

var fullPostsCollectionRouteDefinition = require( './posts-collection-route-definition.json' );

describe( 'simplifyObject', function() {

	it( 'is a function', function() {
		expect( simplifyObject ).to.be.a( 'function' );
	});

	it( 'passes through strings without modification', function() {
		expect( simplifyObject( 'foo' ) ).to.be.a( 'string' );
		expect( simplifyObject( 'foo' ) ).to.equal( 'foo' );
	});

	it( 'passes through numbers without modification', function() {
		expect( simplifyObject( 7 ) ).to.be.a( 'number' );
		expect( simplifyObject( 7 ) ).to.equal( 7 );
	});

	it( 'passes through booleans without modification', function() {
		expect( simplifyObject( true ) ).to.be.a( 'boolean' );
		expect( simplifyObject( true ) ).to.equal( true );
	});

	it( 'passes through arrays of simple values without modification', function() {
		expect( simplifyObject([]) ).to.be.an( 'array' );
		expect( simplifyObject([ 1, 2, 3 ]) ).to.deep.equal([ 1, 2, 3 ]);
		expect( simplifyObject([ 'a', 'b', 'c' ]) ).to.deep.equal([ 'a', 'b', 'c' ]);
		expect( simplifyObject([ true, false ]) ).to.deep.equal([ true, false ]);
	});

	it( 'passes through most objects without modification', function() {
		expect( simplifyObject({
			some: 'set',
			of: 'basic',
			nested: {
				properties: [ 'of', 'no', {
					particular: 'consequence'
				} ],
				nr: 7
			}
		}) ).to.deep.equal({
			some: 'set',
			of: 'basic',
			nested: {
				properties: [ 'of', 'no', {
					particular: 'consequence'
				} ],
				nr: 7
			}
		});
	});

	it( 'strips out _links properties', function() {
		expect( simplifyObject({
			some: 'object with a',
			_links: {
				prop: 'within it'
			}
		}) ).to.deep.equal({
			some: 'object with a'
		});
	});

	it( 'removes unneeded keys from children of .args objects', function() {
		expect( simplifyObject({
			args: {
				context: {
					required: false,
					other: 'properties',
					go: 'here'
				}
			}
		}) ).to.deep.equal({
			args: {
				context: {}
			}
		});
	});

	it( 'properly transforms a full route definition object', function() {
		expect( simplifyObject( fullPostsCollectionRouteDefinition ) ).to.deep.equal({
			namespace: 'wp/v2',
			methods: [ 'GET', 'POST' ],
			endpoints: [ {
				methods: [ 'GET' ],
				args: {
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
					slug: {},
					status: {},
					filter: {},
					categories: {},
					tags: {}
				}
			}, {
				methods: [ 'POST' ],
				args: {
					date: {},
					date_gmt: {},
					password: {},
					slug: {},
					status: {},
					title: {},
					content: {},
					author: {},
					excerpt: {},
					featured_media: {},
					comment_status: {},
					ping_status: {},
					format: {},
					sticky: {},
					categories: {},
					tags: {}
				}
			} ]
		});
	});

});
