'use strict';
const { expect } = require( 'chai' );

const inherit = require( 'util' ).inherits;

const parameterMixins = require( '../../../../lib/mixins/parameters' );
const WPRequest = require( '../../../../lib/constructors/wp-request' );

describe( 'mixins: parameters', () => {
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

	describe( 'date parameters', () => {

		describe( '.before()', () => {

			beforeEach( () => {
				Req.prototype.before = parameterMixins.before;
			});

			it( 'mixin method is defined', () => {
				expect( parameterMixins ).to.have.property( 'before' );
			});

			it( 'is a function', () => {
				expect( parameterMixins.before ).to.be.a( 'function' );
			});

			it( 'supports chaining', () => {
				expect( req.before( '1933-11-01' ) ).to.equal( req );
			});

			it( 'throws an error when called with a missing or invalid time', () => {
				expect( () => {
					req.before();
				}).to.throw( 'Invalid time value' );
			});

			it( 'sets the "before" query parameter as an ISO 8601 Date', () => {
				const result = req.before( '2016-07-01' );
				expect( getQueryStr( result ) ).to.equal( 'before=2016-07-01T00:00:00.000Z' );
			});

			it( 'sets the "before" query parameter when provided a Date object', () => {
				const date = new Date( 1986, 2, 22 );
				const result = req.before( date );
				// use .match and regex to avoid time zone-induced false negatives
				expect( getQueryStr( result ) ).to.match( /^before=1986-03-22T\d{2}:\d{2}:\d{2}.\d{3}Z$/ );
			});

		});

		describe( '.after()', () => {

			beforeEach( () => {
				Req.prototype.after = parameterMixins.after;
			});

			it( 'mixin method is defined', () => {
				expect( parameterMixins ).to.have.property( 'after' );
			});

			it( 'is a function', () => {
				expect( parameterMixins.after ).to.be.a( 'function' );
			});

			it( 'supports chaining', () => {
				expect( req.after( '1992-04-22' ) ).to.equal( req );
			});

			it( 'throws an error when called with a missing or invalid time', () => {
				expect( () => {
					req.after();
				}).to.throw( 'Invalid time value' );
			});

			it( 'sets the "after" query parameter when provided a value', () => {
				const result = req.after( '2016-03-22' );
				expect( getQueryStr( result ) ).to.equal( 'after=2016-03-22T00:00:00.000Z' );
			});

			it( 'sets the "after" query parameter when provided a Date object', () => {
				const date = new Date( 1987, 11, 7 );
				const result = req.after( date );
				// use .match and regex to avoid time zone-induced false negatives
				expect( getQueryStr( result ) ).to.match( /^after=1987-12-07T\d{2}:\d{2}:\d{2}.\d{3}Z$/ );
			});

		});

	});

	describe( '.author()', () => {

		beforeEach( () => {
			Req.prototype.author = parameterMixins.author;
		});

		it( 'mixin method is defined', () => {
			expect( parameterMixins ).to.have.property( 'author' );
		});

		it( 'is a function', () => {
			expect( parameterMixins.author ).to.be.a( 'function' );
		});

		it( 'supports chaining', () => {
			expect( req.author( 1 ) ).to.equal( req );
		});

		it( 'has no effect when called with no argument', () => {
			const result = req.author();
			expect( getQueryStr( result ) ).to.equal( '' );
		});

		it( 'throws an error when called with a non-string, non-numeric value', () => {
			expect( () => { req.author({}); }).to.throw();
		});

		it( 'sets the "author" query parameter when provided a numeric value', () => {
			const result = req.author( 1138 );
			expect( getQueryStr( result ) ).to.equal( 'author=1138' );
		});

		it( 'sets the "author_name" filter when provided a string value', () => {
			const result = req.author( 'jamesagarfield' );
			expect( getQueryStr( result ) ).to.equal( 'filter[author_name]=jamesagarfield' );
		});

		it( 'is chainable, and replaces author_name values on subsequent calls', () => {
			const result = req.author( 'fforde' ).author( 'bronte' );
			expect( result ).to.equal( req );
			expect( getQueryStr( result ) ).to.equal( 'filter[author_name]=bronte' );
		});

		it( 'is chainable, and replaces author ID values on subsequent calls', () => {
			const result = req.author( 1847 );
			expect( getQueryStr( result ) ).to.equal( 'author=1847' );
		});

		it( 'unsets author when called with an empty string', () => {
			const result = req.author( 'jorge-luis-borges' ).author( '' );
			expect( getQueryStr( result ) ).to.equal( '' );
		});

		it( 'unsets author when called with null', () => {
			const result = req.author( 7 ).author( null );
			expect( getQueryStr( result ) ).to.equal( '' );
		});

		it( 'unsets author parameter when called with author name string', () => {
			const result = req.author( 7 ).author( 'haruki-murakami' );
			expect( getQueryStr( result ) ).to.equal( 'filter[author_name]=haruki-murakami' );
		});

		it( 'unsets author name filter when called with numeric author id', () => {
			const result = req.author( 'haruki-murakami' ).author( 7 );
			expect( getQueryStr( result ) ).to.equal( 'author=7' );
		});

	});

	describe( '.parent()', () => {

		beforeEach( () => {
			Req.prototype.parent = parameterMixins.parent;
		});

		it( 'mixin method is defined', () => {
			expect( parameterMixins ).to.have.property( 'parent' );
		});

		it( 'is a function', () => {
			expect( parameterMixins.parent ).to.be.a( 'function' );
		});

		it( 'supports chaining', () => {
			expect( req.parent() ).to.equal( req );
		});

		it( 'has no effect when called with no argument', () => {
			const result = req.parent();
			expect( getQueryStr( result ) ).to.equal( '' );
		});

		it( 'sets the "parent" query parameter when provided a value', () => {
			const result = req.parent( 42 );
			expect( getQueryStr( result ) ).to.equal( 'parent=42' );
		});

		it( 'replaces values on subsequent calls', () => {
			const result = req.parent( 42 ).parent( 2501 );
			expect( getQueryStr( result ) ).to.equal( 'parent=2501' );
		});

		it( 'can pass an array of parent values', () => {
			const result = req.parent([ 42, 2501 ]);
			expect( getQueryStr( result ) ).to.equal( 'parent[]=2501&parent[]=42' );
		});

	});

	describe( '.post()', () => {

		beforeEach( () => {
			Req.prototype.post = parameterMixins.post;
		});

		it( 'mixin method is defined', () => {
			expect( parameterMixins ).to.have.property( 'post' );
		});

		it( 'is a function', () => {
			expect( parameterMixins.post ).to.be.a( 'function' );
		});

		it( 'supports chaining', () => {
			expect( req.post() ).to.equal( req );
		});

		it( 'has no effect when called with no argument', () => {
			const result = req.post();
			expect( getQueryStr( result ) ).to.equal( '' );
		});

		it( 'sets the "post" query parameter when provided a value', () => {
			const result = req.post( 3263827 );
			expect( getQueryStr( result ) ).to.equal( 'post=3263827' );
		});

		it( 'overwrites previously-set values on subsequent calls', () => {
			const result = req.post( 1138 ).post( 2501 );
			expect( getQueryStr( result ) ).to.equal( 'post=2501' );
		});

	});

	describe( '.password()', () => {

		beforeEach( () => {
			Req.prototype.password = parameterMixins.password;
		});

		it( 'mixin method is defined', () => {
			expect( parameterMixins ).to.have.property( 'password' );
		});

		it( 'is a function', () => {
			expect( parameterMixins.password ).to.be.a( 'function' );
		});

		it( 'supports chaining', () => {
			expect( req.password() ).to.equal( req );
		});

		it( 'has no effect when called with no argument', () => {
			const result = req.password();
			expect( getQueryStr( result ) ).to.equal( '' );
		});

		it( 'sets the "password" query parameter when provided a value', () => {
			const result = req.password( 'correct horse battery staple' );
			expect( getQueryStr( result ) ).to.equal( 'password=correct horse battery staple' );
		});

		it( 'overwrites previously-set values on subsequent calls', () => {
			const result = req.password( 'correct horse' ).password( 'battery staple' );
			expect( getQueryStr( result ) ).to.equal( 'password=battery staple' );
		});

	});

	describe( '.status()', () => {

		beforeEach( () => {
			Req.prototype.status = parameterMixins.status;
		});

		it( 'mixin method is defined', () => {
			expect( parameterMixins ).to.have.property( 'status' );
		});

		it( 'is a function', () => {
			expect( parameterMixins.status ).to.be.a( 'function' );
		});

		it( 'supports chaining', () => {
			expect( req.status( 'publish' ) ).to.equal( req );
		});

		it( 'sets the "status" query parameter when provided a value', () => {
			const result = req.status( 'future' );
			expect( getQueryStr( result ) ).to.equal( 'status=future' );
		});

		it( 'sets an array of "status" query values when provided an array of strings', () => {
			const result = req.status([ 'future', 'draft' ]);
			expect( getQueryStr( result ) ).to.equal( 'status[]=draft&status[]=future' );
		});

	});

	describe( '.sticky()', () => {

		beforeEach( () => {
			Req.prototype.sticky = parameterMixins.sticky;
		});

		it( 'mixin method is defined', () => {
			expect( parameterMixins ).to.have.property( 'sticky' );
		});

		it( 'is a function', () => {
			expect( parameterMixins.sticky ).to.be.a( 'function' );
		});

		it( 'supports chaining', () => {
			expect( req.sticky() ).to.equal( req );
		});

		it( 'has no effect when called with no argument', () => {
			const result = req.sticky();
			expect( getQueryStr( result ) ).to.equal( '' );
		});

		it( 'sets the "sticky" query parameter when provided a value', () => {
			const result = req.sticky( true );
			expect( getQueryStr( result ) ).to.equal( 'sticky=true' );
		});

		it( 'overwrites previously-set values on subsequent calls', () => {
			const result = req.sticky( 1 ).sticky( 0 );
			expect( getQueryStr( result ) ).to.equal( 'sticky=0' );
		});

	});

	describe( 'categories()', () => {

		beforeEach( () => {
			Req.prototype.categories = parameterMixins.categories;
		});

		it( 'mixin is defined', () => {
			expect( parameterMixins ).to.have.property( 'categories' );
		});

		it( 'is a function', () => {
			expect( parameterMixins.categories ).to.be.a( 'function' );
		});

		it( 'supports chaining', () => {
			expect( req.categories( 7 ) ).to.equal( req );
		});

		it( 'sets the "categories" parameter for a single category ID', () => {
			const result = req.categories( 7 );
			expect( getQueryStr( result ) ).to.equal( 'categories=7' );
		});

		it( 'sets the "categories" parameter for multiple category IDs', () => {
			const result = req.categories([ 7, 13 ]);
			expect( getQueryStr( result ) ).to.equal( 'categories[]=13&categories[]=7' );
		});

	});

	describe( 'category()', () => {

		beforeEach( () => {
			Req.prototype.category = parameterMixins.category;
		});

		it( 'mixin is defined', () => {
			expect( parameterMixins ).to.have.property( 'category' );
		});

		it( 'is a function', () => {
			expect( parameterMixins.category ).to.be.a( 'function' );
		});

		it( 'supports chaining', () => {
			expect( req.category( 'foo' ) ).to.equal( req );
		});

		it( 'sets the "categories" parameter for a single category ID', () => {
			const result = req.category( 7 );
			expect( getQueryStr( result ) ).to.equal( 'categories=7' );
		});

		it( 'sets the "categories" parameter for multiple category IDs', () => {
			const result = req.category([ 7, 13 ]);
			expect( getQueryStr( result ) ).to.equal( 'categories[]=13&categories[]=7' );
		});

		it( 'sets the "category_name" filter for categories where the term is a string [DEPRECATED]', () => {
			const result = req.category( 'fiction' );
			expect( getQueryStr( result ) ).to.equal( 'filter[category_name]=fiction' );
		});

	});

	describe( 'excludeCategories()', () => {

		beforeEach( () => {
			Req.prototype.excludeCategories = parameterMixins.excludeCategories;
		});

		it( 'mixin is defined', () => {
			expect( parameterMixins ).to.have.property( 'excludeCategories' );
		});

		it( 'is a function', () => {
			expect( parameterMixins.excludeCategories ).to.be.a( 'function' );
		});

		it( 'supports chaining', () => {
			expect( req.excludeCategories( 7 ) ).to.equal( req );
		});

		it( 'sets the "categories_exclude" parameter for a single category ID', () => {
			const result = req.excludeCategories( 7 );
			expect( getQueryStr( result ) ).to.equal( 'categories_exclude=7' );
		});

		it( 'sets the "categories_exclude" parameter for multiple category IDs', () => {
			const result = req.excludeCategories([ 7, 13 ]);
			expect( getQueryStr( result ) ).to.equal( 'categories_exclude[]=13&categories_exclude[]=7' );
		});

	});

	describe( 'tags()', () => {

		beforeEach( () => {
			Req.prototype.tags = parameterMixins.tags;
		});

		it( 'mixin is defined', () => {
			expect( parameterMixins ).to.have.property( 'tags' );
		});

		it( 'is a function', () => {
			expect( parameterMixins.tags ).to.be.a( 'function' );
		});

		it( 'supports chaining', () => {
			expect( req.tags( 7 ) ).to.equal( req );
		});

		it( 'sets the "tags" parameter for a single category ID', () => {
			const result = req.tags( 7 );
			expect( getQueryStr( result ) ).to.equal( 'tags=7' );
		});

		it( 'sets the "tags" parameter for multiple category IDs', () => {
			const result = req.tags([ 7, 13 ]);
			expect( getQueryStr( result ) ).to.equal( 'tags[]=13&tags[]=7' );
		});

		it( 'sets the "tags" parameter for multiple category IDs provided as numeric strings', () => {
			const result = req.tags([ '7', '13' ]);
			expect( getQueryStr( result ) ).to.equal( 'tags[]=13&tags[]=7' );
		});

	});

	describe( 'tag()', () => {

		beforeEach( () => {
			Req.prototype.tag = parameterMixins.tag;
		});

		it( 'mixin is defined', () => {
			expect( parameterMixins ).to.have.property( 'tag' );
		});

		it( 'is a function', () => {
			expect( parameterMixins.tag ).to.be.a( 'function' );
		});

		it( 'supports chaining', () => {
			expect( req.tag( 7 ) ).to.equal( req );
		});

		it( 'sets the "tag" parameter for a single category ID', () => {
			const result = req.tag( 7 );
			expect( getQueryStr( result ) ).to.equal( 'tags=7' );
		});

		it( 'sets the "tags" parameter for multiple category IDs', () => {
			const result = req.tag([ 7, 13 ]);
			expect( getQueryStr( result ) ).to.equal( 'tags[]=13&tags[]=7' );
		});

		it( 'sets the "tags" parameter for multiple category IDs provided as numeric strings', () => {
			const result = req.tag([ '7', '13' ]);
			expect( getQueryStr( result ) ).to.equal( 'tags[]=13&tags[]=7' );
		});

		it( 'sets the "tag" filter when the term is a string [DEPRECATED]', () => {
			const result = req.tag( 'bagpipe-techno' );
			expect( getQueryStr( result ) ).to.equal( 'filter[tag]=bagpipe-techno' );
		});

	});

	describe( 'excludeTags()', () => {

		beforeEach( () => {
			Req.prototype.excludeTags = parameterMixins.excludeTags;
		});

		it( 'mixin is defined', () => {
			expect( parameterMixins ).to.have.property( 'excludeTags' );
		});

		it( 'is a function', () => {
			expect( parameterMixins.excludeTags ).to.be.a( 'function' );
		});

		it( 'supports chaining', () => {
			expect( req.excludeTags( 7 ) ).to.equal( req );
		});

		it( 'sets the "tags_exclude" parameter for a single category ID', () => {
			const result = req.excludeTags( 7 );
			expect( getQueryStr( result ) ).to.equal( 'tags_exclude=7' );
		});

		it( 'sets the "tags_exclude" parameter for multiple category IDs', () => {
			const result = req.excludeTags([ 7, 13 ]);
			expect( getQueryStr( result ) ).to.equal( 'tags_exclude[]=13&tags_exclude[]=7' );
		});

		it( 'sets the "tags_exclude" parameter for multiple category IDs provided as numeric strings', () => {
			const result = req.excludeTags([ '7', '13' ]);
			expect( getQueryStr( result ) ).to.equal( 'tags_exclude[]=13&tags_exclude[]=7' );
		});

	});

});
