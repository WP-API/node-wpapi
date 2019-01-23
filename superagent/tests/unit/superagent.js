'use strict';

const WPAPI = require( '../../' );

// HTTP transport, for stubbing
const httpTransport = require( '../../http-transport' );

// Variable to use as our "success token" in promise assertions
const SUCCESS = 'success';

describe( 'WPAPI', () => {

	describe( 'constructor', () => {

		describe( 'assigns default HTTP transport', () => {

			it( 'for GET requests', () => {
				jest.spyOn( httpTransport, 'get' ).mockImplementation( () => {} );
				const site = new WPAPI( {
					endpoint: 'http://some.url.com/wp-json',
				} );
				const query = site.root( '' );
				query.get();
				expect( httpTransport.get ).toHaveBeenCalledWith( query, undefined );
				httpTransport.get.mockRestore();
			} );

			it( 'for POST requests', () => {
				jest.spyOn( httpTransport, 'post' ).mockImplementation( () => {} );
				const site = new WPAPI( {
					endpoint: 'http://some.url.com/wp-json',
				} );
				const query = site.root( '' );
				const data = {};
				query.create( data );
				expect( httpTransport.post ).toHaveBeenCalledWith( query, data, undefined );
				httpTransport.post.mockRestore();
			} );

			it( 'for POST requests', () => {
				jest.spyOn( httpTransport, 'post' ).mockImplementation( () => {} );
				const site = new WPAPI( {
					endpoint: 'http://some.url.com/wp-json',
				} );
				const query = site.root( '' );
				const data = {};
				query.create( data );
				expect( httpTransport.post ).toHaveBeenCalledWith( query, data, undefined );
				httpTransport.post.mockRestore();
			} );

			it( 'for PUT requests', () => {
				jest.spyOn( httpTransport, 'put' ).mockImplementation( () => {} );
				const site = new WPAPI( {
					endpoint: 'http://some.url.com/wp-json',
				} );
				const query = site.root( 'a-resource' );
				const data = {};
				query.update( data );
				expect( httpTransport.put ).toHaveBeenCalledWith( query, data, undefined );
				httpTransport.put.mockRestore();
			} );

			it( 'for DELETE requests', () => {
				jest.spyOn( httpTransport, 'delete' ).mockImplementation( () => {} );
				const site = new WPAPI( {
					endpoint: 'http://some.url.com/wp-json',
				} );
				const query = site.root( 'a-resource' );
				const data = {
					force: true,
				};
				query.delete( data );
				expect( httpTransport.delete ).toHaveBeenCalledWith( query, data, undefined );
				httpTransport.delete.mockRestore();
			} );

		} );

	} );

	describe( '.transport constructor property', () => {

		it( 'is defined', () => {
			expect( WPAPI ).toHaveProperty( 'transport' );
		} );

		it( 'is an object', () => {
			expect( typeof WPAPI.transport ).toBe( 'object' );
		} );

		it( 'has methods for each http transport action', () => {
			expect( typeof WPAPI.transport.delete ).toBe( 'function' );
			expect( typeof WPAPI.transport.get ).toBe( 'function' );
			expect( typeof WPAPI.transport.head ).toBe( 'function' );
			expect( typeof WPAPI.transport.post ).toBe( 'function' );
			expect( typeof WPAPI.transport.put ).toBe( 'function' );
		} );

		it( 'is frozen (properties cannot be modified directly)', () => {
			expect( () => {
				WPAPI.transport.get = () => {};
			} ).toThrow();
		} );

	} );

	describe( '.discover() constructor method', () => {
		let responses;

		beforeEach( () => {
			responses = {
				head: {},
				get: {},
			};
			responses.head.withLink = {
				'content-type': 'text/html; charset=UTF-8',
				link: '<http://mozarts.house/wp-json/>; rel="https://api.w.org/"',
			};
			responses.head.withoutLink = {
				'content-type': 'text/html; charset=utf-8',
			};
			responses.get.withLink = {
				headers: {
					'content-type': 'text/html; charset=UTF-8',
					link: '<http://mozarts.house/wp-json/>; rel="https://api.w.org/"',
				},
			};
			responses.get.withoutLink = {
				headers: {
					'content-type': 'text/html; charset=UTF-8',
				},
			};
			responses.apiRoot = {
				name: 'Skip Beats',
				descrition: 'Just another WordPress weblog',
				routes: {
					'list': {},
					'of': {},
					'routes': {},
				},
			};
			// Stub HTTP methods
			jest.spyOn( httpTransport, 'head' ).mockImplementation( () => {} );
			jest.spyOn( httpTransport, 'get' ).mockImplementation( () => {} );
			// Stub warn and error
			jest.spyOn( global.console, 'warn' ).mockImplementation( () => {} );
			jest.spyOn( global.console, 'error' ).mockImplementation( () => {} );
		} );

		afterEach( () => {
			// Restore HTTP methods
			httpTransport.head.mockRestore();
			httpTransport.get.mockRestore();
		} );

		it( 'is a function', () => {
			expect( WPAPI ).toHaveProperty( 'discover' );
			expect( typeof WPAPI.discover ).toBe( 'function' );
		} );

		it( 'throws an error if no API endpoint can be discovered', () => {
			const url = 'http://we.made.it/to/mozarts/house';
			httpTransport.head.mockImplementationOnce( () => Promise.reject() );
			httpTransport.get.mockImplementationOnce( () => Promise.reject( 'Some error' ) );
			const prom = WPAPI.discover( url )
				.catch( ( err ) => {
					expect( global.console.error ).toHaveBeenCalledWith( 'Some error' );
					expect( err.message ).toBe( 'Autodiscovery failed' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'discovers the API root with a HEAD request', () => {
			const url = 'http://mozarts.house';
			httpTransport.head.mockImplementation( () => Promise.resolve( responses.head.withLink ) );
			httpTransport.get.mockImplementation( () => Promise.resolve( responses.apiRoot ) );
			const prom = WPAPI.discover( url )
				.then( ( result ) => {
					expect( result ).toBeInstanceOf( WPAPI );
					expect( httpTransport.head ).toBeCalledTimes( 1 );
					expect( httpTransport.get ).toBeCalledTimes( 1 );
					expect( result.root().toString() ).toBe( 'http://mozarts.house/wp-json/' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'throws an error if HEAD succeeds but no link is present', () => {
			const url = 'http://we.made.it/to/mozarts/house';
			httpTransport.head.mockImplementationOnce( () => Promise.resolve( responses.head.withoutLink ) );
			const prom = WPAPI.discover( url )
				.catch( ( err ) => {
					expect( global.console.error ).toHaveBeenCalledWith(
						new Error( 'No header link found with rel="https://api.w.org/"' )
					);
					expect( err.message ).toBe( 'Autodiscovery failed' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'retries the initial site request as a GET if HEAD fails', () => {
			const url = 'http://mozarts.house';
			httpTransport.head.mockImplementation( () => Promise.reject() );
			httpTransport.get.mockImplementationOnce( () => Promise.resolve( responses.get.withLink ) );
			httpTransport.get.mockImplementationOnce( () => Promise.resolve( responses.apiRoot ) );
			const prom = WPAPI.discover( url )
				.then( ( result ) => {
					expect( result ).toBeInstanceOf( WPAPI );
					expect( httpTransport.head ).toBeCalledTimes( 1 );
					expect( httpTransport.get ).toBeCalledTimes( 2 );
					expect( result.root().toString() ).toBe( 'http://mozarts.house/wp-json/' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'throws an error if GET retry succeeds but no link is present', () => {
			const url = 'http://we.made.it/to/mozarts/house';
			httpTransport.head.mockImplementation( () => Promise.reject() );
			httpTransport.get.mockImplementationOnce( () => Promise.resolve( responses.get.withoutLink ) );
			const prom = WPAPI.discover( url )
				.catch( ( err ) => {
					expect( global.console.error ).toHaveBeenCalledWith(
						new Error( 'No header link found with rel="https://api.w.org/"' )
					);
					expect( err.message ).toBe( 'Autodiscovery failed' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'returns WPAPI instance bound to discovered root even when route request errors', () => {
			const url = 'http://mozarts.house';
			httpTransport.head.mockImplementation( () => Promise.reject() );
			httpTransport.get
				.mockImplementationOnce( () => Promise.resolve( responses.get.withLink ) )
				.mockImplementationOnce( () => Promise.reject( 'Some error' ) );
			const prom = WPAPI.discover( url )
				.then( ( result ) => {
					expect( result ).toBeInstanceOf( WPAPI );
					expect( httpTransport.head ).toBeCalledTimes( 1 );
					expect( httpTransport.get ).toBeCalledTimes( 2 );
					expect( global.console.error ).toHaveBeenCalledWith( 'Some error' );
					expect( global.console.warn ).toHaveBeenCalledWith( 'Endpoint detected, proceeding despite error...' );
					expect( result.root().toString() ).toBe( 'http://mozarts.house/wp-json/' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

	} );

} );
