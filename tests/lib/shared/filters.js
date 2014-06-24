const chai = require( 'chai' );
const expect = chai.expect;
// chai.use( require( 'sinon-chai' ) );
// const sinon = require( 'sinon' );
// const sandbox = require( 'sandboxed-module' );

const extend = require( 'node.extend' );
const filters = require( '../../../lib/shared/filters' );

describe( 'collection().filters', function() {

	var request;

	beforeEach(function() {
		function Endpoint() {
			this._filters = {};
			this._taxonomyFilters = {};
		}
		extend( Endpoint.prototype, filters.mixins );
		request = new Endpoint();
	});

	describe( 'filter', function() {

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
