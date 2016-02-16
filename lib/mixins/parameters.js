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
var _ = require( 'lodash' );

var parameterMixins = {};

// Needed for .author mixin, as author by ID is a parameter and by Name is a filter
var filter = require( './filters' ).filter;

// Pagination Methods
// ==================

/**
 * Set the pagination of a request. Use in conjunction with `.perPage()` for explicit
 * pagination handling. (The number of pages in a response can be retrieved from the
 * response's `_paging.totalPages` property.)
 *
 * @method page
 * @chainable
 * @param {Number} pageNumber The page number of results to retrieve
 * @return The request instance (for chaining)
 */
parameterMixins.page = function( pageNumber ) {
	/* jshint validthis:true */
	return this.param( 'page', pageNumber );
};

/**
 * Set the number of items to be returned in a page of responses.
 *
 * @method perPage
 * @chainable
 * @param {Number} itemsPerPage The number of items to return in one page of results
 * @return The request instance (for chaining)
 */
parameterMixins.perPage = function( itemsPerPage ) {
	/* jshint validthis:true */
	return this.param( 'per_page', itemsPerPage );
};

// Parameter Methods
// =================

/**
 * Query a collection for members with a specific slug.
 *
 * @method slug
 * @chainable
 * @param {String} slug A post slug (slug), e.g. "hello-world"
 * @return The request instance (for chaining)
 */
parameterMixins.slug = function( slug ) {
	/* jshint validthis:true */
	return this.param( 'slug', slug );
};

/**
 * Alias for .slug()
 *
 * @method name
 * @alias slug
 * @chainable
 * @param {String} slug A post name (slug), e.g. "hello-world"
 * @return The request instance (for chaining)
 */
parameterMixins.name = function( slug ) {
	/* jshint validthis:true */
	return parameterMixins.slug.call( this, slug );
};

/**
 * Filter results to those matching the specified search terms.
 *
 * @method search
 * @chainable
 * @param {String} searchString A string to search for within post content
 * @return The request instance (for chaining)
 */
parameterMixins.search = function( searchString ) {
	/* jshint validthis:true */
	return this.param( 'search',  searchString );
};

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
	if ( typeof author === 'undefined' ) {
		return this;
	}
	if ( _.isString( author ) ) {
		this.param( 'author', null );
		return filter.call( this, 'author_name', author );
	}
	if ( _.isNumber( author ) ) {
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
parameterMixins.forPost = function( postId ) {
	/* jshint validthis:true */
	return this.param( 'post', postId );
};

module.exports = parameterMixins;
