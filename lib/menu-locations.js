'use strict';
/**
 * @module WP
 * @submodule MenusLocationRequest
 * @beta
 */
var CollectionRequest = require( './shared/collection-request' );
var inherit = require( 'util' ).inherits;

/**
 * MenusLocationRequest extends CollectionRequest to handle the /taxonomies API endpoint
 *
 * @class MenusLocationRequest
 * @constructor
 * @extends CollectionRequest
 * @param {Object} options A hash of options for the MenusLocationRequest instance
 * @param {String} options.endpoint The endpoint URI for the invoking WP instance
 * @param {String} [options.username] A username for authenticating API requests
 * @param {String} [options.password] A password for authenticating API requests
 */
function MenusLocationRequest( options ) {
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
	this._template = 'menu-locations(/:location)';

	/**
	 * @property _supportedMethods
	 * @type Array
	 * @private
	 * @default ['get' ]
	 */
	this._supportedMethods = [ 'get' ];

	this.namespace( 'wp-api-menus/v2' );
}

// MenusLocationRequest extends CollectionRequest
inherit( MenusLocationRequest, CollectionRequest );

/**
 * Specify the name of the type to query
 *
 * @method menu
 * @chainable
 * @param {string} location The location of the menu to query
 * @return {MenusLocationRequest} The MenusLocationRequest instance (for chaining)
 */
MenusLocationRequest.prototype.location = function( location ) {
	this._path.location = location;
	return this;
};

module.exports = MenusLocationRequest;
