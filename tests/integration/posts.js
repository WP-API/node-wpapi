'use strict';

const path = require( 'path' );

const WPRequest = require( '../../lib/constructors/wp-request.js' );

// Inspecting the titles of the returned posts arrays is an easy way to
// validate that the right page of results was returned
const getTitles = require( '../helpers/get-rendered-prop' ).bind( null, 'title' );
const credentials = require( '../helpers/constants' ).credentials;

// Variable to use as our "success token" in promise assertions
const SUCCESS = 'success';

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

describe.each( [
	[ 'wpapi/superagent', require( '../../superagent' ) ],
] )( '%s: posts()', ( transportName, WPAPI ) => {
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

	it( 'can be used to retrieve a list of recent posts', () => {
		const prom = wp.posts()
			.get()
			.then( ( posts ) => {
				expect( Array.isArray( posts ) ).toBe( true );
				expect( posts.length ).toBe( 10 );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'fetches the 10 most recent posts by default', () => {
		const prom = wp.posts()
			.get()
			.then( ( posts ) => {
				expect( getTitles( posts ) ).toEqual( expectedResults.titles.page1 );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'properly parses responses returned from server as text/html', () => {
		const prom = wp.posts()
			.param( '_wpapi_force_html', true )
			.get()
			.then( ( posts ) => {
				expect( getTitles( posts ) ).toEqual( expectedResults.titles.page1 );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	describe( 'paging properties', () => {

		it( 'are exposed as _paging on the response array', () => {
			const prom = wp.posts()
				.get()
				.then( ( posts ) => {
					expect( posts ).toHaveProperty( '_paging' );
					expect( typeof posts._paging ).toBe( 'object' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'are exposed as _paging on the response array when response is text/html', () => {
			const prom = wp.posts()
				.param( '_wpapi_force_html', true )
				.get()
				.then( ( posts ) => {
					expect( posts ).toHaveProperty( '_paging' );
					expect( typeof posts._paging ).toBe( 'object' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'include the total number of posts: use .headers() for coverage reasons', () => {
			const prom = wp.posts()
				.headers()
				.then( ( postHeadersResponse ) => {
					expect( postHeadersResponse ).toHaveProperty( 'x-wp-total' );
					expect( postHeadersResponse[ 'x-wp-total' ] ).toBe( '38' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'include the total number of pages available', () => {
			const prom = wp.posts()
				.get()
				.then( ( posts ) => {
					expect( posts._paging ).toHaveProperty( 'totalPages' );
					expect( posts._paging.totalPages ).toBe( 4 );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'provides a bound WPRequest for the next page as .next', () => {
			const prom = wp.posts()
				.get()
				.then( ( posts ) => {
					expect( posts._paging ).toHaveProperty( 'next' );
					expect( typeof posts._paging.next ).toBe( 'object' );
					expect( posts._paging.next ).toBeInstanceOf( WPRequest );
					expect( posts._paging.next._options.endpoint )
						.toEqual( 'http://wpapi.local/wp-json/wp/v2/posts?page=2' );
					// Get last page & ensure "next" no longer appears
					return wp.posts()
						.page( posts._paging.totalPages )
						.get()
						.then( ( posts ) => {
							expect( posts._paging ).not.toHaveProperty( 'next' );
							expect( getTitles( posts ) ).toEqual( expectedResults.titles.page4 );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'allows access to the next page of results via .next', () => {
			const prom = wp.posts()
				.get()
				.then( posts => posts._paging.next.get() )

				.then( ( posts ) => {
					expect( Array.isArray( posts ) ).toBe( true );
					// @TODO: re-enable once PPP support is merged
					// expect( posts.length ).toBe( 10 );
					// expect( getTitles( posts ) ).toEqual( expectedResults.titles.page2 );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'allows access to the next page of results via .next when response is text/html', () => {
			const prom = wp.posts()
				.param( '_wpapi_force_html', true )
				.get()
				.then( posts => posts._paging.next.get() )
				.then( ( posts ) => {
					expect( Array.isArray( posts ) ).toBe( true );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'provides a bound WPRequest for the previous page as .prev', () => {
			const prom = wp.posts()
				.get()
				.then( ( posts ) => {
					expect( posts._paging ).not.toHaveProperty( 'prev' );
					return posts._paging.next
						.get()
						.then( ( posts ) => {
							expect( posts._paging ).toHaveProperty( 'prev' );
							expect( typeof posts._paging.prev ).toBe( 'object' );
							expect( posts._paging.prev ).toBeInstanceOf( WPRequest );
							expect( posts._paging.prev._options.endpoint )
								.toEqual( 'http://wpapi.local/wp-json/wp/v2/posts?page=1' );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'allows access to the previous page of results via .prev', () => {
			const prom = wp.posts()
				.page( 2 )
				.get()
				.then( ( posts ) => {
					// @TODO: re-enable once PPP support is merged
					// expect( getTitles( posts ) ).toEqual( expectedResults.titles.page2 );
					return posts._paging.prev
						.get()
						.then( ( posts ) => {
							expect( Array.isArray( posts ) ).toBe( true );
							expect( posts.length ).toBe( 10 );
							expect( getTitles( posts ) ).toEqual( expectedResults.titles.page1 );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'maintains authentication across paging requests', () => {
			const prom = authenticated.posts()
				.context( 'edit' )
				.get()
				.then( posts => posts._paging.next.get() )
				.then( ( page2 ) => {
					expect( page2[0].content ).toHaveProperty( 'raw' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

	} );

	describe( 'filter methods', () => {

		describe( 'slug', () => {

			it( 'can be used to return only posts with the specified slug', () => {
				const prom = wp.posts()
					.slug( 'template-excerpt-generated' )
					.get()
					.then( ( posts ) => {
						expect( posts.length ).toBe( 1 );
						expect( getTitles( posts ) ).toEqual( [
							'Template: Excerpt (Generated)',
						] );
						return SUCCESS;
					} );
				return expect( prom ).resolves.toBe( SUCCESS );
			} );

		} );

		describe( 'status', () => {

			it( 'can be used to retrieve specific statuses of posts', () => {
				const prom = authenticated.posts()
					.status( [ 'future', 'draft' ] )
					.get()
					.then( ( posts ) => {
						expect( getTitles( posts ) ).toEqual( [
							'Scheduled',
							'Draft',
						] );
						return SUCCESS;
					} );
				return expect( prom ).resolves.toBe( SUCCESS );
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
						expect( posts.length ).toBe( 5 );
						expect( getTitles( posts ) ).toEqual( [
							'Markup: Title With Special Characters',
							'Markup: Title With Markup',
							'Antidisestablishmentarianism',
							'',
							'Edge Case: Many Tags',
						] );
						return SUCCESS;
					} );
				return expect( prom ).resolves.toBe( SUCCESS );
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
						expect( posts.length ).toBe( 6 );
						expect( getTitles( posts ) ).toEqual( [
							'Template: Featured Image (Vertical)',
							'Template: Featured Image (Horizontal)',
							'Media: Twitter Embeds',
							'Post Format: Video (WordPress.tv)',
							'Post Format: Video (VideoPress)',
							'Edge Case: Many Tags',
						] );
						return SUCCESS;
					} );
				return expect( prom ).resolves.toBe( SUCCESS );
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
						expect( getTitles( posts ) ).toEqual( [
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
				return expect( prom ).resolves.toBe( SUCCESS );
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
						expect( posts.length ).toBe( 6 );
						expect( getTitles( posts ) ).toEqual( [
							'Markup: HTML Tags and Formatting',
							'Markup: Image Alignment',
							'Markup: Text Alignment',
							'Markup: Title With Special Characters',
							'Markup: Title With Markup',
							'Edge Case: Many Categories',
						] );
						return SUCCESS;
					} );
				return expect( prom ).resolves.toBe( SUCCESS );
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
						expect( posts.length ).toBe( 6 );
						expect( getTitles( posts ) ).toEqual( [
							'Antidisestablishmentarianism',
							'',
							'Edge Case: No Content',
							'Edge Case: Many Categories',
							'Edge Case: Many Tags',
							'Edge Case: Nested And Mixed Lists',
						] );
						return SUCCESS;
					} );
				return expect( prom ).resolves.toBe( SUCCESS );
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
						expect( getTitles( posts ) ).toEqual( [
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
				return expect( prom ).resolves.toBe( SUCCESS );
			} );

		} );

		describe( 'before', () => {

			it( 'can be used to return only posts from before a certain date', () => {
				const prom = wp.posts()
					.before( '2013-01-08' )
					.then( ( posts ) => {
						expect( posts[0].title.rendered ).toBe( 'Markup: Title With Special Characters' );
						return SUCCESS;
					} );
				return expect( prom ).resolves.toBe( SUCCESS );
			} );

		} );

		describe( 'after', () => {

			it( 'can be used to return only posts from after a certain date', () => {
				const prom = wp.posts()
					.after( '2013-01-08' )
					.then( ( posts ) => {
						expect( posts.length ).toBe( 3 );
						expect( getTitles( posts ) ).toEqual( expectedResults.titles.page1.slice( 0, 3 ) );
						return SUCCESS;
					} );
				return expect( prom ).resolves.toBe( SUCCESS );
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
					expect( err.code ).toBe( 'rest_forbidden_context' );
					expect( err.data ).toEqual( {
						status: 401,
					} );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
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
					expect( err.code ).toBe( 'rest_cannot_delete' );
					expect( err.data ).toEqual( {
						status: 401,
					} );
					// Ensure that the post was NOT deleted by querying for it again
					return wp.posts()
						.id( id )
						.get();
				} )
				.then( ( result ) => {
					expect( result ).toHaveProperty( 'id' );
					expect( result.id ).toBe( id );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'cannot create (POST) without authentication', () => {
			const prom = wp.posts()
				.create( {
					title: 'New Post 2501',
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
					expect( err.code ).toBe( 'rest_cannot_edit' );
					expect( err.data ).toEqual( {
						status: 401,
					} );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
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
				expect( typeof createdPost ).toBe( 'object' );
				expect( createdPost ).toHaveProperty( 'status' );
				expect( createdPost.status ).toBe( 'draft' );
				expect( createdPost ).toHaveProperty( 'title' );
				expect( createdPost.title ).toHaveProperty( 'raw' );
				expect( createdPost.title.raw ).toBe( 'New Post 2501' );
				expect( createdPost ).toHaveProperty( 'content' );
				expect( createdPost.content ).toHaveProperty( 'raw' );
				expect( createdPost.content.raw ).toBe( 'Some Content' );
				return authenticated.posts()
					.id( id )
					.update( {
						title: 'Updated Title',
						status: 'publish',
					} );
			} )
			.then( ( updatedPost ) => {
				expect( typeof updatedPost ).toBe( 'object' );
				expect( updatedPost ).toHaveProperty( 'id' );
				expect( updatedPost.id ).toBe( id );
				expect( updatedPost ).toHaveProperty( 'status' );
				expect( updatedPost.status ).toBe( 'publish' );
				expect( updatedPost ).toHaveProperty( 'title' );
				expect( updatedPost.title ).toHaveProperty( 'raw' );
				expect( updatedPost.title.raw ).toBe( 'Updated Title' );
				expect( updatedPost ).toHaveProperty( 'content' );
				expect( updatedPost.content ).toHaveProperty( 'raw' );
				expect( updatedPost.content.raw ).toBe( 'Some Content' );
				// Ensure that, now that it is published, we can query for this post
				// without authentication
				return wp.posts().id( id );
			} )
			.then( ( post ) => {
				expect( typeof post ).toBe( 'object' );
				expect( post ).toHaveProperty( 'id' );
				expect( post.id ).toBe( id );
				expect( post ).toHaveProperty( 'title' );
				expect( post.title ).toHaveProperty( 'rendered' );
				expect( post.title.rendered ).toBe( 'Updated Title' );
				// Re-authenticate & delete (trash) this post
				return authenticated.posts().id( id ).delete();
			} )
			.then( ( response ) => {
				expect( typeof response ).toBe( 'object' );
				// DELETE action returns the post object
				expect( response.id ).toBe( id );
				// Query for the post: expect this to fail, since it is trashed and
				// the unauthenticated user does not have permissions to see it
				return wp.posts().id( id );
			} )
			.catch( ( error ) => {
				expect( error.code ).toBe( 'rest_forbidden' );
				expect( error.data ).toEqual( {
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
				expect( typeof response ).toBe( 'object' );
				// DELETE action returns the fully-deleted post object as .previous
				expect( typeof response.previous ).toBe( 'object' );
				expect( response.previous.id ).toBe( id );
				// Query for the post, with auth: expect this to fail, since it is not
				// just trashed but now deleted permanently
				return authenticated.posts().id( id );
			} )
			.catch( ( error ) => {
				expect( error.code ).toBe( 'rest_post_invalid_id' );
				expect( error.data ).toEqual( {
					status: 404,
				} );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	}, 10000 );

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
				expect( post._embedded ).toHaveProperty( 'wp:featuredmedia' );
				expect( post._embedded[ 'wp:featuredmedia' ].length ).toBe( 1 );
				const media = post._embedded[ 'wp:featuredmedia' ][ 0 ];
				expect( media.id ).toBe( mediaId );
				expect( media.slug ).toMatch( /emilygarfield-untitled/ );
				expect( media.source_url ).toMatch( /emilygarfield-untitled(?:-\d*)?.jpg$/ );
				// Validate tags & categories
				expect( post._embedded ).toHaveProperty( 'wp:term' );
				const terms = post._embedded[ 'wp:term' ];
				expect( terms.length ).toBe( 2 );
				// Validate all categories are present and accounted for
				terms
					.find( collection => collection[ 0 ].taxonomy === 'category' )
					.sort( ascById )
					.forEach( ( cat, idx ) => {
						expect( cat.id ).toBe( categories[ idx ].id );
						expect( cat.name ).toBe( categories[ idx ].name );
					} );
				// Validate all tags are present and accounted for
				terms
					.find( collection => collection[ 0 ].taxonomy === 'post_tag' )
					.sort( ascById )
					.forEach( ( tag, idx ) => {
						expect( tag.id ).toBe( tags[ idx ].id );
						expect( tag.name ).toBe( tags[ idx ].name );
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
				expect( error.code ).toBe( 'rest_post_invalid_id' );
				expect( error.data ).toEqual( {
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
				expect( error.code ).toBe( 'rest_post_invalid_id' );
				expect( error.data ).toEqual( {
					status: 404,
				} );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	}, 10000 );

} );
