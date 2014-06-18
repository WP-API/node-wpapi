const assert = require( 'assert' );
const WP = require( '../' );

describe( 'API URL generation:', function() {

	describe( 'posts', function() {
		var posts = WP().posts();

		it( 'should create the URL for retrieving all posts', function() {
			assert.strictEqual( posts.generateRequestUri(), '/wp-json/posts' );
		} );

		it( 'should create the URL for retrieving a specific post', function() {
			assert.strictEqual( posts.id( 1337 ).generateRequestUri(), '/wp-json/posts/1337' );
		} );

		it( 'should create the URL for retrieving all comments for a specific post', function() {
			assert.strictEqual( posts.id( 1337 ).comments().generateRequestUri(),
				'/wp-json/posts/1337/comments' );
		} );

		it( 'should create the URL for retrieving a specific comment', function() {
			assert.strictEqual( posts.id( 1337 ).comments().id( 9001 ).generateRequestUri(),
				'/wp-json/posts/1337/comments/9001' );
		} );
	} );

	describe( 'taxonomies', function() {
		var taxonomies = WP().taxonomies();

		it( 'should create the URL for retrieving all taxonomies', function() {
			var url = taxonomies.generateRequestUri();
			assert.strictEqual( url, '/wp-json/taxonomies' );
		} );

		it( 'should create the URL for retrieving a specific taxonomy', function() {
			var url = taxonomies.id( 'my-tax' ).generateRequestUri();
			assert.strictEqual( url, '/wp-json/taxonomies/my-tax' );
		} );

		it( 'should create the URL for retrieving all terms for a specific taxonomy', function() {
			var url = taxonomies.id( 'my-tax' ).terms().generateRequestUri();
			assert.strictEqual( url, '/wp-json/taxonomies/my-tax/terms' );
		} );

		it( 'should create the URL for retrieving a specific taxonomy term', function() {
			var url = taxonomies.id( 'my-tax' ).terms().id( 1337 ).generateRequestUri();
			assert.strictEqual( url, '/wp-json/taxonomies/my-tax/terms/1337' );
		} );
	} );

	describe( 'users', function() {
		var users = WP().users();

		it( 'should create the URL for retrieving all users', function() {
			var url = users.generateRequestUri();
			assert.strictEqual( url, '/wp-json/users' );
		} );

		it( 'should create the URL for retrieving the current user', function() {
			var url = users.me().generateRequestUri();
			assert.strictEqual( url, '/wp-json/users/me' );
		} );

		it( 'should create the URL for retrieving a specific user by ID', function() {
			var url = users.id( 1337 ).generateRequestUri();
			assert.strictEqual( url, '/wp-json/users/1337' );
		} );
	} );

} );
