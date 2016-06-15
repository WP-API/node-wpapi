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

	it( 'removes non-`.required` keys from children of .args objects', function() {
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
				context: {
					required: false
				}
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
					context: { required: false },
					page: { required: false },
					per_page: { required: false },
					search: { required: false },
					after: { required: false },
					author: { required: false },
					author_exclude: { required: false },
					before: { required: false },
					exclude: { required: false },
					include: { required: false },
					offset: { required: false },
					order: { required: false },
					orderby: { required: false },
					slug: { required: false },
					status: { required: false },
					filter: { required: false },
					categories: { required: false },
					tags: { required: false }
				}
			}, {
				methods: [ 'POST' ],
				args: {
					date: { required: false },
					date_gmt: { required: false },
					password: { required: false },
					slug: { required: false },
					status: { required: false },
					title: { required: false },
					content: { required: false },
					author: { required: false },
					excerpt: { required: false },
					featured_media: { required: false },
					comment_status: { required: false },
					ping_status: { required: false },
					format: { required: false },
					sticky: { required: false },
					categories: { required: false },
					tags: { required: false }
				}
			} ]
		});
	});

});
