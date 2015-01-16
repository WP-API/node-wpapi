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
var qs = require( 'qs' );

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
 * Process arrays of taxonomy terms into query parameters.
 * All terms listed in the arrays will be required (AND behavior).
 *
 * @example
 *     prepareTaxonomies({
 *         tag: [ 'tag1 ', 'tag2' ], // by term slug
 *         cat: [ 7 ] // by term ID
 *     }) === {
 *         tag: 'tag1+tag2',
 *         cat: '7'
 *     }
 *
 * @param {Object} taxonomyFilters An object of taxonomy term arrays, keyed by taxonomy name
 * @return {Object} An object of prepareFilters-ready query arg and query param value pairs
 */
function prepareTaxonomies( taxonomyFilters ) {
	if ( ! taxonomyFilters ) {
		return [];
	}

	return _.reduce( taxonomyFilters, function( result, terms, key ) {
		// Trim whitespace and concatenate multiple terms with +
		result[ key ] = terms.map(function( term ) {
			// Coerce term into a string so that trim() won't fail
			term = term + '';
			return term.trim().toLowerCase();
		}).join( '+' );
		return result;
	}, {});
}

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
 * Process the endpoint query's filter objects into a valid query string.
 * Nested objects and Array properties are rendered with indexed array syntax.
 *
 * @example
 *     _renderQuery({ p1: 'val1', p2: 'val2' });  // ?p1=val1&p2=val2
 *     _renderQuery({ obj: { prop: 'val' } });    // ?obj[prop]=val
 *     _renderQuery({ arr: [ 'val1', 'val2' ] }); // ?arr[0]=val1&arr[1]=val2
 *
 * @private
 *
 * @method _renderQuery
 * @return {String} A query string representing the specified filter parameters
 */
CollectionRequest.prototype._renderQuery = function() {
	// Build the full query parameters object
	var queryParams = extend( {}, this._params );

	// Prepare the taxonomies and merge with other filter values
	var taxonomies = prepareTaxonomies( this._taxonomyFilters );
	queryParams.filter = extend( {}, this._filters, taxonomies );

	// Parse query parameters object into a query string, sorting the object
	// properties by alphabetical order (consistent property ordering can make
	// for easier caching of request URIs)
	var queryString = qs.stringify( queryParams )
		.split( '&' )
		.sort()
		.join( '&' );

	// Prepend a "?" if a query is present, and return
	return ( queryString === '' ) ? '' : '?' + queryString;
};

/**
 * Set a parameter to render into the final query URI.
 *
 * @method param
 * @chainable
 * @param {String|Object} props The name of the parameter to set, or an object containing
 *                              parameter keys and their corresponding values
 * @param {String|Number|Array} [value] The value of the parameter being set
 * @param {Boolean} [merge] Whether to merge the value (true) or replace it (false, default)
 * @return {CollectionRequest} The CollectionRequest instance (for chaining)
 */
CollectionRequest.prototype.param = function( props, value, merge ) {
	merge = merge || false;

	// We can use the same iterator function below to handle explicit key-value pairs if we
	// convert them into to an object we can iterate over:
	if ( _.isString( props ) && value ) {
		props = _.object([[ props, value ]]);
	}

	// Iterate through the properties
	_.each( props, function( value, key ) {
		var currentVal = this._params[ key ];

		// Simple case: setting for the first time, or not merging
		if ( ! currentVal || ! merge ) {

			// Arrays should be de-duped and sorted
			if ( _.isArray( value ) ) {
				value = _.unique( value ).sort( alphaNumericSort );
			}

			// Set the value
			this._params[ key ] = value;

			// Continue
			return;
		}

		// value and currentVal must both be arrays in order to merge
		if ( ! _.isArray( currentVal ) ) {
			currentVal = [ currentVal ];
		}

		if ( ! _.isArray( value ) ) {
			value = [ value ];
		}

		// Concat the new values onto the old (and sort)
		this._params[ key ] = _.union( currentVal, value ).sort( alphaNumericSort );
	}.bind( this ));

	return this;
};

/**
 * Set the pagination of a request. Use in conjunction with `filter( posts_per_page )` for
 * explicit pagination handling. (The number of pages in a response can be retrieved from
 * the response's `_paging.totalPages` property.)
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
 * Set the context of the request. Used primarily to expose private values on a request
 * object, by setting the context to "edit".
 *
 * @method context
 * @chainable
 * @param {String} context The context to set on the request
 * @return {CollectionRequest} The CollectionRequest instance (for chaining)
 */
CollectionRequest.prototype.context = function( context ) {
	if ( context === 'edit' ) {
		// Force basic authentication for edit context
		this.auth();
	}
	return this.param( 'context', context );
};

/**
 * Convenience wrapper for `.context( 'edit' )`
 *
 * @method edit
 * @chainable
 * @return {CollectionRequest} The CollectionRequest instance (for chaining)
 */
CollectionRequest.prototype.edit = function() {
	return this.context( 'edit' );
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
		props = _.object([[ props, value ]]);
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
	return this.filter( 's',  searchString );
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
		delete this._filters.author;
		return this.filter( 'author_name', author );
	}
	if ( _.isNumber( author ) ) {
		delete this._filters.author_name;
		return this.filter( 'author', author );
	}
	throw new Error( 'author must be either a nicename string or numeric ID' );
};

/**
 * Query a collection of posts for a post with a specific slug.
 *
 * @method name
 * @chainable
 * @param {String} slug A post name (slug), e.g. "hello-world"
 * @return {CollectionRequest} The CollectionRequest instance (for chaining)
 */
CollectionRequest.prototype.name = function( slug ) {
	return this.filter( 'name', slug );
};

/**
 * Alias for `.name()`.
 *
 * @method slug
 * @alias name
 * @chainable
 * @param {String} slug A post slug, e.g. "hello-world"
 * @return {CollectionRequest} The CollectionRequest instance (for chaining)
 */
CollectionRequest.prototype.slug = CollectionRequest.prototype.name;

module.exports = CollectionRequest;
