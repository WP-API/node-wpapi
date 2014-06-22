const WPRequest = require( './WPRequest' );
const util = require( 'util' );

/**
 * @class UsersRequest
 * @constructor
 * @extends WPRequest
 */
function UsersRequest( options ) {
	this._options = options || {};
	this._id = null;
	this._supportedMethods = [ 'head', 'get', 'post' ];
}

util.inherits( UsersRequest, WPRequest );

/**
 * @method me
 * @return {UsersRequest} The UsersRequest instance (for chaining)
 */
UsersRequest.prototype.me = function() {
	this._id = 'me';
	this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
	return this;
};

/**
 * @method id
 * @return {UsersRequest} The UsersRequest instance (for chaining)
 */
UsersRequest.prototype.id = function( id ) {
	this._id = parseInt( id, 10 );
	this._supportedMethods = [ 'head', 'get', 'post' ];

	return this;
};

/**
 * @method generateRequestUri
 * @return {UsersRequest} The UsersRequest instance (for chaining)
 */
UsersRequest.prototype.generateRequestUri = function() {
	var path = [ 'users' ];
	if ( this._id !== null ) {
		path.push( this._id );
	}

	return this._options.endpoint.replace( /\/?$/, '/' ) + path.join( '/' );
};

module.exports = UsersRequest;
