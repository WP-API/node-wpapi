var http = require( 'http' );

module.exports = Remote;

function Remote( options ) {
	options = options || {};
	return new RemoteRequest( options );
}

function RemoteRequest( options ) {
	this._options = options || {};
}

RemoteRequest.prototype.getApiUrl = function( host, callback ) {
	if( typeof callback !== 'function' ) {
		return;
	}

	var options = {
		method: 'head',
		host: host,
		port: 80,
		path: '/'
	};
	var request = http.request( options, function( response ) {
		var link = response.headers.link || false;
		if( link !== false ) {
			var matches = link.match( /\<(.*)\>/g );
			if( matches.length > 0 ) {
				link = matches[ 0 ].replace( '<', '' ).replace( '>', '' );
			}
		}
		callback( link );
		response.destroy();
	} );
	request.end();
};

RemoteRequest.prototype.fetch = function( url, method, params ) {
	var methods = [ 'post', 'get', 'delete', 'put', 'head' ];
	//
};