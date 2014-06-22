/**
 * @module WP
 * @submodule PostsRequest
 * @beta
 */
const WPRequest = require( './WPRequest' );
const util = require( 'util' );

/**
 * @class PostsRequest
 * @constructor
 * @extends WPRequest
 * @param {Object} options A hash of options for the PostsRequest instance
 * @param {String} options.endpoint The endpoint URI for the invoking WP instance
 * @param {String} [options.username] A username for authenticating API requests
 * @param {String} [options.password] A password for authenticating API requests
 */
function PostsRequest( options ) {
	/**
	 * Configuration options for the request such as the endpoint for the invoking WP instance
	 * @property _options
	 * @type Object
	 * @default {}
	 */
	this._options = options || {};

	/**
	 * The ID for the post being requested
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

	/**
	 * @property _action
	 * @type String
	 * @default null
	 */
	this._action = null;

	/**
	 * @property _actionId
	 * @type String
	 * @default null
	 */
	this._actionId = null;
}

util.inherits( PostsRequest, WPRequest );

/**
 * @method id
 * @return {PostsRequest} The PostsRequest instance (for chaining)
 */
PostsRequest.prototype.id = function( id ) {
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
 * @return {PostsRequest} The PostsRequest instance (for chaining)
 */
PostsRequest.prototype.comments = function() {
	this._action = 'comments';
	this._supportedMethods = [ 'head', 'get', 'post' ];
	return this;
};

/**
 * @method types
 * @return {PostsRequest} The PostsRequest instance (for chaining)
 */
PostsRequest.prototype.types = function() {
	this._action = 'types';
	this._supportedMethods = [ 'head', 'get' ];
	return this;
};

/**
 * @method revisions
 * @return {PostsRequest} The PostsRequest instance (for chaining)
 */
PostsRequest.prototype.revisions = function() {
	this._action = 'revisions';
	this._supportedMethods = [ 'head', 'get' ];
	return this;
};

/**
 * @method statuses
 * @return {PostsRequest} The PostsRequest instance (for chaining)
 */
PostsRequest.prototype.statuses = function() {
	this._action = 'statuses';
	this._supportedMethods = [ 'head', 'get' ];
	return this;
};

/**
 * Parse the request's instance properties into a WordPress API request URI
 *
 * @method generateRequestUri
 * @return {String} The URI for the HTTP request to the posts endpoint
 */
PostsRequest.prototype.generateRequestUri = function() {
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

module.exports = PostsRequest;
