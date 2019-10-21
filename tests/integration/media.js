'use strict';

const path = require( 'path' );
const objectReduce = require( '../../lib/util/object-reduce' );
const httpTestUtils = require( '../helpers/http-test-utils' );
const unique = require( '../../lib/util/unique' );

const WPRequest = require( '../../lib/constructors/wp-request.js' );

// Inspecting the titles of the returned posts arrays is an easy way to
// validate that the right page of results was returned
const getTitles = require( '../helpers/get-rendered-prop' ).bind( null, 'title' );
const credentials = require( '../helpers/constants' ).credentials;

const filePath = path.join( __dirname, 'assets/emilygarfield-untitled.jpg' );

// Variable to use as our "success token" in promise assertions
const SUCCESS = 'success';

const expectedResults = {
	titles: {
		page1: [
			'spectacles',
			'dsc20050315_145007_132',
			'dsc20050604_133440_34211',
			'dsc20040724_152504_532',
			'triforce-wallpaper',
			'Vertical Featured Image',
			'Horizontal Featured Image',
			'Unicorn Wallpaper',
			'Image Alignment 1200&#215;4002',
			'Image Alignment 580&#215;300',
		],
		page2: [
			'Image Alignment 300&#215;200',
			'Image Alignment 150&#215;150',
			'I Am Worth Loving Wallpaper',
			'OLYMPUS DIGITAL CAMERA',
			'St. Louis Blues',
			'dsc20050604_133440_3421',
			'dsc20040724_152504_532',
			'Boat Barco Texture',
			'Huatulco Coastline',
			'Brazil Beach',
		],
		page4: [
			'Yachtsody in Blue',
			'Boardwalk',
			'Sunburst Over River',
			'Golden Gate Bridge',
			'Bell on Wharf',
			'dsc20050813_115856_52',
			'dsc20050727_091048_222',
			'canola2',
		],
	},
};

