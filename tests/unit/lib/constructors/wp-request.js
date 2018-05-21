'use strict';
const chai = require( 'chai' );
const expect = chai.expect;
chai.use( require( 'sinon-chai' ) );
const sinon = require( 'sinon' );

const WPRequest = require( '../../../../lib/constructors/wp-request' );
const filterMixins = require( '../../../../lib/mixins/filters' );
const checkMethodSupport = require( '../../../../lib/util/check-method-support' );

describe( 'WPRequest', () => {

	let request;

	beforeEach( () => {
		request = new WPRequest( {
			endpoint: '/'
		} );
	} );

	describe( 'constructor', () => {

		it( 'should create a WPRequest instance', () => {
			expect( request instanceof WPRequest ).to.be.true;
		} );

		it( 'should set any passed-in options', () => {
			request = new WPRequest( {
				endpoint: '/custom-endpoint/'
			} );
			expect( request.toString() ).to.equal( '/custom-endpoint/' );
		} );

		it( 'should define a _supportedMethods array', () => {
			const _supportedMethods = request._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'delete|get|head|post|put' );
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
				custom_tax: [ 7 ]
			};
			const query = request._renderQuery();
			// Filters should be in alpha order, to support caching requests
			expect( query ).to
				.equal( '?filter%5Bcustom_tax%5D=7&filter%5Btag%5D=clouds%2Bislands' );
		} );

		it( 'lower-cases taxonomy terms', () => {
			request._taxonomyFilters = {
				tag: [ 'Diamond-Dust' ]
			};
			const query = request._renderQuery();
			expect( query ).to.equal( '?filter%5Btag%5D=diamond-dust' );
		} );

		it( 'properly parses regular filters', () => {
			request._filters = {
				post_status: 'publish', s: 'Some search string'
			};
			const query = request._renderQuery();
			expect( query ).to
				.equal( '?filter%5Bpost_status%5D=publish&filter%5Bs%5D=Some%20search%20string' );
		} );

		it( 'properly parses array filters', () => {
			request._filters = { post__in: [ 0, 1 ] };
			const query = request._renderQuery();
			expect( query ).to
				.equal( '?filter%5Bpost__in%5D%5B%5D=0&filter%5Bpost__in%5D%5B%5D=1' );
		} );

		it( 'correctly merges taxonomy and regular filters & renders them in order', () => {
			request._taxonomyFilters = {
				cat: [ 7, 10 ]
			};
			request._filters = {
				name: 'some-slug'
			};
			const query = request._renderQuery();
			// Filters should be in alpha order, to support caching requests
			expect( query ).to.equal( '?filter%5Bcat%5D=7%2B10&filter%5Bname%5D=some-slug' );
		} );

	} );

	describe( '.checkMethodSupport()', () => {

		it( 'should return true when called with a supported method', () => {
			expect( checkMethodSupport( 'get', request ) ).to.equal( true );
		} );

		it( 'should throw an error when called with an unsupported method', () => {
			request._supportedMethods = [ 'get' ];

			expect( () => {
				checkMethodSupport( 'post', request );
			} ).to.throw();
		} );

	} );

	describe( '.namespace()', () => {

		it( 'is defined', () => {
			expect( request ).to.have.property( 'namespace' );
			expect( request.namespace ).to.be.a( 'function' );
		} );

		it( 'sets a value that is prepended to the path', () => {
			request.namespace( 'ns' );
			expect( request._renderPath() ).to.equal( 'ns' );
		} );

		it( 'can accept & set a namespace in the (:domain/:version) format', () => {
			request.namespace( 'ns/v3' );
			expect( request._renderPath() ).to.equal( 'ns/v3' );
		} );

		it( 'can be removed (to use the legacy api v1) with an empty string', () => {
			request.namespace( 'windows/xp' ).namespace( '' );
			expect( request._renderPath() ).to.equal( '' );
		} );

		it( 'can be removed (to use the legacy api v1) by omitting arguments', () => {
			request.namespace( 'wordpress/95' ).namespace();
			expect( request._renderPath() ).to.equal( '' );
		} );

	} );

	describe( '.param()', () => {

		it( 'method exists', () => {
			expect( request ).to.have.property( 'param' );
			expect( request.param ).to.be.a( 'function' );
		} );

		it( 'will have no effect if called without any arguments', () => {
			request.param();
			expect( request._renderQuery() ).to.equal( '' );
		} );

		it( 'will set a query parameter value', () => {
			request.param( 'key', 'value' );
			expect( request._renderQuery() ).to.equal( '?key=value' );
		} );

		it( 'will unset a query parameter value if called with empty string', () => {
			request.param( 'key', 'value' );
			expect( request._renderQuery() ).to.equal( '?key=value' );
			request.param( 'key', 'value' );
			request.param( 'key', '' );
			expect( request._renderQuery() ).to.equal( '' );
		} );

		it( 'will unset a query parameter value if called with null', () => {
			request.param( 'key', 'value' );
			expect( request._renderQuery() ).to.equal( '?key=value' );
			request.param( 'key', 'value' );
			request.param( 'key', null );
			expect( request._renderQuery() ).to.equal( '' );
		} );

		it( 'will have no effect if called with no value', () => {
			request.param( 'key' );
			expect( request._renderQuery() ).to.equal( '' );
		} );

		it( 'will have no effect if called with an empty object', () => {
			request.param( {} );
			expect( request._renderQuery() ).to.equal( '' );
		} );

		it( 'should set the internal _params hash', () => {
			request.param( 'type', 'some_cpt' );
			expect( request._renderQuery() ).to.equal( '?type=some_cpt' );
			request.param( 'context', 'edit' );
			expect( request._renderQuery() ).to.equal( '?context=edit&type=some_cpt' );
		} );

		it( 'should set multiple parameters by passing a hash object', () => {
			request.param( {
				page: 309,
				context: 'view'
			} );
			expect( request._renderQuery() ).to.equal( '?context=view&page=309' );
		} );

		it( 'should de-dupe & sort array values', () => {
			request.param( 'type', [ 'post', 'page', 'post', 'page', 'cpt_item' ] );
			expect( request._renderQuery() ).to.equal( '?type%5B%5D=cpt_item&type%5B%5D=page&type%5B%5D=post' );
		} );

	} );

	describe( '.param() convenience methods', () => {
		let getQueryStr;

		beforeEach( () => {
			getQueryStr = ( req ) => {
				const query = req
					._renderQuery()
					.replace( /^\?/, '' );
				return decodeURIComponent( query );
			};
		} );

		describe( '.context()', () => {

			beforeEach( () => {
				request = new WPRequest( {
					endpoint: '/'
				} );
			} );

			it( 'is defined', () => {
				expect( request ).to.have.property( 'context' );
				expect( request.context ).to.be.a( 'function' );
			} );

			it( 'wraps .param()', () => {
				sinon.stub( request, 'param' );
				request.context( 'view' );
				expect( request.param ).to.have.been.calledWith( 'context', 'view' );
			} );

			it( 'should map to the "context=VALUE" query parameter', () => {
				const path = request.context( 'edit' ).toString();
				expect( path ).to.equal( '/?context=edit' );
			} );

			it( 'should replace values when called multiple times', () => {
				const path = request.context( 'edit' ).context( 'view' ).toString();
				expect( path ).to.equal( '/?context=view' );
			} );

			it( 'should provide a .edit() shortcut for .context( "edit" )', () => {
				sinon.spy( request, 'context' );
				request.edit();
				expect( request.context ).to.have.been.calledWith( 'edit' );
				expect( request.toString() ).to.equal( '/?context=edit' );
				request.context.restore();
			} );

		} );

		describe( '.embed()', () => {

			it( 'is defined', () => {
				expect( request ).to.have.property( 'embed' );
			} );

			it( 'is a function', () => {
				expect( request.embed ).to.be.a( 'function' );
			} );

			it( 'should set the "_embed" parameter', () => {
				request.embed();
				expect( request._params._embed ).to.equal( true );
			} );

			it( 'should be chainable', () => {
				expect( request.embed() ).to.equal( request );
			} );

		} );

		describe( '.page()', () => {

			it( 'is defined', () => {
				expect( request ).to.have.property( 'page' );
			} );

			it( 'is a function', () => {
				expect( request.page ).to.be.a( 'function' );
			} );

			it( 'should be chainable', () => {
				expect( request.page() ).to.equal( request );
			} );

			it( 'has no effect when called with no argument', () => {
				const result = request.page();
				expect( getQueryStr( result ) ).to.equal( '' );
			} );

			it( 'sets the "page" query parameter when provided a value', () => {
				const result = request.page( 7 );
				expect( getQueryStr( result ) ).to.equal( 'page=7' );
			} );

			it( 'should be chainable and replace values when called multiple times', () => {
				const result = request.page( 71 ).page( 2 );
				expect( getQueryStr( result ) ).to.equal( 'page=2' );
			} );

		} );

		describe( '.perPage()', () => {

			it( 'is defined', () => {
				expect( request ).to.have.property( 'perPage' );
			} );

			it( 'is a function', () => {
				expect( request.perPage ).to.be.a( 'function' );
			} );

			it( 'should be chainable', () => {
				expect( request.perPage() ).to.equal( request );
			} );

			it( 'has no effect when called with no argument', () => {
				const result = request.perPage();
				expect( getQueryStr( result ) ).to.equal( '' );
			} );

			it( 'sets the "per_page" query parameter when provided a value', () => {
				const result = request.perPage( 7 );
				expect( getQueryStr( result ) ).to.equal( 'per_page=7' );
			} );

			it( 'should be chainable and replace values when called multiple times', () => {
				const result = request.perPage( 71 ).perPage( 2 );
				expect( getQueryStr( result ) ).to.equal( 'per_page=2' );
			} );

		} );

		describe( '.offset()', () => {

			it( 'is defined', () => {
				expect( request ).to.have.property( 'offset' );
			} );

			it( 'is a function', () => {
				expect( request.offset ).to.be.a( 'function' );
			} );

			it( 'should be chainable', () => {
				expect( request.offset() ).to.equal( request );
			} );

			it( 'has no effect when called with no argument', () => {
				const result = request.offset();
				expect( getQueryStr( result ) ).to.equal( '' );
			} );

			it( 'sets the "offset" query parameter when provided a value', () => {
				const result = request.offset( 7 );
				expect( getQueryStr( result ) ).to.equal( 'offset=7' );
			} );

			it( 'should be chainable and replace values when called multiple times', () => {
				const result = request.offset( 71 ).offset( 2 );
				expect( getQueryStr( result ) ).to.equal( 'offset=2' );
			} );

		} );

		describe( '.order()', () => {

			it( 'is defined', () => {
				expect( request ).to.have.property( 'order' );
			} );

			it( 'is a function', () => {
				expect( request.order ).to.be.a( 'function' );
			} );

			it( 'should be chainable', () => {
				expect( request.order() ).to.equal( request );
			} );

			it( 'has no effect when called with no argument', () => {
				const result = request.order();
				expect( getQueryStr( result ) ).to.equal( '' );
			} );

			it( 'sets the "order" query parameter when provided a value', () => {
				const result = request.order( 'asc' );
				expect( getQueryStr( result ) ).to.equal( 'order=asc' );
			} );

			it( 'should be chainable and replace values when called multiple times', () => {
				const result = request.order( 'asc' ).order( 'desc' );
				expect( getQueryStr( result ) ).to.equal( 'order=desc' );
			} );

		} );

		describe( '.orderby()', () => {

			it( 'is defined', () => {
				expect( request ).to.have.property( 'orderby' );
			} );

			it( 'is a function', () => {
				expect( request.orderby ).to.be.a( 'function' );
			} );

			it( 'should be chainable', () => {
				expect( request.orderby() ).to.equal( request );
			} );

			it( 'has no effect when called with no argument', () => {
				const result = request.orderby();
				expect( getQueryStr( result ) ).to.equal( '' );
			} );

			it( 'sets the "orderby" query parameter when provided a value', () => {
				const result = request.orderby( 'title' );
				expect( getQueryStr( result ) ).to.equal( 'orderby=title' );
			} );

			it( 'should be chainable and replace values when called multiple times', () => {
				const result = request.orderby( 'title' ).orderby( 'slug' );
				expect( getQueryStr( result ) ).to.equal( 'orderby=slug' );
			} );

		} );

		describe( '.search()', () => {

			it( 'is defined', () => {
				expect( request ).to.have.property( 'search' );
			} );

			it( 'is a function', () => {
				expect( request.search ).to.be.a( 'function' );
			} );

			it( 'should be chainable', () => {
				expect( request.search() ).to.equal( request );
			} );

			it( 'has no effect when called with no argument', () => {
				const result = request.search();
				expect( getQueryStr( result ) ).to.equal( '' );
			} );

			it( 'sets the "search" query parameter when provided a value', () => {
				const result = request.search( 'my search string' );
				expect( getQueryStr( result ) ).to.equal( 'search=my search string' );
			} );

			it( 'overwrites previously-set values on subsequent calls', () => {
				const result = request.search( 'query' ).search( 'newquery' );
				expect( getQueryStr( result ) ).to.equal( 'search=newquery' );
			} );

		} );

		describe( '.include()', () => {

			it( 'is defined', () => {
				expect( request ).to.have.property( 'include' );
			} );

			it( 'is a function', () => {
				expect( request.include ).to.be.a( 'function' );
			} );

			it( 'should be chainable', () => {
				expect( request.include() ).to.equal( request );
			} );

			it( 'has no effect when called with no argument', () => {
				const result = request.include();
				expect( getQueryStr( result ) ).to.equal( '' );
			} );

			it( 'sets the "include" query parameter when provided a value', () => {
				const result = request.include( 7 );
				expect( getQueryStr( result ) ).to.equal( 'include=7' );
			} );

			it( 'can set an array of "include" values', () => {
				const result = request.include( [ 7, 41, 98 ] );
				expect( getQueryStr( result ) ).to.equal( 'include[]=41&include[]=7&include[]=98' );
			} );

			it( 'should be chainable and replace values when called multiple times', () => {
				const result = request.include( 71 ).include( 2 );
				expect( getQueryStr( result ) ).to.equal( 'include=2' );
			} );

		} );

		describe( '.exclude()', () => {

			it( 'is defined', () => {
				expect( request ).to.have.property( 'exclude' );
			} );

			it( 'is a function', () => {
				expect( request.exclude ).to.be.a( 'function' );
			} );

			it( 'should be chainable', () => {
				expect( request.exclude() ).to.equal( request );
			} );

			it( 'has no effect when called with no argument', () => {
				const result = request.exclude();
				expect( getQueryStr( result ) ).to.equal( '' );
			} );

			it( 'sets the "exclude" query parameter when provided a value', () => {
				const result = request.exclude( 7 );
				expect( getQueryStr( result ) ).to.equal( 'exclude=7' );
			} );

			it( 'can set an array of "exclude" values', () => {
				const result = request.exclude( [ 7, 41, 98 ] );
				expect( getQueryStr( result ) ).to.equal( 'exclude[]=41&exclude[]=7&exclude[]=98' );
			} );

			it( 'should be chainable and replace values when called multiple times', () => {
				const result = request.exclude( 71 ).exclude( 2 );
				expect( getQueryStr( result ) ).to.equal( 'exclude=2' );
			} );

		} );

		describe( '.slug()', () => {

			it( 'is defined', () => {
				expect( request ).to.have.property( 'slug' );
			} );

			it( 'is a function', () => {
				expect( request.slug ).to.be.a( 'function' );
			} );

			it( 'supports chaining', () => {
				expect( request.slug() ).to.equal( request );
			} );

			it( 'has no effect when called with no argument', () => {
				const result = request.slug();
				expect( getQueryStr( result ) ).to.equal( '' );
			} );

			it( 'sets the "slug" query parameter when provided a value', () => {
				const result = request.slug( 'bran-van' );
				expect( getQueryStr( result ) ).to.equal( 'slug=bran-van' );
			} );

		} );

	} );

	describe( '.auth()', () => {

		it( 'is defined', () => {
			expect( request ).to.have.property( 'auth' );
			expect( request.auth ).to.be.a( 'function' );
		} );

		it( 'activates authentication for the request', () => {
			expect( request._options ).not.to.have.property( 'auth' );
			request.auth();
			expect( request._options ).to.have.property( 'auth' );
			expect( request._options.auth ).to.be.true;
		} );

		it( 'sets the username and password when provided in an object', () => {
			expect( request._options ).not.to.have.property( 'username' );
			expect( request._options ).not.to.have.property( 'password' );
			request.auth( {
				username: 'user',
				password: 'pass'
			} );
			expect( request._options ).to.have.property( 'username' );
			expect( request._options ).to.have.property( 'password' );
			expect( request._options.username ).to.equal( 'user' );
			expect( request._options.password ).to.equal( 'pass' );
			expect( request._options ).to.have.property( 'auth' );
			expect( request._options.auth ).to.be.true;
		} );

		it( 'does not set username/password if they are not provided as string values', () => {
			expect( request._options ).not.to.have.property( 'username' );
			expect( request._options ).not.to.have.property( 'password' );
			request.auth( {
				username: 123,
				password: false
			} );
			expect( request._options ).not.to.have.property( 'username' );
			expect( request._options ).not.to.have.property( 'password' );
			expect( request._options ).to.have.property( 'auth' );
			expect( request._options.auth ).to.be.true;
		} );

		it( 'sets the nonce when provided in an object', () => {
			expect( request._options ).not.to.have.property( 'nonce' );
			request.auth( {
				nonce: 'nonceynonce'
			} );
			expect( request._options ).to.have.property( 'nonce' );
			expect( request._options.nonce ).to.equal( 'nonceynonce' );
			expect( request._options ).to.have.property( 'auth' );
			expect( request._options.auth ).to.be.true;
		} );

		it( 'can update nonce credentials', () => {
			request.auth( {
				nonce: 'nonceynonce'
			} ).auth( {
				nonce: 'refreshednonce'
			} );
			expect( request._options ).to.have.property( 'nonce' );
			expect( request._options.nonce ).to.equal( 'refreshednonce' );
			expect( request._options ).to.have.property( 'auth' );
			expect( request._options.auth ).to.be.true;
		} );

	} ); // auth

	describe( '.file()', () => {

		it( 'method exists', () => {
			expect( request ).to.have.property( 'file' );
			expect( request.file ).to.be.a( 'function' );
		} );

		it( 'will have no effect if called without any arguments', () => {
			request.file();
			expect( request._attachment ).to.be.undefined;
		} );

		it( 'will set a file path to upload', () => {
			request.file( '/some/file.jpg' );
			expect( request._attachment ).to.equal( '/some/file.jpg' );
		} );

		it( 'will replace previously-set file paths if called multiple times', () => {
			request.file( '/some/file.jpg' ).file( '/some/other/file.jpg' );
			expect( request._attachment ).to.equal( '/some/other/file.jpg' );
		} );

		it( 'will clear out previously-set paths if called again without any arguments', () => {
			request.file( '/some/file.jpg' ).file();
			expect( request._attachment ).to.be.undefined;
		} );

		it( 'will set an attachment name to use for the provided file', () => {
			request.file( '/some/file.jpg', 'cat_picture.jpg' );
			expect( request._attachmentName ).to.equal( 'cat_picture.jpg' );
		} );

		it( 'will clear out previously-set name if called again without a name', () => {
			request.file( '/some/file.jpg', 'cat_picture.jpg' ).file( '/some/other/file.jpg' );
			expect( request._attachmentName ).to.be.undefined;
		} );

	} );

	describe( '.setHeaders()', () => {

		it( 'method exists', () => {
			expect( request ).to.have.property( 'setHeaders' );
			expect( request.setHeaders ).to.be.a( 'function' );
		} );

		it( 'will have no effect if called without any arguments', () => {
			request.setHeaders();
			expect( request._options.headers ).to.deep.equal( {} );
		} );

		it( 'will set a header key/value pair', () => {
			request.setHeaders( 'Authorization', 'Bearer sometoken' );
			expect( request._options.headers ).to.deep.equal( {
				Authorization: 'Bearer sometoken'
			} );
		} );

		it( 'will replace an existing header key/value pair', () => {
			request
				.setHeaders( 'Authorization', 'Bearer sometoken' )
				.setHeaders( 'Authorization', 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==' );
			expect( request._options.headers ).to.deep.equal( {
				Authorization: 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=='
			} );
		} );

		it( 'will set multiple header key/value pairs with chained calls', () => {
			request
				.setHeaders( 'Accept-Language', 'en-US' )
				.setHeaders( 'Authorization', 'Bearer sometoken' );
			expect( request._options.headers ).to.deep.equal( {
				'Accept-Language': 'en-US',
				Authorization: 'Bearer sometoken'
			} );
		} );

		it( 'will set multiple header key/value pairs when passed an object', () => {
			request.setHeaders( {
				'Accept-Language': 'en-US',
				Authorization: 'Bearer sometoken'
			} );
			expect( request._options.headers ).to.deep.equal( {
				'Accept-Language': 'en-US',
				Authorization: 'Bearer sometoken'
			} );
		} );

		it( 'will replace multiple existing header key/value pairs when passed an object', () => {
			request
				.setHeaders( {
					'Accept-Language': 'en-US',
					Authorization: 'Bearer sometoken'
				} )
				.setHeaders( {
					'Accept-Language': 'pt-BR',
					Authorization: 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=='
				} );
			expect( request._options.headers ).to.deep.equal( {
				'Accept-Language': 'pt-BR',
				Authorization: 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=='
			} );
		} );

		it( 'inherits headers from the constructor options object', () => {
			request = new WPRequest( {
				endpoint: '/',
				headers: {
					'Accept-Language': 'pt-BR'
				}
			} );
			expect( request._options.headers ).to.deep.equal( {
				'Accept-Language': 'pt-BR'
			} );
		} );

	} );

	describe( '.toString()', () => {

		beforeEach( () => {
			request = new WPRequest( {
				endpoint: 'http://blogoblog.com/wp-json'
			} );
		} );

		it( 'renders the URL to a string', () => {
			const str = request.param( 'a', 7 ).param( 'b', [ 1, 2 ] ).toString();
			expect( str ).to.equal( 'http://blogoblog.com/wp-json?a=7&b%5B%5D=1&b%5B%5D=2' );
		} );

		it( 'exhibits normal toString() behavior via coercion', () => {
			const str = '' + request.param( 'a', 7 ).param( 'b', [ 1, 2 ] );
			expect( str ).to.equal( 'http://blogoblog.com/wp-json?a=7&b%5B%5D=1&b%5B%5D=2' );
		} );

		it( 'correctly merges query strings for "plain permalinks" endpoints', () => {
			request = new WPRequest( {
				endpoint: 'https://blogoblog.com?rest_route=/'
			} );
			const str = request.param( 'a', 7 ).param( 'b', [ 1, 2 ] ).toString();
			expect( str ).to.equal( 'https://blogoblog.com?rest_route=/&a=7&b%5B%5D=1&b%5B%5D=2' );
		} );

	} );

	describe( '.setPathPart()', () => {

		it( 'is defined', () => {
			expect( request ).to.have.property( 'setPathPart' );
		} );

		it( 'is a function', () => {
			expect( request.setPathPart ).to.be.a( 'function' );
		} );

		it( 'is chainable', () => {
			expect( request.setPathPart() ).to.equal( request );
		} );

		it( 'sets a path part', () => {
			request.setPathPart( 0, 'foo' );
			expect( request.toString() ).to.equal( '/foo' );
		} );

		it( 'sets multiple path parts', () => {
			request.setPathPart( 0, 'foo' ).setPathPart( 1, 'bar' );
			expect( request.toString() ).to.equal( '/foo/bar' );
		} );

		it( 'sets multiple non-consecutive path parts', () => {
			request.setPathPart( 0, 'foo' ).setPathPart( 2, 'baz' );
			expect( request.toString() ).to.equal( '/foo/baz' );
		} );

		it( 'throws an error if called multiple times for the same level', () => {
			expect( () => {
				request.setPathPart( 0, 'foo' ).setPathPart( 0, 'bar' );
			} ).to.throw( 'Cannot overwrite value foo' );
		} );

	} );

	describe( '.validatePath()', () => {

		it( 'is defined', () => {
			expect( request ).to.have.property( 'validatePath' );
		} );

		it( 'is a function', () => {
			expect( request.validatePath ).to.be.a( 'function' );
		} );

		it( 'is chainable', () => {
			expect( request.validatePath() ).to.equal( request );
		} );

		it( 'is called by toString()', () => {
			sinon.spy( request, 'validatePath' );
			request.toString();
			expect( request.validatePath ).to.have.been.called;
			request.validatePath.restore();
		} );

		it( 'allows any sequence of path parts if no _levels are specified', () => {
			delete request._levels;
			expect( () => {
				request
					.setPathPart( 0, 'foo' )
					.setPathPart( 4, 'bar' )
					.setPathPart( 2, 'baz' )
					.validatePath();
			} ).not.to.throw();
			expect( request.toString() ).to.equal( '/foo/baz/bar' );
		} );

		it( 'allows omitted _levels so long as there are no gaps', () => {
			request._levels = {
				'0': [ { component: 'posts' } ],
				'1': [ { component: '(?P<id>[\\d]+)' } ]
			};
			expect( () => {
				request.setPathPart( 0, 'posts' ).validatePath();
			} ).not.to.throw();
			expect( request.toString() ).to.equal( '/posts' );
		} );

		it( 'allows any value for a level if no validate function is specified', () => {
			request._levels = {
				'0': [ { component: '(?P<id>[\\d]+)' } ]
			};
			expect( () => {
				request.setPathPart( 0, 'foo' ).validatePath();
			} ).not.to.throw();
			expect( request.toString() ).to.equal( '/foo' );
		} );

		it( 'requires a level to conform to a validate function, when provided', () => {
			request._levels = {
				'0': [ {
					component: '(?P<id>[\\d]+)',
					validate: ( val ) => /^[\d]+$/.test( val )
				} ]
			};
			expect( () => {
				request.setPathPart( 0, 'foo' ).validatePath();
			} ).to.throw( 'foo does not match (?P<id>[\\d]+)' );
		} );

		it( 'allows any value for a level that passes a validate function, when provided', () => {
			request._levels = {
				'0': [ {
					component: '(?P<id>[\\d]+)',
					validate: ( val ) => /^[\d]+$/.test( val )
				} ]
			};
			expect( () => {
				request.setPathPart( 0, '42' ).validatePath();
			} ).not.to.throw();
			expect( request.toString() ).to.equal( '/42' );
		} );

		it( 'requires a level to conform to any of several validate functions when provided', () => {
			request._levels = {
				'0': [ {
					component: '(?P<id>[\\d]+)',
					validate: ( val ) => /^[\d]+$/.test( val )
				}, {
					component: 'posts',
					validate: ( val ) => 'posts' === val
				}, {
					component: 'pages',
					validate: ( val ) => 'pages' === val
				} ]
			};
			expect( () => {
				request.setPathPart( 0, 'foo' ).validatePath();
			} ).to.throw( 'foo does not match any of (?P<id>[\\d]+), posts, pages' );
		} );

		it( 'allows any value for a level that passes any of the available validate functions', () => {
			request._levels = {
				'0': [ {
					component: '(?P<id>[\\d]+)',
					validate: ( val ) => /^[\d]+$/.test( val )
				}, {
					component: 'posts',
					validate: ( val ) => 'posts' === val
				}, {
					component: 'pages',
					validate: ( val ) => 'pages' === val
				} ]
			};
			expect( () => {
				request.setPathPart( 0, 'posts' ).validatePath();
			} ).not.to.throw();
			expect( request.toString() ).to.equal( '/posts' );
		} );

		it( 'catches missing path parts if _levels are specified', () => {
			request._levels = {
				'0': [ { component: '(?P<parent>[\\d]+)' } ],
				'1': [ { component: 'revisions' } ]
				// '2': [ { component: '(?P<id>[\\d]+)' } ]
			};
			expect( () => {
				request.setPathPart( 1, 'revisions' ).validatePath();
			} ).to.throw( 'Incomplete URL! Missing component: / ??? /revisions' );
		} );

	} );

} );
