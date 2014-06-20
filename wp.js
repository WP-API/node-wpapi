var extend = require( 'node.extend' );

// Valid options:
// - endpoint: URL to root blog endpoint, e.g. "http://my-blog.com/wp-json"
// - username: Username for basic authentication
// - password: Password for basic authentication
function WP( options ) {

	// Enforce `new`
	if ( ! this instanceof WP ) {
		return new WP( options );
	}

	this._options = extend( {}, defaults, options );

	if ( ! this._options.endpoint ) {
		throw new Error( 'options hash must contain an API endpoint URL string' );
	}

	return this;
}

const defaults = {
	username: '',
	password: ''
};

/** SETUP FUNCTIONS **/

WP.prototype.posts = function( options ) {
		var posts = require( './lib/posts' );
		options = options || {};
		options = extend( options, this._options );
		return new posts( options );
};

WP.prototype.taxonomies = function( options ) {
		var taxonomies = require( './lib/taxonomies' );
		options = options || {};
		options = extend( options, this._options );
		return new taxonomies( options );
};

WP.prototype.users = function( options ) {
		var users = require( './lib/users' );
		options = options || {};
		options = extend( options, this._options );
		return new users( options );
};

module.exports = WP;
