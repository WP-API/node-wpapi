/**
 * @module WP
 * @submodule PostsRequest
 * @beta
 */
const WPRequest = require( './WPRequest' );
const util = require( 'util' );
const extend = require( 'node.extend' );
const filters = require( './shared/filters' );

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
	 * @default {}
	 */
	this._options = options || {};

	/**
	 * A hash of filter values to parse into the final request URI
	 * @property _filters
	 * @type Object
	 * @default {}
	 */
	this._filters = {};

	/**
	 * A hash of taxonomy terms to parse into the final request URI
	 * @property _taxonomyFilters
	 * @type Object
	 * @default {}
	 */
	this._taxonomyFilters = {};

	/**
	 * @property _supportedMethods
	 * @type Array
	 * @default [ 'head', 'get', 'post' ]
	 */
	this._supportedMethods = [ 'head', 'get', 'post' ];

	/**
	 * A hash of values (ID, action, action ID) to assemble into the API request path
	 *
	 * @property _path.values
	 * @type Object
	 * @default {}
	 */
	this._path.values = {};
}

util.inherits( PostsRequest, WPRequest );

/**
 * Container object for path options and configuration
 *
 * @property _path
 * @type Object
 * @default {}
 */
PostsRequest.prototype._path = {

	/**
	 * The URL template that will be used to assemble endpoint paths
	 *
	 * @property _path.template
	 * @type String
	 * @default 'posts(/:id)(/:action)(/:actionId)'
	 */
	template: 'posts(/:id)(/:action)(/:actionId)',

	/**
	 * A hash table of path keys and regex validators for those path elements
	 *
	 * @example
	 *     // ':id' in the path must be a number
	 *     _path.validators = { id: /^\d+$/ }
	 *
	 * @property _path.validators
	 * @type Object
	 */
	validators: {
		// ID must be an integer
		id: /^\d+$/,
		// Action must be one of 'meta', 'comments', or 'revisions'
		action: /(meta|comments|revisions)/
		// No validation for actionId: it can be numeric or a string
	}

};

/**
 * @method id
 * @return {PostsRequest} The PostsRequest instance (for chaining)
 */
PostsRequest.prototype.id = function( id ) {
	var action = this._path.values.action;

	if ( ! action ) {
		this._path.values.id = parseInt( id, 10 );
		this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
	} else if ( action === 'comments' ) {
		this._path.values.actionId = parseInt( id, 10 );
		this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
	} else if ( action === 'types' ) {
		this._path.values.actionId = id;
		this._supportedMethods = [ 'head', 'get' ];
	}

	return this;
};

/**
 * @method comments
 * @return {PostsRequest} The PostsRequest instance (for chaining)
 */
PostsRequest.prototype.comments = function() {
	this._path.values.action = 'comments';
	this._supportedMethods = [ 'head', 'get', 'post' ];
	return this;
};

/**
 * @method types
 * @return {PostsRequest} The PostsRequest instance (for chaining)
 */
PostsRequest.prototype.types = function() {
	this._path.values.action = 'types';
	this._supportedMethods = [ 'head', 'get' ];
	return this;
};

/**
 * @method revisions
 * @return {PostsRequest} The PostsRequest instance (for chaining)
 */
PostsRequest.prototype.revisions = function() {
	this._path.values.action = 'revisions';
	this._supportedMethods = [ 'head', 'get' ];
	return this;
};

/**
 * @method statuses
 * @return {PostsRequest} The PostsRequest instance (for chaining)
 */
PostsRequest.prototype.statuses = function() {
	this._path.values.action = 'statuses';
	this._supportedMethods = [ 'head', 'get' ];
	return this;
};

// All filter methods should be available to PostsRequest instances
extend( PostsRequest.prototype, filters.mixins );

module.exports = PostsRequest;
