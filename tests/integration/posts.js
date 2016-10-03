'use strict';
var path = require( 'path' );
var chai = require( 'chai' );
// Variable to use as our "success token" in promise assertions
var SUCCESS = 'success';
// Chai-as-promised and the `expect( prom ).to.eventually.equal( SUCCESS ) is
// used to ensure that the assertions running within the promise chains are
// actually run.
chai.use( require( 'chai-as-promised' ) );
var expect = chai.expect;
var httpTestUtils = require( './helpers/http-test-utils' );

/*jshint -W079 */// Suppress warning about redefiniton of `Promise`
var Promise = require( 'es6-promise' ).Promise;

var WPAPI = require( '../../' );
var WPRequest = require( '../../lib/constructors/wp-request.js' );

// Inspecting the titles of the returned posts arrays is an easy way to
// validate that the right page of results was returned
var getTitles = require( './helpers/get-rendered-prop' ).bind( null, 'title' );
var credentials = require( './helpers/constants' ).credentials;

// Define some arrays to use ensuring the returned data is what we expect
// it to be (e.g. an array of the titles from posts on the first page)
var expectedResults = {
	titles: {
		page1: [
			'Markup: HTML Tags and Formatting',
			'Markup: Image Alignment',
			'Markup: Text Alignment',
			'Markup: Title With Special Characters',
			'Markup: Title With Markup',
			'Template: Featured Image (Vertical)',
			'Template: Featured Image (Horizontal)',
			'Template: More Tag',
			'Template: Excerpt (Defined)',
			'Template: Excerpt (Generated)'
		],
		page2: [
			'Template: Paginated',
			'Template: Sticky',
			'Template: Password Protected (the password is &#8220;enter&#8221;)',
			'Template: Comments',
			'Template: Comments Disabled',
			'Template: Pingbacks And Trackbacks',
			'Media: Twitter Embeds',
			'Post Format: Standard',
			'Post Format: Gallery',
			'Post Format: Gallery (Tiled)'
		],
		page4: [
			'Post Format: Quote',
			'Post Format: Chat',
			'Antidisestablishmentarianism',
			'',
			'Edge Case: No Content',
			'Edge Case: Many Categories',
			'Edge Case: Many Tags',
			'Edge Case: Nested And Mixed Lists'
		]
	}
};

