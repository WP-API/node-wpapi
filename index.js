var extend = require( 'node.extend' );

module.exports = wp;

function wp( options ) {
	return new wp.fn.init( options );
}

/** SETUP FUNCTIONS **/

wp.fn = wp.prototype = {

	_options: {
		host: '',
		port: 80,
		basePath: '/wp-json',
		username: '',
		password: ''
	},

	init: function( options ) {
		options = options || {};
		this._options = extend( this._options, options );
		return this;
	},

	posts: function( options ) {
		var posts = require( './libs/posts' );
		options = options || {};
		options = extend( options, this._options );
		return new posts( options );
	},

	taxonomies: function( options ) {
		var taxonomies = require( './libs/taxonomies' );
		options = options || {};
		options = extend( options, this._options );
		return new taxonomies( options );
	},

	users: function( options ) {
		var users = require( './libs/users' );
		options = options || {};
		options = extend( options, this._options );
		return new users( options );
	}

	/** API METHODS **/
};

wp.fn.init.prototype = wp.prototype;
