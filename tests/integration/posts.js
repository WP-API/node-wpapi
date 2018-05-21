'use strict';
const path = require( 'path' );
const chai = require( 'chai' );
// Variable to use as our "success token" in promise assertions
const SUCCESS = 'success';
// Chai-as-promised and the `expect( prom ).to.eventually.equal( SUCCESS ) is
// used to ensure that the assertions running within the promise chains are
// actually run.
chai.use( require( 'chai-as-promised' ) );
const expect = chai.expect;
const httpTestUtils = require( './helpers/http-test-utils' );

const WPAPI = require( '../../' );
const WPRequest = require( '../../lib/constructors/wp-request.js' );

// Inspecting the titles of the returned posts arrays is an easy way to
// validate that the right page of results was returned
const getTitles = require( './helpers/get-rendered-prop' ).bind( null, 'title' );
const credentials = require( './helpers/constants' ).credentials;

// Define some arrays to use ensuring the returned data is what we expect
// it to be (e.g. an array of the titles from posts on the first page)
const expectedResults = {
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
			'Template: Excerpt (Generated)',
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
			'Post Format: Gallery (Tiled)',
		],
		page4: [
			'Post Format: Quote',
			'Post Format: Chat',
			'Antidisestablishmentarianism',
			'',
			'Edge Case: No Content',
			'Edge Case: Many Categories',
			'Edge Case: Many Tags',
			'Edge Case: Nested And Mixed Lists',
		],
	},
};

