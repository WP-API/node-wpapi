'use strict';
/**
 * @module WP
 * @submodule CollectionRequest
 * @beta
 */
var WPRequest = require( './wp-request' );
var pick = require( 'lodash' ).pick;
var extend = require( 'node.extend' );
var inherit = require( 'util' ).inherits;

var filters = require( '../mixins/filters' );
var parameters = require( '../mixins/parameters' );

/**
 * CollectionRequest extends WPRequest with properties & methods for filtering collections
 * via query parameters. It is the base constructor for most top-level WP instance methods.
 *
 * @class CollectionRequest
 * @constructor
 * @extends WPRequest
 * @extensionfor PagesRequest
 * @extensionfor PostsRequest
 * @extensionfor TaxonomiesRequest
 * @extensionfor TypesRequest
 * @extensionfor UsersRequest
 * @param {Object} options A hash of options for the CollectionRequest instance
 * @param {String} options.endpoint The endpoint URI for the invoking WP instance
 * @param {String} [options.username] A username for authenticating API requests
 * @param {String} [options.password] A password for authenticating API requests
 */
function CollectionRequest( options ) {
	/**
	 * Configuration options for the request such as the endpoint for the invoking WP instance
	 * @property _options
	 * @type Object
	 * @private
	 * @default {}
	 */
	this._options = options || {};

	/**
	 * A hash of filter values to parse into the final request URI
	 * @property _filters
	 * @type Object
	 * @private
	 * @default {}
	 */
	this._filters = {};

	/**
	 * A hash of taxonomy terms to parse into the final request URI
	 * @property _taxonomyFilters
	 * @type Object
	 * @private
	 * @default {}
	 */
	this._taxonomyFilters = {};

	/**
	 * A hash of non-filter query parameters
	 * This is used to store the query values for Type, Page & Context
	 *
	 * @property _params
	 * @type Object
	 * @private
	 * @default {}
	 */
	this._params = {};

	/**
	 * A hash of values to assemble into the API request path
	 *
	 * @property _path
	 * @type Object
	 * @private
	 * @default {}
	 */
	this._path = {};

	/**
	 * The URL template that will be used to assemble endpoint paths
	 *
	 * @property _template
	 * @type String
	 * @private
	 * @default ''
	 */
	this._template = '';

	/**
	 * An array of supported methods; to be overridden by descendent constructors
	 * @property _supportedMethods
	 * @type Array
	 * @private
	 * @default [ 'head', 'get', 'put', 'post', 'delete' ]
	 */
	this._supportedMethods = [ 'head', 'get', 'put', 'post', 'delete' ];
}

inherit( CollectionRequest, WPRequest );

// Mixins
extend( CollectionRequest.prototype, pick( filters, [
	// Dependency of all other filter parameters, as well as parameterMixins.author
	'filter',
	// Taxomy handling
	'taxonomy',
	'category',
	'tag',
	// Date filter handling
	'year',
	'month',
	'day'
] ) );

extend( CollectionRequest.prototype, pick( parameters, [
	// Pagination
	'page',
	'perPage',
	// Other query parameters
	'slug',
	'name',
	'search',
	'author'
] ) );

module.exports = CollectionRequest;
