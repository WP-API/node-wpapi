/*jshint -W106 */// Disable underscore_case warnings in this file b/c WP uses them
/**
 * @module WP
 * @submodule Filters
 * @beta
 */
const _ = require( 'lodash' );
const extend = require( 'node.extend' );
const url = require( 'url' );

function _prepareTaxFilters() {
	return _.reduce( this.taxonomyFilters, function( result, terms, key ) {
		// Trim whitespace and concatenate multiple terms with +
		result[ key ] = terms.map(function( term ) {
			return term.trim();
		}).join( '+' );
		return result;
	}, {});
}

function _prepareFilters( filters ) {
	return _.reduce( filters, function( result, value, key ) {
		key = 'filter[' + key + ']';
		result[ key ] = value;
		return result;
	}, {});
}

function generateQueryString( queryParams ) {
	var queryString = url.format({
		query: queryParams
	});

	return queryString;
}

function _queryStr() {
	var taxonomies = _prepareTaxFilters.bind( this )();
	var query = extend( {}, this._filters, taxonomies );
	return generateQueryString( _prepareFilters( query ) );
}

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
function filter( props, value ) {
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
}

/**
 * @method addTaxonomy
 * @param {String} taxonomy The name of the taxonomy to filter by
 * @param {String|Number|Array} term A string|integer, or array thereof, representing terms
 * @chainable
 * @return this The endpoint request object (for chaining)
 */
function addTaxonomy( taxonomy, term ) {
	var termIsArray = _.isArray( term );
	var termIsNumber = termIsArray ? _.isNumber( term[ 0 ] ) : _.isNumber( term );
	var termIsString = termIsArray ? _.isString( term[ 0 ] ) : _.isString( term );

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
	this._taxonomyFilters[ taxonomy ] = this._taxonomyFilters[ taxonomy ] || [];

	// Insert the provided terms into the specified taxonomy's terms array
	if ( termIsArray ) {
		this._taxonomyFilters[ taxonomy ] = this._taxonomyFilters[ taxonomy ].concat( term );
	} else {
		this._taxonomyFilters[ taxonomy ].push( term );
	}

	// De-dupe and sort
	this._taxonomyFilters = _.unique( this._taxonomyFilters.sort(), true );

	return this;
}

function addCategory( category ) {
	return addTaxonomy( 'category', category ).bind( this );
}

function addTag( tag ) {
	return addTaxonomy( 'tag', tag ).bind( this );
}

function setSearchTerm( searchStr ) {
	this._filters.s = searchStr;
	return this;
}

function setName( slug ) {
	this._filters.name = slug;
	return this;
}

module.exports = {
	mixins: {
		_queryStr: _queryStr,
		filter: filter,
		search: setSearchTerm,
		taxonomy: addTaxonomy,
		category: addCategory,
		tag: addTag,
		name: setName,
		slug: setName
	}
};

// TODO for Office Hours tonight