describe.each( [
	[ 'wpapi/superagent', require( '../../superagent' ) ],
	[ 'wpapi/fetch', require( '../../fetch' ) ],
] )( '%s: media()', ( transportName, WPAPI ) => {
	let wp;
	let authenticated;

	beforeEach( () => {
		wp = new WPAPI( {
			endpoint: 'http://wpapi.local/wp-json',
		} );
		authenticated = new WPAPI( {
			endpoint: 'http://wpapi.local/wp-json',
		} ).auth( credentials );
	} );

	it( 'an be used to retrieve a list of media items', () => {
		const prom = wp.media()
			.get()
			.then( ( media ) => {
				expect( Array.isArray( media ) ).toBe( true );
				expect( media.length ).toBe( 10 );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'fetches the 10 most recent media by default', () => {
		const prom = wp.media()
			.get()
			.then( ( media ) => {
				expect( getTitles( media ) ).toEqual( expectedResults.titles.page1 );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	describe( 'paging properties', () => {

		it( 'are exposed as _paging on the response array', () => {
			const prom = wp.media()
				.get()
				.then( ( media ) => {
					expect( media ).toHaveProperty( '_paging' );
					expect( typeof media._paging ).toBe( 'object' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'include the total number of media: use .headers() for coverage reasons', () => {
			const prom = wp.media()
				.headers()
				.then( ( postHeadersResponse ) => {
					expect( postHeadersResponse ).toHaveProperty( 'x-wp-total' );
					expect( postHeadersResponse[ 'x-wp-total' ] ).toBe( '38' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'include the total number of pages available', () => {
			const prom = wp.media()
				.get()
				.then( ( media ) => {
					expect( media._paging ).toHaveProperty( 'totalPages' );
					expect( media._paging.totalPages ).toBe( 4 );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'provides a bound WPRequest for the next page as .next', () => {
			const prom = wp.media()
				.get()
				.then( ( media ) => {
					expect( media._paging ).toHaveProperty( 'next' );
					expect( typeof media._paging.next ).toBe( 'object' );
					expect( media._paging.next ).toBeInstanceOf( WPRequest );
					expect( media._paging.next._options.endpoint )
						.toEqual( 'http://wpapi.local/wp-json/wp/v2/media?page=2' );
					// Get last page & ensure "next" no longer appears
					return wp.media()
						.page( media._paging.totalPages )
						.get()
						.then( ( media ) => {
							expect( media._paging ).not.toHaveProperty( 'next' );
							expect( getTitles( media ) ).toEqual( expectedResults.titles.page4 );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'allows access to the next page of results via .next', () => {
			const prom = wp.media()
				.get()
				.then( ( media ) => {
					return media._paging.next
						.get()
						.then( ( media ) => {
							expect( Array.isArray( media ) ).toBe( true );
							expect( media.length ).toBe( 10 );
							expect( getTitles( media ) ).toEqual( expectedResults.titles.page2 );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'provides a bound WPRequest for the previous page as .prev', () => {
			const prom = wp.media()
				.get()
				.then( ( media ) => {
					expect( media._paging ).not.toHaveProperty( 'prev' );
					return media._paging.next
						.get()
						.then( ( media ) => {
							expect( media._paging ).toHaveProperty( 'prev' );
							expect( typeof media._paging.prev ).toBe( 'object' );
							expect( media._paging.prev ).toBeInstanceOf( WPRequest );
							expect( media._paging.prev._options.endpoint )
								.toEqual( 'http://wpapi.local/wp-json/wp/v2/media?page=1' );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'allows access to the previous page of results via .prev', () => {
			const prom = wp.media()
				.page( 2 )
				.get()
				.then( ( media ) => {
					expect( getTitles( media ) ).toEqual( expectedResults.titles.page2 );
					return media._paging.prev
						.get()
						.then( ( media ) => {
							expect( Array.isArray( media ) ).toBe( true );
							expect( media.length ).toBe( 10 );
							expect( getTitles( media ) ).toEqual( expectedResults.titles.page1 );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

	} );

	describe( 'without authentication', () => {

		it( 'cannot POST', () => {
			const prom = wp.media()
				.file( filePath )
				.create( {
					title: 'Media File',
					content: 'Some Content',
				} )
				.catch( ( err ) => {
					expect( err.code ).toBe( 'rest_cannot_create' );
					expect( err.data ).toEqual( {
						status: 401,
					} );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'cannot PUT', () => {
			const prom = wp.media()
				.perPage( 1 )
				.get()
				.then( ( media ) => {
					const id = media[ 0 ].id;
					return wp.media()
						.id( id )
						.update( {
							title: 'New Title',
						} );
				} )
				.catch( ( err ) => {
					expect( err.code ).toBe( 'rest_cannot_edit' );
					expect( err.data ).toEqual( {
						status: 401,
					} );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'cannot DELETE', () => {
			const prom = wp.media()
				.perPage( 1 )
				.get()
				.then( ( media ) => {
					const id = media[ 0 ].id;
					return wp.media().id( id ).delete( {
						force: true,
					} );
				} )
				.catch( ( err ) => {
					expect( err.code ).toBe( 'rest_cannot_delete' );
					expect( err.data ).toEqual( {
						status: 401,
					} );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

	} );

	it( 'can create, update & delete media when authenticated', () => {
		let id;
		let imageUrl;

		// CREATE
		const prom = authenticated.media()
			.file( filePath, 'ehg-conduits.jpg' )
			.create( {
				title: 'Untitled',
				caption: 'A painting from Emily Garfield\'s "Conduits" series',
			} )
			.then( ( createdMedia ) => {
				id = createdMedia.id;
				imageUrl = createdMedia.source_url;
				expect( createdMedia.title.rendered ).toBe( 'Untitled' );
				expect( createdMedia.caption.raw ).toBe( 'A painting from Emily Garfield\'s "Conduits" series' );

				// File name is correctly applied and image was uploaded to content dir
				expect( imageUrl ).toMatch( /^http:\/\/wpapi.local\/content\/uploads\/.*\/ehg-conduits.jpg$/ );
			} )
			// UPDATE
			.then( () => authenticated.media()
				.id( id )
				.update( {
					title: 'Conduits Series',
					alt_text: 'A photograph of an abstract painting by Emily Garfield',
				} )
			)
			.then( ( result ) => {
				expect( result.id ).toBe( id );
				expect( result.title.rendered ).toBe( 'Conduits Series' );
				expect( result.alt_text ).toBe( 'A photograph of an abstract painting by Emily Garfield' );
				return result;
			} )
			// READ
			// Validate thumbnails were created
			.then( ( result ) => {
				const sizes = result.media_details.sizes;
				const sizeURLs = objectReduce( sizes, ( urls, size ) => urls.concat( size.source_url ), [] );

				// Expect all sizes to have different URLs
				expect( Object.keys( sizes ).length ).toBe( unique( sizeURLs ).length );
				return sizeURLs.reduce( ( previous, sizeURL ) => previous.then( () => (
					httpTestUtils.expectStatusCode( sizeURL, 200 )
				) ), Promise.resolve() );
			} )
			// Validate image was uploaded correctly
			.then( () => {
				return httpTestUtils.expectFileEqualsURL( filePath, imageUrl );
			} )
			// DELETE
			.then( () => {
				// Attempt to delete media: expect this to fail, since media does not
				// support being trashed and can only be permanently removed
				return authenticated.media()
					.id( id )
					.delete();
			} )
			.catch( ( error ) => {
				expect( error.code ).toBe( 'rest_trash_not_supported' );
				expect( error.data ).toEqual( {
					status: 501,
				} );
				// Now permanently delete this media
				return authenticated.media()
					.id( id )
					.delete( {
						force: true,
					} );
			} )
			.then( ( response ) => {
				expect( typeof response ).toBe( 'object' );
				// DELETE action returns the media object as the .previous property
				expect( typeof response.previous ).toBe( 'object' );
				expect( response.previous.id ).toBe( id );
				// Query for the media: expect this to fail, since it has been deleted
				return wp.media().id( id );
			} )
			.catch( ( error ) => {
				expect( error.code ).toBe( 'rest_post_invalid_id' );
				expect( error.data ).toEqual( {
					status: 404,
				} );
			} )
			// Validate image file has been removed
			.then( () => {
				return httpTestUtils.expectStatusCode( imageUrl, 404 );
			} )
			.then( () => {
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

} );
