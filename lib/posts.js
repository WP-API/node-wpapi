const wpQuery = require( './wpQuery' );
const util = require( 'util' );

/**
 * @class posts
 * @constructor
 * @extends wpQuery
 */
function posts( options ) {
	this._options = options || {};
	this._id = null;
	this._supportedMethods = [ 'head', 'get', 'post' ];
	this._action = null;
	this._actionId = null;
}

util.inherits( posts, wpQuery );

/**
 * @method id
 * @return {PostQuery} The PostQuery instance (for chaining)
 */
posts.prototype.id = function( id ) {
	if ( this._action === null ) {
		this._id = parseInt( id, 10 );
		this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
	} else if ( this._action === 'comments' ) {
		this._actionId = parseInt( id, 10 );
		this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
	} else if ( this._action === 'types' ) {
		this._actionId = id;
		this._supportedMethods = [ 'head', 'get' ];
	}

	return this;
};

/**
 * @method comments
 * @return {PostQuery} The PostQuery instance (for chaining)
 */
posts.prototype.comments = function() {
	this._action = 'comments';
	this._supportedMethods = [ 'head', 'get', 'post' ];
	return this;
};

/**
 * @method types
 * @return {PostQuery} The PostQuery instance (for chaining)
 */
posts.prototype.types = function() {
	this._action = 'types';
	this._supportedMethods = [ 'head', 'get' ];
	return this;
};

/**
 * @method revisions
 * @return {PostQuery} The PostQuery instance (for chaining)
 */
posts.prototype.revisions = function() {
	this._action = 'revisions';
	this._supportedMethods = [ 'head', 'get' ];
	return this;
};

/**
 * @method statuses
 * @return {PostQuery} The PostQuery instance (for chaining)
 */
posts.prototype.statuses = function() {
	this._action = 'statuses';
	this._supportedMethods = [ 'head', 'get' ];
	return this;
};

/**
 * @method generateRequestUri
 * @return {String} The URI target for the HTTP request
 */
posts.prototype.generateRequestUri = function() {
	var path = [ 'posts' ];
	if ( this._id !== null ) {
		path.push( this._id );
	}
	if ( this._action !== null ) {
		path.push( this._action );
	}
	if ( this._actionId !== null ) {
		path.push( this._actionId );
	}

	// Ensure trailing slash on endpoint and concatenate with request path
	return this._options.endpoint.replace( /\/?$/, '/' ) + path.join( '/' );
};

module.exports = posts;
