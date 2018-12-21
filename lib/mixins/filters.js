/**
 * @module mixins/filters
 */
'use strict';

const alphaNumericSort = require( '../util/alphanumeric-sort' );
const keyValToObj = require( '../util/key-val-to-obj' );
const unique = require( '../util/unique' );

/**
 * Filter methods that can be mixed in to a request constructor's prototype to
 * allow that request to take advantage of the `?filter[]=` aliases for WP_Query
 * parameters for collection endpoints, when available.
 *
 * @mixin filters
 */
const filterMixins = {};

// Filter Methods
// ==============

/**
 * Specify key-value pairs by which to filter the API results (commonly used
 * to retrieve only posts meeting certain criteria, such as posts within a
 * particular category or by a particular author).
 *
 * @example
 *
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
 * @returns The request instance (for chaining)
 */
filterMixins.filter = function( props, value ) {
	if ( ! props || typeof props === 'string' && value === undefined ) {
		// We have no filter to set, or no value to set for that filter
		return this;
	}

	// convert the property name string `props` and value `value` into an object
	if ( typeof props === 'string' ) {
		props = keyValToObj( props, value );
	}

	this._filters = {
		...this._filters,
		...props,
	};

	return this;
};

/**
 * Restrict the query results to posts matching one or more taxonomy terms.
 *
 * @method taxonomy
 * @chainable
 * @param {String} taxonomy The name of the taxonomy to filter by
 * @param {String|Number|Array} term A string or integer, or array thereof, representing terms
 * @returns The request instance (for chaining)
 */
filterMixins.taxonomy = function( taxonomy, term ) {
	const termIsArray = Array.isArray( term );

	const termIsNumber = termIsArray ?
		term.reduce(
			( allAreNumbers, term ) => allAreNumbers && typeof term === 'number',
			true
		) :
		typeof term === 'number';

	const termIsString = termIsArray ?
		term.reduce(
			( allAreStrings, term ) => allAreStrings && typeof term === 'string',
			true
		) :
		typeof term === 'string';

	if ( ! termIsString && ! termIsNumber ) {
		throw new Error( 'term must be a number, string, or array of numbers or strings' );
	}

	if ( taxonomy === 'category' ) {
		if ( termIsString ) {
			// Query param for filtering by category slug is "category_name"
			taxonomy = 'category_name';
		} else {
			// The boolean check above ensures that if taxonomy === 'category' and
			// term is not a string, then term must be a number and therefore an ID:
			// Query param for filtering by category ID is "cat"
			taxonomy = 'cat';
		}
	} else if ( taxonomy === 'post_tag' ) {
		// tag is used in place of post_tag in the public query variables
		taxonomy = 'tag';
	}

	// Ensure the taxonomy filters object is available
	this._taxonomyFilters = this._taxonomyFilters || {};

	// Ensure there's an array of terms available for this taxonomy
	const taxonomyTerms = ( this._taxonomyFilters[ taxonomy ] || [] )
		// Insert the provided terms into the specified taxonomy's terms array
		.concat( term )
		// Sort array
		.sort( alphaNumericSort );

	// De-dupe
	this._taxonomyFilters[ taxonomy ] = unique( taxonomyTerms, true );

	return this;
};

/**
 * Query for posts published in a given year.
 *
 * @method year
 * @chainable
 * @param {Number} year integer representation of year requested
 * @returns The request instance (for chaining)
 */
filterMixins.year = function( year ) {
	return filterMixins.filter.call( this, 'year', year );
};

/**
 * Query for posts published in a given month, either by providing the number
 * of the requested month (e.g. 3), or the month's name as a string (e.g. "March")
 *
 * @method month
 * @chainable
 * @param {Number|String} month Integer for month (1) or month string ("January")
 * @returns The request instance (for chaining)
 */
filterMixins.month = function( month ) {
	let monthDate;
	if ( typeof month === 'string' ) {
		// Append a arbitrary day and year to the month to parse the string into a Date
		monthDate = new Date( Date.parse( month + ' 1, 2012' ) );

		// If the generated Date is NaN, then the passed string is not a valid month
		if ( isNaN( monthDate ) ) {
			return this;
		}

		// JS Dates are 0 indexed, but the WP API requires a 1-indexed integer
		month = monthDate.getMonth() + 1;
	}

	// If month is a Number, add the monthnum filter to the request
	if ( typeof month === 'number' ) {
		return filterMixins.filter.call( this, 'monthnum', month );
	}

	return this;
};

/**
 * Add the day filter into the request to retrieve posts for a given day
 *
 * @method day
 * @chainable
 * @param {Number} day Integer representation of the day requested
 * @returns The request instance (for chaining)
 */
filterMixins.day = function( day ) {
	return filterMixins.filter.call( this, 'day', day );
};

/**
 * Specify that we are requesting a page by its path (specific to Page resources)
 *
 * @method path
 * @chainable
 * @param {String} path The root-relative URL path for a page
 * @returns The request instance (for chaining)
 */
filterMixins.path = function( path ) {
	return filterMixins.filter.call( this, 'pagename', path );
};

module.exports = filterMixins;
