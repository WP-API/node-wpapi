'use strict';
var expect = require( 'chai' ).expect;

var WP = require( '../../../wp' );
var WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.posts', function() {
	var site;
	var posts;

	beforeEach(function() {
		site = new WP({
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass'
		});
		posts = site.posts();
	});

	describe( 'constructor', function() {

		it( 'should set any passed-in options', function() {
			posts = site.posts({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( posts._options.booleanProp ).to.be.true;
			expect( posts._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should initialize _options to the site defaults', function() {
			expect( posts._options ).to.deep.equal({
				endpoint: '/wp-json/',
				username: 'foouser',
				password: 'barpass'
			});
		});

		it( 'should initialize the base path component', function() {
			expect( posts._renderURI() ).to.equal( '/wp-json/wp/v2/posts' );
		});

		it( 'should set a default _supportedMethods array', function() {
			expect( posts ).to.have.property( '_supportedMethods' );
			expect( posts._supportedMethods ).to.be.an( 'array' );
		});

		it( 'should inherit PostsRequest from WPRequest', function() {
			expect( posts instanceof WPRequest ).to.be.true;
		});

	});

	describe( 'path part setters', function() {

		describe( '.id()', function() {

			it( 'provides a method to set the ID', function() {
				expect( posts ).to.have.property( 'id' );
				expect( posts.id ).to.be.a( 'function' );
			});

			it( 'should set the ID value in the path', function() {
				posts.id( 314159 );
				expect( posts._renderURI() ).to.equal( '/wp-json/wp/v2/posts/314159' );
			});

			it( 'accepts ID parameters as strings', function() {
				posts.id( '8' );
				expect( posts._renderURI() ).to.equal( '/wp-json/wp/v2/posts/8' );
			});

			it( 'should update the supported methods when setting ID', function() {
				posts.id( 8 );
				var _supportedMethods = posts._supportedMethods.sort().join( '|' );
				expect( _supportedMethods ).to.equal( 'delete|get|head|patch|post|put' );
			});

		});

		describe.skip( '.meta()', function() {

			it( 'is defined', function() {
				expect( posts ).to.have.property( 'meta' );
				expect( posts.meta ).to.be.a( 'function' );
			});

			it( 'provides a method to get the meta values for a post', function() {
				posts.id( 3 ).meta();
				expect( posts._renderURI() ).to.equal( '/wp-json/wp/v2/posts/3/meta' );
			});

			it( 'should force authentication when querying posts/id/meta', function() {
				posts.id( 1337 ).meta();
				expect( posts._options ).to.have.property( 'auth' );
				expect( posts._options.auth ).to.be.true;
			});

			it( 'should update the supported methods when querying for meta', function() {
				posts.id( 1066 ).meta();
				var _supportedMethods = posts._supportedMethods.sort().join( '|' );
				expect( _supportedMethods ).to.equal( 'get|head|post' );
			});

			it( 'provides a method to get specific post meta objects by ID', function() {
				posts.id( 3 ).meta( 5 );
				expect( posts._renderURI() ).to.equal( '/wp-json/wp/v2/posts/3/meta/5' );
			});

			it( 'should force authentication when querying posts/id/meta/:id', function() {
				posts.id( 7331 ).meta( 7 );
				expect( posts._options ).to.have.property( 'auth' );
				expect( posts._options.auth ).to.be.true;
			});

			it( 'should update the supported methods when querying for meta', function() {
				posts.id( 1066 ).meta( 2501 );
				var _supportedMethods = posts._supportedMethods.sort().join( '|' );
				expect( _supportedMethods ).to.equal( 'delete|get|head|post|put' );
			});

		});

	});

	describe( 'URL Generation', function() {

		it( 'should create the URL for retrieving all posts', function() {
			var path = posts._renderURI();
			expect( path ).to.equal( '/wp-json/wp/v2/posts' );
		});

		it( 'should create the URL for retrieving a specific post', function() {
			var path = posts.id( 1337 )._renderURI();
			expect( path ).to.equal( '/wp-json/wp/v2/posts/1337' );
		});

		it( 'does not throw an error if a valid numeric ID is specified', function() {
			expect(function numberPassesValidation() {
				posts.id( 8 );
				posts.validatePath();
			}).not.to.throw();
		});

		it( 'does not throw an error if a valid numeric ID is specified as a string', function() {
			expect( function numberAsStringPassesValidation() {
				posts.id( '8' );
				posts.validatePath();
			}).not.to.throw();
		});

		it( 'throws an error if a non-integer numeric string ID is specified', function() {
			expect( function nonIntegerNumberAsStringFailsValidation() {
				posts.id( 4.019 );
				posts.validatePath();
			}).to.throw();
		});

		it( 'throws an error if a non-numeric string ID is specified', function() {
			expect(function stringFailsValidation() {
				posts.id( 'wombat' );
				posts.validatePath();
			}).to.throw();
		});

		it.skip( 'should create the URL for retrieving all meta for a specific post', function() {
			var path = posts.id( 1337 ).meta()._renderURI();
			expect( path ).to.equal( '/wp-json/wp/v2/posts/1337/meta' );
		});

		it.skip( 'should create the URL for retrieving a specific meta item', function() {
			var path = posts.id( 1337 ).meta( 2001 )._renderURI();
			expect( path ).to.equal( '/wp-json/wp/v2/posts/1337/meta/2001' );
		});

		it( 'should create the URL for retrieving the revisions for a specific post', function() {
			var path = posts.id( 1337 ).revisions()._renderURI();
			expect( path ).to.equal( '/wp-json/wp/v2/posts/1337/revisions' );
		});

		it( 'should create the URL for retrieving a specific revision item', function() {
			var path = posts.id( 1337 ).revisions( 2001 )._renderURI();
			expect( path ).to.equal( '/wp-json/wp/v2/posts/1337/revisions/2001' );
		});

		it( 'should restrict path changes to a single instance', function() {
			posts.id( 2 );
			var newPosts = site.posts().id( 3 ).revisions();
			expect( posts._renderURI() ).to.equal( '/wp-json/wp/v2/posts/2' );
			expect( newPosts._renderURI() ).to.equal( '/wp-json/wp/v2/posts/3/revisions' );
		});

	});

});
