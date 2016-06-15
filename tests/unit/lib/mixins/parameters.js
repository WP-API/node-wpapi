'use strict';
var expect = require( 'chai' ).expect;

var inherit = require( 'util' ).inherits;

var parameterMixins = require( '../../../../lib/mixins/parameters' );
var WPRequest = require( '../../../../lib/constructors/wp-request' );

describe( 'mixins: parameters', function() {
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

	describe( 'pagination parameters', function() {

		describe( '.page()', function() {

			beforeEach(function() {
				Req.prototype.page = parameterMixins.page;
			});

			it( 'mixin method is defined', function() {
				expect( parameterMixins ).to.have.property( 'page' );
			});

			it( 'is a function', function() {
				expect( parameterMixins.page ).to.be.a( 'function' );
			});

			it( 'supports chaining', function() {
				expect( req.page() ).to.equal( req );
			});

			it( 'has no effect when called with no argument', function() {
				var result = req.page();
				expect( getQueryStr( result ) ).to.equal( '' );
			});

			it( 'sets the "page" query parameter when provided a value', function() {
				var result = req.page( 7 );
				expect( getQueryStr( result ) ).to.equal( 'page=7' );
			});

			it( 'should be chainable and replace values when called multiple times', function() {
				var result = req.page( 71 ).page( 2 );
				expect( getQueryStr( result ) ).to.equal( 'page=2' );
			});

		});

		describe( '.perPage()', function() {

			beforeEach(function() {
				Req.prototype.perPage = parameterMixins.perPage;
			});

			it( 'mixin method is defined', function() {
				expect( parameterMixins ).to.have.property( 'perPage' );
			});

			it( 'is a function', function() {
				expect( parameterMixins.perPage ).to.be.a( 'function' );
			});

			it( 'supports chaining', function() {
				expect( req.perPage() ).to.equal( req );
			});

			it( 'has no effect when called with no argument', function() {
				var result = req.perPage();
				expect( getQueryStr( result ) ).to.equal( '' );
			});

			it( 'sets the "per_page" query parameter when provided a value', function() {
				var result = req.perPage( 7 );
				expect( getQueryStr( result ) ).to.equal( 'per_page=7' );
			});

			it( 'should be chainable and replace values when called multiple times', function() {
				var result = req.perPage( 71 ).perPage( 2 );
				expect( getQueryStr( result ) ).to.equal( 'per_page=2' );
			});

		});

	});

	describe( 'name parameters', function() {

		describe( '.slug()', function() {

			beforeEach(function() {
				Req.prototype.slug = parameterMixins.slug;
			});

			it( 'mixin method is defined', function() {
				expect( parameterMixins ).to.have.property( 'slug' );
			});

			it( 'is a function', function() {
				expect( parameterMixins.slug ).to.be.a( 'function' );
			});

			it( 'supports chaining', function() {
				expect( req.slug() ).to.equal( req );
			});

			it( 'has no effect when called with no argument', function() {
				var result = req.slug();
				expect( getQueryStr( result ) ).to.equal( '' );
			});

			it( 'sets the "slug" query parameter when provided a value', function() {
				var result = req.slug( 'my-slug' );
				expect( getQueryStr( result ) ).to.equal( 'slug=my-slug' );
			});

		});

		describe( '.name()', function() {

			beforeEach(function() {
				Req.prototype.name = parameterMixins.name;
			});

			it( 'mixin method is defined', function() {
				expect( parameterMixins ).to.have.property( 'name' );
			});

			it( 'is a function', function() {
				expect( parameterMixins.name ).to.be.a( 'function' );
			});

			it( 'supports chaining', function() {
				expect( req.name() ).to.equal( req );
			});

			it( 'has no effect when called with no argument', function() {
				var result = req.name();
				expect( getQueryStr( result ) ).to.equal( '' );
			});

			it( 'is equivalent to .slug', function() {
				Req.prototype.slug = parameterMixins.slug;
				var result1 = ( new Req() ).name( 'myname' );
				var result2 = ( new Req() ).slug( 'myname' );
				expect( getQueryStr( result1 ) ).to.equal( getQueryStr( result2 ) );
			});

			it( 'sets the "slug" query parameter when provided a value', function() {
				var result = req.name( 7 );
				expect( getQueryStr( result ) ).to.equal( 'slug=7' );
			});

		});

	});

	describe( 'search', function() {

		beforeEach(function() {
			Req.prototype.search = parameterMixins.search;
		});

		it( 'mixin method is defined', function() {
			expect( parameterMixins ).to.have.property( 'search' );
		});

		it( 'is a function', function() {
			expect( parameterMixins.search ).to.be.a( 'function' );
		});

		it( 'supports chaining', function() {
			expect( req.search() ).to.equal( req );
		});

		it( 'has no effect when called with no argument', function() {
			var result = req.search();
			expect( getQueryStr( result ) ).to.equal( '' );
		});

		it( 'sets the "search" query parameter when provided a value', function() {
			var result = req.search( 'my search string' );
			expect( getQueryStr( result ) ).to.equal( 'search=my search string' );
		});

		it( 'overwrites previously-set values on subsequent calls', function() {
			var result = req.search( 'query' ).search( 'newquery' );
			expect( getQueryStr( result ) ).to.equal( 'search=newquery' );
		});

	});

	describe( 'author', function() {

		beforeEach(function() {
			Req.prototype.author = parameterMixins.author;
		});

		it( 'mixin method is defined', function() {
			expect( parameterMixins ).to.have.property( 'author' );
		});

		it( 'is a function', function() {
			expect( parameterMixins.author ).to.be.a( 'function' );
		});

		it( 'supports chaining', function() {
			expect( req.author( 1 ) ).to.equal( req );
		});

		it( 'has no effect when called with no argument', function() {
			var result = req.author();
			expect( getQueryStr( result ) ).to.equal( '' );
		});

		it( 'throws an error when called with a non-string, non-numeric value', function() {
			expect(function() { req.author({}); }).to.throw();
		});

		it( 'sets the "author" query parameter when provided a numeric value', function() {
			var result = req.author( 1138 );
			expect( getQueryStr( result ) ).to.equal( 'author=1138' );
		});

		it( 'sets the "author_name" filter when provided a string value', function() {
			var result = req.author( 'jamesagarfield' );
			expect( getQueryStr( result ) ).to.equal( 'filter[author_name]=jamesagarfield' );
		});

		it( 'is chainable, and replaces author_name values on subsequent calls', function() {
			var result = req.author( 'fforde' ).author( 'bronte' );
			expect( result ).to.equal( req );
			expect( getQueryStr( result ) ).to.equal( 'filter[author_name]=bronte' );
		});

		it( 'is chainable, and replaces author ID values on subsequent calls', function() {
			var result = req.author( 1847 );
			expect( getQueryStr( result ) ).to.equal( 'author=1847' );
		});

		it( 'unsets author when called with an empty string', function() {
			var result = req.author( 'jorge-luis-borges' ).author( '' );
			expect( getQueryStr( result ) ).to.equal( '' );
		});

		it( 'unsets author when called with null', function() {
			var result = req.author( 7 ).author( null );
			expect( getQueryStr( result ) ).to.equal( '' );
		});

		it( 'unsets author parameter when called with author name string', function() {
			var result = req.author( 7 ).author( 'haruki-murakami' );
			expect( getQueryStr( result ) ).to.equal( 'filter[author_name]=haruki-murakami' );
		});

		it( 'unsets author name filter when called with numeric author id', function() {
			var result = req.author( 'haruki-murakami' ).author( 7 );
			expect( getQueryStr( result ) ).to.equal( 'author=7' );
		});

	});

	describe( 'parent', function() {

		beforeEach(function() {
			Req.prototype.parent = parameterMixins.parent;
		});

		it( 'mixin method is defined', function() {
			expect( parameterMixins ).to.have.property( 'parent' );
		});

		it( 'is a function', function() {
			expect( parameterMixins.parent ).to.be.a( 'function' );
		});

		it( 'supports chaining', function() {
			expect( req.parent() ).to.equal( req );
		});

		it( 'has no effect when called with no argument', function() {
			var result = req.parent();
			expect( getQueryStr( result ) ).to.equal( '' );
		});

		it( 'sets the "parent" query parameter when provided a value', function() {
			var result = req.parent( 42 );
			expect( getQueryStr( result ) ).to.equal( 'parent=42' );
		});

		it( 'merges values on subsequent calls', function() {
			// TODO: Is this how the API actually functions?
			var result = req.parent( 42 ).parent( 2501 );
			expect( getQueryStr( result ) ).to.equal( 'parent[]=2501&parent[]=42' );
		});

	});

	describe( 'forPost', function() {

		beforeEach(function() {
			Req.prototype.forPost = parameterMixins.forPost;
		});

		it( 'mixin method is defined', function() {
			expect( parameterMixins ).to.have.property( 'forPost' );
		});

		it( 'is a function', function() {
			expect( parameterMixins.forPost ).to.be.a( 'function' );
		});

		it( 'supports chaining', function() {
			expect( req.forPost() ).to.equal( req );
		});

		it( 'has no effect when called with no argument', function() {
			var result = req.forPost();
			expect( getQueryStr( result ) ).to.equal( '' );
		});

		it( 'sets the "post" query parameter when provided a value', function() {
			var result = req.forPost( 3263827 );
			expect( getQueryStr( result ) ).to.equal( 'post=3263827' );
		});

		it( 'overwrites previously-set values on subsequent calls', function() {
			var result = req.forPost( 1138 ).forPost( 2501 );
			expect( getQueryStr( result ) ).to.equal( 'post=2501' );
		});

	});

});
