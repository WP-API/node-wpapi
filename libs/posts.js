var wpQuery = require( './wpQuery' );
var util = require( 'util' );

module.exports = posts;
util.inherits( posts, wpQuery );

function posts( options ) {
	this._options = options || {};
	this._id = null;
	this._supportedMethods = [ 'head', 'get', 'post' ];
	this._action = null;
	this._actionId = null;
}

posts.prototype.id = function( id ) {
	this._id = parseInt( id, 10 );
	return this;
};

posts.prototype.generateRequestUri = function () {
	var path = [ this._options.host, this._options.basePath, 'posts' ];
	if( this._id !== null ) {
		path.push( this._id );
	}
	if( this._action !== null ) {
		path.push( this._action );
	}
	if( this._actionId !== null ) {
		path.push( this._actionId );
	}

	return path.join( '/' ).replace( '//', '/' );
};