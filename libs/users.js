const wpQuery = require( './wpQuery' );
const util = require( 'util' );

module.exports = users;
util.inherits( users, wpQuery );

function users( options ) {
	this._options = options || {};
	this._id = null;
	this._supportedMethods = [ 'head', 'get', 'post' ];
}

users.prototype.me = function() {
	this._id = 'me';
	this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
	return this;
};

users.prototype.id = function( id ) {
	this._id = parseInt( id, 10 );
	this._supportedMethods = [ 'head', 'get', 'post' ];

	return this;
};

users.prototype.generateRequestUri = function () {
	var path = [ this._options.host, this._options.basePath, 'users' ];
	if( this._id !== null ) {
		path.push( this._id );
	}

	return path.join( '/' ).replace( '//', '/' );
};