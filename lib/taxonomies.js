/**
 * @module WP
 * @submodule TaxonomiesRequest
 * @beta
 */
const WPRequest = require( './WPRequest' );
const util = require( 'util' );

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
	 * @default {}
	 */
	this._options = options || {};

	/**
	 * The ID for the taxonomy term being requested
	 * @property _id
	 * @type Number
	 * @default null
	 */
	this._id = null;

	/**
	 * @property _supportedMethods
	 * @type Array
	 * @default [ 'head', 'get' ]
	 */
	this._supportedMethods = [ 'head', 'get' ];

	/**
	 * @property _action
	 * @type String
	 * @default null
	 */
	this._action = null;

	/**
	 * @property _actionId
	 * @type String
	 * @default null
	 */
	this._actionId = null;
}

util.inherits( TaxonomiesRequest, WPRequest );

/**
 * Specify the ID for a specific taxonomy term
 * @method id
 * @chainable
 * @param {Number} id The ID of the taxonomy term
 * @return {TaxonomiesRequest} The TaxonomiesRequest instance (for chaining)
 */
TaxonomiesRequest.prototype.id = function( id ) {
	if ( this._action === null ) {
		this._id = id;
		this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
	} else if ( this._action === 'terms' ) {
		this._actionId = id;
		this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
	}

	return this;
};

/**
 * Specify that we are requesting the terms for a taxonomy
 *
 * @method terms
 * @chainable
 * @return {TaxonomiesRequest} The TaxonomiesRequest instance (for chaining)
 */
TaxonomiesRequest.prototype.terms = function() {
	this._action = 'terms';
	this._supportedMethods = [ 'head', 'get', 'post' ];

	return this;
};

/**
 * Parse the request's instance properties into a WordPress API request URI
 *
 * @method _renderURI
 * @return {String} The URI for the HTTP request to the taxonomies endpoint
 */
TaxonomiesRequest.prototype._renderURI = function() {
	var path = [ 'taxonomies' ];

	if ( this._id !== null ) {
		path.push( this._id );
	}

	if ( this._action !== null ) {
		path.push( this._action );
	}

	if ( this._actionId !== null ) {
		path.push( this._actionId );
	}

	return this._options.endpoint + path.join( '/' );
};

module.exports = TaxonomiesRequest;
