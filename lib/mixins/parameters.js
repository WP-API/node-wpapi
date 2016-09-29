'use strict';
/*jshint -W106 */// Disable underscore_case warnings in this file b/c WP uses them
/**
 * Filter methods that can be mixed in to a request constructor's prototype to
 * allow that request to take advantage of top-level query parameters for
 * collection endpoints. These are most relevant to posts, pages and CPTs, but
 * pagination helpers are applicable to any collection.
 *
 * @module filters
 */
var paramSetter = require( '../util/parameter-setter' );

var parameterMixins = {};

// Needed for .author mixin, as author by ID is a parameter and by Name is a filter
var filter = require( './filters' ).filter;

// Parameter Methods
// =================

/**
 * Query for posts by a specific author.
 * This method will replace any previous 'author' query parameters that had been set.
 *
 * Note that this method will either set the "author" top-level query parameter,
 * or else the "author_name" filter parameter: this is irregular as most parameter
 * helper methods either set a top level parameter or a filter, not both.
 *
 * @method author
 * @chainable
 * @param {String|Number} author The nicename or ID for a particular author
 * @return The request instance (for chaining)
 */
parameterMixins.author = function( author ) {
	/* jshint validthis:true */
	if ( author === undefined ) {
		return this;
	}
	if ( typeof author === 'string' ) {
		this.param( 'author', null );
		return filter.call( this, 'author_name', author );
	}
	if ( typeof author === 'number' ) {
		filter.call( this, 'author_name', null );
		return this.param( 'author', author );
	}
	if ( author === null ) {
		filter.call( this, 'author_name', null );
		return this.param( 'author', null );
	}
	throw new Error( 'author must be either a nicename string or numeric ID' );
};

/**
 * Search for hierarchical taxonomy terms that are children of the parent term
 * indicated by the provided term ID
 *
 * @example
 *
 *     wp.pages().parent( 3 ).then(function( pages ) {
 *       // console.log( 'all of these pages are nested below page ID#3:' );
 *       // console.log( pages );
 *     });
 *
 *     wp.categories().parent( 42 ).then(function( categories ) {
 *       console.log( 'all of these categories are sub-items of cat ID#42:' );
 *       console.log( categories );
 *     });
 *
 * @method parent
 * @chainable
 * @param {Number} parentId The ID of a (hierarchical) taxonomy term
 * @return The request instance (for chaining)
 */
parameterMixins.parent = function( parentId ) {
	/* jshint validthis:true */
	return this.param( 'parent', parentId, true );
};

/**
 * Specify the post for which to retrieve terms (relevant for *e.g.* taxonomy
 * and comment collection endpoints). `forPost` is used to avoid conflicting
 * with the `.post()` method, which corresponds to the HTTP POST action.
 *
 * @method forPost
 * @chainable
 * @param {String|Number} post The ID of the post for which to retrieve terms
 * @return The request instance (for chaining)
 */
parameterMixins.forPost = paramSetter( 'post' );

/**
 * Specify the password to use to access the content of a password-protected post
 *
 * @method password
 * @chainable
 * @param {string} password A string password to access protected content within a post
 * @returns The request instance (for chaining)
 */
parameterMixins.password = paramSetter( 'password' );

/**
 * Specify whether to return only, or to completely exclude, sticky posts
 *
 * @method sticky
 * @chainable
 * @param {boolean} sticky A boolean value for whether ONLY sticky posts (true) or
 *                         NO sticky posts (false) should be returned in the query
 * @returns The request instance (for chaining)
 */
parameterMixins.sticky = paramSetter( 'sticky' );

// Date Methods
// ============

/**
 * Retrieve only records published before a specified date
 *
 * @example Provide an ISO 8601-compliant date string
 *
 *     wp.posts().before('2016-03-22')...
 *
 * @example Provide a JavaScript Date object
 *
 *     wp.posts().before( new Date( 2016, 03, 22 ) )...
 *
 * @method before
 * @chainable
 * @param {String|Date} date An ISO 8601-compliant date string, or Date object
 * @return The request instance (for chaining)
 */
parameterMixins.before = function( date ) {
	/* jshint validthis:true */
	return this.param( 'before', new Date( date ).toISOString() );
};

/**
 * Retrieve only records published after a specified date
 *
 * @example Provide an ISO 8601-compliant date string
 *
 *     wp.posts().after('1986-03-22')...
 *
 * @example Provide a JavaScript Date object
 *
 *     wp.posts().after( new Date( 1986, 03, 22 ) )...
 *
 * @method after
 * @chainable
 * @param {String|Date} date An ISO 8601-compliant date string, or Date object
 * @return The request instance (for chaining)
 */
parameterMixins.after = function( date ) {
	/* jshint validthis:true */
	return this.param( 'after', new Date( date ).toISOString() );
};

module.exports = parameterMixins;
