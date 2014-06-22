const WPRequest = require( './WPRequest' );
const util = require( 'util' );

/**
 * @class UsersQuery
 * @constructor
 * @extends WPRequest
 */
function UsersQuery( options ) {
	this._options = options || {};
	this._id = null;
	this._supportedMethods = [ 'head', 'get', 'post' ];
}

util.inherits( UsersQuery, WPRequest );

/**
 * @method me
 * @return {UsersQuery} The UsersQuery instance (for chaining)
 */
UsersQuery.prototype.me = function() {
	this._id = 'me';
	this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
	return this;
};

/**
 * @method id
 * @return {UsersQuery} The UsersQuery instance (for chaining)
 */
UsersQuery.prototype.id = function( id ) {
	this._id = parseInt( id, 10 );
	this._supportedMethods = [ 'head', 'get', 'post' ];

	return this;
};

/**
 * @method generateRequestUri
 * @return {UsersQuery} The UsersQuery instance (for chaining)
 */
UsersQuery.prototype.generateRequestUri = function() {
	var path = [ 'users' ];
	if ( this._id !== null ) {
		path.push( this._id );
	}

	return this._options.endpoint.replace( /\/?$/, '/' ) + path.join( '/' );
};

module.exports = UsersQuery;
