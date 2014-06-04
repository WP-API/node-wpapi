const request = require( 'superagent' );
module.exports = wpQuery;

function wpQuery( options ) {
	this._options = options || {};
	this._filters = {};
	this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
}

wpQuery.prototype.filter = function( obj ) {
	this._filters = obj;
	return this;
};

wpQuery.prototype._isSupportedMethod = function( method ) {
	if( this._supportedMethods.indexOf( method ) === -1 ) {
		throw new Error( 'Unsupported method; supported methods are: ' + this._supportedMethods.join( ', ' ) );
	}

	return true;
}

wpQuery.prototype.generateRequestUri = function () {
 	return '';
};

wpQuery.prototype.get = function( callback ) {
	this._isSupportedMethod( 'get' );
	var url = this.generateRequestUri();
	callback = ( typeof callback === 'function' ) ? callback : ( function() {} );

	request.get( url ).end( function( err, result ) {
		callback( err, result.body );
	} );
};

wpQuery.prototype.post = function( data, callback ) {
	this._isSupportedMethod( 'post' );
	var url = this.generateRequestUri();
	var auth = this._options.username + ':' + this._options.password;
	callback = ( typeof callback === 'function' ) ? callback : ( function() {} );
	data = data || {};

	request.post( url ).set( 'Authorization', auth ).send( data ).end( function( err, result ) {
		callback( err, result.body );
	} );
};

wpQuery.prototype.put = function( data, callback ) {
	this._isSupportedMethod( 'put' );
	var url = this.generateRequestUri();
	var auth = this._options.username + ':' + this._options.password;
	callback = ( typeof callback === 'function' ) ? callback : ( function() {} );
	data = data || {};

	request.put( url ).set( 'Authorization', auth ).send( data ).end( function( err, result ) {
		callback( err, result.body );
	} );
};

wpQuery.prototype.patch = function( callback ) {
	this._isSupportedMethod( 'patch' );
	var url = this.generateRequestUri();
	callback = ( typeof callback === 'function' ) ? callback : ( function() {} );
	// todo: no idea what this method is supposed to do but it's documented in the WP-API docs.
};

wpQuery.prototype.delete = function( callback ) {
	this._isSupportedMethod( 'delete' );
	var url = this.generateRequestUri();
	var auth = this._options.username + ':' + this._options.password;
	callback = ( typeof callback === 'function' ) ? callback : ( function() {} );

	request.del( url ).set( 'Authorization', auth ).end( function( err, result ) {
		callback( err, result.body );
	} );
};

wpQuery.prototype.head = function( callback ) {
	this._isSupportedMethod( 'head' );
	var url = this.generateRequestUri();
	callback = ( typeof callback === 'function' ) ? callback : ( function() {} );

	request.head( url ).end( function( err, result ) {
		callback( err, result.headers );
	} );
};
