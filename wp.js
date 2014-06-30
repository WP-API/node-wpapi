'use strict';
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

var defaults = {
	username: '',
	password: ''
};

// Pull in request module constructors
var PagesRequest = require( './lib/pages' );
var PostsRequest = require( './lib/posts' );
var TaxonomiesRequest = require( './lib/taxonomies' );
var TypesRequest = require( './lib/types' );
var UserRequest = require( './lib/users' );

/**
 * The base constructor for the WP API service
 *
 * @class WP
 * @constructor
 * @uses PostsRequest
 * @uses TaxonomiesRequest
 * @uses UsersRequest
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

	// Ensure trailing slash on endpoint URI
	this._options.endpoint = this._options.endpoint.replace( /\/?$/, '/' );

	return this;
}

/**
 * Convenience method for making a new WP instance
 *
 * @example
 * These are equivalent:
 *
 *     var wp = new WP({ endpoint: 'http://my.blog.url/wp-json' });
 *     var wp = WP.site( 'http://my.blog.url/wp-json' );
 *
 * @method site
 * @static
 * @param {String} endpoint The URI for a WP-API endpoint
 * @return {WP} A new WP instance, bound to the provided endpoint
 */
WP.site = function( endpoint ) {
	return new WP({ endpoint: endpoint });
};

/**
 * Start a request against the `/pages` endpoint
 *
 * @method pages
 * @param {Object} [options] An options hash for a new PagesRequest
 * @return {PagesRequest} A PagesRequest instance
 */
WP.prototype.pages = function( options ) {
	options = options || {};
	options = extend( options, this._options );
	return new PagesRequest( options );
};

/**
 * Start a request against the `/posts` endpoint
 *
 * @method posts
 * @param {Object} [options] An options hash for a new PostsRequest
 * @return {PostsRequest} A PostsRequest instance
 */
WP.prototype.posts = function( options ) {
	options = options || {};
	options = extend( options, this._options );
	return new PostsRequest( options );
};

/**
 * Start a request against the `taxonomies` endpoint
 *
 * @method taxonomies
 * @param {Object} [options] An options hash for a new TaxonomiesRequest
 * @return {TaxonomiesRequest} A TaxonomiesRequest instance
 */
WP.prototype.taxonomies = function( options ) {
	options = options || {};
	options = extend( options, this._options );
	return new TaxonomiesRequest( options );
};

/**
 * Start a request against the `/posts/types` endpoint
 *
 * @method types
 * @param {Object} [options] An options hash for a new TypesRequest
 * @return {TypesRequest} A TypesRequest instance
 */
WP.prototype.types = function( options ) {
	options = options || {};
	options = extend( options, this._options );
	return new TypesRequest( options );
};

/**
 * Start a request against the `/users` endpoint
 *
 * @method users
 * @param {Object} [options] An options hash for a new UsersRequest
 * @return {UsersRequest} A UsersRequest instance
 */
WP.prototype.users = function( options ) {
	options = options || {};
	options = extend( options, this._options );
	return new UserRequest( options );
};

/**
 * Define a method to handle specific custom post types.
 *
 * @example
 * If your site had an events custom type with name `event_cpt`, you could create a convenience
 * method for querying events and store it on the WP instance.
 *
 * Create the WP instance, define the custom endpoint handler, and save it to `wp.events`:
 *
 *     var wp = new WP({ endpoint: 'http://some-website.com/wp-json' });
 *     wp.events = wp.registerType( 'event_cpt' );
 *
 * You can now call `wp.events()` to trigger event post requests
 *
 *     wp.events().get()... // equivalent to wp.posts().type( 'event_cpt' ).get()...
 *
 * `registerType()` just returns a function, so there's no requirement to store it as a property
 * on the WP instance; however, following the above pattern is likely to be the most useful.
 *
 * @method registerType
 * @param {String|Array} type A string or array of post type names
 * @return {Function} A function to create PostsRequests pre-bound to the provided types
 */
WP.prototype.registerType = function( type ) {
	return function() {
		return new PostsRequest().type( type );
	};
};

module.exports = WP;
