'use strict';
var expect = require( 'chai' ).expect;

var inherit = require( 'util' ).inherits;

var filterMixins = require( '../../../../lib/mixins/filters' );
var WPRequest = require( '../../../../lib/constructors/wp-request' );

describe( 'mixins: filter', function() {
	var Req;
	var req;
	var getQueryStr;

	beforeEach(function() {
		Req = function() {
			WPRequest.apply( this, arguments );
		};
		inherit( Req, WPRequest );

		req = new Req();

		getQueryStr = function( req ) {
			var query = req
				._renderQuery()
				.replace( /^\?/, '' );
			return decodeURIComponent( query );
		};
	});

	describe( '.filter()', function() {

		beforeEach(function() {
			Req.prototype.filter = filterMixins.filter;
		});

		it( 'mixin method is defined', function() {
			expect( filterMixins ).to.have.property( 'filter' );
		});

		it( 'is a function', function() {
			expect( filterMixins.filter ).to.be.a( 'function' );
		});

		it( 'supports chaining', function() {
			expect( req.filter() ).to.equal( req );
		});

		it( 'will nave no effect if called with no filter value', function() {
			var result = req.filter( 'a' );
			expect( getQueryStr( result ) ).to.equal( '' );
		});

		it( 'sets the filter query parameter on a request instance', function() {
			var result = req.filter( 'a', 'b' );
			expect( getQueryStr( result ) ).to.equal( 'filter[a]=b' );
		});

		it( 'can set multiple filters on the request', function() {
			var result = req.filter( 'a', 'b' ).filter( 'c', 'd' );
			expect( getQueryStr( result ) ).to.equal( 'filter[a]=b&filter[c]=d' );
		});

		it( 'will overwrite previously-set filter values', function() {
			var result = req.filter( 'a', 'b' ).filter( 'a', 'd' );
			expect( getQueryStr( result ) ).to.equal( 'filter[a]=d' );
		});

		it( 'will unset a filter if called with an empty string', function() {
			var result = req.filter( 'a', 'b' ).filter( 'a', '' );
			expect( getQueryStr( result ) ).to.equal( '' );
		});

		it( 'will unset a filter if called with null', function() {
			var result = req.filter( 'a', 'b' ).filter( 'a', null );
			expect( getQueryStr( result ) ).to.equal( '' );
		});

		it( 'can set multiple filters in one call when passed an object', function() {
			var result = req.filter({
				a: 'b',
				c: 'd',
				e: 'f'
			});
			expect( getQueryStr( result ) ).to.equal( 'filter[a]=b&filter[c]=d&filter[e]=f' );
		});

		it( 'can set multiple filters on the request when passed an object', function() {
			var result = req
				.filter({
					a: 'b',
					c: 'd'
				})
				.filter({
					e: 'f'
				});
			expect( getQueryStr( result ) ).to.equal( 'filter[a]=b&filter[c]=d&filter[e]=f' );
		});

		it( 'will overwrite multiple previously-set filter values when passed an object', function() {
			var result = req
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

	describe( 'taxonomy()', function() {

		beforeEach(function() {
			Req.prototype.taxonomy = filterMixins.taxonomy;
		});

		it( 'mixin is defined', function() {
			expect( filterMixins ).to.have.property( 'taxonomy' );
		});

		it( 'is a function', function() {
			expect( filterMixins.taxonomy ).to.be.a( 'function' );
		});

		it( 'supports chaining', function() {
			expect( req.taxonomy( 'tag', 'foo' ) ).to.equal( req );
		});

		describe( 'argument type check errors', function() {

			it( 'errors if no term is provided', function() {
				expect(function() { req.taxonomy( 'tag' ); }).to.throw();
			});

			it( 'does not error if the term is a string', function() {
				expect(function() { req.taxonomy( 'tag', 'cat' ); }).not.to.throw();
			});

			it( 'does not error if the term is an array of strings', function() {
				expect(function() { req.taxonomy( 'tag', [ 'cat', 'dog' ] ); }).not.to.throw();
			});

			it( 'does not error if term is a number', function() {
				expect(function() { req.taxonomy( 'cat', 7 ); }).not.to.throw();
			});

			it( 'does not error if term is an array of numbers', function() {
				expect(function() { req.taxonomy( 'cat', [ 7, 11 ] ); }).not.to.throw();
			});

			it( 'errors if the term is null', function() {
				expect(function() { req.taxonomy( 'tag', null ); }).to.throw();
			});

			it( 'errors if the term is a boolean', function() {
				expect(function() { req.taxonomy( 'tag', true ); }).to.throw();
				expect(function() { req.taxonomy( 'tag', false ); }).to.throw();
			});

			it( 'errors if the term is a Date', function() {
				expect(function() { req.taxonomy( 'tag', new Date() ); }).to.throw();
			});

			it( 'errors if the term is an object', function() {
				expect(function() { req.taxonomy( 'tag', {} ); }).to.throw();
			});

			it( 'errors if the term is an array of types other than strings or numbers', function() {
				expect(function() { req.taxonomy( 'tag', [ null ] ); }).to.throw();
			});

			it( 'errors if the term is not all strings or numbers', function() {
				expect(function() { req.taxonomy( 'tag', [ 'cat', null ] ); }).to.throw();
				expect(function() { req.taxonomy( 'cat', [ 7, null ] ); }).to.throw();
				expect(function() { req.taxonomy( 'cat', [ 'foo', 7 ] ); }).to.throw();
			});

		});

		describe( 'filter name aliasing behavior', function() {

			it( 'sets the "category_name" filter for categories where the term is a string', function() {
				var result = req.taxonomy( 'category', 'str' );
				expect( getQueryStr( result ) ).to.equal( 'filter[category_name]=str' );
			});

			it( 'sets the "cat" filter for categories where the term is a number', function() {
				var result = req.taxonomy( 'category', 7 );
				expect( getQueryStr( result ) ).to.equal( 'filter[cat]=7' );
			});

			it( 'sets the "tag" filter if the taxonomy is "post_tag"', function() {
				var result = req.taxonomy( 'post_tag', 'sometag' );
				expect( getQueryStr( result ) ).to.equal( 'filter[tag]=sometag' );
			});

		});

		describe( 'filter value setting behavior', function() {

			it( 'de-duplicates taxonomy terms (will only set a term once)', function() {
				var result = req.taxonomy( 'tag', 'cat' ).taxonomy( 'tag', 'cat' );
				expect( getQueryStr( result ) ).to.equal( 'filter[tag]=cat' );
			});

			it( 'de-dupes the taxonomy list when called with an array', function() {
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

			it( 'supports setting an array of string terms', function() {
				// TODO: Multiple terms may be deprecated by API!
				var result = req.taxonomy( 'tag', [ 'a', 'b' ] );
				expect( getQueryStr( result ) ).to.equal( 'filter[tag]=a+b' );
			});

			it( 'supports setting an array of numeric terms', function() {
				// TODO: Multiple terms may be deprecated by API!
				var result = req.taxonomy( 'tag', [ 1, 2 ] );
				expect( getQueryStr( result ) ).to.equal( 'filter[tag]=1+2' );
			});

			it( 'does not overwrite previously-specified terms on subsequent calls', function() {
				// TODO: Multiple terms may be deprecated by API!
				var result = req.taxonomy( 'tag', 'a' ).taxonomy( 'tag', [ 'b' ] );
				expect( getQueryStr( result ) ).to.equal( 'filter[tag]=a+b' );
			});

			it( 'sorts provided terms', function() {
				var result = req.taxonomy( 'tag', 'z' ).taxonomy( 'tag', 'a' );
				expect( getQueryStr( result ) ).to.equal( 'filter[tag]=a+z' );
			});

		});

	});

	describe( 'category()', function() {

		beforeEach(function() {
			// By only applying .category and not .taxonomy, we implicitly test that
			// .category does not depend on the .taxonomy mixin having been added
			Req.prototype.category = filterMixins.category;
		});

		it( 'mixin is defined', function() {
			expect( filterMixins ).to.have.property( 'category' );
		});

		it( 'is a function', function() {
			expect( filterMixins.category ).to.be.a( 'function' );
		});

		it( 'supports chaining', function() {
			expect( req.category( 'foo' ) ).to.equal( req );
		});

		it( 'is an alias for .taxonomy( "category", ... )', function() {
			Req.prototype.taxonomy = filterMixins.taxonomy;
			[ 'str', 7, [ 'a', 'b' ] ].forEach(function( term ) {
				var result1 = ( new Req() ).category( term );
				var result2 = ( new Req() ).taxonomy( 'category', term );
				expect( getQueryStr( result1 ) ).to.equal( getQueryStr( result2 ) );
			});
		});

		it( 'sets the "category_name" filter for categories where the term is a string', function() {
			var result = req.category( 'str' );
			expect( getQueryStr( result ) ).to.equal( 'filter[category_name]=str' );
		});

		it( 'sets the "cat" filter for categories where the term is a number', function() {
			var result = req.category( 7 );
			expect( getQueryStr( result ) ).to.equal( 'filter[cat]=7' );
		});

	});

	describe( 'tag()', function() {

		beforeEach(function() {
			// By only applying .tag and not .taxonomy, we implicitly test that
			// .tag does not depend on the .taxonomy mixin having been added
			Req.prototype.tag = filterMixins.tag;
		});

		it( 'mixin is defined', function() {
			expect( filterMixins ).to.have.property( 'tag' );
		});

		it( 'is a function', function() {
			expect( filterMixins.tag ).to.be.a( 'function' );
		});

		it( 'supports chaining', function() {
			expect( req.tag( 'foo' ) ).to.equal( req );
		});

		it( 'is an alias for .taxonomy( "tag", ... )', function() {
			Req.prototype.taxonomy = filterMixins.taxonomy;
			[ 'str', 7, [ 'a', 'b' ] ].forEach(function( term ) {
				var result1 = ( new Req() ).tag( term );
				var result2 = ( new Req() ).taxonomy( 'tag', term );
				expect( getQueryStr( result1 ) ).to.equal( getQueryStr( result2 ) );
			});
		});

		it( 'sets the "tag" filter', function() {
			var result = req.tag( 'str' );
			expect( getQueryStr( result ) ).to.equal( 'filter[tag]=str' );
		});

	});

	describe( 'date filters', function() {

		describe( 'year()', function() {

			beforeEach(function() {
				// By only applying .year and not .filter, we implicitly test that
				// .year does not depend on the .filter mixin having been added
				Req.prototype.year = filterMixins.year;
			});

			it( 'mixin is defined', function() {
				expect( filterMixins ).to.have.property( 'year' );
			});

			it( 'is a function', function() {
				expect( filterMixins.year ).to.be.a( 'function' );
			});

			it( 'supports chaining', function() {
				expect( req.year( 'foo' ) ).to.equal( req );
			});

			it( 'is an alias for .filter( "year", ... )', function() {
				Req.prototype.filter = filterMixins.filter;
				var result1 = ( new Req() ).year( '2015' );
				var result2 = ( new Req() ).filter( 'year', '2015' );
				expect( getQueryStr( result1 ) ).to.equal( getQueryStr( result2 ) );
			});

			it( 'sets the "year" filter', function() {
				var result = req.year( 'str' );
				expect( getQueryStr( result ) ).to.equal( 'filter[year]=str' );
			});

		});

		describe( 'month()', function() {

			beforeEach(function() {
				// By only applying .month and not .filter, we implicitly test that
				// .month does not depend on the .filter mixin having been added
				Req.prototype.month = filterMixins.month;
			});

			it( 'mixin is defined', function() {
				expect( filterMixins ).to.have.property( 'month' );
			});

			it( 'is a function', function() {
				expect( filterMixins.month ).to.be.a( 'function' );
			});

			it( 'supports chaining', function() {
				expect( req.month( 'foo' ) ).to.equal( req );
			});

			it( 'is an alias for .filter( "monthnum", ... )', function() {
				Req.prototype.filter = filterMixins.filter;
				var result1 = ( new Req() ).month( 7 );
				var result2 = ( new Req() ).filter( 'monthnum', 7 );
				expect( getQueryStr( result1 ) ).to.equal( getQueryStr( result2 ) );
			});

			it( 'sets the "monthnum" filter', function() {
				var result = req.month( 1 );
				expect( getQueryStr( result ) ).to.equal( 'filter[monthnum]=1' );
			});

			it( 'converts named months into their numeric monthnum equivalent', function() {
				var result = req.month( 'March' );
				expect( getQueryStr( result ) ).to.equal( 'filter[monthnum]=3' );
			});

			it( 'returns without setting any filter if an invalid month string is provided', function() {
				var result = req.month( 'Not a month' )._renderURI();
				expect( result.match( /filter/ ) ).to.equal( null );
			});

			it( 'returns without setting any filter if an invalid argument is provided', function() {
				var result = req.month( [ 'arrrr', 'i', 'be', 'an', 'array!' ] )._renderURI();
				expect( result.match( /filter/ ) ).to.equal( null );
			});

		});

		describe( 'day()', function() {

			beforeEach(function() {
				// By only applying .day and not .filter, we implicitly test that
				// .day does not depend on the .filter mixin having been added
				Req.prototype.day = filterMixins.day;
			});

			it( 'mixin is defined', function() {
				expect( filterMixins ).to.have.property( 'day' );
			});

			it( 'is a function', function() {
				expect( filterMixins.day ).to.be.a( 'function' );
			});

			it( 'supports chaining', function() {
				expect( req.day( 'foo' ) ).to.equal( req );
			});

			it( 'is an alias for .filter( "day", ... )', function() {
				Req.prototype.filter = filterMixins.filter;
				var result1 = ( new Req() ).day( '2015' );
				var result2 = ( new Req() ).filter( 'day', '2015' );
				expect( getQueryStr( result1 ) ).to.equal( getQueryStr( result2 ) );
			});

			it( 'sets the "day" filter', function() {
				var result = req.day( 'str' );
				expect( getQueryStr( result ) ).to.equal( 'filter[day]=str' );
			});

		});

	});

});
