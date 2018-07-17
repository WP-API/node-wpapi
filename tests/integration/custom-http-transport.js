'use strict';
const chai = require( 'chai' );
const sinon = require( 'sinon' );
chai.use( require( 'sinon-chai' ) );
// Variable to use as our "success token" in promise assertions
const SUCCESS = 'success';
// Chai-as-promised and the `expect( prom ).to.eventually.equal( SUCCESS ) is
// used to ensure that the assertions running within the promise chains are
// actually run.
chai.use( require( 'chai-as-promised' ) );
const expect = chai.expect;

const WPAPI = require( '../../' );

const httpTransport = require( '../../lib/http-transport' );

const credentials = require( './helpers/constants' ).credentials;

describe( 'integration: custom HTTP transport methods', () => {
	let wp;
	let id;
	let cache;
	let cachingGet;

	beforeEach( () => {
		cache = {};
		cachingGet = sinon.spy( ( wpreq, cb ) => {
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
				sinon.spy( httpTransport, 'get' );
			} );
	} );

	afterEach( () => {
		httpTransport.get.restore();
	} );

	it( 'can be defined to e.g. use a cache when available', () => {
		let query1;
		let query2;

		wp = new WPAPI( {
			endpoint: 'http://wpapi.local/wp-json',
			transport: {
				get: cachingGet,
			},
		} ).auth( credentials );

		query1 = wp.posts().id( id );
		const prom = query1
			.get()
			.then( ( result ) => {
				expect( result.id ).to.equal( id );
				expect( cachingGet.callCount ).to.equal( 1 );
				expect( httpTransport.get.callCount ).to.equal( 1 );
				expect( httpTransport.get ).to.have.been.calledWith( query1 );
				expect( result ).to.equal( cache[ 'http://wpapi.local/wp-json/wp/v2/posts/' + id ] );
			} )
			.then( () => {
				query2 = wp.posts().id( id );
				return query2.get();
			} )
			.then( ( result ) => {
				expect( cachingGet.callCount ).to.equal( 2 );
				expect( httpTransport.get.callCount ).to.equal( 1 );
				// sinon will try to use toString when comparing arguments in calledWith,
				// so we mess with that method to properly demonstrate the inequality
				query2.toString = () => {};
				expect( httpTransport.get ).not.to.have.been.calledWith( query2 );
				expect( result ).to.equal( cache[ 'http://wpapi.local/wp-json/wp/v2/posts/' + id ] );
				return SUCCESS;
			} );

		return expect( prom ).to.eventually.equal( SUCCESS );
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
						/* jshint validthis:true */
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
				expect( results ).to.be.an( 'object' );
				expect( Array.isArray( results ) ).to.equal( false );
				expect( results.title.rendered ).to.equal( 'Template: More Tag' );
				return SUCCESS;
			} );

		return expect( prom ).to.eventually.equal( SUCCESS );
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
					/* jshint validthis:true */
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
				expect( results ).to.be.an.instanceOf( Collection );
				expect( results.pluck( 'slug' ) ).to.deep.equal( [
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
		return expect( prom ).to.eventually.equal( SUCCESS );
	} );

} );
