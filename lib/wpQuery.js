/*jshint -W079 */// Suppress warning about redefiniton of `Promise`
const Promise = require( 'bluebird' );
const agent = require( 'superagent' );

/**
 * @class WPQuery
 * @constructor
 */
function WPQuery( options ) {
	this._options = options || {};
	this._filters = {};

	// Individual endpoint handlers specify their own supported methods
	this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
}

// Helpers

/** No-op function for use within ensureFunction() */
function noop() {}

/**
 * If fn is a function return it, else return a no-op function
 *
 * @param {Function|undefined} fn A WPQuery request callback
 * @return {Function} The provided callback function or a no-op
 */
function ensureFunction( fn ) {
	return ( typeof fn === 'function' ) ? fn : noop;
}

/**
 * Submit the provided superagent request object, invoke a callback (if it was
 * provided), and return a promise to the response from the HTTP request.
 *
 * @param {Object} request A superagent request object
 * @param {Function} callback A callback function (optional)
 * @return {Promise} A promise to the superagent request
 */
function invokeAndPromisify( request, callback ) {
	callback = ensureFunction( callback );

	// Return a promise, to enable chaining if so desired
	return new Promise(function( resolve, reject ) {
		request.end(function( err, result ) {

			// Invoke the callback (if provided), to conform to standard Node pattern
			callback( err, result );

			// Resolve the returned promise
			if ( err || result.error ) {
				reject( err || result.error );
			} else {
				resolve( result );
			}
		});
	});
}

// Prototype Methods

/**
 * @method filter
 */
WPQuery.prototype.filter = function( obj ) {
	this._filters = obj;
	return this;
};

/**
 * @method _isSupportedMethod
 * @protected
 */
WPQuery.prototype._isSupportedMethod = function( method ) {
	if ( this._supportedMethods.indexOf( method ) === -1 ) {
		throw new Error(
			'Unsupported method; supported methods are: ' +
			this._supportedMethods.join( ', ' )
		);
	}

	return true;
};

/**
 * Generate the URI for the HTTP request (overridden in the modules for
 * handling individual endpoints)
 *
 * @method generateRequestUri
 * @return {String} The URI target for the HTTP request
 */
WPQuery.prototype.generateRequestUri = function() {
	return this._options.endpoint;
};

/**
 * @method get
 * @return {Promise} A promise to the results of the HTTP request
 */
WPQuery.prototype.get = function( callback ) {
	this._isSupportedMethod( 'get' );
	var url = this.generateRequestUri();

	return invokeAndPromisify( agent.get( url ), function( err, result ) {
		callback( err, result.body );
	});
};

/**
 * @method post
 * @return {Promise} A promise to the results of the HTTP request
 */
WPQuery.prototype.post = function( data, callback ) {
	this._isSupportedMethod( 'post' );
	var url = this.generateRequestUri();
	var auth = this._options.username + ':' + this._options.password;
	data = data || {};

	var request = agent.post( url )
		.set( 'Authorization', auth )
		.send( data );

	return invokeAndPromisify( request, function( err, result ) {
		callback( err, result.body );
	});
};

/**
 * @method put
 * @return {Promise} A promise to the results of the HTTP request
 */
WPQuery.prototype.put = function( data, callback ) {
	this._isSupportedMethod( 'put' );
	var url = this.generateRequestUri();
	var auth = this._options.username + ':' + this._options.password;
	data = data || {};

	var request = agent.put( url )
		.set( 'Authorization', auth )
		.send( data );

	return invokeAndPromisify( request, function( err, result ) {
		callback( err, result.body );
	});
};

/**
 * @method patch
 * @return {Promise} A promise to the results of the HTTP request
 */
WPQuery.prototype.patch = function( callback ) {
	this._isSupportedMethod( 'patch' );
	// var url = this.generateRequestUri();
	callback = ensureFunction( callback );
	// todo: no idea what this method is supposed to do but it's documented in the WP-API docs.
};

// Cannot use `delete`: reserved word
/**
 * @method remove
 * @return {Promise} A promise to the results of the HTTP request
 */
WPQuery.prototype.remove = function( callback ) {
	this._isSupportedMethod( 'delete' );
	var url = this.generateRequestUri();
	var auth = this._options.username + ':' + this._options.password;
	var request = agent.del( url ).set( 'Authorization', auth );

	invokeAndPromisify( request, function( err, result ) {
		callback( err, result.body );
	});
};

/**
 * @method head
 * @return {Promise} A promise to the results of the HTTP request
 */
WPQuery.prototype.head = function( callback ) {
	this._isSupportedMethod( 'head' );
	var url = this.generateRequestUri();

	return invokeAndPromisify( agent.head( url ), function( err, result ) {
		callback( err, result.headers );
	});
};

// Calling .then on a query chain will invoke it as a GET and return a promise
/**
 * @method then
 * @return {Promise} A promise to the results of the HTTP request
 */
WPQuery.prototype.then = function( callback ) {
	this._isSupportedMethod( 'get' );
	var url = this.generateRequestUri();

	return invokeAndPromisify( agent.get( url ) )
		.then( callback );
};

module.exports = WPQuery;
