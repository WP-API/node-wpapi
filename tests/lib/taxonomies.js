const chai = require( 'chai' );
const expect = chai.expect;
const sinon = require( 'sinon' );
const sandbox = require( 'sandboxed-module' );

const TaxonomiesRequest = require( '../../lib/taxonomies' );

describe( 'wp.taxonomies', function() {

	describe( 'constructor', function() {

		it( 'should create a TaxonomiesRequest instance', function() {
			var query1 = new TaxonomiesRequest();
			expect( query1 instanceof TaxonomiesRequest ).to.be.true;
		});

		it( 'should set any passed-in options', function() {
			var taxonomies = new TaxonomiesRequest({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( taxonomies._options.booleanProp ).to.be.true;
			expect( taxonomies._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should default _options to {}', function() {
			var taxonomies = new TaxonomiesRequest();
			expect( taxonomies._options ).to.deep.equal( {} );
		});

		it( 'should intitialize instance properties', function() {
			var taxonomies = new TaxonomiesRequest();
			var _supportedMethods = taxonomies._supportedMethods.sort().join( '|' );
			expect( taxonomies._path.values ).to.deep.equal({});
			expect( _supportedMethods ).to.equal( 'get|head' );
		});

		it( 'should inherit TaxonomiesRequest from WPRequest using util.inherits', function() {

			var utilInherits = sinon.spy();
			sandbox.load( '../../lib/taxonomies', {
				requires: {
					'./WPRequest': 'WPRequestMock',
					'util': {
						inherits: utilInherits
					}
				}
			});

			// [ 0 ][ 1 ]: Call #1, Argument #2 should be our request mock
			expect( utilInherits.args[ 0 ][ 1 ] ).to.equal( 'WPRequestMock' );
		});

	});

	describe( '_path', function() {
		var path;

		beforeEach(function() {
			path = new TaxonomiesRequest()._path;
		});

		it( 'is defined', function() {
			expect( path ).to.be.defined;
		});

		it( 'has a path template', function() {
			expect( path.template ).to.equal( 'taxonomies(/:taxonomy)(/:action)(/:term)' );
		});

		it( 'sets a validator for the "action" property', function() {
			expect( path.validators ).to.deep.equal({
				action: /terms/
			});
		});

	});

	describe( 'URL Generation', function() {

		var taxonomies;

		beforeEach(function() {
			taxonomies = new TaxonomiesRequest();
			taxonomies._options = {
				endpoint: '/wp-json/'
			};
		});

		it( 'should create the URL for retrieving all taxonomies', function() {
			var url = taxonomies._renderURI();
			expect( url ).to.equal( '/wp-json/taxonomies' );
		});

		it( 'should create the URL for retrieving a specific taxonomy', function() {
			var url = taxonomies.taxonomy( 'my-tax' )._renderURI();
			expect( url ).to.equal( '/wp-json/taxonomies/my-tax' );
		});

		it( 'should create the URL for retrieving all terms for a specific taxonomy', function() {
			var url = taxonomies.taxonomy( 'my-tax' ).terms()._renderURI();
			expect( url ).to.equal( '/wp-json/taxonomies/my-tax/terms' );
		});

		it( 'should error if any _path.values.action other than "terms" is set', function() {
			taxonomies._path.values.action = 'something',
			expect(function actionMustBeTerms() {
				taxonomies._renderURI();
			}).to.throw();
		});

		it( 'should create the URL for retrieving a specific taxonomy term', function() {
			var url = taxonomies.taxonomy( 'my-tax' ).terms().term( 1337 )._renderURI();
			expect( url ).to.equal( '/wp-json/taxonomies/my-tax/terms/1337' );
		});

	});

});
