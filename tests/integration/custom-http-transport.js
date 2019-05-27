'use strict';

const credentials = require( '../helpers/constants' ).credentials;

// Variable to use as our "success token" in promise assertions
const SUCCESS = 'success';

describe.each( [
	[ 'wpapi/superagent', require( '../../superagent' ), require( '../../superagent/superagent-transport' ) ],
] )( '%s: custom HTTP transport methods', ( transportName, WPAPI, httpTransport ) => {
	let wp;
	let id;
	let cache;
	let cachingGet;

	beforeEach( () => {
		cache = {};
		cachingGet = jest.fn( ( wpreq, cb ) => {
			const result = cache[ wpreq ];
			// If a cache hit is found, return it via the same callback/promise
			// signature as the default transport method
			if ( result ) {
				if ( cb && typeof cb === 'function' ) {
					cb( null, result );
				}
				return Promise.resolve( result );
			}

			// Delegate to default transport if no cached data was found
			return WPAPI.transport.get( wpreq, cb ).then( ( result ) => {
				cache[ wpreq ] = result;
				return result;
			} );
		} );

		return WPAPI.site( 'http://wpapi.local/wp-json' )
			.posts()
			.perPage( 1 )
			.then( ( posts ) => {
				id = posts[ 0 ].id;

				// Set up our spy here so the request to get the ID isn't counted
				jest.spyOn( httpTransport, 'get' );
			} );
	} );

	afterEach( () => {
		httpTransport.get.mockRestore();
	} );

	it( 'can be defined to e.g. use a cache when available', () => {
		wp = new WPAPI( {
			endpoint: 'http://wpapi.local/wp-json',
			transport: {
				get: cachingGet,
			},
		} ).auth( credentials );

		const query1 = wp.posts().id( id );
		let query2;

		const prom = query1
			.get()
			.then( ( result ) => {
				expect( result.id ).toBe( id );
				expect( cachingGet ).toBeCalledTimes( 1 );
				expect( httpTransport.get ).toHaveBeenCalledTimes( 1 );
				expect( httpTransport.get ).toHaveBeenCalledWith( query1, undefined );
				expect( result ).toBe( cache[ 'http://wpapi.local/wp-json/wp/v2/posts/' + id ] );
			} )
			.then( () => {
				query2 = wp.posts().id( id );
				return query2.get();
			} )
			.then( ( result ) => {
				expect( cachingGet ).toBeCalledTimes( 2 );
				expect( httpTransport.get ).toHaveBeenCalledTimes( 1 );
				expect( httpTransport.get ).toHaveBeenLastCalledWith( query1, undefined );
				expect( httpTransport.get.mock.calls[0][0] ).not.toBe( query2 );
				expect( result ).toBe( cache[ 'http://wpapi.local/wp-json/wp/v2/posts/' + id ] );
				return SUCCESS;
			} );

		return prom;

		// return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'can be defined to transform responses', () => {
		const extractSlug = ( results ) => {
			if ( Array.isArray( results ) && results.length === 1 ) {
				return results[0];
			}
			return results;
		};

		wp = new WPAPI( {
			endpoint: 'http://wpapi.local/wp-json',
			transport: {
				// If .slug is used, auto-unwrap the returned array
				get( wpreq, cb ) {
					if ( ! wpreq._params.slug ) {
						return WPAPI.transport.get.call( this, wpreq, cb );
					}
					return WPAPI.transport.get( wpreq ).then( ( results ) => {
						const result = extractSlug( results );
						if ( cb && typeof cb === 'function' ) {
							cb( null, result );
						}
						return result;
					} );
				},
			},
		} );

		const prom = wp.posts().slug( 'template-more-tag' )
			.then( ( results ) => {
				expect( typeof results ).toBe( 'object' );
				expect( Array.isArray( results ) ).toBe( false );
				expect( results.title.rendered ).toBe( 'Template: More Tag' );
				return SUCCESS;
			} );

		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'can be defined to augment responses', () => {
		class Collection {
			constructor( arr ) {
				this.data = arr;
			}
			pluck( key ) {
				return this.data.map( val => val[ key ] );
			}
		}

		wp = new WPAPI( {
			endpoint: 'http://wpapi.local/wp-json',
			transport: {
				// Add collection helper methods to the returned arrays
				get( wpreq, cb ) {
					return WPAPI.transport.get.call( this, wpreq, cb ).then( ( results ) => {
						if ( Array.isArray( results ) ) {
							return new Collection( results );
						}
					} );
				},
			},
		} );

		const prom = wp.posts()
			.then( ( results ) => {
				expect( results ).toBeInstanceOf( Collection );
				expect( results.pluck( 'slug' ) ).toEqual( [
					'markup-html-tags-and-formatting',
					'markup-image-alignment',
					'markup-text-alignment',
					'title-with-special-characters',
					'markup-title-with-markup',
					'template-featured-image-vertical',
					'template-featured-image-horizontal',
					'template-more-tag',
					'template-excerpt-defined',
					'template-excerpt-generated',
				] );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

} );
