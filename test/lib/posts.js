const expect = require( 'chai' ).expect;

const PostsQuery = require( '../../lib/posts' );

describe( 'wp.posts', function() {

	var posts;

	beforeEach(function() {
		posts = new PostsQuery();
		posts._options = {
			endpoint: '/wp-json'
		};
	});

	it( 'should create the URL for retrieving all posts', function() {
		expect( posts.generateRequestUri() ).to.equal( '/wp-json/posts' );
	});

	it( 'should create the URL for retrieving a specific post', function() {
		expect( posts.id( 1337 ).generateRequestUri() ).to.equal( '/wp-json/posts/1337' );
	});

	it( 'should create the URL for retrieving all comments for a specific post', function() {
		expect( posts.id( 1337 ).comments().generateRequestUri() ).to.equal(
			'/wp-json/posts/1337/comments' );
	});

	it( 'should create the URL for retrieving a specific comment', function() {
		expect( posts.id( 1337 ).comments().id( 9001 ).generateRequestUri() ).to.equal(
			'/wp-json/posts/1337/comments/9001' );
	});

});
