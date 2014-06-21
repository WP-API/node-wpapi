/*jshint -W079 */// Suppress warning about redefiniton of `Promise`
const Promise = require( 'bluebird' );
// Set up superagent to be callable in the promise style
const request = require( 'superagent' );

// Constructor

function wpQuery( options ) {
	this._options = options || {};
	this._filters = {};
	this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
}

// Helpers

function ensureFunction( fn ) {
	return ( typeof fn === 'function' ) ? fn : function() {};
}

function invokeAndReturnPromise( req, callback ) {
	callback = ensureFunction( callback );

	// Return a promise, to enable chaining if so desired
	return new Promise(function( resolve, reject ) {
		req.end(function( err, result ) {
			// Invoke the callback if provided, to conform to standard Node pattern
			callback( err, result );

			// Resolve the returned promise
			if ( err ) {
				reject( err );
			} else if ( result.error ) {
				reject( result.error );
			} else {
				resolve( result );
			}
		});
	});
}

// Prototype Methods

wpQuery.prototype.filter = function( obj ) {
	this._filters = obj;
	return this;
};

wpQuery.prototype._isSupportedMethod = function( method ) {
	if ( this._supportedMethods.indexOf( method ) === -1 ) {
		throw new Error(
			'Unsupported method; supported methods are: ' +
			this._supportedMethods.join( ', ' )
		);
	}

	return true;
};

// Overridden in individual endpoint files
wpQuery.prototype.generateRequestUri = function() {
	return this._options.endpoint;
};

wpQuery.prototype.get = function( callback ) {
	this._isSupportedMethod( 'get' );
	var url = this.generateRequestUri();

	return invokeAndReturnPromise( request.get( url ), callback );
};

wpQuery.prototype.post = function( data, callback ) {
	this._isSupportedMethod( 'post' );
	var url = this.generateRequestUri();
	var auth = this._options.username + ':' + this._options.password;
	callback = ensureFunction( callback );
	data = data || {};

	return request.post( url )
		.set( 'Authorization', auth )
		.send( data ).end(function( err, result ) {
			callback( err, result.body );
		});
};

wpQuery.prototype.put = function( data, callback ) {
	this._isSupportedMethod( 'put' );
	var url = this.generateRequestUri();
	var auth = this._options.username + ':' + this._options.password;
	callback = ensureFunction( callback );
	data = data || {};

	return request.put( url )
		.set( 'Authorization', auth )
		.send( data ).end(function( err, result ) {
			callback( err, result.body );
		});
};

wpQuery.prototype.patch = function( callback ) {
	this._isSupportedMethod( 'patch' );
	// var url = this.generateRequestUri();
	callback = ensureFunction( callback );
	// todo: no idea what this method is supposed to do but it's documented in the WP-API docs.
};

// Cannot use `delete`: reserved word
wpQuery.prototype.remove = function( callback ) {
	this._isSupportedMethod( 'delete' );
	var url = this.generateRequestUri();
	var auth = this._options.username + ':' + this._options.password;
	callback = ensureFunction( callback );

	return request.del( url )
		.set( 'Authorization', auth )
		.end(function( err, result ) {
			callback( err, result.body );
		});
};

wpQuery.prototype.head = function( callback ) {
	this._isSupportedMethod( 'head' );
	var url = this.generateRequestUri();
	callback = ensureFunction( callback );

	return request.head( url )
		.end(function( err, result ) {
			callback( err, result.headers );
		});
};

// Calling .then on a query chain will invoke it as a GET and return a promise
wpQuery.prototype.then = function( callback ) {
	this._isSupportedMethod( 'get' );
	var url = this.generateRequestUri();

	return invokeAndReturnPromise( request.get( url ), callback );
};

module.exports = wpQuery;
