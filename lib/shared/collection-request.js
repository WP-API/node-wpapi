'use strict';
/*jshint -W106 */// Disable underscore_case warnings in this file b/c WP uses them
/**
 * @module WP
 * @submodule CollectionRequest
 * @beta
 */
var WPRequest = require( './wp-request' );
var _ = require( 'lodash' );
var extend = require( 'node.extend' );
var inherit = require( 'util' ).inherits;

var alphaNumericSort = require( './alphanumeric-sort' );

/**
 * CollectionRequest extends WPRequest with properties & methods for filtering collections
 * via query parameters. It is the base constructor for most top-level WP instance methods.
 *
 * @class CollectionRequest
 * @constructor
 * @extends WPRequest
 * @extensionfor PagesRequest
 * @extensionfor PostsRequest
 * @extensionfor TaxonomiesRequest
 * @extensionfor TypesRequest
 * @extensionfor UsersRequest
 * @param {Object} options A hash of options for the CollectionRequest instance
 * @param {String} options.endpoint The endpoint URI for the invoking WP instance
 * @param {String} [options.username] A username for authenticating API requests
 * @param {String} [options.password] A password for authenticating API requests
 */
function CollectionRequest( options ) {
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
	 * This is used to store the query values for Type, Page & Context
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
	 * @default ''
	 */
	this._template = '';

	/**
	 * An array of supported methods; to be overridden by descendent constructors
	 * @property _supportedMethods
	 * @type Array
	 * @private
	 * @default [ 'head', 'get', 'put', 'post', 'delete' ]
	 */
	this._supportedMethods = [ 'head', 'get', 'put', 'post', 'delete' ];
}

inherit( CollectionRequest, WPRequest );

// Private helper methods
// ======================

/**
 * Utility function for sorting arrays of numbers or strings.
 *
 * @param {String|Number} a The first comparator operand
 * @param {String|Number} a The second comparator operand
 * @return -1 if the values are backwards, 1 if they're ordered, and 0 if they're the same
 */
function alphaNumericSort( a, b ) {
	if ( a > b ) {
		return 1;
	}
	if ( a < b ) {
		return -1;
	}
	return 0;
}

// Prototype Methods
// =================

/**
 * Set the pagination of a request. Use in conjunction with `.perPage()` for explicit
 * pagination handling. (The number of pages in a response can be retrieved from the
 * response's `_paging.totalPages` property.)
 *
 * @method page
 * @chainable
 * @param {Number} pageNumber The page number of results to retrieve
 * @return {CollectionRequest} The CollectionRequest instance (for chaining)
 */
CollectionRequest.prototype.page = function( pageNumber ) {
	return this.param( 'page', pageNumber );
};

/**
 * Set the number of items to be returned in a page of responses.
 *
 * @method perPage
 * @chainable
 * @param {Number} itemsPerPage The number of items to return in one page of results
 * @return {CollectionRequest} The CollectionRequest instance (for chaining)
 */
CollectionRequest.prototype.perPage = function( itemsPerPage ) {
	return this.param( 'per_page', itemsPerPage );
};

/**
 * Specify key-value pairs by which to filter the API results (commonly used
 * to retrieve only posts meeting certain criteria, such as posts within a
 * particular category or by a particular author).
 *
 * @example
 *     // Set a single property:
 *     wp.filter( 'post_type', 'cpt_event' )...
 *
 *     // Set multiple properties at once:
 *     wp.filter({
 *         post_status: 'publish',
 *         category_name: 'news'
 *     })...
 *
 *     // Chain calls to .filter():
 *     wp.filter( 'post_status', 'publish' ).filter( 'category_name', 'news' )...
 *
 * @method filter
 * @chainable
 * @param {String|Object} props A filter property name string, or object of name/value pairs
 * @param {String|Number|Array} [value] The value(s) corresponding to the provided filter property
 * @return {CollectionRequest} The CollectionRequest instance (for chaining)
 */
CollectionRequest.prototype.filter = function( props, value ) {
	// convert the property name string `props` and value `value` into an object
	if ( _.isString( props ) && value ) {
		props = _.zipObject([[ props, value ]]);
	}

	this._filters = extend( this._filters, props );

	return this;
};

/**
 * Restrict the query results to posts matching one or more taxonomy terms.
 *
 * @method taxonomy
 * @chainable
 * @param {String} taxonomy The name of the taxonomy to filter by
 * @param {String|Number|Array} term A string or integer, or array thereof, representing terms
 * @return {CollectionRequest} The CollectionRequest instance (for chaining)
 */
