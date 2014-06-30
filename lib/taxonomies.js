'use strict';
/**
 * @module WP
 * @submodule TaxonomiesRequest
 * @beta
 */
var CollectionRequest = require( './shared/collection-request' );
var inherit = require( 'util' ).inherits;

/**
 * TaxonomiesRequest extends CollectionRequest to handle the /taxonomies API endpoint
 *
 * @class TaxonomiesRequest
 * @constructor
 * @extends CollectionRequest
 * @param {Object} options A hash of options for the TaxonomiesRequest instance
 * @param {String} options.endpoint The endpoint URI for the invoking WP instance
 * @param {String} [options.username] A username for authenticating API requests
 * @param {String} [options.password] A password for authenticating API requests
 */
function TaxonomiesRequest( options ) {
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
	 * A hash of non-filter query parameters
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
	 * @default 'taxonomies(/:taxonomy)(/:action)(/:term)'
	 */
	this._template = 'taxonomies(/:taxonomy)(/:action)(/:term)';

	/**
	 * @property _supportedMethods
	 * @type Array
	 * @private
	 * @default [ 'head', 'get' ]
	 */
	this._supportedMethods = [ 'head', 'get' ];
}

// TaxonomiesRequest extends CollectionRequest
inherit( TaxonomiesRequest, CollectionRequest );

/**
 * A hash of path keys to regex validators for those path elements
 *
 * @property _pathValidators
 * @type Object
 * @private
 */
TaxonomiesRequest.prototype._pathValidators = {

	/**
	 * The only "action" permitted on a taxonomy is to get a list of terms
	 *
	 * @property _pathValidators.action
	 * @type {RegExp}
	 */
	action: /terms/

	// No validation on :taxonomy or :term: they can be numeric or a string
};

/**
 * Specify the name of the taxonomy to query
 *
 * @method taxonomy
 * @chainable
 * @param {String} taxonomyName The name of the taxonomy to query
 * @return {TaxonomiesRequest} The TaxonomiesRequest instance (for chaining)
 */
TaxonomiesRequest.prototype.taxonomy = function( taxonomyName ) {
	this._path.taxonomy = taxonomyName;

	return this;
};

/**
 * Specify a taxonomy term to request
 *
 * @method term
 * @chainable
 * @param {String} term The ID or slug of the term to request
 * @return {TaxonomiesRequest} The TaxonomiesRequest instance (for chaining)
 */
TaxonomiesRequest.prototype.term = function( term ) {
	this._path.action = 'terms';
	this._path.term = term;

	return this;
};

/**
 * Specify that we are requesting a collection of terms for a taxonomy
 *
 * @method terms
 * @chainable
 * @return {TaxonomiesRequest} The TaxonomiesRequest instance (for chaining)
 */
TaxonomiesRequest.prototype.terms = function() {
	this._path.action = 'terms';

	return this;
};

module.exports = TaxonomiesRequest;
