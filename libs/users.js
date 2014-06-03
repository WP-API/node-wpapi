var wpQuery = require( './wpQuery' );
var util = require( 'util' );

module.exports = users;
util.inherits( users, wpQuery );

function users() {
	this._id = id;
}

users.prototype.me = function() {
	return this;
};