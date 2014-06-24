/*jshint -W106 */// Disable underscore_case warnings in this file b/c WP uses them
/**
 * @module WP
 * @submodule CollectionFilters
 * @beta
 */
const _ = require( 'lodash' );
const extend = require( 'node.extend' );
const url = require( 'url' );

/**
 * Process arrays of taxonomy terms into query parameters
 * All terms listed in the arrays will be required (AND behavior)
 *
 * @example
 *    prepareTaxFilters({
 *        tag: [ 'tag1 ', 'tag2' ], // by term slug
 *        cat: [ 7 ] // by term ID
 *    }) === {
 *        tag: 'tag1+tag2',
 *        cat: '7'
 *    }
 *
 * @private
 *
 * @param {Object} taxonomyFilters An object of taxonomy term arrays, keyed by taxonomy name
 * @return {Object} An object of prepareFilters-ready query arg and query param value pairs
 */
function prepareTaxFilters( taxonomyFilters ) {
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
 * Process an array of filter keys and values into WP-API-ready query parameter syntax
 *
 * @example
 *    prepareFilters({
 *        tag: 'tag1+tag2',
 *        category_name: 'news'
 *    }) === {
 *        'filter[tag]': 'tag1+tag2',
 *        'filter[category_name]': 'news'
 *    }
 *
 * @private
 *
 * @param {Object} filters An object of filter values, keyed by filter parameter name
 * @return {Object} An object of WP-API filter query parameter key-value pairs
 */
function prepareFilters( filters ) {
	return _.reduce( filters, function( result, value, key ) {
		key = 'filter[' + key + ']';
		result[ key ] = value;
		return result;
	}, {});
}

/**
 * Generate a complete query string from the provided array of query parameters
 *
 * @example
 *     generateQueryString({
 *         'filter[tag]': 'tag1',
 *         'filter[post_status': 'publish',
 *         'type': 'cpt_item'
 *     }) === '?filter%5Btag%5D=tag1&filter%5Bpost_status=publish&type=cpt_item'
 *
 * @private
 *
 * @param {Object} queryParams A hash of query parameter keys and values
 * @return {String} A complete, rendered query string
 */
function generateQueryString( queryParams ) {
	// Sort the object properties by alphabetical order
	// (consistent property ordering means easier caching of request URIs)
	var keys = _.keys( queryParams ).sort();
	queryParams = _.pick( queryParams, keys );
	return url.format({
		query: queryParams
	});
}

/**
 * Utility function for sorting arrays of numbers or strings
 *
 * @private
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

/**
 * The Mixins object holds all methods that will be mixed in to module prototypes
 */
var mixins = {};

/**
 * Process the endpoint query's filter objects into a valid query string.
 * (This query string will only be valid for collection endpoints such as /posts)
 *
 * @method _queryStr
 * @return {String} A query string representing the specified filter parameters
 */
mixins._queryStr = function() {
	var taxonomies = prepareTaxFilters( this._taxonomyFilters );
	var query = extend( {}, this._filters, taxonomies );
	return generateQueryString( prepareFilters( query ) );
};

/**
 * Specify key-value pairs by which to filter the API results (commonly used
 * to retrieve only posts meeting certain criteria, such as posts within a
 * particular category or by a particular author)
 *
 * @example
 *     // Set a single property:
 *     wp.filter( 'post_type', 'cpt_event' )...
 *
 *     // Set multiple properties at once:
 *     wp.filter({
 *         post_status: 'publish',
 *         category_name: 'news'
 *     }).//...
 *
 *     // Chain calls to .filter():
 *     wp.filter( 'post_status', 'publish' ).filter( 'category_name', 'news' ).//...
 *
 * @method filter
 * @chainable
 * @param {String|Object} props A filter property name string, or object of name/value pairs
 * @param {String|Number|Array} [value] The value(s) corresponding to the provided filter property
 * @return {WPRequest} The WPRequest instance (for chaining)
 */
mixins.filter = function( props, value ) {
	var prop;
	if ( typeof props === 'string' && value ) {
		// convert the property name string `props` and value `value` into an object
		prop = {};
		prop[ props ] = value;
		this._filters = extend( this._filters, prop );
	} else {
		this._filters = extend( this._filters, props );
	}

	return this;
};

/**
 * Restrict the query results to posts matching one or more taxonomy terms
 *
 * @method taxonomy
 * @chainable
 * @param {String} taxonomy The name of the taxonomy to filter by
 * @param {String|Number|Array} term A string|integer, or array thereof, representing terms
 * @return this The endpoint request object (for chaining)
 */
mixins.taxonomy = function( taxonomy, term ) {
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
 * Convenience wrapper for .taxonomy( 'category', ... )
 *
 * @method category
 * @chainable
 * @param {String|Number|Array} category A string|integer, or array thereof, representing terms
 * @return this The endpoint request object (for chaining)
 */
mixins.category = function( category ) {
	return this.taxonomy( 'category', category );
};

/**
 * Convenience wrapper for .taxonomy( 'tag', ... )
 *
 * @method tag
 * @chainable
 * @param {String|Number|Array} tag A tag term string or array of tag term strings
 * @return this The endpoint request object (for chaining)
 */
mixins.tag = function( tag ) {
	return this.taxonomy( 'tag', tag );
};

/**
 * Filter results to those matching the specified search terms
 *
 * @method search
 * @param {String} searchString A string to search for within post content
 * @return this The endpoint request object (for chaining)
 */
mixins.search = function( searchString ) {
	return this.filter( 's',  searchString );
};

/**
 * Query a collection of posts for a post with a specific slug
 *
 * @method name
 * @chainable
 * @param {String} slug A post name (slug), e.g. "hello-world"
 * @return this The endpoint request object (for chaining)
 */
mixins.name = function( slug ) {
	return this.filter( 'name', slug );
};

/**
 * Alias for .name()
 *
 * @method slug
 * @alias name
 * @param {String} slug A post slug, e.g. "hello-world"
 * @return this The endpoint request object (for chaining)
 */
mixins.slug = mixins.name;

module.exports = {
	mixins: mixins
};