describe( 'integration: posts()', function() {
	var wp;
	var authenticated;

	beforeEach(function() {
		wp = new WPAPI({
			endpoint: 'http://wpapi.loc/wp-json'
		});
		authenticated = new WPAPI({
			endpoint: 'http://wpapi.loc/wp-json'
		}).auth( credentials );
	});

	it( 'can be used to retrieve a list of recent posts', function() {
		var prom = wp.posts()
			.get()
			.then(function( posts ) {
				expect( posts ).to.be.an( 'array' );
				expect( posts.length ).to.equal( 10 );
				return SUCCESS;
			});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	it( 'fetches the 10 most recent posts by default', function() {
		var prom = wp.posts()
			.get()
			.then(function( posts ) {
				expect( getTitles( posts ) ).to.deep.equal( expectedResults.titles.page1 );
				return SUCCESS;
			});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	describe( 'paging properties', function() {

		it( 'are exposed as _paging on the response array', function() {
			var prom = wp.posts()
				.get()
				.then(function( posts ) {
					expect( posts ).to.have.property( '_paging' );
					expect( posts._paging ).to.be.an( 'object' );
					return SUCCESS;
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'include the total number of posts: use .headers() for coverage reasons', function() {
			var prom = wp.posts()
				.headers()
				.then(function( postHeadersResponse ) {
					expect( postHeadersResponse ).to.have.property( 'x-wp-total' );
					expect( postHeadersResponse[ 'x-wp-total' ] ).to.equal( '38' );
					return SUCCESS;
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'include the total number of pages available', function() {
			var prom = wp.posts()
				.get()
				.then(function( posts ) {
					expect( posts._paging ).to.have.property( 'totalPages' );
					expect( posts._paging.totalPages ).to.equal( '4' );
					return SUCCESS;
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'provides a bound WPRequest for the next page as .next', function() {
			var prom = wp.posts()
				.get()
				.then(function( posts ) {
					expect( posts._paging ).to.have.property( 'next' );
					expect( posts._paging.next ).to.be.an( 'object' );
					expect( posts._paging.next ).to.be.an.instanceOf( WPRequest );
					expect( posts._paging.next._options.endpoint ).to
						.equal( 'http://wpapi.loc/wp-json/wp/v2/posts?page=2' );
					// Get last page & ensure "next" no longer appears
					return wp.posts()
						.page( posts._paging.totalPages )
						.get()
						.then(function( posts ) {
							expect( posts._paging ).not.to.have.property( 'next' );
							expect( getTitles( posts ) ).to.deep.equal( expectedResults.titles.page4 );
							return SUCCESS;
						});
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'allows access to the next page of results via .next', function() {
			var prom = wp.posts()
				.get()
				.then(function( posts ) {
					return posts._paging.next
						.get()
						.then(function( posts ) {
							expect( posts ).to.be.an( 'array' );
							// @TODO: re-enable once PPP support is merged
							// expect( posts.length ).to.equal( 10 );
							// expect( getTitles( posts ) ).to.deep.equal( expectedResults.titles.page2 );
							return SUCCESS;
						});
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'provides a bound WPRequest for the previous page as .prev', function() {
			var prom = wp.posts()
				.get()
				.then(function( posts ) {
					expect( posts._paging ).not.to.have.property( 'prev' );
					return posts._paging.next
						.get()
						.then(function( posts ) {
							expect( posts._paging ).to.have.property( 'prev' );
							expect( posts._paging.prev ).to.be.an( 'object' );
							expect( posts._paging.prev ).to.be.an.instanceOf( WPRequest );
							expect( posts._paging.prev._options.endpoint ).to
								.equal( 'http://wpapi.loc/wp-json/wp/v2/posts?page=1' );
							return SUCCESS;
						});
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'allows access to the previous page of results via .prev', function() {
			var prom = wp.posts()
				.page( 2 )
				.get()
				.then(function( posts ) {
					// @TODO: re-enable once PPP support is merged
					// expect( getTitles( posts ) ).to.deep.equal( expectedResults.titles.page2 );
					return posts._paging.prev
						.get()
						.then(function( posts ) {
							expect( posts ).to.be.an( 'array' );
							expect( posts.length ).to.equal( 10 );
							expect( getTitles( posts ) ).to.deep.equal( expectedResults.titles.page1 );
							return SUCCESS;
						});
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

	});

	describe( 'filter methods', function() {

		describe( 'slug', function() {

			it( 'can be used to return only posts with the specified slug', function() {
				var prom = wp.posts()
					.slug( 'template-excerpt-generated' )
					.get()
					.then(function( posts ) {
						expect( posts.length ).to.equal( 1 );
						expect( getTitles( posts ) ).to.deep.equal([
							'Template: Excerpt (Generated)'
						]);
						return SUCCESS;
					});
				return expect( prom ).to.eventually.equal( SUCCESS );
			});

		});

		describe( 'tag', function() {

			it( 'can be used to return only posts with a provided tag', function() {
				var prom = wp.posts()
					.tag( 'Title' )
					.get()
					.then(function( posts ) {
						expect( posts.length ).to.equal( 5 );
						expect( getTitles( posts ) ).to.deep.equal([
							'Markup: Title With Special Characters',
							'Markup: Title With Markup',
							'Antidisestablishmentarianism',
							'',
							'Edge Case: Many Tags'
						]);
						return SUCCESS;
					});
				return expect( prom ).to.eventually.equal( SUCCESS );
			});

			it( 'can be used to return only posts with all provided tags', function() {
				var prom = wp.posts()
					.tag([
						'Template',
						'Codex'
					])
					.get()
					.then(function( posts ) {
						expect( posts.length ).to.equal( 3 );
						expect( getTitles( posts ) ).to.deep.equal([
							'Template: Featured Image (Vertical)',
							'Template: Featured Image (Horizontal)',
							'Edge Case: Many Tags'
						]);
						return SUCCESS;
					});
				return expect( prom ).to.eventually.equal( SUCCESS );
			});

		});

		describe( 'category', function() {

			it( 'can be used to return only posts with a provided category', function() {
				var prom = wp.posts()
					.category( 'Markup' )
					.get()
					.then(function( posts ) {
						expect( posts.length ).to.equal( 6 );
						expect( getTitles( posts ) ).to.deep.equal([
							'Markup: HTML Tags and Formatting',
							'Markup: Image Alignment',
							'Markup: Text Alignment',
							'Markup: Title With Special Characters',
							'Markup: Title With Markup',
							'Edge Case: Many Categories'
						]);
						return SUCCESS;
					});
				return expect( prom ).to.eventually.equal( SUCCESS );
			});

			// Pending until we confirm whether querying by multiple category_name is permitted
			it( 'can be used to return only posts with all provided categories', function() {
				var prom = wp.posts()
					.category([
						'Markup',
						'pustule'
					])
					.get()
					.then(function( posts ) {
						expect( posts.length ).to.equal( 1 );
						expect( getTitles( posts ) ).to.deep.equal([
							'Edge Case: Many Categories'
						]);
						return SUCCESS;
					});
				return expect( prom ).to.eventually.equal( SUCCESS );
			});

		});

		describe( 'before', function() {

			it( 'can be used to return only posts from before a certain date', function() {
				var prom = wp.posts()
					.before( '2013-01-08' )
					.then(function( posts ) {
						expect( posts[0].title.rendered ).to.equal( 'Markup: Title With Special Characters' );
						return SUCCESS;
					});
				return expect( prom ).to.eventually.equal( SUCCESS );
			});

		});

		describe( 'after', function() {

			it( 'can be used to return only posts from after a certain date', function() {
				var prom = wp.posts()
					.after( '2013-01-08' )
					.then(function( posts ) {
						expect( posts.length ).to.equal( 3 );
						expect( getTitles( posts ) ).to.deep.equal( expectedResults.titles.page1.slice( 0, 3 ) );
						return SUCCESS;
					});
				return expect( prom ).to.eventually.equal( SUCCESS );
			});

		});

	});

	// Post creation, update & deletion suites

	it( 'cannot DELETE without authentication', function() {
		var id;
		var prom = wp.posts()
			.perPage( 1 )
			.get()
			.then(function( posts ) {
				id = posts[ 0 ].id;
				return wp.posts()
					.id( id )
					.delete();
			})
			.catch(function( err ) {
				expect( err ).to.be.an.instanceOf( Error );
				expect( err ).to.have.property( 'status' );
				expect( err.status ).to.equal( 401 );
				// Ensure that the post was NOT deleted by querying for it again
				return wp.posts()
					.id( id )
					.get();
			})
			.then(function( result ) {
				expect( result ).to.have.property( 'id' );
				expect( result.id ).to.equal( id );
				return SUCCESS;
			});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	it( 'cannot create (POST) without authentication (also tests callback-mode errors)', function() {
		var prom = new Promise(function( resolve, reject ) {
			wp.posts().create({
				title: 'New Post 2501',
				content: 'Some Content'
			}, function( err ) {
				if ( ! err ) {
					reject();
				}
				expect( err ).to.be.an.instanceOf( Error );
				expect( err ).to.have.property( 'status' );
				expect( err.status ).to.equal( 401 );
				resolve( SUCCESS );
			});
		});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	it( 'cannot update (PUT) without authentication', function() {
		var id;
		var prom = wp.posts()
			.perPage( 1 )
			.get()
			.then(function( posts ) {
				id = posts[ 0 ].id;
				return wp.posts()
					.id( id )
					.update({
						title: 'New Post 2501',
						content: 'Some Content'
					});
			})
			.catch(function( err ) {
				expect( err ).to.be.an.instanceOf( Error );
				expect( err ).to.have.property( 'status' );
				expect( err.status ).to.equal( 401 );
				return SUCCESS;
			});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	it( 'can create, update & delete a post when authenticated', function() {
		var id;
		var prom = authenticated.posts()
			.create({
				title: 'New Post 2501',
				content: 'Some Content'
			})
			.then(function( createdPost ) {
				id = createdPost.id;
				expect( createdPost ).to.be.an( 'object' );
				expect( createdPost ).to.have.property( 'status' );
				expect( createdPost.status ).to.equal( 'draft' );
				expect( createdPost ).to.have.property( 'title' );
				expect( createdPost.title ).to.have.property( 'raw' );
				expect( createdPost.title.raw ).to.equal( 'New Post 2501' );
				expect( createdPost ).to.have.property( 'content' );
				expect( createdPost.content ).to.have.property( 'raw' );
				expect( createdPost.content.raw ).to.equal( 'Some Content' );
				return authenticated.posts()
					.id( id )
					.update({
						title: 'Updated Title',
						status: 'publish'
					});
			})
			.then(function( updatedPost ) {
				expect( updatedPost ).to.be.an( 'object' );
				expect( updatedPost ).to.have.property( 'id' );
				expect( updatedPost.id ).to.equal( id );
				expect( updatedPost ).to.have.property( 'status' );
				expect( updatedPost.status ).to.equal( 'publish' );
				expect( updatedPost ).to.have.property( 'title' );
				expect( updatedPost.title ).to.have.property( 'raw' );
				expect( updatedPost.title.raw ).to.equal( 'Updated Title' );
				expect( updatedPost ).to.have.property( 'content' );
				expect( updatedPost.content ).to.have.property( 'raw' );
				expect( updatedPost.content.raw ).to.equal( 'Some Content' );
				// Ensure that, now that it is published, we can query for this post
				// without authentication
				return wp.posts().id( id );
			})
			.then(function( post ) {
				expect( post ).to.be.an( 'object' );
				expect( post ).to.have.property( 'id' );
				expect( post.id ).to.equal( id );
				expect( post ).to.have.property( 'title' );
				expect( post.title ).to.have.property( 'rendered' );
				expect( post.title.rendered ).to.equal( 'Updated Title' );
				// Re-authenticate & delete (trash) this post
				// Use a callback to exercise that part of the functionality
				return new Promise(function( resolve, reject ) {
					authenticated.posts().id( id ).delete(function( err, data ) {
						if ( err ) {
							return reject( err );
						}
						resolve( data );
					});
				});
			})
			.then(function( response ) {
				expect( response ).to.be.an( 'object' );
				// DELETE action returns the post object
				expect( response.id ).to.equal( id );
				// Query for the post: expect this to fail, since it is trashed and
				// the unauthenticated user does not have permissions to see it
				return wp.posts().id( id );
			})
			.catch(function( error ) {
				expect( error ).to.be.an.instanceOf( Error );
				expect( error ).to.have.property( 'status' );
				expect( error.status ).to.equal( 403 );
				// Re-authenticate & permanently delete this post
				return authenticated.posts()
					.id( id )
					.delete({
						force: true
					});
			})
			.then(function( response ) {
				expect( response ).to.be.an( 'object' );
				// DELETE action returns the post object
				expect( response.id ).to.equal( id );
				// Query for the post, with auth: expect this to fail, since it is not
				// just trashed but now deleted permanently
				return authenticated.posts().id( id );
			})
			.catch(function( error ) {
				expect( error ).to.be.an.instanceOf( Error );
				expect( error ).to.have.property( 'status' );
				expect( error.status ).to.equal( 404 );
				return SUCCESS;
			});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	it( 'can create a post with tags, categories and featured media', function() {
		var id;
		var mediaId;
		var filePath = path.join( __dirname, 'assets/emilygarfield-untitled.jpg' );
		// Helper function
		function ascById( a, b ) {
			return a.id - b.id;
		}
		var categories = [];
		var tags = [];
		var tagsAndPromises = Promise.all([
			wp.categories().get(),
			wp.tags().get()
		])
			.then(function( results ) {
				// Array to Object
				return {
					categories: results[ 0 ],
					tags: results[ 1 ]
				};
			});
		var prom = tagsAndPromises
			.then(function( results ) {
				// Pick two tags and a category to assign to our new post
				tags.push( results.tags[ 1 ], results.tags[ 4 ] );
				categories.push( results.categories[ 3 ] );
				tags.sort( ascById );
				categories.sort( ascById );

				// In this act we create the post, assigning the tags & categories
				return authenticated.posts()
					.create({
						title: 'New Post with Tags & Categories',
						content: 'This post has a featured image, too',
						status: 'publish',
						categories: categories.map(function( cat ) { return cat.id; }),
						tags: tags.map(function( tag ) { return tag.id; })
					});
			})
			.then(function( newPost ) {
				id = newPost.id;
				// Now, upload the media we want to feature and associate with the new post
				return authenticated.media()
					.file( filePath )
					.create({
						post: id
					});
			})
			.then(function( media ) {
				mediaId = media.id;
				// Assign the post the associated featured media
				return authenticated.posts()
					.id( id )
					.update({
						featured_media: mediaId
					});
			})
			.then(function() {
				// Re-fetch the post with embedded content to validate all is set correctly
				return wp.posts()
					.id( id )
					.embed()
					.get();
			})
			.then(function( post ) {
				// Assert that the post got formed correctly
				// Validate featured image
				expect( post._embedded ).to.have.property( 'wp:featuredmedia' );
				expect( post._embedded[ 'wp:featuredmedia' ].length ).to.equal( 1 );
				var media = post._embedded[ 'wp:featuredmedia' ][ 0 ];
				expect( media.id ).to.equal( mediaId );
				expect( media.slug ).to.match( /emilygarfield-untitled/ );
				expect( media.source_url ).to.match( /emilygarfield-untitled(?:-\d*)?.jpg$/ );
				// Validate tags & categories
				expect( post._embedded ).to.have.property( 'wp:term' );
				var terms = post._embedded[ 'wp:term' ];
				expect( terms.length ).to.equal( 2 );
				// Validate all categories are present and accounted for
				terms.filter(function( collection ) {
					return collection[ 0 ].taxonomy === 'category';
				})[ 0 ].sort( ascById ).forEach(function( cat, idx ) {
					expect( cat.id ).to.equal( categories[ idx ].id );
					expect( cat.name ).to.equal( categories[ idx ].name );
				});
				// Validate all tags are present and accounted for
				terms.filter(function( collection ) {
					return collection[ 0 ].taxonomy === 'post_tag';
				})[ 0 ].sort( ascById ).forEach(function( tag, idx ) {
					expect( tag.id ).to.equal( tags[ idx ].id );
					expect( tag.name ).to.equal( tags[ idx ].name );
				});
			})
			.then(function() {
				// Clean up after ourselves: remove media
				return authenticated.media()
					.id( mediaId )
					.delete({
						force: true
					});
			})
			.then(function() {
				// Query for the media, with auth: expect this to fail, since it is gone
				return authenticated.media().id( mediaId );
			})
			.catch(function( error ) {
				httpTestUtils.rethrowIfChaiError( error );
				expect( error ).to.be.an.instanceOf( Error );
				expect( error ).to.have.property( 'status' );
				expect( error.status ).to.equal( 404 );
			})
			.then(function() {
				// Clean up after ourselves: remove post
				return authenticated.posts()
					.id( id )
					.delete({
						force: true
					});
			})
			.then(function() {
				// Query for the post, with auth: expect this to fail, since it is gone
				return authenticated.posts().id( id );
			})
			.catch(function( error ) {
				httpTestUtils.rethrowIfChaiError( error );
				expect( error ).to.be.an.instanceOf( Error );
				expect( error ).to.have.property( 'status' );
				expect( error.status ).to.equal( 404 );
				return SUCCESS;
			});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	// Callback context

	it( 'can GET posts with a context-bound callback', function( done ) {
		function Ctor() {}
		Ctor.prototype.setState = function( state ) {
			this.state = state;
		};
		Ctor.prototype.request = function( cb ) {
			var self = this;
			wp.posts().get(function( err, data ) {
				expect( err ).to.be.null;

				// Context is maintained
				expect( this ).to.equal( self );
				this.setState({
					data: data
				});

				expect( this ).to.have.property( 'state' );
				expect( this.state ).to.be.an( 'object' );
				expect( this.state ).to.have.property( 'data' );
				expect( this.state.data ).to.be.an( 'array' );
				expect( this.state.data.length ).to.equal( 10 );
				cb();
			}.bind( this ) );
		};
		( new Ctor() ).request( done );
	});

});
