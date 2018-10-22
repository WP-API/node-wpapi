'use strict';
var chai = require( 'chai' );
// Variable to use as our "success token" in promise assertions
var SUCCESS = 'success';
// Chai-as-promised and the `expect( prom ).to.eventually.equal( SUCCESS ) is
// used to ensure that the assertions running within the promise chains are
// actually run.
chai.use( require( 'chai-as-promised' ) );
var expect = chai.expect;

/*jshint -W079 */// Suppress warning about redefiniton of `Promise`
var Promise = require( 'es6-promise' ).Promise;
var path = require( 'path' );
var _unique = require( 'lodash.uniq' );
var objectReduce = require( '../../lib/util/object-reduce' );
var httpTestUtils = require( './helpers/http-test-utils' );

var WPAPI = require( '../../' );
var WPRequest = require( '../../lib/constructors/wp-request.js' );

// Inspecting the titles of the returned posts arrays is an easy way to
// validate that the right page of results was returned
var getTitles = require( './helpers/get-rendered-prop' ).bind( null, 'title' );
var credentials = require( './helpers/constants' ).credentials;

var filePath = path.join( __dirname, 'assets/emilygarfield-untitled.jpg' );

var expectedResults = {
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
			'Image Alignment 580&#215;300'
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
			'Brazil Beach'
		],
		page4: [
			'Yachtsody in Blue',
			'Boardwalk',
			'Sunburst Over River',
			'Golden Gate Bridge',
			'Bell on Wharf',
			'dsc20050813_115856_52',
			'dsc20050727_091048_222',
			'canola2'
		]
	}
};

