const assert = require( 'assert' );
const WP = require( '../' );

describe( 'API URL generation:', function() {

	describe( 'posts', function() {
		var posts = WP().posts();

		it( 'should have the correct URL for retrieving all posts', function() {
			assert.strictEqual( posts.generateRequestUri(), '/wp-json/posts' );
		} );

		it( 'should have the correct URL for retrieving a specific post', function() {
			assert.strictEqual( posts.id( 1337 ).generateRequestUri(), '/wp-json/posts/1337' );
		} );
		
		it( 'should have the correct URL for retrieving all comments for a specific post', function() {
			assert.strictEqual( posts.id( 1337 ).comments().generateRequestUri(), '/wp-json/posts/1337/comments' );
		} );

		it( 'should have the correct URL for retrieving a specific comment for a specific post', function() {
			assert.strictEqual( posts.id( 1337 ).comments().id( 9001 ).generateRequestUri(), '/wp-json/posts/1337/comments/9001' );
		} );
	} );

	describe( 'taxonomies', function() {
		var taxonomies = WP().taxonomies();

		it( 'should have the correct URL for retrieving all taxonomies', function() {
			assert.strictEqual( taxonomies.generateRequestUri(), '/wp-json/taxonomies' );
		} );

		it( 'should have the correct URL for retrieving a specific taxonomy', function() {
			assert.strictEqual( taxonomies.id( 'my-tax' ).generateRequestUri(), '/wp-json/taxonomies/my-tax' );
		} );

		it( 'should have the correct URL for retrieving all terms for a specific taxonomy', function() {
			assert.strictEqual( taxonomies.id( 'my-tax' ).terms().generateRequestUri(), '/wp-json/taxonomies/my-tax/terms' );
		} );

		it( 'should have the correct URL for retrieving a specific term for a specific taxonomy', function() {
			assert.strictEqual( taxonomies.id( 'my-tax' ).terms().id( 1337 ).generateRequestUri(), '/wp-json/taxonomies/my-tax/terms/1337' );
		} );
	} );

	describe( 'users', function() {
		var users = WP().users();

		it( 'should have the correct URL for retrieving all users', function() {
			assert.strictEqual( users.generateRequestUri(), '/wp-json/users' );
		} );

		it( 'should have the correct URL for retrieving the current user', function() {
			assert.strictEqual( users.me().generateRequestUri(), '/wp-json/users/me' );
		} );

		it( 'should have the correct URL for retrieving a specific user by ID', function() {
			assert.strictEqual( users.id( 1337 ).generateRequestUri(), '/wp-json/users/1337' );
		} );
	} );

} );