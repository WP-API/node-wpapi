'use strict';
/**
 * @module WP
 * @submodule PostsRequest
 * @beta
 */
var WPRequest = require( './WPRequest' );
var util = require( 'util' );
var extend = require( 'node.extend' );
var filters = require( './shared/filters' );

/**
 * PostsRequest extends WPRequest to handle the /posts API endpoint
 *
 * @class PostsRequest
 * @constructor
 * @extends WPRequest
 * @uses CollectionFilters
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
	 * @private
	 * @default 'posts(/:id)(/:action)(/:actionId)'
	 */
	this._template = 'posts(/:id)(/:action)(/:actionId)';
}

util.inherits( PostsRequest, WPRequest );

/**
 * A hash table of path keys and regex validators for those path elements
 *
 * @property _pathValidators
 * @type Object
 * @private
 */
PostsRequest.prototype._pathValidators = {

	/**
	 * ID must be an integer
	 *
	 * @property _pathValidators.id
	 * @type {RegExp}
	 */
	id: /^\d+$/,

	/**
	 * Action must be one of 'meta', 'comments', or 'revisions'
	 *
	 * @property _pathValidators.action
	 * @type {RegExp}
	 */
	action: /(meta|comments|revisions)/

	// No validation for actionId: it can be numeric or a string
};

/**
 * Specify a post ID to query
 *
 * @method id
 * @return {PostsRequest} The PostsRequest instance (for chaining)
 */
PostsRequest.prototype.id = function( id ) {
	var action = this._path.action;

	if ( ! action ) {
		this._path.id = parseInt( id, 10 );
		this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
	} else if ( action === 'comments' ) {
		this._path.actionId = parseInt( id, 10 );
		this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
	} else if ( action === 'types' ) {
		this._path.actionId = id;
		this._supportedMethods = [ 'head', 'get' ];
	}

	return this;
};

/**
 * Specify that we are getting the comments for a specific post
 *
 * @method comments
 * @return {PostsRequest} The PostsRequest instance (for chaining)
 */
PostsRequest.prototype.comments = function() {
	this._path.action = 'comments';
	this._supportedMethods = [ 'head', 'get', 'post' ];
	return this;
};

/**
 * @method types
 * @return {PostsRequest} The PostsRequest instance (for chaining)
 */
PostsRequest.prototype.types = function() {
	this._path.action = 'types';
	this._supportedMethods = [ 'head', 'get' ];
	return this;
};

/**
 * Specify that we are requesting the revisions for a specific post
 *
 * @method revisions
 * @return {PostsRequest} The PostsRequest instance (for chaining)
 */
PostsRequest.prototype.revisions = function() {
	this._path.action = 'revisions';
	this._supportedMethods = [ 'head', 'get' ];
	return this;
};

/**
 * @method statuses
 * @return {PostsRequest} The PostsRequest instance (for chaining)
 */
PostsRequest.prototype.statuses = function() {
	this._path.action = 'statuses';
	this._supportedMethods = [ 'head', 'get' ];
	return this;
};

// All filter methods should be available to PostsRequest instances
extend( PostsRequest.prototype, filters.mixins );

module.exports = PostsRequest;
