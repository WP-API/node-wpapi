'use strict';
const { expect } = require( 'chai' );

const simplifyObject = require( '../../../../lib/data/simplify-object' );

const fullPostsCollectionRouteDefinition = require( './posts-collection-route-definition.json' );

describe( 'simplifyObject', () => {

	it( 'is a function', () => {
		expect( simplifyObject ).to.be.a( 'function' );
	} );

	it( 'passes through strings without modification', () => {
		expect( simplifyObject( 'foo' ) ).to.be.a( 'string' );
		expect( simplifyObject( 'foo' ) ).to.equal( 'foo' );
	} );

	it( 'passes through numbers without modification', () => {
		expect( simplifyObject( 7 ) ).to.be.a( 'number' );
		expect( simplifyObject( 7 ) ).to.equal( 7 );
	} );

	it( 'passes through booleans without modification', () => {
		expect( simplifyObject( true ) ).to.be.a( 'boolean' );
		expect( simplifyObject( true ) ).to.equal( true );
	} );

	it( 'passes through arrays of simple values without modification', () => {
		expect( simplifyObject( [] ) ).to.be.an( 'array' );
		expect( simplifyObject( [ 1, 2, 3 ] ) ).to.deep.equal( [ 1, 2, 3 ] );
		expect( simplifyObject( [ 'a', 'b', 'c' ] ) ).to.deep.equal( [ 'a', 'b', 'c' ] );
		expect( simplifyObject( [ true, false ] ) ).to.deep.equal( [ true, false ] );
	} );

	it( 'passes through most objects without modification', () => {
		expect( simplifyObject( {
			some: 'set',
			of: 'basic',
			nested: {
				properties: [ 'of', 'no', {
					particular: 'consequence',
				} ],
				nr: 7,
			},
		} ) ).to.deep.equal( {
			some: 'set',
			of: 'basic',
			nested: {
				properties: [ 'of', 'no', {
					particular: 'consequence',
				} ],
				nr: 7,
			},
		} );
	} );

	it( 'strips out _links properties', () => {
		expect( simplifyObject( {
			some: 'object with a',
			_links: {
				prop: 'within it',
			},
		} ) ).to.deep.equal( {
			some: 'object with a',
		} );
	} );

	it( 'removes unneeded keys from children of .args objects', () => {
		expect( simplifyObject( {
			args: {
				context: {
					required: false,
					other: 'properties',
					go: 'here',
				},
			},
		} ) ).to.deep.equal( {
			args: {
				context: {},
			},
		} );
	} );

	it( 'properly transforms a full route definition object', () => {
		expect( simplifyObject( fullPostsCollectionRouteDefinition ) ).to.deep.equal( {
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
					tags: {},
				},
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
					tags: {},
				},
			} ],
		} );
	} );

} );
