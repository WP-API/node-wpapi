'use strict';

const parameterMixins = require( '../../../../lib/mixins/parameters' );
const WPRequest = require( '../../../../lib/constructors/wp-request' );

const getQueryStr = ( req ) => {
	const query = req
		._renderQuery()
		.replace( /^\?/, '' );
	return decodeURIComponent( query );
};

describe( 'mixins: parameters', () => {
	let Req;
	let req;

	beforeEach( () => {
		Req = class extends WPRequest {};
		req = new Req();
	} );

	describe( 'date parameters', () => {

		describe( '.before()', () => {

			beforeEach( () => {
				Req.prototype.before = parameterMixins.before;
			} );

			it( 'mixin method is defined', () => {
				expect( parameterMixins ).toHaveProperty( 'before' );
			} );

			it( 'is a function', () => {
				expect( typeof parameterMixins.before ).toBe( 'function' );
			} );

			it( 'supports chaining', () => {
				expect( req.before( '1933-11-01' ) ).toBe( req );
			} );

			it( 'throws an error when called with a missing or invalid time', () => {
				expect( () => {
					req.before();
				} ).toThrow( 'Invalid time value' );
			} );

			it( 'sets the "before" query parameter as an ISO 8601 Date', () => {
				const result = req.before( '2016-07-01' );
				expect( getQueryStr( result ) ).toBe( 'before=2016-07-01T00:00:00.000Z' );
			} );

			it( 'sets the "before" query parameter when provided a Date object', () => {
				const date = new Date( 1986, 2, 22 );
				const result = req.before( date );
				// use .match and regex to avoid time zone-induced false negatives
				expect( getQueryStr( result ) ).toMatch( /^before=1986-03-22T\d{2}:\d{2}:\d{2}.\d{3}Z$/ );
			} );

		} );

		describe( '.after()', () => {

			beforeEach( () => {
				Req.prototype.after = parameterMixins.after;
			} );

			it( 'mixin method is defined', () => {
				expect( parameterMixins ).toHaveProperty( 'after' );
			} );

			it( 'is a function', () => {
				expect( typeof parameterMixins.after ).toBe( 'function' );
			} );

			it( 'supports chaining', () => {
				expect( req.after( '1992-04-22' ) ).toBe( req );
			} );

			it( 'throws an error when called with a missing or invalid time', () => {
				expect( () => {
					req.after();
				} ).toThrow( 'Invalid time value' );
			} );

			it( 'sets the "after" query parameter when provided a value', () => {
				const result = req.after( '2016-03-22' );
				expect( getQueryStr( result ) ).toBe( 'after=2016-03-22T00:00:00.000Z' );
			} );

			it( 'sets the "after" query parameter when provided a Date object', () => {
				const date = new Date( 1987, 11, 7 );
				const result = req.after( date );
				// use .match and regex to avoid time zone-induced false negatives
				expect( getQueryStr( result ) ).toMatch( /^after=1987-12-07T\d{2}:\d{2}:\d{2}.\d{3}Z$/ );
			} );

		} );

	} );

	describe( '.author()', () => {

		beforeEach( () => {
			Req.prototype.author = parameterMixins.author;
		} );

		it( 'mixin method is defined', () => {
			expect( parameterMixins ).toHaveProperty( 'author' );
		} );

		it( 'is a function', () => {
			expect( typeof parameterMixins.author ).toBe( 'function' );
		} );

		it( 'supports chaining', () => {
			expect( req.author( 1 ) ).toBe( req );
		} );

		it( 'has no effect when called with no argument', () => {
			const result = req.author();
			expect( getQueryStr( result ) ).toBe( '' );
		} );

		it( 'throws an error when called with a non-string, non-numeric value', () => {
			expect( () => { req.author( {} ); } ).toThrow();
		} );

		it( 'sets the "author" query parameter when provided a numeric value', () => {
			const result = req.author( 1138 );
			expect( getQueryStr( result ) ).toBe( 'author=1138' );
		} );

		it( 'sets the "author_name" filter when provided a string value', () => {
			const result = req.author( 'jamesagarfield' );
			expect( getQueryStr( result ) ).toBe( 'filter[author_name]=jamesagarfield' );
		} );

		it( 'is chainable, and replaces author_name values on subsequent calls', () => {
			const result = req.author( 'fforde' ).author( 'bronte' );
			expect( result ).toBe( req );
			expect( getQueryStr( result ) ).toBe( 'filter[author_name]=bronte' );
		} );

		it( 'is chainable, and replaces author ID values on subsequent calls', () => {
			const result = req.author( 1847 );
			expect( getQueryStr( result ) ).toBe( 'author=1847' );
		} );

		it( 'unsets author when called with an empty string', () => {
			const result = req.author( 'jorge-luis-borges' ).author( '' );
			expect( getQueryStr( result ) ).toBe( '' );
		} );

		it( 'unsets author when called with null', () => {
			const result = req.author( 7 ).author( null );
			expect( getQueryStr( result ) ).toBe( '' );
		} );

		it( 'unsets author parameter when called with author name string', () => {
			const result = req.author( 7 ).author( 'haruki-murakami' );
			expect( getQueryStr( result ) ).toBe( 'filter[author_name]=haruki-murakami' );
		} );

		it( 'unsets author name filter when called with numeric author id', () => {
			const result = req.author( 'haruki-murakami' ).author( 7 );
			expect( getQueryStr( result ) ).toBe( 'author=7' );
		} );

	} );

	describe( '.parent()', () => {

		beforeEach( () => {
			Req.prototype.parent = parameterMixins.parent;
		} );

		it( 'mixin method is defined', () => {
			expect( parameterMixins ).toHaveProperty( 'parent' );
		} );

		it( 'is a function', () => {
			expect( typeof parameterMixins.parent ).toBe( 'function' );
		} );

		it( 'supports chaining', () => {
			expect( req.parent() ).toBe( req );
		} );

		it( 'has no effect when called with no argument', () => {
			const result = req.parent();
			expect( getQueryStr( result ) ).toBe( '' );
		} );

		it( 'sets the "parent" query parameter when provided a value', () => {
			const result = req.parent( 42 );
			expect( getQueryStr( result ) ).toBe( 'parent=42' );
		} );

		it( 'replaces values on subsequent calls', () => {
			const result = req.parent( 42 ).parent( 2501 );
			expect( getQueryStr( result ) ).toBe( 'parent=2501' );
		} );

		it( 'can pass an array of parent values', () => {
			const result = req.parent( [ 42, 2501 ] );
			expect( getQueryStr( result ) ).toBe( 'parent[]=2501&parent[]=42' );
		} );

	} );

	describe( '.post()', () => {

		beforeEach( () => {
			Req.prototype.post = parameterMixins.post;
		} );

		it( 'mixin method is defined', () => {
			expect( parameterMixins ).toHaveProperty( 'post' );
		} );

		it( 'is a function', () => {
			expect( typeof parameterMixins.post ).toBe( 'function' );
		} );

		it( 'supports chaining', () => {
			expect( req.post() ).toBe( req );
		} );

		it( 'has no effect when called with no argument', () => {
			const result = req.post();
			expect( getQueryStr( result ) ).toBe( '' );
		} );

		it( 'sets the "post" query parameter when provided a value', () => {
			const result = req.post( 3263827 );
			expect( getQueryStr( result ) ).toBe( 'post=3263827' );
		} );

		it( 'overwrites previously-set values on subsequent calls', () => {
			const result = req.post( 1138 ).post( 2501 );
			expect( getQueryStr( result ) ).toBe( 'post=2501' );
		} );

	} );

	describe( '.password()', () => {

		beforeEach( () => {
			Req.prototype.password = parameterMixins.password;
		} );

		it( 'mixin method is defined', () => {
			expect( parameterMixins ).toHaveProperty( 'password' );
		} );

		it( 'is a function', () => {
			expect( typeof parameterMixins.password ).toBe( 'function' );
		} );

		it( 'supports chaining', () => {
			expect( req.password() ).toBe( req );
		} );

		it( 'has no effect when called with no argument', () => {
			const result = req.password();
			expect( getQueryStr( result ) ).toBe( '' );
		} );

		it( 'sets the "password" query parameter when provided a value', () => {
			const result = req.password( 'correct horse battery staple' );
			expect( getQueryStr( result ) ).toBe( 'password=correct horse battery staple' );
		} );

		it( 'overwrites previously-set values on subsequent calls', () => {
			const result = req.password( 'correct horse' ).password( 'battery staple' );
			expect( getQueryStr( result ) ).toBe( 'password=battery staple' );
		} );

	} );

	describe( '.status()', () => {

		beforeEach( () => {
			Req.prototype.status = parameterMixins.status;
		} );

		it( 'mixin method is defined', () => {
			expect( parameterMixins ).toHaveProperty( 'status' );
		} );

		it( 'is a function', () => {
			expect( typeof parameterMixins.status ).toBe( 'function' );
		} );

		it( 'supports chaining', () => {
			expect( req.status( 'publish' ) ).toBe( req );
		} );

		it( 'sets the "status" query parameter when provided a value', () => {
			const result = req.status( 'future' );
			expect( getQueryStr( result ) ).toBe( 'status=future' );
		} );

		it( 'sets an array of "status" query values when provided an array of strings', () => {
			const result = req.status( [ 'future', 'draft' ] );
			expect( getQueryStr( result ) ).toBe( 'status[]=draft&status[]=future' );
		} );

	} );

	describe( '.sticky()', () => {

		beforeEach( () => {
			Req.prototype.sticky = parameterMixins.sticky;
		} );

		it( 'mixin method is defined', () => {
			expect( parameterMixins ).toHaveProperty( 'sticky' );
		} );

		it( 'is a function', () => {
			expect( typeof parameterMixins.sticky ).toBe( 'function' );
		} );

		it( 'supports chaining', () => {
			expect( req.sticky() ).toBe( req );
		} );

		it( 'has no effect when called with no argument', () => {
			const result = req.sticky();
			expect( getQueryStr( result ) ).toBe( '' );
		} );

		it( 'sets the "sticky" query parameter when provided a value', () => {
			const result = req.sticky( true );
			expect( getQueryStr( result ) ).toBe( 'sticky=true' );
		} );

		it( 'overwrites previously-set values on subsequent calls', () => {
			const result = req.sticky( 1 ).sticky( 0 );
			expect( getQueryStr( result ) ).toBe( 'sticky=0' );
		} );

	} );

	describe( 'categories()', () => {

		beforeEach( () => {
			Req.prototype.categories = parameterMixins.categories;
		} );

		it( 'mixin is defined', () => {
			expect( parameterMixins ).toHaveProperty( 'categories' );
		} );

		it( 'is a function', () => {
			expect( typeof parameterMixins.categories ).toBe( 'function' );
		} );

		it( 'supports chaining', () => {
			expect( req.categories( 7 ) ).toBe( req );
		} );

		it( 'sets the "categories" parameter for a single category ID', () => {
			const result = req.categories( 7 );
			expect( getQueryStr( result ) ).toBe( 'categories=7' );
		} );

		it( 'sets the "categories" parameter for multiple category IDs', () => {
			const result = req.categories( [ 7, 13 ] );
			expect( getQueryStr( result ) ).toBe( 'categories[]=13&categories[]=7' );
		} );

	} );

	describe( 'category()', () => {

		beforeEach( () => {
			Req.prototype.category = parameterMixins.category;
		} );

		it( 'mixin is defined', () => {
			expect( parameterMixins ).toHaveProperty( 'category' );
		} );

		it( 'is a function', () => {
			expect( typeof parameterMixins.category ).toBe( 'function' );
		} );

		it( 'supports chaining', () => {
			expect( req.category( 'foo' ) ).toBe( req );
		} );

		it( 'sets the "categories" parameter for a single category ID', () => {
			const result = req.category( 7 );
			expect( getQueryStr( result ) ).toBe( 'categories=7' );
		} );

		it( 'sets the "categories" parameter for multiple category IDs', () => {
			const result = req.category( [ 7, 13 ] );
			expect( getQueryStr( result ) ).toBe( 'categories[]=13&categories[]=7' );
		} );

		it( 'sets the "category_name" filter for categories where the term is a string [DEPRECATED]', () => {
			const result = req.category( 'fiction' );
			expect( getQueryStr( result ) ).toBe( 'filter[category_name]=fiction' );
		} );

	} );

	describe( 'excludeCategories()', () => {

		beforeEach( () => {
			Req.prototype.excludeCategories = parameterMixins.excludeCategories;
		} );

		it( 'mixin is defined', () => {
			expect( parameterMixins ).toHaveProperty( 'excludeCategories' );
		} );

		it( 'is a function', () => {
			expect( typeof parameterMixins.excludeCategories ).toBe( 'function' );
		} );

		it( 'supports chaining', () => {
			expect( req.excludeCategories( 7 ) ).toBe( req );
		} );

		it( 'sets the "categories_exclude" parameter for a single category ID', () => {
			const result = req.excludeCategories( 7 );
			expect( getQueryStr( result ) ).toBe( 'categories_exclude=7' );
		} );

		it( 'sets the "categories_exclude" parameter for multiple category IDs', () => {
			const result = req.excludeCategories( [ 7, 13 ] );
			expect( getQueryStr( result ) ).toBe( 'categories_exclude[]=13&categories_exclude[]=7' );
		} );

	} );

	describe( 'tags()', () => {

		beforeEach( () => {
			Req.prototype.tags = parameterMixins.tags;
		} );

		it( 'mixin is defined', () => {
			expect( parameterMixins ).toHaveProperty( 'tags' );
		} );

		it( 'is a function', () => {
			expect( typeof parameterMixins.tags ).toBe( 'function' );
		} );

		it( 'supports chaining', () => {
			expect( req.tags( 7 ) ).toBe( req );
		} );

		it( 'sets the "tags" parameter for a single category ID', () => {
			const result = req.tags( 7 );
			expect( getQueryStr( result ) ).toBe( 'tags=7' );
		} );

		it( 'sets the "tags" parameter for multiple category IDs', () => {
			const result = req.tags( [ 7, 13 ] );
			expect( getQueryStr( result ) ).toBe( 'tags[]=13&tags[]=7' );
		} );

		it( 'sets the "tags" parameter for multiple category IDs provided as numeric strings', () => {
			const result = req.tags( [ '7', '13' ] );
			expect( getQueryStr( result ) ).toBe( 'tags[]=13&tags[]=7' );
		} );

	} );

	describe( 'tag()', () => {

		beforeEach( () => {
			Req.prototype.tag = parameterMixins.tag;
		} );

		it( 'mixin is defined', () => {
			expect( parameterMixins ).toHaveProperty( 'tag' );
		} );

		it( 'is a function', () => {
			expect( typeof parameterMixins.tag ).toBe( 'function' );
		} );

		it( 'supports chaining', () => {
			expect( req.tag( 7 ) ).toBe( req );
		} );

		it( 'sets the "tag" parameter for a single category ID', () => {
			const result = req.tag( 7 );
			expect( getQueryStr( result ) ).toBe( 'tags=7' );
		} );

		it( 'sets the "tags" parameter for multiple category IDs', () => {
			const result = req.tag( [ 7, 13 ] );
			expect( getQueryStr( result ) ).toBe( 'tags[]=13&tags[]=7' );
		} );

		it( 'sets the "tags" parameter for multiple category IDs provided as numeric strings', () => {
			const result = req.tag( [ '7', '13' ] );
			expect( getQueryStr( result ) ).toBe( 'tags[]=13&tags[]=7' );
		} );

		it( 'sets the "tag" filter when the term is a string [DEPRECATED]', () => {
			const result = req.tag( 'bagpipe-techno' );
			expect( getQueryStr( result ) ).toBe( 'filter[tag]=bagpipe-techno' );
		} );

	} );

	describe( 'excludeTags()', () => {

		beforeEach( () => {
			Req.prototype.excludeTags = parameterMixins.excludeTags;
		} );

		it( 'mixin is defined', () => {
			expect( parameterMixins ).toHaveProperty( 'excludeTags' );
		} );

		it( 'is a function', () => {
			expect( typeof parameterMixins.excludeTags ).toBe( 'function' );
		} );

		it( 'supports chaining', () => {
			expect( req.excludeTags( 7 ) ).toBe( req );
		} );

		it( 'sets the "tags_exclude" parameter for a single category ID', () => {
			const result = req.excludeTags( 7 );
			expect( getQueryStr( result ) ).toBe( 'tags_exclude=7' );
		} );

		it( 'sets the "tags_exclude" parameter for multiple category IDs', () => {
			const result = req.excludeTags( [ 7, 13 ] );
			expect( getQueryStr( result ) ).toBe( 'tags_exclude[]=13&tags_exclude[]=7' );
		} );

		it( 'sets the "tags_exclude" parameter for multiple category IDs provided as numeric strings', () => {
			const result = req.excludeTags( [ '7', '13' ] );
			expect( getQueryStr( result ) ).toBe( 'tags_exclude[]=13&tags_exclude[]=7' );
		} );

	} );

} );
