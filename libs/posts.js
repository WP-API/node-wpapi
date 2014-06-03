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
	if( this._action === null ) {
		this._id = parseInt( id, 10 );
		this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
	} else if( this._action === 'comments' ) {
		this._actionId = parseInt( id, 10 );
		this._supportedMethods = [ 'head', 'get', 'put', 'post', 'patch', 'delete' ];
	} else if( this._action === 'types' ) {
		this._actionId = id;
		this._supportedMethods = [ 'head', 'get' ];
	}

	return this;
};

posts.prototype.comments = function() {
	this._action = 'comments';
	this._supportedMethods = [ 'head', 'get', 'post' ];
	return this;
};

posts.prototype.types = function() {
	this._action = 'types';
	this._supportedMethods = [ 'head', 'get' ];
	return this;
};

posts.prototype.revisions = function() {
	this._action = 'revisions';
	this._supportedMethods = [ 'head', 'get' ];
	return this;
};

posts.prototype.statuses = function() {
	this._action = 'statuses';
	this._supportedMethods = [ 'head', 'get' ];
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