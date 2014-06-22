const expect = require( 'chai' ).expect;

const WPQuery = require( '../../lib/wpQuery' );

describe( 'WPQuery', function() {

	describe( 'constructor', function() {

		it( 'should create a WPQuery instance', function() {
			var query1 = new WPQuery();
			expect( query1 instanceof WPQuery ).to.equal( true );
		});

		it( 'should set any passed-in options', function() {
			var query = new WPQuery({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( query._options.booleanProp ).to.equal( true );
			expect( query._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should define a _filters object', function() {
			var query = new WPQuery();
			expect( typeof query._filters ).to.equal( 'object' );
		});

		it( 'should define a _supportedMethods array', function() {
			var query = new WPQuery();
			expect( query._supportedMethods.sort().join( '|' ) ).to.equal(
				'delete|get|head|patch|post|put' );
		});

	});

	describe( '_isSupportedMethod', function() {

		it( 'should return true when called with a supported method', function() {
			var query = new WPQuery();
			expect( query._isSupportedMethod( 'get' ) ).to.equal( true );
		});

		it( 'should throw an error when called with an unsupported method', function() {
			var query = new WPQuery();
			query._supportedMethods = [ 'get' ];

			expect(function() {
				return query._isSupportedMethod( 'post' );
			}).to.throw();
		});

	});

});
