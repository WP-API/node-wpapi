/**
 * @module WP
 * @submodule UsersRequest
 * @beta
 */
const WPRequest = require( './WPRequest' );
const util = require( 'util' );

/**
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
	 * @default {}
	 */
	this._options = options || {};

	/**
	 * The ID for the user record being requested
	 * @property _id
	 * @type Number
	 * @default null
	 */
	this._id = null;

	/**
	 * @property _supportedMethods
	 * @type Array
	 * @default [ 'head', 'get', 'post' ]
	 */
	this._supportedMethods = [ 'head', 'get', 'post' ];
}

util.inherits( UsersRequest, WPRequest );

/**
 * @method me
 * @chainable
 * @return {UsersRequest} The UsersRequest instance (for chaining)
 */
UsersRequest.prototype.me = function() {
	this._id = 'me';
	this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
	return this;
};

/**
 * @method id
 * @chainable
 * @param {Number} id The integer ID of a user record
 * @return {UsersRequest} The UsersRequest instance (for chaining)
 */
UsersRequest.prototype.id = function( id ) {
	this._id = parseInt( id, 10 );
	this._supportedMethods = [ 'head', 'get', 'post' ];

	return this;
};

/**
 * Parse the request's instance properties into a WordPress API request URI
 *
 * @method generateRequestUri
 * @return {String} The URI for the HTTP request to the users endpoint
 */
UsersRequest.prototype.generateRequestUri = function() {
	var path = [ 'users' ];
	if ( this._id !== null ) {
		path.push( this._id );
	}

	return this._options.endpoint + path.join( '/' );
};

module.exports = UsersRequest;
