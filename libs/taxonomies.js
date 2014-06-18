const wpQuery = require( './wpQuery' );
const util = require( 'util' );

util.inherits( taxonomies, wpQuery );

function taxonomies( options ) {
	this._options = options || {};
	this._id = null;
	this._supportedMethods = [ 'head', 'get' ];
	this._action = null;
	this._actionId = null;
}

taxonomies.prototype.id = function( id ) {
	if ( this._action === null ) {
		this._id = id;
		this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
	} else if ( this._action === 'terms' ) {
		this._actionId = id;
		this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
	}

	return this;
};

taxonomies.prototype.terms = function() {
	this._action = 'terms';
	this._supportedMethods = [ 'head', 'get', 'post' ];

	return this;
};

taxonomies.prototype.generateRequestUri = function() {
	var path = [ this._options.host, this._options.basePath, 'taxonomies' ];

	if ( this._id !== null ) {
		path.push( this._id );
	}

	if ( this._action !== null ) {
		path.push( this._action );
	}

	if ( this._actionId !== null ) {
		path.push( this._actionId );
	}

	return path.join( '/' ).replace( '//', '/' );
};

module.exports = taxonomies;
