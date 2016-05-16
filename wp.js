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
var CommentsRequest = require( './lib/comments' );
var MediaRequest = require( './lib/media' );
var PagesRequest = require( './lib/pages' );
var PostsRequest = require( './lib/posts' );
var TaxonomiesRequest = require( './lib/taxonomies' );
var TypesRequest = require( './lib/types' );
var UsersRequest = require( './lib/users' );
var CollectionRequest = require( './lib/shared/collection-request' );
var WPRequest = require( './lib/shared/wp-request' );

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
 * Start a request against the `/comments` endpoint
 *
 * @method comments
 * @param {Object} [options] An options hash for a new CommentsRequest
 * @return {CommentsRequest} A CommentsRequest instance
 */
WP.prototype.comments = function( options ) {
	options = options || {};
	options = extend( options, this._options );
	return new CommentsRequest( options );
};

/**
 * Start a request against the `/media` endpoint
 *
 * @method media
 * @param {Object} [options] An options hash for a new MediaRequest
 * @return {MediaRequest} A MediaRequest instance
 */
WP.prototype.media = function( options ) {
	options = options || {};
	options = extend( options, this._options );
	return new MediaRequest( options );
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
 * Start a request for a taxonomy or taxonomy term collection
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
 * Start a request for a specific taxonomy object
 *
 * It is slightly unintuitive to consider the name of a taxonomy a "term," as is
 * needed in order to retrieve the taxonomy object from the .taxonomies() method.
 * This convenience method lets you create a `TaxonomiesRequest` object that is
 * bound to the provided taxonomy name, without having to utilize the "term" method.
 *
 * @example
 * If your site uses two custom taxonomies, book_genre and book_publisher, before you would
 * have had to request these terms using the verbose form:
 *
 *     wp.taxonomies().term( 'book_genre' )
 *     wp.taxonomies().term( 'book_publisher' )
 *
 * Using `.taxonomy()`, the same query can be achieved much more succinctly:
 *
 *     wp.taxonomy( 'book_genre' )
 *     wp.taxonomy( 'book_publisher' )
 *
 * @method taxonomy
 * @param {String} taxonomyName The name of the taxonomy to request
 * @return {TaxonomiesRequest} A TaxonomiesRequest object bound to the value of taxonomyName
 */
WP.prototype.taxonomy = function( taxonomyName ) {
	var options = extend( {}, this._options );
	return new TaxonomiesRequest( options ).term( taxonomyName );
};

/**
 * Request a list of category terms
 *
 * This is a shortcut method to retrieve the terms for the "category" taxonomy
 *
 * @example
 * These are equivalent:
 *
 *     wp.taxonomies().collection( 'categories' )
 *     wp.categories()
 *
 * @method categories
 * @return {TaxonomiesRequest} A TaxonomiesRequest object bound to the categories collection
 */
WP.prototype.categories = function() {
	var options = extend( {}, this._options );
	return new TaxonomiesRequest( options ).collection( 'categories' );
};

/**
 * Request a list of post_tag terms
 *
 * This is a shortcut method to interact with the collection of terms for the
 * "post_tag" taxonomy.
 *
 * @example
 * These are equivalent:
 *
 *     wp.taxonomies().collection( 'tags' )
 *     wp.tags()
 *
 * @method tags
 * @return {TaxonomiesRequest} A TaxonomiesRequest object bound to the tags collection
 */
WP.prototype.tags = function() {
	var options = extend( {}, this._options );
	return new TaxonomiesRequest( options ).collection( 'tags' );
};

/**
 * Start a request against the `/types` endpoint
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
	return new UsersRequest( options );
};

/**
 * Generate a request against a completely arbitrary endpoint, with no assumptions about
 * or mutation of path, filtering, or query parameters. This request is not restricted to
 * the endpoint specified during WP object instantiation.
 *
 * @example
 * Generate a request to the explicit URL "http://your.website.com/wp-json/some/custom/path" (yeah, we wish ;)
 *
 *     wp.url( 'http://your.website.com/wp-json/some/custom/path' ).get()...
 *
 * @method url
 * @param {String} url The URL to request
 * @return {WPRequest} A WPRequest object bound to the provided URL
 */
WP.prototype.url = function( url ) {
	var options = extend( {}, this._options, {
		endpoint: url
	});
	return new WPRequest( options );
};

/**
 * Generate a query against an arbitrary path on the current endpoint. This is useful for
 * requesting resources at custom WP-API endpoints, such as WooCommerce's `/products`.
 *
 * @method root
 * @param {String} [relativePath] An endpoint-relative path to which to bind the request
 * @param {Boolean} [collection] Whether to return a CollectionRequest or a vanilla WPRequest
 * @return {CollectionRequest|WPRequest} A request object
 */
WP.prototype.root = function( relativePath, collection ) {
	relativePath = relativePath || '';
	collection = collection || false;
	var options = extend( {}, this._options );
	// Request should be
	var request = collection ? new CollectionRequest( options ) : new WPRequest( options );

	// Set the path template to the string passed in
	request._template = relativePath;

	return request;
};

module.exports = WP;
