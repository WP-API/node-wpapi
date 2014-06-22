const WPRequest = require( './WPRequest' );
const util = require( 'util' );

/**
 * @class TaxonomiesRequest
 * @constructor
 * @extends WPRequest
 */
function TaxonomiesRequest( options ) {
	this._options = options || {};
	this._id = null;
	this._supportedMethods = [ 'head', 'get' ];
	this._action = null;
	this._actionId = null;
}

util.inherits( TaxonomiesRequest, WPRequest );

/**
 * @method id
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
 * @method terms
 * @return {TaxonomiesRequest} The TaxonomiesRequest instance (for chaining)
 */
TaxonomiesRequest.prototype.terms = function() {
	this._action = 'terms';
	this._supportedMethods = [ 'head', 'get', 'post' ];

	return this;
};

/**
 * @method generateRequestUri
 * @return {TaxonomiesRequest} The TaxonomiesRequest instance (for chaining)
 */
TaxonomiesRequest.prototype.generateRequestUri = function() {
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

	return this._options.endpoint.replace( /\/?$/, '/' ) + path.join( '/' );
};

module.exports = TaxonomiesRequest;
