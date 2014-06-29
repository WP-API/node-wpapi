'use strict';
/**
 * @module WP
 * @submodule UsersRequest
 * @beta
 */
var WPRequest = require( './WPRequest' );
var util = require( 'util' );

/**
 * UsersRequest extends WPRequest to handle the /users API endpoint
 *
 * @class UsersRequest
 * @constructor
 * @extends WPRequest
 * @param {Object} options A hash of options for the UsersRequest instance
 * @param {String} options.endpoint The endpoint URI for the invoking WP instance
 * @param {String} [options.username] A username for authenticating API requests
 * @param {String} [options.password] A password for authenticating API requests
 */
function UsersRequest( options ) {
	/**
	 * Configuration options for the request such as the endpoint for the invoking WP instance
	 * @property _options
	 * @type Object
	 * @private
	 * @default {}
	 */
	this._options = options || {};

	/**
	 * @property _supportedMethods
	 * @type Array
	 * @private
	 * @default [ 'head', 'get', 'post' ]
	 */
	this._supportedMethods = [ 'head', 'get', 'post' ];

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
	 * @protected
	 * @default 'users(/:id)'
	 */
	this._template = 'users(/:id)';
}

util.inherits( UsersRequest, WPRequest );

/**
 * A hash table of path keys and regex validators for those path elements
 *
 * @property _pathValidators
 * @type Object
 * @private
 */
UsersRequest.prototype._pathValidators = {

	/**
	 * ID must be an integer or "me"
	 *
	 * @property _pathValidators.id
	 * @type {RegExp}
	 */
	id: /(^\d+$|^me$)/
};

/**
 * @method me
 * @chainable
 * @return {UsersRequest} The UsersRequest instance (for chaining)
 */
UsersRequest.prototype.me = function() {
	this._path.id = 'me';
	this._supportedMethods = [ 'head', 'get' ];

	return this;
};

/**
 * @method id
 * @chainable
 * @param {Number} id The integer ID of a user record
 * @return {UsersRequest} The UsersRequest instance (for chaining)
 */
UsersRequest.prototype.id = function( id ) {
	this._path.id = parseInt( id, 10 );
	this._supportedMethods = [ 'head', 'get', 'put', 'post', 'delete' ];

	return this;
};

module.exports = UsersRequest;
