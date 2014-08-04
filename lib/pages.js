'use strict';
/**
 * @module WP
 * @submodule PagesRequest
 * @beta
 */
var CollectionRequest = require( './shared/collection-request' );
var inherit = require( 'util' ).inherits;

/**
 * PagesRequest extends CollectionRequest to handle the /posts API endpoint
 *
 * @class PagesRequest
 * @constructor
 * @extends CollectionRequest
 * @param {Object} options A hash of options for the PagesRequest instance
 * @param {String} options.endpoint The endpoint URI for the invoking WP instance
 * @param {String} [options.username] A username for authenticating API requests
 * @param {String} [options.password] A password for authenticating API requests
 */
function PagesRequest( options ) {
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
	this._path = {};

	/**
	 * The URL template that will be used to assemble endpoint paths
	 *
	 * @property _template
	 * @type String
	 * @private
	 * @default 'pages(/:id)(/:action)(/:commentId)'
	 */
	this._template = 'pages(/:id)(/:action)(/:commentId)';

	/**
	 * @property _supportedMethods
	 * @type Array
	 * @private
	 * @default [ 'head', 'get', 'post' ]
	 */
	this._supportedMethods = [ 'head', 'get', 'post' ];
}

inherit( PagesRequest, CollectionRequest );

/**
 * A hash table of path keys and regex validators for those path elements
 *
 * @property _pathValidators
 * @type Object
 * @private
 */
PagesRequest.prototype._pathValidators = {

	// No validation on "id", since it can be a string path OR a numeric ID

	/**
	 * Action must be 'comments' or 'revisions'
	 *
	 * @property _pathValidators.action
	 * @type {RegExp}
	 * @private
	 */
	action: /(comments|revisions)/,

	/**
	 * Comment ID must be an integer
	 *
	 * @property _pathValidators.commentId
	 * @type {RegExp}
	 * @private
	 */
	commentId: /^\d+$/
};

/**
 * Specify a post ID to query
 *
 * @method id
 * @chainable
 * @return {PagesRequest} The PagesRequest instance (for chaining)
 */
PagesRequest.prototype.id = function( id ) {
	this._path.id = parseInt( id, 10 );

	this._supportedMethods = [ 'head', 'get', 'put', 'post', 'delete' ];

	return this;
};

/**
 * Specify that we are getting the comments for a specific page
 *
 * @method comments
 * @chainable
 * @return {PagesRequest} The PagesRequest instance (for chaining)
 */
PagesRequest.prototype.comments = function() {
	this._path.action = 'comments';
	this._supportedMethods = [ 'head', 'get' ];

	return this;
};

/**
 * Specify a particular comment to retrieve
 * (forces action "comments")
 *
 * @method comment
 * @chainable
 * @param {Number} id The ID of the comment to retrieve
 * @return {PagesRequest}
 */
PagesRequest.prototype.comment = function( id ) {
	this._path.action = 'comments';
	this._path.commentId = parseInt( id, 10 );
	this._supportedMethods = [ 'head', 'get', 'delete' ];

	return this;
};

/**
 * Specify that we are requesting the revisions for a specific post (forces basic auth)
 *
 * @method revisions
 * @chainable
 * @return {PagesRequest} The PagesRequest instance (for chaining)
 */
PagesRequest.prototype.revisions = function() {
	this._path.action = 'revisions';
	this._supportedMethods = [ 'head', 'get' ];

	return this.auth();
};

/**
 * Specify that we are requesting a page by its path
 *
 * @method path
 * @chainable
 * @param {String} path The root-relative URL path for a page
 * @return {PagesRequest} The PagesRequest instance (for chaining)
 */
PagesRequest.prototype.path = function( path ) {
	return this.filter({
		pagename: path
	});
};

module.exports = PagesRequest;
