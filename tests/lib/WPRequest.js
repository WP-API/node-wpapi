const chai = require( 'chai' );
const expect = chai.expect;
chai.use( require( 'sinon-chai' ) );

const WPRequest = require( '../../lib/WPRequest' );

describe( 'WPRequest', function() {

	describe( 'constructor', function() {

		it( 'should create a WPRequest instance', function() {
			var request = new WPRequest();
			expect( request instanceof WPRequest ).to.be.true;
		});

		it( 'should set any passed-in options', function() {
			var request = new WPRequest({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( request._options.booleanProp ).to.be.true;
			expect( request._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should define a _filters object', function() {
			var request = new WPRequest();
			expect( request._filters ).to.deep.equal({});
		});

		it( 'should define a _supportedMethods array', function() {
			var request = new WPRequest();
			var _supportedMethods = request._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'delete|get|head|patch|post|put' );
		});

	});

	describe( '_checkMethodSupport', function() {

		it( 'should return true when called with a supported method', function() {
			var query = new WPRequest();
			expect( query._checkMethodSupport( 'get' ) ).to.equal( true );
		});

		it( 'should throw an error when called with an unsupported method', function() {
			var query = new WPRequest();
			query._supportedMethods = [ 'get' ];

			expect(function() {
				return query._checkMethodSupport( 'post' );
			}).to.throw();
		});

	});

	describe( 'prototype.filter', function() {
		var request;

		beforeEach(function() {
			request = new WPRequest();
		});

		it( 'should set the internal _filters hash', function() {
			request.filter({
				someFilterProp: 'filter-value',
				postsPerPage: 7
			});
			expect( request._filters ).to.deep.equal({
				someFilterProp: 'filter-value',
				postsPerPage: 7
			});
		});

		it( 'should support passing a single filter property as key & value arguments', function() {
			request.filter( 'postType', 'page' );
			expect( request._filters ).to.deep.equal({
				postType: 'page'
			});
		});

		it( 'should support redefining filter values', function() {
			request.filter( 'postStatus', 'draft' );
			request.filter( 'postStatus', 'publish' );
			expect( request._filters.postStatus ).to.equal( 'publish' );
		});

		it( 'should support chaining filters', function() {
			request.filter({
				someFilterProp: 'filter-value'
			}).filter({
				postsPerPage: 7
			}).filter( 'postStatus', 'draft' );
			expect( request._filters ).to.deep.equal({
				someFilterProp: 'filter-value',
				postsPerPage: 7,
				postStatus: 'draft'
			});
		});

	});

});