describe( 'integration: media()', () => {
	var wp;
	var authenticated;

	beforeEach( () => {
		wp = new WPAPI({
			endpoint: 'http://wpapi.local/wp-json'
		});
		authenticated = new WPAPI({
			endpoint: 'http://wpapi.local/wp-json'
		}).auth( credentials );
	});

	it( 'an be used to retrieve a list of media items', () => {
		var prom = wp.media()
			.get()
			.then( ( media ) => {
				expect( media ).to.be.an( 'array' );
				expect( media.length ).to.equal( 10 );
				return SUCCESS;
			});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	it( 'fetches the 10 most recent media by default', () => {
		var prom = wp.media()
			.get()
			.then( ( media ) => {
				expect( getTitles( media ) ).to.deep.equal( expectedResults.titles.page1 );
				return SUCCESS;
			});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	describe( 'paging properties', () => {

		it( 'are exposed as _paging on the response array', () => {
			var prom = wp.media()
				.get()
				.then( ( media ) => {
					expect( media ).to.have.property( '_paging' );
					expect( media._paging ).to.be.an( 'object' );
					return SUCCESS;
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'include the total number of media: use .headers() for coverage reasons', () => {
			var prom = wp.media()
				.headers()
				.then( ( postHeadersResponse ) => {
					expect( postHeadersResponse ).to.have.property( 'x-wp-total' );
					expect( postHeadersResponse[ 'x-wp-total' ] ).to.equal( '38' );
					return SUCCESS;
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'include the total number of pages available', () => {
			var prom = wp.media()
				.get()
				.then( ( media ) => {
					expect( media._paging ).to.have.property( 'totalPages' );
					expect( media._paging.totalPages ).to.equal( '4' );
					return SUCCESS;
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'provides a bound WPRequest for the next page as .next', () => {
			var prom = wp.media()
				.get()
				.then( ( media ) => {
					expect( media._paging ).to.have.property( 'next' );
					expect( media._paging.next ).to.be.an( 'object' );
					expect( media._paging.next ).to.be.an.instanceOf( WPRequest );
					expect( media._paging.next._options.endpoint ).to
						.equal( 'http://wpapi.local/wp-json/wp/v2/media?page=2' );
					// Get last page & ensure "next" no longer appears
					return wp.media()
						.page( media._paging.totalPages )
						.get()
						.then( ( media ) => {
							expect( media._paging ).not.to.have.property( 'next' );
							expect( getTitles( media ) ).to.deep.equal( expectedResults.titles.page4 );
							return SUCCESS;
						});
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'allows access to the next page of results via .next', () => {
			var prom = wp.media()
				.get()
				.then( ( media ) => {
					return media._paging.next
						.get()
						.then( ( media ) => {
							expect( media ).to.be.an( 'array' );
							expect( media.length ).to.equal( 10 );
							expect( getTitles( media ) ).to.deep.equal( expectedResults.titles.page2 );
							return SUCCESS;
						});
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'provides a bound WPRequest for the previous page as .prev', () => {
			var prom = wp.media()
				.get()
				.then( ( media ) => {
					expect( media._paging ).not.to.have.property( 'prev' );
					return media._paging.next
						.get()
						.then( ( media ) => {
							expect( media._paging ).to.have.property( 'prev' );
							expect( media._paging.prev ).to.be.an( 'object' );
							expect( media._paging.prev ).to.be.an.instanceOf( WPRequest );
							expect( media._paging.prev._options.endpoint ).to
								.equal( 'http://wpapi.local/wp-json/wp/v2/media?page=1' );
							return SUCCESS;
						});
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'allows access to the previous page of results via .prev', () => {
			var prom = wp.media()
				.page( 2 )
				.get()
				.then( ( media ) => {
					expect( getTitles( media ) ).to.deep.equal( expectedResults.titles.page2 );
					return media._paging.prev
						.get()
						.then( ( media ) => {
							expect( media ).to.be.an( 'array' );
							expect( media.length ).to.equal( 10 );
							expect( getTitles( media ) ).to.deep.equal( expectedResults.titles.page1 );
							return SUCCESS;
						});
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

	});

	describe( 'without authentication', () => {

		it( 'cannot POST', () => {
			var prom = wp.media()
				.file( filePath )
				.create({
					title: 'Media File',
					content: 'Some Content'
				})
				.catch( ( err ) => {
					httpTestUtils.rethrowIfChaiError( err );
					expect( err.code ).to.equal( 'rest_cannot_create' );
					expect( err.data ).to.deep.equal({
						status: 401
					});
					return SUCCESS;
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'cannot PUT', () => {
			var prom = wp.media()
				.perPage( 1 )
				.get()
				.then( ( media ) => {
					var id = media[ 0 ].id;
					return wp.media()
						.id( id )
						.update({
							title: 'New Title'
						});
				})
				.catch( ( err ) => {
					httpTestUtils.rethrowIfChaiError( err );
					expect( err.code ).to.equal( 'rest_cannot_edit' );
					expect( err.data ).to.deep.equal({
						status: 401
					});
					return SUCCESS;
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'cannot DELETE', () => {
			var prom = wp.media()
				.perPage( 1 )
				.get()
				.then( ( media ) => {
					var id = media[ 0 ].id;
					return wp.media().id( id ).delete({
						force: true
					});
				})
				.catch( ( err ) => {
					httpTestUtils.rethrowIfChaiError( err );
					expect( err.code ).to.equal( 'rest_cannot_delete' );
					expect( err.data ).to.deep.equal({
						status: 401
					});
					return SUCCESS;
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

	});

	it( 'can create, update & delete media when authenticated', () => {
		var id;
		var imageUrl;

		// CREATE
		var prom = authenticated.media()
			.file( filePath, 'ehg-conduits.jpg' )
			.create({
				title: 'Untitled',
				caption: 'A painting from Emily Garfield\'s "Conduits" series'
			})
			.then( ( createdMedia ) => {
				id = createdMedia.id;
				imageUrl = createdMedia.source_url;
				expect( createdMedia.title.rendered ).to.equal( 'Untitled' );
				expect( createdMedia.caption.raw ).to.equal( 'A painting from Emily Garfield\'s "Conduits" series' );

				// File name is correctly applied and image was uploaded to content dir
				expect( imageUrl ).to.match( /^http:\/\/wpapi.local\/content\/uploads\/.*\/ehg-conduits.jpg$/ );
			})
			// UPDATE
			.then( () => authenticated.media()
				.id( id )
				.update({
					title: 'Conduits Series',
					alt_text: 'A photograph of an abstract painting by Emily Garfield'
				})
			)
			.then( ( result ) => {
				expect( result.id ).to.equal( id );
				expect( result.title.rendered ).to.equal( 'Conduits Series' );
				expect( result.alt_text ).to.equal( 'A photograph of an abstract painting by Emily Garfield' );
				return result;
			})
			// READ
			// Validate thumbnails were created
			.then( ( result ) => {
				var sizes = result.media_details.sizes;
				var sizeURLs = objectReduce( sizes, ( urls, size ) => urls.concat( size.source_url ), [] );

				// Expect all sizes to have different URLs
				expect( Object.keys( sizes ).length ).to.equal( _unique( sizeURLs ).length );
				return sizeURLs.reduce( ( previous, sizeURL ) => previous.then( () => (
					httpTestUtils.expectStatusCode( sizeURL, 200 )
				) ), Promise.resolve() );
			})
			// Validate image was uploaded correctly
			.then( () => {
				return httpTestUtils.expectFileEqualsURL( filePath, imageUrl );
			})
			// DELETE
			.then( () => {
				// Attempt to delete media: expect this to fail, since media does not
				// support being trashed and can only be permanently removed
				return authenticated.media()
					.id( id )
					.delete();
			})
			.catch( ( error ) => {
				httpTestUtils.rethrowIfChaiError( error );
				expect( error.code ).to.equal( 'rest_trash_not_supported' );
				expect( error.data ).to.deep.equal({
					status: 501
				});
				// Now permanently delete this media
				return authenticated.media()
					.id( id )
					.delete({
						force: true
					});
			})
			.then( ( response ) => {
				expect( response ).to.be.an( 'object' );
				// DELETE action returns the media object as the .previous property
				expect( response.previous ).to.be.an( 'object' );
				expect( response.previous.id ).to.equal( id );
				// Query for the media: expect this to fail, since it has been deleted
				return wp.media().id( id );
			})
			.catch( ( error ) => {
				httpTestUtils.rethrowIfChaiError( error );
				expect( error.code ).to.equal( 'rest_post_invalid_id' );
				expect( error.data ).to.deep.equal({
					status: 404
				});
			})
			// Validate image file has been removed
			.then( () => {
				return httpTestUtils.expectStatusCode( imageUrl, 404 );
			})
			.then( () => {
				return SUCCESS;
			});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

});