CollectionRequest.prototype.taxonomy = function( taxonomy, term ) {
	var termIsArray = _.isArray( term );
	var termIsNumber = termIsArray ? _.isNumber( term[ 0 ] ) : _.isNumber( term );
	var termIsString = termIsArray ? _.isString( term[ 0 ] ) : _.isString( term );
	var taxonomyTerms;

	if ( ! termIsString && ! termIsNumber ) {
		throw new Error( 'term must be a number, string, or array of numbers or strings' );
	}

	if ( taxonomy === 'category' ) {
		if ( termIsString ) {
			// Query param for filtering by category slug is category_name
			taxonomy = 'category_name';
		} else if ( termIsNumber ) {
			// Query param for filtering by category slug is category_name
			taxonomy = 'cat';
		}
	} else if ( taxonomy === 'post_tag' ) {
		// tag is used in place of post_tag in the public query variables
		taxonomy = 'tag';
	}

	// Ensure there's an array of terms available for this taxonomy
	taxonomyTerms = this._taxonomyFilters[ taxonomy ] || [];

	// Insert the provided terms into the specified taxonomy's terms array
	if ( termIsArray ) {
		taxonomyTerms = taxonomyTerms.concat( term );
	} else {
		taxonomyTerms.push( term );
	}

	// Sort array
	taxonomyTerms.sort( alphaNumericSort );

	// De-dupe
	this._taxonomyFilters[ taxonomy ] = _.unique( taxonomyTerms, true );

	return this;
};

/**
 * Convenience wrapper for `.taxonomy( 'category', ... )`.
 *
 * @method category
 * @chainable
 * @param {String|Number|Array} category A string or integer, or array thereof, representing terms
 * @return {CollectionRequest} The CollectionRequest instance (for chaining)
 */
CollectionRequest.prototype.category = function( category ) {
	return this.taxonomy( 'category', category );
};

/**
 * Convenience wrapper for `.taxonomy( 'tag', ... )`.
 *
 * @method tag
 * @chainable
 * @param {String|Number|Array} tag A tag term string or array of tag term strings
 * @return {CollectionRequest} The CollectionRequest instance (for chaining)
 */
CollectionRequest.prototype.tag = function( tag ) {
	return this.taxonomy( 'tag', tag );
};

/**
 * Filter results to those matching the specified search terms.
 *
 * @method search
 * @param {String} searchString A string to search for within post content
 * @return {CollectionRequest} The CollectionRequest instance (for chaining)
 */
CollectionRequest.prototype.search = function( searchString ) {
	return this.param( 'search',  searchString );
};

/**
 * Query for posts by a specific author.
 * This method will replace any previous 'author' query parameters that had been set.
 *
 * @method author
 * @chainable
 * @param {String|Number} author The nicename or ID for a particular author
 * @return {CollectionRequest} The CollectionRequest instance (for chaining)
 */
CollectionRequest.prototype.author = function( author ) {
	if ( _.isString( author ) ) {
		delete this._params.author;
		return this.filter( 'author_name', author );
	}
	if ( _.isNumber( author ) ) {
		delete this._filters.author_name;
		return this.param( 'author', author );
	}
	throw new Error( 'author must be either a nicename string or numeric ID' );
};

/**
 * Query a collection for members with a specific slug.
 *
 * @method slug
 * @chainable
 * @param {String} slug A post slug (slug), e.g. "hello-world"
 * @return {CollectionRequest} The CollectionRequest instance (for chaining)
 */
CollectionRequest.prototype.slug = function( slug ) {
	return this.param( 'slug', slug );
};

/**
 * Alias for .slug()
 *
 * @method name
 * @alias slug
 * @chainable
 * @param {String} slug A post name (slug), e.g. "hello-world"
 * @return {CollectionRequest} The CollectionRequest instance (for chaining)
 */
CollectionRequest.prototype.name = function( slug ) {
	return this.slug( slug );
};

/**
 * Query for posts published in a given year.
 *
 * @method year
 * @chainable
 * @param {Number} year integer representation of year requested
 * @returns {CollectionRequest} The CollectionRequest instance (for chaining)
 */
CollectionRequest.prototype.year = function( year ) {
	return this.filter( 'year', year );
};

/**
 * Query for posts published in a given month, either by providing the number
 * of the requested month (e.g. 3), or the month's name as a string (e.g. "March")
 *
 * @method month
 * @chainable
 * @param {Number|String} month Integer for month (1) or month string ("January")
 * @returns {CollectionRequest} The PostsRequest instance (for chaining)
 */
CollectionRequest.prototype.month = function( month ) {
	var monthDate;
	if ( _.isString( month ) ) {
		// Append a arbitrary day and year to the month to parse the string into a Date
		monthDate = new Date( Date.parse( month + ' 1, 2012' ) );

		// If the generated Date is NaN, then the passed string is not a valid month
		if ( isNaN( monthDate ) ) {
			return this;
		}

		// JS Dates are 0 indexed, but the WP API requires a 1-indexed integer
		return this.filter( 'monthnum', monthDate.getMonth() + 1 );
	}

	// If month is a Number, add the monthnum filter to the request
	if ( _.isNumber( month ) ) {
		return this.filter( 'monthnum', month );
	}

	return this;
};

/**
 * Add the day filter into the request to retrieve posts for a given day
 *
 * @method day
 * @chainable
 * @param {Number} day Integer representation of the day requested
 * @returns {CollectionRequest} The CollectionRequest instance (for chaining)
 */
CollectionRequest.prototype.day = function( day ) {
	return this.filter( 'day', day );
};

module.exports = CollectionRequest;
