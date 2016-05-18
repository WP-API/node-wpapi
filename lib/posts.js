'use strict';
/**
 * @module WP
 * @submodule PostsRequest
 * @beta
 */
var CollectionRequest = require( './shared/collection-request' );
var inherit = require( 'util' ).inherits;

/**
 * PostsRequest extends CollectionRequest to handle the /posts API endpoint
 *
 * @class PostsRequest
 * @constructor
 * @extends CollectionRequest
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
	this._path = { postType: 'posts' };

	/**
	 * The URL template that will be used to assemble endpoint paths
	 *
	 * @property _template
	 * @type String
	 * @private
	 * @default 'posts(/:id)(/:action)(/:actionId)'
	 */
	this._template = ':postType(/:id)(/:action)(/:actionId)';

	/**
	 * @property _supportedMethods
	 * @type Array
	 * @private
	 * @default [ 'head', 'get', 'post' ]
	 */
	this._supportedMethods = [ 'head', 'get', 'post' ];

	// Default all .posts() requests to assume a query against the WP API v2 endpoints
	this.namespace( 'wp/v2' );
}

inherit( PostsRequest, CollectionRequest );

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
	 * Action must be one of 'meta' or 'revisions'
	 *
	 * @property _pathValidators.action
	 * @type {RegExp}
	 */
	action: /(meta|revisions)/
};

/**
 * Specify a post ID to query
 *
 * @method id
 * @chainable
 * @param {Number} id The ID of a post to retrieve
 * @return {PostsRequest} The PostsRequest instance (for chaining)
 */
PostsRequest.prototype.id = function( id ) {
	this._path.id = parseInt( id, 10 );
	this._supportedMethods = [ 'head', 'get', 'put', 'post', 'delete' ];

	return this;
};

/**
 * Specify that we are retrieving Post Meta (forces basic auth)
 *
 * Either return a collection of all meta objects for the specified post,
 * or (if a meta ID was provided) return the requested meta object.
 *
 * @method meta
 * @chainable
 * @param {Number} [metaId] ID of a specific meta property to retrieve
 * @return {PostsRequest} The PostsRequest instance (for chainin)
 */
PostsRequest.prototype.meta = function( metaId ) {
	this._path.action = 'meta';
	this._supportedMethods = [ 'head', 'get', 'post' ];
	this._path.actionId = parseInt( metaId, 10 ) || null;

	if ( this._path.actionId ) {
		this._supportedMethods = [ 'head', 'get', 'put', 'post', 'delete' ];
	}

	return this.auth();
};

/**
 * Specify that we are requesting the revisions for a specific post (forces basic auth)
 *
 * @method revisions
 * @chainable
 * @return {PostsRequest} The PostsRequest instance (for chaining)
 */
PostsRequest.prototype.revisions = function() {
	this._path.action = 'revisions';
	this._supportedMethods = [ 'head', 'get' ];

	return this.auth();
};

/**
 * Change the type of posts that we are querying.
 *
 * @method type
 * @chainable
 * @param {String} type A string specifying the post type to query
 * @return {PostsRequest} The PostsRequest instance (for chaining)
 */
PostsRequest.prototype.type = function( type ) {
	this._path.postType = type;
	return this;
};

module.exports = PostsRequest;
