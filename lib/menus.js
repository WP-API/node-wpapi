'use strict';
/**
 * @module WP
 * @submodule MenusRequest
 * @beta
 */
var CollectionRequest = require( './shared/collection-request' );
var inherit = require( 'util' ).inherits;

/**
 * MenusRequest extends CollectionRequest to handle the /taxonomies API endpoint
 *
 * @class MenusRequest
 * @constructor
 * @extends CollectionRequest
 * @param {Object} options A hash of options for the MenusRequest instance
 * @param {String} options.endpoint The endpoint URI for the invoking WP instance
 * @param {String} [options.username] A username for authenticating API requests
 * @param {String} [options.password] A password for authenticating API requests
 */
function MenusRequest( options ) {
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
	 * A hash of non-filter query parameters
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
	 * The URL template that will be used to assemble request URI paths
	 *
	 * @property _template
	 * @type String
	 * @private
	 * @default 'posts/types(/:type)'
	 */
	this._template = 'menus(/:id)';

	/**
	 * @property _supportedMethods
	 * @type Array
	 * @private
	 * @default [ 'head', 'get' ]
	 */
	this._supportedMethods = [ 'get' ];

	// Default all .types() requests to assume a query against the WP API v2 endpoints
	this.namespace( 'wp-api-menus' ).version( 'v2' );
}

// MenusRequest extends CollectionRequest
inherit( MenusRequest, CollectionRequest );

/**
 * Specify the name of the type to query
 *
 * @method type
 * @chainable
 * @param {String} typeName The name of the type to query
 * @return {MenusRequest} The MenusRequest instance (for chaining)
 */
MenusRequest.prototype.menu = function( menuId ) {
	this._path.id = menuId;
	return this;
};

module.exports = MenusRequest;
