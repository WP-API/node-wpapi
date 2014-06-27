'use strict';
/**
 * @module WP
 * @submodule TaxonomiesRequest
 * @beta
 */
var WPRequest = require( './WPRequest' );
var util = require( 'util' );

/**
 * TaxonomiesRequest extends WPRequest to handle the /taxonomies API endpoint
 *
 * @class TaxonomiesRequest
 * @constructor
 * @extends WPRequest
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
	 * @property _supportedMethods
	 * @type Array
	 * @private
	 * @default [ 'head', 'get' ]
	 */
	this._supportedMethods = [ 'head', 'get' ];

	/**
	 * A hash of values to assemble into the API request path
	 *
	 * @property _path.values
	 * @type Object
	 * @private
	 * @default {}
	 */
	this._path.values = {};
}

// TaxonomiesRequest extends WPRequest
util.inherits( TaxonomiesRequest, WPRequest );

/**
 * Container object for path options and configuration
 *
 * @property _path
 * @type Object
 * @private
 * @default {}
 */
TaxonomiesRequest.prototype._path = {

	/**
	 * The URL template that will be used to assemble taxonomy request URI paths
	 *
	 * @property _path.template
	 * @type String
	 * @private
	 * @default 'taxonomies(/:taxonomy)(/:action)(/:term)'
	 */
	template: 'taxonomies(/:taxonomy)(/:action)(/:term)',

	/**
	 * A hash of path keys to regex validators for those path elements
	 *
	 * @property _path.validators
	 * @type Object
	 * @private
	 */
	validators: {

		/**
		 * The only "action" permitted on a taxonomy is to get a list of terms
		 *
		 * @property _path.validators.action
		 * @type {RegExp}
		 */
		action: /terms/

		// No validation on :taxonomy or :term: they can be numeric or a string
	}
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
	this._path.values.taxonomy = taxonomyName;

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
	this._path.values.action = 'terms';
	this._path.values.term = term;

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
	this._path.values.action = 'terms';

	return this;
};

module.exports = TaxonomiesRequest;
