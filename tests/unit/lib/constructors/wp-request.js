'use strict';

const WPRequest = require( '../../../../lib/constructors/wp-request' );
const filterMixins = require( '../../../../lib/mixins/filters' );
const checkMethodSupport = require( '../../../../lib/util/check-method-support' );

const getQueryStr = ( req ) => {
	const query = req
		._renderQuery()
		.replace( /^\?/, '' );
	return decodeURIComponent( query );
};

describe( 'WPRequest', () => {

	let request;

	beforeEach( () => {
		request = new WPRequest( {
			endpoint: '/',
		} );
	} );

	describe( 'constructor', () => {

		it( 'should create a WPRequest instance', () => {
			expect( request instanceof WPRequest ).toBe( true );
		} );

		it( 'should set any passed-in options', () => {
			request = new WPRequest( {
				endpoint: '/custom-endpoint/',
			} );
			expect( request.toString() ).toBe( '/custom-endpoint/' );
		} );

		it( 'should define a _supportedMethods array', () => {
			const _supportedMethods = request._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).toBe( 'delete|get|head|post|put' );
		} );

	} );

	describe( '._renderQuery() [internal]', () => {

		beforeEach( () => {
			Object.keys( filterMixins ).forEach( ( mixin ) => {
				if ( ! request[ mixin ] ) {
					request[ mixin ] = filterMixins[ mixin ];
				}
			} );
		} );

		it( 'properly parses taxonomy filters', () => {
			request._taxonomyFilters = {
				tag: [ 'clouds ', 'islands' ],
				custom_tax: [ 7 ],
			};
			const query = request._renderQuery();
			// Filters should be in alpha order, to support caching requests
			expect( query )
				.toBe( '?filter%5Bcustom_tax%5D=7&filter%5Btag%5D=clouds%2Bislands' );
		} );

		it( 'lower-cases taxonomy terms', () => {
			request._taxonomyFilters = {
				tag: [ 'Diamond-Dust' ],
			};
			const query = request._renderQuery();
			expect( query ).toBe( '?filter%5Btag%5D=diamond-dust' );
		} );

		it( 'properly parses regular filters', () => {
			request._filters = {
				post_status: 'publish',
				s: 'Some search string',
			};
			const query = request._renderQuery();
			expect( query )
				.toBe( '?filter%5Bpost_status%5D=publish&filter%5Bs%5D=Some%20search%20string' );
		} );

		it( 'properly parses array filters', () => {
			request._filters = { post__in: [ 0, 1 ] };
			const query = request._renderQuery();
			expect( query )
				.toBe( '?filter%5Bpost__in%5D%5B%5D=0&filter%5Bpost__in%5D%5B%5D=1' );
		} );

		it( 'correctly merges taxonomy and regular filters & renders them in order', () => {
			request._taxonomyFilters = {
				cat: [ 7, 10 ],
			};
			request._filters = {
				name: 'some-slug',
			};
			const query = request._renderQuery();
			// Filters should be in alpha order, to support caching requests
			expect( query ).toBe( '?filter%5Bcat%5D=7%2B10&filter%5Bname%5D=some-slug' );
		} );

	} );

	describe( '.checkMethodSupport()', () => {

		it( 'should return true when called with a supported method', () => {
			expect( checkMethodSupport( 'get', request ) ).toBe( true );
		} );

		it( 'should throw an error when called with an unsupported method', () => {
			request._supportedMethods = [ 'get' ];

			expect( () => {
				checkMethodSupport( 'post', request );
			} ).toThrow();
		} );

	} );

	describe( '.namespace()', () => {

		it( 'is defined', () => {
			expect( request ).toHaveProperty( 'namespace' );
			expect( typeof request.namespace ).toBe( 'function' );
		} );

		it( 'sets a value that is prepended to the path', () => {
			request.namespace( 'ns' );
			expect( request._renderPath() ).toBe( 'ns' );
		} );

		it( 'can accept & set a namespace in the (:domain/:version) format', () => {
			request.namespace( 'ns/v3' );
			expect( request._renderPath() ).toBe( 'ns/v3' );
		} );

		it( 'can be removed (to use the legacy api v1) with an empty string', () => {
			request.namespace( 'windows/xp' ).namespace( '' );
			expect( request._renderPath() ).toBe( '' );
		} );

		it( 'can be removed (to use the legacy api v1) by omitting arguments', () => {
			request.namespace( 'wordpress/95' ).namespace();
			expect( request._renderPath() ).toBe( '' );
		} );

	} );

	describe( '.param()', () => {

		it( 'method exists', () => {
			expect( request ).toHaveProperty( 'param' );
			expect( typeof request.param ).toBe( 'function' );
		} );

		it( 'will have no effect if called without any arguments', () => {
			request.param();
			expect( request._renderQuery() ).toBe( '' );
		} );

		it( 'will set a query parameter value', () => {
			request.param( 'key', 'value' );
			expect( request._renderQuery() ).toBe( '?key=value' );
		} );

		it( 'will unset a query parameter value if called with empty string', () => {
			request.param( 'key', 'value' );
			expect( request._renderQuery() ).toBe( '?key=value' );
			request.param( 'key', 'value' );
			request.param( 'key', '' );
			expect( request._renderQuery() ).toBe( '' );
		} );

		it( 'will unset a query parameter value if called with null', () => {
			request.param( 'key', 'value' );
			expect( request._renderQuery() ).toBe( '?key=value' );
			request.param( 'key', 'value' );
			request.param( 'key', null );
			expect( request._renderQuery() ).toBe( '' );
		} );

		it( 'will have no effect if called with no value', () => {
			request.param( 'key' );
			expect( request._renderQuery() ).toBe( '' );
		} );

		it( 'will have no effect if called with an empty object', () => {
			request.param( {} );
			expect( request._renderQuery() ).toBe( '' );
		} );

		it( 'should set the internal _params hash', () => {
			request.param( 'type', 'some_cpt' );
			expect( request._renderQuery() ).toBe( '?type=some_cpt' );
			request.param( 'context', 'edit' );
			expect( request._renderQuery() ).toBe( '?context=edit&type=some_cpt' );
		} );

		it( 'should set multiple parameters by passing a hash object', () => {
			request.param( {
				page: 309,
				context: 'view',
			} );
			expect( request._renderQuery() ).toBe( '?context=view&page=309' );
		} );

		it( 'should de-dupe & sort array values', () => {
			request.param( 'type', [ 'post', 'page', 'post', 'page', 'cpt_item' ] );
			expect( request._renderQuery() ).toBe( '?type%5B%5D=cpt_item&type%5B%5D=page&type%5B%5D=post' );
		} );

	} );

	describe( '.param() convenience methods', () => {

		describe( '.context()', () => {

			beforeEach( () => {
				request = new WPRequest( {
					endpoint: '/',
				} );
			} );

			it( 'is defined', () => {
				expect( request ).toHaveProperty( 'context' );
				expect( typeof request.context ).toBe( 'function' );
			} );

			it( 'wraps .param()', () => {
				jest.spyOn( request, 'param' );
				request.context( 'view' );
				expect( request.param ).toHaveBeenCalledWith( 'context', 'view' );
			} );

			it( 'should map to the "context=VALUE" query parameter', () => {
				const path = request.context( 'edit' ).toString();
				expect( path ).toBe( '/?context=edit' );
			} );

			it( 'should replace values when called multiple times', () => {
				const path = request.context( 'edit' ).context( 'view' ).toString();
				expect( path ).toBe( '/?context=view' );
			} );

			it( 'should provide a .edit() shortcut for .context( "edit" )', () => {
				jest.spyOn( request, 'context' );
				request.edit();
				expect( request.context ).toHaveBeenCalledWith( 'edit' );
				expect( request.toString() ).toBe( '/?context=edit' );
			} );

		} );

		describe( '.embed()', () => {

			it( 'is defined', () => {
				expect( request ).toHaveProperty( 'embed' );
			} );

			it( 'is a function', () => {
				expect( typeof request.embed ).toBe( 'function' );
			} );

			it( 'should set the "_embed" parameter', () => {
				request.embed();
				expect( request._params._embed ).toBe( true );
			} );

			it( 'should be chainable', () => {
				expect( request.embed() ).toBe( request );
			} );

		} );

		describe( '.page()', () => {

			it( 'is defined', () => {
				expect( request ).toHaveProperty( 'page' );
			} );

			it( 'is a function', () => {
				expect( typeof request.page ).toBe( 'function' );
			} );

			it( 'should be chainable', () => {
				expect( request.page() ).toBe( request );
			} );

			it( 'has no effect when called with no argument', () => {
				const result = request.page();
				expect( getQueryStr( result ) ).toBe( '' );
			} );

			it( 'sets the "page" query parameter when provided a value', () => {
				const result = request.page( 7 );
				expect( getQueryStr( result ) ).toBe( 'page=7' );
			} );

			it( 'should be chainable and replace values when called multiple times', () => {
				const result = request.page( 71 ).page( 2 );
				expect( getQueryStr( result ) ).toBe( 'page=2' );
			} );

		} );

		describe( '.perPage()', () => {

			it( 'is defined', () => {
				expect( request ).toHaveProperty( 'perPage' );
			} );

			it( 'is a function', () => {
				expect( typeof request.perPage ).toBe( 'function' );
			} );

			it( 'should be chainable', () => {
				expect( request.perPage() ).toBe( request );
			} );

			it( 'has no effect when called with no argument', () => {
				const result = request.perPage();
				expect( getQueryStr( result ) ).toBe( '' );
			} );

			it( 'sets the "per_page" query parameter when provided a value', () => {
				const result = request.perPage( 7 );
				expect( getQueryStr( result ) ).toBe( 'per_page=7' );
			} );

			it( 'should be chainable and replace values when called multiple times', () => {
				const result = request.perPage( 71 ).perPage( 2 );
				expect( getQueryStr( result ) ).toBe( 'per_page=2' );
			} );

		} );

		describe( '.offset()', () => {

			it( 'is defined', () => {
				expect( request ).toHaveProperty( 'offset' );
			} );

			it( 'is a function', () => {
				expect( typeof request.offset ).toBe( 'function' );
			} );

			it( 'should be chainable', () => {
				expect( request.offset() ).toBe( request );
			} );

			it( 'has no effect when called with no argument', () => {
				const result = request.offset();
				expect( getQueryStr( result ) ).toBe( '' );
			} );

			it( 'sets the "offset" query parameter when provided a value', () => {
				const result = request.offset( 7 );
				expect( getQueryStr( result ) ).toBe( 'offset=7' );
			} );

			it( 'should be chainable and replace values when called multiple times', () => {
				const result = request.offset( 71 ).offset( 2 );
				expect( getQueryStr( result ) ).toBe( 'offset=2' );
			} );

		} );

		describe( '.order()', () => {

			it( 'is defined', () => {
				expect( request ).toHaveProperty( 'order' );
			} );

			it( 'is a function', () => {
				expect( typeof request.order ).toBe( 'function' );
			} );

			it( 'should be chainable', () => {
				expect( request.order() ).toBe( request );
			} );

			it( 'has no effect when called with no argument', () => {
				const result = request.order();
				expect( getQueryStr( result ) ).toBe( '' );
			} );

			it( 'sets the "order" query parameter when provided a value', () => {
				const result = request.order( 'asc' );
				expect( getQueryStr( result ) ).toBe( 'order=asc' );
			} );

			it( 'should be chainable and replace values when called multiple times', () => {
				const result = request.order( 'asc' ).order( 'desc' );
				expect( getQueryStr( result ) ).toBe( 'order=desc' );
			} );

		} );

		describe( '.orderby()', () => {

			it( 'is defined', () => {
				expect( request ).toHaveProperty( 'orderby' );
			} );

			it( 'is a function', () => {
				expect( typeof request.orderby ).toBe( 'function' );
			} );

			it( 'should be chainable', () => {
				expect( request.orderby() ).toBe( request );
			} );

			it( 'has no effect when called with no argument', () => {
				const result = request.orderby();
				expect( getQueryStr( result ) ).toBe( '' );
			} );

			it( 'sets the "orderby" query parameter when provided a value', () => {
				const result = request.orderby( 'title' );
				expect( getQueryStr( result ) ).toBe( 'orderby=title' );
			} );

			it( 'should be chainable and replace values when called multiple times', () => {
				const result = request.orderby( 'title' ).orderby( 'slug' );
				expect( getQueryStr( result ) ).toBe( 'orderby=slug' );
			} );

		} );

		describe( '.search()', () => {

			it( 'is defined', () => {
				expect( request ).toHaveProperty( 'search' );
			} );

			it( 'is a function', () => {
				expect( typeof request.search ).toBe( 'function' );
			} );

			it( 'should be chainable', () => {
				expect( request.search() ).toBe( request );
			} );

			it( 'has no effect when called with no argument', () => {
				const result = request.search();
				expect( getQueryStr( result ) ).toBe( '' );
			} );

			it( 'sets the "search" query parameter when provided a value', () => {
				const result = request.search( 'my search string' );
				expect( getQueryStr( result ) ).toBe( 'search=my search string' );
			} );

			it( 'overwrites previously-set values on subsequent calls', () => {
				const result = request.search( 'query' ).search( 'newquery' );
				expect( getQueryStr( result ) ).toBe( 'search=newquery' );
			} );

		} );

		describe( '.include()', () => {

			it( 'is defined', () => {
				expect( request ).toHaveProperty( 'include' );
			} );

			it( 'is a function', () => {
				expect( typeof request.include ).toBe( 'function' );
			} );

			it( 'should be chainable', () => {
				expect( request.include() ).toBe( request );
			} );

			it( 'has no effect when called with no argument', () => {
				const result = request.include();
				expect( getQueryStr( result ) ).toBe( '' );
			} );

			it( 'sets the "include" query parameter when provided a value', () => {
				const result = request.include( 7 );
				expect( getQueryStr( result ) ).toBe( 'include=7' );
			} );

			it( 'can set an array of "include" values', () => {
				const result = request.include( [ 7, 41, 98 ] );
				expect( getQueryStr( result ) ).toBe( 'include[]=41&include[]=7&include[]=98' );
			} );

			it( 'should be chainable and replace values when called multiple times', () => {
				const result = request.include( 71 ).include( 2 );
				expect( getQueryStr( result ) ).toBe( 'include=2' );
			} );

		} );

		describe( '.exclude()', () => {

			it( 'is defined', () => {
				expect( request ).toHaveProperty( 'exclude' );
			} );

			it( 'is a function', () => {
				expect( typeof request.exclude ).toBe( 'function' );
			} );

			it( 'should be chainable', () => {
				expect( request.exclude() ).toBe( request );
			} );

			it( 'has no effect when called with no argument', () => {
				const result = request.exclude();
				expect( getQueryStr( result ) ).toBe( '' );
			} );

			it( 'sets the "exclude" query parameter when provided a value', () => {
				const result = request.exclude( 7 );
				expect( getQueryStr( result ) ).toBe( 'exclude=7' );
			} );

			it( 'can set an array of "exclude" values', () => {
				const result = request.exclude( [ 7, 41, 98 ] );
				expect( getQueryStr( result ) ).toBe( 'exclude[]=41&exclude[]=7&exclude[]=98' );
			} );

			it( 'should be chainable and replace values when called multiple times', () => {
				const result = request.exclude( 71 ).exclude( 2 );
				expect( getQueryStr( result ) ).toBe( 'exclude=2' );
			} );

		} );

		describe( '.slug()', () => {

			it( 'is defined', () => {
				expect( request ).toHaveProperty( 'slug' );
			} );

			it( 'is a function', () => {
				expect( typeof request.slug ).toBe( 'function' );
			} );

			it( 'supports chaining', () => {
				expect( request.slug() ).toBe( request );
			} );

			it( 'has no effect when called with no argument', () => {
				const result = request.slug();
				expect( getQueryStr( result ) ).toBe( '' );
			} );

			it( 'sets the "slug" query parameter when provided a value', () => {
				const result = request.slug( 'bran-van' );
				expect( getQueryStr( result ) ).toBe( 'slug=bran-van' );
			} );

		} );

	} );

	describe( '.auth()', () => {

		it( 'is defined', () => {
			expect( request ).toHaveProperty( 'auth' );
			expect( typeof request.auth ).toBe( 'function' );
		} );

		it( 'activates authentication for the request', () => {
			expect( request._options ).not.toHaveProperty( 'auth' );
			request.auth();
			expect( request._options ).toHaveProperty( 'auth' );
			expect( request._options.auth ).toBe( true );
		} );

		it( 'sets the username and password when provided in an object', () => {
			expect( request._options ).not.toHaveProperty( 'username' );
			expect( request._options ).not.toHaveProperty( 'password' );
			request.auth( {
				username: 'user',
				password: 'pass',
			} );
			expect( request._options ).toHaveProperty( 'username' );
			expect( request._options ).toHaveProperty( 'password' );
			expect( request._options.username ).toBe( 'user' );
			expect( request._options.password ).toBe( 'pass' );
			expect( request._options ).toHaveProperty( 'auth' );
			expect( request._options.auth ).toBe( true );
		} );

		it( 'does not set username/password if they are not provided as string values', () => {
			expect( request._options ).not.toHaveProperty( 'username' );
			expect( request._options ).not.toHaveProperty( 'password' );
			request.auth( {
				username: 123,
				password: false,
			} );
			expect( request._options ).not.toHaveProperty( 'username' );
			expect( request._options ).not.toHaveProperty( 'password' );
			expect( request._options ).toHaveProperty( 'auth' );
			expect( request._options.auth ).toBe( true );
		} );

		it( 'sets the nonce when provided in an object', () => {
			expect( request._options ).not.toHaveProperty( 'nonce' );
			request.auth( {
				nonce: 'nonceynonce',
			} );
			expect( request._options ).toHaveProperty( 'nonce' );
			expect( request._options.nonce ).toBe( 'nonceynonce' );
			expect( request._options ).toHaveProperty( 'auth' );
			expect( request._options.auth ).toBe( true );
		} );

		it( 'can update nonce credentials', () => {
			request.auth( {
				nonce: 'nonceynonce',
			} ).auth( {
				nonce: 'refreshednonce',
			} );
			expect( request._options ).toHaveProperty( 'nonce' );
			expect( request._options.nonce ).toBe( 'refreshednonce' );
			expect( request._options ).toHaveProperty( 'auth' );
			expect( request._options.auth ).toBe( true );
		} );

	} ); // auth

	describe( '.file()', () => {

		it( 'method exists', () => {
			expect( request ).toHaveProperty( 'file' );
			expect( typeof request.file ).toBe( 'function' );
		} );

		it( 'will have no effect if called without any arguments', () => {
			request.file();
			expect( request._attachment ).toBeUndefined();
		} );

		it( 'will set a file path to upload', () => {
			request.file( '/some/file.jpg' );
			expect( request._attachment ).toBe( '/some/file.jpg' );
		} );

		it( 'will replace previously-set file paths if called multiple times', () => {
			request.file( '/some/file.jpg' ).file( '/some/other/file.jpg' );
			expect( request._attachment ).toBe( '/some/other/file.jpg' );
		} );

		it( 'will clear out previously-set paths if called again without any arguments', () => {
			request.file( '/some/file.jpg' ).file();
			expect( request._attachment ).toBeUndefined();
		} );

		it( 'will set an attachment name to use for the provided file', () => {
			request.file( '/some/file.jpg', 'cat_picture.jpg' );
			expect( request._attachmentName ).toBe( 'cat_picture.jpg' );
		} );

		it( 'will clear out previously-set name if called again without a name', () => {
			request.file( '/some/file.jpg', 'cat_picture.jpg' ).file( '/some/other/file.jpg' );
			expect( request._attachmentName ).toBeUndefined();
		} );

	} );

	describe( '.setHeaders()', () => {

		it( 'method exists', () => {
			expect( request ).toHaveProperty( 'setHeaders' );
			expect( typeof request.setHeaders ).toBe( 'function' );
		} );

		it( 'will have no effect if called without any arguments', () => {
			request.setHeaders();
			expect( request._options.headers ).toEqual( {} );
		} );

		it( 'will set a header key/value pair', () => {
			request.setHeaders( 'Authorization', 'Bearer sometoken' );
			expect( request._options.headers ).toEqual( {
				Authorization: 'Bearer sometoken',
			} );
		} );

		it( 'will replace an existing header key/value pair', () => {
			request
				.setHeaders( 'Authorization', 'Bearer sometoken' )
				.setHeaders( 'Authorization', 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==' );
			expect( request._options.headers ).toEqual( {
				Authorization: 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==',
			} );
		} );

		it( 'will set multiple header key/value pairs with chained calls', () => {
			request
				.setHeaders( 'Accept-Language', 'en-US' )
				.setHeaders( 'Authorization', 'Bearer sometoken' );
			expect( request._options.headers ).toEqual( {
				'Accept-Language': 'en-US',
				Authorization: 'Bearer sometoken',
			} );
		} );

		it( 'will set multiple header key/value pairs when passed an object', () => {
			request.setHeaders( {
				'Accept-Language': 'en-US',
				Authorization: 'Bearer sometoken',
			} );
			expect( request._options.headers ).toEqual( {
				'Accept-Language': 'en-US',
				Authorization: 'Bearer sometoken',
			} );
		} );

		it( 'will replace multiple existing header key/value pairs when passed an object', () => {
			request
				.setHeaders( {
					'Accept-Language': 'en-US',
					Authorization: 'Bearer sometoken',
				} )
				.setHeaders( {
					'Accept-Language': 'pt-BR',
					Authorization: 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==',
				} );
			expect( request._options.headers ).toEqual( {
				'Accept-Language': 'pt-BR',
				Authorization: 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==',
			} );
		} );

		it( 'inherits headers from the constructor options object', () => {
			request = new WPRequest( {
				endpoint: '/',
				headers: {
					'Accept-Language': 'pt-BR',
				},
			} );
			expect( request._options.headers ).toEqual( {
				'Accept-Language': 'pt-BR',
			} );
		} );

	} );

	describe( '.toString()', () => {

		beforeEach( () => {
			request = new WPRequest( {
				endpoint: 'http://blogoblog.com/wp-json',
			} );
		} );

		it( 'renders the URL to a string', () => {
			const str = request.param( 'a', 7 ).param( 'b', [ 1, 2 ] ).toString();
			expect( str ).toBe( 'http://blogoblog.com/wp-json?a=7&b%5B%5D=1&b%5B%5D=2' );
		} );

		it( 'exhibits normal toString() behavior via coercion', () => {
			const str = '' + request.param( 'a', 7 ).param( 'b', [ 1, 2 ] );
			expect( str ).toBe( 'http://blogoblog.com/wp-json?a=7&b%5B%5D=1&b%5B%5D=2' );
		} );

		it( 'correctly merges query strings for "plain permalinks" endpoints', () => {
			request = new WPRequest( {
				endpoint: 'https://blogoblog.com?rest_route=/',
			} );
			const str = request.param( 'a', 7 ).param( 'b', [ 1, 2 ] ).toString();
			expect( str ).toBe( 'https://blogoblog.com?rest_route=/&a=7&b%5B%5D=1&b%5B%5D=2' );
		} );

	} );

	describe( '.setPathPart()', () => {

		it( 'is defined', () => {
			expect( request ).toHaveProperty( 'setPathPart' );
		} );

		it( 'is a function', () => {
			expect( typeof request.setPathPart ).toBe( 'function' );
		} );

		it( 'is chainable', () => {
			expect( request.setPathPart() ).toBe( request );
		} );

		it( 'sets a path part', () => {
			request.setPathPart( 0, 'foo' );
			expect( request.toString() ).toBe( '/foo' );
		} );

		it( 'sets multiple path parts', () => {
			request.setPathPart( 0, 'foo' ).setPathPart( 1, 'bar' );
			expect( request.toString() ).toBe( '/foo/bar' );
		} );

		it( 'sets multiple non-consecutive path parts', () => {
			request.setPathPart( 0, 'foo' ).setPathPart( 2, 'baz' );
			expect( request.toString() ).toBe( '/foo/baz' );
		} );

		it( 'throws an error if called multiple times for the same level', () => {
			expect( () => {
				request.setPathPart( 0, 'foo' ).setPathPart( 0, 'bar' );
			} ).toThrow( 'Cannot overwrite value foo' );
		} );

	} );

	describe( '.validatePath()', () => {

		it( 'is defined', () => {
			expect( request ).toHaveProperty( 'validatePath' );
		} );

		it( 'is a function', () => {
			expect( typeof request.validatePath ).toBe( 'function' );
		} );

		it( 'is chainable', () => {
			expect( request.validatePath() ).toBe( request );
		} );

		it( 'is called by toString()', () => {
			jest.spyOn( request, 'validatePath' );
			request.toString();
			expect( request.validatePath ).toHaveBeenCalled();
		} );

		it( 'allows any sequence of path parts if no _levels are specified', () => {
			delete request._levels;
			expect( () => {
				request
					.setPathPart( 0, 'foo' )
					.setPathPart( 4, 'bar' )
					.setPathPart( 2, 'baz' )
					.validatePath();
			} ).not.toThrow();
			expect( request.toString() ).toBe( '/foo/baz/bar' );
		} );

		it( 'allows omitted _levels so long as there are no gaps', () => {
			request._levels = {
				'0': [ { component: 'posts' } ],
				'1': [ { component: '(?P<id>[\\d]+)' } ],
			};
			expect( () => {
				request.setPathPart( 0, 'posts' ).validatePath();
			} ).not.toThrow();
			expect( request.toString() ).toBe( '/posts' );
		} );

		it( 'allows any value for a level if no validate function is specified', () => {
			request._levels = {
				'0': [ { component: '(?P<id>[\\d]+)' } ],
			};
			expect( () => {
				request.setPathPart( 0, 'foo' ).validatePath();
			} ).not.toThrow();
			expect( request.toString() ).toBe( '/foo' );
		} );

		it( 'requires a level to conform to a validate function, when provided', () => {
			request._levels = {
				'0': [ {
					component: '(?P<id>[\\d]+)',
					validate: val => /^[\d]+$/.test( val ),
				} ],
			};
			expect( () => {
				request.setPathPart( 0, 'foo' ).validatePath();
			} ).toThrow( 'foo does not match (?P<id>[\\d]+)' );
		} );

		it( 'allows any value for a level that passes a validate function, when provided', () => {
			request._levels = {
				'0': [ {
					component: '(?P<id>[\\d]+)',
					validate: val => /^[\d]+$/.test( val ),
				} ],
			};
			expect( () => {
				request.setPathPart( 0, '42' ).validatePath();
			} ).not.toThrow();
			expect( request.toString() ).toBe( '/42' );
		} );

		it( 'requires a level to conform to any of several validate functions when provided', () => {
			request._levels = {
				'0': [ {
					component: '(?P<id>[\\d]+)',
					validate: val => /^[\d]+$/.test( val ),
				}, {
					component: 'posts',
					validate: val => val === 'posts',
				}, {
					component: 'pages',
					validate: val => val === 'pages',
				} ],
			};
			expect( () => {
				request.setPathPart( 0, 'foo' ).validatePath();
			} ).toThrow( 'foo does not match any of (?P<id>[\\d]+), posts, pages' );
		} );

		it( 'allows any value for a level that passes any of the available validate functions', () => {
			request._levels = {
				'0': [ {
					component: '(?P<id>[\\d]+)',
					validate: val => /^[\d]+$/.test( val ),
				}, {
					component: 'posts',
					validate: val => val === 'posts',
				}, {
					component: 'pages',
					validate: val => val === 'pages',
				} ],
			};
			expect( () => {
				request.setPathPart( 0, 'posts' ).validatePath();
			} ).not.toThrow();
			expect( request.toString() ).toBe( '/posts' );
		} );

		it( 'catches missing path parts if _levels are specified', () => {
			request._levels = {
				'0': [ { component: '(?P<parent>[\\d]+)' } ],
				'1': [ { component: 'revisions' } ],
				// '2': [ { component: '(?P<id>[\\d]+)' } ]
			};
			expect( () => {
				request.setPathPart( 1, 'revisions' ).validatePath();
			} ).toThrow( 'Incomplete URL! Missing component: / ??? /revisions' );
		} );

	} );

} );
