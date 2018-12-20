'use strict';

const simplifyObject = require( '../../../../build/scripts/simplify-object' );

const fullPostsCollectionRouteDefinition = require( './posts-collection-route-definition.json' );

describe( 'simplifyObject', () => {

	it( 'is a function', () => {
		expect( typeof simplifyObject ).toBe( 'function' );
	} );

	it( 'passes through strings without modification', () => {
		expect( typeof simplifyObject( 'foo' ) ).toBe( 'string' );
		expect( simplifyObject( 'foo' ) ).toBe( 'foo' );
	} );

	it( 'passes through numbers without modification', () => {
		expect( typeof simplifyObject( 7 ) ).toBe( 'number' );
		expect( simplifyObject( 7 ) ).toBe( 7 );
	} );

	it( 'passes through booleans without modification', () => {
		expect( typeof simplifyObject( true ) ).toBe( 'boolean' );
		expect( simplifyObject( true ) ).toBe( true );
	} );

	it( 'passes through arrays of simple values without modification', () => {
		expect( Array.isArray( simplifyObject( [] ) ) ).toBe( true );
		expect( simplifyObject( [ 1, 2, 3 ] ) ).toEqual( [ 1, 2, 3 ] );
		expect( simplifyObject( [ 'a', 'b', 'c' ] ) ).toEqual( [ 'a', 'b', 'c' ] );
		expect( simplifyObject( [ true, false ] ) ).toEqual( [ true, false ] );
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
		} ) ).toEqual( {
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
		} ) ).toEqual( {
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
		} ) ).toEqual( {
			args: {
				context: {},
			},
		} );
	} );

	it( 'properly transforms a full route definition object', () => {
		expect( simplifyObject( fullPostsCollectionRouteDefinition ) ).toEqual( {
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
				args: {},
			} ],
		} );
	} );

} );
