/**
 * @module WP
 * @submodule WPRequest
 * @beta
 */

/*jshint -W079 */// Suppress warning about redefiniton of `Promise`
const Promise = require( 'bluebird' );
const agent = require( 'superagent' );
const Route = require( 'route-parser' );

/**
 * WPRequest is the base API request object constructor
 *
 * @class WPRequest
 * @constructor
 * @param {Object} options A hash of options for the WPRequest instance
 * @param {String} options.endpoint The endpoint URI for the invoking WP instance
 * @param {String} [options.username] A username for authenticating API requests
 * @param {String} [options.password] A password for authenticating API requests
 */
function WPRequest( options ) {
	/**
	 * Configuration options for the request such as the endpoint for the invoking WP instance
	 *
	 * @property _options
	 * @type Object
	 * @private
	 * @default {}
	 */
	this._options = options || {};

	/**
	 * Methods supported by this API request instance:
	 * Individual endpoint handlers specify their own subset of supported methods
	 *
	 * @property _supportedMethods
	 * @type Array
	 * @private
	 * @default [ 'head', 'get', 'put', 'post', 'patch', 'delete' ]
	 */
	this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
}

// Helpers
// =======

/** No-op function for use within ensureFunction() */
function noop() {}

/** Identity function for use within invokeAndPromisify() */
function identity( value ) {
	return value;
}

/**
 * If fn is a function, return it; else, return a no-op function
 *
 * @param {Function|undefined} fn A WPRequest request callback
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
 * @param {Function} transform A function to transform the result data (optional)
 * @return {Promise} A promise to the superagent request
 */
function invokeAndPromisify( request, callback, transform ) {
	callback = ensureFunction( callback );
	transform = transform || identity;

	return new Promise(function( resolve, reject ) {
		// Fire off the result
		request.end(function( err, result ) {

			// Invoke the callback (if provided), to conform to standard Node pattern
			callback( err, transform( result ) );

			// Return the results as a promise
			if ( err || result.error ) {
				reject( err || result.error );
			} else {
				resolve( transform( result ) );
			}
		});
	});
}

/**
 * Extract and return the body property from a superagent response object
 *
 * @param {Object} result The results from the HTTP request
 * @return {Object} The "body" property of the result
 */
function returnBody( result ) {
	return result.body;
}

/**
 * Extract and return the headers property from a superagent response object
 *
 * @param {Object} result The results from the HTTP request
 * @return {Object} The "headers" property of the result
 */
function returnHeaders( result ) {
	return result.headers;
}

/**
 * Check path parameter values against validation regular expressions
 *
 * @param {Object} pathValues A hash of path placeholder keys and their corresponding values
 * @param {Object} validators A hash of placeholder keys to validation regexes
 * @return {Object} Returns pathValues if all validation passes (else will throw)
 */
function validatePath( pathValues, validators ) {
	for ( var param in pathValues ) {
		if ( ! pathValues.hasOwnProperty( param ) ) {
			continue;
		}

		// No validator, no problem
		if ( ! validators[ param ] ) {
			continue;
		}

		// Convert parameter to a string value and check it against the regex
		if ( ! ( pathValues[ param ] + '' ).match( validators[ param ] ) ) {
			throw new Error( param + ' does not match ' + validators[ param ] );
		}
	}

	// If validation passed, return the pathValues object
	return pathValues;
}

// Prototype Properties
// ====================

/**
 * Container object for endpoint handler path options and configuration
 *
 * @property _path
 * @type Object
 * @protected
 * @default { template: '' }
 */
WPRequest.prototype._path = {

	/**
	 * The URL template that will be used to assemble endpoint paths
	 *
	 * @property _path.template
	 * @type String
	 * @protected
	 * @default ''
	 */
	template: ''
};

// Prototype Methods
// =================

/**
 * Verify that the current request object supports a given HTTP verb
 *
 * @private
 *
 * @method _checkMethodSupport
 * @param {String} method An HTTP method to check ('get', 'post', etc)
 * @return true iff the method is within this._supportedMethods
 */
WPRequest.prototype._checkMethodSupport = function( method ) {
	if ( this._supportedMethods.indexOf( method.toLowerCase() ) === -1 ) {
		throw new Error(
			'Unsupported method; supported methods are: ' +
			this._supportedMethods.join( ', ' )
		);
	}

	return true;
};

