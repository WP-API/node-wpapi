'use strict';
const { expect } = require( 'chai' );

const inherit = require( 'util' ).inherits;

const filterMixins = require( '../../../../lib/mixins/filters' );
const WPRequest = require( '../../../../lib/constructors/wp-request' );

describe( 'mixins: filter', () => {
	let Req;
	let req;
	let getQueryStr;

	beforeEach( () => {
		Req = function() {
			WPRequest.apply( this, arguments );
		};
		inherit( Req, WPRequest );

		req = new Req();

		getQueryStr = ( req ) => {
			const query = req
				._renderQuery()
				.replace( /^\?/, '' );
			return decodeURIComponent( query );
		};
	});

	describe( '.filter()', () => {

		beforeEach( () => {
			Req.prototype.filter = filterMixins.filter;
		});

		it( 'mixin method is defined', () => {
			expect( filterMixins ).to.have.property( 'filter' );
		});

		it( 'is a function', () => {
			expect( filterMixins.filter ).to.be.a( 'function' );
		});

		it( 'supports chaining', () => {
			expect( req.filter() ).to.equal( req );
		});

		it( 'will nave no effect if called with no filter value', () => {
			const result = req.filter( 'a' );
			expect( getQueryStr( result ) ).to.equal( '' );
		});

		it( 'sets the filter query parameter on a request instance', () => {
			const result = req.filter( 'a', 'b' );
			expect( getQueryStr( result ) ).to.equal( 'filter[a]=b' );
		});

		it( 'can set multiple filters on the request', () => {
			const result = req.filter( 'a', 'b' ).filter( 'c', 'd' );
			expect( getQueryStr( result ) ).to.equal( 'filter[a]=b&filter[c]=d' );
		});

		it( 'will overwrite previously-set filter values', () => {
			const result = req.filter( 'a', 'b' ).filter( 'a', 'd' );
			expect( getQueryStr( result ) ).to.equal( 'filter[a]=d' );
		});

		it( 'will unset a filter if called with an empty string', () => {
			const result = req.filter( 'a', 'b' ).filter( 'a', '' );
			expect( getQueryStr( result ) ).to.equal( '' );
		});

		it( 'will unset a filter if called with null', () => {
			const result = req.filter( 'a', 'b' ).filter( 'a', null );
			expect( getQueryStr( result ) ).to.equal( '' );
		});

		it( 'can set multiple filters in one call when passed an object', () => {
			const result = req.filter({
				a: 'b',
				c: 'd',
				e: 'f'
			});
			expect( getQueryStr( result ) ).to.equal( 'filter[a]=b&filter[c]=d&filter[e]=f' );
		});

		it( 'can set multiple filters on the request when passed an object', () => {
			const result = req
				.filter({
					a: 'b',
					c: 'd'
				})
				.filter({
					e: 'f'
				});
			expect( getQueryStr( result ) ).to.equal( 'filter[a]=b&filter[c]=d&filter[e]=f' );
		});

		it( 'will overwrite multiple previously-set filter values when passed an object', () => {
			const result = req
				.filter({
					a: 'b',
					c: 'd',
					e: 'f'
				})
				.filter({
					a: 'g',
					c: 'h',
					i: 'j'
				});
			expect( getQueryStr( result ) ).to.equal( 'filter[a]=g&filter[c]=h&filter[e]=f&filter[i]=j' );
		});

	});

	describe( 'taxonomy()', () => {

		beforeEach( () => {
			Req.prototype.taxonomy = filterMixins.taxonomy;
		});

		it( 'mixin is defined', () => {
			expect( filterMixins ).to.have.property( 'taxonomy' );
		});

		it( 'is a function', () => {
			expect( filterMixins.taxonomy ).to.be.a( 'function' );
		});

		it( 'supports chaining', () => {
			expect( req.taxonomy( 'tag', 'foo' ) ).to.equal( req );
		});

		describe( 'argument type check errors', () => {

			it( 'errors if no term is provided', () => {
				expect( () => { req.taxonomy( 'tag' ); }).to.throw();
			});

			it( 'does not error if the term is a string', () => {
				expect( () => { req.taxonomy( 'tag', 'cat' ); }).not.to.throw();
			});

			it( 'does not error if the term is an array of strings', () => {
				expect( () => { req.taxonomy( 'tag', [ 'cat', 'dog' ] ); }).not.to.throw();
			});

			it( 'does not error if term is a number', () => {
				expect( () => { req.taxonomy( 'cat', 7 ); }).not.to.throw();
			});

			it( 'does not error if term is an array of numbers', () => {
				expect( () => { req.taxonomy( 'cat', [ 7, 11 ] ); }).not.to.throw();
			});

			it( 'errors if the term is null', () => {
				expect( () => { req.taxonomy( 'tag', null ); }).to.throw();
			});

			it( 'errors if the term is a boolean', () => {
				expect( () => { req.taxonomy( 'tag', true ); }).to.throw();
				expect( () => { req.taxonomy( 'tag', false ); }).to.throw();
			});

			it( 'errors if the term is a Date', () => {
				expect( () => { req.taxonomy( 'tag', new Date() ); }).to.throw();
			});

			it( 'errors if the term is an object', () => {
				expect( () => { req.taxonomy( 'tag', {} ); }).to.throw();
			});

			it( 'errors if the term is an array of types other than strings or numbers', () => {
				expect( () => { req.taxonomy( 'tag', [ null ] ); }).to.throw();
			});

			it( 'errors if the term is not all strings or numbers', () => {
				expect( () => { req.taxonomy( 'tag', [ 'cat', null ] ); }).to.throw();
				expect( () => { req.taxonomy( 'cat', [ 7, null ] ); }).to.throw();
				expect( () => { req.taxonomy( 'cat', [ 'foo', 7 ] ); }).to.throw();
			});

		});

		describe( 'filter name aliasing behavior', () => {

			it( 'sets the "category_name" filter for categories where the term is a string', () => {
				const result = req.taxonomy( 'category', 'str' );
				expect( getQueryStr( result ) ).to.equal( 'filter[category_name]=str' );
			});

			it( 'sets the "cat" filter for categories where the term is a number', () => {
				const result = req.taxonomy( 'category', 7 );
				expect( getQueryStr( result ) ).to.equal( 'filter[cat]=7' );
			});

			it( 'sets the "tag" filter if the taxonomy is "post_tag"', () => {
				const result = req.taxonomy( 'post_tag', 'sometag' );
				expect( getQueryStr( result ) ).to.equal( 'filter[tag]=sometag' );
			});

		});

		describe( 'filter value setting behavior', () => {

			it( 'de-duplicates taxonomy terms (will only set a term once)', () => {
				const result = req.taxonomy( 'tag', 'cat' ).taxonomy( 'tag', 'cat' );
				expect( getQueryStr( result ) ).to.equal( 'filter[tag]=cat' );
			});

			it( 'de-dupes the taxonomy list when called with an array', () => {
				req.taxonomy( 'post_tag', [
					'disclosure',
					'alunageorge',
					'disclosure',
					'lorde',
					'lorde',
					'clean-bandit'
				]);
				expect( req._taxonomyFilters ).to.deep.equal({
					tag: [ 'alunageorge', 'clean-bandit', 'disclosure', 'lorde' ]
				});
			});

			it( 'supports setting an array of string terms', () => {
				// TODO: Multiple terms may be deprecated by API!
				const result = req.taxonomy( 'tag', [ 'a', 'b' ] );
				expect( getQueryStr( result ) ).to.equal( 'filter[tag]=a+b' );
			});

			it( 'supports setting an array of numeric terms', () => {
				// TODO: Multiple terms may be deprecated by API!
				const result = req.taxonomy( 'tag', [ 1, 2 ] );
				expect( getQueryStr( result ) ).to.equal( 'filter[tag]=1+2' );
			});

			it( 'does not overwrite previously-specified terms on subsequent calls', () => {
				// TODO: Multiple terms may be deprecated by API!
				const result = req.taxonomy( 'tag', 'a' ).taxonomy( 'tag', [ 'b' ] );
				expect( getQueryStr( result ) ).to.equal( 'filter[tag]=a+b' );
			});

			it( 'sorts provided terms', () => {
				const result = req.taxonomy( 'tag', 'z' ).taxonomy( 'tag', 'a' );
				expect( getQueryStr( result ) ).to.equal( 'filter[tag]=a+z' );
			});

		});

	});

	describe( '.path()', () => {

		beforeEach( () => {
			Req.prototype.path = filterMixins.path;
		});

		it( 'mixin is defined', () => {
			expect( filterMixins ).to.have.property( 'path' );
		});

		it( 'is a function', () => {
			expect( filterMixins.path ).to.be.a( 'function' );
		});

		it( 'supports chaining', () => {
			expect( req.path( 'tag', 'foo' ) ).to.equal( req );
		});

		it( 'should create the URL for retrieving a post by path', () => {
			const path = req.path( 'nested/page' );
			expect( getQueryStr( path ) ).to.equal( 'filter[pagename]=nested/page' );
		});

	});

	describe( 'date filters', () => {

		describe( 'year()', () => {

			beforeEach( () => {
				// By only applying .year and not .filter, we implicitly test that
				// .year does not depend on the .filter mixin having been added
				Req.prototype.year = filterMixins.year;
			});

			it( 'mixin is defined', () => {
				expect( filterMixins ).to.have.property( 'year' );
			});

			it( 'is a function', () => {
				expect( filterMixins.year ).to.be.a( 'function' );
			});

			it( 'supports chaining', () => {
				expect( req.year( 'foo' ) ).to.equal( req );
			});

			it( 'is an alias for .filter( "year", ... )', () => {
				Req.prototype.filter = filterMixins.filter;
				const result1 = ( new Req() ).year( '2015' );
				const result2 = ( new Req() ).filter( 'year', '2015' );
				expect( getQueryStr( result1 ) ).to.equal( getQueryStr( result2 ) );
			});

			it( 'sets the "year" filter', () => {
				const result = req.year( 'str' );
				expect( getQueryStr( result ) ).to.equal( 'filter[year]=str' );
			});

		});

		describe( 'month()', () => {

			beforeEach( () => {
				// By only applying .month and not .filter, we implicitly test that
				// .month does not depend on the .filter mixin having been added
				Req.prototype.month = filterMixins.month;
			});

			it( 'mixin is defined', () => {
				expect( filterMixins ).to.have.property( 'month' );
			});

			it( 'is a function', () => {
				expect( filterMixins.month ).to.be.a( 'function' );
			});

			it( 'supports chaining', () => {
				expect( req.month( 'foo' ) ).to.equal( req );
			});

			it( 'is an alias for .filter( "monthnum", ... )', () => {
				Req.prototype.filter = filterMixins.filter;
				const result1 = ( new Req() ).month( 7 );
				const result2 = ( new Req() ).filter( 'monthnum', 7 );
				expect( getQueryStr( result1 ) ).to.equal( getQueryStr( result2 ) );
			});

			it( 'sets the "monthnum" filter', () => {
				const result = req.month( 1 );
				expect( getQueryStr( result ) ).to.equal( 'filter[monthnum]=1' );
			});

			it( 'converts named months into their numeric monthnum equivalent', () => {
				const result = req.month( 'March' );
				expect( getQueryStr( result ) ).to.equal( 'filter[monthnum]=3' );
			});

			it( 'returns without setting any filter if an invalid month string is provided', () => {
				const result = req.month( 'Not a month' ).toString();
				expect( result.match( /filter/ ) ).to.equal( null );
			});

			it( 'returns without setting any filter if an invalid argument is provided', () => {
				const result = req.month( [ 'arrrr', 'i', 'be', 'an', 'array!' ] ).toString();
				expect( result.match( /filter/ ) ).to.equal( null );
			});

		});

		describe( 'day()', () => {

			beforeEach( () => {
				// By only applying .day and not .filter, we implicitly test that
				// .day does not depend on the .filter mixin having been added
				Req.prototype.day = filterMixins.day;
			});

			it( 'mixin is defined', () => {
				expect( filterMixins ).to.have.property( 'day' );
			});

			it( 'is a function', () => {
				expect( filterMixins.day ).to.be.a( 'function' );
			});

			it( 'supports chaining', () => {
				expect( req.day( 'foo' ) ).to.equal( req );
			});

			it( 'is an alias for .filter( "day", ... )', () => {
				Req.prototype.filter = filterMixins.filter;
				const result1 = ( new Req() ).day( '2015' );
				const result2 = ( new Req() ).filter( 'day', '2015' );
				expect( getQueryStr( result1 ) ).to.equal( getQueryStr( result2 ) );
			});

			it( 'sets the "day" filter', () => {
				const result = req.day( 'str' );
				expect( getQueryStr( result ) ).to.equal( 'filter[day]=str' );
			});

		});

	});

});
