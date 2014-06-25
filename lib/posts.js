/**
 * @module WP
 * @submodule PostsRequest
 * @beta
 */
const WPRequest = require( './WPRequest' );
const util = require( 'util' );
const extend = require( 'node.extend' );
const filters = require( './shared/filters' );
const Route = require( 'route-parser' );

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
 * Validate & assemble a path string from the request object's _path.values
 *
 * @method _pathStr
 * @return {String} The rendered path
 */
PostsRequest.prototype._pathStr = function() {
	var path = new Route( this._path.template );
	var pathValues = validatePath( this._path.values, this._path.validators );

	return path.reverse( pathValues );
};

function validatePath( pathValues, validators ) {
	for ( var param in pathValues ) {
		if ( ! pathValues.hasOwnProperty( param ) ) {
			continue;
		}

		// No validator, no problem
		if ( ! validators[ param ] ) {
			continue;
		}

		// Convert parameter to a string value and check it against the regex
		if ( ! ( pathValues[ param ] + '' ).match( validators[ param ] ) ) {
			throw new Error( param + ' does not match ' + validators[ param ] );
		}
	}

	// If validation passed, return the pathValues object
	return pathValues;
}

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
	return this._options.endpoint + path.join( '/' ) + this._queryStr();
};

// All filter methods should be available to PostsRequest instances
extend( PostsRequest.prototype, filters.mixins );

module.exports = PostsRequest;
