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

		beforeEach( () => {
			jest.spyOn( httpTransport, 'get' ).mockImplementation( () => {} );
		} );

		afterEach( () => {
			httpTransport.get.mockRestore();
		} );

		it( 'is a function', () => {
			expect( WPAPI ).toHaveProperty( 'discover' );
			expect( typeof WPAPI.discover ).toBe( 'function' );
		} );

		it( 'discovers the API root with a GET request', () => {
			const url = 'http://mozarts.house';
			httpTransport.get.mockImplementation( () => Promise.resolve( {
				name: 'Skip Beats',
				descrition: 'Just another WordPress weblog',
				routes: {
					'/': {
						_links: {
							self: 'http://mozarts.house/wp-json/',
						},
					},
					'list': {},
					'of': {},
					'routes': {},
				},
			} ) );
			const prom = WPAPI.discover( url )
				.then( ( result ) => {
					expect( result ).toBeInstanceOf( WPAPI );
					expect( result.root().toString() ).toBe( 'http://mozarts.house/wp-json/' );
					expect( httpTransport.get ).toBeCalledTimes( 1 );
					const indexRequestObject = httpTransport.get.mock.calls[0][0];
					expect( indexRequestObject.toString() ).toBe( 'http://mozarts.house/?rest_route=%2F' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'throws an error if no API endpoint can be discovered', () => {
			const url = 'http://we.made.it/to/mozarts/house';
			httpTransport.get.mockImplementationOnce( () => Promise.reject( 'Some error' ) );
			const prom = WPAPI.discover( url )
				.catch( ( err ) => {
					expect( err ).toBe( 'Some error' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

	} );

} );
