'use strict';
var expect = require( 'chai' ).expect;

var WP = require( '../../' );
var WPRequest = require( '../../lib/shared/wp-request.js' );

describe( 'integration: posts()', function() {
	var wp;

	beforeEach(function() {
		wp = new WP({
			endpoint: 'http://wpapi.loc/wp-json'
		});
	});

	it( 'can be used to retrieve a list of recent posts', function() {
		return wp.posts().then(function( posts ) {
			expect( posts ).to.be.an( 'array' );
			expect( posts.length ).to.equal( 10 );
		});
	});

	it( 'fetches the 10 most recent posts by default', function() {
		return wp.posts().then(function( posts ) {
			var titles = posts.map(function( post ) {
				return post.title.rendered;
			});
			expect( titles ).to.deep.equal([
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
			]);
		});
	});

	describe( 'paging properties', function() {

		it( 'are exposed as _paging on the response array', function() {
			return wp.posts().then(function( posts ) {
				expect( posts ).to.have.property( '_paging' );
				expect( posts._paging ).to.be.an( 'object' );
			});
		});

		it( 'include the total number of posts', function() {
			return wp.posts().then(function( posts ) {
				expect( posts._paging ).to.have.property( 'total' );
				expect( posts._paging.total ).to.equal( '38' );
			});
		});

		it( 'include the total number of pages available', function() {
			return wp.posts().then(function( posts ) {
				expect( posts._paging ).to.have.property( 'totalPages' );
				expect( posts._paging.totalPages ).to.equal( '4' );
			});
		});

		it( 'provides a bound WPRequest for the next page as .next', function() {
			return wp.posts().then(function( posts ) {
				expect( posts._paging ).to.have.property( 'next' );
				expect( posts._paging.next ).to.be.an( 'object' );
				expect( posts._paging.next ).to.be.an.instanceOf( WPRequest );
				expect( posts._paging.next._options.endpoint ).to
					.equal( 'http://wpapi.loc/wp-json/wp/v2/posts?page=2' );
			});
		});

		it.skip( 'allows access to the next page of results via .next', function() {
			return wp.posts().then(function( posts ) {
				return posts._paging.next.then(function( posts ) {
					expect( posts ).to.be.an( 'array' );
					expect( posts.length ).to.equal( 10 );
					var titles = posts.map(function( post ) {
						return post.title.rendered;
					});
					expect( titles ).not.to.deep.equal([
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
					]);
				});
			});
		});

	});

});
