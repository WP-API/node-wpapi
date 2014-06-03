var http = require( 'http' );
var wpQuery = require( './libs/wpQuery.js' );

module.exports = wp;

function wp( options ) {
	return new wp.fn.init( options );
}

/** SETUP FUNCTIONS **/

wp.fn = wp.prototype = {

	/** INTERNAL PROPS **/

	_options : {},
	_namespace : null,
	_namespaceID: null,
	_action : null,
	_actionID: null,
	_methods : null,
	_username : '',
	_password : '',

	/** INTERNAL METHODS **/

	init: function( options ) {
		this._options = options || {};
		return this;
	},
	getPath: function() {
		var path = [];
		path.push( this._options.path || 'wp-json' );
		if( this._namespace ) {
			path.push( this._namespace );
		}
		if( this._namespaceID ) {
			path.push( this._namespaceID );
		}
		if( this._action ) {
			path.push( this._action );
		}
		if( this._actionID ) {
			path.push( this._actionID );
		}

		return '/' + path.join( '/' );
	},
	getDefaultRequestOptions: function() {
		var options = {
			host: ( this._options.host || '' ),
			path: this.getPath(),
			port: ( this._options.port || 80 ),
			headers: {
				'Content-type' : 'application/json',
				'Authorization' : new Buffer( 'Basic ' + this._username + ':' + this._password ).toString( 'base64' )
			}
		};

		console.log( options.path );

		return options;
	},
	getResponseData : function( response, callback ) {
		var data = '';
		callback = ( typeof callback === 'function' ) ? callback : ( function() {} );
		response.on( 'data', function( chunk ) {
			data += chunk;
		} );
		response.on( 'end', function() {
			try {
				data = JSON.parse( data );
			} catch( e ) {}
			callback( data );
		} );
		response.on( 'error', function() {
			callback.call( this, arguments );
		} );
	},

	/** API METHODS **/

	posts: function() {
		this._namespace = 'posts';
		this._methods = [ 'head', 'get', 'post' ];
		return this;
	},
	id: function( id ) {
		if( this._namespace === null && this._action === null ) {
			return this;
		}
		if( this._namespace !== null && this._action === null ) {
			this._namespaceID = id;
			if( this._namespace === 'posts' ) {
				this._methods = [ 'head', 'get', 'post', 'put', 'patch', 'delete' ];
			} else if( this._namespace === 'taxonomies' ) {
				this._methods = [ 'head', 'get', 'post', 'put', 'patch', 'delete' ];
			} else if( this._namespace === 'users' ) {
				this._methods = [ 'head', 'get', 'post' ];
			}
		} else if( this._namespace !== null && this._action !== null ) {
			this._actionID = id;
			if( this._namespace === 'posts' && this._action === 'comments' ) {
				this._methods = [ 'head', 'get', 'post', 'put', 'patch', 'delete' ];
			} else if( this._namespace === 'posts' && this._action === '' ) {
				this._methods = [ 'head', 'get' ];
			} else if( this._namespace === 'taxonomies' && this._action === 'terms' ) {
				this._methods = [ 'head', 'get', 'post', 'put', 'patch', 'delete' ];
			}
		}
		return this;
	},
	statuses: function() {
		this._action = 'statuses';
		this._methods = [ 'head', 'get' ];
		return this;
	},
	revisions: function() {
		this._action = 'revisions';
		this._methods = [ 'head', 'get' ];
		return this;
	},
	comments: function() {
		this._action = 'comments';
		this._methods = [ 'head', 'get', 'post' ];
		return this;
	},
	types: function() {
		this._action = 'types';
		this._methods = [ 'head', 'get' ];
		return this;
	},
	taxonomies: function() {
		this._namespace = 'taxonomies';
		this._methods = [ 'head', 'get' ];
		return this;
	},
	terms: function() {
		this._action = 'terms';
		this._methods = [ 'head', 'get', 'post' ];
		return this;
	},
	users: function() {
		this._namespace = 'users';
		this._methods = [ 'head', 'get', 'post' ];
		return this;
	},
	me: function() {
		this._action = 'me';
		this._methods = [ 'head', 'get', 'post', 'put', 'patch', 'delete' ];
		return this;
	},
	username: function( username ) {
		this._username = username;
		return this;
	},
	password: function( password ) {
		this._password = password;
		return this;
	},

	/** REMOTE FUNCTIONS **/

	get: function( callback ) {
		callback = ( typeof callback === 'function' ) ? callback : ( function() {} );
		if( this._methods.indexOf( 'get' ) < 0 ) {
			throw new Error( 'Unsupported method; supported methods are: ' + this._methods.join( ', ' ) );
			return;
		}

		var options = this.getDefaultRequestOptions();
		options.method = 'get';

		var request = http.request( options, function( response ) {
			this.getResponseData( response, callback );
		}.bind( this ) );
		request.end();
	},
	post: function( data, callback ) {
		data = data || {};
		callback = ( typeof callback === 'function' ) ? callback : ( function() {} );
		if( this._methods.indexOf( 'post' ) < 0 ) {
			throw new Error( 'Unsupported method; supported methods are: ' + this._methods.join( ', ' ) );
			return;
		}

		data = JSON.stringify( data );

		var options = this.getDefaultRequestOptions();
		options.method = 'post';
		options.headers[ 'Content-length' ] = data.length;

		var request = http.request( options, function( response ) {
			this.getResponseData( response, callback );
		}.bind( this ) );
		request.write( data );
		request.end();
	},
	delete: function( callback ) {
		callback = ( typeof callback === 'function' ) ? callback : ( function() {} );
		if( this._methods.indexOf( 'delete' ) < 0 ) {
			throw new Error( 'Unsupported method; supported methods are: ' + this._methods.join( ', ' ) );
			return;
		}

		var options = this.getDefaultRequestOptions();
		options.method = 'delete';

		var request = http.request( options, function( response ) {
			this.getResponseData( response, callback );
		}.bind( this ) );
		request.end();
	},
	put: function( data, callback ) {
		callback = ( typeof callback === 'function' ) ? callback : ( function() {} );
		data = data || {};
		if( this._methods.indexOf( 'post' ) < 0 ) {
			throw new Error( 'Unsupported method; supported methods are: ' + this._methods.join( ', ' ) );
			return;
		}

		data = JSON.stringify( data );

		var options = this.getDefaultRequestOptions();
		options.method = 'put';
		options.headers[ 'Content-length' ] = data.length;

		var request = http.request( options, function( response ) {
			this.getResponseData( response, callback );
		}.bind( this ) );
		request.end();
	},
	patch: function( callback ) {
		callback = ( typeof callback === 'function' ) ? callback : ( function() {} );
		if( this._methods.indexOf( 'patch' ) < 0 ) {
			throw new Error( 'Unsupported method; supported methods are: ' + this._methods.join( ', ' ) );
			return;
		}

		// todo: implement the "patch" method
	},
	head: function( callback ) {
		callback = ( typeof callback === 'function' ) ? callback : ( function() {} );
		if( this._methods.indexOf( 'head' ) < 0 ) {
			throw new Error( 'Unsupported method; supported methods are: ' + this._methods.join( ', ' ) );
			return;
		}

		var options = this.getDefaultRequestOptions();
		options.method = 'head';

		var request = http.request( options, function( response ) {
			callback( response.headers );
			response.destroy();
		} );
		request.end();	
	}
};

wp.fn.init.prototype = wp.prototype;