describe( 'integration: posts()', () => {
	let wp;
	let authenticated;

	beforeEach( () => {
		wp = new WPAPI( {
			endpoint: 'http://wpapi.loc/wp-json',
		} );
		authenticated = new WPAPI( {
			endpoint: 'http://wpapi.loc/wp-json',
		} ).auth( credentials );
	} );

	it( 'can be used to retrieve a list of recent posts', () => {
		const prom = wp.posts()
			.get()
			.then( ( posts ) => {
				expect( posts ).to.be.an( 'array' );
				expect( posts.length ).to.equal( 10 );
				return SUCCESS;
			} );
		return expect( prom ).to.eventually.equal( SUCCESS );
	} );

	it( 'fetches the 10 most recent posts by default', () => {
		const prom = wp.posts()
			.get()
			.then( ( posts ) => {
				expect( getTitles( posts ) ).to.deep.equal( expectedResults.titles.page1 );
				return SUCCESS;
			} );
		return expect( prom ).to.eventually.equal( SUCCESS );
	} );

	it( 'properly parses responses returned from server as text/html', () => {
		const prom = wp.posts()
			.param( '_wpapi_force_html', true )
			.get()
			.then( ( posts ) => {
				expect( getTitles( posts ) ).to.deep.equal( expectedResults.titles.page1 );
				return SUCCESS;
			} );
		return expect( prom ).to.eventually.equal( SUCCESS );
	} );

	describe( 'paging properties', () => {

		it( 'are exposed as _paging on the response array', () => {
			const prom = wp.posts()
				.get()
				.then( ( posts ) => {
					expect( posts ).to.have.property( '_paging' );
					expect( posts._paging ).to.be.an( 'object' );
					return SUCCESS;
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'are exposed as _paging on the response array when response is text/html', () => {
			const prom = wp.posts()
				.param( '_wpapi_force_html', true )
				.get()
				.then( ( posts ) => {
					expect( posts ).to.have.property( '_paging' );
					expect( posts._paging ).to.be.an( 'object' );
					return SUCCESS;
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'include the total number of posts: use .headers() for coverage reasons', () => {
			const prom = wp.posts()
				.headers()
				.then( ( postHeadersResponse ) => {
					expect( postHeadersResponse ).to.have.property( 'x-wp-total' );
					expect( postHeadersResponse[ 'x-wp-total' ] ).to.equal( '38' );
					return SUCCESS;
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'include the total number of pages available', () => {
			const prom = wp.posts()
				.get()
				.then( ( posts ) => {
					expect( posts._paging ).to.have.property( 'totalPages' );
					expect( posts._paging.totalPages ).to.equal( '4' );
					return SUCCESS;
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'provides a bound WPRequest for the next page as .next', () => {
			const prom = wp.posts()
				.get()
				.then( ( posts ) => {
					expect( posts._paging ).to.have.property( 'next' );
					expect( posts._paging.next ).to.be.an( 'object' );
					expect( posts._paging.next ).to.be.an.instanceOf( WPRequest );
					expect( posts._paging.next._options.endpoint ).to
						.equal( 'http://wpapi.loc/wp-json/wp/v2/posts?page=2' );
					// Get last page & ensure "next" no longer appears
					return wp.posts()
						.page( posts._paging.totalPages )
						.get()
						.then( ( posts ) => {
							expect( posts._paging ).not.to.have.property( 'next' );
							expect( getTitles( posts ) ).to.deep.equal( expectedResults.titles.page4 );
							return SUCCESS;
						} );
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'allows access to the next page of results via .next', () => {
			const prom = wp.posts()
				.get()
				.then( posts => posts._paging.next.get() )

				.then( ( posts ) => {
					expect( posts ).to.be.an( 'array' );
					// @TODO: re-enable once PPP support is merged
					// expect( posts.length ).to.equal( 10 );
					// expect( getTitles( posts ) ).to.deep.equal( expectedResults.titles.page2 );
					return SUCCESS;
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'allows access to the next page of results via .next when response is text/html', () => {
			const prom = wp.posts()
				.param( '_wpapi_force_html', true )
				.get()
				.then( posts => posts._paging.next.get() )
				.then( ( posts ) => {
					expect( posts ).to.be.an( 'array' );
					return SUCCESS;
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'provides a bound WPRequest for the previous page as .prev', () => {
			const prom = wp.posts()
				.get()
				.then( ( posts ) => {
					expect( posts._paging ).not.to.have.property( 'prev' );
					return posts._paging.next
						.get()
						.then( ( posts ) => {
							expect( posts._paging ).to.have.property( 'prev' );
							expect( posts._paging.prev ).to.be.an( 'object' );
							expect( posts._paging.prev ).to.be.an.instanceOf( WPRequest );
							expect( posts._paging.prev._options.endpoint ).to
								.equal( 'http://wpapi.loc/wp-json/wp/v2/posts?page=1' );
							return SUCCESS;
						} );
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'allows access to the previous page of results via .prev', () => {
			const prom = wp.posts()
				.page( 2 )
				.get()
				.then( ( posts ) => {
					// @TODO: re-enable once PPP support is merged
					// expect( getTitles( posts ) ).to.deep.equal( expectedResults.titles.page2 );
					return posts._paging.prev
						.get()
						.then( ( posts ) => {
							expect( posts ).to.be.an( 'array' );
							expect( posts.length ).to.equal( 10 );
							expect( getTitles( posts ) ).to.deep.equal( expectedResults.titles.page1 );
							return SUCCESS;
						} );
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'maintains authentication across paging requests', () => {
			const prom = authenticated.posts()
				.context( 'edit' )
				.get()
				.then( posts => posts._paging.next.get() )
				.then( ( page2 ) => {
					expect( page2[0].content ).to.have.property( 'raw' );
					return SUCCESS;
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

	} );

	describe( 'filter methods', () => {

		describe( 'slug', () => {

			it( 'can be used to return only posts with the specified slug', () => {
				const prom = wp.posts()
					.slug( 'template-excerpt-generated' )
					.get()
					.then( ( posts ) => {
						expect( posts.length ).to.equal( 1 );
						expect( getTitles( posts ) ).to.deep.equal( [
							'Template: Excerpt (Generated)',
						] );
						return SUCCESS;
					} );
				return expect( prom ).to.eventually.equal( SUCCESS );
			} );

		} );

		describe( 'status', () => {

			it( 'can be used to retrieve specific statuses of posts', () => {
				const prom = authenticated.posts()
					.status( [ 'future', 'draft' ] )
					.get()
					.then( ( posts ) => {
						expect( getTitles( posts ) ).to.deep.equal( [
							'Scheduled',
							'Draft',
						] );
						return SUCCESS;
					} );
				return expect( prom ).to.eventually.equal( SUCCESS );
			} );

		} );

		describe( 'tags', () => {

			it( 'can be used to return only posts with a provided tag', () => {
				const prom = wp.tags()
					.slug( 'title' )
					.get()
					.then( ( tags ) => {
						const tagIDs = tags.map( tag => tag.id );
						return wp.posts().tags( tagIDs );
					} )
					.then( ( posts ) => {
						expect( posts.length ).to.equal( 5 );
						expect( getTitles( posts ) ).to.deep.equal( [
							'Markup: Title With Special Characters',
							'Markup: Title With Markup',
							'Antidisestablishmentarianism',
							'',
							'Edge Case: Many Tags',
						] );
						return SUCCESS;
					} );
				return expect( prom ).to.eventually.equal( SUCCESS );
			} );

			it( 'can be used to return posts with any of the provided tags', () => {
				const prom = Promise
					.all( [
						wp.tags().search( 'featured image' ),
						wp.tags().search( 'embeds' ),
					] )
					.then( ( results ) => {
						const tagIDs = results.reduce( ( ids, arr ) => (
							ids.concat( arr.map( tag => tag.id ) )
						), [] );
						return wp.posts().tags( tagIDs );
					} )
					.then( ( posts ) => {
						expect( posts.length ).to.equal( 6 );
						expect( getTitles( posts ) ).to.deep.equal( [
							'Template: Featured Image (Vertical)',
							'Template: Featured Image (Horizontal)',
							'Media: Twitter Embeds',
							'Post Format: Video (WordPress.tv)',
							'Post Format: Video (VideoPress)',
							'Edge Case: Many Tags',
						] );
						return SUCCESS;
					} );
				return expect( prom ).to.eventually.equal( SUCCESS );
			} );

		} );

		describe( 'excludeTags', () => {

			it( 'can be used to omit posts in specific tags', () => {
				const prom = Promise
					.all( [
						wp.tags().search( 'css' ),
						wp.tags().search( 'content' ),
					] )
					.then( ( results ) => {
						const tagIDs = results.reduce( ( ids, arr ) => (
							ids.concat( arr.map( tag => tag.id ) )
						), [] );
						return wp.posts().excludeTags( tagIDs );
					} )
					.then( ( posts ) => {
						expect( getTitles( posts ) ).to.deep.equal( [
							'Markup: Title With Special Characters',
							'Template: Featured Image (Vertical)',
							'Template: Featured Image (Horizontal)',
							'Template: Sticky',
							'Template: Password Protected (the password is &#8220;enter&#8221;)',
							'Template: Comments',
							'Template: Comments Disabled',
							'Template: Pingbacks And Trackbacks',
							'Post Format: Standard',
							'Post Format: Gallery',
						] );
						return SUCCESS;
					} );
				return expect( prom ).to.eventually.equal( SUCCESS );
			} );

		} );

		describe( 'categories', () => {

			it( 'can be used to return only posts with a provided category', () => {
				const prom = wp.categories()
					.slug( 'markup' )
					.get()
					.then( ( categories ) => {
						const categoryIDs = categories.map( cat => cat.id );
						return wp.posts().categories( categoryIDs );
					} )
					.then( ( posts ) => {
						expect( posts.length ).to.equal( 6 );
						expect( getTitles( posts ) ).to.deep.equal( [
							'Markup: HTML Tags and Formatting',
							'Markup: Image Alignment',
							'Markup: Text Alignment',
							'Markup: Title With Special Characters',
							'Markup: Title With Markup',
							'Edge Case: Many Categories',
						] );
						return SUCCESS;
					} );
				return expect( prom ).to.eventually.equal( SUCCESS );
			} );

			it( 'can be used to return posts with any of the provided categories', () => {
				const prom = Promise
					.all( [
						wp.categories().search( 'edge case' ),
						wp.categories().search( 'pustule' ),
					] )
					.then( ( results ) => {
						const categoriesIDs = results.reduce( ( ids, arr ) => (
							ids.concat( arr.map( cat => cat.id ) )
						), [] );
						return wp.posts().categories( categoriesIDs );
					} )
					.then( ( posts ) => {
						expect( posts.length ).to.equal( 6 );
						expect( getTitles( posts ) ).to.deep.equal( [
							'Antidisestablishmentarianism',
							'',
							'Edge Case: No Content',
							'Edge Case: Many Categories',
							'Edge Case: Many Tags',
							'Edge Case: Nested And Mixed Lists',
						] );
						return SUCCESS;
					} );
				return expect( prom ).to.eventually.equal( SUCCESS );
			} );

		} );

		describe( 'excludeCategories', () => {

			it( 'can be used to omit posts in specific categories', () => {
				const prom = Promise
					.all( [
						wp.categories().slug( 'markup' ),
						wp.categories().slug( 'post-formats' ),
					] )
					.then( ( results ) => {
						const tagIDs = results.reduce( ( ids, arr ) => (
							ids.concat( arr.map( tag => tag.id ) )
						), [] );
						return wp.posts().excludeCategories( tagIDs );
					} )
					.then( ( posts ) => {
						expect( getTitles( posts ) ).to.deep.equal( [
							'Template: Featured Image (Vertical)',
							'Template: Featured Image (Horizontal)',
							'Template: More Tag',
							'Template: Excerpt (Defined)',
							'Template: Excerpt (Generated)',
							'Template: Paginated',
							'Template: Sticky',
							'Template: Password Protected (the password is &#8220;enter&#8221;)',
							'Template: Comments',
							'Template: Comments Disabled',
						] );
						return SUCCESS;
					} );
				return expect( prom ).to.eventually.equal( SUCCESS );
			} );

		} );

		describe( 'before', () => {

			it( 'can be used to return only posts from before a certain date', () => {
				const prom = wp.posts()
					.before( '2013-01-08' )
					.then( ( posts ) => {
						expect( posts[0].title.rendered ).to.equal( 'Markup: Title With Special Characters' );
						return SUCCESS;
					} );
				return expect( prom ).to.eventually.equal( SUCCESS );
			} );

		} );

		describe( 'after', () => {

			it( 'can be used to return only posts from after a certain date', () => {
				const prom = wp.posts()
					.after( '2013-01-08' )
					.then( ( posts ) => {
						expect( posts.length ).to.equal( 3 );
						expect( getTitles( posts ) ).to.deep.equal( expectedResults.titles.page1.slice( 0, 3 ) );
						return SUCCESS;
					} );
				return expect( prom ).to.eventually.equal( SUCCESS );
			} );

		} );

	} );

	// Post creation, update & deletion suites
	describe( 'authorization errors', () => {

		it( 'cannot use context=edit without authentication', () => {
			const prom = wp.posts()
				.edit()
				.get()
				.catch( ( err ) => {
					expect( err.code ).to.equal( 'rest_forbidden_context' );
					expect( err.data ).to.deep.equal( {
						status: 401,
					} );
					return SUCCESS;
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'cannot DELETE without authentication', () => {
			let id;
			const prom = wp.posts()
				.perPage( 1 )
				.get()
				.then( ( posts ) => {
					id = posts[ 0 ].id;
					return wp.posts()
						.id( id )
						.delete();
				} )
				.catch( ( err ) => {
					expect( err.code ).to.equal( 'rest_cannot_delete' );
					expect( err.data ).to.deep.equal( {
						status: 401,
					} );
					// Ensure that the post was NOT deleted by querying for it again
					return wp.posts()
						.id( id )
						.get();
				} )
				.then( ( result ) => {
					expect( result ).to.have.property( 'id' );
					expect( result.id ).to.equal( id );
					return SUCCESS;
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'cannot create (POST) without authentication (also tests callback-mode errors)', () => {
			const prom = new Promise( ( resolve, reject ) => {
				wp.posts().create( {
					title: 'New Post 2501',
					content: 'Some Content',
				}, ( err ) => {
					if ( ! err ) {
						reject();
					}
					expect( err.code ).to.equal( 'rest_cannot_create' );
					expect( err.data ).to.deep.equal( {
						status: 401,
					} );
					resolve( SUCCESS );
				} );
			} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'cannot update (PUT) without authentication', () => {
			let id;
			const prom = wp.posts()
				.perPage( 1 )
				.get()
				.then( ( posts ) => {
					id = posts[ 0 ].id;
					return wp.posts()
						.id( id )
						.update( {
							title: 'New Post 2501',
							content: 'Some Content',
						} );
				} )
				.catch( ( err ) => {
					expect( err.code ).to.equal( 'rest_cannot_edit' );
					expect( err.data ).to.deep.equal( {
						status: 401,
					} );
					return SUCCESS;
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );
	} );

	it( 'can create, update & delete a post when authenticated', () => {
		let id;
		const prom = authenticated.posts()
			.create( {
				title: 'New Post 2501',
				content: 'Some Content',
			} )
			.then( ( createdPost ) => {
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
					.update( {
						title: 'Updated Title',
						status: 'publish',
					} );
			} )
			.then( ( updatedPost ) => {
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
			} )
			.then( ( post ) => {
				expect( post ).to.be.an( 'object' );
				expect( post ).to.have.property( 'id' );
				expect( post.id ).to.equal( id );
				expect( post ).to.have.property( 'title' );
				expect( post.title ).to.have.property( 'rendered' );
				expect( post.title.rendered ).to.equal( 'Updated Title' );
				// Re-authenticate & delete (trash) this post
				// Use a callback to exercise that part of the functionality
				return new Promise( ( resolve, reject ) => {
					authenticated.posts().id( id ).delete( ( err, data ) => {
						if ( err ) {
							return reject( err );
						}
						resolve( data );
					} );
				} );
			} )
			.then( ( response ) => {
				expect( response ).to.be.an( 'object' );
				// DELETE action returns the post object
				expect( response.id ).to.equal( id );
				// Query for the post: expect this to fail, since it is trashed and
				// the unauthenticated user does not have permissions to see it
				return wp.posts().id( id );
			} )
			.catch( ( error ) => {
				httpTestUtils.rethrowIfChaiError( error );
				expect( error.code ).to.equal( 'rest_forbidden' );
				expect( error.data ).to.deep.equal( {
					status: 401,
				} );
				// Re-authenticate & permanently delete this post
				return authenticated.posts()
					.id( id )
					.delete( {
						force: true,
					} );
			} )
			.then( ( response ) => {
				expect( response ).to.be.an( 'object' );
				// DELETE action returns the fully-deleted post object as .previous
				expect( response.previous ).to.be.an( 'object' );
				expect( response.previous.id ).to.equal( id );
				// Query for the post, with auth: expect this to fail, since it is not
				// just trashed but now deleted permanently
				return authenticated.posts().id( id );
			} )
			.catch( ( error ) => {
				httpTestUtils.rethrowIfChaiError( error );
				expect( error.code ).to.equal( 'rest_post_invalid_id' );
				expect( error.data ).to.deep.equal( {
					status: 404,
				} );
				return SUCCESS;
			} );
		return expect( prom ).to.eventually.equal( SUCCESS );
	} ).timeout( 10000 );

	it( 'can create a post with tags, categories and featured media', () => {
		let id;
		let mediaId;
		const filePath = path.join( __dirname, 'assets/emilygarfield-untitled.jpg' );
		// Helper function
		const ascById = ( a, b ) => a.id - b.id;

		const categories = [];
		const tags = [];
		const tagsAndPromises = Promise.all( [
			wp.categories().get(),
			wp.tags().get(),
		] )
			.then( ( results ) => {
				// Array to Object
				return {
					categories: results[ 0 ],
					tags: results[ 1 ],
				};
			} );
		const prom = tagsAndPromises
			.then( ( results ) => {
				// Pick two tags and a category to assign to our new post
				tags.push( results.tags[ 1 ], results.tags[ 4 ] );
				categories.push( results.categories[ 3 ] );
				tags.sort( ascById );
				categories.sort( ascById );

				// In this act we create the post, assigning the tags & categories
				return authenticated.posts()
					.create( {
						title: 'New Post with Tags & Categories',
						content: 'This post has a featured image, too',
						status: 'publish',
						categories: categories.map( cat => cat.id ),
						tags: tags.map( tag => tag.id ),
					} );
			} )
			.then( ( newPost ) => {
				id = newPost.id;
				// Now, upload the media we want to feature and associate with the new post
				return authenticated.media()
					.file( filePath )
					.create( {
						post: id,
					} );
			} )
			.then( ( media ) => {
				mediaId = media.id;
				// Assign the post the associated featured media
				return authenticated.posts()
					.id( id )
					.update( {
						featured_media: mediaId,
					} );
			} )
			.then( () => {
				// Re-fetch the post with embedded content to validate all is set correctly
				return wp.posts()
					.id( id )
					.embed()
					.get();
			} )
			.then( ( post ) => {
				// Assert that the post got formed correctly
				// Validate featured image
				expect( post._embedded ).to.have.property( 'wp:featuredmedia' );
				expect( post._embedded[ 'wp:featuredmedia' ].length ).to.equal( 1 );
				const media = post._embedded[ 'wp:featuredmedia' ][ 0 ];
				expect( media.id ).to.equal( mediaId );
				expect( media.slug ).to.match( /emilygarfield-untitled/ );
				expect( media.source_url ).to.match( /emilygarfield-untitled(?:-\d*)?.jpg$/ );
				// Validate tags & categories
				expect( post._embedded ).to.have.property( 'wp:term' );
				const terms = post._embedded[ 'wp:term' ];
				expect( terms.length ).to.equal( 2 );
				// Validate all categories are present and accounted for
				terms
					.find( collection => collection[ 0 ].taxonomy === 'category' )
					.sort( ascById )
					.forEach( ( cat, idx ) => {
						expect( cat.id ).to.equal( categories[ idx ].id );
						expect( cat.name ).to.equal( categories[ idx ].name );
					} );
				// Validate all tags are present and accounted for
				terms
					.find( collection => collection[ 0 ].taxonomy === 'post_tag' )
					.sort( ascById )
					.forEach( ( tag, idx ) => {
						expect( tag.id ).to.equal( tags[ idx ].id );
						expect( tag.name ).to.equal( tags[ idx ].name );
					} );
			} )
			.then( () => {
				// Clean up after ourselves: remove media
				return authenticated.media()
					.id( mediaId )
					.delete( {
						force: true,
					} );
			} )
			// Query for the media, with auth: expect this to fail, since it is gone
			.then( () => authenticated.media().id( mediaId ) )
			.catch( ( error ) => {
				httpTestUtils.rethrowIfChaiError( error );
				expect( error.code ).to.equal( 'rest_post_invalid_id' );
				expect( error.data ).to.deep.equal( {
					status: 404,
				} );
			} )
			// Clean up after ourselves: remove post
			.then( () => authenticated.posts()
				.id( id )
				.delete( {
					force: true,
				} )
			)
			// Query for the post, with auth: expect this to fail, since it is gone
			.then( () => authenticated.posts().id( id ) )
			.catch( ( error ) => {
				httpTestUtils.rethrowIfChaiError( error );
				expect( error.code ).to.equal( 'rest_post_invalid_id' );
				expect( error.data ).to.deep.equal( {
					status: 404,
				} );
				return SUCCESS;
			} );
		return expect( prom ).to.eventually.equal( SUCCESS );
	} ).timeout( 10000 );

	// Callback context

	it( 'can GET posts with a context-bound callback', ( done ) => {
		class Ctor {
			setState( state ) {
				this.state = state;
			}

			request( cb ) {
				const self = this;
				wp.posts().get( function( err, data ) {
					expect( err ).to.be.null;

					// Context is maintained
					expect( this ).to.equal( self );
					this.setState( {
						data: data,
					} );

					expect( this ).to.have.property( 'state' );
					expect( this.state ).to.be.an( 'object' );
					expect( this.state ).to.have.property( 'data' );
					expect( this.state.data ).to.be.an( 'array' );
					expect( this.state.data.length ).to.equal( 10 );
					cb();
				}.bind( this ) );
			}
		}
		( new Ctor() ).request( done );
	} );

} );
