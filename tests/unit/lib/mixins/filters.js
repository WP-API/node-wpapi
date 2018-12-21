'use strict';

const filterMixins = require( '../../../../lib/mixins/filters' );
const WPRequest = require( '../../../../lib/constructors/wp-request' );

const getQueryStr = ( req ) => {
	const query = req
		._renderQuery()
		.replace( /^\?/, '' );
	return decodeURIComponent( query );
};

describe( 'mixins: filter', () => {
	let Req;
	let req;

	beforeEach( () => {
		Req = class extends WPRequest {};
		req = new Req();
	} );

	describe( '.filter()', () => {

		beforeEach( () => {
			Req.prototype.filter = filterMixins.filter;
		} );

		it( 'mixin method is defined', () => {
			expect( filterMixins ).toHaveProperty( 'filter' );
		} );

		it( 'is a function', () => {
			expect( typeof filterMixins.filter ).toBe( 'function' );
		} );

		it( 'supports chaining', () => {
			expect( req.filter() ).toBe( req );
		} );

		it( 'will nave no effect if called with no filter value', () => {
			const result = req.filter( 'a' );
			expect( getQueryStr( result ) ).toBe( '' );
		} );

		it( 'sets the filter query parameter on a request instance', () => {
			const result = req.filter( 'a', 'b' );
			expect( getQueryStr( result ) ).toBe( 'filter[a]=b' );
		} );

		it( 'can set multiple filters on the request', () => {
			const result = req.filter( 'a', 'b' ).filter( 'c', 'd' );
			expect( getQueryStr( result ) ).toBe( 'filter[a]=b&filter[c]=d' );
		} );

		it( 'will overwrite previously-set filter values', () => {
			const result = req.filter( 'a', 'b' ).filter( 'a', 'd' );
			expect( getQueryStr( result ) ).toBe( 'filter[a]=d' );
		} );

		it( 'will unset a filter if called with an empty string', () => {
			const result = req.filter( 'a', 'b' ).filter( 'a', '' );
			expect( getQueryStr( result ) ).toBe( '' );
		} );

		it( 'will unset a filter if called with null', () => {
			const result = req.filter( 'a', 'b' ).filter( 'a', null );
			expect( getQueryStr( result ) ).toBe( '' );
		} );

		it( 'can set multiple filters in one call when passed an object', () => {
			const result = req.filter( {
				a: 'b',
				c: 'd',
				e: 'f',
			} );
			expect( getQueryStr( result ) ).toBe( 'filter[a]=b&filter[c]=d&filter[e]=f' );
		} );

		it( 'can set multiple filters on the request when passed an object', () => {
			const result = req
				.filter( {
					a: 'b',
					c: 'd',
				} )
				.filter( {
					e: 'f',
				} );
			expect( getQueryStr( result ) ).toBe( 'filter[a]=b&filter[c]=d&filter[e]=f' );
		} );

		it( 'will overwrite multiple previously-set filter values when passed an object', () => {
			const result = req
				.filter( {
					a: 'b',
					c: 'd',
					e: 'f',
				} )
				.filter( {
					a: 'g',
					c: 'h',
					i: 'j',
				} );
			expect( getQueryStr( result ) ).toBe( 'filter[a]=g&filter[c]=h&filter[e]=f&filter[i]=j' );
		} );

	} );

	describe( 'taxonomy()', () => {

		beforeEach( () => {
			Req.prototype.taxonomy = filterMixins.taxonomy;
		} );

		it( 'mixin is defined', () => {
			expect( filterMixins ).toHaveProperty( 'taxonomy' );
		} );

		it( 'is a function', () => {
			expect( typeof filterMixins.taxonomy ).toBe( 'function' );
		} );

		it( 'supports chaining', () => {
			expect( req.taxonomy( 'tag', 'foo' ) ).toBe( req );
		} );

		describe( 'argument type check errors', () => {

			it( 'errors if no term is provided', () => {
				expect( () => { req.taxonomy( 'tag' ); } ).toThrow();
			} );

			it( 'does not error if the term is a string', () => {
				expect( () => { req.taxonomy( 'tag', 'cat' ); } ).not.toThrow();
			} );

			it( 'does not error if the term is an array of strings', () => {
				expect( () => { req.taxonomy( 'tag', [ 'cat', 'dog' ] ); } ).not.toThrow();
			} );

			it( 'does not error if term is a number', () => {
				expect( () => { req.taxonomy( 'cat', 7 ); } ).not.toThrow();
			} );

			it( 'does not error if term is an array of numbers', () => {
				expect( () => { req.taxonomy( 'cat', [ 7, 11 ] ); } ).not.toThrow();
			} );

			it( 'errors if the term is null', () => {
				expect( () => { req.taxonomy( 'tag', null ); } ).toThrow();
			} );

			it( 'errors if the term is a boolean', () => {
				expect( () => { req.taxonomy( 'tag', true ); } ).toThrow();
				expect( () => { req.taxonomy( 'tag', false ); } ).toThrow();
			} );

			it( 'errors if the term is a Date', () => {
				expect( () => { req.taxonomy( 'tag', new Date() ); } ).toThrow();
			} );

			it( 'errors if the term is an object', () => {
				expect( () => { req.taxonomy( 'tag', {} ); } ).toThrow();
			} );

			it( 'errors if the term is an array of types other than strings or numbers', () => {
				expect( () => { req.taxonomy( 'tag', [ null ] ); } ).toThrow();
			} );

			it( 'errors if the term is not all strings or numbers', () => {
				expect( () => { req.taxonomy( 'tag', [ 'cat', null ] ); } ).toThrow();
				expect( () => { req.taxonomy( 'cat', [ 7, null ] ); } ).toThrow();
				expect( () => { req.taxonomy( 'cat', [ 'foo', 7 ] ); } ).toThrow();
			} );

		} );

		describe( 'filter name aliasing behavior', () => {

			it( 'sets the "category_name" filter for categories where the term is a string', () => {
				const result = req.taxonomy( 'category', 'str' );
				expect( getQueryStr( result ) ).toBe( 'filter[category_name]=str' );
			} );

			it( 'sets the "cat" filter for categories where the term is a number', () => {
				const result = req.taxonomy( 'category', 7 );
				expect( getQueryStr( result ) ).toBe( 'filter[cat]=7' );
			} );

			it( 'sets the "tag" filter if the taxonomy is "post_tag"', () => {
				const result = req.taxonomy( 'post_tag', 'sometag' );
				expect( getQueryStr( result ) ).toBe( 'filter[tag]=sometag' );
			} );

		} );

		describe( 'filter value setting behavior', () => {

			it( 'de-duplicates taxonomy terms (will only set a term once)', () => {
				const result = req.taxonomy( 'tag', 'cat' ).taxonomy( 'tag', 'cat' );
				expect( getQueryStr( result ) ).toBe( 'filter[tag]=cat' );
			} );

			it( 'de-dupes the taxonomy list when called with an array', () => {
				req.taxonomy( 'post_tag', [
					'disclosure',
					'alunageorge',
					'disclosure',
					'lorde',
					'lorde',
					'clean-bandit',
				] );
				expect( req._taxonomyFilters ).toEqual( {
					tag: [ 'alunageorge', 'clean-bandit', 'disclosure', 'lorde' ],
				} );
			} );

			it( 'supports setting an array of string terms', () => {
				// TODO: Multiple terms may be deprecated by API!
				const result = req.taxonomy( 'tag', [ 'a', 'b' ] );
				expect( getQueryStr( result ) ).toBe( 'filter[tag]=a+b' );
			} );

			it( 'supports setting an array of numeric terms', () => {
				// TODO: Multiple terms may be deprecated by API!
				const result = req.taxonomy( 'tag', [ 1, 2 ] );
				expect( getQueryStr( result ) ).toBe( 'filter[tag]=1+2' );
			} );

			it( 'does not overwrite previously-specified terms on subsequent calls', () => {
				// TODO: Multiple terms may be deprecated by API!
				const result = req.taxonomy( 'tag', 'a' ).taxonomy( 'tag', [ 'b' ] );
				expect( getQueryStr( result ) ).toBe( 'filter[tag]=a+b' );
			} );

			it( 'sorts provided terms', () => {
				const result = req.taxonomy( 'tag', 'z' ).taxonomy( 'tag', 'a' );
				expect( getQueryStr( result ) ).toBe( 'filter[tag]=a+z' );
			} );

		} );

	} );

	describe( '.path()', () => {

		beforeEach( () => {
			Req.prototype.path = filterMixins.path;
		} );

		it( 'mixin is defined', () => {
			expect( filterMixins ).toHaveProperty( 'path' );
		} );

		it( 'is a function', () => {
			expect( typeof filterMixins.path ).toBe( 'function' );
		} );

		it( 'supports chaining', () => {
			expect( req.path( 'tag', 'foo' ) ).toBe( req );
		} );

		it( 'should create the URL for retrieving a post by path', () => {
			const path = req.path( 'nested/page' );
			expect( getQueryStr( path ) ).toBe( 'filter[pagename]=nested/page' );
		} );

	} );

	describe( 'date filters', () => {

		describe( 'year()', () => {

			beforeEach( () => {
				// By only applying .year and not .filter, we implicitly test that
				// .year does not depend on the .filter mixin having been added
				Req.prototype.year = filterMixins.year;
			} );

			it( 'mixin is defined', () => {
				expect( filterMixins ).toHaveProperty( 'year' );
			} );

			it( 'is a function', () => {
				expect( typeof filterMixins.year ).toBe( 'function' );
			} );

			it( 'supports chaining', () => {
				expect( req.year( 'foo' ) ).toBe( req );
			} );

			it( 'is an alias for .filter( "year", ... )', () => {
				Req.prototype.filter = filterMixins.filter;
				const result1 = ( new Req() ).year( '2015' );
				const result2 = ( new Req() ).filter( 'year', '2015' );
				expect( getQueryStr( result1 ) ).toBe( getQueryStr( result2 ) );
			} );

			it( 'sets the "year" filter', () => {
				const result = req.year( 'str' );
				expect( getQueryStr( result ) ).toBe( 'filter[year]=str' );
			} );

		} );

		describe( 'month()', () => {

			beforeEach( () => {
				// By only applying .month and not .filter, we implicitly test that
				// .month does not depend on the .filter mixin having been added
				Req.prototype.month = filterMixins.month;
			} );

			it( 'mixin is defined', () => {
				expect( filterMixins ).toHaveProperty( 'month' );
			} );

			it( 'is a function', () => {
				expect( typeof filterMixins.month ).toBe( 'function' );
			} );

			it( 'supports chaining', () => {
				expect( req.month( 'foo' ) ).toBe( req );
			} );

			it( 'is an alias for .filter( "monthnum", ... )', () => {
				Req.prototype.filter = filterMixins.filter;
				const result1 = ( new Req() ).month( 7 );
				const result2 = ( new Req() ).filter( 'monthnum', 7 );
				expect( getQueryStr( result1 ) ).toBe( getQueryStr( result2 ) );
			} );

			it( 'sets the "monthnum" filter', () => {
				const result = req.month( 1 );
				expect( getQueryStr( result ) ).toBe( 'filter[monthnum]=1' );
			} );

			it( 'converts named months into their numeric monthnum equivalent', () => {
				const result = req.month( 'March' );
				expect( getQueryStr( result ) ).toBe( 'filter[monthnum]=3' );
			} );

			it( 'returns without setting any filter if an invalid month string is provided', () => {
				const result = req.month( 'Not a month' ).toString();
				expect( result.match( /filter/ ) ).toBe( null );
			} );

			it( 'returns without setting any filter if an invalid argument is provided', () => {
				const result = req.month( [ 'arrrr', 'i', 'be', 'an', 'array!' ] ).toString();
				expect( result.match( /filter/ ) ).toBe( null );
			} );

		} );

		describe( 'day()', () => {

			beforeEach( () => {
				// By only applying .day and not .filter, we implicitly test that
				// .day does not depend on the .filter mixin having been added
				Req.prototype.day = filterMixins.day;
			} );

			it( 'mixin is defined', () => {
				expect( filterMixins ).toHaveProperty( 'day' );
			} );

			it( 'is a function', () => {
				expect( typeof filterMixins.day ).toBe( 'function' );
			} );

			it( 'supports chaining', () => {
				expect( req.day( 'foo' ) ).toBe( req );
			} );

			it( 'is an alias for .filter( "day", ... )', () => {
				Req.prototype.filter = filterMixins.filter;
				const result1 = ( new Req() ).day( '2015' );
				const result2 = ( new Req() ).filter( 'day', '2015' );
				expect( getQueryStr( result1 ) ).toBe( getQueryStr( result2 ) );
			} );

			it( 'sets the "day" filter', () => {
				const result = req.day( 'str' );
				expect( getQueryStr( result ) ).toBe( 'filter[day]=str' );
			} );

		} );

	} );

} );
