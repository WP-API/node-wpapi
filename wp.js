/**
 * A WP REST API client for Node.js
 *
 * @example
 *     var wp = new WP({ endpoint: 'http://src.wordpress-develop.dev/wp-json' });
 *     wp.posts().then(function( posts ) {
 *         console.log( posts );
 *     }).catch(function( err ) {
 *         console.error( err );
 *     });
 *
 * @module WP
 * @main WP
 * @beta
 })
 */
var extend = require( 'node.extend' );

/**
 * The constructor for the WP API service
 *
 * @class WP
 * @constructor
 * @param {Object} options An options hash to configure the instance
 * @param {String} options.endpoint The URI for a WP-API endpoint
 * @param {String} [options.username] A WP-API Basic Auth username
 * @param {String} [options.password] A WP-API Basic Auth password
 */
function WP( options ) {

	// Enforce `new`
	if ( this instanceof WP === false ) {
		return new WP( options );
	}

	this._options = extend( {}, defaults, options );

	if ( ! this._options.endpoint ) {
		throw new Error( 'options hash must contain an API endpoint URL string' );
	}

	return this;
}

const defaults = {
	username: '',
	password: ''
};

/**
 * @method posts
 * @param {Object} [options] An options hash for a new PostsRequest
 * @return {PostsRequest} A PostsRequest instance
 */
WP.prototype.posts = function( options ) {
		var PostRequest = require( './lib/posts' );
		options = options || {};
		options = extend( options, this._options );
		return new PostRequest( options );
};

/**
 * @method taxonomies
 * @param {Object} [options] An options hash for a new TaxonomiesRequest
 * @return {TaxonomiesRequest} A TaxonomiesRequest instance
 */
WP.prototype.taxonomies = function( options ) {
		var TaxonomyRequest = require( './lib/taxonomies' );
		options = options || {};
		options = extend( options, this._options );
		return new TaxonomyRequest( options );
};

/**
 * @method users
 * @param {Object} [options] An options hash for a new UsersRequest
 * @return {UsersRequest} A UsersRequest instance
 */
WP.prototype.users = function( options ) {
		var UserRequest = require( './lib/users' );
		options = options || {};
		options = extend( options, this._options );
		return new UserRequest( options );
};

module.exports = WP;
