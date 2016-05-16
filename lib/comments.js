'use strict';
/**
 * @module WP
 * @submodule CommentsRequest
 * @beta
 */
var CollectionRequest = require( './shared/collection-request' );
var inherit = require( 'util' ).inherits;

/**
 * CommentsRequest extends CollectionRequest to handle the /comments API endpoint
 *
 * @class CommentsRequest
 * @constructor
 * @extends CollectionRequest
 * @param {Object} options A hash of options for the CommentsRequest instance
 * @param {String} options.endpoint The endpoint URI for the invoking WP instance
 * @param {String} [options.username] A username for authenticating API requests
 * @param {String} [options.password] A password for authenticating API requests
 */
function CommentsRequest( options ) {
	/**
	 * Configuration options for the request such as the endpoint for the invoking WP instance
	 * @property _options
	 * @type Object
	 * @private
	 * @default {}
	 */
	this._options = options || {};

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
	 * The URL template that will be used to assemble endpoint paths
	 *
	 * @property _template
	 * @type String
	 * @protected
	 * @default 'comments(/:id)'
	 */
	this._template = 'comments(/:id)';

	/**
	 * @property _supportedMethods
	 * @type Array
	 * @private
	 * @default [ 'head', 'get', 'post' ]
	 */
	this._supportedMethods = [ 'head', 'get', 'post' ];

	// Default all .comments() requests to assume a query against the WP API v2 endpoints
	this.namespace( 'wp/v2' );
}

// CommentsRequest extends CollectionRequest
inherit( CommentsRequest, CollectionRequest );

/**
 * A hash table of path keys and regex validators for those path elements
 *
 * @property _pathValidators
 * @type Object
 * @private
 */
CommentsRequest.prototype._pathValidators = {

	/**
	 * ID must be an integer
	 *
	 * @property _pathValidators.id
	 * @type {RegExp}
	 */
	id: /^\d+$/
};

/**
 * Specify a post ID to query
 *
 * @method id
 * @chainable
 * @param {Number} id The ID of a post to retrieve
 * @return {CommentsRequest} The CommentsRequest instance (for chaining)
 */
CommentsRequest.prototype.id = function( id ) {
	this._path.id = parseInt( id, 10 );
	this._supportedMethods = [ 'head', 'get', 'put', 'post', 'delete' ];

	return this;
};

/**
 * Specify the name of the taxonomy collection to query
 *
 * The collections will not be a strict match to defined comments: *e.g.*, to
 * get the list of terms for the taxonomy "category,"  you must specify the
 * collection name "categories" (similarly, specify "tags" to get a list of terms
 * for the "post_tag" taxonomy).
 *
 * To get the dictionary of all available comments, specify the collection
 * "taxonomy" (slight misnomer: this case will return an object, not the array
 * that would usually be expected with a "collection" request).
 *
 * @method collection
 * @chainable
 * @param {String} taxonomyCollection The name of the taxonomy collection to query
 * @return {CommentsRequest} The CommentsRequest instance (for chaining)
 */
CommentsRequest.prototype.collection = function( taxonomyCollection ) {
	this._path.collection = taxonomyCollection;

	return this;
};

/**
 * Specify a taxonomy term to request
 *
 * @method term
 * @chainable
 * @param {String} term The ID or slug of the term to request
 * @return {CommentsRequest} The CommentsRequest instance (for chaining)
 */
CommentsRequest.prototype.term = function( term ) {
	this._path.term = term;

	return this;
};

/**
 * Search for hierarchical taxonomy terms that are children of the parent term
 * indicated by the provided term ID
 *
 * @example
 *
 *     wp.categories().parent( 42 ).then(function( categories ) {
 *       console.log( 'all of these categories are sub-items of cat ID#42:' );
 *       console.log( categories );
 *     });
 *
 * @method parent
 * @chainable
 * @param {Number} parentId The ID of a (hierarchical) taxonomy term
 * @return {CommentsRequest} The CommentsRequest instance (for chaining)
 */
CommentsRequest.prototype.parent = function( parentId ) {
	this.param( 'parent', parentId, true );

	return this;
};

/**
 * Specify the post for which to retrieve terms
 *
 * @method forPost
 * @chainable
 * @param {String|Number} post The ID of the post for which to retrieve terms
 * @return {CommentsRequest} The CommentsRequest instance (for chaining)
 */
CommentsRequest.prototype.forPost = function( postId ) {
	this.param( 'post', postId );

	return this;
};

module.exports = CommentsRequest;