/**
 * Validate & assemble a path string from the request object's _path.values
 *
 * @private
 *
 * @method _renderPath
 * @return {String} The rendered path
 */
WPRequest.prototype._renderPath = function() {
	var path = new Route( this._path.template );
	var pathValues = validatePath( this._path.values, this._path.validators );

	return path.reverse( pathValues ) || '';
};

/**
 * Parse the request's instance properties into a WordPress API request URI
 *
 * @private
 *
 * @method _renderURI
 * @return {String} The URI for the HTTP request to be sent
 */
WPRequest.prototype._renderURI = function() {
	// Render the path to a string
	var path = this._renderPath();

	// If the current request supports filters, render them to a query string
	var queryStr = this._renderQuery ? this._renderQuery() : '';

	return this._options.endpoint + path + queryStr;
};

// HTTP Methods
// ============

/**
 * @method get
 * @async
 * @param {Function} [callback] A callback to invoke with the results of the GET request
 * @param {Error|Object} callback.err Any errors encountered during the request
 * @param {Object} callback.result The body of the server response
 * @return {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype.get = function( callback ) {
	this._checkMethodSupport( 'get' );
	var url = this._renderURI();

	return invokeAndPromisify( agent.get( url ), callback, returnBody );
};

/**
 * @method post
 * @async
 * @param {Object} data The data for the POST request
 * @param {Function} [callback] A callback to invoke with the results of the POST request
 * @param {Error|Object} callback.err Any errors encountered during the request
 * @param {Object} callback.result The body of the server response
 * @return {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype.post = function( data, callback ) {
	this._checkMethodSupport( 'post' );
	var url = this._renderURI();
	var auth = this._options.username + ':' + this._options.password;
	data = data || {};

	var request = agent.post( url )
		.set( 'Authorization', auth )
		.send( data );

	return invokeAndPromisify( request, callback, returnBody );
};

/**
 * @method put
 * @async
 * @param {Object} data The data for the PUT request
 * @param {Function} [callback] A callback to invoke with the results of the PUT request
 * @param {Error|Object} callback.err Any errors encountered during the request
 * @param {Object} callback.result The body of the server response
 * @return {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype.put = function( data, callback ) {
	this._checkMethodSupport( 'put' );
	var url = this._renderURI();
	var auth = this._options.username + ':' + this._options.password;
	data = data || {};

	var request = agent.put( url )
		.set( 'Authorization', auth )
		.send( data );

	return invokeAndPromisify( request, callback, returnBody );
};

/**
 * @method patch
 * @async
 * @param {Function} [callback] A callback to invoke with the results of the PATCH request
 * @param {Error|Object} callback.err Any errors encountered during the request
 * @param {Object} callback.result The body of the server response
 * @return {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype.patch = function( callback ) {
	this._checkMethodSupport( 'patch' );
	// var url = this._renderURI();
	callback = ensureFunction( callback );
	// todo: no idea what this method is supposed to do but it's documented in the WP-API docs.
};

/**
 * @method delete
 * @async
 * @param {Function} [callback] A callback to invoke with the results of the DELETE request
 * @param {Error|Object} callback.err Any errors encountered during the request
 * @param {Object} callback.result The body of the server response
 * @return {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype.delete = function( callback ) {
	this._checkMethodSupport( 'delete' );
	var url = this._renderURI();
	var auth = this._options.username + ':' + this._options.password;
	var request = agent.del( url ).set( 'Authorization', auth );

	return invokeAndPromisify( request, callback, returnBody );
};

/**
 * @method head
 * @async
 * @param {Function} [callback] A callback to invoke with the results of the HEAD request
 * @param {Error|Object} callback.err Any errors encountered during the request
 * @param {Object} callback.result The headers from the server response
 * @return {Promise} A promise to the header results of the HTTP request
 */
WPRequest.prototype.head = function( callback ) {
	this._checkMethodSupport( 'head' );
	var url = this._renderURI();

	return invokeAndPromisify( agent.head( url ), callback, returnHeaders );
};

/**
 * Calling .then on a query chain will invoke the query as a GET and return a promise
 *
 * @method then
 * @async
 * @param {Function} [successCallback] A callback to handle the data returned from the GET request
 * @param {Function} [failureCallback] A callback to handle any errors encountered by the request
 * @return {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype.then = function( successCallback, failureCallback ) {
	return this.get().then( successCallback, failureCallback );
};

module.exports = WPRequest;
